// Interaktív Halmazállapot-változások és Hőforgalom Diagram
// A felhasználó által feltöltött pedagógiai diagram interaktív megvalósítása
import { speak, stopSpeaking } from './speech.js';

export class PhaseDiagramModule {
  constructor({ onBackToMenu }) {
    this.onBackToMenu = onBackToMenu;
    this.temp = 20; // Alapértelmezett: +20 °C (Folyékony fázis)
    this.activePill = null;
    this.walkthroughStep = -1;
    this.walkthroughTimer = null;
    this.container = null;
  }

  mount(parentEl) {
    this.container = document.createElement('div');
    this.container.id = 'phase-diagram-container';
    this.container.className = 'module-overlay';
    this.container.innerHTML = this.renderHTML();
    parentEl.appendChild(this.container);

    this.bindEvents();
    this.updateState();
  }

  unmount() {
    this.stopWalkthrough();
    stopSpeaking();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  renderHTML() {
    return `
      <div class="diagram-backdrop">
        <!-- Fejléc és navigáció -->
        <div class="diagram-header">
          <button class="nav-back-btn" id="btnDiagramBack">
            <span class="icon">‹</span> Főmenü
          </button>
          <div class="header-center">
            <div class="diagram-badge">Termodinamika • Interaktív Fázistérkép</div>
            <h1 class="diagram-title">Halmazállapot-változások és Hőforgalom</h1>
          </div>
          <div class="header-actions">
            <button class="action-btn" id="btnDiagramWalkthrough">
              <span class="btn-icon">▶</span> Végigjárás
            </button>
            <button class="action-btn icon-only" id="btnDiagramAudio" title="Magyarázat felolvasása">
              🔊
            </button>
          </div>
        </div>

        <!-- Fő diagram munkaterület -->
        <div class="diagram-body">
          <div class="svg-stage-wrapper">
            <svg viewBox="0 0 960 520" class="diagram-svg" id="phaseSvg">
              <defs>
                <!-- Gradiens a csúszkához és nyilakhoz -->
                <linearGradient id="heatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#0a84ff" />
                  <stop offset="50%" stop-color="#bf5af2" />
                  <stop offset="100%" stop-color="#ff453a" />
                </linearGradient>

                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ff453a" flood-opacity="0.6"/>
                </filter>
                <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#0a84ff" flood-opacity="0.6"/>
                </filter>
                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#ffd60a" flood-opacity="0.8"/>
                </filter>

                <marker id="arrowRed" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M 0 1 L 7 4 L 0 7 z" fill="#ff453a" />
                </marker>
                <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M 0 1 L 7 4 L 0 7 z" fill="#0a84ff" />
                </marker>
                <marker id="arrowAxis" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                  <path d="M 0 1 L 7 4 L 0 7 z" fill="#8e8e93" />
                </marker>
              </defs>

              <!-- Koordinátatengelyek -->
              <!-- Függőleges Y tengely: Hőmérséklet (T) -->
              <line x1="80" y1="450" x2="80" y2="40" stroke="#8e8e93" stroke-width="2" marker-end="url(#arrowAxis)" />
              <text x="80" y="28" fill="#ffffff" font-size="14" font-weight="700" text-anchor="middle">Hőmérséklet (T) ▲</text>

              <!-- Horizontális szintvonalak (szaggatott) -->
              <line x1="75" y1="110" x2="900" y2="110" stroke="#3a3a4c" stroke-dasharray="4 4" stroke-width="1.2" />
              <text x="68" y="114" fill="#ff453a" font-size="12" font-weight="600" text-anchor="end">Magas</text>

              <line x1="75" y1="230" x2="900" y2="230" stroke="#3a3a4c" stroke-dasharray="4 4" stroke-width="1.2" />
              <text x="68" y="234" fill="#64d2ff" font-size="12" font-weight="600" text-anchor="end">Közepes</text>

              <line x1="75" y1="350" x2="900" y2="350" stroke="#3a3a4c" stroke-dasharray="4 4" stroke-width="1.2" />
              <text x="68" y="354" fill="#0a84ff" font-size="12" font-weight="600" text-anchor="end">Alacsony</text>

              <!-- Vízszintes X tengely: Hőforgalom (Q) -->
              <line x1="80" y1="450" x2="910" y2="450" stroke="#8e8e93" stroke-width="2" marker-end="url(#arrowAxis)" />
              <text x="90" y="474" fill="#64d2ff" font-size="13" font-weight="600" text-anchor="start">◄ Hőleadás (−Q, Exoterm)</text>
              <text x="900" y="474" fill="#ff453a" font-size="13" font-weight="600" text-anchor="end">Közölt hőmennyiség (Q) / Hőfelvétel (+Q, Endoterm) ►</text>

              <!-- ÁTMENETI NYOMVONALAK -->
              <!-- 1. Felső nagy ív: Szublimáció (endoterm) [Szilárd -> Gáz] (szaggatott piros) -->
              <path id="pathSublimation" class="transition-path path-red"
                    d="M 160 320 L 160 50 Q 160 40 170 40 L 790 40 Q 800 40 800 50 L 800 80"
                    fill="none" stroke="#ff453a" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#arrowRed)" />

              <!-- 2. Alsó nagy ív: Reszublimáció (exoterm) [Gáz -> Szilárd] (szaggatott kék) -->
              <path id="pathResublimation" class="transition-path path-blue"
                    d="M 820 145 L 820 420 Q 820 430 810 430 L 170 430 Q 160 430 160 420 L 160 385"
                    fill="none" stroke="#0a84ff" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#arrowBlue)" />

              <!-- 3. Lépcsős piros: Szilárd -> Folyékony (Olvadás) -->
              <path id="pathMelting" class="transition-path path-red"
                    d="M 230 320 Q 230 230 390 230"
                    fill="none" stroke="#ff453a" stroke-width="2.8" marker-end="url(#arrowRed)" />

              <!-- 4. Lépcsős piros: Folyékony -> Gáz (Forrás & Párolgás) -->
              <path id="pathBoiling" class="transition-path path-red"
                    d="M 520 200 L 520 120 Q 520 110 530 110 L 680 110"
                    fill="none" stroke="#ff453a" stroke-width="2.8" marker-end="url(#arrowRed)" />

              <!-- 5. Lépcsős kék: Gáz -> Folyékony (Lecsapódás) -->
              <path id="pathCondensation" class="transition-path path-blue"
                    d="M 740 145 L 740 230 Q 740 240 730 240 L 575 240"
                    fill="none" stroke="#0a84ff" stroke-width="2.8" marker-end="url(#arrowBlue)" />

              <!-- 6. Lépcsős kék: Folyékony -> Szilárd (Fagyás) -->
              <path id="pathFreezing" class="transition-path path-blue"
                    d="M 480 260 L 480 345 Q 480 355 470 355 L 295 355"
                    fill="none" stroke="#0a84ff" stroke-width="2.8" marker-end="url(#arrowBlue)" />

              <!-- FŐ HALMAZÁLLAPOT DOBOZOK -->
              <!-- 1. Szilárd doboz -->
              <g id="boxSolid" class="state-box" transform="translate(130, 320)">
                <rect width="160" height="65" rx="14" fill="#ffffff" stroke="#c7c7cc" stroke-width="2.5" class="box-bg" />
                <text x="80" y="38" fill="#1c1c1e" font-size="20" font-weight="700" text-anchor="middle">Szilárd</text>
                <text x="80" y="55" fill="#8e8e93" font-size="11" font-weight="600" text-anchor="middle">Jég (rácsrezgés)</text>
              </g>

              <!-- 2. Folyékony doboz -->
              <g id="boxLiquid" class="state-box" transform="translate(415, 200)">
                <rect width="160" height="65" rx="14" fill="#e8f4fd" stroke="#0a84ff" stroke-width="2.5" class="box-bg" />
                <text x="80" y="38" fill="#004085" font-size="20" font-weight="700" text-anchor="middle">Folyékony</text>
                <text x="80" y="55" fill="#0a84ff" font-size="11" font-weight="600" text-anchor="middle">Víz (áramlás)</text>
              </g>

              <!-- 3. Gáz doboz -->
              <g id="boxGas" class="state-box" transform="translate(680, 80)">
                <rect width="160" height="65" rx="14" fill="#fde8e8" stroke="#ff453a" stroke-width="2.5" class="box-bg" />
                <text x="80" y="38" fill="#781010" font-size="20" font-weight="700" text-anchor="middle">Gáz</text>
                <text x="80" y="55" fill="#ff453a" font-size="11" font-weight="600" text-anchor="middle">Gőz (szabad mozgás)</text>
              </g>

              <!-- KATTINTHATÓ ÁTMENET TABLETTÁK (PILLS) -->
              <!-- Olvadás (endoterm) -->
              <g id="pillMelting" class="transition-pill pill-red" transform="translate(260, 215)" data-id="melting">
                <rect width="145" height="30" rx="15" fill="#ffeaea" stroke="#ff453a" stroke-width="1.8" />
                <text x="72.5" y="19" fill="#d70015" font-size="12" font-weight="700" text-anchor="middle">Olvadás (endoterm)</text>
              </g>

              <!-- Forrás & Párolgás (endoterm) -->
              <g id="pillBoiling" class="transition-pill pill-red" transform="translate(530, 95)" data-id="boiling">
                <rect width="150" height="30" rx="15" fill="#ffeaea" stroke="#ff453a" stroke-width="1.8" />
                <text x="75" y="19" fill="#d70015" font-size="12" font-weight="700" text-anchor="middle">Forrás & Párolgás</text>
              </g>

              <!-- Lecsapódás (exoterm) -->
              <g id="pillCondensation" class="transition-pill pill-blue" transform="translate(595, 225)" data-id="condensation">
                <rect width="155" height="30" rx="15" fill="#e8f4fd" stroke="#0a84ff" stroke-width="1.8" />
                <text x="77.5" y="19" fill="#0055b3" font-size="12" font-weight="700" text-anchor="middle">Lecsapódás (exoterm)</text>
              </g>

              <!-- Fagyás (exoterm) -->
              <g id="pillFreezing" class="transition-pill pill-blue" transform="translate(325, 340)" data-id="freezing">
                <rect width="135" height="30" rx="15" fill="#e8f4fd" stroke="#0a84ff" stroke-width="1.8" />
                <text x="67.5" y="19" fill="#0055b3" font-size="12" font-weight="700" text-anchor="middle">Fagyás (exoterm)</text>
              </g>

              <!-- Szublimáció (endoterm) -->
              <g id="pillSublimation" class="transition-pill pill-red" transform="translate(405, 25)" data-id="sublimation">
                <rect width="180" height="30" rx="15" fill="#ffeaea" stroke="#ff453a" stroke-width="1.8" />
                <text x="90" y="19" fill="#d70015" font-size="12" font-weight="700" text-anchor="middle">Szublimáció (endoterm)</text>
              </g>

              <!-- Reszublimáció (exoterm) -->
              <g id="pillResublimation" class="transition-pill pill-blue" transform="translate(395, 415)" data-id="resublimation">
                <rect width="195" height="30" rx="15" fill="#e8f4fd" stroke="#0a84ff" stroke-width="1.8" />
                <text x="97.5" y="19" fill="#0055b3" font-size="12" font-weight="700" text-anchor="middle">Reszublimáció (exoterm)</text>
              </g>
            </svg>
          </div>

          <!-- Részletes információs fiók (kiválasztott átmenet/állapot leírása) -->
          <div class="diagram-info-drawer" id="diagramInfoDrawer">
            <div class="info-content" id="drawerContent">
              <span class="info-tag">TIPP</span>
              <span>Koppints a fenti halmazállapotokra vagy átmenetekre, vagy húzd az alsó hőmérséklet-csúszkát a folyamat megfigyeléséhez!</span>
            </div>
          </div>
        </div>

        <!-- Alsó interaktív vezérlősáv: Hőmérséklet csúszka (-50 °C .. +150 °C) -->
        <div class="diagram-footer">
          <div class="slider-panel">
            <div class="slider-header-row">
              <div class="temp-indicator" id="tempDisplay">
                Hőmérséklet (Víz modell): <span class="temp-val" id="tempValue">+20 °C</span>
                <span class="phase-tag" id="phaseTag">(Folyékony fázis)</span>
              </div>
              <div class="energy-indicator" id="energyIndicator">
                Közölt energia: <span class="energy-val" id="energyValue">234 kJ</span>
              </div>
            </div>

            <div class="slider-track-wrap">
              <span class="range-bound min-bound">−50 °C</span>
              <div class="range-container">
                <input type="range" min="-50" max="150" value="20" id="tempSlider" class="phase-slider" />
                <!-- Jelzőpontok a csúszkán -->
                <div class="slider-ticks">
                  <div class="tick tick-ice" style="left: 0%;">−50°</div>
                  <div class="tick tick-melt" style="left: 25%;">0° (Olvadás)</div>
                  <div class="tick tick-water" style="left: 50%;">+50°</div>
                  <div class="tick tick-boil" style="left: 75%;">100° (Forrás)</div>
                  <div class="tick tick-steam" style="left: 100%;">+150°</div>
                </div>
              </div>
              <span class="range-bound max-bound">+150 °C</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const btnBack = this.container.querySelector('#btnDiagramBack');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.stopWalkthrough();
        stopSpeaking();
        if (this.onBackToMenu) this.onBackToMenu();
      });
    }

    const slider = this.container.querySelector('#tempSlider');
    if (slider) {
      slider.addEventListener('input', e => {
        this.stopWalkthrough();
        this.temp = parseFloat(e.target.value);
        this.updateState();
      });
    }

    const btnWalk = this.container.querySelector('#btnDiagramWalkthrough');
    if (btnWalk) {
      btnWalk.addEventListener('click', () => this.toggleWalkthrough());
    }

    const btnAudio = this.container.querySelector('#btnDiagramAudio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => this.speakCurrentState());
    }

    // Dobozok kattintása
    const boxSolid = this.container.querySelector('#boxSolid');
    if (boxSolid) {
      boxSolid.addEventListener('click', () => this.selectElement('solid'));
    }

    const boxLiquid = this.container.querySelector('#boxLiquid');
    if (boxLiquid) {
      boxLiquid.addEventListener('click', () => this.selectElement('liquid'));
    }

    const boxGas = this.container.querySelector('#boxGas');
    if (boxGas) {
      boxGas.addEventListener('click', () => this.selectElement('gas'));
    }

    // Pill átmenetek kattintása
    const pills = this.container.querySelectorAll('.transition-pill');
    pills.forEach(p => {
      p.addEventListener('click', () => {
        const id = p.getAttribute('data-id');
        this.selectElement(id);
      });
    });
  }

  updateState() {
    const t = this.temp;
    const tempValue = this.container.querySelector('#tempValue');
    const phaseTag = this.container.querySelector('#phaseTag');
    const energyValue = this.container.querySelector('#energyValue');
    const slider = this.container.querySelector('#tempSlider');
    if (slider && parseFloat(slider.value) !== t) {
      slider.value = t;
    }

    // Tiszta formázás
    const sign = t > 0 ? '+' : '';
    if (tempValue) tempValue.textContent = `${sign}${Math.round(t)} °C`;

    // Halmazállapot és energia becslés 1 kg vízre
    let phaseText = '';
    let phaseClass = '';
    let approxEnergy = 0;

    // Elemek referenciái
    const boxSolid = this.container.querySelector('#boxSolid');
    const boxLiquid = this.container.querySelector('#boxLiquid');
    const boxGas = this.container.querySelector('#boxGas');

    const pathSub = this.container.querySelector('#pathSublimation');
    const pathMelt = this.container.querySelector('#pathMelting');
    const pathBoil = this.container.querySelector('#pathBoiling');
    const pathCond = this.container.querySelector('#pathCondensation');
    const pathFreeze = this.container.querySelector('#pathFreezing');

    // Mindent alaphelyzetbe
    [boxSolid, boxLiquid, boxGas].forEach(b => {
      if (b) b.classList.remove('active-glow', 'pulse-red', 'pulse-blue');
    });
    [pathSub, pathMelt, pathBoil, pathCond, pathFreeze].forEach(p => {
      if (p) p.classList.remove('active-path');
    });

    if (t < 0) {
      phaseText = '(Szilárd fázis • Jég)';
      phaseClass = 'state-solid';
      approxEnergy = Math.round(2.1 * (t + 50));
      if (boxSolid) boxSolid.classList.add('active-glow');
    } else if (t === 0) {
      phaseText = '(Olvadási / Fagyási plató • 0 °C)';
      phaseClass = 'state-plateau';
      approxEnergy = 105 + 167; // + látens hő fele
      if (boxSolid) boxSolid.classList.add('active-glow');
      if (boxLiquid) boxLiquid.classList.add('active-glow');
      if (pathMelt) pathMelt.classList.add('active-path');
    } else if (t > 0 && t < 100) {
      phaseText = '(Folyékony fázis • Víz)';
      phaseClass = 'state-liquid';
      approxEnergy = Math.round(105 + 334 + 4.18 * t);
      if (boxLiquid) boxLiquid.classList.add('active-glow');
    } else if (t === 100) {
      phaseText = '(Forrási / Lecsapódási plató • 100 °C)';
      phaseClass = 'state-plateau';
      approxEnergy = Math.round(105 + 334 + 418 + 1130);
      if (boxLiquid) boxLiquid.classList.add('active-glow');
      if (boxGas) boxGas.classList.add('active-glow');
      if (pathBoil) pathBoil.classList.add('active-path');
    } else {
      phaseText = '(Légnemű fázis • Vízgőz)';
      phaseClass = 'state-gas';
      approxEnergy = Math.round(105 + 334 + 418 + 2260 + 2.0 * (t - 100));
      if (boxGas) boxGas.classList.add('active-glow');
    }

    if (phaseTag) {
      phaseTag.textContent = phaseText;
      phaseTag.className = `phase-tag ${phaseClass}`;
    }
    if (energyValue) {
      energyValue.textContent = `${approxEnergy} kJ`;
    }
  }

  selectElement(id) {
    const drawer = this.container.querySelector('#drawerContent');
    if (!drawer) return;

    const data = this.getElementData(id);
    if (!data) return;

    this.activePill = id;

    // SVG kiemelések
    this.container.querySelectorAll('.transition-pill').forEach(p => p.classList.remove('selected-pill'));
    const pill = this.container.querySelector(`.transition-pill[data-id="${id}"]`);
    if (pill) pill.classList.add('selected-pill');

    drawer.innerHTML = `
      <div class="info-badge ${data.typeClass}">${data.badge}</div>
      <div class="info-title-row">
        <h3 class="info-title">${data.title}</h3>
        <span class="info-thermo">${data.thermo}</span>
      </div>
      <p class="info-desc">${data.desc}</p>
    `;

    // Hangos felolvasás
    speak(`${data.title}. ${data.desc}`);
  }

  getElementData(id) {
    const map = {
      solid: {
        badge: 'HALMAZÁLLAPOT',
        typeClass: 'badge-blue',
        title: 'Szilárd halmazállapot (Jég)',
        thermo: 'Alacsony belső energia (T < 0 °C)',
        desc: 'A vízmolekulák szilárd kristályrácsban rögzülnek, hidrogénkötésekkel tetraéderekbe és hatszögekbe kapcsolódva. Csak helyhez kötött rácsrezgést végeznek; alakjuk és térfogatuk is állandó.'
      },
      liquid: {
        badge: 'HALMAZÁLLAPOT',
        typeClass: 'badge-cyan',
        title: 'Folyékony halmazállapot (Víz)',
        thermo: 'Közepes belső energia (0 °C < T < 100 °C)',
        desc: 'A merev rácskötések felbomlottak: a molekulák szabadon áramlanak és elgördülnek egymáson, felvéve az edény alakját. Térfogatuk azonban a vonzóerők miatt állandó.'
      },
      gas: {
        badge: 'HALMAZÁLLAPOT',
        typeClass: 'badge-red',
        title: 'Légnemű halmazállapot (Vízgőz)',
        thermo: 'Magas belső energia (T > 100 °C)',
        desc: 'A molekulák közötti vonzóerők megszűntek: a részecskék óriási sebességgel száguldanak a térben, kitöltik a rendelkezésre álló edényt, és könnyen összenyomhatók.'
      },
      melting: {
        badge: 'ENDOTERM ÁTMENET (+Q)',
        typeClass: 'badge-red',
        title: 'Olvadás (Szilárd ➔ Folyékony)',
        thermo: 'Hőfelvétel: Olvadáshő = 334 kJ/kg • 0 °C',
        desc: 'A közölt hő a jég kristályrácsának megbontására fordítódik. Amíg a jég el nem olvad, a hőmérséklet pontosan 0 °C marad: ez az olvadási plató!'
      },
      freezing: {
        badge: 'EXOTERM ÁTMENET (−Q)',
        typeClass: 'badge-blue',
        title: 'Fagyás (Folyékony ➔ Szilárd)',
        thermo: 'Hőleadás: Fagyáshő = 334 kJ/kg • 0 °C',
        desc: 'A folyadék lehűlésekor a molekulák kinetikus energiája lecsökken, a vonzóerők újra szilárd hexagonális rácsba rendezik a részecskéket hőleadás kíséretében.'
      },
      boiling: {
        badge: 'ENDOTERM ÁTMENET (+Q)',
        typeClass: 'badge-red',
        title: 'Forrás & Párolgás (Folyékony ➔ Gáz)',
        thermo: 'Hőfelvétel: Forráshő = 2260 kJ/kg • 100 °C',
        desc: 'A forrásponton nemcsak a felszínen (párolgás), hanem a folyadék belsejében is gőzbuborékok képződnek. A hatalmas forráshő tartja a hőmérsékletet a 100 °C-os platón.'
      },
      condensation: {
        badge: 'EXOTERM ÁTMENET (−Q)',
        typeClass: 'badge-blue',
        title: 'Lecsapódás / Kondenzáció (Gáz ➔ Folyékony)',
        thermo: 'Hőleadás: Lecsapódási hő = 2260 kJ/kg • 100 °C',
        desc: 'A forró gőz lehűlésekor a molekulák lelassulnak, és a vonzóerők hatására folyadékká csapódnak le. A felszabaduló látens hő a környezetet fűti.'
      },
      sublimation: {
        badge: 'ENDOTERM ÁTMENET (+Q)',
        typeClass: 'badge-red',
        title: 'Szublimáció (Szilárd ➔ Gáz közvetlenül)',
        thermo: 'Hőfelvétel: Szublimációs hő = Lo + Lf = 2594 kJ/kg',
        desc: 'Alacsony nyomáson vagy száraz hideg levegőben a szilárd anyag a folyadékállapot kihagyásával közvetlenül légneművé válik (pl. szárazjég vagy télen a száradó ruha).'
      },
      resublimation: {
        badge: 'EXOTERM ÁTMENET (−Q)',
        typeClass: 'badge-blue',
        title: 'Reszublimáció (Gáz ➔ Szilárd közvetlenül)',
        thermo: 'Hőleadás: Deszublimáció',
        desc: 'A vízgőz közvetlenül jégkristályokká csapódik ki anélkül, hogy először folyékony vízzé válna. Ennek a folyamatnak az eredménye a téli ablakokon a jégvirág vagy a dér.'
      }
    };
    return map[id] || null;
  }

  toggleWalkthrough() {
    if (this.walkthroughTimer) {
      this.stopWalkthrough();
    } else {
      this.startWalkthrough();
    }
  }

  startWalkthrough() {
    this.walkthroughStep = 0;
    const btn = this.container.querySelector('#btnDiagramWalkthrough');
    if (btn) {
      btn.innerHTML = '<span class="btn-icon">⏸</span> Megállítás';
      btn.classList.add('btn-active');
    }

    const steps = [
      { temp: -30, select: 'solid', msg: 'Kezdjük −30 °C-os szilárd jéggel. A molekulák rácsrezgést végeznek.' },
      { temp: 0, select: 'melting', msg: 'Elértük a 0 °C-ot: az olvadás endoterm folyamat, felveszi az olvadáshőt, a hőmérséklet állandó marad.' },
      { temp: 40, select: 'liquid', msg: '+40 °C-os folyékony víz: a molekulák szabadon áramlanak és elgördülnek egymáson.' },
      { temp: 100, select: 'boiling', msg: '100 °C: a forrás hatalmas forráshőt vesz fel, a folyadék légnemű vízgőzzé alakul.' },
      { temp: 130, select: 'gas', msg: '+130 °C-os gőz: a részecskék száguldanak és kitöltik a teljes teret.' },
      { temp: 100, select: 'condensation', msg: 'Hűtéskor a gőz 100 °C-on lecsapódik: ez exoterm folyamat, hőt ad le a környezetnek.' },
      { temp: 0, select: 'freezing', msg: '0 °C-on a víz megfagy: a fagyáshő leadásával újra szilárd jéggé rendeződik.' },
      { temp: -20, select: 'sublimation', msg: 'Speciális átmenet a szublimáció: a szilárd anyag közvetlenül gőzzé válik.' },
      { temp: -40, select: 'resublimation', msg: 'A reszublimáció során pedig a gőzből közvetlenül dér és jégkristály képződik!' }
    ];

    const runStep = () => {
      if (this.walkthroughStep >= steps.length) {
        this.stopWalkthrough();
        return;
      }
      const st = steps[this.walkthroughStep];
      this.temp = st.temp;
      this.updateState();
      this.selectElement(st.select);

      this.walkthroughStep++;
      this.walkthroughTimer = setTimeout(runStep, 5500);
    };

    runStep();
  }

  stopWalkthrough() {
    if (this.walkthroughTimer) {
      clearTimeout(this.walkthroughTimer);
      this.walkthroughTimer = null;
    }
    const btn = this.container?.querySelector('#btnDiagramWalkthrough');
    if (btn) {
      btn.innerHTML = '<span class="btn-icon">▶</span> Végigjárás';
      btn.classList.remove('btn-active');
    }
  }

  speakCurrentState() {
    if (this.activePill) {
      const data = this.getElementData(this.activePill);
      if (data) speak(`${data.title}. ${data.desc}`);
    } else {
      const t = this.temp;
      if (t < 0) speak(`Jelenleg ${Math.round(t)} fokos szilárd jég látható. Szilárd állapotban a molekulák rácsrezgést végeznek.`);
      else if (t === 0) speak('0 Celsius-fok: olvadási és fagyási egyensúlyi plató.');
      else if (t < 100) speak(`Jelenleg ${Math.round(t)} fokos folyékony víz látható. A molekulák áramlanak.`);
      else if (t === 100) speak('100 Celsius-fok: forráspont és lecsapódási plató.');
      else speak(`Jelenleg ${Math.round(t)} fokos vízgőz látható. A részecskék szabadon mozognak.`);
    }
  }
}
