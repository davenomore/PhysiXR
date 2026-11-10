import * as THREE from 'three';
import {
  DEFAULT_ROBOT_COLORS,
  ROBOT_COLORS_STORAGE_KEY,
  hexToRgb,
  rgbToCss,
  mixRgb,
  buildRobotModel,
  applyRobotPoseAndAnimation,
  refreshHeadColorTexture,
  refreshTorsoColorTexture,
  updateRobotVisorCanvas,
  updateRobotChestCoreCanvas
} from './robot-builder.js';

// 3D Tutor karakter: Kifejező, intelligens sci-fi laborasszisztens robot
// Pontosan az UI/spatial_hud_dev.html fájlban definiált geometriákkal,
// PBR anyagokkal, ívelt Squircle LED vizorral, hasi OLED kijelzővel és karokkal.
export class Tutor {
  constructor(parent) {
    this.root = new THREE.Group();
    parent.add(this.root);

    this.baseY = 0;
    this.state = 'idle';
    this.talkUntil = 0;
    this.activeHotspot = null;
    this.lastTime = performance.now();

    // Robot állapota
    this.robotState = {
      pose: 'wave',          // 'wave' | 'idle' | 'talk' | 'happy'
      expression: 'photo',   // 'photo' | 'happy' | 'wink' | 'curious'
      coreMode: 'glow',      // 'glow' | 'message' | 'pulse'
      baseYawDeg: 0,
      scale: 1.0,
      blinkTimer: 0,
      isBlinking: false,
      talkMouthPhase: 0,
      colors: { ...DEFAULT_ROBOT_COLORS }
    };

    this.loadSavedColors();

    // 3D Robot modell felépítése
    this.model = buildRobotModel(this.robotState);
    this.root.add(this.model.root);

    // API referenciák az érintés/lézer célzáshoz
    this.head = this.model.headGroup;
    this.bellyBadge = this.model.chestCoreDisc;
    this.exclamationGroup = this.model.chestCoreDisc; // a hasi kijelző szolgál figyelmeztető gombként!
  }

  loadSavedColors() {
    try {
      const raw = localStorage.getItem(ROBOT_COLORS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.keys(DEFAULT_ROBOT_COLORS).forEach(k => {
          if (parsed[k] && /^#[0-9a-fA-F]{6}$/.test(parsed[k])) {
            this.robotState.colors[k] = parsed[k].toLowerCase();
          }
        });
      }
    } catch (_) {}
  }

  setPose(pose) {
    this.robotState.pose = pose;
    if (pose === 'happy') {
      this.setExpression('happy');
    } else if (pose === 'wave') {
      this.setExpression('photo');
    } else {
      updateRobotVisorCanvas(this.model.visorCtx, this.model.visorCanvas, this.model.visorTexture, this.robotState);
    }
  }

  setExpression(expr) {
    this.robotState.expression = expr;
    updateRobotVisorCanvas(this.model.visorCtx, this.model.visorCanvas, this.model.visorTexture, this.robotState);
  }

  setCoreMode(mode) {
    this.robotState.coreMode = mode;
    updateRobotChestCoreCanvas(this.model.chestCtx, this.model.chestCanvas, this.model.chestTexture, this.robotState, performance.now() * 0.001);
  }

  updateColor(zone, hexValue) {
    if (!hexValue) return;
    const hex = hexValue.toLowerCase();
    this.robotState.colors[zone] = hex;

    try {
      localStorage.setItem(ROBOT_COLORS_STORAGE_KEY, JSON.stringify(this.robotState.colors));
    } catch (_) {}

    const mats = this.model.mats;
    if (zone === 'turquoise') {
      mats.turquoiseMetal.color.set(hex);
      const turqRgb = hexToRgb(hex);
      const earCapRgb = mixRgb(turqRgb, { r: 180, g: 255, b: 255 }, 0.35);
      mats.turquoiseLightCap.color.set(rgbToCss(earCapRgb));
      refreshHeadColorTexture(this.model.headTexData, this.robotState.colors);
      refreshTorsoColorTexture(this.model.torsoTexData, this.robotState.colors);
    } else if (zone === 'white') {
      mats.whiteGloss.color.set(hex);
      refreshHeadColorTexture(this.model.headTexData, this.robotState.colors);
      refreshTorsoColorTexture(this.model.torsoTexData, this.robotState.colors);
    } else if (zone === 'visor') {
      updateRobotVisorCanvas(this.model.visorCtx, this.model.visorCanvas, this.model.visorTexture, this.robotState);
    } else if (zone === 'coreBase') {
      if (this.robotState.coreMode !== 'glow') {
        this.setCoreMode('glow');
      } else {
        updateRobotChestCoreCanvas(this.model.chestCtx, this.model.chestCanvas, this.model.chestTexture, this.robotState, performance.now() * 0.001);
      }
    } else if (zone === 'coreMsg') {
      if (this.robotState.coreMode !== 'message') {
        this.setCoreMode('message');
      } else {
        updateRobotChestCoreCanvas(this.model.chestCtx, this.model.chestCanvas, this.model.chestTexture, this.robotState, performance.now() * 0.001);
      }
    } else if (zone === 'joint') {
      mats.darkJoint.color.set(hex);
      mats.darkMetal.color.set(hex).multiplyScalar(0.65);
    }
  }

  resetColors() {
    this.robotState.colors = { ...DEFAULT_ROBOT_COLORS };
    try {
      localStorage.removeItem(ROBOT_COLORS_STORAGE_KEY);
    } catch (_) {}

    const mats = this.model.mats;
    mats.turquoiseMetal.color.set(this.robotState.colors.turquoise);
    const turqRgb = hexToRgb(this.robotState.colors.turquoise);
    const earCapRgb = mixRgb(turqRgb, { r: 180, g: 255, b: 255 }, 0.35);
    mats.turquoiseLightCap.color.set(rgbToCss(earCapRgb));
    mats.whiteGloss.color.set(this.robotState.colors.white);
    mats.darkJoint.color.set(this.robotState.colors.joint);
    mats.darkMetal.color.set(this.robotState.colors.joint).multiplyScalar(0.65);

    refreshHeadColorTexture(this.model.headTexData, this.robotState.colors);
    refreshTorsoColorTexture(this.model.torsoTexData, this.robotState.colors);
    updateRobotVisorCanvas(this.model.visorCtx, this.model.visorCanvas, this.model.visorTexture, this.robotState);
    updateRobotChestCoreCanvas(this.model.chestCtx, this.model.chestCanvas, this.model.chestTexture, this.robotState, performance.now() * 0.001);
  }

  setHotspot(hotspot) {
    this.activeHotspot = hotspot;
    if (hotspot) {
      this.setCoreMode('message');
      this.setExpression('photo');
    } else {
      this.setCoreMode('glow');
    }
  }

  say(durationMs = 4000) {
    this.state = 'talking';
    this.talkUntil = performance.now() + durationMs;
    this.robotState.pose = 'talk';
  }

  stopTalking() {
    this.state = 'idle';
    this.talkUntil = 0;
    if (this.robotState.pose === 'talk') {
      this.robotState.pose = 'idle';
      updateRobotVisorCanvas(this.model.visorCtx, this.model.visorCanvas, this.model.visorTexture, this.robotState);
    }
  }

  update(time) {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const timeSec = (time !== undefined ? time : now) * 0.001;

    // Beszéd időtúllépés kezelése
    if (this.state === 'talking') {
      if (now > this.talkUntil) {
        this.stopTalking();
      }
    }

    applyRobotPoseAndAnimation(this.model, this.robotState, dt, timeSec);
  }
}
