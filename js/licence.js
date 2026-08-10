/*
 * Artemidos - licence key verification
 * Copyright (c) 2026 Artemidos. All rights reserved.
 *
 * ══ WHAT THIS CAN AND CANNOT DO ═══════════════════════════════════════════
 *
 * This verifies that a key was issued by us. It does that properly: the key
 * carries an ECDSA P-256 signature over its own contents, the public half is
 * compiled into the app, and verification happens on the device with no
 * network. A forged key cannot be produced without the private key, which
 * lives on the server and nowhere else.
 *
 * It does NOT stop someone deleting the check. Artemidos is JavaScript inside
 * a WebView, shipped as a sideload APK. Anyone can unzip it, edit this file,
 * repack and redistribute. No amount of cleverness in this file changes that,
 * and pretending otherwise leads to elaborate schemes that cost weeks and are
 * defeated in minutes.
 *
 * The measure that actually resists patching is elsewhere: premium content is
 * encrypted with a key derived from the licence, so removing this check yields
 * an app with nothing in it. This file is the gate; that is the lock. Treat
 * this as the polite request and that as the enforcement.
 *
 * ══ WHY P-256 AND NOT ED25519 ═════════════════════════════════════════════
 *
 * Ed25519 is the better algorithm and it is what I would choose on a server.
 * WebCrypto only gained it in Chrome 137, and Android WebView versions lag on
 * devices that never update. P-256 has been in every WebView for a decade, has
 * the same 64-byte signature, and is not the weak link in a scheme whose real
 * weakness is that the check can be deleted.
 */
