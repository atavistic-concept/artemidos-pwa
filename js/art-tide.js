/*
 * Artemidos - offline harmonic tide prediction.
 *
 * A faithful port of the Schureman / pytides method (as implemented in
 * ryan-lang/tides): the tide height at a station is the sum over harmonic
 * constituents of  amplitude * f * cos(V + u - g),  where V is the equilibrium
 * argument, u and f the nodal correction and factor, and g the Greenwich phase
 * lag. The astronomy is computed from the date, so a station's height can be
 * predicted for any date, past or future, with no network. Constants per
 * station come from NOAA CO-OPS public-domain data (see tide-data.js).
 *
 * Copyright (c) 2026 Atavistic Concept.
 */
(function (global) {
  'use strict';
  var RAD = Math.PI / 180, DEGp = 180 / Math.PI;
  var JCDH = 1 / (24 * 365.25 * 100);   /* Julian-centuries -> deg per hour */

  function mod(a, b) { return ((a % b) + b) % b; }
  function dot(a, b) { var r = 0; for (var i = 0; i < a.length; i++) r += a[i] * b[i]; return r; }

  /* mean-longitude polynomials (deg, argument = Julian centuries from J2000) */
  var H  = [280.46645, 36000.76983, 0.0003032];
  var S  = [218.3164591, 481267.88134236, -0.0013268, 1 / 538841.0 - 1 / 65194000.0];
  var P  = [83.353243, 4069.0137111, -0.0103238, -1 / 80053.0, 1 / 18999000.0];
  var NN = [125.044555, -1934.1361849, 0.0020762, 1 / 467410.0, -1 / 60616000.0];
  var PP = [280.46645 - 357.5291, 36000.76932 - 35999.0503, 0.0003032 + 0.0001559, 0.00000048];
  var INC = [5.145];
  var OMEGA = (function () {
    var raw = [[23, 26, 21.448], [0, 0, -4680.93], [0, 0, -1.55], [0, 0, 1999.25],
      [0, 0, -51.38], [0, 0, -249.67], [0, 0, -39.05], [0, 0, 7.12], [0, 0, 27.87],
      [0, 0, 5.79], [0, 0, 2.45]];
    return raw.map(function (v, i) { return (v[0] + v[1] / 60 + v[2] / 3600) * Math.pow(1e-2, i); });
  })();

  function poly(c, x) { var r = 0; for (var i = c.length - 1; i >= 0; i--) r = r * x + c[i]; return r; }
  function dpoly(c, x) { if (c.length === 1) return 0; var r = 0; for (var i = c.length - 1; i > 0; i--) r = r * x + i * c[i]; return r; }

  function inclinationAngle(N, i, om) {
    N *= RAD; i *= RAD; om *= RAD;
    return DEGp * Math.acos(Math.cos(i) * Math.cos(om) - Math.sin(i) * Math.sin(om) * Math.cos(N));
  }
  function lunarElongation(N, i, om) {   /* xi */
    N *= RAD; i *= RAD; om *= RAD;
    var e1 = Math.atan((Math.cos(0.5 * (om - i)) / Math.cos(0.5 * (om + i))) * Math.tan(0.5 * N)) - 0.5 * N;
    var e2 = Math.atan((Math.sin(0.5 * (om - i)) / Math.sin(0.5 * (om + i))) * Math.tan(0.5 * N)) - 0.5 * N;
    return -(e1 + e2) * DEGp;
  }
  function solarAnomaly(N, i, om) {      /* nu */
    N *= RAD; i *= RAD; om *= RAD;
    var e1 = Math.atan((Math.cos(0.5 * (om - i)) / Math.cos(0.5 * (om + i))) * Math.tan(0.5 * N)) - 0.5 * N;
    var e2 = Math.atan((Math.sin(0.5 * (om - i)) / Math.sin(0.5 * (om + i))) * Math.tan(0.5 * N)) - 0.5 * N;
    return (e1 - e2) * DEGp;
  }
  function lunarPerigeeAnomaly(N, i, om) {   /* nup */
    var I = RAD * inclinationAngle(N, i, om), nu = RAD * solarAnomaly(N, i, om);
    return DEGp * Math.atan((Math.sin(2 * I) * Math.sin(nu)) / (Math.sin(2 * I) * Math.cos(nu) + 0.3347));
  }
  function solarPerigeeAnomaly(N, i, om) {   /* nupp */
    var I = RAD * inclinationAngle(N, i, om), nu = RAD * solarAnomaly(N, i, om);
    var t = (Math.pow(Math.sin(I), 2) * Math.sin(2 * nu)) / (Math.pow(Math.sin(I), 2) * Math.cos(2 * nu) + 0.0727);
    return DEGp * 0.5 * Math.atan(t);
  }

  /* build the astronomical state for a date (UTC) */
  function astroFor(date) {
    var JD = date.getTime() / 86400000 + 2440587.5;
    var T = (JD - 2451545.0) / 36525;
    function val(c) { return mod(poly(c, T), 360); }
    function sp(c) { return dpoly(c, T) * JCDH; }
    var s = val(S), sS = sp(S), h = val(H), hS = sp(H), p = val(P), pS = sp(P);
    var N = val(NN), NS = sp(NN), pp = val(PP), ppS = sp(PP);
    var om = val(OMEGA), inc = 5.145;
    var ha = mod((JD - Math.floor(JD)) * 360, 360), haS = 15;
    var ths = ha + h - s, thsS = haS + hS - sS;
    var xi = lunarElongation(N, inc, om), nu = solarAnomaly(N, inc, om);
    return {
      vals: [ths, s, h, p, N, pp, 90], sps: [thsS, sS, hS, pS, NS, ppS, 0],
      I: inclinationAngle(N, inc, om), xi: xi, nu: nu,
      nup: lunarPerigeeAnomaly(N, inc, om), nupp: solarPerigeeAnomaly(N, inc, om),
      P: p - mod(xi, 360), om: om, inc: inc
    };
  }

  /* form factors f (Schureman) */
  function fUnity() { return 1; }
  function fMm(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    var mean = (2 / 3 - Math.pow(Math.sin(om), 2)) * (1 - 1.5 * Math.pow(Math.sin(i), 2));
    return (2 / 3 - Math.pow(Math.sin(I), 2)) / mean; }
  function fMf(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    return Math.pow(Math.sin(I), 2) / (Math.pow(Math.sin(om), 2) * Math.pow(Math.cos(0.5 * i), 4)); }
  function fO1(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    var mean = Math.sin(om) * Math.pow(Math.cos(0.5 * om), 2) * Math.pow(Math.cos(0.5 * i), 4);
    return Math.sin(I) * Math.pow(Math.cos(0.5 * I), 2) / mean; }
  function fJ1(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    return Math.sin(2 * I) / (Math.sin(2 * om) * (1 - 1.5 * Math.pow(Math.sin(i), 2))); }
  function fOO1(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    var mean = Math.sin(om) * Math.pow(Math.sin(0.5 * om), 2) * Math.pow(Math.cos(0.5 * i), 4);
    return Math.sin(I) * Math.pow(Math.sin(0.5 * I), 2) / mean; }
  function fM2(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I;
    return Math.pow(Math.cos(0.5 * I), 4) / (Math.pow(Math.cos(0.5 * om), 4) * Math.pow(Math.cos(0.5 * i), 4)); }
  function fK1(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I, nu = RAD * a.nu;
    var mean = 0.5023 * Math.sin(2 * om) * (1 - 1.5 * Math.pow(Math.sin(i), 2)) + 0.1681;
    return Math.pow(0.2523 * Math.pow(Math.sin(2 * I), 2) + 0.1689 * Math.sin(2 * I) * Math.cos(nu) + 0.0283, 0.5) / mean; }
  function fL2(a) { var P2 = RAD * a.P, I = RAD * a.I;
    var rInv = Math.pow(1 - 12 * Math.pow(Math.tan(0.5 * I), 2) * Math.cos(2 * P2) + 36 * Math.pow(Math.tan(0.5 * I), 4), 0.5);
    return fM2(a) * rInv; }
  function fK2(a) { var om = RAD * a.om, i = RAD * a.inc, I = RAD * a.I, nu = RAD * a.nu;
    var mean = 0.5023 * Math.pow(Math.sin(om), 2) * (1 - 1.5 * Math.pow(Math.sin(i), 2)) + 0.0365;
    return Math.pow(0.2523 * Math.pow(Math.sin(I), 4) + 0.0367 * Math.pow(Math.sin(I), 2) * Math.cos(2 * nu) + 0.0013, 0.5) / mean; }
  function fM1(a) { var P2 = RAD * a.P, I = RAD * a.I;
    var qInv = Math.pow(0.25 + 1.5 * Math.cos(I) * Math.cos(2 * P2) * Math.pow(Math.cos(0.5 * I), -0.5) +
      2.25 * Math.pow(Math.cos(I), 2) * Math.pow(Math.cos(0.5 * I), -4), 0.5);
    return fO1(a) * qInv; }
  function fModd(a, n) { return Math.pow(fM2(a), n / 2); }

  /* nodal corrections u (deg) */
  function uZero() { return 0; }
  function uMf(a) { return -2 * a.xi; }
  function uO1(a) { return 2 * a.xi - a.nu; }
  function uJ1(a) { return -a.nu; }
  function uOO1(a) { return -2 * a.xi - a.nu; }
  function uM2(a) { return 2 * a.xi - 2 * a.nu; }
  function uK1(a) { return -a.nup; }
  function uL2(a) { var I = RAD * a.I, P2 = RAD * a.P;
    var R = DEGp * Math.atan(Math.sin(2 * P2) / ((1 / 6) * Math.pow(Math.tan(0.5 * I), -2) - Math.cos(2 * P2)));
    return 2 * a.xi - 2 * a.nu - R; }
  function uK2(a) { return -2 * a.nupp; }
  function uM1(a) { var I = RAD * a.I, P2 = RAD * a.P;
    var Q = DEGp * Math.atan(((5 * Math.cos(I) - 1) / (7 * Math.cos(I) + 1)) * Math.tan(P2));
    return a.xi - a.nu + Q; }
  function uModd(a, n) { return (n / 2) * uM2(a); }

  /* simple constituents: [Doodson coefficients], u fn, f fn */
  var SIMPLE = {
    Z0:  [[0, 0, 0, 0, 0, 0, 0], uZero, fUnity],
    SA:  [[0, 0, 1, 0, 0, 0, 0], uZero, fUnity],
    SSA: [[0, 0, 2, 0, 0, 0, 0], uZero, fUnity],
    MM:  [[0, 1, 0, -1, 0, 0, 0], uZero, fMm],
    MF:  [[0, 2, 0, 0, 0, 0, 0], uMf, fMf],
    Q1:  [[1, -2, 0, 1, 0, 0, 1], uO1, fO1],
    O1:  [[1, -1, 0, 0, 0, 0, 1], uO1, fO1],
    K1:  [[1, 1, 0, 0, 0, 0, -1], uK1, fK1],
    J1:  [[1, 2, 0, -1, 0, 0, -1], uJ1, fJ1],
    M1:  [[1, 0, 0, 0, 0, 0, 1], uM1, fM1],
    P1:  [[1, 1, -2, 0, 0, 0, 1], uZero, fUnity],
    S1:  [[1, 1, -1, 0, 0, 0, 0], uZero, fUnity],
    OO1: [[1, 3, 0, 0, 0, 0, -1], uOO1, fOO1],
    '2N2': [[2, -2, 0, 2, 0, 0, 0], uM2, fM2],
    N2:  [[2, -1, 0, 1, 0, 0, 0], uM2, fM2],
    NU2: [[2, -1, 2, -1, 0, 0, 0], uM2, fM2],
    M2:  [[2, 0, 0, 0, 0, 0, 0], uM2, fM2],
    LAM2: [[2, 1, -2, 1, 0, 0, 2], uM2, fM2],
    L2:  [[2, 1, 0, -1, 0, 0, 2], uL2, fL2],
    T2:  [[2, 2, -3, 0, 0, 1, 0], uZero, fUnity],
    S2:  [[2, 2, -2, 0, 0, 0, 0], uZero, fUnity],
    R2:  [[2, 2, -1, 0, 0, -1, 2], uZero, fUnity],
    K2:  [[2, 2, 0, 0, 0, 0, 0], uK2, fK2],
    M3:  [[3, 0, 0, 0, 0, 0, 0], function (a) { return uModd(a, 3); }, function (a) { return fModd(a, 3); }]
  };
  /* compound constituents: [members[name,factor]] */
  var COMPOUND = {
    MSF: [['S2', 1], ['M2', -1]],
    '2Q1': [['N2', 1], ['J1', -1]],
    RHO: [['NU2', 1], ['K1', -1]],
    MU2: [['M2', 2], ['S2', -1]],
    '2SM2': [['S2', 2], ['M2', -1]],
    '2MK3': [['M2', 1], ['O1', 1]],
    MK3: [['M2', 1], ['K1', 1]],
    MN4: [['M2', 1], ['N2', 1]],
    M4:  [['M2', 2]],
    MS4: [['M2', 1], ['S2', 1]],
    S4:  [['S2', 2]],
    M6:  [['M2', 3]],
    S6:  [['S2', 3]],
    M8:  [['M2', 4]]
  };

  function partV(name, a) { return dot(SIMPLE[name][0], a.vals); }
  function partU(name, a) { return SIMPLE[name][1](a); }
  function partF(name, a) { return SIMPLE[name][2](a); }

  /* height (m, relative to mean sea level) for a station at a date */
  function predictMSL(station, date) {
    var a = astroFor(date), h = 0, cons = station.cons, name, amp, g, V, u, f, m, mm;
    for (name in cons) {
      if (!cons.hasOwnProperty(name)) continue;
      amp = cons[name][0]; g = cons[name][1];
      if (SIMPLE[name]) {
        V = partV(name, a); u = partU(name, a); f = partF(name, a);
      } else if (COMPOUND[name]) {
        m = COMPOUND[name]; V = 0; u = 0; f = 1;
        for (var k = 0; k < m.length; k++) {
          mm = m[k];
          V += mm[1] * partV(mm[0], a);
          u += mm[1] * partU(mm[0], a);
          f *= Math.pow(partF(mm[0], a), Math.abs(mm[1]));
        }
      } else { continue; }
      h += amp * f * Math.cos(RAD * (V + u - g));
    }
    return h;
  }

  /* height above chart datum (MLLW), the figure a tide table gives */
  function predict(station, date) { return predictMSL(station, date) + (station.z0 || 0); }

  function stations() { return global.ART_TIDE_STATIONS || []; }
  function nearest(lat, lon) {
    var best = null, bd = Infinity, list = stations();
    for (var i = 0; i < list.length; i++) {
      var s = list[i], dLa = (s.lat - lat), dLo = (s.lon - lon) * Math.cos(lat * RAD);
      var d = dLa * dLa + dLo * dLo;
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { station: best, deg: Math.sqrt(bd) } : null;
  }

  /* a day of predictions from a local-midnight Date: samples + high/low turns */
  function day(station, midnight, stepMin) {
    stepMin = stepMin || 10;
    var samples = [], t, ms = midnight.getTime();
    for (t = 0; t <= 1440; t += stepMin) samples.push({ t: t, h: predict(station, new Date(ms + t * 60000)) });
    /* refine extrema to the minute */
    var ex = [];
    for (var i = 1; i < samples.length - 1; i++) {
      var a = samples[i - 1].h, b = samples[i].h, c = samples[i + 1].h;
      if ((b > a && b >= c) || (b < a && b <= c)) {
        var bt = samples[i].t, bh = b;
        for (var m = -stepMin + 1; m < stepMin; m++) {
          var tt = samples[i].t + m; if (tt < 0 || tt > 1440) continue;
          var hh = predict(station, new Date(ms + tt * 60000));
          if ((b > a && hh > bh) || (b < a && hh < bh)) { bh = hh; bt = tt; }
        }
        ex.push({ t: bt, h: bh, hi: (b > a) });
      }
    }
    return { samples: samples, extrema: ex };
  }

  /* ══ astronomical tide, for ports with no harmonic constants ═════════════

     WHAT IS AND IS NOT KNOWABLE WITHOUT LOCAL CONSTANTS.

     The tide is driven by the moon and the sun, and the app already computes
     both offline to arc-minute accuracy. From that alone, two things fall out
     and are right anywhere on earth:

       WHEN. High water follows the moon's meridian passage by a delay that is
       almost constant for a given port. Get the transit right and you have the
       shape of the day: two highs and two lows, about 12h25m apart, sliding
       later by roughly 50 minutes a day exactly as the moon does.

       HOW BIG, RELATIVELY. Springs and neaps come from the angle between the
       moon and the sun, so the phase of the moon gives the spring-neap state
       directly, and perigee/apogee modulates it further.

     What does NOT fall out is the local delay itself, or the range in metres.
     Both are set by the shape of the basin the water is sloshing in: the
     Severn is not the Mediterranean. That is a measured property of a place,
     not a calculable one, and no amount of astronomy recovers it.

     So this engine computes everything astronomy gives, and takes the two local
     numbers from the user ONCE. Observe a single high water at a port and the
     app has that port's delay for good; type its spring and neap ranges off a
     chart or a pilot and it has the scale. Both are stored on the device. From
     then on the port predicts offline, forever, with no network and no
     harmonics, and it says plainly which parts are astronomy and which came
     from the number you gave it. Before it is calibrated it shows times of
     moon transit and the spring-neap state, and refuses to state a height.

     Accuracy, stated honestly: with a good observed interval this lands high
     water within roughly 20-30 minutes on an open coast, and worse in a river
     or an estuary where the delay itself changes with the range. It is a
     backup, not a substitute for the harmonic stations or a printed table. */

  var MOON_DAY_MIN = 1490.0;      /* mean interval between moon transits */
  var SEMI_MIN = 1490.0 / 2;      /* mean interval, high water to high water */

  function moonAlt(date, lat, lon) {
    try { return global.ArtEphem.moonPosition(date, lat, lon).alt; } catch (e) { return null; }
  }

  /* Moon meridian passages during the local day, found by walking the altitude
     curve and keeping its turning points. Upper transit is the higher of the
     two and is the one the tide follows; the lower one gives the other pair of
     tides. Works at any latitude, including where the moon never rises, which
     is why it is done by altitude rather than by hour angle alone. */
  function moonTransits(midnight, lat, lon) {
    var ms = midnight.getTime(), step = 10, prev = null, prev2 = null, list = [];
    for (var t = -180; t <= 1620; t += step) {
      var a = moonAlt(new Date(ms + t * 60000), lat, lon);
      if (a == null) return [];
      if (prev2 != null && prev > prev2 && prev >= a) {
        /* refine the turning point to the minute */
        var bt = t - step, ba = prev;
        for (var m = -step + 1; m < step; m++) {
          var aa = moonAlt(new Date(ms + (t - step + m) * 60000), lat, lon);
          if (aa != null && aa > ba) { ba = aa; bt = t - step + m; }
        }
        list.push({ t: bt, alt: ba, upper: true });
      }
      prev2 = prev; prev = a;
    }
    /* the lower transits sit half a moon-day from the upper ones */
    var all = [];
    for (var i = 0; i < list.length; i++) {
      all.push(list[i]);
      all.push({ t: list[i].t + MOON_DAY_MIN / 2, alt: null, upper: false });
      all.push({ t: list[i].t - MOON_DAY_MIN / 2, alt: null, upper: false });
    }
    all.sort(function (a, b) { return a.t - b.t; });
    return all;
  }

  /* Spring-neap coefficient from the moon-sun elongation, 0 at neaps and 1 at
     springs. The lunar tide is roughly twice the solar one, so the two add at
     new and full moon and fight at the quarters; cos(2 x elongation) is the
     shape of that, and it is why springs come twice a lunar month rather than
     once. Perigee is not modelled here: it would need the moon's distance,
     which the app's low-order lunar theory does not carry to useful accuracy. */
  function springNeap(date) {
    var ph;
    try { ph = global.ArtEphem.moonPhase(date); } catch (e) { return null; }
    var el = ph.age * RAD;                      /* 0 new, 180 full */
    var f = (1 + Math.cos(2 * el)) / 2;         /* 1 at new and full, 0 at the quarters */
    return {
      coeff: f,
      phaseName: ph.name,
      illum: ph.illum,
      /* the usual language: springs within a couple of days of new or full */
      state: f > 0.8 ? 'springs' : (f < 0.2 ? 'neaps' : (f >= 0.5 ? 'towards springs' : 'towards neaps'))
    };
  }

  /* A day of tides for a directory port. cal is what the user has given us:
     { hwi: minutes after moon transit, spr: mean spring range m, npr: mean neap
       range m, z0: height of mean sea level above datum m }
     Anything missing simply drops out of the answer rather than being guessed. */
  function astroDay(port, midnight, cal) {
    cal = cal || {};
    var tr = moonTransits(midnight, port.lat, port.lon);
    if (!tr.length) return null;
    var sn = springNeap(new Date(midnight.getTime() + 12 * 3600000));
    var hwi = isFinite(cal.hwi) ? cal.hwi : null;

    var range = null;
    if (sn && isFinite(cal.spr) && isFinite(cal.npr)) {
      range = cal.npr + (cal.spr - cal.npr) * sn.coeff;
    }

    var ev = [];
    if (hwi != null) {
      for (var i = 0; i < tr.length; i++) {
        var hw = tr[i].t + hwi;
        ev.push({ t: hw, hi: true });
        ev.push({ t: hw + SEMI_MIN / 2, hi: false });
      }
      ev = ev.filter(function (e) { return e.t >= 0 && e.t < 1440; })
             .sort(function (a, b) { return a.t - b.t; });
      /* drop anything that landed on top of its neighbour */
      var clean = [];
      for (var j = 0; j < ev.length; j++) {
        if (!clean.length || ev[j].t - clean[clean.length - 1].t > 90) clean.push(ev[j]);
      }
      ev = clean;
      /* Absolute heights need a datum as well as a range. Without one, guessing
         that mean level sits half a range above chart datum would print a low
         water of exactly 0.00 m, which reads as a measured fact and is not one.
         So heights appear only when the user has supplied mean sea level; the
         range on its own is still given, and the range is the number that
         actually decides whether the boat floats. */
      if (range != null && isFinite(cal.z0)) {
        ev.forEach(function (e) { e.h = cal.z0 + (e.hi ? 1 : -1) * range / 2; });
      }
    }

    /* The curve. Between one high water and the next the water rises and falls
       close enough to a cosine for a backup tool, so once the times are known
       the shape is known too. It is drawn in RELATIVE units when no range has
       been entered, because the shape is the useful part: it says whether the
       water is making or taking off and how long you have, which is what you
       actually want to see, and it says it without inventing a height. */
    var samples = null;
    if (hwi != null && ev.length) {
      var t0 = null;
      for (var q = 0; q < ev.length; q++) { if (ev[q].hi) { t0 = ev[q].t; break; } }
      if (t0 == null) t0 = ev[0].t - SEMI_MIN / 2;
      samples = [];
      for (var tt = 0; tt <= 1440; tt += 10) {
        var r = Math.cos(2 * Math.PI * (tt - t0) / SEMI_MIN);
        var s = { t: tt, r: r };
        if (range != null && isFinite(cal.z0)) s.h = cal.z0 + r * range / 2;
        else if (range != null) s.h = null;
        samples.push(s);
      }
    }

    return { transits: tr.filter(function (x) { return x.t >= 0 && x.t < 1440; }),
             springNeap: sn, events: ev, range: range, samples: samples,
             hasHeights: range != null && isFinite(cal.z0),
             calibrated: hwi != null };
  }

  /* Turn one observed high water into the port's delay. This is the whole
     calibration: the number wanted is the gap between the moon crossing the
     meridian and the water actually topping out, and one clean observation
     gives it. Averaged with anything already stored, so a second and third
     observation tighten it rather than replace it. */
  function calibrateHW(port, observed, oldHwi, nObs) {
    var mid = new Date(observed.getFullYear(), observed.getMonth(), observed.getDate());
    var tr = moonTransits(mid, port.lat, port.lon);
    if (!tr.length) return null;
    var obsMin = observed.getHours() * 60 + observed.getMinutes();
    /* the transit this high water belongs to is the most recent one before it,
       allowing for a delay that can exceed twelve hours in some ports */
    var best = null, bd = Infinity;
    for (var i = 0; i < tr.length; i++) {
      var d = obsMin - tr[i].t;
      while (d < 0) d += MOON_DAY_MIN;
      while (d >= SEMI_MIN) d -= SEMI_MIN;
      if (Math.abs(d) < bd) { bd = Math.abs(d); best = d; }
    }
    if (best == null) return null;
    var n = (nObs || 0);
    if (isFinite(oldHwi) && n > 0) {
      /* average on the circle, since the interval wraps at the semidiurnal period */
      var a1 = oldHwi / SEMI_MIN * 2 * Math.PI, a2 = best / SEMI_MIN * 2 * Math.PI;
      var x = n * Math.cos(a1) + Math.cos(a2), y = n * Math.sin(a1) + Math.sin(a2);
      var m = Math.atan2(y, x) / (2 * Math.PI) * SEMI_MIN;
      while (m < 0) m += SEMI_MIN;
      return { hwi: m, n: n + 1 };
    }
    return { hwi: best, n: 1 };
  }

  function directory() { return global.ART_PORT_DIRECTORY || []; }

  global.ArtTide = {
    predict: predict, predictMSL: predictMSL, stations: stations,
    nearest: nearest, day: day,
    directory: directory, astroDay: astroDay, calibrateHW: calibrateHW,
    springNeap: springNeap, moonTransits: moonTransits, SEMI_MIN: SEMI_MIN
  };
})(window);
