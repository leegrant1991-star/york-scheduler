# York Design System

Derived from the York Central screenshot. This is the single source of
truth for color, type, spacing, and component behavior across the
platform — every component in `src/components` and every page in
`src/app` should trace back to a token or rule defined here. Tokens live in
`tailwind.config.js` (`colors.york.*`, `fontFamily.*`) and
`src/app/globals.css` (motion, focus, matrix-specific rules).

---

## 1. Color palette

| Token | Value | Use |
|---|---|---|
| `york-navy` | `#060D24` | App background, header background |
| `york-navy-light` | `#0B1638` | Secondary nav, section backgrounds |
| `york-navy-card` | `#111F47` | Card surfaces, table rows, modal body |
| `york-navy-card-hover` | `#16295C` | Card hover state |
| `york-gold` | `#E79B2D` | Primary actions, active states, highlights |
| `york-gold-hover` | `#F0A73C` | Gold hover/active |
| `york-gold-muted` | `rgba(231,155,45,0.14)` | Gold-tinted surfaces (badges, selected cells) |
| `york-white` | `#FFFFFF` | Headings, primary text on dark |
| `york-light-gray` | `#C7CDD9` | Secondary/body text on dark |
| `york-muted` | `#8892A6` | Tertiary text, placeholders, captions |
| `york-border` | `rgba(255,255,255,0.08)` | Hairline borders on dark surfaces |
| `york-border-strong` | `rgba(255,255,255,0.16)` | Emphasized borders, focus rings |
| `york-success` | `#3DDC84` | Positive states (rare — gold carries most emphasis) |
| `york-danger` | `#F0554C` | Destructive actions, errors |

Every color is defined once in `tailwind.config.js` under `theme.colors.york`
and consumed via utility classes (`bg-york-navy`, `text-york-gold`, etc.) —
no raw hex values in components.

## 2. Typography

- **Display / headings:** Plus Jakarta Sans, bold — carries the brand
  personality, used sparingly for page titles and hero copy.
- **Body / UI:** Inter — every label, table cell, input, and paragraph.
- **Numeric / data:** Inter with tabular figures (`font-feature-settings:
  'tnum'`) for anything that lines up in a column (tallies, percentages).

| Role | Size | Weight | Font |
|---|---|---|---|
| Page title | 48–56px (`text-5xl`/`text-6xl`) | 700 | Plus Jakarta Sans |
| Section header | 24–32px (`text-2xl`/`text-3xl`) | 700 | Plus Jakarta Sans |
| Card title | 18–24px (`text-lg`/`text-2xl`) | 600 | Plus Jakarta Sans |
| Body | 16–18px (`text-base`/`text-lg`) | 400 | Inter |
| Small label | 12–14px (`text-xs`/`text-sm`) | 500, uppercase tracking for eyebrows | Inter |

## 3. Spacing scale

Tailwind's default 4px-based scale is used as-is (`1`=4px … `24`=96px), with
these conventions:

- Card padding: `p-6` (24px) default, `p-8` (32px) for hero/featured cards.
- Section rhythm: `space-y-8` between major sections, `space-y-4` within a
  card.
- Page gutters: `px-6` mobile, `px-8` desktop (`sm:px-8`).

## 4. Border radius

| Token | Value | Use |
|---|---|---|
| `rounded-md` | 6px | Inputs, small buttons, badges |
| `rounded-lg` | 10px | Cards, tables, modals |
| `rounded-xl` | 14px | Hero/featured cards |
| `rounded-full` | pill | Status pills, avatar chips |

## 5. Shadow system

- `shadow-york-sm` — hairline elevation for resting cards on the navy
  background: `0 1px 2px rgba(0,0,0,0.4)`.
- `shadow-york-md` — hover elevation: `0 8px 24px rgba(0,0,0,0.45)`.
- `shadow-york-gold` — glow used on the most-popular matrix column and
  primary CTA hover: `0 0 0 1px rgba(231,155,45,0.4), 0 0 24px
  rgba(231,155,45,0.25)`.

All defined in `tailwind.config.js` under `boxShadow`.

## 6. Button system

Three tiers, all in `src/components/ui/Button.tsx`:

