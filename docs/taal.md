# Taal

Hoe `/taal/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het eindscherm
zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat anders is.

Het thema kwam er op 25 oktober 2026, uit twee tabbladen op Steves telefoon: de
[lijst van benamingen voor dieren](https://nl.wikipedia.org/wiki/Lijst_van_benamingen_voor_dieren)
en het [spellingalfabet van de NAVO](<https://vls.wikipedia.org/wiki/Spelliengsalfabet_(NAVO)>).
Wat er verder bij past (Griekse letters, wetenschappen, fobieën, telwoorden, Romeinse cijfers)
kwam er in dezelfde sessie bij.

## Spelvorm

Je ziet een korte vraag ("Het jong van een") met daaronder in groot het onderwerp ("paard?"), en
je tikt het antwoord. De placeholder zegt wat er gevraagd wordt ("Het jong?", "Welke fobie?").

Op het instelscherm staan drie kaders, elk met een **Alles**/**Niets** in de titelbalk en een
rij per reeks. De keuze wordt onthouden in `quiz:taal:series`; een eerste bezoek speelt de
dieren.

| Kader    | Reeks                      | Vraag → antwoord       |
| -------- | -------------------------- | ---------------------- |
| Dieren   | Het jong                   | paard → veulen         |
|          | Het mannetje               | paard → hengst         |
|          | Het vrouwtje               | paard → merrie         |
|          | Een groep                  | wolven → roedel        |
|          | Het geluid                 | hond → blaffen         |
|          | Waar het woont             | das → burcht           |
| Woorden  | NAVO-alfabet               | K → Kilo               |
|          | Griekse letters            | Λ λ → lambda           |
|          | Wetenschappen              | vogels → ornithologie  |
|          | Fobieën                    | spinnen → arachnofobie |
| Getallen | Telwoorden                 | een gros → 144         |
|          | Romeinse cijfers lezen     | MCMXCIV → 1994         |
|          | Romeinse cijfers schrijven | 1994 → MCMXCIV         |

De historiek (`quiz:taal:history`) gebruikt ids als `jong:paard` en `romeins-lezen:1994`.

### Waarom deze richting

- **Wetenschappen en fobieën** vragen de term, niet de betekenis: "ornithologie" heeft één
  schrijfwijze, "de studie van vogels" kan je op tien manieren zeggen, en de matcher kan dat niet
  beoordelen. Waar een gewoon Nederlands woord bestaat, telt het ook (hoogtevrees, pleinvrees,
  smetvrees).
- **Het NAVO-alfabet** vraagt alleen letter → woord. Omgekeerd is de beginletter het antwoord.
- **Griekse letters** vragen alleen de naam bij het teken; het teken typen kan niet op een gewoon
  toetsenbord. Lexend heeft geen Griekse letters, dus het teken staat in het systeemlettertype.
- **Romeinse cijfers** hebben beide richtingen als aparte reeksen, omdat lezen en schrijven iets
  anders zijn. Het is een vaste lijst van 52 getallen (`ROMAN_NUMBERS`): elke regel komt erin voor
  (IV, IX, XL, XC, CD, CM) en verder jaartallen die je op een gebouw of in een aftiteling ziet.
  `toRoman` maakt er de standaardvorm van.

## Exact antwoorden

Getallen en Romeinse cijfers zijn `exact`: alleen de juiste schrijfwijze telt, zonder typfouten
en zonder klankgelijke spelling (`matchExact` in `src/lib/matcher.ts`). De gewone matcher zou er
fouten goedkeuren: de klanksleutel maakt van "III" een "I" en van "144" een "14", en één teken
verschil is daar een ander antwoord.

Daarvoor houdt `normalize` sinds deze reeksen ook cijfers over. Voordien viel een antwoord als
"300" (de film) volledig weg. "Apollo 13" kreeg "Apollo" als alias, omdat "apollo" voordien goed
was en anders te ver van "apollo13" lag. Een hint toont ook cijfers als lege vakjes.

## Waar de data vandaan komt

- **Dieren** (`src/data/animals.ts`): de lijst op Wikipedia, nagekeken tegen de artikels over de
  dieren en woordenboeken. Alleen bekende dieren en woorden die een gewone spreker kent; de lijst
  op Wikipedia staat vol verouderde en streekgebonden namen. Vlaamse en Nederlandse vormen tellen
  allebei (een varken woont in een stal of een kot).
- **NAVO-alfabet**: de ICAO-spelling, met Alfa en Juliett; Alpha en Juliet tellen ook.
- **Griekse letters**: de Nederlandse spelling van Van Dale (bèta, thèta, jota, omikron,
  ypsilon), met de Engelse als alias.
- **Telwoorden**: Van Dale. Waar het aantal verschilde, telt het oude ook en staat het in de noot
  (een riem papier is 500 vel, vroeger 480).

## Overzicht

`/taal/overzicht/` toont per reeks alle vragen met het antwoord en wat ook goed is. Een statische
pagina zonder eiland, zoals bij de vlaggen.
