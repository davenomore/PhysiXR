const LEFT_X = -4.30;
const LEFT_Z = 0.45;
const LEFT_ROT_Y = 0.42;

const RIGHT_X = 4.30;
const RIGHT_Z = 0.45;
const RIGHT_ROT_Y = -0.42;

export function setupHUDLayout(hud, hudGroup) {
  // 1. Középen fent: Lebegő fázis és telemetria státusz kapszula (üvegkocka felett)
  hud.statePanel.mesh.position.set(0, 2.95, 0);
  hudGroup.add(hud.statePanel.mesh);

  // 2. Bal oldal: Gyűjtemény könyvtár panel
  hud.collectionPanel.mesh.position.set(LEFT_X, 1.40, LEFT_Z);
  hud.collectionPanel.mesh.rotation.set(0, LEFT_ROT_Y, 0);
  hudGroup.add(hud.collectionPanel.mesh);

  // 3. Középen lent: Függőleges csúszkás Hőszabályzó konzol (az asztal pereménél, döntve)
  hud.heatPanel.mesh.position.set(0, -0.65, 3.10);
  hud.heatPanel.mesh.rotation.set(-0.40, 0, 0);
  hudGroup.add(hud.heatPanel.mesh);

  // 4. Jobb alsó: Nyomás & Mérés (T(t) diagram és manométer)
  hud.pressPanel.mesh.position.set(RIGHT_X, 0.10, RIGHT_Z);
  hud.pressPanel.mesh.rotation.set(0, RIGHT_ROT_Y, 0);
  hudGroup.add(hud.pressPanel.mesh);
}

export function attachMissionToLab(hud, hudGroup) {
  if (hud?.missionPanel?.mesh) {
    hudGroup.add(hud.missionPanel.mesh);
    // 5. Jobb felső: Küldetés panel
    hud.missionPanel.mesh.position.set(RIGHT_X, 2.30, RIGHT_Z);
    hud.missionPanel.mesh.rotation.set(0, RIGHT_ROT_Y, 0);
    hud.missionPanel.mesh.scale.set(1, 1, 1);
    hud.missionPanel.dirty = true;
  }
}

export function updateHUDVisibility({
  hud,
  hudGroup,
  gearObject,
  introPanel,
  samplePanel,
  game,
  renderer,
  spatialHUD,
  isWelcoming = false,
  isTransitioning = false
}) {
  const isVR = typeof renderer !== 'undefined' && renderer?.xr?.isPresenting;

  if (isVR) {
    // VR MÓD (WebXR session a headsetben):
    // A 3D Canvas panelek aktívak és láthatók a térben
    const showIntro = !game.introStarted;
    if (introPanel) {
      introPanel.visible = showIntro;
      if (introPanel.mesh) introPanel.mesh.visible = showIntro;
    }
    if (samplePanel) {
      samplePanel.visible = showIntro;
      if (samplePanel.mesh) samplePanel.mesh.visible = showIntro;
    }

    const showLab = game.introStarted;
    if (hudGroup) hudGroup.visible = showLab;
    if (gearObject) gearObject.visible = false;
    if (hud?.panels) {
      hud.panels.forEach(p => {
        p.visible = showLab;
        if (showLab) p.dirty = true;
      });
    }

    // 2D HTML overlay elrejtése VR módban
    if (spatialHUD) {
      spatialHUD.hide();
    }
  } else {
    // DESKTOP MÓD (2D böngésző):
    // A 3D VR panelek rejtve maradnak, az egységes HTML SpatialHUD lebeg a képernyőn
    if (hudGroup) hudGroup.visible = false;
    if (gearObject) gearObject.visible = false;
    if (introPanel) {
      introPanel.visible = false;
      if (introPanel.mesh) introPanel.mesh.visible = false;
    }
    if (samplePanel) {
      samplePanel.visible = false;
      if (samplePanel.mesh) samplePanel.mesh.visible = false;
    }
    if (hud?.panels) {
      hud.panels.forEach(p => {
        p.visible = false;
      });
    }

    if (spatialHUD) {
      spatialHUD.show();
      spatialHUD.syncVisibility(!game.introStarted);
    }
  }
}
