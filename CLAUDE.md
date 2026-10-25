# CLAUDE.md — Instructies voor Claude

Dit bestand wordt als eerste gelezen bij het begin van elke sessie.

## Je rol

Je bent de implementatiepartner voor **quiz.stroel.dev**. Steve (de developer) neemt de architectuur- en planningsbeslissingen. Jij doet de implementatie, de code en de tactische keuzes.

Twijfel je over architectuur: **stop en vraag het aan Steve**, of kijk in de docs van deze repo. Verzin geen architectuurpatronen ter plekke.

## Stack

- **Hosting**: Cloudflare Workers met Static Assets (volledig statische Astro-build, geen adapter)
- **Data**: geen backend; de historiek staat in `localStorage` van het toestel
- **CDN**: Cloudflare
- **Framework**: Astro + React (islands)
- **Styling**: Tailwind CSS v4 (configuratie via `@theme {}`, geen `tailwind.config.js`)
- **Iconen**: Lucide
- **Layout**: de skill `/quiz-design`: kaders met titelbalk en rijen, de kleuren van stroel.dev (`slate`, zwart als accent via de token `accent`), het STROEL-logo alleen onderaan de startpagina, Lexend zelf gehost in `public/fonts/`, geen donkere modus
- **Package manager**: pnpm
- Persoonlijke quiz-app van Steve, publiek maar zonder login. Gemaakt voor de telefoon: elk scherm vult de viewport.
- De wereldkaart komt uit `world-atlas` en wordt door `src/integrations/map-assets.ts` naar `public/maps/countries.json` geschreven, met onze landcodes als id (gegenereerd, niet in git).
- Vlaggen komen uit `flag-icons` en worden door `src/integrations/flag-assets.ts` naar `public/flags/` gekopieerd (gegenereerd, niet in git).

## Bij het begin van een sessie

1. Lees `CLAUDE.md` (dit bestand)
2. Lees `CONVENTIONS.md` voor codestijl en patronen
3. Lees `STYLEGUIDE.md` voor UI-conventies, en de skill `/quiz-design` (`.claude/skills/quiz-design/`) voor de layout van de quiz; waar ze botsen, wint de skill
4. Lees de projectspecifieke docs die bij de huidige taak horen
5. Lees `docs/vlaggen.md` voor je aan de vlaggenquiz, de gedeelde quizschermen of de matcher werkt, `docs/landenweetjes.md` voor de hoofdsteden en andere landenweetjes, `docs/citaten.md` voor de citaten en `docs/taal.md` voor taal

## Bij het maken van wijzigingen

1. Volg de bestaande patronen in de codebase
2. Bestaat er geen patroon: kijk in `CONVENTIONS.md` / `STYLEGUIDE.md`
3. Staat het daar ook niet: vraag het aan Steve voor je beslist
4. Werk de betrokken docs bij wanneer je een betekenisvolle beslissing neemt
5. Werk `CHANGELOG.md` bij in projecten die er een bijhouden

## Wanneer is het klaar

- De code compileert met TypeScript strict
- Lint slaagt (ESLint + Prettier) en de types kloppen (`astro check` / `tsc --noEmit`)
- De code is nagekeken (door jou, in een tweede ronde)
- README bijgewerkt in dezelfde commit als de wijziging die haar onwaar maakt (zie _De README_ hieronder); andere docs waar nodig
- CHANGELOG-entry toegevoegd waar van toepassing
- Tests slagen (waar er tests zijn)
- Een manuele smoke test bevestigt dat het werkt

## Kritieke conventies (niet onderhandelbaar)

De volledige regels staan in `CONVENTIONS.md`. De essentie:

- **TypeScript strict overal**; geen `any` zonder commentaar dat uitlegt waarom
- **Named exports** voor utilities; default exports mogen voor componenten/config
- **`async/await`**, geen `.then()`-ketens
- **ESLint + Prettier + `tsconfig`** zijn gecommit; overschrijf ze niet lokaal. Prettier gebruikt `prettier-plugin-tailwindcss` (sorteert classes automatisch, behalve voorlopig in `.astro` — orden ze daar met de hand); ESLint is flat config met `eslint-plugin-astro`
- **Bestanden** kebab-case; **componenten** PascalCase; **functies/variabelen** camelCase; **constanten** SCREAMING_SNAKE_CASE; **DB** snake_case
- Commentaar legt het **waarom** uit; TODO's dragen een naam + datum
- **Geen HTML-commentaar** (`<!-- … -->`) in markup — leg het uit in de frontmatter of in een `//`-commentaar binnen het script
- **Gepubliceerde output is geminificeerd**: Astro-apps registreren `src/integrations/minify-output.ts`, dat na de build commentaar weghaalt en inline scripts, styles en JSON-LD minifyt. Inline scripts mogen nooit gooien (de minifier voegt aangrenzende samen). Zie `CONVENTIONS.md`
- Slik fouten nooit stil in
- **Markdown-documentatie in het Nederlands; code en commentaar in het Engels.** Zie `CONVENTIONS.md`
- **Commit-messages: één Engelse subject-regel** — geen body, geen opsomming, geen trailers (geen `Co-Authored-By`, geen sessielink). Engels heeft hier geen projectuitzondering, ook niet in een repo waarvan de docs en UI-teksten Nederlands zijn; het _waarom_ gaat in dezelfde commit naar de markdown. Zie `CONVENTIONS.md`
- **Alleen Tailwind** — geen inline styles voor statische waarden; `slate-*` voor neutralen in interne UI, nooit `gray-*`
- **Alleen Lucide-iconen** — nooit emoji, UTF-8-symbolen of zelfgemaakte SVG's

