/*
 * Artemidos - equation solver
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var MODES = [
    { id: 'linear', label: 'Linear' },
    { id: 'quad', label: 'Quadratic' },
    { id: 'cubic', label: 'Cubic' },
    { id: 'system', label: 'System' },
    { id: 'root', label: 'Solve f(x)' }
  ];

  function cplx(re, im) {
    if (Math.abs(im) < 1e-12) return A.fmtNum(re, 8);
    return A.fmtNum(re, 8) + (im < 0 ? ' − ' : ' + ') + A.fmtNum(Math.abs(im), 8) + 'i';
  }

  /* ── cubic: depressed form + trigonometric / Cardano solution ── */
  function solveCubic(a, b, c, d) {
    if (Math.abs(a) < 1e-14) return solveQuad(b, c, d);
    b /= a; c /= a; d /= a;
    var p = c - b * b / 3;
    var q = 2 * b * b * b / 27 - b * c / 3 + d;
    var shift = -b / 3;
    var disc = q * q / 4 + p * p * p / 27;
    var roots = [];

    if (Math.abs(p) < 1e-14 && Math.abs(q) < 1e-14) {
      roots = [[shift, 0], [shift, 0], [shift, 0]];
    } else if (disc > 1e-14) {
      /* one real, two complex conjugates */
      var sq = Math.sqrt(disc);
      var u = Math.cbrt(-q / 2 + sq);
      var v = Math.cbrt(-q / 2 - sq);
      var r1 = u + v;
      var re = -(u + v) / 2, im = (u - v) * Math.sqrt(3) / 2;
      roots = [[r1 + shift, 0], [re + shift, im], [re + shift, -im]];
    } else {
      /* three real roots */
      var r = Math.sqrt(-p * p * p / 27);
      var phi = Math.acos(A.clamp(-q / (2 * r), -1, 1));
      var m = 2 * Math.sqrt(-p / 3);
      roots = [0, 1, 2].map(function (k) {
        return [m * Math.cos((phi + 2 * Math.PI * k) / 3) + shift, 0];
      });
    }
    return { kind: 'roots', roots: roots, disc: disc };
  }

  function solveQuad(a, b, c) {
    if (Math.abs(a) < 1e-14) return solveLinear(b, c);
    var disc = b * b - 4 * a * c;
    if (disc >= 0) {
      var s = Math.sqrt(disc);
      /* the numerically stable pair - avoids cancellation when b dominates */
      var q = -0.5 * (b + Math.sign(b || 1) * s);
      var r1 = q / a, r2 = Math.abs(q) > 1e-300 ? c / q : -b / a - r1;
      return { kind: 'roots', roots: [[Math.min(r1, r2), 0], [Math.max(r1, r2), 0]], disc: disc };
    }
    var re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
    return { kind: 'roots', roots: [[re, im], [re, -im]], disc: disc };
  }

  function solveLinear(a, b) {
    if (Math.abs(a) < 1e-14) {
      return Math.abs(b) < 1e-14
        ? { kind: 'infinite' }
        : { kind: 'none' };
    }
    return { kind: 'roots', roots: [[-b / a, 0]] };
  }

  /* ── linear systems by Gaussian elimination with partial pivoting ── */
  function solveSystem(M, n) {
    var m = M.map(function (r) { return r.slice(); });
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (var r2 = col + 1; r2 < n; r2++) if (Math.abs(m[r2][col]) > Math.abs(m[piv][col])) piv = r2;
      if (Math.abs(m[piv][col]) < 1e-12) return { kind: 'singular' };
      var t = m[col]; m[col] = m[piv]; m[piv] = t;
      for (var r3 = col + 1; r3 < n; r3++) {
        var f = m[r3][col] / m[col][col];
        for (var c2 = col; c2 <= n; c2++) m[r3][c2] -= f * m[col][c2];
      }
    }
    var x = new Array(n);
    for (var i = n - 1; i >= 0; i--) {
      var s = m[i][n];
      for (var j = i + 1; j < n; j++) s -= m[i][j] * x[j];
      x[i] = s / m[i][i];
    }
    return { kind: 'vector', x: x };
  }

  /* ── f(x)=0 : scan the window for sign changes, then bisect + Newton ── */
  function findRoots(fn, lo, hi, want) {
    var roots = [], steps = 2000, prevX = lo, prevY;
    try { prevY = fn({ x: lo }); } catch (e) { prevY = NaN; }

    function refine(a, b) {
      var fa, fb;
      try { fa = fn({ x: a }); fb = fn({ x: b }); } catch (e) { return null; }
      if (!isFinite(fa) || !isFinite(fb)) return null;
      for (var k = 0; k < 200; k++) {
        var mid = (a + b) / 2, fm;
        try { fm = fn({ x: mid }); } catch (e) { return null; }
        if (!isFinite(fm)) return null;
        if (Math.abs(fm) < 1e-13 || (b - a) < 1e-14 * Math.max(1, Math.abs(mid))) return mid;
        if ((fa < 0) === (fm < 0)) { a = mid; fa = fm; } else { b = mid; fb = fm; }
      }
      return (a + b) / 2;
    }

    for (var i = 1; i <= steps; i++) {
      var x = lo + (hi - lo) * i / steps, y;
      try { y = fn({ x: x }); } catch (e) { y = NaN; }
      if (isFinite(prevY) && isFinite(y)) {
        if (prevY === 0) roots.push(prevX);
        else if ((prevY < 0) !== (y < 0)) {
          /* a sign flip across a pole is not a root - check the value settles */
          var r = refine(prevX, x);
          if (r != null) {
            var fv;
            try { fv = fn({ x: r }); } catch (e) { fv = NaN; }
            if (isFinite(fv) && Math.abs(fv) < 1e-6 * Math.max(1, Math.abs(r))) roots.push(r);
          }
        }
      }
      prevX = x; prevY = y;
      if (roots.length >= (want || 12)) break;
    }
    /* de-duplicate roots that the scan found twice */
    return roots.filter(function (r, i2, arr) {
      return arr.findIndex(function (o) { return Math.abs(o - r) < 1e-7 * Math.max(1, Math.abs(r)); }) === i2;
    });
  }

  /* ══ view ═════════════════════════════════════════════════════════════ */

  function render(host, params) {
    var mode = params.query.tab || A.store.get('solver.mode', 'quad');
    if (!MODES.some(function (m) { return m.id === mode; })) mode = 'quad';
    A.store.set('solver.mode', mode);

    A.setTitle('Equation solver');

    host.appendChild(A.mathTabs('solver'));
    host.appendChild(A.UI.chips(MODES, mode, function (id) {
      A.Router.go('solver?tab=' + id);
    }));

    var body = A.el('div');
    host.appendChild(body);

    var res = A.el('div');

    function show(node) { A.clear(res); res.appendChild(node); }

    function showResult(r, labels) {
      var card = A.UI.card();
      if (r.kind === 'none') { card.appendChild(A.UI.empty('No solution.')); }
      else if (r.kind === 'infinite') { card.appendChild(A.UI.empty('Infinitely many solutions - the equation is an identity.')); }
      else if (r.kind === 'singular') { card.appendChild(A.UI.empty('The system is singular: no unique solution (the equations are dependent or inconsistent).')); }
      else if (r.kind === 'vector') {
        r.x.forEach(function (v, i) { card.appendChild(A.UI.metric(labels[i], A.fmtNum(v, 10), { big: true })); });
      } else if (r.kind === 'roots') {
        r.roots.forEach(function (rt, i) {
          card.appendChild(A.UI.metric('x' + (r.roots.length > 1 ? String.fromCharCode(8321 + i) : ''), cplx(rt[0], rt[1]), { big: true }));
        });
        if (r.disc != null) {
          card.appendChild(A.UI.metric('Discriminant', A.fmtNum(r.disc, 8)));
          var note = r.disc > 0 ? 'Distinct real roots.' : r.disc < 0 ? 'Complex conjugate roots.' : 'Repeated root.';
          card.appendChild(A.UI.note(note));
        }
      }
      show(card);
    }

    function numFields(defs, onSolve) {
      var card = A.UI.card();
      var inputs = {};
      var row = null;
      defs.forEach(function (d, i) {
        if (i % (defs.length > 3 ? 3 : defs.length) === 0) {
          row = A.el('.split');
          card.appendChild(row);
        }
        var f = A.UI.field({ label: d.label, inputmode: 'decimal', placeholder: d.ph || '' });
        f.style.marginBottom = '10px';
        inputs[d.key] = f.input;
        row.appendChild(f);
      });
      card.appendChild(A.el('button.btn.block', {
        text: 'Solve',
        onclick: function () {
          A.haptic(14);
          var vals = {}, bad = false;
          Object.keys(inputs).forEach(function (k) {
            var v = A.parseNum(inputs[k].value);
            if (!isFinite(v)) { if (inputs[k].value.trim() === '') v = 0; else bad = true; }
            vals[k] = v;
          });
          if (bad) { show(A.UI.empty('Every coefficient must be a number.')); return; }
          onSolve(vals);
        }
      }));
      return card;
    }

    if (mode === 'linear') {
      body.appendChild(A.el('.sec-lab', { text: 'ax + b = 0' }));
      body.appendChild(numFields([{ key: 'a', label: 'a' }, { key: 'b', label: 'b' }], function (v) {
        showResult(solveLinear(v.a, v.b));
      }));
    }

    if (mode === 'quad') {
      body.appendChild(A.el('.sec-lab', { text: 'ax² + bx + c = 0' }));
      body.appendChild(numFields([{ key: 'a', label: 'a' }, { key: 'b', label: 'b' }, { key: 'c', label: 'c' }], function (v) {
        showResult(solveQuad(v.a, v.b, v.c));
      }));
    }

    if (mode === 'cubic') {
      body.appendChild(A.el('.sec-lab', { text: 'ax³ + bx² + cx + d = 0' }));
      body.appendChild(numFields([{ key: 'a', label: 'a' }, { key: 'b', label: 'b' }, { key: 'c', label: 'c' }, { key: 'd', label: 'd' }], function (v) {
        showResult(solveCubic(v.a, v.b, v.c, v.d));
      }));
    }

    if (mode === 'system') {
      var size = A.store.get('solver.size', 2);
      var sizeRow = A.UI.chips([{ id: 2, label: '2 × 2' }, { id: 3, label: '3 × 3' }], size, function (id) {
        A.store.set('solver.size', id);
        A.Router.refresh();
      });
      body.appendChild(sizeRow);
      body.appendChild(A.el('.sec-lab', { text: size === 2 ? 'a₁x + b₁y = c₁   ·   a₂x + b₂y = c₂' : 'Three equations in x, y, z' }));

      var card = A.UI.card();
      var cells = [];
      var vars = size === 2 ? ['x', 'y'] : ['x', 'y', 'z'];
      for (var r = 0; r < size; r++) {
        var rowEl = A.el('.split');
        cells[r] = [];
        for (var c = 0; c <= size; c++) {
          var lab = c === size ? '=' : (String.fromCharCode(97 + c) + String.fromCharCode(8321 + r));
          var f = A.UI.field({ label: lab, inputmode: 'decimal' });
          f.style.marginBottom = '8px';
          cells[r][c] = f.input;
          rowEl.appendChild(f);
        }
        card.appendChild(rowEl);
      }
      card.appendChild(A.el('button.btn.block', {
        text: 'Solve',
        onclick: function () {
          A.haptic(14);
          var M = cells.map(function (rr) {
            return rr.map(function (inp) {
              var v = A.parseNum(inp.value);
              return isFinite(v) ? v : 0;
            });
          });
          showResult(solveSystem(M, size), vars);
        }
      }));
      body.appendChild(card);
    }

    if (mode === 'root') {
      body.appendChild(A.el('.sec-lab', { text: 'Solve f(x) = 0' }));
      var rcard = A.UI.card();
      var fIn = A.UI.field({ label: 'f(x)', placeholder: 'e.g. x^3 - 2x - 5', value: A.store.get('solver.fx', '') });
      var loIn = A.UI.field({ label: 'Search from', inputmode: 'decimal', value: A.store.get('solver.lo', '-50') });
      var hiIn = A.UI.field({ label: 'Search to', inputmode: 'decimal', value: A.store.get('solver.hi', '50') });
      var rangeRow = A.el('.split', null, [loIn, hiIn]);
      rcard.appendChild(fIn);
      rcard.appendChild(rangeRow);
      rcard.appendChild(A.el('button.btn.block', {
        text: 'Solve',
        onclick: function () {
          A.haptic(14);
          A.store.set('solver.fx', fIn.input.value);
          A.store.set('solver.lo', loIn.input.value);
          A.store.set('solver.hi', hiIn.input.value);
          var lo = A.parseNum(loIn.input.value), hi = A.parseNum(hiIn.input.value);
          if (!isFinite(lo) || !isFinite(hi) || hi <= lo) { show(A.UI.empty('The search range must be two numbers with "to" greater than "from".')); return; }
          var c;
          try { c = Expr.compile(fIn.input.value, { deg: false }); }
          catch (e) { show(A.UI.empty('Cannot read that expression: ' + e.message)); return; }
          var roots = findRoots(c.fn, lo, hi);
          if (!roots.length) {
            show(A.UI.empty('No sign change found between ' + A.fmtNum(lo, 4) + ' and ' + A.fmtNum(hi, 4) +
              '. Widen the range, or the function may only touch zero without crossing it.'));
            return;
          }
          var card2 = A.UI.card();
          roots.forEach(function (r2, i) {
            card2.appendChild(A.UI.metric('Root ' + (i + 1), A.fmtNum(r2, 10), { big: true, sub: 'f(x) = ' + A.fmtNum(c.fn({ x: r2 }), 4) }));
          });
          card2.appendChild(A.UI.note('Found by scanning the range for sign changes and bisecting each one. Roots that touch zero without crossing (a repeated root) will not appear.'));
          show(card2);
        }
      }));
      body.appendChild(rcard);
    }

    host.appendChild(res);
  }

  A.Router.register('solver', { render: render });

  global.ArtSolve = { quad: solveQuad, cubic: solveCubic, system: solveSystem, roots: findRoots };

})(window);
