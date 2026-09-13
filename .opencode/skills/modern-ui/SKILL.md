---
name: modern-ui
description: Design and implement modern, clean, Apple-inspired UI (layout, typography, color, spacing, components, motion, accessibility). Use for any interface, component, or styling work in this repo, or when asked to make UI cleaner/more modern. Pairs with the inkyo skill for the Japan map app.
---

# Modern UI — Apple-Minimal Design System

Use this skill whenever you touch UI. The goal: interfaces that feel calm,
precise, and effortless — the Apple-web idiom. Hierarchy comes from space,
size, and weight, not from decoration. When in doubt, remove.

## 1. Principles

1. **Content first.** The primary content (here: the map) dominates. Chrome
   floats above it, small and quiet.
2. **Space is the design.** Generous padding, clear grouping, never cramped.
   Whitespace separates better than lines or boxes.
3. **Hierarchy by type.** Size + weight + color roles create order. Do not use
   many colors to mean many things.
4. **Hairlines, not borders.** Prefer `1px solid rgba(0,0,0,.08)` and subtle
   separators over heavy outlines.
5. **Soft depth.** Shadows are large, blurred, low-opacity. Never hard/dark.
6. **One accent.** A single accent color for actions/selection. Everything else
   is neutral.
7. **Motion is subtle.** 150–300ms, ease-out, only to explain change. Respect
   `prefers-reduced-motion`.
8. **Direct manipulation.** Feedback on hover/press/focus; controls feel
   physical (scale/opacity, not color flips only).
9. **Consistency.** Same radius, spacing, and control heights everywhere.

## 2. Tokens — single source of truth

All values come from `src/design/tokens.ts`. **Never hardcode colors, spacing,
radii, or shadows in components or CSS.** Extend tokens rather than adding
literals.

Scale used by this system:

```
space   0,1,2,3,4,5,6,8,10,12,16,20,24  -> 4px base (1=4px, 2=8px, 4=16px)
radius  sm 8, md 12, lg 18, xl 24, pill 999
shadow  xs, sm, md, lg, focus  (blurred, low alpha)
blur    panel 20px, bar 12px
motion  fast 150ms, base 220ms, slow 320ms; ease-out
control sm 32, md 40, lg 48  (min target 44px on touch)
```

Color roles (light + dark via `prefers-color-scheme` / `[data-theme]`):

```
canvas    page background
surface   cards, panels
raised    menus, popovers
border    hairlines      borderStrong  separators needing emphasis
text      primary        textMuted  secondary      textFaint  tertiary
accent    actions/links  accentSoft  tinted bg    onAccent  text on accent
danger, warning, success (rarely used, soft backgrounds)
```

Ukiyo-e mapping (Inkyo): accent = beni `#c1352f`, secondary = indigo `#1b3a5c`,
neutral surfaces built from washi/sumi. The map keeps its woodblock palette;
the surrounding UI stays neutral and modern.

## 3. Typography

- Stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
  'Inter', system-ui, sans-serif`.
- Headings: weight 600, tracking `-0.02em`, tight leading (~1.15).
- Body: 15–17px, leading 1.5, muted color for secondary lines.
- Labels: 12–13px, weight 500, `textMuted`, often uppercase-free.
- Numbers/coords: tabular figures (`font-variant-numeric: tabular-nums`).
- Max line length ~70ch for prose.

Type scale: `xs 12, sm 13, base 15, md 17, lg 20, xl 24, 2xl 32, 3xl 44`.

## 4. Component specs

Every interactive component has states: default, hover, active/pressed, focus,
disabled, selected. Use tokens.

- **Button** — variants primary | secondary | ghost | danger; sizes sm/md/lg.
  radius md; height by control size; padding 12–16px; weight 500. Primary uses
  accent bg + `onAccent`; secondary uses surface + hairline border; ghost has no
  chrome until hover. Press: slight scale (0.98) or darken.
- **IconButton** — square, control-sized, radius sm/md, ghost until hover.
- **SegmentedControl** — pill track (`surfaceMuted`), selected segment is
  `raised` with `shadow.xs`. Use for view switches / filters.
- **TextField** — label above (13px, muted), input in surface with hairline
  border, radius sm/md, 40px tall. Focus = 2px accent ring (`shadow.focus`) +
  accent border. Helper/error line below.
- **SearchField** — TextField with leading magnifier icon and inline clear.
- **Select** — native select styled to match TextField; custom chevron.
- **Card / Sheet** — `surface`, radius lg/xl, `shadow.md`. Sheets/popovers may
  use `backdrop-filter: blur(panel)` over a translucent surface.
- **ListItem** — 44px+ row: leading icon/thumb, title + muted subtitle, trailing
  action/chevron. Hairline separators, full-row hover.
- **Badge / Chip** — pill, `accentSoft`/neutral bg, 12px medium text.
- **EmptyState** — centered icon, one-line title, muted hint, optional action.
- **Toolbar / TopBar** — height ~52px, translucent + blur, hairline bottom.
- **Disclosure / Accordion** — chevron rotates; content animates height/opacity.

## 5. Layout

- App shell: full-bleed content; overlays positioned with the spacing scale.
- Floating panel (this project): `position:absolute`, inset 16–20px, width
  ~360px, radius xl, translucent `surface` + `backdrop-filter: blur(panel)`,
  `shadow.lg`, internal scroll. Collapsible to a rail/button.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`. Panel docks on
  desktop, becomes a bottom sheet on mobile (`max-height 70vh`, drag handle).
- z-index scale from tokens; never invent values.
- Safe areas: respect `env(safe-area-inset-*)` on mobile.

## 6. Motion

- Durations/curves from tokens. Entrance: opacity + 4–8px translate. Hover:
  background/opacity only. Never animate layout properties.
- `@media (prefers-reduced-motion: reduce)` disables non-essential motion.

## 7. Accessibility (non-negotiable)

- Text contrast ≥ 4.5:1 (≥3:1 for large). Check muted text on surfaces.
- Visible `:focus-visible` ring on every interactive element (accent, 2px +
  offset).
- Keyboard: all controls reachable/operable; logical order; Escape closes
  overlays; focus returns to trigger.
- Targets ≥44×44px on touch.
- Semantic elements; labels tied to inputs; `aria-*` for state.
- Never encode meaning by color alone.

## 8. Do / Don't

- DO reuse existing primitives under `src/components/ui/`.
- DO prefer one accent and neutral everything else.
- DO keep the map unobstructed; panels float and collapse.
- DON'T add gradients (except subtle map/paper textures), neon, or multiple
  accent colors.
- DON'T use heavy borders, tight padding, or dense text walls.
- DON'T hardcode hex/px that duplicate a token.
- DON'T let decoration reduce map/label legibility.

## 9. Pre-finish checklist

- [ ] Tokens used everywhere; no stray literals.
- [ ] Spacing/radii/heights consistent across components.
- [ ] All interactive states present (hover/active/focus/disabled).
- [ ] Focus rings visible; keyboard tested.
- [ ] Contrast checked for text and controls.
- [ ] Motion subtle and reduced-motion-safe.
- [ ] Panel collapsible; map remains the hero.
- [ ] Light + dark both look intentional.
- [ ] `npm run lint && npm run typecheck && npm test` pass.
