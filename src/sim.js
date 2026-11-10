// Termodinamikai modell: 1 kg víz entalpiája (kJ) alapján
// Hőmérséklet, platók (olvadás, forrás) és látens hő pontos kezelése.

export const PHASE = {
  ICE: 'Jég',
  MELT: 'Olvadás',
  WATER: 'Víz',
  BOIL: 'Forrás',
  STEAM: 'Gőz'
};

const C_ICE = 2.1, C_WATER = 4.18, C_STEAM = 2.0; // kJ/(kg·K)
const L_FUSION = 160, L_VAP = 600;                // kJ/kg látens hők (didaktikailag optimális időzítéssel)
export const T_MIN = -30, T_MAX = 160;
const P_MAX = 36;      // kJ/s kiegyensúlyozott fűtési teljesítmény (elegendő időt biztosít a narrációkhoz)

export class ThermoSim {
  constructor() {
    this.pressure = 1.0; // atm
    this.power = 0;      // -1 (hűtés) .. 0 (ki) .. +1 (láng)
    this.paused = false;
    this.speed = 1;
    this.reset();
  }

  get bp() {
    return 100 + (this.pressure - 1) * 28;
  }

  /**
   * Alapértelmezett állapot: pontosan −30 °C-os szilárd jég, kikapcsolt lánggal.
   * Nem olvad magától, megvárja a felhasználó fűtését!
   */
  reset() {
    this.power = 0;
    // Entalpia kiszámítása −30 °C-os jégre:
    this.h = C_ICE * (-30 - T_MIN); // h = 0 kJ, T = -30 °C
    this.derive();
  }

  get thresholds() {
    const a = C_ICE * (0 - T_MIN);
    const b = a + L_FUSION;
    const c = b + C_WATER * this.bp;
    const d = c + L_VAP;
    const e = d + C_STEAM * (T_MAX - this.bp);
    return { a, b, c, d, e };
  }

  derive() {
    const { a, b, c, d, e } = this.thresholds;
    this.h = Math.max(0, Math.min(e, this.h));
    this.melt = 0;
    this.vap = 0;

    if (this.h < a) {
      this.phase = PHASE.ICE;
      this.T = T_MIN + this.h / C_ICE;
    } else if (this.h < b) {
      this.phase = PHASE.MELT;
      this.T = 0; // PONTOSAN 0 °C: olvadási plató, amíg a látens hő fel nem szívódik!
      this.melt = (this.h - a) / L_FUSION;
    } else if (this.h < c) {
      this.phase = PHASE.WATER;
      this.T = (this.h - b) / C_WATER;
    } else if (this.h < d) {
      this.phase = PHASE.BOIL;
      this.T = this.bp;
      this.vap = (this.h - c) / L_VAP;
    } else {
      this.phase = PHASE.STEAM;
      this.T = this.bp + (this.h - d) / C_STEAM;
    }
  }

  step(dt) {
    if (!this.paused) {
      // Csak akkor változik az energia, ha fűtünk vagy hűtünk (power != 0)
      // Így −30 °C-on stabilan megmarad a jég, nem olvad el magától!
      if (Math.abs(this.power) > 0.01) {
        const q = this.power * P_MAX;
        this.h += q * dt * this.speed;
      }
    }
    this.derive();
  }
}
