# FázisTér MR – Tutor Beszédek, Tudáskártyák és Küldetés Szövegek

Ez a dokumentum tartalmazza a **FázisTér MR** virtuális hőtani laboratórium összes pedagógiai és narrációs szövegét:
1. **Tudáskártyák (Cards)** – A gyűjtemény panelen megjelenő elméleti kártyák
2. **Infó pontok (Hotspots / Tutor hasi gomb)** – A tutor hasán megjelenő (i) gombok szövege és hangja
3. **Küldetéssorozat (Missions)** – A tanulási blokk egymást követő feladatai, instrukciói és tippjei
4. **Kvízkérdések (Quiz)** – A blokk végén megjelenő ellenőrző kérdések, opciók és magyarázatok
5. **Tutor spontán beszédmintái & AR rendszerhangok** – Köszönés, tanácsok, segítségadás és kalibráció

> **Módosítási útmutató:**
> - Az 1–4. fejezet szövegei a kódban közvetlenül a `src/content.js` fájlban találhatók.
> - Az 5. fejezet (Tutor spontán mondatai, bemutatkozás) a `src/main.js` és `src/calibrator.js` fájlokban találhatók.
> - Bármelyik szöveg átírása után a mentést követően a rendszer automatikusan frissül (hot-reload).

---

## 1. Tudáskártyák gyűjteménye (`CARDS`)
*Fájl: `src/content.js` -> `CARDS` objektum*

