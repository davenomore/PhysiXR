// Hanglejátszás: ha a tartalomhoz van előre rögzített TTS hangfájl, azt játssza le,
// különben a böngésző magyar beszédszintézisét használja (Web Speech API / SpeechSynthesis).

let currentAudio = null;
let currentOnEnd = null;
let currentUtterance = null;
let cancelTimer = null;
let cachedVoices = [];

// Előre betöltjük és frissítjük a böngésző hangjait
function updateVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch { /* ignoráljuk */ }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

// Felhasználói interakciókor feloldja a böngésző hangmotorját
export function unlockTTS() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
      updateVoices();
    } catch { /* ignoráljuk */ }
  }
}

// Ismert előre generált hanganyagok a /TTS mappából (docs/hangfelvetelek_script.md alapján: 01 - 15)
export const TTS_AUDIO = {
  // I. Rész: AR és indítás
  ar_prompt: '/TTS/01_ar_prompt.mp3',
  ar_placed: '/TTS/02_ar_placed.mp3',

  // II. Rész: Bemutatkozás és mikroszkóp átmenet
  welcome: '/TTS/03_welcome.mp3',
  welcome_legacy: '/TTS/welcome.mp3',
  intro_nav: '/TTS/04_intro_nav.mp3',

  // III. Rész: Szilárd állapot és jégkristály
  szilard_alapjai: '/TTS/05_szilard_alapjai.mp3',
  kristalyszerkezet: '/TTS/06_kristalyszerkezet.mp3',
  jegkristaly_infokartya: '/TTS/06_kristalyszerkezet.mp3',

  // IV. Rész: 1. Felfűtés, Olvadáspont és Olvadáshő (0 °C Plató)
  melegedes_szilard: '/TTS/07_melegedes_szilard.mp3',
  mission3_melegedes: '/TTS/07_melegedes_szilard.mp3',
  olvadaspont: '/TTS/08_olvadaspont.mp3',
  olvadaspont_es_olvadasho: '/TTS/08_olvadaspont.mp3',
  olvadasho_plato: '/TTS/09_olvadasho_plato.mp3',
  latens_ho: '/TTS/09_olvadasho_plato.mp3',
  olvadasho: '/TTS/09_olvadasho_plato.mp3',

  // V. Rész: Folyékony állapot (0 °C víz)
  folyekony_alapjai: '/TTS/10_folyekony_alapjai.mp3',
  viz_melegites: '/TTS/10_folyekony_alapjai.mp3',

  // VI. Rész: 2. Felfűtés, Forráspont és Forráshő (100 °C Plató)
  melegedes_viz: '/TTS/11_melegedes_viz.mp3',
  forraspont_es_forrasho: '/TTS/12_forraspont_es_forrasho.mp3',
  forraspont: '/TTS/12_forraspont_es_forrasho.mp3',
  forras: '/TTS/12_forraspont_es_forrasho.mp3',
  forrasho: '/TTS/12_forraspont_es_forrasho.mp3',

  // VII. Rész: Légnemű állapot (Gőz)
  goz_alapjai: '/TTS/13_goz_alapjai.mp3',
  goz: '/TTS/13_goz_alapjai.mp3',
  legnemu_alapjai: '/TTS/13_goz_alapjai.mp3',

  // VIII. Rész: Kvíz, Tippek és Kalibráció
  quiz_sikeres: '/TTS/14_quiz_sikeres.mp3',
  quiz_gyakorolj: '/TTS/15_quiz_gyakorolj.mp3',
  tipp_forralas: '/TTS/22_tipp_forralas.mp3',
  tipp_hutes: '/TTS/23_tipp_hutes.mp3',
  tipp_dugattyu: '/TTS/24_tipp_dugattyu.mp3',
  tipp_meretezes: '/TTS/25_tipp_meretezes.mp3',
  tipp_kartyak: '/TTS/26_tipp_kartyak.mp3',
  calib_nyitva: '/TTS/27_calib_nyitva.mp3',
  calib_reset: '/TTS/28_calib_reset.mp3'
};

export function getTTSUrl(key) {
  if (!key) return null;
  if (TTS_AUDIO[key]) return TTS_AUDIO[key];
  return `/TTS/${key}.mp3`;
}

export function stopSpeech(silent = false) {
  if (cancelTimer) {
    clearTimeout(cancelTimer);
    cancelTimer = null;
  }

  // MP3 hang leállítása
  if (currentAudio) {
    const aud = currentAudio;
    currentAudio = null;
    try {
      aud.pause();
      aud.currentTime = 0;
    } catch { /* ignoráljuk */ }
  }

  // Böngésző beszédszintézis leállítása (csak ha épp beszél)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    } catch { /* ignoráljuk */ }
  }
  currentUtterance = null;

  if (currentOnEnd) {
    const cb = currentOnEnd;
    currentOnEnd = null;
    if (!silent) {
      try { cb(); } catch (e) { console.warn('stopSpeech onEnd callback error:', e); }
    }
  }
}

export const stopSpeaking = stopSpeech;

