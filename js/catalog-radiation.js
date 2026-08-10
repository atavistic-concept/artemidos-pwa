/*
 * Artemidos - catalogue: radiation, shielding and isotopes
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT STOPS WHAT, AND HOW THICK IT HAS TO BE.
 *
 * This is the radiological equivalent of the cover-versus-concealment table:
 * the same failure mode, where something that feels protective is not.
 *
 * Shielding thicknesses are quoted as HALF-VALUE LAYER (HVL) and
 * TENTH-VALUE LAYER (TVL) because attenuation is exponential, not linear.
 * One HVL halves the dose rate, two HVLs quarter it, ten HVLs cut it by about
 * a thousand. There is no thickness that reduces gamma to zero, which is the
 * single most important thing to understand here: you buy orders of
 * magnitude, not absolutes.
 *
 * Alpha and beta behave differently: they have a definite RANGE and are
 * genuinely stopped, so those are quoted as a stopping thickness.
 *
 * Neutrons are stopped by hydrogen, not by density, which is why water and
 * polyethylene beat lead and why lead alone is the wrong answer for a
 * neutron source.
 *
 * NOTHING HERE IS OPERATIONAL GUIDANCE. Time, distance and shielding in that
 * order, and a real survey meter, are what actually govern a radiological
 * incident. These are reference figures for understanding and planning, and
 * anyone facing a genuine source needs qualified radiation protection advice.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  C.cat({
    id: 'rad', n: 'Radiation & shielding', icon: 'trefoil',
    d: 'Radiation types, what blocks them, how thick, and by isotope',
    subs: [
      { id: 'types', n: 'Radiation types', icon: 'warn', d: 'Alpha, beta, gamma, neutron, X-ray' },
      { id: 'shield', n: 'Shielding materials', icon: 'shield', d: 'Half and tenth-value layers by material' },
      { id: 'isotope', n: 'By isotope', icon: 'physics', d: 'Caesium, cobalt, plutonium, uranium and others' },
      { id: 'dose', n: 'Dose reference', icon: 'stats', d: 'What a given dose actually means' },
      /* populated in catalog-cbrn.js, which loads after this file */
      { id: 'treat', n: 'Exposure & treatment', icon: 'ambulance', d: 'Decontamination, potassium iodide, triage' }
    ]
  });

  /* ── radiation types ──────────────────────────────────────────────── */

  function typeRec(n, d, speeds, specs, rows, note) {
    C.add({
      cat: 'rad', sub: 'types', n: n, d: d,
      speeds: speeds, specs: specs,
      table: rows ? { cols: ['Stopped by', 'Thickness needed'], rows: rows } : null,
      note: note
    });
  }

  typeRec('Alpha particle', 'Helium nucleus, +2 charge, heavy',
    [['Typical emission speed', 1.5e7]],
    [['Range in air', 0.04, 'length'],
     ['Range in tissue', 0.00005, 'length'],
     ['Typical energy', 5, 'none', 'MeV'],
     ['Relative biological weighting', 20, 'none', 'w_R, versus 1 for beta and gamma']],
    [['A sheet of paper', 'Stopped completely'],
     ['The dead outer layer of skin', 'Stopped completely'],
     ['Air', 'Stopped within 40 mm'],
     ['Any clothing', 'Stopped completely']],
    'Harmless outside the body and lethal inside it. Alpha cannot penetrate skin, so an external source is not a ' +
    'whole-body hazard, but inhaled or ingested it deposits all of its energy in a tiny volume of living tissue, ' +
    'and its biological weighting is twenty times that of gamma. Contamination control, not shielding, is the ' +
    'entire problem with an alpha emitter.');

  typeRec('Beta particle', 'Electron or positron, light, fast',
    [['Typical emission speed', 2.7e8]],
    [['Range in air', 3, 'length', 'per MeV, approximately'],
     ['Range in tissue', 0.005, 'length'],
     ['Range in aluminium', 0.002, 'length'],
     ['Typical energy', 1, 'none', 'MeV']],
    [['Aluminium, 3 mm', 'Stopped for energies up to about 1.5 MeV'],
     ['Perspex or plastic, 10 mm', 'Stopped, and preferred over metal'],
     ['Wood, 20 mm', 'Stopped'],
     ['Heavy clothing and gloves', 'Largely stopped'],
     ['Lead', 'Stops it, but generates bremsstrahlung X-rays']],
    'Shield beta with a LOW-density material such as plastic or aluminium, never with lead as the first layer. ' +
    'A fast electron braking sharply in a high-atomic-number material emits penetrating X-rays, so lead turns a ' +
    'beta problem into a gamma problem. The correct arrangement is plastic first, then lead if needed to catch ' +
    'the secondary X-rays. Skin and the lens of the eye are the organs at risk.');

  typeRec('Gamma ray', 'High-energy photon from the nucleus',
    [['Speed', 299792458]],
    [['Typical energy', 1, 'none', 'MeV'],
     ['Half-value layer, lead', 0.012, 'length'],
     ['Half-value layer, concrete', 0.06, 'length'],
     ['Tenth-value layer, lead', 0.04, 'length'],
     ['Tenth-value layer, concrete', 0.2, 'length']],
    [['Lead, 12 mm', 'Halves the dose rate'],
     ['Lead, 40 mm', 'Cuts it to a tenth'],
     ['Concrete, 60 mm', 'Halves the dose rate'],
     ['Concrete, 200 mm', 'Cuts it to a tenth'],
     ['Earth, 90 mm', 'Halves the dose rate'],
     ['Water, 180 mm', 'Halves the dose rate'],
     ['Paper or clothing', 'No useful protection']],
    'Attenuation is exponential: there is no thickness that stops gamma outright, only thicknesses that reduce it ' +
    'by orders of magnitude. Ten tenth-value layers give a factor of ten thousand million. Distance is usually the ' +
    'cheaper defence, because dose rate falls with the square of range: doubling the distance quarters the dose.');

  typeRec('X-ray', 'High-energy photon from the electron shell or a machine',
    [['Speed', 299792458]],
    [['Diagnostic energy', 0.06, 'none', 'MeV typical'],
     ['Industrial radiography energy', 0.3, 'none', 'MeV typical'],
     ['Half-value layer, lead at 100 kVp', 0.00027, 'length'],
     ['Half-value layer, concrete at 100 kVp', 0.016, 'length']],
    [['Lead apron, 0.25 mm lead equivalent', 'Cuts diagnostic scatter by about 95 %'],
     ['Lead, 2 mm', 'Effectively stops diagnostic energies'],
     ['Concrete, 100 mm', 'Standard room shielding for diagnostic X-ray'],
     ['Leaded glass', 'Used for viewing windows']],
    'Physically identical to gamma; the difference is origin, not nature. Machine-produced X-rays stop the instant ' +
    'the power is cut, which is the one meaningful practical distinction from an isotope source.');

  typeRec('Neutron', 'Uncharged nuclear particle',
    [['Fast neutron', 1.4e7], ['Thermal neutron', 2200]],
    [['Typical fission energy', 2, 'none', 'MeV'],
     ['Half-value layer, water', 0.05, 'length'],
     ['Half-value layer, polyethylene', 0.045, 'length'],
     ['Half-value layer, concrete', 0.1, 'length'],
     ['Relative biological weighting', 10, 'none', 'w_R, energy dependent, up to 20']],
    [['Water, 300 mm', 'Strong reduction'],
     ['Polyethylene, 250 mm', 'Strong reduction, the standard material'],
     ['Concrete, 400 mm', 'Strong reduction'],
     ['Paraffin wax or damp earth', 'Effective'],
     ['Lead', 'Poor: it slows fast neutrons very little'],
     ['Borated polyethylene', 'Best: moderates then captures without a gamma']],
    'The one case where lead is the wrong answer. Neutrons lose energy by colliding with nuclei of similar mass, ' +
    'so hydrogen stops them and heavy metal does not. Water, plastic, wax and wet earth beat lead comfortably. ' +
    'Capture then releases a gamma ray, which is why boron is added: it absorbs the slowed neutron without one.');

  typeRec('Cosmic radiation', 'High-energy particles from space',
    [['Primary particle speed', 2.9e8]],
    [['Dose at sea level', 0.00003, 'none', 'mSv/hour'],
     ['Dose at 11 000 m cruise', 0.005, 'none', 'mSv/hour'],
     ['Annual dose, sea level', 0.39, 'none', 'mSv'],
     ['Annual dose, 2000 m altitude', 0.8, 'none', 'mSv']],
    [['The atmosphere', 'The main shield: dose roughly doubles every 1800 m of altitude'],
     ['Aircraft structure', 'Negligible protection'],
     ['Earth magnetic field', 'Deflects charged primaries, weakest near the poles']],
    'A long-haul flight gives roughly the dose of a chest X-ray. Aircrew are among the most exposed occupational ' +
    'groups in the world, ahead of most nuclear workers.');

  /* ── shielding materials ──────────────────────────────────────────── */

  /* HVL and TVL at 1 MeV gamma unless stated. TVL = HVL x 3.32 */
  function shield(n, d, density, hvl, tvl, rows, note) {
    C.add({
      cat: 'rad', sub: 'shield', n: n, d: d,
      specs: [
        ['Density', density, 'none', 'kg/m³'],
        ['Half-value layer, 1 MeV gamma', hvl, 'length'],
        ['Tenth-value layer, 1 MeV gamma', tvl, 'length'],
        ['Thickness for 1/100 of the dose', hvl * 6.64, 'length'],
        ['Thickness for 1/1000 of the dose', tvl * 3, 'length']
      ],
      table: rows ? { cols: ['Radiation', 'Performance'], rows: rows } : null,
      note: note
    });
  }

  shield('Lead', 'The reference gamma shield', 11340, 0.0125, 0.0415,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it, but produces bremsstrahlung X-rays: use plastic first'],
     ['Gamma', 'Best per unit thickness of any common material'],
     ['Neutron', 'Poor: slows fast neutrons very little']],
    'Dense, cheap, workable and toxic. Unbeatable for gamma per centimetre, which is why it is used where space ' +
    'is the constraint. It is the wrong first layer for beta and close to useless against neutrons.');

  shield('Concrete', 'The practical bulk shield', 2300, 0.06, 0.2,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it'],
     ['Gamma', 'Good per unit cost, poor per unit thickness'],
     ['Neutron', 'Good: the water content moderates them']],
    'The material almost all real shielding is actually built from, because it is structural and cheap. ' +
    'A 200 mm wall cuts 1 MeV gamma to a tenth. Its bound water also makes it a competent neutron shield, ' +
    'and heavy aggregate concrete improves both.');

  shield('Steel / iron', 'Structural shielding', 7850, 0.0185, 0.061,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it, with some bremsstrahlung'],
     ['Gamma', 'Good, about two thirds as effective as lead per centimetre'],
     ['Neutron', 'Poor to fair']],
    'Where a shield must also carry load. Ship hulls, vehicle armour and equipment casings all give incidental ' +
    'gamma protection for this reason.');

  shield('Water', 'Cheap, self-levelling, transparent', 1000, 0.1, 0.33,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it cleanly, with little bremsstrahlung'],
     ['Gamma', 'Fair: needs about eight times the thickness of lead'],
     ['Neutron', 'Excellent: hydrogen is what stops neutrons']],
    'Spent fuel is stored under water because it shields, cools and lets you see what you are doing at once. ' +
    'A few metres of water is a complete shield for a very intense source.');

  shield('Earth / soil', 'The improvised shield', 1600, 0.09, 0.3,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it'],
     ['Gamma', 'Fair, and it is free and already there'],
     ['Neutron', 'Good when damp']],
    'Everything a fallout shelter is made of. Roughly 300 mm cuts gamma to a tenth, 900 mm to a thousandth. ' +
    'Sandbags, a cellar or a trench with overhead cover are the classic application.');

  shield('Polyethylene', 'The neutron shield', 940, 0.11, 0.36,
    [['Alpha', 'Total overkill'],
     ['Beta', 'Stops it cleanly: the correct first layer'],
     ['Gamma', 'Poor'],
     ['Neutron', 'Excellent, and better again when borated']],
    'Very high hydrogen density for its weight. Borated grades add neutron capture without the capture gamma, ' +
    'which is why they line neutron sources and reactor instrument channels.');

  shield('Tungsten', 'High-performance gamma shield', 19300, 0.008, 0.026,
    [['Gamma', 'Better than lead per centimetre'],
     ['Beta', 'Stops it, with strong bremsstrahlung'],
     ['Neutron', 'Poor']],
    'Denser than lead, non-toxic and far more expensive. Used in medical collimators and where the shield ' +
    'must be as small as possible.');

  shield('Depleted uranium', 'Densest practical shield', 19050, 0.0035, 0.0116,
    [['Gamma', 'The best of any practical material'],
     ['Neutron', 'Poor']],
    'About three times better than lead per centimetre. Used in industrial radiography containers and some ' +
    'medical shielding, where the mass saving justifies handling a mildly radioactive material.');

  shield('Brick and masonry', 'Ordinary construction', 1900, 0.07, 0.23,
    [['Gamma', 'Fair: a double-brick wall is a useful factor of two to four'],
     ['Beta', 'Stops it'],
     ['Neutron', 'Fair']],
    'Worth knowing because it is what most buildings are made of. Sheltering in the core of a masonry building, ' +
    'away from windows and below ground where possible, is the standard advice after a release for exactly this reason.');

  shield('Aluminium', 'Light structural metal', 2700, 0.043, 0.14,
    [['Alpha', 'Total overkill'],
     ['Beta', 'The standard beta shield, low bremsstrahlung'],
     ['Gamma', 'Poor'],
     ['Neutron', 'Poor']],
    'The usual choice for beta because its low atomic number keeps secondary X-ray production small.');

  shield('Paper, card and clothing', 'Effectively nothing', 700, 0.15, 0.5,
    [['Alpha', 'Stopped completely by a single sheet'],
     ['Beta', 'Partially stopped'],
     ['Gamma', 'No useful protection'],
     ['Neutron', 'No useful protection']],
    'Listed because the classic diagram showing paper stopping alpha is often misread as meaning paper is a ' +
    'shield. It stops alpha and nothing else that matters.');

  shield('Leaded glass', 'Transparent gamma shield', 5200, 0.028, 0.093,
    [['Gamma', 'Good, and you can see through it'],
     ['Beta', 'Stops it']],
    'Control-room and hot-cell windows. Thickness is quoted as lead equivalent rather than actual millimetres.');

  /* ── by isotope ───────────────────────────────────────────────────── */

  function iso(n, d, specs, rows, note) {
    C.add({
      cat: 'rad', sub: 'isotope', n: n, d: d, specs: specs,
      table: rows ? { cols: ['Shield', 'Effect'], rows: rows } : null,
      note: note
    });
  }

  iso('Caesium-137', 'Gamma and beta emitter, fission product',
    [['Half-life', 30.05, 'none', 'years'],
     ['Gamma energy', 0.662, 'none', 'MeV'],
     ['Beta energy', 0.512, 'none', 'MeV maximum'],
     ['Half-value layer, lead', 0.0065, 'length'],
     ['Tenth-value layer, lead', 0.022, 'length'],
     ['Tenth-value layer, concrete', 0.12, 'length'],
     ['Biological half-life in the body', 70, 'none', 'days']],
    [['Lead, 22 mm', 'Cuts the dose rate to a tenth'],
     ['Lead, 66 mm', 'Cuts it to a thousandth'],
     ['Concrete, 120 mm', 'Cuts it to a tenth'],
     ['Earth, 180 mm', 'Cuts it to a tenth'],
     ['Water, 210 mm', 'Cuts it to a tenth']],
    'The main long-term contamination hazard after Chernobyl and Fukushima, and the isotope most often used in ' +
    'industrial gauges and stolen sources. Chemically behaves like potassium, so the body takes it up into muscle ' +
    'and it is excreted over months. Prussian blue accelerates that. A 30-year half-life means contaminated ground ' +
    'stays contaminated for a human lifetime.');

  iso('Cobalt-60', 'High-energy gamma emitter',
    [['Half-life', 5.27, 'none', 'years'],
     ['Gamma energies', 1.33, 'none', 'MeV and 1.17 MeV'],
     ['Half-value layer, lead', 0.012, 'length'],
     ['Tenth-value layer, lead', 0.041, 'length'],
     ['Tenth-value layer, concrete', 0.218, 'length'],
     ['Tenth-value layer, steel', 0.07, 'length']],
    [['Lead, 41 mm', 'Cuts the dose rate to a tenth'],
     ['Lead, 123 mm', 'Cuts it to a thousandth'],
     ['Concrete, 218 mm', 'Cuts it to a tenth'],
     ['Steel, 70 mm', 'Cuts it to a tenth']],
    'Among the hardest common gammas to shield, which is exactly why it is used for industrial radiography and ' +
    'sterilisation. An unshielded industrial source can deliver a fatal dose in minutes at arm length, and orphaned ' +
    'Cobalt-60 sources have caused several mass casualty incidents.');

  iso('Iodine-131', 'Beta and gamma emitter, short-lived',
    [['Half-life', 8.02, 'none', 'days'],
     ['Gamma energy', 0.364, 'none', 'MeV'],
     ['Beta energy', 0.606, 'none', 'MeV maximum'],
     ['Tenth-value layer, lead', 0.011, 'length'],
     ['Biological half-life in the thyroid', 80, 'none', 'days']],
    [['Lead, 11 mm', 'Cuts the dose rate to a tenth'],
     ['Plastic then lead', 'Correct order: plastic for the beta, lead for the gamma'],
     ['Stable iodine tablets', 'Not a shield: they saturate the thyroid so it cannot take up the radioactive form']],
    'The reason potassium iodide is distributed after a reactor accident. The thyroid concentrates iodine, so ' +
    'this isotope delivers a very large local dose, particularly in children. An eight-day half-life means the ' +
    'hazard is intense but short: after three months it is essentially gone.');

  iso('Plutonium-239', 'Alpha emitter, fissile',
    [['Half-life', 24110, 'none', 'years'],
     ['Alpha energy', 5.16, 'none', 'MeV'],
     ['Range in air', 0.037, 'length'],
     ['Biological half-life in bone', 50, 'none', 'years'],
     ['Bare critical mass', 10, 'mass', 'sphere, unreflected']],
    [['A sheet of paper', 'Stops the alpha completely'],
     ['Skin', 'Stops the alpha completely'],
     ['Gloves and a respirator', 'The actual protection that matters'],
     ['Lead', 'Needed only for the weak accompanying gamma and X-rays']],
    'Almost harmless in a sealed container and among the most dangerous substances known once inhaled. ' +
    'The hazard is entirely internal: a particle lodged in the lung irradiates a small volume of tissue for the ' +
    'rest of the person life. Containment, respiratory protection and contamination monitoring are the whole ' +
    'problem; shielding barely features. It is also fissile, so quantity and geometry raise a separate criticality concern.');

  iso('Uranium-238 / depleted uranium', 'Weak alpha emitter, very long-lived',
    [['Half-life', 4.468e9, 'none', 'years'],
     ['Alpha energy', 4.27, 'none', 'MeV'],
     ['Specific activity', 12.4, 'none', 'kBq/g, very low'],
     ['Density', 19050, 'none', 'kg/m³']],
    [['A sheet of paper', 'Stops the alpha'],
     ['Its own bulk', 'Self-shielding: the metal absorbs its own emissions'],
     ['Gloves and washing', 'The relevant precaution for handling']],
    'Radiologically weak: the long half-life means very few decays per second, and depleted uranium is less ' +
    'active than natural. It is used as a shield precisely because it is dense and barely radioactive. ' +
    'The realistic hazards are chemical toxicity as a heavy metal, and inhaling the fine oxide aerosol produced ' +
    'when a penetrator burns on impact, rather than external radiation.');

  iso('Uranium-235', 'Alpha emitter, fissile',
    [['Half-life', 7.04e8, 'none', 'years'],
     ['Alpha energy', 4.4, 'none', 'MeV'],
     ['Gamma energy', 0.186, 'none', 'MeV'],
     ['Bare critical mass', 52, 'mass', 'sphere, unreflected'],
     ['Natural abundance', 0.72, 'none', 'per cent']],
    [['A sheet of paper', 'Stops the alpha'],
     ['Lead, 10 mm', 'Handles the weak 186 keV gamma'],
     ['Respiratory protection', 'The relevant control for dust']],
    'The 186 keV gamma line is faint but distinctive, and it is what portal monitors and handheld ' +
    'spectrometers look for at borders. Enrichment does not change the radiological hazard much; it changes ' +
    'the criticality one entirely.');

  iso('Americium-241', 'Alpha and low-energy gamma emitter',
    [['Half-life', 432.6, 'none', 'years'],
     ['Alpha energy', 5.49, 'none', 'MeV'],
     ['Gamma energy', 0.06, 'none', 'MeV'],
     ['Tenth-value layer, lead', 0.0009, 'length'],
     ['Activity in a smoke detector', 37, 'none', 'kBq']],
    [['A sheet of paper', 'Stops the alpha'],
     ['Lead, 1 mm', 'Cuts the 60 keV gamma to a tenth'],
     ['The detector housing', 'Sufficient for the domestic quantity']],
    'The isotope in a household smoke detector, in a quantity that is genuinely harmless while the source stays ' +
    'sealed. Its soft gamma is easy to shield. It also appears in industrial density gauges in far larger amounts, ' +
    'and those are the ones that go missing.');

  iso('Strontium-90', 'Pure beta emitter',
    [['Half-life', 28.79, 'none', 'years'],
     ['Beta energy', 0.546, 'none', 'MeV maximum'],
     ['Daughter yttrium-90 beta', 2.28, 'none', 'MeV maximum'],
     ['Range in tissue', 0.011, 'length'],
     ['Biological half-life in bone', 18, 'none', 'years']],
    [['Perspex, 10 mm', 'Stops the beta with minimal bremsstrahlung'],
     ['Aluminium, 5 mm', 'Stops the beta'],
     ['Lead alone', 'Wrong first layer: generates penetrating X-rays'],
     ['Plastic then lead', 'Correct order']],
    'Chemically similar to calcium, so the body deposits it in bone where it irradiates marrow for decades. ' +
    'A pure beta emitter is easy to shield and hard to detect at a distance, which is an awkward combination. ' +
    'Used in radioisotope thermoelectric generators, several of which have been found abandoned.');

  iso('Radon-222', 'Alpha-emitting gas',
    [['Half-life', 3.82, 'none', 'days'],
     ['Alpha energy', 5.49, 'none', 'MeV'],
     ['Typical outdoor concentration', 10, 'none', 'Bq/m³'],
     ['UK action level indoors', 200, 'none', 'Bq/m³'],
     ['Share of natural background dose', 50, 'none', 'per cent']],
    [['Ventilation', 'The only effective control: it is a gas'],
     ['Sealed floors and sumps', 'Standard mitigation in affected areas'],
     ['Any solid shield', 'Irrelevant, because the source gets in through the air']],
    'The largest single contributor to natural background dose for most people and the second leading cause of ' +
    'lung cancer after smoking. Seeps from granite and certain soils and accumulates in basements and poorly ' +
    'ventilated ground floors. This is the one radiation hazard most people actually face, and the answer is ' +
    'airflow, not shielding.');

  iso('Tritium (hydrogen-3)', 'Very weak beta emitter',
    [['Half-life', 12.32, 'none', 'years'],
     ['Beta energy', 0.0186, 'none', 'MeV maximum'],
     ['Range in air', 0.006, 'length'],
     ['Range in tissue', 0.000006, 'length'],
     ['Biological half-life', 10, 'none', 'days']],
    [['The glass of the vial', 'Stops it completely'],
     ['Skin', 'Stops it completely'],
     ['Any barrier at all', 'Sufficient externally']],
    'So weak that it cannot penetrate the dead layer of skin, which is why it is used in self-luminous ' +
    'gunsights, watch dials and exit signs. The only real hazard is intake, and even then it flushes out ' +
    'in about ten days because the body treats it as water.');

  iso('Polonium-210', 'Intense alpha emitter',
    [['Half-life', 138.4, 'none', 'days'],
     ['Alpha energy', 5.3, 'none', 'MeV'],
     ['Specific activity', 166, 'none', 'TBq/g'],
     ['Range in air', 0.038, 'length']],
    [['A sheet of paper', 'Stops the alpha completely'],
     ['Sealed container', 'Fully effective externally'],
     ['Shielding', 'Essentially irrelevant to the real hazard']],
    'Emits almost no penetrating radiation, so a survey meter looking for gamma will not find it and a shield ' +
    'is pointless. Extraordinarily toxic if ingested: a microgram is a lethal dose. The combination of ' +
    'undetectability at a distance and extreme internal toxicity is why it has been used for poisoning.');

  /* ── dose reference ───────────────────────────────────────────────── */

  C.add({
    cat: 'rad', sub: 'dose', n: 'What a dose means', d: 'Effective dose in millisieverts',
    table: {
      cols: ['Exposure', 'Effective dose'],
      rows: [
        ['Chest X-ray', '0.02 mSv'],
        ['Transatlantic flight', '0.08 mSv'],
        ['Annual natural background, typical', '2.4 mSv'],
        ['Head CT scan', '2 mSv'],
        ['Chest CT scan', '7 mSv'],
        ['Annual limit, radiation worker', '20 mSv'],
        ['Lowest dose with a clear cancer link', '100 mSv'],
        ['Threshold for acute radiation sickness', '1 000 mSv'],
        ['Severe sickness, survivable with treatment', '2 000 - 4 000 mSv'],
        ['Fatal without intensive treatment', '4 500 mSv'],
        ['Rapidly fatal', '8 000 mSv']
      ]
    },
    specs: [
      ['Annual natural background, typical', 2.4, 'none', 'mSv'],
      ['Annual limit, radiation worker', 20, 'none', 'mSv'],
      ['Annual limit, member of the public', 1, 'none', 'mSv above background'],
      ['LD50 without treatment', 4500, 'none', 'mSv']
    ],
    note: 'Sievert measures biological effect, gray measures energy deposited. For gamma and beta they are ' +
      'numerically the same; for alpha the sievert figure is twenty times the gray figure, and for neutrons ten ' +
      'to twenty times, because those particles do more damage per unit of energy. Quoting a dose in gray for an ' +
      'alpha emitter understates the harm by a factor of twenty.'
  });

  C.add({
    cat: 'rad', sub: 'dose', ord: -1, n: 'Time, distance and shielding', d: 'The three controls, in order of usefulness',
    specs: [
      ['Dose at 1 m, reference', 100, 'none', 'per cent'],
      ['Dose at 2 m', 25, 'none', 'per cent'],
      ['Dose at 4 m', 6.25, 'none', 'per cent'],
      ['Dose at 10 m', 1, 'none', 'per cent'],
      ['Halving the time halves the dose', 50, 'none', 'per cent']
    ],
    note: 'Dose rate falls with the square of distance, so doubling the range quarters it and ten times the range ' +
      'is a hundredth. Distance is free, instant and needs no equipment, which is why it comes before shielding ' +
      'every time. Time is linear: halve the time, halve the dose. Shielding is last because it is the slowest ' +
      'and heaviest to arrange, however satisfying the numbers look. ' +
      'None of this substitutes for a survey meter and qualified radiation protection advice.'
  });

})();
