import * as THREE from 'three';
import { Panel, base, txt, rrect, drawButton, drawSlider } from './panels.js';

export function updateCalibSampleScale(workGroup, calibrator, samplePanel) {
  if (samplePanel?.mesh) {
    samplePanel.mesh.scale.setScalar(calibrator?.hudScale || 1.0);
    samplePanel.dirty = true;
  }
}

export function positionIntroPanel(introPanel, samplePanel, workGroup, camera, scene, calibrator) {
  if (!introPanel?.mesh) return;
  const labPos = new THREE.Vector3().setFromMatrixPosition(workGroup.matrixWorld);
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);

  const dir = new THREE.Vector3().subVectors(camPos, labPos);
  dir.y = 0;
  const totalDist = dir.length();
  if (totalDist < 0.001) dir.set(0, 0, 1);
  dir.normalize();

  const currentScale = workGroup.scale.x;

  // A 3D üvegkocka 2x2x2 helyi méretű (fél kiterjedése 1.0 * currentScale)
  // A paneleket szigorúan a kockán KÍVÜL, a két szélre helyezzük el, így a kocka és a labor
  // középen teljesen szabadon, zavartalanul látható marad!
  const sideOffset = Math.max(0.60, currentScale * 2.5 + 0.16);

  // Mélységi eltolás: a kocka elülső síkja előtt, sohasem a kocka belsejében
  const labOffset = Math.max(0.20, currentScale * 1.35);

  // Függőleges magasság: a kocka vizuális középpontjához igazítva
  const panelHeight = Math.max(0.35, currentScale * 1.95);

  const centerPos = new THREE.Vector3().copy(labPos).addScaledVector(dir, labOffset);
  centerPos.y = labPos.y + panelHeight;

  const rightVec = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();

  // 1. Kezdő panel (introPanel) teljesen a BAL szélen, a kockán kívül, a felhasználó felé fordulva
  const introPos = new THREE.Vector3().copy(centerPos).addScaledVector(rightVec, -sideOffset);
  introPanel.mesh.position.copy(introPos);
  introPanel.mesh.lookAt(camPos.x, introPos.y, camPos.z);
  introPanel.dirty = true;

  // 2. Minta HUD panel (samplePanel) teljesen a JOBB szélen, a kockán és a roboton kívül, a felhasználó felé fordulva
  if (samplePanel?.mesh) {
    if (samplePanel.mesh.parent !== scene) {
      scene.add(samplePanel.mesh);
    }
    const samplePos = new THREE.Vector3().copy(centerPos).addScaledVector(rightVec, sideOffset);
    samplePanel.mesh.position.copy(samplePos);
    samplePanel.mesh.lookAt(camPos.x, samplePos.y, camPos.z);
    samplePanel.mesh.scale.setScalar(calibrator?.hudScale || 1.0);
    samplePanel.dirty = true;
    samplePanel.redraw();
  }
}

export function positionCalibratorPanel(calibrator, workGroup, camera) {
  if (!calibrator?.panel?.mesh) return;
  const labPos = new THREE.Vector3().setFromMatrixPosition(workGroup.matrixWorld);
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);

  const dir = new THREE.Vector3().subVectors(camPos, labPos);
  dir.y = 0;
  const totalDist = dir.length();
  if (totalDist < 0.001) dir.set(0, 0, 1);
  dir.normalize();

  const currentScale = workGroup.scale.x;
  // A kocka előtt elhelyezve, sohasem a kocka belsejében
  const labOffset = Math.max(0.40, currentScale * 1.85 + 0.12);
  const panelHeight = Math.max(0.35, currentScale * 1.95);

  calibrator.panel.mesh.position.copy(labPos).addScaledVector(dir, labOffset);
  calibrator.panel.mesh.position.y = labPos.y + panelHeight;
  calibrator.panel.mesh.lookAt(camPos.x, calibrator.panel.mesh.position.y, camPos.z);
  calibrator.panel.dirty = true;
}

