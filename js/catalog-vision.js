/*
 * Artemidos - catalogue: crew vision, dead zones and gun arcs
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHAT A CREW CAN AND CANNOT SEE.
 *
 * An armoured vehicle is far blinder than it looks. Closed down, the crew see
 * through a handful of fixed periscopes with narrow fields of view, and there
 * is a ring of ground around the hull that no device covers at all. That ring
 * is the dead zone, and it is the single most important thing to understand
 * about operating near armour, working around it, or assessing what a vehicle
 * can actually observe.
 *
 * Three separate limits are recorded, because they are different problems:
 *
 *   DEAD ZONE      ground close to the hull that no vision device sees.
 *                  Measured from the hull edge outward.
 *   GUN DEPRESSION how far the main armament can point down, which sets a
 *                  MINIMUM ENGAGEMENT RANGE: inside it the gun physically
 *                  cannot be brought to bear however well the target is seen.
 *   HORIZON        how far the crew can see on flat open ground from their
 *                  eye height, which is a geometry limit, not an optics one.
 *
 * Dead-zone figures are representative of the vehicle class on level ground
 * with hatches closed. They grow on a slope, in rubble, and against a low or
 * prone target, and they shrink when a commander fights head-out, which is
 * precisely the trade-off between awareness and protection that crews make.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  /* horizon on flat ground from eye height h, metres: d = 3570 * sqrt(h) */
  function horizon(h) { return 3570 * Math.sqrt(h); }

  /* minimum range at which a gun can be laid on the ground, from trunnion
     height and depression angle: d = h / tan(depression) */
  function minEngage(trunnion, depDeg) {
    if (!depDeg) return null;
    return trunnion / Math.tan(Math.abs(depDeg) * Math.PI / 180);
  }

  function attach(id, v) {
    var rec = C.item(id);
    if (!rec) { console.warn('Artemidos vision: no entry "' + id + '"'); return; }
    if (v.eyeHeight) v.horizon = horizon(v.eyeHeight);
    if (v.trunnion && v.depression) v.minEngage = minEngage(v.trunnion, v.depression);
    rec.vision = v;
  }

  /* ── main battle tanks ────────────────────────────────────────────── */

  attach('mil-tank-m1a2-sepv3-abrams', {
    hullLen: 7.93, hullWid: 3.66, height: 2.44,
    eyeHeight: 2.8, trunnion: 2.3,
    depression: -10, elevation: 20,
    blocks: 6, driverBlocks: 3,
    dead: { front: 9, side: 8, rear: 12 },
    rearAid: 'Rear-view camera fitted on SEPv3',
    note: 'Ten degrees of gun depression is generous and lets it fight hull-down from a reverse slope, ' +
      'which is a real tactical advantage over tanks limited to five. The rear remains the weak arc: ' +
      'without the camera the loader and commander have nothing covering directly astern.'
  });

  attach('mil-tank-leopard-2a7', {
    hullLen: 7.7, hullWid: 3.75, height: 3.0,
    eyeHeight: 2.9, trunnion: 2.4,
    depression: -9, elevation: 20,
    blocks: 8, driverBlocks: 3,
    dead: { front: 8, side: 8, rear: 13 },
    rearAid: 'Driver rear-view camera and 360° situational awareness cameras on the A7',
    note: 'The A7 was specifically reworked for urban fighting, where the dead zone matters most: ' +
      'the camera suite exists because a tank in a street is surrounded by ground its periscopes cannot see.'
  });

  attach('mil-tank-challenger-2', {
    hullLen: 8.3, hullWid: 3.5, height: 2.49,
    eyeHeight: 2.8, trunnion: 2.35,
    depression: -10, elevation: 20,
    blocks: 8, driverBlocks: 1,
    dead: { front: 9, side: 8, rear: 14 },
    rearAid: 'None as standard',
    note: 'The driver has a single wide periscope and reclines to drive closed down, which makes ' +
      'close manoeuvring in built-up ground very dependent on the commander talking him round.'
  });

  attach('mil-tank-leclerc-xlr', {
    hullLen: 6.88, hullWid: 3.71, height: 2.53,
    eyeHeight: 2.8, trunnion: 2.3,
    depression: -8, elevation: 15,
    blocks: 8, driverBlocks: 3,
    dead: { front: 9, side: 8, rear: 13 },
    rearAid: 'Rear camera on the XLR standard',
    note: 'Three-man crew: with no loader there is one fewer set of eyes and one fewer hatch, ' +
      'so closed-down awareness rests almost entirely on the commander panoramic sight.'
  });

  attach('mil-tank-t-90m-proryv', {
    hullLen: 6.86, hullWid: 3.78, height: 2.23,
    eyeHeight: 2.5, trunnion: 2.0,
    depression: -5, elevation: 14,
    blocks: 5, driverBlocks: 2,
    dead: { front: 11, side: 9, rear: 16 },
    rearAid: 'Rear-view camera fitted on the M',
    note: 'Five degrees of depression is the defining limitation of the Soviet tank line. ' +
      'It cannot fire far down from a crest, so it must expose more of the hull to engage a target below it, ' +
      'and the minimum engagement range is more than twice that of a Western tank. ' +
      'The low silhouette that buys protection is the same thing that costs visibility.'
  });

  attach('mil-tank-t-72b3m', {
    hullLen: 6.95, hullWid: 3.59, height: 2.23,
    eyeHeight: 2.5, trunnion: 2.0,
    depression: -6, elevation: 14,
    blocks: 4, driverBlocks: 2,
    dead: { front: 11, side: 10, rear: 18 },
    rearAid: 'None as standard',
    note: 'Very poor closed-down awareness. The turret rear over the engine deck is a large blind arc, ' +
      'and with no rear vision device the crew are effectively reversing on the commander memory of the ground.'
  });

  attach('mil-tank-t-80bvm', {
    hullLen: 7.0, hullWid: 3.6, height: 2.2,
    eyeHeight: 2.5, trunnion: 2.0,
    depression: -5, elevation: 14,
    blocks: 4, driverBlocks: 2,
    dead: { front: 11, side: 10, rear: 17 },
    rearAid: 'None as standard'
  });

  attach('mil-tank-t-14-armata', {
    hullLen: 8.7, hullWid: 3.5, height: 3.3,
    eyeHeight: 2.2, trunnion: 2.6,
    depression: -5, elevation: 15,
    blocks: 0, driverBlocks: 0,
    dead: { front: 6, side: 5, rear: 6 },
    rearAid: 'Full 360° camera and radar suite; the crew see only through screens',
    note: 'The crew sit in a hull capsule with no direct vision at all, so every figure here depends on ' +
      'the camera suite working. That removes the classic dead zone but replaces it with a single point of failure: ' +
      'lose the displays and the vehicle is blind rather than merely limited.'
  });

  attach('mil-tank-merkava-mk4-barak', {
    hullLen: 7.6, hullWid: 3.72, height: 2.66,
    eyeHeight: 2.9, trunnion: 2.5,
    depression: -7, elevation: 20,
    blocks: 6, driverBlocks: 3,
    dead: { front: 8, side: 7, rear: 9 },
    rearAid: 'Iron Vision helmet system projects hull cameras onto the crew visor',
    note: 'Iron Vision is the most complete answer to the dead-zone problem in service: the crew look ' +
      'through the armour at a stitched camera image and can see the ground immediately around the hull ' +
      'without opening a hatch. Designed from hard urban experience.'
  });

  attach('mil-tank-type-99a', {
    hullLen: 7.6, hullWid: 3.5, height: 2.37,
    eyeHeight: 2.6, trunnion: 2.1,
    depression: -6, elevation: 14,
    blocks: 5, driverBlocks: 2,
    dead: { front: 10, side: 9, rear: 15 },
    rearAid: 'Rear camera fitted'
  });

  attach('mil-tank-k2-black-panther', {
    hullLen: 7.5, hullWid: 3.6, height: 2.4,
    eyeHeight: 2.8, trunnion: 2.3,
    depression: -10, elevation: 20,
    blocks: 8, driverBlocks: 3,
    dead: { front: 8, side: 7, rear: 11 },
    rearAid: 'Rear camera and hydropneumatic suspension',
    note: 'The suspension can pitch the hull nose-down, which adds several degrees of effective gun ' +
      'depression beyond the turret mounting and shrinks the minimum engagement range further.'
  });

  attach('mil-tank-type-10', {
    hullLen: 7.5, hullWid: 3.24, height: 2.3,
    eyeHeight: 2.7, trunnion: 2.2,
    depression: -10, elevation: 20,
    blocks: 6, driverBlocks: 3,
    dead: { front: 8, side: 7, rear: 11 },
    rearAid: 'Rear camera fitted',
    note: 'Hydropneumatic suspension gives additional pitch, and the hull is narrow enough for ' +
      'Japanese road and rail limits, which also makes it easier to place in restricted ground.'
  });

  attach('mil-tank-t-55-type-59', {
    hullLen: 6.45, hullWid: 3.27, height: 2.4,
    eyeHeight: 2.5, trunnion: 1.9,
    depression: -5, elevation: 18,
    blocks: 2, driverBlocks: 2,
    dead: { front: 12, side: 11, rear: 20 },
    rearAid: 'None',
    note: 'A 1950s vision suite. Closed down the crew see almost nothing outside the frontal arc, ' +
      'which is why these vehicles are so vulnerable to close infantry attack without escort.'
  });

  attach('mil-tank-t-62m', {
    hullLen: 6.63, hullWid: 3.3, height: 2.4,
    eyeHeight: 2.5, trunnion: 1.95,
    depression: -6, elevation: 16,
    blocks: 2, driverBlocks: 2,
    dead: { front: 12, side: 11, rear: 19 },
    rearAid: 'None'
  });

  /* ── armoured and protected vehicles ──────────────────────────────── */

  attach('mil-afv-m2a4-bradley', {
    hullLen: 6.55, hullWid: 3.6, height: 2.98,
    eyeHeight: 2.9, trunnion: 2.4,
    depression: -10, elevation: 60,
    blocks: 7, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 9 },
    rearAid: 'Driver rear-view camera',
    note: 'Sixty degrees of gun elevation is deliberate: it lets the 25 mm engage upper floors and ' +
      'rooftops, which a tank gun limited to twenty degrees cannot reach in a street.'
  });

  attach('mil-afv-cv90-mk-iv', {
    hullLen: 6.55, hullWid: 3.1, height: 2.7,
    eyeHeight: 2.8, trunnion: 2.3,
    depression: -10, elevation: 35,
    blocks: 6, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 8 },
    rearAid: 'Rear and side cameras'
  });

  attach('mil-afv-puma', {
    hullLen: 7.4, hullWid: 3.9, height: 3.1,
    eyeHeight: 2.9, trunnion: 2.5,
    depression: -10, elevation: 45,
    blocks: 6, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 8 },
    rearAid: 'Full 360° camera coverage',
    note: 'The unmanned turret puts the commander and gunner in the hull, so all turret-side awareness ' +
      'is through sensors from the outset rather than through glass.'
  });

  attach('mil-afv-bmp-2', {
    hullLen: 6.74, hullWid: 3.15, height: 2.25,
    eyeHeight: 2.4, trunnion: 1.9,
    depression: -5, elevation: 74,
    blocks: 3, driverBlocks: 3,
    dead: { front: 10, side: 9, rear: 14 },
    rearAid: 'None',
    note: 'The 30 mm elevates to 74 degrees for air and high-angle work, but depresses only five, ' +
      'so it cannot engage anything close and low. Dismounts in the dead zone are the standing threat.'
  });

  attach('mil-afv-bmp-3', {
    hullLen: 7.14, hullWid: 3.2, height: 2.4,
    eyeHeight: 2.5, trunnion: 2.0,
    depression: -6, elevation: 60,
    blocks: 3, driverBlocks: 3,
    dead: { front: 10, side: 9, rear: 13 },
    rearAid: 'None as standard'
  });

  attach('mil-afv-stryker-icv-dragoon', {
    hullLen: 6.95, hullWid: 2.72, height: 2.64,
    eyeHeight: 2.8, trunnion: 2.4,
    depression: -10, elevation: 50,
    blocks: 4, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 8 },
    rearAid: 'Rear-view camera standard',
    note: 'Wheeled and tall, so the driver dead zone directly in front is larger than the low silhouette suggests. ' +
      'A ground guide is standard practice when reversing in close country.'
  });

  attach('mil-afv-btr-80-btr-70', {
    hullLen: 7.65, hullWid: 2.9, height: 2.41,
    eyeHeight: 2.5, trunnion: 2.1,
    depression: -4, elevation: 60,
    blocks: 3, driverBlocks: 2,
    dead: { front: 10, side: 9, rear: 14 },
    rearAid: 'None',
    note: 'Four degrees of depression on the KPVT. Against anything close and below the hull line ' +
      'the turret is useless and the crew must fight through firing ports or dismount.'
  });

  attach('mil-afv-namer', {
    hullLen: 7.6, hullWid: 3.8, height: 2.0,
    eyeHeight: 2.4, trunnion: 2.0,
    depression: -20, elevation: 60,
    blocks: 6, driverBlocks: 3,
    dead: { front: 6, side: 5, rear: 6 },
    rearAid: 'Full camera coverage and Iron Vision on later builds',
    note: 'A remote weapon station is not limited by a turret ring the way a gun is, so it depresses ' +
      'far enough to cover the ground right against the hull. That is a large part of why heavy APCs ' +
      'built for urban work use them.'
  });

  attach('mil-afv-bmpt-terminator', {
    hullLen: 7.0, hullWid: 3.8, height: 3.44,
    eyeHeight: 3.1, trunnion: 2.8,
    depression: -5, elevation: 45,
    blocks: 5, driverBlocks: 3,
    dead: { front: 9, side: 8, rear: 12 },
    rearAid: 'Rear camera',
    note: 'Built specifically to cover the dead zones of the tanks it escorts. High gun elevation ' +
      'for upper floors is the point of the vehicle.'
  });

  attach('mil-afv-hmmwv-humvee', {
    hullLen: 4.57, hullWid: 2.16, height: 1.83,
    eyeHeight: 2.25, trunnion: 2.0,
    depression: -15, elevation: 60,
    blocks: 0, driverBlocks: 0,
    turret: false,
    /* These are DEAD ZONES - the close-in ground the bonnet, doors and cargo
       bed hide - not sight limits. Through a full windscreen the driver sees to
       the horizon; what he cannot see is the strip of ground the bonnet cuts
       off, which on a flat-nosed 4x4 at this eye height is about two metres.
       The sides are ordinary door glass, so barely over a metre. Behind the cab
       there is genuinely no view from the seats: the cargo area blocks it and
       only the roof gunner can look aft. */
    dead: { front: 2, side: 1.2, rear: 8 },
    rearAid: 'Roof gunner only; the cargo bed blocks the mirror line',
    note: 'Vision here is close to a civilian 4x4 and far better than any closed-down armoured vehicle: ' +
      'a full windscreen and full-height door glass mean the driver and commander see out to the horizon ' +
      'in the frontal and side arcs. What the figures describe is only the close-in ground that the ' +
      'bodywork hides - about two metres cut off by the bonnet, a little over a metre at the doors. ' +
      'The rear is the real blind arc: the cargo bed kills the mirror line and only the roof gunner can ' +
      'see aft. Ordinary glass means awareness is good and protection is not, and the up-armoured M1114 ' +
      'trades that away, thickening the glass and worsening every one of these numbers.'
  });

  attach('mil-afv-oshkosh-jltv', {
    hullLen: 6.2, hullWid: 2.5, height: 2.6,
    eyeHeight: 2.2, trunnion: 2.3,
    depression: -15, elevation: 60,
    blocks: 0, driverBlocks: 0,
    turret: false,
    dead: { front: 5, side: 4, rear: 7 },
    rearAid: 'Rear camera standard',
    note: 'Thick armoured glass and a high bonnet line: the forward dead zone is noticeably worse than ' +
      'a civilian vehicle of the same size, which matters at checkpoints and in crowds.'
  });

  attach('mil-afv-maxxpro-mrap', {
    hullLen: 6.5, hullWid: 2.5, height: 3.05,
    eyeHeight: 2.6, trunnion: 2.6,
    depression: -15, elevation: 60,
    blocks: 0, driverBlocks: 0,
    turret: false,
    dead: { front: 6, side: 5, rear: 9 },
    rearAid: 'Rear camera',
    note: 'Very high hull for mine protection, so the driver cannot see a person standing close to the ' +
      'front bumper. Several ground casualties have come from exactly this.'
  });

  attach('mil-afv-m113a3', {
    hullLen: 4.86, hullWid: 2.69, height: 2.5,
    eyeHeight: 2.4, trunnion: 2.2,
    depression: -20, elevation: 60,
    blocks: 4, driverBlocks: 4,
    dead: { front: 6, side: 5, rear: 8 },
    rearAid: 'None'
  });

  attach('mil-afv-boxer', {
    hullLen: 7.93, hullWid: 2.99, height: 2.37,
    eyeHeight: 2.6, trunnion: 2.4,
    depression: -10, elevation: 60,
    blocks: 4, driverBlocks: 3,
    dead: { front: 8, side: 6, rear: 9 },
    rearAid: 'Rear and side cameras standard'
  });

  attach('mil-afv-warrior', {
    hullLen: 6.34, hullWid: 3.03, height: 2.79,
    eyeHeight: 2.8, trunnion: 2.4,
    depression: -10, elevation: 45,
    blocks: 5, driverBlocks: 1,
    dead: { front: 7, side: 6, rear: 9 },
    rearAid: 'None as standard'
  });

  attach('mil-afv-marder-1a5', {
    hullLen: 6.88, hullWid: 3.38, height: 2.98,
    eyeHeight: 2.8, trunnion: 2.4,
    depression: -17, elevation: 65,
    blocks: 6, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 9 },
    rearAid: 'None as standard',
    note: 'Seventeen degrees of depression is unusually generous and lets the 20 mm cover ground ' +
      'close against the hull, which is exactly where a dismounted anti-armour team wants to be.'
  });

  attach('mil-afv-lynx-kf41', {
    hullLen: 7.73, hullWid: 3.6, height: 3.3,
    eyeHeight: 3.0, trunnion: 2.6,
    depression: -10, elevation: 45,
    blocks: 6, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 8 },
    rearAid: 'Full 360° camera coverage'
  });

  attach('mil-afv-ajax-ascod-2', {
    hullLen: 7.62, hullWid: 3.35, height: 3.0,
    eyeHeight: 2.9, trunnion: 2.5,
    depression: -10, elevation: 45,
    blocks: 6, driverBlocks: 3,
    dead: { front: 7, side: 6, rear: 8 },
    rearAid: 'Local situational awareness camera suite'
  });

  attach('mil-afv-vbci', {
    hullLen: 7.6, hullWid: 2.98, height: 3.0,
    eyeHeight: 2.8, trunnion: 2.5,
    depression: -10, elevation: 50,
    blocks: 5, driverBlocks: 3,
    dead: { front: 8, side: 6, rear: 9 },
    rearAid: 'Rear camera'
  });

  attach('mil-afv-btr-82a', {
    hullLen: 7.65, hullWid: 2.9, height: 2.8,
    eyeHeight: 2.6, trunnion: 2.3,
    depression: -5, elevation: 70,
    blocks: 3, driverBlocks: 2,
    dead: { front: 10, side: 9, rear: 14 },
    rearAid: 'None as standard'
  });

  attach('mil-afv-mt-lb', {
    hullLen: 6.45, hullWid: 2.86, height: 1.86,
    eyeHeight: 2.1, trunnion: 1.8,
    depression: -5, elevation: 30,
    blocks: 2, driverBlocks: 2,
    dead: { front: 9, side: 8, rear: 12 },
    rearAid: 'None',
    note: 'Very low hull, so the dead zone is shallower than a tank, but with two periscopes and no ' +
      'rear device the crew are close to blind outside the frontal arc.'
  });

  attach('mil-afv-bmd-4m', {
    hullLen: 6.0, hullWid: 3.11, height: 2.23,
    eyeHeight: 2.4, trunnion: 1.9,
    depression: -6, elevation: 60,
    blocks: 3, driverBlocks: 3,
    dead: { front: 9, side: 8, rear: 12 },
    rearAid: 'None'
  });

  attach('mil-afv-achzarit', {
    hullLen: 6.2, hullWid: 3.64, height: 2.0,
    eyeHeight: 2.3, trunnion: 2.0,
    depression: -20, elevation: 60,
    blocks: 5, driverBlocks: 3,
    dead: { front: 6, side: 5, rear: 7 },
    rearAid: 'Rear door and cameras',
    note: 'Turretless with a remote weapon station, so the gun reaches ground right against the hull. ' +
      'A deliberate design response to close urban fighting.'
  });

  attach('mil-afv-centauro-ii', {
    hullLen: 7.4, hullWid: 3.14, height: 2.7,
    eyeHeight: 2.8, trunnion: 2.4,
    depression: -7, elevation: 16,
    blocks: 6, driverBlocks: 3,
    dead: { front: 8, side: 7, rear: 10 },
    rearAid: 'Rear camera'
  });

  attach('mil-afv-bushmaster-pmv', {
    hullLen: 7.18, hullWid: 2.48, height: 2.65,
    eyeHeight: 2.4, trunnion: 2.5,
    depression: -15, elevation: 60,
    blocks: 0, driverBlocks: 0,
    turret: false,
    dead: { front: 6, side: 4, rear: 8 },
    rearAid: 'Rear camera',
    note: 'Armoured glass all round gives better direct vision than a turreted vehicle, which is part ' +
      'of why it is favoured for patrol and convoy escort rather than assault.'
  });

  attach('mil-afv-zbd-04a', {
    hullLen: 7.2, hullWid: 3.2, height: 2.5,
    eyeHeight: 2.5, trunnion: 2.1,
    depression: -6, elevation: 60,
    blocks: 4, driverBlocks: 3,
    dead: { front: 10, side: 8, rear: 12 },
    rearAid: 'Rear camera on later builds'
  });

})();
