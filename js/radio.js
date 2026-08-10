/*
 * Artemidos - radio: frequencies, range estimation and comms planning
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Three tools behind one page:
 *
 *   RANGE      an interactive estimate of how far a set will actually talk,
 *              driven by frequency, power, antenna height at both ends and the
 *              terrain between them. Two independent limits are computed and
 *              the shorter one wins:
 *                RADIO HORIZON   geometry. VHF/UHF travels in near-straight
 *                                lines, so the curve of the earth caps range
 *                                regardless of power. d_km = 4.12(√h1 + √h2),
 *                                the 4/3-earth form that already includes the
 *                                slight downward bending of radio in the lower
 *                                atmosphere.
 *                LINK BUDGET     signal. A log-distance path-loss model with a
 *                                terrain exponent: open ground loses signal
 *                                like free space, forest and city lose it far
 *                                faster. When this is shorter than the horizon,
 *                                you run out of signal before you run out of
 *                                line of sight.
 *
 *   FREQUENCIES common bands with their typical use, licence status and range
 *              behaviour. Licence-free does not mean rules-free: power and
 *              antenna limits are what keep those bands usable, and exceeding
 *              them is both an offence and a direction-finding beacon.
 *
 *   PLANNER    a PACE comms plan you can fill in and keep, the standard
 *              Primary / Alternate / Contingency / Emergency ladder, plus the
 *              switch conditions that decide WHEN to drop to the next rung.
 *
 * Every range figure is a planning estimate in the stated conditions. Real
 * propagation varies with weather, foliage state, obstacles, interference and
 * antenna quality, and a radio check on the actual ground beats any model.
 */
