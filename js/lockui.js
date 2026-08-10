/*
 * Artemidos - the lock screen and the PIN settings
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The rules this screen is built to, which are not the usual ones:
 *
 *   IT NEVER SAYS WHICH PIN WAS ENTERED. Right, limited and wipe all look
 *   identical from the outside: the pad clears, the app opens. Anything that
 *   distinguishes them - a different animation, a faster response, a toast -
 *   tells the person standing over your shoulder that you have just done
 *   something other than what they asked.
 *
 *   A WRONG PIN LOOKS THE SAME AS A RIGHT ONE UNTIL IT DOESN'T. There is no
 *   "checking" state to time. Every attempt takes the same path through the
 *   same three slots.
 *
 *   IT DOES NOT COUNT DOWN TO A WIPE. An attempt counter that destroys data
 *   after N tries is a way to lose your notebook to a child pressing buttons.
 *   Wrong attempts slow the pad down instead, which stops guessing without
 *   ever destroying anything by accident.
 */
(function (global) {
  'use strict';

  var L = global.ArtLock;
  var overlay = null;

  function minimise() {
    var App = global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.App;
    try {
      if (App && App.minimizeApp) App.minimizeApp();
      else if (App && App.exitApp) App.exitApp();
    } catch (e) {}
  }

  /* ══ the pad ══════════════════════════════════════════════════════════ */

  function padScreen(opts) {
    /* opts: title, sub, min, max, onDone(pin), allowCancel */
    var ov = A.el('.lk-ov');
    var box = A.el('.lk-box');
    var entered = '';

    var t = A.el('.lk-title', { text: opts.title });
    var sub = A.el('.lk-sub', { text: opts.sub || '' });
    var dots = A.el('.lk-dots');
    box.appendChild(A.el('.lk-mark', { html: Icons.mark ? Icons.mark(46) : Icons.svg('lock') }));
    box.appendChild(t);
    box.appendChild(sub);
    box.appendChild(dots);

    function paintDots() {
      A.clear(dots);
      for (var i = 0; i < Math.max(4, entered.length); i++) {
        dots.appendChild(A.el('span.lk-dot' + (i < entered.length ? '.on' : '')));
      }
    }

    var pad = A.el('.lk-pad');
    function key(label, fn, cls) {
      return A.el('button.lk-key' + (cls || ''), {
        text: label,
        onclick: function () { A.haptic(8); fn(); }
      });
    }
    function press(d) {
      if (entered.length >= (opts.max || 8)) return;
      entered += d; paintDots();
      /* no auto-submit: the length is part of the secret, and submitting as
         soon as it is long enough would leak where the boundary is */
    }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (d) {
      pad.appendChild(key(d, function () { press(d); }));
    });
    pad.appendChild(opts.allowCancel
      ? key('Cancel', function () { ov.remove(); if (opts.onCancel) opts.onCancel(); }, '.lk-small')
      : A.el('span'));
    pad.appendChild(key('0', function () { press('0'); }));
    pad.appendChild(key('⌫', function () { entered = entered.slice(0, -1); paintDots(); }, '.lk-small'));
    box.appendChild(pad);

    var go = A.el('button.btn.block.lk-go', {
      text: opts.action || 'Unlock',
      onclick: function () {
        if (entered.length < (opts.min || 4)) { shake(); return; }
        var pin = entered;
        entered = ''; paintDots();
        opts.onDone(pin, { shake: shake, close: function () { ov.remove(); } });
      }
    });
    box.appendChild(go);
    if (opts.foot) box.appendChild(A.el('.lk-foot', { text: opts.foot }));

    function shake() {
      box.classList.remove('lk-shake');
      /* reflow, so the animation restarts on a second wrong attempt */
      void box.offsetWidth;
      box.classList.add('lk-shake');
      A.haptic(30);
    }

    paintDots();
    ov.appendChild(box);
    document.body.appendChild(ov);
    return { ov: ov, box: box, shake: shake };
  }

  /* ══ the lock screen proper ═══════════════════════════════════════════ */

  /* The wait is shown, and it counts down. Hiding it would only make the pad
     look broken, and it says nothing about the PIN: the same twenty seconds
     follow four wrong tries whatever was typed. */
  function startPenalty(ui) {
    var sub = ui.box.querySelector('.lk-sub');
    ui.box.classList.add('lk-busy');
    clearInterval(ui._tick);
    ui._tick = setInterval(function () {
      var ms = L.blockedFor();
      if (ms <= 0) {
        clearInterval(ui._tick); ui._tick = null;
        ui.box.classList.remove('lk-busy');
        if (sub) sub.textContent = 'Enter your PIN';
        return;
      }
      if (sub) sub.textContent = 'Try again in ' + Math.ceil(ms / 1000) + ' s';
    }, 250);
    var ms0 = L.blockedFor();
    if (sub) sub.textContent = 'Try again in ' + Math.ceil(ms0 / 1000) + ' s';
  }

  function show() {
    if (overlay) return;
    var ui = padScreen({
      title: 'Artemidos',
      sub: 'Enter your PIN',
      action: 'Unlock',
      onDone: function (pin, h) {
        if (L.blockedFor() > 0) { h.shake(); return; }
        /* the pad is disabled during the attempt so the same PIN cannot be
           fired twice, but nothing on screen says what is happening */
        ui.box.classList.add('lk-busy');
        L.tryPin(pin).then(function (result) {
          ui.box.classList.remove('lk-busy');
          if (!result) {
            h.shake();
            /* Four wrong, and the phone leaves your hands: the pad stops for
               twenty seconds and the app goes to the background, so whoever is
               guessing has to find it and open it again to try four more. It
               costs the owner one mistaken entry and costs a guesser the whole
               rhythm of guessing. */
            if (L.noteWrong()) {
              startPenalty(ui);
              setTimeout(minimise, 260);   /* let the shake finish first */
            }
            return;
          }
          L.clearTries();
          /* every outcome leaves the same way */
          overlay.ov.remove();
          overlay = null;
          A.Bus.emit('unlocked', result);
          A.Router.go('console');
          A.Router.refresh();
        }).catch(function (e) {
          ui.box.classList.remove('lk-busy');
          if (e && e.message === 'vault-corrupt') {
            ui.box.appendChild(A.el('.lk-foot', {
              text: 'That PIN is right but the stored data will not open. It is ' +
                    'damaged, not lost to a wrong PIN. Nothing has been deleted.'
            }));
            return;
          }
          h.shake();
        });
      }
    });
    overlay = ui;
    /* the app may have been reopened part way through a penalty: it is held on
       disk precisely so closing the app does not clear it */
    if (L.blockedFor() > 0) startPenalty(ui);
  }

  global.ArtLockUI = { show: show };

  /* ══ deciding whether to ask ══════════════════════════════════════════ */

  function gate() {
    if (!L.isOn()) return;
    if (!L.available()) return;   /* no WebCrypto: the lock cannot be enforced */
    show();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gate);
  } else {
    gate();
  }

  /* re-lock after the app has been away long enough */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { L.noteBackground(); return; }
    if (L.shouldRelock()) { L.lockNow(); A.Router.go('console'); show(); }
  });

  /* ══ limited mode ═════════════════════════════════════════════════════
     Two tools, and nothing that would show what is on this phone. It is not
     announced anywhere: the app simply is this. */
  var ALLOWED = { calc: 1, convert: 1, console: 1, home: 1 };
  A.Bus.on('route', function (r) {
    if (!L.isLimited()) return;
    if (r && !ALLOWED[r.name]) A.Router.go('console');
  });

  /* ══ setting it up ════════════════════════════════════════════════════ */

  function askPin(title, sub, foot, cb) {
    var ui = padScreen({
      title: title, sub: sub, foot: foot, action: 'Continue', allowCancel: true,
      onDone: function (pin, h) { ui.ov.remove(); cb(pin); },
      onCancel: function () { cb(null); }
    });
    return ui;
  }

  /* ── setting the unlock PIN ──
     Only the real one. The two duress PINs are each turned on separately in
     Settings, because most people want neither, some want one, and being
     marched through four PIN screens to get a lock is how a lock ends up not
     being set at all. */
  function setupFlow(done) {
    askPin('Set your PIN', '4 to 8 digits',
      'There is no recovery. If you forget this PIN the notebook and the War Pigeon keys are gone for good - they are encrypted with it, and nobody can open them without it.',
      function (p1) {
        if (!p1) return done(false);
        askPin('Again', 'Confirm the same PIN', null, function (p2) {
          if (!p2) return done(false);
          if (p1 !== p2) { A.toast('Those did not match'); return done(false); }
          var fn = L.isOn() ? L.changeReal(p1) : L.setup(p1);
          fn.then(function () { done(true); })
            .catch(function (e) { A.toast('Could not set the PIN'); console.error(e); done(false); });
        });
      });
  }

  /* ── setting one duress PIN ── */
  var DURESS_TEXT = {
    limited: {
      title: 'Duress PIN - limited',
      sub: 'Opens only the calculator and converter',
      foot: 'Give this one if you are made to unlock the phone. It opens an app with nothing in it, and it does not announce itself: from the outside it looks exactly like an ordinary unlock. Nothing is deleted.'
    },
    wipe: {
      title: 'Duress PIN - erase',
      sub: 'Destroys everything, then opens the empty app',
      foot: 'Entering this PIN deletes the notebook, the keys, the log and the stored map tiles, with no confirmation and no undo. It looks exactly like an ordinary unlock.'
    }
  };

  function duressFlow(role, done) {
    var t = DURESS_TEXT[role];
    askPin(t.title, t.sub, t.foot, function (p1) {
      if (!p1) return done(false);
      askPin('Again', 'Confirm the same PIN', null, function (p2) {
        if (!p2) return done(false);
        if (p1 !== p2) { A.toast('Those did not match'); return done(false); }
        L.setDuress(role, p1).then(function () { done(true); })
          .catch(function (e) { A.toast('Could not set that PIN'); console.error(e); done(false); });
      });
    });
  }
  global.ArtLockUI.duress = duressFlow;

  global.ArtLockUI.setup = setupFlow;

})(window);
