/*
 * Artemidos - the electromagnetic spectrum, radio through light to gamma.
 * Copyright (c) 2026 Artemidos. All rights reserved.
 *
 * One shared dataset and one renderer, used by two screens: the Radio tool's
 * SPECTRUM tab and the Recon > Light & radio catalogue. The reader types a
 * frequency OR picks a band, and gets the band, its wavelength, and - the
 * point of it - what actually transmits there: broadcast, phones, GNSS, radar,
 * drones, missile seekers, satellites, and so on.
 */
(function (global) {
  'use strict';

  var A = global.A, C_LIGHT = 299792458;

  /* Each band: id, name, kind ('radio' | 'light'), fLo/fHi in Hz, and a plain
     account of what lives there. Ordered low frequency (long wave) to high. */
  var BANDS = [
    { id: 'elf', n: 'ELF - Extremely low frequency', kind: 'radio', fLo: 3, fHi: 30,
      uses: 'Submarine communication at great depth (a few characters per minute), geophysics and natural earth-current signals. Antennas are tens of kilometres long, so only states operate here.' },
    { id: 'slf', n: 'SLF - Super low frequency', kind: 'radio', fLo: 30, fHi: 300,
      uses: 'One-way signalling to submerged submarines (US Seafarer ~76 Hz, Russian ZEVS ~82 Hz). The 50/60 Hz power grid and its hum also sit here.' },
    { id: 'ulf', n: 'ULF - Ultra low frequency', kind: 'radio', fLo: 300, fHi: 3000,
      uses: 'Through-earth mine and cave rescue radios, some submarine work, and earthquake and magnetosphere research.' },
    { id: 'vlf', n: 'VLF - Very low frequency', kind: 'radio', fLo: 3e3, fHi: 30e3,
      uses: 'One-way broadcast to submarines, precise time signals, and long-range navigation of the old kind. Penetrates seawater a short way, which is why navies keep it.' },
    { id: 'lf', n: 'LF - Low frequency (longwave)', kind: 'radio', fLo: 30e3, fHi: 300e3,
      uses: 'Longwave AM broadcast (Europe), time-signal stations (DCF77 77.5 kHz, WWVB 60 kHz that set radio clocks), aviation non-directional beacons, and RFID.' },
    { id: 'mf', n: 'MF - Medium frequency (medium wave)', kind: 'radio', fLo: 300e3, fHi: 3e6,
      uses: 'AM (medium wave) broadcast, maritime and aeronautical beacons, and the 2182 kHz distress channel. Reaches far at night by bouncing off the ionosphere.' },
    { id: 'hf', n: 'HF - High frequency (shortwave)', kind: 'radio', fLo: 3e6, fHi: 30e6,
      uses: 'Shortwave broadcast, amateur radio, long-range aviation and marine, CB (27 MHz), over-the-horizon radar, and tactical military HF. Skywave carries it intercontinental with terrain no obstacle.' },
    { id: 'vhf', n: 'VHF - Very high frequency', kind: 'radio', fLo: 30e6, fHi: 300e6,
      uses: 'FM broadcast (88-108 MHz), old analogue TV, civil airband (108-137 MHz), marine VHF, weather radio, amateur 2 m, and the combat-net infantry/vehicle band (30-88 MHz FM: SINCGARS, PR4G).' },
    { id: 'uhf', n: 'UHF - Ultra high frequency', kind: 'radio', fLo: 300e6, fHi: 3e9,
      uses: 'UHF TV, mobile phones (GSM/LTE/low 5G), GNSS (GPS L1 1575 MHz), Wi-Fi and Bluetooth (2.4 GHz), microwave ovens, PMR446/FRS/GMRS/TETRA, military air (225-400 MHz) and TACSAT, and most drone control links (2.4 GHz).' },
    { id: 'shf', n: 'SHF - Super high frequency (microwave)', kind: 'radio', fLo: 3e9, fHi: 30e9,
      uses: 'Wi-Fi 5/6 GHz, most radar (weather, air-defence, fire-control, missile guidance), satellite up/downlinks (C, Ku, Ka bands), point-to-point microwave trunks, drone video, and the lower 5G mmWave.' },
    { id: 'ehf', n: 'EHF - Extremely high frequency (mmWave)', kind: 'radio', fLo: 30e9, fHi: 300e9,
      uses: 'High-band 5G (24-47 GHz), automotive and short-range radar (77 GHz), millimetre-wave body scanners, high-throughput satellite, some missile seekers, and radio astronomy. Short range, blocked by rain and walls.' },
    { id: 'thz', n: 'THz - Terahertz (submillimetre)', kind: 'radio', fLo: 300e9, fHi: 3e12,
      uses: 'Security imaging that sees through clothing, materials and spectroscopy research, and experimental ultra-fast links. Between radio and infrared, hard to generate, largely a laboratory band.' },
    { id: 'ir', n: 'Infrared - invisible heat', kind: 'light', fLo: 3e12, fHi: 4.3e14,
      uses: 'Thermal imaging and night vision, IR remote controls, fibre-optic communication, heat-seeking (IR) missile seekers, laser rangefinders and designators, and free-space optical links. This is the light warm objects give off.' },
    { id: 'vis', n: 'Visible light', kind: 'light', fLo: 4.3e14, fHi: 7.9e14,
      uses: 'The only band the eye sees, red through violet. LiDAR, cameras, visible lasers and laser pointers, and optical signalling. About 380-700 nm.' },
    { id: 'uv', n: 'Ultraviolet', kind: 'light', fLo: 7.9e14, fHi: 3e16,
      uses: 'Sterilisation (UV-C), UV missile-approach warning sensors on aircraft, forensics and document security, curing, and the part of sunlight that burns skin.' },
    { id: 'xray', n: 'X-ray', kind: 'light', fLo: 3e16, fHi: 3e19,
      uses: 'Medical and dental imaging, security and cargo scanners, backscatter people-scanners, industrial inspection, and X-ray astronomy. Ionising: it damages tissue.' },
    { id: 'gamma', n: 'Gamma ray', kind: 'light', fLo: 3e19, fHi: 3e22,
      uses: 'Radiotherapy, equipment sterilisation, nuclear-material and dirty-bomb detection, and gamma-ray astronomy. The radiation of nuclear decay and fallout; strongly ionising and penetrating.' },
    { id: 'cosmic', n: 'Cosmic / ultra-high energy', kind: 'light', fLo: 3e22, fHi: 3e24,
      uses: 'The highest-energy photons known, from the most violent events in the universe. Note that "cosmic rays" are mostly high-energy PARTICLES, not electromagnetic waves; only the extreme gamma photons truly belong on this scale.' }
  ];

  function bandFor(hz) {
    for (var i = 0; i < BANDS.length; i++) if (hz >= BANDS[i].fLo && hz < BANDS[i].fHi) return BANDS[i];
    if (hz < BANDS[0].fLo) return BANDS[0];
    return BANDS[BANDS.length - 1];
  }

  function fmtFreq(hz) {
    if (!isFinite(hz) || hz <= 0) return '-';
    var u = [['Hz', 1], ['kHz', 1e3], ['MHz', 1e6], ['GHz', 1e9], ['THz', 1e12], ['PHz', 1e15], ['EHz', 1e18], ['ZHz', 1e21], ['YHz', 1e24]];
    for (var i = u.length - 1; i >= 0; i--) if (hz >= u[i][1]) return A.fmtNum(hz / u[i][1], 4) + ' ' + u[i][0];
    return A.fmtNum(hz, 4) + ' Hz';
  }
  function fmtWave(m) {
    if (!isFinite(m) || m <= 0) return '-';
    var u = [['pm', 1e-12], ['nm', 1e-9], ['µm', 1e-6], ['mm', 1e-3], ['m', 1], ['km', 1e3], ['Mm', 1e6]];
    for (var i = u.length - 1; i >= 0; i--) if (m >= u[i][1]) return A.fmtNum(m / u[i][1], 4) + ' ' + u[i][0];
    return A.fmtNum(m / 1e-12, 4) + ' pm';
  }
  function bandRange(b) {
    return fmtFreq(b.fLo) + ' - ' + fmtFreq(b.fHi) + '   ·   λ ' + fmtWave(C_LIGHT / b.fHi) + ' - ' + fmtWave(C_LIGHT / b.fLo);
  }

  /* one band card whose detail toggles IN PLACE. Collapsing must not rebuild
     the list, because clearing the container collapses its height and the
     scroller jumps to the top. Each card keeps its own body and just shows or
     hides it. Returns the card plus an open()/close() the lookup can drive. */
  function bandCard(b, onOpen) {
    var card = A.UI.card(null, 'tight');
    var chev = A.el('span.spec-chev', { text: '+' });
    var head = A.el('button.spec-head');
    head.appendChild(A.el('span.spec-name', { text: b.n }));
    head.appendChild(chev);
    card.appendChild(head);
    card.appendChild(A.el('.spec-range', { text: bandRange(b),
      style: { color: 'var(--acc)', fontSize: '12px', marginTop: '2px' } }));

    var body = A.el('div', { style: { display: 'none' } });
    body.appendChild(A.el('.spec-uses', { text: b.uses,
      style: { marginTop: '8px', fontSize: '13.5px', lineHeight: '1.55', color: 'var(--text-2)' } }));
    body.appendChild(A.el('.spec-tag', {
      text: b.kind === 'radio' ? 'RADIO' : (b.id === 'vis' ? 'LIGHT - VISIBLE' : 'LIGHT - INVISIBLE'),
      style: { marginTop: '8px', fontSize: '10.5px', letterSpacing: '.14em', color: 'var(--muted)' } }));
    card.appendChild(body);

    var open = false;
    function set(v) { open = v; body.style.display = v ? 'block' : 'none'; chev.textContent = v ? '−' : '+'; }
    head.addEventListener('click', function () { set(!open); if (onOpen) onOpen(b.id, open); });
    card.setOpen = set;
    return card;
  }

  /* render the whole thing into host. opts.store keys the lookup state. */
  function render(host, opts) {
    opts = opts || {};
    var key = opts.store || 'spectrum';
    var st = A.store.get(key, { open: 'vhf', f: '', u: 'MHz' });
    function save() { A.store.set(key, st); }

    /* frequency lookup */
    var UMAP = { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9, THz: 1e12, PHz: 1e15, EHz: 1e18 };
    var lookOut = A.el('div');
    var row = A.el('.split');
    var fIn = A.UI.field({
      label: 'Find a frequency', inputmode: 'decimal', value: st.f, placeholder: '1575',
      oninput: function (e) { st.f = e.target.value; save(); look(); }
    });
    var uSel = A.UI.select({
      label: 'Unit', value: st.u,
      options: Object.keys(UMAP).map(function (u) { return { value: u, label: u }; }),
      onchange: function (e) { st.u = e.target.value; save(); look(); }
    });
    row.appendChild(fIn); row.appendChild(uSel);
    host.appendChild(row);
    host.appendChild(lookOut);

    /* the full band list, built once; cards toggle themselves */
    host.appendChild(A.UI.section('The full spectrum, low to high'));
    var cards = {};
    BANDS.forEach(function (b) {
      var c = bandCard(b, function (id, isOpen) { st.open = isOpen ? id : null; save(); });
      cards[b.id] = c;
      host.appendChild(c);
    });
    if (cards[st.open]) cards[st.open].setOpen(true);

    function look() {
      A.clear(lookOut);
      var v = A.parseNum(st.f);
      if (!isFinite(v) || v <= 0) return;
      var hz = v * UMAP[st.u];
      var b = bandFor(hz);
      var c = A.UI.card(null, 'tight');
      c.appendChild(A.UI.metric('That frequency is in', b.n, { big: true, icon: 'radio' }));
      c.appendChild(A.UI.metric('Wavelength', fmtWave(C_LIGHT / hz),
        { sub: 'a quarter-wave antenna is ' + fmtWave(C_LIGHT / hz / 4) + ' long' }));
      c.appendChild(A.UI.metric('What is here', b.uses));
      lookOut.appendChild(c);
    }
    look();
  }

  global.ArtSpectrum = { BANDS: BANDS, bandFor: bandFor, render: render, fmtFreq: fmtFreq, fmtWave: fmtWave };

})(window);
