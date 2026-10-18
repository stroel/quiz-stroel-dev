# quiz.stroel.dev

Een persoonlijke quiz-app om wist-je-datjes te oefenen, gemaakt voor de telefoon. De
startpagina laat je een quiz kiezen:

- **Vlaggen** (`/vlaggen/`): je krijgt een vlag te zien en tikt het land. Typfouten en spelling op
  het gehoor worden aanvaard. Er zijn hints met een masker en losse letters, en een eindscherm
  zonder punten. Zie [`docs/vlaggen.md`](docs/vlaggen.md).
- **Hoofdsteden** (`/hoofdsteden/`): je ziet een land en tikt de hoofdstad, of omgekeerd. Zie
  [`docs/hoofdsteden.md`](docs/hoofdsteden.md).
- **Landen** (`/landen/`): een land is ingekleurd op de kaart en je tikt de naam. Zie
  [`docs/landen.md`](docs/landen.md).
- **Aardrijkskunde** (`/aardrijkskunde/`): een zee, rivier of gebergte is aangeduid op de kaart en
  je tikt de naam. Zie [`docs/aardrijkskunde.md`](docs/aardrijkskunde.md).
- **Spreuken** (`/spreuken/`): wie zei het? Binnenkort.

Elke quiz heeft een **Overzicht** (`/vlaggen/overzicht/`, `/hoofdsteden/overzicht/`) met alle
vragen en antwoorden per regio, om door te scrollen.

Kaartdata: [Natural Earth](https://www.naturalearthdata.com) (publiek domein) en, voor de Belgische
rivieren, © [OpenStreetMap](https://www.openstreetmap.org/copyright)-bijdragers (ODbL).

Er is geen backend. Je instellingen en historiek staan in `localStorage` van het toestel.

## Stack

| Pakket | Versie | Rol |
|---|---|---|
| Astro | 7.4.0 | Statische site |
| @astrojs/react | 7.1.0 | Eilanden voor de quizzen |
| React | 19.3.1 | UI van de quizzen |
| Tailwind CSS | 4.3.3 | Styling |
| flag-icons | 7.6.0 | Vlaggen als SVG |
| d3-geo | 3.1.1 | Projectie en tekenen van de kaart |
| topojson-client | 3.1.0 | Kaartdata uitpakken |
| world-atlas | 2.0.2 | Landgrenzen (Natural Earth 1:50m) |
| wrangler | 4.151.1 | Deploy naar Cloudflare |

## Lokaal draaien

```bash
pnpm install
pnpm dev
```

Bij elke start kopieert `src/integrations/flag-assets.ts` de gebruikte vlaggen naar
`public/flags/`. Die map wordt gegenereerd en staat niet in git.

## Commando's

| Commando | Wat |
|---|---|
| `pnpm dev` | Dev-server |
| `pnpm build` | Statische build naar `dist/` |
| `pnpm preview` | `dist/` lokaal serveren via wrangler |
| `pnpm run deploy` | Bouwen en deployen naar Cloudflare |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `astro check` |
| `pnpm format` | Prettier |

## Deployen

Het project draait als Worker met Static Assets op het STROEL-account (`wrangler.jsonc`), op
https://quiz.stroel.dev (custom domain, aangemaakt bij de eerste deploy op 18 oktober 2026).

- **Automatisch**: elke push naar `main` draait `.github/workflows/deploy.yml`: typecheck, build en
  `wrangler deploy` met de wrangler-versie uit `package.json`. Een typefout stopt de deploy. Een PR
  naar `main` krijgt dezelfde typecheck en build (`pr-check.yml`), zonder deploy.
- **Secrets** (Settings → Secrets and variables → Actions): `CLOUDFLARE_API_TOKEN` (een token met
  het recht om Workers te bewerken op het STROEL-account) en `CLOUDFLARE_ACCOUNT_ID`
  (`b9f47bdfd5561613df8a0f20d7795cff`).
- **Met de hand**: kopieer `.env.example` naar `.env` (die zet `CLOUDFLARE_ACCOUNT_ID`) en draai
  `pnpm run deploy`. Let op: `pnpm deploy` zonder `run` is een ingebouwd pnpm-commando dat iets
  anders doet.

## Nachtelijke dependency-update

`.github/workflows/nightly-dependency-update.yml` draait elke nacht om 04:00 UTC (en manueel via
**Run workflow**): `pnpm update` en `pnpm run format`, de [Stack](#stack)-tabel bijwerken met
`scripts/sync-readme-versions.mjs`, daarna `pnpm run typecheck` en `pnpm run build`. Breekt een
van beide, dan probeert Claude het te herstellen. Majors worden niet toegepast maar gemeld in de
PR-body (`scripts/check-major-updates.mjs`). Alles komt in één PR op
`chore/nightly-dependency-update`, die bijgewerkt wordt zolang ze openstaat.

De workflow is een kopie uit `stroel-claude-conventions` (`workflows/`), met twee aanpassingen:
de stap voor `GH_PACKAGES_TOKEN` is weg (geen private `@stroel/*`-packages) en
`show_full_output` is weg, omdat deze repo publiek is. Wat er per repo ingesteld moet worden, staat
in de README van `stroel-claude-conventions` onder _GitHub Actions-workflows_.
