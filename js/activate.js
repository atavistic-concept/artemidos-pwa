/*
 * Artemidos - activation, purchase and device management
 * Copyright (c) 2026 Artemidos. All rights reserved.
 *
 * The screen is available in BOTH builds. In the keyless author build it
 * gates nothing, but it still works: being able to walk the whole purchase
 * without shipping a locked build is worth more than hiding a page.
 *
 * ══ WHAT LEAVES THE DEVICE HERE ═══════════════════════════════════════════
 *
 * This is the one part of Artemidos that talks to a server by design, and the
 * About page says so. It sends: an email address the user typed, the order id
 * it was given back, a licence key, and a device identifier. It never sends
 * anything from the notebook, the keys, the log, or a position.
 */
(function (global) {
  'use strict';

  var L = global.ArtLicence;
  var API = 'https://admin.inritum.com';

  /* A device id the user can recognise in a list, generated once and kept.
     Not a hardware identifier: Android gives an app no stable one without
     permissions this app has no business holding, and a random id per install
     is honest about what it actually is - a slot, not a fingerprint. */
  function deviceId() {
    var d = A.store.get('lic.device', null);
    if (!d) {
      var a = new Uint8Array(16);
      global.crypto.getRandomValues(a);
      d = Array.prototype.map.call(a, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
      A.store.set('lic.device', d);
    }
    return d;
  }

  /* Installed app, or a page in a browser? Same test app.js uses for the
     service worker, kept in step with it deliberately: Capacitor present, or
     the capacitor: scheme. Anything else is a browser, including the hosted
     web app people add to a home screen. */
  function isNativeBuild() {
    return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()) ||
      !!global.Capacitor ||
      location.protocol === 'capacitor:';
  }

  function deviceLabel() {
    var m = /Android[^;]*;\s*([^)]+)\)/.exec(navigator.userAgent || '');
    return (m ? m[1].split(';')[0].trim() : 'this device').slice(0, 60);
  }

  /* ══ TALKING TO THE LICENCE SERVER ════════════════════════════════════
     In the installed app these go through Capacitor's native HTTP rather
     than the WebView's fetch, and that is not an optimisation.

     The app runs at origin https://localhost and the licence server is a
     different origin, so a WebView fetch is a cross-origin request and obeys
     CORS exactly as Safari does. A JSON content-type forces a preflight; if
     the server does not answer OPTIONS and does not return
     Access-Control-Allow-Origin, the browser engine drops the request before
     it reaches the network. That is a browser rule, not a server outage, and
     it made a perfectly healthy server look unreachable from the phone.

     A native app has no business being subject to it. CapacitorHttp issues
     the request from Android itself, where CORS does not apply. It needs no
     entry in capacitor.config.json: the global fetch patch does, but calling
     the plugin directly does not, which is deliberate here because patching
     fetch app-wide would also capture the map tiles and the currency rates
     and change how their responses are read.

     On the web there is no native layer, so it falls back to fetch and the
     server must send the header. Nothing else works there. */
  function nativeHttp() {
    var C = global.Capacitor;
    return (C && C.Plugins && C.Plugins.CapacitorHttp) ? C.Plugins.CapacitorHttp : null;
  }

  /* CapacitorHttp parses JSON itself when the server says so, but returns a
     string when it does not. Accept both rather than trusting the header. */
  function asJson(d) {
    if (typeof d !== 'string') return d;
    try { return JSON.parse(d); } catch (e) { return {}; }
  }

  function post(path, body) {
    var H = nativeHttp();
    if (H) {
      return H.request({
        url: API + path, method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body
      }).then(function (r) { return asJson(r.data); });
    }
    return fetch(API + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function get(path) {
    var H = nativeHttp();
    if (H) {
      return H.request({ url: API + path, method: 'GET' })
        .then(function (r) { return asJson(r.data); });
    }
    return fetch(API + path).then(function (r) { return r.json(); });
  }

  /* ══ the page ══════════════════════════════════════════════════════════ */

  A.Router.register('activate', {
    render: function (host) {
      A.setTitle('Activation', { back: true });

      /* ── already activated ── */
      if (L.active() && L.claims()) {
        var c = L.claims();
        host.appendChild(A.UI.section('This copy is activated'));
        var card = A.UI.card(null, 'tight');
        card.appendChild(A.UI.metric('Status', c.k === 'g' ? 'Courtesy key' : 'Purchased',
          { icon: 'check' }));
        card.appendChild(A.UI.metric('Key', c.id));
        card.appendChild(A.UI.metric('Devices allowed', String(c.d)));
        var iss = L.issued();
        if (iss) card.appendChild(A.UI.metric('Issued', iss.toISOString().slice(0, 10)));
        host.appendChild(card);

        host.appendChild(A.UI.note(
          'It is a lifetime key and it covers every future update. Keep the email ' +
          'it came in: uninstalling clears the key from this phone, and you will need ' +
          'to paste it back. Uninstalling never cancels the key itself.'));

        host.appendChild(A.el('button.btn.ghost.block', {
          html: Icons.svg('copy') + ' Copy my key',
          onclick: function () {
            var k = L.key();
            if (!k) return;
            navigator.clipboard.writeText(k).then(function () { A.toast('Key copied'); });
          }
        }));
        host.appendChild(A.el('button.btn.danger.block', {
          html: Icons.svg('close') + ' Remove the key from this phone',
          style: { marginTop: '8px' },
          onclick: function () {
            if (!confirm('Remove the key from this device? The key stays valid and you can paste it back.')) return;
            L.clear(); A.haptic(); A.Router.refresh();
          }
        }));
        return;
      }

      /* ── not activated ── */
      if (!L.required()) {
        host.appendChild(A.UI.note(
          'This build does not require a key. You can still buy and enter one below; ' +
          'it simply is not needed to use this copy.'));
      }

      renderBuy(host);
      renderEnter(host);
      renderResend(host);
    }
  });

  /* ── buying ─────────────────────────────────────────────────────────── */

  function renderBuy(host) {
    host.appendChild(A.UI.section('Buy a licence'));
    var st = A.store.get('lic.order', null);

    /* an order already in flight: show it and keep polling */
    if (st && st.orderId && Date.now() < st.expiresAt) return renderPending(host, st);

    var card = A.UI.card();
    card.appendChild(A.el('p', {
      style: { margin: '0 0 12px', lineHeight: '1.6', color: 'var(--text-2)' },
      text: 'One payment, no subscription. The key is yours for life and covers ' +
            'every future update, on up to six devices at once.'
    }));

    var email = '', method = 'usdt_ton';
    card.appendChild(A.UI.field({
      label: 'Your email', inputmode: 'email',
      placeholder: 'where the key is sent',
      oninput: function (e) { email = e.target.value.trim(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Pay with', value: method,
      options: [{ value: 'usdt_ton', label: 'USDT on TON, a fixed $35' },
                { value: 'ton', label: 'TON, quoted at today’s rate' }],
      onchange: function (e) { method = e.target.value; }
    }));

    var out = A.el('div');
    card.appendChild(A.el('button.btn.block', {
      html: Icons.svg('money') + ' Get a payment address',
      style: { marginTop: '10px' },
      onclick: function () {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          A.toast('Enter a valid email first'); return;
        }
        A.clear(out);
        out.appendChild(A.UI.note('Getting a price…'));
        post('/api/order', { email: email, method: method }).then(function (r) {
          A.clear(out);
          if (r.error) { out.appendChild(A.UI.note(r.error)); return; }
          A.store.set('lic.order', r);
          A.haptic();
          A.Router.refresh();
        }).catch(function () {
          A.clear(out);
          /* WHY THIS SPLITS BY BUILD.
             In the installed app a failure here really is the connection. In a
             browser it is usually not: the licence server has to permit
             requests from the page's origin, and until it does the browser
             blocks the call before it leaves the machine, which looks
             identical to being offline. Telling a browser user to check their
             signal would send them chasing a fault that is not theirs.

             Buying is the ONLY part that needs the server. A key already
             issued verifies against a public key held in the build, so
             pasting one works with no network at all, and that is worth
             saying here rather than leaving them stuck. */
          out.appendChild(A.UI.note(isNativeBuild()
            ? 'Could not reach the licence server. This is the one part of the app ' +
              'that needs a connection.'
            : A.tr('Buying is not available in the browser version yet. Buy from the ' +
                    'Android app, or write to atavisticconcept@gmail.com. If you already ' +
                    'have a key, paste it below: that works with no connection at all.')));
        });
      }
    }));
    card.appendChild(out);
    host.appendChild(card);

    host.appendChild(A.UI.note(
      'Payment is in TON or USDT-on-TON only. Both settle in seconds and cost a few ' +
      'cents in network fees. There is no card processor and no account.'));
  }

  /* ── an order awaiting payment ──────────────────────────────────────── */

  function renderPending(host, o) {
    var card = A.UI.card(null, 'tight');
    card.appendChild(A.UI.metric('Send exactly', o.amount + ' ' + o.currency, { big: true }));
    card.appendChild(A.UI.metric('To this address', ''));
    card.appendChild(A.el('.lrow-s', {
      text: o.address,
      style: { whiteSpace: 'normal', wordBreak: 'break-all', marginTop: '2px',
               fontFamily: 'var(--mono)' }
    }));
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('copy') + ' Copy the address',
      style: { marginTop: '8px' },
      onclick: function () {
        navigator.clipboard.writeText(o.address).then(function () { A.toast('Address copied'); });
      }
    }));
    host.appendChild(card);

    /* The memo is the part people skip, so it gets its own card and a warning
       rather than a line inside a paragraph. Without it the payment cannot be
       matched to anyone. */
    var memo = A.UI.card();
    memo.appendChild(A.el('.sec-lab', { text: 'Put this in the comment' }));
    memo.appendChild(A.el('div', {
      text: o.memo,
      style: { fontFamily: 'var(--mono)', fontSize: '1.5rem', fontWeight: '700',
               color: 'var(--acc)', textAlign: 'center', padding: '10px 0',
               letterSpacing: '.08em' }
    }));
    memo.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('copy') + ' Copy the code',
      onclick: function () {
        navigator.clipboard.writeText(o.memo).then(function () { A.toast('Code copied'); });
      }
    }));
    memo.appendChild(A.el('p', {
      style: { margin: '10px 0 0', lineHeight: '1.6', color: 'var(--warn)', fontSize: '13px' },
      text: 'Your wallet will call this the comment, the memo or the message. ' +
            'A payment without it cannot be matched to you and the key will not ' +
            'be issued automatically.'
    }));
    host.appendChild(memo);

    var status = A.el('div');
    host.appendChild(status);

    function paint(msg) { A.clear(status); status.appendChild(A.UI.note(msg)); }
    paint('Waiting for the payment. This page checks every fifteen seconds, and ' +
          'you can close the app and come back, the order is kept.');

    var tries = 0;
    var timer = setInterval(function () {
      if (++tries > 80) { clearInterval(timer); return; }
      get('/api/order?id=' + encodeURIComponent(o.orderId)).then(function (r) {
        if (r.status === 'issued' && r.key) {
          clearInterval(timer);
          A.store.set('lic.order', null);
          L.activate(r.key).then(function (c) {
            A.haptic(30);
            if (c) { A.toast('Activated'); A.Router.refresh(); }
            else paint('A key arrived but it did not verify. Contact support.');
          });
        } else if (r.status === 'underpaid') {
          clearInterval(timer);
          paint('The payment arrived but was short of ' + o.amount + ' ' + o.currency +
                '. Nothing is lost. Write to support with the code ' + o.memo + '.');
        } else if (r.status === 'expired') {
          clearInterval(timer);
          paint('This quote expired. Start a new order; the rate is re-quoted.');
        }
      }).catch(function () { /* offline for a moment: keep waiting */ });
    }, 15000);

    A.Router.get('activate').teardown = function () { clearInterval(timer); };

    host.appendChild(A.el('button.btn.ghost.block', {
      text: 'Cancel this order',
      style: { marginTop: '10px' },
      onclick: function () {
        clearInterval(timer);
        A.store.set('lic.order', null);
        A.Router.refresh();
      }
    }));
  }

  /* ── entering a key by hand ─────────────────────────────────────────── */

  function renderEnter(host) {
    host.appendChild(A.UI.section('Already have a key'));
    var card = A.UI.card();
    var val = '';
    var f = A.UI.field({
      label: 'Paste it here', placeholder: 'ARTM1.…',
      oninput: function (e) { val = e.target.value; }
    });
    card.appendChild(f);
    var out = A.el('div');
    card.appendChild(A.el('button.btn.block', {
      html: Icons.svg('lock') + ' Activate',
      style: { marginTop: '10px' },
      onclick: function () {
        A.clear(out);
        L.activate(val).then(function (c) {
          if (!c) {
            out.appendChild(A.UI.note(
              'That key did not verify. Check it was copied whole, starting ARTM1 ' +
              'and with nothing missing from the end.'));
            return;
          }
          /* register the device, but do not block activation on it: the key is
             valid whether or not the server can be reached right now */
          post('/api/check', {
            keyId: c.id, deviceId: deviceId(), label: deviceLabel()
          }).then(function (r) {
            if (r && r.deviceAccepted === false) {
              A.toast('Activated, but this key is on ' + r.devicesMax + ' devices already');
            }
            L.markChecked();
          }).catch(function () {});
          A.haptic(30);
          A.toast('Activated');
          A.Router.refresh();
        });
      }
    }));
    card.appendChild(out);
    host.appendChild(card);
  }

  /* ── resend ─────────────────────────────────────────────────────────── */

  function renderResend(host) {
    host.appendChild(A.UI.section('Lost your key'));
    var card = A.UI.card();
    var email = '';
    card.appendChild(A.UI.field({
      label: 'Your email', inputmode: 'email',
      oninput: function (e) { email = e.target.value.trim(); }
    }));
    var out = A.el('div');
    card.appendChild(A.el('button.btn.ghost.block', {
      html: Icons.svg('info') + ' Email my key again',
      style: { marginTop: '10px' },
      onclick: function () {
        A.clear(out);
        post('/api/resend', { email: email }).then(function (r) {
          out.appendChild(A.UI.note(r.message || 'Sent, if that address has a key.'));
        }).catch(function () {
          out.appendChild(A.UI.note('Could not reach the server.'));
        });
      }
    }));
    card.appendChild(out);
    host.appendChild(card);
  }

  /* ══ the weekly check-in ═══════════════════════════════════════════════
     Revocation and the device ceiling cannot be enforced offline, so the app
     asks. Forgiving by design: a failed check does nothing at all, and only an
     explicit revoked answer clears the key. Someone at sea for three weeks
     does not lose their app, and a server outage does not lock out everyone at
     once. */
  A.Bus.on('route', function () {
    if (!L.dueForCheck()) return;
    var c = L.claims();
    if (!c) return;
    post('/api/check', { keyId: c.id, deviceId: deviceId(), label: deviceLabel() })
      .then(function (r) {
        L.markChecked();
        if (r && r.valid === false && r.reason === 'revoked') {
          L.clear();
          A.toast('This licence has been revoked.');
        }
      })
      .catch(function () { /* offline. Nothing happens, which is the point. */ });
  });

  /* ══ THE GATE ══════════════════════════════════════════════════════════
     A locked route does not bounce silently to the Console. Being dumped
     somewhere else with no explanation reads as the app malfunctioning, and it
     teaches nothing about why. The page instead says what is behind the lock,
     what it costs, and offers the two ways forward.

     It replaces the CONTENT of the page, not the navigation: the tab bar and
     the back arrow keep working, so someone who lands here by accident is not
     trapped and can carry on using the parts that are open. */
  function lockedScreen(host, routeName) {
    A.setTitle('Locked', { back: true });

    var card = A.UI.card();
    card.appendChild(A.el('div', {
      html: Icons.svg('lock'),
      style: { color: 'var(--acc)', display: 'flex', justifyContent: 'center',
               marginBottom: '10px' }
    }));
    card.appendChild(A.el('div', {
      text: 'This needs a licence',
      style: { textAlign: 'center', fontSize: '1.125rem', fontWeight: '650' }
    }));
    card.appendChild(A.el('p', {
      style: { margin: '10px 0 0', lineHeight: '1.6', color: 'var(--text-2)',
               textAlign: 'center' },
      text: 'The calculator and the converter are open and always will be. ' +
            'The catalogue, the maps, the navigation, the rangefinder and the ' +
            'radio tools are part of the licensed app.'
    }));
    card.appendChild(A.el('button.btn.block', {
      html: Icons.svg('money') + ' See what it costs',
      style: { marginTop: '14px' },
      onclick: function () { A.Router.go('activate'); }
    }));
    host.appendChild(card);

    host.appendChild(A.UI.note(
      'One payment, no subscription, and the key is yours for life across every ' +
      'future update and up to six devices.'));

    /* what IS open, so this is a signpost and not a dead end */
    host.appendChild(A.UI.section('Open without a key'));
    var g = A.el('.tiles');
    [['calc', 'Calculator', 'calc'], ['convert', 'Converter', 'convert']].forEach(function (t) {
      var tile = A.el('button.tile', {
        onclick: function () { A.haptic(); A.Router.go(t[0]); }
      });
      tile.appendChild(A.el('span.tile-ic', { html: Icons.svg(t[2]) }));
      var mid = A.el('.tile-mid');
      mid.appendChild(A.el('.tile-t', { text: t[1] }));
      tile.appendChild(mid);
      g.appendChild(tile);
    });
    host.appendChild(g);
  }

  /* Wrap every registered view once. Doing it here rather than inside each
     view means a page added later is gated by default: forgetting to add a
     check is the failure mode that matters, and it cannot happen if no view
     has to remember to do anything. */
  (function installGate() {
    var reg = A.Router.register;
    var wrapped = {};

    function wrap(name, view) {
      if (!view || wrapped[name]) return view;
      wrapped[name] = true;
      var inner = view.render;
      view.render = function (host, params) {
        if (!L.routeAllowed(name)) return lockedScreen(host, name);
        return inner.call(this, host, params);
      };
      return view;
    }

    /* views registered before this file loaded */
    ['speed', 'map', 'field', 'range', 'rangemap', 'compass', 'country', 'mountain',
     'flash', 'graph', 'solver', 'stats', 'ratio', 'shadow'].forEach(function (n) {
      wrap(n, A.Router.get(n));
    });

    /* and any registered after it */
    A.Router.register = function (name, view) {
      return reg.call(A.Router, name, wrap(name, view));
    };
  })();

  global.ArtActivate = { deviceId: deviceId, lockedScreen: lockedScreen };

})(window);
