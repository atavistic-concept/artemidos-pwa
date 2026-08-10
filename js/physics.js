/*
 * Artemidos - physics calculators + flash-to-bang ranging
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var G = 9.80665;
  var RHO0 = 1.225;           /* air density at sea level, 15 °C, kg/m³ */
  var C_LIGHT = 299792458;

  /* speed of sound in dry air, temperature in °C */
  function soundInAir(tC) { return 331.3 * Math.sqrt(1 + tC / 273.15); }

  /* air density from altitude (ISA) and temperature */
  function airDensity(altM, tC) {
    var p = 101325 * Math.pow(1 - 2.25577e-5 * altM, 5.25588);
    return p / (287.058 * (tC + 273.15));
  }

  /* acosh(exp(k)) without overflowing for large k */
  function acoshExp(k) {
    if (k > 20) return k + Math.LN2;
    return Math.acosh(Math.exp(k));
  }

  /* ══ free fall ════════════════════════════════════════════════════════
     With quadratic drag and constant air density the fall has a closed
     form, so there is no need to integrate:
        v(t)  = vt · tanh(g t / vt)
        y(t)  = (vt²/g) · ln(cosh(g t / vt))
     Inverting y gives the time to fall a given height exactly.          */

  var FALL_PRESETS = [
    { id: 'person', n: 'Person, belly to earth', cd: 1.0, area: 0.7, mass: 80 },
    { id: 'headdown', n: 'Person, head down', cd: 0.7, area: 0.18, mass: 80 },
    { id: 'chute', n: 'Person under a round parachute', cd: 1.75, area: 25, mass: 100 },
    { id: 'brick', n: 'Brick', cd: 1.05, area: 0.0215, mass: 2.5 },
    { id: 'baseball', n: 'Baseball', cd: 0.35, area: 0.0042, mass: 0.145 },
    { id: 'golfball', n: 'Golf ball', cd: 0.25, area: 0.00143, mass: 0.046 },
    { id: 'coin', n: 'Coin (1 euro)', cd: 1.1, area: 0.00042, mass: 0.0075 },
    { id: 'hail', n: 'Hailstone, 20 mm', cd: 0.5, area: 0.000314, mass: 0.0044 },
    { id: 'raindrop', n: 'Raindrop, 4 mm', cd: 0.6, area: 1.26e-5, mass: 3.3e-5 },
    { id: 'steel', n: 'Steel ball, 50 mm', cd: 0.47, area: 0.00196, mass: 0.51 },
    { id: 'tool', n: 'Hand tool dropped from height', cd: 1.1, area: 0.006, mass: 1.2 },
    { id: 'custom', n: 'Custom object', cd: 1.0, area: 0.1, mass: 10 }
  ];

  function terminalVelocity(mass, cd, area, rho) {
    if (!(mass > 0) || !(cd > 0) || !(area > 0) || !(rho > 0)) return Infinity;
    return Math.sqrt(2 * mass * G / (rho * cd * area));
  }

  function fallWithDrag(h, vt) {
    if (!isFinite(vt)) {
      var t0 = Math.sqrt(2 * h / G);
      return { t: t0, v: G * t0 };
    }
    var k = h * G / (vt * vt);
    var t = (vt / G) * acoshExp(k);
    return { t: t, v: vt * Math.tanh(G * t / vt) };
  }

  function fallCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.fall', { preset: 'person', h: '', cd: '1.0', area: '0.7', mass: '80', alt: '0', temp: '15', drag: true });

    var body = A.el('div');
    var out = A.el('div');

    function save() { A.store.set('phys.fall', st); }

    function preset() { return FALL_PRESETS.filter(function (p) { return p.id === st.preset; })[0] || FALL_PRESETS[0]; }

    function calc() {
      A.clear(out);
      var h = A.U.from('alt', A.parseNum(st.h));
      if (!isFinite(h) || h <= 0) { out.appendChild(A.UI.note('Enter a drop height.')); return; }

      var vac = { t: Math.sqrt(2 * h / G), v: Math.sqrt(2 * G * h) };

      out.appendChild(A.UI.section('In a vacuum'));
      var c1 = A.UI.card(null, 'tight');
      c1.appendChild(A.UI.metric('Time to fall', A.fmtDur(vac.t / 3600), { icon: 'clock' }));
      c1.appendChild(A.UI.metric('Impact speed', A.U.fmt('vspeed', vac.v, { sig: 4 }), { big: true }));
      c1.appendChild(A.UI.metric('Also', A.U.fmt('speed', vac.v, { sig: 4 })));
      out.appendChild(c1);

      if (st.drag) {
        var p = preset();
        var cd = st.preset === 'custom' ? A.parseNum(st.cd) : p.cd;
        var area = st.preset === 'custom' ? A.parseNum(st.area) : p.area;
        var mass = st.preset === 'custom' ? A.U.from('mass', A.parseNum(st.mass)) : p.mass;
        var rho = airDensity(A.parseNum(st.alt) || 0, A.parseNum(st.temp));
        if (!isFinite(rho)) rho = RHO0;

        var vt = terminalVelocity(mass, cd, area, rho);
        var r = fallWithDrag(h, vt);

        out.appendChild(A.UI.section('With air resistance'));
        var c2 = A.UI.card(null, 'tight');
        c2.appendChild(A.UI.metric('Time to fall', A.fmtDur(r.t / 3600), { icon: 'clock' }));
        c2.appendChild(A.UI.metric('Impact speed', A.U.fmt('vspeed', r.v, { sig: 4 }), { big: true }));
        c2.appendChild(A.UI.metric('Also', A.U.fmt('speed', r.v, { sig: 4 })));
        c2.appendChild(A.UI.metric('Terminal velocity', A.U.fmt('vspeed', vt, { sig: 4 }),
          { sub: 'Reached after about ' + A.fmtNum(3 * vt / G, 3) + ' s and ' + A.U.fmt('alt', 1.5 * vt * vt / G, { sig: 3 }) + ' of fall' }));
        c2.appendChild(A.UI.metric('Air density used', A.fmtNum(rho, 4) + ' kg/m³',
          { sub: 'At ' + A.U.fmt('alt', A.parseNum(st.alt) || 0, { sig: 3 }) + ' and ' + A.U.fmt('temp', A.U.from('temp', A.parseNum(st.temp)), { sig: 3 }) }));
        c2.appendChild(A.UI.metric('Slower than vacuum by', A.fmtNum(100 * (1 - r.v / vac.v), 3) + ' %'));
        out.appendChild(c2);

        out.appendChild(A.UI.metric('Impact energy', A.fmtNum(0.5 * mass * r.v * r.v, 5) + ' J',
          { sub: 'Kinetic energy at impact, ignoring how it is absorbed' }));
      }
    }

    function paint() {
      A.clear(body);

      body.appendChild(A.UI.field({
        label: 'Drop height', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.h,
        oninput: function (e) { st.h = e.target.value; save(); calc(); }
      }));

      body.appendChild(A.UI.select({
        label: 'Falling object', value: st.preset,
        options: FALL_PRESETS.map(function (p) { return { value: p.id, label: p.n }; }),
        onchange: function (e) { st.preset = e.target.value; save(); paint(); calc(); }
      }));

      if (st.preset === 'custom') {
        var row = A.el('.split');
        row.appendChild(A.UI.field({ label: 'Mass', inputmode: 'decimal', suffix: A.U.sym('mass'), value: st.mass, oninput: function (e) { st.mass = e.target.value; save(); calc(); } }));
        row.appendChild(A.UI.field({ label: 'Frontal area (m²)', inputmode: 'decimal', value: st.area, oninput: function (e) { st.area = e.target.value; save(); calc(); } }));
        body.appendChild(row);
        body.appendChild(A.UI.field({ label: 'Drag coefficient Cd', inputmode: 'decimal', value: st.cd, hint: 'Sphere 0.47, cube 1.05, flat plate 1.28, streamlined 0.04', oninput: function (e) { st.cd = e.target.value; save(); calc(); } }));
      }

      var envRow = A.el('.split');
      envRow.appendChild(A.UI.field({ label: 'Site altitude', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.alt, oninput: function (e) { st.alt = e.target.value; save(); calc(); } }));
      envRow.appendChild(A.UI.field({ label: 'Air temperature', inputmode: 'decimal', suffix: A.U.sym('temp'), value: st.temp, oninput: function (e) { st.temp = e.target.value; save(); calc(); } }));
      body.appendChild(envRow);

      body.appendChild(A.el('button.btn.ghost.block', {
        text: st.drag ? 'Air resistance: on' : 'Air resistance: off',
        onclick: function () { st.drag = !st.drag; save(); paint(); calc(); }
      }));
    }

    card.appendChild(body);
    card.appendChild(out);
    paint();
    calc();
    return card;
  }

  /* ══ terminal velocity ════════════════════════════════════════════════ */

  function terminalCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.term', { mass: '80', area: '0.7', cd: '1.0', alt: '0', temp: '15' });
    var out = A.el('div');

    function calc() {
      A.clear(out);
      var mass = A.U.from('mass', A.parseNum(st.mass));
      var area = A.parseNum(st.area), cd = A.parseNum(st.cd);
      var rho = airDensity(A.parseNum(st.alt) || 0, A.parseNum(st.temp));
      if (!isFinite(mass) || !isFinite(area) || !isFinite(cd) || mass <= 0 || area <= 0 || cd <= 0) {
        out.appendChild(A.UI.note('Enter mass, frontal area and drag coefficient.'));
        return;
      }
      var vt = terminalVelocity(mass, cd, area, rho);
      out.appendChild(A.UI.metric('Terminal velocity', A.U.fmt('vspeed', vt, { sig: 5 }), { big: true }));
      out.appendChild(A.UI.metric('Also', A.U.fmt('speed', vt, { sig: 5 })));
      out.appendChild(A.UI.metric('Time to reach 95 % of it', A.fmtNum(1.83 * vt / G, 4) + ' s'));
      out.appendChild(A.UI.metric('Fall distance to reach it', A.U.fmt('alt', 1.5 * vt * vt / G, { sig: 4 })));
      out.appendChild(A.UI.metric('Air density used', A.fmtNum(rho, 4) + ' kg/m³'));
      out.appendChild(A.UI.note('Terminal velocity is where drag equals weight: v = √(2mg / ρ·Cd·A). Nothing falls faster than this, however far it drops.'));
    }

    function f(label, key, suffix, hint) {
      return A.UI.field({
        label: label, inputmode: 'decimal', suffix: suffix, value: st[key], hint: hint,
        oninput: function (e) { st[key] = e.target.value; A.store.set('phys.term', st); calc(); }
      });
    }

    card.appendChild(f('Mass', 'mass', A.U.sym('mass')));
    card.appendChild(f('Frontal area (m²)', 'area'));
    card.appendChild(f('Drag coefficient Cd', 'cd', null, 'Sphere 0.47, cube 1.05, flat plate 1.28, human belly-down about 1.0'));
    var row = A.el('.split');
    row.appendChild(f('Altitude', 'alt', A.U.sym('alt')));
    row.appendChild(f('Temperature', 'temp', A.U.sym('temp')));
    card.appendChild(row);
    card.appendChild(out);
    calc();
    return card;
  }

  /* ══ projectile motion ════════════════════════════════════════════════ */

  /* RK4 on the drag case; the vacuum case is closed form.
     Wind enters through the drag term, because that is where it enters in
     nature: drag acts on the velocity RELATIVE TO THE AIR, so a tailwind
     (positive, blowing the way the shot goes) reduces the felt airspeed and
     carries the projectile further, a headwind the reverse. In a vacuum wind
     does not exist, which is why the vacuum card has no wind figure. */
  function projectileDrag(v0, angDeg, h0, mass, cd, area, rho, wind) {
    var th = angDeg * Math.PI / 180;
    var x = 0, y = h0, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th);
    var k = 0.5 * rho * cd * area / mass;
    var w = wind || 0;
    var dt = 0.001, t = 0, apex = h0, apexT = 0, steps = 0;

    function acc(vx1, vy1) {
      var rvx = vx1 - w;
      var sp = Math.hypot(rvx, vy1);
      return [-k * sp * rvx, -G - k * sp * vy1];
    }

    while (y >= 0 && steps < 2000000) {
      var a1 = acc(vx, vy);
      var a2 = acc(vx + a1[0] * dt / 2, vy + a1[1] * dt / 2);
      var a3 = acc(vx + a2[0] * dt / 2, vy + a2[1] * dt / 2);
      var a4 = acc(vx + a3[0] * dt, vy + a3[1] * dt);
      var nvx = vx + dt / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
      var nvy = vy + dt / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      var ny = y + dt * (vy + nvy) / 2;
      x += dt * (vx + nvx) / 2;
      if (ny > apex) { apex = ny; apexT = t; }
      y = ny; vx = nvx; vy = nvy;
      t += dt; steps++;
      if (y < 0) break;
    }
    return { range: x, apex: apex, apexT: apexT, time: t, impact: Math.hypot(vx, vy), angle: Math.atan2(-vy, vx) * 180 / Math.PI };
  }

  function projectileCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.proj', { v: '', ang: '45', h: '0', drag: false, mass: '0.145', area: '0.0042', cd: '0.35', alt: '0', temp: '15', wind: '0' });
    var body = A.el('div'), out = A.el('div');

    function save() { A.store.set('phys.proj', st); }

    function calc() {
      A.clear(out);
      var v0 = A.U.from('vspeed', A.parseNum(st.v));
      var ang = A.parseNum(st.ang);
      var h0 = A.U.from('alt', A.parseNum(st.h)) || 0;
      if (!isFinite(v0) || v0 <= 0 || !isFinite(ang)) { out.appendChild(A.UI.note('Enter a launch speed and angle.')); return; }
      if (ang <= -90 || ang >= 90) { out.appendChild(A.UI.note('Launch angle must be between −90° and 90°.')); return; }

      var th = ang * Math.PI / 180;
      var vy = v0 * Math.sin(th), vx = v0 * Math.cos(th);
      /* time to return to y = 0 from height h0 */
      var tv = (vy + Math.sqrt(vy * vy + 2 * G * h0)) / G;
      var vac = {
        range: vx * tv, apex: h0 + vy * vy / (2 * G), time: tv,
        impact: Math.sqrt(v0 * v0 + 2 * G * h0), apexT: vy / G
      };

      out.appendChild(A.UI.section('In a vacuum'));
      var c1 = A.UI.card(null, 'tight');
      c1.appendChild(A.UI.metric('Range', A.U.fmtRange(vac.range, { sig: 5 }), { big: true }));
      c1.appendChild(A.UI.metric('Maximum height', A.U.fmt('alt', vac.apex, { sig: 5 })));
      c1.appendChild(A.UI.metric('Time of flight', A.fmtNum(vac.time, 4) + ' s'));
      c1.appendChild(A.UI.metric('Time to apex', A.fmtNum(vac.apexT, 4) + ' s'));
      c1.appendChild(A.UI.metric('Impact speed', A.U.fmt('vspeed', vac.impact, { sig: 4 })));
      if (h0 === 0) c1.appendChild(A.UI.note('Maximum range in a vacuum is always at 45°. With a launch height above zero the optimum drops slightly below 45°; with air resistance it drops a great deal further.'));
      out.appendChild(c1);

      if (st.drag) {
        var mass = A.parseNum(st.mass), area = A.parseNum(st.area), cd = A.parseNum(st.cd);
        var rho = airDensity(A.parseNum(st.alt) || 0, A.parseNum(st.temp));
        if (!(mass > 0) || !(area > 0) || !(cd > 0)) { out.appendChild(A.UI.note('Enter mass, area and Cd for the drag case.')); return; }
        var wind = A.U.from('speed', A.parseNum(st.wind)) || 0;
        var r = projectileDrag(v0, ang, h0, mass, cd, area, rho, wind);
        out.appendChild(A.UI.section('With air resistance'));
        var c2 = A.UI.card(null, 'tight');
        c2.appendChild(A.UI.metric('Range', A.U.fmtRange(r.range, { sig: 5 }), { big: true }));
        c2.appendChild(A.UI.metric('Maximum height', A.U.fmt('alt', r.apex, { sig: 5 })));
        c2.appendChild(A.UI.metric('Time of flight', A.fmtNum(r.time, 4) + ' s'));
        c2.appendChild(A.UI.metric('Impact speed', A.U.fmt('vspeed', r.impact, { sig: 4 })));
        c2.appendChild(A.UI.metric('Impact angle below horizontal', A.fmtNum(r.angle, 3) + '°'));
        c2.appendChild(A.UI.metric('Range lost to drag', A.fmtNum(100 * (1 - r.range / vac.range), 3) + ' %'));
        if (wind) {
          var r0 = projectileDrag(v0, ang, h0, mass, cd, area, rho, 0);
          c2.appendChild(A.UI.metric('Wind effect on range',
            (r.range >= r0.range ? '+' : '−') + A.U.fmtRange(Math.abs(r.range - r0.range), { sig: 3 }),
            { sub: (wind > 0 ? 'tailwind' : 'headwind') + ' ' + A.U.fmt('speed', Math.abs(wind), { sig: 3 }) }));
        }
        out.appendChild(c2);
        out.appendChild(A.UI.note('Integrated numerically with a constant drag coefficient. Real long-range ballistics also needs spin, transonic drag rise and the Coriolis effect, so treat this as an approximation beyond a few hundred metres.'));
      }
    }

    function paint() {
      A.clear(body);
      body.appendChild(A.UI.field({
        label: 'Launch speed', inputmode: 'decimal', suffix: A.U.sym('vspeed'), value: st.v,
        oninput: function (e) { st.v = e.target.value; save(); calc(); }
      }));
      var row = A.el('.split');
      row.appendChild(A.UI.field({
        label: 'Launch angle (°)', inputmode: 'decimal', value: st.ang,
        oninput: function (e) { st.ang = e.target.value; save(); calc(); }
      }));
      row.appendChild(A.UI.field({
        label: 'Launch height', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.h,
        oninput: function (e) { st.h = e.target.value; save(); calc(); }
      }));
      body.appendChild(row);

      body.appendChild(A.el('button.btn.ghost.block', {
        text: st.drag ? 'Air resistance: on' : 'Air resistance: off',
        onclick: function () { st.drag = !st.drag; save(); paint(); calc(); }
      }));

      if (st.drag) {
        var r2 = A.el('.split');
        r2.appendChild(A.UI.field({ label: 'Mass (kg)', inputmode: 'decimal', value: st.mass, oninput: function (e) { st.mass = e.target.value; save(); calc(); } }));
        r2.appendChild(A.UI.field({ label: 'Area (m²)', inputmode: 'decimal', value: st.area, oninput: function (e) { st.area = e.target.value; save(); calc(); } }));
        body.appendChild(r2);
        body.appendChild(A.UI.field({ label: 'Drag coefficient Cd', inputmode: 'decimal', value: st.cd, oninput: function (e) { st.cd = e.target.value; save(); calc(); } }));
        body.appendChild(A.UI.field({
          label: 'Wind along the shot (+ tail, − head)', inputmode: 'decimal', suffix: A.U.sym('speed'), value: st.wind,
          oninput: function (e) { st.wind = e.target.value; save(); calc(); }
        }));
      }
    }

    card.appendChild(body);
    card.appendChild(out);
    paint();
    calc();
    return card;
  }

  /* ══ stopping distance ════════════════════════════════════════════════ */

  var SURFACES = [
    { id: 'dryasphalt', n: 'Dry asphalt', mu: 0.8 },
    { id: 'dryconcrete', n: 'Dry concrete', mu: 0.85 },
    { id: 'wetasphalt', n: 'Wet asphalt', mu: 0.5 },
    { id: 'wornwet', n: 'Wet asphalt, worn tyres', mu: 0.35 },
    { id: 'gravel', n: 'Gravel or dirt road', mu: 0.4 },
    { id: 'packedsnow', n: 'Packed snow', mu: 0.2 },
    { id: 'ice', n: 'Ice', mu: 0.1 },
    { id: 'sand', n: 'Loose sand', mu: 0.3 }
  ];

  function stoppingCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.stop', { v: '', surf: 'dryasphalt', react: '1.5', grade: '0' });
    var out = A.el('div');

    function save() { A.store.set('phys.stop', st); }

    function calc() {
      A.clear(out);
      var v = A.U.from('speed', A.parseNum(st.v));
      var surf = SURFACES.filter(function (s) { return s.id === st.surf; })[0] || SURFACES[0];
      var rt = A.parseNum(st.react);
      var grade = A.parseNum(st.grade) / 100;
      if (!isFinite(v) || v <= 0) { out.appendChild(A.UI.note('Enter a travelling speed.')); return; }
      if (!isFinite(rt) || rt < 0) rt = 1.5;
      if (!isFinite(grade)) grade = 0;

      /* effective deceleration on a grade: a = g(µ·cosθ + sinθ) */
      var th = Math.atan(grade);
      var a = G * (surf.mu * Math.cos(th) + Math.sin(th));
      if (a <= 0) { out.appendChild(A.UI.empty('On this gradient and surface the vehicle cannot stop: the slope exceeds the available grip.')); return; }

      var dReact = v * rt;
      var dBrake = v * v / (2 * a);
      var total = dReact + dBrake;

      out.appendChild(A.UI.metric('Total stopping distance', A.U.fmtRange(total, { sig: 5 }), { big: true, icon: 'car' }));
      out.appendChild(A.UI.metric('Reaction distance', A.U.fmtRange(dReact, { sig: 4 }), { sub: rt + ' s at ' + A.U.fmt('speed', v, { sig: 4 }) }));
      out.appendChild(A.UI.metric('Braking distance', A.U.fmtRange(dBrake, { sig: 4 }), { sub: 'µ = ' + surf.mu + ', deceleration ' + A.fmtNum(a, 3) + ' m/s²' }));
      out.appendChild(A.UI.metric('Braking time', A.fmtNum(v / a, 3) + ' s'));
      out.appendChild(A.UI.metric('Total time to stop', A.fmtNum(rt + v / a, 3) + ' s'));
      out.appendChild(A.UI.metric('Deceleration', A.fmtNum(a / G, 3) + ' g'));

      /* what speed would you still be doing at a given obstacle distance */
      out.appendChild(A.UI.section('Impact speed if the obstacle is closer'));
      var box = A.UI.card(null, 'tight');
      [0.5, 0.7, 0.85].forEach(function (frac) {
        var dAvail = total * frac;
        var dB = Math.max(0, dAvail - dReact);
        var vImp = Math.sqrt(Math.max(0, v * v - 2 * a * dB));
        box.appendChild(A.UI.metric('At ' + A.U.fmtRange(dAvail, { sig: 4 }),
          vImp > 0 ? 'still doing ' + A.U.fmt('speed', vImp, { sig: 4 }) : 'stopped in time'));
      });
      out.appendChild(box);
      out.appendChild(A.UI.note('Assumes a straight line, level tyres and brakes that do not fade. A loaded or armoured vehicle stops appreciably longer than the same model unloaded.'));
    }

    card.appendChild(A.UI.field({
      label: 'Travelling speed', inputmode: 'decimal', suffix: A.U.sym('speed'), value: st.v,
      oninput: function (e) { st.v = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Surface', value: st.surf,
      options: SURFACES.map(function (s) { return { value: s.id, label: s.n + '  (µ = ' + s.mu + ')' }; }),
      onchange: function (e) { st.surf = e.target.value; save(); calc(); }
    }));
    var row = A.el('.split');
    row.appendChild(A.UI.field({
      label: 'Reaction time (s)', inputmode: 'decimal', value: st.react,
      oninput: function (e) { st.react = e.target.value; save(); calc(); }
    }));
    row.appendChild(A.UI.field({
      label: 'Gradient (%)', inputmode: 'decimal', value: st.grade, hint: 'Negative for downhill',
      oninput: function (e) { st.grade = e.target.value; save(); calc(); }
    }));
    card.appendChild(row);
    card.appendChild(out);
    calc();
    return card;
  }

  /* ══ flash to bang ════════════════════════════════════════════════════
     See the event, start the clock, stop it when the sound arrives. The
     distance follows from the speed of sound in the medium. Light takes a
     negligible but non-zero time, so the exact form is used:
        d = t / (1/c_sound − 1/c_light)                                   */

  var MEDIA = [
    { id: 'air', n: 'Air (uses the temperature below)', v: null },
    { id: 'water', n: 'Fresh water, 20 °C', v: 1482 },
    { id: 'sea', n: 'Sea water, 15 °C', v: 1507 },
    { id: 'steel', n: 'Steel', v: 5960 },
    { id: 'concrete', n: 'Concrete', v: 3400 },
    { id: 'ground', n: 'Dry soil / ground', v: 350 },
    { id: 'ice', n: 'Ice', v: 3200 },
    { id: 'wood', n: 'Wood (along grain)', v: 3850 }
  ];

  function renderFlash(host) {
    A.setTitle('Rangefinder');
    host.appendChild(A.rangeTabs('flash'));

    var st = A.store.get('flash.state', { medium: 'air', temp: '15', alt: '0', delay: '', mode: 'delay' });
    function save() { A.store.set('flash.state', st); }

    host.appendChild(A.el('.card.accent', null, [
      A.el('div', { text: 'See the event, time the sound', style: { fontWeight: '700', fontSize: '15px' } }),
      A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '4px' },
        text: 'Light arrives effectively instantly; sound does not. Time the gap and the distance follows. Works for lightning, an explosion, artillery, a demolition charge, fireworks, a distant gunshot or a rockfall.'
      })
    ]));

    /* ── stopwatch ── */
    var swCard = A.UI.card();
    var swT0 = null, swRaf = null;
    var swDisplay = A.el('.calc-val', { text: '0.00 s', style: { fontSize: '38px', textAlign: 'center', width: '100%' } });
    var swBtn = A.el('button.btn.block');
    var swHint = A.el('.note', { text: 'Tap the moment you see the flash, then again the moment you hear it.' });

    function swTick() {
      if (swT0 == null) return;
      swDisplay.textContent = ((performance.now() - swT0) / 1000).toFixed(2) + ' s';
      swRaf = requestAnimationFrame(swTick);
    }
    function paintSw() {
      swBtn.textContent = swT0 == null ? 'Flash seen: start' : 'Bang heard: stop';
      swBtn.className = 'btn block' + (swT0 == null ? '' : ' danger');
    }
    swBtn.addEventListener('click', function () {
      A.haptic(20);
      if (swT0 == null) {
        swT0 = performance.now();
        swTick();
      } else {
        var el2 = (performance.now() - swT0) / 1000;
        cancelAnimationFrame(swRaf);
        swT0 = null;
        swDisplay.textContent = el2.toFixed(2) + ' s';
        st.delay = el2.toFixed(2);
        st.mode = 'delay';
        save();
        delayIn.input.value = st.delay;
        calc();
      }
      paintSw();
    });
    paintSw();
    swCard.appendChild(swDisplay);
    swCard.appendChild(swBtn);
    swCard.appendChild(swHint);
    host.appendChild(swCard);

    /* ── inputs ── */
    var card = A.UI.card();
    var out = A.el('div');

    var delayIn = A.UI.field({
      label: 'Delay between flash and bang', inputmode: 'decimal', suffix: 'seconds', value: st.delay,
      oninput: function (e) { st.delay = e.target.value; st.mode = 'delay'; save(); calc(); }
    });
    var distIn = A.UI.field({
      label: 'or a known distance', inputmode: 'decimal', suffix: A.U.sym('dist'), value: '',
      hint: 'Enter one and the other is calculated.',
      oninput: function () { st.mode = 'dist'; calc(); }
    });

    var medSel = A.UI.select({
      label: 'Medium the sound travelled through', value: st.medium,
      options: MEDIA.map(function (x) { return { value: x.id, label: x.n }; }),
      onchange: function (e) { st.medium = e.target.value; save(); paintEnv(); calc(); }
    });

    var envHost = A.el('div');

    function paintEnv() {
      A.clear(envHost);
      if (st.medium !== 'air') return;
      var row = A.el('.split');
      row.appendChild(A.UI.field({
        label: 'Air temperature', inputmode: 'decimal', suffix: A.U.sym('temp'), value: st.temp,
        oninput: function (e) { st.temp = e.target.value; save(); calc(); }
      }));
      row.appendChild(A.UI.field({
        label: 'Altitude', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.alt,
        hint: 'Affects temperature, not speed directly.',
        oninput: function (e) { st.alt = e.target.value; save(); calc(); }
      }));
      envHost.appendChild(row);
    }

    function soundSpeed() {
      if (st.medium !== 'air') {
        var med = MEDIA.filter(function (x) { return x.id === st.medium; })[0];
        return med ? med.v : 340.3;
      }
      var tC = A.parseNum(st.temp);
      if (!isFinite(tC)) tC = 15;
      /* if an altitude is given and no temperature was changed, apply the ISA lapse rate */
      return soundInAir(tC);
    }

    function calc() {
      A.clear(out);
      var vs = soundSpeed();

      if (st.mode === 'dist') {
        var dv = A.parseNum(distIn.input.value);
        if (!isFinite(dv) || dv <= 0) return;
        var d2 = A.U.from('dist', dv);
        var t2 = d2 * (1 / vs - 1 / C_LIGHT);
        delayIn.input.value = A.fmtNum(t2, 4);
        st.delay = delayIn.input.value;
        save();
        show(d2, t2, vs);
        return;
      }

      var t = A.parseNum(st.delay);
      if (!isFinite(t) || t <= 0) { out.appendChild(A.UI.note('Time the delay, or enter it above.')); return; }
      var d = t / (1 / vs - 1 / C_LIGHT);
      distIn.input.value = A.fmtNum(A.U.to('dist', d), 6);
      show(d, t, vs);
    }

    function show(d, t, vs) {
      out.appendChild(A.UI.metric('Distance to the event', A.U.fmtRange(d, { sig: 5 }), { big: true, icon: 'route' }));
      out.appendChild(A.UI.metric('Speed of sound used', A.fmtNum(vs, 5) + ' m/s',
        { sub: st.medium === 'air' ? 'Dry air at ' + A.fmtNum(A.parseNum(st.temp) || 15, 3) + ' °C' : null }));
      out.appendChild(A.UI.metric('Delay', A.fmtNum(t, 4) + ' s'));
      out.appendChild(A.UI.metric('Also', A.fmtNum(d / 1000, 5) + ' km   ·   ' + A.fmtNum(d / 1609.344, 5) + ' mi   ·   ' + A.fmtNum(d / 1852, 5) + ' nmi'));

      /* honest error bar: human timing is the dominant uncertainty */
      var err = 0.3 * vs;
      out.appendChild(A.UI.metric('Timing uncertainty', '± ' + A.U.fmtRange(err, { sig: 3 }),
        { icon: 'warn', sub: 'A ±0.3 s error in tapping is normal, and at the speed of sound that is about ' + A.fmtNum(err, 3) + ' m either way.' }));

      out.appendChild(A.UI.section('Quick reference'));
      var q = A.UI.card(null, 'tight');
      [1, 2, 3, 5, 10, 20, 30].forEach(function (s) {
        q.appendChild(A.UI.metric(s + ' second' + (s === 1 ? '' : 's'), A.U.fmtRange(s * vs, { sig: 4 })));
      });
      out.appendChild(q);

      if (st.medium === 'air') {
        out.appendChild(A.UI.note(
          'Rule of thumb: about 3 seconds per kilometre, or 5 seconds per mile. ' +
          'If the delay is under 30 seconds a thunderstorm is within 10 km and lightning can already reach you; under 10 seconds, take cover. ' +
          'The delay shortening between strikes means the storm is closing.'
        ));
      }
    }

    card.appendChild(medSel);
    card.appendChild(envHost);
    card.appendChild(delayIn);
    card.appendChild(distIn);
    card.appendChild(out);
    host.appendChild(card);

    paintEnv();
    calc();

    renderFlash._off = function () { if (swRaf) cancelAnimationFrame(swRaf); };
  }

  A.Router.register('flash', {
    render: renderFlash,
    teardown: function () { if (renderFlash._off) { renderFlash._off(); renderFlash._off = null; } }
  });

  /* ══ temperature change ═══════════════════════════════════════════════
     Energy to take a mass of water from one temperature to another, walking
     through every stage on the way: ice below zero, the melt/freeze step at
     zero, liquid to 100, the boil step, steam beyond. The latent steps are
     the ones intuition misses - freezing a kilogram of water at 0 °C costs
     as much heat removal as cooling it all the way from 80 °C. */

  var WATER = { cIce: 2108, cLiq: 4186, cVap: 2080, lFus: 334000, lVap: 2257000 };

  function waterEnergy(m, t1, t2) {
    /* Energy in joules to move m kg of water from t1 to t2, with the stages.
       The interval is cut at 0 and 100, each piece heated or cooled with the
       right specific heat, and a latent step is added for each boundary the
       interval actually crosses. Every item carries the temperature it
       happens at, so the stages list back in travel order. */
    var up = t2 > t1;
    var lo = Math.min(t1, t2), hi = Math.max(t1, t2);
    var items = [];

    var cuts = [lo, 0, 100, hi]
      .filter(function (x) { return x >= lo && x <= hi; })
      .sort(function (a, b) { return a - b; })
      .filter(function (x, i, arr) { return i === 0 || x !== arr[i - 1]; });

    for (var i = 0; i < cuts.length - 1; i++) {
      var a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
      var c = mid < 0 ? WATER.cIce : (mid < 100 ? WATER.cLiq : WATER.cVap);
      var what = mid < 0 ? 'ice' : (mid < 100 ? 'water' : 'steam');
      var from = up ? a : b, to = up ? b : a;
      items.push([mid, (up ? 'Heat ' : 'Cool ') + what + ' ' + A.fmtNum(from, 3) + ' to ' + A.fmtNum(to, 3) + ' °C',
        m * c * (b - a)]);
    }
    if (lo < 0 && hi > 0) items.push([0, up ? 'Melt the ice at 0 °C' : 'Freeze the water at 0 °C', m * WATER.lFus]);
    if (lo < 100 && hi > 100) items.push([100, up ? 'Boil it away at 100 °C' : 'Condense the steam at 100 °C', m * WATER.lVap]);

    items.sort(function (x, y) { return up ? x[0] - y[0] : y[0] - x[0]; });
    var total = 0;
    var stages = items.filter(function (x) { return x[2] > 1e-9; })
      .map(function (x) { total += x[2]; return [x[1], x[2]]; });
    return { total: total, stages: stages };
  }

  function tempCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.temp', { m: '1', t1: '20', t2: '-18', p: '' });
    var out = A.el('div');
    function save() { A.store.set('phys.temp', st); }

    function calc() {
      A.clear(out);
      var m = A.U.from('mass', A.parseNum(st.m));
      var t1 = A.parseNum(st.t1), t2 = A.parseNum(st.t2);
      if (!isFinite(m) || m <= 0 || !isFinite(t1) || !isFinite(t2)) {
        out.appendChild(A.UI.note('Enter a mass and both temperatures.')); return;
      }
      if (t1 === t2) { out.appendChild(A.UI.note('Same temperature both sides: nothing to do.')); return; }
      var r = waterEnergy(m, t1, t2);
      var dirWord = t2 > t1 ? 'add' : 'remove';
      out.appendChild(A.UI.metric('Energy to ' + dirWord, A.fmtNum(r.total / 1000, 4) + ' kJ', { big: true, icon: 'thermo', sub: A.fmtNum(r.total / 3600000, 3) + ' kWh' }));
      if (r.stages.length > 1) {
        out.appendChild(A.UI.section('Stage by stage'));
        var box = A.UI.card(null, 'tight');
        r.stages.forEach(function (s) { box.appendChild(A.UI.metric(s[0], A.fmtNum(s[1] / 1000, 4) + ' kJ')); });
        out.appendChild(box);
      }
      var p = A.parseNum(st.p);
      if (isFinite(p) && p > 0) {
        var secs = r.total / p;
        out.appendChild(A.UI.metric('Time at ' + A.fmtNum(p, 4) + ' W', A.fmtDur(secs), { sub: 'assumes all of that power reaches the water' }));
      }
      out.appendChild(A.UI.note('Real freezers and stoves waste a large share of their rated power, so real times run 1.5-3x the ideal figure. A domestic freezer removes heat at roughly 50-150 W once the compartment is cold.'));
    }

    card.appendChild(A.UI.field({
      label: 'Mass of water', inputmode: 'decimal', suffix: A.U.sym('mass'), value: st.m,
      oninput: function (e) { st.m = e.target.value; save(); calc(); }
    }));
    var row = A.el('.split');
    row.appendChild(A.UI.field({
      label: 'From', inputmode: 'decimal', suffix: '°C', value: st.t1,
      oninput: function (e) { st.t1 = e.target.value; save(); calc(); }
    }));
    row.appendChild(A.UI.field({
      label: 'To', inputmode: 'decimal', suffix: '°C', value: st.t2,
      oninput: function (e) { st.t2 = e.target.value; save(); calc(); }
    }));
    card.appendChild(row);
    card.appendChild(A.UI.field({
      label: 'Heating / cooling power (optional)', inputmode: 'decimal', suffix: 'W', value: st.p,
      hint: 'Camping stove ~1500 W to the pot · kettle 2000 W · freezer 50-150 W of heat removal.',
      oninput: function (e) { st.p = e.target.value; save(); calc(); }
    }));
    card.appendChild(out);
    calc();
    return card;
  }


  /* ══ biological timeline, rescaled for temperature ═════════════════════════
     Biological and chemical rates roughly double per 10 °C (Q10 ≈ 2). Every
     decay figure in the catalogue is quoted at a 20 °C reference, so a single
     multiplication turns a published window into one for the place you are
     standing. Humidity is offered as a second, coarser factor because it
     decides whether the thing rots or simply dries. */
  function bioTimeCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.biotime', { lo: '2', hi: '6', unit: 'd', ref: '20', temp: '30', hum: 'normal', med: 'air' });
    if (!st.med) st.med = 'air';
    var out = A.el('div');
    function save() { A.store.set('phys.biotime', st); }

    var UNITS = [['h', 'hours'], ['d', 'days'], ['w', 'weeks'], ['mo', 'months']];

    /* ── WHERE IT IS, not just how warm ──
       Water changes this calculation more than temperature does, and it pulls
       in two directions at once, which is exactly why water cases are read
       wrongly. Cooling roughly DOUBLES, so a body reads older than it is,
       while decay roughly HALVES, so it looks fresher than it is. Salt slows
       bacterial breakdown again on top of that.

       The old working figure - one week in water equals two in air equals
       eight in soil - is crude, and it is the right order. These factors are
       that rule, applied to the duration rather than to the rate. */
    var MEDIUM = [
      { id: 'air', n: 'In air', f: 1, note: 'the reference condition for every published figure' },
      { id: 'fresh', n: 'In FRESH water', f: 2,
        note: 'decay runs at about half the speed of air. Cooling, separately, runs at about twice - so the body is colder AND less decomposed than its age suggests' },
      { id: 'salt', n: 'In SALT water', f: 2.6,
        note: 'slower again than fresh: salt inhibits many of the organisms driving decay. Scavenging by fish and crustaceans then becomes the dominant process instead, and it is not decomposition' },
      { id: 'buried', n: 'Buried', f: 8,
        note: 'roughly eight times slower than air. Depth, soil and drainage move this a long way' }
    ];
    var HUM = [
      { id: 'wet', n: 'Wet / standing water', f: 0.85, note: 'moisture speeds rot; expect the faster end and mould alongside' },
      { id: 'humid', n: 'Humid, over 70%', f: 0.9, note: 'favours putrefaction and mould' },
      { id: 'normal', n: 'Normal indoor, 40-70%', f: 1, note: 'the reference condition' },
      { id: 'dry', n: 'Dry, under 40%', f: 1.6, note: 'drying starts to compete with decay' },
      { id: 'arid', n: 'Arid or moving air', f: 3, note: 'drying may WIN: mummification instead of decay, and the timeline stops applying' }
    ];

    function calc() {
      A.clear(out);
      var lo = A.parseNum(st.lo), hi = A.parseNum(st.hi);
      var ref = A.parseNum(st.ref), t = A.parseNum(st.temp);
      if (!isFinite(lo) || lo <= 0) { out.appendChild(A.UI.note('Enter the published time for this stage.')); return; }
      if (!isFinite(hi) || hi < lo) hi = lo;
      if (!isFinite(ref)) ref = 20;
      if (!isFinite(t)) t = 20;

      /* Q10 = 2: rate doubles per +10 °C, so DURATION halves */
      var factor = Math.pow(2, (ref - t) / 10);
      var hum = HUM.filter(function (x) { return x.id === st.hum; })[0] || HUM[2];
      var med = MEDIUM.filter(function (x) { return x.id === st.med; })[0] || MEDIUM[0];
      /* in water, humidity is not a separate variable: it is water */
      var humF = (st.med === 'air') ? hum.f : 1;
      var total = factor * humF * med.f;

      var uName = (UNITS.filter(function (u) { return u[0] === st.unit; })[0] || UNITS[1])[1];
      var HOURS = { h: 1, d: 24, w: 168, mo: 730 };

      /* ── "2 days 12 hours", not "2.5 days" ──
         Nobody plans against a decimal day. Below a day it drops to hours
         alone, and below an hour to minutes, because "0.4 hours" is not a
         time anyone acts on either. */
      function fmt(v) {
        var h = v * (HOURS[st.unit] || 24);
        if (!isFinite(h) || h < 0) return '-';
        if (h < 1) return Math.round(h * 60) + ' min';
        if (h < 24) {
          var wh = Math.floor(h), wm = Math.round((h - wh) * 60);
          if (wm === 60) { wh += 1; wm = 0; }
          return wh + ' h' + (wm ? ' ' + wm + ' min' : '');
        }
        var d = Math.floor(h / 24), rh = Math.round(h % 24);
        if (rh === 24) { d += 1; rh = 0; }
        if (d >= 60) {
          /* past two months, days stop being the useful unit */
          var mo = Math.floor(d / 30), rd = d % 30;
          return mo + ' month' + (mo === 1 ? '' : 's') + (rd ? ' ' + rd + ' day' + (rd === 1 ? '' : 's') : '');
        }
        return d + ' day' + (d === 1 ? '' : 's') + (rh ? ' ' + rh + ' h' : '');
      }

      out.appendChild(A.UI.metric('Adjusted window', fmt(lo * total) + ' to ' + fmt(hi * total),
        { big: true, icon: 'clock',
          sub: 'at ' + A.fmtNum(t, 3) + ' °C, ' + med.n.toLowerCase() +
               (st.med === 'air' ? ', ' + hum.n.toLowerCase() : '') }));
      out.appendChild(A.UI.metric('Where it is', '×' + A.fmtNum(med.f, 3), { sub: med.note }));
      out.appendChild(A.UI.metric('Temperature factor', '×' + A.fmtNum(factor, 3),
        { sub: t > ref ? 'warmer than the reference, so faster' : (t < ref ? 'colder than the reference, so slower' : 'at the reference temperature') }));
      if (st.med === 'air') {
        out.appendChild(A.UI.metric('Humidity factor', '×' + A.fmtNum(hum.f, 3), { sub: hum.note }));
      } else {
        out.appendChild(A.UI.metric('Humidity factor', 'not applied',
          { sub: 'it is in water; humidity is a variable for air only' }));
      }

      if (t <= 0) {
        out.appendChild(A.UI.note('At or below freezing, treat the process as STOPPED. What you are looking at is a snapshot from whenever the freeze began, and it will resume quickly once it thaws.'));
      } else if (t < 5) {
        out.appendChild(A.UI.note('Near freezing, biological activity is almost halted and these windows become very wide. Read the state as "at least this long" rather than as a duration.'));
      } else if (t > 35 && (st.hum === 'dry' || st.hum === 'arid')) {
        out.appendChild(A.UI.note('Hot and dry: drying is likely to outrun decay. Expect mummification or hard drying, which PRESERVES the state - the result is a minimum age, not an age, and could be very much older than this window suggests.'));
      }
      if (st.med === 'fresh' || st.med === 'salt') {
        out.appendChild(A.UI.note(
          'IN WATER THE TWO CLOCKS OPPOSE EACH OTHER. Cooling runs about twice as ' +
          'fast while decay runs about half: a cold body with little decomposition ' +
          'is not necessarily a recent one. In cool, still water adipocere may form ' +
          'and PRESERVE the state for months, which is the commonest large error in ' +
          'water cases. Treat this window as much weaker than the same figure on land.'));
      }
      out.appendChild(A.UI.note('Doubling per 10 °C is a rule of thumb, good across the ordinary range and poor at the extremes. It says nothing about insects, burial, water, covering or scavengers, each of which can move the answer by more than temperature does.'));
    }

    var row1 = A.el('.split');
    row1.appendChild(A.UI.field({
      label: 'Stage takes from', inputmode: 'decimal', value: st.lo,
      oninput: function (e) { st.lo = e.target.value; save(); calc(); }
    }));
    row1.appendChild(A.UI.field({
      label: 'to', inputmode: 'decimal', value: st.hi,
      oninput: function (e) { st.hi = e.target.value; save(); calc(); }
    }));
    card.appendChild(row1);
    card.appendChild(A.UI.select({
      label: 'Where it is',
      value: st.med,
      options: MEDIUM.map(function (m) { return { value: m.id, label: m.n }; }),
      onchange: function (e) { st.med = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Units', value: st.unit,
      options: UNITS.map(function (u) { return { value: u[0], label: u[1] }; }),
      onchange: function (e) { st.unit = e.target.value; save(); calc(); }
    }));
    var row2 = A.el('.split');
    row2.appendChild(A.UI.field({
      label: 'Quoted at', inputmode: 'decimal', suffix: '°C', value: st.ref,
      hint: 'The catalogue quotes 20 °C.',
      oninput: function (e) { st.ref = e.target.value; save(); calc(); }
    }));
    row2.appendChild(A.UI.field({
      label: 'Actual temperature', inputmode: 'decimal', suffix: '°C', value: st.temp,
      oninput: function (e) { st.temp = e.target.value; save(); calc(); }
    }));
    card.appendChild(row2);
    card.appendChild(A.UI.select({
      label: 'Humidity and air', value: st.hum,
      options: HUM.map(function (x) { return { value: x.id, label: x.n }; }),
      onchange: function (e) { st.hum = e.target.value; save(); calc(); }
    }));
    card.appendChild(out);
    calc();
    return card;
  }

  /* speed of sound in FRESH water (Marczak 1997, 0-95 °C, 1 atm) */
  function soundInFreshWater(t) {
    return 1.402385e3 + 5.038813 * t - 5.799136e-2 * t * t +
      3.287156e-4 * t * t * t - 1.398845e-6 * Math.pow(t, 4) +
      2.78786e-9 * Math.pow(t, 5);
  }
  /* speed of sound in SEA water (Mackenzie 1981, salinity 35 ppt, surface) */
  function soundInSeaWater(t) {
    return 1448.96 + 4.591 * t - 5.304e-2 * t * t + 2.374e-4 * t * t * t;
  }

  /* ── speed of sound from a temperature the reader types, with the full
     distance / time calculator on the same page ──
     Replaces the old rows of fixed-temperature entries. The medium's own
     speed formula drives a two-way distance<->time calculation, so a user can
     type either one and read the other. Distances default to the chosen
     distance unit (km on metric), never "auto". */
  function soundMediumCalc(cfg) {
    var card = A.UI.card();
    var st = A.store.get(cfg.key, { temp: cfg.defTemp, dist: '', time: '', mode: 'dist', dunit: A.U.unit('dist') });
    if (st.temp == null || st.temp === '') st.temp = cfg.defTemp;
    if (st.dunit == null || st.dunit === 'auto') st.dunit = A.U.unit('dist');
    function save() { A.store.set(cfg.key, st); }

    card.appendChild(A.UI.field({
      label: cfg.tempLabel, inputmode: 'decimal', suffix: '°C', value: st.temp,
      oninput: function (e) { st.temp = e.target.value; save(); recompute(st.mode); }
    }));

    var speedOut = A.el('div');
    card.appendChild(speedOut);

    var distIn = A.UI.rangeField({
      label: 'Distance', value: st.dist, unit: st.dunit,
      oninput: function () { st.mode = 'dist'; recompute('dist'); },
      onunit: function (code) {
        var siNow = A.U.fromRange(A.parseNum(distIn.input.value), st.dunit);
        st.dunit = code;
        if (isFinite(siNow)) distIn.input.value = A.fmtNum(A.U.toRange(siNow, code), 6);
        st.dist = distIn.input.value; save(); A.haptic(); recompute('dist');
      }
    });
    var timeIn = A.UI.field({
      label: 'or time', inputmode: 'decimal', suffix: 'seconds', value: st.time,
      hint: 'Type a distance or a time; the other one follows.',
      oninput: function () { st.mode = 'time'; recompute('time'); }
    });
    card.appendChild(distIn);
    card.appendChild(timeIn);

    var out = A.el('div');
    card.appendChild(out);

    function speed() {
      var t = A.parseNum(st.temp);
      return isFinite(t) ? cfg.speed(t) : NaN;
    }

    function recompute(from) {
      var ms = speed();
      A.clear(speedOut);
      A.clear(out);
      if (!isFinite(ms) || ms <= 0) { out.appendChild(A.UI.note('Enter a temperature.')); return; }
      var sc = A.UI.card(null, 'tight');
      sc.appendChild(A.UI.metric('Speed of sound', A.fmtNum(ms * 3.6, 4) + ' km/h',
        { big: true, sub: A.fmtNum(ms, 4) + ' m/s   ·   ' + A.fmtNum(ms * 2.2369362920544, 4) + ' mph' }));
      speedOut.appendChild(sc);

      if (from === 'time') {
        var ts = A.parseNum(st.time);
        if (!isFinite(ts) || ts <= 0) return;
        var d = ms * ts;
        distIn.input.value = A.fmtNum(A.U.toRange(d, st.dunit), 6);
        st.dist = distIn.input.value; save();
        showRes(d, ts, ms);
      } else {
        var dv = A.parseNum(distIn.input.value);
        if (!isFinite(dv) || dv <= 0) return;
        var d2 = A.U.fromRange(dv, st.dunit);
        var t2 = d2 / ms;
        timeIn.input.value = A.fmtNum(t2, 4);
        st.time = timeIn.input.value; save();
        showRes(d2, t2, ms);
      }
    }

    function showRes(d, ts, ms) {
      out.appendChild(A.UI.metric('Travel time', A.fmtDur(ts / 3600), { big: true, icon: 'clock' }));
      out.appendChild(A.UI.metric('Distance', A.U.fmtRange(d, { sig: 6, unit: st.dunit }), { icon: 'route' }));
      out.appendChild(A.UI.metric('Also', A.fmtNum(d / 1000, 5) + ' km   ·   ' +
        A.fmtNum(d / 1609.344, 5) + ' mi   ·   ' + A.fmtNum(d / 1852, 5) + ' nmi'));
      if (cfg.note) out.appendChild(A.UI.note(cfg.note));
    }

    recompute(st.mode);
    return card;
  }

  function soundAirCalc() {
    return soundMediumCalc({
      key: 'phys.soundair', tempLabel: 'Air temperature', defTemp: '20', speed: soundInAir,
      note: 'Dry air. The speed rises about 0.6 m/s for every degree Celsius. ' +
        'Reference points: 331.3 m/s at 0 °C, 340.3 m/s at 15 °C (the ISA sea-level value behind Mach 1), and 343.2 m/s at 20 °C.'
    });
  }
  function soundFreshCalc() {
    return soundMediumCalc({
      key: 'phys.soundfresh', tempLabel: 'Water temperature', defTemp: '20', speed: soundInFreshWater,
      note: 'Fresh water at 1 atmosphere. About 1482 m/s at 20 °C, rising with temperature up to roughly 74 °C and then falling.'
    });
  }
  function soundSaltCalc() {
    return soundMediumCalc({
      key: 'phys.soundsalt', tempLabel: 'Water temperature', defTemp: '15', speed: soundInSeaWater,
      note: 'Sea water at 35 ppt salinity, at the surface. Sonar ranging assumes about 1500 m/s; salinity and depth shift it further, and layering bends the ray path.'
    });
  }

  /* ── phase points of water, fresh vs sea, on two tabs ──
     The two behave differently as they cool and boil: salt lowers the freezing
     point and, more importantly, removes the 4 °C density peak, so a lake
     freezes from the top down while the sea overturns instead. */
  function waterPhaseCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.waterphase', { tab: 'fresh' });
    if (st.tab !== 'sea') st.tab = 'fresh';
    function save() { A.store.set('phys.waterphase', st); }

    var DATA = {
      fresh: {
        note: 'Fresh (pure) water. Boiling point drops about 1 °C per 300 m of altitude: at height, food cooks slower and sterilising water takes longer than a rolling boil suggests.',
        rows: [
          ['Freezes / melts', '0 °C'],
          ['Densest at', '4 °C — which is why a lake freezes from the top down'],
          ['Boils at sea level', '100 °C'],
          ['Boils at 2000 m', '93 °C'],
          ['Boils at 5000 m', '83 °C'],
          ['Heat to warm 1 kg by 1 °C', '4.19 kJ'],
          ['Heat to freeze 1 kg at 0 °C', '334 kJ, same as cooling it from 80 °C'],
          ['Heat to boil away 1 kg at 100 °C', '2257 kJ, 5x the energy of heating 0 to 100'],
          ['Supercooling', 'Still, clean water can stay liquid below 0 °C, then freeze at once when disturbed']
        ]
      },
      sea: {
        note: 'Sea water at about 35 ppt salinity. Salt lowers the freezing point and removes the 4 °C density peak, so the surface keeps sinking as it cools and the whole column overturns instead of freezing over first.',
        rows: [
          ['Freezes / melts', '−1.9 °C — the salt lowers it'],
          ['Densest at', 'No peak: it stays densest right down to freezing, so it overturns rather than freezing top-first'],
          ['Boils at sea level', '≈ 100.5 °C — the salt raises it slightly'],
          ['Boils at 2000 m', '≈ 93.5 °C'],
          ['Boils at 5000 m', '≈ 83.5 °C'],
          ['Heat to warm 1 kg by 1 °C', '≈ 3.99 kJ, a little less than fresh'],
          ['Heat to freeze 1 kg', '≈ 330 kJ, and it freezes over a range rather than at one point, leaving pockets of brine'],
          ['Heat to boil away 1 kg at 100 °C', '≈ 2257 kJ'],
          ['Supercooling', 'The same: it can hold below its freezing point, then freeze suddenly']
        ]
      }
    };

    var body = A.el('div');
    card.appendChild(A.UI.chips(
      [{ id: 'fresh', label: 'Fresh water' }, { id: 'sea', label: 'Sea water' }],
      st.tab,
      function (id) { st.tab = id; save(); paint(); }
    ));
    card.appendChild(body);

    function paint() {
      A.clear(body);
      var d = DATA[st.tab];
      var tc = A.UI.card(null, 'tight');
      d.rows.forEach(function (r) { tc.appendChild(A.UI.metric(r[0], r[1])); });
      body.appendChild(tc);
      body.appendChild(A.UI.note(d.note));
    }
    paint();
    return card;
  }

  /* ── altitude, pressure and breathable oxygen ──
     ISA barometric model. Air is 20.9 % oxygen at every altitude; what falls
     is the PRESSURE, and with it the partial pressure of oxygen and the amount
     your lungs actually get. Troposphere to 11 km, isothermal layer above. */
  var P0_PA = 101325, P11_PA = 22632;
  function pressureAtAlt(h) {
    if (h <= 11000) return P0_PA * Math.pow(1 - 2.25577e-5 * h, 5.25588);
    return P11_PA * Math.exp(-(h - 11000) / 6341.62);
  }
  function altAtPressure(pa) {
    if (pa >= P11_PA) return (1 - Math.pow(pa / P0_PA, 1 / 5.25588)) / 2.25577e-5;
    return 11000 - 6341.62 * Math.log(pa / P11_PA);
  }

  function altOxygenCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.o2alt', { alt: '2500' });
    if (st.alt == null || st.alt === '') st.alt = '2500';
    function save() { A.store.set('phys.o2alt', st); }

    card.appendChild(A.UI.field({
      label: 'Altitude', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.alt,
      oninput: function (e) { st.alt = e.target.value; save(); calc(); }
    }));
    var out = A.el('div');
    card.appendChild(out);

    function calc() {
      A.clear(out);
      var av = A.parseNum(st.alt);
      if (!isFinite(av)) { out.appendChild(A.UI.note('Enter an altitude.')); return; }
      var h = A.U.from('alt', av);
      var p = pressureAtAlt(h), ratio = p / P0_PA;
      var effO2 = 20.9 * ratio;
      var pO2 = 0.209 * p / 1000;            /* kPa */
      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Oxygen you actually get', A.fmtNum(ratio * 100, 3) + ' % of sea level',
        { big: true, icon: 'physics', sub: 'the air is still 20.9 % oxygen; there is simply less air' }));
      c.appendChild(A.UI.metric('Equivalent sea-level oxygen', A.fmtNum(effO2, 3) + ' %',
        { sub: 'breathing here feels like this oxygen fraction at sea level' }));
      c.appendChild(A.UI.metric('Air pressure', A.fmtNum(p / 1000, 4) + ' kPa',
        { sub: A.fmtNum(p / 100, 4) + ' hPa   ·   ' + A.fmtNum(p / 101325, 4) + ' atm   ·   ' + A.fmtNum(p / 133.322, 4) + ' mmHg' }));
      c.appendChild(A.UI.metric('Oxygen partial pressure', A.fmtNum(pO2, 4) + ' kPa',
        { sub: 'sea level is about 21.2 kPa (159 mmHg)' }));
      out.appendChild(c);
      var band = h < 1500 ? 'Little effect on a healthy person.'
        : h < 2500 ? 'Noticeable on exertion; a night or two to acclimatise.'
        : h < 3500 ? 'Altitude sickness is common without acclimatisation. Ascend slowly and sleep low.'
        : h < 5500 ? 'High altitude: acclimatisation is essential and performance drops sharply.'
        : h < 8000 ? 'Very high: the body deteriorates over time even when acclimatised.'
        : 'Death zone: supplemental oxygen is needed to survive for long.';
      out.appendChild(A.UI.note(band + ' These figures are the standard atmosphere; real pressure varies with weather, and cold lowers it further.'));
    }
    calc();
    return card;
  }

  /* Barometric conversion with a sea-level pressure and temperature the reader
     can set, and a pressure unit of their choice. The lapse-rate form is used
     so the sea-level temperature actually enters the answer:
        P = P0 (1 - L h / T)^5.25588 ,  h = (T/L)(1 - (P/P0)^(1/5.25588))     */
  var PUNITS = { Pa: 1, hPa: 100, kPa: 1000, bar: 1e5, atm: 101325, psi: 6894.757, mmHg: 133.322 };
  var BARO_L = 0.0065, BARO_EXP = 5.25588;

  function baroAltCalc() {
    var card = A.UI.card();
    var st = A.store.get('phys.baralt', { punit: 'Pa', p0: '101325', temp: '15', patm: '', alt: '', mode: 'alt' });
    if (!PUNITS[st.punit]) st.punit = 'Pa';
    if (st.p0 == null || st.p0 === '') st.p0 = A.fmtNum(P0_PA / PUNITS[st.punit], 6);
    if (st.temp == null || st.temp === '') st.temp = '15';
    function save() { A.store.set('phys.baralt', st); }

    var p0In, tempIn, patmIn, altIn, out;

    /* T is the temperature AT the altitude (the station temperature), the form
       used by the common online calculators the reader will compare against:
          P = P0 / (1 + L h / T)^5.25588 ,  h = ((P0/P)^(1/5.25588) - 1) T / L  */
    function pFromAlt(h, p0pa, tC) {
      var T = tC + 273.15;
      return p0pa / Math.pow(1 + BARO_L * h / T, BARO_EXP);
    }
    function altFromP(pa, p0pa, tC) {
      var T = tC + 273.15;
      return (Math.pow(p0pa / pa, 1 / BARO_EXP) - 1) * T / BARO_L;
    }

    function recompute() {
      A.clear(out);
      var u = PUNITS[st.punit];
      var p0pa = A.parseNum(st.p0) * u, tC = A.parseNum(st.temp);
      if (!isFinite(p0pa) || p0pa <= 0 || !isFinite(tC)) {
        out.appendChild(A.UI.note('Set the sea-level pressure and temperature.'));
        return;
      }
      var pa, h;
      if (st.mode === 'alt') {
        var av = A.parseNum(st.alt);
        if (!isFinite(av)) return;
        h = A.U.from('alt', av);
        pa = pFromAlt(h, p0pa, tC);
        patmIn.input.value = A.fmtNum(pa / u, 6); st.patm = patmIn.input.value;
      } else {
        var pv = A.parseNum(st.patm);
        if (!isFinite(pv) || pv <= 0) { out.appendChild(A.UI.note('Type an air pressure at altitude, or an altitude.')); return; }
        pa = pv * u;
        h = altFromP(pa, p0pa, tC);
        altIn.input.value = A.fmtNum(A.U.to('alt', h), 6); st.alt = altIn.input.value;
      }
      save();
      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Altitude', A.U.fmtRange(h, { sig: 5 }), { big: true, icon: 'route' }));
      c.appendChild(A.UI.metric('Air pressure at altitude', A.fmtNum(pa / u, 5) + ' ' + st.punit,
        { sub: A.fmtNum(pa / 1000, 5) + ' kPa   ·   ' + A.fmtNum(pa / 1e5, 5) + ' bar   ·   ' +
          A.fmtNum(pa / 101325, 5) + ' atm   ·   ' + A.fmtNum(pa / 6894.757, 5) + ' psi' }));
      c.appendChild(A.UI.metric('Fraction of sea-level pressure', A.fmtNum(100 * pa / p0pa, 4) + ' %'));
      out.appendChild(c);
    }

    function build() {
      A.clear(card);

      card.appendChild(A.UI.select({
        label: 'Pressure unit', value: st.punit,
        options: Object.keys(PUNITS).map(function (u) { return { value: u, label: u }; }),
        onchange: function (e) {
          var old = st.punit, oldU = PUNITS[old];
          st.punit = e.target.value;
          /* keep the same physical pressures, restated in the new unit */
          [['p0', P0_PA], ['patm', null]].forEach(function (f) {
            var key = f[0];
            if (st[key] !== '' && st[key] != null) {
              var pa = A.parseNum(st[key]) * oldU;
              if (isFinite(pa)) st[key] = A.fmtNum(pa / PUNITS[st.punit], 6);
            }
          });
          save(); build();
        }
      }));

      p0In = A.UI.field({
        label: 'Pressure at sea level', inputmode: 'decimal', suffix: st.punit, value: st.p0,
        oninput: function (e) { st.p0 = e.target.value; save(); recompute(); }
      });
      tempIn = A.UI.field({
        label: 'Temperature at altitude', inputmode: 'decimal', suffix: '°C', value: st.temp,
        oninput: function (e) { st.temp = e.target.value; save(); recompute(); }
      });
      card.appendChild(p0In);
      card.appendChild(tempIn);

      patmIn = A.UI.field({
        label: 'Air pressure at altitude', inputmode: 'decimal', suffix: st.punit, value: st.patm,
        oninput: function (e) { st.patm = e.target.value; st.mode = 'p'; save(); recompute(); }
      });
      altIn = A.UI.field({
        label: 'or altitude', inputmode: 'decimal', suffix: A.U.sym('alt'), value: st.alt,
        hint: 'Type a pressure at altitude or an altitude; the other one follows.',
        oninput: function (e) { st.alt = e.target.value; st.mode = 'alt'; save(); recompute(); }
      });
      card.appendChild(patmIn);
      card.appendChild(altIn);

      out = A.el('div');
      card.appendChild(out);
      recompute();
    }
    build();
    return card;
  }

  function spectrumCalc() {
    var h = A.el('div');
    if (global.ArtSpectrum) global.ArtSpectrum.render(h, { store: 'recon.spectrum' });
    else h.appendChild(A.UI.empty('Spectrum data unavailable.'));
    return h;
  }

  global.ArtPhysics = {
    calc: { fall: fallCalc, terminal: terminalCalc, projectile: projectileCalc, stopping: stoppingCalc, tempchange: tempCalc, biotime: bioTimeCalc, soundair: soundAirCalc, soundfresh: soundFreshCalc, soundsalt: soundSaltCalc, waterphase: waterPhaseCalc, o2alt: altOxygenCalc, baralt: baroAltCalc, spectrum: spectrumCalc },
    pressureAtAlt: pressureAtAlt,
    altAtPressure: altAtPressure,
    soundInAir: soundInAir,
    soundInFreshWater: soundInFreshWater,
    soundInSeaWater: soundInSeaWater,
    airDensity: airDensity,
    terminalVelocity: terminalVelocity
  };

})(window);
