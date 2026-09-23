import { el, uid, toast } from "../util.js";
import { inventoryRepo, jobsRepo } from "../store.js";
import { DEFAULT_INVENTORY, INVENTORY_CATEGORIES, stockStatus, STOCK_LABELS } from "../data/inventory.js";
import { buildLoadout, LOADOUT_PLANS } from "../loadout.js";
import { SERVICE_TYPES } from "../types.js";

export const render = (container, { params }) => {
  let items = inventoryRepo.all(DEFAULT_INVENTORY);
  let category = params.get("category") || "all";
  let status = params.get("status") || "all";
  let tab = params.get("tab") === "loadout" ? "loadout" : "stock";
  let loadoutType = params.get("type") || "full-transformation";
  let loadoutChecks = {};
  let search = "";

  const persist = () => inventoryRepo.saveAll(items);

  const head = el("header", { class: "page-head" },
    el("p", { class: "eyebrow" }, "Inventory"),
    el("h1", {}, "Supplies"),
    el("div", { class: "rule" }),
    el("p", { class: "sub" }, "Quantities on hand versus the minimum you want on the truck. Adjust counts as you use supplies; anything under minimum flags for reorder.")
  );

  const tabs = el("div", { class: "seg", role: "tablist" },
    el("button", { type: "button", role: "tab", "aria-pressed": String(tab === "stock"), onclick: () => switchTab("stock") }, "Stock"),
    el("button", { type: "button", role: "tab", "aria-pressed": String(tab === "loadout"), onclick: () => switchTab("loadout") }, "Build job loadout")
  );
  const body = el("div", { class: "tab-body" });

  const switchTab = (next) => {
    tab = next;
    tabs.querySelectorAll("button").forEach((button, index) => button.setAttribute("aria-pressed", String((index === 0 ? "stock" : "loadout") === tab)));
    paint();
  };

  // ---- Stock tab -------------------------------------------------------------

  const summary = () => {
    const counts = { "in-stock": 0, "low-stock": 0, reorder: 0 };
    items.forEach((item) => {
      counts[stockStatus(item)] += 1;
    });
    return el("div", { class: "status-strip" },
      ...Object.entries(counts).map(([key, count]) =>
        el("button", { type: "button", class: `status-chip ${key}${status === key ? " is-active" : ""}`, onclick: () => {
          status = status === key ? "all" : key;
          paint();
        } }, el("b", {}, String(count)), STOCK_LABELS[key])
      )
    );
  };

  const filters = () =>
    el("div", { class: "filters" },
      el("div", { class: "chip-row" },
        el("button", { type: "button", class: `chip${category === "all" ? " is-active" : ""}`, onclick: () => {
          category = "all";
          paint();
        } }, "All"),
        ...INVENTORY_CATEGORIES.map((entry) => el("button", { type: "button", class: `chip${category === entry.id ? " is-active" : ""}`, onclick: () => {
          category = entry.id;
          paint();
        } }, entry.label))
      ),
      el("input", { class: "search", type: "search", placeholder: "Search supplies", value: search, oninput: (event) => {
        search = event.target.value.toLowerCase();
        paintRows();
      } })
    );

  const rowsHost = el("div", { class: "inv-list" });

  const paintRows = () => {
    const visible = items.filter((item) =>
      (category === "all" || item.category === category) &&
      (status === "all" || stockStatus(item) === status) &&
      (!search || item.name.toLowerCase().includes(search))
    );
    const groups = INVENTORY_CATEGORIES.filter((entry) => visible.some((item) => item.category === entry.id));
    rowsHost.replaceChildren(
      ...(groups.length ? groups : []).map((group) =>
        el("section", { class: "inv-group" },
          el("h3", {}, group.label),
          ...visible.filter((item) => item.category === group.id).map(renderRow)
        )
      ),
      groups.length ? null : el("p", { class: "sub" }, "No supplies match this filter.")
    );
  };

  const renderRow = (item) => {
    const state = stockStatus(item);
    const qty = el("input", { type: "number", min: 0, step: 1, value: item.quantity, "aria-label": `${item.name} quantity`, inputmode: "numeric" });
    const setQty = (value) => {
      item.quantity = Math.max(0, Number.isFinite(value) ? value : 0);
      qty.value = item.quantity;
      persist();
      pill.className = `pill stock-${stockStatus(item)}`;
      pill.textContent = STOCK_LABELS[stockStatus(item)];
      row.dataset.status = stockStatus(item);
      strip.replaceWith(strip = summary());
    };
    qty.addEventListener("change", () => setQty(Number.parseInt(qty.value, 10)));
    const min = el("input", { type: "number", min: 0, step: 1, value: item.minimumQuantity, "aria-label": `${item.name} minimum`, inputmode: "numeric" });
    min.addEventListener("change", () => {
      item.minimumQuantity = Math.max(0, Number.parseInt(min.value, 10) || 0);
      setQty(item.quantity);
    });
    const loaded = el("input", { type: "checkbox", checked: item.loaded, "aria-label": `${item.name} loaded` });
    loaded.addEventListener("change", () => {
      item.loaded = loaded.checked;
      persist();
    });
    const notes = el("input", { type: "text", class: "notes", value: item.notes || "", placeholder: "Notes", "aria-label": `${item.name} notes` });
    notes.addEventListener("change", () => {
      item.notes = notes.value;
      persist();
    });
    let pill = el("span", { class: `pill stock-${state}` }, STOCK_LABELS[state]);
    const row = el("div", { class: "inv-row", dataset: { status: state } },
      el("div", { class: "inv-name" }, el("b", {}, item.name), el("span", { class: "sm" }, `${INVENTORY_CATEGORIES.find((entry) => entry.id === item.category)?.label || item.category} · per ${item.unit}`)),
      el("div", { class: "qty" },
        el("button", { type: "button", "aria-label": "Decrease", onclick: () => setQty(item.quantity - 1) }, "−"),
        qty,
        el("button", { type: "button", "aria-label": "Increase", onclick: () => setQty(item.quantity + 1) }, "+")
      ),
      el("label", { class: "min" }, el("span", { class: "sm" }, "Min"), min),
      pill,
      notes,
      el("label", { class: "loaded" }, loaded, el("span", {}, "Loaded")),
      el("button", { type: "button", class: "icon-button", "aria-label": `Remove ${item.name}`, onclick: () => {
        if (!confirm(`Remove ${item.name} from inventory?`)) return;
        items = items.filter((entry) => entry.id !== item.id);
        persist();
        paint();
      } }, "×")
    );
    return row;
  };

  let strip = summary();

  const addForm = () => {
    const name = el("input", { type: "text", placeholder: "Item name", required: true, maxlength: 80 });
    const cat = el("select", {}, ...INVENTORY_CATEGORIES.map((entry) => el("option", { value: entry.id }, entry.label)));
    const qty = el("input", { type: "number", min: 0, value: 1, "aria-label": "Quantity" });
    const min = el("input", { type: "number", min: 0, value: 1, "aria-label": "Minimum" });
    const unit = el("input", { type: "text", value: "each", "aria-label": "Unit", maxlength: 20 });
    return el("form", { class: "add-row", onsubmit: (event) => {
      event.preventDefault();
      if (!name.value.trim()) return;
      items.push({ id: uid("inv"), name: name.value.trim(), category: cat.value, quantity: Number(qty.value) || 0, minimumQuantity: Number(min.value) || 0, unit: unit.value || "each", notes: "", loaded: false });
      persist();
      toast("Supply added");
      paint();
    } },
      name, cat, qty, min, unit,
      el("button", { type: "submit", class: "button button-outline" }, "Add supply")
    );
  };

  const stockTab = () =>
    el("div", {},
      strip,
      filters(),
      rowsHost,
      el("div", { class: "card" }, el("p", { class: "eyebrow" }, "Add a supply"), addForm()),
      el("div", { class: "actions-row" },
        el("button", { type: "button", class: "button button-outline", onclick: () => {
          items.forEach((item) => {
            item.loaded = false;
          });
          persist();
          paint();
          toast("Loaded flags cleared");
        } }, "Clear loaded flags"),
        el("button", { type: "button", class: "button button-outline", onclick: () => {
          if (!confirm("Reset inventory to the default list? Your counts and notes will be replaced.")) return;
          items = structuredClone(DEFAULT_INVENTORY);
          inventoryRepo.reset(items);
          paint();
        } }, "Reset to defaults")
      )
    );

  // ---- Loadout tab -----------------------------------------------------------

  const loadoutTab = () => {
    const plan = buildLoadout(loadoutType, items);
    const jobs = jobsRepo.all();
    const jobSelect = el("select", { "aria-label": "Attach to job" },
      el("option", { value: "" }, jobs.length ? "Attach to a job…" : "No jobs yet"),
      ...jobs.map((job) => el("option", { value: job.id }, `${job.customer || "Untitled"} · ${job.date || "no date"}`))
    );
    const total = plan.groups.reduce((sum, group) => sum + group.items.length, 0);
    const doneCount = () => plan.groups.reduce((sum, group) => sum + group.items.filter((item) => loadoutChecks[item.id]).length, 0);
    const counter = el("span", { class: "stage-count" }, `${doneCount()}/${total} loaded`);

    const list = el("div", { class: "loadout-groups" },
      ...plan.groups.map((group) =>
        el("section", { class: "card loadout-group" },
          el("h3", {}, group.name),
          el("ul", { class: "check-list" },
            ...group.items.map((item) => {
              const box = el("input", { type: "checkbox", id: `lo-${item.id}`, checked: Boolean(loadoutChecks[item.id]) });
              box.addEventListener("change", () => {
                loadoutChecks[item.id] = box.checked;
                counter.textContent = `${doneCount()}/${total} loaded`;
              });
              return el("li", {}, el("label", { class: "check-item", for: box.id }, box, el("span", {}, item.name, item.available ? "" : el("span", { class: "pill stock-reorder" }, "Out of stock"))));
            })
          )
        )
      )
    );

    return el("div", {},
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Job type"),
        el("div", { class: "type-grid" },
          ...SERVICE_TYPES.map((type) => el("button", { type: "button", class: `type-card${loadoutType === type.id ? " is-active" : ""}`, onclick: () => {
            loadoutType = type.id;
            loadoutChecks = {};
            paint();
          } }, el("b", {}, type.label), el("span", { class: "sm" }, type.summary)))
        )
      ),
      el("div", { class: "card-head" },
        el("h2", {}, `${LOADOUT_PLANS[loadoutType].label} loadout`),
        counter
      ),
      list,
      el("div", { class: "actions-row" },
        el("button", { type: "button", class: "button button-outline", onclick: () => {
          plan.groups.forEach((group) => group.items.forEach((item) => {
            loadoutChecks[item.id] = true;
          }));
          paint();
        } }, "Check all"),
        el("button", { type: "button", class: "button button-outline", onclick: () => {
          plan.groups.forEach((group) => group.items.forEach((item) => {
            const entry = items.find((inv) => inv.id === item.id);
            if (entry) entry.loaded = Boolean(loadoutChecks[item.id]);
          }));
          persist();
          toast("Loaded flags written to inventory");
        } }, "Mark loaded in inventory"),
        jobSelect,
        el("button", { type: "button", class: "button button-primary", onclick: () => {
          const job = jobsRepo.get(jobSelect.value);
          if (!job) {
            toast("Pick a job first", "error");
            return;
          }
          job.loadoutType = loadoutType;
          job.inventoryLoadout = { ...loadoutChecks };
          jobsRepo.save(job);
          toast(`Loadout attached to ${job.customer || "job"}`);
        } }, "Attach to job")
      )
    );
  };

  const paint = () => {
    body.replaceChildren(tab === "stock" ? stockTab() : loadoutTab());
    if (tab === "stock") paintRows();
  };

  container.append(head, tabs, body);
  paint();
};
