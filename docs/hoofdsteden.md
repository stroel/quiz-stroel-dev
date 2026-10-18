# Hoofdstedenquiz

Hoe `/hoofdsteden/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het eindscherm
zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen wat anders is.

## Richting

Bovenaan het instelscherm staat **Vraag naar**, met twee keuzes. De keuze wordt onthouden in
`quiz:hoofdsteden:direction`.

- **De hoofdstad** (standaard): je ziet de vlag en de naam van het land, je tikt de hoofdstad.
- **Het land**: je ziet alleen de naam van de hoofdstad, je tikt het land. Geen vlag, want die
  verklapt het land.

De historiek (`quiz:hoofdsteden:history`) houdt beide richtingen apart bij, met ids als
`capital:be` en `country:be`: een hoofdstad kennen en haar land herkennen is niet hetzelfde.

## Welke landen

Dezelfde regio's en extra's als bij de vlaggen (`selectFlags`), zonder **Organisaties**: die
hebben geen hoofdstad. Het aantal op de startknop telt in **landen**.

In de richting **De hoofdstad** vallen 19 landen en gebieden weg waarvan de hoofdstad de naam van
het land is of bevat: Singapore, Luxemburg, Djibouti, Koeweit, Guatemala-Stad, Brazzaville,
Kinshasa, … (`trivial` in `src/data/capitals.ts`). Daar zou de vraag zichzelf beantwoorden. In
de andere richting spelen ze wel mee.

## De dataset

`src/data/capitals.ts` heeft één regel per land of gebied uit `src/data/flags.ts` (229, de
organisaties niet), in dezelfde volgorde, gekoppeld op de landcode.

- **`name`**: de Nederlandse vorm volgens de Taalunie waar die bestaat (Brussel, Peking,
  Kopenhagen, Boekarest).
- **`aliases`**: andere schrijfwijzen van dezelfde stad die mensen echt typen (Beijing, Bucharest,
  Kyiv, Kiev). Typfouten en klankgelijke spelling vangt de matcher al op.
- **`alsoAccepted`**: een tweede hoofdstad die ook als juist telt. Bolivia: Sucre en La Paz.
  Zuid-Afrika: Pretoria, Kaapstad en Bloemfontein. Verder Sri Lanka, Ivoorkust, Benin, Burundi,
  Eswatini, Maleisië, Jemen, Indonesië (Nusantara), Montserrat en Tokelau.
- **`note`**: een korte uitleg die na het antwoorden onder de vraag verschijnt, alleen waar het
  antwoord verrast of betwist is. Nederland: "Amsterdam is de hoofdstad; de regering zit in Den
  Haag."

### Keuzes in betwiste gevallen

Gemaakt bij het samenstellen (18 oktober 2026); Steve heeft ze niet anders gevraagd.

- **Israël**: Jeruzalem. Tel Aviv telt ook als juist, met een noot: veel mensen antwoorden het, en
  de meeste landen hebben er hun ambassade.
- **Palestina**: Ramallah (zetel van het bestuur). Oost-Jeruzalem telt ook. Gewoon "Jeruzalem"
  telt niet: dat ligt dichter bij het antwoord van Israël.
- **Tanzania**: alleen Dodoma. Dar es Salaam staat in de noot.
- **Soedan**: Khartoum, zonder Port Sudan.
- **Nauru** en **Tokelau** hebben geen officiële hoofdstad; de noot zegt het.

## Dezelfde hoofdstad, twee landen

Kingston is de hoofdstad van Jamaica én van Norfolk. In de richting **Het land** telt elk land met
die hoofdstad als juist (`COUNTRIES_BY_CAPITAL` in `src/lib/capital-pool.ts`).

## Typfouten

Dezelfde matcher als bij de vlaggen, met als kandidaten alle hoofdsteden (of alle landen, in de
andere richting). Nagekeken: elke hoofdstad, alias en tweede hoofdstad, en elk land en zijn
aliassen, wordt in zijn eigen vraag aanvaard. Verder: `nouakchot` → Nouakchott ✓, `kiev` ✓,
`ottowa` ✓, `canbera` ✓, `vienna` ✓, `la paz` → Bolivia ✓, `kaapstad` → Zuid-Afrika ✓,
`den haag` → Nederland ✗, `sidney` → Australië ✗, `zurich` → Zwitserland ✗.

## Overzicht

`/hoofdsteden/overzicht/` (de knop **Overzicht** rechtsboven in het instelscherm) toont alle
landen met hun hoofdstad, per regio en alfabetisch, met de tweede hoofdsteden en de noten. Elke
regio staat ingeklapt; een tik op de titel klapt ze open. Een tik op een vlag toont ze groot, met
land en hoofdstad erboven. Om door te nemen voor je speelt.
Hetzelfde bestaat voor de vlaggen: `/vlaggen/overzicht/`.
