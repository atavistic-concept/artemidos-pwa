/*
 * Artemidos - fuel planning: land, sea and air
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT THIS IS. Three fuel calculators that share one idea: consumption is
 * never a single number, it is a number bent by the conditions. A flat-road
 * economy figure is wrong the moment the road tilts; a boat's litres-per-hour
 * at cruise is wrong the moment there is a sea running; an aircraft's burn is
 * the same but the GROUND covered per litre collapses into a headwind. So each
 * tab takes the maker's clean figure and applies the physics that the maker's
 * figure quietly assumed away.
 *
 * WHAT IT IS NOT. It is not a substitute for a dipstick, a fuel flow gauge or
 * a flight plan. The weather corrections at sea are an ESTIMATE with a stated
 * formula, not a tank test of your hull, and they are labelled as such. Always
 * carry a reserve the numbers here do not know about.
 *
 * Units are held explicit rather than run through the app's unit system,
 * because fuel is planned in the units printed on the pump and the placard:
 * litres, L/100 km, L/h, km, nautical miles, knots. Convert before you type if
 * your figure is in something else.
 */
(function (global) {
  'use strict';

  var A = global.A;

  function num(v) { return A.parseNum(v); }
  function ok(v) { return isFinite(v) && v > 0; }
  function okz(v) { return isFinite(v); }
  /* Fixed decimal places with the app's thousands spacing. Deliberately NOT
     A.fmtNum, whose second argument is significant figures, not decimals -
     fuel is planned to a set number of decimal places (156 L, 2.22 L/nm), not
     to a sliding precision. */
  function f(v, d) {
    if (!isFinite(v)) return '-';
    d = d == null ? 1 : d;
    var parts = v.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }

  var G = 9.80665;

  /* Energy density in MJ per litre, and a whole-drivetrain efficiency used
     ONLY for the land gradient correction (turning the work of lifting the
     vehicle into extra litres). Marine and aero tabs take the maker's
     consumption directly and never touch eff. */
  var FUELS = [
    { id: 'petrol', label: 'Petrol / gasoline', mjL: 34.2, eff: 0.28 },
    { id: 'diesel', label: 'Diesel',            mjL: 35.8, eff: 0.33 },
    { id: 'lpg',    label: 'LPG / autogas',     mjL: 25.3, eff: 0.26 },
    { id: 'e85',    label: 'Ethanol E85',       mjL: 25.6, eff: 0.27 },
    { id: 'mgo',    label: 'Marine gas oil',    mjL: 36.0, eff: 0.40 },
    { id: 'hfo',    label: 'Heavy fuel oil',    mjL: 39.0, eff: 0.45 },
    { id: 'jet',    label: 'Jet A-1 / kerosene', mjL: 34.7, eff: 0.30 },
    { id: 'avgas',  label: 'Avgas 100LL',       mjL: 33.5, eff: 0.28 }
  ];
  function fuelById(id) {
    return FUELS.filter(function (x) { return x.id === id; })[0] || FUELS[0];
  }
  function fuelSelect(subset, value, onchange) {
    var opts = FUELS.filter(function (x) { return subset.indexOf(x.id) >= 0; })
      .map(function (x) { return { value: x.id, label: x.label }; });
    return A.UI.select({ label: 'Fuel type', value: value, options: opts, onchange: onchange });
  }

  /* ══ LAND ═══════════════════════════════════════════════════════════════
     A road economy figure assumes level ground. On a sustained climb the
     engine also lifts the whole vehicle, and that work is real litres. The
     gradient term is m·g·sin θ over the distance, divided by the fuel's energy
     and the drivetrain efficiency; it is added to the flat figure. Descending
     is left out on purpose - a decline saves fuel only down to the idle floor
     and never as cleanly as a climb costs it, so counting on it over-promises. */
  function landTab(host) {
    var st = A.store.get('fuel.land', {
      fuel: 'petrol', cons: '8', mass: '1.5', grade: '0', speed: '90', dist: '100', avail: ''
    });
    function save() { A.store.set('fuel.land', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(fuelSelect(['petrol', 'diesel', 'lpg', 'e85'], st.fuel,
      function (e) { st.fuel = e.target.value; save(); calc(); }));
    card.appendChild(A.UI.field({
      label: 'Flat-road consumption', suffix: 'L/100 km', inputmode: 'decimal', value: st.cons,
      hint: 'The placard or trip-computer figure, on the level',
      oninput: function (e) { st.cons = e.target.value; save(); calc(); }
    }));
    var g1 = A.el('.split');
    g1.appendChild(A.UI.field({
      label: 'Distance', suffix: 'km', inputmode: 'decimal', value: st.dist,
      oninput: function (e) { st.dist = e.target.value; save(); calc(); }
    }));
    g1.appendChild(A.UI.field({
      label: 'Speed', suffix: 'km/h', inputmode: 'decimal', value: st.speed,
      oninput: function (e) { st.speed = e.target.value; save(); calc(); }
    }));
    card.appendChild(g1);
    var g2 = A.el('.split');
    g2.appendChild(A.UI.field({
      label: 'Vehicle mass', suffix: 't', inputmode: 'decimal', value: st.mass,
      hint: 'Loaded weight, for the climb',
      oninput: function (e) { st.mass = e.target.value; save(); calc(); }
    }));
    g2.appendChild(A.UI.field({
      label: 'Uphill gradient', suffix: '%', inputmode: 'decimal', value: st.grade,
      hint: 'Sustained climb, 0 for level',
      oninput: function (e) { st.grade = e.target.value; save(); calc(); }
    }));
    card.appendChild(g2);
    card.appendChild(A.UI.field({
      label: 'Fuel available', suffix: 'L', inputmode: 'decimal', value: st.avail,
      hint: 'Optional, for range on these conditions',
      oninput: function (e) { st.avail = e.target.value; save(); calc(); }
    }));
    out.appendChild(card);

    var res = A.el('div');
    out.appendChild(res);
    host.appendChild(out);

    function calc() {
      res.innerHTML = '';
      var fuel = fuelById(st.fuel);
      var base = num(st.cons), dist = num(st.dist), speed = num(st.speed);
      var mass = num(st.mass), grade = num(st.grade);
      if (!ok(base)) return;

      /* extra litres per 100 km to hold a sustained climb */
      var extra100 = 0;
      if (ok(mass) && okz(grade) && grade > 0) {
        var theta = Math.atan(grade / 100);
        var jPerKm = mass * 1000 * G * Math.sin(theta) * 1000;   /* J to climb 1 km of this grade */
        var lPerKm = jPerKm / (fuel.mjL * 1e6 * fuel.eff);
        extra100 = lPerKm * 100;
      }
      var adj = base + extra100;

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Effective consumption', f(adj, 1) + ' L/100 km',
        { sub: extra100 > 0 ? '+' + f(extra100, 1) + ' from the climb' : 'level ground', big: true }));
      if (ok(dist)) {
        var total = adj / 100 * dist;
        c.appendChild(A.UI.metric('Fuel for the trip', f(total, 1) + ' L',
          { sub: f(dist, 0) + ' km' }));
      }
      if (ok(speed)) {
        c.appendChild(A.UI.metric('Fuel flow', f(adj / 100 * speed, 1) + ' L/h', { sub: 'at ' + f(speed, 0) + ' km/h' }));
        if (ok(dist)) c.appendChild(A.UI.metric('Journey time', A.fmtDur(dist / speed), { sub: 'moving' }));
      }
      res.appendChild(c);

      var avail = num(st.avail);
      if (ok(avail)) {
        var rc = A.UI.card(null, 'tight');
        var range = avail / adj * 100;
        rc.appendChild(A.UI.metric('Range', f(range, 0) + ' km',
          { sub: 'on ' + f(avail, 0) + ' L, these conditions', big: true }));
        if (ok(speed)) rc.appendChild(A.UI.metric('Endurance', A.fmtDur(range / speed), null));
        res.appendChild(rc);
      }
    }
    calc();
  }

  /* ══ SEA ════════════════════════════════════════════════════════════════
     A displacement hull's litres-per-hour is quoted in flat water. A seaway
     adds resistance the engine has to push through, and it is worst head-on
     and least following. There is no honest closed form without the hull, so
     this is a STATED ESTIMATE: a wave term growing with the square of
     significant height, a smaller wind term growing with the square of wind
     speed, both scaled by heading so a following sea is nearly free. The
     breakdown is shown so the guess is never hidden inside the answer. */
  function seaTab(host) {
    var st = A.store.get('fuel.sea', {
      fuel: 'diesel', lph: '40', speed: '18', dist: '60',
      wave: '1.5', wind: '15', ang: '0', reserve: '20'
    });
    function save() { A.store.set('fuel.sea', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(fuelSelect(['diesel', 'mgo', 'hfo', 'petrol'], st.fuel,
      function (e) { st.fuel = e.target.value; save(); calc(); }));
    var g1 = A.el('.split');
    g1.appendChild(A.UI.field({
      label: 'Consumption at cruise', suffix: 'L/h', inputmode: 'decimal', value: st.lph,
      oninput: function (e) { st.lph = e.target.value; save(); calc(); }
    }));
    g1.appendChild(A.UI.field({
      label: 'Cruise speed', suffix: 'kn', inputmode: 'decimal', value: st.speed,
      oninput: function (e) { st.speed = e.target.value; save(); calc(); }
    }));
    card.appendChild(g1);
    card.appendChild(A.UI.field({
      label: 'Distance', suffix: 'nm', inputmode: 'decimal', value: st.dist,
      oninput: function (e) { st.dist = e.target.value; save(); calc(); }
    }));
    var g2 = A.el('.split');
    g2.appendChild(A.UI.field({
      label: 'Wave height', suffix: 'm', inputmode: 'decimal', value: st.wave,
      hint: 'Significant height of the sea',
      oninput: function (e) { st.wave = e.target.value; save(); calc(); }
    }));
    g2.appendChild(A.UI.field({
      label: 'Wind speed', suffix: 'kn', inputmode: 'decimal', value: st.wind,
      oninput: function (e) { st.wind = e.target.value; save(); calc(); }
    }));
    card.appendChild(g2);
    card.appendChild(A.UI.select({
      label: 'Wind and sea from', value: st.ang,
      options: [
        { value: '0', label: 'Ahead (head sea)' },
        { value: '45', label: 'Off the bow' },
        { value: '90', label: 'On the beam' },
        { value: '135', label: 'Off the quarter' },
        { value: '180', label: 'Astern (following)' }
      ],
      onchange: function (e) { st.ang = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Reserve', suffix: '%', inputmode: 'decimal', value: st.reserve,
      hint: 'Added on top for margin',
      oninput: function (e) { st.reserve = e.target.value; save(); calc(); }
    }));
    out.appendChild(card);

    var res = A.el('div');
    out.appendChild(res);
    host.appendChild(out);

    function calc() {
      res.innerHTML = '';
      var lph = num(st.lph), speed = num(st.speed), dist = num(st.dist);
      var wave = num(st.wave), wind = num(st.wind), ang = num(st.ang), reserve = num(st.reserve);
      if (!ok(lph) || !ok(speed)) return;

      /* heading factor: 1.0 head, ~0.10 following */
      var dirF = 0.55 + 0.45 * Math.cos(ang * Math.PI / 180);
      var wavePen = okz(wave) && wave > 0 ? 0.05 * wave * wave * dirF : 0;
      var windPen = okz(wind) && wind > 0 ? 0.00025 * wind * wind * dirF : 0;
      var pen = Math.min(wavePen + windPen, 1.2);            /* cap at +120% */
      var mult = 1 + pen;

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Weather allowance', '+' + f(pen * 100, 0) + '%',
        { sub: 'waves +' + f(wavePen * 100, 0) + '%, wind +' + f(windPen * 100, 0) + '%', big: true }));
      var perNm = lph / speed;
      c.appendChild(A.UI.metric('Flat-water burn', f(perNm, 2) + ' L/nm', { sub: f(lph, 0) + ' L/h at ' + f(speed, 0) + ' kn' }));
      c.appendChild(A.UI.metric('Adjusted burn', f(perNm * mult, 2) + ' L/nm', { sub: 'in this sea' }));
      res.appendChild(c);

      if (ok(dist)) {
        var time = dist / speed;
        var trip = perNm * mult * dist;
        var withRes = trip * (1 + (okz(reserve) && reserve > 0 ? reserve / 100 : 0));
        var tc = A.UI.card(null, 'tight');
        tc.appendChild(A.UI.metric('Fuel for the passage', f(trip, 0) + ' L',
          { sub: f(dist, 0) + ' nm in ' + A.fmtDur(time), big: true }));
        if (okz(reserve) && reserve > 0) {
          tc.appendChild(A.UI.metric('With reserve', f(withRes, 0) + ' L', { sub: '+' + f(reserve, 0) + '%' }));
        }
        res.appendChild(tc);
      }

      res.appendChild(A.UI.note(
        'The weather figure is an ESTIMATE from wave height, wind and heading, not a test of your ' +
        'hull. A fouled bottom, a head current or a short steep sea can beat it. Never sail down to ' +
        'the last calculated litre.'));
    }
    calc();
  }

  /* ══ AIR ════════════════════════════════════════════════════════════════
     An engine burns by the hour, not by the mile, so the burn rate barely
     moves with wind - but the GROUND covered per hour does, and that is what
     empties the tanks over a route. Headwind slows the groundspeed, stretches
     the time, and burns more for the same distance; tailwind the reverse.
     Reserve is carried in minutes, the way it is planned. */
  function airTab(host) {
    var st = A.store.get('fuel.air', {
      fuel: 'jet', burn: '200', tas: '250', dist: '400', wind: '20', reserve: '45', avail: ''
    });
    function save() { A.store.set('fuel.air', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(fuelSelect(['jet', 'avgas', 'diesel'], st.fuel,
      function (e) { st.fuel = e.target.value; save(); calc(); }));
    var g1 = A.el('.split');
    g1.appendChild(A.UI.field({
      label: 'Cruise burn', suffix: 'L/h', inputmode: 'decimal', value: st.burn,
      oninput: function (e) { st.burn = e.target.value; save(); calc(); }
    }));
    g1.appendChild(A.UI.field({
      label: 'True airspeed', suffix: 'kn', inputmode: 'decimal', value: st.tas,
      oninput: function (e) { st.tas = e.target.value; save(); calc(); }
    }));
    card.appendChild(g1);
    var g2 = A.el('.split');
    g2.appendChild(A.UI.field({
      label: 'Distance', suffix: 'nm', inputmode: 'decimal', value: st.dist,
      oninput: function (e) { st.dist = e.target.value; save(); calc(); }
    }));
    g2.appendChild(A.UI.field({
      label: 'Wind component', suffix: 'kn', inputmode: 'decimal', value: st.wind,
      hint: 'Positive headwind, negative tailwind',
      oninput: function (e) { st.wind = e.target.value; save(); calc(); }
    }));
    card.appendChild(g2);
    card.appendChild(A.UI.field({
      label: 'Reserve', suffix: 'min', inputmode: 'decimal', value: st.reserve,
      hint: 'Held back, at cruise burn',
      oninput: function (e) { st.reserve = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Fuel on board', suffix: 'L', inputmode: 'decimal', value: st.avail,
      hint: 'Optional, for still-air range and endurance',
      oninput: function (e) { st.avail = e.target.value; save(); calc(); }
    }));
    out.appendChild(card);

    var res = A.el('div');
    out.appendChild(res);
    host.appendChild(out);

    function calc() {
      res.innerHTML = '';
      var burn = num(st.burn), tas = num(st.tas), dist = num(st.dist);
      var wind = num(st.wind), reserve = num(st.reserve);
      if (!ok(burn) || !ok(tas)) return;

      var gs = tas - (okz(wind) ? wind : 0);
      var c = A.UI.card(null, 'tight');
      if (gs <= 0) {
        c.appendChild(A.UI.note('The headwind is at or above the airspeed: no ground is made good. Check the wind figure.'));
        res.appendChild(c);
        return;
      }
      c.appendChild(A.UI.metric('Groundspeed', f(gs, 0) + ' kn',
        { sub: f(tas, 0) + ' kn TAS, ' + (wind >= 0 ? f(wind, 0) + ' kn head' : f(-wind, 0) + ' kn tail'), big: true }));
      if (ok(dist)) {
        var time = dist / gs;
        var trip = burn * time;
        var resFuel = okz(reserve) && reserve > 0 ? burn * reserve / 60 : 0;
        c.appendChild(A.UI.metric('Trip fuel', f(trip, 0) + ' L', { sub: f(dist, 0) + ' nm in ' + A.fmtDur(time) }));
        c.appendChild(A.UI.metric('Fuel per mile', f(trip / dist, 2) + ' L/nm', null));
        if (resFuel > 0) c.appendChild(A.UI.metric('Reserve', f(resFuel, 0) + ' L', { sub: f(reserve, 0) + ' min held' }));
        c.appendChild(A.UI.metric('Total required', f(trip + resFuel, 0) + ' L', { sub: 'trip plus reserve' }));
      }
      res.appendChild(c);

      var avail = num(st.avail);
      if (ok(avail)) {
        var end = avail / burn;                 /* hours */
        var rc = A.UI.card(null, 'tight');
        rc.appendChild(A.UI.metric('Endurance', A.fmtDur(end), { sub: 'on ' + f(avail, 0) + ' L', big: true }));
        rc.appendChild(A.UI.metric('Still-air range', f(end * tas, 0) + ' nm', { sub: 'no wind' }));
        if (ok(dist)) rc.appendChild(A.UI.metric('Range this wind', f(end * gs, 0) + ' nm', null));
        res.appendChild(rc);
      }
    }
    calc();
  }

  var TABS = [
    { id: 'land', label: 'Land', fn: landTab },
    { id: 'sea',  label: 'Sea',  fn: seaTab },
    { id: 'air',  label: 'Air',  fn: airTab }
  ];

  A.Router.register('fuel', {
    render: function (host) {
      A.setTitle('Fuel', { back: true });
      var tab = A.store.get('fuel.tab', 'land');
      if (!TABS.some(function (t) { return t.id === tab; })) tab = 'land';
      var chips = A.UI.chips(TABS, tab, function (id) {
        A.store.set('fuel.tab', id); A.Router.refresh();
      });
      host.appendChild(chips);
      var body = A.el('div');
      host.appendChild(body);
      TABS.filter(function (t) { return t.id === tab; })[0].fn(body);

      host.appendChild(A.UI.note(
        'Every figure here starts from the consumption YOU enter and bends it with the conditions: ' +
        'a gradient on land, a seaway at sea, a wind aloft. It plans a trip, it does not measure a ' +
        'tank. Carry a reserve beyond what these numbers show.'));
    }
  });

})(window);
