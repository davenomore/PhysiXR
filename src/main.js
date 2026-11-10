import * as THREE from 'three';
import { scene, camera, renderer, controls, desktopEnv, arButton } from './scene-setup.js';
import { ThermoSim } from './sim.js';
import { Game } from './game.js';
import { Sandbox } from './sandbox.js';
import { Tutor } from './tutor.js';
import { createHUD } from './hud.js';
import { Input } from './input.js';
import { speak, unlockTTS, stopSpeaking } from './speech.js';
import { Calibrator } from './calibrator.js';
import { create3DGear } from './gear.js';
import {
  createIntroPanel,
  createSamplePanel,
  positionIntroPanel,
  positionCalibratorPanel,
  updateCalibSampleScale
} from './intro-panel.js';
import { createARPlacementManager } from './ar-placement.js';
import { setupHUDLayout, attachMissionToLab, updateHUDVisibility } from './hud-layout.js';
import { createFlowController } from './flow-controller.js';
import {
  setupDevKeybindings,
  exposeGlobals
} from './dev-tools.js';
import { AppMenu } from './app-menu.js';
import { PhaseDiagramModule } from './phase-diagram.js';
import { MoleculeViewerModule } from './molecule-viewer.js';
import { SpatialHUD } from './spatial-hud.js';
import { createStudioEnvMap } from './robot-builder.js';

// Böngésző hangmotorjának előzetes feloldása az első érintésre
window.addEventListener('pointerdown', () => unlockTTS(), { once: true });

// 0. Globális Alkalmazás Mód Kezelő ('MENU' | 'MOLECULE' | 'DIAGRAM' | 'LAB')
let currentAppMode = 'MENU';
const appRoot = document.getElementById('app') || document.body;

// 1. Fő MR munkatér konténer és méretek
const DESKTOP_SCALE = 0.24;
const AR_DEFAULT_SCALE = 0.15;

const workGroup = new THREE.Group();
workGroup.position.set(0, 0, 0);
workGroup.scale.setScalar(DESKTOP_SCALE);
scene.add(workGroup);

// Belső labor réteg: a plató alja (y=-1.75) az asztalon fekszik (y=0)
const labContent = new THREE.Group();
labContent.position.y = 1.75;
workGroup.add(labContent);

// Külön csoport a HUD paneleknek
const hudGroup = new THREE.Group();
labContent.add(hudGroup);
let hud = null;

// 2. Modulok példányosítása
const sim = new ThermoSim();
const game = new Game(sim);
const sandbox = new Sandbox();
sandbox.setTransitionProgress(0); // Makroszkopikus kezdőnézet
labContent.add(sandbox.root);

// 3D Tutor karakter
const tutor = new Tutor(labContent);
tutor.root.position.set(1.85, -0.38, 0.58);
tutor.baseY = -0.38;
tutor.root.rotation.y = -0.62;

// 3D Fogaskerék (Gear) widget a beállításokhoz
const gearObject = create3DGear();
gearObject.position.set(1.48, 2.95, 0.0);
hudGroup.add(gearObject);

// Pozicionáló segédfüggvények
const updateSampleScale = () => updateCalibSampleScale(workGroup, calibrator, samplePanel);
const updateIntroPos = () => positionIntroPanel(introPanel, samplePanel, workGroup, camera, scene, calibrator);
const updateCalibPos = () => positionCalibratorPanel(calibrator, workGroup, camera);
const triggerHUDVisibility = () => updateHUDVisibility({
  hud,
  hudGroup,
  gearObject,
  introPanel,
  samplePanel,
  game,
  renderer,
  isWelcoming: flow.isWelcoming,
  isTransitioning: flow.isTransitioning
});

