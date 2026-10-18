# quiz.stroel.dev

Een persoonlijke quiz-app om wist-je-datjes te oefenen, gemaakt voor de telefoon. De
startpagina laat je een quiz kiezen:

- **Vlaggen** (`/vlaggen/`): je krijgt een vlag te zien en tikt het land. Typfouten en spelling op
  het gehoor worden aanvaard. Er zijn hints met een masker en losse letters, en een eindscherm
  zonder punten. Zie [`docs/vlaggen.md`](docs/vlaggen.md).
- **Landen** (`/landen/`): kaartquiz. Binnenkort.
- **Spreuken** (`/spreuken/`): wie zei het? Binnenkort.

Er is geen backend. Je instellingen en historiek staan in `localStorage` van het toestel.

## Stack

| Pakket | Versie | Rol |
|---|---|---|
| Astro | 7.4.0 | Statische site |
| @astrojs/react | 7.1.0 | Eilanden voor de quizzen |
| React | 19.3.1 | UI van de quizzen |
| Tailwind CSS | 4.3.3 | Styling |
| flag-icons | 7.6.0 | Vlaggen als SVG |
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
| `pnpm deploy` | Bouwen en deployen naar Cloudflare |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `astro check` |
| `pnpm format` | Prettier |

## Deployen

Het project draait als Worker met Static Assets op het STROEL-account (`wrangler.jsonc`). De
custom domain `quiz.stroel.dev` wordt bij de eerste deploy aangemaakt. Eenmalig:

1. Kopieer `.env.example` naar `.env`; die zet `CLOUDFLARE_ACCOUNT_ID`.
2. Draai `pnpm deploy`.
