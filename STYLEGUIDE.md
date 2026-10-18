# Designsysteem & stijlgids

Het huisdesignsysteem dat in de **interne/admin-UI's** van de Stroel-projecten gebruikt wordt. Neem het over in elk nieuw project als startpunt.

> **Scope:** dit is de conventie voor admin-tooling en interne apps. **Publieke thema's per klant zijn iets anders** — elke klantsite krijgt haar eigen thema en mag elk palet gebruiken. De `slate`-neutraal hieronder is de huisdefault voor interne UI, geen regel voor klant-frontends.
>
> De voorbeeldlabels in deze gids zijn vaak Nederlands (`Opslaan`, `Annuleren`, …), puur ter illustratie — ze weerspiegelen typische klantteksten, ze zijn geen vereiste.

---

## Stack

| Laag | Keuze | Opmerkingen |
|---|---|---|
| CSS-framework | **Tailwind CSS v4** | `@import "tailwindcss"` |
| Kleurenpalet | **Slate** als primaire neutraal | Rood/groen/blauw/amber als semantisch |
| Iconenset | **Lucide** (lucide.dev) | Één bron van waarheid: `icon-paths.ts` |
| Componentmodel | **Astro + React** | Astro voor serverpagina's, React voor interactieve islands |
| Basis-fontgrootte | `18px` op `html` | Alle `rem`-eenheden schalen hiervan |

---

## Iconen

**Regel: gebruik altijd Lucide. Nooit emoji, UTF-8-symbolen of zelfgemaakte SVG's.**

### Opzet

```ts
// src/lib/icon-paths.ts
export const ICON_PATHS: Record<string, string> = {
  // inner SVG content for 24×24 viewBox, stroke="currentColor", strokeWidth="2"
  'chevron-down': `<polyline points="6 9 12 15 18 9"/>`,
  'trash-2': `...`,
  // ...
};
```

Een nieuw icoon toevoegen: ga naar lucide.dev, kopieer de inhoud van de SVG en zet ze in de map.

### Gebruik in Astro

```astro
---
import Icon from '../components/Icon.astro';
---
<Icon name="trash-2" class="w-4 h-4" />
```

### Gebruik in React

```tsx
import Icon from '../components/Icon';  // Icon.tsx

<Icon name="pencil-line" className="w-4 h-4" />
```

`Icon.tsx` rendert:

```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
     className={className} aria-hidden
     dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? '' }} />
```

### Veelgebruikte iconen

| Naam | Waarvoor |
|---|---|
| `pencil-line` | Bewerken |
| `trash-2` | Verwijderen |
| `plus` | Toevoegen / nieuw |
| `x` | Modal sluiten |
| `save` | Opslaan |
| `search` | Zoekveld |
| `check` | Bevestigen / geslaagd |
| `settings` | Instellingenpagina |
| `chevron-down/left/right` | Navigatie, dropdowns |
| `grip-vertical` | Sleepgreep |
| `external-link` | Link die in een nieuw tabblad opent |
| `bold/italic/underline/strikethrough` | Rich text-werkbalk |
| `align-left/center/right/justify` | Tekstuitlijning |
| `link-2` | Link invoegen/bewerken |
| `code-xml` | Broncodeweergave |
| `list` / `list-ordered` | Opsomming / genummerde lijst |
| `undo-2` / `redo-2` | Ongedaan maken / opnieuw |

---

## Kleurenpalet

**Altijd licht.** Er is geen donkere variant en geen schakelaar — een tweede set
kleuren is een tweede set bugs. `stroel-cms-client` is de referentie-implementatie;
volg die in plaats van per project een eigen schaal te verzinnen.

### Primair (neutraal) — Slate

```
slate-50   #f8fafc   Page backgrounds
white      #ffffff   Card surfaces
slate-100  #f1f5f9   Card headers, button hover, row hover
slate-200  #e2e8f0   Borders, dividers
slate-300  #cbd5e1   Input borders
slate-400  #94a3b8   Muted text, icons, placeholders
slate-500  #64748b   Secondary text, td cells
slate-700  #334155   Body text
slate-800  #1e293b   Headings
slate-900  #0f172a   Primary button, active states
```

Gebruik `slate-*` voor elke neutraal in interne UI; nooit `gray-*`.

