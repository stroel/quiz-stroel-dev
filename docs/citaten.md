# Citaten

Hoe `/citaten/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het eindscherm
zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat anders is.

Het thema stond eerst gepland als "Spreuken"; Steve hernoemde het op 18 oktober 2026 naar
**Citaten**, omdat het om uitspraken en filmzinnen gaat, niet om spreekwoorden.

## Spelvorm

Je ziet een bekende uitspraak en tikt wie ze zei. Bij een zin uit een film of serie tik je de
titel; de naam van het personage is ook goed. De placeholder zegt wat er gevraagd wordt: "Wie zei
het?", "Welke film?", "Welke serie?".

Na het antwoorden staan het jaar en een korte context onder de quote ("1963, toespraak in
West-Berlijn"). Een gevleugelde uitspraak zonder gekende eerste keer (Cruijff, de lijfspreuk van
Dehaene) heeft geen jaar. Het jaar zelf vragen, als tweede richting, kan later; Steve koos op 18 oktober
2026 voor alleen "wie".

Op het instelscherm staan **Reeksen** (onthouden in `quiz:citaten:groups`):

- **Wereldwijd**: geschiedenis, politiek, wetenschap, filosofie, literatuur, sport.
- **België en Nederland**: politici, vorsten, sport, schrijvers, televisie.
- **Film en tv**: zinnen uit films en series, internationaal en uit Vlaanderen en Nederland.

## Taal

Een quote staat er zoals ze gezegd is: Latijn, Frans, Duits, Engels, Nederlands. Wat geen
Nederlands of Engels is, krijgt een Nederlandse vertaling eronder. Een vertaalde quote is
minder herkenbaar dan het origineel ("Veni, vidi, vici" tegenover "Ik kwam, ik zag, ik
overwon"), en Engels leest iedereen.

## Waar de quotes vandaan komen

`src/data/quotes.ts` is met de hand samengesteld, niet uit een API of een dump gehaald:

- **Nagekeken, met wisselende grondigheid** (18 oktober 2026). De woorden, wie het zei en het
  jaar komen uit Wikiquote, Wikipedia, de lijst van het AFI of een nieuwsbron. Voor België en
  Nederland zijn die bronnen bijna allemaal echt geopend. Bij de films is dat vooral de AFI-lijst,
  want veel bekende filmzinnen worden verkeerd geciteerd ("Luke, I am your father" is "No, I am
  your father"). Van de wereldwijde reeks is maar een tiental live nagekeken; de rest steunt op
  wat bekend is over Wikiquote en de oorspronkelijke bron. Wie een fout vindt: aanpassen of
  schrappen.
- **Verkeerd toegeschreven quotes vallen weg.** Veel "bekende" quotes van Einstein, Churchill,
  Gandhi, Voltaire of Marie-Antoinette zijn nooit door hen gezegd. Ze zijn niet opgenomen, ook
  niet onder de echte maar onbekende auteur: dan wordt de vraag onmogelijk.
- **Geen songteksten.**
- **Twijfel is weg.** Voorbeelden van wat niet is opgenomen: "Elk nadeel heb z'n voordeel" (niet
  van Cruijff), "Float like a butterfly" (bedacht door Ali's assistent), de laatste woorden van
  Willem van Oranje, "Elementary, my dear Watson" (staat nergens bij Conan Doyle).
- **Bekend, niet volledig.** Het doel is wat een quizspeler kan kennen, niet alles wat ooit
  gezegd is. Echt bekende quotes met een zekere bron zijn er een paar honderd; Wikiquote heeft er
  tienduizenden, maar daar kent niemand het merendeel van.

Een quote toevoegen: een regel in `QUOTES` met een nieuwe, vaste id (de historiek gebruikt ze).
Een persoon met meer dan één quote staat één keer bovenaan als `person(...)`, met de namen die
ook goed zijn (de achternaam alleen, andere schrijfwijzen).

## Overzicht

`/citaten/overzicht/` (de knop **Overzicht** rechtsboven in het instelscherm) toont alle quotes
per reeks, met de vertaling, wie het zei, het jaar en de context. Een statische pagina zonder
eiland, zoals bij de vlaggen.
