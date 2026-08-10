/*
 * Artemidos - catalogue: biological states and how long they take
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * This section answers one question in many forms: HOW LONG HAS THIS BEEN LIKE
 * THIS. A body, a room, a vehicle, a plate of food and a damp wall all keep
 * time, and each keeps it at a rate set mostly by TEMPERATURE and secondly by
 * HUMIDITY. Read together they say whether a place was left an hour ago or a
 * season ago, which is a question of safety before it is a question of anything
 * else: it tells you whether whoever left is still nearby.
 *
 * TEMPERATURE IS THE CLOCK RATE. Chemistry and biology roughly double in speed
 * for every 10 °C, so a stage that takes a day at 20 °C takes half a day at
 * 30 °C and two days at 10 °C. Near and below freezing almost everything stops;
 * above about 40 °C decay accelerates but drying can overtake it and preserve
 * instead. Every figure here is stated for a reference of 20 °C and the app's
 * calculator rescales it, because a single-number timeline is a lie.
 *
 * HUMIDITY DECIDES WHICH ROAD IS TAKEN. Wet and warm goes to putrefaction and
 * mould; dry and warm or dry and moving air goes to mummification, where a body
 * or a fruit dries faster than it rots and can then hold its state for a very
 * long time. Two rooms at the same temperature can therefore read decades apart.
 *
 * HONESTY. These are field estimate ranges from published forensic and food
 * science, not measurements of the thing in front of you. Real cases scatter
 * widely with clothing, burial, water, insects, body mass, air movement and
 * sunlight. Nothing here is a medical or legal determination; it is a way of
 * bounding a guess and knowing which way the error runs.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;
  var h = function (x) { return x; };            /* hours, kept explicit */

  C.cat({
    id: 'bio2', n: 'Biological & decay', icon: 'biohazard',
    d: 'How long since: bodies, food, mould, dust and abandonment',
    subs: [
      { id: 'pm', n: 'Post-mortem stages', icon: 'person', d: 'Pallor, algor, livor, rigor and beyond' },
      { id: 'decomp', n: 'Decomposition stages', icon: 'skull', d: 'Fresh to skeletal, and what changes the road' },
      { id: 'mould', n: 'Mould & damp', icon: 'physics', d: 'What grows, how fast, and what it says' },
      { id: 'food', n: 'Food & organic decay', icon: 'apple', d: 'Fruit, bread, milk, meat as a clock' },
      { id: 'abandon', n: 'Reading an abandoned place', icon: 'recon', d: 'Dust, webs, plants, batteries, rust' },
      { id: 'calc', n: 'Timeline calculator', icon: 'clock', d: 'Rescale any stage for temperature, water and humidity', ord: -5 }
    ]
  });

  /* Every stage carries its reference window at 20 °C. The calculator entry
     explains and applies the rescaling; the tables state the reference so a
     reader can do it in their head with the doubling rule. */
  function stage(sub, n, d, rows, note, ord) {
    C.add({
      cat: 'bio2', sub: sub, n: n, d: d, ord: ord,
      table: { plain: true, cols: ['Stage / sign', 'What it means'], rows: rows },
      note: note
    });
  }

  /* ── the calculator, first because it governs everything else ──────────── */

  C.add({
    cat: 'bio2', sub: 'calc', n: 'Timeline calculator',
    d: 'Rescale any published stage time for the real conditions',
    calc: 'biotime', ord: -5,
    note: 'Rates roughly double for every 10 °C rise (a Q10 of about 2). Enter the time a stage is said to take at its reference temperature and the temperature where you actually are, and this gives the adjusted window. Below about 4 °C treat everything as nearly stopped; below freezing, stopped. Above 35-40 °C in dry moving air, drying may beat decay and the timeline stops meaning anything.'
  });

  /* ── post-mortem stages ───────────────────────────────────────────────── */

  stage('pm', 'The four early signs, in order', 'Pallor, algor, livor, rigor', [
    ['Pallor mortis', 'Paleness as circulation stops. Begins within 15-30 minutes and is complete in about an hour. Only visible on pale skin, which limits its use.'],
    ['Algor mortis', 'Cooling. Roughly 0.8-1.0 °C lost per hour at first in still air near 20 °C, slowing as the body approaches the surroundings. The single most useful early clock, and the one most wrecked by wind, water and clothing.'],
    ['Livor mortis', 'Blood settles to the lowest parts: patches appear 20-30 min, obvious by 2 h, deepest 6-12 h. Blanches under pressure until about 8-12 h, then becomes fixed - a fixed pattern that does not match the position of the body means it was moved after that point.'],
    ['Rigor mortis', 'Stiffening: starts in the eyelids, jaw and neck at 2-6 h, full body by 6-12 h, holds 12-24 h, then passes off in the same order over 24-48 h. Cold delays it, heat and prior exertion hasten it.']
  ], 'These four run in parallel, not in sequence, and each is disturbed by something different: pallor by skin tone, algor by wind and water, livor by position and pressure, rigor by temperature and by what the person was doing beforehand. Agreement between two of them is worth far more than a confident reading of one. Reference figures assume a clothed adult in still air at about 20 °C.', -4);

  stage('pm', 'Algor mortis, hour by hour', 'Cooling at about 20 °C ambient', [
    ['0-1 h', 'Barely below normal. Body still warm to the touch, skin warm.'],
    ['1-3 h', 'Warm to slightly cool at the extremities, trunk still clearly warm.'],
    ['3-8 h', 'Cool hands and face, trunk cooling. Around 1 °C lost per hour.'],
    ['8-12 h', 'Cool to cold on the surface, trunk still measurably above ambient.'],
    ['12-24 h', 'Approaching ambient. The cooling clock is losing its resolution.'],
    ['Beyond 24 h', 'At ambient. Algor says nothing more; the decomposition stages take over.']
  ], 'Water carries heat away roughly twice as fast as air, and moving air far faster than still. A body in a cold stream can read hours older than it is; one under bedding or in a hot vehicle can read hours younger. Where the surface is warmer than the body, it warms instead and this clock reverses entirely.', -3);

  stage('pm', 'What disturbs the early clocks', 'Read the environment before the body', [
    ['Cold surroundings', 'All four signs slow. Rigor may be delayed for many hours and can be mistaken for a much more recent death.'],
    ['Heat', 'Rigor comes and goes faster; decomposition starts early and can overtake rigor entirely.'],
    ['Water', 'Cooling roughly doubles. Livor is often patchy. Skin changes (wrinkling, then loosening of the outer layer) give their own separate timeline.'],
    ['Clothing and covering', 'Insulates: slows cooling markedly. A covered trunk with cold hands is a common and misleading combination.'],
    ['Exertion or struggle before death', 'Rigor sets in noticeably faster, sometimes within an hour.'],
    ['Body mass', 'A larger body holds heat longer; a child cools far faster than an adult in the same room.'],
    ['Insect access', 'Open air with flies present moves the whole decomposition timeline forward sharply. A sealed room or a wrapped body slows it by a large factor.']
  ], 'This table is the reason a single figure is never given: each line can move an estimate by hours, and several together by a day. Where the signs disagree, prefer the one least disturbed by what you can see around you.', -2);

  /* ── decomposition ────────────────────────────────────────────────────── */

  stage('decomp', 'Fresh to skeletal', 'Reference: open air, around 20 °C, insects present', [
    ['Fresh, 0-2 days', 'Outwardly intact. Internal breakdown already under way, no smell at first, then faint.'],
    ['Bloat, 2-6 days', 'Gas from gut bacteria swells the abdomen and face; strong smell begins; skin discolours green then dark. The most recognisable stage at a distance, and the most misleading about identity.'],
    ['Active decay, 5-11 days', 'Bloat collapses, fluids released, the strongest smell, heavy insect activity. Most soft tissue mass is lost in this stage.'],
    ['Advanced decay, 10-25 days', 'Little soft tissue left, smell falling away, skin dried and leathery, insect activity declining.'],
    ['Dry / skeletal, 25+ days', 'Bone, dried tissue and hair. Timeline resolution collapses to seasons; bleaching, cracking and moss then take over as the clock.']
  ], 'Multiply the whole scale by roughly 2 for every 10 °C colder and divide by 2 for every 10 °C hotter. Then apply the big multipliers: buried at depth is 4-8x slower, submerged in cool water roughly 2x slower, sealed indoors without insects several times slower, and full sun in dry heat may skip most of it and mummify instead.', -3);

  stage('decomp', 'Which road: rot, dry or soap', 'The environment picks the outcome', [
    ['Putrefaction (wet, warm)', 'The standard road: bacteria and insects, the stages above. Needs moisture and moderate warmth.'],
    ['Mummification (dry, warm or windy)', 'Tissue dries faster than it rots: skin darkens, hardens, draws tight. Can begin within weeks in a hot dry loft, desert or ventilated space, and then hold for years to centuries - so a mummified state gives a MINIMUM age, not an age.'],
    ['Adipocere / grave wax (wet, cool, low oxygen)', 'Fat converts to a pale waxy substance. Starts within weeks to months in water, wet soil or sealed damp spaces, and preserves shape for a very long time.'],
    ['Frozen', 'Everything stops. The state is a snapshot from whenever the freeze began; on thaw it resumes fast.'],
    ['Scavenged', 'Animals scatter and remove remains and can strip a body to bone in days, destroying the sequence entirely. Tooth marks and disarticulation without the earlier stages point here.']
  ], 'Identifying the ROAD matters more than counting days, because three of these five roads stop the clock rather than run it. Mummification and adipocere in particular can make something months or years old look like the same state as something a few weeks old.', -2);


  /* ── in water ─────────────────────────────────────────────────────────────
     Water changes every clock in this section, and it is the environment most
     often read wrongly, because the land timeline is applied to a body that
     has not been on land. Two rules govern it:

     COOLING IS ROUGHLY TWICE AS FAST. Water carries heat away far better than
     air, so algor mortis runs quicker and a body in cold water reads much
     older than it is.

     DECAY IS ROUGHLY HALF AS FAST, and in cold water far slower still. The old
     working figure - one week in water equals two in air equals eight in soil
     - is crude but it is the right order. Salt water is slower again than
     fresh, and colder water slower than either.

     The two rules pull opposite ways, which is exactly why water is misread:
     a cold body with almost no decomposition is not necessarily a recent one. */

  stage('decomp', 'Decay in FRESH water', 'Rivers, lakes and ponds', [
    ['First hours', 'Cooling roughly twice as fast as in air. Skin of the hands and feet begins to wrinkle within 30 minutes to 2 hours in warm water, sooner in cold.'],
    ['12-24 h', 'Wrinkling of the palms and soles is marked. Livor is often patchy and unreliable because the body has been moving.'],
    ['2-4 days, warm water', 'Gases form; the body refloats face down, head and limbs hanging. In cold water this can take a week or much longer.'],
    ['4-10 days, warm', 'The outer skin of the hands loosens and can come away whole. Marked bloating of the face and abdomen. Green then dark discolouration.'],
    ['1-3 weeks', 'Advanced decomposition once refloated and exposed to air and insects, which then move at land speed. Submerged and cold, far slower.'],
    ['Weeks to months', 'Adipocere may begin to form in still, cool water - a firm, waxy, pale material that PRESERVES shape and can make a body look far more recent than it is.'],
    ['Months to years', 'Skeletonisation, usually with disarticulation: the current and scavengers separate the parts and scatter them downstream.']
  ], 'Fresh water is colder than most people assume even in summer, and stratified: the bottom of a lake may sit near 4 degrees all year. A body on the bottom of a deep lake can be preserved for a very long time and will not refloat at all if the water is cold enough to stop gas forming. Currents move a body a long way from where it entered, so where it is found is not where it went in.', 4);

  stage('decomp', 'Decay in SALT water', 'Sea and estuary', [
    ['First hours', 'Cooling as fast as fresh water or faster, since the sea is usually colder and always moving.'],
    ['1-3 days', 'Slower bacterial decay than fresh water: salt inhibits many of the organisms driving it.'],
    ['3-7 days, temperate sea', 'Refloating as gases form, later than in warm fresh water. In cold seas a body may never refloat.'],
    ['1-2 weeks', 'Marine scavengers become the dominant process rather than bacteria. Crustaceans and fish take exposed soft tissue - face, hands, any uncovered skin - first and fast.'],
    ['2-6 weeks', 'Extensive loss of exposed tissue while covered areas stay comparatively intact. This UNEVENNESS is the signature of the sea and is not an injury pattern.'],
    ['Months', 'Adipocere is common in cool sea water. Clothing and weighting decide what is preserved and what is lost.'],
    ['Months to years', 'Skeletonisation with heavy scattering by current and tide. Bones may be found many kilometres apart.']
  ], 'The sea removes tissue by SCAVENGING far more than by decomposition, and the two look nothing alike: scavenging is uneven, follows exposure, and leaves clean margins that are frequently mistaken for wounds. Salt water also slows bacterial decay, so a body recovered at sea can be simultaneously badly damaged and barely decomposed. Treat any assessment of time in the sea as much weaker than the equivalent on land, and never give a single figure.', 5);

  stage('decomp', 'Reading water cases: the traps', 'What water does to every other clock', [
    ['The two rules oppose each other', 'Cooling doubles, decay halves. A cold, intact body can still have been in the water a long time.'],
    ['Adipocere preserves', 'In cool, still, oxygen-poor water a waxy material forms that holds shape for months or years. It makes a body look far more recent than it is - the commonest large error in water cases.'],
    ['Refloating is a temperature clock', 'Warm water refloats a body in days, cold water in weeks, very cold water never. If it has not refloated, that is information.'],
    ['Scavenging is not injury', 'Fish and crustacean damage follows what was exposed, not what happened. Clean-edged tissue loss on the face and hands is expected, not evidence.'],
    ['Position moves', 'Current carries a body and rolls it; livor may be patchy, mixed or absent. Do not read position from livor in water.'],
    ['Insects restart the land clock', 'Once refloated and exposed, flies arrive and the ordinary land timeline begins from that moment, not from death.']
  ], 'Everything above is a reference band in typical conditions, not a measurement. Water depth, temperature, salinity, current, clothing and what lives in that water each move these figures by a large factor, and they compound. In water, prefer a wide honest range over any precise-sounding number.', 6);
  /* ── mould and damp ───────────────────────────────────────────────────── */

  stage('mould', 'Mould growth as a clock', 'On damp material at about 20 °C', [
    ['24-48 h', 'Germination on a wet surface. Nothing visible yet; a faint earthy smell may be the only sign.'],
    ['3-7 days', 'First visible specks and fine fuzz, usually white or grey, at the wettest point.'],
    ['1-3 weeks', 'Distinct colonies with colour: black, green, blue-green, orange. The smell is now obvious in a closed room.'],
    ['1-3 months', 'Colonies merge into patches, staining spreads into plaster, paper and fabric; wallpaper lifts, paint blisters.'],
    ['3-12 months', 'Structural staining, material softening, mushroom-type growth on constantly wet timber.'],
    ['Over a year', 'Deep staining, rot in timber, fruiting bodies. The room has been wet through at least one damp season.']
  ], 'Mould needs moisture above all: below about 60% relative humidity growth effectively stops, and it needs a wet surface to start. It roughly halves in time at 30 °C and stalls near 4 °C. So mould dates the WATER, not the abandonment: a dry abandoned room can look almost untouched for years, while an occupied bathroom can grow a colony in a fortnight.', -3);

  stage('mould', 'Reading damp in a building', 'What each sign says about how long', [
    ['Condensation only, no growth', 'Days. Ongoing moisture but the surface has not stayed wet long enough.'],
    ['Spot mould at window corners', 'Weeks of a heating season, or a fortnight of constant wet.'],
    ['Widespread surface mould', 'Months. Ventilation has been off and the space unheated.'],
    ['Peeling paint and lifted wallpaper', 'Several months to a year of sustained damp.'],
    ['Soft, spongy timber or plaster', 'A year or more, and a leak rather than condensation.'],
    ['Fungal fruiting bodies on timber', 'Multiple seasons. Serious, sustained water ingress.'],
    ['Salt bloom on masonry with no mould', 'Water has come and gone repeatedly and the surface dries between: often years, in a ventilated space.']
  ], 'A useful pairing: mould with dust on top of it means the water stopped and time passed afterwards; clean fresh mould on a dusty surface means water arrived recently in a place already abandoned. The order of the layers is the timeline.', -2);

  /* ── food and organic decay ───────────────────────────────────────────── */

  stage('food', 'Fruit and vegetables', 'Left out at about 20 °C', [
    ['Bananas', 'Yellow to spotted 2-4 days, brown 5-8 days, black and collapsing 1-2 weeks, dried or liquefied 3-6 weeks.'],
    ['Apples', 'Firm 1-2 weeks, wrinkled 3-5 weeks, brown soft spots 5-8 weeks, shrunken and leathery months.'],
    ['Bread', 'Stale 2-4 days, first visible mould 4-7 days, heavily colonised 2-3 weeks, dry and hard if the air is dry.'],
    ['Cut fruit', 'Browning within hours, wet and mouldy in 2-5 days, dried or liquefied in 1-3 weeks.'],
    ['Potatoes / onions', 'Sprouting 2-6 weeks, soft and wet-rotted 2-4 months in poor air, shrivelled and dry in dry air.'],
    ['Citrus', 'Firm 1-3 weeks, blue-green mould 2-4 weeks, then dries to a hard shrunken shell over months.']
  ], 'Food is often the best clock in an abandoned kitchen because the starting state is known. Cold roughly triples these times; a fridge that has lost power is a special case worth reading carefully, because its contents ran at fridge rate until the power went and at room rate afterwards.', -3);

  stage('food', 'Milk, meat and prepared food', 'Left out at about 20 °C', [
    ['Milk', 'Sour 8-24 h, curdled and separated 1-3 days, dried skin and mould on top within a week.'],
    ['Cooked food on a plate', 'Safe hours only. Visible mould 2-4 days, heavy growth within a week, then dries or liquefies depending on the air.'],
    ['Raw meat', 'Smell within hours, grey-green surface 1-2 days, strong odour and slime 2-4 days, then dries or is taken by insects.'],
    ['Tea or coffee in a cup', 'Surface film 1-2 days, mould 3-7 days, fully evaporated in 1-4 weeks leaving a dried ring - the ring alone means weeks at least.'],
    ['An open drink', 'Flat within a day, mould or fermentation smell in a few days, evaporated to a sticky residue in weeks.'],
    ['Sealed tinned food', 'No useful clock. Intact tins can outlast the building; only rust and bulging give a rough sense of years.']
  ], 'The best evidence is the DRIED state: a cup with a dried ring and no liquid, or a plate with food dried onto it, both put a floor of weeks under any estimate, and neither depends on remembering what was there before.', -2);

  /* ── reading an abandoned place ───────────────────────────────────────── */

  stage('abandon', 'Dust, webs and air', 'The clocks that need nothing but eyes', [
    ['No dust on flat surfaces', 'Days. Someone has been here or the space is sealed and still.'],
    ['Light even dust film', '1-4 weeks in a normal building.'],
    ['Dust visible as a layer, footprints hold', '1-6 months.'],
    ['Thick dust, drifts in corners', '6 months to a few years.'],
    ['Fresh spider webs, in use', 'Days to weeks. A tidy web with an occupant means recent, undisturbed calm.'],
    ['Old webs, dust-laden and abandoned', 'Months to years, and nobody has walked through that line.'],
    ['Stale, closed smell', 'Weeks with no ventilation.'],
    ['Insect and rodent droppings, sustained', 'Months of undisturbed occupation by them, which means none by people.']
  ], 'Dust is the most abused of these clocks: rate depends entirely on the building, the road outside, and whether windows are open or broken. Use it for RELATIVE reading - which room was entered last, which door has been opened, where a hand or a foot has been - rather than for absolute dates. A clear path through dust is the most useful single observation in an abandoned building.', -3);

  stage('abandon', 'Plants, water and metal', 'Longer clocks, in seasons and years', [
    ['Grass and weeds through a path or drive', 'One growing season gives shoots, two give established plants, three or more give woody stems.'],
    ['Saplings in gutters or floors', 'A tree of finger thickness in a gutter is several years; count rings on a cut stem for a hard figure.'],
    ['Leaf litter indoors', 'One autumn per distinct layer, where the opening has stayed open.'],
    ['Surface rust film on bare steel', 'Days to weeks in humid air, months in dry.'],
    ['Flaking rust, scale', 'Years of exposure.'],
    ['Rust-through, holes', 'Many years, or a wet salty environment for fewer.'],
    ['Leaked and dried batteries in a device', 'Commonly 2-10 years, depending on type and heat.'],
    ['Perished rubber, cracked seals and tyres', '5-15 years of air and light.'],
    ['Sun-faded plastics and paper', 'Noticeable in one summer at a window; heavy fading and brittleness in several years.']
  ], 'The long clocks are the reliable ones for abandonment because they run on the calendar rather than on the weather of one week. Where a short clock and a long clock disagree - fresh footprints in years of dust - the disagreement itself IS the finding: someone came back.', -2);

  stage('abandon', 'Putting it together', 'How to reason, not what to conclude', [
    ['Read layers, not items', 'Which is on top of which. Dust over mould, mould over dust, footprints over leaves: order gives sequence even when no single item gives a date.'],
    ['Find the fastest clock still running', 'The most recent event sets the shortest bound. Fresh mould, a wet ring, a warm surface: whoever left may still be close.'],
    ['Find the slowest clock consistent with everything', 'This gives the floor. A sapling or a dried cup cannot be faked into being recent.'],
    ['Look for the exception', 'One clean surface in a dusty room, one recent tread in old litter, one door that swings freely. Exceptions are people.'],
    ['State a range, never a number', 'Every figure here is a window, and windows widen with cold, cover and doubt. A range you can defend is worth more than a date you cannot.']
  ], 'The purpose of this whole section is a safety judgement more than a curiosity: knowing whether a place was left an hour ago or a year ago decides whether you are alone in it. When the clocks disagree, assume the most recent one is telling the truth and act accordingly.', -1);

})();