Twee dingen die bijten wanneer een project hiernaartoe omgezet wordt vanuit iets
donkerder, en die alleen op het scherm zichtbaar worden:

- **Een tint van een `-600` met lage dekking wordt grijs op wit.** Gebruik de
  volle `-50`/`-100`-pastels uit de tabel hieronder voor getinte panelen en badges.
- **Alles wat gekozen is om zichtbaar te zijn op een donker vlak, verdwijnt op een
  licht vlak** — een grafieklijn op `slate-400`, een haarlijnrand op `slate-700`.
- Zet om per *eigenschap*, nooit per classnaam: dezelfde stap betekent het
  tegenovergestelde, afhankelijk van waar ze staat. `bg-slate-800` is een
  paginaachtergrond in een donker thema; `text-slate-800` is een kop in dit thema.

### Semantische kleuren (altijd met hun Tailwind-kleur erbij)

| Bedoeling | Achtergrond | Rand | Tekst |
|---|---|---|---|
| Fout / gevaar | `red-50` / `red-600` | `red-200` / `red-300` | `red-700` / `red-800` |
| Geslaagd | `green-50` / `green-600` | `green-200` / `green-300` | `green-700` / `green-800` |
| Info | `blue-50` / `blue-600` | `blue-200` / `blue-300` | `blue-700` / `blue-800` |
| Waarschuwing | `amber-50` / `amber-400` | `amber-200` / `amber-300` | `amber-700` / `amber-800` |

---

## Knoppen

Patroon met twee classes: `btn` (basis) + een variant.

```html
<!-- Sizes (optional, base is "md") -->
<button class="btn btn-xs">...</button>
<button class="btn btn-sm">...</button>
<button class="btn">...</button>         <!-- base / md -->
<button class="btn btn-lg">...</button>

<!-- Variants -->
<button class="btn">Neutral</button>
<button class="btn btn-default">Default (slate-100)</button>
<button class="btn btn-primary">Primary (black)</button>
<button class="btn btn-primary-outline">Primary outline</button>
<button class="btn btn-error">Error (red)</button>
<button class="btn btn-error-outline">Error outline</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-success-outline">Success outline</button>
<button class="btn btn-info">Info (blue)</button>
<button class="btn btn-info-outline">Info outline</button>
<button class="btn btn-warning">Warning (amber)</button>
<button class="btn btn-warning-outline">Warning outline</button>
```

**Regels:**

- `btn-xs` krijgt nooit iconen erin
- Gebruik `btn-sm` voor de meeste modal- en formulierfooters
- Gebruik `btn-primary` voor de ene bevestig-/opslaanactie per formulier
- Uitgeschakeld: zet het `disabled`-attribuut — CSS zorgt voor `opacity-50 pointer-events-none`

### Knop met icoon

```html
<button class="btn btn-sm btn-primary">
  <Icon name="save" className="w-4 h-4" />
  Opslaan
</button>
```

---

## Alerts

Hetzelfde patroon met twee classes als bij knoppen: `alert` + variant.

```html
<div class="alert">Neutral / muted info</div>
<div class="alert alert-primary">Prominent info</div>
<div class="alert alert-error">Something went wrong</div>
<div class="alert alert-success">Saved successfully</div>
<div class="alert alert-info">Tip / note</div>
<div class="alert alert-warning">Warning</div>
```

---

## Badges

Statuspillen, meestal in tabelcellen:

```html
<span class="badge-default">Draft</span>
<span class="badge-success">Actief</span>
<span class="badge-warning">In behandeling</span>
<span class="badge-error">Verwijderd</span>
<span class="badge-info">Info</span>
```

---

## Formulierelementen

### Labels

```html
<!-- Standard label -->
<label class="form-label">Veldnaam</label>

<!-- Compact label (used inside block editors) -->
<label class="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-widest">
  Veldnaam
</label>
```

### Tekstvelden

```html
<input type="text" class="form-input w-full" />     <!-- full-size -->
<input type="text" class="form-input-sm w-full" />  <!-- compact (admin panels) -->
<textarea class="form-input-sm w-full resize-y min-h-[72px]"></textarea>
```

### Select

**Gebruik nooit een native `<select>`.** De optielijst wordt door het
besturingssysteem getekend, dus die negeert het palet volledig en lijkt in niets
op de rest van het formulier. Hetzelfde geldt voor `<details>`/`<summary>` —
gebruik een knop plus een paneel dat je zelf beheert.

