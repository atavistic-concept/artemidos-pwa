/*
 * Artemidos - catalogue: sights, sensors and observation ranges
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Attached to existing catalogue entries by id rather than inlined, so the
 * mobility and armament data stays readable.
 *
 * Ranges follow the Johnson criteria and are quoted separately because they
 * are not interchangeable:
 *   DETECTION      something is there
 *   RECOGNITION    what class of thing it is (tracked vehicle vs truck)
 *   IDENTIFICATION which specific type, and whose
 * A sight that detects at 8 km will typically only identify at 3. Published
 * figures assume clear air; haze, dust, rain and smoke cut thermal ranges
 * sharply, and high ambient temperature flattens thermal contrast.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  function attach(id, optics) {
    var rec = C.item(id);
    if (!rec) { console.warn('Artemidos optics: no entry "' + id + '"'); return; }
    rec.optics = (rec.optics || []).concat(optics);
  }

  /* ── main battle tanks ────────────────────────────────────────────── */

  attach('mil-tank-m1a2-sepv3-abrams', [
    { n: 'Gunner primary sight, 2nd-gen FLIR', ch: 'Thermal + day + laser rangefinder',
      detect: 8000, recognise: 4500, identify: 3000,
      fov: '2.5° narrow · 10° wide', mag: '3× / 13× / 25×',
      note: 'Eye-safe laser rangefinder good to about 8 km.' },
    { n: 'CITV commander independent thermal viewer', ch: 'Thermal',
      detect: 8000, recognise: 4000, identify: 2600,
      fov: '2.8° narrow · 10.4° wide', traverse: '360° independent of the turret',
      note: 'Lets the commander search while the gunner engages: the hunter-killer capability.' }
  ]);

  attach('mil-tank-leopard-2a7', [
    { n: 'EMES 15 gunner sight with ATTICA thermal', ch: 'Thermal (3rd gen) + day + LRF',
      detect: 8000, recognise: 5000, identify: 4000,
      fov: '3.5° narrow · 12° wide', mag: '4× / 12×' },
    { n: 'PERI R17A3 commander panoramic', ch: 'Thermal + day',
      detect: 7000, recognise: 4000, identify: 3000,
      traverse: '360°', elev: '−15° to +20°' }
  ]);

  attach('mil-tank-challenger-2', [
    { n: 'TOGS II thermal sight', ch: 'Thermal + day',
      detect: 8000, recognise: 4000, identify: 3000,
      fov: '4° narrow · 12° wide' },
    { n: 'Commander primary sight VS 580-10', ch: 'Day + image intensifier',
      detect: 5000, recognise: 3000, identify: 2000, traverse: '360°' }
  ]);

  attach('mil-tank-leclerc-xlr', [
    { n: 'HL-70 gunner sight with ALIS thermal', ch: 'Thermal + day + LRF',
      detect: 7500, recognise: 4500, identify: 3200, mag: '3.3× / 10×' },
    { n: 'HL-80 commander panoramic', ch: 'Thermal + day', detect: 6500, recognise: 3800,
      traverse: '360° stabilised' }
  ]);

  attach('mil-tank-t-90m-proryv', [
    { n: 'Sosna-U gunner sight', ch: 'Thermal (Catherine-FC) + day + LRF',
      detect: 5500, recognise: 3500, identify: 2600, mag: '4× / 12×',
      note: 'A generation behind the best Western sights in identification range, which is the practical difference in a long-range duel.' },
    { n: 'Falcon Eye commander panoramic', ch: 'Thermal + day', detect: 5000, recognise: 3000,
      traverse: '360°' }
  ]);

  attach('mil-tank-t-72b3m', [
    { n: 'Sosna-U gunner sight', ch: 'Thermal + day + LRF',
      detect: 5000, recognise: 3300, identify: 2400, mag: '4× / 12×' },
    { n: 'TKN-3 commander sight', ch: 'Day + image intensifier',
      detect: 1000, recognise: 700, note: 'Night channel is an old-generation intensifier, not thermal.' }
  ]);

  attach('mil-tank-t-80bvm', [
    { n: 'Sosna-U gunner sight', ch: 'Thermal + day + LRF', detect: 5000, recognise: 3300, identify: 2400 }
  ]);

  attach('mil-tank-t-14-armata', [
    { n: 'Multispectral gunner sight', ch: 'Thermal + day + LRF',
      detect: 7500, recognise: 5000, identify: 3500 },
    { n: 'Commander panoramic + AESA panels', ch: 'Thermal + day + radar',
      detect: 100000, recognise: 5000, traverse: '360°',
      note: 'The 100 km figure is the Afghanit radar detection claim against aerial targets, not an optical range.' }
  ]);

  attach('mil-tank-merkava-mk4-barak', [
    { n: 'Knight Mk4 gunner sight', ch: 'Thermal + day + LRF',
      detect: 8000, recognise: 5000, identify: 3500 },
    { n: 'Iron Vision helmet-mounted system', ch: 'Distributed thermal + day',
      detect: 4000, traverse: '360° see-through-armour',
      note: 'Cameras around the hull project onto the crew helmet visor so they can see out with hatches closed.' }
  ]);

  attach('mil-tank-type-99a', [
    { n: 'Gunner thermal sight', ch: 'Thermal + day + LRF', detect: 7000, recognise: 4000, identify: 3000 },
    { n: 'Commander panoramic', ch: 'Thermal + day', detect: 6000, traverse: '360°' }
  ]);

  attach('mil-tank-k2-black-panther', [
    { n: 'Gunner primary sight', ch: 'Thermal (3rd gen) + day + LRF',
      detect: 9800, recognise: 6000, identify: 4000,
      note: 'Also cues a millimetre-wave radar for automatic target tracking.' },
    { n: 'Commander panoramic sight', ch: 'Thermal + day', detect: 8000, traverse: '360°' }
  ]);

  attach('mil-tank-type-10', [
    { n: 'Gunner thermal sight', ch: 'Thermal + day + LRF', detect: 7000, recognise: 4200, identify: 3000 }
  ]);

  /* ── armoured vehicles ────────────────────────────────────────────── */

  attach('mil-afv-m2a4-bradley', [
    { n: 'Improved Bradley Acquisition Subsystem (IBAS)', ch: '2nd-gen FLIR + day + LRF',
      detect: 6000, recognise: 3500, identify: 2500, fov: '2.7° narrow · 8.1° wide' },
    { n: 'Commander Independent Viewer', ch: 'Thermal', detect: 5000, traverse: '360°' }
  ]);

  attach('mil-afv-cv90-mk-iv', [
    { n: 'UTAAS gunner sight', ch: 'Thermal + day + LRF', detect: 8000, recognise: 4500, identify: 3200 },
    { n: 'Commander panoramic', ch: 'Thermal + day', detect: 6000, traverse: '360°' }
  ]);

  attach('mil-afv-puma', [
    { n: 'Gunner periscope with ATTICA thermal', ch: 'Thermal + day + LRF',
      detect: 8000, recognise: 4500, identify: 3500 },
    { n: 'Commander panoramic periscope', ch: 'Thermal + day', detect: 7000, traverse: '360°' }
  ]);

  attach('mil-afv-bmp-3', [
    { n: 'Sodema / Vesna-K gunner sight', ch: 'Thermal + day + LRF',
      detect: 3500, recognise: 2200, identify: 1800 }
  ]);

  attach('mil-afv-bmp-2', [
    { n: 'BPK-2-42 sight', ch: 'Day + image intensifier',
      detect: 1200, recognise: 800, note: 'Night channel is a passive intensifier; range collapses without ambient light.' }
  ]);

  attach('mil-afv-stryker-icv-dragoon', [
    { n: 'Commander remote weapon station sight', ch: 'Thermal + day + LRF',
      detect: 4000, recognise: 2500, identify: 1800, traverse: '360°' },
    { n: 'Driver vision enhancer', ch: 'Thermal', detect: 800 }
  ]);

  attach('mil-afv-namer', [
    { n: 'Remote weapon station sight', ch: 'Thermal + day + LRF', detect: 4000, recognise: 2500, traverse: '360°' }
  ]);

  /* ── artillery ────────────────────────────────────────────────────── */

  attach('mil-arty-m777a2-howitzer', [
    { n: 'Digital fire control with GPS/INS', ch: 'Optical direct-fire sight + digital laying',
      detect: 2000, note: 'A gun this size lays indirectly on grid, not by eye: the sight matters only for direct fire in self-defence.' }
  ]);

  attach('mil-arty-pzh-2000', [
    { n: 'Direct-fire sight', ch: 'Day optical', detect: 2000, identify: 1500 }
  ]);

  /* ── military aircraft ────────────────────────────────────────────── */

  attach('mil-milair-f-35a-lightning-ii', [
    { n: 'AN/APG-81 AESA radar', ch: 'Radar',
      detect: 150000, recognise: 90000,
      note: 'Detection range against a fighter-sized target; far greater against large or non-stealthy ones.' },
    { n: 'AN/AAQ-37 Distributed Aperture System', ch: 'Six infrared cameras',
      detect: 1300000, traverse: '360° spherical',
      note: 'The 1300 km figure is ballistic-missile launch plume detection. Against aircraft it is far shorter.' },
    { n: 'AN/AAQ-40 Electro-Optical Targeting System', ch: 'Thermal + day + laser designator',
      detect: 90000, recognise: 50000, identify: 30000 }
  ]);

  attach('mil-milair-f-22a-raptor', [
    { n: 'AN/APG-77 AESA radar', ch: 'Radar', detect: 240000, recognise: 120000,
      note: 'Low-probability-of-intercept: it can search without announcing itself the way a conventional radar does.' }
  ]);

  attach('mil-milair-f-16c-fighting-falcon', [
    { n: 'AN/APG-83 SABR AESA radar', ch: 'Radar', detect: 150000, recognise: 80000 },
    { n: 'Sniper ATP targeting pod', ch: 'Thermal + day + laser designator',
      detect: 60000, recognise: 35000, identify: 20000 }
  ]);

  attach('mil-milair-a-10c-thunderbolt-ii', [
    { n: 'Sniper / Litening targeting pod', ch: 'Thermal + day + laser',
      detect: 60000, recognise: 30000, identify: 15000 },
    { n: 'Pilot visual acquisition', ch: 'Naked eye', detect: 8000, identify: 3000,
      note: 'Close air support still comes down to the pilot seeing the mark, which is why marking rounds and panels matter.' }
  ]);

  attach('mil-milair-e-3-sentry-awacs', [
    { n: 'AN/APY-2 surveillance radar', ch: 'Pulse-Doppler radar',
      detect: 400000, recognise: 320000, traverse: '360°',
      note: 'Detection range against low-flying targets is limited by the radar horizon, not by the set: at 9 km altitude that is roughly 400 km.' }
  ]);

  attach('mil-milair-p-8a-poseidon', [
    { n: 'AN/APY-10 maritime radar', ch: 'Radar', detect: 300000, recognise: 200000 },
    { n: 'MX-20HD electro-optical turret', ch: 'Thermal + day', detect: 40000, recognise: 25000, identify: 15000 }
  ]);

  attach('mil-milair-u-2s-dragon-lady', [
    { n: 'SYERS-2C multispectral imager', ch: 'Multispectral electro-optical',
      detect: 150000, identify: 100000,
      note: 'Oblique imaging from 21 km altitude lets it look deep across a border without crossing it.' }
  ]);

  /* ── military helicopters ─────────────────────────────────────────── */

  attach('mil-milheli-ah-64e-apache-guardian', [
    { n: 'M-TADS/PNVS Arrowhead', ch: 'Thermal (2nd gen) + day TV + laser designator',
      detect: 12000, recognise: 7000, identify: 4500,
      fov: '0.9° narrow · 4° medium · 18° wide', traverse: '±120°', elev: '+30° to −60°' },
    { n: 'AN/APG-78 Longbow fire-control radar', ch: 'Millimetre-wave radar',
      detect: 8000, recognise: 6000, traverse: '360° mast-mounted',
      note: 'Classifies and prioritises up to 128 targets, handing off 16. Can be used from behind a ridge with only the mast exposed.' }
  ]);

  attach('mil-milheli-ka-52-alligator', [
    { n: 'GOES-451 electro-optical turret', ch: 'Thermal + day + laser',
      detect: 15000, recognise: 8000, identify: 5000, traverse: '±180°' },
    { n: 'Arbalet-52 radar', ch: 'Millimetre-wave radar', detect: 15000, recognise: 10000 }
  ]);

  attach('mil-milheli-mi-28nm-havoc', [
    { n: 'OPS-28 Tor sight', ch: 'Thermal + day + laser', detect: 12000, recognise: 6000, identify: 4000 },
    { n: 'N025 mast-mounted radar', ch: 'Millimetre-wave radar', detect: 12000 }
  ]);

  attach('mil-milheli-airbus-tiger-had', [
    { n: 'Strix roof-mounted sight', ch: 'Thermal + day + laser', detect: 10000, recognise: 6000, identify: 4000 },
    { n: 'TopOwl helmet-mounted sight', ch: 'Thermal + symbology', detect: 4000, traverse: 'follows the pilot head' }
  ]);

  attach('mil-milheli-bell-v-22-osprey', [
    { n: 'AN/AAQ-27 forward-looking infrared', ch: 'Thermal', detect: 8000, recognise: 4000 }
  ]);

  /* ── naval ────────────────────────────────────────────────────────── */

  attach('mil-navy-arleigh-burke-ddg-flight-iia', [
    { n: 'AN/SPY-1D phased array radar', ch: 'S-band radar',
      detect: 320000, recognise: 200000, traverse: '360° electronic',
      note: 'Tracks well over 100 targets at once. Against a sea-skimming missile the useful range collapses to the radar horizon, roughly 30 km.' },
    { n: 'Mk 20 electro-optical sight', ch: 'Thermal + day', detect: 20000, recognise: 12000, identify: 8000 }
  ]);

  attach('mil-navy-type-45-daring-destroyer', [
    { n: 'SAMPSON multifunction radar', ch: 'S-band AESA',
      detect: 400000, recognise: 250000, traverse: '360° rotating array' },
    { n: 'S1850M long-range radar', ch: 'D-band', detect: 400000 }
  ]);

  attach('mil-navy-virginia-class-ssn', [
    { n: 'AN/BVS-1 photonics mast', ch: 'Thermal + day + low-light',
      detect: 20000, recognise: 10000, identify: 6000,
      note: 'No hull penetration: the image goes to a screen, so the whole crew can see what the periscope sees.' },
    { n: 'AN/BQQ-10 sonar suite', ch: 'Passive and active sonar',
      detect: 100000, note: 'Passive detection range depends entirely on water conditions and target quieting: this is an order of magnitude, not a specification.' }
  ]);

  attach('mil-navy-kilo-class-ssk-project-636', [
    { n: 'MRK-50 search radar and periscope', ch: 'Radar + optical', detect: 25000, identify: 8000 },
    { n: 'MGK-400EM sonar', ch: 'Passive and active sonar', detect: 60000 }
  ]);

  /* ── military drones ──────────────────────────────────────────────── */

  attach('mil-uas-mq-9a-reaper', [
    { n: 'AN/DAS-1 MTS-B multi-spectral targeting system', ch: 'Thermal + day TV + laser designator + laser illuminator',
      detect: 25000, recognise: 15000, identify: 8000,
      fov: '0.3° narrow to 34° wide', traverse: '360° continuous',
      note: 'The narrow field of view is a soda straw: excellent detail, very easy to lose the wider situation.' },
    { n: 'AN/APY-8 Lynx synthetic aperture radar', ch: 'SAR / GMTI radar',
      detect: 84000, recognise: 30000,
      note: 'Ground moving target indication works through cloud, which the optical turret cannot.' }
  ]);

  attach('mil-uas-rq-4b-global-hawk', [
    { n: 'Enhanced Integrated Sensor Suite', ch: 'Synthetic aperture radar + electro-optical + infrared',
      detect: 200000, recognise: 100000, identify: 30000,
      note: 'Images about 100 000 km² in a day. Spot mode resolves to roughly 0.3 m.' }
  ]);

  attach('mil-uas-bayraktar-tb2', [
    { n: 'WESCAM MX-15D electro-optical turret', ch: 'Thermal + day + laser designator + rangefinder',
      detect: 20000, recognise: 12000, identify: 6000,
      fov: '0.4° narrow to 27° wide', traverse: '360° continuous' }
  ]);

  attach('mil-uas-bayraktar-akinci', [
    { n: 'CATS / ASELFLIR-500 turret', ch: 'Thermal + day + laser', detect: 30000, recognise: 18000, identify: 9000 },
    { n: 'AESA radar', ch: 'Radar', detect: 150000, recognise: 60000 }
  ]);

  attach('mil-uas-wing-loong-ii', [
    { n: 'Electro-optical turret', ch: 'Thermal + day + laser', detect: 20000, recognise: 12000, identify: 6000 }
  ]);

  attach('mil-uas-orlan-10', [
    { n: 'Gyro-stabilised camera', ch: 'Day TV, thermal on some airframes',
      detect: 6000, recognise: 3000, identify: 1500,
      note: 'Enough to spot and adjust artillery, which is its whole purpose. If one is overhead, assume fire is being corrected.' }
  ]);

  attach('mil-uas-scaneagle', [
    { n: 'Inertially stabilised turret', ch: 'Thermal or day TV', detect: 8000, recognise: 4000, identify: 2000 }
  ]);

  attach('mil-uas-black-hornet-prs', [
    { n: 'Three onboard cameras', ch: 'Day TV and thermal',
      detect: 1600, recognise: 800, identify: 300,
      note: 'Designed to look over a wall or around a corner, not to search a valley. Near-silent beyond about 10 m.' }
  ]);

  attach('mil-uas-shahed-136-geran-2', [
    { n: 'No sensor: inertial and satellite navigation only', ch: 'GNSS + inertial',
      note: 'It does not look for anything. It flies to a set of coordinates, which is why it is used against fixed targets and why GNSS jamming is the counter.' }
  ]);

  attach('mil-uas-lancet-3', [
    { n: 'Nose camera with terminal guidance', ch: 'Day TV', detect: 3000, recognise: 1500, identify: 800 }
  ]);

  attach('mil-uas-switchblade-300', [
    { n: 'Nose electro-optical / infrared camera', ch: 'Thermal + day',
      detect: 2000, recognise: 1000, identify: 500,
      note: 'The operator sees the target through the munition and can wave it off until the last seconds.' }
  ]);

  attach('mil-uas-fpv-attack-quadcopter', [
    { n: 'Analogue or digital FPV camera', ch: 'Day TV, thermal on night-capable builds',
      detect: 800, recognise: 400, identify: 150,
      fov: '120° or wider',
      note: 'A wide, low-resolution lens flown at speed. The pilot must get close to identify anything, which is why these are usually cued by a separate reconnaissance drone.' }
  ]);

  /* ── civil drones ─────────────────────────────────────────────────── */

  attach('civ-drone-dji-mini-4-pro', [
    { n: '1/1.3-inch camera, 24 mm equivalent', ch: 'Day, 4K',
      detect: 1200, recognise: 500, identify: 200,
      fov: '82.1°', mag: '2× lossless',
      note: 'Practical ranges for spotting a person in good light. Legally you must keep it in your own line of sight in most jurisdictions, which is a far shorter limit.' }
  ]);

  attach('civ-drone-dji-mavic-3-pro', [
    { n: 'Hasselblad 4/3 CMOS, 24 mm equivalent', ch: 'Day, 5.1K',
      detect: 1500, recognise: 600, identify: 250, fov: '84°' },
    { n: 'Tele camera, 166 mm equivalent', ch: 'Day, 7× optical',
      detect: 6000, recognise: 2500, identify: 1000, fov: '15°',
      note: 'The long lens is what turns a camera drone into an observation platform.' }
  ]);

  attach('civ-drone-dji-matrice-350-rtk', [
    { n: 'Zenmuse H20T payload', ch: 'Thermal + day + 23× zoom + laser rangefinder',
      detect: 8000, recognise: 4000, identify: 1500,
      note: 'Laser rangefinder good to 1200 m. The thermal channel finds people at night that the day camera cannot.' }
  ]);

  attach('civ-drone-wingtraone-gen-ii', [
    { n: 'Survey camera, nadir mapping', ch: 'Day, 42 MP full frame',
      detect: 3000, identify: 400,
      note: 'Built for ground resolution over area, not for looking at a point: about 1 cm per pixel from 100 m.' }
  ]);

})();
