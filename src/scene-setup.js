import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 1. Háromdimenziós WebGL & WebXR alapok inicializálása
export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 30);
camera.position.set(0, 0.55, 1.6);

export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// A Three.js beépített ARButton-ja hardkódolva a 'local' referenciateret kényszeríti ki (renderer.xr.setReferenceSpaceType('local')),
// ami felülírná a szobához rögzített 'local-floor' referenciateret. A 'local' térben nincs fizikai padlóhoz/szobához való
// SLAM rögzítés, ami miatt fejfordításkor és fejmozgáskor a koordinátarendszer és a modell úszik, lebeg és remeg a valós asztalhoz képest.
// Ezt a metódust felülbíráljuk, hogy minden esetben a sziklaszilárd, fizikai szobához rögzített 'local-floor' referenciateret kérje a WebXR-től:
const originalSetReferenceSpaceType = renderer.xr.setReferenceSpaceType.bind(renderer.xr);
renderer.xr.setReferenceSpaceType = (type) => {
  if (type === 'local') {
    return originalSetReferenceSpaceType('local-floor');
  }
  return originalSetReferenceSpaceType(type);
};
renderer.xr.setReferenceSpaceType('local-floor');

// Hardveres optimalizáció Meta Quest 3 MR-hez:
// 1. A setFramebufferScaleFactor(1.5) több mint 20 megapixel renderelésére kényszerítette a GPU-t képkockánként,
//    ami miatt a headset képkockákat dobott el, és bekapcsolt az Asynchronous Timewarp / SpaceWarp (ASW) remegés fejmozgatáskor.
//    A natív 1.0x felbontás kristálytiszta élességet ad a Quest 3 natív kijelzőjén, és garantálja a stabil 72–90 fps-t.
if (renderer.xr.setFramebufferScaleFactor) {
  renderer.xr.setFramebufferScaleFactor(1.0);
}

// 2. Bekapcsoljuk a hardveres foveált renderelést (1.0).
//    A látótér közepén 100%-os natív élességet biztosít, miközben a periférián tehermentesíti a mobil GPU-t,
//    így zéró mikroszaggatás mellett stabil, remegésmentes képet ad fejmozgás közben is.
if (renderer.xr.setFoveation) {
  renderer.xr.setFoveation(1.0);
}
renderer.xr.addEventListener('sessionstart', () => {
  if (renderer.xr.setFoveation) {
    renderer.xr.setFoveation(1.0);
  }
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

// AR indító gomb beállítása (Apple visionOS stílusú lebegő kapszula)
export const arButton = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test', 'local-floor'],
  optionalFeatures: ['hand-tracking', 'anchors', 'plane-detection']
});
arButton.style.bottom = '24px';
arButton.style.padding = '14px 28px';
arButton.style.borderRadius = '32px';
arButton.style.fontSize = '16px';
arButton.style.fontWeight = '500';
arButton.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
arButton.style.background = 'rgba(255, 255, 255, 0.9)';
arButton.style.color = '#000000';
arButton.style.border = 'none';
arButton.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.35)';
arButton.style.display = 'none'; // Kezdetben rejtve van, csak a 3D Labor kiválasztásakor jelenik meg!
document.body.appendChild(arButton);

// Fények
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

export const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

export const rimLight = new THREE.DirectionalLight(0x70d6ff, 0.7);
rimLight.position.set(-3, 3, -2);
scene.add(rimLight);

// Asztali egér vezérlés
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.2, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.minDistance = 0.5;
controls.maxDistance = 6;

// Környezeti rács
export const desktopEnv = new THREE.Group();
export const floorGrid = new THREE.GridHelper(6, 24, 0x5a78ff, 0x232d4b);
floorGrid.position.y = 0;
desktopEnv.add(floorGrid);
scene.add(desktopEnv);

// Ablakméret változás kezelése
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
