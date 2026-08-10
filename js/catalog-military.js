/*
 * Artemidos - catalogue: military vehicles and systems
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Open-source reference data: published service fact sheets, manufacturer
 * brochures and standard reference works. Every entry carries mobility
 * (speed, range, endurance) AND armament, because in threat assessment the
 * question is never "how fast" on its own but "how fast, carrying what, and
 * out to what range".
 *
 * Ranges are stated as the published EFFECTIVE range (the range the system is
 * expected to hit at) and MAXIMUM range (the range the projectile physically
 * reaches) where both are known. They are not interchangeable.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var kn = function (x) { return x * 1852 / 3600; };
  var km = function (x) { return x * 1000; };
  var nmi = function (x) { return x * 1852; };
  var t = function (x) { return x * 1000; };

  C.cat({
    id: 'mil', n: 'Military systems', icon: 'tank',
    d: 'Mobility and armament: land, air, sea and unmanned',
    subs: [
      { id: 'tank', n: 'Main battle tanks', icon: 'tank' },
      { id: 'afv', n: 'Armoured & protected vehicles', icon: 'tank' },
      { id: 'arty', n: 'Artillery & mortars', icon: 'target' },
      { id: 'milair', n: 'Military aircraft', icon: 'plane' },
      { id: 'milheli', n: 'Military helicopters', icon: 'heli' },
      { id: 'navy', n: 'Naval vessels', icon: 'ship' },
      { id: 'uas', n: 'Military drones & UAS', icon: 'drone' },
      { id: 'missile', n: 'Missiles & rockets', icon: 'missile',
        d: 'Anti-tank, anti-air, anti-ship, cruise and theatre ballistic' },
      /* Strategic missiles sit apart from the rest. Nothing else in the
         catalogue crosses oceans in half an hour or carries a warhead whose
         effects are measured in kilometres, and mixing a Javelin in beside a
         Sarmat makes both harder to find. */
      { id: 'icbm', n: 'ICBMs & strategic missiles', icon: 'missile',
        d: 'Intercontinental and submarine-launched ballistic missiles' },
      { id: 'nuke', n: 'Nuclear & radiological', icon: 'trefoil',
        d: 'Yields, blast, thermal and fallout effects by distance' },
      /* the strategic layer: batteries that cover a city, and the
         interceptors built for warheads rather than aircraft */
      { id: 'sam', n: 'Air & missile defence systems', icon: 'shield',
        d: 'S-300/400/500, Patriot, THAAD, Aegis, HQ series, Arrow' }
    ]
  });

  function m(sub, n, country, d, speeds, specs, arms, note) {
    C.add({
      cat: 'mil', sub: sub, n: n, d: (country ? country + ' · ' : '') + d,
      country: country, speeds: speeds, specs: specs, arms: arms, note: note
    });
  }

  /* ── main battle tanks ────────────────────────────────────────────── */

  m('tank', 'M1A2 SEPv3 Abrams', 'United States', 'Main battle tank',
    [['Road, governed', kmh(67)], ['Cross-country', kmh(48)], ['Reverse', kmh(40)]],
    [['Operational range', km(426), 'dist'], ['Combat weight', t(66.8), 'mass'], ['Crew', 4, 'none'],
     ['Fuel capacity', 1900, 'volume', 'litres'], ['Vertical obstacle', 1.07, 'length'], ['Fording, unprepared', 1.22, 'length']],
    [{ n: 'M256 120 mm smoothbore', eff: 3000, max: 4000, mv: 1670, note: 'M829A4 APFSDS. Muzzle velocity falls to about 1410 m/s for M830A1 HEAT-MP.' },
     { n: 'M240 7.62 mm coaxial', eff: 800, max: 3725, mv: 853 },
     { n: 'M2HB 12.7 mm commander', eff: 1830, max: 6800, mv: 890 },
     { n: 'M240 7.62 mm loader', eff: 800, max: 3725, mv: 853 }],
    'A gas turbine drinks fuel at idle as well as on the move: planning figures must count hours running, not only distance covered.');

  m('tank', 'M10 Booker', 'United States', 'Assault gun, light armoured',
    [['Road', kmh(64)], ['Cross-country', kmh(40)]],
    [['Operational range', km(300), 'dist'], ['Combat weight', t(38), 'mass'], ['Crew', 4, 'none'],
     ['Engine power', 800, 'power', 'hp'], ['Air transportable', 1, 'none', 'one per C-17']],
    [{ n: 'M35 105 mm rifled', eff: 3000, max: 4000, mv: 1500, note: 'A 105 mm gun rather than the Abrams 120 mm: the round is lighter, so more are carried and the recoil suits a 38 tonne hull.' },
     { n: 'M240 7.62 mm coaxial', eff: 800, max: 3725, mv: 853 },
     { n: 'M2HB 12.7 mm commander', eff: 1830, max: 6800, mv: 890 }],
    'Officially not a tank, and the distinction is the point: it is an assault gun for infantry brigades, armoured against autocannon and not against tank rounds, sized to go where an Abrams cannot get to. The US Army announced in 2025 that it was ending the programme, so it is likely to remain a small fleet.');

  m('tank', 'Leopard 2A7', 'Germany', 'Main battle tank',
    [['Road', kmh(68)], ['Cross-country', kmh(50)], ['Reverse', kmh(31)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(67.5), 'mass'], ['Crew', 4, 'none'],
     ['Fuel capacity', 1160, 'volume', 'litres'], ['Fording, with preparation', 4, 'length']],
    [{ n: 'Rheinmetall Rh-120 L/55 120 mm', eff: 4000, max: 5000, mv: 1750, note: 'DM63 APFSDS. DM11 programmable HE out to 5 km.' },
     { n: 'MG3 / MG5 7.62 mm coaxial', eff: 1000, max: 3750, mv: 820 },
     { n: 'FLW 200 remote weapon station', eff: 1500, max: 6800, mv: 890, note: '12.7 mm or 40 mm AGL' }]);

  m('tank', 'Challenger 2', 'United Kingdom', 'Main battle tank',
    [['Road', kmh(59)], ['Cross-country', kmh(40)]],
    [['Operational range, road', km(550), 'dist'], ['Cross-country range', km(250), 'dist'],
     ['Combat weight', t(75), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'L30A1 120 mm rifled', eff: 3000, max: 5000, mv: 1534, note: 'The last rifled tank gun in NATO service. HESH gives an indirect-fire option out to about 8 km.' },
     { n: 'L94A1 7.62 mm chain gun coaxial', eff: 1100, max: 3750, mv: 862 },
     { n: 'L37A2 7.62 mm commander', eff: 1100, max: 3750, mv: 838 }],
    'Being replaced by Challenger 3, which adopts a 120 mm L/55A1 smoothbore for NATO ammunition commonality.');

  m('tank', 'Leclerc XLR', 'France', 'Main battle tank',
    [['Road', kmh(71)], ['Cross-country', kmh(55)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(57.4), 'mass'], ['Crew', 3, 'none'],
     ['Rate of fire', 12, 'none', 'rounds/min, autoloader']],
    [{ n: 'GIAT CN120-26 F1 120 mm L/52', eff: 4000, max: 5000, mv: 1750 },
     { n: '12.7 mm coaxial', eff: 1830, max: 6800, mv: 890 },
     { n: '7.62 mm remote', eff: 1000, max: 3750, mv: 830 }],
    'A three-man crew: the autoloader removes the loader, which is why the turret is smaller than a Leopard or Abrams.');

  m('tank', 'T-90M Proryv', 'Russia', 'Main battle tank',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Range, internal fuel', km(550), 'dist'], ['Range with external drums', km(700), 'dist'],
     ['Combat weight', t(48), 'mass'], ['Crew', 3, 'none']],
    [{ n: '2A46M-5 125 mm smoothbore', eff: 3000, max: 4000, mv: 1750, note: 'Svinets-2 APFSDS.' },
     { n: '9M119M Refleks gun-launched ATGM', eff: 5000, max: 5000, mv: 350, note: 'Fired through the main gun barrel. Laser beam riding.' },
     { n: 'PKTM 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 },
     { n: 'Kord 12.7 mm remote', eff: 2000, max: 6800, mv: 860 }]);

  m('tank', 'T-72B3M', 'Russia', 'Main battle tank, upgraded',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(46), 'mass'], ['Crew', 3, 'none']],
    [{ n: '2A46M-5 125 mm smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: '9M119 Svir gun-launched ATGM', eff: 4000, max: 4000, mv: 350 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 },
     { n: 'NSVT 12.7 mm', eff: 2000, max: 6000, mv: 845 }]);

  m('tank', 'T-80BVM', 'Russia', 'Gas-turbine main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(48)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(46), 'mass'], ['Crew', 3, 'none']],
    [{ n: '2A46M-4 125 mm smoothbore', eff: 2500, max: 4000, mv: 1700 },
     { n: '9M119M Refleks ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }]);

  m('tank', 'T-14 Armata', 'Russia', 'Main battle tank, unmanned turret',
    [['Road', kmh(80)], ['Cross-country', kmh(60)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(55), 'mass'], ['Crew', 3, 'none', 'all in a hull capsule']],
    [{ n: '2A82-1M 125 mm smoothbore', eff: 4000, max: 5000, mv: 1980, note: 'Vacuum-1 APFSDS. Highest published muzzle velocity of any serving tank gun.' },
     { n: '3UBK21 Sprinter gun-launched ATGM', eff: 7000, max: 12000, mv: 400 },
     { n: 'PKTM 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 },
     { n: 'Kord 12.7 mm remote', eff: 2000, max: 6800, mv: 860 }],
    'Produced only in small numbers. Treat published performance as design intent rather than demonstrated service capability.');

  m('tank', 'Merkava Mk4 Barak', 'Israel', 'Main battle tank',
    [['Road', kmh(64)], ['Cross-country', kmh(55)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(65), 'mass'], ['Crew', 4, 'none'],
     ['Rear compartment', 6, 'none', 'infantry or casualties']],
    [{ n: 'MG253 120 mm smoothbore', eff: 4000, max: 5000, mv: 1750 },
     { n: 'LAHAT gun-launched ATGM', eff: 8000, max: 13000, mv: 300, note: 'Semi-active laser homing; can engage helicopters.' },
     { n: '60 mm internal mortar', eff: 2700, max: 2700, mv: 160 },
     { n: '7.62 mm coaxial and roof', eff: 1000, max: 3750, mv: 850 },
     { n: '12.7 mm commander', eff: 1830, max: 6800, mv: 890 }],
    'Engine forward of the crew, which is unusual and is a deliberate crew-survivability choice.');

  m('tank', 'Type 99A', 'China', 'Main battle tank',
    [['Road', kmh(80)], ['Cross-country', kmh(55)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(58), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'ZPT-98 125 mm smoothbore', eff: 3000, max: 4000, mv: 1740 },
     { n: 'GP125 gun-launched ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: 'QJT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 830 },
     { n: 'QJC-88 12.7 mm', eff: 1600, max: 6000, mv: 850 }]);

  m('tank', 'K2 Black Panther', 'South Korea', 'Main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(55), 'mass'], ['Crew', 3, 'none'],
     ['Deep fording', 4.1, 'length']],
    [{ n: 'CN08 120 mm L/55 smoothbore', eff: 4000, max: 5000, mv: 1750 },
     { n: 'KSTAM-II top-attack round', eff: 8000, max: 8000, mv: 300, note: 'Fired indirectly over cover, descends by parachute and attacks the roof.' },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: 'K6 12.7 mm', eff: 1830, max: 6800, mv: 890 }]);

  m('tank', 'Type 10', 'Japan', 'Main battle tank',
    [['Road, forward', kmh(70)], ['Road, reverse', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(440), 'dist'], ['Combat weight', t(44), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'JSW 120 mm L/44 smoothbore', eff: 3500, max: 4000, mv: 1750 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: 'M2 12.7 mm', eff: 1830, max: 6800, mv: 890 }],
    'Same speed forwards and in reverse, a deliberate choice for fighting from prepared positions in restricted terrain.');

  m('tank', 'Altay', 'Türkiye', 'Main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(65), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'MKEK 120 mm L/55 smoothbore', eff: 4000, max: 5000, mv: 1750 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: '12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 }]);

  m('tank', 'Ariete C1', 'Italy', 'Main battle tank',
    [['Road', kmh(65)], ['Cross-country', kmh(45)]],
    [['Operational range', km(550), 'dist'], ['Combat weight', t(54), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'OTO Melara 120 mm L/44 smoothbore', eff: 3000, max: 4000, mv: 1650 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('tank', 'Arjun Mk1A', 'India', 'Main battle tank',
    [['Road', kmh(58)], ['Cross-country', kmh(40)]],
    [['Operational range', km(450), 'dist'], ['Combat weight', t(68), 'mass'], ['Crew', 4, 'none']],
    [{ n: '120 mm rifled', eff: 2400, max: 4000, mv: 1650 },
     { n: 'LAHAT gun-launched ATGM', eff: 8000, max: 8000, mv: 300 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 },
     { n: '12.7 mm anti-aircraft', eff: 1830, max: 6800, mv: 890 }]);

  m('tank', 'T-84 Oplot-M', 'Ukraine', 'Main battle tank',
    [['Road', kmh(70)], ['Cross-country', kmh(45)]],
    [['Operational range', km(540), 'dist'], ['Combat weight', t(51), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'KBA-3 125 mm smoothbore', eff: 3000, max: 4000, mv: 1750 },
     { n: 'Kombat gun-launched ATGM', eff: 5000, max: 5000, mv: 350 },
     { n: 'KT-7.62 coaxial', eff: 1000, max: 3800, mv: 825 }]);

  /* ── armoured & protected vehicles ────────────────────────────────── */

  m('afv', 'M2A4 Bradley', 'United States', 'Infantry fighting vehicle',
    [['Road', kmh(66)], ['Cross-country', kmh(48)]],
    [['Operational range', km(400), 'dist'], ['Combat weight', t(30), 'mass'], ['Crew + dismounts', 3, 'none', '+ 6 dismounts']],
    [{ n: 'M242 Bushmaster 25 mm', eff: 2000, max: 3000, mv: 1100, note: 'M919 APFSDS-T. 200 rounds/min cyclic.' },
     { n: 'TOW-2B ATGM (twin launcher)', eff: 3750, max: 4500, mv: 300 },
     { n: 'M240C 7.62 mm coaxial', eff: 900, max: 3725, mv: 853 }]);

  m('afv', 'CV90 Mk IV', 'Sweden', 'Infantry fighting vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(37), 'mass'], ['Crew + dismounts', 3, 'none', '+ 8 dismounts']],
    [{ n: 'Bushmaster III 35/50 mm', eff: 3000, max: 4000, mv: 1180, note: 'Airburst-capable programmable ammunition.' },
     { n: 'Spike LR2 ATGM', eff: 5500, max: 5500, mv: 180 },
     { n: '7.62 mm coaxial', eff: 900, max: 3725, mv: 850 }]);

  m('afv', 'Puma', 'Germany', 'Infantry fighting vehicle',
    [['Road', kmh(70)], ['Cross-country', kmh(50)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(43), 'mass'], ['Crew + dismounts', 3, 'none', '+ 6 dismounts']],
    [{ n: 'MK30-2/ABM 30 mm', eff: 3000, max: 3000, mv: 1100, note: 'Air-burst munition against troops in cover.' },
     { n: 'Spike LR ATGM', eff: 4000, max: 4000, mv: 180 },
     { n: 'MG4 5.56 mm coaxial', eff: 600, max: 3000, mv: 920 }]);

  m('afv', 'BMP-3', 'Russia', 'Infantry fighting vehicle, amphibious',
    [['Road', kmh(70)], ['Cross-country', kmh(45)], ['Swimming', kmh(10)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(18.7), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: '2A70 100 mm gun-launcher', eff: 4000, max: 7000, mv: 250, note: 'Also fires HE-Frag indirectly out to 7 km.' },
     { n: '9M117 Bastion gun-launched ATGM', eff: 5500, max: 5500, mv: 350 },
     { n: '2A72 30 mm autocannon', eff: 2000, max: 4000, mv: 960 },
     { n: 'PKT 7.62 mm (three)', eff: 1000, max: 3800, mv: 825 }]);

  m('afv', 'BMP-2', 'Russia', 'Infantry fighting vehicle, amphibious',
    [['Road', kmh(65)], ['Cross-country', kmh(45)], ['Swimming', kmh(7)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(14.3), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: '2A42 30 mm autocannon', eff: 2000, max: 4000, mv: 960, note: 'Effective to 4 km against air targets in the anti-aircraft role.' },
     { n: '9M113 Konkurs ATGM', eff: 4000, max: 4000, mv: 208 },
     { n: 'PKT 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }]);

  m('afv', 'Stryker ICV / Dragoon', 'United States', 'Wheeled 8×8 armoured personnel carrier',
    [['Road', kmh(100)], ['Cross-country', kmh(50)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(18.7), 'mass'], ['Crew + dismounts', 2, 'none', '+ 9 dismounts']],
    [{ n: 'MK44 30 mm (Dragoon)', eff: 3000, max: 4000, mv: 1100 },
     { n: 'M2 12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 },
     { n: 'MK19 40 mm grenade launcher', eff: 1500, max: 2200, mv: 241 }]);

  m('afv', 'Boxer', 'Germany / Netherlands', 'Wheeled 8×8 modular armoured vehicle',
    [['Road', kmh(103)], ['Cross-country', kmh(50)]],
    [['Operational range', km(1050), 'dist'], ['Combat weight', t(38.5), 'mass'], ['Crew + dismounts', 3, 'none', '+ 8 dismounts']],
    [{ n: 'MK30-2/ABM 30 mm (IFV module)', eff: 3000, max: 3000, mv: 1100 },
     { n: '12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 }],
    'Mission modules swap in about an hour, so the same hull appears as an APC, ambulance, command post or IFV.');

  m('afv', 'BTR-82A', 'Russia', 'Wheeled 8×8 armoured personnel carrier, amphibious',
    [['Road', kmh(80)], ['Cross-country', kmh(40)], ['Swimming', kmh(9)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(15.4), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: '2A72 30 mm autocannon', eff: 2000, max: 4000, mv: 960 },
     { n: 'PKTM 7.62 mm coaxial', eff: 1000, max: 3800, mv: 825 }]);

  m('afv', 'Centauro II', 'Italy', 'Wheeled 8×8 tank destroyer',
    [['Road', kmh(105)], ['Cross-country', kmh(50)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(30), 'mass'], ['Crew', 4, 'none']],
    [{ n: '120 mm L/45 smoothbore', eff: 4000, max: 5000, mv: 1650 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('afv', 'AMX-10 RC', 'France', 'Wheeled 6×6 reconnaissance vehicle',
    [['Road', kmh(85)], ['Cross-country', kmh(40)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(15.8), 'mass'], ['Crew', 4, 'none']],
    [{ n: '105 mm F2 rifled', eff: 2000, max: 3000, mv: 1120 },
     { n: '7.62 mm coaxial', eff: 1000, max: 3750, mv: 850 }]);

  m('afv', 'Warrior', 'United Kingdom', 'Infantry fighting vehicle',
    [['Road', kmh(75)], ['Cross-country', kmh(50)]],
    [['Operational range', km(660), 'dist'], ['Combat weight', t(28), 'mass'], ['Crew + dismounts', 3, 'none', '+ 7 dismounts']],
    [{ n: 'L21A1 RARDEN 30 mm', eff: 1500, max: 4000, mv: 1070 },
     { n: 'L94A1 7.62 mm chain gun', eff: 1100, max: 3750, mv: 862 }]);

  m('afv', 'Namer', 'Israel', 'Heavy armoured personnel carrier',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(60), 'mass'], ['Crew + dismounts', 3, 'none', '+ 9 dismounts']],
    [{ n: '12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 },
     { n: '60 mm mortar', eff: 2700, max: 2700, mv: 160 },
     { n: 'Spike ATGM (Namer IFV)', eff: 4000, max: 4000, mv: 180 }],
    'Built on a Merkava hull: the heaviest APC in service, and protected to main-battle-tank standard.');

  m('afv', 'M113A3', 'United States', 'Tracked armoured personnel carrier, amphibious',
    [['Road', kmh(67)], ['Swimming', kmh(5.8)]],
    [['Operational range', km(480), 'dist'], ['Combat weight', t(12.3), 'mass'], ['Crew + dismounts', 2, 'none', '+ 11 dismounts']],
    [{ n: 'M2 12.7 mm', eff: 1830, max: 6800, mv: 890 }],
    'In service since 1960 and still fielded by dozens of armies. Aluminium armour: protection is against small arms and shell splinters only.');

  m('afv', 'HMMWV (Humvee)', 'United States', 'Light utility vehicle',
    [['Road', kmh(113)], ['Cross-country', kmh(50)]],
    [['Operational range', km(443), 'dist'], ['Kerb weight', t(2.6), 'mass'], ['Payload', t(1.9), 'mass']],
    [{ n: 'M2 12.7 mm (turret mount)', eff: 1830, max: 6800, mv: 890 },
     { n: 'MK19 40 mm AGL', eff: 1500, max: 2200, mv: 241 },
     { n: 'TOW ATGM (M1045 variant)', eff: 3750, max: 4500, mv: 300 }]);

  m('afv', 'Oshkosh JLTV', 'United States', 'Protected light tactical vehicle',
    [['Road', kmh(113)], ['Cross-country', kmh(60)]],
    [['Operational range', km(483), 'dist'], ['Kerb weight', t(6.4), 'mass'], ['Payload', t(2.3), 'mass']],
    [{ n: '12.7 mm or 40 mm remote weapon station', eff: 1830, max: 6800, mv: 890 },
     { n: 'TOW ATGM (CCWC variant)', eff: 3750, max: 4500, mv: 300 }]);

  m('afv', 'Bushmaster PMV', 'Australia', 'Protected mobility vehicle',
    [['Road', kmh(120)], ['Cross-country', kmh(50)]],
    [['Operational range', km(800), 'dist'], ['Combat weight', t(15), 'mass'], ['Crew + passengers', 2, 'none', '+ 8 passengers']],
    [{ n: '7.62 mm or 12.7 mm pintle mount', eff: 1830, max: 6800, mv: 890 }],
    'V-hull mine protection. Widely donated and widely praised for crew survivability against IEDs.');

  m('afv', 'MaxxPro MRAP', 'United States', 'Mine-resistant ambush-protected vehicle',
    [['Road', kmh(100)], ['Cross-country', kmh(40)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(17), 'mass'], ['Crew + passengers', 2, 'none', '+ 8 passengers']],
    [{ n: '12.7 mm remote weapon station', eff: 1830, max: 6800, mv: 890 }],
    'High centre of gravity: rollovers have caused more casualties in some theatres than the blasts the hull was designed to defeat.');

  /* ── artillery & mortars ──────────────────────────────────────────── */

  function arty(n, country, d, speeds, specs, arms, note) {
    m('arty', n, country, d, speeds, specs, arms, note);
  }

  arty('M777A2 howitzer', 'United States / United Kingdom', 'Towed 155 mm',
    [['Towed march speed', kmh(88)], ['Helicopter lift', kmh(240)]],
    [['Weight', t(4.2), 'mass'], ['Crew', 8, 'none'], ['Rate of fire, sustained', 2, 'none', 'rounds/min'], ['Rate of fire, burst', 5, 'none', 'rounds/min'], ['Emplacement time', 3, 'none', 'minutes']],
    [{ n: '155 mm, standard HE (M107)', eff: 24000, max: 24000, mv: 827 },
     { n: '155 mm, rocket-assisted (M549A1)', eff: 30000, max: 30000, mv: 827 },
     { n: '155 mm, M982 Excalibur guided', eff: 40000, max: 40000, mv: 827, note: 'GPS-guided; circular error typically under 4 m.' }],
    'Titanium construction: light enough to be lifted by a medium helicopter, which is what makes it an air-assault gun.');

  arty('M109A7 Paladin', 'United States', 'Self-propelled 155 mm',
    [['Road', kmh(61)], ['Cross-country', kmh(40)]],
    [['Operational range', km(300), 'dist'], ['Combat weight', t(36.3), 'mass'], ['Crew', 4, 'none'], ['Rate of fire, burst', 4, 'none', 'rounds/min']],
    [{ n: '155 mm M284 L/39, standard HE', eff: 22000, max: 24000, mv: 827 },
     { n: '155 mm, rocket-assisted', eff: 30000, max: 30000, mv: 827 },
     { n: '155 mm Excalibur guided', eff: 40000, max: 40000, mv: 827 },
     { n: 'M2 12.7 mm self-defence', eff: 1830, max: 6800, mv: 890 }]);

  arty('PzH 2000', 'Germany', 'Self-propelled 155 mm L/52',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(420), 'dist'], ['Combat weight', t(55.8), 'mass'], ['Crew', 5, 'none'], ['Rate of fire, burst', 10, 'none', 'rounds/min']],
    [{ n: '155 mm L/52, standard HE', eff: 30000, max: 30000, mv: 945 },
     { n: '155 mm, base-bleed', eff: 40000, max: 40000, mv: 945 },
     { n: '155 mm, V-LAP assisted', eff: 56000, max: 67000, mv: 945, note: '67 km demonstrated in trials, the longest range fired by a conventional tube.' },
     { n: 'MG3 7.62 mm', eff: 1000, max: 3750, mv: 820 }],
    'Can put three rounds on the same target simultaneously by varying elevation and charge (MRSI).');

  arty('CAESAR', 'France', 'Truck-mounted 155 mm L/52',
    [['Road', kmh(100)], ['Cross-country', kmh(50)]],
    [['Operational range', km(600), 'dist'], ['Combat weight', t(17.7), 'mass'], ['Crew', 5, 'none'],
     ['Into and out of action', 1, 'none', 'minute']],
    [{ n: '155 mm L/52, standard HE', eff: 30000, max: 30000, mv: 945 },
     { n: '155 mm, base-bleed / assisted', eff: 42000, max: 42000, mv: 945 }],
    'Shoot-and-scoot: one minute to fire and one to move makes it hard to hit with counter-battery fire.');

  arty('Archer FH77BW', 'Sweden', 'Truck-mounted 155 mm L/52, automated',
    [['Road', kmh(70)], ['Cross-country', kmh(30)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(30), 'mass'], ['Crew', 3, 'none'],
     ['Into action', 0.5, 'none', 'minutes']],
    [{ n: '155 mm L/52, standard HE', eff: 30000, max: 30000, mv: 945 },
     { n: '155 mm Excalibur guided', eff: 50000, max: 50000, mv: 945 }]);

  arty('2S19 Msta-S', 'Russia', 'Self-propelled 152 mm',
    [['Road', kmh(60)], ['Cross-country', kmh(40)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(42), 'mass'], ['Crew', 5, 'none'], ['Rate of fire', 8, 'none', 'rounds/min']],
    [{ n: '152 mm 2A64, standard HE', eff: 24700, max: 24700, mv: 828 },
     { n: '152 mm, rocket-assisted', eff: 29000, max: 29000, mv: 828 },
     { n: '152 mm Krasnopol guided', eff: 20000, max: 20000, mv: 828, note: 'Laser homing, needs a designator on the target.' },
     { n: 'NSVT 12.7 mm', eff: 2000, max: 6000, mv: 845 }]);

  arty('2S35 Koalitsiya-SV', 'Russia', 'Self-propelled 152 mm, automated',
    [['Road', kmh(60)], ['Cross-country', kmh(45)]],
    [['Operational range', km(500), 'dist'], ['Combat weight', t(48), 'mass'], ['Crew', 3, 'none'], ['Rate of fire', 16, 'none', 'rounds/min']],
    [{ n: '152 mm 2A88, assisted', eff: 70000, max: 80000, mv: 950 }]);

  arty('M270A2 MLRS', 'United States', 'Tracked rocket artillery',
    [['Road', kmh(64)], ['Cross-country', kmh(48)]],
    [['Operational range', km(480), 'dist'], ['Combat weight', t(25), 'mass'], ['Crew', 3, 'none'], ['Rockets carried', 12, 'none']],
    [{ n: 'M31 GMLRS unitary', eff: 84000, max: 84000, mv: 1000, note: 'GPS/INS guided, roughly 5 m accuracy.' },
     { n: 'ER GMLRS', eff: 150000, max: 150000, mv: 1000 },
     { n: 'ATACMS (2 per pod)', eff: 300000, max: 300000, mv: 1000 },
     { n: 'PrSM', eff: 500000, max: 500000, mv: 1200 }]);

  arty('M142 HIMARS', 'United States', 'Wheeled rocket artillery',
    [['Road', kmh(85)], ['Cross-country', kmh(50)]],
    [['Operational range', km(480), 'dist'], ['Combat weight', t(16.2), 'mass'], ['Crew', 3, 'none'], ['Rockets carried', 6, 'none'],
     ['Displacement after firing', 1, 'none', 'minute']],
    [{ n: 'M31 GMLRS unitary', eff: 84000, max: 84000, mv: 1000 },
     { n: 'ATACMS', eff: 300000, max: 300000, mv: 1000 },
     { n: 'PrSM', eff: 500000, max: 500000, mv: 1200 }],
    'C-130 transportable, which is the whole point: one aircraft moves a launcher into theatre.');

  arty('BM-21 Grad', 'Russia', 'Wheeled rocket artillery, 122 mm',
    [['Road', kmh(75)], ['Cross-country', kmh(40)]],
    [['Operational range', km(750), 'dist'], ['Combat weight', t(13.7), 'mass'], ['Crew', 3, 'none'], ['Rockets carried', 40, 'none'], ['Full salvo time', 20, 'none', 'seconds']],
    [{ n: '9M22U 122 mm rocket', eff: 20000, max: 20000, mv: 690 },
     { n: '9M521 extended range', eff: 40000, max: 40000, mv: 690 }],
    'Area weapon, not a precision one: a full salvo saturates roughly 3 hectares.');

  arty('81 mm mortar (L16 / M252)', 'NATO', 'Medium mortar, man-portable in loads',
    [['Carried by section', kmh(4)], ['Vehicle-mounted', kmh(80)]],
    [['System weight', 38, 'mass'], ['Crew', 3, 'none'], ['Rate of fire, burst', 20, 'none', 'rounds/min']],
    [{ n: '81 mm HE', eff: 5650, max: 5650, mv: 225 },
     { n: '81 mm illumination', eff: 4800, max: 4800, mv: 225 },
     { n: '81 mm smoke', eff: 5000, max: 5000, mv: 225 }]);

  arty('120 mm mortar', 'NATO / worldwide', 'Heavy mortar, vehicle-towed or mounted',
    [['Towed', kmh(70)]],
    [['System weight', 320, 'mass'], ['Crew', 5, 'none'], ['Rate of fire, burst', 15, 'none', 'rounds/min']],
    [{ n: '120 mm HE', eff: 7200, max: 8000, mv: 318 },
     { n: '120 mm rocket-assisted', eff: 13000, max: 13000, mv: 318 },
     { n: '120 mm precision-guided (Strix / APMI)', eff: 7500, max: 7500, mv: 318 }]);

  arty('60 mm mortar', 'NATO / worldwide', 'Light mortar, man-portable',
    [['Carried by one soldier', kmh(4)]],
    [['System weight', 21, 'mass'], ['Crew', 2, 'none'], ['Rate of fire, burst', 30, 'none', 'rounds/min']],
    [{ n: '60 mm HE', eff: 3500, max: 3800, mv: 165 }]);

  /* ── military aircraft ────────────────────────────────────────────── */

  function jet(n, country, d, speeds, specs, arms, note) {
    m('milair', n, country, d, speeds, specs, arms, note);
  }

  jet('F-35A Lightning II', 'United States', 'Stealth multirole fighter',
    [['Maximum', kmh(1930)], ['Cruise', kmh(1000)]],
    [['Combat radius', km(1093), 'dist'], ['Ferry range', km(2800), 'dist'], ['Service ceiling', 15240, 'alt'],
     ['Maximum Mach', 1.6, 'none'], ['Internal fuel', t(8.3), 'mass']],
    [{ n: 'GAU-22/A 25 mm cannon', eff: 1200, max: 3000, mv: 1030, note: '182 rounds internal.' },
     { n: 'AIM-120D AMRAAM', eff: 160000, max: 180000, mv: 1400 },
     { n: 'AIM-9X Sidewinder', eff: 35000, max: 35000, mv: 850 },
     { n: 'GBU-31 JDAM', eff: 28000, max: 28000, mv: 300 },
     { n: 'JSM anti-ship missile', eff: 555000, max: 555000, mv: 300 }]);

  jet('F-22A Raptor', 'United States', 'Stealth air superiority fighter',
    [['Maximum', kmh(2414)], ['Supercruise', kmh(1963)]],
    [['Combat radius', km(850), 'dist'], ['Service ceiling', 19812, 'alt'], ['Maximum Mach', 2.25, 'none']],
    [{ n: 'M61A2 20 mm Vulcan', eff: 1200, max: 3000, mv: 1050 },
     { n: 'AIM-120D AMRAAM', eff: 160000, max: 180000, mv: 1400 },
     { n: 'AIM-9X Sidewinder', eff: 35000, max: 35000, mv: 850 }],
    'Supercruise means sustained supersonic flight without afterburner, which changes both fuel planning and infrared signature.');

  jet('F-16C Fighting Falcon', 'United States', 'Multirole fighter',
    [['Maximum', kmh(2120)], ['Cruise', kmh(900)]],
    [['Combat radius', km(550), 'dist'], ['Ferry range', km(4220), 'dist'], ['Service ceiling', 15240, 'alt'], ['Maximum Mach', 2, 'none']],
    [{ n: 'M61A1 20 mm Vulcan', eff: 1200, max: 3000, mv: 1036, note: '511 rounds, 6000 rounds/min.' },
     { n: 'AIM-120 AMRAAM', eff: 105000, max: 160000, mv: 1400 },
     { n: 'AIM-9 Sidewinder', eff: 18000, max: 35000, mv: 850 },
     { n: 'AGM-88 HARM', eff: 150000, max: 150000, mv: 700 }]);

  jet('F/A-18E Super Hornet', 'United States', 'Carrier multirole fighter',
    [['Maximum', kmh(1915)], ['Cruise', kmh(900)]],
    [['Combat radius', km(722), 'dist'], ['Service ceiling', 15000, 'alt'], ['Maximum Mach', 1.6, 'none']],
    [{ n: 'M61A2 20 mm Vulcan', eff: 1200, max: 3000, mv: 1050 },
     { n: 'AIM-120 AMRAAM', eff: 105000, max: 160000, mv: 1400 },
     { n: 'AGM-84 Harpoon', eff: 124000, max: 124000, mv: 290 },
     { n: 'AGM-158 JASSM', eff: 370000, max: 370000, mv: 270 }]);

  jet('F-15EX Eagle II', 'United States', 'Heavy multirole fighter',
    [['Maximum', kmh(2655)], ['Cruise', kmh(917)]],
    [['Ferry range', km(3900), 'dist'], ['Service ceiling', 18200, 'alt'], ['Maximum Mach', 2.5, 'none'], ['Weapon stations', 22, 'none']],
    [{ n: 'M61A1 20 mm Vulcan', eff: 1200, max: 3000, mv: 1036 },
     { n: 'AIM-120D AMRAAM (up to 12)', eff: 160000, max: 180000, mv: 1400 },
     { n: 'AIM-9X Sidewinder', eff: 35000, max: 35000, mv: 850 }]);

  jet('Eurofighter Typhoon', 'Europe', 'Multirole fighter',
    [['Maximum', kmh(2125)], ['Supercruise', kmh(1470)]],
    [['Combat radius, air defence', km(1389), 'dist'], ['Service ceiling', 19812, 'alt'], ['Maximum Mach', 2, 'none']],
    [{ n: 'Mauser BK-27 27 mm', eff: 1500, max: 3000, mv: 1100 },
     { n: 'Meteor BVRAAM', eff: 200000, max: 200000, mv: 1400, note: 'Ramjet sustainer gives it the largest published no-escape zone of any air-to-air missile.' },
     { n: 'IRIS-T', eff: 25000, max: 25000, mv: 1000 },
     { n: 'Storm Shadow cruise missile', eff: 550000, max: 550000, mv: 270 }]);

  jet('Dassault Rafale', 'France', 'Multirole fighter',
    [['Maximum', kmh(1912)], ['Cruise', kmh(1000)]],
    [['Combat radius', km(1850), 'dist'], ['Service ceiling', 15235, 'alt'], ['Maximum Mach', 1.8, 'none']],
    [{ n: 'GIAT 30M791 30 mm', eff: 1500, max: 3000, mv: 1025 },
     { n: 'MICA', eff: 80000, max: 80000, mv: 1000 },
     { n: 'Meteor BVRAAM', eff: 200000, max: 200000, mv: 1400 },
     { n: 'SCALP-EG cruise missile', eff: 550000, max: 550000, mv: 270 },
     { n: 'Exocet AM39', eff: 70000, max: 70000, mv: 315 }]);

  jet('Saab JAS 39E Gripen', 'Sweden', 'Multirole fighter',
    [['Maximum', kmh(2130)], ['Supercruise', kmh(1200)]],
    [['Combat radius', km(1500), 'dist'], ['Service ceiling', 16000, 'alt'], ['Maximum Mach', 2, 'none'],
     ['Turnaround time', 10, 'none', 'minutes, air-to-air']],
    [{ n: 'Mauser BK-27 27 mm', eff: 1500, max: 3000, mv: 1100 },
     { n: 'Meteor BVRAAM', eff: 200000, max: 200000, mv: 1400 },
     { n: 'IRIS-T', eff: 25000, max: 25000, mv: 1000 }],
    'Designed to operate from dispersed road bases with conscript ground crews, which is a survivability choice, not an economy one.');

  jet('Su-35S', 'Russia', 'Multirole fighter, thrust vectoring',
    [['Maximum', kmh(2400)], ['Cruise', kmh(900)]],
    [['Ferry range', km(3600), 'dist'], ['Service ceiling', 18000, 'alt'], ['Maximum Mach', 2.25, 'none']],
    [{ n: 'GSh-30-1 30 mm', eff: 1800, max: 3000, mv: 860 },
     { n: 'R-77-1 (AA-12)', eff: 110000, max: 110000, mv: 1200 },
     { n: 'R-73 / R-74 (AA-11)', eff: 40000, max: 40000, mv: 800 },
     { n: 'Kh-31 anti-radiation', eff: 110000, max: 110000, mv: 1000 }]);

  jet('Su-57 Felon', 'Russia', 'Stealth multirole fighter',
    [['Maximum', kmh(2120)], ['Supercruise', kmh(1470)]],
    [['Combat radius', km(1500), 'dist'], ['Service ceiling', 20000, 'alt'], ['Maximum Mach', 2, 'none']],
    [{ n: 'GSh-30-1 30 mm', eff: 1800, max: 3000, mv: 860 },
     { n: 'R-77M', eff: 190000, max: 190000, mv: 1200 },
     { n: 'Kh-59MK2 cruise missile', eff: 290000, max: 290000, mv: 270 }]);

  jet('MiG-31BM Foxhound', 'Russia', 'Long-range interceptor',
    [['Maximum', kmh(3000)], ['Cruise', kmh(2500)]],
    [['Combat radius', km(720), 'dist'], ['Service ceiling', 20600, 'alt'], ['Maximum Mach', 2.83, 'none']],
    [{ n: 'GSh-6-23 23 mm', eff: 1800, max: 3000, mv: 700 },
     { n: 'R-33 (AA-9)', eff: 120000, max: 160000, mv: 1300 },
     { n: 'R-37M (AA-13)', eff: 300000, max: 400000, mv: 2000, note: 'Among the longest-ranged air-to-air missiles fielded.' },
     { n: 'Kh-47M2 Kinzhal (carrier aircraft)', eff: 2000000, max: 2000000, mv: 3400 }]);

  jet('Chengdu J-20', 'China', 'Stealth air superiority fighter',
    [['Maximum', kmh(2100)], ['Supercruise', kmh(1470)]],
    [['Combat radius', km(2000), 'dist'], ['Service ceiling', 20000, 'alt'], ['Maximum Mach', 2, 'none']],
    [{ n: 'PL-15 BVRAAM', eff: 200000, max: 300000, mv: 1400 },
     { n: 'PL-10 short range', eff: 20000, max: 20000, mv: 900 }]);

  jet('A-10C Thunderbolt II', 'United States', 'Close air support',
    [['Maximum', kmh(706)], ['Loiter', kmh(560)]],
    [['Combat radius', km(460), 'dist'], ['Loiter endurance', 1.9, 'none', 'hours on station'], ['Service ceiling', 13700, 'alt']],
    [{ n: 'GAU-8/A Avenger 30 mm', eff: 1220, max: 3600, mv: 1010, note: '1174 rounds, 3900 rounds/min. Depleted-uranium API defeats light armour.' },
     { n: 'AGM-65 Maverick', eff: 22000, max: 22000, mv: 300 },
     { n: 'Hydra 70 rocket pods', eff: 8000, max: 10500, mv: 700 },
     { n: 'GBU-12 Paveway II', eff: 15000, max: 15000, mv: 300 }],
    'Built around the gun rather than the other way round. Titanium bathtub around the cockpit and duplicated flight controls.');

  jet('AC-130J Ghostrider', 'United States', 'Gunship',
    [['Cruise', kmh(583)], ['Maximum', kmh(675)]],
    [['Endurance', 6, 'none', 'hours'], ['Service ceiling', 8500, 'alt']],
    [{ n: 'GAU-23/A 30 mm', eff: 3000, max: 5000, mv: 1080 },
     { n: 'M102 105 mm howitzer', eff: 11000, max: 11500, mv: 494 },
     { n: 'AGM-176 Griffin', eff: 15000, max: 15000, mv: 300 },
     { n: 'GBU-39 Small Diameter Bomb', eff: 110000, max: 110000, mv: 300 }],
    'Fires in a left-hand pylon turn, so the whole aircraft orbits the target.');

  jet('B-2A Spirit', 'United States', 'Stealth strategic bomber',
    [['Cruise', kmh(900)], ['Maximum', kmh(1010)]],
    [['Range, unrefuelled', km(11100), 'dist'], ['Service ceiling', 15200, 'alt'], ['Payload', t(18), 'mass']],
    [{ n: 'GBU-31 JDAM (up to 80)', eff: 28000, max: 28000, mv: 300 },
     { n: 'GBU-57 Massive Ordnance Penetrator', eff: 10000, max: 10000, mv: 300, note: '13.6 tonne bunker buster; two carried.' },
     { n: 'AGM-158 JASSM-ER', eff: 1000000, max: 1000000, mv: 270 }]);

  jet('B-52H Stratofortress', 'United States', 'Strategic bomber',
    [['Cruise', kmh(819)], ['Maximum', kmh(1000)]],
    [['Range, unrefuelled', km(14080), 'dist'], ['Service ceiling', 15000, 'alt'], ['Payload', t(31.5), 'mass']],
    [{ n: 'AGM-86B ALCM', eff: 2400000, max: 2400000, mv: 250 },
     { n: 'AGM-158 JASSM-ER', eff: 1000000, max: 1000000, mv: 270 },
     { n: 'Conventional bombs', eff: 10000, max: 10000, mv: 300 }],
    'First flew in 1952 and is planned to serve past 2050, which would make it a century-old airframe design in service.');

  jet('B-1B Lancer', 'United States', 'Supersonic strategic bomber',
    [['Maximum', kmh(1448)], ['Cruise', kmh(1000)]],
    [['Range', km(11998), 'dist'], ['Service ceiling', 18000, 'alt'], ['Payload', t(34), 'mass'], ['Maximum Mach', 1.25, 'none']],
    [{ n: 'AGM-158 JASSM-ER', eff: 1000000, max: 1000000, mv: 270 },
     { n: 'LRASM anti-ship', eff: 900000, max: 900000, mv: 270 },
     { n: 'GBU-31 JDAM', eff: 28000, max: 28000, mv: 300 }]);

  jet('C-130J Super Hercules', 'United States', 'Tactical transport',
    [['Cruise', kmh(644)], ['Maximum', kmh(671)]],
    [['Range with 20 t payload', km(3334), 'dist'], ['Service ceiling', 8615, 'alt'], ['Payload', t(19.9), 'mass'],
     ['Runway required', 950, 'length', 'unpaved capable'], ['Troops', 92, 'none'], ['Paratroopers', 64, 'none']],
    null,
    'The reference tactical airlifter: if a load or a vehicle fits a Hercules, it can reach almost any airstrip in the world.');

  jet('C-17 Globemaster III', 'United States', 'Strategic / tactical transport',
    [['Cruise', kmh(830)]],
    [['Range with 72 t payload', km(4482), 'dist'], ['Ferry range', km(10390), 'dist'], ['Payload', t(77.5), 'mass'],
     ['Runway required', 1064, 'length'], ['Troops', 102, 'none']]);

  jet('Airbus A400M Atlas', 'Europe', 'Tactical / strategic transport',
    [['Cruise', kmh(780)], ['Maximum', kmh(781)]],
    [['Range with 30 t payload', km(4540), 'dist'], ['Payload', t(37), 'mass'], ['Service ceiling', 11300, 'alt'],
     ['Runway required', 980, 'length', 'unpaved capable'], ['Troops', 116, 'none']]);

  jet('P-8A Poseidon', 'United States', 'Maritime patrol and anti-submarine',
    [['Cruise', kmh(815)], ['Maximum', kmh(907)]],
    [['Range', km(8300), 'dist'], ['Endurance on station', 4, 'none', 'hours at 1850 km'], ['Service ceiling', 12500, 'alt']],
    [{ n: 'Mk 54 lightweight torpedo', eff: 9000, max: 9000, mv: 20 },
     { n: 'AGM-84 Harpoon', eff: 124000, max: 124000, mv: 290 },
     { n: 'Sonobuoys', eff: 0, max: 0, mv: 0, note: '129 carried' }]);

  jet('E-3 Sentry AWACS', 'United States / NATO', 'Airborne early warning and control',
    [['Cruise', kmh(700)], ['Maximum', kmh(855)]],
    [['Endurance, unrefuelled', 8, 'none', 'hours'], ['Radar detection range', km(400), 'dist'], ['Service ceiling', 12500, 'alt']],
    null,
    'Radar horizon is the point: at 9 km altitude it sees low-flying traffic hundreds of kilometres beyond any ground radar.');

  jet('U-2S Dragon Lady', 'United States', 'High-altitude reconnaissance',
    [['Cruise', kmh(760)], ['Maximum', kmh(805)]],
    [['Range', km(10300), 'dist'], ['Service ceiling', 21300, 'alt'], ['Endurance', 12, 'none', 'hours']],
    null,
    'Pilots wear full pressure suits. The margin between stall and never-exceed speed at altitude is only a few knots.');

  jet('SR-71A Blackbird', 'United States', 'Strategic reconnaissance, retired 1999',
    [['Maximum', kmh(3540)], ['Cruise', kmh(3220)]],
    [['Range', km(5400), 'dist'], ['Service ceiling', 25900, 'alt'], ['Maximum Mach', 3.3, 'none']],
    null,
    'Still holds the air-breathing speed and altitude records. Standard evasion tactic against a surface-to-air missile was to accelerate.');

  /* ── military helicopters ─────────────────────────────────────────── */

  function mh(n, country, d, cruise, max, range, ceiling, specs, arms, note) {
    m('milheli', n, country, d,
      [['Cruise', kmh(cruise)], ['Maximum', kmh(max)]],
      [['Range', km(range), 'dist'], ['Service ceiling', ceiling, 'alt']].concat(specs || []),
      arms, note);
  }

  mh('AH-64E Apache Guardian', 'United States', 'Attack helicopter', 265, 293, 476, 6400,
    [['Combat weight', t(10.4), 'mass'], ['Crew', 2, 'none']],
    [{ n: 'M230 30 mm chain gun', eff: 1500, max: 4000, mv: 805, note: '1200 rounds, slaved to the gunner helmet sight.' },
     { n: 'AGM-114 Hellfire', eff: 8000, max: 11000, mv: 425, note: 'Longbow radar variant is fire-and-forget.' },
     { n: 'JAGM', eff: 16000, max: 16000, mv: 425 },
     { n: 'Hydra 70 rockets (up to 76)', eff: 8000, max: 10500, mv: 700 },
     { n: 'AIM-92 Stinger air-to-air', eff: 4800, max: 4800, mv: 750 }]);

  mh('UH-60M Black Hawk', 'United States', 'Utility helicopter', 280, 294, 590, 5790,
    [['Troops', 11, 'none'], ['External load', t(4.1), 'mass'], ['Crew', 4, 'none']],
    [{ n: 'M240H 7.62 mm door guns', eff: 800, max: 3725, mv: 853 },
     { n: 'GAU-19 12.7 mm (armed variants)', eff: 1830, max: 6800, mv: 890 },
     { n: 'Hydra 70 rockets (armed variants)', eff: 8000, max: 10500, mv: 700 }]);

  mh('CH-47F Chinook', 'United States', 'Heavy-lift transport', 291, 315, 741, 6100,
    [['Troops', 55, 'none'], ['External load', t(10.9), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'M240 7.62 mm (three stations)', eff: 800, max: 3725, mv: 853 },
     { n: 'M134 minigun', eff: 1000, max: 3725, mv: 853, note: '3000 rounds/min' }]);

  mh('CH-53K King Stallion', 'United States', 'Heavy-lift transport', 261, 315, 852, 4380,
    [['Troops', 30, 'none'], ['External load', t(16.3), 'mass'], ['Crew', 5, 'none']],
    [{ n: 'GAU-21 12.7 mm', eff: 1830, max: 6800, mv: 890 }]);

  mh('AH-1Z Viper', 'United States', 'Attack helicopter, marine', 296, 411, 685, 6100,
    [['Combat weight', t(8.4), 'mass'], ['Crew', 2, 'none']],
    [{ n: 'M197 20 mm three-barrel', eff: 1500, max: 3000, mv: 1030 },
     { n: 'AGM-114 Hellfire', eff: 8000, max: 11000, mv: 425 },
     { n: 'AIM-9 Sidewinder', eff: 18000, max: 18000, mv: 850 },
     { n: 'Hydra 70 rockets', eff: 8000, max: 10500, mv: 700 }]);

  mh('Bell V-22 Osprey', 'United States', 'Tiltrotor transport', 446, 509, 1627, 7620,
    [['Troops', 24, 'none'], ['Internal load', t(9.1), 'mass'], ['Self-deploy range', km(3900), 'dist']],
    [{ n: 'M240 7.62 mm ramp gun', eff: 800, max: 3725, mv: 853 },
     { n: 'GAU-17 minigun (belly turret)', eff: 1000, max: 3725, mv: 853 }],
    'Flies like a turboprop and lands like a helicopter: roughly twice the speed and five times the range of the helicopter it replaced.');

  mh('Mil Mi-24 / Mi-35 Hind', 'Russia', 'Attack helicopter with troop cabin', 270, 335, 450, 4500,
    [['Troops', 8, 'none'], ['Combat weight', t(11.5), 'mass'], ['Crew', 3, 'none']],
    [{ n: 'GSh-23L 23 mm (Mi-35M)', eff: 2000, max: 3000, mv: 715 },
     { n: 'YakB 12.7 mm four-barrel (Mi-24V)', eff: 1500, max: 6000, mv: 810 },
     { n: '9M120 Ataka ATGM', eff: 6000, max: 8000, mv: 400 },
     { n: 'S-8 rocket pods', eff: 4000, max: 6000, mv: 610 }],
    'Unusual in combining an attack helicopter with an eight-man troop compartment.');

  mh('Mi-28NM Havoc', 'Russia', 'Attack helicopter', 265, 300, 435, 5700,
    [['Combat weight', t(11.5), 'mass'], ['Crew', 2, 'none']],
    [{ n: '2A42 30 mm', eff: 2500, max: 4000, mv: 960 },
     { n: '9M120 Ataka ATGM', eff: 6000, max: 8000, mv: 400 },
     { n: 'S-8 / S-13 rockets', eff: 4000, max: 6000, mv: 610 }]);

  mh('Ka-52 Alligator', 'Russia', 'Attack helicopter, coaxial rotor', 260, 300, 460, 5500,
    [['Combat weight', t(10.8), 'mass'], ['Crew', 2, 'none', 'side by side']],
    [{ n: '2A42 30 mm', eff: 2500, max: 4000, mv: 960 },
     { n: '9K121 Vikhr ATGM', eff: 8000, max: 10000, mv: 600, note: 'Laser beam riding, supersonic.' },
     { n: 'S-8 rocket pods', eff: 4000, max: 6000, mv: 610 }],
    'Coaxial rotors remove the tail rotor, so it can turn on the spot and is less vulnerable from the rear.');

  mh('Airbus Tiger HAD', 'Europe', 'Attack helicopter', 230, 290, 800, 4000,
    [['Combat weight', t(6.6), 'mass'], ['Crew', 2, 'none']],
    [{ n: 'GIAT 30 mm turret', eff: 1500, max: 3000, mv: 1025 },
     { n: 'Hellfire II / Spike ER', eff: 8000, max: 8000, mv: 425 },
     { n: '68 mm / 70 mm rockets', eff: 6000, max: 8000, mv: 700 },
     { n: 'Mistral air-to-air', eff: 6000, max: 6000, mv: 800 }]);

  mh('NH90 TTH', 'Europe', 'Tactical transport helicopter', 260, 300, 800, 6000,
    [['Troops', 20, 'none'], ['External load', t(4), 'mass']],
    [{ n: '7.62 mm door guns', eff: 800, max: 3725, mv: 850 }]);

  /* ── naval vessels ────────────────────────────────────────────────── */

  function nav(n, country, d, speeds, specs, arms, note) {
    m('navy', n, country, d, speeds, specs, arms, note);
  }

  nav('Arleigh Burke DDG (Flight IIA)', 'United States', 'Guided missile destroyer',
    [['Maximum', kn(31)], ['Economical cruise', kn(20)]],
    [['Range at 20 kn', nmi(4400), 'dist'], ['Full displacement', t(9700), 'mass'], ['Crew', 323, 'none'],
     ['VLS cells', 96, 'none']],
    [{ n: 'Mk 45 127 mm gun', eff: 24000, max: 24000, mv: 762 },
     { n: 'SM-2MR surface-to-air', eff: 167000, max: 167000, mv: 1200 },
     { n: 'SM-6 extended range', eff: 370000, max: 460000, mv: 1200 },
     { n: 'ESSM point defence', eff: 50000, max: 50000, mv: 1360 },
     { n: 'Tomahawk land attack', eff: 1600000, max: 1600000, mv: 246 },
     { n: 'Mk 46 / Mk 54 torpedo', eff: 11000, max: 11000, mv: 23 },
     { n: 'Phalanx CIWS 20 mm', eff: 1500, max: 3600, mv: 1100, note: '4500 rounds/min, autonomous last-ditch defence.' }]);

  nav('Type 45 Daring destroyer', 'United Kingdom', 'Air defence destroyer',
    [['Maximum', kn(32)], ['Cruise', kn(18)]],
    [['Range', nmi(7000), 'dist'], ['Full displacement', t(8500), 'mass'], ['Crew', 191, 'none'], ['Sylver cells', 48, 'none']],
    [{ n: 'Mk 8 114 mm gun', eff: 27500, max: 27500, mv: 870 },
     { n: 'Aster 30 surface-to-air', eff: 120000, max: 120000, mv: 1400 },
     { n: 'Aster 15 point defence', eff: 30000, max: 30000, mv: 1000 },
     { n: 'Phalanx CIWS 20 mm', eff: 1500, max: 3600, mv: 1100 }]);

  nav('Admiral Gorshkov frigate', 'Russia', 'Multirole frigate',
    [['Maximum', kn(29.5)], ['Cruise', kn(14)]],
    [['Range at 14 kn', nmi(4500), 'dist'], ['Full displacement', t(5400), 'mass'], ['Crew', 210, 'none']],
    [{ n: 'A-192 130 mm gun', eff: 22000, max: 22000, mv: 850 },
     { n: '3M14 Kalibr land attack', eff: 1500000, max: 2500000, mv: 240 },
     { n: 'P-800 Oniks anti-ship', eff: 600000, max: 600000, mv: 850 },
     { n: '3M22 Zircon hypersonic', eff: 1000000, max: 1000000, mv: 2700 },
     { n: 'Redut surface-to-air', eff: 150000, max: 150000, mv: 1200 }]);

  nav('Nimitz-class carrier', 'United States', 'Nuclear aircraft carrier',
    [['Maximum', kn(31.5)]],
    [['Range', nmi(0), 'dist', 'effectively unlimited, nuclear'], ['Full displacement', t(100000), 'mass'],
     ['Crew', 5680, 'none'], ['Aircraft', 90, 'none'], ['Sorties per day, surge', 240, 'none']],
    [{ n: 'RIM-162 ESSM', eff: 50000, max: 50000, mv: 1360 },
     { n: 'RIM-116 RAM', eff: 9000, max: 9000, mv: 680 },
     { n: 'Phalanx CIWS 20 mm', eff: 1500, max: 3600, mv: 1100 }],
    'The air wing is the weapon: strike radius is roughly 1000 km from the ship, before tanking.');

  nav('Gerald R. Ford-class carrier', 'United States', 'Nuclear aircraft carrier',
    [['Maximum', kn(30)]],
    [['Full displacement', t(100000), 'mass'], ['Crew', 4539, 'none'], ['Aircraft', 75, 'none'],
     ['Sorties per day, surge', 270, 'none']],
    [{ n: 'RIM-162 ESSM', eff: 50000, max: 50000, mv: 1360 },
     { n: 'RIM-116 RAM', eff: 9000, max: 9000, mv: 680 }]);

  nav('Virginia-class SSN', 'United States', 'Nuclear attack submarine',
    [['Submerged, maximum', kn(25)], ['Quiet patrol', kn(5)]],
    [['Test depth', 240, 'alt'], ['Displacement, submerged', t(7900), 'mass'], ['Crew', 135, 'none'],
     ['Endurance', 90, 'none', 'days, limited by food']],
    [{ n: 'Mk 48 ADCAP torpedo', eff: 38000, max: 50000, mv: 28 },
     { n: 'Tomahawk land attack (VLS)', eff: 1600000, max: 1600000, mv: 246 },
     { n: 'Harpoon anti-ship', eff: 124000, max: 124000, mv: 290 }]);

  nav('Ohio-class SSBN', 'United States', 'Ballistic missile submarine',
    [['Submerged, maximum', kn(25)], ['Patrol', kn(4)]],
    [['Displacement, submerged', t(18750), 'mass'], ['Crew', 155, 'none'], ['Missile tubes', 20, 'none'],
     ['Patrol length', 77, 'none', 'days average']],
    [{ n: 'Trident II D5 SLBM', eff: 12000000, max: 12000000, mv: 6100, note: 'Terminal reentry speed around Mach 24.' },
     { n: 'Mk 48 torpedo', eff: 38000, max: 50000, mv: 28 }]);

  nav('Kilo-class SSK (Project 636)', 'Russia', 'Diesel-electric attack submarine',
    [['Submerged, maximum', kn(20)], ['Snorkel transit', kn(9)], ['Quiet patrol', kn(3)]],
    [['Range, snorkelling', nmi(7500), 'dist'], ['Submerged endurance', nmi(400), 'dist'],
     ['Displacement, submerged', t(3950), 'mass'], ['Crew', 52, 'none']],
    [{ n: '533 mm torpedo', eff: 20000, max: 20000, mv: 25 },
     { n: '3M14 Kalibr land attack', eff: 1500000, max: 2500000, mv: 240 }],
    'Nicknamed the "black hole" for its acoustic signature: a modern diesel boat on batteries is quieter than a nuclear one.');

  nav('Independence-class LCS', 'United States', 'Littoral combat ship, trimaran',
    [['Maximum', kn(44)], ['Cruise', kn(18)]],
    [['Range at 18 kn', nmi(4300), 'dist'], ['Full displacement', t(3100), 'mass'], ['Core crew', 40, 'none']],
    [{ n: 'Mk 110 57 mm gun', eff: 17000, max: 17000, mv: 1035 },
     { n: 'RIM-116 RAM', eff: 9000, max: 9000, mv: 680 },
     { n: 'Naval Strike Missile', eff: 185000, max: 185000, mv: 300 }]);

  nav('Visby-class corvette', 'Sweden', 'Stealth corvette',
    [['Maximum', kn(35)], ['Cruise', kn(15)]],
    [['Range', nmi(2300), 'dist'], ['Full displacement', t(640), 'mass'], ['Crew', 43, 'none']],
    [{ n: 'Bofors 57 mm Mk3', eff: 17000, max: 17000, mv: 1035 },
     { n: 'RBS-15 Mk3 anti-ship', eff: 200000, max: 250000, mv: 300 },
     { n: 'ASW torpedo 400 mm', eff: 20000, max: 20000, mv: 20 }]);

  nav('Fast attack craft (missile)', 'Various', 'Coastal missile boat',
    [['Maximum', kn(40)], ['Cruise', kn(15)]],
    [['Range', nmi(1500), 'dist'], ['Displacement', t(500), 'mass'], ['Crew', 40, 'none']],
    [{ n: '76 mm gun', eff: 16000, max: 16000, mv: 925 },
     { n: 'Anti-ship missiles (4-8)', eff: 130000, max: 200000, mv: 300 }],
    'Small, cheap and heavily armed: the asymmetric answer to a major surface combatant in confined water.');

  nav('LCAC / Ship-to-Shore Connector', 'United States', 'Air-cushion landing craft',
    [['Loaded', kn(35)], ['Maximum', kn(40)]],
    [['Range', nmi(200), 'dist'], ['Payload', t(74), 'mass']],
    [{ n: '12.7 mm mounts', eff: 1830, max: 6800, mv: 890 }],
    'Hovercraft: can cross 70 % of the world beaches, against about 15 % for a conventional landing craft.');

  /* ── military drones & UAS ────────────────────────────────────────── */

  function uas(n, country, d, speeds, specs, arms, note) {
    m('uas', n, country, d, speeds, specs, arms, note);
  }

  uas('MQ-9A Reaper', 'United States', 'Medium-altitude long-endurance armed UAS',
    [['Cruise', kmh(313)], ['Maximum', kmh(482)]],
    [['Endurance', 27, 'none', 'hours'], ['Range', km(1900), 'dist'], ['Service ceiling', 15420, 'alt'],
     ['Payload', 1700, 'mass'], ['Wingspan', 20, 'length']],
    [{ n: 'AGM-114 Hellfire (up to 4)', eff: 8000, max: 11000, mv: 425 },
     { n: 'GBU-12 Paveway II', eff: 15000, max: 15000, mv: 300 },
     { n: 'GBU-38 JDAM', eff: 28000, max: 28000, mv: 300 }]);

  uas('RQ-4B Global Hawk', 'United States', 'High-altitude long-endurance reconnaissance',
    [['Cruise', kmh(574)], ['Maximum', kmh(629)]],
    [['Endurance', 32, 'none', 'hours'], ['Ferry range', km(22780), 'dist'], ['Service ceiling', 18300, 'alt'],
     ['Wingspan', 39.9, 'length'], ['Area imaged per day', 100000000000, 'area']],
    null,
    'Unarmed. One sortie images an area the size of a small country.');

  uas('Bayraktar TB2', 'Türkiye', 'Medium-altitude armed UAS',
    [['Cruise', kmh(130)], ['Maximum', kmh(220)]],
    [['Endurance', 27, 'none', 'hours'], ['Range, line of sight', km(300), 'dist'], ['Service ceiling', 8200, 'alt'],
     ['Payload', 150, 'mass'], ['Wingspan', 12, 'length']],
    [{ n: 'MAM-L smart micro munition', eff: 8000, max: 14000, mv: 200 },
     { n: 'MAM-C', eff: 8000, max: 8000, mv: 200 }],
    'Cheap enough to be expendable and accurate enough to matter: it changed the economics of air power in several recent conflicts.');

  uas('Bayraktar Akinci', 'Türkiye', 'High-altitude long-endurance armed UAS',
    [['Cruise', kmh(241)], ['Maximum', kmh(361)]],
    [['Endurance', 24, 'none', 'hours'], ['Service ceiling', 12200, 'alt'], ['Payload', 1350, 'mass'], ['Wingspan', 20, 'length']],
    [{ n: 'MAM-L / MAM-T', eff: 14000, max: 30000, mv: 200 },
     { n: 'SOM-A cruise missile', eff: 250000, max: 250000, mv: 270 },
     { n: 'Gökdogan air-to-air', eff: 65000, max: 65000, mv: 1200 }]);

  uas('Wing Loong II', 'China', 'Medium-altitude long-endurance armed UAS',
    [['Cruise', kmh(200)], ['Maximum', kmh(370)]],
    [['Endurance', 32, 'none', 'hours'], ['Service ceiling', 9000, 'alt'], ['Payload', 480, 'mass']],
    [{ n: 'AR-1 / AR-2 missile', eff: 8000, max: 10000, mv: 300 },
     { n: 'FT-9 guided bomb', eff: 10000, max: 10000, mv: 300 }]);

  uas('Shahed-136 / Geran-2', 'Iran', 'Loitering munition, delta wing',
    [['Cruise', kmh(185)]],
    [['Range', km(2500), 'dist'], ['Warhead', 50, 'mass'], ['Cruise altitude', 1500, 'alt'], ['Wingspan', 2.5, 'length']],
    [{ n: 'Fixed warhead', eff: 2500000, max: 2500000, mv: 51, note: 'The airframe is the weapon.' }],
    'Slow, loud and low, which makes it detectable but cheap: the defence problem is cost per intercept, not difficulty.');

  uas('Lancet-3', 'Russia', 'Loitering munition',
    [['Cruise', kmh(80)], ['Terminal dive', kmh(300)]],
    [['Range', km(40), 'dist'], ['Endurance', 0.7, 'none', 'hours'], ['Warhead', 3, 'mass']],
    [{ n: 'Fixed warhead', eff: 40000, max: 40000, mv: 22 }]);

  uas('Switchblade 300', 'United States', 'Man-portable loitering munition',
    [['Cruise', kmh(101)], ['Dash', kmh(160)]],
    [['Range', km(10), 'dist'], ['Endurance', 0.25, 'none', 'hours'], ['System weight', 2.5, 'mass']],
    [{ n: 'Anti-personnel warhead', eff: 10000, max: 10000, mv: 28 }],
    'Fits in a rucksack. Can be waved off in flight, which is the feature that distinguishes it from a rocket.');

  uas('Switchblade 600', 'United States', 'Anti-armour loitering munition',
    [['Cruise', kmh(113)], ['Dash', kmh(185)]],
    [['Range', km(40), 'dist'], ['Endurance', 0.67, 'none', 'hours'], ['System weight', 23, 'mass']],
    [{ n: 'Anti-armour warhead', eff: 40000, max: 40000, mv: 31 }]);

  uas('IAI Harop', 'Israel', 'Anti-radiation loitering munition',
    [['Cruise', kmh(185)]],
    [['Range', km(1000), 'dist'], ['Endurance', 9, 'none', 'hours'], ['Warhead', 23, 'mass']],
    [{ n: 'Fixed warhead', eff: 1000000, max: 1000000, mv: 51 }]);

  uas('Orlan-10', 'Russia', 'Tactical reconnaissance UAS',
    [['Cruise', kmh(110)], ['Maximum', kmh(150)]],
    [['Endurance', 16, 'none', 'hours'], ['Control range', km(120), 'dist'], ['Service ceiling', 5000, 'alt'], ['Weight', 18, 'mass']],
    null, 'Primarily an artillery spotter. Its presence overhead usually means indirect fire is being adjusted.');

  uas('ScanEagle', 'United States', 'Small tactical reconnaissance UAS',
    [['Cruise', kmh(90)], ['Maximum', kmh(148)]],
    [['Endurance', 24, 'none', 'hours'], ['Service ceiling', 5950, 'alt'], ['Weight', 22, 'mass']],
    null, 'Catapult launched and recovered by snagging a wire: needs no runway, so it flies from small ships.');

  uas('Black Hornet PRS', 'Norway', 'Nano reconnaissance UAS',
    [['Cruise', kmh(11)], ['Maximum', kmh(21)]],
    [['Endurance', 0.42, 'none', 'hours'], ['Range', km(2), 'dist'], ['Weight', 0.033, 'mass']],
    null, 'Fits in a pocket and is near-silent beyond a few metres. Used to look around the next corner or over a wall.');

  uas('FPV attack quadcopter', 'Various', 'Improvised or purpose-built strike drone',
    [['Cruise', kmh(80)], ['Terminal dash', kmh(150)]],
    [['Range', km(10), 'dist'], ['Endurance', 0.25, 'none', 'hours'], ['Warhead', 1.5, 'mass']],
    [{ n: 'Shaped charge or fragmentation', eff: 10000, max: 20000, mv: 42 }],
    'Cheap, numerous and flown by a pilot wearing goggles. The defensive problem is detection and electronic warfare, not armour.');

  /* ── missiles & rockets ───────────────────────────────────────────── */

  function msl(n, country, d, speeds, specs, note) {
    C.add({ cat: 'mil', sub: 'missile', n: n, d: country + ' · ' + d, country: country, speeds: speeds, specs: specs, note: note });
  }

  /* same record, filed under the strategic subcategory */
  function strat(n, country, d, speeds, specs, note) {
    C.add({ cat: 'mil', sub: 'icbm', n: n, d: country + ' · ' + d, country: country, speeds: speeds, specs: specs, note: note });
  }
  window.ART_STRAT_MSL = strat;

  msl('FGM-148 Javelin', 'United States', 'Man-portable anti-tank guided missile',
    [['Flight speed', 140]],
    [['Effective range', 2500, 'dist'], ['Maximum range (Block 1)', 4750, 'dist'], ['System weight', 22.3, 'mass'],
     ['Warhead', 8.4, 'mass'], ['Time of flight to 2 km', 14, 'none', 'seconds']],
    'Fire-and-forget with a top-attack profile: it climbs and dives onto the thinner roof armour. Soft launch means it can be fired from inside a building.');

  msl('NLAW', 'United Kingdom / Sweden', 'Short-range anti-tank weapon',
    [['Flight speed', 200]],
    [['Minimum range', 20, 'dist'], ['Effective range', 800, 'dist'], ['System weight', 12.5, 'mass'],
     ['Time of flight to 600 m', 3, 'none', 'seconds']],
    'Predicted line of sight: the gunner tracks the target for a few seconds before firing and the missile flies the predicted path. Overfly top attack.');

  msl('BGM-71 TOW-2B', 'United States', 'Wire-guided anti-tank missile',
    [['Flight speed', 300]],
    [['Effective range', 3750, 'dist'], ['Maximum range', 4500, 'dist'], ['Warhead', 6.14, 'mass'],
     ['Time of flight to 3 km', 15, 'none', 'seconds']],
    'The gunner must keep the sight on the target for the whole flight, which is up to 20 seconds of exposure.');

  msl('Spike LR2', 'Israel', 'Multi-purpose guided missile',
    [['Flight speed', 180]],
    [['Effective range, ground launch', 5500, 'dist'], ['Range, helicopter launch', 10000, 'dist'], ['System weight', 12.7, 'mass']],
    'Fibre-optic link lets the operator see through the missile and change aim point in flight, or abort.');

  msl('9M133 Kornet', 'Russia', 'Laser beam-riding anti-tank missile',
    [['Flight speed', 250]],
    [['Effective range, day', 5500, 'dist'], ['Maximum range (Kornet-EM)', 10000, 'dist'], ['Warhead', 4.6, 'mass']]);

  msl('RPG-7', 'Russia / worldwide', 'Shoulder-fired rocket-propelled grenade',
    [['Muzzle velocity', 115], ['Velocity after boost', 294]],
    [['Effective range, stationary target', 500, 'dist'], ['Effective range, moving target', 200, 'dist'],
     ['Maximum range (self-destruct)', 920, 'dist'], ['System weight', 7, 'mass']],
    'Self-destructs at about 920 m, roughly 4.5 seconds of flight. Backblast danger area extends 20 m behind the firer.');

  msl('AT4 / M136', 'Sweden', 'Disposable anti-armour weapon',
    [['Muzzle velocity', 220]],
    [['Effective range', 300, 'dist'], ['Maximum range', 2100, 'dist'], ['Weight', 6.7, 'mass']]);

  msl('Carl Gustaf M4', 'Sweden', 'Recoilless rifle, 84 mm',
    [['Muzzle velocity', 255]],
    [['Effective range, HEAT', 700, 'dist'], ['Effective range, HE with fuze', 1500, 'dist'],
     ['Maximum range, guided round', 2500, 'dist'], ['Weight', 6.8, 'mass']]);

  msl('FIM-92 Stinger', 'United States', 'Man-portable air defence missile',
    [['Flight speed', 750]],
    [['Effective range', 4800, 'dist'], ['Engagement ceiling', 3800, 'alt'], ['System weight', 15.2, 'mass'], ['Maximum Mach', 2.2, 'none']],
    'Infrared homing, fire and forget. The reason helicopters fly low and fast, and use terrain masking.');

  msl('9K338 Igla-S', 'Russia', 'Man-portable air defence missile',
    [['Flight speed', 570]],
    [['Effective range', 6000, 'dist'], ['Engagement ceiling', 3500, 'alt'], ['System weight', 19, 'mass']]);

  msl('AIM-120D AMRAAM', 'United States', 'Beyond-visual-range air-to-air missile',
    [['Flight speed', 1400]],
    [['Effective range', 160000, 'dist'], ['Maximum range', 180000, 'dist'], ['Maximum Mach', 4, 'none']]);

  msl('MBDA Meteor', 'Europe', 'Ramjet beyond-visual-range air-to-air missile',
    [['Flight speed', 1400]],
    [['Effective range', 200000, 'dist'], ['Maximum Mach', 4, 'none']],
    'A throttleable ramjet keeps energy in the terminal phase, which is what makes its no-escape zone unusually large.');

  msl('AIM-9X Sidewinder', 'United States', 'Short-range air-to-air missile',
    [['Flight speed', 850]],
    [['Effective range', 35000, 'dist'], ['Maximum Mach', 2.5, 'none']]);

  msl('Tomahawk Block V', 'United States', 'Long-range land-attack cruise missile',
    [['Cruise speed', 246]],
    [['Range', 1600000, 'dist'], ['Warhead', 450, 'mass'], ['Cruise altitude', 50, 'alt', 'terrain following']],
    'Subsonic and low: it trades speed for a small radar cross-section and terrain masking.');

  msl('AGM-158B JASSM-ER', 'United States', 'Stealth air-launched cruise missile',
    [['Cruise speed', 270]],
    [['Range', 1000000, 'dist'], ['Warhead', 450, 'mass']]);

  msl('Storm Shadow / SCALP-EG', 'Europe', 'Air-launched cruise missile',
    [['Cruise speed', 270]],
    [['Range', 550000, 'dist'], ['Export range', 250000, 'dist'], ['Warhead', 450, 'mass', 'BROACH penetrator']]);

  msl('3M14 Kalibr', 'Russia', 'Land-attack cruise missile',
    [['Cruise speed', 240], ['Terminal dash', 990]],
    [['Range, ship-launched', 2500000, 'dist'], ['Warhead', 450, 'mass']]);

  msl('BrahMos', 'India / Russia', 'Supersonic cruise missile',
    [['Cruise speed', 950]],
    [['Range, standard', 290000, 'dist'], ['Range, extended', 800000, 'dist'], ['Maximum Mach', 3, 'none']]);

  msl('P-800 Oniks', 'Russia', 'Supersonic anti-ship missile',
    [['Cruise speed', 850]],
    [['Range, high-low profile', 600000, 'dist'], ['Range, sea-skimming', 120000, 'dist'], ['Maximum Mach', 2.6, 'none']]);

  msl('3M22 Zircon', 'Russia', 'Hypersonic anti-ship / land-attack missile',
    [['Cruise speed', 2700]],
    [['Range', 1000000, 'dist'], ['Maximum Mach', 8, 'none'], ['Cruise altitude', 28000, 'alt']]);

  msl('Kh-47M2 Kinzhal', 'Russia', 'Air-launched ballistic missile',
    [['Terminal speed', 3400]],
    [['Range', 2000000, 'dist'], ['Maximum Mach', 10, 'none'], ['Warhead', 500, 'mass']],
    'Effectively an air-launched Iskander. Claimed manoeuvring reentry, though intercepts have been reported.');

  msl('9K720 Iskander-M', 'Russia', 'Short-range ballistic missile',
    [['Terminal speed', 2100]],
    [['Range', 500000, 'dist'], ['Warhead', 700, 'mass'], ['Apogee', 50000, 'alt'], ['Flight time to 400 km', 8, 'none', 'minutes']]);

  msl('ATACMS (MGM-140)', 'United States', 'Army tactical ballistic missile',
    [['Terminal speed', 1000]],
    [['Range', 300000, 'dist'], ['Warhead', 227, 'mass']]);

  msl('AGM-84 Harpoon Block II', 'United States', 'Anti-ship missile',
    [['Cruise speed', 290]],
    [['Range, air-launched', 124000, 'dist'], ['Range, Block II ER', 300000, 'dist'], ['Warhead', 221, 'mass'],
     ['Sea-skimming altitude', 5, 'alt']]);

  msl('Naval Strike Missile', 'Norway', 'Stealth anti-ship missile',
    [['Cruise speed', 300]],
    [['Range', 185000, 'dist'], ['Warhead', 125, 'mass']]);

  msl('Exocet MM40 Block 3', 'France', 'Anti-ship missile',
    [['Cruise speed', 315]],
    [['Range', 200000, 'dist'], ['Warhead', 165, 'mass'], ['Sea-skimming altitude', 3, 'alt']]);

  msl('MIM-104 Patriot PAC-3 MSE', 'United States', 'Surface-to-air / anti-ballistic missile',
    [['Flight speed', 1700]],
    [['Intercept range, aircraft', 120000, 'dist'], ['Intercept range, ballistic', 35000, 'dist'],
     ['Intercept ceiling', 36000, 'alt'], ['Maximum Mach', 5, 'none']]);

  msl('THAAD', 'United States', 'Terminal-phase ballistic missile defence',
    [['Flight speed', 2800]],
    [['Intercept range', 200000, 'dist'], ['Intercept ceiling', 150000, 'alt'], ['Maximum Mach', 8.24, 'none']],
    'Hit to kill: no warhead, it destroys the target by collision.');

  msl('S-400 (40N6 missile)', 'Russia', 'Long-range surface-to-air system',
    [['Flight speed', 4800]],
    [['Maximum range', 400000, 'dist'], ['Intercept ceiling', 30000, 'alt'], ['Maximum Mach', 14, 'none'],
     ['Reaction time', 10, 'none', 'seconds']],
    'Quoted 400 km applies to large, high, non-manoeuvring targets. Against a low fighter the practical envelope is far smaller because of the radar horizon.');

  msl('Iron Dome (Tamir)', 'Israel', 'Short-range rocket defence',
    [['Flight speed', 700]],
    [['Intercept range, minimum', 4000, 'dist'], ['Intercept range, maximum', 70000, 'dist']],
    'Only engages rockets predicted to land on a defended area, which is what keeps the cost exchange survivable.');

  msl('UGM-133 Trident II D5', 'United States', 'Submarine-launched ballistic missile',
    [['Terminal reentry speed', 6100]],
    [['Range', 12000000, 'dist'], ['Accuracy (CEP)', 90, 'dist'], ['Apogee', 1200000, 'alt'],
     ['Flight time, full range', 30, 'none', 'minutes']]);

  strat('LGM-30G Minuteman III', 'United States', 'Intercontinental ballistic missile',
    [['Terminal reentry speed', 7000]],
    [['Range', 13000000, 'dist'], ['Apogee', 1120000, 'alt'], ['Flight time, full range', 30, 'none', 'minutes']]);

})();
