/*
 * Artemidos - catalogue: unexploded ordnance and explosive hazards
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * RECOGNISE IT, DO NOT TOUCH IT, PUT DISTANCE AND MASS BETWEEN YOU AND IT,
 * MARK IT, REPORT IT.
 *
 * That is the whole of what a protection team, a driver or a traveller needs,
 * and it is the whole of what this section contains. Every entry answers three
 * questions: what does it look like, why is it still dangerous, and how far
 * back do you go. There is nothing here on rendering anything safe, on moving
 * anything, on fuze mechanisms or on disposal, because those belong to trained
 * EOD personnel with equipment and a chain of command, and a reference book on
 * a phone is not a substitute for either.
 *
 * WHY UNEXPLODED IS NOT SAFE. A munition that failed to function did so for a
 * reason you cannot see. Very often the fuze armed correctly and the firing
 * train stopped somewhere short, which leaves the thing in a MORE sensitive
 * state than it left the barrel in, not a less sensitive one. Age does not
 * settle it down; explosive fill degrades and some breakdown products are more
 * shock-sensitive than the original filling. A round that has sat in a field
 * for fifty years is not a round that has become safe over fifty years.
 *
 * SOURCES. Technical descriptions follow the open humanitarian mine-action
 * literature and published ordnance identification references, including
 * CAT-UXO, which is a public identification catalogue for exactly this
 * purpose. Figures for hazard distances follow the International Mine Action
 * Standards; where a national authority publishes different ones, theirs win.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  C.cat({
    id: 'uxo', n: 'UXO & explosive hazards', icon: 'uxo',
    d: 'Recognition, why it is still live, and how far to go back',
    subs: [
      { id: 'action', n: 'What to do', icon: 'shield', d: 'Immediate actions, distances, marking, reporting' },
      { id: 'bombs', n: 'Aircraft bombs', icon: 'plane', d: 'General purpose, dispensers, guided' },
      { id: 'proj', n: 'Artillery & mortar', icon: 'target', d: 'Shells, mortar bombs, tank rounds' },
      { id: 'rocket', n: 'Rockets & missiles', icon: 'missile', d: 'Artillery rockets, ATGM, MANPADS' },
      { id: 'sub', n: 'Submunitions', icon: 'warn', d: 'Cluster bomblets, the worst UXO problem there is' },
      { id: 'mine', n: 'Landmines', icon: 'warn', d: 'Anti-personnel and anti-vehicle' },
      { id: 'small', n: 'Grenades & small ordnance', icon: 'warn', d: 'Hand, rifle and launcher grenades' },
      { id: 'drone', n: 'Drone-dropped munitions', icon: 'drone', d: 'Improvised and purpose-built air-drop stores' },
      { id: 'ied', n: 'IED & booby traps', icon: 'warn', d: 'Victim-operated devices and indicators' }
    ]
  });

  function u(sub, n, d, specs, rows, note, ord) {
    C.add({
      cat: 'uxo', sub: sub, n: n, d: d, ord: ord,
      specs: specs || [],
      table: rows ? { plain: true, cols: ['Feature', 'What you see'], rows: rows } : null,
      note: note
    });
  }

  /* ══ what to do ═══════════════════════════════════════════════════════ */

  u('action', 'The five actions, in order', 'Everything else is detail',
    [['Minimum distance, anything small', 100, 'dist', 'grenade, submunition, mortar bomb'],
     ['Minimum distance, artillery or larger', 300, 'dist'],
     ['Minimum distance, aircraft bomb', 1000, 'dist'],
     ['Distance that halves the risk', 2, 'none', 'doubling it quarters the blast overpressure']],
    [['1. STOP', 'Stop moving the moment you recognise it. Do not take another step toward it, and do not step sideways: if there is one there may be more, and you arrived by a route that was safe.'],
     ['2. DO NOT TOUCH', 'Not to move it, not to turn it over, not to photograph it closer. Most casualties among civilians are people who picked something up.'],
     ['3. WITHDRAW ON YOUR OWN TRACKS', 'Go back exactly the way you came, step for step. Do not take a shortcut out.'],
     ['4. MARK AND CORDON', 'Mark from a distance so the next person stops where you stopped. Anything visible will do: stones in a line, a cloth on a stick, tape, a vehicle across the approach.'],
     ['5. REPORT', 'To the national mine action authority, police or military. Give a grid or a dropped pin, a description and a photograph taken from where you stopped.'],
     ['What never to do', 'Do not throw anything at it, do not burn ground near it, do not use a radio transmitter right beside it, and do not let anyone collect it for scrap.']],
    'The distances above are minimum evacuation, not safe distances for working. They assume you are behind something solid or lying down. Doubling your distance quarters the blast pressure, which is why the first hundred metres matter more than the next four hundred. A cordon that keeps people away is worth more than any identification you make: you do not need to know what it is to know that nobody should be near it.', 1);

  u('action', 'Recognising ground that has ordnance in it', 'Read the area before you walk into it',
    null,
    [['Craters, in a pattern', 'Artillery and rockets arrive in groups. One crater means look for others, and a line of them means a fire mission with a dud rate somewhere in it.'],
     ['Empty packaging and tubes', 'Discarded launch tubes, fibre containers, wooden crates, cardboard fin sleeves. Ordnance was used here or stored here.'],
     ['Fins, tail units, casing fragments', 'A tail fin lying free often means the body is somewhere close and buried.'],
     ['Disturbed earth in a line or grid', 'Mines are laid to a pattern. Regular spacing in ground nobody farms is a warning by itself.'],
     ['Local marks you did not put there', 'Painted rocks, crossed sticks, plastic bottles on posts, red cloth. Communities mark what they know about, and the marks are not standard.'],
     ['Dead livestock, no obvious cause', 'A recurring first indicator of a mined field or verge.'],
     ['Ground avoided by locals', 'A worn path that suddenly detours, a field left unfarmed while its neighbours are worked. Watch what people do, not what they say.'],
     ['Abandoned positions', 'Trenches, berms, firing points. Booby traps and left ordnance concentrate where troops lived.'],
     ['Rubble in a struck building', 'Ordnance that failed can be under the collapse, and moving rubble is how it gets found.']],
    'The strongest single indicator is other people. Stay on surfaces in daily use: metalled roads, worn footpaths, ground that vehicles cross. Verges, ditches, shortcuts, shade under a tree, and the convenient gap in a wall are exactly where devices are laid and where clearance stops.', 2);

  u('action', 'If you are in ground you now think is mined', 'Getting out without adding a casualty',
    null,
    [['Stop where you are', 'Do not turn round on the spot. Standing still costs nothing.'],
     ['Look down and behind', 'Find your own prints or the marks of your tyres. That ground has already taken your weight.'],
     ['Go out on the same tracks', 'Step in your own footprints, walking backwards if you must, and keep others behind you on the same line.'],
     ['One person moves at a time', 'Everyone else stays still and watches. Never bunch up.'],
     ['Do not go back for anything', 'Not equipment, not a vehicle, not a dropped bag.'],
     ['If someone is injured inside', 'Do not run in. That is how the second and third casualties happen. Talk to them, keep them still, and wait for people with detectors and a cleared lane.'],
     ['In a vehicle', 'Stop, stay in it, reverse out along your own tyre tracks if the ground behind is proven, otherwise wait. A vehicle gives real protection against fragments.']],
    'The instinct to help immediately is what kills rescuers in a mined area, and it is the hardest thing on this page to override. Someone hurt inside a minefield needs a cleared lane to them, and the minutes that takes are survivable far more often than a second blast is.', 3);

  /* ══ aircraft bombs ═══════════════════════════════════════════════════ */

  u('bombs', 'General purpose aircraft bomb', 'The largest thing you will meet, and often buried',
    [['Typical mass', 250, 'mass', 'ranging 100 to 1000 kg'],
     ['Body length', 2.4, 'length', 'typical for 500 kg class'],
     ['Minimum evacuation', 1000, 'dist'],
     ['Depth when it fails to function', 8, 'length', 'commonly buried metres down']],
    [['Shape', 'A thick cylinder with a rounded or ogive nose and a boat-tailed rear, fins at the back, lugs on top for the aircraft rack.'],
     ['Size', 'Waist high and as long as a car is wide. It cannot be mistaken for anything else.'],
     ['Colour', 'Olive, grey or rust. Yellow or brown bands are filling markings; stencilled numbers run along the body.'],
     ['How you usually find it', 'Not lying in the open. It arrives fast, buries itself and leaves a small entry hole with no crater, so it turns up during excavation, piling or ploughing.'],
     ['Why still dangerous', 'It failed for a reason: often a fuze that armed and did not fire. Some are fitted with delay or anti-disturbance fuzing, which is designed to function later or when moved.'],
     ['Distance', 'A kilometre, and further from windows. This is a scale of blast where a wall matters more than metres.']],
    'A buried bomb is a construction-site problem far more often than a battlefield one, decades after the war that dropped it. Any unexpected large metal object found while digging in a formerly bombed area stops the work: nobody clears it, nobody touches it, everyone leaves and the authority is called.');

  u('bombs', 'Cluster bomb dispenser', 'The empty container is the warning',
    [['Submunitions carried', 200, 'none', 'commonly 40 to 650'],
     ['Footprint of one dispenser', 300, 'dist', 'diameter, wind and height dependent'],
     ['Expected failure rate', 20, 'none', '% of submunitions, often far higher in soft ground'],
     ['Minimum evacuation', 300, 'dist']],
    [['Shape', 'A long thin canister that opens along its length or unscrews at the nose, often found split in two halves.'],
     ['What it means', 'A dispenser on the ground means its contents are on the ground too, spread over an area the size of several football pitches.'],
     ['What to look for next', 'Small objects, tens to hundreds of them, in a rough ellipse downwind of the dispenser.'],
     ['Why it matters most', 'This is the highest-density UXO problem there is. One dispenser can leave a hundred live bomblets across ground people walk and farm.']],
    'Finding an empty dispenser is not the end of an incident, it is the beginning of one. The area it served has to be treated as contaminated until it is surveyed, and that area is much larger than the place the dispenser landed.');

  /* ══ artillery and mortar ═════════════════════════════════════════════ */

  u('proj', 'Artillery projectile', '105, 122, 152 and 155 mm',
    [['Body diameter', 0.155, 'length', 'the calibre is the diameter'],
     ['Length', 0.8, 'length', 'typical for 155 mm HE'],
     ['Mass', 43, 'mass', '155 mm HE'],
     ['Minimum evacuation', 300, 'dist'],
     ['Fragment travel', 1000, 'dist', 'occasional fragments go much further']],
    [['Shape', 'A pointed cylinder with a driving band, a copper or plastic ring, around the body near the base. That band is the giveaway: only a gun-fired projectile has one.'],
     ['Nose', 'A screwed-in fuze, often a different metal from the body. If the nose looks like a separate machined part, treat it as a live fuze.'],
     ['Colour', 'Olive drab or grey for high explosive, with painted bands and stencilled markings. White or blue can mean practice or smoke, and cannot be relied on.'],
     ['State when found', 'Often partly buried at the end of a shallow furrow, nose down, with the base and driving band showing.'],
     ['Why still dangerous', 'Spin-armed fuzes that failed to function are frequently fully armed and now sensitive to movement.'],
     ['Distance', '300 m minimum, and behind cover. Fragments from a 155 travel far past that.']]);

  u('proj', 'Mortar bomb', '60, 82 and 120 mm',
    [['Body diameter', 0.082, 'length', 'common medium calibre'],
     ['Mass', 3.2, 'mass', '82 mm'],
     ['Minimum evacuation', 200, 'dist'],
     ['Fragment travel', 300, 'dist']],
    [['Shape', 'Teardrop or bulbous body, a clear tail boom with fins, and a fuze in the nose. It looks like a small finned bomb because that is what it is.'],
     ['Size', 'From a large carrot to a fire extinguisher, depending on calibre.'],
     ['State when found', 'Very commonly tail-up in soft ground, nose buried, which puts the fuze underground and out of sight.'],
     ['Why still dangerous', 'Mortar fuzes arm within metres of the muzzle. A dud is an armed device that stopped in the middle of the sequence.'],
     ['Confusable with', 'Nothing else. The fin assembly is unmistakable.'],
     ['Distance', '200 m minimum and get behind something.']],
    'The most common single item of UXO in most contaminated ground, because mortars are fired in quantity from improvised positions and their dud rate is high.');

  u('proj', 'Tank and recoilless gun round', 'Shaped charge or kinetic penetrator',
    [['Body diameter', 0.1, 'length', 'typical 100 to 125 mm'],
     ['Minimum evacuation', 300, 'dist'],
     ['Standoff hazard', 30, 'dist', 'shaped charge jet, forward of the nose']],
    [['Shape', 'A slim projectile, often with a long thin nose probe standing well forward of the body on a shaped-charge round.'],
     ['Distinctive part', 'That nose probe. It exists to set off the charge at the right distance and it is fragile and sensitive.'],
     ['Kinetic rounds', 'A long dart with fins at the back, sometimes with plastic sabot petals lying separately nearby. The dart itself is inert but the propellant case may not be.'],
     ['Why still dangerous', 'A shaped charge fires its jet forward. Standing in front of a resting round is the worst place to be even at some distance.'],
     ['Distance', '300 m, and never approach from the nose.']]);

  /* ══ rockets ══════════════════════════════════════════════════════════ */

  u('rocket', 'Artillery rocket', 'Grad, Uragan, Smerch, HIMARS class',
    [['Body diameter', 0.122, 'length', '122 mm Grad'],
     ['Length', 2.9, 'length', '122 mm'],
     ['Minimum evacuation', 400, 'dist'],
     ['Rounds per salvo', 40, 'none', 'one Grad vehicle']],
    [['Shape', 'A long tube in two obvious parts: warhead at the front, motor behind, with fins that spring out at the tail.'],
     ['State when found', 'Very often standing at an angle out of the ground, or lying whole on the surface, because the motor keeps it flying flat and it lands shallow.'],
     ['Numbers', 'Never one. They are fired in salvos of dozens, so where there is one failure there are usually several across the same footprint.'],
     ['Why still dangerous', 'Both ends. The warhead may be armed, and unburnt propellant in the motor will burn fiercely and can still throw the rocket.'],
     ['Distance', '400 m. Treat a rocket lying on the surface as more hazardous than a buried shell, not less, because it can move.']]);

  u('rocket', 'Anti-tank guided missile', 'Fired, failed, and lying with the warhead armed',
    [['Length', 1.2, 'length'],
     ['Minimum evacuation', 300, 'dist'],
     ['Standoff hazard', 50, 'dist', 'shaped charge jet, forward of the nose']],
    [['Shape', 'A slim tube with fins or wings that unfold, often with trailing guidance wire on older types.'],
     ['Trailing wire', 'A fine wire running back from the missile across the ground is a strong indicator, and following it leads to the firing position, not away from danger.'],
     ['Why still dangerous', 'The warhead arms shortly after launch. A missile that struck and did not fire is armed and has already been through an impact.'],
     ['Distance', '300 m and never from in front.']]);

  u('rocket', 'MANPADS missile', 'Shoulder-launched surface-to-air',
    [['Length', 1.5, 'length'],
     ['Minimum evacuation', 200, 'dist']],
    [['Shape', 'A slim missile with small forward fins, usually found with or near its launch tube.'],
     ['State when found', 'Often unfired inside a tube, which is a weapon rather than UXO and a serious security matter as well as a safety one.'],
     ['Why it matters beyond safety', 'A serviceable MANPADS in uncontrolled hands is a threat to civil aviation. Finding one is reported urgently and to the authorities, not handled.'],
     ['Distance', '200 m, and report it as a weapon, not as debris.']]);

  /* ══ submunitions ═════════════════════════════════════════════════════ */

  u('sub', 'Submunition, general', 'Small, numerous, sensitive, and often picked up',
    [['Typical size', 0.08, 'length', 'a tennis ball to a soft-drink can'],
     ['Failure rate', 20, 'none', '% typical, up to 40 in soft or wooded ground'],
     ['Minimum evacuation', 100, 'dist'],
     ['Number from one dispenser', 200, 'none']],
    [['Shape', 'Small. A ball, a squat cylinder, a can with a ribbon or a small parachute, or a dart with fins.'],
     ['The ribbon or streamer', 'A short nylon ribbon, a fabric tail or a small drogue attached to a fist-sized object is close to diagnostic of a submunition.'],
     ['Colour', 'Frequently bright: white, orange, yellow, olive. Some are the size and shape of a toy and this is why children are so heavily represented in the casualties.'],
     ['Where they are', 'On the surface, in trees, on roofs, in gutters, in undergrowth. They do not bury themselves the way a shell does.'],
     ['Why still dangerous', 'A submunition that failed to function on impact is armed and its fuze has already been through the shock it was meant to fire on. They are among the most sensitive UXO there is.'],
     ['Distance', '100 m minimum, and never move one for any reason.']],
    'If you take one thing from this section: a small, brightly coloured object with a ribbon on it, lying in ground that has been shelled, is not a curiosity and not a souvenir. Nothing about it is safe to lift, and lifting is exactly what its fuze is now waiting for.');

  u('sub', 'PTAB and dual-purpose bomblets', 'Shaped charge and fragmentation in one',
    [['Body length', 0.2, 'length'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'A small cylinder with a conical nose and four folding fins, or a can with a nylon ribbon at the top.'],
     ['Purpose', 'A shaped charge for armour plus a fragmenting case for people, which is why the standoff to the front matters as well as the fragments all round.'],
     ['State when found', 'On the surface, often in numbers, sometimes hanging in vegetation.'],
     ['Distance', '100 m, and do not approach from directly in front of the nose.']]);

  u('sub', 'Ball and cylinder bomblets', 'The ones mistaken for objects',
    [['Diameter', 0.06, 'length'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'Roughly spherical or a short can, sometimes with raised bands, sometimes smooth.'],
     ['Colour', 'Often bright yellow, white or olive.'],
     ['The confusion that kills', 'Some resemble drinks cans, food tins or toys closely enough that they have been carried home. In several conflicts food aid packaging shared a colour with the bomblets falling on the same ground.'],
     ['Distance', '100 m. Tell children in the area what they look like, because they are the ones who find them.']]);

  /* ══ mines ════════════════════════════════════════════════════════════ */

  u('mine', 'Anti-personnel blast mine', 'Small, plastic, buried just under the surface',
    [['Diameter', 0.11, 'length', 'PMN class'],
     ['Explosive fill', 0.24, 'mass'],
     ['Operating pressure', 8, 'none', 'kg, roughly a footstep'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'A squat plastic or bakelite cylinder like a large tin of shoe polish, with a rubber or ribbed pressure plate on top.'],
     ['Size', 'Palm to saucer sized.'],
     ['Colour', 'Brown, green, black, sand. Made to disappear against soil.'],
     ['Where laid', 'Verges, ditches, tracks, the shade beside a path, doorways, riverbanks, and the convenient gap in a wall or hedge.'],
     ['Detectability', 'Mostly plastic, so a metal detector may find only the striker. Do not assume a swept area is clear unless a mine action organisation cleared it.'],
     ['Why still dangerous', 'It is not a dud. It is working exactly as designed and waiting, and it will wait for decades.'],
     ['Distance', '100 m, and get out on your own tracks.']]);

  u('mine', 'Scatterable anti-personnel mine', 'Delivered by rocket or aircraft, lying on the surface',
    [['Length', 0.12, 'length', 'PFM-1 class'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'The best known is a small flat plastic body with a wing, which is where the name butterfly mine comes from. Others are small cylinders with spring arms or trip wires that deploy on landing.'],
     ['Colour', 'Green, brown, or a translucent white that shows against soil and disappears in snow and leaf litter.'],
     ['Where they are', 'On the surface, scattered in hundreds over an area, unmarked and unmapped by anyone.'],
     ['The specific danger', 'The shape is genuinely toy-like and they lie in the open where they are seen and reached for. Injuries are typically to the hand and face for that reason.'],
     ['Trip wires', 'Some types throw out fine wires on landing. A thin wire at ankle or shin height across a path is a stop signal, not something to step over.'],
     ['Distance', '100 m out on your own tracks, and mark the approach so nobody else walks in.']]);

  u('mine', 'Directional fragmentation mine', 'Command or victim operated, above ground',
    [['Fragment arc', 60, 'none', 'degrees'],
     ['Lethal range, front', 50, 'dist'],
     ['Danger area, rear and sides', 100, 'dist'],
     ['Minimum evacuation', 300, 'dist']],
    [['Shape', 'A curved rectangular box on small folding legs or a spike, sometimes clamped to a tree or post, with a front face that is usually marked.'],
     ['How it is set', 'Aimed along a path, a track, a doorway or a gateway. It is placed to cover a route somebody is expected to use.'],
     ['Initiation', 'Either a wire back to a firing point, or trip wires across the covered approach, or both.'],
     ['Danger behind it', 'The back blast is dangerous too. Being behind one is safer than in front, not safe.'],
     ['Distance', '300 m, and never walk the route it is covering.']]);

  u('mine', 'Anti-vehicle mine', 'Big, buried, and set for a vehicle not a person',
    [['Diameter', 0.32, 'length'],
     ['Explosive fill', 7.5, 'mass'],
     ['Operating pressure', 180, 'none', 'kg, a vehicle wheel or track'],
     ['Minimum evacuation', 300, 'dist']],
    [['Shape', 'A large flat cylinder, like a heavy cake tin, with a fuze well in the centre and a carrying handle.'],
     ['Where laid', 'Road surfaces, verges, unpaved crossings, culverts, fords, and the entrance to any diversion.'],
     ['The trap around it', 'Anti-vehicle mines are commonly laid with anti-personnel mines or anti-handling devices around them, so the ground around a found mine is more dangerous, not less.'],
     ['Why the road matters', 'A vehicle that stops for an obstacle in the road is often stopping exactly where the device is intended to catch it. An unexplained obstruction on an isolated road is a reason to reverse out, not to get out and move it.'],
     ['Distance', '300 m and clear the road behind you.']],
    'For anyone driving in a contaminated area this is the entry that matters. Stay on hard surface in daily use, do not take the smooth verge to pass an obstruction, do not be the first vehicle of the morning on a rural road, and treat every unexplained obstacle as a stopping point rather than a problem to clear.');

  /* ══ grenades and small ordnance ══════════════════════════════════════ */

  u('small', 'Hand grenade', 'Small, common, and frequently found in old positions',
    [['Body length', 0.09, 'length'],
     ['Lethal radius', 5, 'dist'],
     ['Casualty radius', 15, 'dist'],
     ['Fragment travel', 230, 'dist'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'An egg or a segmented ball with a lever and a ring on top, or a smooth can on a wooden handle.'],
     ['State when found', 'In abandoned positions, in caches, in rubble. Sometimes with the pin already out and the lever held by the surroundings, which is the worst case and invisible until something is moved.'],
     ['Why still dangerous', 'A grenade with the pin removed is being restrained by whatever it is resting in. Lifting the object it is under releases it.'],
     ['Distance', '100 m, and do not disturb the rubble or the container it sits in.']]);

  u('small', 'Launcher grenade', '40 mm and VOG series',
    [['Diameter', 0.04, 'length'],
     ['Minimum arming range', 25, 'dist', 'closer than this it did not arm'],
     ['Minimum evacuation', 100, 'dist']],
    [['Shape', 'A small gold, olive or black cylinder with a domed or pointed nose, about the size of a large thumb.'],
     ['Why so many', 'Fired in quantity and small enough to be lost in vegetation, they are among the most numerous items found.'],
     ['State when found', 'On the surface, in undergrowth, in gutters and drains.'],
     ['The mistake', 'They are small and look like inert brass or a curiosity. They are neither.'],
     ['Distance', '100 m.']]);

  /* ══ drone-dropped ════════════════════════════════════════════════════ */

  u('drone', 'Drone-dropped munition', 'Improvised, small, and increasingly what you find',
    [['Typical mass', 1, 'mass', 'from 200 g to several kg'],
     ['Minimum evacuation', 200, 'dist']],
    [['Shape', 'Very varied and often obviously improvised: a mortar bomb or grenade with a plastic-bottle tail, a 3D-printed fin unit, a shuttlecock of tape, a length of ribbon.'],
     ['The tail is the clue', 'Anything explosive with a home-made tail or fin assembly taped or printed on was almost certainly dropped from a small drone.'],
     ['Where they are', 'On roads, in vehicle wrecks, in courtyards, on roofs. They are aimed at specific things rather than scattered over areas.'],
     ['Why still dangerous', 'The fuzing is often improvised, sometimes a modified grenade fuze, and sometimes there is no real arming delay at all. Improvised fuzing is less predictable than a factory item, not more.'],
     ['A specific trap', 'Some are dropped and deliberately left to catch whoever comes to look at the first strike. Do not gather at a fresh impact.'],
     ['Distance', '200 m, and do not be part of a crowd at a strike site.']],
    'This is now among the most commonly encountered categories in active conflict areas, and the least standardised. If it looks improvised, assume the fuzing is too, and give it more room rather than less.');

  /* ══ IED ══════════════════════════════════════════════════════════════ */

  u('ied', 'Victim-operated device', 'It is aimed at whoever comes next',
    [['Minimum evacuation, person-borne or small', 100, 'dist'],
     ['Minimum evacuation, vehicle-borne', 400, 'dist'],
     ['Minimum evacuation, large vehicle', 800, 'dist']],
    [['Command wire', 'A wire running away from an object toward cover. Following it is exactly wrong: it leads to the person holding the switch.'],
     ['Trip wire', 'Fishing line, fine wire or cord at ankle, shin or chest height across a path, a doorway, a stairwell or a gap in a wall.'],
     ['Pressure plate', 'A slight rise or a board in a track, a rug or mat somewhere odd, fresh fill in a pothole.'],
     ['Bait', 'A weapon, a radio, a phone, a valuable item, a body, left in the open. Anything that invites a hand is a switch.'],
     ['Containers', 'Boxes, bags, drums, gas cylinders, culverts and animal carcasses at the roadside, particularly at a choke point where traffic must slow.'],
     ['The second device', 'Placed to catch responders, at the obvious cordon position, the obvious approach, and the obvious place to park. Do not use the obvious one.'],
     ['Signs of work', 'Fresh digging, new concrete, disturbed verge, cut vegetation, wires or batteries discarded nearby.']],
    'The pattern that matters for a protection team is the choke point: anywhere your route is forced to slow, narrow or stop is where a device is placed, because it does not have to be accurate if you have to be there. Vary routes and timings, do not stop at the convenient place, and treat an unexplained obstruction as an ambush indicator rather than an inconvenience.');

  u('ied', 'At a scene, or after a first blast', 'The rules that keep responders alive',
    null,
    [['Do not converge', 'The single most reliable way to be caught by a second device is to gather where everyone gathers.'],
     ['Pick an unobvious cordon', 'Stand where a planner would not have expected a cordon to form.'],
     ['Clear your own ground first', 'Look at what is under and around you before you settle anywhere, including the vehicle you park.'],
     ['Watch for the camera', 'Devices are frequently fired on observation. Someone filming from a fixed position, phones raised before anything happened, a vehicle that stays.'],
     ['Do not move debris to search', 'Whatever is under it may be the point.'],
     ['Leave by a different route', 'Arriving and leaving on the same line is what makes the return trip predictable.']],
    'Everything on this page is about not becoming the second incident, and the second incident is deliberately designed, which means it is aimed at the behaviour responders are trained to show.');

})();
