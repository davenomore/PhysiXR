import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Particles } from './particles.js';
import { HOTSPOTS } from './content.js';

// Procedurális fagyos jég felszíni egyenetlenség (bump map) repedésekkel és mikroszerkezettel
function createIceBumpMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 36;
    data[i] = n;
    data[i + 1] = n;
    data[i + 2] = n;
  }
  ctx.putImageData(imgData, 0, 0);

  // Finom belső fagyásvonalak és repedések
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 45;
      y += (Math.random() - 0.5) * 45;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  return tex;
}

// Eredeti, lágy szélű, belül izzó sárgás-fehér, kívül vöröses-narancssárga láng textúra
function createFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.25, 'rgba(255, 210, 60, 0.95)');
  g.addColorStop(0.55, 'rgba(255, 90, 10, 0.75)');
  g.addColorStop(0.85, 'rgba(220, 30, 0, 0.35)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Textúra hűtéshez: lágy kék jégkristályos izzás
function createColdTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  g.addColorStop(0.3, 'rgba(120, 220, 255, 0.9)');
  g.addColorStop(0.65, 'rgba(0, 140, 255, 0.6)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A sandbox: üvegkocka, égő, plató és a dinamikusan megjelenő/eltűnő infó-gömbök
export class Sandbox {
  constructor() {
    this.root = new THREE.Group();
    this.particles = new Particles(this.root);

    // Üvegedény: fix 2x2x2-es kristálytiszta üvegkocka
    const g = new THREE.BoxGeometry(2, 2, 2);
    this.glass = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({
        color: 0x9fc4ff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(g),
      new THREE.LineBasicMaterial({ color: 0xc4dcff, transparent: true, opacity: 0.9 })
    );
    this.glass.position.y = this.edges.position.y = 0;
    this.root.add(this.glass, this.edges);

    // Makroszkopikus valódi jégkocka megjelenés: kitölti a 2x2-es kockát, szerves, természetes belsővel (nem szabályos doboz!)
    this.macroIceGroup = new THREE.Group();
    this.macroIceGroup.position.set(0, 0, 0);
    this.root.add(this.macroIceGroup);

    // 1. Külső fagyott jégtest: kitölti a tartályt (1.94x1.94x1.94), finoman kerekített élekkel
    const iceGeo = new RoundedBoxGeometry(1.94, 1.94, 1.94, 6, 0.08);
    this.iceMat = new THREE.MeshStandardMaterial({
      color: 0xebf7ff,
      roughness: 0.16,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      bumpMap: createIceBumpMap(),
      bumpScale: 0.016,
      depthWrite: false
    });
    this.macroIceMesh = new THREE.Mesh(iceGeo, this.iceMat);
    this.macroIceGroup.add(this.macroIceMesh);

    // 2. Természetes légbuborékok a jégkocka belsejében szétszórva (nem csak a közepén, szigorúan a jégkocka belsejében)
    const bubbleGeo = new THREE.SphereGeometry(1, 10, 8);
    this.bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.08,
      transparent: true,
      opacity: 0.80
    });

    const BUBBLE_COUNT = 96;
    this.bubbles = new THREE.InstancedMesh(bubbleGeo, this.bubbleMat, BUBBLE_COUNT);
    const d = new THREE.Object3D();

    // Természetes fagyási sávok 8 különböző oszlopban + a teljes kockatérben szórt mikrobuborékok
    // A jégkocka mérete 1.94x1.94x1.94 (félméret 0.97). A buborékok szigorúan a belső [-0.80, 0.80] tartományban maradnak!
    const colCenters = [
      [-0.55, -0.45],
      [0.50, -0.40],
      [-0.45, 0.50],
      [0.45, 0.45],
      [-0.20, -0.15],
      [0.25, 0.20],
      [0.0, -0.45],
      [-0.40, 0.0]
    ];

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      let bx, by, bz, bs;

      if (i < 48) {
        // Fagyási buborékoszlopok (8 oszlop, oszloponként 6 buborék alulról felfelé)
        const colIdx = Math.floor(i / 6);
        const stepInCol = i % 6;
        const [cx, cz] = colCenters[colIdx];
        bx = cx + (Math.sin(i * 3.7) * 0.10);
        by = -0.72 + (stepInCol / 5) * 1.44 + (Math.cos(i * 2.3) * 0.05);
        bz = cz + (Math.cos(i * 4.1) * 0.10);
        bs = 0.012 + (Math.sin(i * 1.9) * 0.5 + 0.5) * 0.020;
      } else {
        // A teljes kocka belső terében elszórt apró mikrobuborékok
        bx = ((Math.sin(i * 9.17) * 43758.5453) % 1) * 1.50 - 0.75;
        by = ((Math.cos(i * 7.31) * 23421.631) % 1) * 1.50 - 0.75;
        bz = ((Math.sin(i * 13.73) * 12345.678) % 1) * 1.50 - 0.75;
        bs = 0.008 + (Math.abs(Math.sin(i * 5.3)) * 0.015);
      }

      // Szigorú korlátozás: egyetlen buborék sem hagyhatja el a jégkockát vagy kerülhet a levegőbe!
      bx = THREE.MathUtils.clamp(bx, -0.80, 0.80);
      by = THREE.MathUtils.clamp(by, -0.80, 0.80);
      bz = THREE.MathUtils.clamp(bz, -0.80, 0.80);

      d.position.set(bx, by, bz);
      d.scale.setScalar(bs);
      d.updateMatrix();
      this.bubbles.setMatrixAt(i, d.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
    this.macroIceGroup.add(this.bubbles);

    this.transitionProgress = 0;
    this.setTransitionProgress(0); // Kezdetben makroszkopikus jégkocka látható

    // Égő és alsó plató: szögletes (cuboid) forma a kocka geometriájához illeszkedve
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x242836, roughness: 0.5, metalness: 0.3 });
    const burnerGeo = new THREE.BoxGeometry(1.5, 0.20, 1.5);
    const burner = new THREE.Mesh(burnerGeo, darkMat);
    burner.position.y = -1.55;

    const burnerEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(burnerGeo),
      new THREE.LineBasicMaterial({ color: 0x4a5568, transparent: true, opacity: 0.6 })
    );
    burner.add(burnerEdges);

    // Belső égőrács a láng alatt
    const grateGeo = new THREE.BoxGeometry(1.2, 0.03, 1.2);
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x161820, roughness: 0.8 });
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.y = 0.10;
    burner.add(grate);

    // Alsó szögletes plató
    const plateGeo = new THREE.BoxGeometry(2.6, 0.08, 2.6);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x181c26, roughness: 0.7, metalness: 0.2 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -1.72;

    const plateEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(plateGeo),
      new THREE.LineBasicMaterial({ color: 0x3d4659, transparent: true, opacity: 0.5 })
    );
    plate.add(plateEdges);

    this.root.add(burner, plate);

    // LÁNG RENDSZER (Az eredeti fizikai és vizuális modell szerint, lágy alsó beúszással)
    this.flameN = 32;
    this.flameTex = createFlameTexture();
    this.coldTex = createColdTexture();

    this.flameGroup = new THREE.Group();
    this.root.add(this.flameGroup);

    this.flameSprites = [];
    for (let i = 0; i < this.flameN; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.flameTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.renderOrder = 22;
      this.flameGroup.add(sprite);
      this.flameSprites.push(sprite);
    }

    this.glow = new THREE.PointLight(0xff8a30, 0, 16);
    this.glow.position.set(0, -1.35, 0);
    this.root.add(this.glow);

    // Infó-gömbök létrehozása (a content.js HOTSPOTS definíciói alapján)
    this.hotspotMeshes = HOTSPOTS.map(h => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.20, 20, 14),
        new THREE.MeshStandardMaterial({
          color: 0xffd54a,
          emissive: 0xffa000,
          emissiveIntensity: 0.6,
          roughness: 0.3
        })
      );
      m.position.set(...h.pos);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.letterTexture('i'), depthTest: false, transparent: true }));
      sprite.scale.set(0.28, 0.28, 1);
      sprite.position.set(0, 0, 0.0);
      sprite.renderOrder = 20;
      m.add(sprite);
      m.userData = { data: h };
      m.visible = false; // Kezdetben a játékállapot vezérli
      this.root.add(m);
      return m;
    });
  }

  get hotspots() {
    return this.hotspotMeshes;
  }

  setTransitionProgress(p) {
    this.transitionProgress = p;
    this.particles?.setTransitionProgress(p);

    if (!this.macroIceGroup) return;

    if (p <= 0.001) {
      this.macroIceGroup.visible = true;
      this.iceMat.opacity = 0.90;
      if (this.bubbleMat) this.bubbleMat.opacity = 0.80;
      this.macroIceGroup.scale.setScalar(1.0);
    } else if (p >= 0.999) {
      this.macroIceGroup.visible = false;
    } else {
      this.macroIceGroup.visible = true;
      const fade = 1 - p;
      this.iceMat.opacity = fade * 0.90;
      if (this.bubbleMat) this.bubbleMat.opacity = fade * 0.80;
      this.macroIceGroup.scale.setScalar(1.0 + p * 0.04);
    }
  }

  setParticleModel(mode) {
    this.particles.setModelMode(mode);
  }

  get particleModel() {
    return this.particles.modelMode;
  }

  letterTexture(ch) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#222';
    x.font = 'bold 52px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(ch, 32, 36);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  update(sim, game, dt, t) {
    this.particles.update(sim, game, dt, t);

    const pw = sim.power;
    const a = Math.abs(pw);
    const isFlame = pw > 0;

    // A láng CSAK akkor ég, ha aktívan be van kapcsolva a fűtés (pw > 0) vagy a hűtés (pw < 0)!
    // Készenlétben és indítás előtt (pw === 0) a hideg -10 fokos jégkocka alatt NINCS tűz!
    const activeFire = Math.abs(pw) > 0.01;
    this.flameGroup.visible = activeFire;
    this.glow.intensity = activeFire ? (isFlame ? 3.0 + pw * 7.0 : a * 6.0) : 0;
    this.glow.color.set(isFlame ? 0xff6b1a : 0x00b4d8);

    if (activeFire) {
      const h = isFlame ? (0.35 + pw * 0.75) : (0.2 + a * 0.5);

      for (let i = 0; i < this.flameN; i++) {
        const sprite = this.flameSprites[i];
        sprite.material.map = isFlame ? this.flameTex : this.coldTex;

        // Fázis és pozíció számítása pontosan az eredeti fizikai modell szerint
        const ph = (t * 0.0013 * (0.8 + a) + i / this.flameN) % 1;
        const radiusFactor = isFlame ? (1 - ph) : (1 - ph * 0.3);
        const x = Math.sin(i * 12.9) * 0.45 * radiusFactor;
        const z = Math.cos(i * 7.1) * 0.45 * radiusFactor;
        const y = -1.40 + ph * h;

        // Átmérő skálázás az eredeti modell alapján
        const r = isFlame
          ? (1 - ph) * (0.16 + a * 0.16) + 0.03
          : 0.06 + 0.06 * Math.sin(ph * Math.PI);

        // Finom alsó beúszás (soha sincs éles elvágás)
        const baseFade = Math.min(1.0, ph * 5.0);

        sprite.position.set(x, y, z);
        sprite.scale.set(r * 2.2, r * 2.2, 1);
        sprite.material.opacity = Math.max(0, baseFade * (1 - ph) * (0.7 + a * 0.3));
      }
    }

    // A lebegő infó gömbök helyett a tutor hasán jelenik meg az (i) gomb!
    this.hotspotMeshes.forEach(m => {
      m.visible = false;
    });
  }
}
