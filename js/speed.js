/*
 * Artemidos - speed, distance & time catalogue
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Routes:
 *   #/speed                     categories
 *   #/speed/<cat>               subcategories
 *   #/speed/<cat>/<sub>         entries
 *   #/speed/item/<id>           entry with its distance / speed / time card
 */
(function (global) {
  'use strict';

  var C = window.ART_CATALOG;

  /* ══ domain units ═════════════════════════════════════════════════════
     Some trades do not use the unit system the phone is set to, and quoting
     a ship at 44 km/h or an airliner's range in miles is useless to anyone
     who actually operates one. Marine and aviation figures are therefore
     shown in knots and nautical miles alongside whatever the user picked,
     with feet for altitude in aviation, regardless of the chosen system. */

  var DOMAIN = {
    'civ/boat':    { label: 'Marine',   speed: 'kn',  dist: 'nmi' },
    'mil/navy':    { label: 'Marine',   speed: 'kn',  dist: 'nmi' },
    'civ/air':     { label: 'Aviation', speed: 'kn',  dist: 'nmi', alt: 'ft' },
    'civ/heli':    { label: 'Aviation', speed: 'kn',  dist: 'nmi', alt: 'ft' },
    'mil/milair':  { label: 'Aviation', speed: 'kn',  dist: 'nmi', alt: 'ft' },
    'mil/milheli': { label: 'Aviation', speed: 'kn',  dist: 'nmi', alt: 'ft' },
    'mil/uas':     { label: 'Aviation', speed: 'kn',  dist: 'nmi', alt: 'ft' },
    'civ/drone':   { label: 'Aviation', speed: 'm/s', alt: 'ft' },
    'ball/ranges': { label: 'Ballistic', speed: 'm/s', dist: 'm' },
    'mil/missile': { label: 'Ballistic', speed: 'm/s' },
    'mil/arty':    { label: 'Gunnery',  speed: 'm/s', dist: 'm' }
  };

  function domainOf(rec) { return rec ? DOMAIN[rec.cat + '/' + rec.sub] : null; }

  /* "24 kn", only when it differs from what the user is already seeing */
  function domainSpeed(dom, si) {
    if (!dom || !dom.speed) return '';
    if (A.U.unit('speed') === dom.speed) return '';
    return A.fmtNum(Units.fromSI('velocity', si, dom.speed), 4) + ' ' + dom.speed;
  }
  function domainDist(dom, si) {
    if (!dom || !dom.dist) return '';
    if (A.U.unit('dist') === dom.dist) return '';
    return A.fmtNum(Units.fromSI('length', si, dom.dist), 4) + ' ' + dom.dist;
  }
  function domainAlt(dom, si) {
    if (!dom || !dom.alt) return '';
    if (A.U.unit('alt') === dom.alt) return '';
    return A.fmtNum(Units.fromSI('length', si, dom.alt), 4) + ' ' + dom.alt;
  }

  /* ══ shared: the distance / speed / time card ═════════════════════════ */

  /* Renders a speed picker plus two linked fields. Editing either one
     recomputes the other from the selected speed, so it works as a
     distance-to-time calculator and a time-to-distance one at once. */
  function speedCard(rec) {
    var card = A.UI.card();
    var speeds = (rec.speeds || []).filter(function (s) { return s[1] > 0; });

    var state = A.store.get('speed.card.' + rec.id, null) || {};
    if (state.idx == null || state.idx >= speeds.length) state.idx = 0;
    if (state.custom == null) state.custom = '';
    if (state.dist == null) state.dist = '';
    if (state.mode == null) state.mode = 'dist';   /* which field the user last typed in */
    /* default the inline picker to the trade's own unit: a passage is
       naturally entered in nautical miles, not in whatever the phone says */
    var dom = domainOf(rec);
    if (state.dunit == null || state.dunit === 'auto') state.dunit = (dom && dom.dist) ? dom.dist : A.U.unit('dist');

    function save() { A.store.set('speed.card.' + rec.id, state); }

    function currentSpeed() {
      if (state.idx === -1) {
        var v = A.parseNum(state.custom);
        return isFinite(v) && v > 0 ? A.U.from('speed', v) : NaN;
      }
      return speeds[state.idx] ? speeds[state.idx][1] : NaN;
    }

    /* speed selector */
    var chipItems = speeds.map(function (s, i) {
      return { id: i, label: s[0] + '  ·  ' + A.U.fmt('speed', s[1], { sig: 3 }) };
    });
    /* A vehicle is driven at any speed, so Custom belongs there. A physical
       constant is not: there is no custom speed of sound in steel and no
       custom speed of light, and offering one just invites nonsense. */
    if (rec.cat !== 'physics') chipItems.push({ id: -1, label: 'Custom' });
    if (rec.cat === 'physics' && state.idx === -1) state.idx = 0;

    var chipRow = A.UI.chips(chipItems, state.idx, function (id) {
      state.idx = id;
      save();
      paint();
    });
    card.appendChild(chipRow);

    var body = A.el('div');
    card.appendChild(body);

    var customIn, distIn, timeIn, out;

    function recompute(from) {
      var v = currentSpeed();
      if (!isFinite(v) || v <= 0) {
        A.clear(out);
        out.appendChild(A.UI.note('Enter a speed greater than zero.'));
        return;
      }

      var d, tSec;
      if (from === 'time') {
        tSec = parseTime(timeIn.input.value);
        if (!isFinite(tSec)) { A.clear(out); return; }
        d = v * tSec;
        distIn.input.value = A.fmtNum(A.U.toRange(d, state.dunit), 6);
        state.dist = distIn.input.value;
      } else {
        var dv = A.parseNum(distIn.input.value);
        if (!isFinite(dv)) { A.clear(out); return; }
        d = A.U.fromRange(dv, state.dunit);
        tSec = d / v;
        timeIn.input.value = A.fmtDur(tSec / 3600);
        state.dist = distIn.input.value;
      }
      save();
      showResult(d, tSec, v);
    }

    function showResult(d, tSec, v) {
      A.clear(out);
      out.appendChild(A.UI.metric('Travel time', A.fmtDur(tSec / 3600), { big: true, icon: 'clock' }));
      out.appendChild(A.UI.metric('Distance', A.U.fmtRange(d, { sig: 6, unit: state.dunit }), { icon: 'route' }));
      out.appendChild(A.UI.metric('At', A.U.fmt('speed', v, { sig: 4 }), { icon: 'speed' }));

      /* the trade's own units, stated plainly rather than buried in "Also" */
      if (dom) {
        var parts = [];
        var ds = domainDist(dom, d), sp = domainSpeed(dom, v);
        if (ds) parts.push(ds);
        if (sp) parts.push(sp);
        if (parts.length) {
          out.appendChild(A.UI.metric('In ' + dom.label.toLowerCase() + ' units', parts.join('   ·   '),
            { icon: dom.label === 'Marine' ? 'ship' : 'plane' }));
        }
      }

      /* alternative unit read-outs, because field work mixes systems */
      var alt = [];
      if (A.U.unit('dist') !== 'km') alt.push(A.fmtNum(d / 1000, 5) + ' km');
      if (A.U.unit('dist') !== 'mi') alt.push(A.fmtNum(d / 1609.344, 5) + ' mi');
      if (A.U.unit('dist') !== 'nmi' && !(dom && dom.dist === 'nmi')) alt.push(A.fmtNum(d / 1852, 5) + ' nmi');
      if (alt.length) out.appendChild(A.UI.metric('Also', alt.join('   ·   ')));

      /* does the platform actually reach that far on one tank? */
      var rangeSpec = (rec.specs || []).filter(function (s) {
        return s[2] === 'dist' && /range|radius|autonomy|endurance/i.test(s[0]) && s[1] > 0;
      })[0];
      if (rangeSpec) {
        var r = rangeSpec[1];
        var within = d <= r;
        var m = A.UI.metric(
          within ? 'Within ' + rangeSpec[0].toLowerCase() : 'Beyond ' + rangeSpec[0].toLowerCase(),
          A.U.fmtRange(r, { sig: 5 }),
          { icon: within ? 'check' : 'warn', sub: within
            ? A.fmtNum(100 * d / r, 3) + ' % of the stated range'
            : 'Needs ' + A.fmtNum(d / r, 3) + ' × the stated range, so refuelling, resupply or a relay is required' }
        );
        m.querySelector('.metric-ic').style.color = within ? 'var(--ok)' : 'var(--warn)';
        out.appendChild(m);
      }

      /* endurance in hours, where the entry states one */
      var endur = (rec.specs || []).filter(function (s) {
        return s[2] === 'none' && /endurance|hours|duration/i.test((s[3] || '') + ' ' + s[0]) && s[1] > 0;
      })[0];
      if (endur && /hour/i.test(endur[3] || endur[0])) {
        var h = endur[1];
        var okT = (tSec / 3600) <= h;
        out.appendChild(A.UI.metric(
          okT ? 'Within stated endurance' : 'Exceeds stated endurance',
          A.fmtNum(h, 4) + ' h',
          { icon: okT ? 'check' : 'warn' }
        ));
      }
    }

    function paint() {
      A.clear(body);

      if (state.idx === -1) {
        customIn = A.UI.field({
          label: 'Speed', inputmode: 'decimal', suffix: A.U.sym('speed'), value: state.custom,
          oninput: function (e) { state.custom = e.target.value; save(); recompute(state.mode); }
        });
        body.appendChild(customIn);
      }

      distIn = A.UI.rangeField({
        label: 'Distance', value: state.dist, unit: state.dunit,
        oninput: function () { state.mode = 'dist'; recompute('dist'); },
        onunit: function (code) {
          /* keep the physical distance, restate it in the newly chosen unit */
          var siNow = A.U.fromRange(A.parseNum(distIn.input.value), state.dunit);
          state.dunit = code;
          if (isFinite(siNow)) distIn.input.value = A.fmtNum(A.U.toRange(siNow, code), 6);
          state.dist = distIn.input.value;
          save();
          A.haptic();
          recompute('dist');
        }
      });
      timeIn = A.UI.field({
        label: 'or time', placeholder: 'e.g. 2h 30m, 45m, 1:30',
        hint: 'Type a distance or a time and the other one follows. A bare number is read as hours, so write 45m for minutes.',
        oninput: function () { state.mode = 'time'; recompute('time'); }
      });
      body.appendChild(distIn);
      body.appendChild(timeIn);

      out = A.el('div');
      body.appendChild(out);

      recompute(state.mode);
    }

    paint();
    return card;
  }

  /* accepts "2h30", "2h 30m", "1:30", "90m", "45", "1.5h" */
  function parseTime(str) {
    var s = String(str || '').trim().toLowerCase();
    if (!s) return NaN;

    var colon = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(s);
    if (colon) return (+colon[1]) * 3600 + (+colon[2]) * 60 + (+(colon[3] || 0));

    var total = 0, found = false;
    var re = /(\d+(?:[.,]\d+)?)\s*(d|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)?/g;
    var mm;
    while ((mm = re.exec(s)) !== null) {
      if (!mm[0].trim()) continue;
      var n = parseFloat(mm[1].replace(',', '.'));
      if (!isFinite(n)) continue;
      var u = mm[2];
      found = true;
      if (u === 'd') total += n * 86400;
      else if (!u || u[0] === 'h') total += n * 3600;
      else if (u[0] === 'm') total += n * 60;
      else total += n;
    }
    return found ? total : NaN;
  }

  /* ══ photo ════════════════════════════════════════════════════════════
     Every image carries its author and licence, and both are shown. These
     are reusable-licensed or public-domain works, not scraped: the credit is
     a condition of using them, not decoration. */

  /* Full-frame view of one swatch. Pinch-zoom is left to the browser rather
     than reimplemented: the overlay only has to get the image large, keep the
     name visible, and close on a tap or the back gesture. */
  function zoomSwatch(file, label) {
    var ov = A.el('.zoom-ov');
    var img = A.el('img.zoom-img', { src: 'img/camo/' + file, alt: label });
    var cap = A.el('.zoom-cap', { text: label });
    var hint = A.el('.zoom-hint', { text: 'Pinch to zoom · tap to close' });
    ov.appendChild(img);
    ov.appendChild(cap);
    ov.appendChild(hint);

    function close() {
      ov.remove();
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', close);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    ov.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', close);
    document.body.appendChild(ov);
  }

  function photoCard(img) {
    var card = A.el('.photo');
    var el = A.el('img.photo-img', {
      src: 'img/' + img.f,
      alt: img.alt || '',
      loading: 'lazy', decoding: 'async'
    });
    /* a missing file must not leave a broken-image icon in a field tool */
    el.addEventListener('error', function () { card.remove(); });
    card.appendChild(el);

    var cred = A.el('.photo-credit');
    /* An image marked x carries no redistribution licence: it is here for
       identification in this private build only. Say so under the photograph
       rather than printing a licence it does not have. */
    cred.textContent = img.x
      ? 'Reference image, not licensed for redistribution'
      : [img.c, img.l].filter(Boolean).join(' · ');
    if (img.s) {
      cred.style.cursor = 'pointer';
      cred.title = img.s;
      cred.addEventListener('click', function () {
        try { window.open(img.s, '_blank', 'noopener'); } catch (e) {}
      });
    }
    card.appendChild(cred);
    return card;
  }

  /* A scale side-profile identification drawing, shown under the photo. On a
     dark theme the line art reads better on a light plate, so it sits on one. */
  function profileCard(profile, name) {
    var card = A.el('.photo.profile');
    var img = A.el('img.photo-img', {
      src: 'img/' + profile.f,
      alt: name ? 'Side profile of ' + name : 'Side profile',
      loading: 'lazy', decoding: 'async',
      style: { background: '#f4f4f2', padding: '6px' }
    });
    img.addEventListener('error', function () { card.remove(); });
    card.appendChild(img);
    var cred = A.el('.photo-credit', { text: 'Profile · globalmilitary.net' });
    if (profile.s) {
      cred.style.cursor = 'pointer';
      cred.addEventListener('click', function () { try { window.open(profile.s, '_blank', 'noopener'); } catch (e) {} });
    }
    card.appendChild(cred);
    return card;
  }

  /* ══ vision & dead zones ══════════════════════════════════════════════
     A plan view is the only honest way to show a dead zone: the numbers on
     their own ("8 m front, 12 m rear") do not convey that the vehicle is
     sitting inside a ring of ground its crew cannot see into. */

  function blindDiagram(v) {
    var W = 300, H = 260;
    var d = v.dead || { front: 0, side: 0, rear: 0 };

    /* metres spanned by the drawing, front-to-back and across */
    var spanY = d.front + v.hullLen + d.rear;
    var spanX = d.side * 2 + v.hullWid;
    var pad = 30;
    var scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);

    var hullW = v.hullWid * scale, hullL = v.hullLen * scale;
    var cx = W / 2, cy = H / 2;
    var hx = cx - hullW / 2, hy = cy - hullL / 2;

    var fTop = hy - d.front * scale;
    var rBot = hy + hullL + d.rear * scale;
    var sL = hx - d.side * scale, sR = hx + hullW + d.side * scale;

    var e = A.esc;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" ' +
      'aria-label="Plan view of the vehicle showing the ground its crew cannot see">' +
      /* dead zone */
      '<rect x="' + sL + '" y="' + fTop + '" width="' + (sR - sL) + '" height="' + (rBot - fTop) + '" ' +
        'fill="var(--danger)" fill-opacity=".16" stroke="var(--danger)" stroke-opacity=".5" ' +
        'stroke-width="1" stroke-dasharray="4 3" rx="6"/>' +
      /* hull */
      '<rect x="' + hx + '" y="' + hy + '" width="' + hullW + '" height="' + hullL + '" ' +
        'fill="var(--surface-2)" stroke="var(--acc)" stroke-width="2" rx="3"/>' +
      /* turret and gun, pointing up = front. Only for vehicles that HAVE a
         turret: drawing a gun barrel on a soft-top utility truck was simply
         wrong and made the whole plate read as fiction. */
      (v.turret === false ? '' :
        '<circle cx="' + cx + '" cy="' + (cy + hullL * 0.06) + '" r="' + (hullW * 0.28) + '" ' +
          'fill="none" stroke="var(--acc)" stroke-width="1.6"/>' +
        '<line x1="' + cx + '" y1="' + (cy + hullL * 0.06) + '" x2="' + cx + '" y2="' + (hy - 6) + '" ' +
          'stroke="var(--acc)" stroke-width="2.4" stroke-linecap="round"/>') +
      /* measures */
      '<line x1="' + cx + '" y1="' + fTop + '" x2="' + cx + '" y2="' + hy + '" stroke="var(--danger)" stroke-width="1"/>' +
      '<line x1="' + cx + '" y1="' + (hy + hullL) + '" x2="' + cx + '" y2="' + rBot + '" stroke="var(--danger)" stroke-width="1"/>' +
      '<line x1="' + sL + '" y1="' + cy + '" x2="' + hx + '" y2="' + cy + '" stroke="var(--danger)" stroke-width="1"/>' +
      /* labels */
      '<text x="' + (cx + 5) + '" y="' + (fTop + (hy - fTop) / 2 + 4) + '" fill="var(--danger)" font-size="11">' +
        e(A.U.fmtRange(d.front, { sig: 2 })) + '</text>' +
      '<text x="' + (cx + 5) + '" y="' + ((hy + hullL) + (rBot - (hy + hullL)) / 2 + 4) + '" fill="var(--danger)" font-size="11">' +
        e(A.U.fmtRange(d.rear, { sig: 2 })) + '</text>' +
      '<text x="' + (sL + 3) + '" y="' + (cy - 6) + '" fill="var(--danger)" font-size="11">' +
        e(A.U.fmtRange(d.side, { sig: 2 })) + '</text>' +
      '<text x="' + cx + '" y="14" fill="var(--muted)" font-size="10" text-anchor="middle">FRONT</text>' +
      '<text x="' + cx + '" y="' + (H - 5) + '" fill="var(--muted)" font-size="10" text-anchor="middle">REAR</text>' +
      '</svg>';
  }

  function visionSection(rec) {
    var v = rec.vision;
    var wrap = document.createElement('div');

    wrap.appendChild(A.UI.section('Crew vision & blind spots'));

    var dia = A.UI.card();
    dia.innerHTML = blindDiagram(v);
    wrap.appendChild(dia);
    wrap.appendChild(A.el('.note', {
      style: { marginTop: '-4px' },
      text: 'The shaded band is the CLOSE-IN GROUND the crew cannot see, measured outward from the hull ' +
        'on level ground. It is not a limit on how far they can see: beyond that band vision is normal, ' +
        'out to the horizon through whatever glass, periscope or sight the vehicle has. A dead zone is ' +
        'about what can hide next to you, not about range.'
    }));

    var c = A.UI.card(null, 'tight');
    c.appendChild(A.UI.metric('Dead zone, front', A.U.fmtRange(v.dead.front, { sig: 3 }), { icon: 'warn' }));
    c.appendChild(A.UI.metric('Dead zone, each side', A.U.fmtRange(v.dead.side, { sig: 3 }), { icon: 'warn' }));
    c.appendChild(A.UI.metric('Dead zone, rear', A.U.fmtRange(v.dead.rear, { sig: 3 }), { icon: 'warn' }));
    if (v.rearAid) c.appendChild(A.UI.metric('Rear vision aid', v.rearAid));
    if (v.blocks != null) {
      c.appendChild(A.UI.metric('Commander vision blocks', v.blocks === 0 ? 'none, screens only' : v.blocks));
    }
    if (v.driverBlocks != null) {
      c.appendChild(A.UI.metric('Driver periscopes', v.driverBlocks === 0 ? 'none, screens only' : v.driverBlocks));
    }
    wrap.appendChild(c);

    wrap.appendChild(A.UI.section('Gun arc & sight distance'));
    var g = A.UI.card(null, 'tight');
    if (v.depression != null) {
      g.appendChild(A.UI.metric('Gun depression', v.depression + '°',
        { sub: 'How far the main armament can point down' }));
    }
    if (v.elevation != null) g.appendChild(A.UI.metric('Gun elevation', '+' + v.elevation + '°'));
    if (v.minEngage) {
      g.appendChild(A.UI.metric('Minimum engagement range', A.U.fmtRange(v.minEngage, { sig: 3 }),
        { icon: 'target', sub: 'Closer than this the gun cannot be depressed onto the target at all' }));
    }
    if (v.horizon) {
      g.appendChild(A.UI.metric('Horizon, flat open ground', A.U.fmtRange(v.horizon, { sig: 4 }),
        { sub: 'Geometry limit from an eye height of ' + A.U.fmt('length', v.eyeHeight, { sig: 2 }) +
               ', before optics, terrain or haze' }));
    }
    wrap.appendChild(g);

    if (v.note) wrap.appendChild(A.UI.note(v.note));

    wrap.appendChild(A.UI.note(
      'Representative figures for the vehicle class, closed down on level ground. The dead zone grows on a ' +
      'slope, in rubble and against a prone target, and shrinks when the commander fights head-out, which is ' +
      'the standing trade between awareness and protection. Treat these as planning figures.'
    ));

    return wrap;
  }

  /* ══ entry detail ═════════════════════════════════════════════════════ */


  /* ══ where to aim ══════════════════════════════════════════════════════
     Attached to every firearm that carries a muzzle velocity. The bullet
     falls the whole way and the wind pushes it the whole way, so the two
     numbers that matter are how far ABOVE the target to hold, and how far
     INTO the wind. Both are solved from the trajectory rather than looked up,
     so they respond to the range, the wind, the air and the height
     difference the user actually has. */
  function firingCard(rec) {
    var B = global.ArtBallistics;
    if (!B) return null;
    var mv = 0;
    (rec.speeds || []).forEach(function (sp) {
      if (/muzzle/i.test(sp[0]) && sp[1] > 0) mv = sp[1];
    });
    if (!(mv > 100)) return null;

    var KEY = 'ball.' + rec.id;
    var st = A.store.get(KEY, null) || A.store.get('ball.last', null) ||
             { range: '300', wind: '0', windDir: '90', temp: '20', sh: '0', th: '0', bc: '' };

    var wrap = A.el('div');
    wrap.appendChild(A.UI.section('Where to aim'));
    var card = A.UI.card();
    wrap.appendChild(card);

    function save() { A.store.set(KEY, st); A.store.set('ball.last', st); }

    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({
      label: 'Range to target', inputmode: 'decimal', suffix: 'm', value: st.range,
      oninput: function (e) { st.range = e.target.value; save(); calc(); }
    }));
    r1.appendChild(A.UI.field({
      label: 'Wind speed', inputmode: 'decimal', suffix: 'km/h', value: st.wind,
      oninput: function (e) { st.wind = e.target.value; save(); calc(); }
    }));
    card.appendChild(r1);

    card.appendChild(A.UI.select({
      label: 'Wind direction, relative to the shot', value: String(st.windDir),
      options: [['90', 'Full value, from the left (9 o\u2019clock)'],
                ['270', 'Full value, from the right (3 o\u2019clock)'],
                ['45', 'Half value, from the front left'],
                ['135', 'Half value, from behind left'],
                ['315', 'Half value, from the front right'],
                ['225', 'Half value, from behind right'],
                ['0', 'Head on, into your face'],
                ['180', 'From behind you']]
        .map(function (o) { return { value: o[0], label: o[1] }; }),
      onchange: function (e) { st.windDir = e.target.value; save(); calc(); }
    }));

    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({
      label: 'Air temperature', inputmode: 'decimal', suffix: '\u00B0C', value: st.temp,
      oninput: function (e) { st.temp = e.target.value; save(); calc(); }
    }));
    r2.appendChild(A.UI.field({
      label: 'Ballistic coefficient', inputmode: 'decimal', value: st.bc,
      placeholder: 'auto', oninput: function (e) { st.bc = e.target.value; save(); calc(); }
    }));
    card.appendChild(r2);

    var r3 = A.el('.split');
    r3.appendChild(A.UI.field({
      label: 'Your height', inputmode: 'decimal', suffix: 'm', value: st.sh,
      oninput: function (e) { st.sh = e.target.value; save(); calc(); }
    }));
    r3.appendChild(A.UI.field({
      label: 'Target height', inputmode: 'decimal', suffix: 'm', value: st.th,
      oninput: function (e) { st.th = e.target.value; save(); calc(); }
    }));
    card.appendChild(r3);

    var out = A.el('div');
    wrap.appendChild(out);

    function calc() {
      A.clear(out);
      var R = A.parseNum(st.range);
      if (!(R > 0)) { out.appendChild(A.UI.note('Enter the range to the target.')); return; }

      var windKmh = A.parseNum(st.wind) || 0;
      var windMs = windKmh / 3.6;
      var dir = A.parseNum(st.windDir) || 0;
      /* the component ACROSS the shot is what moves the bullet sideways; the
         component ALONG it barely matters, which is why a head wind is nearly
         free and a flank wind is not */
      var cross = windMs * Math.sin(dir * Math.PI / 180);
      var head = windMs * Math.cos(dir * Math.PI / 180);

      var bcTyped = A.parseNum(st.bc);
      var bc = (bcTyped > 0) ? bcTyped : B.guessBC(rec.d || rec.n, mv);

      var sol = B.solve({
        muzzle: mv, bc: bc, rangeM: R,
        tempC: A.parseNum(st.temp), windCross: cross, windHead: head,
        shooterH: A.parseNum(st.sh) || 0, targetH: A.parseNum(st.th) || 0
      });

      if (!sol.reachable) { out.appendChild(A.UI.note(sol.why)); return; }

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Aim ABOVE the target',
        A.fmtNum(sol.elevationMil, 3) + ' mil',
        { big: true, sub: A.fmtNum(sol.elevationMoa, 3) + ' MOA   \u00B7   ' +
          A.fmtNum(sol.elevationDeg, 3) + '\u00B0   \u00B7   ' +
          A.fmtNum(sol.elevationCm100 * R / 10000, 3) + ' m at this range' }));

      if (Math.abs(cross) > 0.05) {
        var side = sol.windageMil < 0 ? 'LEFT' : 'RIGHT';
        c.appendChild(A.UI.metric('Aim ' + side + ' of the target',
          A.fmtNum(Math.abs(sol.windageMil), 3) + ' mil',
          { big: true, sub: A.fmtNum(Math.abs(sol.windageMoa), 3) + ' MOA   \u00B7   the wind carries it ' +
            A.fmtNum(Math.abs(sol.driftM), 3) + ' m the other way' }));
      } else {
        c.appendChild(A.UI.metric('Windage', 'none needed',
          { sub: 'no crosswind component in this direction' }));
      }
      out.appendChild(c);

      var d = A.UI.card(null, 'tight');
      d.appendChild(A.UI.metric('Drop if you aimed straight at it',
        A.U.fmtRange(sol.dropM, { sig: 3 }), { sub: 'this is what the elevation is cancelling' }));
      d.appendChild(A.UI.metric('Time of flight', A.fmtNum(sol.timeOfFlight, 3) + ' s',
        { sub: 'the target can move in this time' }));
      d.appendChild(A.UI.metric('Speed on arrival',
        A.U.fmt('vspeed', sol.impactSpeed, { sig: 4 }),
        { sub: 'Mach ' + A.fmtNum(sol.impactMach, 2) +
          (sol.impactMach < 1.1 ? ' - transonic or below, where accuracy falls off' : '') }));
      d.appendChild(A.UI.metric('Ballistic coefficient used', A.fmtNum(bc, 3),
        { sub: bcTyped > 0 ? 'as you entered it' : 'estimated from the calibre - the figure on the ammunition box is better' }));
      out.appendChild(d);

      out.appendChild(A.UI.note(
        'Point-mass trajectory with a G1 drag curve, integrated for these conditions, and ' +
        'checked against published tables for 5.56, 7.62 NATO, .338 and .50. It has NO spin ' +
        'drift, no Coriolis and it assumes one steady wind across the whole flight, which is ' +
        'never true. Past about 600 m those omissions matter. Treat this as the solution to ' +
        'start from and correct off, not as a substitute for a dope card built by shooting.'));
    }
    calc();
    return wrap;
  }

  function renderItem(host, id) {
    var rec = C.item(id);
    if (!rec) { A.Router.go('speed'); return; }

    var cat = C.catOf(rec.cat), sub = C.subOf(rec.cat, rec.sub);
    A.setTitle(rec.n, { back: true });

    /* The crumbs and the entry title carry no styling class, and el() only
       translates text on an element whose class is in TRANSLATED_CLASS. Without
       a class they rendered in English however complete the language pack was,
       which is why the catalogue looked untranslated even where a key existed.
       `.btn` and `.lrow-t` are translated classes and are what these already
       look like, so this is the class they should always have carried. */
    host.appendChild(A.el('.crumbs', null, [
      A.el('button.btn', { text: cat ? cat.n : rec.cat, onclick: function () { A.Router.go('speed/' + rec.cat); } }),
      A.el('span', { text: '›' }),
      A.el('button.btn', { text: sub ? sub.n : rec.sub, onclick: function () { A.Router.go('speed/' + rec.cat + '/' + rec.sub); } })
    ]));

    host.appendChild(A.el('.card.accent', null, [
      A.el('.lrow-t', { text: rec.n, style: { fontSize: '17px', fontWeight: '700' } }),
      rec.d ? A.el('.lrow-s', { text: rec.d, style: { whiteSpace: 'normal' } }) : null
    ]));

    /* A rank entry that carries the whole ladder has no use for one big plate
       above it: the single image was a stand-in from before the ladders
       existed, and showing both says the same thing twice, badly. */
    if (rec.img && !rec.plates) host.appendChild(photoCard(rec.img));
    /* a camouflage swatch is the subject, so it leads the page */
    if (rec.camoImg) {
      var cw = A.el('.photo');
      var ci = A.el('img.photo-img', { src: 'img/camo/' + rec.camoImg, alt: rec.n, loading: 'lazy', decoding: 'async' });
      ci.addEventListener('error', function () { cw.remove(); });
      cw.appendChild(ci);
      host.appendChild(cw);
    }
    /* a country wears several patterns at once, so they are shown together as
       a wall of swatches: identification is a comparison, not a lookup, and
       side by side is the only way the near-identical ones separate */
    if ((rec.swatches || []).length) {
      host.appendChild(A.UI.section('Patterns worn'));
      var sg = A.el('.camo-grid');
      rec.swatches.forEach(function (s) {
        var cell = A.el('.camo-cell');
        var im = A.el('img.camo-img', {
          src: 'img/camo/' + s[1], alt: s[0], loading: 'lazy', decoding: 'async'
        });
        /* A swatch with no image used to delete its own cell, so France said
           "4 patterns" and showed two: the two without a picture vanished and
           took the fact that they exist with them. The pattern is still real
           and still worth knowing about, so the cell stays and says plainly
           that there is no photograph of it yet. */
        im.addEventListener('error', function () {
          im.remove();
          cell.classList.add('camo-none');
          cell.insertBefore(A.el('.camo-noimg', { text: 'No image yet' }), cell.firstChild);
        });
        /* a swatch in a grid is a shortlist, not an identification: the call
           is made on blotch edges and colour count, which need the full frame */
        cell.addEventListener('click', function () { zoomSwatch(s[1], s[0]); });
        cell.appendChild(im);
        cell.appendChild(A.el('.camo-lab', { text: s[0] }));
        sg.appendChild(cell);
      });
      host.appendChild(sg);
    }
    if (rec.profile) host.appendChild(profileCard(rec.profile, rec.n));

    /* an interactive physics calculator replaces the speed card */
    if (rec.calc && global.ArtPhysics && global.ArtPhysics.calc[rec.calc]) {
      host.appendChild(global.ArtPhysics.calc[rec.calc]());
    } else if ((rec.speeds || []).length) {
      host.appendChild(A.UI.section('Distance, speed & time'));
      host.appendChild(speedCard(rec));
    }

    /* firearms get a firing solution before the reference figures */
    if (rec.cat === 'ball' && rec.sub === 'guns') {
      var fc = firingCard(rec);
      if (fc) host.appendChild(fc);
    }

    if ((rec.speeds || []).length) {
      host.appendChild(A.UI.section('Speeds'));
      var sc = A.UI.card(null, 'tight');
      var recDom = domainOf(rec);
      rec.speeds.forEach(function (s) {
        var bits = [];
        var ds = domainSpeed(recDom, s[1]);
        if (ds) bits.push(ds);
        bits.push(A.fmtNum(s[1], 5) + ' m/s');
        if (s[1] > 0) bits.push(A.fmtDur(1000 / s[1] / 3600) + ' per km');
        sc.appendChild(A.UI.metric(s[0], A.U.fmt('speed', s[1], { sig: 4 }), { sub: bits.join('   ·   ') }));
      });
      host.appendChild(sc);
    }

    if ((rec.specs || []).length) {
      host.appendChild(A.UI.section('Specifications'));
      var pc = A.UI.card(null, 'tight');
      var specDom = domainOf(rec);
      rec.specs.forEach(function (s) {
        var label = s[0], val = s[1], kind = s[2], extra = s[3];
        var text, sub = '';
        if (!kind || kind === 'none') text = A.fmtNum(val, 6) + (extra ? ' ' + extra : '');
        else if (kind === 'dist') {
          text = A.U.fmtRange(val, { sig: 5 }) + (extra ? '  (' + extra + ')' : '');
          sub = domainDist(specDom, val);
        } else {
          text = A.U.fmt(kind, val, { sig: 5 }) + (extra ? '  (' + extra + ')' : '');
          if (kind === 'alt') sub = domainAlt(specDom, val);
          else if (kind === 'speed' || kind === 'vspeed') sub = domainSpeed(specDom, val);
        }
        pc.appendChild(A.UI.metric(label, text, sub ? { sub: sub } : null));
      });
      host.appendChild(pc);
    }

    if ((rec.arms || []).length) {
      host.appendChild(A.UI.section('Armament'));
      var armDom = domainOf(rec);
      rec.arms.forEach(function (a) {
        var ac = A.UI.card(null, 'tight');
        ac.appendChild(A.el('.lrow-t', { text: a.n, style: { fontWeight: '650', fontSize: '13.5px', marginBottom: '4px' } }));
        if (a.eff) ac.appendChild(A.UI.metric('Effective range', A.U.fmtRange(a.eff, { sig: 4 }),
          domainDist(armDom, a.eff) ? { sub: domainDist(armDom, a.eff) } : null));
        if (a.max && a.max !== a.eff) ac.appendChild(A.UI.metric('Maximum range', A.U.fmtRange(a.max, { sig: 4 }),
          domainDist(armDom, a.max) ? { sub: domainDist(armDom, a.max) } : null));
        if (a.mv) {
          ac.appendChild(A.UI.metric('Muzzle / flight speed', A.U.fmt('vspeed', a.mv, { sig: 4 })));
          if (a.eff) {
            ac.appendChild(A.UI.metric('Time of flight to effective range',
              A.fmtNum(a.eff / a.mv, 3) + ' s',
              { sub: 'Straight-line approximation: real time of flight is longer because the projectile slows.' }));
          }
        }
        /* What the round does where it lands. A range figure on its own says
           how far the weapon reaches and nothing about how far from the impact
           it is dangerous to stand, which is the question anyone near the
           receiving end is actually asking. */
        if (a.lethal) {
          ac.appendChild(A.UI.metric('Lethal radius at impact', A.U.fmtRange(a.lethal, { sig: 3 }),
            { icon: 'warn', sub: 'unprotected, in the open' }));
          ac.appendChild(A.UI.metric('Casualty radius', A.U.fmtRange(a.casualty, { sig: 3 }),
            { sub: 'going prone materially improves the odds inside this' }));
          ac.appendChild(A.UI.metric('Safe distance starts at', A.U.fmtRange(a.fragTo, { sig: 3 }),
            { icon: 'check', sub: 'furthest fragment travel in the open' }));
        }
        if (a.note) ac.appendChild(A.UI.note(a.note));
        host.appendChild(ac);
      });
    }

    if ((rec.optics || []).length) {
      host.appendChild(A.UI.section('Sights & sensors'));
      var optDom = domainOf(rec);
      var oSub = function (v, base) {
        var d = domainDist(optDom, v);
        return { sub: d ? base + '   ·   ' + d : base };
      };
      rec.optics.forEach(function (o) {
        var oc = A.UI.card(null, 'tight');
        oc.appendChild(A.el('.lrow-t', { text: o.n, style: { fontWeight: '650', fontSize: '13.5px', marginBottom: '4px' } }));
        if (o.ch) oc.appendChild(A.UI.metric('Channels', o.ch));
        if (o.detect) oc.appendChild(A.UI.metric('Detection range', A.U.fmtRange(o.detect, { sig: 4 }),
          oSub(o.detect, 'Something is there')));
        if (o.recognise) oc.appendChild(A.UI.metric('Recognition range', A.U.fmtRange(o.recognise, { sig: 4 }),
          oSub(o.recognise, 'What class of thing it is')));
        if (o.identify) oc.appendChild(A.UI.metric('Identification range', A.U.fmtRange(o.identify, { sig: 4 }),
          oSub(o.identify, 'Which specific type, friend or foe')));
        if (o.fov) oc.appendChild(A.UI.metric('Field of view', o.fov));
        if (o.mag) oc.appendChild(A.UI.metric('Magnification', o.mag));
        if (o.traverse) oc.appendChild(A.UI.metric('Traverse', o.traverse));
        if (o.elev) oc.appendChild(A.UI.metric('Elevation', o.elev));
        if (o.note) oc.appendChild(A.UI.note(o.note));
        host.appendChild(oc);
      });
      host.appendChild(A.UI.note(
        'Detection, recognition and identification are the three Johnson criteria and are not interchangeable: ' +
        'a sight that detects a vehicle at 8 km may only identify it at 3. Every figure assumes clear air. ' +
        'Haze, dust, rain and smoke cut thermal ranges hard, and a hot day flattens thermal contrast.'
      ));
    }

    if (rec.capability) {
      var cp = rec.capability;
      host.appendChild(A.UI.section('Capability'));
      var cc = A.UI.card();
      [
        ['Role', cp.role, 'target'],
        ['Protection', cp.protection, 'shield'],
        ['Mobility', cp.mobility, 'speed'],
        ['Limitations', cp.limits, 'warn'],
        ['Crew', cp.crew, 'person'],
        ['Operators', cp.deployment, 'globe']
      ].forEach(function (r) {
        if (!r[1]) return;
        var blk = A.el('.cap-block');
        blk.appendChild(A.el('.cap-h', { html: Icons.svg(r[2], 'cap-ic') + A.esc(r[0]) }));
        blk.appendChild(A.el('.cap-b', { text: r[1] }));
        cc.appendChild(blk);
      });
      host.appendChild(cc);
    }

    if (rec.vision) host.appendChild(visionSection(rec));

    if (rec.ew) {
      var ew = rec.ew;
      host.appendChild(A.UI.section('Signal, GNSS & spoofing'));
      var ec = A.UI.card();
      [
        ['Control link', ew.link, 'radio'],
        ['Navigation (GNSS)', ew.gnss, 'globe'],
        ['Video / telemetry downlink', ew.downlink, 'radio'],
        ['GNSS spoofing / jamming', ew.spoof, 'warn'],
        ['Command-link jamming', ew.jam, 'warn'],
        ['Most effective soft-kill', ew.best, 'target']
      ].forEach(function (r) {
        if (!r[1]) return;
        var blk = A.el('.cap-block');
        blk.appendChild(A.el('.cap-h', { html: Icons.svg(r[2], 'cap-ic') + A.esc(r[0]) }));
        blk.appendChild(A.el('.cap-b', { text: r[1] }));
        ec.appendChild(blk);
      });
      host.appendChild(ec);
      if (ew.note) host.appendChild(A.UI.note(ew.note));
      host.appendChild(A.UI.note(
        'Frequencies are open-source band-level references, not exact set-on values, and electronic attack is ' +
        'lawful only for authorised operators. Jamming and spoofing affect all users of a band, including aviation ' +
        'and emergency services, and are offences otherwise. Encrypted military links and anti-jam antennas resist ' +
        'much of this.'));
    }

    /* A rank entry shows the plate for EVERY rank, not one for the country.
       The ladder is the thing being looked up: a single insignia identifies
       nothing, because the question is always which of the twenty this one is. */
    if (rec.plates && global.ALGOZ_RANK_PLATES) {
      /* Officers, warrants and enlisted are different reading tasks, so a
         ladder long enough to have both gets a thin band label between them
         and the eye jumps straight to the band it is matching against. Only
         possible when the labels are NATO codes; a name-labelled ladder
         (Italy) has no machine-readable band, so it stays continuous. */
      var bandOf = function (label) {
        if (/^OF/i.test(label)) return 'Officers · OF';
        if (/^WO/i.test(label)) return 'Warrant officers · WO';
        if (/^OR/i.test(label)) return 'Enlisted & NCOs · OR';
        return null;
      };
      Object.keys(rec.plates).forEach(function (key) {
        var rows = global.ALGOZ_RANK_PLATES[key];
        if (!rows || !rows.length) return;
        host.appendChild(A.UI.section(key.split('|')[1] + ' insignia'));
        var banded = rows.every(function (r) { return bandOf(r[0]); });
        var grid = null, lastBand = null;
        rows.forEach(function (r) {
          var band = banded ? bandOf(r[0]) : null;
          if (!grid || (band && band !== lastBand)) {
            if (band) host.appendChild(A.UI.section(band));
            grid = A.el('.plate-grid');
            host.appendChild(grid);
            lastBand = band;
          }
          var cell = A.el('.plate');
          var img = A.el('img.plate-img', { src: 'img/rank/' + r[1], alt: r[0], loading: 'lazy', decoding: 'async' });
          img.addEventListener('error', function () { cell.remove(); });
          cell.appendChild(img);
          cell.appendChild(A.el('.plate-lab', { text: r[0] }));
          var named = (rec.plateNames || {})[r[0]];
          if (named) cell.appendChild(A.el('.plate-name', { text: named }));
          grid.appendChild(cell);
        });
      });
      host.appendChild(A.UI.note('Plates are the comparative insignia from Wikimedia Commons, labelled with the NATO code so they line up across countries. OF is a commissioned officer, OR an enlisted rank or NCO, and the number rises with seniority.'));
    }

    if (rec.table) {
      if (rec.table.plain) host.appendChild(A.UI.section(rec.table.cols[1]));
      /* translate the two headings separately: the joined "A → B" string is
         built here and would never match an entry in the table */
      else host.appendChild(A.UI.section(A.tr(rec.table.cols[0]) + ' → ' + A.tr(rec.table.cols[1])));
      var tc = A.UI.card(null, 'tight');
      rec.table.rows.forEach(function (r) {
        /* The right-hand column of a catalogue table is prose, not a measured
           value - "Concealment only", or a paragraph explaining what a range
           means. The .metric-v class is deliberately left out of the global
           translated-class list because it usually holds numbers and user
           input, so the value is translated HERE, at the one call site where
           it is known to be written English. */
        if (rec.table.plain) {
          var pm = A.UI.metric(r[0], A.tr(r[1]));
          pm.querySelector('.metric-v').style.fontSize = '12.5px';
          pm.querySelector('.metric-v').style.whiteSpace = 'normal';
          pm.querySelector('.metric-v').style.textAlign = 'right';
          pm.querySelector('.metric-v').style.maxWidth = '62%';
          tc.appendChild(pm);
          return;
        }
        /* green means the barrier works. "Total overkill" is the strongest
           possible pass and was rendering amber, which read as a caution. */
        var stops = /^stops|overkill|excellent|strong reduction|fully effective|sufficient|self.shield|best|good|absorbs/i.test(r[1]);
        var through = /pass|penetrat|defeat|no (useful )?protection|no protection|irrelevant|concealment only|wrong (first )?layer|poor|useless/i.test(r[1]);
        /* the colour test above runs on the ENGLISH value, so translating
           after it keeps the red/amber/green judgement working in every
           language */
        var mm = A.UI.metric(r[0], A.tr(r[1]));
        mm.querySelector('.metric-v').style.color = stops ? 'var(--ok)' : (through ? 'var(--danger)' : 'var(--warn)');
        mm.querySelector('.metric-v').style.fontSize = '12.5px';
        mm.querySelector('.metric-v').style.whiteSpace = 'normal';
        mm.querySelector('.metric-v').style.textAlign = 'right';
        mm.querySelector('.metric-v').style.maxWidth = '58%';
        tc.appendChild(mm);
      });
      host.appendChild(tc);
    }

    /* who carries it: a weapon identifies a force only as far as its user
       list is short. The AK pattern narrows nothing; a QBZ or a Tavor narrows
       a great deal. State users and paramilitary carriers plainly. */
    if (rec.users) {
      host.appendChild(A.UI.section('In service with'));
      host.appendChild(A.el('.card', { style: { padding: '12px 14px' } }, [
        A.el('div', { text: rec.users, style: { fontSize: '13px', lineHeight: '1.6', color: 'var(--text-2)' } })
      ]));
    }

    /* the range and sound graphics for this item, drawn to scale from the
       same figures shown above. Grenade page gets the grenade's rings, and so
       on; the same picture the user can drop onto the Map. */
    if (A.rangeGraphic) {
      var gfx = A.rangeGraphic(rec);
      if (gfx) host.appendChild(gfx);
    }

    /* ── an animal's page answers three questions before it answers speed ──
       Could it be here, how far away does it know about me, and what do I do
       if it does. The danger line goes FIRST of the three, because if it is
       the reason you opened the page it should not be below a table. */
    if (rec.danger) {
      host.appendChild(A.UI.section('If you meet one'));
      var dc = A.UI.card(null, 'tight');
      dc.appendChild(A.el('p', {
        text: rec.danger,
        style: { margin: '0', lineHeight: '1.6', color: 'var(--warn)' }
      }));
      host.appendChild(dc);
    }
    if (rec.senses) {
      host.appendChild(A.UI.section('How far it detects you'));
      var sc = A.UI.card(null, 'tight');
      rec.senses.forEach(function (x) {
        sc.appendChild(A.UI.metric(x[0], '', { sub: x[1] }));
      });
      host.appendChild(sc);
      host.appendChild(A.UI.note(
        'Scent range is a property of the WIND, not of the animal: the long figures ' +
        'assume a steady breeze carrying towards it. In still air, broken ground or ' +
        'rain, assume a fraction of them. Being upwind is worth more than being quiet.'));
    }
    if (rec.where) {
      host.appendChild(A.UI.section('Where it is found'));
      var wc = A.UI.card(null, 'tight');
      wc.appendChild(A.el('p', {
        text: rec.where,
        style: { margin: '0', lineHeight: '1.6', color: 'var(--text-2)' }
      }));
      host.appendChild(wc);
    }

    if (rec.note) host.appendChild(A.UI.note(rec.note));

    if (rec.cat === 'mil' || rec.cat === 'ball') {
      host.appendChild(A.UI.note('Open-source reference figures for planning and threat assessment. Real performance varies with configuration, load, environment and ammunition.'));
    }
  }

  /* ══ browse ═══════════════════════════════════════════════════════════ */

  function renderCats(host) {
    A.setTitle('Recon');

    var results = A.el('div');
    host.appendChild(A.UI.search('Search all entries…', function (q) {
      A.clear(results);
      if (!q) { paintCats(); return; }
      var hits = C.search(q);
      if (!hits.length) { results.appendChild(A.UI.empty('Nothing matches "' + q + '".')); return; }
      results.appendChild(A.UI.section(hits.length + ' result' + (hits.length === 1 ? '' : 's')));
      hits.forEach(function (r) {
        var cat = C.catOf(r.cat), sub = C.subOf(r.cat, r.sub);
        results.appendChild(A.UI.row({
          plain: true,
          title: r.n,
          sub: (cat ? cat.n : '') + '  ·  ' + (sub ? sub.n : '') + (r.d ? '  ·  ' + r.d : ''),
          onclick: function () { A.Router.go('speed/item/' + r.id); }
        }));
      });
    }));
    host.appendChild(results);

    function paintCats() {
      A.clear(results);
      /* two to a row: the whole of Recon then fits without scrolling */
      var grid = A.el('.lgrid');
      results.appendChild(grid);
      C.cats().forEach(function (cat) {
        grid.appendChild(A.UI.row({
          icon: cat.icon,
          title: cat.n,
          sub: cat.d,
          count: C.countIn(cat.id),
          onclick: function () { A.Router.go('speed/' + cat.id); }
        }));
      });
      /* Country reference sits with the rest of the reference material rather
         than among the field tools: it is looked up, not operated. */
      grid.appendChild(A.UI.row({
        icon: 'globe',
        title: 'Countries',
        sub: 'Currency, emergency numbers, police and intelligence services, plugs, cities',
        onclick: function () { A.Router.go('country'); }
      }));
    }

    paintCats();
  }

  /* Subcategories are added across several source files, so their natural order
     is the order they happened to load in. These lay them out the way a threat
     picture reads: land first, then air, then sea, then missiles, and air
     defence last. Ids not listed keep their existing relative order. */
  var SUB_ORDER = {
    /* Every id is listed, because an unlisted one falls to the end and splits
       groups that belong together: the two air-defence sections ended up with
       ICBMs and the nuclear section between them. */
    mil: ['tank', 'afv', 'util', 'truck', 'arty', 'milair', 'milheli', 'uas', 'navy',
          'missile', 'icbm', 'nuke', 'ad', 'sam'],
    civ: ['car', 'moto', 'bike', 'truck', 'train', 'personal', 'air', 'heli', 'drone', 'boat']
  };

  function orderSubs(catId, subs) {
    var ord = SUB_ORDER[catId];
    if (!ord) return subs;
    return subs.slice().sort(function (a, b) {
      var ia = ord.indexOf(a.id), ib = ord.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }

  function renderSubs(host, catId) {
    var cat = C.catOf(catId);
    if (!cat) { A.Router.go('speed'); return; }
    A.setTitle(cat.n, { back: true });
    host.appendChild(A.el('.note', { text: cat.d, style: { marginTop: '0', marginBottom: '12px' } }));

    var subGrid = A.el('.lgrid');
    host.appendChild(subGrid);
    orderSubs(catId, cat.subs).forEach(function (s) {
      var n = C.countIn(catId, s.id);
      subGrid.appendChild(A.UI.row({
        icon: s.icon || cat.icon,
        title: s.n,
        sub: s.d || '',
        count: n,
        onclick: function () {
          /* A subcategory holding ONE entry is a door with a corridor behind
             it: tapping "Timeline calculator" should open the calculator, not
             a list of one thing with the same name. Straight through. */
          var only = C.in(catId, s.id);
          if (only.length === 1) A.Router.go('speed/item/' + only[0].id);
          else A.Router.go('speed/' + catId + '/' + s.id);
        }
      }));
    });
  }

  function renderList(host, catId, subId) {
    var cat = C.catOf(catId), sub = C.subOf(catId, subId);
    if (!cat || !sub) { A.Router.go('speed'); return; }
    A.setTitle(sub.n, { back: true });

    var items = C.in(catId, subId);
    var listHost = A.el('div');

    if (items.length > 8) {
      host.appendChild(A.UI.search('Filter ' + sub.n.toLowerCase() + '…', function (q) { paint(q); }));
    }
    host.appendChild(listHost);

    function paint(q) {
      A.clear(listHost);
      q = A.skey(q || '');
      var shown = items.filter(function (r) {
        return !q || A.skey(r.n + ' ' + (r.d || '')).indexOf(q) >= 0;
      });
      if (!shown.length) { listHost.appendChild(A.UI.empty('Nothing matches that.')); return; }

      /* group by country where the subcategory is organised that way, so every
         country's vehicles sit together, each group sorted by name. Entries
         added later, in separate source files, no longer scatter through the
         list: the grouping and sort put them where they belong. */
      /* An entry may carry `ord` to sit outside the alphabet. Some lists have a
         reading order that is not the order of the names: the piece explaining
         cover versus concealment belongs at the head of the material table, not
         filed under T for "The distinction itself", and nuclear yields belong in
         ascending order, not with 1 Mt above 300 kt because "1" sorts first.
         Negative ord sits above the alphabetical block, positive below it. */
      var byName = function (a, b) {
        var oa = a.ord || 0, ob = b.ord || 0;
        if (oa !== ob) return oa - ob;
        return a.n.localeCompare(b.n);
      };
      /* Entries go two to a row like the category cards. Each country group
         gets a grid of its own, so a heading always starts a fresh row rather
         than leaving one card stranded beside the previous country. */
      var gridHost = null;
      function newGrid() { gridHost = A.el('.lgrid'); listHost.appendChild(gridHost); return gridHost; }

      var byCountry = {};
      var hasCountry = shown.some(function (r) { return r.country; });

      /* A heading exists to gather things. Where the list holds ONE entry per
         country - the camouflage patterns do, each country card opening onto
         every pattern that country wears - grouping by country puts a heading
         above every single card and turns a two-column grid into a column of
         eighty headed rows. Nothing is gathered, and the page is three times
         as long for it.

         So the grouping is earned rather than assumed: it applies only when at
         least one country actually has more than one entry under it. The
         vehicles and the aircraft still group; the camouflage runs as one
         plain alphabetical list, two to a row. */
      /* the whole shown set is trimmed before it is grouped, so the preview is
         four entries in total rather than four per country */
      var LICP = global.ArtLicence;
      var fullCount = shown.length;
      if (LICP && !LICP.active()) shown = LICP.previewSlice(shown).shown;

      if (hasCountry) {
        var seen = {}, groups = 0, grouped = false;
        shown.forEach(function (r) {
          if (r.ord) return;
          var k = r.country || 'Other';
          if (seen[k]) grouped = true; else { seen[k] = 1; groups++; }
        });
        if (!grouped) hasCountry = false;
      }

      if (hasCountry) {
        /* ordered entries lead, ahead of the country groups */
        var lead = shown.filter(function (r) { return r.ord; }).sort(byName);
        if (lead.length) { newGrid(); lead.forEach(addRow); }
        shown.filter(function (r) { return !r.ord; })
          .forEach(function (r) { (byCountry[r.country || 'Other'] = byCountry[r.country || 'Other'] || []).push(r); });
        Object.keys(byCountry).sort().forEach(function (k) {
          listHost.appendChild(A.UI.section(k));
          newGrid();
          byCountry[k].sort(byName).forEach(addRow);
        });
      } else {
        newGrid();
        shown.slice().sort(byName).forEach(addRow);
      }
      previewNote(fullCount);

      /* ── the free preview ──
         Four entries and then a count of what is behind the key. The COUNT is
         the part that sells: "4 of 66" is an argument, whereas a list that
         simply stops looks like a bug and teaches nothing. */
      function previewNote(total) {
        var LIC = global.ArtLicence;
        if (!LIC || LIC.active()) return;
        var hidden = total - LIC.FREE_PREVIEW;
        if (hidden <= 0) return;
        var c = A.UI.card();
        c.appendChild(A.el('div', {
          text: 'Showing ' + LIC.FREE_PREVIEW + ' of ' + total,
          style: { fontWeight: '700', fontSize: '1.0625rem' }
        }));
        c.appendChild(A.el('.lrow-s', {
          text: hidden + ' more in this list alone, and the rest of the catalogue ' +
                'besides. A licence opens all of it, once, for life.',
          style: { whiteSpace: 'normal', marginTop: '4px' }
        }));
        c.appendChild(A.el('button.btn.block', {
          html: Icons.svg('money') + ' See what it costs',
          style: { marginTop: '12px' },
          onclick: function () { A.Router.go('activate'); }
        }));
        listHost.appendChild(c);
      }

      function addRow(r) {
        var top = C.topSpeed(r);
        var rd = domainOf(r);
        /* a ship listed at 44 km/h means nothing to anyone who sails one */
        var tag = top > 0
          ? (rd && rd.speed && rd.speed !== 'm/s'
              ? A.fmtNum(Units.fromSI('velocity', top, rd.speed), 3) + ' ' + rd.speed
              : A.U.fmt('speed', top, { sig: 3 }))
          : null;
        (gridHost || listHost).appendChild(A.UI.row({
          plain: true,
          title: r.n,
          sub: r.d || '',
          tag: tag,
          onclick: function () { A.Router.go('speed/item/' + r.id); }
        }));
      }
    }

    paint('');
  }

  /* ══ register ═════════════════════════════════════════════════════════ */

  A.Router.register('speed', {
    render: function (host, r) {
      /* Ranks, insignia and camouflage moved into Military systems, which
         renamed their category in every path. A stored shortcut or an old link
         naming 'rank' still lands where it meant to. */
      if (r.path[0] === 'rank') {
        A.Router.go('speed/mil' + (r.path[1] ? '/' + r.path[1] : ''));
        return;
      }
      if (r.path[0] === 'item') renderItem(host, r.path[1]);
      else if (r.path[1]) renderList(host, r.path[0], r.path[1]);
      else if (r.path[0]) renderSubs(host, r.path[0]);
      else renderCats(host);
    }
  });

  global.ArtSpeed = { card: speedCard, parseTime: parseTime };

})(window);
