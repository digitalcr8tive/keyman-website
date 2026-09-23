import { el, toast } from "../util.js";
import { createPlanner } from "../planner/planner.js";
import { decodeLayout } from "../share.js";
import { sampleGarageAfter } from "../data/demo.js";
import { jobsRepo } from "../store.js";
import { openQuoteDialog } from "../components/quote.js";
import { formatFeet } from "../util.js";

export const render = async (container, { params }) => {
  let garage = null;
  let title = "";
  let beforePhoto = null;
  let afterPhoto = null;
  const jobId = params.get("job");
  if (params.get("l")) {
    try {
      const payload = await decodeLayout(params.get("l"));
      garage = payload.garage;
      title = payload.title;
    } catch (error) {
      toast(error.message, "error");
    }
  } else if (jobId) {
    const job = jobsRepo.get(jobId);
    garage = job?.garage || null;
    title = job?.customer ? `${job.customer}'s garage` : "";
    beforePhoto = job?.beforePhotos?.[0]?.dataUrl || null;
    afterPhoto = job?.afterPhotos?.[0]?.dataUrl || null;
  }
  const isSample = !garage;
  if (!garage) garage = sampleGarageAfter();

  const canvas = el("div", { class: "client-canvas" });
  const detail = el("p", { class: "client-detail", "aria-live": "polite" }, "Tap any item to see what it is.");
  const zonesToggle = el("button", { type: "button", class: "chip is-active", "aria-pressed": "true" }, "Zones");
  const labelsToggle = el("button", { type: "button", class: "chip is-active", "aria-pressed": "true" }, "Labels");

  const planner = createPlanner(canvas, {
    garage,
    mode: "view",
    onSelect: (selected) => {
      detail.textContent = selected
        ? `${selected.item.name} · about ${formatFeet(selected.item.width)} × ${formatFeet(selected.item.height)}${selected.item.zone ? ` · ${garage.zones.find((zone) => zone.id === selected.item.zone)?.name || ""} zone` : ""}`
        : "Tap any item to see what it is.";
    }
  });
  zonesToggle.addEventListener("click", () => {
    const on = zonesToggle.getAttribute("aria-pressed") !== "true";
    zonesToggle.setAttribute("aria-pressed", String(on));
    zonesToggle.classList.toggle("is-active", on);
    planner.setOptions({ zones: on });
  });
  labelsToggle.addEventListener("click", () => {
    const on = labelsToggle.getAttribute("aria-pressed") !== "true";
    labelsToggle.setAttribute("aria-pressed", String(on));
    labelsToggle.classList.toggle("is-active", on);
    planner.setOptions({ labels: on });
  });

  const zoneList = garage.zones.length
    ? el("ul", { class: "zone-legend" }, ...garage.zones.map((zone) => el("li", { style: `color:${zone.color}` }, el("i"), zone.name, el("span", { class: "sm" }, ` · ${garage.objects.filter((object) => object.zone === zone.id).length} items`))))
    : null;

  const planLink = location.href;
  const cta = () => openQuoteDialog({ planLink, subject: "Garage transformation quote request", heading: "Request a quote" });
  document.addEventListener("garage:quote", cta);

  container.append(
    el("section", { class: "client-hero" },
      el("p", { class: "eyebrow" }, isSample ? "Sample plan" : "Prepared for you"),
      el("h1", {}, "Garage Transformation Plan"),
      el("div", { class: "rule center" }),
      el("p", { class: "sub" }, title || garage.name || "Your proposed garage layout", ` · ${formatFeet(garage.width)} × ${formatFeet(garage.depth)}`)
    ),
    el("section", { class: "client-step" },
      el("p", { class: "eyebrow" }, "Before"),
      beforePhoto
        ? el("img", { class: "client-photo", src: beforePhoto, alt: "Garage before the transformation" })
        : el("div", { class: "photo-placeholder" }, el("span", {}, "Before photo"), el("span", { class: "sm" }, "Added from the job record when available."))
    ),
    el("section", { class: "client-step" },
      el("div", { class: "card-head" },
        el("p", { class: "eyebrow" }, "Proposed"),
        el("div", { class: "chip-row" }, zonesToggle, labelsToggle)
      ),
      canvas,
      detail,
      zoneList,
      el("p", { class: "disclaimer" }, "Planning visualization only. Verify actual measurements before installation or construction.")
    ),
    el("section", { class: "client-step" },
      el("p", { class: "eyebrow" }, "After"),
      afterPhoto
        ? el("img", { class: "client-photo", src: afterPhoto, alt: "Garage after the transformation" })
        : el("div", { class: "photo-placeholder" }, el("span", {}, "Completed photo"), el("span", { class: "sm" }, "Your finished garage will appear here."))
    ),
    el("section", { class: "client-cta" },
      el("h2", {}, "Ready to transform your garage?"),
      el("button", { type: "button", class: "button button-primary big", onclick: cta }, "Request a quote"),
      el("p", { class: "sm" }, "No obligation. Keyman follows up by email.")
    )
  );

  return () => {
    document.removeEventListener("garage:quote", cta);
    planner.destroy();
  };
};
