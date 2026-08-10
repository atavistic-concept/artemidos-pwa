/*
 * Artemidos - HF grey-line propagation
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHY THE GREY LINE WORKS. Two ionospheric layers matter on HF and they behave
 * in opposite ways when the sun goes down. The D layer, low and dense, exists
 * only while the sun is shining on it, and it ABSORBS: it is what eats 160, 80
 * and 40 metres in daylight. The F layer, far higher, is what REFLECTS, and it
 * holds its charge for hours after sunset because the air up there is too thin
 * for the electrons to find an ion to recombine with.
 *
 * Along the terminator, the band of twilight sweeping round the earth, the D
 * layer has already collapsed while the F layer is still up. For a short while
 * a low-band signal reaches the F layer without paying the absorption toll, and
 * paths open that are shut the rest of the day. It cuts both ways: the same
 * window happens at dawn, with the D layer building rather than dying.
 *
 * WHAT IS COMPUTED HERE, AND WHAT IS NOT. The geometry is exact and entirely
 * offline: where the terminator lies, when it crosses you, which way it runs,
 * and whether a distant station is in its own twilight at the same moment.
 * The absorption model is physics with a known form, cos(chi)^0.75 / f^2, and
 * is given as an INDEX rather than in decibels, because the constant in front
 * of it depends on the state of the ionosphere on the day.
 *
 * What is NOT computed is the MUF. That needs the solar flux and the
 * geomagnetic state, which are measured by instruments in space and on the
 * ground and cannot be derived from a clock and a position. This app will not
 * invent them. If the operator knows the day's solar flux they can type it in
 * and get a rough figure; leave it blank and everything else still works, which
 * is most of what the grey line is about.
 */
