import { el, toast } from "../util.js";
import { jobsRepo, inventoryRepo } from "../store.js";
import { SOP_STAGES } from "../data/sop.js";
import { DEFAULT_INVENTORY } from "../data/inventory.js";
import { buildLoadout } from "../loadout.js";
import { renderChecklist } from "../components/checklist.js";
import { buildHash, navigate } from "../router.js";

export const render = (container, { params }) => {
  const jobs = jobsRepo.all();
  const jobId = params.get("job") || jobs[0]?.id || "";
  const job = jobsRepo.get(jobId);

  const picker = el("select", { "aria-label": "Job" },
    el("option", { value: "" }, jobs.length ? "Select a job…" : "No jobs yet"),
    ...jobs.map((entry) => el("option", { value: entry.id, selected: entry.id === jobId }, `${entry.customer || "Untitled"} · ${entry.date || "no date"}`))
  );
  picker.addEventListener("change", () => navigate("checklist", { job: picker.value }));

  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, "Operations"),
      el("h1", {}, "Job Checklist"),
      el("div", { class: "rule" }),
      el("p", { class: "sub" }, "The SOP run against a specific job. Progress saves to the job record, separate from the master SOP.")
    ),
    el("div", { class: "filters" }, picker, el("a", { class: "button button-outline", href: buildHash("jobs", { new: 1 }) }, "New job"))
  );

  if (!job) {
    container.append(el("p", { class: "sub" }, "Create or select a job to start its checklist."));
    return;
  }

  const inventory = inventoryRepo.all(DEFAULT_INVENTORY);
  const plan = job.loadoutType ? buildLoadout(job.loadoutType, inventory) : null;
  const loadoutHost = el("div", { class: "card" },
    el("div", { class: "card-head" }, el("p", { class: "eyebrow" }, "Loadout for this job"), el("a", { class: "link", href: buildHash("inventory", { tab: "loadout", type: job.serviceType }) }, "Build / change")),
    plan
      ? el("div", { class: "loadout-inline" }, ...plan.groups.map((group) =>
          el("div", {}, el("b", {}, group.name), el("ul", { class: "check-list" }, ...group.items.map((item) => {
            const box = el("input", { type: "checkbox", id: `jl-${item.id}`, checked: Boolean(job.inventoryLoadout?.[item.id]) });
            box.addEventListener("change", () => {
              job.inventoryLoadout = { ...(job.inventoryLoadout || {}), [item.id]: box.checked };
              jobsRepo.save(job);
            });
            return el("li", {}, el("label", { class: "check-item", for: box.id }, box, el("span", {}, item.name)));
          })))
        ))
      : el("p", { class: "sub" }, "No loadout attached yet.")
  );

  const host = el("div", { class: "checklist-host" });
  container.append(loadoutHost, host,
    el("div", { class: "actions-row" },
      el("button", { type: "button", class: "button button-primary", onclick: () => {
        job.status = "completed";
        jobsRepo.save(job);
        toast("Job marked complete");
        navigate("jobs", { id: job.id });
      } }, "Mark job complete"),
      el("a", { class: "button button-outline", href: buildHash("jobs", { id: job.id }) }, "Open job record")
    )
  );
  renderChecklist(host, {
    stages: SOP_STAGES,
    state: job.sopProgress || {},
    title: `${job.customer || "Job"} · SOP progress`,
    onChange: (state) => {
      job.sopProgress = state;
      if (job.status === "scheduled") job.status = "in-progress";
      jobsRepo.save(job);
    }
  });
};
