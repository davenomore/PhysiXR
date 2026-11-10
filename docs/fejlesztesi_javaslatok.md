# FázisTér MR – Fejlesztési és Továbbfejlesztési Javaslatok

Ez a dokumentum a **FázisTér MR** kevert valóság (WebXR / Meta Quest 3) hőtani oktatószoftver átfogó fejlesztési javaslatait tartalmazza. A javaslatok a már működő, stabil alapokra (entalpia-alapú termodinamikai modell, jégkristály 3D bemutató, Apple visionOS stílusú lebegő HUD, narráció és küldetésvezérlés) épülnek, és konkrét célokat határoznak meg didaktikai, immerzív XR, fizikai és technológiai területeken.

---

## 1. Helyzetértékelés és Védett Komponensek

### 1.1. Jelenlegi Főbb Erősségek
- **Pedagógiailag hiteles termodinamika:** Nem egyszerű animáció, hanem valós entalpiaszámítás ($1\text{ kg}$ víz, látens hők, olvadási és forrási platók).
- **Kettős megfigyelési szint:** Makroszkopikus jégkocka zökkenőmentes átmenettel a mikroszkopikus kristályrácsba és részecskemodellbe.
- **Apple visionOS jellegű lebegő UI:** Tűéles (szupermintavételezett) üveghatású kártyák, moduláris HUD elrendezés.
- **Gazdag narráció és hangvezérlés:** Kettős hangmotor (professzionális előre rögzített TTS MP3 + böngésző Web Speech API fallback).
- **XR Kalibráció és ergonómia:** Asztalra helyezés (Hit-Test), joystickos laboratórium-méretezés és -forgatás, HUD skálázás.

### 1.2. Védett Komponensek (Tilos módosítani)
> [!IMPORTANT]
> **Tűzgömb és lángrészecskék védelme:**  
> A tűzgömböt és a tűz részecskék fizikáját, illetve emisszióját tilos átírni, mert a rendszer jelenlegi látványával és működésével a pedagógiai célok és a felhasználói elvárások maximálisan teljesülnek. A fejlesztési javaslatok a láng fizikáját változatlanul hagyva a környező funkciókra fókuszálnak.

---

## 2. Pedagógiai és Tananyagtartalmi Bővítések (Didaktika)

A jelenlegi verzióban az **1. Blokk (Halmazállapotok és fázisátmenetek: jég melegítése, olvadás, víz melegítése, forrás, gőz)** készült el. A fizika tanterv teljes lefedéséhez az alábbi blokkok bevezetése javasolt:

### 2.1. Új Didaktikai Blokkok

#### 2. Blokk: Fagyás és Lecsapódás (Reverzibilis folyamatok & Hőleadás)
- **Cél:** Annak bemutatása, hogy a fázisátmenetek kétirányúak; a fagyás során a víz hőt ad le a környezetnek.
- **Küldetések:**
  1. Hűtés bekapcsolása a gőzfázisban: lecsapódás (kondenzáció) 100 °C-os platón.
  2. A forró víz visszahűtése 0 °C-ra (folyadék áramlásának lassulása).
  3. Fagyási plató: a folyadék kristályrácsba rendeződése 0 °C-on hőleadás mellett.
  4. Opcionális érdekesség: **túlhűtés jelensége** (rázkódásmentes tiszta víz 0 °C alatt, amely egy érintésre kristályosodik ki).
- **Új kártyák:** *Fagyáspont*, *Fagyáshő*, *Lecsapódás és kondenzáció*, *Túlhűtött folyadék*.

#### 3. Blokk: Nyomás, Gáztörvények és Forráspontfüggés
- **Cél:** A diákok megtanulják, hogy a forráspont nem kőbe vésett 100 °C, hanem a külső nyomás függvénye.
- **Küldetések:**
  1. Hegycsúcs kísérlet (Mount Everest, $0.3\text{ atm}$): a víz már ~70 °C-on forr! Miért nem fő meg a krumpli a hegymászóknak?
  2. Kukta szimuláció ($2.0\text{ atm}$): a dugattyú lenyomásával a nyomás növekszik, a forráspont 120 °C fölé tolódik.
  3. Boyle–Mariotte törvény interaktív demonstrációja a dugattyú mozgatásával gőzfázisban ($p \cdot V = \text{állandó}$).
- **Új kártyák:** *Nyomásfüggő forráspont*, *Kukta-effektus*, *Magashegyi forrás*, *Gáztörvények*.

