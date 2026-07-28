import { isAllowedOrigin, processSubmission } from "./contact.js";

const jsonResponse = (body, status = 200, additionalHeaders = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...additionalHeaders
    }
  });

const validAppointmentUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "calendar.google.com" &&
      url.pathname.includes("/calendar/appointments/")
    );
  } catch {
    return false;
  }
};

const withSecurityHeaders = async (response) => {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://calendar.google.com https://embed.music.apple.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/config") {
      const configuredUrl = env.GOOGLE_APPOINTMENT_URL || "";
      return jsonResponse(
        {
          googleAppointmentUrl: validAppointmentUrl(configuredUrl) ? configuredUrl : ""
        },
        200,
        { "Cache-Control": "public, max-age=300" }
      );
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return jsonResponse(
          { ok: false, message: "Method not allowed." },
          405,
          { Allow: "POST" }
        );
      }

      if (!isAllowedOrigin(request, env)) {
        return jsonResponse(
          { ok: false, message: "Request origin was not accepted." },
          403
        );
      }

      const contentLength = Number.parseInt(request.headers.get("content-length") || "0", 10);
      if (contentLength > 64 * 1024) {
        return jsonResponse(
          { ok: false, message: "Request body is too large." },
          413
        );
      }

      try {
        const payload = await request.json();
        const result = await processSubmission(payload, env);
        return jsonResponse(result.body, result.status);
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "contact_form_error",
            message: error instanceof Error ? error.message : "Unknown error"
          })
        );
        return jsonResponse(
          {
            ok: false,
            message: "Your request could not be sent. Please email admin@keymanpublishing.com."
          },
          400
        );
      }
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed.", {
        status: 405,
        headers: { Allow: "GET, HEAD" }
      });
    }

    let assetRequest = request;
    if (url.pathname === "/privacy") {
      const assetUrl = new URL("/privacy.html", url);
      assetRequest = new Request(assetUrl, request);
    } else if (url.pathname === "/terms") {
      const assetUrl = new URL("/terms.html", url);
      assetRequest = new Request(assetUrl, request);
    }

    try {
      const response = await env.ASSETS.fetch(assetRequest);
      return await withSecurityHeaders(response);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "asset_delivery_error",
          path: url.pathname,
          message: error instanceof Error ? error.message : "Unknown error"
        })
      );
      return new Response("Not found.", { status: 404 });
    }
  }
};

export default worker;
