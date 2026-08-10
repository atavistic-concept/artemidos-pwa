/*
 * Artemidos - unit catalogue
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * Every category converts through one SI base unit.
 *   [code, name, factor]        factor = how many base units in one of this unit
 *   [code, name, {to, from}]    for affine (temperature) and reciprocal (fuel) scales
 *
 * Factors are exact where an exact definition exists (inch = 0.0254 m by
 * international agreement, lb = 0.45359237 kg, BTU = IT calorie based) and
 * otherwise carry enough digits that a round trip is lossless at 10 sig figs.
 */
(function (global) {
  'use strict';

  var PI = Math.PI;

  /* group: which section of the category list this appears under */
  var CATS = {

  /* ── common ─────────────────────────────────────────────────────────── */

  length: { name: 'Length', icon: 'ruler', group: 'common', base: 'm', units: [
    ['mm', 'Millimeter', 1e-3], ['cm', 'Centimeter', 1e-2], ['m', 'Meter', 1],
    ['km', 'Kilometer', 1000], ['in', 'Inch', 0.0254], ['ft', 'Foot', 0.3048],
    ['yd', 'Yard', 0.9144], ['mi', 'Mile', 1609.344], ['nmi', 'Nautical mile', 1852],
    ['nm', 'Nanometer', 1e-9], ['µm', 'Micrometer', 1e-6], ['dm', 'Decimeter', 0.1],
    ['dam', 'Decameter', 10], ['hm', 'Hectometer', 100],
    ['thou', 'Thou / mil', 2.54e-5], ['hand', 'Hand', 0.1016], ['link', 'Link', 0.201168],
    ['fathom', 'Fathom', 1.8288], ['rod', 'Rod', 5.0292], ['chain', 'Chain', 20.1168],
    ['furlong', 'Furlong', 201.168], ['cable', 'Cable', 185.2], ['league', 'League', 4828.032],
    ['ft (survey)', 'US survey foot', 1200 / 3937],
    ['Å', 'Angstrom', 1e-10], ['AU', 'Astronomical unit', 1.495978707e11],
    ['ly', 'Light year', 9.4607304725808e15], ['pc', 'Parsec', 3.0856775814913673e16]
  ] },

  mass: { name: 'Mass / weight', icon: 'stats', group: 'common', base: 'kg', units: [
    ['g', 'Gram', 1e-3], ['kg', 'Kilogram', 1], ['t', 'Tonne (metric)', 1000],
    ['mg', 'Milligram', 1e-6], ['µg', 'Microgram', 1e-9],
    ['oz', 'Ounce', 0.028349523125], ['lb', 'Pound', 0.45359237],
    ['st', 'Stone', 6.35029318], ['gr', 'Grain', 6.479891e-5],
    ['dr', 'Dram', 1.7718451953125e-3],
    ['cwt UK', 'Hundredweight (UK)', 50.80234544], ['cwt US', 'Hundredweight (US)', 45.359237],
    ['ton UK', 'Long ton (UK)', 1016.0469088], ['ton US', 'Short ton (US)', 907.18474],
    ['ct', 'Carat', 2e-4], ['slug', 'Slug', 14.593902937],
    ['oz t', 'Troy ounce', 0.0311034768], ['lb t', 'Troy pound', 0.3732417216],
    ['u', 'Atomic mass unit', 1.66053906660e-27]
  ] },

  temperature: { name: 'Temperature', icon: 'shadow', group: 'common', base: 'K', units: [
    ['°C', 'Celsius',    { to: function (v) { return v + 273.15; },        from: function (k) { return k - 273.15; } }],
    ['°F', 'Fahrenheit', { to: function (v) { return (v - 32) * 5 / 9 + 273.15; }, from: function (k) { return (k - 273.15) * 9 / 5 + 32; } }],
    ['K',  'Kelvin',     1],
    ['°R', 'Rankine',    { to: function (v) { return v * 5 / 9; },          from: function (k) { return k * 9 / 5; } }],
    ['°Ré','Réaumur',    { to: function (v) { return v * 1.25 + 273.15; },  from: function (k) { return (k - 273.15) * 0.8; } }],
    ['°De','Delisle',    { to: function (v) { return 373.15 - v * 2 / 3; }, from: function (k) { return (373.15 - k) * 1.5; } }],
    ['°N', 'Newton',     { to: function (v) { return v * 100 / 33 + 273.15; }, from: function (k) { return (k - 273.15) * 0.33; } }]
  ] },

  area: { name: 'Area', icon: 'grid', group: 'common', base: 'm²', units: [
    ['mm²', 'Square millimeter', 1e-6], ['cm²', 'Square centimeter', 1e-4],
    ['m²', 'Square meter', 1], ['km²', 'Square kilometer', 1e6],
    ['ha', 'Hectare', 1e4], ['are', 'Are', 100],
    ['in²', 'Square inch', 6.4516e-4], ['ft²', 'Square foot', 0.09290304],
    ['yd²', 'Square yard', 0.83612736], ['acre', 'Acre', 4046.8564224],
    ['mi²', 'Square mile', 2589988.110336], ['rood', 'Rood', 1011.7141056],
    ['sq rod', 'Square rod', 25.29285264], ['dunam', 'Dunam', 1000],
    ['square', 'Square (100 ft²)', 9.290304]
  ] },

  volume: { name: 'Volume', icon: 'convert', group: 'common', base: 'm³', units: [
    ['mL', 'Milliliter', 1e-6], ['L', 'Liter', 1e-3], ['m³', 'Cubic meter', 1],
    ['cL', 'Centiliter', 1e-5], ['dL', 'Deciliter', 1e-4],
    ['cm³', 'Cubic centimeter', 1e-6], ['mm³', 'Cubic millimeter', 1e-9],
    ['in³', 'Cubic inch', 1.6387064e-5], ['ft³', 'Cubic foot', 0.028316846592],
    ['yd³', 'Cubic yard', 0.764554857984],
    ['gal US', 'Gallon (US)', 3.785411784e-3], ['gal UK', 'Gallon (UK)', 4.54609e-3],
    ['qt US', 'Quart (US)', 9.46352946e-4], ['qt UK', 'Quart (UK)', 1.1365225e-3],
    ['pt US', 'Pint (US)', 4.73176473e-4], ['pt UK', 'Pint (UK)', 5.6826125e-4],
    ['fl oz US', 'Fluid ounce (US)', 2.95735295625e-5], ['fl oz UK', 'Fluid ounce (UK)', 2.84130625e-5],
    ['cup US', 'Cup (US)', 2.365882365e-4], ['cup', 'Cup (metric)', 2.5e-4],
    ['tbsp US', 'Tablespoon (US)', 1.478676478125e-5], ['tsp US', 'Teaspoon (US)', 4.92892159375e-6],
    ['tbsp', 'Tablespoon (metric)', 1.5e-5], ['tsp', 'Teaspoon (metric)', 5e-6],
    ['gill US', 'Gill (US)', 1.1829411825e-4], ['gill UK', 'Gill (UK)', 1.420653125e-4],
    ['bbl oil', 'Barrel (oil)', 0.158987294928], ['bbl US', 'Barrel (US liquid)', 0.119240471196],
    ['bbl UK', 'Barrel (UK)', 0.16365924], ['hhd', 'Hogshead', 0.238480942392],
    ['ac·ft', 'Acre-foot', 1233.48183754752]
  ] },

  velocity: { name: 'Speed / velocity', icon: 'speed', group: 'common', base: 'm/s', units: [
    ['km/h', 'Kilometer/hour', 1 / 3.6], ['mph', 'Mile/hour', 0.44704],
    ['m/s', 'Meter/second', 1], ['kn', 'Knot', 1852 / 3600],
    ['ft/s', 'Foot/second', 0.3048], ['ft/min', 'Foot/minute', 0.00508],
    ['cm/s', 'Centimeter/second', 0.01], ['mm/s', 'Millimeter/second', 1e-3],
    ['m/min', 'Meter/minute', 1 / 60], ['km/min', 'Kilometer/minute', 1000 / 60],
    ['km/s', 'Kilometer/second', 1000], ['mi/min', 'Mile/minute', 26.8224],
    ['mi/s', 'Mile/second', 1609.344], ['in/s', 'Inch/second', 0.0254],
    ['yd/s', 'Yard/second', 0.9144],
    ['Mach', 'Mach (sea level, 15 °C)', 340.294], ['c', 'Speed of light', 299792458]
  ] },

  time: { name: 'Time', icon: 'clock', group: 'common', base: 's', units: [
    ['s', 'Second', 1], ['min', 'Minute', 60], ['h', 'Hour', 3600],
    ['ms', 'Millisecond', 1e-3], ['µs', 'Microsecond', 1e-6], ['ns', 'Nanosecond', 1e-9],
    ['day', 'Day', 86400], ['week', 'Week', 604800], ['fortnight', 'Fortnight', 1209600],
    ['month', 'Month (30 days)', 2592000], ['month avg', 'Month (average)', 2629746],
    ['yr', 'Year (365 days)', 31536000], ['yr Jul', 'Year (Julian)', 31557600],
    ['yr trop', 'Year (tropical)', 31556925.2],
    ['decade', 'Decade', 315576000], ['century', 'Century', 3155760000],
    ['shake', 'Shake', 1e-8]
  ] },

  angle: { name: 'Angle', icon: 'ratio', group: 'common', base: 'rad', units: [
    ['°', 'Degree', PI / 180], ['rad', 'Radian', 1], ['grad', 'Gradian', PI / 200],
    ["'", 'Arcminute', PI / 10800], ['"', 'Arcsecond', PI / 648000],
    ['mil', 'Mil (NATO, 6400)', 2 * PI / 6400], ['mil (6000)', 'Mil (Warsaw Pact, 6000)', 2 * PI / 6000],
    ['turn', 'Turn / revolution', 2 * PI], ['circle', 'Circle', 2 * PI],
    ['quadrant', 'Quadrant', PI / 2], ['sextant', 'Sextant', PI / 3],
    ['point', 'Compass point', 2 * PI / 32]
  ] },

  pressure: { name: 'Pressure', icon: 'physics', group: 'common', base: 'Pa', units: [
    ['bar', 'Bar', 1e5], ['psi', 'Pound-force/inch²', 6894.757293168],
    ['Pa', 'Pascal', 1], ['kPa', 'Kilopascal', 1000], ['MPa', 'Megapascal', 1e6],
    ['hPa', 'Hectopascal', 100], ['mbar', 'Millibar', 100],
    ['atm', 'Atmosphere (standard)', 101325], ['at', 'Atmosphere (technical)', 98066.5],
    ['torr', 'Torr', 133.322368421], ['mmHg', 'Millimeter of mercury', 133.322387415],
    ['inHg', 'Inch of mercury', 3386.388640341],
    ['mmH₂O', 'Millimeter of water', 9.80665], ['inH₂O', 'Inch of water', 249.0889],
    ['kgf/cm²', 'Kilogram-force/cm²', 98066.5], ['psf', 'Pound-force/foot²', 47.880258980336],
    ['ksi', 'Kilopound-force/inch²', 6.894757293168e6]
  ] },

  energy: { name: 'Energy / work', icon: 'bolt', group: 'common', base: 'J', units: [
    ['J', 'Joule', 1], ['kJ', 'Kilojoule', 1000], ['MJ', 'Megajoule', 1e6], ['GJ', 'Gigajoule', 1e9],
    ['cal', 'Calorie (IT)', 4.1868], ['kcal', 'Kilocalorie (IT)', 4186.8],
    ['Wh', 'Watt-hour', 3600], ['kWh', 'Kilowatt-hour', 3.6e6], ['MWh', 'Megawatt-hour', 3.6e9],
    ['BTU', 'British thermal unit (IT)', 1055.05585262], ['therm', 'Therm', 1.05505585262e8],
    ['ft·lbf', 'Foot pound-force', 1.3558179483314], ['hp·h', 'Horsepower-hour', 2.6845195377e6],
    ['erg', 'Erg', 1e-7], ['eV', 'Electronvolt', 1.602176634e-19],
    ['t TNT', 'Ton of TNT', 4.184e9], ['kt TNT', 'Kiloton of TNT', 4.184e12]
  ] },

  power: { name: 'Power', icon: 'bolt', group: 'common', base: 'W', units: [
    ['W', 'Watt', 1], ['kW', 'Kilowatt', 1000], ['MW', 'Megawatt', 1e6], ['GW', 'Gigawatt', 1e9],
    ['mW', 'Milliwatt', 1e-3],
    ['hp', 'Horsepower (mechanical)', 745.6998715823],
    ['PS', 'Horsepower (metric / PS)', 735.49875],
    ['hp (E)', 'Horsepower (electric)', 746],
    ['BTU/h', 'BTU/hour', 0.29307107017], ['BTU/min', 'BTU/minute', 17.5842642102],
    ['ft·lbf/s', 'Foot pound-force/second', 1.3558179483314],
    ['cal/s', 'Calorie/second', 4.1868], ['kcal/h', 'Kilocalorie/hour', 1.163],
    ['TR', 'Ton of refrigeration', 3516.8528420667], ['VA', 'Volt-ampere', 1]
  ] },

  force: { name: 'Force', icon: 'physics', group: 'common', base: 'N', units: [
    ['N', 'Newton', 1], ['kN', 'Kilonewton', 1000], ['mN', 'Millinewton', 1e-3],
    ['kgf', 'Kilogram-force', 9.80665], ['gf', 'Gram-force', 9.80665e-3],
    ['lbf', 'Pound-force', 4.4482216152605], ['ozf', 'Ounce-force', 0.27801385095378],
    ['pdl', 'Poundal', 0.138254954376], ['kip', 'Kip', 4448.2216152605],
    ['dyn', 'Dyne', 1e-5],
    ['tonf UK', 'Ton-force (long)', 9964.01641818352], ['tonf US', 'Ton-force (short)', 8896.443230521]
  ] },

  fuel: { name: 'Fuel economy', icon: 'car', group: 'common', base: 'L/100km', units: [
    ['L/100km', 'Liter/100 km', 1],
    ['km/L', 'Kilometer/liter',   { to: function (v) { return 100 / v; }, from: function (b) { return 100 / b; } }],
    ['mpg US', 'Mile/gallon (US)', { to: function (v) { return 235.2145833 / v; }, from: function (b) { return 235.2145833 / b; } }],
    ['mpg UK', 'Mile/gallon (UK)', { to: function (v) { return 282.4809363 / v; }, from: function (b) { return 282.4809363 / b; } }],
    ['mi/L', 'Mile/liter',         { to: function (v) { return 62.13711922 / v; }, from: function (b) { return 62.13711922 / b; } }],
    ['gal US/100mi', 'Gallon (US)/100 mi', 2.352145833],
    ['L/km', 'Liter/kilometer', 100]
  ] },

  data: { name: 'Data storage', icon: 'grid', group: 'common', base: 'bit', units: [
    ['B', 'Byte', 8], ['kB', 'Kilobyte (1000)', 8000], ['MB', 'Megabyte (1000²)', 8e6],
    ['GB', 'Gigabyte (1000³)', 8e9], ['TB', 'Terabyte', 8e12], ['PB', 'Petabyte', 8e15],
    ['bit', 'Bit', 1], ['kbit', 'Kilobit', 1000], ['Mbit', 'Megabit', 1e6],
    ['Gbit', 'Gigabit', 1e9], ['Tbit', 'Terabit', 1e12],
    ['KiB', 'Kibibyte (1024)', 8192], ['MiB', 'Mebibyte', 8388608],
    ['GiB', 'Gibibyte', 8.589934592e9], ['TiB', 'Tebibyte', 8.796093022208e12],
    ['nibble', 'Nibble', 4], ['EB', 'Exabyte', 8e18]
  ] },

  'data-rate': { name: 'Data transfer', icon: 'radio', group: 'common', base: 'bit/s', units: [
    ['bit/s', 'Bit/second', 1], ['kbit/s', 'Kilobit/second', 1000],
    ['Mbit/s', 'Megabit/second', 1e6], ['Gbit/s', 'Gigabit/second', 1e9],
    ['Tbit/s', 'Terabit/second', 1e12],
    ['B/s', 'Byte/second', 8], ['kB/s', 'Kilobyte/second', 8000],
    ['MB/s', 'Megabyte/second', 8e6], ['GB/s', 'Gigabyte/second', 8e9],
    ['KiB/s', 'Kibibyte/second', 8192], ['MiB/s', 'Mebibyte/second', 8388608]
  ] },

  numbers: { name: 'Number bases', icon: 'calc', group: 'common', type: 'base', bases: [
    ['bin', 'Binary', 2], ['oct', 'Octal', 8], ['dec', 'Decimal', 10], ['hex', 'Hexadecimal', 16],
    ['base3', 'Ternary', 3], ['base4', 'Quaternary', 4], ['base5', 'Quinary', 5],
    ['base12', 'Duodecimal', 12], ['base20', 'Vigesimal', 20],
    ['base32', 'Base 32', 32], ['base36', 'Base 36', 36]
    /* 36 is the ceiling: radices above it have no single-character digits and
       JavaScript's own toString(radix) refuses them. */
  ] },

  currency: { name: 'Currency', icon: 'money', group: 'common', type: 'fx' },

  /* ── mechanics & motion ─────────────────────────────────────────────── */

  'velocity-angular': { name: 'Angular velocity', icon: 'refresh', group: 'mech', base: 'rad/s', units: [
    ['rpm', 'Revolution/minute', 2 * PI / 60], ['rad/s', 'Radian/second', 1],
    ['rev/s', 'Revolution/second', 2 * PI], ['rev/h', 'Revolution/hour', 2 * PI / 3600],
    ['°/s', 'Degree/second', PI / 180], ['°/min', 'Degree/minute', PI / 10800],
    ['rad/min', 'Radian/minute', 1 / 60], ['grad/s', 'Gradian/second', PI / 200]
  ] },

  'accel-linear': { name: 'Acceleration', icon: 'speed', group: 'mech', base: 'm/s²', units: [
    ['m/s²', 'Meter/second²', 1], ['g', 'Standard gravity', 9.80665],
    ['cm/s²', 'Centimeter/second²', 0.01], ['Gal', 'Gal', 0.01],
    ['ft/s²', 'Foot/second²', 0.3048], ['in/s²', 'Inch/second²', 0.0254],
    ['mph/s', 'Mile/hour/second', 0.44704], ['km/h/s', 'Kilometer/hour/second', 1 / 3.6]
  ] },

  'accel-angular': { name: 'Angular acceleration', icon: 'refresh', group: 'mech', base: 'rad/s²', units: [
    ['rad/s²', 'Radian/second²', 1], ['rad/min²', 'Radian/minute²', 1 / 3600],
    ['rev/s²', 'Revolution/second²', 2 * PI], ['rev/min²', 'Revolution/minute²', 2 * PI / 3600],
    ['°/s²', 'Degree/second²', PI / 180]
  ] },

  torque: { name: 'Torque', icon: 'refresh', group: 'mech', base: 'N·m', units: [
    ['N·m', 'Newton meter', 1], ['N·cm', 'Newton centimeter', 0.01], ['kN·m', 'Kilonewton meter', 1000],
    ['kgf·m', 'Kilogram-force meter', 9.80665], ['kgf·cm', 'Kilogram-force centimeter', 0.0980665],
    ['lbf·ft', 'Pound-force foot', 1.3558179483314], ['lbf·in', 'Pound-force inch', 0.1129848290276],
    ['ozf·in', 'Ounce-force inch', 7.0615518e-3], ['dyn·cm', 'Dyne centimeter', 1e-7]
  ] },

  'moment-inertia': { name: 'Moment of inertia', icon: 'refresh', group: 'mech', base: 'kg·m²', units: [
    ['kg·m²', 'Kilogram meter²', 1], ['kg·cm²', 'Kilogram centimeter²', 1e-4],
    ['g·cm²', 'Gram centimeter²', 1e-7], ['lb·ft²', 'Pound foot²', 0.042140110093],
    ['lb·in²', 'Pound inch²', 2.9263965e-4], ['oz·in²', 'Ounce inch²', 1.8289871e-5],
    ['slug·ft²', 'Slug foot²', 1.3558179619]
  ] },

  density: { name: 'Density', icon: 'stats', group: 'mech', base: 'kg/m³', units: [
    ['kg/m³', 'Kilogram/meter³', 1], ['g/cm³', 'Gram/centimeter³', 1000],
    ['kg/L', 'Kilogram/liter', 1000], ['g/L', 'Gram/liter', 1], ['t/m³', 'Tonne/meter³', 1000],
    ['mg/m³', 'Milligram/meter³', 1e-6],
    ['lb/ft³', 'Pound/foot³', 16.018463373960], ['lb/in³', 'Pound/inch³', 27679.904710203],
    ['oz/in³', 'Ounce/inch³', 1729.9940443877],
    ['lb/gal US', 'Pound/gallon (US)', 119.82642731689], ['lb/gal UK', 'Pound/gallon (UK)', 99.776372663102],
    ['slug/ft³', 'Slug/foot³', 515.37881850499]
  ] },

  'specific-volume': { name: 'Specific volume', icon: 'convert', group: 'mech', base: 'm³/kg', units: [
    ['m³/kg', 'Meter³/kilogram', 1], ['L/kg', 'Liter/kilogram', 1e-3],
    ['cm³/g', 'Centimeter³/gram', 1e-3], ['ft³/lb', 'Foot³/pound', 0.062427960576],
    ['ft³/slug', 'Foot³/slug', 1.9403203e-3], ['gal US/lb', 'Gallon (US)/pound', 8.3454045e-3]
  ] },

  'surface-tension': { name: 'Surface tension', icon: 'physics', group: 'mech', base: 'N/m', units: [
    ['N/m', 'Newton/meter', 1], ['mN/m', 'Millinewton/meter', 1e-3],
    ['dyn/cm', 'Dyne/centimeter', 1e-3], ['erg/cm²', 'Erg/centimeter²', 1e-3],
    ['gf/cm', 'Gram-force/centimeter', 0.980665], ['kgf/m', 'Kilogram-force/meter', 9.80665],
    ['lbf/ft', 'Pound-force/foot', 14.5939029], ['lbf/in', 'Pound-force/inch', 175.126835]
  ] },

  'visc-dynamic': { name: 'Viscosity (dynamic)', icon: 'physics', group: 'mech', base: 'Pa·s', units: [
    ['Pa·s', 'Pascal second', 1], ['mPa·s', 'Millipascal second', 1e-3],
    ['P', 'Poise', 0.1], ['cP', 'Centipoise', 1e-3],
    ['N·s/m²', 'Newton second/meter²', 1], ['dyn·s/cm²', 'Dyne second/centimeter²', 0.1],
    ['kgf·s/m²', 'Kilogram-force second/meter²', 9.80665],
    ['lbf·s/ft²', 'Pound-force second/foot²', 47.8802589],
    ['lb/(ft·s)', 'Pound/foot second', 1.48816394], ['lb/(ft·h)', 'Pound/foot hour', 4.1337887e-4]
  ] },

  'visc-kinematic': { name: 'Viscosity (kinematic)', icon: 'physics', group: 'mech', base: 'm²/s', units: [
    ['m²/s', 'Meter²/second', 1], ['St', 'Stokes', 1e-4], ['cSt', 'Centistokes', 1e-6],
    ['mm²/s', 'Millimeter²/second', 1e-6], ['cm²/s', 'Centimeter²/second', 1e-4],
    ['ft²/s', 'Foot²/second', 0.09290304], ['in²/s', 'Inch²/second', 6.4516e-4],
    ['ft²/h', 'Foot²/hour', 2.58064e-5], ['m²/h', 'Meter²/hour', 1 / 3600]
  ] },

  flow: { name: 'Flow (volumetric)', icon: 'convert', group: 'mech', base: 'm³/s', units: [
    ['L/min', 'Liter/minute', 1 / 60000], ['L/s', 'Liter/second', 1e-3], ['L/h', 'Liter/hour', 1 / 3.6e6],
    ['m³/s', 'Meter³/second', 1], ['m³/h', 'Meter³/hour', 1 / 3600], ['m³/min', 'Meter³/minute', 1 / 60],
    ['cfm', 'Foot³/minute', 4.719474432e-4], ['ft³/s', 'Foot³/second', 0.028316846592],
    ['ft³/h', 'Foot³/hour', 7.86579072e-6],
    ['gpm US', 'Gallon (US)/minute', 6.30901964e-5], ['gal US/h', 'Gallon (US)/hour', 1.0515033e-6],
    ['gal US/d', 'Gallon (US)/day', 4.3812637e-8], ['gpm UK', 'Gallon (UK)/minute', 7.5768166e-5],
    ['bbl/d', 'Barrel (oil)/day', 1.8401307e-6]
  ] },

  'flow-mass': { name: 'Flow (mass)', icon: 'convert', group: 'mech', base: 'kg/s', units: [
    ['kg/s', 'Kilogram/second', 1], ['kg/h', 'Kilogram/hour', 1 / 3600], ['kg/min', 'Kilogram/minute', 1 / 60],
    ['g/s', 'Gram/second', 1e-3], ['t/h', 'Tonne/hour', 1000 / 3600],
    ['lb/s', 'Pound/second', 0.45359237], ['lb/min', 'Pound/minute', 0.45359237 / 60],
    ['lb/h', 'Pound/hour', 0.45359237 / 3600], ['ton US/h', 'Short ton/hour', 907.18474 / 3600]
  ] },

  'flow-molar': { name: 'Flow (molar)', icon: 'convert', group: 'mech', base: 'mol/s', units: [
    ['mol/s', 'Mole/second', 1], ['mol/min', 'Mole/minute', 1 / 60], ['mol/h', 'Mole/hour', 1 / 3600],
    ['mmol/s', 'Millimole/second', 1e-3], ['kmol/s', 'Kilomole/second', 1000], ['kmol/h', 'Kilomole/hour', 1000 / 3600]
  ] },

  'mass-flux': { name: 'Mass flux density', icon: 'convert', group: 'mech', base: 'kg/(m²·s)', units: [
    ['kg/(m²·s)', 'Kilogram/meter² second', 1], ['g/(m²·s)', 'Gram/meter² second', 1e-3],
    ['g/(cm²·s)', 'Gram/centimeter² second', 10], ['kg/(m²·h)', 'Kilogram/meter² hour', 1 / 3600],
    ['lb/(ft²·s)', 'Pound/foot² second', 4.88242764], ['lb/(ft²·h)', 'Pound/foot² hour', 1.35622990e-3]
  ] },

  /* ── heat ───────────────────────────────────────────────────────────── */

  'temp-interval': { name: 'Temperature interval', icon: 'shadow', group: 'heat', base: 'K', units: [
    ['ΔK', 'Kelvin interval', 1], ['Δ°C', 'Celsius interval', 1],
    ['Δ°F', 'Fahrenheit interval', 5 / 9], ['Δ°R', 'Rankine interval', 5 / 9],
    ['Δ°Ré', 'Réaumur interval', 1.25]
  ] },

  'heat-capacity': { name: 'Heat capacity', icon: 'shadow', group: 'heat', base: 'J/K', units: [
    ['J/K', 'Joule/kelvin', 1], ['kJ/K', 'Kilojoule/kelvin', 1000],
    ['J/°C', 'Joule/celsius', 1], ['kJ/°C', 'Kilojoule/celsius', 1000],
    ['cal/°C', 'Calorie/celsius', 4.1868], ['kcal/°C', 'Kilocalorie/celsius', 4186.8],
    ['BTU/°F', 'BTU/fahrenheit', 1899.100534716], ['BTU/°C', 'BTU/celsius', 1055.05585262],
    ['BTU/°R', 'BTU/rankine', 1899.100534716], ['CHU/°C', 'CHU/celsius', 1899.100534716]
  ] },

  'specific-heat': { name: 'Specific heat capacity', icon: 'shadow', group: 'heat', base: 'J/(kg·K)', units: [
    ['J/(kg·K)', 'Joule/kilogram kelvin', 1], ['kJ/(kg·K)', 'Kilojoule/kilogram kelvin', 1000],
    ['J/(g·°C)', 'Joule/gram celsius', 1000],
    ['cal/(g·°C)', 'Calorie/gram celsius', 4186.8], ['kcal/(kg·°C)', 'Kilocalorie/kilogram celsius', 4186.8],
    ['BTU/(lb·°F)', 'BTU/pound fahrenheit', 4186.8], ['CHU/(lb·°C)', 'CHU/pound celsius', 4186.8]
  ] },

  entropy: { name: 'Specific entropy', icon: 'shadow', group: 'heat', base: 'J/(kg·K)', units: [
    ['J/(kg·K)', 'Joule/kilogram kelvin', 1], ['kJ/(kg·K)', 'Kilojoule/kilogram kelvin', 1000],
    ['cal/(g·°C)', 'Calorie/gram celsius', 4186.8], ['kcal/(kg·°C)', 'Kilocalorie/kilogram celsius', 4186.8],
    ['BTU/(lb·°F)', 'BTU/pound fahrenheit', 4186.8]
  ] },

  'latent-heat': { name: 'Latent heat', icon: 'shadow', group: 'heat', base: 'J/kg', units: [
    ['J/kg', 'Joule/kilogram', 1], ['kJ/kg', 'Kilojoule/kilogram', 1000],
    ['cal/g', 'Calorie/gram', 4186.8], ['kcal/kg', 'Kilocalorie/kilogram', 4186.8],
    ['BTU/lb', 'BTU/pound', 2326], ['CHU/lb', 'CHU/pound', 4186.8]
  ] },

  'heat-flux': { name: 'Heat flux density', icon: 'bolt', group: 'heat', base: 'W/m²', units: [
    ['W/m²', 'Watt/meter²', 1], ['kW/m²', 'Kilowatt/meter²', 1000], ['W/cm²', 'Watt/centimeter²', 1e4],
    ['kcal/(h·m²)', 'Kilocalorie/hour meter²', 1.163], ['cal/(s·cm²)', 'Calorie/second centimeter²', 41868],
    ['BTU/(h·ft²)', 'BTU/hour foot²', 3.15459075], ['BTU/(s·ft²)', 'BTU/second foot²', 11356.5265],
    ['hp/ft²', 'Horsepower/foot²', 8026.6466]
  ] },

  'heat-transfer': { name: 'Heat transfer coefficient', icon: 'bolt', group: 'heat', base: 'W/(m²·K)', units: [
    ['W/(m²·K)', 'Watt/meter² kelvin', 1], ['kW/(m²·K)', 'Kilowatt/meter² kelvin', 1000],
    ['kcal/(h·m²·°C)', 'Kilocalorie/hour meter² celsius', 1.163],
    ['cal/(s·cm²·°C)', 'Calorie/second centimeter² celsius', 41868],
    ['BTU/(h·ft²·°F)', 'BTU/hour foot² fahrenheit', 5.678263341],
    ['CHU/(h·ft²·°C)', 'CHU/hour foot² celsius', 5.678263341]
  ] },

  'thermal-cond': { name: 'Thermal conductivity', icon: 'bolt', group: 'heat', base: 'W/(m·K)', units: [
    ['W/(m·K)', 'Watt/meter kelvin', 1], ['kW/(m·K)', 'Kilowatt/meter kelvin', 1000],
    ['W/(cm·°C)', 'Watt/centimeter celsius', 100],
    ['kcal/(h·m·°C)', 'Kilocalorie/hour meter celsius', 1.163],
    ['cal/(s·cm·°C)', 'Calorie/second centimeter celsius', 418.68],
    ['BTU/(h·ft·°F)', 'BTU/hour foot fahrenheit', 1.730734666],
    ['BTU·in/(h·ft²·°F)', 'BTU inch/hour foot² fahrenheit', 0.144227889]
  ] },

  'thermal-res': { name: 'Thermal resistivity', icon: 'bolt', group: 'heat', base: 'm·K/W', units: [
    ['m·K/W', 'Meter kelvin/watt', 1], ['m·°C/W', 'Meter celsius/watt', 1],
    ['cm·°C/W', 'Centimeter celsius/watt', 0.01],
    ['ft·h·°F/BTU', 'Foot hour fahrenheit/BTU', 0.577789236]
  ] },

  'thermal-exp': { name: 'Thermal expansion', icon: 'shadow', group: 'heat', base: '1/K', units: [
    ['1/K', 'Per kelvin', 1], ['1/°C', 'Per celsius', 1], ['1/°F', 'Per fahrenheit', 1.8],
    ['ppm/°C', 'ppm/celsius', 1e-6], ['ppm/°F', 'ppm/fahrenheit', 1.8e-6],
    ['µm/(m·°C)', 'Micrometer/meter celsius', 1e-6], ['µin/(in·°F)', 'Microinch/inch fahrenheit', 1.8e-6]
  ] },

  'calorific-value': { name: 'Calorific value', icon: 'fire', group: 'heat', base: 'J/m³', units: [
    ['J/m³', 'Joule/meter³', 1], ['kJ/m³', 'Kilojoule/meter³', 1000], ['MJ/m³', 'Megajoule/meter³', 1e6],
    ['kWh/m³', 'Kilowatt-hour/meter³', 3.6e6], ['kcal/m³', 'Kilocalorie/meter³', 4186.8],
    ['cal/cm³', 'Calorie/centimeter³', 4.1868e6],
    ['BTU/ft³', 'BTU/foot³', 37258.9457], ['therm/ft³', 'Therm/foot³', 3.72589457e9]
  ] },

  'hvac-efficiency': { name: 'HVAC efficiency', icon: 'shadow', group: 'heat', base: 'COP', units: [
    ['COP', 'Coefficient of performance', 1],
    ['EER', 'Energy efficiency ratio (BTU/h·W)', 0.29307107017],
    ['SEER', 'Seasonal EER (BTU/h·W)', 0.29307107017],
    ['kW/TR', 'Kilowatt/ton of refrigeration', { to: function (v) { return 3.5168528420667 / v; }, from: function (b) { return 3.5168528420667 / b; } }],
    ['%', 'Efficiency (percent)', 0.01]
  ] },

  /* ── electricity & magnetism ────────────────────────────────────────── */

  current: { name: 'Electric current', icon: 'bolt', group: 'elec', base: 'A', units: [
    ['A', 'Ampere', 1], ['mA', 'Milliampere', 1e-3], ['µA', 'Microampere', 1e-6],
    ['kA', 'Kiloampere', 1000], ['biot', 'Biot / abampere', 10], ['statA', 'Statampere', 3.335641e-10]
  ] },

  charge: { name: 'Electric charge', icon: 'bolt', group: 'elec', base: 'C', units: [
    ['C', 'Coulomb', 1], ['mC', 'Millicoulomb', 1e-3], ['µC', 'Microcoulomb', 1e-6],
    ['nC', 'Nanocoulomb', 1e-9], ['pC', 'Picocoulomb', 1e-12], ['kC', 'Kilocoulomb', 1000],
    ['Ah', 'Ampere-hour', 3600], ['mAh', 'Milliampere-hour', 3.6],
    ['F (faraday)', 'Faraday', 96485.3321233], ['e', 'Elementary charge', 1.602176634e-19],
    ['abC', 'Abcoulomb', 10], ['statC', 'Statcoulomb', 3.335641e-10]
  ] },

  voltage: { name: 'Voltage', icon: 'bolt', group: 'elec', base: 'V', units: [
    ['V', 'Volt', 1], ['mV', 'Millivolt', 1e-3], ['µV', 'Microvolt', 1e-6],
    ['kV', 'Kilovolt', 1000], ['MV', 'Megavolt', 1e6],
    ['abV', 'Abvolt', 1e-8], ['statV', 'Statvolt', 299.792458]
  ] },

  resistance: { name: 'Resistance', icon: 'bolt', group: 'elec', base: 'Ω', units: [
    ['Ω', 'Ohm', 1], ['mΩ', 'Milliohm', 1e-3], ['µΩ', 'Microohm', 1e-6],
    ['kΩ', 'Kiloohm', 1000], ['MΩ', 'Megaohm', 1e6], ['GΩ', 'Gigaohm', 1e9],
    ['abΩ', 'Abohm', 1e-9], ['statΩ', 'Statohm', 8.9875517873682e11]
  ] },

  conductance: { name: 'Conductance', icon: 'bolt', group: 'elec', base: 'S', units: [
    ['S', 'Siemens', 1], ['mS', 'Millisiemens', 1e-3], ['µS', 'Microsiemens', 1e-6],
    ['kS', 'Kilosiemens', 1000], ['mho', 'Mho', 1],
    ['abS', 'Absiemens', 1e9], ['statS', 'Statsiemens', 1.112650056e-12]
  ] },

  conductivity: { name: 'Conductivity', icon: 'bolt', group: 'elec', base: 'S/m', units: [
    ['S/m', 'Siemens/meter', 1], ['mS/m', 'Millisiemens/meter', 1e-3],
    ['S/cm', 'Siemens/centimeter', 100], ['µS/cm', 'Microsiemens/centimeter', 1e-4],
    ['mho/m', 'Mho/meter', 1], ['mho/cm', 'Mho/centimeter', 100]
  ] },

  resistivity: { name: 'Resistivity', icon: 'bolt', group: 'elec', base: 'Ω·m', units: [
    ['Ω·m', 'Ohm meter', 1], ['Ω·cm', 'Ohm centimeter', 0.01], ['Ω·in', 'Ohm inch', 0.0254],
    ['Ω·mm²/m', 'Ohm millimeter²/meter', 1e-6], ['µΩ·cm', 'Microohm centimeter', 1e-8],
    ['Ω·cmil/ft', 'Ohm circular-mil/foot', 1.662426e-9]
  ] },

  capacitance: { name: 'Capacitance', icon: 'bolt', group: 'elec', base: 'F', units: [
    ['F', 'Farad', 1], ['mF', 'Millifarad', 1e-3], ['µF', 'Microfarad', 1e-6],
    ['nF', 'Nanofarad', 1e-9], ['pF', 'Picofarad', 1e-12],
    ['abF', 'Abfarad', 1e9], ['statF', 'Statfarad', 1.112650056e-12]
  ] },

  inductance: { name: 'Inductance', icon: 'bolt', group: 'elec', base: 'H', units: [
    ['H', 'Henry', 1], ['mH', 'Millihenry', 1e-3], ['µH', 'Microhenry', 1e-6],
    ['nH', 'Nanohenry', 1e-9], ['abH', 'Abhenry', 1e-9], ['statH', 'Stathenry', 8.9875517873682e11]
  ] },

  'electric-field': { name: 'Electric field strength', icon: 'bolt', group: 'elec', base: 'V/m', units: [
    ['V/m', 'Volt/meter', 1], ['kV/m', 'Kilovolt/meter', 1000], ['mV/m', 'Millivolt/meter', 1e-3],
    ['V/cm', 'Volt/centimeter', 100], ['V/in', 'Volt/inch', 39.3700787402],
    ['kV/in', 'Kilovolt/inch', 39370.0787402], ['kV/cm', 'Kilovolt/centimeter', 1e5]
  ] },

  'magnetic-flux': { name: 'Magnetic flux', icon: 'radio', group: 'elec', base: 'Wb', units: [
    ['Wb', 'Weber', 1], ['mWb', 'Milliweber', 1e-3], ['µWb', 'Microweber', 1e-6],
    ['Mx', 'Maxwell', 1e-8], ['line', 'Line', 1e-8], ['V·s', 'Volt second', 1],
    ['unit pole', 'Unit pole', 1.256637061e-7]
  ] },

  'magnetic-flux-density': { name: 'Magnetic flux density', icon: 'radio', group: 'elec', base: 'T', units: [
    ['T', 'Tesla', 1], ['mT', 'Millitesla', 1e-3], ['µT', 'Microtesla', 1e-6], ['nT', 'Nanotesla', 1e-9],
    ['G', 'Gauss', 1e-4], ['mG', 'Milligauss', 1e-7], ['γ', 'Gamma', 1e-9], ['Wb/m²', 'Weber/meter²', 1]
  ] },

  magnetomotive: { name: 'Magnetomotive force', icon: 'radio', group: 'elec', base: 'A·t', units: [
    ['A·t', 'Ampere-turn', 1], ['kA·t', 'Kiloampere-turn', 1000], ['mA·t', 'Milliampere-turn', 1e-3],
    ['Gb', 'Gilbert', 0.7957747155]
  ] },

  permeability: { name: 'Permeability (magnetic)', icon: 'radio', group: 'elec', base: 'H/m', units: [
    ['H/m', 'Henry/meter', 1], ['µH/m', 'Microhenry/meter', 1e-6],
    ['N/A²', 'Newton/ampere²', 1], ['Wb/(A·m)', 'Weber/ampere meter', 1],
    ['µ₀', 'Vacuum permeability', 1.25663706212e-6]
  ] },

  'charge-linear': { name: 'Linear charge density', icon: 'bolt', group: 'elec', base: 'C/m', units: [
    ['C/m', 'Coulomb/meter', 1], ['C/cm', 'Coulomb/centimeter', 100], ['C/in', 'Coulomb/inch', 39.3700787402],
    ['µC/m', 'Microcoulomb/meter', 1e-6], ['nC/m', 'Nanocoulomb/meter', 1e-9],
    ['abC/m', 'Abcoulomb/meter', 10], ['abC/cm', 'Abcoulomb/centimeter', 1000]
  ] },

  'charge-surface': { name: 'Surface charge density', icon: 'bolt', group: 'elec', base: 'C/m²', units: [
    ['C/m²', 'Coulomb/meter²', 1], ['C/cm²', 'Coulomb/centimeter²', 1e4],
    ['C/in²', 'Coulomb/inch²', 1550.0031], ['µC/m²', 'Microcoulomb/meter²', 1e-6],
    ['abC/m²', 'Abcoulomb/meter²', 10]
  ] },

  'charge-volume': { name: 'Volume charge density', icon: 'bolt', group: 'elec', base: 'C/m³', units: [
    ['C/m³', 'Coulomb/meter³', 1], ['C/cm³', 'Coulomb/centimeter³', 1e6],
    ['C/in³', 'Coulomb/inch³', 61023.744095], ['µC/m³', 'Microcoulomb/meter³', 1e-6],
    ['abC/m³', 'Abcoulomb/meter³', 10]
  ] },

  'current-linear': { name: 'Linear current density', icon: 'bolt', group: 'elec', base: 'A/m', units: [
    ['A/m', 'Ampere/meter', 1], ['A/cm', 'Ampere/centimeter', 100], ['A/in', 'Ampere/inch', 39.3700787402],
    ['Oe', 'Oersted', 79.5774715459], ['Gb/cm', 'Gilbert/centimeter', 79.5774715459]
  ] },

  'current-surface': { name: 'Surface current density', icon: 'bolt', group: 'elec', base: 'A/m²', units: [
    ['A/m²', 'Ampere/meter²', 1], ['A/cm²', 'Ampere/centimeter²', 1e4],
    ['A/mm²', 'Ampere/millimeter²', 1e6], ['A/in²', 'Ampere/inch²', 1550.0031],
    ['kA/m²', 'Kiloampere/meter²', 1000]
  ] },

  /* ── light, sound & waves ───────────────────────────────────────────── */

  frequency: { name: 'Frequency', icon: 'radio', group: 'wave', base: 'Hz', units: [
    ['Hz', 'Hertz', 1], ['kHz', 'Kilohertz', 1000], ['MHz', 'Megahertz', 1e6],
    ['GHz', 'Gigahertz', 1e9], ['THz', 'Terahertz', 1e12],
    ['rpm', 'Revolution/minute', 1 / 60], ['cyc/s', 'Cycle/second', 1],
    ['rad/s', 'Radian/second', 1 / (2 * PI)], ['°/s', 'Degree/second', 1 / 360],
    /* wavelength in vacuum, via c = 299 792 458 m/s */
    ['λ m', 'Wavelength (meter)',      { to: function (v) { return 299792458 / v; }, from: function (f) { return 299792458 / f; } }],
    ['λ cm', 'Wavelength (centimeter)', { to: function (v) { return 29979245800 / v; }, from: function (f) { return 29979245800 / f; } }],
    ['λ mm', 'Wavelength (millimeter)', { to: function (v) { return 299792458000 / v; }, from: function (f) { return 299792458000 / f; } }],
    ['λ nm', 'Wavelength (nanometer)',  { to: function (v) { return 2.99792458e17 / v; }, from: function (f) { return 2.99792458e17 / f; } }]
  ] },

  sound: { name: 'Sound level', icon: 'sound', group: 'wave', base: 'dB', units: [
    ['dB', 'Decibel', 1], ['B', 'Bel', 10], ['Np', 'Neper', 8.6858896380650366]
  ] },

  illumination: { name: 'Illumination', icon: 'shadow', group: 'wave', base: 'lx', units: [
    ['lx', 'Lux', 1], ['klx', 'Kilolux', 1000], ['lm/m²', 'Lumen/meter²', 1],
    ['fc', 'Foot-candle', 10.7639104167], ['lm/ft²', 'Lumen/foot²', 10.7639104167],
    ['ph', 'Phot', 1e4], ['lm/cm²', 'Lumen/centimeter²', 1e4],
    ['nx', 'Nox', 1e-3], ['m-cd', 'Meter-candle', 1]
  ] },

  'luminous-intensity': { name: 'Luminous intensity', icon: 'shadow', group: 'wave', base: 'cd', units: [
    ['cd', 'Candela', 1], ['kcd', 'Kilocandela', 1000], ['cp', 'Candlepower', 1],
    ['lm/sr', 'Lumen/steradian', 1], ['HK', 'Hefner candle', 0.903], ['carcel', 'Carcel', 9.61]
  ] },

  luminance: { name: 'Luminance', icon: 'shadow', group: 'wave', base: 'cd/m²', units: [
    ['cd/m²', 'Candela/meter²', 1], ['nit', 'Nit', 1],
    ['cd/cm²', 'Candela/centimeter²', 1e4], ['sb', 'Stilb', 1e4],
    ['cd/in²', 'Candela/inch²', 1550.0031], ['cd/ft²', 'Candela/foot²', 10.7639104167],
    ['L', 'Lambert', 3183.0988618], ['fL', 'Foot-lambert', 3.4262590996],
    ['asb', 'Apostilb', 0.3183098862], ['blondel', 'Blondel', 0.3183098862],
    ['bril', 'Bril', 3.183098862e-4]
  ] },

  /* ── chemistry & radiation ──────────────────────────────────────────── */

  'conc-liquid': { name: 'Concentration (solution)', icon: 'convert', group: 'chem', base: 'kg/m³', units: [
    ['kg/L', 'Kilogram/liter', 1000], ['g/L', 'Gram/liter', 1], ['mg/L', 'Milligram/liter', 1e-3],
    ['ppm', 'Part/million', 1e-3], ['kg/m³', 'Kilogram/meter³', 1],
    ['gr/gal UK', 'Grain/gallon (UK)', 0.0142537675], ['gr/gal US', 'Grain/gallon (US)', 0.0171181164],
    ['lb/ft³', 'Pound/foot³', 16.018463374],
    ['lb/gal UK', 'Pound/gallon (UK)', 99.7763727], ['lb/gal US', 'Pound/gallon (US)', 119.826427]
  ] },

  'conc-molar': { name: 'Concentration (molar)', icon: 'convert', group: 'chem', base: 'mol/m³', units: [
    ['mol/L', 'Mole/liter', 1000], ['mmol/L', 'Millimole/liter', 1], ['µmol/L', 'Micromole/liter', 1e-3],
    ['nmol/L', 'Nanomole/liter', 1e-6], ['mol/m³', 'Mole/meter³', 1],
    ['mol/cm³', 'Mole/centimeter³', 1e6], ['kmol/m³', 'Kilomole/meter³', 1000]
  ] },

  'henrys-law': { name: "Henry's law constant", icon: 'physics', group: 'chem', base: 'Pa·m³/mol', units: [
    ['Pa·m³/mol', 'Pascal meter³/mole', 1], ['kPa·m³/mol', 'Kilopascal meter³/mole', 1000],
    ['atm·m³/mol', 'Atmosphere meter³/mole', 101325], ['atm·L/mol', 'Atmosphere liter/mole', 101.325],
    ['atm·cm³/mol', 'Atmosphere centimeter³/mole', 0.101325],
    ['bar·m³/mol', 'Bar meter³/mole', 1e5], ['mmHg·L/mol', 'mmHg liter/mole', 0.133322368]
  ] },

  'rad-dose': { name: 'Radiation - absorbed dose', icon: 'warn', group: 'chem', base: 'Gy', units: [
    ['Gy', 'Gray', 1], ['mGy', 'Milligray', 1e-3], ['µGy', 'Microgray', 1e-6], ['cGy', 'Centigray', 0.01],
    ['rad', 'Rad', 0.01], ['mrad', 'Millirad', 1e-5], ['J/kg', 'Joule/kilogram', 1], ['erg/g', 'Erg/gram', 1e-4]
  ] },

  'rad-dose-rate': { name: 'Radiation - dose rate', icon: 'warn', group: 'chem', base: 'Gy/s', units: [
    ['Gy/s', 'Gray/second', 1], ['mGy/s', 'Milligray/second', 1e-3], ['Gy/h', 'Gray/hour', 1 / 3600],
    ['µGy/h', 'Microgray/hour', 1e-6 / 3600], ['rad/s', 'Rad/second', 0.01], ['rad/h', 'Rad/hour', 0.01 / 3600]
  ] },

  'rad-equiv': { name: 'Radiation - dose equivalent', icon: 'warn', group: 'chem', base: 'Sv', units: [
    ['Sv', 'Sievert', 1], ['mSv', 'Millisievert', 1e-3], ['µSv', 'Microsievert', 1e-6],
    ['rem', 'Rem', 0.01], ['mrem', 'Millirem', 1e-5], ['J/kg', 'Joule/kilogram', 1]
  ] },

  'rad-exposure': { name: 'Radiation - exposure', icon: 'warn', group: 'chem', base: 'C/kg', units: [
    ['C/kg', 'Coulomb/kilogram', 1], ['mC/kg', 'Millicoulomb/kilogram', 1e-3],
    ['R', 'Roentgen', 2.58e-4], ['mR', 'Milliroentgen', 2.58e-7], ['µR', 'Microroentgen', 2.58e-10]
  ] },

  'rad-activity': { name: 'Radioactivity', icon: 'warn', group: 'chem', base: 'Bq', units: [
    ['Bq', 'Becquerel', 1], ['kBq', 'Kilobecquerel', 1000], ['MBq', 'Megabecquerel', 1e6],
    ['GBq', 'Gigabecquerel', 1e9],
    ['Ci', 'Curie', 3.7e10], ['mCi', 'Millicurie', 3.7e7], ['µCi', 'Microcurie', 3.7e4],
    ['Rd', 'Rutherford', 1e6], ['dis/s', 'Disintegration/second', 1], ['dis/min', 'Disintegration/minute', 1 / 60]
  ] },

  /* ── other ──────────────────────────────────────────────────────────── */

  prefixes: { name: 'Metric prefixes', icon: 'convert', group: 'other', base: '(none)', units: [
    ['yotta', 'Yotta (Y)', 1e24], ['zetta', 'Zetta (Z)', 1e21], ['exa', 'Exa (E)', 1e18],
    ['peta', 'Peta (P)', 1e15], ['tera', 'Tera (T)', 1e12], ['giga', 'Giga (G)', 1e9],
    ['mega', 'Mega (M)', 1e6], ['kilo', 'Kilo (k)', 1000], ['hecto', 'Hecto (h)', 100],
    ['deca', 'Deca (da)', 10], ['(none)', 'No prefix', 1], ['deci', 'Deci (d)', 0.1],
    ['centi', 'Centi (c)', 0.01], ['milli', 'Milli (m)', 1e-3], ['micro', 'Micro (µ)', 1e-6],
    ['nano', 'Nano (n)', 1e-9], ['pico', 'Pico (p)', 1e-12], ['femto', 'Femto (f)', 1e-15],
    ['atto', 'Atto (a)', 1e-18], ['zepto', 'Zepto (z)', 1e-21], ['yocto', 'Yocto (y)', 1e-24]
  ] },

  typography: { name: 'Typography', icon: 'ruler', group: 'other', base: 'm', units: [
    ['pt', 'Point (DTP, 1/72 in)', 0.0254 / 72], ['pica', 'Pica (DTP, 12 pt)', 0.0254 / 6],
    ['px', 'Pixel (96 dpi)', 0.0254 / 96],
    ['pt (TeX)', 'Point (TeX)', 3.514598035e-4], ['pica (TeX)', 'Pica (TeX)', 4.217517642e-3],
    ['pt (Didot)', 'Point (Didot)', 3.759398496e-4], ['cicero', 'Cicero', 4.511278195e-3],
    ['twip', 'Twip', 0.0254 / 1440], ['mm', 'Millimeter', 1e-3], ['in', 'Inch', 0.0254]
  ] },

  'image-resolution': { name: 'Image resolution', icon: 'grid', group: 'other', base: 'dot/m', units: [
    ['dpi', 'Dot/inch', 39.3700787402], ['ppi', 'Pixel/inch', 39.3700787402],
    ['dot/mm', 'Dot/millimeter', 1000], ['dot/cm', 'Dot/centimeter', 100], ['dot/m', 'Dot/meter', 1],
    ['px/cm', 'Pixel/centimeter', 100]
  ] }

  };

  global.ARTEMIDOS_UNITS = CATS;

  global.ARTEMIDOS_UNIT_GROUPS = [
    { id: 'common', name: 'Everyday' },
    { id: 'mech',   name: 'Mechanics & motion' },
    { id: 'heat',   name: 'Heat & thermodynamics' },
    { id: 'elec',   name: 'Electricity & magnetism' },
    { id: 'wave',   name: 'Light, sound & waves' },
    { id: 'chem',   name: 'Chemistry & radiation' },
    { id: 'other',  name: 'Other' }
  ];

})(window);