| ID | Ikon | Kártya címe | Részletes leírás / Felolvasott szöveg |
|---|:---:|---|---|
| `szilard` | 🧊 | **A szilárd halmazállapot (−30 °C)** | Szilárd halmazállapotban az anyag részecskéit erős vonzóerők tartják szorosan egymás mellett egy szabályos kristályrácsban. Emiatt a szilárd anyagok alakja és térfogata állandó: nem folynak szét és nem veszik fel az edény formáját. A molekulák nem vándorolnak el, csupán egyensúlyi rácspontjaik körül végeznek rezgőmozgást. Melegítéskor 0 °C-ig csak a molekulák rácsrezgése gyorsul, de a halmazállapot mindvégig szilárd marad. |
| `kristalyszerkezet` | ❄️ | **A Jégkristály Szerkezete** *(Badge: Jégkristály 3D Modell)* | A jégben a vízmolekulák oxigénatomjai szigorú térbeli hálózatot alkotnak: minden oxigén négy szomszédjával tetraédert formál, melyek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre. A világoskék ragyogó vonalak a hidrogénhidakat jelölik, melyek a molekulákat összetartják. Kérlek, hajolj közelebb és nézd meg a modellt felülről, hogy lásd a közepén kirajzolódó szabályos hatszöget és a függőlegesen végigfutó üres csatornákat! Ez a szellős, kitágult szerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és a jégkocka úszik a vízen!<br/><br/>**Szekciók a Vision Pro kártyán:**<br/>• **💠 Hexagonális gyűrűk:** A jégben a vízmolekulák oxigénatomjai (piros) szigorú térbeli hálózatot alkotnak. Minden oxigén pontosan négy szomszédjával kapcsolódik egy tetraédert formálva. Ezek a tetraéderek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre.<br/>• **⚡ Hidrogénhidak:** A világoskék, ragyogó vonalak a hidrogénkötéseket jelölik, amelyek a molekulákat összetartják. Figyeld meg a kis fehér hidrogénatomokat! Minden kötésen pontosan egy hidrogénatom ül, így az oxigénatomhoz közelebb esve kiadják a H₂O molekulákat.<br/>• **🕳️ Üres csatornák:** Ha felülről benézel a hatszögek közepébe, látni fogod a kristályrácson végigfutó hatalmas, függőleges „üres” csatornákat. Ez a szellős, kitágult térbeli szerkezet az oka annak, hogy a jég sűrűsége kisebb, mint a folyékony vízé, ezért úszik a jégkocka a víz felszínén! |
| `olvadaspont` | 📍 | **A jég olvadáspontja (0 °C)** | Elértük a 0 Celsius-fokot, a tiszta jég olvadáspontját normál légköri nyomáson! A melegítés hatására a molekulák rácsrezgése elérte azt a kritikus szintet, aminél a szabályos kristályszerkezet már nem tartható fenn mereven. Nagyon fontos szabály: hiába fűtünk tovább, a hőmérséklet pontosan 0 °C marad, amíg az utolsó jégkristály el nem olvad! Ezen a ponton a szilárd jég és a folyékony víz stabil egyensúlyban létezik egymás mellett. |
| `latens_ho` | 🔥 | **Olvadáshő (Lo) és Látens hő** | A fázisátalakulás közben felvett, hőmérséklet-emelkedéssel NEM járó hőt látens hőnek nevezzük. Jégnél ez a fajlagos olvadáshő (Lo = 334 kJ/kg). A felvett hő most nem melegít, hanem a molekulák közötti kristályrács-kötéseket bontja szét! Amíg az utolsó jégkristály el nem olvad, a hőmérséklet pontosan 0 °C marad: ez az olvadáshő hozza létre a vízszintes platót a grafikonon. |
| `plato` | 📈 | **Hőmérsékleti plató** | Amíg az utolsó jégkristály el nem olvad, a víz-jég keverék hőmérséklete pontosan 0 °C marad, bármennyire is fűtjük! Ezért látható vízszintes plató a grafikonon. |
| `viz_melegites` | 💧 | **A folyékony halmazállapot (0 °C-os víz)** | Az összes jég elolvadt, így most 0 fokos folyékony vizünk van! A jég merev kristályszerkezete teljesen megszűnt: a vízmolekulák már nincsenek fix pontokhoz rögzítve, hanem szabadon elgördülnek egymáson, és felveszik az edény alakját. A részecskék közötti vonzóerők miatt azonban a víz térfogata állandó marad, így a folyadékok gyakorlatilag összenyomhatatlanok. |
| `forras` | 🫧 | **Forráshő (Lf) és Forráspont (100 °C)** | 100 Celsius-fokon a folyadék belsejében is gőzbuborékok képződnek: elérkeztünk a forráspontra! Ha több hőt közlünk, azt tapasztaljuk, hogy – az olvadáshoz hasonlóan – itt sincs hőmérséklet-változás: pontosan 100 fok marad, amíg víz van az edényben. Ismét a látens hő jelenségével találkozunk, csak forrás esetén forráshőnek nevezzük. A közölt hő arra fordítódik, hogy a molekulák közötti vonzóerők teljesen felszakadjanak, a részecskék kiszakadjanak és gőz képződjön. Víznél ez hatalmas: 2260 kilojoule kilogrammonként, ami közel hétszerese az olvadáshőnek! Ez tartja a hőmérsékletet a 100 fokos platón. |
| `goz` | 💨 | **A légnemű halmazállapot (100 °C-os vízgőz)** | Az összes víz elforrt, tiszta 100 °C-os gőzünk van! Légnemű halmazállapotban a molekulák közötti vonzóerők megszűntek. A gázoknak sem állandó alakjuk, sem állandó térfogatuk nincs: kitöltik a teljes teret, könnyen összenyomhatók, és a falnak csapódva hozzák létre a nyomást. Ha most tovább fűtünk, a hőmérséklet tovább emelkedik: ezt nevezzük túlhevített gőznek. Ha a közölt hőt még tovább emelnénk, a molekulák akkora sebességgel ütköznének, hogy maguk a vízmolekulák is szétbomlanának, így a gőz ezen a ponton megszűnne. Az így kapott hidrogén-oxigén gázkeveréket még tovább melegítve pedig plazmát kapnánk, de ezt most nem tárgyaljuk! |
| `jelveny1` | 🏅 | **Hőtan Mester** | Jelvény: sikeresen felfedezted a szilárd, folyékony és gáz halmazállapotokat, a kristályrácsot, a látens hőt és a fázisátalakulásokat! |

