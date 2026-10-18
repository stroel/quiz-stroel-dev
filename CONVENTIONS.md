# Conventies

Codestijl, naamgeving, bestandsindeling en patronen die in alle Stroel-projecten gelden. Een projectrepo mag hier iets aan toevoegen, maar spreekt dit nooit tegen zonder een expliciete beslissing.

> **Taalregel:** **markdown-documentatie is Nederlands** — `README.md`, `CLAUDE.md`, `CONVENTIONS.md`, `STYLEGUIDE.md`, alles onder `docs/`, elke `CHANGELOG.md`. **Code, identifiers en commentaar in de code zijn Engels**, en dat geldt ook voor het commentaar binnen de codevoorbeelden in deze documenten. **De UI-taal is een keuze per project** en staat in zijn `CLAUDE.md`: alles wat een gebruiker leest — UI-teksten, foutmeldingen in API-responses, e-mails, de 404 — volgt die ene taal. Standaard is dat Nederlands (klantensites, vvk, timetracker, prono); Engels waar het product dat vraagt (status.stroel.dev, remap.stroel.dev, tools.stroel.dev). Beslist op 14 september 2026: de regel zei tot dan 'altijd Nederlands' terwijl drie apps al bewust Engels waren, en een regel die drie projecten tegenspreken, stuurt een audit de verkeerde kant op. **Een prompt is geen documentatie:** een `*.prompt.md`, een system-prompt in `config/`, of een markdownbestand of -blok dat aan een model doorgegeven wordt — door een programma of door een mens die het plakt — blijft in de taal waarin het geschreven is. Dat is invoer, net als code, en het vertalen wijzigt wat het model teruggeeft. In een bestand dat beide bevat, vertaal je de documentatie eromheen en zeg je daar waarom de prompt blijft staan. De `name:` in de frontmatter van een skill is om dezelfde reden een identifier en geen proza. De **commit-subject-regel is Engels** en heeft geen projectuitzondering; zie hieronder.
>
> Deze regel geldt sinds 2026-08-08 voor alle Stroel-projecten. Ze stond tot 2026-09-12 omgekeerd in dit bestand (Engels als default), waardoor elke audit docs naar het Engels duwde in plaats van naar het Nederlands. De Engelse docs die dat opleverde, zijn op 2026-09-14 in elke repo vertaald. Kom je er toch nog een tegen, dan is dat een restant van die periode en geen precedent: vertaal het.
>
> **Package manager:** **alleen pnpm** — nooit `npm` of `yarn`. Gebruik `pnpm install`, `pnpm run <script>`, `pnpm dlx` (niet `npx`). Het lockfile is `pnpm-lock.yaml`; CI gebruikt `pnpm install --frozen-lockfile`.

## Kernprincipes

1. **Expliciet boven impliciet** — duidelijke code boven slimme code
2. **Typeveiligheid eerst** — TypeScript strict mode, geen `any` zonder commentaar
3. **Voorspelbare structuur** — dezelfde patronen op vergelijkbare plekken
4. **Documentatie als code** — commentaar legt het waarom uit, JSDoc voor publieke API's
5. **Geen verrassingen** — functienamen dekken het gedrag, geen neveneffecten in getters

## TypeScript

### Strict mode

De `tsconfig.json` van elk project erft van `astro/tsconfigs/strict` en zet daar de strengere vlaggen hieronder bovenop:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Geen `any` zonder commentaar

```typescript
// ✗ Bad
function process(data: any) { ... }

// ✓ Good (with explicit reason)
// Third-party API returns dynamic shape; runtime-validated below
function process(data: any) {
  if (!isValidShape(data)) throw new Error('Invalid');
  // ...
}

// ✓ Better
function process(data: unknown) {
  if (!isValidShape(data)) throw new Error('Invalid');
  // narrowed to specific type after isValidShape
}
```

### Named exports verdienen de voorkeur

```typescript
// ✗ Bad (for utilities)
export default function magicLink() { ... }

// ✓ Good
export function generateMagicLink() { ... }
export function verifyMagicLink() { ... }
```

Uitzonderingen waar een default export wél mag:

- Astro/React-componenten
- Configuratiebestanden
- Module-entrypoints (`index.ts` mag met een default re-exporteren als dat nodig is)

### Type of interface

```typescript
// Use interface for object shapes that may be extended
interface User {
  id: number;
  email: string;
}

// Use type for unions, intersections, primitives, function signatures
type Status = 'active' | 'inactive' | 'suspended';
type UserWithRole = User & { role: Role };
type Handler = (req: Request) => Promise<Response>;
```

### Async/await in plaats van .then()

```typescript
// ✗ Bad
function getUser(id: number) {
  return db.findOne('users', { id })
    .then(user => fetchProfile(user.id))
    .then(profile => ({ ...user, profile }));
}

// ✓ Good
async function getUser(id: number) {
  const user = await db.findOne('users', { id });
  const profile = await fetchProfile(user.id);
  return { ...user, profile };
}
```

