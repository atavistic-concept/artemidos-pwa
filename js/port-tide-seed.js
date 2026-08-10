/*
 * Artemidos - standard-port tidal reference figures
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT.
 *
 * tide-data.js carries published harmonic constants and predicts to the minute
 * and the centimetre. It is almost entirely United States waters, because that
 * is the harmonic set that exists in the public domain.
 *
 * This file is the other half: for the rest of the world it carries the two
 * numbers a nautical almanac prints for a STANDARD PORT, which are the two the
 * astronomical engine in art-tide.js needs to turn moon transits into a tide:
 *
 *   hwi  the mean high water interval, minutes from the moon's meridian
 *        passage to high water at that port. This is what fixes the TIMES.
 *   spr  mean spring range, metres.
 *   npr  mean neap range, metres. These two fix the SIZE.
 *   z0   height of mean sea level above chart datum, metres, where it is
 *        well established. Only with z0 can an absolute height be printed;
 *        without it the tool gives the range, which is the figure that
 *        actually decides whether a boat floats.
 *
 * THESE ARE PLANNING FIGURES, NOT A TIDE TABLE. They are round numbers for a
 * mean condition. They do not carry the shallow-water distortion that makes
 * Southampton stand its double high water or the Solent behave unlike anywhere
 * else, they take no account of surge, barometric pressure or river discharge,
 * and in a place with big seasonal river flow the real water can sit well off
 * these figures for weeks. Where the app has harmonic constants it uses them
 * and ignores this file entirely.
 *
 * ANY PORT ON THIS LIST CAN BE OVERRIDDEN BY WATCHING ONE HIGH WATER. The
 * calibration in the tide tool replaces the seeded interval with the one you
 * measured, and a measured interval from the beach you are standing on beats
 * any book.
 *
 * Format: [match, hwi, spr, npr, z0]  - match is the port name as it appears
 * in port-data.js. z0 null where it is not reliably known.
 */
