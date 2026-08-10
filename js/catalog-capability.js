/*
 * Artemidos - catalogue: capability notes for military platforms
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Attached by id, like the optics and vision data. This is the material that
 * does not fit a specification row: protection, mobility limits, what the
 * platform is actually for, what it cannot do, and how it is deployed.
 *
 * The specification tables already give the numbers. What they do not give is
 * judgement, and a reference that lists a top speed without saying the
 * vehicle cannot cross a standard bridge, or a range without saying the
 * figure assumes a road, misleads by omission.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  function cap(id, fields) {
    var rec = C.item(id);
    if (!rec) { console.warn('Artemidos capability: no entry "' + id + '"'); return; }
    rec.capability = fields;
  }

  /* ── main battle tanks ────────────────────────────────────────────── */

  cap('mil-tank-m1a2-sepv3-abrams', {
    role: 'Heavy armoured manoeuvre, breakthrough and counter-attack',
    protection: 'Composite armour with depleted uranium mesh in the frontal arc. Blow-out panels vent an ammunition ' +
      'fire upward through the turret roof rather than into the crew compartment, which is the single biggest ' +
      'survivability difference from the Soviet autoloader layout. Trophy active protection on SEPv3 defeats ' +
      'incoming ATGM and RPG rounds before impact.',
    mobility: 'Gas turbine: very high power to weight, near-silent at idle to a listener but with a large thermal ' +
      'signature, and a fuel burn that continues whether moving or not. About 10 litres per kilometre cross-country.',
    limits: 'At 67 tonnes it exceeds the load class of many civilian bridges and most temporary military bridging ' +
      'below MLC70. It cannot be moved strategically without heavy equipment transporters or a C-17 per vehicle. ' +
      'Fuel consumption dominates every logistic plan built around it.',
    crew: 'Four: commander, gunner, loader, driver. A human loader sustains a higher rate of fire than an ' +
      'autoloader for the first minute and gives a fourth pair of eyes and hands for maintenance.',
    deployment: 'Fielded by the United States, Australia, Egypt, Iraq, Kuwait, Morocco, Poland, Saudi Arabia, Taiwan and Ukraine.'
  });

  cap('mil-tank-leopard-2a7', {
    role: 'Heavy armoured manoeuvre, with an explicit urban-operations fit',
    protection: 'Third-generation composite with modular add-on packages. The A7 adds all-round protection against ' +
      'RPG and IED, a remote weapon station so the commander need not expose himself, and a driver rear camera.',
    mobility: 'MTU diesel: far better fuel economy than a turbine and a smaller thermal signature, at some cost in ' +
      'power-to-weight and cold-start time.',
    limits: 'Same bridge and transport class problem as the Abrams. Deep fording to 4 m needs preparation and a snorkel, ' +
      'which is not a battlefield-speed activity.',
    crew: 'Four.',
    deployment: 'The most widely fielded Western tank: Germany, Austria, Canada, Chile, Denmark, Finland, Greece, ' +
      'Hungary, Indonesia, Netherlands, Norway, Poland, Portugal, Qatar, Singapore, Spain, Sweden, Switzerland, Türkiye and Ukraine.'
  });

  cap('mil-tank-challenger-2', {
    role: 'Heavy armoured manoeuvre, defensive gunnery emphasis',
    protection: 'Chobham/Dorchester composite, among the best-protected frontal arcs ever fielded. In the 2003 Iraq ' +
      'campaign one vehicle reportedly absorbed multiple RPG hits and an anti-tank missile without crew loss.',
    mobility: 'Comparatively underpowered at 19 hp per tonne, so it is slower cross-country than its contemporaries. ' +
      'Reliable and long-legged on roads.',
    limits: 'The rifled L30A1 gun uses two-part ammunition unique in NATO, so it cannot draw on allied stocks. ' +
      'This is the specific problem Challenger 3 exists to fix by adopting a smoothbore.',
    crew: 'Four.',
    deployment: 'United Kingdom, Oman and Ukraine.'
  });

  cap('mil-tank-t-90m-proryv', {
    role: 'Main battle tank, mass-manoeuvre doctrine',
    protection: 'Relikt explosive reactive armour, Shtora soft-kill jammer that disrupts semi-automatic command ' +
      'line-of-sight missile guidance, and cage screens added over the turret roof against top-attack munitions ' +
      'and drone-dropped grenades.',
    mobility: 'Light for its class at 48 tonnes, which is a genuine operational advantage: it crosses bridges and ' +
      'soft ground that stop a 67-tonne Western tank, and two fit on a rail flat where one Abrams does.',
    limits: 'Carousel autoloader stores propellant inside the crew compartment. A penetrating hit that reaches it ' +
      'detonates the whole load and removes the turret, which is the origin of the turret-toss images from recent ' +
      'conflicts. No blow-out panels. Five degrees of gun depression restricts reverse-slope fighting.',
    crew: 'Three: the autoloader replaces the loader. Fewer crew means less manpower for maintenance, sentry ' +
      'duty and recovery, which tells over a long deployment.',
    deployment: 'Russia, Algeria, Azerbaijan, India, Iraq, Syria, Türkiye, Uganda and Vietnam.'
  });

  cap('mil-tank-merkava-mk4-barak', {
    role: 'Main battle tank designed around crew survival and urban fighting',
    protection: 'Trophy active protection, the first such system to see sustained combat use. Modular armour ' +
      'replaceable in the field. The engine sits at the front, so an incoming round must pass through the ' +
      'powerpack before reaching the crew.',
    mobility: 'Adequate rather than exceptional. The design accepts a mobility penalty for protection.',
    limits: 'Heavy and configured for a specific theatre. The rear compartment reduces ammunition stowage compared ' +
      'with a conventional layout.',
    crew: 'Four, plus a rear compartment that carries six infantry or casualties, or additional ammunition. ' +
      'No other tank in service can evacuate wounded under armour.',
    deployment: 'Israel only.'
  });

  cap('mil-tank-t-14-armata', {
    role: 'Next-generation main battle tank, unmanned turret',
    protection: 'The three crew sit in an armoured capsule in the hull, separated from both the turret and the ' +
      'ammunition. Afghanit active protection with radar cueing. In principle the most survivable crew layout fielded.',
    mobility: 'High power to weight for a 55-tonne vehicle.',
    limits: 'Produced in very small numbers and not used in sustained combat. Cost per unit has been reported as the ' +
      'blocking issue. Crew awareness depends entirely on cameras and displays, so a sensor or power failure ' +
      'blinds the vehicle rather than merely degrading it.',
    crew: 'Three, all in the hull capsule.',
    deployment: 'Russia, limited numbers.'
  });

  cap('mil-tank-k2-black-panther', {
    role: 'Main battle tank optimised for Korean terrain',
    protection: 'Composite and explosive reactive armour, soft-kill active protection, and a millimetre-wave radar ' +
      'that cues the fire control automatically.',
    mobility: 'Hydropneumatic suspension pitches and rolls the hull, adding effective gun depression and letting it ' +
      'fight from positions a fixed-suspension tank cannot use. Fords to 4.1 m with a snorkel.',
    limits: 'Expensive per unit. The domestic powerpack programme had a long and public development difficulty.',
    crew: 'Three, with an autoloader.',
    deployment: 'South Korea, Poland, and on order elsewhere.'
  });

  cap('mil-tank-t-72b3m', {
    role: 'Upgraded mass-production main battle tank',
    protection: 'Kontakt-5 or Relikt reactive armour over a 1970s hull. Frontal protection is adequate against older ' +
      'threats and marginal against modern tandem-charge warheads and top-attack munitions.',
    mobility: 'Light, simple and easy to recover. Crosses ground and infrastructure that heavier tanks cannot.',
    limits: 'Same carousel autoloader vulnerability as the T-90. Sight generation behind Western equivalents, so it ' +
      'is at a disadvantage in a long-range engagement at night or in poor visibility.',
    crew: 'Three.',
    deployment: 'Very widely fielded across the former Soviet sphere, Africa, Asia and the Middle East.'
  });

  /* ── armoured vehicles ────────────────────────────────────────────── */

  cap('mil-afv-m2a4-bradley', {
    role: 'Infantry fighting vehicle: carry a squad, then fight alongside it',
    protection: 'Spaced laminate with explosive reactive armour packages. Proof against heavy machine gun fire and ' +
      'shell splinters across the frontal arc; vulnerable to modern ATGM and to RPG from the flanks.',
    mobility: 'Keeps pace with the Abrams, which is the requirement that shaped it.',
    limits: 'The aluminium hull burns and generates toxic smoke. Six dismounts is a small squad by modern standards.',
    crew: 'Three plus six dismounts.',
    deployment: 'United States, Saudi Arabia, Lebanon, Croatia, Greece and Ukraine.'
  });

  cap('mil-afv-cv90-mk-iv', {
    role: 'Infantry fighting vehicle, cold-weather and forested terrain origin',
    protection: 'Modular armour to STANAG level 6 in the frontal arc on later marks, with mine protection under hull ' +
      'and wheel, and a very low acoustic and thermal signature by design.',
    mobility: 'Exceptional soft-ground and snow performance. Wide tracks and low ground pressure.',
    limits: 'Expensive. Weight has grown substantially across marks as protection was added.',
    crew: 'Three plus eight dismounts.',
    deployment: 'Sweden, Denmark, Estonia, Finland, Netherlands, Norway, Switzerland, Slovakia, Czechia and Ukraine.'
  });

  cap('mil-afv-bmp-2', {
    role: 'Infantry fighting vehicle, mass-mechanised doctrine',
    protection: 'Very light. The hull stops rifle fire and splinters; the front resists heavy machine gun fire at ' +
      'range. Fuel is carried in the rear doors, which is a well-known and serious hazard.',
    mobility: 'Amphibious without preparation, low, light and air-transportable.',
    limits: 'Extremely cramped. Dismounts sit either side of a fuel tank under a low roof. The 30 mm cannot depress ' +
      'enough to engage close targets, and the ATGM must be loaded from outside the vehicle.',
    crew: 'Three plus seven dismounts.',
    deployment: 'Widely fielded across the former Soviet sphere, India, Africa and the Middle East.'
  });

  cap('mil-afv-namer', {
    role: 'Heavy armoured personnel carrier for high-threat urban ground',
    protection: 'Merkava-derived hull with Trophy active protection: the most heavily protected troop carrier in ' +
      'service anywhere, by a wide margin.',
    mobility: 'Tank mobility, tank logistic burden.',
    limits: 'Sixty tonnes to move nine infantry. That is a deliberate trade, not an oversight, and it is only ' +
      'affordable for a force fighting close to home.',
    crew: 'Three plus nine dismounts.',
    deployment: 'Israel only.'
  });

  cap('mil-afv-oshkosh-jltv', {
    role: 'Protected patrol and light tactical mobility, Humvee replacement',
    protection: 'MRAP-level blast and fragment protection in a vehicle that still fits a helicopter sling load and a ' +
      'C-130. That combination is the whole point of the programme.',
    mobility: 'Genuinely capable off-road, unlike most heavy MRAPs.',
    limits: 'Roughly three times the cost of the Humvee it replaces, and heavy enough that the payload penalty is real.',
    crew: 'Four typically.',
    deployment: 'United States, United Kingdom, Lithuania, Montenegro, North Macedonia, Slovenia and Ukraine.'
  });

  /* ── aircraft ─────────────────────────────────────────────────────── */

  cap('mil-milair-f-35a-lightning-ii', {
    role: 'Stealth multirole strike fighter and airborne sensor node',
    protection: 'Low observability across the frontal arc, plus the AN/AAQ-37 distributed aperture system giving ' +
      'spherical infrared coverage and missile-launch warning.',
    mobility: 'Subsonic-cruise aircraft with a single engine. Not a dogfighter by design: the intent is to see and ' +
      'shoot first and never be engaged.',
    limits: 'Stealth is frontal and degrades with external stores. Sustainment cost per flight hour is the ' +
      'programme persistent criticism. Availability rates have run below target across most operators.',
    crew: 'One.',
    deployment: 'United States and nineteen partner and customer nations.'
  });

  cap('mil-milair-a-10c-thunderbolt-ii', {
    role: 'Close air support and combat search and rescue escort',
    protection: 'Titanium armour bathtub around the cockpit, redundant hydraulic and manual reversion flight controls, ' +
      'self-sealing tanks and widely separated engines. Built to be hit and come home.',
    mobility: 'Slow, which is the point: it can loiter over troops and fly slowly enough to identify a target visually.',
    limits: 'Cannot survive in airspace covered by modern integrated air defence. Its whole employment model assumes ' +
      'air superiority and a permissive surface-to-air environment.',
    crew: 'One.',
    deployment: 'United States, in progressive retirement.'
  });

  cap('mil-milair-su-34-fullback', {
    role: 'Strike fighter-bomber',
    protection: 'Armoured cockpit tub, unusual for a strike aircraft, with side-by-side seating and a galley for ' +
      'long sorties.',
    mobility: 'Long range and a heavy payload.',
    limits: 'Large and not stealthy. Its combat employment has been dominated by standoff glide bombs precisely ' +
      'because it cannot safely overfly defended ground.',
    crew: 'Two, side by side.',
    deployment: 'Russia and Algeria.'
  });

  /* ── helicopters ──────────────────────────────────────────────────── */

  cap('mil-milheli-ah-64e-apache-guardian', {
    role: 'Attack helicopter and armed reconnaissance',
    protection: 'Crashworthy airframe and seats, self-sealing tanks, and blade tolerance to 23 mm hits. Armoured ' +
      'crew stations and a rotor system that keeps flying with substantial damage.',
    mobility: 'Can control unmanned aircraft from the cockpit on the E model, extending its sensor reach well beyond ' +
      'its own mast.',
    limits: 'Vulnerable to MANPADS and to modern short-range air defence, which is why it fights from behind terrain ' +
      'using the mast-mounted radar. High maintenance hours per flight hour.',
    crew: 'Two.',
    deployment: 'United States, United Kingdom, Egypt, Greece, India, Indonesia, Israel, Japan, Kuwait, Morocco, ' +
      'Netherlands, Qatar, Saudi Arabia, Singapore, South Korea, Taiwan and the UAE.'
  });

  cap('mil-milheli-ka-52-alligator', {
    role: 'Attack and reconnaissance helicopter',
    protection: 'Armoured cockpit and the only combat helicopter in service with ejection seats, achieved by ' +
      'blowing the coaxial rotor blades before the seat fires.',
    mobility: 'Coaxial rotors give no tail rotor to lose, a smaller footprint, and the ability to turn on the spot ' +
      'and fly sideways at speed.',
    limits: 'Complex and maintenance-heavy rotor system. Losses in recent conflict have been substantial against ' +
      'MANPADS.',
    crew: 'Two, side by side.',
    deployment: 'Russia, Egypt and Algeria.'
  });

  /* ── naval ────────────────────────────────────────────────────────── */

  cap('mil-navy-arleigh-burke-ddg-flight-iia', {
    role: 'Multi-mission destroyer: air defence, ballistic missile defence, strike and anti-submarine work',
    protection: 'All-steel construction after the aluminium superstructure fires of the Falklands and Belknap. ' +
      'Extensive compartmentation and damage control. No armour in the historic sense: survivability is layered ' +
      'defence, then damage control.',
    mobility: 'Gas turbines give rapid acceleration and a very high sustained speed for a ship of this size.',
    limits: 'The 96 vertical launch cells cannot be reloaded at sea, so a sustained air defence engagement is ' +
      'bounded by magazine depth and ends with a return to port. This is the central limitation of the class.',
    crew: 'About 320.',
    deployment: 'United States, with the design also serving as the basis for Japanese, South Korean and Spanish ships.'
  });

  cap('mil-navy-virginia-class-ssn', {
    role: 'Nuclear attack submarine: anti-submarine, anti-surface, land strike, intelligence and special operations',
    protection: 'Acoustic quieting is the protection. Detection is the only real threat, so hull coatings, raft-mounted ' +
      'machinery and pump-jet propulsion matter more than structure.',
    mobility: 'Effectively unlimited range and submerged endurance. Patrol length is bounded by food and crew fatigue.',
    limits: 'Very expensive and slow to build. The photonics mast and towed arrays are the sensor suite; there is no ' +
      'meaningful self-defence against air attack while surfaced.',
    crew: 'About 135.',
    deployment: 'United States.'
  });

  /* ── drones ───────────────────────────────────────────────────────── */

  cap('mil-uas-mq-9a-reaper', {
    role: 'Persistent armed reconnaissance and strike',
    protection: 'None. It is unarmed against air threats and unarmoured, and survives only in permissive airspace.',
    mobility: 'Twenty-seven hours on station transforms what reconnaissance means: it can watch a location through ' +
      'a full day and night cycle rather than sampling it.',
    limits: 'Slow, non-stealthy and dependent on a satellite link. Shot down repeatedly where opposed. ' +
      'The narrow sensor field of view is a soda straw: excellent detail, easy to lose context.',
    crew: 'Two on the ground: pilot and sensor operator, plus intelligence analysts.',
    deployment: 'United States, United Kingdom, France, Italy, Netherlands, Spain, Belgium, India and others.'
  });

  cap('mil-uas-bayraktar-tb2', {
    role: 'Medium-altitude armed reconnaissance at low cost',
    protection: 'None.',
    mobility: 'Twenty-seven hours endurance from a modest airframe, operable from short semi-prepared strips.',
    limits: 'Slow and easily engaged once an air defence network is intact and alert. Its striking successes came ' +
      'against forces whose short-range air defence had already been suppressed or was poorly handled.',
    crew: 'Three on the ground.',
    deployment: 'Türkiye and more than thirty export customers.'
  });

  cap('mil-uas-shahed-136-geran-2', {
    role: 'Long-range one-way attack munition against fixed targets',
    protection: 'None, and none needed: it is expendable by design.',
    mobility: 'Two and a half thousand kilometres on a piston engine and a delta wing costing a small fraction of ' +
      'any missile with comparable reach.',
    limits: 'Slow, loud and low, so it is detectable and interceptable. The problem it poses is economic rather than ' +
      'technical: the defending missile costs orders of magnitude more than the drone, so saturation wins on cost ' +
      'even when every one is shot down. Inertial and satellite navigation only, so it cannot find a moving target ' +
      'and is vulnerable to GNSS jamming.',
    crew: 'None.',
    deployment: 'Iran, Russia and Iranian-aligned groups.'
  });

})();
