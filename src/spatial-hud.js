import * as THREE from 'three';
import {
  DEFAULT_ROBOT_COLORS,
  ROBOT_COLORS_STORAGE_KEY,
  hexToRgb,
  rgbToCss,
  mixRgb,
  buildRobotModel,
  applyRobotPoseAndAnimation,
  createStudioEnvMap,
  refreshHeadColorTexture,
  refreshTorsoColorTexture,
  updateRobotVisorCanvas,
  updateRobotChestCoreCanvas
} from './robot-builder.js';
import { speak } from './speech.js';

// ===============================================================
// EGYSÉGES SÖTÉT DASHBOARD HUD MUNKATÉR (PHYSIXR)
// (Pontosan a spatial_hud_dev.html fájl dizájnja és elrendezése alapján)
// ===============================================================

const STORAGE_KEY = 'fazister_hud_layout_v2';

export class SpatialHUD {
  constructor(options = {}) {
    this.sim = options.sim;
    this.game = options.game;
    this.tutor = options.tutor;
    this.workGroup = options.workGroup;
    this.desktopScale = options.desktopScale || 0.24;
    this.onStartLab = options.onStartLab;
    this.onReanchor = options.onReanchor;
    this.onOpenMenu = options.onOpenMenu;

    this.container = document.getElementById('spatial-hud-root');
    this.highestZ = 100;
    this.defaultPositions = {};

    // Hőmérséklet történet
    this.maxHistoryPoints = 35;
    this.tempHistory = Array(this.maxHistoryPoints).fill(-30.0);
    this.isTempSimRunning = true;
    this.currentThermalVal = 0;

    // Küldetések és Gyűjtemény állapot
    this.currentMissionIndex = 0;
    this.currentMissionTab = 'task';
    this.quizAttempts = {};
    this.quizScore = 0;
    this.activeCollectionFilter = 'all';
    this.currentOpenedCardId = null;

    this.initData();
    this.renderDOM();
    this.initHUDInteractions();
    this.loadLayout();
    this.updateThermalUI(0);
    this.renderCollection();
    this.updateMissionUI();
    this.updatePressure(1.0);
    this.updateTempChart();

    // Kezdeti állapot szinkronizálása: ha a labor még nem indult el, a Beállítások pár jelenik meg
    this.syncVisibility(!this.game?.introStarted);
  }

