# Keyman

One-page consulting website for Keyman Music Metadata Consultant. The site includes:

- Responsive one-scroll navigation
- Music metadata and rights services
- Secure catalog inquiry form
- Rights Gap Analysis form for a Spotify or Apple Music song link
- Google Calendar event invitations for consultations
- Credentials, selected credits, process, contact, privacy, and terms
- FormSubmit delivery on GitHub Pages, with server-side Resend delivery available on the hosted Worker

## Garage Operations OS (`/garage/`)

A second application inside the same template: a garage cleaning and organization business OS served at `garage/` (GitHub Pages: `/keyman-website/garage/`). It is plain HTML/CSS/ES modules like the rest of the site and reuses `styles.css` for the header, buttons, forms, and typography; `garage/garage.css` adds the app layout and planner canvas.

Sections (hash-routed, `garage/#/<route>`):

- `dashboard` — KPIs, quick actions, recent jobs
- `sop` — ten-stage interactive garage cleaning SOP with safety guidance (state in localStorage)
- `checklist` — the SOP run against a specific job record
- `inventory` — supply inventory with in-stock / low-stock / reorder status and a "Build job loadout" generator (Basic Reset, Deep Clean, Full Garage Transformation)
- `planner` — interactive 2D garage planner: object library, drag / rotate / resize / duplicate / delete, zones, grid snapping, dimensions, undo/redo, save, PNG/SVG/JSON export
- `client` — client-facing "Garage Transformation Plan" (before / proposed / after + request-a-quote); opens shared layouts from `#/client?l=<token>`
- `demo` — door-to-door sales demo flow
- `jobs` — job records with photos, layout, SOP progress, loadout, status
- `scanner` — future Room Scanner (coming soon) with the module contracts in `garage/js/scanner/types.js`

Shareable links serialise the layout into the URL hash (deflate + base64url) so no backend is needed. Only public layout fields are encoded; job notes and metadata never leave the device. `garage/js/store.js` isolates persistence behind a `StorageAdapter` so localStorage can later be replaced by Supabase/Postgres. Data model: `garage/js/types.js` (JSDoc) and `garage/js/types.d.ts`.

Tests: `tests/garage-share.test.js`, `tests/garage-model.test.js`. `npm run check` also syntax-checks every garage module.

## Run locally

Requirements: Node.js 20 or newer.

```bash
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:4173`.

The page and calendar-event flow work without Google account credentials. Email delivery for the separate inquiry forms requires the environment values below.

The public GitHub Pages form posts to FormSubmit for `admin@keymanpublishing.com`. The first submission triggers FormSubmit's one-time confirmation email; delivery begins after that confirmation link is accepted.

## Required configuration

Create or configure these environment variables locally and in the hosting provider:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
CONTACT_TO_EMAIL
ALLOWED_ORIGINS
```

`RESEND_FROM_EMAIL` must use a sender domain verified in Resend. The recommended production value is:

```text
Keyman Website <forms@keymanpublishing.com>
```

`CONTACT_TO_EMAIL` should remain:

```text
admin@keymanpublishing.com
```

The booking form creates a prefilled 30-minute Google Calendar event. The customer reviews and saves it, with `producedbykeyman@gmail.com` and the customer's submitted address pre-added as guests. Google Calendar then sends the invitations and applies each guest's reminder settings. No access to Keyman's Google account is required by the website.

Secrets are read only by the server endpoint. They are never included in browser JavaScript.

## Deploy

The repository is configured for Vercel:

1. Import the repository into Vercel.
2. Add the four environment variables.
3. Verify `keymanpublishing.com` in Resend and add the DNS records Resend provides.
4. Attach `keymanpublishing.com` to the Vercel project.
5. Deploy, submit a safe test through each form, and confirm receipt at `admin@keymanpublishing.com`.

## Verify

```bash
npm run check
npm test
```

The credential artwork areas intentionally identify where the certified records, credit screenshots, and actual project artwork should be placed once those assets are supplied.
