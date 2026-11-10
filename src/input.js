import * as THREE from 'three';

const _raycaster = new THREE.Raycaster();
const _mouseVec = new THREE.Vector2();
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();
const _t = new THREE.Vector3();

// WebXR megbízható kontroller- és kézkövetés-kezelő
export class Input {
  constructor({ renderer, camera, dom, getPanels, getTargets, onJoystickTransform, onLeftJoystickTransform }) {
    Object.assign(this, { renderer, camera, dom, getPanels, getTargets, onJoystickTransform, onLeftJoystickTransform });
    this.enabled = true;
    this.capturing = false;
    this.state = {};
    this.mouse = { x: 0, y: 0, in: false, down: false };

    // Asztali egér események
    dom.addEventListener('pointermove', e => {
      this.setMouse(e);
      this.mouse.in = true;
    });
    dom.addEventListener('pointerdown', e => {
      this.setMouse(e);
      this.mouse.in = true;
      this.mouse.down = true;
    });
    const onUp = () => { this.mouse.down = false; };
    dom.addEventListener('pointerup', onUp);
    dom.addEventListener('pointercancel', onUp);
    dom.addEventListener('pointerleave', () => {
      this.mouse.in = false;
      this.mouse.down = false;
    });

    // Kontrollerek sugarának és célzópontjának létrehozása
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    this.ctrls = [0, 1].map(i => {
      const c = renderer.xr.getController(i);
      c.userData = {
        id: i,
        selecting: false,
        connected: false,
        hand: false,
        inputSource: null
      };

      c.addEventListener('selectstart', () => {
        c.userData.selecting = true;
        this.triggerDown(i);
      });
      c.addEventListener('selectend', () => {
        c.userData.selecting = false;
        this.triggerUp(i);
      });
      c.addEventListener('connected', e => {
        c.userData.connected = true;
        c.userData.hand = !!e.data.hand;
        c.userData.inputSource = e.data;
        c.userData.line.visible = true;
      });
      c.addEventListener('disconnected', () => {
        c.userData.connected = false;
        c.userData.selecting = false;
        c.userData.inputSource = null;
        c.userData.line.visible = false;
      });

      // Látható lézersugár
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x70d6ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.visible = false;
      c.userData.line = line;
      c.add(line);

      // Ütközési jelző pont
      const dotGeo = new THREE.SphereGeometry(0.018, 16, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.visible = false;
      c.userData.dot = dot;
      c.add(dot);

      return c;
    });
  }

  setMouse(e) {
    const r = this.dom.getBoundingClientRect();
    this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  skipHeld() {
    Object.values(this.state).forEach(s => { if (s.down) s.skip = true; });
  }

  /**
   * Raycast vizsgálat az összes látható panelre és 3D interaktív célpontra
   */
  intersectRay(origin, direction, panels, targets) {
    _raycaster.set(origin, direction);
    _raycaster.near = 0.01;
    _raycaster.far = 25.0;

    const panelMeshes = panels.map(p => p.mesh);
    const hits = _raycaster.intersectObjects(panelMeshes, false);

    let bestHit = null;

    if (hits.length > 0) {
      // A legközelebbi érvényes paneltalálat kiválasztása
      const hit = hits[0];
      const panel = hit.object.userData.panel;
      if (panel && hit.uv) {
        const u = hit.uv.x * panel.pw;
        const v = (1 - hit.uv.y) * panel.ph;
        bestHit = {
          panel,
          dist: hit.distance,
          u,
          v,
          widget: panel.widgetAt(u, v)
        };
      }
    }

    // 3D célpontok (Tutor, Hotspot, Fogaskerék)
    // KRITIKUS: Ha a sugár egy látható UI panel interaktív gombjára / widgetjére mutat,
    // a felületi vezérlő (pl. "Teszt indítása" gomb) mindig elsőbbséget élvez,
    // így a 3D modell vagy a robot teste soha nem lophatja el vagy zárhatja el a sugarat!
    if (!bestHit?.widget) {
      for (const t of targets) {
        _t.subVectors(t.pos, origin);
        const tProj = _t.dot(direction);
        if (tProj <= 0.05) continue; // A célpont a sugár mögött van vagy a vezérlő belsejében

        const perpSq = _t.lengthSq() - tProj * tProj;
        const radSq = t.radius * t.radius;
        if (perpSq <= radSq) {
          const hitDist = Math.max(0.01, tProj - Math.sqrt(radSq - perpSq));
          // Csak akkor választjuk a 3D célpontot, ha közelebb van mint az esetleges üres panelháttér
          if (!bestHit || hitDist < bestHit.dist) {
            bestHit = { target: t, dist: hitDist };
          }
        }
      }
    }

    return bestHit;
  }

  getControllerRay(ctrlIdx) {
    const c = this.ctrls[ctrlIdx];
    c.updateWorldMatrix(true, false);
    c.getWorldPosition(_o);
    // Standard Three.js / WebXR kontroller sugár előremutató iránya világkoordinátában
    _d.set(0, 0, -1).transformDirection(c.matrixWorld).normalize();
    return { o: _o.clone(), d: _d.clone() };
  }

  triggerDown(ctrlIdx) {
    if (!this.enabled) return;
    const c = this.ctrls[ctrlIdx];
    if (!c.userData.connected) return;

    const { o, d } = this.getControllerRay(ctrlIdx);
    const panels = this.getPanels().filter(p => p.visible);
    const targets = this.getTargets();
    const hit = this.intersectRay(o, d, panels, targets);

    const st = (this.state['ctrl' + ctrlIdx] ??= { down: false, active: null, skip: false });
    st.down = true;

    if (st.skip) return;

    if (hit?.widget) {
      st.active = { panel: hit.panel, widget: hit.widget };
      hit.panel.press(hit.widget, hit.u, hit.v);
      this.capturing = true;
    } else if (hit?.target) {
      hit.target.onActivate();
      this.capturing = true;
    }
  }

  triggerUp(ctrlIdx) {
    const st = this.state['ctrl' + ctrlIdx];
    if (st) {
      st.down = false;
      st.skip = false;
      if (st.active) {
        st.active.panel.setActive(null);
        st.active = null;
      }
    }
  }

  /**
   * Kontroller joystick (thumbstick) mintavételezése WebXR-ben vagy Gamepad API-n keresztül
   * - hand: 'right' (modell forgatás és skálázás)
   * - hand: 'left' (HUD panelek skálázása)
   */
  pollStick(gamepad, dt, source, hand = 'right') {
    if (!gamepad || !gamepad.axes || gamepad.axes.length === 0) return;

    let rawX = 0;
    let rawY = 0;

    // WebXR xr-standard mapping:
    // axes[2] a hüvelykujj-kar (thumbstick) vízszintes tengelye (X: -1 balra, +1 jobbra)
    // axes[3] a hüvelykujj-kar függőleges tengelye (Y: -1 előre/fel, +1 hátra/le)
    if (gamepad.axes.length >= 4) {
      if (Math.abs(gamepad.axes[2]) > 0.05 || Math.abs(gamepad.axes[3]) > 0.05) {
        rawX = gamepad.axes[2];
        rawY = gamepad.axes[3];
      } else {
        rawX = gamepad.axes[0];
        rawY = gamepad.axes[1];
      }
    } else if (gamepad.axes.length >= 2) {
      rawX = gamepad.axes[0];
      rawY = gamepad.axes[1];
    }

    const DEADZONE = 0.12;
    let stickX = 0;
    let stickY = 0;

    if (Math.abs(rawX) > DEADZONE) {
      stickX = (rawX - Math.sign(rawX) * DEADZONE) / (1 - DEADZONE);
    }
    if (Math.abs(rawY) > DEADZONE) {
      stickY = (rawY - Math.sign(rawY) * DEADZONE) / (1 - DEADZONE);
    }

    if (stickX !== 0 || stickY !== 0) {
      if (hand === 'right' && this.onJoystickTransform) {
        this.onJoystickTransform({ stickX, stickY, dt, gamepad, source, hand });
      } else if (hand === 'left' && this.onLeftJoystickTransform) {
        this.onLeftJoystickTransform({ stickX, stickY, dt, gamepad, source, hand });
      }
    }
  }

  updateGamepadInput(dt) {
    const xr = this.renderer.xr;
    if (xr.isPresenting) {
      const session = xr.getSession();
      if (session && session.inputSources) {
        let rightFound = false;
        for (const source of session.inputSources) {
          if (source.gamepad) {
            if (source.handedness === 'right') {
              this.pollStick(source.gamepad, dt, source, 'right');
              rightFound = true;
            } else if (source.handedness === 'left') {
              this.pollStick(source.gamepad, dt, source, 'left');
            }
          }
        }
        // Fallback: ha a kontroller kéz-meghatározása 'none'
        if (!rightFound) {
          for (const source of session.inputSources) {
            if (source.handedness === 'none' && source.gamepad) {
              this.pollStick(source.gamepad, dt, source, 'right');
              break;
            }
          }
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      // Asztali USB / Bluetooth Gamepad tesztelés támogatása
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp && gp.axes && gp.axes.length >= 4) {
          // Right stick on standard gamepad: axes[2], axes[3]
          this.pollStick(gp, dt, null, 'right');
          // Left stick on standard gamepad: axes[0], axes[1]
          let leftRawX = gp.axes[0];
          let leftRawY = gp.axes[1];
          const DEADZONE = 0.15;
          let lx = Math.abs(leftRawX) > DEADZONE ? (leftRawX - Math.sign(leftRawX) * DEADZONE) / (1 - DEADZONE) : 0;
          let ly = Math.abs(leftRawY) > DEADZONE ? (leftRawY - Math.sign(leftRawY) * DEADZONE) / (1 - DEADZONE) : 0;
          if (lx !== 0 || ly !== 0) {
            if (this.onLeftJoystickTransform) {
              this.onLeftJoystickTransform({ stickX: lx, stickY: ly, dt, gamepad: gp, source: null, hand: 'left' });
            }
          }
          break;
        }
      }
    }
  }

  update(dt = 0.016) {
    const panels = this.getPanels().filter(p => p.visible);
    const targets = this.getTargets();
    const hoverMap = new Map();
    this.capturing = false;
    const xr = this.renderer.xr;

    // Kontroller hüvelykujj-karok (jobb: modell méret & forgatás, bal: HUD méret)
    this.updateGamepadInput(dt);

    if (!xr.isPresenting) {
      // 1. Asztali nézet (egér)
      if (this.mouse.in) {
        _mouseVec.set(this.mouse.x, this.mouse.y);
        _raycaster.setFromCamera(_mouseVec, this.camera);
        const hit = this.intersectRay(_raycaster.ray.origin, _raycaster.ray.direction, panels, targets);

        const st = (this.state['mouse'] ??= { down: false, active: null, skip: false });
        const wasDown = st.down;
        st.down = this.mouse.down;

        if (!st.down) {
          st.skip = false;
          if (st.active) {
            st.active.panel.setActive(null);
            st.active = null;
          }
        }

        if (hit?.widget) {
          hoverMap.set(hit.panel, hit.widget.id);
          this.capturing = true;
        }

        if (st.down && !wasDown && !st.skip) {
          if (hit?.widget) {
            st.active = { panel: hit.panel, widget: hit.widget };
            hit.panel.press(hit.widget, hit.u, hit.v);
          } else if (hit?.target) {
            hit.target.onActivate();
          }
        } else if (st.down && st.active && st.active.widget.kind !== 'btn') {
          if (hit && hit.panel === st.active.panel) {
            st.active.panel.drag(st.active.widget, hit.u, hit.v);
          }
        }
      }
    } else {
      // 2. WebXR kontroller & kézkövetés
      this.ctrls.forEach((c, i) => {
        if (!c.userData.connected) return;

        const { o, d } = this.getControllerRay(i);
        const hit = this.intersectRay(o, d, panels, targets);
        const st = this.state['ctrl' + i];

        if (hit) {
          // A kontroller sugarának méretezése
          c.userData.line.scale.z = hit.dist;
          c.userData.dot.visible = true;
          c.userData.dot.position.set(0, 0, -hit.dist);

          if (hit.widget) {
            hoverMap.set(hit.panel, hit.widget.id);
            this.capturing = true;
          }

          if (st && st.down && st.active && st.active.widget.kind !== 'btn') {
            if (hit.panel === st.active.panel) {
              st.active.panel.drag(st.active.widget, hit.u, hit.v);
            }
          }
        } else {
          c.userData.line.scale.z = 4.0;
          c.userData.dot.visible = false;
        }

        // Kézkövetés érintés (poke)
        if (c.userData.hand) {
          const tip = xr.getHand(i).joints?.['index-finger-tip'];
          if (tip && tip.visible) {
            tip.getWorldPosition(_t);
            for (const p of panels) {
              const loc = p.pointLocal(_t);
              if (loc && loc.inside && Math.abs(loc.z) < 0.05) {
                const w = p.widgetAt(loc.u, loc.v);
                if (w) {
                  hoverMap.set(p, w.id);
                  if (loc.z < 0.015) {
                    p.press(w, loc.u, loc.v);
                  }
                }
              }
            }
          }
        }
      });
    }

    this.getPanels().forEach(p => p.setHover(hoverMap.get(p) ?? null));
  }
}
