/*
 * Artemidos - catalogue: drone links, GNSS and electronic attack
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHICH SIGNALS A DRONE DEPENDS ON, AND WHICH TO ATTACK.
 *
 * Every unmanned aircraft rides on two kinds of radio link, and the way to
 * defeat one is not the way to defeat the other:
 *
 *   CONTROL / DATA LINK   the radio between the operator and the aircraft.
 *                         Jam it and you cut the operator off. Small drones use
 *                         2.4 and 5.8 GHz; military systems use protected UHF,
 *                         L- and C-band line-of-sight links and Ku/Ka satellite
 *                         links for beyond line of sight. A fire-and-forget
 *                         loitering munition has NO live link once launched, so
 *                         there is nothing to jam - which is the whole point of
 *                         them.
 *
 *   GNSS (satellite nav)  the position fix. Nearly all use the civil signals in
 *                         a narrow band near 1.5-1.6 GHz: GPS L1 1575.42 MHz,
 *                         GLONASS L1 ~1602 MHz, Galileo E1 1575.42 MHz, BeiDou
 *                         B1 1561 MHz. JAMMING that band denies a fix; SPOOFING
 *                         it feeds a false fix and can walk the aircraft off
 *                         course. Encrypted military GNSS (GPS M-code) and
 *                         multi-antenna anti-jam (CRPA) receivers resist both.
 *
 * The figures are open-source band-level references, not exact set-on values,
 * and none of this is operational guidance: electronic attack is lawful only
 * for authorised operators, and jamming or spoofing these bands also disrupts
 * aviation, shipping and emergency services that share them.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  var GNSS_MULTI = 'GPS L1 1575.42 MHz, GLONASS L1 ~1602 MHz, Galileo E1 1575.42 MHz and BeiDou B1 1561 MHz - all inside a narrow band around 1.56-1.61 GHz. Better sets add L2 (1227.6) and L5 (1176.45) and encrypted military GPS.';
  var GNSS_CIVIL = 'Civil GPS L1 C/A at 1575.42 MHz, usually GLONASS L1 (~1602 MHz) too. No military encryption, so both jamming and spoofing of the ~1.5-1.6 GHz band work.';

  /* class templates keyed off the record description */
  var TEMPLATES = {
    loiter: {
      link: 'Often none once launched: a pre-programmed loitering munition flies a set course on GNSS and inertial with no two-way link, so there is no command channel to jam. Where a link exists it is a thin low-rate command uplink.',
      gnss: GNSS_MULTI + ' Loses to GNSS denial by falling back to inertial dead-reckoning, which drifts.',
      downlink: 'None on the pure munition; camera-equipped variants send video on a directional or satellite link.',
      spoof: 'Jam or spoof the ~1.5-1.6 GHz civil GNSS band. Denied a satellite fix it navigates on inertial only and drifts off aim over distance; a convincing spoof can steer it away from the target entirely.',
      jam: 'Little or nothing to jam if it is fire-and-forget: after launch it hears no operator. GNSS denial, not link jamming, is the lever.',
      best: 'GNSS spoofing or jamming in the 1.5-1.6 GHz band, backed by gun or missile. The nav drift from a long inertial-only leg is what degrades accuracy.',
      note: 'A loitering munition with no radio link is immune to command jamming because it is listening to no one. That is why counter-Shahed work centres on GNSS denial and cheap kinetic intercept, not on jamming a control link that is not there.'
    },
    antiRad: {
      link: 'Loiters autonomously and homes on hostile radar emissions. Any command link is a thin optional uplink, not the thing that guides it.',
      gnss: GNSS_MULTI + ' GNSS is used to reach the search area, not to hit the target - the target is found by its own radar signal.',
      downlink: 'Camera variants (Harop) stream video for a man-in-the-loop abort; the pure Harpy does not need it.',
      spoof: 'GNSS spoofing helps only on the way in. It does NOT stop the terminal attack, because the weapon homes on your radar transmission, not on a satellite fix.',
      jam: 'Jamming its link does little and jamming more radar makes it worse: extra emissions are exactly what it hunts.',
      best: 'Stop the targeted radar emitting and move it. Emission control defeats an anti-radiation loiterer where GNSS spoofing and link jamming do not.',
      note: 'The anti-radiation loitering munition inverts the usual advice. Turning your radar off and relocating is the counter; adding electronic noise or leaving the emitter running is what gets it hit.'
    },
    male: {
      link: 'Line-of-sight command in protected UHF/L/C-band (broadly 300 MHz-6 GHz), plus a Ku- or Ka-band satellite link (roughly 12-15 / 27-31 GHz) for beyond-line-of-sight control. Cut the satcom and it is limited to line of sight of its ground station.',
      gnss: GNSS_MULTI,
      downlink: 'Wideband sensor and video on the C-band line-of-sight link and on Ku/Ka satcom.',
      spoof: 'Spoof the civil GNSS band (~1.5-1.6 GHz) to corrupt its position. Military versions with encrypted GPS M-code and CRPA anti-jam antennas resist this heavily, so effect is often partial.',
      jam: 'Jam the line-of-sight command uplink and the Ku/Ka satcom uplink together. Losing both usually triggers a programmed orbit or return-to-base rather than a crash.',
      best: 'Deny the command uplink and satcom at once, and spoof GNSS as well. A drone that cannot be commanded reverts to autonomous return; denying its fix degrades that return too.',
      note: 'These carry redundant links and often encrypted military GNSS, so one jammer rarely defeats them. The realistic attack denies several bands simultaneously and accepts degradation, not a clean kill.'
    },
    ucav: {
      link: 'Encrypted, often low-probability-of-intercept datalink, line-of-sight and satellite, built to keep working while jammed. Many fly the mission autonomously if the link drops.',
      gnss: GNSS_MULTI + ' Backed by inertial navigation and terrain reference, so GNSS denial alone rarely stops it.',
      downlink: 'Encrypted wideband data on protected line-of-sight and satellite links.',
      spoof: 'Spoofing the civil GNSS band has limited effect: these use encrypted GNSS, anti-jam antennas and inertial back-up, and are designed to keep navigating through denial.',
      jam: 'Jamming the datalink is hard by design and often pointless: cut off, a stealth combat drone continues its programmed mission rather than returning.',
      best: 'No reliable soft-kill: autonomy and protected links make it a hard-kill problem. Layered air defence, not jamming, is the answer.',
      note: 'Autonomy is the point of this class. It is built precisely so that jamming the link or denying GNSS changes little, which is why it is treated as a target to shoot down rather than to jam.'
    },
    small: {
      link: 'Operator link in a 2.4 GHz or UHF band, sometimes an encrypted mesh datalink. Break it and many hover, land or fly a return-home.',
      gnss: GNSS_CIVIL,
      downlink: 'Analogue or digital video on 2.4 or 5.8 GHz.',
      spoof: 'Jam or spoof GPS L1 (1575.42 MHz): most small systems use civil GPS and lose their hold when it is denied. A spoof can push a position-holding drone off station.',
      jam: 'Jam the 2.4 GHz (and 5.8 GHz) control and video band to cut the operator link. A hand-held counter-drone "gun" does exactly this at a few hundred metres.',
      best: 'Band-jam 2.4/5.8 GHz and GPS L1 together. It is the cheap, standard counter-small-drone method and is why those jammers exist.',
      note: 'Fully autonomous small drones keep flying a mission with the link jammed, so against those only GNSS denial and hard measures degrade the flight. That onboard autonomy is the reason link-jamming is losing ground as a sole answer.'
    },
    consumer: {
      link: 'Commercial digital link (DJI OcuSync and similar) hopping across 2.4 GHz and 5.8 GHz, sometimes 5.2 GHz. Jamming that band drops the video and control and triggers the failsafe.',
      gnss: GNSS_CIVIL + ' Consumer craft also broadcast their own position by Remote ID / AeroScope, so they announce where they and the pilot are.',
      downlink: 'Digital HD video on the same 2.4/5.8 GHz link as control.',
      spoof: 'Spoof or jam GPS L1 (1575.42 MHz) and GLONASS: the drone loses its position hold, drifts, and on most models climbs and tries to return home on a stored point that a spoof can move.',
      jam: 'Jam 2.4/5.8 GHz to sever control and video. Depending on failsafe the drone then hovers, lands, or flies back to its launch point - which reveals the operator.',
      best: 'Jam 2.4/5.8 GHz plus GPS/GLONASS L1, or read its Remote ID to find the pilot. Off-the-shelf counter-drone kit does both.',
      note: 'Remote ID is the quiet weakness of consumer drones: many transmit their serial, position and take-off point in clear, so they can be located and attributed before any jamming is needed.'
    }
  };

  /* pick a template from the record's own description */
  function classify(rec) {
    var d = (rec.d || '').toLowerCase();
    if (rec.cat === 'civ') return 'consumer';
    if (/anti-radiation/.test(d)) return 'antiRad';
    if (/loitering munition/.test(d)) return 'loiter';
    if (/unmanned combat air vehicle|stealth (flying-wing |unmanned )?combat|loyal wingman|attritable/.test(d)) return 'ucav';
    if (/nano|hand-launched|man-portable|small tactical|small reconnaissance|tactical reconnaissance/.test(d)) return 'small';
    return 'male';
  }

  var applied = 0;
  C.all().forEach(function (rec) {
    var isDrone = (rec.cat === 'mil' && rec.sub === 'uas') || (rec.cat === 'civ' && rec.sub === 'drone');
    if (!isDrone || rec.ew) return;
    var t = TEMPLATES[classify(rec)];
    /* shallow copy so per-record tweaks never mutate the shared template */
    rec.ew = {
      link: t.link, gnss: t.gnss, downlink: t.downlink,
      spoof: t.spoof, jam: t.jam, best: t.best, note: t.note
    };
    applied++;
  });

  /* ── specific overrides where a model differs from its class ────────── */

  function tweak(id, patch) {
    var r = C.item(id);
    if (!r || !r.ew) { return; }
    Object.keys(patch).forEach(function (k) { r.ew[k] = patch[k]; });
  }

  tweak('mil-uas-shahed-136-geran-2', {
    gnss: 'Commercial GNSS (GPS/GLONASS) plus inertial. Later Geran-2 batches fit CRPA multi-antenna anti-jam units, which makes simple spoofing far harder than on the early airframes.',
    spoof: 'Jam or spoof the ~1.5-1.6 GHz GNSS band to force it onto inertial and induce drift. Against CRPA-equipped batches a single spoofer is often defeated, so several spatially separated emitters are used.',
    best: 'GNSS denial in 1.5-1.6 GHz plus cheap kinetic intercept. It is slow, low and loud, so the real problem is cost per shot, not finding a soft-kill.'
  });

  tweak('mil-uas-shahed-131', {
    best: 'GNSS spoofing/jamming in 1.5-1.6 GHz plus gunfire. Smaller and shorter-ranged than the 136 but the same fire-and-forget, no-link profile.'
  });

  tweak('mil-uas-skydio-x10d', {
    link: 'Encrypted link, but it is built to fly autonomously: it maps and avoids obstacles onboard and will complete a task with the operator link jammed.',
    jam: 'Link jamming is weak against it by design - it does not need the operator to keep flying. This is the model case for why link-jamming alone is fading as a counter-drone answer.',
    best: 'GNSS denial and hard measures. Because it flies itself through a jammed link, only degrading its navigation or shooting it down reliably works.'
  });

  tweak('mil-uas-orlan-10', {
    link: 'Analogue/digital video and a command link in VHF/UHF; some variants relay through a cellular modem. The command link and any cellular relay are both attackable.',
    best: 'Jam the VHF/UHF command link and GNSS. As an artillery spotter, cutting its downlink is as valuable as stopping the aircraft: no picture, no corrections.'
  });

  console.log('Artemidos EW: signal/spoofing data on ' + applied + ' drones');

})();