### Foutbehandeling

```typescript
// ✗ Bad (silent swallow)
try {
  await sendEmail(opts);
} catch (e) {
  // ignored
}

// ✗ Bad (logging only, no decision)
try {
  await sendEmail(opts);
} catch (e) {
  console.error(e);
}

// ✓ Good (explicit decision)
try {
  await sendEmail(opts);
} catch (e) {
  // Email is non-critical for save flow; log and continue
  logger.warn('Failed to send notification email', { error: e, formId: form.id });
}

// ✓ Good (re-throw with context)
try {
  await db.execute(query);
} catch (e) {
  throw new Error(`Database query failed: ${query}`, { cause: e });
}
```

- Elke async-operatie heeft een try/catch waar de fout herstelbaar is.
- Fouten die de request moeten laten crashen: gooien en laten bubbelen.
- Slik fouten nooit stil in.

### Omgaan met null

```typescript
// Use undefined for "not set", null for "explicitly empty"
interface Entry {
  title: string;
  cover_image?: string;      // undefined: not set
  excerpt: string | null;    // null: explicitly cleared
}

// Nullish coalescing
const name = user.name ?? 'Anonymous';

// Optional chaining
const email = user?.profile?.email;
```

## Naamgeving

### Bestanden

- **kebab-case** voor alle bestanden: `media-picker.tsx`, `content-type.ts`, `auth-middleware.ts`
- **PascalCase** voor Astro/React-componentbestanden wanneer het component de default export is: `MediaPicker.astro`, `Header.astro`
- **kleine letters** voor indexbestanden: `index.ts`

```
src/
├── content-types/
│   ├── blog-post.ts          # exports blogPostType
│   └── faq-item.ts
├── widgets/
│   ├── featured-gallery/
│   │   ├── definition.ts     # widget definition
│   │   └── FeaturedGallery.astro
│   └── index.ts              # re-exports widgets
└── components/
    ├── Header.astro
    └── Footer.astro
```

### Functies

- **camelCase**, werkwoord eerst: `getUserById`, `validateEmail`, `renderEntry`
- Functies die een boolean teruggeven: `is*`, `has*`, `can*`: `isAuthenticated`, `hasPermission`, `canEdit`
- Async-functies: geen speciale prefix (alleen `async`)

### Variabelen

- **camelCase**: `currentUser`, `mediaItem`
- Boolean-variabelen: `is*`, `has*`: `isActive`, `hasErrors`
- Vermijd afkortingen: `userIdentifier`, niet `userIdent`

### Constanten

- **SCREAMING_SNAKE_CASE** voor echte constanten: `MAX_FILE_SIZE`, `DEFAULT_LANGUAGE`
- **camelCase** voor afgeleide constanten: `defaultLanguage = settings.languages[0]`

### Types

- **PascalCase**: `User`, `ContentType`, `MediaItem`
- Geef interfaces alleen een prefix wanneer dat nodig is om ze te onderscheiden
- Generieke typeparameters: één letter (`T`, `K`, `V`) of omschrijvend (`TEntry`, `TParams`)

### Database (D1 / SQL)

- **Tabellen**: snake_case, meervoud: `users`, `media_items`, `form_submissions`
- **Kolommen**: snake_case: `created_at`, `parent_id`, `file_size`
- **Indexen**: `idx_<table>_<columns>`: `idx_users_email`, `idx_pages_status_publish_at`
- **Foreign keys**: expliciete constraint-namen: `fk_pages_parent`

## Imports

- Gebruik de `@scope/*`-namespace van je project voor package-imports (Stroel-packages gebruiken `@stroel/*`).
- Binnen een package: relatieve imports voor bestanden dichtbij, package-absoluut tussen modules.
- Geen circulaire imports.

### Sorteer en groepeer met blanco regels

```typescript
// External packages
import { defineConfig } from 'astro/config';
import { z } from 'zod';

// Internal packages (@scope/*)
import { db, env } from '@stroel/cms-core';

// Relative imports
import { resolveSlug } from '../utils';
import { Entry } from '../types';

// Type-only imports
import type { Request, Response } from '@cloudflare/workers-types';

// Styles
import './styles.css';
```

### Geen circulaire imports

Importeert A B en B A: refactor. De gebruikelijke oplossing — trek de gedeelde types naar een derde module die van geen van beide importeert:

```typescript
// types.ts (no imports from a or b)
export interface SharedType { ... }

// a.ts / b.ts both import from ./types
```

## Bestandsindeling (binnen één bestand)

De volgorde:

1. Imports (gesorteerd: extern, intern, types, styles)
2. Type- en interfacedeclaraties
3. Constanten
4. Hulpfuncties (niet geëxporteerd)
5. De exports
6. Default export (als die er is)

