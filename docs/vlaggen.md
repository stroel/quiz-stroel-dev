# Vlaggenquiz

Hoe `/vlaggen/` werkt, en waarom het zo werkt.

## Verloop

1. **Instellen.** Kies regio's (meerdere tegelijk) en extra reeksen. Onder de extra's staan per reeks
   drie voorbeelden, uit de dataset gehaald op landcode. Op elke regio staat hoeveel vlaggen erin
   zitten; de startknop toont het totaal. **Aantal** en **Timer** staan naast elkaar,
   elk met een schakelaar. Uit betekent alle vlaggen en geen tijdslimiet, en dan toont het scherm
   ook niets meer; aan toont een veld met "vlaggen" of "seconden" erachter. Een aantal boven wat
   beschikbaar is, telt als alles. De keuze wordt onthouden.
2. **Ronde.** Een vlag vult de bovenkant van het scherm, het invoerveld zit onderaan, boven het
   toetsenbord. `Enter` controleert het antwoord. De terugmelding ("Juist!", "Niet juist", "Te
   laat! …") verschijnt als tooltip net boven het invoerkader, zodat ze geen eigen ruimte inneemt.
   Een juist antwoord geeft confetti over het hele scherm, afgevuurd uit de twee benedenhoeken
   (`src/components/Confetti.tsx`, zonder bibliotheek; niet bij "minder beweging" op het toestel) en gaat na ruim een seconde zelf door
   naar de volgende vlag. Links van het invulveld staan het oog, dat het antwoord toont, en de hint (lamp). Na het oog
   tik je zelf op de pijl.
3. **Eindscherm.** Gecentreerd: hoeveel je juist had ("7 / 10"), een balk in groen, amber en rood
   (juist zonder hints, met hints, gemist), en daaronder die drie aantallen plus hints, foute
   pogingen en hoe vaak je te laat was. Dan de lijsten met gemiste vlaggen en vlaggen waarvoor je
   hints nodig had. Onderaan: **Ander thema** (naar de startpagina), **Andere vlaggen**
   (terug naar het instelscherm) en **Opnieuw**, dat dezelfde ronde nog eens speelt, in een andere
   volgorde.
4. **Stoppen.** Met het kruisje rechtsboven, naast de voortgang, stop je een ronde vroeger. De
   kop vraagt dan "Ben je zeker?", met **Annuleren** en **Ja, stop**, dat precies staat waar het
   kruisje stond. Een tweede tik binnen 0,4 seconde telt niet, zodat een dubbele tik de ronde niet
   per ongeluk stopt. Na **Ja, stop** kom je op het eindscherm met wat al gespeeld is, of op het
   instelscherm als er nog niets gespeeld was.

Er zijn geen punten. Per vlag wordt in `localStorage` (`quiz:vlaggen:history`) bijgehouden hoe
vaak ze gezien, juist, met hints of gemist was, zodat later een modus "mijn zwakke vlaggen" kan
volgen.

## Overzicht

`/vlaggen/overzicht/` (de knop **Overzicht** rechtsboven in het instelscherm) toont alle vlaggen
met hun naam en aliassen, per regio en alfabetisch, en daarna de betwiste gebieden, de gebieden en
de organisaties. Elke sectie staat ingeklapt; een tik op de titel klapt ze open. Een tik op een vlag toont ze
groot, met de naam erboven; het kruisje rechtsboven of een tik ernaast sluit ze. Een statische pagina zonder eiland (`src/layouts/Overview.astro`).

## Indeling

De dataset staat in `src/data/flags.ts`, met de namen voluit. `Intl.DisplayNames` geeft namen als
"Myanmar (Birma)" en "Hongkong SAR van China" die niemand typt, en de uitvoer verschilt per
browser.

- **Landen** (`land`): de 193 VN-leden plus Vaticaanstad en Palestina, samen 195.
- **Transcontinentaal**: Rusland, Turkije, Kazachstan, Georgië, Armenië, Azerbeidzjan en Cyprus
  horen bij Europa én Azië.
- **Microstaten**: Andorra, Liechtenstein, Malta, Monaco, San Marino en Vaticaanstad. Ze zitten
  gewoon in Europa. De chip **Microstaten** speelt ze ook als ze buiten de gekozen regio's vallen.
- **Betwist**: Kosovo, Taiwan en Westelijke Sahara. Ze volgen de gekozen regio's.
- **Gebieden**: gebieden met een eigen vlag (Groenland, Faeröer, Puerto Rico, Hongkong, …). Ze
  volgen de gekozen regio's. Overzeese departementen die de vlag van hun moederland voeren
  (Guadeloupe, Réunion, …) zijn weggelaten.
- **Organisaties**: EU, VN, ASEAN en de Arabische Liga, los van de regio's. UNICEF, NAVO, de
  Olympische vlag en het Rode Kruis zitten niet in `flag-icons`; die vragen eigen SVG's.

## Typfouten

`src/lib/matcher.ts` aanvaardt een antwoord in vier stappen:

1. **Normaliseren**: kleine letters, accenten weg, alleen letters, en vulwoorden weg (`republiek`,
   `van`, `de`, `het`, `en`). "Republiek Congo" en "Congo" worden zo gelijk.
2. **Fonetisch**: klanken die in het Nederlands hetzelfde klinken vallen samen: `ij`/`ei`/`y`,
   `ch`/`g`, `ph`/`f`, `th`/`t`, `au`/`ou`, `c` als `s` of `k`, `z`/`s`, `v`/`f`, `d`/`dt` op het
   einde wordt `t`, en dubbele letters worden enkel.
3. **Afstand**: Damerau-Levenshtein (met verwisselde buren). De tolerantie hangt af van de naam
   waartegen vergeleken wordt: tot 4 letters moet het exact zijn, tot 8 letters mag er 1 fout in
   zitten, daarboven 2. Ze hangt af van die naam, niet van de kortste naam van het land, zodat een
   alias als "VS" "Verenigde Staten" niet streng maakt.
4. **Botsing**: ligt de invoer dichter bij een ander antwoord uit de hele dataset, dan is ze fout.
   Zo is "Mali" geen Malawi, "Niger" geen Nigeria en "Iran" geen Irak. Bij een gelijkspel telt het
   antwoord wel als juist: "Congo" is goed voor beide Congo's.

Klopt een antwoord fonetisch maar niet letterlijk, dan toont de quiz de correcte schrijfwijze:
"Juist! (Letland)".

Nagekeken gevallen (allemaal zoals verwacht): `kirgisie` → Kirgizië ✓, `mali` → Malawi ✗,
`iran` → Irak ✗, `niger` → Nigeria ✗, `dominica` → Dominicaanse Republiek ✗, `congo` → beide
Congo's ✓, `vs` → Verenigde Staten ✓, `nederlant` ✓, `switserland` ✓, `marocco` ✓,
`saudi arabie` ✓, `sweden` → Zweden ✓, `pero` → Peru ✗, `guinee` → Guinee-Bissau ✗.

## Hints

`src/lib/hints.ts`:

- **Hint 1** toont een masker: één vakje per letter, met spaties, streepjes en apostroffen zoals ze
  zijn. Zo zie je dat "El Salvador" uit twee woorden bestaat.
  Het masker staat in een witte pil die net boven het invoerkader zweeft, zodat dat kader niet
  hoger wordt en de vlag niet kleiner.
- **Elke volgende hint** vult een willekeurige letter in die nog niet getoond werd (in amber). De
  laatste ontbrekende letter wordt nooit gegeven: dan is het oog de eerlijke knop.
- Het masker toont alleen de gegeven letters; wat je typt blijft in het invulveld en vult het
  masker niet aan. Je typt het antwoord altijd volledig, ook de letters die een hint al gaf
  (beslissing van Steve, 18 oktober 2026: het aanvullen maakte het veld onleesbaar). Alleen het
  invulveld telt bij het controleren.
- Een hint na een fout antwoord laat je antwoord staan; alleen de rode rand verdwijnt.

## Timer

Optioneel, met de schakelaar **Timer**. Aan zet hij standaard op 20 seconden; elk aantal van 1 tot
600 seconden kan. Standaard staat hij uit. Het gekozen aantal seconden wordt met de rest van de
instellingen onthouden.

- De klok start bij elke nieuwe vlag. Een fout antwoord of een hint zet hem niet terug en ook niet
  stil: een hint kost tijd, en dat is de bedoeling.
- Een amberkleurige balk onder de voortgang loopt leeg. In het laatste kwart wordt hij rood.
- Is de tijd op, dan telt de vlag als **gemist**. De quiz toont "Te laat! Het was …" en je tikt zelf
  door, net als na het oog. Het eindscherm meldt hoe vaak je te laat was, en de
  historiek telt een time-out als gemist.

## Toetsenbord

Op een computer gaat typen altijd naar het invulveld: wie een letter typt terwijl een knop of de
kaart de focus heeft, ziet ze gewoon in het veld verschijnen (ook Backspace). Op een telefoon
speelt dat niet: het schermtoetsenbord verschijnt alleen voor het veld zelf.

## Mobiel

- `100dvh` plus `interactive-widget=resizes-content`, zodat het invoerveld op Android boven het
  toetsenbord blijft. iOS Safari legt het toetsenbord over de pagina, dus de ronde volgt daar
  `visualViewport.height`.
- Het invoerveld heeft geen autocorrectie, geen hoofdletters en geen spellingcontrole. Wachtwoord-
  managers worden genegeerd.
- Met de meta-tags voor web-apps opent "Zet op beginscherm" de quiz zonder browserbalken.