// 3. Kalibráció és Kezdő Panelek
const calibrator = new Calibrator({
  targetGroup: workGroup,
  hudGroup: hudGroup,
  sandbox: sandbox,
  game: game,
  onResetProgress: () => flow.handleResetProgress(),
  onReanchor: () => arManager.triggerReanchor(),
  onSpeak: msg => speak(msg),
  onTransformChange: () => {
    if (introPanel?.visible) introPanel.dirty = true;
    updateSampleScale();
    if (typeof spatialHUD !== 'undefined' && spatialHUD) {
      const curScale = calibrator.targetGroup.scale.x;
      const pct = (curScale / DESKTOP_SCALE) * 100;
      spatialHUD.setDeskScalePercent(pct);
      const deg = THREE.MathUtils.radToDeg(workGroup.rotation.y);
      spatialHUD.setRotationDeg(deg);
    }
  },
  onHudScaleChange: () => {
    if (introPanel?.visible) introPanel.dirty = true;
    updateSampleScale();
    if (typeof spatialHUD !== 'undefined' && spatialHUD) {
      spatialHUD.setHudScalePercent(calibrator.hudScale * 100);
    }
  },
  onJumpToMission: idx => flow.handleJumpToMission(idx)
});

const samplePanel = createSamplePanel({
  onSpeak: msg => speak(msg)
});
samplePanel.mesh.visible = false;
scene.add(samplePanel.mesh);

const introPanel = createIntroPanel({
  workGroup,
  calibrator,
  renderer,
  getSamplePanel: () => samplePanel,
  getHud: () => hud,
  getGame: () => game,
  onReanchor: () => arManager.triggerReanchor(),
  onStartLab: () => flow.handleStartLab(),
  onSpeak: msg => speak(msg),
  DESKTOP_SCALE,
  AR_DEFAULT_SCALE
});

introPanel.mesh.visible = false;
calibrator.panel.mesh.visible = false;
scene.add(introPanel.mesh);
scene.add(calibrator.panel.mesh);

// 4. Folyamat- és Küldetésvezérlő
const flow = createFlowController({
  game,
  sim,
  sandbox,
  tutor,
  calibrator,
  getIntroPanel: () => introPanel,
  getSamplePanel: () => samplePanel,
  getHud: () => hud,
  attachMissionToLab: () => attachMissionToLab(hud, hudGroup),
  updateHUDVisibility: triggerHUDVisibility
});

// 5. WebXR AR Elhelyezés és Hit-Test menedzser
let input = null;
const arManager = createARPlacementManager({
  renderer,
  scene,
  camera,
  controls,
  desktopEnv,
  workGroup,
  calibrator,
  getIntroPanel: () => introPanel,
  getSamplePanel: () => samplePanel,
  getGame: () => game,
  tutor,
  getInput: () => input,
  getIsWelcoming: () => flow.isWelcoming,
  getIsTransitioning: () => flow.isTransitioning,
  getIsLabActive: () => currentAppMode === 'LAB',
  onPositionIntroPanel: updateIntroPos,
  onPositionCalibratorPanel: updateCalibPos,
  DESKTOP_SCALE,
  AR_DEFAULT_SCALE
});

// 6. HUD panelek felépítése és elrendezése
hud = createHUD({
  sim,
  game,
  tutor,
  onSpeak: (text, audio, opts) => speak(text, audio, opts),
  onOpenCalibrator: () => {
    calibrator.toggle();
    if (calibrator.panel.visible) updateCalibPos();
  },
  onJumpToMission: idx => flow.handleJumpToMission(idx)
});

setupHUDLayout(hud, hudGroup);
updateCalibPos();

// 6.5. Egységes Sötét Dashboard HUD rendszer (UI/spatial_hud_dev.html)
const studioEnv = createStudioEnvMap(renderer);
if (studioEnv) scene.environment = studioEnv;

const spatialHUD = new SpatialHUD({
  sim,
  game,
  tutor,
  workGroup,
  desktopScale: DESKTOP_SCALE,
  onStartLab: () => flow.handleStartLab(),
  onReanchor: () => arManager.triggerReanchor(),
  onOpenMenu: () => setAppMode('MENU')
});
window.physixrHud = spatialHUD;

if (game.introStarted) {
  attachMissionToLab(hud, hudGroup);
} else {
  updateIntroPos();
}

triggerHUDVisibility();

game.on('change', () => {
  triggerHUDVisibility();
  if (calibrator?.panel?.visible) {
    calibrator.setupWidgets();
    calibrator.panel.dirty = true;
  }
});