```html
<!-- Progressive enhancement: authored as a real select, upgraded on load. -->
<select data-select class="form-input w-full">
  <option value="a">Option A</option>
</select>
```

```tsx
// Inside a React island, mount the same code through the component wrapper.
<Select name="plan" value={plan} onChange={setPlan}
        options={[{ value: 'free', label: 'free' }, { value: 'pro', label: 'pro' }]} />
```

Referentie-implementatie: `apps/web/src/lib/select.ts` in `status.stroel.dev`
(vanilla kern, `createSelect` + `enhanceSelects`) met een dunne
`components/Select.tsx` eromheen. Kopieer beide, plus de `.select*`-regels in
`global.css`.

Het native element vervangen betekent overnemen wat het gratis deed. Een eigen
dropdown is pas af wanneer dit allemaal werkt:

| | |
|---|---|
| Rollen | `combobox` op de knop, `listbox` op het paneel, `option` + `aria-selected` op elke rij |
| Status | `aria-expanded`, `aria-controls`, `aria-activedescendant` |
| Toetsenbord | Omhoog/omlaag openen en bewegen, Home/End, Enter/spatie selecteren, Escape sluit, Tab sluit en gaat verder |
| Type-ahead | Een letter typen springt naar de eerste match, zoals native doet |
| Focus | Blijft op de knop — `aria-activedescendant` markeert de rij, dus er is geen focus om te herstellen |
| Versturen | Een hidden input draagt de waarde, zodat een gewone form-POST blijft werken |
| Afkappen | Het paneel is `position: fixed`, zodat een `overflow-hidden`-card het niet kan afsnijden |

Twee bewuste verschillen met native die het weten waard zijn:

- Een **uitgeschakelde** dropdown verstuurt zijn waarde nog steeds. Native
  verstuurt niets, wat een server als "gewist" leest in plaats van "vergrendeld".
- Enter wordt alleen opgeslokt zolang het paneel open staat, zodat een gesloten
  dropdown het omliggende formulier nog verstuurt.

### Toggle switch

```html
<label class="form-switch">
  <input type="checkbox" />
  <span></span>
  Zichtbaar
</label>
```

### Kleurkiezer

```html
<input type="color" class="h-8 w-16 p-0.5 border border-slate-200 rounded" />
```

---

## Cards

```html
<div class="card">
  <div class="card-header">
    <h2>Sectietitel</h2>
  </div>
  <div class="card-body">
    Content here
  </div>
</div>
```

### Pagina's met meerdere secties (2 of meer cards)

Zet een `data-table-pre-title`-wrapper voor elke card met de sectiekop erin:

```html
<div class="data-table-pre-title">
  <h2>Sectienaam</h2>
</div>
<div class="card">...</div>
```

---

## Tabellen

```html
<table class="data-table">
  <thead>
    <tr>
      <th>Kolom A</th>
      <th>Kolom B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Waarde</td>
      <td><span class="badge-success">Actief</span></td>
    </tr>
  </tbody>
</table>
```

---

## Tabbladen

```html
<nav class="tab-nav">
  <button class="tab-btn" aria-selected="true">Tabblad 1</button>
  <button class="tab-btn" aria-selected="false">Tabblad 2</button>
</nav>
```

Schrijf de panelen als een gelabelde stapel en laat een script de tablist bouwen,
zodat de pagina alles blijft tonen wanneer het script nooit draait.
Referentie-implementatie: `apps/web/src/lib/tabs.ts` in `status.stroel.dev`
(`createTabs` / `enhanceTabs`).

Rollen en toetsenbord volgen het gebruikelijke listbox-contract: `tablist` / `tab` /
`tabpanel`, pijlen en Home/End om te bewegen, en een rondlopende `tabindex` zodat
Tab het paneel binnengaat in plaats van langs de tabbladen te wandelen.

**Eén formulier over tabbladen splitsen** is het gewone geval, en daar zitten twee
valkuilen in:

- **Verberg panelen, verwijder ze nooit.** Een veld in een `hidden` paneel
  verstuurt nog; een veld dat losgekoppeld of `disabled` is, niet — het opslaan
  laat dan stil vallen wat op de andere tabbladen stond.
