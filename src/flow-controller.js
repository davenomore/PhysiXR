import { speak, stopSpeech, unlockTTS, TTS_AUDIO } from './speech.js';
import { HOTSPOTS } from './content.js';
import { syncDevSelect } from './dev-tools.js';

export function createFlowController({
  game,
  sim,
  sandbox,
  tutor,
  calibrator,
  getIntroPanel,
  getSamplePanel,
  getHud,
  attachMissionToLab,
  updateHUDVisibility
}) {
  let isWelcoming = false;
  let isTransitioning = false;
  let transitionStartTime = 0;
  const TRANSITION_DURATION = 2400; // 2.4 másodperces lágy mikroszkopikus átmenet
  let isHotspotSpeaking = false;

  function handleResetProgress() {
    const hud = getHud();
    game.restartMissions();
    sim.reset();
    calibrator.hide();
    tutor.say(6000);
    speak('A küldetések és a kísérlet sikeresen újraindultak! Kezdjük elölről az 1. feladattal.');
    hud?.highlightMission?.(8000);
  }

  function handleJumpToMission(idx) {
    const hud = getHud();
    const introPanel = getIntroPanel();
    const samplePanel = getSamplePanel?.();

    stopSpeech(true);
    tutor.stopTalking();
    isHotspotSpeaking = false;
    isWelcoming = false;
    isTransitioning = false;
    sandbox.setTransitionProgress(1.0);
    if (introPanel) {
      introPanel.visible = false;
      if (introPanel.mesh) introPanel.mesh.visible = false;
    }
    if (samplePanel) {
      samplePanel.visible = false;
      if (samplePanel.mesh) samplePanel.mesh.visible = false;
    }
    attachMissionToLab();
    game.startIntro();
    game.jumpToMission(idx);
    updateHUDVisibility();
    hud?.closeCardModal?.();
    hud?.highlightMission?.(6000);

    syncDevSelect(Math.min(idx, 10));

    const m = game.mission;
    const msg = m ? `Ugrás a ${idx + 1}. feladatra: ${m.title}` : 'Ugrás a tudáspróba kvízhez!';
    speak(msg);
  }

  function handleNextMission() {
    const next = Math.min(game.missionNo + 1, game.block.missions.length);
    handleJumpToMission(next);
  }

  function handlePrevMission() {
    const prev = Math.max(0, game.missionNo - 1);
    handleJumpToMission(prev);
  }

  function skipIntroAndStart(targetIdx = 0) {
    handleJumpToMission(targetIdx);
  }

  function startMicroTransition() {
    if (isTransitioning) return;
    isWelcoming = false;
    isTransitioning = true;
    updateHUDVisibility();
    transitionStartTime = performance.now();
    tutor.say(TRANSITION_DURATION + 500);
  }

  function handleStartLab() {
    const introPanel = getIntroPanel();
    const samplePanel = getSamplePanel?.();
    unlockTTS();
    isWelcoming = true;
    isTransitioning = false;
    game.collectedHotspots.clear();
    game.missionIdx = {};
    game.sim.reset();
    game.startIntro();
    if (introPanel) {
      introPanel.visible = false;
      if (introPanel.mesh) introPanel.mesh.visible = false;
    }
    if (samplePanel) {
      samplePanel.visible = false;
      if (samplePanel.mesh) samplePanel.mesh.visible = false;
    }
    attachMissionToLab();
    updateHUDVisibility();
    getHud()?.highlightMission?.(8000);

    const welcomeText = 'Üdvözöllek ebben az interaktív szimulációban! Amit magad előtt látsz, az a természet egyik legfontosabb anyaga: a víz. Jelenleg a szilárd formáját látod, de a hőmérséklet változtatásával ez az anyag lenyűgöző átalakulásokon tud keresztülmenni. A titok nyitja az energia. Kísérjük végig a vizet mind a három fő halmazállapotán, és nézzük meg, mi történik a színfalak mögött, mikroszkopikus szinten!';

    tutor.say(19000);
    speak(
      welcomeText,
      TTS_AUDIO.welcome,
      {
        onStart: durMs => {
          if (durMs > 0) tutor.say(durMs + 300);
        },
        onEnd: () => {
          startMicroTransition();
        }
      }
    );
  }

  function triggerHotspot() {
    if (isHotspotSpeaking) return;
    const h = tutor.activeHotspot;
    if (!h) return;

    const hud = getHud();
    isHotspotSpeaking = true;
    tutor.setHotspot(null); // Elrejtjük a sárga felkiáltójelet a magyarázat idejére

    if (h.cardId && hud) {
      hud.openCard(h.cardId, false);
    }

    const explanation = h.text;
    const durEst = Math.max(7500, explanation.length * 85);
    tutor.say(durEst + 500);

    const audioUrl = h.audio ||
                     (h.audioKey && TTS_AUDIO[h.audioKey]) ||
                     TTS_AUDIO[h.id] ||
                     TTS_AUDIO[h.cardId] ||
                     null;

    speak(explanation, audioUrl, {
      onStart: durMs => {
        if (durMs > 0) tutor.say(durMs + 300);
      },
      onEnd: () => {
        isHotspotSpeaking = false;
        game.flags.hotspot = true;
        game.collectHotspot(h.id, h.cardId, { silent: true });
        game.update(0, { silent: true });
        const nextM = game.mission;
        if (nextM) {
          hud?.highlightMission?.(8000);
        }
      }
    });
  }

  function updateTransition() {
    if (!isTransitioning) return;
    const elapsed = performance.now() - transitionStartTime;
    const progress = Math.min(1.0, elapsed / TRANSITION_DURATION);
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    sandbox.setTransitionProgress(ease);

    if (progress >= 1.0) {
      isTransitioning = false;
      sandbox.setTransitionProgress(1.0);
      attachMissionToLab();
      game.startIntro();
      updateHUDVisibility();
      tutor.say(6000);
      speak(
        'Nézd meg a jobb oldali Küldetés panelt a feladatokért, és az első küldetés megkezdéséhez kattints a felettem villogó sárga felkiáltójelre!',
        TTS_AUDIO.intro_nav,
        {
          onStart: durMs => {
            if (durMs > 0) tutor.say(durMs + 300);
          }
        }
      );
      getHud()?.highlightMission?.(8000);
    }
  }

  function updateHotspots() {
    if (game.introStarted && !isHotspotSpeaking) {
      const activeHotspot = HOTSPOTS.find(h => {
        if (h.visibleWhen) return h.visibleWhen(game);
        return !game.collectedHotspots.has(h.id);
      }) || null;
      tutor.setHotspot(activeHotspot);
    } else {
      tutor.setHotspot(null);
    }
  }

  return {
    get isWelcoming() { return isWelcoming; },
    get isTransitioning() { return isTransitioning; },
    get isHotspotSpeaking() { return isHotspotSpeaking; },
    handleResetProgress,
    handleJumpToMission,
    handleNextMission,
    handlePrevMission,
    skipIntroAndStart,
    startMicroTransition,
    handleStartLab,
    triggerHotspot,
    updateTransition,
    updateHotspots
  };
}
