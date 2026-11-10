import { BLOCKS, CARDS, CARD_CATEGORIES } from './content.js';

const KEY = 'fazister.v1';

// Játéklogika: feladatok, kártyák, begyűjtött infógömbök, tesztek, mentés.
export class Game {
  constructor(sim) {
    this.sim = sim;
    this.flags = {};
    this.listeners = { card: [], mission: [], change: [], hotspotCollected: [] };
    const saved = this.load();
    this.cards = new Set(saved.cards || []);
    this.passed = new Set(saved.passed || []);
    this.best = saved.best || {};
    this.blockIdx = Math.min(saved.blockIdx ?? 0, BLOCKS.length - 1);
    // Mindig tiszta lappal indulunk (0. feladat, szilárd állapot és jégkristály), hogy a teljes didaktikai folyamat végigfusson!
    this.collectedHotspots = new Set();
    this.missionIdx = {};
    this.introStarted = false; // Megnyitáskor mindig makroszkopikus jégkocka nézettel és bemutatkozással indulunk
    this.devMode = saved.devMode !== undefined ? saved.devMode : true; // Dev mód alapértelmezetten aktív a kényelmes teszteléshez

    if (!this.isUnlocked(this.blockIdx)) this.blockIdx = 0;
    this.resetTracking();
  }

  on(evt, fn) { this.listeners[evt].push(fn); }
  emit(evt, ...a) { this.listeners[evt].forEach(f => f(...a)); }