---

## 2. Infó pontok a tutoron (`HOTSPOTS`)
*Fájl: `src/content.js` -> `HOTSPOTS` tömb*  
*Ezek a pontok vezetik a felhasználót: mindig a megfelelő fázisban jelennek meg a kis robot feje felett lebegő 3D és a hasán villogó sárga felkiáltójelként (`!`), és rákattintva a tutor elmagyarázza őket.*

| ID | Kapcsolódó Kártya | Cím | Megjelenési feltétel | Tutor által felolvasott magyarázat |
|---|---|---|---|---|
| `racs` | `szilard` | **A szilárd halmazállapot alapjai** | A Start megnyomása után, a kezdeti −30 °C-os jégnél (0. küldetés) | Szilárd halmazállapotban az anyag részecskéit erős kötések rögzítik a rácsban, így alakjuk és térfogatuk is állandó: nem folynak szét és nem veszik fel a tartály alakját. A molekulák nem vándorolnak el, csupán a helyük körül rezegnek. Melegítéskor 0 °C-ig csak a molekulák rezgése gyorsul, de az anyag mindvégig szilárd marad. |
| `kristalyszerkezet` | `kristalyszerkezet` | **A Jégkristály Szerkezete** | Az 1. feladat teljesítése után (1. küldetés) | A jégben a vízmolekulák oxigénatomjai szigorú térbeli hálózatot alkotnak: minden oxigén négy szomszédjával tetraédert formál, melyek összekapcsolódva hullámos, hatszögletű gyűrűket hoznak létre. A világoskék ragyogó vonalak a hidrogénhidakat jelölik, melyek a molekulákat összetartják. Kérlek, hajolj közelebb és nézd meg a modellt felülről, hogy lásd a közepén kirajzolódó szabályos hatszöget és a függőlegesen végigfutó üres csatornákat! Ez a szellős, kitágult szerkezet az oka annak, hogy a jég sűrűsége kisebb a víznél, és úszik a víz felszínén! |
| `olvadaspont` | `olvadaspont` | **A jég olvadáspontja (0 °C)** | Amikor a hőmérséklet eléri a 0 °C-ot (4. küldetés) | Elérted a 0 °C-ot! Normál nyomáson a tiszta jég itt kezd olvadni. A hőmérséklet nem nő tovább, amíg jég van az edényben. |
| `latens_ho` | `latens_ho` | **Olvadáshő (334 kJ/kg) és Látens hő** | Amikor a jég olvad (0 °C olvadási szakasz, 5. küldetés) | A felvett hő most nem melegít, hanem a szilárd kristályrács erős kötéseit bontja szét: ezt nevezzük olvadáshőnek (334 kJ/kg)! Ezért vízszintes a plató a grafikonon. |
| `viz_melegites` | `viz_melegites` | **A folyékony halmazállapot (0 °C-os víz)** | Amikor az összes jég elolvadt és víz lett (7. küldetés) | Az összes jég elolvadt, így most 0 fokos folyékony vizünk van! A jég merev kristályszerkezete teljesen megszűnt: a vízmolekulák már nincsenek fix pontokhoz rögzítve, hanem szabadon elgördülnek egymáson, és felveszik az edény alakját. A részecskék közötti vonzóerők miatt azonban a víz térfogata állandó marad, így a folyadékok gyakorlatilag összenyomhatatlanok. |
| `goz` | `goz` | **A légnemű halmazállapot (100 °C-os vízgőz)** | Amikor az összes víz elforrt és gőz lett (9. küldetés) | Az összes víz elforrt, tiszta 100 °C-os gőzünk van! Légnemű halmazállapotban a molekulák közötti vonzóerők megszűntek. A gázoknak sem állandó alakjuk, sem állandó térfogatuk nincs: kitöltik a teljes teret, könnyen összenyomhatók, és a falnak csapódva hozzák létre a nyomást. Ha most tovább fűtünk, a hőmérséklet tovább emelkedik: ezt nevezzük túlhevített gőznek. Ha a közölt hőt még tovább emelnénk, a molekulák akkora sebességgel ütköznének, hogy maguk a vízmolekulák is szétbomlanának, így a gőz ezen a ponton megszűnne. Az így kapott hidrogén-oxigén gázkeveréket még tovább melegítve pedig plazmát kapnánk, de ezt most nem tárgyaljuk! |

