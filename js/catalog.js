/*
 * Artemidos - speed & distance catalogue registry
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Every catalogue entry stores SI values only. The record carries the unit
 * KIND (dist, speed, mass, alt…) so the view renders it in whatever system
 * the user has chosen in Settings, rather than baking km or miles into data.
 *
 * Record shape:
 *   { cat, sub, id, n, d, speeds:[[label, m/s, note?]],
 *     specs:[[label, value, kind, note?]], arms:[...], calc, note, src }
 *
 * Figures are published open-source values (manufacturer data, service fact
 * sheets, reference works). Real performance varies with load, altitude,
 * temperature, sea state and configuration: treat every number as a planning
 * figure, not a guarantee.
 */
(function (global) {
  'use strict';

  var CATS = [], BY_CAT = {}, ITEMS = [], BY_ID = {}, PENDING = {};

  var Catalog = {
    /* register a top-level category with its subcategories */
    cat: function (def) {
      CATS.push(def);
      BY_CAT[def.id] = def;
      def.subs = def.subs || [];
      def.subById = {};
      def.subs.forEach(function (s) { s.parent = def.id; def.subById[s.id] = s; });
      /* anything that asked for this category before it existed */
      if (PENDING[def.id]) { Catalog.addSubs(def.id, PENDING[def.id]); delete PENDING[def.id]; }
      return def;
    },

    /* Add subcategories to a category DECLARED IN ANOTHER FILE. The catalogue
       is split across a dozen files and their load order is fixed in
       index.html rather than resolved, so a file that extends a category it
       does not own cannot assume the owner has run yet. Queue and attach. */
    addSubs: function (catId, subs) {
      var def = BY_CAT[catId];
      if (!def) { (PENDING[catId] = PENDING[catId] || []).push.apply(PENDING[catId], subs); return; }
      subs.forEach(function (sub) {
        if (def.subById[sub.id]) return;      /* already there */
        sub.parent = def.id;
        def.subs.push(sub);
        def.subById[sub.id] = sub;
      });
    },

    /* register one or many entries */
    add: function (rec) {
      if (Array.isArray(rec)) return rec.forEach(Catalog.add);
      if (!rec.id) {
        /* A bare strip of non-alphanumerics collapses "Air, -20 °C" and
           "Air, 20 °C" onto the same slug, so a minus that genuinely negates
           a number is preserved. It must be anchored to a word boundary:
           matching any hyphen before a digit would also rewrite MQ-9A, RS-28
           and Fattah-1, which are names, not negative numbers. */
        rec.id = (rec.cat + '-' + rec.sub + '-' + rec.n)
          .toLowerCase()
          .replace(/(^|[\s,(])[−-](?=\d)/g, '$1neg')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      if (BY_ID[rec.id]) {
        /* a duplicate id would silently shadow an entry in every lookup */
        console.warn('Artemidos catalogue: duplicate id "' + rec.id + '"');
        rec.id += '-2';
      }
      rec.speeds = rec.speeds || [];
      rec.specs = rec.specs || [];
      ITEMS.push(rec);
      BY_ID[rec.id] = rec;
      return rec;
    },

    cats: function () { return CATS; },
    catOf: function (id) { return BY_CAT[id]; },
    subOf: function (catId, subId) { var c = BY_CAT[catId]; return c && c.subById[subId]; },
    /* Entry ids are derived from cat + sub + name, so moving a subcategory to
       another category renames every entry under it. Ranks, insignia and
       camouflage moved from their own 'rank' category into 'mil', which
       silently broke every shortcut, deep link and stored reference that named
       the old id. The old form is therefore still accepted and mapped across.
       It costs one string comparison on a miss. */
    item: function (id) {
      var r = BY_ID[id];
      if (r) return r;
      if (String(id).indexOf('rank-') === 0) return BY_ID['mil-' + String(id).slice(5)];
      return undefined;
    },
    all: function () { return ITEMS; },

    in: function (catId, subId) {
      return ITEMS.filter(function (r) {
        return r.cat === catId && (!subId || r.sub === subId);
      });
    },

    countIn: function (catId, subId) { return Catalog.in(catId, subId).length; },

    /* free-text search across name, detail, category and armament names */
    search: function (q) {
      q = String(q || '').trim().toLowerCase();
      if (q.length < 2) return [];
      var terms = q.split(/\s+/);
      return ITEMS.filter(function (r) {
        var hay = (r.n + ' ' + (r.d || '') + ' ' + r.cat + ' ' + r.sub + ' ' +
          (r.arms || []).map(function (a) { return a.n; }).join(' ')).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) >= 0; });
      }).slice(0, 60);
    },

    /* the fastest named speed on a record, used for list subtitles */
    topSpeed: function (r) {
      var best = 0;
      (r.speeds || []).forEach(function (s) { if (s[1] > best) best = s[1]; });
      return best;
    }
  };

  global.ART_CATALOG = Catalog;

})(window);