// 7. Bemenetkezelés (Input) és Jobb kontroller joystick (méretezés fel/le, forgatás jobbra/balra)
let lastLimitHapticTime = 0;
function triggerLimitHaptic(gamepad) {
  const now = performance.now();
  if (now - lastLimitHapticTime < 320) return;
  lastLimitHapticTime = now;
  try {
    if (gamepad?.hapticActuators && gamepad.hapticActuators[0]) {
      gamepad.hapticActuators[0].pulse?.(0.25, 20);
    } else if (gamepad?.vibrationActuator) {
      gamepad.vibrationActuator.playEffect?.('dual-rumble', {
        startDelay: 0,
        duration: 20,
        weakMagnitude: 0.25,
        strongMagnitude: 0.1
      });
    }
  } catch {
    // haptika nem elérhető
  }
}

input = new Input({
  renderer,
  camera,
  dom: renderer.domElement,
  onJoystickTransform: ({ stickX, stickY, dt, gamepad }) => {
    // 1. Fel / Le (stickY): Modell méretének folyamatos növelése/csökkentése
    // WebXR xr-standard: stickY < 0 előre/felfelé nyomás -> növeli a méretet
    // stickY > 0 hátra/lefelé húzás -> csökkenti a méretet
    if (Math.abs(stickY) > 0.001) {
      const curScale = calibrator.targetGroup.scale.x;
      const scaleRate = 0.16 + curScale * 0.65;
      const delta = -stickY * scaleRate * dt;
      const newScale = THREE.MathUtils.clamp(curScale + delta, calibrator.minScale, calibrator.maxScale);

      if (Math.abs(newScale - curScale) > 0.0001) {
        calibrator.setLabScale(newScale);
      } else if (Math.abs(delta) > 0.001 && gamepad) {
        triggerLimitHaptic(gamepad);
      }
    }

    // 2. Jobbra / Balra (stickX): Modell folyamatos forgatása
    // stickX > 0 jobbra billentés -> jobbra forgatás
    // stickX < 0 balra billentés -> balra forgatás
    if (Math.abs(stickX) > 0.001) {
      const rotSpeed = 1.85; // rad/s (~106° / másodperc maximális kitérésnél)
      const angleDelta = stickX * rotSpeed * dt;
      calibrator.adjustRotation(angleDelta);
    }
  },
  onLeftJoystickTransform: ({ stickX, stickY, dt, gamepad }) => {
    // Bal kontroller joystick (thumbstick): HUD méretének folyamatos növelése/csökkentése
    // stickY < 0 (előre/fel) vagy stickX > 0 (jobbra) -> HUD méret növelése
    // stickY > 0 (hátra/le) vagy stickX < 0 (balra) -> HUD méret csökkentése
    const stickVal = Math.abs(stickY) >= Math.abs(stickX) ? -stickY : stickX;
    if (Math.abs(stickVal) > 0.001) {
      const curHud = calibrator.hudScale;
      const speed = 0.55; // HUD skálázási sebesség másodpercenként
      const delta = stickVal * speed * dt;
      const newHud = THREE.MathUtils.clamp(curHud + delta, calibrator.minHudScale, calibrator.maxHudScale);

      if (Math.abs(newHud - curHud) > 0.0001) {
        calibrator.setHudScale(newHud);
      } else if (Math.abs(delta) > 0.001 && gamepad) {
        triggerLimitHaptic(gamepad);
      }
    }
  },
  getPanels: () => {
    if (currentAppMode !== 'LAB') return [];
    if (flow.isWelcoming || flow.isTransitioning) return [];
    return (game.introStarted ? [...hud.panels, calibrator.panel] : [introPanel, samplePanel]);
  },
  getTargets: () => {
    if (currentAppMode !== 'LAB') return [];
    if (flow.isWelcoming || flow.isTransitioning) return [];
    if (!game.introStarted || calibrator?.panel?.visible) return [];

    const scale = workGroup.scale.x;
    return [
      {
        pos: new THREE.Vector3().setFromMatrixPosition(gearObject.matrixWorld),
        radius: Math.max(0.04, 0.22 * scale),
        onActivate: () => {
          calibrator.toggle();
          if (calibrator.panel.visible) {
            updateCalibPos();
            speak('Beállítások és méretkalibráció megnyitva.');
          }
        }
      },
      // A robot feje csak akkor célpont ha a küldetések még tartanak (záró teszt alatt nem blokkol!)
      ...(!game.missionsDone() || tutor.activeHotspot ? [{
        pos: new THREE.Vector3().setFromMatrixPosition(tutor.head.matrixWorld),
        radius: Math.max(0.04, 0.35 * scale),
        onActivate: () => {
          if (tutor.activeHotspot) {
            flow.triggerHotspot();
            return;
          }
          tutor.say(3500);
          const hints = [
            'Próbáld meg elforralni a vizet a láng teljes feltekerésével!',
            'Hűtéssel újra jégkristályokat kapsz!',
            'A jobb oldali csúszkával nyomd össze a gázt a dugattyúval!',
            'A felső fogaskerék ikonnal tetszőlegesen átméretezheted a HUD-ot vagy a labort!',
            'Nézd meg a tudáskártyák gyűjteményét a bal felső panelen!'
          ];
          const h = hints[Math.floor(Math.random() * hints.length)];
          speak(h);
        }
      }] : []),
      ...(tutor.activeHotspot && tutor.exclamationGroup?.visible ? [{
        pos: new THREE.Vector3().setFromMatrixPosition(tutor.exclamationGroup.matrixWorld),
        radius: Math.max(0.05, 0.40 * scale),
        isHotspot: true,
        onActivate: () => flow.triggerHotspot()
      }] : []),
      ...(tutor.bellyBadge?.visible && tutor.activeHotspot ? [{
        pos: new THREE.Vector3().setFromMatrixPosition(tutor.bellyBadge.matrixWorld),
        radius: Math.max(0.04, 0.35 * scale),
        isHotspot: true,
        onActivate: () => flow.triggerHotspot()
      }] : [])
    ];
  }
});

