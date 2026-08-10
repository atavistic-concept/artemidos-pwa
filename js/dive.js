/*
 * Artemidos - diving: scuba and free-diving
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT IS HERE AND WHAT IS DELIBERATELY NOT.
 *
 * Everything on these pages is physics with a closed form: pressure against
 * depth, the depth a mix stops being breathable, how narcotic it is, how fast
 * you empty a cylinder, how much lead cancels a wetsuit. Those are arithmetic,
 * they are checkable, and a phone is a perfectly good place to do them.
 *
 * WHAT IS NOT HERE IS A DECOMPRESSION SCHEDULE. No no-stop times, no stop
 * depths, no run times. Not because it is hard, but because a wrong one is a
 * spinal cord, and the published agency tables are not something to reproduce
 * from memory. Plan decompression on the table or the computer you dive, and
 * use this for the numbers around it.
 *
 * Metric throughout, because the entire sport is. Pressures are absolute bar
 * unless a field says otherwise: a gauge reads zero at the surface and the
 * physics does not, and mixing the two up is how a mix gets planned to the
 * wrong depth.
 */
(function (global) {
  'use strict';

  var A = global.A;

  /* ── water and air ──
     Fresh water is taken at 1000 kg/m3 and sea water at 1030, which is the
     usual working figure; the Red Sea is heavier and the Baltic lighter, and
     both move the weighting more than they move the pressure. */
  var RHO_FRESH = 1000, RHO_SALT = 1030, G = 9.80665;
  var P_SEA_LEVEL = 1.01325;              /* bar */

  /* barometric pressure at altitude, dry standard atmosphere */
  function surfacePressure(altM) {
    if (!isFinite(altM) || altM <= 0) return P_SEA_LEVEL;
    return P_SEA_LEVEL * Math.pow(1 - 2.25577e-5 * altM, 5.25588);
  }
  /* bar of water per metre of depth */
  function barPerMetre(salt) {
    return (salt ? RHO_SALT : RHO_FRESH) * G / 100000;
  }
  function absAtDepth(depthM, salt, altM) {
    return surfacePressure(altM) + depthM * barPerMetre(salt);
  }
  function depthForAbs(pAbs, salt, altM) {
    return (pAbs - surfacePressure(altM)) / barPerMetre(salt);
  }

  function num(v) { return A.parseNum(v); }
  function ok(v) { return isFinite(v); }
  function f(v, d) { return A.fmtNum(v, d == null ? 2 : d); }

  /* a water/altitude picker, shared by every tool that needs one */
  function waterRow(st, save, redraw) {
    var row = A.el('.split');
    row.appendChild(A.UI.select({
      label: 'Water', value: st.salt ? 'salt' : 'fresh',
      options: [{ value: 'salt', label: 'Sea water' }, { value: 'fresh', label: 'Fresh water' }],
      onchange: function (e) { st.salt = e.target.value === 'salt'; save(); redraw(); }
    }));
    row.appendChild(A.UI.field({
      label: 'Altitude', suffix: 'm', inputmode: 'decimal', value: st.alt,
      hint: 'Sea level unless you are diving a mountain lake',
      oninput: function (e) { st.alt = e.target.value; save(); redraw(); }
    }));
    return row;
  }

  /* ══ 1. pressure and depth ═══════════════════════════════════════════════ */
  function toolPressure(host) {
    var st = A.store.get('dive.press', { d: '30', salt: true, alt: '' });
    function save() { A.store.set('dive.press', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Depth', suffix: 'm', inputmode: 'decimal', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    card.appendChild(waterRow(st, save, function () { calc(); }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var d = num(st.d), alt = num(st.alt) || 0;
      if (!ok(d) || d < 0) { out.appendChild(A.UI.empty('Enter a depth.')); return; }
      var pSurf = surfacePressure(alt);
      var pAbs = absAtDepth(d, st.salt, alt);
      var c = A.UI.card();
      c.appendChild(A.UI.metric('Absolute pressure', f(pAbs, 3) + ' bar',
        { big: true, sub: 'what your body and your gas actually see' }));
      c.appendChild(A.UI.metric('Gauge pressure', f(pAbs - pSurf, 3) + ' bar',
        { sub: 'the water alone, what a depth gauge reads' }));
      c.appendChild(A.UI.metric('Surface pressure', f(pSurf, 4) + ' bar',
        { sub: alt > 0 ? 'at ' + f(alt, 0) + ' m of altitude' : 'at sea level' }));
      c.appendChild(A.UI.metric('Atmospheres absolute', f(pAbs / P_SEA_LEVEL, 3) + ' ATA',
        { sub: 'the same pressure in the unit tables are written in' }));
      c.appendChild(A.UI.metric('Volume of a surface litre', f(pSurf / pAbs, 3) + ' L',
        { sub: 'Boyle: a full lung at the surface is this at depth' }));
      out.appendChild(c);

      if (alt > 300) {
        out.appendChild(A.UI.note(
          'ALTITUDE CHANGES MORE THAN THE PRESSURE. Thinner air at the surface means a given ' +
          'depth loads you more than the same depth at sea level, and your tables or computer ' +
          'must be set for altitude. This figure is the physics only: it is not an altitude ' +
          'dive plan, and arriving from sea level needs time to acclimatise before diving.'));
      }
    }
    calc();
  }

  /* ══ 2. gas: MOD, best mix, EAD, END, density ════════════════════════════ */
  function toolGas(host) {
    var st = A.store.get('dive.gas', {
      o2: '32', he: '0', d: '30', po2: '1.4', salt: true, alt: '', o2narc: true
    });
    function save() { A.store.set('dive.gas', st); }
    var out = A.el('div');

    var card = A.UI.card();
    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({
      label: 'Oxygen', suffix: '%', inputmode: 'decimal', value: st.o2,
      oninput: function (e) { st.o2 = e.target.value; save(); calc(); }
    }));
    r1.appendChild(A.UI.field({
      label: 'Helium', suffix: '%', inputmode: 'decimal', value: st.he,
      hint: 'Zero for air or nitrox',
      oninput: function (e) { st.he = e.target.value; save(); calc(); }
    }));
    card.appendChild(r1);
    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({
      label: 'Planned depth', suffix: 'm', inputmode: 'decimal', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    r2.appendChild(A.UI.field({
      label: 'Max PO2', suffix: 'bar', inputmode: 'decimal', value: st.po2,
      hint: '1.4 working, 1.6 decompression only',
      oninput: function (e) { st.po2 = e.target.value; save(); calc(); }
    }));
    card.appendChild(r2);
    card.appendChild(waterRow(st, save, function () { calc(); }));
    card.appendChild(A.UI.select({
      label: 'Treat oxygen as narcotic',
      value: st.o2narc ? 'yes' : 'no',
      options: [{ value: 'yes', label: 'Yes, oxygen is narcotic' }, { value: 'no', label: 'No, nitrogen only' }],
      onchange: function (e) { st.o2narc = e.target.value === 'yes'; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var fo2 = num(st.o2) / 100, fhe = num(st.he) / 100;
      var d = num(st.d), po2 = num(st.po2), alt = num(st.alt) || 0;
      if (!ok(fo2) || !ok(fhe) || fo2 <= 0) { out.appendChild(A.UI.empty('Enter the mix.')); return; }
      var fn2 = 1 - fo2 - fhe;
      if (fn2 < -0.0001) {
        out.appendChild(A.UI.note('Oxygen and helium add up to more than the whole gas. Check the mix.'));
        return;
      }
      var bpm = barPerMetre(st.salt), pSurf = surfacePressure(alt);

      var c = A.UI.card();
      c.appendChild(A.el('.sec-lab', { text: 'The mix' }));
      c.appendChild(A.UI.metric('Composition',
        f(fo2 * 100, 1) + '% O2  ·  ' + f(fhe * 100, 1) + '% He  ·  ' + f(fn2 * 100, 1) + '% N2',
        { sub: fhe > 0 ? (fn2 <= 0.005 ? 'heliox' : 'trimix') : (Math.abs(fo2 - 0.21) < 0.005 ? 'air' : 'nitrox') }));

      /* maximum operating depth for the chosen PO2 */
      if (ok(po2) && po2 > 0) {
        var mod = depthForAbs(po2 / fo2, st.salt, alt);
        c.appendChild(A.UI.metric('Maximum operating depth', (mod > 0 ? f(mod, 1) + ' m' : 'shallower than the surface'),
          { big: true, sub: 'at PO2 ' + f(po2, 2) + ' bar. Below this the oxygen itself is the hazard.' }));
      }
      out.appendChild(c);

      if (ok(d) && d >= 0) {
        var pAbs = absAtDepth(d, st.salt, alt);
        var ppo2 = fo2 * pAbs, ppn2 = fn2 * pAbs, pphe = fhe * pAbs;

        var dc = A.UI.card();
        dc.appendChild(A.el('.sec-lab', { text: 'At ' + f(d, 0) + ' m' }));
        dc.appendChild(A.UI.metric('Oxygen partial pressure', f(ppo2, 3) + ' bar',
          { big: true, sub: ppo2 > 1.6 ? 'ABOVE 1.6: seizure risk, do not breathe this here'
                    : (ppo2 > 1.4 ? 'above the 1.4 working limit, decompression use only'
                    : (ppo2 < 0.16 ? 'BELOW 0.16: this mix will not keep you conscious here' : 'within the usual working range')) }));
        dc.appendChild(A.UI.metric('Nitrogen partial pressure', f(ppn2, 3) + ' bar'));
        if (fhe > 0) dc.appendChild(A.UI.metric('Helium partial pressure', f(pphe, 3) + ' bar'));

        /* equivalent air depth: the air depth with the same nitrogen load */
        if (fhe === 0) {
          var ead = depthForAbs((fn2 / 0.79) * pAbs, st.salt, alt);
          dc.appendChild(A.UI.metric('Equivalent air depth', (ead > 0 ? f(ead, 1) + ' m' : 'shallower than the surface'),
            { sub: 'the air depth carrying the same nitrogen. This is the number a nitrox table is entered with.' }));
        }

        /* narcosis */
        var narcFrac = st.o2narc ? (1 - fhe) : fn2 / 0.79;
        var endAbs = st.o2narc ? (1 - fhe) * pAbs : (fn2 / 0.79) * pAbs;
        var end = depthForAbs(endAbs, st.salt, alt);
        dc.appendChild(A.UI.metric('Equivalent narcotic depth', (end > 0 ? f(end, 1) + ' m' : 'none worth stating'),
          { sub: st.o2narc ? 'oxygen counted as narcotic, the conservative convention'
                           : 'nitrogen only, the older convention' }));

        /* gas density: the number that decides whether you can shift enough of it */
        var M = fo2 * 0.031999 + fn2 * 0.0280134 + fhe * 0.0040026;   /* kg/mol */
        var T = 283.15;                                               /* 10 C water */
        var dens = (pAbs * 100000) * M / (8.3145 * T);                /* kg/m3 = g/L */
        dc.appendChild(A.UI.metric('Gas density', f(dens, 2) + ' g/L',
          { sub: dens > 6.3 ? 'ABOVE 6.3: too thick to move, CO2 will build up'
                : (dens > 5.7 ? 'above the 5.7 g/L target, add helium' : 'within the usual target') }));
        out.appendChild(dc);
      }

      /* best mix for the planned depth */
      if (ok(d) && d > 0 && ok(po2) && po2 > 0) {
        var best = po2 / absAtDepth(d, st.salt, alt);
        var bc = A.UI.card();
        bc.appendChild(A.UI.metric('Best mix for ' + f(d, 0) + ' m', f(best * 100, 1) + '% O2',
          { sub: 'the richest mix still inside PO2 ' + f(po2, 2) + ' at that depth' }));
        out.appendChild(bc);
      }

      out.appendChild(A.UI.note(
        'A MIX IS PLANNED FOR A DEPTH AND ANALYSED BEFORE IT IS BREATHED. Every one of these ' +
        'numbers follows from the fractions you typed, and the only thing that makes them true ' +
        'is putting an analyser on the cylinder yourself. Nobody has ever been hurt by the ' +
        'arithmetic; they are hurt by the gas being something other than the label.'));
    }
    calc();
  }

  /* ══ 3. air consumption ═════════════════════════════════════════════════ */
  function toolSAC(host) {
    var st = A.store.get('dive.sac', { start: '200', end: '50', min: '40', d: '18', tank: '12', salt: true, alt: '' });
    function save() { A.store.set('dive.sac', st); }
    var out = A.el('div');

    var card = A.UI.card();
    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({
      label: 'Start pressure', suffix: 'bar', inputmode: 'decimal', value: st.start,
      oninput: function (e) { st.start = e.target.value; save(); calc(); }
    }));
    r1.appendChild(A.UI.field({
      label: 'End pressure', suffix: 'bar', inputmode: 'decimal', value: st.end,
      oninput: function (e) { st.end = e.target.value; save(); calc(); }
    }));
    card.appendChild(r1);
    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({
      label: 'Time', suffix: 'min', inputmode: 'decimal', value: st.min,
      oninput: function (e) { st.min = e.target.value; save(); calc(); }
    }));
    r2.appendChild(A.UI.field({
      label: 'Average depth', suffix: 'm', inputmode: 'decimal', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    card.appendChild(r2);
    card.appendChild(A.UI.field({
      label: 'Cylinder size', suffix: 'L', inputmode: 'decimal', value: st.tank,
      hint: 'Water capacity: a 12 L twelve-litre, not the free gas it holds',
      oninput: function (e) { st.tank = e.target.value; save(); calc(); }
    }));
    card.appendChild(waterRow(st, save, function () { calc(); }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var s = num(st.start), e = num(st.end), t = num(st.min), d = num(st.d), v = num(st.tank);
      var alt = num(st.alt) || 0;
      if (!ok(s) || !ok(e) || !ok(t) || !ok(d) || !ok(v) || t <= 0 || v <= 0) {
        out.appendChild(A.UI.empty('Fill in the dive.')); return;
      }
      if (e >= s) { out.appendChild(A.UI.note('The end pressure is not lower than the start.')); return; }
      var used = s - e;
      var pAbs = absAtDepth(d, st.salt, alt);
      var sacBar = used / t / pAbs;             /* bar/min at the surface */
      var rmv = sacBar * v;                     /* litres/min at the surface */

      var c = A.UI.card();
      c.appendChild(A.UI.metric('Surface air consumption', f(rmv, 1) + ' L/min',
        { big: true, sub: 'your RMV: what you breathe per minute at one atmosphere' }));
      c.appendChild(A.UI.metric('As a cylinder rate', f(sacBar, 2) + ' bar/min',
        { sub: 'for this ' + f(v, 0) + ' L cylinder, at the surface' }));
      c.appendChild(A.UI.metric('Gas used', f(used * v, 0) + ' L',
        { sub: f(used, 0) + ' bar out of a ' + f(v, 0) + ' L cylinder' }));
      c.appendChild(A.UI.metric('At ' + f(d, 0) + ' m', f(sacBar * pAbs, 2) + ' bar/min',
        { sub: 'what the same breathing costs down there, ' + f(pAbs, 2) + ' times as much' }));
      out.appendChild(c);

      /* what that means for a planned dive */
      var pc = A.UI.card();
      pc.appendChild(A.el('.sec-lab', { text: 'What it buys you' }));
      [10, 20, 30, 40].forEach(function (dd) {
        var p = absAtDepth(dd, st.salt, alt);
        var perMin = rmv * p;                                  /* L/min down there */
        var usable = (s - 50) * v;                             /* to a 50 bar reserve */
        var mins = usable / perMin;
        pc.appendChild(A.UI.metric(dd + ' m', f(mins, 0) + ' min',
          { sub: 'from ' + f(s, 0) + ' bar down to a 50 bar reserve, at this consumption' }));
      });
      out.appendChild(pc);

      out.appendChild(A.UI.note(
        'THIS IS THE RATE YOU HAD ON THAT DIVE, not the rate you will have on the next one. ' +
        'Cold, work, current, a new suit and being anxious all push it up, and the dive where ' +
        'it matters is exactly the dive where it will be worst. Plan on your worst measured ' +
        'figure, not your best.'));
    }
    calc();
  }

  /* ══ 4. gas planning: thirds and turn pressure ═══════════════════════════ */
  function toolPlan(host) {
    var st = A.store.get('dive.plan', { start: '200', reserve: '50', rule: 'thirds', tank: '12' });
    function save() { A.store.set('dive.plan', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Start pressure', suffix: 'bar', inputmode: 'decimal', value: st.start,
      oninput: function (e) { st.start = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Rule', value: st.rule,
      options: [
        { value: 'thirds', label: 'Rule of thirds (overhead, penetration)' },
        { value: 'half', label: 'Half plus reserve (open water, out and back)' },
        { value: 'reserve', label: 'All usable down to a fixed reserve' }
      ],
      onchange: function (e) { st.rule = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Reserve', suffix: 'bar', inputmode: 'decimal', value: st.reserve,
      oninput: function (e) { st.reserve = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var s = num(st.start), r = num(st.reserve);
      if (!ok(s) || s <= 0) { out.appendChild(A.UI.empty('Enter the starting pressure.')); return; }
      if (!ok(r)) r = 0;
      var c = A.UI.card();

      if (st.rule === 'thirds') {
        var third = s / 3;
        c.appendChild(A.UI.metric('Turn the dive at', f(s - third, 0) + ' bar',
          { big: true, sub: 'one third in, one third out, one third untouched' }));
        c.appendChild(A.UI.metric('Be out of the overhead by', f(s - 2 * third, 0) + ' bar',
          { sub: 'the last third is what gets a pair of you home, not one' }));
        c.appendChild(A.UI.metric('Usable each way', f(third, 0) + ' bar'));
      } else if (st.rule === 'half') {
        var usable = s - r;
        c.appendChild(A.UI.metric('Turn the dive at', f(s - usable / 2, 0) + ' bar',
          { big: true, sub: 'half the usable gas out, half back, then the reserve' }));
        c.appendChild(A.UI.metric('Usable each way', f(usable / 2, 0) + ' bar'));
        c.appendChild(A.UI.metric('Reserve untouched', f(r, 0) + ' bar'));
      } else {
        c.appendChild(A.UI.metric('Usable gas', f(s - r, 0) + ' bar',
          { big: true, sub: 'down to a ' + f(r, 0) + ' bar reserve' }));
      }
      out.appendChild(c);

      out.appendChild(A.UI.note(
        'THIRDS ASSUMES THE WAY OUT IS AS LONG AS THE WAY IN AND THAT YOU CAN ALWAYS SWIM IT. ' +
        'A current that helped you in, a silt-out, or a buddy sharing gas all break that ' +
        'assumption, and in an overhead none of them let you go up instead. Where there is a ' +
        'ceiling, the reserve is not a comfort margin, it is the dive.'));
    }
    calc();
  }

  /* ══ 5. filling a cylinder ══════════════════════════════════════════════ */
  function toolFill(host) {
    var st = A.store.get('dive.fill', { start: '30', end: '230', tank: '12', rate: '200', n: '1' });
    function save() { A.store.set('dive.fill', st); }
    var out = A.el('div');

    var card = A.UI.card();
    var r1 = A.el('.split');
    r1.appendChild(A.UI.field({
      label: 'Start pressure', suffix: 'bar', inputmode: 'decimal', value: st.start,
      oninput: function (e) { st.start = e.target.value; save(); calc(); }
    }));
    r1.appendChild(A.UI.field({
      label: 'Target pressure', suffix: 'bar', inputmode: 'decimal', value: st.end,
      oninput: function (e) { st.end = e.target.value; save(); calc(); }
    }));
    card.appendChild(r1);
    var r2 = A.el('.split');
    r2.appendChild(A.UI.field({
      label: 'Cylinder size', suffix: 'L', inputmode: 'decimal', value: st.tank,
      oninput: function (e) { st.tank = e.target.value; save(); calc(); }
    }));
    r2.appendChild(A.UI.field({
      label: 'How many', inputmode: 'numeric', value: st.n,
      oninput: function (e) { st.n = e.target.value; save(); calc(); }
    }));
    card.appendChild(r2);
    card.appendChild(A.UI.field({
      label: 'Compressor output', suffix: 'L/min', inputmode: 'decimal', value: st.rate,
      hint: 'Free air delivered per minute, off the plate',
      oninput: function (e) { st.rate = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var s = num(st.start), e = num(st.end), v = num(st.tank), rate = num(st.rate), n = num(st.n) || 1;
      if (!ok(s) || !ok(e) || !ok(v) || !ok(rate) || rate <= 0 || v <= 0) {
        out.appendChild(A.UI.empty('Fill in the cylinder and the compressor.')); return;
      }
      if (e <= s) { out.appendChild(A.UI.note('The target is not above the starting pressure.')); return; }
      var litres = (e - s) * v * n;
      var mins = litres / rate;

      var c = A.UI.card();
      c.appendChild(A.UI.metric('Filling time', (mins >= 60
        ? Math.floor(mins / 60) + ' h ' + Math.round(mins % 60) + ' min'
        : f(mins, 0) + ' min'),
        { big: true, sub: 'at ' + f(rate, 0) + ' L/min, ideal and without a break' }));
      c.appendChild(A.UI.metric('Free air needed', f(litres, 0) + ' L',
        { sub: n > 1 ? f(n, 0) + ' cylinders of ' + f(v, 0) + ' L' : 'one ' + f(v, 0) + ' L cylinder' }));
      c.appendChild(A.UI.metric('Pressure added', f(e - s, 0) + ' bar'));
      out.appendChild(c);

      out.appendChild(A.UI.note(
        'THE REAL FILL IS SLOWER AND HOTTER. A compressor slows as the cylinder pressure rises, ' +
        'and a fast fill heats the gas so it reads high and falls back as it cools: a cylinder ' +
        'filled hot to 230 will be short when it is cold. Fill slowly, or top up after it has ' +
        'settled. Cylinders and valves are pressure vessels and are tested for a reason.'));
    }
    calc();
  }

  /* ══ 6. weighting, for scuba and free-diving ════════════════════════════
     The physics is a balance of two things: what the water pushes up on the
     volume you occupy, and what the earth pulls down on the mass you carry.
     Everything below is an estimate that gets you close enough to start a
     proper buoyancy check in the water, which is the only thing that settles
     it. */

  /* suit buoyancy as a fraction of body weight, the usual starting figures */
  var SUITS = [
    { id: 'none', label: 'None or dive skin', free: 0.015, scuba: 0.02 },
    { id: 'shorty', label: 'Shorty 2 to 3 mm', free: 0.035, scuba: 0.045 },
    { id: '3', label: 'Full 3 mm', free: 0.05, scuba: 0.06 },
    { id: '5', label: 'Full 5 mm', free: 0.07, scuba: 0.08 },
    { id: '7', label: 'Full 7 mm', free: 0.09, scuba: 0.10 },
    { id: 'semi', label: 'Semi-dry 7 to 8 mm', free: 0.10, scuba: 0.11 },
    { id: 'dry-n', label: 'Drysuit, neoprene', free: 0.11, scuba: 0.12 },
    { id: 'dry-s', label: 'Drysuit, shell with undersuit', free: 0.10, scuba: 0.11 }
  ];
  /* cylinder buoyancy swing: how much lighter it gets as it empties, and where
     it sits when full. Figures are typical for the common sizes. */
  var TANKS = [
    { id: 'none', label: 'No cylinder', full: 0, empty: 0 },
    { id: 'al80', label: 'Aluminium 11 L (AL80)', full: -1.4, empty: 1.9 },
    { id: 'al63', label: 'Aluminium 9 L (AL63)', full: -1.0, empty: 1.4 },
    { id: 'twinal11', label: 'Twin aluminium 11 L', full: -2.8, empty: 3.8 },
    { id: 'st12', label: 'Steel 12 L, 232 bar', full: -4.0, empty: -1.2 },
    { id: 'st15', label: 'Steel 15 L, 232 bar', full: -5.5, empty: -2.0 },
    { id: 'st10', label: 'Steel 10 L, 300 bar', full: -3.6, empty: -0.9 },
    { id: 'twin12', label: 'Twin steel 12 L', full: -8.5, empty: -3.0 },
    { id: 'st7', label: 'Steel 7 L stage', full: -2.3, empty: -0.7 },
    { id: 'al40', label: 'Aluminium 5.7 L (AL40) stage', full: -0.7, empty: 1.0 }
  ];
  var MAX_TANKS = 4;
  var PLATES = [
    { id: 'none', label: 'Jacket BCD, no plate', w: 0 },
    { id: 'al', label: 'Aluminium backplate', w: 0.9 },
    { id: 'st', label: 'Steel backplate', w: 2.5 },
    { id: 'st6', label: 'Heavy steel plate 6 mm', w: 3.6 }
  ];

  function toolWeight(host, mode) {
    var key = mode === 'free' ? 'dive.wfree' : 'dive.wscuba';
    var st = A.store.get(key, {
      kg: '80', suit: mode === 'free' ? '3' : '5', salt: true,
      tank: mode === 'free' ? 'none' : 'al80', plate: 'none', build: 'avg', d: ''
    });
    function save() { A.store.set(key, st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Body weight', suffix: 'kg', inputmode: 'decimal', value: st.kg,
      oninput: function (e) { st.kg = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Exposure suit', value: st.suit,
      options: SUITS.map(function (s) { return { value: s.id, label: s.label }; }),
      onchange: function (e) { st.suit = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Build', value: st.build,
      options: [
        { value: 'lean', label: 'Lean and muscular, sinks easily' },
        { value: 'avg', label: 'Average' },
        { value: 'fat', label: 'Higher body fat, floats easily' }
      ],
      onchange: function (e) { st.build = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Water', value: st.salt ? 'salt' : 'fresh',
      options: [{ value: 'salt', label: 'Sea water' }, { value: 'fresh', label: 'Fresh water' }],
      onchange: function (e) { st.salt = e.target.value === 'salt'; save(); calc(); }
    }));

    if (mode !== 'free') {
      /* SIDEMOUNT AND STAGES CARRY MORE THAN ONE CYLINDER, and each one has
         its own buoyancy swing. A single picker cannot describe a diver with
         two sidemount elevens and a deco bottle, so the list is a list. */
      if (!st.tanks) st.tanks = [st.tank || 'al80'];
      var tankHost = A.el('div');
      function paintTanks() {
        A.clear(tankHost);
        st.tanks.forEach(function (id, idx) {
          var row = A.el('.split');
          row.appendChild(A.UI.select({
            label: st.tanks.length > 1 ? ('Cylinder ' + (idx + 1)) : 'Cylinder',
            value: id,
            options: TANKS.map(function (t) { return { value: t.id, label: t.label }; }),
            onchange: function (e) { st.tanks[idx] = e.target.value; save(); calc(); }
          }));
          if (st.tanks.length > 1) {
            var rm = A.el('button.btn.ghost', {
              text: 'Remove', style: { alignSelf: 'end', marginBottom: '10px' },
              onclick: function () {
                st.tanks.splice(idx, 1); save(); paintTanks(); calc();
              }
            });
            row.appendChild(rm);
          }
          tankHost.appendChild(row);
        });
        if (st.tanks.length < MAX_TANKS) {
          tankHost.appendChild(A.el('button.btn.ghost.block', {
            text: 'Add another cylinder', style: { marginBottom: '10px' },
            onclick: function () { st.tanks.push('al80'); save(); paintTanks(); calc(); }
          }));
        }
      }
      paintTanks();
      card.appendChild(tankHost);
      card.appendChild(A.UI.select({
        label: 'Backplate', value: st.plate,
        options: PLATES.map(function (p) { return { value: p.id, label: p.label }; }),
        onchange: function (e) { st.plate = e.target.value; save(); calc(); }
      }));
    } else {
      card.appendChild(A.UI.field({
        label: 'Planned maximum depth', suffix: 'm', inputmode: 'decimal', value: st.d,
        hint: 'Used only to say where to set neutral buoyancy',
        oninput: function (e) { st.d = e.target.value; save(); calc(); }
      }));
    }
    host.appendChild(card);
    host.appendChild(out);

    function pick(list, id) {
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return list[0];
    }

    function calc() {
      A.clear(out);
      var kg = num(st.kg);
      if (!ok(kg) || kg <= 0) { out.appendChild(A.UI.empty('Enter a body weight.')); return; }
      var suit = pick(SUITS, st.suit);
      var pct = mode === 'free' ? suit.free : suit.scuba;

      /* build shifts it: muscle sinks, fat floats */
      var buildAdj = st.build === 'lean' ? 0.01 : (st.build === 'fat' ? -0.01 : 0);
      var base = kg * (pct + buildAdj);

      /* fresh water is less dense, so it holds you up less and needs less lead.
         About 2.5% of your total displaced mass, which for a diver in a suit is
         close to 1 to 2 kg. */
      var saltAdj = st.salt ? 0 : -Math.max(1, kg * 0.02);

      var tankAdj = 0, plateAdj = 0, tanks = [], plate = null;
      if (mode !== 'free') {
        (st.tanks || [st.tank]).forEach(function (id) {
          var tk = pick(TANKS, id);
          tanks.push(tk);
          /* a cylinder that is negative when full is carrying some of your lead
             for you, but the number that matters is where it ends up EMPTY */
          tankAdj += tk.empty;     /* positive = floats at the end = more lead needed */
        });
        plate = pick(PLATES, st.plate);
        plateAdj = -plate.w;       /* the plate is lead you are already wearing */
      }

      var total = base + saltAdj + tankAdj + plateAdj;
      if (total < 0) total = 0;

      var c = A.UI.card();
      c.appendChild(A.UI.metric('Lead to start with', f(total, 1) + ' kg',
        { big: true, sub: 'a starting point for a buoyancy check, not a final figure' }));
      c.appendChild(A.UI.metric('From the suit', f(base, 1) + ' kg',
        { sub: f(pct * 100, 1) + '% of body weight for ' + A.tr(suit.label).toLowerCase() +
               (buildAdj ? ', adjusted for build' : '') }));
      if (!st.salt) c.appendChild(A.UI.metric('Fresh water', f(saltAdj, 1) + ' kg',
        { sub: 'fresh water holds you up less, so you carry less lead' }));
      if (mode !== 'free') {
        var fullSum = 0;
        tanks.forEach(function (tk) { fullSum += tk.full; });
        var names = tanks.filter(function (tk) { return tk.id !== 'none'; })
                         .map(function (tk) { return A.tr(tk.label); }).join(' + ');
        c.appendChild(A.UI.metric(tanks.length > 1 ? 'Cylinders when empty' : 'Cylinder when empty',
          (tankAdj >= 0 ? '+' : '') + f(tankAdj, 1) + ' kg',
          { sub: !names ? 'none fitted'
               : names + ': ' + f(fullSum, 1) + ' kg full, ' + f(tankAdj, 1) + ' kg empty. Weight for the empty end.' }));
        if (plate.w) c.appendChild(A.UI.metric('Backplate', '-' + f(plate.w, 1) + ' kg',
          { sub: 'already on your back, so it comes off the belt' }));
      }
      out.appendChild(c);

      if (mode === 'free') {
        var d = num(st.d);
        var neutralAt = ok(d) && d > 0 ? Math.min(d / 3, 12) : 10;
        var nc = A.UI.card();
        nc.appendChild(A.UI.metric('Set neutral at', f(neutralAt, 0) + ' m',
          { sub: ok(d) && d > 0 ? 'about a third of your ' + f(d, 0) + ' m target' : 'the usual default' }));
        nc.appendChild(A.UI.metric('Which means', 'positive at the surface',
          { sub: 'you float when you stop, and the last part of the ascent brings you up on its own' }));
        out.appendChild(nc);

        out.appendChild(A.UI.note(
          'WEIGHT FOR THE SURFACE, NOT THE BOTTOM. A freediver who is neutral deep is heavy ' +
          'shallow, and shallow is where a blackout happens and where you need to float without ' +
          'doing anything. Set neutral around a third of your target depth so you are always ' +
          'positive in the top ten metres. If in doubt, wear less: nobody has drowned from ' +
          'being too buoyant.'));
      } else {
        out.appendChild(A.UI.note(
          'CHECK IT IN THE WATER, WITH AN EMPTY CYLINDER. Float upright with an empty jacket, ' +
          'holding a normal breath: the water should sit at eye level, and you should sink ' +
          'slowly as you breathe out. Do that at the END of a dive, on 50 bar, because a full ' +
          'cylinder is carrying weight for you that will not be there when you need to hold a ' +
          'safety stop.'));
      }

      out.appendChild(A.UI.note(
        'These are starting figures from body weight and kit, and they cannot see how much of ' +
        'you is muscle, how compressed your suit already is, or how much air you habitually ' +
        'hold. Expect to be a kilogram or two out and settle it with a proper check.'));
    }
    calc();
  }

  /* ══ 7. dive plan: ZH-L16 with gradient factors ══════════════════════════

     THE AGENCY NAMES BELOW ARE GRADIENT FACTOR PRESETS, NOT THOSE AGENCIES'
     TABLES. The PADI RDP, the FFESSM MN90, the CMAS and the US Navy tables are
     specific published schedules and are not reproduced here: reciting sixty
     rows of stop times from memory and getting one cell wrong is exactly the
     failure that would not look like a failure. What each preset does is set
     the pair of gradient factors that lands nearest that agency's usual
     conservatism, which is a different claim and a weaker one, and it is
     labelled as such on the screen. */
  var GF_PRESETS = [
    { id: 'rec',  label: 'Recreational, moderate', lo: 40, hi: 85,
      note: 'A middle setting, close to how a recreational computer ships.' },
    { id: 'padi', label: 'PADI-like conservatism', lo: 45, hi: 85,
      note: 'Approximates the conservatism of recreational no-stop diving. NOT the PADI RDP.' },
    { id: 'cmas', label: 'CMAS-like conservatism', lo: 35, hi: 80,
      note: 'A little tighter than the recreational default. NOT a CMAS table.' },
    { id: 'ffessm', label: 'FFESSM / MN90-like', lo: 30, hi: 80,
      note: 'Approximates the French navy MN90 shape, which is conservative on the bottom. NOT the MN90 table.' },
    { id: 'usn',  label: 'US Navy-like', lo: 50, hi: 90,
      note: 'Approximates the more permissive US Navy air schedule. NOT the US Navy table.' },
    { id: 'gue',  label: 'GUE-like, ratio deco shape', lo: 20, hi: 85,
      note: 'Deep first stop, long shallow time, the shape ratio deco produces. NOT a GUE table.' },
    { id: 'tech', label: 'Technical, conservative', lo: 20, hi: 70,
      note: 'A common technical setting.' },
    { id: 'custom', label: 'Set my own gradient factors', lo: 30, hi: 75, note: '' }
  ];

  function toolDivePlan(host) {
    var st = A.store.get('dive.deco', {
      preset: 'rec', gfLo: 40, gfHi: 85, salt: true, alt: '',
      asc: '9', desc: '20',
      segs: [{ d: '30', m: '20', o2: '21', he: '0' }],
      deco: []
    });
    function save() { A.store.set('dive.deco', st); }
    var out = A.el('div');

    var head = A.UI.card();
    head.appendChild(A.UI.select({
      label: 'Conservatism', value: st.preset,
      options: GF_PRESETS.map(function (p) { return { value: p.id, label: p.label }; }),
      onchange: function (e) {
        st.preset = e.target.value;
        var p = pickP(st.preset);
        if (st.preset !== 'custom') { st.gfLo = p.lo; st.gfHi = p.hi; }
        save(); A.Router.refresh();
      }
    }));
    var gfRow = A.el('.split');
    gfRow.appendChild(A.UI.field({
      label: 'GF low', inputmode: 'numeric', value: st.gfLo,
      hint: 'At the deepest stop',
      oninput: function (e) { st.gfLo = A.parseNum(e.target.value); st.preset = 'custom'; save(); calc(); }
    }));
    gfRow.appendChild(A.UI.field({
      label: 'GF high', inputmode: 'numeric', value: st.gfHi,
      hint: 'On surfacing',
      oninput: function (e) { st.gfHi = A.parseNum(e.target.value); st.preset = 'custom'; save(); calc(); }
    }));
    head.appendChild(gfRow);
    head.appendChild(waterRow(st, save, function () { calc(); }));
    host.appendChild(head);

    function pickP(id) {
      for (var i = 0; i < GF_PRESETS.length; i++) if (GF_PRESETS[i].id === id) return GF_PRESETS[i];
      return GF_PRESETS[0];
    }

    /* ── the profile: one or more levels, each with its own gas ── */
    var segCard = A.UI.card();
    segCard.appendChild(A.el('.sec-lab', { text: 'The dive' }));
    var segHost = A.el('div');
    segCard.appendChild(segHost);
    host.appendChild(segCard);

    function paintSegs() {
      A.clear(segHost);
      st.segs.forEach(function (s, i) {
        var r1 = A.el('.split');
        r1.appendChild(A.UI.field({
          label: 'Depth ' + (st.segs.length > 1 ? (i + 1) : ''), suffix: 'm', inputmode: 'decimal', value: s.d,
          oninput: function (e) { s.d = e.target.value; save(); calc(); }
        }));
        r1.appendChild(A.UI.field({
          label: 'Minutes', inputmode: 'decimal', value: s.m,
          oninput: function (e) { s.m = e.target.value; save(); calc(); }
        }));
        segHost.appendChild(r1);
        var r2 = A.el('.split');
        r2.appendChild(A.UI.field({
          label: 'Oxygen', suffix: '%', inputmode: 'decimal', value: s.o2,
          oninput: function (e) { s.o2 = e.target.value; save(); calc(); }
        }));
        r2.appendChild(A.UI.field({
          label: 'Helium', suffix: '%', inputmode: 'decimal', value: s.he,
          oninput: function (e) { s.he = e.target.value; save(); calc(); }
        }));
        segHost.appendChild(r2);
        if (st.segs.length > 1) {
          segHost.appendChild(A.el('button.btn.ghost.block', {
            text: 'Remove this level', style: { marginBottom: '10px' },
            onclick: function () { st.segs.splice(i, 1); save(); paintSegs(); calc(); }
          }));
        }
      });
      if (st.segs.length < MAX_TANKS) {
        segHost.appendChild(A.el('button.btn.ghost.block', {
          text: 'Add another level', style: { marginBottom: '6px' },
          onclick: function () {
            var last = st.segs[st.segs.length - 1];
            st.segs.push({ d: last ? last.d : '20', m: '10', o2: last ? last.o2 : '21', he: last ? last.he : '0' });
            save(); paintSegs(); calc();
          }
        }));
      }
    }
    paintSegs();

    /* ── decompression gases carried ── */
    var gasCard = A.UI.card();
    gasCard.appendChild(A.el('.sec-lab', { text: 'Decompression gases carried' }));
    var gasHost = A.el('div');
    gasCard.appendChild(gasHost);
    host.appendChild(gasCard);

    function paintGases() {
      A.clear(gasHost);
      if (!st.deco.length) {
        gasHost.appendChild(A.el('.lrow-s', {
          style: { whiteSpace: 'normal', margin: '0 0 8px', color: 'var(--muted)' },
          text: 'None. The ascent will be made on the bottom gas.'
        }));
      }
      st.deco.forEach(function (g, i) {
        var r = A.el('.split');
        r.appendChild(A.UI.field({
          label: 'Oxygen', suffix: '%', inputmode: 'decimal', value: g.o2,
          oninput: function (e) { g.o2 = e.target.value; save(); calc(); }
        }));
        r.appendChild(A.UI.field({
          label: 'Switch at', suffix: 'm', inputmode: 'decimal', value: g.at,
          hint: 'Shallower than this',
          oninput: function (e) { g.at = e.target.value; save(); calc(); }
        }));
        gasHost.appendChild(r);
        gasHost.appendChild(A.el('button.btn.ghost.block', {
          text: 'Remove this gas', style: { marginBottom: '10px' },
          onclick: function () { st.deco.splice(i, 1); save(); paintGases(); calc(); }
        }));
      });
      if (st.deco.length < MAX_TANKS) {
        gasHost.appendChild(A.el('button.btn.ghost.block', {
          text: 'Add a decompression gas',
          onclick: function () { st.deco.push({ o2: '50', at: '21' }); save(); paintGases(); calc(); }
        }));
      }
    }
    paintGases();

    host.appendChild(out);

    function calc() {
      A.clear(out);
      var Deco = global.ArtDeco;
      if (!Deco) { out.appendChild(A.UI.empty('The decompression model did not load.')); return; }

      var segs = [], bad = false;
      st.segs.forEach(function (s) {
        var d = num(s.d), m = num(s.m), o2 = num(s.o2) / 100, he = num(s.he) / 100;
        if (!ok(d) || !ok(m) || !ok(o2) || o2 <= 0) { bad = true; return; }
        segs.push({ depth: d, minutes: m, fo2: o2, fhe: ok(he) ? he : 0 });
      });
      if (bad || !segs.length) { out.appendChild(A.UI.empty('Fill in the dive.')); return; }

      var deco = [];
      st.deco.forEach(function (g) {
        var o2 = num(g.o2) / 100, at = num(g.at);
        if (ok(o2) && o2 > 0 && ok(at)) deco.push({ fo2: o2, fhe: 0, maxDepth: at });
      });

      var alt = num(st.alt) || 0;
      var opts = {
        salt: st.salt, alt: alt, gfLo: st.gfLo, gfHi: st.gfHi,
        descent: num(st.desc) || 20, ascent: num(st.asc) || 9,
        segments: segs, deco: deco
      };
      var r;
      try { r = Deco.plan(opts); }
      catch (e) { out.appendChild(A.UI.empty('Could not work that profile out.')); return; }

      /* the no-stop time at the deepest level, for comparison */
      var deepest = 0, deepGas = segs[0];
      segs.forEach(function (s) { if (s.depth > deepest) { deepest = s.depth; deepGas = s; } });
      var nd = Deco.ndl({
        depth: deepest, fo2: deepGas.fo2, fhe: deepGas.fhe,
        salt: st.salt, alt: alt, gfLo: st.gfLo, gfHi: st.gfHi,
        descent: opts.descent, ascent: opts.ascent, max: 300
      });

      var c = A.UI.card();
      c.appendChild(A.UI.metric('Total runtime', f(r.runtime, 0) + ' min',
        { big: true, sub: f(r.bottomRuntime, 0) + ' min to leaving the bottom' }));
      if (r.stops.length) {
        c.appendChild(A.UI.metric('Decompression', f(r.decoTime, 0) + ' min',
          { sub: 'first stop at ' + f(r.firstStop, 0) + ' m' }));
      } else {
        c.appendChild(A.UI.metric('Decompression', 'none required',
          { sub: 'a direct ascent is allowed at GF ' + f(st.gfHi, 0) }));
      }
      c.appendChild(A.UI.metric('No-stop time at ' + f(deepest, 0) + ' m',
        nd >= 300 ? 'over 300 min' : f(nd, 0) + ' min',
        { sub: 'on this gas, at these gradient factors' }));
      out.appendChild(c);

      if (r.stops.length) {
        var sc = A.UI.card();
        sc.appendChild(A.el('.sec-lab', { text: 'Stops' }));
        r.stops.forEach(function (s) {
          sc.appendChild(A.UI.metric(f(s.depth, 0) + ' m', f(s.minutes, 0) + ' min',
            { sub: 'on ' + (s.fhe > 0
              ? (f(s.fo2 * 100, 0) + '/' + f(s.fhe * 100, 0))
              : (Math.abs(s.fo2 - 0.21) < 0.005 ? 'air' : 'EAN' + f(s.fo2 * 100, 0))) +
              '  ·  runtime ' + f(s.runtime, 0) + ' min' }));
        });
        out.appendChild(sc);
      }

      /* the compartments themselves, which is what the user asked to see */
      var lc = A.UI.card();
      lc.appendChild(A.el('.sec-lab', { text: 'Tissue loading on surfacing' }));
      lc.appendChild(A.UI.metric('Leading compartment',
        '#' + r.loading.leading + ', ' + f(Deco.HT_N2[r.loading.leading - 1], 1) + ' min half-time',
        { big: true, sub: f(r.loading.leadingPct, 0) + '% of what this gradient factor allows' }));
      var bars = A.el('div', { style: { marginTop: '8px' } });
      r.loading.compartments.forEach(function (cp) {
        var row = A.el('.dive-cpt');
        row.appendChild(A.el('span.dive-cpt-n', { text: String(cp.i) }));
        var track = A.el('span.dive-cpt-track');
        var pct = Math.max(0, Math.min(120, cp.pct));
        var fill = A.el('span.dive-cpt-fill' + (cp.pct > 100 ? '.over' : (cp.pct > 80 ? '.high' : '')));
        fill.style.width = (pct / 1.2) + '%';
        track.appendChild(fill);
        row.appendChild(track);
        row.appendChild(A.el('span.dive-cpt-v', { text: f(cp.pct, 0) + '%' }));
        bars.appendChild(row);
      });
      lc.appendChild(bars);
      lc.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '8px', color: 'var(--muted)' },
        text: 'Each bar is one theoretical compartment, from the fastest at the top to the ' +
              'slowest at the bottom, as a percentage of the supersaturation this gradient ' +
              'factor permits. The fullest one is the one deciding your ascent.'
      }));
      out.appendChild(lc);

      var p = pickP(st.preset);
      if (p.note) out.appendChild(A.UI.note(p.note));

      out.appendChild(A.UI.note(
        'THIS IS BÜHLMANN ZH-L16 WITH GRADIENT FACTORS, AND IT IS NOT THE TABLE OR THE ' +
        'COMPUTER YOU DIVE. It is the same family of model most computers run, computed from ' +
        'Bühlmann’s own formula, but it carries no bubble model, no repetitive-dive ' +
        'history, no allowance for cold, workload, age or a bad night, and no reserve for the ' +
        'dive going wrong. Plan on the computer or the table you actually carry, dive that, and ' +
        'use this to understand it rather than to replace it.'));
    }
    calc();
  }

  /* ══ pages ══════════════════════════════════════════════════════════════ */

  /* Gas plan and consumption are the same question asked twice: how much gas,
     and how fast does it go. They share a page and sit on two sub-tabs. */
  var PLAN_TABS = [
    { id: 'thirds', label: 'Gas plan', fn: toolPlan },
    { id: 'sac', label: 'Consumption', fn: toolSAC }
  ];
  function planPage(host) {
    var sub = A.store.get('dive.plantab', 'thirds');
    if (!PLAN_TABS.some(function (t) { return t.id === sub; })) sub = 'thirds';
    var chips = A.UI.chips(PLAN_TABS, sub, function (id) {
      A.store.set('dive.plantab', id); A.Router.refresh();
    });
    chips.classList.add('wrap');
    host.appendChild(chips);
    var body = A.el('div');
    host.appendChild(body);
    PLAN_TABS.filter(function (t) { return t.id === sub; })[0].fn(body);
  }

  var SCUBA_TABS = [
    { id: 'gas', label: 'Gas', fn: toolGas },
    { id: 'press', label: 'Pressure', fn: toolPressure },
    { id: 'dive', label: 'Dive plan', fn: toolDivePlan },
    { id: 'plan', label: 'Gas plan', fn: planPage },
    { id: 'weight', label: 'Weighting', fn: function (h) { toolWeight(h, 'scuba'); } },
    { id: 'fill', label: 'Fill', fn: toolFill }
  ];

  A.Router.register('scuba', {
    render: function (host) {
      A.setTitle('Scuba', { back: true });
      var tab = A.store.get('dive.tab', 'gas');
      if (!SCUBA_TABS.some(function (t) { return t.id === tab; })) tab = 'gas';
      var chips = A.UI.chips(SCUBA_TABS, tab, function (id) {
        A.store.set('dive.tab', id); A.Router.refresh();
      });
      chips.classList.add('wrap');
      host.appendChild(chips);
      var body = A.el('div');
      host.appendChild(body);
      SCUBA_TABS.filter(function (t) { return t.id === tab; })[0].fn(body);

      host.appendChild(A.UI.note(
        'THERE IS NO DECOMPRESSION SCHEDULE ON THIS PAGE, and that is deliberate. No no-stop ' +
        'times, no stops, no run time. Those come from the table or the computer you actually ' +
        'dive, and a second opinion invented by a phone is worse than none. What is here is the ' +
        'arithmetic around the plan: what the gas is, how deep it is breathable, how fast you ' +
        'will use it and what it weighs.'));
    }
  });

  var FREE_TABS = [
    { id: 'weight', label: 'Lead weight', fn: function (h) { toolWeight(h, 'free'); } }
  ];

  A.Router.register('freedive', {
    render: function (host) {
      A.setTitle('Free-diving', { back: true });
      var tab = A.store.get('dive.ftab', 'weight');
      if (!FREE_TABS.some(function (t) { return t.id === tab; })) tab = 'weight';
      var chips = A.UI.chips(FREE_TABS, tab, function (id) {
        A.store.set('dive.ftab', id); A.Router.refresh();
      });
      chips.classList.add('wrap');
      host.appendChild(chips);
      var body = A.el('div');
      host.appendChild(body);
      FREE_TABS.filter(function (t) { return t.id === tab; })[0].fn(body);

      host.appendChild(A.UI.note(
        'NEVER ALONE, AND NEVER WITHOUT SOMEONE WATCHING THE SURFACE. Every serious freediving ' +
        'accident is the same accident: a blackout in the last few metres with nobody there. ' +
        'A weight figure off a phone changes none of that.'));
    }
  });

})(window);
