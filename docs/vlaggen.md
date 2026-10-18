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
   Een juist antwoord geeft een kleine confettiregen (`src/components/Confetti.tsx`, zonder
   bibliotheek; niet bij "minder beweging" op het toestel) en gaat na ruim een seconde zelf door
   naar de volgende vlag. Na **Toon** tik je zelf op de pijl.
3. **Eindscherm.** Toont juist zonder hints, juist met hints en gemist, plus het aantal hints en
   foute pogingen. Daaronder staan de lijsten met gemiste vlaggen en vlaggen waarvoor je hints
   nodig had. **Oefen deze opnieuw** speelt precies die vlaggen nog eens. Met **Stop** (de derde
   knop onderaan) stop je een ronde vroeger. Op dezelfde plaats vraagt de quiz dan "Ben je zeker?",
   met **Verder** in het midden en **Ja, stop** rechts, precies waar **Stop** stond. Een tweede tik
   binnen 0,4 seconde telt niet, zodat een dubbele tik de ronde niet per ongeluk stopt. Na
   **Ja, stop** kom je op het eindscherm met wat al gespeeld is, of op het instelscherm als er nog
   niets gespeeld was.

Er zijn geen punten. Per vlag wordt in `localStorage` (`quiz:vlaggen:history`) bijgehouden hoe
vaak ze gezien, juist, met hints of gemist was, zodat later een modus "mijn zwakke vlaggen" kan
volgen.

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
- **Elke volgende hint** vult een willekeurige letter in die nog niet getoond werd (in amber). De
  laatste ontbrekende letter wordt nooit gegeven: dan is **Toon** de eerlijke knop.
- Wat je typt vult de vakjes van links naar rechts, waarbij onthulde letters worden overgeslagen.
  Je hoeft een gegeven letter dus niet te typen. Bij het controleren tellen zowel je getypte tekst
  als het ingevulde masker.
- Een hint na een fout antwoord maakt het veld eerst leeg, anders zou het foute antwoord in het
  nieuwe masker vloeien.

## Timer

Optioneel, met de schakelaar **Timer**. Aan zet hij standaard op 20 seconden; elk aantal van 1 tot
600 seconden kan. Standaard staat hij uit. Het gekozen aantal seconden wordt met de rest van de
instellingen onthouden.

- De klok start bij elke nieuwe vlag. Een fout antwoord of een hint zet hem niet terug en ook niet
  stil: een hint kost tijd, en dat is de bedoeling.
- Een amberkleurige balk onder de voortgang loopt leeg. In het laatste kwart wordt hij rood.
- Is de tijd op, dan telt de vlag als **gemist**. De quiz toont "Te laat! Het was …" en je tikt zelf
  door, net als na **Toon**. Het eindscherm meldt hoe vaak je te laat was, en de
  historiek telt een time-out als gemist.

## Mobiel

- `100dvh` plus `interactive-widget=resizes-content`, zodat het invoerveld op Android boven het
  toetsenbord blijft. iOS Safari legt het toetsenbord over de pagina, dus de ronde volgt daar
  `visualViewport.height`.
- Het invoerveld heeft geen autocorrectie, geen hoofdletters en geen spellingcontrole. Wachtwoord-
  managers worden genegeerd.
- Met de meta-tags voor web-apps opent "Zet op beginscherm" de quiz zonder browserbalken.