- **Een verplicht veld op een verborgen tabblad blokkeert het versturen zonder dat
  er iets op het scherm staat**, want de browser kan geen control focussen die hij
  niet kan tonen. Luister naar `invalid` op het formulier in de *capture*-fase (het
  bubbelt niet), open het tabblad met de eerste overtreder, en markeer de andere
  zodat de lezer weet dat er meer wacht. Stel het wisselen uit tot een microtask:
  elke ongeldige control vuurt in één synchrone doorloop, dus door te wachten kies
  je de eerste in plaats van de laatste.

Taaltabbladen (compact, in card headers):

```html
<button class="lang-tab-btn" aria-selected="true">NL</button>
<button class="lang-tab-btn" aria-selected="false">FR</button>
```

---

## Modals

### Structuur

```tsx
// Backdrop + drag-close protection
function MyModal({ onClose }: { onClose: () => void }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const startedInsideRef = useRef(false);

  return (
    <div
      className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        startedInsideRef.current = innerRef.current?.contains(e.target as Node) ?? false;
      }}
      onClick={() => { if (!startedInsideRef.current) onClose(); }}
    >
      <div
        ref={innerRef}
        className="flex flex-col bg-white rounded-xl w-full max-w-2xl
                   min-h-[50vh] max-h-[88vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — shrink-0, always visible */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Titel</h3>
          <button onClick={onClose} className="..."><Icon name="x" /></button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="p-5">
            {/* content */}
          </div>
        </div>

        {/* Footer — shrink-0, always visible */}
        <div className="shrink-0 flex justify-between gap-2 px-5 py-4 border-t border-slate-100">
          <button className="btn btn-sm" onClick={onClose}>Annuleren</button>
          <button className="btn btn-sm btn-primary">Opslaan</button>
        </div>
      </div>
    </div>
  );
}
```

**Regels:**

- `overflow-hidden` op de container (niet `overflow-auto`), zodat header en footer nooit weg scrollen
- `onMouseDown` + `startedInsideRef` voorkomt dat de modal per ongeluk sluit wanneer de gebruiker een tekstselectie uit een input sleept en buiten de modal lost
- z-index: basismodals `z-[1000]`, dropdowns daarbinnen `z-[9999]`

---

## Dropdowns binnen modals (ontsnappen aan overflow)

Voor een waardekiezer: gebruik de Select onder "Formulierelementen" — die doet dit
al. Het patroon hieronder is voor het andere soort dropdown: menu's, actielijsten,
alles wat geen waarde kiest.

Zit een dropdown binnen een `overflow-hidden`-container, gebruik dan `position: fixed` om te ontsnappen:

```tsx
const btnRef = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);
const [pos, setPos] = useState({ top: 0, left: 0 });

function toggle() {
  const rect = btnRef.current?.getBoundingClientRect();
  if (rect) setPos({ top: rect.bottom + 4, left: rect.left });
  setOpen((v) => !v);
}

// Render:
<button ref={btnRef} onClick={toggle}>Open</button>

{open && (
  <>
    {/* Invisible full-screen backdrop to catch outside clicks */}
    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
    {/* Dropdown panel */}
    <div className="fixed z-[9999] bg-white rounded-lg border border-slate-200 shadow-xl py-1"
         style={{ top: pos.top, left: pos.left }}>
      <button ...>Option A</button>
    </div>
  </>
)}
```

---

## Pagina-layout

```astro
---
import AdminLayout from '../layouts/AdminLayout.astro';
---
<AdminLayout title="Pagina-naam">
  <Fragment slot="header">
    <h1>Pagina-naam</h1>
    {/* optional: breadcrumbs */}
  </Fragment>

  <div class="page-body">
    {/* content */}
  </div>
</AdminLayout>
```

Header en footer zijn beide sticky en de pagina scrollt ertussen. De shell is een
`min-h-dvh` flex-kolom; `mt-auto` op de footer houdt die onderaan het venster
wanneer een pagina te kort is om het te vullen, en `sticky bottom-0` houdt hem daar
zodra de pagina lang genoeg is om te scrollen.

### Patroon voor de paginakop (sticky)

Alleen titel en breadcrumbs — **geen actieknoppen hierboven**, die horen in de
footer.

```html
<div class="page-header">
  <div class="page-header-inner">
    <h1>Titel</h1>
  </div>
</div>
```

### Patroon voor de paginafooter (sticky, opslaanbalk)