export function createSamplePanel({ onSpeak }) {
  const samplePanel = new Panel({
    pw: 460, ph: 460, wm: 0.38, ss: 3.0, billboard: false,
    draw: (c, p) => {
      base(c, p, 'HUD Méret Minta', 18, { radius: 24 });

      // Alcím
      txt(c, 'Olvashatósági minta a méret beállításához', 22, 68, 12.5, '#38bdf8', '600');

      // Leírás
      txt(c, 'Ez a minta segít ellenőrizni a szövegek élességét és arányait.', 22, 98, 12, 'rgba(255, 255, 255, 0.70)', '400');
      txt(c, 'A bal oldali csúszkával addig állítsd a HUD méretét, amíg a', 22, 118, 12, 'rgba(255, 255, 255, 0.70)', '400');
      txt(c, 'szemüvegedben minden felirat kényelmesen olvashatóvá nem válik!', 22, 138, 12, 'rgba(255, 255, 255, 0.70)', '400');

      // Apró betűs minta doboz (#1e1e1e)
      c.save();
      c.fillStyle = '#1e1e1e';
      rrect(c, 22, 168, 416, 84, 14);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 22.5, 168.5, 415, 83, 14);
      c.stroke();

      // Kis nagyító ikon doboz
      c.fillStyle = '#0a0a0a';
      rrect(c, 34, 188, 38, 38, 10);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 34.5, 188.5, 37, 37, 10);
      c.stroke();
      txt(c, '🔍', 44, 213, 16, '#38bdf8', '400');

      txt(c, 'Apró betűs minta:', 84, 196, 11, 'rgba(255, 255, 255, 0.60)', '500');
      txt(c, 'Hőmérséklet: -30 °C  |  Nyomás: 1,0 atm', 84, 218, 12, '#ffffff', '600');
      txt(c, 'Látens hő: 334 kJ/kg', 84, 238, 12, '#facc15', '600');
      c.restore();

      // Gombok kirajzolása
      p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
    }
  });

  samplePanel.widgets = [
    {
      id: 'btnSample1', kind: 'btn', x: 22, y: 396, w: 200, h: 46,
      radius: 12,
      primary: true,
      label: 'Minta gomb',
      size: 13.5,
      onClick: () => onSpeak?.('Minta gomb megnyomva!')
    },
    {
      id: 'btnSample2', kind: 'btn', x: 238, y: 396, w: 200, h: 46,
      radius: 12,
      label: '🔥 Felületpróba',
      size: 13.5,
      onClick: () => onSpeak?.('Felületpróba aktív!')
    }
  ];

  return samplePanel;
}

