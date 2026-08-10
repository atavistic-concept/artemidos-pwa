/*
 * Artemidos - statistics (single variable + regression)
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  /* ── normal distribution ── */
  function erf(x) {
    /* Abramowitz & Stegun 7.1.26 - about 1e-7 absolute, plenty for P/Q/R */
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var poly = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return s * (1 - poly * Math.exp(-x * x));
  }
  function normP(t) { return 0.5 * (1 + erf(t / Math.SQRT2)); }        /* -inf .. t  */
  function normQ(t) { return Math.abs(normP(t) - 0.5); }               /* 0 .. t     */
  function normR(t) { return 1 - normP(t); }                           /* t .. +inf  */

  /* ── single-variable summary ── */
  function summarise(data) {
    var n = 0, sx = 0, sx2 = 0;
    data.forEach(function (d) { n += d.f; sx += d.x * d.f; sx2 += d.x * d.x * d.f; });
    if (!n) return null;
    var mean = sx / n;
    var varP = sx2 / n - mean * mean;
    if (varP < 0) varP = 0;                       /* catastrophic cancellation guard */
    var varS = n > 1 ? (sx2 - n * mean * mean) / (n - 1) : NaN;
    if (varS < 0) varS = 0;

    /* expand for the order statistics - fine at field data sizes */
    var flat = [];
    data.forEach(function (d) { for (var i = 0; i < d.f; i++) flat.push(d.x); });
    flat.sort(function (a, b) { return a - b; });
    var mid = Math.floor(flat.length / 2);
    var median = flat.length % 2 ? flat[mid] : (flat[mid - 1] + flat[mid]) / 2;
    var q1 = quant(flat, 0.25), q3 = quant(flat, 0.75);

    var counts = {}, best = null;
    data.forEach(function (d) { counts[d.x] = (counts[d.x] || 0) + d.f; });
    Object.keys(counts).forEach(function (k) { if (!best || counts[k] > counts[best]) best = k; });
    var modal = counts[best] > 1 ? Number(best) : null;

    return {
      n: n, sum: sx, sum2: sx2, mean: mean,
      sdP: Math.sqrt(varP), sdS: Math.sqrt(varS),
      varP: varP, varS: varS,
      min: flat[0], max: flat[flat.length - 1],
      median: median, q1: q1, q3: q3, iqr: q3 - q1,
      mode: modal, range: flat[flat.length - 1] - flat[0]
    };
  }

  function quant(sorted, p) {
    if (!sorted.length) return NaN;
    var pos = (sorted.length - 1) * p;
    var lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  /* ── regression models, all reduced to a least-squares fit on transforms ── */
  var MODELS = [
    { id: 'lin',  name: 'Linear  y = a + bx',        tx: function (x) { return x; },        ty: function (y) { return y; },        inv: function (a, b, x) { return a + b * x; } },
    { id: 'log',  name: 'Logarithmic  y = a + b·ln x', tx: function (x) { return Math.log(x); }, ty: function (y) { return y; },   inv: function (a, b, x) { return a + b * Math.log(x); }, needXPos: true },
    { id: 'exp',  name: 'Exponential  y = a·e^(bx)',  tx: function (x) { return x; },        ty: function (y) { return Math.log(y); }, inv: function (a, b, x) { return Math.exp(a) * Math.exp(b * x); }, needYPos: true, expA: true },
    { id: 'pow',  name: 'Power  y = a·x^b',           tx: function (x) { return Math.log(x); }, ty: function (y) { return Math.log(y); }, inv: function (a, b, x) { return Math.exp(a) * Math.pow(x, b); }, needXPos: true, needYPos: true, expA: true },
    { id: 'inv',  name: 'Inverse  y = a + b/x',       tx: function (x) { return 1 / x; },    ty: function (y) { return y; },        inv: function (a, b, x) { return a + b / x; }, needXNonZero: true }
  ];

  function regress(pairs, model) {
    var pts = pairs.filter(function (p) {
      if (model.needXPos && !(p.x > 0)) return false;
      if (model.needYPos && !(p.y > 0)) return false;
      if (model.needXNonZero && p.x === 0) return false;
      return isFinite(p.x) && isFinite(p.y);
    }).map(function (p) { return { x: model.tx(p.x), y: model.ty(p.y) }; })
      .filter(function (p) { return isFinite(p.x) && isFinite(p.y); });

    var n = pts.length;
    if (n < 2) return null;
    var sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    pts.forEach(function (p) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y; });
    var den = n * sxx - sx * sx;
    if (Math.abs(den) < 1e-14) return null;
    var b = (n * sxy - sx * sy) / den;
    var a = (sy - b * sx) / n;
    var rden = Math.sqrt(den * (n * syy - sy * sy));
    var r = rden === 0 ? 1 : (n * sxy - sx * sy) / rden;
    return { a: a, b: b, r: r, r2: r * r, n: n, model: model, A: model.expA ? Math.exp(a) : a };
  }

  /* ══ view ═════════════════════════════════════════════════════════════ */

  function render(host, params) {
    var mode = params.query.tab || A.store.get('stats.mode', 'sd');
    if (mode !== 'sd' && mode !== 'reg') mode = 'sd';
    A.store.set('stats.mode', mode);

    A.setTitle('Statistics', {
      actions: [{
        icon: 'trash', label: 'Clear data', onclick: function () {
          A.store.set(mode === 'sd' ? 'stats.sd' : 'stats.reg', []);
          A.toast('Data cleared');
          A.Router.refresh();
        }
      }]
    });

    host.appendChild(A.mathTabs('stats'));
    host.appendChild(A.UI.chips(
      [{ id: 'sd', label: 'SD  ·  one variable' }, { id: 'reg', label: 'REG  ·  regression' }],
      mode,
      function (id) { A.Router.go('stats?tab=' + id); }
    ));

    if (mode === 'sd') renderSD(host); else renderREG(host);
  }

  function renderSD(host) {
    var data = A.store.get('stats.sd', []);
    function save() { A.store.set('stats.sd', data); }

    var entry = A.UI.card();
    var xIn = A.UI.field({ label: 'Value  x', inputmode: 'decimal' });
    var fIn = A.UI.field({ label: 'Frequency', inputmode: 'numeric', value: '1' });
    xIn.style.flex = '2';
    var row = A.el('.split', null, [xIn, fIn]);
    row.querySelector('.fld').style.flex = '2';
    entry.appendChild(row);

    function add() {
      var x = A.parseNum(xIn.input.value);
      var f = Math.round(A.parseNum(fIn.input.value));
      if (!isFinite(x)) { A.toast('Enter a numeric value'); return; }
      if (!isFinite(f) || f < 1) f = 1;
      data.push({ x: x, f: f });
      save();
      xIn.input.value = '';
      fIn.input.value = '1';
      xIn.input.focus();
      A.haptic(12);
      paint();
    }
    xIn.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
    fIn.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
    entry.appendChild(A.el('button.btn.block.sem-go', { html: Icons.svg('plus') + ' Add value', onclick: add }));
    host.appendChild(entry);

    /* paste a whole column at once - far quicker than tapping 40 values in */
    var bulk = A.el('details.card');
    bulk.appendChild(A.el('summary', { text: 'Paste a list of values', style: { cursor: 'pointer', fontWeight: '650', fontSize: '13px' } }));
    var ta = A.el('textarea.fld-in', {
      rows: 4, placeholder: '12, 15, 15, 18\n21 24 24',
      style: { marginTop: '10px', resize: 'vertical', fontSize: '14px' }
    });
    bulk.appendChild(ta);
    bulk.appendChild(A.el('button.btn.ghost.block', {
      text: 'Add all', style: { marginTop: '8px' },
      onclick: function () {
        var nums = String(ta.value).split(/[\s,;]+/).map(A.parseNum).filter(isFinite);
        if (!nums.length) { A.toast('No numbers found'); return; }
        nums.forEach(function (v) { data.push({ x: v, f: 1 }); });
        save(); ta.value = ''; A.toast(nums.length + ' values added'); paint();
      }
    }));
    host.appendChild(bulk);

    var out = A.el('div');
    host.appendChild(out);

    function paint() {
      A.clear(out);
      out.appendChild(A.UI.section('Data  (' + data.length + ' entr' + (data.length === 1 ? 'y' : 'ies') + ')'));

      if (!data.length) { out.appendChild(A.UI.empty('Add values to see the statistics.')); return; }

      var list = A.UI.card(null, 'tight');
      data.forEach(function (d, i) {
        var m = A.UI.metric('x = ' + A.fmtNum(d.x, 8), d.f > 1 ? '× ' + d.f : '');
        m.style.cursor = 'pointer';
        m.appendChild(A.el('button.fn-del', {
          html: Icons.svg('close'), 'aria-label': 'Remove',
          onclick: function (e) { e.stopPropagation(); data.splice(i, 1); save(); paint(); }
        }));
        list.appendChild(m);
      });
      out.appendChild(list);

      var s = summarise(data);
      out.appendChild(A.UI.section('Statistics'));
      var card = A.UI.card();
      [
        ['n  ·  count', s.n], ['x̄  ·  mean', s.mean],
        ['σx  ·  population SD', s.sdP], ['sx  ·  sample SD', s.sdS],
        ['σx²  ·  population variance', s.varP], ['sx²  ·  sample variance', s.varS],
        ['Σx  ·  sum', s.sum], ['Σx²  ·  sum of squares', s.sum2],
        ['Minimum', s.min], ['Q1', s.q1], ['Median', s.median], ['Q3', s.q3],
        ['Maximum', s.max], ['Range', s.range], ['IQR', s.iqr]
      ].forEach(function (r) { card.appendChild(A.UI.metric(r[0], A.fmtNum(r[1], 8))); });
      if (s.mode != null) card.appendChild(A.UI.metric('Mode', A.fmtNum(s.mode, 8)));
      out.appendChild(card);

      /* normal distribution against this sample */
      out.appendChild(A.UI.section('Normal distribution  ·  P, Q, R'));
      var dcard = A.UI.card();
      var tIn = A.UI.field({
        label: 'x value (or t if σ = 0)', inputmode: 'decimal',
        hint: 't = (x − x̄) / σx, using the population SD above'
      });
      var dout = A.el('div');
      tIn.input.addEventListener('input', function () {
        A.clear(dout);
        var x = A.parseNum(tIn.input.value);
        if (!isFinite(x)) return;
        var t = s.sdP > 0 ? (x - s.mean) / s.sdP : x;
        dout.appendChild(A.UI.metric('t  ·  standard score', A.fmtNum(t, 6)));
        dout.appendChild(A.UI.metric('P(t)  ·  area below t', A.fmtNum(normP(t), 6)));
        dout.appendChild(A.UI.metric('Q(t)  ·  area between 0 and t', A.fmtNum(normQ(t), 6)));
        dout.appendChild(A.UI.metric('R(t)  ·  area above t', A.fmtNum(normR(t), 6)));
      });
      dcard.appendChild(tIn);
      dcard.appendChild(dout);
      out.appendChild(dcard);
    }

    paint();
  }

  function renderREG(host) {
    var data = A.store.get('stats.reg', []);
    function save() { A.store.set('stats.reg', data); }

    var entry = A.UI.card();
    var xIn = A.UI.field({ label: 'x', inputmode: 'decimal' });
    var yIn = A.UI.field({ label: 'y', inputmode: 'decimal' });
    entry.appendChild(A.el('.split', null, [xIn, yIn]));

    function add() {
      var x = A.parseNum(xIn.input.value), y = A.parseNum(yIn.input.value);
      if (!isFinite(x) || !isFinite(y)) { A.toast('Enter both x and y'); return; }
      data.push({ x: x, y: y });
      save();
      xIn.input.value = ''; yIn.input.value = '';
      xIn.input.focus();
      A.haptic(12);
      paint();
    }
    yIn.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
    entry.appendChild(A.el('button.btn.block.sem-go', { html: Icons.svg('plus') + ' Add pair', onclick: add }));
    host.appendChild(entry);

    var out = A.el('div');
    host.appendChild(out);

    function paint() {
      A.clear(out);
      out.appendChild(A.UI.section('Data  (' + data.length + ' pair' + (data.length === 1 ? '' : 's') + ')'));
      if (data.length < 2) { out.appendChild(A.UI.empty('Add at least two x,y pairs.')); return; }

      var list = A.UI.card(null, 'tight');
      data.forEach(function (d, i) {
        var m = A.UI.metric('(' + A.fmtNum(d.x, 6) + ',  ' + A.fmtNum(d.y, 6) + ')', '');
        m.appendChild(A.el('button.fn-del', {
          html: Icons.svg('close'), 'aria-label': 'Remove',
          onclick: function () { data.splice(i, 1); save(); paint(); }
        }));
        list.appendChild(m);
      });
      out.appendChild(list);

      var fits = MODELS.map(function (m) { return regress(data, m); }).filter(Boolean);
      if (!fits.length) { out.appendChild(A.UI.empty('These points cannot be fitted (all x identical?).')); return; }
      fits.sort(function (a, b) { return b.r2 - a.r2; });

      out.appendChild(A.UI.section('Best fit  ·  ' + fits[0].model.name));
      var best = fits[0];
      var card = A.UI.card();
      card.appendChild(A.UI.metric('a', A.fmtNum(best.A, 8), { big: true }));
      card.appendChild(A.UI.metric('b', A.fmtNum(best.b, 8), { big: true }));
      card.appendChild(A.UI.metric('r  ·  correlation', A.fmtNum(best.r, 8)));
      card.appendChild(A.UI.metric('r²  ·  coefficient of determination', A.fmtNum(best.r2, 8)));
      card.appendChild(A.UI.metric('Points used', best.n));

      var pIn = A.UI.field({ label: 'Predict ŷ for x =', inputmode: 'decimal' });
      var pOut = A.el('div');
      pIn.input.addEventListener('input', function () {
        A.clear(pOut);
        var x = A.parseNum(pIn.input.value);
        if (!isFinite(x)) return;
        var y = best.model.inv(best.a, best.b, x);
        pOut.appendChild(A.UI.metric('ŷ', isFinite(y) ? A.fmtNum(y, 8) : 'undefined at this x', { big: true }));
      });
      card.appendChild(pIn);
      card.appendChild(pOut);
      out.appendChild(card);

      out.appendChild(A.UI.section('All models'));
      var all = A.UI.card(null, 'tight');
      fits.forEach(function (f) {
        all.appendChild(A.UI.metric(f.model.name, 'r² = ' + A.fmtNum(f.r2, 6),
          { sub: 'a = ' + A.fmtNum(f.A, 6) + '   b = ' + A.fmtNum(f.b, 6) + '   (' + f.n + ' points)' }));
      });
      out.appendChild(all);
      out.appendChild(A.UI.note('Models are ranked by r² on their own transformed scale, so compare them with judgement: a high r² on a log fit does not by itself mean the relationship is logarithmic.'));
    }

    paint();
  }

  A.Router.register('stats', { render: render });
  global.ArtStats = { summarise: summarise, regress: regress, normP: normP, normQ: normQ, normR: normR };

})(window);
