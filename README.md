# Keyman

One-page consulting website for Keyman Music Metadata Consultant. The site includes:

- Responsive one-scroll navigation
- Music metadata and rights services
- Secure catalog inquiry form
- Rights Gap Analysis form for a Spotify or Apple Music song link
- Google Calendar appointment schedule integration
- Credentials, selected credits, process, contact, privacy, and terms
- FormSubmit delivery on GitHub Pages, with server-side Resend delivery available on the hosted Worker

## Run locally

Requirements: Node.js 20 or newer.

```bash
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:4173`.

The page and validation work without service credentials. Email delivery and live appointment availability require the environment values below.

The public GitHub Pages form posts to FormSubmit for `admin@keymanpublishing.com`. The first submission triggers FormSubmit's one-time confirmation email; delivery begins after that confirmation link is accepted.

## Required configuration

Create or configure these environment variables locally and in the hosting provider:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
CONTACT_TO_EMAIL
GOOGLE_APPOINTMENT_URL
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

The Google URL must be the public appointment schedule URL, usually beginning with:

```text
https://calendar.google.com/calendar/appointments/schedules/
```

Secrets are read only by the server endpoint. They are never included in browser JavaScript.

## Deploy

The repository is configured for Vercel:

1. Import the repository into Vercel.
2. Add the five environment variables.
3. Verify `keymanpublishing.com` in Resend and add the DNS records Resend provides.
4. Attach `keymanpublishing.com` to the Vercel project.
5. Deploy, submit a safe test through each form, and confirm receipt at `admin@keymanpublishing.com`.

## Verify

```bash
npm run check
npm test
```

The credential artwork areas intentionally identify where the certified records, credit screenshots, and actual project artwork should be placed once those assets are supplied.
