import { el, uid, formatDate, todayIso, toast } from "../util.js";
import { jobsRepo, layoutRepo } from "../store.js";
import { SERVICE_TYPES, JOB_STATUSES } from "../types.js";
import { PHOTO_ANGLES, sopProgress } from "../data/sop.js";
import { sampleGarageAfter } from "../data/demo.js";
import { readAndDownscale } from "../components/photos.js";
import { encodeLayout } from "../share.js";
import { buildHash, navigate, absoluteUrl } from "../router.js";
import { copyText } from "../util.js";

const label = (list, id) => list.find((entry) => entry.id === id)?.label || id;

export const newJob = () => ({
  id: uid("job"),
  customer: "",
  address: "",
  date: todayIso(),
  serviceType: "full-transformation",
  status: "lead",
  garage: null,
  beforePhotos: [],
  afterPhotos: [],
  sopProgress: {},
  inventoryLoadout: {},
  loadoutType: null,
  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const render = (container, { params }) => {
  const id = params.get("id");
  if (params.get("new")) {
    const job = jobsRepo.save(newJob());
    navigate("jobs", { id: job.id });
    return;
  }
  if (id) renderDetail(container, id);
  else renderList(container, params.get("status") || "all");
};

const renderList = (container, statusFilter) => {
  const jobs = jobsRepo.all().filter((job) => statusFilter === "all" || job.status === statusFilter);
  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, "Jobs"),
      el("h1", {}, "Job records"),
      el("div", { class: "rule" }),
      el("p", { class: "sub" }, "Each job carries the customer, before and after photos, the planner layout, SOP progress, and the supply loadout.")
    ),
    el("div", { class: "filters" },
      el("div", { class: "chip-row" },
        el("a", { class: `chip${statusFilter === "all" ? " is-active" : ""}`, href: buildHash("jobs") }, "All"),
        ...JOB_STATUSES.map((status) => el("a", { class: `chip${statusFilter === status.id ? " is-active" : ""}`, href: buildHash("jobs", { status: status.id }) }, status.label))
      ),
      el("a", { class: "button button-primary", href: buildHash("jobs", { new: 1 }) }, "New job")
    ),
    jobs.length
      ? el("div", { class: "tblwrap" },
          el("table", { class: "tbl stack" },
            el("thead", {}, el("tr", {}, el("th", {}, "Customer"), el("th", {}, "Date"), el("th", {}, "Service"), el("th", {}, "SOP"), el("th", {}, "Status"), el("th", {}, ""))),
            el("tbody", {}, ...jobs.map((job) => {
              const progress = sopProgress(job.sopProgress || {});
              return el("tr", {},
                el("td", { "data-label": "Customer" }, el("b", {}, job.customer || "Untitled"), el("span", { class: "sm block" }, job.address || "")),
                el("td", { "data-label": "Date" }, formatDate(job.date)),
                el("td", { "data-label": "Service" }, label(SERVICE_TYPES, job.serviceType)),
                el("td", { "data-label": "SOP" }, `${progress.percent}%`),
                el("td", { "data-label": "Status" }, el("span", { class: `pill status-${job.status}` }, label(JOB_STATUSES, job.status))),
                el("td", { "data-label": "" }, el("a", { class: "link", href: buildHash("jobs", { id: job.id }) }, "Open"))
              );
            }))
          )
        )
      : el("p", { class: "sub" }, "No jobs in this view.")
  );
};

