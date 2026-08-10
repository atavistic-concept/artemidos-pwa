/*
 * Artemidos - Bühlmann ZH-L16 with gradient factors
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT THIS IS.
 *
 * The Bühlmann ZH-L16 decompression model: sixteen theoretical tissue
 * compartments, each taking up and giving off nitrogen and helium at its own
 * rate, and each with a limit on how much supersaturation it will tolerate on
 * the way up. It is the model nearly every dive computer runs, and it is
 * published, which is why it can be written here honestly.
 *
 * THE COEFFICIENTS ARE COMPUTED, NOT COPIED. Bühlmann defines the ZH-L16A
 * limits by formula from the half-times:
 *
 *     a = 2 · t^(-1/3)        b = 1.005 - t^(-1/2)
 *
 * They are generated below from that formula rather than transcribed from a
 * table, because a transcribed table with one wrong digit still looks right.
 * The B and C variants hand-adjust a few compartments; this uses A, and the
 * conservatism you actually dive is set by the gradient factors rather than by
 * which variant is underneath.
 *
 * GRADIENT FACTORS. A gradient factor is how much of the way to the raw
 * Bühlmann limit you are willing to go. GF low applies at the deepest stop,
 * GF high at the surface, and the allowed supersaturation is interpolated
 * between them as you come up. GF 100/100 is raw Bühlmann and is not what
 * anybody dives; 30/70 is ordinary; 20/85 is the shape GUE-style ratio deco
 * ends up with. Lower is more conservative.
 *
 * WHAT THIS IS NOT. It is NOT the PADI RDP, the FFESSM MN90, the CMAS or the
 * US Navy tables. Those are specific published schedules and are not
 * reproduced here. Where their names appear in the app they select a gradient
 * factor pair that approximates that agency's conservatism, which is a
 * different thing and is labelled as such.
 */
