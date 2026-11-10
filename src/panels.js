import * as THREE from 'three';

// Szupermintavételezés a tűéles Apple Vision Pro minőségű rendereléshez (3x Retina felbontás)
export const SS = 3.0;

// Lekerekített téglalap (visionOS szuper-elliptikus folyamatos görbülethez)
export function rrect(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
}

// Apple SF Pro szöveg rajzolása
export function txt(c, s, x, y, size, color = '#ffffff', weight = '600', align = 'left') {
  c.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
}

// Apple SF Pro automatikusan tördelő szöveg
export function wrap(c, s, x, y, maxW, lh, size, color = '#ffffff', weight = '500') {
  c.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`;
  c.fillStyle = color;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  let line = '';
  for (const word of String(s).split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line) {
    c.fillText(line, x, y);
    y += lh;
  }
  return y;
}

// Egységes Sötét Segment / Ornament kapszula háttér (#141414, #262626 szegély)
export function drawOrnament(c, x, y, w, h, radius = null) {
  const rad = radius !== null ? radius : h / 2;
  c.save();

  // Sötét belső kapszula
  c.fillStyle = '#141414';
  rrect(c, x, y, w, h, rad);
  c.fill();

  // Finom peremszegély
  c.strokeStyle = '#262626';
  c.lineWidth = 1.0;
  rrect(c, x + 0.5, y + 0.5, w - 1, h - 1, rad);
  c.stroke();

  c.restore();
}

// Egységes Sötét Dashboard Panel (#141414, #262626 szegély) a spatial_hud_dev.html stílusában
export function base(c, p, title, titleSize, opts = {}) {
  const cornerR = opts.radius || 24;

  c.save();

  // 1. Áttetsző mélységi háttér
  c.fillStyle = 'rgba(10, 10, 10, 0.75)';
  rrect(c, 0, 0, p.pw, p.ph, cornerR);
  c.fill();

  // 2. FŐ RÉTEG: Sötét Dashboard Kártya (#141414)
  c.fillStyle = '#141414';
  rrect(c, 0, 0, p.pw, p.ph, cornerR);
  c.fill();

  // 3. Finom peremszegély (#262626)
  c.strokeStyle = '#262626';
  c.lineWidth = 1.5;
  rrect(c, 0.75, 0.75, p.pw - 1.5, p.ph - 1.5, cornerR);
  c.stroke();

  // 4. Fejléc ha van cím
  if (title) {
    const ts = titleSize || (p.pw >= 600 ? 22 : 18);
    const ty = ts >= 22 ? 38 : 34;
    const dy = ts >= 22 ? 52 : 46;

    txt(c, title, 22, ty, ts, '#ffffff', '700');

    // Finom elválasztó vonal a fejléc alatt (#262626)
    c.strokeStyle = '#262626';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(20, dy);
    c.lineTo(p.pw - 20, dy);
    c.stroke();
  }

  c.restore();
}

// Egységes Sötét Dashboard Gomb (#1e1e1e secondary, #0d6efd primary)
export function drawButton(c, p, w) {
  const label = typeof w.label === 'function' ? w.label() : w.label;
  const off = w.disabled?.() ?? false;
  const hov = p.hoverId === w.id && !off;
  const dn = p.activeId === w.id && !off;

  c.save();
  c.globalAlpha = off ? 0.35 : 1;

  const isPrimary = typeof w.primary === 'function' ? w.primary() : !!w.primary;
  const isSelected = typeof w.selected === 'function' ? w.selected() : !!w.selected;

  const radius = w.radius !== undefined ? w.radius : 12;
  const pressOffsetY = dn ? 1.5 : 0;

  // 1. Háttér kitöltés (#0d6efd ha primary/selected, #1e1e1e ha secondary)
  if (isPrimary || isSelected) {
    c.fillStyle = dn ? '#0b5ed7' : (hov ? '#0b5ed7' : '#0d6efd');
  } else {
    c.fillStyle = dn ? '#2a2a2a' : (hov ? '#262626' : (w.cardBg || '#1e1e1e'));
  }

  rrect(c, w.x, w.y + pressOffsetY, w.w, w.h, radius);
  c.fill();

  // 2. Szegély (#262626 ha secondary, finom kék ha primary)
  c.strokeStyle = isPrimary || isSelected
    ? (hov ? '#60a5fa' : 'rgba(13, 110, 253, 0.45)')
    : (hov ? '#404040' : (w.borderColor || '#262626'));
  c.lineWidth = (isSelected || hov) ? 1.8 : 1.0;
  rrect(c, w.x + 0.5, w.y + pressOffsetY + 0.5, w.w - 1, w.h - 1, radius);
  c.stroke();

  // 3. Bezárás gomb
  if (w.isClose || label === '✕' || label === '✖' || label === 'x' || label === 'X') {
    const cx = w.x + w.w / 2;
    const cy = w.y + w.h / 2 + pressOffsetY;
    const sz = 6.5;
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - sz, cy - sz);
    c.lineTo(cx + sz, cy + sz);
    c.moveTo(cx + sz, cy - sz);
    c.lineTo(cx - sz, cy + sz);
    c.stroke();
  } else if (w.icon && w.sublabel) {
    const cy = w.y + pressOffsetY;
    const isSmall = w.w < 140;
    const iconX = w.x + (isSmall ? 18 : (w.w < 180 ? 24 : 32));
    const textX = w.x + (isSmall ? 38 : (w.w < 180 ? 48 : 62));
    const maxTextW = Math.max(30, w.w - (textX - w.x) - 10);

    c.save();
    rrect(c, w.x, w.y + pressOffsetY, w.w, w.h, radius);
    c.clip();

    txt(c, w.icon, iconX, cy + w.h / 2 + (w.iconSize ? w.iconSize * 0.35 : 8), w.iconSize || 22, '#ffffff', '400', 'center');

    let fitLabel = label;
    c.font = `600 ${w.size || 14}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif`;
    if (c.measureText(fitLabel).width > maxTextW) {
      while (fitLabel.length > 2 && c.measureText(fitLabel + '…').width > maxTextW) {
        fitLabel = fitLabel.slice(0, -1);
      }
      fitLabel += '…';
    }
    txt(c, fitLabel, textX, cy + w.h * 0.42, w.size || 14, '#ffffff', '600', 'left');
    txt(c, w.sublabel, textX, cy + w.h * 0.76, w.subsize || 11, 'rgba(255, 255, 255, 0.70)', '500', 'left');
    c.restore();
  } else if (w.sublabel) {
    const cy = w.y + pressOffsetY;
    txt(c, label, w.x + w.w / 2, cy + w.h * 0.42, w.size || 14, '#ffffff', '600', 'center');
    txt(c, w.sublabel, w.x + w.w / 2, cy + w.h * 0.76, w.subsize || 11, 'rgba(255, 255, 255, 0.70)', '500', 'center');
  } else {
    const cy = w.y + pressOffsetY;
    const padX = w.padX || 12;
    const maxTextW = Math.max(20, w.w - padX * 2);
    let fontSize = w.size || 13.5;
    const weight = w.weight || '600';
    const align = w.align || 'center';
    const color = isPrimary || isSelected ? '#ffffff' : (w.textColor || (hov ? '#ffffff' : '#e4e4e7'));
    const textX = align === 'left' ? w.x + padX : (align === 'right' ? w.x + w.w - padX : w.x + w.w / 2);
    txt(c, label, textX, cy + w.h / 2 + fontSize * 0.35, fontSize, color, weight, align);
  }

  c.restore();
}

// Egységes Sötét Csúszka (#222225 sáv, világító korong, felező vonal)
export function drawSlider(c, p, w, frac, color = '#38bdf8') {
  const clampedFrac = Math.max(0, Math.min(1, frac));

  c.save();

  // 1. Háttér sáv: 8px vastag lekerekített sáv (#222225)
  const trackH = 8;
  const trackY = w.y + (w.h - trackH) / 2;
  const rTrack = trackH / 2;

  c.fillStyle = '#222225';
  rrect(c, w.x, trackY, w.w, trackH, rTrack);
  c.fill();

  // Szegély (#2a2a2e)
  c.strokeStyle = '#2a2a2e';
  c.lineWidth = 1;
  rrect(c, w.x + 0.5, trackY + 0.5, w.w - 1, trackH - 1, rTrack);
  c.stroke();

  // 2. Felező referenciajel (középen 50%-nál)
  const midX = w.x + w.w / 2;
  c.fillStyle = '#52525b';
  c.fillRect(midX - 1, trackY - 3, 2, trackH + 6);

  // 3. Színezett aktív sáv balról a korongig
  const innerW = w.w - 18;
  const kx = w.x + 9 + innerW * clampedFrac;
  const ky = w.y + w.h / 2;

  if (kx > w.x) {
    c.save();
    rrect(c, w.x, trackY, w.w, trackH, rTrack);
    c.clip();

    c.fillStyle = color;
    c.fillRect(w.x, trackY, Math.max(0, kx - w.x), trackH);
    c.restore();
  }

  // 4. Csúszka korong (Thumb): világító pont a sáv színében
  const isActive = p.activeId === w.id;
  const isHover = p.hoverId === w.id;
  const r = 9 + (isActive ? 2 : (isHover ? 1.5 : 0));

  c.shadowColor = color;
  c.shadowBlur = isActive || isHover ? 16 : 10;
  c.fillStyle = color;
  c.beginPath();
  c.arc(kx, ky, r, 0, Math.PI * 2);
  c.fill();

  c.shadowBlur = 0;
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.0;
  c.beginPath();
  c.arc(kx, ky, r, 0, Math.PI * 2);
  c.stroke();

  c.restore();
}

export class Panel {
  constructor({ pw, ph, wm, draw, billboard = false, ss = 3.0 }) {
    const scale = ss || SS;
    Object.assign(this, { pw, ph, wm, hm: wm * ph / pw, drawFn: draw, billboard, ss: scale });
    this.widgets = [];
    this.hoverId = null;
    this.activeId = null;
    this.dirty = true;
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.round(pw * scale);
    this.canvas.height = Math.round(ph * scale);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.magFilter = THREE.LinearFilter;
    this.tex.generateMipmaps = false;

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(wm, this.hm),
      new THREE.MeshBasicMaterial({
        map: this.tex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    this.mesh.renderOrder = 10;
    this.mesh.userData.panel = this;
  }

  get visible() { return this.mesh.visible; }
  set visible(v) { this.mesh.visible = v; }

  setHover(id) {
    if (this.hoverId !== id) {
      this.hoverId = id;
      this.dirty = true;
    }
  }

  setActive(id) {
    if (this.activeId !== id) {
      this.activeId = id;
      this.dirty = true;
    }
  }

  redraw() {
    const c = this.ctx;
    const s = this.ss || SS;
    c.setTransform(s, 0, 0, s, 0, 0);
    c.clearRect(0, 0, this.pw, this.ph);
    this.drawFn(c, this);
    this.tex.needsUpdate = true;
    this.dirty = false;
  }

  widgetAt(u, v) {
    for (let i = this.widgets.length - 1; i >= 0; i--) {
      const w = this.widgets[i];
      if (w.hidden?.()) continue;
      const pad = w.pad !== undefined ? w.pad : (w.kind === 'btn' ? 8 : 22);
      if (u >= w.x - pad && u <= w.x + w.w + pad && v >= w.y - pad && v <= w.y + w.h + pad) {
        return w;
      }
    }
    return null;
  }

  press(w, u, v) {
    if (w.disabled?.()) return;
    this.setActive(w.id);
    if (w.kind === 'btn') {
      w.onClick?.();
    } else {
      this.drag(w, u, v);
    }
  }

  drag(w, u, v) {
    let f;
    if (w.kind === 'h') {
      const r = w.h / 2;
      f = (u - (w.x + r)) / Math.max(1, w.w - w.h);
    } else {
      f = 1 - (v - w.y) / w.h;
    }
    f = Math.max(0, Math.min(1, f));
    w.onDrag?.(f);
    this.dirty = true;
  }

  pointLocal(pointWorld) {
    const m = this.mesh;
    m.updateWorldMatrix(true, false);
    const lo = pointWorld.clone().applyMatrix4(m.matrixWorld.clone().invert());
    const u = (lo.x + this.wm / 2) / this.wm * this.pw;
    const v = (this.hm / 2 - lo.y) / this.hm * this.ph;
    return {
      u, v, z: lo.z,
      inside: u >= 0 && u <= this.pw && v >= 0 && v <= this.ph
    };
  }
}