(function (global) {
  'use strict';

  var S = [
    /* ── Britain and Ireland ── */
    ['London', 70, 6.6, 4.9, 3.6],
    ['Tilbury', 60, 6.4, 4.8, 3.5],
    ['Sheerness', 45, 5.3, 4.0, 3.0],
    ['Dover', 20, 6.0, 3.2, 3.7],
    ['Portsmouth', 340, 3.9, 1.9, 2.8],
    ['Southampton', 340, 4.0, 1.9, 2.9],
    ['Plymouth', 320, 4.7, 2.2, 3.3],
    ['Falmouth', 315, 4.5, 2.1, 3.0],
    ['Bristol', 355, 12.2, 6.1, 6.9],
    ['Cardiff', 350, 11.2, 5.7, 6.4],
    ['Liverpool', 10, 8.4, 4.3, 5.0],
    ['Holyhead', 340, 4.4, 2.2, 3.1],
    ['Belfast', 20, 3.0, 1.6, 2.0],
    ['Dublin', 25, 3.4, 1.7, 2.2],
    ['Cork', 305, 3.4, 1.6, 2.2],
    ['Glasgow', 60, 4.0, 2.0, 2.6],
    ['Aberdeen', 195, 3.7, 1.9, 2.4],
    ['Leith', 230, 4.7, 2.4, 3.0],
    ['Newcastle', 220, 4.4, 2.2, 2.9],
    ['Hull', 300, 6.4, 3.2, 4.0],
    ['Lowestoft', 45, 1.9, 1.0, 1.4],
    ['Harwich', 60, 3.6, 2.0, 2.2],

    /* ── France, Iberia, western Europe ── */
    ['Calais', 40, 6.7, 4.0, 4.0],
    ['Dunkirk', 55, 5.5, 3.4, 3.3],
    ['Le Havre', 355, 6.7, 3.3, 4.5],
    ['Cherbourg', 320, 5.9, 2.9, 3.6],
    ['Saint-Malo', 340, 11.4, 5.5, 6.7],
    ['Brest', 300, 6.1, 3.0, 4.0],
    ['La Rochelle', 315, 5.4, 2.7, 3.5],
    ['Bordeaux', 20, 4.5, 2.6, 3.0],
    ['Bilbao', 300, 3.7, 1.9, 2.4],
    ['Lisbon', 305, 3.3, 1.6, 2.2],
    ['Porto', 300, 3.2, 1.6, 2.1],
    ['Cadiz', 320, 3.0, 1.4, 1.9],
    ['Gibraltar', 335, 0.9, 0.4, 0.5],
    ['Rotterdam', 65, 1.9, 1.5, 1.2],
    ['Amsterdam', 90, 1.5, 1.2, 0.9],
    ['Antwerp', 90, 5.2, 3.9, 3.1],
    ['Hamburg', 130, 3.6, 3.1, 2.2],
    ['Bremerhaven', 100, 3.7, 3.2, 2.2],
    ['Copenhagen', 50, 0.3, 0.2, 0.2],
    ['Oslo', 45, 0.3, 0.2, 0.2],
    ['Bergen', 355, 1.3, 0.7, 0.8],

    /* ── Mediterranean: small tides, mostly meteorological ── */
    ['Marseille', 0, 0.3, 0.2, 0.2],
    ['Barcelona', 0, 0.2, 0.1, 0.1],
    ['Valencia', 0, 0.2, 0.1, 0.1],
    ['Genoa', 0, 0.3, 0.2, 0.2],
    ['Naples', 0, 0.4, 0.2, 0.2],
    ['Venice', 0, 0.9, 0.4, 0.5],
    ['Trieste', 0, 0.9, 0.4, 0.5],
    ['Piraeus', 0, 0.2, 0.1, 0.1],
    ['Istanbul', 0, 0.2, 0.1, 0.1],
    ['Alexandria', 0, 0.4, 0.2, 0.2],

    /* ── Africa ── */
    ['Casablanca', 320, 3.4, 1.7, 2.2],
    ['Dakar', 330, 1.4, 0.7, 0.9],
    ['Lagos', 340, 1.1, 0.6, 0.7],
    ['Cape Town', 175, 1.5, 0.7, 1.0],
    ['Durban', 165, 1.7, 0.8, 1.1],
    ['Mombasa', 190, 3.2, 1.5, 2.0],
    ['Dar es Salaam', 190, 3.5, 1.6, 2.2],
    ['Suez', 340, 1.6, 0.8, 1.0],

    /* ── Middle East, South Asia ── */
    ['Dubai', 300, 1.7, 0.9, 1.1],
    ['Abu Dhabi', 310, 1.6, 0.8, 1.0],
    ['Doha', 300, 1.5, 0.7, 1.0],
    ['Muscat', 250, 2.0, 0.9, 1.2],
    ['Karachi', 340, 2.6, 1.2, 1.7],
    ['Mumbai', 350, 4.0, 1.8, 2.5],
    ['Kochi', 30, 0.9, 0.4, 0.6],
    ['Chennai', 90, 1.1, 0.5, 0.7],
    ['Kolkata', 130, 4.6, 2.2, 3.0],
    ['Colombo', 60, 0.6, 0.3, 0.4],
    ['Chittagong', 140, 4.6, 2.2, 3.0],
    ['Yangon', 150, 5.2, 2.5, 3.3],

    /* ── South East Asia, China, Japan, Korea ── */
    ['Singapore', 200, 2.7, 1.3, 1.7],
    ['Port Klang', 210, 4.4, 2.1, 2.8],
    ['Jakarta', 250, 0.9, 0.4, 0.6],
    ['Bangkok', 200, 2.6, 1.2, 1.6],
    ['Ho Chi Minh City', 210, 3.0, 1.4, 1.9],
    ['Manila', 240, 1.2, 0.6, 0.8],
    ['Hong Kong', 230, 1.7, 0.8, 1.1],
    ['Shanghai', 20, 3.5, 1.7, 2.2],
    ['Qingdao', 60, 3.5, 1.6, 2.2],
    ['Tianjin', 90, 2.5, 1.2, 1.6],
    ['Guangzhou', 240, 2.2, 1.0, 1.4],
    ['Shenzhen', 230, 1.8, 0.9, 1.2],
    ['Xiamen', 340, 5.2, 2.5, 3.3],
    ['Keelung', 320, 1.2, 0.6, 0.8],
    ['Kaohsiung', 300, 1.0, 0.5, 0.7],
    ['Busan', 340, 1.2, 0.6, 0.8],
    ['Incheon', 40, 8.5, 4.1, 5.4],
    ['Tokyo', 320, 1.7, 0.8, 1.1],
    ['Yokohama', 320, 1.6, 0.8, 1.0],
    ['Osaka', 340, 1.5, 0.7, 1.0],
    ['Nagoya', 330, 2.1, 1.0, 1.3],
    ['Kobe', 340, 1.5, 0.7, 1.0],

    /* ── Australia, New Zealand, Pacific ── */
    ['Sydney', 240, 1.6, 0.8, 1.0],
    ['Melbourne', 300, 0.8, 0.4, 0.5],
    ['Brisbane', 250, 2.1, 1.0, 1.3],
    ['Perth', 280, 0.7, 0.3, 0.4],
    ['Fremantle', 280, 0.7, 0.3, 0.4],
    ['Adelaide', 290, 2.1, 0.7, 1.2],
    ['Darwin', 330, 6.4, 2.5, 4.0],
    ['Hobart', 250, 1.1, 0.5, 0.7],
    ['Auckland', 200, 3.0, 2.2, 1.9],
    ['Wellington', 250, 1.2, 0.9, 0.8],
    ['Lyttelton', 240, 2.1, 1.5, 1.3],
    ['Suva', 220, 1.4, 0.7, 0.9],

    /* ── South America ── */
    ['Rio de Janeiro', 130, 1.2, 0.5, 0.7],
    ['Santos', 140, 1.4, 0.6, 0.8],
    ['Salvador', 130, 2.3, 1.0, 1.4],
    ['Recife', 130, 2.2, 1.0, 1.3],
    ['Belem', 180, 3.4, 1.6, 2.1],
    ['Buenos Aires', 200, 1.0, 0.6, 0.7],
    ['Montevideo', 190, 0.6, 0.3, 0.4],
    ['Valparaiso', 210, 1.6, 0.8, 1.0],
    ['Callao', 190, 0.9, 0.4, 0.6],
    ['Guayaquil', 200, 3.4, 1.6, 2.1],
    ['Cartagena', 180, 0.5, 0.2, 0.3],

    /* ── Canada and the Atlantic islands ── */
    ['Halifax', 190, 1.8, 1.2, 1.1],
    ['Vancouver', 300, 4.0, 2.5, 2.7],
    ['Reykjavik', 330, 3.6, 1.7, 2.3],
    ['Las Palmas', 320, 2.4, 1.2, 1.5],
    ['Funchal', 320, 2.0, 1.0, 1.3]
  ];

  /* expanded into a lookup the tide tool can read by port name */
  var byName = {};
  for (var i = 0; i < S.length; i++) {
    byName[S[i][0]] = { hwi: S[i][1], spr: S[i][2], npr: S[i][3], z0: S[i][4], seeded: true };
  }

  global.ART_PORT_TIDE_SEED = byName;

  /* Positions of the seeded ports, so an unseeded port can be referenced to the
     nearest one the way a secondary port is referenced to a standard port in a
     tide table. Filled in at load from the directory, which already holds every
     position, so the two lists cannot drift apart. */
  global.ART_PORT_TIDE_SEED_LIST = function () {
    var dir = global.ART_PORT_DIRECTORY || [], out = [], j;
    for (j = 0; j < dir.length; j++) {
      var s = byName[dir[j].place];
      if (s) out.push({ place: dir[j].place, lat: dir[j].lat, lon: dir[j].lon, cal: s });
    }
    return out;
  };

})(typeof window !== 'undefined' ? window : this);
