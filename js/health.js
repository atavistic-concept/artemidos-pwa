/* ══ HEALTH ═══════════════════════════════════════════════════════════════

   Two instruments for the minutes before help arrives: a pulse counter and a
   CPR metronome.

   NEITHER OF THESE IS A DIAGNOSIS AND NEITHER IS TRAINING. The pulse tool
   counts taps and does arithmetic on them; the number it gives is only as good
   as the finger on the artery. The CPR tool keeps time and counts to thirty; it
   cannot see the chest and does not know whether the compressions are deep
   enough or in the right place. Both say so on the screen, because a field tool
   that implies more authority than it has is worse than no tool.

   The one instruction that outranks everything on this page is: call for help
   first, or have someone else call while you work. */
(function (global) {
  'use strict';
  var A = global.A;
  var Icons = global.Icons;

  /* ── sound ──
     Its own audio context rather than the time tools' one: this page beeps in a
     tight cadence for minutes at a time and must not fight the timer for the
     same object. A compression tick is SHORT - a click, not a note - because a
     long tone at 120 a minute runs into the next one and the cadence is lost. */
  var actx = null;
  function ctx() {
    var C = global.AudioContext || global.webkitAudioContext;
    if (!C) return null;
    try {
      if (!actx || actx.state === 'closed') actx = new C();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freq, ms, when, vol) {
    var c = ctx(); if (!c) return;
    try {
      var t = when || c.currentTime;
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = freq;
      o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.45, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch (e) { /* silence is survivable */ }
  }
  function tick() { tone(1000, 55); }
  function accent() { tone(1500, 90); }
  function twoTone() { tone(880, 160); tone(1320, 160, (ctx() ? ctx().currentTime : 0) + 0.22); }
  function buzz(pat) {
    var H = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Haptics;
    pat = pat || [120];
    if (H && H.vibrate) {
      var at = 0;
      for (var i = 0; i < pat.length; i += 2) {
        (function (dur, delay) {
          setTimeout(function () { try { H.vibrate({ duration: dur }); } catch (e) {} }, delay);
        })(pat[i], at);
        at += pat[i] + (pat[i + 1] || 0);
      }
      return;
    }
    try { if (navigator.vibrate) navigator.vibrate(pat); } catch (e) {}
  }

  function two(n) { return (n < 10 ? '0' : '') + n; }
  function clock(ms) {
    var t = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(t / 60) + ':' + two(t % 60);
  }

  /* ══ PULSE ═══════════════════════════════════════════════════════════════

     Tap once per beat. The rate comes from the SPAN BETWEEN THE FIRST AND LAST
     TAP divided by the number of gaps, not from an average of instantaneous
     gaps: a single late thumb ruins one gap but barely moves the span, so the
     span estimator is the steadier of the two and gets better the longer you
     count. That is also why the reading is held back until a few beats are in:
     two taps is not a pulse, it is a guess with two decimal places. */

  var BANDS = [
    { id: 'adult', label: 'Adult / 10+', lo: 60, hi: 100,
      note: 'Adults and children of ten and over: 60 to 100 at rest.' },
    { id: 'athlete', label: 'Trained athlete', lo: 40, hi: 60,
      note: 'A well-trained athlete rests lower, 40 to 60, and that is fitness, not illness.' },
    { id: 'child', label: 'Child 1 to 9', lo: 70, hi: 110,
      note: 'Children of one to nine: roughly 70 to 110, the younger the faster.' },
    { id: 'infant', label: 'Infant under 1', lo: 80, hi: 160,
      note: 'Infants under a year: 80 to 160. A fast pulse is normal at this age.' }
  ];
  function bandById(id) {
    for (var i = 0; i < BANDS.length; i++) if (BANDS[i].id === id) return BANDS[i];
    return BANDS[0];
  }

  function pulseTab(host) {
    var st = A.store.get('health.pulse', { band: 'adult', sound: true });
    function save() { A.store.set('health.pulse', st); }

    var taps = [];                       /* timestamps, ms */
    var running = false;

    var read = A.el('.tt-read', { text: '—' });
    var unit = A.el('.lrow-s', { style: { textAlign: 'center', marginTop: '-4px' }, text: 'beats per minute' });
    var sub = A.el('.lrow-s', { style: { textAlign: 'center', marginTop: '6px', whiteSpace: 'normal' } });
    var verdict = A.el('div');

    function bpm() {
      if (taps.length < 2) return NaN;
      var span = taps[taps.length - 1] - taps[0];
      if (!(span > 0)) return NaN;
      return (taps.length - 1) * 60000 / span;
    }
    /* how ragged the tapping was: the spread of the gaps around their mean.
       A steady pulse tapped steadily sits under about 10 per cent. */
    function scatter() {
      if (taps.length < 4) return NaN;
      var g = [], i;
      for (i = 1; i < taps.length; i++) g.push(taps[i] - taps[i - 1]);
      var mean = 0;
      for (i = 0; i < g.length; i++) mean += g[i];
      mean /= g.length;
      if (!(mean > 0)) return NaN;
      var v = 0;
      for (i = 0; i < g.length; i++) v += (g[i] - mean) * (g[i] - mean);
      return Math.sqrt(v / g.length) / mean * 100;
    }

    function paint() {
      var b = bpm();
      var elapsed = taps.length ? (Date.now() - taps[0]) : 0;

      /* fewer than five beats in and the number swings by twenty with every
         tap. Show the count instead of a figure nobody should act on. */
      if (!isFinite(b) || taps.length < 5) {
        read.textContent = taps.length ? String(taps.length) : '—';
        unit.textContent = taps.length ? (taps.length === 1 ? 'beat tapped' : 'beats tapped') : 'beats per minute';
        sub.textContent = running
          ? 'Keep tapping. The reading appears at five beats and settles by fifteen.'
          : 'Tap the button once for every beat you feel.';
        A.clear(verdict);
        return;
      }

      read.textContent = String(Math.round(b));
      unit.textContent = 'beats per minute';
      var sc = scatter();
      sub.textContent = taps.length + ' beats over ' + clock(elapsed) +
        (isFinite(sc) ? '   ·   steadiness ' + (sc < 8 ? 'good' : (sc < 18 ? 'fair' : 'ragged')) : '');

      A.clear(verdict);
      var band = bandById(st.band);
      var c = A.UI.card();
      var where, why;
      if (b < band.lo) {
        where = 'Below the usual range';
        why = 'Slower than the ' + band.lo + ' to ' + band.hi + ' expected for this person at rest. ' +
              'That can be fitness, sleep, or a cold casualty; it can also be a heart that is not ' +
              'keeping up. What matters is the person, not the number: are they awake, talking, ' +
              'warm, and not short of breath?';
      } else if (b > band.hi) {
        where = 'Above the usual range';
        why = 'Faster than the ' + band.lo + ' to ' + band.hi + ' expected for this person at rest. ' +
              'Effort, fear, pain, fever, blood loss, dehydration and many drugs all do this, and so ' +
              'does simply having walked in. Rest them a few minutes and count again before reading ' +
              'anything into it.';
      } else {
        where = 'Within the usual range';
        why = 'Inside the ' + band.lo + ' to ' + band.hi + ' expected for this person at rest. ' +
              'A normal rate does not rule anything out on its own.';
      }
      c.appendChild(A.el('.sec-lab', { text: where }));
      c.appendChild(A.el('p', {
        text: why,
        style: { fontSize: '13px', lineHeight: '1.55', color: 'var(--text-2)', marginTop: '6px' }
      }));
      c.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '8px' },
        text: band.note
      }));
      verdict.appendChild(c);

      if (isFinite(sc) && sc >= 18) {
        verdict.appendChild(A.UI.note(
          'The gaps between your taps were uneven. That is usually the tapping rather than the ' +
          'heart, but a genuinely irregular pulse is worth reporting to whoever takes over.'));
      }
    }

    host.appendChild(A.UI.note(
      'This counts your taps and does the arithmetic. It is not a diagnosis and it cannot ' +
      'examine anyone. If the person is unwell, get them medical help and let the professionals ' +
      'read the number.'));

    host.appendChild(read);
    host.appendChild(unit);
    host.appendChild(sub);

    var tapBtn = A.el('button.btn.block.btn-go', {
      html: Icons.svg('target') + ' Tap on every beat',
      style: { marginTop: '12px', padding: '22px 12px', fontSize: '17px' }
    });
    tapBtn.addEventListener('click', function () {
      var now = Date.now();
      /* two taps inside 250 ms is a bounce, not a heart at 240 */
      if (taps.length && now - taps[taps.length - 1] < 250) return;
      taps.push(now);
      running = true;
      if (st.sound) tick();
      A.haptic(12);
      paint();
    });
    host.appendChild(tapBtn);

    var row = A.el('.split', { style: { marginTop: '8px' } });
    row.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('refresh') + ' Reset',
      onclick: function () { taps = []; running = false; A.haptic(); paint(); }
    }));
    row.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('minus') + ' Undo tap',
      onclick: function () { taps.pop(); A.haptic(); paint(); }
    }));
    host.appendChild(row);
    /* the reading means nothing without the band it is being judged against,
       so the verdict sits directly under the number and the controls */
    host.appendChild(verdict);

    host.appendChild(A.el('.sec-lab', { text: 'Who is being counted', style: { marginTop: '14px' } }));
    host.appendChild(A.UI.chips(
      BANDS.map(function (b) { return { id: b.id, label: b.label }; }),
      st.band,
      function (id) { st.band = id; save(); A.haptic(); paint(); }
    ));

    var srow = A.el('.nav-auto', { style: { marginTop: '12px' } });
    srow.appendChild(A.el('span', { text: 'Click on every tap' }));
    var sbtn = A.el('button.nav-toggle' + (st.sound ? '.on' : ''), {
      text: st.sound ? 'On' : 'Off',
      onclick: function () {
        st.sound = !st.sound; save();
        sbtn.classList.toggle('on', st.sound);
        sbtn.textContent = st.sound ? 'On' : 'Off';
        A.haptic();
      }
    });
    srow.appendChild(sbtn);
    host.appendChild(srow);

    host.appendChild(A.el('.sec-lab', { text: 'How to find it', style: { marginTop: '16px' } }));
    host.appendChild(A.UI.note(
      'Index and middle fingertips, never the thumb: the thumb has a pulse of its own and you ' +
      'will end up counting your own heart. Use the radial artery on the thumb side of the inner ' +
      'wrist, or the carotid at the side of the neck beside the windpipe. Press gently; hard ' +
      'enough to flatten the artery and the beat disappears. Never press both sides of the neck ' +
      'at once.'));
    host.appendChild(A.UI.note(
      'For a resting rate, count after several quiet minutes, or first thing before getting up. ' +
      'Exercise, stress, fever, cold and medication all move it, so one reading is a snapshot, ' +
      'not a baseline. Counting for fifteen seconds and multiplying by four works without a ' +
      'phone; this tool is the same idea with the arithmetic done for you and more beats behind it.'));

    paint();
    var t = setInterval(function () {
      if (!document.body.contains(read)) { clearInterval(t); return; }
      if (running && taps.length) paint();
    }, 1000);
    return function () { clearInterval(t); };
  }

  /* ══ CPR ═════════════════════════════════════════════════════════════════

     A metronome that counts to thirty. The numbers are the resuscitation
     council consensus and are not settings to be improvised with: 100 to 120
     compressions a minute, 30 compressions to 2 breaths, at least 5 cm deep and
     no more than 6.

     The rate is a chip rather than a free field on purpose. Somebody typing 60
     into a box during an arrest would get a metronome confidently keeping the
     wrong time, and the tool would be helping them do it wrong. */

  var MODES = [
    { id: '302', label: '30 : 2' },
    { id: 'only', label: 'Compressions only' },
    { id: 'airway', label: 'Advanced airway' }
  ];

  function cprTab(host) {
    var st = A.store.get('health.cpr', { rate: 110, mode: '302', sound: true, vibe: false });
    if (!st.rate) st.rate = 110;
    function save() { A.store.set('health.cpr', st); }

    /* live state.
       THE CADENCE IS KEPT ON THE AUDIO CLOCK, NOT ON setInterval. A phone that
       dims its screen or backgrounds the page throttles JavaScript timers, and
       a metronome built on setInterval quietly halves its rate when that
       happens - measured at 64 a minute with 120 asked for. The audio clock is
       not throttled, so every click is SCHEDULED AHEAD on it and the beats land
       on time whatever the page is doing. The JavaScript timer is demoted to
       refilling the queue and repainting, where being late costs nothing. */
    var poll = null, running = false;
    var count = 0, cycles = 0, total = 0;
    var startedAt = 0;
    var phase = 'idle';                 /* idle | compress | breaths */
    var baseAt = 0;                     /* audio time of this set's first beat */
    var baseWall = 0;                   /* wall time of the same first beat */
    var nextIdx = 0;                    /* next beat index still to schedule */
    var nextBreath = 0;                 /* audio time of the next airway cue */
    var LOOKAHEAD = 1.5;                /* seconds of clicks kept queued */

    var big = A.el('.tt-read', { text: '0' });
    var lab = A.el('.lrow-s', { style: { textAlign: 'center', marginTop: '-4px' }, text: 'compressions' });
    var bar = A.el('.tt-bar'); var barIn = A.el('.tt-bar-in'); bar.appendChild(barIn);
    var stat = A.el('.lrow-s', { style: { textAlign: 'center', marginTop: '6px', whiteSpace: 'normal' } });
    var breathCard = A.el('div');

    function period() { return 60000 / st.rate; }

    function paint() {
      big.textContent = String(count);
      lab.textContent = (phase === 'breaths') ? 'give 2 rescue breaths' :
        (count === 1 ? 'compression' : 'compressions');
      barIn.style.width = (st.mode === '302' && phase !== 'breaths')
        ? Math.round(100 * (count % 30 || (count ? 30 : 0)) / 30) + '%' : '0%';
      var mins = startedAt ? clock(Date.now() - startedAt) : '0:00';
      stat.textContent = 'Cycle ' + (cycles + (phase === 'breaths' ? 0 : 1)) +
        '   ·   ' + total + ' compressions   ·   ' + mins;
    }

    function stopTimer() { if (poll) { clearInterval(poll); poll = null; } }

    /* fill the audio queue up to the lookahead horizon */
    function fill() {
      var c = ctx(); if (!c) return;
      var per = period() / 1000;
      var horizon = c.currentTime + LOOKAHEAD;
      while (baseAt + nextIdx * per < horizon) {
        if (st.mode === '302' && nextIdx >= 30) break;
        var at = baseAt + nextIdx * per;
        if (at >= c.currentTime) {
          if (st.sound) {
            /* every tenth click is accented, so the count can be heard as well
               as read - useful when nobody can look at the screen */
            if ((nextIdx + 1) % 10 === 0) tone(1500, 90, at);
            else tone(1000, 55, at);
          }
        }
        nextIdx++;
      }
      /* the advanced-airway cue: one breath every six seconds, sounded over
         compressions that never stop */
      if (st.mode === 'airway' && st.sound) {
        while (nextBreath < horizon) {
          if (nextBreath >= c.currentTime) { tone(880, 170, nextBreath); tone(1320, 170, nextBreath + 0.22); }
          nextBreath += 6;
        }
      }
    }

    /* How many beats have gone by, COUNTED ON THE WALL CLOCK.
       The two clocks have different jobs. The audio clock schedules the sound,
       because it is the only one that keeps time when the page is throttled.
       But a freshly opened AudioContext does not tick smoothly for the first
       second or so while it starts its render thread - measured stalling and
       then jumping five beats at once - and a counter driven off it jumps with
       it. The wall clock is smooth from the first millisecond, so it drives the
       NUMBER while the audio clock drives the CLICKS. */
    function elapsedBeats() {
      if (!baseWall) return 0;
      var per = period();
      var n = Math.floor((Date.now() - baseWall) / per) + 1;
      if (n < 0) n = 0;
      if (st.mode === '302' && n > 30) n = 30;
      return n;
    }

    function step() {
      if (!running) return;
      fill();
      var n = elapsedBeats();
      if (n !== count) {
        total += (n - count);
        if (st.vibe && n > count) buzz([40]);
        count = n;
        paint();
      }
      if (st.mode === '302' && count >= 30) {
        stopTimer();
        running = false;
        phase = 'breaths';
        cycles++;
        if (st.sound) twoTone();
        if (st.vibe) buzz([300, 150, 300]);
        render();
      }
    }

    function start() {
      var c = ctx();                     /* open the audio on the user's tap */
      if (!startedAt) startedAt = Date.now();
      phase = 'compress';
      running = true;
      count = 0;
      nextIdx = 0;
      /* a hair in the future so the first click is scheduled, not missed */
      baseAt = (c ? c.currentTime : 0) + 0.06;
      baseWall = Date.now() + 60;
      nextBreath = baseAt + 6;
      stopTimer();
      fill();
      poll = setInterval(step, 100);
      paint();
      render();
    }
    function halt() {
      stopTimer(); running = false; phase = 'idle';
      /* silence anything already queued by throwing the context away */
      try { if (actx) { actx.close(); actx = null; } } catch (e) {}
      render();
    }
    function reset() {
      halt();
      count = 0; cycles = 0; total = 0; startedAt = 0; baseAt = 0; baseWall = 0; nextIdx = 0;
      render();
    }

    var body = A.el('div');

    function render() {
      A.clear(body);
      paint();

      if (phase === 'breaths') {
        var bc = A.UI.card();
        bc.appendChild(A.el('.sec-lab', { text: '30 done. Two rescue breaths now.' }));
        bc.appendChild(A.el('p', {
          text: 'Head back, chin lifted, pinch the nose. One second per breath, just enough to ' +
                'make the chest rise. If a breath does not go in, reposition the head and try ' +
                'once more, then get straight back on the chest.',
          style: { fontSize: '13px', lineHeight: '1.55', color: 'var(--text-2)', marginTop: '6px' }
        }));
        bc.appendChild(A.el('button.btn.block.btn-go', {
          html: Icons.svg('play') + ' Breaths done, next 30',
          style: { marginTop: '12px', padding: '18px 12px', fontSize: '16px' },
          onclick: function () { A.haptic(); start(); }
        }));
        bc.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('stop') + ' Stop',
          style: { marginTop: '8px' },
          onclick: function () { A.haptic(); halt(); }
        }));
        body.appendChild(bc);
      } else {
        var go = A.el('button.btn.block' + (running ? '.btn-kill' : '.btn-go'), {
          html: Icons.svg(running ? 'stop' : 'play') + (running ? ' Stop' : ' Start compressions'),
          style: { marginTop: '12px', padding: '20px 12px', fontSize: '17px' },
          onclick: function () { A.haptic(); if (running) halt(); else start(); }
        });
        body.appendChild(go);
      }

      var r2 = A.el('.split', { style: { marginTop: '8px' } });
      r2.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('refresh') + ' Reset count',
        onclick: function () { A.haptic(); reset(); }
      }));
      body.appendChild(r2);

      if (cycles >= 5 && phase !== 'breaths') {
        body.appendChild(A.UI.note(
          'Five cycles done, about two minutes. If there is anyone else who can take over, ' +
          'swap now: compressions get shallower as the rescuer tires and almost nobody notices ' +
          'it happening to them.'));
      }
    }

    host.appendChild(A.UI.note(
      'Call emergency services first, or send someone else to call while you start. This page ' +
      'is a metronome and a counter. It cannot see the chest, it does not know how deep you are ' +
      'pushing, and it is no substitute for being trained.'));

    host.appendChild(big);
    host.appendChild(lab);
    host.appendChild(bar);
    host.appendChild(stat);
    host.appendChild(body);
    host.appendChild(breathCard);

    host.appendChild(A.el('.sec-lab', { text: 'Cadence', style: { marginTop: '16px' } }));
    host.appendChild(A.UI.chips(
      [{ id: '100', label: '100 / min' }, { id: '110', label: '110 / min' }, { id: '120', label: '120 / min' }],
      String(st.rate),
      function (id) {
        st.rate = +id; save(); A.haptic();
        /* changing the rate mid-set restarts THIS set's clock rather than
           trying to retime clicks already queued at the old spacing */
        if (running) start();
        A.Router.refresh();
      }
    ));

    host.appendChild(A.el('.sec-lab', { text: 'How it is being done', style: { marginTop: '12px' } }));
    host.appendChild(A.UI.chips(
      MODES, st.mode,
      function (id) { st.mode = id; save(); A.haptic(); reset(); A.Router.refresh(); }
    ));

    if (st.mode === 'only') {
      host.appendChild(A.UI.note(
        'Compressions only, no pauses. This is what an untrained rescuer should do, and what ' +
        'anyone should do rather than stop: 100 to 120 a minute, without breaks, until help ' +
        'arrives or the person moves.'));
    } else if (st.mode === 'airway') {
      host.appendChild(A.UI.note(
        'With an advanced airway in place the compressions no longer stop for breaths. This mode ' +
        'runs them continuously and sounds a double tone every six seconds, which is one breath, ' +
        'ten a minute.'));
    } else {
      host.appendChild(A.UI.note(
        'Thirty compressions, then two breaths, over and over. The counter stops the metronome at ' +
        'thirty and waits for you rather than beeping through the breaths.'));
    }

    var arow = A.el('.nav-auto', { style: { marginTop: '12px' } });
    arow.appendChild(A.el('span', { text: 'Beep on every compression' }));
    var abtn = A.el('button.nav-toggle' + (st.sound ? '.on' : ''), {
      text: st.sound ? 'On' : 'Off',
      onclick: function () {
        st.sound = !st.sound; save();
        abtn.classList.toggle('on', st.sound);
        abtn.textContent = st.sound ? 'On' : 'Off';
        A.haptic();
      }
    });
    arow.appendChild(abtn);
    host.appendChild(arow);

    var vrow = A.el('.nav-auto', { style: { marginTop: '8px' } });
    vrow.appendChild(A.el('span', { text: 'Vibrate on every compression' }));
    var vbtn = A.el('button.nav-toggle' + (st.vibe ? '.on' : ''), {
      text: st.vibe ? 'On' : 'Off',
      onclick: function () {
        st.vibe = !st.vibe; save();
        vbtn.classList.toggle('on', st.vibe);
        vbtn.textContent = st.vibe ? 'On' : 'Off';
        A.haptic();
      }
    });
    vrow.appendChild(vbtn);
    host.appendChild(vrow);

    host.appendChild(A.el('.sec-lab', { text: 'The numbers', style: { marginTop: '16px' } }));
    var nc = A.UI.card(null, 'tight');
    nc.appendChild(A.UI.metric('Rate', '100 to 120 per minute'));
    nc.appendChild(A.UI.metric('Depth', 'at least 5 cm, no more than 6'));
    nc.appendChild(A.UI.metric('Ratio', '30 compressions to 2 breaths'));
    nc.appendChild(A.UI.metric('Five cycles', 'about 2 minutes'));
    nc.appendChild(A.UI.metric('Advanced airway', 'continuous, 1 breath every 6 s'));
    host.appendChild(nc);
    host.appendChild(A.UI.note(
      'Heel of the hand on the centre of the chest, the other hand on top, arms straight, ' +
      'shoulders over your hands. Let the chest come all the way back up between compressions: ' +
      'leaning on it is one of the commonest faults and it stops the heart refilling.'));

    render();
    var tk = setInterval(function () {
      if (!document.body.contains(big)) { clearInterval(tk); stopTimer(); return; }
      if (running) paint();
    }, 500);
    return function () {
      clearInterval(tk); stopTimer(); running = false;
      try { if (actx) { actx.close(); actx = null; } } catch (e) {}
    };
  }


  /* ══ PERIOD ══════════════════════════════════════════════════════════════

     A cycle calendar that learns from what actually happened.

     THE PREDICTION IS BUILT ON THE LUTEAL PHASE, NOT ON "DAY 14". The half of
     the cycle after ovulation is the steady one - close to fourteen days in
     most people, and it varies little even when the cycle itself does. The
     follicular half is where the variation lives. So ovulation is estimated
     backwards from the NEXT expected period rather than forwards from the last
     one, which is why a long cycle pushes ovulation later instead of leaving it
     stranded on day fourteen.

     Everything is estimated from this person's own logged starts: the median
     gap between them, not an average, because one mistyped date would drag an
     average and barely moves a median. Logging a real start always wins over a
     predicted one - that is the point of logging it - and every later
     prediction is recomputed from the new history.

     IT IS NOT CONTRACEPTION. Sperm survive for days, ovulation moves with
     illness, travel and stress, and a calendar cannot see any of that. The page
     says so where it cannot be missed. */

  var MONTHS_P = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW_P = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function ymd(d) {
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  }
  function fromYmd(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? null : d;
  }
  function addDays(d, n) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }
  /* whole days from a to b, both midnight-normalised so daylight saving cannot
     turn a 24-hour gap into 23 and lose a day out of a cycle */
  function daysBetween(a, b) {
    var ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
             Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    return Math.round(ms / 86400000);
  }
  function median(arr) {
    if (!arr.length) return NaN;
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function prettyDate(d) {
    return DOW_P[(d.getDay() + 6) % 7] + ' ' + d.getDate() + ' ' + MONTHS_P[d.getMonth()].slice(0, 3);
  }

  var CYCLE_MIN = 15, CYCLE_MAX = 60;      /* anything outside is a typo, not a cycle */

  /* everything the page needs to know about this person's history */
  function cycleModel(st) {
    var logs = (st.logs || []).filter(function (l) { return fromYmd(l.start); })
      .sort(function (a, b) { return a.start < b.start ? -1 : 1; });

    var gaps = [], i;
    for (i = 1; i < logs.length; i++) {
      var g = daysBetween(fromYmd(logs[i - 1].start), fromYmd(logs[i].start));
      if (g >= CYCLE_MIN && g <= CYCLE_MAX) gaps.push(g);
    }
    /* the last six cycles: far enough back to be steady, recent enough to
       follow a body that has changed */
    var recent = gaps.slice(-6);
    var cycle = recent.length ? Math.round(median(recent)) : 28;

    var bleeds = [];
    logs.forEach(function (l) {
      var a = fromYmd(l.start), b = fromYmd(l.end);
      if (a && b) {
        var n = daysBetween(a, b) + 1;
        if (n >= 1 && n <= 14) bleeds.push(n);
      }
    });
    var bleed = bleeds.length ? Math.round(median(bleeds.slice(-6))) : 5;

    var spread = recent.length > 1 ? (Math.max.apply(null, recent) - Math.min.apply(null, recent)) : NaN;
    var luteal = +st.luteal || 14;

    return {
      logs: logs, gaps: gaps, recent: recent, cycle: cycle, bleed: bleed,
      spread: spread, luteal: luteal,
      last: logs.length ? fromYmd(logs[logs.length - 1].start) : null,
      known: recent.length
    };
  }

  /* the predicted starts after the last logged one */
  function futureStarts(m, n) {
    var out = [];
    if (!m.last) return out;
    for (var k = 1; k <= n; k++) out.push(addDays(m.last, m.cycle * k));
    return out;
  }

  /* What a given day is. Logged bleeding beats everything; after that the day
     is placed inside whichever cycle it falls in, counting from the most recent
     start - logged if there is one, otherwise predicted. */
  function dayKind(d, m) {
    var i, a, b;
    for (i = 0; i < m.logs.length; i++) {
      a = fromYmd(m.logs[i].start);
      b = fromYmd(m.logs[i].end);
      if (!a) continue;
      if (b) { if (daysBetween(a, d) >= 0 && daysBetween(d, b) >= 0) return 'logged'; }
      else if (daysBetween(a, d) === 0) return 'logged';
    }
    if (!m.last) return '';
    /* Anchor on the most recent LOGGED start on or before this day, so paging
       back through the year phases the cycles that actually happened instead of
       projecting the latest one backwards over them. Only past the last log
       does it fall through to prediction. */
    var anchor = null;
    for (i = 0; i < m.logs.length; i++) {
      a = fromYmd(m.logs[i].start);
      if (a && daysBetween(a, d) >= 0 && (!anchor || daysBetween(anchor, a) > 0)) anchor = a;
    }
    if (!anchor) return '';                      /* before anything was recorded */
    var off = daysBetween(anchor, d);
    var day = ((off % m.cycle) + m.cycle) % m.cycle + 1;   /* 1-based day of cycle */
    var ov = m.cycle - m.luteal;                 /* ovulation day of this cycle */
    if (day <= m.bleed) return 'period';
    if (day === ov) return 'ovul';
    if (day >= ov - 5 && day <= ov + 1) return 'fertile';
    if (day < ov) return 'foll';
    return 'lut';
  }

  var KIND_LABEL = {
    logged: 'Period, as logged',
    period: 'Period, expected',
    foll: 'Follicular',
    fertile: 'Fertile window',
    ovul: 'Ovulation, estimated',
    lut: 'Luteal'
  };

  function periodTab(host) {
    var st = A.store.get('health.period', { logs: [], luteal: 14 });
    if (!Array.isArray(st.logs)) st.logs = [];
    if (!st.luteal) st.luteal = 14;
    function save() { A.store.set('health.period', st); }

    var today = new Date();
    var view = new Date(today.getFullYear(), today.getMonth(), 1);

    var out = A.el('div');
    host.appendChild(out);

    /* ── logging ── */
    function logStart(d) {
      var key = ymd(d);
      /* the same day twice is a mis-tap, not a second period */
      if (st.logs.some(function (l) { return l.start === key; })) { A.toast('Already logged'); return; }
      st.logs.push({ start: key, end: null });
      save(); A.haptic(); paint();
    }
    function logEnd(d) {
      var key = ymd(d), best = null;
      st.logs.forEach(function (l) {
        var a = fromYmd(l.start);
        if (a && daysBetween(a, d) >= 0 && daysBetween(a, d) <= 14) {
          if (!best || l.start > best.start) best = l;
        }
      });
      if (!best) { A.toast('Log the start first'); return; }
      best.end = key;
      save(); A.haptic(); paint();
    }
    function clearDay(d) {
      var before = st.logs.length;
      st.logs = st.logs.filter(function (l) {
        var a = fromYmd(l.start), b = fromYmd(l.end);
        if (!a) return false;
        if (b) return !(daysBetween(a, d) >= 0 && daysBetween(d, b) >= 0);
        return daysBetween(a, d) !== 0;
      });
      if (st.logs.length === before) { A.toast('Nothing logged on that day'); return; }
      save(); A.haptic(); paint();
    }

    function dayMenu(d) {
      var ov = A.el('.place-ov');
      var box = A.el('.tt-alert');
      box.appendChild(A.el('.tt-alert-t', { text: prettyDate(d) }));
      box.appendChild(A.el('.tt-alert-b', {
        text: 'A day you log always replaces what was predicted for it.'
      }));
      function opt(label, fn, cls) {
        box.appendChild(A.el('button.btn' + (cls || '.ghost') + '.block', {
          text: label, style: { marginTop: '8px' },
          onclick: function () { ov.remove(); fn(); }
        }));
      }
      opt('Period started this day', function () { logStart(d); }, '.btn-go');
      opt('Period ended this day', function () { logEnd(d); });
      opt('Clear this day', function () { clearDay(d); }, '.ghost.sem-del');
      opt('Close', function () {});
      ov.appendChild(box);
      document.body.appendChild(ov);
    }

    /* ── the month ── */
    function monthCard(m) {
      var c = A.UI.card();
      var nav = A.el('.cal-nav');
      nav.appendChild(A.el('button.btn.ghost.cal-chev', {
        text: '\u2039',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); A.haptic(); paint(); }
      }));
      nav.appendChild(A.el('.cal-title', { text: MONTHS_P[view.getMonth()] + ' ' + view.getFullYear() }));
      nav.appendChild(A.el('button.btn.ghost.cal-chev', {
        text: '\u203a',
        onclick: function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); A.haptic(); paint(); }
      }));
      c.appendChild(nav);

      var grid = A.el('.cal-grid');
      DOW_P.forEach(function (d) { grid.appendChild(A.el('.cal-dow', { text: d })); });

      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var lead = (first.getDay() + 6) % 7;               /* weeks start Monday */
      var start = addDays(first, -lead);
      for (var i = 0; i < 42; i++) {
        var d = addDays(start, i);
        var out2 = d.getMonth() !== view.getMonth();
        var kind = dayKind(d, m);
        /* A day the user actually typed in is worth telling apart from the
           four days of bleeding the app filled in around it: the entered ones
           are the evidence, everything else is inference. They get a ring. */
        var key = ymd(d);
        var entered = m.logs.some(function (l) { return l.start === key || l.end === key; });
        var cell = A.el('button.cal-cell.pcal' + (out2 ? '.cal-out' : '') +
          (daysBetween(d, today) === 0 ? '.pcal-today' : '') +
          (kind ? '.pk-' + kind : '') + (entered ? '.pk-mark' : ''),
          { text: String(d.getDate()) });
        (function (dd) {
          cell.addEventListener('click', function () { A.haptic(); dayMenu(dd); });
        })(d);
        grid.appendChild(cell);
      }
      c.appendChild(grid);

      var key = A.el('.pcal-key');
      [['logged', 'Logged'], ['period', 'Expected'], ['foll', 'Follicular'],
       ['fertile', 'Fertile'], ['ovul', 'Ovulation'], ['lut', 'Luteal']].forEach(function (k) {
        var it = A.el('.pcal-key-it');
        it.appendChild(A.el('i.pk-' + k[0]));
        it.appendChild(A.el('span', { text: k[1] }));
        key.appendChild(it);
      });
      c.appendChild(key);
      c.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '8px' },
        text: 'Tap any day to log a period starting or ending on it. A ring means you entered ' +
              'that date yourself; everything else is worked out from it.'
      }));
      return c;
    }

    function paint() {
      A.clear(out);
      var m = cycleModel(st);

      out.appendChild(A.UI.note(
        'This is a calendar, not contraception and not a pregnancy test. It predicts from your ' +
        'own logged dates and nothing else; it cannot see illness, travel, stress or anything ' +
        'that moves ovulation on the day.'));

      if (!m.last) {
        out.appendChild(A.UI.empty('Log the first day of a period to start. Predictions appear once there is one, and get better with each cycle you log.'));
        out.appendChild(monthCard(m));
        return;
      }

      /* ── where we are now ── */
      var off = daysBetween(m.last, today);
      var dayNo = off >= 0 ? (((off % m.cycle) + m.cycle) % m.cycle + 1) : NaN;
      var kindNow = dayKind(today, m);
      var nexts = futureStarts(m, 3);
      var nextStart = nexts[0];
      var toNext = daysBetween(today, nextStart);

      var head = A.UI.card();
      head.appendChild(A.el('.sec-lab', { text: 'Today' }));
      head.appendChild(A.UI.metric('Day of cycle', isFinite(dayNo) ? String(dayNo) : '-',
        { sub: KIND_LABEL[kindNow] || '' }));
      head.appendChild(A.UI.metric('Next period', prettyDate(nextStart),
        { sub: toNext === 0 ? 'today' : (toNext > 0 ? 'in ' + toNext + ' days' : Math.abs(toNext) + ' days late') }));
      var ovDate = addDays(nextStart, -m.luteal);
      head.appendChild(A.UI.metric('Ovulation, estimated', prettyDate(ovDate),
        { sub: 'fertile ' + prettyDate(addDays(ovDate, -5)) + ' to ' + prettyDate(addDays(ovDate, 1)) }));
      out.appendChild(head);

      if (toNext < -2) {
        out.appendChild(A.UI.note(
          'The predicted date has passed. Cycles run late for many ordinary reasons; if one is ' +
          'much later than usual and that matters to you, a test or a doctor answers it and a ' +
          'calendar cannot.'));
      }

      out.appendChild(monthCard(m));

      /* ── what it is working from ── */
      var stc = A.UI.card();
      stc.appendChild(A.el('.sec-lab', { text: 'What the prediction is built on' }));
      stc.appendChild(A.UI.metric('Cycle length', m.cycle + ' days',
        { sub: m.known ? ('median of your last ' + m.known + ' cycle' + (m.known > 1 ? 's' : '')) : 'assumed, nothing logged yet' }));
      stc.appendChild(A.UI.metric('Period length', m.bleed + ' days',
        { sub: 'from the starts and ends you logged' }));
      stc.appendChild(A.UI.metric('Luteal phase', m.luteal + ' days',
        { sub: 'ovulation is counted back from the next period' }));
      if (isFinite(m.spread)) {
        stc.appendChild(A.UI.metric('Spread', m.spread + ' days',
          { sub: m.spread <= 3 ? 'regular, the dates should hold well'
                : (m.spread <= 7 ? 'somewhat variable, treat dates as a window'
                                 : 'irregular, the dates are a rough guide only') }));
      }
      out.appendChild(stc);

      if (m.known < 2) {
        out.appendChild(A.UI.note(
          'With fewer than two complete cycles logged this is still using an assumed 28-day ' +
          'cycle. It stops guessing and starts measuring after the second logged start.'));
      } else if (isFinite(m.spread) && m.spread > 7) {
        out.appendChild(A.UI.note(
          'Your logged cycles vary by more than a week. A single predicted date cannot be honest ' +
          'about that, so read the next period as roughly ' +
          prettyDate(addDays(nextStart, -Math.round(m.spread / 2))) + ' to ' +
          prettyDate(addDays(nextStart, Math.round(m.spread / 2))) + '.'));
      }

      /* ── the phases of the coming cycle ── */
      var ph = A.UI.card();
      ph.appendChild(A.el('.sec-lab', { text: 'The cycle ahead' }));
      /* the cycle that BEGINS at the next period, so its ovulation is counted
         back from the period after that one. Counting it back from its own
         start date put ovulation before the cycle had begun and stretched the
         luteal phase to six weeks. */
      var cycEnd = addDays(nextStart, m.cycle - 1);
      var ovNext = addDays(nexts[1], -m.luteal);
      ph.appendChild(A.UI.metric('Period', prettyDate(nextStart) + ' to ' + prettyDate(addDays(nextStart, m.bleed - 1))));
      ph.appendChild(A.UI.metric('Follicular', prettyDate(nextStart) + ' to ' + prettyDate(addDays(ovNext, -1))));
      ph.appendChild(A.UI.metric('Fertile window', prettyDate(addDays(ovNext, -5)) + ' to ' + prettyDate(addDays(ovNext, 1))));
      ph.appendChild(A.UI.metric('Ovulation', prettyDate(ovNext)));
      ph.appendChild(A.UI.metric('Luteal', prettyDate(addDays(ovNext, 1)) + ' to ' + prettyDate(cycEnd)));
      out.appendChild(ph);
      out.appendChild(A.UI.note(
        'The follicular phase runs from the first day of bleeding to ovulation and is the part ' +
        'that stretches or shortens. The luteal phase runs from ovulation to the next period and ' +
        'stays close to fourteen days in most people, which is why the estimate is counted ' +
        'backwards from the next period rather than forwards from the last.'));

      /* ── the next three ── */
      var nx = A.UI.card();
      nx.appendChild(A.el('.sec-lab', { text: 'Next three periods' }));
      nexts.forEach(function (d, i) {
        nx.appendChild(A.UI.metric('Period ' + (i + 1), prettyDate(d) + ' ' + d.getFullYear(),
          { sub: 'in ' + daysBetween(today, d) + ' days' }));
      });
      out.appendChild(nx);

      /* ── luteal setting ── */
      out.appendChild(A.el('.sec-lab', { text: 'Luteal phase length', style: { marginTop: '14px' } }));
      out.appendChild(A.UI.chips(
        [{ id: '12', label: '12 days' }, { id: '13', label: '13 days' },
         { id: '14', label: '14 days' }, { id: '15', label: '15 days' }],
        String(m.luteal),
        function (id) { st.luteal = +id; save(); A.haptic(); paint(); }
      ));
      out.appendChild(A.UI.note(
        'Leave this at fourteen unless a clinician has told you otherwise, or unless tracking ' +
        'has shown you your own. It moves the ovulation estimate day for day.'));

      /* ── the log ── */
      out.appendChild(A.el('.sec-lab', { text: 'Logged periods', style: { marginTop: '14px' } }));
      if (!m.logs.length) {
        out.appendChild(A.UI.empty('Nothing logged yet.'));
      } else {
        var list = A.el('div');
        m.logs.slice().reverse().forEach(function (l, idx) {
          var a = fromYmd(l.start), b = fromYmd(l.end);
          var row = A.el('.metric');
          row.appendChild(A.el('span.metric-l', { text: prettyDate(a) + ' ' + a.getFullYear() }));
          row.appendChild(A.el('span.metric-sub', {
            style: { textAlign: 'left' },
            text: b ? (daysBetween(a, b) + 1) + ' days, to ' + prettyDate(b) : 'end not logged'
          }));
          var del = A.el('button.chip.sem-del', {
            text: 'Delete',
            onclick: function () {
              st.logs = st.logs.filter(function (x) { return x.start !== l.start; });
              save(); A.haptic(); paint();
            }
          });
          row.appendChild(del);
          list.appendChild(row);
        });
        out.appendChild(list);
      }

      var addRow = A.el('.split', { style: { marginTop: '10px' } });
      addRow.appendChild(A.el('button.btn.block.btn-go', {
        html: Icons.svg('plus') + ' Period started today',
        onclick: function () { logStart(today); }
      }));
      addRow.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('check') + ' Ended today',
        onclick: function () { logEnd(today); }
      }));
      out.appendChild(addRow);

      out.appendChild(A.UI.note(
        'Everything here stays on this phone. There is no account and nothing is sent anywhere.'));
    }

    paint();
    return function () {};
  }


  /* ══ BODY ════════════════════════════════════════════════════════════════

     The numbers a body runs on, and what it means when they move.

     THESE ARE BANDS, NOT VERDICTS. Every one of them shifts with age, fitness,
     altitude, what the person has just been doing and what they take daily, and
     a casualty who looks wrong with textbook numbers is still a casualty. The
     figures are here so you can SAY something useful down a radio - "pulse 130,
     cold to touch, shivering stopped" - not so an app can decide what is wrong
     with somebody.

     Temperatures are core temperatures unless it says otherwise. A forehead or
     an armpit reads low and a moving casualty reads high, so treat any reading
     taken in the field as a rough one. */

  /* Both scales, because half the world thinks in one and half in the other and
     a casualty report crosses that line all the time. FOUR significant figures,
     not three: at three, 38.0 °C came out as "100 °F" instead of 100.4, and a
     rounded fever threshold is a wrong fever threshold. */
  function fahr(c) { return A.fmtNum(c * 9 / 5 + 32, 4); }
  function tempC(c) {
    return A.fmtNum(c, 4) + ' °C   ·   ' + fahr(c) + ' °F';
  }
  /* a range reads once per scale, not twice per number */
  function tempRange(a, b) {
    return A.fmtNum(a, 4) + ' to ' + A.fmtNum(b, 4) + ' °C   ·   ' +
           fahr(a) + ' to ' + fahr(b) + ' °F';
  }

  function bodyTab(host) {
    host.appendChild(A.UI.note(
      'Reference bands, not a diagnosis. They move with age, fitness, altitude, effort and ' +
      'medication. Treat the person in front of you, not the number, and get them to a ' +
      'clinician when something is wrong.'));

    function card(title, rows, note) {
      var c = A.UI.card();
      c.appendChild(A.el('.sec-lab', { text: title }));
      rows.forEach(function (r) {
        c.appendChild(A.UI.metric(r[0], r[1], r[2] ? { sub: r[2] } : null));
      });
      if (note) c.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '8px' }, text: note
      }));
      host.appendChild(c);
    }

    /* ── core temperature ── */
    card('Core temperature', [
      ['Normal', tempC(37), 'roughly 36.1 to 37.2, and it swings through the day'],
      ['Lowest, early morning', tempC(36.4), 'the daily trough, around 04h00'],
      ['Highest, late afternoon', tempC(37.4), 'the daily peak, around 18h00'],
      ['Raised', tempC(37.5), 'above normal but not yet called a fever'],
      ['Fever', tempC(38), 'the usual clinical threshold'],
      ['High fever', tempC(39.4), 'get medical help'],
      ['Hyperpyrexia', tempC(41), 'a medical emergency at any age']
    ], 'A single reading means little. What it did over the last few hours means more, and what ' +
       'the person looks like means most.');

    /* ── hypothermia ── */
    card('Hypothermia, by core temperature', [
      ['Mild', tempRange(35, 32),
       'shivering hard, clumsy hands, slurred speech, poor judgement'],
      ['Moderate', tempRange(32, 28),
       'shivering STOPS, confusion, drowsiness, slow pulse and breathing'],
      ['Severe', 'below ' + tempC(28),
       'unconscious, pulse hard to find, breathing barely visible'],
      ['Cardiac risk', 'below ' + tempC(30), 'the heart becomes easy to stop with rough handling']
    ], 'Shivering stopping is not improvement. It is the body giving up on rewarming itself and ' +
       'it marks the step from mild to serious.');

    host.appendChild(A.UI.note(
      'Handle a cold casualty gently and horizontally. A heart at 28 degrees will fibrillate ' +
      'from being sat up or dragged. Get them out of the wind, cut wet clothing off rather than ' +
      'pulling it, insulate underneath as well as over, and warm the trunk before the limbs: ' +
      'warming cold arms and legs first pushes cold blood back into the core and drops the ' +
      'temperature further. Nobody is dead until they are warm and dead.'));

    /* ── heat ── */
    card('Heat illness', [
      ['Heat cramps', 'normal temperature', 'cramping in the muscles worked hardest, salt and water lost'],
      ['Heat exhaustion', 'up to ' + tempC(40),
       'heavy sweating, weak fast pulse, headache, nausea, mind still clear'],
      ['Heat stroke', 'above ' + tempC(40),
       'CONFUSED OR UNCONSCIOUS, skin may be hot and dry or still sweating']
    ], 'The line between exhaustion and stroke is the state of mind, not the sweating. Any ' +
       'confusion, aggression or collapse in the heat is heat stroke until proved otherwise.');

    host.appendChild(A.UI.note(
      'Heat stroke kills by the minute and cooling comes before transport. Get them out of the ' +
      'sun, strip them, and wet the whole skin with cool water and keep the air moving over it; ' +
      'ice packs to the neck, armpits and groin help but do not replace the water and the ' +
      'draught. Do not give fluids by mouth to anyone who is not fully awake.'));

    host.appendChild(A.UI.note(
      'Sunstroke, insolation, is heat stroke from working under direct sun rather than from heat ' +
      'alone: the head and neck take the radiant load and the body loses the argument even in ' +
      'air that is not especially hot. Cover the head and the back of the neck, and take the ' +
      'shade before you feel you need it.'));

    /* ── pulse ── */
    card('Resting pulse', [
      ['Adult, 10 and over', '60 to 100 per minute'],
      ['Trained athlete', '40 to 60 per minute', 'fitness, not illness'],
      ['Child 1 to 9', '70 to 110 per minute', 'the younger the faster'],
      ['Infant under 1', '80 to 160 per minute'],
      ['Too slow', 'below 60 in an adult', 'bradycardia, if it is not fitness'],
      ['Too fast', 'above 100 at rest', 'tachycardia, and often just effort or fear']
    ], 'Count it on the Pulse tab rather than in your head. What a pulse feels like matters as ' +
       'much as its rate: thin and fast is a different casualty from strong and slow.');

    /* ── breathing and pressure ── */
    card('Breathing and blood pressure', [
      ['Adult breathing', '12 to 20 per minute'],
      ['Child breathing', '20 to 30 per minute'],
      ['Infant breathing', '30 to 60 per minute'],
      ['Typical blood pressure', 'about 120 over 80 mmHg'],
      ['Low', 'below 90 over 60 mmHg', 'with symptoms, this is shock territory'],
      ['Oxygen saturation', '95 to 100 per cent at sea level', 'lower is normal at altitude']
    ], 'Count breathing without telling them you are doing it. Anyone who knows they are being ' +
       'counted breathes differently.');

    /* ── water ── */
    card('Water and dehydration', [
      ['Without water, temperate', 'about 3 days', 'a rule of thumb, not a promise'],
      ['Without water, desert heat', 'a day or less', 'sweat rate decides it, not willpower'],
      ['Daily need, at rest', 'roughly 2 to 3 litres'],
      ['Daily need, working in heat', '4 to 10 litres', 'and salt with it, or the water does not stay'],
      ['Sweat rate, hard work in heat', 'up to 1 to 1.5 litres an hour'],
      ['Without food', 'weeks', 'food is a much later problem than water']
    ], 'Rationing water in heat is the classic mistake: the water does you no good in the bottle. ' +
       'Ration the SWEAT instead by moving at night, resting in shade and slowing down.');

    card('Reading dehydration', [
      ['Early, 1 to 2 per cent', 'thirst, darker urine, output falling'],
      ['Moderate, 3 to 5 per cent', 'dry mouth, headache, tired, little urine and dark'],
      ['Serious, 6 to 9 per cent', 'dizzy on standing, fast weak pulse, cool skin, barely passing water'],
      ['Severe, 10 per cent and over', 'confusion, collapse, no urine, a medical emergency']
    ], 'Urine is the honest gauge in the field: pale and plenty is fine, dark and little is not. ' +
       'Thirst lags behind the loss, so a person who is only just thirsty is already short.');

    /* ── altitude, since the app is used at height ── */
    card('Altitude', [
      ['Little effect', 'below 1500 m'],
      ['Acclimatisation begins', '1500 to 2500 m'],
      ['Altitude sickness likely', 'above 2500 m', 'headache, nausea, poor sleep, breathless'],
      ['Ascent rule above 3000 m', '300 to 500 m a day of sleeping height', 'and a rest day every 3 to 4 days'],
      ['The only real treatment', 'go down', 'oxygen and drugs buy time, descent fixes it']
    ], 'Confusion, stumbling as if drunk, or breathlessness at rest are the dangerous forms. ' +
       'They are not something to sleep on: go down, at night if necessary.');

    host.appendChild(A.UI.note(
      'Where this comes from: these are the ranges taught in first aid and wilderness medicine ' +
      'and used in clinical practice. Nothing here is specific to any one person, and nothing ' +
      'here replaces a clinician who can examine them.'));

    return function () {};
  }

  /* ══ page ════════════════════════════════════════════════════════════════ */

  var TABS = [
    { id: 'body', label: 'Body' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'cpr', label: 'CPR' },
    { id: 'period', label: 'Period' }
  ];

  function render(host) {
    var tab = A.store.get('health.tab', 'pulse');
    if (!TABS.some(function (t) { return t.id === tab; })) tab = 'pulse';
    host.appendChild(A.UI.chips(TABS, tab, function (id) {
      A.store.set('health.tab', id); A.Router.refresh();
    }));
    var body = A.el('div');
    host.appendChild(body);
    /* both tabs own an interval, so both hand a teardown back to the router */
    if (tab === 'cpr') return cprTab(body);
    if (tab === 'period') return periodTab(body);
    if (tab === 'body') return bodyTab(body);
    return pulseTab(body);
  }

  global.ArtHealth = { render: render };

})(window);
