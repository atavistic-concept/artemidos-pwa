/*
 * Artemidos - catalogue: infrared & thermal imaging
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT THERMAL SEES, HOW FAR, AND WHAT ACTUALLY DEFEATS IT.
 *
 * A thermal imager does not see light. It sees temperature difference, so the
 * rules that hide a person from the eye or from a night-vision tube do not
 * apply, and most of what people believe about "hiding from thermal" is wrong.
 * Glass is opaque to long-wave infrared. A blanket that stops visible light is
 * transparent to the thing that matters within minutes as it warms. Darkness
 * does nothing at all: night is when thermal works best.
 *
 * Two separate ideas are recorded here, kept apart on purpose:
 *
 *   DEVICES         real sensors and the ranges at which they detect, recognise
 *                   and identify a human or a vehicle. Ranges follow the Johnson
 *                   criteria and are not interchangeable.
 *   CONCEALMENT &   what genuinely reduces a thermal or IR signature and what
 *   COUNTERMEASURES only appears to. Treated as the cover-versus-concealment
 *                   problem it is: the failure mode is trusting something that
 *                   feels protective and is not.
 *
 * Bands matter. Most military thermal is LONG-WAVE (LWIR, 8-14 um) and works
 * on emitted body and engine heat. Some is MID-WAVE (MWIR, 3-5 um). NEAR-IR
 * (NIR, 0.7-1.0 um) is a different thing entirely: it is reflected, not
 * emitted, which is what an IR illuminator and most CCTV "night mode" use, and
 * what an IR-reflective camouflage is designed against. They defeat differently.
 *
 * Figures are open-source planning values in clear air. Haze, rain, dust and
 * smoke cut thermal range hard, and a hot day that warms the background toward
 * body temperature flattens the contrast the sensor lives on.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  C.cat({
    id: 'thermal', n: 'Infrared & thermal', icon: 'thermo',
    d: 'What thermal and IR see, how far, and what defeats them',
    subs: [
      { id: 'devices', n: 'Cameras & sensors', icon: 'recon', d: 'Detection, recognition and identification ranges' },
      { id: 'bands', n: 'The IR bands', icon: 'physics', d: 'Near-IR, mid-wave, long-wave, and why they differ' },
      { id: 'conceal', n: 'Concealment', icon: 'shield', d: 'What lowers a thermal signature and what only seems to' },
      { id: 'counter', n: 'Countermeasures', icon: 'warn', d: 'Defeating a sensor: decoys, dazzle, obscurants' }
    ]
  });

  /* ── cameras & sensors ────────────────────────────────────────────────
     detect / recognise / identify against a standard NATO target: a human of
     about 0.75 m^2 and a vehicle of about 2.3 m critical dimension. */

  function dev(n, d, band, human, vehicle, attrs, note) {
    C.add({
      cat: 'thermal', sub: 'devices', n: n, d: d,
      specs: (human ? [
          ['Detect a person', human[0], 'dist', 'something warm is there'],
          ['Recognise a person', human[1], 'dist', 'it is a human'],
          ['Identify a person', human[2], 'dist', 'who, armed or not']
        ] : [])
        .concat(vehicle ? [
          ['Detect a vehicle', vehicle[0], 'dist'],
          ['Recognise a vehicle', vehicle[1], 'dist'],
          ['Identify a vehicle', vehicle[2], 'dist']
        ] : []),
      table: { plain: true, cols: ['Attribute', 'Value'],
        rows: [['Waveband', band]].concat(attrs || []) },
      note: note
    });
  }

  dev('Handheld thermal monocular', 'Pocket spotter, 256-384 core, class of FLIR Scout / Pulsar Axion',
    'LWIR 8-14 um, uncooled microbolometer',
    [1300, 500, 250], [2200, 1100, 600],
    [['Sensor resolution', '256x192 to 384x288'],
     ['Field of view', 'typically 12-25 degrees']],
    'The commonest thermal a civilian, poacher, private guard or hostile scout will carry. Uncooled, so it needs no ' +
    'cool-down and runs for hours on a battery, but its range and its ability to identify are limited. It will see ' +
    'that a person is there across a field long before it can tell who they are or whether they are armed.');

  dev('Thermal weapon sight', 'Rifle-mounted, 384-640 core, class of FLIR ThermoSight / Pulsar Thermion',
    'LWIR 8-14 um, uncooled',
    [1800, 900, 450], [3000, 1500, 900],
    [['Sensor resolution', '384x288 to 640x480'],
     ['Magnification', '2x-8x, digital zoom beyond']],
    'A weapon sight adds magnification, so it identifies further than a monocular of the same sensor. This is the ' +
    'device that turns "there is someone at the treeline" into an aimed shot in complete darkness.');

  dev('Cooled MWIR imager', 'Long-range surveillance / vehicle sight, class of a cooled 640 core',
    'MWIR 3-5 um, cooled to about 77 K',
    [6000, 3000, 1500], [12000, 6000, 3500],
    [['Sensor resolution', '640x512 typical'],
     ['Cool-down time', 'minutes, then continuous']],
    'A cooled mid-wave sensor is a generation beyond a handheld: it sees a warm body across kilometres and identifies ' +
    'a vehicle where a pocket device only detects one. This is what a modern armoured vehicle, a border tower or a ' +
    'surveillance drone carries. Assume it, not the monocular, when the threat is a state or a serious operator.');

  dev('Vehicle / AFV gunner thermal', 'Second- and third-generation FLIR in a fighting vehicle sight',
    'LWIR or MWIR, cooled',
    [8000, 4000, 2000], [10000, 5000, 3000],
    [['Cross-reference', 'per-vehicle figures in Military systems']],
    'Detailed per-platform ranges live on each vehicle in the Military systems catalogue. Repeated here only to set the ' +
    'scale: a tank sees and identifies you long before you can see it, day or night.');

  dev('Airborne / drone EO-IR turret', 'Gimballed day/thermal ball, class of MX-series or Wescam',
    'MWIR cooled + day + laser',
    [15000, 8000, 4000], [25000, 15000, 8000],
    [['Typical altitude', 'holds standoff above small-arms range'],
     ['Stabilisation', 'gyro-stabilised, tracks automatically']],
    'The hardest thermal threat to a person on the ground: high, quiet or invisible, persistent, and stabilised enough ' +
    'to hold a warm figure in frame for hours. Cover and overhead concealment, not movement, are the answer to it. ' +
    'A drone you cannot hear is still watching, and it does not lose interest.');

  dev('IR-illuminated camera (near-IR CCTV)', 'Security camera "night mode" and most trail cameras',
    'NIR 0.85-0.94 um, reflected, with its own IR LED lamp',
    [80, 40, 20], [120, 70, 40],
    [['Illuminator range', 'about 30 m LED lamp, longer with a spotlight'],
     ['Tell-tale', 'faint red glow from the LEDs, visible to a phone camera']],
    'NOT a thermal camera, and defeated completely differently. It sees reflected near-infrared, so it needs its own ' +
    'IR lamp to work and is blind past that lamp\'s reach. It is fooled by the same things that fool a normal camera ' +
    '(masks, angles, an overexposing bright IR source aimed back at it) and, unlike thermal, darkness and cover DO ' +
    'hide you from it. A phone camera without an IR filter will show its LEDs glowing, which is how you spot one.');

  /* ── the IR bands ─────────────────────────────────────────────────────
     an explainer sub, so a reader does not conflate the two very different
     "infrared" technologies and defeat the wrong one. */

  C.add({
    cat: 'thermal', sub: 'bands', n: 'Near-IR vs thermal, the whole difference',
    d: 'Why an IR illuminator and a thermal camera are not the same threat',
    table: {
      plain: true,
      cols: ['Band', 'What it does'],
      rows: [
        ['Near-IR (0.7-1.0 um)', 'Reflected light. Needs an IR lamp. Darkness and cover hide you. This is CCTV night mode.'],
        ['Short-wave (1-3 um, SWIR)', 'Reflected, sees through some haze and glass. Specialist. Laser and beacon spotting.'],
        ['Mid-wave (3-5 um, MWIR)', 'Emitted heat. Cooled sensors, long range, hot targets. Engines, exhaust, aircraft.'],
        ['Long-wave (8-14 um, LWIR)', 'Emitted heat. The common military and handheld band. Body heat at ambient temperature.'],
        ['Visible glass', 'Opaque to LWIR: a window looks like a wall to thermal. A car windscreen hides the occupants.'],
        ['A thin space blanket', 'Blocks near-IR and briefly reflects heat, then warms and glows on LWIR. Not a thermal cloak.']
      ]
    },
    note: 'The single most useful distinction to hold: near-IR is reflected and is beaten by darkness and cover; ' +
      'thermal (mid and long-wave) is emitted and is not. If you defeat the wrong band you have done nothing. Ask ' +
      'first whether the sensor makes its own light (near-IR, has a lamp) or reads your heat (thermal, needs none).'
  });

  /* ── concealment ──────────────────────────────────────────────────────
     what genuinely lowers a thermal signature and what only feels like it. */

  C.add({
    cat: 'thermal', sub: 'conceal', n: 'Hiding a thermal signature',
    d: 'What lowers it, what does nothing, ranked plainly',
    table: {
      cols: ['Method', 'Against long-wave thermal'],
      rows: [
        ['Terrain mask: a hill, a wall, a bank', 'Stops it completely. Thermal cannot see through solid ground or masonry.'],
        ['Thick vegetation, dense canopy', 'Strong reduction: leaves and branches are cold and block line of sight.'],
        ['Getting wet, or wet mud on skin', 'Strong short-term reduction: evaporative cooling pulls the surface toward ambient.'],
        ['A thermal blanket used correctly', 'Works only with an air gap and time to cool: skin-tight it just re-radiates.'],
        ['Cold hard cover between you and it', 'Stops it: a cold vehicle, a cold wall, anything at ambient temperature.'],
        ['Space blanket wrapped tight', 'Poor: warms to body heat in minutes and then glows like a person.'],
        ['A normal blanket, a bin bag, foliage worn', 'Poor: warms through, and a warm outline is still a person-shaped source.'],
        ['Glass, a car window, a greenhouse', 'Fully effective: long-wave is opaque to glass, so behind it you are invisible.'],
        ['Darkness, black clothing, camo paint', 'Useless: thermal ignores colour and light, and night is when it works best.'],
        ['Mud or paint at your own skin temperature', 'Useless once it warms: only the temperature difference matters, not the material.']
      ]
    },
    note: 'The rule behind every line: thermal sees temperature difference, so anything that removes the difference ' +
      'hides you and anything that only changes appearance does not. The reliable defences are a cold solid mask ' +
      'between you and the sensor, distance, and evaporative cooling. Movement is the thing that gets people caught: ' +
      'a warm figure holding still in clutter can be missed, the same figure moving is unmistakable.'
  });

  C.add({
    cat: 'thermal', sub: 'conceal', n: 'Reducing a vehicle or position signature',
    d: 'Engines, exhaust, tracks and disturbed ground',
    table: {
      cols: ['Source', 'What it looks like, and what helps'],
      rows: [
        ['A running engine and exhaust', 'The brightest thing for miles. Only shutting down and cooling truly hides it.'],
        ['Recently driven ground, warm tracks', 'Tyre and track marks stay warm for many minutes and lead straight to you.'],
        ['A hand-print, a recent seat, a warm barrel', 'Thermal reads residual heat: a fired weapon and a just-vacated chair both glow.'],
        ['Disturbed earth, a fresh dig', 'Different temperature and moisture from its surroundings: obvious from the air.'],
        ['Thermal camouflage netting (multispectral)', 'Good: breaks up shape and insulates, the standard military answer.'],
        ['An ordinary tarpaulin over a hot engine', 'Poor: conducts and re-radiates the heat, often as a clean hot rectangle.'],
        ['Parking under a cold overhead: trees, a carport', 'Helps against airborne thermal by breaking the downward line of sight.']
      ]
    },
    note: 'Heat has memory. A position betrays itself not only by what is hot now but by what was recently warm: ' +
      'vehicle tracks, footprints in cold grass, the ground under a generator that has just stopped. Multispectral ' +
      'camouflage netting is the only field material that addresses thermal, near-IR and radar together, which is ' +
      'why it exists and why an ordinary net or tarp does not do the job.'
  });

  /* ── countermeasures ──────────────────────────────────────────────────
     defeating the sensor rather than hiding from it. */

  C.add({
    cat: 'thermal', sub: 'counter', n: 'Defeating the sensor',
    d: 'Decoys, obscurants, dazzle and their limits',
    table: {
      cols: ['Countermeasure', 'Effect and limit'],
      rows: [
        ['Multispectral smoke / IR obscurant', 'Good: blocks thermal as well as sight, unlike ordinary smoke. The standard break-contact tool.'],
        ['Ordinary white smoke', 'Poor against thermal: hot particles can even highlight the cloud. Hides the eye, not the sensor.'],
        ['Thermal decoys, heated flares, hot plates', 'Pull an automatic tracker or a missile seeker off the real target if the signature matches.'],
        ['IR-reflective paint and coatings', 'Strong reduction of a vehicle\'s mid-wave and near-IR signature, not invisibility.'],
        ['Flooding a near-IR camera with IR light', 'Blinds CCTV night mode: bright IR LEDs at the lens overexpose it, but only near-IR, not thermal.'],
        ['A laser against an EO-IR sensor', 'Can dazzle or damage a camera, but this is a weapon and an escalation, not concealment.'],
        ['Cooling a surface toward ambient', 'Fully effective in principle: remove the temperature difference and there is nothing to see.'],
        ['Jamming a thermal camera electronically', 'Not a thing: a passive imager emits nothing to jam. You must block, cool, decoy or obscure it.']
      ]
    },
    note: 'A passive thermal imager receives, it does not transmit, so there is nothing to jam and no signal to trace: ' +
      'you defeat it only by controlling heat and line of sight, or by giving it a more attractive false target. ' +
      'Near-IR cameras, which make their own light, are the opposite and are beaten by overwhelming that light. ' +
      'Knowing which of the two you face decides everything, and none of this is operational guidance: it is a ' +
      'reference for understanding what a sensor can and cannot do.'
  });

})();
