# PhysiXR

WebXR (three.js) alapú kevert valóság (MR / Spatial Computing) és kézkövetéses fizika oktatóplatform Meta Quest 3-ra és asztali böngészőkre.

## Funkciók

- **App Főmenü & Fizika Témakörök:** Apple visionOS stílusú indítómenü témakörválasztással (Hőtan elérhető modulokkal; Elektromosságtan, Mechanika és Fénytan előkészítve).
- **Interaktív Tananyagok:**
  - 💧 **A Vízmolekula Megismerése:** Szabadon forgatható 3D H₂O molekula és Ice Ih hatszögletű jégkristályrács.
  - 📊 **Halmazállapot-változások és Hőforgalom:** Interaktív fázistérkép endoterm és exoterm folyamatokkal, lépésről lépésre végigjárással és -50 °C .. +150 °C hőmérséklet-csúszkával.
  - 🧪 **PhysiXR Termodinamika Laboratórium:** A teljes 3D kevert valóság laboratórium entalpiaszámítással, dugattyúval és 3D tutorral.
- **Valós idejű termodinamikai modell:** 1 kg víz entalpiája (kJ) alapján szimulálva; olvadási és forrási platók, látens hő és nyomásfüggő forráspont.
- **3D Részecskeszimuláció:** `THREE.InstancedMesh` alapú részecskék jég (rácsrezgés), folyadék (áramlás) és gőz (szabad repülés) állapotokban.
- **Fizikai laboratórium:** Üvegedény, mozgatható dugattyú, gázégő, hűtés és lebegő információs hotspotok.
- **Térbeli lebegő 3D HUD:**
  - Hőszabályzó panel (fokozatmentes láng/hűtés, sebesség, szünet, reset)
  - Nyomás és élő hőmérséklet–idő grafikon panel
  - Kompakt állapotcímke az edény felett
  - Tutor & Küldetés panel
  - Tudáskártyák gyűjteménye panel
- **3D Tutor karakter:** Lebegő, animált robot, aki feladatokat javasol és beszél a tanulóhoz.
- **Oktatási blokkok és interaktív tesztek:** Blokkonkénti küldetések, azonnali magyarázattal ellátott kvízek, megszerezhető jelvényekkel.
- **Beszédhang (TTS):** Web Speech API alapú felolvasás a kártyákhoz, küldetésekhez és teszteredményekhez (tetszőleges MP3 narrációval bővíthető).
- **WebXR és kézkövetés:** Asztalra helyezés AR Hit-Testtel (`immersive-ar`), közvetlen ujjhegy-érintés (poke) és távoli sugár (pinch / trigger) támogatás.

## Futtatás

### Fejlesztői szerver indítása (HTTPS):

```bash
npm run dev
```

A Vite önaláírt tanúsítvánnyal (`@vitejs/plugin-basic-ssl`) indul el a `https://<a-geped-ipje>:5173` címen.
Meta Quest 3 böngészőből nyisd meg ugyanezt az URL-t a helyi hálózaton, és kattints a képernyő alján megjelenő **„START AR”** gombra!

### Asztali előnézet:
Böngészőből megnyitva az egérrel szabadon körbeforgatható a labor (`OrbitControls`), a HUD-panelek csúszkái és gombjai pedig kattintással és húzással közvetlenül vezérelhetők.

## Dokumentáció

- [Névfejlesztési és Branding Javaslatok (Új Átfogó Cím)](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/nev_javaslatok_es_branding.md)
- [Fejlesztési és Továbbfejlesztési Javaslatok (Roadmap & Ötletek)](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/fejlesztesi_javaslatok.md)
- [Teljes Szimulációs Workflow (Lépésről lépésre)](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/szimulacio_workflow.md)
- [Hangfelvételek és Szinkron Script (Fájlelnevezések és szövegek)](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/hangfelvetelek_script.md)
- [Tutor Beszédek, Tudáskártyák és Szövegek](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/TUTOR_ES_KARTYAK_SZOVEGEK.md)
- [Koncepció és Tervezés](file:///Users/vargadavid/Documents/Projektek/FázisTér_MR/docs/koncepcio.md)