  initData() {
    this.collectionCards = [
      {
        id: 'ice',
        title: 'Szilárd jég',
        category: 'allapot',
        categoryName: 'Halmazállapot',
        categoryColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        icon: 'fa-solid fa-cube',
        iconColor: 'text-sky-400',
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
        micro: '🔬 Mikroszerkezet: 4 szomszédos molekula tetraéderes elrendezésben, nyitott hatszögletű gyűrűk.'
      },
      {
        id: 'water',
        title: 'Folyékony víz',
        category: 'allapot',
        categoryName: 'Halmazállapot',
        categoryColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        icon: 'fa-solid fa-droplet',
        iconColor: 'text-cyan-400',
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
        micro: '💧 Anomális hőtágulás: Legnagyobb sűrűségét +4 °C-on éri el.'
      },
      {
        id: 'steam',
        title: 'Vízgőz',
        category: 'allapot',
        categoryName: 'Halmazállapot',
        categoryColor: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        icon: 'fa-solid fa-smog',
        iconColor: 'text-slate-300',
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
        micro: '💨 Molekuláris távolság: Átlagosan 10-szer nagyobb a molekulaméretnél.'
      },
      {
        id: 'melting',
        title: 'Olvadás & Fagyás',
        category: 'valtozas',
        categoryName: 'Fázisátmenet',
        categoryColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: 'fa-solid fa-temperature-arrow-up',
        iconColor: 'text-amber-400',
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
        micro: '🧊 Látens hő plató: A T(t) diagramon vízszintes szakasz látható.'
      },
      {
        id: 'boiling',
        title: 'Párolgás & Forrás',
        category: 'valtozas',
        categoryName: 'Fázisátmenet',
        categoryColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        icon: 'fa-solid fa-fire-burner',
        iconColor: 'text-orange-400',
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
        micro: '🔥 Hőmérséklet-stabilitás: Forrás közben a hőmérséklet nem lépi túl a 100 °C-ot.'
      },
      {
        id: 'sublimation',
        title: 'Szublimáció',
        category: 'valtozas',
        categoryName: 'Fázisátmenet',
        categoryColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        icon: 'fa-solid fa-arrow-trend-up',
        iconColor: 'text-purple-400',
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
        micro: '💨 Felületi párolgás: A molekulák a rácsból közvetlenül a gáztérbe repülnek.'
      },
      {
        id: 'condensation',
        title: 'Lecsapódás',
        category: 'valtozas',
        categoryName: 'Fázisátmenet',
        categoryColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        icon: 'fa-solid fa-cloud-rain',
        iconColor: 'text-teal-400',
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
        micro: '🌧️ Kondenzációs magvak: Felületeken vagy mikroszkopikus részecskéken indul el.'
      },
      {
        id: 'crystal',
        title: 'Jégkristály',
        category: 'fogalom',
        categoryName: 'Mikroszerkezet',
        categoryColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        icon: 'fa-solid fa-gem',
        iconColor: 'text-indigo-300',
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
        micro: '❄️ Nyitott rácsszerkezet: a = 4,52 Å, c = 7,36 Å.'
      },
      {
        id: 'triple',
        title: 'Hármaspont',
        category: 'fogalom',
        categoryName: 'Egyensúly',
        categoryColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        icon: 'fa-solid fa-atom',
        iconColor: 'text-rose-400',
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
        micro: '⚖️ Gibbs-féle fázistörvény: F = 1 - 3 + 2 = 0.'
      },
      {
        id: 'critical',
        title: 'Kritikus pont',
        category: 'fogalom',
        categoryName: 'Extrém állapot',
        categoryColor: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
        icon: 'fa-solid fa-bolt',
        iconColor: 'text-fuchsia-400',
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
        micro: '⚡ Szuperkritikus fluidum: Gázszerű diffúzió + folyadékszerű oldóképesség.'
      }
    ];

    this.missionList = [
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
  }

  renderDOM() {
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- Térbeli rácsháttér -->
      <div class="spatial-grid-bg"></div>

      <!-- Közép referencia jelölő -->
      <div class="center-crosshair">
        <span class="text-[9px] text-zinc-600 font-mono tracking-widest mt-12">VR_WORKSPACE_CENTER</span>
      </div>

      <!-- Lebegő Főmenü Gomb a bal felső sarokban (fejléc helyett) -->
      <button id="btnFloatingMainMenu" class="floating-lab-menu-btn" style="position: absolute; top: 20px; left: 24px; z-index: 60;" title="Visszatérés a Főmenübe">
        <i class="fa-solid fa-arrow-left text-xs"></i> <span>Főmenü</span>
      </button>

      <!-- ====================================================================== -->
      <!-- 1. ELEM: FELSŐ STÁTUSZ PILL ÉS KÜLÖN KÖR BEÁLLÍTÁSOK GOMB               -->
      <!-- ====================================================================== -->
      <div id="hud-top-status" class="draggable-hud pointer-events-auto flex items-center gap-2" style="top: 24px; left: calc(50% - 165px); z-index: 40;">
        <div class="drag-handle bg-dark-800 border border-dark-border px-5 py-2 rounded-full flex items-center justify-center gap-4 text-sm font-medium shadow-xl hover:border-zinc-500 transition-colors">
          <span id="topStateDisplay" class="flex items-center gap-2 text-zinc-300"><i class="fa-solid fa-cube text-accent-blue"></i> Jég</span>
          <div class="w-px h-4 bg-dark-border"></div>
          <span class="text-white font-mono" id="topTempDisplay">-30 °C</span>
          <div class="w-px h-4 bg-dark-border"></div>
          <span id="topPressureDisplay" class="text-zinc-400 font-mono">1,0 atm</span>
        </div>
        <button id="btnToggleSettingsGear" class="w-9 h-9 rounded-full bg-dark-800 hover:bg-dark-700 border border-dark-border hover:border-accent-blue/60 text-zinc-300 hover:text-white flex items-center justify-center shadow-xl transition-all cursor-pointer group shrink-0" title="Kezdő beállítás & Méret minta megnyitása / elrejtése">
          <i class="fa-solid fa-gear text-xs text-zinc-400 group-hover:text-accent-blue group-hover:rotate-45 transition-all duration-300"></i>
        </button>
      </div>

      <!-- ====================================================================== -->
      <!-- 6. KOMPAKT FÁZISTÉR MR BEÁLLÍTÓ KÁRTYA (BAL SZÉLEN, A KOCKÁN KÍVÜL)     -->
      <!-- ====================================================================== -->
      <div id="hud-vision-left" class="draggable-hud panel-unified w-[340px] p-3.5 pointer-events-auto rounded-2xl" style="top: 110px; left: 24px; z-index: 50;">
        
        <!-- Fejléc: Kezdő beállítás & Indítás főcím -->
        <div class="drag-handle mb-3 pb-2 border-b border-[#262626]">
          <h1 class="text-base font-bold text-white tracking-tight">Kezdő beállítás & Indítás</h1>
        </div>

        <!-- 3 db Kompakt Csúszka Sor (Tiszta, nem megtört sorok) -->
        <div class="space-y-2.5 my-2.5">
          
          <!-- 1. Elforgatás: 0° középen -->
          <div class="bg-dark-700 border border-dark-border rounded-xl p-2.5 flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-200 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-arrows-rotate text-sky-400 text-[11px]"></i> Elforgatás: <span id="rotValLabel" class="text-white font-mono font-bold">0°</span>
              </span>
              <button id="btnResetRot" class="btn-secondary-dark px-2.5 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer">
                0° Szembe
              </button>
            </div>
            <div class="relative flex items-center">
              <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-600 -translate-x-1/2 pointer-events-none z-10"></div>
              <input id="rotSlider" type="range" min="-180" max="180" value="0" class="setting-slider track-gray thumb-blue relative z-20">
            </div>
          </div>

          <!-- 2. Asztali méret: 100% középen -->
          <div class="bg-dark-700 border border-dark-border rounded-xl p-2.5 flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-emerald-400 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-magnifying-glass text-[11px]"></i> Asztali méret: <span id="deskValLabel" class="text-white font-mono font-bold">100%</span>
              </span>
              <button id="btnResetDesk" class="btn-secondary-dark px-2.5 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer">
                Alapméret
              </button>
            </div>
            <div class="relative flex items-center">
              <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-600 -translate-x-1/2 pointer-events-none z-10"></div>
              <input id="deskSlider" type="range" min="50" max="150" value="100" class="setting-slider track-green thumb-green relative z-20">
            </div>
          </div>

          <!-- 3. HUD méret: 100% középen -->
          <div class="bg-dark-700 border border-dark-border rounded-xl p-2.5 flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-amber-400 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-ruler-combined text-[11px]"></i> HUD méret: <span id="hudValLabel" class="text-white font-mono font-bold">100%</span>
              </span>
              <button id="btnResetHud" class="btn-secondary-dark px-2.5 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white cursor-pointer">
                Alap HUD
              </button>
            </div>
            <div class="relative flex items-center">
              <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-600 -translate-x-1/2 pointer-events-none z-10"></div>
              <input id="hudSlider" type="range" min="50" max="150" value="100" class="setting-slider track-yellow thumb-yellow relative z-20">
            </div>
          </div>

        </div>

        <!-- ESZTÉTIKUS KONTROLLER ÚTMUTATÓ MIKRO-KÁRTYÁK (3 szimmetrikus oszlop, semmi sem törik meg) -->
        <div class="grid grid-cols-3 gap-2 mb-3.5 select-none">
          <!-- 1. Forgatás -->
          <div class="bg-dark-900 border border-dark-border rounded-xl py-2 px-1.5 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-sky-400 font-semibold flex items-center gap-1">
              Jobb kar ↔
            </span>
            <span class="text-[11px] text-zinc-300 font-medium mt-0.5">Forgatás</span>
          </div>

          <!-- 2. Asztal méret -->
          <div class="bg-dark-900 border border-dark-border rounded-xl py-2 px-1.5 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              Jobb kar ↕
            </span>
            <span class="text-[11px] text-zinc-300 font-medium mt-0.5">Asztal méret</span>
          </div>

          <!-- 3. HUD méret -->
          <div class="bg-dark-900 border border-dark-border rounded-xl py-2 px-1.5 flex flex-col items-center justify-center text-center">
            <span class="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
              Bal kar ↕
            </span>
            <span class="text-[11px] text-zinc-300 font-medium mt-0.5">HUD méret</span>
          </div>
        </div>

        <!-- Alsó Gombsor -->
        <div class="flex items-center gap-2 pt-1.5">
          <button id="btnReanchorAction" class="btn-secondary-dark flex-1 py-2 px-3 text-xs flex items-center justify-center gap-2 text-zinc-200 hover:text-white transition-colors cursor-pointer">
            <i class="fa-solid fa-location-dot text-rose-500 text-sm"></i> Új helyre
          </button>
          <button id="btnStartLabAction" class="btn-primary-dark flex-[1.3] py-2 px-3 text-xs flex items-center justify-center gap-2 font-semibold cursor-pointer">
            <i class="fa-solid fa-play text-xs"></i> Start / Indítás
          </button>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- 7. ÚJ KÁRTYA #2: HUD MÉRET MINTA (JOBB SZÉLEN, A KOCKÁN KÍVÜL)         -->
      <!-- ====================================================================== -->
      <div id="hud-vision-right" class="draggable-hud panel-unified w-[420px] p-4 pointer-events-auto overflow-hidden relative" style="top: 110px; right: 24px; left: auto; z-index: 50;">
        
        <!-- Sötét tónusú robot illusztráció a háttérben -->
        <div class="absolute -right-4 top-8 w-52 h-52 opacity-10 pointer-events-none select-none">
          <svg viewBox="0 0 200 200" class="w-full h-full text-zinc-400" fill="currentColor">
            <rect x="45" y="45" width="110" height="90" rx="30" fill="currentColor" fill-opacity="0.3" stroke="white" stroke-width="2"/>
            <rect x="30" y="70" width="15" height="40" rx="7" fill="white" fill-opacity="0.5"/>
            <rect x="155" y="70" width="15" height="40" rx="7" fill="white" fill-opacity="0.5"/>
            <line x1="100" y1="45" x2="100" y2="22" stroke="white" stroke-width="3" stroke-linecap="round"/>
            <circle cx="100" cy="18" r="6" fill="#0d6efd"/>
            <rect x="58" y="70" width="84" height="34" rx="17" fill="#0a0a0a" stroke="#0d6efd" stroke-width="2"/>
            <circle cx="80" cy="87" r="6" fill="#0d6efd"/>
            <circle cx="120" cy="87" r="6" fill="#0d6efd"/>
            <path d="M 88 116 Q 100 126 112 116" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
          </svg>
        </div>

        <div id="hudSampleScaleWrapper" class="relative z-10 transition-transform origin-top-left">
          <!-- Fejléc (bezáró gomb nélkül) -->
          <div class="drag-handle mb-3 pb-2 border-b border-[#262626]">
            <h2 class="text-lg font-bold text-white tracking-tight">HUD Méret Minta</h2>
            <p class="text-xs font-semibold text-accent-blue mt-0.5">Olvashatósági minta a méret beállításához</p>
          </div>

          <!-- Magyarázat -->
          <p class="text-xs text-zinc-400 leading-relaxed font-normal mb-4">
            Ez a minta segít ellenőrizni a szövegek élességét és arányait. A bal oldali csúszkával addig állítsd a HUD méretét, amíg a szemüvegedben minden felirat kényelmesen olvashatóvá nem válik számodra!
          </p>

          <!-- Apró betűs minta doboz (a sötét dashboard kártya stílusában) -->
          <div class="bg-dark-700 border border-dark-border rounded-xl p-3 mb-5 flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-dark-900 border border-dark-border flex items-center justify-center text-accent-blue shrink-0">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono leading-relaxed">
              <span class="text-zinc-400 font-sans">Apró betűs minta:</span> 
              <span class="text-white font-medium">Hőmérséklet: -30 °C</span> | 
              <span class="text-accent-blue">Nyomás: 1,0 atm</span> | 
              <span class="text-amber-400">Látens hő: 334 kJ/kg</span>
            </div>
          </div>

          <!-- Gombok a sötét dashboard stílusában -->
          <div class="flex items-center gap-3">
            <button id="btnSampleClick1" class="btn-primary-dark flex-1 py-2.5 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-regular fa-hand-pointer text-xs"></i> <span>Minta gomb</span>
            </button>
            <button id="btnSampleClick2" class="btn-secondary-dark flex-1 py-2.5 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-solid fa-fire text-amber-500 text-xs"></i> <span>Felületpróba</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- 4. LABOR ELEM: BAL PANEL - GYŰJTEMÉNY                                  -->
      <!-- ====================================================================== -->
      <div id="hud-left-collection" class="draggable-hud panel-unified w-[280px] p-3 flex flex-col pointer-events-auto" style="top: 75px; left: 24px; z-index: 20;">
        <div id="colListView" class="flex flex-col">
          <div class="drag-handle flex justify-between items-center mb-2.5 pb-2 border-b border-[#262626]">
            <div class="flex items-center gap-1.5">
              <h2 class="text-sm font-semibold text-white tracking-tight">Gyűjtemény</h2>
              <span class="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">DEV</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button id="devUnlockAllBtn" class="w-6 h-6 rounded-lg bg-dark-700 hover:bg-dark-600 text-zinc-300 border border-dark-border flex items-center justify-center transition-colors cursor-pointer shrink-0" title="Dev: Összes kártya feloldása / zárolása">
                <i id="devUnlockAllIcon" class="fa-solid fa-lock-open text-amber-400 text-xs"></i>
              </button>
              <span id="collectionCounter" class="text-[10px] text-zinc-400 font-mono bg-dark-900 px-2 py-0.5 rounded-full border border-dark-border whitespace-nowrap shrink-0">10 / 10</span>
            </div>
          </div>
          
          <div class="bg-dark-900 border border-dark-border rounded-lg p-0.5 flex gap-0.5 mb-2" id="colFilterBar">
            <button id="colBtn-all" class="flex-1 bg-dark-700 text-white rounded-md py-1 text-[10px] font-medium transition-colors">Összes</button>
            <button id="colBtn-allapot" class="flex-1 text-zinc-400 hover:text-zinc-200 rounded-md py-1 text-[10px] font-medium transition-colors">Állapot</button>
            <button id="colBtn-valtozas" class="flex-1 text-zinc-400 hover:text-zinc-200 rounded-md py-1 text-[10px] font-medium transition-colors">Változás</button>
            <button id="colBtn-fogalom" class="flex-1 text-zinc-400 hover:text-zinc-200 rounded-md py-1 text-[10px] font-medium transition-colors">Fogalom</button>
          </div>

          <div id="collectionItemsContainer" class="space-y-1"></div>
        </div>

        <div id="colDetailView" class="hidden flex-col"></div>
      </div>

      <!-- ====================================================================== -->
      <!-- 5. LABOR ELEM: JOBB FELSŐ PANEL - KÜLDETÉS                              -->
      <!-- ====================================================================== -->
      <div id="hud-right-mission" class="draggable-hud panel-unified w-[300px] p-3 flex flex-col pointer-events-auto" style="top: 75px; right: 24px; z-index: 20;">
        <div class="drag-handle flex justify-between items-center mb-1.5 pb-1.5 border-b border-[#262626]">
          <div class="flex items-center gap-1.5">
            <h2 class="text-sm font-semibold text-white tracking-tight">Küldetés</h2>
            <span id="missionCategoryBadge" class="text-[9px] px-1.5 py-0.2 rounded bg-accent-pillBg text-accent-blue border border-accent-pillBorder font-mono uppercase font-medium">ALAPOK</span>
          </div>
          <span id="missionProgressBadge" class="text-[10px] text-zinc-300 font-mono bg-dark-900 px-2 py-0.5 rounded-full border border-dark-border">1 / 10</span>
        </div>

        <div class="w-full h-1 bg-dark-900 rounded-full overflow-hidden mb-2 border border-[#1e1e1e]">
          <div id="missionProgressBar" class="h-full bg-accent-blue transition-all duration-300" style="width: 10%;"></div>
        </div>

        <div class="flex bg-dark-900 border border-dark-border rounded-lg p-0.5 mb-2 gap-0.5">
          <button id="missionTabTask" class="flex-1 py-1 text-[10px] font-medium rounded-md bg-dark-700 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer">
            <i class="fa-solid fa-book-open text-[9px]"></i> Feladat
          </button>
          <button id="missionTabQuiz" class="flex-1 py-1 text-[10px] font-medium rounded-md text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer">
            <i class="fa-solid fa-circle-question text-[9px] text-amber-400"></i> Kvíz
            <span id="quizBadgeIndicator" class="text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono ml-0.5">Kérdés</span>
          </button>
        </div>

        <div id="missionTaskView" class="mb-2.5 px-0.5">
          <div class="flex items-start justify-between gap-1 mb-1">
            <h3 id="missionTitle" class="text-xs font-semibold text-white leading-tight">Szilárd halmazállapot (Jég)</h3>
            <span id="missionStatusPill" class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0 font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Folyamatban
            </span>
          </div>
          <p id="missionDesc" class="text-[11px] text-zinc-400 leading-relaxed mb-2">
            Vizsgáld meg a jég mikroszkopikus kristályrácsát -30 °C-on és 1.0 atm nyomáson!
          </p>
          <div class="flex items-start gap-2 bg-dark-900/60 p-2 rounded-lg border border-[#262626]">
            <i class="fa-solid fa-circle-info text-accent-blue text-xs mt-0.5 shrink-0"></i>
            <p id="missionTip" class="text-[10px] text-zinc-300 leading-tight">
              Tipp: Kapcsold be a fűtést a hőszabályzó panelen a fázisátmenet elindításához.
            </p>
          </div>
        </div>

        <div id="missionQuizView" class="mb-2.5 px-0.5 hidden">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
              <i class="fa-solid fa-lightbulb"></i> Kvízkérdés
            </span>
            <span id="quizScoreText" class="text-[9px] text-zinc-400 font-mono">0 / 10 pont</span>
          </div>
          <p id="quizQuestionText" class="text-[11px] font-medium text-white leading-snug mb-2"></p>
          <div id="quizOptionsContainer" class="space-y-1.5 mb-1.5"></div>
          <div id="quizFeedbackBox" class="text-[10px] px-2 py-1 rounded-lg hidden font-medium flex items-center gap-1.5"></div>
        </div>

        <div class="flex gap-1.5">
          <button id="btnMissionPrev" class="btn-secondary-dark px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer" title="Előző küldetés">
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>
          <button id="btnMissionQuizToggle" class="btn-secondary-dark flex-1 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer" title="Kvíz / Feladat váltása">
            <i id="btnMissionQuizIcon" class="fa-solid fa-circle-question text-xs"></i>
            <span id="btnMissionQuizText">Kvíz</span>
          </button>
          <button id="btnMissionNext" class="btn-primary-dark flex-[1.4] py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <span id="btnMissionNextText">Következő</span>
            <i id="btnMissionNextIcon" class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- 6. LABOR ELEM: JOBB ALSÓ PANEL - NYOMÁS ÉS MÉRÉS                       -->
      <!-- ====================================================================== -->
      <div id="hud-right-pressure" class="draggable-hud panel-unified w-[300px] p-3 flex flex-col pointer-events-auto" style="top: 360px; right: 24px; z-index: 20;">
        <div class="drag-handle w-full flex justify-between items-center mb-2 pb-1.5 border-b border-[#262626]">
          <h2 class="text-xs font-semibold text-white tracking-wide">Nyomás & Mérés</h2>
        </div>

        <div class="mb-2 bg-dark-900/90 border border-[#262626] rounded-xl p-2 flex flex-col">
          <div class="flex justify-between items-center mb-1 text-[10px]">
            <span class="font-medium text-zinc-300 flex items-center gap-1">
              <i class="fa-solid fa-chart-line text-amber-400 text-xs"></i> T(t) Görbe
            </span>
            <div class="flex items-center gap-1 font-mono">
              <span id="chartLiveTemp" class="text-cyan-400 font-bold px-1.5 py-0.2 rounded bg-dark-800 border border-[#262626]">-30.0 °C</span>
              <button id="btnTempSimToggle" class="text-[9px] bg-dark-800 hover:bg-dark-700 text-zinc-300 px-1.5 py-0.5 rounded border border-dark-border transition-colors cursor-pointer" title="Élő mérés szüneteltetése / indítása">
                <i id="iconTempSim" class="fa-solid fa-pause text-[8px] text-zinc-400"></i>
              </button>
              <button id="btnResetTempChart" class="text-[9px] bg-dark-800 hover:bg-dark-700 text-zinc-300 px-1 py-0.5 rounded border border-dark-border transition-colors cursor-pointer" title="Diagram törlése">
                <i class="fa-solid fa-rotate-right text-[8px] text-zinc-400"></i>
              </button>
            </div>
          </div>

          <div class="relative w-full h-[72px] overflow-hidden rounded-lg bg-[#080808] border border-[#1e1e1e]">
            <svg id="tempChartSvg" class="w-full h-full" viewBox="0 0 260 72">
              <line x1="0" y1="21" x2="260" y2="21" stroke="#f97316" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.45" />
              <line x1="0" y1="51" x2="260" y2="51" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.45" />
              <text x="4" y="17" fill="#f97316" font-size="7.5" font-family="monospace" opacity="0.8">100°C Forrás</text>
              <text x="4" y="47" fill="#38bdf8" font-size="7.5" font-family="monospace" opacity="0.8">0°C Olvadás</text>
              <path id="tempChartPath" d="M 0 60 L 260 60" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <circle id="tempChartDot" cx="260" cy="60" r="3" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
            </svg>
          </div>
          
          <div class="flex justify-between items-center text-[8px] text-zinc-500 font-mono mt-1 px-0.5">
            <span>-60 s</span>
            <span>-30 s</span>
            <span class="text-zinc-400">Most (t)</span>
          </div>
        </div>

        <div class="bg-dark-900/80 border border-[#262626] rounded-xl p-2 flex items-center gap-2.5">
          <div class="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1e1e" stroke-width="8" />
              <circle id="pressureProgressRing" cx="50" cy="50" r="40" fill="none" stroke="#0d6efd" stroke-width="8" 
                      stroke-dasharray="251.327" stroke-dashoffset="125.66" 
                      stroke-linecap="round" />
            </svg>
            <div class="absolute flex flex-col items-center justify-center leading-none">
              <span id="pressureValueDisplay" class="text-xs font-bold text-white font-mono">1.0</span>
              <span class="text-[7px] text-zinc-400 uppercase mt-0.5">atm</span>
            </div>
          </div>

          <div class="flex-1 flex flex-col justify-center">
            <div class="flex justify-between items-center text-[9px] mb-1">
              <span class="text-zinc-400">Nyomás</span>
              <span id="pressureLabelText" class="font-mono text-accent-blue font-semibold">1.0 atm (Normál)</span>
            </div>
            <input id="pressureSlider" type="range" min="0" max="20" value="10" class="w-full h-2">
            <div class="flex justify-between text-[8px] text-zinc-500 font-mono mt-0.5">
              <span>0.0</span>
              <span>1.0</span>
              <span>2.0 atm</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- 7. LABOR ELEM: ALSÓ PANEL - HŐSZABÁLYZÁS (Fader + Gombok)              -->
      <!-- ====================================================================== -->
      <div id="hud-bottom-thermal" class="draggable-hud panel-unified w-[270px] p-4 flex flex-col pointer-events-auto" style="bottom: 24px; left: calc(50% - 135px); z-index: 25;">
        <div class="drag-handle flex justify-between items-center mb-3 pb-2 border-b border-[#262626]">
          <h2 class="text-xs font-semibold text-white tracking-wide">Hőszabályzás</h2>
          <div class="w-14 min-w-[56px] text-right shrink-0">
            <span id="powerDisplay" class="text-sm font-mono font-bold text-zinc-400 tabular-nums">0%</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-dark-700 border border-dark-border rounded-xl px-2 py-3 flex flex-col items-center justify-between shrink-0 w-12 h-[208px] select-none box-border">
            <button type="button" id="btnQuickHeatMax" class="text-rose-500 text-xs shrink-0 select-none cursor-pointer hover:scale-110 transition-transform" title="Max Fűtés (+100%)">🔥</button>

            <div id="thermalFaderContainer" class="fader-track-container my-auto">
              <div id="thermalFaderGroove" class="fader-groove">
                <div class="absolute left-[-4px] right-[-4px] top-1/2 h-[2px] bg-zinc-400 -translate-y-1/2 pointer-events-none z-10"></div>
                <div id="thermalFaderFill" class="fader-fill pointer-events-none"></div>
                <div id="thermalFaderThumb" class="fader-thumb pointer-events-none" style="top: 50%;"></div>
              </div>
            </div>

            <button type="button" id="btnQuickCoolMax" class="text-cyan-400 text-xs shrink-0 select-none cursor-pointer hover:scale-110 transition-transform" title="Max Hűtés (-100%)">❄️</button>
          </div>

          <div class="flex-1 flex flex-col justify-between gap-1.5 h-[208px]">
            <button id="btnThermalMaxHeat" class="btn-secondary-dark py-2 px-3 text-xs font-semibold text-zinc-300 flex items-center justify-between cursor-pointer">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-fire-flame-curved text-rose-500 text-xs"></i> Max fűtés
              </span>
              <span class="text-[10px] font-mono text-zinc-500">+100%</span>
            </button>

            <button id="btnThermalLowHeat" class="btn-secondary-dark py-2 px-3 text-xs font-semibold text-zinc-300 flex items-center justify-between cursor-pointer">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-fire text-amber-500 text-xs"></i> Kis fűtés
              </span>
              <span class="text-[10px] font-mono text-zinc-500">+40%</span>
            </button>

            <button id="btnFlameOff" class="btn-secondary-dark py-2 px-3 text-xs font-bold text-white bg-dark-600 border-zinc-400 flex items-center justify-between cursor-pointer">
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-white"></span> KI
              </span>
              <span class="text-[10px] font-mono text-zinc-400">0%</span>
            </button>

            <button id="btnThermalLowCool" class="btn-secondary-dark py-2 px-3 text-xs font-semibold text-zinc-300 flex items-center justify-between cursor-pointer">
              <span class="flex items-center gap-2">
                <i class="fa-regular fa-snowflake text-sky-400 text-xs"></i> Kis hűtés
              </span>
              <span class="text-[10px] font-mono text-zinc-500">-40%</span>
            </button>

            <button id="btnThermalMaxCool" class="btn-secondary-dark py-2 px-3 text-xs font-semibold text-zinc-300 flex items-center justify-between cursor-pointer">
              <span class="flex items-center gap-2">
                <i class="fa-solid fa-snowflake text-cyan-400 text-xs"></i> Max hűtés
              </span>
              <span class="text-[10px] font-mono text-zinc-500">-100%</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Értesítő -->
      <div id="toast" class="fixed bottom-6 right-6 bg-dark-800 border border-accent-blue/50 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl transform translate-y-20 opacity-0 transition-all duration-300 z-50 pointer-events-none">
        Értesítés
      </div>
    `;
  }

  initHUDInteractions() {
    // Draggable panelek inicializálása
    document.querySelectorAll('.draggable-hud').forEach(el => this.makeElementDraggable(el));

    // Főmenü gomb
    document.getElementById('btnFloatingMainMenu')?.addEventListener('click', () => {
      if (this.onOpenMenu) this.onOpenMenu();
    });

    // Beállítások kártyák ki/bekapcsolása a fogaskerék gombbal
    document.getElementById('btnToggleSettingsGear')?.addEventListener('click', () => {
      this.toggleSettingsCards();
    });

    // Gyűjtemény események
    document.getElementById('devUnlockAllBtn')?.addEventListener('click', () => this.toggleAllCardsDev());
    ['all', 'allapot', 'valtozas', 'fogalom'].forEach(cat => {
      document.getElementById(`colBtn-${cat}`)?.addEventListener('click', () => this.filterCollection(cat));
    });

    // Küldetés események
    document.getElementById('missionTabTask')?.addEventListener('click', () => this.setMissionTab('task'));
    document.getElementById('missionTabQuiz')?.addEventListener('click', () => this.setMissionTab('quiz'));
    document.getElementById('btnMissionQuizToggle')?.addEventListener('click', () => this.toggleMissionTab());
    document.getElementById('btnMissionPrev')?.addEventListener('click', () => this.prevMission());
    document.getElementById('btnMissionNext')?.addEventListener('click', () => this.nextMission());

    // Nyomás és mérés események
    document.getElementById('btnTempSimToggle')?.addEventListener('click', () => this.toggleTempSim());
    document.getElementById('btnResetTempChart')?.addEventListener('click', () => this.resetTempChart());
    const pSlider = document.getElementById('pressureSlider');
    pSlider?.addEventListener('input', (e) => {
      const atm = parseFloat(e.target.value) / 10;
      this.updatePressure(atm);
      if (this.sim) this.sim.pressure = atm;
    });

    // Hőszabályzó események
    document.getElementById('btnQuickHeatMax')?.addEventListener('click', () => this.setThermalPower(100));
    document.getElementById('btnQuickCoolMax')?.addEventListener('click', () => this.setThermalPower(-100));
    document.getElementById('btnThermalMaxHeat')?.addEventListener('click', () => this.setThermalPower(100));
    document.getElementById('btnThermalLowHeat')?.addEventListener('click', () => this.setThermalPower(40));
    document.getElementById('btnFlameOff')?.addEventListener('click', () => this.setThermalPower(0));
    document.getElementById('btnThermalLowCool')?.addEventListener('click', () => this.setThermalPower(-40));
    document.getElementById('btnThermalMaxCool')?.addEventListener('click', () => this.setThermalPower(-100));
    this.initFaderPointer();

    // Kalibrációs csúszkák
    const rotSlider = document.getElementById('rotSlider');
    const rotValLabel = document.getElementById('rotValLabel');
    rotSlider?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      if (rotValLabel) rotValLabel.innerText = `${v > 0 ? '+' : ''}${v}°`;
      this.updateSliderFill(rotSlider);
      if (this.workGroup) this.workGroup.rotation.y = THREE.MathUtils.degToRad(v);
    });

    const deskSlider = document.getElementById('deskSlider');
    const deskValLabel = document.getElementById('deskValLabel');
    deskSlider?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      if (deskValLabel) deskValLabel.innerText = `${v}%`;
      this.updateSliderFill(deskSlider);
      if (this.workGroup) this.workGroup.scale.setScalar(this.desktopScale * (v / 100));
    });

    const hudSlider = document.getElementById('hudSlider');
    const hudValLabel = document.getElementById('hudValLabel');
    const hudSampleScaleWrapper = document.getElementById('hudSampleScaleWrapper');
    hudSlider?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      if (hudValLabel) hudValLabel.innerText = `${v}%`;
      const scale = v / 100;
      if (hudSampleScaleWrapper) hudSampleScaleWrapper.style.transform = `scale(${scale})`;
      this.updateSliderFill(hudSlider);
    });

    document.getElementById('btnResetRot')?.addEventListener('click', () => {
      if (rotSlider) rotSlider.value = 0;
      if (rotValLabel) rotValLabel.innerText = '0°';
      this.updateSliderFill(rotSlider);
      if (this.workGroup) this.workGroup.rotation.y = 0;
      this.showToast('Elforgatás visszaállítva: 0°');
    });

    document.getElementById('btnResetDesk')?.addEventListener('click', () => {
      if (deskSlider) deskSlider.value = 100;
      if (deskValLabel) deskValLabel.innerText = '100%';
      this.updateSliderFill(deskSlider);
      if (this.workGroup) this.workGroup.scale.setScalar(this.desktopScale);
      this.showToast('Asztali méret visszaállítva: 100%');
    });

    document.getElementById('btnResetHud')?.addEventListener('click', () => {
      if (hudSlider) hudSlider.value = 100;
      if (hudValLabel) hudValLabel.innerText = '100%';
      if (hudSampleScaleWrapper) hudSampleScaleWrapper.style.transform = 'scale(1)';
      this.updateSliderFill(hudSlider);
      this.showToast('HUD méret visszaállítva: 100%');
    });

    if (rotSlider) this.updateSliderFill(rotSlider);
    if (deskSlider) this.updateSliderFill(deskSlider);
    if (hudSlider) this.updateSliderFill(hudSlider);

    document.getElementById('btnReanchorAction')?.addEventListener('click', () => {
      if (this.onReanchor) this.onReanchor();
      this.showToast('📍 Új helyre kijelölve');
    });

    document.getElementById('btnStartLabAction')?.addEventListener('click', () => {
      this.handleStartLabClick();
    });

    document.getElementById('btnSampleClick1')?.addEventListener('click', () => this.showToast('🫧 Minta gomb megnyomva!'));
    document.getElementById('btnSampleClick2')?.addEventListener('click', () => this.showToast('🔥 Felületpróba aktív!'));
  }

  // Megjelenítés vezérlése: kezdő beállítás (párok) vs. aktív labor
  syncVisibility(isSetupMode) {
    const isSetup = isSetupMode !== undefined ? isSetupMode : (!this.game?.introStarted);

    // Felső státusz kapszula mindig aktív
    this.setElementDisplay('hud-top-status', 'flex');

    if (isSetup) {
      // Kezdő kalibrációs fázis: a Kezdő beállítás & Indítás és a HUD Méret Minta pár látható egymás mellett
      this.setElementDisplay('hud-vision-left', 'block');
      this.setElementDisplay('hud-vision-right', 'block');

      // A laborműködtető panelek még rejtve
      this.setElementDisplay('hud-left-collection', 'none');
      this.setElementDisplay('hud-right-mission', 'none');
      this.setElementDisplay('hud-right-pressure', 'none');
      this.setElementDisplay('hud-bottom-thermal', 'none');
    } else {
      // Aktív labor fázis: a beállító kártyák elrejtve
      this.setElementDisplay('hud-vision-left', 'none');
      this.setElementDisplay('hud-vision-right', 'none');

      // A laborműködtető panelek a helyükre lépnek
      this.setElementDisplay('hud-left-collection', 'flex');
      this.setElementDisplay('hud-right-mission', 'flex');
      this.setElementDisplay('hud-right-pressure', 'flex');
      this.setElementDisplay('hud-bottom-thermal', 'flex');
    }
  }

  handleStartLabClick() {
    this.syncVisibility(false);
    if (this.onStartLab) this.onStartLab();
    this.showToast('▶ Start / Bemutatkozás indítása');
  }

  toggleSettingsCards() {
    const cardL = document.getElementById('hud-vision-left');
    const isVisible = cardL && cardL.style.display !== 'none';
    const nextDisplay = isVisible ? 'none' : 'block';
    this.setElementDisplay('hud-vision-left', nextDisplay);
    this.setElementDisplay('hud-vision-right', nextDisplay);
    this.showToast(isVisible ? 'Beállítások bezárva' : 'Beállítások megnyitva');
  }

  setElementDisplay(id, displayValue) {
    const el = document.getElementById(id);
    if (el) el.style.display = displayValue;
  }

  makeElementDraggable(element) {
    this.defaultPositions[element.id] = {
      top: element.style.top,
      left: element.style.left,
      right: element.style.right,
      bottom: element.style.bottom,
      transform: element.style.transform,
      zIndex: element.style.zIndex || '20'
    };

    const handle = element.querySelector('.drag-handle') || element;
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#thermalFaderContainer') || e.target.closest('button, input, a') || ['BUTTON', 'INPUT', 'A'].includes(e.target.tagName)) return;

      isDragging = true;
      element.classList.add('is-dragging');
      this.highestZ++;
      element.style.zIndex = this.highestZ;

      const rect = element.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.transform = 'none';
      element.style.left = `${startLeft}px`;
      element.style.top = `${startTop}px`;

      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      newLeft = Math.max(-100, Math.min(window.innerWidth - 80, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - 80, newTop));

      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
    });

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      element.classList.remove('is-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      this.saveLayout();
    };

    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  }

  saveLayout() {
    try {
      const layout = {};
      const ids = ['hud-top-status', 'hud-vision-left', 'hud-vision-right', 'hud-left-collection', 'hud-right-mission', 'hud-right-pressure', 'hud-bottom-thermal'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          layout[id] = {
            left: el.style.left,
            top: el.style.top,
            right: el.style.right,
            bottom: el.style.bottom,
            transform: el.style.transform,
            zIndex: el.style.zIndex || ''
          };
        }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (_) {}
  }

  loadLayout() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const layout = JSON.parse(saved);
      Object.keys(layout).forEach(id => {
        const data = layout[id];
        const el = document.getElementById(id);
        if (el && data) {
          if (data.left) el.style.left = data.left;
          if (data.top) el.style.top = data.top;
          if (data.right) el.style.right = data.right;
          if (data.bottom) el.style.bottom = data.bottom;
          if (data.transform) el.style.transform = data.transform;
          if (data.zIndex) {
            el.style.zIndex = data.zIndex;
            const z = parseInt(data.zIndex, 10);
            if (!isNaN(z) && z >= this.highestZ) this.highestZ = z + 1;
          }
        }
      });
    } catch (_) {}
  }

  updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--val-p', `${percent}%`);
  }

  setDeskScalePercent(pct) {
    const slider = document.getElementById('deskSlider');
    const label = document.getElementById('deskValLabel');
    if (slider) {
      slider.value = pct;
      this.updateSliderFill(slider);
    }
    if (label) label.innerText = `${Math.round(pct)}%`;
  }

  setRotationDeg(deg) {
    const slider = document.getElementById('rotSlider');
    const label = document.getElementById('rotValLabel');
    if (slider) {
      slider.value = deg;
      this.updateSliderFill(slider);
    }
    if (label) label.innerText = `${deg > 0 ? '+' : ''}${Math.round(deg)}°`;
  }

  setHudScalePercent(pct) {
    const slider = document.getElementById('hudSlider');
    const label = document.getElementById('hudValLabel');
    const wrapper = document.getElementById('hudSampleScaleWrapper');
    if (slider) {
      slider.value = pct;
      this.updateSliderFill(slider);
    }
    if (label) label.innerText = `${Math.round(pct)}%`;
    if (wrapper) wrapper.style.transform = `scale(${pct / 100})`;
  }

  // ----------------------------------------------------------------------
  // HŐSZABÁLYZÓ FADER
  // ----------------------------------------------------------------------
  initFaderPointer() {
    const faderContainer = document.getElementById('thermalFaderContainer');
    if (!faderContainer) return;
    let isFaderActive = false;

    const handleFaderPointer = (e) => {
      const groove = document.getElementById('thermalFaderGroove');
      if (!groove) return;
      const rect = groove.getBoundingClientRect();
      const totalH = rect.height || 122;
      let offsetY = e.clientY - rect.top;
      let ratio = offsetY / totalH;

      const minRatio = 0.08;
      const maxRatio = 0.92;
      let clampedRatio = Math.max(minRatio, Math.min(maxRatio, ratio));
      let norm = (clampedRatio - minRatio) / (maxRatio - minRatio);

      let val = Math.round((1 - norm * 2) * 100);
      val = Math.round(val / 5) * 5;
      if (Math.abs(val) <= 4) val = 0;
      this.setThermalPower(val);
    };

    faderContainer.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      isFaderActive = true;
      faderContainer.setPointerCapture(e.pointerId);
      handleFaderPointer(e);
    });

    faderContainer.addEventListener('pointermove', (e) => {
      if (isFaderActive) {
        e.stopPropagation();
        e.preventDefault();
        handleFaderPointer(e);
      }
    });

    const stopFader = () => {
      if (isFaderActive) {
        isFaderActive = false;
      }
    };
    faderContainer.addEventListener('pointerup', stopFader);
    faderContainer.addEventListener('pointercancel', stopFader);
  }

  highlightActiveButton(val) {
    const btns = [
      { id: 'btnThermalMaxHeat', v: 100, activeCls: 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(255,23,68,0.3)]' },
      { id: 'btnThermalLowHeat', v: 40, activeCls: 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]' },
      { id: 'btnFlameOff', v: 0, activeCls: 'bg-dark-600 border-zinc-300 text-white shadow-inner' },
      { id: 'btnThermalLowCool', v: -40, activeCls: 'bg-sky-950/60 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.3)]' },
      { id: 'btnThermalMaxCool', v: -100, activeCls: 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,229,255,0.3)]' },
    ];

    btns.forEach(b => {
      const el = document.getElementById(b.id);
      if (!el) return;
      el.classList.remove(
        'bg-rose-950/60', 'border-rose-500', 'text-rose-300', 'shadow-[0_0_10px_rgba(255,23,68,0.3)]',
        'bg-amber-950/60', 'border-amber-500', 'text-amber-300', 'shadow-[0_0_10px_rgba(250,204,21,0.3)]',
        'bg-sky-950/60', 'border-sky-400', 'text-sky-300', 'shadow-[0_0_10px_rgba(56,189,248,0.3)]',
        'bg-cyan-950/60', 'border-cyan-400', 'text-cyan-200', 'shadow-[0_0_10px_rgba(0,229,255,0.3)]',
        'bg-dark-600', 'border-zinc-300', 'text-white', 'shadow-inner'
      );
      el.classList.add('text-zinc-300');
      if (val === b.v) {
        el.classList.remove('text-zinc-300');
        b.activeCls.split(' ').forEach(c => el.classList.add(c));
      }
    });
  }

  updateThermalUI(val) {
    val = parseInt(val, 10);
    this.currentThermalVal = val;
    this.highlightActiveButton(val);

    const faderFill = document.getElementById('thermalFaderFill');
    const faderThumb = document.getElementById('thermalFaderThumb');
    const powerDisplay = document.getElementById('powerDisplay');
    const btnFlameOff = document.getElementById('btnFlameOff');

    const thumbPercent = 50 - (val * 0.42);
    if (faderThumb) faderThumb.style.top = `${thumbPercent}%`;

    if (val === 0) {
      if (faderFill) faderFill.style.height = '0px';
      if (faderThumb) {
        faderThumb.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)';
        faderThumb.style.borderColor = '#ffffff';
      }
      if (powerDisplay) {
        powerDisplay.innerText = '0%';
        powerDisplay.className = 'text-sm font-mono font-bold text-zinc-400 tabular-nums';
      }
      if (btnFlameOff) {
        btnFlameOff.className = 'btn-secondary-dark py-2 px-3 text-xs font-bold text-white bg-dark-600 border-zinc-400 flex items-center justify-between transition-all';
      }
    } else if (val > 0) {
      const fillHeight = 50 - thumbPercent;
      if (faderFill) {
        faderFill.style.top = `${thumbPercent}%`;
        faderFill.style.height = `${fillHeight}%`;
        faderFill.style.background = 'linear-gradient(180deg, #ff1744 0%, #ff9100 100%)';
        faderFill.style.boxShadow = '0 0 10px rgba(255, 23, 68, 0.5)';
      }
      if (faderThumb) {
        faderThumb.style.boxShadow = '0 0 14px rgba(255, 60, 0, 0.95), 0 0 4px #ff9100';
        faderThumb.style.borderColor = '#ff7700';
      }
      if (powerDisplay) {
        powerDisplay.innerText = `+${val}%`;
        powerDisplay.className = 'text-sm font-mono font-bold text-[#ff3d00] drop-shadow-[0_0_8px_rgba(255,61,0,0.5)] tabular-nums';
      }
      if (btnFlameOff) {
        btnFlameOff.className = 'btn-secondary-dark py-2 px-3 text-xs font-bold text-zinc-400 flex items-center justify-between transition-all';
      }
    } else {
      const fillHeight = thumbPercent - 50;
      if (faderFill) {
        faderFill.style.top = '50%';
        faderFill.style.height = `${fillHeight}%`;
        faderFill.style.background = 'linear-gradient(180deg, #0070f3 0%, #00e5ff 100%)';
        faderFill.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.5)';
      }
      if (faderThumb) {
        faderThumb.style.boxShadow = '0 0 14px rgba(0, 229, 255, 0.95), 0 0 4px #00e5ff';
        faderThumb.style.borderColor = '#00e5ff';
      }
      if (powerDisplay) {
        powerDisplay.innerText = `${val}%`;
        powerDisplay.className = 'text-sm font-mono font-bold text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] tabular-nums';
      }
      if (btnFlameOff) {
        btnFlameOff.className = 'btn-secondary-dark py-2 px-3 text-xs font-bold text-zinc-400 flex items-center justify-between transition-all';
      }
    }
  }

  setThermalPower(val) {
    this.updateThermalUI(val);
    if (this.sim) {
      this.sim.power = val / 100;
    }
    if (val === 0) this.showToast('Láng kikapcsolva (0%)');
    else if (val > 0) this.showToast(`Fűtés beállítva: +${val}%`);
    else this.showToast(`Hűtés beállítva: ${Math.abs(val)}%`);
  }

  // ----------------------------------------------------------------------
  // NYOMÁSMÉRŐ
  // ----------------------------------------------------------------------
  updatePressure(atm) {
    atm = parseFloat(atm);
    const formatted = atm.toFixed(1);

    const pressureValueDisplay = document.getElementById('pressureValueDisplay');
    const topPressureDisplay = document.getElementById('topPressureDisplay');
    const pressureLabelText = document.getElementById('pressureLabelText');
    const pressureProgressRing = document.getElementById('pressureProgressRing');

    if (pressureValueDisplay) pressureValueDisplay.innerText = formatted;
    if (topPressureDisplay) topPressureDisplay.innerText = `${formatted.replace('.', ',')} atm`;

    if (pressureLabelText) {
      if (atm <= 0.2) {
        pressureLabelText.innerText = `${formatted} atm (Vákuum)`;
        pressureLabelText.className = 'font-mono text-purple-400 font-semibold';
      } else if (atm >= 0.8 && atm <= 1.2) {
        pressureLabelText.innerText = `${formatted} atm (Normál)`;
        pressureLabelText.className = 'font-mono text-accent-blue font-semibold';
      } else {
        pressureLabelText.innerText = `${formatted} atm (Túlnyomás)`;
        pressureLabelText.className = 'font-mono text-amber-400 font-semibold';
      }
    }

    const circumference = 251.327;
    const pct = Math.max(0, Math.min(1, atm / 2.0));
    const offset = circumference - (pct * (circumference * 0.75));
    if (pressureProgressRing) pressureProgressRing.style.strokeDashoffset = offset;
  }

  // ----------------------------------------------------------------------
  // T(t) DIAGRAM
  // ----------------------------------------------------------------------
  tempToY(t) {
    const clamped = Math.max(-50, Math.min(150, t));
    const y = 66 - ((clamped + 50) / 200) * 60;
    return Math.round(y * 10) / 10;
  }

  getTempColor(t) {
    if (t < 0) return '#38bdf8';
    if (t <= 100) return '#4ade80';
    return '#f97316';
  }

  updateTempChart() {
    const pathEl = document.getElementById('tempChartPath');
    const dotEl = document.getElementById('tempChartDot');
    const liveTempEl = document.getElementById('chartLiveTemp');
    const topTempEl = document.getElementById('topTempDisplay');

    if (!pathEl || !dotEl) return;

    const totalWidth = 260;
    const stepX = totalWidth / (this.maxHistoryPoints - 1);

    const points = this.tempHistory.map((t, idx) => {
      const x = Math.round(idx * stepX * 10) / 10;
      const y = this.tempToY(t);
      return `${x} ${y}`;
    });

    pathEl.setAttribute('d', `M ${points.join(' L ')}`);

    const currentT = this.tempHistory[this.tempHistory.length - 1];
    const currentY = this.tempToY(currentT);
    const currentColor = this.getTempColor(currentT);

    pathEl.setAttribute('stroke', currentColor);
    dotEl.setAttribute('cy', currentY);
    dotEl.setAttribute('fill', currentColor);

    const formatted = `${currentT > 0 ? '+' : ''}${currentT.toFixed(1)} °C`;
    if (liveTempEl) {
      liveTempEl.innerText = formatted;
      liveTempEl.style.color = currentColor;
    }
    if (topTempEl) {
      topTempEl.innerText = `${currentT > 0 ? '+' : ''}${Math.round(currentT)} °C`;
    }
  }

  toggleTempSim() {
    this.isTempSimRunning = !this.isTempSimRunning;
    const icon = document.getElementById('iconTempSim');
    if (icon) {
      icon.className = this.isTempSimRunning ? 'fa-solid fa-pause text-[8px] text-zinc-400' : 'fa-solid fa-play text-[8px] text-emerald-400';
    }
    this.showToast(this.isTempSimRunning ? 'T(t) mérés elindítva' : 'T(t) mérés szüneteltetve');
  }

  resetTempChart() {
    const last = this.tempHistory[this.tempHistory.length - 1];
    this.tempHistory = Array(this.maxHistoryPoints).fill(last);
    this.updateTempChart();
    this.showToast('T(t) diagram törölve');
  }

  // ----------------------------------------------------------------------
  // GYŰJTEMÉNY PANEL
  // ----------------------------------------------------------------------
  renderCollection() {
    const container = document.getElementById('collectionItemsContainer');
    const counterEl = document.getElementById('collectionCounter');
    if (!container) return;

    const filtered = this.collectionCards.filter(c => {
      if (this.activeCollectionFilter === 'all') return true;
      return c.category === this.activeCollectionFilter;
    });

    const unlockedCount = this.collectionCards.filter(c => c.status !== 'locked').length;
    if (counterEl) counterEl.innerText = `${unlockedCount} / ${this.collectionCards.length}`;

    container.innerHTML = filtered.map(card => {
      const isLocked = card.status === 'locked';
      const isActive = card.status === 'active';

      let bgClass = 'bg-dark-900/90 border-[#262626] text-zinc-300 hover:border-zinc-500 hover:bg-dark-700 cursor-pointer';
      let iconColor = card.iconColor;
      let badge = '';

      if (isLocked) {
        bgClass = 'bg-dark-900/30 border-[#1f1f1f] text-zinc-600 cursor-not-allowed opacity-50';
        iconColor = 'text-zinc-600';
        badge = '<i class="fa-solid fa-lock text-[10px] text-zinc-600 ml-auto"></i>';
      } else if (isActive) {
        bgClass = 'bg-blue-950/40 border-accent-blue/60 text-white shadow-[0_0_12px_rgba(13,110,253,0.25)] cursor-pointer';
        badge = '<span class="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_6px_#0d6efd] ml-auto animate-pulse"></span>';
      } else {
        badge = '<i class="fa-solid fa-chevron-right text-[9px] text-zinc-500 ml-auto"></i>';
      }

      return `
        <div onclick="window.physixrHud.selectCollectionCard('${card.id}')"
             class="flex items-center gap-2 p-1.5 rounded-lg border transition-all ${bgClass}">
          <div class="w-6 h-6 rounded-md bg-dark-800 border border-dark-border flex items-center justify-center shrink-0">
            <i class="${card.icon} ${iconColor} text-xs"></i>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-medium truncate">${card.title}</span>
            <span class="text-[9px] text-zinc-500 font-mono truncate">${isLocked ? 'Zárolt kártya' : card.subtitle}</span>
          </div>
          ${badge}
        </div>
      `;
    }).join('');
  }

  openCardDetail(cardId) {
    const card = this.collectionCards.find(c => c.id === cardId);
    if (!card || card.status === 'locked') return;

    this.currentOpenedCardId = cardId;
    const listView = document.getElementById('colListView');
    const detailView = document.getElementById('colDetailView');
    if (!listView || !detailView) return;

    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailView.classList.add('flex');

    detailView.innerHTML = `
      <div class="drag-handle flex items-center justify-between mb-2.5 pb-2 border-b border-[#262626]">
        <button onclick="window.physixrHud.closeCardDetail()" class="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 py-0.5 px-1.5 rounded-md hover:bg-dark-700 transition-colors cursor-pointer">
          <i class="fa-solid fa-arrow-left text-[10px]"></i> <span>Vissza</span>
        </button>
        <span class="text-[9px] px-1.5 py-0.2 rounded ${card.categoryColor} border font-mono uppercase font-semibold">
          ${card.categoryName}
        </span>
      </div>

      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-10 h-10 rounded-xl bg-dark-900 border border-dark-border flex items-center justify-center shrink-0 shadow-md">
          <i class="${card.icon} ${card.iconColor} text-lg"></i>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-bold text-white tracking-tight leading-tight">${card.title}</h3>
          <p class="text-[10px] text-zinc-400 font-mono truncate">${card.subtitle}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-1.5 mb-2.5 bg-dark-900/80 p-2 rounded-xl border border-[#262626]">
        <div class="flex flex-col">
          <span class="text-[9px] text-zinc-500 font-medium">Hőmérséklet</span>
          <span class="text-xs font-mono font-bold text-cyan-300">${card.temp}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] text-zinc-500 font-medium">Nyomás</span>
          <span class="text-xs font-mono font-bold text-accent-blue">${card.pressure}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] text-zinc-500 font-medium">Sűrűség</span>
          <span class="text-xs font-mono text-zinc-300">${card.density}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] text-zinc-500 font-medium">${card.extraParamLabel}</span>
          <span class="text-xs font-mono text-amber-300 font-semibold">${card.extraParamVal}</span>
        </div>
      </div>

