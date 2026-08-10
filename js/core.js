/*
 * Artemidos - core
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * DOM helpers, persistent settings, hash router, theme, and the unit-preference
 * layer every other module formats through.
 */
(function (global) {
  'use strict';

  /* ══ DOM ══════════════════════════════════════════════════════════════ */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* el('div.card#x', {attrs}, [children|string]) */
  /* ══ AN INLINE PIXEL SIZE IS A SIZE NOTHING CAN CHANGE ═════════════════
     Themes set their own type scale, and the Military schemes deliberately run
     larger because a terminal face draws small. That scale is CSS, so it loses
     to any inline style, and roughly thirty places in this app set a font size
     inline - the airport dropdown among them, at a hard 13px. Those spots
     stayed tiny in every theme no matter what the theme asked for, and no
     amount of theme CSS could reach them.

     Rather than chase every call site, the size is converted here: an inline
     size given in px is rewritten as the same size in rem, and each theme sets
     the root size. Thirteen pixels then means "thirteen at the default scale"
     and grows with the theme, which is what the code always meant. The Text
     size control in Settings is separate and still zooms the whole view. */
  function fixStyle(v) {
    var fs = v.fontSize;
    if (typeof fs === 'string' && /^[\d.]+px$/.test(fs)) {
      var out = {};
      Object.keys(v).forEach(function (k) { out[k] = v[k]; });
      out.fontSize = (parseFloat(fs) / 16) + 'rem';
      return out;
    }
    return v;
  }

  /* Classes whose text is app chrome rather than data - see the note in el().
     Headings, grid cells, field labels and hints, notes, empty states, the
     sub-line under a result, list rows, tab chips and plain buttons. Matched
     on the whole class string, so .tile-t never fires on something merely
     containing it.

     .chip and .btn are the two that carry data as well as chrome - the
     camouflage and country filters are chips, and a button can be labelled
     with a place name. That is safe because tr() substitutes only an exact
     hit in the hand-written table; a country name is not in it and comes
     back untouched.

     .metric-v is deliberately ABSENT. It holds the computed number, and a
     value that happened to read "Range" must never be rewritten. */
  var TRANSLATED_CLASS = /(^|\s)(sec-lab|tile-t|tile-s|fld-lab|fld-hint|chip|note|empty|metric-l|metric-sub|lrow-t|lrow-s|btn|cap-t|nb-title|pos-t)(\s|$)/;

  /* A button is usually built as an icon followed by its label:
        html: Icons.svg('globe') + ' Open the GitHub page'
     Routing `html` wholesale through the table would never match, because the
     SVG is part of the string. Split the markup off, translate what is left,
     and put it back. Anything that is not "icon then text" is untouched. */
  var ICON_THEN_TEXT = /^(\s*<svg\b[\s\S]*?<\/svg>)([\s\S]+)$/;
  /* War Pigeon wraps its bar-button labels in a bare span so they can be
     hidden on a narrow screen. Unwrap that too, or those three buttons stay
     English while every other button translates. */
  var LONE_SPAN = /^\s*<span>([^<>]+)<\/span>\s*$/;

  function trHtml(v) {
    var sp = LONE_SPAN.exec(v);
    if (sp) {
      var inner = tr(sp[1]);
      return inner === sp[1] ? v : '<span>' + inner + '</span>';
    }
    var m = ICON_THEN_TEXT.exec(v);
    if (!m) return v;
    var lead = m[2].match(/^\s*/)[0];
    var label = m[2].slice(lead.length);
    /* only a plain label, never nested markup */
    if (/[<>]/.test(label)) return v;
    var out = tr(label);
    return out === label ? v : m[1] + lead + out;
  }

  function el(spec, attrs, kids) {
    var m = /^([a-z0-9]+)?((?:[.#][^.#]+)*)$/i.exec(spec) || [];
    var node = document.createElement(m[1] || 'div');
    (m[2] || '').split(/(?=[.#])/).forEach(function (t) {
      if (!t) return;
      if (t[0] === '#') node.id = t.slice(1); else node.classList.add(t.slice(1));
    });
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'html') node.innerHTML = trHtml(v);
      /* the grey prompt inside an empty input is read as often as its label */
      else if (k === 'placeholder') node.setAttribute(k, tr(v));
      else if (k === 'text') {
        /* Headings and grid labels across the app build their own element
           rather than calling the A.UI helper, so routing only the helpers
           left every one of them permanently English. Catching the CLASS
           instead of the call site covers them all, including any written
           later. tr() is a hoisted declaration further down this file, so
           calling it from here is fine.

           Deliberately narrow, and chosen class by class: these four hold
           chrome the app itself writes. Values, user input, place names and
           catalogue prose are built with other classes and pass through
           untouched - tr() would leave them alone anyway, since it only
           substitutes an exact match from the hand-written table, but the
           class list is the guarantee rather than the luck. */
        node.textContent = TRANSLATED_CLASS.test(node.className) ? tr(v) : v;
      }
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, fixStyle(v));
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }

  /* Search key: lower case with spaces, hyphens and dots removed, and accents
     folded away. A rifle written "HK416" was invisible to anyone typing
     "HK 416", which is how a weapon that is in the catalogue twice gets
     reported as missing. Matching on this key makes the punctuation the user
     happens to use irrelevant. */
  function skey(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize ? String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s\-_.\/()]+/g, '')
      : String(s == null ? '' : s).toLowerCase().replace(/[\s\-_.\/()]+/g, '');
  }

  /* debounce for live-typing inputs */
  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms || 120);
    };
  }

  /* ══ storage ══════════════════════════════════════════════════════════ */

  var NS = 'artemidos.';
  /* With the app lock on, a handful of keys - the notebook, the War Pigeon
     keys and log, positions - do not live in localStorage at all. They live in
     an encrypted blob that is decrypted into memory once, at unlock.

     The redirection happens HERE rather than in each caller, because the whole
     app reads storage synchronously and AES is not synchronous. Everything
     upstream keeps working exactly as it did; it simply gets its answer from
     memory instead of from disk. See lock.js. */
  function vault() {
    var L = global.ArtLock;
    return (L && L.handles) ? L : null;
  }

  var store = {
    get: function (k, dflt) {
      var L = vault();
      if (L && L.handles(k)) return L.vaultGet(k, dflt);
      try {
        var raw = localStorage.getItem(NS + k);
        return raw == null ? dflt : JSON.parse(raw);
      } catch (e) { return dflt; }
    },
    /* straight to disk, past the vault: used only when the lock is being
       turned on or off and the two sides have to be moved between each other */
    raw: function (k) {
      try {
        var v = localStorage.getItem(NS + k);
        return v == null ? undefined : JSON.parse(v);
      } catch (e) { return undefined; }
    },
    rawSet: function (k, v) {
      try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {}
      return v;
    },
    remove: function (k) { try { localStorage.removeItem(NS + k); } catch (e) {} },
    /* Returns the value, but records whether the write actually landed. A
       silent failure here is indistinguishable from a bug anywhere else in
       the app: a note "saves", the screen repaints, and the data is gone.
       store.lastError holds the reason for anything that wants to report it. */
    set: function (k, v) {
      var L = vault();
      if (L && L.handles(k)) { L.vaultSet(k, v); store.lastError = null; return v; }
      try {
        localStorage.setItem(NS + k, JSON.stringify(v));
        store.lastError = null;
      } catch (e) {
        store.lastError = (e && (e.name || e.message)) || 'storage failed';
        console.log('store.set FAILED for ' + k + ': ' + store.lastError);
      }
      return v;
    },
    /* did the last write succeed? */
    ok: function () { return !store.lastError; },
    /* rough size of everything this app has stored, in bytes */
    usage: function () {
      var n = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          n += k.length + (localStorage.getItem(k) || '').length;
        }
      } catch (e) {}
      return n;
    },
    del: function (k) {
      var L = vault();
      if (L && L.handles(k)) { L.vaultRemove(k); return; }
      try { localStorage.removeItem(NS + k); } catch (e) {}
    }
  };

  /* ══ numbers ══════════════════════════════════════════════════════════ */

  /* Significant-figure formatting that stays readable across 12 orders of
     magnitude: thousands separators for big numbers, no trailing zero noise
     for small ones, exponent form only when it is genuinely unreadable. */
  /* ZERO IS A REQUEST, NOT AN OMISSION. `sig || 6` treated fmtNum(x, 0) as
     "no preference" and quietly returned six significant figures, so roughly a
     dozen call sites that asked for a whole number printed things like
     "3.22466 km away", "roll 12.3456 deg" and "walk 145.678 m". Every one of
     those callers meant nought decimal places, and at a >= 1 the table below
     already yields exactly that from sig = 0. Only a genuinely absent argument
     should fall back. */
  function fmtNum(n, sig) {
    if (n == null || !isFinite(n)) return '-';
    if (sig === undefined || sig === null) sig = 6;
    var a = Math.abs(n);
    if (a === 0) return '0';
    if (a >= 1e12 || a < 1e-6) return n.toExponential(Math.max(0, sig - 1)).replace(/e([+-])(\d)$/, 'e$10$2');
    var dec;
    if (a >= 1000) dec = 0;
    else if (a >= 100) dec = Math.max(0, sig - 3);
    else if (a >= 10) dec = Math.max(0, sig - 2);
    else if (a >= 1) dec = Math.max(0, sig - 1);
    else dec = Math.min(10, sig - Math.floor(Math.log10(a)) - 1);
    var s = n.toFixed(Math.min(12, dec));
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }

  /* h:mm:ss style duration from hours */
  function fmtDur(hours) {
    if (!isFinite(hours) || hours < 0) return '-';
    var totalS = Math.round(hours * 3600);
    var d = Math.floor(totalS / 86400);
    var h = Math.floor((totalS % 86400) / 3600);
    var m = Math.floor((totalS % 3600) / 60);
    var s = totalS % 60;
    if (d > 0) return d + 'd ' + h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
    if (h > 0) return h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
    if (m > 0) return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
    /* under a minute. Below 10 s keep two decimals (and strip only the
       fractional trailing zeros - never a whole-number zero, or "10" became
       "1"); from 10 s up show whole seconds. */
    if (totalS < 10) return (hours * 3600).toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') + 's';
    return s + 's';
  }

  function parseNum(v) {
    if (typeof v === 'number') return v;
    if (v == null) return NaN;
    var s = String(v).trim().replace(/\s+/g, '').replace(/,/g, '.');
    if (s === '') return NaN;
    return parseFloat(s);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ══ units ════════════════════════════════════════════════════════════
     Every module stores values in SI and formats through U.fmt(kind, si).
     A "kind" maps to a category in units-data.js plus the user's chosen
     display unit for that kind. Presets bulk-set those choices.          */

  var KINDS = {
    /* kind        category in ARTEMIDOS_UNITS   metric      imperial    us          nautical   */
    length:  { cat: 'length',       metric: 'm',      imperial: 'ft',     us: 'ft',     nautical: 'm',    label: 'Length / size' },
    dist:    { cat: 'length',       metric: 'km',     imperial: 'mi',     us: 'mi',     nautical: 'nmi',  label: 'Travel distance' },
    alt:     { cat: 'length',       metric: 'm',      imperial: 'ft',     us: 'ft',     nautical: 'ft',   label: 'Altitude / height' },
    speed:   { cat: 'velocity',     metric: 'km/h',   imperial: 'mph',    us: 'mph',    nautical: 'kn',   label: 'Speed' },
    vspeed:  { cat: 'velocity',     metric: 'm/s',    imperial: 'ft/s',   us: 'ft/s',   nautical: 'ft/s', label: 'Vertical / muzzle speed' },
    mass:    { cat: 'mass',         metric: 'kg',     imperial: 'lb',     us: 'lb',     nautical: 'kg',   label: 'Mass' },
    temp:    { cat: 'temperature',  metric: '°C',     imperial: '°F',     us: '°F',     nautical: '°C',   label: 'Temperature' },
    area:    { cat: 'area',         metric: 'm²',     imperial: 'ft²',    us: 'ft²',    nautical: 'm²',   label: 'Area' },
    volume:  { cat: 'volume',       metric: 'L',      imperial: 'gal UK', us: 'gal US', nautical: 'L',    label: 'Volume' },
    press:   { cat: 'pressure',     metric: 'bar',    imperial: 'psi',    us: 'psi',    nautical: 'bar',  label: 'Pressure' },
    energy:  { cat: 'energy',       metric: 'kJ',     imperial: 'BTU',    us: 'BTU',    nautical: 'kJ',   label: 'Energy' },
    power:   { cat: 'power',        metric: 'kW',     imperial: 'hp',     us: 'hp',     nautical: 'kW',   label: 'Power' },
    force:   { cat: 'force',        metric: 'N',      imperial: 'lbf',    us: 'lbf',    nautical: 'N',    label: 'Force' },
    fuel:    { cat: 'fuel',         metric: 'L/100km',imperial: 'mpg UK', us: 'mpg US', nautical: 'L/100km', label: 'Fuel economy' },
    angle:   { cat: 'angle',        metric: '°',      imperial: '°',      us: '°',      nautical: 'mil',  label: 'Angle' }
  };

  var PRESETS = {
    metric:   'Metric',
    imperial: 'Imperial (UK)',
    us:       'US customary',
    nautical: 'Nautical / aviation',
    custom:   'Custom'
  };

  var U = {
    KINDS: KINDS,
    PRESETS: PRESETS,

    preset: function () { return store.get('units.preset', 'metric'); },

    /* the display unit code chosen for a kind */
    unit: function (kind) {
      var k = KINDS[kind];
      if (!k) return '';
      var over = store.get('units.of.' + kind, null);
      if (over) return over;
      var p = U.preset();
      return k[p === 'custom' ? 'metric' : p] || k.metric;
    },

    setUnit: function (kind, code) {
      store.set('units.of.' + kind, code);
      store.set('units.preset', 'custom');
      Bus.emit('units:changed');
    },

    setPreset: function (p) {
      if (p === 'custom') {
        /* seed every kind with its current unit BEFORE the preset flips,
           so switching to custom changes nothing until a unit is edited */
        Object.keys(KINDS).forEach(function (k) { store.set('units.of.' + k, U.unit(k)); });
      } else {
        Object.keys(KINDS).forEach(function (k) { store.del('units.of.' + k); });
      }
      store.set('units.preset', p);
      Bus.emit('units:changed');
    },

    /* Every unit code available for a kind, in catalogue order.
       Must go through Units.get(): ARTEMIDOS_UNITS holds the raw authoring
       form ["mm", "Millimeter", 0.001], and reading .c / .n off that gives
       undefined for every option. */
    options: function (kind) {
      var k = KINDS[kind];
      if (!k || !global.Units) return [];
      var cat = global.Units.get(k.cat);
      return cat && cat.units ? cat.units.map(function (u) { return { code: u.c, name: u.n }; }) : [];
    },

    /* SI -> chosen unit (or an explicit code) */
    to: function (kind, si, code) {
      var k = KINDS[kind];
      if (!k) return si;
      code = code || U.unit(kind);
      return Units.fromSI(k.cat, si, code);
    },

    /* chosen unit (or explicit code) -> SI */
    from: function (kind, v, code) {
      var k = KINDS[kind];
      if (!k) return v;
      code = code || U.unit(kind);
      return Units.toSI(k.cat, v, code);
    },

    /* "412 km", opts: {sig, unit, bare:true to omit the symbol} */
    fmt: function (kind, si, opts) {
      opts = opts || {};
      if (si == null || !isFinite(si)) return '-';
      var code = opts.unit || U.unit(kind);
      var v = U.to(kind, si, code);
      var s = fmtNum(v, opts.sig || 4);
      return opts.bare ? s : s + ' ' + code;
    },

    /* the unit symbol alone, for input field suffixes */
    sym: function (kind) { return U.unit(kind); },

    /* Distances that span from metres to thousands of kilometres: a weapon's
       800 m effective range must not render as "0.8 km", and a 426 km road
       range must not render as "426 000 m". Steps down to a finer unit
       within whichever system the user already chose. */
    fmtRange: function (si, opts) {
      opts = opts || {};
      if (si == null || !isFinite(si)) return '-';
      /* an explicit override always wins: a charge distance or a short sprint
         reads better in metres or yards whatever the travel-distance default */
      var sig = opts.sig || 4;
      if (opts.unit && opts.unit !== 'auto') return U.fmt('length', si, { unit: opts.unit, sig: sig });
      var code = U.unit('dist');
      var a = Math.abs(si);
      if (code === 'km' && a < 1000) return U.fmt('length', si, { unit: 'm', sig: sig });
      if (code === 'mi' && a < 1609.344) return U.fmt('length', si, { unit: 'yd', sig: sig });
      if (code === 'nmi' && a < 1852) return U.fmt('length', si, { unit: 'm', sig: sig });
      /* deliberately not forwarding opts: it may carry unit:'auto', which is a
         sentinel for this function and not a unit code U.fmt could convert to */
      return U.fmt('dist', si, { sig: sig });
    },

    /* the distance units worth offering inline, whatever system is set. No
       "auto": a field must always name the unit it is read in. */
    RANGE_UNITS: ['m', 'km', 'ft', 'yd', 'mi', 'nmi'],

    /* which unit "auto" resolves to right now, for a given magnitude */
    autoRangeUnit: function (si) {
      var code = U.unit('dist');
      var a = Math.abs(si || 0);
      if (code === 'km' && a < 1000) return 'm';
      if (code === 'mi' && a < 1609.344) return 'yd';
      if (code === 'nmi' && a < 1852) return 'm';
      return code;
    },

    /* SI <- a value typed against a range-unit override */
    fromRange: function (v, code) {
      if (!code || code === 'auto') return U.from('dist', v);
      return Units.toSI('length', v, code);
    },

    toRange: function (si, code) {
      if (!code || code === 'auto') return U.to('dist', si);
      return Units.fromSI('length', si, code);
    }
  };

  /* ══ event bus ════════════════════════════════════════════════════════ */

  var Bus = (function () {
    var map = {};
    return {
      on: function (ev, fn) { (map[ev] = map[ev] || []).push(fn); return fn; },
      off: function (ev, fn) { map[ev] = (map[ev] || []).filter(function (f) { return f !== fn; }); },
      emit: function (ev, data) { (map[ev] || []).slice().forEach(function (f) { try { f(data); } catch (e) { console.error(e); } }); }
    };
  })();

  /* ══ router ═══════════════════════════════════════════════════════════
     Hash routes: #/convert, #/speed/military/tanks, #/calc?tab=graph.
     A view registers {title, render(host, params), teardown?}.           */

  var Router = (function () {
    var views = {}, current = null, host = null;
    /* remember how far each screen was scrolled, keyed by its full hash, so
       returning from an item lands where the list was left, not at the top */
    var scrollPos = {}, currentKey = null, currentRemembers = true;

    function parse() {
      var h = (location.hash || '#/console').replace(/^#\/?/, '');
      var qi = h.indexOf('?');
      var query = {};
      if (qi >= 0) {
        h.slice(qi + 1).split('&').forEach(function (p) {
          var kv = p.split('=');
          query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        h = h.slice(0, qi);
      }
      var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
      return { name: parts[0] || 'home', path: parts.slice(1), query: query };
    }

    /* The page scrolls the document, not #view (.view has no overflow), so the
       scroll position lives on document.scrollingElement. Read and write there
       or the save/restore is a no-op. */
    /* The view is the scroller now: the shell itself never moves. Falling back
       to the document keeps this working if the element is not up yet. */
    function scroller() {
      return document.getElementById('view') || document.scrollingElement || document.documentElement;
    }

    /* A LIST is worth returning to where you left it. A single item is not:
       reopening the same tank should start at the top of its page, not wherever
       you happened to stop reading it last time, which looked like the app had
       opened the page halfway down. Lists keep their memory; detail pages
       always open at the top. */
    function remembersScroll(r) { return r.path[0] !== 'item'; }

    /* ══ AN EMPTY CARD IS A PROMISE NOTHING KEPT ══════════════════════════
       A panel with nothing in it reads as a thing that failed to load, and
       there are a number of places where one is built, filled conditionally,
       and then appended whether or not anything went into it. The heading
       above it has the same problem: a section label introducing an empty
       panel is worse than either on its own.

       Rather than auditing every builder, the page is swept once after it is
       rendered and anything genuinely empty is dropped. Empty means no text
       and no control - not "no button": most cards in this app are text, and
       a card of text is doing its job. An image, an input, a canvas or a map
       all count as content too. */
    /* A two-column grid holding ONE thing leaves the other column empty, and in
       the themes where the grid itself is the panel - Raider draws it as a
       sheet of glass - that empty column reads as a second, blank card sitting
       beside the real one. It is not a card; it is the half of the panel
       nothing was put in. Either way it should not be there.

       So a grid with a single child stops being a two-column grid. The one
       item takes the full width and the panel fits it. */
    function fitGrids(root) {
      if (!root) return;
      var grids = root.querySelectorAll('.lgrid, .tiles');
      for (var i = 0; i < grids.length; i++) {
        var g = grids[i];
        if (g.children.length === 1) g.classList.add('one');
        else g.classList.remove('one');
      }
    }

    function pruneEmpty(root) {
      if (!root) return;
      var boxes = root.querySelectorAll('.card, .lgrid, .tiles, .con-grid, .metric-list');
      for (var i = boxes.length - 1; i >= 0; i--) {
        var b = boxes[i];
        if (b.querySelector('img, svg, canvas, input, select, textarea, button, a, iframe, video')) continue;
        if ((b.textContent || '').trim()) continue;
        /* a heading whose only job was to introduce this panel goes with it */
        var prev = b.previousElementSibling;
        b.parentNode.removeChild(b);
        if (prev && prev.classList.contains('sec-lab') &&
            (!prev.nextElementSibling || prev.nextElementSibling.classList.contains('sec-lab'))) {
          prev.parentNode.removeChild(prev);
        }
      }
    }

    function apply() {
      var r = parse();
      var key = (location.hash || '#/console');
      /* save the scroll of the screen we are leaving before it is torn down */
      if (currentKey != null && currentRemembers) scrollPos[currentKey] = scroller().scrollTop;

      var v = views[r.name] || views['console'] || views.speed;
      if (current && current.view.teardown) {
        try { current.view.teardown(); } catch (e) { console.error(e); }
      }
      clear(host);
      scroller().scrollTop = 0;
      current = { name: r.name, view: v, params: r };
      document.body.setAttribute('data-view', r.name);
      try { v.render(host, r); } catch (e) {
        console.error(e);
        host.appendChild(el('.empty', { html: '<b>Something went wrong in this tool.</b><br>' + esc(e.message) }));
      }

      pruneEmpty(host);
      fitGrids(host);

      /* restore the remembered scroll for this screen, if any. Several frames,
         because a long list and its images settle their height over a beat. */
      var want = remembersScroll(r) ? (scrollPos[key] || 0) : 0;
      currentKey = key;
      currentRemembers = remembersScroll(r);
      if (want) {
        var tries = 0;
        (function restore() {
          scroller().scrollTop = want;
          if (++tries < 6 && Math.abs(scroller().scrollTop - want) > 1) requestAnimationFrame(restore);
        })();
      }

      Bus.emit('route', current);
    }

    return {
      register: function (name, view) { views[name] = view; return view; },
      get: function (name) { return views[name]; },
      start: function (hostEl) {
        host = hostEl;
        window.addEventListener('hashchange', apply);
        apply();
      },
      go: function (path) {
        var next = '#/' + String(path).replace(/^#?\/?/, '');
        if (location.hash === next) apply(); else location.hash = next;
      },
      back: function () {
        if (history.length > 1) history.back(); else Router.go('console');
      },
      current: function () { return current; },
      refresh: apply,
      params: parse
    };
  })();

  /* ══ chrome helpers ═══════════════════════════════════════════════════ */

  function setTitle(t, opts) {
    opts = opts || {};
    var tt = $('#tbTitle'), back = $('#tbBack'), mark = $('#tbMark');
    if (tt) tt.textContent = tr(t);
    if (back) back.hidden = !opts.back;
    if (mark) mark.hidden = !!opts.back;
    var act = $('#tbActions');
    if (act) {
      clear(act);
      (opts.actions || []).forEach(function (a) {
        act.appendChild(el('button.tb-btn', {
          'aria-label': tr(a.label), title: tr(a.label), html: Icons.svg(a.icon), onclick: a.onclick
        }));
      });
    }
  }

  var toastT = null;
  function toast(msg, ms) {
    var t = $('#toast');
    if (!t) { t = el('div#toast.toast'); document.body.appendChild(t); }
    /* Toasts are where the app explains a refusal, so they are worth as much
       as any label on screen. Many are built by concatenation and will not
       match; the fixed ones do. */
    t.textContent = tr(msg);
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, ms || 2200);
  }

  function haptic(ms) {
    if (!store.get('haptics', true)) return;
    var H = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Haptics;
    if (H && H.vibrate) { try { H.vibrate({ duration: ms || 8 }); return; } catch (e) {} }
    try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {}
  }

  /* Font size is a whole-content scale rather than a single base size,
     because the layout is built in pixels and a base-size change would not
     cascade into any of it. Scaling the scrolling view scales its text and
     spacing together; the top and tab bars stay fixed so navigation does not
     move under the finger. Clamped to a sensible, still-usable range. */
  /* ══ WHERE THE SCREEN ACTUALLY IS ══════════════════════════════════════
     A fixed overlay is laid out against the LAYOUT viewport, which on Android
     does not shrink when the on-screen keyboard opens. So a sheet pinned to
     the bottom of `inset: 0` ends up underneath the keyboard, with its search
     field and the first rows of its list hidden behind it - which is exactly
     what the shortcut picker did as soon as anyone typed.

     The VISUAL viewport is the part actually on screen. Publishing its height
     and offset as custom properties lets any overlay be positioned against
     what the user can see rather than against what the page thinks it has. */
  function trackViewport() {
    var vv = global.visualViewport;
    var root = document.documentElement;
    if (!vv) { root.style.setProperty('--vvh', '100dvh'); return; }
    function apply() {
      root.style.setProperty('--vvh', vv.height + 'px');
      root.style.setProperty('--vvtop', (vv.offsetTop || 0) + 'px');
    }
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    apply();
  }

  function applyFontScale() {
    var s = store.get('fontScale', 1);
    s = Math.max(0.8, Math.min(1.2, s));
    /* Not zoom. Zoom scaled the buttons, the icons, the padding and the gaps
       along with the words, so at 120% the whole interface was bigger and the
       text was no more readable against it - and on a small screen it pushed
       controls off the edge.

       Every type size in the stylesheet is now in rem, and this sets what a
       rem is worth. The words grow inside furniture that stays exactly where
       it was, which is the point of a text-size control. */
    document.documentElement.style.setProperty('--ts', s);
    var view = document.getElementById('view');
    if (view) view.style.zoom = '';
  }

  var viewportTracked = false;
  function applyTheme() {
    if (!viewportTracked) { viewportTracked = true; try { trackViewport(); } catch (e) {} }
    var t = store.get('theme', 'dark');
    applyFontScale();
    document.documentElement.setAttribute('data-theme', t);
    /* Artemis is one theme in two lights (dark + light). The matrix backdrop
       and the see-through cards belong to it and to no other, so a separate
       family flag drives them rather than the specific theme name. */
    var fam = (t === 'dark' || t === 'light') ? 'artemis'
            : (t === 'raider' || t === 'raiderday') ? 'raider' : t;
    document.documentElement.setAttribute('data-family', fam);
    var meta = document.querySelector('meta[name=theme-color]');
    var bar = { light: '#F4F6F8', night: '#0C0000', milhud: '#030806', raider: '#050505', raiderday: '#D9DBD8' }[t] || '#0A0D12';
    if (meta) meta.setAttribute('content', bar);
  }

  /* ══ shared UI atoms ══════════════════════════════════════════════════ */

  /* Every visible label passes through here on its way to the screen. If the
     language engine knows the English string it is swapped; if not it is
     returned untouched, so an untranslated app is English rather than broken.

     Guarded because core.js loads before i18n in some entry points and must
     not depend on it existing. */
  function tr(text) {
    var I = global.ArtI18n;
    return (I && typeof text === 'string') ? I.auto(text) : text;
  }
  /* Fixed-point digit mask: the decimal point sits at a set offset from the
     sign and never moves, so the user only ever types digits (a coordinate
     field for example reads 25.05460 without anyone pressing ".").
     intDigits is the number of digits before the point (2 for a latitude,
     3 for a longitude). A leading '-' is preserved as the only non-digit
     the user may type; N/S/E/W prefixing is handled by the caller, not here. */
  function applyDecimalMask(inp, intDigits) {
    inp.addEventListener('keypress', function (e) {
      if (e.key && e.key.length === 1 && !/[0-9\-]/.test(e.key)) e.preventDefault();
    });
    inp.addEventListener('input', function () {
      var neg = inp.value.charAt(0) === '-';
      var digits = inp.value.replace(/[^0-9]/g, '');
      var out = (neg ? '-' : '') + digits;
      if (digits.length > intDigits) {
        out = (neg ? '-' : '') + digits.slice(0, intDigits) + '.' + digits.slice(intDigits);
      }
      if (out !== inp.value) inp.value = out;
    });
  }

  var UI = {
    /* labelled numeric field with a unit suffix. Pass decimalAt: N to fix
       the decimal point after N digits instead of letting the user type one
       (used for coordinate entry: decimalAt 2 for latitude, 3 for longitude). */
    field: function (o) {
      var wrap = el('label.fld');
      wrap.appendChild(el('span.fld-lab', { text: o.label }));
      var row = el('.fld-row');
      var inp = el('input.fld-in', {
        type: o.type || 'text',
        inputmode: o.inputmode || (o.type === 'number' ? 'decimal' : null),
        placeholder: o.placeholder || '',
        value: o.value != null ? o.value : '',
        step: 'any',
        autocomplete: 'off',
        autocapitalize: 'off',
        spellcheck: 'false'
      });
      if (o.decimalAt) applyDecimalMask(inp, o.decimalAt);
      if (o.oninput) inp.addEventListener('input', o.oninput);
      row.appendChild(inp);
      if (o.suffix) row.appendChild(el('span.fld-sfx', { text: o.suffix }));
      wrap.appendChild(row);
      if (o.hint) wrap.appendChild(el('span.fld-hint', { text: o.hint }));
      wrap.input = inp;
      return wrap;
    },

    /* A numeric field whose suffix is a live unit picker, so a charge
       distance can be read in metres or yards without going to Settings and
       changing the whole app. o.unit is the current code ('auto' allowed),
       o.onunit fires when it changes. */
    rangeField: function (o) {
      var wrap = el('label.fld');
      wrap.appendChild(el('span.fld-lab', { text: o.label }));
      var row = el('.fld-row');
      var inp = el('input.fld-in', {
        type: 'text', inputmode: 'decimal', placeholder: o.placeholder || '',
        value: o.value != null ? o.value : '',
        autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false'
      });
      if (o.oninput) inp.addEventListener('input', o.oninput);
      row.appendChild(inp);

      /* Never default to the word "auto": it tells the reader nothing about
         which unit they are typing in. Fall back to the chosen distance unit
         (km on metric), shown by name. */
      var curUnit = (o.unit && o.unit !== 'auto') ? o.unit : U.unit('dist');
      var sel = el('select.fld-sfx.fld-unit');
      U.RANGE_UNITS.forEach(function (c) {
        sel.appendChild(el('option', { value: c, selected: c === curUnit }, c));
      });
      if (o.onunit) sel.addEventListener('change', function (e) { o.onunit(e.target.value); });
      row.appendChild(sel);

      wrap.appendChild(row);
      if (o.hint) wrap.appendChild(el('span.fld-hint', { text: o.hint }));
      wrap.input = inp;
      wrap.unitSelect = sel;
      return wrap;
    },

    select: function (o) {
      var wrap = el('label.fld');
      if (o.label) wrap.appendChild(el('span.fld-lab', { text: tr(o.label) }));
      var sel = el('select.fld-in');
      (o.options || []).forEach(function (op) {
        sel.appendChild(el('option', { value: op.value, selected: op.value === o.value }, tr(op.label)));
      });
      if (o.onchange) sel.addEventListener('change', o.onchange);
      wrap.appendChild(sel);
      wrap.input = sel;
      return wrap;
    },

    /* Horizontal scrolling chip row used for category and mode switching.
       The row owns its selected state: most callers navigate and get a fresh
       render, but some only rebuild part of the view, and a chip row that
       depends on the caller re-rendering silently stops highlighting for
       those. row.setActive(id) is there for callers that reject a choice. */
    chips: function (items, active, onPick) {
      var row = el('.chips');
      var buttons = [];

      function setActive(id) {
        buttons.forEach(function (b) { b.classList.toggle('on', String(b._id) === String(id)); });
      }

      items.forEach(function (it) {
        var b = el('button.chip' + (String(it.id) === String(active) ? '.on' : ''), {
          text: tr(it.label),
          onclick: function () {
            haptic();
            setActive(it.id);
            onPick(it.id, it);
          }
        });
        b._id = it.id;
        buttons.push(b);
        row.appendChild(b);
      });

      row.setActive = setActive;

      /* keep the active chip in view on re-render */
      setTimeout(function () {
        var on = row.querySelector('.chip.on');
        if (on && on.offsetLeft > row.clientWidth * 0.6) row.scrollLeft = on.offsetLeft - row.clientWidth * 0.35;
      }, 0);
      return row;
    },

    card: function (kids, cls) { return el('.card' + (cls ? '.' + cls : ''), null, kids); },

    /* label / value line used everywhere for results */
    metric: function (label, value, opts) {
      opts = opts || {};
      var r = el('.metric' + (opts.big ? '.big' : ''));
      r.appendChild(el('span.metric-l', { html: (opts.icon ? Icons.svg(opts.icon, 'metric-ic') : '') + esc(tr(label)) }));
      r.appendChild(el('b.metric-v', { text: value }));
      if (opts.sub) r.appendChild(el('span.metric-sub', { text: opts.sub }));
      return r;
    },

    section: function (title) { return el('.sec-lab', { text: tr(title) }); },

    note: function (text) { return el('.note', { text: tr(text) }); },

    empty: function (text) { return el('.empty', { text: tr(text) }); },

    /* search box that filters a list as you type */
    search: function (placeholder, oninput) {
      var wrap = el('.search');
      wrap.appendChild(el('span.search-ic', { html: Icons.svg('search') }));
      var inp = el('input.search-in', {
        type: 'search', placeholder: tr(placeholder), autocomplete: 'off',
        autocapitalize: 'off', spellcheck: 'false'
      });
      inp.addEventListener('input', debounce(function () { oninput(inp.value.trim()); }, 90));
      wrap.appendChild(inp);
      wrap.input = inp;
      return wrap;
    },

    /* tappable row in a browse list */
    /* o.plain drops the leading icon and the chevron: inside an entry list
       every row would repeat the same icon (31 identical tanks) and every row
       is obviously tappable, so both were noise paid for in subtitle width.
       o.count pins a small badge top-right instead of appending "· N entries"
       to the sentence, where it truncated on narrow screens. */
    row: function (o) {
      var r = el('button.lrow' + (o.plain ? '.plain' : ''), { onclick: o.onclick });
      if (o.iconHtml && !o.plain) r.appendChild(el('span.lrow-ic', { html: o.iconHtml }));
      else if (o.icon && !o.plain) r.appendChild(el('span.lrow-ic', { html: Icons.svg(o.icon) }));
      var mid = el('.lrow-mid');
      mid.appendChild(el('span.lrow-t', { text: tr(o.title) }));
      if (o.sub) mid.appendChild(el('span.lrow-s', { text: tr(o.sub) }));
      r.appendChild(mid);
      if (o.count != null) r.appendChild(el('span.lrow-badge', { text: String(o.count) }));
      if (o.tag) r.appendChild(el('span.tag', { text: o.tag }));
      if (!o.plain) r.appendChild(el('span.lrow-ch', { html: Icons.svg('chevron') }));
      return r;
    }
  };

  /* ══ export ═══════════════════════════════════════════════════════════ */

  global.A = {
    $: $, $$: $$, el: el, esc: esc, clear: clear, debounce: debounce, skey: skey,
    store: store, Bus: Bus, Router: Router, U: U, UI: UI, tr: tr,
    fmtNum: fmtNum, fmtDur: fmtDur, parseNum: parseNum, clamp: clamp,
    setTitle: setTitle, toast: toast, haptic: haptic, applyTheme: applyTheme, applyFontScale: applyFontScale
  };

})(window);