---

## 3. Küldetéssorozat és Didaktikai Lépések (`BLOCKS.missions`)
*Fájl: `src/content.js` -> `BLOCKS[0].missions`*  
*A jobb felső Küldetés panelen látható és a tutor által felolvasott feladatok és tippek:*

### 1. Blokk: Olvadás és Látens hő
- **Blokk cím:** `Olvadás és Látens hő`
- **Bevezető szöveg:** `Kezdjük −30 °C-os stabil jéggel! Tanuld meg, mi az olvadáspont, a látens hő és hogyan melegszik a víz.`

#### Lépések:
1. **A szilárd halmazállapot alapjainak megismerése**
   - **Feladat szöveg:** `Koppints a tutoron lebegő sárga felkiáltójelre a szilárd halmazállapot megismeréséhez!`
   - **Tipp / Segítség:** `Mutass rá a kontroller lézerével vagy koppints a robot sárga felkiáltójelére (!) a szilárd halmazállapot alapjaiért!`
   - **Megszerzett kártya:** `szilard`
2. **A jégkristály 3D szerkezetének felfedezése**
   - **Feladat szöveg:** `Fedezd fel a jégkristály 3D szerkezetét! Koppints a tutor sárga felkiáltójelére!`
   - **Tipp / Segítség:** `Figyeld meg a modellben a kiemelt hatszöget, a hidrogénhidakat és az üres csatornákat!`
   - **Megszerzett kártya:** `kristalyszerkezet`
3. **Kis láng bekapcsolása**
   - **Feladat szöveg:** `Kapcsolj egy kis fűtést: állítsd a lángot 20-30% közé a bal panelen!`
   - **Tipp / Segítség:** `Használd a "🔥 Kis láng (25%)" gombot vagy a csúszkát!`
4. **Melegedés 0 °C-ig**
   - **Feladat szöveg:** `Figyeld: itt még csak a jég melegszik! Várd meg, amíg eléri a 0 °C-ot!`
   - **Tipp / Segítség:** `A hőmérséklet emelkedik −30 °C-ról 0 °C-ra, miközben a jég kristályrácsa még egyben marad.`
5. **Olvadáspont elérése**
   - **Feladat szöveg:** `Elérted a 0 °C-ot, lekapcsoltuk a fűtést! Koppints a tutoron lebegő sárga felkiáltójelre az olvadáspontért!`
   - **Tipp / Segítség:** `A robot felett megjelent a sárga felkiáltójel: koppints rá!`
   - **Megszerzett kártya:** `olvadaspont`
6. **Látens hő és plató felfedezése**
   - **Feladat szöveg:** `Koppints a tutor sárga felkiáltójelére a Látens hő és plató megismeréséhez!`
   - **Tipp / Segítség:** `Nézd meg a grafikont: a hőmérséklet nem nő, plató alakult ki! Koppints a robot sárga felkiáltójelére!`
   - **Megszerzett kártyák:** `latens_ho`, `plato`
7. **Teljes olvadásig fűtés**
   - **Feladat szöveg:** `Fűts tovább, amíg az összes jég el nem olvad és folyékony víz nem lesz!`
   - **Tipp / Segítség:** `A plató alatt a hőmérséklet pontosan 0 °C marad. Adj bátran lángot (100%), hogy elolvadjon a jég!`
8. **A folyékony halmazállapot bemutatása (0 °C-os víz)**
   - **Feladat szöveg:** `Az összes jég elolvadt: lekapcsoltuk a fűtést, hogy 0 °C-os maradjon a víz! Koppints a tutor sárga felkiáltójelére a folyékony halmazállapotért!`
   - **Tipp / Segítség:** `A fűtés kikapcsolt, a víz stabilan 0 °C-os. Koppints a tutor felkiáltójelére a folyékony állapot bemutatásához!`
   - **Megszerzett kártya:** `viz_melegites`
