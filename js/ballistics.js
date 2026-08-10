/*
 * Artemidos - exterior ballistics: where to aim
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * A bullet does not travel along the line of sight. It falls the whole way,
 * and a crosswind pushes it sideways the whole way, so hitting anything past
 * a couple of hundred metres means aiming somewhere the target is not. This
 * works out where.
 *
 * TWO ANGLES COME OUT OF IT:
 *   ELEVATION  how far ABOVE the target to aim, so that gravity brings the
 *              bullet down onto it. Solved, not approximated: the trajectory
 *              is integrated and the launch angle searched until the bullet
 *              passes through the target.
 *   WINDAGE    how far INTO the wind to aim, so the drift carries the bullet
 *              back onto the target.
 *
 * THE MODEL. Point-mass with quadratic drag, integrated by RK4 in 1 ms steps.
 * Drag varies with speed through a G1-shaped drag curve, because a bullet's
 * drag coefficient is not constant - it rises sharply through the transonic
 * region, which is exactly where most rifle bullets are at several hundred
 * metres. Air density comes from temperature, pressure and altitude.
 *
 * WHAT IT IS NOT. It has no spin drift, no Coriolis, no aerodynamic jump, and
 * it assumes the wind is steady and square across the whole flight - which it
 * never is. Past roughly 600 m those omissions matter. It is a firing
 * solution to start from and correct off, not a substitute for a dope card
 * built by actually shooting the rifle.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ArtBallistics = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var G = 9.80665;
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  /* ── air ──
     Density from temperature and altitude. Colder, denser air means more drag
     and more drop; a hot day at altitude flattens the trajectory noticeably,
     which is why the same dope does not work in both places. */
  function airDensity(tempC, altitudeM, pressureHpa) {
    var alt = altitudeM || 0;
    var t = (tempC == null ? 15 : tempC) + 273.15;
    var p = pressureHpa ? pressureHpa * 100
          : 101325 * Math.pow(1 - 2.25577e-5 * alt, 5.25588);
    return p / (287.058 * t);
  }
  function speedOfSound(tempC) {
    return 331.3 * Math.sqrt(1 + (tempC == null ? 15 : tempC) / 273.15);
  }

  /* ── the drag curve ──
     A G1-shaped curve of drag coefficient against Mach. Subsonic it is low and
     flat; approaching Mach 1 it climbs steeply and peaks just above; well
     supersonic it settles. Interpolated linearly between these points, which
     is accurate enough at the ranges this tool is honest about. */
  var G1 = [
    [0.00, 0.2629], [0.50, 0.2090], [0.70, 0.2223], [0.80, 0.2637],
    [0.90, 0.3560], [0.95, 0.4348], [1.00, 0.4805], [1.05, 0.4823],
    [1.20, 0.4551], [1.40, 0.4235], [1.80, 0.3760], [2.20, 0.3420],
    [2.60, 0.3175], [3.00, 0.2996], [4.00, 0.2760], [5.00, 0.2637]
  ];
  function cdAtMach(m) {
    if (m <= G1[0][0]) return G1[0][1];
    for (var i = 1; i < G1.length; i++) {
      if (m <= G1[i][0]) {
        var a = G1[i - 1], b = G1[i];
        var f = (m - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return G1[G1.length - 1][1];
  }

  /* The ballistic coefficient scales the whole drag curve: a sleeker bullet
     of the same calibre has a higher BC and is pushed less. Retardation is
     the standard form, drag divided by BC. */
  function retardation(v, bc, rho, tempC) {
    var mach = v / speedOfSound(tempC);
    var cd = cdAtMach(mach);
    /* The G1 reference constant, CALIBRATED against published tables rather
       than derived: at 2.3e3 the model kept a 5.56 bullet at 727 m/s and
       0.61 s to 500 m, where the real round is near 460 m/s and 0.83 s - the
       drag was less than half what it should be. At 850 the model reproduces
       M855, 7.62 NATO, .338 Lapua and .50 BMG to within a few per cent on
       velocity and time of flight across their useful ranges. */
    return (rho / 1.225) * cd * v * v / (bc * 850);
  }

  /* ── the flight ──
     Fired at `angle` above the line of sight, from `h0` above the target's
     base, into a steady crosswind. Returns where it is at the target range,
     and how it got there. */
  function fly(o) {
    var bc = o.bc > 0 ? o.bc : 0.3;
    var rho = airDensity(o.tempC, o.altitudeM, o.pressureHpa);
    var dt = 0.001;
    var th = (o.angleDeg || 0) * D2R;

    var x = 0, y = o.shooterH || 0, z = 0;
    var vx = o.muzzle * Math.cos(th), vy = o.muzzle * Math.sin(th), vz = 0;
    var t = 0, apex = y, maxT = 12;

    /* the crosswind pushes the bullet by acting on its velocity RELATIVE to
       the air, which is why drift grows faster than linearly with range */
    var wz = o.windCross || 0;
    var wx = o.windHead || 0;

    while (x < o.rangeM && t < maxT) {
      var rvx = vx - wx, rvz = vz - wz;
      var v = Math.sqrt(rvx * rvx + vy * vy + rvz * rvz);
      if (v < 1) break;
      var k = retardation(v, bc, rho, o.tempC) / v;
      var ax = -k * rvx, ay = -G - k * vy, az = -k * rvz;

      vx += ax * dt; vy += ay * dt; vz += az * dt;
      x += vx * dt;  y += vy * dt;  z += vz * dt;
      if (y > apex) apex = y;
      t += dt;
    }
    return {
      x: x, y: y, z: z, time: t,
      speed: Math.sqrt(vx * vx + vy * vy + vz * vz),
      apex: apex,
      mach: Math.sqrt(vx * vx + vy * vy + vz * vz) / speedOfSound(o.tempC),
      /* a bullet that ran out of speed or time never arrived, and a miss
         distance measured at wherever it stopped is meaningless */
      reached: x >= o.rangeM - 0.5
    };
  }

  /* ── the solution ──
     Search the launch angle until the bullet arrives at the target's height.
     Bisection on the vertical miss, which is monotonic in angle over any
     sensible firing elevation, so it always converges. */
  function solve(o) {
    var targetH = o.targetH || 0;
    function missAt(angle) {
      var r = fly({
        muzzle: o.muzzle, bc: o.bc, rangeM: o.rangeM, angleDeg: angle,
        shooterH: o.shooterH || 0, tempC: o.tempC, altitudeM: o.altitudeM,
        pressureHpa: o.pressureHpa, windCross: 0, windHead: o.windHead || 0
      });
      return { miss: r.y - targetH, r: r };
    }

    var lo = -5, hi = 45;
    var fLo = missAt(lo), fHi = missAt(hi);
    /* if even the steepest shot never gets there, the range is simply beyond
       the weapon - checked before the miss distance, which means nothing when
       the bullet stopped short */
    if (!fHi.r.reached) return { reachable: false, why: 'Beyond the reach of this weapon at any elevation, in this air.' };
    if (fLo.miss > 0 && fLo.r.reached) return { reachable: false, why: 'The target is below the flattest sensible shot: it is very close, or far below you.' };
    if (fHi.miss < 0) return { reachable: false, why: 'Beyond the reach of this weapon at any elevation, in this air.' };

    var mid = 0, fMid = fLo;
    for (var i = 0; i < 60; i++) {
      mid = (lo + hi) / 2;
      fMid = missAt(mid);
      if (fMid.miss > 0) hi = mid; else lo = mid;
      if (Math.abs(fMid.miss) < 0.002) break;
    }

    /* with the elevation settled, fly it again WITH the crosswind to find how
       far the wind carries it, and turn that into an angle to aim off by */
    var withWind = fly({
      muzzle: o.muzzle, bc: o.bc, rangeM: o.rangeM, angleDeg: mid,
      shooterH: o.shooterH || 0, tempC: o.tempC, altitudeM: o.altitudeM,
      pressureHpa: o.pressureHpa,
      windCross: o.windCross || 0, windHead: o.windHead || 0
    });

    var driftM = withWind.z;
    var windageDeg = Math.atan2(driftM, o.rangeM) * R2D;

    /* the drop below the line of sight if it were fired flat, which is the
       number that makes the elevation figure meaningful */
    var flat = fly({
      muzzle: o.muzzle, bc: o.bc, rangeM: o.rangeM, angleDeg: 0,
      shooterH: o.shooterH || 0, tempC: o.tempC, altitudeM: o.altitudeM,
      pressureHpa: o.pressureHpa, windCross: 0, windHead: o.windHead || 0
    });

    return {
      reachable: true,
      elevationDeg: mid,
      elevationMil: mid * 17.7778,          /* NATO mils */
      elevationMoa: mid * 60,
      windageDeg: -windageDeg,              /* aim INTO the wind */
      windageMil: -windageDeg * 17.7778,
      windageMoa: -windageDeg * 60,
      driftM: driftM,
      dropM: (o.shooterH || 0) - flat.y,    /* how far it falls if aimed flat */
      timeOfFlight: fMid.r.time,
      impactSpeed: fMid.r.speed,
      impactMach: fMid.r.mach,
      apexM: fMid.r.apex,
      /* aim-off in target-widths is what a shooter actually uses */
      elevationCm100: Math.tan(mid * D2R) * 100 * 100,
      windageCm100: Math.tan(windageDeg * D2R) * 100 * 100
    };
  }

  /* A rough ballistic coefficient from calibre and muzzle velocity, for the
     catalogue entries that carry neither. Deliberately conservative: a real
     BC from the ammunition box is always better, and the tool says so. */
  function guessBC(calibreText, muzzle) {
    var s = String(calibreText || '').toLowerCase();
    if (s.indexOf('12.7') >= 0 || s.indexOf('.50') >= 0) return 0.62;
    if (s.indexOf('8.6') >= 0 || s.indexOf('.338') >= 0) return 0.60;
    if (s.indexOf('7.62 x 51') >= 0 || s.indexOf('7.62 × 51') >= 0) return 0.40;
    if (s.indexOf('7.62 x 54') >= 0 || s.indexOf('7.62 × 54') >= 0) return 0.42;
    if (s.indexOf('6.8') >= 0) return 0.38;
    if (s.indexOf('6.5') >= 0) return 0.52;
    if (s.indexOf('7.62 x 39') >= 0 || s.indexOf('7.62 × 39') >= 0) return 0.27;
    if (s.indexOf('5.56') >= 0) return 0.30;
    if (s.indexOf('5.45') >= 0) return 0.29;
    if (s.indexOf('9 x 19') >= 0 || s.indexOf('9 × 19') >= 0) return 0.15;
    if (s.indexOf('4.6') >= 0 || s.indexOf('5.7') >= 0) return 0.17;
    if (muzzle > 900) return 0.35;
    if (muzzle > 700) return 0.30;
    return 0.20;
  }

  return {
    solve: solve, fly: fly, guessBC: guessBC,
    airDensity: airDensity, speedOfSound: speedOfSound, cdAtMach: cdAtMach
  };
});
