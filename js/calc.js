/*
 * Artemidos - expression engine + scientific calculator
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Expr compiles to a closure tree rather than eval(): it is fast enough to
 * plot thousands of points per frame, and it cannot execute anything the
 * grammar does not describe.
 */
(function (global) {
  'use strict';

  /* ══ expression engine ════════════════════════════════════════════════ */

  var CONSTS = {
    pi: Math.PI, PI: Math.PI, 'π': Math.PI,
    e: Math.E, E: Math.E,
    tau: Math.PI * 2,
    phi: (1 + Math.sqrt(5)) / 2,
    inf: Infinity, Infinity: Infinity,
    /* physical constants that keep turning up in the field tools */
    c: 299792458, g: 9.80665
  };

  function gamma(n) {
    /* Lanczos - lets factorial accept non-integers instead of failing */
    if (n < 0.5) return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
    n -= 1;
    var G = 7,
      C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    var x = C[0];
    for (var i = 1; i < G + 2; i++) x += C[i] / (n + i);
    var t = n + G + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
  }

  function fact(n) {
    if (n < 0 && n === Math.floor(n)) return NaN;
    if (n === Math.floor(n) && n <= 170) {
      var r = 1;
      for (var i = 2; i <= n; i++) r *= i;
      return r;
    }
    return gamma(n + 1);
  }

  function nCr(n, r) { return fact(n) / (fact(r) * fact(n - r)); }
  function nPr(n, r) { return fact(n) / fact(n - r); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }

  /* functions taking radians, wrapped per angle mode at compile time */
  var TRIG_IN = { sin: 1, cos: 1, tan: 1, sec: 1, csc: 1, cot: 1 };
  var TRIG_OUT = { asin: 1, acos: 1, atan: 1, asec: 1, acsc: 1, acot: 1, atan2: 1 };

  var FNS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sec: function (x) { return 1 / Math.cos(x); },
    csc: function (x) { return 1 / Math.sin(x); },
    cot: function (x) { return 1 / Math.tan(x); },
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    asec: function (x) { return Math.acos(1 / x); },
    acsc: function (x) { return Math.asin(1 / x); },
    acot: function (x) { return Math.PI / 2 - Math.atan(x); },
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
    ln: Math.log, log: function (x) { return Math.log(x) / Math.LN10; },
    lg: function (x) { return Math.log(x) / Math.LN10; },
    log2: function (x) { return Math.log(x) / Math.LN2; },
    exp: Math.exp, sqrt: Math.sqrt, cbrt: Math.cbrt,
    abs: Math.abs, sign: Math.sign,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    trunc: Math.trunc, fract: function (x) { return x - Math.trunc(x); },
    min: Math.min, max: Math.max, pow: Math.pow, atan2: Math.atan2,
    hypot: Math.hypot, mod: function (a, b) { return ((a % b) + b) % b; },
    fact: fact, nCr: nCr, nPr: nPr, C: nCr, P: nPr, gcd: gcd,
    lcm: function (a, b) { return Math.abs(a * b) / gcd(a, b); },
    root: function (x, n) { return x < 0 && n % 2 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n); },
    deg: function (x) { return x * 180 / Math.PI; },
    rad: function (x) { return x * Math.PI / 180; }
  };

  /* variadic arity: -1 means "any" */
  var ARITY = { min: -1, max: -1, pow: 2, atan2: 2, hypot: -1, mod: 2, nCr: 2, nPr: 2, C: 2, P: 2, gcd: 2, lcm: 2, root: 2 };

  function tokenize(src) {
    var toks = [], i = 0, s = src.replace(/×/g, '*').replace(/÷/g, '/')
      .replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/π/g, 'pi');
    while (i < s.length) {
      var ch = s[i];
      if (ch === ' ' || ch === '\t') { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var m = /^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d*\.?\d+(?:[eE][+-]?\d+)?|\d+\.)/.exec(s.slice(i));
        if (!m) throw new Error('Bad number at ' + i);
        toks.push({ t: 'num', v: Number(m[0]) });
        i += m[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        var w = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i))[0];
        toks.push({ t: 'name', v: w });
        i += w.length;
        continue;
      }
      if ('+-*/^%(),!'.indexOf(ch) >= 0) { toks.push({ t: ch }); i++; continue; }
      throw new Error('Unexpected "' + ch + '"');
    }
    return toks;
  }

  /* Pratt parser -> closure tree. scope is a plain object of variables. */
  function parse(toks, opts) {
    var p = 0, deg = !!(opts && opts.deg), used = {};

    function peek() { return toks[p]; }
    function next() { return toks[p++]; }
    function expect(t) {
      if (!toks[p] || toks[p].t !== t) throw new Error('Expected "' + t + '"');
      return toks[p++];
    }

    function wrapIn(name, f) {
      if (!deg || !TRIG_IN[name]) return f;
      return function (x) { return f(x * Math.PI / 180); };
    }
    function wrapOut(name, f) {
      if (!deg || !TRIG_OUT[name]) return f;
      return function () { return f.apply(null, arguments) * 180 / Math.PI; };
    }

    function primary() {
      var tk = peek();
      if (!tk) throw new Error('Unexpected end of expression');

      if (tk.t === 'num') { next(); var v = tk.v; return function () { return v; }; }

      if (tk.t === '(') {
        next();
        var e = expr(0);
        expect(')');
        return e;
      }

      if (tk.t === '-') { next(); var a = unary(); return function (s) { return -a(s); }; }
      if (tk.t === '+') { next(); return unary(); }

      if (tk.t === 'name') {
        next();
        var nm = tk.v;
        if (peek() && peek().t === '(') {
          var raw = FNS[nm];
          if (!raw) throw new Error('Unknown function "' + nm + '"');
          next();
          var args = [];
          if (peek() && peek().t !== ')') {
            args.push(expr(0));
            while (peek() && peek().t === ',') { next(); args.push(expr(0)); }
          }
          expect(')');
          var want = ARITY[nm] != null ? ARITY[nm] : 1;
          if (want >= 0 && args.length !== want) {
            throw new Error(nm + '() takes ' + want + ' argument' + (want === 1 ? '' : 's'));
          }
          var f = wrapOut(nm, wrapIn(nm, raw));
          return function (s) {
            var vals = new Array(args.length);
            for (var k = 0; k < args.length; k++) vals[k] = args[k](s);
            return f.apply(null, vals);
          };
        }
        if (CONSTS[nm] != null) { var cv = CONSTS[nm]; return function () { return cv; }; }
        used[nm] = 1;
        return function (s) {
          var v2 = s && s[nm];
          return v2 == null ? NaN : v2;
        };
      }

      throw new Error('Unexpected "' + (tk.v != null ? tk.v : tk.t) + '"');
    }

    /* postfix: factorial, percent */
    function postfix() {
      var node = primary();
      for (;;) {
        var tk = peek();
        if (tk && tk.t === '!') { next(); var inner = node; node = function (s) { return fact(inner(s)); }; continue; }
        if (tk && tk.t === '%') { next(); var in2 = node; node = function (s) { return in2(s) / 100; }; continue; }
        break;
      }
      return node;
    }

    function unary() { return power(); }

    /* ^ is right-associative and binds tighter than unary minus on its left */
    function power() {
      var base = postfix();
      if (peek() && peek().t === '^') {
        next();
        var exp2 = (peek() && peek().t === '-')
          ? (next(), (function () { var e = power(); return function (s) { return -e(s); }; })())
          : power();
        return function (s) { return Math.pow(base(s), exp2(s)); };
      }
      return base;
    }

    var BIN = { '+': 1, '-': 1, '*': 2, '/': 2 };

    function expr(minBp) {
      var left = unary();
      for (;;) {
        var tk = peek();
        if (!tk) break;

        /* implicit multiplication: 2x, 3(4+5), 2sin(x), (a)(b) */
        if (tk.t === 'num' || tk.t === 'name' || tk.t === '(') {
          if (2 < minBp) break;
          var r0 = unary();
          var l0 = left;
          left = function (s) { return l0(s) * r0(s); };
          continue;
        }

        var bp = BIN[tk.t];
        if (bp == null || bp < minBp) break;
        next();
        var right = expr(bp + 1);
        var l = left;
        left = (function (op, a, b) {
          if (op === '+') return function (s) { return a(s) + b(s); };
          if (op === '-') return function (s) { return a(s) - b(s); };
          if (op === '*') return function (s) { return a(s) * b(s); };
          return function (s) { return a(s) / b(s); };
        })(tk.t, l, right);
      }
      return left;
    }

    var fn = expr(0);
    if (p < toks.length) throw new Error('Unexpected "' + (toks[p].v != null ? toks[p].v : toks[p].t) + '"');
    return { fn: fn, vars: Object.keys(used) };
  }

  var Expr = {
    /* compile('2x+1', {deg:true}) -> {fn(scope), vars} ; throws on bad input */
    compile: function (src, opts) {
      if (!String(src || '').trim()) throw new Error('Empty expression');
      return parse(tokenize(String(src)), opts);
    },
    eval: function (src, scope, opts) {
      return Expr.compile(src, opts).fn(scope || {});
    },
    fns: Object.keys(FNS),
    fact: fact
  };

  global.Expr = Expr;

  /* ══ maths section tabs ═══════════════════════════════════════════════
     The maths tools were scattered across the home grid and the bottom bar.
     They are one section now: the calculator is the landing page and these
     tabs move between the rest. Defined here because calc.js loads first of
     the maths modules; every one of them renders this same row so the user
     can move sideways without going back to a menu. */

  /* Short labels and a wrapping row: eight tabs must all be visible without
     scrolling sideways, because a tab you cannot see is a tab you will not
     find. */
  var MATH_TABS = [
    { id: 'calc',        label: 'Calc' },
    { id: 'ratio/three', label: 'Rule of 3' },
    { id: 'ratio/prop',  label: 'Proportion' },

    { id: 'ratio/scale', label: 'Scale' },
    { id: 'solver',      label: 'Solver' },
    { id: 'graph',       label: 'Graph' },
    { id: 'stats',       label: 'Stats' },
    { id: 'shadow',      label: 'Shadow' }
  ];

  A.mathTabs = function (activeId) {
    /* In safe mode the calculator is one of only two tools, and this chip row
       would offer six more that are not reachable. A chip that bounces you
       back is worse than no chip: it says something is being withheld. */
    var L = window.ArtLock;
    if (L && L.isLimited()) return document.createDocumentFragment();
    var row = A.UI.chips(MATH_TABS, activeId, function (id) {
      if (id !== activeId) A.Router.go(id);
    });
    row.classList.add('wrap');
    return row;
  };

  A.MATH_ROUTES = ['calc', 'ratio', 'solver', 'graph', 'stats', 'shadow'];

  /* ══ calculator view ══════════════════════════════════════════════════ */

  var HIST_KEY = 'calc.history';

  function renderCalc(host) {
    var st = {
      expr: A.store.get('calc.expr', ''),
      deg: A.store.get('calc.deg', true),
      inv: false,
      hyp: false
    };

    var exprEl = A.el('.calc-expr');
    var valEl = A.el('.calc-val', { text: '0' });
    var out = A.el('.calc-out', null, [exprEl, valEl]);

    var fnKeys = A.el('.keys.fn');
    var padKeys = A.el('.keys');
    var modeRow = A.el('.btn-row');

    function evaluate(quiet) {
      exprEl.textContent = st.expr;
      if (!st.expr.trim()) { valEl.textContent = '0'; valEl.classList.remove('err'); return null; }
      try {
        var v = Expr.eval(st.expr, {}, { deg: st.deg });
        if (v == null || (typeof v === 'number' && isNaN(v))) throw new Error('Undefined result');
        valEl.textContent = A.fmtNum(v, 12);
        valEl.classList.remove('err');
        return v;
      } catch (e) {
        if (!quiet) { valEl.textContent = e.message; valEl.classList.add('err'); }
        else { valEl.textContent = '…'; valEl.classList.remove('err'); }
        return null;
      }
    }

    function push(s) {
      st.expr += s;
      A.store.set('calc.expr', st.expr);
      A.haptic();
      evaluate(true);
    }

    function commit() {
      var v = evaluate(false);
      if (v == null) return;
      var h = A.store.get(HIST_KEY, []);
      h.unshift({ e: st.expr, v: A.fmtNum(v, 12), t: Date.now() });
      A.store.set(HIST_KEY, h.slice(0, 80));
      st.expr = String(v);
      A.store.set('calc.expr', st.expr);
      exprEl.textContent = '';
      A.haptic(16);
      paintTape();
    }

    /* ══ THE TAPE ══════════════════════════════════════════════════════════
       Every sum you have finished, stacked above the one you are working on,
       newest at the bottom so it reads like a conversation and the live line
       is always where the eye already is.

       This is the thing a desk calculator has and a phone calculator usually
       does not: the ability to look up and check the figure you entered two
       steps ago without losing the one in front of you. Tapping a line puts
       its RESULT into the current expression, which is what you nearly always
       want it for. */
    function paintTape() {
      A.clear(tape);
      var h = A.store.get(HIST_KEY, []);
      if (!h.length) return;
      /* oldest first, so the newest sits nearest the live line */
      h.slice(0, 12).reverse().forEach(function (row) {
        var line = A.el('button.calc-tape-row', {
          onclick: function () {
            /* a result is worth reusing; the expression that made it is not */
            push(String(row.v).replace(/[^0-9.eE+\-]/g, ''));
            A.haptic(8);
          }
        });
        line.appendChild(A.el('span.calc-tape-e', { text: row.e }));
        line.appendChild(A.el('span.calc-tape-v', { text: row.v }));
        tape.appendChild(line);
      });
      /* keep the newest in view: the tape grows upward out of sight otherwise */
      tape.scrollTop = tape.scrollHeight;
    }

    function key(label, cls, action) {
      return A.el('button.key' + (cls ? '.' + cls : ''), {
        text: typeof label === 'string' ? label : null,
        html: typeof label === 'object' ? label.html : null,
        onclick: action
      });
    }

    function paintFnKeys() {
      A.clear(fnKeys);
      var trig = st.hyp
        ? (st.inv ? ['asinh', 'acosh', 'atanh'] : ['sinh', 'cosh', 'tanh'])
        : (st.inv ? ['asin', 'acos', 'atan'] : ['sin', 'cos', 'tan']);
      trig.forEach(function (f) { fnKeys.appendChild(key(f, null, function () { push(f + '('); })); });

      if (st.inv) {
        fnKeys.appendChild(key('eˣ', null, function () { push('exp('); }));
        fnKeys.appendChild(key('10ˣ', null, function () { push('10^('); }));
        fnKeys.appendChild(key('x²', null, function () { push('^2'); }));
        fnKeys.appendChild(key('π', null, function () { push('pi'); }));
        fnKeys.appendChild(key('e', null, function () { push('e'); }));
        fnKeys.appendChild(key('∛', null, function () { push('cbrt('); }));
        fnKeys.appendChild(key('1/x', null, function () { push('^(-1)'); }));
        fnKeys.appendChild(key('nCr', null, function () { push('nCr('); }));
        fnKeys.appendChild(key('nPr', null, function () { push('nPr('); }));
      } else {
        fnKeys.appendChild(key('ln', null, function () { push('ln('); }));
        fnKeys.appendChild(key('log', null, function () { push('log('); }));
        fnKeys.appendChild(key('√', null, function () { push('sqrt('); }));
        fnKeys.appendChild(key('π', null, function () { push('pi'); }));
        fnKeys.appendChild(key('e', null, function () { push('e'); }));
        fnKeys.appendChild(key('^', null, function () { push('^'); }));
        fnKeys.appendChild(key('!', null, function () { push('!'); }));
        fnKeys.appendChild(key('%', null, function () { push('%'); }));
        fnKeys.appendChild(key('|x|', null, function () { push('abs('); }));
      }
    }

    function paintMode() {
      A.clear(modeRow);
      [
        { l: st.deg ? 'DEG' : 'RAD', on: false, f: function () { st.deg = !st.deg; A.store.set('calc.deg', st.deg); paintMode(); evaluate(true); } },
        { l: 'INV', on: st.inv, f: function () { st.inv = !st.inv; paintMode(); paintFnKeys(); } },
        { l: 'HYP', on: st.hyp, f: function () { st.hyp = !st.hyp; paintMode(); paintFnKeys(); } }
      ].forEach(function (m) {
        modeRow.appendChild(A.el('button.btn.ghost' + (m.on ? '.on' : ''), {
          text: m.l,
          style: m.on ? { background: 'var(--acc)', color: 'var(--bg)', borderColor: 'var(--acc)' } : {},
          onclick: function () { A.haptic(); m.f(); }
        }));
      });
    }

    function paintPad() {
      A.clear(padKeys);
      var rows = [
        /* C wipes the tape as well as the line. The tape is what the previous
           job left behind, and starting a new one with the last one still on
           screen is worse than losing it. Note this empties the History page
           too - both read the same store, and there is no second copy. */
        [['C', 'clr', function () {
          st.expr = ''; A.store.set('calc.expr', '');
          exprEl.textContent = ''; valEl.textContent = '0'; valEl.classList.remove('err');
          A.store.set(HIST_KEY, []);
          paintTape();
          A.haptic(14);
        }],
         ['(', 'op', function () { push('('); }],
         [')', 'op', function () { push(')'); }],
         [{ html: Icons.svg('back') }, 'op', function () { st.expr = st.expr.slice(0, -1); A.store.set('calc.expr', st.expr); A.haptic(); evaluate(true); }]],
        [['7', null, function () { push('7'); }], ['8', null, function () { push('8'); }], ['9', null, function () { push('9'); }], ['÷', 'op', function () { push('/'); }]],
        [['4', null, function () { push('4'); }], ['5', null, function () { push('5'); }], ['6', null, function () { push('6'); }], ['×', 'op', function () { push('*'); }]],
        [['1', null, function () { push('1'); }], ['2', null, function () { push('2'); }], ['3', null, function () { push('3'); }], ['−', 'op', function () { push('-'); }]],
        [['+/−', null, function () {
          /* negate the trailing number rather than blindly prefixing a minus */
          var m = /(-?\d*\.?\d+)$/.exec(st.expr);
          if (m) st.expr = st.expr.slice(0, m.index) + (m[1][0] === '-' ? m[1].slice(1) : '-' + m[1]);
          else st.expr += '-';
          A.store.set('calc.expr', st.expr);
          A.haptic(); evaluate(true);
        }],
         ['0', null, function () { push('0'); }], ['.', null, function () { push('.'); }], ['+', 'op', function () { push('+'); }]]
      ];
      rows.forEach(function (r) { r.forEach(function (k) { padKeys.appendChild(key(k[0], k[1], k[2])); }); });
      var eq = key('=', 'eq', commit);
      eq.style.gridColumn = '1 / -1';
      padKeys.appendChild(eq);
    }

    A.setTitle('Calculator', {
      back: true,
      actions: (window.ArtLock && window.ArtLock.isLimited()) ? [] :
        [{ icon: 'history', label: 'History', onclick: function () { A.Router.go('calc/history'); } }]
    });

    /* One flex column sized to the space between the bars. The display is the
       part that flexes, so the keypad never leaves the screen: a calculator
       that scrolls to reach "=" is broken as an instrument. On short screens
       the keys compress instead (see .calc-screen media rules). */
    var tape = A.el('.calc-tape');

    var screen = A.el('.calc-screen');
    screen.appendChild(A.mathTabs('calc'));
    screen.appendChild(tape);
    screen.appendChild(out);
    screen.appendChild(fnKeys);
    screen.appendChild(modeRow);
    screen.appendChild(padKeys);
    host.appendChild(screen);

    paintFnKeys();
    paintMode();
    paintPad();
    paintTape();
    evaluate(true);

    /* hardware keyboard, for desktop and Bluetooth keyboards in the field */
    var onKey = function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      var k = ev.key;
      if (/^[0-9.+\-*/^()!%]$/.test(k)) { push(k); ev.preventDefault(); }
      else if (k === 'Enter' || k === '=') { commit(); ev.preventDefault(); }
      else if (k === 'Backspace') { st.expr = st.expr.slice(0, -1); A.store.set('calc.expr', st.expr); evaluate(true); ev.preventDefault(); }
      else if (k === 'Escape') { st.expr = ''; A.store.set('calc.expr', ''); exprEl.textContent = ''; valEl.textContent = '0'; ev.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    renderCalc._off = function () { window.removeEventListener('keydown', onKey); };
  }

  function renderHistory(host) {
    A.setTitle('History', {
      back: true,
      actions: [{ icon: 'trash', label: 'Clear history', onclick: function () {
        A.store.set(HIST_KEY, []);
        A.Router.refresh();
        A.toast('History cleared');
      } }]
    });
    var h = A.store.get(HIST_KEY, []);
    if (!h.length) { host.appendChild(A.UI.empty('Nothing calculated yet.')); return; }
    var card = A.UI.card();
    h.forEach(function (r) {
      var row = A.el('.hist-row', {
        style: { cursor: 'pointer' },
        onclick: function () {
          A.store.set('calc.expr', r.e);
          A.haptic();
          A.Router.go('calc');
        }
      }, [A.el('.hist-e', { text: r.e }), A.el('.hist-v', { text: r.v })]);
      card.appendChild(row);
    });
    host.appendChild(card);
    host.appendChild(A.UI.note('Tap any entry to load the expression back into the calculator.'));
  }

  A.Router.register('calc', {
    render: function (host, r) {
      if (r.path[0] === 'history') renderHistory(host);
      else renderCalc(host);
    },
    teardown: function () { if (renderCalc._off) { renderCalc._off(); renderCalc._off = null; } }
  });

})(window);