9. **Víz melegítése forráspontig (100 °C) és elforralása**
   - **Feladat szöveg:** `Kapcsolj maximális lángot (100%), és forrald a vizet, amíg az összes molekula légnemű gőzzé nem alakul! (100 °C)`
   - **Tipp / Segítség:** `Állítsd a lángot 100%-ra! A víz 100 °C-ra melegszik, majd a forrási plató alatt teljesen elforr.`
   - **Megszerzett kártya:** `forras`
10. **A légnemű halmazállapot bemutatása (100 °C-os vízgőz)**
   - **Feladat szöveg:** `Az összes víz elforrt, 100 °C-os gőzünk van: lekapcsoltuk a fűtést! Koppints a tutor sárga felkiáltójelére a légnemű halmazállapotért!`
   - **Tipp / Segítség:** `A fűtés kikapcsolt, a gőz stabilan 100 °C-os. Koppints a tutor sárga felkiáltójelére a légnemű állapot bemutatásához!`
   - **Megszerzett kártya:** `goz`

---

## 4. Kvízkérdések és Magyarázatok (`BLOCKS.quiz`)
*Fájl: `src/content.js` -> `BLOCKS[0].quiz`*

### 1. Kérdés
- **Kérdés:** `Miért kisebb a jég sűrűsége a folyékony víznél, ami miatt úszik a vízen?`
- **Válaszlehetőségek:**
  1. `A hatszögletű kristályrácsban lévő tágas, üres csatornák miatt` *(Helyes válasz)*
  2. `Mert a jégben kevesebb oxigénatom van`
  3. `Mert a hidegben a molekulák összemennek`
- **Magyarázat helyes válasznál:** `A jég szellős, tágas hexagonális kristályrácsa a hidrogénhidakkal üres csatornákat zár közre, ezért a sűrűsége kisebb a vízénél!`

### 2. Kérdés
- **Kérdés:** `Mi történik a hőmérséklettel, amíg a jég olvad (0 °C-on)?`
- **Válaszlehetőségek:**
  1. `Folyamatosan növekszik`
  2. `Állandó marad (0 °C)` *(Helyes válasz)*
  3. `Csökken`
- **Magyarázat helyes válasznál:** `A hőmérséklet állandó marad: ez a hőmérsékleti plató a grafikonon!`

### 3. Kérdés
- **Kérdés:** `Hogyan mozognak a részecskék a folyékony vízben a szilárd jéghez képest?`
- **Válaszlehetőségek:**
  1. `Szabadon elgördülnek és áramlanak egymáson, felvéve az edény alakját` *(Helyes válasz)*
  2. `Mereven egy helyben rezegnek a rácspontokon`
  3. `Óriási távolságra száguldanak elszakadva egymástól`
- **Magyarázat helyes válasznál:** `A folyadékban a kristályrács kötései felbomlottak, így a molekulák szabadon áramlanak egymáson, de a térfogatuk még állandó.`

### 4. Kérdés
- **Kérdés:** `Mi jellemző a légnemű (gőz) halmazállapotú anyagra?`
- **Válaszlehetőségek:**
  1. `Nincs állandó alakja és térfogata: kitölti a teljes teret és összenyomható` *(Helyes válasz)*
  2. `Állandó alakja van, mint a jégnek`
  3. `Csak az edény alján folyik szét`
- **Magyarázat helyes válasznál:** `A gázokban a molekulák közötti vonzóerők megszűntek: kitöltik a rendelkezésre álló teljes teret és nagy sebességgel ütköznek a falaknak.`

---

## 5. Tutor Rendszerhangjai és Interakciói
*Fájlok: `src/main.js` és `src/calibrator.js`*

