/*
 * Artemidos - World Magnetic Model WMM-2025
 * Coefficients: NOAA/NGA, released 11/13/2024, valid 2025.0 to 2030.0
 * Public domain (a US Government work). Generated from WMM2025.COF verbatim.
 *
 * MAGNETIC VARIATION WITHOUT A CHART.
 *
 * A compass points at the earth's magnetic field, not at the pole, and the
 * difference between the two - variation, or declination - changes with where
 * you are and drifts year by year. A chart carries it on the compass rose with
 * the year it was correct for; away from the chart you have nothing.
 *
 * This is the model the charts themselves are built from: a spherical harmonic
 * expansion of the earth's field to degree 12, with a linear rate of change per
 * year. Feed it a position and a date and it returns the same declination the
 * rose would give you, corrected to today.
 *
 * WHAT IT IS NOT. It is the smooth global field, so it does not know about the
 * lump of iron ore in the hill beside you, nor about the steel of the vessel
 * you are standing on. Local anomalies of several degrees exist and are marked
 * on charts; deviation from your own platform is a separate correction. And it
 * expires: after 2030.0 the coefficients are stale and a new model is issued.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WMM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EPOCH = 2025.0;
  var VALID_TO = 2030.0;
  var NAME = 'WMM-2025';
  var NMAX = 12;

  /* WGS84 and the geomagnetic reference sphere, exactly as the model defines */
  var A = 6378.137;            /* semi-major axis, km */
  var B = 6356.7523142;        /* semi-minor axis, km */
  var RE = 6371.2;             /* geomagnetic reference radius, km */

  /* main field (nT) and its annual rate (nT/year), flat-indexed by n,m */
  var G = [
    0,-29351.8,-1410.8,-2556.6,2951.1,1649.3,1361,-2404.1,1243.8,453.6,895,
    799.5,55.7,-281.1,12.1,-233.2,368.9,187.2,-138.7,-142,20.9,64.4,63.8,
    76.9,-115.7,-40.9,14.9,-60.7,79.5,-77,-8.8,59.3,15.8,2.5,-11.1,14.2,
    23.2,10.8,-17.5,2,-21.7,16.9,15,-16.8,0.9,4.6,7.8,3,-0.2,-2.5,-13.1,2.4,
    8.6,-8.7,-12.9,-1.3,-6.4,0.2,2,-1,-0.6,-0.9,1.5,0.9,-2.7,-3.9,2.9,-1.5,
    -2.5,2.4,-0.6,-0.1,-0.6,-0.1,1.1,-1,-0.2,2.6,-2,-0.2,0.3,1.2,-1.3,0.6,
    0.6,0.5,-0.1,-0.4,-0.2,-1.3,-0.7
  ];
  var H = [
    0,0,4545.4,0,-3133.6,-815.1,0,-56.6,237.5,-549.5,0,278.6,-133.9,212,
    -375.6,0,45.4,220.2,-122.9,43,106.1,0,-18.4,16.8,48.8,-59.8,10.9,72.7,0,
    -48.9,-14.4,-1,23.4,-7.4,-25.1,-2.3,0,7.1,-12.6,11.4,-9.7,12.7,0.7,-5.2,
    3.9,0,-24.8,12.2,8.3,-3.3,-5.2,7.2,-0.6,0.8,10,0,3.3,0,2.4,5.3,-9.1,0.4,
    -4.2,-3.8,0.9,-9.1,0,0,2.9,-0.6,0.2,0.5,-0.3,-1.2,-1.7,-2.9,-1.8,-2.3,0,
    -1.3,0.7,1,-1.4,-0,0.6,-0.1,0.8,0.1,-1,0.1,0.2
  ];
  var DG = [
    0,12,9.7,-11.6,-5.2,-8,-1.3,-4.2,0.4,-15.6,-1.6,-2.4,-6,5.6,-7,0.6,1.4,
    0,0.6,2.2,0.9,-0.2,-0.4,0.9,1.2,-0.9,0.3,0.9,-0,-0.1,-0.1,0.5,-0.1,-0.8,
    -0.8,0.8,-0.1,0.2,0,0.5,-0.1,0.3,0.2,-0,0.2,-0,-0.1,0.1,0.3,-0.3,0,0.3,
    -0.1,0.1,-0.1,0.1,0,0.1,0.1,-0,-0.3,0,-0.1,-0.1,-0,-0,0,-0,0,0,0,-0.1,0,
    -0,-0.1,-0.1,-0.1,-0.1,0,0,-0,-0,-0,-0,0.1,-0,0,0,-0.1,-0,-0.1
  ];
  var DH = [
    0,0,-21.5,0,-27.7,-12.1,0,4,-0.3,-4.1,0,-1.1,4.1,1.6,-4.4,0,-0.5,2.2,
    0.4,1.7,1.9,0,0.3,-1.6,-0.4,0.9,0.7,0.9,0,0.6,0.5,-0.8,0,-1,0.6,-0.2,0,
    -0.2,0.5,-0.4,0.4,-0.5,-0.6,0.3,0.2,0,-0.3,0.3,-0.3,0.3,0.2,-0.1,-0.2,
    0.4,0.1,0,0,-0,-0.2,0.1,-0.1,0.1,0,-0.1,0.2,-0,0,-0,0.1,-0,0.1,-0,-0,
    0.1,-0,0,0,0,0,-0,0,-0.1,0.1,-0,-0,-0,0,-0,-0,0,-0.1
  ];

  function idx(n, m) { return n * (n + 1) / 2 + m; }

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  /* Schmidt semi-normalised associated Legendre functions and their
     derivatives with respect to colatitude, built by the standard recurrences.

     These recurrences produce the Schmidt normalisation DIRECTLY. An earlier
     version ran an unnormalised recurrence and then multiplied by a Schmidt
     factor afterwards, which normalised twice: the declination came out half a
     turn wrong and the total field short by thousands of nanotesla on every one
     of NOAA's hundred test points. Normalise once, in the recurrence. */
  function legendre(nmax, sinTheta, cosTheta) {
    var size = idx(nmax, nmax) + 1;
    var P = new Array(size), dP = new Array(size);
    for (var i = 0; i < size; i++) { P[i] = 0; dP[i] = 0; }

    P[idx(0, 0)] = 1; dP[idx(0, 0)] = 0;

    for (var n = 1; n <= nmax; n++) {
      /* sectoral term, m = n */
      var inn = idx(n, n);
      if (n === 1) {
        P[inn] = sinTheta;
        dP[inn] = cosTheta;
      } else {
        var f = Math.sqrt((2 * n - 1) / (2 * n));
        var ipp = idx(n - 1, n - 1);
        P[inn] = f * sinTheta * P[ipp];
        dP[inn] = f * (sinTheta * dP[ipp] + cosTheta * P[ipp]);
      }
      /* the rest, m < n */
      for (var m = 0; m < n; m++) {
        var i1 = idx(n - 1, m);
        var haveTwo = (n - 2 >= m);
        var i2 = haveTwo ? idx(n - 2, m) : -1;
        var k = Math.sqrt((n - 1) * (n - 1) - m * m);
        var den = Math.sqrt(n * n - m * m);
        var pn = (2 * n - 1) * cosTheta * P[i1] - (haveTwo ? k * P[i2] : 0);
        var dn = (2 * n - 1) * (cosTheta * dP[i1] - sinTheta * P[i1]) -
                 (haveTwo ? k * dP[i2] : 0);
        var im = idx(n, m);
        P[im] = pn / den;
        dP[im] = dn / den;
      }
    }
    return { P: P, dP: dP };
  }

  /* The field at a place and a moment.
     lat, lon in degrees; altitude in km above the WGS84 ellipsoid; the date a
     JS Date or a decimal year. Returns declination and inclination in degrees
     and the field components in nanotesla. */
  function field(lat, lon, altKm, when) {
    var year = decimalYear(when);
    var dt = year - EPOCH;

    var latR = lat * D2R, lonR = lon * D2R;
    var alt = altKm || 0;

    /* geodetic to geocentric spherical */
    var sinLat = Math.sin(latR), cosLat = Math.cos(latR);
    var a2 = A * A, b2 = B * B;
    var rc = a2 / Math.sqrt(a2 * cosLat * cosLat + b2 * sinLat * sinLat);
    var p = (rc + alt) * cosLat;
    var z = (rc * b2 / a2 + alt) * sinLat;
    var r = Math.sqrt(p * p + z * z);
    var sinLatG = z / r, cosLatG = p / r;
    var latG = Math.atan2(z, p);

    /* colatitude: sin(theta) = cos(geocentric latitude), cos(theta) = sin(it) */
    var leg = legendre(NMAX, cosLatG, sinLatG);
    var P = leg.P, dP = leg.dP;

    /* Geocentric components, exactly as the WMM technical report defines
       them in colatitude: X' north, Y' east, Z' down. Accumulated with their
       own signs rather than negated afterwards - flipping a sum after the
       fact is how the inclination came out upside down and the declination
       half a turn wrong on every one of the hundred official test points. */
    var Xg = 0, Yg = 0, Zg = 0;
    var ratio = RE / r;
    var rpow = ratio * ratio;        /* (RE/r)^(n+2) built up as n grows */

    for (var n = 1; n <= NMAX; n++) {
      rpow *= ratio;                 /* now (RE/r)^(n+2) */
      for (var m = 0; m <= n; m++) {
        var i = idx(n, m);
        var g = G[i] + dt * DG[i];
        var h = H[i] + dt * DH[i];
        var cosMl = Math.cos(m * lonR), sinMl = Math.sin(m * lonR);
        var gc = g * cosMl + h * sinMl;
        var gs = g * sinMl - h * cosMl;
        /* PLUS, not minus. The report writes X' with a leading minus because
           its dP is taken with respect to mu = cos(theta); these recurrences
           differentiate with respect to theta itself, which carries the sign
           already. With the minus the field magnitude was exact and the
           declination was half a turn out - the signature of one flipped
           component. */
        Xg += rpow * gc * dP[i];
        Zg -= (n + 1) * rpow * gc * P[i];
        if (cosLatG > 1e-10) Yg += m * rpow * gs * P[i] / cosLatG;
      }
    }

    /* Geocentric to geodetic: rotate by GEOCENTRIC minus geodetic latitude.
       With the subtraction the other way the total field stayed exact but the
       inclination was out by twice the geodetic-geocentric difference, which
       is the fingerprint of a rotation applied backwards. */
    var psi = latG - latR;
    var cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
    var X = Xg * cosPsi - Zg * sinPsi;     /* north */
    var Y = Yg;                            /* east */
    var Z = Xg * sinPsi + Zg * cosPsi;     /* down */

    var Hh = Math.sqrt(X * X + Y * Y);
    var F = Math.sqrt(Hh * Hh + Z * Z);

    return {
      declination: Math.atan2(Y, X) * R2D,
      inclination: Math.atan2(Z, Hh) * R2D,
      X: X, Y: Y, Z: Z, H: Hh, F: F,
      year: year,
      expired: year > VALID_TO,
      model: NAME, validTo: VALID_TO
    };
  }

  /* variation alone, which is what a navigator actually wants: signed east
     positive, matching the convention the rest of the app uses */
  function declination(lat, lon, when, altKm) {
    return field(lat, lon, altKm || 0, when).declination;
  }

  function decimalYear(when) {
    if (typeof when === 'number') return when;
    var d = when instanceof Date ? when : new Date();
    var y = d.getFullYear();
    var start = new Date(y, 0, 1).getTime();
    var end = new Date(y + 1, 0, 1).getTime();
    return y + (d.getTime() - start) / (end - start);
  }

  return {
    field: field, declination: declination, decimalYear: decimalYear,
    EPOCH: EPOCH, VALID_TO: VALID_TO, NAME: NAME
  };
});
