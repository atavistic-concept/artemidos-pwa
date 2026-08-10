/*
 * Artemidos - Navigation (chart work)
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The calculations a navigator does beside the chart, with the arithmetic
 * taken off them. The maths lives in navmath.js and is tested separately;
 * this file is only the screen.
 *
 * It does not replace the chart. The chart holds the fix, the depths, the
 * hazards and the decision. This works out the numbers that go onto it.
 */
(function (global) {
  'use strict';

  var N = global.NavMath;

  /* ── shared bits ── */
  function deg(v, dp) { return (isFinite(v) ? v.toFixed(dp == null ? 1 : dp) : '-') + '°'; }
  function brg(v) { return (isFinite(v) ? ('00' + Math.round(v)).slice(-3) : '---') + '°'; }
  function nm(v, dp) { return isFinite(v) ? v.toFixed(dp == null ? 2 : dp) + ' NM' : '-'; }
  function kn(v) { return isFinite(v) ? v.toFixed(2) + ' kn' : '-'; }

  /* ── angle in NATO mils (6400 to the circle), and a 16-point cardinal ── */
  function mils(v) { return isFinite(v) ? Math.round(N.norm360(v) / 360 * 6400) : null; }

  /* the four angular systems a compass can be read in. Degrees are the civil
     standard; NATO mils put 6400 to the circle (about 1 m at 1000 m); the old
     Warsaw-Pact artillery mil puts 6000 to the circle; grads (gons) put 400,
     with 100 to the right angle, used in European survey. */
  var ANGLE_UNITS = {
    deg:   { label: 'Degrees',           full: 360 },
    mil64: { label: 'NATO mils',         full: 6400 },
    mil60: { label: 'Warsaw Pact mils',  full: 6000 },
    gon:   { label: 'Grads',             full: 400 }
  };
  function angleUnit() { var u = A.store.get('nav.angleUnit', 'deg'); return ANGLE_UNITS[u] ? u : 'deg'; }
  /* the other three units, each with its own label, so a reading is never
     mistaken for the wrong system */
  function unitLine(v, sel) {
    var d = N.norm360(v), p = [];
    if (sel !== 'deg') p.push(('00' + Math.round(d)).slice(-3) + '°');
    if (sel !== 'mil64') p.push(Math.round(d / 360 * 6400) + ' mil NATO');
    if (sel !== 'mil60') p.push(Math.round(d / 360 * 6000) + ' mil WP');
    if (sel !== 'gon') p.push(Math.round(d / 360 * 400) + ' gon');
    return p.join(' · ');
  }
  function fmtAngle(v, u) {
    if (!isFinite(v)) return '---';
    u = u || angleUnit();
    if (u === 'deg') return ('00' + Math.round(N.norm360(v))).slice(-3) + '°';
    var val = N.norm360(v) / 360 * ANGLE_UNITS[u].full;
    return u === 'gon' ? val.toFixed(1) + ' gon' : Math.round(val) + ' mil';
  }
  var CARD16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  var CARD8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function card16(v) { return isFinite(v) ? CARD16[Math.round(N.norm360(v) / 22.5) % 16] : ''; }
  function card8(v) { return isFinite(v) ? CARD8[Math.round(N.norm360(v) / 45) % 8] : ''; }

  /* ── where the sun and moon are, as a true bearing and an altitude ──
     The sun comes from the app's existing NOAA solar model (ArtSun). The moon
     is worked out here with Schlyter's low-precision series: good to a fraction
     of a degree, which is far better than a dot on a dial needs. Both are
     azimuths measured clockwise from true north, so they drop straight onto the
     rose at their own bearing and turn with it. */
  function moonPosition(date, lat, lon) {
    var RAD = Math.PI / 180, DEG = 180 / Math.PI;
    function n360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
    var Y = date.getUTCFullYear(), Mo = date.getUTCMonth() + 1, D = date.getUTCDate();
    var uh = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    var d = 367 * Y - Math.floor(7 * (Y + Math.floor((Mo + 9) / 12)) / 4)
          + Math.floor(275 * Mo / 9) + D - 730530 + uh / 24;

    var ecl = (23.4393 - 3.563e-7 * d) * RAD;
    var Nn = n360(125.1228 - 0.0529538083 * d) * RAD;
    var inc = 5.1454 * RAD;
    var w = n360(318.0634 + 0.1643573223 * d) * RAD;
    var a = 60.2666, e = 0.054900;
    var M = n360(115.3654 + 13.0649929509 * d) * RAD;

    var E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
    for (var it = 0; it < 5; it++) { E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); }
    var xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var v = Math.atan2(yv, xv), r = Math.sqrt(xv * xv + yv * yv);

    var xh = r * (Math.cos(Nn) * Math.cos(v + w) - Math.sin(Nn) * Math.sin(v + w) * Math.cos(inc));
    var yh = r * (Math.sin(Nn) * Math.cos(v + w) + Math.cos(Nn) * Math.sin(v + w) * Math.cos(inc));
    var zh = r * Math.sin(v + w) * Math.sin(inc);
    var lonEcl = Math.atan2(yh, xh), latEcl = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

    /* the main perturbations - without these the moon can be a couple of
       degrees out, which shows on a dial */
    var ws = n360(282.9404 + 4.70935e-5 * d) * RAD;
    var Ms = n360(356.0470 + 0.9856002585 * d) * RAD;
    var Ls = ws + Ms, Lm = Nn + w + M, Dm = Lm - Ls, F = Lm - Nn;
    lonEcl += (-1.274 * Math.sin(M - 2 * Dm) + 0.658 * Math.sin(2 * Dm)
      - 0.186 * Math.sin(Ms) - 0.059 * Math.sin(2 * M - 2 * Dm)
      - 0.057 * Math.sin(M - 2 * Dm + Ms) + 0.053 * Math.sin(M + 2 * Dm)
      + 0.046 * Math.sin(2 * Dm - Ms) + 0.041 * Math.sin(M - Ms)
      - 0.035 * Math.sin(Dm) - 0.031 * Math.sin(M + Ms)
      - 0.015 * Math.sin(2 * F - 2 * Dm) + 0.011 * Math.sin(M - 4 * Dm)) * RAD;
    latEcl += (-0.173 * Math.sin(F - 2 * Dm) - 0.055 * Math.sin(M - F - 2 * Dm)
      - 0.046 * Math.sin(M + F - 2 * Dm) + 0.033 * Math.sin(F + 2 * Dm)
      + 0.017 * Math.sin(2 * M + F)) * RAD;

    var xg = Math.cos(lonEcl) * Math.cos(latEcl);
    var yg = Math.sin(lonEcl) * Math.cos(latEcl);
    var zg = Math.sin(latEcl);
    var xe = xg;
    var ye = yg * Math.cos(ecl) - zg * Math.sin(ecl);
    var ze = yg * Math.sin(ecl) + zg * Math.cos(ecl);
    var RA = Math.atan2(ye, xe), Dec = Math.atan2(ze, Math.sqrt(xe * xe + ye * ye));

    var GMST0 = Ls * DEG + 180;
    var LST = n360(GMST0 + uh * 15 + lon) * RAD;
    var HA = LST - RA;
    var latR = lat * RAD;
    var alt = Math.asin(Math.sin(latR) * Math.sin(Dec) + Math.cos(latR) * Math.cos(Dec) * Math.cos(HA));
    var az = Math.atan2(-Math.cos(Dec) * Math.sin(HA),
      Math.sin(Dec) * Math.cos(latR) - Math.cos(Dec) * Math.sin(latR) * Math.cos(HA));
    return {
      az: n360(az * DEG), alt: alt * DEG,
      lonEcl: n360(lonEcl * DEG),   /* ecliptic longitude, for the phase */
      ra: n360(RA * DEG), dec: Dec * DEG,   /* equatorial, for the sub-lunar point */
      gmst: n360(GMST0 + uh * 15)   /* Greenwich sidereal time in degrees */
    };
  }

  /* the sun's true ecliptic longitude and the moon phase from the elongation.
     Observer-independent, so no position is needed. */
  function sunEclLon(date) {
    var RAD = Math.PI / 180;
    function n360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
    var Y = date.getUTCFullYear(), Mo = date.getUTCMonth() + 1, D = date.getUTCDate();
    var uh = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    var d = 367 * Y - Math.floor(7 * (Y + Math.floor((Mo + 9) / 12)) / 4) + Math.floor(275 * Mo / 9) + D - 730530 + uh / 24;
    var w = n360(282.9404 + 4.70935e-5 * d), M = n360(356.0470 + 0.9856002585 * d);
    return { lon: n360(w + M + 1.915 * Math.sin(M * RAD) + 0.020 * Math.sin(2 * M * RAD)), gmst: n360(w + M + 180 + uh * 15) };
  }
  function moonPhase(date) {
    var mp = moonPosition(date, 0, 0);
    var sun = sunEclLon(date);
    var age = ((mp.lonEcl - sun.lon) % 360 + 360) % 360;   /* 0 new, 180 full */
    var illum = (1 - Math.cos(age * Math.PI / 180)) / 2;
    var names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
                 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    return { age: age, illum: illum, name: names[Math.floor((((age + 22.5) % 360)) / 45)] };
  }

  /* a drawn moon showing the current phase: the lit region between the limb on
     the lit side and the terminator, sampled as a polygon so every phase from
     new to full comes out right. Waxing is lit on the right, waning on the
     left, the northern-hemisphere convention. */
  function moonSVG(age) {
    var R = 34, cx = 40, cy = 40, rad = age * Math.PI / 180, c = Math.cos(rad);
    var sLit = (age < 180) ? 1 : -1, N = 26, pts = [], i, y, x;
    for (i = 0; i <= N; i++) { y = -R + 2 * R * i / N; x = sLit * Math.sqrt(Math.max(0, R * R - y * y)); pts.push((cx + x).toFixed(1) + ' ' + (cy + y).toFixed(1)); }
    for (i = N; i >= 0; i--) { y = -R + 2 * R * i / N; x = sLit * c * Math.sqrt(Math.max(0, R * R - y * y)); pts.push((cx + x).toFixed(1) + ' ' + (cy + y).toFixed(1)); }
    return '<svg viewBox="0 0 80 80" class="moon-phase-svg">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#22262d"/>' +
      '<path d="M ' + pts.join(' L ') + ' Z" fill="#eef1f5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#3a3f47" stroke-width="1"/></svg>';
  }

  /* The same phase drawing as moonSVG, but as a bare disc of arbitrary radius
     that can be dropped anywhere in another SVG. The marker on the compass used
     to be a plain grey dot, which told you where the moon was but not what it
     would look like when you got your eyes on it: a two-day crescent and a full
     moon light the ground quite differently, and at night that is the whole
     question. Waxing lit on the right, waning on the left, as seen from the
     northern hemisphere. */
  function moonDisc(cx, cy, R, age, dim) {
    var rad = age * Math.PI / 180, c = Math.cos(rad);
    var sLit = (age < 180) ? 1 : -1, N = 22, pts = [], i, y, x;
    for (i = 0; i <= N; i++) { y = -R + 2 * R * i / N; x = sLit * Math.sqrt(Math.max(0, R * R - y * y)); pts.push((cx + x).toFixed(2) + ' ' + (cy + y).toFixed(2)); }
    for (i = N; i >= 0; i--) { y = -R + 2 * R * i / N; x = sLit * c * Math.sqrt(Math.max(0, R * R - y * y)); pts.push((cx + x).toFixed(2) + ' ' + (cy + y).toFixed(2)); }
    var op = dim ? 0.4 : 1;
    return '<g opacity="' + op + '">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#22262d"/>' +
      '<path d="M ' + pts.join(' L ') + ' Z" fill="#eef1f5"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#6b7076" stroke-width="' +
      (R / 6).toFixed(2) + '"/></g>';
  }

  /* sun rise/set (or twilight) for a given sun altitude, in local clock minutes */
  function riseSetAt(date, lat, lon, hDeg) {
    var sp = global.ArtSun.position(date, lat, lon);
    var RAD = Math.PI / 180;
    var latR = lat * RAD, dR = sp.declination * RAD;
    var cosH = (Math.sin(hDeg * RAD) - Math.sin(latR) * Math.sin(dR)) / (Math.cos(latR) * Math.cos(dR));
    if (cosH > 1) return { polar: 'never' };   /* stays below this altitude */
    if (cosH < -1) return { polar: 'always' };  /* stays above it */
    var H = Math.acos(cosH) * 180 / Math.PI;
    return { rise: sp.noonMinutes - 4 * H, set: sp.noonMinutes + 4 * H, noon: sp.noonMinutes };
  }
  function clockHM(min) {
    if (!isFinite(min)) return '—';
    min = ((min % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    if (m === 60) { m = 0; h = (h + 1) % 24; }
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function sunMoon(lat, lon, date) {
    date = date || new Date();
    var s = null, m = null;
    try { var sp = global.ArtSun.position(date, lat, lon); s = { az: sp.azimuth, alt: sp.elevation }; } catch (e) {}
    try { m = moonPosition(date, lat, lon); } catch (e) {}
    return { sun: s, moon: m };
  }

  /* hours as h:mm, because a passage plan is read in clock time */
  function hoursHM(h) {
    if (!isFinite(h) || h < 0) return '-';
    var m = Math.round(h * 60);
    return Math.floor(m / 60) + 'h' + ('0' + (m % 60)).slice(-2);
  }

  /* Decimal degrees, five places - the ONE coordinate format used everywhere
     in the app, matching the ranger-map pin (25.05460, 55.12934), so a
     position can be copied from any screen and pasted into any other. */
  function fmtLat(d) { return isFinite(d) ? d.toFixed(5) : '-'; }
  function fmtLon(d) { return isFinite(d) ? d.toFixed(5) : '-'; }

  /* Accepts "50 12.5 N", "50.2083", "5012.5N", "-5 12.5" - a navigator types
     degrees and decimal minutes, not decimal degrees, and should not have to
     convert in their head to use their own tool. */
  function parseCoord(str, isLon) {
    if (str == null) return NaN;
    var s = String(str).trim().toUpperCase();
    if (!s) return NaN;
    var neg = /[SW]/.test(s) || /^-/.test(s);
    s = s.replace(/[NSEW]/g, ' ').replace(/[°'"]/g, ' ').replace(/^-/, ' ');
    var parts = s.split(/\s+/).filter(function (x) { return x !== ''; }).map(parseFloat);
    if (!parts.length || !isFinite(parts[0])) return NaN;
    var v;
    if (parts.length === 1) v = parts[0];
    else if (parts.length === 2) v = parts[0] + parts[1] / 60;
    else v = parts[0] + parts[1] / 60 + parts[2] / 3600;
    if (!isFinite(v)) return NaN;
    if (Math.abs(v) > (isLon ? 180 : 90)) return NaN;
    return neg ? -v : v;
  }

  function num(v) { return A.parseNum(v); }

  /* a result line */
  function out(card, label, value, sub) {
    card.appendChild(A.UI.metric(label, value, sub ? { sub: sub } : null));
  }

  /* ══ 1. distance and bearing between two positions ═════════════════════ */

  function toolPositions(host) {
    var st = A.store.get('nav.pos', { a1: '', a2: '', b1: '', b2: '', step: '10' });
    if (st.step == null) st.step = '10';
    function save() { A.store.set('nav.pos', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'The ORTHODROME is the great circle: the shortest path there is, but its course ' +
      'changes the whole way, so it is sailed as a series of legs between waypoints. ' +
      'The LOXODROME is the rhumb line: one steady course, the straight line on a ' +
      'Mercator chart, and slightly longer. Over a short passage the difference is ' +
      'nothing; across an ocean it is worth having.'));

    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({ decimalAt: 2, label: 'From latitude', value: st.a1, placeholder: '40.70000',
      oninput: function (e) { st.a1 = e.target.value; save(); calc(); } }));
    r1.appendChild(A.UI.field({ label: 'From longitude', value: st.a2, placeholder: '074 00.0 W',
      oninput: function (e) { st.a2 = e.target.value; save(); calc(); } }));
    card.appendChild(r1);

    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({ decimalAt: 2, label: 'To latitude', value: st.b1, placeholder: '38.70000',
      oninput: function (e) { st.b1 = e.target.value; save(); calc(); } }));
    r2.appendChild(A.UI.field({ label: 'To longitude', value: st.b2, placeholder: '009 08.0 W',
      oninput: function (e) { st.b2 = e.target.value; save(); calc(); } }));
    card.appendChild(r2);

    card.appendChild(A.UI.select({
      label: 'Waypoint spacing along the great circle', value: String(st.step),
      options: [['0', 'No waypoints'], ['5', 'Every 5° of longitude'], ['10', 'Every 10°'],
                ['15', 'Every 15°'], ['20', 'Every 20°']]
        .map(function (o) { return { value: o[0], label: o[1] }; }),
      onchange: function (e) { st.step = e.target.value; save(); calc(); }
    }));

    var res = A.el('div');
    host.appendChild(res);

    function calc() {
      A.clear(res);
      var la = parseCoord(st.a1, false), lo = parseCoord(st.a2, true);
      var lb = parseCoord(st.b1, false), lp = parseCoord(st.b2, true);
      if (!isFinite(la) || !isFinite(lo) || !isFinite(lb) || !isFinite(lp)) {
        res.appendChild(A.UI.note('Enter both positions.')); return;
      }

      var cmp = N.sailingComparison(la, lo, lb, lp);
      /* the comparison runs without waypoints; recompute the orthodrome with
         the spacing the user asked for, or the waypoint list comes back empty */
      var o = N.orthodrome(la, lo, lb, lp, num(st.step) || 0);
      var l = cmp.loxodrome;

      /* ── the comparison first: which to sail ── */
      res.appendChild(A.UI.section('Which to sail'));
      var cc = A.UI.card(null, 'tight');
      out(cc, 'Orthodrome (great circle)', nm(o.distance, 1), 'shortest, course changes throughout');
      out(cc, 'Loxodrome (rhumb line)', nm(l.distance, 1), 'one steady course');
      out(cc, 'Saved by the great circle', nm(cmp.saving, 1),
        A.fmtNum(cmp.savingPercent, 3) + ' % of the rhumb-line distance');
      res.appendChild(cc);
      res.appendChild(A.UI.note(
        cmp.saving < 5
          ? 'Barely a mile in it. Sail the rhumb line: one course, no waypoints, and nothing lost.'
          : (cmp.saving < 50
            ? 'A modest saving. Worth a great circle only if the course changes cost you nothing.'
            : 'A real saving, worth sailing the great circle as legs between the waypoints below.')));

      /* ── orthodrome ── */
      res.appendChild(A.UI.section('Orthodrome'));
      var oc = A.UI.card(null, 'tight');
      out(oc, 'Distance', nm(o.distance, 1));
      out(oc, 'Initial course', brg(o.initialCourse) + ' true', 'the course to set off on');
      out(oc, 'Final course', brg(o.finalCourse) + ' true', 'the course on arrival');
      out(oc, 'Course change over the passage', deg(Math.abs(N.diff180(o.initialCourse, o.finalCourse))),
        'why it cannot be steered as one course');
      out(oc, 'Vertex', fmtLat(o.vertexLat) + '   ' + fmtLon(o.vertexLon),
        'the highest latitude the track reaches');
      res.appendChild(oc);

      if (Math.abs(o.vertexLat) > Math.max(Math.abs(la), Math.abs(lb)) + 0.5) {
        res.appendChild(A.UI.note(
          'The track rises to ' + fmtLat(o.vertexLat) + ', well beyond either end of the passage. ' +
          'That is the nature of a great circle, and it is the thing to check before committing to ' +
          'one: satisfy yourself the higher latitude is clear of ice, weather and land.'));
      }

      /* ── waypoints ── */
      if (o.waypoints && o.waypoints.length) {
        res.appendChild(A.UI.section('Waypoints along the great circle'));
        var wc = A.UI.card(null, 'tight');
        var prev = { lat: la, lon: lo };
        o.waypoints.forEach(function (w, i) {
          var leg = N.rhumbLine(prev.lat, prev.lon, w.lat, w.lon);
          var row = A.el('.nav-wp');
          row.appendChild(A.el('span.nav-wp-n', { text: String(i + 1) }));
          row.appendChild(A.el('span.nav-wp-p', { text: fmtLat(w.lat) + '  ' + fmtLon(w.lon) }));
          row.appendChild(A.el('span.nav-wp-c', { text: brg(leg.bearing) + '  ' + nm(leg.distance, 0) }));
          wc.appendChild(row);
          prev = w;
        });
        var lastLeg = N.rhumbLine(prev.lat, prev.lon, lb, lp);
        var rowE = A.el('.nav-wp.end');
        rowE.appendChild(A.el('span.nav-wp-n', { text: '→' }));
        rowE.appendChild(A.el('span.nav-wp-p', { text: fmtLat(lb) + '  ' + fmtLon(lp) }));
        rowE.appendChild(A.el('span.nav-wp-c', { text: brg(lastLeg.bearing) + '  ' + nm(lastLeg.distance, 0) }));
        wc.appendChild(rowE);
        res.appendChild(wc);
        res.appendChild(A.UI.note(
          'Each line is a waypoint and the rhumb-line course and distance to reach it from the one ' +
          'before. Steer each leg as a straight course; together they follow the great circle closely ' +
          'enough that the saving is kept.'));
      }

      /* ── loxodrome ── */
      res.appendChild(A.UI.section('Loxodrome'));
      var lc = A.UI.card(null, 'tight');
      out(lc, 'Distance', nm(l.distance, 1));
      out(lc, 'Course', brg(l.course) + ' true', 'held the whole way');
      out(lc, 'Difference of latitude', A.fmtNum(Math.abs(l.dLat), 4) + "'" +
        (l.dLat >= 0 ? ' north' : ' south'));
      out(lc, 'Difference of longitude', A.fmtNum(Math.abs(l.dLon), 5) + "'" +
        (l.dLon >= 0 ? ' east' : ' west'));
      out(lc, 'Departure', nm(Math.abs(l.departure), 1),
        'the east-west distance, shrunk by the cosine of the mean latitude');
      out(lc, 'Difference of meridional parts', A.fmtNum(l.meridionalDiff, 5),
        'the stretched Mercator latitude the course is built on');
      res.appendChild(lc);
      res.appendChild(A.UI.note(
        'On a Mercator chart the course is the angle whose tangent is the difference of longitude ' +
        'over the difference of meridional parts. That is the whole of rhumb-line sailing, and it is ' +
        'why the chart is drawn with a stretched latitude scale in the first place.'));
    }
    calc();
  }

  /* ══ 2. measuring on a paper chart ═════════════════════════════════════ */

  function toolChartScale(host) {
    var st = A.store.get('nav.chart', { min: '', lat: '' });
    function save() { A.store.set('nav.chart', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'One minute of LATITUDE is one nautical mile, so distance is always taken ' +
      'from the scale up the SIDE of the chart, level with your track. The scale ' +
      'along the top and bottom is longitude and it is stretched: using it is the ' +
      'commonest chart-work error there is.'));

    card.appendChild(A.UI.field({ label: 'Minutes measured', inputmode: 'decimal', value: st.min,
      oninput: function (e) { st.min = e.target.value; save(); calc(); } }));
    card.appendChild(A.UI.field({ decimalAt: 2, label: 'At what latitude (degrees)', inputmode: 'decimal', value: st.lat,
      placeholder: '50', oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));

    var res = A.el('div');
    host.appendChild(res);

    function calc() {
      A.clear(res);
      var m = num(st.min), la = num(st.lat);
      if (!isFinite(m)) { res.appendChild(A.UI.note('Enter the minutes you measured.')); return; }
      var c = A.UI.card(null, 'tight');
      out(c, 'Measured on the LATITUDE scale', nm(N.chartMinutesToNM(m), 2), 'correct: this is your distance');
      if (isFinite(la)) {
        out(c, 'If measured on the LONGITUDE scale', nm(N.longitudeMinutesToNM(m, la), 2),
          'what those minutes are really worth at ' + deg(la, 0));
        var err = m - N.longitudeMinutesToNM(m, la);
        out(c, 'Error if you used the wrong scale', nm(err, 2),
          'you would be ' + (err > 0 ? 'short of' : 'beyond') + ' where you thought');
      }
      res.appendChild(c);
    }
    calc();
  }

  /* ══ 3. true, magnetic and compass ═════════════════════════════════════ */

  function toolCompass(host) {
    var st = A.store.get('nav.compass', {
      from: 'compass', val: '', varn: '', dev: '', lat: '', lon: '', auto: true
    });
    if (st.auto == null) st.auto = true;
    function save() { A.store.set('nav.compass', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'VARIATION is the chart’s error: where the earth’s field points against true ' +
      'north. DEVIATION is the vessel’s own, from its steel and its wiring, and it ' +
      'changes with heading. Both are entered signed, EAST positive and WEST negative, ' +
      'so there is no mnemonic to get backwards.'));

    /* ── variation from the World Magnetic Model ── */
    var W = global.WMM;
    if (W) {
      card.appendChild(A.el('.nav-auto', null, [
        A.el('span', { text: 'Work out variation from my position' }),
        (function () {
          var b = A.el('button.nav-toggle' + (st.auto ? '.on' : ''), {
            text: st.auto ? 'On' : 'Off',
            onclick: function () { st.auto = !st.auto; save(); A.Router.refresh(); }
          });
          return b;
        })()
      ]));

      if (st.auto) {
        var pr = A.el('.split');
        pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
          oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));
        pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
          oninput: function (e) { st.lon = e.target.value; save(); calc(); } }));
        card.appendChild(pr);
        card.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('pin') + ' Use my position',
          style: { marginBottom: '10px' },
          onclick: function () {
            if (!navigator.geolocation) { A.toast('No position source'); return; }
            A.toast('Getting a fix…');
            navigator.geolocation.getCurrentPosition(function (pos) {
              st.lat = fmtLat(pos.coords.latitude);
              st.lon = fmtLon(pos.coords.longitude);
              save(); A.Router.refresh();
            }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
          }
        }));
      }
    }

    var chips = A.UI.chips(
      [{ id: 'compass', label: 'From compass' }, { id: 'true', label: 'From true' }],
      st.from, function (id) { st.from = id; save(); A.Router.refresh(); });
    chips.classList.add('wrap');
    card.appendChild(chips);

    card.appendChild(A.UI.field({
      label: st.from === 'compass' ? 'Compass heading' : 'True heading',
      inputmode: 'decimal', value: st.val, suffix: '°',
      oninput: function (e) { st.val = e.target.value; save(); calc(); }
    }));
    var r = A.el('.split');
    var varField = A.UI.field({ label: 'Variation (E+ / W−)', inputmode: 'decimal', value: st.varn,
      placeholder: '-2.5', oninput: function (e) { st.varn = e.target.value; st.auto = false; save(); calc(); } });
    r.appendChild(varField);
    r.appendChild(A.UI.field({ label: 'Deviation (E+ / W−)', inputmode: 'decimal', value: st.dev,
      placeholder: '0', oninput: function (e) { st.dev = e.target.value; save(); calc(); } }));
    card.appendChild(r);

    var res = A.el('div');
    host.appendChild(res);

    function modelVariation() {
      if (!W || !st.auto) return null;
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) return null;
      try { return W.field(la, lo, 0, new Date()); } catch (e) { return null; }
    }

    function calc() {
      A.clear(res);

      var mv = modelVariation();
      var va;
      if (mv) {
        va = mv.declination;
        varField.input.value = A.fmtNum(va, 3);
        var mc = A.UI.card(null, 'tight');
        out(mc, 'Variation here, today', deg(Math.abs(va), 2) + (va >= 0 ? ' EAST' : ' WEST'),
          W.NAME + ', worked out for your position and the date');
        out(mc, 'Magnetic dip', deg(mv.inclination, 1),
          'how steeply the field points down; near ±90° a magnetic compass is useless');
        out(mc, 'Field strength', A.fmtNum(mv.F, 5) + ' nT',
          'a weak horizontal field makes a compass sluggish');
        res.appendChild(mc);
        if (mv.expired) {
          res.appendChild(A.UI.note(
            'This model expired at the end of ' + W.VALID_TO + '. The figures are extrapolated ' +
            'beyond their validity and drift further wrong each year. Take variation from a ' +
            'current chart until the app carries a newer model.'));
        }
      }

      var v = num(st.val);
      if (!isFinite(v)) { res.appendChild(A.UI.note('Enter a heading.')); return; }
      if (va == null || !isFinite(va)) va = num(st.varn) || 0;
      var dv = num(st.dev) || 0;

      var c = A.UI.card(null, 'tight');
      if (st.from === 'compass') {
        out(c, 'Compass', brg(v), 'what the card reads');
        out(c, 'Magnetic', brg(N.compassToMagnetic(v, dv)), 'compass corrected for deviation');
        out(c, 'True', brg(N.compassToTrue(v, va, dv)), 'what you plot on the chart');
      } else {
        out(c, 'True', brg(v), 'taken from the chart');
        out(c, 'Magnetic', brg(N.trueToMagnetic(v, va)), 'true corrected for variation');
        out(c, 'Compass', brg(N.trueToCompass(v, va, dv)), 'what to steer by');
      }
      res.appendChild(c);

      if (mv) {
        res.appendChild(A.UI.note(
          'The model gives the smooth global field. It does not know about the iron in the ' +
          'hill beside you or the wreck under you, and charted local anomalies of several ' +
          'degrees exist. Where a chart shows variation for the area, the chart wins.'));
      }
    }
    calc();
  }

  /* ══ 3b. the phone as a compass ════════════════════════════════════════

     ONE SOURCE OF HEADING, shared by the full dial and the small floating
     one, so they never disagree and the sensor is only listened to once.

     Two things make a magnetometer readable. First, the reading is SMOOTHED
     as a vector rather than as a number: averaging degrees breaks at the
     360/0 seam, where 359 and 1 average to 180 and the needle jumps clean
     across the dial. Sines and cosines have no seam. Second, the dial is
     drawn ONCE and then rotated. The first version rebuilt the whole SVG on
     every sensor event, dozens of times a second, which is what made it
     flicker rather than turn. */

  var Compass = (function () {
    var smSin = null, smCos = null;     /* smoothed unit vector of the heading */
    var have = false, listening = false, failed = false;
    var subs = [];
    var frame = null;
    var shown = null;                   /* the angle actually on screen */
    var smBeta = null, smGamma = null;  /* smoothed tilt for the spirit level */

    function onOrient(ev) {
      /* tilt for the bubble level: beta is front-to-back, gamma side-to-side */
      if (typeof ev.beta === 'number' && isFinite(ev.beta)) {
        smBeta = (smBeta == null) ? ev.beta : smBeta + (ev.beta - smBeta) * 0.2;
      }
      if (typeof ev.gamma === 'number' && isFinite(ev.gamma)) {
        smGamma = (smGamma == null) ? ev.gamma : smGamma + (ev.gamma - smGamma) * 0.2;
      }
      var mag = null;
      /* iOS gives magnetic north directly; elsewhere alpha counts
         anticlockwise from north, so it has to be turned round */
      if (typeof ev.webkitCompassHeading === 'number' && isFinite(ev.webkitCompassHeading)) {
        mag = ev.webkitCompassHeading;
      } else if (typeof ev.alpha === 'number' && isFinite(ev.alpha)) {
        mag = 360 - ev.alpha;
      }
      if (mag == null) return;
      var r = N.norm360(mag) * Math.PI / 180;
      var sn = Math.sin(r), cs = Math.cos(r);
      if (smSin == null) { smSin = sn; smCos = cs; }
      else {
        /* a gentle low-pass: enough to kill the twitch, not enough to lag */
        var k = 0.16;
        smSin += (sn - smSin) * k;
        smCos += (cs - smCos) * k;
      }
      have = true;
    }

    function heading() {
      if (smSin == null) return null;
      return N.norm360(Math.atan2(smSin, smCos) * 180 / Math.PI);
    }

    /* the angle to draw: eased toward the true heading the SHORT way round,
       so crossing north does not spin the rose the long way */
    function tick() {
      var h = heading();
      if (h != null) {
        if (shown == null) shown = h;
        else {
          var d = N.diff180(shown, h);        /* -180..+180 */
          shown = shown + d * 0.25;
        }
        subs.forEach(function (fn) { try { fn(N.norm360(shown), h); } catch (e) {} });
      }
      frame = requestAnimationFrame(tick);
    }

    /* the native Android rotation-vector sensor, when the app is running under
       Capacitor on Android. Steadier and truer than the WebView event. */
    var usingNative = false;
    function nativeRV() {
      var Cap = global.Capacitor;
      if (!Cap || !Cap.Plugins || !Cap.Plugins.RotationVector) return null;
      if (typeof Cap.getPlatform === 'function' && Cap.getPlatform() !== 'android') return null;
      return Cap.Plugins.RotationVector;
    }

    function onNative(d) {
      if (!d) return;
      if (typeof d.roll === 'number' && isFinite(d.roll)) {
        smGamma = (smGamma == null) ? d.roll : smGamma + (d.roll - smGamma) * 0.2;
      }
      if (typeof d.pitch === 'number' && isFinite(d.pitch)) {
        smBeta = (smBeta == null) ? d.pitch : smBeta + (d.pitch - smBeta) * 0.2;
      }
      var mag = d.heading;
      if (typeof mag !== 'number' || !isFinite(mag)) return;
      var r = N.norm360(mag) * Math.PI / 180, sn = Math.sin(r), cs = Math.cos(r);
      if (smSin == null) { smSin = sn; smCos = cs; }
      else { var k = 0.16; smSin += (sn - smSin) * k; smCos += (cs - smCos) * k; }
      have = true;
    }

    function start() {
      if (listening) return;
      listening = true;

      function webListen() {
        window.addEventListener('deviceorientationabsolute', onOrient, true);
        window.addEventListener('deviceorientation', onOrient, true);
        if (!frame) frame = requestAnimationFrame(tick);
        setTimeout(function () { if (!have) failed = true; }, 2500);
      }

      var RV = nativeRV();
      if (RV) {
        try {
          RV.addListener('reading', onNative);
          RV.start();
          usingNative = true;
          if (!frame) frame = requestAnimationFrame(tick);
          /* if nothing arrives from the sensor, drop back to the WebView event */
          setTimeout(function () {
            if (!have && usingNative) {
              usingNative = false;
              try { RV.removeAllListeners(); RV.stop(); } catch (e) {}
              webListen();
            }
          }, 1500);
          return;
        } catch (e) { usingNative = false; }
      }

      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function (r) {
          if (r === 'granted') webListen(); else { failed = true; listening = false; }
        }).catch(function () { failed = true; listening = false; });
      } else webListen();
    }

    function stop() {
      if (usingNative) {
        var RV = nativeRV();
        if (RV) { try { RV.removeAllListeners(); RV.stop(); } catch (e) {} }
        usingNative = false;
      }
      window.removeEventListener('deviceorientationabsolute', onOrient, true);
      window.removeEventListener('deviceorientation', onOrient, true);
      if (frame) { cancelAnimationFrame(frame); frame = null; }
      listening = false;
    }

    return {
      start: start, stop: stop,
      heading: heading,
      ok: function () { return have; },
      failed: function () { return failed && !have; },
      /* the heading as it stands right now, for calibration: the subscriber
         callback is the only other way to read it and that is the wrong shape
         for a button press */
      last: function () { return have ? heading() : null; },
      /* device tilt for the spirit level, or null if none has arrived */
      tilt: function () { return smBeta == null ? null : { beta: smBeta, gamma: smGamma }; },
      /* subscribe to the eased angle; returns an unsubscribe */
      on: function (fn) {
        subs.push(fn);
        start();
        return function () {
          var i = subs.indexOf(fn);
          if (i >= 0) subs.splice(i, 1);
          if (!subs.length) stop();
        };
      }
    };
  })();

  /* The rose, built once. The group with class rose is what gets rotated.
     FOUR concentric scales share the card, one per angular system, colour
     coded: degrees (outer, neutral), NATO mils 6400 (red), Warsaw-Pact mils
     6000 (gold), grads 400 (green). The ring for the unit the user has picked
     is drawn at full strength, the others dimmed. Cardinals, the needle, the
     lock marker and the sun and moon all live on the rose and turn with it,
     under the fixed red lubber at the top.

     opts.mini draws only the degree ring + cardinals + needle, because the
     floating compass is too small for four rings. opts.unit says which ring to
     bring forward. */
  function buildDial(opts) {
    opts = opts || {};
    var cx = 100, cy = 100, unit = opts.unit || 'deg', mini = !!opts.mini;
    function pol(r, aDeg) { var a = aDeg * Math.PI / 180; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; }
    function ln(r1, r2, aDeg, col, w, op) {
      var p1 = pol(r1, aDeg), p2 = pol(r2, aDeg);
      return '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) +
        '" y2="' + p2[1].toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" opacity="' + op.toFixed(2) + '"/>';
    }
    function txt(r, aDeg, s, size, col, weight, op) {
      var p = pol(r, aDeg);
      return '<text transform="rotate(' + aDeg.toFixed(1) + ' 100 100)" x="100" y="' +
        (cy - r + size * 0.36).toFixed(1) + '" text-anchor="middle" font-size="' + size + '" fill="' + col +
        '" fill-opacity="' + (op == null ? 1 : op) + '"' + (weight ? ' font-weight="' + weight + '"' : '') + '>' + s + '</text>';
    }
    function hl(u) { return unit === u ? 1 : 0.45; }
    var g = '';

    /* a full unit ring */
    function ring(R, full, tickStep, majEvery, midEvery, labStep, labFn, col, op) {
      for (var a = 0; a < full; a += tickStep) {
        var deg = a / full * 360, maj = (a % majEvery === 0), mid = (a % midEvery === 0);
        g += ln(R - (maj ? 9 : mid ? 6 : 3.2), R, deg, col, maj ? 1.2 : mid ? 0.8 : 0.5,
          (maj ? 0.9 : mid ? 0.5 : 0.28) * op);
      }
      for (var b = 0; b < full; b += labStep) {
        /* the number sits well inside the tick marks, clear of the graduation
           lines it used to touch */
        g += txt(R - 11, b / full * 360, labFn(b), col === 'currentColor' ? 6.2 : 5.6, col, 600, op);
      }
    }

    /* the four unit rings, shifted inward to leave an outer band for the
       cardinals and the sun and moon */
    ring(mini ? 97 : 82, 360, 2, 30, 10, 30, function (b) { return ('00' + b).slice(-3); }, 'currentColor', hl('deg'));

    if (!mini) {
      ring(68, 6400, 100, 800, 400, 800, function (b) { return String(b / 100); }, 'var(--danger)', hl('mil64'));
      ring(55, 6000, 100, 1000, 500, 1000, function (b) { return String(b / 100); }, 'var(--acc)', hl('mil60'));
      ring(43, 400, 5, 50, 25, 50, function (b) { return String(b); }, 'var(--ok)', hl('gon'));
    }

    /* cardinals: on the mini they sit inside; on the full dial they sit OUTSIDE
       the ring stack, in the free band near the rim */
    var cardR = mini ? 55 : 90;
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (c) {
      g += txt(cardR, c[1], c[0], mini ? 13 : 11, c[1] === 0 ? 'var(--danger)' : 'currentColor', 700, 1);
    });
    if (!mini) [['NE', 45], ['SE', 135], ['SW', 225], ['NW', 315]].forEach(function (c) {
      g += txt(cardR, c[1], c[0], 6.5, 'currentColor', 500, 0.8);
    });

    /* the north/south needle */
    g += '<polygon points="100,28 104,86 100,94 96,86" fill="var(--danger)"/>';
    g += '<polygon points="100,172 104,114 100,106 96,114" fill="currentColor" opacity="0.4"/>';

    /* filled by the page: the locked-heading marker, then the sun and moon.
       nav-degmark holds the green bearing marker and rides the rose, because a
       bearing is a fact about the ground and has to stay on the ground as the
       phone turns. */
    g += '<g class="nav-lock"></g><g class="nav-degmark"></g><g class="nav-suns"></g>';

    /* The rim markers stand OUTSIDE the r=98 circle, so a viewBox that stops at
       the circle clips them: at the bottom of the dial they vanished entirely.
       Give the full dial a margin of breathing room all round. The mini keeps
       the tight box, since it carries no rim markers. */
    return '<svg viewBox="' + (mini ? '0 0 200 200' : '-9 -9 218 218') + '" class="nav-dial-svg">' +
      /* the face. Transparent everywhere except Raider, where the theme paints
         it solid black so the rose reads as an instrument rather than as marks
         floating on the page */
      '<circle class="nav-dial-face" cx="100" cy="100" r="98" fill="none"/>' +
      '<circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" opacity="0.14"/>' +
      '<g class="nav-rose">' + g + '</g>' +
      /* nav-fixmark is OUTSIDE the rose, so what it marks is a spot on the
         case, not a bearing. That is what freezing north means: you note where
         north was standing and the note stays put while the dial turns under it. */
      '<g class="nav-fixmark"></g>' +
      '<circle cx="100" cy="100" r="3.2" fill="currentColor"/>' +
      /* the lubber line: fixed to the case, marking the way the phone points */
      '<polygon points="100,2 92,19 108,19" fill="var(--danger)"/>' +
      '</svg>';
  }

  /* place the sun (yellow) and moon (grey) on a rose, at their true bearing.
     A marker below the horizon is dimmed rather than hidden, so the dial still
     shows where each body is even when it has set. Returns false if there is no
     position to reckon from. */
  function placeSunMoon(dialEl, latStr, lonStr) {
    var g = dialEl && dialEl.querySelector('.nav-suns');
    if (!g) return false;
    var la = parseCoord(latStr, false), lo = parseCoord(lonStr, true);
    if (!isFinite(la) || !isFinite(lo)) { g.innerHTML = ''; return false; }
    var now = new Date();
    var sm = sunMoon(la, lo, now);
    function pt(o) { var a = o.az * Math.PI / 180; return [100 + 92 * Math.sin(a), 100 - 92 * Math.cos(a)]; }
    function dot(o, fill, stroke) {
      if (!o) return '';
      var p = pt(o);
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5.5" fill="' + fill +
        '" stroke="' + stroke + '" stroke-width="1" opacity="' + (o.alt < 0 ? 0.4 : 1) + '"/>';
    }
    var mg = '';
    if (sm.moon) {
      var p = pt(sm.moon);
      mg = moonDisc(+p[0].toFixed(1), +p[1].toFixed(1), 5.8, moonPhase(now).age, sm.moon.alt < 0);
    }
    g.innerHTML = mg + dot(sm.sun, '#f5c518', '#8a6d00');
    return true;
  }

  /* the horizontal strip compass: a linear ribbon of the same heading, with a
     fixed red centre. Built once; the tick group is translated as the heading
     changes rather than redrawn. */
  var STRIP_PPD = 3;
  function buildStrip() {
    var W = 300, H = 52, cx = W / 2, ppd = STRIP_PPD;
    var g = '';
    var CT = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    for (var d = -70; d <= 430; d += 1) {
      var maj = (d % 10 === 0), card = (d % 45 === 0);
      var x = (cx + d * ppd).toFixed(1);
      var h = card ? 22 : maj ? 15 : 9;
      g += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + h + '" stroke="currentColor" stroke-width="' +
        (card ? 1.6 : maj ? 1 : 0.6) + '" opacity="' + (card ? 0.9 : maj ? 0.55 : 0.28) + '"/>';
      if (d % 30 === 0) {
        var lbl = ((d % 360) + 360) % 360;
        g += '<text x="' + x + '" y="40" text-anchor="middle" font-size="10" fill="' +
          (CT[lbl] ? 'var(--danger)' : 'currentColor') + '" font-weight="' + (CT[lbl] ? 700 : 400) +
          '">' + (CT[lbl] || lbl) + '</text>';
      }
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="nav-strip-svg" preserveAspectRatio="xMidYMid meet">' +
      '<g class="nav-strip-g">' + g + '<g class="nav-strip-sky"></g></g>' +
      '<line x1="' + cx + '" y1="0" x2="' + cx + '" y2="' + H + '" stroke="var(--danger)" stroke-width="1.4"/>' +
      '<polygon points="' + cx + ',0 ' + (cx - 6) + ',11 ' + (cx + 6) + ',11" fill="var(--danger)"/>' +
      '</svg>';
  }

  /* the sun and moon on the strip: same true bearing, placed on the linear
     scale. Drawn at the bearing and at +/-360 so one copy is always in the
     window whatever the heading, and the SVG clips the rest. */
  function placeSunMoonStrip(stripEl, latStr, lonStr) {
    var g = stripEl && stripEl.querySelector('.nav-strip-sky');
    if (!g) return;
    var la = parseCoord(latStr, false), lo = parseCoord(lonStr, true);
    if (!isFinite(la) || !isFinite(lo)) { g.innerHTML = ''; return; }
    var now = new Date();
    var sm = sunMoon(la, lo, now);
    var cx = 150, ppd = STRIP_PPD;
    function dots(o, fill, stroke) {
      if (!o) return '';
      var s = '';
      for (var k = -1; k <= 1; k++) {
        var x = (cx + (o.az + k * 360) * ppd).toFixed(1);
        s += '<circle cx="' + x + '" cy="7" r="4" fill="' + fill + '" stroke="' + stroke +
          '" stroke-width="0.8" opacity="' + (o.alt < 0 ? 0.4 : 1) + '"/>';
      }
      return s;
    }
    /* the strip carries the same phase disc as the dial: the ribbon wraps, so
       the moon is drawn three times, once per lap */
    var mg = '';
    if (sm.moon) {
      var mAge = moonPhase(now).age;
      for (var k = -1; k <= 1; k++) {
        mg += moonDisc(+(cx + (sm.moon.az + k * 360) * ppd).toFixed(1), 7, 4.4, mAge, sm.moon.alt < 0);
      }
    }
    g.innerHTML = mg + dots(sm.sun, '#f5c518', '#8a6d00');
  }

  /* a round spirit level driven by the device tilt. The bubble moves to the
     high side, the way a real level reads. */
  function buildLevel() {
    return '<svg viewBox="0 0 92 92" class="nav-lvl-svg">' +
      '<circle cx="46" cy="46" r="43" fill="none" stroke="currentColor" opacity="0.22"/>' +
      '<circle cx="46" cy="46" r="15" fill="none" stroke="currentColor" opacity="0.3"/>' +
      '<line x1="46" y1="8" x2="46" y2="84" stroke="currentColor" opacity="0.16"/>' +
      '<line x1="8" y1="46" x2="84" y2="46" stroke="currentColor" opacity="0.16"/>' +
      '<circle class="nav-lvl-bub" cx="46" cy="46" r="9" fill="var(--ok)" opacity="0.85"/>' +
      '</svg>';
  }

  /* ══ a self-contained strip compass, for other camera tools ════════════
     Returns { el, stop }. The element is a horizontal strip that scrolls with
     the heading; with opts.angle it also shows the up/down elevation angle
     read from gravity, exactly as the clinometer does. It subscribes to the
     shared Compass source and, when asked, to devicemotion; stop() releases
     both. Exposed on A so the rangefinder (a separate file) can drop one in. */
  function makeStripCompass(opts) {
    opts = opts || {};
    var wrap = A.el('.nav-fieldstrip');
    var deg = A.el('span.nav-strip-deg', { text: '---°' });
    var read = A.el('.nav-strip-read', null, [deg]);
    var angEl = null;
    if (opts.angle) { angEl = A.el('span.nav-strip-ang', { text: '--°' }); read.appendChild(angEl); }
    var strip = A.el('.nav-strip'); strip.innerHTML = buildStrip();
    var g = strip.querySelector('.nav-strip-g');
    wrap.appendChild(read); wrap.appendChild(strip);

    var cOff = Compass.on(function (eased, real) {
      var trim = A.store.get('nav.compassOffset', 0) || 0;
      eased = N.norm360(eased + trim); real = N.norm360(real + trim);
      g.setAttribute('transform', 'translate(' + (-eased * STRIP_PPD).toFixed(1) + ' 0)');
      deg.textContent = brg(real) + '  ' + card8(real);
    });

    var mOff = null;
    if (opts.angle) {
      var onM = function (ev) {
        var gg = ev.accelerationIncludingGravity;
        if (!gg || typeof gg.y !== 'number' || typeof gg.z !== 'number' || (gg.y === 0 && gg.z === 0)) return;
        var d = Math.atan2(gg.z, gg.y) * 180 / Math.PI;
        angEl.textContent = (d >= 0 ? '+' : '') + A.fmtNum(d, 1) + '°';
      };
      window.addEventListener('devicemotion', onM, true);
      mOff = function () { window.removeEventListener('devicemotion', onM, true); };
    }
    return { el: wrap, stop: function () { try { cOff(); } catch (e) {} if (mOff) mOff(); } };
  }
  A.stripCompass = makeStripCompass;

  function toolLiveCompass(host) {
    var W = global.WMM;
    var st = A.store.get('nav.live', { lat: '', lon: '' });
    function save() { A.store.set('nav.live', st); }

    var card = A.UI.card();
    host.appendChild(card);

    var dial = A.el('.nav-dial');
    dial.innerHTML = buildDial({ unit: angleUnit() });
    card.appendChild(dial);
    var rose = dial.querySelector('.nav-rose');

    var readout = A.el('.nav-read');
    var subLine = A.el('.nav-read-v', { text: 'waiting for the compass' });
    var milText = A.el('span.nav-read-mils', { text: 'MILS ----' });

    /* the bubble level: a round spirit level */
    var lvl = A.el('.nav-lvl'); lvl.innerHTML = buildLevel();
    var lvlBub = lvl.querySelector('.nav-lvl-bub');
    var lvlTxt = A.el('.nav-lvl-txt', { text: 'level' });

    /* Under the dial: the bubble level on the left, and on the right the
       altitude line and the heading read-out with the mils line and
       true/back/var stacked under it, all pushed to the far right edge. */
    var altLine = A.el('.nav-alt-line', { text: (st.gpsAlt != null) ? (Math.round(st.gpsAlt) + ' m') : 'alt —' });
    var readCol = A.el('.nav-cmp-read', null, [altLine, readout, milText, subLine]);
    card.appendChild(A.el('.nav-cmp-row', null,
      [A.el('.nav-lvl-wrap', null, [lvl, lvlTxt]), readCol]));

    /* One button cycles the angular unit: DEG -> MIL NATO -> MIL WP -> GRAD.
       It sits in the top-right corner of the card, where altitude used to be;
       it replaced the row of unit chips that sat above the coords. */
    var UNIT_ORDER = ['deg', 'mil64', 'mil60', 'gon'];
    var UNIT_SHORT = { deg: 'DEG', mil64: 'MIL NATO', mil60: 'MIL WP', gon: 'GRAD' };
    card.appendChild(A.el('button.btn.nav-unit-btn', {
      text: UNIT_SHORT[angleUnit()],
      title: 'Switch angular unit',
      onclick: function () {
        var next = UNIT_ORDER[(UNIT_ORDER.indexOf(angleUnit()) + 1) % UNIT_ORDER.length];
        A.store.set('nav.angleUnit', next);
        A.haptic(12);
        A.Router.refresh();
      }
    }));

    /* ── lock a heading to steer on ──
       Point the phone the way you want to go and lock it. A green mark stays on
       that bearing on the dial, and the readout says which way and how far to
       turn to get back on it, until you unlock. */
    var lockText = A.el('.nav-lock-txt');
    function lockBrg() { var v = A.store.get('nav.lockBrg', null); return (typeof v === 'number' && isFinite(v)) ? v : null; }
    function placeLock() {
      var lg = dial.querySelector('.nav-lock'); if (!lg) return;
      var lb = lockBrg();
      if (lb == null) { lg.innerHTML = ''; return; }
      var a = lb * Math.PI / 180;
      var x = (100 + 92 * Math.sin(a)).toFixed(1), y = (100 - 92 * Math.cos(a)).toFixed(1);
      lg.innerHTML = '<line x1="100" y1="100" x2="' + x + '" y2="' + y + '" stroke="var(--ok)" stroke-width="1.4" opacity="0.7"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="var(--ok)"/>';
    }
    /* icon-only, tucked into the top-left corner of the compass card */
    var lockBtn = A.el('button.btn.nav-lock-btn');
    function paintLockBtn() {
      var lb = lockBrg();
      lockBtn.innerHTML = Icons.svg(lb == null ? 'target' : 'lock');
      lockBtn.title = lb == null ? 'Lock a heading' : 'Locked ' + brg(lb) + ' - tap to release';
      lockBtn.classList.toggle('on', lb != null);
    }
    lockBtn.addEventListener('click', function () {
      if (lockBrg() != null) { A.store.set('nav.lockBrg', null); }
      else {
        var h = Compass.last();
        if (h == null) { A.toast('No heading yet'); return; }
        var trim = A.store.get('nav.compassOffset', 0) || 0;
        A.store.set('nav.lockBrg', N.norm360(h + trim));
      }
      A.haptic(16); paintLockBtn(); placeLock();
    });
    paintLockBtn(); placeLock();
    card.style.position = 'relative';
    card.appendChild(lockBtn);
    card.appendChild(lockText);

    /* ── two markers on the rim, under the unit button ──

       FREEZE NORTH (red). Records the screen angle at which north is standing
       right now and pins a triangle there, on the case rather than on the rose.
       Turn the phone and the dial moves while the triangle does not, so you can
       see at a glance how far you have come round from where you started. It is
       a chinagraph mark on the glass, and it is cleared by tapping again.

       BEARING MARK (green). A degree typed in, drawn on the rose so it stays
       over that bearing on the ground as the phone turns. Different thing to the
       lock marker above, which is taken from where the phone is pointing rather
       than from a number. */
    function fixMark() { var v = A.store.get('nav.northMark', null); return (typeof v === 'number' && isFinite(v)) ? v : null; }
    function degMark() { var v = A.store.get('nav.degMark', null); return (typeof v === 'number' && isFinite(v)) ? v : null; }

    /* a triangle pointing inward at screen angle a, just outside the rim */
    function tri(a, col) {
      function pol(r, d) { var t = d * Math.PI / 180; return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)]; }
      var tip = pol(95, a), l = pol(105, a - 3.4), r = pol(105, a + 3.4);
      return '<polygon points="' + tip + ' ' + l + ' ' + r + '" fill="' + col + '"/>';
    }

    function placeFixMark() {
      var g = dial.querySelector('.nav-fixmark'); if (!g) return;
      var v = fixMark();
      g.innerHTML = v == null ? '' : tri(v, 'var(--danger)');
    }
    function placeDegMark() {
      var g = dial.querySelector('.nav-degmark'); if (!g) return;
      var v = degMark();
      g.innerHTML = v == null ? '' : tri(v, 'var(--ok)');
    }

    var northBtn = A.el('button.btn.nav-mark-btn.nav-mark-n');
    function paintNorthBtn() {
      var v = fixMark();
      northBtn.textContent = 'N';
      northBtn.title = v == null ? 'Freeze where north is now'
                                 : 'North was frozen here - tap to clear';
      northBtn.classList.toggle('on', v != null);
    }
    northBtn.addEventListener('click', function () {
      if (fixMark() != null) { A.store.set('nav.northMark', null); }
      else {
        var h = Compass.last();
        if (h == null) { A.toast('No heading yet'); return; }
        var trim = A.store.get('nav.compassOffset', 0) || 0;
        /* the rose is drawn rotated by -heading, so north sits at -heading on
           the case. Store that screen angle, not the heading. */
        A.store.set('nav.northMark', N.norm360(-(h + trim)));
      }
      A.haptic(16); paintNorthBtn(); placeFixMark();
    });

    var degBtn = A.el('button.btn.nav-mark-btn.nav-mark-d');
    function paintDegBtn() {
      var v = degMark();
      degBtn.textContent = v == null ? '°' : Math.round(v) + '°';
      degBtn.title = v == null ? 'Mark a bearing' : 'Marked ' + brg(v) + ' - tap to change or clear';
      degBtn.classList.toggle('on', v != null);
    }
    degBtn.addEventListener('click', function () {
      var cur = degMark();
      var ans = global.prompt('Bearing to mark (0-359). Leave blank to clear.',
                              cur == null ? '' : String(Math.round(cur)));
      if (ans == null) return;                       /* cancelled */
      if (!String(ans).trim()) { A.store.set('nav.degMark', null); }
      else {
        var v = A.parseNum(ans);
        if (!isFinite(v)) { A.toast('Enter a number between 0 and 359'); return; }
        A.store.set('nav.degMark', N.norm360(v));
      }
      A.haptic(16); paintDegBtn(); placeDegMark();
    });

    paintNorthBtn(); placeFixMark();
    paintDegBtn(); placeDegMark();
    card.appendChild(northBtn);
    card.appendChild(degBtn);

    /* icon-only my-position button, sits at the right of the coords fields */
    var posBtn = A.el('button.btn.ghost.nav-pos-btn', {
      html: Icons.svg('pin'), title: 'Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          st.lat = fmtLat(pos.coords.latitude);
          st.lon = fmtLon(pos.coords.longitude);
          var al = pos.coords.altitude, aa = pos.coords.altitudeAccuracy;
          st.gpsAlt = (typeof al === 'number' && isFinite(al)) ? al : null;
          st.gpsAltAcc = (typeof aa === 'number' && isFinite(aa)) ? aa : null;
          save(); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    });

    /* coords with the my-position button on the right; pulled down so they sit
       closer to the card's bottom edge instead of a wide gap of padding */
    /* Typing here used to only write the value to storage. Nothing recomputed
       until the page was left and come back to, so a hand-typed position looked
       like it had been ignored: variation stayed blank and the sun and moon
       stayed where they were. Recompute on every keystroke, and give an explicit
       Apply as well for anyone who wants to see something happen when they
       finish typing. */
    var pr = A.el('.nav-cmp-coords', { style: { marginBottom: '-6px' } });
    pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude (for variation)', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; save(); applyCoords(); } }));
    pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; save(); applyCoords(); } }));
    pr.appendChild(posBtn);
    card.appendChild(pr);
    card.appendChild(A.el('button.btn.ghost.block', {
      text: 'Apply coordinates', style: { marginTop: '8px' },
      onclick: function () {
        var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
        if (!isFinite(la) || !isFinite(lo)) { A.toast('Enter a latitude and a longitude'); return; }
        applyCoords(); A.haptic(); A.toast('Position applied');
      }
    }));

    /* redraw everything that depends on where you are */
    function applyCoords() {
      refreshSky();
      paintVariation();
    }

    function variation() {
      if (!W) return null;
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) return null;
      try { return W.declination(la, lo, new Date()); } catch (e) { return null; }
    }

    A.clear(readout);
    var mText = A.el('span.nav-read-m', { text: '---°' });
    var cText = A.el('span.nav-read-card', { text: '' });
    var milText = A.el('span.nav-read-mils', { text: 'MILS ----' });
    var tText = A.el('span.nav-read-t', { text: '' });
    readout.appendChild(mText); readout.appendChild(cText);
    readout.appendChild(milText); readout.appendChild(tText);
    var vText = subLine;

    /* ── the horizontal strip compass, its own section below ── */
    var strip = A.el('.nav-strip'); strip.innerHTML = buildStrip();
    var stripG = strip.querySelector('.nav-strip-g');
    var stripDeg = A.el('span.nav-strip-deg', { text: '---°' });
    var stripMil = A.el('span.nav-strip-mils', { text: 'MILS ----' });
    var stripRead = A.el('.nav-strip-read', null, [stripDeg, stripMil]);
    var stripCard = A.UI.card();
    stripCard.appendChild(A.el('.sec-lab', { text: 'Strip compass' }));
    stripCard.appendChild(stripRead);
    stripCard.appendChild(strip);
    host.appendChild(stripCard);

    /* the sun and moon crawl round the sky, so recompute their bearing on a
       slow timer rather than every frame */
    function refreshSky() { placeSunMoon(dial, st.lat, st.lon); placeSunMoonStrip(strip, st.lat, st.lon); }

    /* the sensor callback rewrites this line on every frame, but a position can
       be typed with no sensor running at all, so it has to be paintable on its
       own too */
    function paintVariation() {
      var h = Compass.last();
      if (h == null) return;
      var real = N.norm360(h + (A.store.get('nav.compassOffset', 0) || 0));
      var va = variation();
      if (va != null) {
        tText.textContent = brg(N.norm360(real + va)) + ' T';
        vText.textContent = 'true ' + brg(N.norm360(real + va)) + '  ·  back ' +
          brg(N.norm360(real + 180)) + '  ·  var ' + A.fmtNum(Math.abs(va), 1) + '° ' + (va >= 0 ? 'E' : 'W');
      }
    }
    refreshSky();
    var skyTimer = setInterval(refreshSky, 60000);

    var bubX = 0, bubY = 0, lastLvlTxt = '';
    var off = Compass.on(function (eased, real) {
      /* the user's own correction, applied before anything is shown */
      var trim = A.store.get('nav.compassOffset', 0) || 0;
      eased = N.norm360(eased + trim);
      real = N.norm360(real + trim);
      /* rotate the rose and scroll the strip, do not rebuild them */
      rose.setAttribute('transform', 'rotate(' + (-eased).toFixed(2) + ' 100 100)');
      stripG.setAttribute('transform', 'translate(' + (-eased * STRIP_PPD).toFixed(1) + ' 0)');

      /* the big readout is the unit the user picked; the line under it lists
         the other three, each labelled, so nothing is read in the wrong system */
      var au = angleUnit();
      mText.textContent = fmtAngle(real, au);
      cText.textContent = card8(real);
      milText.textContent = unitLine(real, au);
      stripDeg.textContent = fmtAngle(real, au) + ' ' + card8(real);
      stripMil.textContent = unitLine(real, au);

      /* the locked heading: which way and how far to turn to hold it */
      var lb = lockBrg();
      if (lb != null) {
        var turn = N.diff180(real, lb);
        lockText.textContent = 'LOCKED ' + brg(lb) + '  ·  ' +
          (Math.abs(turn) < 2 ? 'on heading' : (turn > 0 ? 'turn right ' : 'turn left ') + Math.round(Math.abs(turn)) + '°');
        lockText.style.display = '';
      } else { lockText.style.display = 'none'; }

      var va = variation();
      if (va != null) {
        tText.textContent = brg(N.norm360(real + va)) + ' T';
        vText.textContent = 'true ' + brg(N.norm360(real + va)) + '  ·  back ' +
          brg(N.norm360(real + 180)) + '  ·  var ' + A.fmtNum(Math.abs(va), 1) + '° ' + (va >= 0 ? 'E' : 'W');
      } else {
        tText.textContent = '';
        vText.textContent = 'back ' + brg(N.norm360(real + 180)) +
          '  ·  enter a position for true north and for sun & moon';
      }

      /* the spirit level, if the device reports tilt */
      var tl = Compass.tilt();
      if (tl && lvlBub) {
        var tgx = A.clamp(tl.gamma / 25, -1, 1), tgy = A.clamp(tl.beta / 25, -1, 1);
        /* heavy low-pass: the bubble settles smoothly and sits still instead of
           twitching on every noisy sensor frame */
        bubX += (tgx - bubX) * 0.08;
        bubY += (tgy - bubY) * 0.08;
        var cxv = (46 - bubX * 30).toFixed(1), cyv = (46 + bubY * 30).toFixed(1);
        var flat = Math.abs(bubX) < 0.05 && Math.abs(bubY) < 0.05;
        var fillv = flat ? 'var(--ok)' : 'var(--acc)';
        lvlBub.setAttribute('cx', cxv);
        lvlBub.setAttribute('cy', cyv);
        lvlBub.setAttribute('fill', fillv);
        for (var w = 0; w < extraBubs.length; w++) {
          if (!extraBubs[w]) continue;
          extraBubs[w].setAttribute('cx', cxv);
          extraBubs[w].setAttribute('cy', cyv);
          extraBubs[w].setAttribute('fill', fillv);
        }
        /* only rewrite the text when the whole-degree value actually changes,
           so the numbers below the bubble stop flickering too */
        var lt = 'roll ' + A.fmtNum(tl.gamma, 0) + '° · pitch ' + A.fmtNum(tl.beta, 0) + '°';
        if (lt !== lastLvlTxt) { lvlTxt.textContent = lt; lastLvlTxt = lt; }
      }
    });

    setTimeout(function () {
      if (Compass.failed()) vText.textContent = 'No compass reading: this device may have no magnetometer.';
    }, 2800);

    var altBaroOff = null;
    render._navCleanup = function () { off(); clearInterval(skyTimer); if (altBaroOff) { try { altBaroOff(); } catch (e) {} } };

    /* ── current altitude, on the line above the heading read-out ──
       GPS to begin with; if the phone has a barometer it takes over live. */
    (function () {
      var Cap = global.Capacitor;
      var Baro = (Cap && Cap.Plugins && Cap.Plugins.Barometer &&
        (typeof Cap.getPlatform !== 'function' || Cap.getPlatform() === 'android'))
        ? Cap.Plugins.Barometer : null;
      if (!Baro) return;
      var qnh = A.store.get('nav.qnh', 1013.25);
      function onBaro(d) {
        if (!d || typeof d.pressure !== 'number' || !isFinite(d.pressure)) return;
        var alt = 44330 * (1 - Math.pow(d.pressure / qnh, 1 / 5.255));
        altLine.textContent = Math.round(alt) + ' m';
      }
      Baro.available().then(function (r) {
        if (!r || !r.available) return;
        Baro.addListener('reading', onBaro); Baro.start();
        altBaroOff = function () { try { Baro.removeAllListeners(); Baro.stop(); } catch (e) {} };
      }).catch(function () {});
    })();
  }

  /* ══ ALTIMETER, on its own tab ═════════════════════════════════════════
     Barometer if the phone has one, otherwise GPS height. Returns its own
     teardown so the barometer stops when the tab is left. */
  function toolAltimeter(host) {
    var st = A.store.get('nav.live', { lat: '', lon: '' });
    var baroOff = null;
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Altimeter' }));

    c.appendChild(A.UI.metric('GPS altitude',
      (st.gpsAlt != null) ? (Math.round(st.gpsAlt) + ' m  ·  ' + Math.round(st.gpsAlt * 3.28084) + ' ft') : '—',
      st.gpsAltAcc != null ? { sub: '± ' + Math.round(st.gpsAltAcc) + ' m, from the last fix' }
                           : { sub: 'tap Use my position to read it' }));

    c.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my position',
      style: { marginTop: '4px' },
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          var al = pos.coords.altitude, aa = pos.coords.altitudeAccuracy;
          st.gpsAlt = (typeof al === 'number' && isFinite(al)) ? al : null;
          st.gpsAltAcc = (typeof aa === 'number' && isFinite(aa)) ? aa : null;
          st.lat = fmtLat(pos.coords.latitude); st.lon = fmtLon(pos.coords.longitude);
          A.store.set('nav.live', st); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    }));

    var Cap = global.Capacitor;
    var Baro = (Cap && Cap.Plugins && Cap.Plugins.Barometer &&
      (typeof Cap.getPlatform !== 'function' || Cap.getPlatform() === 'android'))
      ? Cap.Plugins.Barometer : null;

    if (Baro) {
      var qnh = A.store.get('nav.qnh', 1013.25);
      var presRow = A.UI.metric('Pressure', '—'), baltRow = A.UI.metric('Barometric altitude', '—');
      var presEl = presRow.querySelector('.metric-v'), baltEl = baltRow.querySelector('.metric-v');
      c.appendChild(presRow); c.appendChild(baltRow);
      c.appendChild(A.UI.field({
        label: 'Sea-level pressure (QNH), hPa', inputmode: 'decimal', value: qnh,
        hint: 'Set from a local report for a true altitude; 1013.25 is the standard default.',
        oninput: function (e) { var v = A.parseNum(e.target.value); if (isFinite(v) && v > 800 && v < 1100) { qnh = v; A.store.set('nav.qnh', v); } }
      }));
      function onBaro(d) {
        if (!d || typeof d.pressure !== 'number' || !isFinite(d.pressure)) return;
        var p = d.pressure;
        presEl.textContent = p.toFixed(1) + ' hPa';
        var alt = 44330 * (1 - Math.pow(p / qnh, 1 / 5.255));
        baltEl.textContent = Math.round(alt) + ' m  ·  ' + Math.round(alt * 3.28084) + ' ft';
      }
      Baro.available().then(function (r) {
        if (!r || !r.available) { presEl.textContent = 'no barometer'; baltEl.textContent = 'no barometer'; return; }
        Baro.addListener('reading', onBaro); Baro.start();
        baroOff = function () { try { Baro.removeAllListeners(); Baro.stop(); } catch (e) {} };
      }).catch(function () { presEl.textContent = 'no barometer'; baltEl.textContent = 'no barometer'; });
    } else {
      c.appendChild(A.UI.note('No barometer on this device (or not on Android): the GPS altitude above is the source. GPS height needs a clear sky view and is less steady than a barometer.'));
    }
    host.appendChild(c);
    return function () { if (baroOff) { try { baroOff(); } catch (e) {} } };
  }

  /* ══ CALIBRATION, on its own tab ═══════════════════════════════════════
     A phone magnetometer is not a compass. It reads consistently WRONG by an
     amount that depends on the phone, its case, and whatever is in your pocket.
     Android's figure-of-eight fixes the scale of the error but not a constant
     bias. So this stores the thing a real compass owner would: point it at a
     heading you KNOW, and keep the difference. One number, reversible, applied
     to every reading here and in the floating mini compass. */
  function toolCalibration(host) {
    var calState = { known: '' };
    function saveCorrection(want) {
      var raw = Compass.last();
      if (raw == null) { A.toast('No compass reading yet'); return; }
      var oldOff = A.store.get('nav.compassOffset', 0) || 0;
      var uncorrected = N.norm360(raw - oldOff);
      var delta = N.norm360(want - uncorrected);
      if (delta > 180) delta -= 360;
      A.store.set('nav.compassOffset', delta);
      A.haptic(30);
      A.toast('Corrected by ' + A.fmtNum(delta, 3) + ' deg');
      A.Router.refresh();
    }

    /* the calibration needs a live reading, so start the sensor while here */
    var off = Compass.on(function () {});

    var card = A.UI.card();
    var current = A.store.get('nav.compassOffset', 0) || 0;
    card.appendChild(A.el('.sec-lab', { text: 'Calibration' }));
    card.appendChild(A.UI.metric('Correction applied',
      (current ? (current > 0 ? '+' : '') + A.fmtNum(current, 3) + ' deg' : 'none'),
      current ? { icon: 'check' } : null));
    card.appendChild(A.el('p', {
      style: { margin: '8px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'Lay the phone flat and turn it until the top points at north on your ' +
            'reference compass. Hold it there and tap Calibrate. Whatever the phone ' +
            'reads at that moment becomes zero, and the difference is applied to ' +
            'every reading afterwards.'
    }));
    card.appendChild(A.el('button.btn.block', {
      html: Icons.svg('check') + ' Calibrate: it is pointing north',
      style: { marginTop: '10px' },
      onclick: function () { saveCorrection(0); }
    }));
    card.appendChild(A.el('.sec-lab', { text: 'Or point it at another known bearing', style: { marginTop: '16px' } }));
    card.appendChild(A.UI.field({
      label: 'The heading you are pointing at', inputmode: 'decimal', suffix: 'deg M',
      value: calState.known,
      hint: 'Magnetic. From a real compass, a known road, or a chart bearing.',
      oninput: function (e) { calState.known = e.target.value; }
    }));
    card.appendChild(A.el('button.btn.ghost.block', {
      text: 'Use that bearing instead',
      style: { marginTop: '10px' },
      onclick: function () {
        var want = A.parseNum(calState.known);
        if (!isFinite(want) || want < 0 || want >= 360) { A.toast('Enter a heading between 0 and 359'); return; }
        saveCorrection(want);
      }
    }));
    /* Always here, not only when a correction is set. A reset you can only find
       once you already have the problem is a reset nobody trusts is there. */
    card.appendChild(A.el('button.btn.ghost.block', {
      text: 'Reset calibration', style: { marginTop: '8px' },
      onclick: function () {
        if (!(A.store.get('nav.compassOffset', 0) || 0)) { A.toast('No correction to reset'); return; }
        A.store.set('nav.compassOffset', 0); A.haptic(); A.toast('Calibration reset'); A.Router.refresh();
      }
    }));
    card.appendChild(A.el('p', {
      style: { margin: '10px 0 0', lineHeight: '1.6', color: 'var(--warn)', fontSize: '13px' },
      text: 'Calibrate away from vehicles, reinforced concrete, speakers and power ' +
            'lines, all of which bend the field locally. A correction taken beside ' +
            'a car is a correction that is only right beside that car.'
    }));
    host.appendChild(card);
    host.appendChild(A.UI.note(
      'If the needle is unsteady rather than merely offset, that is the phone ' +
      'needing its own calibration: wave it in a figure of eight a few times. ' +
      'This correction fixes a CONSTANT error, not a jittery one.'));
    host.appendChild(A.UI.note(
      'A PHONE IS NOT A STEERING COMPASS. It has never been swung, it is pulled about by ' +
      'the steel around it and by anything magnetic in your pocket, and it can be several ' +
      'degrees out without showing any sign of it. Use it to orient yourself and to check ' +
      'a bearing, never to steer on and never to plot a fix that matters.'));
    return off;
  }

  /* ══ a simple compass, as a panel ═══════════════════════════════════════

     The full dial carries four concentric unit rings, the sun, the moon, a
     heading lock and two rim markers, and every one of them earns its place
     when navigating. None of them earns its place when the only question is
     "which way am I pointing right now, and is the phone flat". This is that
     much and no more, and it is a PANEL rather than a page because the place
     it is wanted is inside another tool: recording a leg means reading a
     bearing at the moment you set off down it, and sending the user to another
     screen to fetch that number is how the number gets taken at the wrong time.

     Returns its own teardown, and exposes bearing() so the host can ask what
     the needle says without listening to the sensor a second time. */
  function simpleCompassPanel(host) {
    var card = A.UI.card();
    host.appendChild(card);

    var dial = A.el('.nav-dial');
    dial.innerHTML = buildDial({ unit: 'deg', mini: true });
    card.appendChild(dial);
    var rose = dial.querySelector('.nav-rose');

    var big = A.el('.simple-deg', { text: '---°' });
    var cardTxt = A.el('.simple-card', { text: '' });
    card.appendChild(A.el('.simple-read', null, [big, cardTxt]));

    /* The same round level as the full compass, tucked into the top-left
       corner. The dial is a circle in a square card, so the corners are dead
       space; putting the bubble in one costs no height and keeps it in the
       same glance as the needle, which is the only way it gets looked at. */
    var lvl = A.el('.nav-lvl'); lvl.innerHTML = buildLevel();
    var lvlBub = lvl.querySelector('.nav-lvl-bub');
    var lvlTxt = A.el('.nav-lvl-txt', { text: 'level' });
    card.style.position = 'relative';
    card.appendChild(A.el('.nav-lvl-wrap.simple-lvl', null, [lvl, lvlTxt]));

    /* Roses belonging to other parts of the page. The sensor is listened to
       ONCE and every dial on screen is turned from that one subscription: two
       subscriptions would drift apart under smoothing and show two different
       norths on the same screen. */
    var extraRoses = [], extraBubs = [];

    var bubX = 0, bubY = 0, lastTxt = '';
    var off = Compass.on(function (eased, real) {
      var trim = A.store.get('nav.compassOffset', 0) || 0;
      eased = N.norm360(eased + trim);
      real = N.norm360(real + trim);
      var rot = 'rotate(' + (-eased).toFixed(2) + ' 100 100)';
      rose.setAttribute('transform', rot);
      for (var q = 0; q < extraRoses.length; q++) {
        if (extraRoses[q]) extraRoses[q].setAttribute('transform', rot);
      }
      big.textContent = ('00' + Math.round(real)).slice(-3) + '°';
      cardTxt.textContent = card8(real);

      var tl = Compass.tilt();
      if (tl && lvlBub) {
        var tgx = A.clamp(tl.gamma / 25, -1, 1), tgy = A.clamp(tl.beta / 25, -1, 1);
        bubX += (tgx - bubX) * 0.08;
        bubY += (tgy - bubY) * 0.08;
        lvlBub.setAttribute('cx', (46 - bubX * 30).toFixed(1));
        lvlBub.setAttribute('cy', (46 + bubY * 30).toFixed(1));
        var flat = Math.abs(bubX) < 0.05 && Math.abs(bubY) < 0.05;
        lvlBub.setAttribute('fill', flat ? 'var(--ok)' : 'var(--acc)');
        var t2 = flat ? 'level' : 'roll ' + A.fmtNum(tl.gamma, 0) + '° · pitch ' + A.fmtNum(tl.beta, 0) + '°';
        if (t2 !== lastTxt) { lvlTxt.textContent = t2; lastTxt = t2; }
      }
    });

    setTimeout(function () {
      if (Compass.failed()) cardTxt.textContent = 'no compass on this device';
    }, 2800);

    /* the leg being walked, drawn on the rose so it stays over the ground as
       the phone turns. Without it the only record of the bearing you set off on
       is a number in a list, and a number in a list cannot be compared against
       the needle at a glance. */
    var markG = dial.querySelector('.nav-degmark');
    function mark(b) {
      if (!markG) return;
      if (b == null) { markG.innerHTML = ''; return; }
      var a = b * Math.PI / 180;
      var x = (100 + 88 * Math.sin(a)).toFixed(1), y = (100 - 88 * Math.cos(a)).toFixed(1);
      markG.innerHTML =
        '<line x1="100" y1="100" x2="' + x + '" y2="' + y + '" stroke="var(--ok)" stroke-width="3" opacity="0.9"/>' +
        '<circle cx="' + x + '" cy="' + y + '" r="5" fill="var(--ok)"/>';
    }

    return {
      teardown: off,
      mark: mark,
      attachRose: function (el) { if (el) extraRoses.push(el); },
      attachLevel: function (el) { if (el) extraBubs.push(el); },
      clearRoses: function () { extraRoses.length = 0; extraBubs.length = 0; },
      bearing: function () {
        var h = Compass.last();
        if (h == null) return null;
        return N.norm360(h + (A.store.get('nav.compassOffset', 0) || 0));
      }
    };
  }

  /* ══ dogleg: the track recorder ═════════════════════════════════════════

     What dead reckoning on foot actually consists of: a distance and a bearing,
     over and over, and the discipline to write each pair down before walking
     the next one. Nothing here is clever. The value is entirely in the fact
     that the bearing is captured AT THE MOMENT the leg is set off down, from
     the compass that is on the same screen, rather than remembered afterwards.

     Set the leg distance once. Then each time you turn onto a new bearing, tap
     Record: the distance and whatever the needle reads go into the list. The
     running total underneath is the vector sum of everything recorded, which
     is your position relative to where you started - the thing you cannot work
     out in your head after the fourth turn in a whiteout. */
  /* A confirmation, because deleting a track you walked in a whiteout is not
     an action to hand to a mis-tap. The native dialog is used deliberately: it
     is modal, it cannot be dismissed by accident, and it already speaks the
     phone's own language. */
  function areYouSure(msg) {
    try { return global.confirm(msg); } catch (e) { return true; }
  }

  /* A note against a turn: what was there, why you turned, what you saw. Sixty
     characters, because it is read on a phone in the field and a paragraph
     nobody can take in at a glance is worse than nothing. Returns false if the
     user cancelled, which is not the same as clearing the note. */
  var NOTE_MAX = 60;
  function editNote(current) {
    var v;
    try { v = global.prompt('Note for this turn (' + NOTE_MAX + ' characters)', current || ''); }
    catch (e) { return false; }
    if (v == null) return false;
    v = String(v).trim().slice(0, NOTE_MAX);
    return v;
  }

  function toolDoglegTrack(host) {
    /* ONE PRESS PER TURN, and the bearing captured is the bearing of the leg
       ABOUT TO BE WALKED, not the one just finished. You stand at the corner,
       point the phone the way you are going, press, and walk. The press closes
       the leg you have just walked and opens the next one.

       The first press has nothing to close, so it only opens: it fixes ground
       zero, with a position if the phone can get one, and the bearing you are
       about to set off on. */
    var st = A.store.get('nav.track', { dist: '50', unit: 'm', pace: '', view: 'compass' });
    if (!st.unit) st.unit = 'm';
    if (!st.view) st.view = 'compass';
    function save() { A.store.set('nav.track', st); }
    function trk() { return A.store.get('nav.trk', { start: null, pending: null, legs: [] }); }
    function setTrk(v) { A.store.set('nav.trk', v); }
    function saved() { return A.store.get('nav.trkSaved', []); }
    function setSaved(v) { A.store.set('nav.trkSaved', v); }

    function paceLen() {
      var p = A.parseNum(st.pace);
      return (isFinite(p) && p > 0) ? p : null;
    }
    /* the distance in METRES, whatever the box is showing */
    function metres() {
      var v = A.parseNum(st.dist);
      if (!isFinite(v) || v <= 0) return NaN;
      if (st.unit === 'pace') {
        var p = paceLen();
        return p ? v * p : NaN;
      }
      return v;
    }

    /* THE TOP OF THE PAGE IS ONE SLOT WITH TWO THINGS IN IT. While walking a
       leg you want the needle; when you reach a turn you want to see the shape
       you have drawn so far, because that is what tells you whether the box you
       are pacing is closing. Both live in the same place and a button in the
       corner swaps them, so neither costs the other any height and the record
       button never moves. */
    var viewWrap = A.el('.trk-view');
    host.appendChild(viewWrap);

    var cmp = simpleCompassPanel(viewWrap);
    var cmpCard = viewWrap.firstChild;

    var drawCard = A.UI.card();
    var drawHost = A.el('.trk-draw');
    drawCard.appendChild(drawHost);
    var drawFoot = A.el('.trk-scale');
    drawCard.appendChild(drawFoot);
    viewWrap.appendChild(drawCard);

    /* the track, thumbnail-sized, tucked into the corner of the compass card:
       enough to see the shape closing without leaving the needle */
    var miniDraw = A.el('.trk-minidraw');
    cmpCard.appendChild(miniDraw);

    /* and the reverse: a live dial over the corner of the drawing, so the
       drawing says which way is north AND which way you are facing */
    var miniCmp = A.el('.trk-minicmp');
    miniCmp.innerHTML = buildDial({ unit: 'deg', mini: true });
    drawCard.style.position = 'relative';
    drawCard.appendChild(miniCmp);
    cmp.attachRose(miniCmp.querySelector('.nav-rose'));

    /* The drawing view hides the compass card, and with it the bubble. It has
       to come along: the moment you press Record is the moment the phone needs
       to be flat, and that moment happens on whichever view you are looking at. */
    var miniLvl = A.el('.trk-minilvl');
    miniLvl.innerHTML = buildLevel();
    drawCard.appendChild(miniLvl);
    cmp.attachLevel(miniLvl.querySelector('.nav-lvl-bub'));

    /* a plain north arrow as well, in the far corner. The dial turns, so at a
       glance it does not settle the question of which way the PAPER is oriented;
       the arrow never moves and always does. */
    var northMk = A.el('.trk-northmk');
    northMk.innerHTML =
      '<svg viewBox="0 0 40 52">' +
      '<line x1="20" y1="46" x2="20" y2="14" stroke="var(--danger)" stroke-width="2.5"/>' +
      '<polygon points="20,4 13,18 27,18" fill="var(--danger)"/>' +
      '<text x="20" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="var(--danger)">N</text>' +
      '</svg>';
    drawCard.appendChild(northMk);

    var viewBtn = A.el('button.btn.ghost.trk-viewbtn');
    viewWrap.appendChild(viewBtn);

    function applyView() {
      var drawing = st.view === 'draw';
      cmpCard.style.display = drawing ? 'none' : '';
      drawCard.style.display = drawing ? '' : 'none';
      viewBtn.textContent = drawing ? 'Compass' : 'Draw';
      viewBtn.title = drawing ? 'Back to the needle' : 'See the track so far';
    }
    viewBtn.addEventListener('click', function () {
      st.view = (st.view === 'draw') ? 'compass' : 'draw';
      save(); A.haptic(12); applyView(); paint();
    });

    /* the live picture: everything walked, plus the leg being walked now shown
       dashed, because it is not a fact yet */
    var drawZoom = { z: 1, x: 0, y: 0 };
    function paintDraw() {
      var t = trk();

      /* the thumbnail is kept current whichever view is showing, because the
         cost is one small string and the alternative is a stale picture the
         moment the user switches back */
      if (t.start && t.legs.length) {
        miniDraw.innerHTML = trackSVG(t.legs, { mini: true });
        miniDraw.style.display = '';
      } else {
        miniDraw.innerHTML = '';
        miniDraw.style.display = 'none';
      }

      if (st.view !== 'draw') return;
      if (!t.start) {
        drawHost.innerHTML = blankBoardSVG();
        drawFoot.textContent = 'Nothing to draw yet. Press Start track.';
        return;
      }
      if (!t.legs.length && !t.pending) {
        drawHost.innerHTML = blankBoardSVG();
        drawFoot.textContent = 'Ground zero set. Walk the first leg.';
        return;
      }
      var legs = t.legs.slice();
      var mm = metres();
      if (t.pending && isFinite(mm) && mm > 0) {
        legs.push({ d: mm, b: t.pending.b, u: st.unit, raw: A.parseNum(st.dist), open: true });
      }
      drawHost.innerHTML = trackSVG(legs, {
        compass: true, zoom: drawZoom.z, panX: drawZoom.x, panY: drawZoom.y
      });
      attachZoom(drawHost, drawFoot, drawZoom, paintDraw);
    }

    var setC = A.UI.card();

    /* metres or paces. In deep snow nobody measures metres, they count paces,
       and converting in your head at every leg is how the count goes wrong. */
    var unitRow = A.UI.chips(
      [{ id: 'm', label: 'Metres' }, { id: 'pace', label: 'Paces' }],
      st.unit,
      function (id) {
        /* Paces used to be refused until a pace length existed, and the box for
           typing that length only appeared once Paces was selected. There was no
           way in. Switching is now always allowed; it is RECORDING that checks,
           which is the moment the number actually has to be right. */
        st.unit = id; save(); A.Router.refresh();
      }
    );
    /* When paces are chosen the pace length has to be to hand, not at the foot
       of the page: it is the number that turns a count into a distance, and it
       is the number that changes when the ground changes. Shown in centimetres
       or inches to match the unit system already chosen in Settings, because a
       stride is a short measurement and nobody thinks of it in metres. */
    var imperial = false;
    try { imperial = (A.U && A.U.preset && A.U.preset() === 'imperial'); } catch (e) {}
    var SMALL = imperial ? 'in' : 'cm';
    var TO_M = imperial ? 0.0254 : 0.01;

    var paceIn = A.el('input.fld-in.trk-pacein', {
      type: 'text', inputmode: 'decimal', placeholder: imperial ? '30' : '75',
      value: paceLen() ? A.fmtNum(paceLen() / TO_M, 3) : '',
      autocomplete: 'off', spellcheck: 'false'
    });
    paceIn.addEventListener('input', function () {
      var v = A.parseNum(paceIn.value);
      st.pace = (isFinite(v) && v > 0) ? String(v * TO_M) : '';
      save(); paint();
    });

    if (st.unit === 'pace') {
      setC.appendChild(A.el('.trk-unitrow', null, [
        unitRow,
        A.el('.trk-pacebox', null, [
          A.el('span.trk-pacelab', { text: 'one pace' }),
          paceIn,
          A.el('span.trk-unit', { text: SMALL })
        ])
      ]));
    } else {
      setC.appendChild(unitRow);
    }

    var distIn = A.el('input.trk-dist', {
      type: 'text', inputmode: 'decimal', value: st.dist, placeholder: '50',
      autocomplete: 'off', spellcheck: 'false'
    });
    distIn.addEventListener('input', function () { st.dist = distIn.value; save(); });

    /* one metre, or one pace: the step is whatever the box is counting in */
    function step(by) {
      var v = A.parseNum(st.dist);
      if (!isFinite(v)) v = 0;
      v = Math.max(1, Math.round(v + by));
      st.dist = String(v); distIn.value = st.dist; save(); A.haptic(10); paint();
    }

    var recBtn = A.el('button.btn.trk-rec.sem-go');
    function paintBtn() {
      var t = trk();
      recBtn.textContent = t.start ? 'Record this leg' : 'Start track';
      recBtn.classList.toggle('ghost', !!t.start);
    }

    recBtn.addEventListener('click', function () {
      var d = metres();
      if (!isFinite(d) || d <= 0) {
        A.toast(st.unit === 'pace'
          ? (paceLen() ? 'Set a leg distance first' : 'Type how long one pace is, beside the Paces button')
          : 'Set a leg distance first');
        return;
      }
      var b = cmp.bearing();
      if (b == null) { A.toast('No heading yet'); return; }
      var now = new Date();
      var stamp = ('0' + now.getHours()).slice(-2) + 'h' + ('0' + now.getMinutes()).slice(-2);
      var t = trk();

      if (!t.start) {
        t.start = { b: b, t: stamp, lat: null, lon: null, ts: now.getTime() };
        t.pending = { b: b, t: stamp };
        setTrk(t);
        A.haptic(24); A.toast('Ground zero set. Walk ' + A.fmtNum(d, 0) + ' m on ' + brg(b));
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function (p) {
            var t2 = trk();
            if (t2.start) {
              t2.start.lat = p.coords.latitude; t2.start.lon = p.coords.longitude;
              setTrk(t2); paint();
            }
          }, function () {}, { enableHighAccuracy: true, timeout: 20000 });
        }
      } else {
        /* A leg has TWO bearings and both matter. The one it was walked on, and
           the one you turned onto when you got to the end of it. Recording only
           the first left the list ambiguous: you could not tell, reading it
           back, whether a row was the leg you walked or the turn you made. */
        var prev = t.pending || t.start;
        /* the turn made to get ONTO this leg, signed: positive is to the right.
           Stored rather than recomputed so that deleting an earlier leg cannot
           silently rewrite the turns you actually made. */
        var before = t.legs.length ? t.legs[t.legs.length - 1].b : t.start.b;
        t.legs.push({
          d: d, b: prev.b, bEnd: b, t: prev.t,
          turn: N.diff180(prev.b, before),
          raw: A.parseNum(st.dist), u: st.unit
        });
        t.pending = { b: b, t: stamp };
        setTrk(t);
        A.haptic(20);
        A.toast('Leg ' + t.legs.length + ' logged. Now walk ' + A.fmtNum(d, 0) + ' m on ' + brg(b));
      }
      cmp.mark(b);
      paintBtn(); paint();
    });

    setC.appendChild(A.el('span.fld-lab', { text: 'Leg distance', style: { marginTop: '10px' } }));
    setC.appendChild(A.el('.trk-row', null, [
      A.el('.trk-stepper', null, [
        A.el('button.btn.ghost.trk-step', { text: '\u2212', 'aria-label': 'Less', onclick: function () { step(-1); } }),
        distIn,
        A.el('span.trk-unit', { text: st.unit === 'pace' ? 'p' : 'm' }),
        A.el('button.btn.ghost.trk-step', { text: '+', 'aria-label': 'More', onclick: function () { step(1); } })
      ]),
      recBtn
    ]));
    host.appendChild(setC);

    var out = A.el('div');
    host.appendChild(out);

    /* the pace measurement lives at the FOOT of the page: it is set once and
       then never touched, so it must not sit between the user and the button
       they press at every turn */
    var paceC = A.UI.card();
    paceC.appendChild(A.el('.sec-lab', { text: 'Your pace' }));
    paceC.appendChild(A.el('p', {
      style: { margin: '2px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'Measure it on ground like the ground you will be on, and measure it loaded if you ' +
            'will be loaded. Walk a known distance, count the paces, and put both numbers in.'
    }));
    var pr2 = A.el('.split');
    pr2.appendChild(A.UI.field({
      label: 'Distance walked', inputmode: 'decimal', suffix: 'm', value: st.calDist || '100',
      oninput: function (e) { st.calDist = e.target.value; save(); }
    }));
    pr2.appendChild(A.UI.field({
      label: 'Paces taken', inputmode: 'numeric', value: st.calPaces || '', placeholder: '132',
      oninput: function (e) { st.calPaces = e.target.value; save(); }
    }));
    paceC.appendChild(pr2);
    paceC.appendChild(A.el('button.btn.ghost.block', {
      text: 'Set my pace from that', style: { marginTop: '8px' },
      onclick: function () {
        var d2 = A.parseNum(st.calDist), p2 = A.parseNum(st.calPaces);
        if (!isFinite(d2) || !isFinite(p2) || d2 <= 0 || p2 <= 0) { A.toast('Enter a distance and a pace count'); return; }
        st.pace = A.fmtNum(d2 / p2, 3); save(); A.haptic(); A.Router.refresh();
      }
    }));
    paceC.appendChild(A.UI.field({
      label: 'Or type it straight in', inputmode: 'decimal', suffix: 'm a pace', value: st.pace,
      placeholder: '0.75',
      oninput: function (e) { st.pace = e.target.value; save(); }
    }));
    if (paceLen()) {
      paceC.appendChild(A.UI.metric('One pace', A.fmtNum(paceLen(), 3) + ' m',
        { sub: Math.ceil(100 / paceLen()) + ' paces to 100 m' }));
    }

    /* the distance as the user actually entered it: a leg counted in paces is
       read back in paces, because that is the number they will re-walk */
    function legLabel(g) {
      if (g.u === 'pace' && isFinite(g.raw)) return A.fmtNum(g.raw, 0) + ' paces';
      return A.fmtNum(g.d, 0) + ' m';
    }

    /* how far round you turned to get onto this leg from the one before it.
       Legs recorded before this was kept fall back to working it out. */
    function turnLabel(g, idx, legs) {
      var tv = g.turn;
      if (tv == null) {
        if (idx === 0) return 'first leg';
        tv = N.diff180(g.b, legs[idx - 1].b);
      }
      if (Math.abs(tv) < 1) return 'straight on';
      return 'turned ' + Math.round(Math.abs(tv)) + '\u00b0 ' + (tv > 0 ? 'right' : 'left');
    }

    function paint() {
      A.clear(out);
      paintDraw();
      var t = trk();

      /* what the box is actually asking for, in metres, said plainly */
      var mm = metres();
      if (isFinite(mm)) {
        var eq = A.UI.card(null, 'tight');
        eq.appendChild(A.UI.metric('Each leg',
          st.unit === 'pace'
            ? A.fmtNum(A.parseNum(st.dist), 0) + ' paces  =  ' + A.fmtNum(mm, 1) + ' m'
            : A.fmtNum(mm, 0) + ' m' + (paceLen() ? '  =  ' + Math.ceil(mm / paceLen()) + ' paces' : ''),
          { sub: paceLen() ? 'at ' + A.fmtNum(paceLen(), 3) + ' m a pace' : 'no pace length set yet' }));
        out.appendChild(eq);
      }

      if (!t.start) {
        out.appendChild(A.UI.note(
          'Nothing recorded yet. Set the leg distance, stand where you want the track to begin, ' +
          'point the phone the way you are about to walk, and press Start track. That fixes ' +
          'ground zero and the bearing of the first leg. After that, one press at each turn.'));
        return;
      }

      if (t.pending) {
        cmp.mark(t.pending.b);
        var oc = A.UI.card(null, 'tight');
        oc.appendChild(A.UI.metric('Walking now', brg(t.pending.b),
          { big: true, sub: 'drawn in green on the dial. Press again at the turn, pointing the new way' }));
        out.appendChild(oc);
      }

      var c = A.UI.card();
      c.appendChild(A.el('.sec-lab', { text: 'Legs walked' }));
      var rows = A.el('.tide-evs');

      var cum = [], acc = 0;
      t.legs.forEach(function (g) { acc += g.d; cum.push(acc); });

      for (var i = t.legs.length - 1; i >= 0; i--) {
        (function (g, idx) {
          var row = A.el('.tide-ev');
          var mid = A.el('.tide-ev-mid');
          mid.appendChild(A.el('.tide-ev-t', {
            text: 'LEG ' + (idx + 1) + ': ' + legLabel(g) +
                  '   ' + brg(g.b) + (g.bEnd != null ? '  \u2192  ' + brg(g.bEnd) : '')
          }));
          mid.appendChild(A.el('.tide-ev-s', {
            text: (g.bEnd != null
                    ? 'set off on ' + brg(g.b) + ', turned onto ' + brg(g.bEnd) + ' at the end'
                    : 'set off on ' + brg(g.b) + ', track ended here') +
                  '  \u00b7  ' + turnLabel(g, idx, t.legs) +
                  '  \u00b7  ' + A.fmtNum(cum[idx], 0) + ' m from the start'
          }));
          if (g.note) mid.appendChild(A.el('.trk-note-txt', { text: g.note }));
          row.appendChild(mid);
          row.appendChild(A.el('span.tide-ev-time', { text: g.t }));
          row.appendChild(A.el('button.btn.ghost.simple-del.trk-note-btn', {
            text: '\u270e', title: 'Note for this turn',
            onclick: function () {
              var q = trk();
              var nn = editNote(q.legs[idx].note);
              if (nn === false) return;
              q.legs[idx].note = nn; setTrk(q); A.haptic(); paint();
            }
          }));
          row.appendChild(A.el('button.btn.ghost.simple-del.sem-del', {
            text: '\u00d7', title: 'Delete this leg',
            onclick: function () {
              if (!areYouSure('Delete leg ' + (idx + 1) + '?\n\n' + A.fmtNum(g.d, 0) + ' m on ' + brg(g.b) +
                              '\n\nEverything after it shifts up. This cannot be undone.')) return;
              var q = trk(); q.legs.splice(idx, 1); setTrk(q); A.haptic(); paint();
            }
          }));
          rows.appendChild(row);
        })(t.legs[i], i);
      }

      var srow = A.el('.tide-ev');
      var smid = A.el('.tide-ev-mid');
      smid.appendChild(A.el('.tide-ev-t', { text: 'START   0 m   ' + brg(t.start.b) }));
      smid.appendChild(A.el('.tide-ev-s', {
        text: 'ground zero, facing ' + brg(t.start.b) +
              (t.start.lat != null
                ? '  \u00b7  ' + fmtLat(t.start.lat) + ', ' + fmtLon(t.start.lon)
                : '  \u00b7  no position fix')
      }));
      srow.appendChild(smid);
      srow.appendChild(A.el('span.tide-ev-time', { text: t.start.t }));
      rows.appendChild(srow);
      c.appendChild(rows);

      /* saving comes FIRST of the three, because it is the one that keeps work
         and the other two throw it away */
      c.appendChild(A.el('.trk-pair', null, [
        A.el('button.btn.sem-go', {
          text: 'Record track',
          onclick: function () {
            if (!t.legs.length) { A.toast('Walk at least one leg first'); return; }
          var d = new Date();
          function p2(n) { return ('0' + n).slice(-2); }
          var name = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                     '  ' + p2(d.getHours()) + 'h' + p2(d.getMinutes());
          var list = saved();
          list.unshift({ id: 'trk' + d.getTime(), name: name, ts: d.getTime(),
                         start: t.start, legs: t.legs.slice() });
          setSaved(list);
            A.haptic(24); A.toast('Saved to Records as ' + name);
          }
        }),
        /* The last leg has no turn after it, so pressing Record would invent
           one from wherever the phone happened to be pointing. End track closes
           it on the distance already set and leaves the final bearing blank,
           which is the truth: you stopped, you did not turn. */
        A.el('button.btn.ghost', {
          text: 'End track',
          onclick: function () {
            var q = trk();
            if (!q.pending) { A.toast('The track is already ended'); return; }
            var dd = metres();
            if (!isFinite(dd) || dd <= 0) { A.toast('Set the last leg distance first'); return; }
            if (!areYouSure('End the track here?\n\nThe last leg is recorded as ' +
                            A.fmtNum(dd, 0) + ' m on ' + brg(q.pending.b) + ' with no turn after it.')) return;
            var before = q.legs.length ? q.legs[q.legs.length - 1].b : q.start.b;
            q.legs.push({
              d: dd, b: q.pending.b, bEnd: null, t: q.pending.t,
              turn: N.diff180(q.pending.b, before),
              raw: A.parseNum(st.dist), u: st.unit
            });
            q.pending = null;
            setTrk(q);
            cmp.mark(null);
            A.haptic(24); A.toast('Track ended, ' + q.legs.length + ' legs');
            paintBtn(); paint();
          }
        })
      ]));
      /* the two destructive buttons share a row: they are the same kind of
         action and putting them together keeps them together and away from the
         green one that saves */
      c.appendChild(A.el('.trk-pair', null, [
        A.el('button.btn.ghost.sem-del', {
          text: 'Undo the last leg',
          onclick: function () {
            var q = trk();
            if (!q.legs.length) { A.toast('No legs to undo'); return; }
            var last = q.legs[q.legs.length - 1];
            if (!areYouSure('Undo the last leg?\n\n' + A.fmtNum(last.d, 0) + ' m on ' + brg(last.b))) return;
            q.legs.pop(); setTrk(q); A.haptic(); paint();
          }
        }),
        A.el('button.btn.ghost.sem-del', {
          text: 'Clear the whole track',
          onclick: function () {
            var q = trk();
            if (!areYouSure('Clear the whole track?\n\n' + q.legs.length + ' leg' + (q.legs.length === 1 ? '' : 's') +
                            ' and ground zero will be deleted.\n\nSave it to Records first if you want to keep it.')) return;
            setTrk({ start: null, pending: null, legs: [] });
            cmp.mark(null);
            A.haptic(); A.toast('Track cleared'); paintBtn(); paint();
          }
        })
      ]));
      out.appendChild(c);

      if (t.legs.length) {
        var nSum = 0, eSum = 0, total = 0;
        t.legs.forEach(function (g) {
          var r = g.b * Math.PI / 180;
          nSum += g.d * Math.cos(r);
          eSum += g.d * Math.sin(r);
          total += g.d;
        });
        var straight = Math.sqrt(nSum * nSum + eSum * eSum);
        var course = N.norm360(Math.atan2(eSum, nSum) * 180 / Math.PI);

        var sc = A.UI.card(null, 'tight');
        sc.appendChild(A.el('.sec-lab', { text: 'Where you are, from where you started' }));
        sc.appendChild(A.UI.metric('Straight line back', brg(N.norm360(course + 180)) + '   ' + A.fmtNum(straight, 0) + ' m',
          { big: true, sub: 'the bearing to steer and the distance to walk to return' }));
        sc.appendChild(A.UI.metric('Straight line out', brg(course) + '   ' + A.fmtNum(straight, 0) + ' m',
          { sub: 'where you have ended up, as one leg' }));
        sc.appendChild(A.UI.metric('Ground covered', A.fmtNum(total, 0) + ' m',
          { sub: t.legs.length + ' leg' + (t.legs.length === 1 ? '' : 's') + ' walked to get ' + A.fmtNum(straight, 0) + ' m' }));
        sc.appendChild(A.UI.metric('North / east of the start',
          (nSum >= 0 ? A.fmtNum(nSum, 0) + ' m N' : A.fmtNum(-nSum, 0) + ' m S') + '   \u00b7   ' +
          (eSum >= 0 ? A.fmtNum(eSum, 0) + ' m E' : A.fmtNum(-eSum, 0) + ' m W')));
        out.appendChild(sc);
      }

      out.appendChild(A.UI.note(
        'This is dead reckoning and it DRIFTS. Every leg adds its own error in both the ' +
        'bearing and the distance, and the errors do not cancel, they accumulate. Fix your ' +
        'position against something real whenever anything real appears.'));
    }

    paintBtn();
    applyView();
    paint();
    host.appendChild(paceC);

    return cmp.teardown;
  }

  /* ══ dogleg: the saved tracks ═══════════════════════════════════════════
     A track walked and then cleared is a track that never happened. These are
     the ones that were kept: named by the moment they were saved, because that
     is the one label nobody has to think of, and renameable to something that
     means anything to you afterwards. */
  /* THE TRACK, DRAWN. A list of legs is a thing you can check; a picture is a
     thing you can recognise. The drawing is to scale, north up, with an arrow
     on each leg for the way it was walked, the distance written along it in
     the unit it was counted in, and the bearing written at every corner where
     the turn was made. Ground zero is marked, and so is where you ended up. */
  /* An EMPTY board is still a board. Returning nothing left a card with a
     stated height and no content in it, which reads as something broken rather
     than as something not started. Draw the frame, the north arrow and the
     datum, and let the emptiness be deliberate. */
  function blankBoardSVG() {
    return '<svg viewBox="0 0 320 320" class="trk-svg" data-mps="1">' +
      '<rect x="6" y="6" width="308" height="308" rx="6" fill="none" ' +
      'stroke="currentColor" stroke-width="1" opacity="0.18"/>' +
      '<line x1="16" y1="34" x2="16" y2="12" stroke="var(--danger)" stroke-width="2"/>' +
      '<polygon points="16,6 12,15 20,15" fill="var(--danger)"/>' +
      '<text x="16" y="48" text-anchor="middle" font-size="10" font-weight="700" ' +
      'fill="var(--danger)">N</text>' +
      '<circle cx="160" cy="160" r="6" fill="none" stroke="var(--ok)" ' +
      'stroke-width="1.6" stroke-dasharray="3 3"/>' +
      '<text x="160" y="184" text-anchor="middle" font-size="10" fill="var(--muted)">' +
      'nothing walked yet</text></svg>';
  }

  function trackSVG(legs, opts) {
    opts = opts || {};
    var mini = !!opts.mini;
    var zoom = (isFinite(opts.zoom) && opts.zoom > 0) ? opts.zoom : 1;
    var panX = isFinite(opts.panX) ? opts.panX : 0;
    var panY = isFinite(opts.panY) ? opts.panY : 0;
    if (!legs || !legs.length) return blankBoardSVG();
    /* the note is user text going straight into markup, so it is escaped */
    function esc(t) {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    var pts = [{ x: 0, y: 0 }], i, x = 0, y = 0;
    for (i = 0; i < legs.length; i++) {
      var r = legs[i].b * Math.PI / 180;
      x += legs[i].d * Math.sin(r);
      y -= legs[i].d * Math.cos(r);          /* screen y grows downwards */
      pts.push({ x: x, y: y });
    }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    });
    var W = 320, H = 320, pad = mini ? 16 : 44;
    var spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY);
    /* ZOOM IS BAKED INTO THE GEOMETRY, not applied as a transform to the whole
       drawing. Scaling the element scales everything on it: the labels grow,
       the arrows grow, the lines thicken, and at four times in you are reading
       enormous text over a track you still cannot separate. Multiplying only
       the metres-to-units factor moves the corners apart while the type, the
       arrowheads, the dots and the stroke widths stay the size they were
       authored - which is what makes zooming in actually reveal anything. */
    var k = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY) * zoom;
    var offX = (W - spanX * k) / 2 - minX * k + panX;
    var offY = (H - spanY * k) / 2 - minY * k + panY;
    function sx(p) { return (p.x * k + offX); }
    function sy(p) { return (p.y * k + offY); }

    var g = '';
    /* The drawing is north-up, so something has to say so. On the full drawing
       that job is done by a live compass laid over the top left corner, which
       is better than an arrow because it also shows which way the phone is
       pointing relative to the track. The miniature gets nothing: at that size
       a marker is a smudge. */
    if (!mini && !opts.compass) {
      g += '<line x1="16" y1="34" x2="16" y2="12" stroke="var(--danger)" stroke-width="2"/>' +
           '<polygon points="16,6 12,15 20,15" fill="var(--danger)"/>' +
           '<text x="16" y="48" text-anchor="middle" font-size="10" font-weight="700" fill="var(--danger)">N</text>';
    }

    for (i = 0; i < legs.length; i++) {
      var a = pts[i], b = pts[i + 1];
      var ax = sx(a), ay = sy(a), bx = sx(b), by = sy(b);
      g += '<line x1="' + ax.toFixed(1) + '" y1="' + ay.toFixed(1) + '" x2="' + bx.toFixed(1) +
           '" y2="' + by.toFixed(1) + '" stroke="var(--acc)" stroke-width="2.4" stroke-linecap="round"' +
           (legs[i].open ? ' stroke-dasharray="6 5" opacity="0.75"' : '') + '/>';

      /* the arrow sits at the middle of the leg and points the way it was walked */
      var mx = (ax + bx) / 2, my = (ay + by) / 2;
      var ang = legs[i].b;                       /* bearing, degrees */
      var asz = mini ? 0.55 : 1;
      g += '<g transform="translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ') rotate(' + ang.toFixed(1) +
           ') scale(' + asz + ')">' +
           '<polygon points="0,-8 5,5 0,2 -5,5" fill="var(--acc)"/></g>';
      if (mini) continue;

      /* the distance, written clear of the line on its left-hand side */
      var lab = (legs[i].u === 'pace' && isFinite(legs[i].raw))
        ? Math.round(legs[i].raw) + ' paces' : Math.round(legs[i].d) + ' m';
      var perp = (ang - 90) * Math.PI / 180;
      var lx = mx + Math.sin(perp) * 16, ly = my - Math.cos(perp) * 16;
      g += '<text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" ' +
           'font-size="10" font-weight="700" fill="var(--text)">' + lab + '</text>';

      /* the bearing, written at the corner the leg leaves from */
      var bl = ('00' + Math.round(legs[i].b)).slice(-3) + '\u00b0';
      g += '<text x="' + (ax + 9).toFixed(1) + '" y="' + (ay - 8).toFixed(1) + '" ' +
           'font-size="9.5" fill="var(--acc-dim)">' + bl + '</text>';
      /* the note sits beside the bearing at the corner it belongs to */
      if (legs[i].note) {
        g += '<text x="' + (ax + 9).toFixed(1) + '" y="' + (ay + 3).toFixed(1) + '" ' +
             'font-size="8.5" fill="var(--warn)">' + esc(legs[i].note) + '</text>';
      }
      g += '<circle cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="3" fill="var(--acc-dim)"/>';
    }

    var s0 = pts[0], sN = pts[pts.length - 1];
    g += '<circle cx="' + sx(s0).toFixed(1) + '" cy="' + sy(s0).toFixed(1) + '" r="' + (mini ? 4 : 6) + '" fill="var(--ok)"/>';
    g += '<circle cx="' + sx(sN).toFixed(1) + '" cy="' + sy(sN).toFixed(1) + '" r="' + (mini ? 4 : 6) + '" fill="var(--danger)"/>';
    if (!mini) {
      g += '<text x="' + (sx(s0) + 10).toFixed(1) + '" y="' + (sy(s0) + 16).toFixed(1) +
           '" font-size="10" font-weight="700" fill="var(--ok)">START</text>';
      g += '<text x="' + (sx(sN) + 10).toFixed(1) + '" y="' + (sy(sN) + 16).toFixed(1) +
           '" font-size="10" font-weight="700" fill="var(--danger)">END</text>';
    }

    /* data-mps is METRES PER SVG UNIT. The drawing is fitted to whatever the
       track happens to span, so the scale is different for every track and for
       every zoom level; carrying it on the element is the only way anything
       downstream can state it honestly. */
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="trk-svg" data-mps="' +
           (1 / k).toFixed(6) + '">' + g + '</svg>';
  }

  /* THE TRACK AS A FILE. A track that exists only inside one app on one phone
     is a track that is lost when the phone is. CSV, because it is the one format
     every spreadsheet, every GIS and every plain text editor can open without
     being asked twice, and because it stays readable opened in something that
     knows nothing about this app.

     Written with a blob and a synthetic click, which is what works inside the
     app's own web view with no file plugin. Where the file lands afterwards is
     the system's business, not ours. */
  function saveCSV(rec) {
    function q(v) {
      v = (v == null) ? '' : String(v);
      return '"' + v.replace(/"/g, '""') + '"';
    }
    var lines = [];
    lines.push(['leg', 'distance_m', 'entered', 'unit', 'bearing_deg', 'bearing_end_deg',
                'cumulative_m', 'time', 'note'].join(','));
    /* ground zero is a row, not a footnote: a file that starts at leg one has
       thrown away where the track began */
    lines.push([0, 0, 0, q((rec.legs[0] && rec.legs[0].u === 'pace') ? 'pace' : 'm'),
                rec.start ? Math.round(rec.start.b) : '', '', 0,
                q(rec.start ? rec.start.t : ''), q('START')].join(','));
    var acc = 0;
    rec.legs.forEach(function (g, i) {
      acc += g.d;
      lines.push([
        i + 1,
        Math.round(g.d * 100) / 100,
        (isFinite(g.raw) ? g.raw : ''),
        q(g.u || 'm'),
        Math.round(g.b),
        (g.bEnd != null ? Math.round(g.bEnd) : ''),
        Math.round(acc * 100) / 100,
        q(g.t || ''),
        q(g.note || '')
      ].join(','));
    });
    if (rec.start && rec.start.lat != null) {
      lines.push('');
      lines.push('start_latitude,' + rec.start.lat.toFixed(6));
      lines.push('start_longitude,' + rec.start.lon.toFixed(6));
    }

    var name = String(rec.name || 'track').replace(/[^\w\d\- ]+/g, '').replace(/\s+/g, '_') + '.csv';
    try {
      /* the byte order mark makes Excel open UTF-8 notes correctly instead of
         turning every accent into mojibake */
      var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 4000);
      A.haptic(20); A.toast('Saved ' + name);
    } catch (e) {
      A.toast('Could not write the file');
    }
  }

  /* ══ pinch to zoom, and what the scale then is ═══════════════════════════

     No buttons: two fingers to zoom, one to drag once you are in, double tap to
     go back to the whole track. The drawing is scaled with a CSS transform
     rather than by rewriting the SVG, so it stays smooth on a slow phone and
     nothing is recomputed while the fingers are down.

     THE SCALE IS AN ESTIMATE AND IS LABELLED AS ONE. A browser centimetre is a
     CSS centimetre: 96 reference pixels to the inch, which is not what any
     phone screen actually measures. It is close enough to lay a track onto a
     map by eye and nowhere near good enough to survey with, so the readout says
     "about" and the leg distances remain the thing to trust. */
  var CSS_PX_PER_CM = 96 / 2.54;

  function scaleText(svg) {
    var mps = parseFloat(svg.getAttribute('data-mps'));
    if (!isFinite(mps) || mps <= 0) return '';
    var wpx = svg.getBoundingClientRect().width;      /* already includes the zoom */
    if (!(wpx > 0)) return '';
    var metresPerCssPx = mps / (wpx / 320);
    var mPerCm = metresPerCssPx * CSS_PX_PER_CM;
    if (!isFinite(mPerCm) || mPerCm <= 0) return '';
    /* two significant figures: any more is a false claim about a screen */
    var mag = Math.pow(10, Math.floor(Math.log(mPerCm) / Math.LN10) - 1);
    var nice = Math.round(mPerCm / mag) * mag;
    var rf = Math.round(nice * 100);
    return 'about 1 cm = ' + A.fmtNum(nice, 2) + ' m   \u00b7   roughly 1:' + A.fmtNum(rf, 4);
  }

  /* The zoom LIVES IN THE CALLER'S STATE, not in here.
     The drawing is redrawn with the zoom baked into its geometry, so once a
     gesture is committed the element itself is back at scale 1. An earlier
     version kept the zoom in a local variable and reset it to 1 after every
     redraw, which quietly broke two things: the pinch clamped at a minimum of
     1 so zooming BACK OUT was arithmetically impossible, and the pan gate
     asked the local variable whether we were zoomed in, was told no, and
     refused to drag. Both now read the committed state instead, and the
     gesture only ever contributes a RATIO to it. */
  /* ══ pinch, drag and double tap on a drawing ═════════════════════════════

     The zoom LIVES IN THE CALLER'S STATE and is baked into the geometry on
     redraw, so between gestures the element itself always sits at scale 1 and
     only the drawing's own maths has changed. A gesture therefore contributes a
     RATIO on top of what is already committed, never an absolute.

     Three things were wrong with the version this replaces, and all three came
     from the same habit of trusting a single event to mean what it looked like.

     1. THE DOUBLE TAP WAS FIRING DURING PINCHES. Two fingers rarely land in the
        same millisecond, so a pinch usually begins with a one-finger
        touchstart, which was recorded as a tap. Pinch, release, pinch again
        inside a third of a second and the second pinch's first finger read as
        the second half of a double tap - and the board snapped back to fit.
        That is the "it zooms all the way out again" fault, and it was not the
        zoom maths at all. A tap now has to survive being brief, still, and
        never having had a second finger down beside it.

     2. TWO-FINGER DRAG WAS THROWN AWAY. Nobody pinches without also moving
        their hand. The old code tracked only the distance between the fingers
        and ignored where the pair had travelled, so half of every gesture went
        nowhere and the drawing appeared to wander of its own accord. The
        midpoint between the fingers is now tracked as well and moves the
        drawing exactly as one finger would.

     3. PIXELS WERE MEASURED AGAINST THE WRONG BOX. The drag is in screen
        pixels and the geometry wants drawing units, and the conversion was
        made against the flex CONTAINER rather than the SVG inside it. The
        container is the full card width and the drawing is capped narrower, so
        every drag was scaled by the ratio between them and landed short. It is
        now measured against the element that actually carries the viewBox. */
  function attachZoom(box, label, state, redraw) {
    var svg = box.querySelector('svg');
    if (!svg) { if (label) label.textContent = ''; return; }
    if (!state) state = { z: 1, x: 0, y: 0 };

    /* LISTENERS WERE PILING UP, and this was the fault that made panning look
       random. The track board repaints by replacing the SVG inside the same
       host element rather than rebuilding the host, so every repaint bound a
       fresh set of touch handlers to an element that already had some. Each
       surviving handler then committed the SAME drag into the same state
       object, so one 80-pixel pan moved the drawing 160 or 240 pixels
       depending on how many repaints had happened since the page opened -
       which from the outside is indistinguishable from the thing moving at
       random. Any previous binding on this element is torn off first. */
    if (box.__zoomOff) { try { box.__zoomOff(); } catch (e) {} box.__zoomOff = null; }

    var VB = 320;                       /* the drawing's own coordinate span */
    var Z_MAX = 12;
    var TAP_MS = 300, TAP_SLOP = 12, DBL_MS = 320;

    var gz = 1, tx = 0, ty = 0;         /* THIS gesture only */
    var mode = null;
    var startDist = 0, gzStart = 1;
    var startCx = 0, startCy = 0, txStart = 0, tyStart = 0;
    var tapLive = false, tapAt = 0, tapX = 0, tapY = 0, lastTap = 0, everMulti = false;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function base() { return (isFinite(state.z) && state.z > 0) ? state.z : 1; }
    function total() { return base() * gz; }

    /* screen pixels to drawing units, measured on the SVG itself */
    function unitsPerPx() {
      var w = svg.getBoundingClientRect().width || box.clientWidth || VB;
      return w > 0 ? VB / w : 1;
    }

    function apply() {
      svg.style.transformOrigin = '50% 50%';
      svg.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) +
        'px) scale(' + gz.toFixed(4) + ')';
      if (label) label.textContent = scaleText(svg);
    }

    function dist(t) {
      var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    /* one finger: itself. two fingers: the point between them. */
    function centre(t) {
      if (t.length < 2) return { x: t[0].clientX, y: t[0].clientY };
      return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
    }

    function repaint() {
      gz = 1; tx = 0; ty = 0;
      if (redraw) redraw();
      /* the caller may have rebuilt the whole board; take whatever is there */
      var fresh = box.querySelector('svg');
      if (fresh) { svg = fresh; svg.style.transform = ''; apply(); }
    }

    function commit() {
      var nz = clamp(total(), 1, Z_MAX);
      var f = unitsPerPx();
      var nx = (isFinite(state.x) ? state.x : 0) + tx * f;
      var ny = (isFinite(state.y) ? state.y : 0) + ty * f;
      if (nz <= 1.01) { nz = 1; nx = 0; ny = 0; }
      else {
        /* let it be dragged off centre, but never off the board */
        var lim = VB * (nz - 1) / 2 + VB * 0.2;
        nx = clamp(nx, -lim, lim); ny = clamp(ny, -lim, lim);
      }
      state.z = nz; state.x = nx; state.y = ny;
      repaint();
    }

    function fit() {
      state.z = 1; state.x = 0; state.y = 0;
      A.haptic(10);
      repaint();
    }

    function onStart(e) {
      if (e.touches.length > 1) everMulti = true;

      if (e.touches.length >= 2) {
        tapLive = false;
        mode = 'pinch';
        startDist = dist(e.touches);
        gzStart = gz;
        var c = centre(e.touches);
        startCx = c.x; startCy = c.y; txStart = tx; tyStart = ty;
        e.preventDefault();
        return;
      }

      /* a single finger might be a tap, and might be a drag. Which one it was
         is not decided here - it is decided on release. */
      if (!everMulti) {
        tapLive = true; tapAt = Date.now();
        tapX = e.touches[0].clientX; tapY = e.touches[0].clientY;
      }
      if (base() > 1.01) {
        mode = 'pan';
        var c1 = centre(e.touches);
        startCx = c1.x; startCy = c1.y; txStart = tx; tyStart = ty;
        e.preventDefault();
      }
    }

    function onMove(e) {
      if (tapLive) {
        var m = e.touches[0];
        if (m && (Math.abs(m.clientX - tapX) > TAP_SLOP || Math.abs(m.clientY - tapY) > TAP_SLOP)) {
          tapLive = false;
        }
      }

      if (mode === 'pinch' && e.touches.length >= 2) {
        var d = dist(e.touches);
        if (startDist > 0) {
          /* the ratio is free to fall below 1 - that IS zooming out. Only the
             total is held between fitting the board and twelve times in. */
          gz = clamp(gzStart * (d / startDist), 1 / base(), Z_MAX / base());
        }
        var c = centre(e.touches);
        tx = txStart + (c.x - startCx);
        ty = tyStart + (c.y - startCy);
        apply();
        e.preventDefault();
        return;
      }

      if (mode === 'pan' && e.touches.length === 1) {
        var c2 = centre(e.touches);
        tx = txStart + (c2.x - startCx);
        ty = tyStart + (c2.y - startCy);
        apply();
        e.preventDefault();
      }
    }

    function onEnd(e) {
      if (e.touches.length > 0) {
        /* a finger came off a pinch. Re-anchor on what is left rather than
           letting the drawing jump by the width of the gap. */
        if (mode === 'pinch') {
          mode = e.touches.length === 1 && base() * gz > 1.01 ? 'pan' : null;
          var c = centre(e.touches);
          startCx = c.x; startCy = c.y; txStart = tx; tyStart = ty;
          gzStart = gz;
        }
        return;
      }

      var wasTap = tapLive && !everMulti && (Date.now() - tapAt) < TAP_MS;
      var hadGesture = !!mode;
      mode = null; everMulti = false; tapLive = false;

      if (wasTap) {
        var now = Date.now();
        if (now - lastTap < DBL_MS) { lastTap = 0; fit(); return; }
        lastTap = now;
        /* a single tap changes nothing, but a gesture may still be pending */
        if (hadGesture && (gz !== 1 || tx !== 0 || ty !== 0)) commit();
        return;
      }
      if (hadGesture) commit();
    }

    function onCancel() {
      mode = null; tapLive = false; everMulti = false;
      gz = 1; tx = 0; ty = 0; apply();
    }

    box.addEventListener('touchstart', onStart, { passive: false });
    box.addEventListener('touchmove', onMove, { passive: false });
    box.addEventListener('touchend', onEnd, { passive: false });
    box.addEventListener('touchcancel', onCancel, { passive: true });
    box.__zoomOff = function () {
      box.removeEventListener('touchstart', onStart, { passive: false });
      box.removeEventListener('touchmove', onMove, { passive: false });
      box.removeEventListener('touchend', onEnd, { passive: false });
      box.removeEventListener('touchcancel', onCancel, { passive: true });
    };

    apply();
    /* the first measurement can land before layout has settled */
    setTimeout(apply, 60);
  }

  function toolDoglegRecords(host) {
    function saved() { return A.store.get('nav.trkSaved', []); }
    function setSaved(v) { A.store.set('nav.trkSaved', v); }
    function openSet() { return A.store.get('nav.trkOpen', {}); }
    function orderSet() { return A.store.get('nav.trkOrder', {}); }
    function zoomSet() { return A.store.get('nav.trkZoom', {}); }

    var out = A.el('div');
    host.appendChild(out);

    function paint() {
      A.clear(out);
      var list = saved();
      if (!list.length) {
        out.appendChild(A.UI.note(
          'No tracks saved. Walk a track on the Track tab and press Record track, and it will ' +
          'be kept here under the date and time it was saved. Nothing here is ever sent ' +
          'anywhere: it lives on this phone only.'));
        return;
      }

      list.forEach(function (r, i) {
        var nSum = 0, eSum = 0, total = 0;
        r.legs.forEach(function (g) {
          var rad = g.b * Math.PI / 180;
          nSum += g.d * Math.cos(rad);
          eSum += g.d * Math.sin(rad);
          total += g.d;
        });
        var straight = Math.sqrt(nSum * nSum + eSum * eSum);
        var course = N.norm360(Math.atan2(eSum, nSum) * 180 / Math.PI);

        var c = A.UI.card();
        c.appendChild(A.el('.sec-lab', { text: r.name }));
        c.appendChild(A.UI.metric('Straight line back', brg(N.norm360(course + 180)) + '   ' + A.fmtNum(straight, 0) + ' m',
          { big: true, sub: r.legs.length + ' leg' + (r.legs.length === 1 ? '' : 's') + ', ' + A.fmtNum(total, 0) + ' m walked' }));
        if (r.start && r.start.lat != null) {
          c.appendChild(A.UI.metric('Started at', fmtLat(r.start.lat) + ', ' + fmtLon(r.start.lon)));
        }

        /* the picture, folded away until asked for: it is the thing you want
           when checking a track and noise when scrolling a list of them */
        var op = openSet(), ord = orderSet();
        c.appendChild(A.el('.trk-pair', { style: { marginTop: '10px' } }, [
          A.el('button.btn.ghost', {
            text: ord[r.id] ? 'Last leg first' : 'First leg first',
            title: 'Reorder the list',
            onclick: function () {
              var o = orderSet(); o[r.id] = !o[r.id]; A.store.set('nav.trkOrder', o); A.haptic(); paint();
            }
          }),
          A.el('button.btn.ghost', {
            text: op[r.id] ? 'Hide the drawing' : 'Show the drawing',
            onclick: function () {
              var o = openSet(); o[r.id] = !o[r.id]; A.store.set('nav.trkOpen', o); A.haptic(); paint();
            }
          })
        ]));
        if (op[r.id]) {
          var zs = zoomSet(), zst = zs[r.id] || { z: 1, x: 0, y: 0 };
          var dbox = A.el('.trk-draw', {
            html: trackSVG(r.legs, { zoom: zst.z, panX: zst.x, panY: zst.y })
          });
          c.appendChild(dbox);
          var dsc = A.el('.trk-scale');
          c.appendChild(dsc);
          c.appendChild(A.el('.lrow-s', {
            style: { whiteSpace: 'normal', marginTop: '4px' },
            text: 'North is up. Pinch to zoom, drag to move, double tap to fit. Arrows show the ' +
                  'way each leg was walked, the figure along a leg is its length, and the figure ' +
                  'at a corner is the bearing the next leg left on.'
          }));
          /* the state object IS the stored one: attachZoom writes into it and
             we persist whatever it left there */
          (function (rid, stz) {
            attachZoom(dbox, dsc, stz, function () {
              var all = zoomSet();
              all[rid] = { z: stz.z, x: stz.x, y: stz.y };
              A.store.set('nav.trkZoom', all);
              paint();
            });
          })(r.id, zst);
        }

        var rows = A.el('.tide-evs');
        var cums = [], accum = 0;
        r.legs.forEach(function (g) { accum += g.d; cums.push(accum); });
        var order = [], q;
        for (q = 0; q < r.legs.length; q++) order.push(q);
        if (ord[r.id]) order.reverse();

        order.forEach(function (idx) {
          var g = r.legs[idx];
          var lab = (g.u === 'pace' && isFinite(g.raw)) ? A.fmtNum(g.raw, 0) + ' paces' : A.fmtNum(g.d, 0) + ' m';
          var row = A.el('.tide-ev');
          var mid = A.el('.tide-ev-mid');
          mid.appendChild(A.el('.tide-ev-t', {
            text: 'LEG ' + (idx + 1) + ': ' + lab + '   ' + brg(g.b) +
                  (g.bEnd != null ? '  \u2192  ' + brg(g.bEnd) : '')
          }));
          mid.appendChild(A.el('.tide-ev-s', { text: A.fmtNum(cums[idx], 0) + ' m from the start' }));
          if (g.note) mid.appendChild(A.el('.trk-note-txt', { text: g.note }));
          row.appendChild(mid);
          row.appendChild(A.el('span.tide-ev-time', { text: g.t }));
          /* notes stay editable after the track is filed: what a turn meant is
             often only clear once you are warm and looking at the map */
          row.appendChild(A.el('button.btn.ghost.simple-del.trk-note-btn', {
            text: '\u270e', title: 'Note for this turn',
            onclick: function () {
              var nn = editNote(g.note);
              if (nn === false) return;
              var lst = saved(); lst[i].legs[idx].note = nn; setSaved(lst); A.haptic(); paint();
            }
          }));
          rows.appendChild(row);
        });
        c.appendChild(rows);

        c.appendChild(A.el('.trk-trio', { style: { marginTop: '10px' } }, [
          A.el('button.btn.ghost.sem-go', {
            text: 'Save', title: 'Write this track out as a CSV file',
            onclick: function () { saveCSV(r); }
          }),
          A.el('button.btn.ghost', {
            text: 'Rename',
            onclick: function () {
              var nm = global.prompt('Name for this track', r.name);
              if (nm == null) return;
              nm = String(nm).trim();
              if (!nm) { A.toast('Name cannot be empty'); return; }
              var q = saved(); q[i].name = nm; setSaved(q); A.haptic(); paint();
            }
          }),
          A.el('button.btn.ghost.sem-del', {
            text: 'Delete track',
            onclick: function () {
              if (!areYouSure('Delete "' + r.name + '"?\n\n' + r.legs.length + ' leg' +
                              (r.legs.length === 1 ? '' : 's') + '. This cannot be undone.')) return;
              var q = saved(); q.splice(i, 1); setSaved(q); A.haptic(); A.toast('Deleted'); paint();
            }
          })
        ]));
        out.appendChild(c);
      });
    }
    paint();
  }

  /* ══ dogleg: the manoeuvres ═════════════════════════════════════════════

     Four ways past or around something, with the arithmetic done. All of them
     rest on the same two facts: you can hold a bearing, and you can count your
     own paces. Everything rounds UP, because a pace short of clearing the
     crevasse is worse than three paces wasted. */
  function toolDoglegInfo(host) {
    var st = A.store.get('nav.dogleg', {
      stride: '', calDist: '100', calPaces: '',
      width: '20', clear: '30', past: '60', leg: '40', spiral: '25', hexLeg: '40'
    });
    function save() { A.store.set('nav.dogleg', st); }
    function paces(m, stride) { return Math.ceil(m / stride); }

    var out = A.el('div');

    var sc = A.UI.card();
    sc.appendChild(A.el('.sec-lab', { text: 'Your pace' }));
    sc.appendChild(A.UI.field({
      label: 'Stride length', inputmode: 'decimal', suffix: 'm', value: st.stride, placeholder: '0.75',
      hint: 'One pace, heel to heel. Most people fall between 0.65 and 0.85 m on the flat.',
      oninput: function (e) { st.stride = e.target.value; save(); calc(); }
    }));
    sc.appendChild(A.el('.sec-lab', { text: 'Or measure it', style: { marginTop: '12px' } }));
    sc.appendChild(A.el('p', {
      style: { margin: '2px 0 8px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'Pace a known distance on ground like the ground you will be on, and count. Do it ' +
            'loaded if you will be loaded: a bergen takes a tenth off a stride, and deep snow ' +
            'or scree takes far more than that.'
    }));
    var cr = A.el('.split');
    cr.appendChild(A.UI.field({
      label: 'Distance walked', inputmode: 'decimal', suffix: 'm', value: st.calDist,
      oninput: function (e) { st.calDist = e.target.value; save(); }
    }));
    cr.appendChild(A.UI.field({
      label: 'Paces taken', inputmode: 'numeric', value: st.calPaces, placeholder: '132',
      oninput: function (e) { st.calPaces = e.target.value; save(); }
    }));
    sc.appendChild(cr);
    sc.appendChild(A.el('button.btn.ghost.block', {
      text: 'Set my stride from that', style: { marginTop: '8px' },
      onclick: function () {
        var d = A.parseNum(st.calDist), p = A.parseNum(st.calPaces);
        if (!isFinite(d) || !isFinite(p) || d <= 0 || p <= 0) { A.toast('Enter a distance and a pace count'); return; }
        st.stride = A.fmtNum(d / p, 3); save(); A.haptic(); A.Router.refresh();
      }
    }));
    host.appendChild(sc);

    var oc = A.UI.card();
    oc.appendChild(A.el('.sec-lab', { text: 'The obstacle' }));
    oc.appendChild(A.UI.field({
      label: 'How wide across your track', inputmode: 'decimal', suffix: 'm', value: st.width,
      hint: 'Best guess. The offsets below are suggested from it and can be overridden.',
      oninput: function (e) { st.width = e.target.value; save(); calc(); }
    }));
    host.appendChild(oc);
    host.appendChild(out);

    function legRow(list, what, count, dist) {
      var r = A.el('.tide-ev');
      var mid = A.el('.tide-ev-mid');
      mid.appendChild(A.el('.tide-ev-t', { text: what }));
      mid.appendChild(A.el('.tide-ev-s', { text: dist }));
      r.appendChild(mid);
      r.appendChild(A.el('span.tide-ev-time', { text: count }));
      list.appendChild(r);
    }

    function calc() {
      A.clear(out);
      var stride = A.parseNum(st.stride);
      if (!isFinite(stride) || stride <= 0) {
        out.appendChild(A.UI.empty('Enter or measure your stride length.'));
        return;
      }
      var width = A.parseNum(st.width);
      var suggest = isFinite(width) && width > 0 ? Math.ceil(width / 2 + 10) : null;

      var pph = A.UI.card(null, 'tight');
      pph.appendChild(A.UI.metric('Paces per 100 m', String(paces(100, stride)),
        { big: true, sub: 'at ' + A.fmtNum(stride, 3) + ' m a pace' }));
      if (suggest) {
        pph.appendChild(A.UI.metric('Suggested offset', A.fmtNum(suggest, 0) + ' m',
          { sub: 'half the obstacle plus ten metres of margin, which is ' + paces(suggest, stride) + ' paces' }));
      }
      out.appendChild(pph);

      /* ── boxing ── */
      var clear = A.parseNum(st.clear), past = A.parseNum(st.past);
      var bc = A.UI.card();
      bc.appendChild(A.el('.sec-lab', { text: 'Boxing, four 90° turns' }));
      bc.appendChild(A.el('p', {
        style: { margin: '2px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'The safe one. Ninety degrees off, along past the obstacle, ninety back by the ' +
              'same count. Its virtue is that the two side legs use the SAME count in opposite ' +
              'directions, so a miscount cancels itself and you finish on the original track ' +
              'even though the number was wrong.'
      }));
      var br = A.el('.split');
      br.appendChild(A.UI.field({
        label: 'Offset to clear it', inputmode: 'decimal', suffix: 'm', value: st.clear,
        oninput: function (e) { st.clear = e.target.value; save(); calc(); }
      }));
      br.appendChild(A.UI.field({
        label: 'Distance past it', inputmode: 'decimal', suffix: 'm', value: st.past,
        oninput: function (e) { st.past = e.target.value; save(); calc(); }
      }));
      bc.appendChild(br);
      if (isFinite(clear) && isFinite(past) && clear > 0 && past > 0) {
        var pc = paces(clear, stride), pp = paces(past, stride);
        var bl = A.el('.tide-evs');
        legRow(bl, '1. Turn 90° off the track, walk', pc + ' paces', A.fmtNum(clear, 0) + ' m');
        legRow(bl, '2. Turn 90° back onto the bearing, walk', pp + ' paces', A.fmtNum(past, 0) + ' m');
        legRow(bl, '3. Turn 90° towards the track, walk', pc + ' paces', 'the SAME count as leg 1');
        legRow(bl, '4. Turn 90° onto the bearing', '', 'you are back on the original line');
        bc.appendChild(bl);
        bc.appendChild(A.UI.metric('Made good along the track', A.fmtNum(past, 0) + ' m',
          { big: true, sub: 'only leg 2 counts into your dead reckoning' }));
        bc.appendChild(A.UI.metric('Extra walked', A.fmtNum(2 * clear, 0) + ' m',
          { sub: (2 * pc) + ' paces spent on the two side legs' }));
      }
      out.appendChild(bc);

      /* ── 60° dogleg ── */
      var leg = A.parseNum(st.leg);
      var S60 = Math.sqrt(3) / 2;
      var dc = A.UI.card();
      dc.appendChild(A.el('.sec-lab', { text: 'Dogleg, three 60° turns' }));
      dc.appendChild(A.el('p', {
        style: { margin: '2px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'The equilateral bypass. Sixty degrees off, sixty back so the middle leg runs ' +
              'parallel to the track, sixty again to close. Fewer turns and less walking than a ' +
              'box, but the two angled legs MUST match: if they do not you rejoin the track ' +
              'offset to one side and never know it.'
      }));
      dc.appendChild(A.UI.field({
        label: 'First leg', inputmode: 'decimal', suffix: 'm', value: st.leg,
        hint: 'The angled leg. Clearance comes out at sin 60°, about 0.866 of it.',
        oninput: function (e) { st.leg = e.target.value; save(); calc(); }
      }));
      if (isFinite(leg) && leg > 0) {
        var offset = leg * S60, alongLeg1 = leg * 0.5;
        var pl = paces(leg, stride);
        var bypass = isFinite(past) && past > 0 ? past : leg;
        var pb = paces(bypass, stride);
        var made = alongLeg1 + bypass + alongLeg1, walked = 2 * leg + bypass;
        var dl = A.el('.tide-evs');
        legRow(dl, '1. Turn 60° off the bearing, walk', pl + ' paces', A.fmtNum(leg, 0) + ' m');
        legRow(dl, '2. Turn 60° back, now parallel to the track, walk', pb + ' paces', A.fmtNum(bypass, 0) + ' m past the danger');
        legRow(dl, '3. Turn 60° to close, walk', pl + ' paces', 'the SAME count as leg 1');
        legRow(dl, '4. You are on the original bearing', '', 'and on the original line');
        dc.appendChild(dl);
        dc.appendChild(A.UI.metric('Clearance from the track', A.fmtNum(offset, 1) + ' m',
          { big: true, sub: A.fmtNum(leg, 0) + ' m x sin 60°, held for the whole of leg 2' }));
        dc.appendChild(A.UI.metric('Made good along the track', A.fmtNum(made, 0) + ' m',
          { sub: 'not the ' + A.fmtNum(walked, 0) + ' m you actually walked' }));
        if (isFinite(width) && width > 0) {
          dc.appendChild(A.UI.metric('Clears an obstacle up to', A.fmtNum(2 * offset, 1) + ' m wide',
            { sub: offset >= width / 2 ? 'your ' + A.fmtNum(width, 0) + ' m obstacle fits'
                                       : 'NOT ENOUGH for your ' + A.fmtNum(width, 0) + ' m obstacle: lengthen leg 1 to at least ' +
                                         A.fmtNum(width / 2 / S60, 0) + ' m' }));
        }
      }
      out.appendChild(dc);

      /* ── expanding square, the spiral ── */
      var sp = A.parseNum(st.spiral);
      var pc2 = A.UI.card();
      pc2.appendChild(A.el('.sec-lab', { text: 'Spiral, the expanding square' }));
      pc2.appendChild(A.el('p', {
        style: { margin: '2px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'Not a way past something: a way to FIND something you have dropped, lost or ' +
              'been separated from, when you know roughly where it was. Start at the datum, ' +
              'walk one unit, turn 90°, walk one unit, turn 90°, walk TWO units, and carry on ' +
              'adding a unit every second turn. The track boxes outwards and covers the ground ' +
              'evenly instead of leaving the gaps a true spiral leaves.'
      }));
      pc2.appendChild(A.UI.field({
        label: 'Search unit', inputmode: 'decimal', suffix: 'm', value: st.spiral,
        hint: 'Set it to how far you can actually see or hear. Wider than that and you walk past the thing.',
        oninput: function (e) { st.spiral = e.target.value; save(); calc(); }
      }));
      if (isFinite(sp) && sp > 0) {
        var sl = A.el('.tide-evs');
        var run = 0, unit = 1, k;
        for (k = 1; k <= 8; k++) {
          var thisLeg = sp * unit;
          run += thisLeg;
          legRow(sl, 'Leg ' + k + ', then turn 90° the same way',
            paces(thisLeg, stride) + ' paces', A.fmtNum(thisLeg, 0) + ' m');
          if (k % 2 === 0) unit++;
        }
        pc2.appendChild(sl);
        pc2.appendChild(A.UI.metric('After eight legs', A.fmtNum(run, 0) + ' m walked',
          { big: true, sub: 'covering a box about ' + A.fmtNum(sp * 3, 0) + ' m across, centred on the datum' }));
        pc2.appendChild(A.UI.note(
          'ALWAYS TURN THE SAME WAY. One turn the wrong way and the pattern folds back over ' +
          'ground you have already searched while leaving new ground untouched, and you will ' +
          'not notice. Count the legs aloud.'));
      }
      out.appendChild(pc2);

      /* ── hexagon ── */
      var hx = A.parseNum(st.hexLeg);
      var hc = A.UI.card();
      hc.appendChild(A.el('.sec-lab', { text: 'Hexagon, six 60° turns' }));
      hc.appendChild(A.el('p', {
        style: { margin: '2px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'For going right round something rather than past it: a crater, a minefield, a ' +
              'lake. Six equal legs, turning 60° the same way each time, brings you back exactly ' +
              'where you started, which makes it a closed circuit you can walk without ever ' +
              'trusting a distance. Half of it, three legs, puts you on the far side.'
      }));
      hc.appendChild(A.UI.field({
        label: 'Leg length', inputmode: 'decimal', suffix: 'm', value: st.hexLeg,
        oninput: function (e) { st.hexLeg = e.target.value; save(); calc(); }
      }));
      if (isFinite(hx) && hx > 0) {
        var ph = paces(hx, stride);
        var hl = A.el('.tide-evs');
        for (var j = 1; j <= 6; j++) {
          legRow(hl, 'Leg ' + j + ', then turn 60° the same way', ph + ' paces', A.fmtNum(hx, 0) + ' m');
        }
        hc.appendChild(hl);
        hc.appendChild(A.UI.metric('Across the hexagon', A.fmtNum(2 * hx, 0) + ' m',
          { big: true, sub: 'corner to opposite corner: the widest thing it will go round' }));
        hc.appendChild(A.UI.metric('Across the flats', A.fmtNum(hx * Math.sqrt(3), 0) + ' m',
          { sub: 'side to opposite side, the narrow way' }));
        hc.appendChild(A.UI.metric('Half a hexagon puts you', A.fmtNum(2 * hx, 0) + ' m on',
          { sub: 'three legs, ' + (3 * ph) + ' paces, and you are on the far side of the obstacle' }));
        hc.appendChild(A.UI.metric('The whole circuit', A.fmtNum(6 * hx, 0) + ' m',
          { sub: (6 * ph) + ' paces, back at the start' }));
        if (isFinite(width) && width > 0) {
          hc.appendChild(A.UI.metric('Goes round an obstacle up to', A.fmtNum(hx * Math.sqrt(3), 0) + ' m wide',
            { sub: hx * Math.sqrt(3) >= width ? 'your ' + A.fmtNum(width, 0) + ' m obstacle fits'
                                              : 'TOO SMALL for your ' + A.fmtNum(width, 0) + ' m obstacle: use legs of at least ' +
                                                A.fmtNum(width / Math.sqrt(3), 0) + ' m' }));
        }
      }
      out.appendChild(hc);

      out.appendChild(A.UI.note(
        'A stride is not a constant. It shortens uphill, in soft snow, in the dark, under load ' +
        'and when you are tired, and every one of those is present in the conditions where you ' +
        'need it most. Re-measure when the going changes, and treat a pace count as an estimate ' +
        'that drifts, not as a distance you know.'));
    }
    calc();
  }

  /* the Dogleg page: the recorder you use while walking, and the reference you
     read before you set off */
  function toolDogleg(host) {
    var sub = A.store.get('nav.doglegTab', 'track');
    if (['track', 'records', 'info'].indexOf(sub) < 0) sub = 'track';
    host.appendChild(A.UI.chips(
      [{ id: 'track', label: 'Track' }, { id: 'records', label: 'Records' }, { id: 'info', label: 'Info' }],
      sub,
      function (id) { A.store.set('nav.doglegTab', id); A.Router.refresh(); }
    ));
    var body = A.el('div');
    host.appendChild(body);
    if (sub === 'info') { toolDoglegInfo(body); return null; }
    if (sub === 'records') { toolDoglegRecords(body); return null; }
    return toolDoglegTrack(body);
  }


  /* ══ the small floating compass ═════════════════════════════════════════
     A navigator wants the heading in view while working out a course, not on
     another screen. This is the same smoothed source in a corner, faint
     enough to read the page through, and it can be dragged out of the way. */

  function miniCompass() {
    if (document.querySelector('.mini-cmp')) return;
    var W = global.WMM;

    var box = A.el('.mini-cmp');
    box.innerHTML =
      '<div class="mini-cmp-dial">' + buildDial({ mini: true }) + '</div>' +
      '<div class="mini-cmp-txt"><span class="mini-cmp-m">---°</span>' +
      '<span class="mini-cmp-t"></span></div>' +
      '<button class="mini-cmp-x" aria-label="Close">&times;</button>';
    document.body.appendChild(box);

    var rose = box.querySelector('.nav-rose');
    var mEl = box.querySelector('.mini-cmp-m');
    var tEl = box.querySelector('.mini-cmp-t');

    function variation() {
      if (!W) return null;
      var lv = A.store.get('nav.live', {});
      var la = parseCoord(lv.lat, false), lo = parseCoord(lv.lon, true);
      if (!isFinite(la) || !isFinite(lo)) {
        /* fall back to whatever position the T/M/C tab knows */
        var cp = A.store.get('nav.compass', {});
        la = parseCoord(cp.lat, false); lo = parseCoord(cp.lon, true);
      }
      if (!isFinite(la) || !isFinite(lo)) return null;
      try { return W.declination(la, lo, new Date()); } catch (e) { return null; }
    }

    var off = Compass.on(function (eased, real) {
      var trim = A.store.get('nav.compassOffset', 0) || 0;
      eased = N.norm360(eased + trim);
      real = N.norm360(real + trim);
      rose.setAttribute('transform', 'rotate(' + (-eased).toFixed(2) + ' 100 100)');
      mEl.textContent = brg(real) + 'M';
      var va = variation();
      tEl.textContent = va == null ? '' : brg(N.norm360(real + va)) + 'T';
    });

    box.querySelector('.mini-cmp-x').addEventListener('click', function (e) {
      e.stopPropagation();
      A.store.set('nav.mini', false);
      closeMini();
      A.Router.refresh();
    });

    /* draggable, because the one place it must not sit is over the field the
       user is typing into */
    var drag = null;
    box.addEventListener('touchstart', function (e) {
      if (e.target.closest('.mini-cmp-x')) return;
      var t = e.touches[0];
      var r = box.getBoundingClientRect();
      drag = { dx: t.clientX - r.left, dy: t.clientY - r.top };
    }, { passive: true });
    box.addEventListener('touchmove', function (e) {
      if (!drag) return;
      var t = e.touches[0];
      box.style.left = Math.max(4, Math.min(window.innerWidth - box.offsetWidth - 4, t.clientX - drag.dx)) + 'px';
      box.style.top = Math.max(4, Math.min(window.innerHeight - box.offsetHeight - 4, t.clientY - drag.dy)) + 'px';
      box.style.right = 'auto'; box.style.bottom = 'auto';
    }, { passive: true });
    box.addEventListener('touchend', function () { drag = null; }, { passive: true });

    box._off = off;
  }

  function closeMini() {
    var box = document.querySelector('.mini-cmp');
    if (!box) return;
    if (box._off) { try { box._off(); } catch (e) {} }
    box.remove();
  }

  /* ══ 4. course to steer against a stream ═══════════════════════════════ */

  function toolCourseToSteer(host) {
    var st = A.store.get('nav.cts', { track: '', spd: '', set: '', drift: '', leeway: '', wind: '' });
    function save() { A.store.set('nav.cts', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'The track you WANT to make good over the ground, against the water that is ' +
      'moving under you. Set is the direction the stream flows TOWARDS; drift is its ' +
      'rate. Leeway is optional: the sideways slip a beam wind gives you.'));

    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({ label: 'Track wanted', inputmode: 'decimal', suffix: '°', value: st.track,
      oninput: function (e) { st.track = e.target.value; save(); calc(); } }));
    r1.appendChild(A.UI.field({ label: 'Boat speed', inputmode: 'decimal', suffix: 'kn', value: st.spd,
      oninput: function (e) { st.spd = e.target.value; save(); calc(); } }));
    card.appendChild(r1);

    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({ label: 'Stream sets towards', inputmode: 'decimal', suffix: '°', value: st.set,
      oninput: function (e) { st.set = e.target.value; save(); calc(); } }));
    r2.appendChild(A.UI.field({ label: 'Drift rate', inputmode: 'decimal', suffix: 'kn', value: st.drift,
      oninput: function (e) { st.drift = e.target.value; save(); calc(); } }));
    card.appendChild(r2);

    var r3 = A.el('.split');
    r3.appendChild(A.UI.field({ label: 'Leeway (optional)', inputmode: 'decimal', suffix: '°', value: st.leeway,
      oninput: function (e) { st.leeway = e.target.value; save(); calc(); } }));
    r3.appendChild(A.UI.field({ label: 'Wind from (optional)', inputmode: 'decimal', suffix: '°', value: st.wind,
      oninput: function (e) { st.wind = e.target.value; save(); calc(); } }));
    card.appendChild(r3);

    var res = A.el('div');
    host.appendChild(res);

    function calc() {
      A.clear(res);
      var tr = num(st.track), sp = num(st.spd), se = num(st.set), dr = num(st.drift);
      if (!isFinite(tr) || !(sp > 0)) { res.appendChild(A.UI.note('Enter the track wanted and your boat speed.')); return; }
      if (!isFinite(se) || !isFinite(dr)) { se = 0; dr = 0; }
      var lw = num(st.leeway), wd = num(st.wind);
      var r = N.courseToSteer(tr, sp, se, dr, isFinite(lw) ? lw : 0, isFinite(wd) ? wd : null);
      if (!r) {
        res.appendChild(A.UI.note(
          'The stream is stronger across your track than your boat can answer: this track ' +
          'cannot be held at this speed. Choose a track further downstream, or wait for the ' +
          'tide. That is a real answer, and the reason it is worth working out before you go.'));
        return;
      }
      /* the vector triangle, drawn */
      var dia = A.el('.tk-wrap');
      dia.innerHTML = vectorTriangleSVG(tr, sp, se, dr, r);
      res.appendChild(dia);
      var key = A.el('.tk-key');
      [['tk-k-stbd', 'course to steer'], ['tk-k-wind', 'the stream'], ['tk-k-mark', 'track made good']]
        .forEach(function (k) {
          var it = A.el('span.tk-key-it');
          it.appendChild(A.el('i.' + k[0]));
          it.appendChild(A.el('span', { text: k[1] }));
          key.appendChild(it);
        });
      res.appendChild(key);

      var c = A.UI.card(null, 'tight');
      out(c, 'Course to steer', brg(r.course) + ' true', 'through the water');
      if (isFinite(lw) && lw && isFinite(wd)) out(c, 'Heading, allowing leeway', brg(r.heading) + ' true');
      out(c, 'Speed over ground', kn(r.speedOverGround),
        r.speedOverGround > sp ? 'the stream is helping you along' : 'the stream is costing you');
      out(c, 'Offset applied', deg(Math.abs(r.correction)) + (r.correction >= 0 ? ' to port' : ' to starboard'),
        'how far you aim off the track to hold it');
      out(c, 'Stream across your track', kn(Math.abs(dr * Math.sin((se - tr) * Math.PI / 180))),
        'the part of the stream you are fighting');
      out(c, 'Stream along your track', kn(dr * Math.cos((se - tr) * Math.PI / 180)),
        'the part that helps or hinders');
      res.appendChild(c);

      /* a passage table: the number a navigator actually writes down */
      res.appendChild(A.UI.section('Time and distance on this leg'));
      var t = A.UI.card(null, 'tight');
      [1, 2, 5, 10, 20].forEach(function (d) {
        t.appendChild(A.UI.metric(d + ' NM along the track', hoursHM(d / r.speedOverGround),
          { sub: 'through the water: ' + nm(sp * d / r.speedOverGround, 2) }));
      });
      res.appendChild(t);
      res.appendChild(A.UI.note(
        'The distance through the water differs from the distance over the ground whenever there ' +
        'is a stream, which is why the log and the chart disagree. Plan on the ground distance ' +
        'and expect the log to read differently.'));
    }
    calc();
  }

  /* The course-to-steer triangle, drawn to scale. Three vectors: what you
     steer through the water, what the stream does to you, and the track that
     results. Seeing it settles the question of which way to aim off far
     faster than any amount of text. */
  function vectorTriangleSVG(track, boatSpeed, set, drift, r) {
    var W = 260, H = 210, cx = 60, cy = 165;
    /* scale so the longest vector fits */
    var span = Math.max(boatSpeed, drift, r.speedOverGround) || 1;
    var k = 120 / span;
    function v(brgDeg, len) {
      var a = brgDeg * Math.PI / 180;
      return [len * k * Math.sin(a), -len * k * Math.cos(a)];
    }
    var water = v(r.course, boatSpeed);          /* what you steer */
    var stream = v(set, drift);                  /* what the water does */
    var ground = [water[0] + stream[0], water[1] + stream[1]];

    function ln(x1, y1, x2, y2, cls, w, arrow) {
      var out = '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
                '" y2="' + y2.toFixed(1) + '" class="' + cls + '" stroke-width="' + (w || 2.5) + '"/>';
      if (arrow) {
        var ang = Math.atan2(y2 - y1, x2 - x1);
        var s = 7;
        var a1 = ang + 2.6, a2 = ang - 2.6;
        out += '<polygon points="' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ' +
               (x2 + s * Math.cos(a1)).toFixed(1) + ',' + (y2 + s * Math.sin(a1)).toFixed(1) + ' ' +
               (x2 + s * Math.cos(a2)).toFixed(1) + ',' + (y2 + s * Math.sin(a2)).toFixed(1) +
               '" class="' + cls + '-h"/>';
      }
      return out;
    }

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="tri-svg">' +
      ln(cx, cy, cx + water[0], cy + water[1], 'tk-stbd', 3, true) +
      ln(cx + water[0], cy + water[1], cx + ground[0], cy + ground[1], 'tk-wind', 3, true) +
      ln(cx, cy, cx + ground[0], cy + ground[1], 'tk-mark', 2, true) +
      '<circle cx="' + cx + '" cy="' + cy + '" r="4" class="tk-boat"/>' +
      '<text x="' + (cx + water[0] / 2 + 6).toFixed(1) + '" y="' + (cy + water[1] / 2).toFixed(1) +
      '" class="tri-lab">steer ' + brg(r.course) + '</text>' +
      '<text x="' + (cx + water[0] + stream[0] / 2 + 6).toFixed(1) + '" y="' +
      (cy + water[1] + stream[1] / 2).toFixed(1) + '" class="tri-lab">stream ' + drift.toFixed(1) + ' kn</text>' +
      '<text x="' + (cx + ground[0] / 2 - 4).toFixed(1) + '" y="' + (cy + ground[1] / 2 + 14).toFixed(1) +
      '" class="tri-lab">track ' + brg(track) + '</text>' +
      '</svg>';
  }

  /* ══ 5. estimated position ═════════════════════════════════════════════ */

  function toolEP(host) {
    var st = A.store.get('nav.ep', { lat: '', lon: '', crs: '', spd: '', hrs: '', set: '', drift: '' });
    function save() { A.store.set('nav.ep', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'From a known position, run the course steered for the time elapsed to get the ' +
      'dead-reckoning position, then apply the stream to get the estimated position. ' +
      'An EP is a considered guess, not a fix: take a fix when one is available.'));

    var r0 = A.el('.split');
    r0.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '50.20833',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));
    r0.appendChild(A.UI.field({ label: 'Longitude', value: st.lon, placeholder: '005 10.0 W',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); } }));
    card.appendChild(r0);

    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({ label: 'Course steered', inputmode: 'decimal', suffix: '°', value: st.crs,
      oninput: function (e) { st.crs = e.target.value; save(); calc(); } }));
    r1.appendChild(A.UI.field({ label: 'Speed', inputmode: 'decimal', suffix: 'kn', value: st.spd,
      oninput: function (e) { st.spd = e.target.value; save(); calc(); } }));
    card.appendChild(r1);

    card.appendChild(A.UI.field({ label: 'Time run (hours)', inputmode: 'decimal', value: st.hrs,
      placeholder: '1.5', oninput: function (e) { st.hrs = e.target.value; save(); calc(); } }));

    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({ label: 'Stream sets towards', inputmode: 'decimal', suffix: '°', value: st.set,
      oninput: function (e) { st.set = e.target.value; save(); calc(); } }));
    r2.appendChild(A.UI.field({ label: 'Drift rate', inputmode: 'decimal', suffix: 'kn', value: st.drift,
      oninput: function (e) { st.drift = e.target.value; save(); calc(); } }));
    card.appendChild(r2);

    var res = A.el('div');
    host.appendChild(res);

    function calc() {
      A.clear(res);
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      var cr = num(st.crs), sp = num(st.spd), hr = num(st.hrs);
      if (!isFinite(la) || !isFinite(lo) || !isFinite(cr) || !isFinite(sp) || !isFinite(hr)) {
        res.appendChild(A.UI.note('Enter the position, the course steered, the speed and the time.')); return;
      }
      var se = num(st.set) || 0, dr = num(st.drift) || 0;
      var r = N.estimatedPosition(la, lo, cr, sp, hr, se, dr);
      var c = A.UI.card(null, 'tight');
      out(c, 'DR position', fmtLat(r.dr.lat) + '   ' + fmtLon(r.dr.lon), 'course and distance only');
      if (dr) {
        out(c, 'Estimated position', fmtLat(r.lat) + '   ' + fmtLon(r.lon), 'stream applied');
        out(c, 'Track made good', brg(r.trackMadeGood) + ' true');
        out(c, 'Distance made good', nm(r.distanceMadeGood, 2));
        out(c, 'Speed made good', kn(r.speedMadeGood));
      }
      res.appendChild(c);
    }
    calc();
  }

  /* ══ tacking to windward ═══════════════════════════════════════════════ */

  /* ── the boat, drawn heading a given way with her sails trimmed ──
     The sails are the point of the picture. A sail is not fixed to the boat:
     it is let out or hauled in according to the angle of the wind, and where
     it sits tells you at a glance which tack you are on and how hard you are
     working to windward. Close-hauled the boom is nearly on the centreline;
     on a beam reach it is well out; running it is squared right off.

     Sheeting angle here follows the true wind angle at roughly a third of it,
     capped at eighty degrees, which is what a well-trimmed boat looks like. */
  function boatSVG(headingDeg, windFromDeg, scale, label) {
    var k = scale || 1;
    var twa = N.diff180(headingDeg, windFromDeg);   /* wind angle off the bow */
    var side = twa >= 0 ? 1 : -1;                   /* + wind on starboard */
    var absT = Math.abs(twa);
    /* the boom swings to the LEEWARD side, away from the wind */
    var boom = -side * Math.min(80, Math.max(8, absT / 3 + 4));

    var hull =
      '<path d="M 0,-30 C 7,-14 9,4 7,20 L -7,20 C -9,4 -7,-14 0,-30 Z" ' +
      'class="bt-hull"/>';
    var deck = '<line x1="0" y1="-26" x2="0" y2="18" class="bt-deck"/>';

    /* mainsail: a curved triangle hanging off the boom */
    var main =
      '<g transform="rotate(' + boom.toFixed(1) + ')">' +
      '<path d="M 0,-16 C ' + (6 * side).toFixed(1) + ',-4 ' + (7 * side).toFixed(1) +
      ',6 ' + (2 * side).toFixed(1) + ',15 L 0,15 Z" class="bt-main"/>' +
      '<line x1="0" y1="-16" x2="0" y2="15" class="bt-boom"/>' +
      '</g>';

    /* headsail: sits forward, trimmed a little tighter than the main */
    var jibA = -side * Math.min(70, Math.max(6, absT / 3.4 + 2));
    var jib =
      '<g transform="translate(0,-16) rotate(' + jibA.toFixed(1) + ')">' +
      '<path d="M 0,-12 C ' + (5 * side).toFixed(1) + ',-4 ' + (6 * side).toFixed(1) +
      ',3 ' + (1.5 * side).toFixed(1) + ',10 L 0,10 Z" class="bt-jib"/>' +
      '</g>';

    var lab = label ? '<text x="0" y="34" text-anchor="middle" class="bt-lab">' + label + '</text>' : '';

    return '<g transform="rotate(' + headingDeg.toFixed(1) + ') scale(' + k + ')">' +
           hull + deck + main + jib + lab + '</g>';
  }

  /* the picture: wind, no-go zone, both tacks with a boat on each, the mark */
  function tackDiagram(t, markDist) {
    var cx = 140, cy = 145, R = 112;
    function pt(brgDeg, rad) {
      var a = brgDeg * Math.PI / 180;
      return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
    }
    function line(brgDeg, r0, r1, cls, w) {
      var p0 = pt(brgDeg, r0), p1 = pt(brgDeg, r1);
      return '<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) +
             '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) +
             '" class="' + cls + '" stroke-width="' + (w || 2) + '"/>';
    }

    /* the no-go wedge */
    var s0 = pt(t.noGoFrom, R), s1 = pt(t.noGoTo, R);
    var large = t.noGoWidth > 180 ? 1 : 0;
    var wedge = '<path d="M ' + cx + ' ' + cy + ' L ' + s0[0].toFixed(1) + ' ' + s0[1].toFixed(1) +
                ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + s1[0].toFixed(1) + ' ' + s1[1].toFixed(1) +
                ' Z" class="tk-nogo"/>';
    var nogoTxt = '';
    var midNoGo = pt(t.windFrom, R * 0.55);
    nogoTxt = '<text x="' + midNoGo[0].toFixed(1) + '" y="' + midNoGo[1].toFixed(1) +
              '" text-anchor="middle" class="tk-nogo-t">NO GO</text>';

    /* compass ring */
    var ring = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" class="tk-ring"/>';
    var ticks = '';
    for (var d = 0; d < 360; d += 30) {
      var q0 = pt(d, R - 8), q1 = pt(d, R);
      ticks += '<line x1="' + q0[0].toFixed(1) + '" y1="' + q0[1].toFixed(1) + '" x2="' + q1[0].toFixed(1) +
               '" y2="' + q1[1].toFixed(1) + '" class="tk-tick"/>';
    }
    var np = pt(0, R - 18);
    ticks += '<text x="' + np[0].toFixed(1) + '" y="' + (np[1] + 4).toFixed(1) +
             '" text-anchor="middle" class="tk-n">N</text>';

    /* wind: an arrow outside the ring blowing inward, with barbs */
    var w0 = pt(t.windFrom, R + 30), w1 = pt(t.windFrom, R + 4);
    var wind = '<line x1="' + w0[0].toFixed(1) + '" y1="' + w0[1].toFixed(1) + '" x2="' + w1[0].toFixed(1) +
               '" y2="' + w1[1].toFixed(1) + '" class="tk-wind" stroke-width="3"/>';
    var wh = pt(t.windFrom, R + 4), wl = pt(t.windFrom + 6, R + 20), wr = pt(t.windFrom - 6, R + 20);
    wind += '<polygon points="' + wh[0].toFixed(1) + ',' + wh[1].toFixed(1) + ' ' +
            wl[0].toFixed(1) + ',' + wl[1].toFixed(1) + ' ' + wr[0].toFixed(1) + ',' + wr[1].toFixed(1) +
            '" class="tk-wind-head"/>';
    var wt = pt(t.windFrom, R + 42);
    wind += '<text x="' + wt[0].toFixed(1) + '" y="' + wt[1].toFixed(1) +
            '" text-anchor="middle" class="tk-wind-t">WIND</text>';

    /* the two tacks, each with a boat on it under sail */
    var tracks = line(t.starboardTrack, 0, R - 6, 'tk-stbd', 2.5) +
                 line(t.portTrack, 0, R - 6, 'tk-port', 2.5);

    var bs = pt(t.starboardHeading, R * 0.52);
    var bp = pt(t.portHeading, R * 0.52);
    var boats =
      '<g transform="translate(' + bs[0].toFixed(1) + ',' + bs[1].toFixed(1) + ')" class="bt-stbd">' +
      boatSVG(t.starboardHeading, t.windFrom, 0.62, 'STBD') + '</g>' +
      '<g transform="translate(' + bp[0].toFixed(1) + ',' + bp[1].toFixed(1) + ')" class="bt-port">' +
      boatSVG(t.portHeading, t.windFrom, 0.62, 'PORT') + '</g>';

    /* the mark */
    var mark = '';
    if (isFinite(t.markBearing)) {
      var mp = pt(t.markBearing, R - 6);
      mark += line(t.markBearing, 0, R - 6, 'tk-mark', 1.5);
      mark += '<circle cx="' + mp[0].toFixed(1) + '" cy="' + mp[1].toFixed(1) + '" r="6" class="tk-mark-dot"/>';
      var mt = pt(t.markBearing, R - 22);
      mark += '<text x="' + mt[0].toFixed(1) + '" y="' + mt[1].toFixed(1) +
              '" text-anchor="middle" class="tk-mark-t">MARK</text>';
    }

    return '<svg viewBox="0 0 280 300" class="tk-svg">' +
      wedge + nogoTxt + ring + ticks + tracks + mark + boats + wind +
      '</svg>';
  }

  /* a single boat on its own, for the points-of-sail explainer */
  function pointsOfSailSVG(twa) {
    var cx = 90, cy = 90;
    return '<svg viewBox="0 0 180 180" class="pos-svg">' +
      '<circle cx="90" cy="90" r="72" class="tk-ring"/>' +
      '<g transform="translate(90,90)">' + boatSVG(0, twa, 1.15, null) + '</g>' +
      /* the wind, coming from the angle given */
      (function () {
        var a = twa * Math.PI / 180;
        var x0 = cx + 86 * Math.sin(a), y0 = cy - 86 * Math.cos(a);
        var x1 = cx + 46 * Math.sin(a), y1 = cy - 46 * Math.cos(a);
        return '<line x1="' + x0.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + x1.toFixed(1) +
               '" y2="' + y1.toFixed(1) + '" class="tk-wind" stroke-width="2.5"/>';
      })() +
      '</svg>';
  }

  function toolTacking(host) {
    var st = A.store.get('nav.tack', {
      wind: '', ws: '', ch: '45', spd: '', mark: '', dist: '', leeway: '0', aws: '', awa: ''
    });
    function save() { A.store.set('nav.tack', st); }

    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'A boat cannot sail at the wind. Inside the no-go zone there is no drive, so a mark ' +
      'to windward is reached by tacking. Everything here follows from the CLOSE-HAULED ' +
      'ANGLE: how close to the true wind your boat actually holds and still moves. A racing ' +
      'keelboat manages about 35°, a cruising yacht 45°, a heavy long-keeler 50° or worse, ' +
      'and every one of them does better in flat water than in a seaway.'));

    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({ label: 'True wind from', inputmode: 'decimal', suffix: '°', value: st.wind,
      oninput: function (e) { st.wind = e.target.value; save(); calc(); } }));
    r1.appendChild(A.UI.field({ label: 'True wind speed', inputmode: 'decimal', suffix: 'kn', value: st.ws,
      oninput: function (e) { st.ws = e.target.value; save(); calc(); } }));
    card.appendChild(r1);

    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({ label: 'Close-hauled angle', inputmode: 'decimal', suffix: '°', value: st.ch,
      placeholder: '45', oninput: function (e) { st.ch = e.target.value; save(); calc(); } }));
    r2.appendChild(A.UI.field({ label: 'Boat speed', inputmode: 'decimal', suffix: 'kn', value: st.spd,
      oninput: function (e) { st.spd = e.target.value; save(); calc(); } }));
    card.appendChild(r2);

    var r3 = A.el('.split');
    r3.appendChild(A.UI.field({ label: 'Bearing to the mark', inputmode: 'decimal', suffix: '°', value: st.mark,
      oninput: function (e) { st.mark = e.target.value; save(); calc(); } }));
    r3.appendChild(A.UI.field({ label: 'Distance to the mark', inputmode: 'decimal', suffix: 'NM', value: st.dist,
      oninput: function (e) { st.dist = e.target.value; save(); calc(); } }));
    card.appendChild(r3);

    card.appendChild(A.UI.field({ label: 'Leeway (the slip to leeward)', inputmode: 'decimal', suffix: '°',
      value: st.leeway, placeholder: '0',
      oninput: function (e) { st.leeway = e.target.value; save(); calc(); } }));

    var res = A.el('div');
    host.appendChild(res);

    function calc() {
      A.clear(res);
      var wd = num(st.wind), ch = num(st.ch), sp = num(st.spd);
      var mk = num(st.mark), di = num(st.dist), lw = num(st.leeway) || 0;
      if (!isFinite(wd) || !(ch > 0)) {
        res.appendChild(A.UI.note('Enter the wind direction and your close-hauled angle.')); return;
      }
      var t = N.tacking(wd, ch, sp > 0 ? sp : 1, isFinite(mk) ? mk : NaN, di, lw);

      /* the diagram */
      var dia = A.el('.tk-wrap');
      dia.innerHTML = tackDiagram(t, di);
      res.appendChild(dia);
      var key = A.el('.tk-key');
      [['tk-k-wind', 'wind'], ['tk-k-nogo', 'no-go zone'], ['tk-k-stbd', 'starboard tack'],
       ['tk-k-port', 'port tack'], ['tk-k-mark', 'mark']].forEach(function (k) {
        var it = A.el('span.tk-key-it');
        it.appendChild(A.el('i.' + k[0]));
        it.appendChild(A.el('span', { text: k[1] }));
        key.appendChild(it);
      });
      res.appendChild(key);

      /* the numbers */
      var c = A.UI.card(null, 'tight');
      out(c, 'No-go zone', brg(t.noGoFrom) + ' to ' + brg(t.noGoTo),
        deg(t.noGoWidth, 0) + ' wide' + (lw ? ', including ' + deg(lw, 0) + ' of leeway' : ''));
      out(c, 'Starboard tack', brg(t.starboardHeading) + ' heading',
        lw ? 'making good ' + brg(t.starboardTrack) : 'wind on the starboard bow');
      out(c, 'Port tack', brg(t.portHeading) + ' heading',
        lw ? 'making good ' + brg(t.portTrack) : 'wind on the port bow');
      if (sp > 0) out(c, 'Speed made good to windward', kn(t.vmg),
        'what you actually gain towards the wind at ' + kn(sp));
      res.appendChild(c);

      if (!isFinite(mk)) {
        res.appendChild(A.UI.note('Add the bearing to your mark to see whether you can lay it, and what the tacks cost.'));
        return;
      }

      if (t.layable) {
        res.appendChild(A.UI.section('You can lay it'));
        var lc = A.UI.card(null, 'tight');
        out(lc, 'Steer', brg(mk) + ' true', 'the mark is outside the no-go zone');
        out(lc, 'Clear of the no-go edge by',
          deg(Math.abs(t.markOffWind) - (ch + lw), 1), 'margin before you are pinched');
        if (di > 0 && sp > 0) out(lc, 'Time to the mark', hoursHM(di / sp));
        res.appendChild(lc);
        res.appendChild(A.UI.note(
          'Sail it directly. Watch the margin: a header of more than that many degrees puts the ' +
          'mark inside the no-go zone and you will be tacking after all.'));
        return;
      }

      res.appendChild(A.UI.section('The mark is to windward - you must tack'));
      if (t.totalDistance == null) {
        res.appendChild(A.UI.note('Add the distance to the mark and your boat speed to work out the legs.'));
        return;
      }
      var tc = A.UI.card(null, 'tight');
      out(tc, 'Take the long tack first', t.longTack === 'port' ? 'PORT tack, ' + brg(t.portHeading) : 'STARBOARD tack, ' + brg(t.starboardHeading),
        'it keeps you nearest the rhumb line, so a shift costs less');
      out(tc, 'Long leg', nm(t.longTackLeg, 2), sp > 0 ? hoursHM(t.longTackLeg / sp) : null);
      out(tc, 'Short leg', nm(t.shortTackLeg, 2), sp > 0 ? hoursHM(t.shortTackLeg / sp) : null);
      out(tc, 'Total through the water', nm(t.totalDistance, 2),
        'against ' + nm(di, 2) + ' straight line');
      out(tc, 'Extra distance beating', nm(t.extraDistance, 2),
        A.fmtNum(100 * t.extraDistance / di, 3) + ' % more than the direct route');
      if (sp > 0) out(tc, 'Time on this beat', hoursHM(t.totalTime),
        'against ' + hoursHM(t.directTime) + ' if you could sail straight at it');
      res.appendChild(tc);

      var ll = N.laylines(wd, ch, lw);
      var lyc = A.UI.card(null, 'tight');
      out(lyc, 'Starboard layline', brg(ll.starboard), 'bearing from the mark');
      out(lyc, 'Port layline', brg(ll.port), 'bearing from the mark');
      res.appendChild(lyc);
      res.appendChild(A.UI.note(
        'The laylines are the bearings along which you can finally lay the mark close-hauled. ' +
        'Tack when you cross one. Going past it - overstanding - is distance sailed for nothing, ' +
        'and it is the commonest way to lose ground on a beat. Two tacks is the theoretical ' +
        'minimum; in a shifting wind more, shorter tacks near the rhumb line are safer than ' +
        'committing to one long board.'));

      pointsOfSail(res, ch);
    }
    calc();
  }

  /* the points of sail, drawn: the same boat at each angle to the wind, with
     her sails trimmed as they would actually be */
  function pointsOfSail(host, closeHauled) {
    host.appendChild(A.UI.section('Points of sail'));
    var pts = [
      [0, 'In irons', 'Head to wind. No drive at all, and no steerage: the boat stops and starts to go backwards.'],
      [closeHauled || 45, 'Close-hauled', 'As close to the wind as she will go. Sails hauled almost to the centreline, boat heeled and working.'],
      [70, 'Close reach', 'Cracked off a little. Faster and more comfortable than close-hauled, and it eases the leeway.'],
      [90, 'Beam reach', 'Wind square on the side. Usually the fastest and easiest point of sail there is.'],
      [135, 'Broad reach', 'Wind over the quarter. Sails well eased, the boat upright and fast.'],
      [180, 'Running', 'Dead downwind. Sails squared right off, the boom well out. Watch for an accidental gybe.']
    ];
    var grid = A.el('.pos-grid');
    pts.forEach(function (p) {
      var cell = A.el('.pos-cell');
      var dia = A.el('.pos-dia');
      dia.innerHTML = pointsOfSailSVG(p[0]);
      cell.appendChild(dia);
      cell.appendChild(A.el('.pos-t', { text: p[1] }));
      cell.appendChild(A.el('.pos-a', { text: deg(p[0], 0) + ' off the wind' }));
      cell.appendChild(A.el('.pos-d', { text: p[2] }));
      grid.appendChild(cell);
    });
    host.appendChild(grid);
    host.appendChild(A.UI.note(
      'The blue line is the wind; the boat is drawn with her sails set for it. Notice the boom ' +
      'swinging out as the wind draws aft: that is the whole of sail trim in one picture. Angles ' +
      'are to the TRUE wind. What the masthead shows you is apparent wind, which always sits ' +
      'further forward and stronger than the true wind while you are moving.'));
  }

  /* ══ 6. distance off ═══════════════════════════════════════════════════ */

  function toolDistanceOff(host) {
    var st = A.store.get('nav.doff', { h: '', ang: '', eye: '', lh: '', rel: '', run: '' });
    function save() { A.store.set('nav.doff', st); }

    host.appendChild(A.UI.section('By vertical sextant angle'));
    var c1 = A.UI.card();
    host.appendChild(c1);
    c1.appendChild(A.UI.note('A charted height and the angle it subtends give the distance exactly. The most accurate method available without electronics.'));
    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({ label: 'Charted height', inputmode: 'decimal', suffix: 'm', value: st.h,
      oninput: function (e) { st.h = e.target.value; save(); calc(); } }));
    r1.appendChild(A.UI.field({ label: 'Measured angle', inputmode: 'decimal', suffix: '°', value: st.ang,
      oninput: function (e) { st.ang = e.target.value; save(); calc(); } }));
    c1.appendChild(r1);
    var res1 = A.el('div'); host.appendChild(res1);

    host.appendChild(A.UI.section('By rising or dipping a light'));
    var c2 = A.UI.card();
    host.appendChild(c2);
    c2.appendChild(A.UI.note('The instant a light lifts over the horizon, or dips below it, fixes your distance from it. Height of eye is yours; the light’s height is on the chart.'));
    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({ label: 'Your height of eye', inputmode: 'decimal', suffix: 'm', value: st.eye,
      placeholder: '3', oninput: function (e) { st.eye = e.target.value; save(); calc(); } }));
    r2.appendChild(A.UI.field({ label: 'Height of the light', inputmode: 'decimal', suffix: 'm', value: st.lh,
      oninput: function (e) { st.lh = e.target.value; save(); calc(); } }));
    c2.appendChild(r2);
    var res2 = A.el('div'); host.appendChild(res2);

    host.appendChild(A.UI.section('By two bearings and the run between'));
    var c3 = A.UI.card();
    host.appendChild(c3);
    c3.appendChild(A.UI.note('Relative bearings, measured from your bow. Take the first, hold your course, take the second, and the distance run between them gives the distance off. When the second is exactly twice the first, the distance off equals the distance run.'));
    var r3 = A.el('.split');
    r3.appendChild(A.UI.field({ label: 'First relative bearing', inputmode: 'decimal', suffix: '°', value: st.rel,
      placeholder: '30', oninput: function (e) { st.rel = e.target.value; save(); calc(); } }));
    r3.appendChild(A.UI.field({ label: 'Distance run', inputmode: 'decimal', suffix: 'NM', value: st.run,
      oninput: function (e) { st.run = e.target.value; save(); calc(); } }));
    c3.appendChild(r3);
    var res3 = A.el('div'); host.appendChild(res3);

    /* a reference table: how far the horizon is from common heights */
    host.appendChild(A.UI.section('How far you can see'));
    var hc = A.UI.card(null, 'tight');
    [[1.5, 'standing on a small boat'], [3, 'a yacht cockpit'], [6, 'a flybridge'],
     [10, 'a small ship bridge'], [20, 'a ship bridge'], [50, 'a cliff top']]
      .forEach(function (r) {
        hc.appendChild(A.UI.metric(r[0] + ' m  ·  ' + r[1], nm(N.horizonNM(r[0]), 1)));
      });
    host.appendChild(hc);
    host.appendChild(A.UI.note(
      'This is the distance to your own horizon, and it is why a light appears long before the ' +
      'land under it. Add the object height horizon to your own to get the range at which it lifts ' +
      'into view: that moment is a distance line as good as any bearing.'));

    function calc() {
      A.clear(res1); A.clear(res2); A.clear(res3);
      var h = num(st.h), a = num(st.ang);
      if (isFinite(h) && a > 0) {
        var d = N.distanceByVSA(h, a);
        var k = A.UI.card(null, 'tight');
        out(k, 'Distance off', nm(d, 2), 'from a charted height of ' + h + ' m');
        res1.appendChild(k);
      }
      var eye = num(st.eye), lh = num(st.lh);
      if (eye > 0) {
        var k2 = A.UI.card(null, 'tight');
        out(k2, 'Your horizon', nm(N.horizonNM(eye), 2), 'from ' + eye + ' m height of eye');
        if (lh > 0) out(k2, 'Distance when the light rises or dips', nm(N.dippingDistanceNM(eye, lh), 2));
        res2.appendChild(k2);
      }
      var rel = num(st.rel), run = num(st.run);
      if (rel > 0 && run > 0) {
        var db = N.doubleAngleOnBow(rel, run);
        var k3 = A.UI.card(null, 'tight');
        if (db) {
          out(k3, 'Take the second bearing at', deg(rel * 2, 0) + ' relative', 'double the first');
          out(k3, 'Distance off at that moment', nm(db.distanceAtSecond, 2), 'equals the distance run');
          out(k3, 'Distance off when abeam', nm(db.distanceAbeam, 2), 'how close you will actually pass');
        } else {
          k3.appendChild(A.UI.note('The first relative bearing must be between 0° and 90°.'));
        }
        res3.appendChild(k3);
      }
    }
    calc();
  }

  /* ══ 7. speed, time, distance and track error ══════════════════════════ */

  function toolSTD(host) {
    var st = A.store.get('nav.std', { s: '', t: '', d: '', run: '', off: '', togo: '' });
    function save() { A.store.set('nav.std', st); }

    host.appendChild(A.UI.section('Speed, time and distance'));
    var c = A.UI.card();
    host.appendChild(c);
    c.appendChild(A.UI.note('Fill any two and the third follows.'));
    c.appendChild(A.UI.field({ label: 'Speed', inputmode: 'decimal', suffix: 'kn', value: st.s,
      oninput: function (e) { st.s = e.target.value; save(); calc(); } }));
    c.appendChild(A.UI.field({ label: 'Time', inputmode: 'decimal', suffix: 'hours', value: st.t,
      oninput: function (e) { st.t = e.target.value; save(); calc(); } }));
    c.appendChild(A.UI.field({ label: 'Distance', inputmode: 'decimal', suffix: 'NM', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); } }));
    var res = A.el('div'); host.appendChild(res);

    host.appendChild(A.UI.section('The 1-in-60 rule'));
    var c2 = A.UI.card();
    host.appendChild(c2);
    c2.appendChild(A.UI.note(
      'One degree of error puts you one mile off after sixty. Give the distance run, ' +
      'how far off track you have ended up, and the distance still to go, and it works ' +
      'out both the error you have been making and the alteration that regains the destination.'));
    c2.appendChild(A.UI.field({ label: 'Distance run', inputmode: 'decimal', suffix: 'NM', value: st.run,
      oninput: function (e) { st.run = e.target.value; save(); calc(); } }));
    c2.appendChild(A.UI.field({ label: 'Distance off track', inputmode: 'decimal', suffix: 'NM', value: st.off,
      oninput: function (e) { st.off = e.target.value; save(); calc(); } }));
    c2.appendChild(A.UI.field({ label: 'Distance still to go', inputmode: 'decimal', suffix: 'NM', value: st.togo,
      oninput: function (e) { st.togo = e.target.value; save(); calc(); } }));
    var res2 = A.el('div'); host.appendChild(res2);

    function calc() {
      A.clear(res); A.clear(res2);
      var s = num(st.s), t = num(st.t), d = num(st.d);
      var solved = null;
      if (isFinite(s) && isFinite(t)) solved = { label: 'Distance', v: nm(N.solveSTD({ speed: s, time: t }).distance, 2) };
      else if (isFinite(d) && s > 0) solved = { label: 'Time', v: hoursHM(N.solveSTD({ distance: d, speed: s }).time) };
      else if (isFinite(d) && t > 0) solved = { label: 'Speed', v: kn(N.solveSTD({ distance: d, time: t }).speed) };
      if (solved) { var k = A.UI.card(null, 'tight'); out(k, solved.label, solved.v); res.appendChild(k); }

      /* ETA in clock time, which is what gets radioed ahead */
      if (isFinite(d) && s > 0) {
        var hrs = d / s;
        var eta = new Date(Date.now() + hrs * 3600000);
        function p2(n) { return (n < 10 ? '0' : '') + n; }
        var ec = A.UI.card(null, 'tight');
        ec.appendChild(A.UI.metric('Time on passage', hoursHM(hrs)));
        ec.appendChild(A.UI.metric('Arriving at',
          p2(eta.getHours()) + 'h' + p2(eta.getMinutes()),
          { sub: eta.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) }));
        /* the speed you would need to make a different time */
        ec.appendChild(A.UI.metric('To arrive an hour earlier', kn(d / Math.max(0.1, hrs - 1)),
          { sub: 'the speed it would take' }));
        res.appendChild(ec);
      }

      var run = num(st.run), off = num(st.off), togo = num(st.togo);
      if (run > 0 && isFinite(off)) {
        var r = N.oneInSixty(run, off, togo > 0 ? togo : null);
        var k2 = A.UI.card(null, 'tight');
        out(k2, 'Track error so far', deg(r.trackError), 'the error you have been steering');
        if (r.closingAngle != null) {
          out(k2, 'Closing angle', deg(r.closingAngle), 'to regain the track by the destination');
          out(k2, 'Total alteration', deg(r.totalAlteration),
            'alter ' + (off >= 0 ? 'towards the track' : 'towards the track') + ' by this much');
        }
        res2.appendChild(k2);
      }
    }
    calc();
  }

  /* ══ the page ══════════════════════════════════════════════════════════ */

  /* ══ MAGNETIC DECLINATION, AND THE AGE OF A CHART ══════════════════════
     Two separate problems, and they get conflated.

     WHERE YOU ARE. Declination is a property of position. The model in this
     app gives today's figure for any latitude and longitude, offline.

     WHEN THE CHART WAS PRINTED. A paper chart states the variation at its
     compass rose for the year of survey, plus an annual change. A chart from
     1994 reading "8°30'W (1994) decreasing 6' annually" is not telling you
     what the field is now: it is telling you what it was and how fast it was
     moving. Thirty years of that is three degrees, and three degrees over ten
     miles is half a mile off track.

     So this does both: today's figure from the model, and what the chart's own
     note works out to now, with the disagreement stated. Where they differ the
     model is right and the chart is old - but the chart is what the rest of
     your plotting is drawn against, so you have to know which one you used. */
  function toolDeclination(host) {
    var W = global.WMM;
    var st = A.store.get('nav.decl', {
      lat: '', lon: '',
      chartVar: '', chartYear: '', chartRate: '', chartDir: 'W', rateDir: 'E'
    });
    function save() { A.store.set('nav.decl', st); }
    var out = A.el('div');

    var pos = A.UI.card();
    pos.appendChild(A.el('.sec-lab', { text: 'Where you are' }));
    var pr = A.el('.split');
    pr.appendChild(A.UI.field({
      decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); }
    }));
    pr.appendChild(A.UI.field({
      decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); }
    }));
    pos.appendChild(pr);
    pos.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix...');
        navigator.geolocation.getCurrentPosition(function (p) {
          st.lat = fmtLat(p.coords.latitude);
          st.lon = fmtLon(p.coords.longitude);
          save(); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); },
        { enableHighAccuracy: true, timeout: 15000 });
      }
    }));
    host.appendChild(pos);

    var ch = A.UI.card();
    ch.appendChild(A.el('.sec-lab', { text: 'What the chart says' }));
    ch.appendChild(A.el('.lrow-s', {
      text: 'Off the compass rose. Leave blank if you are not working from paper.',
      style: { whiteSpace: 'normal', marginBottom: '8px' }
    }));
    var cr = A.el('.split');
    cr.appendChild(A.UI.field({
      label: 'Variation printed', inputmode: 'decimal', suffix: 'deg', value: st.chartVar,
      oninput: function (e) { st.chartVar = e.target.value; save(); calc(); }
    }));
    cr.appendChild(A.UI.select({
      label: 'East or west', value: st.chartDir,
      options: [{ value: 'W', label: 'West' }, { value: 'E', label: 'East' }],
      onchange: function (e) { st.chartDir = e.target.value; save(); calc(); }
    }));
    ch.appendChild(cr);
    var cr2 = A.el('.split');
    cr2.appendChild(A.UI.field({
      label: 'Year of that figure', inputmode: 'numeric', value: st.chartYear,
      placeholder: '1994',
      oninput: function (e) { st.chartYear = e.target.value; save(); calc(); }
    }));
    cr2.appendChild(A.UI.field({
      label: 'Annual change', inputmode: 'decimal', suffix: 'min', value: st.chartRate,
      hint: 'Minutes per year, as printed on the rose.',
      oninput: function (e) { st.chartRate = e.target.value; save(); calc(); }
    }));
    ch.appendChild(cr2);
    ch.appendChild(A.UI.select({
      label: 'Change is towards', value: st.rateDir,
      options: [{ value: 'E', label: 'East (a westerly variation shrinking)' },
                { value: 'W', label: 'West (a westerly variation growing)' }],
      onchange: function (e) { st.rateDir = e.target.value; save(); calc(); }
    }));
    host.appendChild(ch);
    host.appendChild(out);

    /* east positive throughout, which is the sign convention the rest of the
       navigation maths in this app already uses */
    function fmtVar(v) {
      if (v == null || !isFinite(v)) return '-';
      return A.fmtNum(Math.abs(v), 3) + ' deg ' + (v >= 0 ? 'E' : 'W');
    }

    function calc() {
      A.clear(out);
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      var model = null;
      if (W && isFinite(la) && isFinite(lo)) {
        try { model = W.declination(la, lo, new Date()); } catch (e) { model = null; }
      }

      var cv = A.parseNum(st.chartVar), cy = A.parseNum(st.chartYear), rate = A.parseNum(st.chartRate);
      var chartNow = null, years = null, hasRate = isFinite(rate) && rate !== 0;
      if (isFinite(cv) && isFinite(cy) && cy > 1800) {
        var signed = st.chartDir === 'W' ? -cv : cv;
        years = (new Date()).getFullYear() - cy;
        var drift = hasRate ? (rate / 60) * years * (st.rateDir === 'W' ? -1 : 1) : 0;
        chartNow = signed + drift;
      }

      var c = A.UI.card(null, 'tight');
      if (model != null) {
        c.appendChild(A.UI.metric('Declination today', fmtVar(model),
          { big: true, icon: 'field', sub: 'from the world magnetic model, offline' }));
      } else {
        c.appendChild(A.UI.note('Enter a position for the model figure.'));
      }
      if (chartNow != null) {
        c.appendChild(A.UI.metric('The chart, carried forward', fmtVar(chartNow),
          { sub: years + ' year' + (years === 1 ? '' : 's') +
                 (hasRate ? ' of annual change applied' : ', no annual change given') }));
      }
      if (model != null && chartNow != null) {
        var diff = model - chartNow;
        c.appendChild(A.UI.metric('They disagree by', A.fmtNum(Math.abs(diff), 3) + ' deg',
          { sub: Math.abs(diff) < 0.5 ? 'close enough to ignore'
                                      : 'the model is current; the chart is old' }));
      }
      out.appendChild(c);

      var use = (model != null) ? model : chartNow;
      if (use != null) {
        var c2 = A.UI.card(null, 'tight');
        c2.appendChild(A.el('.sec-lab', { text: 'Applying it' }));
        c2.appendChild(A.UI.metric('True 090 becomes', brg(N.norm360(90 - use)) + ' M',
          { sub: 'true to magnetic' }));
        c2.appendChild(A.UI.metric('Magnetic 090 becomes', brg(N.norm360(90 + use)) + ' T',
          { sub: 'magnetic to true' }));
        out.appendChild(c2);
      }

      if (chartNow != null && years > 10 && !hasRate) {
        out.appendChild(A.UI.note(
          'That chart is ' + years + ' years old and no annual change was given, ' +
          'so nothing has been carried forward. The printed figure is very likely ' +
          'wrong by now. Find the rate on the rose, or work from the model above.'));
      }

      out.appendChild(A.UI.note(
        'EAST IS LEAST, WEST IS BEST: going true to magnetic, subtract an easterly ' +
        'variation and add a westerly one; reverse it coming back. Deviation is a ' +
        'separate correction for your own vessel and is applied after this one - ' +
        'see the T / M / C page. Where the model and the chart differ by more than ' +
        'a degree, write on the plot which one you used.'));
    }
    calc();
  }

  /* ══ saved coordinates ═════════════════════════════════════════════════
     A place to keep positions: a rendezvous, a cache, a vehicle, a hut. Saved
     from the live fix or typed by hand, held on the device and nowhere else.
     Deliberately dumb storage, not a map: the value is that it survives with
     no signal and the numbers are yours to read onto a chart or a GPS. */
  function toolCoords(host) {
    var list = A.store.get('nav.coords', []);
    var draft = A.store.get('nav.coords.draft', { name: '', lat: '', lon: '' });
    function saveList() { A.store.set('nav.coords', list); }
    function saveDraft() { A.store.set('nav.coords.draft', draft); }

    host.appendChild(A.UI.note(
      'Save a position to come back to: type it in degrees and decimal minutes, or take ' +
      'the live fix. Everything stays on this phone. A saved coordinate is only as good as ' +
      'the fix it came from, so check anything that matters.'));

    var add = A.UI.card();
    add.appendChild(A.el('.lrow-t', { text: 'Add a coordinate', style: { fontWeight: '650' } }));

    add.appendChild(A.UI.field({
      label: 'Name (optional)', value: draft.name, placeholder: 'RV Alpha',
      oninput: function (e) { draft.name = e.target.value; saveDraft(); }
    }));
    var pr = A.el('.split');
    var latF = A.UI.field({ decimalAt: 2, label: 'Latitude', value: draft.lat, placeholder: '25.25500',
      oninput: function (e) { draft.lat = e.target.value; saveDraft(); } });
    var lonF = A.UI.field({ decimalAt: 3, label: 'Longitude', value: draft.lon, placeholder: '55.12934',
      oninput: function (e) { draft.lon = e.target.value; saveDraft(); } });
    pr.appendChild(latF); pr.appendChild(lonF);
    add.appendChild(pr);

    add.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my location',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          draft.lat = fmtLat(pos.coords.latitude);
          draft.lon = fmtLon(pos.coords.longitude);
          saveDraft();
          A.Router.refresh();
        }, function () { A.toast('Could not get a position'); },
          { enableHighAccuracy: true, timeout: 15000 });
      }
    }));

    add.appendChild(A.el('button.btn.block', {
      html: Icons.svg('check') + ' Save coordinate',
      style: { marginTop: '8px' },
      onclick: function () {
        var la = parseCoord(draft.lat, false), lo = parseCoord(draft.lon, true);
        if (!isFinite(la) || !isFinite(lo)) { A.toast('Enter a latitude and a longitude'); return; }
        list.unshift({
          name: (draft.name || '').trim(),
          lat: fmtLat(la), lon: fmtLon(lo),
          latDd: la, lonDd: lo, ts: Date.now()
        });
        saveList();
        draft.name = ''; draft.lat = ''; draft.lon = ''; saveDraft();
        A.haptic(14);
        A.Router.refresh();
      }
    }));
    host.appendChild(add);

    if (!list.length) {
      host.appendChild(A.UI.empty('No saved coordinates yet.'));
      return;
    }

    host.appendChild(A.UI.section('Saved'));
    list.forEach(function (c, i) {
      var card = A.UI.card(null, 'tight');
      var row = A.el('.split', { style: { alignItems: 'flex-start' } });
      var txt = A.el('div', { style: { flex: '1', minWidth: '0' } });
      txt.appendChild(A.el('.lrow-t', {
        text: c.name || 'Coordinate ' + (list.length - i),
        style: { fontWeight: '650' }
      }));
      txt.appendChild(A.el('.lrow-s', {
        text: c.lat + '   ·   ' + c.lon,
        style: { whiteSpace: 'normal', fontVariantNumeric: 'tabular-nums' }
      }));
      row.appendChild(txt);
      /* copy the pair for pasting into a GPS or a message */
      row.appendChild(A.el('button.btn.ghost', {
        html: Icons.svg('copy'), style: { flex: '0 0 auto', padding: '8px 10px' },
        onclick: function () {
          var s = c.lat + ' ' + c.lon;
          try { navigator.clipboard.writeText(s); A.toast('Copied'); }
          catch (e) { A.toast(s); }
        }
      }));
      row.appendChild(A.el('button.btn.ghost', {
        html: Icons.svg('trash'), style: { flex: '0 0 auto', padding: '8px 10px', color: 'var(--danger)' },
        onclick: function () { list.splice(i, 1); saveList(); A.haptic(14); A.Router.refresh(); }
      }));
      card.appendChild(row);
      host.appendChild(card);
    });
  }

  /* The dead-reckoning pacer moved to the Compass page as the Dogleg tab,
     where it sits beside the instrument you steer by while counting. Two
     copies of the same arithmetic would only have drifted apart. */

  var TABS = [
    { id: 'pos',   label: 'Sailings',   fn: toolPositions },
    { id: 'coords', label: 'Coords',    fn: toolCoords },
    { id: 'chart', label: 'Chart scale', fn: toolChartScale },
    { id: 'comp',  label: 'T / M / C',  fn: toolCompass },

    { id: 'cts',   label: 'Course to steer', fn: toolCourseToSteer },
    { id: 'tack',  label: 'Tacking',    fn: toolTacking },
    { id: 'ep',    label: 'EP',         fn: toolEP },
    /* Declination moved to the Compass page, where it belongs; the tab is kept
       hidden so any saved state or link still resolves. */
    { id: 'decl',  label: 'Declination', fn: toolDeclination, hidden: true },
    { id: 'doff',  label: 'Distance off', fn: toolDistanceOff },
    { id: 'std',   label: 'Speed & time', fn: toolSTD }
  ];

  function render(host) {
    if (!N) { host.appendChild(A.UI.empty('Navigation maths unavailable.')); return; }
    var tab = A.store.get('nav.tab', 'pos');
    /* 'live' used to be a tab here. Anyone whose stored tab still says so is
       sent to the first sailing rather than to an empty page. */
    if (!TABS.some(function (t) { return t.id === tab; })) { tab = 'pos'; A.store.set('nav.tab', tab); }

    var chips = A.UI.chips(TABS.filter(function (t) { return !t.hidden; }), tab, function (id) {
      A.store.set('nav.tab', id); A.Router.refresh();
    });
    chips.classList.add('wrap');
    host.appendChild(chips);

    /* The toggle moved to the Navigation page; the widget itself is global. */
    if (A.store.get('nav.mini', false)) miniCompass();

    var body = A.el('div');
    host.appendChild(body);
    /* a tab that attached device listeners gets to drop them first */
    if (render._navCleanup) { try { render._navCleanup(); } catch (e) {} render._navCleanup = null; }
    TABS.filter(function (t) { return t.id === tab; })[0].fn(body);

    host.appendChild(A.UI.note(
      'These work out the numbers; the chart still holds the fix, the depths and the ' +
      'hazards. Variation comes from the compass rose on your chart, corrected for the ' +
      'year, and deviation from your own swung card. Check anything that matters twice.'));
  }

  /* THE FLOATING COMPASS IS APP-WIDE.
     Switched on, it follows you into every page - which is the point: a
     heading is wanted while reading a map or working out a course, not only
     on the page that owns the sensor. It stands down for the full Compass
     tab, which already shows a dial, and the Sea navigation page's own
     listener is released when that page is left. */
  A.Bus.on('route', function (r) {
    var onSeaNav = r && r.name === 'field' && (A.Router.params().query || {}).tab === 'nav';
    if (!onSeaNav && render._navCleanup) {
      try { render._navCleanup(); } catch (e) {}
      render._navCleanup = null;
    }
    /* the full dial is already on screen on its own page */
    if (r && r.name === 'compass') { closeMini(); return; }
    if (A.store.get('nav.mini', false)) miniCompass(); else closeMini();
  });

  /* the Navigation page owns the switch now */
  global.ArtNavCompass = {
    isOn: function () { return A.store.get('nav.mini', false); },
    set: function (v) {
      A.store.set('nav.mini', !!v);
      if (v) miniCompass(); else closeMini();
    }
  };

  /* ══ THE COMPASS IS A PAGE, NOT A TAB ═════════════════════════════════
     It was one chip among nine inside Sea navigation, which put an instrument
     that reads a sensor behind two taps and a row of chart-work tools it has
     nothing to do with. It is reached from Navigation > Instruments and it
     answers on its own screen.

     Its own cleanup, because the device-orientation listener has to be
     released when this page is left and the sea-navigation page's teardown no
     longer runs for it. */
  var cmpCleanup = null;
  A.Router.register('compass', {
    render: function (host) {
      A.setTitle('Compass', { back: true });
      if (!N) { host.appendChild(A.UI.empty('Navigation maths unavailable.')); return; }

      /* two views of the same question: which way the needle lies, and by how
         much it is wrong for where you are. A tab bar at the top switches them,
         and the Navigation page can land straight on Declination. */
      var sub = A.store.get('nav.compassTab', 'live');
      if (['live', 'dogleg', 'decl', 'cal', 'alt'].indexOf(sub) < 0) sub = 'live';
      host.appendChild(A.UI.chips(
        [{ id: 'live', label: 'Compass' }, { id: 'dogleg', label: 'Dogleg' },
         { id: 'decl', label: 'Declination' }, { id: 'cal', label: 'Calibration' },
         { id: 'alt', label: 'Altimeter' }],
        sub,
        function (id) { A.store.set('nav.compassTab', id); A.Router.refresh(); }
      ));

      var body = A.el('div');
      host.appendChild(body);

      render._navCleanup = null;
      closeMini();      /* every tab of this page has its own dial or none */
      if (sub === 'decl') {
        toolDeclination(body);
      } else if (sub === 'dogleg') {
        /* the track tab owns the compass listener, so its teardown has to reach
           the router; the info tab returns null and there is nothing to release */
        cmpCleanup = toolDogleg(body);
      } else if (sub === 'cal') {
        cmpCleanup = toolCalibration(body);
      } else if (sub === 'alt') {
        cmpCleanup = toolAltimeter(body);
      } else {
        /* the tool sets render._navCleanup; take it and hold it as ours */
        toolLiveCompass(body);
        cmpCleanup = render._navCleanup;
        render._navCleanup = null;
      }
    },
    teardown: function () {
      if (cmpCleanup) { try { cmpCleanup(); } catch (e) {} cmpCleanup = null; }
      if (A.store.get('nav.mini', false)) miniCompass();
    }
  });

  /* ══ bubble level, on its own page ═════════════════════════════════════
     The same round spirit level that sits on the compass, given room and a
     numeric read of roll and pitch. Reads the device tilt through the shared
     Compass source, so it uses the native rotation-vector sensor where there
     is one. Returns its own teardown. */
  function toolLevelPage(host) {
    A.setTitle('Bubble level', { back: true });

    var card = A.UI.card();
    var lvl = A.el('.nav-lvl'); lvl.innerHTML = buildLevel();
    var svg = lvl.querySelector('.nav-lvl-svg');
    if (svg) { svg.style.width = 'min(72vw, 280px)'; svg.style.height = 'auto'; }
    var bub = lvl.querySelector('.nav-lvl-bub');
    /* .nav-lvl-wrap is 84px wide because that is what the mini level beside the
       compass needs. On its own page the dial is 280px, and a 280px dial inside
       an 84px box overflows it evenly on both sides - which puts the circle off
       to the left of the card rather than in the middle of it. The page gets
       its own modifier and takes the full width. */
    card.appendChild(A.el('.nav-lvl-wrap.lvl-page', { style: { marginTop: '4px' } }, [lvl]));

    var rollRow = A.UI.metric('Roll', '—'), pitchRow = A.UI.metric('Pitch', '—');
    var rollV = rollRow.querySelector('.metric-v'), pitchV = pitchRow.querySelector('.metric-v');
    var read = A.el('.nav-lvl-read', null, [rollRow, pitchRow]);
    card.appendChild(read);
    host.appendChild(card);

    var waited = false;
    var off = Compass.on(function () {
      var t = Compass.tilt();
      if (!t) return;
      waited = true;
      var gx = A.clamp(t.gamma / 25, -1, 1), gy = A.clamp(t.beta / 25, -1, 1);
      if (bub) {
        bub.setAttribute('cx', (46 - gx * 30).toFixed(1));
        bub.setAttribute('cy', (46 + gy * 30).toFixed(1));
        var flat = Math.abs(t.gamma) < 0.6 && Math.abs(t.beta) < 0.6;
        bub.setAttribute('fill', flat ? 'var(--ok)' : 'var(--acc)');
      }
      rollV.textContent = A.fmtNum(t.gamma, 1) + '°';
      pitchV.textContent = A.fmtNum(t.beta, 1) + '°';
    });
    setTimeout(function () {
      if (!waited) { rollV.textContent = 'no sensor'; pitchV.textContent = 'no sensor'; }
    }, 2800);
    return off;
  }

  var levelCleanup = null;
  A.Router.register('level', {
    render: function (host) {
      if (!N) { host.appendChild(A.UI.empty('Navigation maths unavailable.')); return; }
      levelCleanup = toolLevelPage(host);
    },
    teardown: function () { if (levelCleanup) { try { levelCleanup(); } catch (e) {} levelCleanup = null; } }
  });

  /* ══ camera clinometer ═════════════════════════════════════════════════
     Point the camera along a slope or at a target and read the elevation
     angle off the tilt of the phone. Held upright in portrait, the camera
     looks along the phone's back, so the inclination is the pitch past
     vertical: beta - 90, positive up. A Hold freezes the reading so the phone
     can be lowered to note it. The angle feeds the ballistics firing-angle
     solver, hence degrees as the primary read. */
  function toolClinometer(host) {
    A.setTitle('Clinometer', { back: true });

    var stage = A.el('.clino-stage');
    var video = A.el('video', { playsinline: true, muted: true, autoplay: true });
    video.playsInline = true; video.muted = true;
    stage.appendChild(video);

    var overlay = A.el('.clino-overlay');
    overlay.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="clino-svg">' +
      '<line x1="0" y1="50" x2="100" y2="50" stroke="var(--danger)" stroke-width="0.4" opacity="0.9"/>' +
      '<line x1="50" y1="45" x2="50" y2="55" stroke="var(--danger)" stroke-width="0.4" opacity="0.9"/>' +
      '</svg>';
    stage.appendChild(overlay);

    /* a degree scale down the right edge, with a red pointer that tracks the
       elevation angle. 0 at the centre, up positive, ±180° to the ends. */
    var CLINO_PPD = 150 / 180;   /* px per degree: ±180 spans the 300px scale */
    var ruler = A.el('.clino-ruler');
    (function () {
      var Wr = 42, Hr = 300, cy = 150, ppd = CLINO_PPD, g = '';
      for (var d = -180; d <= 180; d += 10) {
        var y = cy - d * ppd, maj = (d % 30 === 0);
        g += '<line x1="' + (Wr - (maj ? 17 : 9)) + '" y1="' + y + '" x2="' + Wr + '" y2="' + y +
          '" stroke="#fff" stroke-width="' + (maj ? 1.4 : 0.8) + '" opacity="' + (maj ? 0.9 : 0.5) + '"/>';
        if (maj) g += '<text x="' + (Wr - 20) + '" y="' + (y + 3.2) + '" text-anchor="end" font-size="9" fill="#fff">' +
          (d > 0 ? '+' : '') + d + '</text>';
      }
      ruler.innerHTML = '<svg viewBox="0 0 ' + Wr + ' ' + Hr + '" preserveAspectRatio="xMidYMid meet" class="clino-ruler-svg">' +
        g + '<polygon class="clino-ptr" points="0,150 9,145 9,155" fill="var(--danger)"/></svg>';
    })();
    stage.appendChild(ruler);
    var rulerPtr = ruler.querySelector('.clino-ptr');

    var hud = A.el('.clino-hud');
    var angEl = A.el('.clino-ang', { text: '—' });
    var subEl = A.el('.clino-sub', { text: 'tilt the phone' });
    hud.appendChild(angEl); hud.appendChild(subEl);
    stage.appendChild(hud);

    var noCam = A.el('.clino-nocam', { text: 'Starting the camera…' });
    stage.appendChild(noCam);

    /* a strip compass across the foot of the camera view */
    var stripCmp = A.stripCompass();
    stripCmp.el.classList.add('cam-strip');
    stage.appendChild(stripCmp.el);
    host.appendChild(stage);

    var ctl = A.UI.card();
    var held = false, lastIncl = 0, saved = [], invert = false;
    var holdBtn = A.el('button.btn', {
      html: Icons.svg('check') + ' Hold the reading',
      style: { flex: '1' },
      onclick: function () {
        held = !held;
        holdBtn.classList.toggle('on', held);
        holdBtn.innerHTML = Icons.svg(held ? 'lock' : 'check') + ' ' + (held ? 'Held, tap to release' : 'Hold the reading');
        A.haptic(14);
      }
    });
    /* saving records the current angle without freezing the read: the
       clinometer keeps working while a list of saved angles builds up */
    var saveBtn = A.el('button.btn.ghost', {
      html: Icons.svg('plus') + ' Save the angle',
      style: { flex: '1' },
      onclick: function () {
        saved.push(lastIncl);
        A.haptic(14);
        A.toast('Saved ' + (lastIncl >= 0 ? '+' : '') + A.fmtNum(lastIncl, 1) + '°');
        renderSaved();
      }
    });
    ctl.appendChild(A.el('.split', null, [holdBtn, saveBtn]));

    /* flip the pointer so up reads as down and down as up, for sighting the
       phone the other way up */
    var invertBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('swap') + ' Invert',
      style: { marginTop: '8px' },
      onclick: function () {
        invert = !invert;
        invertBtn.classList.toggle('on', invert);
        lastIncl = -lastIncl;
        A.haptic(12);
        draw();
      }
    });
    ctl.appendChild(invertBtn);

    var savedHost = A.el('div');
    ctl.appendChild(savedHost);
    function renderSaved() {
      A.clear(savedHost);
      if (!saved.length) return;
      savedHost.appendChild(A.el('.sec-lab', { text: 'Saved angles', style: { marginTop: '14px' } }));
      saved.forEach(function (v, i) {
        var row = A.UI.metric('#' + (i + 1),
          (v >= 0 ? '+' : '') + A.fmtNum(v, 1) + '°  ·  ' + (v >= 0 ? 'up' : 'down') + '  ·  ' +
          Math.round(Math.abs(v) / 360 * 6400) + ' mil');
        row.appendChild(A.el('button.btn.ghost', {
          html: Icons.svg('trash'), style: { marginTop: '6px' },
          onclick: function () { saved.splice(i, 1); A.haptic(); renderSaved(); }
        }));
        savedHost.appendChild(row);
      });
      savedHost.appendChild(A.el('button.btn.ghost.block.sem-del', {
        text: 'Clear all', style: { marginTop: '8px' },
        onclick: function () { saved = []; A.haptic(); renderSaved(); }
      }));
    }

    host.appendChild(ctl);

    /* camera */
    var stream = null;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      noCam.textContent = 'This device cannot open a camera. The angle still reads from the tilt sensor.';
    } else {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false
      }).then(function (s) {
        stream = s; video.srcObject = s; return video.play();
      }).then(function () { noCam.hidden = true; })
        .catch(function (err) {
          noCam.hidden = false;
          noCam.textContent = 'Could not start the camera (' + (err && err.name ? err.name : 'unknown') +
            '). The angle still reads from the tilt sensor.';
        });
    }

    function draw() {
      var d = lastIncl;
      angEl.textContent = (d >= 0 ? '+' : '') + A.fmtNum(d, 1) + '°';
      var mag = Math.abs(d);
      subEl.textContent = (d >= 0 ? 'up' : 'down') + '  ·  ' + Math.round(mag / 360 * 6400) + ' mil  ·  ' +
        (mag / 360 * 400).toFixed(1) + ' gon' + (held ? '  ·  HELD' : '');
      if (rulerPtr) rulerPtr.setAttribute('transform', 'translate(0 ' + (-A.clamp(d, -180, 180) * CLINO_PPD).toFixed(1) + ')');
    }
    /* the angle comes from the gravity vector, not from the Euler beta the
       browser reports: beta folds back on itself past the vertical, which is
       why the pointer used to vanish beyond +90. atan2 of the two in-plane
       gravity components runs a clean −180..+180 the whole way round.
       0 = upright, +90 = camera up, −90 = camera down, ±180 = upside down. */
    var gotMotion = false;
    function onMotion(ev) {
      if (held) return;
      var g = ev.accelerationIncludingGravity;
      if (!g || typeof g.y !== 'number' || typeof g.z !== 'number' || (g.y === 0 && g.z === 0)) return;
      gotMotion = true;
      var d = Math.atan2(g.z, g.y) * 180 / Math.PI;
      lastIncl = invert ? -d : d;
      draw();
    }
    function onOri(ev) {
      if (held || gotMotion) return;   /* fallback only until motion arrives */
      var beta = ev.beta;
      if (typeof beta !== 'number' || !isFinite(beta)) return;
      var d = beta - 90;
      lastIncl = invert ? -d : d;
      draw();
    }
    window.addEventListener('devicemotion', onMotion, true);
    window.addEventListener('deviceorientation', onOri, true);
    draw();

    return function () {
      window.removeEventListener('devicemotion', onMotion, true);
      window.removeEventListener('deviceorientation', onOri, true);
      if (stripCmp) { try { stripCmp.stop(); } catch (e) {} }
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    };
  }

  /* ══ sun & moon calculator ═════════════════════════════════════════════
     Everything worked out on the device from position and clock: sunrise and
     sunset, the three twilights, solar noon, day length, the moon phase, and
     where the sun and moon are right now. No network anywhere in it. */
  function toolSunMoon(host) {
    var st = A.store.get('nav.sunmoon', { lat: '', lon: '' });
    function save() { A.store.set('nav.sunmoon', st); }

    /* the moment shown: starts at now every time the page opens, and the user
       can move it to read the sky at any other date and time */
    function pad2(n) { return ('0' + n).slice(-2); }
    function nowISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function nowHhMM(d) { return pad2(d.getHours()) + 'h' + pad2(d.getMinutes()); }
    function parseClock(s) {
      s = (s || '').trim().toLowerCase().replace(/[h:.\s]/g, '');
      if (!/^\d{3,4}$/.test(s)) return null;
      if (s.length === 3) s = '0' + s;
      var h = +s.slice(0, 2), m = +s.slice(2);
      if (h > 23 || m > 59) return null;
      return { h: h, m: m };
    }
    var now0 = new Date(), dateStr = nowISO(now0), timeStr = nowHhMM(now0);
    function whenDate() {
      var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr), c = parseClock(timeStr);
      if (!m) return new Date();
      return new Date(+m[1], +m[2] - 1, +m[3], c ? c.h : 0, c ? c.m : 0);
    }

    var card = A.UI.card();
    var pr = A.el('.split');
    pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));
    pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); } }));
    card.appendChild(pr);
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          st.lat = fmtLat(pos.coords.latitude); st.lon = fmtLon(pos.coords.longitude); save(); calc();
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    }));
    var dwrap = A.el('.fld'); dwrap.appendChild(A.el('span.fld-lab', { text: 'Date' }));
    var dIn = A.el('input.fld-in', { type: 'date', value: dateStr });
    dIn.addEventListener('change', function () { dateStr = dIn.value; calc(); });
    dwrap.appendChild(dIn);
    var twrap = A.el('.fld'); twrap.appendChild(A.el('span.fld-lab', { text: 'Time (24h, e.g. 14h30)' }));
    var tIn = A.el('input.fld-in', { type: 'text', inputmode: 'numeric', value: timeStr, placeholder: '14h30' });
    tIn.addEventListener('input', function () { timeStr = tIn.value; calc(); });
    twrap.appendChild(tIn);
    card.appendChild(A.el('.split', { style: { marginTop: '8px' } }, [dwrap, twrap]));
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('clock') + ' Now',
      onclick: function () { var n = new Date(); dateStr = nowISO(n); timeStr = nowHhMM(n); dIn.value = dateStr; tIn.value = timeStr; calc(); }
    }));
    host.appendChild(card);

    var out = A.el('div');
    host.appendChild(out);

    function alt(a) { return A.fmtNum(a, 1) + '° alt'; }
    function horiz(a) { return a >= 0 ? 'above the horizon' : 'below the horizon'; }

    function calc() {
      A.clear(out);
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) { out.appendChild(A.UI.empty('Enter a latitude and a longitude.')); return; }
      var now = whenDate();

      var tw = A.UI.card();
      tw.appendChild(A.el('.sec-lab', { text: 'Twilight (dawn · dusk)' }));
      [['Civil', -6], ['Nautical', -12], ['Astronomical', -18]].forEach(function (t) {
        var r = riseSetAt(now, la, lo, t[1]);
        tw.appendChild(A.UI.metric(t[0], r.polar
          ? (r.polar === 'always' ? 'no darkness this deep' : 'not reached')
          : clockHM(r.rise) + '  ·  ' + clockHM(r.set)));
      });
      out.appendChild(tw);

      var sp = global.ArtSun.position(now, la, lo);
      var rs = riseSetAt(now, la, lo, -0.833);
      var sunC = A.UI.card();
      sunC.appendChild(A.el('.sec-lab', { text: 'Sun' }));
      if (rs.polar) {
        sunC.appendChild(A.UI.metric('Today', A.tr(rs.polar === 'always' ? 'Sun up all day' : 'Sun below the horizon all day')));
        sunC.appendChild(A.UI.metric('Solar noon', clockHM(sp.noonMinutes)));
      } else {
        sunC.appendChild(A.UI.metric('Sunrise', clockHM(rs.rise)));
        sunC.appendChild(A.UI.metric('Solar noon', clockHM(rs.noon)));
        sunC.appendChild(A.UI.metric('Sunset', clockHM(rs.set)));
        var dl = Math.round(rs.set - rs.rise);
        sunC.appendChild(A.UI.metric('Day length', Math.floor(dl / 60) + 'h ' + (dl % 60) + 'm'));
      }
      sunC.appendChild(A.UI.metric('Position', brg(sp.azimuth) + '  ·  ' + alt(sp.elevation), { sub: horiz(sp.elevation) }));
      out.appendChild(sunC);

      var mp = moonPosition(now, la, lo), ph = moonPhase(now);
      var mc = A.UI.card();
      mc.appendChild(A.el('.sec-lab', { text: 'Moon' }));
      mc.appendChild(A.el('.moon-phase', { html: moonSVG(ph.age) }));
      mc.appendChild(A.UI.metric('Phase', A.tr(ph.name), { sub: Math.round(ph.illum * 100) + '% lit' }));
      mc.appendChild(A.UI.metric('Position', brg(mp.az) + '  ·  ' + alt(mp.alt), { sub: horiz(mp.alt) }));
      out.appendChild(mc);
    }
    calc();
  }

  /* ══ shadow stick ══════════════════════════════════════════════════════

     The oldest direction-finder there is, run forwards on the phone's own sun
     ephemeris instead of by waiting half an hour in the open for the tip to
     move. Plant a stick, and its shadow lies on the bearing exactly opposite
     the sun; at local solar noon that line IS the true meridian.

     Read it two ways round. If you know where you are, it tells you where north
     is, and it does that with no magnetometer at all, which is the point: no
     magnetometer means nothing to be thrown off by the steel you are standing
     next to, by a speaker, or by a deliberate local field. If instead you know
     which way north is, comparing the real shadow against the drawn one is a
     check on the compass you were about to trust.

     What it cannot do is work in cloud, and it degrades near sunrise and sunset
     where a low sun throws a shadow so long that a small error in the sun's
     altitude moves the tip a long way. Both of those are said on the page rather
     than hidden. */
  function toolShadowStick(host) {
    var st = A.store.get('nav.sunmoon', { lat: '', lon: '' });
    var ss = A.store.get('nav.stick', { h: '1.0' });
    function save() { A.store.set('nav.sunmoon', st); }
    function saveS() { A.store.set('nav.stick', ss); }

    function pad2(n) { return ('0' + n).slice(-2); }
    function nowISO(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
    function nowHhMM(d) { return pad2(d.getHours()) + 'h' + pad2(d.getMinutes()); }
    function parseClock(s) {
      s = (s || '').trim().toLowerCase().replace(/[h:.\s]/g, '');
      if (!/^\d{3,4}$/.test(s)) return null;
      if (s.length === 3) s = '0' + s;
      var h = +s.slice(0, 2), m = +s.slice(2);
      if (h > 23 || m > 59) return null;
      return { h: h, m: m };
    }
    var now0 = new Date(), dateStr = nowISO(now0), timeStr = nowHhMM(now0);
    function whenDate() {
      var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr), c = parseClock(timeStr);
      if (!m) return new Date();
      return new Date(+m[1], +m[2] - 1, +m[3], c ? c.h : 0, c ? c.m : 0);
    }

    var card = A.UI.card();
    var pr = A.el('.split');
    pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); } }));
    pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); } }));
    card.appendChild(pr);
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (pos) {
          st.lat = fmtLat(pos.coords.latitude); st.lon = fmtLon(pos.coords.longitude);
          save(); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    }));
    var dwrap = A.el('.fld'); dwrap.appendChild(A.el('span.fld-lab', { text: 'Date' }));
    var dIn = A.el('input.fld-in', { type: 'date', value: dateStr });
    dIn.addEventListener('change', function () { dateStr = dIn.value; calc(); });
    dwrap.appendChild(dIn);
    var twrap = A.el('.fld'); twrap.appendChild(A.el('span.fld-lab', { text: 'Time (24h, e.g. 14h30)' }));
    var tIn = A.el('input.fld-in', { type: 'text', inputmode: 'numeric', value: timeStr, placeholder: '14h30' });
    tIn.addEventListener('input', function () { timeStr = tIn.value; calc(); });
    twrap.appendChild(tIn);
    card.appendChild(A.el('.split', { style: { marginTop: '8px' } }, [dwrap, twrap]));
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('clock') + ' Now',
      onclick: function () { var n = new Date(); dateStr = nowISO(n); timeStr = nowHhMM(n); dIn.value = dateStr; tIn.value = timeStr; calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Stick height', inputmode: 'decimal', suffix: 'm', value: ss.h, placeholder: '1.0',
      hint: 'Any straight thing stood upright. The height only scales the shadow, never its direction.',
      oninput: function (e) { ss.h = e.target.value; saveS(); calc(); }
    }));
    host.appendChild(card);

    var out = A.el('div');
    host.appendChild(out);

    function plan(shadowBrg, noonBrg, lenRatio) { return stickPlanSVG(shadowBrg, noonBrg, lenRatio); }
    function unusedPlan(shadowBrg, noonBrg, lenRatio) {
      var R = 78;
      /* a shadow can be a hundred times the stick; clamp the drawn length so a
         low sun does not shoot the line off the card, and say so in the numbers */
      var draw = Math.min(R, 16 + lenRatio * 22);
      function pol(r, d) { var t = d * Math.PI / 180; return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)]; }
      var tip = pol(draw, shadowBrg);
      var nA = pol(R + 12, noonBrg), nB = pol(R + 12, noonBrg + 180);
      return '<svg viewBox="-4 -4 208 208" class="stick-svg">' +
        '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="currentColor" opacity="0.16"/>' +
        /* the meridian the noon shadow will lie on */
        '<line x1="' + nA[0] + '" y1="' + nA[1] + '" x2="' + nB[0] + '" y2="' + nB[1] +
        '" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.35"/>' +
        '<text x="100" y="12" text-anchor="middle" font-size="13" font-weight="700" fill="var(--danger)">N</text>' +
        '<text x="100" y="199" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.6">S</text>' +
        '<text x="196" y="104" text-anchor="end" font-size="10" fill="currentColor" opacity="0.6">E</text>' +
        '<text x="4" y="104" font-size="10" fill="currentColor" opacity="0.6">W</text>' +
        /* the shadow itself */
        '<line x1="100" y1="100" x2="' + tip[0] + '" y2="' + tip[1] +
        '" stroke="var(--text)" stroke-width="5" stroke-linecap="round" opacity="0.85"/>' +
        '<circle cx="' + tip[0] + '" cy="' + tip[1] + '" r="4" fill="var(--acc)"/>' +
        '<circle cx="100" cy="100" r="5" fill="var(--danger)"/>' +
        '</svg>';
    }

    function calc() {
      A.clear(out);
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) { out.appendChild(A.UI.empty('Enter a latitude and a longitude.')); return; }
      var now = whenDate();
      var sp = global.ArtSun.position(now, la, lo);
      var h = A.parseNum(ss.h); if (!isFinite(h) || h <= 0) h = 1;

      if (sp.elevation <= 0) {
        /* No sun, no shadow - but dropping the drawing entirely reads as a
           broken page rather than as a fact about the sky. Keep the board and
           show the meridian the shadow will lie on when the sun comes back. */
        var noonN = global.ArtSun.position(new Date(now.getFullYear(), now.getMonth(), now.getDate(),
          Math.floor(sp.noonMinutes / 60), Math.round(sp.noonMinutes % 60)), la, lo);
        var pcN = A.UI.card();
        pcN.appendChild(A.el('.sec-lab', { text: 'No shadow now' }));
        pcN.appendChild(A.el('.stick-plan', {
          html: stickPlanSVG(NaN, N.norm360(noonN.azimuth + 180), NaN)
        }));
        pcN.appendChild(A.el('.lrow-s', {
          style: { whiteSpace: 'normal', marginTop: '6px' },
          text: 'The dashed line is where the noon shadow will lie. Nothing is drawn on it ' +
                'because the sun is down.'
        }));
        out.appendChild(pcN);
        out.appendChild(A.UI.note(
          'The sun is below the horizon at this time, so there is no shadow to read. ' +
          'Move the clock into daylight, or use the stars.'));
        var rs0 = riseSetAt(now, la, lo, -0.833);
        if (!rs0.polar) {
          var cN = A.UI.card(null, 'tight');
          cN.appendChild(A.UI.metric('Sunrise', clockHM(rs0.rise)));
          cN.appendChild(A.UI.metric('Sunset', clockHM(rs0.set)));
          out.appendChild(cN);
        }
        return;
      }

      var shadowBrg = N.norm360(sp.azimuth + 180);
      var ratio = 1 / Math.tan(sp.elevation * Math.PI / 180);
      var len = h * ratio;
      /* the noon shadow is the meridian: due north in the northern hemisphere,
         due south in the southern, and it flips when the sun passes overhead */
      var noonSun = global.ArtSun.position(new Date(now.getFullYear(), now.getMonth(), now.getDate(),
        Math.floor(sp.noonMinutes / 60), Math.round(sp.noonMinutes % 60)), la, lo);
      var noonBrg = N.norm360(noonSun.azimuth + 180);

      var pc = A.UI.card();
      pc.appendChild(A.el('.sec-lab', { text: 'The shadow, seen from above' }));
      pc.appendChild(A.el('.stick-plan', { html: plan(shadowBrg, noonBrg, ratio) }));
      pc.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '6px' },
        text: 'North is up. The red dot is the stick, the line is its shadow, and the ' +
              'dashed line is where the shadow will lie at solar noon.'
      }));
      out.appendChild(pc);

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Shadow points', brg(shadowBrg), { big: true, sub: 'true, not magnetic' }));
      c.appendChild(A.UI.metric('Shadow length', A.fmtNum(len, 2) + ' m',
        { sub: A.fmtNum(ratio, 2) + ' times the stick height' }));
      c.appendChild(A.UI.metric('Sun', brg(sp.azimuth) + '  ·  ' + A.fmtNum(sp.elevation, 1) + '° alt'));
      c.appendChild(A.UI.metric('Solar noon', clockHM(sp.noonMinutes),
        { sub: 'the shadow then lies ' + brg(noonBrg) + ', which is the true meridian' }));
      out.appendChild(c);

      /* the practical instruction, in the order it is actually carried out */
      var howto = A.UI.card();
      howto.appendChild(A.el('.sec-lab', { text: 'Using it on the ground' }));
      howto.appendChild(A.el('p', {
        style: { margin: '4px 0 0', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'Stand a straight stick upright on level ground and mark the tip of its ' +
              'shadow. Turn yourself until the real shadow lies the same way as the one ' +
              'drawn above, and you are lined up with the drawing: north is where the ' +
              'drawing says north. That is a true bearing, so it owes nothing to a ' +
              'magnetometer and cannot be pulled about by the steel you are standing next to.'
      }));
      howto.appendChild(A.el('p', {
        style: { margin: '8px 0 0', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'Without a clock or a position, the old method still works: mark the tip, ' +
              'wait fifteen minutes or more, mark it again. The line from the first mark ' +
              'to the second runs roughly west to east.'
      }));
      out.appendChild(howto);

      if (sp.elevation < 10) {
        out.appendChild(A.UI.note(
          'The sun is low, so the shadow is long and its tip is badly defined. The ' +
          'DIRECTION is still good; the length is not, and a soft-edged tip is hard to ' +
          'mark to better than a few degrees. Nearer midday it tightens up.'));
      }
      if (Math.abs(la) < 23.5) {
        out.appendChild(A.UI.note(
          'Inside the tropics the noon sun can pass overhead, and when it does the noon ' +
          'shadow flips from pointing one way to pointing the other. Read the drawing ' +
          'rather than assuming the noon shadow points north.'));
      }
      out.appendChild(A.UI.note(
        'This needs a sun you can actually see. Under cloud there is no shadow to line ' +
        'up, and the figures above will still be drawn as if there were.'));
    }
    calc();
  }

  /* ══ the shadow stick run backwards ════════════════════════════════════

     The forward problem is: given where and when, where does the shadow fall.
     Both inverses are also solvable, and both are old navigation done with a
     sextant rather than a stick.

     A stick of height h throwing a shadow of length L fixes the sun's ALTITUDE
     exactly: tan(altitude) = h / L. Nothing else is needed, no clock and no
     position. If you can also read which way the shadow lies against true
     north you have the sun's AZIMUTH as well, and altitude plus azimuth at a
     known instant is a single-observation astronomical fix.

       KNOWN POSITION, UNKNOWN TIME. The sun reaches a given altitude twice a
       day, once climbing and once falling, so the altitude alone gives two
       candidate times and the shadow's direction says which. This is how you
       recover a clock you have lost.

       KNOWN TIME, UNKNOWN POSITION. The sun's declination and its sub-solar
       longitude come from the clock alone. Altitude then puts you somewhere on
       a circle of position around the sub-solar point; azimuth cuts that circle
       to a point. Get the time wrong by four minutes and you are a degree of
       longitude out, which is why this one is only as good as your watch.

     Both are solved here by search rather than by closed form: the forward
     model is already on the device and trusted, so the honest thing is to ask
     it what it predicts and walk until the prediction matches what was
     measured. Slower and immune to a sign convention getting reversed. */

  /* PLAN VIEW OF THE STICK, true north up: the stick at the centre, its shadow
     lying away from the sun, and the noon meridian dashed behind it. Shared by
     all three stick tabs, because the picture is the same fact whichever
     direction the question is being asked in - and seeing it is what stops a
     bearing being written down back to front. */
  function stickPlanSVG(shadowBrg, noonBrg, lenRatio) {
    var R = 78;
    /* a shadow can be a hundred times the stick; clamp the drawn length so a
       low sun does not shoot the line off the card, and say so in the numbers */
    var draw = Math.min(R, 16 + (isFinite(lenRatio) ? lenRatio : 1) * 22);
    function pol(r, d) {
      var t = d * Math.PI / 180;
      return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)];
    }
    /* a bearing we do not have draws nothing rather than drawing NaN */
    var hasSh = isFinite(shadowBrg);
    var tip = pol(draw, hasSh ? shadowBrg : 0);
    var g = '';
    if (isFinite(noonBrg)) {
      var nA = pol(R + 12, noonBrg), nB = pol(R + 12, noonBrg + 180);
      g += '<line x1="' + nA[0] + '" y1="' + nA[1] + '" x2="' + nB[0] + '" y2="' + nB[1] +
           '" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.35"/>';
    }
    return '<svg viewBox="-4 -4 208 208" class="stick-svg" preserveAspectRatio="xMidYMid meet">' +
      '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="currentColor" opacity="0.16"/>' + g +
      '<text x="100" y="12" text-anchor="middle" font-size="13" font-weight="700" fill="var(--danger)">N</text>' +
      '<text x="100" y="199" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.6">S</text>' +
      '<text x="196" y="104" text-anchor="end" font-size="10" fill="currentColor" opacity="0.6">E</text>' +
      '<text x="4" y="104" font-size="10" fill="currentColor" opacity="0.6">W</text>' +
      (hasSh ? ('<line x1="100" y1="100" x2="' + tip[0] + '" y2="' + tip[1] +
        '" stroke="var(--text)" stroke-width="5" stroke-linecap="round" opacity="0.85"/>' +
        '<circle cx="' + tip[0] + '" cy="' + tip[1] + '" r="4" fill="var(--acc)"/>') : '') +
      '<circle cx="100" cy="100" r="5" fill="var(--danger)"/>' +
      '</svg>';
  }

  /* sun altitude and azimuth from the shared model */
  function sunAA(date, la, lo) {
    var p = global.ArtSun.position(date, la, lo);
    return { alt: p.elevation, az: p.azimuth };
  }
  function angDiff(a, b) { var d = ((a - b) % 360 + 540) % 360 - 180; return Math.abs(d); }

  /* shadow length and bearing to sun altitude and azimuth */
  function shadowToSun(h, L, shadowBrg) {
    if (!isFinite(h) || !isFinite(L) || h <= 0 || L <= 0) return null;
    return {
      alt: Math.atan2(h, L) * 180 / Math.PI,
      az: isFinite(shadowBrg) ? N.norm360(shadowBrg + 180) : null
    };
  }

  /* Walk the day at a known position and keep the moments where the modelled
     altitude best matches the measured one. Two answers is the normal result. */
  function timesForAltitude(dayStart, la, lo, alt, az) {
    var best = [], prev = null, prevT = null;
    for (var t = 0; t <= 1440; t += 2) {
      var d = new Date(dayStart.getTime() + t * 60000);
      var e = sunAA(d, la, lo).alt - alt;
      if (prev != null && ((prev < 0 && e >= 0) || (prev > 0 && e <= 0))) {
        /* a crossing: bisect down to the minute */
        var a = prevT, b = t;
        for (var k = 0; k < 24; k++) {
          var m = (a + b) / 2;
          var em = sunAA(new Date(dayStart.getTime() + m * 60000), la, lo).alt - alt;
          if ((sunAA(new Date(dayStart.getTime() + a * 60000), la, lo).alt - alt) * em <= 0) b = m; else a = m;
        }
        var tt = (a + b) / 2;
        var aa = sunAA(new Date(dayStart.getTime() + tt * 60000), la, lo);
        best.push({ t: tt, az: aa.az, azErr: (az == null ? null : angDiff(aa.az, az)) });
      }
      prev = e; prevT = t;
    }
    return best;
  }

  /* Grid search over the whole earth for positions that reproduce the measured
     altitude and azimuth.

     ONE SIGHT HAS TWO ANSWERS. There are two unknowns, latitude and hour angle,
     and two measurements, so the solution is isolated but not always single:
     for most sights a second point on the globe sees the sun at exactly the
     same height and exactly the same bearing at exactly that instant. It is the
     mirror of the first through the sun's meridian, and no amount of arithmetic
     on one observation can separate them. That is why a navigator takes two
     sights rather than one, and why this returns BOTH and says so, instead of
     quietly printing whichever the search happened to reach first. Almost
     always the user knows which hemisphere they are in, and that settles it. */
  function positionsForSun(date, alt, az) {
    function err(la, lo) {
      var p = sunAA(date, la, lo);
      var e = Math.abs(p.alt - alt);
      if (az != null) e += angDiff(p.az, az) * 0.6;
      return e;
    }
    /* coarse sweep, keeping every cell that is a local minimum and close */
    var cand = [], la, lo, step = 2;
    for (la = -88; la <= 88; la += step) {
      for (lo = -180; lo < 180; lo += step) {
        var e = err(la, lo);
        if (e > 6) continue;
        if (e <= err(la + step, lo) && e <= err(la - step, lo) &&
            e <= err(la, lo + step) && e <= err(la, lo - step)) {
          cand.push({ lat: la, lon: lo, err: e });
        }
      }
    }
    if (!cand.length) return [];
    /* refine each candidate, then drop the ones that converged together */
    var out = [];
    cand.sort(function (a, b) { return a.err - b.err; });
    cand.slice(0, 8).forEach(function (c) {
      var bLa = c.lat, bLo = c.lon, bE = c.err;
      [[2.0, 0.2], [0.3, 0.02], [0.04, 0.004]].forEach(function (s) {
        var span = s[0], stp = s[1], cLa = bLa, cLo = bLo, i, j;
        for (i = cLa - span * 3; i <= cLa + span * 3; i += stp) {
          if (i < -90 || i > 90) continue;
          for (j = cLo - span * 3; j <= cLo + span * 3; j += stp) {
            var lw = ((j + 540) % 360) - 180;
            var e2 = err(i, lw);
            if (e2 < bE) { bE = e2; bLa = i; bLo = lw; }
          }
        }
      });
      /* only keep a candidate that really reproduces the sight, and treat two
         answers within a couple of degrees as the same answer found twice */
      if (bE > 0.15) return;
      for (var k = 0; k < out.length; k++) {
        if (Math.abs(out[k].lat - bLa) < 2.5 && angDiff(out[k].lon, bLo) < 2.5) return;
      }
      out.push({ lat: bLa, lon: bLo, err: bE });
    });
    out.sort(function (a, b) { return a.err - b.err; });
    return out;
  }

  /* the two measurements every inverse needs, as one reusable block */
  function stickInputs(card, ss, saveS, onchange, wantBearing) {
    var r = A.el('.split');
    r.appendChild(A.UI.field({
      label: 'Stick height', inputmode: 'decimal', suffix: 'm', value: ss.h, placeholder: '1.0',
      oninput: function (e) { ss.h = e.target.value; saveS(); onchange(); }
    }));
    r.appendChild(A.UI.field({
      label: 'Shadow length', inputmode: 'decimal', suffix: 'm', value: ss.L, placeholder: '1.7',
      oninput: function (e) { ss.L = e.target.value; saveS(); onchange(); }
    }));
    card.appendChild(r);
    if (wantBearing) {
      card.appendChild(A.UI.field({
        label: 'Shadow points towards (true)', inputmode: 'decimal', suffix: '°', value: ss.b,
        placeholder: '030',
        hint: 'True, not magnetic. Leave blank if you cannot measure it; the answer gets weaker.',
        oninput: function (e) { ss.b = e.target.value; saveS(); onchange(); }
      }));
    }
    card.appendChild(A.UI.note(
      'Height and length in the SAME unit; only their ratio matters, so paces or ' +
      'handspans work as well as metres. Measure to the middle of the fuzzy tip, ' +
      'and stand the stick truly upright on level ground: a stick leaning by two ' +
      'degrees puts two degrees into the answer.'));
  }

  /* ── shadow stick: find the time ── */
  function toolStickTime(host) {
    var st = A.store.get('nav.sunmoon', { lat: '', lon: '' });
    var ss = A.store.get('nav.stickInv', { h: '1.0', L: '', b: '' });
    function saveS() { A.store.set('nav.stickInv', ss); }
    function pad2(n) { return ('0' + n).slice(-2); }
    var dateStr = (function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); })(new Date());

    var card = A.UI.card();
    card.appendChild(A.el('.sec-lab', { text: 'Where you are' }));
    var pr = A.el('.split');
    pr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: st.lat, placeholder: '25.05460',
      oninput: function (e) { st.lat = e.target.value; A.store.set('nav.sunmoon', st); calc(); } }));
    pr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: st.lon, placeholder: '55.12934',
      oninput: function (e) { st.lon = e.target.value; A.store.set('nav.sunmoon', st); calc(); } }));
    card.appendChild(pr);
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my position',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (p) {
          st.lat = fmtLat(p.coords.latitude); st.lon = fmtLon(p.coords.longitude);
          A.store.set('nav.sunmoon', st); A.Router.refresh();
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    }));
    var dwrap = A.el('.fld'); dwrap.appendChild(A.el('span.fld-lab', { text: 'Date' }));
    var dIn = A.el('input.fld-in', { type: 'date', value: dateStr });
    dIn.addEventListener('change', function () { dateStr = dIn.value; calc(); });
    dwrap.appendChild(dIn);
    card.appendChild(dwrap);
    card.appendChild(A.el('.sec-lab', { text: 'What you measured', style: { marginTop: '12px' } }));
    stickInputs(card, ss, saveS, function () { calc(); }, true);
    host.appendChild(card);

    var out = A.el('div');
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var la = parseCoord(st.lat, false), lo = parseCoord(st.lon, true);
      if (!isFinite(la) || !isFinite(lo)) { out.appendChild(A.UI.empty('Enter a latitude and a longitude.')); return; }
      var sun = shadowToSun(A.parseNum(ss.h), A.parseNum(ss.L), A.parseNum(ss.b));
      if (!sun) { out.appendChild(A.UI.empty('Enter the stick height and the shadow length.')); return; }
      var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr);
      var day = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();

      /* the same plan view as Shadow now: what you measured, drawn, so a bearing
         written down back to front is obvious rather than silently wrong */
      if (sun.az != null) {
        var pc0 = A.UI.card();
        pc0.appendChild(A.el('.sec-lab', { text: 'What you measured, seen from above' }));
        pc0.appendChild(A.el('.stick-plan', {
          html: stickPlanSVG(N.norm360(sun.az + 180), NaN, A.parseNum(ss.L) / A.parseNum(ss.h))
        }));
        pc0.appendChild(A.el('.lrow-s', {
          style: { whiteSpace: 'normal', marginTop: '6px' },
          text: 'North is up. The red dot is the stick and the line is the shadow you measured.'
        }));
        out.appendChild(pc0);
      }

      var mc = A.UI.card(null, 'tight');
      mc.appendChild(A.UI.metric('Sun altitude', A.fmtNum(sun.alt, 2) + '°',
        { big: true, sub: 'from a shadow ' + A.fmtNum(A.parseNum(ss.L) / A.parseNum(ss.h), 2) + ' times the stick' }));
      if (sun.az != null) mc.appendChild(A.UI.metric('Sun azimuth', brg(sun.az), { sub: 'opposite the shadow' }));
      out.appendChild(mc);

      var hits = timesForAltitude(day, la, lo, sun.alt, sun.az);
      if (!hits.length) {
        out.appendChild(A.UI.note(
          'The sun never reaches that altitude here on this date, so the measurement ' +
          'and the position disagree. Check the date, the position, and that the stick ' +
          'was upright.'));
        return;
      }
      if (sun.az != null) hits.sort(function (a, b) { return a.azErr - b.azErr; });

      var c = A.UI.card();
      c.appendChild(A.el('.sec-lab', { text: hits.length > 1 && sun.az == null ? 'Two possible times' : 'Time' }));
      hits.forEach(function (hh, i) {
        var lab = (sun.az != null && i === 0) ? 'Most likely' : (hits.length > 1 ? (i === 0 ? 'Morning' : 'Afternoon') : 'Time');
        c.appendChild(A.UI.metric(lab, clockHM(hh.t),
          { big: i === 0,
            sub: 'sun would bear ' + brg(hh.az) +
                 (hh.azErr != null ? ', ' + A.fmtNum(hh.azErr, 0) + '° from what you measured' : '') }));
      });
      out.appendChild(c);

      if (sun.az == null) {
        out.appendChild(A.UI.note(
          'Without the shadow’s direction the altitude alone cannot say whether the sun ' +
          'was climbing or falling, so both times are given. Morning or afternoon is ' +
          'usually obvious on the ground; if not, measure again ten minutes later and see ' +
          'whether the shadow shortened or lengthened.'));
      }
      out.appendChild(A.UI.note(
        'This is local clock time on the device’s own time zone for the date shown. It ' +
        'is only as good as the position you gave it and the flatness of the ground.'));
    }
    calc();
  }

  /* ── shadow stick: find the place ── */
  function toolStickPlace(host) {
    var ss = A.store.get('nav.stickInv', { h: '1.0', L: '', b: '' });
    function saveS() { A.store.set('nav.stickInv', ss); }
    function pad2(n) { return ('0' + n).slice(-2); }
    var n0 = new Date();
    var dateStr = n0.getFullYear() + '-' + pad2(n0.getMonth() + 1) + '-' + pad2(n0.getDate());
    var timeStr = pad2(n0.getHours()) + 'h' + pad2(n0.getMinutes());
    function parseClock(s) {
      s = (s || '').trim().toLowerCase().replace(/[h:.\s]/g, '');
      if (!/^\d{3,4}$/.test(s)) return null;
      if (s.length === 3) s = '0' + s;
      var h = +s.slice(0, 2), m = +s.slice(2);
      if (h > 23 || m > 59) return null;
      return { h: h, m: m };
    }

    var card = A.UI.card();
    card.appendChild(A.el('.sec-lab', { text: 'When you measured it' }));
    var dwrap = A.el('.fld'); dwrap.appendChild(A.el('span.fld-lab', { text: 'Date' }));
    var dIn = A.el('input.fld-in', { type: 'date', value: dateStr });
    dIn.addEventListener('change', function () { dateStr = dIn.value; });
    dwrap.appendChild(dIn);
    var twrap = A.el('.fld'); twrap.appendChild(A.el('span.fld-lab', { text: 'Time (24h, e.g. 14h30)' }));
    var tIn = A.el('input.fld-in', { type: 'text', inputmode: 'numeric', value: timeStr, placeholder: '14h30' });
    tIn.addEventListener('input', function () { timeStr = tIn.value; });
    twrap.appendChild(tIn);
    card.appendChild(A.el('.split', null, [dwrap, twrap]));
    card.appendChild(A.el('.sec-lab', { text: 'What you measured', style: { marginTop: '12px' } }));
    stickInputs(card, ss, saveS, function () {}, true);
    card.appendChild(A.el('.sec-lab', { text: 'Roughly where you think you are', style: { marginTop: '12px' } }));
    card.appendChild(A.el('p', {
      style: { margin: '2px 0 8px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'Optional, and it can be hundreds of kilometres out. It is only used to pick ' +
            'between the two answers a single sun sight always has.'
    }));
    var gr = A.el('.split');
    gr.appendChild(A.UI.field({ decimalAt: 2, label: 'Latitude', value: ss.gLat || '', placeholder: '25',
      oninput: function (e) { ss.gLat = e.target.value; saveS(); } }));
    gr.appendChild(A.UI.field({ decimalAt: 3, label: 'Longitude', value: ss.gLon || '', placeholder: '55',
      oninput: function (e) { ss.gLon = e.target.value; saveS(); } }));
    card.appendChild(gr);
    card.appendChild(A.el('button.btn.block', {
      html: Icons.svg('pin') + ' Work out where I am',
      style: { marginTop: '10px' },
      onclick: run
    }));
    host.appendChild(card);

    var out = A.el('div');
    host.appendChild(out);

    function run() {
      A.clear(out);
      var sun = shadowToSun(A.parseNum(ss.h), A.parseNum(ss.L), A.parseNum(ss.b));
      if (!sun) { A.toast('Enter the stick height and the shadow length'); return; }
      if (sun.az == null) {
        out.appendChild(A.UI.note(
          'A position needs the shadow’s DIRECTION as well as its length. The length ' +
          'alone puts you on a circle thousands of kilometres round, and there is no way ' +
          'to say where on it you are standing. Measure the bearing of the shadow against ' +
          'true north and try again.'));
        return;
      }
      var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(dateStr), c = parseClock(timeStr);
      if (!m || !c) { A.toast('Check the date and the time'); return; }
      var when = new Date(+m[1], +m[2] - 1, +m[3], c.h, c.m);

      var pc1 = A.UI.card();
      pc1.appendChild(A.el('.sec-lab', { text: 'What you measured, seen from above' }));
      pc1.appendChild(A.el('.stick-plan', {
        html: stickPlanSVG(N.norm360(sun.az + 180), NaN, A.parseNum(ss.L) / A.parseNum(ss.h))
      }));
      pc1.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '6px' },
        text: 'North is up. The red dot is the stick and the line is the shadow you measured.'
      }));
      out.appendChild(pc1);

      A.toast('Searching…');
      var fixes = positionsForSun(when, sun.alt, sun.az);
      if (!fixes.length) {
        out.appendChild(A.UI.note(
          'No position on earth sees the sun that way at that moment. Check the date, ' +
          'the time and the shadow bearing: one of them is wrong.'));
        return;
      }

      /* a rough guess, if the user has one, picks between the two answers */
      var guess = null, gLa = parseCoord(ss.gLat, false), gLo = parseCoord(ss.gLon, true);
      if (isFinite(gLa) && isFinite(gLo)) guess = { la: gLa, lo: gLo };
      if (guess) {
        fixes.sort(function (a, b) {
          function d(f) { var dl = f.lat - guess.la, dg = angDiff(f.lon, guess.lo) * Math.cos(guess.la * Math.PI / 180); return dl * dl + dg * dg; }
          return d(a) - d(b);
        });
      }

      fixes.forEach(function (fix, i) {
        var fc = A.UI.card();
        fc.appendChild(A.el('.sec-lab', {
          text: fixes.length > 1
            ? (i === 0 ? (guess ? 'Nearest your guess' : 'First possible position') : 'The other possible position')
            : 'Estimated position'
        }));
        fc.appendChild(A.UI.metric('Latitude', fmtLat(fix.lat), { big: i === 0 }));
        fc.appendChild(A.UI.metric('Longitude', fmtLon(fix.lon), { big: i === 0 }));
        var chk = sunAA(when, fix.lat, fix.lon);
        fc.appendChild(A.UI.metric('Check', A.fmtNum(chk.alt, 2) + '° alt  ·  ' + brg(chk.az),
          { sub: 'what the sun would actually do there and then' }));
        fc.appendChild(A.el('button.btn.ghost.block', {
          text: 'Copy to the sun & moon page', style: { marginTop: '10px' },
          onclick: function () {
            var s2 = A.store.get('nav.sunmoon', {});
            s2.lat = fmtLat(fix.lat); s2.lon = fmtLon(fix.lon);
            A.store.set('nav.sunmoon', s2);
            A.haptic(); A.toast('Position saved');
          }
        }));
        out.appendChild(fc);
      });

      if (fixes.length > 1) {
        out.appendChild(A.UI.note(
          'ONE SIGHT, TWO ANSWERS. Both of these places see the sun at exactly that ' +
          'height and exactly that bearing at exactly that moment, and no arithmetic on a ' +
          'single observation can choose between them. Normally you know which hemisphere ' +
          'you are in and the choice is obvious. If it is not, take a second measurement ' +
          'an hour or two later: only one of the two will still fit.'));
      }
      if (fixes[0].err > 1.5) {
        out.appendChild(A.UI.note(
          'The best position found still does not reproduce your measurement well. That ' +
          'usually means the time, the date or the shadow bearing is wrong somewhere. ' +
          'Treat this answer as unreliable.'));
      }

      out.appendChild(A.UI.note(
        'HOW GOOD IS THIS. Longitude comes almost entirely from the clock: four minutes ' +
        'of time is a degree of longitude, about 110 km at the equator. Latitude comes ' +
        'from the sun’s height and is limited by how well you measured the shadow. With a ' +
        'careful stick and a correct watch this lands within tens of kilometres, which is ' +
        'enough to know which country you are in and which way to walk. It is not a GPS ' +
        'fix and must not be used as one.'));
      out.appendChild(A.UI.note(
        'The time is read as the device’s own time zone. If the phone’s clock or zone is ' +
        'wrong, the longitude is wrong by exactly that much.'));
    }
  }

  var sunmoonCleanup = null;
  A.Router.register('sunmoon', {
    render: function (host) {
      A.setTitle('Sun & moon', { back: true });
      var sub = A.store.get('nav.sunmoonTab', 'info');
      if (['info', 'map', 'stick'].indexOf(sub) < 0) sub = 'info';
      host.appendChild(A.UI.chips(
        [{ id: 'info', label: 'Info' }, { id: 'map', label: 'Map' }, { id: 'stick', label: 'Shadow stick' }],
        sub,
        function (id) { A.store.set('nav.sunmoonTab', id); A.Router.refresh(); }
      ));
      var body = A.el('div');
      host.appendChild(body);
      if (sub === 'map') {
        sunmoonCleanup = A.SunMoonMap ? A.SunMoonMap(body) : (body.appendChild(A.UI.empty('Map unavailable.')), null);
      } else if (sub === 'stick') {
        /* The stick answers three different questions from the same two
           measurements, so they get their own row rather than three more chips
           on the page's top bar. */
        var ssub = A.store.get('nav.stickTab', 'now');
        if (['now', 'time', 'place'].indexOf(ssub) < 0) ssub = 'now';
        body.appendChild(A.UI.chips(
          [{ id: 'now', label: 'Shadow now' }, { id: 'time', label: 'Find the time' }, { id: 'place', label: 'Find the place' }],
          ssub,
          function (id) { A.store.set('nav.stickTab', id); A.Router.refresh(); }
        ));
        var sbody = A.el('div');
        body.appendChild(sbody);
        if (ssub === 'time') toolStickTime(sbody);
        else if (ssub === 'place') toolStickPlace(sbody);
        else toolShadowStick(sbody);
      } else {
        toolSunMoon(body);
      }
    },
    teardown: function () { if (sunmoonCleanup) { try { sunmoonCleanup(); } catch (e) {} sunmoonCleanup = null; } }
  });

  var clinoCleanup = null;
  A.Router.register('clino', {
    render: function (host) { clinoCleanup = toolClinometer(host); },
    teardown: function () { if (clinoCleanup) { try { clinoCleanup(); } catch (e) {} clinoCleanup = null; } }
  });

  /* the sub-solar and sub-lunar points: the spots on the earth where the sun
     and moon are directly overhead, for plotting on a world map. */
  function subPoints(date) {
    date = date || new Date();
    var RAD = Math.PI / 180, DEG = 180 / Math.PI, ecl = 23.4393 * RAD;
    function n180(x) { x = ((x % 360) + 360) % 360; return x > 180 ? x - 360 : x; }
    var se = sunEclLon(date), lam = se.lon * RAD;
    var raSun = n180(Math.atan2(Math.cos(ecl) * Math.sin(lam), Math.cos(lam)) * DEG);
    var decSun = Math.asin(Math.sin(ecl) * Math.sin(lam)) * DEG;
    var mp = moonPosition(date, 0, 0);
    return {
      sun: { lat: decSun, lon: n180(raSun - se.gmst) },
      moon: { lat: mp.dec, lon: n180(mp.ra - mp.gmst) }
    };
  }

  global.ArtEphem = { subPoints: subPoints, moonPhase: moonPhase, moonPosition: moonPosition, sunEclLon: sunEclLon, sunMoon: sunMoon };
  global.ArtNav = { render: render, parseCoord: parseCoord, fmtLat: fmtLat, fmtLon: fmtLon };

})(window);
