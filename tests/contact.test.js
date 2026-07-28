import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmail,
  isAllowedOrigin,
  normalizeSubmission,
  processSubmission,
  validateSubmission
} from "../lib/contact.js";

const validInquiry = {
  formType: "inquiry",
  fullName: "  Alex Producer  ",
  email: "Alex@Example.com",
  companyName: "Alex Music",
  catalogSize: "25–100",
  message: "I need help with duplicate registrations.",
  consent: true
};

const validCatalogCheck = {
  formType: "catalog-check",
  fullName: "Sam Writer",
  email: "sam@example.com",
  companyName: "Sam Songs",
  songLink: "https://music.apple.com/us/album/example/123456789?i=987654321",
  message: "Released independently.",
  consent: true
};

test("normalizes inquiry data", () => {
  const normalized = normalizeSubmission(validInquiry);
  assert.equal(normalized.fullName, "Alex Producer");
  assert.equal(normalized.email, "alex@example.com");
  assert.equal(normalized.formType, "inquiry");
});

test("accepts complete inquiry data", () => {
  const errors = validateSubmission(normalizeSubmission(validInquiry));
  assert.deepEqual(errors, {});
});

test("requires a supported Spotify or Apple Music link", () => {
  const input = { ...validCatalogCheck, songLink: "https://example.com/song" };
  const errors = validateSubmission(normalizeSubmission(input));
  assert.equal(errors.songLink, "A valid Spotify or Apple Music song link is required.");
});

test("escapes untrusted content in the delivery email", () => {
  const data = normalizeSubmission({
    ...validInquiry,
    fullName: '<img src=x onerror="alert(1)">'
  });
  const email = createEmail(data, {
    RESEND_FROM_EMAIL: "Keyman <forms@keymanpublishing.com>",
    CONTACT_TO_EMAIL: "admin@keymanpublishing.com"
  });
  assert.doesNotMatch(email.html, /<img src=x/);
  assert.match(email.html, /&lt;img src=x/);
  assert.equal(email.reply_to, "alex@example.com");
});

test("returns a configuration status when Resend is not configured", async () => {
  const result = await processSubmission(validInquiry, {});
  assert.equal(result.status, 503);
  assert.equal(result.body.ok, false);
});

test("submits a valid catalog check to Resend", async () => {
  let capturedRequest;
  const fakeFetch = async (url, options) => {
    capturedRequest = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: "email_123" })
    };
  };

  const result = await processSubmission(
    validCatalogCheck,
    {
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "Keyman <forms@keymanpublishing.com>",
      CONTACT_TO_EMAIL: "admin@keymanpublishing.com"
    },
    fakeFetch
  );

  assert.equal(result.status, 200);
  assert.equal(capturedRequest.url, "https://api.resend.com/emails");
  const emailPayload = JSON.parse(capturedRequest.options.body);
  assert.deepEqual(emailPayload.to, ["admin@keymanpublishing.com"]);
  assert.match(emailPayload.subject, /Rights Gap Analysis/);
  assert.match(emailPayload.html, /music\.apple\.com/);
});

test("silently accepts honeypot submissions without sending email", async () => {
  let called = false;
  const result = await processSubmission(
    { ...validInquiry, website: "https://spam.example" },
    {
      RESEND_API_KEY: "re_test",
      RESEND_FROM_EMAIL: "Keyman <forms@keymanpublishing.com>"
    },
    async () => {
      called = true;
    }
  );
  assert.equal(result.status, 200);
  assert.equal(called, false);
});

test("accepts same-origin Worker requests with Web Headers", () => {
  const request = {
    headers: new Headers({
      origin: "https://keyman.example",
      host: "keyman.example"
    })
  };
  assert.equal(isAllowedOrigin(request, {}), true);
});
