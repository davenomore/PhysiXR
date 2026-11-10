# FázisTér MR – Rendszerezett Didaktikai Hangfelvételi Script és Szimulációs Vezérkönyv

Ez a dokumentum a **FázisTér MR** teljes szimulációjának egységes, sorszámozott didaktikai és szinkronszkriptje. A tananyag egyetlen logikus, szimmetrikus fizikai ívre épül: a **−30 °C-os szilárd jégtől** a **túlhevített gőzig**, bemutatva a halmazállapotokat, a rácsrezgést, a látens hőt, az olvadáshőt és a forráshőt.

A hangfájlok sorszámozása **szigorúan folytonos: 01-től 15-ig terjed, ugrások nélkül.**

---

## 🎯 A Rendszer Alapelve (Didaktikai és UX Szabályzat)

A szimulációban a szerepek kristálytisztán el vannak választva egymástól:

1. **A Küldetés panel (Jobb oldali HUD):**  
   - **Csak csendes vizuális útmutató.**  
   - Kiírja a tanulónak, hogy mit kell fizikailag csinálnia a laborban (pl. *„Állíts be kis lángot (20–30%) a bal panelen!”*).  
   - **NINCS gépiesen felolvasva.** A tanuló a szemével olvassa el, nem zavarja felesleges robothang.

2. **Folyamat közbeni narráció (In-Process Voice):**  
   - Amikor a tanuló cselekszik a laborban (pl. fűtést kapcsol be, és a hőmérő/grafikon reagál), a háttérben megszólal a fizikai folyamatot kísérő hanganyag.  
   - Példa: A 0 °C-on bekapcsolt fűtésnél a tanuló látja, hogy a hőmérő nem mozdul ➔ a hang ekkor magyarázza el az **Olvadáshőt** és a **Platót**.

3. **Mérföldkő elérése (Automatikus lángleállás):**  
   - Amikor a rendszer eléri a fázisátalakulási pontot (0 °C elérése, teljes elolvadás, teljes elforrás), a fűtés automatikusan lekapcsol, hogy a rendszer stabil egyensúlyi állapotban maradjon a megfigyeléshez.

4. **A Felkiáltójel (`!`) a robotnál:**  
   - Amikor a tanuló **elért egy stabil mérföldkövet**, a robot felett azonnal felvillan a **sárga felkiáltójel (`!`)**.  
   - Ez jelzi: *„Sikerült! Gyere, mondok hozzá egy tudományos magyarázatot!”*

5. **Elméleti Magyarázat Hanggal (Tudáskártyák):**  
   - Amikor a tanuló rákattint a robot felkiáltójelére, megnyílik a Vision Pro tudáskártya, és a robot **hanggal elmondja az elméletet** (szilárd rács, olvadáspont, folyékony víz, légnemű gőz).

---

## 🔬 A Fizikai Folyamat Lépésről Lépésre (Logikai Ív)

```
[ −30 °C Szilárd Jég ] 
       │ 
       ▼ (1. Felfűtés: a hő a rácsrezgést gyorsítja, 0 °C-ig szilárd marad)
[ 0 °C Olvadáspont ] ──► Fűtés leáll. Magyarázat: elértük a rács stabilitási határát.
       │ 
       ▼ (2. Fűtés bekapcsolása 0 °C-on: a hőmérséklet nem nő!)
[ 0 °C Olvadási Plató ] ──► Hő = OLVADÁSHŐ (Lo = 334 kJ/kg, kötések bontása)
       │ 
       ▼ (Az összes jég elolvad)
[ 0 °C Folyékony Víz ] ──► Rács felbomlott, molekulák elgördülnek, alak változó, térfogat állandó
       │ 
       ▼ (3. Felfűtés: a hő a részecskék áramlási sebességét növeli 100 °C-ig)
[ 100 °C Forrási Plató ] ──► Hőmérséklet nem nő! Hő = FORRÁSHŐ (Lf = 2260 kJ/kg, molekulák elszakítása)
       │ 
       ▼ (Az összes víz elforr)
[ 100 °C Légnemű Gőz ] ──► Vonzóerők megszűntek, kitölti a teret, ütközések = nyomás
       │ 
       ▼ (4. További fűtés: most már a gőz hőmérséklete emelkedik 100 °C fölé!)
```

---

## 📋 Összesítő Fájllista (Folytonos Számozás: 01 – 15)

A felvett MP3 fájlokat a projekt gyökerében lévő **`TTS/`** mappába kell helyezni.

