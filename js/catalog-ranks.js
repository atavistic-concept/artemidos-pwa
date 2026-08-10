/*
 * Artemidos - catalogue: ranks, insignia and camouflage
 * Copyright (c) 2026 Atavistic Concept. All rights reserved.
 *
 * WHO ARE YOU ACTUALLY TALKING TO.
 *
 * At a checkpoint, a cordon or a hotel lobby, three things decide how a
 * conversation goes: which service the person belongs to, what authority that
 * service has, and how senior they are. Get any of the three wrong and you
 * either escalate something trivial or hand a decision to somebody who cannot
 * make it.
 *
 * Military ranks are given with their NATO code, which is the only way to
 * compare across countries: a French capitaine, a US captain and a Russian
 * kapitan are all OF-2, while a US Navy captain is OF-5 and commands a
 * warship. Reading the code rather than the word avoids that trap.
 *
 * OF-1 to OF-10 are commissioned officers, OR-1 to OR-9 are enlisted ranks
 * and non-commissioned officers, and WO marks warrant officers where a
 * country uses them.
 *
 * Police forces are listed by what they are ALLOWED to do, not by what they
 * are called. The name rarely tells you: the Polícia Militar in Brazil is a
 * state police force and not part of the army, the Gendarmerie in France is
 * part of the armed forces and does police the countryside, and the Guardia
 * di Finanza in Italy will stop you about money rather than about driving.
 *
 * Sources are the published comparative rank tables and the open camouflage
 * literature. Ranks change slowly; police structures change with governments,
 * so confirm locally before anything depends on it.
 */