(function (global) {
  'use strict';
  var A = global.A;

  var HF_BANDS = [
    { m: '160 m', f: 1.85 },
    { m: '80 m',  f: 3.65 },
    { m: '60 m',  f: 5.36 },
    { m: '40 m',  f: 7.10 },
    { m: '30 m',  f: 10.12 },
    { m: '20 m',  f: 14.20 },
    { m: '17 m',  f: 18.10 },
    { m: '15 m',  f: 21.20 },
    { m: '12 m',  f: 24.94 },
    { m: '10 m',  f: 28.40 }
  ];

  function render(host) {
    var N = global.NavMath;
    var st = A.store.get('radio.greyline', { lat: '', lon: '', tlat: '', tlon: '', sfi: '' });
    function save() { A.store.set('radio.greyline', st); }

    if (!global.ArtSun) { host.appendChild(A.UI.empty('Solar model unavailable.')); return; }

    function coord(v, isLon) {
      var x = A.parseNum(v);
      if (!isFinite(x) || Math.abs(x) > (isLon ? 180 : 90)) return NaN;
      return x;
    }
    function clockHM(min) {
      if (!isFinite(min)) return '-';
      min = ((min % 1440) + 1440) % 1440;
      var h = Math.floor(min / 60), m = Math.round(min % 60);
      if (m === 60) { m = 0; h = (h + 1) % 24; }
      return (h < 10 ? '0' : '') + h + 'h' + (m < 10 ? '0' : '') + m;
    }
    function brg(b) { return ('00' + Math.round(((b % 360) + 360) % 360)).slice(-3) + '°'; }
    function sun(date, la, lo) {
      var p = global.ArtSun.position(date, la, lo);
      return { alt: p.elevation, az: p.azimuth, noon: p.noonMinutes };
    }

    /* the minutes at which the sun crosses a given altitude, found by walking
       the day and bisecting each crossing. Polar cases return nothing, which is
       the right answer rather than a wrong number. */
    function crossings(day, la, lo, hDeg) {
      var res = [], prev = null, t;
      for (t = 0; t <= 1440; t += 4) {
        var e = sun(new Date(day.getTime() + t * 60000), la, lo).alt - hDeg;
        if (prev != null && ((prev.e < 0 && e >= 0) || (prev.e > 0 && e <= 0))) {
          var a = prev.t, b = t;
          for (var k = 0; k < 20; k++) {
            var mid = (a + b) / 2;
            var em = sun(new Date(day.getTime() + mid * 60000), la, lo).alt - hDeg;
            var ea = sun(new Date(day.getTime() + a * 60000), la, lo).alt - hDeg;
            if (ea * em <= 0) b = mid; else a = mid;
          }
          res.push({ t: (a + b) / 2, rising: e > prev.e });
        }
        prev = { t: t, e: e };
      }
      return res;
    }

    var card = A.UI.card();
    card.appendChild(A.el('.sec-lab', { text: 'Where you are' }));
    var pr = A.el('.split');
    pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));
    pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); } }));
    card.appendChild(pr);
    card.appendChild(A.el('button.btn.ghost.block', {
      text: 'Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (p) {
          st.lat = p.coords.latitude.toFixed(5);
          st.lon = p.coords.longitude.toFixed(5);
          save(); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); },
        { enableHighAccuracy: true, timeout: 15000 });
      }
    }));

    card.appendChild(A.el('.sec-lab', { text: 'Who you are trying to reach', style: { marginTop: '12px' } }));
    card.appendChild(A.el('p', {
      style: { margin: '2px 0 8px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'Optional. Give the far station and the page will say whether it is in its own ' +
            'twilight while you are in yours, which is the whole trick.'
    }));
    var tr = A.el('.split');
    tr.appendChild(A.UI.field({ decimalAt: 2, label: 'Their latitude', value: st.tlat, placeholder: '-33.86',
      oninput: function (e) { st.tlat = e.target.value; save(); calc(); } }));
    tr.appendChild(A.UI.field({ decimalAt: 3, label: 'Their longitude', value: st.tlon, placeholder: '151.21',
      oninput: function (e) { st.tlon = e.target.value; save(); calc(); } }));
    card.appendChild(tr);
    card.appendChild(A.UI.field({
      label: 'Solar flux index, if you know it', inputmode: 'decimal', value: st.sfi,
      placeholder: 'leave blank',
      hint: 'From a bulletin. Blank means no MUF is shown, because it cannot be derived offline.',
      oninput: function (e) { st.sfi = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);

    var out = A.el('div');
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var la = coord(st.lat, false), lo = coord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) {
        out.appendChild(A.UI.empty('Enter your latitude and longitude.'));
        return;
      }
      var now = new Date();
      var day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var nowMin = now.getHours() * 60 + now.getMinutes();

      /* ── the windows ──
         Sunrise and sunset at the standard -0.833 deg for the disc and
         refraction, and civil twilight at -6 deg. The grey-line window is taken
         as the horizon crossing plus and minus the civil-twilight span, so the
         width is derived from the latitude and the date rather than assumed:
         near the poles twilight lasts hours and the window really is that long. */
      var horiz = crossings(day, la, lo, -0.833);
      var civil = crossings(day, la, lo, -6);

      var wc = A.UI.card();
      wc.appendChild(A.el('.sec-lab', { text: 'Today’s grey line' }));
      if (!horiz.length) {
        var mid = sun(new Date(day.getTime() + 12 * 3600000), la, lo);
        wc.appendChild(A.UI.note(mid.alt > 0
          ? 'The sun does not set here today, so there is no grey line at all. This is polar ' +
            'summer: the D layer never goes away and the low bands stay shut around the clock.'
          : 'The sun does not rise here today. In polar night the D layer is absent all day, so ' +
            'the low bands are open continuously, which is better than a grey line rather than ' +
            'worse.'));
        out.appendChild(wc);
      } else {
        horiz.forEach(function (h) {
          var partner = null, bd = Infinity;
          civil.forEach(function (c) {
            var d = Math.abs(c.t - h.t);
            if (c.rising === h.rising && d < bd) { bd = d; partner = c; }
          });
          var span = partner ? Math.max(20, Math.abs(h.t - partner.t)) : 30;
          var from = h.t - span, to = h.t + span;
          var s = sun(new Date(day.getTime() + h.t * 60000), la, lo);
          var live = nowMin >= from && nowMin <= to;
          wc.appendChild(A.UI.metric(h.rising ? 'Sunrise window' : 'Sunset window',
            clockHM(from) + ' to ' + clockHM(to),
            { big: live,
              sub: (live ? 'OPEN NOW. ' : '') + 'sun on the horizon at ' + clockHM(h.t) +
                   ', bearing ' + brg(s.az) + ', window ' + Math.round(2 * span) + ' min' }));
          /* When the sun is on the horizon the terminator runs at right angles
             to it, so these two bearings ARE the grey line on the ground. */
          wc.appendChild(A.UI.metric('Point the antenna',
            brg(s.az + 90) + '  or  ' + brg(s.az - 90),
            { sub: 'along the terminator, both ways. The sun itself is at ' + brg(s.az) +
                   ', which is across the path, not down it' }));
        });
        out.appendChild(wc);
      }

      /* ── absorption now, band by band ──
         D-layer absorption goes as cos(chi)^0.75 / f^2, chi being the sun's
         angle from overhead. Below the horizon the layer is gone and the term is
         zero. Shown as an index against 40 m at local noon, a reference every
         operator has felt for themselves. */
      var s0 = sun(now, la, lo);
      var chi = 90 - s0.alt;
      var sunFactor = s0.alt > 0 ? Math.pow(Math.cos(chi * Math.PI / 180), 0.75) : 0;
      var noonSun = sun(new Date(day.getTime() + s0.noon * 60000), la, lo);
      var noonFactor = noonSun.alt > 0 ? Math.pow(Math.cos((90 - noonSun.alt) * Math.PI / 180), 0.75) : 0;
      var refAbs = noonFactor / (7.1 * 7.1);

      var ac = A.UI.card();
      ac.appendChild(A.el('.sec-lab', { text: 'D-layer absorption right now' }));
      ac.appendChild(A.UI.metric('Sun', s0.alt > 0
        ? A.fmtNum(s0.alt, 1) + '° above the horizon'
        : A.fmtNum(-s0.alt, 1) + '° below the horizon',
        { sub: s0.alt > 0 ? 'the D layer is up and absorbing' : 'the D layer has gone' }));
      HF_BANDS.forEach(function (b) {
        var abs = sunFactor / (b.f * b.f);
        var rel = refAbs > 0 ? abs / refAbs : 0;
        var verdict;
        if (abs === 0) verdict = 'no D-layer loss at all';
        else if (rel > 0.6) verdict = 'heavily absorbed';
        else if (rel > 0.25) verdict = 'lossy';
        else if (rel > 0.08) verdict = 'usable';
        else verdict = 'little loss';
        ac.appendChild(A.UI.metric(b.m + '   ' + A.fmtNum(b.f, 2) + ' MHz',
          abs === 0 ? '0.00' : A.fmtNum(rel, 2),
          { sub: verdict + (abs === 0 ? '' : ', against 1.00 for 40 m at noon here') }));
      });
      out.appendChild(ac);

      /* ── what to set the radio to ── */
      var pick;
      if (s0.alt <= 0) {
        pick = { m: '80 m or 160 m', why: 'the D layer has gone, so the lowest bands are open, and that is where the long night paths live' };
      } else if (s0.alt < 6) {
        pick = { m: '40 m, then down to 80 m as it darkens', why: 'you are in the grey line itself: 40 m is open now and the lower bands follow it down' };
      } else if (s0.alt < 20) {
        pick = { m: '30 m or 20 m', why: 'the D layer is building or dying; the middle bands carry while the low ones are still shut' };
      } else {
        pick = { m: '20 m, 17 m or 15 m', why: 'full daylight absorbs nearly everything below about 10 MHz' };
      }

      var cc = A.UI.card();
      cc.appendChild(A.el('.sec-lab', { text: 'Set the radio like this' }));
      cc.appendChild(A.UI.metric('Band', pick.m, { big: true, sub: pick.why }));
      cc.appendChild(A.UI.metric('Mode', 'CW, or SSB if you must',
        { sub: 'CW gets through several dB of path that SSB does not, and the window is too short to waste' }));
      cc.appendChild(A.UI.metric('Take-off angle', 'as low as you can get it',
        { sub: 'grey-line paths are long and want a low angle: a vertical over good ground, or a dipole high in wavelengths, not a low one' }));
      cc.appendChild(A.UI.metric('Antenna direction',
        horiz.length ? 'along the terminator, per the bearings above' : 'no preferred direction today',
        { sub: 'a beam pointed down the grey line beats more power pointed across it' }));
      cc.appendChild(A.UI.metric('Power', 'the least that works',
        { sub: 'when the window is open it is open; when it is shut, power does not open it. Save the battery' }));
      cc.appendChild(A.UI.note(
        'Be tuned, called and listening BEFORE the window opens, not during it. Twenty minutes ' +
        'is a normal length and half of it goes on setting up.'));
      out.appendChild(cc);

      /* ── the far station ── */
      var tla = coord(st.tlat, false), tlo = coord(st.tlon, true);
      if (isFinite(tla) && isFinite(tlo) && N) {
        var gc = N.greatCircle(la, lo, tla, tlo);
        var km = gc.distance * 1.852;
        var tc = A.UI.card();
        tc.appendChild(A.el('.sec-lab', { text: 'The path to them' }));
        tc.appendChild(A.UI.metric('Short path', brg(gc.bearing) + '   ' + A.fmtNum(km, 0) + ' km',
          { big: true, sub: 'great circle, true bearing' }));
        tc.appendChild(A.UI.metric('Long path', brg(gc.bearing + 180) + '   ' + A.fmtNum(40075 - km, 0) + ' km',
          { sub: 'the other way round the world. On the grey line this is often the better one' }));
        var them = sun(now, tla, tlo);
        tc.appendChild(A.UI.metric('Sun at their end',
          them.alt > 0 ? A.fmtNum(them.alt, 1) + '° up' : A.fmtNum(-them.alt, 1) + '° down',
          { sub: them.alt > 0 ? 'daylight there' : 'darkness there' }));

        /* the prize: both ends inside civil twilight at the same moment */
        var start = null, end = null, t;
        for (t = 0; t <= 1440; t += 5) {
          var d2 = new Date(day.getTime() + t * 60000);
          var both = Math.abs(sun(d2, la, lo).alt) <= 6 && Math.abs(sun(d2, tla, tlo).alt) <= 6;
          if (both && start == null) start = t;
          if (both) end = t;
          if (!both && start != null) break;
        }
        if (start != null) {
          tc.appendChild(A.UI.metric('BOTH ends in twilight', clockHM(start) + ' to ' + clockHM(end),
            { big: true, sub: 'this is the grey-line opening to them. Be on frequency before it starts' }));
        } else {
          tc.appendChild(A.UI.note(
            'There is no moment today when both ends sit in twilight together, so there is no true ' +
            'grey-line path to this station. Work them on a band that suits the daylight or the ' +
            'darkness they are actually in, or wait: the terminator swings through the year and a ' +
            'path that is impossible in June can be routine in September.'));
        }
        out.appendChild(tc);
      }

      /* ── MUF, only if the operator supplied the flux ── */
      var sfi = A.parseNum(st.sfi);
      var mc = A.UI.card();
      mc.appendChild(A.el('.sec-lab', { text: 'Maximum usable frequency' }));
      if (isFinite(sfi) && sfi >= 60 && sfi <= 300) {
        /* a coarse critical-frequency model: foF2 rises with the flux and with
           the sun on the layer, and the MUF over a long hop is roughly three
           times foF2 */
        var foF2 = 2.5 + 0.045 * (sfi - 60) + 3.2 * Math.max(0, Math.cos(chi * Math.PI / 180));
        var muf = foF2 * 3.0;
        mc.appendChild(A.UI.metric('foF2, estimated', A.fmtNum(foF2, 1) + ' MHz',
          { sub: 'critical frequency straight up' }));
        mc.appendChild(A.UI.metric('MUF over a 3000 km hop', A.fmtNum(muf, 1) + ' MHz',
          { big: true, sub: 'work at about 85 per cent of it, so near ' + A.fmtNum(muf * 0.85, 1) + ' MHz' }));
        mc.appendChild(A.UI.note(
          'A COARSE model built from the one number you typed. It knows nothing about the ' +
          'geomagnetic field, about a storm in progress, or about where the path actually runs. ' +
          'Take it as an order of magnitude and let the band tell you the truth.'));
      } else {
        mc.appendChild(A.UI.note(
          'No MUF is shown, and that is not an omission. The maximum usable frequency depends on ' +
          'the solar flux and the geomagnetic state, both measured by instruments, neither ' +
          'derivable from a clock and a position. Type today’s solar flux index above if you ' +
          'have heard it and a rough figure appears. Everything else on this page is geometry and ' +
          'needs nothing from outside.'));
      }
      out.appendChild(mc);

      out.appendChild(A.UI.note(
        'The grey line is a tendency, not a timetable. It is strongest on 160, 80 and 40 metres, ' +
        'strongest again near the equinoxes when the terminator runs closest to north-south, and it ' +
        'can be spoiled outright by a geomagnetic storm. Listen first: the band is the only ' +
        'instrument that measures the band.'));
    }
    calc();
  }

  global.ArtGreyline = { render: render };

})(window);