#### 4. Blokk: Teljes Fázisdiagram, Hármaspont és Szublimáció
- **Cél:** A $p\text{--}T$ sík megértése, ahol a jég, a víz és a gőz határvonalai találkoznak.
- **Küldetések:**
  1. A hármaspont beállítása ($0.01\text{ °C}$, $0.006\text{ atm}$): mindhárom halmazállapot egyszerre van jelen egyensúlyban!
  2. Szublimáció megfigyelése: alacsony nyomáson a jég közvetlenül gőzzé válik a folyadékfázis átlépése nélkül.
- **Új kártyák:** *Hármaspont*, *Szublimáció és deszublimáció*, *Kritikus pont*.

---

### 2.2. Változatosabb Interaktív Feladattípusok
Jelenleg a küldetések végén kizárólag feleletválasztós kérdések szerepelnek. A következő feladattípusokkal az élmény játékosabbá és mélyebbé tehető:
1. **Értékbeállító feladat (Goal Slider):**
   - *„Állítsd be a nyomást úgy, hogy a víz pontosan 80 °C-on forrjon fel!”* – A tanulónak a dugattyúval vagy nyomásszabályzóval kell kísérleteznie.
2. **Keresd meg a platót! (Grafikonos hotspot-kijelölés):**
   - A lebegő grafikonon a tanulónak rá kell mutatnia a kontroller sugarával arra a szakaszra, ahol a látens hő nyelődik el.
3. **Halmazállapot-kártya párosítás:**
   - 3D térben lebegő mikroszkopikus képek és tulajdonságok párosítása húzással (drag & drop).

---

### 2.3. Gráfos és Hálózatos Ábrák Szabálya
> [!NOTE]
> **Szabály a gráfos szemléltetéshez:**  
> A molekuláris hálózatok, kristályrács-összefüggések vagy konceptuális tudásgráfok megjelenítésekor – amennyiben a feladat szövege nem hivatkozik konkrét betűjelekre ($A, B, C\dots$) – a gráfok csúcsait **kizárólag letisztult pontként (pöttyként)** kell kirajzolni, betűk és zavaró fokszám-feliratok nélkül. Ez biztosítja a tiszta, áttekinthető vizuális megjelenést a 3D térben.

---

## 3. WebXR, Kézkövetés és Kevert Valóság (Immersive Spatial UX)

### 3.1. Spatial Audio (Valódi Térbeli 3D Hangzás)
- **Jelenlegi állapot:** A hangok sztereóban szólnak a fülhallgatóban a böngésző alapértelmezett kimenetén.
- **Javaslat:** `THREE.PositionalAudio` és `AudioListener` bevezetése:
  - **Tutor hangja:** Közvetlenül a kis robot 3D pozíciójából szól. Ha a felhasználó a fejét elfordítja vagy a szobában körbejárja a modellt, a hang pontosan a robot szájából hallatszik.
  - **Forrási bugyborékolás és sziszegés:** A henger/edény belsejéből érkezik.
  - **Láng és gázszelep zaja:** Az edény alsó égőfejéből sugárzik.
  - **HUD kattanások és hangeffektek:** Finom, halk térbeli „üvegkoppanás” a megérintett gomb koordinátájáról.

### 3.2. Közvetlen Manipuláció Kézkövetéssel (Direct Manipulation)
- **Dugattyú közvetlen megragadása (Direct Piston Grab):**
  - Ahelyett, hogy csak a jobb oldali panel csúszkájával lehetne a dugattyút állítani, a kézkövetés mutató- és hüvelykujjával a tanuló közvetlenül megfoghassa a henger tetején lévő fém fogantyút, és fel-le tolhassa azt.
- **Közvetlen gombnyomás (Poke Interaction):**
  - A lebegő HUD panelek gombjai már érzékelik a mutatóujjhegy fizikai érintését; ennek megerősítése diszkrét vizuális benyomódási animációval (z-tengelyű elmozdulás) és haptikus visszajelzéssel.
- **Kétkezes méretezés és forgatás (Two-Handed Gesture):**
  - Két kézzel végzett pinch (csípés) a virtuális laboratórium szélén: a két kéz távolságának nyitásával/zárásával a labor azonnal méretezhető, a két kéz forgatásával pedig körbeforgatható az asztalon.

