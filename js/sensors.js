/* ══ SENSORS ══════════════════════════════════════════════════════════════

   What this phone actually has, and what it is reading right now.

   THE ANSWER "NOT AVAILABLE" IS THE POINT OF THIS PAGE. Phone specifications
   lie by omission: a listing says "barometer" and the part is a pressure
   sensor the operating system will not hand to a web page, or the phone has no
   magnetometer at all and the compass app has been quietly using the GPS track
   the whole time. Before you trust a reading in the field it is worth knowing
   whether there is a part behind it.

   So every sensor is PROBED, not assumed. Where a reading can be taken it is
   shown live. Where the part is missing, or the browser will not expose it, it
   says so and says which of the two it is - because "this phone has no
   barometer" and "Android will not give a web page the barometer" are different
   facts and only one of them is about the phone.

   Nothing here is recorded, sent or kept. Permission is asked at the moment a
   sensor needs it and not before. */
(function (global) {
  'use strict';
  var A = global.A;
  var Icons = global.Icons;

  var UNKNOWN = 'not available';

  /* A metric's VALUE is not translated by the shared helper, and correctly so:
     it normally holds a computed number, and one that happened to read like an
     English label must never be rewritten. This page is the exception, because
     most of its values are words rather than numbers. So the status words are
     translated here, by name, and nothing else is touched. */
  var STATUS = { 'not available': 1, 'available': 1, 'checking…': 1,
                 'from the tilt sensor': 1, 'present if permission is given': 1 };

  function trStatus(v) {
    if (!STATUS[v]) return v;
    var I = global.ArtI18n;
    return I ? I.auto(v) : v;
  }

  function row(host, label, value, sub) {
    host.appendChild(A.UI.metric(label, trStatus(value == null ? UNKNOWN : String(value)),
      sub ? { sub: sub } : null));
  }

  function num(v, sig) {
    return (typeof v === 'number' && isFinite(v)) ? A.fmtNum(v, sig || 4) : null;
  }

  /* ── battery ──────────────────────────────────────────────────────────── */
  function batteryCard(host) {
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Battery' }));
    host.appendChild(c);

    if (!navigator.getBattery) {
      c.appendChild(A.UI.metric('Battery status', UNKNOWN,
        { sub: 'the browser does not expose it' }));
      c.appendChild(A.el('.lrow-s', {
        style: { whiteSpace: 'normal', marginTop: '6px' },
        text: 'Voltage, current and cell temperature are not offered to a web page on any ' +
              'platform. Only a native build can read those.'
      }));
      return;
    }

    var body = A.el('div');
    c.appendChild(body);
    navigator.getBattery().then(function (b) {
      function paint() {
        A.clear(body);
        row(body, 'Charge', Math.round(b.level * 100) + ' %');
        row(body, 'On charge', b.charging ? 'yes' : 'no',
          b.charging ? 'plugged in' : 'running on the cell');
        if (b.charging && isFinite(b.chargingTime) && b.chargingTime > 0) {
          row(body, 'Full in', Math.round(b.chargingTime / 60) + ' min');
        }
        if (!b.charging && isFinite(b.dischargingTime) && b.dischargingTime > 0 &&
            b.dischargingTime !== Infinity) {
          row(body, 'Empty in', Math.round(b.dischargingTime / 60) + ' min',
            'at the present draw, which will change');
        }
        row(body, 'Voltage, current, temperature', null,
          'not exposed to a web page on any platform');
      }
      ['chargingchange', 'levelchange', 'chargingtimechange', 'dischargingtimechange']
        .forEach(function (e) { b.addEventListener(e, paint); });
      paint();
    }).catch(function () {
      c.appendChild(A.UI.metric('Battery status', UNKNOWN, { sub: 'the request was refused' }));
    });
  }

  /* ── position ─────────────────────────────────────────────────────────── */
  function gnssCard(host) {
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Position' }));
    host.appendChild(c);

    if (!navigator.geolocation) {
      c.appendChild(A.UI.metric('Positioning', UNKNOWN, { sub: 'no geolocation on this device' }));
      return;
    }

    var body = A.el('div');
    c.appendChild(body);
    body.appendChild(A.UI.empty('Press Read position.'));

    var watch = null;
    var btn = A.el('button.btn.block.btn-go', {
      html: Icons.svg('target') + ' Read position',
      style: { marginTop: '10px' },
      onclick: function () {
        A.haptic();
        if (watch !== null) {
          navigator.geolocation.clearWatch(watch); watch = null;
          btn.innerHTML = Icons.svg('target') + ' Read position';
          return;
        }
        btn.innerHTML = Icons.svg('stop') + ' Stop';
        A.clear(body);
        body.appendChild(A.UI.empty('Waiting for a fix…'));
        watch = navigator.geolocation.watchPosition(function (p) {
          var co = p.coords;
          A.clear(body);
          row(body, 'Latitude', num(co.latitude, 8) + '°');
          row(body, 'Longitude', num(co.longitude, 8) + '°');
          row(body, 'Accuracy', num(co.accuracy, 3) + ' m',
            co.accuracy <= 10 ? 'a real satellite fix' :
              (co.accuracy <= 50 ? 'satellite, poor sky or few birds' :
                'this is a network fix, not satellites'));
          row(body, 'Altitude', co.altitude == null ? null : num(co.altitude, 5) + ' m',
            co.altitudeAccuracy == null ? 'no vertical fix' :
              '± ' + num(co.altitudeAccuracy, 3) + ' m');
          row(body, 'Speed', co.speed == null ? null : num(co.speed, 3) + ' m/s');
          row(body, 'Heading over ground', co.heading == null ? null : num(co.heading, 4) + '°',
            'from movement, not from the compass');
          row(body, 'Fix age', Math.round((Date.now() - p.timestamp) / 1000) + ' s');
        }, function (e) {
          A.clear(body);
          body.appendChild(A.UI.empty(
            e.code === 1 ? 'Permission refused.' :
              (e.code === 3 ? 'Timed out with no fix. Try under open sky.' : 'Position unavailable.')));
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
      }
    });
    c.appendChild(btn);
    c.appendChild(A.el('.lrow-s', {
      style: { whiteSpace: 'normal', marginTop: '8px' },
      text: 'WHICH CONSTELLATION AND HOW MANY SATELLITES CANNOT BE READ FROM A WEB PAGE. The ' +
            'browser hands over a position and an accuracy circle and nothing about where they ' +
            'came from. The accuracy figure is the tell: a few metres is satellites, tens of ' +
            'metres is a weak fix, and hundreds of metres is the phone guessing from cell masts ' +
            'and wifi and calling it a position.'
    }));
    return function () { if (watch !== null) navigator.geolocation.clearWatch(watch); };
  }

  /* ── motion and orientation ───────────────────────────────────────────── */
  function motionCard(host) {
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Motion, tilt and compass' }));
    host.appendChild(c);

    var body = A.el('div');
    c.appendChild(body);

    var seen = { acc: false, accG: false, gyro: false, orient: false, mag: null, abs: false };
    var last = {};

    function paint() {
      A.clear(body);
      row(body, 'Accelerometer', seen.accG
        ? num(last.gx, 3) + ', ' + num(last.gy, 3) + ', ' + num(last.gz, 3) + ' m/s²' : null,
        seen.accG ? 'x, y, z including gravity' : 'no reading offered');
      row(body, 'Linear acceleration', seen.acc
        ? num(last.ax, 3) + ', ' + num(last.ay, 3) + ', ' + num(last.az, 3) + ' m/s²' : null,
        seen.acc ? 'gravity removed' : 'no reading offered');
      row(body, 'Gyroscope', seen.gyro
        ? num(last.ra, 3) + ', ' + num(last.rb, 3) + ', ' + num(last.rg, 3) + ' °/s' : null,
        seen.gyro ? 'rate of turn' : 'no reading offered');
      row(body, 'Tilt', seen.orient
        ? 'pitch ' + num(last.beta, 3) + '°, roll ' + num(last.gamma, 3) + '°' : null);
      row(body, 'Compass', seen.orient && last.alpha != null ? num(last.alpha, 4) + '°' : null,
        seen.abs ? 'absolute, referenced to magnetic north'
                 : (seen.orient ? 'RELATIVE ONLY: this is not a bearing' : 'no reading offered'));
      row(body, 'Magnetometer', seen.mag == null ? null : (seen.mag ? 'present' : null),
        seen.abs ? 'the compass reads absolute, so there is one'
                 : 'a phone with no magnetometer gives orientation but never a true heading');
      row(body, 'Screen refresh', last.hz ? Math.round(last.hz) + ' Hz' : null,
        'how fast the sensors are being delivered');
    }

    function onMotion(e) {
      if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x != null) {
        seen.accG = true;
        last.gx = e.accelerationIncludingGravity.x;
        last.gy = e.accelerationIncludingGravity.y;
        last.gz = e.accelerationIncludingGravity.z;
      }
      if (e.acceleration && e.acceleration.x != null) {
        seen.acc = true;
        last.ax = e.acceleration.x; last.ay = e.acceleration.y; last.az = e.acceleration.z;
      }
      if (e.rotationRate && e.rotationRate.alpha != null) {
        seen.gyro = true;
        last.ra = e.rotationRate.alpha; last.rb = e.rotationRate.beta; last.rg = e.rotationRate.gamma;
      }
      if (e.interval) last.hz = 1000 / e.interval;
    }
    function onOrient(e) {
      seen.orient = true;
      last.alpha = (typeof e.webkitCompassHeading === 'number') ? e.webkitCompassHeading : e.alpha;
      last.beta = e.beta; last.gamma = e.gamma;
      if (e.absolute === true || typeof e.webkitCompassHeading === 'number') {
        seen.abs = true; seen.mag = true;
      }
    }

    function attach() {
      global.addEventListener('devicemotion', onMotion);
      global.addEventListener('deviceorientationabsolute', onOrient);
      global.addEventListener('deviceorientation', onOrient);
    }

    /* iOS demands a gesture before it will hand over motion at all */
    var needAsk = (typeof DeviceMotionEvent !== 'undefined' &&
                   typeof DeviceMotionEvent.requestPermission === 'function');
    if (needAsk) {
      c.appendChild(A.el('button.btn.block.btn-go', {
        html: Icons.svg('check') + ' Allow motion sensors',
        style: { marginTop: '10px' },
        onclick: function () {
          A.haptic();
          DeviceMotionEvent.requestPermission().then(function (r) {
            if (r === 'granted') attach();
          }).catch(function () {});
        }
      }));
    } else {
      attach();
    }

    paint();
    var t = setInterval(function () {
      if (!document.body.contains(body)) { clearInterval(t); return; }
      paint();
    }, 500);

    return function () {
      clearInterval(t);
      global.removeEventListener('devicemotion', onMotion);
      global.removeEventListener('deviceorientationabsolute', onOrient);
      global.removeEventListener('deviceorientation', onOrient);
    };
  }

  /* ── ambient sensors ──────────────────────────────────────────────────── */
  function ambientCard(host) {
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Ambient sensors' }));
    host.appendChild(c);
    var body = A.el('div');
    c.appendChild(body);

    /* The generic sensor API is the only route to these, and it is guarded:
       the class has to exist AND construction has to succeed AND a reading has
       to arrive. Checking only that the class exists reports a barometer on
       phones that have none. */
    var probes = [
      ['Barometer', 'Barometer', 'pressure', ' hPa', 'air pressure, and altitude from it'],
      ['Light sensor', 'AmbientLightSensor', 'illuminance', ' lx', 'used for screen brightness'],
      ['Magnetometer', 'Magnetometer', null, ' µT', 'the raw field, three axes'],
      ['Gravity sensor', 'GravitySensor', null, ' m/s²', 'which way is down'],
      ['Absolute orientation', 'AbsoluteOrientationSensor', null, '', 'fused compass and tilt']
    ];

    var state = {};
    probes.forEach(function (p) { state[p[0]] = { status: 'checking', value: null }; });

    function paint() {
      A.clear(body);
      probes.forEach(function (p) {
        var st = state[p[0]];
        if (st.status === 'ok') {
          row(body, p[0], st.value + p[3], p[4]);
        } else if (st.status === 'blocked') {
          row(body, p[0], UNKNOWN, 'the part is there but permission was refused');
        } else if (st.status === 'nopart') {
          row(body, p[0], UNKNOWN, 'this phone has no such sensor');
        } else if (st.status === 'noapi') {
          row(body, p[0], UNKNOWN, 'the browser does not offer this sensor');
        } else {
          row(body, p[0], 'checking…', p[4]);
        }
      });
      /* the ones no phone has, said plainly rather than left off the list */
      row(body, 'Thermometer', UNKNOWN,
        'almost no phone has an air thermometer; the ones inside read the battery and the chips');
      row(body, 'Hygrometer', UNKNOWN,
        'humidity sensors are rare and are not offered to a web page');
      row(body, 'Clinometer', 'from the tilt sensor',
        'measured, not sensed: see Navigation for the instrument');
      avRow('Microphone', 'audioinput', 'see Radio › Listen, which uses it to decode Morse');
      avRow('Camera', 'videoinput', 'see Rangefinder › Camera, which ranges with it');
    }

    /* Microphone and camera, counted rather than assumed. enumerateDevices
       lists what is fitted WITHOUT asking for permission first: until
       permission is given the labels come back blank, but the kind and the
       count are still there, and that is all this page needs. Asking for the
       stream instead would put a permission prompt in front of a page whose
       whole job is to answer a question. */
    var av = { audioinput: { status: 'checking', n: 0 },
               videoinput: { status: 'checking', n: 0 } };

    function avRow(label, kind, note) {
      var st = av[kind];
      if (st.status === 'ok') {
        row(body, label, st.n === 1 ? 'available'
                                    : st.n + ' × ' + trStatus('available'), note);
      } else if (st.status === 'none') {
        row(body, label, UNKNOWN, 'this phone has none fitted');
      } else if (st.status === 'noapi') {
        row(body, label, UNKNOWN, 'the browser does not report the devices');
      } else {
        row(body, label, 'checking…', note);
      }
    }

    probes.forEach(function (p) {
      var name = p[0], cls = p[1], field = p[2];
      if (typeof global[cls] !== 'function') { state[name].status = 'noapi'; paint(); return; }
      try {
        var sensor = new global[cls]({ frequency: 1 });
        var settled = false;
        sensor.addEventListener('reading', function () {
          settled = true;
          var v;
          if (field) v = num(sensor[field], 5);
          else if (sensor.x != null) v = num(sensor.x, 3) + ', ' + num(sensor.y, 3) + ', ' + num(sensor.z, 3);
          else v = 'reading';
          state[name] = { status: 'ok', value: v };
          paint();
        });
        sensor.addEventListener('error', function (e) {
          settled = true;
          state[name].status = (e && e.error && e.error.name === 'NotAllowedError') ? 'blocked' : 'nopart';
          paint();
        });
        sensor.start();
        /* no reading and no error inside three seconds means nothing is there */
        setTimeout(function () {
          if (!settled) { state[name].status = 'nopart'; paint(); }
        }, 3000);
      } catch (e) {
        state[name].status = 'nopart';
        paint();
      }
    });

    var md = navigator.mediaDevices;
    if (!md || typeof md.enumerateDevices !== 'function') {
      av.audioinput.status = av.videoinput.status = 'noapi';
    } else {
      md.enumerateDevices().then(function (list) {
        ['audioinput', 'videoinput'].forEach(function (kind) {
          var n = 0;
          for (var i = 0; i < list.length; i++) if (list[i].kind === kind) n++;
          av[kind] = { status: n ? 'ok' : 'none', n: n };
        });
        paint();
      }, function () {
        av.audioinput.status = av.videoinput.status = 'noapi';
        paint();
      });
    }

    paint();
  }

  /* ── the device itself ────────────────────────────────────────────────── */
  function deviceCard(host) {
    var c = A.UI.card();
    c.appendChild(A.el('.sec-lab', { text: 'Device' }));
    host.appendChild(c);
    var n = navigator;
    row(c, 'Screen', global.screen ? (screen.width + ' × ' + screen.height + ' pt') : null,
      global.devicePixelRatio ? (global.devicePixelRatio + '× pixel ratio') : null);
    row(c, 'Processors', n.hardwareConcurrency || null, 'logical cores reported');
    row(c, 'Memory', n.deviceMemory ? n.deviceMemory + ' GB' : null,
      n.deviceMemory ? 'rounded down by the browser' : 'not reported');
    row(c, 'Touch points', n.maxTouchPoints || null, 'fingers the screen can follow');
    row(c, 'Network', (n.connection && n.connection.effectiveType) || null,
      (n.connection && n.connection.downlink) ? '~' + n.connection.downlink + ' Mbit/s' : null);
    row(c, 'Online', n.onLine ? 'yes' : 'no', 'as the phone sees it, which can be wrong');
    row(c, 'Native shell', (global.Capacitor && global.Capacitor.isNativePlatform &&
      global.Capacitor.isNativePlatform()) ? 'yes' : 'no',
      'a native build can reach sensors a web page cannot');
  }

  function render(host) {
    var teardowns = [];

    host.appendChild(A.UI.note(
      'Everything below is probed on this phone, right now. Nothing is read from a ' +
      'specification sheet, so "not available" means it genuinely did not answer. Nothing is ' +
      'recorded and nothing leaves the device.'));

    deviceCard(host);
    batteryCard(host);
    var t1 = gnssCard(host); if (t1) teardowns.push(t1);
    var t2 = motionCard(host); if (t2) teardowns.push(t2);
    ambientCard(host);

    host.appendChild(A.UI.note(
      'A web page sees less than a native app. Where this says the browser will not offer a ' +
      'sensor, the part may well be in the phone and simply out of reach here. Where it says ' +
      'the phone has no such sensor, the part answered that it does not exist.'));

    return function () { teardowns.forEach(function (f) { try { f(); } catch (e) {} }); };
  }

  global.ArtSensors = { render: render };

})(window);
