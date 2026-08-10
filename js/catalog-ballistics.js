/*
 * Artemidos - catalogue: ballistic ranges, cover and protection standards
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * PURPOSE: this section exists to answer defensive questions. What distance
 * does a threat class reach? What in this street will actually stop a round,
 * and what only hides you? What does a vehicle or vest rated to a given
 * standard really protect against?
 *
 * That is standard close-protection material: the cover-versus-concealment
 * distinction is core doctrine, and getting it wrong is how people die behind
 * things that look solid. Nothing here describes how to attack anything.
 *
 * Ranges are published figures:
 *   EFFECTIVE  - the range at which a trained user is expected to hit
 *   MAXIMUM    - the range the projectile physically travels, which is what
 *                matters for backstops, overshoot and bystander risk
 * The two differ by a factor of five or more. Confusing them is a planning
 * failure with a long history.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  C.cat({
    id: 'ball', n: 'Ballistics & cover', icon: 'shield',
    d: 'Threat ranges, what stops what, and protection standards',
    subs: [
      { id: 'ranges', n: 'Threat ranges by class', icon: 'target', d: 'Aimed, effective and maximum range by weapon class' },
      { id: 'guns', n: 'Firearms by model', icon: 'target', d: 'Named service weapons, three ranges each' },
      { id: 'cover', n: 'Cover vs concealment', icon: 'shield' },
      { id: 'standards', n: 'Protection standards', icon: 'shield' },
      { id: 'blast', n: 'Blast & standoff distances', icon: 'blast', d: 'Lethal, damage, partially safe and fully safe' },
      { id: 'safety', n: 'Danger areas & ricochet', icon: 'warn' }
    ]
  });

  /* ── threat ranges by weapon class ────────────────────────────────── */

  /* Three ranges, not one. A weapon has a range at which an average shooter
     hits a man-sized target on demand, a longer range at which it still does
     the job but drop and wind have to be read and allowed for, and a far
     longer range the bullet simply reaches. Quoting only the middle one
     understates the aiming problem and badly understates the danger area. */
  function w(n, d, eff, max, mv, specs, note, aim) {
    var s = [];
    if (aim) s.push(['Best aimed range', aim, 'dist', 'point target, iron sights, no holdover']);
    s.push(['Effective range', eff, 'dist', 'still effective, but drop and wind must be read']);
    s.push(['Maximum range travelled', max, 'dist', 'how far the bullet goes if it hits nothing']);
    s.push(['Time of flight to 100 m', 100 / mv, 'none', 'seconds, approximate']);
    C.add({
      cat: 'ball', sub: 'ranges', n: n, d: d,
      speeds: [['Muzzle velocity', mv]],
      specs: s.concat(specs || []),
      note: note
    });
  }

  C.add({
    cat: 'ball', sub: 'ranges', ord: -1, n: 'The three ranges', d: 'Aimed, effective, maximum, and why they differ',
    table: {
      plain: true,
      cols: ['Range', 'What it means'],
      rows: [
        ['Best aimed range', 'The distance at which a competent shooter hits a man-sized target on demand, sights set, no allowance made for anything. For most assault rifles this is 200 to 300 m.'],
        ['Effective range', 'The furthest the weapon still does its job, but only if drop and wind are read and allowed for. The bullet is falling measurably and a crosswind is moving it. Roughly 300 to 600 m for the same rifles.'],
        ['Maximum range', 'How far the bullet physically travels if it hits nothing, fired at the optimum elevation. Kilometres. It has nothing to do with accuracy and everything to do with what is behind the target.'],
        ['Why it matters when aiming', 'Past the aimed range the sight picture stops being the whole answer. Distance has to be judged, drop held over, and wind read across the whole flight path, not at the muzzle.'],
        ['Why it matters when planning', 'The danger area is set by the MAXIMUM range. A pistol is a 50 m weapon that throws a bullet 1.8 km, and everything in that arc is downrange.']
      ]
    },
    note: 'The FAMAS is the clean example: about 200 m where you simply aim and hit, about 300 m effective where the round is dropping and the wind is pushing it, and roughly 3.2 km of maximum travel. Three different numbers describing three different questions, and quoting any one of them alone gives the wrong answer to the other two.'
  });

  w('Handgun, 9 × 19 mm', 'Service pistol', 50, 1800, 360,
    [['Practical accuracy, trained', 25, 'dist']],
    'Effective range is 50 m, but the bullet travels well over a kilometre. Everything behind and beyond the target is inside the danger area.', 25);

  w('Handgun, .45 ACP', 'Service pistol', 50, 1500, 260, null,
    'Heavy and subsonic: shorter maximum range than 9 mm, and noticeably more affected by wind and drop past 50 m.', 25);

  w('Handgun, .357 Magnum', 'Revolver', 100, 2000, 400, null, null, 50);

  w('Submachine gun, 9 mm', 'MP5 class', 200, 1800, 400,
    [['Practical burst accuracy', 50, 'dist']],
    'Same cartridge as the pistol; the longer barrel and shoulder stock extend the hit probability, not the terminal effect.', 50);

  w('Assault rifle, 5.56 × 45 mm', 'M4 / AR-15 / L85 class', 500, 3600, 880,
    [['Effective range, area target', 600, 'dist'], ['Practical urban engagement', 100, 'dist']],
    'Fragmentation and yaw effects fall off with velocity, so terminal performance from a short barrel degrades much sooner than the effective range suggests.', 300);

  w('Assault rifle, 7.62 × 39 mm', 'AK-47 / AKM class', 350, 2500, 715,
    [['Effective range, area target', 600, 'dist']],
    'The most widely distributed rifle cartridge in the world. Heavy, subsonic beyond about 700 m, and it punches through light cover better than 5.56.', 300);

  w('Assault rifle, 5.45 × 39 mm', 'AK-74 class', 500, 3150, 900, null, null, 300);

  w('Battle rifle, 7.62 × 51 mm NATO', 'FN FAL / M14 / G3 class', 800, 3725, 838,
    [['Effective range, area target', 1000, 'dist']], null, 500);

  w('Designated marksman rifle, 7.62 × 51 mm', 'Semi-automatic precision', 800, 3725, 800, null, null, 600);

  w('Sniper rifle, 7.62 × 51 mm', 'Bolt action, M24 / L96 class', 800, 3725, 790,
    [['Time of flight to 800 m', 1.3, 'none', 'seconds']], null, 800);

  w('Sniper rifle, .300 Winchester Magnum', 'Bolt action, extended range', 1200, 4500, 900, null, null, 900);

  w('Sniper rifle, .338 Lapua Magnum', 'Bolt action, long range', 1500, 5000, 915,
    [['Time of flight to 1500 m', 2.6, 'none', 'seconds'], ['Longest confirmed shot', 3540, 'dist']],
    'Above about 1000 m the shot depends on wind reading across the whole flight path, not just at the firing point. Time of flight also means a moving target must be led by several metres.', 1200);

  w('Anti-materiel rifle, 12.7 × 99 mm (.50 BMG)', 'Barrett M107 class', 1800, 6800, 890,
    [['Effective range, area target', 2000, 'dist']],
    'Defeats most light vehicle armour and unhardened cover. Standoff of 1.8 km is the planning problem: it engages from outside any cordon a close-protection team would normally set.', 1500);

  w('Light machine gun, 5.56 mm', 'M249 / Minimi class', 800, 3600, 915,
    [['Effective range, area target', 1000, 'dist']], null, 600);

  w('General purpose machine gun, 7.62 mm', 'M240 / PKM / MAG class', 800, 3725, 853,
    [['Effective range, area target', 1800, 'dist'], ['Maximum with tripod and sight', 1800, 'dist']], null, 800);

  w('Heavy machine gun, 12.7 mm', 'M2HB / Kord class', 1830, 6800, 890,
    [['Effective range, area target', 2000, 'dist']], null, 1200);

  w('Heavy machine gun, 14.5 mm', 'KPV class', 2000, 8000, 1000,
    [['Anti-aircraft effective ceiling', 1400, 'alt']]);

  w('Shotgun, 12 gauge buckshot', 'Smoothbore', 40, 500, 400,
    [['Pattern spread at 20 m', 0.5, 'length'], ['Maximum pellet travel', 500, 'dist']],
    'Pellets spread roughly 25 mm per metre of range with a cylinder choke. Beyond 40 m the pattern is too open to be reliable, but individual pellets still carry.');

  w('Shotgun, 12 gauge slug', 'Smoothbore, single projectile', 100, 900, 400);

  w('Grenade launcher, 40 mm (underbarrel)', 'M203 / M320 class', 150, 400, 76,
    [['Effective range, area target', 350, 'dist'], ['Casualty radius', 5, 'dist'], ['Minimum safe arming range', 14, 'dist']]);

  w('Automatic grenade launcher, 40 mm', 'Mk 19 / AGS-17 class', 1500, 2212, 241,
    [['Casualty radius', 5, 'dist'], ['Rate of fire', 60, 'none', 'rounds/min sustained']]);

  w('Autocannon, 20 mm', 'Vehicle and aircraft mounted', 2000, 4000, 1050);
  w('Autocannon, 25 mm', 'Vehicle mounted, M242 class', 2000, 3000, 1100);
  w('Autocannon, 30 mm', 'Vehicle mounted, 2A42 / MK44 class', 3000, 5000, 960,
    [['Effective range, air target', 4000, 'dist']]);

  C.add({
    cat: 'ball', sub: 'ranges', n: 'Hand grenade', d: 'Fragmentation, high explosive',
    speeds: [['Thrown velocity, typical', 20]],
    specs: [
      ['Throwing range, standing', 35, 'dist'],
      ['Throwing range, prone', 20, 'dist'],
      ['Casualty radius', 15, 'dist'],
      ['Fragment danger radius', 230, 'dist'],
      ['Fuze delay', 4.5, 'none', 'seconds']
    ],
    note: 'The casualty radius is smaller than the throwing range but the fragment danger radius is far larger than both. Cover is required for the thrower, not just distance.'
  });

  /* ── cover vs concealment ─────────────────────────────────────────── */

  function cover(n, d, rows, specs, note) {
    C.add({
      cat: 'ball', sub: 'cover', n: n, d: d,
      table: { cols: ['Threat', 'Result'], rows: rows },
      specs: specs, note: note
    });
  }

  C.add({
    cat: 'ball', sub: 'cover', id: 'cover-principle', ord: -1, n: 'The distinction itself',
    d: 'Read this before the material list',
    note: 'CONCEALMENT hides you from view. COVER stops projectiles. Most things that feel protective are only concealment: interior walls, hedges, doors, car body panels, market stalls. ' +
      'Under stress people take cover behind whatever breaks line of sight, and that instinct is what the material list below is meant to correct. ' +
      'Three working rules: anything you could put a fist through will not stop a rifle round; the further from the shooter, the more a marginal barrier helps; and no barrier is rated for repeated hits in the same place.'
  });

  cover('Interior partition wall', 'Plasterboard on timber or metal studs',
    [['9 mm handgun', 'Passes through multiple walls'],
     ['5.56 / 7.62 rifle', 'Passes through, barely slowed'],
     ['12 gauge buckshot', 'Passes through at close range'],
     ['Fragmentation', 'Passes through']],
    [['Typical thickness', 0.1, 'length']],
    'Concealment only. Rounds routinely pass through several rooms. This is the single most dangerous misjudgement inside buildings.');

  cover('Interior door', 'Hollow-core or panelled timber',
    [['9 mm handgun', 'Passes through'],
     ['Rifle', 'Passes through'],
     ['12 gauge buckshot', 'Passes through']],
    null, 'Concealment only, including the frame in most domestic construction.');

  cover('Solid hardwood door, 45 mm', 'Solid timber, external quality',
    [['9 mm handgun', 'May stop at longer range, unreliable'],
     ['Rifle', 'Passes through'],
     ['12 gauge buckshot', 'Stops at longer range']],
    null, 'Marginal. Treat as concealment unless it is a rated security door.');

  cover('Brick wall, single skin (100 mm)', 'Standard non-structural brick',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Defeated after 2 to 3 rounds in the same area'],
     ['7.62 × 51 rifle', 'Defeated after 1 to 2 rounds'],
     ['12.7 mm', 'Passes through']],
    [['Thickness', 0.1, 'length']],
    'Good against handguns, temporary against rifles. Sustained fire on one spot will open it, so move along the wall rather than staying at one point.');

  cover('Brick wall, double skin (225 mm)', 'Cavity or solid double brick',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Stops'],
     ['7.62 × 51 rifle', 'Stops, degrades under sustained fire'],
     ['12.7 mm', 'Defeated after several rounds']],
    [['Thickness', 0.225, 'length']],
    'Genuine cover against rifle calibres. Most older European construction is this or better at ground floor level.');

  cover('Concrete block, hollow', 'Unfilled masonry block',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Defeated after 2 to 3 rounds'],
     ['7.62 rifle', 'Defeated after 1 to 2 rounds']],
    [['Thickness', 0.2, 'length']],
    'The voids make it far weaker than it looks. Filled block is a different material entirely.');

  cover('Concrete block, filled', 'Grout or sand filled masonry',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Stops'],
     ['7.62 × 51 rifle', 'Stops'],
     ['12.7 mm', 'Defeated after repeated hits']],
    [['Thickness', 0.2, 'length']]);

  cover('Reinforced concrete, 150 mm', 'Structural concrete with rebar',
    [['Rifle up to 7.62 AP', 'Stops'],
     ['12.7 mm AP', 'Stops, spalls on the far face'],
     ['Autocannon 30 mm', 'Defeated']],
    [['Thickness', 0.15, 'length']],
    'Spalling matters: concrete fragments come off the protected side even when the round does not penetrate. Stand off from the face where possible.');

  cover('Sandbag wall, 250 mm', 'Filled with sand, correctly laid',
    [['9 mm handgun', 'Stops'],
     ['5.56 / 7.62 rifle', 'Stops'],
     ['7.62 AP', 'Stops at 350 mm thickness'],
     ['12.7 mm', 'Defeated below 600 mm']],
    [['Thickness for rifle protection', 0.25, 'length'], ['Thickness for AP protection', 0.35, 'length']],
    'Sand is one of the best cover materials by weight. It also self-heals: rounds do not open a channel the way masonry does.');

  cover('Earth berm or bank', 'Compacted soil',
    [['Rifle up to 7.62 ball', 'Stops at 400 mm'],
     ['7.62 AP', 'Stops at 600 mm'],
     ['12.7 mm', 'Stops at 900 mm']],
    [['Thickness for rifle protection', 0.4, 'length']],
    'Dry loose soil performs worse than compacted; frozen ground worse again. Double the figures if the soil is dry sand or has not been compacted.');

  cover('Vehicle door, unarmoured', 'Standard car body panel',
    [['9 mm handgun', 'May stop at range, unreliable'],
     ['Rifle', 'Passes through both doors'],
     ['12 gauge buckshot', 'Passes through']],
    null,
    'Concealment. The sheet steel is under a millimetre thick. The common instruction to "get behind the car door" is wrong for anything above a handgun at distance.');

  cover('Vehicle engine block', 'Engine, transmission and front axle',
    [['9 mm handgun', 'Stops'],
     ['5.56 / 7.62 rifle', 'Stops'],
     ['12.7 mm', 'May defeat']],
    null,
    'The best cover an ordinary car offers, along with the wheel and axle assemblies. If you must use a vehicle for cover, use the engine end, low, and be aware the vehicle may then be immobile.');

  cover('Vehicle wheel and axle', 'Wheel hub, brake assembly, suspension',
    [['9 mm handgun', 'Stops'],
     ['5.56 / 7.62 rifle', 'Stops'],
     ['12.7 mm', 'May defeat']],
    null, 'Low, solid and located at each corner. Being low also reduces your exposed silhouette.');

  cover('Laminated windscreen, standard', 'Automotive safety glass',
    [['9 mm handgun', 'Penetrated, deflected in angle'],
     ['Rifle', 'Penetrated']],
    null,
    'Angle deflects handgun rounds unpredictably, which cuts both ways: rounds fired out through it also deflect. Not cover.');

  cover('Steel plate, 6 mm mild steel', 'Skip, container wall, plant machinery',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Penetrated'],
     ['7.62 rifle', 'Penetrated']],
    [['Thickness', 0.006, 'length']],
    'Watch for spalling and ricochet off the face. A shallow-angle hit on steel throws fragments along the plate.');

  cover('Steel plate, 12 mm rolled homogeneous armour', 'Armour steel',
    [['7.62 × 51 ball', 'Stops'],
     ['7.62 AP', 'Marginal'],
     ['12.7 mm AP', 'Penetrated']],
    [['Thickness', 0.012, 'length']]);

  cover('Shipping container, loaded', 'Corten steel wall plus contents',
    [['9 mm handgun', 'Stops'],
     ['Rifle, empty container', 'Penetrated both walls'],
     ['Rifle, container full of dense cargo', 'Stops']],
    null, 'The steel is only 1.6 to 2 mm. It is the contents that provide the protection, so an empty container is concealment.');

  cover('Water', 'Swimming pool, tank, river',
    [['Handgun', 'Stops within 1.2 m'],
     ['Rifle, supersonic', 'Breaks up within 1 m']],
    [['Depth for handgun protection', 1.2, 'length'], ['Depth for rifle protection', 1, 'length']],
    'Counter-intuitively, fast rifle rounds break up in water sooner than slow handgun rounds. Water is genuine cover at surprisingly shallow depth, though refraction makes aiming into it unreliable in both directions.');

  cover('Books, paper, dense stores', 'Filing, stock, packed shelving',
    [['9 mm handgun', 'Stops within 200 mm'],
     ['5.56 rifle', 'Stops within 450 mm'],
     ['7.62 rifle', 'Stops within 600 mm']],
    [['Depth for rifle protection', 0.6, 'length']],
    'A packed bookcase or a pallet of paper is far better cover than the wall behind it. Useful to know in an office or warehouse.');

  cover('Timber log or post, 300 mm', 'Solid hardwood',
    [['9 mm handgun', 'Stops'],
     ['5.56 rifle', 'Stops'],
     ['7.62 × 51 ball', 'Marginal']],
    [['Diameter', 0.3, 'length']]);

  cover('Hedge, foliage, undergrowth', 'Vegetation',
    [['Any firearm', 'No protection']],
    null, 'Concealment only, and it degrades: it works far better at night and against thermal-free observation than against anything else.');

  cover('Kerb, low wall, street furniture', 'Urban low cover',
    [['Handgun and rifle, if solid stone or concrete', 'Stops if thick enough'],
     ['If planter, bin or bollard shell', 'Concealment only']],
    null, 'Check the construction, not the appearance. A cast concrete planter is cover; a steel-skinned one full of soil is cover; an empty fibreglass one is not.');

  /* ── protection standards ─────────────────────────────────────────── */

  function std(n, d, rows, note) {
    C.add({ cat: 'ball', sub: 'standards', n: n, d: d, table: { cols: ['Level', 'Defeats'], rows: rows }, note: note });
  }

  std('NIJ 0101.06: body armour', 'United States, the long-standing standard',
    [['IIA', '9 mm at 373 m/s, .40 S&W at 352 m/s'],
     ['II', '9 mm at 398 m/s, .357 Magnum at 436 m/s'],
     ['IIIA', '.357 SIG at 448 m/s, .44 Magnum at 436 m/s'],
     ['III', '7.62 × 51 M80 ball at 847 m/s, six rounds'],
     ['IV', '.30-06 M2 AP at 878 m/s, one round']],
    'Soft armour stops at IIIA. Anything rifle-rated (III and IV) is a hard plate. Level IV is certified for a single AP round, not sustained fire.');

  std('NIJ 0101.07: body armour, current', 'United States, replaces 0101.06 naming',
    [['HG1', 'Handgun: 9 mm and .357 Magnum'],
     ['HG2', 'Handgun: 9 mm and .44 Magnum, higher velocity'],
     ['RF1', 'Rifle: 7.62 × 51 M80, 7.62 × 39 mild steel core, 5.56 M193'],
     ['RF2', 'RF1 threats plus 5.56 M855 steel penetrator'],
     ['RF3', '.30-06 M2 AP']],
    'The rifle levels are now cumulative, which the old III/IV split was not. RF2 explicitly covers the M855 green-tip round that some level III plates failed.');

  std('EN 1063: ballistic glass', 'European standard for transparent armour',
    [['BR1', '.22 LR'],
     ['BR2', '9 mm Parabellum'],
     ['BR3', '.357 Magnum'],
     ['BR4', '.44 Magnum'],
     ['BR5', '5.56 × 45 NATO'],
     ['BR6', '7.62 × 51 NATO ball'],
     ['BR7', '7.62 × 51 AP'],
     ['SG1 / SG2', '12 gauge slug, single and triple hit']],
    'Glass thickness roughly doubles from BR4 to BR6, and weight with it. A BR6 window is 40 to 55 mm thick and is why armoured vehicle glass is so deep.');

  std('VPAM BRV 2009: vehicle protection', 'German standard, common on armoured cars',
    [['VR1 - VR3', 'Handgun, up to .357 Magnum'],
     ['VR4', '.44 Remington Magnum'],
     ['VR5', '5.56 × 45 (M193)'],
     ['VR6', '7.62 × 51 ball'],
     ['VR7', '7.62 × 51 AP'],
     ['VR8', '7.62 × 39 API (BZ)'],
     ['VR9', '7.62 × 54R API (B32)'],
     ['VR10', '.30-06 AP, 7.62 × 51 AP hard core']],
    'VR7 and VR9 are the usual specifications for executive protected vehicles. VR9 adds meaningful weight and changes the vehicle handling, brakes and tyre requirements.');

  std('STANAG 4569: armoured vehicle protection', 'NATO standard, military vehicles',
    [['Level 1', '7.62 × 51 ball and 5.56 at 30 m; 155 mm shell splinter at 100 m'],
     ['Level 2', '7.62 × 39 API BZ at 30 m; splinter at 80 m'],
     ['Level 3', '7.62 × 54R API B32 at 30 m; splinter at 60 m'],
     ['Level 4', '14.5 × 114 API B32 at 200 m; splinter at 30 m'],
     ['Level 5', '25 mm APDS-T at 500 m'],
     ['Level 6', '30 mm APFSDS at 500 m']],
    'Separate annexes cover mine blast under the wheel and under the hull, and artillery fragment protection. A vehicle quoted at "STANAG 3" without stating which annex is not fully specified.');

  std('EN 1522 / 1523: windows, doors, shutters', 'European building fenestration',
    [['FB1 - FB3', 'Handgun, .22 to .357'],
     ['FB4', '.44 Magnum'],
     ['FB5', '5.56 × 45'],
     ['FB6', '7.62 × 51 ball'],
     ['FB7', '7.62 × 51 AP'],
     ['FSG', 'Shotgun']],
    'Applies to the whole assembly, frame included. A rated pane in an unrated frame protects nothing: rounds go through the frame.');

  /* ── danger areas & ricochet ──────────────────────────────────────── */

  C.add({
    cat: 'ball', sub: 'safety', n: 'Overshoot and the danger area',
    d: 'Why maximum range, not effective range, sets the safety zone',
    specs: [
      ['9 mm maximum travel', 1800, 'dist'],
      ['5.56 maximum travel', 3600, 'dist'],
      ['7.62 × 51 maximum travel', 3725, 'dist'],
      ['12.7 mm maximum travel', 6800, 'dist']
    ],
    note: 'A round that misses keeps going. Range danger areas are built on maximum travel plus a ricochet allowance, which is why a rifle range needs several kilometres of clear ground or a proper backstop. ' +
      'In a protective context the same arithmetic decides which direction is survivable to move in, and which buildings behind the incident are still inside the danger area.'
  });

  C.add({
    cat: 'ball', sub: 'safety', n: 'Ricochet behaviour',
    d: 'What happens when a round strikes at a shallow angle',
    table: {
      cols: ['Surface', 'Behaviour'],
      rows: [
        ['Water', 'Ricochets at angles below about 7°, travels far, stays near the surface'],
        ['Concrete or tarmac', 'Ricochets below about 15°, then runs along the surface within 300 mm of it'],
        ['Steel', 'Ricochets and fragments; splash travels along the plate face'],
        ['Sand or soil', 'Usually absorbs; dry compacted sand can still ricochet at very shallow angles'],
        ['Masonry', 'Ricochets and throws secondary fragments of the wall itself']
      ]
    },
    note: 'The practical consequence is that going prone next to a hard surface is not always safer: ricochets off concrete run parallel to it and low. Getting behind cover beats getting flat beside it.'
  });

  C.add({
    cat: 'ball', sub: 'safety', n: 'Reactionary gap and closing time',
    d: 'How much distance a threat covers before you can respond',
    specs: [
      ['Distance covered in 1.5 s, running', 10, 'dist'],
      ['Distance covered in 3 s, running', 20, 'dist'],
      ['Vehicle at 50 km/h in 3 s', 42, 'dist'],
      ['Vehicle at 100 km/h in 3 s', 83, 'dist'],
      ['Trained response time, drawn to first action', 1.5, 'none', 'seconds']
    ],
    note: 'Reaction is not instant and movement is not slow. A person on foot closes 20 m in about three seconds; a vehicle at urban speed closes four times that. ' +
      'Standoff distance, not reaction speed, is what buys a protective team its options: the working conclusion is always to increase distance and interpose a barrier, not to plan on out-reacting the threat.'
  });

  C.add({
    cat: 'ball', sub: 'safety', n: 'Sound, flash and standoff cues',
    d: 'Using flash-to-bang to locate a distant report',
    specs: [
      ['Sound in air, 15 °C', 340.3, 'speed'],
      ['Delay per 100 m', 0.29, 'none', 'seconds'],
      ['Delay per kilometre', 2.94, 'none', 'seconds']
    ],
    note: 'A muzzle flash or explosion seen and then heard gives the distance directly: about three seconds per kilometre. ' +
      'Supersonic rifle fire arrives as two sounds, the crack of the bullet passing and the bang of the muzzle; the gap between them grows with distance from the firing point, not from you. ' +
      'Use the Flash to bang tool for the calculation.'
  });

})();
