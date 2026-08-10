/*
 * Artemidos - application shell
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  /* Three sections only. Field now holds the calculator, the converter, the
     maths tools and Morse as well as the field references, so it stays lit on
     every one of those routes. */
  /* The label is a KEY, resolved when the bar is painted rather than when the
     array is declared - otherwise the four tab captions are fixed in whatever
     language was active at load and never change again. */
  var TABS = [
    { route: 'console', icon: 'grid', k: 'nav.console', label: 'Console' },
    { route: 'speed', icon: 'recon', k: 'nav.recon', label: 'Recon' },
    { route: 'map', icon: 'globe', k: 'nav.navigation', label: 'Navigation',
      match: ['map', 'rangemap', 'range', 'flash', 'compass', 'mountain',
              'tides', 'scuba', 'freedive', 'fuel'] },
    { route: 'field', icon: 'field', k: 'nav.field', label: 'Field',
      match: ['field', 'calc', 'convert', 'ratio', 'solver', 'graph', 'stats', 'shadow', 'morse'] }
  ];

  /* ══ home ═════════════════════════════════════════════════════════════
     Every tool now sits inside one of the five bottom sections, so a separate
     grid of links to them is a menu that duplicates the tab bar. The route is
     kept and redirected so stored state and old links still land somewhere. */

  A.Router.register('home', {
    render: function () { A.Router.go('console'); }
  });

  /* The 'map' route is now the Range map, registered in js/rangemap.js. */

  /* ══ chrome wiring ════════════════════════════════════════════════════ */

  /* Sea navigation and the distance tool live inside the field route as tabs,
     but they belong to Navigation. Without this the bottom bar lights up Field
     while the user is plainly in Navigation, which reads as the app losing
     track of where you are. */
  var NAV_FIELD_TABS = ['nav', 'dist'];

  /* ══ THE PAGE TREE ══════════════════════════════════════════════════════
     Which page each screen was opened FROM, stated once and used by both back
     buttons - the arrow in the top bar and the Android hardware key - so they
     can never disagree with each other.

     It used to be a chain of ifs naming a few routes, with everything else
     falling through to "go to the Console". That was wrong for anything the
     chain had not been told about, and it went wrong silently: the Compass
     was given its own page and immediately started throwing the user out to
     the Console, two levels from where they were, because nothing had added
     it to the list. A map cannot fail that way - a route either has a parent
     here or it does not exist.

     Anything not listed belongs to the Console, which is the app's home. */
  var PARENT = {
    /* the three sections and the home screen */
    console:   null,          /* back from here leaves the app */
    home:      null,
    speed:     'console',
    map:       'console',
    field:     'console',

    /* navigation */
    rangemap:  'map',
    compass:   'map',
    mountain:  'map',
    urban:     'map',
    clino:     'map',       /* its button now sits on the Navigation page */
    range:     'map',
    flash:     'map',
    /* the water tools: their buttons sit in the On/in water group on the
       Navigation page, so Back belongs there and not in a Field menu the
       user never opened */
    tides:     'map',
    scuba:     'map',
    freedive:  'map',
    fuel:      'map',

    /* field tools */
    calc:      'field',
    convert:   'field',
    ratio:     'field',
    solver:    'field',
    graph:     'field',
    stats:     'field',
    shadow:    'field',
    morse:     'field',
    level:     'field',
    sunmoon:   'field',

    /* reference and the app itself, all reached from the Console */
    country:   'speed',
    guide:     'console',
    about:     'console',
    settings:  'console',
    activate:  'settings',
    apps:      'console',
    network:   'settings'
  };

  /* ══ SUB-STATES THAT LIVE IN A QUERY ═══════════════════════════════════
     Some routes are two screens wearing one name. The country LIST and a
     single country are both `country`; the Field menu and each field tool are
     both `field`. The tree above knows route names only, so back from a
     country went straight to Recon - past the list the user had just come
     from and had every reason to expect.

     Each entry names the query parameter that makes a route DEEP. Back from
     the deep state drops that parameter and lands on the shallow one, which
     is the screen the user actually navigated from. */
  var QUERY_SUBSTATE = { country: 'c', field: 'tab' };

  /* `field` is really several screens behind one route, and two of its tabs
     were moved to Navigation: leaving Sea navigation or Distance has to put
     the user back in Navigation, not in the Field menu they never used. */
  function parentOf(name) {
    /* In safe mode there are only two tools and one screen behind them. Back
       from either goes to that screen, never to a Field menu that is not
       there. */
    var L = global.ArtLock;
    if (L && L.isLimited()) return (name === 'console' || name === 'home') ? null : 'console';
    /* a BARE field route is the menu itself, and that is reached from the
       Console. A field route with a tab is handled as a sub-state in goBack
       before this is ever consulted. */
    if (name === 'field') {
      return NAV_FIELD_TABS.indexOf(currentFieldTab()) >= 0 ? 'map' : 'console';
    }
    if (Object.prototype.hasOwnProperty.call(PARENT, name)) return PARENT[name];
    return 'console';
  }
  A.parentOf = parentOf;

  /* The one place Back is decided. An open sheet swallows it; a sub-path walks
     back through the screens actually opened; otherwise the tree says where
     this page came from. Returns false when there is nowhere left to go, which
     only happens at the Console. */
  A.goBack = function () {
    var sheets = A.$$('.place-ov');
    if (sheets.length) {
      var top = sheets[sheets.length - 1];
      A.haptic();
      if (typeof top._onBack === 'function') top._onBack();
      else top.remove();
      return true;
    }
    /* inside a sub-screen (speed/mil/tank -> speed/mil): walk the history,
       because those steps are the user's own path through a list */
    if (A.Router.params().path.length > 0) {
      A.haptic();
      A.Router.back();
      return true;
    }

    var cur = (A.Router.current() || {}).name;

    /* one level up WITHIN a route, before leaving it */
    var deep = QUERY_SUBSTATE[cur];
    if (deep && (A.Router.params().query || {})[deep]) {
      A.haptic();
      /* the two field tabs that moved to Navigation belong to Navigation, not
         to the Field menu the user never opened */
      if (cur === 'field' && NAV_FIELD_TABS.indexOf(currentFieldTab()) >= 0) {
        A.Router.go('map');
      } else {
        A.Router.go(cur);
      }
      return true;
    }

    var up = parentOf(cur);
    if (up) { A.haptic(); A.Router.go(up); return true; }
    return false;
  };
  /* which bottom-bar section a route belongs to. It must read the LIVE route,
     not the stored field.tab: that store holds the LAST field tab opened, so
     after leaving Sea navigation for the Field tools menu it still said "nav"
     and lit Navigation instead of Field. The URL is the truth. */
  function currentFieldTab() {
    try { return (A.Router.params().query || {}).tab || ''; } catch (e) { return ''; }
  }
  function sectionOf(routeName) {
    if (routeName === 'field' && NAV_FIELD_TABS.indexOf(currentFieldTab()) >= 0) return 'map';
    return routeName;
  }

  function paintTabs() {
    var bar = A.$('#tabbar');
    A.clear(bar);
    var cur = sectionOf((A.Router.current() || {}).name || 'speed');
    TABS.forEach(function (t) {
      var on = t.match ? t.match.indexOf(cur) >= 0 : t.route === cur;
      bar.appendChild(A.el('button' + (on ? '.on' : ''), {
        onclick: function () { A.haptic(); A.Router.go(t.route); }
      }, [
        A.el('span', { html: Icons.svg(t.icon) }),
        A.el('span', { text: T(t.k, t.label) })
      ]));
    });
  }

  /* ══ wake lock ════════════════════════════════════════════════════════ */

  var wakeLock = null;
  function updateWakeLock() {
    var want = A.store.get('wakelock', false);
    if (!want) {
      if (wakeLock) { try { wakeLock.release(); } catch (e) {} wakeLock = null; }
      return;
    }
    if (wakeLock || !navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l;
      l.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () { /* denied or unsupported: not worth telling the user */ });
  }

  /* ══ service worker ═══════════════════════════════════════════════════
     Only on the web. Inside the Capacitor shell the assets are already on
     disk and the APK is the versioning mechanism, so a service worker adds
     nothing but a cache layer that survives app updates and pins the WebView
     to the previous build's JavaScript. Any worker left over from an earlier
     build is actively torn down so a device in that state heals itself. */

  function isNativeShell() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()) ||
      !!global.Capacitor ||
      location.protocol === 'capacitor:';
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    if (isNativeShell()) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        if (!regs.length) return;
        regs.forEach(function (r) { r.unregister(); });
        if (global.caches) {
          caches.keys().then(function (keys) { keys.forEach(function (k) { caches.delete(k); }); });
        }
      }).catch(function () {});
      return;
    }

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline caching is a bonus, not a requirement */ });
    });
  }

  /* ══ Android back ═════════════════════════════════════════════════════
     Without this the system back gesture closes the app from any screen,
     because Capacitor's default is to finish the activity. Back should walk
     back through the screens the user opened and only leave the app from
     home, and it should background the app rather than kill it, so returning
     lands where they left off. */

  function wireAndroidBack() {
    var cap = global.Capacitor;
    var App = cap && cap.Plugins && cap.Plugins.App;
    if (!App || !App.addListener) return;

    App.addListener('backButton', function () {
      /* A SHEET IS A SCREEN. Any open overlay - the note editor, a picker, an
         alarm - must swallow Back and close itself, or Back falls through to
         the router: the app navigates away while the sheet floats on top of
         the wrong page, and the next Back throws away whatever was typed. That
         is what made notes "not save": the note was never saved, it was
         dismissed. That case, and every other, is handled in A.goBack.

         At the Console there is nowhere left to go, and the app MINIMISES
         rather than exits, so everything that was open is still open when the
         user comes back to it. */
      if (A.goBack()) return;
      if (App.minimizeApp) App.minimizeApp();
      else if (App.exitApp) App.exitApp();
    });
  }

  /* One attribute on <body> carries safe mode into the CSS, so the bar is not
     hidden by a rule per element that could be missed. */
  function markSafe() {
    var L = global.ArtLock;
    var on = !!(L && L.isLimited());
    if (on) document.body.setAttribute('data-safe', '1');
    else document.body.removeAttribute('data-safe');
  }
  A.Bus.on('language', function () { paintTabs(); });
  A.Bus.on('route', markSafe);
  A.Bus.on('unlocked', markSafe);

  /* ══ theme buttons in the top bar ═════════════════════════════════════
     Three quick-access schemes sit beside the settings cog: Artemis (the
     everyday theme, which the button toggles between its day and night
     versions), Military HUD, and Night. The full list still lives in
     Settings; these are the ones reached for often enough to earn a button. */
  function setTheme(t) {
    A.store.set('theme', t);
    A.applyTheme();
    A.Bus.emit('theme');
    A.haptic(14);
    paintThemeButtons();
    A.Router.refresh();
  }
  /* Two toggles, not three buttons. Each stands for a FAMILY and switches
     within it, and its icon says which member is showing:
       Artemis  - sun for the day version, moon for the night version;
       Tactical - a target for Military HUD, a red eye for Night.
     Tapping a family you are not in returns you to whichever member of it you
     used last, so the pair remembers your two working schemes. */
  function paintThemeButtons() {
    var host = A.$('#tbThemes');
    if (!host) return;
    A.clear(host);
    var cur = A.store.get('theme', 'dark');
    var artemisSub = A.store.get('theme.artemisSub', cur === 'light' ? 'light' : 'dark');
    var tacticalSub = A.store.get('theme.tacticalSub', cur === 'night' ? 'night' : 'milhud');
    var inArtemis = cur === 'dark' || cur === 'light';
    var inTactical = cur === 'milhud' || cur === 'night';

    /* Artemis: sun = day (light), moon = night (dark) */
    var showLight = inArtemis ? (cur === 'light') : (artemisSub === 'light');
    host.appendChild(A.el('button.tb-btn' + (inArtemis ? '.on' : ''), {
      html: Icons.svg(showLight ? 'sun' : 'moon'),
      title: inArtemis ? 'Artemis ' + (cur === 'light' ? 'Helios, tap for Selene' : 'Selene, tap for Helios')
                       : 'Artemis',
      onclick: function () {
        var next;
        if (inArtemis) next = cur === 'light' ? 'dark' : 'light';   /* toggle day/night */
        else next = artemisSub;                                     /* re-enter last used */
        A.store.set('theme.artemisSub', next);
        setTheme(next);
      }
    }));

    /* Raider: night and day, the same interface in two lights. Sun for the
       day version, moon for the night one, matching how Artemis reads. */
    var raiderSub = A.store.get('theme.raiderSub', cur === 'raiderday' ? 'raiderday' : 'raider');
    var inRaider = cur === 'raider' || cur === 'raiderday';
    var raiderDay = inRaider ? (cur === 'raiderday') : (raiderSub === 'raiderday');
    host.appendChild(A.el('button.tb-btn' + (inRaider ? '.on' : ''), {
      html: Icons.svg('frame'),
      title: inRaider ? 'Raider ' + (cur === 'raiderday' ? 'Complex, tap for Bunker' : 'Bunker, tap for Complex')
                      : 'Raider',
      onclick: function () {
        var next;
        if (inRaider) next = cur === 'raiderday' ? 'raider' : 'raiderday';
        else next = raiderSub;
        A.store.set('theme.raiderSub', next);
        setTheme(next);
      }
    }));

    /* Tactical: target = Military HUD, eye = Night */
    var showNight = inTactical ? (cur === 'night') : (tacticalSub === 'night');
    host.appendChild(A.el('button.tb-btn' + (showNight ? '.tb-night' : '') + (inTactical ? '.on' : ''), {
      html: Icons.svg(showNight ? 'eye' : 'target'),
      title: inTactical ? (cur === 'night' ? 'Military RED, tap for Military HUD' : 'Military HUD, tap for Military RED')
                        : (showNight ? 'Military RED' : 'Military HUD'),
      onclick: function () {
        var next;
        if (inTactical) next = cur === 'night' ? 'milhud' : 'night';   /* toggle */
        else next = tacticalSub;                                       /* re-enter last used */
        A.store.set('theme.tacticalSub', next);
        setTheme(next);
      }
    }));
  }
  function wireThemeButtons() {
    paintThemeButtons();
    /* the settings screen changes the theme too; keep the buttons in step */
    A.Bus.on('theme', paintThemeButtons);
  }

  /* ══ boot ═════════════════════════════════════════════════════════════ */

  function boot() {
    A.applyTheme();

    /* the splash draws no mark of its own any more: it is a single image with
       the wordmark already in it */
    A.$('#tbMark').innerHTML = Icons.mark(26);
    A.$('#tbBack').innerHTML = Icons.svg('back');

    /* the arrow and the hardware key take the SAME path, so they cannot end
       up in different places from the same screen */
    A.$('#tbBack').addEventListener('click', function () { A.goBack(); });

    wireThemeButtons();

    A.Bus.on('route', paintTabs);
    A.Bus.on('units:changed', function () { A.Router.refresh(); });
    A.Bus.on('setting:wakelock', updateWakeLock);

    /* The language has to be chosen before a single label is drawn, or the
       first screen is painted in English and then flickers. This is
       synchronous - every pack is already in the bundle - so it simply
       happens first. */
    if (global.ArtI18n) { try { global.ArtI18n.load(); } catch (e) {} }

    /* Restore the licence BEFORE anything is gated, then repaint once the
       answer is known. Nothing called this until now, which meant a stored key
       was never read back: the app verified it at activation and then forgot
       it at the next launch. */
    if (global.ArtLicence) {
      global.ArtLicence.load().then(function () {
        A.Router.refresh();
        A.Bus.emit('licence-ready');
      }).catch(function () {});
    }

    A.Router.start(A.$('#view'));
    paintTabs();
    updateWakeLock();

    /* Cache exchange rates in the background whenever the app opens online, so
       the converter always has the last-known rates to work from offline. */
    if (global.ArtFX) { try { global.ArtFX.load(false); } catch (e) {} }

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') updateWakeLock();
    });

    A.$('#app').hidden = false;
    var sp = A.$('#splash');
    setTimeout(function () {
      sp.classList.add('out');
      setTimeout(function () { sp.remove(); }, 360);
    }, 620);

    wireAndroidBack();
    registerServiceWorker();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})(window);
