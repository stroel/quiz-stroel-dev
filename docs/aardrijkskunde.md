# Aardrijkskunde

Hoe `/aardrijkskunde/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het
eindscherm zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat
anders is.

## Spelvorm

Bovenaan het instelscherm staat **Vraag naar** (onthouden in `quiz:aardrijkskunde:direction`):

- **De naam**: een zee, rivier of gebergte is aangeduid op de kaart, en je tikt de naam.
- **De plaats**: je krijgt de naam en tikt het aan op de kaart. Zie
  [Tikken op de kaart](#tikken-op-de-kaart).

Daaronder geen regio's en geen extra's, maar **Reeksen** (onthouden in
`quiz:aardrijkskunde:groups`):

| Reeks                 | Aantal | Bron          |
| --------------------- | ------ | ------------- |
| Zeeën en oceanen      | 37     | Natural Earth |
| Rivieren in België    | 17     | OpenStreetMap |
| Rivieren in de wereld | 46     | Natural Earth |
| Gebergtes             | 31     | Natural Earth |

Steve, 18 oktober 2026: van België alle rivieren (Dender, Leie, IJzer, Demer, …), van het
buitenland alleen de bekende (Rijn, Seine, Donau, Po, Nijl, Mississippi, …). Rivieren van
Nederland, Frankrijk en Duitsland staan dus bij "in de wereld", en alleen als ze bekend zijn.

De placeholder van het invulveld zegt wat er gevraagd wordt: "Welke zee?", "Welke rivier?",
"Welk gebergte?". Zelfde matcher als bij de vlaggen, met als kandidaten alle namen uit de
dataset.

## De kaart

`src/components/geo/GeoMap.tsx`, op dezelfde kaartcomponent als de landen
(`src/components/countries/HighlightMap.tsx`), met de landen als achtergrond.

- **Zee**: donker ingekleurd, onder de landen, zodat de kust ze uitsnijdt.
- **Rivier**: een dikke zwarte lijn met een witte rand.
- **Gebergte**: een donker, half doorzichtig vlak.
- **Context**: alle andere rivieren uit de dataset staan er dun en blauw bij, ook bij een zee of
  gebergte. Zonder die lijnen was een Belgische rivier niet te plaatsen.
- **Uitsnede**: zoals bij de landen, met een kleinste straal per soort: 0,9° voor een Belgische
  rivier, 2,5° voor een buitenlandse rivier of een gebergte, 5° voor een zee.
- **Bronvermelding** linksonder: "Natural Earth · © OpenStreetMap-bijdragers". De licentie van
  OpenStreetMap (ODbL) vraagt dat.

## Tikken op de kaart

`src/components/geo/GeoTapMap.tsx`, op dezelfde tikkaart als de landen
(`src/components/countries/TapMap.tsx`; slepen, zoomen, hints en kleuren staan in
[`landen.md`](landen.md#tikken-op-de-kaart)).

- Alleen wat van dezelfde soort is, kun je aantikken: bij een rivier alle rivieren, bij een zee
  alle zeeën, bij een gebergte alle gebergtes.
- **Rivieren** zijn blauwe lijnen met een brede, onzichtbare rand van 22 px om op te tikken: een
  lijn van 2 px raak je niet met een vinger. **Zeeën** liggen onder de landen, met hun grenzen als
  dunne blauwe lijn. **Gebergtes** zijn lichtgrijze vlakken.
- **Start**: een Belgische rivier begint op België, al het andere op het werelddeel waar het ligt
  (een oceaan op een uitsnede die groot genoeg is).
- Fout getikt: "Nee, dat is de Maas." De historiek houdt beide richtingen apart bij (`maas` en
  `place:maas`).

## Overzicht

`/aardrijkskunde/overzicht/` (de knop **Overzicht** rechtsboven in het instelscherm) toont alles
uit één reeks tegelijk op de kaart, met de namen in een lijst. Bovenaan kies je de **Reeks**
(onthouden in `quiz:aardrijkskunde:overview`); één reeks tegelijk, zodat zeeën, rivieren en
gebergtes niet door elkaar staan (Steve, 18 oktober 2026).

- Een tik op de kaart of op een naam in de lijst kleurt het aan in de accentkleur en toont de naam
  onderaan op de kaart.
- Alleen een naam uit de lijst verschuift de kaart ernaartoe; wie op de kaart tikt, heeft het al in
  beeld en wil niet dat de kaart verspringt (`frameAnswer` op `TapMap`).
- Het is dezelfde tikkaart als in de quiz (`src/components/geo/GeoOverview.tsx` op
  `TapMap.tsx`). Op de telefoon staat de kaart tussen de reeksen en de lijst, vanaf `md` ernaast
  en vast in beeld.
- Anders dan de andere overzichten is dit een eiland (`client:only`): de kaart wordt getekend op
  de grootte van haar vlak, en de keuze van de reeks heeft script nodig.

- **Namen** (de schakelaar linksboven op de kaart, standaard aan, onthouden in
  `quiz:aardrijkskunde:overview-names`) zet alle namen van de reeks op de kaart. Ze worden
  geplaatst van groot naar klein; een naam die een andere zou bedekken, valt weg tot je inzoomt.
  Zo blijft de wereldkaart met 46 rivieren leesbaar. Een zee of gebergte krijgt zijn naam in het
  midden, een rivier op het punt van de lijn dat het dichtst bij dat midden ligt (het midden van
  een kronkelende rivier ligt vaak ernaast). Water staat cursief, zoals in een atlas.

## De dataset

`src/data/geo.ts`: per vraag een vaste id (die de historiek gebruikt), de Nederlandse naam, andere
namen die ook goed zijn (Moselle, Rhein, Stille Oceaan) en de bron van de vorm.

- **Natural Earth** 1:10m (publiek domein): `ne_10m_geography_marine_polys` voor de zeeën,
  `ne_10m_rivers_lake_centerlines` voor de rivieren en `ne_10m_geography_regions_polys` voor de
  gebergtes. Een rivier staat daar vaak in stukken met elk een naam (Jinsha, Chang Jiang en
  Yangtze zijn samen de Jangtsekiang); de dataset somt ze op. Komt een naam twee keer voor (de
  Colorado in de VS en in Argentinië), dan houdt een `bbox` de juiste over.
- **OpenStreetMap** voor de Belgische rivieren, die Natural Earth niet heeft: per rivier het
  nummer van de relatie.

Wat ontbreekt: de Eifel, het Zwarte Woud, de Hoge Venen en de Dolomieten (niet in Natural
Earth), de Rupel (geen rivierrelatie in OpenStreetMap). Sommige rivieren zijn bij Natural Earth
maar een deel van hun loop (de Theems, de bovenloop van de Rijn).

## De vormen bouwen

De vormen staan in `public/geo/geo.json` (480 kB, 163 kB gzip) en zitten in git: de build heeft
geen netwerk nodig. Opnieuw bouwen, alleen als de dataset verandert:

1. De vier Natural Earth-bestanden uit `geojson/` van
   [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) in één map.
2. Per OpenStreetMap-relatie een bestand `rel-<id>.json` in een tweede map, met een Overpass-vraag
   `[out:json];rel(id:<id>);out geom;`. De publieke server is vaak druk; vraag ze één voor één.
3. `node scripts/build-geo-map.ts <map-natural-earth> <map-osm>`

Het script vereenvoudigt elke vorm (Douglas–Peucker: 0,03° voor zeeën en gebergtes, 0,01° voor
rivieren, 0,002° voor Belgische rivieren) en rondt de coördinaten af. Vindt het voor een vraag
geen vorm, dan stopt het met een fout.

Een vlak houdt zijn gaten (eilanden in een zee) bij zich, en elk vlak dat d3 groter ziet dan een
halve wereldbol, wordt omgedraaid. d3 rekent op een bol, waar de richting van een rand zegt wat
binnen ligt: verkeerd om wordt een zee "de hele wereld behalve die zee". Zo ging het eerst mis
(een tik bij de Tasmanzee landde op de Hudsonbaai).
