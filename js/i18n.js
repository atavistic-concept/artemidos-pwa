/*
 * Artemidos - languages
 * Copyright (c) 2026 Artemidos. All rights reserved.
 *
 * ══ ENTIRELY OFFLINE ══════════════════════════════════════════════════════
 *
 * Every language ships inside the APK. Nothing is fetched, nothing is looked
 * up, and switching language works on a mountain with no signal - which is the
 * only place this app is ever used.
 *
 * ══ NO FLAGS ══════════════════════════════════════════════════════════════
 *
 * A flag is a country, not a language. German is not Germany, Spanish is not
 * Spain, and putting a Union Jack next to English tells an Irish speaker
 * something nobody meant. Each language is named in ITSELF, because that is
 * the one label a speaker of it can always read: someone who cannot read a
 * word of English can still find "Português" in a list.
 *
 * ══ HOW A STRING IS TRANSLATED ════════════════════════════════════════════
 *
 * T('nav.recon') returns the string for the current language, falling back to
 * English when a key is missing. The fallback is deliberate and silent: a
 * half-translated language shows English for the gaps rather than a raw key,
 * because a screen reading "nav.recon" is worse than a screen reading "Recon".
 *
 * Missing keys are counted, so the Settings page can say honestly how complete
 * each language is rather than implying they are all finished.
 */
