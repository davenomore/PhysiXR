import { speak } from './speech.js';
import { BLOCKS } from './content.js';

export function setupDesktopDevUI() {
  // A dev mód kizárólag a Beállítások (Calibrator) panelből érhető el
}

export function syncDevSelect() {
  // A dev mód kizárólag a Beállítások (Calibrator) panelből érhető el
}

export function setupDevKeybindings({
  onScaleChange,
  onRotateChange,
  onHudScaleChange
}) {
  window.addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    const key = e.key.toLowerCase();
    if (key === '+' || key === '=') {
      onScaleChange?.(+0.02);
    } else if (key === '-' || key === '_') {
      onScaleChange?.(-0.02);
    } else if (key === 'r') {
      onRotateChange?.(+0.1);
    } else if (key === 'e') {
      onRotateChange?.(-0.1);
    } else if (key === 'h') {
      onHudScaleChange?.(+0.05);
    } else if (key === 'g') {
      onHudScaleChange?.(-0.05);
    }
  });
}

export function exposeGlobals({
  game,
  sim,
  hud,
  calibrator,
  onJump,
  onNext,
  onPrev,
  onSkip,
  onReset
}) {
  window.game = game;
  window.sim = sim;
  window.hud = hud;
  window.calibrator = calibrator;
  window.jumpToMission = idx => onJump(idx);
  window.nextMission = () => onNext();
  window.prevMission = () => onPrev();
  window.skipIntro = () => onSkip();
  window.completeAllMissions = () => {
    onJump(BLOCKS[0].missions.length);
  };
  window.restartMissions = () => onReset();
}
