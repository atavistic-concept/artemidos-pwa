/*
 * Artemidos - War Pigeon modem core
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * A real OFDM modem, built the way Rattlegram (aicodix, 0BSD) builds one, and
 * the reason this file exists at all: every earlier attempt read the spectrum
 * through the browser's analyser a few dozen times a second and tried to guess
 * WHEN each symbol happened. Timing guessed from a throttled timer is wrong by
 * most of a symbol, and a modem with the wrong clock decodes nothing. This one
 * works on the raw microphone samples instead:
 *
 *   - 32 carriers packed side by side over 1000-2033 Hz transmit at once; a
 *     40 ms symbol carries 32 bits. So many tones in so narrow a band, with
 *     the data scrambling their phases, sum to a dense band of HISS rather
 *     than distinct beeps - the Rattlegram character, and the same kind of
 *     waveform. The interior runs at continuous amplitude so there is no
 *     symbol-rate flutter over the top.
 *   - Each bit is DIFFERENTIAL phase: did this carrier flip since the last
 *     symbol, or not. Loudness, speaker response, microphone gain and distance
 *     cancel out of the question entirely.
 *   - A pseudo-noise preamble opens each burst and sounds like the data - a
 *     patch of hiss, not a siren or a beep. It is found by MATCHED FILTER,
 *     correlating the samples against the known noise, which fixes the symbol
 *     clock to about a millisecond and never trips on ambient noise.
 *   - The message length is sent TWICE in a header, so the receiver knows
 *     exactly how many symbols to read. Nothing depends on detecting silence.
 *   - Hamming(7,4) with interleaving repairs what the air damages.
 *
 * Everything here is pure arithmetic on Float32Array - no audio API, no DOM -
 * so the identical code runs in the app and in the Node test bench.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WPModem = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ── the waveform ── */
  var RATE = 8000;                 /* internal processing rate */
  var T_USE = 240;                 /* useful window: 30 ms at 8 kHz */
  var T_CP = 80;                   /* cyclic prefix: 10 ms */
  var T_SYM = T_USE + T_CP;        /* 40 ms per symbol */
  /* 32 carriers packed ON the orthogonal grid (one per DFT bin, 33.3 Hz
     apart), contiguous over 1000 Hz .. 2033 Hz. That density is what makes it
     sound like Rattlegram rather than a row of beeps: enough tones side by
     side, with the data scrambling their phases every symbol, that the sum
     reads as a band of hiss, not distinct pitches. It also doubles the data
     rate over the old 16-carrier mode. 32 rather than 48 keeps enough energy
     per carrier that a weak, muffled radio link still decodes; 48 sounded a
     touch smoother but gave up too much margin on a poor link. */
  /* TWO MODES, because one waveform cannot serve both a good link and a bad
     one. FAST packs 32 carriers for speed; ROBUST uses only 8, spread wide
     across the same band, so each carrier gets four times the energy - six
     decibels, which is the difference between a link that fails seven times
     in eight and one that works. Robust costs four times the airtime.

     The receiver is told which mode by the PREAMBLE ITSELF: each mode opens
     with a different pseudo-noise burst, and the matched filter that fires
     identifies the mode. Nothing has to be agreed in advance or configured on
     both phones - send robust from one and the other simply hears it. */
  var MODES = [
    { id: 0, name: 'fast',   ncarr: 32, bin0: 30, step: 1, seed: 0x9b05688c },
    { id: 1, name: 'robust', ncarr: 8,  bin0: 30, step: 4, seed: 0x1f83d9ab }
  ];
  MODES.forEach(function (m) {
    m.carriers = [];
    for (var j = 0; j < m.ncarr; j++) m.carriers.push((m.bin0 + m.step * j) * (RATE / T_USE));
    /* starting phases, spread so the reference symbol is not an impulse */
    m.phi0 = [];
    for (var p = 0; p < m.ncarr; p++) m.phi0.push((p * 2.39996) % (2 * Math.PI));
  });
  function modeOf(id) { return MODES[id === 1 ? 1 : 0]; }

  /* the fast mode's carrier list, for the tone-by-tone diagnostic */
  var CARRIERS = MODES[0].carriers;

  /* ── the sync preamble ──
     A burst of band-limited PSEUDO-NOISE, not a chirp. The chirp swept a pure
     tone from low to high, which is precisely what a siren does, so it sounded
     like one. This instead is a fixed random-phase mix of every frequency in
     the message band: it sounds like a burst of radio hiss, indistinguishable
     in character from the data that follows, which is how Rattlegram opens.
     A noise sequence also autocorrelates to a SHARPER peak than a chirp, so
     the receiver's matched filter locks the symbol clock even more tightly.
     The waveform is defined once as a set of frequencies and fixed phases;
     transmitter and receiver both regenerate the identical signal. */
  var PRE_MS = 160;
  var PRE_LO = 900, PRE_HI = 2700;
  var PRE_N = Math.round(RATE * PRE_MS / 1000);          /* 1280 samples at 8 kHz */
  var GAP_N = Math.round(RATE * 0.02);                   /* 20 ms preamble-to-data */

  /* a tiny deterministic PRNG so the preamble phases are the same every run
     and identical on every device - the modem has no cipher of its own */
  function sfc32(a, b, c, d) {
    return function () {
      a |= 0; b |= 0; c |= 0; d |= 0;
      var t = (a + b | 0) + d | 0; d = d + 1 | 0;
      a = b ^ b >>> 9; b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11); c = c + t | 0;
      return (t >>> 0);
    };
  }

  /* one preamble per mode: same frequencies, different random phases, so the
     two are uncorrelated and the matched filter can tell them apart */
  MODES.forEach(function (m) {
    m.preFreqs = []; m.prePh = [];
    var r = sfc32(m.seed, 0x5be0cd19, 0x9b05688c, 0x1);
    for (var w = 0; w < 20; w++) r();
    var b0 = Math.round(PRE_LO * PRE_N / RATE), b1 = Math.round(PRE_HI * PRE_N / RATE);
    for (var b = b0; b <= b1; b++) {
      m.preFreqs.push(b * RATE / PRE_N);
      m.prePh.push((r() >>> 0) / 4294967296 * 2 * Math.PI);
    }
  });

  /* the preamble at any sample rate: the same continuous band-limited noise,
     so the receiver (at 8 kHz) matches what the transmitter played (at 48). */
  function preambleAt(rate, mode) {
    var m = mode || MODES[0];
    var N = Math.round(rate * PRE_MS / 1000);
    var out = new Float32Array(N), sq = 0;
    for (var n = 0; n < N; n++) {
      var t = n / rate, s = 0;
      for (var b = 0; b < m.preFreqs.length; b++) s += Math.cos(2 * Math.PI * m.preFreqs[b] * t + m.prePh[b]);
      out[n] = s; sq += s * s;
    }
    /* Raw band-limited noise peaks about four times its RMS. Normalising that
       to a 0.9 peak would leave the AVERAGE power - the energy that actually
       reaches a weak speaker and microphone - roughly nine decibels below what
       the old chirp put out, which is enough to lose the quieter-speaker
       direction of a link. Soft-clipping to about 1.5 RMS first crushes the
       crest factor, so after normalising the preamble carries far more energy
       while still sounding like a burst of hiss. */
    var rms = Math.sqrt(sq / Math.max(1, N));
    var lim = 0.9 * rms, peak = 0;
    for (var c = 0; c < N; c++) { out[c] = lim * Math.tanh(out[c] / lim); var a = Math.abs(out[c]); if (a > peak) peak = a; }
    var ramp = Math.round(rate * 0.006);
    for (var q = 0; q < N; q++) {
      var e = 1;
      if (q < ramp) e = q / ramp;
      if (q > N - ramp) e = (N - q) / ramp;
      out[q] = (peak > 0 ? out[q] / peak : 0) * e;
    }
    return out;
  }
  var GAP_MS = 600;                                      /* between repeats */


  /* ── forward error correction (Hamming(7,4) + block interleave) ── */
  function hamEnc(nib) {
    var d0 = (nib >> 3) & 1, d1 = (nib >> 2) & 1, d2 = (nib >> 1) & 1, d3 = nib & 1;
    return [d0 ^ d1 ^ d3, d0 ^ d2 ^ d3, d0, d1 ^ d2 ^ d3, d1, d2, d3];
  }
  function hamDec(b) {
    var s1 = b[0] ^ b[2] ^ b[4] ^ b[6];
    var s2 = b[1] ^ b[2] ^ b[5] ^ b[6];
    var s3 = b[3] ^ b[4] ^ b[5] ^ b[6];
    var syn = s1 + s2 * 2 + s3 * 4;
    var c = b.slice();
    if (syn > 0 && syn <= 7) c[syn - 1] ^= 1;
    return (c[2] << 3) | (c[4] << 2) | (c[5] << 1) | c[6];
  }
  function bytesToBits(bytes, ncarr) {
    var bits = [];
    bytes.forEach(function (b) {
      hamEnc((b >> 4) & 15).forEach(function (x) { bits.push(x); });
      hamEnc(b & 15).forEach(function (x) { bits.push(x); });
    });
    var rows = bits.length / 7;
    var il = [];
    for (var c = 0; c < 7; c++) for (var r = 0; r < rows; r++) il.push(bits[r * 7 + c]);
    while (il.length % ncarr) il.push(0);
    return il;
  }
  /* ── soft-decision decoding ──────────────────────────────────────────────
     The demodulator knows more than "0 or 1": the size of each measurement
     says how SURE it is. Flattening that to a hard bit before decoding throws
     the confidence away, and then the code cannot tell a weak-but-right bit
     from a confident-but-wrong one. This is the single biggest loss against
     Rattlegram, which decodes on soft values throughout.

     Here every 7-bit Hamming word is decoded by comparing the soft readings
     against ALL SIXTEEN valid code words and taking the best match, instead of
     correcting one bit by syndrome. Where syndrome decoding fixes exactly one
     error, this weighs all seven readings together, so two weak errors in a
     word are often still resolved correctly - worth roughly two decibels,
     which is a doubling of usable range for free. */
  var HAM_WORDS = [];
  (function () {
    for (var nib = 0; nib < 16; nib++) {
      /* +1 for a 0 bit, -1 for a 1 bit: the same convention the soft values use */
      HAM_WORDS.push(hamEnc(nib).map(function (b) { return b ? -1 : 1; }));
    }
  })();

  /* soft[] holds one signed number per bit: sign is the decision, magnitude is
     the confidence. Positive means 0, negative means 1. */
  function softToBytes(soft) {
    var rows = Math.floor(soft.length / 7);
    if (rows < 1) return [];
    /* undo the interleave, carrying the confidences with the bits */
    var lin = new Array(rows * 7);
    var n = 0;
    for (var c = 0; c < 7; c++) for (var r = 0; r < rows; r++) { if (n < soft.length) lin[r * 7 + c] = soft[n++]; }
    var nibs = [];
    for (var i = 0; i + 7 <= lin.length; i += 7) {
      var best = -Infinity, bestNib = 0;
      for (var w = 0; w < 16; w++) {
        var acc = 0, cw = HAM_WORDS[w];
        for (var b = 0; b < 7; b++) acc += (lin[i + b] || 0) * cw[b];
        if (acc > best) { best = acc; bestNib = w; }
      }
      nibs.push(bestNib);
    }
    var out = [];
    for (var k = 0; k + 1 < nibs.length; k += 2) out.push((nibs[k] << 4) | nibs[k + 1]);
    return out;
  }

  /* hard-bit entry point, kept for the tests and for the header */
  function bitsToBytes(il) {
    return softToBytes(il.map(function (b) { return b ? -1 : 1; }));
  }

  /* the header: one byte (total byte count), Hamming-coded to 14 bits + 2 pad */
  function headerBits(count) {
    var b = hamEnc((count >> 4) & 15).concat(hamEnc(count & 15));
    b.push(0, 0);
    return b;
  }
  /* one 7-bit Hamming word, decoded softly: best match of the sixteen */
  function softWord(soft, at) {
    var best = -Infinity, bestNib = 0;
    for (var w = 0; w < 16; w++) {
      var acc = 0, cw = HAM_WORDS[w];
      for (var b = 0; b < 7; b++) acc += (soft[at + b] || 0) * cw[b];
      if (acc > best) { best = acc; bestNib = w; }
    }
    return bestNib;
  }

  /* The header decodes softly too - it is the one part that, if misread,
     throws away an otherwise perfect message. It is NOT interleaved, so it is
     read as two plain words rather than through the de-interleaver. */
  function headerByteSoft(soft) {
    return (softWord(soft, 0) << 4) | softWord(soft, 7);
  }
  function headerByte(bits) {
    return (hamDec(bits.slice(0, 7)) << 4) | hamDec(bits.slice(7, 14));
  }

  function dataSymbolCount(nBytes, ncarr) {
    var bits = nBytes * 14;
    return Math.ceil(bits / ncarr);
  }

  /* The header is 16 bits, which is MORE than a robust symbol carries (8), so
     it is chunked across as many symbols as the mode needs rather than assumed
     to fit in one. Getting this wrong made robust mode decode nothing at all:
     the length overflowed its symbol and every frame was discarded. */
  function headerSymCount(ncarr) { return Math.ceil(16 / ncarr); }
  function headerSyms(count, ncarr) {
    var b = headerBits(count), outS = [];
    for (var i = 0; i < b.length; i += ncarr) {
      var chunk = b.slice(i, i + ncarr);
      while (chunk.length < ncarr) chunk.push(0);
      outS.push(chunk);
    }
    return outS;
  }

  /* ── transmitter: bytes -> Float32Array at the device's sample rate ── */
  function synthesize(bytes, outRate, nRepeats, modeId) {
    nRepeats = nRepeats || 1;
    var MD = modeOf(modeId);
    var NC = MD.ncarr;
    var bits = bytesToBits(bytes, NC);
    /* the header, sent twice so a damaged copy has a spare */
    var symBits = headerSyms(bytes.length, NC).concat(headerSyms(bytes.length, NC));
    for (var s = 0; s < bits.length / NC; s++) symBits.push(bits.slice(s * NC, (s + 1) * NC));

    var pre = preambleAt(outRate, MD);
    var chirpN = pre.length;
    var gapN = Math.round(outRate * 0.02);
    var cpN = Math.round(outRate * (T_CP / RATE));
    var useN = Math.round(outRate * (T_USE / RATE));
    var symN = cpN + useN;
    var rampN = Math.round(outRate * 0.004);
    /* symbols: 1 reference + the coded ones */
    var oneLen = chirpN + gapN + (1 + symBits.length) * symN;
    var gapRepN = Math.round(outRate * GAP_MS / 1000);
    var total = oneLen * nRepeats + gapRepN * (nRepeats - 1) + Math.round(outRate * 0.05);
    var out = new Float32Array(total);

    var pos = 0;
    for (var rep = 0; rep < nRepeats; rep++) {
      /* the pseudo-noise preamble, written at FULL amplitude and never
         rescaled with the data. It already carries its own end ramps, so it
         is copied in as-is. It sounds like a short burst of hiss, not a
         siren, and it is the anchor the receiver's matched filter locks to. */
      for (var n = 0; n < chirpN; n++) out[pos + n] = 0.9 * pre[n];
      pos += chirpN + gapN;
      var dataFrom = pos;

      /* symbols. Phase is DIFFERENTIAL: each carrier keeps its running phase
         and a 1-bit flips it by pi. The receiver compares each symbol with the
         one before, so only the flip carries meaning. */
      var phi = MD.phi0.slice();
      for (var si = -1; si < symBits.length; si++) {
        if (si >= 0) {
          var sb = symBits[si];
          for (var c = 0; c < NC; c++) { if (sb[c]) phi[c] = (phi[c] + Math.PI) % (2 * Math.PI); }
        }
        /* Only the FIRST symbol fades in and the LAST fades out; the interior
           runs at full amplitude with no per-symbol dip. The old code ramped
           every symbol's edges, which put a 25 Hz amplitude flutter over the
           whole burst - the "beep" rhythm you could hear under the hiss.
           Removing it leaves one continuous band of noise, which is the
           Rattlegram character. The receiver reads a window well inside each
           symbol, so the small boundary steps do not affect decoding. */
        var first = (si === -1), last = (si === symBits.length - 1);
        for (var m = 0; m < symN; m++) {
          var tau = (m - cpN) / outRate;
          var v = 0;
          for (var c2 = 0; c2 < NC; c2++) v += Math.cos(2 * Math.PI * MD.carriers[c2] * tau + phi[c2]);
          var env2 = 1;
          if (first && m < rampN) env2 = m / rampN;
          if (last && m > symN - rampN) env2 = (symN - m) / rampN;
          out[pos + m] = v * env2;
        }
        pos += symN;
      }
      /* Level the DATA section on its own. The carriers stack into
         rare tall peaks (a crest many times the average), so normalising by
         the raw peak makes the AVERAGE - which is what carries the bits - far
         too quiet. Soft-clipping the peaks first and then normalising lifts
         every carrier; the clipping distortion spreads across the band and
         DBPSK shrugs it off. The clip is tight (1.8 sigma) BECAUSE there are
         so many carriers now: with the energy split 48 ways, per-carrier SNR
         is what limits a weak link, and clipping hard buys it back. */
      var sd = 0, cnt = 0;
      for (var d = dataFrom; d < pos; d++) { sd += out[d] * out[d]; cnt++; }
      sd = Math.sqrt(sd / Math.max(1, cnt));
      var lim = 0.9 * sd;
      var dpk = 0;
      for (var d2 = dataFrom; d2 < pos; d2++) {
        var v2 = out[d2];
        out[d2] = v2 = lim * Math.tanh(v2 / lim);
        var a2 = Math.abs(v2); if (a2 > dpk) dpk = a2;
      }
      if (dpk > 0) { var g2 = 0.9 / dpk; for (var d3 = dataFrom; d3 < pos; d3++) out[d3] *= g2; }

      pos += (rep < nRepeats - 1) ? gapRepN : 0;
    }
    return out;
  }

  function durationSec(nBytes, nRepeats, modeId) {
    nRepeats = nRepeats || 1;
    var syms = 1 + 2 + dataSymbolCount(nBytes, modeOf(modeId).ncarr);
    var one = PRE_MS / 1000 + 0.02 + syms * (T_SYM / RATE);
    return one * nRepeats + (GAP_MS / 1000) * (nRepeats - 1) + 0.05;
  }

  /* ── receiver ── */
  function RX(inputRate) {
    var self = this;
    self.inputRate = inputRate || 48000;

    /* resampler to 8 kHz: linear interpolation with a one-sample memory so
       phase stays CONTINUOUS across block boundaries - a 20 microsecond jump
       per block is a third of a radian at the top carrier, felt every symbol */
    var step = self.inputRate / RATE;
    var rsPhase = 0, rsLast = 0, rsPrev = 0;

    /* the sample buffer at 8 kHz. Grows as audio arrives, trimmed from the
       front as the hunt moves past; absOff tracks how many were dropped. */
    var buf = [];
    var absOff = 0;
    var MAXBUF = RATE * 30;

    /* The preamble template for the matched filter, generated at 8 kHz and
       passed through THE SAME two-tap smoothing the resampler applies to the
       microphone, so the filter matches the signal as the receiver actually
       sees it. Band-limited noise correlates to a sharp, narrow peak, which
       is what fixes the symbol clock. */
    var RXM = MODES.map(function (md) {
      var preTpl = preambleAt(RATE, md);
      var tpl = new Float32Array(PRE_N);
      var tplE = 0, tplPrev = 0;
      for (var n = 0; n < PRE_N; n++) {
        var raw = preTpl[n];
        tpl[n] = (raw + tplPrev) * 0.5;
        tplPrev = raw;
        tplE += tpl[n] * tpl[n];
      }
      /* DFT twiddle tables: [carrier][sample] over the useful window */
      var twCos = [], twSin = [];
      for (var c = 0; c < md.ncarr; c++) {
        var bc = new Float32Array(T_USE), bs = new Float32Array(T_USE);
        var bin = md.bin0 + md.step * c;
        for (var q = 0; q < T_USE; q++) {
          var ang = 2 * Math.PI * bin * q / T_USE;
          bc[q] = Math.cos(ang); bs[q] = Math.sin(ang);
        }
        twCos.push(bc); twSin.push(bs);
      }
      return { md: md, tpl: tpl, tplE: tplE, twCos: twCos, twSin: twSin };
    });
    var cur = RXM[0];               /* the mode currently locked */

    var state = 'hunt';
    var huntPos = 0;               /* absolute sample index to search from */
    var symStart = 0;              /* absolute index of the reference symbol */
    var prevRe = null, prevIm = null;
    var symIdx = 0;                /* next symbol to demod (0 = reference) */
    var hdr = [];                  /* the two header candidates */
    var hdrBits = [];              /* header bits of the copy being read */
    var msgBits = [];
    var needSyms = 0;              /* total symbols incl ref+headers, once known */
    var out = [];                  /* decoded byte-array candidates */
    /* soft copies of recent frames, keyed by length, for combining repeats */
    var combo = {}, comboAt = 0;
    self.rms = 0;
    self.lockCount = 0;

    function rel(abs) { return abs - absOff; }

    function demodSymbol(absStart) {
      var s = rel(absStart) + T_CP - 16;
      var NC = cur.md.ncarr;
      var re = new Float32Array(NC), im = new Float32Array(NC);
      for (var c = 0; c < NC; c++) {
        var sr = 0, si = 0, bc = cur.twCos[c], bs = cur.twSin[c];
        for (var m = 0; m < T_USE; m++) { var x = buf[s + m]; sr += x * bc[m]; si -= x * bs[m]; }
        re[c] = sr; im[c] = si;
      }
      return { re: re, im: im };
    }

    /* Returns one SOFT value per carrier rather than a hard bit: sign is the
       decision (positive = 0, negative = 1), magnitude is the confidence.
       Each is normalised by the amplitudes it came from, so a loud symbol and
       a quiet one contribute on the same scale and a fading carrier cannot
       shout down a steady one. */
    function softFrom(z) {
      var soft = [];
      for (var c = 0; c < cur.md.ncarr; c++) {
        /* the dot product of this symbol with the previous: negative = flipped */
        var dot = z.re[c] * prevRe[c] + z.im[c] * prevIm[c];
        var mag = Math.sqrt((z.re[c] * z.re[c] + z.im[c] * z.im[c]) *
                            (prevRe[c] * prevRe[c] + prevIm[c] * prevIm[c]));
        soft.push(mag > 1e-9 ? dot / mag : 0);
      }
      prevRe = z.re; prevIm = z.im;
      return soft;
    }

    function unlock(fromAbs) {
      /* copies belong to the same transmission only if they arrive close
         together; anything older is a different message and must not be
         stacked onto this one */
      if (comboAt && Date.now() - comboAt > 8000) { combo = {}; comboAt = 0; }
      state = 'hunt';
      huntPos = fromAbs;
      prevRe = prevIm = null;
      symIdx = 0; hdr = []; hdrBits = []; msgBits = []; needSyms = 0;
    }

    self.feed = function (samples, sampleRate) {
      if (sampleRate && sampleRate !== self.inputRate) { self.inputRate = sampleRate; step = sampleRate / RATE; }
      /* step through the input at inputRate/8000; index -1 is the last sample
         of the previous block, which keeps the interpolation continuous */
      var i = 0, e = 0;
      var pos = rsPhase;
      while (pos + 1 < samples.length) {
        var idx = Math.floor(pos);
        var frac = pos - idx;
        var s0 = idx < 0 ? rsLast : samples[idx];
        var s1 = samples[idx + 1];
        var v = s0 * (1 - frac) + s1 * frac;
        /* light smoothing as a crude anti-alias */
        var y = (v + rsPrev) * 0.5;
        rsPrev = v;
        buf.push(y);
        e += y * y; i++;
        pos += step;
      }
      rsPhase = pos - samples.length;
      rsLast = samples[samples.length - 1];
      if (i > 0) self.rms = Math.sqrt(e / i);

      if (buf.length > MAXBUF) {
        /* never trim away a frame that is still being demodulated */
        var keepAbs = state === 'locked' ? Math.min(symStart, huntPos) : huntPos;
        var drop = Math.min(buf.length - MAXBUF, Math.max(0, rel(keepAbs)));
        if (drop > 0) { buf.splice(0, drop); absOff += drop; }
        if (huntPos < absOff) huntPos = absOff;
      }
    };

    /* prefix energy for correlation normalisation, rebuilt lazily per poll */
    function process() {
      var guard = 0;
      while (guard++ < 10000) {
        if (state === 'hunt') {
          var last = absOff + buf.length;
          var from = Math.max(huntPos, absOff);
          var end = last - PRE_N - GAP_N - T_SYM;
          if (from >= end) return;
          /* Correlate against BOTH mode preambles at once. Whichever fires
             tells the receiver which waveform is on the air, so a robust
             transmission is understood without either phone being told. */
          var found = -1, foundMode = null;
          for (var s = rel(from); s + PRE_N < buf.length && found < 0; s += 2) {
            for (var mi = 0; mi < RXM.length; mi++) {
              var R = RXM[mi];
              var tplE2 = R.tplE * 0.5;                    /* template energy, strided */
              var corr = 0, energy = 0;
              for (var n = 0; n < PRE_N; n += 2) {         /* stride 2: half cost */
                var x = buf[s + n];
                corr += x * R.tpl[n]; energy += x * x;
              }
              /* normalised correlation: 1.0 is a perfect match, noise near 0 */
              if (corr > 0 && corr / (Math.sqrt(energy * tplE2) + 1e-6) > 0.5) {
                /* refine at full resolution over +-4 samples */
                var best = -1, bestAt = s;
                for (var r = Math.max(0, s - 4); r <= s + 4 && r + PRE_N < buf.length; r++) {
                  var c2 = 0;
                  for (var n2 = 0; n2 < PRE_N; n2++) c2 += buf[r + n2] * R.tpl[n2];
                  if (c2 > best) { best = c2; bestAt = r; }
                }
                found = bestAt; foundMode = R;
                break;
              }
            }
          }
          if (found < 0) { huntPos = end; return; }
          cur = foundMode;
          symStart = absOff + found + PRE_N + GAP_N;
          state = 'locked';
          self.lockCount++;
          prevRe = prevIm = null;
          symIdx = 0; hdr = []; hdrBits = []; msgBits = []; needSyms = 0;
          continue;
        }

        /* locked: demod each symbol as soon as its samples are all here */
        var symAbs = symStart + symIdx * T_SYM;
        if (rel(symAbs) + T_SYM > buf.length) return;

        var z = demodSymbol(symAbs);
        if (symIdx === 0) { prevRe = z.re; prevIm = z.im; symIdx++; continue; }
        var soft = softFrom(z);

        /* the header occupies hdrSyms symbols per copy, and is sent twice, so
           it spans 2*hdrSyms symbols after the reference symbol */
        var hdrSyms = headerSymCount(cur.md.ncarr);
        if (symIdx <= 2 * hdrSyms) {
          hdrBits = hdrBits.concat(soft);
          if (symIdx % hdrSyms === 0) {
            /* one full copy is in: read it and start the next */
            var count = headerByteSoft(hdrBits);
            if (count >= 3 && count <= 202) hdr.push(count);
            hdrBits = [];
          }
          if (symIdx === 2 * hdrSyms) {
            if (!hdr.length) { unlock(symStart); continue; }   /* not ours */
            /* read enough symbols for the LARGEST candidate */
            var maxB = Math.max.apply(null, hdr);
            needSyms = 1 + 2 * hdrSyms + dataSymbolCount(maxB, cur.md.ncarr);
          }
          symIdx++; continue;
        }

        msgBits = msgBits.concat(soft);
        symIdx++;
        if (symIdx >= needSyms) {
          /* ── soft-combining across repeats ──
             When the same message is sent two or three times, the copies used
             to be decoded independently and the first clean one taken - so two
             half-ruined copies produced nothing, even though between them they
             held every bit. Adding the soft values of matching copies together
             instead averages the noise away: two copies are worth about three
             decibels, three about five. It is the cheapest gain available,
             because the transmitter is already sending the copies. */
          var seen = {};
          for (var h = 0; h < hdr.length; h++) {
            var B = hdr[h];
            if (seen[B]) continue; seen[B] = 1;

            /* exactly 14 bits per byte: the symbol padding must NOT reach the
               de-interleaver, or it changes the grid shape and scrambles all */
            var frame = msgBits.slice(0, B * 14);

            /* stack this copy onto any earlier copy of the same length */
            var acc = combo[B];
            if (acc && acc.length === frame.length) {
              for (var ci = 0; ci < frame.length; ci++) acc[ci] += frame[ci];
            } else {
              acc = frame.slice();
              combo[B] = acc;
            }
            comboAt = Date.now();

            /* offer BOTH: this copy alone, and every copy stacked. Either may
               be the one that passes the checksum. */
            out.push(softToBytes(frame).slice(0, B));
            if (acc !== frame) out.push(softToBytes(acc).slice(0, B));
          }
          unlock(symStart + needSyms * T_SYM);
          continue;
        }
      }
    }

    /* forget everything heard so far and hunt afresh - used after the phone
       has been transmitting, so its own voice cannot be mistaken for a peer */
    self.flush = function () {
      absOff += buf.length;
      buf.length = 0;
      out = [];
      combo = {}; comboAt = 0;
      unlock(absOff);
    };

    /* returns decoded byte-array candidates gathered since the last poll */
    self.poll = function () {
      process();
      var o = out; out = [];
      return o;
    };
  }

  return {
    RATE: RATE,
    MODES: MODES,
    CARRIERS: CARRIERS,
    synthesize: synthesize,
    durationSec: durationSec,
    RX: RX,
    /* shared codec, used by the tests */
    bytesToBits: bytesToBits,
    bitsToBytes: bitsToBytes
  };
});
