# Aardrijkskunde

Hoe `/aardrijkskunde/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het
eindscherm zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat
anders is.

## Spelvorm

Een zee, rivier of gebergte is aangeduid op de kaart, en je tikt de naam. Het instelscherm heeft
geen regio's en geen extra's, maar **Reeksen** (onthouden in `quiz:aardrijkskunde:groups`):

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
