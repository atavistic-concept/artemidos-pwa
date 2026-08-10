/*
 * Artemidos - cloud field guide
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The ten cloud genera, in the order the sky usually gives them to you: high
 * ice, then the middle deck, then the low deck, then the ones that grow
 * upward through all three. Each carries what it looks like, roughly how high
 * its base sits, and - the reason to read the sky at all - what it is telling
 * you about the next few hours.
 *
 * This is a field guide, not a forecast. A single cloud is a hint; a SEQUENCE
 * is a prediction. The classic warning of an approaching warm front is the
 * march cirrus to cirrostratus to altostratus to nimbostratus over a day or
 * so, the base lowering and thickening the whole time. That sequence note is
 * called out where it matters, because it is worth more than any single frame.
 *
 * Genus names are Latin and international - they are not translated, only the
 * plain-language description and meaning are.
 */
(function (global) {
  'use strict';

  var A = global.A;

  /* band: which deck. name: Latin genus + abbreviation. base: rough base
     height in the temperate mid-latitudes. look: what it is. means: what it
     tells you. */
  var BANDS = [
    { id: 'high', label: 'High cloud', sub: 'Base above about 6 km, made of ice' },
    { id: 'mid',  label: 'Middle cloud', sub: 'Base about 2 to 6 km' },
    { id: 'low',  label: 'Low cloud', sub: 'Base below about 2 km' },
    { id: 'vert', label: 'Vertical cloud', sub: 'Grows up through every deck' }
  ];

  var CLOUDS = [
    { band: 'high', name: 'Cirrus (Ci)', base: 'Base 6 to 12 km',
      look: 'Thin white streaks and filaments, often hooked into commas the wind draws out.',
      means: 'Fair for now, but watch it. Cirrus thickening and spreading from one horizon is the first sign of an approaching warm front and rain within a day.' },
    { band: 'high', name: 'Cirrocumulus (Cc)', base: 'Base 6 to 12 km',
      look: 'Small white ripples and grains in rows, a "mackerel sky", no shading.',
      means: 'Unsettled, often cold and bright. Rarely lasts long; usually turning into or out of cirrus or cirrostratus.' },
    { band: 'high', name: 'Cirrostratus (Cs)', base: 'Base 6 to 12 km',
      look: 'A thin milky veil over the whole sky, thin enough to see the sun through, and it makes a halo ring around the sun or moon.',
      means: 'The halo is the classic sign: rain or snow often follows within 12 to 24 hours as a warm front closes in.' },
    { band: 'mid', name: 'Altocumulus (Ac)', base: 'Base 2 to 6 km',
      look: 'White or grey rounded clumps and rolls in groups, with clear gaps and some shading.',
      means: 'On a warm humid morning, altocumulus can mean thunderstorms by afternoon. Otherwise a sign of change, not settled weather.' },
    { band: 'mid', name: 'Altostratus (As)', base: 'Base 2 to 6 km',
      look: 'A grey or blue-grey sheet over most of the sky; the sun shows as if through frosted glass, with no halo.',
      means: 'Rain or snow is close, usually within hours. As it thickens and lowers into nimbostratus the precipitation begins.' },
    { band: 'low', name: 'Nimbostratus (Ns)', base: 'Base below 2 km, deep',
      look: 'A thick dark grey layer that blots out the sun, ragged at the bottom with steady falling rain or snow.',
      means: 'Steady, prolonged rain or snow, already falling or about to. This is the rain cloud of a warm front, hours of it, not a shower.' },
    { band: 'low', name: 'Stratus (St)', base: 'Base below about 1 km',
      look: 'A low uniform grey layer with a fairly even base, like a lifted fog; may give drizzle.',
      means: 'Dull and damp. Drizzle or light snow grains at most, no heavy rain. Often burns off by midday if the sun gets to it.' },
    { band: 'low', name: 'Stratocumulus (Sc)', base: 'Base below 2 km',
      look: 'Low lumpy grey and white rolls or patches, often covering the sky with thin bright gaps between.',
      means: 'Generally dry, the commonest cloud on earth. Little or no rain, though it can thicken ahead of worse weather.' },
    { band: 'low', name: 'Cumulus (Cu)', base: 'Base 0.5 to 2 km',
      look: 'Detached white heaps with flat bases and cauliflower tops, the fair-weather cloud of a sunny afternoon.',
      means: 'Small, flat cumulus means fair weather. But if they build tall and hard through the afternoon, they are turning into cumulonimbus.' },
    { band: 'vert', name: 'Cumulonimbus (Cb)', base: 'Base under 2 km, top to 12 km or more',
      look: 'A towering cloud with a dark base and a top spread into an anvil. The storm cloud.',
      means: 'The dangerous one: heavy showers, hail, lightning, sudden violent gusts and downdraughts, and the parent of tornadoes. Take it seriously on land, at sea and in the air.' }
  ];

  /* Rendered through the catalogue's calc hook, so tapping "Clouds" under
     Recon > Natural phenomena opens this. Returns one node. */
  function render() {
    var root = A.el('div');

    root.appendChild(A.UI.note(
      'A single cloud is a hint; a sequence is a prediction. The classic warm-front warning is ' +
      'cirrus lowering and thickening through cirrostratus, altostratus and nimbostratus over a day, ' +
      'the rain arriving with the last of them. Read the trend, not the snapshot.'));

    BANDS.forEach(function (b) {
      var list = CLOUDS.filter(function (c) { return c.band === b.id; });
      if (!list.length) return;
      root.appendChild(A.UI.section(b.label));
      var band = A.el('.fld-hint');
      band.textContent = A.tr(b.sub);
      root.appendChild(band);
      list.forEach(function (c) {
        var card = A.UI.card(null, 'tight');
        card.appendChild(A.UI.metric(c.name, '', { sub: c.base }));
        var look = A.el('.note');
        look.textContent = A.tr(c.look);
        card.appendChild(look);
        var lab = A.el('.fld-hint');
        lab.textContent = A.tr('What it means');
        card.appendChild(lab);
        var means = A.el('.note');
        means.textContent = A.tr(c.means);
        card.appendChild(means);
        root.appendChild(card);
      });
    });

    root.appendChild(A.UI.note(
      'Heights are rough temperate-latitude figures; bases run lower in cold air and higher in the ' +
      'tropics. What matters in the field is the shape and the trend, not the exact altitude.'));

    return root;
  }

  /* wire into the physics calc registry so the catalogue entry can call it */
  function wire() {
    if (global.ArtPhysics && global.ArtPhysics.calc) {
      global.ArtPhysics.calc.clouds = render;
      return true;
    }
    return false;
  }
  if (!wire()) {
    /* physics.js not up yet: try again on the next tick */
    setTimeout(wire, 0);
  }

  /* the catalogue button under Natural phenomena */
  if (global.ART_CATALOG) {
    global.ART_CATALOG.add({
      cat: 'physics', sub: 'nature', id: 'physics-nature-clouds', ord: -1,
      n: 'Clouds', d: 'Field guide: the ten types and what each means',
      calc: 'clouds'
    });
  }

})(window);