## De README

De `README.md` zegt wat het project is, hoe je het gebruikt, lokaal draait en deployt, en waar
de rest staat. Het _waarom_ hoort in dit bestand en in `docs/`, niet in de README.

- **Bijwerken in dezelfde commit** als de wijziging die haar onwaar maakt: een nieuwe knop, een
  verplaatste pagina, een nieuw script. Een README die achterloopt op de code is erger dan een
  korte.
- **Noem knoppen, labels en commando's zoals ze in de code staan.** Heet iets in de README
  anders dan op het scherm of in `package.json`, dan is de README fout.
- **Elke README heeft een Stack-tabel, en de kolommen liggen vast:** pakket in kolom één,
  versie in kolom twee, de rest daarna. `scripts/sync-readme-versions.mjs` leest elke rij zo;
  staat de versie ergens anders, dan herkent het script geen enkele rij en veroudert de tabel
  stilletjes. Herhaal versies niet in proza.
  Een repo zonder dependencies (alleen documentatie, zoals `stroel-cms-docs`) heeft geen
  Stack-tabel; een lege tabel zou alleen iets beloven dat er niet is.
- **VVK-projecten** (VV Koekelare) volgen daarbovenop een vaste indeling van koppen: _Wat het
  doet_, eigen secties, _Toegang_, _Documentatie_, _Stack_, _Lokaal draaien_, _Commando's_,
  _Deployen_, _Hoe het in elkaar zit_, _Merk_. De bron is de skill `vvk-design`; een VVK-repo
  herhaalt ze in zijn `CLAUDE.md`.

## Waar je STEVE naar moet VRAGEN

- Nieuwe npm-dependencies toevoegen
- De publieke API van shared packages wijzigen
- Databaseschema-wijzigingen die een migratie vereisen
- Alles wat meerdere packages raakt
- Performance-afwegingen met een serieuze impact
- Nieuwe architectuurpatronen die hier niet beschreven staan
- Alles wat botst met de docs

## Wat je ZELF mag BESLISSEN

- Interne implementatiedetails, hulpfuncties, interne organisatie
- De naamgeving van interne variabelen
- Refactoren binnen één bestand (opruimwerk)
- Tests toevoegen
- Verbeteringen aan de documentatie
- Bugfixes die de publieke API niet wijzigen

## Wat we van je output verwachten

- Toon de diff of het volledige bestand, wat het beste past
- Leg niet-evidente beslissingen kort uit
- Benoem de afwegingen die je gemaakt hebt
- Markeer alles waar je onzeker over bent
- In lange gesprekken: herinner Steve aan de huidige taak, stel voor om tussentijds te committen, meld het wanneer de scope uitdijt

## Dingen om te onthouden

- Steve is een ervaren PHP-developer. Leg de basis niet uit, maar leg patronen die specifiek zijn voor TypeScript / Astro / Cloudflare wél uit als je twijfelt
- Langlopend project: codekwaliteit weegt zwaarder dan snelheid
- De docs in deze repo zijn de bron van waarheid. Botst de code met de docs, meld het
- Je antwoorden aan Steve zijn in het Nederlands

## Projectspecifieke notities

Cloudflare-account `b9f47bdfd5561613df8a0f20d7795cff` (STROEL). `CLOUDFLARE_ACCOUNT_ID` in `.env` en `account_id` in `wrangler.jsonc` moeten daarmee overeenkomen.

### Opbouw