| Sorszám | Fájlnév | Típus | Hossz | Miről szól? |
|:---:|---|---|---|---|
| **01** | **`01_ar_prompt.mp3`** | Rendszer | ~7 mp | AR asztalérzékelés és lehelyezési instrukció |
| **02** | **`02_ar_placed.mp3`** | Rendszer | ~5 mp | Sikeres lehelyezés, labor beállítása és Start |
| **03** | **`03_welcome.mp3`** | Bemutató | ~18 mp | Üdvözlés: a víz 3 halmazállapota és az energia titka |
| **04** | **`04_intro_nav.mp3`** | Navigáció | ~5 mp | Zoom utáni eligazítás: nézd a Küldetés panelt és a robotot |
| **05** | **`05_szilard_alapjai.mp3`** | Elmélet | ~14 mp | 1. Elmélet: A szilárd halmazállapot (rezgés, merev kötések) |
| **06** | **`06_kristalyszerkezet.mp3`** | Elmélet | ~38 mp | 2. Elmélet: Jégkristály 3D rácsa, hatszögek, hidrogénhidak, üres csatornák |
| **07** | **`07_melegedes_szilard.mp3`** | Folyamat | ~5 mp | Folyamathang: Jég melegítése (−30 °C ➔ 0 °C) |
| **08** | **`08_olvadaspont.mp3`** | Elmélet | ~12 mp | 3. Elmélet: 0 °C **Olvadáspont** elérve (fűtés leállt) |
| **09** | **`09_olvadasho_plato.mp3`** | Folyamat | ~20 mp | Folyamathang: Fűtés 0 °C-on, **Látens hő** (latin rejtett), **Olvadáshő** ($L_o = 334\text{ kJ/kg}$) és plató |
| **10** | **`10_folyekony_alapjai.mp3`** | Elmélet | ~16 mp | 4. Elmélet: 0 °C folyékony víz, rács megszűnése, szabad áramlás |
| **11** | **`11_melegedes_viz.mp3`** | Folyamat | ~5 mp | Folyamathang: Víz melegítése (0 °C ➔ 100 °C) |
| **12** | **`12_forraspont_es_forrasho.mp3`** | Elmélet/Folyamat | ~24 mp | 5. Elmélet/Folyamat: 100 °C forráspont, plató, **Látens hő & Forráshő** ($L_f = 2260\text{ kJ/kg}$) |
| **13** | **`13_goz_alapjai.mp3`** | Elmélet | ~18 mp | 6. Elmélet: 100 °C légnemű gőz, szabad száguldás, gőz további fűtése |
| **14** | **`14_quiz_sikeres.mp3`** | Értékelés | ~4 mp | Kvíz sikeres: Hőtan Mester jelvény |
| **15** | **`15_quiz_gyakorolj.mp3`** | Értékelés | ~4 mp | Kvíz gyakorlás / ismétlés |

---

## 🎙️ Részletes Felvételi Szövegkönyv (Időrendben)

---

### I. RÉSZ: Belépés és AR Elhelyezés

#### `01_ar_prompt.mp3`
- **Szerep:** AR felületkeresés.
- **Kontextus:** A felhasználó felveszi a sisakot, megjelenik a fehér célzókarika.
- **Szöveg:**
  > *„Nézz egy asztalra vagy a padlóra! Ahol a fehér célzókarikát látod, oda érkezik a labor. Az elhelyezéshez húzd meg a ravaszt a kontrolleren, vagy kézkövetésnél érintsd össze a mutató- és hüvelykujjadat!”*

#### `02_ar_placed.mp3`
- **Szerep:** Elhelyezés megerősítése.
- **Kontextus:** A labor megjelent a térben, a felhasználó beállíthatja a méretet és az elforgatást.
- **Szöveg:**
  > *„A laboratórium sikeresen elhelyezve. A labor állásának és méretének beállítása után nyomd meg a Start gombot a kezdéshez!”*

---

### II. RÉSZ: Bemutató és Átmenet a Mikroszkópba

#### `03_welcome.mp3`
- **Szerep:** Makroszkopikus bevezető (a bemutató alatt a HUD-ok rejtve vannak).
- **Kontextus:** A felhasználó megnyomta a Start gombot. A tartályban −30 °C-os szilárd jégkocka látható.
- **Szöveg:**
  > *„Üdvözöllek ebben az interaktív szimulációban! Amit magad előtt látsz, az a természet egyik legfontosabb anyaga: a víz. Jelenleg a szilárd formáját látod, de a hőmérséklet változtatásával ez az anyag lenyűgöző átalakulásokon tud keresztülmenni. A titok nyitja az energia. Kísérjük végig a vizet mind a három fő halmazállapotán, és nézzük meg, mi történik a színfalak mögött, mikroszkopikus szinten!”*

