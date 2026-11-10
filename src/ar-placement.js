import * as THREE from 'three';
import { speak, TTS_AUDIO } from './speech.js';

export function createARPlacementManager({
  renderer,
  scene,
  camera,
  controls,
  desktopEnv,
  workGroup,
  calibrator,
  getIntroPanel,
  getSamplePanel,
  getGame,
  tutor,
  getInput,
  getIsWelcoming,
  getIsTransitioning,
  getIsLabActive,
  onPositionIntroPanel,
  onPositionCalibratorPanel,
  DESKTOP_SCALE = 0.24,
  AR_DEFAULT_SCALE = 0.15
}) {
  let hitTestSource = null;
  let hitTestSourceRequested = false;
  let placedInAR = false;

  // Célzókarika a felületérzékeléshez
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.18, 36).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  function triggerReanchor() {
    const introPanel = getIntroPanel();
    if (renderer.xr.isPresenting) {
      placedInAR = false;
      hitTestSourceRequested = false;
      hitTestSource = null;
      reticle.visible = true;
      calibrator.hide();
      if (introPanel) introPanel.visible = false;
      speak('Nézz a kívánt asztalra vagy felületre, és koppints a labor új helyének kijelöléséhez!');
    } else {
      workGroup.position.set(0, 0, 0);
      workGroup.rotation.set(0, 0, 0);
      controls.target.set(0, 0.2, 0);
      camera.position.set(0, 0.55, 1.6);
      onPositionIntroPanel();
      onPositionCalibratorPanel();
      speak('Kísérleti asztal alaphelyzetbe állítva.');
    }
  }

  function handleARPlacement() {
    const input = typeof getInput === 'function' ? getInput() : getInput;
    const game = typeof getGame === 'function' ? getGame() : getGame;
    const introPanel = getIntroPanel();
    const isWelcoming = typeof getIsWelcoming === 'function' ? getIsWelcoming() : getIsWelcoming;
    const isTransitioning = typeof getIsTransitioning === 'function' ? getIsTransitioning() : getIsTransitioning;

    if (reticle.visible && !placedInAR && (!input || !input.capturing)) {
      workGroup.position.setFromMatrixPosition(reticle.matrix);
      const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
      workGroup.lookAt(camPos.x, workGroup.position.y, camPos.z);
      workGroup.visible = true;
      placedInAR = true;
      reticle.visible = false;

      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
        hitTestSourceRequested = false;
      }

      onPositionIntroPanel();
      onPositionCalibratorPanel();

      const game = typeof getGame === 'function' ? getGame() : getGame;
      const isWelcoming = typeof getIsWelcoming === 'function' ? getIsWelcoming() : getIsWelcoming;
      const isTransitioning = typeof getIsTransitioning === 'function' ? getIsTransitioning() : getIsTransitioning;

      if (!game?.introStarted && !isWelcoming && !isTransitioning) {
        if (introPanel) {
          introPanel.visible = true;
          if (introPanel.mesh) introPanel.mesh.visible = true;
          introPanel.dirty = true;
        }
        const samplePanel = getSamplePanel?.();
        if (samplePanel) {
          samplePanel.visible = true;
          if (samplePanel.mesh) samplePanel.mesh.visible = true;
          samplePanel.dirty = true;
        }
      }

      if (input?.skipHeld) input.skipHeld();

      tutor.say(9000);
      speak(
        'A laboratórium sikeresen elhelyezve. Nyomd meg a Start gombot a kezdéshez!',
        TTS_AUDIO.ar_placed,
        {
          onStart: durMs => {
            if (durMs > 0) tutor.say(durMs + 300);
          },
          onEnd: () => {
            tutor.stopTalking();
          }
        }
      );
    }
  }

  renderer.xr.addEventListener('sessionstart', async () => {
    const introPanel = getIntroPanel();
    const samplePanel = getSamplePanel?.();
    desktopEnv.visible = false;
    controls.enabled = false;
    placedInAR = false;
    workGroup.visible = false;
    workGroup.scale.setScalar(AR_DEFAULT_SCALE);
    calibrator.defaultScale = AR_DEFAULT_SCALE;
    calibrator.panel.dirty = true;
    if (introPanel) {
      introPanel.dirty = true;
      if (introPanel.mesh) introPanel.mesh.visible = false;
    }
    if (samplePanel) {
      samplePanel.dirty = true;
      if (samplePanel.mesh) samplePanel.mesh.visible = false;
    }

    speak(
      'Nézz egy asztalra vagy a padlóra! Ahol a fehér célzókarikát látod, oda érkezik a labor. Az elhelyezéshez húzd meg a ravaszt a kontrolleren, vagy kézkövetésnél érintsd össze a mutató- és hüvelykujjadat!',
      TTS_AUDIO.ar_prompt,
      {
        onStart: durMs => {
          if (durMs > 0) tutor.say(durMs + 300);
        },
        onEnd: () => {
          tutor.stopTalking();
        }
      }
    );
  });

  renderer.xr.addEventListener('sessionend', () => {
    const introPanel = getIntroPanel();
    const samplePanel = getSamplePanel?.();
    desktopEnv.visible = true;
    controls.enabled = true;
    workGroup.visible = true;
    workGroup.position.set(0, 0, 0);
    workGroup.rotation.set(0, 0, 0);
    workGroup.scale.setScalar(DESKTOP_SCALE);
    calibrator.defaultScale = DESKTOP_SCALE;
    calibrator.panel.dirty = true;
    if (introPanel) {
      introPanel.visible = false;
      if (introPanel.mesh) introPanel.mesh.visible = false;
    }
    if (samplePanel) {
      samplePanel.visible = false;
      if (samplePanel.mesh) samplePanel.mesh.visible = false;
    }
    hitTestSourceRequested = false;
    hitTestSource = null;
    reticle.visible = false;
  });

  function updateARHitTest(frame) {
    if (!frame || !renderer.xr.isPresenting) return;
    if (typeof getIsLabActive === 'function' && !getIsLabActive()) {
      reticle.visible = false;
      return;
    }

    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then(refSpace => {
        if (!session.requestHitTestSource) {
          throw new Error('Hit test not supported');
        }
        return session.requestHitTestSource({ space: refSpace });
      }).then(source => {
        hitTestSource = source;
      }).catch(() => {
        // Tiszta VR mód (vagy hit-test nélküli headset / emulátor):
        // Az asztal azonnal megjelenik a felhasználó előtt a térben
        placedInAR = true;
        workGroup.visible = true;
        workGroup.position.set(0, 0, -1.2);
        workGroup.rotation.set(0, 0, 0);
        onPositionIntroPanel();
        onPositionCalibratorPanel();
        const game = typeof getGame === 'function' ? getGame() : getGame;
        const isWelcoming = typeof getIsWelcoming === 'function' ? getIsWelcoming() : getIsWelcoming;
        const isTransitioning = typeof getIsTransitioning === 'function' ? getIsTransitioning() : getIsTransitioning;
        if (!game?.introStarted && !isWelcoming && !isTransitioning) {
          const introPanel = getIntroPanel();
          if (introPanel) {
            introPanel.visible = true;
            if (introPanel.mesh) introPanel.mesh.visible = true;
            introPanel.dirty = true;
          }
          const samplePanel = getSamplePanel?.();
          if (samplePanel) {
            samplePanel.visible = true;
            if (samplePanel.mesh) samplePanel.mesh.visible = true;
            samplePanel.dirty = true;
          }
        }
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource && !placedInAR) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  return {
    reticle,
    triggerReanchor,
    handleARPlacement,
    updateARHitTest,
    isPlaced: () => placedInAR
  };
}
