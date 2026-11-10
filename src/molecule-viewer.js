// 3D Vízmolekula és Kristályszerkezet Megismerése Modul
import * as THREE from 'three';
import { speak, stopSpeaking } from './speech.js';

export class MoleculeViewerModule {
  constructor({ scene, camera, controls, onBackToMenu }) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.onBackToMenu = onBackToMenu;

    this.root = new THREE.Group();
    this.root.name = 'MoleculeViewerRoot';
    this.root.visible = false;
    this.scene.add(this.root);

    this.mode = 'single'; // 'single' vagy 'lattice'
    this.container = null;
    this.autoRotate = true;

    this.singleGroup = new THREE.Group();
    this.latticeGroup = new THREE.Group();
    this.root.add(this.singleGroup);
    this.root.add(this.latticeGroup);

    this.buildSingleMolecule();
    this.buildLattice();
  }

  buildSingleMolecule() {
    // 1. Nagy méretű H2O molekula
    const oRadius = 0.36;
    const hRadius = 0.20;
    const bondDist = 0.85;
    const angleRad = (104.5 * Math.PI) / 180;
    const halfAngle = angleRad / 2;

    const oMat = new THREE.MeshPhysicalMaterial({
      color: 0xee2233,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2
    });

    const hMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f6fa,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.5
    });

    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xdcdde1,
      roughness: 0.4,
      metalness: 0.2
    });

    // Oxigén (0, 0, 0)
    const oMesh = new THREE.Mesh(new THREE.SphereGeometry(oRadius, 32, 24), oMat);
    this.singleGroup.add(oMesh);

    // Hidrogének
    const h1Pos = new THREE.Vector3(bondDist * Math.sin(halfAngle), bondDist * Math.cos(halfAngle), 0);
    const h2Pos = new THREE.Vector3(-bondDist * Math.sin(halfAngle), bondDist * Math.cos(halfAngle), 0);

    const h1Mesh = new THREE.Mesh(new THREE.SphereGeometry(hRadius, 24, 18), hMat);
    h1Mesh.position.copy(h1Pos);
    this.singleGroup.add(h1Mesh);

    const h2Mesh = new THREE.Mesh(new THREE.SphereGeometry(hRadius, 24, 18), hMat);
    h2Mesh.position.copy(h2Pos);
    this.singleGroup.add(h2Mesh);

    // Kötések (Cylinder)
    const bGeo = new THREE.CylinderGeometry(0.06, 0.06, bondDist, 16);

    const b1 = new THREE.Mesh(bGeo, bondMat);
    b1.position.set(h1Pos.x / 2, h1Pos.y / 2, 0);
    b1.rotation.z = -halfAngle;
    this.singleGroup.add(b1);

    const b2 = new THREE.Mesh(bGeo, bondMat);
    b2.position.set(h2Pos.x / 2, h2Pos.y / 2, 0);
    b2.rotation.z = halfAngle;
    this.singleGroup.add(b2);

    // Dipólus vektor és parciális töltés glóriák
    const glowMatNeg = new THREE.MeshBasicMaterial({ color: 0xff453a, transparent: true, opacity: 0.2 });
    const glowO = new THREE.Mesh(new THREE.SphereGeometry(oRadius * 1.35, 16, 12), glowMatNeg);
    this.singleGroup.add(glowO);

    const glowMatPos = new THREE.MeshBasicMaterial({ color: 0x64d2ff, transparent: true, opacity: 0.25 });
    const glowH1 = new THREE.Mesh(new THREE.SphereGeometry(hRadius * 1.45, 16, 12), glowMatPos);
    glowH1.position.copy(h1Pos);
    this.singleGroup.add(glowH1);

    const glowH2 = new THREE.Mesh(new THREE.SphereGeometry(hRadius * 1.45, 16, 12), glowMatPos);
    glowH2.position.copy(h2Pos);
    this.singleGroup.add(glowH2);

    this.singleGroup.position.set(0, 0.2, 0);
  }

  buildLattice() {
    // Ice Ih hexagonális rács modell több molekulával és hidrogénhidakkal
    const a = 0.55; // Rácsállandó
    const c = 0.90;

    const oMat = new THREE.MeshPhysicalMaterial({ color: 0xee2233, roughness: 0.3, clearcoat: 0.4 });
    const hMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3 });
    const bondMat = new THREE.LineBasicMaterial({ color: 0x64d2ff, transparent: true, opacity: 0.65 });
    const hexRingMat = new THREE.LineBasicMaterial({ color: 0xffd60a, linewidth: 2.5 });

    const oGeo = new THREE.SphereGeometry(0.08, 16, 12);
    const hGeo = new THREE.SphereGeometry(0.045, 12, 10);

    const positions = [];
    const hexRingIndices = [0, 1, 2, 3, 4, 5];

    // Hexagonális gyűrű 6 csúcsa
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = a * Math.cos(angle);
      const z = a * Math.sin(angle);
      const y = (i % 2 === 0 ? 0.08 : -0.08);

      const oMesh = new THREE.Mesh(oGeo, oMat);
      oMesh.position.set(x, y, z);
      this.latticeGroup.add(oMesh);
      positions.push(new THREE.Vector3(x, y, z));

      // Hidrogénatomok a szomszédok felé
      const nextAngle = ((i + 1) * Math.PI) / 3;
      const nextPos = new THREE.Vector3(a * Math.cos(nextAngle), (i % 2 === 1 ? 0.08 : -0.08), a * Math.sin(nextAngle));
      const midPos = new THREE.Vector3().addVectors(oMesh.position, nextPos).multiplyScalar(0.5);

      const hMesh = new THREE.Mesh(hGeo, hMat);
      hMesh.position.copy(midPos);
      this.latticeGroup.add(hMesh);
    }

    // Felső és alsó rétegek kiegészítése (üres csatorna demonstráció)
    [-0.55, 0.55].forEach(yOff => {
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + 0.3;
        const x = a * 1.35 * Math.cos(angle);
        const z = a * 1.35 * Math.sin(angle);
        const oMesh = new THREE.Mesh(oGeo, oMat);
        oMesh.position.set(x, yOff, z);
        this.latticeGroup.add(oMesh);
      }
    });

    // Kiemelt arany hexagonális gyűrű
    const hexLineGeo = new THREE.BufferGeometry().setFromPoints([
      positions[0], positions[1], positions[2], positions[3], positions[4], positions[5], positions[0]
    ]);
    const hexLine = new THREE.Line(hexLineGeo, hexRingMat);
    this.latticeGroup.add(hexLine);

    this.latticeGroup.position.set(0, 0.2, 0);
    this.latticeGroup.visible = false;
  }

  mount(parentEl) {
    this.root.visible = true;
    this.controls.target.set(0, 0.2, 0);
    this.camera.position.set(0, 0.6, 2.2);

    this.container = document.createElement('div');
    this.container.id = 'molecule-viewer-container';
    this.container.className = 'module-overlay';
    this.container.innerHTML = this.renderHTML();
    parentEl.appendChild(this.container);

    this.bindEvents();
    this.updateMode();
  }

  unmount() {
    this.root.visible = false;
    stopSpeaking();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  renderHTML() {
    return `
      <div class="molecule-backdrop">
        <!-- Fejléc -->
        <div class="diagram-header">
          <button class="nav-back-btn" id="btnMolBack">
            <span class="icon">‹</span> Főmenü
          </button>
          <div class="header-center">
            <div class="diagram-badge">Termodinamika • Mikroszerkezet</div>
            <h1 class="diagram-title">A Vízmolekula és Kristályszerkezet</h1>
          </div>
          <div class="header-actions">
            <button class="action-btn" id="btnMolAudio">
              🔊 Felolvasás
            </button>
          </div>
        </div>

        <!-- Módválasztó gombok a 3D tér tetején -->
        <div class="mol-view-selector">
          <button class="seg-btn active" id="btnViewSingle">
            💧 Egyedi H₂O Molekula
          </button>
          <button class="seg-btn" id="btnViewLattice">
            ❄️ Jégkristály Rács (Ice Ih)
          </button>
        </div>

        <!-- Lebegő alsó információs kártya -->
        <div class="mol-info-card" id="molInfoCard">
          <!-- Dinamikusan frissül az updateMode() során -->
        </div>
      </div>
    `;
  }

  bindEvents() {
    const btnBack = this.container.querySelector('#btnMolBack');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        stopSpeaking();
        if (this.onBackToMenu) this.onBackToMenu();
      });
    }

    const btnSingle = this.container.querySelector('#btnViewSingle');
    const btnLattice = this.container.querySelector('#btnViewLattice');

    if (btnSingle) {
      btnSingle.addEventListener('click', () => {
        this.mode = 'single';
        this.updateMode();
      });
    }

    if (btnLattice) {
      btnLattice.addEventListener('click', () => {
        this.mode = 'lattice';
        this.updateMode();
      });
    }

    const btnAudio = this.container.querySelector('#btnMolAudio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => this.speakContent());
    }
  }

  updateMode() {
    const isSingle = this.mode === 'single';
    this.singleGroup.visible = isSingle;
    this.latticeGroup.visible = !isSingle;

    const btnSingle = this.container?.querySelector('#btnViewSingle');
    const btnLattice = this.container?.querySelector('#btnViewLattice');
    if (btnSingle && btnLattice) {
      btnSingle.classList.toggle('active', isSingle);
      btnLattice.classList.toggle('active', !isSingle);
    }

    const card = this.container?.querySelector('#molInfoCard');
    if (card) {
      if (isSingle) {
        card.innerHTML = `
          <div class="mol-card-badge">KÉMIAI SZERKEZET</div>
          <h2 class="mol-card-title">A H₂O Molekula és Poláris Jellege</h2>
          <div class="mol-features-grid">
            <div class="feature-item">
              <span class="feat-icon">🔴</span>
              <div>
                <strong>Oxigénatom (O)</strong>
                <p>Nagy elektronegativitás miatt magához vonzza a kötő elektronpárokat: $\\delta^-$ parciális negatív töltésű.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feat-icon">⚪</span>
              <div>
                <strong>Hidrogénatomok (H)</strong>
                <p>Két kovalens kötéssel kapcsolódnak az oxigénhez: $\\delta^+$ parciális pozitív töltésű pólust alkotnak.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feat-icon">📐</span>
              <div>
                <strong>104.5°-os kötésszög</strong>
                <p>A nemkötő elektronpárok taszítása miatt a kötésszög 104.5°-ra szűkül a szabályos tetraéderes 109.5°-hoz képest.</p>
              </div>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="mol-card-badge">KRISTÁLYRÁCS (ICE IH)</div>
          <h2 class="mol-card-title">Miért úszik a jég a víz felszínén?</h2>
          <div class="mol-features-grid">
            <div class="feature-item">
              <span class="feat-icon">💠</span>
              <div>
                <strong>Hexagonális gyűrűk</strong>
                <p>A jégben a vízmolekulák hidrogénkötésekkel szigorú térbeli hatszögletű gyűrűkké kapcsolódnak össze.</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feat-icon">🕳️</span>
              <div>
                <strong>Hatalmas üres csatornák</strong>
                <p>A rács közepén függőlegesen üres csatornák futnak végig. Ez a szellős szerkezet térfogat-növekedést okoz fagyáskor!</p>
              </div>
            </div>
            <div class="feature-item">
              <span class="feat-icon">🧊</span>
              <div>
                <strong>Kisebb sűrűség (0.917 g/cm³)</strong>
                <p>Mivel a jég sűrűsége kisebb, mint a folyékony vízé (1.00 g/cm³), a jégkocka és a jéghegyek lebegnek a víz felszínén.</p>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  speakContent() {
    if (this.mode === 'single') {
      speak('A vízmolekula két hidrogén- és egy oxigénatomból áll. A kötésszög 104.5 fok. Az oxigén parciális negatív, a hidrogének parciális pozitív töltésűek, ami erős dipólusos jelleget kölcsönöz a víznek.');
    } else {
      speak('A jégben a vízmolekulák hidrogénkötésekkel szabályos hatszögletű gyűrűkké kapcsolódnak össze. A hatszögek közepén üres csatornák futnak végig: ez a szellős kristályszerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és úszik a víz felszínén.');
    }
  }

  update(dt) {
    if (this.root.visible && this.autoRotate) {
      if (this.mode === 'single') {
        this.singleGroup.rotation.y += dt * 0.35;
      } else {
        this.latticeGroup.rotation.y += dt * 0.20;
      }
    }
  }
}