export function createIntroPanel({
  workGroup,
  calibrator,
  renderer,
  getSamplePanel,
  onReanchor,
  onStartLab,
  onSpeak,
  DESKTOP_SCALE = 0.24,
  AR_DEFAULT_SCALE = 0.15
}) {
  const triggerScaleUpdate = () => {
    const sp = getSamplePanel?.();
    updateCalibSampleScale(workGroup, calibrator, sp);
  };

  const introPanel = new Panel({
    pw: 380, ph: 460, wm: 0.33, ss: 3.0, billboard: false,
    draw: (c, p) => {
      base(c, p, 'Kezdő beállítás & Indítás', 18, { radius: 24 });

      // 1. Doboz: Elforgatás (#1e1e1e)
      c.save();
      c.fillStyle = '#1e1e1e';
      rrect(c, 16, 62, 348, 64, 12);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 16.5, 62.5, 347, 63, 12);
      c.stroke();
      c.restore();

      const curRot = workGroup.rotation.y;
      const deg = Math.round((((curRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * (180 / Math.PI));
      txt(c, `🔄 Elforgatás: ${deg}°`, 26, 83, 12.5, '#38bdf8', '600');

      const sRot = p.widgets.find(w => w.id === 'sliderIntroRot');
      if (sRot) {
        const frac = (((curRot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
        drawSlider(c, p, sRot, frac, '#38bdf8');
      }

      // 2. Doboz: Asztali méret (#1e1e1e)
      c.save();
      c.fillStyle = '#1e1e1e';
      rrect(c, 16, 134, 348, 64, 12);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 16.5, 134.5, 347, 63, 12);
      c.stroke();
      c.restore();

      const curScale = workGroup.scale.x;
      const scalePct = Math.round((curScale / AR_DEFAULT_SCALE) * 100);
      txt(c, `🔍 Asztali méret: ${scalePct}%`, 26, 155, 12.5, '#4ade80', '600');

      const sScale = p.widgets.find(w => w.id === 'sliderIntroScale');
      if (sScale) {
        const minS = calibrator?.minScale ?? 0.08;
        const maxS = calibrator?.maxScale ?? 0.50;
        const frac = (curScale - minS) / (maxS - minS);
        drawSlider(c, p, sScale, frac, '#4ade80');
      }

      // 3. Doboz: HUD méret (#1e1e1e)
      c.save();
      c.fillStyle = '#1e1e1e';
      rrect(c, 16, 206, 348, 64, 12);
      c.fill();
      c.strokeStyle = '#262626';
      c.lineWidth = 1;
      rrect(c, 16.5, 206.5, 347, 63, 12);
      c.stroke();
      c.restore();

      const hudPct = Math.round(calibrator.hudScale * 100);
      txt(c, `📏 HUD méret: ${hudPct}%`, 26, 227, 12.5, '#facc15', '600');

      const sHud = p.widgets.find(w => w.id === 'sliderIntroHud');
      if (sHud) {
        const frac = (calibrator.hudScale - calibrator.minHudScale) / (calibrator.maxHudScale - calibrator.minHudScale);
        drawSlider(c, p, sHud, frac, '#facc15');
      }

      // 4. Kontroller Mikro-Kártyák (3 oszlop, #0a0a0a háttér, #262626 szegély)
      const boxW = 110, boxH = 46, boxY = 282;
      const microBoxes = [
        { x: 16, tag: 'Jobb kar ↔', sub: 'Forgatás', color: '#38bdf8' },
        { x: 135, tag: 'Jobb kar ↕', sub: 'Asztal méret', color: '#4ade80' },
        { x: 254, tag: 'Bal kar ↕', sub: 'HUD méret', color: '#facc15' }
      ];

      microBoxes.forEach(b => {
        c.save();
        c.fillStyle = '#0a0a0a';
        rrect(c, b.x, boxY, boxW, boxH, 10);
        c.fill();
        c.strokeStyle = '#262626';
        c.lineWidth = 1;
        rrect(c, b.x + 0.5, boxY + 0.5, boxW - 1, boxH - 1, 10);
        c.stroke();

        txt(c, b.tag, b.x + boxW / 2, boxY + 18, 10, b.color, '700', 'center');
        txt(c, b.sub, b.x + boxW / 2, boxY + 34, 11, '#e4e4e7', '500', 'center');
        c.restore();
      });

      p.widgets.filter(w => w.kind === 'btn').forEach(w => drawButton(c, p, w));
    }
  });

  introPanel.widgets = [
    // 1. Elforgatás csúszka & gomb
    {
      id: 'sliderIntroRot', kind: 'h', x: 26, y: 96, w: 328, h: 22,
      onDrag: f => {
        workGroup.rotation.y = f * Math.PI * 2;
        introPanel.dirty = true;
        if (calibrator?.panel) calibrator.panel.dirty = true;
      }
    },
    {
      id: 'btnIntroRotReset', kind: 'btn', x: 276, y: 68, w: 80, h: 22,
      radius: 8,
      label: '0° Szembe', size: 10,
      onClick: () => {
        workGroup.rotation.y = 0;
        introPanel.dirty = true;
        if (calibrator?.panel) calibrator.panel.dirty = true;
        onSpeak?.('Labor szembefordítva.');
      }
    },

    // 2. Asztali méret csúszka & gomb
    {
      id: 'sliderIntroScale', kind: 'h', x: 26, y: 168, w: 328, h: 22,
      onDrag: f => {
        const minS = calibrator?.minScale ?? 0.08;
        const maxS = calibrator?.maxScale ?? 0.50;
        const s = minS + f * (maxS - minS);
        workGroup.scale.setScalar(s);
        introPanel.dirty = true;
        if (calibrator?.panel) calibrator.panel.dirty = true;
        triggerScaleUpdate();
      }
    },
    {
      id: 'btnIntroScaleReset', kind: 'btn', x: 276, y: 140, w: 80, h: 22,
      radius: 8,
      label: 'Alapméret', size: 10,
      onClick: () => {
        const defS = renderer.xr.isPresenting ? AR_DEFAULT_SCALE : DESKTOP_SCALE;
        workGroup.scale.setScalar(defS);
        introPanel.dirty = true;
        if (calibrator?.panel) calibrator.panel.dirty = true;
        triggerScaleUpdate();
        onSpeak?.('Alapértelmezett asztali méret visszaállítva.');
      }
    },

    // 3. HUD méret csúszka & gomb
    {
      id: 'sliderIntroHud', kind: 'h', x: 26, y: 240, w: 328, h: 22,
      onDrag: f => {
        const s = calibrator.minHudScale + f * (calibrator.maxHudScale - calibrator.minHudScale);
        calibrator.setHudScale(s);
        introPanel.dirty = true;
        triggerScaleUpdate();
      }
    },
    {
      id: 'btnIntroHudReset', kind: 'btn', x: 276, y: 212, w: 80, h: 22,
      radius: 8,
      label: 'Alap HUD', size: 10,
      onClick: () => {
        calibrator.setHudScale(1.0);
        introPanel.dirty = true;
        triggerScaleUpdate();
        onSpeak?.('Alapértelmezett HUD méret visszaállítva.');
      }
    },

    // 4. Alsó akciógombok
    {
      id: 'btnIntroReanchor', kind: 'btn', x: 16, y: 396, w: 164, h: 46,
      radius: 12,
      label: '📍 Új helyre',
      size: 13,
      onClick: () => {
        onReanchor?.();
      }
    },
    {
      id: 'btnStartLab', kind: 'btn', x: 190, y: 396, w: 174, h: 46,
      radius: 12,
      label: '▶ Start / Indítás',
      primary: true,
      size: 13.5,
      onClick: () => {
        onStartLab?.();
      }
    }
  ];

  return introPanel;
}
