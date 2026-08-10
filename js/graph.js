/*
 * Artemidos - function grapher
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 */
(function (global) {
  'use strict';

  var COLORS = ['#5FD3B2', '#7FA8D9', '#E0A54F', '#E5674F', '#B98BE0', '#61C7E0'];

  function renderGraph(host) {
    var st = A.store.get('graph.state', null) || {
      fns: [{ src: 'sin(x)', on: true }],
      view: { cx: 0, cy: 0, sx: 40, sy: 40 },  /* pixels per unit */
      deg: false
    };
    if (!st.fns.length) st.fns = [{ src: '', on: true }];

    function save() { A.store.set('graph.state', st); }

    A.setTitle('Graph', {
      actions: [
        { icon: 'refresh', label: 'Reset view', onclick: function () { st.view = { cx: 0, cy: 0, sx: 40, sy: 40 }; save(); draw(); } }
      ]
    });

    /* ── function editor ── */
    var editor = A.UI.card();

    function paintEditor() {
      A.clear(editor);
      st.fns.forEach(function (f, i) {
        var row = A.el('.fn-row');
        row.appendChild(A.el('.fn-dot', {
          style: { background: f.on ? COLORS[i % COLORS.length] : 'var(--border-2)' },
          onclick: function () { f.on = !f.on; save(); paintEditor(); draw(); }
        }));
        var inp = A.el('input.fld-in', {
          value: f.src, placeholder: 'e.g. sin(x), x^2-3, 1/x',
          autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false'
        });
        inp.addEventListener('input', A.debounce(function () { f.src = inp.value; save(); draw(); }, 180));
        row.appendChild(inp);
        row.appendChild(A.el('button.fn-del', {
          html: Icons.svg('close'), 'aria-label': 'Remove',
          onclick: function () { st.fns.splice(i, 1); if (!st.fns.length) st.fns.push({ src: '', on: true }); save(); paintEditor(); draw(); }
        }));
        editor.appendChild(row);
      });
      editor.appendChild(A.el('button.btn.ghost.block', {
        html: Icons.svg('plus') + ' Add function',
        onclick: function () { st.fns.push({ src: '', on: true }); save(); paintEditor(); }
      }));
      var deg = A.el('button.btn.ghost.block', {
        text: st.deg ? 'Angles: degrees' : 'Angles: radians',
        style: { marginTop: '8px' },
        onclick: function () { st.deg = !st.deg; save(); paintEditor(); draw(); }
      });
      editor.appendChild(deg);
    }

    /* ── canvas ── */
    var wrap = A.el('.graph-wrap');
    var cv = A.el('canvas');
    var readout = A.el('.graph-read', { text: '' });
    wrap.appendChild(cv);
    wrap.appendChild(readout);

    var W = 0, H = 0, dpr = Math.min(2, global.devicePixelRatio || 1);
    var compiled = [];

    function resize() {
      var w = wrap.clientWidth || 320;
      var h = Math.round(Math.min(Math.max(w * 1.05, 260), 460));
      W = w; H = h;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.height = h + 'px';
      draw();
    }

    function x2p(x) { return W / 2 + (x - st.view.cx) * st.view.sx; }
    function y2p(y) { return H / 2 - (y - st.view.cy) * st.view.sy; }
    function p2x(px) { return st.view.cx + (px - W / 2) / st.view.sx; }
    function p2y(py) { return st.view.cy - (py - H / 2) / st.view.sy; }

    /* grid spacing that lands on 1/2/5 x 10^n so labels stay readable */
    function niceStep(pxPerUnit, targetPx) {
      var raw = targetPx / pxPerUnit;
      var mag = Math.pow(10, Math.floor(Math.log10(raw)));
      var n = raw / mag;
      var mult = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
      return mult * mag;
    }

    function css(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }

    function compile() {
      compiled = st.fns.map(function (f) {
        if (!f.on || !f.src.trim()) return null;
        try { return Expr.compile(f.src, { deg: st.deg }); }
        catch (e) { return { err: e.message }; }
      });
    }

    function draw() {
      if (!W) return;
      compile();
      var ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = css('--surface', '#121722');
      ctx.fillRect(0, 0, W, H);

      var gridC = css('--border', '#232C3B');
      var axisC = css('--muted', '#8A97AA');
      var textC = css('--muted', '#8A97AA');

      var stepX = niceStep(st.view.sx, 64);
      var stepY = niceStep(st.view.sy, 52);

      /* grid */
      ctx.lineWidth = 1;
      ctx.strokeStyle = gridC;
      ctx.beginPath();
      var x0 = Math.ceil(p2x(0) / stepX) * stepX;
      for (var gx = x0; gx <= p2x(W); gx += stepX) {
        var px = Math.round(x2p(gx)) + 0.5;
        ctx.moveTo(px, 0); ctx.lineTo(px, H);
      }
      var y0 = Math.ceil(p2y(H) / stepY) * stepY;
      for (var gy = y0; gy <= p2y(0); gy += stepY) {
        var py = Math.round(y2p(gy)) + 0.5;
        ctx.moveTo(0, py); ctx.lineTo(W, py);
      }
      ctx.stroke();

      /* axes */
      ctx.strokeStyle = axisC;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      var ax = Math.round(x2p(0)) + 0.5, ay = Math.round(y2p(0)) + 0.5;
      if (ax > -2 && ax < W + 2) { ctx.moveTo(ax, 0); ctx.lineTo(ax, H); }
      if (ay > -2 && ay < H + 2) { ctx.moveTo(0, ay); ctx.lineTo(W, ay); }
      ctx.stroke();

      /* tick labels */
      ctx.fillStyle = textC;
      ctx.font = '10px ' + css('--font', 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      var labelY = A.clamp(ay + 3, 3, H - 14);
      for (var lx = x0; lx <= p2x(W); lx += stepX) {
        if (Math.abs(lx) < stepX / 1e6) continue;
        ctx.fillText(A.fmtNum(lx, 4), x2p(lx), labelY);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      var labelX = A.clamp(ax - 4, 24, W - 3);
      for (var ly = y0; ly <= p2y(0); ly += stepY) {
        if (Math.abs(ly) < stepY / 1e6) continue;
        ctx.fillText(A.fmtNum(ly, 4), labelX, y2p(ly));
      }

      /* curves - sampled per device pixel, with a break at discontinuities
         so 1/x does not draw a false vertical line through the asymptote */
      var scope = {};
      compiled.forEach(function (c, i) {
        if (!c || c.err) return;
        ctx.strokeStyle = COLORS[i % COLORS.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        var pen = false, prevY = null;
        var jumpLimit = H * 2.5;
        for (var px2 = 0; px2 <= W; px2 += 1) {
          scope.x = p2x(px2);
          var v;
          try { v = c.fn(scope); } catch (e) { v = NaN; }
          if (v == null || !isFinite(v)) { pen = false; prevY = null; continue; }
          var py2 = y2p(v);
          if (!pen) { ctx.moveTo(px2, py2); pen = true; }
          else if (prevY != null && Math.abs(py2 - prevY) > jumpLimit) { ctx.moveTo(px2, py2); }
          else ctx.lineTo(px2, py2);
          prevY = py2;
        }
        ctx.stroke();
      });

      var errs = compiled.map(function (c, i) { return c && c.err ? (st.fns[i].src + ': ' + c.err) : null; }).filter(Boolean);
      readout.textContent = errs.length ? errs[0] : '';
      readout.style.color = errs.length ? 'var(--danger)' : '';
      readout.hidden = !errs.length && !readout._trace;
    }

    /* ── gestures: drag to pan, pinch to zoom, tap to trace ── */
    var pts = {}, lastDist = 0, moved = false;

    function onDown(e) {
      wrap.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      moved = false;
    }
    function onMove(e) {
      if (!pts[e.pointerId]) return;
      var ids = Object.keys(pts);
      var prev = pts[e.pointerId];
      var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };

      if (ids.length === 1) {
        st.view.cx -= dx / st.view.sx;
        st.view.cy += dy / st.view.sy;
        draw();
      } else if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) {
          var k = d / lastDist;
          st.view.sx = A.clamp(st.view.sx * k, 1e-6, 1e7);
          st.view.sy = A.clamp(st.view.sy * k, 1e-6, 1e7);
          draw();
        }
        lastDist = d;
      }
    }
    function onUp(e) {
      var wasSingle = Object.keys(pts).length === 1;
      delete pts[e.pointerId];
      if (!Object.keys(pts).length) { lastDist = 0; save(); }
      if (wasSingle && !moved) trace(e);
    }

    function trace(e) {
      var r = cv.getBoundingClientRect();
      var x = p2x(e.clientX - r.left);
      var lines = [];
      compiled.forEach(function (c, i) {
        if (!c || c.err) return;
        var v;
        try { v = c.fn({ x: x }); } catch (err) { v = NaN; }
        if (isFinite(v)) lines.push(st.fns[i].src + ' = ' + A.fmtNum(v, 6));
      });
      readout._trace = lines.length;
      readout.hidden = !lines.length;
      readout.style.color = '';
      readout.textContent = lines.length ? ('x = ' + A.fmtNum(x, 6) + '   ' + lines.join('   ')) : '';
    }

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      var k = Math.pow(0.9985, e.deltaY);
      st.view.sx = A.clamp(st.view.sx * k, 1e-6, 1e7);
      st.view.sy = A.clamp(st.view.sy * k, 1e-6, 1e7);
      draw();
    }, { passive: false });

    host.appendChild(A.mathTabs('graph'));
    host.appendChild(wrap);
    host.appendChild(editor);
    host.appendChild(A.UI.note('Drag to pan, pinch or scroll to zoom, tap the plot to read a value. Functions use x as the variable and accept the same syntax as the calculator.'));

    paintEditor();
    requestAnimationFrame(resize);
    var ro = new ResizeObserver(resize);
    ro.observe(wrap);
    var onTheme = A.Bus.on('theme', draw);
    renderGraph._off = function () { ro.disconnect(); A.Bus.off('theme', onTheme); };
  }

  A.Router.register('graph', {
    render: renderGraph,
    teardown: function () { if (renderGraph._off) { renderGraph._off(); renderGraph._off = null; } }
  });

})(window);
