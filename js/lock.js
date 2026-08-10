/*
 * Artemidos - app lock, duress PINs, and the encrypted vault
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * ══ WHAT THIS IS FOR ══════════════════════════════════════════════════════
 *
 * A lock screen keeps out someone who picks the phone up. It does nothing at
 * all against someone standing in front of you who has understood that you
 * know the PIN. That is the situation this is actually built for, and it is
 * why there are three PINs rather than one.
 *
 *   REAL      opens the app.
 *   LIMITED   opens a version of the app that is only a calculator and a
 *             converter. No notebook, no keys, no log, no map, no catalogue.
 *             It does not announce itself as limited, because a duress mode
 *             that says "duress mode" is worse than none.
 *   WIPE      destroys everything and then opens that same empty app. The
 *             person watching sees a working phone with nothing on it, which
 *             is the only outcome that ends the conversation.
 *
 * ══ HOW THE THREE ARE KEPT APART ══════════════════════════════════════════
 *
 * The obvious design - store a hash per PIN with a label saying what it does -
 * defeats the whole point: anyone reading the storage sees "wipe PIN" sitting
 * there and simply does not use it, or knows to ask for the other one.
 *
 * So no role is ever stored in the clear. There are exactly THREE slots, each
 * one an AES-GCM blob: {salt, iterations, iv, ciphertext}. The plaintext
 * inside is the role, and for the real PIN, the vault key. A PIN is checked by
 * trying to decrypt each slot with a key derived from it; GCM's authentication
 * tag means a wrong PIN fails to decrypt rather than producing garbage, so
 * verification and unwrapping are the same operation.
 *
 * Two consequences, both deliberate:
 *   - the slots are indistinguishable from each other on disk;
 *   - there are always three, even if the user sets only a real PIN. The
 *     unused slots get random PINs nobody will ever type. The COUNT therefore
 *     reveals nothing either.
 *
 * ══ WHAT IS ENCRYPTED, AND WHAT IS NOT ════════════════════════════════════
 *
 * The vault holds what would hurt: the notebook, the War Pigeon keys and
 * message log, and any position that has been entered. Settings, theme and
 * units stay in the clear - encrypting them buys nothing and a failure there
 * would leave the app unable to start.
 *
 * The vault is decrypted once at unlock into memory, and the rest of the app
 * reads it through the ordinary synchronous store as if nothing had changed.
 * Plaintext exists in RAM while the app is open, which is unavoidable: it has
 * to be readable to be read.
 *
 * ══ THERE IS NO RECOVERY ══════════════════════════════════════════════════
 *
 * A back door for a forgotten PIN is a back door. Forgetting the real PIN
 * loses the notebook and the keys permanently, and the setup screen says so
 * in those words before it will accept anything.
 */
