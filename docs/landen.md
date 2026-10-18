# Landenquiz

Hoe `/landen/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het eindscherm zijn
dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat anders is.

## Spelvorm

Bovenaan het instelscherm staat **Vraag naar**, met twee richtingen (Steve, 18 oktober 2026). De
keuze wordt onthouden in `quiz:landen:direction`.

- **De naam** (standaard): een land is ingekleurd op een kaart van zijn streek, en je tikt de naam.
  Zelfde matcher en kandidaten als bij de vlaggen (alle landen en gebieden, zonder de
  organisaties).
- **De plaats**: onderaan staat de naam, en je tikt het land aan op de kaart. Zie
  [Tikken op de kaart](#tikken-op-de-kaart).

De historiek (`quiz:landen:history`) houdt beide apart bij: `be` voor de naam, `place:be` voor
de plaats.

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
- **Bewegen**: dezelfde aardbol als de tikkaart (`src/components/countries/globe.ts`). Slepen
  draait de bol; rechtsboven staan **+** en **−**, op desktop werkt ook het muiswiel, op de
  telefoon knijpen met twee vingers. Zoomen maakt de cirkel per stap 1,6 keer kleiner of groter,
  van 0,5° (een microstaat van dichtbij) tot een half halfrond (90°). Elke vraag begint weer
  gecentreerd op het land. Ben je weggedraaid of gezoomd, dan verschijnt onder **−** een knop
  (`locate-fixed`) die terugkeert naar het begin.
  Tot 18 oktober 2026 kon je hier niet verschuiven en bleef het land in het midden; Steve wou
  dezelfde draaiende aarde als bij **De plaats**.
- **Kleine landen**: is het land op de kaart kleiner dan 60 px², dan krijgt het een ring
  (Malta, Monaco, de Caraïbische eilanden).
- **Kleuren**: zee `sky-100`, land wit met grenzen in `slate-300`, het land om te raden in de
  accentkleur. Rond de bol is het vlak grijs (`slate-50`) en de bol heeft een rand in
  `slate-300`, met lengte- en breedtegraden om de 10° in `sky-200`: zo lees je hem als een aarde
  die draait, niet als een platte kaart (Steve, 18-10-2026: "Ik zie de wereldbol niet").

Lukt het laden van de kaart niet, dan blijft het vlak leeg en meldt de console waarom. Hints en
**Toon** werken nog.

## Tikken op de kaart

`src/components/countries/TapMap.tsx`, in de ronde aangezet met `tapping` op `QuizRound`: in plaats
van het invulveld staat de naam van het land, en de pijl is pas te gebruiken na het antwoord.

- **Start**: de kaart opent op de regio van het land (Europa, Azië, …, de eerste regio uit
  `flags.ts`), zodat er op een telefoon land groot genoeg is om te raken. Welke regio het is, is
  het enige wat de kaart verklapt.
- **Bewegen**: slepen draait de bol, knijpen, scrollen of **+** en **−** zoomen
  (`src/components/countries/globe.ts`, gedeeld met de kaart van **De naam**). Een druk die minder
  dan 8 px beweegt, telt als tik.
- **Tikken**: elk land is een doel. Is een land op het scherm kleiner dan 80 px², dan krijgt het
  ook een witte stip om op te tikken. Fout getikt: het land kleurt rood en de melding zegt welk land
  het was ("Nee, dat is Oekraïne."); het telt als foute poging. Juist: het land kleurt groen, met
  confetti.
- **Hints**: drie, elk een gestreepte cirkel rond het land die de vorige halveert (24°, 12°, 6°,
  nooit kleiner dan het land zelf). De kaart schuift naar de cirkel en zoomt alleen in, nooit uit.
- **Toon**: de kaart zoomt in op het land en kleurt het in.