### 3.3. Környezetérzékelés (WebXR Plane Detection & Scene Mesh)
- **Automatikus asztalra illesztés:**
  - A WebXR `plane-detection` és `mesh-detection` API-k segítségével az alkalmazás automatikusan felismeri a szobában lévő asztallapot, és a kísérleti állványt azonnal ráülteti anélkül, hogy manuális irányzékos célzásra lenne szükség.

---

## 4. Fizikai és Termodinamikai Modell Kibővítése

### 4.1. Valódi Gáztörvény ($p \cdot V = n \cdot R \cdot T$) Csatolása
- **Jelenlegi működés:** A nyomás kézzel állítható vagy előre beállított érték.
- **Javaslat:** Amikor a tartály le van zárva és a víz eléri a gőzfázist:
  $$\Delta p = \frac{n \cdot R \cdot T}{V} - p_{\text{külső}}$$
  - A dugattyú lefelé nyomásával a térfogat ($V$) csökken $\rightarrow$ a nyomás automatikusan megugrik $\rightarrow$ a gőzrészecskék gyorsabban ütköznek a falnak.
  - Túlnyomás esetén a biztonsági szelep finom gőzfújás kíséretében automatikusan kinyit.

### 4.2. Több Anyag Választásának Lehetősége (Anyagválasztó Modul)
A víz mellett érdemes egy moduláris anyagtáblázatot (`MATERIALS`) bevezetni a `sim.js`-ben:
- **Etanol (Alkohol):** Forráspontja normál nyomáson $78.37\text{ °C}$, alacsonyabb olvadáspont ($-114\text{ °C}$). Látványos összehasonlítás a vízzel: miért forr fel sokkal hamarabb az alkohol?
- **Szén-dioxid ($\text{CO}_2$):** Normál nyomáson nincs folyadékfázisa; $-78.5\text{ °C}$-on közvetlenül szublimál! A tanulók láthatják a szárazjég működését mikroszkopikus szinten.
- **Folyékony nitrogén:** Demonstrációs hűtőanyag ($-196\text{ °C}$), extrém alacsony hőmérsékletű jelenségek szemléltetésére.

### 4.3. Élő $p\text{--}T$ Fázisdiagram Munkapont-követéssel
- A jobb oldali mérőpanelen vagy egy dedikált új lebegő kártyán egy $p\text{--}T$ koordinátarendszer megjelenítése.
- A három fázis mezője (szilárd, folyadék, gáz) és az azokat elválasztó görbék (olvadási görbe, gőznyomás-görbe, szublimációs görbe).
- Egy **élőben pulzáló pont** mutatja a rendszer aktuális állapotát. Amikor fűtünk vagy nyomást változtatunk, a pont végigfut a görbén, átlépve a fázishatárokat.

---

## 5. Grafikai Részletesség és Vizuális Visszajelzések

### 5.1. Kondenzációs Páralecsapódás az Üveghengeren
- Amikor a forró gőz hideg üvegfallal érintkezik, vagy amikor a hűtés beindul, az edény belső falán apró vízcseppek, pára jelenik meg (dinamikus shader vagy textúra maszk).
- A pára lassan összefolyik nagyobb cseppekké és lecsorog a folyadékba.

### 5.2. Konvekciós Áramvonalak a Folyékony Vízben
- A folyadék melegítése közben a melegebb (kisebb sűrűségű) vízrétegek alulról felfelé áramlanak, míg a hidegebbek lefelé süllyednek.
- Halvány, áttetsző áramlási nyilak vagy részecskenyomvonalak szemléltetik a termikus konvekciót.

### 5.3. Forrási Buborékképződés (Nukleáció)
- A forráspont elérésekor ne csak a részecskék sebessége nőjön, hanem az edény fenekéről induló, felfelé haladva egyre növekvő és a vízfelszínen szétpattanó gőzbuborékok képződjenek.

---

## 6. Technikai Architektúra, Teljesítmény és Iskolai Integráció

### 6.1. Offline Működés és PWA (Progressive Web App)
- **Probléma:** Az iskolai fizikaórákon a Wi-Fi sávszélesség sokszor instabil vagy korlátozott.
- **Javaslat:**
  - `vite-plugin-pwa` beépítése és Service Worker konfigurálása.
  - Minden asset (hangfájlok a `/TTS` mappából, textúrák, betűkészletek, Three.js csomagok) automatikus helyi cache-elése az első betöltéskor.
  - Így a szoftver internetkapcsolat nélkül, repülő üzemmódban is megbízhatóan fut a Quest 3 szemüvegen.

