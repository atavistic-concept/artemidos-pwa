/*
 * Artemidos - Morse code: encode, key, listen and train
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Four tools behind one page:
 *
 *   TEXT      type text and read the dots and dashes, or paste dots and dashes
 *             and read the text. A Play button sounds it at a chosen speed and
 *             flashes it in time.
 *   KEY       a straight-key button. Tap it short for a dot and hold it long
 *             for a dash; the app times the presses, groups them into letters
 *             on the gaps, and writes the decoded text as you go.
 *   LISTEN    the microphone decodes a Morse tone in the air to text. It adapts
 *             to the sender's speed. Best in a quiet room with a clean tone.
 *   TRAINER   the Morse tree. Keying walks down it: a dot lights a round node,
 *             a dash lights a square one red, and the path settles on the
 *             letter it spells. It is the fastest way to learn the code.
 *
 * Timing follows the standard: a dash is three dots long, the gap inside a
 * letter is one dot, between letters three, between words seven. Speed is in
 * words per minute, where one unit = 1200 / wpm milliseconds (PARIS standard).
 */
(function (global) {
  'use strict';

  /* numbers and punctuation are the same international symbols in both scripts */
  var COMMON = {
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '@': '.--.-.'
  };
  function withCommon(letters) {
    var o = {}; Object.keys(letters).forEach(function (k) { o[k] = letters[k]; });
    Object.keys(COMMON).forEach(function (k) { o[k] = COMMON[k]; });
    return o;
  }
  var LATIN = withCommon({
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
    H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
    O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
    V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..'
  });
  /* Russian Morse (ГОСТ / Russian telegraph alphabet). Ё is sent as Е. */
  var CYRILLIC = withCommon({
    'А': '.-', 'Б': '-...', 'В': '.--', 'Г': '--.', 'Д': '-..', 'Е': '.', 'Ж': '...-',
    'З': '--..', 'И': '..', 'Й': '.---', 'К': '-.-', 'Л': '.-..', 'М': '--', 'Н': '-.',
    'О': '---', 'П': '.--.', 'Р': '.-.', 'С': '...', 'Т': '-', 'У': '..-', 'Ф': '..-.',
    'Х': '....', 'Ц': '-.-.', 'Ч': '---.', 'Ш': '----', 'Щ': '--.-', 'Ъ': '--.--',
    'Ы': '-.--', 'Ь': '-..-', 'Э': '..-..', 'Ю': '..--', 'Я': '.-.-'
  });

  var script = 'latin';
  var CODE = LATIN;
  var DECODE = {};
  function rebuildDecode() {
    DECODE = {};
    /* first mapping wins, so the decode of a shared pattern is deterministic */
    Object.keys(CODE).forEach(function (k) { if (DECODE[CODE[k]] == null) DECODE[CODE[k]] = k; });
  }
  rebuildDecode();
  function setScript(s) {
    script = (s === 'cyrillic') ? 'cyrillic' : 'latin';
    CODE = (script === 'cyrillic') ? CYRILLIC : LATIN;
    rebuildDecode();
    if (A.store) A.store.set('morse.script', script);
  }

  /* ══ audio ════════════════════════════════════════════════════════════ */

  var ac = null;
  function ctx() {
    if (!ac) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (AC) ac = new AC();
    }
    if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    return ac;
  }

  var FREQ = 620;

  /* a held key tone, stopped on release */
  function keyTone() {
    var c = ctx();
    if (!c) return { stop: function () {} };
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = FREQ; g.gain.value = 0.0001;
    o.connect(g); g.connect(c.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.006);
    return {
      stop: function () {
        try {
          g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.02);
          o.stop(c.currentTime + 0.06);
        } catch (e) {}
      }
    };
  }

  /* scheduled playback of a morse string, with visual callbacks */
  var playback = { osc: null, timers: [], onVis: null };
  function stopPlayback() {
    playback.timers.forEach(clearTimeout);
    playback.timers = [];
    if (playback.osc) { try { playback.osc.stop(); } catch (e) {} playback.osc = null; }
    if (playback.onVis) playback.onVis(false);
  }

  function playMorse(morse, wpm, onVis) {
    stopPlayback();
    var c = ctx();
    if (!c) return;
    var u = 1.2 / (wpm || 15);                 /* seconds per unit */
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = FREQ; g.gain.value = 0.0001;
    o.connect(g); g.connect(c.destination);
    var t0 = c.currentTime + 0.06, t = t0;
    playback.osc = o;
    playback.onVis = onVis;

    function on(dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.006);
      g.gain.setValueAtTime(0.28, t + dur - 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (onVis) {
        playback.timers.push(setTimeout(function () { onVis(true); }, (t - t0) * 1000));
        playback.timers.push(setTimeout(function () { onVis(false); }, (t + dur - t0) * 1000));
      }
      t += dur;
    }

    o.start(t0);
    for (var i = 0; i < morse.length; i++) {
      var ch = morse[i];
      if (ch === '.') { on(u); t += u; }
      else if (ch === '-') { on(3 * u); t += u; }
      else if (ch === ' ') { t += 2 * u; }       /* letter gap: +2u after the 1u already added */
      else if (ch === '/') { t += 6 * u; }       /* word gap */
    }
    o.stop(t + 0.05);
    playback.timers.push(setTimeout(function () { playback.osc = null; }, (t - t0 + 0.1) * 1000));
  }

  /* ══ encode / decode ══════════════════════════════════════════════════ */

  function textToMorse(text) {
    return String(text || '').toUpperCase().split(/\s+/).filter(Boolean).map(function (word) {
      return word.split('').map(function (ch) { return CODE[ch] || ''; }).filter(Boolean).join(' ');
    }).join(' / ');
  }

  function morseToText(morse) {
    return String(morse || '').trim().split(/\s*\/\s*/).map(function (word) {
      return word.split(/\s+/).map(function (sym) { return DECODE[sym] || (sym ? '•' : ''); }).join('');
    }).join(' ');
  }

  var isMorse = function (s) { return /^[.\-•\/\s]+$/.test(String(s || '').trim()); };

  /* reference charts of the code, used on the Text and Trainer tabs. The tree
     shows only the 26 letters, so numbers (five elements) and punctuation (six)
     live here as a lookup. */
  function chartRow(chars) {
    var row = A.el('.pill-row');
    chars.forEach(function (ch) {
      if (!CODE[ch]) return;
      row.appendChild(A.el('.pill', {
        html: '<b>' + A.esc(ch) + '</b> <span style="font-family:var(--mono)">' + CODE[ch] + '</span>'
      }));
    });
    return row;
  }

  function refChart(host, opts) {
    opts = opts || {};
    if (opts.alphabet) {
      host.appendChild(A.UI.section('Alphabet'));
      /* the chart follows the chosen script: Latin A-Z, or the Russian
         telegraph alphabet when the keyer is in Cyrillic */
      var alpha = (script === 'cyrillic')
        ? 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      host.appendChild(chartRow(alpha.split('')));
    }
    host.appendChild(A.UI.section('Numbers'));
    host.appendChild(chartRow('0123456789'.split('')));
    host.appendChild(A.UI.section('Punctuation & symbols'));
    host.appendChild(chartRow(['.', ',', '?', '!', '/', '(', ')', '&', ':', ';', '=', '+', '-', '_', '"', "'", '@']));
    host.appendChild(A.UI.section('Word space'));
    host.appendChild(A.el('.pill-row', null, [A.el('.pill', { html: '<b>space</b> <span style="font-family:var(--mono)">/</span>' })]));
  }

  /* ── a board that folds away ──
     The Write page is for writing. Everything below it is reference, and
     reference that will not fold pushes the thing you came for off the top of
     the screen. Each board remembers whether it was open, per board, so the
     one you actually use stays where you left it. */
  function board(title, sub, openDefault, build) {
    var key = 'morse.open.' + title;
    var open = A.store.get(key, !!openDefault);
    var d = A.el('details.set-group', open ? { open: true } : null);
    var sum = A.el('summary.set-sum');
    var tr = function (x) { var I = global.ArtI18n; return I ? I.auto(x) : x; };
    sum.appendChild(A.el('span.set-t', { text: tr(title) }));
    if (sub) sum.appendChild(A.el('span.set-s', { text: tr(sub) }));
    sum.appendChild(A.el('span.set-ch', { html: Icons.svg('chevron') }));
    d.appendChild(sum);
    var body = A.el('.set-body');
    build(body);
    d.appendChild(body);
    d.addEventListener('toggle', function () { A.store.set(key, d.open); });
    return d;
  }

  /* two columns of code and meaning, which is how a code book is read */
  function codeList(host, rows) {
    var t = A.el('.morse-codes');
    rows.forEach(function (r) {
      var it = A.el('.morse-code');
      it.appendChild(A.el('b', { text: r[0] }));
      it.appendChild(A.el('span', { text: r[1] }));
      t.appendChild(it);
    });
    host.appendChild(t);
  }

  /* ══ the code books ═══════════════════════════════════════════════════
     These are OPERATING SHORTHAND, not part of the code itself: they exist
     because sending is slow and a word you can say in one breath takes six
     seconds on a key. They are the same on every band and in every language,
     which is the point of them - two operators with no language in common can
     still run a contact on Q signals alone. */

  /* Working abbreviations. Sent as plain letters, no special spacing. */
  var ABBREV = [
    ['AA', 'All after'], ['AB', 'All before'], ['ADS', 'Address'], ['AGN', 'Again'],
    ['ANT', 'Antenna'], ['AR', 'End of transmission'], ['AS', 'Wait'],
    ['BK', 'Break, pause the transmission'], ['BN', 'All between'],
    ['C', 'Yes, correct, affirmative'], ['CFM', 'Confirm'], ['CK', 'Check'],
    ['CL', 'Closing down this station'], ['CP', 'Calling several stations'],
    ['CQ', 'Calling all stations'], ['CQD', 'All stations, distress'],
    ['CS', 'Calling station'], ['DE', 'From, this is'],
    ['DX', 'Long distance, foreign'], ['ES', 'And, also'],
    ['FB', 'Fine business, good'], ['FM', 'From'], ['FWD', 'Forward'],
    ['K', 'Invitation to transmit, anyone'], ['KN', 'Over to you only'],
    ['NIL', 'I have nothing to send'], ['NR', 'Number follows'], ['OK', 'Okay'],
    ['OM', 'Old man, any male operator'], ['PSE', 'Please'],
    ['R', 'Received as transmitted'], ['RPT', 'Repeat, or report'],
    ['RST', 'Readability, strength, tone report'], ['SK', 'Out, end of contact'],
    ['TU', 'Thank you'], ['TX', 'Transmitter, transmit'],
    ['WC', 'Wilco, will comply'], ['WX', 'Weather'], ['Z', 'Zulu time, UTC'],
    ['73', 'Best regards'], ['88', 'Love and kisses']
  ];

  /* Q signals. The same three letters are a QUESTION with a question mark
     after them and an ANSWER without one: "QRL?" asks whether the frequency
     is busy, "QRL" says it is. */
  var QCODE = [
    ['QRA', 'The name or call sign of your station'],
    ['QRB', 'Approximate distance between our stations'],
    ['QRG', 'My exact frequency'],
    ['QRH', 'Does my frequency vary'],
    ['QRI', 'The tone of my transmission'],
    ['QRK', 'The readability of my signals'],
    ['QRL', 'I am busy, the frequency is in use'],
    ['QRM', 'I am being interfered with, man-made'],
    ['QRN', 'I am troubled by static, natural noise'],
    ['QRO', 'Increase transmitter power'],
    ['QRP', 'Decrease transmitter power, low power'],
    ['QRQ', 'Send faster'],
    ['QRS', 'Send more slowly'],
    ['QRT', 'Stop sending, close down'],
    ['QRU', 'I have nothing for you'],
    ['QRV', 'I am ready'],
    ['QRW', 'Tell that station I am calling'],
    ['QRX', 'Wait, I will call you again'],
    ['QRZ', 'Who is calling me'],
    ['QSA', 'The strength of your signals'],
    ['QSB', 'Your signals are fading'],
    ['QSD', 'Your keying is defective'],
    ['QSK', 'I can hear you between my signals, full break-in'],
    ['QSL', 'I acknowledge receipt, confirmation'],
    ['QSM', 'Repeat the last message'],
    ['QSN', 'Did you hear me'],
    ['QSO', 'A contact, communication direct or by relay'],
    ['QSP', 'I will relay free of charge'],
    ['QSU', 'Send on this frequency'],
    ['QSV', 'Send a series of V for tuning'],
    ['QSW', 'I will send on this frequency'],
    ['QSX', 'I am listening on this frequency'],
    ['QSY', 'Change to another frequency'],
    ['QSZ', 'Send each word more than once'],
    ['QTA', 'Cancel that message'],
    ['QTC', 'How many messages have you'],
    ['QTE', 'My true bearing from you'],
    ['QTF', 'My position by direction finding'],
    ['QTH', 'My position, latitude and longitude, or place'],
    ['QTR', 'The correct time'],
    ['QTU', 'The hours this station is open'],
    ['QTV', 'Stand guard on this frequency for me'],
    ['QUA', 'News of that station'],
    ['QUD', 'I have received the urgency signal'],
    ['QUF', 'I have received the distress signal'],
    ['QUG', 'I must make a forced landing'],
    ['QUM', 'Normal working may resume, distress over']
  ];

  /* The aeronautical set, which uses the same letters for entirely different
     questions - one reason a Q signal is only unambiguous once you know which
     service you are working. */
  var QAERO = [
    ['QNH', 'Altimeter setting to read airfield elevation on the ground'],
    ['QFE', 'Altimeter setting to read zero on the airfield'],
    ['QNE', 'What the altimeter reads on landing set to standard pressure'],
    ['QFF', 'Atmospheric pressure reduced to sea level'],
    ['QDM', 'Magnetic heading to steer to reach the station'],
    ['QDR', 'My magnetic bearing from the station'],
    ['QTE', 'My true bearing from the station'],
    ['QUJ', 'True track to the station'],
    ['QFU', 'Magnetic direction of the runway in use'],
    ['QGO', 'Landing is prohibited here'],
    ['QAM', 'The latest weather observation'],
    ['QBB', 'The base of the cloud']
  ];

  /* Z signals. WE ARE NOT LISTING WHAT WE CANNOT SOURCE. The military Z set
     (ACP-131) runs to hundreds of signals and is not the sort of thing to
     reconstruct from memory, so what is here is the sample the public
     reference gives, marked with which service it belongs to. Take the rest
     from the signal book you are actually working under. */
  var ZCODE = [
    ['ZAL', 'I am closing down until … because …   (Cable & Wireless)'],
    ['ZAP', 'Work …   (Cable & Wireless)'],
    ['ZBK', 'Are you receiving my traffic clear?   (NATO)'],
    ['ZBK 1', 'I am receiving your traffic clear   (NATO)'],
    ['ZBK 2', 'I am receiving your traffic garbled   (NATO)'],
    ['ZBM 2', 'Place a competent operator on this circuit   (Cable & Wireless)'],
    ['ZBW', 'Change to backup frequency …   (Cable & Wireless)'],
    ['ZBZ', 'Measure of printability   (Cable & Wireless)'],
    ['ZLD 2', 'I cannot transmit pictures   (Cable & Wireless)'],
    ['ZSF', 'Switch off …   (Cable & Wireless)'],
    ['ZUJ', 'Stand by   (NATO)']
  ];

  /* ══ speed control shared by tabs ═════════════════════════════════════ */

  function speedRow(get, set) {
    var wrap = A.el('.fld');
    wrap.appendChild(A.el('span.fld-lab', { text: 'Speed' }));
    var row = A.el('.fld-row', { style: { alignItems: 'center', gap: '10px' } });
    var val = A.el('span', { text: get() + ' wpm', style: { minWidth: '62px', fontFamily: 'var(--mono)', fontSize: '13px' } });
    var slider = A.el('input', {
      type: 'range', min: '5', max: '30', step: '1', value: String(get()),
      style: { flex: '1' },
      oninput: function (e) { set(+e.target.value); val.textContent = e.target.value + ' wpm'; }
    });
    row.appendChild(slider);
    row.appendChild(val);
    wrap.appendChild(row);
    return wrap;
  }

  /* ══ TEXT tab ═════════════════════════════════════════════════════════ */

  function textTab(host) {
    var st = A.store.get('morse.text', { in: '', wpm: 15 });

    var card = A.UI.card();
    var inField = A.el('textarea.fld-in', {
      placeholder: 'Type text, or paste dots and dashes…',
      rows: '2',
      style: { width: '100%', resize: 'vertical', minHeight: '54px', lineHeight: '1.5' }
    });
    inField.value = st.in;
    var lab = A.el('span.fld-lab', { text: 'Text or Morse' });
    card.appendChild(lab);
    card.appendChild(inField);

    var outLab = A.UI.section('Output');
    var outBox = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '16px', lineHeight: '1.8', wordBreak: 'break-word', minHeight: '46px' } });

    var flash = A.el('div', {
      style: {
        height: '10px', borderRadius: '5px', marginTop: '10px',
        background: 'var(--surface-2)', transition: 'background .04s'
      }
    });

    var btnRow = A.el('.split', { style: { marginTop: '10px' } });
    var playBtn = A.el('button.btn.block.sem-go', { html: Icons.svg('play') + ' Play' });
    var stopBtn = A.el('button.btn.ghost.block.sem-del', { text: 'Stop' });
    btnRow.appendChild(playBtn);
    btnRow.appendChild(stopBtn);

    host.appendChild(card);
    host.appendChild(speedRow(function () { return st.wpm; }, function (v) { st.wpm = v; save(); }));
    host.appendChild(outLab);
    host.appendChild(outBox);
    host.appendChild(flash);
    host.appendChild(btnRow);

    var lastMorse = '';
    function save() { st.in = inField.value; A.store.set('morse.text', st); }
    function update() {
      save();
      var v = inField.value;
      if (isMorse(v) && /[.\-]/.test(v)) {
        lastMorse = v.replace(/•/g, '');
        outBox.textContent = morseToText(v);
      } else {
        lastMorse = textToMorse(v);
        outBox.textContent = lastMorse || '—';
      }
    }
    inField.addEventListener('input', update);
    playBtn.addEventListener('click', function () {
      A.haptic();
      if (lastMorse) playMorse(lastMorse, st.wpm, function (on) {
        flash.style.background = on ? 'var(--acc)' : 'var(--surface-2)';
      });
    });
    stopBtn.addEventListener('click', function () { stopPlayback(); flash.style.background = 'var(--surface-2)'; });

    /* ── the reference, all of it folded away until wanted ── */
    host.appendChild(board('The code', 'Letters, numbers, punctuation, word space', false, function (b) {
      refChart(b, { alphabet: true });
    }));

    host.appendChild(board('Abbreviations', 'Operating shorthand', false, function (b) {
      b.appendChild(A.UI.note(
        'Sent as ordinary letters. They exist because a key is slow: a word you can say in a ' +
        'breath takes six seconds to send, so the common ones were worn down to two or three ' +
        'letters and stayed that way.'));
      codeList(b, ABBREV);
    }));

    host.appendChild(board('Q code', 'Three letters, any language', false, function (b) {
      b.appendChild(A.UI.note(
        'The same three letters are a QUESTION with a question mark after them and an ANSWER ' +
        'without one. QRL? asks whether the frequency is in use; QRL says it is. Two operators ' +
        'with no language in common can run a whole contact on these alone.'));
      codeList(b, QCODE);
      b.appendChild(A.el('.sec-lab', { text: 'Aeronautical', style: { marginTop: '14px' } }));
      b.appendChild(A.UI.note(
        'Aviation reuses the same letters for entirely different questions, which is why a Q ' +
        'signal only means something once you know which service you are working.'));
      codeList(b, QAERO);
    }));

    host.appendChild(board('Z code', 'Service signals', false, function (b) {
      b.appendChild(A.UI.note(
        'Z signals belong to fixed services and to the military. The military set, ACP-131, runs ' +
        'to hundreds of signals and changes between signal books, so only the published sample is ' +
        'given here rather than a list reconstructed from memory. Work from the signal book you ' +
        'are actually under.'));
      codeList(b, ZCODE);
    }));

    update();
  }

  /* ══ shared keyer: turns press durations into decoded text ════════════ */

  /* returns an object with keyDown/keyUp and a display() the caller renders.
     onLetter(letter, symbols) fires when a letter is committed; onSymbol fires
     per dot/dash; onReset clears the in-progress symbols. */
  function makeKeyer(opts) {
    opts = opts || {};
    var symbols = '', out = '';
    var pressStart = 0, letterTimer = null, wordTimer = null, dashTimer = null;
    function unit() { return 1200 / (opts.wpm ? opts.wpm() : 15); }

    function commitLetter() {
      if (!symbols) return;
      var ch = DECODE[symbols] || '•';
      out += ch;
      if (opts.onLetter) opts.onLetter(ch, symbols, out);
      symbols = '';
      if (opts.onReset) opts.onReset();
    }
    function scheduleGaps() {
      clearTimeout(letterTimer); clearTimeout(wordTimer);
      letterTimer = setTimeout(commitLetter, unit() * 3);
      wordTimer = setTimeout(function () {
        if (out && out[out.length - 1] !== ' ') { out += ' '; if (opts.onWord) opts.onWord(out); }
      }, unit() * 7);
    }

    return {
      down: function () {
        clearTimeout(letterTimer); clearTimeout(wordTimer);
        pressStart = performance.now();
        /* Nothing lights until the press has declared itself. Lighting the
           dot the instant the finger lands meant every dash began life as a
           false dot flash, which trains exactly the wrong reflex. So the
           chart stays quiet through the ambiguous window: release inside it
           and the dot lights on commit (onSymbol), hold past the threshold
           and the dash lights the moment it becomes inevitable. Only the
           correct node ever lights. */
        if (opts.onPreview) {
          clearTimeout(dashTimer);
          dashTimer = setTimeout(function () {
            opts.onPreview(symbols + '-');
            if (opts.onDashReached) opts.onDashReached();
          }, unit() * 2);
        }
      },
      up: function () {
        clearTimeout(dashTimer);
        var dur = performance.now() - pressStart;
        var sym = dur < unit() * 2 ? '.' : '-';
        symbols += sym;
        if (opts.onSymbol) opts.onSymbol(sym, symbols);
        scheduleGaps();
      },
      space: function () { clearTimeout(letterTimer); clearTimeout(wordTimer); commitLetter(); if (out && out[out.length - 1] !== ' ') { out += ' '; } if (opts.onWord) opts.onWord(out); },
      backspace: function () { symbols = ''; out = out.slice(0, -1); if (opts.onReset) opts.onReset(); if (opts.onWord) opts.onWord(out); },
      clear: function () { symbols = ''; out = ''; if (opts.onReset) opts.onReset(); if (opts.onWord) opts.onWord(out); },
      text: function () { return out; },
      symbols: function () { return symbols; }
    };
  }

  /* a big press-and-hold key element wired to a keyer */
  function keyButton(keyer, label) {
    var btn = A.el('button.morse-key', { html: label || 'KEY' });
    var tone = null;
    function down(e) {
      e.preventDefault();
      A.haptic(10);
      btn.classList.add('on');
      tone = keyTone();
      keyer.down();
    }
    function up(e) {
      if (e) e.preventDefault();
      if (!btn.classList.contains('on')) return;
      btn.classList.remove('on');
      if (tone) { tone.stop(); tone = null; }
      keyer.up();
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
    return btn;
  }

  /* ══ KEY tab ══════════════════════════════════════════════════════════ */

  function keyTab(host) {
    var st = A.store.get('morse.key', { wpm: 12 });
    function save() { A.store.set('morse.key', st); }

    var symLine = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '26px', textAlign: 'center', letterSpacing: '.15em', minHeight: '30px', color: 'var(--acc)' } });
    var outLine = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '18px', minHeight: '44px', wordBreak: 'break-word', lineHeight: '1.7' } });

    var keyer = makeKeyer({
      wpm: function () { return st.wpm; },
      onSymbol: function (sym, symbols) { symLine.textContent = symbols; },
      onReset: function () { symLine.textContent = ''; },
      onLetter: function (ch, symbols, out) { outLine.textContent = out; },
      onWord: function (out) { outLine.textContent = out || '—'; }
    });

    host.appendChild(A.UI.section('Keyed symbols'));
    host.appendChild(symLine);
    host.appendChild(A.UI.section('Decoded text'));
    host.appendChild(outLine);
    host.appendChild(speedRow(function () { return st.wpm; }, function (v) { st.wpm = v; save(); }));

    var key = keyButton(keyer, 'HOLD TO KEY');
    host.appendChild(key);

    var ctl = A.el('.split', { style: { marginTop: '10px' } });
    ctl.appendChild(A.el('button.btn.ghost.block', { text: 'Space', onclick: function () { A.haptic(); keyer.space(); outLine.textContent = keyer.text() || '—'; } }));
    ctl.appendChild(A.el('button.btn.ghost.block.sem-del', { html: Icons.svg('back') + ' Delete', onclick: function () { A.haptic(); keyer.backspace(); outLine.textContent = keyer.text() || '—'; } }));
    ctl.appendChild(A.el('button.btn.ghost.block.sem-del', { text: 'Clear', onclick: function () { A.haptic(); keyer.clear(); symLine.textContent = ''; outLine.textContent = '—'; } }));
    host.appendChild(ctl);

    outLine.textContent = '—';

    /* the reference chart lives with the key, where you are learning to send
       and want the code in front of you, not on the translator tab where the
       app does the encoding for you */
    refChart(host, { alphabet: true });
  }

  /* ══ LISTEN tab (microphone) ══════════════════════════════════════════ */

  var mic = { stream: null, ac: null, raf: 0 };
  function stopMic() {
    if (mic.raf) cancelAnimationFrame(mic.raf), mic.raf = 0;
    if (mic.stream) { mic.stream.getTracks().forEach(function (t) { t.stop(); }); mic.stream = null; }
    if (mic.ac) { try { mic.ac.close(); } catch (e) {} mic.ac = null; }
  }

  function listenTab(host) {
    var out = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '18px', minHeight: '48px', wordBreak: 'break-word', lineHeight: '1.7' } });
    var sym = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '22px', textAlign: 'center', minHeight: '28px', color: 'var(--acc)', letterSpacing: '.15em' } });
    var meter = A.el('div', { style: { height: '10px', borderRadius: '5px', background: 'var(--surface-2)', overflow: 'hidden', marginTop: '10px' } });
    var meterFill = A.el('div', { style: { height: '100%', width: '0%', background: 'var(--acc)', transition: 'width .05s' } });
    meter.appendChild(meterFill);

    var startBtn = A.el('button.btn.block', { html: Icons.svg('sound') + ' Start listening' });
    var running = false;

    host.appendChild(A.UI.section('Detected symbols'));
    host.appendChild(sym);
    host.appendChild(A.UI.section('Decoded text'));
    host.appendChild(out);
    host.appendChild(meter);
    host.appendChild(A.el('div', { style: { marginTop: '10px' } }, [startBtn]));
    host.appendChild(A.UI.note('Point the phone at a clean, steady Morse tone in a quiet room. It learns the sender\'s speed from the first few characters. Background noise, echo and a warbling tone all defeat it: this is best-effort, not a guaranteed decoder.'));

    out.textContent = '—';

    var symbols = '', text = '', unit = 90;         /* ms, adapts */
    var toneOn = false, onStart = 0, offStart = performance.now();
    var floor = 0.004, level = 0;

    function reset() { symbols = ''; sym.textContent = ''; }
    function commit() {
      if (!symbols) return;
      text += (DECODE[symbols] || '•');
      out.textContent = text;
      reset();
    }

    /* Plain audio:true is far more compatible on Android WebViews. The tuned
       constraints (echo cancellation off, etc.) made a cleaner tone signal but
       some devices reject them with NotReadableError, so try them and fall back
       to a bare request rather than failing outright. */
    function openMic() {
      var tuned = { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } };
      return navigator.mediaDevices.getUserMedia(tuned)
        .catch(function () { return navigator.mediaDevices.getUserMedia({ audio: true }); });
    }

    startBtn.addEventListener('click', function () {
      if (running) { running = false; stopMic(); startBtn.innerHTML = Icons.svg('sound') + ' Start listening'; startBtn.classList.remove('danger'); return; }
      openMic().then(function (stream) {
        running = true;
        mic.stream = stream;
        var AC = global.AudioContext || global.webkitAudioContext;
        mic.ac = new AC();
        var src = mic.ac.createMediaStreamSource(stream);
        var an = mic.ac.createAnalyser();
        an.fftSize = 1024;
        src.connect(an);
        var buf = new Float32Array(an.fftSize);
        startBtn.innerHTML = 'Stop listening';
        startBtn.classList.add('danger');
        text = ''; symbols = ''; out.textContent = '—'; sym.textContent = '';
        offStart = performance.now();

        function loop() {
          if (!running) return;
          an.getFloatTimeDomainData(buf);
          var s = 0;
          for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
          var rms = Math.sqrt(s / buf.length);
          level = level * 0.7 + rms * 0.3;
          floor = Math.min(floor, level) * 0.02 + floor * 0.98;   /* slow noise floor */
          var hi = Math.max(0.01, floor * 6), lo = Math.max(0.006, floor * 3);
          meterFill.style.width = Math.min(100, level / (hi * 2) * 100) + '%';
          var now = performance.now();

          if (!toneOn && level > hi) {
            /* tone started: classify the preceding silence */
            var off = now - offStart;
            if (symbols && off > unit * 2.2) commit();
            if (off > unit * 5.5 && text && text[text.length - 1] !== ' ') { text += ' '; out.textContent = text; }
            toneOn = true; onStart = now;
          } else if (toneOn && level < lo) {
            /* tone ended: classify its length as dot or dash */
            var on = now - onStart;
            if (on > 25) {
              var isDot = on < unit * 2;
              if (isDot) unit = unit * 0.8 + on * 0.2;              /* adapt to dot length */
              symbols += isDot ? '.' : '-';
              sym.textContent = symbols;
            }
            toneOn = false; offStart = now;
          }
          mic.raf = requestAnimationFrame(loop);
        }
        loop();
      }).catch(function (err) {
        running = false;
        startBtn.innerHTML = Icons.svg('sound') + ' Start listening';
        startBtn.classList.remove('danger');
        A.clear(out);
        var name = err && err.name;
        var msg;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          msg = 'Microphone blocked. Allow it for Artemidos and try again: on Android, Settings › Apps › Artemidos › Permissions › Microphone › Allow.';
        } else if (name === 'NotReadableError' || name === 'AbortError') {
          msg = 'The microphone is busy or could not be opened. Close anything else using it (a call, a voice recorder, another app), then try again. If it persists, reopen the app.';
        } else {
          msg = 'Could not start the microphone (' + (name || 'unknown') + ').';
        }
        out.appendChild(A.UI.note(msg));
      });
    });
  }

  /* ══ TRAINER tab (the Morse tree) ═════════════════════════════════════ */

  /* THE WALL-CHART LAYOUT.
     Read from the aerial down. Dashes run LEFT along a spine, dots run RIGHT
     along a spine, and the other symbol drops the node onto a new spine one
     row below. So T M O march away to the left because each adds a dash, and
     E I S H march away to the right because each adds a dot, while N hangs
     under T and A hangs under E because those add the opposite symbol.

     Each side keeps its own sense the whole way down:

       LEFT  (everything under T)   dash continues sideways, dot drops
       RIGHT (everything under E)   dot continues sideways, dash drops

     which is why the picture reads the same at every depth: sideways always
     means "more of the same press", downwards always means "the other one".

     A dropped child is placed below the ENTIRE spine it is branching off,
     not merely one row under its parent, so no spine can ever run through a
     node belonging to another. That is what makes the layout collision-free
     by construction rather than by tuning.

     Shapes carry the press: a circle is a dot, a rectangle is a dash, and a
     rectangle is drawn long along the direction its own link arrives from, so
     a dash reached sideways is a wide rectangle and a dash reached downwards
     is a tall one. The eye then reads the shape as the length of the press.

     Combinations that spell nothing but lead to a digit are drawn as small
     nodes carrying a dot or a dash glyph, so the path to a number is complete
     and every step still says which press it needs. */
  /* Tight, because vertical distance is the thing that makes the chart feel
     sparse. A run is only pushed down when the cells it needs are genuinely
     occupied, never for tidiness.

     One limit is worth stating: a node's sideways child cannot be dropped to
     a lower row to save space, because the direction IS the symbol. Putting R
     under A rather than beside it would say R is A plus a dash, which is J.
     So where two runs want the same cell, one of them has to go lower: U sits
     further under I than it looks like it should, because F needs the column
     that V is already using. */
  var COL = 40, ROWH = 34, PAD = 20;

  function buildTree() {
    /* Letters, digits AND punctuation. The symbols used to sit in a chart
       below the tree because six-element codes need two more rows, but the
       compact layout reuses free rows rather than reserving a band per depth,
       so they cost far less than they used to and the tree is now the whole
       code rather than most of it. */
    var labels = {}, all = [];
    Object.keys(CODE).forEach(function (ch) { labels[CODE[ch]] = ch; all.push(CODE[ch]); });

    /* every prefix of a code is a node; the ones that spell nothing become the
       small junction markers */
    var nodes = {};
    all.forEach(function (code) {
      for (var i = 1; i <= code.length; i++) nodes[code.slice(0, i)] = true;
    });

    var pos = {}, taken = {}, maxRow = 0;
    var key = function (col, row) { return col + ',' + row; };

    /* The chain of nodes that continue sideways from here: E I S H 5 is one
       such run, and so is T M O. */
    function spine(code, along) {
      var run = [code];
      while (nodes[run[run.length - 1] + along]) run.push(run[run.length - 1] + along);
      return run;
    }

    /* Place a run at the first row where the WHOLE run fits, then hang each of
       its branches. Branches are taken from the outer end inwards, so a short
       one tucks in tight against the run above it instead of being pushed
       below a long one: V ends up level with 4 rather than three rows under S.
       Rows are reused wherever they are free, so the chart stays compact and
       still cannot collide, because a run is only ever placed on cells that
       were checked as a whole. */
    /* Does anything under this code spell an actual character? Used to let
       letters and numbers claim the near rows before punctuation does. */
    var primaryCache = {};
    function hasPrimary(code) {
      if (primaryCache[code] !== undefined) return primaryCache[code];
      var ch = labels[code];
      var yes = !!(ch && /[A-Z0-9]/.test(ch));
      if (!yes) {
        if (nodes[code + '.'] && hasPrimary(code + '.')) yes = true;
        else if (nodes[code + '-'] && hasPrimary(code + '-')) yes = true;
      }
      primaryCache[code] = yes;
      return yes;
    }

    /* Place a run on the nearest row that will take it, then hang its
       branches. Two conditions have to hold together, and getting only the
       first of them right is what wrecked the chart twice.

         1. every cell the run needs is free
         2. the parent's column is CLEAR all the way down to that row

       The second is the one that was missing. Without it a child could be
       parked several rows below its parent and the link drawn to it ran
       straight through whatever stood in between, which is how K appeared to
       be wired to X. With it, a link can be pulled as tight as the space
       allows and still never cross a node, so the chart is compact and honest
       at the same time.

       Branches that lead to a letter or a number are placed before those that
       lead only to punctuation, so the alphabet stays tight against its
       parents and the symbols take whatever is left. That is also what keeps
       C directly under K rather than below X. */
    /* Place a run on the nearest row that will take it, working from the
       outer end of each run inwards.

       RESERVATIONS are what make this both tight and correct. When a run is
       placed, the cell directly under every node of it that has a child is
       booked in that child's name. A booking does two jobs at once: no other
       run may build there, and because nothing is ever drawn in it, the
       column under the parent stays EMPTY, so the link down to the child
       cannot pass through a node however far the child eventually sits.

       Without the bookings, an outer branch runs outward over a column an
       inner node still needs, and the link to that node's child is then drawn
       straight through whatever took the space. That produced the chart where
       K appeared wired to X. Reserving fresh ground under every branch avoided
       it too, but left V sitting two rows under S with the row beneath it
       empty. This gets both: V sits level with 4, and no link crosses a node.

       The outer-to-inner order still matters and must not be sorted any other
       way: a run always extends AWAY from the centre, so working outward first
       keeps an inner node's column free for its own reservation. */
    var reserved = {};
    function usable(k, own) { return !taken[k] && (!reserved[k] || own[reserved[k]]); }

    function place(code, col, row, side) {
      var along = side === 'right' ? '.' : '-';
      var down = side === 'right' ? '-' : '.';
      var step = side === 'right' ? 1 : -1;
      var run = spine(code, along);
      var own = {};
      run.forEach(function (c) { own[c] = true; });
      var start = row;

      while (true) {
        var fits = run.every(function (c, i) { return usable(key(col + i * step, row), own); });
        var clear = true;
        for (var r = start; r < row; r++) if (taken[key(col, r)]) { clear = false; break; }
        if (fits && clear) break;
        row++;
      }

      run.forEach(function (c, i) {
        pos[c] = { col: col + i * step, row: row };
        taken[key(col + i * step, row)] = true;
      });

      /* book the row beneath for every child, before any branch goes down */
      run.forEach(function (c) {
        if (nodes[c + down]) reserved[key(pos[c].col, pos[c].row + 1)] = c + down;
      });

      for (var i = run.length - 1; i >= 0; i--) {
        var c = run[i];
        if (nodes[c + down]) place(c + down, pos[c].col, pos[c].row + 1, side);
      }
      return row;
    }

    function layout(code, col, row, side) { return place(code, col, row, side); }

    layout('.', 1, 0, 'right');
    layout('-', -1, 0, 'left');
    var rows = Math.max.apply(null, Object.keys(pos).map(function (c) { return pos[c].row; }));

    var cols = Object.keys(pos).map(function (c) { return pos[c].col; });
    var minCol = Math.min.apply(null, cols), maxCol = Math.max.apply(null, cols);
    var W = (maxCol - minCol + 1) * COL + PAD * 2;
    var xOf = function (col) { return PAD + (col - minCol) * COL + COL / 2; };
    var yOf = function (row) { return PAD + 34 + row * ROWH; };

    var list = Object.keys(pos).map(function (code) {
      var p = pos[code];
      var parent = code.slice(0, -1);
      /* a node reached sideways has its link arriving horizontally */
      var horiz = parent ? pos[parent].row === p.row : false;
      return {
        code: code,
        letter: labels[code] || '',
        junction: !labels[code],
        x: xOf(p.col), y: yOf(p.row),
        horiz: horiz,
        dash: code[code.length - 1] === '-'
      };
    });

    /* the aerial sits above the gap between the two spines */
    list.push({ code: '', letter: '', root: true, x: (xOf(-1) + xOf(1)) / 2, y: yOf(0) - 34, horiz: false, dash: false });

    return { nodes: list, W: W, H: yOf(rows) + PAD + 10, xOf: xOf, yOf: yOf };
  }

  function trainerTab(host) {
    var st = A.store.get('morse.train', { wpm: 12 });
    function save() { A.store.set('morse.train', st); }

    var tree = buildTree();
    var byCode = {};
    tree.nodes.forEach(function (n) { byCode[n.code] = n; });

    /* build the SVG */
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + tree.W + ' ' + tree.H);
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';

    var els = {};   /* code -> { shape, text } */

    /* Every node now has its immediate parent drawn, digits included, so a link
       is always exactly one row long: straight down from the parent, then
       across into the child. A child directly below its parent collapses to a
       single vertical line. No buses, no skipped levels, nothing dashed. */
    tree.nodes.forEach(function (n) {
      if (!n.code) return;
      var p = byCode[n.code.slice(0, -1)] || byCode[''];
      if (!p) return;
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M ' + p.x + ' ' + p.y + ' L ' + p.x + ' ' + n.y + ' L ' + n.x + ' ' + n.y);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'var(--border)');
      path.setAttribute('stroke-width', '1.5');
      svg.appendChild(path);
    });

    /* antenna at the root */
    var root = byCode[''];
    if (!root) return;
    var ant = document.createElementNS(ns, 'path');
    ant.setAttribute('d', 'M' + (root.x - 7) + ' ' + (root.y - 14) + ' L' + root.x + ' ' + root.y + ' L' + (root.x + 7) + ' ' + (root.y - 14) + ' M' + root.x + ' ' + root.y + ' L' + root.x + ' ' + (root.y - 20));
    ant.setAttribute('stroke', 'var(--muted)'); ant.setAttribute('stroke-width', '2'); ant.setAttribute('fill', 'none');
    svg.appendChild(ant);

    /* nodes */
    tree.nodes.forEach(function (n) {
      if (n.root) return;
      var shape, r;

      /* A combination that spells no character but leads to a digit. It is
         drawn small, carrying the glyph of the press it needs, so the route
         to a number stays readable as a sequence of short and long presses
         rather than becoming an unexplained gap. */
      if (n.junction) {
        r = 7;
        if (n.dash) {
          shape = document.createElementNS(ns, 'rect');
          shape.setAttribute('x', n.x - (n.horiz ? r + 3 : r - 2));
          shape.setAttribute('y', n.y - (n.horiz ? r - 2 : r + 3));
          shape.setAttribute('width', (n.horiz ? r + 3 : r - 2) * 2);
          shape.setAttribute('height', (n.horiz ? r - 2 : r + 3) * 2);
          shape.setAttribute('rx', 2);
        } else {
          shape = document.createElementNS(ns, 'circle');
          shape.setAttribute('cx', n.x); shape.setAttribute('cy', n.y); shape.setAttribute('r', r - 1);
        }
        shape.setAttribute('fill', 'var(--surface-2)');
        shape.setAttribute('stroke', n.dash ? 'var(--danger)' : 'var(--ok)');
        shape.setAttribute('stroke-opacity', '0.5');
        shape.setAttribute('stroke-width', '1.5');
        svg.appendChild(shape);

        var jg = document.createElementNS(ns, 'text');
        jg.setAttribute('x', n.x); jg.setAttribute('y', n.y + (n.dash ? 3 : 3.5));
        jg.setAttribute('text-anchor', 'middle');
        jg.setAttribute('font-size', n.dash ? '13' : '15');
        jg.setAttribute('font-weight', '700');
        jg.setAttribute('fill', 'var(--muted)');
        /* the press it takes to get here: a short one or a long one */
        jg.textContent = n.dash ? '\u2013' : '\u2022';
        svg.appendChild(jg);

        els[n.code] = { shape: shape, text: jg, junction: true };
        return;
      }

      /* A dash is drawn long along the direction its own link arrives from:
         reached sideways it is a wide rectangle, reached from above it is a
         tall one. The shape then reads as the length of the press, in the
         sense the tree is travelling. */
      r = n.code.length > 4 ? 9 : 10.5;
      if (n.dash) {
        var hw = n.horiz ? r + 3 : r - 2;
        var hh = n.horiz ? r - 2 : r + 3;
        shape = document.createElementNS(ns, 'rect');
        shape.setAttribute('x', n.x - hw); shape.setAttribute('y', n.y - hh);
        shape.setAttribute('width', hw * 2); shape.setAttribute('height', hh * 2);
        shape.setAttribute('rx', 3);
      } else {
        shape = document.createElementNS(ns, 'circle');
        shape.setAttribute('cx', n.x); shape.setAttribute('cy', n.y); shape.setAttribute('r', r);
      }
      shape.setAttribute('fill', 'var(--surface-2)');
      /* a green outline for a dot (round) node, red for a dash (square) one, so
         the two press types read at a glance even before the path lights up */
      shape.setAttribute('stroke', n.dash ? 'var(--danger)' : 'var(--ok)');
      shape.setAttribute('stroke-opacity', '0.65');
      shape.setAttribute('stroke-width', '2');
      svg.appendChild(shape);

      var txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', n.x); txt.setAttribute('y', n.y + 3.5);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', n.code.length > 4 ? '9.5' : '11');
      txt.setAttribute('font-weight', '700');
      txt.setAttribute('fill', 'var(--text-2)');
      txt.textContent = n.letter;
      svg.appendChild(txt);

      els[n.code] = { shape: shape, text: txt };
    });

    function clearLights() {
      tree.nodes.forEach(function (n) {
        if (!n.code) return;
        var e = els[n.code];
        if (!e) return;
        e.shape.setAttribute('fill', 'var(--surface-2)');
        e.shape.setAttribute('fill-opacity', '1');
        e.shape.setAttribute('stroke-width', n.junction ? '1.5' : '2');
        e.shape.setAttribute('stroke', n.dash ? 'var(--morse-dash)' : 'var(--morse-dot)');
        e.shape.setAttribute('stroke-opacity', e.junction ? '0.5' : '0.65');
        if (e.text) e.text.setAttribute('fill', e.junction ? 'var(--muted)' : 'var(--text-2)');
      });
    }
    function light(code, strong) {
      var e = els[code];
      if (!e) return;
      var dash = code[code.length - 1] === '-';
      /* The node just keyed is filled solid; the ones already passed through
         are tinted. Before, every node on the path was painted identically,
         so the eye could not tell which press it was on and the chart looked
         like it was lighting the PREVIOUS letter. */
      /* The colours come from variables rather than straight from --acc, so a
         monochrome theme can give this one chart real colour. Raider's accent
         is white, which meant a lit dot was a white disc with white text on
         it: the letter simply disappeared at the moment you keyed it. */
      var col = dash ? 'var(--morse-dash)' : 'var(--morse-dot)';
      e.shape.setAttribute('fill', col);
      e.shape.setAttribute('fill-opacity', strong ? '1' : '0.28');
      e.shape.setAttribute('stroke', col);
      e.shape.setAttribute('stroke-opacity', '1');
      e.shape.setAttribute('stroke-width', strong ? '2.5' : '2');
      if (!e.text) return;
      /* A solidly filled node inverts its letter. A tinted one does not: it is
         still mostly background, so ordinary text colour is what reads. */
      e.text.setAttribute('fill', strong ? 'var(--morse-lit-text)' : 'var(--text)');
    }

    /* Light the whole route, with the LAST element keyed shown strongly. When
       the code so far spells nothing yet, the deepest node that does exist is
       the one the operator is standing on, so that is the one lit strongly:
       lighting a fixed four-symbol prefix instead was what made the tree
       appear to highlight a letter already finished with. */
    function showPath(symbols) {
      clearLights();
      var last = '';
      for (var i = 1; i <= symbols.length; i++) {
        if (els[symbols.slice(0, i)]) last = symbols.slice(0, i);
      }
      for (var j = 1; j <= last.length; j++) {
        light(last.slice(0, j), j === last.length);
      }
    }

    var wrap = A.el('.card', { style: { padding: '10px 6px', textAlign: 'center' } });
    wrap.appendChild(svg);

    var letterOut = A.el('.card', { style: { fontFamily: 'var(--mono)', fontSize: '18px', minHeight: '44px', wordBreak: 'break-word', lineHeight: '1.7' } });

    var keyer = makeKeyer({
      wpm: function () { return st.wpm; },
      onSymbol: function (sym, symbols) { showPath(symbols); },
      /* live while the key is held, so the node lights under your thumb */
      onPreview: function (code) { showPath(code); },
      onDashReached: function () { A.haptic(8); },
      onReset: function () { clearLights(); },
      onLetter: function (ch, symbols, out) {
        /* flash the reached letter, then clear for the next */
        if (byCode[symbols]) { showPath(symbols); }
        letterOut.textContent = out;
        setTimeout(clearLights, 260);
      },
      onWord: function (out) { letterOut.textContent = out || '—'; }
    });

    host.appendChild(A.UI.section('Morse tree'));
    host.appendChild(wrap);
    host.appendChild(A.UI.section('Spelled so far'));
    host.appendChild(letterOut);

    /* Key first, then the speed that governs it. The slider used to sit above
       the key, which put the control before the thing it controls. */
    var key = keyButton(keyer, 'HOLD TO KEY');
    host.appendChild(key);
    var ctl = A.el('.split', { style: { marginTop: '10px' } });
    ctl.appendChild(A.el('button.btn.ghost.block', { text: 'Space', onclick: function () { A.haptic(); keyer.space(); letterOut.textContent = keyer.text() || '—'; } }));
    ctl.appendChild(A.el('button.btn.ghost.block.sem-del', { text: 'Clear', onclick: function () { A.haptic(); keyer.clear(); clearLights(); letterOut.textContent = '—'; } }));
    host.appendChild(ctl);
    host.appendChild(speedRow(function () { return st.wpm; }, function (v) { st.wpm = v; save(); }));

    letterOut.textContent = '—';

    /* No chart under the tree. The tree carries every letter, number and
       punctuation mark now, so repeating them underneath was the same
       information twice on one screen. */
  }

  /* ══ page ═════════════════════════════════════════════════════════════ */

  /* The key comes first: this is a Morse page, and the thing you reach for is
     the key. The old first tab is still id 'text' so anyone's stored tab and
     any existing link keeps working - only the label changed to Write. */
  var TABS = [
    { id: 'key', label: 'Key' },
    { id: 'text', label: 'Write' },
    { id: 'listen', label: 'Listen' },
    { id: 'trainer', label: 'Trainer' }
  ];

  function render(host) {
    /* keep the active script in step with the stored choice */
    var stored = A.store.get('morse.script', 'latin');
    if (stored !== script) setScript(stored);

    var tab = A.store.get('morse.tab', 'text');
    if (!TABS.some(function (t) { return t.id === tab; })) tab = 'text';

    /* the tab chips, with a Latin / Cyrillic switch pinned to the right */
    var head = A.el('.morse-head');
    var chips = A.UI.chips(TABS, tab, function (id) {
      stopPlayback(); stopMic();
      A.store.set('morse.tab', id);
      A.Router.refresh();
    });
    chips.classList.add('morse-head-tabs');
    head.appendChild(chips);
    var scriptBtn = A.el('button.chip.morse-script' + (script === 'cyrillic' ? '.on' : ''), {
      text: script === 'cyrillic' ? 'АБВ' : 'ABC',
      title: 'Latin / Cyrillic Morse',
      onclick: function () {
        stopPlayback(); stopMic();
        setScript(script === 'cyrillic' ? 'latin' : 'cyrillic');
        A.haptic(12);
        A.Router.refresh();
      }
    });
    head.appendChild(scriptBtn);
    host.appendChild(head);

    var body = A.el('div');
    host.appendChild(body);

    if (tab === 'key') keyTab(body);
    else if (tab === 'listen') listenTab(body);
    else if (tab === 'trainer') trainerTab(body);
    else textTab(body);
  }

  /* stop any tone or microphone when the user navigates away */
  A.Bus.on('route', function () { stopPlayback(); stopMic(); });

  global.ArtMorse = { render: render, textToMorse: textToMorse, morseToText: morseToText };

})(window);