```typescript
import { z } from 'zod';
import type { User, Role } from './types';

interface CreateUserInput { ... }

const DEFAULT_ROLE = 'editor';

function hashEmail(email: string): string { ... }

export async function createUser(input: CreateUserInput): Promise<User> { ... }
export async function updateUser(id: number, patch: Partial<User>): Promise<User> { ... }
```

## Commentaar

### Leg het waarom uit, niet het wat

```typescript
// ✗ Bad
// Increment counter
counter++;

// ✓ Good
// Bump version to invalidate edge cache (URL-based purge)
counter++;
```

### TODO-formaat — altijd met naam en datum

```typescript
// TODO(steve, 2026-01-15): refactor to use new media API once Cloudflare ships it
// FIXME(steve, 2026-01-20): rate limit doesn't reset on Worker restart
// HACK(steve, 2026-02-01): workaround for D1 bug #1234, remove when fixed
```

### JSDoc voor publieke API's

Voor geëxporteerde functies in shared packages:

```typescript
/**
 * Generate a magic link for the given user email.
 *
 * Creates a single-use token stored in KV with 15-minute TTL.
 *
 * @param email - User's email address
 * @param env - Worker environment (KV, secrets)
 * @returns Magic link URL
 * @throws {UserNotFoundError} if email is not registered
 */
export async function generateMagicLink(email: string, env: Env): Promise<string> {
  // ...
}
```

### Geen HTML-commentaar in markup

Schrijf nooit `<!-- … -->` in `.astro`, `.html` of welke andere markup ook. Een HTML-commentaar wordt naar elke bezoeker verstuurd. Zet de uitleg waar ze in de bron blijft: in de frontmatter van het component, of als `//`-commentaar binnen het `<script>` dat ze beschrijft.

✗ Slecht — het commentaar gaat mee naar de browser:

```astro
<!-- Set theme before paint to avoid a flash -->
<script is:inline>
  document.documentElement.classList.toggle('dark', prefersDark);
</script>
```

✓ Goed — het commentaar blijft in de bron:

```astro
<script is:inline>
  // Set theme before paint to avoid a flash
  document.documentElement.classList.toggle('dark', prefersDark);
</script>
```

De build haalt commentaar uit prerendered pagina's toch al weg (zie "Gepubliceerde output is geminificeerd"), maar HTML die een serverroute op aanvraag rendert wordt niet nabewerkt — de regel geldt dus voor de bron, niet alleen voor de output.

### Laat geen uitgecommentarieerde code staan

Verwijder ze. Git onthoudt alles. Twijfel je, commit de verwijdering apart, dan is ze makkelijk terug te vinden in de historie.

## Patronen

Dit zijn principes. De concrete helpers (een `db`-object, een `logger`, response-helpers, getypeerde error-classes) komen uit het core-package van elk project — gebruik die in plaats van ze opnieuw te verzinnen.

### Databasetoegang

Gebruik een query-abstractie in businesslogica, geen ruwe SQL-strings:

```typescript
// ✗ Bad
const result = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

// ✓ Good
const user = await db.findOne('users', { email });
```

Ruwe SQL alleen in: migratiebestanden, performancekritieke custom queries, FTS5-zoekqueries.

### Rechten — controleer server-side

Controleer altijd op het niveau van de route handler. Vertrouw de frontend nooit; check altijd opnieuw op de server.

```typescript
export async function POST(context) {
  const session = await requireSession(context);
  await requirePermission(session.user, 'pages.all.edit');
  // ... actual work
}
```

### Hardcode nooit teksten die een gebruiker leest

```typescript
// ✗ Bad
return new Response('Geen rechten', { status: 403 });

// ✓ Good
return new Response(await t('errors.permission_denied', language), { status: 403 });
```

### Geen JavaScript van derden at runtime

Niets wat de browser uitvoert komt van een host die wij niet beheren.

```html
<!-- ✗ Bad -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- ✓ Good — written in-house, or a bundled dependency from package.json -->
<script type="module" src="/scripts/slideshow.js"></script>
```

- **Nooit `<script src="https://…">`.** Geen jsDelivr, geen unpkg, geen cdnjs, geen Google.
- **Schrijf het liever zelf.** Een slideshow, een lightbox, een tabstrip, een dropdown zijn
  enkele tientallen regels moderne DOM-code. Grijp naar een dependency wanneer het probleem
  echt moeilijk is (een rich-text editor, een drag-and-drop-engine), niet wanneer het alleen
  wat priegelwerk is.
- **Is een dependency wél juist, dan staat ze in `package.json`** en wordt ze gebundeld —
  geversioneerd, in het lockfile, auditbaar en meegenomen door de nightly update-workflow.
  Er een toevoegen is een beslissing voor Steve.
- **De markup werkt vóór het script draait.** Progressive enhancement is de default: een
  carousel is eerst een scroll-snap-strip, een lightbox-thumbnail is eerst een gewone link.

