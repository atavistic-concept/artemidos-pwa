/*
 * Artemidos - catalogue: firearms by model
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The class table next door answers "what does a 5.56 rifle reach". This
 * answers "what does THIS rifle reach", because service weapons of the same
 * calibre differ by barrel length, sights and doctrine, and the published
 * figures differ with them.
 *
 * THREE RANGES PER WEAPON, never one:
 *   AIMED      the distance a competent shooter hits a man-sized target on
 *              demand, sights set, nothing held over
 *   EFFECTIVE  the furthest it still does the job, with drop and wind read
 *              and allowed for
 *   MAXIMUM    how far the projectile travels if it hits nothing, which sets
 *              the danger area and has nothing to do with accuracy
 *
 * Figures are the published service and manufacturer values. Aimed range is
 * the one most often left out of a spec sheet and is quoted here as the
 * commonly taught point-target figure; treat it as doctrine rather than as a
 * measurement. Muzzle velocity varies with barrel length and load, sometimes
 * by 50 m/s between variants of the same weapon.
 *
 * Identification and threat assessment only. Nothing here is instruction in
 * the use of any weapon.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  /* Who carries each weapon, keyed by the name it is filed under. Kept as data
     rather than threaded through every call so the list can be read and
     corrected in one place. A widely-issued pattern (AK, FAL, G3, M16) names
     dozens of states and irregular forces on purpose: that is the point, a
     universal weapon identifies almost nobody. */
  var USERS = {
    'FAMAS F1 / G2': 'France (all services), Djibouti, Gabon, Senegal, UAE, and former users across French-speaking Africa. Being withdrawn in favour of the HK416F.',
    'M4A1 carbine': 'United States (all services) and 60+ countries including Afghanistan (former ANA), Iraq, the Philippines, Saudi Arabia and most Gulf states. The AR-15/M16 family it belongs to is the most widely issued Western rifle, and semi-automatic AR-15 variants are the dominant civilian rifle in the US.',
    'M16A4': 'United States (USMC, reserve), and widely exported: the Philippines, Iraq, Afghanistan (former), and many Asian and Latin American armies. The base pattern for licence production in South Korea, the Philippines and elsewhere.',
    'AKM': 'The most widely produced rifle in history. Licence-built or copied by the USSR and successors, China (Type 56), the Warsaw Pact, Egypt, Iraq, North Korea and dozens more. Standard for state armies, insurgencies, militias and cartels across Africa, the Middle East, Asia and Latin America.',
    'AK-74M': 'Russia (standard until the AK-12) and former Soviet states. Chambered in 5.45 mm; carried by the Russian Army, Rosgvardia, and separatist and militia forces across the post-Soviet space.',
    'AK-12': 'Russia (current standard rifle, all services and Rosgvardia). Entering service from 2018 and issued alongside older AK-74M stocks.',
    'AK-103': 'Russia, and licence-built or adopted by Venezuela, Saudi Arabia (planned), Libya and others wanting the harder-hitting 7.62 mm round; widely exported by Rosoboronexport.',
    'Heckler & Koch G36': 'Germany (Bundeswehr, being replaced by the G95), Spain, Lithuania, Latvia and many police and export users; licence-built in Spain and Saudi Arabia.',
    'Heckler & Koch HK416': 'France (HK416F, standard rifle), Norway, US special operations (as the M27 IAR in the USMC), and many Western special-forces units. The German Army adopted it as the G95/G95A1.',
    'HK G95 / HK416 A8': 'Germany (Bundeswehr standard rifle from 2020) and France (HK416F). The current Western-European service standard, replacing the G36 and the FAMAS.',
    'FN SCAR-L (Mk 16)': 'US special operations (SOCOM), Belgium, and various special-forces and police units worldwide.',
    'FN SCAR-H (Mk 17)': 'US SOCOM, Belgium, France (as a designated-marksman rifle), Peru, and special-forces users needing 7.62 mm reach.',
    'Steyr AUG A3': 'Austria (Stg 77), Australia and New Zealand (F88/EF88 Austeyr), Ireland, Malaysia, Saudi Arabia and many police tactical units. One of the first successful bullpups.',
    'L85A3': 'United Kingdom (all services). The SA80 family, upgraded by H&K to A2 and now A3 standard; not widely exported.',
    'IWI Tavor X95': 'Israel (IDF standard), India, Azerbaijan, Ukraine, Thailand, Brazil and many special-forces and police users; licence-built in India as the Zittara/TAR.',
    'QBZ-95-1': 'China (PLA and People’s Armed Police, being replaced by the QBZ-191), Cambodia, Sri Lanka, and export users. Also carried by Chinese paramilitary forces.',
    'Beretta ARX160': 'Italy (Army), Kazakhstan, Mexico, Egypt, and various police and special units; the 5.56 companion to the ARX200.',
    'AK-103 ': 'Russia and export.',
    'CZ BREN 2': 'Czechia (standard rifle), France (special forces), Hungary (licence production), and several African and Latin American forces.',
    'Zastava M21 / M17': 'Serbia (standard rifle) and export customers across Africa and the Middle East; a modernised Kalashnikov in 5.56 mm.',
    'Beretta ARX200': 'Italy (Army designated-marksman and general-purpose rifle) and export.',
    'INSAS / Excalibur': 'India (Army, being replaced in front-line units by the SIG716 and AK-203), Nepal, Oman and Bhutan.',
    'Type 03 (QBZ-03)': 'China (PLA airborne and some line units, and export), Bangladesh, and paramilitary forces; issued alongside the QBZ-95 bullpup.',
    'QBZ-191': 'China (PLA current-generation standard rifle, all front-line services from 2019).',
    'Howa Type 20 / Type 89': 'Japan (Self-Defense Forces): the Type 89 being replaced by the modular Type 20 from 2020. Not exported under Japan’s arms policy.',
    'K2 / K2C1': 'South Korea (standard rifle since the 1980s) and exported to or licence-built in Indonesia, Nigeria, Peru, Iraq and several African states.',
    'Vektor R4': 'South Africa (SANDF standard) and southern-African users; a licence-built lengthened Galil.',
    'IWI Galil ACE': 'Israel (export-oriented), and licence-built in Colombia, Vietnam, Chile and elsewhere; carried by many Latin American and African armies and police.',
    'SIG SG 550 / Stgw 90': 'Switzerland (every citizen-soldier), and export users including Chile, and many police tactical units.',
    'Heckler & Koch G3': 'Once standard in 80+ countries. Licence-built in Iran, Pakistan (POF), Turkey (MKE), Greece, Port, Mexico, Saudi Arabia, Sweden and more; still front-line in Pakistan, Iran and much of Africa and carried by countless irregular forces.',
    'FN FAL': '"The right arm of the free world": adopted by 90+ countries incl. the UK (L1A1), Belgium, Argentina, Brazil, Australia, Canada, Israel, South Africa, Rhodesia and much of the Commonwealth and Latin America. Still in militia and reserve use across Africa and South America.',
    'SVD Dragunov': 'The USSR and successors, the Warsaw Pact, China (Type 79/85), Iran, Iraq, Egypt and dozens more. The standard Eastern-bloc designated-marksman rifle, carried by nearly every AK-armed force and insurgency.',
    'M24 SWS': 'United States (Army, being replaced by the M2010) and many allied armies; a militarised Remington 700.',
    'Accuracy International AWM': 'United Kingdom (L115 series), Germany, the Netherlands, Australia, and many special-forces sniper units; a benchmark Western sniper rifle.',
    'Barrett M107': 'United States and 60+ allied militaries as the standard .50-calibre anti-materiel rifle.',
    'Heckler & Koch MP5': 'The world’s standard submachine gun: police, counter-terror and special units in 100+ countries, licence-built in Iran, Pakistan, Turkey, Greece, Saudi Arabia and Mexico.',
    'Heckler & Koch MP7': 'German special forces, UK, Norway, Ireland and many close-protection and special-operations units; a 4.6 mm personal defence weapon.',
    'FN P90': 'Belgium, US Secret Service, Saudi Arabia, Peru and many special and protection units; the 5.7 mm PDW.',
    'Glock 17': 'The dominant military and police pistol worldwide: Austria, US agencies, the UK (L131A1), and police and armed forces in over 100 countries.',
    'SIG Sauer P320 (M17)': 'United States (M17/M18 across all services from 2017) and a growing number of allied and police users.',
    'Beretta 92FS (M9)': 'United States (M9, standard 1985-2017), Italy, France (PAMAS), and many police and military users worldwide.',
    'FN Minimi / M249': 'The standard Western squad automatic weapon: US (M249), UK (L110), France, Australia, Canada and 75+ countries.',
    'FN MAG / M240': 'The standard Western general-purpose machine gun: US (M240), UK (L7/GPMG), and 80+ armies, on infantry, vehicle and coaxial mounts.',
    'PKM': 'The Eastern general-purpose machine gun: the USSR and successors, China (Type 80), and dozens of armies and irregular forces; ubiquitous alongside the AK.',
    'M2HB Browning': 'The Western heavy machine gun since the 1930s: the US and 90+ countries, on infantry tripods, vehicles, ships and aircraft; still in front-line service worldwide.'
  };

  function gun(sub, n, country, d, cal, aim, eff, max, mv, specs, note, users) {
    C.add({
      cat: 'ball', sub: 'guns', n: n, country: country,
      d: country + ' · ' + cal + ' · ' + d,
      speeds: [['Muzzle velocity', mv]],
      specs: [
        ['Best aimed range', aim, 'dist', 'point target, no holdover'],
        ['Effective range', eff, 'dist', 'drop and wind must be read'],
        ['Maximum range travelled', max, 'dist', 'sets the danger area'],
        ['Time of flight to 300 m', 300 / mv, 'none', 'seconds, approximate']
      ].concat(specs || []),
      note: note,
      users: users || USERS[n] || null
    });
  }

  /* ── assault rifles ───────────────────────────────────────────────── */

  gun('guns', 'FAMAS F1 / G2', 'France', 'Bullpup assault rifle', '5.56 × 45 mm',
    200, 300, 3200, 925,
    [['Rate of fire', 1000, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.61, 'mass'],
     ['Magazine', 25, 'none', 'rounds (F1); 30 on the G2'], ['Barrel', 0.488, 'length']],
    'The clearest illustration of why one range figure is not enough: about 200 m where you simply aim and hit, about 300 m where the round is dropping and the wind is moving it, and 3.2 km of travel behind that. One of the fastest cyclic rates of any service rifle, which is why it is fired in short bursts.');

  gun('guns', 'M4A1 carbine', 'United States', 'Carbine', '5.56 × 45 mm',
    300, 500, 3600, 880,
    [['Effective range, area target', 600, 'dist'], ['Rate of fire', 800, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 3.4, 'mass'], ['Magazine', 30, 'none', 'rounds'], ['Barrel', 0.368, 'length']],
    'The short barrel costs velocity, and with it the fragmentation that gives 5.56 its terminal effect. Past roughly 150 m from a 14.5 in barrel the round is much less destructive than the range figures alone suggest.');

  gun('guns', 'M16A4', 'United States', 'Assault rifle', '5.56 × 45 mm',
    550, 800, 3600, 948,
    [['Effective range, area target', 800, 'dist'], ['Rate of fire', 800, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 3.99, 'mass'], ['Magazine', 30, 'none', 'rounds'], ['Barrel', 0.508, 'length']],
    'The full-length barrel buys about 70 m/s over the M4 and a markedly longer useful reach.');

  gun('guns', 'AKM', 'Soviet Union', 'Assault rifle', '7.62 × 39 mm',
    300, 400, 2500, 715,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.1, 'mass'],
     ['Magazine', 30, 'none', 'rounds'], ['Barrel', 0.415, 'length']],
    'The most widely distributed rifle on earth. Heavy, comparatively slow, and better than 5.56 at punching through light cover; poorer past 300 m, where the arcing trajectory makes range estimation unforgiving.');

  gun('guns', 'AK-74M', 'Russia', 'Assault rifle', '5.45 × 39 mm',
    300, 500, 3150, 900,
    [['Effective range, area target', 1000, 'dist'], ['Rate of fire', 650, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 3.4, 'mass'], ['Magazine', 30, 'none', 'rounds']],
    'The small-calibre answer to 5.56: flatter shooting and far less recoil than the AKM, at the cost of penetration through cover.');

  gun('guns', 'AK-12', 'Russia', 'Assault rifle', '5.45 × 39 mm',
    300, 600, 3150, 900,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds; 60 quad-stack available']]);

  gun('guns', 'Heckler & Koch G36', 'Germany', 'Assault rifle', '5.56 × 45 mm',
    300, 600, 3000, 920,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.63, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'Sustained automatic fire was found to shift the point of impact as the polymer receiver heated, which is a reminder that a published range assumes a cold barrel.');

  gun('guns', 'Heckler & Koch HK416', 'Germany', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3600, 880,
    [['Rate of fire', 850, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.55, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'A short-stroke piston in the AR layout: runs cleaner and cooler than the direct-impingement M4 under sustained fire.');

  gun('guns', 'FN SCAR-L (Mk 16)', 'Belgium', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3600, 870,
    [['Rate of fire', 625, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']]);

  gun('guns', 'FN SCAR-H (Mk 17)', 'Belgium', 'Battle rifle', '7.62 × 51 mm',
    500, 800, 3725, 700,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.72, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'The full-power cartridge doubles the useful reach over the SCAR-L and roughly doubles the recoil with it.');

  gun('guns', 'Steyr AUG A3', 'Austria', 'Bullpup assault rifle', '5.56 × 45 mm',
    300, 500, 2700, 940,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The first widely adopted bullpup: a full-length barrel inside a carbine-length weapon, which is the whole point of the layout.');

  gun('guns', 'L85A3', 'United Kingdom', 'Bullpup assault rifle', '5.56 × 45 mm',
    300, 600, 3000, 940,
    [['Rate of fire', 650, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'Issued with a magnified optic as standard, which is why its taught effective range sits above most 5.56 rifles on iron sights.');

  gun('guns', 'IWI Tavor X95', 'Israel', 'Bullpup assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.3, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'Short enough to work from a vehicle, which is why it turns up in close-protection and counter-terror units rather than only in line infantry.');

  gun('guns', 'QBZ-95-1', 'China', 'Bullpup assault rifle', '5.8 × 42 mm',
    300, 400, 3000, 930,
    [['Rate of fire', 650, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds']]);

  gun('guns', 'Beretta ARX160', 'Italy', 'Assault rifle', '5.56 × 45 mm',
    300, 600, 3000, 900,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.1, 'mass'],
     ['Magazine', 30, 'none', 'rounds']]);

  gun('guns', 'Heckler & Koch G3', 'Germany', 'Battle rifle', '7.62 × 51 mm',
    400, 600, 3725, 800,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.38, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'Still in service across dozens of countries. Roller-delayed blowback, heavy, and it throws brass far enough to matter if you are trying to stay unnoticed.');

  gun('guns', 'FN FAL', 'Belgium', 'Battle rifle', '7.62 × 51 mm',
    500, 600, 3725, 840,
    [['Rate of fire', 675, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.3, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'The right arm of the free world, and almost uncontrollable on full automatic, which is why most users issued it semi-automatic only.');

  gun('guns', 'AK-103', 'Russia', 'Assault rifle', '7.62 × 39 mm',
    300, 500, 3000, 715,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The modern 7.62 mm Kalashnikov widely exported and licence-built, keeping the harder-hitting older calibre for forces that want penetration and reliability over flat trajectory.');

  gun('guns', 'CZ BREN 2', 'Czechia', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 900,
    [['Rate of fire', 800, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.0, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The current Czech service rifle, also adopted by France for special forces and by Hungary, which licence-builds it.');

  gun('guns', 'Zastava M21 / M17', 'Serbia', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 680, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Serbian service rifle, a Kalashnikov derivative rechambered to NATO 5.56, widely exported across the region.');

  gun('guns', 'HK G95 / HK416 A8', 'Germany', 'Assault rifle', '5.56 × 45 mm',
    300, 600, 3000, 880,
    [['Rate of fire', 850, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.7, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The gas-piston HK416 adopted by Germany as the G95 and by France as the HK416F to replace the FAMAS: the current Western-European service standard.');

  gun('guns', 'Beretta ARX200', 'Italy', 'Battle rifle', '7.62 × 51 mm',
    400, 600, 3700, 810,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.7, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'The 7.62 companion to the ARX160, issued as a designated-marksman and general-purpose rifle where the heavier round is wanted.');

  gun('guns', 'INSAS / Excalibur', 'India', 'Assault rifle', '5.56 × 45 mm',
    300, 400, 3000, 900,
    [['Rate of fire', 650, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.15, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The long-serving Indian rifle now being replaced in front-line units by the imported SIG716 and the Russian-Indian AK-203.');

  gun('guns', 'Type 03 (QBZ-03)', 'China', 'Assault rifle', '5.8 × 42 mm',
    300, 400, 2900, 930,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'A conventional-layout Chinese rifle issued alongside the QBZ-95 bullpup, favoured by airborne and export users; the newer QBZ-191 is replacing both.');

  gun('guns', 'QBZ-191', 'China', 'Assault rifle', '5.8 × 42 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.3, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The PLA’s current-generation rifle, a conventional short-stroke-piston design replacing the QBZ-95 bullpup across front-line units.');

  gun('guns', 'Howa Type 20 / Type 89', 'Japan', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Japan Self-Defense Force rifle: the Type 89 being replaced by the modular Type 20 from 2020, both domestic Howa designs.');

  gun('guns', 'K2 / K2C1', 'South Korea', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The South Korean service rifle since the 1980s, updated as the K2C1 with rails and an adjustable stock, and widely exported.');

  gun('guns', 'Vektor R4', 'South Africa', 'Assault rifle', '5.56 × 45 mm',
    300, 500, 3000, 980,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.3, 'mass'],
     ['Magazine', 35, 'none', 'rounds']],
    'The South African service rifle, a licence-built and lengthened Galil, built for heat, dust and a 35-round magazine.');

  gun('guns', 'IWI Galil ACE', 'Israel', 'Assault rifle', '7.62 × 39 / 5.56 mm',
    300, 500, 3000, 715,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'A modernised Galil widely exported and licence-built (Colombia, Vietnam, Chile), offered in 7.62 × 39, 5.56 and 7.62 × 51.');

  gun('guns', 'SIG SG 550 / Stgw 90', 'Switzerland', 'Assault rifle', '5.56 × 45 mm',
    300, 600, 3000, 905,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.1, 'mass'],
     ['Magazine', 20, 'none', 'rounds', '30 also']],
    'The accurate Swiss service rifle, issued to every citizen-soldier and known for tight tolerances and a folding stock.');

  /* ── marksman and sniper ──────────────────────────────────────────── */

  gun('guns', 'SVD Dragunov', 'Soviet Union', 'Designated marksman rifle', '7.62 × 54mmR',
    600, 800, 3800, 830,
    [['Effective range with optic', 1300, 'dist'], ['Weight, empty', 4.3, 'mass'],
     ['Magazine', 10, 'none', 'rounds']],
    'Not a sniper rifle in the western sense: a squad weapon meant to extend a section\'s reach to 800 m, not a precision instrument.');

  gun('guns', 'M24 SWS', 'United States', 'Bolt-action sniper rifle', '7.62 × 51 mm',
    800, 800, 3725, 790,
    [['Time of flight to 800 m', 1.3, 'none', 'seconds'], ['Weight, empty', 5.4, 'mass'],
     ['Magazine', 5, 'none', 'rounds']]);

  gun('guns', 'Accuracy International AWM', 'United Kingdom', 'Bolt-action sniper rifle', '.338 Lapua Magnum',
    1200, 1500, 5000, 936,
    [['Time of flight to 1500 m', 2.6, 'none', 'seconds'], ['Weight, empty', 6.9, 'mass'],
     ['Magazine', 5, 'none', 'rounds']],
    'Beyond about 1000 m the wind along the whole flight path decides the shot, and a moving target has to be led by several metres.');

  gun('guns', 'Barrett M107', 'United States', 'Anti-materiel rifle', '12.7 × 99 mm',
    1500, 1800, 6800, 853,
    [['Weight, empty', 12.9, 'mass'], ['Magazine', 10, 'none', 'rounds']],
    'Engages from outside any cordon a protection team would normally set, and defeats most unhardened cover and light vehicle armour.');

  /* ── submachine guns and pistols ──────────────────────────────────── */

  gun('guns', 'Heckler & Koch MP5', 'Germany', 'Submachine gun', '9 × 19 mm',
    100, 200, 1800, 400,
    [['Rate of fire', 800, 'none', 'rounds/min, cyclic'], ['Weight, empty', 2.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The close-protection standard for decades. Closed-bolt and accurate for its class, but it fires a pistol cartridge and will not defeat body armour.');

  gun('guns', 'Heckler & Koch MP7', 'Germany', 'Personal defence weapon', '4.6 × 30 mm',
    100, 200, 2000, 735,
    [['Rate of fire', 950, 'none', 'rounds/min, cyclic'], ['Weight, empty', 1.9, 'mass'],
     ['Magazine', 30, 'none', 'rounds; 40 available']],
    'Small, fast round designed to defeat soft body armour that stops 9 mm. Concealable, which is why it appears in protective details.');

  gun('guns', 'FN P90', 'Belgium', 'Personal defence weapon', '5.7 × 28 mm',
    100, 200, 1800, 715,
    [['Rate of fire', 900, 'none', 'rounds/min, cyclic'], ['Weight, empty', 2.6, 'mass'],
     ['Magazine', 50, 'none', 'rounds']]);

  gun('guns', 'Glock 17', 'Austria', 'Service pistol', '9 × 19 mm',
    25, 50, 1800, 375,
    [['Weight, empty', 0.71, 'mass'], ['Magazine', 17, 'none', 'rounds']],
    'Fifty metres is generous. Under stress, on a moving target, real engagements are inside 7 m, and the 1.8 km of travel behind the target is the number that matters for everyone else on the street.');

  gun('guns', 'SIG Sauer P320 (M17)', 'United States', 'Service pistol', '9 × 19 mm',
    25, 50, 1800, 360,
    [['Weight, empty', 0.83, 'mass'], ['Magazine', 17, 'none', 'rounds; 21 extended']]);

  gun('guns', 'Beretta 92FS (M9)', 'Italy', 'Service pistol', '9 × 19 mm',
    25, 50, 1800, 381,
    [['Weight, empty', 0.95, 'mass'], ['Magazine', 15, 'none', 'rounds']]);

  /* ── machine guns ─────────────────────────────────────────────────── */

  gun('guns', 'FN Minimi / M249', 'Belgium', 'Light machine gun', '5.56 × 45 mm',
    600, 800, 3600, 915,
    [['Effective range, area target', 1000, 'dist'], ['Rate of fire', 850, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 7.5, 'mass'], ['Belt', 200, 'none', 'rounds']]);

  gun('guns', 'FN MAG / M240', 'Belgium', 'General purpose machine gun', '7.62 × 51 mm',
    800, 1200, 3725, 853,
    [['Effective range, area target on tripod', 1800, 'dist'], ['Rate of fire', 750, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 11.8, 'mass'], ['Belt', 100, 'none', 'rounds']]);

  gun('guns', 'PKM', 'Soviet Union', 'General purpose machine gun', '7.62 × 54mmR',
    800, 1000, 3800, 825,
    [['Effective range, area target', 1500, 'dist'], ['Rate of fire', 650, 'none', 'rounds/min, cyclic'],
     ['Weight, empty', 7.5, 'mass'], ['Belt', 100, 'none', 'rounds']],
    'Notably light for its class, which is why it is carried and used far forward.');

  gun('guns', 'M2HB Browning', 'United States', 'Heavy machine gun', '12.7 × 99 mm',
    1200, 1830, 6800, 890,
    [['Effective range, area target', 2000, 'dist'], ['Rate of fire', 550, 'none', 'rounds/min, cyclic'],
     ['Weight, gun only', 38, 'mass']],
    'In service since 1933 and still the standard. Nearly 7 km of maximum travel makes the backstop a planning problem in any built-up area.');

  /* -- national service rifles added to close the gaps --
     A weapon list is only useful if the rifle actually carried by the army in
     front of you is in it. These are current or recent standard issue. */

  gun('guns', 'FB Grot C16', 'Poland', 'Assault rifle, modular', '5.56 x 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The Polish standard rifle since 2017, replacing the Beryl. Built in both conventional and bullpup layouts on one receiver so a unit can mix them.');

  gun('guns', 'MPT-76', 'Turkey', 'Battle rifle', '7.62 x 51 mm',
    400, 600, 3800, 800,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.1, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'The Turkish service rifle, adopted 2014, notable for returning to full-power 7.62 NATO where most armies went the other way. The 5.56 mm MPT-55 shares its layout.');

  gun('guns', 'Colt Canada C7A2 / C8 carbine', 'Canada', 'Assault rifle / carbine', '5.56 x 45 mm',
    300, 500, 3000, 940,
    [['Rate of fire', 800, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.3, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The Canadian AR-15 derivative, also the service rifle of the Netherlands and Denmark. The C8 carbine is widely carried by special forces well outside Canada.');

  gun('guns', 'F88 Austeyr / EF88', 'Australia', 'Assault rifle, bullpup', '5.56 x 45 mm',
    300, 500, 2800, 940,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Australian licence-built Steyr AUG. The EF88 rebuild shortened and lightened it and added a full rail; it arms the Australian and New Zealand infantry.');

  gun('guns', 'Ak 5C', 'Sweden', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.0, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Swedish FN FNC derivative, reworked for cold weather: oversized controls that work in heavy gloves and a trigger guard that opens out for mittens.');

  gun('guns', 'Sako Rk 62M / M23', 'Finland', 'Assault rifle', '7.62 x 39 mm',
    300, 500, 3000, 715,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.3, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Finnish Kalashnikov, made to a notably higher standard than the original. The M23 replacing it moves Finland to 5.56 mm and a STANAG magazine.');

  gun('guns', 'Malyuk (Vulcan-M)', 'Ukraine', 'Assault rifle, bullpup', '5.45 x 39 / 7.62 x 39 mm',
    300, 500, 3000, 900,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.9, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'A Ukrainian bullpup rebuild of the AK action, shortening the weapon for vehicle and trench work while keeping AK magazines and parts.');

  gun('guns', 'FX-05 Xiuhcoatl', 'Mexico', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'Mexico\'s own design, adopted 2006 to end dependence on imported G3 and M16 rifles. Standard across the Mexican army.');

  gun('guns', 'IMBEL IA2', 'Brazil', 'Assault rifle', '5.56 x 45 / 7.62 x 51 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.6, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Brazilian service rifle since 2012, replacing the licence-built FAL. Made in both calibres on the same receiver.');

  gun('guns', 'Pindad SS2', 'Indonesia', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 720, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The Indonesian standard rifle, developed from the FNC. Built for humidity and salt, and widely exported around south-east Asia.');

  gun('guns', 'SAR 21', 'Singapore', 'Assault rifle, bullpup', '5.56 x 45 mm',
    300, 460, 2800, 970,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Singaporean bullpup, unusual in having a laser aiming device and a transparent magazine as standard, and a blast shield between the chamber and the firer.');

  gun('guns', 'T91', 'Taiwan', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.2, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The Taiwanese standard rifle, an AR-18-derived action in an AR-15 layout, issued across the ROC armed forces.');

  gun('guns', 'Type 88', 'North Korea', 'Assault rifle', '5.45 x 39 mm',
    300, 500, 3000, 900,
    [['Rate of fire', 650, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds, sometimes helical 150']],
    'The standard Korean People\'s Army rifle, an AK-74 pattern. Occasionally seen with a helical high-capacity magazine on parade, rarely in the field.');

  gun('guns', 'KH-2002 / Fateh', 'Iran', 'Assault rifle, bullpup', '5.56 x 45 mm',
    300, 450, 2800, 900,
    [['Rate of fire', 800, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.7, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'An Iranian bullpup built on the licence-produced M16 action. The newer Fateh and Masaf rifles are more commonly seen with regular units.');

  gun('guns', 'VHS-2', 'Croatia', 'Assault rifle, bullpup', '5.56 x 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.3, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The Croatian bullpup service rifle, also adopted by Iraq and bought by France as a stopgap while the FAMAS was replaced.');

  gun('guns', 'Caracal CAR816', 'United Arab Emirates', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 900,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.2, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'A short-stroke piston AR, the UAE service rifle and increasingly seen across the Gulf and in Egyptian and Saudi hands.');

  gun('guns', 'LMT MARS-L', 'New Zealand', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 750, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.4, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The New Zealand replacement for the Steyr, adopted 2017: a conventional AR-15 layout chosen deliberately over another bullpup.');

  gun('guns', 'Arsenal AR-M1', 'Bulgaria', 'Assault rifle', '5.56 x 45 / 7.62 x 39 mm',
    300, 500, 3000, 910,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.6, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Bulgarian AK, made in both NATO and Soviet calibres. Heavily exported and very widely seen across the Middle East and Africa.');

  gun('guns', 'PM md. 63/65', 'Romania', 'Assault rifle', '7.62 x 39 mm',
    300, 400, 3000, 715,
    [['Rate of fire', 600, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.5, 'mass'],
     ['Magazine', 30, 'none', 'rounds']],
    'The Romanian AKM with its distinctive forward wooden foregrip. Made in enormous numbers and one of the most widely distributed rifles in the world.');

  gun('guns', 'Heckler & Koch HK433', 'Germany', 'Assault rifle', '5.56 x 45 mm',
    300, 500, 3000, 920,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.8, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The successor design blending the G36 and the HK416: fully ambidextrous, with a folding adjustable stock and a quick-change barrel.');

  gun('guns', 'M16A2', 'United States', 'Assault rifle', '5.56 x 45 mm',
    300, 550, 3600, 948,
    [['Rate of fire', 800, 'none', 'rounds/min, cyclic'], ['Weight, empty', 3.9, 'mass'],
     ['Magazine', 30, 'none', 'rounds, STANAG']],
    'The three-round-burst A2, still in service with reserve and allied forces in very large numbers even where the A4 and M4 have replaced it in front-line units.');

  gun('guns', 'SIG MCX Spear / XM7', 'United States', 'Assault rifle', '6.8 x 51 mm',
    400, 600, 3800, 900,
    [['Rate of fire', 700, 'none', 'rounds/min, cyclic'], ['Weight, empty', 4.0, 'mass'],
     ['Magazine', 20, 'none', 'rounds']],
    'The US Next Generation Squad Weapon, adopted 2022 to replace the M4 in close-combat units. Its 6.8 mm round runs at far higher pressure to defeat modern body armour at range.');

})();
