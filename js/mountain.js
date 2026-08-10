/*
 * Artemidos - mountain navigation
 * Copyright (c) 2026 Artemidos. All rights reserved.
 *
 * Four calculations that decide whether a day in the hills goes to plan, and
 * every one of them is a thing people get wrong by eye:
 *
 *   SLOPE DISTANCE   a map measures the ground flattened. On a 30 degree slope
 *                    a kilometre on the map is 1155 metres under your boots.
 *   NAISMITH         5 km/h on the flat plus an hour for every 600 m climbed.
 *                    A hundred years old, still the base every planner uses.
 *   HEIGHT BY ANGLE  a clinometer angle and a paced distance give a height
 *                    without a barometer, a GPS or a signal.
 *   GRADIENT         rise over run. The number avalanche forecasting is
 *                    written in, and the reason 30 to 45 degrees matters.
 *
 * Every one is stated with its limits, because the limits are where people
 * are hurt: Naismith says nothing about descent, about a group, or about
 * carrying a load, and a gradient read off a map is an average that hides the
 * convex roll where the slab actually releases.
 */
(function (global) {
  'use strict';

  var D2R = Math.PI / 180;

  function hoursText(h) {
    if (!isFinite(h) || h < 0) return '-';
    var m = Math.round(h * 60);
    if (m < 60) return m + ' min';
    var hh = Math.floor(m / 60), mm = m % 60;
    return hh + ' h' + (mm ? ' ' + mm + ' min' : '');
  }

  /* ══ 1. slope distance ═════════════════════════════════════════════════ */
  function toolSlope(host) {
    var st = A.store.get('mtn.slope', { d: '1000', a: '30' });
    function save() { A.store.set('mtn.slope', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Distance on the map', inputmode: 'decimal', suffix: 'm', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Slope angle', inputmode: 'decimal', suffix: '°', value: st.a,
      hint: 'From a clinometer, or from the contours: rise over run, arctan.',
      oninput: function (e) { st.a = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var d = A.parseNum(st.d), a = A.parseNum(st.a);
      if (!(d > 0)) { out.appendChild(A.UI.note('Enter the map distance.')); return; }
      if (!isFinite(a) || a < 0 || a >= 90) {
        out.appendChild(A.UI.note('Enter a slope angle between 0 and 89 degrees.'));
        return;
      }
      /* sec θ, which is what the map flattening costs you */
      var slope = d / Math.cos(a * D2R);
      var extra = slope - d;

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Distance on the ground', A.U.fmt('dist', slope, { sig: 5 }),
        { big: true, icon: 'route' }));
      c.appendChild(A.UI.metric('More than the map says', A.U.fmt('dist', extra, { sig: 4 }),
        { sub: '+' + A.fmtNum((slope / d - 1) * 100, 3) + ' per cent' }));
      c.appendChild(A.UI.metric('Height gained over it', A.U.fmt('dist', d * Math.tan(a * D2R), { sig: 4 }),
        { sub: 'if the slope holds for the whole leg' }));
      out.appendChild(c);

      if (a >= 45) {
        out.appendChild(A.UI.note('Past 45 degrees the ground is costing you more ' +
          'distance than the map shows by half again, and it stops being walking.'));
      }
      out.appendChild(A.UI.note(
        'A map measures the ground FLATTENED. This is the correction, and it is ' +
        'the smaller of the two errors: the larger one is that a slope is never ' +
        'one angle for a whole leg. Break a route at each change of steepness ' +
        'and add the pieces.'));
    }
    calc();
  }

  /* ══ 2. Naismith ═══════════════════════════════════════════════════════ */
  function toolNaismith(host) {
    var st = A.store.get('mtn.naismith', { d: '10', up: '600', down: '0', pace: '5', load: 'light', party: '1' });
    function save() { A.store.set('mtn.naismith', st); }
    var out = A.el('div');

    var LOAD = [
      { id: 'light', n: 'Day pack, under 10 kg', f: 1 },
      { id: 'med', n: 'Overnight, 10 to 20 kg', f: 1.15 },
      { id: 'heavy', n: 'Heavy, over 20 kg', f: 1.35 }
    ];

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Distance on the map', inputmode: 'decimal', suffix: 'km', value: st.d,
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    var row = A.el('.split');
    row.appendChild(A.UI.field({
      label: 'Height gained', inputmode: 'decimal', suffix: 'm', value: st.up,
      oninput: function (e) { st.up = e.target.value; save(); calc(); }
    }));
    row.appendChild(A.UI.field({
      label: 'Height lost', inputmode: 'decimal', suffix: 'm', value: st.down,
      oninput: function (e) { st.down = e.target.value; save(); calc(); }
    }));
    card.appendChild(row);
    card.appendChild(A.UI.field({
      label: 'Pace on the flat', inputmode: 'decimal', suffix: 'km/h', value: st.pace,
      hint: 'Assumes 5 km/h. Drop it for rough ground, snow or night.',
      oninput: function (e) { st.pace = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Load', value: st.load,
      options: LOAD.map(function (l) { return { value: l.id, label: l.n }; }),
      onchange: function (e) { st.load = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'People in the party', inputmode: 'numeric', value: st.party,
      hint: 'A group moves at the pace of its slowest member, and loses time at every stop.',
      oninput: function (e) { st.party = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var d = A.parseNum(st.d), up = A.parseNum(st.up), down = A.parseNum(st.down);
      var pace = A.parseNum(st.pace), n = Math.max(1, A.parseNum(st.party) || 1);
      if (!(d >= 0)) { out.appendChild(A.UI.note('Enter the distance.')); return; }
      if (!(pace > 0)) pace = 5;
      if (!isFinite(up) || up < 0) up = 0;
      if (!isFinite(down) || down < 0) down = 0;

      var flat = d / pace;
      var climb = up / 600;                     /* Naismith: 1 h per 600 m */
      /* Tranter and others add time for STEEP descent and take a little off
         for gentle descent. Gentle descent genuinely is faster; steep descent
         is slower and is what wrecks an afternoon. Only the penalty is applied
         here, because a plan that assumes descent is free is the one that ends
         in the dark. */
      var desc = down > 0 ? (down / 1000) * 0.17 : 0;
      var load = (LOAD.filter(function (l) { return l.id === st.load; })[0] || LOAD[0]).f;
      /* a party is slower, and the effect flattens: two people are not twice
         as slow as one */
      var party = 1 + Math.min(0.35, 0.06 * (n - 1));
      var total = (flat + climb + desc) * load * party;

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Moving time', hoursText(total), { big: true, icon: 'clock' }));
      c.appendChild(A.UI.metric('  on the flat', hoursText(flat), { sub: d + ' km at ' + pace + ' km/h' }));
      c.appendChild(A.UI.metric('  for the climb', hoursText(climb), { sub: up + ' m at 600 m/h' }));
      if (desc > 0) c.appendChild(A.UI.metric('  for the descent', hoursText(desc),
        { sub: down + ' m down, which is not free' }));
      if (load !== 1) c.appendChild(A.UI.metric('  load factor', '×' + load));
      if (party !== 1) c.appendChild(A.UI.metric('  party of ' + n, '×' + A.fmtNum(party, 3)));
      out.appendChild(c);

      var c2 = A.UI.card(null, 'tight');
      c2.appendChild(A.UI.metric('Add rests, at 10 min per hour', hoursText(total * 1.17),
        { sub: 'the figure to give someone expecting you back' }));
      c2.appendChild(A.UI.metric('If it goes badly, ×1.5', hoursText(total * 1.5),
        { sub: 'weather, a navigation error, or one person slowing down' }));
      out.appendChild(c2);
    }
    calc();
  }

  /* ══ 3. height from an angle ═══════════════════════════════════════════ */
  function toolHeight(host) {
    var st = A.store.get('mtn.height', { d: '250', a: '18', eye: '1.6' });
    function save() { A.store.set('mtn.height', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Horizontal distance', inputmode: 'decimal', suffix: 'm', value: st.d,
      hint: 'Paced, ranged or taken off the map. HORIZONTAL, not along the slope.',
      oninput: function (e) { st.d = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Angle up to the top', inputmode: 'decimal', suffix: '°', value: st.a,
      oninput: function (e) { st.a = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Height of your eye', inputmode: 'decimal', suffix: 'm', value: st.eye,
      hint: 'Added at the end. Forgetting it is the usual error, and it is metres.',
      oninput: function (e) { st.eye = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var d = A.parseNum(st.d), a = A.parseNum(st.a), eye = A.parseNum(st.eye);
      if (!(d > 0)) { out.appendChild(A.UI.note('Enter the horizontal distance.')); return; }
      if (!isFinite(a) || a <= 0 || a >= 90) {
        out.appendChild(A.UI.note('Enter an angle between 1 and 89 degrees.')); return;
      }
      if (!isFinite(eye) || eye < 0) eye = 0;

      var rise = d * Math.tan(a * D2R);
      var total = rise + eye;
      var slant = d / Math.cos(a * D2R);

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Height above you', A.U.fmt('dist', rise, { sig: 4 }), { big: true }));
      c.appendChild(A.UI.metric('Above your feet', A.U.fmt('dist', total, { sig: 4 }),
        { sub: 'with eye height added' }));
      c.appendChild(A.UI.metric('Straight-line distance', A.U.fmt('dist', slant, { sig: 4 }),
        { sub: 'what a laser rangefinder would read' }));
      out.appendChild(c);

      /* an angle error hurts more the steeper it gets, and people do not
         expect that: it is worth showing rather than describing */
      var e1 = Math.abs(d * Math.tan((a + 1) * D2R) - rise);
      out.appendChild(A.UI.metric('One degree of error is worth',
        A.U.fmt('dist', e1, { sig: 3 }),
        { sub: 'at this angle and range. It grows steeply past 45 degrees.' }));

      out.appendChild(A.UI.note(
        'The distance must be HORIZONTAL. Pacing up a slope and using that ' +
        'figure inflates the answer by the same secant that the slope-distance ' +
        'page removes. Over a few kilometres, refraction and the curve of the ' +
        'earth start to matter as well; under one kilometre neither does.'));
    }
    calc();
  }

  /* ══ 4. gradient ═══════════════════════════════════════════════════════ */
  function toolGradient(host) {
    var st = A.store.get('mtn.grad', { rise: '100', run: '250' });
    function save() { A.store.set('mtn.grad', st); }
    var out = A.el('div');

    var card = A.UI.card();
    card.appendChild(A.UI.field({
      label: 'Rise, the contour change', inputmode: 'decimal', suffix: 'm', value: st.rise,
      oninput: function (e) { st.rise = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.field({
      label: 'Run, the map distance', inputmode: 'decimal', suffix: 'm', value: st.run,
      oninput: function (e) { st.run = e.target.value; save(); calc(); }
    }));
    host.appendChild(card);
    host.appendChild(out);

    /* Avalanche terrain, stated the way forecasts state it. 30 to 45 is the
       band where slab avalanches overwhelmingly release: below 30 the snow
       tends not to slide, above 50 it sluffs continuously instead of building
       a slab. This is the single most useful number a slope angle gives. */
    function band(deg) {
      if (deg < 25) return ['Low angle', 'ok', 'Rarely slides. Watch what is ABOVE you instead.'];
      if (deg < 30) return ['Approaching the band', 'warn',
        'Slides are possible on the steeper rolls within a slope this shallow on average.'];
      if (deg <= 45) return ['THE AVALANCHE BAND', 'bad',
        '30 to 45 degrees is where slab avalanches overwhelmingly release. The peak is around 38.'];
      if (deg <= 55) return ['Very steep', 'warn',
        'Sluffs continuously rather than building a deep slab, but a fall here does not stop.'];
      return ['Extreme', 'bad', 'Climbing terrain. A slip is a fall.'];
    }

    function calc() {
      A.clear(out);
      var rise = A.parseNum(st.rise), run = A.parseNum(st.run);
      if (!(run > 0)) { out.appendChild(A.UI.note('Enter the horizontal run.')); return; }
      if (!isFinite(rise)) { out.appendChild(A.UI.note('Enter the rise.')); return; }

      var pct = (rise / run) * 100;
      var deg = Math.atan(rise / run) / D2R;
      var b = band(Math.abs(deg));

      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('Gradient', A.fmtNum(pct, 4) + ' %', { big: true }));
      c.appendChild(A.UI.metric('As an angle', A.fmtNum(deg, 3) + '°'));
      c.appendChild(A.UI.metric('As a ratio', '1 in ' + A.fmtNum(run / Math.abs(rise || 1), 3)));
      c.appendChild(A.UI.metric('Slope distance', A.U.fmt('dist', Math.sqrt(rise * rise + run * run), { sig: 4 }),
        { sub: 'what you actually walk' }));
      out.appendChild(c);

      var w = A.UI.card();
      w.appendChild(A.el('div', {
        text: b[0],
        style: { fontWeight: '750', letterSpacing: '.04em',
                 color: b[1] === 'bad' ? 'var(--danger)' : b[1] === 'warn' ? 'var(--warn)' : 'var(--ok)' }
      }));
      w.appendChild(A.el('p', {
        text: b[2],
        style: { margin: '6px 0 0', lineHeight: '1.6', color: 'var(--text-2)' }
      }));
      out.appendChild(w);

      out.appendChild(A.UI.note(
        'A gradient off a map is an AVERAGE across the distance you measured. ' +
        'It hides the convex roll, which is exactly where a slab releases and ' +
        'exactly what the averaging removes. Measure the steepest 20 metres, ' +
        'not the whole slope, and check it on the ground with an inclinometer.'));
    }
    calc();
  }

  /* ══ the page ══════════════════════════════════════════════════════════ */

  var TABS = [
    { id: 'naismith', label: 'Time', fn: toolNaismith },
    { id: 'slope', label: 'Slope distance', fn: toolSlope },
    { id: 'height', label: 'Height', fn: toolHeight },
    { id: 'grad', label: 'Gradient', fn: toolGradient }
  ];

  A.Router.register('mountain', {
    render: function (host) {
      A.setTitle('Mountain', { back: true });
      var tab = A.store.get('mtn.tab', 'naismith');
      if (!TABS.some(function (t) { return t.id === tab; })) tab = 'naismith';

      var chips = A.UI.chips(TABS, tab, function (id) {
        A.store.set('mtn.tab', id); A.Router.refresh();
      });
      chips.classList.add('wrap');
      host.appendChild(chips);

      var body = A.el('div');
      host.appendChild(body);
      TABS.filter(function (t) { return t.id === tab; })[0].fn(body);

      host.appendChild(A.UI.note(
        'These are planning figures for a fit party in daylight on ground that ' +
        'behaves. Every one of them is optimistic in bad weather, in the dark, ' +
        'in deep snow, or with somebody struggling. Plan on the number, then ' +
        'decide what you will do when it is wrong.'));
    }
  });

  /* Urban: tools for built-up ground. The content is added later; for now the
     page exists so the Navigation button has somewhere to land. */
  A.Router.register('urban', {
    render: function (host) {
      A.setTitle('Urban', { back: true });
      host.appendChild(A.UI.empty('Urban tools are on the way.'));
    }
  });

})(window);
