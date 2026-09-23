// Client-facing "Request a quote" dialog. Uses the same FormSubmit delivery path
// the main Keyman site uses on GitHub Pages, so no backend is required.

import { el } from "../util.js";

const FORM_ENDPOINT = "https://formsubmit.co/ajax/admin@keymanpublishing.com";

export const openQuoteDialog = ({ planLink = "", subject = "Garage transformation quote request", heading = "Request a quote" } = {}) => {
  let dialog = document.querySelector("[data-quote-dialog]");
  if (dialog) dialog.remove();

  const status = el("p", { class: "form-status", role: "status", "aria-live": "polite" });
  const field = (name, label, type = "text", extra = {}) =>
    el("div", { class: "field" }, el("label", { for: `quote-${name}` }, label), el("input", { id: `quote-${name}`, name, type, ...extra }));

  const form = el("form", { class: "catalog-form", novalidate: true },
    el("div", { class: "form-row" },
      field("fullName", "Full name", "text", { autocomplete: "name", required: true, maxlength: 100 }),
      field("email", "Email address", "email", { autocomplete: "email", required: true, maxlength: 160 })
    ),
    el("div", { class: "form-row" },
      field("phone", "Phone (optional)", "tel", { autocomplete: "tel", maxlength: 40 }),
      field("address", "Garage address or city", "text", { autocomplete: "street-address", maxlength: 200 })
    ),
    el("div", { class: "field" },
      el("label", { for: "quote-message" }, "What would you like done?"),
      el("textarea", { id: "quote-message", name: "message", rows: 4, maxlength: 2000, placeholder: "Cleaning, organization, more space, a workshop…" })
    ),
    el("div", { class: "bot-field", "aria-hidden": "true" }, el("label", { for: "quote-website" }, "Website"), el("input", { id: "quote-website", name: "website", type: "text", tabindex: "-1", autocomplete: "off" })),
    el("div", { class: "dialog-actions" },
      el("button", { class: "button button-outline", type: "button", onclick: () => dialog.close() }, "Cancel"),
      el("button", { class: "button button-primary", type: "submit" }, "Send request")
    ),
    status
  );

  dialog = el("dialog", { class: "catalog-dialog quote-dialog", dataset: { quoteDialog: "" }, "aria-labelledby": "quote-title" },
    el("button", { class: "dialog-close", type: "button", "aria-label": "Close", onclick: () => dialog.close() }, el("span", { "aria-hidden": "true" }), el("span", { "aria-hidden": "true" })),
    el("div", { class: "dialog-intro" },
      el("p", { class: "section-label" }, "Garage transformation"),
      el("h2", { id: "quote-title" }, heading),
      el("p", {}, "Share your details and Keyman will follow up with a quote for your garage.")
    ),
    form
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("fullName") || "").trim();
    const email = String(data.get("email") || "").trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "Enter your name and a valid email address.";
      status.className = "form-status is-error";
      return;
    }
    if (data.get("website")) return; // honeypot
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Sending your request…";
    status.className = "form-status";
    const payload = new FormData();
    payload.append("fullName", name);
    payload.append("email", email);
    payload.append("phone", String(data.get("phone") || ""));
    payload.append("address", String(data.get("address") || ""));
    payload.append("message", String(data.get("message") || ""));
    if (planLink) payload.append("planLink", planLink);
    payload.append("_subject", `${subject} from ${name}`);
    payload.append("_template", "table");
    payload.append("_captcha", "false");
    try {
      const response = await fetch(FORM_ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: payload });
      if (!response.ok) throw new Error("Your request could not be sent.");
      status.textContent = "Request sent. Keyman will follow up by email.";
      status.className = "form-status is-success";
      form.reset();
    } catch (error) {
      status.textContent = `${error.message || "Your request could not be sent."} You can also email admin@keymanpublishing.com.`;
      status.className = "form-status is-error";
    } finally {
      button.disabled = false;
    }
  });

  dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  document.body.append(dialog);
  document.body.classList.add("dialog-open");
  dialog.showModal();
  return dialog;
};
