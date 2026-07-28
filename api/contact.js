import { isAllowedOrigin, processSubmission } from "../lib/contact.js";

const attempts = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 6;

const getClientAddress = (request) => {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return request.socket?.remoteAddress || "unknown";
};

const rateLimitExceeded = (request) => {
  const now = Date.now();
  const address = getClientAddress(request);
  const recent = (attempts.get(address) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  recent.push(now);
  attempts.set(address, recent);
  return recent.length > RATE_LIMIT;
};

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed." });
  }

  if (!isAllowedOrigin(request)) {
    return response.status(403).json({ ok: false, message: "Request origin was not accepted." });
  }

  if (rateLimitExceeded(request)) {
    return response.status(429).json({
      ok: false,
      message: "Too many requests were submitted. Please wait before trying again."
    });
  }

  try {
    const result = await processSubmission(request.body || {});
    return response.status(result.status).json(result.body);
  } catch (error) {
    console.error("Contact form error", error);
    return response.status(500).json({
      ok: false,
      message: "Your request could not be sent. Please email admin@keymanpublishing.com."
    });
  }
}
