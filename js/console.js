/*
 * Artemidos - Console: the home screen, arranged by whoever carries it
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Everything else in this app is organised the way the SUBJECT is organised:
 * ballistics with ballistics, radio with radio. That is right for reference and
 * wrong for a job, because a job draws two tools from one section and one from
 * another. The Console is the answer: the user pins the handful of things this
 * task actually needs, and they sit one tap from opening the app.
 *
 * It also carries clocks. Working across time zones is where mistakes are made
 * that look like incompetence - a call missed by an hour, a curfew misjudged -
 * and a row of named clocks costs nothing to read and settles it.
 */
(function (global) {
  'use strict';

  var SHORTCUTS_KEY = 'console.shortcuts';
  var CLOCKS_KEY = 'console.clocks';

  /* Everything that can be pinned. Kept as a flat list of route + label so a
     shortcut is just a string, and adding a tool anywhere in the app is one
     line here rather than a new mechanism. */
  /* Checked against the routes the app actually registers, rather than kept by
     hand and drifting. Two things were wrong and both were invisible from the
     list itself:

     'map' was labelled "Range map". That route became the NAVIGATION page when
     the sections were reorganised, and the real range map moved to 'rangemap'.
     Anyone who pinned "Range map" got the Navigation menu, and Navigation
     could not be pinned at all because nothing in this list pointed at it.

     Several tools live as a sub-tab of a page rather than as a route of their
     own - Morse, War Pigeon and the Planner are all inside Radio - and there
     was no way to express "this page, on that tab". A target may now carry
     `set`, a stored key and value applied on the way in, so those become
     pinnable without inventing a route for each. */
  function catalogueTargets() {
    var out = [
      /* the four sections */
      { id: 'speed', label: 'Recon', icon: 'recon' },
      { id: 'map', label: 'Navigation', icon: 'globe' },
      { id: 'field', label: 'Field tools', icon: 'field' },
      { id: 'console', label: 'Console', icon: 'grid' },

      /* navigation */
      { id: 'rangemap', label: 'Ranger map', icon: 'target' },
      { id: 'compass', label: 'Compass', icon: 'field' },
      { id: 'range', label: 'Rangefinder', icon: 'range' },
      { id: 'field?tab=nav', label: 'Sea navigation', icon: 'route' },
      { id: 'field?tab=nav', label: 'Distance off', icon: 'globe', set: ['nav.tab', 'doff'] },
      { id: 'field?tab=nav', label: 'Course to steer', icon: 'route', set: ['nav.tab', 'cts'] },
      { id: 'field?tab=nav', label: 'Tacking', icon: 'ship', set: ['nav.tab', 'tack'] },
      { id: 'field?tab=dist', label: 'Distance between places', icon: 'plane' },

      /* field tools */
      { id: 'calc', label: 'Calculator', icon: 'calc' },
      { id: 'convert', label: 'Converter', icon: 'convert' },
      { id: 'field?tab=notes', label: 'Notebook', icon: 'grid' },
      { id: 'field?tab=time', label: 'Time tools', icon: 'clock' },
      { id: 'field?tab=fx', label: 'Currency', icon: 'money' },
      { id: 'field?tab=ph', label: 'Phonetic alphabets', icon: 'language' },

      /* radio, and the tools that live inside it */
      { id: 'field?tab=radio', label: 'Radio', icon: 'radio' },
      { id: 'field?tab=radio', label: 'Radio range', icon: 'radio', set: ['radio.tab', 'range'] },
      { id: 'field?tab=radio', label: 'Radios', icon: 'radio', set: ['radio.tab', 'sets'] },
      { id: 'field?tab=radio', label: 'Morse', icon: 'morse', set: ['radio.tab', 'morse'] },
      { id: 'field?tab=radio', label: 'War Pigeon', icon: 'sound', set: ['radio.tab', 'pigeon'] },
      { id: 'field?tab=radio', label: 'Radio planner', icon: 'radio', set: ['radio.tab', 'plan'] },

      /* maths and measurement */
      { id: 'graph', label: 'Graph', icon: 'graph' },
      { id: 'solver', label: 'Solver', icon: 'sigma' },
      { id: 'stats', label: 'Statistics', icon: 'stats' },
      { id: 'ratio', label: 'Scale & ratio', icon: 'ratio' },
      { id: 'shadow', label: 'Height from shadow', icon: 'shadow' },
      { id: 'flash', label: 'Flash-to-bang', icon: 'bolt' },

      /* reference and the app itself */
      { id: 'country', label: 'Countries', icon: 'globe' },
      { id: 'guide', label: 'Huntress Guide', icon: 'arrows' },
      { id: 'about', label: 'About Artemidos', icon: 'info' },
      { id: 'settings', label: 'Settings', icon: 'settings' },
      { id: 'apps', label: 'Other apps', icon: 'plug' },
      { id: 'network', label: 'What uses the network', icon: 'globe' }
    ];
    /* every Recon category and subcategory, so anything in the catalogue can
       be pinned without naming it here */
    var C = global.ART_CATALOG;
    if (C) {
      C.cats().forEach(function (cat) {
        out.push({ id: 'speed/' + cat.id, label: cat.n, icon: cat.icon || 'recon' });
        (cat.subs || []).forEach(function (s) {
          out.push({ id: 'speed/' + cat.id + '/' + s.id, label: cat.n + ' · ' + s.n, icon: s.icon || cat.icon || 'recon' });
        });
      });
    }
    return out;
  }

  /* ids that shipped wrong once: route-backed tools are screens, not tabs */
  var LEGACY_IDS = { 'field?tab=calc': 'calc', 'field?tab=convert': 'convert',
                     'field?tab=airports': 'field?tab=air', 'field?tab=abc': 'field?tab=ph' };

  /* A shortcut may name a stored setting to apply before it opens: that is how
     a tool living as a sub-tab gets pinned. Anything without one is unaffected,
     so shortcuts saved before this existed keep working untouched. */
  function openShortcut(sc) {
    if (sc.set && sc.set.length === 2) A.store.set(sc.set[0], sc.set[1]);
    A.Router.go(sc.id);
  }
  function shortcuts() {
    var s = A.store.get(SHORTCUTS_KEY, null) || defaultShortcuts();
    var fixed = false;
    s.forEach(function (x) { if (LEGACY_IDS[x.id]) { x.id = LEGACY_IDS[x.id]; fixed = true; } });
    if (fixed) setShortcuts(s);
    return s;
  }
  function setShortcuts(s) { A.store.set(SHORTCUTS_KEY, s); }
  function defaultShortcuts() {
    return [
      { id: 'speed', label: 'Recon', icon: 'recon' },
      { id: 'rangemap', label: 'Ranger map', icon: 'target' },
      { id: 'field?tab=radio', label: 'Radio', icon: 'radio' },
      { id: 'field?tab=notes', label: 'Notebook', icon: 'grid' },
      { id: 'range', label: 'Rangefinder', icon: 'range' },
      { id: 'calc', label: 'Calculator', icon: 'calc' }
    ];
  }

  /* ── clocks ───────────────────────────────────────────────────────────────
     The IANA zone list the device already knows is used, so no table needs
     shipping and daylight saving is handled by the platform rather than by a
     rule I would have to keep correct. */
  var COMMON_ZONES = [
    ['Asia/Dubai', 'Dubai'], ['Europe/London', 'London'], ['Europe/Lisbon', 'Lisbon'],
    ['Europe/Paris', 'Paris'], ['Europe/Berlin', 'Berlin'], ['Europe/Rome', 'Rome'],
    ['Europe/Madrid', 'Madrid'], ['Europe/Moscow', 'Moscow'], ['Europe/Kyiv', 'Kyiv'],
    ['Europe/Istanbul', 'Istanbul'], ['Africa/Cairo', 'Cairo'], ['Africa/Lagos', 'Lagos'],
    ['Africa/Nairobi', 'Nairobi'], ['Africa/Johannesburg', 'Johannesburg'],
    ['America/New_York', 'New York'], ['America/Chicago', 'Chicago'],
    ['America/Denver', 'Denver'], ['America/Los_Angeles', 'Los Angeles'],
    ['America/Sao_Paulo', 'São Paulo'], ['America/Bogota', 'Bogotá'],
    ['America/Mexico_City', 'Mexico City'], ['America/Buenos_Aires', 'Buenos Aires'],
    ['Asia/Riyadh', 'Riyadh'], ['Asia/Tehran', 'Tehran'], ['Asia/Karachi', 'Karachi'],
    ['Asia/Kolkata', 'Delhi'], ['Asia/Dhaka', 'Dhaka'], ['Asia/Bangkok', 'Bangkok'],
    ['Asia/Singapore', 'Singapore'], ['Asia/Hong_Kong', 'Hong Kong'],
    ['Asia/Shanghai', 'Shanghai'], ['Asia/Tokyo', 'Tokyo'], ['Asia/Seoul', 'Seoul'],
    ['Australia/Sydney', 'Sydney'], ['Pacific/Auckland', 'Auckland'], ['UTC', 'UTC']
  ];

  function clocks() {
    var c = A.store.get(CLOCKS_KEY, null);
    if (!c) { c = [{ tz: 'local', name: 'Here' }, { tz: 'UTC', name: 'UTC' }]; A.store.set(CLOCKS_KEY, c); }
    return c;
  }
  function setClocks(c) { A.store.set(CLOCKS_KEY, c); }

  function timeIn(tz) {
    var d = new Date();
    try {
      if (tz === 'local') {
        return { time: pad(d.getHours()) + 'h' + pad(d.getMinutes()), day: dayName(d), off: null };
      }
      var f = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
        weekday: 'short', day: '2-digit', month: 'short'
      });
      var parts = {};
      f.formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
      return {
        time: parts.hour + 'h' + parts.minute,
        day: parts.weekday + ' ' + parts.day + ' ' + parts.month,
        off: offsetHours(d, tz)
      };
    } catch (e) { return { time: '--h--', day: 'zone unavailable', off: null }; }
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayName(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
  }
  /* difference from the device's own clock, which is the number that matters */
  function offsetHours(d, tz) {
    try {
      var here = new Date(d.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
      var there = new Date(d.toLocaleString('en-US', { timeZone: tz }));
      return Math.round((there - here) / 3600000 * 10) / 10;
    } catch (e) { return null; }
  }

  /* ── pickers ──────────────────────────────────────────────────────────── */

  function pickShortcut(onPick) {
    var all = catalogueTargets();
    var ov = A.el('.place-ov');
    var box = A.el('.place-box');
    var head = A.el('.place-head');
    head.appendChild(A.el('span.place-title', { text: 'Add a shortcut' }));
    head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { ov.remove(); } }));
    box.appendChild(head);
    var sw = A.el('.place-search');
    var list = A.el('.place-list');
    box.appendChild(sw); box.appendChild(list);

    function paint(q) {
      A.clear(list);
      q = (q || '').trim().toLowerCase();
      /* search both the English name and the translated one, so a French
         reader can type either "Boussole" or "Compass" and find the tool */
      var rows = all.filter(function (t) {
        return !q || A.skey(t.label + ' ' + A.tr(t.label) + ' ' + t.id).indexOf(A.skey(q)) >= 0;
      }).slice(0, 200);
      if (!rows.length) { list.appendChild(A.UI.empty('Nothing matches that.')); return; }
      rows.forEach(function (t) {
        list.appendChild(A.UI.row({
          icon: t.icon, title: A.tr(t.label), sub: t.id + (t.set ? '  ·  ' + t.set[1] : ''),
          onclick: function () { ov.remove(); onPick(t); }
        }));
      });
    }
    sw.appendChild(A.UI.search('Search tools and sections…', paint));
    paint('');
    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  function pickClock(onPick) {
    var ov = A.el('.place-ov');
    var box = A.el('.place-box');
    var head = A.el('.place-head');
    head.appendChild(A.el('span.place-title', { text: 'Add a clock' }));
    head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { ov.remove(); } }));
    box.appendChild(head);
    var sw = A.el('.place-search');
    var list = A.el('.place-list');
    box.appendChild(sw); box.appendChild(list);

    /* every zone the device knows, if it will tell us; the common list if not */
    var zones = COMMON_ZONES.slice();
    try {
      if (Intl.supportedValuesOf) {
        var extra = Intl.supportedValuesOf('timeZone');
        var have = {};
        zones.forEach(function (z) { have[z[0]] = 1; });
        extra.forEach(function (z) { if (!have[z]) zones.push([z, z.split('/').pop().replace(/_/g, ' ')]); });
      }
    } catch (e) { /* the common list is enough */ }

    function paint(q) {
      A.clear(list);
      q = (q || '').trim().toLowerCase();
      var rows = zones.filter(function (z) {
        return !q || z[1].toLowerCase().indexOf(q) >= 0 || z[0].toLowerCase().indexOf(q) >= 0;
      }).slice(0, 200);
      if (!rows.length) { list.appendChild(A.UI.empty('No zone matches that.')); return; }
      rows.forEach(function (z) {
        var t = timeIn(z[0]);
        list.appendChild(A.UI.row({
          plain: true, title: z[1], sub: z[0] + '  ·  ' + t.time,
          onclick: function () { ov.remove(); onPick({ tz: z[0], name: z[1] }); }
        }));
      });
    }
    sw.appendChild(A.UI.search('Search city or zone…', paint));
    paint('');
    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  /* ── the page ─────────────────────────────────────────────────────────── */

  var tick = 0;

  /* ══ SAFE MODE ═════════════════════════════════════════════════════════
     What the limited duress PIN opens. It is not the Console with things
     switched off - it is a different, smaller app, and that distinction is
     the whole point.

     A screen that shows greyed-out buttons, or a bottom bar whose other tabs
     do nothing, tells the person standing over you that there is more here
     and that you have not given it to them. So none of it is drawn: two
     tools, no tab bar, no shortcuts, no clocks, no settings, nothing to
     scroll to. Somebody who has never seen Artemidos sees a calculator with a
     converter attached, and there is nothing on screen to contradict that. */
  function renderSafe(host) {
    A.setTitle('Console');
    var grid = A.el('.tiles');
    [
      { id: 'calc', n: 'Calculator', s: 'Scientific calculator and maths tools', ic: 'calc' },
      { id: 'convert', n: 'Converter', s: 'Full unit converter, every measure', ic: 'convert' }
    ].forEach(function (t) {
      var tile = A.el('button.tile', {
        onclick: function () { A.haptic(); A.Router.go(t.id); }
      });
      tile.appendChild(A.el('span.tile-ic', { html: Icons.svg(t.ic) }));
      var mid = A.el('.tile-mid');
      mid.appendChild(A.el('.tile-t', { text: t.n }));
      mid.appendChild(A.el('.tile-s', { text: t.s }));
      tile.appendChild(mid);
      grid.appendChild(tile);
    });
    host.appendChild(grid);
  }

  function render(host) {
    var L = global.ArtLock;
    if (L && L.isLimited()) { renderSafe(host); return; }

    A.setTitle('Console');
    var editing = A.store.get('console.editing', false);

    /* ── the wordmark at the top, as on the About page (no version) ── */
    host.appendChild(A.el('.card', { style: { textAlign: 'center', padding: '22px 18px', marginBottom: '12px' } }, [
      A.el('div', { html: Icons.mark(64), style: { color: 'var(--acc)', display: 'flex', justifyContent: 'center', marginBottom: '12px' } }),
      A.el('div', { text: 'ARTEMIDOS', style: { fontSize: '18px', fontWeight: '300', letterSpacing: '.4em', textIndent: '.4em' } }),
      A.el('div', { text: 'From Artemis', style: { fontSize: '11px', letterSpacing: '.28em', textIndent: '.28em', color: 'var(--muted)', marginTop: '6px' } })
    ]));

    /* ── shortcuts ── */
    var scHost = A.el('div');
    host.appendChild(scHost);

    function paintShortcuts() {
      A.clear(scHost);
      var list = shortcuts();
      var head = A.el('.con-head');
      head.appendChild(A.el('span.sec-lab', { text: 'Shortcuts', style: { margin: '0' } }));
      head.appendChild(A.el('button.con-edit', {
        text: editing ? 'Done' : 'Edit',
        onclick: function () { editing = !editing; A.store.set('console.editing', editing); paintShortcuts(); }
      }));
      scHost.appendChild(head);

      if (!list.length) {
        scHost.appendChild(A.UI.note('No shortcuts yet. Tap Edit, then Add, to pin the tools you use.'));
      }

      var grid = A.el('.con-grid');
      list.forEach(function (sc, i) {
        var tile = A.el('button.con-tile', {
          onclick: function () {
            if (editing) return;
            A.haptic();
            openShortcut(sc);
          }
        });
        tile.appendChild(A.el('span.con-ic', { html: Icons.svg(sc.icon || 'grid') }));
        /* Shortcut labels are stored in English on the device, because that is
           the key the catalogue is looked up by. Translate on the way to the
           screen so a pinned tile follows the app language instead of being
           frozen in whatever language it was pinned in. */
        tile.appendChild(A.el('span.con-lab', { text: A.tr(sc.label) }));
        if (editing) {
          var tools = A.el('.con-tools');
          /* Left only, which meant a tile could be moved up the order and never
             back down: to undo one tap you had to walk every other tile past
             it. Both directions, and each is hidden at the end where it would
             do nothing rather than sitting there dead. */
          if (i > 0) tools.appendChild(A.el('button.con-x', {
            html: Icons.svg('back'), title: 'Move left',
            onclick: function (e) {
              e.stopPropagation();
              var l = shortcuts(); var t = l[i - 1]; l[i - 1] = l[i]; l[i] = t;
              setShortcuts(l); A.haptic(); paintShortcuts();
            }
          }));
          if (i < list.length - 1) tools.appendChild(A.el('button.con-x', {
            html: '<span style="display:inline-block;transform:scaleX(-1)">' + Icons.svg('back') + '</span>',
            title: 'Move right',
            onclick: function (e) {
              e.stopPropagation();
              var l = shortcuts(); var t = l[i + 1]; l[i + 1] = l[i]; l[i] = t;
              setShortcuts(l); A.haptic(); paintShortcuts();
            }
          }));
          tools.appendChild(A.el('button.con-x.danger', {
            html: Icons.svg('trash'), title: 'Remove',
            onclick: function (e) {
              e.stopPropagation();
              var l = shortcuts(); l.splice(i, 1); setShortcuts(l); paintShortcuts();
            }
          }));
          tile.appendChild(tools);
        }
        grid.appendChild(tile);
      });

      if (editing) {
        var add = A.el('button.con-tile.con-add', {
          onclick: function () {
            pickShortcut(function (t) {
              var l = shortcuts();
              l.push({ id: t.id, label: t.label, icon: t.icon, set: t.set });
              setShortcuts(l); paintShortcuts();
            });
          }
        });
        add.appendChild(A.el('span.con-ic', { html: Icons.svg('plus') }));
        add.appendChild(A.el('span.con-lab', { text: 'Add' }));
        grid.appendChild(add);
      }
      scHost.appendChild(grid);

      if (editing) {
        scHost.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('refresh') + ' Reset to defaults',
          style: { marginTop: '8px' },
          onclick: function () {
            if (!confirm('Reset shortcuts to the defaults?')) return;
            setShortcuts(defaultShortcuts()); paintShortcuts();
          }
        }));
      }
    }
    paintShortcuts();

    /* ── what is running right now ── */
    var actHost = A.el('div');
    host.appendChild(actHost);

    function paintActivity() {
      A.clear(actHost);
      var rows = [];

      if (global.ArtTime && ArtTime.status) {
        var t = ArtTime.status();
        if (t.stopwatch.any) rows.push({ icon: 'clock', label: 'Stopwatch', value: t.stopwatch.text, live: t.stopwatch.running, go: 'field?tab=time' });
        if (t.timer.any) rows.push({ icon: 'clock', label: 'Timer', value: t.timer.text + ' left', live: t.timer.running, go: 'field?tab=time' });
        if (t.alarms.armed) {
          var nx = t.alarms.next;
          rows.push({
            icon: 'clock',
            label: t.alarms.armed + (t.alarms.armed === 1 ? ' alarm armed' : ' alarms armed'),
            value: nx ? pad(nx.at.getHours()) + 'h' + pad(nx.at.getMinutes()) : '-',
            live: true, go: 'field?tab=time'
          });
        }
      }
      if (global.A.WarPigeon && A.WarPigeon.isListening && A.WarPigeon.isListening()) {
        rows.push({ icon: 'radio', label: 'War Pigeon listening', value: 'on', live: true, go: 'field?tab=radio' });
      }

      if (!rows.length) return;

      var head = A.el('.con-head');
      head.appendChild(A.el('span.sec-lab', { text: 'Running now', style: { margin: '0' } }));
      actHost.appendChild(head);
      var card = A.UI.card(null, 'tight');
      rows.forEach(function (r) {
        var row = A.el('button.act-row', { onclick: function () { A.haptic(); A.Router.go(r.go); } });
        row.appendChild(A.el('span.act-dot' + (r.live ? '.live' : '')));
        row.appendChild(A.el('span.act-lab', { text: A.tr(r.label) }));
        row.appendChild(A.el('span.act-val', { text: A.tr(r.value) }));
        card.appendChild(row);
      });
      actHost.appendChild(card);
    }
    paintActivity();

    /* ── clocks ── */
    var clkHost = A.el('div');
    host.appendChild(clkHost);
    var clkEdit = false;

    function paintClocks() {
      A.clear(clkHost);
      var list = clocks();
      var head = A.el('.con-head');
      head.appendChild(A.el('span.sec-lab', { text: 'Clocks', style: { margin: '0' } }));
      head.appendChild(A.el('button.con-edit', {
        text: clkEdit ? 'Done' : 'Edit',
        onclick: function () { clkEdit = !clkEdit; paintClocks(); }
      }));
      clkHost.appendChild(head);

      if (!list.length && !clkEdit) {
        clkHost.appendChild(A.UI.note('No clocks. Tap Edit, then Add, to follow a city.'));
        return;
      }

      var grid = A.el('.clk-grid');
      list.forEach(function (c, i) {
        var t = timeIn(c.tz);
        var cell = A.el('.clk');
        cell.appendChild(A.el('.clk-name', { text: c.name }));
        cell.appendChild(A.el('.clk-time', { text: t.time }));
        cell.appendChild(A.el('.clk-day', { text: t.day + (t.off != null && t.off !== 0 ? '  ·  ' + (t.off > 0 ? '+' : '') + t.off + ' h' : '') }));
        if (clkEdit) {
          var tools = A.el('.con-tools');
          tools.appendChild(A.el('button.con-x', {
            html: Icons.svg('back'), title: 'Move earlier',
            onclick: function () {
              if (i === 0) return;
              var l = clocks(); var t2 = l[i - 1]; l[i - 1] = l[i]; l[i] = t2;
              setClocks(l); paintClocks();
            }
          }));
          tools.appendChild(A.el('button.con-x', {
            html: '<span style="display:inline-block;transform:scaleX(-1)">' + Icons.svg('back') + '</span>', title: 'Move later',
            onclick: function () {
              if (i >= list.length - 1) return;
              var l = clocks(); var t3 = l[i + 1]; l[i + 1] = l[i]; l[i] = t3;
              setClocks(l); paintClocks();
            }
          }));
          tools.appendChild(A.el('button.con-x.danger', {
            html: Icons.svg('trash'), title: 'Remove',
            onclick: function () { var l = clocks(); l.splice(i, 1); setClocks(l); paintClocks(); }
          }));
          cell.appendChild(tools);
        }
        grid.appendChild(cell);
      });
      clkHost.appendChild(grid);

      if (clkEdit) {
        clkHost.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('plus') + ' Add a clock',
          style: { marginTop: '8px' },
          onclick: function () {
            pickClock(function (c) { var l = clocks(); l.push(c); setClocks(l); paintClocks(); });
          }
        }));
      }
    }
    paintClocks();

    /* ── the standing pages, under their own heading ── */
    host.appendChild(A.UI.section('Huntress'));
    var links = A.el('.lgrid', { style: { marginTop: '4px' } });
    /* Icon and title only. The one-line descriptions explained what each page
       was for, which is worth reading once and is clutter every time after:
       four double-height rows to reach four pages the user already knows. */
    links.appendChild(A.UI.row({
      iconHtml: Icons.mark(24), title: 'About Artemidos',
      onclick: function () { A.haptic(); A.Router.go('about'); }
    }));
    links.appendChild(A.UI.row({
      icon: 'arrows', title: 'Huntress Guide',
      onclick: function () { A.haptic(); A.Router.go('guide'); }
    }));
    links.appendChild(A.UI.row({
      icon: 'plug', title: 'Other apps',
      onclick: function () { A.haptic(); A.Router.go('apps'); }
    }));
    links.appendChild(A.UI.row({
      icon: 'settings', title: 'Settings',
      onclick: function () { A.haptic(); A.Router.go('settings'); }
    }));
    host.appendChild(links);

    /* the maker's name, quietly at the foot */
    host.appendChild(A.el('div', {
      text: 'Atavistic Concept',
      style: { textAlign: 'center', color: 'var(--muted)', fontSize: '12px', letterSpacing: '.18em', textIndent: '.18em', margin: '20px 0 8px' }
    }));

    /* keep the clocks and the activity list honest without redrawing the page */
    clearInterval(tick);
    tick = setInterval(function () {
      if (!document.body.contains(clkHost)) { clearInterval(tick); return; }
      paintClocks();
      paintActivity();
    }, 1000);
  }

  A.Router.register('console', { render: render, teardown: function () { clearInterval(tick); } });

  global.ArtConsole = { render: render };

})(window);
