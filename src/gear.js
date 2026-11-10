import * as THREE from 'three';

/**
 * Valódi, elegáns 3D Fogaskerék (Gear) geometria építése a beállítások ikonhoz.
 * Apple visionOS stílusú gyöngyházfehér fém fogaskerék sötét üveg kerek hátlappal.
 */
export function create3DGear() {
  const gearGroup = new THREE.Group();
  const teeth = 8;
  const innerR = 0.08, outerR = 0.14, depth = 0.04;

  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.3) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.6) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.9) / teeth) * Math.PI * 2;

    if (i === 0) {
      shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    } else {
      shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    }
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
  }
  shape.closePath();

  // Belső lyuk
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.04, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const extrudeSettings = { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  // Apple visionOS stílusú gyöngyházfehér fém anyag
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.25
  });

  const mesh = new THREE.Mesh(geo, mat);
  gearGroup.add(mesh);

  // VisionOS stílusú sötét üveg kerek hátlap a fogaskerék mögött
  const backGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 32);
  backGeo.rotateX(Math.PI / 2);
  const backMat = new THREE.MeshBasicMaterial({
    color: 0x222634,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.position.z = -0.02;
  gearGroup.add(backMesh);

  return gearGroup;
}
