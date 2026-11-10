// Főmenü Kezelő (App Main Menu & Témakörválasztó)
// Apple visionOS stílusú lebegő üveg kártyák és témakör navigáció

export class AppMenu {
  constructor({ onSelectModule }) {
    this.onSelectModule = onSelectModule;
    this.currentTopic = 'thermo'; // 'thermo', 'electro', 'mech', 'optics'
    this.container = null;
  }

  mount(parentEl) {
    this.container = document.createElement('div');
    this.container.id = 'app-menu-container';
    this.container.className = 'app-menu-overlay';
    this.container.innerHTML = this.renderHTML();
    parentEl.appendChild(this.container);

    this.bindEvents();
  }

  unmount() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  renderHTML() {
    return `
      <div class="menu-backdrop">
        <!-- Fő fejléc -->
        <header class="menu-hero">
          <div class="hero-brand-row">
            <img src="/app-icon.svg" class="menu-hero-icon" alt="PhysiXR App Icon" />
            <div class="hero-brand-text">
              <div class="menu-spatial-pill">
                <span class="pulse-dot"></span> visionOS Spatial Physics
              </div>
              <h1 class="menu-main-title">Physi<span class="highlight">XR</span></h1>
            </div>
          </div>
          <p class="menu-subtitle">Interaktív Térbeli Fizika Oktatóplatform • Interactive Spatial Physics Lab</p>
        </header>

        <!-- 1. Szint: Fizika Témakör Választó -->
        <div class="topics-bar-wrap">
          <div class="topics-label">VÁLASSZ FIZIKA TÉMAKÖRT:</div>
          <div class="topics-nav">
            <button class="topic-btn ${this.currentTopic === 'thermo' ? 'active' : ''}" data-topic="thermo">
              <span class="topic-icon">🔥</span>
              <span class="topic-name">Hőtan & Termodinamika</span>
              <span class="topic-badge">3 Modul</span>
            </button>
            <button class="topic-btn ${this.currentTopic === 'electro' ? 'active' : ''}" data-topic="electro">
              <span class="topic-icon">⚡</span>
              <span class="topic-name">Elektromosságtan</span>
              <span class="topic-badge muted">Hamarosan</span>
            </button>
            <button class="topic-btn ${this.currentTopic === 'mech' ? 'active' : ''}" data-topic="mech">
              <span class="topic-icon">🏹</span>
              <span class="topic-name">Mechanika</span>
              <span class="topic-badge muted">Hamarosan</span>
            </button>
            <button class="topic-btn ${this.currentTopic === 'optics' ? 'active' : ''}" data-topic="optics">
              <span class="topic-icon">🌈</span>
              <span class="topic-name">Fénytan & Hullámok</span>
              <span class="topic-badge muted">Hamarosan</span>
            </button>
          </div>
        </div>

        <!-- 2. Szint: Választott Témakör Moduljai -->
        <main class="modules-section">
          ${this.renderModulesContent()}
        </main>

        <!-- Lábléc infó -->
        <footer class="menu-footer">
          <span>Meta Quest 3 Kevert Valóság (MR) & Asztali Böngésző támogatás</span>
          <span class="footer-dot">•</span>
          <span>WebXR & Three.js</span>
        </footer>
      </div>
    `;
  }

