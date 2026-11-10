import * as THREE from 'three';
import { Panel, base, txt, rrect, drawButton, drawSlider } from './panels.js';

const DEV_TASKS = [
  { idx: 0, label: '1. Szilárd jég (−30°C)' },
  { idx: 1, label: '2. Jégkristály 3D' },
  { idx: 2, label: '3. Kis láng (25%)' },
  { idx: 3, label: '4. Felmelegedés' },
  { idx: 4, label: '5. Olvadáspont (0°C)' },
  { idx: 5, label: '6. Olvadáshő (Plató)' },
  { idx: 6, label: '7. Folyékony víz (0°C)' },
  { idx: 7, label: '8. Víz melegítése' },
  { idx: 8, label: '9. Forráspont & Forráshő' },
  { idx: 9, label: '10. Légnemű gőz' }
];

// Apple stílusú lebegő beállító/kalibrációs panel (részecske modell váltóval, folyamatos forgató- és méretező csúszkákkal, és Dev Mód feladatválasztóval)
export class Calibrator {
  constructor({ targetGroup, hudGroup, sandbox, game, onResetProgress, onReanchor, onSpeak, onTransformChange, onHudScaleChange, onJumpToMission }) {
    this.targetGroup = targetGroup;
    this.hudGroup = hudGroup;
    this.sandbox = sandbox;
    this.game = game;
    this.onResetProgress = onResetProgress;
    this.onReanchor = onReanchor;
    this.onSpeak = onSpeak;
    this.onTransformChange = onTransformChange;
    this.onHudScaleChange = onHudScaleChange;
    this.onJumpToMission = onJumpToMission;
    this.activeTab = 'calib'; // 'calib' | 'dev'

    // Labor méretarány határok
    this.minScale = 0.08;
    this.maxScale = 0.50;
    this.defaultScale = 0.15;

    // HUD méretarány
    this.minHudScale = 0.6;
    this.maxHudScale = 1.6;
    this.defaultHudScale = 1.0;
    this.hudScale = 1.0;
    try {
      const saved = parseFloat(localStorage.getItem('fazister.hudScale'));
      if (saved && saved >= this.minHudScale && saved <= this.maxHudScale) {
        this.hudScale = saved;
      }
    } catch {
      // privát mód
    }

    // Apple VisionOS stílusú lebegő ablak (kompakt, kényelmes táblagép méret)
    this.panel = new Panel({
      pw: 520, ph: 570, wm: 0.42, ss: 3.0, billboard: false,
      draw: (c, p) => {
        base(c, p, 'Beállítások & Dev Mód');

        if (this.activeTab === 'calib') {
          // 1. Részecske modell választó
          txt(c, 'Részecske modell:', 28, 118, 16, '#ffffff', '600');

          // 2. Laboratórium elforgatása (folyamatos, tetszőleges szög 0° .. 360°)
          const curRot = this.targetGroup.rotation.y;
          const deg = Math.round((((curRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
          txt(c, `🔄 Elforgatás: ${deg}°`, 28, 192, 16, '#64d2ff', '600');

          c.fillStyle = 'rgba(10, 132, 255, 0.16)';
          rrect(c, 250, 176, 116, 22, 11);
          c.strokeStyle = 'rgba(10, 132, 255, 0.45)';
          c.lineWidth = 1;
          c.stroke();
          txt(c, '🕹️ Jobb kar: ↔', 260, 191, 12, '#64d2ff', '600');

          const sRot = p.widgets.find(w => w.id === 'sliderCalibRot');
          if (sRot) {
            const frac = (((curRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
            drawSlider(c, p, sRot, frac, '#0a84ff');
          }

          // 3. Laboratórium mérete (folyamatos, tetszőleges méretezés 50% .. 250%)
          const curScale = this.targetGroup.scale.x;
          const labPct = Math.round((curScale / this.defaultScale) * 100);
          txt(c, `🔍 Labor méret: ${labPct}% (${curScale.toFixed(2)}×)`, 28, 260, 16, '#30d158', '600');

          c.fillStyle = 'rgba(48, 209, 88, 0.16)';
          rrect(c, 250, 244, 116, 22, 11);
          c.strokeStyle = 'rgba(48, 209, 88, 0.45)';
          c.lineWidth = 1;
          c.stroke();
          txt(c, '🕹️ Jobb kar: ↕', 260, 259, 12, '#30d158', '600');

          const sScale = p.widgets.find(w => w.id === 'sliderCalibScale');
          if (sScale) {
            const frac = (curScale - this.minScale) / (this.maxScale - this.minScale);
            drawSlider(c, p, sScale, frac, '#30d158');
          }

          // 4. HUD felület mérete (folyamatos skálázás)
          const hudPct = Math.round(this.hudScale * 100);
          txt(c, `📐 HUD panelek mérete: ${hudPct}%`, 28, 328, 16, '#ff9f0a', '600');

          c.fillStyle = 'rgba(255, 159, 10, 0.16)';
          rrect(c, 250, 312, 116, 22, 11);
          c.strokeStyle = 'rgba(255, 159, 10, 0.45)';
          c.lineWidth = 1;
          c.stroke();
          txt(c, '🕹️ Bal kar: ↕', 262, 327, 12, '#ff9f0a', '600');

          const sHud = p.widgets.find(w => w.id === 'sliderCalibHud');
          if (sHud) {
            const frac = (this.hudScale - this.minHudScale) / (this.maxHudScale - this.minHudScale);
            drawSlider(c, p, sHud, frac, '#ff9f0a');
          }

          // 5. Asztalsík és magasság
          const hCm = Math.round(this.targetGroup.position.y * 100);
          txt(c, `Magasság: ${hCm >= 0 ? '+' : ''}${hCm} cm`, 28, 396, 15, 'rgba(255, 255, 255, 0.85)', '500');

          // 6. Minden küldetés teljesítve: gratulációs szalag
          if (this.game?.allMissionsDone()) {
            c.fillStyle = 'rgba(48, 209, 88, 0.12)';
            rrect(c, 28, 444, 464, 38, 12);
            c.fill();
            c.strokeStyle = 'rgba(48, 209, 88, 0.35)';
            c.lineWidth = 1;
            rrect(c, 28, 444, 464, 38, 12);
            c.stroke();

            txt(c, '🏆 Minden küldetést sikeresen teljesítettél!', 260, 468, 14, '#30d158', '600', 'center');
          }
        } else {
          // Dev mód fül: feladatválasztó és fázisugró felület
          txt(c, '🛠️ Ugrás a feladatok és kísérleti fázisok között', 28, 120, 16, '#64d2ff', '600');
          const curM = this.game?.missionNo ?? 0;
          const isDone = !!this.game?.missionsDone();
          const title = isDone ? 'Tudáspróba / Kvíz kész' : (this.game?.mission?.title || 'Küldetés');
          txt(c, `Aktuális: ${isDone ? '🏆' : (curM + 1) + '.'} ${title}`, 28, 144, 14, '#ffffff', '500');
        }

        p.widgets.filter(w => w.kind === 'btn' && !w.hidden?.()).forEach(w => drawButton(c, p, w));
      }
    });

    this.panel.visible = false;
    this.setupWidgets();

    // Kalibrációs HUD és a HUD csoport skálázása a mentett méretre
    if (this.hudScale !== 1.0) {
      this.hudGroup?.scale.setScalar(this.hudScale);
      this.panel.mesh.scale.setScalar(this.hudScale);
    }
  }

  show() {
    this.setupWidgets();
    this.panel.visible = true;
    this.panel.dirty = true;
  }

  hide() {
    this.panel.visible = false;
  }

  toggle() {
    this.panel.visible = !this.panel.visible;
    if (this.panel.visible) {
      this.setupWidgets();
      this.panel.dirty = true;
    }
  }

  setupWidgets() {
    const isDone = !!this.game?.allMissionsDone();

    const baseWidgets = [
      // Bezárás gomb: pontosan egyetlen kerek bezáró pill a jobb felső sarokban!
      {
        id: 'btnCloseCalib', kind: 'btn', x: 456, y: 16, w: 38, h: 36,
        isClose: true,
        label: '✕',
        onClick: () => this.hide()
      },
      // Tab fülek
      {
        id: 'btnTabCalib', kind: 'btn', x: 28, y: 64, w: 226, h: 36,
        radius: 12,
        label: '⚙️ Kalibráció & Nézet',
        primary: () => this.activeTab === 'calib',
        size: 13.5,
        onClick: () => {
          this.activeTab = 'calib';
          this.setupWidgets();
          this.panel.dirty = true;
        }
      },
      {
        id: 'btnTabDev', kind: 'btn', x: 266, y: 64, w: 226, h: 36,
        radius: 12,
        label: '🛠️ Feladatok & Dev Mód',
        primary: () => this.activeTab === 'dev',
        size: 13.5,
        onClick: () => {
          this.activeTab = 'dev';
          this.setupWidgets();
          this.panel.dirty = true;
        }
      }
    ];

    if (this.activeTab === 'calib') {
      this.panel.widgets = [
        ...baseWidgets,

        // 1. Részecske modell választó gombok
        {
          id: 'btnModelSphere', kind: 'btn', x: 28, y: 132, w: 226, h: 40,
          label: '🔵 Egyszerű gömb',
          size: 14.5,
          primary: () => this.sandbox?.particleModel === 'sphere',
          onClick: () => {
            this.sandbox?.setParticleModel('sphere');
            this.panel.dirty = true;
            this.onSpeak?.('Átváltva egyszerű gömb részecskemodellre.');
          }
        },
        {
          id: 'btnModelMolecule', kind: 'btn', x: 266, y: 132, w: 226, h: 40,
          label: '🧪 Valódi H₂O molekula',
          size: 14.5,
          primary: () => this.sandbox?.particleModel === 'molecule',
          onClick: () => {
            this.sandbox?.setParticleModel('molecule');
            this.panel.dirty = true;
            this.onSpeak?.('Átváltva valódi H₂O vízmolekula modellre.');
          }
        },

        // 2. Folyamatos Elforgatás csúszka és gyorsgomb
        {
          id: 'sliderCalibRot', kind: 'h', x: 28, y: 204, w: 346, h: 24,
          onDrag: f => {
            this.targetGroup.rotation.y = f * Math.PI * 2;
            this.panel.dirty = true;
            this.onTransformChange?.();
          }
        },
        {
          id: 'btnCalibRotReset', kind: 'btn', x: 388, y: 198, w: 104, h: 36,
          label: '0° Szembe', size: 13,
          onClick: () => {
            this.targetGroup.rotation.y = 0;
            this.panel.dirty = true;
            this.onTransformChange?.();
            this.onSpeak?.('Labor szembefordítva.');
          }
        },

        // 3. Folyamatos Labor méret csúszka és gyorsgomb
        {
          id: 'sliderCalibScale', kind: 'h', x: 28, y: 272, w: 346, h: 24,
          onDrag: f => {
            const s = this.minScale + f * (this.maxScale - this.minScale);
            this.setLabScale(s);
          }
        },
        {
          id: 'btnCalibScaleReset', kind: 'btn', x: 388, y: 266, w: 104, h: 36,
          label: 'Alapméret', size: 13,
          onClick: () => {
            this.setLabScale(this.defaultScale);
            this.onSpeak?.('Alapértelmezett asztali méret visszaállítva.');
          }
        },

        // 4. Folyamatos HUD méret csúszka és gyorsgomb
        {
          id: 'sliderCalibHud', kind: 'h', x: 28, y: 340, w: 346, h: 24,
          onDrag: f => {
            const s = this.minHudScale + f * (this.maxHudScale - this.minHudScale);
            this.setHudScale(s);
          }
        },
        {
          id: 'btnCalibHudReset', kind: 'btn', x: 388, y: 334, w: 104, h: 36,
          label: 'Alap HUD', size: 13,
          onClick: () => {
            this.setHudScale(1.0);
          }
        },

        // 5. Asztalsík finomhangolók és Újrahelyezés
        {
          id: 'btnHeightDown', kind: 'btn', x: 28, y: 414, w: 96, h: 36,
          label: '⬇ Süllyeszt', size: 13,
          onClick: () => this.adjustHeight(-0.02)
        },
        {
          id: 'btnHeightUp', kind: 'btn', x: 132, y: 414, w: 96, h: 36,
          label: '⬆ Emel', size: 13,
          onClick: () => this.adjustHeight(+0.02)
        },
        {
          id: 'btnReanchor', kind: 'btn', x: 238, y: 414, w: 254, h: 36,
          label: '📍 Új asztalsík kijelölése',
          primary: true,
          size: 14,
          onClick: () => {
            this.onReanchor?.();
            this.onSpeak?.('Nézz az asztalra, és kattints a labor új helyére!');
          }
        },

        // Alsó gombsor
        ...(isDone ? [
          {
            id: 'btnResetMissions', kind: 'btn', x: 28, y: 494, w: 314, h: 44,
            label: '🔄 Küldetések újrakezdése',
            primary: true,
            size: 14.5,
            onClick: () => {
              this.onResetProgress?.();
            }
          },
          {
            id: 'btnDone', kind: 'btn', x: 352, y: 494, w: 140, h: 44,
            label: 'Kész',
            size: 15,
            onClick: () => this.hide()
          }
        ] : [
          {
            id: 'btnDone', kind: 'btn', x: 28, y: 494, w: 464, h: 44,
            label: 'Kész',
            size: 16,
            onClick: () => this.hide()
          }
        ])
      ];
    } else {
      // 🛠️ Dev Mód fül: 10 feladatgomb + Kvíz + Előző/Következő
      const taskButtons = DEV_TASKS.map(t => {
        const col = t.idx % 2;
        const row = Math.floor(t.idx / 2);
        return {
          id: `btnDevTask_${t.idx}`, kind: 'btn',
          x: col === 0 ? 28 : 266,
          y: 168 + row * 50,
          w: 226, h: 42,
          radius: 10,
          label: t.label,
          size: 13.5,
          primary: () => !this.game?.missionsDone() && this.game?.missionNo === t.idx,
          onClick: () => {
            this.onJumpToMission?.(t.idx);
            this.setupWidgets();
            this.panel.dirty = true;
          }
        };
      });

      this.panel.widgets = [
        ...baseWidgets,
        ...taskButtons,

        // 11. Tudáspróba / Kvíz és Mind kész gombok
        {
          id: 'btnDevQuiz', kind: 'btn', x: 28, y: 422, w: 226, h: 44,
          radius: 12,
          label: '🏆 11. Tudáspróba (Kvíz)',
          primary: () => this.game?.missionsDone(),
          size: 14,
          onClick: () => {
            this.onJumpToMission?.(10);
            this.setupWidgets();
            this.panel.dirty = true;
          }
        },
        {
          id: 'btnDevCompleteAll', kind: 'btn', x: 266, y: 422, w: 226, h: 44,
          radius: 12,
          label: '⚡ Minden feladat kész',
          size: 14,
          onClick: () => {
            this.onJumpToMission?.(10);
            this.setupWidgets();
            this.panel.dirty = true;
          }
        },

        // Alsó navigációs sáv
        {
          id: 'btnCalibDevPrev', kind: 'btn', x: 28, y: 486, w: 104, h: 44,
          radius: 12,
          label: '◀ Előző', size: 14,
          disabled: () => (this.game?.missionNo || 0) <= 0,
          onClick: () => {
            const prev = Math.max(0, (this.game?.missionNo || 0) - 1);
            this.onJumpToMission?.(prev);
            this.setupWidgets();
            this.panel.dirty = true;
          }
        },
        {
          id: 'btnCalibResetMissions', kind: 'btn', x: 140, y: 486, w: 232, h: 44,
          radius: 12,
          label: '🔄 Küldetések újraindítása',
          size: 13.5,
          onClick: () => {
            this.onResetProgress?.();
            this.setupWidgets();
            this.panel.dirty = true;
          }
        },
        {
          id: 'btnCalibDevNext', kind: 'btn', x: 380, y: 486, w: 112, h: 44,
          radius: 12,
          label: 'Következő ▶', size: 14,
          disabled: () => this.game?.missionsDone(),
          onClick: () => {
            const next = Math.min(10, (this.game?.missionNo || 0) + 1);
            this.onJumpToMission?.(next);
            this.setupWidgets();
            this.panel.dirty = true;
          }
        }
      ];
    }
  }

  setLabScale(s) {
    this.targetGroup.scale.setScalar(s);
    this.panel.dirty = true;
    this.onTransformChange?.();
  }

  setHudScale(s) {
    this.hudScale = s;
    if (this.hudGroup) {
      this.hudGroup.scale.setScalar(s);
    }
    if (this.panel?.mesh) {
      this.panel.mesh.scale.setScalar(s);
    }
    this.onHudScaleChange?.(s);
    try {
      localStorage.setItem('fazister.hudScale', s.toString());
    } catch {
      // privát mód
    }
    this.panel.dirty = true;
  }

  adjustHeight(delta) {
    this.targetGroup.position.y += delta;
    this.panel.dirty = true;
    this.onTransformChange?.();
  }

  adjustRotation(angle) {
    let r = this.targetGroup.rotation.y + angle;
    const twoPi = Math.PI * 2;
    r = ((r % twoPi) + twoPi) % twoPi;
    this.targetGroup.rotation.y = r;
    this.panel.dirty = true;
    this.onTransformChange?.();
  }

  update() {
    if (this.panel.visible && this.panel.dirty) {
      this.panel.redraw();
    }
  }
}
