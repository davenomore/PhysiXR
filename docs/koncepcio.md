# FázisTér MR – Koncepció

## 1. Alapötlet

A **FázisTér MR** egy Meta Quest 3-ra készülő, WebXR-alapú, kevert valóságra (MR) és kézkövetésre épülő interaktív oktatóalkalmazás. A középiskolai termodinamikát és a halmazállapot-változásokat teszi szó szerint kézzelfoghatóvá.

A száraz tankönyvi ábrákat és a nehezen elképzelhető folyamatokat (nyomás, hőmérséklet, részecskemozgás) interaktív, 3D-s sandbox élménnyé alakítja a tanuló saját szobájában.

## 2. Célok

- A láthatatlan mikroszkopikus folyamatok (részecskemozgás) láthatóvá tétele.
- Felfedezéses tanulás: a tanuló kísérletezik, nem csak olvas.
- Többcsatornás tanulás: látvány, hang, szöveg, interakció.
- Folyamatos visszajelzés tutorral és tesztekkel.
- Motiváció gyűjtemény és jutalmak révén.

**Célcsoport:** középiskolások (9–12. évfolyam), fizikatanárok órai demóhoz, egyéni tanulás.

## 3. Fő funkciók

### 3.1 Sandbox szimuláció
- 3D-s tér az asztalon/szobában (passthrough MR), benne egy edény/anyagminta.
- Anyag: víz (jég → víz → gőz), később más anyagok is.
- Részecskemodell: a hőmérséklettel változik a mozgás (rácsrezgés → áramlás → szabad mozgás).
- Zárt tér esetén a nyomás is megjelenik (dugattyú, hengerben lévő gáz).

### 3.2 HUD és vezérlők
- Csuklóhoz vagy a térbe rögzített HUD kézkövetéssel (pinch, érintés).
- Hőszabályzás: **alágyújtás** (láng erőssége), hűtés.
- Kijelzők: hőmérséklet, nyomás, halmazállapot, energia.
- Hőmérséklet–idő grafikon élőben (olvadás, forrás platók).
- Szimuláció sebessége, szünet, visszaállítás.

### 3.3 Interaktív elemek (megnyomható objektumok)
- A térben elhelyezett, kézzel megnyomható elemek (gombok, jelölők, „i” pontok).
- Hatásuk: hanganyag lejátszása (narráció, magyarázat) és szöveges **kártya** megjelenítése.
- Példák: „Miért áll meg a hőmérséklet olvadáskor?”, „Mi a látens hő?”

### 3.4 Kártyák és gyűjtemény
- Fogalmi kártyák (olvadáspont, forráspont, párolgás, lecsapódás, szublimáció, fagyás, nyomás stb.).
- Kártyák megszerzése: felfedezéssel, kísérlet teljesítésével, teszt sikerével.
- Gyűjtemény nézet: a kártyák kézbe vehetők, forgathatók, újraolvashatók, hanggal.

### 3.5 3D tutor karakter
- Egy 3D-s modell (pl. kis laborasszisztens-robot), aki a térben jelen van.
- Javasol kipróbálandó dolgokat („Melegítsd 100 °C fölé!”), mutat, figyel a tanuló tetteire.
- Segítség kérésre tippeket ad, hibánál támogat.
- Hangos és feliratos megszólalás.

### 3.6 Tesztek
- Rövid ellenőrző kvíz egy-egy témablokk után.
- Kérdéstípusok: feleletválasztós, sorrendbe rakás, „állítsd be a hőmérsékletet”, grafikon-értelmezés.
- Azonnali visszajelzés, magyarázattal; eredmény alapján kártyajutalom.

## 4. Tananyag-blokkok (javaslat)

| # | Blokk | Fő fogalmak |
|---|-------|-------------|
| 1 | Részecskemodell | halmazállapotok, hőmozgás |
| 2 | Hőmérséklet és hő | hőmérséklet, belső energia, hőátadás |
| 3 | Olvadás és fagyás | olvadáspont, olvadáshő, plató |
| 4 | Forrás és párolgás | forráspont, párolgáshő, lecsapódás |
| 5 | Nyomás és gáztörvények | nyomás, térfogat, Boyle–Mariotte, Gay-Lussac |
| 6 | Összegzés / fázisdiagram | hármaspont, szublimáció, nyomásfüggés |

Minden blokk: **felfedezés → tutor feladat → kártyák → teszt**.

