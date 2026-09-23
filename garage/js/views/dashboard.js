import { el, formatDate } from "../util.js";
import { jobsRepo, inventoryRepo, sopRepo, layoutRepo } from "../store.js";
import { DEFAULT_INVENTORY, stockStatus } from "../data/inventory.js";
import { sopProgress } from "../data/sop.js";
import { JOB_STATUSES, SERVICE_TYPES } from "../types.js";
import { buildHash } from "../router.js";

const label = (list, id) => list.find((entry) => entry.id === id)?.label || id;

export const render = (container) => {
  const jobs = jobsRepo.all();
  const inventory = inventoryRepo.all(DEFAULT_INVENTORY);
  const progress = sopProgress(sopRepo.get());
  const reorder = inventory.filter((item) => stockStatus(item) === "reorder").length;
  const low = inventory.filter((item) => stockStatus(item) === "low-stock").length;
  const saved = layoutRepo.saved().length + (layoutRepo.current() ? 1 : 0);
  const active = jobs.filter((job) => ["scheduled", "in-progress"].includes(job.status)).length;

  const kpi = (title, value, detail, href) =>
    el("a", { class: "kpi", href },
      el("span", { class: "l" }, title),
      el("span", { class: "v" }, String(value)),
      el("span", { class: "d" }, detail)
    );

  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, "Garage Operations OS"),
      el("h1", {}, "Dashboard"),
      el("div", { class: "rule" }),
      el("p", { class: "sub" }, "Operations, supplies, the garage planner, and the client-facing sales tools in one place. Data is saved on this device for the MVP.")
    ),
    el("div", { class: "kpis" },
      kpi("Jobs", jobs.length, `${active} scheduled or in progress`, buildHash("jobs")),
      kpi("Master SOP", `${progress.percent}%`, progress.complete ? "All stages complete" : `Stage ${progress.currentStage.number} · ${progress.currentStage.title}`, buildHash("sop")),
      kpi("Reorder", reorder, `${low} low stock`, buildHash("inventory", { status: "reorder" })),
      kpi("Layouts", saved, "Saved garage plans", buildHash("planner")),
      kpi("Sales demo", "Go", "Door-to-door visualization", buildHash("demo"))
    ),
    el("section", { class: "grid2" },
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Quick actions"),
        el("div", { class: "action-grid" },
          el("a", { class: "button button-primary", href: buildHash("planner") }, "Open garage planner"),
          el("a", { class: "button button-outline", href: buildHash("demo") }, "Start sales demo"),
          el("a", { class: "button button-outline", href: buildHash("jobs", { new: 1 }) }, "New job"),
          el("a", { class: "button button-outline", href: buildHash("inventory", { tab: "loadout" }) }, "Build job loadout")
        ),
        el("p", { class: "sm" }, "Planner tip: drag from the object library, tap an object to edit it, press R to rotate, Delete to remove.")
      ),
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Sample garage"),
        el("h3", {}, "Two-car sample, 22 × 22 ft"),
        el("p", { class: "sub" }, "Motorcycle, bikes, refrigerator, freezer, treadmill, fishing rods, lawn equipment, tool storage, shelving, bins, holiday items, workbench, and trash. Illustrative dimensions, not measurements."),
        el("div", { class: "actions-row" },
          el("a", { class: "button button-outline", href: buildHash("planner", { sample: "before" }) }, "Open before"),
          el("a", { class: "button button-outline", href: buildHash("planner", { sample: "after" }) }, "Open proposed")
        )
      )
    ),
    el("section", { class: "card" },
      el("div", { class: "card-head" },
        el("p", { class: "eyebrow" }, "Recent jobs"),
        el("a", { class: "link", href: buildHash("jobs") }, "All jobs")
      ),
      jobs.length
        ? el("div", { class: "tblwrap" },
            el("table", { class: "tbl stack" },
              el("thead", {}, el("tr", {}, el("th", {}, "Customer"), el("th", {}, "Date"), el("th", {}, "Service"), el("th", {}, "Status"), el("th", {}, ""))),
              el("tbody", {}, ...jobs.slice(0, 6).map((job) =>
                el("tr", {},
                  el("td", { "data-label": "Customer" }, el("b", {}, job.customer || "Untitled"), el("span", { class: "sm block" }, job.address || "")),
                  el("td", { "data-label": "Date" }, formatDate(job.date)),
                  el("td", { "data-label": "Service" }, label(SERVICE_TYPES, job.serviceType)),
                  el("td", { "data-label": "Status" }, el("span", { class: `pill status-${job.status}` }, label(JOB_STATUSES, job.status))),
                  el("td", { "data-label": "" }, el("a", { class: "link", href: buildHash("jobs", { id: job.id }) }, "Open"))
                )
              ))
            )
          )
        : el("p", { class: "sub" }, "No jobs yet. Create one to attach photos, a planner layout, SOP progress, and a loadout.")
    ),
    el("p", { class: "disclaimer" }, "Planning visualization only. Verify actual measurements before installation or construction.")
  );
};