- **Primary** — `bg-york-gold text-york-navy`, hover `bg-york-gold-hover`
  + subtle lift (`shadow-york-gold`), used for the one main action per view.
- **Secondary** — transparent with `border-york-border-strong`, `text-white`,
  hover `bg-white/5`. Used for supporting actions (Copy link, Export).
- **Tertiary** — text-only, `text-york-light-gray`, hover `text-white`. Used
  inline (Remove, Cancel).
- **States:** `disabled` drops opacity to 50% and removes hover; `loading`
  shows an inline spinner and disables interaction; `:focus-visible` gets a
  2px gold outline offset by 2px on every tier.

## 7. Card system

`src/components/ui/Card.tsx` — `bg-york-navy-card`, `border
border-york-border`, `rounded-lg`, `shadow-york-sm`. Interactive cards add
`transition-all hover:shadow-york-md hover:border-york-border-strong
hover:-translate-y-0.5`. The featured/hero card is a variant with
`rounded-xl`, `p-8`, and a gold left accent bar.

## 8. Form system

`src/components/ui/Field.tsx` wraps every input: dark input surface
(`bg-york-navy-light`), `border border-york-border`, `rounded-md`,
`focus:border-york-gold focus:ring-1 focus:ring-york-gold/40`. Labels are
`text-xs font-medium uppercase tracking-wide text-york-muted`.

## 9. Table system

`src/components/ui/table` primitives + `ResultsMatrix`: dark header row
(`bg-york-navy-light`, sticky), zebra-free flat rows on `bg-york-navy-card`,
row hover `bg-york-navy-card-hover`, gold highlight for the winning column,
`divide-y divide-york-border` for separators. No default browser table
chrome anywhere.

## 10. Modal system

`src/components/ui/Modal.tsx` — full-screen scrim `bg-black/70`, panel
`bg-york-navy-card border border-york-border rounded-xl shadow-york-md`,
entrance via Framer Motion (`fade + scale-in`, 160ms, ease-out).

## 11. Navigation system

- **Header** — fixed, `bg-york-navy`, `border-b border-york-border`, three
  zones: brand mark far left, search centered (50–60% width), secondary
  brand mark far right. See `src/components/Header.tsx`.
- **Secondary nav** — `bg-york-navy-light`, single row of text links,
  `text-york-light-gray`, active/hover → `text-york-gold` with a 2px gold
  underline that slides in via Framer Motion `layoutId`.

## 12. Search system

Single global input, `bg-white text-york-navy rounded-full`, leading search
icon, generous horizontal padding, placeholder copy is task-specific
("Search polls, meetings, consultants, participants…"). No live results
wired yet — reserved as a v2 hook point (`src/components/Header.tsx` has a
`TODO` marking where to add a command palette).

## 13. Animation system

Framer Motion, used deliberately rather than everywhere:

- Page/section entrance: fade + 8px rise, staggered by 40ms per card.
- Card hover: 1–2px lift + shadow swap (CSS transition, not JS, for
  performance).
- Matrix cell selection: scale-in pulse on toggle.
- Recommended-slot border: looping gradient border animation
  (`@keyframes york-recommend-pulse` in `globals.css`).
- Respect `prefers-reduced-motion` — all keyframe animations are disabled
  under that media query (see `globals.css`).

## 14. Responsive standards

- Header collapses the search bar to an icon-triggered overlay below
  `sm`; brand marks always stay visible.
- Secondary nav scrolls horizontally on mobile instead of wrapping.
- Availability matrix keeps sticky column/header behavior at every
  breakpoint; below `sm` it drops to a card-per-timeslot list.
- Wizard steps stack vertically below `md`.

## 15. Accessibility standards

- Minimum contrast: body text on navy meets WCAG AA (`york-light-gray` on
  `york-navy` ≈ 8.9:1; `york-gold` on `york-navy` ≈ 7.4:1).
- Every interactive element has a visible `:focus-visible` ring
  (2px gold, 2px offset) — never removed, only restyled.
- All icon-only buttons carry `aria-label`.
- Matrix availability toggles use `role="group"` + `aria-pressed` per
  option (already true of the tri-state Yes/Maybe/No control).
- Reduced motion is respected globally.