(function (global) {
  'use strict';

  var L = {};
  global.ArtLicence = L;

  var KEY_STORE   = 'lic.key';        /* the key string, as issued */
  var CLAIMS_STORE = 'lic.claims';    /* what it said, once verified */
  var CHECK_STORE = 'lic.lastCheck';  /* epoch ms of the last server check */

  /* The public half of the issuing key. The private half never leaves the
     server and never enters this repository. Replaced at release by
     scripts/build-flavour.js reading it from the server's published copy. */
  var PUBLIC_KEY_JWK = (global.ART_BUILD && global.ART_BUILD.licencePublicKey) || null;

  var subtle = (global.crypto && global.crypto.subtle) || null;

  /* ── state, in memory ── */
  var claims = null;      /* verified payload, or null */
  var verified = false;
  /* Verifying a stored key is asynchronous, and the router paints the first
     screen synchronously at boot. Until that verify has finished, the app does
     not know whether it is licensed - so it must not lock anything. Otherwise
     every start flashes the locked screen at a paying user for a moment before
     correcting itself, which reads as the app breaking and then recovering. */
  var ready = false;

  /* ══ does this build even ask? ═════════════════════════════════════════
     Two builds ship from one source. The keyless one is for the author and
     lives only in the private repository; the keyed one is what is published.
     The difference is a single flag written at build time, so the two cannot
     drift apart in behaviour the way two source trees would. */
  L.required = function () {
    return !!(global.ART_BUILD && global.ART_BUILD.requiresKey);
  };

  /* ══ the key format ════════════════════════════════════════════════════
     ARTM1.<payload>.<signature>, both base64url.

     The payload is compact JSON, because it has to survive being emailed,
     pasted and occasionally read aloud:
       v   format version
       id  key id, for support and revocation
       e   first 16 hex of SHA-256 of the lowercased owner email. Enough to
           show "this key belongs to the address ending ...", not enough to
           recover the address from a stolen key.
       t   issued, epoch DAYS. Days not seconds: it is four characters shorter
           and nothing here needs the hour.
       d   device slots
       k   kind: 'p' purchased, 'g' gift

     No expiry field. The keys are lifetime and adding a field for something
     that will never be set invites it being set by mistake later. */
  function b64urlToBytes(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }
  function bytesToB64url(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /* People retype keys. They also read them off a phone screen onto another
     phone. So the reader is generous: case is preserved (base64url is case
     sensitive and must be), but spaces, line breaks and the separators a mail
     client might insert are stripped before parsing. */
  function normalise(key) {
    return String(key || '').replace(/[\s ]+/g, '').trim();
  }

  L.parse = function (key) {
    var k = normalise(key);
    var m = /^ARTM1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(k);
    if (!m) return null;
    var payloadBytes, obj;
    try {
      payloadBytes = b64urlToBytes(m[1]);
      obj = JSON.parse(new TextDecoder().decode(payloadBytes));
    } catch (e) { return null; }
    if (!obj || obj.v !== 1) return null;
    return { key: k, payloadB64: m[1], payload: payloadBytes,
             sig: b64urlToBytes(m[2]), claims: obj };
  };

  /* ══ verification ══════════════════════════════════════════════════════
     The signature covers the payload bytes exactly as they appear in the key,
     not a re-serialisation of the parsed object. Re-serialising would make
     verification depend on this file and the server agreeing on key order and
     whitespace forever, which is the kind of thing that breaks silently two
     years later when someone reformats a struct. */
  L.verify = function (key) {
    if (!subtle) return Promise.resolve(null);
    if (!PUBLIC_KEY_JWK) return Promise.resolve(null);
    var p = L.parse(key);
    if (!p) return Promise.resolve(null);
    return subtle.importKey('jwk', PUBLIC_KEY_JWK,
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
      .then(function (pub) {
        return subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, p.sig, p.payload);
      })
      .then(function (ok) { return ok ? p.claims : null; })
      .catch(function () { return null; });
  };

  /* ══ activation ════════════════════════════════════════════════════════ */

  L.activate = function (key) {
    return L.verify(key).then(function (c) {
      if (!c) return null;
      ready = true;
      A.store.set(KEY_STORE, normalise(key));
      A.store.set(CLAIMS_STORE, c);
      claims = c; verified = true;
      A.Bus.emit('licence', c);
      return c;
    });
  };

  /* Called once at start. The stored key is RE-VERIFIED rather than trusted,
     because the store is ordinary localStorage: writing a claims object into
     it by hand would otherwise be a complete bypass, and that is a bypass
     available without unpacking the APK at all. */
  L.load = function () {
    if (!L.required()) { verified = true; ready = true; return Promise.resolve(true); }
    var k = A.store.get(KEY_STORE, null);
    if (!k) { verified = false; claims = null; ready = true; return Promise.resolve(false); }
    return L.verify(k).then(function (c) {
      if (!c) {
        /* a stored key that no longer verifies is a tampered or corrupted one */
        A.store.del(KEY_STORE);
        A.store.del(CLAIMS_STORE);
        claims = null; verified = false;
        ready = true;
        return false;
      }
      claims = c; verified = true; ready = true;
      return true;
    });
  };

  L.ready = function () { return ready; };

  L.clear = function () {
    ready = true;
    A.store.del(KEY_STORE);
    A.store.del(CLAIMS_STORE);
    A.store.del(CHECK_STORE);
    claims = null; verified = false;
    A.Bus.emit('licence', null);
  };

  L.active   = function () { return !L.required() || verified; };
  L.claims   = function () { return claims; };
  L.key      = function () { return A.store.get(KEY_STORE, null); };
  L.keyId    = function () { return claims && claims.id; };
  L.isGift   = function () { return !!(claims && claims.k === 'g'); };
  L.issued   = function () {
    if (!claims || !claims.t) return null;
    return new Date(claims.t * 86400000);
  };

  /* ══ WHAT THE FREE APP CAN DO ══════════════════════════════════════════
     Named here rather than scattered through the app, so the answer to "is
     this locked" is in one place and can be read in one sitting.

     The free tier is a SALES tool, not a protection measure, and it is worth
     being clear-eyed about that: the catalogue ships inside the APK and can
     be read straight out of the file whether or not the interface draws it.
     Locking it does not protect it. What it does is show someone what they
     would be buying, which is the only honest reason to do it.

     So: the calculator and the converter work completely and without nagging,
     because an app worth passing on spreads and an app that nags gets deleted.
     Everything else shows what it is and says what it costs. */
  var FREE_ROUTES = { console: 1, home: 1, calc: 1, convert: 1,
                      settings: 1, about: 1, guide: 1, apps: 1,
                      network: 1, activate: 1 };

  /* how many entries of a catalogue list the free app shows */
  L.FREE_PREVIEW = 4;

  L.routeAllowed = function (name) {
    if (!ready) return true;      /* still checking: lock nothing */
    if (L.active()) return true;
    return !!FREE_ROUTES[name];
  };

  /* Recon lists show the first few and count the rest. The COUNT is the part
     that sells: "4 of 66" is an argument, a list that simply stops is a bug. */
  L.previewSlice = function (list) {
    if (!ready || L.active()) return { shown: list, hidden: 0 };
    return { shown: list.slice(0, L.FREE_PREVIEW),
             hidden: Math.max(0, list.length - L.FREE_PREVIEW) };
  };

  /* ══ periodic revalidation ═════════════════════════════════════════════
     Offline verification proves a key is GENUINE. It cannot prove it has not
     been revoked, or that it is not on forty phones. Only the server knows
     that, so the app checks in.

     Deliberately forgiving: a failed check does nothing at all. Someone on a
     boat for three weeks does not lose their app, and a server outage does not
     lock out every customer at once. Only an explicit, signed revocation from
     the server clears a key. The check is a way to learn about revocation, not
     a heartbeat the licence depends on. */
  L.CHECK_EVERY_MS = 7 * 86400000;

  L.dueForCheck = function () {
    if (!L.required() || !verified) return false;
    var last = A.store.get(CHECK_STORE, 0) || 0;
    return (Date.now() - last) > L.CHECK_EVERY_MS;
  };
  L.markChecked = function () { A.store.set(CHECK_STORE, Date.now()); };

})(window);