  startIntro() {
    this.introStarted = true;
    this.collectedHotspots.clear();
    this.missionIdx = {};
    this.sim.reset();
    this.resetTracking();
    this.save();
    this.emit('mission', this.mission, { silent: true });
    this.emit('change');
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        cards: [...this.cards],
        passed: [...this.passed],
        missionIdx: this.missionIdx,
        best: this.best,
        blockIdx: this.blockIdx,
        collectedHotspots: [...this.collectedHotspots],
        introStarted: this.introStarted,
        devMode: this.devMode
      }));
    } catch {
      // privát mód
    }
  }

  resetProgress() {
    this.cards.clear();
    this.passed.clear();
    this.missionIdx = {};
    this.best = {};
    this.blockIdx = 0;
    this.collectedHotspots.clear();
    this.introStarted = false;
    this.resetTracking();
    this.save();
    this.emit('change');
  }

  resetTracking() {
    this.time = {};
    this.visited = new Set([this.sim.phase]);
  }

  get block() { return BLOCKS[this.blockIdx]; }
  get missionNo() { return this.missionIdx[this.block.id] || 0; }
  get mission() { return this.block.missions[this.missionNo] || null; }
  missionsDone(i = this.blockIdx) { return (this.missionIdx[BLOCKS[i].id] || 0) >= BLOCKS[i].missions.length; }
  allMissionsDone() { return BLOCKS.every((b, i) => this.missionsDone(i)); }
  isUnlocked(i) { return i === 0 || this.passed.has(BLOCKS[i - 1].id); }

  restartMissions() {
    this.cards.clear();
    this.passed.clear();
    this.missionIdx = {};
    this.best = {};
    this.blockIdx = 0;
    this.collectedHotspots.clear();
    this.sim.reset();
    this.resetTracking();
    this.save();
    this.emit('mission', this.mission);
    this.emit('change');
  }

  setBlock(i) {
    if (!this.isUnlocked(i)) return false;
    this.blockIdx = i;
    this.resetTracking();
    this.save();
    this.emit('mission', this.mission);
    this.emit('change');
    return true;
  }

  setDevMode(val) {
    this.devMode = !!val;
    this.save();
    this.emit('change');
  }

  toggleDevMode() {
    this.setDevMode(!this.devMode);
  }

  jumpToMission(targetIdx, blockIndex = this.blockIdx) {
    const b = BLOCKS[blockIndex];
    if (!b) return false;
    const numMissions = b.missions.length;
    const idx = Math.max(0, Math.min(targetIdx, numMissions));

    this.introStarted = true;
    this.blockIdx = blockIndex;
    this.missionIdx[b.id] = idx;
    this.resetTracking();

    const { a, b: bTh, c, d } = this.sim.thresholds;

    if (idx === 0) {
      // 1. feladat: Szilárd halmazállapot (Jég) (−30 °C)
      this.sim.power = 0;
      this.sim.reset();
      this.cards.clear();
      this.collectedHotspots.clear();
    } else if (idx === 1) {
      // 2. feladat: A jég kristályszerkezete
      this.sim.power = 0;
      this.sim.reset();
      this.cards = new Set(['szilard']);
      this.collectedHotspots = new Set(['racs']);
    } else if (idx === 2) {
      // 3. feladat: Fűtés bekapcsolása (Kis láng 25%)
      this.sim.power = 0;
      this.sim.reset();
      this.cards = new Set(['szilard', 'kristalyszerkezet']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet']);
    } else if (idx === 3) {
      // 4. feladat: A jég felmelegedése (−8 °C -> 0 °C)
      this.sim.power = 0.25;
      this.sim.h = 2.1 * (-8 - (-30)); // T = -8 °C
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet']);
    } else if (idx === 4) {
      // 5. feladat: Olvadáspont (0 °C stabil jég)
      this.sim.power = 0;
      this.sim.h = a; // stabil 0 °C-os szilárd jég, épp az olvadásponton
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet']);
    } else if (idx === 5) {
      // 6. feladat: Olvadás és Olvadáshő (Plató)
      this.sim.power = 0.50;
      this.sim.h = a + (bTh - a) * 0.45; // olvadási plató 45%
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont']);
    } else if (idx === 6) {
      // 7. feladat: Folyékony halmazállapot (0 °C-os stabil víz)
      this.sim.power = 0;
      this.sim.h = bTh; // tiszta 0 °C-os stabil víz
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont', 'latens_ho', 'olvadasho']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont']);
    } else if (idx === 7) {
      // 8. feladat: Víz melegítése a forráspontig (100 °C felé)
      this.sim.power = 1.0;
      this.sim.h = bTh + (c - bTh) * 0.70; // ~70 °C-os meleg víz
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont', 'latens_ho', 'olvadasho', 'viz_melegites']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont', 'viz_melegites']);
    } else if (idx === 8) {
      // 9. feladat: Forráspont és Forráshő (100 °C Plató)
      this.sim.power = 1.0;
      this.sim.h = c + (d - c) * 0.40; // 100 °C-os forrási plató 40%
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont', 'latens_ho', 'olvadasho', 'viz_melegites', 'forraspont']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont', 'viz_melegites']);
    } else if (idx === 9) {
      // 10. feladat: Légnemű halmazállapot (100 °C-os stabil vízgőz)
      this.sim.power = 0;
      this.sim.h = d; // tiszta 100 °C-os stabil vízgőz
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont', 'latens_ho', 'olvadasho', 'viz_melegites', 'forraspont', 'forrasho']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont', 'viz_melegites']);
    } else {
      // 11. Minden küldetés kész / Tudáspróba (Kvíz)
      this.sim.power = 0;
      this.sim.h = d;
      this.sim.derive();
      this.cards = new Set(['szilard', 'kristalyszerkezet', 'olvadaspont', 'latens_ho', 'olvadasho', 'viz_melegites', 'forraspont', 'forrasho', 'goz']);
      this.collectedHotspots = new Set(['racs', 'kristalyszerkezet', 'olvadaspont', 'viz_melegites', 'goz']);
    }

    this.save();
    this.emit('mission', this.mission, { silent: true });
    this.emit('change');
    return true;
  }

  nextMission() {
    const cur = this.missionNo;
    const max = this.block.missions.length;
    if (cur < max) {
      return this.jumpToMission(cur + 1);
    }
    return false;
  }

  prevMission() {
    const cur = this.missionNo;
    if (cur > 0) {
      return this.jumpToMission(cur - 1);
    }
    return false;
  }

  completeCurrentMission() {
    return this.nextMission();
  }

  unlockCard(id, opts) {
    if (!id || this.cards.has(id)) return false;
    this.cards.add(id);
    this.save();
    this.emit('card', id, opts);
    this.emit('change');
    return true;
  }

  collectHotspot(hotspotId, cardId, opts) {
    if (this.collectedHotspots.has(hotspotId)) return false;
    this.collectedHotspots.add(hotspotId);
    if (cardId) {
      this.unlockCard(cardId, opts);
    }
    this.save();
    this.emit('hotspotCollected', hotspotId);
    this.emit('change');
    return true;
  }

  passQuiz(i, score) {
    const b = BLOCKS[i];
    this.best[b.id] = Math.max(this.best[b.id] || 0, score);
    const ok = score >= 2;
    if (ok) {
      this.passed.add(b.id);
      this.unlockCard(b.badge);
    }
    this.save();
    this.emit('change');
    return ok;
  }

  update(dt, opts) {
    if (!this.introStarted) return; // A kísérlet elindítása előtt soha nem léphet előre a küldetés!

    const ph = this.sim.phase;
    this.time[ph] = (this.time[ph] || 0) + dt;
    this.visited.add(ph);

    // Kártyafelfedezés forráskor
    if (ph === 'Forrás' || this.sim.T >= 99.8) {
      this.unlockCard('forraspont', { silent: true });
      this.unlockCard('forrasho', { silent: true });
    }

    const m = this.mission;
    if (m && m.test(this)) {
      const prevMissionNo = this.missionNo;
      this.missionIdx[this.block.id] = prevMissionNo + 1;
      m.cards.forEach(id => this.unlockCard(id, { silent: true }));
      this.resetTracking();

      // 0. Amikor a jég felmelegszik és eléri a 0 °C-ot (Mission 3 -> 4):
      // Leállítjuk a fűtést magától, hogy pontosan 0 °C-os szilárd jég maradjon az olvadáspont bemutatásához!
      if (prevMissionNo === 3) {
        this.sim.power = 0;
        const { a } = this.sim.thresholds;
        this.sim.h = a;
        this.sim.derive();
      }

      // 1. Amikor az olvadás végére érünk és folyékony víz lett (Mission 5 -> 6):
      // Leállítjuk a fűtést, hogy pontosan 0 °C-os stabil folyékony víz maradjon a bemutatáshoz!
      if (prevMissionNo === 5 && (this.sim.phase === 'Víz' || this.sim.h >= this.sim.thresholds.b)) {
        this.sim.power = 0;
        const { b } = this.sim.thresholds;
        this.sim.h = b;
        this.sim.derive();
      }

      // 2. Amikor a víz felmelegszik és eléri a 100 °C-ot (Mission 7 -> 8):
      // Leállítjuk a fűtést magától, hogy pontosan 100 °C-os stabil folyékony víz maradjon a forráspontnál!
      if (prevMissionNo === 7) {
        this.sim.power = 0;
        const { c } = this.sim.thresholds;
        this.sim.h = c;
        this.sim.derive();
      }

      // 3. Amikor a forrás végére érünk és légnemű gőz lett (Mission 8 -> 9):
      // Leállítjuk a fűtést, hogy pontosan 100 °C-os stabil gőz maradjon a bemutatáshoz!
      if (prevMissionNo === 8 && (this.sim.phase === 'Gőz' || this.sim.h >= this.sim.thresholds.d)) {
        this.sim.power = 0;
        const { d } = this.sim.thresholds;
        this.sim.h = d;
        this.sim.derive();
      }

      this.save();
      this.emit('mission', this.mission, opts);
      this.emit('change');
    }
  }

  get cardIds() { return Object.keys(CARDS); }
}