- `quiz.stroel.dev/` is de startpagina met een keuze per quiz; elke quiz is een eigen pad (`/vlaggen/`, `/landenweetjes/`, `/landen/`, `/aardrijkskunde/`, `/citaten/`, `/taal/`), met een overzicht op `<quiz>/overzicht/` (statisch, behalve dat van aardrijkskunde: een kaart als eiland).
- De hoofdsteden zitten sinds 25-10-2026 in **Landenweetjes**, samen met inwoners, bijvoeglijke naamwoorden, munten, internetextensies en nummerplaten (Steve). `/hoofdsteden/` verwijst door via `public/_redirects`; de oude localStorage-sleutels verhuizen bij het eerste bezoek. Zie `docs/landenweetjes.md`.
- Een quiz met getypte antwoorden is `src/components/quiz/QuizFlow.tsx` (instellen, ronde, eindscherm, historiek) met een dunne schil per quiz (`flags/FlagQuiz.tsx`, `facts/FactQuiz.tsx`, `words/WordQuiz.tsx`): die zegt wat ze selecteert, hoe dat vragen worden (`src/lib/question.ts`) en hoe een vraag eruitziet. Een vraag met `exact` (getallen, Romeinse cijfers) slaat de typfoutentolerantie over.
- Herbruikbare logica staat in `src/lib/`: `matcher.ts` (typfouten), `hints.ts` (masker en letters), `history.ts` en `storage.ts` (localStorage). Een nieuwe quiz hergebruikt die en brengt alleen zijn dataset en schermen mee.
- Elke quiz is één React-eiland met `client:only="react"`: alles wat het toont hangt af van `localStorage`.
- Alle teksten staan in `src/i18n/nl.ts`.
- Woordkeuze: de quizzen op de startpagina (Vlaggen, Landenweetjes, Landen, …) heten **thema's**, niet categorieën (Steve, 18-10-2026). Gebruik dat woord in UI-teksten en docs.

### Open punten

- `/citaten/` vraagt alleen "wie zei het"; het jaar als tweede richting kan later (Steve, 18-10-2026). Zie `docs/citaten.md`.
- `/aardrijkskunde/` (zeeën, rivieren, gebergtes) heeft beide richtingen, net als `/landen/`. De vormen staan in `public/geo/geo.json` (in git); hoe je ze opnieuw bouwt staat in `docs/aardrijkskunde.md`.
- Land → vlag (raster van 9 of 16 met lookalikes) is nog niet gebouwd.
- Clublogo's (gepland, Steve, 18-10-2026): logo → club voor de clubs van seizoen 2026-27 in Engeland, België, Nederland, Frankrijk, Spanje, Portugal en Duitsland. Bron: football-data.org (SVG op `crests.football-data.org`), eenmalig opgehaald door een script en zelf gehost in `public/crests/` (in git); Steve is akkoord met het publiek hosten. België zit niet in het gratis pakket: die ID's met de hand. Wacht op een werkende API-sleutel (`FOOTBALL_DATA_API_KEY` in `.env` gaf "Your API token is invalid"). Uitwijk: `github.com/luukhopman/football-logos` (alle 7 competities, maar PNG van 139×181 px, geen licentie). Daarna: WK/EK-winnaars als feitvragen, spelers als tekstvragen.
- PWA: er is een manifest (`public/manifest.webmanifest`, iconen in `public/icons/`), dus de app is te installeren; een service worker voor offline gebruik komt later.
- Er is nog geen testrunner. De matcher is met de hand nagekeken tegen de gevallen in `docs/vlaggen.md`; Vitest toevoegen is een beslissing voor Steve.
- Landenweetjes (25-10-2026), na te kijken:
  - Inwonersnamen komen uit Wayback-kopieën van `namen.taalunie.org` (de site gaf toen een fout). Vergelijken met de live site zodra die werkt.
  - Twijfelachtige nummerplaatcodes: Taiwan (RC), Palestina (PS, op de platen staat P), Bahrein (BRN of BHR). Oman, VAE, Irak, Panama, Colombia en Zambia steunen alleen op twee Wikipedia's; Cuba is weggelaten omdat de bronnen botsen. Zie `docs/landenweetjes.md`.
  - Munten veranderen (Bulgarije, Kroatië, Caribische gulden, Zimbabwe): bij een nieuwe versie van bijlage A5 van de EU-schrijfwijzer `src/data/country-facts.ts` nalopen.
- Taal (25-10-2026):
  - Na te kijken in `src/data/animals.ts`: geluiden zonder bron (beer brommen, kraai krassen, kat mauwen, hond keffen), het West-Vlaamse `keu` (big) dat ook goed is, en `lam` vóór `geitje` als jong van een geit.
  - Het Lucide-icoon `languages` op de startpagina is uit het hoofd overgenomen; vergelijken met lucide.dev.
  - Kan later: de omgekeerde richting voor dieren (veulen → paard) en het Nederlandse spellingsalfabet (Anton, Bernard, …) als reeks naast de NAVO.
