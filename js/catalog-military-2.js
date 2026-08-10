/*
 * Artemidos - catalogue: military systems, extended set
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Second tranche: additional armour, artillery, aircraft, naval units, a much
 * wider drone and loitering-munition set, and the strategic and regional
 * missile families missing from the first pass, including Iranian systems and
 * the world's intercontinental ballistic missiles.
 *
 * Same rules as the first file. Open-source published figures. Effective and
 * maximum range stated separately. Claimed performance is labelled as claimed:
 * several states publish missile ranges that independent analysis does not
 * support, and an entry that repeats them silently is worse than no entry.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var kn = function (x) { return x * 1852 / 3600; };
  var km = function (x) { return x * 1000; };
  var nmi = function (x) { return x * 1852; };
  var t = function (x) { return x * 1000; };

  function m(sub, n, country, d, speeds, specs, arms, note, optics) {
    C.add({
      cat: 'mil', sub: sub, n: n, d: (country ? country + ' · ' : '') + d,
      country: country, speeds: speeds, specs: specs, arms: arms, note: note, optics: optics
    });
  }

  /* ══ main battle tanks ═══════════════════════════════════════════════ */

  m('tank', 'Type 96B', 'China', 'Main battle tank, mass-produced',
    [['Road', kmh(65)], ['Cross-country', kmh(45)]],
    [['Operational range', km(400), 'dist'], ['Combat weight', t(43), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'ZPT-98 125 mm smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: 'Gun-launched ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3800, mv: 830 }],
    'The numerous one rather than the best one: China fields far more Type 96 than Type 99.');

  m('tank', 'Type 15 (ZTQ-15)', 'China', 'Light tank, high-altitude and jungle',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(35), 'mass'], ['Crew', 3, 'none']],
    [{ n: '105 mm rifled', eff: 2500, max: 3000, mv: 1600 },
     { n: 'Gun-launched ATGM', eff: 5000, max: 5000, mv: 350 }],
    'Built light on purpose: a 50-tonne tank cannot cross Tibetan bridges or operate well above 4000 m.');

  m('tank', 'Al-Khalid (MBT-2000)', 'Pakistan / China', 'Main battle tank',
    [['Road', kmh(72)], ['Cross-country', kmh(45)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(46), 'mass'], ['Crew', 3, 'none']],
    [{ n: '125 mm smoothbore with autoloader', eff: 3000, max: 4000, mv: 1700 },
     { n: 'Gun-launched ATGM', eff: 5000, max: 5000, mv: 350 }]);

  m('tank', 'Zulfiqar-3', 'Iran', 'Main battle tank, domestic',
    [['Road', kmh(65)], ['Cross-country', kmh(40)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(52), 'mass'], ['Crew', 3, 'none']],
    [{ n: '125 mm 2A46 smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: '12.7 mm anti-aircraft', eff: 1600, max: 6000, mv: 850 }],
    'Produced in small numbers. Much of the Iranian fleet remains upgraded T-72 and M60.');

  m('tank', 'Karrar', 'Iran', 'Main battle tank, T-72 derivative',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(51), 'mass'], ['Crew', 3, 'none']],
    [{ n: '125 mm 2A46M smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: 'Gun-launched ATGM', eff: 5000, max: 5000, mv: 350 }],
    'Presented as an indigenous design; externally and mechanically close to the T-90 family.');

  m('tank', 'T-62M', 'Russia', 'Main battle tank, 1960s design, still fielded',
    [['Road', kmh(50)], ['Cross-country', kmh(35)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(41.5), 'mass'], ['Crew', 4, 'none']],
    [{ n: '115 mm U-5TS smoothbore', eff: 1600, max: 4000, mv: 1615 },
     { n: '9M117 Sheksna gun-launched ATGM', eff: 4000, max: 4000, mv: 350 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }],
    'Pulled from storage and returned to service. No thermal sight and manual loading: outclassed, but a 115 mm round still kills.');

  m('tank', 'T-55 / Type 59', 'Soviet Union / worldwide', 'Main battle tank, most-produced tank in history',
    [['Road', kmh(50)], ['Cross-country', kmh(30)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(36), 'mass'], ['Crew', 4, 'none'],
     ['Number built', 100000, 'none']],
    [{ n: '100 mm D-10T rifled', eff: 1500, max: 3000, mv: 1415 },
     { n: 'SGMT / PKT 7.62 mm', eff: 1000, max: 3800, mv: 825 }],
    'Still in service or storage across dozens of states. Any assessment of an irregular force has to account for it.');

  m('tank', 'Stridsvagn 122', 'Sweden', 'Leopard 2 variant, improved roof armour',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(62.5), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'Rh-120 L/44 120 mm', eff: 3500, max: 4000, mv: 1750 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('tank', 'M60T / Sabra', 'Türkiye / Israel', 'Upgraded M60 with 120 mm gun',
    [['Road', kmh(48)], ['Cross-country', kmh(30)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(59), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'MG253 120 mm smoothbore', eff: 3000, max: 4000, mv: 1700 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('tank', 'AMX-30B2', 'France', 'Main battle tank, Cold War',
    [['Road', kmh(65)], ['Cross-country', kmh(40)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(36), 'mass'], ['Crew', 4, 'none']],
    [{ n: '105 mm CN-105-F1 rifled', eff: 2000, max: 3000, mv: 1000 },
     { n: '20 mm coaxial cannon', eff: 1500, max: 2000, mv: 1050 }]);

  /* ══ armoured vehicles ═══════════════════════════════════════════════ */

  m('afv', 'BMPT Terminator', 'Russia', 'Tank support fighting vehicle',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(48), 'mass'], ['Crew', 5, 'none']],
    [{ n: '2A42 30 mm twin autocannon', eff: 2000, max: 4000, mv: 960 },
     { n: '9M120 Ataka ATGM (four)', eff: 6000, max: 8000, mv: 400 },
     { n: 'AG-17D 30 mm grenade launchers (two)', eff: 1700, max: 1700, mv: 185 },
     { n: 'PKTM 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }],
    'Built on a tank hull to cover tanks against infantry anti-armour teams in close terrain, with very high gun elevation for upper floors.');

  m('afv', 'Lynx KF41', 'Germany', 'Infantry fighting vehicle, modular',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(50), 'mass'], ['Crew + dismounts', 3, 'none', '+ 8 dismounts']],
    [{ n: 'Wotan 35 mm autocannon', eff: 3000, max: 4000, mv: 1150 },
     { n: 'Spike LR2 ATGM', eff: 5500, max: 5500, mv: 180 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('afv', 'Redback (AS21)', 'South Korea / Australia', 'Infantry fighting vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(42), 'mass'], ['Crew + dismounts', 3, 'none', '+ 8 dismounts']],
    [{ n: 'MK44S 30 mm Bushmaster', eff: 3000, max: 4000, mv: 1100 },
     { n: 'Spike LR2 ATGM', eff: 5500, max: 5500, mv: 180 }]);

  m('afv', 'Marder 1A5', 'Germany', 'Infantry fighting vehicle, Cold War',
    [['Road', kmh(65)], ['Cross-country', kmh(40)]],
    [['Operational range', km(520), 'dist'], ['Combat weight', t(37), 'mass'], ['Crew + dismounts', 3, 'none', '+ 6 dismounts']],
    [{ n: 'Rh 202 20 mm autocannon', eff: 2000, max: 2500, mv: 1100 },
     { n: 'MILAN ATGM', eff: 2000, max: 2000, mv: 200 },
     { n: 'MG3 7.62 mm coaxial', eff: 1000, max: 3750, mv: 820 }]);

  m('afv', 'Ajax (ASCOD 2)', 'United Kingdom', 'Reconnaissance and strike vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(42), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'CT40 40 mm cased telescoped cannon', eff: 2500, max: 4000, mv: 1500 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('afv', 'VBCI', 'France', 'Wheeled 8×8 infantry fighting vehicle',
    [['Road', kmh(100)], ['Cross-country', kmh(50)]],
    [['Operational range', km(750), 'dist'], ['Combat weight', t(32), 'mass'], ['Crew + dismounts', 2, 'none', '+ 9 dismounts']],
    [{ n: '25 mm dual-feed cannon', eff: 2000, max: 3000, mv: 1100 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('afv', 'Patria AMV / Rosomak', 'Finland / Poland', 'Wheeled 8×8 armoured vehicle',
    [['Road', kmh(100)], ['Cross-country', kmh(50)], ['Swimming', kmh(10)]],
    [['Operational range', km(850), 'dist'], ['Combat weight', t(26), 'mass'], ['Crew + dismounts', 3, 'none', '+ 8 dismounts']],
    [{ n: 'MK44 30 mm Bushmaster II', eff: 3000, max: 4000, mv: 1100 },
     { n: 'Spike LR ATGM (some variants)', eff: 4000, max: 4000, mv: 180 }]);

  m('afv', 'BMD-4M', 'Russia', 'Airborne infantry fighting vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(45)], ['Swimming', kmh(10)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(13.5), 'mass'], ['Crew + dismounts', 3, 'none', '+ 5 dismounts']],
    [{ n: '2A70 100 mm gun-launcher', eff: 4000, max: 7000, mv: 250 },
     { n: '2A72 30 mm autocannon', eff: 2000, max: 4000, mv: 960 },
     { n: '9M117 ATGM', eff: 5500, max: 5500, mv: 350 }],
    'Air-droppable with its crew aboard, which is unique to the Russian airborne. Protection is minimal as a consequence.');

  m('afv', 'Achzarit', 'Israel', 'Heavy armoured personnel carrier on a T-55 hull',
    [['Road', kmh(65)], ['Cross-country', kmh(45)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(44), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: '7.62 mm remote weapon station', eff: 1000, max: 3750, mv: 850 }],
    'Captured T-55 hulls rebuilt with the turret removed and a rear door cut in: heavy protection from cheap material.');

  m('afv', 'BTR-80 / BTR-70', 'Soviet Union / Russia', 'Wheeled 8×8 armoured personnel carrier',
    [['Road', kmh(80)], ['Cross-country', kmh(40)], ['Swimming', kmh(9)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(13.6), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: 'KPVT 14.5 mm', eff: 2000, max: 8000, mv: 1000 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }]);

  m('afv', 'MT-LB', 'Soviet Union', 'Tracked armoured carrier and prime mover',
    [['Road', kmh(61)], ['Cross-country', kmh(30)], ['Swimming', kmh(6)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(11.9), 'mass'], ['Crew + dismounts', 2, 'none', '+ 11 dismounts']],
    [{ n: 'PKT 7.62 mm', eff: 1000, max: 3800, mv: 825 }],
    'Very low ground pressure: it crosses swamp and deep snow that stop heavier vehicles. Armour stops rifle fire and little else.');

  m('afv', 'ZBD-04A', 'China', 'Infantry fighting vehicle',
    [['Road', kmh(65)], ['Cross-country', kmh(45)], ['Swimming', kmh(6)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(24.5), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: '100 mm gun-launcher', eff: 4000, max: 7000, mv: 250 },
     { n: '30 mm autocannon', eff: 2000, max: 4000, mv: 960 },
     { n: 'HJ-73 ATGM', eff: 4000, max: 4000, mv: 350 }]);

  /* ══ artillery ═══════════════════════════════════════════════════════ */

  m('arty', 'K9 Thunder', 'South Korea', 'Self-propelled 155 mm L/52',
    [['Road', kmh(67)], ['Cross-country', kmh(40)]],
    [['Operational range', km(480), 'dist'], ['Combat weight', t(47), 'mass'], ['Crew', 5, 'none'],
     ['Rate of fire, burst', 6, 'none', 'rounds/min']],
    [{ n: '155 mm L/52, base-bleed', eff: 40000, max: 40000, mv: 928 },
     { n: '155 mm, rocket-assisted', eff: 54000, max: 54000, mv: 928 }],
    'The most widely exported self-propelled gun of its generation.');

  m('arty', 'AS90 Braveheart', 'United Kingdom', 'Self-propelled 155 mm',
    [['Road', kmh(53)], ['Cross-country', kmh(35)]],
    [['Operational range', km(370), 'dist'], ['Combat weight', t(45), 'mass'], ['Crew', 5, 'none']],
    [{ n: '155 mm L/39, standard HE', eff: 24700, max: 24700, mv: 827 },
     { n: '155 mm, base-bleed', eff: 30000, max: 30000, mv: 827 }]);

  m('arty', 'T-155 Firtina', 'Türkiye', 'Self-propelled 155 mm L/52',
    [['Road', kmh(65)], ['Cross-country', kmh(40)]],
    [['Operational range', km(400), 'dist'], ['Combat weight', t(56), 'mass'], ['Crew', 5, 'none']],
    [{ n: '155 mm L/52, base-bleed', eff: 40000, max: 40000, mv: 945 }]);

  m('arty', '2S7 Pion', 'Soviet Union', 'Self-propelled 203 mm, heaviest in service',
    [['Road', kmh(50)], ['Cross-country', kmh(30)]],
    [['Operational range', km(650), 'dist'], ['Combat weight', t(46), 'mass'], ['Crew', 7, 'none'],
     ['Rate of fire', 1.5, 'none', 'rounds/min']],
    [{ n: '203 mm 2A44, standard HE', eff: 37500, max: 37500, mv: 960 },
     { n: '203 mm, rocket-assisted', eff: 55000, max: 55000, mv: 960 }],
    'A 110 kg shell. Slow to fire and to move, but nothing in the class of a normal 155 mm gun matches its destructive effect per round.');

  m('arty', '2S1 Gvozdika', 'Soviet Union', 'Self-propelled 122 mm, amphibious',
    [['Road', kmh(60)], ['Swimming', kmh(4.5)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(15.7), 'mass'], ['Crew', 4, 'none']],
    [{ n: '122 mm 2A18, standard HE', eff: 15200, max: 15200, mv: 690 },
     { n: '122 mm, rocket-assisted', eff: 21900, max: 21900, mv: 690 }]);

  m('arty', 'TOS-1A Solntsepyok', 'Russia', 'Thermobaric multiple rocket launcher on a tank hull',
    [['Road', kmh(60)], ['Cross-country', kmh(40)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(46), 'mass'], ['Crew', 3, 'none'],
     ['Rockets carried', 24, 'none']],
    [{ n: '220 mm thermobaric rocket', eff: 6000, max: 10000, mv: 500,
       note: 'Full salvo saturates roughly 40 000 m². Short range means it must come within direct-fire distance to shoot.' }],
    'Direct-fire ranges on a tank chassis: it has to expose itself to use its main effect, which is why it is escorted heavily.');

  m('arty', 'PHL-191 (PCH-191)', 'China', 'Modular long-range rocket artillery',
    [['Road', kmh(85)], ['Cross-country', kmh(45)]],
    [['Operational range', km(650), 'dist'], ['Combat weight', t(43), 'mass'], ['Crew', 3, 'none']],
    [{ n: '370 mm guided rocket', eff: 220000, max: 220000, mv: 1200 },
     { n: '300 mm guided rocket', eff: 130000, max: 130000, mv: 1000 },
     { n: '750 mm Fire Dragon 480 ballistic missile', eff: 500000, max: 500000, mv: 1500 }]);

  m('arty', 'Fajr-5', 'Iran', 'Heavy multiple rocket launcher',
    [['Road', kmh(60)], ['Cross-country', kmh(35)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(15), 'mass'], ['Crew', 5, 'none'],
     ['Rockets carried', 4, 'none']],
    [{ n: '333 mm Fajr-5 rocket', eff: 75000, max: 75000, mv: 1000, note: '175 kg warhead, unguided.' }],
    'Widely exported to Iranian-aligned groups. Unguided at 75 km, so it is an area weapon against cities rather than a precision one.');

  m('arty', 'Zuzana 2', 'Slovakia', 'Wheeled 8×8 self-propelled 155 mm L/52',
    [['Road', kmh(80)], ['Cross-country', kmh(40)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(33), 'mass'], ['Crew', 4, 'none']],
    [{ n: '155 mm L/52, base-bleed', eff: 41000, max: 41000, mv: 945 }]);

  m('arty', 'Nora B-52', 'Serbia', 'Wheeled 8×8 self-propelled 155 mm',
    [['Road', kmh(90)], ['Cross-country', kmh(40)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(28), 'mass'], ['Crew', 4, 'none']],
    [{ n: '155 mm L/52, base-bleed', eff: 41000, max: 41000, mv: 900 }]);

  /* ══ military aircraft ═══════════════════════════════════════════════ */

  m('milair', 'Su-34 Fullback', 'Russia', 'Strike fighter-bomber',
    [['Maximum', kmh(1900)], ['Cruise', kmh(900)]],
    [['Combat radius', km(1100), 'dist'], ['Ferry range', km(4000), 'dist'], ['Service ceiling', 15000, 'alt'],
     ['Payload', t(12), 'mass'], ['Maximum Mach', 1.8, 'none']],
    [{ n: 'GSh-30-1 30 mm', eff: 1800, max: 3000, mv: 860 },
     { n: 'Kh-59MK2 cruise missile', eff: 290000, max: 290000, mv: 270 },
     { n: 'Kh-31P anti-radiation', eff: 110000, max: 110000, mv: 1000 },
     { n: 'UMPK glide bomb kit', eff: 70000, max: 70000, mv: 250,
       note: 'A cheap wing-and-guidance kit bolted to an unguided bomb. It lets the aircraft release from outside most short-range air defence.' }]);

  m('milair', 'Su-25 Frogfoot', 'Soviet Union / Russia', 'Close air support',
    [['Maximum', kmh(950)], ['Attack run', kmh(700)]],
    [['Combat radius', km(375), 'dist'], ['Service ceiling', 7000, 'alt'], ['Payload', t(4.4), 'mass']],
    [{ n: 'GSh-30-2 30 mm', eff: 1800, max: 3000, mv: 870 },
     { n: 'S-8 / S-13 rocket pods', eff: 4000, max: 6000, mv: 610 },
     { n: 'Kh-25ML laser-guided', eff: 10000, max: 10000, mv: 300 }],
    'Titanium bathtub around the cockpit, like the A-10. Flown very low, which puts it inside MANPADS envelopes.');

  m('milair', 'MiG-29 Fulcrum', 'Soviet Union / Russia', 'Air superiority fighter',
    [['Maximum', kmh(2400)], ['Cruise', kmh(850)]],
    [['Combat radius', km(700), 'dist'], ['Service ceiling', 18000, 'alt'], ['Maximum Mach', 2.25, 'none']],
    [{ n: 'GSh-30-1 30 mm', eff: 1800, max: 3000, mv: 860 },
     { n: 'R-27 medium range', eff: 80000, max: 80000, mv: 1200 },
     { n: 'R-73 short range', eff: 30000, max: 40000, mv: 800 }]);

  m('milair', 'Chengdu J-10C', 'China', 'Multirole fighter',
    [['Maximum', kmh(2200)], ['Cruise', kmh(900)]],
    [['Combat radius', km(1240), 'dist'], ['Service ceiling', 18000, 'alt'], ['Maximum Mach', 1.8, 'none']],
    [{ n: '23 mm twin cannon', eff: 1800, max: 3000, mv: 715 },
     { n: 'PL-15 BVRAAM', eff: 200000, max: 300000, mv: 1400 },
     { n: 'PL-10 short range', eff: 20000, max: 20000, mv: 900 }]);

  m('milair', 'JF-17 Thunder', 'Pakistan / China', 'Lightweight multirole fighter',
    [['Maximum', kmh(1960)], ['Cruise', kmh(900)]],
    [['Combat radius', km(1352), 'dist'], ['Service ceiling', 16700, 'alt'], ['Maximum Mach', 1.6, 'none']],
    [{ n: 'GSh-23-2 23 mm', eff: 1800, max: 3000, mv: 715 },
     { n: 'PL-15 / SD-10 BVRAAM', eff: 100000, max: 200000, mv: 1400 },
     { n: 'CM-400AKG anti-ship', eff: 240000, max: 240000, mv: 1300 }]);

  m('milair', 'KAI KF-21 Boramae', 'South Korea', 'Multirole fighter, low observable features',
    [['Maximum', kmh(2200)], ['Cruise', kmh(900)]],
    [['Combat radius', km(1000), 'dist'], ['Service ceiling', 16500, 'alt'], ['Maximum Mach', 1.81, 'none']],
    [{ n: 'M61A2 20 mm', eff: 1200, max: 3000, mv: 1050 },
     { n: 'Meteor BVRAAM', eff: 200000, max: 200000, mv: 1400 },
     { n: 'IRIS-T', eff: 25000, max: 25000, mv: 1000 }]);

  m('milair', 'F-15E Strike Eagle', 'United States', 'Strike fighter',
    [['Maximum', kmh(2650)], ['Cruise', kmh(917)]],
    [['Combat radius', km(1270), 'dist'], ['Ferry range', km(3900), 'dist'], ['Service ceiling', 18200, 'alt'],
     ['Payload', t(11), 'mass'], ['Maximum Mach', 2.5, 'none']],
    [{ n: 'M61A1 20 mm', eff: 1200, max: 3000, mv: 1036 },
     { n: 'AIM-120 AMRAAM', eff: 105000, max: 160000, mv: 1400 },
     { n: 'GBU-28 bunker buster', eff: 10000, max: 10000, mv: 300 },
     { n: 'AGM-158 JASSM-ER', eff: 1000000, max: 1000000, mv: 270 }]);

  m('milair', 'Panavia Tornado GR4 / IDS', 'Europe', 'Swing-wing strike aircraft, retired UK 2019',
    [['Maximum', kmh(2400)], ['Low-level dash', kmh(1480)]],
    [['Combat radius', km(1390), 'dist'], ['Service ceiling', 15240, 'alt'], ['Maximum Mach', 2.2, 'none']],
    [{ n: 'Mauser BK-27 27 mm', eff: 1500, max: 3000, mv: 1100 },
     { n: 'Storm Shadow cruise missile', eff: 550000, max: 550000, mv: 270 },
     { n: 'Brimstone', eff: 60000, max: 60000, mv: 450 }]);

  m('milair', 'Dassault Mirage 2000', 'France', 'Multirole fighter',
    [['Maximum', kmh(2530)], ['Cruise', kmh(900)]],
    [['Combat radius', km(1550), 'dist'], ['Service ceiling', 17060, 'alt'], ['Maximum Mach', 2.2, 'none']],
    [{ n: 'DEFA 554 30 mm twin', eff: 1500, max: 3000, mv: 1025 },
     { n: 'MICA', eff: 80000, max: 80000, mv: 1000 },
     { n: 'SCALP-EG', eff: 550000, max: 550000, mv: 270 }]);

  m('milair', 'Tupolev Tu-160 Blackjack', 'Russia', 'Supersonic strategic bomber, largest combat aircraft ever built',
    [['Maximum', kmh(2220)], ['Cruise', kmh(960)]],
    [['Range, unrefuelled', km(12300), 'dist'], ['Service ceiling', 16000, 'alt'], ['Payload', t(45), 'mass'],
     ['Maximum Mach', 2.05, 'none'], ['Maximum take-off weight', t(275), 'mass']],
    [{ n: 'Kh-101 / Kh-102 cruise missile (12)', eff: 5500000, max: 5500000, mv: 260 },
     { n: 'Kh-55SM cruise missile', eff: 3000000, max: 3000000, mv: 260 }]);

  m('milair', 'Tupolev Tu-95MS Bear', 'Soviet Union / Russia', 'Turboprop strategic bomber',
    [['Cruise', kmh(710)], ['Maximum', kmh(920)]],
    [['Range', km(15000), 'dist'], ['Service ceiling', 12000, 'alt'], ['Payload', t(15), 'mass']],
    [{ n: 'Kh-101 cruise missile (8)', eff: 5500000, max: 5500000, mv: 260 }],
    'Contra-rotating propellers with supersonic tip speeds make it one of the loudest aircraft ever flown, and detectable on sonar from a submarine.');

  m('milair', 'Xian H-6K', 'China', 'Strategic bomber, Tu-16 derivative',
    [['Cruise', kmh(770)], ['Maximum', kmh(1050)]],
    [['Combat radius', km(3500), 'dist'], ['Service ceiling', 13000, 'alt'], ['Payload', t(12), 'mass']],
    [{ n: 'CJ-20 cruise missile (6)', eff: 2000000, max: 2000000, mv: 250 },
     { n: 'YJ-12 anti-ship', eff: 400000, max: 400000, mv: 1200 }]);

  m('milair', 'Ilyushin Il-76', 'Soviet Union / Russia', 'Strategic transport',
    [['Cruise', kmh(800)], ['Maximum', kmh(900)]],
    [['Range with 47 t payload', km(4000), 'dist'], ['Payload', t(50), 'mass'], ['Service ceiling', 13000, 'alt'],
     ['Runway required', 1700, 'length', 'unpaved capable'], ['Paratroopers', 126, 'none']]);

  m('milair', 'Antonov An-124 Ruslan', 'Ukraine / Russia', 'Strategic heavy-lift transport',
    [['Cruise', kmh(800)], ['Maximum', kmh(865)]],
    [['Range with 120 t payload', km(4800), 'dist'], ['Payload', t(150), 'mass'], ['Service ceiling', 12000, 'alt']],
    null,
    'One of very few aircraft that can move a main battle tank by air. Outsize airlift is a strategic capability few states hold.');

  m('milair', 'Northrop Grumman E-2D Hawkeye', 'United States', 'Carrier airborne early warning',
    [['Cruise', kmh(474)], ['Maximum', kmh(648)]],
    [['Endurance', 6, 'none', 'hours'], ['Service ceiling', 10600, 'alt'], ['Radar detection range', km(550), 'dist']],
    null,
    'Gives a carrier group radar coverage far beyond the ships own horizon, which is the whole basis of fleet air defence.');

  /* ══ military helicopters ════════════════════════════════════════════ */

  m('milheli', 'Mil Mi-26 Halo', 'Russia', 'Heaviest production helicopter in the world',
    [['Cruise', kmh(255)], ['Maximum', kmh(295)]],
    [['Range', km(475), 'dist'], ['Service ceiling', 4600, 'alt'], ['Payload', t(20), 'mass'],
     ['Troops', 90, 'none'], ['Rotor diameter', 32, 'length']],
    null,
    'Can lift another helicopter. Payload exceeds that of a C-130.');

  m('milheli', 'Sikorsky CH-53E Super Stallion', 'United States', 'Heavy-lift transport',
    [['Cruise', kmh(278)], ['Maximum', kmh(315)]],
    [['Range', km(1000), 'dist'], ['Service ceiling', 5640, 'alt'], ['External load', t(14.5), 'mass'], ['Troops', 37, 'none']],
    [{ n: 'GAU-21 12.7 mm', eff: 1830, max: 6800, mv: 890 }]);

  m('milheli', 'CAIC Z-10', 'China', 'Attack helicopter',
    [['Cruise', kmh(230)], ['Maximum', kmh(270)]],
    [['Range', km(800), 'dist'], ['Service ceiling', 6400, 'alt'], ['Crew', 2, 'none']],
    [{ n: '23 mm chin cannon', eff: 2000, max: 3000, mv: 715 },
     { n: 'HJ-10 ATGM', eff: 10000, max: 10000, mv: 500 },
     { n: 'TY-90 air-to-air', eff: 6000, max: 6000, mv: 700 }]);

  m('milheli', 'Sikorsky MH-60R Seahawk', 'United States', 'Naval anti-submarine and anti-surface',
    [['Cruise', kmh(270)], ['Maximum', kmh(330)]],
    [['Range', km(830), 'dist'], ['Endurance', 3.3, 'none', 'hours'], ['Service ceiling', 3580, 'alt']],
    [{ n: 'Mk 54 lightweight torpedo', eff: 9000, max: 9000, mv: 20 },
     { n: 'AGM-114 Hellfire', eff: 8000, max: 11000, mv: 425 },
     { n: 'Dipping sonar and sonobuoys', eff: 0, max: 0, mv: 0 }]);

  m('milheli', 'Kamov Ka-27 / Ka-29', 'Russia', 'Naval helicopter, coaxial rotor',
    [['Cruise', kmh(230)], ['Maximum', kmh(270)]],
    [['Range', km(800), 'dist'], ['Service ceiling', 5000, 'alt'], ['Troops (Ka-29)', 16, 'none']],
    [{ n: '9K114 Shturm ATGM (Ka-29)', eff: 5000, max: 5000, mv: 345 },
     { n: 'Torpedoes and depth charges (Ka-27)', eff: 8000, max: 8000, mv: 20 }],
    'Coaxial rotors mean no tail rotor and a very small folded footprint, which is why Russian ships carry them.');

  /* ══ naval ═══════════════════════════════════════════════════════════ */

  m('navy', 'Type 055 Renhai', 'China', 'Guided missile cruiser',
    [['Maximum', kn(30)], ['Cruise', kn(18)]],
    [['Range at 18 kn', nmi(5000), 'dist'], ['Full displacement', t(13000), 'mass'], ['Crew', 300, 'none'],
     ['VLS cells', 112, 'none']],
    [{ n: 'H/PJ-38 130 mm gun', eff: 30000, max: 30000, mv: 900 },
     { n: 'HHQ-9B surface-to-air', eff: 200000, max: 200000, mv: 1400 },
     { n: 'YJ-18 anti-ship', eff: 540000, max: 540000, mv: 1000 },
     { n: 'YJ-21 hypersonic anti-ship', eff: 1500000, max: 1500000, mv: 3400 },
     { n: 'CJ-10 land attack', eff: 1500000, max: 1500000, mv: 250 }],
    'The largest surface combatant built outside the United States since the Cold War.');

  m('navy', 'Type 052D Luyang III', 'China', 'Guided missile destroyer',
    [['Maximum', kn(30)]],
    [['Range', nmi(4500), 'dist'], ['Full displacement', t(7500), 'mass'], ['VLS cells', 64, 'none']],
    [{ n: 'H/PJ-38 130 mm gun', eff: 30000, max: 30000, mv: 900 },
     { n: 'HHQ-9 surface-to-air', eff: 200000, max: 200000, mv: 1400 },
     { n: 'YJ-18 anti-ship', eff: 540000, max: 540000, mv: 1000 }]);

  m('navy', 'Kirov-class (Admiral Nakhimov)', 'Russia', 'Nuclear battlecruiser, largest surface combatant afloat',
    [['Maximum', kn(32)]],
    [['Range', nmi(0), 'dist', 'effectively unlimited, nuclear'], ['Full displacement', t(28000), 'mass'],
     ['Crew', 710, 'none']],
    [{ n: 'AK-130 130 mm twin gun', eff: 23000, max: 23000, mv: 850 },
     { n: 'P-700 Granit anti-ship (20)', eff: 625000, max: 625000, mv: 830 },
     { n: 'S-300F / S-400 naval SAM', eff: 250000, max: 250000, mv: 1400 },
     { n: '3M22 Zircon (after refit)', eff: 1000000, max: 1000000, mv: 2700 }]);

  m('navy', 'Queen Elizabeth-class carrier', 'United Kingdom', 'STOVL aircraft carrier',
    [['Maximum', kn(25)], ['Cruise', kn(15)]],
    [['Range', nmi(10000), 'dist'], ['Full displacement', t(65000), 'mass'], ['Crew', 700, 'none'],
     ['Aircraft', 40, 'none']],
    [{ n: 'Phalanx CIWS 20 mm', eff: 1500, max: 3600, mv: 1100 },
     { n: '30 mm and miniguns', eff: 3000, max: 5000, mv: 1000 }],
    'No catapults: it operates F-35B by ski-jump and vertical landing, which trades payload and range for flexibility of basing.');

  m('navy', 'Charles de Gaulle', 'France', 'Nuclear aircraft carrier, only one outside the US Navy',
    [['Maximum', kn(27)]],
    [['Full displacement', t(42500), 'mass'], ['Crew', 1350, 'none'], ['Aircraft', 40, 'none']],
    [{ n: 'Aster 15 surface-to-air', eff: 30000, max: 30000, mv: 1000 },
     { n: 'Mistral point defence', eff: 6000, max: 6000, mv: 800 }]);

  m('navy', 'Astute-class SSN', 'United Kingdom', 'Nuclear attack submarine',
    [['Submerged, maximum', kn(30)], ['Quiet patrol', kn(5)]],
    [['Displacement, submerged', t(7400), 'mass'], ['Crew', 98, 'none'], ['Test depth', 300, 'alt']],
    [{ n: 'Spearfish heavyweight torpedo', eff: 54000, max: 54000, mv: 40 },
     { n: 'Tomahawk land attack', eff: 1600000, max: 1600000, mv: 246 }]);

  m('navy', 'Suffren-class (Barracuda) SSN', 'France', 'Nuclear attack submarine',
    [['Submerged, maximum', kn(25)]],
    [['Displacement, submerged', t(5300), 'mass'], ['Crew', 65, 'none'], ['Test depth', 350, 'alt']],
    [{ n: 'F21 heavyweight torpedo', eff: 50000, max: 50000, mv: 25 },
     { n: 'MdCN naval cruise missile', eff: 1000000, max: 1000000, mv: 270 },
     { n: 'Exocet SM39', eff: 50000, max: 50000, mv: 315 }]);

  m('navy', 'Type 214 SSK', 'Germany', 'Air-independent-propulsion diesel submarine',
    [['Submerged, maximum', kn(20)], ['AIP patrol', kn(4)]],
    [['Submerged endurance on AIP', 21, 'none', 'days'], ['Displacement, submerged', t(1860), 'mass'],
     ['Crew', 27, 'none'], ['Test depth', 400, 'alt']],
    [{ n: 'DM2A4 heavyweight torpedo', eff: 50000, max: 50000, mv: 25 },
     { n: 'IDAS anti-air missile from submerged', eff: 20000, max: 20000, mv: 250 }],
    'Fuel cells let it stay under for weeks without snorkelling, which removes the classic way of finding a diesel boat.');

  m('navy', 'Zumwalt-class DDG', 'United States', 'Stealth guided missile destroyer',
    [['Maximum', kn(30)]],
    [['Full displacement', t(16000), 'mass'], ['Crew', 175, 'none'], ['VLS cells', 80, 'none']],
    [{ n: 'Conventional Prompt Strike hypersonic', eff: 2775000, max: 2775000, mv: 5000 },
     { n: 'Tomahawk land attack', eff: 1600000, max: 1600000, mv: 246 },
     { n: 'SM-6', eff: 370000, max: 460000, mv: 1200 }],
    'Radar cross-section reportedly comparable to a fishing boat despite being larger than most cruisers.');

  m('navy', 'FREMM frigate', 'France / Italy', 'Multipurpose frigate',
    [['Maximum', kn(27)], ['Cruise', kn(15)]],
    [['Range at 15 kn', nmi(6000), 'dist'], ['Full displacement', t(6000), 'mass'], ['Crew', 145, 'none']],
    [{ n: '76 mm or 127 mm gun', eff: 30000, max: 30000, mv: 925 },
     { n: 'Aster 30', eff: 120000, max: 120000, mv: 1400 },
     { n: 'Exocet MM40 / Teseo', eff: 200000, max: 200000, mv: 315 },
     { n: 'MdCN cruise missile', eff: 1000000, max: 1000000, mv: 270 }]);

  m('navy', 'Iranian fast attack craft (IRGC)', 'Iran', 'Swarming small combatant',
    [['Maximum', kn(60)], ['Cruise', kn(30)]],
    [['Range', nmi(500), 'dist'], ['Displacement', t(15), 'mass'], ['Crew', 5, 'none']],
    [{ n: 'Nasir / Kowsar anti-ship missile', eff: 30000, max: 90000, mv: 300 },
     { n: '107 mm rocket launchers', eff: 8000, max: 8000, mv: 380 },
     { n: '12.7 mm and 23 mm guns', eff: 2000, max: 6800, mv: 890 }],
    'Individually trivial. The doctrine is saturation in confined water: the Strait of Hormuz is 39 km wide at its narrowest.');

  /* ══ drones & unmanned systems ═══════════════════════════════════════ */

  m('uas', 'Shahed-129', 'Iran', 'Medium-altitude long-endurance armed UAS',
    [['Cruise', kmh(150)], ['Maximum', kmh(200)]],
    [['Endurance', 24, 'none', 'hours'], ['Range', km(1700), 'dist'], ['Service ceiling', 7300, 'alt'],
     ['Payload', 400, 'mass'], ['Wingspan', 16, 'length']],
    [{ n: 'Sadid-345 guided bomb (4)', eff: 6000, max: 6000, mv: 200 }],
    null,
    [{ n: 'Electro-optical turret', ch: 'Thermal + day', detect: 15000, recognise: 8000, identify: 4000 }]);

  m('uas', 'Shahed-131', 'Iran', 'Loitering munition, smaller Shahed',
    [['Cruise', kmh(180)]],
    [['Range', km(900), 'dist'], ['Warhead', 15, 'mass'], ['Wingspan', 2.2, 'length']],
    [{ n: 'Fixed warhead', eff: 900000, max: 900000, mv: 50 }],
    'Same delta layout as the Shahed-136 at about two-thirds scale and half the range.');

  m('uas', 'Mohajer-6', 'Iran', 'Tactical armed UAS',
    [['Cruise', kmh(150)], ['Maximum', kmh(200)]],
    [['Endurance', 12, 'none', 'hours'], ['Range', km(200), 'dist'], ['Service ceiling', 5400, 'alt'],
     ['Payload', 100, 'mass'], ['Wingspan', 10, 'length']],
    [{ n: 'Qaem-1 / Almas guided munition (4)', eff: 6000, max: 8000, mv: 200 }],
    null,
    [{ n: 'Gyro-stabilised turret', ch: 'Thermal + day', detect: 12000, recognise: 6000, identify: 3000 }]);

  m('uas', 'Mohajer-10', 'Iran', 'Long-endurance armed UAS',
    [['Cruise', kmh(210)]],
    [['Endurance', 24, 'none', 'hours'], ['Range', km(2000), 'dist'], ['Service ceiling', 7000, 'alt'],
     ['Payload', 300, 'mass']],
    [{ n: 'Guided munitions', eff: 8000, max: 8000, mv: 200 }],
    'Claimed performance. Independent confirmation is limited.');

  m('uas', 'Ababil-3', 'Iran', 'Tactical reconnaissance and strike UAS',
    [['Cruise', kmh(200)]],
    [['Endurance', 4, 'none', 'hours'], ['Range', km(100), 'dist'], ['Service ceiling', 5000, 'alt']],
    [{ n: 'Guided bombs', eff: 5000, max: 5000, mv: 200 }]);

  m('uas', 'Arash-2', 'Iran', 'Long-range loitering munition',
    [['Cruise', kmh(300)]],
    [['Range', km(2000), 'dist'], ['Warhead', 260, 'mass']],
    [{ n: 'Fixed warhead', eff: 2000000, max: 2000000, mv: 83 }],
    'Larger warhead and higher speed than the Shahed-136, produced in far smaller numbers.');

  m('uas', 'CH-5 Rainbow', 'China', 'Medium-altitude long-endurance armed UAS',
    [['Cruise', kmh(220)], ['Maximum', kmh(300)]],
    [['Endurance', 60, 'none', 'hours'], ['Range', km(6500), 'dist'], ['Service ceiling', 9000, 'alt'],
     ['Payload', 1000, 'mass'], ['Wingspan', 21, 'length']],
    [{ n: 'AR-1 / AR-2 missiles (16 hardpoints)', eff: 10000, max: 10000, mv: 300 },
     { n: 'FT-9 / FT-10 guided bombs', eff: 10000, max: 10000, mv: 300 }],
    null,
    [{ n: 'Electro-optical turret and SAR', ch: 'Thermal + day + radar', detect: 30000, recognise: 15000, identify: 8000 }]);

  m('uas', 'GJ-11 Sharp Sword', 'China', 'Stealth unmanned combat air vehicle',
    [['Cruise', kmh(800)]],
    [['Range', km(4000), 'dist'], ['Service ceiling', 12000, 'alt'], ['Payload', t(2), 'mass']],
    [{ n: 'Internal precision-guided munitions', eff: 100000, max: 100000, mv: 300 }],
    'Flying wing with internal weapons bays: built to penetrate defended airspace rather than loiter over permissive airspace.');

  m('uas', 'Bayraktar TB3', 'Türkiye', 'Carrier-capable armed UAS, folding wing',
    [['Cruise', kmh(220)], ['Maximum', kmh(300)]],
    [['Endurance', 24, 'none', 'hours'], ['Service ceiling', 9100, 'alt'], ['Payload', 280, 'mass']],
    [{ n: 'MAM-L / MAM-T', eff: 14000, max: 30000, mv: 200 }],
    'Designed to fly from a short-deck amphibious ship, which puts strike aircraft on vessels that could never operate manned jets.');

  m('uas', 'Bayraktar Kizilelma', 'Türkiye', 'Unmanned combat air vehicle, jet powered',
    [['Cruise', kmh(800)], ['Maximum', kmh(900)]],
    [['Range', km(930), 'dist'], ['Endurance', 5, 'none', 'hours'], ['Service ceiling', 10600, 'alt'],
     ['Payload', t(1.5), 'mass']],
    [{ n: 'Gökdogan air-to-air', eff: 65000, max: 65000, mv: 1200 },
     { n: 'Precision-guided munitions', eff: 100000, max: 100000, mv: 300 }]);

  m('uas', 'Anka-3', 'Türkiye', 'Stealth flying-wing combat UAS',
    [['Cruise', kmh(700)]],
    [['Endurance', 10, 'none', 'hours'], ['Service ceiling', 12000, 'alt'], ['Payload', t(1.2), 'mass']],
    [{ n: 'Internal guided munitions', eff: 100000, max: 100000, mv: 300 }]);

  m('uas', 'IAI Heron TP', 'Israel', 'High-altitude long-endurance UAS',
    [['Cruise', kmh(220)], ['Maximum', kmh(370)]],
    [['Endurance', 36, 'none', 'hours'], ['Service ceiling', 13700, 'alt'], ['Payload', t(2.7), 'mass'],
     ['Wingspan', 26, 'length']],
    null, null,
    [{ n: 'Multi-sensor payload', ch: 'Thermal + day + SAR + SIGINT', detect: 40000, recognise: 20000, identify: 10000 }]);

  m('uas', 'Elbit Hermes 900', 'Israel', 'Medium-altitude long-endurance UAS',
    [['Cruise', kmh(200)]],
    [['Endurance', 36, 'none', 'hours'], ['Service ceiling', 9100, 'alt'], ['Payload', 350, 'mass']],
    [{ n: 'Guided munitions', eff: 8000, max: 8000, mv: 200 }],
    null,
    [{ n: 'DCoMPASS turret', ch: 'Thermal + day + laser', detect: 25000, recognise: 12000, identify: 6000 }]);

  m('uas', 'IAI Harpy', 'Israel', 'Anti-radiation loitering munition',
    [['Cruise', kmh(185)]],
    [['Range', km(500), 'dist'], ['Endurance', 9, 'none', 'hours'], ['Warhead', 32, 'mass']],
    [{ n: 'Fixed warhead, radar homing', eff: 500000, max: 500000, mv: 51 }],
    'Homes on radar emissions autonomously. It is a reason modern air-defence radars emit in short bursts and move.');

  m('uas', 'Hero-120', 'Israel', 'Man-portable loitering munition',
    [['Cruise', kmh(100)], ['Dash', kmh(185)]],
    [['Range', km(60), 'dist'], ['Endurance', 1, 'none', 'hour'], ['Warhead', 4.5, 'mass']],
    [{ n: 'Multi-purpose warhead', eff: 60000, max: 60000, mv: 28 }]);

  m('uas', 'Warmate', 'Poland', 'Man-portable loitering munition',
    [['Cruise', kmh(80)], ['Dash', kmh(150)]],
    [['Range', km(30), 'dist'], ['Endurance', 0.83, 'none', 'hours'], ['Warhead', 1.4, 'mass']],
    [{ n: 'HEAT or fragmentation warhead', eff: 30000, max: 30000, mv: 22 }]);

  m('uas', 'KUB-BLA', 'Russia', 'Loitering munition',
    [['Cruise', kmh(130)]],
    [['Range', km(40), 'dist'], ['Endurance', 0.5, 'none', 'hours'], ['Warhead', 3, 'mass']],
    [{ n: 'Fixed warhead', eff: 40000, max: 40000, mv: 36 }]);

  m('uas', 'Orion (Inokhodets)', 'Russia', 'Medium-altitude long-endurance armed UAS',
    [['Cruise', kmh(120)], ['Maximum', kmh(200)]],
    [['Endurance', 24, 'none', 'hours'], ['Service ceiling', 7500, 'alt'], ['Payload', 250, 'mass']],
    [{ n: 'KAB-20 / Kh-50 guided munitions', eff: 10000, max: 10000, mv: 250 }]);

  m('uas', 'S-70 Okhotnik', 'Russia', 'Heavy stealth unmanned combat air vehicle',
    [['Cruise', kmh(800)], ['Maximum', kmh(1000)]],
    [['Range', km(6000), 'dist'], ['Service ceiling', 10500, 'alt'], ['Payload', t(2.8), 'mass'],
     ['Take-off weight', t(20), 'mass']],
    [{ n: 'Internal guided munitions', eff: 100000, max: 100000, mv: 300 }]);

  m('uas', 'Boeing MQ-28 Ghost Bat', 'Australia', 'Loyal wingman combat UAS',
    [['Cruise', kmh(850)]],
    [['Range', km(3700), 'dist'], ['Service ceiling', 12000, 'alt']],
    null,
    'Designed to fly alongside crewed fighters, absorbing the risk of going first into defended airspace.');

  m('uas', 'Kratos XQ-58 Valkyrie', 'United States', 'Attritable jet combat UAS',
    [['Cruise', kmh(890)], ['Maximum', kmh(1050)]],
    [['Range', km(5600), 'dist'], ['Service ceiling', 13700, 'alt'], ['Payload', 545, 'mass']],
    [{ n: 'Internal small diameter bombs', eff: 110000, max: 110000, mv: 300 }],
    'Deliberately cheap enough to lose: no landing gear, it is rail-launched and recovered by parachute.');

  m('uas', 'AeroVironment RQ-11 Raven', 'United States', 'Hand-launched reconnaissance UAS',
    [['Cruise', kmh(50)], ['Maximum', kmh(95)]],
    [['Endurance', 1.5, 'none', 'hours'], ['Range', km(10), 'dist'], ['Weight', 1.9, 'mass']],
    null, null,
    [{ n: 'Nose camera, day or thermal', ch: 'Day TV or thermal', detect: 3000, recognise: 1500, identify: 600 }]);

  m('uas', 'AeroVironment Puma AE', 'United States', 'Small tactical reconnaissance UAS',
    [['Cruise', kmh(45)], ['Maximum', kmh(83)]],
    [['Endurance', 2.5, 'none', 'hours'], ['Range', km(20), 'dist'], ['Weight', 6.8, 'mass']],
    null, null,
    [{ n: 'Mantis i45 gimbal', ch: 'Thermal + day + laser illuminator', detect: 6000, recognise: 3000, identify: 1200 }]);

  m('uas', 'Skydio X10D', 'United States', 'Autonomous small reconnaissance quadcopter',
    [['Cruise', kmh(45)], ['Maximum', kmh(72)]],
    [['Endurance', 0.6, 'none', 'hours'], ['Range', km(10), 'dist'], ['Weight', 2.3, 'mass']],
    null,
    'Obstacle avoidance good enough to fly inside buildings and under canopy without a skilled pilot.',
    [{ n: 'Sensor package', ch: 'Thermal + day + 48× zoom', detect: 5000, recognise: 2500, identify: 1000 }]);

  /* ══ missiles: Iran ══════════════════════════════════════════════════ */

  function msl(n, country, d, speeds, specs, note) {
    C.add({ cat: 'mil', sub: 'missile', n: n, d: country + ' · ' + d, country: country, speeds: speeds, specs: specs, note: note });
  }

  /* defined in catalog-military.js, which loads first */
  var strat = window.ART_STRAT_MSL;

  msl('Shahab-3', 'Iran', 'Medium-range ballistic missile',
    [['Terminal speed', 2100]],
    [['Range', km(1300), 'dist'], ['Warhead', 760, 'mass'], ['Accuracy (CEP)', 2000, 'dist'],
     ['Apogee', km(300), 'alt']],
    'Derived from the North Korean Nodong. Liquid fuelled, so it must be fuelled before launch, which takes time and is visible.');

  msl('Ghadr-110', 'Iran', 'Medium-range ballistic missile, improved Shahab',
    [['Terminal speed', 2400]],
    [['Range', km(1800), 'dist'], ['Warhead', 750, 'mass'], ['Accuracy (CEP)', 300, 'dist']],
    'Shorter fuelling time than the Shahab-3 and a separating warhead.');

  msl('Emad', 'Iran', 'Medium-range ballistic missile, manoeuvring warhead',
    [['Terminal speed', 2400]],
    [['Range', km(1700), 'dist'], ['Warhead', 750, 'mass'], ['Accuracy (CEP)', 50, 'dist']],
    'First Iranian missile with a manoeuvring reentry vehicle, which both improves accuracy and complicates interception.');

  msl('Sejjil-2', 'Iran', 'Solid-fuel medium-range ballistic missile',
    [['Terminal speed', 2800]],
    [['Range', km(2000), 'dist'], ['Warhead', 700, 'mass'], ['Accuracy (CEP)', 200, 'dist']],
    'Solid fuel matters more than range: it can be stored fuelled and launched in minutes rather than hours.');

  msl('Khorramshahr-4 (Kheibar)', 'Iran', 'Medium-range ballistic missile, heaviest warhead',
    [['Terminal speed', 3000]],
    [['Range', km(2000), 'dist'], ['Warhead', 1500, 'mass'], ['Accuracy (CEP)', 30, 'dist']],
    'Claimed figures. The 1500 kg warhead is the largest on any Iranian missile.');

  msl('Kheibar Shekan', 'Iran', 'Solid-fuel medium-range ballistic missile',
    [['Terminal speed', 2600]],
    [['Range', km(1450), 'dist'], ['Warhead', 500, 'mass'], ['Accuracy (CEP)', 30, 'dist']],
    'Manoeuvring reentry vehicle and a composite airframe. Presented as designed specifically to defeat missile defences.');

  msl('Fattah-1', 'Iran', 'Claimed hypersonic ballistic missile',
    [['Claimed terminal speed', 4800]],
    [['Range', km(1400), 'dist'], ['Warhead', 350, 'mass'], ['Claimed maximum Mach', 14, 'none']],
    'Presented as hypersonic. Analysts note that any ballistic reentry vehicle exceeds Mach 5, so the meaningful question is whether it manoeuvres at that speed, which is unverified.');

  msl('Fattah-2', 'Iran', 'Claimed hypersonic glide vehicle',
    [['Claimed cruise speed', 2400]],
    [['Range', km(1500), 'dist'], ['Claimed maximum Mach', 7, 'none']],
    'Displayed as a glide vehicle on a liquid-fuel booster. No confirmed flight test at full range.');

  msl('Qiam-1', 'Iran', 'Short-range ballistic missile, no fins',
    [['Terminal speed', 1800]],
    [['Range', km(800), 'dist'], ['Warhead', 650, 'mass'], ['Accuracy (CEP)', 500, 'dist']],
    'Finless airframe, which reduces radar cross-section and simplifies storage.');

  msl('Fateh-110', 'Iran', 'Solid-fuel short-range ballistic missile',
    [['Terminal speed', 1400]],
    [['Range', km(300), 'dist'], ['Warhead', 650, 'mass'], ['Accuracy (CEP)', 100, 'dist']],
    'The base of a large family and the most widely proliferated Iranian ballistic missile.');

  msl('Fateh-313', 'Iran', 'Extended-range Fateh, composite motor',
    [['Terminal speed', 1500]],
    [['Range', km(500), 'dist'], ['Warhead', 500, 'mass'], ['Accuracy (CEP)', 50, 'dist']]);

  msl('Zolfaghar', 'Iran', 'Short-range ballistic missile, submunition capable',
    [['Terminal speed', 1600]],
    [['Range', km(700), 'dist'], ['Warhead', 580, 'mass'], ['Accuracy (CEP)', 30, 'dist']]);

  msl('Dezful', 'Iran', 'Extended-range Zolfaghar',
    [['Terminal speed', 1700]],
    [['Range', km(1000), 'dist'], ['Warhead', 600, 'mass']]);

  msl('Haj Qasem', 'Iran', 'Solid-fuel medium-range ballistic missile',
    [['Terminal speed', 2400]],
    [['Range', km(1400), 'dist'], ['Warhead', 500, 'mass'], ['Accuracy (CEP)', 30, 'dist']]);

  msl('Raad-500', 'Iran', 'Short-range ballistic missile, composite motor',
    [['Terminal speed', 1600]],
    [['Range', km(500), 'dist'], ['Warhead', 500, 'mass']],
    'Composite motor casing cuts weight by half against the Fateh-110 for the same thrust.');

  msl('Khalij Fars', 'Iran', 'Anti-ship ballistic missile',
    [['Terminal speed', 1000]],
    [['Range', km(300), 'dist'], ['Warhead', 650, 'mass'], ['Accuracy (CEP)', 30, 'dist']],
    'Electro-optical terminal seeker for a moving ship. The concept that makes narrow waters dangerous for large surface vessels.');

  msl('Paveh', 'Iran', 'Long-range land-attack cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(1650), 'dist'], ['Warhead', 250, 'mass'], ['Cruise altitude', 100, 'alt']],
    'Terrain-following at low level. A cruise missile flies under the radar horizon, so it is detected far later than a ballistic missile.');

  msl('Soumar', 'Iran', 'Land-attack cruise missile, Kh-55 derivative',
    [['Cruise speed', 260]],
    [['Range', km(1350), 'dist'], ['Warhead', 400, 'mass']]);

  msl('Quds-1 / Quds-2', 'Iran / Yemen', 'Small land-attack cruise missile',
    [['Cruise speed', 190]],
    [['Range', km(800), 'dist'], ['Warhead', 200, 'mass']],
    'Small, cheap and hard to see on radar. Used against oil infrastructure, where a small warhead on the right valve is enough.');

  /* ══ missiles: recent and in-service-now ═════════════════════════════
     Systems that have entered use, or been used in anger, since the bulk of
     this catalogue was written. Grouped here rather than scattered so it is
     obvious what is new. */

  msl('PrSM (Precision Strike Missile)', 'United States', 'Surface-to-surface missile, ATACMS replacement',
    [['Terminal speed', 1700]],
    [['Range', km(500), 'dist'], ['Warhead', 90, 'mass'],
     ['Rounds per HIMARS pod', 2, 'none', 'twice the ATACMS load']],
    'Two to a pod where ATACMS took one, which doubles the salvo a launcher carries without changing the launcher. Later increments add a seeker for moving ships.');

  msl('GLSDB', 'United States / Sweden', 'Ground-launched small diameter bomb',
    [['Glide speed', 250]],
    [['Range', km(150), 'dist'], ['Warhead', 93, 'mass'], ['Accuracy (CEP)', 1, 'dist']],
    'A glide bomb bolted to a rocket motor and fired from a HIMARS pod. It can fly a curved path and attack from behind, which is unusual for anything in this class and awkward for air defence sited to face the threat axis.');

  msl('Flamingo (FP-5)', 'Ukraine', 'Long-range land-attack cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(3000), 'dist'], ['Warhead', 1150, 'mass']],
    'Revealed 2025. A very large warhead on a comparatively simple airframe: the design trades sophistication for reach and destructive weight, which is the sensible trade when the targets are fixed and deep.');

  msl('Neptune R-360', 'Ukraine', 'Anti-ship and land-attack cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(400), 'dist'], ['Warhead', 150, 'mass'], ['Sea-skimming altitude', 5, 'alt']],
    'Sea-skimming, developed from the Soviet Kh-35 and best known for the sinking of the Moskva in April 2022. Later versions add a land-attack mode.');

  msl('Barracuda-500', 'United States', 'Autonomous air-launched cruise munition',
    [['Cruise speed', 200]],
    [['Range', km(925), 'dist'], ['Warhead', 45, 'mass']],
    'Built to be produced in quantity and to co-operate in groups rather than fly alone, which is the direction cheap strike is moving.');

  msl('Rampage', 'Israel', 'Air-launched supersonic stand-off missile',
    [['Terminal speed', 1000]],
    [['Range', km(190), 'dist'], ['Warhead', 150, 'mass'], ['Accuracy (CEP)', 10, 'dist']],
    'A rocket artillery round adapted to launch from an aircraft: fast, GPS-guided and cheap enough to use against defended fixed targets where a cruise missile would be extravagant.');

  msl('SPEAR 3', 'United Kingdom', 'Air-launched miniature cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(140), 'dist'], ['Warhead', 10, 'mass']],
    'Small enough that a single fighter carries eight internally. Networked in flight, so a group can sort targets between themselves rather than each attacking what it was told to.');

  msl('Hero-400EC', 'Israel', 'Long-endurance loitering munition',
    [['Cruise speed', 50]],
    [['Range', km(150), 'dist'], ['Endurance', 2, 'none', 'hours'], ['Warhead', 10, 'mass']],
    'Loiters for hours, and the attack can be waved off and re-attacked, which is the practical difference between a loitering munition and a missile.');

  /* ══ missiles: Yemen ═════════════════════════════════════════════════
     Houthi-operated systems, most of them Iranian designs rebuilt or
     rebadged locally. They matter out of proportion to their sophistication
     because of where they are pointed: the Bab al-Mandab and the southern Red
     Sea, which is a route rather than a target, and because anti-ship
     ballistic missiles in the hands of a non-state operator changed the
     insurance and routing calculation for commercial shipping. Names and
     figures are the open published estimates and are less firm than for a
     state arsenal. */

  msl('Burkan-2H', 'Yemen', 'Short-range ballistic missile, Scud derivative',
    [['Terminal speed', 1500]],
    [['Range', km(1000), 'dist'], ['Warhead', 500, 'mass'], ['Accuracy (CEP)', 1000, 'dist']],
    'A lengthened, lightened Scud airframe: range bought by cutting warhead mass. Fired at Riyadh and at Saudi airports from 2017 onward, which is what put deep-strike capability into the picture in that theatre.');

  msl('Burkan-3', 'Yemen', 'Short-range ballistic missile',
    [['Terminal speed', 1600]],
    [['Range', km(1200), 'dist'], ['Warhead', 500, 'mass']],
    'Separating warhead, which complicates interception because the spent body and the warhead present two tracks.');

  msl('Badr-1P', 'Yemen', 'Guided artillery rocket',
    [['Flight speed', 900]],
    [['Range', km(160), 'dist'], ['Warhead', 175, 'mass', 'fragmentation, airburst']],
    'An airburst fragmentation rocket used against airfields and troop concentrations rather than structures. Cheap, and produced in numbers that make interception uneconomic.');

  msl('Zulfiqar', 'Yemen', 'Medium-range ballistic missile',
    [['Terminal speed', 1800]],
    [['Range', km(1500), 'dist'], ['Warhead', 450, 'mass']],
    'Yemeni designation for a Qiam derivative. Used against targets in the UAE in January 2022 and later toward Israel, which is the range bracket that makes it a regional rather than a border weapon.');

  msl('Asef', 'Yemen', 'Short-range ballistic missile',
    [['Terminal speed', 1400]],
    [['Range', km(450), 'dist'], ['Warhead', 300, 'mass']]);

  msl('Tankil', 'Yemen', 'Short-range ballistic missile with terminal guidance',
    [['Terminal speed', 1500]],
    [['Range', km(500), 'dist'], ['Warhead', 250, 'mass']],
    'Manoeuvring reentry, which is the feature that makes a cheap ballistic missile hard for point-defence to engage.');

  msl('Mohit', 'Yemen', 'Coastal surface-to-air missile, SA-2 derivative',
    [['Flight speed', 1000]],
    [['Intercept range', km(45), 'dist'], ['Intercept ceiling', 20000, 'alt']],
    'An old Soviet S-75 adapted to a mobile launcher. Obsolete against modern aircraft, still capable against a slow or unaware one.');

  msl('Sayyad / Saqr anti-ship ballistic missile', 'Yemen', 'Anti-ship ballistic missile',
    [['Terminal speed', 1800]],
    [['Range', km(300), 'dist'], ['Warhead', 300, 'mass']],
    'The capability that changed Red Sea shipping risk: a ballistic missile with a terminal seeker, fired at a moving vessel by a non-state operator. Accuracy is poor by naval standards and entirely sufficient against a laden merchant hull.');

  msl('Sejjil (Yemeni)', 'Yemen', 'Anti-ship cruise missile',
    [['Cruise speed', 240]],
    [['Range', km(180), 'dist'], ['Warhead', 150, 'mass'], ['Sea-skimming altitude', 5, 'alt']],
    'Sea-skimming profile keeps it under the radar horizon of a merchant vessel until the last few kilometres, which is inside the time any civilian crew could react.');

  msl('Noor / Ghader', 'Iran', 'Anti-ship cruise missile, C-802 derivative',
    [['Cruise speed', 250]],
    [['Range, Noor', km(120), 'dist'], ['Range, Ghader', km(300), 'dist'], ['Warhead', 165, 'mass'],
     ['Sea-skimming altitude', 5, 'alt']]);

  msl('Abu Mahdi', 'Iran', 'Long-range anti-ship cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(1000), 'dist'], ['Warhead', 200, 'mass']]);

  msl('Bavar-373', 'Iran', 'Long-range surface-to-air system',
    [['Flight speed', 2500]],
    [['Intercept range', km(300), 'dist'], ['Intercept ceiling', 27000, 'alt'],
     ['Detection range', km(450), 'dist']],
    'Domestic answer to the S-300. Performance against manoeuvring or low-observable targets is untested in the open record.');

  msl('Khordad-15', 'Iran', 'Medium-range surface-to-air system',
    [['Flight speed', 1200]],
    [['Intercept range, aircraft', km(120), 'dist'], ['Intercept range, low-observable', km(85), 'dist'],
     ['Intercept ceiling', 27000, 'alt']],
    'The system credited with downing an RQ-4 Global Hawk in 2019.');

  msl('Toophan', 'Iran', 'Anti-tank guided missile, TOW derivative',
    [['Flight speed', 300]],
    [['Effective range', 3850, 'dist'], ['Warhead', 3.6, 'mass']]);

  msl('Almas', 'Iran', 'Fire-and-forget anti-tank missile',
    [['Flight speed', 200]],
    [['Effective range', 4000, 'dist'], ['Range, air-launched', 8000, 'dist'], ['Warhead', 4, 'mass']],
    'Electro-optical seeker with a lock-on-before-launch profile, closely comparable to the Israeli Spike.');

  /* ══ missiles: intercontinental and strategic ════════════════════════ */

  strat('RS-28 Sarmat', 'Russia', 'Heavy intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(18000), 'dist'], ['Throw weight', t(10), 'mass'], ['Warheads', 10, 'none', 'MIRV, or Avangard glide vehicles'],
     ['Launch weight', t(208), 'mass']],
    'Range allows southern-polar trajectories that avoid the northern early-warning and interceptor arc entirely. Test history has been troubled.');

  strat('RS-24 Yars', 'Russia', 'Solid-fuel intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(12000), 'dist'], ['Warheads', 4, 'none', 'MIRV'], ['Accuracy (CEP)', 150, 'dist'],
     ['Launch weight', t(49), 'mass']],
    'Silo and road-mobile. A mobile launcher is far harder to target than a fixed silo, which is the point.');

  strat('RT-2PM2 Topol-M', 'Russia', 'Single-warhead intercontinental ballistic missile',
    [['Terminal reentry speed', 7300]],
    [['Range', km(11000), 'dist'], ['Warhead', 800, 'mass'], ['Accuracy (CEP)', 200, 'dist']]);

  strat('RSM-56 Bulava', 'Russia', 'Submarine-launched ballistic missile',
    [['Terminal reentry speed', 6000]],
    [['Range', km(9300), 'dist'], ['Warheads', 6, 'none', 'MIRV'], ['Launch weight', t(36.8), 'mass']]);

  strat('R-29RMU2 Sineva / Layner', 'Russia', 'Liquid-fuel submarine-launched ballistic missile',
    [['Terminal reentry speed', 6500]],
    [['Range', km(11500), 'dist'], ['Warheads', 8, 'none', 'MIRV']]);

  strat('DF-41', 'China', 'Road-mobile intercontinental ballistic missile',
    [['Terminal reentry speed', 7500]],
    [['Range', km(14000), 'dist'], ['Warheads', 10, 'none', 'MIRV'], ['Accuracy (CEP)', 100, 'dist'],
     ['Launch weight', t(80), 'mass']],
    'The longest-ranged Chinese missile and the core of its road-mobile deterrent.');

  strat('DF-31AG', 'China', 'Road-mobile intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(11200), 'dist'], ['Warhead', 1050, 'mass'], ['Accuracy (CEP)', 150, 'dist']]);

  strat('DF-5B', 'China', 'Silo-based heavy intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(13000), 'dist'], ['Warheads', 5, 'none', 'MIRV'], ['Launch weight', t(183), 'mass']],
    'Liquid fuelled and silo based: powerful but slow to ready and easy to locate.');

  strat('JL-3', 'China', 'Submarine-launched ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(10000), 'dist'], ['Warheads', 3, 'none', 'MIRV']]);

  msl('DF-17', 'China', 'Hypersonic glide vehicle on a ballistic booster',
    [['Glide speed', 3400]],
    [['Range', km(2000), 'dist'], ['Maximum Mach', 10, 'none'], ['Glide altitude', 60000, 'alt']],
    'The glide vehicle manoeuvres through the mid-course, so its impact point cannot be predicted from the boost phase the way a ballistic trajectory can.');

  msl('DF-21D', 'China', 'Anti-ship ballistic missile',
    [['Terminal speed', 3400]],
    [['Range', km(1500), 'dist'], ['Warhead', 600, 'mass'], ['Maximum Mach', 10, 'none']],
    'The original carrier-killer concept: a manoeuvring reentry vehicle with a terminal seeker, dependent on an over-the-horizon targeting chain.');

  msl('DF-26', 'China', 'Intermediate-range dual-capable ballistic missile',
    [['Terminal speed', 3400]],
    [['Range', km(4000), 'dist'], ['Warhead', 1800, 'mass']],
    'Nicknamed the Guam killer for its reach. Can be armed conventionally or with a nuclear warhead, which makes any launch ambiguous.');

  strat('Hwasong-15', 'North Korea', 'Intercontinental ballistic missile, liquid fuel',
    [['Terminal reentry speed', 7000]],
    [['Range', km(13000), 'dist'], ['Apogee, lofted test', km(4475), 'alt'], ['Launch weight', t(70), 'mass']],
    'Tested on a steeply lofted trajectory rather than at range, which is how a missile is proved without overflying another state.');

  strat('Hwasong-17', 'North Korea', 'Heavy intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(15000), 'dist'], ['Apogee, lofted test', km(6040), 'alt'], ['Launch weight', t(90), 'mass']]);

  strat('Hwasong-18', 'North Korea', 'Solid-fuel intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(15000), 'dist'], ['Apogee, lofted test', km(6648), 'alt']],
    'Solid fuel removes the fuelling window that gave warning of a liquid-fuel launch.');

  strat('Agni-V', 'India', 'Intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(7000), 'dist'], ['Warheads', 3, 'none', 'MIRV, tested 2024'], ['Launch weight', t(50), 'mass']]);

  msl('Agni-P', 'India', 'Medium-range ballistic missile, canisterised',
    [['Terminal reentry speed', 5000]],
    [['Range', km(2000), 'dist'], ['Warhead', 1000, 'mass']]);

  strat('K-4', 'India', 'Submarine-launched ballistic missile',
    [['Terminal reentry speed', 6000]],
    [['Range', km(3500), 'dist'], ['Warhead', 2000, 'mass']]);

  strat('M51', 'France', 'Submarine-launched ballistic missile',
    [['Terminal reentry speed', 6500]],
    [['Range', km(10000), 'dist'], ['Warheads', 6, 'none', 'MIRV'], ['Launch weight', t(52), 'mass']]);

  strat('LGM-35A Sentinel', 'United States', 'Intercontinental ballistic missile, Minuteman replacement',
    [['Terminal reentry speed', 7000]],
    [['Range', km(13000), 'dist'], ['Warhead', 350, 'mass']],
    'In development. Intended to replace the Minuteman III fleet, whose airframes date from the 1970s.');

  strat('Oreshnik', 'Russia', 'Intermediate-range ballistic missile, MIRV kinetic warheads',
    [['Terminal speed', 3400]],
    [['Range', km(5000), 'dist'], ['Range, shortest reported', km(800), 'dist'],
     ['Warheads', 6, 'none', 'MIRV, each carrying six submunitions'],
     ['Maximum Mach', 10, 'none']],
    'First used against Dnipro in November 2024, and the reason it matters is not its size but its type: an intermediate-range ballistic missile fired conventionally. The warheads carried no explosive worth the name and did their damage by arriving at ten times the speed of sound, which is a demonstration rather than a strike. Understood to derive from the RS-26 Rubezh. Flight time from Russian launch sites to central Europe is in single-digit minutes, which is the whole point of the weapon.');

  strat('Hwasong-19', 'North Korea', 'Solid-fuel intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', km(15000), 'dist'], ['Apogee, lofted test', km(7690), 'alt'],
     ['Launch weight', t(90), 'mass']],
    'Tested October 2024 to the highest apogee any missile has reached on a lofted trajectory. Solid fuel and canisterised, so there is no fuelling window to observe beforehand.');

  strat('DF-27', 'China', 'Hypersonic intermediate-range ballistic missile',
    [['Glide speed', 3400]],
    [['Range', km(8000), 'dist'], ['Maximum Mach', 10, 'none'], ['Glide altitude', 60000, 'alt']],
    'Carries a hypersonic glide vehicle, so its impact point cannot be read from the boost phase. The range bracket covers Guam and Hawaii from the mainland, which is what the design is for.');

  strat('LRHW Dark Eagle', 'United States', 'Land-based hypersonic glide weapon',
    [['Glide speed', 5800]],
    [['Range', km(2775), 'dist'], ['Maximum Mach', 17, 'none']],
    'A common glide body shared with the naval Conventional Prompt Strike round. Road-mobile on a trailer, conventional only, and intended for targets that move or are defended too heavily for a subsonic cruise missile.');

  strat('Avangard', 'Russia', 'Hypersonic glide vehicle on an ICBM booster',
    [['Glide speed', 6800]],
    [['Range', km(6000), 'dist', 'glide phase, atop an intercontinental booster'],
     ['Maximum Mach', 20, 'none'], ['Glide altitude', 50000, 'alt']],
    'Carried by the UR-100N and intended for the Sarmat. It manoeuvres throughout the glide, so a mid-course interceptor cannot be given a predicted point to fly to, which is the reason it exists.');

  /* ══ missiles: other notable ═════════════════════════════════════════ */

  msl('Kh-101 / Kh-102', 'Russia', 'Stealthy air-launched cruise missile',
    [['Cruise speed', 260]],
    [['Range', km(5500), 'dist'], ['Warhead', 450, 'mass'], ['Cruise altitude', 50, 'alt']],
    'Kh-102 is the nuclear-armed variant. Terrain following at very low level with a reduced radar cross-section.');

  msl('9M729 (SSC-8)', 'Russia', 'Ground-launched cruise missile',
    [['Cruise speed', 250]],
    [['Range', km(2500), 'dist'], ['Warhead', 450, 'mass']],
    'The system whose range dispute ended the Intermediate-Range Nuclear Forces Treaty in 2019.');

  msl('Taurus KEPD 350', 'Germany / Sweden', 'Stealth air-launched cruise missile',
    [['Cruise speed', 300]],
    [['Range', km(500), 'dist'], ['Warhead', 481, 'mass', 'MEPHISTO penetrator']],
    'Layered warhead with a void-counting fuze: it can be set to detonate on a chosen floor of a structure.');

  msl('AGM-158C LRASM', 'United States', 'Stealth long-range anti-ship missile',
    [['Cruise speed', 270]],
    [['Range', km(900), 'dist'], ['Warhead', 450, 'mass']],
    'Autonomous terminal targeting: it can find and classify a ship without a continuous data link.');

  msl('YJ-18', 'China', 'Anti-ship cruise missile, subsonic-supersonic',
    [['Cruise speed', 250], ['Terminal dash', 1000]],
    [['Range', km(540), 'dist'], ['Warhead', 300, 'mass'], ['Terminal Mach', 3, 'none']],
    'Cruises subsonic to save fuel, then sprints supersonic for the last 40 km, which compresses the defender reaction time.');

  msl('YJ-12', 'China', 'Supersonic anti-ship cruise missile',
    [['Cruise speed', 1000]],
    [['Range', km(400), 'dist'], ['Warhead', 205, 'mass'], ['Maximum Mach', 3, 'none']]);

  msl('Brimstone 3', 'United Kingdom', 'Precision anti-armour missile',
    [['Flight speed', 450]],
    [['Range, air-launched', 60000, 'dist'], ['Range, ground-launched', 40000, 'dist'], ['Warhead', 6.3, 'mass']],
    'Millimetre-wave and laser dual mode, salvo capable against a column with very low collateral radius.');

  msl('S-500 Prometey', 'Russia', 'Very-long-range air and missile defence',
    [['Flight speed', 5000]],
    [['Intercept range, aircraft', km(600), 'dist'], ['Intercept range, ballistic', km(600), 'dist'],
     ['Intercept ceiling', 200000, 'alt'], ['Detection range', km(800), 'dist']],
    'Claimed to engage targets in near space. Deployment numbers remain very small.');

  msl('S-300PMU-2 Favorit', 'Russia', 'Long-range surface-to-air system',
    [['Flight speed', 2000]],
    [['Intercept range', km(200), 'dist'], ['Intercept ceiling', 27000, 'alt'], ['Detection range', km(300), 'dist']]);

  msl('HQ-9B', 'China', 'Long-range surface-to-air system',
    [['Flight speed', 1400]],
    [['Intercept range', km(260), 'dist'], ['Intercept ceiling', 27000, 'alt']]);

  msl('Barak-8 / LR-SAM', 'Israel / India', 'Naval and land surface-to-air missile',
    [['Flight speed', 680]],
    [['Intercept range', km(150), 'dist'], ['Intercept ceiling', 16000, 'alt'], ['Maximum Mach', 2, 'none']]);

  msl("David's Sling", 'Israel', 'Medium to long-range air and missile defence',
    [['Flight speed', 2400]],
    [['Intercept range', km(300), 'dist'], ['Intercept ceiling', 15000, 'alt']],
    'Fills the gap between Iron Dome and Arrow: large rockets and cruise missiles rather than short-range artillery rockets.');

  msl('Arrow 3', 'Israel', 'Exo-atmospheric ballistic missile interceptor',
    [['Flight speed', 3000]],
    [['Intercept range', km(2400), 'dist'], ['Intercept altitude', 100000, 'alt'], ['Maximum Mach', 9, 'none']],
    'Intercepts outside the atmosphere, so a chemical or biological warhead is destroyed before it can disperse over the target.');

  msl('NASAMS', 'Norway / United States', 'Medium-range ground-based air defence',
    [['Flight speed', 1000]],
    [['Intercept range, AMRAAM-ER', km(50), 'dist'], ['Intercept ceiling', 20000, 'alt']],
    'Fires the same AMRAAM the fighters carry, from the ground. It defends the White House.');

  msl('IRIS-T SLM', 'Germany', 'Medium-range ground-based air defence',
    [['Flight speed', 1000]],
    [['Intercept range', km(40), 'dist'], ['Intercept ceiling', 20000, 'alt'], ['Maximum Mach', 3, 'none']]);

  msl('Starstreak', 'United Kingdom', 'Very short-range high-velocity air defence',
    [['Flight speed', 1360]],
    [['Effective range', 7000, 'dist'], ['Maximum Mach', 4, 'none'], ['Engagement ceiling', 5000, 'alt']],
    'Laser beam riding with three tungsten darts rather than a single warhead. Too fast to outrun and immune to infrared decoys.');

  msl('Mistral 3', 'France', 'Man-portable air defence missile',
    [['Flight speed', 930]],
    [['Effective range', 7000, 'dist'], ['Engagement ceiling', 3000, 'alt']]);

  msl('Piorun', 'Poland', 'Man-portable air defence missile',
    [['Flight speed', 660]],
    [['Effective range', 6500, 'dist'], ['Engagement ceiling', 4000, 'alt']],
    'Proximity fuze rather than contact only, so a near miss still works against a small drone.');

  msl('MMP (Akeron MP)', 'France', 'Man-portable fire-and-forget anti-tank missile',
    [['Flight speed', 200]],
    [['Effective range', 4000, 'dist'], ['Warhead', 5, 'mass']],
    'Fibre-optic link with a man-in-the-loop option, and soft launch that allows firing from inside a room.');

  msl('HJ-10', 'China', 'Heavy anti-tank guided missile',
    [['Flight speed', 500]],
    [['Effective range', 10000, 'dist'], ['Warhead', 10, 'mass']]);

})();
