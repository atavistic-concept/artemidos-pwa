/*
 * Artemidos - Time: stopwatch, countdown timer and alarms
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Three separate needs that share a screen:
 *   STOPWATCH  elapsed time with laps, for timing something that has started.
 *   TIMER      a countdown, for something that must happen in N minutes.
 *   ALARM      a wall-clock time, once or repeating, for something that must
 *              happen at a moment.
 *
 * HONEST LIMIT, stated in the app as well as here: these run inside the app.
 * Android suspends a backgrounded web view's timers, so an alarm fires reliably
 * only while Artemidos is open and awake. A missed alarm is worse than no alarm,
 * so the screen says so plainly rather than implying a guarantee it cannot
 * keep. On waking, the app checks whether anything was due while it slept and
 * tells you, late, rather than silently swallowing it.
 */
(function (global) {
  'use strict';

  /* ══ shared alert ═══════════════════════════════════════════════════════ */

  function beep(times) {
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return;
    try {
      var ctx = new Ctx();
      var t = ctx.currentTime;
      for (var i = 0; i < (times || 3); i++) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = i % 2 ? 1320 : 880;
        o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        o.start(t); o.stop(t + 0.34);
        t += 0.45;
      }
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, (times || 3) * 500 + 400);
    } catch (e) { /* silence is survivable */ }
  }
  /* An alarm has NO user gesture behind it, and Android's WebView silently
     ignores navigator.vibrate() when there has not been one - which is why
     the timer and the alarm buzzed in a browser and did nothing on the phone.
     The native Haptics plugin has no such rule, so it is tried first and the
     web API is kept only as a fallback for the browser build. */
  function buzz(pattern) {
    var pat = pattern || [400, 200, 400, 200, 600];
    var H = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Haptics;
    if (H && H.vibrate) {
      /* the plugin takes one duration, so the pattern is played as a sequence
         of buzzes with the gaps scheduled between them */
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
  /* how an alert is delivered, per the user's choice */
  function fire(how, title, body) {
    if (how === 'sound' || how === 'both') beep(4);
    if (how === 'vibrate' || how === 'both') buzz();
    popup(title, body);
  }
  /* the same alert WITHOUT the dialog. A round timer interrupts you on
     purpose, but it interrupts you with a sound, not with a box you have to
     dismiss before the next round can be seen. */
  function chime(how, tone) {
    /* one beep or two. A single beep is quicker to read and easier to live
       with over a long session; two carry further through noise. */
    var single = tone === 'single';
    if (how === 'sound' || how === 'both') beep(single ? 1 : 2);
    if (how === 'vibrate' || how === 'both') buzz(single ? [300] : [300, 150, 300]);
  }

  function popup(title, body) {
    var ov = A.el('.place-ov');
    var box = A.el('.tt-alert');
    box.appendChild(A.el('.tt-alert-t', { text: title }));
    if (body) box.appendChild(A.el('.tt-alert-b', { text: body }));
    box.appendChild(A.el('button.btn.block', {
      text: 'Dismiss', style: { marginTop: '14px' },
      onclick: function () { ov.remove(); try { navigator.vibrate && navigator.vibrate(0); } catch (e) {} }
    }));
    ov.appendChild(box);
    document.body.appendChild(ov);
    A.haptic(40);
  }

  function two(n) { return (n < 10 ? '0' : '') + n; }
  function hms(ms, withCs) {
    if (ms < 0) ms = 0;
    var t = Math.floor(ms / 1000);
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    var base = (h ? h + ':' : '') + two(m) + ':' + two(s);
    if (!withCs) return base;
    return base + '.' + two(Math.floor((ms % 1000) / 10));
  }

  /* ══ stopwatch ══════════════════════════════════════════════════════════ */

  var sw = { running: false, start: 0, acc: 0, laps: [] };

  function stopwatchTab(host) {
    var read = A.el('.tt-read');
    var lapHost = A.el('div');

    function elapsed() { return sw.acc + (sw.running ? Date.now() - sw.start : 0); }
    function paint() { read.textContent = hms(elapsed(), true); }

    var row = A.el('.split', { style: { marginTop: '10px' } });
    var goBtn = A.el('button.btn.block');
    var lapBtn = A.el('button.btn.ghost.block');

    function setBtns() {
      goBtn.innerHTML = Icons.svg(sw.running ? 'stop' : 'play') + (sw.running ? ' Stop' : (sw.acc ? ' Resume' : ' Start'));
      lapBtn.innerHTML = Icons.svg(sw.running ? 'plus' : 'refresh') + (sw.running ? ' Lap' : ' Reset');
    }
    goBtn.addEventListener('click', function () {
      if (sw.running) { sw.acc = elapsed(); sw.running = false; }
      else { sw.start = Date.now(); sw.running = true; }
      A.haptic(); setBtns(); paint();
    });
    lapBtn.addEventListener('click', function () {
      if (sw.running) {
        var e = elapsed();
        var prev = sw.laps.length ? sw.laps[sw.laps.length - 1].at : 0;
        sw.laps.push({ at: e, split: e - prev });
        A.haptic(); paintLaps();
      } else {
        sw.acc = 0; sw.laps = []; paint(); paintLaps(); A.haptic();
      }
      setBtns();
    });

    function paintLaps() {
      A.clear(lapHost);
      if (!sw.laps.length) return;
      lapHost.appendChild(A.UI.section('Laps'));
      var card = A.UI.card(null, 'tight');
      sw.laps.slice().reverse().forEach(function (l, i) {
        var n = sw.laps.length - i;
        card.appendChild(A.UI.metric('Lap ' + n, hms(l.split, true), { sub: 'at ' + hms(l.at, true) }));
      });
      lapHost.appendChild(card);
      lapHost.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('copy') + ' Copy laps', style: { marginTop: '8px' },
        onclick: function () {
          var txt = sw.laps.map(function (l, i) { return 'Lap ' + (i + 1) + '  ' + hms(l.split, true) + '  (at ' + hms(l.at, true) + ')'; }).join('\n');
          try { navigator.clipboard.writeText(txt); A.toast('Laps copied'); } catch (e) { A.toast('Copy not available'); }
        }
      }));
    }

    row.appendChild(goBtn); row.appendChild(lapBtn);
    host.appendChild(read);
    host.appendChild(row);
    host.appendChild(lapHost);
    setBtns(); paint(); paintLaps();

    var t = setInterval(function () {
      if (!document.body.contains(read)) { clearInterval(t); return; }
      if (sw.running) paint();
    }, 53);
  }

  /* ══ countdown timer ════════════════════════════════════════════════════ */

  var tm = { running: false, endAt: 0, left: 0, total: 0 };

  /* ══ round timer ═══════════════════════════════════════════════════════
     A timer that does not finish. It marks a period, sounds, and starts the
     same period again - a work interval, a watch rotation, a radio check, a
     round of anything. The state lives at module level and runs on its own
     interval so the rounds keep coming after you have navigated away, which
     is the only way a round timer is any use. */
  var rd = { running: false, endAt: 0, len: 0, done: 0, limit: 0, how: 'both', tone: 'double' };
  var rdTick = null;
  function rdMs(st) {
    var n = parseFloat(String(st.n).replace(',', '.'));
    if (!isFinite(n) || n <= 0) return 0;
    var mul = st.unit === 'h' ? 3600000 : (st.unit === 'm' ? 60000 : 1000);
    return Math.round(n * mul);
  }
  function rdStop() {
    rd.running = false;
    if (rdTick) { clearInterval(rdTick); rdTick = null; }
  }
  function rdStart() {
    if (rdTick) clearInterval(rdTick);
    rdTick = setInterval(function () {
      if (!rd.running) return;
      var now = Date.now();
      if (now < rd.endAt) return;
      /* if the app was asleep through several rounds, count them all rather
         than pretending only one went by */
      var missed = 0;
      while (rd.endAt <= now && missed < 1000) { rd.endAt += rd.len; missed++; }
      rd.done += missed;
      chime(rd.how, rd.tone);
      if (rd.limit > 0 && rd.done >= rd.limit) {
        rd.done = rd.limit;
        rdStop();
        popup('Rounds finished', rd.limit + ' rounds done');
      }
    }, 250);
  }

  function roundTab(host) {
    var st = A.store.get('time.round', { n: '3', unit: 'm', how: 'both', limit: '', tone: 'double' });
    if (!st.tone) st.tone = 'double';
    function save() { A.store.set('time.round', st); }

    var read = A.el('.tt-read');
    var bar = A.el('.tt-bar'); var barIn = A.el('.tt-bar-in'); bar.appendChild(barIn);
    var count = A.el('.lrow-s', { style: { textAlign: 'center', marginTop: '2px' } });

    function paint() {
      var l = rd.running ? Math.max(0, rd.endAt - Date.now()) : rdMs(st);
      read.textContent = hms(l, false);
      barIn.style.width = (rd.running && rd.len) ? Math.round(100 * (1 - l / rd.len)) + '%' : '0%';
      count.textContent = rd.done + (rd.limit > 0 ? ' of ' + rd.limit : '') +
        (rd.done === 1 ? ' round done' : ' rounds done');
    }

    host.appendChild(read);
    host.appendChild(bar);
    host.appendChild(count);

    var lenRow = A.el('.split');
    lenRow.appendChild(A.UI.field({
      label: 'Every', inputmode: 'decimal', value: st.n, placeholder: '3',
      oninput: function (e) { st.n = e.target.value; save(); if (!rd.running) paint(); }
    }));
    host.appendChild(lenRow);
    host.appendChild(A.UI.chips(
      [{ id: 's', label: 'Seconds' }, { id: 'm', label: 'Minutes' }, { id: 'h', label: 'Hours' }],
      st.unit,
      function (id) { st.unit = id; save(); A.haptic(); A.Router.refresh(); }
    ));

    host.appendChild(A.UI.field({
      label: 'Stop after this many rounds', inputmode: 'numeric', value: st.limit,
      placeholder: 'leave empty to keep going',
      hint: 'Left empty it runs until you stop it.',
      oninput: function (e) { st.limit = e.target.value; save(); }
    }));

    host.appendChild(A.UI.select({
      label: 'At every round', value: st.how,
      options: [['both', 'Sound and vibrate'], ['sound', 'Sound only'], ['vibrate', 'Vibrate only']]
        .map(function (o) { return { value: o[0], label: o[1] }; }),
      onchange: function (e) { st.how = e.target.value; rd.how = st.how; save(); }
    }));

    host.appendChild(A.UI.select({
      label: 'Beep sound', value: st.tone,
      options: [['double', 'Two beeps'], ['single', 'One beep']]
        .map(function (o) { return { value: o[0], label: o[1] }; }),
      onchange: function (e) {
        st.tone = e.target.value; rd.tone = st.tone; save();
        /* play it once so the choice is made with the ear, not the label */
        chime(st.how === 'vibrate' ? 'vibrate' : 'sound', st.tone);
      }
    }));

    var goBtn = A.el('button.btn.block');
    function setBtn() {
      goBtn.innerHTML = Icons.svg(rd.running ? 'stop' : 'play') + (rd.running ? ' Stop' : ' Start');
      goBtn.classList.toggle('btn-kill', !!rd.running);
      goBtn.classList.toggle('btn-go', !rd.running);
    }
    goBtn.addEventListener('click', function () {
      if (rd.running) { rdStop(); A.haptic(); setBtn(); paint(); return; }
      var ms = rdMs(st);
      if (!(ms > 0)) { A.toast('Set a round length first'); return; }
      var lim = parseInt(st.limit, 10);
      rd.len = ms;
      rd.limit = (isFinite(lim) && lim > 0) ? lim : 0;
      rd.how = st.how;
      rd.tone = st.tone;
      rd.done = 0;
      rd.endAt = Date.now() + ms;
      rd.running = true;
      rdStart();
      A.haptic(); setBtn(); paint();
    });

    var resetBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('refresh') + ' Reset',
      onclick: function () { rdStop(); rd.done = 0; rd.len = 0; setBtn(); paint(); A.haptic(); }
    });

    var row = A.el('.split', { style: { marginTop: '10px' } });
    row.appendChild(goBtn); row.appendChild(resetBtn);
    host.appendChild(row);

    host.appendChild(A.UI.note(
      'The rounds keep coming while you use the rest of the app. They stop when you press ' +
      'Stop, when the count is reached, or when the app is closed.'));

    presetBlock(host, 'round',
      function () {
        var u = st.unit === 'h' ? 'hours' : (st.unit === 'm' ? 'minutes' : 'seconds');
        return {
          sub: 'every ' + (st.n || '?') + ' ' + u +
               (parseInt(st.limit, 10) > 0 ? '   ·   ' + parseInt(st.limit, 10) + ' rounds' : '   ·   no limit'),
          n: st.n, unit: st.unit, how: st.how, limit: st.limit, tone: st.tone
        };
      },
      function (p) {
        st.n = p.n; st.unit = p.unit; st.how = p.how; st.limit = p.limit;
        st.tone = p.tone || 'double';
        save();
      });

    setBtn(); paint();

    var t = setInterval(function () {
      if (!document.body.contains(read)) { clearInterval(t); return; }
      setBtn(); paint();
    }, 250);
    return function () { clearInterval(t); };
  }

  /* ══ saved sets ══════════════════════════════════════════════════════════
     A timer worth setting once is worth setting once. Both boards keep their
     own named list; loading one only fills the FIELDS, it never starts
     anything, because a saved set arriving already running is how you lose
     track of what the phone is doing. */
  function presets(key) { return A.store.get('time.' + key + 'Presets', []); }
  function setPresets(key, v) { A.store.set('time.' + key + 'Presets', v); }

  function askName(current, then) {
    var ov = A.el('.place-ov');
    var box = A.el('.tt-alert');
    box.appendChild(A.el('.tt-alert-t', { text: 'Name this set' }));
    var f = A.UI.field({ label: 'Name', value: current || '', placeholder: 'Brew, watch rotation, intervals' });
    box.appendChild(f);
    var row = A.el('.split', { style: { marginTop: '12px' } });
    row.appendChild(A.el('button.btn.block.btn-go', {
      text: 'Save',
      onclick: function () {
        var v = String(f.input.value || '').trim().slice(0, 40);
        if (!v) { A.toast('Give it a name'); return; }
        ov.remove(); then(v);
      }
    }));
    row.appendChild(A.el('button.btn.ghost.block', {
      text: 'Cancel', onclick: function () { ov.remove(); }
    }));
    box.appendChild(row);
    ov.appendChild(box);
    document.body.appendChild(ov);
    setTimeout(function () { try { f.input.focus(); } catch (e) {} }, 50);
  }

  /* the saved list, drawn the same way on both boards */
  function presetBlock(host, key, grab, apply) {
    host.appendChild(A.el('.sec-lab', { text: 'Saved sets', style: { marginTop: '16px' } }));
    var list = A.el('div');
    host.appendChild(list);

    function paintList() {
      A.clear(list);
      var all = presets(key);
      if (!all.length) {
        list.appendChild(A.UI.empty('Nothing saved yet. Set it up, then press Save this set.'));
        return;
      }
      all.forEach(function (p) {
        var row = A.el('.metric');
        row.appendChild(A.el('span.metric-l', { text: p.name }));
        row.appendChild(A.el('span.metric-sub', { text: p.sub || '', style: { textAlign: 'left' } }));
        var pair = A.el('.trk-pair');
        pair.appendChild(A.el('button.btn.ghost.block', {
          text: 'Load',
          onclick: function () { apply(p); A.toast('Loaded ' + p.name); A.haptic(); A.Router.refresh(); }
        }));
        pair.appendChild(A.el('button.btn.ghost.block.sem-del', {
          text: 'Delete',
          onclick: function () {
            setPresets(key, presets(key).filter(function (x) { return x.id !== p.id; }));
            A.haptic(); paintList();
          }
        }));
        var wrap = A.el('div', { style: { marginBottom: '10px' } });
        wrap.appendChild(row);
        wrap.appendChild(pair);
        list.appendChild(wrap);
      });
    }

    host.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('plus') + ' Save this set',
      style: { marginTop: '8px' },
      onclick: function () {
        askName('', function (name) {
          var p = grab();
          p.id = 'p' + Date.now();
          p.name = name;
          var all = presets(key);
          all.push(p);
          setPresets(key, all);
          A.haptic(); paintList();
        });
      }
    }));
    paintList();
  }

  /* ══ timer marks ═════════════════════════════════════════════════════════
     Up to three beeps part way through, each set as HOW MUCH TIME IS LEFT
     rather than how much has gone. That is the way a countdown is actually
     read out loud - "two minutes left", "thirty seconds" - and it keeps its
     meaning when the total is changed. */
  var MARK_MAX = 3;
  function markSeconds(v) {
    v = String(v || '').trim();
    if (!v) return NaN;
    var m = /^(\d{1,3})[:h.](\d{1,2})$/.exec(v);
    if (m) return (+m[1]) * 60 + (+m[2]);
    var n = parseFloat(v.replace(',', '.'));
    return isFinite(n) && n > 0 ? Math.round(n) : NaN;
  }
  function markLabel(sec) {
    if (!isFinite(sec)) return '';
    var mm = Math.floor(sec / 60), ss = sec % 60;
    return mm ? (mm + 'm ' + (ss ? ss + 's' : '')) : (ss + 's');
  }

  function timerTab(host) {
    var st = A.store.get('time.timer', { h: '0', m: '5', s: '0', how: 'both', marks: [] });
    if (!Array.isArray(st.marks)) st.marks = [];
    function save() { A.store.set('time.timer', st); }
    /* which marks have already sounded this run, so a mark fires once and not
       four times a second while the countdown sits on it */
    var fired = {};

    var read = A.el('.tt-read');
    var bar = A.el('.tt-bar'); var barIn = A.el('.tt-bar-in'); bar.appendChild(barIn);

    function left() { return tm.running ? Math.max(0, tm.endAt - Date.now()) : tm.left; }
    function paint() {
      var l = left();
      read.textContent = hms(l, false);
      barIn.style.width = tm.total ? Math.round(100 * (1 - l / tm.total)) + '%' : '0%';
    }

    var fields = A.el('.split');
    ['h', 'm', 's'].forEach(function (k) {
      fields.appendChild(A.UI.field({
        label: k === 'h' ? 'Hours' : (k === 'm' ? 'Minutes' : 'Seconds'),
        inputmode: 'numeric', value: st[k],
        oninput: function (e) { st[k] = e.target.value; save(); }
      }));
    });

    var goBtn = A.el('button.btn.block');
    function setBtn() { goBtn.innerHTML = Icons.svg(tm.running ? 'stop' : 'play') + (tm.running ? ' Stop' : ' Start'); }
    goBtn.addEventListener('click', function () {
      if (tm.running) { tm.left = left(); tm.running = false; setBtn(); return; }
      var ms = ((+st.h || 0) * 3600 + (+st.m || 0) * 60 + (+st.s || 0)) * 1000;
      if (tm.left > 0 && ms === tm.total) ms = tm.left;      /* resume */
      if (!(ms > 0)) { A.toast('Set a time first'); return; }
      tm.total = Math.max(tm.total, ms);
      tm.endAt = Date.now() + ms;
      tm.running = true;
      fired = {};
      A.haptic(); setBtn(); paint();
    });

    var resetBtn = A.el('button.btn.ghost.block', {
      html: Icons.svg('refresh') + ' Reset',
      onclick: function () { tm.running = false; tm.left = 0; tm.total = 0; fired = {}; setBtn(); paint(); }
    });

    host.appendChild(read);
    host.appendChild(bar);
    host.appendChild(fields);
    host.appendChild(A.UI.select({
      label: 'When it finishes', value: st.how,
      options: [['both', 'Sound and vibrate'], ['sound', 'Sound only'], ['vibrate', 'Vibrate only'], ['popup', 'Screen only']]
        .map(function (o) { return { value: o[0], label: o[1] }; }),
      onchange: function (e) { st.how = e.target.value; save(); }
    }));
    var row = A.el('.split', { style: { marginTop: '10px' } });
    row.appendChild(goBtn); row.appendChild(resetBtn);
    host.appendChild(row);

    /* KEEP IT IN SIGHT.
       A running timer is usually started so you can go and do something else
       in the app, and until now going anywhere else meant losing sight of it.
       Switched on, a small readout follows you into every page, exactly as
       the mini compass does. It shows itself only while a timer is actually
       running, so leaving the switch on costs nothing on the days you do not
       use one. */
    var prow = A.el('.nav-auto', { style: { marginTop: '12px' } });
    prow.appendChild(A.el('span', { text: 'Keep the timer on screen, on every page' }));
    var pon = A.store.get('time.pip', false);
    var pbtn = A.el('button.nav-toggle' + (pon ? '.on' : ''), {
      text: pon ? 'On' : 'Off',
      onclick: function () {
        var v = !A.store.get('time.pip', false);
        A.store.set('time.pip', v);
        pbtn.classList.toggle('on', v);
        pbtn.textContent = v ? 'On' : 'Off';
        A.haptic();
        syncPip();
      }
    });
    prow.appendChild(pbtn);
    host.appendChild(prow);

    /* ── beeps part way through ── */
    host.appendChild(A.el('.sec-lab', { text: 'Beep before the end', style: { marginTop: '16px' } }));
    host.appendChild(A.UI.note(
      'Up to three warnings, each set as the time LEFT on the clock. Write them as minutes and ' +
      'seconds (2:30) or as plain seconds (30). They follow the same sound and vibrate choice as ' +
      'the finish.'));
    var marksHost = A.el('div');
    host.appendChild(marksHost);

    function paintMarks() {
      A.clear(marksHost);
      st.marks.forEach(function (mk, i) {
        var c = A.UI.card(null, 'tight');
        c.appendChild(A.el('.sec-lab', { text: 'Warning ' + (i + 1) }));
        c.appendChild(A.UI.field({
          label: 'When this much is left', inputmode: 'numeric', value: mk.at,
          placeholder: '2:30 or 30',
          hint: isFinite(markSeconds(mk.at)) ? ('Sounds at ' + markLabel(markSeconds(mk.at)) + ' left.')
                                             : 'Not set. Write 2:30 or 30.',
          oninput: function (e) { mk.at = e.target.value; save(); }
        }));
        c.appendChild(A.UI.select({
          label: 'Sound', value: mk.tone || 'single',
          options: [['single', 'One beep'], ['double', 'Two beeps']]
            .map(function (o) { return { value: o[0], label: o[1] }; }),
          onchange: function (e) {
            mk.tone = e.target.value; save();
            beep(mk.tone === 'double' ? 2 : 1);
          }
        }));
        c.appendChild(A.el('button.btn.ghost.block.sem-del', {
          html: Icons.svg('trash') + ' Remove this warning',
          style: { marginTop: '8px' },
          onclick: function () { st.marks.splice(i, 1); save(); A.haptic(); paintMarks(); }
        }));
        marksHost.appendChild(c);
      });
      if (st.marks.length < MARK_MAX) {
        marksHost.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('plus') + ' Add a warning beep',
          style: { marginTop: '8px' },
          onclick: function () {
            st.marks.push({ at: '', tone: 'single' });
            save(); A.haptic(); paintMarks();
          }
        }));
      } else {
        marksHost.appendChild(A.UI.note('Three is the limit. More than that and they stop being warnings.'));
      }
    }
    paintMarks();

    presetBlock(host, 'timer',
      function () {
        var sub = (+st.h || 0) + 'h ' + (+st.m || 0) + 'm ' + (+st.s || 0) + 's' +
          (st.marks.length ? '   ·   ' + st.marks.length + ' warning' + (st.marks.length > 1 ? 's' : '') : '');
        return {
          sub: sub, h: st.h, m: st.m, s: st.s, how: st.how,
          marks: st.marks.map(function (x) { return { at: x.at, tone: x.tone }; })
        };
      },
      function (p) {
        st.h = p.h; st.m = p.m; st.s = p.s; st.how = p.how;
        st.marks = Array.isArray(p.marks) ? p.marks.map(function (x) { return { at: x.at, tone: x.tone }; }) : [];
        save();
      });

    setBtn(); paint();

    var t = setInterval(function () {
      if (!document.body.contains(read)) { clearInterval(t); return; }
      if (!tm.running) return;
      paint();
      /* the marks: sound when the countdown has passed the set point. Passed,
         not equalled - the tick is not sample-accurate and an equality test
         would silently miss on a busy phone. */
      var lft = left();
      st.marks.forEach(function (mk, i) {
        var sec = markSeconds(mk.at);
        if (!isFinite(sec) || fired[i]) return;
        if (lft <= sec * 1000) {
          fired[i] = true;
          if (st.how === 'sound' || st.how === 'both') beep(mk.tone === 'double' ? 2 : 1);
          if (st.how === 'vibrate' || st.how === 'both') buzz(mk.tone === 'double' ? [250, 120, 250] : [250]);
        }
      });
      if (left() <= 0) {
        tm.running = false; tm.left = 0; setBtn();
        fire(st.how, 'Timer finished', hms(tm.total, false) + ' elapsed.');
      }
    }, 200);
  }

  /* ══ alarms ═════════════════════════════════════════════════════════════ */

  function alarms() { return A.store.get('time.alarms', []); }
  function setAlarms(a) { A.store.set('time.alarms', a); }

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function jsDay(d) { return (d.getDay() + 6) % 7; }   /* 0 = Monday */

  /* the next moment this alarm should fire, or null if never again */
  function nextFire(al, from) {
    var now = from || new Date();
    var hh = +al.h, mm = +al.m;
    if (al.repeat === 'once') {
      var d = new Date(al.date + 'T' + two(hh) + ':' + two(mm) + ':00');
      return isNaN(d.getTime()) ? null : d;
    }
    for (var i = 0; i < 8; i++) {
      var c = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hh, mm, 0, 0);
      if (c <= now) continue;
      if (al.repeat === 'daily') return c;
      if (al.repeat === 'weekdays' && jsDay(c) < 5) return c;
      if (al.repeat === 'days' && al.days && al.days[jsDay(c)]) return c;
    }
    return null;
  }

  function alarmsTab(host) {
    var listHost = A.el('div');

    function paint() {
      A.clear(listHost);
      var all = alarms();
      if (!all.length) { listHost.appendChild(A.UI.empty('No alarms set.')); return; }
      listHost.appendChild(A.UI.section(all.length + (all.length === 1 ? ' alarm' : ' alarms')));
      all.forEach(function (al, i) {
        var card = A.UI.card(null, 'tight');
        var top = A.el('.tt-al-top');
        top.appendChild(A.el('span.tt-al-time', { text: two(al.h) + 'h' + two(al.m) }));
        top.appendChild(A.el('span.tt-al-when', { text: describe(al) }));
        top.appendChild(A.el('button.wp-ib' + (al.on ? '.on' : ''), {
          html: Icons.svg('check'),
          onclick: function () { var l = alarms(); l[i].on = !l[i].on; setAlarms(l); paint(); }
        }));
        top.appendChild(A.el('button.wp-ib.danger', {
          html: Icons.svg('trash'),
          onclick: function () { var l = alarms(); l.splice(i, 1); setAlarms(l); paint(); }
        }));
        card.appendChild(top);
        if (al.label) card.appendChild(A.el('.tt-al-lab', { text: al.label }));
        var nf = al.on ? nextFire(al) : null;
        card.appendChild(A.el('.tt-al-next', {
          text: !al.on ? 'Off' : (nf ? 'Next: ' + nf.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'h') : 'Passed')
        }));
        listHost.appendChild(card);
      });
    }

    function describe(al) {
      if (al.repeat === 'once') return al.date || 'once';
      if (al.repeat === 'daily') return 'Every day';
      if (al.repeat === 'weekdays') return 'Weekdays';
      if (al.repeat === 'days') {
        var on = DAYS.filter(function (d, i) { return al.days && al.days[i]; });
        return on.length ? on.join(' ') : 'No days picked';
      }
      return '';
    }

    function editAlarm(existing) {
      var now = new Date();
      var al = existing ? JSON.parse(JSON.stringify(existing)) : {
        id: 'a' + Date.now().toString(36), h: now.getHours(), m: now.getMinutes(),
        repeat: 'once', date: now.toISOString().slice(0, 10),
        days: [false, false, false, false, false, false, false],
        how: 'both', label: '', on: true
      };

      var ov = A.el('.place-ov');
      var box = A.el('.place-box');
      var head = A.el('.place-head');
      head.appendChild(A.el('button.place-x', { html: Icons.svg('close'), onclick: function () { ov.remove(); } }));
      head.appendChild(A.el('span.place-title', { text: existing ? 'Edit alarm' : 'New alarm' }));
      head.appendChild(A.el('button.nb-save', {
        html: Icons.svg('check') + ' Save',
        onclick: function () {
          al.h = Math.max(0, Math.min(23, +al.h || 0));
          al.m = Math.max(0, Math.min(59, +al.m || 0));
          var l = alarms();
          var idx = -1;
          l.forEach(function (x, k) { if (x.id === al.id) idx = k; });
          if (idx >= 0) l[idx] = al; else l.push(al);
          setAlarms(l);
          ov.remove(); A.toast('Alarm saved'); paint();
        }
      }));
      box.appendChild(head);
      var body = A.el('.nb-edit');
      box.appendChild(body);

      /* Said here, at the moment the alarm is being set, rather than only in a
         note at the foot of the list: this is the point where someone decides
         to rely on it. */
      body.appendChild(A.UI.note('This alarm rings only while Artemidos is OPEN on screen. Android suspends the app in the background, and being in the recent-apps list does not keep it running, so if it falls due while the app is closed or asleep you are told late, when you next open it. For anything you must not miss, set the alarm clock on the phone as well.'));

      var trow = A.el('.split');
      trow.appendChild(A.UI.field({
        label: 'Hour', inputmode: 'numeric', value: String(al.h),
        oninput: function (e) { al.h = e.target.value; }
      }));
      trow.appendChild(A.UI.field({
        label: 'Minute', inputmode: 'numeric', value: String(al.m),
        oninput: function (e) { al.m = e.target.value; }
      }));
      body.appendChild(trow);

      body.appendChild(A.UI.field({
        label: 'Label (optional)', value: al.label, placeholder: 'What it is for',
        oninput: function (e) { al.label = e.target.value; }
      }));

      var dayHost = A.el('div');
      function paintRepeat() {
        A.clear(dayHost);
        if (al.repeat === 'once') {
          dayHost.appendChild(A.UI.field({
            label: 'Date', type: 'date', value: al.date,
            oninput: function (e) { al.date = e.target.value; }
          }));
        } else if (al.repeat === 'days') {
          dayHost.appendChild(A.el('span.fld-lab', { text: 'Which days' }));
          var wrap = A.el('.tt-days');
          DAYS.forEach(function (d, i) {
            wrap.appendChild(A.el('button.tt-day' + (al.days[i] ? '.on' : ''), {
              text: d,
              onclick: function () { al.days[i] = !al.days[i]; paintRepeat(); }
            }));
          });
          dayHost.appendChild(wrap);
        }
      }
      body.appendChild(A.UI.select({
        label: 'Repeat', value: al.repeat,
        options: [['once', 'Once, on a date'], ['daily', 'Every day'], ['weekdays', 'Weekdays only'], ['days', 'Chosen days']]
          .map(function (o) { return { value: o[0], label: o[1] }; }),
        onchange: function (e) { al.repeat = e.target.value; paintRepeat(); }
      }));
      body.appendChild(dayHost);
      paintRepeat();

      body.appendChild(A.UI.select({
        label: 'How it alerts', value: al.how,
        options: [['both', 'Sound and vibrate'], ['sound', 'Sound only'], ['vibrate', 'Vibrate only'], ['popup', 'Screen only']]
          .map(function (o) { return { value: o[0], label: o[1] }; }),
        onchange: function (e) { al.how = e.target.value; }
      }));

      ov.appendChild(box);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }

    host.appendChild(A.el('button.btn.block', {
      html: Icons.svg('plus') + ' New alarm',
      onclick: function () { editAlarm(null); }
    }));
    host.appendChild(listHost);
    paint();

    host.appendChild(A.UI.note('Alarms ring only while Artemidos is open on screen. Android suspends the app once it is in the background, and leaving it in the recent-apps list does not keep it running, so this cannot replace the alarm clock on the phone. If one falls due while the app is asleep you are told late, when you next open it.'));
  }

  /* ══ the watcher: one loop for every armed alarm ════════════════════════ */

  var watch = 0;
  function startWatch() {
    clearInterval(watch);
    watch = setInterval(function () {
      var all = alarms();
      if (!all.length) return;
      var now = Date.now();
      var changed = false;
      all.forEach(function (al) {
        if (!al.on) return;
        var nf = nextFire(al, new Date(al.lastCheck || now - 1000));
        if (!nf) return;
        var due = nf.getTime();
        if (due <= now && (!al.firedAt || al.firedAt < due)) {
          al.firedAt = due;
          changed = true;
          var late = now - due;
          fire(al.how, al.label || 'Alarm', two(al.h) + 'h' + two(al.m) +
            (late > 60000 ? '  ·  late by ' + hms(late, false) + ', the app was asleep' : ''));
          if (al.repeat === 'once') al.on = false;
        }
        al.lastCheck = now;
      });
      if (changed) setAlarms(all);
    }, 5000);
  }

  /* ══ calendar ══════════════════════════════════════════════

     The clock first because that is what the page is opened for, then the date
     written out, then the month. The grid starts on Monday, which is the ISO
     week and the one every European timetable and duty roster is written to.

     The clock ticks on its own interval and the interval is returned so the
     router can stop it: a page left running a timer it does not own is how an
     app ends up warm in a pocket. */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ══ calendar conversion ═══════════════════════════════════════════════

     Most of these come from the device's own calendar tables, which are part
     of the browser rather than something this app ships, so they are correct
     and they work offline. The French Republican calendar is not among them
     and is computed here.

     A NOTE ON WHICH ISLAMIC CALENDAR. There is no single one. The tabular
     civil calendar is arithmetic and predictable; Umm al-Qura is the Saudi
     civil calendar and is what most official dates are written in; an
     observed-crescent date in any given country can differ from both by a
     day. Both are offered, and a date that matters should be checked against
     the authority that will act on it. */

  var CAL_SYSTEMS = [
    { id: 'islamic-umalqura', label: 'Islamic (Umm al-Qura)' },
    { id: 'islamic-civil', label: 'Islamic (tabular civil)' },
    { id: 'persian', label: 'Persian (Solar Hijri)' },
    { id: 'hebrew', label: 'Hebrew' },
    { id: 'chinese', label: 'Chinese' },
    { id: 'indian', label: 'Indian national (Saka)' },
    { id: 'french', label: 'French Republican' }
  ];

  /* Gregorian calendar date to Julian Day Number */
  function gregToJDN(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
           Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  var FR_MONTHS = ['Vendémiaire', 'Brumaire', 'Frimaire', 'Nivôse', 'Pluviôse', 'Ventôse',
                   'Germinal', 'Floréal', 'Prairial', 'Messidor', 'Thermidor', 'Fructidor'];
  /* the five days that belong to no month, and the sixth in a sextile year */
  var FR_COMP = ['Jour de la vertu', 'Jour du génie', 'Jour du travail',
                 'Jour de l’opinion', 'Jour des récompenses', 'Jour de la révolution'];

  /* The republican year was meant to begin on the true autumn equinox at Paris,
     which is why its leap years cannot be written as a clean rule. The years it
     was actually in force ran sextile at 3, 7 and 11; the arithmetic rule below
     continues that pattern with the Gregorian century correction, which is the
     usual convention and is a convention rather than law. */
  function frSextile(y) {
    var n = y + 1;
    return n % 4 === 0 && (n % 100 !== 0 || n % 400 === 0);
  }
  function romanNumeral(n) {
    var v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    var s = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    var out = '';
    for (var i = 0; i < v.length && n > 0; i++) { while (n >= v[i]) { out += s[i]; n -= v[i]; } }
    return out;
  }
  function frenchRepublican(y, m, d) {
    var epoch = gregToJDN(1792, 9, 22);          /* 1 Vendémiaire An I */
    var days = gregToJDN(y, m, d) - epoch;
    if (days < 0) return null;                   /* before the calendar existed */
    var yr = 1;
    while (true) {
      var len = frSextile(yr) ? 366 : 365;
      if (days < len) break;
      days -= len; yr++;
      if (yr > 4000) return null;
    }
    if (days >= 360) {
      return { comp: true, name: FR_COMP[days - 360] || FR_COMP[5], year: yr };
    }
    return { comp: false, day: (days % 30) + 1, month: FR_MONTHS[Math.floor(days / 30)], year: yr };
  }

  /* ── month names, in transliteration and in the script the calendar is
     actually written in ──

     THESE ARE OURS ON PURPOSE. Asking the device to format a month NAME in a
     non-Gregorian calendar is not safe: on a good many builds the arithmetic
     is right and the name is not, and the Islamic second month comes back
     called "February". Only the NUMBERS are taken from the device; every name
     below is looked up here. */
  var ISLAMIC_M = [
    ['Muharram', 'محرم'], ['Safar', 'صفر'], ['Rabi al-awwal', 'ربيع الأول'],
    ['Rabi al-thani', 'ربيع الآخر'], ['Jumada al-awwal', 'جمادى الأولى'],
    ['Jumada al-thani', 'جمادى الآخرة'], ['Rajab', 'رجب'], ['Shaban', 'شعبان'],
    ['Ramadan', 'رمضان'], ['Shawwal', 'شوال'], ['Dhu al-Qidah', 'ذو القعدة'],
    ['Dhu al-Hijjah', 'ذو الحجة']
  ];
  var PERSIAN_M = [
    ['Farvardin', 'فروردین'], ['Ordibehesht', 'اردیبهشت'], ['Khordad', 'خرداد'],
    ['Tir', 'تیر'], ['Mordad', 'مرداد'], ['Shahrivar', 'شهریور'],
    ['Mehr', 'مهر'], ['Aban', 'آبان'], ['Azar', 'آذر'],
    ['Dey', 'دی'], ['Bahman', 'بهمن'], ['Esfand', 'اسفند']
  ];
  var INDIAN_M = [
    ['Chaitra', 'चैत्र'], ['Vaishakha', 'वैशाख'], ['Jyaishtha', 'ज्येष्ठ'],
    ['Ashadha', 'आषाढ'], ['Shravana', 'श्रावण'], ['Bhadrapada', 'भाद्रपद'],
    ['Ashvina', 'आश्विन'], ['Kartika', 'कार्तिक'], ['Agrahayana', 'अग्रहायण'],
    ['Pausha', 'पौष'], ['Magha', 'माघ'], ['Phalguna', 'फाल्गुन']
  ];
  /* the device names Hebrew months correctly, so these map its name to script */
  var HEBREW_M = {
    'Tishri': 'תשרי', 'Tishrei': 'תשרי', 'Heshvan': 'חשוון', 'Cheshvan': 'חשוון',
    'Marheshvan': 'חשוון', 'Kislev': 'כסלו', 'Tevet': 'טבת', 'Shevat': 'שבט',
    'Adar': 'אדר', 'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳',
    'Nisan': 'ניסן', 'Iyar': 'אייר', 'Iyyar': 'אייר', 'Sivan': 'סיוון',
    'Tamuz': 'תמוז', 'Tammuz': 'תמוז', 'Av': 'אב', 'Elul': 'אלול'
  };
  var CHINESE_M = [
    ['First month', '正月'], ['Second month', '二月'], ['Third month', '三月'],
    ['Fourth month', '四月'], ['Fifth month', '五月'], ['Sixth month', '六月'],
    ['Seventh month', '七月'], ['Eighth month', '八月'], ['Ninth month', '九月'],
    ['Tenth month', '十月'], ['Eleventh month', '十一月'], ['Twelfth month', '臘月']
  ];
  var ZODIAC = [
    ['Rat', '鼠'], ['Ox', '牛'], ['Tiger', '虎'], ['Rabbit', '兔'],
    ['Dragon', '龍'], ['Snake', '蛇'], ['Horse', '馬'], ['Goat', '羊'],
    ['Monkey', '猴'], ['Rooster', '雞'], ['Dog', '狗'], ['Pig', '豬']
  ];
  var STEMS = [['Jia', '甲'], ['Yi', '乙'], ['Bing', '丙'], ['Ding', '丁'], ['Wu', '戊'],
               ['Ji', '己'], ['Geng', '庚'], ['Xin', '辛'], ['Ren', '壬'], ['Gui', '癸']];
  var BRANCHES = [['Zi', '子'], ['Chou', '丑'], ['Yin', '寅'], ['Mao', '卯'], ['Chen', '辰'],
                  ['Si', '巳'], ['Wu', '午'], ['Wei', '未'], ['Shen', '申'], ['You', '酉'],
                  ['Xu', '戌'], ['Hai', '亥']];

  /* the numeric parts of a date in another calendar, straight from the device */
  function calParts(system, y, m, d) {
    try {
      /* noon UTC so no time zone can push the answer onto the day either side */
      var when = new Date(Date.UTC(y, m - 1, d, 12));
      var fmt = new Intl.DateTimeFormat('en-u-ca-' + system,
        { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });
      if (fmt.resolvedOptions().calendar !== system) return null;   /* silently fell back */
      var o = {};
      fmt.formatToParts(when).forEach(function (p) { o[p.type] = p.value; });
      if (o.day == null || o.month == null) return null;
      return o;
    } catch (e) { return null; }
  }

  function chineseZodiac(relYear) {
    var a = ((relYear - 4) % 12 + 12) % 12;
    var s = ((relYear - 4) % 10 + 10) % 10;
    return { animal: ZODIAC[a], stem: STEMS[s], branch: BRANCHES[a] };
  }

  /* One converted date. Returns { main, native, extra } or null if the device
     cannot do that calendar at all. */
  function convertDate(system, y, m, d) {
    if (system === 'french') {
      var f = frenchRepublican(y, m, d);
      if (!f) return { main: 'Before the Republican calendar began, 22 September 1792.' };
      var an = 'An ' + romanNumeral(f.year);
      return { main: f.comp ? (f.name + ', ' + an) : (f.day + ' ' + f.month + ' ' + an) };
    }

    var o = calParts(system, y, m, d);
    if (!o) return null;
    var day = parseInt(o.day, 10);

    if (system === 'hebrew') {
      /* the device gets Hebrew month names right, including Adar I and II */
      var hn = o.month;
      var heb = HEBREW_M[hn] || '';
      return {
        main: day + ' ' + hn + ' ' + o.year,
        native: heb ? (day + ' ' + heb + ' ' + o.year) : '',
        extra: (hn === 'Adar I' || hn === 'Adar II')
          ? 'A leap year: Adar is doubled, so this year runs thirteen months.' : ''
      };
    }

    if (system === 'chinese') {
      /* a leap month comes back as "6bis" and is the repeat of the sixth */
      var raw = String(o.month), leap = raw.indexOf('bis') >= 0;
      var mi = parseInt(raw, 10) - 1;
      var nm = CHINESE_M[mi] || ['Month ' + (mi + 1), (mi + 1) + '月'];
      var rel = parseInt(o.relatedYear || o.year, 10);
      var z = chineseZodiac(rel);
      return {
        main: A.tr(nm[0]) + (leap ? ' (leap)' : '') + ' ' + day + ', ' + A.tr('year of the') + ' ' + A.tr(z.animal[0]),
        native: (leap ? '閏' : '') + nm[1] + ' ' + day + '日  ·  ' +
                z.stem[1] + z.branch[1] + '年  ·  ' + z.animal[1],
        extra: 'Sexagenary year ' + z.stem[0] + '-' + z.branch[0] +
               (leap ? '. A leap month: this month is repeated to keep the moon and the sun together.' : '')
      };
    }

    var table = system === 'persian' ? PERSIAN_M
              : system === 'indian' ? INDIAN_M
              : ISLAMIC_M;
    var idx = parseInt(o.month, 10) - 1;
    var nmx = table[idx];
    if (!nmx) return { main: day + ' month ' + (idx + 1) + ' ' + o.year };
    var era = system === 'persian' ? 'AP' : (system === 'indian' ? 'Saka' : 'AH');
    /* Devanagari takes a plain comma; Arabic and Persian take their own */
    var sep = system === 'indian' ? ', ' : '، ';
    return {
      main: day + ' ' + nmx[0] + ' ' + o.year + ' ' + era,
      native: system === 'indian'
        ? (day + ' ' + nmx[1] + ', ' + o.year)
        : (nmx[1] + ' ' + day + sep + o.year)
    };
  }

  /* ── Ramadan for a Gregorian year ──
     Found by walking the year and watching for the Islamic month turning to 9
     and away from it again, which needs no table of its own and stays right
     whichever Islamic calendar the device is using. */
  function ramadanRange(system, gYear) {
    var start = null, end = null, prev = null;
    var d = new Date(Date.UTC(gYear, 0, 1, 12));
    for (var i = 0; i < 400; i++) {
      var o = calParts(system, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      if (!o) return null;
      var mo = parseInt(o.month, 10);
      if (mo === 9 && prev !== 9) start = new Date(d.getTime());
      if (mo !== 9 && prev === 9 && start) { end = new Date(d.getTime() - 86400000); break; }
      prev = mo;
      d = new Date(d.getTime() + 86400000);
      if (d.getUTCFullYear() > gYear + 1) break;
    }
    if (!start) return null;
    return { start: start, end: end };
  }

  /* a Gregorian date written out, for the Ramadan panel */
  function gregLabel(dt) {
    return DAYS[(dt.getUTCDay() + 6) % 7] + ', ' + dt.getUTCDate() + ' ' +
           MONTHS[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear();
  }

  function calendarTab(host) {
    /* the month being looked at, which is not necessarily the month we are in */
    var view = new Date();
    view = new Date(view.getFullYear(), view.getMonth(), 1);

    var clockEl = A.el('.cal-clock', { text: '--h--' });
    var secEl = A.el('.cal-sec', { text: '--' });
    var dateEl = A.el('.cal-date', { text: '' });

    var head = A.UI.card();
    head.appendChild(A.el('.cal-clockrow', null, [clockEl, secEl]));
    head.appendChild(dateEl);
    host.appendChild(head);

    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    function paintClock() {
      var n = new Date();
      /* 24-hour, written the way the rest of the app writes time */
      clockEl.textContent = pad2(n.getHours()) + 'h' + pad2(n.getMinutes());
      secEl.textContent = pad2(n.getSeconds());
      var dow = (n.getDay() + 6) % 7;   /* JS weeks start on Sunday; ours do not */
      dateEl.textContent = A.tr(DAYS[dow]) + ', ' + n.getDate() + ' ' +
                           A.tr(MONTHS[n.getMonth()]) + ' ' + n.getFullYear();
    }
    paintClock();
    var tick = setInterval(paintClock, 1000);

    var grid = A.UI.card();
    host.appendChild(grid);

    function paintMonth() {
      A.clear(grid);
      var y = view.getFullYear(), m = view.getMonth();
      var nav = A.el('.cal-nav');
      nav.appendChild(A.el('button.btn.ghost.cal-chev', {
        text: '‹', 'aria-label': 'Previous month',
        onclick: function () { view = new Date(y, m - 1, 1); A.haptic(); paintMonth(); }
      }));
      nav.appendChild(A.el('.cal-title', { text: A.tr(MONTHS[m]) + ' ' + y }));
      nav.appendChild(A.el('button.btn.ghost.cal-chev', {
        text: '›', 'aria-label': 'Next month',
        onclick: function () { view = new Date(y, m + 1, 1); A.haptic(); paintMonth(); }
      }));
      grid.appendChild(nav);

      var hd = A.el('.cal-grid.cal-head');
      DAYS_SHORT.forEach(function (d) { hd.appendChild(A.el('.cal-dow', { text: A.tr(d) })); });
      grid.appendChild(hd);

      var g = A.el('.cal-grid');
      /* how many blanks before the first, with Monday as column one */
      var first = (new Date(y, m, 1).getDay() + 6) % 7;
      var days = new Date(y, m + 1, 0).getDate();
      var prevDays = new Date(y, m, 0).getDate();
      var today = new Date();
      var i;
      for (i = 0; i < first; i++) {
        g.appendChild(A.el('.cal-cell.cal-out', { text: String(prevDays - first + 1 + i) }));
      }
      for (i = 1; i <= days; i++) {
        var isToday = (i === today.getDate() && m === today.getMonth() && y === today.getFullYear());
        var col = (first + i - 1) % 7;
        var cls = '.cal-cell' + (isToday ? '.cal-today' : '') + (col >= 5 ? '.cal-weekend' : '');
        g.appendChild(A.el(cls, { text: String(i) }));
      }
      /* pad the last row so the grid does not end ragged */
      var used = first + days, tail = (7 - used % 7) % 7;
      for (i = 1; i <= tail; i++) g.appendChild(A.el('.cal-cell.cal-out', { text: String(i) }));
      grid.appendChild(g);

      if (view.getFullYear() !== today.getFullYear() || view.getMonth() !== today.getMonth()) {
        grid.appendChild(A.el('button.btn.ghost.block', {
          text: 'Back to this month', style: { marginTop: '10px' },
          onclick: function () { view = new Date(today.getFullYear(), today.getMonth(), 1); A.haptic(); paintMonth(); }
        }));
      }
    }
    paintMonth();

    /* ── converter ──
       A small board under the month. It converts one date at a time rather
       than painting the whole grid in another calendar, because the grid is
       for finding a day and this is for answering "what is that date called
       somewhere else". */
    var conv = A.UI.card();
    conv.appendChild(A.el('.sec-lab', { text: 'Convert this date' }));

    var todayISO = (function () {
      var n = new Date();
      return n.getFullYear() + '-' + pad2(n.getMonth() + 1) + '-' + pad2(n.getDate());
    })();
    var cst = A.store.get('time.calconv', { system: 'islamic-umalqura' });
    var chosen = todayISO;

    var dateF = A.el('input.fld-in', { type: 'date', value: chosen });
    var dwrap = A.el('label.fld');
    dwrap.appendChild(A.el('span.fld-lab', { text: 'Date' }));
    dwrap.appendChild(dateF);
    conv.appendChild(dwrap);

    var sysSel = A.UI.select({
      label: 'Calendar',
      value: cst.system,
      options: CAL_SYSTEMS.map(function (s) { return { value: s.id, label: s.label }; }),
      onchange: function (e) {
        cst.system = e.target.value;
        A.store.set('time.calconv', cst);
        paintConv();
      }
    });
    conv.appendChild(sysSel);

    var convOut = A.el('div', { style: { marginTop: '10px' } });
    conv.appendChild(convOut);

    function paintConv() {
      A.clear(convOut);
      var parts = (chosen || '').split('-');
      var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
      if (!isFinite(y) || !isFinite(m) || !isFinite(d)) {
        convOut.appendChild(A.UI.empty('Pick a date.'));
        return;
      }
      var res = convertDate(cst.system, y, m, d);
      var name = '';
      CAL_SYSTEMS.forEach(function (s) { if (s.id === cst.system) name = s.label; });

      if (res == null) {
        convOut.appendChild(A.UI.note(
          'This device does not carry the tables for the ' + name + ' calendar, so the ' +
          'date cannot be converted here. The others on the list will still work.'));
        return;
      }
      convOut.appendChild(A.UI.metric(name, res.main, { big: true }));
      /* the same date in the script the calendar is actually written in */
      if (res.native) {
        convOut.appendChild(A.el('.cal-native', {
          text: res.native,
          dir: (cst.system.indexOf('islamic') === 0 || cst.system === 'persian' ||
                cst.system === 'hebrew') ? 'rtl' : 'ltr'
        }));
      }
      if (res.extra) convOut.appendChild(A.UI.metric('Also', res.extra));
      /* the Gregorian source, so the two are always readable together */
      convOut.appendChild(A.UI.metric('Gregorian',
        d + ' ' + A.tr(MONTHS[m - 1]) + ' ' + y,
        { sub: A.tr(DAYS[(new Date(y, m - 1, d).getDay() + 6) % 7]) }));

      if (cst.system === 'french') {
        convOut.appendChild(A.UI.note(
          'The Republican year began on the true autumn equinox at Paris, so its leap years ' +
          'have no clean rule. Dates inside the years it was actually in force, 1792 to 1805, ' +
          'are right; later ones follow the usual arithmetic continuation, which is a ' +
          'convention rather than law.'));
      } else if (cst.system.indexOf('islamic') === 0) {
        /* Ramadan for the year being looked at, worked out from the same
           calendar the rest of the panel is using */
        var ram = ramadanRange(cst.system, y);
        if (ram && ram.start && ram.end) {
          var rc = A.UI.card(null, 'tight');
          rc.appendChild(A.el('.sec-lab', { text: 'Ramadan رمضان ' + y }));
          rc.appendChild(A.UI.metric('Begins', gregLabel(ram.start),
            { sub: 'first day of Ramadan, 1 رمضان' }));
          rc.appendChild(A.UI.metric('Ends', gregLabel(ram.end),
            { sub: 'last day; Eid al-Fitr عيد الفطر is the day after' }));
          rc.appendChild(A.UI.metric('Length',
            (Math.round((ram.end - ram.start) / 86400000) + 1) + ' days'));
          convOut.appendChild(rc);
        }
        convOut.appendChild(A.UI.note(
          'There is no single Islamic calendar. The tabular civil one is arithmetic; Umm al-Qura ' +
          'is the Saudi civil calendar and is what most official dates use; a date set by ' +
          'observing the crescent locally can differ from either by a day. THE RAMADAN DATES ' +
          'ABOVE ARE THE CALCULATED ONES: the start is declared on the sighting of the crescent ' +
          'and moves by a day either way from country to country. Follow the announcement where ' +
          'you are, not this.'));
      } else if (cst.system === 'indian') {
        convOut.appendChild(A.UI.note(
          'This is the Indian national calendar, the Saka era, which is the official civil one. ' +
          'The regional lunisolar calendars, Vikram Samvat and the Bengali and Tamil ones among ' +
          'them, are different reckonings and will not agree with this.'));
      } else if (cst.system === 'chinese') {
        convOut.appendChild(A.UI.note(
          'The Chinese calendar is lunisolar and its months are numbered rather than named, with ' +
          'a leap month inserted where the sun and moon need reconciling. The year is given with ' +
          'its sexagenary stem-and-branch name.'));
      }
    }

    dateF.addEventListener('change', function () { chosen = dateF.value; paintConv(); });
    dateF.addEventListener('input', function () { chosen = dateF.value; paintConv(); });
    paintConv();
    host.appendChild(conv);

    return function () { clearInterval(tick); };
  }

  /* ══ the page ═══════════════════════════════════════════════════════════ */

  var TABS = [
    { id: 'cal', label: 'Calendar' },
    { id: 'stop', label: 'Stopwatch' },
    { id: 'timer', label: 'Timer' },
    { id: 'round', label: 'Round' },
    { id: 'alarm', label: 'Alarms' }
  ];

  function render(host) {
    var tab = A.store.get('time.tab', 'cal');
    if (!TABS.some(function (t) { return t.id === tab; })) tab = 'cal';
    host.appendChild(A.UI.chips(TABS, tab, function (id) { A.store.set('time.tab', id); A.Router.refresh(); }));
    var body = A.el('div');
    host.appendChild(body);
    if (tab === 'timer') timerTab(body);
    /* the round board repaints four times a second while it is on screen, so
       its interval has to reach the router the way the calendar's does */
    else if (tab === 'round') return roundTab(body);
    else if (tab === 'alarm') alarmsTab(body);
    else if (tab === 'stop') stopwatchTab(body);
    /* the calendar owns a one-second interval, so its teardown has to reach the
       router or the clock keeps ticking after the page is gone */
    else return calendarTab(body);
  }

  startWatch();

  /* What is running, for the Console to show. Read-only and cheap: the Console
     asks, rather than the time tools having to know the Console exists. */
  function status() {
    var swMs = sw.acc + (sw.running ? Date.now() - sw.start : 0);
    var tmLeft = tm.running ? Math.max(0, tm.endAt - Date.now()) : tm.left;
    var armed = alarms().filter(function (a) { return a.on; });
    var next = null;
    armed.forEach(function (a) {
      var nf = nextFire(a);
      if (nf && (!next || nf < next.at)) next = { at: nf, label: a.label, h: a.h, m: a.m };
    });
    return {
      stopwatch: { running: sw.running, text: hms(swMs, false), any: sw.running || swMs > 0 },
      timer: { running: tm.running, text: hms(tmLeft, false), any: tm.running || tmLeft > 0 },
      alarms: { armed: armed.length, next: next }
    };
  }

  /* ══ THE FLOATING TIMER ═══════════════════════════════════════════════
     Deliberately dumber than the mini compass: no sensor, no drag, one line
     of text. It repaints once a second from the same clock the timer tab
     reads, so the two can never disagree, and it removes itself the moment
     the countdown stops rather than sitting there showing 00:00.

     It stands down on the Time tools page itself, which is already showing a
     much larger version of the same number. */
  var pipEl = null, pipTick = null;

  function closePip() {
    if (pipTick) { clearInterval(pipTick); pipTick = null; }
    if (pipEl && pipEl.parentNode) pipEl.parentNode.removeChild(pipEl);
    pipEl = null;
  }

  function openPip() {
    if (pipEl) return;
    pipEl = A.el('button.mini-tmr', {
      'aria-label': 'Timer',
      onclick: function () {
        A.haptic();
        A.store.set('time.tab', 'timer');
        A.Router.go('field?tab=time');
      }
    });
    var val = A.el('.mini-tmr-v', { text: '' });
    pipEl.appendChild(A.el('span.mini-tmr-i', { html: Icons.svg('clock') }));
    pipEl.appendChild(val);
    document.body.appendChild(pipEl);

    function paintPip() {
      var t = status().timer;
      if (!t.running) { closePip(); return; }
      val.textContent = t.text;
    }
    paintPip();
    pipTick = setInterval(paintPip, 1000);
  }

  /* One decision point, so the switch, the route and the start/stop of a
     countdown all reach the same answer. */
  function syncPip() {
    if (!A.store.get('time.pip', false)) { closePip(); return; }
    var r = A.Router.current && A.Router.current();
    var onTimeTools = r && r.name === 'field' && (A.Router.params().query || {}).tab === 'time';
    if (onTimeTools) { closePip(); return; }
    if (status().timer.running) openPip(); else closePip();
  }

  A.Bus.on('route', syncPip);
  /* A timer started on one page and left running has to raise the pip when
     the user walks away, and drop it when it finishes while they are
     elsewhere. Polling once a second is cheaper than wiring every caller. */
  setInterval(syncPip, 1000);

  global.ArtTime = { render: render, status: status, hms: hms, syncPip: syncPip };

})(window);
