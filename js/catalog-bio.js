/*
 * Artemidos - catalogue: people & animals
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Animal top speeds are the most defensible published figures. Several famous
 * numbers (sailfish at 110 km/h, cheetah at 120 km/h) come from single old
 * measurements that later work has not reproduced; where that is the case the
 * entry says so rather than repeating the folklore.
 *
 * "Sustained" and "daily range" matter more than top speed for any planning
 * question: almost nothing can hold its sprint for more than a minute.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var kmh = function (x) { return x / 3.6; };
  var km = function (x) { return x * 1000; };

  C.cat({
    id: 'bio', n: 'People & animals', icon: 'person',
    d: 'Movement rates, endurance and daily range',
    subs: [
      { id: 'human', n: 'Human movement', icon: 'person' },
      { id: 'land', n: 'Land animals', icon: 'animal' },
      { id: 'bird', n: 'Birds', icon: 'animal' },
      { id: 'sea', n: 'Marine animals', icon: 'ship' },
      { id: 'swim', n: 'Swimming', icon: 'ship', d: 'People and land animals in water' },
      { id: 'insect', n: 'Insects', icon: 'animal' }
    ]
  });

  function b(sub, n, d, speeds, specs, note) {
    C.add({ cat: 'bio', sub: sub, n: n, d: d, speeds: speeds, specs: specs, note: note });
  }

  /* ── WHAT AN ANIMAL KNOWS ABOUT YOU ──────────────────────────────────────
     Top speed is the least useful number on an animal's page. What decides
     whether an encounter happens at all is DETECTION: how far away it hears,
     sees and smells you, and how far it can actually carry a charge before it
     has to stop. Those three ranges are why you are upwind and quiet, or why
     you were found.

     Figures here are honest orders of magnitude, not measurements. Scent
     carry in particular is a property of the WIND, not of the animal: a bear
     credited with three kilometres is being credited with a steady breeze.
     Still air, broken ground or rain and it may be a tenth of that.

     `where` is deliberately coarse. It is there to answer "could this be here"
     rather than to map a range. */
  function animal(sub, n, d, opt) {
    C.add({
      cat: 'bio', sub: sub, n: n, d: d,
      speeds: opt.speeds || [], specs: opt.specs || null,
      where: opt.where || null,
      senses: opt.senses || null,
      danger: opt.danger || null,
      note: opt.note || null
    });
  }

  /* ── human movement ───────────────────────────────────────────────── */

  b('human', 'Walking', 'Unloaded, level ground',
    [['Slow / crowd', kmh(3)], ['Casual', kmh(4.5)], ['Purposeful', kmh(5.5)], ['Brisk', kmh(6.5)]],
    [['Comfortable daily distance', km(25), 'dist'], ['Trained daily distance', km(40), 'dist'],
     ['Step length, average', 0.75, 'length']],
    'Five km/h is the planning figure for a fit adult on a good surface. A crowd moves at three, and a group moves at the pace of its slowest member.');

  b('human', 'Loaded march', 'Carrying equipment',
    [['With 20 kg', kmh(5)], ['With 30 kg', kmh(4.5)], ['With 45 kg', kmh(3.5)], ['Forced march pace', kmh(6.4)]],
    [['Sustainable day, 20 kg', km(32), 'dist'], ['Sustainable day, 45 kg', km(20), 'dist']],
    'Every 10 kg over about 20 costs roughly half a kilometre per hour and a great deal more recovery time.');

  b('human', 'Walking on gradients', 'Naismith rule and variants',
    [['Level, fit walker', kmh(5)], ['Steep ascent, effective', kmh(2)], ['Steep descent, effective', kmh(4)]],
    [['Add per 600 m of ascent', 1, 'none', 'hour (Naismith)'], ['Typical ascent rate', 500, 'alt', 'per hour']],
    'Naismith: 5 km/h on the flat, plus one hour for every 600 m climbed. Add more for a group, poor ground, night or heavy loads.');

  b('human', 'Difficult ground', 'Terrain penalties',
    [['Dense forest', kmh(2)], ['Deep snow, unbroken', kmh(1.5)], ['Soft sand', kmh(3)], ['Boulder field', kmh(1.5)], ['Marsh', kmh(1.5)]],
    null,
    'Terrain, not fitness, is what wrecks a timing plan. Halving the map speed for bad ground is a safer assumption than optimism.');

  b('human', 'Running', 'Trained runner',
    [['Easy jog', kmh(9)], ['Steady', kmh(12)], ['10 km race pace', kmh(15)], ['Marathon world record pace', kmh(20.9)]],
    [['Marathon distance', km(42.195), 'dist'], ['Marathon world record', 2.01, 'none', 'hours (men)']],
    null);

  b('human', 'Sprinting', 'Maximum effort',
    [['Recreational sprint', kmh(20)], ['Trained sprint', kmh(30)], ['100 m world record average', kmh(37.6)], ['Peak human speed recorded', kmh(44.7)]],
    [['Distance in 3 seconds, trained', 20, 'dist'], ['Sustainable sprint duration', 12, 'none', 'seconds']],
    'The practical figure: a person can cover about 20 metres in the three seconds it takes to react and close. That distance is the basis of most reactionary-gap doctrine.');

  b('human', 'Ultra-distance', 'Multi-day endurance',
    [['100 miles, elite', kmh(14.5)], ['100 miles, typical finisher', kmh(7)], ['Multi-day expedition', kmh(4)]],
    [['100 mile distance', km(160.9), 'dist'], ['24-hour record', km(319), 'dist']]);

  b('human', 'Swimming', 'In water',
    [['Recreational', kmh(2.5)], ['Trained distance', kmh(4)], ['100 m freestyle world record', kmh(8.6)]],
    [['Open-water day, trained', km(15), 'dist'], ['English Channel', km(33), 'dist']],
    'Add current and the number changes completely: a two-knot tide is faster than most swimmers.');

  b('human', 'Crawling & low movement', 'Tactical movement',
    [['Leopard crawl', kmh(0.5)], ['Monkey run', kmh(2)], ['Crouched walk', kmh(3)]],
    null,
    'Low movement is slow enough that timings built on walking speed will be wrong by a factor of five or more.');

  b('human', 'Vertical movement', 'Stairs, ladders and climbing',
    [['Stairs up, vertical rate', kmh(0.5)], ['Stairs down, vertical rate', kmh(0.9)], ['Ladder, vertical rate', kmh(0.4)]],
    [['Storeys per minute, up', 1.7, 'none'], ['Building evacuation, per storey', 30, 'none', 'seconds, crowded']],
    'Roughly one storey every 35 seconds climbing, faster descending. For a high-rise plan, that is the number that decides everything.');

  b('human', 'Reaction time', 'Human response',
    [['Simple visual reaction', 0], ['Choice reaction', 0], ['Driver reaction', 0]],
    [['Simple visual reaction', 0.25, 'none', 'seconds'], ['Choice reaction', 0.5, 'none', 'seconds'],
     ['Driver perception-reaction (design value)', 1.5, 'none', 'seconds'],
     ['Startled response, unexpected', 2.5, 'none', 'seconds']],
    'The 1.5 second figure used in stopping-distance work is a design value covering most drivers. An unprepared, distracted or startled person is markedly slower.');

  /* ── land animals ─────────────────────────────────────────────────── */

  b('land', 'Cheetah', 'Fastest land animal',
    [['Sprint, measured maximum', kmh(104)], ['Typical hunting sprint', kmh(80)]],
    [['Sprint duration', 30, 'none', 'seconds'], ['Sprint distance', 500, 'dist'], ['Mass', 50, 'mass']],
    'The often-quoted 120 km/h is not supported by field measurement. Collared wild cheetahs peaked near 93 km/h; the captive record is 104 km/h over 100 m.');

  b('land', 'Pronghorn antelope', 'Fastest sustained runner',
    [['Sprint', kmh(88)], ['Sustained', kmh(56)]],
    [['Distance at sustained pace', km(6), 'dist'], ['Mass', 50, 'mass']],
    'Can hold 56 km/h for several kilometres, which no other land mammal approaches. It outruns every predator that currently exists in its range.');

  b('land', 'Horse', 'Domestic, various breeds',
    [['Walk', kmh(6.4)], ['Trot', kmh(13)], ['Canter', kmh(19)], ['Gallop, thoroughbred', kmh(70)], ['Quarter horse sprint record', kmh(88)]],
    [['Day range at a walk', km(50), 'dist'], ['Endurance ride, 100 miles', 12, 'none', 'hours'], ['Mass', 500, 'mass']]);

  b('land', 'Camel', 'Dromedary',
    [['Walk', kmh(5)], ['Trot', kmh(16)], ['Gallop', kmh(65)]],
    [['Day range, loaded', km(40), 'dist'], ['Day range, unloaded', km(160), 'dist'],
     ['Water endurance', 10, 'none', 'days'], ['Load carried', 200, 'mass']]);

  b('land', 'Grey wolf', 'Pack predator',
    [['Trot, travelling', kmh(8)], ['Sprint', kmh(60)]],
    [['Nightly travel distance', km(50), 'dist'], ['Territory range', km(200), 'dist'], ['Mass', 45, 'mass']],
    'The trot is what matters: a wolf pack covers 50 km in a night at a pace it can hold almost indefinitely.');

  b('land', 'Domestic dog', 'Working and companion breeds',
    [['Walk', kmh(5)], ['Trot', kmh(15)], ['Sprint, typical', kmh(32)], ['Sprint, greyhound', kmh(72)]],
    [['Working patrol day', km(25), 'dist'], ['Sled dog day range', km(150), 'dist']]);

  b('land', 'Lion', 'Ambush predator',
    [['Sprint', kmh(80)], ['Patrol walk', kmh(4)]],
    [['Sprint distance', 200, 'dist'], ['Mass', 190, 'mass']]);

  b('land', 'Brown bear', 'Large omnivore',
    [['Charge', kmh(56)], ['Walk', kmh(5)]],
    [['Mass', 320, 'mass']],
    'Faster than a human over any distance, uphill or downhill. Running is not a defensive option.');

  b('land', 'African elephant', 'Largest land animal',
    [['Fast walk / charge', kmh(25)], ['Normal walk', kmh(6)]],
    [['Daily range', km(25), 'dist'], ['Mass', 6000, 'mass']],
    'Cannot truly run: all four feet are never off the ground at once, but the fast walk still outpaces a sprinting human over distance.');

  b('land', 'Rhinoceros', 'Large herbivore',
    [['Charge', kmh(50)], ['Walk', kmh(5)]],
    [['Mass', 2300, 'mass']]);

  b('land', 'Hippopotamus', 'Large semi-aquatic herbivore',
    [['Land charge', kmh(30)], ['In water, walking on bed', kmh(8)]],
    [['Mass', 1500, 'mass']],
    'Responsible for more human deaths per year in Africa than any other large mammal.');

  b('land', 'Wild boar', 'Ungulate',
    [['Charge', kmh(40)]],
    [['Mass', 90, 'mass']]);

  b('land', 'Red deer / elk', 'Large deer',
    [['Sprint', kmh(72)], ['Travelling', kmh(15)]],
    [['Daily range', km(10), 'dist'], ['Mass', 240, 'mass']]);

  b('land', 'Kangaroo', 'Marsupial',
    [['Cruising hop', kmh(25)], ['Sprint', kmh(70)]],
    [['Single hop distance', 9, 'dist'], ['Mass', 85, 'mass']],
    'Hopping gets more efficient as speed rises, up to a point: energy is stored and returned in the tendons.');

  b('land', 'Ostrich', 'Fastest bird on land',
    [['Sprint', kmh(70)], ['Sustained run', kmh(50)]],
    [['Sustained duration', 30, 'none', 'minutes'], ['Stride length', 5, 'length'], ['Mass', 130, 'mass']]);

  b('land', 'Domestic cat', 'Small predator',
    [['Sprint', kmh(48)], ['Walk', kmh(1.5)]],
    [['Territory range', 500, 'dist']]);

  b('land', 'Brown hare', 'Lagomorph',
    [['Sprint', kmh(72)]],
    [['Mass', 4, 'mass']]);

  b('land', 'Black mamba', 'Fastest snake',
    [['Maximum', kmh(20)], ['Typical', kmh(11)]],
    [['Length', 2.5, 'length']],
    'Fast for a snake, but slower than a walking human. The danger is proximity and reach, not pursuit.');

  b('land', 'Saltwater crocodile', 'Large reptile',
    [['Land, short burst', kmh(17)], ['In water', kmh(32)], ['In water, cruising', kmh(3)]],
    [['Length', 5, 'length'], ['Mass', 1000, 'mass']],
    'The land burst covers only a few metres. In water it is faster than any swimmer.');

  b('land', 'Giant tortoise', 'Slowest large reptile',
    [['Walking', kmh(0.3)]],
    [['Daily range', 300, 'dist']]);

  b('land', 'Three-toed sloth', 'Slowest mammal',
    [['On the ground', kmh(0.15)], ['In trees', kmh(0.27)]],
    null);

  /* ── birds ────────────────────────────────────────────────────────── */

  b('bird', 'Peregrine falcon', 'Fastest animal on Earth',
    [['Stoop (dive)', kmh(389)], ['Level flight', kmh(97)]],
    [['Dive height', 1500, 'alt'], ['Wingspan', 1.1, 'length'], ['Mass', 0.9, 'mass']],
    'The 389 km/h figure is from an instrumented dive. In level flight it is unremarkable: the speed is gravity plus a very clean airframe.');

  b('bird', 'Golden eagle', 'Large raptor',
    [['Stoop', kmh(320)], ['Level flight', kmh(45)], ['Soaring', kmh(28)]],
    [['Wingspan', 2.2, 'length'], ['Hunting range', km(20), 'dist']]);

  b('bird', 'Common swift', 'Fastest bird in level flight',
    [['Level flight', kmh(111)], ['Cruising', kmh(40)]],
    [['Time airborne without landing', 10, 'none', 'months'], ['Annual distance', km(200000), 'dist']],
    'Feeds, sleeps and mates on the wing. Young birds may not land for their first two or three years.');

  b('bird', 'Frigatebird', 'Oceanic soarer',
    [['Level flight', kmh(153)], ['Soaring', kmh(35)]],
    [['Continuous flight', 2, 'none', 'months'], ['Soaring altitude', 4000, 'alt']]);

  b('bird', 'Homing pigeon', 'Trained racer',
    [['Race pace', kmh(80)], ['Sprint', kmh(150)]],
    [['Race distance', km(800), 'dist'], ['Daily distance', km(700), 'dist']]);

  b('bird', 'Wandering albatross', 'Longest wingspan',
    [['Dynamic soaring', kmh(80)], ['Cruise', kmh(50)]],
    [['Wingspan', 3.5, 'length'], ['Daily distance', km(950), 'dist'], ['Foraging trip', km(15000), 'dist']],
    'Barely flaps: it extracts energy from the wind gradient above the waves, which is why it can circle the Southern Ocean.');

  b('bird', 'Bar-headed goose', 'Highest migratory flight',
    [['Migration cruise', kmh(65)]],
    [['Flight altitude', 7290, 'alt'], ['Crossing time, Himalaya', 8, 'none', 'hours']]);

  b('bird', 'Bar-tailed godwit', 'Longest non-stop flight',
    [['Migration cruise', kmh(55)]],
    [['Longest recorded non-stop flight', km(13560), 'dist'], ['Duration', 11, 'none', 'days']],
    'Alaska to Tasmania without landing, eating or drinking. It halves its own organ mass to make the fuel budget work.');

  b('bird', 'Arctic tern', 'Longest annual migration',
    [['Cruise', kmh(40)]],
    [['Annual migration distance', km(70000), 'dist']]);

  b('bird', 'Mallard duck', 'Common waterfowl',
    [['Level flight', kmh(90)], ['Migration cruise', kmh(65)]],
    [['Migration altitude', 2000, 'alt']]);

  b('bird', 'Hummingbird', 'Smallest birds',
    [['Level flight', kmh(54)], ['Courtship dive', kmh(97)]],
    [['Wingbeat rate', 80, 'none', 'per second'], ['Mass', 0.004, 'mass']]);

  b('bird', 'Barn owl', 'Nocturnal hunter',
    [['Hunting flight', kmh(30)], ['Maximum', kmh(80)]],
    [['Hunting range', km(3), 'dist']],
    'Nearly silent in flight: leading-edge serrations break up the airflow that would otherwise make noise.');

  /* ── marine animals ───────────────────────────────────────────────── */

  b('sea', 'Sailfish', 'Often called the fastest fish',
    [['Burst, best-supported estimate', kmh(80)], ['Cruise', kmh(8)]],
    [['Length', 3, 'length'], ['Mass', 90, 'mass']],
    'The famous 110 km/h comes from a single 1920s line-run measurement. Modern work on billfish physiology puts the ceiling far lower, around 35 to 80 km/h.');

  b('sea', 'Black marlin', 'Large billfish',
    [['Burst', kmh(80)], ['Cruise', kmh(9)]],
    [['Length', 4.6, 'length'], ['Mass', 700, 'mass']]);

  b('sea', 'Shortfin mako shark', 'Fastest shark',
    [['Burst', kmh(74)], ['Cruise', kmh(10)]],
    [['Length', 3.2, 'length'], ['Daily range', km(50), 'dist']]);

  b('sea', 'Great white shark', 'Large predator',
    [['Burst', kmh(40)], ['Cruise', kmh(3)]],
    [['Length', 4.6, 'length'], ['Annual migration', km(20000), 'dist']]);

  b('sea', 'Bluefin tuna', 'Fast pelagic fish',
    [['Burst', kmh(70)], ['Cruise', kmh(25)]],
    [['Length', 2.5, 'length'], ['Trans-ocean migration', km(9000), 'dist']]);

  b('sea', 'Orca (killer whale)', 'Apex marine predator',
    [['Burst', kmh(55)], ['Cruise', kmh(12)]],
    [['Daily range', km(160), 'dist'], ['Length', 8, 'length'], ['Mass', 5500, 'mass']]);

  b('sea', 'Common dolphin', 'Small cetacean',
    [['Burst', kmh(60)], ['Cruise', kmh(11)]],
    [['Daily range', km(100), 'dist'], ['Dive depth', 280, 'alt']]);

  b('sea', 'Blue whale', 'Largest animal',
    [['Burst', kmh(50)], ['Cruise', kmh(20)], ['Feeding', kmh(5)]],
    [['Length', 30, 'length'], ['Mass', 150000, 'mass'], ['Annual migration', km(16000), 'dist']]);

  b('sea', 'Gentoo penguin', 'Fastest swimming bird',
    [['Swimming', kmh(36)], ['Porpoising', kmh(20)]],
    [['Dive depth', 200, 'alt'], ['Foraging trip', km(26), 'dist']]);

  b('sea', 'Leatherback sea turtle', 'Largest turtle',
    [['Burst', kmh(35)], ['Cruise', kmh(2)]],
    [['Dive depth', 1280, 'alt'], ['Migration distance', km(16000), 'dist']]);

  b('sea', 'Squid (jet propulsion)', 'Cephalopod',
    [['Jetting', kmh(40)], ['Fin swimming', kmh(4)]],
    [['Flying squid airborne distance', 30, 'dist']]);

  b('sea', 'Flying fish', 'Gliding fish',
    [['In water, launch', kmh(60)], ['Glide', kmh(70)]],
    [['Single glide distance', 200, 'dist'], ['Longest recorded glide', 400, 'dist'], ['Glide duration', 45, 'none', 'seconds']]);

  /* ── swimming ─────────────────────────────────────────────────────────
     People and land animals in water. Kept separate from marine animals
     because the question is different: not "how fast is this creature" but
     "can it cross this, and how long will that take". Current is the thing
     that decides it. A two-knot tide is 1.03 m/s, which is faster than most
     people can swim, so crossing is a vector problem, not a speed one.     */

  b('swim', 'Human swimming', 'By ability, still water',
    [['Non-swimmer, survival float', kmh(0.5)], ['Recreational', kmh(2.5)],
     ['Regular swimmer', kmh(3.2)], ['Trained distance', kmh(4)],
     ['Competitive distance', kmh(5.5)], ['100 m freestyle world record', kmh(8.6)]],
    [['Comfortable continuous distance, trained', km(3), 'dist'],
     ['Open-water day, trained', km(15), 'dist'],
     ['English Channel crossing', km(33), 'dist'],
     ['Typical Channel time', 13, 'none', 'hours']],
    'Add current before anything else. Two knots of tide is 1.03 m/s: faster than most people swim, so you ferry-glide across it rather than fight it.');

  b('swim', 'Human swimming, encumbered', 'Clothed, or carrying equipment',
    [['Fully clothed, breaststroke', kmh(1.2)], ['Clothed with boots', kmh(0.8)],
     ['With a 10 kg pack', kmh(1)], ['Combat side stroke, trained', kmh(2.4)]],
    [['Realistic encumbered distance', 400, 'dist'],
     ['Time to exhaustion, cold water clothed', 20, 'none', 'minutes']],
    'Clothing roughly halves speed and multiplies effort. Boots and a pack turn a swim into a drowning risk: ditch them or float them.');

  b('swim', 'Cold water survival', 'Immersion, not swimming',
    [['Swimming ability at 5 °C', kmh(0.6)], ['Swimming ability at 15 °C', kmh(1.8)]],
    [['Cold shock phase', 3, 'none', 'minutes of gasping and hyperventilation'],
     ['Useful movement time at 5 °C', 10, 'none', 'minutes before hands fail'],
     ['Expected survival at 5 °C', 1, 'none', 'hour'],
     ['Expected survival at 15 °C', 6, 'none', 'hours'],
     ['Distance most people can swim at 10 °C', 100, 'dist']],
    'The first three minutes kill more people than the cold does. Cold shock drives involuntary gasping; if the head is under, that is the end of it. Hold on to something and get the breathing under control before deciding anything.');

  b('swim', 'Dog', 'Most breeds swim',
    [['Paddling', kmh(2.5)], ['Strong swimmer breed', kmh(4)]],
    [['Comfortable distance', 400, 'dist'], ['Newfoundland working distance', km(3), 'dist']],
    'Newfoundlands and retrievers are bred for it and have webbed feet. Deep-chested and short-muzzled breeds tire fast or cannot keep the muzzle clear at all.');

  b('swim', 'Horse', 'Strong natural swimmer',
    [['Swimming', kmh(4)]],
    [['Comfortable distance', 800, 'dist'], ['Maximum crossing', km(3), 'dist'], ['Mass', 500, 'mass']],
    'Only the head and neck stay above water, so a rider must dismount and swim alongside holding the mane or tail.');

  b('swim', 'Elephant', 'Best large-mammal swimmer on land',
    [['Swimming', kmh(2.7)]],
    [['Recorded continuous distance', km(48), 'dist'], ['Sustained duration', 6, 'none', 'hours']],
    'Uses the trunk as a snorkel and is genuinely buoyant. It can cross channels that stop every other land mammal.');

  b('swim', 'Polar bear', 'Semi-aquatic',
    [['Swimming', kmh(10)], ['Cruising', kmh(6)]],
    [['Longest recorded continuous swim', km(687), 'dist'], ['Duration of that swim', 9, 'none', 'days'],
     ['Mass', 450, 'mass']],
    'The longest continuous swim recorded for any land mammal. Hollow hairs and a fat layer make it buoyant and insulated.');

  b('swim', 'Tiger', 'Unusual among big cats',
    [['Swimming', kmh(6)]],
    [['Comfortable distance', km(6), 'dist'], ['Maximum recorded', km(29), 'dist']],
    'Tigers swim readily and will cross rivers to hunt, which is why river lines are not a boundary in tiger country. Most other big cats avoid water.');

  b('swim', 'Deer', 'Capable swimmer',
    [['Swimming', kmh(5)]],
    [['Typical crossing', km(2), 'dist'], ['Maximum recorded', km(8), 'dist']]);

  b('swim', 'Wild boar', 'Strong swimmer',
    [['Swimming', kmh(5)]],
    [['Typical crossing', km(1), 'dist'], ['Maximum recorded', km(7), 'dist']]);

  b('swim', 'Cattle', 'Will swim if driven',
    [['Swimming', kmh(3)]],
    [['Comfortable distance', 500, 'dist']]);

  b('swim', 'Domestic cat', 'Can swim, rarely chooses to',
    [['Swimming', kmh(4.8)]],
    [['Comfortable distance', 100, 'dist']]);

  b('swim', 'Rat', 'Strong swimmer for its size',
    [['Swimming', kmh(1.6)]],
    [['Continuous swim endurance', 3, 'none', 'days recorded'],
     ['Distance recorded', km(1), 'dist']],
    'Rats tread water for days and swim up sewer pipes, which is exactly why drain traps exist.');

  b('swim', 'Snake', 'Most species swim well',
    [['Swimming', kmh(3)]],
    [['Comfortable distance', 400, 'dist']]);

  b('swim', 'Crocodile', 'Ambush predator in its element',
    [['Cruising', kmh(3)], ['Burst', kmh(32)]],
    [['Open-sea crossings recorded', km(590), 'dist'], ['Length', 5, 'length']],
    'Rides tidal currents rather than swimming for distance, which is how saltwater crocodiles reach islands hundreds of kilometres offshore.');

  /* ── insects ──────────────────────────────────────────────────────── */

  b('insect', 'Dragonfly', 'Fastest flying insect',
    [['Level flight', kmh(58)], ['Cruising', kmh(16)]],
    [['Hunting success rate', 95, 'none', 'per cent'], ['Migration distance', km(6000), 'dist']]);

  b('insect', 'Horsefly', 'Fast biting fly',
    [['Level flight', kmh(54)]], null,
    'The 145 km/h figure attributed to the deer botfly was a 1920s estimate later shown to be physically impossible.');

  b('insect', 'Honeybee', 'Social pollinator',
    [['Flight, laden', kmh(21)], ['Flight, unladen', kmh(28)]],
    [['Typical forage radius', km(3), 'dist'], ['Maximum forage radius', km(10), 'dist'],
     ['Wingbeat rate', 230, 'none', 'per second']]);

  b('insect', 'Hornet', 'Large social wasp',
    [['Flight', kmh(25)]],
    [['Forage radius', km(2), 'dist']]);

  b('insect', 'Housefly', 'Common fly',
    [['Flight', kmh(7)]],
    [['Daily range', km(3), 'dist'], ['Wingbeat rate', 200, 'none', 'per second']]);

  b('insect', 'Mosquito', 'Disease vector',
    [['Flight', kmh(2.4)]],
    [['Typical flight range', 300, 'dist'], ['Maximum range, some species', km(50), 'dist']],
    'Range matters for vector control: most species stay within a few hundred metres of where they hatched.');

  b('insect', 'Cockroach', 'Fast runner for its size',
    [['Running', kmh(5.4)]],
    [['Body lengths per second', 50, 'none']]);

  b('insect', 'Desert locust', 'Swarming insect',
    [['Flight', kmh(16)]],
    [['Daily distance', km(130), 'dist'], ['Swarm area', 1200000000, 'area']]);



  /* ══ DETECTION, DISTRIBUTION AND WHAT TO DO ════════════════════════════
     Attached to entries defined above rather than rewritten into each one, so
     the speed data and this stay separately checkable. */
  var FIELD = {
    'Cheetah': {
      where: 'Sub-Saharan Africa, mainly Namibia, Botswana, Kenya and Tanzania. A tiny relict population in Iran.',
      senses: [
        ['Sight', 'Exceptional by daylight. Picks out movement at 5 km across open ground and hunts almost entirely by eye.'],
        ['Hearing', 'Good, roughly human range.'],
        ['Smell', 'Poor by big-cat standards; not how it finds prey.']
      ],
      danger: 'Low. The least dangerous of the big cats to people, and it will not press an encounter. Do not corner one and do not approach a kill.'
    },
    'Lion': {
      where: 'Sub-Saharan savannah and scrub, with a small isolated population in the Gir Forest, India.',
      senses: [
        ['Hearing', 'A roar carries about 8 km, and it hears one at a similar distance. It hears a person moving at several hundred metres.'],
        ['Sight', 'Around six times better than a human in low light. Hunts at night by preference.'],
        ['Smell', 'Good, used for territory and carrion rather than stalking.']
      ],
      danger: 'HIGH. Do not run: it triggers the chase and you cannot outrun 80 km/h. Stand, face it, make yourself large, back away slowly. Most attacks on people are at night and near settlements.'
    },
    'Grey wolf': {
      where: 'Across the northern hemisphere: Canada, Alaska, the Rockies, Scandinavia, eastern and central Europe, Russia, Central Asia and northern India.',
      senses: [
        ['Smell', 'Prey scent at 2.5 km in a good wind, and it is the primary sense.'],
        ['Hearing', 'A howl carries 10 km in forest and 16 km over open tundra, and it hears at a similar range.'],
        ['Sight', 'Motion-sensitive rather than sharp. Excellent at night.']
      ],
      danger: 'Low to people in healthy populations, and the folklore badly overstates it. Real risk comes from rabid animals, from habituated wolves near rubbish, and from dogs. Do not run, do not turn your back, make noise and look large.'
    },
    'Brown bear': {
      where: 'Alaska, western Canada, the Rockies, Scandinavia, the Carpathians, Russia, and mountain pockets across Central Asia and Japan (Hokkaido).',
      senses: [
        ['Smell', 'The best of any land mammal, and roughly seven times a bloodhound. Carrion downwind at 20 km, a person at 3 km in a steady breeze.'],
        ['Hearing', 'Better than human, into ultrasound. Hears a person talking at several hundred metres.'],
        ['Sight', 'About human, in colour. Poor at picking out a still shape.']
      ],
      danger: 'HIGH. Never run: it is 50 km/h uphill and downhill, and running makes you prey. Speak calmly, back away, do not make eye contact. Bear spray beats a firearm in the statistics. Never get between a sow and cubs, and never approach a carcass.'
    },
    'African elephant': {
      where: 'Sub-Saharan Africa: savannah across the east and south, forest elephants in the Congo basin and West Africa.',
      senses: [
        ['Hearing', 'Infrasound calls carry 10 km through air, further through the ground, which it feels through its feet.'],
        ['Smell', 'Water at 12 km and better than a dog. It smells you long before it sees you.'],
        ['Sight', 'Poor, roughly 50 m for detail, which is why a still person at distance may be ignored.']
      ],
      danger: 'VERY HIGH and routinely underestimated. Kills more people annually than lions. A mock charge stops with ears out and trunk raised; a real one comes with ears flat and trunk tucked. Put solid cover or a vehicle between you. Bulls in musth are unpredictable and should be given a kilometre.'
    },
    'Hippopotamus': {
      where: 'Rivers, lakes and swamps of sub-Saharan Africa.',
      senses: [
        ['Hearing', 'Good above and below water; eyes, ears and nostrils sit on one plane so it can hear while almost submerged.'],
        ['Sight', 'Moderate. It watches the bank constantly.'],
        ['Smell', 'Good.']
      ],
      danger: 'THE MOST LETHAL LARGE ANIMAL IN AFRICA. Kills an estimated 500 people a year. Runs 30 km/h on land and will absolutely outrun you over a short distance. Never come between one and deep water, never camp on a hippo path at night, and treat any river bank at dusk as occupied.'
    },
    'Saltwater crocodile': {
      where: 'Coasts, estuaries and rivers from eastern India through Southeast Asia to northern Australia and the Solomon Islands.',
      senses: [
        ['Hearing', 'Acute, and it hears splashing at a long distance.'],
        ['Sight', 'Excellent above water and good at night; a tapetum makes the eyes shine.'],
        ['Smell', 'Blood and carrion in water at a very long range.'],
        ['Pressure', 'Dome pressure receptors across the jaws detect a disturbance in the water several metres away in total darkness.']
      ],
      danger: 'EXTREME. It ambushes from water and takes prey at the edge. Stay 5 m back from any bank in crocodile country, never use the same spot twice for water, never clean fish at the water, and assume every murky river in range is occupied.'
    },
    'Wild boar': {
      where: 'Europe, North Africa, across Asia, and introduced and now widespread in the Americas and Australia.',
      senses: [
        ['Smell', 'Outstanding. Truffles at 30 cm underground, a person at 1 km downwind.'],
        ['Hearing', 'Very good.'],
        ['Sight', 'Poor, and it will approach a still person closely without registering them.']
      ],
      danger: 'Moderate but frequently injurious. A sow with piglets and a cornered boar both charge. Tusks cut at knee and thigh height. Climb, or put a tree between you: they turn badly.'
    },
    'Rhinoceros': {
      where: 'Southern and eastern Africa (white and black), with Indian rhino in Assam and Nepal.',
      senses: [
        ['Hearing', 'Excellent, ears turn independently.'],
        ['Smell', 'Excellent, and the sense it navigates by.'],
        ['Sight', 'Very poor. It cannot resolve a person at 30 m, which is why it charges at noise and scent.']
      ],
      danger: 'HIGH, black rhino especially. Charges at 55 km/h with little warning. Get behind a tree or a termite mound; the poor eyesight that provoked the charge also makes it easy to lose.'
    },
    'Black mamba': {
      where: 'Savannah, rocky hills and open woodland across eastern and southern Africa.',
      senses: [
        ['Sight', 'Good for a snake and it tracks movement well.'],
        ['Smell', 'Tongue and vomeronasal organ; follows scent trails.'],
        ['Vibration', 'Feels footfall through the ground well before it can see you.']
      ],
      danger: 'EXTREME if bitten and untreated. Fast (16-20 km/h), and it will flee first: nearly every bite follows cornering or handling. Bites are neurotoxic and can kill in hours. Do not attempt to catch or kill it. Immobilise the limb, pressure bandage, and get antivenom.'
    },
    'Ostrich': {
      where: 'Open savannah and semi-desert across Africa; farmed worldwide.',
      senses: [
        ['Sight', 'The largest eye of any land vertebrate. Sees a person at 3.5 km across flat ground.'],
        ['Hearing', 'Good.'],
        ['Smell', 'Poor.']
      ],
      danger: 'Underrated. A kick carries enormous force forward and downward and the claw disembowels. Males in breeding season are aggressive. Do not corner one; lie flat if charged, or put something solid between you.'
    },
    'Kangaroo': {
      where: 'Australia, in every habitat from arid interior to coastal forest.',
      senses: [
        ['Hearing', 'Ears swivel independently; very good.'],
        ['Sight', 'Good, tuned to movement.'],
        ['Smell', 'Good.']
      ],
      danger: 'Low but real for large males, which fight by balancing on the tail and kicking with both feet. Do not approach, and do not feed. The commoner danger is a collision at dusk.'
    },
    'Red deer / elk': {
      where: 'Europe, the Caucasus, parts of Asia and North Africa; wapiti across North America and introduced to New Zealand.',
      senses: [
        ['Smell', 'Detects a person at 800 m downwind and it is the sense that defeats a stalk.'],
        ['Hearing', 'Excellent, large mobile ears.'],
        ['Sight', 'Wide field, motion-sensitive, weak on detail. Stillness works; movement does not.']
      ],
      danger: 'Low outside the rut. During the rut a stag will charge, and antlers at that mass are lethal. Keep 50 m and never come between a stag and hinds.'
    },
    'Brown hare': {
      where: 'Open farmland and grassland across Europe and western Asia; introduced widely.',
      senses: [
        ['Hearing', 'Very long ears, near-360-degree coverage.'],
        ['Sight', 'Nearly all round, with a small blind spot at the nose.'],
        ['Smell', 'Good.']
      ],
      danger: 'None.'
    },
    'Peregrine falcon': {
      where: 'Every continent except Antarctica, and one of the most widely distributed birds in the world. Increasingly urban.',
      senses: [
        ['Sight', 'Roughly eight times human acuity. Picks out a pigeon at 3 km and can see ultraviolet.'],
        ['Hearing', 'Good, not primary.']
      ],
      danger: 'None to people, though it will dive at anyone near a nest.'
    },
    'Golden eagle': {
      where: 'Mountains and open country across the northern hemisphere: North America, Europe, North Africa and Asia.',
      senses: [
        ['Sight', 'A hare at 2 km, and the widely repeated figure of four times human acuity is about right.'],
        ['Hearing', 'Moderate.']
      ],
      danger: 'None realistically to an adult. Defends a nest vigorously.'
    },
    'Barn owl': {
      where: 'One of the most widespread land birds in the world: every continent except Antarctica.',
      senses: [
        ['Hearing', 'The most accurate directional hearing measured in any animal. Takes prey in complete darkness by sound alone; asymmetric ear openings give elevation as well as bearing.'],
        ['Sight', 'Excellent in very low light, poor in full dark.']
      ],
      danger: 'None.'
    }
  };

  Object.keys(FIELD).forEach(function (name) {
    var rec = C.all().filter(function (r) { return r.cat === 'bio' && r.n === name; })[0];
    if (!rec) return;
    var f = FIELD[name];
    if (f.where) rec.where = f.where;
    if (f.senses) rec.senses = f.senses;
    if (f.danger) rec.danger = f.danger;
  });

  /* ══ THE ONES THAT HURT PEOPLE ═════════════════════════════════════════
     Chosen by where they are and how often they kill or maim, not by how
     impressive they are. Every continent that has a large predator has one
     here. */

  animal('land', 'Tiger', 'The largest cat, and an ambush hunter', {
    speeds: [['Sprint', kmh(65)], ['Patrolling walk', kmh(5)]],
    specs: [['Sprint distance before it breaks off', 200, 'dist'],
            ['Nightly patrol', km(20), 'dist'],
            ['Leap, horizontal', 10, 'dist'],
            ['Mass, Siberian male', 250, 'mass']],
    where: 'Fragmented across Asia: India holds about three quarters of the wild population, with tigers also in Nepal, Bhutan, Bangladesh, Myanmar, Thailand, Malaysia, Indonesia (Sumatra) and the Russian Far East.',
    senses: [
      ['Hearing', 'The sharpest sense. A roar carries 3 km and it hears a person moving in undergrowth at several hundred metres.'],
      ['Sight', 'Around six times human in low light. Hunts at dawn, dusk and night.'],
      ['Smell', 'Used mainly for territory and other tigers rather than for hunting.']
    ],
    danger: 'EXTREME. Attacks from behind and aims for the neck, so a face worn on the back of the head genuinely reduced attacks in the Sundarbans. Move in groups, never alone at dawn or dusk, never crouch or squat in tiger country, and if you meet one do not run: face it and back away.',
    note: 'A tiger will not chase far. The sprint is short and it gives up quickly if the ambush fails, which is why the first two seconds decide everything.'
  });

  animal('land', 'Leopard', 'The most adaptable big cat', {
    speeds: [['Sprint', kmh(58)], ['Carrying a kill up a tree', kmh(3)]],
    specs: [['Sprint distance', 100, 'dist'],
            ['Nightly range', km(15), 'dist'],
            ['Vertical leap', 3, 'dist'],
            ['Can carry, into a tree', 60, 'mass']],
    where: 'The widest range of any big cat: sub-Saharan Africa, North Africa, the Arabian peninsula, Iran, Central Asia, India, China, Southeast Asia and the Russian Far East. Lives close to towns unnoticed.',
    senses: [
      ['Hearing', 'Five times human sensitivity, into ultrasound.'],
      ['Sight', 'Seven times human in low light.'],
      ['Smell', 'Good, used for territory.']
    ],
    danger: 'HIGH, and the most likely of the big cats to be near you without your knowing. Nocturnal, silent, and comfortable in farmland and suburbs. Do not sleep in the open in leopard country, keep children close at dusk, and never follow one into cover.'
  });

  animal('land', 'Jaguar', 'The strongest bite of any cat', {
    speeds: [['Sprint', kmh(80)], ['Swimming', kmh(10)]],
    specs: [['Sprint distance', 100, 'dist'],
            ['Daily range', km(10), 'dist'],
            ['Mass, male', 100, 'mass']],
    where: 'Central and South America: the Amazon basin, the Pantanal, Central America, and a remnant presence in northern Mexico and rarely the southwestern United States.',
    senses: [
      ['Sight', 'Excellent at night, six times human.'],
      ['Hearing', 'Very good.'],
      ['Smell', 'Good, and it hunts in water as readily as on land.']
    ],
    danger: 'HIGH but attacks on people are rare. Kills by biting THROUGH the skull rather than by suffocation, which no other cat does routinely. Strong swimmer: water is not an escape. Do not corner one and never approach a kill.'
  });

  animal('land', 'Cougar / mountain lion', 'One cat, forty names', {
    speeds: [['Sprint', kmh(80)], ['Sustained travel', kmh(10)]],
    specs: [['Sprint distance', 100, 'dist'],
            ['Nightly range', km(25), 'dist'],
            ['Vertical leap', 5.5, 'dist'],
            ['Standing horizontal leap', 12, 'dist']],
    where: 'The widest range of any large land mammal in the Americas: the Yukon to Patagonia, including the western United States, Canada, the Andes and Patagonian steppe. Occasional sightings far east of its accepted range.',
    senses: [
      ['Sight', 'Superb in low light and tuned to movement.'],
      ['Hearing', 'Excellent.'],
      ['Smell', 'Moderate for a large carnivore.']
    ],
    danger: 'Attacks are rare but disproportionately on children and lone runners, because both trigger the chase. FIGHT BACK if attacked, do not play dead, do not run, do not crouch. Face it, look large, throw things, keep children beside you.'
  });

  animal('land', 'Polar bear', 'The only bear that hunts people deliberately', {
    speeds: [['Sprint', kmh(40)], ['Swimming', kmh(10)], ['Steady walk on ice', kmh(5.5)]],
    specs: [['Sprint distance', 100, 'dist'],
            ['Longest recorded swim', km(687), 'dist'],
            ['Mass, male', 600, 'mass']],
    where: 'The Arctic sea ice and its coasts: Canada, Greenland, Svalbard, northern Russia and Alaska.',
    senses: [
      ['Smell', 'A seal under a metre of snow at 1 km, and carrion at 30 km downwind. The best nose of any bear.'],
      ['Hearing', 'About human.'],
      ['Sight', 'About human, and good underwater.']
    ],
    danger: 'EXTREME, and unique among bears in that it may stalk a person as prey rather than defending itself. There is no bluff charge to read. In its range you carry a deterrent and you post a watch, and playing dead does not work.'
  });

  animal('land', 'American black bear', 'The common bear of North America', {
    speeds: [['Sprint', kmh(50)], ['Climbing a tree', kmh(10)]],
    specs: [['Sprint distance', 100, 'dist'], ['Daily range', km(10), 'dist'], ['Mass, male', 150, 'mass']],
    where: 'Forest across Canada, most of the United States including Appalachia and the Rockies, and northern Mexico.',
    senses: [
      ['Smell', 'Seven times a bloodhound; food at 3 km.'],
      ['Hearing', 'Twice human sensitivity.'],
      ['Sight', 'About human, in colour.']
    ],
    danger: 'Lower than brown bear, and the correct response is the OPPOSITE. Fight back against a black bear; do not play dead. Climbing does not help, because it climbs better than you. Most encounters are about food: hang it, and never leave it in a tent.'
  });

  animal('land', 'Cape buffalo', 'Kills more hunters in Africa than any other animal', {
    speeds: [['Charge', kmh(56)], ['Herd on the move', kmh(6)]],
    specs: [['Charge distance', 200, 'dist'], ['Mass', 750, 'mass']],
    where: 'Savannah, floodplain and forest across sub-Saharan Africa, in herds of tens to over a thousand.',
    senses: [
      ['Smell', 'Excellent, and the first thing to detect you.'],
      ['Hearing', 'Very good.'],
      ['Sight', 'Moderate.']
    ],
    danger: 'VERY HIGH. Charges without bluffing, circles back on whatever hurt it, and continues while wounded. A lone old bull is the most dangerous animal on foot in Africa. Give any herd a wide berth and never approach a wounded one.'
  });

  animal('land', 'Moose / elk (Eurasian)', 'The most dangerous animal in the northern forest', {
    speeds: [['Run', kmh(56)], ['Swimming', kmh(10)]],
    specs: [['Run distance', km(2), 'dist'], ['Mass, bull', 700, 'mass'], ['Shoulder height', 2.1, 'length']],
    where: 'Boreal forest right around the northern hemisphere: Alaska, Canada, the northern United States, Scandinavia, the Baltics and Russia.',
    senses: [
      ['Hearing', 'Excellent; the ears rotate independently.'],
      ['Smell', 'Excellent.'],
      ['Sight', 'Poor. It often will not identify a still person at 30 m.']
    ],
    danger: 'Injures more people in Alaska and Scandinavia than bears do. A cow with a calf and a bull in the September rut both charge, and it strikes with the front hooves. Raised hackles and flattened ears mean it is coming. Run, and put a tree between you: unlike a bear, running from a moose is correct.'
  });

  animal('land', 'Spotted hyena', 'A predator, not a scavenger', {
    speeds: [['Sprint', kmh(60)], ['Sustained trot', kmh(10)]],
    specs: [['Can hold the trot for', km(20), 'dist'], ['Nightly range', km(30), 'dist'], ['Mass', 60, 'mass']],
    where: 'Sub-Saharan Africa, in nearly every habitat from desert edge to montane forest, and often close to towns.',
    senses: [
      ['Smell', 'Carrion at 4 km downwind.'],
      ['Hearing', 'Hears other hyenas at 5 km; whoops carry that far.'],
      ['Sight', 'Very good at night.']
    ],
    danger: 'Real, and mostly at night to people sleeping outdoors. Bites the face. The bite force cracks the long bones of a giraffe. Sleep inside something, and do not treat one as a coward because of its reputation.'
  });

  animal('land', 'African wild dog', 'The most efficient pack hunter on land', {
    speeds: [['Sprint', kmh(66)], ['Hunting pace', kmh(48)]],
    specs: [['Holds the hunting pace for', km(5), 'dist'],
            ['Daily range', km(50), 'dist'], ['Hunt success rate', 80, 'none', 'per cent']],
    where: 'Fragmented across sub-Saharan Africa: strongholds in Botswana, Zimbabwe, Tanzania, Zambia and Mozambique.',
    senses: [
      ['Sight', 'Primary sense; hunts by sight in daylight.'],
      ['Hearing', 'Very good, large ears.'],
      ['Smell', 'Good.']
    ],
    danger: 'Very low to people, with almost no reliable records of attack. Listed because it will run down anything it does choose, for kilometres, which almost nothing else does.'
  });

  animal('land', 'Komodo dragon', 'The largest lizard', {
    speeds: [['Sprint', kmh(20)], ['Swimming', kmh(4)]],
    specs: [['Sprint distance', 30, 'dist'], ['Length', 3, 'length'], ['Mass', 80, 'mass']],
    where: 'Five Indonesian islands only: Komodo, Rinca, Flores, Gili Motang and Gili Dasami.',
    senses: [
      ['Smell', 'Forked tongue and vomeronasal organ. Carrion at 9.5 km downwind, and it can tell which side of the tongue the scent hit.'],
      ['Sight', 'Good by day, poor at night.'],
      ['Hearing', 'Poor; a narrow band only.']
    ],
    danger: 'HIGH at close range. Venomous, with an anticoagulant that prevents clotting, so a bite that seems survivable bleeds. Fast over 20 m. Do not stand between one and its route, and treat any bite as a medical emergency.'
  });

  animal('land', 'Sloth bear', 'The bear that maims most often', {
    speeds: [['Charge', kmh(32)]],
    specs: [['Charge distance', 50, 'dist'], ['Mass', 140, 'mass']],
    where: 'India, Sri Lanka and Nepal, in dry forest and scrub, often near villages.',
    senses: [
      ['Smell', 'Excellent; finds termite nests underground.'],
      ['Hearing', 'Poor.'],
      ['Sight', 'Poor.']
    ],
    danger: 'HIGH out of proportion to its size. Poor hearing and sight mean it is startled at close range, and it stands and strikes at the face. It causes more human injuries in India than tigers. Make noise while walking so that it hears you first.'
  });

  animal('land', 'Gaur / Indian bison', 'The largest wild cattle', {
    speeds: [['Charge', kmh(56)]],
    specs: [['Mass, bull', 1000, 'mass'], ['Shoulder height', 1.9, 'length']],
    where: 'Forest of India, Nepal, Bhutan, Myanmar, Thailand, Malaysia and Indochina.',
    senses: [
      ['Smell', 'Excellent.'],
      ['Hearing', 'Excellent.'],
      ['Sight', 'Moderate.']
    ],
    danger: 'High if surprised or cornered. Usually retreats, but a bull that decides to charge is a tonne at 56 km/h and will not stop.'
  });

  animal('land', 'Coyote', 'The adaptable one', {
    speeds: [['Sprint', kmh(65)], ['Trot', kmh(13)]],
    specs: [['Holds the trot for', km(15), 'dist'], ['Nightly range', km(25), 'dist']],
    where: 'All of North and Central America, from Alaska to Panama, and now in every major North American city.',
    senses: [
      ['Smell', 'Excellent; carrion at 1 km.'],
      ['Hearing', 'Excellent; hears rodents under snow.'],
      ['Sight', 'Good, motion-tuned.']
    ],
    danger: 'Low to adults, real to small children and to dogs, mainly where coyotes have been fed. Do not run. Shout and advance.'
  });

  animal('land', 'Wild yak', 'High-altitude bulk', {
    speeds: [['Charge', kmh(40)]],
    specs: [['Mass, bull', 1000, 'mass'], ['Altitude range', 6000, 'alt']],
    where: 'The Tibetan plateau and adjacent Qinghai, Xinjiang and Ladakh, above about 4000 m.',
    senses: [['Smell', 'Excellent.'], ['Hearing', 'Good.'], ['Sight', 'Moderate.']],
    danger: 'Wild yak charge when approached and are far more aggressive than domestic ones. Give a kilometre.'
  });

  animal('land', 'Wild boar (Eurasian), sounder', 'Group behaviour', {
    speeds: [['Charge', kmh(40)]],
    specs: [['Charge distance', 50, 'dist'], ['Group size, typical', 20, 'none', 'animals']],
    where: 'As wild boar: Europe, North Africa, Asia, and introduced across the Americas and Australia.',
    senses: [['Smell', 'A person at 1 km downwind.'], ['Hearing', 'Very good.'], ['Sight', 'Poor.']],
    danger: 'A sounder with young is the common cause of injury in European forests. Back away quietly and get behind a tree; they turn badly at speed.'
  });

  /* ── birds worth knowing where they are ── */
  animal('bird', 'Cassowary', 'The most dangerous bird alive', {
    speeds: [['Run', kmh(50)], ['Swimming', kmh(3)]],
    specs: [['Leap, vertical', 1.5, 'dist'], ['Claw length, inner toe', 0.125, 'length'], ['Mass', 60, 'mass']],
    where: 'Rainforest of northeastern Australia, New Guinea and nearby islands.',
    senses: [['Hearing', 'Very good, including a booming call below human hearing.'], ['Sight', 'Good.'], ['Smell', 'Poor.']],
    danger: 'EXTREME at close range. The inner toe carries a 12 cm dagger and it kicks forward and down. Do not run and do not turn your back: back away behind a tree. Almost every attack involves a bird that has been fed.'
  });

  animal('bird', 'Mute swan', 'The one people meet', {
    speeds: [['Flight', kmh(80)], ['Swimming', kmh(6)]],
    specs: [['Wingspan', 2.4, 'length'], ['Mass', 12, 'mass']],
    where: 'Across Europe and temperate Asia, introduced to North America, Australia and New Zealand.',
    senses: [['Sight', 'Very good.'], ['Hearing', 'Good.']],
    danger: 'Low but genuine on the water, where a defending cob can capsize a small craft or hold a swimmer under. Leave nesting birds alone between April and June.'
  });



  /* ══ BIRDS, MARINE ANIMALS AND INSECTS ═════════════════════════════════
     Same three questions as the land animals: where it is, how far away it
     knows about you, and what that means for a person.

     For most of these the honest answer to the third is "nothing" - a swift
     is not a threat and saying so is useful, because it separates the ones
     that genuinely are. The insects are the exception and they are the most
     dangerous animals in this entire catalogue: mosquitoes kill more people
     every year than every other animal combined, and it is not close. */
  var FIELD2 = {
    /* ── birds ── */
    'Common swift': {
      where: 'Breeds across Europe, North Africa and Asia; winters in sub-Saharan Africa. Nests in buildings almost everywhere it occurs.',
      senses: [['Sight', 'Excellent, tuned to catching insects on the wing.'], ['Hearing', 'Good; screaming parties keep contact by call.']],
      danger: 'None. It cannot perch and does not land except at the nest.'
    },
    'Frigatebird': {
      where: 'Tropical and subtropical oceans worldwide: the Caribbean, the tropical Atlantic and Pacific, and the Indian Ocean.',
      senses: [['Sight', 'Excellent, spots feeding fish and other birds at several kilometres.'], ['Hearing', 'Moderate.']],
      danger: 'None to people. Robs other seabirds in flight, which is how it feeds.'
    },
    'Homing pigeon': {
      where: 'Worldwide wherever people are. Feral descendants of rock doves on every inhabited continent.',
      senses: [
        ['Hearing', 'Infrasound down to 0.05 Hz: it hears distant storms, surf and wind over mountains, hundreds of kilometres away.'],
        ['Sight', 'Sees ultraviolet and polarised light, both used for navigation.'],
        ['Magnetic', 'Detects the earth\u2019s field and uses it when the sun is hidden.']
      ],
      danger: 'None. Listed for the navigation, which is the reason this app has a War Pigeon.'
    },
    'Wandering albatross': {
      where: 'The Southern Ocean, circumpolar between roughly 30 and 60 degrees south. Breeds on South Georgia, Crozet, Kerguelen and Macquarie.',
      senses: [['Smell', 'Krill and squid oil at 20 km downwind, which is unusual in a bird and is how it finds food over empty ocean.'], ['Sight', 'Excellent.']],
      danger: 'None.'
    },
    'Bar-headed goose': {
      where: 'Breeds on the Central Asian plateau, winters in India and Myanmar, crossing the Himalaya twice a year.',
      senses: [['Sight', 'Excellent; navigates by terrain.'], ['Hearing', 'Good.']],
      danger: 'None. Notable for flying at 7000 m and above, where a person would be unconscious in minutes.'
    },
    'Bar-tailed godwit': {
      where: 'Breeds in Alaska and Siberia, winters in New Zealand and eastern Australia.',
      senses: [['Touch', 'A bill tip packed with pressure receptors finds prey buried in mud without seeing it.'], ['Sight', 'Good.']],
      danger: 'None. Holds the record for the longest non-stop flight of any bird: 13,560 km, eleven days, no food, water or rest.'
    },
    'Arctic tern': {
      where: 'Breeds around the Arctic, winters in Antarctic waters. Seen almost anywhere on earth in passage.',
      senses: [['Sight', 'Excellent; plunge-dives on fish seen from the air.'], ['Hearing', 'Good.']],
      danger: 'None, but it defends a colony hard and will strike the top of your head. Hold something above you and walk out.'
    },
    'Mallard duck': {
      where: 'The most widespread duck in the world: North America, Europe, Asia and North Africa, introduced elsewhere.',
      senses: [['Sight', 'Near-360-degree, sees ultraviolet.'], ['Hearing', 'Good.'], ['Touch', 'Bill receptors for feeding in mud.']],
      danger: 'None.'
    },
    'Hummingbird': {
      where: 'The Americas only, from Alaska to Tierra del Fuego. Nowhere else in the world.',
      senses: [['Sight', 'Sees ultraviolet; can pick a single flower out at distance.'], ['Hearing', 'Good.'], ['Smell', 'Almost none.']],
      danger: 'None.'
    },

    /* ── marine ── */
    'Great white shark': {
      where: 'Temperate and subtropical coasts worldwide: South Africa, southern and eastern Australia, California, the northeastern United States, the Mediterranean and Japan.',
      senses: [
        ['Smell', 'One part blood in ten billion of water. Follows a scent plume for kilometres, though the popular "a drop at 5 km" figure is folklore.'],
        ['Electroreception', 'Ampullae of Lorenzini detect the electric field of a heartbeat at about 30 cm. This is what it uses in the last second.'],
        ['Hearing', 'Low-frequency thrashing at several hundred metres, and it is the sense that brings it in first.'],
        ['Sight', 'Good in clear water at close range, and it sees in low light.']
      ],
      danger: 'HIGH but very rare. Most bites are exploratory and it usually leaves. Do not swim at dawn, dusk or night, near seal colonies, in river mouths or in murky water, and do not swim with an open wound. If one is circling, keep it in sight and back towards something solid.'
    },
    'Shortfin mako shark': {
      where: 'Warm and temperate open ocean worldwide, usually well offshore.',
      senses: [['Smell', 'Excellent.'], ['Electroreception', 'As other sharks.'], ['Sight', 'Very good; a visual hunter of fast fish.']],
      danger: 'Moderate and mostly to fishermen. The fastest shark in the sea, and it jumps: several injuries have been caused by one landing in a boat.'
    },
    'Orca (killer whale)': {
      where: 'Every ocean on earth, from the Arctic and Antarctic pack ice to the tropics. The most widely distributed mammal after humans.',
      senses: [
        ['Echolocation', 'Locates and identifies a target at several hundred metres in complete darkness, and can tell what it is made of.'],
        ['Hearing', 'Calls carry 10 km or more; pods keep contact by dialect.'],
        ['Sight', 'Good above and below water.']
      ],
      danger: 'Effectively none in the wild. There is no reliable record of a wild orca killing a person, which given its capability is remarkable and worth stating.'
    },
    'Common dolphin': {
      where: 'Warm and temperate seas worldwide, often in herds of hundreds.',
      senses: [['Echolocation', 'Fine discrimination out to about 100 m.'], ['Hearing', 'Excellent, far above human range.'], ['Sight', 'Good.']],
      danger: 'None normally. Do not swim towards a wild pod; a bow-riding animal is not an invitation.'
    },
    'Blue whale': {
      where: 'All oceans, following krill. Concentrations off California, the Southern Ocean, the Indian Ocean and the North Atlantic.',
      senses: [['Hearing', 'Calls at 188 dB below 20 Hz, carrying hundreds of kilometres through deep water. The loudest animal on earth.'], ['Sight', 'Moderate.']],
      danger: 'None. The risk runs the other way: ship strike is a leading cause of death.'
    },
    'Gentoo penguin': {
      where: 'The Antarctic peninsula and sub-Antarctic islands: South Georgia, the Falklands, Kerguelen and Crozet.',
      senses: [['Sight', 'Adapted for underwater; hunts by eye.'], ['Hearing', 'Good; finds its own chick by call in a colony of thousands.']],
      danger: 'None.'
    },
    'Leatherback sea turtle': {
      where: 'All oceans including sub-polar water, further from the tropics than any other reptile. Nests on tropical beaches worldwide.',
      senses: [['Sight', 'Good underwater.'], ['Magnetic', 'Navigates by the earth\u2019s field and returns to its natal beach after decades.'], ['Smell', 'Good in water.']],
      danger: 'None.'
    },
    'Squid (jet propulsion)': {
      where: 'Every ocean at every depth. Humboldt squid, the large aggressive one, is eastern Pacific from California to Chile.',
      senses: [['Sight', 'Among the best eyes in the animal kingdom for resolution in low light.'], ['Touch', 'Chemical and tactile receptors on the suckers.']],
      danger: 'Low, but Humboldt squid in a feeding shoal have injured divers. Do not enter water where one is feeding at night.'
    },
    'Flying fish': {
      where: 'Tropical and subtropical oceans worldwide, especially the Caribbean, the tropical Atlantic and the Indo-Pacific.',
      senses: [['Sight', 'Good above and below the surface.']],
      danger: 'None, though one arriving in an open boat at 60 km/h at night is a real hazard to the face.'
    },

    /* ── insects ── */
    'Mosquito': {
      where: 'Everywhere except Antarctica and Iceland. Anopheles (malaria) across the tropics; Aedes aegypti (dengue, yellow fever, Zika, chikungunya) throughout the tropics and expanding into southern Europe and the southern United States.',
      senses: [
        ['Carbon dioxide', 'Your breath at 50 m downwind. This is what brings it to you.'],
        ['Smell', 'Skin chemistry, lactic acid and ammonia at about 15 m; it is choosing between people at this stage.'],
        ['Heat and moisture', 'Body heat and humidity at under 1 m: the last approach.'],
        ['Sight', 'Contrast against a background at 5 to 15 m. Dark clothing is easier to see.']
      ],
      danger: 'THE MOST DANGEROUS ANIMAL ON EARTH, by an enormous margin. Around 700,000 deaths a year from malaria, dengue and the rest, which is more than every other animal combined including humans. It hunts by your breath, so holding still does not help. Nets, permethrin-treated clothing, DEET or picaridin, and covering up at dusk and dawn. In malarial country that is not optional.'
    },
    'Horsefly': {
      where: 'Worldwide except the polar regions and a few islands. Worst near water and livestock in summer.',
      senses: [['Sight', 'Primary sense; sees movement and dark shapes at 20 to 50 m and pursues.'], ['Carbon dioxide', 'Detects breath at 20 m.'], ['Heat', 'Warm skin at close range.']],
      danger: 'Painful rather than dangerous. It cuts rather than pierces, so the bite bleeds and can become infected. It pursues a moving target, which is why it follows a vehicle or a runner.'
    },
    'Honeybee': {
      where: 'Every continent except Antarctica. Africanised bees across the Americas from Argentina to the southern United States.',
      senses: [
        ['Smell', 'Roughly 100 times more sensitive than a dog for some compounds. Detects the alarm pheromone of a hive-mate instantly.'],
        ['Sight', 'Sees ultraviolet and polarised light; navigates by the sun through cloud.'],
        ['Vibration', 'Feels footfall and hive knocks through the substrate.']
      ],
      danger: 'Serious in two cases. Anaphylaxis in a sensitised person is a medical emergency within minutes: carry adrenaline if you are known to react. Africanised colonies pursue for up to 400 m and attack in the hundreds. Run in a straight line, cover your face, get indoors or into a vehicle. Do not jump into water: they wait.'
    },
    'Hornet': {
      where: 'Europe and Asia. The Asian giant hornet is Japan, Korea and China; the yellow-legged hornet has spread across Europe.',
      senses: [['Smell', 'Excellent, including alarm pheromone.'], ['Sight', 'Very good, hunts on the wing.'], ['Heat', 'Detects a warm body at close range.']],
      danger: 'High near a nest. The sting is far more venomous than a bee\u2019s and it can sting repeatedly. The Asian giant hornet kills tens of people a year in Japan. Never disturb a nest, and never swat one near others: the crushed body releases an alarm signal.'
    },
    'Housefly': {
      where: 'Worldwide wherever people and livestock are.',
      senses: [['Sight', 'Compound eyes at about 250 frames per second, which is why swatting fails.'], ['Smell', 'Rotting material at several hundred metres downwind.'], ['Taste', 'Tastes with the feet.']],
      danger: 'Indirect but real: mechanical transmission of dysentery, typhoid, cholera and food poisoning. Cover food, and do not let it walk on a wound.'
    },
    'Cockroach': {
      where: 'Worldwide in buildings; several species are now entirely dependent on human structures.',
      senses: [['Touch', 'Cerci at the rear detect air movement of a few millimetres per second and trigger a flight response in 8 ms.'], ['Smell', 'Excellent.'], ['Sight', 'Good in near-darkness.']],
      danger: 'Indirect: allergens and asthma, plus mechanical carriage of gut pathogens. It flees light and touch, which is why you only see one when the population is large.'
    },
    'Desert locust': {
      where: 'A belt from West Africa across the Sahel, the Horn of Africa, Arabia, Iran and into northwest India. Swarms reach far outside it.',
      senses: [['Smell', 'Finds vegetation and the swarm pheromone.'], ['Sight', 'Good; the swarm holds together visually.'], ['Touch', 'Contact on the hind legs is what switches a solitary locust into the swarming form.']],
      danger: 'None directly, and among the most destructive animals alive. A swarm covers hundreds of square kilometres and eats its own weight daily: a single square kilometre of swarm consumes the food of 35,000 people in a day.'
    }
  };

  Object.keys(FIELD2).forEach(function (name) {
    var rec = C.all().filter(function (r) { return r.cat === 'bio' && r.n === name; })[0];
    if (!rec) { console.warn('Artemidos bio: no entry named "' + name + '"'); return; }
    var f = FIELD2[name];
    if (f.where) rec.where = f.where;
    if (f.senses) rec.senses = f.senses;
    if (f.danger) rec.danger = f.danger;
  });

  /* ── the sea animals that actually hurt people ── */
  animal('sea', 'Box jellyfish', 'The most venomous marine animal', {
    speeds: [['Drifting / swimming', kmh(7)]],
    specs: [['Tentacle length', 3, 'length'], ['Bell width', 0.3, 'length'],
            ['Time to collapse, worst case', 120, 'none', 'seconds']],
    where: 'Northern Australia, the Indo-Pacific, Southeast Asia and the Philippines. Irukandji, a tiny relative, occurs in the same waters and further south.',
    senses: [['Sight', 'Twenty-four eyes in four clusters, including lensed eyes that image. It steers around obstacles, which no other jellyfish does.'],
             ['Touch', 'Fires on contact; it does not aim at you.']],
    danger: 'EXTREME. Chironex fleckeri venom can stop the heart in two to five minutes and the pain is incapacitating. Wear a stinger suit in season, do not enter the water where nets are absent, douse with VINEGAR (not fresh water, which fires more stingers), do not rub, and get help immediately. Irukandji is nearly invisible and its sting seems trivial for 20 to 40 minutes before severe systemic illness.'
  });

  animal('sea', 'Blue-ringed octopus', 'Small, calm and lethal', {
    speeds: [['Swimming', kmh(2)]],
    specs: [['Body length', 0.06, 'length'], ['Venom, enough for', 26, 'none', 'adults']],
    where: 'Rock pools and shallow reef from Japan through the Philippines and Indonesia to southern Australia.',
    senses: [['Sight', 'Excellent for an invertebrate.'], ['Touch', 'Chemoreception through the arms.']],
    danger: 'EXTREME if handled. Carries tetrodotoxin: no antivenom exists. The bite is often painless and paralysis follows within minutes while the person stays conscious. Rescue breathing until the venom clears is the only treatment and it works. The rings only flash when it is already alarmed, so an unlit animal is not a safe one. Do not pick up small octopuses, ever.'
  });

  animal('sea', 'Stonefish', 'The most venomous fish', {
    speeds: [['Ambush strike', kmh(1)]],
    specs: [['Length', 0.35, 'length'], ['Dorsal spines', 13, 'none', 'venomous']],
    where: 'Shallow coastal water of the Indo-Pacific: the Red Sea, East Africa, India, Southeast Asia and northern Australia.',
    senses: [['Sight', 'Adequate; it does not need much.'], ['Lateral line', 'Feels water movement and strikes at prey passing above.']],
    danger: 'EXTREME on contact and the danger is that you cannot see it: it is indistinguishable from a rock. The sting is agonising and can be fatal. Wear hard-soled footwear in shallow tropical water, shuffle rather than step, immerse the wound in water as hot as can be tolerated, and get antivenom.'
  });

  animal('sea', 'Bull shark', 'The one that comes upriver', {
    speeds: [['Sprint', kmh(40)], ['Cruise', kmh(3)]],
    specs: [['Length', 3.5, 'length'], ['Recorded up the Mississippi', km(1100), 'dist'],
            ['Recorded up the Amazon', km(4000), 'dist']],
    where: 'Warm coasts worldwide AND fresh water: the Mississippi, Amazon, Zambezi, Ganges, Brisbane River and Lake Nicaragua. It is the only large shark that tolerates fresh water indefinitely.',
    senses: [['Smell', 'Excellent, and it hunts in water too murky to see through.'],
             ['Electroreception', 'The primary sense at close range in turbid river water.'],
             ['Hearing', 'Low-frequency splashing at long range.']],
    danger: 'HIGH, and probably responsible for more attacks in shallow water than any other species. Aggressive, common, and found where people swim: river mouths, harbours, canals and surf. Avoid murky water, river mouths and dusk.'
  });



  /* the remainder, so that every species in this section answers the same
     three questions and none of them looks half-finished */
  var FIELD3 = {
    'Pronghorn antelope': {
      where: 'Open plains and sagebrush of western North America: Wyoming, Montana, the Dakotas, and south into northern Mexico.',
      senses: [['Sight', 'The best eyes of any land mammal for detection: a 320-degree field and movement picked up at 6 km, roughly eight-power binoculars.'],
               ['Hearing', 'Good.'], ['Smell', 'Good.']],
      danger: 'None. Its speed evolved against a cheetah that has been extinct in America for ten thousand years.'
    },
    'Horse': {
      where: 'Worldwide, domesticated. Feral populations in the American west, Australia, Mongolia and the Camargue.',
      senses: [['Hearing', 'Ears rotate 180 degrees independently; hears well above human range.'],
               ['Sight', 'Almost 350 degrees, with blind spots directly in front of the nose and directly behind. Approach at the shoulder.'],
               ['Smell', 'Very good.']],
      danger: 'Kicks and bites cause serious injury, and more people are hurt by horses than by wild animals in most countries. Never stand directly behind one. A horse that cannot see you where it expects you is a horse that kicks.'
    },
    'Camel': {
      where: 'Dromedary across North Africa, the Sahel, Arabia, Iran, Pakistan, India and feral in Australia. Bactrian in Central Asia and Mongolia.',
      senses: [['Smell', 'Water at several kilometres downwind.'], ['Sight', 'Good; a double row of lashes and a third eyelid for sand.'], ['Hearing', 'Good, ears close against sand.']],
      danger: 'A bull in rut bites and can crush a person by kneeling on them. Spitting is regurgitated stomach contents and is a warning, not an insult.'
    },
    'Domestic dog': {
      where: 'Worldwide. Free-roaming and feral populations across Asia, Africa and Latin America.',
      senses: [['Smell', 'Ten thousand to a hundred thousand times human. Tracks a person hours old, and detects scent at over 1 km downwind.'],
               ['Hearing', 'Up to 45 kHz and four times the human distance.'],
               ['Sight', 'Poor detail, excellent motion and low light.']],
      danger: 'Kills roughly 59,000 people a year, almost all through RABIES rather than trauma, which makes it second only to the mosquito. Any bite from an unknown dog in a rabies-endemic country is a medical emergency: wash for 15 minutes and get post-exposure prophylaxis. Do not run from a pack; stand side-on, avoid eye contact, back away.'
    },
    'Domestic cat': {
      where: 'Worldwide, and one of the most damaging invasive predators on earth.',
      senses: [['Hearing', 'Up to 64 kHz, the widest range of any land carnivore; locates a sound to within 8 cm at a metre.'],
               ['Sight', 'Six to eight times better than human in low light.'],
               ['Whiskers', 'Detect air movement and gap width in complete darkness.']],
      danger: 'Bites carry Pasteurella and infect readily; a cat bite to the hand needs antibiotics, not optimism.'
    },
    'Giant tortoise': {
      where: 'The Galapagos and Aldabra only.',
      senses: [['Smell', 'Primary sense for food.'], ['Sight', 'Moderate, colour.'], ['Hearing', 'Poor.']],
      danger: 'None.'
    },
    'Three-toed sloth': {
      where: 'Rainforest of Central and South America, from Honduras to northern Argentina.',
      senses: [['Smell', 'Primary sense.'], ['Hearing', 'Poor.'], ['Sight', 'Poor; colour-blind and cannot see well in bright light.']],
      danger: 'None, though the claws are long and it will use them if handled.'
    },
    'Sailfish': {
      where: 'Warm oceans worldwide: the tropical and subtropical Atlantic, Indian and Pacific.',
      senses: [['Sight', 'Excellent, a visual hunter in blue water.'], ['Lateral line', 'Feels the movement of a baitball.']],
      danger: 'Only to fishermen: the bill is a real hazard when the fish is boated.'
    },
    'Black marlin': {
      where: 'Tropical and subtropical Indo-Pacific, especially the Great Barrier Reef and Central America.',
      senses: [['Sight', 'Excellent.'], ['Lateral line', 'Good.']],
      danger: 'As sailfish: the danger is the bill at the boat, not in the water.'
    },
    'Bluefin tuna': {
      where: 'Atlantic bluefin across the North Atlantic and the Mediterranean; Pacific and southern bluefin in their own oceans.',
      senses: [['Sight', 'Among the sharpest of any fish.'], ['Lateral line', 'Excellent.'], ['Smell', 'Good.']],
      danger: 'None in the water.'
    },
    'Dragonfly': {
      where: 'Every continent except Antarctica, near fresh water.',
      senses: [['Sight', 'Nearly 30,000 facets and almost 360-degree vision, at about 200 frames per second. It predicts where prey will be rather than chasing it, and takes 95 per cent of what it goes for.'],
               ['Touch', 'Antennae and wind-sensitive hairs for flight control.']],
      danger: 'None. The best aerial hunter alive and completely harmless to people.'
    }
  };

  Object.keys(FIELD3).forEach(function (name) {
    var rec = C.all().filter(function (r) { return r.cat === 'bio' && r.n === name; })[0];
    if (!rec) return;
    var f = FIELD3[name];
    if (f.where) rec.where = f.where;
    if (f.senses) rec.senses = f.senses;
    if (f.danger) rec.danger = f.danger;
  });

})();