export function speak(text, audioUrl, onEndOrOptions) {
  stopSpeech(true);

  const options = typeof onEndOrOptions === 'function' ? { onEnd: onEndOrOptions } : (onEndOrOptions || {});
  currentOnEnd = options.onEnd || null;

  // 1. Ha van megadott hangfájl (pl. TTS/welcome.mp3), azt játsszuk le
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    const cleanup = () => {
      if (currentAudio === audio) {
        currentAudio = null;
        currentOnEnd = null;
      }
      try { options.onEnd?.(); } catch (e) { console.warn('Audio onEnd callback error:', e); }
    };

    let fallbackTriggered = false;
    const triggerFallback = (err) => {
      if (fallbackTriggered) return;
      // Ha már nem ez az aktív lejátszás (pl. stopSpeech leállította), vagy szándékos megszakítás történt (AbortError)
      if (currentAudio !== audio || (err && (err.name === 'AbortError' || err.code === 20))) {
        return;
      }
      fallbackTriggered = true;
      if (currentAudio === audio) {
        currentAudio = null;
      }
      console.log(`[Hangfájl] Nem elérhető (${audioUrl}), fallback TTS felolvasóra váltás.`);
      fallback(text, cleanup);
    };

    audio.addEventListener('error', triggerFallback, { once: true });
    audio.addEventListener('ended', cleanup, { once: true });

    if (options.onStart) {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        options.onStart(Math.round(audio.duration * 1000));
      } else {
        audio.addEventListener('loadedmetadata', () => {
          const durMs = Math.round((audio.duration || 0) * 1000);
          options.onStart?.(durMs);
        }, { once: true });
      }
    }

    const p = audio.play();
    if (p !== undefined) {
      p.catch(err => {
        triggerFallback(err);
      });
    }
    return audio;
  }

  // 2. Ha nincs hangfájl, a böngésző gépi TTS felolvasója beszél
  fallback(text, options.onEnd);
}

// Megkeresi a legmegfelelőbb magyar (vagy alapértelmezett) hangot
function findBestVoice() {
  if (!cachedVoices.length) {
    updateVoices();
  }
  if (!cachedVoices.length) return null;

  // 1. Kifejezetten magyar hangok keresése (hu-HU, hu_HU, hu)
  const huVoices = cachedVoices.filter(v => {
    const lang = (v.lang || '').replace('_', '-').toLowerCase();
    return lang === 'hu-hu' || lang.startsWith('hu');
  });

  if (huVoices.length > 0) {
    // Ha van férfi hang megjelölés
    const male = huVoices.find(v => {
      const name = (v.name || '').toLowerCase();
      return name.includes('male') || name.includes('férfi') ||
             name.includes('tamas') || name.includes('tamás') ||
             name.includes('attila') || name.includes('laszlo') ||
             name.includes('lászló');
    });
    if (male) return male;

    // Helyi (offline) hang preferálása (pl. macOS Tünde), ami nem igényel külső hálózatot
    const local = huVoices.find(v => v.localService);
    if (local) return local;

    return huVoices[0];
  }

  return null;
}

function fallback(text, onEnd) {
  if (!text) {
    onEnd?.();
    return;
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[TTS] A böngésző nem támogatja a SpeechSynthesis API-t.');
    onEnd?.();
    return;
  }

  // Chromium bugfix: ha paused állapotban ragadt, felébresztjük
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch { /* ignoráljuk */ }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'hu-HU';
  u.volume = 1.0;
  u.rate = 1.0;
  u.pitch = 1.0;

  const chosenVoice = findBestVoice();
  if (chosenVoice) {
    u.voice = chosenVoice;
  }

  // V8 Garbage Collector védelem: globális változóban tartjuk az aktív objektumot
  currentUtterance = u;

  let finished = false;
  const finishOnce = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    if (currentUtterance === u) {
      currentUtterance = null;
    }
    onEnd?.();
  };

  // Biztonsági időzítő: ha a böngésző nem küld onend eseményt
  const estDurationMs = Math.max(3000, text.length * 80);
  const safetyTimer = setTimeout(finishOnce, estDurationMs + 1500);

  u.onstart = () => {
    console.log('[TTS Felolvasó] Megszólalás:', text.slice(0, 45) + '...');
  };

  u.onend = () => {
    console.log('[TTS Felolvasó] Befejeződött');
    finishOnce();
  };

  u.onerror = (e) => {
    const err = e.error || e;
    if (err === 'interrupted' || err === 'canceled') {
      finishOnce();
      return;
    }
    console.warn('[TTS Felolvasó] Hiba esemény:', err);
    finishOnce();
  };

  // Chromium race-condition védelem:
  // Ha épp futott egy cancel(), 60 ms-ot várunk a speak() meghívásával,
  // különben a Chrome motorja az új mondatot is azonnal elnémítja!
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    try { window.speechSynthesis.cancel(); } catch { /* ignoráljuk */ }
    cancelTimer = setTimeout(() => {
      cancelTimer = null;
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(u);
      } catch (err) {
        console.warn('[TTS Felolvasó] speak() hiba:', err);
        finishOnce();
      }
    }, 60);
  } else {
    try {
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.warn('[TTS Felolvasó] speak() hiba:', err);
      finishOnce();
    }
  }
}
