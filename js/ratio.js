/*
 * Artemidos - rule of three & proportion
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var TABS = [
    { id: 'three', label: 'Rule of three' },
    { id: 'prop', label: 'Proportion' },
    { id: 'scale', label: 'Scale & ratio' }
  ];

  function render(host, params) {
    var tab = params.path[0] || params.query.tab || A.store.get('ratio.tab', 'three');
    if (!TABS.some(function (t) { return t.id === tab; })) tab = 'three';
    A.store.set('ratio.tab', tab);

    A.setTitle(tab === 'three' ? 'Rule of three' : tab === 'prop' ? 'Proportion' : 'Scale & ratio');
    /* the shared maths row already lists these three individually, so a
       second row of the same choices would be pure duplication */
    host.appendChild(A.mathTabs('ratio/' + tab));

    if (tab === 'three') renderThree(host);
    else if (tab === 'prop') renderProp(host);
    else renderScale(host);
  }

  /* ══ rule of three ════════════════════════════════════════════════════
     Direct:  a → b,  c → x   gives  x = b·c / a
     Inverse: a → b,  c → x   gives  x = a·b / c                          */

  function renderThree(host) {
    var st = A.store.get('ratio.three', { mode: 'direct', a: '', b: '', c: '' });

    var card = A.UI.card();

    var modeRow = A.UI.chips(
      [{ id: 'direct', label: 'Direct  ↑↑' }, { id: 'inverse', label: 'Inverse  ↑↓' }],
      st.mode,
      function (id) { st.mode = id; save(); A.Router.refresh(); }
    );
    host.appendChild(modeRow);

    function save() { A.store.set('ratio.three', st); }

    var aIn = A.UI.field({ label: 'If this…', inputmode: 'decimal', value: st.a, placeholder: 'a' });
    var bIn = A.UI.field({ label: '…corresponds to', inputmode: 'decimal', value: st.b, placeholder: 'b' });
    var cIn = A.UI.field({ label: 'then this…', inputmode: 'decimal', value: st.c, placeholder: 'c' });

    var out = A.el('div');
    var work = A.el('.note');

    function calc() {
      st.a = aIn.input.value; st.b = bIn.input.value; st.c = cIn.input.value;
      save();
      A.clear(out);
      work.textContent = '';
      var a = A.parseNum(st.a), b = A.parseNum(st.b), c = A.parseNum(st.c);
      if (!isFinite(a) || !isFinite(b) || !isFinite(c)) return;

      var x, formula;
      if (st.mode === 'direct') {
        if (a === 0) { out.appendChild(A.UI.empty('a cannot be zero in a direct proportion.')); return; }
        x = b * c / a;
        formula = 'x = (b × c) ÷ a = (' + A.fmtNum(b, 8) + ' × ' + A.fmtNum(c, 8) + ') ÷ ' + A.fmtNum(a, 8);
      } else {
        if (c === 0) { out.appendChild(A.UI.empty('c cannot be zero in an inverse proportion.')); return; }
        x = a * b / c;
        formula = 'x = (a × b) ÷ c = (' + A.fmtNum(a, 8) + ' × ' + A.fmtNum(b, 8) + ') ÷ ' + A.fmtNum(c, 8);
      }
      out.appendChild(A.UI.metric('…corresponds to  x', A.fmtNum(x, 10), { big: true }));
      work.textContent = formula;
    }

    [aIn, bIn, cIn].forEach(function (f) { f.input.addEventListener('input', calc); });

    card.appendChild(A.el('.split', null, [aIn, bIn]));
    card.appendChild(cIn);
    card.appendChild(out);
    card.appendChild(work);
    host.appendChild(card);

    host.appendChild(A.UI.note(st.mode === 'direct'
      ? 'Direct: as the first quantity grows, the second grows with it. 3 vehicles carry 12 people, so 5 vehicles carry 20.'
      : 'Inverse: as the first quantity grows, the second shrinks. 3 vehicles take 8 hours, so 6 vehicles take 4.'));
  }

  /* ══ proportion  a : b = c : d ════════════════════════════════════════ */

  function renderProp(host) {
    var st = A.store.get('ratio.prop', { mode: 'direct', a: '', b: '', c: '', d: '' });
    function save() { A.store.set('ratio.prop', st); }

    host.appendChild(A.UI.chips(
      [{ id: 'direct', label: 'Direct  ↑↑' }, { id: 'inverse', label: 'Inverse  ↑↓' }],
      st.mode,
      function (id) { st.mode = id; save(); A.Router.refresh(); }
    ));

    var card = A.UI.card();
    var fields = {};
    ['a', 'b', 'c', 'd'].forEach(function (k) {
      fields[k] = A.UI.field({ label: k, inputmode: 'decimal', value: st[k], placeholder: '?' });
      fields[k].input.addEventListener('input', calc);
    });

    card.appendChild(A.el('.sec-lab', {
      text: st.mode === 'direct' ? 'a : b  =  c : d' : 'a × b  =  c × d'
    }));
    card.appendChild(A.el('.split', null, [fields.a, fields.b]));
    card.appendChild(A.el('.split', null, [fields.c, fields.d]));

    var out = A.el('div');
    var work = A.el('.note');
    card.appendChild(out);
    card.appendChild(work);
    host.appendChild(card);

    function calc() {
      ['a', 'b', 'c', 'd'].forEach(function (k) { st[k] = fields[k].input.value; });
      save();
      A.clear(out);
      work.textContent = '';

      var v = {}, blanks = [];
      ['a', 'b', 'c', 'd'].forEach(function (k) {
        var n = A.parseNum(st[k]);
        if (isFinite(n)) v[k] = n; else blanks.push(k);
      });

      if (blanks.length !== 1) {
        work.textContent = blanks.length === 0
          ? 'All four values are filled. Clear the one you want solved.'
          : 'Fill three of the four values and leave the unknown one blank.';
        return;
      }

      var k = blanks[0], x, formula;
      if (st.mode === 'direct') {
        /* a/b = c/d  ->  a·d = b·c */
        if (k === 'a') { if (!v.d) return bad('d'); x = v.b * v.c / v.d; formula = 'a = b × c ÷ d'; }
        if (k === 'b') { if (!v.c) return bad('c'); x = v.a * v.d / v.c; formula = 'b = a × d ÷ c'; }
        if (k === 'c') { if (!v.b) return bad('b'); x = v.a * v.d / v.b; formula = 'c = a × d ÷ b'; }
        if (k === 'd') { if (!v.a) return bad('a'); x = v.b * v.c / v.a; formula = 'd = b × c ÷ a'; }
      } else {
        /* a·b = c·d */
        if (k === 'a') { if (!v.b) return bad('b'); x = v.c * v.d / v.b; formula = 'a = c × d ÷ b'; }
        if (k === 'b') { if (!v.a) return bad('a'); x = v.c * v.d / v.a; formula = 'b = c × d ÷ a'; }
        if (k === 'c') { if (!v.d) return bad('d'); x = v.a * v.b / v.d; formula = 'c = a × b ÷ d'; }
        if (k === 'd') { if (!v.c) return bad('c'); x = v.a * v.b / v.c; formula = 'd = a × b ÷ c'; }
      }

      out.appendChild(A.UI.metric(k, A.fmtNum(x, 10), { big: true }));
      work.textContent = formula + '  =  ' + A.fmtNum(x, 10);

      function bad(name) {
        out.appendChild(A.UI.empty(name + ' cannot be zero when solving for ' + k + '.'));
      }
    }

    calc();
  }

  /* ══ scale & ratio ════════════════════════════════════════════════════
     Map/plan scales and n:m ratio splitting, both constant field jobs.    */

  function renderScale(host) {
    var st = A.store.get('ratio.scale', { scale: '25000', real: '', map: '', parts: '2:3:5', total: '' });
    function save() { A.store.set('ratio.scale', st); }

    /* map scale */
    var card = A.UI.card();
    card.appendChild(A.el('.sec-lab', { text: 'Map scale' }));
    var sIn = A.UI.field({ label: 'Scale  1 :', inputmode: 'decimal', value: st.scale, hint: '1:25 000 is the standard topographic sheet; 1:50 000 the standard military map.' });
    var mIn = A.UI.field({ label: 'Distance on the map', inputmode: 'decimal', suffix: 'cm', value: st.map });
    var rIn = A.UI.field({ label: 'Distance on the ground', inputmode: 'decimal', suffix: A.U.sym('dist'), value: st.real });
    var sOut = A.el('div');

    function fromMap() {
      st.scale = sIn.input.value; st.map = mIn.input.value; save();
      var s = A.parseNum(st.scale), m = A.parseNum(st.map);
      if (!isFinite(s) || !isFinite(m) || s <= 0) return;
      var metres = m / 100 * s;
      rIn.input.value = A.fmtNum(A.U.to('dist', metres), 8);
      st.real = rIn.input.value; save();
      showScale(metres);
    }
    function fromReal() {
      st.scale = sIn.input.value; st.real = rIn.input.value; save();
      var s = A.parseNum(st.scale), r = A.parseNum(st.real);
      if (!isFinite(s) || !isFinite(r) || s <= 0) return;
      var metres = A.U.from('dist', r);
      mIn.input.value = A.fmtNum(metres * 100 / s, 8);
      st.map = mIn.input.value; save();
      showScale(metres);
    }
    function showScale(metres) {
      A.clear(sOut);
      sOut.appendChild(A.UI.metric('Ground distance', A.U.fmtRange(metres, { sig: 6 }), { big: true }));
      sOut.appendChild(A.UI.metric('Also', A.fmtNum(metres, 6) + ' m  ·  ' + A.fmtNum(metres / 1852, 6) + ' nmi'));
      sOut.appendChild(A.UI.metric('Walking at 5 km/h', A.fmtDur(metres / 5000)));
      sOut.appendChild(A.UI.metric('On foot, tactical pace 4 km/h', A.fmtDur(metres / 4000)));
    }

    sIn.input.addEventListener('input', fromMap);
    mIn.input.addEventListener('input', fromMap);
    rIn.input.addEventListener('input', fromReal);

    card.appendChild(sIn);
    card.appendChild(A.el('.split', null, [mIn, rIn]));
    card.appendChild(sOut);
    host.appendChild(card);
    if (st.map) fromMap();

    /* ratio split */
    var card2 = A.UI.card();
    card2.appendChild(A.el('.sec-lab', { text: 'Split a total by a ratio' }));
    var pIn = A.UI.field({ label: 'Ratio', value: st.parts, placeholder: '2:3:5', hint: 'Separate the parts with a colon.' });
    var tIn = A.UI.field({ label: 'Total to split', inputmode: 'decimal', value: st.total });
    var pOut = A.el('div');

    function splitCalc() {
      st.parts = pIn.input.value; st.total = tIn.input.value; save();
      A.clear(pOut);
      var parts = String(st.parts).split(/[:\s,]+/).map(A.parseNum).filter(function (n) { return isFinite(n) && n >= 0; });
      var total = A.parseNum(st.total);
      if (parts.length < 2 || !isFinite(total)) return;
      var sum = parts.reduce(function (a, b) { return a + b; }, 0);
      if (sum <= 0) { pOut.appendChild(A.UI.empty('The ratio parts must add up to more than zero.')); return; }
      parts.forEach(function (p, i) {
        pOut.appendChild(A.UI.metric('Part ' + (i + 1) + '  (' + A.fmtNum(p, 6) + ')',
          A.fmtNum(total * p / sum, 8),
          { sub: A.fmtNum(100 * p / sum, 4) + ' %' }));
      });
    }
    pIn.input.addEventListener('input', splitCalc);
    tIn.input.addEventListener('input', splitCalc);

    card2.appendChild(pIn);
    card2.appendChild(tIn);
    card2.appendChild(pOut);
    host.appendChild(card2);
    splitCalc();
  }

  A.Router.register('ratio', { render: render });

})(window);