      <p class="text-[11px] text-zinc-300 leading-relaxed mb-2">${card.desc}</p>
      <div class="bg-dark-900/60 p-2 rounded-lg border border-[#262626] text-[10px] text-zinc-400 leading-snug mb-3 font-mono">
        ${card.micro}
      </div>

      <div class="flex items-center gap-1.5 pt-1 border-t border-[#262626]">
        <button onclick="window.physixrHud.playCardAudio('${card.id}')" class="btn-secondary-dark flex-1 py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white cursor-pointer" title="Hangos magyarázat">
          <i class="fa-solid fa-volume-high text-xs text-accent-blue"></i> <span>Felolvasás</span>
        </button>
        <button onclick="window.physixrHud.applyCardToSim('${card.id}')" class="btn-primary-dark flex-1 py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 font-semibold cursor-pointer" title="Labor beállítása erre a halmazállapotra">
          <i class="fa-solid fa-sliders text-xs"></i> <span>Laborba</span>
        </button>
      </div>
    `;
  }

  closeCardDetail() {
    this.currentOpenedCardId = null;
    const listView = document.getElementById('colListView');
    const detailView = document.getElementById('colDetailView');
    if (listView && detailView) {
      detailView.classList.add('hidden');
      detailView.classList.remove('flex');
      listView.classList.remove('hidden');
    }
  }

  selectCollectionCard(cardId) {
    this.openCardDetail(cardId);
  }

  filterCollection(category) {
    this.activeCollectionFilter = category;
    ['all', 'allapot', 'valtozas', 'fogalom'].forEach(cat => {
      const btn = document.getElementById(`colBtn-${cat}`);
      if (btn) {
        if (cat === category) {
          btn.className = 'flex-1 bg-dark-700 text-white rounded-md py-1 text-[10px] font-medium transition-colors shadow-sm';
        } else {
          btn.className = 'flex-1 text-zinc-400 hover:text-zinc-200 rounded-md py-1 text-[10px] font-medium transition-colors';
        }
      }
    });
    this.renderCollection();
  }

  toggleAllCardsDev() {
    const unlockedCount = this.collectionCards.filter(c => c.status !== 'locked').length;
    if (unlockedCount === this.collectionCards.length) {
      this.collectionCards.forEach(c => { c.status = c.defaultStatus; });
      if (this.currentOpenedCardId) this.closeCardDetail();
      this.renderCollection();
      this.showToast('🔒 Alapértelmezett állapot visszaállítva');
    } else {
      this.collectionCards.forEach(c => { if (c.status === 'locked') c.status = 'unlocked'; });
      this.renderCollection();
      this.showToast('🔓 Minden gyűjtemény kártya feloldva (10 / 10)');
    }
  }

  playCardAudio(cardId) {
    const card = this.collectionCards.find(c => c.id === cardId);
    if (!card) return;
    speak(card.desc);
    if (this.tutor) this.tutor.say(Math.max(4000, card.desc.length * 60));
    this.showToast(`🔊 Hangos magyarázat: ${card.title}`);
  }

  applyCardToSim(cardId) {
    const card = this.collectionCards.find(c => c.id === cardId);
    if (!card) return;

    if (card.tempTarget !== undefined && this.sim) {
      const t = card.tempTarget;
      this.tempHistory.push(t);
      this.tempHistory.shift();
      this.updateTempChart();
    }
    if (card.pressureTarget !== undefined && this.sim) {
      this.sim.pressure = card.pressureTarget;
      this.updatePressure(card.pressureTarget);
      const pSlider = document.getElementById('pressureSlider');
      if (pSlider) pSlider.value = card.pressureTarget * 10;
    }
    if (card.thermalPower !== undefined) {
      this.setThermalPower(card.thermalPower);
    }

    const topState = document.getElementById('topStateDisplay');
    if (topState && card.stateName) {
      topState.innerHTML = `<i class="${card.icon} ${card.iconColor}"></i> ${card.stateName}`;
    }

    this.showToast(`✓ Labor beállítva: ${card.title} (${card.temp}, ${card.pressure})`);
  }

  // ----------------------------------------------------------------------
  // KÜLDETÉS ÉS KVÍZ
  // ----------------------------------------------------------------------
  setMissionTab(tab) {
    this.currentMissionTab = tab;
    const taskView = document.getElementById('missionTaskView');
    const quizView = document.getElementById('missionQuizView');
    const tabTask = document.getElementById('missionTabTask');
    const tabQuiz = document.getElementById('missionTabQuiz');
    const quizBtnIcon = document.getElementById('btnMissionQuizIcon');
    const quizBtnText = document.getElementById('btnMissionQuizText');

    if (tab === 'task') {
      taskView?.classList.remove('hidden');
      quizView?.classList.add('hidden');
      if (tabTask) tabTask.className = 'flex-1 py-1 text-[10px] font-medium rounded-md bg-dark-700 text-white transition-colors flex items-center justify-center gap-1 cursor-pointer';
      if (tabQuiz) tabQuiz.className = 'flex-1 py-1 text-[10px] font-medium rounded-md text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer';
      if (quizBtnIcon) quizBtnIcon.className = 'fa-solid fa-circle-question text-xs';
      if (quizBtnText) quizBtnText.innerText = 'Kvíz';
    } else {
      taskView?.classList.add('hidden');
      quizView?.classList.remove('hidden');
      if (tabTask) tabTask.className = 'flex-1 py-1 text-[10px] font-medium rounded-md text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1 cursor-pointer';
      if (tabQuiz) tabQuiz.className = 'flex-1 py-1 text-[10px] font-medium rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1 cursor-pointer';
      if (quizBtnIcon) quizBtnIcon.className = 'fa-solid fa-book-open text-xs';
      if (quizBtnText) quizBtnText.innerText = 'Feladat';
      this.renderQuizUI();
    }
  }

  toggleMissionTab() {
    this.setMissionTab(this.currentMissionTab === 'task' ? 'quiz' : 'task');
  }

  renderQuizUI() {
    const mission = this.missionList[this.currentMissionIndex];
    if (!mission || !mission.quiz) return;

    const questionEl = document.getElementById('quizQuestionText');
    const scoreEl = document.getElementById('quizScoreText');
    const optionsContainer = document.getElementById('quizOptionsContainer');
    const feedbackBox = document.getElementById('quizFeedbackBox');
    const badgeIndicator = document.getElementById('quizBadgeIndicator');

    if (questionEl) questionEl.innerText = mission.quiz.question;
    if (scoreEl) scoreEl.innerText = `${this.quizScore} / ${this.missionList.length} pont`;

    const state = this.quizAttempts[this.currentMissionIndex] || { solved: false, wrongIndices: [] };

    if (badgeIndicator) {
      if (state.solved) {
        badgeIndicator.className = 'text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono ml-0.5';
        badgeIndicator.innerText = '✓ Kész';
      } else {
        badgeIndicator.className = 'text-[8px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono ml-0.5';
        badgeIndicator.innerText = 'Kérdés';
      }
    }

    if (optionsContainer) {
      const letters = ['A', 'B', 'C'];
      optionsContainer.innerHTML = mission.quiz.options.map((opt, idx) => {
        const isWrong = state.wrongIndices.includes(idx);
        const isCorrect = state.solved && idx === mission.quiz.correctIndex;

        let btnClass = 'w-full text-left p-1.5 rounded-lg border text-[11px] flex items-center gap-2 transition-all ';
        let iconSlot = '';

        if (state.solved) {
          if (isCorrect) {
            btnClass += 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-medium';
            iconSlot = '<i class="fa-solid fa-check text-emerald-400 text-xs ml-auto"></i>';
          } else {
            btnClass += 'bg-dark-900/40 border-[#262626] text-zinc-500 opacity-40 cursor-default';
          }
        } else if (isWrong) {
          btnClass += 'bg-rose-500/15 border-rose-500/40 text-rose-300/80 cursor-not-allowed';
          iconSlot = '<i class="fa-solid fa-xmark text-rose-400 text-xs ml-auto"></i>';
        } else {
          btnClass += 'bg-dark-900/80 border-[#262626] hover:border-amber-500/50 hover:bg-dark-700 text-zinc-300 cursor-pointer';
        }

        const clickHandler = (state.solved || isWrong) ? '' : `onclick="window.physixrHud.answerQuiz(${idx})"`;

        return `
          <button ${clickHandler} class="${btnClass}">
            <span class="w-4 h-4 rounded-full bg-dark-800 border border-[#262626] flex items-center justify-center text-[9px] font-mono shrink-0 font-bold">${letters[idx]}</span>
            <span class="leading-tight">${opt}</span>
            ${iconSlot}
          </button>
        `;
      }).join('');
    }

    if (feedbackBox) {
      if (state.solved) {
        feedbackBox.classList.remove('hidden');
        feedbackBox.className = 'text-[10px] px-2 py-1.5 rounded-lg font-medium flex items-start gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300';
        feedbackBox.innerHTML = `<i class="fa-solid fa-circle-check text-xs mt-0.5 shrink-0"></i> <span><strong>Helyes!</strong> ${mission.quiz.explanation}</span>`;
      } else if (state.wrongIndices.length > 0) {
        feedbackBox.classList.remove('hidden');
        feedbackBox.className = 'text-[10px] px-2 py-1.5 rounded-lg font-medium flex items-start gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse';
        feedbackBox.innerHTML = `<i class="fa-solid fa-lightbulb text-xs text-amber-400 mt-0.5 shrink-0"></i> <span><strong>Tipp / Hint:</strong> ${mission.quiz.hint}</span>`;
      } else {
        feedbackBox.classList.add('hidden');
      }
    }
  }

  answerQuiz(selectedIdx) {
    const mission = this.missionList[this.currentMissionIndex];
    if (!mission || !mission.quiz) return;

    if (!this.quizAttempts[this.currentMissionIndex]) {
      this.quizAttempts[this.currentMissionIndex] = { solved: false, wrongIndices: [] };
    }
    const state = this.quizAttempts[this.currentMissionIndex];
    if (state.solved) return;

    if (selectedIdx === mission.quiz.correctIndex) {
      state.solved = true;
      this.quizScore++;
      this.showToast(`🎯 Helyes válasz! (+1 pont)`);
      if (this.tutor) {
        this.tutor.setPose('happy');
        this.tutor.setCoreMode('pulse');
      }
    } else {
      if (!state.wrongIndices.includes(selectedIdx)) {
        state.wrongIndices.push(selectedIdx);
      }
      this.showToast(`Nem megfelelő. Nézd meg a tippet!`);
      if (this.tutor) this.tutor.setExpression('curious');
    }
    this.updateMissionUI();
  }

  updateMissionUI() {
    const mission = this.missionList[this.currentMissionIndex];
    if (!mission) return;

    const progressBadge = document.getElementById('missionProgressBadge');
    const categoryBadge = document.getElementById('missionCategoryBadge');
    const progressBar = document.getElementById('missionProgressBar');
    const titleEl = document.getElementById('missionTitle');
    const descEl = document.getElementById('missionDesc');
    const tipEl = document.getElementById('missionTip');
    const statusPill = document.getElementById('missionStatusPill');
    const btnPrev = document.getElementById('btnMissionPrev');
    const btnNextText = document.getElementById('btnMissionNextText');
    const btnNextIcon = document.getElementById('btnMissionNextIcon');

    if (progressBadge) progressBadge.innerText = `${this.currentMissionIndex + 1} / ${this.missionList.length}`;
    if (categoryBadge) categoryBadge.innerText = mission.category;
    if (progressBar) progressBar.style.width = `${((this.currentMissionIndex + 1) / this.missionList.length) * 100}%`;
    if (titleEl) titleEl.innerText = mission.title;
    if (descEl) descEl.innerText = mission.desc;
    if (tipEl) tipEl.innerText = mission.tip;

    if (btnPrev) btnPrev.disabled = this.currentMissionIndex === 0;

    const isQuizSolved = this.quizAttempts[this.currentMissionIndex] && this.quizAttempts[this.currentMissionIndex].solved;

    if (btnNextText && btnNextIcon) {
      if (this.currentMissionIndex === this.missionList.length - 1) {
        btnNextText.innerText = 'Újrakezdés';
        btnNextIcon.className = 'fa-solid fa-rotate-right text-[10px]';
        if (statusPill) {
          statusPill.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium flex items-center gap-1';
          statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Befejezve';
        }
      } else {
        btnNextText.innerText = 'Következő';
        btnNextIcon.className = 'fa-solid fa-arrow-right text-[10px]';
        if (statusPill) {
          if (isQuizSolved) {
            statusPill.className = 'text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-medium flex items-center gap-1';
            statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Kvíz kész ✓';
          } else {
            statusPill.className = 'text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0 font-medium flex items-center gap-1';
            statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Folyamatban';
          }
        }
      }
    }

    if (mission.stateId) {
      const targetCard = this.collectionCards.find(c => c.id === mission.stateId);
      if (targetCard) {
        this.collectionCards.forEach(c => { if (c.status === 'active') c.status = 'unlocked'; });
        targetCard.status = 'active';
        this.renderCollection();

        const topState = document.getElementById('topStateDisplay');
        if (topState && targetCard.stateName) {
          topState.innerHTML = `<i class="${targetCard.icon} ${targetCard.iconColor}"></i> ${targetCard.stateName}`;
        }
      }
    }

    this.renderQuizUI();
  }

  nextMission() {
    if (this.currentMissionIndex < this.missionList.length - 1) {
      this.currentMissionIndex++;
      this.updateMissionUI();
      this.showToast(`Küldetés ${this.currentMissionIndex + 1}/10: ${this.missionList[this.currentMissionIndex].title}`);
    } else {
      this.currentMissionIndex = 0;
      this.updateMissionUI();
      this.showToast('Küldetések újraindítva: 1/10');
    }
  }

  prevMission() {
    if (this.currentMissionIndex > 0) {
      this.currentMissionIndex--;
      this.updateMissionUI();
      this.showToast(`Küldetés ${this.currentMissionIndex + 1}/10: ${this.missionList[this.currentMissionIndex].title}`);
    }
  }

  showToast(text) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = text;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2200);
  }

  show() {
    if (this.container) this.container.style.display = 'block';
    this.syncVisibility(!this.game?.introStarted);
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  // Fő szimulációs frissítési ciklus
  update(dt, t) {
    const now = performance.now();
    const timeSec = t !== undefined ? t : (now * 0.001);

    if (this.sim && this.isTempSimRunning) {
      const simT = this.sim.T !== undefined ? this.sim.T : -30.0;
      if (timeSec - (this._lastChartTick || 0) > 0.4) {
        this._lastChartTick = timeSec;
        this.tempHistory.shift();
        this.tempHistory.push(simT);
        this.updateTempChart();

        // Felső státusz kapszula frissítése
        const topTemp = document.getElementById('topTempDisplay');
        if (topTemp) topTemp.innerText = `${simT > 0 ? '+' : ''}${Math.round(simT)} °C`;

        const topState = document.getElementById('topStateDisplay');
        if (topState && this.sim.phase) {
          let icon = 'fa-solid fa-cube text-accent-blue';
          if (this.sim.phase.includes('Víz')) icon = 'fa-solid fa-droplet text-cyan-400';
          else if (this.sim.phase.includes('Gőz')) icon = 'fa-solid fa-smog text-slate-300';
          else if (this.sim.phase.includes('Olvad')) icon = 'fa-solid fa-temperature-arrow-up text-amber-400';
          else if (this.sim.phase.includes('Forr')) icon = 'fa-solid fa-fire-burner text-orange-400';
          topState.innerHTML = `<i class="${icon}"></i> ${this.sim.phase}`;
        }
      }
    }
  }
}