**Waarom.** Het is een derde partij in het request-pad van elke bezoeker, die bij het laden van de pagina hun IP krijgt — een verwerker waar niemand voor getekend heeft. Het is een gat in de toeleveringsketen: een versietag verwijst naar wat ze vandaag aanwijst, en een gecompromitteerd CDN-account draait willekeurige code, ook op pagina's achter een login. Het is een extra origin in elke `script-src`, en dat is precies wat verhindert dat een Content-Security-Policy dichtgezet kan worden. En het kost een connectie in het kritieke pad, naar een host zonder voordeel van een gedeelde cache sinds browsers die van elkaar gescheiden hebben.

Let op: externe origins weghalen is nodig maar niet genoeg voor CSP: inline scripts hebben nog altijd een nonce per request of hashes nodig voordat `script-src 'self'` gezet kan worden.

### Gestructureerd loggen

```typescript
// ✗ Bad
console.log('User logged in: ' + user.email);

// ✓ Good
logger.info('User logged in', { userId: user.id, email: user.email });
```

### Getypeerde fouten met context

```typescript
export class NotFoundError extends Error {
  constructor(public resource: string, public id: string | number) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

if (!user) throw new NotFoundError('User', userId);
```

## Componentconventies (Astro / React)

### Props-interface — declareer die altijd

```astro
---
interface Props {
  title: string;
  description?: string;
  className?: string;
}

const { title, description, className } = Astro.props;
---

<div class={className}>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
</div>
```

### Slots boven een berg props

```astro
---
// ✓ Good
interface Props {
  title: string;
}
---

<article>
  <h2>{title}</h2>
  <slot name="heading" />
  <slot />                <!-- default slot for body -->
  <slot name="footer" />
</article>
```

### React-componenten: volgorde van de hooks

```tsx
function MediaPicker(props: Props) {
  // 1. State
  const [folder, setFolder] = useState<string>('/');
  // 2. Refs
  const inputRef = useRef<HTMLInputElement>(null);
  // 3. Derived state
  const items = useMemo(() => filterItems(allItems, folder), [allItems, folder]);
  // 4. Effects
  useEffect(() => { loadFolder(folder); }, [folder]);
  // 5. Callbacks
  const handleUpload = useCallback((file: File) => { /* ... */ }, []);
  // 6. Render
  return <div>...</div>;
}
```

## Styling (Tailwind)

We gebruiken Tailwind v4. De configuratie staat in CSS via `@theme {}` — er is geen `tailwind.config.js`.

**Gebruik ALTIJD Tailwind-classes. NOOIT inline styles** — een harde regel, voor zowel Astro-templates als React-componenten. Voor je `style={{}}` schrijft: is deze waarde echt at runtime berekend? Zo niet, dan moet het een Tailwind-class zijn.

```tsx
// ✗ Bad — no inline styles for static values
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>

// ✓ Good
<div className="flex items-start gap-3">

// ✓ Acceptable inline style (genuinely runtime-computed values only)
<div style={{ left: `${focalX * 100}%`, top: `${focalY * 100}%` }}>  // mouse position
<div style={{ backgroundColor: preset.color }}>                       // value from data/config
```