### Indítás, Makroszkopikus Jégkocka és Mikroszkópos Átmenet
- **Kezdő Play panel szövege (amíg a valódi jégkocka látható a tartályban):**
  - Cím: `FázisTér MR`
  - Alcím: `Virtuális Hőtani Laboratórium`
  - Leírás: `A kísérleti tartályban egy valódi, szilárd jégkocka található (−30 °C). Indítsd el a bemutatót a mikroszkópos kristályrács felfedezéséhez!`
  - Gomb: `▶ Start / Bemutatkozás`
- **1. Fázis: Tutor bemutatkozó beszéde a Start gombra kattintva (Zárolt interakciók a hang végéig, `03_welcome.mp3`):**
  > *„Üdvözöllek ebben az interaktív szimulációban! Amit magad előtt látsz, az a természet egyik legfontosabb anyaga: a víz. Jelenleg a szilárd formáját látod, de a hőmérséklet változtatásával ez az anyag lenyűgöző átalakulásokon tud keresztülmenni. A titok nyitja az energia. Kísérjük végig a vizet mind a három fő halmazállapotán, és nézzük meg, mi történik a színfalak mögött, mikroszkopikus szinten!”*
- **2. Fázis: Mikroszkopikus animációs átmenet (2.4 másodperc):**
  - A makroszkopikus jégkocka lágyan elpárolog / elhalványul, és kibontakozik a vibráló mikroszkopikus kristályrács molekulaszerkezete.
- **3. Fázis: Feloldás és első tanulási felhívás (`04_intro_nav.mp3`):**
  - A HUD panelek megjelennek, a vezérlők feloldódnak, a Küldetés HUD aranysárga pulzáló kerettel kiemelődik, és a tutor feje felett és hasán felvillan a lebegő sárga felkiáltójel (`!`):
  > *„Nézd meg a jobb oldali Küldetés panelt a feladatokért, és az első küldetés megkezdéséhez kattints a felettem villogó sárga felkiáltójelre!”*

### Tutor fejére kattintáskor adott spontán tippek:
Amikor a felhasználó rákattint a kis robot fejére, a tutor véletlenszerűen megszólal:
- *„Próbáld meg elforralni a vizet a láng teljes feltekerésével!”*
- *„Hűtéssel újra jégkristályokat kapsz!”*
- *„A jobb oldali csúszkával nyomd össze a gázt a dugattyúval!”*
- *„A felső fogaskerék ikonnal tetszőlegesen átméretezheted a HUD-ot vagy a labort!”*
- *„Nézd meg a tudáskártyák gyűjteményét a bal felső panelen!”*
- *(Ha még nincs elindítva)*: *„Kattints a Play gombra a kísérlet elindításához!”*

### AR (Kiterjesztett Valóság) elhelyezési utasítások:
- **Sisak felvételekor (`01_ar_prompt.mp3`):**
  > *„Nézz egy asztalra vagy a padlóra! Ahol a fehér célzókarikát látod, oda érkezik a labor. Az elhelyezéshez húzd meg a ravaszt a kontrolleren, vagy kézkövetésnél érintsd össze a mutató- és hüvelykujjadat!”*
- **Sikeres asztalra helyezés után (`02_ar_placed.mp3`):**
  > *„A laboratórium sikeresen elhelyezve. A labor állásának és méretének beállítása után nyomd meg a Start gombot a kezdéshez!”*

### Beállítások & Kalibráció hangok (`calibrator.js`):
- **⚙ Fogaskerék megnyitásakor:**
  > *„Beállítások és méretkalibráció megnyitva.”*
- **Egyszerű gömb modellre váltáskor:**
  > *„Átváltva egyszerű gömb részecskemodellre.”*
- **H₂O molekula modellre váltáskor:**
  > *„Átváltva valódi H₂O vízmolekula modellre: egy piros oxigén és két fehér hidrogén atom 104,5 fokos kötésszöggel.”*
- **Új asztalsík kijelölése gombra kattintva:**
  > *„Nézz az asztalra, és kattints a labor új helyére!”*
