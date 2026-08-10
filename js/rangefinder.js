/*
 * Artemidos - camera rangefinder
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Ranging by angular size. For a rectilinear lens an object of real size H
 * that spans h pixels of the frame sits at
 *
 *     d = H · f / h            where f is the focal length in pixels
 *     f = (frame height / 2) / tan(vertical field of view / 2)
 *
 * The browser will not tell us the field of view, so the app starts from a
 * typical phone value and lets the user CALIBRATE against an object of known
 * size at a known distance. Calibration is stored per device. Until it is
 * done, every reading is flagged as an estimate, because an uncalibrated
 * guess at the field of view can be 20 % out and the distance error scales
 * with it exactly.
 */
(function (global) {
  'use strict';

  var TARGETS = [
    { id: 'person', n: 'Adult standing', v: 1.75, axis: 'height' },
    { id: 'person-shoulder', n: 'Adult shoulder width', v: 0.45, axis: 'width' },
    { id: 'door', n: 'Standard door', v: 2.03, axis: 'height' },
    { id: 'storey', n: 'Building storey', v: 3.0, axis: 'height' },
    { id: 'car-h', n: 'Car, height (saloon)', v: 1.45, axis: 'height' },
    { id: 'car-l', n: 'Car, length (saloon)', v: 4.5, axis: 'width' },
    { id: 'car-w', n: 'Car, width', v: 1.8, axis: 'width' },
    { id: 'suv-h', n: 'SUV, height', v: 1.8, axis: 'height' },
    { id: 'van-h', n: 'Van, height', v: 2.5, axis: 'height' },
    { id: 'bus-h', n: 'Bus, height', v: 3.2, axis: 'height' },
    { id: 'bus-l', n: 'Bus, length', v: 12, axis: 'width' },
    { id: 'truck-h', n: 'Articulated truck, height', v: 4.0, axis: 'height' },
    { id: 'wheel', n: 'Car wheel diameter', v: 0.65, axis: 'height' },
    { id: 'plate', n: 'Number plate width (EU)', v: 0.52, axis: 'width' },
    { id: 'container', n: 'Shipping container, height', v: 2.59, axis: 'height' },
    { id: 'container-l', n: 'Shipping container, 20 ft length', v: 6.06, axis: 'width' },
    { id: 'lamp', n: 'Street lamp column', v: 8, axis: 'height' },
    { id: 'pole', n: 'Telegraph pole', v: 9, axis: 'height' },
    { id: 'fence', n: 'Fence panel', v: 1.8, axis: 'height' },
    { id: 'window', n: 'Domestic window', v: 1.2, axis: 'height' },
    { id: 'moto', n: 'Motorcycle, length', v: 2.1, axis: 'width' },
    { id: 'goal', n: 'Football goal, height', v: 2.44, axis: 'height' },
    { id: 'custom', n: 'Custom size…', v: 1, axis: 'height' }
  ];

  var DEFAULT_HFOV = 66;    /* degrees, typical phone main camera */
  var MIN_SPAN = 0.004;     /* smallest bracket, as a fraction of the frame */
  var DZOOM_MAX = 8;        /* digital preview magnification, when the camera offers none */

  function focalRatio() {
    /* focal length expressed as a multiple of the frame height */
    var cal = A.store.get('rf.focalRatio', null);
    return cal || null;
  }

  function estimatedFocalRatio(vidW, vidH) {
    var hfovR = DEFAULT_HFOV * Math.PI / 180;
    var fPxW = (vidW / 2) / Math.tan(hfovR / 2);
    return fPxW / vidH;   /* same focal length, expressed against frame height */
  }

  /* ══ range section tabs ═══════════════════════════════════════════════
     Flash to bang is a ranging tool, so it belongs beside the camera and the
     reticle rather than on a separate menu. */

  var RANGE_TABS = [
    { id: 'range?tab=camera', label: 'Camera' },
    { id: 'range?tab=mil',    label: 'Mil relation' },
    { id: 'flash',            label: 'Flash to bang' }
  ];

  A.rangeTabs = function (activeId) {
    var active = activeId === 'flash' ? 'flash' : 'range?tab=' + activeId;
    var row = A.UI.chips(RANGE_TABS, active, function (id) {
      if (id !== active) A.Router.go(id);
    });
    row.classList.add('wrap');
    return row;
  };

  /* ══ view ═════════════════════════════════════════════════════════════ */

  function render(host, params) {
    var tab = params.query.tab || A.store.get('rf.tab', 'camera');
    if (['camera', 'mil', 'calibrate'].indexOf(tab) < 0) tab = 'camera';

    /* Calibration is a screen of its own, reached by the button at the bottom
       of the camera page. It is deliberately NOT one of the tab chips and is
       never remembered as the tab to return to: it is a thing done once per
       camera, not a mode the rangefinder sits in. */
    if (tab === 'calibrate') {
      A.setTitle('Calibrate camera', { back: true });
      renderCamera(host, true);
      return;
    }

    A.store.set('rf.tab', tab);
    A.setTitle('Rangefinder');
    host.appendChild(A.rangeTabs(tab));

    if (tab === 'camera') renderCamera(host);
    else renderMil(host);
  }

  function renderCamera(host, calibrating) {
    var st = A.store.get('rf.state', { target: 'person', custom: '1.75', top: 0.28, bottom: 0.72 });
    if (!(st.top >= 0 && st.top < st.bottom && st.bottom <= 1)) { st.top = 0.28; st.bottom = 0.72; }
    /* the sliding cross, as a fraction of the view width */
    if (!(st.crossX >= 0 && st.crossX <= 1)) st.crossX = 0.72;
    function save() { A.store.set('rf.state', st); }

    var stage = A.el('.rf-stage');
    var video = A.el('video', { playsinline: true, muted: true, autoplay: true });
    video.playsInline = true; video.muted = true;
    stage.appendChild(video);

    var overlay = A.el('.rf-overlay');
    stage.appendChild(overlay);

    var topH = A.el('.rf-handle');
    var botH = A.el('.rf-handle');
    overlay.appendChild(topH);
    overlay.appendChild(botH);

    /* ── the separation crosses ──
       A fixed cross on the optical axis and one that slides across it. The
       fixed one is green and sits at the exact centre because that is the only
       line of sight the lens geometry is honest about: everything else is
       measured as an angle away from it. The sliding one is red so the two
       can never be confused at a glance in bright light.

       Both are held deliberately faint. They are a measuring instrument laid
       over the world, and an overlay you cannot see past is an overlay that
       gets in the way of the thing you are trying to look at. */
    var xCentre = A.el('.rf-cross.rf-cross-c');
    var xSlide = A.el('.rf-cross.rf-cross-s');
    overlay.appendChild(xCentre);
    overlay.appendChild(xSlide);
    xSlide.style.pointerEvents = 'auto';

    overlay.style.pointerEvents = 'none';
    topH.style.pointerEvents = 'auto';
    botH.style.pointerEvents = 'auto';

    var hud = A.el('.rf-hud');
    var distEl = A.el('.rf-dist', { text: '—' });
    var subEl = A.el('.rf-sub', { text: '' });
    hud.appendChild(A.el('div', null, [distEl, subEl]));
    /* the separation read-out lives INSIDE the HUD, pushed to the right, so it
       shares the gradient strip and can never sit over the distance figure.
       It is appended HERE, after the hud exists: the first version of this
       appended to hud five lines before hud was created, and the whole page
       died on an undefined appendChild. */
    var sepEl = A.el('.rf-sep');
    hud.appendChild(sepEl);
    stage.appendChild(hud);

    var noCam = A.el('.rf-nocam', { text: A.tr('Starting the camera…') });
    stage.appendChild(noCam);

    /* a strip compass and the up/down angle across the foot of the view,
       the same pair the clinometer shows */
    var rfStrip = (typeof A.stripCompass === 'function') ? A.stripCompass({ angle: true }) : null;
    if (rfStrip) { rfStrip.el.classList.add('cam-strip', 'cam-strip-top'); stage.appendChild(rfStrip.el); }

    host.appendChild(stage);

    var controls = A.UI.card();
    host.appendChild(controls);
    var out = A.el('div');
    host.appendChild(out);
    /* On the camera page this holds the button through to the calibration
       screen. On the calibration screen it holds the calibration itself,
       which needs the same live preview and the same reticle the ranging
       uses, which is why both are the one view under a flag. */
    var calib = A.el('div');
    host.appendChild(calib);

    var stream = null, vidW = 0, vidH = 0;
    var track = null, zoomCaps = null;
    /* Optical zoom multiplies the focal length, so the maths must divide it
       back out against the zoom in force when the camera was calibrated.
       Without that, zooming in to reach a distant target would report the
       target as far closer than it is. */
    var zoom = A.store.get('rf.zoom', 1);
    /* Most Android WebViews report no zoom capability at all, which would
       leave the tool with no way to reach a distant target. Digital zoom is
       the fallback: the preview is CSS-scaled, so it captures no extra
       detail, but the same drag of a handle now covers fewer video pixels
       and the bracket can be placed far more finely. It changes only how the
       frame is displayed, never the focal length, so it is divided out in
       frameFraction() and deliberately left out of currentFocalRatio(). */
    var dzoom = A.store.get('rf.dzoom', 1);

    /* ── handle dragging ── */
    function place() {
      var h = stage.clientHeight || 1;
      topH.style.top = (st.top * h - 22) + 'px';
      botH.style.top = (st.bottom * h - 22) + 'px';
      xSlide.style.left = (st.crossX * 100) + '%';
    }

    /* ── the separation maths ──
       The offset from the centre in SCREEN pixels is converted back to VIDEO
       pixels first, because the preview is cropped by object-fit: cover and
       may be digitally magnified on top of that - a screen pixel is not a
       video pixel and treating them as the same is how an overlay measurement
       silently goes wrong.

       Then the angle off the axis is simply dx / focal length, both in video
       pixels, and the width on the ground is that tangent times the range:

           separation = range × dx / focal

       WHICH ASSUMES BOTH OBJECTS ARE THE SAME DISTANCE AWAY. Two trees across
       a field, the ends of a bridge, the width of a building face: those are
       what this measures. One thing near and one thing far are not separated
       by this figure and nothing on the screen can tell the difference, so the
       read-out says which question it is answering. */
    function separation() {
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (!vidW || !vidH || !sw || !sh) return null;
      var fr = currentFocalRatio();
      if (!fr) return null;
      var scale = Math.max(sw / vidW, sh / vidH) * dzoom;
      var dxScreen = (st.crossX - 0.5) * sw;
      var dxVideo = dxScreen / scale;
      var fPx = fr * vidH;
      if (!(fPx > 0)) return null;
      var tan = dxVideo / fPx;
      var rad = Math.atan(tan);
      var r = distance();
      return {
        deg: rad * 180 / Math.PI,
        /* MILLIRADIANS, not NATO mils. dx/focal IS the tangent, so rad×1000 is
           the true milliradian and it is the figure the width is computed from.
           The NATO mil divides the circle into 6400 rather than 6283 and is
           about 2 per cent smaller; this page names both rather than printing
           'mil' and leaving the reader to guess which one it meant. */
        mrad: rad * 1000,
        nato: rad * 6400 / (2 * Math.PI),
        range: r,
        width: (isFinite(r) && r > 0) ? Math.abs(tan) * r : NaN
      };
    }

    function paintSep() {
      var s2 = separation();
      if (!s2) { sepEl.textContent = ''; return; }
      var ang = A.fmtNum(Math.abs(s2.deg), 3) + '°  ·  ' + A.fmtNum(Math.abs(s2.mrad), 3) +
        ' mrad  ·  ' + A.fmtNum(Math.abs(s2.nato), 3) + ' NATO mil';
      var side = s2.deg >= 0 ? 'right' : 'left';
      if (!isFinite(s2.width)) {
        sepEl.textContent = ang + ' ' + side + '  ·  bracket a target for the width';
        return;
      }
      sepEl.textContent = ang + ' ' + side + '  ·  ' +
        A.U.fmt('length', s2.width, { sig: 4 }) + ' apart at ' + A.U.fmtRange(s2.range, { sig: 4 });
    }

    function bindDrag(el, key) {
      var dragging = false;
      el.addEventListener('pointerdown', function (e) {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var r = stage.getBoundingClientRect();
        var f = A.clamp((e.clientY - r.top) / r.height, 0, 1);
        /* A 2 % floor here capped the range at about 90 m for a person.
           0.4 % lets the lines close far enough for long shots; accuracy at
           that subtense is poor, which the read-out says rather than hides,
           and optical zoom is the real answer. */
        if (key === 'top') st.top = Math.min(f, st.bottom - MIN_SPAN);
        else st.bottom = Math.max(f, st.top + MIN_SPAN);
        place();
        update();
      });
      el.addEventListener('pointerup', function () { dragging = false; save(); });
      el.addEventListener('pointercancel', function () { dragging = false; save(); });
    }
    bindDrag(topH, 'top');
    bindDrag(botH, 'bottom');

    /* the sliding cross moves in x only: it measures across the view, and
       letting it wander vertically would invite reading a diagonal as a width */
    (function () {
      var dragging = false;
      xSlide.addEventListener('pointerdown', function (e) {
        dragging = true; xSlide.setPointerCapture(e.pointerId); e.preventDefault();
      });
      xSlide.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var r = stage.getBoundingClientRect();
        st.crossX = A.clamp((e.clientX - r.left) / r.width, 0, 1);
        place(); paintSep();
      });
      function done() { dragging = false; save(); }
      xSlide.addEventListener('pointerup', done);
      xSlide.addEventListener('pointercancel', done);
    })();

    /* ── the maths ── */
    function targetSize() {
      var t = TARGETS.filter(function (x) { return x.id === st.target; })[0] || TARGETS[0];
      if (t.id === 'custom') {
        var v = A.U.from('length', A.parseNum(st.custom));
        return isFinite(v) && v > 0 ? v : NaN;
      }
      return t.v;
    }

    /* screen fraction -> fraction of the actual video frame, allowing for
       the crop that object-fit: cover applies */
    function frameFraction() {
      var sw = stage.clientWidth, sh = stage.clientHeight;
      if (!vidW || !vidH || !sw || !sh) return NaN;
      var scale = Math.max(sw / vidW, sh / vidH) * dzoom;
      var shownVideoPx = sh / scale;                   /* video px visible vertically */
      var spanScreen = (st.bottom - st.top) * sh;
      var spanVideoPx = spanScreen / scale;
      if (spanVideoPx <= 0 || shownVideoPx <= 0) return NaN;
      return { spanVideoPx: spanVideoPx, shownVideoPx: shownVideoPx };
    }

    function calibZoom() { return A.store.get('rf.calibZoom', 1) || 1; }

    function currentFocalRatio() {
      var base = focalRatio() || (vidW && vidH ? estimatedFocalRatio(vidW, vidH) : null);
      if (!base) return null;
      return base * (zoom / calibZoom());
    }

    function distance() {
      var ff = frameFraction();
      var H = targetSize();
      var fr = currentFocalRatio();
      if (!ff || !isFinite(H) || !fr || !vidH) return NaN;
      var fPx = fr * vidH;
      return H * fPx / ff.spanVideoPx;
    }

    function update() {
      /* the separation read-out shares the range with the bracket, so it is
         repainted from the same place rather than on its own timer */
      paintSep();
      var d = distance();
      if (!isFinite(d) || d <= 0) {
        distEl.textContent = '—';
        subEl.textContent = '';
        A.clear(out);
        return;
      }
      var calibrated = !!focalRatio();
      var shown = A.U.fmtRange(d, { sig: 4 }).split(' ');
      distEl.innerHTML = A.esc(shown[0]) + ' <small>' + A.esc(shown.slice(1).join(' ')) + '</small>';
      /* Against the full sensor frame, not the screen: under digital zoom the
         two differ by the zoom factor, and it is the frame fraction the
         distance is actually derived from. */
      var frac = frameFraction();
      subEl.textContent = (calibrated ? '' : 'uncalibrated estimate · ') +
        A.fmtNum(targetSize(), 3) + ' m fitted to ' +
        A.fmtNum(100 * (frac.spanVideoPx / vidH), 3) + ' % of frame height';

      A.clear(out);

      /* While calibrating, the distance is the input, not the output: showing
         a computed range here would be reasoning in a circle and reads as the
         app disagreeing with the tape measure. Show the fit instead, which is
         the thing that actually has to be got right. */
      if (calibrating) {
        var fc = A.UI.card();
        fc.appendChild(A.UI.metric('Object fitted between the lines',
          A.U.fmt('length', targetSize(), { sig: 4 }), { big: true, icon: 'target' }));
        fc.appendChild(A.UI.metric('Bracket span', Math.round(frac.spanVideoPx) + ' pixels',
          { sub: A.fmtNum(100 * (frac.spanVideoPx / vidH), 3) + ' % of frame height',
            icon: frac.spanVideoPx < 200 ? 'warn' : 'check' }));
        if (frac.spanVideoPx < 200) {
          fc.appendChild(A.UI.note('Fill more of the frame before saving. A short bracket calibrates the field of view loosely, and every distance the app reports afterwards inherits that looseness.'));
        }
        out.appendChild(fc);
        return;
      }

      var card = A.UI.card();
      card.appendChild(A.UI.metric('Distance', A.U.fmtRange(d, { sig: 5 }), { big: true, icon: 'route' }));
      card.appendChild(A.UI.metric('Also', A.fmtNum(d, 5) + ' m   ·   ' + A.fmtNum(d / 0.9144, 5) + ' yd'));

      var ff = frameFraction();
      var ang = 2 * Math.atan((ff.spanVideoPx / 2) / (currentFocalRatio() * vidH)) * 180 / Math.PI;
      card.appendChild(A.UI.metric('Angle subtended', A.fmtNum(ang, 4) + '°',
        { sub: A.fmtNum(ang * 17.7778, 4) + ' mils (NATO)' }));
      card.appendChild(A.UI.metric('Walking time at 5 km/h', A.fmtDur(d / 5000)));
      card.appendChild(A.UI.metric('Running time at 12 km/h', A.fmtDur(d / 12000),
        { sub: 'a fit person moving with purpose, not a sprint' }));
      card.appendChild(A.UI.metric('Sound delay from there', A.fmtNum(d / 340.3, 3) + ' s',
        { sub: 'Useful as a cross-check with the Flash to bang tool.' }));

      /* one pixel of bracket error, expressed as distance: the honest
         precision figure, and it grows with the square of the range */
      var spanPx = ff.spanVideoPx;
      var perPx = Math.abs(d - (targetSize() * currentFocalRatio() * vidH / (spanPx + 1)));
      /* This is the precision of the reading, not a fault: it says how much
         the answer moves if the bracket is one pixel off. It was labelled
         "Error per pixel of bracket", which reads as a malfunction rather
         than as a tolerance, so it is named for what it is. */
      card.appendChild(A.UI.metric('Precision at this bracket', '± ' + A.U.fmtRange(perPx, { sig: 3 }) + ' per pixel',
        { icon: perPx > d * 0.1 ? 'warn' : 'check',
          sub: spanPx < 30
            ? 'The target spans only ' + Math.round(spanPx) + ' pixels, so one pixel of slack moves the answer a long way. Zoom in.'
            : 'The target spans ' + Math.round(spanPx) + ' pixels, which is a good bracket. ' +
              'One pixel of slack moves the distance by ' + A.fmtNum(100 * perPx / d, 2) + ' %.' }));

      if (!calibrated && !calibrating) {
        var warn = A.UI.metric('Not calibrated', 'assuming a ' + DEFAULT_HFOV + '° field of view', { icon: 'warn' });
        warn.querySelector('.metric-ic').style.color = 'var(--warn)';
        card.appendChild(warn);
        card.appendChild(A.el('button.btn.ghost.block', {
          text: 'Calibrate this camera',
          onclick: function () { A.Router.go('range?tab=calibrate'); }
        }));
      }
      out.appendChild(card);
      out.appendChild(A.UI.note('Accuracy depends entirely on the real size being right and the object being upright and side-on. A 10 % error in the assumed size is a 10 % error in the distance.'));
      assetContext(out, d);
      hazardContext(out, d);
    }

    function applyZoom(z) {
      if (!track || !zoomCaps) return;
      zoom = A.clamp(z, zoomCaps.min || 1, zoomCaps.max || 1);
      A.store.set('rf.zoom', zoom);
      try {
        track.applyConstraints({ advanced: [{ zoom: zoom }] });
      } catch (e) { /* some devices refuse mid-stream constraint changes */ }
      update();
    }

    function applyDigitalZoom(z) {
      dzoom = A.clamp(z, 1, DZOOM_MAX);
      A.store.set('rf.dzoom', dzoom);
      video.style.transformOrigin = 'center center';
      video.style.transform = dzoom > 1 ? 'scale(' + dzoom + ')' : '';
      update();
    }

    function hasOpticalZoom() {
      return !!(zoomCaps && (zoomCaps.max || 1) > (zoomCaps.min || 1));
    }

    /* Effective magnification of the preview, whichever kind is in use.
       Only ever one of the two is offered, so they never compound. */
    function zoomLabel() {
      if (hasOpticalZoom()) {
        return 'Optical zoom  ·  ' + A.fmtNum(zoom, 3) + '×' +
          (Math.abs(zoom - calibZoom()) > 0.01 ? '  (calibrated at ' + A.fmtNum(calibZoom(), 3) + '×)' : '');
      }
      return 'Digital zoom  ·  ' + A.fmtNum(dzoom, 3) + '×';
    }

    /* ── controls ── */
    function paintControls() {
      A.clear(controls);
      controls.appendChild(A.UI.select({
        label: 'Fit this known object between the lines', value: st.target,
        options: TARGETS.map(function (t) {
          return { value: t.id, label: t.n + (t.id === 'custom' ? '' : '  (' + A.U.fmt('length', t.v, { sig: 3 }) + ')') };
        }),
        onchange: function (e) { st.target = e.target.value; save(); paintControls(); update(); }
      }));
      if (st.target === 'custom') {
        controls.appendChild(A.UI.field({
          label: 'Real size of the object', inputmode: 'decimal', suffix: A.U.sym('length'), value: st.custom,
          oninput: function (e) { st.custom = e.target.value; save(); update(); }
        }));
      }

      var optical = hasOpticalZoom();
      var zWrap = A.el('.fld');
      zWrap.appendChild(A.el('span.fld-lab', { text: zoomLabel() }));
      var zIn = A.el('input.fld-in', optical ? {
        type: 'range',
        min: zoomCaps.min || 1, max: zoomCaps.max || 1,
        step: zoomCaps.step || 0.1, value: zoom
      } : {
        type: 'range', min: 1, max: DZOOM_MAX, step: 0.25, value: dzoom
      });
      zIn.addEventListener('input', function (e) {
        if (optical) applyZoom(parseFloat(e.target.value));
        else applyDigitalZoom(parseFloat(e.target.value));
        zWrap.querySelector('.fld-lab').textContent = zoomLabel();
      });
      zWrap.appendChild(zIn);
      zWrap.appendChild(A.el('span.fld-hint', {
        text: optical
          ? 'Zoom in to range something distant: it makes the target span more pixels, which is what the ' +
            'measurement depends on. The calculation divides the zoom back out automatically.'
          : 'This camera reports no optical zoom, so this magnifies the preview instead. It adds no detail, ' +
            'but it lets you place the lines on a distant target far more finely, which is where the error ' +
            'at long range comes from. The calculation allows for it automatically.'
      }));
      controls.appendChild(zWrap);
    }

    /* ── calibration ──
       On the camera page this paints only the way through to the calibration
       screen. The calibration itself paints on that screen. */
    function paintCalibration() {
      A.clear(calib);

      if (!calibrating) {
        var done = !!focalRatio();
        var lead = A.UI.card();
        lead.appendChild(A.UI.metric(
          done ? 'Camera calibrated' : 'Camera not calibrated',
          done
            ? A.fmtNum(A.store.get('rf.hfov', 0), 4) + '° horizontal field of view'
            : 'Distances are estimates until you calibrate',
          { icon: done ? 'check' : 'warn' }));
        lead.appendChild(A.el('button.btn' + (done ? '.ghost' : '') + '.block', {
          text: done ? 'Re-calibrate camera' : 'Calibrate camera',
          style: { marginTop: '10px' },
          onclick: function () { A.Router.go('range?tab=calibrate'); }
        }));
        calib.appendChild(lead);
        return;
      }

      calib.appendChild(A.el('.sec-lab', { text: 'Calibrate this camera' }));
      var card = A.UI.card();

      card.appendChild(A.UI.note(focalRatio()
        ? 'Calibrated to a horizontal field of view of ' + A.fmtNum(A.store.get('rf.hfov', 0), 4) +
          '°. Re-calibrate if you switch to a different lens on this phone.'
        : 'For accurate distances, calibrate once: stand a measured distance from an object whose size you know, ' +
          'fit the two lines to its top and bottom above, enter the distance and save. One calibration covers this camera.'));

      var dIn = A.UI.field({
        label: 'Measured distance to the fitted object', inputmode: 'decimal', suffix: A.U.sym('dist'),
        hint: 'Pace it out or use a tape. Ten to twenty metres works well.'
      });
      card.appendChild(dIn);
      card.appendChild(A.el('button.btn.block', {
        text: 'Save calibration',
        onclick: function () {
          var d = A.U.from('dist', A.parseNum(dIn.input.value));
          var H = targetSize();
          var ff = frameFraction();
          if (!isFinite(d) || d <= 0) { A.toast('Enter the measured distance'); return; }
          if (!isFinite(H) || !ff) { A.toast('Fit the object between the lines first'); return; }
          var fPx = d * ff.spanVideoPx / H;
          A.store.set('rf.focalRatio', fPx / vidH);
          A.store.set('rf.calibZoom', zoom);
          var hfov = 2 * Math.atan((vidW / 2) / fPx) * 180 / Math.PI;
          A.store.set('rf.hfov', hfov);
          A.haptic(20);
          A.toast('Calibrated: horizontal field of view ' + A.fmtNum(hfov, 3) + '°');
          update();
          paintCalibration();
          /* the job is done, so hand the camera back to ranging rather than
             leaving the user on a screen with nothing left to do */
          A.Router.go('range?tab=camera');
        }
      }));
      if (focalRatio()) {
        card.appendChild(A.el('button.btn.ghost.block', {
          text: 'Clear calibration', style: { marginTop: '8px' },
          onclick: function () {
            A.store.del('rf.focalRatio');
            A.store.del('rf.hfov');
            A.store.del('rf.calibZoom');
            A.toast('Calibration cleared');
            update();
            paintCalibration();
          }
        }));
      }
      calib.appendChild(card);
    }

    /* ── camera ── */
    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        noCam.textContent = A.tr('This browser cannot open a camera. The Mil relation tab works without one.');
        return;
      }
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      }).then(function (s) {
        stream = s;
        track = s.getVideoTracks()[0];
        try {
          var caps = track.getCapabilities ? track.getCapabilities() : {};
          if (caps && caps.zoom) {
            zoomCaps = caps.zoom;
            zoom = A.clamp(zoom, zoomCaps.min || 1, zoomCaps.max || 1);
            applyZoom(zoom);
          }
        } catch (e) { zoomCaps = null; }
        if (!hasOpticalZoom()) applyDigitalZoom(dzoom);
        video.srcObject = s;
        return video.play();
      }).then(function () {
        noCam.hidden = true;
        vidW = video.videoWidth;
        vidH = video.videoHeight;
        paintControls();
        place();
        update();
      }).catch(function (err) {
        noCam.hidden = false;
        noCam.textContent = err && err.name === 'NotAllowedError'
          ? A.tr('Camera permission refused. Allow camera access to range with the grid, or use the Mil relation tab, which needs no camera.')
          : A.tr('Could not start the camera (') + (err && err.name ? err.name : 'unknown') + A.tr('). The Mil relation tab works without one.');
      });
    }

    video.addEventListener('loadedmetadata', function () {
      vidW = video.videoWidth; vidH = video.videoHeight;
      place(); update();
    });

    paintControls();
    paintCalibration();
    place();
    start();

    var onResize = function () { place(); update(); };
    window.addEventListener('resize', onResize);

    render._off = function () {
      window.removeEventListener('resize', onResize);
      if (rfStrip) { try { rfStrip.stop(); } catch (e) {} }
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null; track = null; zoomCaps = null;
    };
  }

  /* ══ mil relation ═════════════════════════════════════════════════════
     The formula every reticle is built on:
        distance (m) = size (m) × 1000 / mils
     Works with binocular, scope and compass reticles, and needs no camera. */

  function renderMil(host) {
    var st = A.store.get('rf.mil', { size: '1.75', mils: '', dist: '', system: 'nato', mode: 'mils' });
    function save() { A.store.set('rf.mil', st); }

    var SYSTEMS = [
      { id: 'nato', n: 'NATO mil (6400 per circle)', per: 6400 },
      { id: 'wp', n: 'Warsaw Pact mil (6000 per circle)', per: 6000 },
      { id: 'mrad', n: 'True milliradian (6283 per circle)', per: 2 * Math.PI * 1000 },
      { id: 'moa', n: 'Minute of angle (21600 per circle)', per: 21600 }
    ];

    function sys() { return SYSTEMS.filter(function (s) { return s.id === st.system; })[0] || SYSTEMS[0]; }

    /* one unit of this system, in radians */
    function unitRad() { return 2 * Math.PI / sys().per; }

    var card = A.UI.card();
    var out = A.el('div');

    var sizeIn = A.UI.field({
      label: 'Known size of the object', inputmode: 'decimal', suffix: A.U.sym('length'), value: st.size,
      hint: 'Adult 1.75 m, door 2.03 m, car height 1.45 m, storey 3 m.',
      oninput: function (e) { st.size = e.target.value; save(); calc(); }
    });
    var milsIn = A.UI.field({
      label: 'Angle it subtends', inputmode: 'decimal', value: st.mils,
      oninput: function (e) { st.mils = e.target.value; st.mode = 'mils'; save(); calc(); }
    });
    var distIn = A.UI.field({
      label: 'or a known distance', inputmode: 'decimal', suffix: A.U.sym('dist'), value: st.dist,
      hint: 'Enter the angle to get the distance, or the distance to get the angle you should read.',
      oninput: function (e) { st.dist = e.target.value; st.mode = 'dist'; save(); calc(); }
    });

    card.appendChild(A.UI.select({
      label: 'Reticle system', value: st.system,
      options: SYSTEMS.map(function (s) { return { value: s.id, label: s.n }; }),
      onchange: function (e) { st.system = e.target.value; save(); calc(); }
    }));
    card.appendChild(sizeIn);
    card.appendChild(milsIn);
    card.appendChild(distIn);
    card.appendChild(out);
    host.appendChild(card);

    function calc() {
      A.clear(out);
      var H = A.U.from('length', A.parseNum(st.size));
      if (!isFinite(H) || H <= 0) { out.appendChild(A.UI.note('Enter the real size of the object.')); return; }

      var d, ang;
      if (st.mode === 'dist') {
        d = A.U.from('dist', A.parseNum(st.dist));
        if (!isFinite(d) || d <= 0) return;
        ang = 2 * Math.atan(H / (2 * d)) / unitRad();
        milsIn.input.value = A.fmtNum(ang, 5);
        st.mils = milsIn.input.value;
      } else {
        ang = A.parseNum(st.mils);
        if (!isFinite(ang) || ang <= 0) { out.appendChild(A.UI.note('Read the angle off the reticle and enter it.')); return; }
        d = H / (2 * Math.tan(ang * unitRad() / 2));
        distIn.input.value = A.fmtNum(A.U.to('dist', d), 6);
        st.dist = distIn.input.value;
      }
      save();

      out.appendChild(A.UI.metric('Distance', A.U.fmtRange(d, { sig: 5 }), { big: true, icon: 'route' }));
      out.appendChild(A.UI.metric('Angle', A.fmtNum(ang, 5) + ' ' + (st.system === 'moa' ? 'MOA' : 'mils')));
      out.appendChild(A.UI.metric('In degrees', A.fmtNum(ang * unitRad() * 180 / Math.PI, 5) + '°'));

      /* a one-unit misread is the dominant error, so state what it costs */
      var dPlus = H / (2 * Math.tan((ang + 1) * unitRad() / 2));
      out.appendChild(A.UI.metric('Error from a one-unit misread', '± ' + A.U.fmtRange(Math.abs(d - dPlus), { sig: 3 }),
        { icon: 'warn', sub: 'Angular ranging is least forgiving at long range: at small subtense, half a mil either way moves the answer a long way.' }));

      out.appendChild(A.UI.section('Reference'));
      var q = A.UI.card(null, 'tight');
      [1, 2, 3, 5, 10, 20].forEach(function (mm) {
        q.appendChild(A.UI.metric(mm + ' ' + (st.system === 'moa' ? 'MOA' : 'mils'),
          A.U.fmtRange(H / (2 * Math.tan(mm * unitRad() / 2)), { sig: 4 })));
      });
      out.appendChild(q);
      out.appendChild(A.UI.note('The classic shortcut, distance = size × 1000 ÷ mils, assumes a true milliradian. A NATO mil is about 1.7 % smaller than a true milliradian, which is why the reticle system is selectable above.'));
      assetContext(out, d);
      hazardContext(out, d);
    }

    calc();
  }


  /* ══ what this distance MEANS ═══════════════════════════════════════════
     A number of metres is only half an answer. The questions that follow it
     are always the same: how long until that thing reaches me, and am I inside
     what it can do to me. This block answers both from the catalogue, so it
     works for a tank, a drone, a rifle or a thermal sight without knowing
     anything specific about any of them.

     Every asset stores its speeds in metres per second and its ranges as
     specs measured in distance. Arrival time is the distance over the speed;
     the range bands come from comparing this distance with those specs. */

  function assetContext(host, d) {
    var C = window.ART_CATALOG;
    if (!C || !(d > 0)) return;

    var st = A.store.get('rf.asset', { cat: '', id: '' });
    function save() { A.store.set('rf.asset', st); }

    host.appendChild(A.UI.section('What is at this distance'));

    /* ── plain travel times, no asset needed ── */
    var tc = A.UI.card(null, 'tight');
    [['Walking', 1.4], ['Marching pace', 1.8], ['Running', 3.3],
     ['Sprinting', 7.0], ['Vehicle in town', 13.9], ['Vehicle on a road', 25.0]]
      .forEach(function (m) {
        tc.appendChild(A.UI.metric(m[0], A.fmtDur(d / m[1] / 3600),
          { sub: A.fmtNum(m[1] * 3.6, 3) + ' km/h' }));
      });
    host.appendChild(tc);

    /* ── WHAT CAN ACTUALLY ANSWER THE QUESTION ──
       This block asks two things of an asset: how long it needs to cover this
       distance, and whether this distance is inside something it can reach.
       An entry answers the first only if it has a real SPEED, and the second
       only if it has a spec measured in DISTANCE.

       Chemical agents have neither. Their figures are onset times and
       persistence in hours, so they were offered in the list and then produced
       an empty card - worse than not being offered. They are handled properly
       below instead, as a drifting cloud, which is the form the question
       actually takes for a gas. */
    function usable(r) {
      var hasSpeed = (r.speeds || []).some(function (sp) { return sp[1] > 0; });
      var hasRange = (r.specs || []).some(function (sp) { return sp[2] === 'dist' && sp[1] > 0; });
      return hasSpeed || hasRange;
    }
    var cats = C.cats().filter(function (c) {
      return C.in(c.id).some(usable);
    });
    /* Everything below depends on the chosen category/asset, so it redraws into
       a local container when the selects change. A full Router.refresh would
       rebuild the whole screen and reset the scroll to the top, pulling the
       picker out from under the user's thumb. */
    var box = A.el('div');
    host.appendChild(box);

    function draw() {
      A.clear(box);

      var pick = A.UI.card();
      box.appendChild(pick);
      pick.appendChild(A.UI.note(
        'Pick an asset to see how long it needs to cover this distance, and where ' +
        'this distance falls inside what it can reach, see or hit.'));

      pick.appendChild(A.UI.select({
        label: 'Category', value: st.cat,
        options: [{ value: '', label: 'Choose…' }].concat(cats.map(function (c) {
          return { value: c.id, label: c.n };
        })),
        onchange: function (e) { st.cat = e.target.value; st.id = ''; save(); draw(); }
      }));

      if (st.cat) {
      var items = C.in(st.cat).filter(usable).slice().sort(function (a, b) {
        var ca = a.country || '\uffff', cb = b.country || '\uffff';
        if (ca !== cb) return ca < cb ? -1 : 1;
        return (a.n || '') < (b.n || '') ? -1 : 1;
      });
      pick.appendChild(A.UI.select({
        label: 'Asset', value: st.id,
        options: [{ value: '', label: 'Choose…' }].concat(items.map(function (r) {
          return { value: r.id, label: (r.country ? r.country + '  ·  ' : '') + r.n };
        })),
        onchange: function (e) { st.id = e.target.value; save(); draw(); }
      }));
    }

    if (!st.id) return;
    var rec = C.all().filter(function (r) { return r.id === st.id; })[0];
    if (!rec) return;

    /* ── how long it needs to reach you ── */
    if (rec.speeds && rec.speeds.length) {
      var sc = A.UI.card(null, 'tight');
      sc.appendChild(A.UI.metric('Asset', rec.n, rec.country ? { sub: rec.country } : null));
      rec.speeds.forEach(function (sp) {
        var mps = sp[1];
        if (!(mps > 0)) return;
        sc.appendChild(A.UI.metric('Time to cover this distance at ' + sp[0].toLowerCase(),
          A.fmtDur(d / mps / 3600),
          { sub: A.U.fmt('speed', mps, { sig: 3 }) }));
      });
      box.appendChild(sc);
    }

    /* ── where this distance sits in what it can reach ──
       Every spec measured in distance is a threshold: inside it the asset can
       do that thing to you, outside it cannot. Sorting them and finding where
       this distance falls turns a table into an answer. */
    var ranges = (rec.specs || []).filter(function (sp) {
      return sp[2] === 'dist' && sp[1] > 0;
    }).map(function (sp) {
      return { label: sp[0], m: sp[1], note: sp[3] || '' };
    }).sort(function (a, b) { return a.m - b.m; });

    if (ranges.length) {
      var rc = A.UI.card(null, 'tight');
      rc.appendChild(A.el('.rf-band-head', { text: 'You are at ' + A.U.fmtRange(d, { sig: 4 }) }));
      ranges.forEach(function (r) {
        var inside = d <= r.m;
        var row = A.el('.rf-band' + (inside ? '.in' : '.out'));
        row.appendChild(A.el('span.rf-band-l', { text: r.label }));
        row.appendChild(A.el('span.rf-band-v', { text: A.U.fmtRange(r.m, { sig: 4 }) }));
        row.appendChild(A.el('span.rf-band-s', {
          text: inside ? 'INSIDE' : 'outside by ' + A.U.fmtRange(d - r.m, { sig: 3 })
        }));
        rc.appendChild(row);
      });
      box.appendChild(rc);

      /* the single sentence that matters */
      var worst = null;
      ranges.forEach(function (r) { if (d <= r.m && (!worst || r.m < worst.m)) worst = r; });
      box.appendChild(A.UI.note(
        worst
          ? 'At this distance you are within "' + worst.label.toLowerCase() + '" of the ' + rec.n +
            (worst.note ? ' (' + worst.note + ')' : '') + '. Treat every band above it as also reaching you.'
          : 'This distance is beyond every range listed for the ' + rec.n +
            '. That is the catalogue figure in good conditions, not a guarantee: assume less margin than the number suggests.'));
    }
    }

    draw();
  }

  /* ══ an airborne hazard at this distance ═══════════════════════════════
     A gas, a smoke or a dust cloud does not have a speed of its own worth
     naming: it goes where the air goes, at very close to the speed of the
     wind. So the useful question is not "how fast is it" but "how long until
     the air between us has moved to me", and that is one division.

     This is deliberately a separate block from the asset list, because the
     answer for a cloud is a different shape of answer, and the assumptions it
     rests on have to be said out loud rather than buried in a table. */
  function hazardContext(host, d) {
    if (!(d > 0)) return;
    var st = A.store.get('rf.haz', { wind: '', dir: 'toward' });
    function save() { A.store.set('rf.haz', st); }

    host.appendChild(A.UI.section('If it is airborne'));
    var card = A.UI.card();
    host.appendChild(card);
    card.appendChild(A.UI.note(
      'Gas, smoke and dust travel at the speed of the wind, not at a speed of ' +
      'their own. Give the wind and this says how long the air between you has ' +
      'to move.'));

    card.appendChild(A.UI.field({
      label: 'Wind speed', inputmode: 'decimal', suffix: 'km/h', value: st.wind,
      oninput: function (e) { st.wind = e.target.value; save(); calc(); }
    }));
    card.appendChild(A.UI.select({
      label: 'Wind direction', value: st.dir,
      options: [{ value: 'toward', label: 'Blowing from it towards me' },
                { value: 'across', label: 'Blowing across, at right angles' },
                { value: 'away', label: 'Blowing from me towards it' }],
      onchange: function (e) { st.dir = e.target.value; save(); calc(); }
    }));

    var out = A.el('div');
    host.appendChild(out);

    function calc() {
      A.clear(out);
      var kmh = A.parseNum(st.wind);
      if (!(kmh > 0)) {
        out.appendChild(A.UI.note('Enter a wind speed. With no wind at all a cloud still spreads outward slowly by its own diffusion, but far more slowly than any wind moves it.'));
        return;
      }
      var ms = kmh / 3.6;
      var c = A.UI.card(null, 'tight');

      if (st.dir === 'away') {
        c.appendChild(A.UI.metric('It is going away from you', 'not arriving on this wind',
          { sub: 'Watch for the wind backing or veering: it is the change that catches people, not the steady state.' }));
      } else if (st.dir === 'across') {
        c.appendChild(A.UI.metric('It is crossing your front', 'not arriving directly',
          { sub: 'A crosswind still spreads the edge of a cloud sideways as it travels. Move upwind, not backwards.' }));
      } else {
        c.appendChild(A.UI.metric('Time until it reaches you', A.fmtDur(d / ms / 3600),
          { big: true, sub: 'at ' + A.fmtNum(ms, 3) + ' m/s, the wind speed' }));
        c.appendChild(A.UI.metric('Half of that', A.fmtDur(d / ms / 7200),
          { sub: 'how long you have if you want to be gone before the leading edge' }));
      }

      /* how far you can get in the same time, so the answer is actionable */
      if (st.dir === 'toward') {
        var secs = d / ms;
        c.appendChild(A.UI.metric('You could walk', A.U.fmtRange(1.4 * secs, { sig: 3 }), { sub: 'in that time' }));
        c.appendChild(A.UI.metric('You could run', A.U.fmtRange(3.3 * secs, { sig: 3 }), { sub: 'crosswind is the direction that counts' }));
      }
      out.appendChild(c);

      out.appendChild(A.UI.note(
        'This assumes one steady wind and flat ground, and it takes no account of gusts, ' +
        'terrain channelling the flow, or the cloud sinking into low ground if the agent is ' +
        'heavier than air - which most are. Treat it as the EARLIEST it could arrive, and move ' +
        'crosswind and uphill rather than straight away from it.'));
    }
    calc();
  }

  A.Router.register('range', {
    render: render,
    teardown: function () { if (render._off) { render._off(); render._off = null; } }
  });

})(window);
