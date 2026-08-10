/*
 * Artemidos - settings & about
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var VERSION = '5.3.3';

  /* ══ THE ONLY SOURCE ═══════════════════════════════════════════════════
     Paste the GitHub releases URL here and the card at the bottom of About
     goes live. Left empty, the card still states the rule and shows the
     button disabled, so the app never implies a download route it does not
     actually have.

     This matters more than it looks. An offline field tool distributed as an
     APK is exactly the shape of thing that gets re-hosted on mirror sites
     with something added to it, and the person installing it has no way to
     tell. Naming ONE source, in the app itself, is the only defence the user
     has - so the statement has to be here, in the build, not only on a web
     page that a fake can copy. */
  var GITHUB_URL = 'https://github.com/atavistic-concept/artemidos';
  var ATAVISTIC_URL = 'https://github.com/atavistic-concept';
  var SUPPORT_EMAIL = 'atavisticconcept@gmail.com';
  var RELEASED = '29 July 2026';

  /* A settings screen that is one long scroll makes every item equally hard
     to find, so each group collapses.

     Open/closed is held in memory for the life of this app launch, not in
     persistent storage: every group starts retracted when the app is opened
     fresh, and a group the user opens stays open only across the re-renders
     of this session (changing a theme or a unit rebuilds the screen). Closing
     and reopening the app returns everything to collapsed. */
  var OPEN_STATE = {};
  function group(title, sub, openDefault, build) {
    var open = OPEN_STATE[title] === true;
    var d = A.el('details.set-group', open ? { open: true } : null);
    var sum = A.el('summary.set-sum');
    /* Settings builds its own headings rather than going through A.UI.section,
       so it has to ask for the translation itself. */
    var tr = function (x) { var I = global.ArtI18n; return I ? I.auto(x) : x; };
    sum.appendChild(A.el('span.set-t', { text: tr(title) }));
    if (sub) sum.appendChild(A.el('span.set-s', { text: tr(sub) }));
    sum.appendChild(A.el('span.set-ch', { html: Icons.svg('chevron') }));
    d.appendChild(sum);
    var body = A.el('.set-body');
    build(body);
    d.appendChild(body);
    d.addEventListener('toggle', function () { OPEN_STATE[title] = d.open; });
    return d;
  }

  function renderSettings(host) {
    A.setTitle('Settings', { back: true });

    /* ── measurement system ── */
    host.appendChild(group('Measurement system', A.U.PRESETS[A.U.preset()], true, function (body) {
      var preset = A.U.preset();
      var presetRow = A.UI.chips(
        Object.keys(A.U.PRESETS).map(function (k) { return { id: k, label: A.U.PRESETS[k] }; }),
        preset,
        function (id) {
          A.U.setPreset(id);
          A.haptic(14);
          A.Router.refresh();
        }
      );
      presetRow.classList.add('wrap');
      body.appendChild(presetRow);
      body.appendChild(A.UI.note(preset === 'custom'
        ? 'Each measure below is set individually. Pick a preset to reset them all at once.'
        : 'Every tool displays and accepts values in these units. Pick Custom to set each measure individually.'));
    }));

    /* ── per-measure units: only meaningful under the Custom preset ── */
    if (A.U.preset() === 'custom') {
      host.appendChild(group('Units by measure',
        A.U.sym('dist') + ' · ' + A.U.sym('speed') + ' · ' + A.U.sym('mass') + ' · ' + A.U.sym('temp'),
        true, function (body) {
          Object.keys(A.U.KINDS).forEach(function (kind) {
            var k = A.U.KINDS[kind];
            body.appendChild(A.UI.select({
              label: k.label,
              value: A.U.unit(kind),
              options: A.U.options(kind).map(function (o) { return { value: o.code, label: o.name + '  (' + o.code + ')' }; }),
              onchange: function (e) { A.U.setUnit(kind, e.target.value); A.haptic(); A.Router.refresh(); }
            }));
          });
        }));
    }

    /* ── language ──
       Above appearance, because someone who cannot read the interface needs
       to reach this before anything else, and a list of languages named in
       their own script is readable to its speaker regardless of what the rest
       of the app currently says.

       NO FLAGS. A flag is a country, not a language: German is not Germany,
       Spanish is not Spain, and a Union Jack beside English says something to
       an Irish speaker that nobody intended. */
    var I18 = global.ArtI18n;
    if (I18) {
      host.appendChild(group(T('set.language', 'Language'), I18.info().name, false, function (body) {
        body.appendChild(A.UI.select({
          label: T('set.language', 'Language'),
          value: I18.current(),
          options: I18.LANGS.map(function (l) {
            var pct = Math.round(I18.coverage(l.id) * 100);
            return {
              value: l.id,
              /* the English name in brackets so a person who has landed in a
                 language they cannot read can still find their way out */
              label: l.name + (l.id === 'en' ? '' : '  (' + l.eng + ')')
            };
          }),
          onchange: function (e) {
            I18.set(e.target.value);
            A.haptic(14);
            A.Router.refresh();
          }
        }));
      }));
    }

    /* ── appearance ── */
    var themeName = { dark: 'Artemis Selene', light: 'Artemis Helios', night: 'Military RED',
                      milhud: 'Military HUD', raider: 'Raider Bunker', raiderday: 'Raider Complex' };
    var theme = A.store.get('theme', 'dark');
    host.appendChild(group('Appearance', themeName[theme] || 'Artemis Selene', false, function (body) {
      /* ── the themes, as a table rather than a run of chips ──
         Six chips in a wrapping row put Raider Day next to Military RED and
         made the pairs impossible to see. There are three FAMILIES and each
         has a light and a dark version, which is a grid: one column per
         family, light along the top and dark along the bottom. The shape of
         the control now states the shape of the choice, and the paragraph
         that used to explain it is not needed. */
      var FAMILIES = [
        { n: 'Artemis',  light: 'light',     dark: 'dark',   mem: 'theme.artemisSub' },
        { n: 'Raider',   light: 'raiderday', dark: 'raider', mem: 'theme.raiderSub' },
        { n: 'Military', light: 'milhud',    dark: 'night',  mem: 'theme.tacticalSub' }
      ];
      var LABELS = { light: 'Helios', dark: 'Selene', raiderday: 'Complex', raider: 'Bunker',
                     milhud: 'HUD', night: 'RED' };

      function pick(id, mem) {
        A.store.set('theme', id);
        /* keep the top-bar toggles' memory in step with a pick made here */
        A.store.set(mem, id);
        A.applyTheme();
        A.Bus.emit('theme');
        A.haptic(14);
        A.Router.refresh();
      }

      var grid = A.el('.thm-grid');
      FAMILIES.forEach(function (f) {
        grid.appendChild(A.el('.thm-fam', { text: f.n }));
      });
      ['light', 'dark'].forEach(function (band) {
        FAMILIES.forEach(function (f) {
          var id = f[band];
          grid.appendChild(A.el('button.thm-cell' + (theme === id ? '.on' : ''), {
            'data-thm': id,
            text: LABELS[id],
            onclick: function () { pick(id, f.mem); }
          }));
        });
      });
      body.appendChild(grid);

      /* font size: a whole-content scale, stepped by a + and a − */
      var STEP = 0.05, MIN = 0.8, MAX = 1.2;
      function scale() {
        /* the ceiling used to be 1.4; anyone sitting above the new one is
           brought down to it rather than left with a value the control cannot
           represent */
        var v = A.store.get('fontScale', 1);
        return Math.max(MIN, Math.min(MAX, v));
      }
      var fsRow = A.el('.fs-row', { style: { marginTop: '12px' } });
      fsRow.appendChild(A.el('span.fs-lab', { text: 'Text size' }));
      var minus = A.el('button.btn.ghost.fs-btn', { html: '&minus;', title: 'Smaller' });
      var pct = A.el('span.fs-val', { text: Math.round(scale() * 100) + '%' });
      var plus = A.el('button.btn.ghost.fs-btn', { html: '+', title: 'Larger' });
      function setScale(v) {
        v = Math.max(MIN, Math.min(MAX, Math.round(v * 100) / 100));
        A.store.set('fontScale', v);
        A.applyFontScale();
        pct.textContent = Math.round(v * 100) + '%';
        minus.disabled = v <= MIN + 1e-6;
        plus.disabled = v >= MAX - 1e-6;
        A.haptic(10);
      }
      minus.addEventListener('click', function () { setScale(scale() - STEP); });
      plus.addEventListener('click', function () { setScale(scale() + STEP); });
      fsRow.appendChild(minus);
      fsRow.appendChild(pct);
      fsRow.appendChild(plus);
      body.appendChild(fsRow);
      setScale(scale());
    }));

    /* ── the lock ──
       Its own group, above behaviour, because it is the only setting here
       that can lose data if it is misunderstood. */
    var LK = global.ArtLock, LKUI = global.ArtLockUI;
    if (LK && LK.available()) {
      host.appendChild(group('App lock', LK.isOn() ? 'PIN set' : 'Off', false, function (body) {
        var on = LK.isOn();
        var roles = on ? LK.roles() : { limited: false, wipe: false };

        body.appendChild(A.UI.note(
          'A PIN on the app, and the notebook, the War Pigeon keys, the message log ' +
          'and any saved position encrypted with it, so they cannot be read off the ' +
          'phone by anyone who gets past Android.'));

        /* ── THE THREE PINS, ALWAYS ALL THREE ──
           Listed whether or not any of them is set, because the point of the
           two duress PINs is that they EXIST as an option, and a screen that
           only mentions them after the first one is configured hides the whole
           idea from anyone who has not already had it. The two duress rows are
           inert until there is an unlock PIN to hang them on, and they say so
           rather than simply doing nothing when tapped. */
        var PINS = [
          {
            id: 'real',
            n: 'PIN to unlock',
            d: 'Opens Artemidos normally, and decrypts everything in it.',
            set: on,
            act: function () { LKUI.setup(function (ok) { if (ok) A.Router.refresh(); }); }
          },
          {
            id: 'limited',
            n: 'Duress PIN - open safe',
            d: 'Opens an app that is only a calculator and a converter. No notebook, ' +
               'no keys, no log, no catalogue. Nothing is deleted, and nothing on ' +
               'screen says it is not the whole app.',
            set: !!roles && roles.limited,
            act: function () { LKUI.duress('limited', function (ok) { if (ok) A.Router.refresh(); }); },
            off: function () { LK.clearDuress('limited').then(function () { A.haptic(); A.Router.refresh(); }); }
          },
          {
            id: 'wipe',
            n: 'Duress PIN - erase all data',
            d: 'Erases the notebook, the keys, the message log, the settings and the ' +
               'stored map tiles, with no confirmation and no undo, then opens that ' +
               'same empty app.',
            set: !!roles && roles.wipe,
            act: function () { LKUI.duress('wipe', function (ok) { if (ok) A.Router.refresh(); }); },
            off: function () { LK.clearDuress('wipe').then(function () { A.haptic(); A.Router.refresh(); }); }
          }
        ];

        PINS.forEach(function (pin) {
          var locked = (pin.id !== 'real') && (!on || !roles);
          /* The name of the PIN IS the first line of its own card. A heading
             outside repeating it, over a card whose first line then said only
             "Status", used two lines to say one thing twice. */
          var c = A.UI.card(null, 'tight');
          c.appendChild(A.UI.metric(pin.n, pin.set ? 'Set' : 'Off',
            pin.set ? { icon: 'check' } : null));
          c.appendChild(A.el('.lrow-s', {
            text: pin.d, style: { whiteSpace: 'normal', marginTop: '4px' }
          }));
          c.appendChild(A.el('button.btn' + (pin.id === 'real' && !on ? '' : '.ghost') + '.block', {
            html: Icons.svg('lock') + (pin.set ? ' Change this PIN' : ' Set this PIN'),
            disabled: locked,
            style: { marginTop: '10px' },
            onclick: function () { if (!locked) pin.act(); }
          }));
          if (pin.set && pin.off) c.appendChild(A.el('button.btn.danger.block', {
            html: Icons.svg('close') + ' Turn it off',
            style: { marginTop: '8px' },
            onclick: pin.off
          }));
          if (locked) c.appendChild(A.el('.lrow-s', {
            text: !on ? 'Set the unlock PIN first.'
                      : 'Unlock with your real PIN to change this.',
            style: { whiteSpace: 'normal', marginTop: '8px' }
          }));
          body.appendChild(c);
        });

        body.appendChild(A.UI.note(
          'Neither duress PIN announces itself. From the outside all three look ' +
          'exactly the same: the pad clears and the app opens. The phone always ' +
          'holds three PIN slots whether you set one or all three, so the number ' +
          'stored never says whether a duress PIN exists.'));

        /* ── attempts ── */
        body.appendChild(A.UI.section('Wrong attempts'));
        var ac = A.UI.card(null, 'tight');
        ac.appendChild(A.UI.metric('Allowed in a row', String(LK.maxTries)));
        ac.appendChild(A.UI.metric('Then', '20 seconds, and the app minimises'));
        ac.appendChild(A.el('.lrow-s', {
          text: 'The count and the wait are held on the phone, not in memory, so ' +
                'force-stopping the app and reopening it does not clear either. ' +
                'Nothing is ever deleted for guessing wrong.',
          style: { whiteSpace: 'normal', marginTop: '6px' }
        }));
        body.appendChild(ac);

        if (on) {
          body.appendChild(A.UI.section('When to ask'));
          body.appendChild(A.UI.select({
            label: 'Ask again after',
            value: String(LK.grace()),
            options: [{ value: '0', label: 'Immediately' }, { value: '1', label: '1 minute' },
                      { value: '2', label: '2 minutes' }, { value: '5', label: '5 minutes' },
                      { value: '15', label: '15 minutes' }, { value: '60', label: '1 hour' }],
            onchange: function (e) { LK.setGrace(parseInt(e.target.value, 10) || 0); }
          }));
          body.appendChild(A.UI.note(
            'How long the app can be in the background before it asks for the PIN again.'));

          body.appendChild(A.el('button.btn.danger.block', {
            html: Icons.svg('warn') + ' Turn the lock off',
            style: { marginTop: '14px' },
            onclick: function () {
              if (!confirm(A.tr('Turn off the lock? The notebook and keys go back to being stored unencrypted on this phone.'))) return;
              LK.disable(); A.haptic(); A.Router.refresh();
            }
          }));
          body.appendChild(A.UI.note(
            'Turning it off decrypts everything back into ordinary storage. It does ' +
            'not delete anything.'));
        }
      }));
    }

    /* ── behaviour ── */
    host.appendChild(group('Behaviour',
      A.store.get('haptics', true) ? 'Haptics on' : 'Haptics off', false, function (body) {
        body.appendChild(toggle('Haptic feedback', 'haptics', true,
          'Short vibration on key presses and selections.'));
        body.appendChild(toggle('Keep the screen awake', 'wakelock', false,
          'Holds the display on while a tool is open. Uses more battery.'));
      }));

    /* ── data & calibration ── */
    var fx = global.ArtFX.cached();
    var cal = A.store.get('rf.hfov', null);
    host.appendChild(group('Data & calibration',
      (fx ? 'Rates ' + fx.date : 'No rates cached') + (cal ? '  ·  camera calibrated' : ''),
      false, function (body) {
        body.appendChild(toggle('Work fully offline', 'offline', false,
          'When on, the app makes no network requests at all. The converter keeps working on the last exchange ' +
          'rates it downloaded while online. When off, rates refresh automatically as you use the app.'));
        body.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('globe') + ' What uses the network',
          style: { marginBottom: '10px' },
          onclick: function () { A.Router.go('network'); }
        }));
        body.appendChild(A.UI.metric('Exchange rates', fx ? 'ECB ' + fx.date : 'not cached',
          { sub: fx ? global.ArtFX.age(fx) : 'Connect once to download them for offline use.' }));
        body.appendChild(A.el('button.btn.ghost.block', {
          text: 'Refresh exchange rates',
          onclick: function () {
            if (A.store.get('offline', false)) { A.toast('Turn off "Work fully offline" first'); return; }
            global.ArtFX.load(true).then(function (p) {
              A.toast(p ? 'Rates refreshed' : 'Could not reach the rate service');
              A.Router.refresh();
            });
          }
        }));
        body.appendChild(A.UI.metric('Camera calibration',
          cal ? A.fmtNum(cal, 4) + '° horizontal field of view' : 'not calibrated',
          { sub: cal ? 'Recorded at ' + A.fmtNum(A.store.get('rf.calibZoom', 1), 3) + '× zoom'
                     : 'Rangefinder distances are estimates until this is set.' }));
        var wipe = A.el('.split', { style: { marginTop: '10px' } });
        body.appendChild(wipe);
        wipe.appendChild(A.el('button.btn.ghost.block.sem-del', {
          text: 'Clear history',
          onclick: function () {
            ['calc.history', 'calc.expr', 'stats.sd', 'stats.reg', 'graph.state'].forEach(A.store.del);
            A.toast('History cleared');
          }
        }));
        wipe.appendChild(A.el('button.btn.danger.block', {
          text: 'Reset everything',
          onclick: function () {
            if (!confirm(A.tr('Reset all settings, saved inputs, history and calibration? This cannot be undone.'))) return;
            try {
              Object.keys(localStorage)
                .filter(function (k) { return k.indexOf('artemidos.') === 0; })
                .forEach(function (k) { localStorage.removeItem(k); });
            } catch (e) { /* private mode */ }
            A.applyTheme();
            A.toast('Everything reset');
            A.Router.go('speed');
          }
        }));
      }));

    /* ── map cache ── */
    var mc = global.A.MapCache;
    host.appendChild(group('Map cache',
      mc ? mc.tiles() + ' tiles · ~' + mc.approxMB() + ' MB' : 'unavailable',
      false, function (body) {
        body.appendChild(A.UI.note(
          'Map tiles you have looked at are stored on the device, so places you have already panned over still ' +
          'show with no signal. The store is capped at the size below; when it is full, the oldest tiles drop first.'));
        body.appendChild(A.UI.select({
          label: 'Maximum map cache size',
          value: String(A.store.get('map.cacheMB', 100)),
          options: [['50', '50 MB'], ['100', '100 MB'], ['250', '250 MB'], ['500', '500 MB'], ['1000', '1 GB']]
            .map(function (o) { return { value: o[0], label: o[1] }; }),
          onchange: function (e) { A.store.set('map.cacheMB', +e.target.value); A.toast('Cache limit set'); A.Router.refresh(); }
        }));
        if (mc) {
          body.appendChild(A.UI.metric('Stored now', mc.tiles() + ' tiles', { sub: '~' + mc.approxMB() + ' MB' }));
          body.appendChild(A.el('button.btn.ghost.block.sem-del', {
            text: 'Clear map cache',
            onclick: function () {
              mc.clear().then(function () { A.toast('Map cache cleared'); A.Router.refresh(); });
            }
          }));
        }
      }));

    /* About and Other apps both live on the Console with the standing pages.
       Repeating them here made Settings a second front door to the same two
       screens. */

    /* ── activation ──
       Last. Everything above it is a preference, changed and changed again;
       this is done once and then never looked at. Putting it near the top
       interrupted the rows people actually come here for. */
    host.appendChild(group('Activation',
      (global.ArtLicence && global.ArtLicence.active()) ? 'Activated' : 'Not activated',
      false, function (body) {
        var LIC = global.ArtLicence;
        if (LIC && LIC.active() && LIC.claims()) {
          body.appendChild(A.UI.metric('Licence', LIC.claims().id, { icon: 'check' }));
        } else if (LIC && !LIC.required()) {
          body.appendChild(A.UI.note('This build does not require a key.'));
        } else {
          body.appendChild(A.UI.note('The calculator and the converter work without a ' +
            'key. Everything else needs one.'));
        }
        body.appendChild(A.el('button.btn.block', {
          html: Icons.svg('money') + ' Licence and activation',
          style: { marginTop: '10px' },
          onclick: function () { A.Router.go('activate'); }
        }));
      }));
  }

  /* Apps worth having on the same phone. The bar for this list is the same bar
     Artemidos sets itself: it has to work with no signal and earn its place.
     Most are free; one is paid and said so plainly. Nothing here is an
     affiliate link - they are listed because they are useful when the network
     is not. */
  var OTHER_APPS = [
    {
      name: 'Autolycus',
      what: 'A duress lock screen: the phone opens under coercion but keeps its secrets',
      why: 'From the same workshop as Artemidos. Your real PIN unlocks the phone as normal; the duress one shows a loading screen while it quietly captures who is holding it and wipes what matters, masked as an ordinary fault. Offline, no account.',
      github: 'https://github.com/atavistic-concept/autolycus'
    },
    {
      name: 'iFirstAid',
      what: 'First aid, complete and offline once downloaded',
      why: 'Free, but a free account must be registered to download the full content. Once it is on the device it works fully offline, which is the only way a first aid app is any use: the moment you need one is rarely the moment you have signal.',
      site: 'https://ifirstaid.com.au/',
      play: 'https://play.google.com/store/apps/details?id=com.ifirstaid',
      ios: 'https://apps.apple.com/gb/app/ifirstaid/id295238909'
    },
    {
      name: 'OsmAnd+',
      what: 'Full offline maps and navigation',
      why: 'A complete offline map of any country you download: streets, tracks, contours, buildings and points of interest, with routing and search, all held on the device with no signal. It is a paid app, but it is the offline map to have and worth it. Download the map for each country you need while you still have a connection. A separate nautical map plugin adds sea marks, depth contours and other maritime charting for boat navigation.',
      site: 'https://osmand.net/',
      play: 'https://play.google.com/store/apps/details?id=net.osmand.plus',
      ios: 'https://apps.apple.com/us/app/osmand-maps-travel-navigate/id934850257'
    },
    {
      name: 'Stellarium',
      what: 'The sky named, with the phone held up to it',
      why: 'Point the phone at the sky and it names what you are looking at: stars, ' +
           'constellations, planets. The catalogue is on the device, so it answers with ' +
           'the network off, which matters because the sky is most useful exactly where ' +
           'there is no signal. Ours gives you the sun and the moon as numbers to navigate ' +
           'by; this gives you the rest of the sky to recognise. The mobile version is free ' +
           'with a paid edition above it.',
      site: 'https://stellarium.org/',
      play: 'https://play.google.com/store/apps/details?id=com.noctuasoftware.stellarium_free',
      ios: 'https://apps.apple.com/us/app/stellarium-mobile-star-map/id1458716890'
    },
    {
      name: 'Field Guide to Clouds',
      what: 'Cloud types identified, offline, free',
      why: 'A photographic key to cloud types from UCAR, the American atmospheric research ' +
           'centre, free and with no account. Cloud is the one weather instrument you always ' +
           'have: what is overhead now tells you what the next few hours hold, and reading it ' +
           'is a skill a good key teaches faster than a forecast ever will.',
      site: 'https://scied.ucar.edu/apps/cloud-guide',
      play: 'https://play.google.com/store/apps/details?id=edu.ucar.scied.cloudguide',
      ios: 'https://apps.apple.com/gb/app/field-guide-to-clouds/id1121399187'
    },
    {
      name: 'Phases of the Moon',
      what: 'The moon, in more depth than we give it',
      why: 'Ours tells you the phase, the rise and the set because that is what you navigate and ' +
           'plan a night move by. This one is the whole subject: the calendar ahead, the ' +
           'illuminated fraction, distance, libration and the eclipses. If the moon matters to ' +
           'you beyond how much light you will have, take this as well.',
      play: 'https://play.google.com/store/apps/details?id=com.universetoday.moon.free',
      ios: 'https://apps.apple.com/us/app/moon-phases-and-lunar-calendar/id1126370589'
    },
    {
      name: 'Rattlegram',
      what: 'Text over the air by sound, like our War Pigeon',
      why: 'The same idea as War Pigeon and the app it borrows from: hold a phone to a radio and a typed message crosses as sound, no network and no data connection anywhere in the path. Rattlegram is the serious version of that, built by the aicodix team as an OFDM modem with strong error correction, and it will get a message through conditions ours will not. It sends in clear rather than encrypted, so it is a link, not a secret. Worth carrying alongside ours: use Rattlegram when the priority is that the message arrives, War Pigeon when the priority is that only the holder of the key can read it.',
      site: 'https://www.aicodix.de/cofdmtv/rattlegram/',
      play: 'https://play.google.com/store/apps/details?id=com.aicodix.rattlegram',
      ios: 'https://apps.apple.com/us/app/rattlegram/id1664526096'
    }
  ];

  function renderApps(host) {
    A.setTitle('Other apps', { back: true });
    host.appendChild(A.el('.note', {
      text: 'Offline tools that earn their place. Most are free; where one is paid it is said so. Opening any link below leaves Artemidos and needs a connection.',
      style: { marginTop: '0', marginBottom: '12px' }
    }));

    function appCard(a) {
      var card = A.UI.card();
      card.appendChild(A.el('div', { text: a.name, style: { fontSize: '16px', fontWeight: '700' } }));
      card.appendChild(A.el('.lrow-s', { text: a.what, style: { whiteSpace: 'normal', marginTop: '2px' } }));
      card.appendChild(A.el('p', {
        /* the why-prose sits in a plain <p>, which the engine leaves alone, so
           translate it here the way the catalogue tables do. Only apps with a
           pack entry change; the rest hand back their English unchanged. */
        text: A.tr(a.why),
        style: { fontSize: '13px', lineHeight: '1.55', color: 'var(--text-2)', marginTop: '10px' }
      }));

      /* the three links sit in one row rather than stacked: they are
         alternatives to each other, not a sequence of steps */
      var links = A.el('.split', { style: { marginTop: '12px' } });
      function link(label, url) {
        if (!url) return;
        links.appendChild(A.el('button.btn.ghost.block', {
          text: label,
          onclick: function () {
            A.haptic();
            try { window.open(url, '_blank', 'noopener'); } catch (e) { A.toast('Could not open the link'); }
          }
        }));
      }
      /* a github-only app gets one solid button rather than the ghost row:
         there is no alternative to pick between, so it reads as the action */
      /* a github-only app still gets a row, not a full-width slab: it sits at
         one third the width so it lines up with the three-link cards below it.
         The address itself was printed underneath and has been dropped - it is
         the button's job to know where it goes, and a raw URL on a card is
         furniture nobody reads. */
      if (a.github) {
        var grow = A.el('.split', { style: { marginTop: '12px' } });
        grow.appendChild(A.el('button.btn', {
          html: Icons.svg('globe') + ' On GitHub',
          style: { flex: '0 0 calc((100% - 16px) / 3)' },
          onclick: function () {
            A.haptic();
            try { window.open(a.github, '_blank', 'noopener'); }
            catch (e) { A.toast('Could not open the link'); }
          }
        }));
        card.appendChild(grow);
        return card;
      }

      link('Website', a.site);
      link('Google Play', a.play);
      link('App Store', a.ios);
      card.appendChild(links);
      return card;
    }

    /* two groups: our own apps first, then the outside tools we vouch for.
       an app is ours when it carries a github link to the Atavistic account */
    function isOurs(a) { return a.github && /atavistic-concept/i.test(a.github); }
    var ours = OTHER_APPS.filter(isOurs);
    var suggested = OTHER_APPS.filter(function (a) { return !isOurs(a); });

    if (ours.length) {
      host.appendChild(A.el('.sec-lab', { text: 'Atavistic Concept apps', style: { marginTop: '4px' } }));
      ours.forEach(function (a) { host.appendChild(appCard(a)); });
    }
    if (suggested.length) {
      host.appendChild(A.el('.sec-lab', { text: 'Suggested apps', style: { marginTop: '18px' } }));
      suggested.forEach(function (a) { host.appendChild(appCard(a)); });
    }

    host.appendChild(A.UI.note('Suggestions are welcome. The list stays short on purpose: an app earns a place by working with the network off.'));
  }

  function toggle(label, key, dflt, hint) {
    var on = A.store.get(key, dflt);
    var row = A.el('.metric');
    row.appendChild(A.el('span.metric-l', { text: label }));
    var btn = A.el('button.chip' + (on ? '.on' : ''), {
      text: on ? 'On' : 'Off',
      onclick: function () {
        on = !on;
        A.store.set(key, on);
        btn.textContent = on ? 'On' : 'Off';
        btn.classList.toggle('on', on);
        A.haptic(14);
        A.Bus.emit('setting:' + key, on);
      }
    });
    row.appendChild(btn);
    if (hint) row.appendChild(A.el('span.metric-sub', { text: hint, style: { textAlign: 'left' } }));
    return row;
  }

  /* ══ about ════════════════════════════════════════════════════════════ */

  function renderAbout(host) {
    A.setTitle('About', { back: true });

    host.appendChild(A.el('.card', { style: { textAlign: 'center', padding: '26px 18px' } }, [
      A.el('div', { html: Icons.mark(72), style: { color: 'var(--acc)', display: 'flex', justifyContent: 'center', marginBottom: '14px' } }),
      A.el('div', { text: 'ARTEMIDOS', style: { fontSize: '20px', fontWeight: '300', letterSpacing: '.4em', textIndent: '.4em' } }),
      A.el('div', { text: A.tr('From Artemis'), style: { fontSize: '11px', letterSpacing: '.28em', textIndent: '.28em', color: 'var(--muted)', marginTop: '6px' } }),
      A.el('div', { text: 'Version ' + VERSION, style: { fontSize: '15px', color: 'var(--text-2)', marginTop: '14px', fontWeight: '650' } }),
      A.el('div', { text: 'Last updated ' + RELEASED, style: { fontSize: '11.5px', color: 'var(--muted)', marginTop: '3px' } })
    ]));

    host.appendChild(A.UI.section('What this is'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('A self-contained set of field instruments: converters, a scientific calculator, ranging tools and ' +
          'a reference catalogue of speeds, distances and ranges. Everything works offline.')
      })
    ]));

    /* ── who makes it ──
       Artemidos is one of a small set of offline field tools built under the
       Atavistic Concept name. Saying so here, with the link, ties the app to
       the source the reader can verify. */
    /* -- who it is for --
       Asked for by name: the page said what the app is and how accurate it is,
       but never who would pick it up. Kept broad on purpose - the list is the
       point, not a gate. */
    host.appendChild(A.UI.section('Who this app is for'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('Anyone.')
      }),
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '12px' },
        text: A.tr('It grew out of what the author knows and does: hobbies, the ' +
          'years spent in the army, the old military instruction books on ' +
          'armoured vehicle identification, time at sea and in the mountains, ' +
          'and a working life in professional logistics. What went in is what ' +
          'was actually reached for.')
      }),
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '12px' },
        text: A.tr('Enthusiasts of many kinds get something out of it: soldiers from ' +
          'corporal to officer rank, pirate treasure hunters, soldiers of fortune, ' +
          'tomb raiders, preppers, skippers and boat crew, hobbyists, radio ' +
          'amateurs, scouts, and anyone else.')
      })
    ]));

    host.appendChild(A.UI.section('Accuracy'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('Where a unit has an exact definition, the conversions are exact. The catalogue numbers come from ' +
          'public sources: maker brochures, official fact sheets and standard references. Treat them as a guide ' +
          'for planning, not a promise: real performance changes with load, height, temperature and setup. When a ' +
          'number gets repeated everywhere but has no solid evidence behind it, the entry says so instead of ' +
          'passing it on.')
      })
    ]));

    /* ── two kinds of information, and they are not equally reliable ──
       Worth separating explicitly, because the app presents both in the same
       typeface and a reader has no way to tell them apart otherwise. A
       conversion is right or it is a bug. A judgement about how people behave
       is neither. */
    host.appendChild(A.UI.section('Two kinds of information'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('The MATHS in this app is sound and as accurate as it can be made. ' +
          'Conversions, ballistics, navigation, radio range, timings and every other ' +
          'calculation are computed from first principles or from exact definitions, ' +
          'and they are tested. If one of them is wrong, that is a bug and it will be ' +
          'fixed.')
      }),
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--warn)', marginTop: '12px' },
        text: A.tr('The ANTHROPOLOGICAL, SOCIOLOGICAL, POLITICAL and HUMAN-ASSESSMENT ' +
          'material is not of that kind and must not be read as though it were. It is ' +
          'compiled from open sources, it generalises about places and people, it ages ' +
          'badly, and it may simply be wrong. Treat every part of it as a starting ' +
          'point to be checked on the ground, never as a fact to act on.')
      })
    ]));

    host.appendChild(A.UI.section('Privacy'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('No account, no analytics, no tracking. Settings and saved inputs stay in this app. Location is ' +
          'requested only when you tap "Use my location" in the shadow tool, and is used on the device only. The ' +
          'camera is used only while the rangefinder is open, and the microphone only while Morse listening is ' +
          'running; neither is ever stored or transmitted. Two things reach the network. Exchange rates are ' +
          'fetched and then cached, so the converter keeps working offline on the last values downloaded; you can ' +
          'switch the app to fully offline in Settings to stop even that. The maps need a connection to open, but ' +
          'any part of a map you have already opened is cached and stays viewable offline afterwards.')
      }),
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '12px' },
        text: A.tr('The notebook and your saved keys can be locked with a password, set from this page. Locking ' +
          'encrypts them on the device with AES-256-GCM, the key derived from your password with PBKDF2-SHA256 ' +
          'at 210,000 rounds. Nobody but you holds that password: it is never sent anywhere, so if it is lost the ' +
          'locked content cannot be recovered by anyone, including the author.')
      })
    ]));

    host.appendChild(A.UI.section('Credits'));
    var cr = A.UI.card(null, 'tight');
    cr.appendChild(A.UI.metric('Photographs', 'Wikimedia Commons',
      { sub: 'Public domain, CC0, CC BY or CC BY-SA. Author and licence shown under each image.' }));
    /* ── Wikipedia is a CONTRIBUTOR here, not merely a source ──
       The rank ladders and the camouflage catalogue were BUILT from Wikipedia
       article text by scripts/build-ranks-from-wiki.js and
       scripts/build-camo-catalog.js. That text is CC BY-SA, which does not
       simply permit reuse: it REQUIRES the source be named and the same
       licence carried forward. This line is the licence being honoured, so it
       is not decoration and must not be dropped to save room on the page. */
    cr.appendChild(A.UI.metric('Rank ladders & camouflage', 'Wikipedia contributors',
      { sub: 'Built from the Wikipedia articles on comparative military ranks and on military camouflage patterns. Used under CC BY-SA 4.0; those entries carry the same licence.' }));
    cr.appendChild(A.UI.metric('Image licensing', 'Every photograph is freely licensed',
      { sub: 'Nothing in this build carries an image without a licence permitting reuse. Verify with scripts/list-restricted-images.js before any release.' }));
    cr.appendChild(A.UI.metric('Exchange rates', 'European Central Bank, via frankfurter.dev'));
    cr.appendChild(A.UI.metric('Solar position', 'NOAA solar calculation'));
    cr.appendChild(A.UI.metric('Airport & city data', 'OurAirports and open geographic datasets'));
    host.appendChild(cr);

    /* ── where this app comes from ──
       This replaces the plain wordmark that used to close the page. A name at
       the bottom told the reader nothing; where to get the next version, and
       where NOT to, is the last thing worth saying. */
    host.appendChild(A.UI.section('Downloads and updates'));
    var dl = A.el('.card', { style: { marginTop: '0' } });

    dl.appendChild(A.el('div', {
      text: 'GitHub',
      style: { fontSize: '16px', fontWeight: '700' }
    }));
    dl.appendChild(A.el('.lrow-s', {
      text: 'The only place this app is published',
      style: { whiteSpace: 'normal', marginTop: '2px' }
    }));

    dl.appendChild(A.el('p', {
      style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '10px' },
      text: A.tr('Every build and every update is released there and nowhere else. ' +
        'Do not trust or install Artemidos from any other source: not an app ' +
        'store listing, not a mirror, not a file sent to you, not a link from ' +
        'a search. A copy from anywhere else is not this app, whatever it is ' +
        'called and whatever it looks like when it opens.')
    }));

    if (GITHUB_URL) {
      dl.appendChild(A.el('button.btn.block', {
        html: Icons.svg('globe') + ' Open the GitHub page',
        style: { marginTop: '12px' },
        onclick: function () {
          A.haptic();
          try { window.open(GITHUB_URL, '_blank', 'noopener'); }
          catch (e) { A.toast('Could not open the link'); }
        }
      }));
      dl.appendChild(A.el('.lrow-s', {
        text: GITHUB_URL,
        style: { whiteSpace: 'normal', marginTop: '8px', textAlign: 'center' }
      }));
    } else {
      /* No link yet. Say so plainly rather than showing a dead button: a
         button that does nothing is how a user learns to ignore this card. */
      dl.appendChild(A.el('button.btn.block', {
        html: Icons.svg('globe') + ' Link not set in this build',
        disabled: true,
        style: { marginTop: '12px' }
      }));
    }

    dl.appendChild(A.el('p', {
      style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--warn)', marginTop: '12px' },
      text: A.tr('Check the address character by character before you install anything. ' +
        'A name that reads correctly at a glance is the whole trick.')
    }));
    dl.appendChild(A.el('p', {
      style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '12px' },
      text: A.tr('There are no update reminders and no in-app nagging: the app never phones home to check. Come ' +
        'back to this page and the GitHub link from time to time and check for a newer release yourself, so new ' +
        'features and fixes do not sit unused.')
    }));
    host.appendChild(dl);

    /* ── the licence, said once and plainly ──
       Asked for by name: what the purchase actually buys and how far it
       stretches across a reader's own devices. Placed right after Downloads
       and updates because it answers the next question a reader who just
       learned updates are self-serve would have: do I pay again for them. */
    host.appendChild(A.UI.section('Licence'));
    host.appendChild(A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('One payment, for life. A licence key is not a subscription: it never expires, and every ' +
          'future update and new feature is included at no extra cost, for as long as the app is developed.')
      }),
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)', marginTop: '12px' },
        text: A.tr('A key activates on up to 6 devices at a time. Moving to a new phone does not use up a purchase ' +
          '- it takes one of the 6 slots. If those fill up, for example after replacing a lost or old phone, ' +
          'contact support to have the old device cleared and its slot freed.')
      })
    ]));

    /* ── who makes it, after the downloads section ── */
    host.appendChild(A.UI.section('Atavistic Concept'));
    var ac = A.el('.card', null, [
      A.el('p', {
        style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
        text: A.tr('Artemidos is part of Atavistic Concept, a small line of offline, ' +
          'self-contained tools built to work when the network does not and to ' +
          'keep what you put into them on your own device. The other apps live ' +
          'in the same place.')
      })
    ]);
    ac.appendChild(A.el('button.btn.block', {
      html: Icons.svg('globe') + ' Open Atavistic Concept on GitHub',
      style: { marginTop: '12px' },
      onclick: function () {
        A.haptic();
        try { window.open(ATAVISTIC_URL, '_blank', 'noopener'); }
        catch (e) { A.toast('Could not open the link'); }
      }
    }));
    ac.appendChild(A.el('.lrow-s', {
      text: ATAVISTIC_URL,
      style: { whiteSpace: 'normal', marginTop: '8px', textAlign: 'center' }
    }));
    host.appendChild(ac);

    /* ── what the app cannot do for itself ──
       Android switches things off to save battery, and it does it silently.
       Every one of these is a permission or a restriction the OS controls, and
       an app that quietly fails because of one looks like a broken app rather
       than a throttled one. Said here in plain terms so a user who wonders why
       a tool did nothing has somewhere to look. */
    host.appendChild(A.UI.section('Getting the most out of it'));
    var tips = A.UI.card(null, 'tight');
    [
      ['Turn off battery restrictions',
       'Settings, Apps, Artemidos, Battery, and choose Unrestricted. Android otherwise suspends the app in the background: alarms fire late or not at all, timers stop counting, and War Pigeon stops listening the moment the screen goes off.'],
      ['Allow notifications',
       'Needed for alarms, timers and any message that arrives while you are in another app. Without it those are silent and you will only see them when you come back.'],
      ['Allow location',
       'Used by the shadow tool, the compass true-heading correction and the map. Choose Precise, not Approximate: an approximate fix is useless for any of them. Nothing is transmitted.'],
      ['Allow camera and microphone',
       'The camera is the rangefinder. The microphone is Morse listening and War Pigeon receive. Both are used only while that tool is open and neither is ever recorded.'],
      ['Keep the screen awake',
       'In Settings, Behaviour. Worth turning on for anything you are reading off the screen while working, and off again afterwards.'],
      ['Store the map before you lose signal',
       'Pan and zoom over the ground you care about while you still have a connection. Those tiles are kept and the map works without a signal afterwards. It cannot fetch what you never looked at.'],
      ['Refresh the exchange rates while online',
       'The converter works offline from the last table it stored. Open it once on a connection before you travel.'],
      ['Calibrate the rangefinder',
       'In Settings, Data and calibration. The camera method depends on your phone\u2019s actual field of view, and the factory figure is often wrong by enough to matter.'],
      ['Set the app lock before you need it',
       'Not after. Turning it on encrypts what is already there; it cannot protect what has already been read off the phone.']
    ].forEach(function (t) {
      tips.appendChild(A.UI.metric(t[0], '', { sub: t[1] }));
    });
    host.appendChild(tips);

    /* ── how to tell us it is wrong ──
       An app that says its figures may be wrong and then offers no way to
       report one has not really said anything. */
    host.appendChild(A.UI.section('Support, suggestions and corrections'));
    var sup = A.UI.card();
    sup.appendChild(A.el('p', {
      style: { fontSize: '15px', lineHeight: '1.65', color: 'var(--text-2)' },
      text: A.tr('Found a figure that is wrong, something out of date, or a tool that ' +
        'would earn its place? Write and say so. Name the page and the figure, and ' +
        'give a source if you have one.')
    }));
    sup.appendChild(A.el('button.btn.block', {
      html: Icons.svg('info') + ' ' + SUPPORT_EMAIL,
      style: { marginTop: '12px', wordBreak: 'break-all' },
      onclick: function () {
        A.haptic();
        try { window.open('mailto:' + SUPPORT_EMAIL + '?subject=Artemidos%20' + VERSION, '_system'); }
        catch (e) { A.toast('Could not open mail'); }
      }
    }));
    sup.appendChild(A.el('.lrow-s', {
      text: 'Opening this leaves Artemidos and needs a connection. Nothing is sent automatically.',
      style: { whiteSpace: 'normal', marginTop: '8px' }
    }));
    host.appendChild(sup);
  }

  A.Router.register('settings', { render: renderSettings });
  /* ══ the Huntress Guide ═══════════════════════════════════════════════
     Five lines. They are the reason the rest of the app is shaped the way it
     is: see first, be ready, and choose the ground rather than accept it. */

  /* ══ THE HYMN ══════════════════════════════════════════════════════════
     Five lines on Artemis. The app is named for her and takes its whole shape
     from them: see before being seen, leave nothing unsearched, and let
     nothing pass.

     Kept in the original because a translation is somebody's reading of it,
     and the point of putting it here is that it is older than any of us and
     was not written for this. Polytonic Greek, so it needs a face that has
     the accents - the stack below falls back through the system serif rather
     than through the app's own, which does not carry them all. */
  var HYMN = [
    "Ὡς ἄρα παρθενικὴ φιλοπαίγμων, ὣς ἄρ' Ἄρτεμις·",
    "οὐδέ ἑ λαθρίδιοι χηραμοὶ οὐδ' αὖα φωλεά,",
    'οὐδὲ μὲν ἑσμὸς ἔφηγε, σελαζομένης ἀπὸ τήλης.',
    'αὐτὴ γὰρ Φοίβοιο φάος κλέπτει κατὰ νύκτας,',
    'οὐδέ τι θὴρ ἄγριος βελέων ἐξήλυθεν αὐτῆς.'
  ];

  var GUIDE = [
    'Always be who sees before being seen.',
    'Wake up earlier.',
    'Win with might. If you cannot, win with speed. If you cannot, win with time.',
    'Master the soul to master the sword.',
    'Readiness and preparation are a must.',
    'Make the momentum.'
  ];



  /* ══ what leaves the device ═══════════════════════════════════════════
     Everything in this app runs offline except three things, and a user who
     carries it for privacy reasons is entitled to know exactly what those are
     rather than being told "works offline" and left to trust it.

     Written as WHAT IS SENT, TO WHOM, and WHEN, because that is the form the
     question actually takes. */

  var NETWORK = [
    {
      what: 'Map tiles',
      who: 'tile.openstreetmap.org',
      sends: 'The map squares you are looking at, as coordinates and a zoom level.',
      when: 'Only while the Ranger map is open and you are panning over ground it has not already stored.',
      leaks: 'Whoever serves the tiles can see, from the request, roughly WHERE you are looking - not where you are. Tiles already stored are served from the device and make no request at all.',
      off: true
    },
    {
      what: 'Exchange rates',
      who: 'api.frankfurter.dev (European Central Bank reference rates)',
      sends: 'Nothing about you. One request for the day\u2019s rate table.',
      when: 'When the app opens with a connection, and when you tap Refresh. The converter works from the last table it stored otherwise.',
      leaks: 'That someone using this app connected. No amounts, no currencies you chose, no position.',
      off: true
    },
    {
      what: 'Links to other apps',
      who: 'App stores and the makers\u2019 own sites',
      sends: 'Nothing until you tap one, and then it is your browser making the request, not this app.',
      when: 'Only when you tap a link on the Other apps page.',
      leaks: 'The usual of opening any web page in your browser.',
      off: false
    },
    {
      what: 'Your position',
      who: 'Nobody',
      sends: 'Nothing. Position is read from the device and used on the device.',
      when: 'Only when you tap a button that asks for it.',
      leaks: 'Android may itself use network positioning to get the fix, which is a system behaviour outside this app. Artemidos never transmits the result.',
      off: false
    }
  ];

  A.Router.register('network', {
    render: function (host) {
      A.setTitle('What uses the network', { back: true });

      var offline = A.store.get('offline', false);
      host.appendChild(A.UI.note(
        offline
          ? 'WORK FULLY OFFLINE IS ON. The app makes no network requests at all: no tiles, no rates. Stored tiles and the last rate table still work.'
          : 'Everything below is the complete list. Nothing else in this app touches the network - the catalogue, the calculators, the notebook, War Pigeon, navigation and the ballistics all run entirely on the device.'));

      NETWORK.forEach(function (n) {
        host.appendChild(A.UI.section(n.what));
        var c = A.UI.card(null, 'tight');
        c.appendChild(A.UI.metric('Goes to', n.who));
        c.appendChild(A.UI.metric('What is sent', n.sends));
        c.appendChild(A.UI.metric('When', n.when));
        c.appendChild(A.UI.metric('What it could reveal', n.leaks));
        if (n.off) c.appendChild(A.UI.metric('Stopped by "Work fully offline"', 'yes', { icon: 'check' }));
        host.appendChild(c);
      });

      host.appendChild(A.el('button.btn.block', {
        html: Icons.svg('settings') + (offline ? ' Offline mode is ON' : ' Turn on Work fully offline'),
        style: { marginTop: '14px' },
        onclick: function () {
          A.store.set('offline', !A.store.get('offline', false));
          A.haptic();
          A.Router.refresh();
        }
      }));

      host.appendChild(A.UI.note(
        'The notebook, the keys and the War Pigeon log are held on this device and are never ' +
        'sent anywhere. That is the design, and it is also the warning: nothing is backed up, ' +
        'so a lost phone loses them.'));
    }
  });

  A.Router.register('guide', {
    render: function (host) {
      A.setTitle('Huntress Guide', { back: true });

      host.appendChild(A.el('.card', { style: { textAlign: 'center', padding: '22px 18px' } }, [
        A.el('div', { html: Icons.mark(56), style: { color: 'var(--acc)', display: 'flex', justifyContent: 'center', marginBottom: '12px' } }),
        A.el('div', { text: A.tr('HUNTRESS GUIDE'), style: { fontSize: '15px', fontWeight: '700', letterSpacing: '.28em', textIndent: '.28em' } })
      ]));

      /* The Greek sits above the tips, as the source they come from. No
         translation and no commentary: it is there to be read as it stands. */
      var hymn = A.el('.card.hymn');
      HYMN.forEach(function (line) {
        hymn.appendChild(A.el('.hymn-l', { text: line }));
      });
      host.appendChild(hymn);

      var card = A.UI.card(null, 'tight');
      GUIDE.forEach(function (g, i) {
        var d = A.el('.guide-item');
        d.appendChild(A.el('span.guide-n', { text: ('0' + (i + 1)) }));
        var mid = A.el('.guide-mid');
        mid.appendChild(A.el('.guide-t', { text: A.tr(g) }));
        d.appendChild(mid);
        card.appendChild(d);
      });
      host.appendChild(card);
    }
  });

  A.Router.register('about', { render: renderAbout });
  A.Router.register('apps', { render: renderApps });

  global.ArtVersion = VERSION;
  global.ArtReleased = RELEASED;

})(window);