(function (global) {
  'use strict';

  var I = {};
  global.ArtI18n = I;

  var STORE_KEY = 'lang';

  /* ══ THE LANGUAGES ═════════════════════════════════════════════════════
     Named in their own language and script. Sorted the way a person scans a
     list - alphabetically by the name they are looking for - with English
     first because it is the source and the fallback.

     `rtl` is carried even though none of these need it yet: adding Arabic or
     Hebrew later should be a data change, not a code change. */
  var LANGS = [
    { id: 'en',    name: 'English',          eng: 'English' },
    { id: 'sq',    name: 'Shqip',            eng: 'Albanian' },
    { id: 'hy',    name: 'Հայերեն',           eng: 'Armenian' },
    { id: 'eu',    name: 'Euskara',          eng: 'Basque' },
    { id: 'bg',    name: 'Български',        eng: 'Bulgarian' },
    { id: 'ca',    name: 'Català',           eng: 'Catalan' },
    { id: 'cs',    name: 'Čeština',          eng: 'Czech' },
    { id: 'da',    name: 'Dansk',            eng: 'Danish' },
    { id: 'nl',    name: 'Vlaams',           eng: 'Flemish' },
    { id: 'fi',    name: 'Suomi',            eng: 'Finnish' },
    { id: 'fr',    name: 'Français',         eng: 'French' },
    { id: 'gl',    name: 'Galego',           eng: 'Galician' },
    { id: 'ka',    name: 'ქართული',          eng: 'Georgian' },
    { id: 'de',    name: 'Deutsch',          eng: 'German' },
    { id: 'el',    name: 'Ελληνικά',         eng: 'Greek' },
    { id: 'ga',    name: 'Gaeilge',          eng: 'Irish' },
    { id: 'it',    name: 'Italiano',         eng: 'Italian' },
    { id: 'la',    name: 'Latina',           eng: 'Latin' },
    { id: 'mk',    name: 'Македонски',       eng: 'Macedonian' },
    { id: 'no',    name: 'Norsk',            eng: 'Norwegian' },
    { id: 'oc',    name: 'Occitan',          eng: 'Occitan' },
    { id: 'pl',    name: 'Polski',           eng: 'Polish' },
    { id: 'pt',    name: 'Português',        eng: 'Portuguese' },
    { id: 'ro',    name: 'Română',           eng: 'Romanian' },
    { id: 'ru',    name: 'Русский',          eng: 'Russian' },
    { id: 'sr',    name: 'Српски',           eng: 'Serbian' },
    { id: 'sk',    name: 'Slovenčina',       eng: 'Slovak' },
    { id: 'sl',    name: 'Slovenščina',      eng: 'Slovenian' },
    { id: 'es',    name: 'Español',          eng: 'Spanish' },
    { id: 'sv',    name: 'Svenska',          eng: 'Swedish' },
    { id: 'uk',    name: 'Українська',       eng: 'Ukrainian' }
  ];

  I.LANGS = LANGS;

  /* filled by js/lang/*.js as they load */
  var PACKS = { en: {} };
  I.register = function (id, table) {
    PACKS[id] = table;
  };

  var current = 'en';
  var missing = {};        /* key -> true, for the completeness report */

  I.current = function () { return current; };
  I.info = function (id) {
    return LANGS.filter(function (l) { return l.id === (id || current); })[0] || LANGS[0];
  };

  /* ── the lookup ─────────────────────────────────────────────────────────
     English is not a pack: it IS the key's default, passed in at the call
     site. That means adding a string never requires touching an English file,
     and an untranslated app is never broken - only untranslated. */
  function T(key, dflt) {
    var pack = PACKS[current];
    if (pack && pack[key] != null) return pack[key];
    if (current !== 'en') missing[key] = true;
    return dflt != null ? dflt : key;
  }
  I.T = T;
  global.T = T;

  /* Substitution, for the handful of strings that carry a number or a name.
     Positional rather than named, because a translator reordering {0} and {1}
     is normal and expected in languages that put the verb elsewhere. */
  I.f = function (key, dflt, args) {
    var s = T(key, dflt);
    (args || []).forEach(function (v, i) {
      s = s.split('{' + i + '}').join(String(v));
    });
    return s;
  };

  /* ── how complete is a language ────────────────────────────────────────
     Counted against the keys the app has actually ASKED for, not against a
     master list, so it reflects the screens a user has really seen. Honest
     rather than flattering: a language that is a third done says so. */
  I.coverage = function (id) {
    var pack = PACKS[id];
    if (id === 'en') return 1;
    if (!pack) return 0;
    var keys = Object.keys(KNOWN);
    if (!keys.length) return 0;
    var have = 0;
    keys.forEach(function (k) { if (pack[k] != null) have++; });
    return have / keys.length;
  };

  /* Every key the app declares, gathered as the UI files load. This is what
     coverage is measured against. */
  var KNOWN = {};
  /* ══ THE REVERSE MAP ═══════════════════════════════════════════════════
     English text -> key. This is what makes translation possible at all
     without rewriting forty-one files by hand.

     The app is written in English. Every page title, section heading and
     button already says the right thing in the source language, so instead of
     replacing three thousand literals with T('some.key') calls - each one an
     opportunity to mistype a key and silently ship a raw identifier - the
     English string ITSELF is the lookup.

     A.setTitle('Compass') keeps working exactly as written, and returns
     "Kompass" or "Компас" on its way to the screen. A string with no
     translation passes through untouched, which is the correct behaviour and
     also the safe one: the worst case is English, never a broken label.

     The cost is that two different concepts sharing one English word share
     one translation. In this app that is "Range" and "Clear", and both are
     handled by giving them distinct keys and translating only the ones whose
     meaning is unambiguous. */
  var BY_ENGLISH = {};

  I.declare = function (keys) {
    Object.keys(keys).forEach(function (k) {
      KNOWN[k] = keys[k];
      /* first declaration wins, so a later duplicate English string cannot
         quietly steal the mapping from an earlier one */
      if (keys[k] && BY_ENGLISH[keys[k]] === undefined) BY_ENGLISH[keys[k]] = k;
    });
  };
  I.knownCount = function () { return Object.keys(KNOWN).length; };

  /* Translate a plain English string if we know it, otherwise hand it back
     unchanged. Everything the app already wrote in English goes through here. */
  I.auto = function (text) {
    if (current === 'en' || !text) return text;
    var key = BY_ENGLISH[text];
    if (!key) return text;
    var pack = PACKS[current];
    return (pack && pack[key] != null) ? pack[key] : text;
  };

  /* ── setting it ────────────────────────────────────────────────────────
     A language change rewrites every visible string, so the whole view is
     repainted rather than patched. Cheap, and it cannot leave a stale label
     behind the way a selective update can. */
  I.set = function (id) {
    if (!PACKS[id] && id !== 'en') return false;
    current = id;
    A.store.set(STORE_KEY, id);
    document.documentElement.setAttribute('lang', id);
    var info = I.info(id);
    document.documentElement.setAttribute('dir', info.rtl ? 'rtl' : 'ltr');
    A.Bus.emit('language', id);
    return true;
  };

  I.load = function () {
    var saved = A.store.get(STORE_KEY, null);
    if (saved && (PACKS[saved] || saved === 'en')) {
      current = saved;
    } else {
      /* First run: follow the phone. Someone who set their device to Polish
         did so for a reason and should not have to find this setting. Region
         is stripped - pt-BR and pt-PT both get Portuguese, which is the only
         Portuguese here. */
      var sys = (navigator.language || 'en').toLowerCase().split('-')[0];
      /* Norwegian reports as nb or nn depending on the written form */
      if (sys === 'nb' || sys === 'nn') sys = 'no';
      if (PACKS[sys]) current = sys;
    }
    document.documentElement.setAttribute('lang', current);
  };

})(window);
