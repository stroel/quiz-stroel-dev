# Landenweetjes

Hoe `/landenweetjes/` werkt, en waarom het zo werkt. De ronde, de hints, de timer en het
eindscherm zijn dezelfde als bij de vlaggen; zie [`vlaggen.md`](vlaggen.md). Hier staat alleen
wat anders is.

Tot 25 oktober 2026 was dit de hoofdstedenquiz op `/hoofdsteden/`. Toen Steve er inwoners,
bijvoeglijke naamwoorden, munten, internetextensies en nummerplaten bij wou, koos hij voor één
thema met alle weetjes over een land, met de hoofdsteden erin. Zo hergebruiken ze dezelfde
regio's, extra's en vlaggen.

- `public/_redirects` stuurt `/hoofdsteden/` en `/hoofdsteden/overzicht/` met een 301 door. Die
  regels werken alleen op Cloudflare; `pnpm dev` kent ze niet.
- De historiek blijft: de ids `capital:be` en `country:be` zijn dezelfde, en bij het eerste bezoek
  verhuizen `quiz:hoofdsteden:setup`, `…:direction` en `…:history` naar `quiz:landenweetjes:…`
  (`moveKey` in `src/lib/storage.ts`). Wat al onder de nieuwe sleutel staat, wordt niet
  overschreven.

## Vraag naar

Bovenaan het instelscherm staat **Vraag naar**, met zeven keuzes. De keuze wordt onthouden in
`quiz:landenweetjes:direction`.

| Keuze                            | Je ziet                 | Je tikt  | Id             |
| -------------------------------- | ----------------------- | -------- | -------------- |
| De hoofdstad (standaard)         | vlag en land            | Brussel  | `capital:be`   |
| De inwoner                       | vlag en land            | Belg     | `demonym:be`   |
| Het bijvoeglijk naamwoord        | vlag en land            | Belgisch | `adjective:be` |
| De munt                          | vlag en land            | euro     | `currency:be`  |
| Het land bij de hoofdstad        | Brussel                 | België   | `country:be`   |
| Het land bij de internetextensie | .be                     | België   | `tld:be`       |
| Het land bij de nummerplaat      | B, in een ovale sticker | België   | `plate:be`     |

Vraagt de quiz naar het land, dan staat er geen vlag: die verklapt het antwoord. De historiek
(`quiz:landenweetjes:history`) houdt elke richting apart bij.

Een land zonder antwoord in een richting speelt daar niet mee, en het aantal op de startknop
volgt. Er zijn dus minder vragen naar de nummerplaat (155) dan naar de munt (229).

## Welke landen

Dezelfde regio's en extra's als bij de vlaggen (`selectFlags`), zonder **Organisaties**: die
hebben geen hoofdstad, munt of inwoners. Het aantal op de startknop telt in **landen**.

In de richting **De hoofdstad** vallen 19 landen en gebieden weg waarvan de hoofdstad de naam van
het land is of bevat: Singapore, Luxemburg, Djibouti, Koeweit, Guatemala-Stad, Brazzaville,
Kinshasa, … (`trivial` in `src/data/capitals.ts`). Daar zou de vraag zichzelf beantwoorden. In
de andere richting spelen ze wel mee.

## De hoofdsteden

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

## De andere weetjes

Ze staan in `src/data/country-facts.ts`, één regel per land of gebied, gekoppeld op de landcode.
Samengesteld op 25 oktober 2026, met de toestand van die dag.

### Inwoners en bijvoeglijke naamwoorden

- **Bron**: de Taalunie (`namen.taalunie.org`, de pagina per land). De site gaf op 25 oktober
  2026 de hele dag een fout, dus de vormen komen uit de kopieën van die pagina's in de Wayback
  Machine (januari tot oktober 2026). Echte Taalunie-pagina's, maar mogelijk iets ouder dan de
  live site.
- **Wat getoond wordt**: de mannelijke vorm (Belg, Fransman); de vrouwelijke (Belgische,
  Française) en andere vormen van de Taalunie tellen ook. Geen meervouden: de placeholder vraagt
  één inwoner.
- **Wat ook goed is**: vormen uit de EU-schrijfwijzer die de Taalunie niet heeft (Estlander,
  Thailander, Iraki, Eswatiniër, Nauruaan, …). Waar de twee botsen, toont de quiz die van de
  Taalunie: Swazi en niet Eswatiniër, Naoëraan en niet Nauruaan.
- **Geen vorm**: Saint Kitts en Nevis, Saint Vincent en de Grenadines en de Turks- en
  Caicoseilanden spelen niet mee, en het Vaticaan, Jersey en Guernsey alleen met het bijvoeglijk
  naamwoord. De Taalunie geeft daar alleen een omschrijving ("inwoner van …").

