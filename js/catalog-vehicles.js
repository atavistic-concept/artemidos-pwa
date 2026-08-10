/*
 * Artemidos - catalogue: civilian vehicles
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Cruise speeds are the figure the operator actually plans to, not the
 * placard maximum. Ranges are still-air, no-reserve manufacturer figures:
 * subtract fuel reserve, wind and payload before using one for planning.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (v) { return v / 3.6; };
  var kn = function (v) { return v * 1852 / 3600; };
  var km = function (v) { return v * 1000; };
  var nmi = function (v) { return v * 1852; };

  C.cat({
    id: 'civ', n: 'Civilian vehicles', icon: 'car',
    d: 'Road, rail, air and sea, with range and endurance',
    subs: [
      { id: 'car', n: 'Cars', icon: 'car' },
      { id: 'moto', n: 'Motorcycles', icon: 'moto' },
      { id: 'truck', n: 'Trucks & buses', icon: 'car' },
      { id: 'train', n: 'Trains', icon: 'train' },
      { id: 'heli', n: 'Helicopters', icon: 'heli' },
      { id: 'air', n: 'Aircraft', icon: 'plane' },
      { id: 'boat', n: 'Boats & ships', icon: 'ship' },
      { id: 'drone', n: 'Drones', icon: 'drone' },
      { id: 'bike', n: 'Bicycles', icon: 'moto', d: 'Road, mountain, cargo, electric and record' },
      { id: 'personal', n: 'Other personal transport', icon: 'person' }
    ]
  });

  function v(sub, n, d, speeds, specs, note) {
    C.add({ cat: 'civ', sub: sub, n: n, d: d, speeds: speeds, specs: specs, note: note });
  }

  /* ── cars ─────────────────────────────────────────────────────────── */

  v('car', 'Compact hatchback', 'Toyota Corolla class',
    [['Urban', kmh(50)], ['Rural road', kmh(90)], ['Motorway cruise', kmh(120)], ['Top speed', kmh(195)]],
    [['Typical range', km(700), 'dist'], ['Fuel consumption', 6, 'none', 'L/100 km'], ['0-100 km/h', 9.2, 'none', 'seconds'], ['Kerb weight', 1350, 'mass']]);

  v('car', 'Executive saloon', 'Mercedes E-Class / BMW 5 Series class',
    [['Urban', kmh(50)], ['Motorway cruise', kmh(130)], ['Top speed (limited)', kmh(250)]],
    [['Typical range', km(800), 'dist'], ['Fuel consumption', 7.5, 'none', 'L/100 km'], ['0-100 km/h', 6.2, 'none', 'seconds'], ['Kerb weight', 1850, 'mass']]);

  v('car', 'Armoured SUV (VR7 / B6)', 'Protected executive transport',
    [['Urban', kmh(50)], ['Motorway cruise', kmh(110)], ['Top speed', kmh(180)]],
    [['Typical range', km(600), 'dist'], ['Fuel consumption', 16, 'none', 'L/100 km'], ['0-100 km/h', 9.5, 'none', 'seconds'], ['Kerb weight', 4200, 'mass'], ['Run-flat range', km(80), 'dist']],
    'Armour adds 1 to 1.5 tonnes. Braking distance, cornering limits and tyre wear all change: rehearse the actual vehicle, never the unarmoured equivalent.');

  v('car', 'Large SUV', 'Toyota Land Cruiser 300 class',
    [['Urban', kmh(50)], ['Motorway cruise', kmh(120)], ['Off-road, track', kmh(40)], ['Off-road, rough', kmh(15)], ['Top speed', kmh(210)]],
    [['Typical range', km(900), 'dist'], ['Fuel consumption', 9.5, 'none', 'L/100 km'], ['Fording depth', 0.7, 'length'], ['Kerb weight', 2600, 'mass']]);

  v('car', 'Pickup truck', 'Ford F-150 / Hilux class',
    [['Urban', kmh(50)], ['Motorway cruise', kmh(110)], ['Top speed', kmh(170)]],
    [['Typical range', km(750), 'dist'], ['Payload', 1000, 'mass'], ['Kerb weight', 2300, 'mass']]);

  v('car', 'Electric saloon', 'Tesla Model 3 Long Range class',
    [['Urban', kmh(50)], ['Motorway cruise', kmh(120)], ['Top speed', kmh(233)]],
    [['WLTP range', km(629), 'dist'], ['Realistic motorway range', km(430), 'dist'], ['0-100 km/h', 4.4, 'none', 'seconds'], ['Battery', 75, 'none', 'kWh']],
    'Electric range falls sharply above 110 km/h and in cold weather. Plan motorway legs on roughly 70 % of the WLTP figure.');

  v('car', 'Sports car', 'Porsche 911 Turbo S class',
    [['Motorway cruise', kmh(130)], ['Top speed', kmh(330)]],
    [['Range', km(550), 'dist'], ['0-100 km/h', 2.7, 'none', 'seconds'], ['Kerb weight', 1640, 'mass']]);

  v('car', 'Hypercar', 'Bugatti Chiron Super Sport class',
    [['Top speed (limited)', kmh(440)], ['Top speed (unlocked)', kmh(490)]],
    [['Range at cruise', km(400), 'dist'], ['0-100 km/h', 2.4, 'none', 'seconds'], ['Power', 1177000, 'power']]);

  v('car', 'Rally car (WRC)', 'Competition',
    [['Gravel stage average', kmh(110)], ['Tarmac stage average', kmh(125)], ['Top speed', kmh(200)]],
    [['Kerb weight', 1260, 'mass'], ['Power', 373000, 'power']]);

  v('car', 'Formula 1 car', 'Competition',
    [['Race average', kmh(200)], ['Top speed', kmh(360)]],
    [['Minimum weight with driver', 798, 'mass'], ['0-100 km/h', 2.6, 'none', 'seconds'], ['Peak braking', 58.8, 'none', 'up to 6 g']]);

  v('car', 'Land speed record', 'ThrustSSC, 1997',
    [['Record speed', kmh(1227.985)]],
    [['Distance', km(1.6), 'dist'], ['Thrust', 223000, 'force']],
    'The first supersonic land record. Run over a measured mile in the Black Rock Desert.');

  /* ── motorcycles ──────────────────────────────────────────────────── */

  v('moto', 'Scooter 125 cc', 'Urban commuter',
    [['Urban', kmh(45)], ['Top speed', kmh(100)]],
    [['Range', km(250), 'dist'], ['Weight', 120, 'mass']]);

  v('moto', 'Commuter 250-400 cc', 'Light motorcycle',
    [['Urban', kmh(50)], ['Cruise', kmh(110)], ['Top speed', kmh(150)]],
    [['Range', km(350), 'dist'], ['Weight', 165, 'mass']]);

  v('moto', 'Adventure tourer', 'BMW R1250GS class',
    [['Cruise', kmh(120)], ['Off-road track', kmh(50)], ['Top speed', kmh(200)]],
    [['Range', km(550), 'dist'], ['Fuel', 20, 'volume'], ['Weight', 249, 'mass']]);

  v('moto', 'Cruiser', 'Harley-Davidson Road King class',
    [['Cruise', kmh(110)], ['Top speed', kmh(175)]],
    [['Range', km(350), 'dist'], ['Weight', 375, 'mass']]);

  v('moto', 'Supersport 600 cc', 'Track-oriented',
    [['Cruise', kmh(120)], ['Top speed', kmh(260)]],
    [['Range', km(250), 'dist'], ['Weight', 190, 'mass']]);

  v('moto', 'Superbike 1000 cc', 'BMW S1000RR class',
    [['Cruise', kmh(130)], ['Top speed', kmh(299)]],
    [['Range', km(240), 'dist'], ['0-100 km/h', 3.1, 'none', 'seconds'], ['Weight', 197, 'mass']]);

  v('moto', 'Hyperbike', 'Kawasaki Ninja H2R class',
    [['Top speed', kmh(400)]],
    [['Power', 231000, 'power'], ['Weight', 216, 'mass']],
    'Track only. Not road legal in any jurisdiction.');

  v('moto', 'Motocross / enduro', 'Off-road competition',
    [['Trail', kmh(45)], ['Track', kmh(80)], ['Top speed', kmh(130)]],
    [['Range', km(120), 'dist'], ['Weight', 105, 'mass']]);

  v('moto', 'Electric motorcycle', 'Zero SR/F class',
    [['Urban', kmh(50)], ['Cruise', kmh(110)], ['Top speed', kmh(200)]],
    [['City range', km(260), 'dist'], ['Motorway range', km(130), 'dist'], ['Weight', 220, 'mass']]);

  /* ── trucks & buses ───────────────────────────────────────────────── */

  v('truck', 'Articulated lorry', '40 t semi-trailer',
    [['Motorway (EU limiter)', kmh(90)], ['Loaded hill climb', kmh(50)]],
    [['Range', km(2000), 'dist'], ['Gross weight', 40000, 'mass'], ['Fuel consumption', 32, 'none', 'L/100 km']],
    'Stopping distance from 90 km/h is roughly double a car of the same speed. Overtaking gaps must be planned for the trailer, not the cab.');

  v('truck', 'Rigid delivery truck', '7.5-18 t',
    [['Urban', kmh(45)], ['Motorway', kmh(90)]],
    [['Range', km(900), 'dist'], ['Gross weight', 18000, 'mass']]);

  v('truck', 'Coach', 'Long-distance passenger',
    [['Motorway', kmh(100)], ['Rural', kmh(80)]],
    [['Range', km(1000), 'dist'], ['Seats', 53, 'none']]);

  v('truck', 'City bus', 'Urban service',
    [['Service average with stops', kmh(18)], ['Between stops', kmh(45)], ['Top speed', kmh(80)]],
    [['Range', km(400), 'dist']]);

  v('truck', 'Ambulance', 'Emergency response',
    [['Urban response', kmh(60)], ['Motorway response', kmh(140)], ['Top speed', kmh(160)]],
    [['Range', km(600), 'dist']]);

  v('truck', 'Fire appliance', 'Emergency response',
    [['Urban response', kmh(55)], ['Top speed', kmh(110)]],
    [['Water capacity', 1.8, 'volume', 'm³'], ['Gross weight', 16000, 'mass']]);

  v('truck', 'Heavy haulage', 'Abnormal load',
    [['Escorted convoy', kmh(30)], ['Top speed', kmh(60)]],
    [['Gross weight', 120000, 'mass']]);

  /* ── trains ───────────────────────────────────────────────────────── */

  v('train', 'Metro / underground', 'Urban rapid transit',
    [['Service average with stops', kmh(32)], ['Between stations', kmh(70)], ['Top speed', kmh(80)]]);

  v('train', 'Commuter / regional', 'Suburban service',
    [['Service average', kmh(70)], ['Top speed', kmh(160)]]);

  v('train', 'Intercity', 'Conventional main line',
    [['Service average', kmh(130)], ['Top speed', kmh(200)]]);

  v('train', 'Freight train', 'Bulk and container',
    [['Service average', kmh(60)], ['Top speed', kmh(100)]],
    [['Typical train weight', 5000000, 'mass'], ['Stopping distance from 100 km/h', km(1.5), 'dist']],
    'A loaded freight train needs well over a kilometre to stop. Level-crossing decisions must assume the train cannot brake for you.');

  v('train', 'TGV (service)', 'France, high speed',
    [['Commercial service', kmh(320)], ['Record run, 2007', kmh(574.8)]],
    [['Route length, LGV Est', km(406), 'dist']]);

  v('train', 'Shinkansen N700S', 'Japan, high speed',
    [['Commercial service', kmh(285)], ['Design maximum', kmh(360)]]);

  v('train', 'CR400 Fuxing', 'China, high speed',
    [['Commercial service', kmh(350)], ['Test speed', kmh(420)]]);

  v('train', 'Shanghai Transrapid', 'Maglev, commercial',
    [['Commercial service', kmh(431)], ['Route time', kmh(300)]],
    [['Route length', km(30.5), 'dist'], ['Journey time', 8, 'none', 'minutes']]);

  v('train', 'L0 Series maglev', 'Japan, record',
    [['World rail record, 2015', kmh(603)]]);

  /* ── helicopters ──────────────────────────────────────────────────── */

  function heli(n, d, cruise, max, range, ceiling, pax, extra) {
    v('heli', n, d,
      [['Cruise', kmh(cruise)], ['Maximum', kmh(max)]],
      [['Range', km(range), 'dist'], ['Service ceiling', ceiling, 'alt'], ['Seats', pax, 'none']].concat(extra || []));
  }

  heli('Robinson R44', 'Light piston · 4 seat', 210, 240, 560, 4270, 4);
  heli('Robinson R66', 'Light turbine · 5 seat', 222, 240, 630, 4270, 5);
  heli('Airbus H125 (AS350)', 'Light single · utility', 245, 287, 610, 7010, 6,
    [['High-altitude landing record', 8848, 'alt', 'Everest summit, 2005']]);
  heli('Bell 407GXi', 'Light single · utility', 246, 260, 611, 5698, 7);
  heli('Airbus H130', 'Light single · passenger', 240, 260, 606, 5865, 8);
  heli('Airbus EC135 / H135', 'Light twin · EMS and police', 254, 259, 635, 6096, 8);
  heli('Airbus H145', 'Light twin · EMS and utility', 246, 268, 662, 5545, 10);
  heli('Bell 429', 'Light twin · corporate and EMS', 273, 287, 722, 6096, 8);
  heli('Leonardo AW109 GrandNew', 'Light twin · executive', 285, 311, 859, 6096, 7);
  heli('Leonardo AW139', 'Medium twin · offshore and VIP', 306, 310, 1061, 6096, 15);
  heli('Airbus H160', 'Medium twin · new generation', 287, 325, 850, 6096, 12);
  heli('Airbus H175', 'Medium twin · offshore', 287, 300, 1287, 6096, 16);
  heli('Sikorsky S-76D', 'Medium twin · executive', 287, 322, 761, 4267, 12);
  heli('Sikorsky S-92', 'Heavy twin · offshore and head of state', 280, 306, 999, 4572, 19);
  heli('Leonardo AW101', 'Heavy triple · VVIP and SAR', 278, 309, 1363, 4575, 30);
  heli('Mil Mi-8 / Mi-17', 'Medium twin · utility, worldwide', 240, 250, 590, 6000, 24);
  heli('Airbus H225 Super Puma', 'Heavy twin · offshore and SAR', 262, 275, 857, 6095, 19);

  /* ── aircraft ─────────────────────────────────────────────────────── */

  function ac(n, d, cruise, max, range, ceiling, pax, extra) {
    v('air', n, d,
      [['Cruise', kmh(cruise)]].concat(max ? [['Maximum', kmh(max)]] : []),
      [['Range', km(range), 'dist'], ['Service ceiling', ceiling, 'alt'], ['Seats', pax, 'none']].concat(extra || []));
  }

  ac('Cessna 172 Skyhawk', 'Single piston · training', 226, 302, 1272, 4100, 4);
  ac('Cirrus SR22', 'Single piston · high performance', 389, 407, 2000, 5300, 5);
  ac('Pilatus PC-12 NGX', 'Single turboprop · utility and executive', 528, 545, 3417, 9144, 9,
    [['Runway required', 800, 'length', 'unpaved capable']]);
  ac('Beechcraft King Air 360', 'Twin turboprop · executive', 578, 585, 3345, 10668, 9);
  ac('ATR 72-600', 'Twin turboprop · regional airline', 511, 511, 1528, 7620, 72);
  ac('Cessna Citation CJ3+', 'Light jet', 776, 778, 3778, 13716, 8);
  ac('Embraer Phenom 300E', 'Light jet · best selling', 839, 839, 3724, 13716, 10);
  ac('Cessna Citation Longitude', 'Super-midsize jet', 895, 895, 6482, 13716, 12);
  ac('Dassault Falcon 8X', 'Long-range jet', 850, 950, 11945, 15550, 16);
  ac('Gulfstream G650ER', 'Ultra-long-range jet', 904, 982, 13890, 15545, 19,
    [['Cruise Mach', 0.85, 'none'], ['Maximum Mach', 0.925, 'none']]);
  ac('Bombardier Global 7500', 'Ultra-long-range jet', 900, 982, 14260, 15545, 19);
  ac('Airbus A320neo', 'Narrowbody airliner', 833, 871, 6300, 12000, 180);
  ac('Boeing 737 MAX 8', 'Narrowbody airliner', 839, 871, 6570, 12500, 178);
  ac('Boeing 787-9 Dreamliner', 'Widebody airliner', 903, 954, 14140, 13100, 296);
  ac('Airbus A350-900', 'Widebody airliner', 903, 945, 15000, 13100, 315);
  ac('Boeing 777-300ER', 'Widebody airliner', 892, 950, 13650, 13140, 396);
  ac('Airbus A380-800', 'Widebody airliner · largest passenger aircraft', 903, 945, 15200, 13100, 555);
  ac('Boeing 747-8i', 'Widebody airliner', 917, 988, 14320, 13100, 410);
  ac('Concorde', 'Supersonic airliner, retired 2003', 2179, 2179, 7250, 18300, 100,
    [['Cruise Mach', 2.04, 'none'], ['London to New York', 2.9, 'none', 'hours']]);

  /* ── boats & ships ────────────────────────────────────────────────── */

  function boat(n, d, speeds, specs, note) { v('boat', n, d, speeds, specs, note); }

  boat('Jet ski / PWC', 'Personal watercraft',
    [['Cruise', kn(35)], ['Top speed', kn(60)]],
    [['Range', nmi(90), 'dist'], ['Fuel', 70, 'volume', 'litres']]);

  boat('RIB (rigid inflatable)', 'Tender, patrol and transfer',
    [['Cruise', kn(28)], ['Top speed', kn(45)]],
    [['Range', nmi(200), 'dist']],
    'Comfortable speed drops fast with sea state: a RIB doing 40 knots in flat water may be limited to 15 in a short chop.');

  boat('Sports cruiser', '10-15 m planing motor boat',
    [['Cruise', kn(25)], ['Top speed', kn(38)]],
    [['Range', nmi(300), 'dist']]);

  boat('Motor yacht, 30 m', 'Semi-displacement',
    [['Cruise', kn(18)], ['Top speed', kn(25)]],
    [['Range at cruise', nmi(1200), 'dist'], ['Range at 10 kn', nmi(4000), 'dist']]);

  boat('Superyacht, 100 m', 'Displacement',
    [['Cruise', kn(15)], ['Top speed', kn(20)]],
    [['Range', nmi(6000), 'dist'], ['Displacement', 3000000, 'mass']]);

  boat('Sailing yacht, cruising', '12-18 m monohull',
    [['Average passage speed', kn(6)], ['Good conditions', kn(8)], ['Hull speed', kn(9)]],
    [['Daily run', nmi(150), 'dist']]);

  boat('Racing trimaran', 'Ocean racing multihull',
    [['Average', kn(25)], ['Peak', kn(45)]],
    [['24-hour record', nmi(908), 'dist']]);

  boat('Fast ferry (catamaran)', 'Passenger and vehicle',
    [['Service speed', kn(38)], ['Top speed', kn(45)]],
    [['Range', nmi(400), 'dist']]);

  boat('Container ship', 'Post-Panamax',
    [['Economical cruise', kn(18)], ['Service speed', kn(24)]],
    [['Range', nmi(20000), 'dist'], ['Capacity', 14000, 'none', 'TEU']],
    'Slow steaming at 16-18 knots is normal: fuel burn rises roughly with the cube of speed.');

  boat('Bulk carrier', 'Capesize',
    [['Service speed', kn(14)]],
    [['Deadweight', 180000000, 'mass']]);

  boat('VLCC oil tanker', 'Very large crude carrier',
    [['Service speed', kn(16)]],
    [['Stopping distance', nmi(3), 'dist'], ['Deadweight', 300000000, 'mass']],
    'A loaded VLCC needs about three nautical miles and twenty minutes to stop from service speed.');

  boat('Cruise ship', 'Large passenger vessel',
    [['Service speed', kn(22)], ['Maximum', kn(24)]],
    [['Range', nmi(6000), 'dist'], ['Passengers', 5000, 'none']]);

  boat('Tugboat', 'Harbour and escort',
    [['Free running', kn(13)]],
    [['Bollard pull', 800000, 'force']]);

  boat('Hydrofoil ferry', 'Foil-borne passenger',
    [['Foil-borne', kn(45)], ['Hull-borne', kn(12)]]);

  boat('Water speed record', 'Spirit of Australia, 1978',
    [['Record speed', kmh(511.11)]], null,
    'The outright water speed record has stood since 1978. Several attempts to beat it have been fatal.');

  /* ── drones ───────────────────────────────────────────────────────── */

  function drone(n, d, speeds, specs, note) { v('drone', n, d, speeds, specs, note); }

  drone('DJI Mini 4 Pro', 'Sub-250 g folding quadcopter',
    [['Normal mode', 10], ['Sport mode', 16]],
    [['Flight time', 34, 'none', 'minutes'], ['Transmission range', km(20), 'dist'], ['Weight', 0.249, 'mass'], ['Max wind resistance', 10.7, 'speed']],
    'Under 250 g, so it sits outside the heavier registration classes in most jurisdictions. Check local rules before every flight: they change often.');

  drone('DJI Mavic 3 Pro', 'Prosumer folding quadcopter',
    [['Normal mode', 15], ['Sport mode', 21]],
    [['Flight time', 43, 'none', 'minutes'], ['Transmission range', km(15), 'dist'], ['Weight', 0.958, 'mass'], ['Max wind resistance', 12, 'speed']]);

  drone('DJI Air 3S', 'Prosumer folding quadcopter',
    [['Normal mode', 12], ['Sport mode', 21]],
    [['Flight time', 45, 'none', 'minutes'], ['Transmission range', km(20), 'dist'], ['Weight', 0.724, 'mass']]);

  drone('DJI Matrice 350 RTK', 'Industrial multirotor',
    [['Cruise', 15], ['Maximum', 23]],
    [['Flight time', 55, 'none', 'minutes'], ['Transmission range', km(20), 'dist'], ['Payload', 2.7, 'mass'], ['Service ceiling', 7000, 'alt']]);

  drone('DJI FPV / Avata', 'First-person-view racing style',
    [['Normal mode', 15], ['Manual mode', 39]],
    [['Flight time', 20, 'none', 'minutes'], ['0-100 km/h', 2, 'none', 'seconds']]);

  drone('Racing FPV quad (5 inch)', 'Custom competition build',
    [['Race pace', 30], ['Top speed', 60]],
    [['Flight time', 4, 'none', 'minutes'], ['Weight', 0.65, 'mass']]);

  drone('WingtraOne GEN II', 'VTOL fixed-wing survey',
    [['Cruise', 16]],
    [['Flight time', 59, 'none', 'minutes'], ['Coverage per flight', 4000000, 'area'], ['Weight', 3.7, 'mass']]);

  drone('DJI Agras T40', 'Agricultural spraying',
    [['Operating', 7], ['Maximum', 10]],
    [['Tank capacity', 40, 'volume', 'litres'], ['Coverage rate', 210000, 'area', 'per hour']]);

  drone('Delivery drone (Wing class)', 'Parcel delivery',
    [['Cruise', 31]],
    [['Range', km(12), 'dist'], ['Payload', 1.2, 'mass']]);

  /* ── bicycles ─────────────────────────────────────────────────────── */

  function bike(n, d, speeds, specs, note) { v('bike', n, d, speeds, specs, note); }

  bike('City bicycle', 'Upright commuter, flat bar',
    [['Relaxed', kmh(15)], ['Steady', kmh(20)], ['Brisk', kmh(25)]],
    [['Typical commute range', km(20), 'dist'], ['Comfortable day range', km(50), 'dist'], ['Weight', 15, 'mass']],
    'Faster than a car door to door for anything under about 5 km in a congested city.');

  bike('Hybrid / trekking bicycle', 'Flat bar, wider tyres, rack mounts',
    [['Steady', kmh(22)], ['Brisk', kmh(27)], ['Loaded touring', kmh(18)]],
    [['Day range, unloaded', km(90), 'dist'], ['Day range, loaded touring', km(70), 'dist'], ['Weight', 13, 'mass']]);

  bike('Road bicycle', 'Drop bar, trained rider',
    [['Endurance pace', kmh(28)], ['Fast group ride', kmh(35)], ['Solo hard effort', kmh(40)], ['Descending', kmh(70)]],
    [['Day range, trained', km(160), 'dist'], ['Weight', 8, 'mass'], ['Climbing rate, trained', 800, 'alt', 'metres per hour']]);

  bike('Road bicycle, professional', 'Grand tour racing',
    [['Peloton average', kmh(45)], ['Breakaway', kmh(48)], ['Time trial', kmh(50)], ['Sprint peak', kmh(70)]],
    [['Hour record, Ganna 2022', km(56.792), 'dist'], ['Stage distance, typical', km(180), 'dist'],
     ['Grand tour total', km(3500), 'dist'], ['Minimum UCI weight', 6.8, 'mass'],
     ['Sustained power, professional', 400, 'power'], ['Sprint peak power', 1800, 'power']]);

  bike('Time trial bicycle', 'Aerodynamic, against the clock',
    [['Amateur', kmh(38)], ['Professional', kmh(50)], ['Track pursuit', kmh(60)]],
    [['Weight', 9, 'mass']],
    'Nearly all the resistance above 30 km/h is aerodynamic drag, which is why position matters more than the frame.');

  bike('Gravel bicycle', 'Drop bar, off-road capable',
    [['Gravel cruise', kmh(24)], ['Road cruise', kmh(30)], ['Rough track', kmh(15)]],
    [['Day range', km(120), 'dist'], ['Weight', 9.5, 'mass']]);

  bike('Mountain bike, cross-country', 'Lightweight, efficient',
    [['Climbing', kmh(10)], ['Singletrack', kmh(22)], ['Fire road', kmh(28)]],
    [['Day range', km(60), 'dist'], ['Weight', 11, 'mass']]);

  bike('Mountain bike, enduro / downhill', 'Long travel, descending',
    [['Climbing (usually shuttled)', kmh(7)], ['Technical descent', kmh(35)], ['Fast descent', kmh(60)],
     ['World Cup downhill peak', kmh(80)]],
    [['Weight', 16, 'mass'], ['Suspension travel', 0.2, 'length']]);

  bike('Fat bike', 'Snow and sand',
    [['Packed snow', kmh(14)], ['Soft sand', kmh(10)], ['Road', kmh(20)]],
    [['Tyre width', 0.1, 'length'], ['Weight', 15, 'mass']],
    'Very low tyre pressure spreads the load, which is what lets it float on surfaces that stop a normal bike.');

  bike('Cargo bicycle', 'Longtail or box bike',
    [['Loaded', kmh(16)], ['Unloaded', kmh(22)]],
    [['Payload', 100, 'mass'], ['Range', km(30), 'dist'], ['Weight', 35, 'mass']]);

  bike('Folding bicycle', 'Small wheel, commuter',
    [['Cruise', kmh(18)], ['Brisk', kmh(24)]],
    [['Weight', 12, 'mass'], ['Folded volume', 0.09, 'volume', 'm³']]);

  bike('Tandem', 'Two riders',
    [['Cruise', kmh(32)], ['Descending', kmh(80)]],
    [['Weight', 18, 'mass']],
    'Faster than a solo bike on the flat and downhill because drag is shared between two engines, slower uphill because weight is not.');

  bike('Recumbent / velomobile', 'Low, faired',
    [['Recumbent cruise', kmh(35)], ['Velomobile cruise', kmh(45)], ['Velomobile peak', kmh(70)]],
    [['Day range, velomobile', km(300), 'dist']],
    'A faired velomobile holds the human-powered hour record and is genuinely faster than a road bike over distance.');

  bike('Electric bicycle, EU / UK pedelec', '250 W, assist to 25 km/h',
    [['Assisted cruise', kmh(25)], ['Unassisted', kmh(20)]],
    [['Range, eco mode', km(90), 'dist'], ['Range, full assist', km(45), 'dist'],
     ['Battery', 0.5, 'none', 'kWh typical'], ['Weight', 23, 'mass']],
    'Assist cuts out at 25 km/h in the EU and UK, and at 32 km/h (20 mph) for US class 1 and 2.');

  bike('Electric bicycle, speed pedelec', 'S-pedelec, assist to 45 km/h',
    [['Assisted cruise', kmh(45)]],
    [['Range', km(60), 'dist'], ['Weight', 27, 'mass']],
    'Legally a moped in most of Europe: needs a plate, a helmet and insurance, and is usually banned from cycle paths.');

  bike('Electric mountain bike', 'Full suspension, mid-drive motor',
    [['Climbing, assisted', kmh(18)], ['Trail', kmh(25)]],
    [['Range, mixed terrain', km(50), 'dist'], ['Ascent per charge', 1800, 'alt'], ['Weight', 24, 'mass']]);

  bike('Track bicycle', 'Fixed gear, no brakes, velodrome',
    [['Endurance pace', kmh(50)], ['Team pursuit', kmh(62)], ['Flying 200 m record pace', kmh(77)]],
    [['Weight', 7, 'mass']]);

  bike('Motor-paced record', 'Denise Mueller-Korenek, 2018',
    [['Record speed', kmh(296)]], null,
    'Behind a pace vehicle on the Bonneville Salt Flats, in its slipstream. Unpaced, drag makes anything near this impossible.');

  bike('Human-powered speed record', 'Todd Reichert, faired recumbent, 2016',
    [['Record speed', kmh(144.17)]], null,
    'Fully faired streamliner over a flying 200 m. The fastest a human has travelled under their own power on level ground.');

  /* ── other personal transport ─────────────────────────────────────── */

  function pers(n, d, speeds, specs, note) { v('personal', n, d, speeds, specs, note); }

  pers('Electric scooter', 'Standing kick scooter',
    [['Legal limit, many EU cities', kmh(20)], ['Unrestricted consumer', kmh(45)]],
    [['Range', km(40), 'dist']]);

  pers('Skateboard', 'Push and downhill',
    [['Cruising', kmh(12)], ['Downhill longboard', kmh(80)]]);

  pers('Inline skates', 'Recreational and speed',
    [['Recreational', kmh(18)], ['Speed skating', kmh(35)]]);

  pers('Alpine ski', 'Recreational to competition',
    [['Recreational', kmh(40)], ['Giant slalom', kmh(70)], ['Downhill race', kmh(130)], ['Speed skiing record', kmh(255)]]);

  pers('Snowboard', 'Recreational to competition',
    [['Recreational', kmh(35)], ['Race', kmh(80)]]);

  pers('Wingsuit', 'Human flight',
    [['Horizontal', kmh(160)], ['Vertical descent', kmh(60)]],
    [['Glide ratio', 2.5, 'none', 'typical 2.5:1']]);

  pers('Parachute descent', 'Sport canopy',
    [['Freefall, belly to earth', 55], ['Freefall, head down', 90], ['Under canopy, vertical', 5], ['Under canopy, forward', 15]]);

  /* ── underwater scooters (DPVs) ────────────────────────────────────────
     A diver propulsion vehicle is quoted in METRES PER MINUTE, not km/h,
     because that is the unit a dive plan is written in: 45 m/min for 30
     minutes is 1350 m out, and the diver who cannot do that arithmetic in
     the water should not be riding one.

     Every runtime below is the manufacturer's figure AT A STATED SPEED.
     Burn time collapses at full power - the same battery that gives three
     hours at cruise gives one at maximum - so the honest planning number is
     always the slow one. And the range figure is the range the machine can
     swim, not the range you may go: a dead scooter means swimming back
     against whatever current you happily rode out on, which is why cave
     practice is to plan the exit as though the motor has already failed. */

  var mmin = function (v) { return v / 60; };   /* m/min -> m/s */

  /* technical, cave and wreck */

  pers('Suex XJ14', 'Italian technical DPV, NiMH',
    [['Maximum', mmin(70)]],
    [['Runtime, cruise', 120, 'none', 'minutes'], ['Runtime, maximum speed', 60, 'none', 'minutes'],
     ['Operating depth', 200, 'length'], ['Test depth', 300, 'length'],
     ['Weight with battery', 20, 'mass'], ['Static thrust', 220, 'none', 'N'],
     ['Battery', 370, 'none', 'Wh NiMH']]);

  pers('Suex XJ37', 'Long-range technical and cave',
    [['Maximum', mmin(85)]],
    [['Runtime, cruise', 180, 'none', 'minutes'], ['Runtime, maximum speed', 85, 'none', 'minutes'],
     ['Operating depth', 200, 'length'], ['Test depth', 300, 'length'],
     ['Weight with battery', 20, 'mass'], ['Static thrust', 330, 'none', 'N'],
     ['Battery', 940, 'none', 'Wh Li-ion']],
    'A 940 Wh battery is far above the 160 Wh ceiling for passenger aircraft. This machine does not fly with you: it ships as dangerous goods, or the battery is hired at the destination.');

  pers('Bonex Ecos S', 'German cave and wreck DPV',
    [['Maximum', mmin(70)]],
    [['Runtime, cruise', 200, 'none', 'minutes'], ['Runtime, full speed', 90, 'none', 'minutes'],
     ['Operating range', km(8), 'dist'], ['Operating depth', 200, 'length'],
     ['Weight with battery', 15, 'mass'], ['Static thrust', 270, 'none', 'N']],
    'Carries a backup drive circuit: if the speed electronics fail the diver can still switch the motor on directly. In a cave that distinction is the whole machine.');

  pers('Bonex Reference RS', 'Carbon-bodied cave DPV',
    [['Maximum', mmin(85)]],
    [['Runtime, cruise', 260, 'none', 'minutes'], ['Runtime, full speed', 105, 'none', 'minutes'],
     ['Operating range', km(10), 'dist'], ['Operating depth', 200, 'length'],
     ['Weight with battery', 19, 'mass'], ['Static thrust', 330, 'none', 'N']]);

  pers('Seacraft Ghost 1500', 'Polish long-range DPV',
    [['Cruise, quoted', mmin(45)]],
    [['Runtime at 45 m/min', 525, 'none', 'minutes'], ['Runtime, gear 9', 140, 'none', 'minutes'],
     ['Tested depth', 300, 'length'], ['Weight', 23, 'mass'],
     ['Battery', 1500, 'none', 'Wh']],
    'Eight and a half hours at cruise is an exploration figure, not a dive: the limit becomes the diver, the gas and the cold long before the battery.');

  pers('Dive Xtras BlackTip Tech', 'Modular technical DPV',
    [['Cruise', mmin(45)], ['Continuous maximum', mmin(64)], ['Boost', mmin(72.5)]],
    [['Range at cruise', km(5.6), 'dist'], ['Boost, maximum', 7, 'none', 'minutes'],
     ['Depth rating', 122, 'length'], ['Weight', 12.9, 'mass'],
     ['Static thrust', 250, 'none', 'N']],
    'Runs on 18 V or 20 V power-tool battery packs. Each pack is small enough to fly in the cabin and can be replaced in any hardware shop on earth, which is a different kind of range than the one printed on the box.');

  pers('Dive Xtras BlackTip Travel', 'Breaks down for airline baggage',
    [['Cruise', mmin(45)], ['Continuous maximum', mmin(64)], ['Boost', mmin(73)]],
    [['Runtime at cruise', 123, 'none', 'minutes'], ['Boost, maximum', 7, 'none', 'minutes'],
     ['Depth rating', 100, 'length'], ['Weight', 10.9, 'mass']]);

  /* recreational */

  pers('Yamaha Seascooter RDS300', 'Recreational, sealed lead-acid',
    [['Maximum', kmh(4.8)]],
    [['Runtime, normal use', 90, 'none', 'minutes'], ['Depth rating', 30, 'length']]);

  pers('Yamaha Seascooter 350Li', 'Recreational, lithium',
    [['Maximum', kmh(6)]],
    [['Runtime', 75, 'none', 'minutes'], ['Depth rating', 40, 'length']]);

  pers('Sublue WhiteShark Mix', 'Twin-thruster recreational scooter',
    [['Maximum', 1.5]],
    [['Runtime', 30, 'none', 'minutes'], ['Depth rating', 40, 'length'], ['Weight', 2.6, 'mass']]);

  pers('Sublue Navbow', 'Three-speed with OLED display',
    [['Free', 1.0], ['Sport', 1.5], ['Turbo', 2.0]],
    [['Runtime', 60, 'none', 'minutes'], ['Depth rating', 40, 'length'],
     ['Weight with battery', 4.5, 'mass']]);

  /* freediving */

  pers('Sublue Tini', 'Compact freediving and snorkelling DPV',
    [['Eco', 1.1], ['Sport', 1.4]],
    [['Runtime', 45, 'none', 'minutes'], ['Depth rating', 20, 'length'],
     ['Weight', 3, 'mass'], ['Battery', 98, 'none', 'Wh']],
    'The 98 Wh battery is deliberately under the 100 Wh airline carry-on limit, so it travels as hand baggage without permission. Modular: units can be paired for more thrust.');

  pers('Seabob F5 S', 'Powered sled, surface and shallow',
    [['On the surface', kmh(20)], ['Submerged', kmh(18)]],
    [['Runtime', 60, 'none', 'minutes'], ['Maximum dive depth', 40, 'length'],
     ['Weight', 34, 'mass'], ['Thrust', 680, 'none', 'N'], ['Motor power', 4, 'none', 'kW']]);

  pers('Seabob F5 SR', 'Fastest of the F5 family',
    [['On the surface', kmh(22)], ['Submerged', kmh(20)]],
    [['Runtime', 70, 'none', 'minutes'], ['Weight', 76, 'mass'],
     ['Thrust', 745, 'none', 'N'], ['Motor power', 4.5, 'none', 'kW']],
    'Fast enough that the mask, not the machine, becomes the limit. At 20 km/h submerged a flooded or torn-off mask is the ordinary failure, and the hands are both occupied.');

  pers('Underwater scooter, towed diver', 'What the diver actually experiences',
    [['Recreational cruise', mmin(30)], ['Technical cruise', mmin(45)], ['Technical maximum', mmin(85)]],
    [['Air consumption vs finning', 0.7, 'none', 'rough multiplier']],
    'A scooter cuts the work of swimming, so gas lasts longer and the diver stays warmer - and then covers three times the distance, so the reserve that felt generous is now measured against a much longer way home. Never hard-tether a scooter to a freediver without a cutaway: a runaway machine on a fixed leash drags a breath-hold diver away from the surface.');

})();