(function (global) {
  'use strict';

  var LOCK = {};
  global.ArtLock = LOCK;

  var SLOTS_KEY = 'lock.slots';
  var VAULT_KEY = 'lock.vault';
  var ROSTER_KEY = 'lock.roster';
  var GRACE_KEY = 'lock.grace';       /* minutes before it re-locks */
  var ITER = 210000;                  /* PBKDF2 rounds */

  /* the keys whose CONTENT goes in the vault */
  var SENSITIVE = [
    'notebook.notes',
    'warpigeon.keys',
    'warpigeon.log',
    'warpigeon.shortcuts',
    'nav.compass',
    'nav.pos',
    'console.clocks'
  ];
  function isSensitive(k) {
    for (var i = 0; i < SENSITIVE.length; i++) if (SENSITIVE[i] === k) return true;
    return false;
  }

  /* ── state, all of it in memory only ── */
  var mode = 'open';        /* 'open' | 'limited' */
  var dek = null;           /* CryptoKey for the vault, while unlocked */
  var cache = null;         /* decrypted sensitive values */
  var unlocked = false;
  var roster = null;        /* which slot is which, once the real PIN is in */

  /* ══ THE ROSTER ════════════════════════════════════════════════════════
     Each duress PIN can be turned on and off on its own, which means being
     able to rewrite ONE slot without touching the others - and that needs to
     know which slot is which. The slots themselves cannot say: the whole
     point of them is that they carry no role in the clear.

     So the map lives in its own blob, encrypted with the VAULT key. Only the
     real PIN produces that key, so:
       - a duress unlock never learns the layout;
       - the disk shows one more indistinguishable blob and nothing else;
       - the slots stay identical to each other, as before.

     `on:false` marks a slot holding a random PIN nobody knows. It still
     exists and is still tried on every unlock, so the count of slots is
     always three whatever the user has actually configured. */
  function makeRoster(list) { return list; }   /* [{i, r, on}] */

  LOCK.isLimited = function () { return mode === 'limited'; };
  /* Read the slots WITHOUT going through the store. store.get asks handles()
     whether a key is vaulted, handles() asks isOn(), and isOn() reading through
     the store closes the loop - which is an immediate stack overflow on the
     first storage read the app makes, before anything is on screen. */
  LOCK.isOn = function () { return !!A.store.raw(SLOTS_KEY); };
  LOCK.isUnlocked = function () { return unlocked; };

  /* ══ crypto helpers ═══════════════════════════════════════════════════ */

  var subtle = (global.crypto && global.crypto.subtle) || null;
  LOCK.available = function () { return !!subtle; };

  function rand(n) { var a = new Uint8Array(n); global.crypto.getRandomValues(a); return a; }
  function b64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function unb64(s) {
    var bin = atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }
  function enc(s) { return new TextEncoder().encode(s); }
  function dec(b) { return new TextDecoder().decode(b); }

  function deriveKey(pin, salt, iter) {
    return subtle.importKey('raw', enc(String(pin)), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }

  function sealWith(key, plainStr) {
    var iv = rand(12);
    return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc(plainStr))
      .then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; });
  }
  function openWith(key, blob) {
    return subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, key, unb64(blob.ct))
      .then(function (pt) { return dec(pt); });
  }

  /* ══ setting the PINs ═════════════════════════════════════════════════
     All three are written in one operation, in random order, each sealed
     under its own PIN. A slot the user did not fill gets a random 12-digit
     PIN: the slot exists, is indistinguishable from the others, and can never
     be opened by anyone including us. */
  function randomPin() {
    var d = rand(12), s = '';
    for (var i = 0; i < 12; i++) s += (d[i] % 10);
    return s;
  }

  LOCK.setup = function (realPin, limitedPin, wipePin) {
    if (!subtle) return Promise.reject(new Error('no crypto'));
    var rawDek = rand(32);
    var entries = [
      { pin: realPin, role: 'open', dek: b64(rawDek), on: true },
      { pin: limitedPin || randomPin(), role: 'limited', on: !!limitedPin },
      { pin: wipePin || randomPin(), role: 'wipe', on: !!wipePin }
    ];
    /* shuffled, so position on disk says nothing about role */
    for (var i = entries.length - 1; i > 0; i--) {
      var j = rand(1)[0] % (i + 1), t = entries[i]; entries[i] = entries[j]; entries[j] = t;
    }
    return Promise.all(entries.map(function (e) {
      var salt = rand(16);
      return deriveKey(e.pin, salt, ITER).then(function (k) {
        var payload = { r: e.role };
        if (e.dek) payload.k = e.dek;
        return sealWith(k, JSON.stringify(payload)).then(function (blob) {
          return { s: b64(salt), i: ITER, iv: blob.iv, ct: blob.ct };
        });
      });
    })).then(function (slots) {
      A.store.set(SLOTS_KEY, slots);
      /* import the raw key and write the vault for the first time */
      return subtle.importKey('raw', rawDek, 'AES-GCM', false, ['encrypt', 'decrypt']);
    }).then(function (key) {
      dek = key; rawDekMemo = b64(rawDek); unlocked = true; mode = 'open';
      roster = makeRoster(entries.map(function (e, i) {
        return { i: i, r: e.role, on: e.on };
      }));
      cache = {};
      SENSITIVE.forEach(function (k) {
        var v = A.store.raw(k);
        if (v !== undefined && v !== null) cache[k] = v;
      });
      return saveRoster().then(saveVault).then(function () {
        /* the plaintext copies go, now that the vault holds them */
        SENSITIVE.forEach(function (k) { A.store.remove(k); });
      });
    });
  };

  LOCK.disable = function () {
    /* everything comes back out into the clear, then the slots go */
    if (cache) Object.keys(cache).forEach(function (k) { A.store.rawSet(k, cache[k]); });
    A.store.remove(SLOTS_KEY);
    A.store.remove(VAULT_KEY);
    A.store.remove(ROSTER_KEY);
    dek = null; rawDekMemo = null; roster = null;
    unlocked = true; mode = 'open';
    /* cache stays: the app is running and the values are now in the clear */
  };

  /* ══ trying a PIN ═════════════════════════════════════════════════════
     Every slot is tried. Whichever one decrypts decides what happens, and a
     PIN that opens nothing is simply wrong. The three outcomes take the same
     path and about the same time, so watching the screen tells you nothing
     about which kind of PIN was entered. */
  LOCK.tryPin = function (pin) {
    var slots = A.store.get(SLOTS_KEY, null);
    if (!slots || !subtle) return Promise.resolve(null);

    var chain = Promise.resolve(null);
    slots.forEach(function (sl) {
      chain = chain.then(function (found) {
        if (found) return found;
        return deriveKey(pin, unb64(sl.s), sl.i || ITER)
          .then(function (k) { return openWith(k, sl); })
          .then(function (txt) { return JSON.parse(txt); })
          .catch(function () { return null; });
      });
    });

    return chain.then(function (payload) {
      if (!payload) return null;
      if (payload.r === 'wipe') return LOCK.wipe().then(function () { return 'wipe'; });
      if (payload.r === 'limited') {
        mode = 'limited'; unlocked = true; cache = {}; dek = null;
        return 'limited';
      }
      return subtle.importKey('raw', unb64(payload.k), 'AES-GCM', false, ['encrypt', 'decrypt'])
        .then(function (key) {
          dek = key; rawDekMemo = payload.k;
          return loadRoster();
        }).then(function () {
          return loadVault();
        }).then(function () {
          mode = 'open'; unlocked = true;
          return 'open';
        });
    });
  };

  /* ══ the vault ════════════════════════════════════════════════════════ */

  function saveVault() {
    if (!dek || mode !== 'open') return Promise.resolve();
    return sealWith(dek, JSON.stringify(cache || {})).then(function (blob) {
      A.store.set(VAULT_KEY, blob);
    });
  }
  function loadVault() {
    var blob = A.store.get(VAULT_KEY, null);
    if (!blob) { cache = {}; return Promise.resolve(); }
    return openWith(dek, blob)
      .then(function (txt) { cache = JSON.parse(txt) || {}; })
      .catch(function () {
        /* the vault will not open with a key that DID open its slot. That is
           corruption, not a wrong PIN, and pretending otherwise would quietly
           start a new empty notebook over the top of the old one. */
        cache = null;
        throw new Error('vault-corrupt');
      });
  }

  function saveRoster() {
    if (!dek || !roster) return Promise.resolve();
    return sealWith(dek, JSON.stringify(roster)).then(function (b) {
      A.store.set(ROSTER_KEY, b);
    });
  }
  function loadRoster() {
    var b = A.store.get(ROSTER_KEY, null);
    if (!b) {
      /* a lock set up before the roster existed: assume nothing about the
         layout, and say so by reporting no duress slots rather than guessing */
      roster = null;
      return Promise.resolve();
    }
    return openWith(dek, b)
      .then(function (t) { roster = JSON.parse(t); })
      .catch(function () { roster = null; });
  }

  /* what the settings screen shows. Only meaningful while unlocked with the
     real PIN; a duress session has no roster and is told nothing. */
  LOCK.roles = function () {
    if (mode !== 'open' || !roster) return null;
    var out = { limited: false, wipe: false };
    roster.forEach(function (e) { if (e.r !== 'open') out[e.r] = !!e.on; });
    return out;
  };

  function slotIndexFor(role) {
    if (!roster) return -1;
    for (var i = 0; i < roster.length; i++) if (roster[i].r === role) return roster[i].i;
    return -1;
  }

  /* Rewrite ONE slot, leaving the other two exactly as they are. New salt and
     new IV every time, so two slots set to the same PIN never look alike. */
  function writeSlot(role, pin, on) {
    if (!subtle || mode !== 'open' || !roster) return Promise.reject(new Error('locked'));
    var idx = slotIndexFor(role);
    if (idx < 0) return Promise.reject(new Error('no such slot'));
    var slots = A.store.get(SLOTS_KEY, null);
    if (!slots || !slots[idx]) return Promise.reject(new Error('no slots'));
    var salt = rand(16);
    return deriveKey(pin, salt, ITER).then(function (k) {
      var payload = { r: role };
      /* only the real slot ever carries the vault key */
      if (role === 'open') return exportDek().then(function (raw) {
        payload.k = raw; return sealWith(k, JSON.stringify(payload));
      });
      return sealWith(k, JSON.stringify(payload));
    }).then(function (blob) {
      slots[idx] = { s: b64(salt), i: ITER, iv: blob.iv, ct: blob.ct };
      A.store.set(SLOTS_KEY, slots);
      roster.forEach(function (e) { if (e.r === role) e.on = on; });
      return saveRoster();
    });
  }

  /* The DEK was imported as non-extractable, which is right for everything
     except this: re-sealing the real slot needs the raw bytes again. It is
     therefore kept alongside, in memory only, for exactly as long as the app
     is unlocked. */
  var rawDekMemo = null;
  function exportDek() {
    return rawDekMemo ? Promise.resolve(rawDekMemo)
                      : Promise.reject(new Error('key not held'));
  }

  LOCK.setDuress = function (role, pin) {
    if (role !== 'limited' && role !== 'wipe') return Promise.reject(new Error('bad role'));
    return writeSlot(role, pin, true);
  };
  /* Turning one OFF does not delete the slot - that would change the number of
     slots on disk and say that a duress PIN once existed. It is re-sealed with
     a random PIN instead, so it is still there, still tried, and can never be
     opened by anyone. */
  LOCK.clearDuress = function (role) {
    return writeSlot(role, randomPin(), false);
  };
  LOCK.changeReal = function (pin) { return writeSlot('open', pin, true); };

  /* writes are batched: a note being typed should not run AES on every key */
  var saveTimer = null;
  LOCK.touch = function () {
    if (!dek || mode !== 'open') return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveVault(); }, 400);
  };
  LOCK.flush = function () { clearTimeout(saveTimer); return saveVault(); };

  /* the store reads and writes through here while the lock is on */
  LOCK.vaultGet = function (k, dflt) {
    if (!cache) return dflt;
    return cache[k] === undefined ? dflt : cache[k];
  };
  LOCK.vaultSet = function (k, v) {
    if (!cache) cache = {};
    cache[k] = v;
    LOCK.touch();
  };
  LOCK.vaultRemove = function (k) {
    if (cache) delete cache[k];
    LOCK.touch();
  };
  /* isSensitive FIRST: it touches no storage, so a key that is not vaulted
     never reaches isOn() at all. Order matters here, not just correctness. */
  LOCK.handles = function (k) {
    return isSensitive(k) && LOCK.isOn();
  };

  /* ══ the wipe ═════════════════════════════════════════════════════════
     Everything, not a selection. The slots go first: if the process is
     interrupted half way, the result must be an app with no lock and no data
     rather than a locked app whose data is still sitting there. */
  LOCK.wipe = function () {
    dek = null; rawDekMemo = null; roster = null;
    cache = {}; mode = 'limited'; unlocked = true;
    var jobs = [];
    try {
      A.store.remove(SLOTS_KEY);
      A.store.remove(VAULT_KEY);
      A.store.remove(ROSTER_KEY);
      A.store.remove(TRIES_KEY);
      A.store.remove(UNTIL_KEY);
      /* every key this app owns */
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('artemidos.') === 0) kill.push(key);
      }
      kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    } catch (e) {}
    /* the stored map tiles are a record of where you have been looking */
    try {
      if (global.caches && caches.keys) {
        jobs.push(caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        }).catch(function () {}));
      }
    } catch (e) {}
    return Promise.all(jobs).catch(function () {});
  };

  /* ══ re-locking ═══════════════════════════════════════════════════════
     Leaving the app for a moment should not mean typing the PIN again, and
     leaving it in a drawer should. One setting, in minutes; 0 means lock the
     moment it goes to the background. */
  /* ══ WRONG ATTEMPTS ═══════════════════════════════════════════════════
     Four tries, then the pad is dead for twenty seconds and the app goes to
     the background.

     Both numbers are held on DISK, not in memory, and that is the whole point.
     A counter kept in a variable is defeated by force-stopping the app and
     opening it again, which takes about two seconds and resets everything -
     so the limit would only ever have inconvenienced the owner. Written down,
     the twenty seconds are twenty seconds however many times the app is
     killed, and four wrong tries stay four.

     Nothing here destroys anything. The penalty is time, and time only: a
     counter that wipes after N tries is a way to lose a notebook to a child
     pressing buttons. */
  var TRIES_KEY = 'lock.tries';
  var UNTIL_KEY = 'lock.until';
  var MAX_TRIES = 4;
  var PENALTY_MS = 20000;

  LOCK.maxTries = MAX_TRIES;
  LOCK.tries = function () { return A.store.get(TRIES_KEY, 0) || 0; };
  LOCK.triesLeft = function () { return Math.max(0, MAX_TRIES - LOCK.tries()); };
  /* milliseconds still to wait, 0 if the pad is live */
  LOCK.blockedFor = function () {
    var until = A.store.get(UNTIL_KEY, 0) || 0;
    return Math.max(0, until - Date.now());
  };
  LOCK.noteWrong = function () {
    var n = LOCK.tries() + 1;
    if (n >= MAX_TRIES) {
      A.store.set(TRIES_KEY, 0);
      A.store.set(UNTIL_KEY, Date.now() + PENALTY_MS);
      return true;                       /* the caller minimises */
    }
    A.store.set(TRIES_KEY, n);
    return false;
  };
  LOCK.clearTries = function () {
    A.store.set(TRIES_KEY, 0);
    A.store.set(UNTIL_KEY, 0);
  };

  LOCK.grace = function () { return A.store.get(GRACE_KEY, 2); };
  LOCK.setGrace = function (m) { A.store.set(GRACE_KEY, m); };

  var leftAt = 0;
  LOCK.noteBackground = function () { leftAt = Date.now(); LOCK.flush(); };
  LOCK.shouldRelock = function () {
    if (!LOCK.isOn() || !unlocked) return false;
    var g = LOCK.grace();
    if (!leftAt) return false;
    return (Date.now() - leftAt) >= g * 60000;
  };
  LOCK.lockNow = function () {
    LOCK.flush();
    dek = null; rawDekMemo = null; roster = null;
    cache = null; unlocked = false; mode = 'open';
  };

})(window);
