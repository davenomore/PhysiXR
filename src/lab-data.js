// ===============================================================
// EGYSÉGES LAB TARTALOM (PHYSIXR)
// 10 db Tanulási Küldetés és 10 db Felfedezhető Tudáskártya
// (A spatial_hud_dev.html fájl didaktikai felépítése alapján)
// ===============================================================

export const COLLECTION_CARDS = [
  {
    id: 'ice',
    title: 'Szilárd jég',
    category: 'allapot',
    categoryName: 'Halmazállapot',
    categoryColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    icon: '🧊',
    status: 'active',
    defaultStatus: 'active',
    stateName: 'Jég',
    subtitle: 'Hexagonális kristályrács (Ih)',
    temp: '-30 °C',
    tempTarget: -30,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: -40,
    density: '0,917 g/cm³',
    extraParamLabel: 'Olvadáshő',
    extraParamVal: '334 kJ/kg',
    desc: 'A szilárd vízben a molekulák merev hidrogénhidakkal nyílt hexagonális kristályrácsba rendeződnek. Emiatt a jég sűrűsége kisebb a folyékony víznél, így lebeg annak felszínén.',
    micro: '4 szomszédos molekula tetraéderes elrendezésben, nyitott hatszögletű gyűrűk.'
  },
  {
    id: 'water',
    title: 'Folyékony víz',
    category: 'allapot',
    categoryName: 'Halmazállapot',
    categoryColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: '💧',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Víz',
    subtitle: 'Dinamikus folyadékfázis',
    temp: '+22 °C',
    tempTarget: 22,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: 0,
    density: '1,000 g/cm³',
    extraParamLabel: 'Fajhő',
    extraParamVal: '4,184 kJ/kg·K',
    desc: 'A hidrogénkötések pikoszekundumok alatt szakadnak fel és képződnek újra. A molekulák szabadon elgördülnek egymáson, felvéve a tárolóedény alakját.',
    micro: 'Legnagyobb sűrűségét +4 °C-on éri el (anomális hőtágulás).'
  },
  {
    id: 'steam',
    title: 'Vízgőz',
    category: 'allapot',
    categoryName: 'Halmazállapot',
    categoryColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    icon: '💨',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Vízgőz',
    subtitle: 'Légnemű gázfázis',
    temp: '+120 °C',
    tempTarget: 120,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: 60,
    density: '0,598 kg/m³',
    extraParamLabel: 'Párolgáshő',
    extraParamVal: '2257 kJ/kg',
    desc: 'A molekulák kinetikus energiája teljesen felülmúlja a vonzóerőket. A molekulák függetlenül, nagy sebességgel száguldanak a térben.',
    micro: 'A molekulák közti átlagos távolság 10-szer nagyobb a molekulaméretnél.'
  },
  {
    id: 'melting',
    title: 'Olvadás & Fagyás',
    category: 'valtozas',
    categoryName: 'Fázisátmenet',
    categoryColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: '⚡',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Olvadó jég',
    subtitle: 'Elsőrendű fázisátmenet',
    temp: '0 °C',
    tempTarget: 0,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: 40,
    density: '0,917 → 1,000 g/cm³',
    extraParamLabel: 'Látens hő',
    extraParamVal: '334 kJ/kg',
    desc: 'A tiszta jég olvadása közben a hőmérséklet pontosan 0 °C marad, mert a közölt energia a hidrogénkötések felbontására fordítódik.',
    micro: 'Látens hő plató: a T(t) diagramon vízszintes szakasz látható.'
  },
  {
    id: 'boiling',
    title: 'Párolgás & Forrás',
    category: 'valtozas',
    categoryName: 'Fázisátmenet',
    categoryColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    icon: '🔥',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Forrásban lévő víz',
    subtitle: 'Folyadék → Gőz átmenet',
    temp: '100 °C',
    tempTarget: 100,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: 100,
    density: '1,000 → 0,598 kg/m³',
    extraParamLabel: 'Forráshő',
    extraParamVal: '2257 kJ/kg',
    desc: 'Forrás akkor következik be, amikor a folyadék telített gőznyomása eléri a külső légköri nyomást.',
    micro: 'Forrás közben a hőmérséklet stabilan 100 °C marad a teljes elpárolgásig.'
  },
  {
    id: 'sublimation',
    title: 'Szublimáció',
    category: 'valtozas',
    categoryName: 'Fázisátmenet',
    categoryColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: '✨',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Szublimáló jég',
    subtitle: 'Szilárd → Gáz közvetlenül',
    temp: '-15 °C',
    tempTarget: -15,
    pressure: '0.005 atm',
    pressureTarget: 0.1,
    thermalPower: 20,
    density: '0,917 g/cm³',
    extraParamLabel: 'Szublimációs hő',
    extraParamVal: '2834 kJ/kg',
    desc: 'A hármaspont nyomása alatt a szilárd fázis közvetlenül gázzá alakul folyadékfázis nélkül.',
    micro: 'A molekulák közvetlenül a kristályrácsból lépnek ki a gáztérbe.'
  },
  {
    id: 'condensation',
    title: 'Lecsapódás',
    category: 'valtozas',
    categoryName: 'Fázisátmenet',
    categoryColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    icon: '🌧️',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Lecsapódó gőz',
    subtitle: 'Gáz → Folyadék átmenet',
    temp: '+95 °C',
    tempTarget: 95,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: -40,
    density: 'Folyadék cseppképződés',
    extraParamLabel: 'Hőleadás',
    extraParamVal: '2257 kJ/kg',
    desc: 'A lehűlő gőzmolekulák lelassulnak, és a vonzóerők hatására folyadékcseppekké állnak össze.',
    micro: 'Kondenzáció: a molekulák leadják párolgáshőjüket a környezetnek (exoterm).'
  },
  {
    id: 'crystal',
    title: 'Jégkristály',
    category: 'fogalom',
    categoryName: 'Mikroszerkezet',
    categoryColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: '💎',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Jégkristály',
    subtitle: 'Hexagonális Ih mikrorács',
    temp: '-30 °C',
    tempTarget: -30,
    pressure: '1.0 atm',
    pressureTarget: 1.0,
    thermalPower: -40,
    density: '0,917 g/cm³',
    extraParamLabel: 'Koordináció',
    extraParamVal: '4 (tetraéderes)',
    desc: 'A vízmolekulák közötti hidrogénkötések szabályos hatszögletű csatornákat képeznek.',
    micro: 'Nyitott rácsszerkezet: a = 4,52 Å, c = 7,36 Å.'
  },
  {
    id: 'triple',
    title: 'Hármaspont',
    category: 'fogalom',
    categoryName: 'Egyensúly',
    categoryColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: '⚛️',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Hármaspont',
    subtitle: '0,01 °C és 0,006 atm',
    temp: '+0.01 °C',
    tempTarget: 0.01,
    pressure: '0.006 atm',
    pressureTarget: 0.01,
    thermalPower: 0,
    density: 'Mindhárom fázis jelen van',
    extraParamLabel: 'Szabadsági fok',
    extraParamVal: 'F = 0 (invariáns)',
    desc: 'Ahol a jég, a folyékony víz és a vízgőz egymással tökéletes termodinamikai egyensúlyban létezik egyszerre.',
    micro: 'Gibbs-féle fázistörvény: F = K - Fázis + 2 = 1 - 3 + 2 = 0.'
  },
  {
    id: 'critical',
    title: 'Kritikus pont',
    category: 'fogalom',
    categoryName: 'Extrém állapot',
    categoryColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    icon: '⚡',
    status: 'unlocked',
    defaultStatus: 'unlocked',
    stateName: 'Szuperkritikus víz',
    subtitle: '374 °C és 218 atm felett',
    temp: '+374 °C',
    tempTarget: 150,
    pressure: '2.0 atm',
    pressureTarget: 2.0,
    thermalPower: 100,
    density: 'Folytonos fázisátmenet',
    extraParamLabel: 'Határfelület',
    extraParamVal: 'Megszűnik (meniszkusz = 0)',
    desc: 'A folyadék és a gőz fázishatára teljesen megszűnik. Egyetlen, nagy sűrűségű fluidum keletkezik.',
    micro: 'Szuperkritikus fluidum: gázszerű diffúzió + folyadékszerű oldóképesség.'
  }
];

