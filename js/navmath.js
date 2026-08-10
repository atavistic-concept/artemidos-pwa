/*
 * Artemidos - navigation mathematics
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The arithmetic behind chart work, kept apart from the screen so it can be
 * tested against worked examples rather than eyeballed. Every function here is
 * pure: numbers in, numbers out, no DOM, no storage.
 *
 * CONVENTIONS, because half the errors in navigation are sign errors:
 *   - Latitude north positive, longitude EAST positive.
 *   - Bearings and headings are degrees clockwise from north, 0 to 360.
 *   - Variation and deviation are signed: EAST positive, WEST negative.
 *     That single choice removes the mnemonics. True = Compass + Dev + Var,
 *     and Compass = True - Var - Dev. Nothing to memorise, nothing to reverse.
 *   - Distances in nautical miles unless a function says otherwise, because
 *     that is what a chart is ruled in: one minute of latitude is one mile.
 *
 * WHAT THIS IS NOT. It computes; it does not plot. The chart still holds the
 * fix, the hazards and the final judgement.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NavMath = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var R_NM = 3440.065;            /* mean earth radius in nautical miles */
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  function norm360(d) { return ((d % 360) + 360) % 360; }
  /* signed difference, -180..+180: how far to turn from a to b */
  function diff180(a, b) { var x = norm360(b - a); return x > 180 ? x - 360 : x; }

  /* ══ compass chain ═══════════════════════════════════════════════════════
     Variation is the chart's error (earth's field vs true north); deviation is
     the vessel's own error (its steel and wiring vs the earth's field). Both
     signed east-positive. */

  function compassToTrue(compass, variation, deviation) {
    return norm360(compass + (deviation || 0) + (variation || 0));
  }
  function trueToCompass(tru, variation, deviation) {
    return norm360(tru - (variation || 0) - (deviation || 0));
  }
  function compassToMagnetic(compass, deviation) { return norm360(compass + (deviation || 0)); }
  function magneticToTrue(mag, variation) { return norm360(mag + (variation || 0)); }
  function trueToMagnetic(tru, variation) { return norm360(tru - (variation || 0)); }

  /* A deviation card is a handful of measured points; between them the error
     is interpolated on the compass heading, wrapping round the top. */
  function deviationAt(card, compassHeading) {
    if (!card || !card.length) return 0;
    var h = norm360(compassHeading);
    var pts = card.slice().sort(function (a, b) { return a.hdg - b.hdg; });
    if (pts.length === 1) return pts[0].dev;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length];
      var span = norm360(b.hdg - a.hdg) || 360;
      var into = norm360(h - a.hdg);
      if (into <= span) return a.dev + (b.dev - a.dev) * (into / span);
    }
    return pts[0].dev;
  }

  /* ══ position and distance ═══════════════════════════════════════════════ */

  /* Great circle: the shortest path. Haversine, which stays accurate at the
     small distances where the law of cosines loses precision. */
  function greatCircle(lat1, lon1, lat2, lon2) {
    var p1 = lat1 * D2R, p2 = lat2 * D2R;
    var dp = (lat2 - lat1) * D2R, dl = (lon2 - lon1) * D2R;
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    var d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R_NM;
    var y = Math.sin(dl) * Math.cos(p2);
    var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return { distance: d, bearing: norm360(Math.atan2(y, x) * R2D) };
  }

  /* Rhumb line: constant bearing, the line you actually steer and the line a
     Mercator chart draws straight. Slightly longer than the great circle. */
  function rhumbLine(lat1, lon1, lat2, lon2) {
    var p1 = lat1 * D2R, p2 = lat2 * D2R;
    var dp = p2 - p1;
    var dl = (lon2 - lon1) * D2R;
    if (Math.abs(dl) > Math.PI) dl = dl > 0 ? dl - 2 * Math.PI : dl + 2 * Math.PI;
    /* the stretched latitude difference Mercator is built on */
    var dPsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
    var q = Math.abs(dPsi) > 1e-12 ? dp / dPsi : Math.cos(p1);
    var d = Math.sqrt(dp * dp + q * q * dl * dl) * R_NM;
    return { distance: d, bearing: norm360(Math.atan2(dl, dPsi) * R2D) };
  }

  /* Dead reckoning: from a position, run a course for a distance.
     This follows a RHUMB line, because that is what dead reckoning is - a
     course held constant on the compass. A great-circle projection would
     curve away from the course actually steered and the bearing measured
     back from the new position would not match the one set out on. */
  function project(lat, lon, bearing, distNM) {
    var p1 = lat * D2R, th = bearing * D2R, d = distNM / R_NM;
    var dp = d * Math.cos(th);
    var p2 = p1 + dp;
    /* refuse to sail over the pole */
    if (Math.abs(p2) > Math.PI / 2) p2 = p2 > 0 ? Math.PI - p2 : -Math.PI - p2;
    var dPsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
    var q = Math.abs(dPsi) > 1e-12 ? dp / dPsi : Math.cos(p1);
    var dl = d * Math.sin(th) / q;
    var l2 = lon * D2R + dl;
    return { lat: p2 * R2D, lon: ((l2 * R2D + 540) % 360) - 180 };
  }

  /* ── measuring on a paper chart ──
     A Mercator chart's longitude scale is stretched and must never be used for
     distance. The latitude scale is true, but only at the latitude you are
     working at, which is why you take the dividers to the side of the chart
     level with your track. These two turn that rule into numbers. */
  function chartMinutesToNM(minutesOfLatitude) { return minutesOfLatitude; }
  /* If someone has mistakenly measured on the longitude scale, this is what
     those minutes are actually worth at that latitude. */
  function longitudeMinutesToNM(minutesOfLongitude, atLatitude) {
    return minutesOfLongitude * Math.cos(atLatitude * D2R);
  }
  /* departure: east-west distance for a longitude difference at a latitude */
  function departure(dLonMinutes, atLatitude) {
    return dLonMinutes * Math.cos(atLatitude * D2R);
  }

  /* ══ the vector triangles ════════════════════════════════════════════════ */

  /* COURSE TO STEER against a tidal stream or current.
     You want to make good `trackWanted` over the ground. The water is setting
     towards `set` at `drift` knots. Your boat does `boatSpeed` through the
     water. Solve the triangle for the course to steer and the speed made good.
     Returns null when the stream is too strong to hold the track at all -
     which is a real answer, not a failure. */
  function courseToSteer(trackWanted, boatSpeed, set, drift, leeway, windFrom) {
    /* angle between the track wanted and the direction the stream sets */
    var alpha = (norm360(set - trackWanted)) * D2R;
    /* sine rule: drift/sin(correction) = boatSpeed/sin(alpha) */
    var s = drift * Math.sin(alpha) / boatSpeed;
    if (Math.abs(s) > 1) return null;                 /* cannot hold the track */
    var correction = Math.asin(s) * R2D;
    var course = norm360(trackWanted - correction);
    /* Speed over the ground is the length of the vector sum, computed from
       the vectors themselves. Deriving it from the sine rule instead invited
       a sign and angle-naming error that gave 1.9 knots where 5.7 was right,
       and gave zero with no stream at all. Adding the two vectors cannot go
       wrong in that way. */
    var cr = course * D2R, sr = set * D2R;
    var vx = boatSpeed * Math.sin(cr) + drift * Math.sin(sr);
    var vy = boatSpeed * Math.cos(cr) + drift * Math.cos(sr);
    var sog = Math.sqrt(vx * vx + vy * vy);
    /* Leeway is the sideways slip from wind pressure, applied to the HEADING:
       you steer further into the wind than the course you want to make. */
    var heading = course;
    if (leeway && windFrom != null) {
      var side = diff180(course, windFrom);           /* +ve: wind on starboard */
      heading = norm360(course + (side > 0 ? leeway : -leeway));
    }
    return {
      course: course, heading: heading,
      speedOverGround: Math.abs(sog), correction: correction
    };
  }

  /* ESTIMATED POSITION: where the water and the wind actually put you.
     A course steered for a time, then the stream applied for the same time. */
  function estimatedPosition(lat, lon, courseSteered, boatSpeed, hours, set, drift) {
    var dr = project(lat, lon, courseSteered, boatSpeed * hours);
    if (!drift) return { lat: dr.lat, lon: dr.lon, dr: dr };
    var ep = project(dr.lat, dr.lon, set, drift * hours);
    var made = rhumbLine(lat, lon, ep.lat, ep.lon);
    return {
      lat: ep.lat, lon: ep.lon, dr: dr,
      trackMadeGood: made.bearing, distanceMadeGood: made.distance,
      speedMadeGood: hours > 0 ? made.distance / hours : 0
    };
  }

  /* THE WIND TRIANGLE, the aviator's version of the same figure.
     Fly a true airspeed on some heading, the wind blows from `windFrom` at
     `windSpeed`; what heading holds the desired track, and how fast do you
     cross the ground? */
  function windTriangle(trackWanted, trueAirspeed, windFrom, windSpeed) {
    /* the angle between the wind and the track, measured at the aircraft */
    var wca = (norm360(windFrom - trackWanted)) * D2R;
    var s = windSpeed * Math.sin(wca) / trueAirspeed;
    if (Math.abs(s) > 1) return null;                 /* wind exceeds airspeed */
    var drift = Math.asin(s) * R2D;
    var heading = norm360(trackWanted + drift);
    var groundSpeed = trueAirspeed * Math.cos(drift * D2R) - windSpeed * Math.cos(wca);
    return { heading: heading, driftAngle: drift, groundSpeed: groundSpeed };
  }

  /* ══ distance off ════════════════════════════════════════════════════════ */

  /* By VERTICAL SEXTANT ANGLE: a known height, the angle it subtends.
     The classic table formula; angle in degrees, height in metres. */
  function distanceByVSA(heightM, angleDeg) {
    if (!(angleDeg > 0)) return NaN;
    return (heightM / 1852) / Math.tan(angleDeg * D2R);
  }

  /* HORIZON distance from a height of eye: how far you can see the sea meet
     the sky, allowing for the usual atmospheric refraction. */
  function horizonNM(heightOfEyeM) {
    return 2.075 * Math.sqrt(Math.max(0, heightOfEyeM));
  }

  /* RISING or DIPPING a light: the moment a light appears over the horizon
     fixes your distance from it exactly - the sum of the two horizons. */
  function dippingDistanceNM(heightOfEyeM, lightHeightM) {
    return horizonNM(heightOfEyeM) + horizonNM(lightHeightM);
  }

  /* DOUBLING THE ANGLE ON THE BOW: take a relative bearing, run on until it
     has doubled, and the distance run equals the distance off at the second
     bearing. This returns both that and the beam distance. */
  function doubleAngleOnBow(firstRelBearing, distanceRun) {
    var a = Math.abs(firstRelBearing);
    if (!(a > 0 && a < 90)) return null;
    return {
      distanceAtSecond: distanceRun,
      distanceAbeam: distanceRun * Math.sin(a * 2 * D2R)
    };
  }

  /* TWO BEARINGS and the run between them, the general case. */
  function twoBearingFix(firstRelBearing, secondRelBearing, distanceRun) {
    var a = Math.abs(firstRelBearing), b = Math.abs(secondRelBearing);
    if (!(a > 0 && b > a && b < 180)) return null;
    var angleAtObject = b - a;
    var d2 = distanceRun * Math.sin(a * D2R) / Math.sin(angleAtObject * D2R);
    return { distanceAtSecond: d2, distanceAbeam: d2 * Math.sin(b * D2R) };
  }

  /* ══ speed, time, distance and track error ══════════════════════════════ */

  function solveSTD(o) {
    /* give any two of speed (kn), time (hours), distance (NM) */
    if (o.speed != null && o.time != null) return { distance: o.speed * o.time };
    if (o.distance != null && o.speed) return { time: o.distance / o.speed };
    if (o.distance != null && o.time) return { speed: o.distance / o.time };
    return null;
  }

  /* THE 1-IN-60 RULE: one degree of track error puts you one mile off after
     sixty. Used both ways - to find how far off track you are, and what to
     alter to regain the destination. */
  function oneInSixty(distanceRun, offTrackNM, distanceToGo) {
    var trackError = 60 * offTrackNM / distanceRun;
    var closing = distanceToGo ? 60 * offTrackNM / distanceToGo : null;
    return {
      trackError: trackError,
      closingAngle: closing,
      totalAlteration: closing != null ? trackError + closing : null
    };
  }


  /* ══ great-circle (orthodrome) and rhumb-line (loxodrome) sailing ════════
     The two ways of getting from one position to another, and the reason a
     navigator carries both.

     The ORTHODROME is the shortest path: a great circle, the line a taut
     string would take over a globe. Its drawback is that the course changes
     continuously, so it cannot be steered directly - it is sailed as a series
     of rhumb-line legs between waypoints along it.

     The LOXODROME crosses every meridian at the same angle. It is longer, but
     it is one steady course, and it is the straight line on a Mercator chart.
     Over short distances the difference is negligible; across an ocean it is
     worth hundreds of miles. */

  /* Everything a great-circle sailing needs: both courses, the vertex (the
     highest latitude the track reaches, which is what tells you whether it
     runs into ice or a land mass), and waypoints to steer between. */
  function orthodrome(lat1, lon1, lat2, lon2, waypointStepDeg) {
    var gc = greatCircle(lat1, lon1, lat2, lon2);
    /* the course on ARRIVAL: the reciprocal of the initial course measured
       back from the destination */
    var back = greatCircle(lat2, lon2, lat1, lon1);
    var finalCourse = norm360(back.bearing + 180);

    /* Clairaut: cos(lat) x sin(course) is constant along a great circle, and
       at the vertex the course is due east or west, so that constant IS the
       cosine of the vertex latitude. */
    var p1 = lat1 * D2R, c1 = gc.bearing * D2R;
    var cosLatV = Math.abs(Math.cos(p1) * Math.sin(c1));
    var latV = Math.acos(Math.min(1, cosLatV)) * R2D;
    /* the vertex lies in the hemisphere the track is heading into */
    if (Math.cos(c1) < 0) latV = -latV;
    var dLonV = Math.atan2(Math.cos(c1), Math.sin(c1) * Math.sin(p1)) * R2D;
    var lonV = ((lon1 + dLonV + 540) % 360) - 180;

    /* waypoints: the latitude the great circle passes through at each
       meridian, so the track can be sailed as rhumb-line legs between them */
    var pts = [];
    var step = waypointStepDeg || 0;
    if (step > 0) {
      var dl = diff180(lon1, lon2);
      var n = Math.floor(Math.abs(dl) / step);
      for (var i = 1; i <= n; i++) {
        var lon = lon1 + (dl > 0 ? 1 : -1) * i * step;
        var la = gcLatAtLon(lat1, lon1, lat2, lon2, lon);
        if (la != null) pts.push({ lat: la, lon: ((lon + 540) % 360) - 180 });
      }
    }

    return {
      distance: gc.distance,
      initialCourse: gc.bearing,
      finalCourse: finalCourse,
      vertexLat: latV, vertexLon: lonV,
      waypoints: pts
    };
  }

  /* the latitude at which a given great circle crosses a given meridian */
  function gcLatAtLon(lat1, lon1, lat2, lon2, lon) {
    var p1 = lat1 * D2R, p2 = lat2 * D2R;
    var l1 = lon1 * D2R, l2 = lon2 * D2R, l = lon * D2R;
    var d = Math.sin(l1 - l2);
    if (Math.abs(d) < 1e-12) return null;      /* same meridian: undefined */
    var y = Math.sin(p1) * Math.cos(p2) * Math.sin(l - l2) -
            Math.sin(p2) * Math.cos(p1) * Math.sin(l - l1);
    var x = Math.cos(p1) * Math.cos(p2) * d;
    /* Plain atan, NOT atan2: a latitude only ever runs from -90 to +90, and
       atan2 returns the full circle, which produced waypoints at 137 degrees
       south. The quadrant information atan2 adds is meaningless here. */
    return Math.atan(y / x) * R2D;
  }

  /* Meridional parts: how far up the stretched Mercator latitude scale a
     latitude sits, in minutes. The whole of rhumb-line sailing rests on it,
     because on a Mercator chart the course is simply the angle whose tangent
     is the longitude difference over the difference of meridional parts. */
  function meridionalParts(lat) {
    var p = lat * D2R;
    return 7915.704468 * (Math.log(Math.tan(Math.PI / 4 + p / 2)) / Math.LN10);
  }

  /* Everything a rhumb-line sailing needs, in the terms the working is set
     out in: difference of latitude, difference of longitude, departure, and
     the difference of meridional parts that gives the course. */
  function loxodrome(lat1, lon1, lat2, lon2) {
    var rl = rhumbLine(lat1, lon1, lat2, lon2);
    var dLatMin = (lat2 - lat1) * 60;
    var dLonMin = diff180(lon1, lon2) * 60;
    var dmp = meridionalParts(lat2) - meridionalParts(lat1);
    /* mean latitude is good enough for departure over a moderate run; the
       meridional-parts course below is the exact one */
    var midLat = (lat1 + lat2) / 2;
    return {
      distance: rl.distance,
      course: rl.bearing,
      dLat: dLatMin,
      dLon: dLonMin,
      departure: departure(dLonMin, midLat),
      meridionalDiff: dmp,
      meanLat: midLat
    };
  }

  /* How much the great circle saves. Worth seeing before deciding to sail
     one: on a short passage it is a rounding error and not worth the extra
     course changes. */
  function sailingComparison(lat1, lon1, lat2, lon2) {
    var o = orthodrome(lat1, lon1, lat2, lon2, 0);
    var l = loxodrome(lat1, lon1, lat2, lon2);
    return {
      orthodrome: o, loxodrome: l,
      saving: l.distance - o.distance,
      savingPercent: l.distance > 0 ? 100 * (l.distance - o.distance) / l.distance : 0
    };
  }


  /* ══ working to windward ═══════════════════════════════════════════════
     A sailing vessel cannot sail straight at the wind. Inside roughly forty
     degrees either side of it there is no drive at all - the no-go zone - so
     a mark upwind is reached by tacking: sailing as close to the wind as the
     boat will hold, first on one side and then the other.

     Everything below follows from one number, the CLOSE-HAULED ANGLE: how
     close to the true wind this boat will actually sail and still move. It is
     not a constant. A modern racing keelboat holds about 35 degrees, a
     cruising yacht 45, a heavy long-keeled boat 50 or worse, and every one of
     them does better in flat water than in a seaway. */

  /* Apparent wind: what the instruments at the masthead actually read, which
     is the true wind plus the wind of your own motion. Angle is measured from
     the bow, positive to starboard. */
  function apparentWind(heading, boatSpeed, windFrom, windSpeed) {
    var twa = diff180(heading, windFrom);          /* true wind angle off the bow */
    var t = twa * D2R;
    /* components in the boat's frame: x across, y along (positive forward) */
    var x = windSpeed * Math.sin(t);
    var y = windSpeed * Math.cos(t) + boatSpeed;   /* own motion adds head wind */
    return {
      angle: Math.atan2(x, y) * R2D,               /* off the bow, + to starboard */
      speed: Math.sqrt(x * x + y * y),
      trueAngle: twa
    };
  }

  /* The reverse, which is the one that matters at sea: instruments give you
     apparent wind, and the tactics need true. */
  function trueWind(heading, boatSpeed, apparentAngle, apparentSpeed) {
    var a = apparentAngle * D2R;
    var x = apparentSpeed * Math.sin(a);
    var y = apparentSpeed * Math.cos(a) - boatSpeed;
    var twa = Math.atan2(x, y) * R2D;
    return {
      angle: twa,
      speed: Math.sqrt(x * x + y * y),
      direction: norm360(heading + twa)            /* the direction it blows FROM */
    };
  }

  /* The whole tacking picture for a mark to windward. */
  function tacking(windFrom, closeHauled, boatSpeed, markBearing, markDistance, leeway) {
    var lee = leeway || 0;
    /* the two close-hauled headings, and the leeway that means the boat
       actually travels a little further off the wind than it points */
    var stbdHeading = norm360(windFrom - closeHauled);   /* wind on starboard bow */
    var portHeading = norm360(windFrom + closeHauled);
    var stbdTrack = norm360(stbdHeading - lee);          /* pushed to leeward */
    var portTrack = norm360(portHeading + lee);

    /* where the mark sits relative to the wind */
    var markOffWind = diff180(windFrom, markBearing);    /* + mark is right of the wind */
    var absOff = Math.abs(markOffWind);
    var inNoGo = absOff < (closeHauled + lee);

    var res = {
      windFrom: windFrom,
      noGoFrom: norm360(windFrom - closeHauled - lee),
      noGoTo: norm360(windFrom + closeHauled + lee),
      noGoWidth: 2 * (closeHauled + lee),
      starboardHeading: stbdHeading, portHeading: portHeading,
      starboardTrack: stbdTrack, portTrack: portTrack,
      markBearing: markBearing, markOffWind: markOffWind,
      layable: !inNoGo,
      vmg: boatSpeed * Math.cos((closeHauled + lee) * D2R)   /* made good to windward */
    };

    if (!inNoGo || !(markDistance > 0) || !(boatSpeed > 0)) return res;

    /* Two-tack solution. The mark lies inside the no-go zone, so it is reached
       by one leg on each tack. Solve the triangle: the two tack tracks and the
       rhumb line to the mark form it, and the sine rule gives both legs. */
    var angFromStbd = Math.abs(diff180(stbdTrack, markBearing));
    var angFromPort = Math.abs(diff180(portTrack, markBearing));
    var apex = 180 - angFromStbd - angFromPort;   /* angle at the tack point */
    if (apex <= 0.01) return res;

    var legStbd = markDistance * Math.sin(angFromPort * D2R) / Math.sin(apex * D2R);
    var legPort = markDistance * Math.sin(angFromStbd * D2R) / Math.sin(apex * D2R);

    res.legStarboard = legStbd;
    res.legPort = legPort;
    res.totalDistance = legStbd + legPort;
    res.extraDistance = res.totalDistance - markDistance;
    res.totalTime = res.totalDistance / boatSpeed;
    res.directTime = markDistance / boatSpeed;
    /* the LONG tack first is the seamanlike default: it keeps you nearer the
       rhumb line, so a wind shift costs less and the layline is easier to judge */
    res.longTack = legStbd >= legPort ? 'starboard' : 'port';
    res.longTackLeg = Math.max(legStbd, legPort);
    res.shortTackLeg = Math.min(legStbd, legPort);
    return res;
  }

  /* Laylines: the two bearings from the mark along which you can finally lay
     it close-hauled. Crossing one is the moment to tack, and overstanding it
     is distance thrown away. */
  function laylines(windFrom, closeHauled, leeway) {
    var c = closeHauled + (leeway || 0);
    return {
      starboard: norm360(windFrom - c + 180),
      port: norm360(windFrom + c + 180)
    };
  }

  return {
    norm360: norm360, diff180: diff180,
    compassToTrue: compassToTrue, trueToCompass: trueToCompass,
    compassToMagnetic: compassToMagnetic, magneticToTrue: magneticToTrue,
    trueToMagnetic: trueToMagnetic, deviationAt: deviationAt,
    greatCircle: greatCircle, rhumbLine: rhumbLine, project: project,
    orthodrome: orthodrome, loxodrome: loxodrome, gcLatAtLon: gcLatAtLon,
    meridionalParts: meridionalParts, sailingComparison: sailingComparison,
    chartMinutesToNM: chartMinutesToNM, longitudeMinutesToNM: longitudeMinutesToNM,
    departure: departure,
    courseToSteer: courseToSteer, estimatedPosition: estimatedPosition,
    apparentWind: apparentWind, trueWind: trueWind,
    tacking: tacking, laylines: laylines,
    windTriangle: windTriangle,
    distanceByVSA: distanceByVSA, horizonNM: horizonNM,
    dippingDistanceNM: dippingDistanceNM,
    doubleAngleOnBow: doubleAngleOnBow, twoBearingFix: twoBearingFix,
    solveSTD: solveSTD, oneInSixty: oneInSixty,
    R_NM: R_NM
  };
});
