/*
 * Artemidos - catalogue: light vehicles, trucks, and more ships
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The catalogue was strong on combat platforms but thin on the vehicles that
 * actually move an army: light utility 4x4s, protected patrol vehicles, and
 * the logistics trucks behind every operation. This pass adds those, plus a
 * batch of ships, across NATO, Russia, China, Brazil and others. Two new
 * subcategories are registered under the military section:
 *   util   - light & utility vehicles (jeeps, protected 4x4s, technicals)
 *   truck  - trucks & logistics (cargo, tanker, recovery, tractor)
 *
 * Only current, in-service types. Open-source planning figures as ever.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var km = function (x) { return x * 1000; };
  var t = function (x) { return x * 1000; };

  var mil = C.catOf('mil');
  function addSub(id, n, icon) {
    if (mil && !C.subOf('mil', id)) {
      var s = { id: id, n: n, icon: icon, parent: 'mil' };
      mil.subs.push(s); mil.subById[id] = s;
    }
  }
  addSub('util', 'Light & utility vehicles', 'car');
  addSub('truck', 'Trucks & logistics', 'car');

  function m(sub, n, country, d, speeds, specs, arms, note) {
    C.add({
      cat: 'mil', sub: sub, n: n, d: (country ? country + ' · ' : '') + d,
      country: country, speeds: speeds, specs: specs, arms: arms, note: note
    });
  }

  /* ── light & utility vehicles ─────────────────────────────────────── */

  m('util', 'Peugeot P4', 'France', 'Light utility 4x4',
    [['Road', kmh(108)]],
    [['Range', km(800), 'dist'], ['Weight', t(2), 'mass'], ['Payload', 800, 'mass'], ['Seats', 4, 'none']],
    [{ n: 'Optional 7.62 mm pintle mount', eff: 800, max: 3750, mv: 850 }],
    'The French Army\'s licence-built Mercedes G-class, the workhorse liaison and reconnaissance jeep being replaced by the VT4.');

  m('util', 'Panhard PVP', 'France', 'Small protected patrol vehicle',
    [['Road', kmh(110)]],
    [['Range', km(600), 'dist'], ['Combat weight', t(4.6), 'mass'], ['Crew', 2, 'none'], ['Passengers', 3, 'none']],
    [{ n: 'Roof ring, 7.62 mm', eff: 800, max: 3750, mv: 850 }],
    'The Petit Véhicule Protégé: a compact armoured 4x4 for liaison, command and patrol, protected against small arms and mine fragments, smaller and lighter than the VBL.');

  m('util', 'Panhard VBL', 'France', 'Light armoured reconnaissance 4x4',
    [['Road', kmh(95)], ['Swim', kmh(5.4)]],
    [['Range', km(600), 'dist'], ['Combat weight', t(3.5), 'mass'], ['Crew', 3, 'none']],
    [{ n: '7.62 mm or 12.7 mm', eff: 1830, max: 6800, mv: 890 },
     { n: 'Milan / MMP ATGM option', eff: 4000, max: 4000, mv: 250 }],
    'Amphibious, armoured against small arms and shell splinters, small enough to hide: the French scout car, widely exported.');

  m('util', 'Iveco LMV Lince (VTLM)', 'Italy', 'Light multirole armoured vehicle',
    [['Road', kmh(130)]],
    [['Range', km(500), 'dist'], ['Combat weight', t(7.1), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'Remote 7.62 mm or 12.7 mm', eff: 1830, max: 6800, mv: 890 }],
    'A protected 4x4 in service across NATO (Italy, UK Panther, others), with a V-hull and add-on armour against mines and IEDs.');

  m('util', 'GAZ Tigr', 'Russia', 'Protected utility 4x4',
    [['Road', kmh(140)]],
    [['Range', km(1000), 'dist'], ['Combat weight', t(7.5), 'mass'], ['Crew', 2, 'none'], ['Passengers', 7, 'none']],
    [{ n: 'Remote weapon station, 7.62 / 12.7 mm or 30 mm AGL', eff: 1830, max: 6800, mv: 890 }],
    'Russia\'s Humvee-equivalent, from soft-top scout to the armoured Tigr-M, and a common carrier for the Kornet ATGM.');

  m('util', 'Dongfeng Mengshi CSK131', 'China', 'Protected utility 4x4',
    [['Road', kmh(135)]],
    [['Range', km(600), 'dist'], ['Combat weight', t(7.5), 'mass'], ['Crew', 2, 'none'], ['Passengers', 7, 'none']],
    [{ n: 'Roof weapon station, 12.7 mm or 35 mm AGL', eff: 1830, max: 6800, mv: 890 }],
    'The PLA\'s standard armoured light 4x4, also seen as an ATGM and air-defence carrier.');

  m('util', 'URO VAMTAC ST5', 'Spain', 'High-mobility tactical 4x4',
    [['Road', kmh(135)]],
    [['Range', km(600), 'dist'], ['Combat weight', t(6.5), 'mass'], ['Crew', 2, 'none'], ['Passengers', 8, 'none']],
    [{ n: 'Weapon station, 7.62 / 12.7 mm or AGL', eff: 1830, max: 6800, mv: 890 }],
    'Spain\'s HMMWV-class vehicle, widely exported, carrying everything from radios to Mistral and Spike launchers.');

  m('util', 'Supacat Jackal 2', 'United Kingdom', 'High-mobility weapons platform',
    [['Road', kmh(130)], ['Cross-country', kmh(80)]],
    [['Range', km(800), 'dist'], ['Combat weight', t(7), 'mass'], ['Crew', 3, 'none']],
    [{ n: '12.7 mm heavy machine gun or 40 mm AGL', eff: 1830, max: 6800, mv: 890 },
     { n: '7.62 mm GPMG', eff: 1100, max: 3750, mv: 838 }],
    'An open-topped deep-battlespace raider built for range and firepower over protection, on an air-bag suspension for very rough ground.');

  m('util', 'Agrale Marruá AM', 'Brazil', 'Light utility 4x4',
    [['Road', kmh(110)]],
    [['Range', km(700), 'dist'], ['Weight', t(2.6), 'mass'], ['Payload', t(1.5), 'mass'], ['Seats', 4, 'none']],
    [{ n: 'Optional 7.62 / 12.7 mm mount', eff: 1830, max: 6800, mv: 890 }],
    'The Brazilian Army\'s standard light 4x4, from a troop carrier to an ambulance and a light missile carrier.');

  m('util', 'HMMWV M998 (soft-top)', 'United States', 'Light utility 4x4',
    [['Road', kmh(113)]],
    [['Range', km(560), 'dist'], ['Weight', t(2.3), 'mass'], ['Payload', t(1.1), 'mass'], ['Seats', 4, 'none']],
    [{ n: 'Optional roof ring, 7.62 / 12.7 mm or 40 mm AGL', eff: 1830, max: 6800, mv: 890 }],
    'The unarmoured Humvee: cargo, troop and weapons-carrier variants, the US Army’s universal light vehicle for thirty years and exported to dozens of armies; the armoured M1114/M1151 are held under armoured vehicles.');

  m('util', 'Polaris MRZR / DAGOR', 'United States', 'Ultralight tactical vehicle',
    [['Road', kmh(96)]],
    [['Range', km(560), 'dist'], ['Weight', t(0.9), 'mass'], ['Seats', 4, 'none', '2-9 variants']],
    [{ n: 'Light pintle mount, 7.62 mm optional', eff: 800, max: 3750, mv: 850 }],
    'Air-droppable, helicopter-internal buggies for airborne and special forces, carried inside a V-22 or slung under a helicopter; used by US and allied light infantry.');

  m('util', 'M1161 Growler ITV', 'United States', 'Internally transportable vehicle',
    [['Road', kmh(103)]],
    [['Range', km(480), 'dist'], ['Weight', t(1.6), 'mass'], ['Seats', 2, 'none']],
    null,
    'The US Marine Corps light prime mover, small enough to ride inside an MV-22 Osprey and tow the 120 mm EFSS mortar.');

  m('util', 'Land Rover Wolf / Snatch', 'United Kingdom', 'Light utility / patrol 4x4',
    [['Road', kmh(120)]],
    [['Range', km(560), 'dist'], ['Weight', t(3.05), 'mass'], ['Seats', 4, 'none']],
    [{ n: 'Optional 7.62 mm pintle', eff: 800, max: 3750, mv: 850 }],
    'The British Army’s long-serving Defender-based utility (Wolf) and its lightly armoured Snatch patrol variant, being replaced by the Foxhound and MRAP-class vehicles.');

  m('util', 'Mercedes-Benz G-Class (Wolf / G-Wagen)', 'Germany', 'Light utility 4x4',
    [['Road', kmh(150)]],
    [['Range', km(650), 'dist'], ['Weight', t(2.7), 'mass'], ['Seats', 4, 'none']],
    [{ n: 'Optional 7.62 mm ring mount', eff: 800, max: 3750, mv: 850 }],
    'The military G-Wagen, in service across NATO (German Wolf, others) and beyond as the standard European light 4x4, in dozens of body styles.');

  m('util', 'UAZ-469 / UAZ Hunter', 'Russia', 'Light utility 4x4',
    [['Road', kmh(100)]],
    [['Range', km(650), 'dist'], ['Weight', t(1.7), 'mass'], ['Seats', 7, 'none']],
    null,
    'The Soviet and Russian jeep, in service since 1972 across the former USSR, the Warsaw Pact and their export customers, and the mechanical cousin of the armed technicals seen everywhere.');

  m('util', 'Toyota Land Cruiser (technical)', 'Various', 'Improvised armed pickup',
    [['Road', kmh(150)]],
    [['Range', km(800), 'dist'], ['Weight', t(2.5), 'mass'], ['Payload', t(1), 'mass']],
    [{ n: 'Bed-mounted heavy machine gun, recoilless rifle or rocket pod', eff: 2000, max: 6800, mv: 890 }],
    'Not a military vehicle at all, and the most consequential ground weapon of a generation of irregular wars: cheap, reliable, everywhere, and impossible to tell from a civilian truck until it fires.');

  /* ── trucks & logistics ───────────────────────────────────────────── */

  m('truck', 'Renault GBC 180', 'France', 'Medium cargo truck 6x6',
    [['Road', kmh(85)]],
    [['Range', km(600), 'dist'], ['Payload', t(4), 'mass'], ['Gross weight', t(13), 'mass']],
    null,
    'The long-serving French 6x6 medium truck, re-engined and kept in service as the GBC 180 while the army fields newer fleets.');

  m('truck', 'Renault TRM 2000', 'France', 'Light tactical truck 4x4',
    [['Road', kmh(90)]],
    [['Range', km(600), 'dist'], ['Payload', t(2.5), 'mass']],
    null,
    'The 2-tonne 4x4 workhorse: cargo body, shelter carrier, light recovery, and the base for many specialist bodies.');

  m('truck', 'Renault TRM 10000', 'France', 'Heavy tactical truck 6x6',
    [['Road', kmh(85)]],
    [['Range', km(630), 'dist'], ['Payload', t(10), 'mass'], ['Gross weight', t(26), 'mass']],
    null,
    'The heavy end of the French tactical fleet: 10-tonne cargo, tanker and equipment transport across all terrain.');

  m('truck', 'Oshkosh HEMTT A4', 'United States', 'Heavy expanded-mobility tactical truck 8x8',
    [['Road', kmh(100)]],
    [['Range', km(480), 'dist'], ['Payload', t(11), 'mass'], ['Gross weight', t(30), 'mass']],
    null,
    'The US Army\'s heavy 8x8 in many bodies: cargo, fuel tanker, wrecker, and the load-handling PLS that swaps flatracks in minutes. The HIMARS and Patriot also ride on this family.');

  m('truck', 'FMTV (M1078 / M1083)', 'United States', 'Family of medium tactical vehicles',
    [['Road', kmh(94)]],
    [['Range', km(640), 'dist'], ['Payload, LMTV', t(2.5), 'mass'], ['Payload, MTV', t(5), 'mass']],
    null,
    'The backbone medium fleet, from the 2.5-tonne LMTV to the 5-tonne MTV, in dozens of cargo, van, dump and weapon-carrier bodies.');

  m('truck', 'Oshkosh MTVR', 'United States', 'Medium tactical vehicle replacement 6x6',
    [['Road', kmh(105)]],
    [['Range', km(480), 'dist'], ['Payload, off-road', t(7.1), 'mass']],
    null,
    'The US Marine Corps medium truck, built for very high off-road payload and independent suspension on rough ground.');

  m('truck', 'Ural-4320', 'Russia', 'Medium cargo truck 6x6',
    [['Road', kmh(85)]],
    [['Range', km(1000), 'dist'], ['Payload', t(6), 'mass']],
    null,
    'The ubiquitous Soviet and Russian 6x6, carrier for the BM-21 Grad and countless cargo and shelter bodies. Simple, rugged, everywhere.');

  m('truck', 'KamAZ-5350 Mustang', 'Russia', 'Medium tactical truck 6x6',
    [['Road', kmh(100)]],
    [['Range', km(1000), 'dist'], ['Payload', t(6), 'mass']],
    null,
    'The modern Russian medium fleet replacing the Ural in the cargo, tanker and weapon-carrier roles.');

  m('truck', 'KrAZ-6322', 'Ukraine', 'Heavy cargo truck 6x6',
    [['Road', kmh(80)]],
    [['Range', km(1200), 'dist'], ['Payload', t(12), 'mass']],
    null,
    'A heavy Ukrainian 6x6 used for cargo, artillery towing and as a base for wheeled howitzers and MRAP hulls.');

  m('truck', 'MAN HX / SX', 'Germany / United Kingdom', 'Family of military trucks',
    [['Road', kmh(88)]],
    [['Range', km(800), 'dist'], ['Payload', t(9), 'mass', 'HX, up to 15 t on SX']],
    null,
    'The German-designed high-mobility fleet adopted across Europe (UK MAN SV among them) for cargo, recovery and equipment transport.');

  m('truck', 'Tatra 815 / T-815-7', 'Czechia', 'Heavy off-road truck',
    [['Road', kmh(90)]],
    [['Range', km(1000), 'dist'], ['Payload', t(15), 'mass']],
    null,
    'The distinctive Tatra central-tube chassis with independently swinging axles gives exceptional cross-country mobility; a base for artillery and MRAPs.');

  m('truck', 'Shaanxi / Dongfeng military truck', 'China', 'Family of tactical trucks 6x6',
    [['Road', kmh(90)]],
    [['Range', km(1000), 'dist'], ['Payload', t(8), 'mass']],
    null,
    'The PLA\'s standard medium and heavy tactical trucks, carriers for logistics and for rocket and air-defence systems.');

  /* ── Brazilian and other armour ───────────────────────────────────── */

  m('afv', 'VBTP-MR Guarani', 'Brazil', 'Wheeled armoured personnel carrier, 6x6',
    [['Road', kmh(110)], ['Swim', kmh(9)]],
    [['Range', km(600), 'dist'], ['Combat weight', t(18.7), 'mass'], ['Crew', 2, 'none'], ['Dismounts', 9, 'none']],
    [{ n: 'Remote turret, 12.7 mm or 30 mm', eff: 3000, max: 4000, mv: 960 }],
    'The Brazilian Army\'s new amphibious 6x6, replacing the old Urutu and built in large numbers with the region\'s rivers in mind.');

  m('afv', 'EE-9 Cascavel', 'Brazil', 'Wheeled reconnaissance vehicle, 6x6',
    [['Road', kmh(100)]],
    [['Range', km(880), 'dist'], ['Combat weight', t(13.4), 'mass'], ['Crew', 3, 'none']],
    [{ n: '90 mm gun', eff: 2000, max: 4000, mv: 700 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }],
    'A widely exported Engesa armoured car with a 90 mm gun; decades old but still in service across South America, Africa and the Middle East.');

  /* ── artillery: Brazilian rocket system ───────────────────────────── */

  m('arty', 'ASTROS II', 'Brazil', 'Multiple-launch rocket system',
    [['Road', kmh(90)]],
    [['Range, SS-30', km(30), 'dist'], ['Range, SS-40', km(35), 'dist'], ['Range, SS-80', km(90), 'dist'],
     ['Range, AV-TM 300 cruise missile', km(300), 'dist'], ['Crew', 4, 'none']],
    [{ n: 'Modular rocket pods, 127-450 mm', eff: 90000, max: 90000, mv: 900, note: 'One launcher fires different calibres by swapping the pod; the AV-TM 300 adds a guided cruise missile.' }],
    'A wheeled, modular rocket artillery family exported across the Middle East and Asia, now carrying a 300 km cruise missile in the same launcher.');

  /* ── more ships ───────────────────────────────────────────────────── */

  m('navy', 'Ticonderoga-class cruiser', 'United States', 'Guided-missile cruiser',
    [['Maximum', kmh(60)]],
    [['Displacement', t(9800), 'mass'], ['Crew', 330, 'none'], ['VLS cells', 122, 'none']],
    [{ n: 'Mk 41 VLS: SM-2/6, ESSM, Tomahawk', eff: 370000, max: 1600000, mv: 1020 },
     { n: '2 x 127 mm gun', eff: 23000, max: 37000, mv: 808 },
     { n: 'Phalanx CIWS', eff: 3600, max: 3600, mv: 1100 }],
    'The Aegis cruiser, the high-end air-defence escort of a carrier group. Ageing and being drawn down, but still the most heavily armed surface combatant the US fields.');

  m('navy', 'San Antonio-class LPD', 'United States', 'Amphibious transport dock',
    [['Maximum', kmh(41)]],
    [['Displacement', t(25000), 'mass'], ['Crew', 360, 'none'], ['Troops', 700, 'none']],
    [{ n: 'RAM and 30 mm guns for self-defence', eff: 9000, max: 9000, mv: 800 }],
    'Carries a Marine landing force with its landing craft, amphibious vehicles and helicopters, and increasingly a hull for other roles.');

  m('navy', 'Type 075 LHD', 'China', 'Amphibious assault ship',
    [['Maximum', kmh(43)]],
    [['Displacement', t(40000), 'mass'], ['Crew', 1200, 'none'], ['Helicopters', 30, 'none']],
    [{ n: 'HHQ-10 and 30 mm CIWS', eff: 9000, max: 9000, mv: 800 }],
    'A large helicopter carrier and landing platform, central to China\'s amphibious and power-projection ambitions.');

  m('navy', 'Type 093 Shang-class SSN', 'China', 'Nuclear attack submarine',
    [['Submerged', kmh(56)]],
    [['Displacement, submerged', t(7000), 'mass'], ['Crew', 100, 'none'], ['Test depth', 400, 'alt']],
    [{ n: 'YJ-18 anti-ship and torpedoes', eff: 540000, max: 540000, mv: 1000 }],
    'China\'s frontline nuclear attack boat, quieter with each variant and the shadow behind its carrier and missile forces.');

  m('navy', 'Type 26 / City-class frigate', 'United Kingdom', 'Anti-submarine frigate',
    [['Maximum', kmh(48)]],
    [['Displacement', t(6900), 'mass'], ['Crew', 157, 'none'], ['Range', km(13890), 'dist']],
    [{ n: 'Mk 41 VLS + Sea Ceptor', eff: 25000, max: 25000, mv: 1020 },
     { n: '127 mm gun', eff: 23000, max: 37000, mv: 808 }],
    'A quiet anti-submarine frigate designed around a flexible mission bay, also building for Australia (Hunter) and Canada.');

  m('navy', 'Admiral Grigorovich-class frigate', 'Russia', 'Guided-missile frigate',
    [['Maximum', kmh(56)]],
    [['Displacement', t(4000), 'mass'], ['Crew', 200, 'none']],
    [{ n: 'Kalibr / Oniks in VLS', eff: 375000, max: 2500000, mv: 850 },
     { n: 'Shtil SAM, 100 mm gun', eff: 50000, max: 50000, mv: 900 }],
    'A Black Sea Fleet frigate and a mobile launcher for the Kalibr land-attack cruise missile.');

  m('navy', 'Steregushchiy-class corvette', 'Russia', 'Multirole corvette',
    [['Maximum', kmh(50)]],
    [['Displacement', t(2200), 'mass'], ['Crew', 100, 'none']],
    [{ n: 'Kalibr / Uran, Redut SAM, 100 mm gun', eff: 260000, max: 2500000, mv: 850 }],
    'A modern littoral combatant heavily armed for its size, a pattern across Russia\'s newer surface fleet.');

  m('navy', 'Tamandaré-class frigate', 'Brazil', 'Guided-missile frigate',
    [['Maximum', kmh(52)]],
    [['Displacement', t(3500), 'mass'], ['Crew', 136, 'none']],
    [{ n: 'MANSUP anti-ship, ESSM, 76 mm gun', eff: 200000, max: 200000, mv: 900 }],
    'Brazil\'s new MEKO-based frigate class, the core of its surface-fleet modernisation and built with domestic industry.');

  m('navy', 'Riachuelo-class (Scorpène) SSK', 'Brazil / France', 'Diesel-electric attack submarine',
    [['Submerged', kmh(37)]],
    [['Displacement, submerged', t(2000), 'mass'], ['Crew', 35, 'none'], ['Test depth', 300, 'alt']],
    [{ n: 'Heavyweight torpedoes and anti-ship missiles', eff: 50000, max: 50000, mv: 1000 }],
    'The Scorpène design built in Brazil, part of a programme whose ultimate goal is a nationally built nuclear boat.');

})();
