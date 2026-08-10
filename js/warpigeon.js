/*
 * Artemidos - War Pigeon: encrypted messages over a voice radio, as sound
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Two stations share a key. One types a message; the app scrambles it with the
 * key and plays it as tones held to the radio mic. The other Artemidos, with a
 * matching key, hears the tones through its mic and unscrambles the message.
 * Anyone else on the channel hears only beeping.
 *
 * BUILT LIKE RATTLEGRAM (aicodix, 0BSD): the modem itself lives in wpmodem.js
 * - a multi-carrier OFDM burst demodulated from the raw microphone samples with
 * a matched-filter clock, differential phase and Hamming error correction.
 * This file supplies the cipher, the keys, the log and the screen.
 *
 * KEYS. A named list of keys is kept: a primary and any number of backups. The
 * sender picks which key to send with; the receiver tries EVERY stored key on
 * each message, so a net using different keys is read without switching.
 *
 * STILL A FIELD CIPHER. A keystream scramble keeps a casual listener out, not a
 * cryptanalyst. Keep keys secret, share them off the air, change them often.
 */
(function (global) {
  'use strict';

  /* The waveform lives in wpmodem.js - a multi-carrier OFDM modem working on
     raw samples, shared verbatim with the Node test bench. This file keeps
     what is Artemidos' own: the cipher, the keys, the log and the screen. */

  /* How many times one message is sent. ONE by default: a transmission that
     keeps repeating sounds broken and holds the channel open, which is worse
     than asking for a re-send. The user can raise it when the link is poor. */
  function repeats() { return A.store.get('warpigeon.repeats', 1); }
  /* 1 = robust (8 carriers, four times the energy each), 0 = fast (32) */
  function modeId() { return A.store.get('warpigeon.robust', false) ? 1 : 0; }

  /* A few standard messages to start with; the user edits the list freely.
     THE MESSAGES ARE AS SHORT AS THEY CAN BE ON PURPOSE. Every character is
     more air time, and more air time is more chance of a fade, a burst of
     noise or a keyed-over transmission landing in the middle of it. A word
     that survives beats a sentence that does not: 'SOS' arrives where 'Need
     assistance' breaks up, and both say the same thing to the person holding
     the other radio. */
  var DEFAULT_SHORTCUTS = [
    { label: 'HELP', msg: 'SOS' },
    { label: 'KEY', msg: 'CHANGE KEY' },
    { label: 'OK', msg: 'OK' },
    { label: 'COORDS', msg: 'COORDS' },
    { label: 'CHECK', msg: 'CHECK' },
    { label: 'MOVE', msg: 'MOVE' }
  ];

  /* The old, wordier defaults. Anyone who never touched the list is still
     carrying them, so the new set would never reach them. Replace the stored
     list ONLY when it is still the old default, untouched - an edited list is
     the user's and is left exactly as it is. */
  var OLD_DEFAULTS = [
    { label: 'HELP', msg: 'Need assistance' },
    { label: 'KEY', msg: 'Change key' },
    { label: 'OK', msg: 'Received, understood' },
    { label: 'MOVE', msg: 'Moving to next position' }
  ];
  function migrateShortcuts() {
    var cur = A.store.get('warpigeon.shortcuts', null);
    if (!Array.isArray(cur) || cur.length !== OLD_DEFAULTS.length) return;
    for (var i = 0; i < cur.length; i++) {
      if (!cur[i] || cur[i].label !== OLD_DEFAULTS[i].label ||
          cur[i].msg !== OLD_DEFAULTS[i].msg) return;
    }
    A.store.set('warpigeon.shortcuts', DEFAULT_SHORTCUTS.slice());
  }
  migrateShortcuts();

  /* ══ cipher ══════════════════════════════════════════════════════════════ */

  function cyrb128(str) {
    var h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (var i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
  }
  function sfc32(a, b, c, d) {
    return function () {
      a |= 0; b |= 0; c |= 0; d |= 0;
      var t = (a + b | 0) + d | 0; d = d + 1 | 0;
      a = b ^ b >>> 9; b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11); c = c + t | 0;
      return (t >>> 0);
    };
  }
  function keystream(key, n) {
    var h = cyrb128('artemidos:' + key);
    var r = sfc32(h[0], h[1], h[2], h[3]);
    for (var w = 0; w < 12; w++) r();
    var out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = r() & 255;
    return out;
  }
  function utf8(s) { return new TextEncoder().encode(s); }
  function fromUtf8(b) { return new TextDecoder().decode(new Uint8Array(b)); }

  /* CRC-16/CCITT. A single XOR byte let roughly one corrupted message in 256
     slip through as real text - which is how "Tico" arrived as "Tjcl": the
     decode was wrong but the weak checksum passed it. A 16-bit CRC drops that
     to about one in 65000, and it catches the multi-bit and burst errors a
     marginal link actually produces, which an XOR misses entirely. On a weak
     link a message is now either right or withheld, never quietly wrong. */
  function crc16(arr) {
    var c = 0xFFFF;
    for (var i = 0; i < arr.length; i++) {
      c ^= (arr[i] & 255) << 8;
      for (var b = 0; b < 8; b++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
    }
    return c;
  }

  function encode(text, key) {
    var data = Array.prototype.slice.call(utf8(text)).slice(0, 200);
    var c = crc16(data);
    var frame = [data.length].concat(data).concat([(c >> 8) & 255, c & 255]);
    var ks = keystream(key, frame.length);
    return frame.map(function (b, i) { return (b ^ ks[i]) & 255; });
  }
  function decode(bytes, key) {
    if (bytes.length < 4) return null;
    var ks = keystream(key, bytes.length);
    var frame = bytes.map(function (b, i) { return (b ^ ks[i]) & 255; });
    var len = frame[0];
    /* trailing bytes are tolerated: the end of a transmission is found by
       silence, so the tail may carry a byte of rounding that means nothing */
    if (len < 1 || len + 3 > frame.length) return null;
    var data = frame.slice(1, 1 + len);
    var c = crc16(data);
    if (((c >> 8) & 255) !== frame[1 + len] || (c & 255) !== frame[2 + len]) return null;
    try { return fromUtf8(data); } catch (e) { return null; }
  }

  /* ══ modulator ═══════════════════════════════════════════════════════════
     Transmit renders the whole burst with WPModem.synthesize - sweep, header,
     OFDM symbols - into one buffer and plays it. No oscillators to schedule,
     nothing to drift. */

  /* ── ONE CONTEXT, AND A RUNNING START ────────────────────────────────────
     This used to build a fresh AudioContext for every burst and call start()
     the instant it existed. On a fast phone that is invisible. On a slower
     one the output route is still being opened when the first samples are
     handed over, and what comes out of the speaker is the sound of the route
     opening - a short click or chirp - immediately before the preamble. That
     is what the S52 was doing and the S75 was not.

     Two changes remove it. The context is created ONCE and kept, so the route
     is opened on the first transmission and stays open; and the burst is
     SCHEDULED a moment ahead rather than started immediately, so even on the
     very first burst the stream is already running by the time our samples
     begin and any opening artefact lands in silence.

     The context is suspended between bursts rather than closed, which keeps
     the battery cost down without paying the open-the-route price again. */
  var txCtx = null, txSrc = null;

  /* Long enough for a slow device to have the output stream running, short
     enough that the button still feels immediate. */
  var TX_LEAD = 0.15;

  function audioCtx() {
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    if (!txCtx) {
      try { txCtx = new Ctx(); } catch (e) { return null; }
    }
    return txCtx;
  }

  function transmit(bytes, onDone) {
    stopTx();
    /* deaf while speaking: a phone must not receive its own transmission */
    svc.muted = true;
    var ctx = audioCtx();
    if (!ctx || !global.WPModem) { onDone && onDone(false); return; }
    var rate = ctx.sampleRate;
    var wave = WPModem.synthesize(bytes, rate, repeats(), modeId());
    var buf = ctx.createBuffer(1, wave.length, rate);
    buf.getChannelData(0).set(wave);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    txSrc = src;
    src.onended = function () { stopTx(); onDone && onDone(true); };
    var kick = (ctx.state !== 'running' && ctx.resume) ? ctx.resume().catch(function () {}) : Promise.resolve();
    Promise.resolve(kick).then(function () {
      /* scheduled, not immediate - see the note above */
      try { src.start(ctx.currentTime + TX_LEAD); }
      catch (e) { stopTx(); onDone && onDone(false); }
    });
  }
  function stopTx() {
    if (txSrc) { try { txSrc.onended = null; txSrc.stop(); } catch (e) {} txSrc = null; }
    /* suspend, never close: closing throws away the opened output route and
       the next burst pays for it again with an audible click */
    if (txCtx && txCtx.state === 'running' && txCtx.suspend) {
      try { txCtx.suspend(); } catch (e) {}
    }
    /* hearing returns a moment later, and everything captured meanwhile is
       thrown away - including the tail of our own burst still in the air */
    if (svc.muted) {
      setTimeout(function () {
        svc.muted = false;
        if (svc.rx && svc.rx.flush) { try { svc.rx.flush(); } catch (e) {} }
      }, 250);
    }
  }
  function txSeconds(bytes) {
    return global.WPModem ? WPModem.durationSec(bytes.length, repeats(), modeId()) : 0;
  }

  /* ══ keys ════════════════════════════════════════════════════════════════ */

  function getKeys() {
    var keys = A.store.get('warpigeon.keys', null);
    if (!keys) {
      /* migrate an old single key, if any */
      var old = (A.store.get('warpigeon', {}) || {}).key;
      keys = old ? [{ name: 'Primary', key: old }] : [];
      A.store.set('warpigeon.keys', keys);
    }
    return keys;
  }
  function setKeys(k) { A.store.set('warpigeon.keys', k); }
  function activeIndex() {
    var i = A.store.get('warpigeon.active', 0);
    var keys = getKeys();
    return (i >= 0 && i < keys.length) ? i : 0;
  }

  function randomKey() {
    var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var out = '', arr;
    if (global.crypto && global.crypto.getRandomValues) { arr = new Uint8Array(10); global.crypto.getRandomValues(arr); }
    else { arr = []; for (var i = 0; i < 10; i++) arr.push((i * 37 + 11) & 255); }
    for (var j = 0; j < 10; j++) { out += abc[arr[j] % abc.length]; if (j === 4) out += '-'; }
    return out;
  }

  /* ══ receiver: a persistent service ══════════════════════════════════════
     It runs on module state, not on the tab's DOM, so it keeps listening while
     the user moves around the app. It logs straight to storage and announces
     events on the bus for whatever screen is showing to reflect. */

  var svc = { running: false, starting: false, stream: null, ctx: null, timer: 0, wake: null, level: 0, status: 'idle', gen: 0 };

  /* The receive panel's live elements, handed over by the tab when it renders.
     The SERVICE updates them from its own loop, which is the one loop proven to
     be running whenever the microphone is open. Earlier attempts drove the
     meter from bus events and then from an interval owned by the screen; both
     died quietly when a screen was rebuilt, leaving a frozen meter and a button
     that lied about whether it was listening. Nothing here can outlive the
     audio loop, because it IS the audio loop. */
  var panel = null;
  function bindPanel(p) { panel = p; paintPanel(); }
  function unbindPanel(p) { if (panel === p) panel = null; }

  var lastPaint = 0;
  function paintPanel(force) {
    if (!panel) return;
    var now = Date.now();
    if (!force && now - lastPaint < 80) return;
    lastPaint = now;
    if (panel.bar) panel.bar.style.width = Math.round((svc.running ? svc.level : 0) * 100) + '%';
    /* a panel may style its own button (the messenger's toolbar is an icon
       and one word); otherwise fall back to the long label */
    if (panel.btn) {
      if (panel.setBtn) panel.setBtn(panel.btn);
      else {
        panel.btn.innerHTML = Icons.svg(svc.running ? 'stop' : 'radio') +
          (svc.running ? ' Listening… tap to stop' : (svc.starting ? ' Starting…' : ' Start listening'));
      }
    }
    if (panel.status && panel.statusText) panel.status.textContent = panel.statusText();
  }
  var lastLogged = { text: '', at: 0 };

  function clockNow() {
    var d = new Date(); function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + 'h' + p(d.getMinutes());
  }
  /* dir: 'rx' for something heard, 'tx' for something this phone sent. Both
     go in the same log so the screen can show one conversation. */
  function addLog(text, keyName, dir) {
    var now = Date.now();
    if (dir !== 'tx' && text === lastLogged.text && now - lastLogged.at < 6000) return false;   /* one over, logged once */
    if (dir !== 'tx') lastLogged = { text: text, at: now };
    var log = A.store.get('warpigeon.log', []);
    log.push({ t: clockNow(), text: text, key: keyName || '', dir: dir || 'rx' });
    if (log.length > 300) log = log.slice(-300);
    A.store.set('warpigeon.log', log);
    logVersion++;
    return true;
  }

  function emit(type, data) {
    A.Bus.emit('wp:' + type, data);
    if (type === 'status') paintPanel(true);
  }

  function tryAllKeys(bytes) {
    var keys = getKeys();
    for (var i = 0; i < keys.length; i++) {
      var m = decode(bytes, keys[i].key);
      if (m != null) return { msg: m, name: keys[i].name };
    }
    return null;
  }

  /* Some Android WebViews neither resolve nor reject getUserMedia when the
     permission is slow or the constraints displease them - the promise just
     hangs, and the button sticks on "Starting…". So each attempt is raced
     against a timeout, and a plain {audio:true} is tried if the tuned request
     does not come back. One of these always settles. */
  var micError = '';
  function getMic() {
    function once(constraints, label) {
      return new Promise(function (resolve, reject) {
        var done = false;
        var to = setTimeout(function () {
          if (!done) { done = true; console.log('WarPigeon: ' + label + ' timed out'); reject(new Error('timeout')); }
        }, 4000);
        var p;
        try { p = navigator.mediaDevices.getUserMedia(constraints); }
        catch (e) { done = true; clearTimeout(to); console.log('WarPigeon: ' + label + ' threw ' + e.name); reject(e); return; }
        p.then(
          function (s) { if (!done) { done = true; clearTimeout(to); console.log('WarPigeon: ' + label + ' ok'); resolve(s); } },
          function (e) {
            if (!done) {
              done = true; clearTimeout(to);
              micError = (e && (e.name || e.message)) || 'error';
              console.log('WarPigeon: ' + label + ' failed ' + micError);
              reject(e);
            }
          }
        );
      });
    }
    /* Echo cancellation, noise suppression and auto gain are all ACTIVELY
       HARMFUL here: they exist to remove steady tones and the device's own
       output, which is precisely the signal being sent. With them on, a phone
       cancels the very beeps it is meant to hear. So the request that turns
       them off is tried FIRST, and plain {audio:true} is only the fallback if
       a WebView refuses the constraints. Both are timeout-raced, so neither
       can hang the button. */
    return once({
      audio: {
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
        googEchoCancellation: false, googNoiseSuppression: false, googAutoGainControl: false
      }
    }, 'tuned')
      .catch(function () { return once({ audio: true }, 'audio:true'); });
  }
  A.WarPigeon = A.WarPigeon || {};
  function lastMicError() { return micError; }

  function startService() {
    console.log('WarPigeon: startService, mediaDevices=' + (!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)));
    if (svc.running || svc.starting) { emit('status', svc.running ? 'listening' : 'starting'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { svc.status = 'no-mic'; emit('status', 'no-mic'); return; }
    if (!getKeys().length) { svc.status = 'no-key'; emit('status', 'no-key'); return; }
    /* Re-entry guard AND a generation token. Without them a second tap while
       the first request was still in flight started a SECOND audio loop; the
       new timer id overwrote the old, so stopping could only ever clear the
       newest and the abandoned loop kept listening and decoding for ever,
       invisibly, while the panel said "Not listening". */
    svc.starting = true;
    var myGen = ++svc.gen;
    paintPanel(true);
    /* never leave the label saying "Starting…" for ever */
    setTimeout(function () { if (svc.starting && !svc.running) { svc.starting = false; svc.status = 'no-mic'; emit('status', 'no-mic'); } }, 12000);

    getMic().then(function (stream) {
      svc.stream = stream;
      var Ctx = global.AudioContext || global.webkitAudioContext;
      svc.ctx = new Ctx();
      /* A suspended AudioContext hands back nothing but zeros, so the level
         meter sits dead and no tone is ever detected even though the
         microphone is open. Android starts it suspended, so it must be
         resumed and the resume WAITED FOR before any reading begins. */
      var ready = (svc.ctx.state === 'suspended' && svc.ctx.resume)
        ? svc.ctx.resume().catch(function () {})
        : Promise.resolve();
      return ready.then(function () { return stream; });
    }).then(function (stream) {
      console.log('WarPigeon: ctx state=' + svc.ctx.state + ' rate=' + svc.ctx.sampleRate);
      var src = svc.ctx.createMediaStreamSource(stream);

      /* RAW SAMPLES, not spectrum snapshots. The modem receives every sample
         the microphone produces, in order, whatever the interval timer does -
         Android throttling can DELAY processing now, but can no longer LOSE
         signal, and the modem's own matched filter sets the symbol clock. */
      var rx = new WPModem.RX(svc.ctx.sampleRate);
      svc.rx = rx;
      var proc = svc.ctx.createScriptProcessor(2048, 1, 1);
      var sink = svc.ctx.createGain();
      sink.gain.value = 0;                     /* hear nothing back */
      proc.onaudioprocess = function (ev) {
        if (myGen !== svc.gen || !svc.running) return;
        if (svc.muted) return;              /* own transmission on the air */
        try { rx.feed(ev.inputBuffer.getChannelData(0), svc.ctx.sampleRate); } catch (e) {}
      };
      src.connect(proc);
      proc.connect(sink);
      sink.connect(svc.ctx.destination);
      svc.proc = proc; svc.sink = sink;

      svc.running = true;
      svc.starting = false;
      svc.status = 'listening';
      emit('status', 'listening');

      /* keep the CPU awake while listening; this holds across in-app screens,
         though the OS may still suspend audio if the whole app is minimised.
         Wrapped so a WebView that throws here cannot break the start. */
      try {
        if (navigator.wakeLock && navigator.wakeLock.request) {
          navigator.wakeLock.request('screen').then(function (w) { svc.wake = w; }).catch(function () {});
        }
      } catch (e) { /* wake lock is a nicety, not required */ }

      var dbgTick = 0;
      var myTimer = setInterval(function () {
        if (myGen !== svc.gen || !svc.running) { clearInterval(myTimer); return; }
        /* the poll DRIVES the demodulation and collects finished messages */
        var cands = [];
        try { cands = rx.poll(); } catch (e) { console.log('WarPigeon: rx error ' + (e && e.message)); }
        svc.level = Math.min(1, rx.rms * 9);
        emit('level', svc.level);
        paintPanel();
        if (++dbgTick % 100 === 0) console.log('WarPigeon: rms=' + rx.rms.toFixed(4) + ' locks=' + rx.lockCount);
        for (var i = 0; i < cands.length; i++) {
          console.log('WarPigeon: frame decoded, ' + cands[i].length + ' bytes');
          var hit = tryAllKeys(cands[i]);
          if (hit) {
            if (addLog(hit.msg, hit.name)) { emit('msg', { text: hit.msg, key: hit.name }); }
            svc.status = 'got'; emit('status', 'got');
          } else {
            svc.status = 'garbled'; emit('status', 'garbled');
          }
        }
      }, 60);
      svc.timer = myTimer;
    }).catch(function (e) {
      console.log('WarPigeon: start failed ' + ((e && (e.name || e.message)) || '?'));
      svc.starting = false;
      svc.status = 'no-mic';
      emit('status', 'no-mic');
    });
  }

  function stopService() {
    svc.gen++;                      /* invalidates any loop still in flight */
    svc.running = false; svc.starting = false; svc.status = 'idle';
    if (svc.timer) { clearInterval(svc.timer); svc.timer = 0; }
    if (svc.proc) { try { svc.proc.disconnect(); svc.proc.onaudioprocess = null; } catch (e) {} svc.proc = null; }
    svc.rx = null;
    if (svc.sink) { try { svc.sink.disconnect(); } catch (e) {} svc.sink = null; }
    if (svc.stream) { svc.stream.getTracks().forEach(function (t) { t.stop(); }); svc.stream = null; }
    if (svc.ctx) { try { svc.ctx.close(); } catch (e) {} svc.ctx = null; }
    if (svc.wake) { try { svc.wake.release(); } catch (e) {} svc.wake = null; }
    emit('status', 'stopped');
  }

  /* re-acquire the wake lock when the app returns to the foreground */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && svc.running && navigator.wakeLock && !svc.wake) {
      navigator.wakeLock.request('screen').then(function (w) { svc.wake = w; }).catch(function () {});
    }
  });

  /* A version counter on the log, so a screen can tell "something arrived"
     by comparing a number instead of subscribing to an event. */
  var logVersion = 0;

  A.WarPigeon = {
    encode: encode, decode: decode,
    isListening: function () { return svc.running; },
    /* read straight off the service. The level meter used to be driven by bus
       events and silently stopped moving the moment a screen rebuilt and left
       a stale handler pointing at a detached element. Polling a value cannot
       break that way, which matters more here than elegance: a dead meter
       reads as a dead microphone. */
    level: function () { return svc.running ? svc.level : 0; },
    bindPanel: bindPanel, unbindPanel: unbindPanel, repaint: function () { paintPanel(true); },
    statusCode: function () { return svc.status; },
    logVersion: function () { return logVersion; },
    start: startService, stop: stopService,
    stopTx: stopTx
  };

  /* ══ the tab ═══════════════════════════════════════════════════════════════ */

  function render(host) {
    var subs = [];
    function on(ev, fn) { A.Bus.on(ev, fn); subs.push([ev, fn]); }

    /* ── the screen is a messenger ──
       A conversation in the middle, a toolbar above it, a composer below.
       Sent and received messages share one log, so what you sent and what
       came back read as a single exchange rather than two separate lists. */
    var wrap = A.el('.wp-msgr');
    host.appendChild(wrap);

    /* ══ toolbar ══ */
    var bar = A.el('.wp-bar');
    var listenBtn = A.el('button.wp-bar-btn' + (svc.running ? '.on' : ''), {
      html: Icons.svg('radio') + '<span>' + (svc.running ? 'Listening' : 'Listen') + '</span>'
    });
    bar.appendChild(listenBtn);
    bar.appendChild(A.el('button.wp-bar-btn', {
      html: Icons.svg('copy') + '<span>Copy</span>', title: 'Copy the whole conversation',
      onclick: function () {
        var log = A.store.get('warpigeon.log', []);
        if (!log.length) { A.toast('Nothing to copy'); return; }
        var txt = log.map(function (e) {
          return e.t + '  ' + (e.dir === 'tx' ? 'SENT' : 'RECV') + '  ' + e.text;
        }).join('\n');
        try { navigator.clipboard.writeText(txt); A.toast('Conversation copied'); }
        catch (err) { A.toast('Copy not available'); }
      }
    }));
    bar.appendChild(A.el('button.wp-bar-btn.danger', {
      html: Icons.svg('trash') + '<span>Clear</span>', title: 'Clear the conversation',
      onclick: function () {
        if (!confirm('Clear the whole conversation? This cannot be undone.')) return;
        A.store.set('warpigeon.log', []);
        paintChat();
        A.toast('Cleared');
      }
    }));
    var keysBtn = A.el('button.wp-bar-btn', {
      html: Icons.svg('shield') + '<span>Keys</span>', title: 'Show the keys',
      onclick: function () { keysOpen = !keysOpen; paintKeys(); }
    });
    bar.appendChild(keysBtn);
    wrap.appendChild(bar);

    /* the microphone level, a thin line under the toolbar */
    var rxLevel = A.el('.wp-level'); var rxBar = A.el('.wp-level-bar'); rxLevel.appendChild(rxBar);
    wrap.appendChild(rxLevel);
    var rxStatus = A.el('.wp-status', { text: '' });
    wrap.appendChild(rxStatus);

    /* ══ keys, folded away until wanted ══ */
    var keysOpen = false;
    var keysHost = A.el('.wp-keyspanel');
    wrap.appendChild(keysHost);

    function addKey() {
      var keys = getKeys();
      keys.push({ name: keys.length ? 'Backup ' + keys.length : 'Primary', key: randomKey() });
      setKeys(keys);
      if (keys.length === 1) A.store.set('warpigeon.active', 0);
      keysOpen = true;
      paintKeys();
    }

    function paintKeys() {
      A.clear(keysHost);
      var keys = getKeys();
      var active = activeIndex();
      /* the toolbar button reflects the fold and says which key is in use */
      if (keysBtn) {
        keysBtn.classList.toggle('on', keysOpen);
        keysBtn.title = keys.length
          ? 'Sending with "' + (keys[active] && keys[active].name || 'key') + '"'
          : 'No keys yet';
      }
      if (!keysOpen) return;

      var lead = A.el('.wp-keys-lead');
      lead.appendChild(A.el('span', {
        text: keys.length
          ? 'Tick the key to send with. Every key is tried when receiving.'
          : 'No keys yet. Add one, and share it off the air.'
      }));
      lead.appendChild(A.el('button.btn.ghost.wp-addkey', {
        html: Icons.svg('plus'), title: 'Add a key', onclick: addKey
      }));
      keysHost.appendChild(lead);

      if (!keys.length) return;
      var grid = A.el('.wp-keys');
      keys.forEach(function (entry, idx) {
        var card = A.el('.wp-key' + (idx === active ? '.on' : ''));
        var nameF = A.UI.field({
          label: null, value: entry.name, placeholder: 'Name',
          oninput: function (e) { entry.name = e.target.value; setKeys(keys); }
        });
        nameF.classList.add('wp-key-name');
        card.appendChild(nameF);
        var keyF = A.UI.field({
          label: null, value: entry.key, placeholder: 'Key',
          oninput: function (e) { entry.key = e.target.value.trim(); setKeys(keys); }
        });
        card.appendChild(keyF);
        var btns = A.el('.wp-key-btns');
        btns.appendChild(A.el('button.wp-ib' + (idx === active ? '.on' : ''), {
          html: Icons.svg('check'), title: 'Send with this key',
          onclick: function () { A.store.set('warpigeon.active', idx); paintKeys(); A.toast('Sending with "' + (entry.name || 'key') + '"'); }
        }));
        btns.appendChild(A.el('button.wp-ib', {
          html: Icons.svg('refresh'), title: 'Generate',
          onclick: function () { entry.key = randomKey(); keyF.input.value = entry.key; setKeys(keys); A.haptic(); }
        }));
        btns.appendChild(A.el('button.wp-ib', {
          html: Icons.svg('copy'), title: 'Copy',
          onclick: function () { if (!entry.key) return; try { navigator.clipboard.writeText(entry.key); A.toast('Key copied'); } catch (e) {} }
        }));
        btns.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'), title: 'Delete',
          onclick: function () {
            var what = entry.name ? '"' + entry.name + '"' : 'this key';
            if (!confirm('Delete ' + what + '? Messages sent with it can no longer be read.')) return;
            keys.splice(idx, 1); setKeys(keys);
            if (active >= keys.length) A.store.set('warpigeon.active', Math.max(0, keys.length - 1));
            paintKeys();
          }
        }));
        card.appendChild(btns);
        grid.appendChild(card);
      });
      keysHost.appendChild(grid);
    }
    paintKeys();

    /* ══ the conversation ══ */
    var chat = A.el('.wp-chat');
    wrap.appendChild(chat);

    function paintChat() {
      A.clear(chat);
      var log = A.store.get('warpigeon.log', []);
      if (!log.length) {
        chat.appendChild(A.el('.wp-chat-empty', {
          text: 'No messages yet. Type below and tap Transmit, or start listening to receive.'
        }));
        return;
      }
      log.forEach(function (e) {
        var sent = e.dir === 'tx';
        var row = A.el('.wp-bubble-row' + (sent ? '.tx' : '.rx'));
        var b = A.el('.wp-bubble' + (sent ? '.tx' : '.rx'));
        b.appendChild(A.el('.wp-bubble-t', { text: e.text }));
        var meta = A.el('.wp-bubble-m');
        meta.appendChild(A.el('span', { text: e.t }));
        if (e.key) meta.appendChild(A.el('span.wp-bubble-k', { text: e.key }));
        b.appendChild(meta);
        row.appendChild(b);
        chat.appendChild(row);
      });
      chat.scrollTop = chat.scrollHeight;
    }

    /* ══ the composer ══ */
    var comp = A.el('.wp-comp');
    wrap.appendChild(comp);

    /* shortcuts: one-push standard messages */
    var scHost = A.el('.wp-shortcuts');
    comp.appendChild(scHost);

    function shortcuts() {
      var sc = A.store.get('warpigeon.shortcuts', null);
      return Array.isArray(sc) ? sc : DEFAULT_SHORTCUTS.slice();
    }
    function setShortcuts(x) { A.store.set('warpigeon.shortcuts', x); }
    var scEdit = false;

    function paintShortcuts() {
      A.clear(scHost);
      var list = shortcuts();
      var head = A.el('.wp-sc-head');
      head.appendChild(A.el('span.wp-sc-lab', { text: 'Shortcuts' }));
      head.appendChild(A.el('button.wp-sc-edit', {
        text: scEdit ? 'Done' : 'Edit',
        onclick: function () { scEdit = !scEdit; paintShortcuts(); }
      }));
      scHost.appendChild(head);

      if (!scEdit) {
        if (!list.length) return;
        var row = A.el('.wp-sc-row');
        list.forEach(function (x) {
          row.appendChild(A.el('button.wp-sc-chip', {
            title: x.msg,
            html: '<b>' + A.esc(x.label || '?') + '</b>',
            onclick: function () { A.haptic(); sendMessage(x.msg); }
          }));
        });
        scHost.appendChild(row);
        return;
      }
      list.forEach(function (x, i) {
        var ed = A.el('.wp-sc-edit-row');
        var lab = A.UI.field({
          label: null, value: x.label || '', placeholder: 'KEY',
          oninput: function (e) { x.label = e.target.value; setShortcuts(list); }
        });
        lab.classList.add('wp-sc-labf');
        ed.appendChild(lab);
        var msg = A.UI.field({
          label: null, value: x.msg || '', placeholder: 'Change key',
          oninput: function (e) { x.msg = e.target.value; setShortcuts(list); }
        });
        msg.classList.add('wp-sc-msgf');
        ed.appendChild(msg);
        ed.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'), title: 'Delete',
          onclick: function () { list.splice(i, 1); setShortcuts(list); paintShortcuts(); }
        }));
        scHost.appendChild(ed);
      });
      scHost.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('plus') + ' Add shortcut', style: { marginTop: '6px' },
        onclick: function () { list.push({ label: '', msg: '' }); setShortcuts(list); paintShortcuts(); }
      }));
    }
    paintShortcuts();

    /* the input line: message, then Transmit with its options beside it */
    var msgField = A.el('textarea.fld-in.wp-input', {
      placeholder: 'Message…', rows: '1'
    });
    /* THE KEYBOARD MUST NOT SIT ON THE FIELD.
       The composer is at the foot of the page, which is right until Android
       opens the keyboard over it and you are typing into something you cannot
       see. On focus the view is scrolled to its end, and again after the
       keyboard has finished animating, so the input finishes above it. The
       visualViewport listener handles the phones that resize late. */
    function revealComposer() {
      try {
        var view = document.getElementById('view');
        if (view) view.scrollTop = view.scrollHeight;
        msgField.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } catch (e) {}
    }
    msgField.addEventListener('focus', function () {
      revealComposer();
      setTimeout(revealComposer, 180);
      setTimeout(revealComposer, 420);
      if (global.visualViewport) {
        var vv = global.visualViewport;
        var once = function () { revealComposer(); vv.removeEventListener('resize', once); };
        vv.addEventListener('resize', once);
      }
    });
    var saved = A.store.get('warpigeon', {});
    msgField.value = saved.msg || '';
    msgField.addEventListener('input', function () { saved.msg = msgField.value; A.store.set('warpigeon', saved); });

    var sendRow = A.el('.wp-sendrow');
    /* ICON ONLY, AND BESIDE THE FIELD.
       The composer sits at the foot of the page. With Transmit on its own row
       underneath, Android's keyboard covered it the moment the field took
       focus, so the one button you need was the one you could not reach.
       Putting it in the same row as the textarea keeps it on the same line as
       the thing being typed, which the reveal-on-focus scroll already keeps
       above the keyboard. The word is dropped because the row is now narrow;
       the label survives as the accessible name and the long-press tooltip. */
    var sendBtn = A.el('button.btn.wp-txbtn.sem-go', {
      html: Icons.svg('radio'),
      'aria-label': 'Transmit',
      title: 'Transmit'
    });
    var repSel = A.el('select.fld-in.wp-repsel');
    [['1', 'Once'], ['2', 'Twice'], ['3', '3×']].forEach(function (o) {
      var op = A.el('option', { value: o[0], text: o[1] });
      if (String(repeats()) === o[0]) op.selected = true;
      repSel.appendChild(op);
    });
    repSel.addEventListener('change', function (e) { A.store.set('warpigeon.repeats', +e.target.value); });

    /* ROBUST: fewer carriers, four times the energy in each. The receiver
       recognises it from the preamble, so only the SENDER needs to choose. */
    var robustBtn = A.el('button.wp-mode' + (A.store.get('warpigeon.robust', false) ? '.on' : ''), {
      text: 'Robust',
      title: 'Slower but far stronger: use it when the other phone keeps missing you',
      onclick: function () {
        var v = !A.store.get('warpigeon.robust', false);
        A.store.set('warpigeon.robust', v);
        robustBtn.classList.toggle('on', v);
        A.haptic();
        A.toast(v ? 'Robust mode: slower, much stronger' : 'Fast mode');
      }
    });

    /* the typing line: the field, and Transmit hard against its right edge */
    var typeRow = A.el('.wp-typerow');
    typeRow.appendChild(msgField);
    typeRow.appendChild(sendBtn);
    comp.appendChild(typeRow);
    /* the options sit under it, where the keyboard covering them costs
       nothing: neither is touched mid-message */
    sendRow.appendChild(robustBtn);
    sendRow.appendChild(repSel);
    comp.appendChild(sendRow);
    var sendStatus = A.el('.wp-status', { text: '' });
    comp.appendChild(sendStatus);

    var sendBusy = false;
    /* one place that transmits, so the button and every shortcut agree */
    function sendMessage(text) {
      if (sendBusy) { stopTx(); sendBusy = false; sendBtn.innerHTML = Icons.svg('radio'); sendStatus.textContent = 'Stopped.'; return; }
      var keys = getKeys();
      if (!keys.length) { A.toast('Add a key first'); return; }
      text = (text || '').trim();
      if (!text) { A.toast('Type a message'); return; }
      var key = keys[activeIndex()];
      var bytes = encode(text, key.key);
      sendBusy = true;
      /* icon only, sending or not: the label made the button jump in width */
      sendBtn.innerHTML = Icons.svg('stop');
      sendBtn.title = 'Sending… tap to stop';
      var n = repeats();
      sendStatus.textContent = 'Sending with "' + (key.name || 'key') + '"' + (n > 1 ? ', ' + n + '×' : '') +
        '. Hold the speaker to the radio mic. ~' + txSeconds(bytes).toFixed(0) + ' s.';
      A.haptic(20);
      /* it appears in the conversation as soon as it goes out */
      addLog(text, key.name || '', 'tx');
      paintChat();
      transmit(bytes, function () {
        sendBusy = false;
        sendBtn.innerHTML = Icons.svg('radio');
        sendStatus.textContent = repeats() > 1 ? 'Sent ' + repeats() + '×.' : 'Sent.';
      });
    }
    sendBtn.addEventListener('click', function () {
      sendMessage(msgField.value);
      msgField.value = ''; saved.msg = ''; A.store.set('warpigeon', saved);
    });

    /* ══ the receiver panel ══ */
    var myPanel = {
      bar: rxBar, btn: listenBtn, status: rxStatus,
      statusText: function () {
        if (svc.running) return 'Listening. Keeps running while you use the rest of the app.';
        if (svc.starting) return 'Asking for the microphone…';
        if (svc.status === 'no-mic') return 'Could not open the microphone' + (lastMicError() ? ' (' + lastMicError() + ')' : '') + '. Check the mic permission for Artemidos.';
        if (svc.status === 'no-key') return 'Add a key first.';
        return 'Not listening.';
      },
      /* the toolbar button is an icon and a word, so the service is told how
         to relabel it rather than overwriting it with a sentence */
      setBtn: function (el2) {
        el2.innerHTML = Icons.svg('radio') + '<span>' + (svc.running ? 'Listening' : (svc.starting ? 'Starting' : 'Listen')) + '</span>';
        el2.classList.toggle('on', !!svc.running);
      }
    };

    listenBtn.addEventListener('click', function () {
      if (svc.running || svc.starting) { stopService(); return; }
      if (!getKeys().length) { A.toast('Add a key first'); return; }
      startService();
    });

    var lastVer = A.WarPigeon.logVersion();
    on('wp:msg', function () { lastVer = A.WarPigeon.logVersion(); paintChat(); A.haptic(30); });
    on('wp:status', function () {
      var v = A.WarPigeon.logVersion();
      if (v !== lastVer) { lastVer = v; paintChat(); }
    });

    A.WarPigeon.bindPanel(myPanel);
    paintChat();

    render._cleanup = function () {
      A.WarPigeon.unbindPanel(myPanel);
      subs.forEach(function (x) { A.Bus.off && A.Bus.off(x[0], x[1]); });
      subs = [];
    };
  }

  A.WarPigeon.render = render;
  A.WarPigeon.cleanup = function () { if (render._cleanup) render._cleanup(); };

})(window);