#### `04_intro_nav.mp3`
- **Szerep:** Érkezés a mikroszkópba és eligazítás.
- **Kontextus:** A 2.4 másodperces zoom átmenet befejeződött, a mikroszkopikus kristályrács előtt vagyunk. Megjelennek a HUD-ok, a robot felett felvillan a felkiáltójel.
- **Szöveg:**
  > *„Nézd meg a jobb oldali Küldetés panelt a feladatokért, és az első küldetés megkezdéséhez kattints a felettem villogó sárga felkiáltójelre!”*

---

### III. RÉSZ: Szilárd Állapot és a Jégkristály Szerkezete (−30 °C)

* **Küldetés a panelen (csendben):**  
  *„1. Feladat: Fedezd fel a szilárd halmazállapotot és a jégkristály 3D szerkezetét! Koppints a robot felkiáltójelére, és nézd meg felülről a modellt!”*
* **Aktiválás:** A robotnál villog a felkiáltójel. Rákattintva elhangzik az elmélet, és megnyílik a 3 szekciós Vision Pro kártya.

#### `05_szilard_alapjai.mp3`
- **Szerep:** 1. Elmélet: A szilárd halmazállapot alapjai.
- **Szöveg:**
  > *„Szilárd halmazállapotban az anyag részecskéit erős kötések rögzítik a rácsban, így alakjuk és térfogatuk is állandó: nem folynak szét és nem veszik fel a tartály alakját. A molekulák nem vándorolnak el, csupán a helyük körül rezegnek. Melegítéskor 0 °C-ig csak a molekulák rezgése gyorsul, de az anyag mindvégig szilárd marad.”*

#### `06_kristalyszerkezet.mp3`
- **Szerep:** 2. Elmélet: A jégkristály 3D hálózata és a sűrűség anomáliája.
- **Szöveg:**
  > *„A jégben a vízmolekulák oxigénatomjai szigorú térbeli hálózatot alkotnak: minden oxigén négy szomszédjával tetraédert formál, melyek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre. A világoskék ragyogó vonalak a hidrogénhidakat jelölik, melyek a molekulákat összetartják. A hatszögek közepén hatalmas, függőleges üres csatornák futnak végig: ez a szellős szerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és úszik a víz felszínén!”*

---

### IV. RÉSZ: 1. Felfűtés, az Olvadáspont és az Olvadáshő (0 °C)

* **Küldetés a panelen (csendben):**  
  *„3. Feladat: Állíts be kis lángot (20–30%) a bal panelen, és figyeld a jég melegedését!”*
* **Cselekvés:** A felkiáltójel eltűnik a robotról. A tanuló beállítja a lángot 25%-ra.

#### `07_melegedes_szilard.mp3`
- **Szerep:** Folyamathang fűtés közben (−30 °C ➔ 0 °C).
- **Kontextus:** A láng bekapcsolásakor azonnal megszólal a háttérben.
- **Szöveg:**
  > *„Figyeld a részecskéket: a felvett hő hatására a molekulák rácsrezgése egyre gyorsul, de a jég mindvégig szilárd marad! Várd meg, amíg a hőmérséklet eléri a 0 Celsius-fokot!”*

* **0 °C elérésekor:**
  - A láng automatikusan elalszik (0%), hogy stabil 0 °C-os szilárd jég maradjon.
  - A küldetés teljesült!
  - **A robot felett felvillan a sárga felkiáltójel (`!`)!**
  - Küldetés panel csendben: *„0 °C elérve! Koppints a robot felkiáltójelére az Olvadáspont megismeréséhez!”*

#### `08_olvadaspont.mp3`
- **Szerep:** 3. Elmélet: A tiszta jég olvadáspontja (0 °C).
- **Kontextus:** A tanuló rákattint a robot felkiáltójelére 0 °C-nál.
- **Szöveg:**
  > *„Elértük a 0 Celsius-fokot, a tiszta jég olvadáspontját! A molekulák rácsrezgése elérte a maximális értéket, amit a szilárd kristályrács még elbír. Ahhoz, hogy a jég folyékony vízzé váljon, további hőt kell közölnünk vele!”*

* **Ezután a küldetés panel megjeleníti (csendben):**  
  *„6. Feladat: Fűts bátran a bal panelen (akár 100% lánggal), és figyeld az olvadási platót!”*
