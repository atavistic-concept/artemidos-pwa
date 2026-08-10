/*
 * Artemidos - radio models and channel tables, 2010-2020 era
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * The radios most likely to be met in the field in that decade, grouped by
 * the service they speak, with the channel-to-frequency table each service
 * uses. The table is the useful half: two different handhelds interoperate
 * exactly when they share a channel table, and "channel 8" means nothing
 * until it is a frequency.
 *
 * Channelised services have fixed public tables (PMR446, FRS/GMRS, MURS,
 * CB, Marine); amateur and business sets are freely programmed, so their
 * entries carry band coverage instead of a channel list.
 */
(function (global) {
  'use strict';

  /* ── channel tables: [channel, MHz] ── */
  var CH = {
    pmr446: {
      n: 'PMR446 (Europe) - 16 channels', unit: 'MHz',
      note: '12.5 kHz spacing from 446.00625. Analogue FM; dPMR446/DMR446 digital sets share the same slice.',
      rows: [[1, 446.00625], [2, 446.01875], [3, 446.03125], [4, 446.04375], [5, 446.05625], [6, 446.06875], [7, 446.08125], [8, 446.09375],
             [9, 446.10625], [10, 446.11875], [11, 446.13125], [12, 446.14375], [13, 446.15625], [14, 446.16875], [15, 446.18125], [16, 446.19375]]
    },
    frs: {
      n: 'FRS / GMRS (US & Canada) - 22 channels', unit: 'MHz',
      note: 'Channels 1-7 shared FRS/GMRS, 8-14 FRS only (0.5 W), 15-22 shared. GMRS repeater inputs sit 5 MHz above 15-22.',
      rows: [[1, 462.5625], [2, 462.5875], [3, 462.6125], [4, 462.6375], [5, 462.6625], [6, 462.6875], [7, 462.7125],
             [8, 467.5625], [9, 467.5875], [10, 467.6125], [11, 467.6375], [12, 467.6625], [13, 467.6875], [14, 467.7125],
             [15, 462.5500], [16, 462.5750], [17, 462.6000], [18, 462.6250], [19, 462.6500], [20, 462.6750], [21, 462.7000], [22, 462.7250]]
    },
    murs: {
      n: 'MURS (US) - 5 channels', unit: 'MHz',
      note: 'Licence-free VHF, 2 W. Channels 4-5 are the old "colour dot" business frequencies.',
      rows: [[1, 151.820], [2, 151.880], [3, 151.940], [4, 154.570], [5, 154.600]]
    },
    cb: {
      n: 'CB 27 MHz - 40 channels (EU/US "mids")', unit: 'MHz',
      note: 'Ch 9 emergency, Ch 19 road. AM/FM 4 W, SSB 12 W where allowed. UK also has a separate 27/81 block.',
      rows: [[1, 26.965], [2, 26.975], [3, 26.985], [4, 27.005], [5, 27.015], [6, 27.025], [7, 27.035], [8, 27.055],
             [9, 27.065], [10, 27.075], [11, 27.085], [12, 27.105], [13, 27.115], [14, 27.125], [15, 27.135], [16, 27.155],
             [17, 27.165], [18, 27.175], [19, 27.185], [20, 27.205], [21, 27.215], [22, 27.225], [23, 27.255], [24, 27.235],
             [25, 27.245], [26, 27.265], [27, 27.275], [28, 27.285], [29, 27.295], [30, 27.305], [31, 27.315], [32, 27.325],
             [33, 27.335], [34, 27.345], [35, 27.355], [36, 27.365], [37, 27.375], [38, 27.385], [39, 27.395], [40, 27.405]]
    },
    marine: {
      n: 'Marine VHF - key channels', unit: 'MHz',
      note: 'Ch 16 is distress, safety and calling, monitored by coastguard and ships. 70 is DSC data only - never voice.',
      rows: [[6, 156.300], [8, 156.400], [9, 156.450], [10, 156.500], [12, 156.600], [13, 156.650], [14, 156.700],
             [16, 156.800], [67, 156.375], [68, 156.425], [69, 156.475], [70, 156.525], [72, 156.625], [73, 156.675], [77, 156.875]]
    },
    air: {
      n: 'Airband - fixed points', unit: 'MHz',
      note: 'AM voice. 121.5 is the civil emergency ("Guard") frequency; 123.45 is the unofficial air-to-air chat channel.',
      rows: [['Guard', 121.500], ['UNICOM (US)', 122.800], ['Air-to-air', 123.450], ['SAR scene', 123.100], ['Military guard', 243.000]]
    }
  };

  /* ── models: [model, years, service key or band text] ──
     grouped by brand; svc points at a channel table above, band is free text
     for programmable sets */
  var MODELS = [
    { brand: 'Baofeng', items: [
      ['UV-5R', '2012-', null, 'The most common handheld on earth; programmable, ships unlocked', '136-174 / 400-520 MHz'],
      ['UV-82', '2013-', null, 'Bigger battery and dual PTT', '136-174 / 400-520 MHz'],
      ['BF-888S', '2011-', null, '16 programmable memories, sold in fleets of cheap pairs', '400-470 MHz'],
      ['UV-9R', '2017-', null, 'Waterproof UV-5R derivative', '136-174 / 400-520 MHz'],
      ['BF-F8HP', '2014-', null, '8 W version of the UV-5R', '136-174 / 400-520 MHz'],
      ['UV-5RTP', '2015-', null, '8 W tri-power UV-5R', '136-174 / 400-520 MHz']
    ]},
    { brand: 'Motorola', items: [
      ['TLKR T60 / T80 / T92', '2010-', 'pmr446', 'Consumer PMR446 family, T92 waterproof', '446.00625-446.19375 MHz'],
      ['Talkabout T200 / T460 / T600', '2016-', 'frs', 'US FRS consumer line', '462.5500-467.7125 MHz'],
      ['DP1400', '2011-', null, 'Entry professional DMR/analogue, VHF or UHF', '136-174 or 403-470 MHz'],
      ['DP4400 / DP4800', '2012-', null, 'MOTOTRBO professional DMR, fleet standard worldwide', '136-174 / 403-527 MHz'],
      ['GP340', '2000s-2015', null, 'Legacy professional analogue, still everywhere second-hand', '136-174 / 403-470 MHz'],
      ['SL4000', '2013-', null, 'Slim professional DMR for covert / executive carry', '136-174 / 403-470 MHz'],
      ['XPR 7550', '2013-', null, 'US MOTOTRBO flagship handheld', '136-174 / 403-512 MHz']
    ]},
    { brand: 'Kenwood', items: [
      ['TK-3401D', '2013-', 'pmr446', 'Licence-free dPMR446/analogue professional', '446.00625-446.19375 MHz'],
      ['TK-3501', '2015-', 'pmr446', 'Analogue PMR446 professional', '446.00625-446.09375 MHz'],
      ['TH-D72', '2010-2019', null, 'Amateur 2 m/70 cm with GPS and APRS', '144-148 / 430-450 MHz TX, wideband RX'],
      ['TH-F7E', '2001-2015', null, 'Amateur dual-band, wideband receiver', '144 / 430 MHz TX, 0.1-1300 MHz RX'],
      ['NX-1200 / NX-1300', '2018-', null, 'NEXEDGE digital/analogue professional', '136-174 / 400-470 MHz']
    ]},
    { brand: 'Icom', items: [
      ['IC-F1000 / F2000', '2014-', null, 'Professional analogue VHF/UHF', '136-174 / 400-470 MHz'],
      ['ID-51', '2012-2019', null, 'Amateur D-STAR dual-band', '144 / 430 MHz TX, wideband RX'],
      ['IC-M25', '2015-', 'marine', 'Buoyant marine VHF handheld', '156.025-157.425 MHz'],
      ['IC-M323 / M330', '2012-', 'marine', 'Fixed-mount marine VHF with DSC', '156.025-157.425 MHz'],
      ['IC-A15 / A25', '2010-', 'air', 'Airband handhelds for pilots and ground crews', '118-136.992 MHz AM'],
      ['IC-7300', '2016-', null, 'HF/50 MHz base, the decade’s best-selling HF set', '0.03-74.8 MHz RX, 1.8-50 MHz TX']
    ]},
    { brand: 'Yaesu', items: [
      ['FT-60R', '2004-', null, 'Amateur 2 m/70 cm workhorse handheld', '144 / 430 MHz TX, 108-999 MHz RX'],
      ['FT-70D', '2017-', null, 'Amateur C4FM digital dual-band', '144 / 430 MHz'],
      ['VX-6R', '2005-', null, 'Submersible amateur tri-band', '50 / 144 / 430 MHz TX, 0.5-999 MHz RX'],
      ['FT-857D / FT-891', '2003- / 2016-', null, 'HF-to-UHF mobile sets carried as manpacks', '1.8-54 / 144 / 430 MHz (857D), HF to 6 m (891)'],
      ['FT-818 / FT-817ND', '2001-', null, 'QRP portable HF-UHF, the field-radio classic', '1.8-54 / 144 / 430 MHz, 6 W']
    ]},
    { brand: 'Midland', items: [
      ['G7 Pro', '2010-', 'pmr446', 'PMR446 with export power switch, sold across Europe', '446.00625-446.19375 MHz'],
      ['G9 Pro', '2013-', 'pmr446', 'Rugged PMR446, dual PTT', '446.00625-446.19375 MHz'],
      ['GXT1000', '2010-', 'frs', 'US GMRS consumer flagship', '462.5500-467.7125 MHz'],
      ['Alan 42 / 48', '2010-', 'cb', 'Portable and mobile CB, European road standard', '26.965-27.405 MHz']
    ]},
    { brand: 'Retevis / TYT / Wouxun', items: [
      ['Retevis RT622 / RT24', '2016-', 'pmr446', 'Licence-free PMR446 pairs', '446.00625-446.09375 MHz'],
      ['Retevis RT3S', '2017-', null, 'DMR dual-band handheld (TYT MD-UV380 twin)', '136-174 / 400-480 MHz'],
      ['TYT MD-380', '2015-', null, 'The DMR handheld that opened digital to everyone', '400-480 MHz UHF or 136-174 MHz VHF'],
      ['Wouxun KG-UV8D', '2014-', null, 'Dual-band amateur with cross-band repeat', '136-174 / 400-480 MHz'],
      ['Quansheng UV-K5', '2023', null, 'After the window but already everywhere; hackable firmware', '50-600 MHz RX, 136-174 / 400-470 MHz TX']
    ]},
    { brand: 'Hytera', items: [
      ['PD365 / PD405', '2014-', null, 'Compact professional DMR', '400-470 MHz'],
      ['PD505LF', '2015-', 'pmr446', 'Licence-free DMR446', '446.00625-446.19375 MHz'],
      ['PD785 / PD985', '2012-', null, 'Full-size professional DMR, common in EU security', '136-174 / 350-470 MHz'],
      ['X1p', '2014-', null, 'Slim covert DMR with full keypad', '136-174 / 350-470 MHz']
    ]},
    { brand: 'Uniden / Cobra / Standard Horizon', items: [
      ['Uniden BC125AT', '2012-', null, 'Analogue scanner: airband, marine, ham, public safety', '25-512 MHz, receive only'],
      ['Uniden SDS100', '2018-', null, 'Digital trunking scanner (P25, DMR, NXDN)', '25-1300 MHz, receive only'],
      ['Cobra 29 LX', '2010-', 'cb', 'US truck-cab CB standard', '26.965-27.405 MHz'],
      ['Standard Horizon HX870', '2014-', 'marine', 'Marine handheld with GPS and DSC distress', '156.025-157.425 MHz']
    ]},
    { brand: 'Sepura / Airbus (TETRA)', items: [
      ['Sepura STP8000 / STP9000', '2010-', null, 'TETRA handhelds, UK and EU emergency services', '380-430 MHz TETRA'],
      ['Sepura SC20', '2016-', null, 'TETRA, current UK police issue of the era', '380-430 MHz TETRA'],
      ['Airbus TH1n', '2015-', null, 'Slim TETRA for covert and executive use', '380-430 MHz TETRA'],
      ['Motorola MTP3250 / MTP6650', '2013-', null, 'TETRA handhelds, services and transport', '380-430 MHz TETRA']
    ]},
    { brand: 'Military & surplus common in 2010-2020', items: [
      ['Harris AN/PRC-152', '2005-', null, 'Multiband tactical handheld, NATO standard', '30-512 MHz'],
      ['Harris AN/PRC-117G', '2008-', null, 'Manpack, SATCOM capable', '30-2000 MHz'],
      ['Thales AN/PRC-148 MBITR', '2000-', null, 'Tactical handheld', '30-512 MHz'],
      ['Thales PR4G', '1990s-', null, 'French VHF combat net radio, frequency-hopping', '30-88 MHz'],
      ['R-187P1 Azart', '2012-', null, 'Russian tactical SDR handheld', '27-520 MHz'],
      ['Baofeng in militia use', '2014-', null, 'Cheap dual-banders became the de facto irregular-forces radio; assume no security whatsoever', '136-174 / 400-520 MHz']
    ]}
  ];

  global.ALGOZ_RADIO_MODELS = { CH: CH, MODELS: MODELS };

})(window);
