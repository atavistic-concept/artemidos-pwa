/*
 * Artemidos - object height from its shadow
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Two methods, because they fail in different ways:
 *
 *   SOLAR    computes the sun elevation from date, time and position, then
 *            height = shadow length × tan(elevation). Needs an accurate clock
 *            and coordinates, and assumes level ground.
 *   COMPARE  measures a known object (a person, a pole) and its shadow at the
 *            same moment, then scales. Needs nothing but a tape, works under
 *            any sun, and is the method to trust when the two disagree.
 *
 * Solar position follows the NOAA algorithm, including the atmospheric
 * refraction correction that matters near sunrise and sunset, which is
 * exactly when shadows are longest and this tool is most tempting to use.
 */
(function (global) {
  'use strict';

  var RAD = Math.PI / 180, DEG = 180 / Math.PI;

  function solarPosition(date, lat, lon) {
    var jd = date.getTime() / 86400000 + 2440587.5;
    var t = (jd - 2451545) / 36525;

    var L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    if (L0 < 0) L0 += 360;
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    var Mr = M * RAD;

    var Ctr = Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t))
      + Math.sin(2 * Mr) * (0.019993 - 0.000101 * t)
      + Math.sin(3 * Mr) * 0.000289;

    var trueLong = L0 + Ctr;
    var omega = 125.04 - 1934.136 * t;
    var lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);

    var secs = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
    var e0 = 23 + (26 + secs / 60) / 60;
    var oblCorr = e0 + 0.00256 * Math.cos(omega * RAD);

    var decl = Math.asin(Math.sin(oblCorr * RAD) * Math.sin(lambda * RAD)) * DEG;

    var y = Math.tan(oblCorr / 2 * RAD); y = y * y;
    var eqTime = 4 * DEG * (
      y * Math.sin(2 * L0 * RAD)
      - 2 * e * Math.sin(Mr)
      + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0 * RAD)
      - 0.5 * y * y * Math.sin(4 * L0 * RAD)
      - 1.25 * e * e * Math.sin(2 * Mr)
    );

    /* minutes elapsed in the UTC day */
    var utcMin = ((jd + 0.5) - Math.floor(jd + 0.5)) * 1440;
    var tst = (utcMin + eqTime + 4 * lon) % 1440;
    if (tst < 0) tst += 1440;

    var ha = tst / 4 - 180;
    if (ha < -180) ha += 360;

    var latR = lat * RAD, declR = decl * RAD, haR = ha * RAD;
    var cosZ = Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(haR);
    var zenith = Math.acos(A.clamp(cosZ, -1, 1)) * DEG;
    var elev = 90 - zenith;

    /* atmospheric refraction lifts the apparent sun near the horizon */
    var ref;
    var te = Math.tan(elev * RAD);
    if (elev > 85) ref = 0;
    else if (elev > 5) ref = 58.1 / te - 0.07 / Math.pow(te, 3) + 0.000086 / Math.pow(te, 5);
    else if (elev > -0.575) ref = 1735 + elev * (-518.2 + elev * (103.4 + elev * (-12.79 + elev * 0.711)));
    else ref = -20.772 / te;
    ref /= 3600;

    var elevCorr = elev + ref;

    var az;
    var azDenom = Math.cos(latR) * Math.sin(zenith * RAD);
    if (Math.abs(azDenom) > 0.001) {
      var azR = ((Math.sin(latR) * Math.cos(zenith * RAD)) - Math.sin(declR)) / azDenom;
      az = 180 - Math.acos(A.clamp(azR, -1, 1)) * DEG;
      if (ha > 0) az = -az;
    } else {
      az = lat > 0 ? 180 : 0;
    }
    az = (az + 360) % 360;

    /* solar noon, in local clock minutes */
    var noonMin = 720 - 4 * lon - eqTime + date.getTimezoneOffset() * -1;

    return { elevation: elevCorr, elevationTrue: elev, azimuth: az, declination: decl, eqTime: eqTime, hourAngle: ha, noonMinutes: noonMin };
  }

  /* sunrise / sunset hour angle for the standard −0.833° solar disc + refraction */
  function sunriseSunset(date, lat, lon) {
    var sp = solarPosition(date, lat, lon);
    var latR = lat * RAD, declR = sp.declination * RAD;
    var cosH = (Math.cos(90.833 * RAD) - Math.sin(latR) * Math.sin(declR)) / (Math.cos(latR) * Math.cos(declR));
    if (cosH > 1) return { polar: 'night' };
    if (cosH < -1) return { polar: 'day' };
    var H = Math.acos(cosH) * DEG;
    return { rise: sp.noonMinutes - H * 4, set: sp.noonMinutes + H * 4, noon: sp.noonMinutes };
  }

  function hhmm(minutes) {
    if (!isFinite(minutes)) return '-';
    minutes = ((minutes % 1440) + 1440) % 1440;
    var h = Math.floor(minutes / 60), m = Math.round(minutes % 60);
    if (m === 60) { m = 0; h = (h + 1) % 24; }
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function localInputValue(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ══ view ═════════════════════════════════════════════════════════════ */

  function render(host, params) {
    var tab = params.query.tab || A.store.get('shadow.tab', 'solar');
    if (tab !== 'solar' && tab !== 'compare') tab = 'solar';
    A.store.set('shadow.tab', tab);

    A.setTitle('Height from shadow');

    host.appendChild(A.mathTabs('shadow'));
    host.appendChild(A.UI.chips(
      [{ id: 'solar', label: 'By sun position' }, { id: 'compare', label: 'By comparison' }],
      tab,
      function (id) { A.Router.go('shadow?tab=' + id); }
    ));

    if (tab === 'solar') renderSolar(host); else renderCompare(host);
  }


  /* ══ the picture ══════════════════════════════════════════════════════════
     Object, its shadow and the sun angle, drawn to the real proportions and
     redrawn on every keystroke. A ratio is abstract; a tall thing beside a long
     shadow is not, and seeing the angle collapse as the sun drops is the whole
     intuition this tool is trying to teach. */
  function shadowDiagram() {
    var wrap = A.el('.shdiag');
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 320 190');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    wrap.appendChild(svg);

    function draw(height, shadow, elevDeg, labels) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (!(height > 0) || !(shadow > 0)) {
        var hint = document.createElementNS(svgNS, 'text');
        hint.setAttribute('x', '160'); hint.setAttribute('y', '100');
        hint.setAttribute('text-anchor', 'middle');
        hint.setAttribute('fill', 'var(--muted)');
        hint.setAttribute('font-size', '11');
        hint.textContent = 'Enter the numbers to see the geometry';
        svg.appendChild(hint);
        return;
      }

      var pad = 34, groundY = 150, baseX = 96;
      /* fit whichever is longer, so the picture is always to scale */
      var maxSpan = Math.max(height, shadow);
      var px = Math.min((320 - baseX - pad) / Math.max(shadow, 0.0001), (groundY - pad) / Math.max(height, 0.0001));
      var hPx = height * px, sPx = shadow * px;

      function mk(tag, attrs, text) {
        var e = document.createElementNS(svgNS, tag);
        Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (text != null) e.textContent = text;
        svg.appendChild(e);
        return e;
      }

      /* ground */
      mk('line', { x1: 20, y1: groundY, x2: 310, y2: groundY, stroke: 'var(--border-2)', 'stroke-width': 1.5 });
      /* the shadow on the ground */
      mk('line', { x1: baseX, y1: groundY, x2: baseX + sPx, y2: groundY, stroke: 'var(--acc2)', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.75 });
      /* the object */
      mk('line', { x1: baseX, y1: groundY, x2: baseX, y2: groundY - hPx, stroke: 'var(--acc)', 'stroke-width': 5, 'stroke-linecap': 'round' });
      /* the sun ray from the top of the object to the shadow tip */
      mk('line', { x1: baseX, y1: groundY - hPx, x2: baseX + sPx, y2: groundY, stroke: 'var(--warn)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' });

      /* the angle arc at the shadow tip */
      var tipX = baseX + sPx, r = Math.min(30, sPx * 0.5);
      if (r > 6) {
        var a = Math.atan2(hPx, sPx);
        var ax = tipX - r, ay = groundY;
        var bx = tipX - r * Math.cos(a), by = groundY - r * Math.sin(a);
        mk('path', { d: 'M ' + ax + ' ' + ay + ' A ' + r + ' ' + r + ' 0 0 1 ' + bx + ' ' + by,
                     fill: 'none', stroke: 'var(--warn)', 'stroke-width': 1.2 });
        mk('text', { x: tipX - r - 6, y: groundY - 8, 'text-anchor': 'end', fill: 'var(--warn)', 'font-size': '11', 'font-weight': '700' },
           A.fmtNum(elevDeg, 3) + '°');
      }

      /* labels */
      mk('text', { x: baseX - 8, y: groundY - hPx / 2, 'text-anchor': 'end', fill: 'var(--acc)', 'font-size': '10.5', 'font-weight': '700' }, labels.h);
      mk('text', { x: baseX + sPx / 2, y: groundY + 16, 'text-anchor': 'middle', fill: 'var(--acc2)', 'font-size': '10.5', 'font-weight': '700' }, labels.s);
      /* a small sun in the direction the light comes from */
      mk('circle', { cx: baseX + sPx + 14, cy: groundY - hPx - 10, r: 7, fill: 'var(--warn)', opacity: 0.85 });
    }

    wrap.draw = draw;
    return wrap;
  }

  function renderSolar(host) {
    var st = A.store.get('shadow.solar', null) || {
      lat: '', lon: '', when: localInputValue(new Date()), shadow: '', height: '', mode: 'shadow'
    };
    /* a stale timestamp is worse than none: refresh it each visit */
    if (!st.whenPinned) st.when = localInputValue(new Date());
    function save() { A.store.set('shadow.solar', st); }

    var card = A.UI.card();
    var out = A.el('div');
    var viz = A.el('.sun-viz');

    var latIn = A.UI.field({
      decimalAt: 2, label: 'Latitude', inputmode: 'decimal', value: st.lat, placeholder: '25.2048',
      oninput: function (e) { st.lat = e.target.value; save(); calc(); }
    });
    var lonIn = A.UI.field({
      decimalAt: 3, label: 'Longitude', inputmode: 'decimal', value: st.lon, placeholder: '55.2708',
      oninput: function (e) { st.lon = e.target.value; save(); calc(); }
    });

    var locBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Use my location',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('This device has no location service'); return; }
        locBtn.textContent = 'Locating…';
        navigator.geolocation.getCurrentPosition(function (p) {
          st.lat = p.coords.latitude.toFixed(5);
          st.lon = p.coords.longitude.toFixed(5);
          latIn.input.value = st.lat;
          lonIn.input.value = st.lon;
          save();
          locBtn.innerHTML = Icons.svg('pin') + ' Use my location';
          A.toast('Location set');
          calc();
        }, function (err) {
          locBtn.innerHTML = Icons.svg('pin') + ' Use my location';
          A.toast(err.code === 1 ? 'Location permission refused' : 'Could not get a location fix');
        }, { enableHighAccuracy: true, timeout: 12000 });
      }
    });

    /* No satellite, no signal: pick a city and take its coordinates. The
       database is on the device, so this works fully offline. */
    var cityBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('city') + ' Pick a city (offline)',
      style: { marginTop: '8px' },
      onclick: function () {
        if (!A.pickPlace) { A.toast('Place list unavailable'); return; }
        A.pickPlace(function (p) {
          st.lat = p.lat.toFixed(5);
          st.lon = p.lon.toFixed(5);
          latIn.input.value = st.lat;
          lonIn.input.value = st.lon;
          save();
          A.toast(p.name + ', ' + p.country);
          calc();
        });
      }
    });

    var whenIn = A.UI.field({
      label: 'Date and time (local)', type: 'datetime-local', value: st.when,
      oninput: function (e) { st.when = e.target.value; st.whenPinned = true; save(); calc(); }
    });
    var nowBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('clock') + ' Now',
      onclick: function () {
        st.when = localInputValue(new Date());
        st.whenPinned = false;
        whenIn.input.value = st.when;
        save();
        calc();
      }
    });

    var shadowIn = A.UI.field({
      label: 'Shadow length', inputmode: 'decimal', suffix: A.U.sym('length'), value: st.shadow,
      oninput: function (e) { st.shadow = e.target.value; st.mode = 'shadow'; save(); calc(); }
    });
    var heightIn = A.UI.field({
      label: 'or known height', inputmode: 'decimal', suffix: A.U.sym('length'), value: st.height,
      hint: 'Enter the shadow to get the height, or the height to get the shadow it will cast.',
      oninput: function (e) { st.height = e.target.value; st.mode = 'height'; save(); calc(); }
    });

    card.appendChild(A.el('.split', null, [latIn, lonIn]));
    card.appendChild(locBtn);
    card.appendChild(cityBtn);
    card.appendChild(whenIn);
    card.appendChild(nowBtn);
    card.appendChild(shadowIn);
    card.appendChild(heightIn);
    host.appendChild(card);
    host.appendChild(viz);
    host.appendChild(out);

    function drawViz(elevDeg, h, L) {
      A.clear(viz);
      if (!isFinite(elevDeg) || elevDeg <= 0) return;
      var W = 300, H = 120, ground = H - 14;
      var objH = Math.min(70, Math.max(18, 70 * Math.min(1, (h || 1) / Math.max(h || 1, L || 1))));
      var shLen = objH / Math.tan(Math.max(2, elevDeg) * RAD);
      var scale = Math.min(1, (W - 90) / Math.max(shLen, 1));
      objH *= scale; shLen *= scale;
      var x0 = 46;

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
        '<line x1="8" y1="' + ground + '" x2="' + (W - 8) + '" y2="' + ground + '" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/>' +
        /* shadow */
        '<line x1="' + x0 + '" y1="' + ground + '" x2="' + (x0 + shLen) + '" y2="' + ground + '" stroke="var(--muted)" stroke-width="5" stroke-linecap="round" opacity=".55"/>' +
        /* object */
        '<line x1="' + x0 + '" y1="' + ground + '" x2="' + x0 + '" y2="' + (ground - objH) + '" stroke="var(--acc)" stroke-width="4" stroke-linecap="round"/>' +
        /* sun ray */
        '<line x1="' + (x0 + shLen) + '" y1="' + ground + '" x2="' + x0 + '" y2="' + (ground - objH) + '" stroke="var(--warn)" stroke-width="1.4" stroke-dasharray="4 3"/>' +
        /* sun */
        '<circle cx="' + (x0 + shLen + 22) + '" cy="' + (ground - objH - 22 * Math.tan(Math.max(2, elevDeg) * RAD)) + '" r="8" fill="var(--warn)" opacity=".9"/>' +
        /* angle label */
        '<text x="' + (x0 + shLen - 34) + '" y="' + (ground - 6) + '" fill="var(--warn)" font-size="10" font-weight="700">' + elevDeg.toFixed(1) + '°</text>' +
        /* the two distances, so the picture carries the numbers too */
        (h > 0 ? '<text x="' + (x0 - 6) + '" y="' + (ground - objH / 2) + '" text-anchor="end" fill="var(--acc)" font-size="10" font-weight="700">' + A.esc(A.U.fmt('length', h, { sig: 3 })) + '</text>' : '') +
        (L > 0 ? '<text x="' + (x0 + shLen / 2) + '" y="' + (ground + 11) + '" text-anchor="middle" fill="var(--acc2)" font-size="10" font-weight="700">' + A.esc(A.U.fmt('length', L, { sig: 3 })) + '</text>' : '') +
        '</svg>';
      viz.innerHTML = svg;
    }

    function calc() {
      A.clear(out);
      var lat = A.parseNum(st.lat), lon = A.parseNum(st.lon);
      if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        out.appendChild(A.UI.note('Enter a latitude between −90 and 90 and a longitude between −180 and 180, or tap "Use my location".'));
        return;
      }
      var when = new Date(st.when);
      if (isNaN(when.getTime())) { out.appendChild(A.UI.note('Enter a valid date and time.')); return; }

      var sp = solarPosition(when, lat, lon);
      var ss = sunriseSunset(when, lat, lon);
      var elev = sp.elevation;

      out.appendChild(A.UI.section('Sun position'));
      var c1 = A.UI.card(null, 'tight');
      c1.appendChild(A.UI.metric('Elevation above horizon', A.fmtNum(elev, 4) + '°', { big: true, icon: 'shadow' }));
      c1.appendChild(A.UI.metric('Azimuth (true north = 0°)', A.fmtNum(sp.azimuth, 4) + '°',
        { sub: compassPoint(sp.azimuth) }));
      c1.appendChild(A.UI.metric('Solar declination', A.fmtNum(sp.declination, 4) + '°'));
      if (ss.polar === 'day') c1.appendChild(A.UI.metric('Sunrise / sunset', 'Midnight sun: the sun does not set today'));
      else if (ss.polar === 'night') c1.appendChild(A.UI.metric('Sunrise / sunset', 'Polar night: the sun does not rise today'));
      else {
        c1.appendChild(A.UI.metric('Sunrise', hhmm(ss.rise)));
        c1.appendChild(A.UI.metric('Solar noon', hhmm(ss.noon), { sub: 'Shortest shadow of the day' }));
        c1.appendChild(A.UI.metric('Sunset', hhmm(ss.set)));
        c1.appendChild(A.UI.note('Times are shown on this device\'s clock. That is what you want when you are standing at the coordinates; if you are checking a location in another time zone, convert them yourself.'));
      }
      out.appendChild(c1);

      if (elev <= 0.5) {
        out.appendChild(A.el('.card', null, [
          A.UI.metric('Cannot measure', 'Sun at or below the horizon', { icon: 'warn' }),
          A.UI.note('At this elevation the shadow is effectively infinite and refraction dominates. Wait until the sun is at least a few degrees up.')
        ]));
        drawViz(NaN);
        return;
      }

      var tanE = Math.tan(elev * RAD);
      var h, L;

      if (st.mode === 'height') {
        h = A.U.from('length', A.parseNum(st.height));
        if (!isFinite(h) || h <= 0) { drawViz(elev, 1, 1 / tanE); return; }
        L = h / tanE;
        shadowIn.input.value = A.fmtNum(A.U.to('length', L), 5);
        st.shadow = shadowIn.input.value;
      } else {
        L = A.U.from('length', A.parseNum(st.shadow));
        if (!isFinite(L) || L <= 0) { drawViz(elev, 1, 1 / tanE); return; }
        h = L * tanE;
        heightIn.input.value = A.fmtNum(A.U.to('length', h), 5);
        st.height = heightIn.input.value;
      }
      save();
      drawViz(elev, h, L);

      out.appendChild(A.UI.section('Result'));
      var c2 = A.UI.card(null, 'tight');
      c2.appendChild(A.UI.metric(st.mode === 'height' ? 'Shadow it casts' : 'Object height',
        A.U.fmt('length', st.mode === 'height' ? L : h, { sig: 5 }), { big: true, icon: 'ruler' }));
      c2.appendChild(A.UI.metric('Shadow to height ratio', A.fmtNum(L / h, 4) + ' : 1'));
      c2.appendChild(A.UI.metric('At solar noon today the shadow would be',
        A.U.fmt('length', h / Math.tan(Math.max(0.5, noonElevation(when, lat, lon)) * RAD), { sig: 4 })));

      /* how much a timing error costs, which is the real accuracy limit */
      var spPlus = solarPosition(new Date(when.getTime() + 300000), lat, lon);
      var hPlus = L * Math.tan(Math.max(0.1, spPlus.elevation) * RAD);
      c2.appendChild(A.UI.metric('Sensitivity to a 5 minute clock error',
        '± ' + A.U.fmt('length', Math.abs(hPlus - h), { sig: 3 }),
        { icon: 'warn', sub: 'Near sunrise and sunset this grows sharply. Prefer the comparison method when the sun is low.' }));
      out.appendChild(c2);

      out.appendChild(A.UI.note('Assumes level ground and a vertical object, with the shadow measured horizontally from the base. On a slope, or where the shadow falls partly up a wall, use the comparison method instead.'));
    }

    function noonElevation(when, lat, lon) {
      var ss = sunriseSunset(when, lat, lon);
      if (!isFinite(ss.noon)) return 45;
      var d = new Date(when);
      d.setHours(0, 0, 0, 0);
      var noonDate = new Date(d.getTime() + ss.noon * 60000);
      return solarPosition(noonDate, lat, lon).elevation;
    }

    calc();
  }

  function compassPoint(deg) {
    var pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return pts[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
  }

  function renderCompare(host) {
    var st = A.store.get('shadow.compare', { kh: '1.75', ks: '', us: '' });
    function save() { A.store.set('shadow.compare', st); }

    var card = A.UI.card();
    var out = A.el('div');

    function f(label, key, hint) {
      return A.UI.field({
        label: label, inputmode: 'decimal', suffix: A.U.sym('length'), value: st[key], hint: hint,
        oninput: function (e) { st[key] = e.target.value; save(); calc(); }
      });
    }

    card.appendChild(A.el('.sec-lab', { text: 'The reference object' }));
    card.appendChild(f('Known height', 'kh', 'A person, a pole, a metre rule stood upright. 1.75 m is an average adult.'));
    card.appendChild(f('Its shadow', 'ks'));
    card.appendChild(A.el('.sec-lab', { text: 'The object you are measuring' }));
    card.appendChild(f('Its shadow', 'us'));
    var diag = shadowDiagram();
    card.appendChild(diag);
    card.appendChild(out);
    host.appendChild(card);

    function calc() {
      A.clear(out);
      var kh = A.U.from('length', A.parseNum(st.kh));
      var ks = A.U.from('length', A.parseNum(st.ks));
      var us = A.U.from('length', A.parseNum(st.us));
      if (!isFinite(kh) || !isFinite(ks) || kh <= 0 || ks <= 0) {
        diag.draw(0, 0, 0, {});
        out.appendChild(A.UI.note('Enter the reference height and its shadow.'));
        return;
      }
      var ratio = kh / ks;
      var elev = Math.atan(ratio) * DEG;
      /* draw the object being measured if we have it, else the reference */
      if (isFinite(us) && us > 0) {
        diag.draw(us * ratio, us, elev, { h: A.U.fmt('length', us * ratio, { sig: 3 }), s: A.U.fmt('length', us, { sig: 3 }) });
      } else {
        diag.draw(kh, ks, elev, { h: A.U.fmt('length', kh, { sig: 3 }), s: A.U.fmt('length', ks, { sig: 3 }) });
      }
      out.appendChild(A.UI.metric('Sun elevation implied', A.fmtNum(elev, 4) + '°',
        { sub: 'Derived from the reference alone: no clock or coordinates needed.' }));
      if (!isFinite(us) || us <= 0) {
        out.appendChild(A.UI.note('Now enter the shadow of the object you want to measure.'));
        return;
      }
      out.appendChild(A.UI.metric('Object height', A.U.fmt('length', us * ratio, { sig: 5 }), { big: true, icon: 'ruler' }));
      out.appendChild(A.UI.metric('Scale factor', A.fmtNum(ratio, 5) + ' × the shadow length'));
      out.appendChild(A.UI.metric('Storeys, at 3 m each', A.fmtNum(us * ratio / 3, 3)));
      out.appendChild(A.UI.note('Both shadows must be measured within a few minutes of each other and on ground of the same slope. Done that way this method needs no location, no clock and no assumptions, which is why it is the one to trust in the field.'));
    }

    calc();
  }

  A.Router.register('shadow', { render: render });
  global.ArtSun = { position: solarPosition, riseSet: sunriseSunset };

})(window);