### 6.2. Intelligens Hangkezelő (Audio Preloader & State Machine)
- A hangfájlok Web Audio API-ba történő előtöltése (`fetch` $\rightarrow$ `decodeAudioData`), hogy a gombok megnyomásakor nulla késleltetéssel (0 ms latency) induljon el a magyarázat.
- Kölcsönös kizárás finomítása: ha egy új narráció indul, a korábbi simán elhalkul (fade out $150\text{ ms}$) kattogás nélkül.

### 6.3. Tanári Bemutató Mód (Teacher / Spectator Mode)
- **Tantermi kihívás:** Amikor egy diák a szemüvegben kísérletezik, a tanárnak és az osztálynak látnia kell, hol tart és mit csinál.
- **Megoldás:**
  - WebSocket vagy WebRTC alapú állapot-tükrözés: a szemüvegen futó szimuláció állapota (hőmérséklet, nyomás, aktív kártya, grafikon) szinkronizálva megjelenik egy kivetítőre kötött laptop böngészőjében asztali nézetben.
  - A tanár a laptopról indíthat közös kvízt vagy feloldhat speciális kísérleti beállításokat.

### 6.4. Eredmények Mentése és Exportálása (LMS / Kréta Kompatibilitás)
- A kvízek eredményeit, a teljesítési időt és a megszerzett jelvényeket a rendszer elmenti helyileg.
- **QR-kódos eredmény:** A lecke végén a HUD-on megjelenik egy QR-kód, amit a diák lefotózhat a telefonjával, és azonnal elküldheti a teszteredményt a tanárnak vagy az iskolai rendszernek (pl. Google Classroom / Kréta felületre).

---

## 7. Prioritási Mátrix és Megvalósítási Ütemterv (Roadmap)

| Időtáv | Fejlesztési Elem | Terület | Becsült Időigény | Didaktikai Hatás |
|---|---|---|---|:---:|
| **Fázis 1: Gyors Sikerek (1–2 hét)** | **Spatial Audio (THREE.PositionalAudio):** Robot és labor térbeli hangjai | XR UX | 2-3 nap | ★★★★★ |
| | **PWA & Offline Cache:** Teljes iskolai offline működés | Rendszer | 1-2 nap | ★★★★★ |
| | **Új feladattípusok:** Célhőmérséklet-beállítás és grafikon-hotspot | Didaktika | 3-4 nap | ★★★★☆ |
| | **Közvetlen gombnyomás (Direct Poke):** Fizikai gombbenyomódás kézzel | XR UX | 2 nap | ★★★★☆ |
| **Fázis 2: Tananyag Bővítés (3–6 hét)** | **2. Blokk implementálása:** Fagyás, lecsapódás és reverzibilitás | Didaktika | 1-2 hét | ★★★★★ |
| | **3. Blokk implementálása:** Nyomás és forráspont (hegycsúcs & kukta) | Didaktika / Fizika | 1-2 hét | ★★★★★ |
| | **Élő $p\text{--}T$ Fázisdiagram:** Interaktív munkapont-követő koordináta-rendszer | UI / Szimuláció | 1 hét | ★★★★★ |
| | **Dugattyú kézi megragadása (Direct Grab):** Kézkövetéses magasságállítás | XR UX | 3-4 nap | ★★★★☆ |
| **Fázis 3: Haladó Funkciók (6–10 hét)** | **4. Blokk (Fázisdiagram & Hármaspont):** Szublimáció és kritikus pont | Didaktika | 1-2 hét | ★★★★☆ |
| | **Több anyag támogatása:** Etanol és $\text{CO}_2$ (szárazjég) moduláris anyagtábla | Fizika | 1 hét | ★★★★☆ |
| | **Tanári nézet & QR-kódos értékelés:** Osztálytermi eredmény-megosztás | Oktatástechnológia | 1-2 hét | ★★★★★ |
| | **Plane Detection (Scene Mesh):** Automatikus valós asztalfelismerés | XR Rendszer | 1 hét | ★★★☆☆ |

---

## 8. Összegzés

A fenti fejlesztésekkel a **FázisTér MR** egy egyedülálló, nemzetközi szinten is versenyképes kevert valóság oktatóplatformmá bővül. A stabil fizikai háttérre és a prémium visionOS látványvilágra építve a tanulók nemcsak passzív szemlélői, hanem aktív felfedezői lehetnek a termodinamika törvényeinek.