(function () {
  'use strict';

  var C = window.ART_CATALOG;

  /* ── these live under Military systems ──
     Ranks, insignia and camouflage were their own top-level category, which
     put them a section away from the equipment they are worn beside. They
     answer the same question as the rest of that section - what am I looking
     at, and whose is it - so they are subcategories of it now.

     Their ids are unchanged, so every stored shortcut, every deep link and
     every reference to speed/rank/... still resolves. Only the category they
     hang from has moved. */
  C.addSubs('mil', [
    { id: 'milrank', n: 'Military ranks', icon: 'star', d: 'By country, with NATO codes' },
    { id: 'camo', n: 'Camouflage patterns', icon: 'recon', d: 'What each army wears, and where' },
    { id: 'polforce', n: 'Police and authorities', icon: 'shield', d: 'Each force, what it does, and its rank insignia, by country' }
  ]);

  /* Which insignia ladders belong to this entry. The plates themselves live in
     rank-plates.js, generated from Commons, and are looked up by these keys so
     that adding a country's plates never means editing this file. */
  function plateKeys(country, sub) {
    var P = window.ALGOZ_RANK_PLATES || {};
    var want = sub === 'polrank' ? ['Police'] : ['Army', 'Navy', 'Air force'];
    var out = {};
    want.forEach(function (b) {
      var k = country + '|' + b;
      if (P[k] && P[k].length) out[k] = true;
    });
    return Object.keys(out).length ? out : null;
  }

  function ranks(sub, country, service, rows, note, ord) {
    C.add({
      cat: 'mil', sub: sub, n: country, country: country, d: service, ord: ord,
      plates: plateKeys(country, sub),
      table: { plain: true, cols: ['Rank', 'Code and notes'], rows: rows },
      note: note
    });
  }

  /* ── how to read it ───────────────────────────────────────────────── */

  C.add({
    cat: 'mil', sub: 'milrank', ord: -1, n: 'Reading rank across countries', d: 'The NATO code is the only reliable comparison',
    table: {
      plain: true, cols: ['Code', 'What sits there'],
      rows: [
        ['OF-10', 'Five star. Field marshal, general of the army. Mostly ceremonial or wartime only.'],
        ['OF-9', 'General, admiral. Service chief.'],
        ['OF-8', 'Lieutenant general, vice admiral. Corps command.'],
        ['OF-7', 'Major general, rear admiral. Division command.'],
        ['OF-6', 'Brigadier, commodore. Brigade command.'],
        ['OF-5', 'Colonel, or a NAVY captain. Regiment, or a major warship.'],
        ['OF-4', 'Lieutenant colonel, commander. Battalion.'],
        ['OF-3', 'Major, lieutenant commander. Company or staff.'],
        ['OF-2', 'Captain, lieutenant. Company command in most armies.'],
        ['OF-1', 'Lieutenant, second lieutenant, ensign. Platoon.'],
        ['WO', 'Warrant officer. Technical or disciplinary authority outside the officer chain.'],
        ['OR-9', 'Sergeant major, chief petty officer. The senior soldier, and often the one who actually decides.'],
        ['OR-6 to OR-8', 'Senior NCOs: staff sergeant, sergeant first class.'],
        ['OR-4 to OR-5', 'Corporal, sergeant. Section and squad.'],
        ['OR-1 to OR-3', 'Private, seaman, airman.']
      ]
    },
    note: 'The single most common mistake is CAPTAIN. In an army it is OF-2, a young officer commanding perhaps a hundred people. In a navy it is OF-5, equivalent to an army colonel, commanding a warship. If someone introduces themselves as a captain, the uniform tells you which one you are dealing with, and the difference is four ranks.'
  });

  /* ── military ranks ───────────────────────────────────────────────── */

  ranks('milrank', 'United States', 'US Army, senior first', [
    ['General of the Army', 'OF-10, wartime only'],
    ['General', 'OF-9, four star'],
    ['Lieutenant General', 'OF-8, three star'],
    ['Major General', 'OF-7, two star'],
    ['Brigadier General', 'OF-6, one star'],
    ['Colonel', 'OF-5, eagle'],
    ['Lieutenant Colonel', 'OF-4, silver oak leaf'],
    ['Major', 'OF-3, gold oak leaf'],
    ['Captain', 'OF-2, two silver bars'],
    ['First Lieutenant', 'OF-1, one silver bar'],
    ['Second Lieutenant', 'OF-1, one gold bar'],
    ['Warrant Officer 1 to Chief Warrant Officer 5', 'WO, technical specialists'],
    ['Sergeant Major of the Army', 'OR-9, one post in the whole army'],
    ['Command Sergeant Major', 'OR-9'],
    ['First Sergeant / Master Sergeant', 'OR-8'],
    ['Sergeant First Class', 'OR-7'],
    ['Staff Sergeant', 'OR-6'],
    ['Sergeant', 'OR-5'],
    ['Corporal / Specialist', 'OR-4'],
    ['Private First Class', 'OR-3'],
    ['Private', 'OR-1 to OR-2']
  ], 'Officer insignia sit on the chest or collar and are silver or gold metal; enlisted chevrons are worn on the chest of the combat uniform. Silver outranks gold at officer level, which catches people out: a silver oak leaf (lieutenant colonel) is senior to a gold one (major).');

  ranks('milrank', 'United Kingdom', 'British Army, senior first', [
    ['Field Marshal', 'OF-10, ceremonial'],
    ['General', 'OF-9'],
    ['Lieutenant General', 'OF-8'],
    ['Major General', 'OF-7'],
    ['Brigadier', 'OF-6'],
    ['Colonel', 'OF-5, crown and two pips'],
    ['Lieutenant Colonel', 'OF-4, crown and one pip'],
    ['Major', 'OF-3, crown'],
    ['Captain', 'OF-2, three pips'],
    ['Lieutenant', 'OF-1, two pips'],
    ['Second Lieutenant', 'OF-1, one pip'],
    ['Warrant Officer Class 1', 'WO, royal coat of arms on the forearm'],
    ['Warrant Officer Class 2', 'WO, crown in a wreath'],
    ['Staff / Colour Sergeant', 'OR-7, three chevrons and a crown'],
    ['Sergeant', 'OR-6, three chevrons'],
    ['Corporal', 'OR-4, two chevrons'],
    ['Lance Corporal', 'OR-3, one chevron'],
    ['Private', 'OR-1 to OR-2, and called by regiment: Guardsman, Rifleman, Trooper, Sapper, Gunner']
  ], 'The private soldier is almost never called a private in speech: the regiment decides the word, and using the right one is the quickest way to show you know where you are. A Warrant Officer Class 1 is addressed as Sir by everyone below him and by his appointment, RSM, by officers.');

  ranks('milrank', 'France', 'Armée de terre, senior first', [
    ['Maréchal de France', 'OF-10, dignity of state, not a rank'],
    ['Général d’armée', 'OF-9, five stars'],
    ['Général de corps d’armée', 'OF-8, four stars'],
    ['Général de division', 'OF-7, three stars'],
    ['Général de brigade', 'OF-6, two stars'],
    ['Colonel', 'OF-5, five bars'],
    ['Lieutenant-colonel', 'OF-4, five bars, alternating'],
    ['Commandant / Chef de bataillon', 'OF-3, four bars'],
    ['Capitaine', 'OF-2, three bars'],
    ['Lieutenant', 'OF-1, two bars'],
    ['Sous-lieutenant', 'OF-1, one bar'],
    ['Major', 'OR-9'],
    ['Adjudant-chef', 'OR-8'],
    ['Adjudant', 'OR-7'],
    ['Sergent-chef / Maréchal des logis-chef', 'OR-6'],
    ['Sergent / Maréchal des logis', 'OR-5'],
    ['Caporal-chef / Brigadier-chef', 'OR-4'],
    ['Caporal / Brigadier', 'OR-3'],
    ['Soldat de 1re classe', 'OR-2']
  ], 'Cavalry, armour and artillery use maréchal des logis and brigadier where the infantry uses sergent and caporal: same rank, different word, depending on the arm. Gendarmerie ranks are military ranks, because the Gendarmerie is part of the armed forces.');

  ranks('milrank', 'Germany', 'Bundeswehr Heer, senior first', [
    ['General', 'OF-9'],
    ['Generalleutnant', 'OF-8'],
    ['Generalmajor', 'OF-7'],
    ['Brigadegeneral', 'OF-6'],
    ['Oberst', 'OF-5'],
    ['Oberstleutnant', 'OF-4'],
    ['Major', 'OF-3'],
    ['Hauptmann', 'OF-2'],
    ['Oberleutnant', 'OF-1'],
    ['Leutnant', 'OF-1'],
    ['Oberstabsfeldwebel', 'OR-9'],
    ['Stabsfeldwebel', 'OR-8'],
    ['Hauptfeldwebel', 'OR-7'],
    ['Oberfeldwebel', 'OR-6'],
    ['Feldwebel', 'OR-6'],
    ['Stabsunteroffizier', 'OR-5'],
    ['Unteroffizier', 'OR-4'],
    ['Hauptgefreiter / Obergefreiter', 'OR-3'],
    ['Gefreiter', 'OR-2'],
    ['Schütze / Jäger / Panzergrenadier', 'OR-1, named by branch']
  ], 'The Bundeswehr has no OF-10 and has not appointed one since 1945. Rank is worn on the chest or shoulder loops, and the branch also renames the lowest rank the way British regiments do.');

  ranks('milrank', 'Italy', 'Esercito Italiano, senior first', [
    ['Generale', 'OF-10'],
    ['Generale di Corpo d’Armata', 'OF-9, also Tenente Generale'],
    ['Generale di Divisione', 'OF-8, also Maggior Generale'],
    ['Generale di Brigata', 'OF-7, also Brigadier Generale'],
    ['Colonnello', 'OF-5'],
    ['Tenente Colonnello', 'OF-4'],
    ['Maggiore', 'OF-3'],
    ['Primo Capitano', 'OF-2, seniority grade of captain'],
    ['Capitano', 'OF-2'],
    ['Tenente', 'OF-1'],
    ['Sottotenente', 'OF-1'],
    ['Primo Luogotenente', 'OR-9, first sub-lieutenant'],
    ['Luogotenente', 'OR-9, sub-lieutenant'],
    ['Primo Maresciallo', 'OR-9, first marshal'],
    ['Maresciallo Capo', 'OR-8, chief marshal'],
    ['Maresciallo Ordinario', 'OR-7, ordinary marshal'],
    ['Maresciallo', 'OR-6, marshal'],
    ['Sergente Maggiore Aiutante', 'OR-6, chief sergeant major adjutant'],
    ['Sergente Maggiore Capo', 'OR-5, chief sergeant major'],
    ['Sergente Maggiore', 'OR-5, sergeant major'],
    ['Sergente', 'OR-5, sergeant'],
    ['Graduato Aiutante', 'OR-4, graduate adjutant'],
    ['Primo Graduato', 'OR-4, first graduate'],
    ['Graduato Capo', 'OR-4, chief graduate'],
    ['Graduato Scelto', 'OR-4, graduate select'],
    ['Graduato', 'OR-4, graduate'],
    ['Caporal Maggiore', 'OR-3, corporal-major'],
    ['Caporale', 'OR-2, corporal'],
    ['Soldato', 'OR-1, private']
  ], 'Maresciallo is a warrant-officer tier and not a marshal: the false friend runs the wrong way, since maresciallo sits well below any general. The enlisted side is unusually deep - three grades at OR-9 and five volunteer grades at OR-4 - because permanent and temporary service volunteers are ranked separately. Italy leaves OF-6 empty, so a colonnello is promoted straight to generale di brigata. Carabinieri use the same military ranks, being a branch of the armed forces.');

  ranks('milrank', 'Spain', 'Ejército de Tierra, senior first', [
    ['Capitán General', 'OF-10, held by the King'],
    ['General de Ejército', 'OF-9'],
    ['Teniente General', 'OF-8'],
    ['General de División', 'OF-7'],
    ['General de Brigada', 'OF-6'],
    ['Coronel', 'OF-5'],
    ['Teniente Coronel', 'OF-4'],
    ['Comandante', 'OF-3'],
    ['Capitán', 'OF-2'],
    ['Teniente', 'OF-1'],
    ['Alférez', 'OF-1'],
    ['Suboficial Mayor', 'OR-9'],
    ['Subteniente', 'OR-8'],
    ['Brigada', 'OR-7'],
    ['Sargento Primero', 'OR-6'],
    ['Sargento', 'OR-5'],
    ['Cabo Mayor / Cabo Primero', 'OR-4'],
    ['Cabo', 'OR-3'],
    ['Soldado', 'OR-1']
  ], 'Brigada is a rank, not a formation, and sits at OR-7 among the senior NCOs. Guardia Civil uses these same military ranks.');

  ranks('milrank', 'Portugal', 'Exército Português, senior first', [
    ['General', 'OF-9'],
    ['Tenente-General', 'OF-8'],
    ['Major-General', 'OF-7'],
    ['Brigadeiro-General', 'OF-6'],
    ['Coronel', 'OF-5'],
    ['Tenente-Coronel', 'OF-4'],
    ['Major', 'OF-3'],
    ['Capitão', 'OF-2'],
    ['Tenente', 'OF-1'],
    ['Alferes', 'OF-1'],
    ['Sargento-Mor', 'OR-9'],
    ['Sargento-Chefe', 'OR-8'],
    ['Sargento-Ajudante', 'OR-7'],
    ['Primeiro-Sargento', 'OR-6'],
    ['Segundo-Sargento', 'OR-5'],
    ['Cabo-Adjunto / Primeiro-Cabo', 'OR-4'],
    ['Segundo-Cabo', 'OR-3'],
    ['Soldado', 'OR-1']
  ]);

  ranks('milrank', 'Brazil', 'Exército Brasileiro, senior first', [
    ['Marechal', 'OF-10, wartime only'],
    ['General de Exército', 'OF-9'],
    ['General de Divisão', 'OF-8'],
    ['General de Brigada', 'OF-7'],
    ['Coronel', 'OF-5'],
    ['Tenente-Coronel', 'OF-4'],
    ['Major', 'OF-3'],
    ['Capitão', 'OF-2'],
    ['Primeiro-Tenente', 'OF-1'],
    ['Segundo-Tenente', 'OF-1'],
    ['Subtenente', 'OR-9'],
    ['Primeiro-Sargento', 'OR-8'],
    ['Segundo-Sargento', 'OR-7'],
    ['Terceiro-Sargento', 'OR-6'],
    ['Cabo', 'OR-4'],
    ['Soldado', 'OR-1']
  ], 'Brazil has no OF-6: it goes from colonel straight to general de brigada. The state Polícia Militar copies these rank names exactly, which is the single biggest source of confusion about what it is, and it is not a military unit.');

  ranks('milrank', 'Russia', 'Ground Forces, senior first', [
    ['Marshal of the Russian Federation', 'OF-10'],
    ['General of the Army', 'OF-9'],
    ['Colonel General', 'OF-8'],
    ['Lieutenant General', 'OF-7'],
    ['Major General', 'OF-6'],
    ['Colonel (Polkovnik)', 'OF-5'],
    ['Lieutenant Colonel (Podpolkovnik)', 'OF-4'],
    ['Major', 'OF-3'],
    ['Captain (Kapitan)', 'OF-2'],
    ['Senior Lieutenant', 'OF-1'],
    ['Lieutenant', 'OF-1'],
    ['Junior Lieutenant', 'OF-1'],
    ['Senior Warrant Officer (Starshiy Praporshchik)', 'WO'],
    ['Warrant Officer (Praporshchik)', 'WO'],
    ['Starshina', 'OR-8, company senior soldier'],
    ['Senior Sergeant', 'OR-6'],
    ['Sergeant', 'OR-5'],
    ['Junior Sergeant', 'OR-4'],
    ['Yefreitor', 'OR-3'],
    ['Ryadovoy (private)', 'OR-1']
  ], 'The general tiers run one step senior to the western pattern: a Russian major general is OF-6, where a US major general is OF-7. Comparing the words gives the wrong answer; comparing the codes gives the right one.');

  ranks('milrank', 'United Arab Emirates', 'UAE Armed Forces, senior first', [
    ['Fariq Awwal (General)', 'OF-9'],
    ['Fariq (Lieutenant General)', 'OF-8'],
    ['Liwa (Major General)', 'OF-7'],
    ['Amid (Brigadier)', 'OF-6'],
    ['Aqid (Colonel)', 'OF-5'],
    ['Muqaddam (Lieutenant Colonel)', 'OF-4'],
    ['Ra’id (Major)', 'OF-3'],
    ['Naqib (Captain)', 'OF-2'],
    ['Mulazim Awwal (First Lieutenant)', 'OF-1'],
    ['Mulazim (Lieutenant)', 'OF-1'],
    ['Wakil Awwal (Warrant Officer)', 'WO'],
    ['Raqib Awwal (Staff Sergeant)', 'OR-7'],
    ['Raqib (Sergeant)', 'OR-5'],
    ['Arif (Corporal)', 'OR-4'],
    ['Jundi Awwal (Private First Class)', 'OR-2'],
    ['Jundi (Private)', 'OR-1']
  ], 'The same Arabic rank words run across most of the Gulf and the wider Arab world with only small variations, so learning this list covers Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, Jordan and Egypt at the same time.');

  ranks('milrank', 'Saudi Arabia', 'Royal Saudi Land Forces, senior first', [
    ['Mushir (Field Marshal)', 'OF-10, held by the King'],
    ['Fariq Awwal', 'OF-9'],
    ['Fariq', 'OF-8'],
    ['Liwa', 'OF-7'],
    ['Amid', 'OF-6'],
    ['Aqid', 'OF-5'],
    ['Muqaddam', 'OF-4'],
    ['Ra’id', 'OF-3'],
    ['Naqib', 'OF-2'],
    ['Mulazim Awwal', 'OF-1'],
    ['Mulazim', 'OF-1'],
    ['Raqib Awwal', 'OR-7'],
    ['Raqib', 'OR-5'],
    ['Arif', 'OR-4'],
    ['Jundi Awwal', 'OR-2'],
    ['Jundi', 'OR-1']
  ]);

  ranks('milrank', 'Israel', 'Israel Defense Forces, senior first', [
    ['Rav Aluf (Lieutenant General)', 'OF-9, one post: the Chief of Staff'],
    ['Aluf (Major General)', 'OF-8'],
    ['Tat Aluf (Brigadier General)', 'OF-7'],
    ['Aluf Mishne (Colonel)', 'OF-5'],
    ['Sgan Aluf (Lieutenant Colonel)', 'OF-4'],
    ['Rav Seren (Major)', 'OF-3'],
    ['Seren (Captain)', 'OF-2'],
    ['Segen (Lieutenant)', 'OF-1'],
    ['Segen Mishne (Second Lieutenant)', 'OF-1'],
    ['Rav Nagad', 'WO, most senior warrant officer'],
    ['Rav Samal Bakhir', 'OR-9'],
    ['Rav Samal Rishon', 'OR-8'],
    ['Rav Samal', 'OR-6'],
    ['Samal Rishon', 'OR-5'],
    ['Samal', 'OR-4'],
    ['Rav Turai', 'OR-2'],
    ['Turai (private)', 'OR-1']
  ], 'The IDF has a single unified rank system across army, navy and air force, which is unusual and makes comparison simpler than in most countries. There is no OF-10 and only one officer holds OF-9 at a time.');

  ranks('milrank', 'Turkey', 'Turkish Land Forces, senior first', [
    ['Mareşal', 'OF-10, wartime only'],
    ['Orgeneral', 'OF-9'],
    ['Korgeneral', 'OF-8'],
    ['Tümgeneral', 'OF-7'],
    ['Tuğgeneral', 'OF-6'],
    ['Albay', 'OF-5'],
    ['Yarbay', 'OF-4'],
    ['Binbaşı', 'OF-3'],
    ['Yüzbaşı', 'OF-2'],
    ['Üsteğmen', 'OF-1'],
    ['Teğmen', 'OF-1'],
    ['Astsubay Kıdemli Başçavuş', 'OR-9'],
    ['Başçavuş', 'OR-8'],
    ['Kıdemli Üstçavuş', 'OR-7'],
    ['Üstçavuş', 'OR-6'],
    ['Çavuş', 'OR-5'],
    ['Onbaşı', 'OR-4'],
    ['Er (private)', 'OR-1']
  ]);

  ranks('milrank', 'Egypt', 'Egyptian Army, senior first', [
    ['Mushir (Field Marshal)', 'OF-10'],
    ['Fariq Awwal', 'OF-9'],
    ['Fariq', 'OF-8'],
    ['Liwa', 'OF-7'],
    ['Amid', 'OF-6'],
    ['Aqid', 'OF-5'],
    ['Muqaddam', 'OF-4'],
    ['Ra’id', 'OF-3'],
    ['Naqib', 'OF-2'],
    ['Mulazim Awwal', 'OF-1'],
    ['Mulazim Thani', 'OF-1'],
    ['Musaid', 'WO'],
    ['Raqib Awwal', 'OR-7'],
    ['Raqib', 'OR-5'],
    ['Arif', 'OR-4'],
    ['Jundi', 'OR-1']
  ]);

  ranks('milrank', 'India', 'Indian Army, senior first', [
    ['Field Marshal', 'OF-10, honorary, twice awarded'],
    ['General', 'OF-9, the Chief of Army Staff'],
    ['Lieutenant General', 'OF-8'],
    ['Major General', 'OF-7'],
    ['Brigadier', 'OF-6'],
    ['Colonel', 'OF-5'],
    ['Lieutenant Colonel', 'OF-4'],
    ['Major', 'OF-3'],
    ['Captain', 'OF-2'],
    ['Lieutenant', 'OF-1'],
    ['Subedar Major', 'WO, junior commissioned officer'],
    ['Subedar', 'WO'],
    ['Naib Subedar', 'WO'],
    ['Havildar', 'OR-6, sergeant equivalent'],
    ['Naik', 'OR-4, corporal equivalent'],
    ['Lance Naik', 'OR-3'],
    ['Sepoy', 'OR-1, private; Rifleman, Gunner or Sowar by arm']
  ], 'The junior commissioned officer tier, subedar and naib subedar, has no western equivalent: they are commissioned, they hold real authority, and they sit between the warrant officers and the officers of most other armies.');

  ranks('milrank', 'China', 'PLA Ground Force, senior first', [
    ['General (Shangjiang)', 'OF-9'],
    ['Lieutenant General (Zhongjiang)', 'OF-8'],
    ['Major General (Shaojiang)', 'OF-7'],
    ['Senior Colonel (Daxiao)', 'OF-6, no western equivalent'],
    ['Colonel (Shangxiao)', 'OF-5'],
    ['Lieutenant Colonel (Zhongxiao)', 'OF-4'],
    ['Major (Shaoxiao)', 'OF-3'],
    ['Captain (Shangwei)', 'OF-2'],
    ['First Lieutenant (Zhongwei)', 'OF-1'],
    ['Second Lieutenant (Shaowei)', 'OF-1'],
    ['Master Sergeant classes 1 to 4', 'OR-8 to OR-9'],
    ['Sergeant classes 1 and 2', 'OR-5 to OR-6'],
    ['Corporal', 'OR-4'],
    ['Private First Class', 'OR-2'],
    ['Private', 'OR-1']
  ], 'Senior colonel sits between colonel and major general and has no direct equivalent in NATO structures, which is why Chinese ranks are usually mapped one step off in western reporting.');

  /* Camouflage now comes from catalog-camo.js, generated from Wikipedia's
     full list: every pattern with its swatch, rather than the eighteen I had
     picked by hand. */

  /* ── police forces and authority ──────────────────────────────────── */

  function forces(country, rows, note) {
    C.add({
      cat: 'mil', sub: 'polforce', n: country, country: country,
      d: 'Which force does what, and what it can do',
      table: { plain: true, cols: ['Force', 'Role and authority'], rows: rows },
      /* the country's police rank insignia now live on its own force page, as
         the identification half of "who is this and what can they do" */
      plates: plateKeys(country, 'polrank'),
      note: note
    });
  }

  forces('United States', [
    ['Municipal police', 'City policing. Authority ends at the city line, which is why jurisdiction is argued about so often.'],
    ['County sheriff', 'Elected. Polices unincorporated county land, runs the county jail, serves court process.'],
    ['State police / Highway Patrol', 'State-wide, highways and serious crime. In some states the two are separate forces.'],
    ['FBI', 'Federal crime and domestic intelligence: kidnapping, terrorism, public corruption, interstate crime. Not a national police force and cannot direct local police.'],
    ['US Marshals', 'Federal fugitives, witness protection, court and judge security, prisoner transport.'],
    ['DEA', 'Drug enforcement, domestic and overseas.'],
    ['ATF', 'Firearms, explosives, arson.'],
    ['ICE / HSI', 'Immigration enforcement in the interior, and transnational crime through HSI.'],
    ['CBP', 'Ports of entry and the border, including a 100-mile zone where its powers are wider.'],
    ['Secret Service', 'Protection of the President and others, plus financial crime and counterfeiting.'],
    ['CIA', 'Foreign intelligence. NO law enforcement power and no authority to arrest anyone, anywhere.']
  ], 'There is no national police force. Roughly 18,000 separate agencies operate under city, county, state and federal authority, and which one responds depends on where the line on the map falls. The CIA is not police and cannot detain: confusing it with the FBI is the most common mistake made about American law enforcement.');

  forces('United Kingdom', [
    ['Territorial police forces', '43 in England and Wales, plus Police Scotland and the PSNI. There is no national force.'],
    ['Metropolitan Police', 'London, and it also runs national counter-terrorism policing and royalty protection.'],
    ['National Crime Agency', 'Serious and organised crime, trafficking, cyber. Often called the British FBI, which overstates its powers.'],
    ['British Transport Police', 'The railway network, nationwide.'],
    ['Civil Nuclear Constabulary', 'Nuclear sites. Routinely armed, unlike most British police.'],
    ['MOD Police', 'Defence estate.'],
    ['MI5', 'Domestic security. No power of arrest: it works through Special Branch and counter-terrorism police.'],
    ['Border Force', 'Immigration and customs at the frontier.']
  ], 'Most British police officers are unarmed and firearms are held by a minority of trained officers, so an armed officer indicates either a specialist unit or a protected site. MI5 cannot arrest anybody; when an intelligence case ends in an arrest, police make it.');

  forces('France', [
    ['Police nationale', 'Cities and large towns. Civilian, under the Interior Ministry.'],
    ['Gendarmerie nationale', 'Everywhere else, which is most of the country by area. It is part of the ARMED FORCES and its members are soldiers.'],
    ['Police municipale', 'Town-level, limited powers, often unarmed.'],
    ['CRS', 'Public order reserves of the Police nationale, deployed to demonstrations and crowds.'],
    ['GIGN', 'Gendarmerie special intervention: hostages, terrorism, high-risk arrest.'],
    ['RAID / BRI', 'The Police nationale equivalents.'],
    ['Douane', 'Customs, with its own powers of search and its own armed officers.'],
    ['DGSI', 'Domestic security service, with judicial police powers in terrorism cases.']
  ], 'Whether you are dealing with police or gendarmerie depends purely on where you are standing, and the boundary is not marked. In rural France, at a motorway junction or in a small town, it is the gendarmerie, and they are military personnel operating under a different chain of command.');

  forces('Italy', [
    ['Polizia di Stato', 'Civilian national police, under the Interior Ministry.'],
    ['Arma dei Carabinieri', 'Gendarmerie and a branch of the ARMED FORCES, with full police powers everywhere and its own military duties.'],
    ['Guardia di Finanza', 'Financial police, under the Finance Ministry: tax, smuggling, customs, money laundering. Also a military corps.'],
    ['Polizia Locale', 'Municipal, traffic and local ordinance.'],
    ['Polizia Penitenziaria', 'Prisons.'],
    ['AISI / AISE', 'Domestic and foreign intelligence, no arrest powers.']
  ], 'Italy runs three national police forces with overlapping jurisdiction, which is deliberate and long-standing. If the matter concerns money, invoices, cash movements or customs, it will be the Guardia di Finanza, and they are the ones who stop private aircraft and yachts.');

  forces('Spain', [
    ['Cuerpo Nacional de Policía', 'Cities over 20,000, documentation, immigration, serious crime. Civilian.'],
    ['Guardia Civil', 'Rural areas, roads, coasts, borders, ports and airports. A MILITARY corps.'],
    ['Policía Local', 'Municipal.'],
    ['Mossos d’Esquadra', 'Catalonia’s own force, which has primary policing there.'],
    ['Ertzaintza', 'The Basque Country’s own force, likewise.'],
    ['CNI', 'Intelligence, no arrest powers.']
  ], 'In Catalonia and the Basque Country the regional force is the police, and the national forces have a reduced role. Outside towns, on the roads and at the airport, it is the Guardia Civil, and they are military.');

  forces('Brazil', [
    ['Polícia Militar', 'Uniformed state police doing ordinary patrol and public order. NOT part of the army despite the name and the rank titles.'],
    ['Polícia Civil', 'State criminal investigation. Plain clothes, runs the delegacia where reports are made.'],
    ['Polícia Federal', 'Federal crime, drugs, borders, passports, immigration. The closest thing to the FBI.'],
    ['Polícia Rodoviária Federal', 'Federal highways.'],
    ['Guarda Municipal', 'Municipal guards, powers vary widely by city.'],
    ['BOPE / CORE', 'State special operations units.'],
    ['ABIN', 'Intelligence, no arrest powers.']
  ], 'The division that matters: the Polícia Militar patrols and responds, the Polícia Civil investigates and takes the report. A crime is reported at a Civil delegacia even though the Military police attended, which surprises visitors constantly. The name Polícia Militar is historical and does not make them soldiers.');

  forces('United Arab Emirates', [
    ['Emirate police', 'Each emirate runs its own force: Dubai Police, Abu Dhabi Police and so on, under the federal Interior Ministry.'],
    ['CID', 'Criminal investigation within each emirate force.'],
    ['State Security', 'Domestic security and counter-terrorism, federal.'],
    ['ICP', 'Identity, citizenship, customs and ports: immigration and residency matters.'],
    ['Tourist / community police', 'Visitor-facing units in Dubai and Abu Dhabi.']
  ], 'Policing is by emirate rather than national, so a matter that crosses from Dubai to Sharjah crosses between forces. Photography of police, government buildings and airports is treated far more seriously than most visitors expect.');

  forces('Germany', [
    ['Landespolizei', 'State police, and the police for almost all ordinary purposes. Sixteen separate forces.'],
    ['Bundespolizei', 'Federal: borders, railway stations, airports, coastguard.'],
    ['Bundeskriminalamt', 'Federal criminal police: coordination, serious and international crime, protection of federal officials.'],
    ['Zoll', 'Customs, with its own investigation service.'],
    ['BfV', 'Domestic intelligence, no arrest powers.']
  ], 'At a railway station or an airport it will be the Bundespolizei; on the street outside it will be the state force. Germany deliberately separated police and intelligence after 1945, so the BfV cannot arrest anyone.');

  forces('Russia', [
    ['Politsiya (MVD)', 'Ordinary policing under the Interior Ministry.'],
    ['Rosgvardiya', 'National Guard: internal security, public order, riot control, and it licenses private security. Answers directly to the President.'],
    ['FSB', 'Domestic security, counter-intelligence, and the Border Service. Has arrest powers and its own investigators.'],
    ['Investigative Committee', 'Serious criminal investigation, separate from the police.'],
    ['GIBDD', 'Traffic police, a directorate of the MVD.'],
    ['FSO', 'Federal Protective Service: state protection.']
  ], 'The FSB is police, intelligence and border guard at once, which is the opposite of the German separation, and it means an intelligence matter can move straight to detention without another agency being involved.');

  forces('Turkey', [
    ['Polis (EGM)', 'Urban policing, civilian, Interior Ministry.'],
    ['Jandarma', 'Rural areas and small towns. Formerly military, now under the Interior Ministry but retaining military structure.'],
    ['Sahil Güvenlik', 'Coast guard.'],
    ['MIT', 'Intelligence, domestic and foreign.'],
    ['Zabıta', 'Municipal enforcement, markets and licensing.']
  ], 'The city and countryside split works like France: polis inside town boundaries, jandarma outside them.');

  forces('Egypt', [
    ['Ministry of Interior police', 'General policing.'],
    ['Tourism and Antiquities Police', 'Sites, hotels, tour convoys. The force visitors deal with most.'],
    ['Traffic Police', 'Roads and checkpoints.'],
    ['Central Security Forces', 'Conscript public order units, deployed in numbers at demonstrations and fixed points.'],
    ['National Security Agency', 'Domestic security.'],
    ['Airport Security', 'Under the Interior Ministry.']
  ], 'Checkpoints are routine and frequent, and convoy rules for visitors apply on some routes. The Tourism Police are the appropriate point of contact for most visitor matters and generally speak English.');

  /* ── police ranks ─────────────────────────────────────────────────── */

  ranks('polrank', 'United States', 'Typical municipal department, senior first', [
    ['Chief of Police / Commissioner', 'Head of department, usually a political appointment'],
    ['Deputy Chief', ''],
    ['Captain', 'Commands a precinct or district'],
    ['Lieutenant', 'Shift or unit commander'],
    ['Sergeant', 'Supervises a squad, and the first supervisor you will meet'],
    ['Corporal / Detective', 'Investigator or senior officer, ranks vary by department'],
    ['Officer / Patrolman', 'Patrol'],
    ['Sheriff (elected)', 'Head of a county office, not appointed'],
    ['Deputy Sheriff', 'County equivalent of an officer']
  ], 'Insignia follow the military pattern: bars, oak leaves and stars, in gold or silver. There is no national standard, so a captain in one city may outrank a captain in the next. If you need a decision, ask for the on-duty supervisor, which will normally be a sergeant or a lieutenant.');

  ranks('polrank', 'United Kingdom', 'Home Office forces, senior first', [
    ['Chief Constable', 'Head of force; Commissioner in the Met'],
    ['Deputy Chief Constable', ''],
    ['Assistant Chief Constable', ''],
    ['Chief Superintendent', 'Crown over a pip'],
    ['Superintendent', 'Crown'],
    ['Chief Inspector', 'Three pips'],
    ['Inspector', 'Two pips'],
    ['Sergeant', 'Three chevrons'],
    ['Constable', 'Collar number only, and no rank insignia at all']
  ], 'A constable wears a shoulder number and nothing else, so anyone with pips or chevrons is a supervisor. Detective ranks are the same list with Detective in front and carry no extra authority: a detective sergeant and a sergeant are the same rank.');

  ranks('polrank', 'France', 'Police nationale, senior first', [
    ['Directeur des services actifs', 'Senior command'],
    ['Commissaire divisionnaire', 'Divisional commissioner'],
    ['Commissaire de police', 'Commands a commissariat'],
    ['Commandant divisionnaire', ''],
    ['Commandant de police', ''],
    ['Capitaine de police', ''],
    ['Lieutenant de police', ''],
    ['Major de police', 'Senior of the supervisory ranks'],
    ['Brigadier-chef', ''],
    ['Brigadier', ''],
    ['Gardien de la paix', 'The basic officer, and the great majority of the force']
  ], 'The Gendarmerie uses military ranks instead, so a gendarme will be an adjudant or a maréchal des logis rather than a brigadier. The officer in charge of a police station is the commissaire.');

  ranks('polrank', 'Italy', 'Polizia di Stato, senior first', [
    ['Prefetto / Dirigente Generale', 'Senior command'],
    ['Primo Dirigente', ''],
    ['Vice Questore Aggiunto', ''],
    ['Commissario Capo', ''],
    ['Commissario', ''],
    ['Ispettore Superiore', ''],
    ['Ispettore', ''],
    ['Sovrintendente', ''],
    ['Assistente Capo', ''],
    ['Agente Scelto', ''],
    ['Agente', 'Basic officer']
  ], 'The Questore heads policing in a province and the Questura is the provincial headquarters, which is where residency permits and formal reports are handled. Carabinieri use military ranks instead.');

  ranks('polrank', 'Brazil', 'Polícia Militar, senior first', [
    ['Coronel', 'Commands the state force'],
    ['Tenente-Coronel', ''],
    ['Major', ''],
    ['Capitão', 'Commands a company'],
    ['Primeiro-Tenente', ''],
    ['Segundo-Tenente', ''],
    ['Subtenente', ''],
    ['Primeiro-Sargento', ''],
    ['Segundo-Sargento', ''],
    ['Terceiro-Sargento', ''],
    ['Cabo', ''],
    ['Soldado', 'Basic officer']
  ], 'These are military rank names on a state police force, which is exactly why the force is misread as army. The Polícia Civil uses a completely different set: Delegado at the top, then Investigador and Escrivão, and it is the Delegado who registers a crime.');

  ranks('polrank', 'Germany', 'Landespolizei, senior first', [
    ['Polizeipräsident', 'Head of a police authority'],
    ['Leitender Polizeidirektor', ''],
    ['Polizeidirektor', ''],
    ['Erster Polizeihauptkommissar', ''],
    ['Polizeihauptkommissar', ''],
    ['Polizeioberkommissar', ''],
    ['Polizeikommissar', ''],
    ['Polizeihauptmeister', ''],
    ['Polizeiobermeister', ''],
    ['Polizeimeister', 'Basic officer']
  ], 'Insignia are stars on the shoulder, in silver for the middle service and gold for the higher service, so the metal tells you the tier before you count the stars.');

  ranks('polrank', 'United Arab Emirates', 'Emirate police, senior first', [
    ['Fariq (Lieutenant General)', 'Commander-in-chief level'],
    ['Liwa (Major General)', ''],
    ['Amid (Brigadier)', ''],
    ['Aqid (Colonel)', ''],
    ['Muqaddam (Lieutenant Colonel)', ''],
    ['Ra’id (Major)', ''],
    ['Naqib (Captain)', ''],
    ['Mulazim Awwal (First Lieutenant)', ''],
    ['Mulazim (Lieutenant)', ''],
    ['Raqib Awwal (Staff Sergeant)', ''],
    ['Raqib (Sergeant)', ''],
    ['Arif (Corporal)', ''],
    ['Shurti (Constable)', 'Basic officer']
  ], 'Police ranks follow the military pattern and the same Arabic words, which is true across the Gulf. A matter needing a decision goes to at least a Naqib.');

})();