const renderDetail = (container, id) => {
  const job = jobsRepo.get(id);
  if (!job) {
    container.append(el("p", { class: "sub" }, "Job not found."), el("a", { class: "button button-outline", href: buildHash("jobs") }, "Back to jobs"));
    return;
  }
  const save = (patch = {}) => {
    Object.assign(job, patch);
    jobsRepo.save(job);
  };

  const input = (name, labelText, type = "text", extra = {}) => {
    const field = type === "textarea"
      ? el("textarea", { id: `job-${name}`, rows: 4, ...extra }, job[name] || "")
      : el("input", { id: `job-${name}`, type, value: job[name] || "", ...extra });
    field.addEventListener("change", () => save({ [name]: field.value }));
    return el("div", { class: "field" }, el("label", { for: `job-${name}` }, labelText), field);
  };
  const select = (name, labelText, options) => {
    const field = el("select", { id: `job-${name}` }, ...options.map((option) => el("option", { value: option.id, selected: job[name] === option.id }, option.label)));
    field.addEventListener("change", () => {
      save({ [name]: field.value });
      statusPill.className = `pill status-${job.status}`;
      statusPill.textContent = label(JOB_STATUSES, job.status);
    });
    return el("div", { class: "field" }, el("label", { for: `job-${name}` }, labelText), field);
  };
  const statusPill = el("span", { class: `pill status-${job.status}` }, label(JOB_STATUSES, job.status));

  const photoSection = (kind, title) => {
    const list = el("div", { class: "photo-grid" });
    const paint = () => {
      list.replaceChildren(
        ...job[kind].map((photo) =>
          el("figure", { class: "photo" },
            el("img", { src: photo.dataUrl, alt: `${photo.label} ${title.toLowerCase()} photo` }),
            el("figcaption", {}, photo.label, el("button", { type: "button", class: "link-button", onclick: () => {
              job[kind] = job[kind].filter((entry) => entry.id !== photo.id);
              save();
              paint();
            } }, "Remove"))
          )
        ),
        job[kind].length ? null : el("p", { class: "sm" }, `No ${title.toLowerCase()} photos yet. Shoot the six standard angles.`)
      );
    };
    const angle = el("select", { "aria-label": "Photo angle" }, ...PHOTO_ANGLES.map((name) => el("option", { value: name }, name)), el("option", { value: "Detail" }, "Detail"));
    const file = el("input", { type: "file", accept: "image/*", capture: "environment", multiple: true, "aria-label": `Add ${title.toLowerCase()} photo` });
    file.addEventListener("change", async () => {
      for (const entry of file.files) {
        try {
          const dataUrl = await readAndDownscale(entry);
          job[kind].push({ id: uid("photo"), label: angle.value, dataUrl, takenAt: new Date().toISOString() });
        } catch (error) {
          toast(error.message, "error");
        }
      }
      if (!jobsRepo.save(job)) toast("Photo could not be saved (storage full)", "error");
      file.value = "";
      paint();
    });
    paint();
    return el("section", { class: "card" },
      el("div", { class: "card-head" }, el("p", { class: "eyebrow" }, title), el("div", { class: "photo-add" }, angle, file)),
      list
    );
  };

  const layoutCard = () => {
    const host = el("div", {});
    const paint = () => {
      const current = layoutRepo.current();
      host.replaceChildren(
        job.garage
          ? el("p", { class: "sub" }, el("b", {}, job.garage.name || "Layout"), ` · ${job.garage.width} × ${job.garage.depth} ft · ${job.garage.objects.length} objects · ${job.garage.zones.length} zones`)
          : el("p", { class: "sub" }, "No planner layout attached."),
        el("div", { class: "actions-row" },
          job.garage ? el("a", { class: "button button-primary", href: buildHash("planner", { job: job.id }) }, "Open in planner") : null,
          current ? el("button", { type: "button", class: "button button-outline", onclick: () => {
            save({ garage: current });
            toast("Current planner layout attached");
            paint();
          } }, "Attach current planner layout") : null,
          el("button", { type: "button", class: "button button-outline", onclick: () => {
            save({ garage: sampleGarageAfter() });
            paint();
          } }, "Use sample layout"),
          job.garage ? el("button", { type: "button", class: "button button-outline", onclick: async () => {
            const token = await encodeLayout(job.garage, job.customer ? `${job.customer}'s garage` : "");
            const link = absoluteUrl("client", { l: token });
            if (await copyText(link)) toast("Client link copied");
            else prompt("Copy this client link", link);
          } }, "Copy client link") : null,
          job.garage ? el("a", { class: "button button-outline", href: buildHash("client", { job: job.id }) }, "Client preview") : null
        )
      );
    };
    paint();
    return el("section", { class: "card" }, el("p", { class: "eyebrow" }, "Planner layout"), host);
  };

  const progress = sopProgress(job.sopProgress || {});
  const loadoutCount = Object.values(job.inventoryLoadout || {}).filter(Boolean).length;

  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, el("a", { href: buildHash("jobs") }, "Jobs"), " / ", job.id),
      el("h1", {}, job.customer || "Untitled job", " ", statusPill),
      el("div", { class: "rule" })
    ),
    el("section", { class: "grid2" },
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Customer & scope"),
        el("div", { class: "catalog-form" },
          el("div", { class: "form-row" }, input("customer", "Customer", "text", { maxlength: 120, autocomplete: "off" }), input("date", "Date", "date")),
          input("address", "Address", "text", { maxlength: 200 }),
          el("div", { class: "form-row" }, select("serviceType", "Service type", SERVICE_TYPES), select("status", "Status", JOB_STATUSES)),
          input("notes", "Internal notes (never shared)", "textarea", { maxlength: 4000 })
        )
      ),
      el("div", { class: "stack-cards" },
        el("div", { class: "card" },
          el("p", { class: "eyebrow" }, "SOP completion"),
          el("div", { class: "progress-bar" }, el("i", { style: { width: `${progress.percent}%` } })),
          el("p", { class: "sub" }, `${progress.percent}% · ${progress.completed} of ${progress.total} items`),
          el("a", { class: "button button-outline", href: buildHash("checklist", { job: job.id }) }, "Open job checklist")
        ),
        el("div", { class: "card" },
          el("p", { class: "eyebrow" }, "Inventory loadout"),
          el("p", { class: "sub" }, job.loadoutType ? `${label(SERVICE_TYPES, job.loadoutType)} · ${loadoutCount} items loaded` : "No loadout attached."),
          el("a", { class: "button button-outline", href: buildHash("inventory", { tab: "loadout", type: job.serviceType }) }, "Build loadout")
        )
      )
    ),
    layoutCard(),
    photoSection("beforePhotos", "Before photos"),
    photoSection("afterPhotos", "After photos"),
    el("div", { class: "actions-row" },
      el("button", { type: "button", class: "button button-outline danger", onclick: () => {
        if (!confirm(`Delete the job for ${job.customer || "this customer"}? This cannot be undone.`)) return;
        jobsRepo.remove(job.id);
        navigate("jobs");
      } }, "Delete job")
    )
  );
};