- Gebruik `slate-*` als neutraal palet voor alle interne/admin-tooling; nooit `gray-*`. (Publieke thema's per klant zijn hiervan vrijgesteld — die mogen elk palet gebruiken.)
- Voor herhaalde className-strings in React: definieer een `CLS`-constante-object in plaats van een style-object.
- Gebruik `hover:`-classes, geen `onMouseEnter`/`onMouseLeave`-handlers.
- Voor complexe conditionele classes: gebruik `clsx`.

Zie `STYLEGUIDE.md` voor het volledige designsysteem.

### Een layout-skill heeft `check:layout`

Een project dat een layout-skill draagt (`dtpstudio-design`, `devisschere-design`, `stroel-ledger`,
`stroel-timetracker`, `stroel-cms-admin`, …) heeft in zijn `package.json` het script
`check:layout`, dat de check van die skill draait met de argumenten van dit project:

```json
{ "check:layout": "node .claude/skills/dtpstudio-design/scripts/check-dtpstudio.mjs apps/web" }
```

Altijd onder die naam (beslissing van Steve, 11 oktober 2026): de mod `layout-check` zoekt
het dichtstbijzijnde `package.json` met `check:layout` en draait het na elke bewerking van
een schermbestand. Staat er boven het bestand geen, dan neemt hij het enige `package.json` in
de repo dat er wel een heeft (CloudPiling houdt zijn front-endtooling in `src/static/2026`,
naast de templates in plaats van erboven); zijn het er twee of meer, dan draait er niets.
Hoe elke check heet en welke argumenten hij wil, hoort bij het project, niet bij de mod. De
check meldt `bestand:regel  regel  uitleg` en eindigt met exit 1 bij een melding, exit 0
zonder; een check die zelf mislukt eindigt met 2 of hoger.

**Een baseline houdt de layout van vandaag intact.** Een check die bij zijn invoering
afwijkingen vindt die zichtbaar zijn, ruimt ze niet op: de layout zoals ze vandaag op het scherm
staat, blijft tot op de pixel dezelfde (Steve, 11 oktober 2026, met nadruk voor CloudPiling en
tuinposter.nl). `--baseline` schrijft de hits van dat moment naar `layout-baseline.json` naast
het `package.json`, per bestand en regel de tekst van de coderegel (geen regelnummer, zodat
een wijziging elders de lijst niet breekt). Daarna meldt de check alleen wat er niet in staat:
nieuwe drift, of een bekende regel die bewerkt werd. Opruimen mag later, en alleen wat niets
verandert aan wat je ziet — een ruwe waarde naar het token met exact dezelfde waarde, met de
gebouwde CSS voor en na byte voor byte gelijk als bewijs. Wat zo verdwijnt, haalt een nieuwe
`--baseline` uit de lijst. Draai `--baseline` nooit om nieuwe drift te laten passeren.

## Gepubliceerde output is geminificeerd

Alles wat een bezoeker downloadt is zo klein als het kan: geen commentaar, geen indentatie, geen leesbare-maar-onnodige bytes. De bron blijft leesbaar; de build doet het krimpwerk.

Voor Astro-apps zijn dat drie lagen, alle drie verplicht:

1. **Astro's `compressHTML`** (staat standaard aan, laat dat zo) haalt de witruimte uit de templates.
2. **Vite** minifyt de gebundelde JS en CSS (standaard aan bij `astro build`).
3. **`src/integrations/minify-output.ts`** (de gedeelde `assets/minify-output.ts`) draait na de build en dekt wat de eerste twee laten liggen: elke prerendered `.html` gaat door `@swc/html` — alle HTML-commentaar eruit, `is:inline`-scripts, `<style>`-blokken en JSON-LD geminifyt — en uit de CSS-bestanden verdwijnt het `/*! … */`-licentiecommentaar (zoals de Tailwind-banner).

De regels die de derde laag veilig houden:

- **Ze mag het gedrag nooit wijzigen.** Attributen, hun volgorde en de volgorde van classes blijven zoals ze geschreven zijn. Bestanden onder `/_astro/` houden hun content-hash in de naam en worden `immutable` gecacht, dus een herschrijving daar moet onzichtbaar zijn voor de browser — een commentaar weglaten is dat, iets anders niet. Dat geldt ook voor de aanhalingstekens rond attribuutwaarden (`quotes: true`): ze weglaten is geldige HTML5 en een echte parser leest `type=application/ld+json` onveranderd terug, maar de checkers die HTML scannen in plaats van parsen matchen er niet meer op — en zo verliest een pagina haar JSON-LD `Person` in een structured-data-audit zonder dat er iets in de bron wijzigde. Het levert ook niets op: ongequoteerd comprimeert slechter, dus over de lijn is brotli kleiner mét de aanhalingstekens.
- **Aangrenzende inline scripts worden samengevoegd tot één**, dus een exception in het ene stopt het volgende. Elk `is:inline`-script mag niet gooien: zet `localStorage` en vergelijkbare toegang die kan mislukken in een `try`.
- **HTML-parsefouten laten de build falen** in plaats van de best mogelijke gok van de minifier te publiceren.
- **Ze draait alleen bij de build.** `astro dev` raakt ze nooit aan, en HTML die een serverroute op aanvraag rendert wordt nooit aangeraakt — vandaar de regel [geen HTML-commentaar](#geen-html-commentaar-in-markup) op bronniveau.

Workers zonder Astro leveren geen HTML-templates; de minificatie van hun bundler is genoeg.

## Standaard projectassets

Elk project komt met deze basisassets.

### Favicon

Het gedeelde Stroel-favicon is de default voor elk project:

```html
<link rel="icon" type="image/svg+xml" href="https://stroel.dev/favicon.svg" />
```

Een project **mag** dat overschrijven met een eigen favicon (de STROEL CMS gebruikt bijvoorbeeld het favicon van het actieve klantthema), maar moet **terugvallen** op het gedeelde exemplaar wanneer er geen project- of themafavicon ingesteld is.

### 404-pagina

Elk project heeft een eigen 404-pagina — lever nooit die van Astro. Houd ze minimaal: logo, een korte boodschap en een knop terug naar de homepage. De gedeelde pagina daarvoor is `assets/404.astro` (zie `README.md` → "De gedeelde 404-pagina").

**De 404 spreekt de taal van de UI van het project** (beslissing van Steve, 14 september 2026): Nederlands in een project met een Nederlandse UI (`vvk-shake`, `vvk-opstelling`, de sites op de STROEL CMS), Engels in een project met een Engelse UI (`status`, `remap`, `tools`). De gedeelde `assets/404.astro` is Engels; een project met een Nederlandse UI vertaalt de teksten ervan — `<title>`, kop, zin, knop, `aria-label` en `alt` — en zet `lang="nl"` op `<html>`. De reden: een 404 is UI-copy die een bezoeker midden in het product te zien krijgt, en een foutpagina in een andere taal dan de app leest als een pagina van een andere site. Tot die datum luidde de regel "altijd Engels" (2026-06), en die wrong met de taalregel bovenaan dit bestand.

## CI & hosting

- **GitHub + GitHub Actions** voor alles — repo's, CI, deploys. CI-credentials zijn GitHub Actions-secrets; de default branch is `main`.
- Deploys gaan naar **Cloudflare Workers** (Static Assets voor statische sites) via `wrangler deploy` uit een GitHub Actions-workflow.
- **Node 24** is de huisversie, overal waar een versie genoemd wordt: `node-version` in elke workflow, `.nvmrc`, `engines` en de major van `@types/node` (beslissing van Steve, 14 september 2026). De reden: 24 is de actieve LTS, en 22 staat in onderhoud tot april 2027 — een project dat nu nog op 22 start, moet binnen het jaar opnieuw overstappen.

### Het Cloudflare-account ligt vast

Steve werkt in meerdere Cloudflare-accounts (STROEL, dtp-studio, bloovi, bibliotrek). Een
project legt zijn account daarom vast met de environment variable `CLOUDFLARE_ACCOUNT_ID`,
lokaal in de `.env` (gitignored), in CI als repository-secret. Zonder kiest wrangler het
account van de login, en een deploy die in het verkeerde account landt, valt pas op als de
site ontbreekt.

- **De variabele, niet `account_id`.** Draagt de login meer dan één account, dan kiest
  wrangler er per commando één, en `account_id` in de wrangler-config beslecht dat niet:
  `d1 migrations apply --remote` antwoordde er nog `7403 – account not authorized` mee
  (status.stroel.dev en remap, september 2026). `account_id` mag in de config blijven staan;
  dan moet het met de variabele overeenkomen.
- **De `.env` van de map waar wrangler draait.** Wrangler leest `.env` alleen uit zijn
  werkmap, niet uit de map van de config (nagemeten op 11 oktober 2026, wrangler 4). In een
  monorepo staat de variabele dus in de root (voor scripts met `--config apps/…`) én in elke
  app-map waar `pnpm -r run deploy` wrangler start. Een script dat het account inline zet
  (`CLOUDFLARE_ACCOUNT_ID=… wrangler …`) of een `.env` sourcet, telt ook.
- **Het project noemt zijn account.** Zet het in de README bij het eenmalig opzetten. Noemt de
  `CLAUDE.md` het (``Cloudflare-account `<id>` ``), dan moeten variabele en config daarmee
  overeenkomen.

De mod `cloudflare-guard` weigert elke wrangler-schrijfactie die hier niet aan voldoet
(beslissing van Steve, 11 oktober 2026). Een repo die `.env` niet in zijn `.gitignore` heeft,
krijgt die regel eerst.

### Een typecheck die niet kan laden, faalt luid

**`astro check` eindigt met exit 0 als `@astrojs/check` niet kan laden.** Astro importeert het package in een `try`, en elke fout daarbij — ook een crash *in* het package — leest het als "niet geïnstalleerd". Buiten CI biedt het dan aan om het te installeren; in CI logt het `The @astrojs/check and typescript packages are required` en geeft het geen exitcode mee (`return;` in `astro/dist/cli/check/index.js`). De Typecheck-stap is dan groen en heeft niets gecontroleerd. Zo liep het van eind juli tot 24 september 2026 in vijf repo's (stroel.dev, tools, prono, timetracker, stroel-cms-client) zonder dat iemand het zag.

Daarom importeert het `typecheck`-script `@astrojs/check` eerst zelf, en stopt het met exit 1 als dat faalt:

```json
"typecheck": "node -e \"import('@astrojs/check').catch((error) => { console.error('@astrojs/check failed to load, so astro check would skip silently and exit 0:', error); process.exit(1); })\" && astro check"
```

Draait er eerst `wrangler types`, dan komt de guard daartussen (`wrangler types && node -e … && astro check`). In een monorepo staat hij in het `typecheck`-script van de Astro-app (`apps/web`, `apps/console`). `CI=true` alleen helpt niet: dat schakelt enkel het installatieaanbod uit. Een echte check eindigt in de log op `Result (N files):` met het aantal fouten; zie je die regel niet, dan is er niet gecontroleerd.

### `@emnapi/core` en `@emnapi/runtime` blijven op dezelfde major

Elke Astro-repo met `@astrojs/check` heeft deze override — in `package.json` → `pnpm.overrides`, of in het `overrides`-blok van `pnpm-workspace.yaml` als de repo zijn overrides daar houdt:

```yaml
overrides:
  '@emnapi/core': ^1.11.3
  '@emnapi/runtime': ^1.11.3
```

**Waarom.** `@astrojs/astro2tsx` (onder `@astrojs/check` → `@astrojs/language-server`) pint `@emnapi/core` op 1.x, maar krijgt `@emnapi/runtime` via de peer-range van `@napi-rs/wasm-runtime`. Die range liet ook 2.0-prereleases toe — `@napi-rs/wasm-runtime` 1.2.0 vroeg zelfs *alleen* `^2.0.0-alpha.3` — en pnpm installeert ontbrekende peers automatisch. Zo kwam `@emnapi/runtime@2.0.0-alpha.3` eind juli 2026 via een nachtelijke `pnpm update` in de lockfiles, naast `@emnapi/core@1.11.3`. Die twee spreken een andere interne API (`this.bridge.setLastError is not a function`), `@astrojs/check` crasht bij het laden, en `astro check` slaat de controle stil over (zie hierboven).

**Waarom de nightly het niet zelf rechtzet.** Een peer die al in het lockfile staat, houdt pnpm vast: ook nadat `@napi-rs/wasm-runtime` 1.2.4 de range verbreedde naar `^1.7.1 || ^2.0.0-alpha.4` — waar alpha.3 niet eens in past — liet elke `pnpm update -r` hem staan. Om dezelfde reden doet een override alleen niets aan een lockfile dat de alpha al heeft: pnpm meldt `unmet peer @emnapi/runtime@^1.11.3: found 2.0.0-alpha.3` en installeert gewoon de alpha. Ook `pnpm update '@emnapi/*'`, `pnpm dedupe` en `pnpm install --fix-lockfile` laten hem staan. Wat wel werkt: de blokken `'@emnapi/core@2…'`, `'@emnapi/runtime@2…'` en `'@emnapi/wasi-threads@2…'` uit `pnpm-lock.yaml` halen (in `packages:` én `snapshots:`) en `pnpm install` draaien; pnpm lost ze dan opnieuw op, nu binnen de override. Een eerdere poging meldde dat `pnpm install` "bleef hangen" na het toevoegen van de override; dat is op 2026-09-24 niet te reproduceren (pnpm 10.33.0, met en zonder bestaande `node_modules`, met een open stdin): de install is in twee seconden klaar — alleen met de alpha er nog in. Hangt hij toch, dan is het geen resolutielus; kijk of pnpm op een vraag wacht en draai het na `rm -rf node_modules`.

**Waarom ook in de repo's die de alpha nooit hadden.** Een verse resolutie kiest vandaag 1.11.3, want dat is de `latest`-tag. Maar zodra `@emnapi/runtime` 2.0.0 stabiel uitkomt, past die in de peer-range van `@napi-rs/wasm-runtime` en kan de nightly hem binnenhalen terwijl `astro2tsx` `@emnapi/core` nog op 1.x pint — dezelfde crash, nu met een stabiele versie. De override houdt beide op dezelfde major, en `pnpm update` blijft binnen `^1.11.3`.

**Wanneer ze weg mag (of mee moet).** Zodra `@astrojs/astro2tsx` `@emnapi/core` 2.x pint, moet de override mee naar `^2` — anders forceert ze de oude major op een package dat de nieuwe verwacht. De guard hierboven maakt dat luid: faalt de Typecheck-stap met `failed to load`, kijk dan eerst hier. Weg mag ze pas als `astro2tsx` `@emnapi/runtime` zelf als dependency meebrengt in plaats van het aan een peer-range over te laten; controleer met `pnpm why @emnapi/runtime` dat er dan maar één major in de boom zit.

### Alleen `astro dev` gebruikt de standaardcache van Vite

Elk Astro-project met de Cloudflare-adapter zet dit in `astro.config.mjs`:

```js
const isDev = process.argv.includes('dev');

export default defineConfig({
  vite: {
    // `astro check` re-runs the SSR dep optimizer and would overwrite a running dev server's cache.
    cacheDir: isDev ? 'node_modules/.vite' : 'node_modules/.vite-tooling',
  },
});
```

**Waarom (27 september 2026).** `pnpm typecheck` draait `astro check`, en dat laadt de Astro-config met de adapter en bundelt de SSR-dependencies opnieuw voor. Het vindt er geen en schrijft een lege `node_modules/.vite/deps_ssr` (`"optimized": {}`). Draait er op dat moment een `astro dev`, dan vraagt die bij het volgende request een chunk die niet meer bestaat en geeft hij een 500: *"The file does not exist at …/deps_ssr/…"*. Herstarten met `--force` helpte tot de volgende typecheck. Nagemeten op `stroel-cms-client` en `prono.stroel.dev`: met draaiende dev-server bevatte `deps_ssr` 149 en 127 modules, na `astro check` 0. Lint, tests, `astro build` en `wrangler types` raken de cache niet. Met een eigen cache voor alles behalve `astro dev` blijft de dev-server heel, ook als een agent of een terminal ernaast een typecheck draait.

**Wat het niet is.** De `vite.optimizeDeps.include`-lijsten die sommige projecten hebben (voor `astro/logger/console` of de subpaden van `@stroel/cms-core`) voorkomen een heroptimalisatie op een koude cache. Die blijven nuttig, maar ze beschermen niet tegen deze fout: een typecheck overschrijft de cache hoe dan ook.

## Git

### Commit-messages — Conventional Commits

```
feat(forms): add conditional field visibility
fix(media): handle empty alt text in image picker
chore: bump dependency to 1.2.0
docs: update README with new install steps
refactor(auth): extract magic link generation
test(forms): add validation test cases
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`. Scope optioneel, kleine letters.

**Altijd Engels.** Dit is het ene deel van de taalregel hierboven dat geen
projectuitzondering kent: ook in een repo waarvan de docs, UI-teksten en
commentaar Nederlands zijn, is de commit-subject Engels. Een `git log` leest in
elke repo hetzelfde; de documentatie is van het project, de historie is van
iedereen die ze ooit doorzoekt.

**Alleen de subject-regel — geen commit-body.** Een commit-body wordt één keer
geschreven en daarna nooit meer onderhouden. Alles wat uitleg vraagt gaat naar
een markdownbestand in de repo (`README.md`, `CLAUDE.md`, `docs/`) als deel van
dezelfde commit, waar het actueel blijft en gevonden wordt zonder in `git log`
te moeten graven.

**Geen trailers.** Geen `Co-Authored-By`, geen sessielink, geen "Generated with". De mod
`commit-guard` weigert een commit die een van deze regels breekt; dat Engels is, controleert
hij met een woordenlijst, dus een Nederlands subject vangt hij meestal maar niet altijd.

### Branchnamen

- `main` — productie
- `staging` — staging-omgeving (indien gebruikt)
- `feature/<korte-omschrijving>`, `fix/<korte-omschrijving>`, `chore/<korte-omschrijving>`

### PR/MR-omschrijving

```markdown
## Wat
Korte omschrijving van de wijzigingen.

## Waarom
De reden voor de wijziging.

## Hoe
De technische aanpak (als die niet evident is).

## Getest
Hoe is dit getest?

## Screenshots / video
(bij UI-wijzigingen)
```

## Versionering (monorepo-packages)

Projecten die packages publiceren gebruiken [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset   # pick packages, pick bump type, describe change
```

Op `main` draait CI `pnpm changeset version` (verhoogt de versies, werkt elke `CHANGELOG.md` bij, ruimt de changeset-entries op); nakijken + mergen, dan `pnpm changeset publish`.

- **Patch** (`1.2.3 → 1.2.4`): bugfixes, geen API-wijzigingen
- **Minor** (`1.2.3 → 1.3.0`): nieuwe functionaliteit, achterwaarts compatibel
- **Major** (`1.2.3 → 2.0.0`): breaking changes

## Onderhoud van de documentatie

Werk het betrokken document bij wanneer: een architectuurbeslissing wijzigt, er een nieuw patroon bijkomt, de publieke API verandert, er een nieuwe omgevingsvariabele nodig is, of de upgrade-/migratiestappen wijzigen.

- Markdown, koppenhiërarchie `#` → `##` → `###`
- Codeblokken met een taaltag
- Tabellen voor gestructureerde vergelijkingen; voorbeelden bij niet-evidente patronen
- Botsen de docs en de code: **de code is de werkelijkheid** — werk de docs bij en meld de discrepantie.

### PLAN.md is tijdelijk

De werkwijze is: een feature of project plannen met Opus, en het daarna met Opus in dezelfde sessie uitvoeren → **verwijder het plan zodra het gebouwd is**. (Tot 2026-08-05 werd het plan aan Sonnet doorgegeven om uit te voeren; die splitsing is weg — wie het plan schrijft, voert het ook uit, en is verantwoordelijk om het te herzien wanneer het verkeerd blijkt.) Een `PLAN.md` (of vergelijkbare spec) is een artefact van het bouwen, geen duurzaam document — de git-historie bewaart het. De **`README.md` is de enige bron van projectinformatie** (wat het is, opzetten, bouwen, deployen). Laat uitgevoerde `PLAN.md`-bestanden niet rondslingeren; vouw wat nog nuttig is in de README.

## Slotprincipes

- **Optimaliseer voor duidelijkheid, niet voor slimheid**
- **Twijfel je, schrijf meer types**
- **Toevoegen gaat voor refactoren**
- **Tests waar ze helpen, niet overal**
- **Lees de docs voor je codeert**