## 5. Felhasználói folyamat

1. Indítás, tér felmérése, asztalra helyezés.
2. Tutor üdvözlés és bevezetés.
3. Szabad sandbox vagy irányított küldetés.
4. Kísérletezés, megnyomható elemek, kártyák gyűjtése.
5. Blokk végén teszt.
6. Eredmény, új kártyák, következő blokk feloldása.

## 6. Technikai irányok

- **Platform:** WebXR – böngészőből fut (Meta Quest Browser), telepítés nélkül, URL-lel megosztható; más WebXR-eszközökön és asztali böngészőben is kipróbálható (emulátorral/fallback nézettel).
- **Nyelv és render:** JavaScript/TypeScript + **three.js** (WebGLRenderer, `renderer.xr`).
- **Build:** Vite (ES modulok, gyors dev szerver; Quest-teszthez HTTPS szükséges).
- **XR módok:** `immersive-ar` (passthrough, MR) a fő mód; `immersive-vr` és asztali fallback.
- **XR feature-ök:** `hand-tracking`, `local-floor`, `hit-test` (asztal/felület keresése), `anchors`, opcionálisan `plane-detection`.
- **Kézkövetés:** three.js `XRHandModelFactory` + saját pinch/poke/grab detektálás az ízületi pontokból; kontroller tartalékként.
- **UI:** 3D HUD és kártyák (three-mesh-ui vagy canvas-textúrás panelek), csuklóhoz vagy a térhez rögzítve.
- **Részecskerendszer:** `InstancedMesh` / `Points` + GPU-s shader (később WebGPU/TSL); egyszerűsített, oktatási pontosságú fizikai modell, nem teljes molekuladinamika.
- **Szimulációs modell:** hőkapacitás, olvadás-/párolgáshő, ideális gáz törvénye, platók pontos kezelése; a fizika külön modulban, a rendertől függetlenül (tesztelhető).
- **Tutor:** glTF/GLB modell (`GLTFLoader`), animációk `AnimationMixer`-rel; Blender-ből exportálva.
- **Hang:** Web Audio / `THREE.PositionalAudio`, magyar narráció (felvétel vagy TTS).
- **Tartalom:** adatvezérelt (JSON) kártyák, kvízek, hangfájlok → könnyű bővítés és lokalizáció.
- **Mentés:** `localStorage` / IndexedDB (haladás, kártyagyűjtemény, tesztek).
- **Teljesítmény:** 72–90 FPS cél, részecskeszám skálázása, foveation, kevés draw call; PWA-cache az offline használathoz.

## 7. Tervezési elvek

- Kevés szöveg a térben; a hosszabb magyarázat kártyán és hangon.
- Kényelem: ülve/állva is használható, nincs mesterséges mozgás.
- Hozzáférhetőség: felirat, állítható szövegméret, hangerő.
- A fizika pontos, de egyszerűsített; a tankönyvi jelölésekhez igazodik.
- Vizuális stílus: tiszta, szemléletes színkódolás (hideg kék ↔ meleg vörös).

## 8. Fejlesztési ütemterv

1. **Prototípus:** jég→víz→gőz szimuláció részecskékkel, hőszabályzó HUD.
2. **Interakció:** kézkövetés, megnyomható elemek, hang + kártya.
3. **Tartalom:** blokkok 1–4, gyűjtemény.
4. **Tutor:** modell, animációk, javaslatrendszer.
5. **Tesztek:** kvízmotor, jutalmak.
6. **Bővítés:** nyomás/gáztörvények, fázisdiagram, tanári mód.
7. **Tesztelés** diákokkal, finomhangolás, kiadás.

## 9. Kockázatok

| Kockázat | Kezelés |
|----------|---------|
| Részecskeszám és teljesítmény | skálázható LOD, GPU-szimuláció |
| Fizikai pontatlanság | szaklektorálás, egyszerűsítések jelölése |
| Kézkövetés pontatlansága | nagy célpontok, tolerancia, vizuális visszajelzés |
| Tartalomgyártás (hang, modell) | adatvezérelt rendszer, fokozatos bővítés |

## 10. Nyitott kérdések

- Sima JS vagy TypeScript? Marad-e Vite?
- Narráció: élő hang vagy TTS?
- Tanári/osztálytermi mód szükséges-e?
- Kerüljön-e bele pontrendszer vagy ranglista?
- Mely anyagok legyenek a víz mellett?
