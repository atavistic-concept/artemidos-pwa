/*
 * Artemidos - catalogue: air and missile defence systems
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The short-range self-propelled guns and launchers live under Air defence
 * systems next door. This section is the strategic layer: the batteries that
 * cover a city or a country rather than a column, and the interceptors built
 * to hit ballistic warheads rather than aircraft.
 *
 * READ THE ENVELOPE, NOT THE HEADLINE RANGE. A system quoted at 400 km reaches
 * that far against a large, high, non-manoeuvring aircraft flying straight at
 * it. Against a cruise missile in ground clutter the same battery may engage
 * at 30 km, because the radar horizon, not the missile, is the limit: a target
 * at 50 m altitude is invisible beyond roughly 30 km from a mast-mounted radar
 * no matter how far the missile can fly. Almost every disappointed expectation
 * of air defence comes from confusing those two numbers.
 *
 * The other thing the figures hide is that these are SYSTEMS. A battery is
 * radars, launchers, a command post and reloads, and it can be defeated by
 * exhausting its magazine or by killing one radar, without ever outflying an
 * interceptor.
 *
 * Published open-source figures: service fact sheets, manufacturer material
 * and standard reference works. Performance claims for systems that have not
 * been tested in combat, which is most of the exo-atmospheric ones, are
 * design goals rather than demonstrated results.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var km = function (x) { return x * 1000; };

  function sam(n, country, d, speeds, specs, note, table) {
    C.add({
      cat: 'mil', sub: 'sam', n: n, country: country,
      d: country + ' · ' + d,
      speeds: speeds, specs: specs, note: note,
      table: table ? { plain: true, cols: ['Against', 'What it can do'], rows: table } : null
    });
  }

  /* ── the principle, ahead of the alphabet ─────────────────────────── */

  C.add({
    cat: 'mil', sub: 'sam', ord: -1, n: 'How layered air defence works', d: 'Why one system is never the answer',
    table: {
      plain: true,
      cols: ['Layer', 'What it covers'],
      rows: [
        ['Very short range, under 10 km', 'Guns and man-portable missiles. The last resort, and the layer that actually stops small drones, which the expensive layers cannot afford to engage.'],
        ['Short range, 10 to 40 km', 'Point defence of the battery, the airfield or the headquarters. Fast reaction, small magazine.'],
        ['Medium range, 40 to 150 km', 'Area cover for a town or a formation. This is where most real engagements happen.'],
        ['Long range, 150 to 400 km', 'Denies the airspace to aircraft that are not stealthy, and forces stand-off launches. It does not cover the ground under it against anything low.'],
        ['Endo-atmospheric ballistic defence', 'Catches a warhead in its last seconds inside the atmosphere. Small footprint, high confidence.'],
        ['Exo-atmospheric ballistic defence', 'Catches it in space, in the mid-course, which gives a huge footprint and a much harder shot.'],
        ['The gap nobody covers well', 'Low, slow and small: quadcopters, loitering munitions and cruise missiles in clutter. Every layer above is the wrong tool, by cost or by radar horizon.']
      ]
    },
    note: 'The layers exist because each one fails differently. A long-range battery has a magazine of a few dozen missiles and a radar that can be seen from a long way off; a short-range one cannot reach anything before it releases its weapons. Saturation beats a single layer of any depth, which is why cheap drones fired in numbers are the current problem: they are engaged with interceptors costing a hundred times what they do, and the exchange rate, not the hit rate, is what runs out first.'
  });

  /* ── Russia ───────────────────────────────────────────────────────── */

  sam('S-300PMU-2 Favorit', 'Russia', 'Long-range strategic surface-to-air system',
    [['48N6E2 interceptor', 2100]],
    [['Engagement range, aircraft', km(195), 'dist'],
     ['Engagement range, ballistic', km(40), 'dist'],
     ['Engagement ceiling', 27000, 'alt'],
     ['Minimum engagement altitude', 10, 'alt'],
     ['Acquisition radar range', km(300), 'dist', '64N6E2 Big Bird'],
     ['Targets engaged at once', 6, 'none'],
     ['Missiles guided at once', 12, 'none'],
     ['Reaction time', 8, 'none', 'seconds']],
    'The design the whole family descends from, and still the most widely exported long-range system in the world. Cold-launched: the missile is ejected from the tube and lights its motor in the air, which is what lets a launcher fire from cover.',
    [['Aircraft', 'Its intended target, out to the full range'],
     ['Cruise missiles', 'Yes, but the radar horizon cuts the useful range to about 30 km against a low flier'],
     ['Short-range ballistic missiles', 'Limited, out to about 40 km, terminal phase only'],
     ['Stealth aircraft', 'Detection at a small fraction of the quoted range'],
     ['Small drones', 'Technically yes; economically absurd']]);

  sam('S-400 Triumf', 'Russia', 'Long-range strategic surface-to-air system',
    [['40N6 interceptor', 2500], ['48N6DM interceptor', 2100], ['9M96E2 interceptor', 1000]],
    [['Engagement range, 40N6', km(400), 'dist'],
     ['Engagement range, 48N6DM', km(250), 'dist'],
     ['Engagement range, 9M96E2', km(120), 'dist'],
     ['Engagement ceiling', 30000, 'alt'],
     ['Minimum engagement altitude', 5, 'alt'],
     ['Detection range', km(600), 'dist', '91N6E acquisition radar'],
     ['Targets tracked', 300, 'none'],
     ['Targets engaged at once', 36, 'none'],
     ['Maximum target speed', 4800, 'vspeed'],
     ['Deployment time', 5, 'none', 'minutes']],
    'Four different interceptors on one command system, which is the actual innovation: the battery picks a cheap short-range round for a close target and keeps the 400 km missile for something worth it. The 400 km figure applies to a large high target such as a tanker or an AWACS, and needs an airborne or elevated sensor to see that far, since the earth curves away long before the missile runs out.',
    [['Aircraft', 'Full range against large high targets, much less against fighters'],
     ['AWACS and tankers', 'The 40N6 exists specifically to reach these and push them back'],
     ['Cruise missiles', 'Yes, inside the radar horizon, roughly 30 to 40 km when low'],
     ['Ballistic missiles', 'Short and medium range, terminal phase, out to about 60 km'],
     ['Stealth aircraft', 'Contested. Low-band acquisition radars detect, fire-control radars struggle'],
     ['Hypersonic glide vehicles', 'Not designed for it; the S-500 is the answer to that']]);

  sam('S-500 Prometey', 'Russia', 'Strategic anti-ballistic and anti-satellite system',
    [['77N6 interceptor', 2500]],
    [['Engagement range, ballistic', km(600), 'dist'],
     ['Engagement range, aerodynamic', km(500), 'dist'],
     ['Engagement ceiling', 200000, 'alt', 'exo-atmospheric'],
     ['Detection range', km(800), 'dist'],
     ['Maximum target speed', 7000, 'vspeed'],
     ['Targets engaged at once', 10, 'none']],
    'Built for the targets the S-400 cannot take: warheads in the mid-course, hypersonic glide vehicles and low-orbit satellites. Hit-to-kill rather than blast fragmentation, because at those closing speeds a warhead is not needed and proximity is not achievable. In limited service, and almost none of the claimed performance has been demonstrated publicly.',
    [['Intermediate-range ballistic missiles', 'The design case, in the mid-course'],
     ['ICBM warheads', 'Claimed, unproven'],
     ['Hypersonic glide vehicles', 'The stated reason it exists'],
     ['Low-orbit satellites', 'Claimed'],
     ['Aircraft', 'Yes, but using it for that wastes the system']]);

  sam('S-600', 'Russia', 'Announced successor to the S-500',
    [['Interceptor', 2500]],
    [['Engagement range, claimed', km(1000), 'dist', 'announced, not demonstrated'],
     ['Engagement ceiling, claimed', 250000, 'alt', 'exo-atmospheric'],
     ['Status', 0, 'none', 'announced; no confirmed hardware']],
    'Announced by Russian officials from 2023 onward as the layer above the S-500, aimed at hypersonic weapons and satellites. Treat every figure here as an aspiration rather than a specification: there is no confirmed hardware, no test record and no published design in the open literature, and the S-500 it is meant to succeed is itself barely in service. It is listed because you will meet the name, and the useful thing to know about it is exactly how little is known.',
    [['Hypersonic glide vehicles', 'The stated purpose'],
     ['Satellites', 'Claimed'],
     ['ICBM warheads', 'Claimed'],
     ['Anything, today', 'No evidence of a fielded system exists']]);

  /* ── United States ────────────────────────────────────────────────── */

  sam('MIM-104 Patriot PAC-3 MSE', 'United States', 'Medium-range air and missile defence system',
    [['PAC-3 MSE interceptor', 1700], ['PAC-2 GEM-T interceptor', 1400]],
    [['Engagement range, aircraft (GEM-T)', km(160), 'dist'],
     ['Engagement range, ballistic (MSE)', km(60), 'dist'],
     ['Engagement ceiling, MSE', 36000, 'alt'],
     ['Radar detection range', km(150), 'dist', 'AN/MPQ-65'],
     ['Interceptors per launcher', 12, 'none', 'MSE; 16 for baseline PAC-3'],
     ['Battery launchers', 8, 'none'],
     ['Reload time', 60, 'none', 'minutes for a full battery']],
    'The only Western system with a long combat record against ballistic missiles, and the record is the reason its limits are well understood: it defends a footprint measured in tens of kilometres, not a country, and a battery can be saturated. PAC-3 MSE is hit-to-kill; the older GEM-T is a blast-fragmentation round kept for aircraft and cruise missiles because it is cheaper and reaches further.',
    [['Aircraft', 'Yes, GEM-T out to 160 km'],
     ['Cruise missiles', 'Yes, and the new LTAMDS radar covers 360 degrees rather than a sector'],
     ['Short-range ballistic missiles', 'Its primary job, hit-to-kill, terminal phase'],
     ['Medium-range ballistic missiles', 'Yes, with a smaller footprint'],
     ['ICBM warheads', 'No. Wrong layer entirely'],
     ['Drones', 'Yes, and the cost exchange is the standing complaint']]);

  sam('THAAD', 'United States', 'Terminal High Altitude Area Defense',
    [['Interceptor', 2800]],
    [['Engagement range', km(200), 'dist'],
     ['Engagement ceiling', 150000, 'alt', 'high endo and exo-atmospheric'],
     ['Radar detection range', km(1000), 'dist', 'AN/TPY-2'],
     ['Interceptors per launcher', 8, 'none'],
     ['Battery launchers', 6, 'none'],
     ['Warhead', 0, 'none', 'none: hit-to-kill']],
    'Sits between Patriot and the exo-atmospheric layer, catching a warhead high in its terminal phase, which gives a footprint far larger than Patriot and a second chance if it misses. No warhead at all: it destroys by collision at closing speeds where an explosive would add nothing.',
    [['Short and medium-range ballistic missiles', 'The design case'],
     ['Intermediate-range ballistic missiles', 'Yes, at the top of its envelope'],
     ['ICBM warheads', 'Not the intended role'],
     ['Aircraft and cruise missiles', 'No. It has no capability against anything aerodynamic'],
     ['Debris footprint', 'A high intercept spreads wreckage widely, which is a planning factor on land']]);

  sam('Aegis BMD with SM-3 Block IIA', 'United States', 'Ship-based exo-atmospheric missile defence',
    [['SM-3 Block IIA interceptor', 4500]],
    [['Engagement range', km(2500), 'dist'],
     ['Engagement ceiling', 1500000, 'alt', 'exo-atmospheric, mid-course'],
     ['Radar detection range', km(1000), 'dist', 'AN/SPY-1 or SPY-6'],
     ['Interceptors per ship', 96, 'none', 'shared VLS cells with every other missile']],
    'The mobile part of American missile defence: a destroyer can be moved to cover a region in days, and the same launcher cells hold Tomahawks and air defence rounds, so the loadout is a choice rather than a fixture. Demonstrated against an ICBM-class target in 2020. The land version, Aegis Ashore, is the same system without the ship.',
    [['Medium and intermediate-range ballistic missiles', 'The design case, in the mid-course'],
     ['ICBM warheads', 'Demonstrated once, in a scripted test'],
     ['Satellites', 'Demonstrated in 2008'],
     ['Aircraft and cruise missiles', 'Not with SM-3; the same ship uses SM-2 and SM-6 for that'],
     ['Hypersonic glide vehicles', 'SM-6 Block IB is the intended answer, not SM-3']]);

  sam('Ground-Based Midcourse Defense', 'United States', 'Homeland exo-atmospheric interceptor system',
    [['Ground-Based Interceptor', 7000]],
    [['Engagement range', km(5000), 'dist'],
     ['Engagement ceiling', 2000000, 'alt', 'exo-atmospheric'],
     ['Interceptors deployed', 44, 'none', 'Fort Greely, Alaska and Vandenberg, California'],
     ['Warhead', 0, 'none', 'none: hit-to-kill']],
    'The only system intended to intercept an ICBM aimed at the continental United States. Its test record is mixed and every test has been heavily instrumented, so it is best read as a defence against a small or accidental launch rather than against a peer arsenal, which is also how it is officially described.',
    [['ICBM warheads', 'The sole purpose'],
     ['A small rogue launch', 'The stated design case'],
     ['A large salvo with decoys', 'Not credible: discriminating warheads from decoys in space is the unsolved problem'],
     ['Anything aerodynamic', 'No']]);

  sam('NASAMS', 'United States / Norway', 'Networked short to medium-range air defence',
    [['AMRAAM-ER interceptor', 1000]],
    [['Engagement range, AMRAAM-ER', km(50), 'dist'],
     ['Engagement range, AMRAAM', km(25), 'dist'],
     ['Engagement ceiling', 21000, 'alt'],
     ['Radar detection range', km(120), 'dist', 'AN/MPQ-64 Sentinel'],
     ['Missiles per launcher', 6, 'none']],
    'Fires the same missile carried by fighters, which is the point: the round is already in production and in the inventory. It protects Washington DC, and it has become the standard Western medium-tier export because it is affordable enough to field in numbers, which matters more than reach.',
    [['Cruise missiles', 'The design case, and it is good at it'],
     ['Aircraft and helicopters', 'Yes'],
     ['Drones', 'Yes, and the missile is cheap enough for the exchange to make sense'],
     ['Ballistic missiles', 'No']]);

  /* ── China ────────────────────────────────────────────────────────── */

  sam('HQ-9B', 'China', 'Long-range strategic surface-to-air system',
    [['Interceptor', 1400]],
    [['Engagement range', km(260), 'dist'],
     ['Engagement range, ballistic', km(30), 'dist'],
     ['Engagement ceiling', 27000, 'alt'],
     ['Minimum engagement altitude', 25, 'alt'],
     ['Radar detection range', km(300), 'dist', 'HT-233 phased array'],
     ['Missiles per launcher', 4, 'none']],
    'The Chinese answer to the S-300, using track-via-missile guidance closer to Patriot than to the Russian system it visually resembles. Exported to Pakistan, Turkmenistan and others, and deployed on the artificial islands in the South China Sea, which is where its coverage matters strategically.',
    [['Aircraft', 'Full range against large targets'],
     ['Cruise missiles', 'Yes, radar horizon limited'],
     ['Short-range ballistic missiles', 'Limited terminal capability, about 30 km'],
     ['Stealth aircraft', 'Claimed; unverified']]);

  sam('HQ-19', 'China', 'Exo-atmospheric ballistic missile interceptor',
    [['Interceptor', 3000]],
    [['Engagement range', km(1000), 'dist'],
     ['Engagement ceiling', 150000, 'alt', 'high endo and exo-atmospheric'],
     ['Maximum target speed', 5000, 'vspeed'],
     ['Warhead', 0, 'none', 'none: hit-to-kill']],
    'China\'s THAAD-class layer, and the same kind of weapon: a kinetic kill vehicle for warheads high in the terminal phase or in the mid-course. Credited with an anti-satellite capability, which is inherent to anything that can hit a warhead in space. Publicly displayed in 2025 after years of development in the open only through test notices.',
    [['Medium and intermediate-range ballistic missiles', 'The design case'],
     ['Hypersonic glide vehicles', 'Claimed'],
     ['Low-orbit satellites', 'Inherent to the capability'],
     ['Aircraft', 'No']]);

  sam('HQ-22', 'China', 'Medium to long-range surface-to-air system',
    [['Interceptor', 1200]],
    [['Engagement range', km(170), 'dist'],
     ['Engagement ceiling', 27000, 'alt'],
     ['Minimum engagement altitude', 50, 'alt'],
     ['Missiles per launcher', 6, 'none']],
    'Built to replace the ageing HQ-2 and to be affordable enough to field widely, so it sits below the HQ-9 rather than beside it. Exported to Serbia, the first Chinese long-range system in Europe.',
    [['Aircraft', 'Yes'],
     ['Cruise missiles', 'Yes, the stated priority'],
     ['Ballistic missiles', 'Minimal']]);

  sam('HQ-16', 'China', 'Medium-range surface-to-air system',
    [['Interceptor', 1200]],
    [['Engagement range', km(70), 'dist'],
     ['Engagement ceiling', 18000, 'alt'],
     ['Minimum engagement altitude', 15, 'alt'],
     ['Missiles per launcher', 6, 'none']],
    'Fills the gap between the short-range systems and the HQ-9, the layer that in practice does most of the work against aircraft and cruise missiles.',
    [['Aircraft', 'Yes'],
     ['Cruise missiles', 'The design case, including low ones'],
     ['Ballistic missiles', 'No']]);

  /* ── Israel and Europe ────────────────────────────────────────────── */

  sam('Arrow 3', 'Israel', 'Exo-atmospheric ballistic missile interceptor',
    [['Interceptor', 4500]],
    [['Engagement range', km(2400), 'dist'],
     ['Engagement ceiling', 100000, 'alt', 'exo-atmospheric'],
     ['Radar detection range', km(900), 'dist', 'Green Pine'],
     ['Warhead', 0, 'none', 'none: hit-to-kill']],
    'The top of the Israeli layered system, intended for warheads in space and used operationally against Houthi ballistic missiles from 2023, which makes it one of the very few exo-atmospheric interceptors with a combat record rather than a test record.',
    [['Medium and intermediate-range ballistic missiles', 'The design case, mid-course'],
     ['Warheads carrying chemical or nuclear payloads', 'Destroyed in space, which is the reason for intercepting that high'],
     ['Satellites', 'Inherent'],
     ['Aircraft', 'No']]);

  sam('David\'s Sling', 'Israel', 'Medium to long-range air and missile defence',
    [['Stunner interceptor', 2200]],
    [['Engagement range', km(300), 'dist'],
     ['Minimum engagement range', km(40), 'dist'],
     ['Engagement ceiling', 15000, 'alt'],
     ['Warhead', 0, 'none', 'none: hit-to-kill']],
    'Sits between Iron Dome and Arrow, covering the large rockets and the cruise missiles that are too big for one and too small for the other. The interceptor has two seekers, radar and electro-optical, which is unusual and is what lets it hit a manoeuvring target.',
    [['Large-calibre rockets', 'The design case'],
     ['Cruise missiles', 'Yes'],
     ['Short-range ballistic missiles', 'Yes'],
     ['Aircraft', 'Yes'],
     ['Small rockets and mortars', 'No, that is Iron Dome and the minimum range prevents it']]);

  sam('Iron Dome', 'Israel', 'Counter-rocket, artillery and mortar system',
    [['Tamir interceptor', 700]],
    [['Engagement range', km(70), 'dist'],
     ['Minimum engagement range', km(4), 'dist'],
     ['Interceptors per battery', 60, 'none', 'three launchers of 20'],
     ['Claimed success rate', 90, 'none', '% against engaged targets']],
    'The system that made intercepting cheap rockets practical, and it did it with software rather than with the missile: the radar predicts the impact point and the battery simply does not fire at anything landing in open ground. That selectivity is the whole design, because the interceptor costs far more than the rocket and firing at everything would be unaffordable.',
    [['Unguided rockets', 'The design case, out to 70 km'],
     ['Mortars', 'Yes, and it is the hardest case because the flight time is so short'],
     ['Cruise missiles and drones', 'Added later, with success'],
     ['Ballistic missiles', 'No'],
     ['Saturation', 'The real limit: 60 interceptors per battery and reloading takes minutes']]);

  sam('SAMP/T Mamba', 'France / Italy', 'Long-range air and missile defence system',
    [['Aster 30 interceptor', 1400]],
    [['Engagement range, aircraft', km(120), 'dist'],
     ['Engagement range, ballistic', km(35), 'dist'],
     ['Engagement ceiling', 20000, 'alt'],
     ['Radar detection range', km(350), 'dist', 'Arabel or GF300'],
     ['Missiles per launcher', 8, 'none']],
    'Europe\'s own long-range system and the only non-American one in NATO service. The Aster interceptor steers with side thrusters at the nose as well as fins, which gives it a turn rate at altitude that a fin-only missile cannot match.',
    [['Aircraft', 'Yes, out to 120 km'],
     ['Cruise missiles', 'The design priority'],
     ['Short-range ballistic missiles', 'Yes, terminal phase, about 35 km'],
     ['Medium-range ballistic missiles', 'Aster 30 Block 1NT extends this; in introduction']]);

})();
