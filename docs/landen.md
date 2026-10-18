# Landenquiz

Hoe `/landen/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het eindscherm zijn
dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat anders is.

## Spelvorm

Een land is ingekleurd op een kaart van zijn streek, en je tikt de naam. Zelfde matcher, zelfde
kandidaten als bij de vlaggen (alle landen en gebieden, zonder de organisaties).

Steve koos op 18 oktober 2026 voor twee richtingen, zoals bij de hoofdsteden: deze, en "naam
gegeven, tik op de kaart". Die tweede komt er nog bij, als keuze **Vraag naar** in het
instelscherm.

## Welke landen

Dezelfde regio's en extra's als bij de vlaggen, zonder **Organisaties**. Drie gebieden vallen weg
omdat ze op deze schaal geen vorm hebben: Tuvalu, Gibraltar en Tokelau. Zo blijven er 226 over.

## De kaart

- **Data**: `world-atlas` 2.0.2, de landgrenzen van Natural Earth op 1:50m in TopoJSON.
  `src/integrations/map-assets.ts` schrijft er bij elke start of build
  `public/maps/countries.json` van (750 kB, 233 kB gzip), met onze landcode als id in plaats van
  de ISO-code. De quiz haalt dat bestand één keer op, al op het instelscherm, en daarna tekent elke
  vraag meteen.
- **Koppeling**: `src/data/atlas-shapes.ts` zegt welke vorm(en) bij welke code horen, op ISO
  3166-1-nummer. Kosovo, Noord-Cyprus en Somaliland hebben geen nummer en staan er op naam in.
  Noord-Cyprus hoort bij Cyprus en Somaliland bij Somalië, zoals bij de vlaggen en de VN. Mist
  een vorm, dan faalt de build.
- **Projectie**: azimutaal en vlaktegetrouw (`geoAzimuthalEqualArea`), gecentreerd op het land.
  Zo is elk land onvervormd, ook Groenland of Nieuw-Zeeland. De kaart toont een cirkel rond het
  land van 2,2 keer zijn eigen straal, minstens 7° en hoogstens 70°, zodat er altijd genoeg van de
  streek te zien is om het te herkennen.
- **Grootte**: de kaart vult het hele vlak van de vraag, op telefoon en desktop, en wordt
  opnieuw getekend als dat vlak van grootte verandert (toetsenbord, draaien). De cirkel rond het
  land past in de kortste zijde; een breed scherm toont meer van de streek ernaast.
- **Zoomen**: rechtsboven staan **+** en **−**; op desktop werkt ook het muiswiel, op de
  telefoon knijpen met twee vingers. Zoomen maakt de cirkel rond het land per stap 1,6 keer kleiner
  of groter, van 0,5° (een microstaat van dichtbij) tot een half halfrond (90°). Elke vraag begint
  weer op de standaardzoom. Verschuiven kan niet: het land blijft altijd in het midden.
- **Kleine landen**: is het land op de kaart kleiner dan 60 px², dan krijgt het een ring
  (Malta, Monaco, de Caraïbische eilanden).
- **Kleuren**: zee `sky-100`, land wit met grenzen in `slate-300`, het land om te raden in de
  accentkleur.

Lukt het laden van de kaart niet, dan blijft het vlak leeg en meldt de console waarom. Hints en
**Toon** werken nog.
