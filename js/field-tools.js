/*
 * Artemidos - field tools (ported from the Algoz Ops portal)
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Airports & cities · Distance by road, helicopter and jet · Country reference
 * · Currency · Phonetic alphabets.
 *
 * The place-search logic is carried over unchanged from the ops portal,
 * including the anchor-city approach: a raw substring match on "london" also
 * hits "Groton (New London)", "East London" and "London, Canada", so the
 * search anchors on the best city-name prefix by population and then keeps
 * only airports within a radius of it.
 *
 * Data files (field-tools-data.js, field-tools-countries.js) are the same
 * assets the portal ships and are lazy-loaded on first use: the airport set
 * alone is 2.5 MB and has no business being in the startup path.
 */
(function (global) {
  'use strict';

  var NATO = {
    A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf',
    H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November',
    O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform',
    V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
    '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner'
  };
  /* ══ THE RUSSIAN ALPHABET, KEYED BY THE LETTERS IT IS FOR ══════════════
     This was previously a Latin table: A gave "Anna", Q gave "Ku". That is
     backwards. The Russian radio alphabet spells CYRILLIC, and forcing it
     through Latin keys produced letters that do not exist in it (Q, W) while
     losing eight that do - Ж, Ц, Ч, Ш, Щ, Ъ, Ь, Э, Ю, Я had nowhere to go.

     So it is keyed by Cyrillic now, and each entry carries both forms: the
     word as it is written and as it is said by someone who does not read
     Cyrillic. Both are shown, because a person reading this off a screen to
     someone on a radio needs the second, and a person checking what they just
     heard needs the first.

     Where two code words are in common use the standard one is given: Семён
     for С rather than Сергей, Эхо for Э rather than Эмма. */
  var RUS = {
    'А': ['Анна', 'Anna'],            'Б': ['Борис', 'Boris'],
    'В': ['Василий', 'Vasiliy'],      'Г': ['Григорий', 'Grigoriy'],
    'Д': ['Дмитрий', 'Dmitriy'],      'Е': ['Елена', 'Yelena'],
    'Ж': ['Женя', 'Zhenya'],          'З': ['Зинаида', 'Zinaida'],
    'И': ['Иван', 'Ivan'],            'Й': ['Иван краткий', 'Ivan kratkiy'],
    'К': ['Константин', 'Konstantin'],'Л': ['Леонид', 'Leonid'],
    'М': ['Михаил', 'Mikhail'],       'Н': ['Николай', 'Nikolay'],
    'О': ['Ольга', 'Olga'],           'П': ['Павел', 'Pavel'],
    'Р': ['Роман', 'Roman'],          'С': ['Семён', 'Semyon'],
    'Т': ['Татьяна', 'Tatyana'],      'У': ['Ульяна', 'Ulyana'],
    'Ф': ['Фёдор', 'Fyodor'],         'Х': ['Харитон', 'Khariton'],
    'Ц': ['Цапля', 'Tsaplya'],        'Ч': ['Человек', 'Chelovek'],
    'Ш': ['Шура', 'Shura'],           'Щ': ['Щука', 'Shchuka'],
    'Ъ': ['твёрдый знак', 'tvyordiy znak'],
    'Ы': ['еры', 'yery'],
    'Ь': ['мягкий знак', 'myagkiy znak'],
    'Э': ['эхо', 'ekho'],             'Ю': ['Юрий', 'Yuriy'],
    'Я': ['Яков', 'Yakov'],
    '0': ['ноль', 'nol'],             '1': ['один', 'odin'],
    '2': ['два', 'dva'],              '3': ['три', 'tri'],
    '4': ['четыре', 'chetyre'],       '5': ['пять', 'pyat'],
    '6': ['шесть', 'shest'],          '7': ['семь', 'sem'],
    '8': ['восемь', 'vosem'],         '9': ['девять', 'devyat']
  };

  var RUS_ORDER = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789';

  /* Typing Latin should still reach it, because most people carrying this
     have no Cyrillic keyboard. Each Latin letter maps to the Cyrillic one it
     stands for in ordinary transliteration. The ambiguous ones are resolved
     the way a Russian speaker would read them: C to Ц, J to Й, W to В, X to Х,
     Y to Ы. Q has no Cyrillic equivalent at all and is left alone rather than
     invented. */
  var LAT_TO_CYR = {
    A: 'А', B: 'Б', C: 'Ц', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Х', I: 'И',
    J: 'Й', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', R: 'Р', S: 'С',
    T: 'Т', U: 'У', V: 'В', W: 'В', X: 'Х', Y: 'Ы', Z: 'З'
  };

  /* Ё is written for Е on a keyboard that has it, and they share a code word.
     Same for the two ways people type the hard and soft signs. */
  function cyrKey(ch) {
    if (ch === 'Ё') return 'Е';
    if (RUS[ch]) return ch;
    return LAT_TO_CYR[ch] || null;
  }

  var DATA = null, dataState = 0;      /* 0 none, 1 loading, 2 ready */
  var CDATA = null, cdState = 0;
  var CAPS = null, capState = 0;        /* ISO -> capital city */
  var AGY = null, agyState = 0;         /* ISO -> police & intelligence services */
  var FRC = null, frcState = 0;         /* ISO -> service equipment in use */
  var DP = {};                          /* selected distance points */
  var CSEL = null, CQ = '';

  function ensure(src, globalName, setter, cb, stateGet, stateSet) {
    if (global[globalName]) { setter(global[globalName]); cb(); return; }
    if (stateGet() === 1) {
      var t = setInterval(function () {
        if (global[globalName]) { clearInterval(t); setter(global[globalName]); cb(); }
      }, 120);
      return;
    }
    stateSet(1);
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { setter(global[globalName] || null); cb(); };
    s.onerror = function () { setter(null); cb(); };
    document.head.appendChild(s);
  }

  function ensureData(cb) {
    ensure('js/field-tools-data.js?v=7c850c82', 'ALGOZ_FT_DATA',
      function (d) { DATA = d || { a: [], c: [] }; dataState = 2; },
      cb, function () { return dataState; }, function (v) { dataState = v; });
  }
  function ensureCapitals(cb) {
    ensure('js/field-tools-capitals.js?v=974add33', 'ALGOZ_FT_CAPITALS',
      function (d) { CAPS = d || {}; capState = 2; },
      cb, function () { return capState; }, function (v) { capState = v; });
  }

  /* A place picker for setting coordinates by hand when there is no GNSS fix:
     the offline city database (5,800+ cities with lat/lon) is searched by name
     or country, and the chosen place's coordinates are handed back. Used by
     the shadow and sun tools, and available to anything else that needs a
     location without a satellite. */
  A.pickPlace = function (onPick) {
    var ov = A.el('.place-ov');
    var box = A.el('.place-box');
    var head = A.el('.place-head');
    head.appendChild(A.el('span.place-title', { text: 'Pick a place' }));
    head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { ov.remove(); } }));
    var searchWrap = A.el('.place-search');
    var list = A.el('.place-list');
    box.appendChild(head);
    box.appendChild(searchWrap);
    box.appendChild(list);
    ov.appendChild(box);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);

    list.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading places…</div>' }));

    ensureData(function () {
      var cities = (DATA && DATA.c) || [];
      var search = A.UI.search('Search city or country…', function (q) { paint(q); });
      searchWrap.appendChild(search);

      function paint(q) {
        A.clear(list);
        q = (q || '').trim().toLowerCase();
        var rows = cities;
        if (q) rows = cities.filter(function (c) {
          return c[0].toLowerCase().indexOf(q) >= 0 || (c[1] || '').toLowerCase().indexOf(q) >= 0;
        });
        rows = rows.slice().sort(function (a, b) { return (b[4] || 0) - (a[4] || 0); }).slice(0, 100);
        if (!rows.length) { list.appendChild(A.UI.empty('No place matches that.')); return; }
        rows.forEach(function (c) {
          list.appendChild(A.UI.row({
            plain: true, title: c[0],
            sub: c[1] + '  ·  ' + c[2].toFixed(3) + ', ' + c[3].toFixed(3),
            onclick: function () { ov.remove(); onPick({ name: c[0], country: c[1], lat: c[2], lon: c[3] }); }
          }));
        });
      }
      paint('');
    });
  };
  function ensureAgencies(cb) {
    ensure('js/field-tools-agencies.js?v=026d9e8b', 'ALGOZ_FT_AGENCIES',
      function (d) { AGY = d || {}; agyState = 2; },
      cb, function () { return agyState; }, function (v) { agyState = v; });
  }
  function ensureForces(cb) {
    ensure('js/field-tools-forces.js?v=8adc88b7', 'ALGOZ_FT_FORCES',
      function (d) { FRC = d || {}; frcState = 2; },
      cb, function () { return frcState; }, function (v) { frcState = v; });
  }
  function ensureCountries(cb) {
    ensure('js/field-tools-countries.js?v=b14f4509', 'ALGOZ_FT_COUNTRIES',
      function (d) { CDATA = d || { m: {}, c: [] }; cdState = 2; },
      cb, function () { return cdState; }, function (v) { cdState = v; });
  }

  /* great-circle distance, km */
  function hav(la1, lo1, la2, lo2) {
    var R = 6371, toR = Math.PI / 180;
    var dLa = (la2 - la1) * toR, dLo = (lo2 - lo1) * toR;
    var a = Math.sin(dLa / 2) * Math.sin(dLa / 2) +
      Math.cos(la1 * toR) * Math.cos(la2 * toR) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /* curated resort / destination -> serving airport */
  var ALIAS = {
    'st moritz': ['SMV'], 'st. moritz': ['SMV'], 'saint moritz': ['SMV'], 'sankt moritz': ['SMV'],
    'engadin': ['SMV'], 'engadine': ['SMV'], 'samedan': ['SMV'], 'davos': ['SMV'],
    'pontresina': ['SMV'], 'celerina': ['SMV'],
    'gstaad': ['LSGK'], 'saanen': ['LSGK'],
    'verbier': ['SIR'], 'zermatt': ['SIR'], 'crans montana': ['SIR'], 'crans-montana': ['SIR'], 'sion': ['SIR'],
    'courchevel': ['CVF'], 'meribel': ['CVF'], 'méribel': ['CVF'], 'val thorens': ['CVF'],
    'megeve': ['MVV'], 'megève': ['MVV'],
    "val d'isere": ['CMF'], "val d'isère": ['CMF'], 'val disere': ['CMF'], 'tignes': ['CMF'],
    'chambery': ['CMF'], 'chambéry': ['CMF'],
    'st tropez': ['LTT'], 'saint tropez': ['LTT'], 'saint-tropez': ['LTT'], 'la mole': ['LTT'], 'la môle': ['LTT'],
    'cannes': ['CEQ'], 'mandelieu': ['CEQ'], 'antibes': ['CEQ'],
    'monaco': ['MCM'], 'monte carlo': ['MCM'], 'monte-carlo': ['MCM'],
    'cortina': ['VCE'], "cortina d'ampezzo": ['VCE'],
    'porto cervo': ['OLB'], 'costa smeralda': ['OLB'], 'sardinia': ['OLB'], 'sardegna': ['OLB'],
    'mykonos': ['JMK'], 'santorini': ['JTR'], 'ibiza': ['IBZ'], 'marbella': ['AGP'], 'puerto banus': ['AGP'],
    'aspen': ['ASE'], 'vail': ['EGE'], 'jackson hole': ['JAC'],
    'lake como': ['LIN'], 'como': ['LIN'], 'forte dei marmi': ['PSA'], 'portofino': ['GOA']
  };

  /* ══ NAMES, AS THE PERSON TYPING THEM KNOWS THEM ═══════════════════════
     The place database stores each city under one name, and that name is
     sometimes local and sometimes English with no rule to it: Geneva is filed
     as "Genève", Cologne as "Köln", but Munich, Vienna, Rome and Prague are
     all filed in English. Typing "geneva" therefore returned no city at all,
     which quietly disabled the whole feature that finds the airports AROUND a
     city - the search fell back to matching airport names and offered three
     airstrips in Geneva, Ohio ahead of GVA.

     Two things fix it, and both are needed:

     FOLDING   accents off, punctuation and spaces out. That alone recovers
               Köln from "koln", Göteborg from "goteborg", Nürnberg from
               "nurnberg", Zürich, Malmö, Bogotá and every other city whose
               only difference from the typed form is a diacritic. NFD does
               not decompose the stroked letters, so ø, æ, ß, ł and đ are
               mapped by hand.

     EXONYMS   a short table for the cases where the English name is not the
               local name with accents removed. Only nine are needed, because
               folding already covers the rest, and each was checked against
               the database rather than guessed - an alias pointing at a city
               that is not there is worse than none, since it looks like it
               worked. */
  function fold(x) {
    return A.skey(String(x == null ? '' : x)
      .replace(/ø/gi, 'o').replace(/æ/gi, 'ae').replace(/ß/g, 'ss')
      .replace(/ł/gi, 'l').replace(/đ/gi, 'd').replace(/ð/gi, 'd')
      .replace(/þ/gi, 'th'));
  }

  var CITY_ALIAS = {
    geneva: 'geneve', cologne: 'koln', gothenburg: 'goteborg',
    antwerp: 'antwerpen', seville: 'sevilla', nuremberg: 'nurnberg',
    mecca: 'makkah', medina: 'madinah', hanover: 'hannover',
    kiev: 'kyiv'
  };

  /* Folding 28,426 airport rows on every keystroke is a visible stutter on a
     phone, so it is done once, the first time anything is searched, and kept.
     The index is parallel to DATA.a and DATA.c, by position. */
  var AKEY = null, CKEY = null;
  function ensureIndex() {
    if (AKEY) return;
    var Ar = (DATA && DATA.a) || [], Cr = (DATA && DATA.c) || [];
    AKEY = new Array(Ar.length);
    for (var i = 0; i < Ar.length; i++) {
      var a = Ar[i];
      AKEY[i] = {
        ia: (a[0] || '').toLowerCase(),
        ic: (a[1] || '').toLowerCase(),
        nm: fold(a[2]),
        ct: fold(a[3]),
        hay: fold((a[2] || '') + ' ' + (a[3] || '') + ' ' + (a[4] || ''))
      };
    }
    CKEY = new Array(Cr.length);
    for (var j = 0; j < Cr.length; j++) CKEY[j] = fold(Cr[j][0]);
  }

  /* ══ WHAT KIND OF FIELD IS THIS ════════════════════════════════════════
     The dataset carries one flag at index 7, and it is worth being honest
     about what that flag actually is: it is set for every field with no IATA
     code, which is 20,543 of the 28,426 entries. That is not "private" in any
     meaningful sense, it is "no scheduled airline service" - which covers
     general aviation strips, military bases and farm runways alike.

     So the flag alone is not a useful label. A military field is read out of
     the NAME instead, which is where the operator is actually stated: air
     base, air force station, RAF, naval air station, army airfield. That
     catches 466 of them, and it matters more than the IATA flag does, because
     landing at one uninvited is a different order of problem from landing at a
     quiet strip.

     Three states, in decreasing order of consequence:
       MILITARY   named as a service field. Assume prior permission, a slot and
                  a diplomatic clearance, or you are not going.
       PRIVATE/GA no IATA code. Handling, fuel and customs are arranged, not
                  assumed, and it may have no night or all-weather capability.
       (nothing)  has an IATA code, so scheduled service exists. */
  var MIL_RE = new RegExp([
    'air base', 'airbase', 'air force base', 'air force station', 'afb\\b',
    'air station', 'naval air', 'naval station', '\\bnas\\b', '\\braf\\b',
    '\\brnas\\b', 'army airfield', 'army air field', '\\baaf\\b',
    'military', 'marine corps', 'coast guard', 'aerodrome militaire',
    'base aerea', 'base aérea', 'air force',
    /* named differently but the same thing: Joint Base Andrews, Al Dhafra AB,
       Canadian Forces Base, Air National Guard */
    'joint base', '\\\\bab airport', '\\\\bcfb\\\\b', 'air national guard', '\\\\bangb\\\\b'
  ].join('|'), 'i');

  function airKind(a) {
    if (MIL_RE.test(a[2] || '')) return 'mil';
    if (a[7]) return 'ga';
    return '';
  }

  /* Coordinates are shown as signed decimal degrees to three places, which is
     about 100 m - finer than the published field reference point is worth, and
     coarse enough to read aloud over a radio without losing your place. */
  function coordText(lat, lon) {
    function one(v, pos, neg) {
      return Math.abs(v).toFixed(3) + '\u00b0 ' + (v >= 0 ? pos : neg);
    }
    return one(lat, 'N', 'S') + '  ' + one(lon, 'E', 'W');
  }
  A.coordText = coordText;

  function tagEls(kind) {
    if (kind === 'mil') return [A.el('span.tag.warn', { text: 'Military' })];
    if (kind === 'ga') return [A.el('span.tag', { text: 'Private / GA' })];
    return [];
  }

  /* airport row = [iata, icao, name, city, country, lat, lon, private]
     city row    = [name, country, lat, lon, population thousands]      */
  function placeSearch(s) {
    var Ar = (DATA && DATA.a) || [], Cr = (DATA && DATA.c) || [];
    ensureIndex();
    var isCode = /^[a-z0-9]{3,4}$/.test(s);
    var R = 75;

    /* the typed text, folded, then run through the exonym table */
    var q = fold(s);
    if (CITY_ALIAS[q]) q = CITY_ALIAS[q];

    var cityHits = [];
    for (var i = 0; i < Cr.length; i++) {
      var c = Cr[i], nm = CKEY[i];
      if (nm === q) cityHits.push({ c: c, rank: 0 });
      else if (nm.indexOf(q) === 0) cityHits.push({ c: c, rank: 1 });
    }
    cityHits.sort(function (x, y) { return x.rank - y.rank || (y.c[4] || 0) - (x.c[4] || 0); });
    var anchor = cityHits.length ? cityHits[0].c : null;

    var aliasCodes = {};
    Object.keys(ALIAS).forEach(function (k) {
      var fk = fold(k);
      if (fk.indexOf(q) >= 0 || q.indexOf(fk) >= 0) {
        ALIAS[k].forEach(function (cd) { aliasCodes[cd.toLowerCase()] = 1; });
      }
    });

    var pri = [], codeM = [], near = [], pfx = [], sub = [];
    for (var j = 0; j < Ar.length; j++) {
      var a = Ar[j], k = AKEY[j];
      if (aliasCodes[k.ia] || aliasCodes[k.ic]) { pri.push(a); continue; }
      if (isCode && (k.ia === s || k.ic === s)) { codeM.push(a); continue; }
      if (anchor) {
        var dd = hav(anchor[2], anchor[3], a[5], a[6]);
        if (dd <= R) { near.push([dd, a]); continue; }
      }
      if (k.ct.indexOf(q) === 0 || k.nm.indexOf(q) === 0) pfx.push(a);
    }
    /* Nearest is not the same as most useful. Typing "Dubai" put Al Minhad Air
       Base at the top, eight kilometres out and closer than DXB, which is a
       correct answer to the wrong question. So the fields are banded by what
       you can actually arrive at - scheduled service, then general aviation,
       then military - and distance only decides the order inside a band. */
    function band(a) {
      var k = airKind(a);
      if (k === 'mil') return 2;
      return a[0] ? 0 : 1;
    }
    near.sort(function (x, y) {
      return band(x[1]) - band(y[1]) || x[0] - y[0];
    });
    var nearA = near.map(function (x) { return x[1]; });

    var airports;
    if (anchor && nearA.length) {
      airports = pri.concat(codeM, nearA);
    } else {
      if (!pri.length && !codeM.length && !pfx.length) {
        for (var m = 0; m < Ar.length && sub.length < 40; m++) {
          if (AKEY[m].hay.indexOf(q) >= 0) sub.push(Ar[m]);
        }
      }
      airports = pri.concat(codeM, pfx, sub);
    }

    /* how far each neighbouring field is from the city that was typed. This is
       the number that decides which airport you actually use, so it has to
       survive out of this function rather than being thrown away with the
       sort. */
    var nearKm = {};
    near.forEach(function (x) {
      var cd = x[1][0] || x[1][1];
      if (cd && nearKm[cd] == null) nearKm[cd] = x[0];
    });

    var seen = {}, outA = [];
    airports.forEach(function (a2) {
      var cd = a2[0] || a2[1];
      if (cd && !seen[cd]) { seen[cd] = 1; outA.push(a2); }
    });
    return {
      anchorCity: anchor,
      nearKm: nearKm,
      cities: cityHits.slice(0, 3).map(function (h) { return h.c; }),
      airports: outA.slice(0, 40)
    };
  }

  /* ══ view ═════════════════════════════════════════════════════════════ */

  /* A grid of buttons to pick the tool, rather than a row of top tabs: with
     six tools the tabs overflowed and the chosen one scrolled out of sight.
     Each tool is a route param (#/field?tab=radio) so it deep-links and the
     Android back button walks out of a tool to the menu. */
  /* A tool with a `route` is a separate screen (the calculator, the converter)
     and is navigated to; the rest render inside the field page as a ?tab. */
  /* The order here is the order on the screen. */
  var TOOLS = [
    { id: 'calc',  label: 'Calculator', icon: 'calc',   route: 'calc',   d: 'Scientific calculator and maths tools' },
    { id: 'convert', label: 'Converter', icon: 'convert', route: 'convert', d: 'Full unit converter, every measure' },
    { id: 'time',  label: 'Time & Calendar', icon: 'clock',  d: 'Calendar, clock, stopwatch and alarms' },
    { id: 'sunmoon', label: 'Sun & moon', icon: 'sun', route: 'sunmoon', d: 'Sunrise, sunset, twilight, moon phase, positions' },
    { id: 'notes', label: 'Notebook',  icon: 'grid',   d: 'Your notes, filed by category' },
    { id: 'health', label: 'Health', icon: 'ambulance', d: 'Body reference, pulse counter, CPR metronome' },
    { id: 'radio', label: 'Radio',     icon: 'radio',  d: 'Frequencies, range and comms planning' },
    { id: 'ph',    label: 'Phonetic',  icon: 'language', d: 'NATO and Russian spelling alphabets' },
    { id: 'level', label: 'Bubble level', icon: 'target', route: 'level', d: 'Spirit level from the tilt sensor' },
    { id: 'fx',    label: 'Currency',  icon: 'money',  d: 'Quick offline converter' },
    { id: 'sensors', label: 'Sensors', icon: 'target', d: 'What this phone has, and what it reads now' },
    /* moved to the Navigation section, kept here (hidden) so links, Console
       shortcuts and stored state keep working */
    { id: 'tides', label: 'Tides', icon: 'route', route: 'tides', d: 'Offline harmonic tide prediction by station', hidden: true },
    { id: 'clino', label: 'Clinometer', icon: 'range', route: 'clino', d: 'Angle of elevation, sighted with the camera', hidden: true },
    { id: 'range', label: 'Rangefinder', icon: 'range', route: 'range',  d: 'Distance by camera, mil scale and flash-to-bang', hidden: true },
    { id: 'nav',   label: 'Sea navigation', icon: 'route', d: 'Chart work, sailings, tacking, compass', hidden: true },
    { id: 'air',   label: 'Airports',  icon: 'plane',  d: 'Find airports by city, resort or code', hidden: true },
    { id: 'dist',  label: 'Between places',  icon: 'route',  d: 'Road, helicopter and jet between places', hidden: true }
  ];

  function renderMenu(host) {
    A.setTitle('Field tools');
    var grid = A.el('.tiles');
    TOOLS.forEach(function (t) {
      if (t.hidden) return;
      var tile = A.el('button.tile', {
        onclick: function () { A.haptic(); A.Router.go(t.route ? t.route : 'field?tab=' + t.id); }
      });
      tile.appendChild(A.el('.tile-ic', { html: Icons.svg(t.icon) }));
      tile.appendChild(A.el('.tile-t', { text: t.label }));
      tile.appendChild(A.el('.tile-s', { text: t.d }));
      grid.appendChild(tile);
    });
    host.appendChild(grid);
  }

  function render(host, params) {
    var tab = params.query.tab;
    /* route-backed tools are their own screens, never a ?tab here */
    if (!tab || !TOOLS.some(function (t) { return t.id === tab && !t.route; })) {
      return renderMenu(host);
    }
    A.store.set('field.tab', tab);

    var tool = TOOLS.filter(function (t) { return t.id === tab; })[0];
    /* The top bar's own back arrow returns to the field-tools menu, so a second
       "All field tools" button here was redundant. Sub-screens (a country's
       page) are routed, so that same one arrow also steps back to their list. */
    A.setTitle(tool.label, { back: true });

    var body = A.el('div');
    host.appendChild(body);

    if (tab === 'nav') return global.ArtNav.render(body);
    if (tab === 'time') return global.ArtTime.render(body);
    if (tab === 'notes') return global.ArtNotebook.render(body);
    if (tab === 'radio') return global.ArtRadio.render(body);
    /* Morse now lives as a tab on the Radio page, where it belongs beside the
       other ways of getting a message out. The route is kept so an old link or
       stored tab still lands somewhere sensible. */
    if (tab === 'morse') { A.store.set('radio.tab', 'morse'); A.Router.go('field?tab=radio'); return; }
    /* the health page owns intervals in both its tabs, so its teardown has to
       reach the router the way the time tools' does */
    if (tab === 'health') return global.ArtHealth.render(body);
    /* the sensor page watches live sensors, so its teardown reaches the router */
    if (tab === 'sensors') return global.ArtSensors.render(body);
    if (tab === 'ph') return renderPhonetic(body);
    if (tab === 'fx') return renderCurrency(body);
    if (tab === 'cty') return renderCountry(body, params);

    if (dataState !== 2) {
      body.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading airport and city data…</div>' }));
      ensureData(function () {
        A.clear(body);
        if (tab === 'air') renderAirports(body); else renderDist(body);
      });
      return;
    }
    if (tab === 'air') renderAirports(body); else renderDist(body);
  }

  /* ── airports ── */

  /* Shown before anything is typed. A search box over an empty screen reads
     as a broken tool, so the tab opens with something usable. */
  var QUICK_PLACES = [
    'DXB', 'AUH', 'DOH', 'LHR', 'CDG', 'FRA', 'MXP', 'GVA', 'ZRH',
    'JFK', 'LAX', 'MIA', 'SIN', 'HKG', 'NRT', 'IST', 'MCM', 'SMV'
  ];

  function renderAirports(host) {
    var res = A.el('div');
    var searchBox = A.UI.search('City, resort (St. Moritz) or code (DXB, MXP, LSGK)…', run);
    host.appendChild(searchBox);
    host.appendChild(res);

    function airportCard(a) {
      var code = a[0] || a[1];
      var loc = [a[3], a[4]].filter(Boolean).join(', ');
      var card = A.UI.card(null, 'tight');
      var head = A.el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } });
      head.appendChild(A.el('b.lrow-t', { text: code, style: { color: 'var(--acc)', fontFamily: 'var(--mono)' } }));
      head.appendChild(A.el('span.lrow-t', { text: a[2], style: { fontWeight: '600' } }));
      tagEls(airKind(a)).forEach(function (t) { head.appendChild(t); });
      card.appendChild(head);
      card.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '3px' },
        text: (loc || '-') + (a[1] ? '  ·  ICAO ' + a[1] : '') + '  ·  ' + coordText(a[5], a[6])
      }));
      return card;
    }

    function showIdle() {
      A.clear(res);
      var A_ = (DATA && DATA.a) || [];
      res.appendChild(A.UI.note(
        'Search by city or resort name, by 3-letter IATA code or by 4-letter ICAO code. ' +
        A_.length.toLocaleString() + ' airports and ' + (((DATA && DATA.c) || []).length).toLocaleString() +
        ' cities are loaded, private and general-aviation fields included.'
      ));
      res.appendChild(A.UI.section('Frequently used'));
      var byCode = {};
      A_.forEach(function (a) { var c = a[0] || a[1]; if (c) byCode[c] = a; });
      QUICK_PLACES.forEach(function (c) { if (byCode[c]) res.appendChild(airportCard(byCode[c])); });
    }

    function run(q) {
      A.clear(res);
      var s = String(q || '').toLowerCase();
      if (s.length < 2) { showIdle(); return; }
      var r = placeSearch(s);
      if (!r.airports.length) { res.appendChild(A.UI.empty('No airport found for "' + q + '".')); return; }
      if (r.anchorCity) {
        res.appendChild(A.el('.note', {
          style: { marginTop: '0' },
          text: 'Airports around ' + r.anchorCity[0] + ', ' + r.anchorCity[1]
        }));
      }
      r.airports.forEach(function (a) { res.appendChild(airportCard(a)); });
    }

    showIdle();
  }

  /* ── distance ── */
  function renderDist(host) {
    var card = A.UI.card();
    var res = A.el('div');

    function acField(label, slot) {
      var wrap = A.el('.fld');
      wrap.appendChild(A.el('span.fld-lab', { text: label }));
      var inp = A.el('input.fld-in', {
        placeholder: 'Airport code or city…', autocomplete: 'off',
        autocapitalize: 'off', spellcheck: 'false',
        value: DP[slot] ? DP[slot].label : ''
      });
      /* .fld-in is flex:1, which only fills when it sits in a flex row.
         Without this the input keeps its intrinsic ~20-character width and
         renders half the card wide, which looks broken and is harder to hit. */
      var row = A.el('.fld-row');
      row.appendChild(inp);
      var list = A.el('div', {
        style: {
          display: 'none', marginTop: '4px', background: 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
          maxHeight: '40vh', overflow: 'auto'
        }
      });
      wrap.appendChild(row);
      wrap.appendChild(list);

      function close() { list.style.display = 'none'; }

      inp.addEventListener('input', A.debounce(function () {
        var s = inp.value.trim().toLowerCase();
        DP[slot] = null;
        if (s.length < 2) { close(); return; }
        var r = placeSearch(s), out = [];
        r.cities.forEach(function (c) {
          out.push({ t: 'city', label: c[0] + ', city centre', sub: c[1], lat: c[2], lon: c[3], kind: '' });
        });
        /* Type a city and you get the fields AROUND it, each with how far out
           it sits. That distance is the whole decision: a military base 12 km
           away is closer than the international, and still the wrong answer. */
        r.airports.forEach(function (a) {
          var cd = a[0] || a[1];
          var km = r.nearKm[cd];
          var sub = (a[3] ? a[3] + ', ' : '') + a[4];
          if (km != null) sub += '  ·  ' + A.fmtNum(km, 3) + ' km from ' + r.anchorCity[0];
          out.push({
            t: 'air', label: cd + ' · ' + a[2], sub: sub,
            lat: a[5], lon: a[6], kind: airKind(a)
          });
        });
        out = out.slice(0, 20);
        if (!out.length) { close(); return; }
        A.clear(list);
        out.forEach(function (p) {
          list.appendChild(A.el('button', {
            style: {
              display: 'block', width: '100%', textAlign: 'left', background: 'none',
              border: 0, borderBottom: '1px solid var(--border)', padding: '11px 12px',
              color: 'inherit', lineHeight: '1.5'
            },
            onclick: function () {
              DP[slot] = p;
              inp.value = p.label;
              close();
              calc();
            }
          }, [
            (function () {
              var line = A.el('div', {
                style: { display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }
              });
              line.appendChild(A.el('b.lrow-t', { text: p.label }));
              tagEls(p.kind).forEach(function (t) { line.appendChild(t); });
              return line;
            })(),
            A.el('.lrow-s', { text: p.sub, style: { whiteSpace: 'normal' } }),
            A.el('.lrow-s', { text: coordText(p.lat, p.lon), style: { opacity: '.75' } })
          ]));
        });
        list.style.display = '';
      }, 140));

      inp.addEventListener('blur', function () { setTimeout(close, 180); });
      return wrap;
    }

    card.appendChild(acField('From', 'a'));
    card.appendChild(acField('To', 'b'));
    card.appendChild(res);
    host.appendChild(card);
    host.appendChild(A.UI.note('Helicopter and jet figures are exact great-circle distances plus a fixed allowance for departure and arrival. Road distance and drive time are practical estimates with no live traffic.'));

    function calc() {
      A.clear(res);
      if (!DP.a || !DP.b) { return; }
      var d = hav(DP.a.lat, DP.a.lon, DP.b.lat, DP.b.lon) * 1000;
      /* every one of these is in HOURS, because that is what fmtDur takes.
         d is in metres, so dividing by a speed in metres-per-hour gives hours
         directly. Dividing by m/s here gave seconds and rendered a Dubai to
         Geneva drive as 11 305 days. */
      var road = d * 1.3;
      var roadT = road / 85000;                 /* 85 km/h average */
      var jetT = d / 800000 + 0.5;              /* 800 km/h + 30 min ground */
      var heliT = d / 220000 + 0.12;            /* 220 km/h + 7 min */

      res.appendChild(A.UI.metric('By road (approx)', A.U.fmt('dist', road, { sig: 5 }), { icon: 'car' }));
      res.appendChild(A.UI.metric('Drive time (approx)', A.fmtDur(roadT)));
      res.appendChild(A.UI.metric('Helicopter', A.U.fmt('dist', d, { sig: 5 }) + '  ·  ' + A.fmtDur(heliT), { icon: 'heli' }));
      res.appendChild(A.UI.metric('Private jet', A.U.fmt('dist', d, { sig: 5 }) + '  ·  ' + A.fmtDur(jetT), { icon: 'plane' }));
      res.appendChild(A.UI.metric('Straight line', A.fmtNum(d / 1000, 5) + ' km  ·  ' + A.fmtNum(d / 1852, 5) + ' nmi'));

      /* Both ends written out. Once a distance has been worked out, the next
         thing anyone does with it is put the two points into something else -
         a map, a flight plan, a radio call - and having to go back and re-pick
         them to read the coordinates is the kind of friction that gets a
         number copied down wrong. */
      res.appendChild(A.UI.metric('From', DP.a.label, { sub: coordText(DP.a.lat, DP.a.lon) }));
      res.appendChild(A.UI.metric('To', DP.b.label, { sub: coordText(DP.b.lat, DP.b.lon) }));
      if (DP.a.kind === 'mil' || DP.b.kind === 'mil') {
        res.appendChild(A.UI.note(
          'One of these is a MILITARY field. Civil arrival is by prior permission ' +
          'only, and in most countries by diplomatic clearance as well. Plan an ' +
          'alternate.'));
      } else if (DP.a.kind === 'ga' || DP.b.kind === 'ga') {
        res.appendChild(A.UI.note(
          'One of these has no IATA code, so it carries no scheduled service. ' +
          'Handling, fuel, customs and immigration are arranged in advance, not ' +
          'assumed, and opening hours may be daylight only.'));
      }
    }

    calc();
  }

  /* ── country ──
     The selected country is carried in the route (country?c=<iso>) so the
     top bar's back arrow steps detail -> list -> field menu on its own, with no
     extra in-page back buttons. */
  function renderCountry(host, params) {
    if (cdState !== 2) {
      host.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading country data…</div>' }));
      ensureCountries(function () { A.clear(host); renderCountry(host, params); });
      return;
    }
    var iso = params && params.query && params.query.c;
    if (iso) {
      var sel = CDATA.c.filter(function (c) { return c[1] === iso; })[0];
      if (sel) return renderCountryCard(host, sel);
    }

    var res = A.el('div');
    var search = A.UI.search('Country name, ISO code or currency…', paint);
    search.input.value = CQ;
    host.appendChild(search);
    host.appendChild(res);

    function paint(q) {
      CQ = q != null ? q : CQ;
      var s = String(CQ || '').trim().toLowerCase();
      A.clear(res);
      var list = CDATA.c.filter(function (c) {
        return !s || c[0].toLowerCase().indexOf(s) >= 0 || (c[1] || '').toLowerCase() === s || (c[2] || '').toLowerCase() === s;
      });
      if (!list.length) { res.appendChild(A.UI.empty('No country matches that.')); return; }
      /* two countries to a row: the list is long and each entry is short */
      var grid = A.el('.lgrid');
      res.appendChild(grid);
      list.forEach(function (c) {
        grid.appendChild(A.UI.row({
          title: flagEmo(c[1]) + '  ' + A.tr(c[0]),
          sub: c[2] + ' · ' + A.tr(c[3]),
          onclick: function () { A.Router.go('country?c=' + c[1]); }
        }));
      });
    }
    paint(CQ);
  }

  function flagEmo(iso) {
    if (!iso || iso.length !== 2 || iso === 'XK') return '🏳️';
    var out = '';
    for (var i = 0; i < 2; i++) out += String.fromCodePoint(127397 + iso.charCodeAt(i));
    return out;
  }

  /* entry = [name, iso2, curCode, curName, alsoAccepted, police, fire,
              ambulance, unified, plugs, languages, memberships] */
  function renderCountryCard(host, c) {
    var M = (CDATA && CDATA.m) || {};
    A.setTitle(c[0], { back: true });   /* top-bar arrow steps back to the list */

    host.appendChild(A.el('.card.accent', null, [
      A.el('div', { text: flagEmo(c[1]) + '  ' + A.tr(c[0]), style: { fontSize: '18px', fontWeight: '700' } })
    ]));

    /* Short facts go two to a row: four emergency numbers are a 2x2 block,
       not four rows of mostly empty width. Anything long enough to wrap gets
       a full-width cell, and a section with a single fact spans too, because
       one half-width cell floating alone reads as a mistake. */
    function group(title, rows, opts) {
      opts = opts || {};
      var live = rows.filter(function (r) { return r[1]; });
      if (!live.length) return;
      host.appendChild(A.UI.section(title));
      var grid = A.el('.mgrid');
      live.forEach(function (r) {
        /* opts.pair keeps two facts side by side even when one is a longer
           phrase, so a country's two currencies sit on one row */
        var wide = live.length === 1 || (!opts.pair && String(r[1]).length > 24);
        var cell = A.el('.mcell' + (wide ? '.wide' : ''));
        cell.appendChild(A.el('.mcell-l', null, [
          r[2] ? A.el('span', { html: Icons.svg(r[2]), style: { display: 'flex' } }) : null,
          A.el('span', { text: A.tr(r[0]) })
        ]));
        cell.appendChild(A.el('.mcell-v', { text: String(r[1]) }));
        grid.appendChild(cell);
      });
      host.appendChild(grid);
    }

    /* Reading order is urgency order. The page gets opened for the numbers,
       so they lead; currency and trivia follow; memberships close the page.
       The dialling code sits with the numbers because it is part of them: a
       local emergency number dialled from a roaming foreign handset often
       needs it, and a team calling in from outside always does. */
    group('Emergency numbers', [
      ['Police', c[5], 'shield'],
      ['Fire brigade', c[6], 'fire'],
      ['Ambulance', c[7], 'ambulance'],
      ['Unified emergency', c[8], 'call']
    ]);
    group('Telephone', [['International dialling code', c[12], 'call']]);
    group('Currency', [
      ['National currency', c[2] ? c[2] + ', ' + A.tr(c[3]) : '', 'money'],
      ['Also accepted', A.tr(c[4]), 'convert']
    ], { pair: true });
    /* Who polices the place, and who watches it. A protection team needs to
       know whether the force on the road is civil or military, which service
       runs the airport, and who has to be notified. */
    var agencyHost = A.el('div');
    host.appendChild(agencyHost);
    renderAgencies(agencyHost, c);

    /* what those services actually carry and drive */
    var forceHost = A.el('div');
    host.appendChild(forceHost);
    renderForces(forceHost, c);

    group('Electricity', [['Plug types · voltage', c[9], 'plug']]);
    /* The languages field is a single comma-joined string in the data
       ("Dari, Pashto"), so translating it means splitting, translating each
       name on its own, and rejoining - the same shape of fix as the
       currency name and "also accepted" fields above: a whole string never
       matches a catalogue entry, only its parts do. */
    var spokenTr = (c[10] || '').split(',').map(function (s) {
      return A.tr(s.trim());
    }).join(', ');
    group('Languages', [['Spoken', spokenTr, 'language']]);

    /* capital and largest cities, populated once the capital map and the city
       dataset (shared with the airport tool) are loaded */
    var citiesHost = A.el('div');
    host.appendChild(citiesHost);
    renderCities(citiesHost, c);

    var memb = (c[11] || '').split(',').filter(Boolean);
    if (memb.length) {
      host.appendChild(A.UI.section('Member of'));
      var row = A.el('.pill-row');
      memb.forEach(function (k) { row.appendChild(A.el('.pill', { html: '<b>' + A.esc(A.tr(M[k] || k)) + '</b>' })); });
      host.appendChild(row);
    }

    host.appendChild(A.UI.note('Curated field reference. Reconfirm emergency numbers locally before an operation: coverage and routing vary by region and by carrier.'));
  }

  /* National police and intelligence services, lazy-loaded with the rest of
     the country reference. Public information: names and remits only. */
  function renderAgencies(host, c) {
    function build() {
      A.clear(host);
      var list = (AGY && AGY[c[1]]) || null;
      if (!list || !list.length) return;
      host.appendChild(A.UI.section('Police & intelligence services'));
      var card = A.UI.card(null, 'tight');
      list.forEach(function (a) {
        card.appendChild(A.UI.metric(a[0], a[1], { icon: 'shield', sub: a[2] }));
      });
      host.appendChild(card);
      host.appendChild(A.UI.note('Names and remits only, from public sources. Which service you deal with depends on where you are: several countries police cities and countryside with different forces, and in some of them one of the two is part of the armed forces.'));
    }
    if (agyState !== 2) { ensureAgencies(build); return; }
    build();
  }

  /* Equipment in current service, army and police. This is a recognition aid:
     the rifle on the sling and the vehicle behind it are what tell you which
     service has stopped you, and whether it is civil or military. */
  function renderForces(host, c) {
    function build() {
      A.clear(host);
      var f = (FRC && FRC[c[1]]) || null;
      if (!f) return;
      function block(title, rows, icon) {
        if (!rows || !rows.length) return;
        host.appendChild(A.UI.section(title));
        var card = A.UI.card(null, 'tight');
        rows.forEach(function (r) {
          var m = A.UI.metric(r[0], r[1], { icon: icon });
          var v = m.querySelector('.metric-v');
          if (v) { v.style.whiteSpace = 'normal'; v.style.textAlign = 'right'; v.style.maxWidth = '64%'; v.style.fontSize = '12.5px'; }
          card.appendChild(m);
        });
        host.appendChild(card);
      }
      block('Army equipment in service', f.army, 'tank');
      block('Police equipment in service', f.police, 'shield');
      host.appendChild(A.UI.note('Published open-source inventories. Every country fields several generations at once and replacements run for years, so read this as what you are most likely to see rather than a complete list. Models that appear in Recon can be searched there for full figures.'));
    }
    if (frcState !== 2) { ensureForces(build); return; }
    build();
  }

  /* Capital (seat of government, from the capitals map) and the largest cities
     with their populations (from the shared city dataset). City populations are
     of the city proper, in thousands, as published open data. */
  function renderCities(host, c) {
    function build() {
      A.clear(host);
      var cap = (CAPS && CAPS[c[1]]) || '';
      var cities = (DATA && DATA.c || []).filter(function (x) { return x[1] === c[0]; })
        .sort(function (a, b) { return (b[4] || 0) - (a[4] || 0); });

      function pop(k) {
        if (!k) return '';
        return k >= 1000 ? A.fmtNum(k / 1000, 3) + ' M' : A.fmtNum(k, 3) + ' k';
      }
      /* find the capital's population from the city list if it is there */
      var capPop = '';
      if (cap) {
        var hit = cities.filter(function (x) { return x[0].toLowerCase() === cap.toLowerCase(); })[0];
        if (hit) capPop = pop(hit[4]);
      }

      if (cap) {
        host.appendChild(A.UI.section('Capital'));
        var cc = A.UI.card(null, 'tight');
        cc.appendChild(A.UI.metric(cap, capPop || '—', { icon: 'pin', sub: capPop ? 'city population' : 'seat of government' }));
        host.appendChild(cc);
      }

      /* The capital already has a card of its own directly above, so listing it
         again here just repeated it on the same screen. It is dropped from the
         list rather than starred, and the list is topped back up to eight so
         nothing is lost by removing it. */
      var top = cities.filter(function (x) {
        return x[4] > 0 && !(cap && x[0].toLowerCase() === cap.toLowerCase());
      }).slice(0, 8);
      if (top.length) {
        host.appendChild(A.UI.section(cap ? 'Other large cities' : 'Largest cities'));
        /* name and population are two short facts, so cities pack 2x4
           instead of eight rows of empty width */
        var lc = A.el('.mgrid');
        top.forEach(function (x) {
          var cell = A.el('.mcell');
          cell.appendChild(A.el('.mcell-l', null, [A.el('span', { text: x[0] })]));
          cell.appendChild(A.el('.mcell-v', { text: pop(x[4]) || '—' }));
          lc.appendChild(cell);
        });
        host.appendChild(lc);
        host.appendChild(A.UI.note('City populations are of the city proper, not the wider metropolitan area, in thousands, from open data.'));
      }
    }

    if (capState !== 2 || dataState !== 2) {
      host.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading cities…</div>' }));
      var need = 2;
      var done = function () { if (--need === 0) build(); };
      ensureCapitals(done);
      ensureData(done);
      return;
    }
    build();
  }

  /* ── currency ── */
  function renderCurrency(host) {
    var body = A.el('div');
    host.appendChild(body);
    body.appendChild(A.el('.empty', { html: Icons.svg('refresh', 'spin') + '<div>Loading exchange rates…</div>' }));

    global.ArtFX.load(false).then(function (pack) {
      A.clear(body);
      if (!pack) {
        body.appendChild(A.UI.empty('No rates cached and the device is offline. Connect once and they stay available offline afterwards.'));
        body.appendChild(A.el('button.btn.block', {
          text: 'Try again', onclick: function () { A.Router.refresh(); }
        }));
        return;
      }
      var st = A.store.get('field.fx', { amt: '100', from: 'EUR', to: 'AED' });
      var codes = Object.keys(pack.rates).sort();
      if (!pack.rates[st.from]) st.from = 'EUR';
      if (!pack.rates[st.to]) st.to = codes[0];

      var card = A.UI.card();
      var out = A.el('div');
      var opts = codes.map(function (x) { return { value: x, label: x }; });

      card.appendChild(A.UI.field({
        label: 'Amount', inputmode: 'decimal', value: st.amt,
        oninput: function (e) { st.amt = e.target.value; A.store.set('field.fx', st); calc(); }
      }));
      var row = A.el('.split');
      row.appendChild(A.UI.select({ label: 'From', value: st.from, options: opts, onchange: function (e) { st.from = e.target.value; A.store.set('field.fx', st); calc(); } }));
      row.appendChild(A.UI.select({ label: 'To', value: st.to, options: opts, onchange: function (e) { st.to = e.target.value; A.store.set('field.fx', st); calc(); } }));
      card.appendChild(row);
      card.appendChild(out);
      body.appendChild(card);

      function calc() {
        A.clear(out);
        var v = A.parseNum(st.amt);
        if (!isFinite(v)) return;
        out.appendChild(A.UI.metric(st.to, A.fmtNum(global.ArtFX.convert(pack, v, st.from, st.to), 8), { big: true }));
        out.appendChild(A.UI.metric('Rate', '1 ' + st.from + ' = ' + A.fmtNum(global.ArtFX.convert(pack, 1, st.from, st.to), 6) + ' ' + st.to,
          { sub: 'ECB reference rates ' + pack.date + ', ' + global.ArtFX.age(pack) }));
      }
      calc();
    });
  }

  /* ── phonetic ── */
  function renderPhonetic(host) {
    var card = A.UI.card();
    var natoOut = A.el('.pill-row');
    var rusOut = A.el('.pill-row');

    var inp = A.UI.field({
      label: 'Spell a word or code', placeholder: 'SOS, a name, a callsign, in Latin or Cyrillic',
      value: A.store.get('field.ph', ''),
      oninput: function (e) { A.store.set('field.ph', e.target.value); run(e.target.value); }
    });
    card.appendChild(inp);
    card.appendChild(A.el('.sec-lab', { text: 'NATO / ICAO' }));
    card.appendChild(natoOut);
    card.appendChild(A.el('.sec-lab', { text: 'Russian (radio) - Cyrillic' }));
    card.appendChild(rusOut);
    host.appendChild(card);
    host.appendChild(A.UI.note('The NATO alphabet is the international standard for aviation, maritime and military radio. "Niner" for 9 exists so it cannot be confused with the German "nein".'));
    host.appendChild(A.UI.note(
      'The Russian alphabet spells CYRILLIC, and all 33 letters are here. Type ' +
      'Cyrillic directly if you have the keyboard; type Latin and it is ' +
      'transliterated, showing both letters so you can see which Cyrillic one is ' +
      'meant: V/В, H/Х, C/Ц. Q and W do not exist in Cyrillic: W is read as В, ' +
      'and Q has no equivalent at all. The pale word beside each is how to say it ' +
      'if you do not read Cyrillic.'));

    function run(s) {
      A.clear(natoOut);
      A.clear(rusOut);
      s = String(s || '').toUpperCase();

      /* With nothing typed, show the whole alphabet rather than two empty
         rows under two headings, which is indistinguishable from a broken
         screen and is also the thing most people actually came here for. */
      /* one Russian pill: the Cyrillic letter, its word, and how to say it */
      function rusPill(key, typed) {
        var e = RUS[key];
        if (!e) return A.el('.pill.pill-dim', { html: '<b>' + A.esc(typed) + '</b> —' });
        /* Show the letter actually being spelled. When Latin was typed, both
           are shown - "V/В" - so it is clear which Cyrillic letter this is,
           which is the whole question when reading a Russian callsign back. */
        var head = (typed && typed !== key && LAT_TO_CYR[typed]) ? typed + '/' + key : key;
        return A.el('.pill', {
          html: '<b>' + A.esc(head) + '</b> ' + A.esc(e[0]) +
                ' <span class="pill-tr">' + A.esc(e[1]) + '</span>'
        });
      }

      if (!s.trim()) {
        var full = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (var k = 0; k < full.length; k++) {
          natoOut.appendChild(A.el('.pill', { html: '<b>' + full[k] + '</b> ' + A.esc(NATO[full[k]] || '') }));
        }
        /* the Russian row shows the CYRILLIC alphabet, all 33 letters of it,
           not the Latin one wearing Russian words */
        for (var r = 0; r < RUS_ORDER.length; r++) {
          rusOut.appendChild(rusPill(RUS_ORDER[r], null));
        }
        return;
      }

      for (var i = 0; i < s.length; i++) {
        var ch = s[i];
        if (ch === ' ') {
          natoOut.appendChild(A.el('span', { text: '/', style: { alignSelf: 'center', color: 'var(--muted)' } }));
          rusOut.appendChild(A.el('span', { text: '/', style: { alignSelf: 'center', color: 'var(--muted)' } }));
          continue;
        }
        natoOut.appendChild(A.el('.pill' + (NATO[ch] ? '' : '.pill-dim'),
          { html: '<b>' + A.esc(ch) + '</b> ' + A.esc(NATO[ch] || '—') }));
        rusOut.appendChild(rusPill(cyrKey(ch), ch));
      }
    }
    run(inp.input.value);
  }

  A.Router.register('field', { render: render });

  /* ══ TIDES: the rule of twelfths ═══════════════════════════════════════
     Offline, no station database: give it the two tides either side of the
     time you care about - the height and clock time of the last and next high
     or low water, off a tide table or an almanac - and it interpolates the
     height between them with the standard sinusoidal tide curve, and reads off
     the time a chosen height is reached. The twelfths breakdown is shown too,
     the mental version mariners use. */
  function parseHM(s) {
    s = String(s || '').trim();
    var m = /^(\d{1,2})[:h.]?(\d{2})$/.exec(s);
    if (!m) return NaN;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return NaN;
    return h * 60 + mi;
  }
  function fmtHM(min) {
    if (!isFinite(min)) return '—';
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(min / 60), mi = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
  }
  function fmtDurMin(min) {
    if (!isFinite(min) || min < 0) return '—';
    return Math.floor(min / 60) + 'h ' + Math.round(min % 60) + 'm';
  }

  /* ══ the vertical scale ═══════════════════════════════════════════════════
     A tide curve with no scale on it is a shape, not a measurement. You can
     see that the water is making, but not whether the extra half metre you
     need is there, and that is the only question the curve gets asked. So the
     height axis is drawn with real numbers against it, chosen to land on
     round values rather than on whatever the day's minimum happened to be.

     Where the height is not known - an uncalibrated port, where the engine has
     the SHAPE of the tide but no metres to hang on it - the gridlines are still
     drawn but deliberately carry no numbers. An unlabelled grid reads as "this
     is relative"; a labelled one would read as a measurement, and would be a
     lie. Same picture, and it refuses to say what it does not know. */
  var TIDE_W = 344, TIDE_PADL = 30, TIDE_PADR = 6;
  var TIDE_H = 150, TIDE_PADT = 12, TIDE_PADB = 22;

  /* One source of truth for the chart geometry. The scrub handler has to
     invert exactly what the renderer drew, so both go through these. */
  function tideX(t) { return TIDE_PADL + (t / 1440) * (TIDE_W - TIDE_PADL - TIDE_PADR); }
  function tideTat(x) { return (x - TIDE_PADL) / (TIDE_W - TIDE_PADL - TIDE_PADR) * 1440; }
  function tideY(h, hmin, span) {
    return TIDE_PADT + (1 - (h - hmin) / span) * (TIDE_H - TIDE_PADT - TIDE_PADB);
  }

  /* height on a sampled curve at an arbitrary minute, straight-line between
     the two samples either side */
  function tideSampleAt(samples, t) {
    if (!samples || !samples.length) return null;
    if (t <= samples[0].t) return samples[0].h;
    var last = samples[samples.length - 1];
    if (t >= last.t) return last.h;
    for (var i = 0; i < samples.length - 1; i++) {
      if (t >= samples[i].t && t <= samples[i + 1].t) {
        var f = (t - samples[i].t) / (samples[i + 1].t - samples[i].t);
        return samples[i].h + (samples[i + 1].h - samples[i].h) * f;
      }
    }
    return last.h;
  }

  /* ── THE READOUT ON THE CURVE ──────────────────────────────────────────
     A curve with a dot on it says "you are here" and nothing else; the number
     was underneath, so reading the height meant looking away from the place
     you were pointing at. The height now sits on the dot, with a cursor line
     up to the top of the plot so the time it belongs to is unambiguous, and
     an arrow for making or taking off.

     Elements carry classes rather than being rebuilt, because scrubbing
     patches them on every pointer move: re-rendering the whole card would
     mean recomputing the day's harmonics sixty times a second. */
  function tideCursor(t, h, hmin, span, showUnits, rising) {
    var x = tideX(t), y = tideY(h, hmin, span), bot = TIDE_H - TIDE_PADB;
    var s = '<line class="tide-cursor" x1="' + x.toFixed(1) + '" y1="' + TIDE_PADT +
            '" x2="' + x.toFixed(1) + '" y2="' + bot + '" stroke="var(--text)" ' +
            'stroke-width="1" opacity="0.4"/>';
    s += '<circle class="tide-dot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
         '" r="4.5" fill="var(--text)"/>';
    if (showUnits) {
      s += tideCalloutSvg(x, y, h, rising);
    }
    return s;
  }

  /* TIDE HEIGHTS ARE PRINTED TO THE CENTIMETRE, NOT TO TWO SIGNIFICANT
     FIGURES. A.fmtNum(h, 2) renders 1.15 m as "1.2 m", throwing away the
     centimetre exactly where it decides whether the water clears something.
     Tide tables print two decimals, so this does too, and every height on the
     tide screens goes through it so the curve, the readout and the list of
     turns cannot disagree with one another. */
  function tideM(h) {
    return (isFinite(h) ? h.toFixed(2) : '-') + ' m';
  }

  function tideCalloutText(h, rising) {
    return tideM(h) + (rising == null ? '' : (rising ? ' ↑' : ' ↓'));
  }

  function tideCalloutSvg(x, y, h, rising) {
    var txt = tideCalloutText(h, rising);
    var w = 12 + txt.length * 6.1, hh = 18;
    /* keep the box inside the plot, and flip it under the dot when the dot is
       near the top, so it never sits half off the chart */
    var bx = Math.max(TIDE_PADL, Math.min(TIDE_W - TIDE_PADR - w, x - w / 2));
    var by = (y - hh - 9 < TIDE_PADT) ? y + 9 : y - hh - 9;
    return '<g class="tide-callout" transform="translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')">' +
      '<rect class="tide-callout-bg" width="' + w.toFixed(1) + '" height="' + hh +
      '" rx="5" fill="var(--bg)" stroke="var(--border-2)" stroke-width="1"/>' +
      '<text class="tide-callout-t" x="' + (w / 2).toFixed(1) + '" y="' + (hh / 2 + 4) +
      '" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text)">' +
      A.esc(txt) + '</text></g>';
  }

  function tideTicks(lo, hi) {
    var span = (hi - lo) || 1;
    var steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20];
    var step = steps[steps.length - 1];
    for (var i = 0; i < steps.length; i++) { if (span / steps[i] <= 6) { step = steps[i]; break; } }
    var out = [], first = Math.ceil(lo / step - 1e-9) * step;
    for (var v = first; v <= hi + 1e-9; v += step) out.push(Math.round(v / step) * step);
    return { step: step, ticks: out };
  }

  /* horizontal gridlines plus the figures down the left-hand gutter */
  function tideScale(Y, lo, hi, padT, botY, showUnits) {
    var tk = tideTicks(lo, hi), dec = tk.step < 1 ? 1 : 0, g = '';
    tk.ticks.forEach(function (v) {
      var y = Y(v);
      if (y < padT - 0.5 || y > botY + 0.5) return;
      g += '<line x1="' + TIDE_PADL + '" y1="' + y.toFixed(1) + '" x2="' + (TIDE_W - TIDE_PADR) +
           '" y2="' + y.toFixed(1) + '" stroke="var(--border-2)" stroke-width="1" opacity="0.4"/>';
      if (showUnits) {
        g += '<text x="' + (TIDE_PADL - 5) + '" y="' + (y + 3.4).toFixed(1) +
             '" text-anchor="end" font-size="9.5" fill="var(--muted)">' + v.toFixed(dec) + '</text>';
      }
    });
    if (showUnits) {
      g += '<text x="' + (TIDE_PADL - 5) + '" y="' + (padT - 3).toFixed(1) +
           '" text-anchor="end" font-size="9" fill="var(--muted)" opacity="0.8">m</text>';
    }
    return g;
  }

  /* ── SCRUBBING ─────────────────────────────────────────────────────────
     Touch or drag anywhere on the chart to read the height at that moment.
     The handler patches the cursor, the dot and the callout in place and
     calls back with the minute, so the caller can update its own readout.

     getScreenCTM().inverse() rather than arithmetic on getBoundingClientRect:
     the SVG is laid out with preserveAspectRatio inside a flexible container,
     so the scale and the letterboxing are the browser's business, not ours,
     and the matrix already knows both.

     touch-action is none on the element (see app.css) so a horizontal drag
     reads the tide instead of scrolling the page away underneath it. */
  function wireTideScrub(host, opts) {
    var svg = host.querySelector('svg');
    if (!svg || !svg.getScreenCTM) return;
    var cursor = svg.querySelector('.tide-cursor');
    var dot = svg.querySelector('.tide-dot');
    var callout = svg.querySelector('.tide-callout');
    var calloutTxt = svg.querySelector('.tide-callout-t');
    var calloutBg = svg.querySelector('.tide-callout-bg');
    if (!cursor || !dot) return;

    var span = opts.span, hmin = opts.hmin, bot = TIDE_H - TIDE_PADB;

    function minuteAt(ev) {
      var m = svg.getScreenCTM();
      if (!m) return null;
      var pt = svg.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      var p = pt.matrixTransform(m.inverse());
      return Math.max(0, Math.min(1440, Math.round(tideTat(p.x))));
    }

    function paint(t) {
      var h = opts.heightAt(t);
      if (h == null || !isFinite(h)) return;
      var x = tideX(t), y = tideY(h, hmin, span);
      cursor.setAttribute('x1', x.toFixed(1)); cursor.setAttribute('x2', x.toFixed(1));
      cursor.setAttribute('y2', bot);
      dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1));
      if (callout && calloutTxt && calloutBg) {
        /* one minute either side tells us which way the water is going */
        var a = opts.heightAt(Math.max(0, t - 1)), b = opts.heightAt(Math.min(1440, t + 1));
        var rising = (a == null || b == null) ? null : (b >= a);
        var txt = tideCalloutText(h, rising);
        var w = 12 + txt.length * 6.1;
        var bx = Math.max(TIDE_PADL, Math.min(TIDE_W - TIDE_PADR - w, x - w / 2));
        var by = (y - 18 - 9 < TIDE_PADT) ? y + 9 : y - 18 - 9;
        calloutBg.setAttribute('width', w.toFixed(1));
        calloutTxt.setAttribute('x', (w / 2).toFixed(1));
        calloutTxt.textContent = txt;
        callout.setAttribute('transform', 'translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')');
      }
      if (opts.onScrub) opts.onScrub(t, h);
    }

    var dragging = false;
    function down(ev) {
      var t = minuteAt(ev); if (t == null) return;
      dragging = true;
      if (svg.setPointerCapture && ev.pointerId != null) {
        try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      A.haptic(8);
      paint(t);
      ev.preventDefault();
    }
    function move(ev) {
      if (!dragging) return;
      var t = minuteAt(ev); if (t == null) return;
      paint(t);
      ev.preventDefault();
    }
    function up(ev) {
      if (!dragging) return;
      dragging = false;
      if (opts.onCommit) {
        var t = minuteAt(ev);
        if (t != null) opts.onCommit(t);
      }
    }

    svg.style.cursor = 'crosshair';
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
  }

  /* the tide curve: a full-day sinusoid drawn from the entered tides, with the
     hour axis, the high/low turns and a dot at the current time. It projects
     the day by repeating the semidiurnal half-cycle the two tides define; it
     is the SAME estimate the numbers below use, drawn. */
  function buildTideCurve(evs, nowMin, hmin, hmax) {
    var W = TIDE_W, H = 150, padT = 12, padB = 22, padX = TIDE_PADR;
    var span = (hmax - hmin) || 1;
    function X(t) { return TIDE_PADL + (t / 1440) * (W - TIDE_PADL - padX); }
    function Y(h) { return padT + (1 - (h - hmin) / span) * (H - padT - padB); }
    function hAt(t) {
      for (var i = 0; i < evs.length - 1; i++)
        if (t >= evs[i].t && t <= evs[i + 1].t)
          return evs[i].h + (evs[i + 1].h - evs[i].h) * (1 - Math.cos(Math.PI * (t - evs[i].t) / (evs[i + 1].t - evs[i].t))) / 2;
      return hmin;
    }
    var pts = [];
    for (var t = 0; t <= 1440; t += 15) pts.push(X(t).toFixed(1) + ',' + Y(hAt(t)).toFixed(1));
    var line = pts.join(' ');
    var area = X(0).toFixed(1) + ',' + (H - padB) + ' ' + line + ' ' + X(1440).toFixed(1) + ',' + (H - padB);
    var g = tideScale(Y, hmin, hmax, padT, H - padB, true);
    [0, 4, 8, 12, 16, 20, 24].forEach(function (hr) {
      var x = X(hr * 60).toFixed(1);
      g += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (H - padB) + '" stroke="var(--border-2)" stroke-width="1" opacity="0.5"/>';
      g += '<text x="' + x + '" y="' + (H - 5) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + (hr === 24 ? 0 : hr) + '</text>';
    });
    var dot = '';
    if (nowMin != null && nowMin >= 0 && nowMin <= 1440) {
      var nh = hAt(nowMin);
      var na = hAt(Math.max(0, nowMin - 1)), nb = hAt(Math.min(1440, nowMin + 1));
      dot = tideCursor(nowMin, nh, hmin, span, true, nb >= na);
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="tide-curve-svg" preserveAspectRatio="xMidYMid meet">' +
      g + '<polygon points="' + area + '" fill="#6ba8de" opacity="0.18"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#6ba8de" stroke-width="2.4" stroke-linejoin="round"/>' +
      dot + '</svg>';
  }

  /* the height on the projected curve at a given minute of the day */
  function tideHeightAt(evs, t, hmin) {
    for (var i = 0; i < evs.length - 1; i++)
      if (t >= evs[i].t && t <= evs[i + 1].t)
        return evs[i].h + (evs[i + 1].h - evs[i].h) * (1 - Math.cos(Math.PI * (t - evs[i].t) / (evs[i + 1].t - evs[i].t))) / 2;
    return hmin;
  }
  function tideISO(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  var TIDE_CAL_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="3" x2="8" y2="6"/><line x1="16" y1="3" x2="16" y2="6"/></svg>';

  /* single-anchor projection: from one known high water and the port's mean
     range, project the whole day (and any other day) with the M2 semidiurnal
     period. Real data in, a real period applied, nothing invented. */
  var TIDE_T = 745.24;   /* M2 period, minutes = 12 h 25 m between highs */
  var TIDE_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function tideMidnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function tideRefDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((s || '').trim());
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return tideMidnight(new Date());
  }
  function tideDayLabel(d) {
    var t = tideMidnight(new Date());
    var off = Math.round((d.getTime() - t.getTime()) / 86400000);
    var base = ('0' + d.getDate()).slice(-2) + ' ' + TIDE_MON[d.getMonth()] + ' ' + d.getFullYear();
    if (off === 0) return 'Today · ' + base;
    if (off === 1) return 'Tomorrow · ' + base;
    if (off === -1) return 'Yesterday · ' + base;
    return base;
  }

  /* HHhMM: parse "14h30" / "1430" / "14:30" to minutes, and format back */
  function tideParseClock(s) {
    s = (s || '').trim().toLowerCase().replace(/[h:.\s]/g, '');
    if (!/^\d{3,4}$/.test(s)) return NaN;
    if (s.length === 3) s = '0' + s;
    var h = +s.slice(0, 2), m = +s.slice(2);
    if (h > 23 || m > 59) return NaN;
    return h * 60 + m;
  }
  function fmtHhMM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return ('0' + Math.floor(min / 60)).slice(-2) + 'h' + ('0' + (min % 60)).slice(-2);
  }

  function renderTideAnchor(host, st, save) {
    /* the view opens at the current date and time every time; the anchor (the
       port's high water) is the one figure that calibrates the offline
       projection, which can then run for any date, years out. */
    var now0 = new Date();
    var view = tideMidnight(now0);
    var vtime = fmtHhMM(now0.getHours() * 60 + now0.getMinutes());

    /* persistent controls, so typing in the time field never loses focus */
    var headMain = A.el('.tide-head-main');
    var headSub = A.el('.tide-head-sub');
    host.appendChild(A.el('.tide-head', null, [headMain, headSub]));

    var pill = A.el('.tide-datepill');
    var dateIn = A.el('input.tide-dateinput', { type: 'date' });
    dateIn.addEventListener('change', function () { if (dateIn.value) { view = tideRefDate(dateIn.value); redraw(); } });
    var nav = A.el('.tide-nav', null, [
      A.el('button.tide-chev', { html: Icons.svg('back'), 'aria-label': 'Previous day',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth(), view.getDate() - 1); A.haptic(); redraw(); } }),
      A.el('.tide-datewrap', null, [pill, dateIn]),
      A.el('button.tide-chev', { html: Icons.svg('chevron'), 'aria-label': 'Next day',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth(), view.getDate() + 1); A.haptic(); redraw(); } })
    ]);
    host.appendChild(nav);

    var trow = A.el('.tide-timerow');
    trow.appendChild(A.el('span.tide-timelab', { html: Icons.svg('clock') + ' Time (24h, e.g. 14h30)' }));
    var tin = A.el('input.tide-timeinput', { type: 'text', inputmode: 'numeric', value: vtime, placeholder: '14h30' });
    tin.addEventListener('input', function () { vtime = tin.value; redraw(); });
    trow.appendChild(tin);
    trow.appendChild(A.el('button.btn.ghost', {
      html: Icons.svg('clock') + ' Now',
      onclick: function () { var n = new Date(); view = tideMidnight(n); vtime = fmtHhMM(n.getHours() * 60 + n.getMinutes()); tin.value = vtime; redraw(); }
    }));
    host.appendChild(trow);

    var out = A.el('div');
    host.appendChild(out);

    /* the anchor, below the reading */
    var card = A.UI.card();
    card.appendChild(A.el('.sec-lab', { text: 'Tide anchor' }));
    card.appendChild(A.UI.field({ label: 'Place (a note, optional)', value: st.place || '',
      placeholder: 'e.g. Dover', oninput: function (e) { st.place = e.target.value; save(); redraw(); } }));
    var r = A.el('.split');
    r.appendChild(A.UI.field({ label: 'A high water time (24h, e.g. 14h30)', value: st.aHwt || '', placeholder: '14h30',
      oninput: function (e) { st.aHwt = e.target.value; save(); redraw(); } }));
    r.appendChild(A.UI.field({ label: 'High water height', inputmode: 'decimal', suffix: 'm', value: st.aHwh || '',
      placeholder: '4.6', oninput: function (e) { st.aHwh = e.target.value; save(); redraw(); } }));
    card.appendChild(r);
    card.appendChild(A.UI.field({ label: 'Mean range (high minus low)', inputmode: 'decimal', suffix: 'm', value: st.aRange || '',
      placeholder: '3.8', hint: 'From the port table: the height between high and low water.',
      oninput: function (e) { st.aRange = e.target.value; save(); redraw(); } }));
    card.appendChild(A.UI.field({ label: 'Anchor date (YYYY-MM-DD, optional)', value: st.aDate || '',
      placeholder: 'today', oninput: function (e) { st.aDate = e.target.value; save(); redraw(); } }));
    host.appendChild(card);

    function redraw() {
      A.clear(out);
      pill.innerHTML = TIDE_CAL_ICON + ' <span>' + tideDayLabel(view) + '</span>';
      dateIn.value = tideISO(view);

      var hwt = tideParseClock(st.aHwt), hwh = A.parseNum(st.aHwh), rng = A.parseNum(st.aRange);
      if (!isFinite(hwt) || !isFinite(hwh) || !isFinite(rng) || rng <= 0) {
        headMain.textContent = ''; headSub.textContent = st.place || 'Estimated';
        out.appendChild(A.UI.empty('Set the port high water (time and height) and the mean range below to read the tide.'));
        return;
      }
      var refMid = tideRefDate(st.aDate);
      var anchorAbs = Math.round(refMid.getTime() / 60000) + hwt;
      var winStart = Math.round(view.getTime() / 60000);
      var Hhigh = hwh, Hlow = hwh - rng, hmax = Hhigh, hmin = Hlow;

      var evs = [], lo = winStart - TIDE_T, hi = winStart + 1440 + TIDE_T;
      var nStart = Math.floor((lo - anchorAbs) / TIDE_T) - 1, nEnd = Math.ceil((hi - anchorAbs) / TIDE_T) + 1;
      for (var n = nStart; n <= nEnd; n++) {
        evs.push({ t: (anchorAbs + n * TIDE_T) - winStart, h: Hhigh, hi: true });
        evs.push({ t: (anchorAbs + TIDE_T / 2 + n * TIDE_T) - winStart, h: Hlow, hi: false });
      }
      evs.sort(function (a, b) { return a.t - b.t; });
      evs = evs.filter(function (e) { return e.t >= -TIDE_T && e.t <= 1440 + TIDE_T; });

      var dotMin = tideParseClock(vtime); if (!isFinite(dotMin)) dotMin = null;
      var mark = (dotMin == null) ? 720 : dotMin, nextEv = null;
      for (var i = 0; i < evs.length; i++) { if (evs[i].t > mark) { nextEv = evs[i]; break; } }
      headMain.innerHTML = nextEv ? ((nextEv.hi ? '↑' : '↓') + ' ' + (nextEv.hi ? 'High' : 'Low')) : '';
      headSub.textContent = st.place || 'Estimated';

      var cv = A.el('.tide-curve'); cv.innerHTML = buildTideCurve(evs, dotMin, hmin, hmax);
      out.appendChild(cv);

      var aVal = null, aSub = null;
      if (dotMin != null) {
        var hc = A.UI.card(null, 'tight');
        var aMet = A.UI.metric('Tide height', tideM(tideHeightAt(evs, dotMin, hmin)),
          { sub: 'at ' + fmtHhMM(dotMin) + ' on ' + tideDayLabel(view) });
        aVal = aMet.querySelector('.metric-v');
        aSub = aMet.querySelector('.metric-sub');
        hc.appendChild(aMet);
        out.appendChild(hc);
      }

      wireTideScrub(cv, {
        hmin: hmin, span: (hmax - hmin) || 1,
        heightAt: function (t) { return tideHeightAt(evs, t, hmin); },
        onScrub: function (t, h) {
          if (aVal) aVal.textContent = tideM(h);
          if (aSub) aSub.textContent = 'at ' + fmtHhMM(t) + ' on ' + tideDayLabel(view);
          tin.value = fmtHhMM(t);
        },
        onCommit: function (t) { vtime = fmtHhMM(t); }
      });

      var list = A.el('.tide-evs');
      evs.forEach(function (e) {
        if (e.t < 0 || e.t >= 1440) return;
        var row = A.el('.tide-ev');
        row.appendChild(A.el('span.tide-ev-dot.' + (e.hi ? 'hi' : 'lo')));
        var mid = A.el('.tide-ev-mid');
        mid.appendChild(A.el('.tide-ev-t', { text: e.hi ? 'High' : 'Low' }));
        mid.appendChild(A.el('.tide-ev-s', { text: 'Estimated · ' + tideM(e.h) }));
        row.appendChild(mid);
        row.appendChild(A.el('span.tide-ev-time', { text: fmtHhMM(Math.round(e.t)) }));
        list.appendChild(row);
      });
      out.appendChild(list);

      out.appendChild(A.UI.note('Estimated tides may be inaccurate. Please use an official tide table for the exact times.'));
    }
    redraw();
  }

  /* the tide curve, drawn straight from the harmonic samples */
  function buildTideSeries(samples, dotMin, hmin, hmax, showUnits) {
    var W = TIDE_W, H = 150, padT = 12, padB = 22, padX = TIDE_PADR, span = (hmax - hmin) || 1;
    function X(t) { return TIDE_PADL + (t / 1440) * (W - TIDE_PADL - padX); }
    function Y(h) { return padT + (1 - (h - hmin) / span) * (H - padT - padB); }
    var pts = samples.map(function (s) { return X(s.t).toFixed(1) + ',' + Y(s.h).toFixed(1); });
    var line = pts.join(' ');
    var area = X(0).toFixed(1) + ',' + (H - padB) + ' ' + line + ' ' + X(1440).toFixed(1) + ',' + (H - padB);
    var g = tideScale(Y, hmin, hmax, padT, H - padB, showUnits !== false);
    [0, 4, 8, 12, 16, 20, 24].forEach(function (hr) {
      var x = X(hr * 60).toFixed(1);
      g += '<line x1="' + x + '" y1="' + padT + '" x2="' + x + '" y2="' + (H - padB) + '" stroke="var(--border-2)" stroke-width="1" opacity="0.5"/>';
      g += '<text x="' + x + '" y="' + (H - 5) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + (hr === 24 ? 0 : hr) + '</text>';
    });
    if (hmin < 0 && hmax > 0) {
      var yz = Y(0).toFixed(1);
      g += '<line x1="' + TIDE_PADL + '" y1="' + yz + '" x2="' + (W - padX) + '" y2="' + yz + '" stroke="var(--border-2)" stroke-width="1" stroke-dasharray="4,3"/>';
    }
    var dot = '';
    if (dotMin != null) {
      var hh = tideSampleAt(samples, dotMin);
      if (hh == null) hh = hmin;
      var pa = tideSampleAt(samples, Math.max(0, dotMin - 1));
      var pb = tideSampleAt(samples, Math.min(1440, dotMin + 1));
      var rise = (pa == null || pb == null) ? null : (pb >= pa);
      dot = tideCursor(dotMin, hh, hmin, span, showUnits !== false, rise);
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="tide-curve-svg" preserveAspectRatio="xMidYMid meet">' + g +
      '<polygon points="' + area + '" fill="#6ba8de" opacity="0.18"/>' +
      '<polyline points="' + line + '" fill="none" stroke="#6ba8de" stroke-width="2.4" stroke-linejoin="round"/>' + dot + '</svg>';
  }

  /* Tides: offline harmonic prediction for a chosen station. Pick the place,
     the date and the time, and it computes the height above chart datum from
     the station's published harmonic constants, for any date, with no signal. */
  function toolTides(host) {
    A.setTitle('Tides', { back: true });
    if (!global.ArtTide || !ArtTide.stations().length) {
      host.appendChild(A.UI.empty('Tide station data is not in this build.')); return;
    }
    var sts = ArtTide.stations();
    /* The world directory sits alongside the harmonic stations in one search
       box, because a user looking for "Dover" should not have to know in
       advance whether this build can predict it. What they get differs; where
       they look does not. */
    var dir = ArtTide.directory ? ArtTide.directory() : [];
    var all = sts.concat(dir);
    var st = A.store.get('field.tides', { stationId: '' });
    function save() { A.store.set('field.tides', st); }
    function curStation() { return all.filter(function (x) { return x.id === st.stationId; })[0] || sts[0]; }

    /* per-port calibration, keyed by port id and kept on the device */
    /* What the tool knows about a directory port's tide, in order of authority:
       an observation the user made here beats a seeded standard-port figure,
       and a seeded figure beats borrowing from the nearest standard port. The
       borrowed case is flagged so the screen can say whose numbers it is using
       rather than presenting them as this port's own. */
    function calOf(id, port) {
      var saved = A.store.get('field.tideCal.' + id, {});
      if (isFinite(saved.hwi)) return saved;          /* measured here, trust it */
      if (!port) return saved;

      var seed = (global.ART_PORT_TIDE_SEED || {})[port.place];
      if (seed) {
        return {
          hwi: saved.hwi, spr: isFinite(saved.spr) ? saved.spr : seed.spr,
          npr: isFinite(saved.npr) ? saved.npr : seed.npr,
          z0: isFinite(saved.z0) ? saved.z0 : seed.z0,
          n: saved.n, seeded: true,
          _hwi: seed.hwi                              /* seeded interval, applied below */
        };
      }

      /* no figures of its own: reference it to the nearest standard port, the
         way a tide table refers a secondary port to a standard one */
      var ref = nearestSeeded(port.lat, port.lon);
      if (!ref) return saved;
      return {
        hwi: saved.hwi,
        spr: isFinite(saved.spr) ? saved.spr : ref.cal.spr,
        npr: isFinite(saved.npr) ? saved.npr : ref.cal.npr,
        z0: isFinite(saved.z0) ? saved.z0 : ref.cal.z0,
        n: saved.n, borrowed: ref.place, borrowedKm: ref.km,
        _hwi: ref.cal.hwi
      };
    }
    function setCal(id, c) {
      /* only ever store what the user actually gave us, never the seed */
      A.store.set('field.tideCal.' + id, {
        hwi: c.hwi, spr: c.spr, npr: c.npr, z0: c.z0, n: c.n
      });
    }

    /* nearest port that has standard-port figures, with its distance in km */
    function nearestSeeded(lat, lon) {
      var list = (global.ART_PORT_TIDE_SEED_LIST ? global.ART_PORT_TIDE_SEED_LIST() : []);
      var best = null, bd = Infinity;
      for (var i = 0; i < list.length; i++) {
        var dLa = list[i].lat - lat, dLo = (list[i].lon - lon) * Math.cos(lat * Math.PI / 180);
        var d = dLa * dLa + dLo * dLo;
        if (d < bd) { bd = d; best = list[i]; }
      }
      return best ? { place: best.place, cal: best.cal, km: Math.sqrt(bd) * 111 } : null;
    }

    var now0 = new Date();
    var view = tideMidnight(now0);
    var vtime = fmtHhMM(now0.getHours() * 60 + now0.getMinutes());

    var headMain = A.el('.tide-nowtide');

    /* type-to-search over the stations rather than a long dropdown */
    var placeIn = A.el('input.fld-in', { placeholder: 'Type a city or port…', autocomplete: 'off',
      autocapitalize: 'off', spellcheck: 'false', value: curStation().name });
    var results = A.el('.tide-results', { style: { display: 'none' } });
    function closeResults() { results.style.display = 'none'; results.innerHTML = ''; }
    placeIn.addEventListener('focus', function () { placeIn.select(); });
    placeIn.addEventListener('input', function () {
      var q = placeIn.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) { closeResults(); return; }
      /* harmonic stations first: if one of them matches it is the better answer */
      var hit = all.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0; });
      hit.sort(function (a, b) { return (a.directory ? 1 : 0) - (b.directory ? 1 : 0); });
      var matches = hit.slice(0, 40);
      if (!matches.length) { results.innerHTML = '<div class="tide-result muted">No place matches</div>'; results.style.display = 'block'; return; }
      matches.forEach(function (s) {
        var b = A.el('button.tide-result', {
          onclick: function () { st.stationId = s.id; save(); placeIn.value = s.name; closeResults(); redraw(); } });
        b.appendChild(A.el('span', { text: s.name }));
        b.appendChild(A.el('span.tide-result-tag' + (s.directory ? '.dir' : ''),
          { text: s.directory ? 'astronomical' : 'harmonic' }));
        results.appendChild(b);
      });
      results.style.display = 'block';
    });
    var pWrap = A.el('.fld');
    pWrap.appendChild(A.el('span.fld-lab', { text: 'Place (tide station)' }));
    pWrap.appendChild(A.el('.tide-placerow', null, [placeIn, headMain]));
    pWrap.appendChild(results);
    host.appendChild(pWrap);
    host.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('pin') + ' Nearest to me',
      onclick: function () {
        if (!navigator.geolocation) { A.toast('No position source'); return; }
        A.toast('Getting a fix…');
        navigator.geolocation.getCurrentPosition(function (p) {
          /* Search the harmonic stations AND the world directory, not just the
             stations: those are almost all United States waters, so from Dubai
             the "nearest" used to come back Guam. A port a few kilometres away
             that predicts from standard-port figures beats a harmonic station
             on the other side of the world. */
          var la = p.coords.latitude, lo = p.coords.longitude;
          var best = null, bd = Infinity;
          for (var i = 0; i < all.length; i++) {
            var c = all[i];
            if (!isFinite(c.lat) || !isFinite(c.lon)) continue;
            var dLa = c.lat - la, dLo = (c.lon - lo) * Math.cos(la * Math.PI / 180);
            var d = dLa * dLa + dLo * dLo;
            if (d < bd) { bd = d; best = c; }
          }
          if (!best) { A.toast('Nothing near enough to use'); return; }
          st.stationId = best.id; save(); placeIn.value = best.name;
          closeResults(); redraw();
          A.toast('Nearest: ' + best.name + '  ·  ' + A.fmtNum(Math.sqrt(bd) * 111, 0) + ' km');
        }, function () { A.toast('Could not get a position'); }, { enableHighAccuracy: true, timeout: 15000 });
      }
    }));

    var pill = A.el('.tide-datepill'), dateIn = A.el('input.tide-dateinput', { type: 'date' });
    dateIn.addEventListener('change', function () { if (dateIn.value) { view = tideRefDate(dateIn.value); redraw(); } });
    host.appendChild(A.el('.tide-nav', null, [
      A.el('button.tide-chev', { html: Icons.svg('back'), 'aria-label': 'Previous day',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth(), view.getDate() - 1); A.haptic(); redraw(); } }),
      A.el('.tide-datewrap', null, [pill, dateIn]),
      A.el('button.tide-chev', { html: Icons.svg('chevron'), 'aria-label': 'Next day',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth(), view.getDate() + 1); A.haptic(); redraw(); } })
    ]));

    var trow = A.el('.tide-timerow');
    trow.appendChild(A.el('span.tide-timelab', { html: Icons.svg('clock') + ' Time (24h, e.g. 14h30)' }));
    var tin = A.el('input.tide-timeinput', { type: 'text', inputmode: 'numeric', value: vtime, placeholder: '14h30' });
    tin.addEventListener('input', function () { vtime = tin.value; redraw(); });
    trow.appendChild(tin);
    trow.appendChild(A.el('button.btn.ghost', {
      html: Icons.svg('clock') + ' Now',
      onclick: function () { var n = new Date(); view = tideMidnight(n); vtime = fmtHhMM(n.getHours() * 60 + n.getMinutes()); tin.value = vtime; redraw(); }
    }));
    host.appendChild(trow);

    var out = A.el('div');
    host.appendChild(out);

    function redraw() {
      A.clear(out);
      var station = curStation();
      pill.innerHTML = TIDE_CAL_ICON + ' <span>' + tideDayLabel(view) + '</span>';
      dateIn.value = tideISO(view);

      /* A DIRECTORY PORT WITH A PREDICTING STATION ON TOP OF IT IS A PREDICTING
         PORT. The world harmonic set covers thousands of gauges, so most named
         ports now have real constants within a few kilometres. Reaching for the
         astronomical backup while a measured station sits in the same harbour
         would throw away a centimetre-accurate answer in favour of a rough one.
         So: use the station if it is close enough, say which one and how far,
         and keep the backup for places that genuinely have nothing. */
      if (station.directory) {
        var near = ArtTide.nearest(station.lat, station.lon);
        var nearKm = near ? near.deg * 111 : Infinity;
        if (near && nearKm <= HARMONIC_BORROW_KM) {
          drawHarmonic(near.station, { port: station, km: nearKm });
          return;
        }
        drawAstro(station); return;
      }
      drawHarmonic(station, null);
    }

    /* how far a directory port may reach for a harmonic station. Tide phase
       walks along a coast and can swing hard inside an estuary, so this is
       deliberately short: beyond it the honest answer is the backup model and
       a plain statement that the port has nothing of its own. */
    var HARMONIC_BORROW_KM = 25;

    function drawHarmonic(station, borrowed) {
      var d = ArtTide.day(station, view, 10), samples = d.samples, ex = d.extrema;
      var hmin = Infinity, hmax = -Infinity;
      samples.forEach(function (s) { if (s.h < hmin) hmin = s.h; if (s.h > hmax) hmax = s.h; });
      if (hmax - hmin < 0.2) { hmin -= 0.5; hmax += 0.5; }

      var dotMin = tideParseClock(vtime); if (!isFinite(dotMin)) dotMin = null;
      var mark = (dotMin == null) ? 720 : dotMin, nextEv = null;
      for (var i = 0; i < ex.length; i++) { if (ex[i].t > mark) { nextEv = ex[i]; break; } }
      headMain.innerHTML = nextEv ? ((nextEv.hi ? '↑' : '↓') + ' ' + (nextEv.hi ? 'High' : 'Low')) : '';

      var cv = A.el('.tide-curve'); cv.innerHTML = buildTideSeries(samples, dotMin, hmin, hmax);
      out.appendChild(cv);

      if (borrowed) {
        out.appendChild(A.el('.lrow-s', {
          style: { whiteSpace: 'normal', margin: '-4px 0 10px', color: 'var(--muted)' },
          text: 'Predicted from ' + station.name + ', ' + A.fmtNum(borrowed.km, 0) +
                ' km away, using its published constants. ' +
                (borrowed.km > 10 ? 'That is far enough that the times can shift along the coast. '
                                  : '') + 'Heights are above ' + (station.chartDatum || 'chart datum') + '.'
        }));
      }

      /* the exact height at any minute, straight from the harmonics rather
         than interpolated off the ten-minute samples the curve is drawn from */
      function exactAt(t) {
        return ArtTide.predict(station, new Date(view.getTime() + t * 60000));
      }

      var hcVal = null, hcSub = null;
      if (dotMin != null) {
        var hc = A.UI.card(null, 'tight');
        var met = A.UI.metric('Tide height', tideM(exactAt(dotMin)),
          { sub: 'at ' + fmtHhMM(dotMin) + ' on ' + tideDayLabel(view) + ', above chart datum' });
        hcVal = met.querySelector('.metric-v');
        hcSub = met.querySelector('.metric-sub');
        hc.appendChild(met);
        out.appendChild(hc);
      }

      out.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', margin: '-2px 0 10px', color: 'var(--muted)' },
        text: A.tr('Touch the curve to read the height at any time.')
      }));

      wireTideScrub(cv, {
        hmin: hmin, span: (hmax - hmin) || 1,
        heightAt: exactAt,
        onScrub: function (t, h) {
          if (hcVal) hcVal.textContent = tideM(h);
          if (hcSub) hcSub.textContent = 'at ' + fmtHhMM(t) + ' on ' +
            tideDayLabel(view) + ', above chart datum';
          tin.value = fmtHhMM(t);
        },
        /* keep the scrubbed time when the finger lifts, so the rest of the
           page agrees with the chart on the next redraw */
        onCommit: function (t) { vtime = fmtHhMM(t); }
      });

      var list = A.el('.tide-evs');
      ex.forEach(function (e) {
        if (e.t < 0 || e.t >= 1440) return;
        var row = A.el('.tide-ev');
        row.appendChild(A.el('span.tide-ev-dot.' + (e.hi ? 'hi' : 'lo')));
        var mid = A.el('.tide-ev-mid');
        mid.appendChild(A.el('.tide-ev-t', { text: e.hi ? 'High' : 'Low' }));
        mid.appendChild(A.el('.tide-ev-s', { text: tideM(e.h) }));
        row.appendChild(mid);
        row.appendChild(A.el('span.tide-ev-time', { text: fmtHhMM(Math.round(e.t)) }));
        list.appendChild(row);
      });
      out.appendChild(list);

      var prov = 'Harmonic prediction from the station’s published constants, above ' +
                 (station.chartDatum || 'chart datum') + '.';
      if (station.source) prov += ' Constants: ' + station.source + '.';
      if (station.datumDerived) {
        prov += ' The chart datum here is not an observed one: it is Lowest Astronomical Tide ' +
                'computed from the constants over a 19-year nodal cycle, so absolute heights may ' +
                'sit a few centimetres off the local chart even when the range is right.';
      }
      if (station.flagged) {
        prov += ' This gauge is flagged in its source for possible quality or datum issues.';
      }
      prov += ' A real coast and the weather still shift it; use an official tide table where lives depend on it.';
      out.appendChild(A.UI.note(prov));
    }

    /* ── a directory port: astronomy plus whatever the user has taught it ──
       The moon and the sun are computed on the device, so this works with the
       radio off, in a cell with no signal, forever. What it cannot know until
       told is how long after the moon passes overhead the water actually tops
       out here, and how big the range is: both belong to the shape of the
       harbour, not to the sky. */
    function drawAstro(port) {
      var cal = calOf(port.id, port);
      /* An interval the user measured here wins. Failing that, use the seeded
         standard-port figure (or the one borrowed from the nearest standard
         port) so the port still predicts and still draws its curve, instead of
         showing astronomy alone with nothing to anchor it to. */
      var effective = cal;
      if (!isFinite(cal.hwi) && isFinite(cal._hwi)) {
        effective = { hwi: cal._hwi, spr: cal.spr, npr: cal.npr, z0: cal.z0, n: cal.n };
      }
      var r = ArtTide.astroDay(port, view, effective);
      if (!r) { out.appendChild(A.UI.empty('Could not compute the moon for this place.')); return; }

      headMain.innerHTML = '';

      /* THE CURVE COMES FIRST, always, exactly as it does for a harmonic
         station. The picture of the day is what the page is for; the position
         and the astronomy behind it are supporting detail and belong under it. */
      if (r.calibrated && r.samples) {
        var dm = tideParseClock(vtime); if (!isFinite(dm)) dm = null;
        var key = r.hasHeights ? 'h' : 'r';
        var ss = r.samples.map(function (s) { return { t: s.t, h: s[key] }; });
        var lo = Infinity, hi = -Infinity;
        ss.forEach(function (s) { if (s.h < lo) lo = s.h; if (s.h > hi) hi = s.h; });
        if (hi - lo < 0.2) { lo -= 0.5; hi += 0.5; }
        var cvA = A.el('.tide-curve');
        cvA.innerHTML = buildTideSeries(ss, dm, lo, hi, r.hasHeights);
        out.appendChild(cvA);
        /* scrubbable as well, off the sampled curve. Where the port has no
           heights the callout is suppressed by buildTideSeries, so dragging
           moves the cursor and says nothing it cannot back up. */
        wireTideScrub(cvA, {
          hmin: lo, span: (hi - lo) || 1,
          heightAt: function (t) { return tideSampleAt(ss, t); },
          onCommit: function (t) { vtime = fmtHhMM(t); tin.value = vtime; }
        });
        if (!r.hasHeights) {
          out.appendChild(A.el('.lrow-s', {
            style: { whiteSpace: 'normal', margin: '-4px 0 10px', color: 'var(--muted)' },
            text: 'The shape of the tide, not its height. Enter the ranges and mean sea ' +
                  'level below to put metres on the vertical scale.'
          }));
        }
      }

      var head = A.UI.card(null, 'tight');
      head.appendChild(A.UI.metric('Position', A.fmtNum(port.lat, 4) + ', ' + A.fmtNum(port.lon, 4),
        { sub: port.country }));
      var near = ArtTide.nearest(port.lat, port.lon);
      if (near) {
        var km = near.deg * 111;
        head.appendChild(A.UI.metric('Nearest predicting station', near.station.name,
          { sub: 'about ' + A.fmtNum(km, 0) + ' km away' + (km > 300 ? ', too far to borrow its times' : '') }));
      }
      out.appendChild(head);

      /* the spring-neap state is pure astronomy and is right whether or not the
         port has ever been calibrated */
      var sn = r.springNeap;
      if (sn) {
        var sc = A.UI.card(null, 'tight');
        sc.appendChild(A.el('.sec-lab', { text: 'From the sky' }));
        sc.appendChild(A.UI.metric('Tide state', A.tr(sn.state),
          { big: true, sub: A.tr(sn.phaseName) + ', ' + Math.round(sn.illum * 100) + '% lit' }));
        sc.appendChild(A.UI.metric('Spring-neap factor', A.fmtNum(sn.coeff, 2),
          { sub: '1.00 at springs, 0.00 at neaps' }));
        r.transits.forEach(function (t) {
          sc.appendChild(A.UI.metric(t.upper ? 'Moon overhead' : 'Moon underfoot', fmtHhMM(Math.round(t.t)),
            { sub: t.upper ? 'high water follows this by the port’s own delay'
                           : 'the other pair of tides follows this one' }));
        });
        out.appendChild(sc);
      }

      if (r.calibrated) {
        var ec = A.UI.card();
        ec.appendChild(A.el('.sec-lab', { text: 'Predicted tides' }));
        var list = A.el('.tide-evs');
        r.events.forEach(function (e) {
          var row = A.el('.tide-ev');
          row.appendChild(A.el('span.tide-ev-dot.' + (e.hi ? 'hi' : 'lo')));
          var mid = A.el('.tide-ev-mid');
          mid.appendChild(A.el('.tide-ev-t', { text: e.hi ? 'High' : 'Low' }));
          mid.appendChild(A.el('.tide-ev-s', { text: isFinite(e.h) ? tideM(e.h) : 'height not known here' }));
          row.appendChild(mid);
          row.appendChild(A.el('span.tide-ev-time', { text: fmtHhMM(Math.round(e.t)) }));
          list.appendChild(row);
        });
        ec.appendChild(list);
        if (r.range != null) {
          ec.appendChild(A.UI.metric('Range today', A.fmtNum(r.range, 2) + ' m',
            { sub: 'interpolated between the spring and neap ranges you entered' }));
        }
        /* say plainly where the delay came from: measured here, printed for
           this port, or borrowed from the nearest standard port */
        var src, dHwi = isFinite(cal.hwi) ? cal.hwi : cal._hwi;
        if (isFinite(cal.hwi)) {
          src = 'from ' + (cal.n || 1) + ' observation' + ((cal.n || 1) === 1 ? '' : 's') + ' you made here';
        } else if (cal.seeded) {
          src = 'the standard-port figure for this place, a mean value';
        } else if (cal.borrowed) {
          src = 'borrowed from ' + cal.borrowed + ', about ' + A.fmtNum(cal.borrowedKm, 0) + ' km away';
        } else {
          src = 'a mean value';
        }
        ec.appendChild(A.UI.metric('Delay after moon transit', fmtHhMM(Math.round(dHwi)), { sub: src }));
        out.appendChild(ec);

        /* THE LIMIT OF THIS MODEL, STATED WHERE IT IS BEING RELIED ON.
           Without harmonic constants the curve is one semidiurnal cosine, so
           it draws the day's two high waters the same height by construction.
           That is fine on an Atlantic coast and badly wrong wherever the tide
           is mixed or diurnal: in the Arabian Gulf, much of the Pacific and
           the South China Sea the two highs routinely differ by most of the
           range, and the times slide too. A field tool that prints a confident
           figure it cannot support is worse than one that prints nothing, so
           the shortcoming goes on the screen next to the numbers rather than
           in a note at the bottom that nobody reads. */
        out.appendChild(A.UI.note(
          'ONE CURVE, TWO EQUAL HIGHS. With no harmonic constants for this port the ' +
          'day is drawn as a single semidiurnal wave, so both high waters come out the ' +
          'same height. Where the tide is mixed or diurnal, the Arabian Gulf and much of ' +
          'the Pacific among them, the real highs can differ by most of the range and the ' +
          'times can be hours out. Treat these as planning figures and check a printed ' +
          'table before anything depends on them.'));

        if (!isFinite(cal.hwi)) {
          out.appendChild(A.UI.note(cal.borrowed
            ? 'THESE TIMES ARE BORROWED. This port has no figures of its own, so the delay ' +
              'from ' + cal.borrowed + ' is being used. That is how a tide table treats a secondary ' +
              'port, and it is a planning figure, not a prediction for this beach. Watch one high ' +
              'water here and enter it below and the port becomes its own reference, offline and ' +
              'for good.'
            : 'These are mean standard-port figures, not a tide table. They carry no surge, no ' +
              'barometric effect and no river flow, and in a place with shallow-water distortion ' +
              'the real water can sit well off them. Watch one high water here and enter it below ' +
              'to replace the mean with this port’s own measured delay.'));
        }
      } else {
        out.appendChild(A.UI.note(
          'This port has no harmonic constants and has not been calibrated yet, so the ' +
          'times of high water cannot be stated. Everything above is astronomy and is ' +
          'right anywhere. To finish it, watch one high water here and enter the time ' +
          'below: that single observation gives this port’s delay, and it is kept on the ' +
          'device and used for every future date, offline.'));
      }

      /* ── teaching it ── */
      var cc = A.UI.card();
      cc.appendChild(A.el('.sec-lab', { text: 'Calibrate this port' }));
      cc.appendChild(A.el('p', {
        style: { margin: '4px 0 10px', lineHeight: '1.6', color: 'var(--text-2)' },
        text: 'Watch the water until it stops rising and starts to fall, and enter that ' +
              'time with today’s date set above. Each further observation is averaged in ' +
              'and tightens the figure.'
      }));
      var obs = { t: '' };
      cc.appendChild(A.UI.field({
        label: 'I saw high water at (24h, e.g. 14h30)', inputmode: 'numeric', placeholder: '14h30',
        oninput: function (e) { obs.t = e.target.value; }
      }));
      cc.appendChild(A.el('button.btn.block', {
        text: 'Use that high water', style: { marginTop: '8px' },
        onclick: function () {
          var mm = tideParseClock(obs.t);
          if (!isFinite(mm)) { A.toast('Enter a time like 14h30'); return; }
          var when = new Date(view.getFullYear(), view.getMonth(), view.getDate(),
                              Math.floor(mm / 60), mm % 60);
          var res = ArtTide.calibrateHW(port, when, cal.hwi, cal.n);
          if (!res) { A.toast('Could not work out the delay'); return; }
          cal.hwi = res.hwi; cal.n = res.n; setCal(port.id, cal);
          A.haptic(20); A.toast('Delay set to ' + fmtHhMM(Math.round(res.hwi)));
          redraw();
        }
      }));

      var rr = A.el('.split', { style: { marginTop: '12px' } });
      rr.appendChild(A.UI.field({
        label: 'Mean spring range', inputmode: 'decimal', suffix: 'm',
        value: isFinite(cal.spr) ? cal.spr : '',
        hint: 'Off a chart or a pilot. Leave blank and it gives times only.',
        oninput: function (e) { cal.spr = A.parseNum(e.target.value); setCal(port.id, cal); }
      }));
      rr.appendChild(A.UI.field({
        label: 'Mean neap range', inputmode: 'decimal', suffix: 'm',
        value: isFinite(cal.npr) ? cal.npr : '',
        oninput: function (e) { cal.npr = A.parseNum(e.target.value); setCal(port.id, cal); }
      }));
      cc.appendChild(rr);
      cc.appendChild(A.UI.field({
        label: 'Mean sea level above chart datum', inputmode: 'decimal', suffix: 'm',
        value: isFinite(cal.z0) ? cal.z0 : '',
        hint: 'Only needed for heights in metres. Without it you still get the times and the range.',
        oninput: function (e) { cal.z0 = A.parseNum(e.target.value); setCal(port.id, cal); }
      }));
      cc.appendChild(A.el('button.btn.ghost.block', {
        text: 'Apply ranges', style: { marginTop: '8px' },
        onclick: function () { A.haptic(); redraw(); }
      }));
      if (r.calibrated || isFinite(cal.spr)) {
        cc.appendChild(A.el('button.btn.ghost.block', {
          text: 'Forget this port’s calibration', style: { marginTop: '8px' },
          onclick: function () { setCal(port.id, {}); A.haptic(); A.toast('Calibration cleared'); redraw(); }
        }));
      }
      out.appendChild(cc);

      out.appendChild(A.UI.note(
        'This is a BACKUP, not a tide table. The times come from the moon plus one delay ' +
        'you measured, which on an open coast lands high water within about half an hour ' +
        'and in a river or a narrow estuary can be well out, because there the delay ' +
        'itself changes with the range. Heights are only ever as good as the two ranges ' +
        'you typed in. Where it matters, use the official table for the port.'));
    }

    redraw();
  }
  A.Router.register('tides', { render: toolTides });

  /* The country reference moved out of Field tools and onto Recon, where the
     rest of the reference material lives: it is something you look up, not a
     tool you operate. It keeps its own route so the back arrow steps from a
     country page to the country list and then to Recon. */
  A.Router.register('country', {
    render: function (host, params) {
      A.setTitle('Countries', { back: true });
      renderCountry(host, params);
    }
  });

})(window);