### Munten

- **Bron**: de Interinstitutionele Schrijfwijzer van de EU, bijlage A5 (lijst van staten, gebieden
  en munteenheden, bijgewerkt op 15 oktober 2026), voor 227 van de 229. Kosovo (euro) en
  Palestina (sjekel en Jordaanse dinar) staan er niet in.
- **Recent gewijzigd**: Bulgarije betaalt sinds 1 januari 2026 met de euro, Kroatië sinds 2023;
  Curaçao en Sint-Maarten hebben sinds 2025 de Caribische gulden; Zimbabwe heeft sinds 2024 de
  ZiG ("Zimbabwaans goud"). Die krijgen een noot na het antwoorden.
- **Wat ook goed is**: het losse naamwoord ("dollar" voor de Canadese dollar, "frank", "roepie",
  "kroon"), want dat zegt een speler, en een gangbare Engelse of lokale vorm (rupee, złoty,
  renminbi). Waar een land officieel twee munten gebruikt (Panama, El Salvador, Bhutan,
  Lesotho, Namibië, Haïti), tellen beide en zegt de noot het.
- **Euro**: de helft van Europa antwoordt "euro". Dat maakt die vragen makkelijk, niet fout.

### Nummerplaten

De internationale landcode op de ovale sticker of de blauwe EU-band. Alleen codes die bij de
VN geregistreerd zijn (verdragen van 1949 en 1968, de tabellen van de UN Treaty Collection) of die
de Nederlandse en Engelse Wikipedia allebei als in gebruik opgeven: 155 in totaal.

- De code van vandaag: **UK** (niet meer GB, sinds 2021), **NMK** voor Noord-Macedonië (sinds
  2019, al staat bij de VN nog MK), **CGO** voor Congo-Kinshasa, **RN** voor Niger.
- **Weggelaten**: codes die nooit bij de VN gemeld zijn (China CHN, Saudi-Arabië KSA, Qatar Q,
  …), Kosovo (RKS staat op de platen, maar Kosovo is geen partij bij de verdragen), Benin (DY is
  geregistreerd, maar de platen dragen RB), Cuba (de bronnen spreken elkaar tegen) en de meeste
  gebieden, die de code van hun moederland voeren.
- **Twijfel**: Taiwan (RC, geregistreerd in 1932, het gebruik vandaag is onzeker), Palestina (PS
  geregistreerd in 2019, op de platen staat P), Bahrein (BRN; BHR bestaat ook). Oman, de VAE,
  Irak, Panama, Colombia en Zambia steunen alleen op de twee Wikipedia's.

### Internetextensies

De landcode-domeinen uit de rootzone van IANA: 227. Het Verenigd Koninkrijk is `.uk` (`.gb`
bestaat maar wordt niet gebruikt). Kosovo heeft geen extensie, en `.eh` voor de Westelijke
Sahara is nooit toegekend.

## Dezelfde hoofdstad, twee landen

Kingston is de hoofdstad van Jamaica én van Norfolk. In de richting **Het land** telt elk land met
die hoofdstad als juist (`reverseCandidates` in `src/lib/fact-pool.ts`; dat geldt ook voor de extensie en de
nummerplaat, al komt daar geen code twee keer voor).

## Typfouten

Dezelfde matcher als bij de vlaggen, met als kandidaten alle hoofdsteden (of alle landen, in de
andere richting). Nagekeken: elke hoofdstad, alias en tweede hoofdstad, en elk land en zijn
aliassen, wordt in zijn eigen vraag aanvaard. Verder: `nouakchot` → Nouakchott ✓, `kiev` ✓,
`ottowa` ✓, `canbera` ✓, `vienna` ✓, `la paz` → Bolivia ✓, `kaapstad` → Zuid-Afrika ✓,
`den haag` → Nederland ✗, `sidney` → Australië ✗, `zurich` → Zwitserland ✗.

## Overzicht

`/landenweetjes/overzicht/` (de knop **Overzicht** rechtsboven in het instelscherm) toont alle
landen met hun hoofdstad en daaronder de andere weetjes op één regel ("Belg · Belgisch · euro ·
.be · B"), per regio en alfabetisch, met de tweede hoofdsteden en de noten. Elke
regio staat ingeklapt; een tik op de titel klapt ze open. Een tik op een vlag toont ze groot, met
land en hoofdstad erboven. Om door te nemen voor je speelt.
Hetzelfde bestaat voor de vlaggen: `/vlaggen/overzicht/`.
