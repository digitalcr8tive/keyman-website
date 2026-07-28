const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");
const siteHeader = document.querySelector("[data-header]");
const catalogDialog = document.querySelector("[data-catalog-dialog]");

const setMenuState = (open) => {
  menuToggle?.setAttribute("aria-expanded", String(open));
  mobileNav?.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
  const label = menuToggle?.querySelector(".sr-only");
  if (label) label.textContent = open ? "Close navigation" : "Open navigation";
};

menuToggle?.addEventListener("click", () => {
  setMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) setMenuState(false);
});

const updateHeader = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const observedSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: [0.05, 0.3, 0.6] }
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}

const openCatalogDialog = () => {
  if (!catalogDialog) return;
  catalogDialog.showModal();
  document.body.classList.add("dialog-open");
};

const closeCatalogDialog = () => {
  if (!catalogDialog?.open) return;
  catalogDialog.close();
  document.body.classList.remove("dialog-open");
};

document.querySelectorAll("[data-open-catalog]").forEach((button) => {
  button.addEventListener("click", openCatalogDialog);
});

document.querySelectorAll("[data-close-catalog]").forEach((button) => {
  button.addEventListener("click", closeCatalogDialog);
});

catalogDialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});

catalogDialog?.addEventListener("click", (event) => {
  const rect = catalogDialog.getBoundingClientRect();
  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;
  if (outside) closeCatalogDialog();
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const fieldMessages = {
  fullName: "Enter your full name.",
  email: "Enter a valid email address.",
  companyName: "Enter your artist, producer, or company name.",
  catalogSize: "Select an approximate catalog size.",
  message: "Tell me briefly what you need help with.",
  consent: "Confirm that Keyman may respond to your request.",
  songLink: "Enter a Spotify or Apple Music song link."
};

const setFieldError = (form, name, message = "") => {
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (error) error.textContent = message;

  form.querySelectorAll(`[name="${name}"]`).forEach((field) => {
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  });
};

const clearErrors = (form) => {
  form.querySelectorAll("[data-error-for]").forEach((error) => {
    error.textContent = "";
  });
  form.querySelectorAll("[aria-invalid]").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
};

const validateForm = (form, formType) => {
  clearErrors(form);
  const data = new FormData(form);
  const requiredNames =
    formType === "catalog-check"
      ? ["fullName", "email", "companyName", "songLink"]
      : ["fullName", "email", "companyName", "catalogSize", "message"];

  let firstInvalid = null;

  requiredNames.forEach((name) => {
    const value = String(data.get(name) ?? "").trim();
    const invalid =
      !value ||
      (name === "email" && !emailPattern.test(value)) ||
      (name === "songLink" && !isSupportedSongLink(value));
    if (!invalid) return;

    setFieldError(form, name, fieldMessages[name]);
    firstInvalid ??= form.querySelector(`[name="${name}"]`);
  });

  if (data.get("consent") !== "on") {
    setFieldError(form, "consent", fieldMessages.consent);
    firstInvalid ??= form.querySelector('[name="consent"]');
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }

  return true;
};

const setFormStatus = (form, message, state = "") => {
  const status = form.querySelector("[data-form-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-success", state === "success");
  status.classList.toggle("is-error", state === "error");
};

const submitForm = async (form) => {
  const formType = form.dataset.form;
  if (!validateForm(form, formType)) {
    setFormStatus(form, "Please review the highlighted fields.", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.formType = formType;
  payload.consent = formData.get("consent") === "on";

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  setFormStatus(form, "Sending your request securely.");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Your request could not be sent.");
    }

    form.reset();
    clearErrors(form);
    const successMessage =
      formType === "catalog-check"
        ? "Your catalog check was sent. Keyman will follow up by email."
        : "Your catalog inquiry was sent. Keyman will follow up by email.";
    setFormStatus(form, successMessage, "success");
  } catch (error) {
    setFormStatus(
      form,
      error.message || "Your request could not be sent. Please email admin@keymanpublishing.com.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
};

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitForm(form);
  });

  form.addEventListener("input", (event) => {
    const name = event.target.name;
    if (name) setFieldError(form, name);
    const status = form.querySelector("[data-form-status]");
    if (status?.classList.contains("is-error")) setFormStatus(form, "");
  });

  form.addEventListener("change", (event) => {
    const name = event.target.name;
    if (name) setFieldError(form, name);
  });
});

const isGoogleAppointmentUrl = (value) => {
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

let googleAppointmentUrl = "";

const connectCalendar = async () => {
  const confirmButton = document.querySelector("[data-calendar-confirm]");
  const status = document.querySelector("[data-calendar-status]");
  if (!confirmButton || !status) return;

  try {
    const response = await fetch("/api/config", {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error("Calendar configuration unavailable.");
    const config = await response.json();
    if (!isGoogleAppointmentUrl(config.googleAppointmentUrl)) {
      throw new Error("Calendar URL is not configured.");
    }
    googleAppointmentUrl = config.googleAppointmentUrl;
    status.textContent = "Live availability is connected through Google Calendar.";
  } catch {
    status.textContent = "";
  }
};

connectCalendar();

document.querySelectorAll(".calendar-days button").forEach((dayButton) => {
  dayButton.addEventListener("click", () => {
    document.querySelectorAll(".calendar-days button").forEach((button) => {
      button.classList.remove("is-selected");
      button.removeAttribute("aria-pressed");
    });
    dayButton.classList.add("is-selected");
    dayButton.setAttribute("aria-pressed", "true");
  });
});

document.querySelector("[data-calendar-confirm]")?.addEventListener("click", () => {
  const status = document.querySelector("[data-calendar-status]");
  if (googleAppointmentUrl) {
    window.open(googleAppointmentUrl, "_blank", "noopener");
    if (status) status.textContent = "Opening the secure Google appointment schedule.";
    return;
  }
  if (status) {
    status.textContent = "The appointment schedule is ready to connect. Please email admin@keymanpublishing.com in the meantime.";
  }
});

document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = new Date().getFullYear();
});
