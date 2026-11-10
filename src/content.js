import { PHASE } from './sim.js';

// Kártya kategóriák a gyűjtemény tematikus csoportosításához
export const CARD_CATEGORIES = [
  { id: 'all', label: 'Összes', icon: '✦' },
  { id: 'halmazallapotok', label: 'Állapotok', fullLabel: 'Halmazállapotok', icon: '🧊', desc: 'A víz három alapvető fizikai állapota és mikroszkopikus szerkezete' },
  { id: 'valtozasok', label: 'Változások', fullLabel: 'Halmazállapot-változások', icon: '⚡', desc: 'Fázisátalakulások hőfelvétel és hőleadás hatására' },
  { id: 'fogalmak', label: 'Fogalmak', fullLabel: 'Hőtani fogalmak', icon: '🌡️', desc: 'A termodinamika és fázisátalakulások legfontosabb jelenségei' },
  { id: 'jelvenyek', label: 'Jelvények', fullLabel: 'Jelvények & Sikerek', icon: '🏅', desc: 'A sikeres leckékért és tesztekért járó elismerések' }
];

// Didaktikailag felépített tananyagblokkok automatikus narrációval és kártyákkal
export const CARDS = {
  szilard: {
    icon: '🧊',
    title: 'A szilárd halmazállapot (−30 °C)',
    shortName: 'Szilárd jég',
    category: 'halmazallapotok',
    text: 'Szilárd halmazállapotban az anyag részecskéit erős vonzóerők tartják szorosan egymás mellett egy szabályos kristályrácsban. Emiatt a szilárd anyagok alakja és térfogata állandó: nem folynak szét és nem veszik fel az edény formáját. A molekulák nem vándorolnak el, csupán egyensúlyi rácspontjaik körül végeznek rezgőmozgást. Melegítéskor 0 °C-ig csak a molekulák rácsrezgése gyorsul, de a halmazállapot mindvégig szilárd marad.'
  },
  viz_melegites: {
    icon: '💧',
    title: 'A folyékony halmazállapot (0 °C-os víz)',
    shortName: 'Folyékony víz',
    category: 'halmazallapotok',
    audio: '/TTS/10_folyekony_alapjai.mp3',
    audioKey: 'folyekony_alapjai',
    text: 'Az összes jég elolvadt, így most 0 fokos folyékony vizünk van! A jég merev kristályszerkezete teljesen megszűnt: a vízmolekulák már nincsenek fix pontokhoz rögzítve, hanem szabadon elgördülnek egymáson, és felveszik az edény alakját. A részecskék közötti vonzóerők miatt azonban a víz térfogata állandó marad, így a folyadékok gyakorlatilag összenyomhatatlanok.'
  },
  goz: {
    icon: '💨',
    title: 'A légnemű halmazállapot (100 °C-os vízgőz)',
    shortName: 'Légnemű gőz',
    category: 'halmazallapotok',
    audio: '/TTS/13_goz_alapjai.mp3',
    audioKey: 'goz_alapjai',
    text: 'Az összes víz elforrt, tiszta 100 °C-os gőzünk van! Légnemű halmazállapotban a molekulák közötti vonzóerők megszűntek. A gázoknak sem állandó alakjuk, sem állandó térfogatuk nincs: kitöltik a teljes teret, könnyen összenyomhatók, és a falnak csapódva hozzák létre a nyomást. Ha most tovább fűtünk, a hőmérséklet tovább emelkedik: ezt nevezzük túlhevített gőznek. Ha a közölt hőt még tovább emelnénk, a molekulák akkora sebességgel ütköznének, hogy maguk a vízmolekulák is szétbomlanának, így a gőz ezen a ponton megszűnne. Az így kapott hidrogén-oxigén gázkeveréket még tovább melegítve pedig plazmát kapnánk, de ezt most nem tárgyaljuk!'
  },
  olvadaspont: {
    icon: '📍',
    title: 'A jég olvadáspontja (0 °C)',
    shortName: 'Olvadáspont',
    category: 'valtozasok',
    audio: '/TTS/08_olvadaspont.mp3',
    audioKey: 'olvadaspont',
    text: 'Normál légköri nyomáson a tiszta jég pontosan 0 °C-on (273,15 K) kezd olvadni. Ezen a hőmérsékleten a részecskék rácsrezgése eléri a kritikus maximumot: a jég és a folyékony víz tartósan megfér egymás mellett egyensúlyban. A hőmérséklet addig nem emelkedik 0 fok fölé, amíg az utolsó jégkristály is el nem olvad!'
  },
  olvadasho: {
    icon: '🧊',
    title: 'Olvadáshő (Lo = 334 kJ/kg)',
    shortName: 'Olvadáshő',
    category: 'valtozasok',
    audio: '/TTS/09_olvadasho_plato.mp3',
    audioKey: 'olvadasho_plato',
    text: 'Az olvadáshő (Lo) megadja, hogy mekkora hő szükséges 1 kg olvadásponton lévő szilárd anyag teljes megolvasztásához. Víz esetén ez 334 kilojoule kilogrammonként! Amíg a jég olvad, ez a hatalmas energia mind a szabályos kristályrács szétbontására fordítódik, miközben a hőmérséklet pontosan 0 °C marad.'
  },
  latens_ho: {
    icon: '🔥',
    title: 'Látens hő (Rejtett hő)',
    shortName: 'Látens hő',
    category: 'valtozasok',
    audio: '/TTS/09_olvadasho_plato.mp3',
    audioKey: 'olvadasho_plato',
    text: 'A halmazállapot-változás során felvett vagy leadott hőt látens hőnek (rejtett hőnek) nevezzük. Ez a hőenergia nem a részecskék rezgését vagy hőmérsékletét növeli, hanem a molekulák közötti kötőerőket bontja fel. Mivel a fázisátmenet alatt a hőmérőn nem látszik változás, a folyamatot rejtett hőnek nevezzük: ez hozza létre a vízszintes platót a grafikonon!'
  },
  forraspont: {
    icon: '🌡️',
    title: 'A víz forráspontja (100 °C)',
    shortName: 'Forráspont',
    category: 'valtozasok',
    audio: '/TTS/12_forraspont_es_forrasho.mp3',
    audioKey: 'forraspont_es_forrasho',
    text: 'Normál légköri nyomáson (1 atm) a víz forráspontja pontosan 100 °C. Ezen a hőmérsékleten a folyadék telített gőznyomása eléri a külső légnyomást, így nemcsak a felszínen párolog, hanem a folyadék belsejében is gőzbuborékok képződnek (forrás). A külső nyomás növelésével a forráspont nő, csökkentésével csökken!'
  },
  forrasho: {
    icon: '🫧',
    title: 'Forráshő (Lf = 2260 kJ/kg)',
    shortName: 'Forráshő',
    category: 'valtozasok',
    audio: '/TTS/12_forraspont_es_forrasho.mp3',
    audioKey: 'forraspont_es_forrasho',
    text: 'A forráshő vagy elpárolgáshő (Lf) az a hőmennyiség, amely 1 kg forrásponton lévő folyadék teljes elforralásához szükséges. Víznél ez rendkívül nagy érték: 2260 kJ/kg, ami közel hétszerese az olvadáshőnek! Ez az energia teljesen szétszakítja a molekulák közötti vonzóerőket, szabad légnemű gőzzé alakítva őket a 100 °C-os platón.'
  },
  kristalyszerkezet: {
    icon: '❄️',
    badge: 'Jégkristály 3D Modell',
    title: 'A Jégkristály Szerkezete',
    shortName: 'Jégkristály',
    category: 'fogalmak',
    audio: '/TTS/07_kristalyszerkezet.mp3',
    audioKey: 'kristalyszerkezet',
    text: 'A jégben a vízmolekulák oxigénatomjai szigorú térbeli hálózatot alkotnak: minden oxigén négy szomszédjával tetraédert formál, melyek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre. A világoskék ragyogó vonalak a hidrogénhidakat jelölik, melyek a molekulákat összetartják. A hatszögek közepén hatalmas, függőleges üres csatornák futnak végig: ez a szellős szerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és úszik a víz felszínén!',
    sections: [
      {
        icon: '💠',
        title: 'Hexagonális gyűrűk',
        color: '#64d2ff',
        text: 'A jégben a vízmolekulák oxigénatomjai (piros) szigorú térbeli hálózatot alkotnak. Minden oxigén pontosan négy szomszédjával kapcsolódik egy tetraédert formálva. Ezek a tetraéderek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre.'
      },
      {
        icon: '⚡',
        title: 'Hidrogénhidak',
        color: '#ffd60a',
        text: 'A világoskék, ragyogó vonalak a hidrogénkötéseket jelölik, amelyek a molekulákat összetartják. Figyeld meg a kis fehér hidrogénatomokat! Minden kötésen pontosan egy hidrogénatom ül, így az oxigénatomhoz közelebb esve kiadják a H₂O molekulákat.'
      },
      {
        icon: '🕳️',
        title: 'Üres csatornák',
        color: '#ffffff',
        text: 'Ha felülről benézel a hatszögek közepébe, látni fogod a kristályrácson végigfutó hatalmas, függőleges "üres" csatornákat. Ez a szellős, kitágult térbeli szerkezet az oka annak, hogy a jég sűrűsége kisebb, mint a folyékony vízé, ezért úszik a jégkocka a víz felszínén!'
      }
    ]
  },
  jelveny1: {
    icon: '🏅',
    title: 'Hőtan Mester',
    shortName: 'Hőtan Mester',
    category: 'jelvenyek',
    text: 'Jelvény: sikeresen felfedezted a 3 halmazállapotot, az olvadáspontot, a forráspontot, a látens hőt, valamint az olvadás- és forráshőt!'
  }
};