* **Amikor a tanuló bekapcsolja a fűtést 0 °C-on:**  
  A hőmérő nem mozdul, pontosan 0 °C marad, a jégkristályok elkezdenek felbomlani. Ekkor szólal meg az **olvadáshő folyamathang**:

#### `09_olvadasho_plato.mp3`
- **Szerep:** Folyamathang a 0 °C-os fűtés közben: **Látens hő** (rejtett hő), **Olvadáshő** ($L_o$) és Plató.
- **Kontextus:** A fűtés bekapcsolásakor megszólal a háttérben.
- **Szöveg:**
  > *„Figyeld meg a hőmérőt és a grafikont: fűtünk, de a hőmérséklet nem emelkedik, pontosan 0 fok marad! A felvett hő most nem a részecskék rezgését gyorsítja, hanem a kristályrács erős kötéseit bontja fel. Mivel ez a folyamat a hőmérőn nem látszik, rejtett hőnek, latin eredetű kifejezéssel látens hőnek hívjuk, olvadáskor pedig olvadáshőnek. Víz esetén ez 334 kilojoule kilogrammonként: ez hozza létre a vízszintes platót a grafikonon!”*

---

### V. RÉSZ: Teljes Olvadás és Folyékony Víz (0 °C)

* **Amikor az utolsó kristály is elolvadt (100% folyékony víz, 0 °C):**
  - A láng automatikusan lekapcsol (0%).
  - A küldetés teljesült!
  - **A robot felett felvillan a sárga felkiáltójel (`!`)!**
  - Küldetés panel: *„Az összes jég elolvadt! Koppints a robot felkiáltójelére a folyékony halmazállapotért!”*

#### `10_folyekony_alapjai.mp3`
- **Szerep:** 4. Elmélet: A folyékony halmazállapot megismerése.
- **Kontextus:** Kattintás a robot felkiáltójelére a 0 °C-os tiszta víz állapotban.
- **Szöveg:**
  > *„Az összes jég elolvadt, így most 0 fokos folyékony vizünk van! A jég merev kristályszerkezete teljesen megszűnt: a vízmolekulák már nincsenek fix pontokhoz rögzítve, hanem szabadon elgördülnek egymáson, és felveszik az edény alakját. A részecskék közötti vonzóerők miatt azonban a víz térfogata állandó marad, így a folyadékok gyakorlatilag összenyomhatatlanok.”*

---

### VI. RÉSZ: 2. Felfűtés és a Forráspont (100 °C, Forráshő)

* **Küldetés a panelen (csendben):**  
  *„8. Feladat: Kapcsolj maximális lángot (100%), és figyeld a víz melegedését a forráspontig!”*
* **Cselekvés:** A felkiáltójel eltűnik. A tanuló 100%-ra állítja a lángot.

#### `11_melegedes_viz.mp3`
- **Szerep:** Folyamathang fűtés közben (0 °C ➔ 100 °C).
- **Kontextus:** A víz melegítésekor szól a háttérben.
- **Szöveg:**
  > *„Figyeld: a folyékony víz melegszik! A hőmérséklet folyamatosan emelkedik, a vízmolekulák egyre sebesebben áramlanak és kavarognak, míg el nem érjük a forráspontot, a 100 Celsius-fokot!”*

* **100 °C elérésekor:**
  - A láng automatikusan elalszik (0%), hogy stabil 100 °C-os folyékony víz maradjon a forráspontnál.
  - Küldetés panel: *„Elértük a 100 °C-ot, a fűtés leállt! Kapcsolj ismét lángot (100%), és forrald a vizet gőzzé!”*
* **Amikor a tanuló bekapcsolja a fűtést 100 °C-on:**
  - A forrási plató megindul, a hőmérséklet stabilan 100 °C marad, és megszólal a folyamathang:

#### `12_forraspont_es_forrasho.mp3`
- **Szerep:** 5. Elmélet / Folyamat: Forráspont, Plató, **Látens hő** és **Forráshő** ($L_f$).
- **Kontextus:** A forrási plató bemutatása 100 °C-on.
- **Szöveg:**
  > *„100 Celsius-fokon a folyadék belsejében is gőzbuborékok képződnek: elérkeztünk a forráspontra! Ha több hőt közlünk, azt tapasztaljuk, hogy – az olvadáshoz hasonlóan – itt sincs hőmérséklet-változás: pontosan 100 fok marad, amíg víz van az edényben. Ismét a látens hő jelenségével találkozunk, csak forrás esetén forráshőnek nevezzük. A közölt hő arra fordítódik, hogy a molekulák közötti vonzóerők teljesen felszakadjanak, a részecskék kiszakadjanak és gőz képződjön. Víznél ez hatalmas: 2260 kilojoule kilogrammonként, ami közel hétszerese az olvadáshőnek! Ez tartja a hőmérsékletet a 100 fokos platón.”*

