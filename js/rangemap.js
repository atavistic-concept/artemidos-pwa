/*
 * Artemidos - Map page, and the range graphics shown on item pages
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * TWO things live here:
 *
 *   A.rangeGraphic(rec)  A pair of small diagrams for an item's own page: the
 *                        danger rings on the ground (fire / lethal / blast /
 *                        radiation) and, where it makes sense, how far the
 *                        thing is heard across different ground. Every ring is
 *                        drawn to scale from the catalogue's own SI figures, so
 *                        the picture and the numbers on the page are the same
 *                        data. The grenade page gets the grenade's rings, the
 *                        rifle page the rifle's, and so on.
 *
 *   MAP PAGE ('map')     A real, pannable, zoomable world map (Leaflet over
 *                        OpenStreetMap). By default it is just the map. If the
 *                        user wants, they can drop one of the same range sets
 *                        onto it as true geographic circles, centred wherever
 *                        they tap, to read which real places fall inside a
 *                        ring anywhere on Earth.
 */
(function (global) {
  'use strict';

  var C = window.ART_CATALOG;
  var RING_COLOURS = ['#E5674F', '#E0A54F', '#C77FD9', '#7FA8D9', '#3FA46B'];

  /* ── ring data ────────────────────────────────────────────────────────── */

  function distRings(rec) {
    return (rec.specs || [])
      .filter(function (s) { return s[2] === 'dist' && typeof s[1] === 'number' && s[1] > 0; })
      .map(function (s) { return { label: s[0], m: s[1], sub: s[3] || '' }; })
      .sort(function (a, b) { return a.m - b.m; });
  }

  var SOUND_SOURCES = [
    { id: 'pistol', n: 'Pistol shot', openKm: 1.6 },
    { id: 'rifle', n: 'Rifle shot', openKm: 3.5 },
    { id: 'mg', n: 'Machine gun burst', openKm: 4.5 },
    { id: 'grenade', n: 'Hand grenade', openKm: 3 },
    { id: 'mortar', n: 'Mortar / artillery', openKm: 12 },
    { id: 'ied', n: 'Large IED / car bomb', openKm: 18 },
    { id: 'jet', n: 'Low-flying jet', openKm: 25 },
    { id: 'heli', n: 'Helicopter', openKm: 8 }
  ];
  var SOUND_TERRAIN = [
    { id: 'forest', n: 'Forest', f: 0.4 },
    { id: 'city', n: 'Urban', f: 0.5 },
    { id: 'open', n: 'Open ground', f: 1.0 },
    { id: 'wind', n: 'Downwind / inversion', f: 1.6 }
  ];
  function srcById(id) { return SOUND_SOURCES.filter(function (x) { return x.id === id; })[0]; }

  /* which sound source best stands for a catalogue item */
  function soundSourceFor(rec) {
    var t = (rec.n + ' ' + (rec.d || '')).toLowerCase();
    if (rec.cat === 'ball' && rec.sub === 'guns') {
      if (/pistol|glock|handgun|9\s?mm|92fs|p320|m9\b|m17\b/.test(t)) return 'pistol';
      if (/machine gun|minimi|m249|m240|\bmag\b|pkm|m2hb|browning|\bmg\b/.test(t)) return 'mg';
      return 'rifle';
    }
    if (rec.cat === 'ball' && rec.sub === 'blast') {
      if (/grenade/.test(t)) return 'grenade';
      if (/artillery|mortar|shell/.test(t)) return 'mortar';
      return 'ied';
    }
    return null;
  }

  /* ── canvas ring plot (used by the item-page graphics) ─────────────────── */

  function plotCanvas(canvas, rings, opts) {
    opts = opts || {};
    var dpr = global.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 300;
    canvas.width = cssW * dpr; canvas.height = cssW * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssW);
    var cx = cssW / 2, cy = cssW / 2, half = cssW / 2;

    if (!rings.length) return;
    var maxM = rings.reduce(function (a, r) { return Math.max(a, r.m); }, 1);
    var pxPerM = (half * 0.84) / maxM;

    var css = getComputedStyle(document.documentElement);
    var col = function (v) { return css.getPropertyValue(v).trim() || '#888'; };
    var mutedCol = col('--muted'), textCol = col('--text'), gridCol = col('--border');

    /* distance grid */
    var step = niceStep(maxM / 3);
    ctx.strokeStyle = gridCol; ctx.fillStyle = mutedCol;
    ctx.font = '9px ' + (col('--mono') || 'monospace'); ctx.lineWidth = 1;
    for (var g = step; g * pxPerM < half * 1.02; g += step) {
      var gr = g * pxPerM;
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(cx, cy, gr, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillText(A.U.fmtRange(g, { sig: 2 }), cx + 3, cy - gr - 2);
    }

    var inner = rings.slice().sort(function (a, b) { return a.m - b.m; });
    rings.slice().sort(function (a, b) { return b.m - a.m; }).forEach(function (r) {
      var i = inner.indexOf(r);
      var c = RING_COLOURS[Math.min(i, RING_COLOURS.length - 1)];
      var rr = r.m * pxPerM;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832);
      ctx.setLineDash(r.dashed ? [5, 4] : []);
      if (!r.dashed) { ctx.fillStyle = hexA(c, 0.12); ctx.fill(); }
      ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = c; ctx.font = '600 10px ' + (col('--font') || 'sans-serif');
      ctx.fillText(A.U.fmtRange(r.m, { sig: 3 }), cx + 5, cy - rr + 12);
    });

    /* centre crosshair */
    ctx.strokeStyle = textCol; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7); ctx.stroke();

    /* scale bar */
    var barM = niceStep(maxM / 3), barPx = barM * pxPerM;
    ctx.strokeStyle = textCol; ctx.lineWidth = 2;
    var bx = 12, by = cssW - 12;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + barPx, by);
    ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4);
    ctx.moveTo(bx + barPx, by - 4); ctx.lineTo(bx + barPx, by + 4); ctx.stroke();
    ctx.fillStyle = textCol; ctx.font = '10px ' + (col('--font') || 'sans-serif');
    ctx.fillText(A.U.fmtRange(barM, { sig: 2 }), bx, by - 6);
  }

  function niceStep(x) {
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), n = x / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }
  function hexA(hex, a) {
    var m = hex.replace('#', '');
    return 'rgba(' + parseInt(m.slice(0, 2), 16) + ',' + parseInt(m.slice(2, 4), 16) + ',' + parseInt(m.slice(4, 6), 16) + ',' + a + ')';
  }

  function legendCard(rings) {
    var card = A.UI.card(null, 'tight');
    rings.slice().sort(function (a, b) { return a.m - b.m; }).forEach(function (r, i) {
      var col = RING_COLOURS[Math.min(i, RING_COLOURS.length - 1)];
      var row = A.el('.rmap-leg');
      row.appendChild(A.el('span.rmap-dot', { style: { background: r.dashed ? 'transparent' : col, border: '2px solid ' + col } }));
      var mid = A.el('.rmap-leg-mid');
      mid.appendChild(A.el('.rmap-leg-t', { text: r.label }));
      if (r.sub) mid.appendChild(A.el('.rmap-leg-s', { text: r.sub }));
      row.appendChild(mid);
      row.appendChild(A.el('.rmap-leg-v', { text: A.U.fmtRange(r.m, { sig: 3 }) }));
      card.appendChild(row);
    });
    return card;
  }

  function graphicBlock(title, rings, note) {
    var frag = document.createDocumentFragment();
    frag.appendChild(A.UI.section(title));
    var wrap = A.el('.rgfx');
    var canvas = A.el('canvas.rgfx-canvas');
    wrap.appendChild(canvas);
    frag.appendChild(wrap);
    requestAnimationFrame(function () { plotCanvas(canvas, rings, {}); });
    frag.appendChild(legendCard(rings));
    if (note) frag.appendChild(A.UI.note(note));
    return frag;
  }

  /* the reach of a military asset's weapons: how far each one throws its
     round. This is the "asset range" - distinct from where the round lands. */
  function reachRings(rec) {
    var out = [], seen = {};
    (rec.arms || []).forEach(function (a) {
      [['effective', a.eff], ['maximum', a.max]].forEach(function (p) {
        if (!p[1] || p[1] <= 0) return;
        var key = Math.round(p[1]);
        if (seen[key]) return; seen[key] = 1;
        out.push({ label: a.n + ' - ' + p[0], m: p[1] });
      });
    });
    return out.sort(function (a, b) { return a.m - b.m; });
  }

  /* PUBLIC: the range graphics for an item's own page. Returns a fragment, or
     null if the item has nothing to plot.
       - firearms / explosives / nuclear: their own danger rings (distRings)
       - military assets: how far each weapon REACHES, and where its round
         LANDS (the projectile's own explosion rings), which are two different
         questions the receiving end and the firing end each ask
       - guns and explosives also get a sound-range graphic */
  A.rangeGraphic = function (rec) {
    if (!rec) return null;
    var frag = document.createDocumentFragment();
    var any = false;

    /* the direct danger-ring graphic is only for things whose dist figures ARE
       danger radii: firearms, explosives and nuclear yields. A vehicle's dist
       figures are its driving range, which is not a ring anyone stands inside,
       so those go through the reach/explosion path below instead. */
    if (rec.cat === 'ball' || rec.sub === 'nuke') {
      var rings = distRings(rec);
      if (rings.length) {
        frag.appendChild(graphicBlock('Range on the ground', rings,
          'Drawn to scale from the figures above. Ideal circles on flat ground: cover, terrain and construction change every one.'));
        any = true;
      }
    }

    /* military asset: weapon reach, then the explosion of each HE round */
    if (rec.cat === 'mil') {
      var reach = reachRings(rec);
      if (reach.length) {
        frag.appendChild(graphicBlock('Weapon reach', reach,
          'How far each weapon on this platform throws its round. Where the round LANDS and what it does there is shown below.'));
        any = true;
      }
      (rec.arms || []).forEach(function (a) {
        if (!a.lethal) return;
        var ex = [
          { label: 'Lethal radius', m: a.lethal, sub: 'blast and dense fragments, unprotected' },
          { label: 'Casualty radius', m: a.casualty, sub: 'casualty-producing in the open' },
          { label: 'Fragments reach', m: a.fragTo, sub: 'occasional lethal fragments' }
        ].filter(function (x) { return x.m > 0; });
        if (!ex.length) return;
        frag.appendChild(graphicBlock('Where its round lands: ' + a.n, ex,
          'The danger zone around the point of impact, not around the weapon. This is what "danger close" is measured from.'));
        any = true;
      });
    }

    var src = soundSourceFor(rec);
    if (src) {
      var s = srcById(src);
      var soundRings = SOUND_TERRAIN.map(function (t) {
        return { label: t.n, m: s.openKm * 1000 * t.f };
      }).sort(function (a, b) { return a.m - b.m; });
      frag.appendChild(graphicBlock('How far it is heard', soundRings,
        'Estimate for a ' + s.n.toLowerCase() + ', by the ground between you and it. Wind, temperature layering and time of day swing this more than any table can hold.'));
      any = true;
    }

    return any ? frag : null;
  };

  /* ══ MAP PAGE ════════════════════════════════════════════════════════════
     Just the map by default; an optional overlay of one range set. */

  var map = null, ringLayer = null, centreMarker = null, tileLayer = null;

  /* NAVIGATION is everything to do with where things are and how far away:
     the map itself, the chart work, the rangefinder and the distances between
     places. They were scattered across three sections, which meant a job that
     needs two of them needed two sections. Grouped by the QUESTION they answer
     rather than by the instrument they use, they all sit together. */
  A.Router.register('map', {
    render: function (host) {
      A.setTitle('Navigation');

      /* Two to a row, and the categories kept: the headings say what kind of
         question each pair answers, the grid keeps the whole section on one
         screen instead of a column of wide bars. */
      function pair(items) {
        var g = A.el('.lgrid');
        items.forEach(function (it) { g.appendChild(A.UI.row(it)); });
        host.appendChild(g);
      }

      /* -- MAPS, at the top: the maps are what people open this page for.
         Sun & Moon lives under Field tools now, so the map here is the ranger
         map alone. -- */
      host.appendChild(A.UI.section('Maps'));
      pair([{
        icon: 'target', title: 'Ranger map',
        sub: 'Drop weapon, blast, nuclear or sound ranges onto any location',
        onclick: function () { A.Router.go('rangemap'); }
      }]);

      /* -- INSTRUMENTS --
         The compass dial and the declination figure are the same question
         asked twice: which way the needle is lying, and by how much the
         needle is wrong for where you are standing. Declination used to be
         one chip among nine inside Sea navigation, which is chart work; it is
         a property of your position and belongs beside the dial. */
      host.appendChild(A.UI.section('Instruments'));
      pair([{
        icon: 'field', title: 'Compass',
        sub: 'Full dial, magnetic and true heading from the device',
        onclick: function () { A.Router.go('compass'); }
      }, {
        icon: 'range', title: 'Clinometer',
        sub: 'Angle of a slope or a target, by camera',
        onclick: function () { A.Router.go('clino'); }
      }]);
      pair([{
        icon: 'car', title: 'Fuel',
        sub: 'Fuel and range for land, sea and air, bent by the conditions',
        onclick: function () { A.Router.go('fuel'); }
      }]);

      host.appendChild(A.UI.section('How far'));
      pair([{
        icon: 'range', title: 'Rangefinder',
        sub: 'Distance by camera, by mil scale, and flash to bang',
        onclick: function () { A.Router.go('range'); }
      }, {
        icon: 'plane', title: 'Between places',
        sub: 'Road, helicopter and jet times between any two places',
        onclick: function () { A.store.set('field.tab', 'dist'); A.Router.go('field?tab=dist'); }
      }]);

      host.appendChild(A.UI.section('On land'));
      pair([{
        icon: 'range', title: 'Mountain',
        sub: 'Naismith timing, slope distance, height by angle, gradient',
        onclick: function () { A.Router.go('mountain'); }
      }, {
        icon: 'city', title: 'Urban',
        sub: 'Tools for built-up ground',
        onclick: function () { A.Router.go('urban'); }
      }]);

      host.appendChild(A.UI.section('On/in water'));
      pair([{
        icon: 'route', title: 'Sea navigation',
        sub: 'Sailings, chart scale, course to steer, tacking, EP',
        onclick: function () { A.store.set('field.tab', 'nav'); A.Router.go('field?tab=nav'); }
      }, {
        icon: 'route', title: 'Tides',
        sub: 'Offline tide prediction and curve, by port',
        onclick: function () { A.Router.go('tides'); }
      }]);
      pair([{
        icon: 'target', title: 'Scuba',
        sub: 'Gas, pressure, consumption, weighting, filling',
        onclick: function () { A.Router.go('scuba'); }
      }, {
        icon: 'range', title: 'Free-diving',
        sub: 'Lead weight for suit, salinity and depth',
        onclick: function () { A.Router.go('freedive'); }
      }]);

      /* the floating compass, switched on from the section it belongs to and
         then carried through the whole app */
      host.appendChild(A.UI.section('Heading'));
      var C = global.ArtNavCompass;
      var on = C && C.isOn();
      var mrow = A.el('.nav-auto');
      mrow.appendChild(A.el('span', { text: 'Keep a small compass on screen, on every page' }));
      mrow.appendChild(A.el('button.nav-toggle' + (on ? '.on' : ''), {
        text: on ? 'On' : 'Off',
        onclick: function () {
          if (!C) { A.toast('Compass unavailable'); return; }
          C.set(!C.isOn());
          A.haptic();
          A.Router.refresh();
        }
      }));
      host.appendChild(mrow);
    }
  });

  /* ══ RANGE MAP ═══════════════════════════════════════════════════════════
     One map. Below it, filter the catalogue by category (fire weapons,
     artillery, tanks, explosives, nuclear, and every other weapon-bearing
     group we hold), pick an item and drop it on the map. Any number of ranges
     can sit on the map at once; each can be dragged to a new place or removed. */

  var map = null, tileLayer = null;
  var layers = {};   /* placement key -> { marker, circles:[] } */
  var placeSeq = 0;

  /* ── offline tile cache ──────────────────────────────────────────────────
     Tiles you have already looked at are kept in a Cache Storage bucket, so a
     place you have panned over once is still there with no signal. The bucket
     is capped: when it is over the size you set in Settings, the oldest tiles
     are dropped. ~20 KB is a fair average for an OSM raster tile, so the byte
     limit becomes a tile count. */
  var TILE_CACHE = 'artemidos-tiles';
  var ORDER_KEY = 'map.tileOrder';
  var TILE_BYTES = 20000;
  function tileLimit() { return Math.max(200, Math.round((A.store.get('map.cacheMB', 100) * 1e6) / TILE_BYTES)); }

  function noteCached(url) {
    var order = A.store.get(ORDER_KEY, []);
    order.push(url);
    var over = order.length - tileLimit();
    if (over > 0 && global.caches) {
      var drop = order.splice(0, over);
      caches.open(TILE_CACHE).then(function (c) { drop.forEach(function (u) { c.delete(u); }); });
    }
    A.store.set(ORDER_KEY, order);
  }

  A.MapCache = {
    tiles: function () { return (A.store.get(ORDER_KEY, []) || []).length; },
    approxMB: function () { return Math.round(A.MapCache.tiles() * TILE_BYTES / 1e5) / 10; },
    clear: function () {
      A.store.set(ORDER_KEY, []);
      if (global.caches) return caches.delete(TILE_CACHE);
      return Promise.resolve();
    }
  };

  var CachedTileLayer = global.L ? L.TileLayer.extend({
    createTile: function (coords, done) {
      var tile = document.createElement('img');
      tile.setAttribute('role', 'presentation');
      tile.alt = '';
      var url = this.getTileUrl(coords);
      if (!global.caches) { tile.src = url; setTimeout(function () { done(null, tile); }, 0); return tile; }
      caches.open(TILE_CACHE).then(function (cache) {
        return cache.match(url).then(function (resp) {
          if (resp) return resp;
          return fetch(url, { mode: 'cors' }).then(function (net) {
            if (net && net.ok) { cache.put(url, net.clone()); noteCached(url); }
            return net;
          });
        });
      }).then(function (resp) {
        if (resp && resp.ok) return resp.blob();
        throw new Error('no tile');
      }).then(function (blob) {
        tile.src = URL.createObjectURL(blob);
      }).catch(function () { /* offline and not cached: blank tile */ })
        .then(function () { done(null, tile); });
      return tile;
    }
  }) : null;
  /* shared with the Sun & Moon map so it caches tiles the same way */
  A.CachedTileLayer = CachedTileLayer;

  /* the rings a catalogue item puts on the map: danger radii for weapons,
     explosives and nuclear; reach plus the round's explosion for a platform */
  function itemRings(rec) {
    var out = [];
    if (rec.cat === 'ball' || rec.sub === 'nuke') out = out.concat(distRings(rec));
    if (rec.cat === 'mil') {
      out = out.concat(reachRings(rec));
      (rec.arms || []).forEach(function (a) {
        if (!a.lethal) return;
        out.push({ label: 'Lethal · ' + a.n, m: a.lethal });
        if (a.casualty) out.push({ label: 'Casualty · ' + a.n, m: a.casualty });
        if (a.fragTo) out.push({ label: 'Fragments · ' + a.n, m: a.fragTo });
      });
      if (!out.length) out = out.concat(distRings(rec));
    }
    return out.filter(function (r) { return r.m > 0; }).sort(function (a, b) { return a.m - b.m; });
  }
  function hasRings(rec) { return itemRings(rec).length > 0; }

  var PLACE_COLOURS = ['#E5674F', '#5FD3B2', '#7FA8D9', '#E0A54F', '#C77FD9', '#4DD0E1', '#F06292', '#9CCC65'];

  /* categories built from the catalogue, so every weapon-bearing group we hold
     shows up: fire weapons and explosives, nuclear, sound, then every military
     subcategory that has something to plot (tanks, artillery, aircraft, ...) */
  function categories() {
    var cats = [
      { id: 'ball|guns', label: 'Fire weapons' },
      { id: 'ball|blast', label: 'Explosives & bombs' },
      { id: 'mil|nuke', label: 'Nuclear' }
    ];
    var mil = C.catOf('mil');
    (mil ? mil.subs : []).forEach(function (s) {
      if (s.id === 'nuke') return;
      if (C.in('mil', s.id).some(hasRings)) cats.push({ id: 'mil|' + s.id, label: s.n });
    });
    cats.push({ id: 'sound', label: 'Sound sources' });
    return cats;
  }
  function itemsInCat(catId) {
    if (catId === 'sound') return [];
    var p = catId.split('|');
    /* Sorted BY COUNTRY, then by name. A list of a hundred weapons ordered by
       whatever the catalogue happened to load first is unusable; grouped by
       country you go straight to the army you are looking at. Anything with no
       country falls to the end rather than sitting first under a blank. */
    return C.in(p[0], p[1]).filter(hasRings).slice().sort(function (a, b) {
      var ca = a.country || '￿', cb = b.country || '￿';
      if (ca !== cb) return ca < cb ? -1 : 1;
      return (a.n || '') < (b.n || '') ? -1 : 1;
    });
  }
  /* the country shown beside an item in the picker and the placement list */
  function itemCountry(rec) { return rec && rec.country ? rec.country : ''; }

  function render(host) {
    A.setTitle('Ranger map', { back: true });
    if (!global.L) { host.appendChild(A.UI.empty('Map engine failed to load.')); return; }

    var st = A.store.get('map.state', {
      placements: [], pins: [], lines: [], catg: 'ball|guns', itemId: null, sound: 'rifle', terrain: 'open',
      lat: null, lon: null, zoom: 13
    });
    if (!st.placements) st.placements = [];
    if (!st.pins) st.pins = [];
    if (!st.lines) st.lines = [];
    function save() { A.store.set('map.state', st); }

    /* ── the editor: pins, straight lines, and a distance/path measure ──
       All held in map.state and drawn on the same Leaflet map. */
    var pinLayers = {}, lineLayers = {}, pinSeq = 0, lineSeq = 0;
    var mode = 'none', lineTmp = [], measurePts = [], measureLayers = [];
    var editHost = A.el('div');

    var mapEl = A.el('.rmap-leaflet', { id: 'mapLeaflet' });
    host.appendChild(mapEl);

    var listHost = A.el('div');
    var pickHost = A.el('div');

    function buildPicker() {
      A.clear(pickHost);
      var cats = categories();
      if (!cats.some(function (c) { return c.id === st.catg; })) st.catg = cats[0].id;

      pickHost.appendChild(A.UI.section('Add a range'));
      pickHost.appendChild(A.UI.select({
        label: 'Category', value: st.catg,
        options: cats.map(function (c) { return { value: c.id, label: c.label }; }),
        onchange: function (e) { st.catg = e.target.value; st.itemId = null; save(); buildPicker(); }
      }));

      if (st.catg === 'sound') {
        pickHost.appendChild(A.UI.select({
          label: 'Sound source', value: st.sound,
          options: SOUND_SOURCES.map(function (s) { return { value: s.id, label: s.n }; }),
          onchange: function (e) { st.sound = e.target.value; save(); }
        }));
        pickHost.appendChild(A.UI.select({
          label: 'Ground between', value: st.terrain,
          options: SOUND_TERRAIN.concat([{ id: 'hills', n: 'Hills / mountain', f: 0.7 }]).map(function (t) { return { value: t.id, label: t.n }; }),
          onchange: function (e) { st.terrain = e.target.value; save(); }
        }));
      } else {
        var items = itemsInCat(st.catg);
        if (!st.itemId || !items.some(function (r) { return r.id === st.itemId; })) st.itemId = items[0] && items[0].id;
        pickHost.appendChild(A.UI.select({
          label: 'Item', value: st.itemId,
          options: items.map(function (r) {
            var c = itemCountry(r);
            return { value: r.id, label: (c ? c + '  ·  ' : '') + r.n };
          }),
          onchange: function (e) { st.itemId = e.target.value; save(); }
        }));
      }

      pickHost.appendChild(A.el('button.btn.block', {
        html: Icons.svg('plus') + ' Add to map',
        onclick: addPlacement
      }));
    }

    function placementRings(pl) {
      if (pl.catg === 'sound') {
        var s = srcById(pl.sound);
        var t = SOUND_TERRAIN.concat([{ id: 'hills', n: 'Hills / mountain', f: 0.7 }])
          .filter(function (x) { return x.id === pl.terrain; })[0] || SOUND_TERRAIN[2];
        var limit = s.openKm * 1000 * t.f;
        return { title: s.n + ' · ' + t.n, rings: [
          { label: 'Clearly audible', m: limit * 0.45 },
          { label: 'Outer audible limit', m: limit }
        ] };
      }
      var rec = C.item(pl.itemId);
      if (!rec) return { title: '(missing)', rings: [] };
      var cty = itemCountry(rec);
      var rings = itemRings(rec);
      /* how far the weapon is heard, from the app's sound model - drawn as a
         faint outline, no fill */
      var ss = soundSourceFor(rec), src = ss && srcById(ss);
      if (src) rings = rings.concat([{ label: 'Heard, open ground', m: src.openKm * 1000, kind: 'heard' }]);
      return { title: (cty ? cty + '  ·  ' : '') + rec.n, rings: rings };
    }

    function addPlacement() {
      var c = map.getCenter();
      var pl = {
        key: 'p' + (++placeSeq),
        catg: st.catg, itemId: st.itemId, sound: st.sound, terrain: st.terrain,
        lat: c.lat, lon: c.lng,
        colour: PLACE_COLOURS[st.placements.length % PLACE_COLOURS.length]
      };
      var data = placementRings(pl);
      if (!data.rings.length) { A.toast('Nothing to plot for that item'); return; }
      st.placements.push(pl); save();
      drawPlacement(pl);
      rebuildList();
      A.haptic();
      map.fitBounds(L.latLng(pl.lat, pl.lon).toBounds(data.rings[data.rings.length - 1].m * 2.4), { padding: [24, 24], maxZoom: 17 });
    }

    /* the point due north of a centre at a given radius, for ring labels */
    function northOf(lat, lon, m) { return [lat + m / 111320, lon]; }

    function drawPlacement(pl) {
      var data = placementRings(pl);
      var col = pl.colour;
      var circles = [], labels = [];
      var arr = data.rings.slice().sort(function (a, b) { return b.m - a.m; });
      arr.forEach(function (r, i) {
        var inFrac = (arr.length - i) / arr.length;
        /* maximum travel and the audible ring are references, not danger areas:
           no fill, a faint dashed outline. Colour and fill stay for the ranges
           that mean something - best aimed, effective, lethal, casualty. */
        var faint = r.kind === 'heard' || /maximum|travel/i.test(r.label);
        var ringCol = r.kind === 'heard' ? '#9aa0a6' : col;
        circles.push(L.circle([pl.lat, pl.lon], {
          radius: r.m, color: ringCol, weight: faint ? 1.4 : 2, opacity: faint ? 0.7 : 0.9,
          dashArray: faint ? '6,6' : null,
          fillColor: col, fillOpacity: faint ? 0 : (0.05 + 0.14 * inFrac)
        }).bindTooltip(r.label + ' · ' + A.U.fmtRange(r.m, { sig: 3 }), { sticky: true }).addTo(map));
        /* the distance WRITTEN ON the ring, at its northern edge - a phone
           has no hover, so the sticky tooltip alone told a finger nothing */
        var lab = L.marker(northOf(pl.lat, pl.lon, r.m), {
          interactive: false, keyboard: false,
          icon: L.divIcon({
            className: 'rmap-rlab',
            html: '<span style="border-color:' + col + '">' + A.U.fmtRange(r.m, { sig: 3 }) + '</span>',
            iconSize: [0, 0]
          })
        }).addTo(map);
        lab._ringM = r.m;
        labels.push(lab);
      });
      var icon = L.divIcon({ className: 'rmap-pin', html: '<span style="background:' + col + '"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
      var marker = L.marker([pl.lat, pl.lon], { icon: icon, draggable: true })
        .bindTooltip(data.title, { direction: 'top' })
        .addTo(map);
      marker.on('drag', function (e) {
        var ll = e.target.getLatLng();
        circles.forEach(function (cc) { cc.setLatLng(ll); });
        labels.forEach(function (lb) { lb.setLatLng(northOf(ll.lat, ll.lng, lb._ringM)); });
      });
      marker.on('dragend', function (e) {
        var ll = e.target.getLatLng();
        pl.lat = ll.lat; pl.lon = ll.lng; save();
      });
      layers[pl.key] = { marker: marker, circles: circles, labels: labels };
    }

    function removePlacement(key) {
      var l = layers[key];
      if (l) {
        map.removeLayer(l.marker);
        l.circles.forEach(function (c) { map.removeLayer(c); });
        (l.labels || []).forEach(function (c) { map.removeLayer(c); });
        delete layers[key];
      }
      st.placements = st.placements.filter(function (p) { return p.key !== key; });
      save(); rebuildList();
    }

    function rebuildList() {
      A.clear(listHost);
      if (!st.placements.length) {
        listHost.appendChild(A.UI.note('No ranges on the map yet. Pick a category and item below, then Add to map. Drag a marker to move its rings; the bin clears one.'));
        return;
      }
      listHost.appendChild(A.UI.section('On the map (' + st.placements.length + ')'));
      var card = A.UI.card(null, 'tight');
      st.placements.forEach(function (pl) {
        var data = placementRings(pl);
        var row = A.el('.rmap-place');
        row.appendChild(A.el('span.rmap-dot', { style: { background: pl.colour } }));
        var mid = A.el('.rmap-place-mid');
        mid.appendChild(A.el('.rmap-place-t', { text: data.title }));
        if (data.rings.length) mid.appendChild(A.el('.rmap-place-s', { text: data.rings.length + ' rings · ' + A.U.fmtRange(data.rings[data.rings.length - 1].m, { sig: 3 }) + ' out' }));
        row.appendChild(mid);
        row.appendChild(A.el('button.rmap-x', { html: Icons.svg('pin'), onclick: function () { map.setView([pl.lat, pl.lon], map.getZoom()); } }));
        row.appendChild(A.el('button.rmap-x.danger', { html: Icons.svg('trash'), onclick: function () { removePlacement(pl.key); } }));
        card.appendChild(row);
      });
      listHost.appendChild(card);
    }

    /* ══ PINS ══════════════════════════════════════════════════════════ */
    function pinColour(p) { return p.color || '#3FA46B'; }
    function fmtCoord(lat, lon) { return lat.toFixed(5) + ', ' + lon.toFixed(5); }
    function eastEdge(lat, lon, m) { return [lat, lon + m / (111320 * Math.cos(lat * Math.PI / 180))]; }

    function drawPin(p) {
      var col = pinColour(p);
      var icon = L.divIcon({ className: 'rmap-pin', html: '<span style="background:' + col + '"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
      var marker = L.marker([p.lat, p.lon], { icon: icon, draggable: true })
        .bindTooltip(p.name || 'Pin', { direction: 'top' }).addTo(map);
      var circle = null, handle = null;
      function drawCircle() {
        if (circle) { map.removeLayer(circle); circle = null; }
        if (handle) { map.removeLayer(handle); handle = null; }
        if (!(p.radius > 0)) return;
        circle = L.circle([p.lat, p.lon], { radius: p.radius, color: col, weight: 2, fillColor: col, fillOpacity: 0.18 }).addTo(map);
        var he = eastEdge(p.lat, p.lon, p.radius);
        handle = L.marker(he, { draggable: true, icon: L.divIcon({ className: 'rmap-handle', html: '', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(map);
        handle.on('drag', function (e) { var d = map.distance([p.lat, p.lon], e.target.getLatLng()); if (circle) circle.setRadius(d); });
        handle.on('dragend', function (e) { p.radius = Math.round(map.distance([p.lat, p.lon], e.target.getLatLng())); save(); drawCircle(); rebuildEditor(); });
      }
      drawCircle();
      marker.on('drag', function (e) {
        var ll = e.target.getLatLng();
        if (circle) circle.setLatLng(ll);
        if (handle) handle.setLatLng(eastEdge(ll.lat, ll.lng, p.radius));
      });
      marker.on('dragend', function (e) { var ll = e.target.getLatLng(); p.lat = ll.lat; p.lon = ll.lng; save(); rebuildEditor(); });
      pinLayers[p.key] = { marker: marker, redraw: drawCircle, remove: function () { map.removeLayer(marker); if (circle) map.removeLayer(circle); if (handle) map.removeLayer(handle); } };
    }
    function addPin() {
      var c = map.getCenter();
      var p = { key: 'pin' + (++pinSeq), lat: c.lat, lon: c.lng, name: 'Pin ' + (st.pins.length + 1), desc: '', radius: 0, color: PLACE_COLOURS[st.pins.length % PLACE_COLOURS.length] };
      st.pins.push(p); save(); drawPin(p); rebuildEditor(); A.haptic();
    }
    function removePin(key) {
      if (pinLayers[key]) { pinLayers[key].remove(); delete pinLayers[key]; }
      st.pins = st.pins.filter(function (x) { return x.key !== key; }); save(); rebuildEditor();
    }
    function copyPin(p) {
      var t = (p.name || 'Pin') + '\n' + (p.desc ? p.desc + '\n' : '') + fmtCoord(p.lat, p.lon) +
        (p.radius > 0 ? '\nRadius: ' + A.U.fmtRange(p.radius, { sig: 3 }) : '');
      try { navigator.clipboard.writeText(t); A.toast('Copied'); } catch (e) { A.toast(t); }
    }

    /* ══ LINES ═════════════════════════════════════════════════════════ */
    function drawLine(ln) {
      var pl = L.polyline(ln.pts, { color: '#7FA8D9', weight: 3, opacity: 0.9 }).addTo(map).bindTooltip(ln.name || 'Line', { sticky: true });
      lineLayers[ln.key] = { line: pl, remove: function () { map.removeLayer(pl); } };
    }
    function removeLine(key) {
      if (lineLayers[key]) { lineLayers[key].remove(); delete lineLayers[key]; }
      st.lines = st.lines.filter(function (x) { return x.key !== key; }); save(); rebuildEditor();
    }

    /* ══ MEASURE (scratch distance / path) ═════════════════════════════ */
    var measureReadout = A.el('.rmap-hint', { text: '' });
    function clearMeasure() {
      measureLayers.forEach(function (l) { map.removeLayer(l); }); measureLayers = []; measurePts = [];
      measureReadout.textContent = '';
    }
    function measureAdd(ll) {
      measurePts.push(ll);
      var m = L.circleMarker(ll, { radius: 4, color: '#E0A54F', fillColor: '#E0A54F', fillOpacity: 1 }).addTo(map);
      measureLayers.push(m);
      if (measurePts.length > 1) {
        var seg = L.polyline(measurePts, { color: '#E0A54F', weight: 2, dashArray: '6,5' }).addTo(map);
        measureLayers.push(seg);
        var total = 0;
        for (var i = 1; i < measurePts.length; i++) total += map.distance(measurePts[i - 1], measurePts[i]);
        var last = map.distance(measurePts[measurePts.length - 2], measurePts[measurePts.length - 1]);
        measureReadout.textContent = (measurePts.length === 2 ? 'Distance ' : 'Path ' + measurePts.length + ' pts · ') +
          A.U.fmtRange(total, { sig: 4 }) + (measurePts.length > 2 ? '  (last leg ' + A.U.fmtRange(last, { sig: 3 }) + ')' : '');
      } else measureReadout.textContent = 'Tap the next point';
    }

    function setMode(m) {
      mode = (mode === m) ? 'none' : m;
      lineTmp = [];
      if (mode !== 'measure') clearMeasure();
      rebuildEditor();
    }
    function onMapClick(e) {
      if (mode === 'line') {
        lineTmp.push([e.latlng.lat, e.latlng.lng]);
        if (lineTmp.length === 2) {
          var ln = { key: 'ln' + (++lineSeq), pts: lineTmp.slice(), name: 'Line ' + (st.lines.length + 1) };
          st.lines.push(ln); save(); drawLine(ln); lineTmp = []; mode = 'none'; rebuildEditor(); A.haptic();
        } else { measureReadout.textContent = 'Tap the second end of the line'; }
      } else if (mode === 'measure') {
        measureAdd(e.latlng);
      }
    }

    function rebuildEditor() {
      A.clear(editHost);
      editHost.appendChild(A.UI.section('Pins, lines & measure'));
      var bar = A.el('.rmap-tools');
      bar.appendChild(A.el('button.btn.ghost.sem-go' + (mode === 'none' ? '' : ''), { html: Icons.svg('pin') + ' Add pin', onclick: addPin }));
      bar.appendChild(A.el('button.btn.ghost' + (mode === 'line' ? '.on' : ''), { html: Icons.svg('route') + (mode === 'line' ? ' Tap two points…' : ' Add line'), onclick: function () { setMode('line'); } }));
      bar.appendChild(A.el('button.btn.ghost' + (mode === 'measure' ? '.on' : ''), { html: Icons.svg('range') + (mode === 'measure' ? ' Measuring…' : ' Measure'), onclick: function () { setMode('measure'); } }));
      editHost.appendChild(bar);
      if (mode === 'measure') {
        editHost.appendChild(measureReadout);
        editHost.appendChild(A.el('button.btn.ghost.block.sem-del', { text: 'Clear measurement', onclick: clearMeasure }));
      } else if (mode === 'line') {
        editHost.appendChild(A.UI.note('Tap the two ends of the line on the map.'));
      }

      /* pin list with inline edit */
      st.pins.forEach(function (p) {
        var card = A.UI.card(null, 'tight');
        var top = A.el('.rmap-place');
        top.appendChild(A.el('span.rmap-dot', { style: { background: pinColour(p) } }));
        top.appendChild(A.el('.rmap-place-mid', null, [
          A.el('.lrow-t', { text: p.name || 'Pin', style: { fontWeight: '650' } }),
          A.el('.lrow-s', { text: fmtCoord(p.lat, p.lon) + (p.radius > 0 ? '  ·  ' + A.U.fmtRange(p.radius, { sig: 3 }) : ''), style: { whiteSpace: 'normal' } })
        ]));
        top.appendChild(A.el('button.rmap-x', { html: Icons.svg('pin'), onclick: function () { map.setView([p.lat, p.lon], Math.max(map.getZoom(), 13)); } }));
        top.appendChild(A.el('button.rmap-x', { html: Icons.svg('copy'), onclick: function () { copyPin(p); } }));
        top.appendChild(A.el('button.rmap-x.danger', { html: Icons.svg('trash'), onclick: function () { removePin(p.key); } }));
        card.appendChild(top);

        card.appendChild(A.UI.field({ label: 'Name', value: p.name, oninput: function (e) { p.name = e.target.value; save(); if (pinLayers[p.key]) pinLayers[p.key].marker.setTooltipContent(p.name || 'Pin'); } }));
        card.appendChild(A.UI.field({ label: 'Description', value: p.desc, oninput: function (e) { p.desc = e.target.value; save(); } }));
        card.appendChild(A.UI.field({ label: 'Radius', inputmode: 'decimal', suffix: 'm', value: p.radius || '', placeholder: '0 = none',
          oninput: function (e) { p.radius = Math.max(0, A.parseNum(e.target.value) || 0); save(); if (pinLayers[p.key]) pinLayers[p.key].redraw(); } }));
        var pal = A.el('.rmap-pal');
        PLACE_COLOURS.forEach(function (c) {
          pal.appendChild(A.el('button.rmap-swatch' + (pinColour(p) === c ? '.on' : ''), {
            style: { background: c }, onclick: function () { p.color = c; save(); if (pinLayers[p.key]) { pinLayers[p.key].remove(); drawPin(p); } rebuildEditor(); }
          }));
        });
        card.appendChild(pal);
        editHost.appendChild(card);
      });

      /* line list */
      st.lines.forEach(function (ln) {
        var row = A.el('.rmap-place');
        row.appendChild(A.el('span.rmap-dot', { style: { background: '#7FA8D9' } }));
        var mid = A.el('.rmap-place-mid');
        var nf = A.UI.field({ label: '', value: ln.name, oninput: function (e) { ln.name = e.target.value; save(); if (lineLayers[ln.key]) lineLayers[ln.key].line.setTooltipContent(ln.name || 'Line'); } });
        mid.appendChild(nf);
        row.appendChild(mid);
        row.appendChild(A.el('button.rmap-x', { html: Icons.svg('pin'), onclick: function () { map.fitBounds(L.polyline(ln.pts).getBounds(), { padding: [30, 30] }); } }));
        row.appendChild(A.el('button.rmap-x.danger', { html: Icons.svg('trash'), onclick: function () { removeLine(ln.key); } }));
        editHost.appendChild(A.UI.card(null, 'tight'));
        editHost.lastChild.appendChild(row);
      });
    }

    var toolRow = A.el('.rmap-tools');
    var locBtn = A.el('button.btn.ghost', { html: Icons.svg('pin') + ' My location' });
    toolRow.appendChild(locBtn);
    toolRow.appendChild(A.el('span.rmap-hint', { text: 'Pan anywhere · drag a marker to move it' }));

    host.appendChild(toolRow);
    host.appendChild(editHost);
    host.appendChild(listHost);
    host.appendChild(pickHost);

    function initMap() {
      if (st.lat == null) { st.lat = 25.2048; st.lon = 55.2708; }
      map = L.map(mapEl, { zoomControl: true }).setView([st.lat, st.lon], st.zoom || 13);
      var TileCtor = CachedTileLayer || L.TileLayer;
      tileLayer = new TileCtor('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, crossOrigin: true, attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      /* free the blob URLs the cached layer makes, so panning does not leak */
      tileLayer.on('tileunload', function (e) {
        if (e.tile && e.tile.src && e.tile.src.indexOf('blob:') === 0) URL.revokeObjectURL(e.tile.src);
      });
      map.on('moveend', function () { var c = map.getCenter(); st.lat = c.lat; st.lon = c.lng; st.zoom = map.getZoom(); save(); });

      layers = {};
      st.placements.forEach(function (pl) { drawPlacement(pl); });
      st.pins.forEach(function (p) { drawPin(p); });
      st.lines.forEach(function (ln) { drawLine(ln); });
      map.on('click', onMapClick);
      buildPicker();
      rebuildList();
      rebuildEditor();

      if (navigator.geolocation && !A.store.get('map.located', false)) {
        navigator.geolocation.getCurrentPosition(function (p) {
          A.store.set('map.located', true);
          map.setView([p.coords.latitude, p.coords.longitude], 14);
        }, function () {}, { timeout: 8000, maximumAge: 60000 });
      }
    }

    locBtn.addEventListener('click', function () {
      if (!navigator.geolocation) { A.toast('No location service'); return; }
      A.toast('Locating…');
      navigator.geolocation.getCurrentPosition(function (p) {
        map.setView([p.coords.latitude, p.coords.longitude], 15);
      }, function () { A.toast('Could not get location'); }, { enableHighAccuracy: true, timeout: 8000 });
    });

    requestAnimationFrame(function () {
      initMap();
      setTimeout(function () { if (map) map.invalidateSize(); }, 120);
    });
  }


  A.Router.register('rangemap', {
    render: render,
    teardown: function () {
      if (map) { try { map.remove(); } catch (e) {} map = null; ringLayer = null; centreMarker = null; tileLayer = null; }
    }
  });

  /* ══ Sun & Moon map ════════════════════════════════════════════════════
     The sub-solar and sub-lunar points - where each body is directly overhead
     right now - plotted on a world map, with the day/night terminator and the
     night side shaded. All positions are computed on the device (ArtEphem);
     only the base tiles need a connection, and those cache. */
  var sunMap = null, sunTimer = null;
  function sunDot(color) {
    return L.divIcon({
      className: '', iconSize: [20, 20], iconAnchor: [10, 10],
      html: '<div style="width:18px;height:18px;border-radius:50%;background:' + color +
            ';border:2px solid rgba(0,0,0,.55);box-shadow:0 0 6px rgba(0,0,0,.6)"></div>'
    });
  }
  function fmtLL(p) {
    return Math.abs(p.lat).toFixed(1) + '°' + (p.lat >= 0 ? 'N' : 'S') + '  ' +
      Math.abs(p.lon).toFixed(1) + '°' + (p.lon >= 0 ? 'E' : 'W');
  }
  /* the sun & moon map, exposed so the Sun & Moon page can host it under its
     MAP tab. Returns its own teardown. */
  /* the world map: where the sun and moon are overhead, plus the day/night
     line. Returns its own teardown. */
  function renderSunMoonWorld(host) {
    var mapEl = A.el('.rmap-leaflet', { id: 'sunMapLeaflet' });
    host.appendChild(mapEl);
    var info = A.el('.note', { text: '' });
    host.appendChild(info);

    var sun = null, moon = null, term = null, night = null, me = null;
    function meDot() {
      return L.divIcon({
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
        html: '<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;' +
              'border:2px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.25)"></div>'
      });
    }
    function update() {
      if (!sunMap) return;
      var sp = global.ArtEphem.subPoints(new Date());
      [sun, moon, term, night].forEach(function (l) { if (l) sunMap.removeLayer(l); });
      sun = L.marker([sp.sun.lat, sp.sun.lon], { icon: sunDot('#f5c518') }).addTo(sunMap).bindPopup('Sun overhead');
      moon = L.marker([sp.moon.lat, sp.moon.lon], { icon: sunDot('#9aa0a6') }).addTo(sunMap).bindPopup('Moon overhead');
      var d = sp.sun.lat, l0 = sp.sun.lon, RAD = Math.PI / 180, DEG = 180 / Math.PI;
      if (Math.abs(d) > 0.3) {
        var pts = [];
        for (var lon = -180; lon <= 180; lon += 2) {
          pts.push([Math.atan(-Math.cos((lon - l0) * RAD) / Math.tan(d * RAD)) * DEG, lon]);
        }
        term = L.polyline(pts, { color: '#999', weight: 1.4, dashArray: '5,5', opacity: 0.85, interactive: false }).addTo(sunMap);
        var poly = pts.slice(), dark = (d > 0) ? -90 : 90;
        poly.push([dark, 180]); poly.push([dark, -180]);
        night = L.polygon(poly, { stroke: false, fillColor: '#000', fillOpacity: 0.3, interactive: false }).addTo(sunMap);
      }
      info.textContent = 'Sun overhead ' + fmtLL(sp.sun) + '   ·   Moon overhead ' + fmtLL(sp.moon);
    }

    requestAnimationFrame(function () {
      sunMap = L.map(mapEl, { zoomControl: true, worldCopyJump: true, minZoom: 1 }).setView([20, 0], 2);
      var TileCtor = A.CachedTileLayer || L.TileLayer;
      new TileCtor('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, crossOrigin: true, attribution: '© OpenStreetMap contributors'
      }).addTo(sunMap);
      update();
      sunTimer = setInterval(update, 30000);
      setTimeout(function () { if (sunMap) sunMap.invalidateSize(); }, 120);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (p) {
          if (!sunMap) return;
          var ll = [p.coords.latitude, p.coords.longitude];
          A.store.set('sunmoon.fix', { lat: ll[0], lon: ll[1] });
          if (me) sunMap.removeLayer(me);
          me = L.marker(ll, { icon: meDot() }).addTo(sunMap).bindPopup('You are here');
        }, function () {}, { timeout: 8000, maximumAge: 60000 });
      }
    });

    return function () {
      if (sunTimer) { clearInterval(sunTimer); sunTimer = null; }
      if (sunMap) { try { sunMap.remove(); } catch (e) {} sunMap = null; }
    };
  }

  /* the directions view: the sky around the observer as a cardinal cross, with
     the sun and moon placed by their compass bearing. Centre is straight up,
     the rim is the horizon. Bearings and altitudes are worked out from where
     the sun and moon are overhead, relative to the observer's position. */
  function renderSunMoonDirections(host) {
    var RAD = Math.PI / 180, DEG = 180 / Math.PI;
    var stage = A.el('.smd-stage');
    var rot = A.el('.smd-rot');
    var mapEl = A.el('.smd-map');
    var overlay = A.el('.smd-overlay');
    rot.appendChild(mapEl); rot.appendChild(overlay);
    stage.appendChild(rot);
    host.appendChild(stage);

    /* turn the map with a two-finger twist on it: the tiles and the cross turn
       together, while one finger still pans and a pinch still zooms */
    var rotDeg = 0;
    function applyRot() { rot.style.transform = 'rotate(' + rotDeg + 'deg)'; }
    applyRot();
    var twStart = null, twBase = 0;
    function twoAngle(t) { return Math.atan2(t[1].clientY - t[0].clientY, t[1].clientX - t[0].clientX) * 180 / Math.PI; }
    stage.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { twStart = twoAngle(e.touches); twBase = rotDeg; }
    }, true);
    stage.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && twStart != null) { rotDeg = twBase + (twoAngle(e.touches) - twStart); applyRot(); }
    }, true);
    stage.addEventListener('touchend', function (e) { if (e.touches.length < 2) twStart = null; }, true);
    var info = A.el('.note', { text: 'Waiting for your position…' }); host.appendChild(info);

    function bearing(la1, lo1, la2, lo2) {
      var p1 = la1 * RAD, p2 = la2 * RAD, dl = (lo2 - lo1) * RAD;
      var y = Math.sin(dl) * Math.cos(p2);
      var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
      return (Math.atan2(y, x) * DEG + 360) % 360;
    }
    function angDist(la1, lo1, la2, lo2) {
      var p1 = la1 * RAD, p2 = la2 * RAD, dp = (la2 - la1) * RAD, dl = (lo2 - lo1) * RAD;
      var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
      return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * DEG;
    }
    function brg(a) {
      a = ((a % 360) + 360) % 360;
      var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      return ('00' + Math.round(a)).slice(-3) + '° ' + dirs[Math.round(a / 45) % 8];
    }
    /* a small moon showing the current phase, for the moon marker */
    function moonDisc(cx, cy, r, age) {
      var c = Math.cos(age * RAD), sLit = (age < 180) ? 1 : -1, Np = 14, pts = [], i, y, x;
      for (i = 0; i <= Np; i++) { y = -r + 2 * r * i / Np; x = sLit * Math.sqrt(Math.max(0, r * r - y * y)); pts.push((cx + x).toFixed(1) + ' ' + (cy + y).toFixed(1)); }
      for (i = Np; i >= 0; i--) { y = -r + 2 * r * i / Np; x = sLit * c * Math.sqrt(Math.max(0, r * r - y * y)); pts.push((cx + x).toFixed(1) + ' ' + (cy + y).toFixed(1)); }
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#3a3f47" stroke="#fff" stroke-width="1.6"/>' +
        '<path d="M ' + pts.join(' L ') + ' Z" fill="#eef1f5"/>';
    }
    /* the cross and the sun/moon, drawn to sit legibly over map tiles */
    function buildOverlay(sAz, sAlt, mAz, mAlt, moonAge) {
      var C = 100, R = 68;
      function pos(az, alt) { var r = (alt < 0) ? R : R * (90 - alt) / 90; var a = az * RAD; return [C + r * Math.sin(a), C - r * Math.cos(a)]; }
      var s = '<circle cx="100" cy="100" r="' + R + '" fill="rgba(255,255,255,0.10)" stroke="rgba(0,0,0,0.5)" stroke-width="1.4"/>';
      [R * 2 / 3, R / 3].forEach(function (rr) { s += '<circle cx="100" cy="100" r="' + rr.toFixed(1) + '" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="1" stroke-dasharray="3,3"/>'; });
      s += '<line x1="100" y1="' + (100 - R) + '" x2="100" y2="' + (100 + R) + '" stroke="rgba(0,0,0,0.5)" stroke-width="1.3"/>';
      s += '<line x1="' + (100 - R) + '" y1="100" x2="' + (100 + R) + '" y2="100" stroke="rgba(0,0,0,0.5)" stroke-width="1.3"/>';
      function lab(x, y, anchor, txt, fill) {
        return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-size="13" font-weight="800" fill="' + fill + '" stroke="#fff" stroke-width="3.2" style="paint-order:stroke">' + txt + '</text>';
      }
      s += lab(100, 100 - R + 16, 'middle', 'N', '#c0392b');
      s += lab(100, 100 + R - 5, 'middle', 'S', '#1a1a1a');
      s += lab(100 + R - 5, 105, 'end', 'E', '#1a1a1a');
      s += lab(100 - R + 5, 105, 'start', 'W', '#1a1a1a');
      s += '<circle cx="100" cy="100" r="3" fill="#3b82f6" stroke="#fff" stroke-width="1.3"/>';
      /* sun */
      var sp2 = pos(sAz, sAlt), sBelow = sAlt < 0;
      s += '<line x1="100" y1="100" x2="' + sp2[0].toFixed(1) + '" y2="' + sp2[1].toFixed(1) + '" stroke="#f5c518" stroke-width="1.2" opacity="0.5"/>' +
        '<circle cx="' + sp2[0].toFixed(1) + '" cy="' + sp2[1].toFixed(1) + '" r="5.5" fill="' + (sBelow ? 'rgba(255,255,255,0.5)' : '#f5c518') + '" stroke="' + (sBelow ? '#f5c518' : '#fff') + '" stroke-width="1.6" opacity="' + (sBelow ? 0.75 : 1) + '"/>';
      /* moon, as its current phase */
      var mp2 = pos(mAz, mAlt), mBelow = mAlt < 0;
      s += '<line x1="100" y1="100" x2="' + mp2[0].toFixed(1) + '" y2="' + mp2[1].toFixed(1) + '" stroke="#9aa0a6" stroke-width="1.2" opacity="0.5"/>' +
        '<g opacity="' + (mBelow ? 0.7 : 1) + '">' + moonDisc(mp2[0], mp2[1], 6, moonAge) + '</g>';
      return '<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">' + s + '</svg>';
    }

    var dmap = null, timer = null, loc = A.store.get('sunmoon.fix', null), meMarker = null;
    function draw() {
      if (!loc) { overlay.innerHTML = ''; return; }
      var now = new Date();
      var sp = global.ArtEphem.subPoints(now);
      var moonAge = global.ArtEphem.moonPhase(now).age;
      var sAz = bearing(loc.lat, loc.lon, sp.sun.lat, sp.sun.lon), sAlt = 90 - angDist(loc.lat, loc.lon, sp.sun.lat, sp.sun.lon);
      var mAz = bearing(loc.lat, loc.lon, sp.moon.lat, sp.moon.lon), mAlt = 90 - angDist(loc.lat, loc.lon, sp.moon.lat, sp.moon.lon);
      overlay.innerHTML = buildOverlay(sAz, sAlt, mAz, mAlt, moonAge);
      info.textContent = 'Sun ' + brg(sAz) + ' · ' + Math.round(sAlt) + '° alt' + (sAlt < 0 ? ' (below)' : '') +
        '   ·   Moon ' + brg(mAz) + ' · ' + Math.round(mAlt) + '° alt' + (mAlt < 0 ? ' (below)' : '');
    }
    function ensureMap() {
      if (dmap || !loc) return;
      requestAnimationFrame(function () {
        if (dmap || !loc) return;
        dmap = L.map(mapEl, { zoomControl: true, attributionControl: false, dragging: true, doubleClickZoom: true, minZoom: 2, maxZoom: 19 }).setView([loc.lat, loc.lon], 14);
        var TileCtor = A.CachedTileLayer || L.TileLayer;
        new TileCtor('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, crossOrigin: true, attribution: '© OpenStreetMap contributors'
        }).addTo(dmap);
        meMarker = L.circleMarker([loc.lat, loc.lon], { radius: 4, color: '#3b82f6', weight: 2, fillColor: '#3b82f6', fillOpacity: 1 }).addTo(dmap);
        setTimeout(function () { if (dmap) dmap.invalidateSize(); }, 140);
        draw();
      });
    }
    if (loc) ensureMap();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (p) {
        loc = { lat: p.coords.latitude, lon: p.coords.longitude };
        A.store.set('sunmoon.fix', loc);
        if (!dmap) ensureMap();
        else { dmap.setView([loc.lat, loc.lon], dmap.getZoom(), { animate: false }); if (meMarker) meMarker.setLatLng([loc.lat, loc.lon]); draw(); }
      }, function () { if (!loc) info.textContent = 'Enable location to use this view, or open the world map once.'; }, { timeout: 8000, maximumAge: 60000 });
    } else if (!loc) { info.textContent = 'No position source on this device.'; }
    timer = setInterval(draw, 30000);
    return function () {
      if (timer) { clearInterval(timer); timer = null; }
      if (dmap) { try { dmap.remove(); } catch (e) {} dmap = null; }
    };
  }

  /* the Sun & Moon MAP tab: the directions view on top, the world map below. */
  function renderSunMoonMap(host) {
    if (!global.L || !global.ArtEphem) { host.appendChild(A.UI.empty('Map or ephemeris unavailable.')); return function () {}; }
    host.appendChild(A.el('.sec-lab', { text: 'Directions' }));
    var dHost = A.el('div'); host.appendChild(dHost);
    host.appendChild(A.el('.sec-lab', { text: 'World map', style: { marginTop: '14px' } }));
    var wHost = A.el('.smd-world-host'); host.appendChild(wHost);
    var dStop = renderSunMoonDirections(dHost);
    var wStop = renderSunMoonWorld(wHost);
    return function () { try { dStop(); } catch (e) {} try { wStop(); } catch (e) {} };
  }
  A.SunMoonMap = renderSunMoonMap;

})(window);

