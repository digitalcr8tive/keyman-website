# Design System

## Overview

Keyman is a one-page music metadata consulting site based closely on the supplied reference composition. It uses a white analytical canvas, fine black rules, saturated rights-red accents, editorial-scale typography, and restrained waveform motifs. The overall impression is professional, data-aware, and exacting.

## Theme

Light theme with a restrained color strategy. White carries the interface while red is reserved for actions, active states, icons, punctuation, and short labels. A near-black footer anchors the page.

## Color Palette

- `--canvas: oklch(1 0 0)` — primary page background
- `--surface: oklch(0.985 0.002 25)` — quiet panel fill
- `--ink: oklch(0.17 0.008 25)` — primary text
- `--muted: oklch(0.43 0.012 25)` — supporting text
- `--rule: oklch(0.88 0.008 25)` — dividers and controls
- `--brand: oklch(0.56 0.22 28)` — Keyman red
- `--brand-dark: oklch(0.46 0.19 28)` — hover and active red
- `--footer: oklch(0.12 0.008 215)` — footer background
- `--success: oklch(0.50 0.13 150)` — form success
- `--error: oklch(0.48 0.19 28)` — form errors

## Typography

- Display: Bodoni Moda, used for major headings and the Keyman wordmark.
- Interface and body: Manrope, used for navigation, body copy, forms, and labels.
- Maximum body line length: 70 characters.
- Headlines use balanced wrapping and remain below 6rem at the largest viewport.

## Layout

- Maximum content width: 1440px.
- One-scroll navigation with a sticky header.
- Hero is centered and surrounded by a subtle waveform field.
- Services use six ruled columns on large screens, three and two columns at smaller widths.
- The conversion section follows the reference’s three-part structure: free analysis, general inquiry, and calendar booking.
- Credential and portfolio sections vary their composition to avoid repetitive cards.

## Components

- Buttons are square-shouldered with 4px radii, strong uppercase labels, and explicit hover/focus states.
- Form fields use white fills, 1px neutral borders, 4px radii, persistent labels, and inline validation.
- Service icons use precise line SVGs in red.
- Dialogs use the native `<dialog>` element with focus management and escape-to-close behavior.
- Status messages use live regions and never rely on color alone.

## Motion

Use a single coordinated hero entrance, subtle waveform drift, button transitions, and dialog transitions. All motion is disabled or reduced when `prefers-reduced-motion` is enabled.

## Responsive Behavior

- Desktop: full navigation, six service columns, and three conversion columns.
- Tablet: compact navigation and multi-column sections.
- Mobile: fixed-height header with menu disclosure, single-column content, full-width controls, and a persistent visible booking action in the header.
