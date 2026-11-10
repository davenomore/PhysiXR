import * as THREE from 'three';
import { Panel, base, txt, rrect, drawButton, drawSlider, drawOrnament, wrap } from './panels.js';
import { PHASE, T_MIN, T_MAX } from './sim.js';
import { COLLECTION_CARDS, LAB_MISSIONS } from './lab-data.js';
import { TTS_AUDIO } from './speech.js';

export function createHUD({ sim, game, tutor, onSpeak, onOpenCalibrator, onJumpToMission }) {
  const jumpTo = onJumpToMission || (idx => game.jumpToMission(idx));
  const panels = [];
  const fmtP = v => v.toFixed(1).replace('.', ',');

  const stColor = {
    [PHASE.ICE]: '#64d2ff',
    [PHASE.MELT]: '#ffd60a',
    [PHASE.WATER]: '#0a84ff',
    [PHASE.BOIL]: '#ff9f0a',
    [PHASE.STEAM]: '#ff453a'
  };

  // ----------------------------------------------------------------------
  // 1. ÁLLAPOTCÍMKE (Felső Státusz Kapszula & Külön ⚙ Gomb)
  // (Pontosan a spatial_hud_dev.html hud-top-status elemének stílusában)
  // ----------------------------------------------------------------------
  const statePanel = new Panel({
    pw: 470, ph: 76, wm: 2.25, billboard: false,
    draw: (c, p) => {
      // Sötét kapszula forma (#141414, #262626 szegély)
      c.save();
      c.fillStyle = '#141414';
      rrect(c, 0, 0, p.pw - 60, p.ph, p.ph / 2);
      c.fill();

      c.strokeStyle = '#262626';
      c.lineWidth = 1.5;
      rrect(c, 0.75, 0.75, p.pw - 60 - 1.5, p.ph - 1.5, p.ph / 2);
      c.stroke();
      c.restore();

      const st = sim.phase;
      const phColor = stColor[st] || '#38bdf8';

      // Ragyogó fázis-gömb & felirat
      c.save();
      c.shadowColor = phColor;
      c.shadowBlur = 10;
      c.fillStyle = phColor;
      c.beginPath();
      c.arc(32, 38, 9, 0, Math.PI * 2);
      c.fill();
      c.restore();

      txt(c, st, 50, 44, 18, '#ffffff', '700');

      // Elválasztó vonal 1 (#262626)
      c.save();
      c.strokeStyle = '#262626';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(150, 20);
      c.lineTo(150, 56);
      c.stroke();

      // Hőmérséklet (#ffffff)
      txt(c, `${Math.round(sim.T)} °C`, 200, 45, 19, '#ffffff', '700', 'center');

      // Elválasztó vonal 2 (#262626)
      c.beginPath();
      c.moveTo(252, 20);
      c.lineTo(252, 56);
      c.stroke();
      c.restore();

      // Nyomás (#a1a1aa font-mono)
      txt(c, `${fmtP(sim.pressure)} atm`, 326, 45, 17, '#a1a1aa', '600', 'center');

      // ⚙ Beállítások kör-gomb a jobb oldalon
      p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
    }
  });

  statePanel.widgets = [
    {
      id: 'btnOpenSettings', kind: 'btn', x: 422, y: 14, w: 48, h: 48,
      radius: 24,
      label: '⚙',
      size: 20,
      onClick: () => onOpenCalibrator?.()
    }
  ];
  panels.push(statePanel);


  // ----------------------------------------------------------------------
  // 2. HŐSZABÁLYZÁS (Függőleges Csúszkás Hőszabályzó)
  // (Pontosan a spatial_hud_dev.html hud-bottom-thermal elemének elrendezésében:
  // Bal oldalon vertikális fader 🔥/❄️ gombokkal, jobb oldalon az 5 gomb)
  // ----------------------------------------------------------------------
  const heatPanel = new Panel({
    pw: 380, ph: 330, wm: 1.85, billboard: false,
    draw: (c, p) => {
      base(c, p, 'Hőszabályzás');

      // Élő százalék a fejléc jobb szélén
      const pVal = Math.round(sim.power * 100);
      const pStr = pVal === 0 ? '0%' : (pVal > 0 ? `+${pVal}%` : `${pVal}%`);
      const pColor = pVal > 0 ? '#f87171' : (pVal < 0 ? '#38bdf8' : '#a1a1aa');
      txt(c, pStr, 356, 34, 18, pColor, '700', 'right');

      // 1. BAL OSZLOP: Függőleges Fader Csúszka Kapszula
      const bx = 20, by = 58, bw = 68, bh = 254;
      c.save();
      c.fillStyle = '#1e1e1e';
      rrect(c, bx, by, bw, bh, 14);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, bx + 0.5, by + 0.5, bw - 1, bh - 1, 14);
      c.stroke();

      // Fader Track Groove
      const gx = bx + 27, gy = by + 46, gw = 14, gh = 162;
      c.fillStyle = '#141414';
      rrect(c, gx, gy, gw, gh, 7);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, gx + 0.5, gy + 0.5, gw - 1, gh - 1, 7);
      c.stroke();

      // Középvonal (0 szint)
      const midY = gy + gh / 2;
      c.strokeStyle = '#71717a';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(gx - 4, midY);
      c.lineTo(gx + gw + 4, midY);
      c.stroke();

      // Színes kitöltés a faderben
      const frac = (sim.power + 1) / 2; // 0..1 (0: -100%, 0.5: 0%, 1: +100%)
      const thumbY = gy + gh * (1 - frac);

      c.save();
      rrect(c, gx, gy, gw, gh, 7);
      c.clip();
      if (sim.power > 0) {
        c.fillStyle = '#ef4444';
        c.fillRect(gx, thumbY, gw, midY - thumbY);
      } else if (sim.power < 0) {
        c.fillStyle = '#0d6efd';
        c.fillRect(gx, midY, gw, thumbY - midY);
      }
      c.restore();

      // Fehér csúszka gomb (knob)
      c.save();
      c.shadowColor = 'rgba(0, 0, 0, 0.8)';
      c.shadowBlur = 8;
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(gx + gw / 2, thumbY, 12, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = sim.power > 0.05 ? '#ef4444' : (sim.power < -0.05 ? '#38bdf8' : '#71717a');
      c.lineWidth = 2;
      c.stroke();
      c.restore();

      c.restore();

      // 2. JOBB OSZLOP: 5 GOMB egymás alatt
      p.widgets.filter(w => w.kind === 'btn').forEach(w => {
        drawButton(c, p, w);
        // Ha van felirat jobb oldalán százalék, kiírjuk
        if (w.rightLabel) {
          const textColor = w.selected?.() ? '#ffffff' : '#71717a';
          txt(c, w.rightLabel, w.x + w.w - 14, w.y + w.h / 2 + 4, 12, textColor, '600', 'right');
        }
      });
    }
  });

  heatPanel.widgets = [
    // Fader vertikális csúszka
    {
      id: 'sliderPower', kind: 'v', x: 30, y: 94, w: 48, h: 182,
      onDrag: f => {
        sim.power = (f * 2) - 1;
        heatPanel.dirty = true;
      }
    },
    // Fader végállás gombok: Láng felül, Hópehely alul
    {
      id: 'btnTopFlame', kind: 'btn', x: 26, y: 64, w: 56, h: 32,
      radius: 8,
      label: '🔥',
      size: 16,
      onClick: () => { sim.power = 1.0; heatPanel.dirty = true; }
    },
    {
      id: 'btnBottomSnow', kind: 'btn', x: 26, y: 274, w: 56, h: 32,
      radius: 8,
      label: '❄️',
      size: 16,
      onClick: () => { sim.power = -1.0; heatPanel.dirty = true; }
    },

    // 5 db Jobb oldali gomb
    {
      id: 'btnMaxHeat', kind: 'btn', x: 98, y: 58, w: 262, h: 44,
      radius: 12,
      label: '🔥 Max fűtés',
      rightLabel: '+100%',
      align: 'left',
      padX: 14,
      size: 13.5,
      selected: () => Math.abs(sim.power - 1.0) < 0.05,
      onClick: () => { sim.power = 1.0; heatPanel.dirty = true; }
    },
    {
      id: 'btnLowHeat', kind: 'btn', x: 98, y: 110, w: 262, h: 44,
      radius: 12,
      label: '🔥 Kis fűtés',
      rightLabel: '+40%',
      align: 'left',
      padX: 14,
      size: 13.5,
      selected: () => Math.abs(sim.power - 0.4) < 0.05,
      onClick: () => { sim.power = 0.4; heatPanel.dirty = true; }
    },
    {
      id: 'btnOff', kind: 'btn', x: 98, y: 163, w: 262, h: 44,
      radius: 12,
      label: '⚪ KI',
      rightLabel: '0%',
      align: 'left',
      padX: 14,
      size: 14,
      selected: () => Math.abs(sim.power) < 0.05,
      onClick: () => { sim.power = 0.0; heatPanel.dirty = true; }
    },
    {
      id: 'btnLowCool', kind: 'btn', x: 98, y: 216, w: 262, h: 44,
      radius: 12,
      label: '❄️ Kis hűtés',
      rightLabel: '-40%',
      align: 'left',
      padX: 14,
      size: 13.5,
      selected: () => Math.abs(sim.power - (-0.4)) < 0.05,
      onClick: () => { sim.power = -0.4; heatPanel.dirty = true; }
    },
    {
      id: 'btnMaxCool', kind: 'btn', x: 98, y: 268, w: 262, h: 44,
      radius: 12,
      label: '❄️ Max hűtés',
      rightLabel: '-100%',
      align: 'left',
      padX: 14,
      size: 13.5,
      selected: () => Math.abs(sim.power - (-1.0)) < 0.05,
      onClick: () => { sim.power = -1.0; heatPanel.dirty = true; }
    }
  ];
  panels.push(heatPanel);


  // ----------------------------------------------------------------------
  // 3. JOBB ALSÓ: NYOMÁS ÉS MÉRÉS (Diagram + Kompakt Nyomásmérő Manométer)
  // (Pontosan a spatial_hud_dev.html hud-right-pressure elemének elrendezésében)
  // ----------------------------------------------------------------------
  const hist = Array(35).fill(-30.0);
  let isTempPaused = false;

  const pressPanel = new Panel({
    pw: 420, ph: 430, wm: 2.10, billboard: false,
    draw: (c, p) => {
      base(c, p, 'Nyomás & Mérés');

      // 1. KÁRTYA: T(t) GÖRBE
      const c1x = 20, c1y = 56, c1w = 380, c1h = 196;
      c.save();
      c.fillStyle = '#0e0e0e';
      rrect(c, c1x, c1y, c1w, c1h, 14);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, c1x + 0.5, c1y + 0.5, c1w - 1, c1h - 1, 14);
      c.stroke();

      // Card 1 Fejléc
      txt(c, '📈 T(t) Görbe', c1x + 14, c1y + 24, 13, '#e4e4e7', '600');

      // Élő hőmérséklet badge
      const tBadgeX = c1x + c1w - 170, tBadgeY = c1y + 8, tBadgeW = 86, tBadgeH = 26;
      c.fillStyle = '#18181b';
      rrect(c, tBadgeX, tBadgeY, tBadgeW, tBadgeH, 6);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, tBadgeX + 0.5, tBadgeY + 0.5, tBadgeW - 1, tBadgeH - 1, 6);
      c.stroke();
      const tFormatted = `${sim.T > 0 ? '+' : ''}${sim.T.toFixed(1)} °C`;
      txt(c, tFormatted, tBadgeX + tBadgeW / 2, tBadgeY + 18, 12.5, '#38bdf8', '700', 'center');

      // SVG / Grafikon doboz
      const gx = c1x + 12, gy = c1y + 42, gw = c1w - 24, gh = 124;
      c.fillStyle = '#050505';
      rrect(c, gx, gy, gw, gh, 8);
      c.fill();
      c.strokeStyle = '#1e1e1e';
      c.lineWidth = 1;
      rrect(c, gx + 0.5, gy + 0.5, gw - 1, gh - 1, 8);
      c.stroke();

      // Referencia vonalak: 100°C Forrás (narancs), 0°C Olvadás (cián)
      const getYForT = deg => gy + gh - ((deg - T_MIN) / (T_MAX - T_MIN)) * gh;
      const y100 = getYForT(100);
      const y0 = getYForT(0);

      // 100°C vonal
      c.save();
      c.strokeStyle = '#f97316';
      c.lineWidth = 0.9;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(gx + 6, y100);
      c.lineTo(gx + gw - 6, y100);
      c.stroke();
      txt(c, '100°C Forrás', gx + 10, y100 - 4, 10, '#f97316', '600');

      // 0°C vonal
      c.strokeStyle = '#38bdf8';
      c.beginPath();
      c.moveTo(gx + 6, y0);
      c.lineTo(gx + gw - 6, y0);
      c.stroke();
      txt(c, '0°C Olvadás', gx + 10, y0 - 4, 10, '#38bdf8', '600');
      c.restore();

      // T(t) Érkező görbe vonal
      if (hist.length > 1) {
        c.save();
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.4;
        c.shadowColor = '#38bdf8';
        c.shadowBlur = 6;
        c.beginPath();
        hist.forEach((pt, i) => {
          const px = gx + 10 + (i / (hist.length - 1)) * (gw - 20);
          const py = Math.max(gy + 4, Math.min(gy + gh - 4, getYForT(pt)));
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        });
        c.stroke();

        // Fej pont (dot) a legutolsó értéknél
        const lastX = gx + gw - 10;
        const lastY = Math.max(gy + 4, Math.min(gy + gh - 4, getYForT(hist[hist.length - 1])));
        c.fillStyle = '#38bdf8';
        c.beginPath();
        c.arc(lastX, lastY, 4, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.stroke();
        c.restore();
      }

      // Időcímkék alul: -60s, -30s, Most (t)
      txt(c, '-60 s', gx + 8, c1y + c1h - 10, 9.5, '#71717a', '600');
      txt(c, '-30 s', gx + gw / 2, c1y + c1h - 10, 9.5, '#71717a', '600', 'center');
      txt(c, 'Most (t)', gx + gw - 8, c1y + c1h - 10, 9.5, '#a1a1aa', '600', 'right');
      c.restore();


      // 2. KÁRTYA: KOMPAKT NYOMÁSMÉRŐ ÉS SZABÁLYZÓ
      const c2x = 20, c2y = 264, c2w = 380, c2h = 146;
      c.save();
      c.fillStyle = '#0e0e0e';
      rrect(c, c2x, c2y, c2w, c2h, 14);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, c2x + 0.5, c2y + 0.5, c2w - 1, c2h - 1, 14);
      c.stroke();

      // Mini Köríves Manométer Gyűrű
      const mx = c2x + 48, my = c2y + 73, mr = 36;
      c.save();
      // Háttér gyűrű
      c.strokeStyle = '#1e1e1e';
      c.lineWidth = 8;
      c.beginPath();
      c.arc(mx, my, mr, 0, Math.PI * 2);
      c.stroke();

      // Kék érték ív
      const pFrac = Math.max(0, Math.min(1, sim.pressure / 2.0));
      c.strokeStyle = '#0d6efd';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(mx, my, mr, -Math.PI / 2, -Math.PI / 2 + pFrac * Math.PI * 2);
      c.stroke();

      // Érték és mértékegység szöveg a gyűrű közepén
      txt(c, sim.pressure.toFixed(1), mx, my + 4, 18, '#ffffff', '700', 'center');
      txt(c, 'ATM', mx, my + 17, 9, '#71717a', '700', 'center');
      c.restore();

      // Nyomás címke és állapot leírás
      txt(c, 'Nyomás', c2x + 110, c2y + 36, 12, '#a1a1aa', '500');
      let statusStr = `${sim.pressure.toFixed(1)} atm (Normál)`;
      let statusCol = '#38bdf8';
      if (sim.pressure <= 0.2) {
        statusStr = `${sim.pressure.toFixed(1)} atm (Vákuum)`;
        statusCol = '#c084fc';
      } else if (sim.pressure > 1.2) {
        statusStr = `${sim.pressure.toFixed(1)} atm (Túlnyomás)`;
        statusCol = '#fbbf24';
      }
      txt(c, statusStr, c2x + c2w - 16, c2y + 36, 12, statusCol, '700', 'right');

      // Vízszintes Csúszka kirajzolása
      const sw = p.widgets.find(w => w.id === 'sliderPress');
      if (sw) {
        drawSlider(c, p, sw, pFrac, '#0d6efd');
      }

      // Skála jelölések: 0.0, 1.0, 2.0 atm
      txt(c, '0.0', c2x + 110, c2y + 118, 10, '#71717a', '600');
      txt(c, '1.0', c2x + 230, c2y + 118, 10, '#71717a', '600', 'center');
      txt(c, '2.0 atm', c2x + c2w - 16, c2y + 118, 10, '#71717a', '600', 'right');

      c.restore();

      // Gombok rajzolása (⏸, 🔄)
      p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
    }
  });

  pressPanel.widgets = [
    // Diagram Szünet / Folytatás gomb
    {
      id: 'btnTempPause', kind: 'btn', x: 334, y: 64, w: 28, h: 26,
      radius: 6,
      label: () => isTempPaused ? '▶' : '⏸',
      size: 11,
      onClick: () => {
        isTempPaused = !isTempPaused;
        pressPanel.dirty = true;
      }
    },
    // Diagram törlés gomb
    {
      id: 'btnTempReset', kind: 'btn', x: 366, y: 64, w: 26, h: 26,
      radius: 6,
      label: '🔄',
      size: 11,
      onClick: () => {
        const last = hist[hist.length - 1];
        hist.fill(last);
        pressPanel.dirty = true;
      }
    },
    // Nyomás csúszka
    {
      id: 'sliderPress', kind: 'h', x: 130, y: 326, w: 254, h: 26,
      onDrag: f => {
        sim.pressure = 0.0 + f * 2.0;
        pressPanel.dirty = true;
      }
    }
  ];
  panels.push(pressPanel);


  // ----------------------------------------------------------------------
  // 4. JOBB FELSŐ: KÜLDETÉS PANEL (Interaktív & Kvíz)
  // (Pontosan a spatial_hud_dev.html hud-right-mission elemének elrendezésében)
  // ----------------------------------------------------------------------
  let missionTab = 'task'; // 'task' vagy 'quiz'
  let quizFeedback = null;
  let quizScore = 0;
  let solvedMissions = new Set();
  let missionHighlightUntil = 0;

  function highlightMission(durationMs = 9000) {
    missionHighlightUntil = performance.now() + durationMs;
    missionPanel.dirty = true;
  }

  const missionPanel = new Panel({
    pw: 420, ph: 460, wm: 2.10, billboard: false,
    draw: (c, p) => {
      base(c, p, 'Küldetés');

      const missionIdx = Math.min(Math.max(0, game.missionNo || 0), LAB_MISSIONS.length - 1);
      const m = LAB_MISSIONS[missionIdx] || LAB_MISSIONS[0];

      // Kategória jelvény a fejlécben
      c.save();
      const catText = m.category || 'ALAPOK';
      c.fillStyle = 'rgba(13, 110, 253, 0.15)';
      rrect(c, 112, 16, 88, 22, 6);
      c.fill();
      c.strokeStyle = 'rgba(13, 110, 253, 0.35)';
      c.lineWidth = 1;
      rrect(c, 112.5, 16.5, 87, 21, 6);
      c.stroke();
      txt(c, catText, 156, 31, 10.5, '#60a5fa', '700', 'center');

      // Számláló jelvény: pl. 1 / 10
      c.fillStyle = '#0a0a0a';
      rrect(c, p.pw - 82, 16, 62, 22, 11);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, p.pw - 81.5, 16.5, 61, 21, 11);
      c.stroke();
      txt(c, `${missionIdx + 1} / 10`, p.pw - 51, 31, 11, '#d4d4d8', '600', 'center');

      // Mini folyamatjelző csík
      const barY = 50, barW = p.pw - 40;
      c.fillStyle = '#0a0a0a';
      rrect(c, 20, barY, barW, 4, 2);
      c.fill();
      const progressW = Math.max(12, ((missionIdx + 1) / 10) * barW);
      c.fillStyle = '#0d6efd';
      rrect(c, 20, barY, progressW, 4, 2);
      c.fill();

      // Fül választó kapszula konténer háttér
      c.fillStyle = '#0a0a0a';
      rrect(c, 20, 62, barW, 36, 10);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 20.5, 62.5, barW - 1, 35, 10);
      c.stroke();
      c.restore();

      // NÉZET 1: FELADAT TARTALOM
      if (missionTab === 'task') {
        const cardX = 20, cardY = 106, cardW = p.pw - 40, cardH = 274;
        c.save();
        c.fillStyle = '#0e0e0e';
        rrect(c, cardX, cardY, cardW, cardH, 14);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1, 14);
        c.stroke();

        // Küldetés Cím & Állapot pill
        txt(c, m.title, cardX + 14, cardY + 28, 14.5, '#ffffff', '700');

        const isDone = solvedMissions.has(missionIdx);
        const pillText = isDone ? '✓ Kész' : '● Folyamatban';
        const pillCol = isDone ? '#4ade80' : '#60a5fa';
        const pillBg = isDone ? 'rgba(74, 222, 128, 0.15)' : 'rgba(96, 165, 250, 0.15)';
        c.fillStyle = pillBg;
        rrect(c, cardX + cardW - 110, cardY + 12, 96, 22, 11);
        c.fill();
        txt(c, pillText, cardX + cardW - 62, cardY + 27, 10.5, pillCol, '700', 'center');

        // Leírás szöveg
        const descY = wrap(c, m.desc, cardX + 14, cardY + 58, cardW - 28, 20, 13, '#a1a1aa', '500');

        // Tipp Kártya
        const tipBoxY = Math.max(descY + 12, cardY + 148);
        const tipBoxH = cardY + cardH - tipBoxY - 14;
        c.fillStyle = '#141414';
        rrect(c, cardX + 10, tipBoxY, cardW - 20, tipBoxH, 10);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, cardX + 10.5, tipBoxY + 0.5, cardW - 21, tipBoxH - 1, 10);
        c.stroke();

        txt(c, '💡 Tipp:', cardX + 22, tipBoxY + 22, 12, '#38bdf8', '700');
        wrap(c, m.tip, cardX + 22, tipBoxY + 44, cardW - 44, 18, 11.5, '#e4e4e7', '500');
        c.restore();

      } else {
        // NÉZET 2: KVÍZ TARTALOM
        const cardX = 20, cardY = 106, cardW = p.pw - 40, cardH = 274;
        c.save();
        c.fillStyle = '#0e0e0e';
        rrect(c, cardX, cardY, cardW, cardH, 14);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1, 14);
        c.stroke();

        // Kvíz Fejléc: Kvízkérdés + Pontszám
        txt(c, '💡 Kvízkérdés', cardX + 14, cardY + 26, 13, '#fbbf24', '700');
        txt(c, `${quizScore} / 10 pont`, cardX + cardW - 14, cardY + 26, 11, '#a1a1aa', '600', 'right');

        // Kérdés szöveg
        wrap(c, m.quiz.question, cardX + 14, cardY + 52, cardW - 28, 20, 13, '#ffffff', '600');

        // Visszajelzés doboz ha válaszolt
        if (quizFeedback) {
          const fbY = cardY + cardH - 42;
          c.fillStyle = quizFeedback.correct ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)';
          rrect(c, cardX + 12, fbY, cardW - 24, 30, 8);
          c.fill();
          c.strokeStyle = quizFeedback.correct ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)';
          c.lineWidth = 1;
          rrect(c, cardX + 12.5, fbY + 0.5, cardW - 25, 29, 8);
          c.stroke();

          const fbColor = quizFeedback.correct ? '#4ade80' : '#f87171';
          txt(c, quizFeedback.text, cardX + cardW / 2, fbY + 19, 11, fbColor, '700', 'center');
        }
        c.restore();
      }

      // Kiemelés animáció ha nemrég aktiválódott
      const now = performance.now();
      if (now < missionHighlightUntil) {
        const pulse = (Math.sin(now * 0.007) + 1) * 0.5;
        c.save();
        c.strokeStyle = `rgba(13, 110, 253, ${0.55 + pulse * 0.45})`;
        c.lineWidth = 3.5 + pulse * 2.0;
        c.shadowColor = '#0d6efd';
        c.shadowBlur = 16 + pulse * 10;
        rrect(c, 2, 2, p.pw - 4, p.ph - 4, 24);
        c.stroke();
        c.restore();
      }

      // Gombok kirajzolása
      p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
    }
  });

  function setupMissionWidgets() {
    const missionIdx = Math.min(Math.max(0, game.missionNo || 0), LAB_MISSIONS.length - 1);
    const m = LAB_MISSIONS[missionIdx] || LAB_MISSIONS[0];

    // Fül választó gombok
    const tabTask = {
      id: 'btnTabTask', kind: 'btn', x: 22, y: 64, w: 186, h: 32,
      radius: 8,
      label: '📖 Feladat',
      selected: () => missionTab === 'task',
      onClick: () => {
        missionTab = 'task';
        setupMissionWidgets();
        missionPanel.dirty = true;
      }
    };

    const tabQuiz = {
      id: 'btnTabQuiz', kind: 'btn', x: 212, y: 64, w: 186, h: 32,
      radius: 8,
      label: '❓ Kvíz (Kérdés)',
      selected: () => missionTab === 'quiz',
      onClick: () => {
        missionTab = 'quiz';
        setupMissionWidgets();
        missionPanel.dirty = true;
      }
    };

    // Alsó navigációs gombok
    const btnPrev = {
      id: 'btnMissionPrev', kind: 'btn', x: 20, y: 396, w: 56, h: 44,
      radius: 12,
      label: '◀',
      size: 14,
      disabled: () => (game.missionNo || 0) <= 0,
      onClick: () => {
        const prev = Math.max(0, (game.missionNo || 0) - 1);
        jumpTo(prev);
        setupMissionWidgets();
        missionPanel.dirty = true;
      }
    };

    const btnQuizToggle = {
      id: 'btnMissionQuizToggle', kind: 'btn', x: 84, y: 396, w: 120, h: 44,
      radius: 12,
      label: () => missionTab === 'quiz' ? '📖 Feladat' : '❓ Kvíz',
      size: 13,
      onClick: () => {
        missionTab = missionTab === 'quiz' ? 'task' : 'quiz';
        setupMissionWidgets();
        missionPanel.dirty = true;
      }
    };

    const btnNext = {
      id: 'btnMissionNext', kind: 'btn', x: 212, y: 396, w: 188, h: 44,
      radius: 12,
      label: 'Következő ▶',
      primary: true,
      size: 13.5,
      onClick: () => {
        const next = Math.min((game.missionNo || 0) + 1, LAB_MISSIONS.length - 1);
        jumpTo(next);
        setupMissionWidgets();
        missionPanel.dirty = true;
      }
    };

    const navWidgets = [tabTask, tabQuiz, btnPrev, btnQuizToggle, btnNext];

    if (missionTab === 'quiz') {
      const letters = ['A', 'B', 'C'];
      const optWidgets = m.quiz.options.map((opt, i) => ({
        id: `quizOpt_${i}`, kind: 'btn', x: 32, y: 206 + i * 44, w: 356, h: 38,
        radius: 8,
        align: 'left',
        padX: 14,
        label: `${letters[i]})  ${opt}`,
        size: 12,
        onClick: () => {
          const isCorrect = i === m.quiz.correctIndex;
          if (isCorrect) {
            quizScore = Math.min(10, quizScore + 1);
            solvedMissions.add(missionIdx);
            quizFeedback = { correct: true, text: `✓ Helyes! ${m.quiz.explanation}` };
            onSpeak?.('Helyes válasz! ' + m.quiz.explanation);
          } else {
            quizFeedback = { correct: false, text: `Nem pontos. Tipp: ${m.quiz.hint}` };
            onSpeak?.('Nem pontos. ' + m.quiz.hint);
          }
          missionPanel.dirty = true;
        }
      }));
      missionPanel.widgets = [...navWidgets, ...optWidgets];
    } else {
      missionPanel.widgets = navWidgets;
    }
  }

  setupMissionWidgets();
  panels.push(missionPanel);


  // ----------------------------------------------------------------------
  // 5. BAL PANEL: GYŰJTEMÉNY (Lista & Kártya Részletező Nézet)
  // (Pontosan a spatial_hud_dev.html hud-left-collection elemének elrendezésében:
  // 4 kategória fül, 10 db kártya, részletező nézet mikroszerkezettel)
  // ----------------------------------------------------------------------
  let activeColFilter = 'all'; // 'all', 'allapot', 'valtozas', 'fogalom'
  let activeCardId = null;
  let devUnlocked = true;

  const collectionPanel = new Panel({
    pw: 420, ph: 560, wm: 2.10, billboard: false,
    draw: (c, p) => {
      base(c, p, 'Gyűjtemény');

      // Fejléc elemek: DEV badge, 🔓 gomb, 10 / 10 számláló
      c.save();
      c.fillStyle = 'rgba(245, 158, 11, 0.15)';
      rrect(c, 134, 16, 42, 22, 6);
      c.fill();
      c.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      c.lineWidth = 1;
      rrect(c, 134.5, 16.5, 41, 21, 6);
      c.stroke();
      txt(c, 'DEV', 155, 31, 10.5, '#fbbf24', '700', 'center');

      // Számláló badge
      c.fillStyle = '#0a0a0a';
      rrect(c, p.pw - 82, 16, 62, 22, 11);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, p.pw - 81.5, 16.5, 61, 21, 11);
      c.stroke();
      txt(c, '10 / 10', p.pw - 51, 31, 11, '#d4d4d8', '600', 'center');
      c.restore();

      // NÉZET 1: LISTA NÉZET
      if (!activeCardId) {
        // Szegmentált kategória szűrő konténer háttér
        c.save();
        c.fillStyle = '#0a0a0a';
        rrect(c, 20, 52, p.pw - 40, 32, 8);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, 20.5, 52.5, p.pw - 41, 31, 8);
        c.stroke();
        c.restore();

        // Kártyák kirajzolása (gombok rajzolják ki a listát)
        p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));

      } else {
        // NÉZET 2: KÁRTYA RÉSZLETEZŐ NÉZET
        const card = COLLECTION_CARDS.find(k => k.id === activeCardId) || COLLECTION_CARDS[0];

        c.save();
        // Cím és kategória badge
        txt(c, `${card.icon}  ${card.title}`, 22, 112, 17, '#ffffff', '700');
        txt(c, card.subtitle, 22, 132, 12, '#a1a1aa', '500');

        // Kategória jelvény a jobb szélen
        c.fillStyle = '#1e1e1e';
        rrect(c, p.pw - 130, 96, 110, 24, 12);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, p.pw - 129.5, 96.5, 109, 23, 12);
        c.stroke();
        txt(c, card.categoryName, p.pw - 75, 112, 11, '#38bdf8', '700', 'center');

        // 1. Szekció: Mikroszerkezet
        const s1y = 144, s1h = 96;
        c.fillStyle = '#0e0e0e';
        rrect(c, 20, s1y, p.pw - 40, s1h, 12);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, 20.5, s1y + 0.5, p.pw - 41, s1h - 1, 12);
        c.stroke();

        txt(c, '🔬 Mikroszerkezet & Rács', 34, s1y + 24, 13, '#38bdf8', '700');
        wrap(c, card.micro, 34, s1y + 46, p.pw - 68, 18, 12, '#e4e4e7', '500');

        // 2. Szekció: Energiacsere & Termodinamika
        const s2y = 248, s2h = 104;
        c.fillStyle = '#0e0e0e';
        rrect(c, 20, s2y, p.pw - 40, s2h, 12);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, 20.5, s2y + 0.5, p.pw - 41, s2h - 1, 12);
        c.stroke();

        txt(c, '⚡ Termodinamikai Adatok', 34, s2y + 24, 13, '#f59e0b', '700');
        txt(c, `Hőmérséklet: ${card.temp}   |   Nyomás: ${card.pressure}`, 34, s2y + 48, 12, '#ffffff', '600');
        txt(c, `${card.extraParamLabel}: ${card.extraParamVal}   |   Sűrűség: ${card.density}`, 34, s2y + 70, 12, '#d4d4d8', '500');

        // 3. Szekció: Hétköznapi Jelenség
        const s3y = 360, s3h = 114;
        c.fillStyle = '#0e0e0e';
        rrect(c, 20, s3y, p.pw - 40, s3h, 12);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, 20.5, s3y + 0.5, p.pw - 41, s3h - 1, 12);
        c.stroke();

        txt(c, '🌍 Jelenség a Természetben', 34, s3y + 24, 13, '#4ade80', '700');
        wrap(c, card.desc, 34, s3y + 48, p.pw - 68, 18, 12, '#e4e4e7', '500');

        c.restore();

        p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
      }
    }
  });

  function setupCollectionWidgets() {
    if (activeCardId) {
      const card = COLLECTION_CARDS.find(k => k.id === activeCardId) || COLLECTION_CARDS[0];
      collectionPanel.widgets = [
        // Vissza a listához gomb
        {
          id: 'btnBackToList', kind: 'btn', x: 20, y: 52, w: 160, h: 32,
          radius: 8,
          label: '◀ Vissza a listához',
          size: 12,
          onClick: () => {
            activeCardId = null;
            setupCollectionWidgets();
            collectionPanel.dirty = true;
          }
        },
        // Kísérlet beállítása a laborban akció gomb
        {
          id: 'btnApplyCardToLab', kind: 'btn', x: 20, y: 486, w: 380, h: 44,
          radius: 12,
          label: '🔬 Kísérlet beállítása a laborban',
          primary: true,
          size: 13.5,
          onClick: () => {
            sim.T = card.tempTarget;
            sim.pressure = card.pressureTarget;
            sim.power = card.thermalPower / 100;
            onSpeak?.(`Labor beállítva: ${card.title} (${card.temp}, ${card.pressure})`);
            collectionPanel.dirty = true;
            heatPanel.dirty = true;
            pressPanel.dirty = true;
            statePanel.dirty = true;
          }
        }
      ];
      return;
    }

    // LISTA NÉZET:
    // 4 Szűrő Fül
    const tabFilters = [
      { id: 'all', label: 'Összes' },
      { id: 'allapot', label: 'Állapot' },
      { id: 'valtozas', label: 'Változás' },
      { id: 'fogalom', label: 'Fogalom' }
    ];

    const filterWidgets = tabFilters.map((tf, i) => ({
      id: `btnFilter_${tf.id}`, kind: 'btn', x: 22 + i * 94, y: 54, w: 90, h: 28,
      radius: 6,
      label: tf.label,
      size: 11.5,
      selected: () => activeColFilter === tf.id,
      onClick: () => {
        activeColFilter = tf.id;
        setupCollectionWidgets();
        collectionPanel.dirty = true;
      }
    }));

    // Kártyák gombjai
    const filteredCards = COLLECTION_CARDS.filter(c => {
      if (activeColFilter === 'all') return true;
      return c.category === activeColFilter;
    });

    const cardWidgets = filteredCards.map((card, i) => ({
      id: `card_${card.id}`, kind: 'btn', x: 20, y: 92 + i * 44, w: 380, h: 40,
      radius: 10,
      align: 'left',
      padX: 14,
      label: `${card.icon}   ${card.title}   —   ${card.subtitle}`,
      size: 12,
      onClick: () => {
        activeCardId = card.id;
        setupCollectionWidgets();
        collectionPanel.dirty = true;
        onSpeak?.(`${card.title}. ${card.desc}`);
      }
    }));

    // Unlock DEV gomb a fejlécben
    const unlockBtn = {
      id: 'btnDevUnlockCards', kind: 'btn', x: 304, y: 16, w: 28, h: 22,
      radius: 6,
      label: '🔓',
      size: 12,
      onClick: () => {
        devUnlocked = !devUnlocked;
        collectionPanel.dirty = true;
      }
    };

    collectionPanel.widgets = [unlockBtn, ...filterWidgets, ...cardWidgets];
  }

  setupCollectionWidgets();
  panels.push(collectionPanel);


  // ----------------------------------------------------------------------
  // FŐ FRISSÍTÉSI CIKLUS
  // ----------------------------------------------------------------------
  let lastHistTick = 0;
  let lastRedrawTick = 0;

  function update(timeNow) {
    if (!isTempPaused && timeNow - lastHistTick > 350) {
      lastHistTick = timeNow;
      hist.shift();
      hist.push(sim.T);
      pressPanel.dirty = true;
    }

    if (timeNow - lastRedrawTick > 80) {
      lastRedrawTick = timeNow;
      statePanel.dirty = true;
      heatPanel.dirty = true;
    }

    panels.forEach(p => {
      if (p.visible && p.dirty) p.redraw();
    });
  }

  return {
    panels,
    statePanel,
    heatPanel,
    pressPanel,
    missionPanel,
    collectionPanel,
    highlightMission,
    closeCardModal: () => {
      activeCardId = null;
      setupCollectionWidgets();
      collectionPanel.dirty = true;
    },
    openCard: (id, shouldSpeak = true) => {
      activeCardId = id;
      setupCollectionWidgets();
      collectionPanel.dirty = true;
      const card = COLLECTION_CARDS.find(k => k.id === id);
      if (card && shouldSpeak) {
        onSpeak?.(`${card.title}. ${card.desc}`);
      }
    },
    update
  };
}