(function (global) {
  'use strict';

  /* half-times in minutes */
  var HT_N2 = [4.0, 8.0, 12.5, 18.5, 27.0, 38.3, 54.3, 77.0,
               109.0, 146.0, 187.0, 239.0, 305.0, 390.0, 498.0, 635.0];
  var HT_HE = [1.51, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11,
               41.20, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03];

  /* Bühlmann's own formula, so nothing here depends on my transcription */
  function coeffs(ht) {
    var a = [], b = [], i;
    for (i = 0; i < ht.length; i++) {
      a.push(2 * Math.pow(ht[i], -1 / 3));
      b.push(1.005 - Math.pow(ht[i], -1 / 2));
    }
    return { a: a, b: b };
  }
  var CN = coeffs(HT_N2), CH = coeffs(HT_HE);
  var N = 16;

  var P_WV = 0.0627;          /* water vapour in the lung, bar, at 37 C */
  var LN2 = Math.log(2);

  /* ── a diver's tissue state ── */
  function Tissues(surfacePressure) {
    var p0 = (surfacePressure - P_WV) * 0.79;   /* saturated on air at the surface */
    this.n2 = []; this.he = [];
    for (var i = 0; i < N; i++) { this.n2.push(p0); this.he.push(0); }
  }
  Tissues.prototype.clone = function () {
    var t = Object.create(Tissues.prototype);
    t.n2 = this.n2.slice(); t.he = this.he.slice();
    return t;
  };

  /* Schreiner: a segment at constant rate of pressure change. rate is bar/min
     of ambient change (0 for a level segment). */
  Tissues.prototype.segment = function (pAmbStart, rateBarMin, minutes, fo2, fhe) {
    var fn2 = 1 - fo2 - fhe;
    if (fn2 < 0) fn2 = 0;
    for (var i = 0; i < N; i++) {
      this.n2[i] = schreiner(this.n2[i], (pAmbStart - P_WV) * fn2, rateBarMin * fn2, HT_N2[i], minutes);
      this.he[i] = schreiner(this.he[i], (pAmbStart - P_WV) * fhe, rateBarMin * fhe, HT_HE[i], minutes);
    }
  };
  function schreiner(p0, pi0, rate, ht, t) {
    var k = LN2 / ht;
    return pi0 + rate * (t - 1 / k) - (pi0 - p0 - rate / k) * Math.exp(-k * t);
  }

  /* combined M-value coefficients for the mixed inert load in one compartment */
  function ab(i, pn, ph) {
    var tot = pn + ph;
    if (tot <= 0) return { a: CN.a[i], b: CN.b[i] };
    return {
      a: (CN.a[i] * pn + CH.a[i] * ph) / tot,
      b: (CN.b[i] * pn + CH.b[i] * ph) / tot
    };
  }

  /* The shallowest ambient pressure this compartment tolerates right now, for a
     given gradient factor. Bühlmann: p_tol = (p_inert - a·gf) / (gf/b - gf + 1) */
  Tissues.prototype.ceilingBar = function (gf) {
    var worst = 0;
    for (var i = 0; i < N; i++) {
      var pn = this.n2[i], ph = this.he[i], tot = pn + ph;
      var c = ab(i, pn, ph);
      var tol = (tot - c.a * gf) / (gf / c.b - gf + 1);
      if (tol > worst) worst = tol;
    }
    return worst;
  };

  /* the leading compartment and how loaded each one is, for the display */
  Tissues.prototype.loading = function (pAmb, gf) {
    var out = [], lead = 0, leadPct = -1;
    for (var i = 0; i < N; i++) {
      var pn = this.n2[i], ph = this.he[i], tot = pn + ph;
      var c = ab(i, pn, ph);
      /* the raw Bühlmann limit at this ambient pressure */
      var mval = pAmb / c.b + c.a;
      var allowed = pAmb + gf * (mval - pAmb);
      var pct = allowed > pAmb ? (tot - pAmb) / (allowed - pAmb) * 100 : 0;
      if (pct < 0) pct = 0;
      out.push({ i: i + 1, ht: HT_N2[i], n2: pn, he: ph, total: tot, mvalue: mval, pct: pct });
      if (pct > leadPct) { leadPct = pct; lead = i; }
    }
    return { compartments: out, leading: lead + 1, leadingPct: leadPct };
  };

  /* ══ a planned dive ══════════════════════════════════════════════════════
     opts: { salt, alt, gfLo, gfHi, descent (m/min), ascent (m/min),
             segments: [{ depth, minutes, fo2, fhe }],
             deco: [{ fo2, fhe, maxDepth }]  gases available for the ascent }
  */
  function plan(opts) {
    var RHO = opts.salt === false ? 1000 : 1030, G = 9.80665;
    var bpm = RHO * G / 100000;
    var pSurf = surfacePressure(opts.alt || 0);
    var gfLo = (opts.gfLo == null ? 30 : opts.gfLo) / 100;
    var gfHi = (opts.gfHi == null ? 70 : opts.gfHi) / 100;
    var descRate = opts.descent || 20, ascRate = opts.ascent || 9;
    var pAt = function (d) { return pSurf + d * bpm; };

    var t = new Tissues(pSurf);
    var runtime = 0, depth = 0, i;
    var log = [];

    /* the bottom part of the dive, as given */
    for (i = 0; i < opts.segments.length; i++) {
      var s = opts.segments[i];
      var fo2 = s.fo2, fhe = s.fhe || 0;
      if (s.depth !== depth) {
        var dd = Math.abs(s.depth - depth);
        var rate = s.depth > depth ? descRate : ascRate;
        var mins = dd / rate;
        var rateBar = (s.depth > depth ? 1 : -1) * rate * bpm;
        t.segment(pAt(depth), rateBar, mins, fo2, fhe);
        runtime += mins;
        log.push({ kind: s.depth > depth ? 'descend' : 'ascend', from: depth, to: s.depth,
                   minutes: mins, runtime: runtime, fo2: fo2, fhe: fhe });
        depth = s.depth;
      }
      if (s.minutes > 0) {
        t.segment(pAt(depth), 0, s.minutes, fo2, fhe);
        runtime += s.minutes;
        log.push({ kind: 'level', depth: depth, minutes: s.minutes, runtime: runtime,
                   fo2: fo2, fhe: fhe });
      }
    }

    var bottomRuntime = runtime;
    var lastGas = opts.segments.length
      ? opts.segments[opts.segments.length - 1]
      : { fo2: 0.21, fhe: 0 };

    /* gases available on the way up, deepest-usable first */
    var gases = [{ fo2: lastGas.fo2, fhe: lastGas.fhe || 0, maxDepth: Infinity }];
    (opts.deco || []).forEach(function (g) { gases.push(g); });

    function bestGasAt(d) {
      var best = gases[0];
      for (var k = 0; k < gases.length; k++) {
        var g = gases[k];
        if (d <= (g.maxDepth == null ? Infinity : g.maxDepth)) {
          if (g.fo2 > best.fo2 || best.maxDepth === Infinity && g.fo2 > best.fo2) best = g;
          else if (best.maxDepth === Infinity && g.fo2 >= best.fo2) best = g;
        }
      }
      /* prefer the richest breathable mix at this depth */
      var rich = null;
      for (var j = 0; j < gases.length; j++) {
        var gg = gases[j];
        var md = gg.maxDepth == null ? Infinity : gg.maxDepth;
        if (d <= md && (!rich || gg.fo2 > rich.fo2)) rich = gg;
      }
      return rich || gases[0];
    }

    /* the first stop: round the ceiling up to the next 3 m */
    function ceilingDepth(gf) {
      var c = t.ceilingBar(gf);
      var d = (c - pSurf) / bpm;
      return d <= 0 ? 0 : d;
    }

    /* TWO DIFFERENT QUESTIONS, TWO DIFFERENT GRADIENT FACTORS.
       "Do I need to stop at all" is asked of GF HIGH, because it is the limit
       that governs arriving at the surface. Only once the answer is yes does
       GF LOW come in, and then only to set how deep the first stop is. Asking
       GF low the first question makes a 30 m dive on air call for deco after
       two minutes, which is wrong and was the first version of this. */
    var needsStop = ceilingDepth(gfHi) > 0;
    var firstStopDepth = needsStop ? Math.ceil(ceilingDepth(gfLo) / 3) * 3 : 0;
    if (needsStop && firstStopDepth <= 0) firstStopDepth = 3;
    var stops = [];

    if (firstStopDepth <= 0) {
      /* no-stop dive: straight up, but still walk it so the ascent is loaded */
      var upMin = depth / ascRate;
      var g0 = bestGasAt(depth);
      t.segment(pAt(depth), -ascRate * bpm, upMin, g0.fo2, g0.fhe || 0);
      runtime += upMin;
      log.push({ kind: 'ascend', from: depth, to: 0, minutes: upMin, runtime: runtime,
                 fo2: g0.fo2, fhe: g0.fhe || 0 });
      depth = 0;
    } else {
      var stopDepth = firstStopDepth;
      var firstStop = firstStopDepth;
      while (stopDepth > 0) {
        /* ascend to the stop */
        if (depth > stopDepth) {
          var am = (depth - stopDepth) / ascRate;
          var ga = bestGasAt(depth);
          t.segment(pAt(depth), -ascRate * bpm, am, ga.fo2, ga.fhe || 0);
          runtime += am;
          log.push({ kind: 'ascend', from: depth, to: stopDepth, minutes: am, runtime: runtime,
                     fo2: ga.fo2, fhe: ga.fhe || 0 });
          depth = stopDepth;
        }
        /* the gradient factor allowed at this stop, interpolated */
        var gfHere = firstStop > 0
          ? gfHi + (gfLo - gfHi) * (stopDepth / firstStop)
          : gfHi;
        var g = bestGasAt(depth);
        var held = 0;
        /* hold in whole minutes until the next shallower stop is allowed */
        while (held < 400) {
          var nextGf = firstStop > 0
            ? gfHi + (gfLo - gfHi) * ((stopDepth - 3) / firstStop)
            : gfHi;
          if (ceilingDepth(nextGf) <= stopDepth - 3 + 1e-9) break;
          t.segment(pAt(depth), 0, 1, g.fo2, g.fhe || 0);
          held += 1; runtime += 1;
        }
        if (held > 0) {
          stops.push({ depth: stopDepth, minutes: held, runtime: runtime,
                       fo2: g.fo2, fhe: g.fhe || 0 });
          log.push({ kind: 'stop', depth: stopDepth, minutes: held, runtime: runtime,
                     fo2: g.fo2, fhe: g.fhe || 0 });
        }
        stopDepth -= 3;
      }
      if (depth > 0) {
        var lm = depth / ascRate;
        var gl = bestGasAt(depth);
        t.segment(pAt(depth), -ascRate * bpm, lm, gl.fo2, gl.fhe || 0);
        runtime += lm;
        log.push({ kind: 'ascend', from: depth, to: 0, minutes: lm, runtime: runtime,
                   fo2: gl.fo2, fhe: gl.fhe || 0 });
        depth = 0;
      }
    }

    return {
      log: log,
      stops: stops,
      firstStop: firstStopDepth,
      bottomRuntime: bottomRuntime,
      runtime: runtime,
      decoTime: runtime - bottomRuntime,
      tissues: t,
      loading: t.loading(pSurf, gfHi),
      surfacePressure: pSurf,
      barPerMetre: bpm
    };
  }

  /* No-decompression limit at one depth on one gas, in whole minutes. Found by
     walking the clock rather than by a closed form, because the same routine
     that plans the dive then decides it, and two different answers from two
     different methods is how a tool starts lying to you. */
  function ndl(opts) {
    var maxMin = opts.max || 360;
    for (var m = 1; m <= maxMin; m++) {
      var r = plan({
        salt: opts.salt, alt: opts.alt, gfLo: opts.gfLo, gfHi: opts.gfHi,
        descent: opts.descent, ascent: opts.ascent,
        segments: [{ depth: opts.depth, minutes: m, fo2: opts.fo2, fhe: opts.fhe || 0 }],
        deco: []
      });
      if (r.firstStop > 0) return m - 1;
    }
    return maxMin;
  }

  function surfacePressure(altM) {
    if (!isFinite(altM) || altM <= 0) return 1.01325;
    return 1.01325 * Math.pow(1 - 2.25577e-5 * altM, 5.25588);
  }

  global.ArtDeco = {
    plan: plan,
    ndl: ndl,
    Tissues: Tissues,
    HT_N2: HT_N2,
    surfacePressure: surfacePressure
  };

})(typeof window !== 'undefined' ? window : this);
