/*
 * Artemidos - unit conversion engine + converter view
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var CATS = global.ARTEMIDOS_UNITS;
  var GROUPS = global.ARTEMIDOS_UNIT_GROUPS;

  /* ══ engine ═══════════════════════════════════════════════════════════ */

  var normCache = {};

  /* [code, name, factor|{to,from}] -> {c, n, f} | {c, n, to, from} */
  function norm(catId) {
    if (normCache[catId]) return normCache[catId];
    var cat = CATS[catId];
    if (!cat) return null;
    var out = {
      id: catId, name: cat.name, icon: cat.icon, group: cat.group,
      base: cat.base, type: cat.type || 'linear', bases: cat.bases,
      units: (cat.units || []).map(function (r) {
        var u = { c: r[0], n: r[1] };
        if (typeof r[2] === 'object') { u.to = r[2].to; u.from = r[2].from; }
        else u.f = r[2];
        return u;
      })
    };
    out.byCode = {};
    out.units.forEach(function (u) { out.byCode[u.c] = u; });
    normCache[catId] = out;
    return out;
  }

  function unitOf(catId, code) {
    var c = norm(catId);
    return c ? c.byCode[code] : null;
  }

  var Units = {
    cats: function () { return Object.keys(CATS); },
    get: norm,
    unit: unitOf,

    toSI: function (catId, v, code) {
      var u = unitOf(catId, code);
      if (!u || !isFinite(v)) return NaN;
      return u.to ? u.to(v) : v * u.f;
    },

    fromSI: function (catId, si, code) {
      var u = unitOf(catId, code);
      if (!u || !isFinite(si)) return NaN;
      return u.from ? u.from(si) : si / u.f;
    },

    convert: function (catId, v, fromCode, toCode) {
      return Units.fromSI(catId, Units.toSI(catId, v, fromCode), toCode);
    },

    /* every unit in the category, converted at once - drives the live list */
    all: function (catId, v, fromCode) {
      var c = norm(catId);
      if (!c) return [];
      var si = Units.toSI(catId, v, fromCode);
      return c.units.map(function (u) {
        return { code: u.c, name: u.n, value: Units.fromSI(catId, si, u.c) };
      });
    }
  };

  global.Units = Units;

  /* ══ number bases ═════════════════════════════════════════════════════ */

  var Bases = {
    parse: function (str, radix) {
      if (!(radix >= 2 && radix <= 36)) return NaN;
      var s = String(str).trim().replace(/\s+/g, '');
      if (!s) return NaN;
      var neg = s[0] === '-';
      if (neg) s = s.slice(1);
      /* reject digits the radix cannot hold, which parseInt would silently truncate */
      var valid = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, radix);
      var frac = s.split('.');
      if (frac.length > 2) return NaN;
      for (var i = 0; i < frac.join('').length; i++) {
        if (valid.indexOf(frac.join('')[i].toLowerCase()) < 0) return NaN;
      }
      var n = parseInt(frac[0] || '0', radix);
      if (!isFinite(n)) return NaN;
      if (frac[1]) {
        for (var j = 0; j < frac[1].length; j++) {
          n += parseInt(frac[1][j], radix) / Math.pow(radix, j + 1);
        }
      }
      return neg ? -n : n;
    },

    render: function (n, radix) {
      if (!isFinite(n) || !(radix >= 2 && radix <= 36)) return '-';
      var neg = n < 0;
      n = Math.abs(n);
      var i = Math.floor(n), f = n - i;
      var out = i.toString(radix).toUpperCase();
      if (f > 1e-12) {
        out += '.';
        for (var k = 0; k < 12 && f > 1e-12; k++) {
          f *= radix;
          var d = Math.floor(f);
          out += d.toString(radix).toUpperCase();
          f -= d;
        }
      }
      return (neg ? '-' : '') + out;
    }
  };

  /* ══ currency ═════════════════════════════════════════════════════════
     ECB reference rates via frankfurter.app - no key, CORS-open. Cached so
     the app still converts offline; the card always states the rate age
     because a stale rate quietly used for settlement is worse than none.  */

  var FX = {
    KEY: 'fx.cache',
    MAXAGE: 12 * 3600 * 1000,
    /* api.frankfurter.app 301-redirects here, and the redirect response
       carries no Access-Control-Allow-Origin, so following it from a browser
       fails the CORS check with an opaque "Failed to fetch". Call the current
       host directly. */
    URL: 'https://api.frankfurter.dev/v1/latest?base=EUR',

    cached: function () { return A.store.get(FX.KEY, null); },

    /* returns a promise of {base:'EUR', rates:{}, date, fetched} or null */
    load: function (force) {
      var c = FX.cached();
      /* fully-offline mode: never touch the network, use the last-known rates */
      if (A.store.get('offline', false)) return Promise.resolve(c);
      if (!force && c && (Date.now() - c.fetched) < FX.MAXAGE) return Promise.resolve(c);
      if (!navigator.onLine) return Promise.resolve(c);
      return fetch(FX.URL)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
        .then(function (j) {
          var pack = { base: 'EUR', rates: Object.assign({ EUR: 1 }, j.rates), date: j.date, fetched: Date.now() };
          A.store.set(FX.KEY, pack);
          return pack;
        })
        .catch(function () { return c; });
    },

    convert: function (pack, v, from, to) {
      if (!pack || !pack.rates[from] || !pack.rates[to]) return NaN;
      return v / pack.rates[from] * pack.rates[to];
    },

    age: function (pack) {
      if (!pack) return '';
      var h = (Date.now() - pack.fetched) / 3600000;
      if (h < 1) return 'updated ' + Math.max(1, Math.round(h * 60)) + ' min ago';
      if (h < 48) return 'updated ' + Math.round(h) + ' h ago';
      return 'updated ' + Math.round(h / 24) + ' days ago';
    }
  };

  /* ══ view: category picker ════════════════════════════════════════════ */

  var QUICK = ['length', 'mass', 'temperature', 'volume', 'area', 'velocity', 'time', 'pressure', 'energy', 'power'];

  function renderPicker(host) {
    A.setTitle('Converter', { back: true });

    var listHost = A.el('#uxList');

    function paint(q) {
      A.clear(listHost);
      q = (q || '').toLowerCase();

      if (!q) {
        listHost.appendChild(A.UI.section('Frequently used'));
        var grid = A.el('.tiles');
        QUICK.forEach(function (id) {
          var c = norm(id);
          if (!c) return;
          grid.appendChild(A.el('button.tile', {
            onclick: function () { A.Router.go('convert/' + id); }
          }, [
            A.el('.tile-ic', { html: Icons.svg(c.icon || 'convert') }),
            A.el('.tile-t', { text: A.tr(c.name) })
          ]));
        });
        listHost.appendChild(grid);
      }

      GROUPS.forEach(function (g) {
        var ids = Object.keys(CATS).filter(function (id) {
          var c = norm(id);
          if (c.group !== g.id) return false;
          if (!q) return true;
          if (c.name.toLowerCase().indexOf(q) >= 0) return true;
          return (c.units || []).some(function (u) {
            return u.c.toLowerCase().indexOf(q) >= 0 || u.n.toLowerCase().indexOf(q) >= 0;
          });
        });
        if (!ids.length) return;
        listHost.appendChild(A.UI.section(g.name));
        ids.forEach(function (id) {
          var c = norm(id);
          var sample = c.type === 'base' ? c.bases.slice(0, 3).map(function (b) { return b[1]; }).join(', ')
            : c.type === 'fx' ? 'USD, EUR, GBP, AED …'
            : c.units.slice(0, 3).map(function (u) { return A.tr(u.n); }).join(', ') + ' …';
          listHost.appendChild(A.UI.row({
            icon: c.icon || 'convert',
            title: c.name,
            sub: sample,
            onclick: function () { A.Router.go('convert/' + id); }
          }));
        });
      });

      if (!listHost.children.length) listHost.appendChild(A.UI.empty('No category or unit matches that.'));
    }

    host.appendChild(A.UI.search('Search categories or units…', paint));
    host.appendChild(listHost);
    paint('');
  }

  /* ══ view: converter ══════════════════════════════════════════════════ */

  function renderConverter(host, catId) {
    var c = norm(catId);
    if (!c) { A.Router.go('convert'); return; }

    A.setTitle(c.name, { back: true });

    if (c.type === 'base') return renderBaseConv(host, c);
    if (c.type === 'fx') return renderFx(host, c);

    var mem = A.store.get('conv.' + catId, {});
    var state = {
      amt: mem.amt != null ? mem.amt : '1',
      from: c.byCode[mem.from] ? mem.from : c.units[0].c,
      to: c.byCode[mem.to] ? mem.to : (c.units[1] || c.units[0]).c
    };

    var card = A.UI.card();
    var listHost = A.el('#convAll');

    /* The unit NAME is translated HERE, before it is joined to the code.
       A.UI.select runs tr() over the finished label, and the finished label
       is "Ounce  (oz)", which is not a catalogue entry and never will be.
       Translating the name first is the only thing that works, and the same
       applies everywhere else a unit name is concatenated. */
    function opts(sel) {
      return c.units.map(function (u) { return { value: u.c, label: A.tr(u.n) + '  (' + u.c + ')' }; });
    }

    var fromSel, toSel, amtIn, outVal, eqLine;

    function recalc() {
      A.store.set('conv.' + catId, { amt: state.amt, from: state.from, to: state.to });
      var v = A.parseNum(state.amt);
      if (!isFinite(v)) {
        outVal.textContent = '-';
        eqLine.textContent = '';
        A.clear(listHost);
        return;
      }
      var r = Units.convert(catId, v, state.from, state.to);
      outVal.textContent = A.fmtNum(r, 10);

      /* the one-unit equivalence, which is what people actually memorise */
      var one = Units.convert(catId, 1, state.from, state.to);
      eqLine.textContent = '1 ' + state.from + ' = ' + A.fmtNum(one, 8) + ' ' + state.to;

      A.clear(listHost);
      listHost.appendChild(A.UI.section('All units'));
      var box = A.UI.card(null, 'tight');
      Units.all(catId, v, state.from).forEach(function (row) {
        if (row.code === state.from) return;
        var m = A.UI.metric(A.tr(row.name) + '  ·  ' + row.code, A.fmtNum(row.value, 10));
        m.style.cursor = 'pointer';
        m.addEventListener('click', function () {
          state.to = row.code;
          toSel.input.value = row.code;
          A.haptic();
          recalc();
        });
        box.appendChild(m);
      });
      listHost.appendChild(box);
    }

    amtIn = A.UI.field({
      label: 'Amount', type: 'text', inputmode: 'decimal', value: state.amt,
      oninput: function (e) { state.amt = e.target.value; recalc(); }
    });

    fromSel = A.UI.select({
      label: 'From', value: state.from, options: opts(state.from),
      onchange: function (e) { state.from = e.target.value; recalc(); }
    });

    toSel = A.UI.select({
      label: 'To', value: state.to, options: opts(state.to),
      onchange: function (e) { state.to = e.target.value; recalc(); }
    });

    var swapBtn = A.el('button.btn.ghost', {
      'aria-label': 'Swap units',
      html: Icons.svg('swap'),
      onclick: function () {
        var t = state.from; state.from = state.to; state.to = t;
        fromSel.input.value = state.from;
        toSel.input.value = state.to;
        A.haptic(12);
        recalc();
      }
    });
    swapBtn.style.padding = '10px 14px';

    outVal = A.el('.calc-val');
    outVal.style.fontSize = '30px';
    outVal.style.color = 'var(--acc)';
    eqLine = A.el('.note');
    eqLine.style.marginTop = '2px';

    card.appendChild(amtIn);
    card.appendChild(fromSel);
    var swapRow = A.el('.btn-row');
    swapRow.style.justifyContent = 'center';
    swapRow.appendChild(swapBtn);
    card.appendChild(swapRow);
    card.appendChild(toSel);
    card.appendChild(A.el('.calc-out', { style: { minHeight: '0', paddingBottom: '0' } }, [outVal]));
    card.appendChild(eqLine);

    host.appendChild(card);
    host.appendChild(listHost);
    recalc();
  }

  /* ── number bases ── */
  function renderBaseConv(host, c) {
    var state = A.store.get('conv.numbers', { val: '255', from: 'dec' });
    var radixOf = {};
    c.bases.forEach(function (b) { radixOf[b[0]] = b[2]; });

    var card = A.UI.card();
    var listHost = A.el('#baseAll');
    var errLine = A.el('.note');

    function recalc() {
      A.store.set('conv.numbers', state);
      var n = Bases.parse(state.val, radixOf[state.from]);
      A.clear(listHost);
      if (!isFinite(n)) {
        errLine.textContent = '"' + state.val + '" is not a valid ' +
          (c.bases.filter(function (b) { return b[0] === state.from; })[0] || [, state.from])[1].toLowerCase() + ' number.';
        errLine.style.color = 'var(--danger)';
        return;
      }
      errLine.textContent = 'Decimal value ' + A.fmtNum(n, 12);
      errLine.style.color = '';
      var box = A.UI.card(null, 'tight');
      c.bases.forEach(function (b) {
        if (b[0] === state.from) return;
        box.appendChild(A.UI.metric(b[1] + '  ·  base ' + b[2], Bases.render(n, b[2])));
      });
      listHost.appendChild(A.UI.section('All bases'));
      listHost.appendChild(box);
    }

    card.appendChild(A.UI.field({
      label: 'Value', value: state.val,
      oninput: function (e) { state.val = e.target.value; recalc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Input base', value: state.from,
      options: c.bases.map(function (b) { return { value: b[0], label: b[1] + ' (base ' + b[2] + ')' }; }),
      onchange: function (e) { state.from = e.target.value; recalc(); }
    }));
    card.appendChild(errLine);

    host.appendChild(card);
    host.appendChild(listHost);
    recalc();
  }

  /* ── currency ── */
  function renderFx(host, c) {
    var state = A.store.get('conv.currency', { amt: '100', from: 'EUR', to: 'AED' });
    var card = A.UI.card();
    var body = A.el('div');
    card.appendChild(body);
    host.appendChild(card);
    var listHost = A.el('#fxAll');
    host.appendChild(listHost);

    body.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading exchange rates…</div>' }));

    function paint(pack) {
      A.clear(body);
      A.clear(listHost);

      if (!pack) {
        body.appendChild(A.UI.empty('No exchange rates cached yet, and the device is offline. Connect once and the rates stay available offline afterwards.'));
        body.appendChild(A.el('button.btn.block', { text: 'Try again', onclick: function () { FX.load(true).then(paint); } }));
        return;
      }

      var codes = Object.keys(pack.rates).sort();
      if (!pack.rates[state.from]) state.from = 'EUR';
      if (!pack.rates[state.to]) state.to = codes[0];

      var outVal = A.el('.calc-val');
      outVal.style.fontSize = '30px';
      outVal.style.color = 'var(--acc)';
      var eqLine = A.el('.note');

      function recalc() {
        A.store.set('conv.currency', state);
        var v = A.parseNum(state.amt);
        if (!isFinite(v)) { outVal.textContent = '-'; eqLine.textContent = ''; A.clear(listHost); return; }
        outVal.textContent = A.fmtNum(FX.convert(pack, v, state.from, state.to), 8) + ' ' + state.to;
        eqLine.textContent = '1 ' + state.from + ' = ' + A.fmtNum(FX.convert(pack, 1, state.from, state.to), 6) +
          ' ' + state.to + '  ·  ECB reference rates ' + pack.date + ', ' + FX.age(pack);

        A.clear(listHost);
        listHost.appendChild(A.UI.section('All currencies'));
        var box = A.UI.card(null, 'tight');
        codes.forEach(function (code) {
          if (code === state.from) return;
          box.appendChild(A.UI.metric(code, A.fmtNum(FX.convert(pack, v, state.from, code), 8)));
        });
        listHost.appendChild(box);
        listHost.appendChild(A.UI.note('Reference rates only. Always confirm the live market rate before settlement or exchange.'));
      }

      var opts = codes.map(function (x) { return { value: x, label: x }; });
      body.appendChild(A.UI.field({
        label: 'Amount', inputmode: 'decimal', value: state.amt,
        oninput: function (e) { state.amt = e.target.value; recalc(); }
      }));
      var row = A.el('.split');
      row.appendChild(A.UI.select({ label: 'From', value: state.from, options: opts, onchange: function (e) { state.from = e.target.value; recalc(); } }));
      row.appendChild(A.UI.select({ label: 'To', value: state.to, options: opts, onchange: function (e) { state.to = e.target.value; recalc(); } }));
      body.appendChild(row);
      body.appendChild(A.el('.calc-out', { style: { minHeight: '0', paddingBottom: '0' } }, [outVal]));
      body.appendChild(eqLine);
      body.appendChild(A.el('button.btn.ghost.block', {
        text: 'Refresh rates',
        onclick: function () { FX.load(true).then(function (p) { A.toast(p ? 'Rates refreshed' : 'Could not reach the rate service'); paint(p || pack); }); }
      }));
      recalc();
    }

    FX.load(false).then(paint);
  }

  /* ══ register ═════════════════════════════════════════════════════════ */

  A.Router.register('convert', {
    render: function (host, r) {
      if (r.path[0]) renderConverter(host, r.path[0]);
      else renderPicker(host);
    }
  });

  global.ArtFX = FX;
  global.ArtBases = Bases;

})(window);