scene.add(input.ctrls[0]);
scene.add(input.ctrls[1]);

input.ctrls[0].addEventListener('select', arManager.handleARPlacement);
input.ctrls[1].addEventListener('select', arManager.handleARPlacement);

// 8. Gyorsbillentyűk (laboratórium méret, elforgatás, HUD méret) és globális API
setupDevKeybindings({
  onScaleChange: delta => {
    const cur = calibrator.targetGroup.scale.x;
    const newScale = THREE.MathUtils.clamp(cur + delta, calibrator.minScale, calibrator.maxScale);
    calibrator.setLabScale(newScale);
  },
  onRotateChange: delta => {
    calibrator.adjustRotation(delta);
  },
  onHudScaleChange: delta => {
    const cur = calibrator.hudScale;
    const newHud = THREE.MathUtils.clamp(cur + delta, calibrator.minHudScale, calibrator.maxHudScale);
    calibrator.setHudScale(newHud);
  }
});

exposeGlobals({
  game,
  sim,
  hud,
  calibrator,
  onJump: idx => flow.handleJumpToMission(idx),
  onNext: () => flow.handleNextMission(),
  onPrev: () => flow.handlePrevMission(),
  onSkip: () => flow.skipIntroAndStart(game.missionNo),
  onReset: () => flow.handleResetProgress()
});

// 9. Interaktív Modulok és Alkalmazás Főmenü példányosítása
const moleculeViewer = new MoleculeViewerModule({
  scene,
  camera,
  controls,
  onBackToMenu: () => setAppMode('MENU')
});

const phaseDiagram = new PhaseDiagramModule({
  onBackToMenu: () => setAppMode('MENU')
});

const appMenu = new AppMenu({
  onSelectModule: mod => {
    if (mod === 'molecule') setAppMode('MOLECULE');
    else if (mod === 'diagram') setAppMode('DIAGRAM');
    else if (mod === 'lab') setAppMode('LAB');
  }
});

// Lebegő „‹ Főmenü” gomb a 3D laborban
const labMenuBtn = document.createElement('button');
labMenuBtn.className = 'floating-lab-menu-btn';
labMenuBtn.id = 'btnLabBackToMenu';
labMenuBtn.innerHTML = '‹ Főmenü';
labMenuBtn.style.display = 'none';
labMenuBtn.addEventListener('click', () => {
  stopSpeaking();
  setAppMode('MENU');
});
document.body.appendChild(labMenuBtn);

