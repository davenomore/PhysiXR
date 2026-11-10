import * as THREE from 'three';
import { PHASE } from './sim.js';

// Részecskék az edény belső terében:
// Az edény geometriája: 2x2x2 méretű tiszta üvegkocka, X: [-1 .. +1], Y: [-1 .. +1], Z: [-1 .. +1]
// Hexagonális jégkristályrács (Ice Ih) elrendezés halvány hidrogénkötésekkel és kiemelt hatszöggel
const R = 0.050;
const BOUND = 0.88;

// Fizikai paraméterek az élethű H2O vízmolekulához és Ice Ih kristályrácshoz:
const BOND_DIST = 0.048; // O-H kovalens kötéshossz
const TETRA_THETA = 109.4712 * (Math.PI / 180); // tetraéderes kötésszög (109.47°)
const TETRA_HALF = TETRA_THETA / 2;

const H_LOCALS = [
  new THREE.Vector3(BOND_DIST * Math.sin(TETRA_HALF), BOND_DIST * Math.cos(TETRA_HALF), 0),
  new THREE.Vector3(-BOND_DIST * Math.sin(TETRA_HALF), BOND_DIST * Math.cos(TETRA_HALF), 0)
];

// Valódi H2O Vízmolekula geometria generálása a jégkristály modell szerint:
// 1 Oxigén (élénk piros, #e6192b) + 2 Hidrogén (tiszta fehér, #ffffff)
// A jégkristályban a tetraéderes kötésszög 109.47°, kovalens O-H kötéshengerekkel
function createH2OGeometry() {
  const oRadius = 0.038;
  const hRadius = 0.021;
  const bondRadius = 0.007;

  // H1 és H2 pozíciók az XY síkban, a felező a +Y tengely felé mutat
  const h1x = H_LOCALS[0].x;
  const h1y = H_LOCALS[0].y;
  const h2x = H_LOCALS[1].x;
  const h2y = H_LOCALS[1].y;

  // Oxigén gömb a (0, 0, 0)-ban
  const oGeo = new THREE.SphereGeometry(oRadius, 16, 12);

  // Hidrogén gömbök
  const h1Geo = new THREE.SphereGeometry(hRadius, 12, 10);
  h1Geo.translate(h1x, h1y, 0);

  const h2Geo = new THREE.SphereGeometry(hRadius, 12, 10);
  h2Geo.translate(h2x, h2y, 0);

  // Kovalens kötéshengerek az O és a H-k között
  const b1Geo = new THREE.CylinderGeometry(bondRadius, bondRadius, BOND_DIST, 8);
  b1Geo.translate(0, BOND_DIST / 2, 0);
  b1Geo.rotateZ(-TETRA_HALF);

  const b2Geo = new THREE.CylinderGeometry(bondRadius, bondRadius, BOND_DIST, 8);
  b2Geo.translate(0, BOND_DIST / 2, 0);
  b2Geo.rotateZ(TETRA_HALF);

  const geos = [
    { geo: oGeo, color: [0.90, 0.10, 0.17] },  // Oxigén: élénk CPK vörös (#e6192b)
    { geo: h1Geo, color: [0.98, 0.98, 1.00] }, // Hidrogén 1: tiszta fehér
    { geo: h2Geo, color: [0.98, 0.98, 1.00] }, // Hidrogén 2: tiszta fehér
    { geo: b1Geo, color: [0.85, 0.88, 0.92] }, // Kötés 1: világos ezüstös-fehér
    { geo: b2Geo, color: [0.85, 0.88, 0.92] }  // Kötés 2: világos ezüstös-fehér
  ];

  let totalVerts = 0, totalIndices = 0;
  geos.forEach(({ geo }) => {
    totalVerts += geo.attributes.position.count;
    totalIndices += geo.index.count;
  });

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  const indices = new Uint16Array(totalIndices);

  let vertOffset = 0, indexOffset = 0;

  geos.forEach(({ geo, color }) => {
    const p = geo.attributes.position.array;
    const n = geo.attributes.normal.array;
    const count = geo.attributes.position.count;

    positions.set(p, vertOffset * 3);
    normals.set(n, vertOffset * 3);

    for (let i = 0; i < count; i++) {
      colors[(vertOffset + i) * 3] = color[0];
      colors[(vertOffset + i) * 3 + 1] = color[1];
      colors[(vertOffset + i) * 3 + 2] = color[2];
    }

    const idx = geo.index.array;
    for (let i = 0; i < idx.length; i++) {
      indices[indexOffset + i] = idx[i] + vertOffset;
    }

    vertOffset += count;
    indexOffset += idx.length;
    geo.dispose();
  });

  const finalGeo = new THREE.BufferGeometry();
  finalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  finalGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  finalGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  finalGeo.setIndex(new THREE.BufferAttribute(indices, 1));
  // Nem centerezzük, így az (0, 0, 0) pontosan az Oxigén középpontja marad!

  return finalGeo;
}