// Menet közben megjelenő és begyűjtés után eltűnő infó-gömbök logikai szabályai
export const HOTSPOTS = [
  {
    id: 'racs',
    audioKey: 'szilard_alapjai',
    audio: '/TTS/05_szilard_alapjai.mp3',
    pos: [-1.45, 0.45, 0.3],
    cardId: 'szilard',
    title: 'A szilárd halmazállapot alapjai',
    text: 'Szilárd halmazállapotban az anyag részecskéit erős kötések rögzítik a rácsban, így alakjuk és térfogatuk is állandó: nem folynak szét és nem veszik fel a tartály alakját. A molekulák nem vándorolnak el, csupán a helyük körül rezegnek. Melegítéskor 0 °C-ig csak a molekulák rezgése gyorsul, de az anyag mindvégig szilárd marad.',
    // Szigorúan a 0. küldetés alatt aktív a kezdeti szilárd jégnél
    visibleWhen: c => c.introStarted && c.missionNo === 0 && !c.collectedHotspots.has('racs')
  },
  {
    id: 'kristalyszerkezet',
    audioKey: 'kristalyszerkezet',
    audio: '/TTS/06_kristalyszerkezet.mp3',
    pos: [1.45, 0.45, 0.3],
    cardId: 'kristalyszerkezet',
    title: 'A Jégkristály Szerkezete',
    text: 'A jégben a vízmolekulák oxigénatomjai szigorú térbeli hálózatot alkotnak: minden oxigén négy szomszédjával tetraédert formál, melyek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre. A világoskék ragyogó vonalak a hidrogénhidakat jelölik, melyek a molekulákat összetartják. A hatszögek közepén hatalmas, függőleges üres csatornák futnak végig: ez a szellős szerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és úszik a víz felszínén!',
    // Szigorúan az 1. küldetés alatt aktív a jégkristály 3D modell felfedezéséhez
    visibleWhen: c => c.introStarted && c.missionNo === 1 && !c.collectedHotspots.has('kristalyszerkezet')
  },
  {
    id: 'olvadaspont',
    audioKey: 'olvadaspont',
    audio: '/TTS/08_olvadaspont.mp3',
    pos: [1.45, 0.45, 0.3],
    cardId: 'olvadaspont',
    title: 'A jég olvadáspontja (0 °C)',
    text: 'Elértük a 0 Celsius-fokot, a tiszta jég olvadáspontját! A molekulák rácsrezgése elérte a maximális értéket, amit a szilárd kristályrács még elbír. Ahhoz, hogy a jég folyékony vízzé váljon, további hőt kell közölnünk vele!',
    visibleWhen: c => c.introStarted && c.missionNo === 4 && !c.collectedHotspots.has('olvadaspont')
  },
  {
    id: 'viz_melegites',
    audioKey: 'folyekony_alapjai',
    audio: '/TTS/10_folyekony_alapjai.mp3',
    pos: [0, -0.2, 1.25],
    cardId: 'viz_melegites',
    title: 'A folyékony halmazállapot (0 °C-os víz)',
    text: 'Az összes jég elolvadt, így most 0 fokos folyékony vizünk van! A jég merev kristályszerkezete teljesen megszűnt: a vízmolekulák már nincsenek fix pontokhoz rögzítve, hanem szabadon elgördülnek egymáson, és felveszik az edény alakját. A részecskék közötti vonzóerők miatt azonban a víz térfogata állandó marad, így a folyadékok gyakorlatilag összenyomhatatlanok.',
    visibleWhen: c => c.introStarted && c.missionNo === 6 && !c.collectedHotspots.has('viz_melegites')
  },
  {
    id: 'goz',
    audioKey: 'goz_alapjai',
    audio: '/TTS/13_goz_alapjai.mp3',
    pos: [0, 1.25, 1.25],
    cardId: 'goz',
    title: 'A légnemű halmazállapot (100 °C-os vízgőz)',
    text: 'Az összes víz elforrt, tiszta 100 °C-os gőzünk van! Légnemű halmazállapotban a molekulák közötti vonzóerők megszűntek. A gázoknak sem állandó alakjuk, sem állandó térfogatuk nincs: kitöltik a teljes teret, könnyen összenyomhatók, és a falnak csapódva hozzák létre a nyomást. Ha most tovább fűtünk, a hőmérséklet tovább emelkedik: ezt nevezzük túlhevített gőznek. Ha a közölt hőt még tovább emelnénk, a molekulák akkora sebességgel ütköznének, hogy maguk a vízmolekulák is szétbomlanának, így a gőz ezen a ponton megszűnne. Az így kapott hidrogén-oxigén gázkeveréket még tovább melegítve pedig plazmát kapnánk, de ezt most nem tárgyaljuk!',
    visibleWhen: c => c.introStarted && c.missionNo === 9 && !c.collectedHotspots.has('goz')
  }
];

