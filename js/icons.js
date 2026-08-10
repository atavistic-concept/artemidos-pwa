/*
 * Artemidos - icons
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Inline SVG only. Deliberately not an icon font: the ops portal ships a
 * subsetted Material Symbols face where any glyph outside the subset renders
 * as nothing, which is a silent failure. Inline paths cannot fail that way
 * and keep the app fully offline.
 */
(function (global) {
  'use strict';

  /* 24x24 grid, stroke-based, inherits currentColor */
  var P = {
    /* chrome */
    back:      '<path d="M15 19 8 12l7-7"/>',
    chevron:   '<path d="m9 5 7 7-7 7"/>',
    close:     '<path d="M18 6 6 18M6 6l12 12"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    info:      '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>',
    check:     '<path d="m20 6-11 11-5-5"/>',
    warn:      '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    /* Hazard glyphs. Radiation, chemical, UXO and blast each had the same
       warning triangle, which made the icon useless for telling the three
       hazard categories apart on the very screens built for recognition. */
    trefoil:   '<circle cx="12" cy="12" r="1.6"/><path d="M10.25 8.97a3.5 3.5 0 0 1 3.5 0L16 5.07a8 8 0 0 0-8 0zM15.03 13.75a3.5 3.5 0 0 1-1.75 3.03l2.25 3.9a8 8 0 0 0 4-6.93zM8.97 13.75a3.5 3.5 0 0 0 1.75 3.03l-2.25 3.9a8 8 0 0 1-4-6.93z"/>',
    chem:      '<path d="M10 3h4M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.5 21h11a1.9 1.9 0 0 0 1.7-2.8L14 9V3"/><path d="M8.2 15.5h7.6"/>',
    uxo:       '<circle cx="12" cy="13" r="5.5"/><path d="M12 5v2.5M12 18.5V21M4 13h2.5M17.5 13H20M6.3 7.3l1.8 1.8M15.9 16.9l1.8 1.8M17.7 7.3l-1.8 1.8M8.1 16.9l-1.8 1.8"/>',
    blast:     '<circle cx="12" cy="12" r="2.6"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8"/>',
    refresh:   '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    history:   '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 3v6h6"/><path d="M12 8v4l3 2"/>',
    trash:     '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    copy:      '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    swap:      '<path d="M7 4v13M4 14l3 3 3-3M17 20V7M14 10l3-3 3 3"/>',
    plus:      '<path d="M12 5v14M5 12h14"/>',
    minus:     '<path d="M5 12h14"/>',
    star:      '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    grid:      '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    play:      '<path d="M7 4.5v15l13-7.5z"/>',
    stop:      '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    lock:      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',

    /* tools */
    calc:      '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M8 7h8M8 12h2M12 12h2M16 12h.01M8 16h2M12 16h2M16 16h.01"/>',
    convert:   '<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>',
    graph:     '<path d="M3 20 9 12l4 4 8-10"/><path d="M21 6v5M21 6h-5"/>',
    sigma:     '<path d="M18 4H6l7 8-7 8h12"/>',
    stats:     '<path d="M5 21V11M12 21V4M19 21v-7"/>',
    ratio:     '<path d="M4 18 18 4"/><circle cx="7" cy="7" r="2.6"/><circle cx="16" cy="16" r="2.6"/>',
    speed:     '<path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"/><path d="M12 12 16 8"/><path d="M12 12h.01"/>',
    recon:     '<path d="M2.5 12S6.5 5 12 5s9.5 7 9.5 7-4 7-9.5 7S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    thermo:    '<path d="M10 4a2 2 0 0 1 4 0v9.2a4.5 4.5 0 1 1-4 0z"/><path d="M12 9v8"/>',
    morse:     '<circle cx="4" cy="12" r="1.7" fill="currentColor" stroke="none"/><rect x="8.5" y="10.3" width="7.5" height="3.4" rx="1.7"/><circle cx="20" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
    shadow:    '<circle cx="12" cy="8" r="3.5"/><path d="M12 1.5v1.6M12 12.9v1.6M4.4 8H6M18 8h1.6M6.6 2.6 7.8 3.8M16.2 12.2l1.2 1.2M6.6 13.4l1.2-1.2M16.2 3.8l1.2-1.2"/><path d="M3 21h18"/><path d="M9 21l6-4"/>',
    range:     '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.5"/>',
    field:     '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5z"/>',
    sound:     '<path d="M4 10v4h3l4 3.5v-11L7 10z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    bolt:      '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    physics:   '<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="9.5" ry="4" /><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)"/>',
    ruler:     '<rect x="2" y="8" width="20" height="8" rx="1.6" transform="rotate(-45 12 12)"/><path d="M9.5 6.5 11 8M12.5 9.5 14 11M6.5 9.5 8 11M15.5 12.5 17 14"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',

    /* catalogue */
    car:       '<path d="M5 16h14M4 16v-3.5L6 8h12l2 4.5V16"/><path d="M3 16h18v3h-3v-1H6v1H3z"/><circle cx="7.5" cy="16.5" r="1.2"/><circle cx="16.5" cy="16.5" r="1.2"/>',
    moto:      '<circle cx="5" cy="16" r="3.2"/><circle cx="19" cy="16" r="3.2"/><path d="M5 16l4-6h4l3 6M9 10h6M13 10l2-3h2"/>',
    plane:     '<path d="M21 15.5 3.5 20l3-6-3-6L21 8.5v7z"/>',
    heli:      '<path d="M3 5h18M12 5v3"/><path d="M6 11h11a3 3 0 0 1 3 3v2H8a2 2 0 0 1-2-2z"/><path d="M6 16v3M17 16v3M20 14h2"/>',
    ship:      '<path d="M3 17.5 4.5 12h15L21 17.5a4 4 0 0 1-3.5 2.5h-11A4 4 0 0 1 3 17.5z"/><path d="M12 12V4M12 4l5 3-5 2"/>',
    drone:     '<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M7 7l2 2M17 7l-2 2M7 17l2-2M17 17l-2-2"/>',
    train:     '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M8 8h8M8 12h.01M16 12h.01M6 21l2.5-4M18 21l-2.5-4"/>',
    tank:      '<path d="M3 15.5h18v3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/><path d="M5 15.5V12h11v3.5"/><path d="M10 12V9.5h3V12"/><path d="M13 10.5h8"/>',
    missile:   '<path d="M12 2c2.5 2.5 3.5 5.5 3.5 9v5h-7v-5C8.5 7.5 9.5 4.5 12 2z"/><path d="M8.5 16 6 21l2.5-1.5M15.5 16 18 21l-2.5-1.5M12 22v-3"/>',
    person:    '<circle cx="12" cy="6" r="3"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/>',
    animal:    '<ellipse cx="6" cy="9" rx="2" ry="2.6"/><ellipse cx="18" cy="9" rx="2" ry="2.6"/><ellipse cx="9.5" cy="5" rx="1.8" ry="2.4"/><ellipse cx="14.5" cy="5" rx="1.8" ry="2.4"/><path d="M12 11c3 0 5 2.4 5 4.6 0 2-1.6 3.4-5 3.4s-5-1.4-5-3.4C7 13.4 9 11 12 11z"/>',
    shield:    '<path d="M12 2.5 4.5 5.5V11c0 5 3.2 8.6 7.5 10.5 4.3-1.9 7.5-5.5 7.5-10.5V5.5z"/>',
    target:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    artemis:   '<circle cx="9" cy="12" r="4"/><path d="M9 3v1.5M9 19.5V21M3 12H1.5M16.5 12H15M4.6 4.6l1 1M13.4 4.6l-1 1M4.6 19.4l1-1" /><path d="M20 15.5A5 5 0 0 1 15.5 8a5.5 5.5 0 1 0 4.5 7.5z"/>',
    eye:       '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    sun:       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon:      '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/>',
    frame:     '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/><circle cx="12" cy="12" r="2"/>',

    /* field tools */
    flight:    '<path d="M21 15.5 3.5 20l3-6-3-6L21 8.5v7z"/>',
    route:     '<circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.6 6H15a3.4 3.4 0 0 1 0 6.8H9A3.4 3.4 0 0 0 9 18h6.4"/>',
    globe:     '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',
    money:     '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
    radio:     '<path d="M12 12h.01"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7"/><path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 18.5a9 9 0 0 0 0-13"/>',
    city:      '<path d="M3 21V9l6-3v15M9 21V3l6 3v15M15 21v-9l6 3v6"/><path d="M2 21h20"/>',
    pin:       '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    call:      '<path d="M21 16.9v2.6a2 2 0 0 1-2.2 2 19.5 19.5 0 0 1-8.5-3 19.2 19.2 0 0 1-5.9-5.9 19.5 19.5 0 0 1-3-8.6A2 2 0 0 1 3.4 2H6a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7.1 9.9a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 21 16.9z"/>',
    plug:      '<path d="M9 2v6M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
    language:  '<path d="M3 5h11M8.5 3v2M11 5c0 4-3.5 8-8 9"/><path d="M6 11c1.6 2.4 3.7 4 6.5 5"/><path d="M12.5 21 17 10l4.5 11M14 17.5h6"/>',
    fire:      '<path d="M12 22c3.9 0 6.5-2.6 6.5-6 0-4.5-4.5-6.5-4-11.5C11 6 9.5 8.5 9.5 10.5c-1-.6-1.5-1.8-1.5-3C6.4 9 5.5 11.4 5.5 14c0 3.4 2.6 8 6.5 8z"/>',
    ambulance: '<path d="M3 17V8h11v9M14 11h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M8.5 10.5v3M7 12h3"/>',

    /* two crossed arrows: the huntress mark */
    arrows:    '<path d="M4.5 19.5 19.5 4.5M19.5 19.5 4.5 4.5"/><path d="M13.5 4.5h6v6M10.5 4.5h-6v6"/>',
    /* biohazard: three interlocked rings around a hub */
    biohazard: '<circle cx="12" cy="7.2" r="3.1"/><circle cx="7" cy="15.6" r="3.1"/><circle cx="17" cy="15.6" r="3.1"/><circle cx="12" cy="12.4" r="1.9"/><path d="M12 10.5V9M10.4 13.4 9 14.2M13.6 13.4 15 14.2"/>',
    /* skull: for decomposition */
    skull:     '<path d="M5 11.5c0-4 3-6.8 7-6.8s7 2.8 7 6.8c0 2.3-1.1 3.9-2.3 5-.6.5-.9 1-.9 1.9V19a1 1 0 0 1-1 1H9.2a1 1 0 0 1-1-1v-.6c0-.9-.3-1.4-.9-1.9C6.1 15.4 5 13.8 5 11.5z"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><path d="M12 14.5v2M10.5 20v2M13.5 20v2"/>',
    /* apple: for food and organic decay */
    apple:     '<path d="M12 8.4c-1.3-2-4.2-2.3-5.9-.3-1.6 2-1.2 5.9.7 8.5C8 18.4 9.7 19.6 12 19.6s4-1.2 5.2-3c1.9-2.6 2.3-6.5.7-8.5-1.7-2-4.6-1.7-5.9.3z"/><path d="M12 8.4V5M12 5c0-1.5 1.3-2.3 2.7-2.1-.2 1.5-1.3 2.3-2.7 2.1z"/>'
  };

  var Icons = {
    /* svg('car') -> markup string. cls adds classes, size overrides 24.
       Both the line glyph and its pixel twin go into the same <svg>, and CSS
       shows one or the other. Emitting both costs a few hundred bytes of DOM
       per icon and buys an instant theme switch: the alternative is a full
       re-render of every screen the moment the theme changes. */
    svg: function (name, cls, size) {
      var body = P[name];
      if (!body) return '';
      var pix = global.IconsPixel && global.IconsPixel[name];
      return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="' + (size || 24) +
        '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<g class="ic-v">' + body + '</g>' +
        (pix ? '<g class="ic-p" fill="currentColor" stroke="none"><path d="' + pix + '"/></g>' : '') +
        '</svg>';
    },
    has: function (name) { return !!P[name]; },
    names: function () { return Object.keys(P); },

    /* The Artemidos mark: a crescent with three crossed arrows. Painted as
       a CSS mask over currentColor rather than an <img>, so the one asset
       takes the accent of whichever theme is active instead of needing a
       recoloured copy per theme. */
    mark: function (size) {
      size = size || 44;
      return '<span class="art-mark" style="width:' + size + 'px;height:' + size + 'px"></span>';
    }
  };

  global.Icons = Icons;

})(window);
