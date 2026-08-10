/*
 * Artemidos - catalogue: physics & nature
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Propagation speeds are longitudinal wave speeds at the stated temperature
 * and pressure unless noted. Solids quote the thin-bar value where the two
 * differ materially (steel: 5130 m/s in a bar, 5960 m/s in bulk) because the
 * bulk figure is the one used for through-material ranging.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  C.cat({
    id: 'physics', n: 'Physics & nature', icon: 'physics',
    d: 'Wave speeds, falling bodies, ballistic arcs and natural phenomena',
    subs: [
      { id: 'sound', n: 'Speed of sound', icon: 'sound', d: 'Through air, water, metals and structures' },
      { id: 'light', n: 'Light & radio', icon: 'bolt', d: 'Propagation through optical media' },
      { id: 'fall', n: 'Falling & impact', icon: 'speed', d: 'Free fall, drag and terminal velocity', calc: 'fall' },
      { id: 'projectile', n: 'Projectile motion', icon: 'target', d: 'Range, apex and time of flight', calc: 'projectile' },
      { id: 'stopping', n: 'Stopping distance', icon: 'car', d: 'Reaction plus braking, by surface', calc: 'stopping' },
      { id: 'seismic', n: 'Seismic & water waves', icon: 'physics', d: 'Earthquake and tsunami propagation' },
      { id: 'altitude', n: 'Altitude', icon: 'plane', d: 'Air pressure and breathable oxygen with height' },
      { id: 'thermo', n: 'Temperature & phase change', icon: 'thermo', d: 'Heating, cooling, freezing and boiling' },
      { id: 'nature', n: 'Natural phenomena', icon: 'bolt', d: 'Wind, flows, weather and orbital speeds' }
    ]
  });

  /* ── speed of sound ───────────────────────────────────────────────── */

  function snd(n, d, v, note) {
    C.add({ cat: 'physics', sub: 'sound', n: n, d: d, speeds: [['Propagation speed', v]], note: note });
  }

  /* The list sorts by `ord` first, then by name. So the four that must lead -
     air, fresh water, sea water, steel - carry negative ord to sit above the
     alphabetical block; everything else has no ord and falls into A-Z. */
  C.add({ cat: 'physics', sub: 'sound', id: 'physics-sound-air', n: 'Air', ord: -4,
    d: 'Gas · type the air temperature', calc: 'soundair' });
  C.add({ cat: 'physics', sub: 'sound', id: 'physics-sound-fresh', n: 'Fresh water', ord: -3,
    d: 'Liquid · type the water temperature', calc: 'soundfresh' });
  C.add({ cat: 'physics', sub: 'sound', id: 'physics-sound-sea', n: 'Sea water, 35 ppt', ord: -2,
    d: 'Liquid · type the water temperature', calc: 'soundsalt' });
  C.add({ cat: 'physics', sub: 'sound', id: 'physics-sound-steel', n: 'Steel', ord: -1,
    d: 'Metal (bulk longitudinal)', speeds: [['Propagation speed', 5960]],
    note: 'Thin-bar value is 5130 m/s. Use the bulk figure for through-thickness ranging.' });

  /* everything else, ordered A-Z automatically by the renderer */
  snd('Aluminium', 'Metal (bar)', 5100, 'Bulk longitudinal speed is higher, about 6420 m/s.');
  snd('Bone, cortical', 'Biological', 3500);
  snd('Brass', 'Metal (bar)', 3475);
  snd('Brick', 'Solid · masonry', 3650);
  snd('Carbon dioxide, 0 °C', 'Gas', 258);
  snd('Concrete', 'Solid · structural', 3400);
  snd('Copper', 'Metal (bar)', 3810);
  snd('Cork', 'Solid', 500);
  snd('Diamond', 'Solid · fastest common material', 12000);
  snd('Dry soil', 'Solid · loose ground', 350);
  snd('Ethanol, 20 °C', 'Liquid', 1162);
  snd('Glass, crown', 'Solid', 5640);
  snd('Gold', 'Metal (bar)', 3240);
  snd('Granite', 'Rock', 5950);
  snd('Helium, 20 °C', 'Gas', 1007);
  snd('Human soft tissue', 'Biological · medical ultrasound reference', 1540);
  snd('Hydrogen, 20 °C', 'Gas', 1310);
  snd('Ice', 'Solid', 3200);
  snd('Iron', 'Metal (bar)', 5120);
  snd('Lead', 'Metal (bar)', 1210);
  snd('Mercury, 20 °C', 'Liquid metal', 1450);
  snd('Nylon', 'Polymer', 2620);
  snd('PVC', 'Polymer', 2395);
  snd('Rubber, soft', 'Solid · elastomer', 60, 'One of the slowest common solids, which is why rubber makes an effective vibration isolator.');
  snd('Titanium', 'Metal', 6070);
  snd('Wood, oak (along grain)', 'Solid', 3850);
  snd('Wood, pine (along grain)', 'Solid', 3320);

  /* ── light & radio ────────────────────────────────────────────────── */

  function lgt(n, d, nIdx, note) {
    var v = 299792458 / nIdx;
    C.add({
      cat: 'physics', sub: 'light', n: n, d: d,
      speeds: [['Propagation speed', v]],
      specs: [['Refractive index n', nIdx, 'none']],
      note: note
    });
  }

  /* the whole spectrum, radio to gamma, on its own page at the top of the list */
  C.add({ cat: 'physics', sub: 'light', n: 'Radio & light spectrum', ord: -1,
    d: 'The full band chart: VLF to gamma, and what transmits there', calc: 'spectrum' });

  lgt('Vacuum', 'The defined constant c', 1, 'Exactly 299 792 458 m/s. The metre is defined from it, so this figure has no uncertainty.');
  lgt('Air, sea level', 'Gas', 1.000293, 'Close enough to vacuum that radio and laser ranging over normal distances ignore the difference.');
  lgt('Water', 'Liquid, 20 °C', 1.333);
  lgt('Ice', 'Solid', 1.309);
  lgt('Ethanol', 'Liquid', 1.361);
  lgt('Fused quartz', 'Solid', 1.458);
  lgt('Optical fibre core', 'Silica, typical single-mode', 1.4682, 'Signal latency along fibre is about 5 µs per kilometre, which is why undersea route length drives trading latency.');
  lgt('Acrylic (PMMA)', 'Polymer', 1.491);
  lgt('Crown glass', 'Optical glass', 1.52);
  lgt('Flint glass', 'Optical glass', 1.62);
  lgt('Sapphire', 'Crystal', 1.77);
  lgt('Diamond', 'Crystal · high dispersion', 2.417);
  lgt('Silicon (infrared)', 'Semiconductor', 3.42);

  /* ── seismic & water waves ────────────────────────────────────────── */

  function sei(n, d, v, specs, note) {
    C.add({ cat: 'physics', sub: 'seismic', n: n, d: d, speeds: [['Propagation speed', v]], specs: specs, note: note });
  }

  sei('P-wave, continental crust', 'Primary / compressional', 6000, null,
    'The first arrival at a seismograph. The gap between P and S arrival gives distance to the epicentre: roughly 8 km per second of separation.');
  sei('S-wave, continental crust', 'Secondary / shear', 3500, null,
    'Cannot travel through liquid, which is how the liquid outer core was discovered.');
  sei('P-wave, upper mantle', 'Primary', 8100);
  sei('P-wave, lower mantle', 'Primary', 13000);
  sei('Rayleigh surface wave', 'Surface · most destructive', 3000);
  sei('Love surface wave', 'Surface · horizontal shear', 3400);
  sei('Tsunami, 4000 m ocean', 'Shallow-water wave, deep sea', 198,
    [['Water depth', 4000, 'alt']],
    'Speed is √(g·d), so a tsunami crosses deep ocean at jet speed and slows dramatically as it shoals, which is where the wave height builds.');
  sei('Tsunami, 200 m shelf', 'Shallow-water wave, continental shelf', 44, [['Water depth', 200, 'alt']]);
  sei('Tsunami, 50 m nearshore', 'Shallow-water wave, nearshore', 22, [['Water depth', 50, 'alt']]);
  sei('Ocean swell, 10 s period', 'Deep-water wave', 15.6, null, 'Deep-water wave speed is g·T/2π, so longer-period swell outruns shorter and arrives first.');

  /* ── natural phenomena ────────────────────────────────────────────── */

  function nat(n, d, speeds, specs, note) {
    C.add({ cat: 'physics', sub: 'nature', n: n, d: d, speeds: speeds, specs: specs, note: note });
  }

  nat('Lightning return stroke', 'Electrical discharge',
    [['Return stroke', 1e8], ['Stepped leader', 2e5]], null,
    'The visible flash climbs at roughly a third of light speed. The thunder it makes travels at the speed of sound, which is what makes flash-to-bang ranging work.');
  nat('Wind · Beaufort 0-3', 'Calm to gentle breeze',
    [['Calm (F0)', 0.2], ['Light air (F1)', 1.5], ['Light breeze (F2)', 3.3], ['Gentle breeze (F3)', 5.4]]);
  nat('Wind · Beaufort 4-7', 'Moderate to near gale',
    [['Moderate breeze (F4)', 7.9], ['Fresh breeze (F5)', 10.7], ['Strong breeze (F6)', 13.8], ['Near gale (F7)', 17.1]]);
  nat('Wind · Beaufort 8-12', 'Gale to hurricane force',
    [['Gale (F8)', 20.7], ['Strong gale (F9)', 24.4], ['Storm (F10)', 28.4], ['Violent storm (F11)', 32.6], ['Hurricane (F12)', 35]],
    null, 'Beaufort 12 begins at 32.7 m/s. Helicopter and small-boat operations are normally suspended well below this.');
  nat('Tornado', 'Rotational wind',
    [['EF1', 40], ['EF3', 70], ['EF5', 100]], null,
    'Enhanced Fujita ratings are assigned from damage, not from a measured wind speed.');
  nat('Tropical cyclone', 'Sustained wind and translation',
    [['Category 1 sustained', 35], ['Category 5 sustained', 75], ['Storm translation, typical', 6]]);
  nat('Pyroclastic flow', 'Volcanic density current',
    [['Typical', 80], ['Maximum recorded', 200]], null,
    'Outruns any vehicle on a mountain road. Evacuation has to precede the eruption, not follow it.');
  nat('Lava flow', 'Volcanic',
    [['Basaltic, typical', 0.3], ['Basaltic, steep channel', 10], ['Andesitic', 0.01]]);
  nat('Avalanche', 'Snow',
    [['Slab avalanche', 30], ['Powder avalanche', 60]]);
  nat('Landslide / debris flow', 'Mass movement',
    [['Debris flow', 10], ['Rock avalanche', 50]]);
  nat('River & ocean current', 'Water flow',
    [['Slow river', 0.5], ['Fast river', 3], ['Rapids', 6], ['Gulf Stream core', 2.5], ['Tidal race, extreme', 8]]);
  nat('Falling precipitation', 'Terminal velocities',
    [['Drizzle drop', 2], ['Large raindrop', 9], ['Snowflake', 1], ['Hailstone, 2 cm', 20], ['Hailstone, 5 cm', 33]]);
  nat('Earth motion', 'Rotational and orbital',
    [['Surface at the equator', 463.8], ['Orbit around the Sun', 29780]], null,
    'Equatorial rotation speed is why launch sites are placed near the equator and launches go east.');
  nat('Orbital & escape', 'Spaceflight reference',
    [['Low Earth orbit', 7660], ['Escape velocity, Earth', 11186], ['Geostationary orbit', 3070]],
    [['Low Earth orbit altitude', 400000, 'alt'], ['Geostationary altitude', 35786000, 'alt']]);
  nat('Meteor entry', 'Atmospheric entry',
    [['Slow entry', 11000], ['Typical', 20000], ['Fast (retrograde)', 72000]]);
  nat('Air molecules', 'Kinetic theory',
    [['Nitrogen, RMS at 20 °C', 511], ['Oxygen, RMS at 20 °C', 478]], null,
    'Molecular speed sets the speed of sound: sound cannot outrun the molecules that carry it.');
  nat('Nerve conduction', 'Biological signalling',
    [['Myelinated motor nerve', 100], ['Unmyelinated pain fibre', 1]], null,
    'The reason a reaction time of about 1.5 seconds is used in stopping-distance work: signal transit is only part of it.');

  /* ── interactive calculators ──────────────────────────────────────── */

  C.add({
    cat: 'physics', sub: 'fall', id: 'calc-freefall', n: 'Free fall from height',
    d: 'Impact speed and time, vacuum or with air resistance', calc: 'fall',
    note: 'Vacuum figures are exact. With drag, the result is a numerical integration using the drag coefficient, frontal area and air density you set.'
  });
  C.add({
    cat: 'physics', sub: 'fall', id: 'calc-terminal', n: 'Terminal velocity',
    d: 'The speed at which drag balances weight', calc: 'terminal'
  });
  C.add({
    cat: 'physics', sub: 'projectile', id: 'calc-projectile', n: 'Projectile trajectory',
    d: 'Range, apex, flight time and impact speed', calc: 'projectile'
  });
  C.add({
    cat: 'physics', sub: 'stopping', id: 'calc-stopping', n: 'Vehicle stopping distance',
    d: 'Reaction distance plus braking distance by surface', calc: 'stopping',
    note: 'Reaction distance is speed × reaction time. Braking distance is v² / (2·µ·g). Both assume a straight line, level ground and brakes that do not fade.'
  });

  /* ── temperature & phase change ────────────────────────────────────── */

  C.add({
    cat: 'physics', sub: 'thermo', n: 'Temperature change & freezing',
    d: 'Energy and time to heat, cool, freeze or boil', calc: 'tempchange',
    ord: -2,
    note: 'The energy walks through every stage between the two temperatures: cooling water to 0 °C, freezing it (which costs as much as cooling it from 80 °C), then chilling the ice. Time follows from the power available to add or remove that heat.'
  });
  /* ── altitude ─────────────────────────────────────────────────────── */

  C.add({
    cat: 'physics', sub: 'altitude', n: 'Oxygen with altitude',
    d: 'Type an altitude, read the breathable oxygen', ord: -2, calc: 'o2alt'
  });
  C.add({
    cat: 'physics', sub: 'altitude', n: 'Air pressure and altitude',
    d: 'Convert pressure to altitude and back', ord: -1, calc: 'baralt'
  });

  C.add({
    cat: 'physics', sub: 'thermo', n: 'Phase points of water',
    d: 'What happens at which temperature, fresh and sea', ord: -1,
    calc: 'waterphase'
  });
  C.add({
    cat: 'physics', sub: 'thermo', n: 'Freezing & cooling in practice',
    d: 'How long things actually take', ord: 0,
    table: {
      plain: true, cols: ['Situation', 'Rule of thumb'],
      rows: [
        ['0.5 L bottle in a freezer (−18 °C)', 'Slush in ~1.5 h, solid in ~3 h'],
        ['0.5 L bottle in ice + salt water', 'Near 0 °C in 15-20 min'],
        ['Canteen in a stream (10 °C)', 'Drinkably cool in ~30 min'],
        ['Car engine block after shutdown', 'Warm to the touch for 2-4 h, IR-visible far longer'],
        ['Human body in 5 °C air', 'Hypothermia risk in hours; in 5 °C water, in under 1 h'],
        ['Lake ice bearing one person', '≥ 5 cm of clear black ice'],
        ['Lake ice bearing a light vehicle', '≥ 20 cm of clear black ice, double for white ice']
      ]
    },
    note: 'Moving water and wind carry heat away far faster than still air at the same temperature: that is wind chill, and it works on machines and water bottles the same way it works on people.'
  });

})();