**Elke actieknop op een pagina staat in de footer.** Terug en annuleren links, de
knop die vastlegt rechts. Noem de vastlegknop naar wat ze opslaat — "Gebruiker
opslaan", niet "Wijzigingen opslaan" — en de aanmaakknop naar wat ze aanmaakt:
"Website toevoegen", niet "Site toevoegen".

```html
<div class="page-footer">
  <div class="page-footer-inner">
    <button class="btn btn-sm">Annuleren</button>
    <button class="btn btn-sm btn-primary">Gebruiker opslaan</button>
  </div>
</div>
```

Render de footer alleen wanneer een pagina er iets in te zetten heeft, zodat een
read-only pagina geen lege balk meesleept.

Twee dingen komen boven zodra de knoppen de content verlaten:

- **Een submit-knop buiten haar formulier** werkt nog: geef het formulier een `id`
  en de knop `form="dat-id"`. Exporteer het id uit het formuliercomponent, zodat de
  pagina er niet van kan wegdrijven.
- **Een knop die de state van een framework-island nodig heeft** — uitgeschakeld
  tot er iets gewijzigd is, een label dat omslaat terwijl een request loopt —
  laat het island de knop via haar id bereiken (het is niet de node van het
  framework om te bezitten), of wordt van binnen het island in de footer
  geportald. Portal wanneer de knop en de content state moeten delen; bereik via
  het id wanneer het alleen om een enabled-vlag gaat.

---

## Typografieconventies

| Element | Classes |
|---|---|
| Paginatitel (h1) | `.page-header h1` — geregeld door CSS |
| Sectiekop | `text-lg font-semibold text-slate-900` |
| Card-label / caption | `text-xs font-semibold text-slate-400 uppercase tracking-widest` |
| Tabelkop | Geregeld door `.data-table th` |
| Gedempte bodytekst | `text-sm text-slate-500` |
| Gevaartekst | `text-error` (Tailwind: `text-red-700`) |
| Geslaagd-tekst | `text-success` (Tailwind: `text-green-700`) |

---

## Spatiëringsconventies

| Context | Waarde |
|---|---|
| Padding card body | `p-5` |
| Padding modal body | `p-5` |
| Modal header | `px-5 py-3.5` |
| Modal footer | `px-5 py-4` |
| Rij-afstand tussen formuliervelden | `mb-6` |
| Afstand tussen knoppen op één lijn | `gap-2` |

---

## Rich text-editor (TipTap)

Wanneer je een TipTap-editor opneemt:

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';

const extensions = [
  StarterKit,
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TextStyle,
  Color,
  Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
];
```

CSS (in je globale stylesheet):

```css
.tiptap-editor .ProseMirror { outline: none; min-height: 80px; }
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: 'Schrijf hier je tekst…';
  color: #94a3b8; pointer-events: none; float: left; height: 0;
}
/* Fill mode: editor fills its flex-1 parent */
.tiptap-fill .ProseMirror { min-height: 100%; }
```

---

## Tooltip

Elk element met `data-tooltip` krijgt een tooltip erboven, puur met CSS:

```html
<button data-tooltip="Verwijder dit item" class="btn btn-xs btn-error-outline">
  <Icon name="trash-2" class="w-3.5 h-3.5" />
</button>

<!-- Variants -->
<span data-tooltip="Fout" data-tooltip-variant="error">...</span>
<span data-tooltip="Gelukt" data-tooltip-variant="success">...</span>

<!-- Alignment -->
<button data-tooltip="Left-aligned" data-tooltip-align="left">...</button>
<button data-tooltip="Right-aligned" data-tooltip-align="right">...</button>
```

---

## Drag & drop (sorteerbare lijsten)

Gebruikt `@dnd-kit/core` + `@dnd-kit/sortable`.

```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

// Drag handle icon — always use:
<Icon name="grip-vertical" className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-grab" />
```

---

## Inline CSS — de ene uitzondering

Gebruik Tailwind-classes voor alles. De **enige** keren dat `style={{}}` aanvaardbaar is:

- Waarden die at runtime berekend worden (bijvoorbeeld een staalkleur uit de config: `style={{ backgroundColor: preset.color }}`)
- Absolute positionering van vaste dropdowns op de pixel (`style={{ top: pos.top, left: pos.left }}`)

Gebruik `style={{}}` nooit voor dingen die als statische Tailwind-classes uit te drukken zijn.