export const LAB_MISSIONS = [
  {
    id: 1,
    category: 'ALAPOK',
    title: 'Szilárd halmazállapot (Jég)',
    desc: 'Vizsgáld meg a jég mikroszkopikus kristályrácsát -30 °C-on és 1.0 atm nyomáson!',
    tip: 'Tipp: Kapcsold be a fűtést a hőszabályzó panelen a fázisátmenet elindításához.',
    stateId: 'ice',
    temp: '-30 °C',
    pressure: '1.0',
    quiz: {
      question: 'Milyen rácsszerkezetbe rendeződnek a vízmolekulák a szilárd jégben?',
      options: [
        'Hexagonális (hatszöges) kristályrács',
        'Szabálytalan amorf folyadékhalmaz',
        'Tömör fémrácsos szerkezet'
      ],
      correctIndex: 0,
      hint: 'Gondolj a hópelyhek hatszöges szimmetriájára és a kristályos szerkezetre!',
      explanation: 'A jég hatszöges kristályrácsot alkot, emiatt sűrűsége kisebb a víznél!'
    }
  },
  {
    id: 2,
    category: 'FÁZISÁTMENET',
    title: 'Olvadáspont vizsgálata (0 °C)',
    desc: 'Emeld a hőmérsékletet 0 °C-ig! Az olvadás alatt a kristályrács felbontása látens hőt igényel.',
    tip: 'Tipp: Állíts be „Kis fűtést” (+40%) a hőszabályzó panelen az olvadás megkezdéséhez.',
    stateId: 'melting',
    temp: '0 °C',
    pressure: '1.0',
    quiz: {
      question: 'Mi történik a jég hőmérsékletével a tiszta olvadás folyamata alatt?',
      options: [
        'Folyamatosan emelkedik',
        'Állandó marad (0 °C) a látens hő miatt',
        'Hirtelen lezuhan -50 °C-ra'
      ],
      correctIndex: 1,
      hint: 'A befektetett energia a kristálykötések felbontására fordítódik, nem a felmelegedésre.',
      explanation: 'A közölt hő a kristályrács felbontására fordítódik, így a hőmérséklet nem nő.'
    }
  },
  {
    id: 3,
    category: 'ALAPOK',
    title: 'Folyékony fázis (Víz)',
    desc: 'A jég elolvadt, megjelent a folyékony víz. A molekulák már szabadabban vándorolnak.',
    tip: 'Tipp: Figyeld meg a molekulák dinamikus elgördülését egymáson.',
    stateId: 'water',
    temp: '+22 °C',
    pressure: '1.0',
    quiz: {
      question: 'Hány °C-on a legnagyobb a víz sűrűsége normál légnyomáson?',
      options: [
        '+4 °C-on (sűrűség-anomália)',
        '0 °C-on a fagyás pillanatában',
        '+100 °C-on forráskor'
      ],
      correctIndex: 0,
      hint: 'A víz a fagyáspont felett pár fokkal a legsűrűbb — ezért maradnak életben a halak a tó mélyén télen.',
      explanation: 'A víz +4 °C-on a legsűrűbb, ezért nem fagynak be a tavak fenékig télen.'
    }
  },
  {
    id: 4,
    category: 'FÁZISÁTMENET',
    title: 'Forráspont és Párolgás (100 °C)',
    desc: 'Melegítsd a vizet 100 °C-ig! Figyeld meg a gőzbuborékok képződését és elpárolgását.',
    tip: 'Tipp: Állítsd a fűtést „Max fűtés” (+100%) állásba a fader felhúzásával.',
    stateId: 'boiling',
    temp: '100 °C',
    pressure: '1.0',
    quiz: {
      question: 'Mikor kezd el forrni a folyadék?',
      options: [
        'Amikor a telített gőznyomása eléri a külső légnyomást',
        'Amikor a molekulák teljesen leállnak',
        'Bármikor, ha megkavarjuk a mintát'
      ],
      correctIndex: 0,
      hint: 'A folyadék belsejében keletkező buborékoknak le kell győzniük a külső légköri nyomást a felemelkedéshez.',
      explanation: 'Forráskor a buborékokban lévő gőz nyomása legyőzi a külső légnyomást.'
    }
  },
  {
    id: 5,
    category: 'ALAPOK',
    title: 'Gáz halmazállapot (Vízgőz)',
    desc: 'A víz teljesen elpárolgott. A szabad gázmolekulák kitöltik a rendelkezésre álló teret.',
    tip: 'Tipp: Csökkentsd a fűtést a stabil gőzfázis megőrzéséhez.',
    stateId: 'steam',
    temp: '135 °C',
    pressure: '1.2',
    quiz: {
      question: 'Hogyan viselkedik a vízgőz zárt térben történő melegítéskor?',
      options: [
        'Nő a nyomása a részecskék megnövekedett sebessége miatt',
        'Csökken a nyomása és összehúzódik',
        'Azonnal visszafagy szilárd jéggé'
      ],
      correctIndex: 0,
      hint: 'Zárt térben a gyorsabban mozgó gázrészecskék sűrűbben és erősebben ütköznek a tartály falának.',
      explanation: 'Gay-Lussac törvénye: állandó térfogaton a gáz nyomása arányos a hőmérséklettel.'
    }
  },
  {
    id: 6,
    category: 'FÁZISÁTMENET',
    title: 'Kondenzáció (Lecsapódás)',
    desc: 'Hűtsd vissza a gőzt! A hőelvonás hatására a gáz visszacseppfolyósodik a felületen.',
    tip: 'Tipp: Kapcsolj be hűtést (-40% vagy -100%) a hőszabályzón.',
    stateId: 'condensation',
    temp: '85 °C',
    pressure: '1.0',
    quiz: {
      question: 'Milyen folyamat a lecsapódás energetikai szempontból?',
      options: [
        'Exoterm (hőt ad le a környezetnek)',
        'Endoterm (hőt von el a környezettől)',
        'Nem jár semmilyen hőváltozással'
      ],
      correctIndex: 0,
      hint: 'A párolgáshoz hőt kellett közölni (endoterm). Ennek a fordított folyamata hőt bocsát ki a környezetnek.',
      explanation: 'A kondenzáció exoterm fázisátmenet: a gáz leadja a párolgáshőjét a hűtőfelületnek.'
    }
  },
  {
    id: 7,
    category: 'MÉRÉS',
    title: 'Nyomáscsökkentés (Vákuum)',
    desc: 'Csökkentsd a légköri nyomást a manométerrel! Alacsony nyomáson a forráspont lecsökken.',
    tip: 'Tipp: Húzd balra a nyomásmérő csúszkáját 0.1 atm-ig.',
    stateId: 'water',
    temp: '15 °C',
    pressure: '0.1',
    quiz: {
      question: 'Hogyan változik a víz forráspontja a Himaláján (alacsonyabb légnyomáson)?',
      options: [
        'Alacsonyabb hőmérsékleten forr (kb. 70 °C-on)',
        'Magasabb hőmérsékleten forr (130 °C felett)',
        'Nem változik a nyomástól'
      ],
      correctIndex: 0,
      hint: 'Kisebb nyomású környezetben a gőzbuborékok könnyebben kitágulnak és már jóval 100 °C alatt elérik a környezeti nyomást.',
      explanation: 'Alacsonyabb környezeti nyomáson a víz gőznyomása már kisebb hőmérsékleten eléri a külső nyomást.'
    }
  },
  {
    id: 8,
    category: 'EXTRÉM',
    title: 'A Hármaspont (0,01 °C / 0,006 atm)',
    desc: 'Ritka fizikai egyensúly: a jég, a víz és a gőz egyszerre, stabil állapotban létezik együtt!',
    tip: 'Tipp: Finomhangold a nyomást és a hőmérsékletet pontosan a metszéspontra.',
    stateId: 'triple',
    temp: '0.01 °C',
    pressure: '0.01',
    quiz: {
      question: 'Hány fázis létezik egyensúlyban a víz hármaspontján?',
      options: [
        'Mindhárom fázis (szilárd, folyékony és gáz egyszerre)',
        'Csak a folyékony és a szilárd fázis',
        'Csak a gáz halmazállapot'
      ],
      correctIndex: 0,
      hint: 'A név magáért beszél: „hármas” pont — a három halmazállapot egyetlen közös metszéspontja.',
      explanation: 'A fázisdiagram ezen egyetlen pontján mindhárom fázis stabilan, egyensúlyban forr és fagy.'
    }
  },
  {
    id: 9,
    category: 'FÁZISÁTMENET',
    title: 'Szublimáció vákuumban',
    desc: 'A hármaspont alatt a jég olvadás nélkül közvetlenül vízgőzzé alakul át melegítéskor.',
    tip: 'Tipp: Melegítsd a mintát vákuumban — szilárd testből közvetlen gázképződés!',
    stateId: 'sublimation',
    temp: '-10 °C',
    pressure: '0.01',
    quiz: {
      question: 'Mi a szublimáció pontos meghatározása?',
      options: [
        'Szilárd halmazállapotból folyadékfázis kihagyásával gázzá válás',
        'Folyadék gyors megszilárdulása',
        'Gáz közvetlen folyadékká válása'
      ],
      correctIndex: 0,
      hint: 'Gondolj a szárazjégre vagy a fagyasztott ruha téli száradására: folyadékfázis nélkül tűnik el a jég.',
      explanation: 'Szublimációkor a részecskék közvetlenül a szilárd kristályrácsból lépnek ki a gáztérbe.'
    }
  },
  {
    id: 10,
    category: 'EXTRÉM',
    title: 'Szuperkritikus állapot',
    desc: 'A folyadék és a gáz fázishatár teljesen megszűnik — létrejön a szuperkritikus fluidum!',
    tip: 'Tipp: Gratulálunk! Sikeresen felfedezted a víz fázisterének összes tartományát.',
    stateId: 'critical',
    temp: '374 °C',
    pressure: '2.0',
    quiz: {
      question: 'Mi jellemzi a szuperkritikus állapotú fluidumot?',
      options: [
        'Eltűnik a fázishatárfelület, gázként áramlik és folyadékként old',
        'Gyémántkeménységű szilárd testté sűrűsödik',
        'Megsemmisül az anyagi szerkezete'
      ],
      correctIndex: 0,
      hint: 'A kritikus pont felett a sűrűség és a viszkozitás kiegyenlítődik, és teljesen megszűnik a határfelület.',
      explanation: 'A szuperkritikus fluidum sűrűsége a folyadékokéhoz, viszkozitása a gázokéhoz hasonló.'
    }
  }
];
