/*
 * Artemidos - catalogue: military vehicles, additions
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * A second pass of currently-serving armour, drawn from open-source order-of-
 * battle references (armyrecognition.com, tank-afv.com, OSINT loss trackers)
 * cross-checked against manufacturer and service data. RETIRED and museum
 * types are deliberately excluded: everything here is in service or entering
 * it as of 2026. Figures are open-source planning values, not guarantees.
 *
 * A new AIR DEFENCE subcategory is added to the military section, because the
 * catalogue held missiles and guns but no self-propelled air-defence systems,
 * which are exactly the vehicles a threat picture needs to place.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var km = function (x) { return x * 1000; };
  var t = function (x) { return x * 1000; };

  /* add an Air defence subcategory to the existing military category */
  var mil = C.catOf('mil');
  if (mil && !C.subOf('mil', 'ad')) {
    var adSub = { id: 'ad', n: 'Air defence systems', icon: 'target', parent: 'mil' };
    mil.subs.push(adSub);
    mil.subById.ad = adSub;
  }

  function m(sub, n, country, d, speeds, specs, arms, note) {
    C.add({
      cat: 'mil', sub: sub, n: n, d: (country ? country + ' · ' : '') + d,
      country: country, speeds: speeds, specs: specs, arms: arms, note: note
    });
  }

  /* ── main battle tanks ────────────────────────────────────────────── */

  m('tank', 'Challenger 3', 'United Kingdom', 'Main battle tank',
    [['Road', kmh(60)], ['Cross-country', kmh(40)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(66), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'Rheinmetall L55A1 120 mm smoothbore', eff: 4000, max: 5000, mv: 1750, note: 'Replaces the rifled L30 for NATO ammunition commonality: the decisive change over Challenger 2.' },
     { n: '7.62 mm coaxial chain gun', eff: 1100, max: 3750, mv: 862 },
     { n: '7.62 mm commander', eff: 1100, max: 3750, mv: 838 }],
    'A deep upgrade of Challenger 2: new turret, smoothbore gun, digital fire control and modular armour. Entering service through the late 2020s.');

  m('tank', 'VT-4 (MBT-3000)', 'China', 'Export main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(52), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'ZPT-98 125 mm smoothbore, autoloaded', eff: 3000, max: 4000, mv: 1740 },
     { n: 'GP125 gun-launched ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3800, mv: 830 },
     { n: '12.7 mm remote weapon station', eff: 1600, max: 6000, mv: 850 }],
    'Norinco export tank in service with Pakistan, Thailand and Nigeria. A hunter-killer sight and hydropneumatic suspension put it a generation ahead of the older Type 96 export line.');

  m('tank', 'PT-91 Twardy', 'Poland', 'Main battle tank, T-72 derivative',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(650), 'dist'], ['Combat weight', t(45.9), 'mass'], ['Crew', 3, 'none']],
    [{ n: '2A46 125 mm smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 },
     { n: 'NSW 12.7 mm', eff: 2000, max: 6000, mv: 845 }],
    'A Polish rebuild of the T-72 with the Drawa fire control, ERAWA reactive armour and a stronger engine: a bridge type still in service while Poland fields the K2 and Abrams.');

  m('tank', 'T-90S Bhishma', 'Russia / India', 'Export main battle tank',
    [['Road', kmh(60)], ['Cross-country', kmh(44)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(46.5), 'mass'], ['Crew', 3, 'none']],
    [{ n: '2A46M 125 mm smoothbore', eff: 3000, max: 4000, mv: 1700 },
     { n: '9M119 Refleks gun-launched ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 },
     { n: 'NSVT 12.7 mm', eff: 2000, max: 6000, mv: 845 }],
    'The export baseline of the T-90, built under licence in India as the Bhishma and its largest operator. Older than the T-90M but in far wider service.');

  m('tank', 'Type 90 Kyū-maru', 'Japan', 'Main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(350), 'dist'], ['Combat weight', t(50), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'Rheinmetall 120 mm L/44 smoothbore, autoloaded', eff: 3500, max: 4000, mv: 1750 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: 'M2 12.7 mm', eff: 1830, max: 6800, mv: 890 }],
    'Held on Hokkaido for the northern defence role while the lighter Type 10 equips the rest of the force.');

  /* ── infantry fighting & armoured vehicles ────────────────────────── */

  m('afv', 'K21', 'South Korea', 'Infantry fighting vehicle',
    [['Road', kmh(70)], ['Swim', kmh(7)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(26), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 9, 'none']],
    [{ n: 'K40 40 mm autocannon', eff: 3000, max: 5000, mv: 1005 },
     { n: 'Raybolt / Spike-class ATGM (2)', eff: 4000, max: 4000, mv: 250 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }],
    'Amphibious with no preparation using an inflatable flotation collar, so it fords the paddies and rivers of the peninsula without bridging.');

  m('afv', 'T-15 Armata', 'Russia', 'Heavy infantry fighting vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(48), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 9, 'none']],
    [{ n: '2A42 30 mm / Epoch turret', eff: 4000, max: 4000, mv: 960 },
     { n: 'Kornet-EM ATGM (4)', eff: 8000, max: 10000, mv: 300 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }],
    'Built on the Armata chassis with the engine forward, so the infantry are carried behind tank-weight frontal armour. Fielded only in small numbers.');

  m('afv', 'Bumerang (K-16 / K-17)', 'Russia', 'Wheeled infantry fighting vehicle, 8x8',
    [['Road', kmh(100)], ['Swim', kmh(10)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(34), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 8, 'none']],
    [{ n: '2A42 30 mm / Epoch remote turret', eff: 4000, max: 4000, mv: 960 },
     { n: 'Kornet ATGM (4)', eff: 8000, max: 10000, mv: 300 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }],
    'Amphibious 8x8 with a remote turret and rear ramp, replacing the cramped, side-door BTR line. Still entering service in numbers.');

  m('afv', 'BTR-4 Bucephalus', 'Ukraine', 'Wheeled armoured personnel carrier, 8x8',
    [['Road', kmh(110)], ['Swim', kmh(10)]],
    [['Operational range', km(690), 'dist'], ['Combat weight', t(19.7), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 8, 'none']],
    [{ n: 'ZTM-1 30 mm autocannon', eff: 4000, max: 4000, mv: 960 },
     { n: 'Barrier ATGM (2)', eff: 5000, max: 5000, mv: 300 },
     { n: '30 mm AGL and 7.62 mm coaxial', eff: 1700, max: 2200, mv: 185 }],
    'Rear ramp rather than the BTR side hatch, a real advance for mounting and dismounting under fire.');

  m('afv', 'Dardo (VCC-80)', 'Italy', 'Infantry fighting vehicle',
    [['Road', kmh(70)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(23), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 6, 'none']],
    [{ n: 'Oerlikon KBA 25 mm autocannon', eff: 2500, max: 4000, mv: 1100 },
     { n: 'Spike / TOW ATGM (2)', eff: 4000, max: 4000, mv: 300 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }],
    'The tracked IFV of the Italian Army, working alongside the wheeled Freccia.');

  m('afv', 'Freccia', 'Italy', 'Wheeled infantry fighting vehicle, 8x8',
    [['Road', kmh(105)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(28), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 8, 'none']],
    [{ n: 'Oerlikon 25 mm autocannon', eff: 2500, max: 4000, mv: 1100 },
     { n: 'Spike-LR ATGM (2)', eff: 4000, max: 4000, mv: 250 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }],
    'A member of the Italian VBM family on the Centauro hull, giving a wheeled brigade its own IFV.');

  m('afv', 'VBMR Griffon', 'France', 'Wheeled armoured personnel carrier, 6x6',
    [['Road', kmh(100)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(24.5), 'mass'], ['Crew', 2, 'none'], ['Dismounts', 8, 'none']],
    [{ n: 'Remote weapon station, 12.7 mm or 7.62 mm', eff: 1830, max: 6800, mv: 890 },
     { n: '40 mm automatic grenade launcher option', eff: 1500, max: 2200, mv: 240 }],
    'The workhorse of the French Scorpion programme, replacing the old VAB across the force with a networked, better-protected 6x6.');

  m('afv', 'EBRC Jaguar', 'France', 'Wheeled reconnaissance and combat vehicle, 6x6',
    [['Road', kmh(90)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(25), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'CTA 40 mm cased-telescoped cannon', eff: 2500, max: 4000, mv: 1500, note: 'The same 40 mm CTA gun as the British Ajax and Warrior CSP: airburst and armour-piercing from one feed.' },
     { n: 'Akeron MP (MMP) ATGM (2)', eff: 5000, max: 5000, mv: 250 },
     { n: '7.62 mm remote', eff: 1000, max: 3750, mv: 850 }],
    'Replaces both the AMX-10 RC and the Sagaie in the French cavalry: a single wheeled platform for armed reconnaissance.');

  m('afv', 'Eitan', 'Israel', 'Wheeled armoured personnel carrier, 8x8',
    [['Road', kmh(90)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(35), 'mass'], ['Crew', 2, 'none'], ['Dismounts', 9, 'none']],
    [{ n: 'RCWS 30 mm or 12.7 mm remote turret', eff: 3000, max: 4000, mv: 960 },
     { n: 'Iron Fist active protection', eff: 0, max: 0, mv: 0, note: 'Hard-kill APS that intercepts incoming missiles and RPGs; not a weapon for engaging the enemy.' }],
    'A wheeled companion to the tracked Namer, cheaper and faster on roads, carrying the same active-protection philosophy from hard urban experience.');

  m('afv', 'AMPV', 'United States', 'Armoured multi-purpose vehicle',
    [['Road', kmh(72)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(39), 'mass'], ['Crew', 2, 'none'], ['Passengers', 6, 'none']],
    [{ n: 'Remote weapon station, 12.7 mm or 40 mm', eff: 1830, max: 6800, mv: 890 }],
    'Replaces the Vietnam-era M113 in the armoured brigades in five roles: general purpose, mortar carrier, command, and two medical. Not a frontline IFV, a survivable battlefield taxi.');

  m('afv', 'ACV (Amphibious Combat Vehicle)', 'United States', 'Amphibious armoured vehicle, 8x8',
    [['Road', kmh(105)], ['Swim', kmh(11)]],
    [['Operational range', km(523), 'dist'], ['Combat weight', t(30), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 13, 'none']],
    [{ n: '30 mm autocannon (ACV-30 variant)', eff: 3000, max: 4000, mv: 1000 },
     { n: '12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 }],
    'Swims from ship to shore and replaces the tracked AAV in the US Marine Corps: a wheeled 8x8 that trades some surf performance for far better land mobility and protection.');

  m('afv', 'Type 16 MCV', 'Japan', 'Wheeled mobile combat vehicle, 8x8',
    [['Road', kmh(100)]],
    [['Operational range', km(400), 'dist'], ['Combat weight', t(26), 'mass'], ['Crew', 4, 'none']],
    [{ n: '105 mm rifled gun', eff: 3000, max: 4000, mv: 1500, note: 'A direct-fire wheeled gun, fast on roads and air-transportable, for rapid deployment to Japan\'s islands.' },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: '12.7 mm', eff: 1830, max: 6800, mv: 890 }],
    'A wheeled tank-destroyer for mobility rather than an assault tank: it drives itself between islands at road speed instead of needing a transporter.');

  m('afv', 'ZTL-11 / ZBL-08 family', 'China', 'Wheeled fighting vehicle, 8x8',
    [['Road', kmh(100)], ['Swim', kmh(8)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(21), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 7, 'none']],
    [{ n: '30 mm autocannon (ZBL-08 IFV)', eff: 4000, max: 4000, mv: 960 },
     { n: '105 mm assault gun (ZTL-11 variant)', eff: 3000, max: 4000, mv: 1500 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3800, mv: 830 }],
    'The 8x8 family behind China\'s medium wheeled brigades, in an IFV version and a 105 mm fire-support version, amphibious for river and coastal work.');

  m('afv', 'LAV 6.0', 'Canada', 'Wheeled infantry fighting vehicle, 8x8',
    [['Road', kmh(100)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(28.6), 'mass'], ['Crew', 3, 'none'], ['Dismounts', 7, 'none']],
    [{ n: '25 mm M242 Bushmaster', eff: 2500, max: 4000, mv: 1100 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }],
    'The latest rebuild of the LAV III / Piranha family that also underlies the US Stryker, with a raised hull for mine protection.');

  /* ── artillery ────────────────────────────────────────────────────── */

  m('arty', 'PLZ-05', 'China', 'Self-propelled howitzer, 155 mm',
    [['Road', kmh(55)]],
    [['Range, base bleed', km(40), 'dist'], ['Range, rocket-assisted', km(53), 'dist'],
     ['Combat weight', t(35), 'mass'], ['Crew', 5, 'none'], ['Rate of fire', 8, 'none', 'rounds/min']],
    [{ n: '155 mm L/52 howitzer', eff: 40000, max: 53000, mv: 900, note: 'Autoloaded; can fire a guided round to strike point targets at range.' }],
    'China\'s standard tracked heavy howitzer, comparable to the K9 and PzH 2000 in reach.');

  m('arty', 'RCH 155', 'Germany', 'Wheeled self-propelled howitzer, 155 mm',
    [['Road', kmh(100)]],
    [['Range, standard', km(40), 'dist'], ['Range, extended', km(54), 'dist'],
     ['Combat weight', t(39), 'mass'], ['Crew', 2, 'none'], ['Rate of fire', 9, 'none', 'rounds/min']],
    [{ n: '155 mm L/52 gun, fully automatic', eff: 40000, max: 54000, mv: 945, note: 'Fires on the move and can shoot without the crew leaving the cab: the whole gun is remote.' }],
    'A PzH 2000 gun on a Boxer 8x8. Two crew, fires and moves in seconds, and among the first ordered by Ukraine for exactly that shoot-and-scoot survivability.');

  /* ── air defence systems (new subcategory) ────────────────────────── */

  m('ad', 'Pantsir-S1', 'Russia', 'Self-propelled gun-missile air defence',
    [['Road', kmh(90)]],
    [['Missile range', km(20), 'dist'], ['Missile ceiling', 15000, 'alt'], ['Gun range', km(4), 'dist'], ['Crew', 3, 'none']],
    [{ n: '57E6 surface-to-air missile (12)', eff: 20000, max: 20000, mv: 1300, note: 'Radio-command guided; the gun and missile together cover from point-blank out to 20 km.' },
     { n: '2A38M 30 mm twin cannon (2)', eff: 4000, max: 4000, mv: 960 }],
    'The point-defence layer of the Russian system and a primary counter to drones and cruise missiles. Its own weakness is the same low, slow targets in saturation.');

  m('ad', 'Tor-M2', 'Russia', 'Tracked short-range air defence',
    [['Road', kmh(65)]],
    [['Missile range', km(16), 'dist'], ['Missile ceiling', 10000, 'alt'], ['Crew', 3, 'none'], ['Reaction time', 5, 'none', 'seconds']],
    [{ n: '9M338K surface-to-air missile (16)', eff: 16000, max: 16000, mv: 1000, note: 'Vertically launched, all-weather; designed to kill precision munitions and drones as well as aircraft.' }],
    'Built to shoot down the weapons, not just the launch platform: guided bombs, cruise missiles and drones are its designed targets.');

  m('ad', 'Buk-M3', 'Russia', 'Tracked medium-range air defence',
    [['Road', kmh(70)]],
    [['Missile range', km(70), 'dist'], ['Missile ceiling', 35000, 'alt'], ['Crew', 4, 'none']],
    [{ n: '9M317M surface-to-air missile (6)', eff: 70000, max: 70000, mv: 1550, note: 'Each launcher vehicle carries and fires its own missiles; a battery layers with longer-range S-300/400.' }],
    'The medium tier between the short-range Tor and the long-range S-400, covering the airspace a strike package must cross.');

  m('ad', 'Gepard 1A2', 'Germany', 'Self-propelled anti-aircraft gun',
    [['Road', kmh(65)]],
    [['Gun range, effective', km(4), 'dist'], ['Gun range, maximum', km(5.5), 'dist'],
     ['Combat weight', t(47.5), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'Twin Oerlikon 35 mm cannon', eff: 4000, max: 5500, mv: 1175, note: 'Own search and tracking radar on the turret. An older design, but proven against drones and cruise missiles, where cost-per-kill matters.' }],
    'A 1970s gun system with its own radar, returned to prominence intercepting cheap drones and Shahed loitering munitions where a missile would cost far more than the target.');

  m('ad', 'Skyranger 30', 'Germany', 'Self-propelled anti-aircraft gun-missile turret',
    [['Road', kmh(100), 'on a Boxer 8x8 host']],
    [['Gun range', km(3), 'dist'], ['Missile range', km(6), 'dist'], ['Crew', 2, 'none']],
    [{ n: '30 mm KDG revolver cannon', eff: 3000, max: 4000, mv: 1080, note: 'Airburst ammunition throws a cloud of sub-projectiles, built specifically to defeat drone swarms.' },
     { n: 'Stinger / Mistral short-range missiles', eff: 6000, max: 6000, mv: 800 }],
    'A modern turret for the counter-drone era, fitting on a Boxer or other 8x8, ordered to rebuild the short-range air defence that many armies let wither.');

  m('ad', 'AN/TWQ-1 Avenger', 'United States', 'Vehicle-mounted short-range air defence',
    [['Road', kmh(89)]],
    [['Missile range', km(8), 'dist'], ['Missile ceiling', 3800, 'alt'], ['Crew', 2, 'none']],
    [{ n: 'FIM-92 Stinger missiles (8)', eff: 8000, max: 8000, mv: 750, note: 'Infrared-homing; fire-and-forget against low-altitude aircraft, helicopters and drones.' },
     { n: '12.7 mm machine gun', eff: 1830, max: 6800, mv: 890 }],
    'A Stinger turret on a Humvee: the US Army\'s mobile short-range air defence, cued into the wider air picture rather than fighting alone.');

})();
