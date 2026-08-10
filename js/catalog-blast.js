/*
 * Artemidos - catalogue: blast, fragmentation and standoff distances
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * HOW FAR AWAY IS FAR ENOUGH.
 *
 * Four distances, and they are not the same question:
 *
 *   LETHAL RADIUS      inside this, unprotected people are killed outright by
 *                      blast overpressure. Small by comparison with the rest.
 *   DAMAGE RADIUS      serious injury and structural damage. Survivable, but
 *                      not without cover and not without casualties.
 *   PARTIALLY SAFE     the minimum evacuation distance: far enough that a
 *                      person behind a solid wall, away from glass, is very
 *                      likely to be unhurt. It is NOT open ground.
 *   FULLY SAFE         the outdoor evacuation distance, set by flying glass
 *                      and fragments rather than by blast. It is several times
 *                      the distance most people assume.
 *
 * The vehicle-bomb figures are the published US bomb-threat standoff
 * distances (ATF / DHS), which are the reference every protective service
 * works from. Military munition figures are published lethal and casualty
 * radii. Everything here is evacuation and cordon planning: distances to put
 * between people and a device, never anything about a device.
 *
 * Two things surprise people every time. First, the fully safe distance is
 * enormous relative to the lethal one: a car bomb kills within about 30 m and
 * throws lethal glass 450 m. Second, GLASS is the injury mechanism at range,
 * so the safe place is not "far" but "far, and not in front of a window".
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  /* Blast scales with the cube root of charge mass, which is why a bomb a
     hundred times larger is only about five times wider in its lethal ring. */
  function scaled(kgTNT, z) { return z * Math.pow(kgTNT, 1 / 3); }

  C.add({
    cat: 'ball', sub: 'blast', ord: -1, n: 'The four distances', d: 'Lethal, damage, partially safe, fully safe',
    table: {
      plain: true,
      cols: ['Distance', 'What it means'],
      rows: [
        ['Lethal radius', 'Unprotected people are killed by the blast wave itself. Smaller than almost anyone expects: tens of metres even for a large vehicle bomb.'],
        ['Damage radius', 'Serious injury, ruptured eardrums, structural damage, collapse of light construction. Cover changes the outcome here more than anywhere else.'],
        ['Partially safe', 'The minimum evacuation distance. Behind a solid wall, away from glass, injury is unlikely. Standing in the open at this range is not the same thing.'],
        ['Fully safe', 'The outdoor evacuation distance. Set by flying glass and thrown fragments, not by blast, which is why it is several times further out.'],
        ['Why glass decides it', 'Beyond the damage radius the blast wave no longer injures directly, but it breaks windows, and glass from a high floor travels a long way and arrives edge-on. Most casualties at distance are glass casualties.'],
        ['Where to be', 'Behind mass, below the level of glass, and not in the line of a window or a glazed frontage. Distance without cover is worth far less than moderate distance with it.']
      ]
    },
    note: 'A useful habit: think in terms of "how much wall is between us", not only "how many metres". At the partially safe distance a solid wall is the difference between unhurt and injured, and at the fully safe distance the only remaining question is whether you are standing in front of glass.'
  });

  /* ── vehicle and carried devices: published standoff table ────────── */

  function dev(n, d, kg, lethal, minEvac, outdoor, note) {
    C.add({
      cat: 'ball', sub: 'blast', n: n, d: d,
      specs: [
        ['Charge mass, TNT equivalent', kg, 'mass'],
        ['Lethal radius', lethal, 'dist', 'blast alone, unprotected'],
        ['Partially safe', minEvac, 'dist', 'minimum evacuation, behind cover'],
        ['Fully safe', outdoor, 'dist', 'outdoor evacuation, glass hazard']
      ],
      table: {
        plain: true, cols: ['Distance', 'What to expect'],
        rows: [
          ['Inside ' + lethal + ' m', 'Fatal to anyone unprotected.'],
          [lethal + ' to ' + minEvac + ' m', 'Serious injury and structural damage. Survivable behind mass.'],
          [minEvac + ' to ' + outdoor + ' m', 'Blast will not kill you here. Flying glass still can. Stay off the glass line.'],
          ['Beyond ' + outdoor + ' m', 'Safe in the open.']
        ]
      },
      note: note
    });
  }

  dev('Pipe bomb', 'Improvised, carried', 2.3, 12, 21, 259,
    'The lethal radius is small enough that a wall or a vehicle between you and it changes everything, and the glass hazard still reaches a quarter of a kilometre.');

  dev('Suicide vest', 'Body-worn', 9, 15, 27, 330,
    'Designed to be carried into a crowd, which is why the lethal radius matters less than the density of people inside it. Ball-bearing fragments extend the casualty radius well past the blast figure.');

  dev('Briefcase or suitcase', 'Left device', 23, 20, 46, 564);

  dev('Car', 'Saloon boot', 227, 30, 98, 457,
    'The classic car bomb. Thirty metres of lethal radius, and lethal glass most of half a kilometre away.');

  dev('SUV or van', 'Larger vehicle', 454, 38, 122, 564);

  dev('Small delivery truck', 'Box van', 4536, 80, 195, 861);

  dev('Container or water truck', 'Heavy goods vehicle', 13608, 116, 263, 1160);

  dev('Semi-trailer', 'Articulated lorry', 27216, 146, 375, 1982,
    'At this size the cordon is a district, not a street. Two kilometres of outdoor evacuation is the published figure, and it is set almost entirely by glass falling from tall buildings.');

  /* ── military munitions: fragmentation, not blast, sets the distance ─ */

  function muni(n, d, lethal, casualty, frag, note, specs) {
    C.add({
      cat: 'ball', sub: 'blast', n: n, d: d,
      specs: [
        ['Lethal radius', lethal, 'dist', 'blast and dense fragments'],
        ['Damage radius', casualty, 'dist', 'casualty-producing, unprotected'],
        ['Partially safe', Math.round(casualty * 2), 'dist', 'prone, behind cover'],
        ['Fully safe', frag, 'dist', 'furthest fragment travel in the open']
      ].concat(specs || []),
      table: {
        plain: true, cols: ['Distance', 'What to expect'],
        rows: [
          ['Inside ' + lethal + ' m', 'Fatal or near-fatal to anyone unprotected.'],
          [lethal + ' to ' + casualty + ' m', 'Casualty-producing fragments. Going prone materially improves the odds.'],
          [casualty + ' to ' + frag + ' m', 'Occasional fragments still arrive with lethal energy. Cover matters more than distance.'],
          ['Beyond ' + frag + ' m', 'Safe in the open.']
        ]
      },
      note: note
    });
  }

  muni('Hand grenade', 'Fragmentation, M67 class', 5, 15, 230,
    'The gap between the 15 m casualty radius and the 230 m a fragment can travel is the reason grenade ranges are cleared so far back. Going prone is worth more than several metres of distance, because fragments fly outward and slightly upward.');

  muni('40 mm grenade', 'Underbarrel or automatic launcher', 5, 15, 130, null,
    [['Minimum arming range', 25, 'dist', 'closer than this it does not arm']]);

  muni('60 mm mortar bomb', 'Light mortar', 15, 30, 200);

  muni('81 mm mortar bomb', 'Medium mortar', 20, 40, 300);

  muni('120 mm mortar bomb', 'Heavy mortar', 30, 60, 400);

  muni('105 mm artillery shell', 'Field gun, HE', 30, 50, 350);

  muni('155 mm artillery shell', 'Medium artillery, HE', 50, 100, 500,
    'The standard NATO artillery round. A hundred metres of casualty radius is why "danger close" for friendly troops is measured in hundreds of metres, not tens.');

  muni('RPG-7 shaped charge', 'PG-7V anti-armour warhead', 4, 10, 150,
    'A shaped charge puts its energy forward into the armour, so the blast radius around it is small. The hazard to bystanders is the backblast behind the launcher and the fragments from what it hits.');

  muni('Anti-tank guided missile warhead', 'Javelin, Kornet class, 7 to 10 kg', 10, 20, 200);

  muni('Aircraft bomb, 500 lb', 'Mk 82, 227 kg', 60, 120, 500);

  muni('Aircraft bomb, 2000 lb', 'Mk 84, 429 kg', 110, 220, 800,
    'Published safe separation for unprotected personnel runs to about 800 m. Inside a building the collapse hazard reaches further than the fragments do.');

  /* ── standoff computed for every warhead in the missile catalogue ──── */

  /* Rather than restate this per missile, every record that publishes a
     warhead mass gets the same three distances derived from it, using the
     coefficients that fit the published standoff table. A reader looking at
     the Shahed-136 or a cruise missile can then see how far back is far
     enough without leaving the entry. */
  var Z_LETHAL = 4.85, Z_PARTIAL = 14, Z_FULL = 40;

  /* ── damage radius for every gun and launcher in the catalogue ────────
     A weapon entry gave the range it reaches and never what the round does
     when it arrives, so "effective range 3000 m" said nothing about how far
     from the impact it is dangerous to stand. Radii are keyed off the calibre
     read out of the armament's own name, using published lethal and casualty
     figures for a high-explosive nature of that size. Kinetic and small-arms
     natures get nothing, because their danger is the projectile itself and
     that is already covered by the range. */
  var HE_EFFECT = [
    /* calibre mm, lethal m, casualty m, fragments to m */
    [20, 5, 10, 100], [25, 6, 12, 120], [30, 8, 15, 150], [35, 9, 18, 170],
    [40, 5, 15, 130], [57, 12, 25, 200], [73, 14, 28, 220], [76, 15, 30, 250],
    [82, 20, 40, 300], [90, 18, 35, 280], [100, 20, 40, 300], [105, 30, 50, 350],
    [115, 25, 45, 320], [120, 30, 60, 400], [122, 30, 60, 400], [125, 30, 55, 380],
    [127, 32, 60, 400], [130, 35, 65, 420], [152, 50, 100, 500], [155, 50, 100, 500],
    [203, 70, 140, 600], [220, 75, 150, 650], [240, 80, 160, 700], [300, 90, 180, 800]
  ];

  function heEffect(name) {
    var m = String(name || '').match(/(\d{2,3})\s*mm/);
    if (!m) return null;
    var cal = +m[1];
    /* a purely kinetic or small-arms nature has no burst radius worth quoting */
    if (cal < 20) return null;
    if (/apfsds|sabot|kinetic|coax|machine gun|7\.62|12\.7|14\.5/i.test(name)) return null;
    var best = null;
    HE_EFFECT.forEach(function (row) {
      if (!best || Math.abs(row[0] - cal) < Math.abs(best[0] - cal)) best = row;
    });
    return best;
  }

  C.all().forEach(function (rec) {
    (rec.arms || []).forEach(function (a) {
      if (a.lethal) return;
      var e = heEffect(a.n);
      if (!e) return;
      a.lethal = e[1];
      a.casualty = e[2];
      a.fragTo = e[3];
    });
  });

  /* Strike weapons that carry an explosive warhead but never had its mass
     entered as a spec, so they produced no impact rings. HE-equivalent mass
     in kg, curated from open figures. Interceptors and air-to-air missiles
     are deliberately absent: they detonate in the air against a target, not
     on the ground, so a ground blast radius would be a fiction - their useful
     radius is the engagement range they already show. Reconnaissance drones
     carry no warhead at all and show their operational range instead. */
  var WARHEAD_KG = {
    /* anti-tank and shoulder-fired (HEAT / HE) */
    'NLAW': 1.8, 'Spike LR2': 3, 'RPG-7': 2, 'AT4 / M136': 0.44, 'Carl Gustaf M4': 3,
    /* cruise, anti-ship and hypersonic */
    'BrahMos': 200, 'P-800 Oniks': 250, '3M22 Zircon': 300,
    /* conventional ballistic and coastal */
    'Fattah-2': 400, 'DF-17': 500, 'Mohit': 165,
    /* loitering munitions (the drone IS the warhead) */
    'Switchblade 300': 0.45, 'Switchblade 600': 5, 'Lancet-3': 3, 'KUB-BLA': 3,
    'Shahed-129': 30, 'Mohajer-6': 40, 'Ababil-3': 30
  };

  ['missile', 'icbm', 'uas'].forEach(function (sub) {
    C.in('mil', sub).forEach(function (rec) {
      var wh = (rec.specs || []).filter(function (s) {
        return /^warhead$/i.test(s[0]) && s[2] === 'mass' && s[1] > 0;
      })[0];
      var kg = wh ? wh[1] : WARHEAD_KG[rec.n];
      if (!(kg > 0)) return;
      rec.specs.push(
        ['Lethal radius', Math.round(scaled(kg, Z_LETHAL)), 'dist', 'blast alone, unprotected'],
        ['Partially safe', Math.round(scaled(kg, Z_PARTIAL)), 'dist', 'minimum evacuation, behind cover'],
        ['Fully safe', Math.round(scaled(kg, Z_FULL)), 'dist', 'outdoor evacuation, glass and fragments']
      );
      rec.blastNote = true;
    });
  });

  /* ── safe distance on the nuclear entries ─────────────────────────────
     The yield entries listed the rings that hurt you and never the distance
     at which they stop, which is the one figure a person actually wants. The
     blast rings scale with the cube root of yield; the outer limit is set by
     window glass rather than by pressure, which is why it sits so far beyond
     the ring where buildings are still standing. */
  C.in('mil', 'nuke').forEach(function (rec) {
    var y = (rec.specs || []).filter(function (s) { return /^yield$/i.test(s[0]); })[0];
    if (!y) return;
    var kt = y[1];
    var psi1 = (rec.specs.filter(function (s) { return /1 psi/i.test(s[0]); })[0] || [])[1];
    var burns = (rec.specs.filter(function (s) { return /burns/i.test(s[0]); })[0] || [])[1];
    if (!psi1) return;
    var outer = Math.max(psi1, burns || 0);
    rec.specs.push(
      ['Partially safe', Math.round(outer), 'dist', 'behind mass, away from glass and out of line of sight'],
      ['Fully safe from blast and heat', Math.round(outer * 1.6), 'dist', 'in the open, clear of the glass hazard'],
      ['Still not safe from fallout', 0, 'none', 'downwind, at any distance, if the burst touched the ground']
    );
    rec.safeNote = true;
  });

})();
