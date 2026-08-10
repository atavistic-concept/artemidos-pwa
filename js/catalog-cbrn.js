/*
 * Artemidos - catalogue: nuclear, radiological and chemical
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT REACHES HOW FAR, HOW TO RECOGNISE IT, AND WHAT TO DO ABOUT IT.
 *
 * This section is scoped exactly the way the ballistics and radiation
 * sections are: effects, recognition, protection, decontamination and
 * casualty care. It describes what a weapon DOES to the people and ground
 * around it, so that a protection team can read a warning sign, judge a
 * distance, choose a direction and treat someone.
 *
 * It contains nothing on how any of these weapons is made, obtained,
 * modified or employed. No synthesis, no precursors, no device design, no
 * dispersal method. Those are not omissions to be filled in later; they are
 * the boundary of this file, and everything here sits on the protective side
 * of it. The sources are the open civil-defence and treaty-body literature:
 * published effects tables, OPCW and CDC agent fact sheets, WHO and IAEA
 * guidance on radiological emergencies.
 *
 * NOTHING HERE REPLACES A DOCTOR, A SURVEY METER OR A HAZMAT TEAM. Antidotes
 * named below are prescription medicines, several are carried only by
 * military and emergency services, and dosing is a clinical decision. The
 * value of knowing them in the field is recognising what a casualty needs
 * and asking for it by name, not self-medicating.
 *
 * Effects figures are for an optimum-height airburst on a clear day over
 * flat ground. Terrain, weather, buildings and burst height all move them,
 * usually by more than the difference between two adjacent yields.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var km = function (x) { return x * 1000; };

  /* ══════════════════════════════════════════════════════════════════════
     NUCLEAR AND RADIOLOGICAL  (mil / nuke)
     ══════════════════════════════════════════════════════════════════════ */

  /* Yield entries share a shape: the five rings that matter, then a table
     read outward from the burst. Blast radii scale with the cube root of
     yield, thermal a little faster, prompt radiation far more slowly because
     the atmosphere absorbs it. That is why a weapon fifty times larger is
     only about four times wider in blast, and why prompt radiation dominates
     at small yields and is irrelevant at large ones: at 1 Mt the 5 Sv ring
     is deep inside the ring where the blast has already killed. */
  function nuke(n, d, yieldKt, r, note, table, ord) {
    C.add({
      cat: 'mil', sub: 'nuke', n: n, d: d, ord: ord,
      speeds: [
        ['Thermal flash', 299792458],
        ['Blast wave, near the severe-damage ring', 420],
        ['Blast wave, far field', 340]
      ],
      specs: [
        ['Yield', yieldKt, 'none', yieldKt >= 1000 ? 'kt  (' + (yieldKt / 1000) + ' Mt)' : 'kt'],
        ['Fireball radius', r.fireball, 'dist', 'everything inside is vaporised'],
        ['Severe blast damage, 5 psi', r.psi5, 'dist', 'most buildings collapse'],
        ['Window breakage, 1 psi', r.psi1, 'dist', 'flying glass, the widest injury ring'],
        ['Third-degree burns, clear day', r.burns, 'dist', 'exposed skin, line of sight'],
        ['Prompt radiation, 5 Sv', r.prompt, 'dist', 'fatal without treatment']
      ],
      table: { plain: true, cols: ['Distance from the burst', 'What happens there'], rows: table },
      note: note
    });
  }

  nuke('Nuclear weapon, 1 kt', 'Tactical or improvised yield', 1,
    { fireball: 50, psi5: 410, psi1: 1130, burns: 440, prompt: 700 },
    'At this yield prompt radiation reaches FURTHER than the blast that would kill you, which is the reverse of every larger weapon and the reason a small device is not simply a small version of a big one. Someone sheltered from blast at 700 m has still taken a fatal dose unless mass stood between them and the fireball.',
    [['0 to 150 m', 'No survivors. Fireball and crater.'],
     ['150 to 400 m', 'Reinforced buildings destroyed. Survival only in a deep basement or a hardened structure.'],
     ['400 to 700 m', 'Severe blast injury and burns. Fatal prompt radiation dose in the open.'],
     ['700 m to 1.1 km', 'Blast injuries, burns, flying debris. Survivable with immediate shelter and medical care.'],
     ['Beyond 1.1 km', 'Broken glass is the main injury. Get away from windows, then move upwind and inside.']], 1);

  nuke('Nuclear weapon, 20 kt', 'Fission weapon, Hiroshima and Nagasaki class', 20,
    { fireball: 180, psi5: 1100, psi1: 2900, burns: 1400, prompt: 1200 },
    'The yield the world has actually seen used. Thermal and blast now reach beyond the prompt radiation ring, so distance and a solid wall between you and the flash become the things that decide outcomes.',
    [['0 to 400 m', 'Total destruction. No survivors in the open or in ordinary buildings.'],
     ['400 m to 1.1 km', 'Most buildings collapse. Very high fatality, third-degree burns on any exposed skin.'],
     ['1.1 to 1.4 km', 'Serious burns and blast injury. Survivable in shelter, mass casualties in the open.'],
     ['1.4 to 2.9 km', 'Injury mainly from flying glass and collapsing fittings. Fires start.'],
     ['Beyond 2.9 km', 'Light damage. The hazard now is fallout, not blast: get inside and stay inside.']], 2);

  nuke('Thermonuclear warhead, 300 kt', 'Typical modern strategic warhead', 300,
    { fireball: 550, psi5: 2800, psi1: 7300, burns: 5700, prompt: 1700 },
    'A hydrogen bomb uses a fission trigger to ignite fusion, which is where the extra yield comes from. The practical difference for anyone on the ground is that the thermal pulse now outruns the blast by kilometres: people are burned at ranges where buildings are still standing, and line of sight to the fireball matters more than the strength of the wall behind them.',
    [['0 to 1 km', 'Total destruction.'],
     ['1 to 2.8 km', 'Most buildings collapse. Very high fatality.'],
     ['2.8 to 5.7 km', 'Structures damaged but standing. Third-degree burns on exposed skin in line of sight of the flash.'],
     ['5.7 to 7.3 km', 'Windows blown in, widespread lacerations, fires from the thermal pulse.'],
     ['Beyond 7.3 km', 'Fallout is the whole problem. Shelter immediately and stay there.']], 3);

  nuke('Thermonuclear warhead, 1 Mt', 'Large strategic warhead', 1000,
    { fireball: 900, psi5: 4100, psi1: 11000, burns: 10500, prompt: 2100 },
    'Fifty times the yield of a 20 kt weapon buys under four times the blast radius, because blast scales with the cube root of yield. Thermal does not: the burn ring reaches past 10 km, so at this size the flash is the dominant casualty mechanism and the horizon, not the wall, is the shielding that counts.',
    [['0 to 1.9 km', 'Total destruction.'],
     ['1.9 to 4.1 km', 'Most buildings collapse. Very high fatality.'],
     ['4.1 to 10.5 km', 'Third-degree burns on exposed skin in line of sight. Buildings damaged, many fires.'],
     ['10.5 to 11 km', 'Window breakage, glass injuries, fires.'],
     ['Beyond 11 km', 'Blast is survivable. Fallout decides what happens next.']], 4);

  C.add({
    cat: 'mil', sub: 'nuke', ord: 5, n: 'Fallout after a surface burst', d: 'Why the first 48 hours decide the dose',
    specs: [
      ['Dose rate at 1 hour', 1, 'none', 'reference point, taken as 1'],
      ['At 7 hours', 0.1, 'none', 'one tenth of the 1-hour rate'],
      ['At 49 hours', 0.01, 'none', 'one hundredth'],
      ['At 2 weeks', 0.001, 'none', 'one thousandth'],
      ['Shelter worth reaching', 500, 'dist', 'move by minutes, not kilometres']
    ],
    table: {
      plain: true, cols: ['Time after the burst', 'What it means for you'],
      rows: [
        ['First 15 minutes', 'Fallout has not yet fallen at any distance. This is the window to get inside, not to drive away.'],
        ['First hour', 'Highest dose rate of the entire event. Being indoors now is worth more than anything else you can do.'],
        ['1 to 24 hours', 'Rate falls fast but is still dangerous. Stay in the strongest part of the building, centre or basement.'],
        ['24 to 48 hours', 'Rate down by roughly a hundredfold. Short, planned movement becomes reasonable if instructed.'],
        ['After 48 hours', 'Evacuation on official routes. The remaining hazard is contamination you carry, not the air.']
      ]
    },
    note: 'The seven-ten rule: for every sevenfold increase in time, the dose rate falls by a factor of ten. It is the most useful single number in a fallout situation because it can be done in your head. A surface burst draws soil into the fireball and makes heavy local fallout; an airburst, where the fireball never touches the ground, makes far less. Getting inside and staying inside beats running: people have died on the road taking a dose they would not have taken in a basement.'
  });

  C.add({
    cat: 'mil', sub: 'nuke', ord: 6, n: 'Radiological dispersal device (dirty bomb)', d: 'Conventional explosive plus radioactive material',
    speeds: [['Blast wave', 400], ['Plume drift, light wind', 3]],
    specs: [
      ['Immediate lethal radius', 30, 'dist', 'from the explosive, as with any bomb'],
      ['Typical contamination footprint', 500, 'dist', 'highly dependent on wind and material'],
      ['Radiation deaths expected', 0, 'none', 'in almost every credible scenario'],
      ['Outer clothing removal', 90, 'none', '% of contamination removed']
    ],
    table: {
      plain: true, cols: ['What people assume', 'What is actually true'],
      rows: [
        ['It is a small nuclear weapon', 'It is not. There is no chain reaction, no fireball and no mushroom cloud. It is a conventional bomb that spreads material.'],
        ['The radiation kills', 'The explosive kills. Radiation doses beyond the immediate blast are usually far below the level that causes acute illness.'],
        ['You must evacuate immediately', 'Move out of the dust and upwind, then follow instructions. Panic movement through the plume is worse than a short controlled wait.'],
        ['The area is lost', 'The real cost is denial and cleanup, which can run for months and is the actual purpose of such a device.']
      ]
    },
    note: 'Treated correctly this is a weapon of disruption, not of mass casualty, and the correct response protects you almost completely: move upwind and out of the visible dust, do not inhale it, remove outer clothing (which takes about 90 % of contamination with it) and bag it, wash with soap and water, and report for monitoring. The one genuinely dangerous act is picking up or pocketing an unidentified source found near the scene.'
  });

  C.add({
    cat: 'mil', sub: 'nuke', ord: 7, n: 'High-altitude burst and EMP', d: 'Electromagnetic pulse, no blast at ground level',
    speeds: [['Pulse propagation', 299792458]],
    specs: [
      ['Burst altitude', 300000, 'alt', 'typical, well above the atmosphere'],
      ['Ground footprint radius', km(2200), 'dist', 'line of sight from the burst'],
      ['Rise time of the fast pulse', 0.000000005, 'none', 'seconds, about 5 nanoseconds'],
      ['Direct casualties', 0, 'none', 'no blast or thermal effect at the surface']
    ],
    table: {
      plain: true, cols: ['System', 'Exposure'],
      rows: [
        ['Long cable runs, power grid, landlines', 'Worst affected. Length is what collects the pulse.'],
        ['Vehicles', 'Mostly survive. Some stall and restart; the fleet does not simply stop.'],
        ['Handheld radios and phones, unpowered', 'Often survive. Short antennas collect little.'],
        ['Equipment in a closed metal enclosure', 'Largely protected, if nothing conductive runs in or out.'],
        ['Anything connected to mains at the moment', 'Most likely to be damaged, through the cable rather than through the air.']
      ]
    },
    note: 'Nobody at the surface feels the burst itself. The planning problem is a communications and power outage over a continental footprint with no warning and no blast damage to explain it. For a protection team the practical answer is the same as for any comms failure: a pre-agreed rally point, a printed map, a vehicle that does not depend on a network, and cash.'
  });

  /* ══════════════════════════════════════════════════════════════════════
     CHEMICAL AGENTS  (chem)

     Ordered for recognition first, because that is the order in which the
     field actually meets them: something smells wrong, or people start
     dropping, and the class has to be named before anything else follows.
     ══════════════════════════════════════════════════════════════════════ */

  C.cat({
    id: 'chem', n: 'Chemical agents', icon: 'chem',
    d: 'Recognition, protection, decontamination and treatment',
    subs: [
      { id: 'nerve', n: 'Nerve agents', icon: 'warn', d: 'G and V series, Novichok class' },
      { id: 'blister', n: 'Blister agents', icon: 'warn', d: 'Mustard, lewisite: burns, often delayed' },
      { id: 'blood', n: 'Blood agents', icon: 'warn', d: 'Cyanides: fast, brief, lethal' },
      { id: 'choking', n: 'Choking agents', icon: 'warn', d: 'Chlorine, phosgene: lungs, delayed' },
      { id: 'riot', n: 'Riot control & incapacitants', icon: 'warn', d: 'CS, CN, OC and opioid incapacitants' },
      { id: 'warn', n: 'Warning signs in the field', icon: 'recon', d: 'What you see, smell and hear first' },
      { id: 'protect', n: 'Protection & decontamination', icon: 'shield', d: 'Masks, skin, evacuation, stripping down' },
      { id: 'treat', n: 'Treatment by agent class', icon: 'ambulance', d: 'First actions and antidotes by name' }
    ]
  });

  /* An agent record. Odour is listed because it is often the only warning
     available, and disbelieved because several agents have none at all. */
  function agent(sub, n, mil, d, props, rows, note, act) {
    var full = rows.slice();
    if (act) {
      /* the three questions a casualty actually asks, on every agent, in the
         same place: where do I go, what filter stops it, what can I do with
         no doctor. Kept out of the free-text note so they are never buried. */
      full.push(['▸ Evacuate', act.evac]);
      full.push(['▸ Filter', act.filter]);
      full.push(['▸ Field treatment', act.treat]);
    }
    C.add({
      cat: 'chem', sub: sub, n: n, d: (mil ? mil + ' · ' : '') + d,
      specs: props,
      table: { plain: true, cols: ['Property', 'In the field'], rows: full },
      note: note
    });
  }

  /* ── nerve agents ─────────────────────────────────────────────────── */

  agent('nerve', 'Sarin', 'GB', 'Volatile nerve agent, vapour hazard',
    [['Onset by inhalation', 30, 'none', 'seconds to minutes'],
     ['Persistence, temperate', 4, 'none', 'hours, evaporates quickly'],
     ['Vapour density vs air', 4.86, 'none', 'sinks and pools low']],
    [['Appearance', 'Colourless liquid. Evaporates roughly like water, so the hazard is what you breathe.'],
     ['Odour', 'None. Do not expect a warning smell, because there is not one.'],
     ['Where it collects', 'Low ground, basements, trenches, vehicle footwells. Heavier than air.'],
     ['First signs', 'Pinpoint pupils, blurred or dim vision, runny nose, tight chest, drooling.'],
     ['Then', 'Vomiting, loss of bladder and bowel control, convulsions, respiratory arrest.'],
     ['Route that matters most', 'Inhalation. A respirator is the single highest-value item.']],
    'The classic multiple-casualty picture: several people down in the same low place, all with pinpoint pupils and wet faces, no smell, no smoke. Nobody enters to help without a mask, or the rescuers become the next casualties. That is the most common way responders die at a nerve agent incident.',
    { evac: 'Upwind AND uphill. Sarin vapour is nearly five times heavier than air and pools in low ground, basements and vehicle footwells, so never move downward to escape it.',
      filter: 'CBRN combined filter to NATO/EN standard (A2B2E2K2 with a reactive/ASZM carbon layer, e.g. a 40 mm CBRN or military canister). A plain organic-vapour or particulate (N95) filter does NOT stop nerve vapour.',
      treat: 'Mask on, get out, strip and wash off any liquid with soap and water. The life-saver is an auto-injector: atropine repeated until the chest loosens and secretions dry, plus an oxime (pralidoxime), and diazepam for convulsions. Nothing improvised substitutes; with no injectors, decontaminate, keep the airway open and the casualty on their side, and call for the antidotes by name.' });

  agent('nerve', 'Soman', 'GD', 'Nerve agent, ageing is rapid',
    [['Onset by inhalation', 30, 'none', 'seconds to minutes'],
     ['Persistence, temperate', 12, 'none', 'hours'],
     ['Window for pralidoxime', 2, 'none', 'minutes, before the enzyme ages']],
    [['Appearance', 'Colourless to light brown liquid.'],
     ['Odour', 'Faint, sometimes described as camphor or fruit. Not reliable.'],
     ['First signs', 'As sarin: pinpoint pupils, secretions, chest tightness.'],
     ['What is different', 'The bond with the enzyme sets ("ages") within minutes, so the oxime antidote must be given almost immediately to work at all.'],
     ['Practical meaning', 'Atropine and seizure control still work. Speed matters more here than with any other agent.']],
    'Ageing is the reason military pre-treatment exists for this agent specifically. In the field it changes nothing about what you do, only about how fast you must do it.',
    { evac: 'Upwind and uphill, out of any low or enclosed ground.',
      filter: 'CBRN combined filter (A2B2E2K2 reactive). Not an organic-vapour-only or particulate mask.',
      treat: 'Atropine and diazepam as for sarin, and the oxime must go in within about two minutes to work at all because the enzyme ages fast: give the auto-injector the instant the diagnosis is suspected, do not wait for confirmation.' });

  agent('nerve', 'VX', 'VX', 'Persistent nerve agent, contact hazard',
    [['Onset by skin contact', 30, 'none', 'minutes to hours, dose dependent'],
     ['Persistence, temperate', 168, 'none', 'hours, can be weeks in cold'],
     ['Volatility', 0, 'none', 'very low: it stays where it lands']],
    [['Appearance', 'Amber, oily liquid, about the consistency of motor oil.'],
     ['Odour', 'None.'],
     ['Where it stays', 'On surfaces, clothing, door handles, seats. It does not blow away.'],
     ['First signs', 'Local sweating and muscle twitching at the contact point, before anything else.'],
     ['Then', 'The full nerve agent picture, but delayed, which makes the source hard to connect to the casualty.'],
     ['Route that matters most', 'Skin. A respirator alone is not enough; gloves and covered skin matter here.']],
    'Localised sweating and twitching on one patch of skin, with no smell and no vapour cloud, is close to diagnostic. Because onset can be delayed by hours, anyone who may have touched a contaminated surface needs decontamination and observation even if they feel well.',
    { evac: 'Away from the contaminated surface or object, upwind. VX barely evaporates, so there is little vapour cloud to flee: the hazard is what you touched, so getting it off skin beats putting distance between you and the scene.',
      filter: 'CBRN combined filter for vapour, but a mask alone is NOT enough against VX: it is a contact agent, so butyl gloves and fully covered skin are what protect you.',
      treat: 'Blot the oily liquid off at once without wiping it wider, then strip and wash the area with soap and copious lukewarm water. Atropine + oxime + diazepam by auto-injector. Because onset can be delayed by hours, decontaminate and observe anyone who may have touched a contaminated surface even if they feel well.' });

  agent('nerve', 'Novichok class', 'A-series', 'Persistent nerve agents, often solid or thickened',
    [['Onset', 60, 'none', 'minutes to hours'],
     ['Persistence', 720, 'none', 'hours, extremely persistent'],
     ['Volatility', 0, 'none', 'very low']],
    [['Appearance', 'Reported as liquids, thickened gels or fine powders.'],
     ['Odour', 'None reported.'],
     ['Where it is met', 'Applied to objects a specific person will touch: handles, controls, personal items, clothing.'],
     ['First signs', 'As other nerve agents, commonly with delayed onset and prolonged illness.'],
     ['What is different', 'Extremely persistent, so contaminated objects stay dangerous long after the event and secondary casualties are common.'],
     ['Practical meaning', 'Treat the scene, the clothing and the vehicle as hazardous, not just the casualty.']],
    'The pattern of use in known cases is targeted contamination of a single person\'s belongings, which means the first responders and the family are the ones most likely to be hurt second. Bag everything, touch nothing bare-handed, and tell the receiving hospital what you suspect before you arrive.',
    { evac: 'Away from the contaminated item, upwind. These are extremely persistent and often solids or thickened liquids, so contaminated objects stay dangerous for weeks: the scene, clothing and vehicle are the hazard, not a passing cloud.',
      filter: 'CBRN combined filter plus full skin cover and butyl gloves. A particle mask is useless; a vapour mask alone does not stop a contact agent.',
      treat: 'Strip and wash exhaustively with soap and water, bag everything. Atropine + oxime + diazepam by auto-injector, high and repeated doses, expecting prolonged illness. Warn the hospital before arrival so responders are not contaminated second.' });

  /* ── blister agents ───────────────────────────────────────────────── */

  agent('blister', 'Sulfur mustard', 'HD', 'Vesicant, injury is delayed',
    [['Onset of symptoms', 4, 'none', 'hours, typically 2 to 24'],
     ['Window for effective decontamination', 2, 'none', 'minutes'],
     ['Persistence, temperate', 72, 'none', 'hours, days in cold or on porous surfaces'],
     ['Mortality', 3, 'none', '% of casualties, but most are incapacitated for weeks']],
    [['Appearance', 'Oily liquid, colourless to yellow-brown.'],
     ['Odour', 'Garlic, horseradish or mustard. Sometimes noticed, never to be relied on.'],
     ['First signs', 'Often nothing at all. This is the trap.'],
     ['Hours later', 'Redness, then blisters, on warm moist skin first: armpits, groin, neck. Eyes stream and swell shut. Airway burns.'],
     ['Why the delay matters', 'The chemistry that injures the cell happens in the first minutes; the blister appears hours afterwards. Decontamination after symptoms appear does not undo the damage.'],
     ['Route that matters most', 'Skin and eyes, with the airway close behind.']],
    'There is no antidote for mustard. The only thing that changes the outcome is getting it off the skin within roughly two minutes, before symptoms give any reason to act. That is why a team working in a suspected environment decontaminates on suspicion rather than on evidence.',
    { evac: 'Upwind. Mustard is an oily, fairly persistent liquid rather than a fast cloud, so getting off the contaminated ground and out of contact with droplets matters more than height.',
      filter: 'CBRN combined filter protects the airway and eyes, but mustard injures skin directly, so full skin cover and gloves are essential. A particulate mask gives no protection.',
      treat: 'There is no antidote. The only thing that changes the outcome is removing it from skin within about two minutes, before any symptom appears: strip, blot, wash with soap and copious water, irrigate the eyes for 10-15 minutes. After that, treat blisters like burns, keep them clean, and manage the airway; decontaminate on suspicion, not on symptoms.' });

  agent('blister', 'Lewisite', 'L', 'Vesicant, pain is immediate',
    [['Onset of pain', 1, 'none', 'seconds to a minute'],
     ['Onset of blisters', 3, 'none', 'hours'],
     ['Persistence, temperate', 24, 'none', 'hours']],
    [['Appearance', 'Oily liquid, colourless to dark brown.'],
     ['Odour', 'Geranium.'],
     ['First signs', 'Immediate stinging pain on contact, which mustard does not cause.'],
     ['Then', 'Grey patch of dead skin, blistering, and with large exposure low blood pressure from fluid loss ("lewisite shock").'],
     ['What is different', 'It hurts at once, so people move away from it and decontaminate early, which is why it causes fewer deep injuries than mustard.'],
     ['Antidote', 'Dimercaprol (British Anti-Lewisite) exists, unlike for mustard.']],
    'Immediate pain plus a geranium smell separates lewisite from mustard in the first seconds, and that distinction is worth making because lewisite has a specific antidote and mustard has none.',
    { evac: 'Upwind, off the contaminated ground. Like mustard it is a persistent liquid, so contact matters more than height.',
      filter: 'CBRN combined filter plus full skin cover and gloves.',
      treat: 'Strip, blot and wash with soap and water at once, irrigate the eyes. Unlike mustard there IS an antidote: dimercaprol (British Anti-Lewisite), a clinical injection; ask for it by name. Immediate pain makes people decontaminate early, which limits injury.' });

  /* ── blood agents ─────────────────────────────────────────────────── */

  agent('blood', 'Hydrogen cyanide', 'AC', 'Blood agent, very fast, not persistent',
    [['Onset', 15, 'none', 'seconds at high concentration'],
     ['Persistence', 0.2, 'none', 'hours, it disperses quickly'],
     ['Vapour density vs air', 0.94, 'none', 'lighter than air, it rises']],
    [['Appearance', 'Colourless gas or volatile liquid.'],
     ['Odour', 'Bitter almonds, but roughly half of all people are genetically unable to smell it at all.'],
     ['Where it goes', 'Rises and disperses. Confined spaces are the danger; outdoors it thins fast.'],
     ['First signs', 'Gasping, headache, confusion, then sudden collapse and seizure.'],
     ['Telling detail', 'Skin often stays pink and the casualty is NOT blue, because the oxygen is in the blood and the cells cannot use it.'],
     ['Course', 'Either rapidly fatal or, with prompt care, rapidly recovered. There is little in between.']],
    'A collapsed casualty who is pink rather than blue, in a confined space, with others affected, points at cyanide. Fire smoke is by far the most common real-world source of cyanide poisoning, so this picture belongs in any structure fire as much as in an attack.',
    { evac: 'Out of the confined space into open air. Hydrogen cyanide is slightly LIGHTER than air and disperses fast outdoors, so unlike most agents the danger is the enclosed room, not the low ground: get out and it thins around you.',
      filter: 'CBRN combined filter (the B / grey layer covers cyanide). At high concentration or where oxygen may be low, only supplied-air breathing apparatus is safe, not a filter.',
      treat: 'Fresh air and high-flow oxygen immediately; support breathing. The specific antidote is hydroxocobalamin (a clinical injection), or a cyanide-antidote kit: call for it by name. Recovery or death is fast, so oxygen and airway in the first minutes are what count.' });

  agent('blood', 'Cyanogen chloride', 'CK', 'Blood agent with irritant effects',
    [['Onset', 30, 'none', 'seconds'],
     ['Persistence', 0.3, 'none', 'hours']],
    [['Appearance', 'Colourless gas.'],
     ['Odour', 'Sharp, pungent, immediately irritating.'],
     ['First signs', 'Streaming eyes and burning airway, then the cyanide picture.'],
     ['What is different', 'Unlike hydrogen cyanide it warns you by irritating, and it also injures the lungs like a choking agent.'],
     ['Course', 'Can cause delayed pulmonary oedema hours after the cyanide effects have been treated.']],
    'Treat the cyanide first because it kills first, then watch the lungs for the next day the way you would after phosgene.',
    { evac: 'Out of the confined space and upwind. It disperses in open air.',
      filter: 'CBRN combined filter (B layer for cyanide, plus the irritant/choking cover). Supplied air if the concentration is high or oxygen is uncertain.',
      treat: 'Fresh air and oxygen, cyanide antidote (hydroxocobalamin) as for hydrogen cyanide because the cyanide kills first. Then, because it also burns the lungs, keep the casualty at rest and watch for delayed fluid on the lungs over the next 24-48 hours, as with phosgene.' });

  /* ── choking agents ───────────────────────────────────────────────── */

  agent('choking', 'Chlorine', 'CL', 'Pulmonary irritant, industrially common',
    [['Onset', 60, 'none', 'seconds'],
     ['Persistence', 1, 'none', 'hours in open air'],
     ['Vapour density vs air', 2.47, 'none', 'sinks: it fills low ground']],
    [['Appearance', 'Green-yellow gas, usually visible as a low-lying cloud.'],
     ['Odour', 'Bleach or swimming pool. Recognised by almost everyone.'],
     ['Where it collects', 'Basements, cellars, trenches, underpasses. Going down is going into it.'],
     ['First signs', 'Burning eyes, nose and throat, coughing, chest tightness.'],
     ['Escape direction', 'Upwind and UPHILL. Height is as important as distance.'],
     ['Severe exposure', 'Fluid in the lungs over the following hours.']],
    'The one agent most people can identify unaided, and the one where the instinct to shelter in a basement is exactly wrong. Chlorine is heavier than air: in a chlorine release the upper floors are the refuge and the cellar is the trap.',
    { evac: 'Upwind AND UPHILL. Chlorine is two and a half times heavier than air and fills basements, cellars, trenches and underpasses: go up, never down. Indoors, an upper floor is the refuge.',
      filter: 'CBRN combined filter (the E / yellow layer covers chlorine and acid gases). A particulate mask does nothing.',
      treat: 'Fresh air, rest, and oxygen if available; sit the casualty up. There is no antidote: it is supportive care and watching for fluid on the lungs over the following hours. Do not induce anything; irrigate burning eyes with water.' });

  agent('choking', 'Phosgene', 'CG', 'Pulmonary agent, dangerously delayed',
    [['Onset of serious symptoms', 6, 'none', 'hours, up to 48'],
     ['Persistence', 0.5, 'none', 'hours'],
     ['Vapour density vs air', 3.4, 'none', 'sinks']],
    [['Appearance', 'Colourless gas, or a white cloud at high concentration.'],
     ['Odour', 'Freshly cut hay or grass. Pleasant, which is part of the danger.'],
     ['Immediately', 'Mild irritation, or nothing. People often feel well and walk away.'],
     ['Hours later', 'Fluid floods the lungs. Breathlessness, frothy sputum, and death without intensive care.'],
     ['What makes it worse', 'Physical exertion after exposure sharply increases the risk of severe oedema.'],
     ['Practical meaning', 'Anyone exposed rests, is carried rather than walks, and is observed for 24 to 48 hours even if they feel fine.']],
    'Killed more people than any other agent in the First World War, largely because of the delay: casualties felt well, kept working, and died that night. The rule that follows from it has not changed. Exposure means rest and observation, not reassurance.',
    { evac: 'Upwind and uphill; it is heavier than air. Then CARRY the casualty, do not let them walk: exertion after exposure sharply worsens the lung injury.',
      filter: 'CBRN combined filter (E/K and the choking-agent cover). Particulate masks are useless.',
      treat: 'No antidote. Absolute rest, carried not walking, kept warm, oxygen if available, and observation for 24-48 hours because the lungs flood hours later even in someone who feels fine. Any breathlessness developing is a hospital emergency.' });

  /* ── riot control and incapacitants ───────────────────────────────── */

  agent('riot', 'CS gas', 'CS', 'Riot control agent, the common one',
    [['Onset', 20, 'none', 'seconds'],
     ['Duration after fresh air', 20, 'none', 'minutes'],
     ['Deaths', 0, 'none', 'rare, and usually from the confined space, not the agent']],
    [['Appearance', 'White cloud from a burning canister, or a fine powder.'],
     ['Odour', 'Peppery, acrid.'],
     ['First signs', 'Eyes slam shut and stream, burning nose and throat, coughing, panic.'],
     ['Recovery', 'Fifteen to thirty minutes in fresh air. Effects are overwhelming but not damaging.'],
     ['Real danger', 'Crowd crush, falls, and use in an enclosed space where the concentration cannot disperse.'],
     ['Aggravates', 'Asthma seriously. An asthmatic casualty is a medical problem, not a nuisance.']],
    'Face into the wind, open the eyes deliberately even though everything says not to, and walk out crosswind. Do not rub: rubbing grinds the particles in. Water helps, air helps more, and oil-based products make it worse by holding the agent against the skin.',
    { evac: 'Crosswind then upwind, into fresh moving air, and OUT of any enclosed space where it cannot disperse. The real danger is crowd crush and confinement, not the agent.',
      filter: 'A particulate (P3) filter or any CBRN mask stops the particles; even a well-sealed dust mask helps. This is one of the few agents where a simple particulate filter is genuinely useful.',
      treat: 'Fresh air is the treatment; recovery is 15-30 minutes and the effects are not damaging. Face the wind, blink the eyes open, do not rub (it grinds particles in), rinse eyes and skin with water. Watch asthmatics closely: for them it can be a real medical emergency.' });

  agent('riot', 'Opioid incapacitant', 'fentanyl class', 'Aerosolised sedative, used once at scale',
    [['Onset', 30, 'none', 'seconds'],
     ['Duration', 2, 'none', 'hours or more'],
     ['Fatality in the one large use', 15, 'none', '% of those exposed']],
    [['Appearance', 'Fine aerosol or vapour, often barely visible.'],
     ['Odour', 'None.'],
     ['First signs', 'Drowsiness, then unconsciousness, with slow shallow breathing and pinpoint pupils.'],
     ['Confusable with', 'Nerve agents, because of the pinpoint pupils. The difference is that these casualties are quiet and dry rather than convulsing and streaming.'],
     ['What kills', 'Respiratory depression, made lethal when unconscious people are left face-down or slumped.'],
     ['Antidote', 'Naloxone, and airway management, which matters just as much.']],
    'The Moscow theatre siege in 2002 is the only large-scale use, and almost all the deaths came from unconscious casualties being left in positions where they could not breathe, not from the dose itself. Recovery position and an open airway are worth more than anything else available on scene.',
    { evac: 'Out of the enclosed space into fresh air. It is an aerosol, so ventilation and distance thin it.',
      filter: 'CBRN combined filter with a particulate layer stops the aerosol, but an unconscious casualty cannot wear one: the priority is getting them into clean air and an open airway.',
      treat: 'This is the one chemical casualty a bystander can genuinely save: put the unconscious casualty in the recovery position and hold the airway open, because most deaths are from slumped, face-down people who cannot breathe, not the dose. The antidote is naloxone, repeated, plus rescue breaths; ask for it by name.' });

  /* ── warning signs ────────────────────────────────────────────────── */

  C.add({
    cat: 'chem', sub: 'warn', ord: 1, n: 'Reading a chemical incident', d: 'What tells you before anyone announces it',
    table: {
      plain: true, cols: ['What you notice', 'What it suggests'],
      rows: [
        ['Several people collapse in the same place, no injuries', 'Chemical or oxygen displacement. Do not enter. This is the single most reliable indicator there is.'],
        ['Casualties with pinpoint pupils and wet faces', 'Nerve agent. Streaming nose, drooling, twitching.'],
        ['Casualties unconscious, quiet, breathing slowly, pinpoint pupils', 'Opioid incapacitant rather than nerve agent.'],
        ['Pink casualty, collapsed, not blue', 'Cyanide.'],
        ['Low green-yellow cloud, bleach smell', 'Chlorine. Go up and upwind.'],
        ['Smell of cut hay, people feeling fine', 'Phosgene. The casualties will appear hours from now.'],
        ['Garlic or horseradish smell, nobody hurt yet', 'Mustard. Decontaminate now, symptoms come later.'],
        ['Geranium smell with immediate stinging', 'Lewisite.'],
        ['Dead birds, insects, animals in an area', 'Something is in the air that has not reached you yet.'],
        ['Oily droplets or film on surfaces or vehicles', 'Persistent agent. Do not touch anything bare-handed.'],
        ['Unexplained mist, fog or vapour without a fire', 'Treat as chemical until shown otherwise.'],
        ['A dispersal device, sprayer or abandoned cylinder', 'Move upwind and report the location. Do not approach.']
      ]
    },
    note: 'The one rule that saves rescuers: casualties down with no visible cause means the cause is still there. Chemical incidents kill people who ran in to help more reliably than they kill the people they were meant to hurt. Distance and upwind first, help second, and always from outside the hazard.'
  });

  C.add({
    cat: 'chem', sub: 'warn', ord: 2, n: 'Which way to move', d: 'Wind, height and the properties that decide it',
    table: {
      plain: true, cols: ['Situation', 'Direction'],
      rows: [
        ['Any release, first instinct', 'Upwind. Get the wind on your face and keep it there.'],
        ['Heavy agent: chlorine, sarin vapour, phosgene', 'Upwind AND uphill. Never into a basement or underpass.'],
        ['Light agent: hydrogen cyanide', 'Out of the confined space. Outdoors it thins quickly.'],
        ['Indoors, release outside', 'Stay in, close windows, stop ventilation and air conditioning, go to an inner room high in the building.'],
        ['Indoors, release inside', 'Get out, upwind, and do not use the lift.'],
        ['In a vehicle', 'Close the vents, switch to recirculate, drive crosswind out of the plume, not along it.'],
        ['Unknown agent, unknown source', 'Crosswind until you can tell where it is coming from, then upwind.']
      ]
    },
    note: 'A plume is long and narrow, so crosswind takes you out of it far faster than running away from the source down its length. Distance helps, but direction helps more, and height helps in ways distance cannot when the agent is heavier than air.'
  });

  /* ── protection and decontamination ───────────────────────────────── */

  C.add({
    cat: 'chem', sub: 'protect', ord: 1, n: 'Protection: what actually works', d: 'Respirator, skin, and the limits of improvisation',
    table: {
      cols: ['Measure', 'How much it protects'],
      rows: [
        ['Proper respirator with a CBRN filter', 'Stops the inhalation hazard: fully effective against vapour'],
        ['Escape hood, correctly sealed', 'Strong reduction, for the minutes needed to get out'],
        ['Sealed room, ventilation off, high floor', 'Good against an outside release, for a limited time'],
        ['N95 or surgical mask', 'No useful protection against vapour: filters particles only'],
        ['Wet cloth over the face', 'No protection against nerve or blister vapour: concealment only'],
        ['Ordinary clothing', 'Poor: delays skin contact by minutes, absorbs and holds liquid agent'],
        ['Rubber or butyl gloves, covered skin', 'Absorbs a contact hazard: the answer to VX and mustard'],
        ['Beard under a respirator seal', 'Defeats the seal: no protection'],
        ['Facing upwind and moving crosswind', 'Excellent, immediately, and available to everyone']
      ]
    },
    note: 'A respirator only works if it seals, which is why facial hair and a poor fit undo it completely. Nothing improvised filters nerve agent vapour: a wet cloth is a comfort, not a protection. When no proper equipment is present, direction and distance are the protection, and they are better than most people expect.'
  });

  C.add({
    cat: 'chem', sub: 'protect', ord: 2, n: 'Decontamination: stripping down', d: 'The first two minutes, in order',
    table: {
      plain: true, cols: ['Step', 'Detail'],
      rows: [
        ['1. Get out of it', 'Upwind, out of the plume, away from the liquid. Nothing else works while you are still in it.'],
        ['2. Remove outer clothing', 'This alone removes up to about 90 % of contamination and is the highest-value action available.'],
        ['3. Cut, do not pull', 'Cut clothing off rather than pulling it over the head, which drags agent across the face and eyes.'],
        ['4. Blot, do not wipe', 'Blot visible liquid off skin with absorbent material. Wiping spreads it over a wider area.'],
        ['5. Wash with soap and lukewarm water', 'Copious water. Not hot: heat opens the skin and speeds absorption.'],
        ['6. Eyes for 10 to 15 minutes', 'Plain water or saline, held open, from the inner corner outward. Remove contact lenses.'],
        ['7. Hair without conditioner', 'Conditioner binds particles to hair. Shampoo only.'],
        ['8. Bag everything', 'Clothing, phone, watch, wallet. Double bag, label, hand over. Do not take it home.'],
        ['9. Then medical care', 'Decontaminate before transport where possible, or the ambulance and the hospital are contaminated next.']
      ]
    },
    note: 'For mustard the window is roughly two minutes, which is shorter than any symptom takes to appear, so the decision to decontaminate has to be made on suspicion alone. Dry decontamination, blotting and stripping, is better than nothing and is faster than finding water. Bleach solutions are no longer recommended on skin; soap and plenty of water is the current guidance and it works.'
  });

  /* ── treatment ────────────────────────────────────────────────────── */

  function treat(sub, n, d, rows, note, ord) {
    C.add({ cat: 'chem', sub: sub, n: n, d: d, ord: ord, table: { plain: true, cols: ['Stage', 'Action'], rows: rows }, note: note });
  }

  treat('treat', 'Nerve agent casualty', 'Atropine, oxime, seizure control',
    [['Recognise', 'Pinpoint pupils, streaming nose and mouth, tight chest, twitching, convulsions.'],
     ['Protect yourself first', 'Respirator and gloves. An unprotected rescuer becomes the next casualty within minutes.'],
     ['Remove and decontaminate', 'Out of the vapour, clothing off, skin washed. Liquid agent keeps poisoning until it is removed.'],
     ['Airway', 'Position for drainage: secretions, not paralysis, block the airway first.'],
     ['Atropine', 'Dries secretions and opens the airway. Repeated until the chest is clear and breathing is easier, which is the endpoint, not the pupils.'],
     ['Pralidoxime (2-PAM)', 'Reactivates the enzyme. Must be early to work, and earliest of all with soman.'],
     ['Seizures', 'A benzodiazepine (diazepam or midazolam). Convulsions cause much of the lasting brain injury.'],
     ['Autoinjectors', 'Military and emergency sets combine atropine with an oxime, some with a benzodiazepine.'],
     ['Then', 'Hospital. Effects can rebound hours later as agent absorbed through skin keeps arriving.']],
    'Atropine is titrated against secretions and breathing, not against pupil size: the pupils can stay pinpoint long after the casualty is out of danger, and chasing them leads to overdose. Everything in this list is a prescription medicine and most of it is carried only by military and emergency services. Knowing the names lets you tell a dispatcher what is needed before the ambulance is packed.', 1);

  treat('treat', 'Blister agent casualty', 'No antidote: decontamination is the treatment',
    [['Recognise', 'Garlic or horseradish smell, or geranium with immediate pain. Often no symptoms at first.'],
     ['Decontaminate immediately', 'Within about two minutes for mustard. This is the only action that changes the outcome.'],
     ['Do not wait for symptoms', 'Blisters appear hours later, long after the injury is done.'],
     ['Eyes', 'Irrigate 10 to 15 minutes. Eye injury is the most disabling common result.'],
     ['Blisters', 'Cover, do not deliberately break. Treat as burns: fluid loss and infection are the risks.'],
     ['Airway', 'Any hoarseness or stridor is serious and needs hospital care.'],
     ['Lewisite only', 'Dimercaprol (British Anti-Lewisite) is a specific antidote and is worth naming when calling for help.'],
     ['Mustard', 'No antidote exists. Supportive care, burns management, pain relief.']],
    'The whole of mustard treatment is decontamination done before anyone is convinced it is needed. After that it is burn care, and a casualty may be incapacitated for weeks while rarely being in danger of death.', 3);

  treat('treat', 'Blood agent casualty', 'Cyanide: minutes decide it',
    [['Recognise', 'Sudden collapse, gasping, seizure, skin pink rather than blue, bitter almond smell if you can smell it at all.'],
     ['Get them out', 'Into fresh air. The agent disperses fast, so removal is effective.'],
     ['Oxygen', 'High flow, immediately, and it helps even before any antidote.'],
     ['Hydroxocobalamin', 'The preferred antidote, binds cyanide directly, safe to give when the diagnosis is uncertain.'],
     ['Sodium thiosulfate', 'Given with or instead of it, often alongside a nitrite.'],
     ['Amyl nitrite', 'In older kits, inhaled. Avoid in smoke inhalation, where hydroxocobalamin is the safer choice.'],
     ['Do not', 'Give mouth-to-mouth without a barrier: the rescuer can be exposed.'],
     ['Then', 'Recovery is often rapid and complete once the antidote is in.']],
    'Cyanide is the agent where a correct guess made quickly saves a life outright. Structure fires are the most likely place to meet it, and hydroxocobalamin is carried for exactly that reason.', 2);

  treat('treat', 'Choking agent casualty', 'Rest, oxygen, and 48 hours of suspicion',
    [['Recognise', 'Bleach smell with immediate coughing, or cut hay with almost nothing at all.'],
     ['Remove from exposure', 'Upwind and uphill for chlorine.'],
     ['Absolute rest', 'Exertion after phosgene exposure sharply raises the risk of fatal lung oedema. Carry them.'],
     ['Oxygen', 'And sitting upright if breathing is difficult.'],
     ['Do not reassure and release', 'Phosgene casualties feel well for hours. Observation for 24 to 48 hours is the standard.'],
     ['Watch for', 'Rising breathlessness, frothy or pink sputum, blue lips. That is pulmonary oedema and it needs intensive care.'],
     ['No antidote', 'Treatment is supportive: oxygen, ventilation, and time.']],
    'The mistake this agent class punishes is letting an apparently well casualty walk away. Rest and observation are the treatment, and they have to be imposed before there is any visible reason for them.', 4);

  treat('treat', 'Riot control agent casualty', 'Air, patience, no rubbing',
    [['Move', 'Out of the cloud, into fresh moving air, facing the wind.'],
     ['Do not rub', 'Rubbing grinds particles into skin and eyes and extends the effect.'],
     ['Eyes', 'Open them deliberately and let them stream. Irrigate with plain water.'],
     ['Skin', 'Cool water and soap. Avoid oils, creams and moisturisers, which trap the agent against the skin.'],
     ['Clothing', 'Remove and bag: it keeps releasing agent and re-exposes everyone in the car afterwards.'],
     ['Expect recovery', 'Fifteen to thirty minutes. Reassurance is genuinely part of the treatment.'],
     ['Escalate if', 'Asthma, breathing that does not settle, a child or an elderly casualty, or exposure in a confined space.'],
     ['Real risks', 'Crush injuries, falls and asthma, not the chemical itself.']],
    'Almost everyone recovers fully with nothing but air and time. The exceptions are asthmatics and anyone dosed in an enclosed space, and those two need to be found early in a crowd rather than late.', 5);

  /* ══════════════════════════════════════════════════════════════════════
     RADIOLOGICAL TREATMENT  (rad / treat)
     ══════════════════════════════════════════════════════════════════════ */

  function radRec(n, d, cols, rows, note, specs, ord) {
    C.add({ cat: 'rad', sub: 'treat', n: n, d: d, ord: ord, specs: specs || [], table: { plain: true, cols: cols, rows: rows }, note: note });
  }

  radRec('Immediate actions', 'The first hour, in order',
    ['Step', 'Detail'],
    [['1. Distance', 'Every doubling of distance from a point source quarters the dose rate. Walking away is the fastest protection there is.'],
     ['2. Shielding', 'Get mass between you and the source: concrete, earth, a basement, the centre of a large building.'],
     ['3. Time', 'Dose is rate multiplied by time. Halve the minutes and you halve the dose.'],
     ['4. Get inside, stay inside', 'For fallout this beats evacuation for the first day. The people who die on the road took a dose the building would have stopped.'],
     ['5. Remove outer clothing', 'Takes roughly 90 % of external contamination with it. Bag it, leave it outside the living space.'],
     ['6. Shower', 'Soap and lukewarm water, no scrubbing hard enough to break skin. Shampoo but no conditioner.'],
     ['7. Do not eat or drink anything exposed', 'Sealed and indoor food and water are fine. Uncovered items are not.'],
     ['8. Listen for instructions', 'Whether to shelter or evacuate depends on the plume, which you cannot see and they can.']],
    'Time, distance and shielding, in that order, and they are available to anyone without equipment. Contamination on you is a problem you can fix with clothing and a shower; irradiation from a source nearby is a problem you fix with distance and mass. Confusing the two wastes the minutes that matter.',
    [['Dose rate at twice the distance', 25, 'none', '% of the original'],
     ['Contamination removed by undressing', 90, 'none', '%'],
     ['Sheltering worth reaching', 500, 'dist', 'move in minutes, not kilometres']], 1);

  radRec('Potassium iodide: what it does and does not do', 'Thyroid blocking only',
    ['Question', 'Answer'],
    [['What it protects', 'The thyroid, and nothing else. It saturates the gland so radioactive iodine cannot be taken up.'],
     ['What it does not protect', 'Every other organ, and every other isotope: caesium, strontium, plutonium, cobalt. It is not a radiation antidote.'],
     ['Against external gamma', 'Nothing at all. It cannot shield you.'],
     ['When to take it', 'When public health authorities say so. Most effective from a few hours before exposure to a few hours after.'],
     ['How late is useless', 'After about 24 hours it adds little, because the uptake has already happened.'],
     ['How many doses', 'Usually one. Repeat only if instructed, typically once every 24 hours while exposure continues.'],
     ['Who benefits most', 'Children, infants and pregnant women. Thyroid cancer risk from radioiodine falls sharply with age.'],
     ['Who should be careful', 'Anyone with iodine allergy, thyroid disease or on thyroid medication. Adults over 40 gain little and carry more risk.'],
     ['Not a substitute for', 'Sheltering, evacuation, or avoiding contaminated food and milk, which do far more good.']],
    'Potassium iodide is narrow, specific and genuinely useful in exactly one situation: a release containing radioactive iodine, which means a reactor accident far more than a weapon. It does nothing for a dirty bomb built around caesium, and taking it as a general precaution is a way of feeling protected while remaining exposed. Dose is by age and is set by the health authority issuing it.',
    [['Thyroid protection when timely', 95, 'none', '% reduction in uptake'],
     ['Useful window before exposure', 24, 'none', 'hours'],
     ['Useful window after exposure', 8, 'none', 'hours, falling steeply']], 2);

  radRec('Other internal contamination', 'Agent-specific treatments worth naming',
    ['Contaminant', 'Treatment'],
    [['Radioactive iodine', 'Potassium iodide, thyroid blocking, as above.'],
     ['Caesium-137, thallium', 'Prussian blue. Binds it in the gut so it is excreted rather than recycled.'],
     ['Plutonium, americium, curium', 'DTPA (chelation), given intravenously or inhaled, best within hours.'],
     ['Uranium', 'Sodium bicarbonate to protect the kidneys: the chemical toxicity outruns the radiological.'],
     ['Strontium', 'Calcium or aluminium compounds to reduce absorption.'],
     ['Tritium', 'Fluids. Forced hydration flushes it; it leaves the body in days.'],
     ['Wound contamination', 'Irrigate, treat as a dirty wound, and keep everything removed for measurement.']],
    'All of these are prescription treatments given on the basis of measurement, not suspicion, and several are stockpiled rather than stocked. The field value is being able to tell a receiving hospital which isotope is suspected, because that single word decides which of these is right.', 3);

  radRec('Acute radiation syndrome: field triage', 'Time to vomiting is the usable indicator',
    ['Onset of vomiting', 'What it indicates'],
    [['No vomiting in 24 hours', 'Low dose, under about 1 Sv. Reassure, record, follow up.'],
     ['Vomiting after 4 to 6 hours', 'Roughly 1 to 2 Sv. Survivable, needs monitoring and blood counts.'],
     ['Vomiting within 2 to 4 hours', 'Roughly 2 to 4 Sv. Serious. Hospital, isolation, likely transfusion support.'],
     ['Vomiting within 1 to 2 hours', 'Roughly 4 to 6 Sv. Severe, survival needs intensive treatment.'],
     ['Vomiting within an hour, with diarrhoea', 'Above about 6 Sv. Critical.'],
     ['Immediate vomiting, confusion, collapse', 'Above about 10 Sv. Comfort care in a mass-casualty setting.']],
    'Time from exposure to first vomiting is the one dose indicator available without a laboratory, and it is used precisely because it needs no equipment. It sorts a crowd into who needs a hospital now and who needs a record and a follow-up appointment. The latent period that follows can look like recovery and is not: a casualty who feels well on day three may be in marrow failure by week three.',
    [['Threshold for any acute symptoms', 1, 'none', 'Sv'],
     ['Roughly half die without treatment', 4, 'none', 'Sv'],
     ['Rarely survivable', 8, 'none', 'Sv']], 4);

})();
