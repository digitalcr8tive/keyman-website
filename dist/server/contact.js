const MAX_LENGTHS = {
  fullName: 100,
  email: 160,
  companyName: 140,
  catalogSize: 32,
  message: 4000,
  songLink: 500
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATALOG_SIZES = new Set(["Under 25", "25–100", "100–500", "500+"]);

const isSupportedSongLink = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["music.apple.com", "open.spotify.com", "spotify.link"].includes(url.hostname)
    );
  } catch {
    return false;
  }
};

const trimField = (value, maxLength) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const normalizeSubmission = (payload = {}) => {
  const data = {
    formType: payload.formType === "catalog-check" ? "catalog-check" : "inquiry",
    fullName: trimField(payload.fullName, MAX_LENGTHS.fullName),
    email: trimField(payload.email, MAX_LENGTHS.email).toLowerCase(),
    companyName: trimField(payload.companyName, MAX_LENGTHS.companyName),
    catalogSize: trimField(payload.catalogSize, MAX_LENGTHS.catalogSize),
    message: trimField(payload.message, MAX_LENGTHS.message),
    songLink: trimField(payload.songLink, MAX_LENGTHS.songLink),
    website: trimField(payload.website, 240),
    consent: payload.consent === true
  };

  return data;
};

export const validateSubmission = (data) => {
  const errors = {};

  if (!data.fullName) errors.fullName = "Full name is required.";
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "A valid email address is required.";
  if (!data.companyName) errors.companyName = "Artist, producer, or company name is required.";
  if (!data.consent) errors.consent = "Consent is required.";

  if (data.formType === "inquiry") {
    if (!CATALOG_SIZES.has(data.catalogSize)) errors.catalogSize = "Select a valid catalog size.";
    if (!data.message) errors.message = "A description of the requested help is required.";
  } else {
    if (!isSupportedSongLink(data.songLink)) {
      errors.songLink = "A valid Spotify or Apple Music song link is required.";
    }
  }

  return errors;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const row = (label, value) => `
  <tr>
    <th style="padding:10px 12px;border-bottom:1px solid #dddddd;text-align:left;vertical-align:top;width:190px;font-family:Arial,sans-serif;font-size:13px;color:#555555">${escapeHtml(label)}</th>
    <td style="padding:10px 12px;border-bottom:1px solid #dddddd;font-family:Arial,sans-serif;font-size:14px;color:#111111;white-space:pre-wrap">${escapeHtml(value || "Not provided")}</td>
  </tr>`;

export const createEmail = (data, env = process.env) => {
  const isCatalogCheck = data.formType === "catalog-check";
  const subject = isCatalogCheck
    ? `Rights Gap Analysis request from ${data.fullName}`
    : `Catalog inquiry from ${data.fullName}`;

  const detailRows = [
    row("Request type", isCatalogCheck ? "Free Rights Gap Analysis" : "Catalog consultation inquiry"),
    row("Full name", data.fullName),
    row("Email", data.email),
    row("Artist / Producer / Company", data.companyName)
  ];

  if (isCatalogCheck) {
    detailRows.push(
      row("Spotify or Apple Music link", data.songLink),
      row("Optional notes", data.message)
    );
  } else {
    detailRows.push(row("Catalog size", data.catalogSize), row("Requested help", data.message));
  }

  return {
    from: env.RESEND_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL || "admin@keymanpublishing.com"],
    reply_to: data.email,
    subject,
    html: `
      <!doctype html>
      <html>
      <body style="margin:0;padding:24px;background:#f5f5f5">
        <main style="max-width:720px;margin:0 auto;background:#ffffff;border-top:4px solid #c8151d">
          <div style="padding:26px 28px 12px">
            <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c8151d">Keyman website</p>
            <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:500;color:#111111">${escapeHtml(subject)}</h1>
          </div>
          <table role="presentation" style="width:100%;border-collapse:collapse">${detailRows.join("")}</table>
          <p style="margin:0;padding:20px 28px;font-family:Arial,sans-serif;font-size:12px;color:#666666">Reply directly to this email to contact ${escapeHtml(data.fullName)}.</p>
        </main>
      </body>
      </html>`
  };
};

export const processSubmission = async (payload, env = process.env, fetchImplementation = fetch) => {
  const data = normalizeSubmission(payload);

  if (data.website) {
    return { status: 200, body: { ok: true, message: "Your request was sent." } };
  }

  const errors = validateSubmission(data);
  if (Object.keys(errors).length > 0) {
    return {
      status: 400,
      body: { ok: false, message: "Please review the submitted information.", errors }
    };
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return {
      status: 503,
      body: {
        ok: false,
        message: "Secure email delivery is being configured. Please email admin@keymanpublishing.com."
      }
    };
  }

  const response = await fetchImplementation("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(createEmail(data, env))
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Resend delivery error", {
      status: response.status,
      name: result?.name,
      message: result?.message
    });
    return {
      status: 502,
      body: {
        ok: false,
        message: "Email delivery was unavailable. Please email admin@keymanpublishing.com."
      }
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: data.formType === "catalog-check" ? "Catalog check requested." : "Catalog inquiry sent."
    }
  };
};

const readHeader = (headers, name) => {
  if (typeof headers?.get === "function") return headers.get(name);
  return headers?.[name] || headers?.[name.toLowerCase()];
};

export const isAllowedOrigin = (request, env = process.env) => {
  const origin = readHeader(request.headers, "origin");
  if (!origin) return true;

  const forwardedHost = readHeader(request.headers, "x-forwarded-host");
  const host = forwardedHost || readHeader(request.headers, "host");
  if (host) {
    try {
      if (new URL(origin).host === host) return true;
    } catch {
      return false;
    }
  }

  const configuredOrigins = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configuredOrigins.includes(origin);
};
