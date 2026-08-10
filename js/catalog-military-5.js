/*
 * Artemidos - catalogue: military support, engineering and command vehicles
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The fighting vehicles are only the front of an army. Behind them is the far
 * larger fleet that lets them fight: command posts, radar, engineer plant,
 * bridging, recovery, signals and power. A protection or recognition task
 * meets these on the road as often as it meets a tank, and they are the ones
 * a vehicle-recognition chart usually leaves out, so they are gathered here.
 *
 * Sources for figures and identification are the manufacturers and the
 * open references the owner supplied (Army Recognition, Military Factory,
 * inetres.com), cross-checked against Wikipedia for the service dates.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var km = function (x) { return x * 1000; };
  var t = function (x) { return x * 1000; };

  var mil = C.catOf('mil');
  function addSub(id, n, icon, d) {
    if (mil && !C.subOf('mil', id)) {
      var s = { id: id, n: n, icon: icon, d: d, parent: 'mil' };
      mil.subs.push(s); mil.subById[id] = s;
    }
  }
  addSub('engineer', 'Engineering & bridging', 'tank', 'Bulldozers, breachers, bridge-layers and plant');
  addSub('command', 'Command, radar & signals', 'radio', 'Command posts, radar, comms and EW carriers');
  addSub('support', 'Recovery, medical & support', 'car', 'Recovery, ambulance, fuel, power and repair');

  function m(sub, n, country, d, speeds, specs, arms, note) {
    C.add({
      cat: 'mil', sub: sub, n: n, d: (country ? country + ' · ' : '') + d,
      country: country, speeds: speeds, specs: specs, arms: arms, note: note
    });
  }
  function u(sub, n, country, d, speeds, specs, note) { m(sub, n, country, d, speeds, specs, null, note); }

  /* ══ engineering & bridging ═══════════════════════════════════════════ */

  u('engineer', 'M9 ACE (Armored Combat Earthmover)', 'United States', 'Armoured bulldozer / earthmover',
    [['Road', kmh(48)], ['Swim', kmh(4.8)]],
    [['Range', km(320), 'dist'], ['Weight', t(24.9), 'mass'], ['Crew', 1, 'none']],
    'A tracked, armoured, amphibious dozer: digs fighting positions, fills craters, breaches berms and clears obstacles under fire, ballast tank filled with earth for the blade to bite.');

  u('engineer', 'CAT D7 / armoured D9', 'United States / Israel', 'Armoured bulldozer',
    [['Road', kmh(11)]],
    [['Weight', t(62), 'mass'], ['Crew', 2, 'none', 'D9R'], ['Blade width', 4.28, 'length']],
    'The IDF armoured D9 ("Doobi") is the best-known armoured dozer: bullet- and blast-proofed, used to clear obstacles, demolish structures and set off IEDs from inside armour.');

  u('engineer', 'M1150 ABV (Assault Breacher Vehicle)', 'United States', 'Mine-clearing breacher on M1 hull',
    [['Road', kmh(48)]],
    [['Weight', t(63), 'mass'], ['Crew', 2, 'none']],
    'An Abrams hull with a full-width mine plough and two line charges: fires a rocket-deployed explosive hose across a minefield and detonates it to blast a lane through.');

  u('engineer', 'Wisent 2 / Kodiak AEV', 'Germany / Switzerland', 'Armoured engineer vehicle',
    [['Road', kmh(68)]],
    [['Weight', t(30), 'mass'], ['Crew', 3, 'none']],
    'A Leopard-based engineer vehicle with dozer blade, excavator arm and winch, configurable for recovery, earthmoving or obstacle clearing.');

  u('engineer', 'IMR-2 / IMR-3M', 'Russia', 'Combat engineer vehicle',
    [['Road', kmh(50)]],
    [['Weight', t(44.5), 'mass'], ['Crew', 2, 'none']],
    'A T-72/T-90 hull with a dozer blade and a crane arm with a scarifier and pincer, built to clear routes through rubble and forest, some fitted for NBC-contaminated ground.');

  u('engineer', 'UR-77 Meteorit', 'Russia', 'Mine-clearing line charge vehicle',
    [['Road', kmh(60)]],
    [['Weight', t(15.5), 'mass'], ['Crew', 2, 'none']],
    'The "Snake" (Zmey): fires a rocket-towed explosive line across a minefield to clear a lane, seen used in cities to level buildings by its blast.');

  u('engineer', 'M104 Wolverine / M60 AVLB', 'United States', 'Armoured vehicle-launched bridge',
    [['Road', kmh(48)]],
    [['Weight', t(41), 'mass'], ['Crew', 2, 'none'], ['Bridge span', 26, 'length']],
    'Carries and lays a scissor or horizontal bridge across a gap in minutes, then recovers it from the far side, keeping armour moving over rivers and ditches.');

  u('engineer', 'Leguan bridge layer', 'Germany', 'Armoured bridge-layer',
    [['Road', kmh(60)]],
    [['Bridge span', 26, 'length'], ['Crew', 2, 'none']],
    'A modern horizontally-launched bridge on Leopard 2 or other hulls, laid over the vehicle so the crew never leaves armour; widely exported.');

  u('engineer', 'M3 Amphibious Rig', 'Germany / United Kingdom', 'Amphibious ferry / bridge',
    [['Road', kmh(80)], ['Water', kmh(14)]],
    [['Weight', t(25), 'mass'], ['Crew', 3, 'none']],
    'Drives to the river, unfolds pontoons and joins with others into a ferry or a continuous bridge carrying a main battle tank; the backbone of NATO wet-gap crossing.');

  u('engineer', 'Terrier CEV', 'United Kingdom', 'Combat engineer vehicle',
    [['Road', kmh(70)]],
    [['Weight', t(30), 'mass'], ['Crew', 2, 'none']],
    'A fast, air-portable, remotely-operable engineer vehicle with dozer, excavator and armour, made to prepare and breach obstacles under fire.');

  /* ══ command, radar & signals ═════════════════════════════════════════ */

  u('command', 'M1068 / M577 command post carrier', 'United States', 'Tracked command post',
    [['Road', kmh(66)]],
    [['Weight', t(12), 'mass'], ['Crew', 5, 'none']],
    'The raised-roof M113 variant that runs a battalion command post: map boards, radios and a tent extension off the back, the classic "track CP".');

  u('command', 'M1130 Stryker CV', 'United States', 'Command vehicle',
    [['Road', kmh(100)]],
    [['Range', km(500), 'dist'], ['Weight', t(18), 'mass'], ['Crew', 4, 'none']],
    'A wheeled command Stryker packed with the battle-command network and radios, so a headquarters can move with the force at road speed.');

  u('command', 'AN/TPQ-53 counter-battery radar', 'United States', 'Counter-fire radar',
    [['Towed / mounted', kmh(80)]],
    [['Detection range', km(60), 'dist'], ['Crew', 4, 'none']],
    'Backtracks incoming shells, rockets and mortars to their launch point within seconds so counter-fire can answer, mounted on a heavy tactical truck.');

  u('command', 'AN/MPQ-64 Sentinel', 'United States', 'Air-defence surveillance radar',
    [['Towed', kmh(72)]],
    [['Detection range', km(75), 'dist'], ['Crew', 3, 'none']],
    'A trailer-mounted X-band air-defence radar feeding target data to short-range missile batteries such as NASAMS.');

  u('command', '1L219 Zoopark-1 / 1L260', 'Russia', 'Counter-battery radar',
    [['Road', kmh(60)]],
    [['Detection range', km(45), 'dist'], ['Crew', 3, 'none']],
    'A tracked artillery-locating radar on an MT-LB hull, the Russian counterpart to the Q-53, and a priority target for both sides because of what it enables.');

  u('command', 'R-330Zh Zhitel', 'Russia', 'Jamming / EW station',
    [['Road', kmh(60)]],
    [['Jamming range', km(30), 'dist'], ['Crew', 4, 'none']],
    'A truck-mounted electronic-warfare set that jams satellite navigation and cellular / satellite phones over a wide area, and can direction-find the emitters it hears.');

  u('command', 'Krasukha-4 (1RL257)', 'Russia', 'Ground-based EW jammer',
    [['Road', kmh(60)]],
    [['Effective range', km(300), 'dist'], ['Crew', 4, 'none']],
    'A high-power jammer on a heavy truck aimed at airborne radars, AWACS and satellites, blinding sensors out to a few hundred kilometres in its arc.');

  u('command', 'YLC-8B / other PLA radar trucks', 'China', 'Air-surveillance radar',
    [['Road', kmh(70)]],
    [['Detection range', km(500), 'dist'], ['Crew', 6, 'none']],
    'Representative of the many truck-mounted PLA surveillance and counter-stealth radars that fold down for road march and raise in minutes.');

  /* ══ recovery, medical & support ══════════════════════════════════════ */

  u('support', 'M88A2 Hercules', 'United States', 'Armoured recovery vehicle',
    [['Road', kmh(48)]],
    [['Weight', t(70), 'mass'], ['Crew', 3, 'none'], ['Winch pull', t(63.5), 'mass']],
    'The recovery vehicle that drags a bogged or knocked-out Abrams off the field: boom crane, huge winch and a dozer-style spade to anchor against the pull.');

  u('support', 'Bergepanzer 3 Büffel', 'Germany', 'Armoured recovery vehicle',
    [['Road', kmh(68)]],
    [['Weight', t(54.3), 'mass'], ['Crew', 3, 'none']],
    'The Leopard 2-based recovery vehicle used across NATO: crane, main and auxiliary winches and a dozer blade, to recover and field-repair heavy armour.');

  u('support', 'BREM-1 / BREM-80U', 'Russia', 'Armoured recovery vehicle',
    [['Road', kmh(60)]],
    [['Weight', t(41), 'mass'], ['Crew', 3, 'none']],
    'The T-72 / T-80-based recovery tractors that clear and tow disabled tanks, with crane, winch and spade, following armour wherever it goes.');

  u('support', 'M113 / Bv206 field ambulance', 'United States / Sweden', 'Armoured / tracked ambulance',
    [['Road', kmh(60)]],
    [['Weight', t(12), 'mass'], ['Litters', 4, 'none']],
    'Casualty carriers under armour or over snow: the M113 ambulance moves wounded off the line, the tracked Bv206 does the same across arctic and swamp where wheels cannot go.');

  u('support', 'M978 HEMTT fuel tanker', 'United States', 'Bulk fuel / tanker truck',
    [['Road', kmh(88)]],
    [['Range', km(480), 'dist'], ['Capacity', 9500, 'none', 'litres'], ['Crew', 2, 'none']],
    'The 8x8 heavy truck that keeps an armoured force moving: fuel, cargo, wrecker and load-handling variants, one of the most numerous vehicles in a modern army.');

  u('support', 'MAN / Kamaz mobile power & workshop', 'Germany / Russia', 'Generator & repair truck',
    [['Road', kmh(85)]],
    [['Range', km(800), 'dist'], ['Crew', 2, 'none']],
    'The unglamorous fleet that runs everything else: shelter-body trucks carrying generators, machine shops and spares, so radars, command posts and workshops have power and repair in the field.');

  u('support', 'Oshkosh M1070 HET', 'United States', 'Heavy equipment transporter',
    [['Road', kmh(72)]],
    [['Payload', t(63.5), 'mass'], ['Crew', 2, 'none', '+ 4 seats']],
    'The tank transporter: a tractor and 5-line trailer that carries a 70-tonne Abrams over road so its tracks and engine are saved for battle, not the march.');

})();