(function (global) {
  'use strict';

  var log10 = function (x) { return Math.log(x) / Math.LN10; };

  /* Frequency presets. Each radio type owns its slice of spectrum, and the
     tool holds you inside it: a PMR446 set cannot leave 446 MHz in the real
     world, so it cannot here either. lo/hi bound the tuning, step is the
     channel spacing the arrows move by. Custom is the whole practical
     spectrum with no restriction. */
  var BANDS = [
    { id: 'pmr',    label: 'PMR446',      f: 446.00625, w: 0.5, lo: 446.00625, hi: 446.19375, step: 0.0125 },
    { id: 'frs',    label: 'FRS',         f: 462.5625,  w: 2,   lo: 462.5500,  hi: 467.7125,  step: 0.0125 },
    { id: 'gmrs',   label: 'GMRS',        f: 462.5625,  w: 5,   lo: 462.5500,  hi: 467.7250,  step: 0.0125 },
    { id: 'murs',   label: 'MURS',        f: 151.820,   w: 2,   lo: 151.820,   hi: 154.600,   step: 0.005 },
    { id: 'cb',     label: 'CB 27',       f: 26.965,    w: 4,   lo: 26.965,    hi: 27.405,    step: 0.010 },
    { id: 'marine', label: 'Marine VHF',  f: 156.800,   w: 25,  lo: 156.000,   hi: 162.025,   step: 0.025 },
    { id: 'air',    label: 'Airband',     f: 121.500,   w: 10,  lo: 118.000,   hi: 136.975,   step: 0.025 },
    { id: 'ham2m',  label: 'Ham 2 m',     f: 145.500,   w: 5,   lo: 144.000,   hi: 148.000,   step: 0.0125 },
    { id: 'ham70',  label: 'Ham 70 cm',   f: 433.500,   w: 5,   lo: 430.000,   hi: 440.000,   step: 0.0125 },
    { id: 'hamhf',  label: 'Ham HF 20 m', f: 14.200,    w: 100, lo: 14.000,    hi: 14.350,    step: 0.005 },
    { id: 'tetra',  label: 'TETRA',       f: 390.000,   w: 3,   lo: 380.000,   hi: 400.000,   step: 0.025 },
    { id: 'lora',   label: 'LoRa 868',    f: 868.100,   w: 0.1, lo: 863.000,   hi: 870.000,   step: 0.100 },
    { id: 'custom', label: 'Custom',      f: 446,       w: 5,   lo: 0.01,      hi: 47000,     step: 1 }
  ];
  function bandOf(id) { return BANDS.filter(function (x) { return x.id === id; })[0] || BANDS[BANDS.length - 1]; }

  /* ── how the set is carried, and the antenna height that follows ──
     Antenna height decides range more than power does, and most people do not
     know what to type. These are the heights the common sets actually put in
     the air: a handheld is the antenna at head height, a vehicle whip clears
     the roof, a base station is on a building, a repeater is the whole point
     of a repeater. Picking the station type fills the height in. */
  var STATIONS = [
    { id: 'hand',    n: 'Handheld, carried',        h: 1.5,  d: 'Baofeng, PMR446, DP4400 in the hand' },
    { id: 'handup',  n: 'Handheld, arm raised',     h: 2.2,  d: 'the free half-kilometre nobody uses' },
    { id: 'manpack', n: 'Manpack, whip',            h: 2.5,  d: 'PRC-style radio on the back' },
    { id: 'vehicle', n: 'Vehicle, roof whip',       h: 2.5,  d: 'mobile set, antenna on the roof' },
    { id: 'window',  n: 'Handheld, upper window',   h: 12,   d: 'fourth floor of a building' },
    { id: 'base',    n: 'Base station, roof mast',  h: 25,   d: 'building roof with a mast' },
    { id: 'repeat',  n: 'Repeater on a tower',      h: 60,   d: 'commercial or ham repeater' },
    { id: 'hill',    n: 'Hilltop relay',            h: 200,  d: 'set on high ground' },
    { id: 'air',     n: 'Aircraft or drone',        h: 1000, d: 'why air-to-ground reaches so far' }
  ];
  function stationOf(id) { return STATIONS.filter(function (x) { return x.id === id; })[0] || STATIONS[0]; }

  /* terrain: label -> path-loss exponent n (2 = free space) */
  var TERRAIN = [
    { v: '2.0', label: 'Open flat ground or water' },
    { v: '2.7', label: 'Rolling ground, light scrub' },
    { v: '3.3', label: 'Woodland, scattered trees' },
    { v: '4.0', label: 'Dense forest, jungle' },
    { v: '3.5', label: 'Suburban, low buildings' },
    { v: '4.3', label: 'Dense urban, high buildings' },
    { v: '5.0', label: 'Mountain / no line of sight' }
  ];

  /* ══ range calculator ═════════════════════════════════════════════════ */

  /* The band row, built once and used by every view on this tab.

     It has to be built OUTSIDE the range calculator, because Greyline replaces
     that calculator rather than sitting inside it. The first version returned
     early into the greyline page before the row was created, which drew a page
     with no way off it: pick Greyline and the band chips vanished along with
     every route back to them. A chip row that can navigate you somewhere it
     cannot navigate you out of is a trap, so it is now drawn first, always,
     and the views hang underneath it. */
  function bandRow(st, save) {
    var row = A.UI.chips(
      BANDS.map(function (b) { return { id: b.id, label: b.label }; })
        .concat([{ id: 'greyline', label: 'Greyline' }]),
      st.band,
      function (id) {
        st.band = id;
        if (id !== 'greyline') {
          var b = bandOf(id);
          st.f = String(b.f); st.w = String(b.w);
        }
        save();
        A.Router.refresh();
      }
    );
    row.classList.add('wrap');
    return row;
  }

  function rangeTool(host) {
    var st0 = A.store.get('radio.range', {});
    /* Greyline is a chip in the same row as the bands but it is not a band: it
       is a different question about the same radio, so it takes the page over
       rather than tuning anything. The row still comes first. */
    if (st0.band === 'greyline') {
      var gcard = A.UI.card();
      gcard.appendChild(bandRow(st0, function () { A.store.set('radio.range', st0); }));
      host.appendChild(gcard);
      if (global.ArtGreyline) global.ArtGreyline.render(host);
      else host.appendChild(A.UI.empty('Greyline unavailable.'));
      return;
    }
    var st = A.store.get('radio.range', {
      band: 'pmr', f: '446', w: '0.5', h1: '1.5', h2: '1.5', s1: 'hand', s2: 'hand',
      gain: '2', sens: '-119', n: '2.7'
    });
    function save() { A.store.set('radio.range', st); }

    /* On Custom, the reference at the foot of the page follows the frequency
       being tuned: it shows the spectrum band it falls in and only the radios
       and services that actually reach that frequency, not the whole list. */
    var customRefHost = A.el('div');
    function paintCustomRef() {
      A.clear(customRefHost);
      var fMHz = A.parseNum(st.f);
      if (!(fMHz > 0)) return;
      customRefHost.appendChild(A.UI.section('At ' + fMHz + ' MHz'));

      if (global.ArtSpectrum) {
        var b = global.ArtSpectrum.bandFor(fMHz * 1e6);
        var sc = A.UI.card(null, 'tight');
        sc.appendChild(A.UI.metric('Spectrum band', b.n, { icon: 'radio' }));
        sc.appendChild(A.UI.metric('Wavelength', global.ArtSpectrum.fmtWave(299792458 / (fMHz * 1e6)),
          { sub: 'a quarter-wave antenna is ' + global.ArtSpectrum.fmtWave(299792458 / (fMHz * 1e6) / 4) + ' long' }));
        sc.appendChild(A.UI.metric('What is here', b.uses));
        customRefHost.appendChild(sc);
      }

      var hits = [];
      FREQ_GROUPS.forEach(function (grp) {
        grp.rows.forEach(function (r) { if (rowMatchesFreq(r, fMHz)) hits.push(r); });
      });
      if (hits.length) {
        customRefHost.appendChild(A.UI.section('Radios and services that reach this frequency'));
        hits.forEach(function (r) { customRefHost.appendChild(freqCard(r)); });
      } else {
        customRefHost.appendChild(A.UI.note('No common allocation is listed at exactly this frequency. It may be a government, licensed or unallocated slice; the band chart on the Spectrum tab shows what class of use the surrounding band carries.'));
      }
      customRefHost.appendChild(A.UI.note(FREQ_NOTE));
    }

    var card = A.UI.card();

    /* band preset chips: picking one tunes to that radio's spectrum and
       stays inside it */
    card.appendChild(bandRow(st, save));

    /* ── the tuning face ──
       A frequency readout drawn like a set: big segment-style digits, the
       band name and its legal slice underneath, an arrow either side that
       steps one channel. The arrows respect the band edges; only Custom is
       free to walk the whole spectrum. */
    var face = A.el('.rx-face');
    var freqEl = A.el('.rx-freq');
    var subEl = A.el('.rx-sub');

    function clampF(v) {
      var b = bandOf(st.band);
      if (!isFinite(v)) v = b.f;
      return Math.min(b.hi, Math.max(b.lo, v));
    }
    function setF(v, fromType) {
      var b = bandOf(st.band);
      if (!fromType) {
        /* snap onto the band's channel raster relative to its bottom edge */
        v = b.lo + Math.round((v - b.lo) / b.step) * b.step;
      }
      st.f = String(Math.round(clampF(v) * 1e5) / 1e5);
      save();
      paintFace();
      calc();
    }
    function paintFace() {
      var b = bandOf(st.band);
      var f = A.parseNum(st.f);
      freqEl.textContent = isFinite(f) ? f.toFixed(f < 100 ? 4 : 3) : '000.000';
      subEl.textContent = b.id === 'custom'
        ? 'CUSTOM · 0.01 - 47 000 MHz · free tuning'
        : b.label.toUpperCase() + ' · ' + b.lo + ' - ' + b.hi + ' MHz';
      if (freqIn) freqIn.input.value = st.f;
      if (st.band === 'custom') paintCustomRef();
    }

    var downBtn = A.el('button.rx-arrow', { html: Icons.svg('back'), onclick: function () {
      A.haptic(); setF(A.parseNum(st.f) - bandOf(st.band).step);
    } });
    var upBtn = A.el('button.rx-arrow', { html: Icons.svg('chevron'), onclick: function () {
      A.haptic(); setF(A.parseNum(st.f) + bandOf(st.band).step);
    } });
    var mid = A.el('.rx-mid');
    var line = A.el('.rx-line');
    line.appendChild(freqEl);
    line.appendChild(A.el('.rx-unit', { text: 'MHz' }));
    mid.appendChild(line);
    mid.appendChild(subEl);
    face.appendChild(downBtn);
    face.appendChild(mid);
    face.appendChild(upBtn);
    card.appendChild(face);

    var freqIn = A.UI.field({
      label: 'Frequency (type or step with the arrows)', inputmode: 'decimal', suffix: 'MHz', value: st.f,
      oninput: function (e) {
        var v = A.parseNum(e.target.value);
        if (!isFinite(v)) return;
        var b = bandOf(st.band);
        /* typing outside the selected radio's band snaps back to its edge;
           to roam free, that is what Custom is for */
        if (v < b.lo || v > b.hi) { setF(v); e.target.value = st.f; }
        else { st.f = String(v); save(); paintFace(); calc(); }
      }
    });
    card.appendChild(freqIn);
    card.appendChild(A.UI.field({
      label: 'Transmit power', inputmode: 'decimal', suffix: 'W', value: st.w,
      oninput: function (e) { st.w = e.target.value; save(); calc(); }
    }));

    /* pick how each end is carried and the height fills itself in */
    var srow = A.el('.split');
    srow.appendChild(A.UI.select({
      label: 'Your station', value: st.s1,
      options: STATIONS.map(function (x) { return { value: x.id, label: x.n + '  (' + x.h + ' m)' }; }),
      onchange: function (e) {
        st.s1 = e.target.value; st.h1 = String(stationOf(st.s1).h); save(); A.Router.refresh();
      }
    }));
    srow.appendChild(A.UI.select({
      label: 'Their station', value: st.s2,
      options: STATIONS.map(function (x) { return { value: x.id, label: x.n + '  (' + x.h + ' m)' }; }),
      onchange: function (e) {
        st.s2 = e.target.value; st.h2 = String(stationOf(st.s2).h); save(); A.Router.refresh();
      }
    }));
    card.appendChild(srow);

    var hrow = A.el('.split');
    hrow.appendChild(A.UI.field({
      label: 'Your antenna height', inputmode: 'decimal', suffix: 'm', value: st.h1,
      oninput: function (e) { st.h1 = e.target.value; st.s1 = ''; save(); calc(); }
    }));
    hrow.appendChild(A.UI.field({
      label: 'Their antenna height', inputmode: 'decimal', suffix: 'm', value: st.h2,
      oninput: function (e) { st.h2 = e.target.value; st.s2 = ''; save(); calc(); }
    }));
    card.appendChild(hrow);

    card.appendChild(A.UI.select({
      label: 'Terrain between the two',
      value: st.n,
      options: TERRAIN.map(function (t) { return { value: t.v, label: t.label }; }),
      onchange: function (e) { st.n = e.target.value; save(); calc(); }
    }));

    var arow = A.el('.split');
    arow.appendChild(A.UI.field({
      label: 'Antenna gain, each end', inputmode: 'decimal', suffix: 'dBi', value: st.gain,
      oninput: function (e) { st.gain = e.target.value; save(); calc(); }
    }));
    arow.appendChild(A.UI.field({
      label: 'Receiver sensitivity', inputmode: 'decimal', suffix: 'dBm', value: st.sens,
      hint: 'Handheld ≈ −119, a good base ≈ −122',
      oninput: function (e) { st.sens = e.target.value; save(); calc(); }
    }));
    card.appendChild(arow);

    var out = A.el('div');
    card.appendChild(out);
    host.appendChild(card);
    host.appendChild(A.UI.note(
      'A planning estimate, not a promise. The shorter of two limits wins: line of sight set by antenna height and ' +
      'the curve of the earth, and signal set by power, frequency and the terrain in between. A real radio check on ' +
      'the ground is worth more than any calculation.'));

    function calc() {
      A.clear(out);
      var f = A.parseNum(st.f), w = A.parseNum(st.w);
      var h1 = A.parseNum(st.h1), h2 = A.parseNum(st.h2);
      var gain = A.parseNum(st.gain), sens = A.parseNum(st.sens), n = A.parseNum(st.n);
      if (!(f > 0) || !(w > 0)) { out.appendChild(A.UI.note('Enter a frequency and a transmit power above zero.')); return; }
      if (!(h1 > 0)) h1 = 0.01; if (!(h2 > 0)) h2 = 0.01;
      if (!isFinite(gain)) gain = 0; if (!isFinite(sens)) sens = -119;
      if (!(n >= 2)) n = 2;

      /* radio horizon, 4/3 earth, km -> m */
      var horizon = 4.12 * (Math.sqrt(h1) + Math.sqrt(h2)) * 1000;

      /* link budget: max path loss the link can stand, then solve for distance
         PL(dB) = 20log10(f_MHz) + 10 n log10(d_m) - 27.55   (=FSPL at n=2) */
      var ptxdBm = 10 * log10(w * 1000);         /* W -> mW -> dBm */
      var maxPL = ptxdBm + 2 * gain - sens;      /* gain at both ends */
      var link = Math.pow(10, (maxPL - 20 * log10(f) + 27.55) / (10 * n));

      var range = Math.min(horizon, link);
      var limitedBy = link < horizon ? 'signal and terrain' : 'line of sight';
      var lambda = 299.792458 / f;               /* metres */

      out.appendChild(A.UI.section('Estimated range'));
      var rc = A.UI.card(null, 'tight');
      rc.appendChild(A.UI.metric('Practical range', A.U.fmtRange(range, { sig: 3 }),
        { big: true, icon: 'radio', sub: 'Limited by ' + limitedBy }));
      var hz = A.UI.metric('Radio horizon (line of sight)', A.U.fmtRange(horizon, { sig: 3 }),
        { icon: limitedBy === 'line of sight' ? 'warn' : 'check' });
      rc.appendChild(hz);
      var lk = A.UI.metric('Signal-limited range', A.U.fmtRange(link, { sig: 3 }),
        { icon: limitedBy === 'signal and terrain' ? 'warn' : 'check' });
      rc.appendChild(lk);
      rc.appendChild(A.UI.metric('Transmit power', A.fmtNum(ptxdBm, 3) + ' dBm', { sub: A.fmtNum(w, 4) + ' W' }));
      rc.appendChild(A.UI.metric('Wavelength', A.U.fmtRange(lambda, { sig: 3 }),
        { sub: 'A quarter-wave whip is ' + A.U.fmtRange(lambda / 4, { sig: 3 }) + ' long' }));
      out.appendChild(rc);

      var tips = [];
      if (limitedBy === 'line of sight') {
        tips.push('You are horizon-limited, so more power will not help. Height will: raising either antenna extends ' +
          'range far more than watts. Get one end onto high ground or a mast.');
      } else {
        tips.push('You are signal-limited by the terrain, not by the horizon. A clearer path, a better antenna, or a ' +
          'relay part-way will help more than a taller mast.');
      }
      if (f >= 300) tips.push('At this frequency the signal is easily blocked by walls, vehicles and bodies but slips ' +
        'through small gaps and urban clutter. Good in towns, poor through dense forest.');
      else if (f < 50) tips.push('At HF/low-VHF the signal follows terrain and can bend over hills, and at HF it can ' +
        'bounce off the ionosphere for very long range, which no line-of-sight model captures.');
      out.appendChild(A.UI.note(tips.join(' ')));
    }

    paintFace();
    calc();

    /* the band's own reference, at the foot of its page */
    if (st.band === 'custom') { host.appendChild(customRefHost); paintCustomRef(); }
    else bandInfoBlock(host, st.band);
  }

  /* does a reference row's frequency column cover this MHz value? Handles
     "446 MHz", "30-88 MHz FM", "1176 / 1575 MHz", "7-8, 20-45 GHz (L to Ka)". */
  function rowMatchesFreq(r, fMHz) {
    var s = r[1];
    var mult = /GHz/i.test(s) ? 1000 : (/kHz/i.test(s) ? 0.001 : 1);
    var ok = false, re = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/g, m, hadRange = false;
    while ((m = re.exec(s))) {
      hadRange = true;
      var lo = parseFloat(m[1]) * mult, hi = parseFloat(m[2]) * mult;
      if (fMHz >= lo * 0.999 && fMHz <= hi * 1.001) ok = true;
    }
    if (!ok) {
      (s.match(/\d+(?:\.\d+)?/g) || []).forEach(function (t) {
        var p = parseFloat(t) * mult;
        if (Math.abs(fMHz - p) <= Math.max(p * 0.01, 0.5)) ok = true;
      });
    }
    return ok;
  }

  /* ══ frequency reference ══════════════════════════════════════════════ */

  /* [band, freq text, use, licence, range note] */
  var FREQ_GROUPS = [
    { g: 'Licence-free handheld', rows: [
      ['PMR446', '446.0-446.2 MHz FM', 'Europe/UK licence-free walkie-talkie, 16 channels', 'None, 0.5 W max, fixed antenna', 'A few hundred metres in town, a few km open, line of sight'],
      ['FRS', '462 / 467 MHz FM', 'US/Canada family radio, 22 channels shared with GMRS', 'None, up to 2 W', 'Similar to PMR446, up to a few km open ground'],
      ['MURS', '151 / 154 MHz FM', 'US licence-free VHF, 5 channels', 'None, 2 W max', 'Better through woodland than 446 MHz for the same power'],
      ['CB 27', '26.9-27.4 MHz AM/SSB', 'Citizens band, 40 channels, road and site use', 'None in most countries, 4 W AM / 12 W SSB', 'Several km, and freak long-distance "skip" when the band opens']
    ]},
    { g: 'Licensed voice', rows: [
      ['GMRS', '462 / 467 MHz FM', 'US general mobile radio, repeaters allowed', 'Licence, no exam, up to 50 W', 'Tens of km through a repeater on high ground'],
      ['Ham 2 m', '144-148 MHz FM/SSB', 'Amateur VHF, the workhorse band', 'Amateur licence with exam', 'Line of sight direct, hundreds of km via repeaters and lifts'],
      ['Ham 70 cm', '430-440 MHz FM/SSB', 'Amateur UHF, good in towns and buildings', 'Amateur licence with exam', 'Line of sight, excellent through urban clutter and repeaters'],
      ['Ham HF', '3-30 MHz SSB/CW', 'Amateur HF, 80/40/20/15/10 m bands', 'Amateur licence with exam', 'Regional to worldwide by ionospheric skip, no line of sight needed']
    ]},
    { g: 'Professional & service', rows: [
      ['Marine VHF', '156-162 MHz FM', 'Ship, port and coast, Ch 16 is distress/calling', 'Ship station licence, 1 or 25 W', 'Ship to ship ~ line of sight, ship to shore tens of km'],
      ['Airband', '118-137 MHz AM', 'Civil aviation voice, AM not FM', 'Aircraft/ground station licence', 'Air to ground can be hundreds of km from altitude'],
      ['TETRA', '380-400 MHz', 'Encrypted digital trunked radio for police and services', 'Licensed network only', 'Network coverage, wide-area through infrastructure'],
      ['PMR / business', '136-174, 400-470 MHz', 'Licensed business two-way, analogue or DMR', 'Business radio licence', 'Local to wide-area with repeaters']
    ]},
    { g: 'Data, IoT & consumer', rows: [
      ['LoRa', '433 / 868 / 915 MHz', 'Long-range low-rate telemetry and tracking', 'Licence-free ISM, low duty cycle', 'Several km urban, tens of km rural line of sight, tiny data only'],
      ['ISM 2.4 GHz', '2400-2483 MHz', 'Wi-Fi, Bluetooth, drone control and video', 'Licence-free, 100 mW (EU)', 'Tens of metres indoors, km line of sight with directional antennas'],
      ['Cellular', '700-2600 MHz', 'GSM/LTE/5G phone and data', 'Carrier network, no user licence', 'Cell coverage; depends entirely on the nearest mast'],
      ['GPS / GNSS', '1176 / 1575 MHz', 'Satellite positioning, receive only', 'None, receive only', 'Global, needs a clear view of the sky']
    ]},
    { g: 'Military & tactical bands', rows: [
      ['Tactical HF', '2-30 MHz SSB/ALE', 'Long-range ground net, beyond line of sight, NVIS for over-hills', 'Military allocation', 'Regional to intercontinental by skywave, terrain no obstacle'],
      ['Combat net VHF', '30-88 MHz FM', 'The infantry/vehicle band: SINCGARS, PR4G, frequency-hopping', 'Military allocation', 'A few to tens of km, ground wave, defeats terrain better than UHF'],
      ['VHF air / tactical', '108-156 MHz', 'Ground-to-air and range control alongside civil aviation', 'Military allocation', 'Line of sight, long from altitude'],
      ['UHF military air', '225-400 MHz AM', 'NATO air-to-air and air-to-ground voice, the primary combat aircraft band', 'Military allocation', 'Line of sight, hundreds of km air to air'],
      ['UHF TACSAT', '240-318 MHz', 'Narrowband satellite voice/data, manpack to satellite', 'Military satellite access', 'Beyond line of sight via satellite, worldwide with a channel'],
      ['L-band data link', '960-1215 MHz', 'Link 16 / JTIDS/MIDS tactical data, frequency-hopping and jam-resistant', 'Military network', 'Line of sight between terminals, relayed across a force'],
      ['SHF / Ka satcom', '7-8, 20-45 GHz', 'Wideband military satellite trunk (WGS, MILSTAR, Skynet)', 'Military satellite', 'Global via satellite, needs a dish and a clear sky'],
      ['Radar bands', '1-40 GHz (L to Ka)', 'Search, track, fire-control and weather radar, not voice', 'Military / regulated', 'Detection tens to hundreds of km depending on band and target']
    ]}
  ];

  /* which reference row belongs to which tuning band */
  var BAND_INFO = { pmr: 'PMR446', frs: 'FRS', gmrs: 'GMRS', murs: 'MURS', cb: 'CB 27',
                    marine: 'Marine VHF', air: 'Airband', ham2m: 'Ham 2 m', ham70: 'Ham 70 cm',
                    hamhf: 'Ham HF', tetra: 'TETRA', lora: 'LoRa' };

  function freqCard(r) {
    var c = A.UI.card(null, 'tight');
    var head = A.el('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' } });
    head.appendChild(A.el('b', { text: r[0], style: { fontSize: '14px' } }));
    head.appendChild(A.el('span', { text: r[1], style: { color: 'var(--acc)', fontFamily: 'var(--mono)', fontSize: '12px' } }));
    c.appendChild(head);
    c.appendChild(A.UI.metric('Use', r[2]));
    c.appendChild(A.UI.metric('Licence', r[3]));
    c.appendChild(A.UI.metric('Range', r[4]));
    return c;
  }

  var FREQ_NOTE =
    'Bands, allocations and power limits differ by country: these are the common international patterns, not the law ' +
    'where you are. On any licence-free band the power and antenna limits are what keep it working for everyone, and ' +
    'they also keep you quiet: an over-powered signal is an offence and a direction-finding beacon at the same time. ' +
    'Never transmit on marine, aviation or service frequencies without the authority to, except a genuine emergency.';

  /* The band's own reference lives at the foot of its Range page: tune to
     PMR446 and everything about PMR446 is right there. Custom, bound to no
     single band, carries the whole reference instead. */
  function bandInfoBlock(host, bandId) {
    if (bandId === 'custom') {
      host.appendChild(A.UI.section('Band reference'));
      FREQ_GROUPS.forEach(function (grp) {
        host.appendChild(A.UI.section(grp.g));
        grp.rows.forEach(function (r) { host.appendChild(freqCard(r)); });
      });
      host.appendChild(A.UI.note(FREQ_NOTE));
      return;
    }
    var name = BAND_INFO[bandId];
    if (!name) return;
    var row = null;
    FREQ_GROUPS.forEach(function (grp) {
      grp.rows.forEach(function (r) { if (r[0] === name) row = r; });
    });
    if (!row) return;
    host.appendChild(A.UI.section('About ' + row[0]));
    host.appendChild(freqCard(row));
    host.appendChild(A.UI.note(FREQ_NOTE));
  }

  function freqTool(host) {
    FREQ_GROUPS.forEach(function (grp) {
      host.appendChild(A.UI.section(grp.g));
      grp.rows.forEach(function (r) {
        var c = A.UI.card(null, 'tight');
        var head = A.el('div', { style: { display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' } });
        head.appendChild(A.el('b', { text: r[0], style: { fontSize: '14px' } }));
        head.appendChild(A.el('span', { text: r[1], style: { color: 'var(--acc)', fontFamily: 'var(--mono)', fontSize: '12px' } }));
        c.appendChild(head);
        c.appendChild(A.UI.metric('Use', r[2]));
        c.appendChild(A.UI.metric('Licence', r[3]));
        c.appendChild(A.UI.metric('Range', r[4]));
        host.appendChild(c);
      });
    });
    host.appendChild(A.UI.note(
      'Bands, allocations and power limits differ by country: these are the common international patterns, not the law ' +
      'where you are. On any licence-free band the power and antenna limits are what keep it working for everyone, and ' +
      'they also keep you quiet: an over-powered signal is an offence and a direction-finding beacon at the same time. ' +
      'Never transmit on marine, aviation or service frequencies without the authority to, except a genuine emergency.'));
  }

  /* ══ radio models & channel tables ════════════════════════════════════ */

  /* The old "Radios" tab is now SPECTRUM, split in two: the full electromagnetic
     spectrum, and the radio models with their channel tables. */
  function radiosTool(host) {
    var sub = A.store.get('radio.spectab', 'spectrum');
    if (sub !== 'radios') sub = 'spectrum';
    host.appendChild(A.UI.chips(
      [{ id: 'spectrum', label: 'Spectrum' }, { id: 'radios', label: 'Radios' }],
      sub,
      function (id) { A.store.set('radio.spectab', id); A.clear(host); radiosTool(host); }
    ));
    var body = A.el('div');
    host.appendChild(body);
    if (sub === 'spectrum') {
      if (global.ArtSpectrum) global.ArtSpectrum.render(body, { store: 'radio.spectrum' });
      else body.appendChild(A.UI.empty('Spectrum data unavailable.'));
    } else {
      radioModelsTool(body);
    }
  }

  function radioModelsTool(host) {
    var DB = global.ALGOZ_RADIO_MODELS;
    if (!DB) { host.appendChild(A.UI.empty('Model data not loaded.')); return; }

    var results = A.el('div');
    host.appendChild(A.UI.search('Filter models (UV-5R, TETRA, marine…)', function (q) { paint(q); }));
    host.appendChild(results);

    /* every card collapses. State persists so a reopened page stays how it was
       left; a live search forces the matching groups open. */
    var openMap = A.store.get('radio.modopen', {});
    var lastQ = '';
    function isOpen(k, dflt) { return openMap[k] == null ? dflt : openMap[k]; }

    /* each card toggles its own body IN PLACE. Rebuilding the whole list on a
       collapse empties the container, its height drops and the scroller jumps
       to the top; showing/hiding one body leaves the scroll where it is. */
    function collapsible(k, dflt, title, sub, build) {
      var card = A.UI.card(null, 'tight');
      var chev = A.el('span.spec-chev');
      var head = A.el('button.rad-head');
      var lab = A.el('span', null, [ A.el('span', { text: title, style: { fontWeight: '700', fontSize: '13.5px' } }) ]);
      if (sub) lab.appendChild(A.el('span', { text: '  ' + sub, style: { color: 'var(--muted)', fontSize: '11px' } }));
      head.appendChild(lab);
      head.appendChild(chev);
      card.appendChild(head);
      var body = A.el('div');
      build(body);
      card.appendChild(body);
      var open = isOpen(k, dflt);
      function apply() { body.style.display = open ? 'block' : 'none'; chev.textContent = open ? '−' : '+'; }
      apply();
      head.addEventListener('click', function () { open = !open; openMap[k] = open; A.store.set('radio.modopen', openMap); apply(); });
      return card;
    }

    function chTable(key) {
      var t = DB.CH[key];
      if (!t) return null;
      return collapsible('ch:' + key, false, t.n, null, function (card) {
        var grid = A.el('.ch-grid', { style: { marginTop: '8px' } });
        t.rows.forEach(function (r) {
          var cell = A.el('.ch-cell');
          cell.appendChild(A.el('.ch-no', { text: String(r[0]) }));
          cell.appendChild(A.el('.ch-f', { text: r[1].toFixed(r[1] < 100 ? 4 : 3) }));
          grid.appendChild(cell);
        });
        card.appendChild(grid);
        if (t.note) card.appendChild(A.el('.note', { text: t.note, style: { marginTop: '8px' } }));
      });
    }

    function paint(q) {
      A.clear(results);
      q = (q || '').trim().toLowerCase();
      lastQ = q;

      if (!q) {
        results.appendChild(A.UI.section('Channel tables'));
        Object.keys(DB.CH).forEach(function (k) { results.appendChild(chTable(k)); });
      }

      var shownAny = false;
      DB.MODELS.forEach(function (grp) {
        var items = grp.items.filter(function (m) {
          return !q || A.skey(grp.brand + ' ' + m[0] + ' ' + (m[3] || '') + ' ' + (m[4] || '')).indexOf(A.skey(q)) >= 0;
        });
        if (!items.length) return;
        if (!shownAny) results.appendChild(A.UI.section('Radio models'));
        shownAny = true;
        /* a search forces the group open; otherwise remember the reader's choice */
        results.appendChild(collapsible('br:' + grp.brand, !!q, grp.brand, items.length + ' set' + (items.length > 1 ? 's' : ''), function (card) {
          var inner = A.el('div', { style: { marginTop: '8px' } });
          items.forEach(function (m) {
            var d = A.el('.defn');
            var head = A.el('.defn-t', null, [
              A.el('span', { text: m[0] }),
              A.el('span', { text: '  ' + m[1], style: { color: 'var(--muted)', fontWeight: '400', fontSize: '11px' } }),
              m[2] ? A.el('span.tag.acc', { text: DB.CH[m[2]] ? DB.CH[m[2]].n.split(' - ')[0] : m[2], style: { marginLeft: '7px' } }) : null
            ]);
            d.appendChild(head);
            /* the band the set can physically reach, given its own line because
               it is the first thing you check when asking whether two radios
               can possibly hear each other */
            if (m[4]) d.appendChild(A.el('.defn-b', {
              text: m[4],
              style: { color: 'var(--acc)', fontVariantNumeric: 'tabular-nums' }
            }));
            d.appendChild(A.el('.defn-b', { text: m[3] || '' }));
            inner.appendChild(d);
          });
          card.appendChild(inner);
        }));
      });
      if (!shownAny && q) results.appendChild(A.UI.empty('No model matches that.'));

      /* ── emergency frequencies ──
         Below the sets, because you look up a radio far more often than you
         look up a distress frequency - but when you do want one, you want it
         without a network. A search reaches into the boards and opens the ones
         that match. */
      var emShown = false;
      EMERG.forEach(function (g) {
        var hit = !q || A.skey(g.n + ' ' + (g.s || '') + ' ' + g.rows.map(function (r) {
          return r[0] + ' ' + r[1];
        }).join(' ')).indexOf(A.skey(q)) >= 0;
        if (!hit) return;
        if (!emShown) results.appendChild(A.UI.section('Emergency and Distress'));
        emShown = true;
        results.appendChild(collapsible('em:' + g.k, !!q, g.n, g.s, function (card) {
          if (g.note) card.appendChild(A.el('.note', { text: g.note, style: { marginTop: '8px' } }));
          var box = A.el('div', { style: { marginTop: '8px' } });
          g.rows.forEach(function (r) {
            var d = A.el('.defn');
            d.appendChild(A.el('.defn-t', null, [A.el('span', { text: r[0] })]));
            d.appendChild(A.el('.defn-b', { text: r[1] }));
            box.appendChild(d);
          });
          card.appendChild(box);
          if (g.warn) card.appendChild(A.el('.note.note-warn', {
            text: g.warn, style: { marginTop: '10px' }
          }));
        }));
      });
      if (emShown && !q) results.appendChild(A.UI.note(
        'A frequency is only as good as the ear on the other end. Channel 16 is watched by ' +
        'coastguards and by every vessel underway; a handheld on a ridge is watched by nobody in ' +
        'particular. Use a telephone if a telephone will work, and a 406 MHz beacon if it will not.'));

      if (!q) results.appendChild(A.UI.note(
        'The common sets of the 2010-2020 decade, which is what turns up in kit bags, vehicles and markets today. ' +
        'A channelised set (PMR446, FRS, CB, marine) speaks the fixed table above; a programmable set speaks whatever ' +
        'was written into it, and the listed band is where it can physically go.'));
    }

    paint('');
  }


  /* ══ EMERGENCY FREQUENCIES ═══════════════════════════════════════════════

     WHAT IS HERE IS SOURCED, AND WHAT IS NOT SOURCED IS NOT HERE. Every entry
     below comes from the published international allocations rather than from
     memory, because a distress frequency that is nearly right is worse than no
     frequency at all: it puts a casualty's only call on an empty channel.

     Two things matter more than any number on this page.

     The first is that a frequency only works if somebody is listening on it.
     Channel 16 is watched by coastguards and by every vessel underway; a
     handheld on a hilltop is watched by nobody in particular. Reach for a
     telephone first if a telephone will work.

     The second is that the country-level detail changes and this is a field
     reference, not a signal book. Where an entry is specific to one country it
     says so. Where it is international it says that too. */

  var EMERG = [
    {
      k: 'intl', n: 'International distress', s: 'Watched everywhere, every country',
      note: 'THESE APPLY IN EVERY COUNTRY, and that is why there is no separate entry below for ' +
            'the United States, Europe or Russia: they use these. Channel 16, 2182 kHz, 121.5, ' +
            '243.0 and the 406 MHz beacon band are ITU allocations, identical in Maine, the ' +
            'Baltic, the Black Sea and the Sea of Okhotsk. What differs between countries is who ' +
            'answers and on which working channel they move you to, not the frequency you call ' +
            'on. A 406 MHz beacon is the one that reaches a satellite; the rest reach whoever is ' +
            'within range and awake.',
      rows: [
        ['406.0 to 406.1 MHz', 'Distress beacons: EPIRB at sea, ELT in aircraft, PLB on a person. Detected by the Cospas-Sarsat satellites. This is the one that works from anywhere.'],
        ['121.500 MHz', 'International aeronautical emergency, VHF Guard. Voice, and the homing signal of older beacons.'],
        ['243.000 MHz', 'Military aeronautical emergency, UHF Guard. NATO.'],
        ['156.800 MHz', 'Marine VHF channel 16. International distress, urgency, safety and calling, short range.'],
        ['156.525 MHz', 'Marine VHF channel 70. Digital selective calling distress, not voice.'],
        ['2182 kHz', 'MF maritime voice distress, medium range.']
      ],
      warn: 'SATELLITES NO LONGER LISTEN ON 121.5 OR 243 MHz. Processing of those beacon alerts ' +
            'was discontinued in 2009 and only 406 MHz reaches a satellite. Aircraft and ' +
            'ground stations still monitor 121.5 by ear, so it is far from useless, but a ' +
            '121.5 beacon alone will not raise a rescue centre from empty country.'
    },
    {
      k: 'sea', n: 'Maritime', s: 'Voice and DSC, by band',
      note: 'The HF sets carry when VHF cannot. Which one works depends on the hour and the ' +
            'distance: the low ones at night, the high ones by day.',
      rows: [
        ['4125 kHz', 'HF voice distress and safety'],
        ['6215 kHz', 'HF voice distress and safety'],
        ['8291 kHz', 'HF voice distress and safety'],
        ['12290 kHz', 'HF voice distress and safety'],
        ['16420 kHz', 'HF voice distress and safety'],
        ['2187.5 kHz', 'DSC distress watch'],
        ['4207.5 kHz', 'DSC distress watch'],
        ['6312 kHz', 'DSC distress watch'],
        ['8414.5 kHz', 'DSC distress watch'],
        ['12577 kHz', 'DSC distress watch'],
        ['16804.5 kHz', 'DSC distress watch']
      ],
      warn: 'The United States Coast Guard stopped monitoring 2182 kHz on 1 August 2013. Other ' +
            'administrations differ. Do not assume a listening watch on any MF or HF frequency ' +
            'in waters you do not know.'
    },
    {
      k: 'air', n: 'Aeronautical and search and rescue', s: 'On-scene coordination',
      note: 'The on-scene frequencies are where a rescue is actually run once it is under way, ' +
            'as opposed to where the alarm is raised.',
      rows: [
        ['121.500 MHz', 'Civil aircraft emergency, VHF Guard'],
        ['243.000 MHz', 'Military aircraft emergency, UHF Guard'],
        ['123.100 MHz', 'Aeronautical auxiliary: international voice for coordinated SAR'],
        ['282.800 MHz', 'Joint and combined on-scene voice and direction finding, NATO'],
        ['155.160 MHz', 'SAR coordination'],
        ['138.780 MHz', 'US military SAR on-scene and direction finding'],
        ['172.500 MHz', 'US Navy emergency sonobuoy communications and homing']
      ]
    },
    {
      k: 'mtn', n: 'Mountain, avalanche and alpine', s: 'Where a radio is not the first tool',
      note: 'In the mountains the transceiver on your chest matters more than any voice channel: ' +
            'a buried casualty has minutes, and nobody is going to talk them out.',
      rows: [
        ['457 kHz', 'Avalanche transceivers, worldwide. The international standard since 1986, tolerance ±80 Hz. Every beacon of every make works with every other on this one frequency.'],
        ['161.300 MHz, 123 Hz CTCSS', 'Switzerland: alpine emergency radio channel, the E-channel monitored by Rega and the cantonal rescue services.'],
        ['158.625 MHz', 'Austria: mountain rescue working channel, Bergrettung.'],
        ['161.275 MHz', 'Switzerland: secondary alpine rescue and hut channel.'],
        ['150.050 MHz', 'Italy: Soccorso Alpino regional working frequency, allocation varies by province.'],
        ['161.150 MHz', 'France: Secours en Montagne and PGHM working channel in several massifs.'],
        ['446.00625 to 446.09375 MHz', 'PMR446: what a walking party actually carries. No rescue service listens here, but it keeps your own group together, which prevents most call-outs.']
      ],
      warn: 'THE ALPINE DISTRESS SIGNAL NEEDS NO RADIO. Six signals spread over one minute, then ' +
            'a minute of silence, then repeat. Any signal will do: shouts, whistle blasts, a ' +
            'torch, a mirror, banging metal. The reply is THREE signals in a minute, so if you ' +
            'get three back you have been seen. Low sounds carry further than high ones.'
    },
    {
      k: 'cb', n: 'Citizens band and licence-free', s: 'What people actually carry',
      note: 'Nobody is required to monitor any of these. They work because other people happen ' +
            'to be listening, which in a populated area is often enough and in empty country is ' +
            'often not.',
      rows: [
        ['27.065 MHz', 'CB channel 9: emergency, general'],
        ['27.185 MHz', 'CB channel 19: road and highway, where the traffic is'],
        ['476.525 and 477.275 MHz', 'UHF CB emergency, Australia only'],
        ['462.675 MHz', 'GMRS emergency and travel assistance, Alaska and Canada'],
        ['462.5625 to 462.6750 MHz', 'Family Radio Service, United States'],
        ['151.940 MHz', 'MURS, United States only'],
        ['446.00625 to 446.09375 MHz', 'PMR446, Europe']
      ]
    },
    {
      k: 'ham', n: 'Amateur calling frequencies', s: 'Where to shout on VHF and UHF',
      note: 'These are CALLING frequencies, not distress frequencies: you call on them and then ' +
            'move off. In an emergency that distinction stops mattering. Licensed operators ' +
            'monitor them out of habit, which is exactly what you want.',
      rows: [
        ['145.500 MHz', '2 m calling, Europe'],
        ['146.520 MHz', '2 m calling, United States and Canada'],
        ['145.000 MHz', '2 m calling, India, Indonesia, Thailand'],
        ['144.740 MHz', '2 m calling, Philippines'],
        ['433.500 MHz', '70 cm calling, Europe'],
        ['446.000 MHz', '70 cm calling, United States'],
        ['223.500 MHz', '1.25 m calling, United States'],
        ['70.450 MHz', '4 m calling, Europe']
      ],
      warn: 'The HF emergency centres of activity differ by IARU region and by band, and they ' +
            'move. They are not listed here because a wrong HF frequency wastes the one call ' +
            'you may get. Take them from your own society\'s current band plan.'
    },
    {
      k: 'wx', n: 'Weather and safety broadcasts', s: 'Listening, not calling',
      note: 'These carry forecasts, gale warnings and navigational warnings. You do not transmit ' +
            'on any of them.',
      rows: [
        ['162.400 MHz', 'NOAA Weather Radio, channel 1. United States and Canada'],
        ['162.425 MHz', 'NOAA Weather Radio, channel 2'],
        ['162.450 MHz', 'NOAA Weather Radio, channel 3'],
        ['162.475 MHz', 'NOAA Weather Radio, channel 4'],
        ['162.500 MHz', 'NOAA Weather Radio, channel 5'],
        ['162.525 MHz', 'NOAA Weather Radio, channel 6'],
        ['162.550 MHz', 'NOAA Weather Radio, channel 7'],
        ['518 kHz', 'NAVTEX international: navigational and weather warnings, in English'],
        ['490 kHz', 'NAVTEX national: the same service in the local language'],
        ['4209.5 kHz', 'NAVTEX, tropical and long range'],
        ['Marine VHF ch 16', 'Coast stations announce the forecast here, then send it on a working channel']
      ],
      warn: 'HF weatherfax and voice forecast schedules are set by each country and change. Get ' +
            'the current schedule for the water you are on rather than trusting a list; this ' +
            'page does not print one for that reason.'
    },
    {
      k: 'marine', n: 'International marine VHF', s: 'What each channel is for',
      note: 'The marine VHF plan is international: channel 16 means the same thing in every ' +
            'ocean, which is the whole point of it. Simplex channels talk ship to ship; duplex ' +
            'channels reach a coast station and are the ones a handheld often cannot work.',
      rows: [
        ['Ch 16, 156.800 MHz', 'DISTRESS, URGENCY, SAFETY AND CALLING. Watched by coastguards and by every vessel underway. Make the call here, then move to a working channel.'],
        ['Ch 70, 156.525 MHz', 'Digital selective calling. DATA ONLY: never speak on 70. The red button on a DSC set transmits your identity and position here.'],
        ['Ch 06, 156.300 MHz', 'Ship to ship safety, and the primary on-scene channel for search and rescue coordination.'],
        ['Ch 13, 156.650 MHz', 'Bridge to bridge navigation safety. The channel you use to agree a passing with another vessel.'],
        ['Ch 09, 156.450 MHz', 'Secondary calling in some countries, and the boater calling channel in the United States.'],
        ['Ch 67, 156.375 MHz', 'Small craft safety in the United Kingdom, working channel elsewhere.'],
        ['Ch 72, 156.625 MHz', 'Ship to ship only, one of the common chat and convoy channels.'],
        ['Ch 77, 156.875 MHz', 'Ship to ship only, low power, common for marina and tender traffic.'],
        ['Ch 15 and 17', 'One watt only, on-board communications. Deliberately short range.'],
        ['Ch 10, 156.500 MHz', 'Pollution response and inter-ship working. Coastguard traffic in several countries.'],
        ['Ch 12 and 14', 'Port operations and vessel traffic services. Talk to harbour control here, not on 16.'],
        ['Ch 68, 69, 71, 73, 78', 'General working and marina channels, allocation varies by country.'],
        ['Ch 87 and 88', 'AIS data in most of the world (161.975 and 162.025 MHz). Not for voice.']
      ],
      warn: 'CHANNEL NUMBERS ARE INTERNATIONAL BUT THE POWER AND DUPLEX RULES ARE NOT. A ' +
            'handheld at 5 W is a different animal from a 25 W masthead set, and some channels ' +
            'are simplex in one country and duplex in another. Never transmit on a working ' +
            'channel you have not established is in use for that purpose where you are.'
    },
    {
      k: 'natl', n: 'National and regional channels', s: 'What each country adds on top',
      note: 'THE INTERNATIONAL ALLOCATIONS ABOVE ALREADY COVER EVERY COUNTRY, including the ones ' +
            'listed here. This board is what each country adds ALONGSIDE them: the extra channel ' +
            'a coastguard actually works on, the CB channel people really carry, the band a ' +
            'national service monitors. Nothing here replaces channel 16 or a 406 MHz beacon.',
      rows: [
        /* ── United States and Canada ── */
        ['United States, 156.800 MHz', 'Marine VHF 16, continuous USCG watch. Rescue 21 covers the coast, the Great Lakes and Alaska; the shore stations direction-find on your transmission.'],
        ['United States, 157.100 MHz', 'Marine VHF channel 22A: the USCG working channel. Sixteen raises them, 22A is where the conversation continues.'],
        ['United States, 162.400 to 162.550 MHz', 'NOAA Weather Radio, seven channels, with the alert tone that wakes a receiver for a warning.'],
        ['United States, 27.065 MHz', 'CB channel 9, the emergency channel. Monitored by some volunteer groups and highway patrols, by nobody as a duty.'],
        ['United States, 462.675 MHz', 'GMRS channel 20, the travel and emergency assistance convention.'],
        ['Canada, 157.100 MHz', 'Marine VHF 22A, Canadian Coast Guard working channel, with continuous 16 watch.'],
        /* ── Europe ── */
        ['Europe, 156.800 MHz', 'Marine VHF 16, watched by every coastguard from Norway to Cyprus. DSC on channel 70 is the primary alerting method under GMDSS.'],
        ['Europe, 112', 'Not a radio frequency: the single emergency number across the EU and most of the rest of Europe. Reaches a dispatcher wherever there is any network at all.'],
        ['Europe, 446.00625 to 446.09375 MHz', 'PMR446, licence-free across the EU. No service listens, but it is what a walking party or a work crew is carrying.'],
        ['Europe, 169.4 to 169.8 MHz', 'Reserved across the EU for assistive and alarm systems, including some avalanche and personal alerting equipment.'],
        ['United Kingdom, 156.800 MHz', 'Marine VHF 16, HM Coastguard, with channel 67 as the small-craft safety working channel.'],
        ['Germany, 156.800 MHz', 'Marine VHF 16 with DGzRS; inland waterways add channel 10 for ship-to-ship on the Rhine and the canals.'],
        /* ── Russia and the CIS ── */
        ['Russia, 156.800 MHz', 'Marine VHF 16 and DSC channel 70, watched by the maritime rescue coordination centres on all four fleets.'],
        ['Russia, 2182 kHz', 'MF voice distress, still important on the Northern Sea Route and in the Far East where VHF coverage runs out.'],
        ['Russia, 121.500 MHz', 'Aeronautical emergency, monitored by civil and military ATC as elsewhere.'],
        ['Russia, 27.135 MHz', 'CB channel 15 AM, the informal road and long-distance driver channel across the CIS. Channel 9 is the emergency convention.'],
        ['Russia, 433 MHz LPD and 446 MHz PMR', 'Licence-free handhelds in common civilian use; no service monitors either.'],
        /* ── the rest ── */
        ['Australia, 476.525 MHz', 'UHF CB channel 5: emergency, repeater output. Channel 35 is its input. Reserved for emergency use by law.'],
        ['Australia, 477.400 MHz', 'UHF CB channel 40: the road and highway channel, where the truck traffic is.'],
        ['Australia, 27.880 MHz', 'HF CB channel 8, still used for outback and remote-station traffic.'],
        ['New Zealand, 156.800 MHz', 'Marine VHF 16, distress and calling. Maritime Radio keeps a continuous watch.'],
        ['New Zealand, 157.050 MHz', 'Marine VHF channel 60 and 61: coastguard working channels in many regions.'],
        ['Japan, 156.800 MHz', 'Marine VHF 16, watched by the Japan Coast Guard.'],
        ['Japan, 27.524 MHz', 'Fishing and small-craft band; 40 MHz and 150 MHz coastal bands are also in service.'],
        ['China, 156.800 MHz', 'Marine VHF 16. China MSA maintains the coastal distress watch.'],
        ['China, 2182 kHz', 'MF voice distress, still monitored on parts of the coast.'],
        ['South Korea, 156.800 MHz', 'Marine VHF 16, Korea Coast Guard.'],
        ['India, 156.800 MHz', 'Marine VHF 16, Indian Coast Guard, with 2182 kHz on the MF band.'],
        ['Indonesia and Philippines, 156.800 MHz', 'Marine VHF 16 is the practical distress channel across the archipelagos.'],
        ['Thailand and Vietnam, 156.800 MHz', 'Marine VHF 16, with 7903 kHz and 8294 kHz used regionally on HF.'],
        ['Brazil, 156.800 MHz', 'Marine VHF 16, watched by the Navy coastal stations.'],
        ['Brazil, 27.065 MHz', 'CB channel 9 is the emergency channel; CB is heavily used inland.'],
        ['Argentina and Chile, 156.800 MHz', 'Marine VHF 16, Prefectura Naval and Armada de Chile respectively.'],
        ['Chile, 2182 kHz', 'MF distress, important along the fjords and the far south.'],
        ['South America, 155.475 MHz', 'Common inter-agency and rescue coordination VHF in several countries.'],
        ['South Africa, 156.800 MHz', 'Marine VHF 16, NSRI and the Maritime Rescue Coordination Centre.'],
        ['Canada, 156.800 and 157.100 MHz', 'Marine VHF 16 and channel 22A, the Canadian Coast Guard working channel.']
      ],
      warn: 'A CHANNEL IS NOT A WATCH. Several of these are the right frequency and still have ' +
            'nobody listening at three in the morning a hundred miles offshore. Where the ground ' +
            'you are on has no coastal station and no coverage, the 406 MHz beacon is the only ' +
            'thing that reaches a rescue centre. Register it before you go.'
    },
    {
      k: 'proc', n: 'Distress messages, word for word', s: 'What to actually say',
      note: 'The words below are the international procedure. They exist so that a listener who ' +
            'shares no language with you still knows what they are hearing and what to write ' +
            'down. Say them slowly, say them twice, and give the position before anything else ' +
            'if you can only get one sentence out.',
      rows: [
        ['MAYDAY', 'GRAVE AND IMMINENT DANGER TO LIFE OR VESSEL, and you need immediate help. Spoken three times to open the call. Nothing else on the channel until the distress is over.'],
        ['PAN-PAN', 'URGENCY. A serious situation, but nobody is in immediate danger of death: engine failure in a shipping lane, a casualty who needs advice, a missing person. Spoken three times.'],
        ['SECURITE (say-cure-i-tay)', 'SAFETY. A navigational or weather warning: a container adrift, a light out, a gale coming. Spoken three times. You are informing, not asking.'],
        ['Maritime, the full call', 'MAYDAY MAYDAY MAYDAY. THIS IS (vessel name three times, callsign). MAYDAY (vessel name). MY POSITION IS (latitude and longitude, or bearing and distance from a known point). (Nature of distress.) (Assistance required.) (Number of people on board.) (Any other information.) OVER.'],
        ['Aeronautical, the full call', 'MAYDAY MAYDAY MAYDAY. (Station addressed.) (Aircraft callsign.) (Type of aircraft.) (Nature of emergency.) (Intentions.) (Position, level and heading.) (Pilot qualification.) (Any other useful information.)'],
        ['Land and vehicle', 'On a licence-free or CB channel there is no formal procedure, so use the maritime one: MAYDAY three times, who you are, where you are, what is wrong, what you need, how many of you. Give the position in a form a stranger can use: a road number and a landmark beats a grid reference nobody can plot.'],
        ['Mountain rescue', 'ALPINE DISTRESS SIGNAL: six signals in one minute, one minute silence, repeat. The answer is three signals in a minute. By radio or telephone: where you are, what happened, how many hurt and how badly, the weather and visibility where you stand, and whether you can move.'],
        ['Military and NATO', 'MAYDAY on Guard (121.5 or 243.0 MHz). A downed-aircrew or troops-in-contact call runs on the operation net using the format in orders. The nine-line medevac and the contact report are the two everyone should know by heart.'],
        ['If you hear a Mayday', 'Do not transmit. Write down everything: time, position, vessel or callsign, nature of distress. Listen to see whether a coast station or a nearer vessel answers. If nobody answers after a short pause, acknowledge and relay: MAYDAY RELAY MAYDAY RELAY MAYDAY RELAY, this is (you), followed by everything you copied.'],
        ['Cancelling', 'A distress you have resolved must be cancelled or a search will run for you. On the same channel: MAYDAY, all stations three times, this is (you), the distress at (time) is cancelled, over. The same applies to a beacon set off by mistake: report it, do not just switch it off.']
      ],
      warn: 'THE POSITION IS THE MESSAGE. Everything else can be worked out by the people coming ' +
            'for you; where you are cannot. If the transmission is breaking up, repeat the ' +
            'position and nothing else, over and over, until you are sure it was received.'
    }
  ];

  /* ══ comms planner ════════════════════════════════════════════════════ */

  /* a titled, wrapping description block. A.UI.metric keeps its value on one
     nowrap line, which is right for a number and wrong for a sentence: long
     text there pushes the card wider than the screen and slides sideways. */
  function defn(title, text) {
    var wrap = A.el('.defn');
    wrap.appendChild(A.el('.defn-t', { text: title }));
    wrap.appendChild(A.el('.defn-b', { text: text }));
    return wrap;
  }

  /* ── channel cards ──
     Little cards like the War Pigeon keys: a name, a frequency shown on a
     radio-style face with step arrows and direct entry, and a description.
     This is where a team writes the actual channels a PACE plan refers to. */
  function channelCards(host) {
    var chans = A.store.get('radio.chans', []);
    function saveChans() { A.store.set('radio.chans', chans); }
    function uid() { return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
    var CH_STEP = 0.005;   /* MHz per arrow tap */

    host.appendChild(A.UI.section('Channels'));

    var grid = A.el('.wp-keys');
    host.appendChild(grid);

    function paint() {
      A.clear(grid);
      chans.forEach(function (c, i) {
        var card = A.el('.wp-key.rx-card');

        var nameF = A.UI.field({
          label: null, value: c.name || '', placeholder: 'Name (e.g. Command)',
          oninput: function (e) { c.name = e.target.value; saveChans(); }
        });
        nameF.classList.add('wp-key-name');
        card.appendChild(nameF);

        /* the radio face: big frequency, MHz beside it, an arrow each side */
        var face = A.el('.rx-face.rx-face-sm');
        var freqEl = A.el('.rx-freq');
        function showF() {
          var f = A.parseNum(c.freq);
          freqEl.textContent = isFinite(f) ? f.toFixed(f < 100 ? 4 : 3) : '000.000';
          if (typeIn && typeIn.input) typeIn.input.value = c.freq || '';
        }
        function stepF(d) {
          var f = A.parseNum(c.freq); if (!isFinite(f)) f = 0;
          f = Math.max(0, Math.round((f + d) * 1e5) / 1e5);
          c.freq = String(f); saveChans(); showF();
        }
        face.appendChild(A.el('button.rx-arrow', { html: Icons.svg('back'), onclick: function () { A.haptic(); stepF(-CH_STEP); } }));
        var mid = A.el('.rx-mid');
        var line = A.el('.rx-line');
        line.appendChild(freqEl);
        line.appendChild(A.el('.rx-unit', { text: 'MHz' }));
        mid.appendChild(line);
        face.appendChild(mid);
        face.appendChild(A.el('button.rx-arrow', { html: Icons.svg('chevron'), onclick: function () { A.haptic(); stepF(CH_STEP); } }));
        card.appendChild(face);

        var typeIn = A.UI.field({
          label: null, inputmode: 'decimal', value: c.freq || '', placeholder: 'Type MHz',
          oninput: function (e) { c.freq = e.target.value; saveChans(); showF(); }
        });
        card.appendChild(typeIn);
        showF();

        var descF = A.UI.field({
          label: null, value: c.desc || '', placeholder: 'Description / use',
          oninput: function (e) { c.desc = e.target.value; saveChans(); }
        });
        card.appendChild(descF);

        var btns = A.el('.wp-key-btns');
        btns.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'),
          onclick: function () {
            if (!confirm('Delete this channel?')) return;
            chans.splice(i, 1); saveChans(); paint();
          }
        }));
        card.appendChild(btns);
        grid.appendChild(card);
      });
    }
    paint();

    host.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('plus') + ' Add channel', style: { marginTop: '6px' },
      onclick: function () { chans.push({ id: uid(), name: '', freq: '', desc: '' }); saveChans(); paint(); }
    }));
  }

  function plannerTool(host) {
    channelCards(host);

    host.appendChild(A.UI.section('Frequency planning basics'));
    var pc = A.UI.card(null, 'tight');
    [
      ['Separate the channels', 'Primary, alternate and emergency should be genuinely different frequencies, not adjacent ones that share interference.'],
      ['Keep a common calling channel', 'One agreed channel everyone monitors, so a lost station can be found again.'],
      ['Agree it before you split up', 'A PACE plan set after contact is lost is no plan. Brief and test it while you are together.'],
      ['Radio checks on a schedule', 'Fixed check-in times turn silence into information: a missed check is itself a signal.'],
      ['Brevity and discipline', 'Short, plain, pre-agreed words. The longer you transmit, the easier you are to locate and to jam.'],
      ['Assume nothing is private', 'Unless it is encrypted, treat every transmission as public. Say nothing on air you would not hand to the other side.']
    ].forEach(function (r) {
      pc.appendChild(defn(r[0], r[1]));
    });
    host.appendChild(pc);

    host.appendChild(A.UI.note(
      'This is a planning aid, not doctrine. Comms security, frequency authority and emergency procedures follow the ' +
      'rules of the operation and the country you are in. When it matters, rehearse the switch, do not just write it down.'));
  }

  /* ══ page ═════════════════════════════════════════════════════════════ */

  var TABS = [
    { id: 'range', label: 'Range' },
    { id: 'sets',  label: 'Spectrum' },
    { id: 'morse', label: 'Morse' },
    { id: 'pigeon', label: 'War Pigeon' },
    { id: 'plan',  label: 'Planner' }
  ];

  function render(host) {
    var tab = A.store.get('radio.tab', 'range');
    if (!TABS.some(function (t) { return t.id === tab; })) tab = 'range';

    host.appendChild(A.UI.chips(TABS, tab, function (id) {
      /* stop any outgoing tones when switching, but LEAVE the receiver
         running: listening is meant to survive moving around the app */
      if (global.A.WarPigeon) { A.WarPigeon.stopTx(); A.WarPigeon.cleanup(); }
      A.store.set('radio.tab', id);
      A.Router.refresh();
    }));

    var body = A.el('div');
    host.appendChild(body);

    if (tab === 'sets') radiosTool(body);
    else if (tab === 'morse') { if (global.ArtMorse) global.ArtMorse.render(body); else body.appendChild(A.UI.empty('Morse unavailable.')); }
    else if (tab === 'pigeon') { if (A.WarPigeon) A.WarPigeon.render(body); else body.appendChild(A.UI.empty('War Pigeon unavailable.')); }
    else if (tab === 'plan') plannerTool(body);
    else rangeTool(body);
  }

  /* Leaving the Radio page stops outgoing tones; the receiver keeps listening.
     The route event fires AFTER the new screen has rendered, so this must NOT
     call cleanup(): doing so tore off the War Pigeon tab's own status handlers
     the instant they were registered, which left the button stuck on
     "Starting…" while the microphone was in fact running. The tab detaches its
     own handlers when the user switches tabs. */
  A.Bus.on('route', function (r) {
    if (!global.A.WarPigeon) return;
    A.WarPigeon.stopTx();
    /* The Radio page is a TAB INSIDE the 'field' route, not a route of its own,
       so the guard has to name 'field'. It previously tested for 'radio', which
       is never the route name: cleanup therefore ran on every render and tore
       the receive panel off the service the instant it was attached. That is
       why the meter never moved and the button never changed - twice over. */
    var onRadio = r && r.name === 'field' && A.store.get('field.tab', '') === 'radio';
    if (!onRadio) A.WarPigeon.cleanup();
  });

  global.ArtRadio = { render: render };

})(window);