* **Amikor az utolsó vízcsepp is gőzzé alakul:**
  - A láng automatikusan elalszik (0%), hogy stabil 100 °C-os gőz maradjon.
  - A küldetés teljesült!
  - **A robot felett felvillan a sárga felkiáltójel (`!`)!**
  - Küldetés panel: *„Az összes víz elforrt! Koppints a robot felkiáltójelére a Légnemű állapot és túlhevítés megismeréséhez!”*

#### `13_goz_alapjai.mp3`
- **Szerep:** 6. Elmélet: Légnemű halmazállapot és a gőz további fűtése.
- **Kontextus:** Kattintás a robot felkiáltójelére a gőz fázisban.
- **Szöveg:**
  > *„Az összes víz elforrt, tiszta 100 °C-os gőzünk van! Légnemű halmazállapotban a molekulák közötti vonzóerők megszűntek. A gázoknak sem állandó alakjuk, sem állandó térfogatuk nincs: kitöltik a teljes teret, könnyen összenyomhatók, és a falnak csapódva hozzák létre a nyomást. Ha most tovább fűtünk, a hőmérséklet tovább emelkedik: ezt nevezzük túlhevített gőznek. Ha a közölt hőt még tovább emelnénk, a molekulák akkora sebességgel ütköznének, hogy maguk a vízmolekulák is szétbomlanának, így a gőz ezen a ponton megszűnne. Az így kapott hidrogén-oxigén gázkeveréket még tovább melegítve pedig plazmát kapnánk, de ezt most nem tárgyaljuk!”*

---

### VII. RÉSZ: Záró Kvíz és Értékelés

#### `14_quiz_sikeres.mp3`
- **Kontextus:** A tanuló sikeresen válaszolt a kvíz kérdéseire (megkapja a Hőtan Mester jelvényt).
- **Szöveg:**
  > *„Gratulálok! Sikeresen teljesítetted a tesztet! Megkaptad a Hőtan Mester jelvényt!”*

#### `15_quiz_gyakorolj.mp3`
- **Kontextus:** A tanulónak nem sikerült minden kérdés elsőre.
- **Szöveg:**
  > *„Nem baj, kísérletezz még egy kicsit a laborban, nézd meg a tudáskártyákat, és próbáld újra a tesztet!”*

---

## 💡 Rendszertani Összefoglalás

| Fázis | Hőmérséklet | Mi történik mikroszkopikusan? | Hőtani Fogalom | Folytonos Hangfájl |
|---|---|---|---|:---:|
| **Szilárd jég** | −30 °C | Merev rács, hidrogénhidak, hatszögek, tágas üres csatornák | Szilárd állapot, sűrűség | `05`, `06` |
| **1. Melegítés** | −30 °C ➔ 0 °C | Rácsrezgés gyorsul, de a szerkezet még szilárd | Hőközlés, hőmérséklet-emelkedés | `07` |
| **Olvadáspont** | **0 °C stabil** | Rácsrezgés elérte a maximális értéket, fűtés leáll | **Olvadáspont (0 °C)** | `08` |
| **Olvadási plató** | **0 °C fűtés** | Kötések bomlanak, jég olvad, hőmérséklet állandó | **Olvadáshő ($L_o = 334\text{ kJ/kg}$)**, Látens hő | `09` |
| **Folyékony víz** | 0 °C | Rács megszűnt, molekulák szabadon gördülnek egymáson | Folyékony állapot, alakváltozás | `10` |
| **2. Melegítés** | 0 °C ➔ 100 °C | Molekulák áramlási sebessége nő | Fajhő, melegedés | `11` |
| **Forrási plató** | **100 °C stabil** | Buborékok, molekulák kiszakadása gőzzé, hőmérséklet állandó | **Forráshő ($L_f = 2260\text{ kJ/kg}$)**, Látens hő | `12` |
| **Légnemű gőz** | 100 °C ➔ ... | Vonzóerők nincsenek, térkitöltés, falnak ütközés ➔ nyomás | Légnemű állapot, túlhevítés | `13` |
| **Kvíz Sikeres** | – | Teszt sikeres teljesítése | Értékelés, Elismerés | `14` |
| **Kvíz Gyakorlás** | – | Teszt ismétlése | Gyakorlás, Ismétlés | `15` |