function setAppMode(newMode) {
  currentAppMode = newMode;

  if (newMode === 'MENU') {
    spatialHUD.hide();
    stopSpeaking();
    workGroup.visible = false;
    introPanel.mesh.visible = false;
    samplePanel.mesh.visible = false;
    calibrator.panel.mesh.visible = false;
    hudGroup.visible = false;
    gearObject.visible = false;
    desktopEnv.visible = false;
    arButton.style.display = 'none';
    labMenuBtn.style.display = 'none';

    moleculeViewer.unmount();
    phaseDiagram.unmount();
    appMenu.mount(appRoot);

    controls.enabled = false;
  } else if (newMode === 'MOLECULE') {
    spatialHUD.hide();
    stopSpeaking();
    workGroup.visible = false;
    introPanel.mesh.visible = false;
    samplePanel.mesh.visible = false;
    calibrator.panel.mesh.visible = false;
    hudGroup.visible = false;
    gearObject.visible = false;
    desktopEnv.visible = true;
    arButton.style.display = 'none';
    labMenuBtn.style.display = 'none';

    appMenu.unmount();
    phaseDiagram.unmount();
    moleculeViewer.mount(appRoot);

    controls.enabled = true;
  } else if (newMode === 'DIAGRAM') {
    spatialHUD.hide();
    stopSpeaking();
    workGroup.visible = false;
    introPanel.mesh.visible = false;
    samplePanel.mesh.visible = false;
    calibrator.panel.mesh.visible = false;
    hudGroup.visible = false;
    gearObject.visible = false;
    desktopEnv.visible = false;
    arButton.style.display = 'none';
    labMenuBtn.style.display = 'none';

    appMenu.unmount();
    moleculeViewer.unmount();
    phaseDiagram.mount(appRoot);

    controls.enabled = false;
  } else if (newMode === 'LAB') {
    stopSpeaking();
    appMenu.unmount();
    moleculeViewer.unmount();
    phaseDiagram.unmount();

    const isVR = !!renderer.xr.isPresenting;
    if (isVR) {
      spatialHUD.hide();
    } else {
      spatialHUD.show();
      spatialHUD.syncVisibility(!game.introStarted);
    }

    workGroup.visible = true;
    desktopEnv.visible = !isVR;
    arButton.style.display = '';
    labMenuBtn.style.display = 'none'; // A spatialHUD fejléc már tartalmazza a Főmenü gombot

    controls.enabled = !isVR;

    triggerHUDVisibility();
  }
}

// WebXR Session események (VR/MR headset belépés & kilépés kezelése)
renderer.xr.addEventListener('sessionstart', () => {
  spatialHUD.hide();
  triggerHUDVisibility();
});

renderer.xr.addEventListener('sessionend', () => {
  if (currentAppMode === 'LAB') {
    spatialHUD.show();
    spatialHUD.syncVisibility(!game.introStarted);
  }
  triggerHUDVisibility();
});

// Kezdeti állapot: azonnal az App Főmenü jelenik meg, nincs azonnali pozicionálás!
setAppMode('MENU');

// 10. Fő Render Loop
const clock = new THREE.Clock();

renderer.setAnimationLoop((time, frame) => {
  const dt = Math.min(clock.getDelta(), 0.1);

  if (currentAppMode === 'MOLECULE') {
    controls.update();
    moleculeViewer.update(dt);
    renderer.render(scene, camera);
    return;
  }

  if (currentAppMode === 'DIAGRAM' || currentAppMode === 'MENU') {
    renderer.render(scene, camera);
    return;
  }

  // 3D LAB Mód:
  if (!renderer.xr.isPresenting) {
    controls.enabled = !input.capturing;
    controls.update();
  }

  // ⚙️ 3D Fogaskerék finom lassú forgása
  gearObject.rotation.z = time * 0.0006;

  sim.step(dt);
  if (!flow.isHotspotSpeaking) {
    game.update(dt);
  }
  sandbox.update(sim, game, dt, time);

  flow.updateTransition();
  flow.updateHotspots();

  hud.update(time);
  tutor.update(time);
  calibrator.update();
  spatialHUD.update(dt, time * 0.001);

  if (introPanel.visible && introPanel.dirty) {
    introPanel.redraw();
  }
  if (samplePanel.visible && samplePanel.dirty) {
    samplePanel.redraw();
  }

  arManager.updateARHitTest(frame);

  input.update(dt);
  renderer.render(scene, camera);
});