export const BLOCKS = [
  {
    id: 'b1',
    title: 'Halmazállapotok és Fázisátmenetek',
    badge: 'jelveny1',
    intro: 'Kezdjük −30 °C-os szilárd jéggel! Fedezd fel a kristályrácsot, az olvadást, a látens hőt, a folyékony vizet és a forrást!',
    missions: [
      {
        title: 'Szilárd halmazállapot (Jég)',
        text: 'Koppints a tutoron lebegő sárga felkiáltójelre a szilárd halmazállapot megismeréséhez!',
        hint: 'Mutass rá a kontroller lézerével vagy koppints a robot sárga felkiáltójelére (!) a szilárd állapot alapjaiért!',
        cards: ['szilard'],
        test: c => c.collectedHotspots.has('racs')
      },
      {
        title: 'A jég kristályszerkezete',
        text: 'Fedezd fel a jégkristály 3D szerkezetét! Koppints a tutor sárga felkiáltójelére!',
        hint: 'Figyeld meg a modellben a kiemelt hatszöget, a hidrogénhidakat és az üres csatornákat!',
        cards: ['kristalyszerkezet'],
        test: c => c.collectedHotspots.has('kristalyszerkezet')
      },
      {
        title: 'Fűtés bekapcsolása',
        text: 'Kapcsolj egy kis fűtést: állítsd a lángot 20-30% közé a bal panelen!',
        hint: 'Használd a "🔥 Kis láng (25%)" gombot vagy a csúszkát!',
        cards: [],
        test: c => c.sim.power >= 0.15 && c.sim.power <= 0.45
      },
      {
        title: 'A jég felmelegedése',
        processAudioKey: 'melegedes_szilard',
        text: 'Figyeld: itt még csak a jég melegszik! Várd meg, amíg eléri a 0 °C-ot!',
        hint: 'A hőmérséklet emelkedik −30 °C-ról 0 °C-ra, miközben a jég kristályrácsa még egyben marad.',
        cards: [],
        test: c => c.sim.T >= -0.05 || c.sim.h >= c.sim.thresholds.a
      },
      {
        title: 'Olvadáspont (0 °C)',
        text: 'Elértük a 0 °C-ot, a fűtés leállt! Koppints a tutor sárga felkiáltójelére az olvadáspontért!',
        hint: 'A robot felett megjelent a sárga felkiáltójel: koppints rá!',
        cards: ['olvadaspont'],
        test: c => c.collectedHotspots.has('olvadaspont')
      },
      {
        title: 'Olvadás és Olvadáshő (Plató)',
        processAudioKey: 'olvadasho_plato',
        text: 'Fűts bátran a bal panelen (akár 100% lánggal), és figyeld az olvadási platót!',
        hint: 'Fűts bátran! Figyeld meg a hőmérőt és a grafikont: a hőmérséklet nem nő (0 °C marad), mert a felvett hő (olvadáshő) a kötések bontására fordítódik!',
        cards: ['latens_ho', 'olvadasho'],
        test: c => c.sim.phase === PHASE.WATER
      },
      {
        title: 'Folyékony halmazállapot (Víz)',
        text: 'Az összes jég elolvadt, a fűtés leállt! Koppints a tutor sárga felkiáltójelére a folyékony halmazállapotért!',
        hint: 'A fűtés kikapcsolt, a víz stabilan 0 °C-os. Koppints a tutor felkiáltójelére a folyékony állapot bemutatásához!',
        cards: ['viz_melegites'],
        test: c => c.collectedHotspots.has('viz_melegites')
      },
      {
        title: 'Víz melegítése a forráspontig',
        processAudioKey: 'melegedes_viz',
        text: 'Kapcsolj maximális lángot (100%), és figyeld a víz melegedését a forráspontig (100 °C)!',
        hint: 'Állítsd a lángot 100%-ra! A víz 100 °C-ra melegszik, a részecskék egyre gyorsabban áramlanak.',
        cards: ['forraspont'],
        test: c => c.sim.T >= 99.95 || c.sim.h >= c.sim.thresholds.c
      },
      {
        title: 'Forráspont és Forráshő (100 °C)',
        processAudioKey: 'forraspont_es_forrasho',
        text: 'Elértük a 100 °C-ot, a fűtés leállt! Kapcsolj ismét lángot (100%), és forrald a vizet gőzzé!',
        hint: 'Kapcsold be a lángot! Figyeld meg a 100 °C-os platót és a forráshőt (2260 kJ/kg)! A hőmérséklet nem nő, amíg az összes víz el nem forr.',
        cards: ['forrasho'],
        test: c => c.sim.phase === PHASE.STEAM
      },
      {
        title: 'Légnemű halmazállapot (Vízgőz)',
        text: 'Az összes víz elforrt, a fűtés leállt! Koppints a tutor sárga felkiáltójelére a légnemű halmazállapotért!',
        hint: 'A fűtés kikapcsolt, a gőz stabilan 100 °C-os. Koppints a tutor sárga felkiáltójelére a légnemű állapot bemutatásához!',
        cards: ['goz'],
        test: c => c.collectedHotspots.has('goz')
      }
    ],
    quiz: [
      {
        q: 'Miért kisebb a jég sűrűsége a folyékony víznél, ami miatt úszik a vízen?',
        options: [
          'A hatszögletű kristályrácsban lévő tágas, üres csatornák miatt',
          'Mert a jégben kevesebb oxigénatom van',
          'Mert a hidegben a molekulák összemennek'
        ],
        answer: 0,
        explain: 'A jég szellős, tágas hexagonális kristályrácsa a hidrogénhidakkal üres csatornákat zár közre, ezért a sűrűsége kisebb a vízénél!'
      },
      {
        q: 'Mire fordítódik a víz által felvett hő a 0 °C-os olvadás és a 100 °C-os forrás közben?',
        options: [
          'A kötések bontására (olvadáshő, forráshő), miközben a hőmérséklet állandó marad',
          'A hőmérséklet közvetlen további emelésére',
          'A molekulák színének megváltoztatására'
        ],
        answer: 0,
        explain: 'A platók alatt a felvett hő (olvadáshő: 334 kJ/kg, forráshő: 2260 kJ/kg) a fázisátalakulást és a kötések bontását végzi, a hőmérséklet nem nő!'
      },
      {
        q: 'Mi történik a hőmérséklettel, amíg a jég olvad (0 °C-on)?',
        options: ['Folyamatosan növekszik', 'Állandó marad (0 °C)', 'Csökken'],
        answer: 1,
        explain: 'A hőmérséklet állandó marad: ez a hőmérsékleti plató a grafikonon!'
      },
      {
        q: 'Hogyan mozognak a részecskék a folyékony vízben a szilárd jéghez képest?',
        options: [
          'Szabadon elgördülnek és áramlanak egymáson, felvéve az edény alakját',
          'Mereven egy helyben rezegnek a rácspontokon',
          'Óriási távolságra száguldanak elszakadva egymástól'
        ],
        answer: 0,
        explain: 'A folyadékban a kristályrács kötései felbomlottak, így a molekulák szabadon áramlanak egymáson, de a térfogatuk még állandó.'
      },
      {
        q: 'Mi jellemző a légnemű (gőz) halmazállapotú anyagra?',
        options: [
          'Nincs állandó alakja és térfogata: kitölti a teljes teret és összenyomható',
          'Állandó alakja van, mint a jégnek',
          'Csak az edény alján folyik szét'
        ],
        answer: 0,
        explain: 'A gázokban a molekulák közötti vonzóerők megszűntek: kitöltik a rendelkezésre álló teljes teret és nagy sebességgel ütköznek a falaknak.'
      }
    ]
  }
];
