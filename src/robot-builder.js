import * as THREE from 'three';

// ===============================================================
// 3D AI ROBOT COMPANION ALAPÉRTELMEZETT BEÁLLÍTÁSOK ÉS SZÍNEK
// (Közvetlenül az UI/spatial_hud_dev.html fájlból átvéve)
// ===============================================================
export const ROBOT_COLORS_STORAGE_KEY = 'fazister_robot_colors_v1';

export const DEFAULT_ROBOT_COLORS = {
  turquoise: '#0da5c0', // Türkiz Fém (Test, Fül, Mandzsetta)
  white: '#f2f7fa',     // Fehér Páncél (Fej, Karok, Has)
  visor: '#00f0ff',     // Vizor LED (Szemek & Mosoly)
  coreBase: '#6366f1',  // Has Alap (Indigó OLED kijelző)
  coreMsg: '#f59e0b',   // Has Üzenet (Sárga villogás felkiáltójellel)
  joint: '#121820'      // Csuklók & Káva (Sötét grafit/antracit)
};

export function hexToRgb(hex) {
  const clean = (hex || '#00f0ff').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToCss(rgb, alpha = 1) {
  return alpha < 1
    ? `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`
    : `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

export function mixRgb(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t)
  };
}

export function fillRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Virtuális fotóstúdió Environment Map generálása
export function createStudioEnvMap(renderer) {
  if (!renderer) return null;
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0c141c);

    // Felső fő softbox
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topSoftbox.position.set(-1.8, 6.5, 4.5);
    topSoftbox.lookAt(0, 0, 0);
    envScene.add(topSoftbox);

    // Bal oldali derítő softbox
    const leftSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0x99e6ff, side: THREE.DoubleSide })
    );
    leftSoftbox.position.set(-6.5, 1.5, 3.0);
    leftSoftbox.lookAt(0, 0, 0);
    envScene.add(leftSoftbox);

    // Jobb oldali türkiz élfény
    const rightRimBox = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00d4f0, side: THREE.DoubleSide })
    );
    rightRimBox.position.set(6.5, 2.0, -2.0);
    rightRimBox.lookAt(0, 0, 0);
    envScene.add(rightRimBox);

    // Alsó enyhe derítés
    const floorBounce = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ color: 0x1e4e5f, side: THREE.DoubleSide })
    );
    floorBounce.position.set(0, -6, 1);
    floorBounce.lookAt(0, 0, 0);
    envScene.add(floorBounce);

    const envRT = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return envRT.texture;
  } catch (err) {
    console.warn('Nem sikerült az envMap generálása:', err);
    return null;
  }
}

// Fej textúra előállítása
export function createHeadTextures(colors) {
  const w = 1024, h = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = w; colorCanvas.height = h;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w; bumpCanvas.height = h;
  const bCtx = bumpCanvas.getContext('2d');

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  bCtx.save();
  bCtx.strokeStyle = '#181818';
  bCtx.lineWidth = 7;
  bCtx.lineCap = 'round';
  bCtx.beginPath();
  bCtx.moveTo(w * 0.422, h * 0.34);
  bCtx.quadraticCurveTo(w * 0.395, h * 0.18, w * 0.365, h * 0.05);
  bCtx.stroke();
  bCtx.beginPath();
  bCtx.moveTo(w * 0.578, h * 0.34);
  bCtx.quadraticCurveTo(w * 0.605, h * 0.18, w * 0.635, h * 0.05);
  bCtx.stroke();
  bCtx.restore();

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.anisotropy = 4;
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);

  const texData = { colorCanvas, cCtx, colorTex, bumpTex };
  refreshHeadColorTexture(texData, colors);
  return texData;
}

export function refreshHeadColorTexture(texData, colors) {
  if (!texData) return;
  const { colorCanvas, cCtx, colorTex } = texData;
  const w = colorCanvas.width, h = colorCanvas.height;

  cCtx.fillStyle = colors.white;
  cCtx.fillRect(0, 0, w, h);

  cCtx.save();
  cCtx.strokeStyle = colors.turquoise;
  cCtx.lineWidth = 11;
  cCtx.lineCap = 'round';

  // Bal homlok ív
  cCtx.beginPath();
  cCtx.moveTo(w * 0.422, h * 0.34);
  cCtx.quadraticCurveTo(w * 0.395, h * 0.18, w * 0.365, h * 0.05);
  cCtx.stroke();

  // Jobb homlok ív
  cCtx.beginPath();
  cCtx.moveTo(w * 0.578, h * 0.34);
  cCtx.quadraticCurveTo(w * 0.605, h * 0.18, w * 0.635, h * 0.05);
  cCtx.stroke();
  cCtx.restore();

  colorTex.needsUpdate = true;
}

// Torzó PBR textúra előállítása
export function createTorsoPBRTextures(colors) {
  const w = 1024, h = 512;
  const totalPixels = w * h;
  const colC = document.createElement('canvas'); colC.width = w; colC.height = h;
  const metC = document.createElement('canvas'); metC.width = w; metC.height = h;
  const rghC = document.createElement('canvas'); rghC.width = w; rghC.height = h;
  const bmpC = document.createElement('canvas'); bmpC.width = w; bmpC.height = h;

  const cCtx = colC.getContext('2d');
  const mCtx = metC.getContext('2d');
  const rCtx = rghC.getContext('2d');
  const bCtx = bmpC.getContext('2d');

  const imgC = cCtx.createImageData(w, h);
  const imgM = mCtx.createImageData(w, h);
  const imgR = rCtx.createImageData(w, h);
  const imgB = bCtx.createImageData(w, h);

  const zoneMask = new Uint8Array(totalPixels);
  const sheenMap = new Int8Array(totalPixels);

  for (let y = 0; y < h; y++) {
    const v = 1.0 - (y / h);
    const sheen = Math.round(Math.sin(v * Math.PI) * 16);
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const du = Math.abs(u - 0.5);

      let isWhiteBelly = false;
      let seamDist = 1.0;

      if (v < 0.57 && v > 0.09 && du < 0.34) {
        let bibHalfWidth = 0.0;
        if (v >= 0.16) {
          const t = Math.max(0, Math.min(1, (v - 0.16) / (0.57 - 0.16)));
          bibHalfWidth = 0.068 * Math.pow(t, 0.36) + 0.022 * Math.pow(t, 2.0);
        }

        const topCurve = 0.555 - 0.045 * Math.cos(Math.min(1, du / 0.32) * Math.PI * 0.5);
        const bottomCap = 0.095 + 0.025 * Math.pow(du / 0.34, 2);
        const backLimit = 0.32;

        const dBib = du - bibHalfWidth;
        const dTop = topCurve - v;
        const dBot = v - bottomCap;
        const dBack = backLimit - du;

        const minInside = Math.min(dBib, dTop, dBot, dBack);
        if (minInside > 0) isWhiteBelly = true;
        seamDist = Math.abs(minInside);
      }

      const pIdx = y * w + x;
      const idx = pIdx * 4;
      const isGroove = seamDist < 0.0048;

      sheenMap[pIdx] = sheen;
      imgC.data[idx + 3] = 255;

      if (isGroove) {
        zoneMask[pIdx] = 2;
        imgM.data[idx] = imgM.data[idx + 1] = imgM.data[idx + 2] = 50; imgM.data[idx + 3] = 255;
        imgR.data[idx] = imgR.data[idx + 1] = imgR.data[idx + 2] = 150; imgR.data[idx + 3] = 255;
        imgB.data[idx] = imgB.data[idx + 1] = imgB.data[idx + 2] = 20; imgB.data[idx + 3] = 255;
      } else if (isWhiteBelly) {
        zoneMask[pIdx] = 1;
        imgM.data[idx] = imgM.data[idx + 1] = imgM.data[idx + 2] = 12; imgM.data[idx + 3] = 255;
        imgR.data[idx] = imgR.data[idx + 1] = imgR.data[idx + 2] = 35; imgR.data[idx + 3] = 255;
        imgB.data[idx] = imgB.data[idx + 1] = imgB.data[idx + 2] = 136; imgB.data[idx + 3] = 255;
      } else {
        zoneMask[pIdx] = 0;
        imgM.data[idx] = imgM.data[idx + 1] = imgM.data[idx + 2] = 148; imgM.data[idx + 3] = 255;
        imgR.data[idx] = imgR.data[idx + 1] = imgR.data[idx + 2] = 56; imgR.data[idx + 3] = 255;
        imgB.data[idx] = imgB.data[idx + 1] = imgB.data[idx + 2] = 128; imgB.data[idx + 3] = 255;
      }
    }
  }

  mCtx.putImageData(imgM, 0, 0);
  rCtx.putImageData(imgR, 0, 0);
  bCtx.putImageData(imgB, 0, 0);

  const colorMap = new THREE.CanvasTexture(colC); colorMap.anisotropy = 4;
  const metalnessMap = new THREE.CanvasTexture(metC);
  const roughnessMap = new THREE.CanvasTexture(rghC);
  const bumpMap = new THREE.CanvasTexture(bmpC);

  const texData = { colC, cCtx, imgC, zoneMask, sheenMap, colorMap, metalnessMap, roughnessMap, bumpMap, totalPixels };
  refreshTorsoColorTexture(texData, colors);
  return texData;
}

export function refreshTorsoColorTexture(texData, colors) {
  if (!texData) return;
  const { cCtx, imgC, zoneMask, sheenMap, colorMap, totalPixels } = texData;
  const turq = hexToRgb(colors.turquoise);
  const white = hexToRgb(colors.white);
  const groove = mixRgb(turq, { r: 4, g: 12, b: 18 }, 0.72);
  const data = imgC.data;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const zone = zoneMask[i];
    if (zone === 2) {
      data[idx] = groove.r;
      data[idx + 1] = groove.g;
      data[idx + 2] = groove.b;
    } else if (zone === 1) {
      data[idx] = white.r;
      data[idx + 1] = white.g;
      data[idx + 2] = white.b;
    } else {
      const sh = sheenMap[i];
      data[idx] = Math.min(255, Math.max(0, turq.r + Math.round(sh * 0.5)));
      data[idx + 1] = Math.min(255, Math.max(0, turq.g + sh));
      data[idx + 2] = Math.min(255, Math.max(0, turq.b + sh));
    }
  }
  cCtx.putImageData(imgC, 0, 0);
  colorMap.needsUpdate = true;
}

// Selymes profil interpolálás
export function smoothLatheProfile(pts, subdiv = 4) {
  if (!pts || pts.length < 3) return pts;
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];

    const steps = (p1.y === p2.y) ? 1 : subdiv;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const rx = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const ry = p1.y + (p2.y - p1.y) * t;
      out.push(new THREE.Vector2(Math.max(0.001, rx), ry));
    }
  }
  out.push(pts[n - 1].clone());
  return out;
}

export function getTorsoRadiusAtY(y, torsoPoints) {
  for (let i = 0; i < torsoPoints.length - 1; i++) {
    const p0 = torsoPoints[i];
    const p1 = torsoPoints[i + 1];
    if (y >= p0.y && y <= p1.y) {
      const t = (p1.y === p0.y) ? 0 : (y - p0.y) / (p1.y - p0.y);
      return p0.x + t * (p1.x - p0.x);
    }
  }
  return 0.265;
}

// A fej külső görbületére rásimuló ívelt Squircle geometria a vizorhoz
export function createCurvedVisorGeometry(width, height, cornerRadius, sphereRadius, zOffset, yOffset = -0.012) {
  const geom = new THREE.PlaneGeometry(width, height, 64, 48);
  const pos = geom.attributes.position;
  const uvs = geom.attributes.uv;

  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(cornerRadius, hw - 0.005, hh - 0.005);
  const innerW = hw - r;
  const innerH = hh - r;

  const rx = sphereRadius * 1.18;
  const ry = sphereRadius * 0.96;
  const rz = sphereRadius * 1.04;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);

    const dx = Math.max(0, Math.abs(x) - innerW);
    const dy = Math.max(0, Math.abs(y) - innerH);
    if (dx > 0 && dy > 0) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) {
        x = Math.sign(x) * (innerW + (dx / dist) * r);
        y = Math.sign(y) * (innerH + (dy / dist) * r);
      }
    }

    uvs.setXY(i, (x + hw) / width, (y + hh) / height);

    const headY = y + yOffset;
    const nx = x / rx;
    const ny = headY / ry;
    const inside = Math.max(0.04, 1.0 - nx * nx - ny * ny);
    const z = rz * Math.sqrt(inside) + zOffset;

    pos.setXYZ(i, x, headY, z);
  }

  geom.computeVertexNormals();
  return geom;
}

// A torzó görbületére (X és Y irányban is!) rásimuló kör-kijelző geometria
export function createTorsoConformingDiscGeometry(radius, centerY, zOffset, torsoPoints, bevelRim = false) {
  const geom = new THREE.PlaneGeometry(radius * 2, radius * 2, 36, 36);
  const pos = geom.attributes.position;
  const uvs = geom.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);

    const dist = Math.sqrt(x * x + y * y);
    if (dist > radius) {
      x = (x / dist) * radius;
      y = (y / dist) * radius;
    }

    const rNorm = Math.min(1.0, Math.sqrt(x * x + y * y) / radius);
    uvs.setXY(i, (x + radius) / (radius * 2), (y + radius) / (radius * 2));

    const torsoY = centerY + y;
    const R = getTorsoRadiusAtY(torsoY, torsoPoints);
    const surfaceZ = Math.sqrt(Math.max(0.01, R * R - x * x));

    let extraZ = zOffset;
    if (bevelRim) {
      if (rNorm > 0.75) {
        const rimT = (rNorm - 0.75) / 0.25;
        extraZ = zOffset * Math.sin((1.0 - rimT * 0.7) * Math.PI * 0.5) + 0.004 * Math.sin(rimT * Math.PI);
      }
    }

    pos.setXYZ(i, x, torsoY, surfaceZ + extraZ);
  }

  geom.computeVertexNormals();
  return geom;
}

// Felkar oldalsó görbületére rásimuló kör-betét geometria
export function createArmConformingBadgeGeometry(radius, centerY, sideSign, extraX, armPts) {
  const geom = new THREE.PlaneGeometry(radius * 2, radius * 2, 24, 24);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let dz = pos.getX(i);
    let dy = pos.getY(i);

    const dist = Math.sqrt(dz * dz + dy * dy);
    if (dist > radius) {
      dz = (dz / dist) * radius;
      dy = (dy / dist) * radius;
    }

    const armY = centerY + dy;
    const R = getTorsoRadiusAtY(armY, armPts);

    const baseSurfX = Math.sqrt(Math.max(0.0004, R * R - dz * dz));
    const hoodFactor = Math.max(0, (armY - (-0.044)) / (0.018 - (-0.044)));
    const tiltedY = armY + baseSurfX * 0.22 * hoodFactor;
    const shiftedX = sideSign * (baseSurfX + extraX);

    pos.setXYZ(i, shiftedX, tiltedY, sideSign > 0 ? -dz : dz);
  }

  geom.computeVertexNormals();
  return geom;
}

// 5-ujjú csuklós robotkéz felépítése
export function createArticulatedHand(sideSign, mats, fingerStore) {
  const handGroup = new THREE.Group();

  const palmGeom = new THREE.SphereGeometry(0.048, 28, 24);
  palmGeom.scale(0.95, 1.02, 0.56);
  const palmMesh = new THREE.Mesh(palmGeom, mats.whiteGloss);
  palmMesh.position.set(0, -0.038, 0.004);
  handGroup.add(palmMesh);

  const wristCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 20, 16),
    mats.darkJoint
  );
  wristCore.position.set(0, -0.004, 0);
  handGroup.add(wristCore);

  const buildFinger = (scaleLen = 1.0, scaleThick = 1.0) => {
    const fRoot = new THREE.Group();

    const k1 = new THREE.Mesh(new THREE.SphereGeometry(0.0115 * scaleThick, 16, 14), mats.darkJoint);
    fRoot.add(k1);

    const seg1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0108 * scaleThick, 0.0112 * scaleThick, 0.020 * scaleLen, 16),
      mats.turquoiseMetal
    );
    seg1.position.y = -0.013 * scaleLen;
    fRoot.add(seg1);

    const k2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0102 * scaleThick, 0.0102 * scaleThick, 0.009 * scaleLen, 16), mats.darkJoint);
    k2.position.y = -0.026 * scaleLen;
    fRoot.add(k2);

    const tipGroup = new THREE.Group();
    tipGroup.position.y = -0.031 * scaleLen;

    const tipCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0108 * scaleThick, 0.0098 * scaleThick, 0.016 * scaleLen, 16),
      mats.whiteGloss
    );
    tipCyl.position.y = -0.008 * scaleLen;
    tipGroup.add(tipCyl);

    const tipSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.0098 * scaleThick, 16, 14),
      mats.whiteGloss
    );
    tipSphere.position.y = -0.016 * scaleLen;
    tipGroup.add(tipSphere);

    fRoot.add(tipGroup);
    return fRoot;
  };

  const fingerSpecs = [
    { x:  0.030 * sideSign, y: -0.074, z: 0.007, rotZ:  0.22 * sideSign, len: 0.94, thick: 0.95 },
    { x:  0.010 * sideSign, y: -0.081, z: 0.005, rotZ:  0.06 * sideSign, len: 1.05, thick: 1.00 },
    { x: -0.011 * sideSign, y: -0.078, z: 0.003, rotZ: -0.10 * sideSign, len: 0.96, thick: 0.95 },
    { x: -0.029 * sideSign, y: -0.068, z: 0.000, rotZ: -0.26 * sideSign, len: 0.80, thick: 0.88 }
  ];

  fingerSpecs.forEach(spec => {
    const f = buildFinger(spec.len, spec.thick);
    f.position.set(spec.x, spec.y, spec.z);
    f.rotation.z = spec.rotZ;
    f.userData.baseRotZ = spec.rotZ;
    handGroup.add(f);
    fingerStore.push(f);
  });

  const thumb = buildFinger(0.86, 1.06);
  thumb.position.set(0.041 * sideSign, -0.038, 0.016);
  thumb.rotation.z = 0.72 * sideSign;
  thumb.rotation.x = 0.22;
  thumb.userData.baseRotZ = thumb.rotation.z;
  thumb.userData.isThumb = true;
  handGroup.add(thumb);
  fingerStore.push(thumb);

  return handGroup;
}

// Koaxiális 3D Robot Kar
export function createRobotArm(sideSign, mats, fingerStore, bodyGroup) {
  const socketBaseX = 0.248;
  const socketBaseY = -0.044;
  const socketTilt = 0.26;

  const torsoSocketGroup = new THREE.Group();
  torsoSocketGroup.position.set(sideSign * socketBaseX, socketBaseY, 0.0);
  torsoSocketGroup.rotation.z = sideSign * socketTilt;

  const socketOuterCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.039, 0.043, 0.036, 48),
    mats.turquoiseMetal
  );
  socketOuterCollar.rotation.z = Math.PI / 2;
  socketOuterCollar.position.x = -sideSign * 0.004;
  torsoSocketGroup.add(socketOuterCollar);

  const socketInnerCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.033, 0.035, 0.022, 48),
    mats.darkMetal
  );
  socketInnerCup.rotation.z = Math.PI / 2;
  socketInnerCup.position.x = sideSign * 0.009;
  torsoSocketGroup.add(socketInnerCup);

  const socketGroove = new THREE.Mesh(
    new THREE.TorusGeometry(0.029, 0.003, 16, 36),
    mats.darkMetal
  );
  socketGroove.rotation.y = Math.PI / 2;
  socketGroove.position.x = sideSign * 0.020;
  torsoSocketGroup.add(socketGroove);

  const socketBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.031, 36, 28),
    mats.darkJoint
  );
  socketBall.position.x = sideSign * 0.028;
  torsoSocketGroup.add(socketBall);

  if (bodyGroup) bodyGroup.add(torsoSocketGroup);

  const pivotDist = 0.042;
  const pivotX = sideSign * (socketBaseX + pivotDist * Math.cos(socketTilt));
  const pivotY = socketBaseY + pivotDist * Math.sin(socketTilt);

  const shoulderPivot = new THREE.Group();
  shoulderPivot.position.set(pivotX, pivotY, 0.0);

  const upperArmGroup = new THREE.Group();
  upperArmGroup.position.set(sideSign * 0.004, 0, 0);
  shoulderPivot.add(upperArmGroup);

  const upperArmCtrlPts = [
    new THREE.Vector2(0.001, -0.106),
    new THREE.Vector2(0.029, -0.100),
    new THREE.Vector2(0.039, -0.078),
    new THREE.Vector2(0.043, -0.046),
    new THREE.Vector2(0.040, -0.016),
    new THREE.Vector2(0.032,  0.004),
    new THREE.Vector2(0.019,  0.015),
    new THREE.Vector2(0.001,  0.018)
  ];
  const upperArmPts = smoothLatheProfile(upperArmCtrlPts, 4);
  const upperArmGeom = new THREE.LatheGeometry(upperArmPts, 48);

  const uaPos = upperArmGeom.attributes.position;
  for (let i = 0; i < uaPos.count; i++) {
    let vx = uaPos.getX(i);
    let vy = uaPos.getY(i);
    const vz = uaPos.getZ(i);

    if (sideSign * vx < 0) vx *= 0.74;
    if (vy > -0.044) {
      const hoodFactor = (vy - (-0.044)) / (0.018 - (-0.044));
      vy += (sideSign * vx) * 0.22 * hoodFactor;
    }
    uaPos.setXYZ(i, vx, vy, vz);
  }
  upperArmGeom.computeVertexNormals();

  const upperArmMesh = new THREE.Mesh(upperArmGeom, mats.whiteGloss);
  upperArmGroup.add(upperArmMesh);

  const badgeCenterY = -0.040;
  const badgeRimGeom = createArmConformingBadgeGeometry(0.0180, badgeCenterY, sideSign, 0.0012, upperArmPts);
  const badgeRimMesh = new THREE.Mesh(badgeRimGeom, mats.darkJoint);
  upperArmGroup.add(badgeRimMesh);

  const badgeDiscGeom = createArmConformingBadgeGeometry(0.0145, badgeCenterY, sideSign, 0.0022, upperArmPts);
  const badgeDiscMesh = new THREE.Mesh(badgeDiscGeom, mats.turquoiseMetal);
  upperArmGroup.add(badgeDiscMesh);

  const elbowPivot = new THREE.Group();
  elbowPivot.position.set(0, -0.118, 0);
  upperArmGroup.add(elbowPivot);

  const elbowBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 36, 28),
    mats.darkJoint
  );
  elbowPivot.add(elbowBall);

  const elbowGroove = new THREE.Mesh(
    new THREE.TorusGeometry(0.030, 0.0035, 16, 36),
    mats.darkMetal
  );
  elbowGroove.rotation.x = Math.PI / 2;
  elbowPivot.add(elbowGroove);

  const forearmLowerWhitePts = smoothLatheProfile([
    new THREE.Vector2(0.001, -0.150),
    new THREE.Vector2(0.038, -0.147),
    new THREE.Vector2(0.044, -0.133)
  ], 4);
  const forearmLowerWhiteGeom = new THREE.LatheGeometry(forearmLowerWhitePts, 48);
  forearmLowerWhiteGeom.computeVertexNormals();
  elbowPivot.add(new THREE.Mesh(forearmLowerWhiteGeom, mats.whiteGloss));

  const forearmSeamBotPts = [
    new THREE.Vector2(0.044, -0.133),
    new THREE.Vector2(0.0435, -0.1315),
    new THREE.Vector2(0.045, -0.130)
  ];
  const forearmSeamBotGeom = new THREE.LatheGeometry(forearmSeamBotPts, 48);
  forearmSeamBotGeom.computeVertexNormals();
  elbowPivot.add(new THREE.Mesh(forearmSeamBotGeom, mats.darkJoint));

  const forearmCuffPts = smoothLatheProfile([
    new THREE.Vector2(0.045, -0.130),
    new THREE.Vector2(0.047, -0.122),
    new THREE.Vector2(0.0485, -0.114)
  ], 4);
  const forearmCuffGeom = new THREE.LatheGeometry(forearmCuffPts, 48);
  forearmCuffGeom.computeVertexNormals();
  elbowPivot.add(new THREE.Mesh(forearmCuffGeom, mats.turquoiseMetal));

  const forearmSeamTopPts = [
    new THREE.Vector2(0.0485, -0.114),
    new THREE.Vector2(0.0475, -0.1125),
    new THREE.Vector2(0.049, -0.111)
  ];
  const forearmSeamTopGeom = new THREE.LatheGeometry(forearmSeamTopPts, 48);
  forearmSeamTopGeom.computeVertexNormals();
  elbowPivot.add(new THREE.Mesh(forearmSeamTopGeom, mats.darkJoint));

  const forearmUpperWhitePts = smoothLatheProfile([
    new THREE.Vector2(0.049, -0.111),
    new THREE.Vector2(0.051, -0.086),
    new THREE.Vector2(0.047, -0.048),
    new THREE.Vector2(0.033, -0.020),
    new THREE.Vector2(0.001, -0.014)
  ], 5);
  const forearmUpperWhiteGeom = new THREE.LatheGeometry(forearmUpperWhitePts, 48);
  forearmUpperWhiteGeom.computeVertexNormals();
  elbowPivot.add(new THREE.Mesh(forearmUpperWhiteGeom, mats.whiteGloss));

  const wristPivot = new THREE.Group();
  wristPivot.position.set(0, -0.150, 0);
  elbowPivot.add(wristPivot);

  const hand = createArticulatedHand(sideSign, mats, fingerStore);
  wristPivot.add(hand);

  return { shoulderPivot, elbowPivot, wristPivot };
}

// LED Vizor kirajzolása
export function updateRobotVisorCanvas(visorCtx, visorCanvas, visorTexture, robotState) {
  if (!visorCtx) return;
  const w = visorCanvas.width;
  const h = visorCanvas.height;
  const ctx = visorCtx;

  const ledRgb = hexToRgb(robotState.colors.visor);
  const ledLight = mixRgb(ledRgb, { r: 255, g: 255, b: 255 }, 0.62);
  const ledMid = mixRgb(ledRgb, { r: 255, g: 255, b: 255 }, 0.25);
  const ledDarkGap = mixRgb(ledRgb, { r: 0, g: 10, b: 18 }, 0.68);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#03080d';
  ctx.fillRect(0, 0, w, h);

  const glassGrad = ctx.createLinearGradient(0, 0, w * 0.55, h * 0.55);
  glassGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.14)');
  glassGrad.addColorStop(0.32, 'rgba(200, 245, 255, 0.05)');
  glassGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.62, 0);
  ctx.lineTo(w * 0.22, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const drawGlow = (gx, gy, gr) => {
    const g = ctx.createRadialGradient(gx, gy, gr * 0.1, gx, gy, gr);
    g.addColorStop(0, rgbToCss(ledRgb, 0.42));
    g.addColorStop(0.5, rgbToCss(ledRgb, 0.14));
    g.addColorStop(1, rgbToCss(ledRgb, 0.0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  };

  const leftEyeX = 342, rightEyeX = 682, eyeY = 302;
  const mouthX = 512, mouthY = 458;
  const dotX = 760, dotY = 116;

  drawGlow(leftEyeX, eyeY, 145);
  drawGlow(rightEyeX, eyeY, 145);
  drawGlow(mouthX, mouthY + 18, 105);
  drawGlow(dotX, dotY, 48);

  ctx.save();
  ctx.shadowColor = robotState.colors.visor;
  ctx.shadowBlur = 20;
  ctx.fillStyle = robotState.colors.visor;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgbToCss(ledLight);
  ctx.beginPath();
  ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const fillWithScanlines = (drawPathFn) => {
    ctx.save();
    ctx.shadowColor = robotState.colors.visor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = robotState.colors.visor;
    drawPathFn();
    ctx.fill();

    ctx.clip();
    ctx.shadowBlur = 0;

    const coreGrad = ctx.createLinearGradient(0, 140, 0, 540);
    coreGrad.addColorStop(0, rgbToCss(ledLight));
    coreGrad.addColorStop(0.5, rgbToCss(ledMid));
    coreGrad.addColorStop(1, robotState.colors.visor);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, w, h);

    for (let sy = 0; sy < h; sy += 10) {
      ctx.fillStyle = rgbToCss(ledDarkGap, 0.54);
      ctx.fillRect(0, sy, w, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.fillRect(0, sy + 5, w, 3);
    }
    ctx.restore();
  };

  const expr = robotState.expression;
  const blinkScaleY = robotState.isBlinking ? 0.12 : 1.0;
  const eyeRx = 74;
  const eyeRyBase = 94;

  if (expr === 'photo' || expr === 'curious') {
    const lRy = (expr === 'curious' ? 104 : eyeRyBase) * blinkScaleY;
    const rRy = (expr === 'curious' ? 80 : eyeRyBase) * blinkScaleY;

    fillWithScanlines(() => {
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, eyeRx, Math.max(10, lRy), 0, 0, Math.PI * 2);
    });

    fillWithScanlines(() => {
      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY, eyeRx, Math.max(10, rRy), 0, 0, Math.PI * 2);
    });
  } else if (expr === 'happy') {
    [leftEyeX, rightEyeX].forEach(ex => {
      fillWithScanlines(() => {
        ctx.beginPath();
        ctx.arc(ex, eyeY + 34, 72, Math.PI * 1.12, Math.PI * 1.88, false);
        ctx.arc(ex, eyeY + 34, 40, Math.PI * 1.88, Math.PI * 1.12, true);
        ctx.closePath();
      });
    });
  } else if (expr === 'wink') {
    fillWithScanlines(() => {
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, eyeRx, Math.max(10, eyeRyBase * blinkScaleY), 0, 0, Math.PI * 2);
    });
    fillWithScanlines(() => {
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY + 28, 70, Math.PI * 1.12, Math.PI * 1.88, false);
      ctx.arc(rightEyeX, eyeY + 28, 40, Math.PI * 1.88, Math.PI * 1.12, true);
      ctx.closePath();
    });
  }

  fillWithScanlines(() => {
    ctx.beginPath();
    if (robotState.pose === 'talk') {
      const openH = 24 + Math.abs(Math.sin(robotState.talkMouthPhase)) * 28;
      ctx.ellipse(mouthX, mouthY + 18, 56, openH, 0, 0, Math.PI * 2);
    } else if (expr === 'curious') {
      ctx.ellipse(mouthX, mouthY + 22, 34, 28, 0, 0, Math.PI * 2);
    } else {
      const mw = 60, mh = 44;
      ctx.moveTo(mouthX - mw, mouthY);
      ctx.quadraticCurveTo(mouthX, mouthY + 6, mouthX + mw, mouthY);
      ctx.bezierCurveTo(mouthX + mw, mouthY + mh * 1.35, mouthX - mw, mouthY + mh * 1.35, mouthX - mw, mouthY);
      ctx.closePath();
    }
  });

  if (visorTexture) visorTexture.needsUpdate = true;
}

// Has / Mellkas Kör-Kijelző textúra
export function updateRobotChestCoreCanvas(chestCtx, chestCanvas, chestTexture, robotState, timeSec = 0) {
  if (!chestCtx) return;
  const w = chestCanvas.width;
  const h = chestCanvas.height;
  const cx = w / 2, cy = h / 2;
  const ctx = chestCtx;

  ctx.clearRect(0, 0, w, h);

  if (robotState.coreMode === 'message') {
    const msgRgb = hexToRgb(robotState.colors.coreMsg);
    const msgWhite = mixRgb(msgRgb, { r: 255, g: 255, b: 255 }, 0.85);
    const msgLight = mixRgb(msgRgb, { r: 255, g: 255, b: 255 }, 0.45);
    const msgDark = mixRgb(msgRgb, { r: 10, g: 5, b: 0 }, 0.65);
    const msgDeep = mixRgb(msgRgb, { r: 5, g: 2, b: 0 }, 0.88);

    const flash = 0.5 + 0.5 * Math.sin(timeSec * 8.5);
    const bgGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, w * 0.48);
    if (flash > 0.35) {
      bgGrad.addColorStop(0.0, rgbToCss(msgWhite));
      bgGrad.addColorStop(0.45, rgbToCss(msgLight));
      bgGrad.addColorStop(0.80, robotState.colors.coreMsg);
      bgGrad.addColorStop(1.0, rgbToCss(msgDark));
    } else {
      bgGrad.addColorStop(0.0, rgbToCss(msgLight));
      bgGrad.addColorStop(0.45, robotState.colors.coreMsg);
      bgGrad.addColorStop(0.85, rgbToCss(msgDark));
      bgGrad.addColorStop(1.0, rgbToCss(msgDeep));
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    for (let sy = 0; sy < h; sy += 10) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fillRect(0, sy, w, 3);
    }

    const ringR = 62 + flash * 34;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + flash * 0.55})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = flash > 0.35 ? rgbToCss(msgDeep) : rgbToCss(msgWhite);
    fillRoundedRect(ctx, cx - 13, cy - 56, 26, 68, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 38, 14, 0, Math.PI * 2);
    ctx.fill();

  } else if (robotState.coreMode === 'pulse') {
    const bgGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, w * 0.48);
    bgGrad.addColorStop(0.0, '#a7f3d0');
    bgGrad.addColorStop(0.45, '#10b981');
    bgGrad.addColorStop(0.82, '#065f46');
    bgGrad.addColorStop(1.0, '#041f18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    for (let sy = 0; sy < h; sy += 10) {
      ctx.fillStyle = 'rgba(2, 44, 34, 0.28)';
      ctx.fillRect(0, sy, w, 3);
    }

    const r1 = 32 + ((timeSec * 65) % 76);
    ctx.strokeStyle = 'rgba(209, 250, 229, 0.85)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.stroke();

  } else {
    const baseRgb = hexToRgb(robotState.colors.coreBase);
    const baseWhite = mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.82);
    const baseLight = mixRgb(baseRgb, { r: 255, g: 255, b: 255 }, 0.38);
    const baseDark = mixRgb(baseRgb, { r: 6, g: 10, b: 22 }, 0.68);
    const baseDeep = mixRgb(baseRgb, { r: 4, g: 7, b: 16 }, 0.88);

    ctx.fillStyle = rgbToCss(baseDeep);
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, w * 0.46);
    grad.addColorStop(0.0, rgbToCss(baseWhite));
    grad.addColorStop(0.38, rgbToCss(baseLight));
    grad.addColorStop(0.72, robotState.colors.coreBase);
    grad.addColorStop(0.92, rgbToCss(baseDark));
    grad.addColorStop(1.0, rgbToCss(baseDeep));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let sy = 0; sy < h; sy += 10) {
      ctx.fillStyle = 'rgba(6, 10, 24, 0.32)';
      ctx.fillRect(0, sy, w, 3);
    }

    ctx.strokeStyle = rgbToCss(baseWhite, 0.85);
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, 86, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (chestTexture) chestTexture.needsUpdate = true;
}

// ----------------------------------------------------------------------
// TELJES 3D ROBOT MODELL ÖSSZEÁLLÍTÁSA
// ----------------------------------------------------------------------
export function buildRobotModel(robotState) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const headTexData = createHeadTextures(robotState.colors);
  const torsoTexData = createTorsoPBRTextures(robotState.colors);

  const turqRgb = hexToRgb(robotState.colors.turquoise);
  const earCapRgb = mixRgb(turqRgb, { r: 180, g: 255, b: 255 }, 0.35);

  const mats = {
    headWhite: new THREE.MeshPhysicalMaterial({
      map: headTexData.colorTex,
      bumpMap: headTexData.bumpTex,
      bumpScale: 0.003,
      roughness: 0.15,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.95
    }),
    whiteGloss: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(robotState.colors.white),
      roughness: 0.15,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.95,
      side: THREE.DoubleSide
    }),
    turquoiseMetal: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(robotState.colors.turquoise),
      roughness: 0.22,
      metalness: 0.58,
      clearcoat: 0.55,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.05,
      side: THREE.DoubleSide
    }),
    turquoiseLightCap: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(rgbToCss(earCapRgb)),
      roughness: 0.18,
      metalness: 0.32,
      clearcoat: 0.75,
      clearcoatRoughness: 0.10,
      envMapIntensity: 1.0
    }),
    torsoDualMat: new THREE.MeshPhysicalMaterial({
      map: torsoTexData.colorMap,
      metalnessMap: torsoTexData.metalnessMap,
      roughnessMap: torsoTexData.roughnessMap,
      bumpMap: torsoTexData.bumpMap,
      bumpScale: 0.004,
      metalness: 1.0,
      roughness: 1.0,
      clearcoat: 0.75,
      clearcoatRoughness: 0.10,
      envMapIntensity: 1.05
    }),
    darkJoint: new THREE.MeshStandardMaterial({
      color: new THREE.Color(robotState.colors.joint),
      roughness: 0.36,
      metalness: 0.65,
      envMapIntensity: 0.85,
      side: THREE.DoubleSide
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: new THREE.Color(robotState.colors.joint).multiplyScalar(0.65),
      roughness: 0.25,
      metalness: 0.8,
      side: THREE.DoubleSide
    })
  };

  // 1. Torzó
  const torsoCtrlPoints = [
    new THREE.Vector2(0.001, -0.450),
    new THREE.Vector2(0.055, -0.448),
    new THREE.Vector2(0.115, -0.432),
    new THREE.Vector2(0.168, -0.390),
    new THREE.Vector2(0.215, -0.320),
    new THREE.Vector2(0.250, -0.230),
    new THREE.Vector2(0.268, -0.130),
    new THREE.Vector2(0.265, -0.050),
    new THREE.Vector2(0.238,  0.010),
    new THREE.Vector2(0.185,  0.040),
    new THREE.Vector2(0.150,  0.045),
    new THREE.Vector2(0.001,  0.045)
  ];
  const torsoPoints = smoothLatheProfile(torsoCtrlPoints, 5);
  const torsoGeom = new THREE.LatheGeometry(torsoPoints, 96, Math.PI, Math.PI * 2);

  const tPos = torsoGeom.attributes.position;
  const tUvs = torsoGeom.attributes.uv;
  for (let i = 0; i < tPos.count; i++) {
    const vy = tPos.getY(i);
    const vNorm = Math.max(0, Math.min(1, (vy - (-0.450)) / (0.045 - (-0.450))));
    tUvs.setY(i, vNorm);
  }
  torsoGeom.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeom, mats.torsoDualMat);
  bodyGroup.add(torsoMesh);

  // Nyakgyűrűk
  const neckCollar = new THREE.Mesh(
    new THREE.TorusGeometry(0.162, 0.016, 20, 48),
    mats.turquoiseMetal
  );
  neckCollar.rotation.x = Math.PI / 2;
  neckCollar.position.y = 0.044;
  bodyGroup.add(neckCollar);

  const neckInnerRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.148, 0.035, 36),
    mats.darkJoint
  );
  neckInnerRing.position.y = 0.062;
  bodyGroup.add(neckInnerRing);

  // 2. Has OLED kijelző
  const chestCenterY = -0.145;
  const chestBezelGeom = createTorsoConformingDiscGeometry(0.074, chestCenterY, 0.004, torsoPoints, true);
  const chestBezelMesh = new THREE.Mesh(chestBezelGeom, mats.darkJoint);
  bodyGroup.add(chestBezelMesh);

  const chestCanvas = document.createElement('canvas');
  chestCanvas.width = 256; chestCanvas.height = 256;
  const chestCtx = chestCanvas.getContext('2d');
  const chestTexture = new THREE.CanvasTexture(chestCanvas);
  updateRobotChestCoreCanvas(chestCtx, chestCanvas, chestTexture, robotState, 0);

  const chestCoreMat = new THREE.MeshBasicMaterial({ map: chestTexture });
  const chestScreenGeom = createTorsoConformingDiscGeometry(0.061, chestCenterY, 0.007, torsoPoints, false);
  const chestCoreDisc = new THREE.Mesh(chestScreenGeom, chestCoreMat);
  bodyGroup.add(chestCoreDisc);

  // 3. Fej és vizor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.264, 0);
  headGroup.scale.setScalar(0.88);
  bodyGroup.add(headGroup);

  const headRadius = 0.315;
  const headGeom = new THREE.SphereGeometry(headRadius, 64, 48);
  headGeom.rotateY(-Math.PI / 2);
  headGeom.scale(1.18, 0.96, 1.04);
  const headMesh = new THREE.Mesh(headGeom, mats.headWhite);
  headGroup.add(headMesh);

  const visorRimGeom = createCurvedVisorGeometry(0.558, 0.368, 0.142, headRadius, 0.007, -0.012);
  const visorRimMesh = new THREE.Mesh(visorRimGeom, mats.darkJoint);
  headGroup.add(visorRimMesh);

  const visorCanvas = document.createElement('canvas');
  visorCanvas.width = 1024;
  visorCanvas.height = 680;
  const visorCtx = visorCanvas.getContext('2d');
  const visorTexture = new THREE.CanvasTexture(visorCanvas);
  visorTexture.anisotropy = 4;
  updateRobotVisorCanvas(visorCtx, visorCanvas, visorTexture, robotState);

  const visorScreenGeom = createCurvedVisorGeometry(0.534, 0.346, 0.134, headRadius, 0.013, -0.012);
  const visorLedMat = new THREE.MeshBasicMaterial({ map: visorTexture });
  const visorScreenMesh = new THREE.Mesh(visorScreenGeom, visorLedMat);
  headGroup.add(visorScreenMesh);

  // Fülek (bal és jobb)
  [-1, 1].forEach(side => {
    const earGroup = new THREE.Group();
    earGroup.position.set(side * 0.352, -0.012, 0.0);
    earGroup.rotation.z = -side * 0.05;

    const earBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.124, 0.044, 40),
      mats.turquoiseMetal
    );
    earBase.rotation.z = Math.PI / 2;
    earGroup.add(earBase);

    const earGroove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 0.050, 40),
      mats.darkJoint
    );
    earGroove.rotation.z = Math.PI / 2;
    earGroove.position.x = side * 0.004;
    earGroup.add(earGroove);

    const earMidCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.100, 0.056, 40),
      mats.turquoiseMetal
    );
    earMidCyl.rotation.z = Math.PI / 2;
    earMidCyl.position.x = side * 0.008;
    earGroup.add(earMidCyl);

    const earCapGeom = new THREE.SphereGeometry(0.082, 32, 24);
    earCapGeom.scale(0.34, 1.0, 1.0);
    const earCap = new THREE.Mesh(earCapGeom, mats.turquoiseLightCap);
    earCap.position.x = side * 0.030;
    earGroup.add(earCap);

    headGroup.add(earGroup);
  });

  // 4. Karok
  const rightFingers = [];
  const leftFingers = [];

  const rightArm = createRobotArm(-1, mats, rightFingers, bodyGroup);
  bodyGroup.add(rightArm.shoulderPivot);

  const leftArm = createRobotArm(1, mats, leftFingers, bodyGroup);
  bodyGroup.add(leftArm.shoulderPivot);

  return {
    root,
    bodyGroup,
    headGroup,
    headMesh,
    torsoMesh,
    chestCoreDisc,
    chestCanvas,
    chestCtx,
    chestTexture,
    visorCanvas,
    visorCtx,
    visorTexture,
    rightArm,
    leftArm,
    rightFingers,
    leftFingers,
    mats,
    headTexData,
    torsoTexData
  };
}

// ----------------------------------------------------------------------
// PÓZOK ÉS ANIMÁCIÓ FRISSÍTÉSE
// ----------------------------------------------------------------------
export function applyRobotPoseAndAnimation(model, robotState, dt, timeSec) {
  const { bodyGroup, headGroup, rightArm, leftArm, rightFingers, leftFingers, visorCtx, visorCanvas, visorTexture, chestCtx, chestCanvas, chestTexture } = model;
  const t = timeSec;

  // Pislogás
  robotState.blinkTimer += dt;
  if (!robotState.isBlinking && robotState.blinkTimer > 3.8) {
    robotState.isBlinking = true;
    robotState.blinkTimer = 0;
    updateRobotVisorCanvas(visorCtx, visorCanvas, visorTexture, robotState);
  } else if (robotState.isBlinking && robotState.blinkTimer > 0.14) {
    robotState.isBlinking = false;
    robotState.blinkTimer = 0;
    updateRobotVisorCanvas(visorCtx, visorCanvas, visorTexture, robotState);
  }

  // Beszéd szájmozgás
  if (robotState.pose === 'talk') {
    robotState.talkMouthPhase += dt * 14;
    updateRobotVisorCanvas(visorCtx, visorCanvas, visorTexture, robotState);
  }

  // Has kijelző animáció (üzenetnél vagy pulzusnál)
  if (robotState.coreMode === 'message' || robotState.coreMode === 'pulse') {
    updateRobotChestCoreCanvas(chestCtx, chestCanvas, chestTexture, robotState, t);
  }

  // Lebegő mozgás
  const hoverY = Math.sin(t * 2.2) * 0.022;
  bodyGroup.position.y = hoverY;

  // Karok póz szerint
  if (robotState.pose === 'wave') {
    headGroup.rotation.y = Math.sin(t * 1.5) * 0.03;
    headGroup.rotation.z = -0.02;
    headGroup.rotation.x = 0.02;

    rightArm.shoulderPivot.rotation.set(-0.14, 0.0, -1.12 + Math.sin(t * 4.2) * 0.06);
    rightArm.elbowPivot.rotation.set(-0.20, 0.0, -0.52 + Math.sin(t * 4.2) * 0.10);
    rightArm.wristPivot.rotation.set(-0.05, 0.12, Math.sin(t * 4.2) * 0.06);

    rightFingers.forEach((f) => {
      f.rotation.x = f.userData.isThumb ? 0.15 : -0.04;
      f.rotation.z = f.userData.baseRotZ;
    });

    leftArm.shoulderPivot.rotation.set(0.05, 0.0, 0.20 + Math.sin(t * 2.2) * 0.02);
    leftArm.elbowPivot.rotation.set(-0.24, 0.0, -0.10);
    leftArm.wristPivot.rotation.set(0.06, -0.45, -0.06);

    leftFingers.forEach((f) => {
      f.rotation.x = f.userData.isThumb ? 0.32 : 0.26;
      f.rotation.z = f.userData.baseRotZ;
    });

  } else if (robotState.pose === 'idle') {
    headGroup.rotation.y = Math.sin(t * 1.2) * 0.06;
    headGroup.rotation.z = Math.cos(t * 1.0) * 0.015;
    headGroup.rotation.x = Math.sin(t * 1.8) * 0.025;

    rightArm.shoulderPivot.rotation.set(0.05, 0.0, -0.20 - Math.sin(t * 2.2) * 0.025);
    rightArm.elbowPivot.rotation.set(-0.24, 0.0, 0.10);
    rightArm.wristPivot.rotation.set(0.05, 0.45, 0.05);

    leftArm.shoulderPivot.rotation.set(0.05, 0.0, 0.20 + Math.sin(t * 2.2) * 0.025);
    leftArm.elbowPivot.rotation.set(-0.24, 0.0, -0.10);
    leftArm.wristPivot.rotation.set(0.05, -0.45, -0.05);

    rightFingers.forEach(f => { f.rotation.x = 0.24; });
    leftFingers.forEach(f => { f.rotation.x = 0.24; });

  } else if (robotState.pose === 'talk') {
    headGroup.rotation.y = Math.sin(t * 2.8) * 0.08;
    headGroup.rotation.x = Math.abs(Math.sin(t * 5.0)) * 0.04;
    headGroup.rotation.z = Math.sin(t * 2.0) * 0.025;

    rightArm.shoulderPivot.rotation.set(-0.22, 0.0, -0.58 + Math.sin(t * 5.0) * 0.08);
    rightArm.elbowPivot.rotation.set(-0.52, 0.0, -0.35 + Math.sin(t * 5.0) * 0.08);
    rightArm.wristPivot.rotation.set(0, 0.20, Math.sin(t * 6.0) * 0.08);

    leftArm.shoulderPivot.rotation.set(-0.20, 0.0, 0.52 - Math.cos(t * 4.5) * 0.08);
    leftArm.elbowPivot.rotation.set(-0.48, 0.0, 0.32 - Math.cos(t * 4.5) * 0.08);
    leftArm.wristPivot.rotation.set(0, -0.20, 0);

    rightFingers.forEach(f => { f.rotation.x = 0.08; });
    leftFingers.forEach(f => { f.rotation.x = 0.08; });

  } else if (robotState.pose === 'happy') {
    bodyGroup.position.y = Math.abs(Math.sin(t * 6.0)) * 0.045;
    headGroup.rotation.y = Math.sin(t * 4.0) * 0.08;
    headGroup.rotation.x = -0.05;

    rightArm.shoulderPivot.rotation.set(-0.18, 0.0, -1.15 + Math.sin(t * 8.0) * 0.10);
    rightArm.elbowPivot.rotation.set(-0.22, 0.0, -0.55 + Math.sin(t * 8.0) * 0.10);
    rightArm.wristPivot.rotation.set(0, 0.15, 0);

    leftArm.shoulderPivot.rotation.set(-0.18, 0.0, 1.15 - Math.sin(t * 8.0) * 0.10);
    leftArm.elbowPivot.rotation.set(-0.22, 0.0, 0.55 - Math.sin(t * 8.0) * 0.10);
    leftArm.wristPivot.rotation.set(0, -0.15, 0);

    rightFingers.forEach(f => { f.rotation.x = -0.05; });
    leftFingers.forEach(f => { f.rotation.x = -0.05; });
  }
}