export class Particles {
  constructor(parent) {
    this.modelMode = localStorage.getItem('fazister.particleModel') || 'molecule'; // 'molecule' | 'sphere'

    // Részecske csoport a mikroszkópos méretezéshez és átmenethez
    this.group = new THREE.Group();
    parent.add(this.group);

    // 1. Valódi tetraéderes jégkristályrács (Ice Ih - Wurtzite) koordinátáinak generálása
    // Fizikai paraméterek az edény méretéhez skálázva (BOUND = 0.88)
    const d_OO = 0.225; // O-O tetraéderes kötéstávolság
    const a = d_OO * Math.sqrt(8 / 3);
    const c = d_OO * (8 / 3);

    // Hexagonális bázisvektorok (c-tengely az Y mentén)
    const u = new THREE.Vector3(a, 0, 0);
    const v = new THREE.Vector3(-a / 2, 0, a * Math.sqrt(3) / 2);
    const w = new THREE.Vector3(0, c, 0);

    const rawPts = [];
    const boundLattice = BOUND - 0.03;

    for (let nx = -4; nx <= 4; nx++) {
      for (let ny = -3; ny <= 3; ny++) {
        for (let nz = -4; nz <= 4; nz++) {
          const cellOrigin = new THREE.Vector3()
            .addScaledVector(u, nx)
            .addScaledVector(v, nz)
            .addScaledVector(w, ny);

          // 4 Oxigénatom az egységcellában
          const p1 = cellOrigin.clone();
          const p2 = cellOrigin.clone().addScaledVector(w, 3 / 8);
          const p3 = cellOrigin.clone().addScaledVector(u, 1 / 3).addScaledVector(v, 2 / 3).addScaledVector(w, 1 / 2);
          const p4 = cellOrigin.clone().addScaledVector(u, 1 / 3).addScaledVector(v, 2 / 3).addScaledVector(w, 7 / 8);

          [p1, p2, p3, p4].forEach(pos => {
            const p = pos.clone().sub(new THREE.Vector3(0, c * 0.25, 0));
            if (Math.abs(p.x) <= boundLattice && Math.abs(p.y) <= boundLattice && Math.abs(p.z) <= boundLattice) {
              rawPts.push(p);
            }
          });
        }
      }
    }

    this.N = rawPts.length;

    // 2. Kötések és szomszédsági lista feltérképezése (tetraéderes koordináció)
    const allBonds = [];
    const adj = Array.from({ length: this.N }, () => []);

    for (let i = 0; i < this.N; i++) {
      for (let j = i + 1; j < this.N; j++) {
        const d = rawPts[i].distanceTo(rawPts[j]);
        if (Math.abs(d - d_OO) < 0.04 * d_OO) {
          allBonds.push([i, j]);
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    // 3. Kiemelt 6-os hatszögletű gyűrű (Ice Ih hexagonal ring) megkeresése
    // 6 tagú gyűrűk (hatszögek) felkutatása a szomszédsági gráfban DFS bejárással
    const rings = [];
    for (let start = 0; start < this.N; start++) {
      const path = [start];
      const visited = new Uint8Array(this.N);
      visited[start] = 1;

      const dfs = (curr, depth) => {
        if (depth === 6) {
          if (adj[curr].includes(start) && path[1] < path[5]) {
            rings.push([...path]);
          }
          return;
        }
        for (const next of adj[curr]) {
          if (next < start) continue;
          if (!visited[next]) {
            visited[next] = 1;
            path.push(next);
            dfs(next, depth + 1);
            path.pop();
            visited[next] = 0;
          }
        }
      };

      dfs(start, 1);
    }

    // Szigorúan a legelső rétegben lévő (legnagyobb cz, a kamera felé legközelebb eső) hatszöget választjuk,
    // amely teljesen szemből, zavaró előtéri részecskék nélkül látható!
    let maxCz = -Infinity;
    rings.forEach(ring => {
      let cz = 0;
      ring.forEach(idx => cz += rawPts[idx].z);
      cz /= 6;
      if (cz > maxCz) maxCz = cz;
    });

    let bestRing = null, bestScore = Infinity;
    rings.forEach(ring => {
      let cx = 0, cy = 0, cz = 0;
      ring.forEach(idx => {
        cx += rawPts[idx].x;
        cy += rawPts[idx].y;
        cz += rawPts[idx].z;
      });
      cx /= 6; cy /= 6; cz /= 6;

      // Szigorúan a legelső külső réteg (cz közel a maxCz-hez, z ~ 0.67)
      if (cz >= maxCz - 0.05) {
        // Középponthoz legközelebbi, kényelmes szemmagasságban
        const score = Math.hypot(cx, cy - 0.15);
        if (score < bestScore) {
          bestScore = score;
          bestRing = { ring, cx, cy, cz };
        }
      }
    });

    this.highlightRing = bestRing ? bestRing.ring : [];
    this.highlightIndices = new Set(this.highlightRing);

    // Kiemelt élek és sima hidrogénkötések szétválogatása
    const hlEdgeSet = new Set();
    if (this.highlightRing.length === 6) {
      for (let k = 0; k < 6; k++) {
        const i1 = this.highlightRing[k];
        const i2 = this.highlightRing[(k + 1) % 6];
        hlEdgeSet.add(`${Math.min(i1, i2)}-${Math.max(i1, i2)}`);
      }
    }

    this.bonds = [];
    this.highlightBonds = [];

    allBonds.forEach(([i, j]) => {
      const edgeKey = `${Math.min(i, j)}-${Math.max(i, j)}`;
      if (hlEdgeSet.has(edgeKey)) {
        this.highlightBonds.push([i, j]);
      } else {
        this.bonds.push([i, j]);
      }
    });

    // 4. Bernal–Fowler jégszabály: szigorúan 1 H kötésenként, legfeljebb 2 H minden oxigénhez
    // Szigorú irányított élek: minden élre KIZÁRÓLAG egyetlen tulajdonost (owner) választunk,
    // így garantált, hogy egyetlen kötésen se nézzen szembe két hidrogénatom!
    const edgeOwner = new Map();
    const outNeighbors = Array.from({ length: this.N }, () => []);

    allBonds.forEach(([i, j]) => {
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      let owner = (outNeighbors[i].length <= outNeighbors[j].length) ? i : j;
      let other = (owner === i) ? j : i;
      edgeOwner.set(key, owner);
      outNeighbors[owner].push(other);
    });

    for (let iter = 0; iter < 30; iter++) {
      allBonds.forEach(([i, j]) => {
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        const owner = edgeOwner.get(key);
        const other = (owner === i) ? j : i;
        if (outNeighbors[owner].length > 2 && outNeighbors[other].length < 2) {
          outNeighbors[owner].splice(outNeighbors[owner].indexOf(other), 1);
          outNeighbors[other].push(owner);
          edgeOwner.set(key, other);
        }
      });
    }

    // 5. Részecskék létrehozása és tájolásuk illesztése a tetraéderes kötésekhez
    this.p = [];
    this.bondOwnerData = new Map(); // "min-max" -> { from, to, hSlot }

    for (let idx = 0; idx < this.N; idx++) {
      const pt = rawPts[idx];
      const isHighlight = this.highlightIndices.has(idx);
      const outs = outNeighbors[idx];

      let v1, v2;
      if (outs.length >= 2) {
        v1 = new THREE.Vector3().subVectors(rawPts[outs[0]], pt).normalize();
        v2 = new THREE.Vector3().subVectors(rawPts[outs[1]], pt).normalize();
        const key0 = `${Math.min(idx, outs[0])}-${Math.max(idx, outs[0])}`;
        const key1 = `${Math.min(idx, outs[1])}-${Math.max(idx, outs[1])}`;
        this.bondOwnerData.set(key0, { from: idx, to: outs[0], hSlot: 0 });
        this.bondOwnerData.set(key1, { from: idx, to: outs[1], hSlot: 1 });
      } else if (outs.length === 1) {
        v1 = new THREE.Vector3().subVectors(rawPts[outs[0]], pt).normalize();
        const key0 = `${Math.min(idx, outs[0])}-${Math.max(idx, outs[0])}`;
        this.bondOwnerData.set(key0, { from: idx, to: outs[0], hSlot: 0 });

        // v2 egy szabad irányba mutat (távol minden szomszédos oxigéntől), így nem ütközik kötéssel
        const disallowed = adj[idx].map(nbr => new THREE.Vector3().subVectors(rawPts[nbr], pt).normalize());
        let temp = Math.abs(v1.x) < 0.8 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const ortho = new THREE.Vector3().crossVectors(v1, temp).normalize();
        v2 = new THREE.Vector3().addScaledVector(v1, Math.cos(TETRA_THETA)).addScaledVector(ortho, Math.sin(TETRA_THETA)).normalize();

        for (let rot = 0; rot < 8; rot++) {
          const testV2 = ortho.clone().applyAxisAngle(v1, rot * Math.PI / 4).multiplyScalar(Math.sin(TETRA_THETA)).addScaledVector(v1, Math.cos(TETRA_THETA)).normalize();
          const minAngle = Math.min(...disallowed.map(d => d.angleTo(testV2)));
          if (minAngle > 0.8) {
            v2 = testV2;
            break;
          }
        }
      } else {
        // 0 kimenő él: mindkét H a szabad térbe mutat
        v1 = new THREE.Vector3(0, 1, 0);
        v2 = new THREE.Vector3(Math.sin(TETRA_THETA), Math.cos(TETRA_THETA), 0);
      }

      const yVec = new THREE.Vector3().addVectors(v1, v2).normalize();
      const xVec = new THREE.Vector3().subVectors(v1, v2).normalize();
      const zVec = new THREE.Vector3().crossVectors(xVec, yVec).normalize();

      let hrx = 0, hry = 0, hrz = 0;
      if (xVec.lengthSq() > 0.1 && yVec.lengthSq() > 0.1 && zVec.lengthSq() > 0.1) {
        const rotMat = new THREE.Matrix4().makeBasis(xVec, yVec, zVec);
        const euler = new THREE.Euler().setFromRotationMatrix(rotMat);
        hrx = euler.x;
        hry = euler.y;
        hrz = euler.z;
      }

      this.p.push({
        x: pt.x, y: pt.y, z: pt.z,
        hx: pt.x, hy: pt.y, hz: pt.z,
        vx: 0, vy: 0, vz: 0,
        rx: hrx, ry: hry, rz: hrz,
        hrx, hry, hrz,
        vrx: (Math.random() - 0.5) * 0.08,
        vry: (Math.random() - 0.5) * 0.08,
        vrz: (Math.random() - 0.5) * 0.08,
        rank: Math.random(),
        isHighlight,
        n: idx
      });
    }

    // 6. Halvány hidrogénkötések kirajzolása (LineSegments, világoskék ragyogás)
    this.bondPos = new Float32Array(this.bonds.length * 6);
    this.bondGeo = new THREE.BufferGeometry();
    this.bondGeo.setAttribute('position', new THREE.BufferAttribute(this.bondPos, 3));
    this.bondMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.bondMesh = new THREE.LineSegments(this.bondGeo, this.bondMat);
    this.bondMesh.frustumCulled = false;
    this.group.add(this.bondMesh);

    // 7. Kiemelt hatszögletű elrendezés (Arany élek LineSegments)
    this.hlBondPos = new Float32Array(this.highlightBonds.length * 6);
    this.hlBondGeo = new THREE.BufferGeometry();
    this.hlBondGeo.setAttribute('position', new THREE.BufferAttribute(this.hlBondPos, 3));
    this.hlBondMat = new THREE.LineBasicMaterial({
      color: 0xffd60a,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.hlBondMesh = new THREE.LineSegments(this.hlBondGeo, this.hlBondMat);
    this.hlBondMesh.frustumCulled = false;
    this.group.add(this.hlBondMesh);

    // 8. Kiemelt hatszögletű belső felület lágy arany glóriával
    if (this.highlightRing.length === 6 && bestRing) {
      const fillPositions = new Float32Array(6 * 3 * 3); // 6 háromszög a középpontból
      this.hlFillGeo = new THREE.BufferGeometry();
      this.hlFillGeo.setAttribute('position', new THREE.BufferAttribute(fillPositions, 3));
      this.hlFillMat = new THREE.MeshBasicMaterial({
        color: 0xffd60a,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.hlFillMesh = new THREE.Mesh(this.hlFillGeo, this.hlFillMat);
      this.group.add(this.hlFillMesh);
    }

    // 9. Egyszerű gömb modell InstancedMesh
    const sphereGeo = new THREE.SphereGeometry(R, 14, 10);
    const sphereMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.0 });
    this.sphereMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, this.N);
    this.sphereMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sphereMesh.setColorAt(0, new THREE.Color());
    this.sphereMesh.frustumCulled = false;
    this.group.add(this.sphereMesh);

    // 10. Valódi H2O Vízmolekula modell InstancedMesh (piros oxigén + fehér hidrogének)
    const moleculeGeo = createH2OGeometry();
    const moleculeMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.25,
      metalness: 0.08
    });
    this.moleculeMesh = new THREE.InstancedMesh(moleculeGeo, moleculeMat, this.N);
    this.moleculeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.moleculeMesh.frustumCulled = false;
    this.group.add(this.moleculeMesh);

    this.transitionProgress = 0;
    this.setTransitionProgress(0); // Kezdetben makroszkopikus jégkocka van, a részecskék és kötések rejtve!

    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this._rotMat = new THREE.Matrix4();
    this._hPos = new THREE.Vector3();
    this._euler = new THREE.Euler();
  }

  get mesh() {
    return this.modelMode === 'molecule' ? this.moleculeMesh : this.sphereMesh;
  }

  setModelMode(mode) {
    this.modelMode = mode;
    try { localStorage.setItem('fazister.particleModel', mode); } catch {}
    this.updateMeshVisibility();
  }

  setTransitionProgress(p) {
    this.transitionProgress = p;
    if (p <= 0.002) {
      this.group.visible = false;
      this.group.scale.setScalar(0.01);
    } else {
      this.group.visible = true;
      this.group.scale.setScalar(Math.max(0.01, Math.min(1.0, p)));
      this.updateMeshVisibility();
    }
  }

  updateMeshVisibility() {
    if (this.transitionProgress <= 0.002) {
      this.sphereMesh.visible = false;
      this.moleculeMesh.visible = false;
      this.bondMesh.visible = false;
      this.hlBondMesh.visible = false;
      if (this.hlFillMesh) this.hlFillMesh.visible = false;
      return;
    }
    this.sphereMesh.visible = (this.modelMode === 'sphere');
    this.moleculeMesh.visible = (this.modelMode === 'molecule');
  }

  update(sim, gameOrDt, dtOrT, maybeT) {
    let game = null, dt = 0.016, t = performance.now();
    if (typeof gameOrDt === 'object' && gameOrDt !== null && ('missionNo' in gameOrDt || 'introStarted' in gameOrDt)) {
      game = gameOrDt;
      dt = dtOrT || 0.016;
      t = maybeT ?? performance.now();
    } else {
      dt = gameOrDt || 0.016;
      t = dtOrT ?? performance.now();
    }

    const timeSec = t * 0.001;
    const k = Math.min(3, dt * 60);
    const bp = sim.bp, T = sim.T;
    let gf = 0, lf = 1;
    switch (sim.phase) {
      case PHASE.ICE: lf = 0; break;
      case PHASE.MELT: lf = sim.melt; break;
      case PHASE.BOIL: gf = sim.vap; break;
      case PHASE.STEAM: gf = 1; break;
      default: break;
    }
    const energy = Math.max(0.1, (T + 40) / 60);
    // Folyadék állapotban a víz szigorúan a kocka alján helyezkedik el (a padlótól a kocka alsó felének tetejéig, y = -0.15),
    // gáz állapotban pedig a teljes kocka tetejéig (+BOUND) szabadon szétáramlik.
    const liquidTop = -0.15;
    const currentLiquidTop = (sim.phase === PHASE.MELT)
      ? (-BOUND + R) + (liquidTop - (-BOUND + R)) * Math.min(1.0, 0.20 + lf * 0.80)
      : liquidTop;
    const speed = sim.paused ? 0 : 1;
    const isMolecule = this.modelMode === 'molecule';

    // Kötések láthatósága és elhalványulása az olvadás során:
    const bondFade = sim.phase === PHASE.ICE
      ? 1.0
      : (sim.phase === PHASE.MELT ? Math.max(0, 1.0 - sim.melt * 1.4) : 0);

    const isBondsActive = bondFade > 0.01 && this.transitionProgress > 0.01;
    this.bondMesh.visible = isBondsActive;
    this.hlBondMesh.visible = isBondsActive;

    // A kiemelt hatszög CSAK akkor kap arany kiemelést, amikor a jégkristály küldetés megkezdődik (missionNo >= 1)!
    // A küldetés előtt (pl. a 0. küldetés alatt) sima világoskék kötésként olvad a kristályrácsba.
    const isHighlightActive = isBondsActive && (game ? (game.introStarted && game.missionNo >= 1) : false) && (sim.phase === PHASE.ICE || sim.phase === PHASE.MELT);

    if (this.hlFillMesh) this.hlFillMesh.visible = isHighlightActive;

    if (isBondsActive) {
      this.bondMat.opacity = 0.35 * bondFade;

      if (isHighlightActive) {
        this.hlBondMat.color.setHex(0xffd60a); // arany kiemelés
        this.hlBondMat.opacity = (0.85 + Math.sin(timeSec * 5.0) * 0.15) * bondFade;
        if (this.hlFillMat) {
          this.hlFillMat.opacity = (0.22 + Math.sin(timeSec * 4.0) * 0.08) * bondFade;
        }
      } else {
        // Amíg a küldetés el nem kezdődik, sima világoskék hidrogénkötés
        this.hlBondMat.color.setHex(0x60a5fa);
        this.hlBondMat.opacity = this.bondMat.opacity;
      }

      // Kötések pozícióinak frissítése a rezgő részecskékkel
      // A hidrogénkötések a fehér hidrogéntől futnak a cél oxigénhez, garantálva a tiszta H2O hidrogénhidas szerkezetet!
      const rotMat = this._rotMat;
      const hPos = this._hPos;
      const euler = this._euler;

      let bIdx = 0;
      for (let b = 0; b < this.bonds.length; b++) {
        const [i1, i2] = this.bonds[b];
        const key = `${Math.min(i1, i2)}-${Math.max(i1, i2)}`;
        const ownerInfo = this.bondOwnerData.get(key);

        let pStart, pEnd;
        if (ownerInfo && isMolecule) {
          const fromNode = this.p[ownerInfo.from];
          const toNode = this.p[ownerInfo.to];
          euler.set(fromNode.rx, fromNode.ry, fromNode.rz);
          rotMat.makeRotationFromEuler(euler);
          hPos.copy(H_LOCALS[ownerInfo.hSlot]).applyMatrix4(rotMat).add(fromNode);
          pStart = hPos;
          pEnd = toNode;
        } else {
          pStart = this.p[i1];
          pEnd = this.p[i2];
        }

        this.bondPos[bIdx++] = pStart.x;
        this.bondPos[bIdx++] = pStart.y;
        this.bondPos[bIdx++] = pStart.z;
        this.bondPos[bIdx++] = pEnd.x;
        this.bondPos[bIdx++] = pEnd.y;
        this.bondPos[bIdx++] = pEnd.z;
      }
      this.bondGeo.attributes.position.needsUpdate = true;

      let hbIdx = 0;
      for (let b = 0; b < this.highlightBonds.length; b++) {
        const [i1, i2] = this.highlightBonds[b];
        const key = `${Math.min(i1, i2)}-${Math.max(i1, i2)}`;
        const ownerInfo = this.bondOwnerData.get(key);

        let pStart, pEnd;
        if (ownerInfo && isMolecule) {
          const fromNode = this.p[ownerInfo.from];
          const toNode = this.p[ownerInfo.to];
          euler.set(fromNode.rx, fromNode.ry, fromNode.rz);
          rotMat.makeRotationFromEuler(euler);
          hPos.copy(H_LOCALS[ownerInfo.hSlot]).applyMatrix4(rotMat).add(fromNode);
          pStart = hPos;
          pEnd = toNode;
        } else {
          pStart = this.p[i1];
          pEnd = this.p[i2];
        }

        this.hlBondPos[hbIdx++] = pStart.x;
        this.hlBondPos[hbIdx++] = pStart.y;
        this.hlBondPos[hbIdx++] = pStart.z;
        this.hlBondPos[hbIdx++] = pEnd.x;
        this.hlBondPos[hbIdx++] = pEnd.y;
        this.hlBondPos[hbIdx++] = pEnd.z;
      }
      this.hlBondGeo.attributes.position.needsUpdate = true;

      // Kiemelt hatszög belső glória háromszögeinek frissítése a rezgő pontokkal
      if (this.hlFillGeo && this.highlightRing.length === 6) {
        const fillArr = this.hlFillGeo.attributes.position.array;
        let cx = 0, cy = 0, cz = 0;
        for (let k = 0; k < 6; k++) {
          const pt = this.p[this.highlightRing[k]];
          cx += pt.x; cy += pt.y; cz += pt.z;
        }
        cx /= 6; cy /= 6; cz /= 6;

        let fIdx = 0;
        for (let k = 0; k < 6; k++) {
          const p1 = this.p[this.highlightRing[k]];
          const p2 = this.p[this.highlightRing[(k + 1) % 6]];

          fillArr[fIdx++] = cx; fillArr[fIdx++] = cy; fillArr[fIdx++] = cz;
          fillArr[fIdx++] = p1.x; fillArr[fIdx++] = p1.y; fillArr[fIdx++] = p1.z;
          fillArr[fIdx++] = p2.x; fillArr[fIdx++] = p2.y; fillArr[fIdx++] = p2.z;
        }
        this.hlFillGeo.attributes.position.needsUpdate = true;
      }
    }

    // --- 1. LÉPÉS: Részecskék egyedi fázisa, sebessége és alapmozgása ---
    const R_EFF = 0.045;
    const xMin = -BOUND + R_EFF, xMax = BOUND - R_EFF;
    const zMin = -BOUND + R_EFF, zMax = BOUND - R_EFF;
    const yMin = -BOUND + R_EFF;

    for (const p of this.p) {
      p.mode = p.rank < gf ? 2 : p.rank < lf ? 1 : 0; // 0 szilárd, 1 folyadék, 2 gáz

      if (p.mode === 0) {
        // JÉG: rácsrezgés a kristályrács pontjai körül
        const a = (sim.phase === PHASE.MELT ? 0.03 : 0.005 + energy * 0.012) * speed;
        p.x = Math.max(-BOUND, Math.min(BOUND, p.hx + (Math.random() - 0.5) * a));
        p.y = Math.max(-BOUND, Math.min(BOUND, p.hy + (Math.random() - 0.5) * a));
        p.z = Math.max(-BOUND, Math.min(BOUND, p.hz + (Math.random() - 0.5) * a));
        p.rx = p.hrx + (Math.random() - 0.5) * a * 3;
        p.ry = p.hry + (Math.random() - 0.5) * a * 3;
        p.rz = p.hrz + (Math.random() - 0.5) * a * 3;
        p.vx = 0; p.vy = 0; p.vz = 0;
      } else {
        // Szabad mozgás: Folyadék vagy Gáz
        const sp = p.mode === 1
          ? 0.008 + Math.max(0, T) * 0.00010
          : 0.035 + Math.max(0, T - bp) * 0.00045 + 0.015;

        if (!sim.paused) {
          if (p.mode === 1) {
            // Folyadék: a gravitáció a kocka aljára húzza a molekulákat, a belső felhajtóerő
            // pedig a padlótól felfelé építi fel a sűrű, egymáson elgördülő folyadékrétegeket (a padlón ülve!)
            p.vy -= 0.0010 * k;
            if (p.y < yMin + 0.22) {
              p.vy += 0.0012 * k; // a padlónál felgyűlő molekulák belső nyomása
            }
            p.vx += (Math.random() - 0.5) * sp * 0.55 * k;
            p.vz += (Math.random() - 0.5) * sp * 0.55 * k;

            // Gördülő forgás a mozgás irányában
            p.rx += p.vz * 12 * k;
            p.rz -= p.vx * 12 * k;
            p.ry += p.vry * k;
          } else {
            // Gáz: gyors száguldás és szabad pörgés a teljes tartályban
            p.vx += (Math.random() - 0.5) * sp * 0.55 * k;
            p.vy += (Math.random() - 0.5) * sp * 0.55 * k;
            p.vz += (Math.random() - 0.5) * sp * 0.55 * k;

            p.rx += p.vrx * 3.5 * k;
            p.ry += p.vry * 3.5 * k;
            p.rz += p.vrz * 3.5 * k;
          }

          // Sebességkorlát
          const m = Math.hypot(p.vx, p.vy, p.vz) || 1;
          const lim = sp * 1.8;
          if (m > lim) {
            p.vx *= lim / m;
            p.vy *= lim / m;
            p.vz *= lim / m;
          }

          p.x += p.vx * k;
          p.y += p.vy * k;
          p.z += p.vz * k;
        }

        // Ütközés az edény falaival
        // A folyadék teteje szigorúan currentLiquidTop (a kocka alsó felének teteje),
        // az alja pedig hajszálpontosan a kocka alsó padlója (yMin)!
        const yTopLimit = p.mode === 1 ? currentLiquidTop : (BOUND - R_EFF);

        if (p.x < xMin) { p.x = xMin; p.vx = Math.abs(p.vx) * (p.mode === 1 ? 0.45 : 1.0); }
        if (p.x > xMax) { p.x = xMax; p.vx = -Math.abs(p.vx) * (p.mode === 1 ? 0.45 : 1.0); }
        if (p.z < zMin) { p.z = zMin; p.vz = Math.abs(p.vz) * (p.mode === 1 ? 0.45 : 1.0); }
        if (p.z > zMax) { p.z = zMax; p.vz = -Math.abs(p.vz) * (p.mode === 1 ? 0.45 : 1.0); }
        if (p.y < yMin) { p.y = yMin; p.vy = Math.abs(p.vy) * (p.mode === 1 ? 0.20 : 1.0); }
        if (p.y > yTopLimit) { p.y = yTopLimit; p.vy = -Math.abs(p.vy) * (p.mode === 1 ? 0.20 : 1.0); }
      }
    }

    // --- 2. LÉPÉS: Molekula–molekula ütközések és elgördülés (sosem mennek át egymáson!) ---
    const hasFreeParticles = (lf > 0 || gf > 0);
    if (hasFreeParticles && !sim.paused) {
      const D_COL = 0.110; // valódi H2O molekula teljes átmérője
      const D_COL_SQ = D_COL * D_COL;

      for (let i = 0; i < this.N; i++) {
        const pi = this.p[i];
        for (let j = i + 1; j < this.N; j++) {
          const pj = this.p[j];
          if (pi.mode === 0 && pj.mode === 0) continue; // szilárd rácsban lévők nem ütköznek egymással

          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dz = pi.z - pj.z;
          const d2 = dx * dx + dy * dy + dz * dz;

          if (d2 < D_COL_SQ && d2 > 1e-8) {
            const d = Math.sqrt(d2);
            const nx = dx / d;
            const ny = dy / d;
            const nz = dz / d;
            const overlap = D_COL - d;

            // Pozíciók azonnali szétválasztása (megakadályozza az átfedést)
            if (pi.mode === 0) {
              // pi szilárd jégkristály: pj szabad molekula tér ki
              pj.x -= nx * overlap;
              pj.y -= ny * overlap;
              pj.z -= nz * overlap;
              if (pj.mode === 1 && pj.y < yMin) pj.y = yMin;
            } else if (pj.mode === 0) {
              // pj szilárd jégkristály: pi szabad molekula tér ki
              pi.x += nx * overlap;
              pi.y += ny * overlap;
              pi.z += nz * overlap;
              if (pi.mode === 1 && pi.y < yMin) pi.y = yMin;
            } else {
              // mindkét molekula szabad: fele-fele arányban mozdulnak szét
              const half = overlap * 0.5;
              pi.x += nx * half;
              pi.y += ny * half;
              pi.z += nz * half;
              pj.x -= nx * half;
              pj.y -= ny * half;
              pj.z -= nz * half;
              if (pi.mode === 1 && pi.y < yMin) pi.y = yMin;
              if (pj.mode === 1 && pj.y < yMin) pj.y = yMin;
            }

            // Sebességcsere és gördülés
            const relVx = pi.vx - pj.vx;
            const relVy = pi.vy - pj.vy;
            const relVz = pi.vz - pj.vz;
            const vRelNorm = relVx * nx + relVy * ny + relVz * nz;

            if (vRelNorm < 0) {
              const isGas = (pi.mode === 2 || pj.mode === 2);
              // Gáz: tökéletesen rugalmas ütközés (0.95), gázelmélet szerinti visszapattanás
              // Folyadék: lágy érintkezés (0.25), felületi elgördülés
              const restitution = isGas ? 0.95 : 0.25;
              const impulse = (1 + restitution) * vRelNorm;

              if (pi.mode === 0) {
                pj.vx += nx * impulse;
                pj.vy += ny * impulse;
                pj.vz += nz * impulse;
              } else if (pj.mode === 0) {
                pi.vx -= nx * impulse;
                pi.vy -= ny * impulse;
                pi.vz -= nz * impulse;
              } else {
                const halfImp = impulse * 0.5;
                pi.vx -= nx * halfImp;
                pi.vy -= ny * halfImp;
                pi.vz -= nz * halfImp;
                pj.vx += nx * halfImp;
                pj.vy += ny * halfImp;
                pj.vz += nz * halfImp;
              }

              if (!isGas) {
                // Folyadék: érintőleges elgördülés (egymáson gördülnek le a tartály aljára)
                const rollRate = 0.08;
                pi.rx += ny * rollRate;
                pi.rz -= nx * rollRate;
                pj.rx -= ny * rollRate;
                pj.rz += nx * rollRate;

                // Enyhe folyadék-viszkozitás a csúszásnál
                pi.vx *= 0.95; pi.vz *= 0.95;
                pj.vx *= 0.95; pj.vz *= 0.95;
              } else {
                // Gáz: az ütközés szögsebességet ad át a molekuláknak
                pi.vrx += (Math.random() - 0.5) * 0.08;
                pi.vry += (Math.random() - 0.5) * 0.08;
                pi.vrz += (Math.random() - 0.5) * 0.08;
                pj.vrx += (Math.random() - 0.5) * 0.08;
                pj.vry += (Math.random() - 0.5) * 0.08;
                pj.vrz += (Math.random() - 0.5) * 0.08;
              }
            }
          }
        }
      }
    }

    // --- 3. LÉPÉS: 3D vizuális megjelenítés és színek frissítése ---
    for (const p of this.p) {
      this.dummy.position.set(p.x, p.y, p.z);

      if (isMolecule) {
        this.dummy.rotation.set(p.rx, p.ry, p.rz);
        this.dummy.updateMatrix();
        this.moleculeMesh.setMatrixAt(p.n, this.dummy.matrix);
      } else {
        // Színek halmazállapot szerint az egyszerű gömb modellnél
        if (p.mode === 0) {
          if (p.isHighlight && isHighlightActive) {
            // Kiemelt hatszögletű elrendezés csúcsai meleg arany színben ragyognak
            this.color.setRGB(1.0, 0.84, 0.08);
          } else {
            this.color.setRGB(0.72, 0.90, 1.0);
          }
        }
        else if (p.mode === 1) this.color.setHSL(0.58 - Math.min(1, T / 100) * 0.08, 0.85, 0.58);
        else this.color.setHSL(0.06 - Math.min(0.06, Math.max(0, T - bp) / 600), 0.92, 0.6);

        this.dummy.rotation.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.sphereMesh.setMatrixAt(p.n, this.dummy.matrix);
        this.sphereMesh.setColorAt(p.n, this.color);
      }
    }

    if (isMolecule) {
      this.moleculeMesh.instanceMatrix.needsUpdate = true;
    } else {
      this.sphereMesh.instanceMatrix.needsUpdate = true;
      this.sphereMesh.instanceColor.needsUpdate = true;
    }
  }
}
