# Learnova design language

Derived from a set of reference landing pages (cinematic product heroes, an e-learning dashboard, a minimalist SaaS system). The palette is fixed by the project owner: **midnight black and electric cobalt blue**.

## Principles
1. **One strong idea per screen.** A full-bleed hero with a single focal image and one message.
2. **Type does the heavy lifting.** Very large, tightly tracked bold sans (Inter Tight) with **one italic serif accent word per line** (Instrument Serif) in the accent colour. Never more than two typefaces plus the body face (Inter).
3. **One accent colour.** Electric cobalt `#2F5CFF` (lighter `#7C9CFF` for text on black). Status colours (green/amber/red) are reserved for mastery states only.
4. **Atmosphere over decoration.** The background is the product's own subject: here, a live electric-field simulation. It is dimmed under the text and respects `prefers-reduced-motion`.
5. **Pills and glass.** Floating pill navigation; pill buttons, the primary with an arrow in a coloured circle; translucent blurred "glass" cards for secondary information.
6. **A fact strip.** A glass bar at the bottom of the hero with 3 to 4 real numbers and outline icons.
7. **Honest content.** Every number shown is computed from data or the engine, or labelled as example/sample.

## Tokens
| Role | Value |
|---|---|
| Background | `#05060B` |
| Surface | `#0D1019`, glass `rgba(255,255,255,.055)` with `1px rgba(255,255,255,.12)` border and 18 px blur |
| Text / muted | `#E9EDFB` / `#8A93B2` (hero body `#B8C2E4`) |
| Accent / accent text | `#2F5CFF` / `#7C9CFF` |
| Display font | Inter Tight 700, tracking -0.045em, line-height 0.96, size `clamp(40px, 6.3vw, 96px)` |
| Accent font | Instrument Serif italic 400, 1.06em |
| Eyebrow | 12 px, 600, uppercase, +0.2em tracking, preceded by a 44 px rule |
| Radius | cards 24 px, strip 22 px, buttons 999 px |
| Motion | staggered 0.9 s rise on headline lines; field particles at 60 fps; none under reduced motion |

## Checks
Headline must stay on three lines at 1440 px and not overflow at 320 px. The page must have `width=device-width` (it did not at first, which broke mobile on GitHub Pages).