  renderModulesContent() {
    if (this.currentTopic === 'thermo') {
      return `
        <div class="modules-grid">
          <!-- Modul 1: Vízmolekula -->
          <div class="module-card card-cyan" data-module="molecule">
            <div class="card-glow"></div>
            <div class="card-badge">3D INTERAKTÍV MODELL</div>
            <div class="card-icon-wrap">
              <span class="card-large-icon">💧</span>
            </div>
            <h3 class="card-title">A Vízmolekula Megismerése</h3>
            <p class="card-desc">
              Tanulmányozd a H₂O molekula felépítését, kovalens kötéseit, 104.5°-os szögét, dipólus polaritását és a jég hatszögletű kristályrácsát.
            </p>
            <div class="card-tags">
              <span class="tag">H₂O Kötésszög</span>
              <span class="tag">Dipólus</span>
              <span class="tag">Jégkristály (Ice Ih)</span>
            </div>
            <button class="card-action-btn btn-cyan">
              Megnyitás ➔
            </button>
          </div>

          <!-- Modul 2: Folyamatábra -->
          <div class="module-card card-purple" data-module="diagram">
            <div class="card-glow"></div>
            <div class="card-badge">INTERAKTÍV FOLYAMATÁBRA</div>
            <div class="card-icon-wrap">
              <span class="card-large-icon">📊</span>
            </div>
            <h3 class="card-title">Halmazállapot-változások és Hőforgalom</h3>
            <p class="card-desc">
              Interaktív fázistérkép az endoterm és exoterm átmenetekkel (olvadás, fagyás, forrás, lecsapódás, szublimáció) és élő hőmérséklet-csúszkával.
            </p>
            <div class="card-tags">
              <span class="tag">Endoterm / Exoterm</span>
              <span class="tag">Hőmérséklet-csúszka</span>
              <span class="tag">Szublimáció</span>
            </div>
            <button class="card-action-btn btn-purple">
              Megnyitás ➔
            </button>
          </div>

          <!-- Modul 3: Virtuális Labor -->
          <div class="module-card card-gold featured-card" data-module="lab">
            <div class="card-glow"></div>
            <div class="card-badge featured-badge">TELJES 3D MR SANDBOX</div>
            <div class="card-icon-wrap">
              <span class="card-large-icon">🧪</span>
            </div>
            <h3 class="card-title">Halmazállapot-változások 3D Laboratórium</h3>
            <p class="card-desc">
              Valós idejű termodinamikai labor: jégkocka mikroszkopikus zoomja, láng/hűtés, dugattyú, élő plató-grafikon, 3D tutor és küldetések.
            </p>
            <div class="card-tags">
              <span class="tag">Entalpia Modell</span>
              <span class="tag">Platók & Látens Hő</span>
              <span class="tag">3D Tutor Robot</span>
            </div>
            <button class="card-action-btn btn-gold">
              Labor Indítása (WebXR / 3D) ➔
            </button>
          </div>
        </div>
      `;
    } else {
      const topicTitles = {
        electro: '⚡ Elektromosságtan & Mágnesesség',
        mech: '🏹 Mechanika & Kinematika',
        optics: '🌈 Fénytan & Hullámoptika'
      };
      return `
        <div class="coming-soon-box">
          <div class="cs-icon">🚧</div>
          <h2>${topicTitles[this.currentTopic] || 'Témakör'}</h2>
          <p>Ez a témakör jelenleg kidolgozás alatt áll. Kérlek, válaszd a <strong>Hőtan & Termodinamika</strong> témakört a működő interaktív anyagok felfedezéséhez!</p>
          <button class="back-to-thermo-btn" id="btnBackToThermo">
            🔥 Vissza a Hőtan témakörhöz
          </button>
        </div>
      `;
    }
  }

  bindEvents() {
    // Témakör váltó gombok
    const topicBtns = this.container.querySelectorAll('.topic-btn');
    topicBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-topic');
        this.currentTopic = t;
        this.refresh();
      });
    });

    // Modul kártya kattintások
    const cards = this.container.querySelectorAll('.module-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const mod = card.getAttribute('data-module');
        if (this.onSelectModule) {
          this.onSelectModule(mod);
        }
      });
    });

    const btnBackThermo = this.container.querySelector('#btnBackToThermo');
    if (btnBackThermo) {
      btnBackThermo.addEventListener('click', () => {
        this.currentTopic = 'thermo';
        this.refresh();
      });
    }
  }

  refresh() {
    if (!this.container) return;
    const parent = this.container.parentNode;
    this.unmount();
    if (parent) this.mount(parent);
  }
}
