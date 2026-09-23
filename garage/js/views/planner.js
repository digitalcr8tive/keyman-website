import { el, toast, copyText, formatFeet, uid } from "../util.js";
import { createPlanner, blankGarage } from "../planner/planner.js";
import { OBJECT_LIBRARY, OBJECT_CATEGORIES, glyphMarkup, objectDef } from "../data/objects.js";
import { sampleGarageBefore, sampleGarageAfter } from "../data/demo.js";
import { layoutRepo, jobsRepo } from "../store.js";
import { encodeLayout, decodeLayout, isShareable } from "../share.js";
import { ZONE_PRESETS, SORT_CATEGORIES } from "../types.js";
import { floorUsage } from "../geometry.js";
import { downloadBlob } from "../components/photos.js";
import { absoluteUrl, buildHash } from "../router.js";

export const render = async (container, { params }) => {
  // ---- resolve starting layout -------------------------------------------
  let garage = null;
  let attachedJobId = params.get("job") || "";
  if (params.get("l")) {
    try {
      garage = (await decodeLayout(params.get("l"))).garage;
      toast("Shared layout opened");
    } catch (error) {
      toast(error.message, "error");
    }
  } else if (params.get("sample") === "before") garage = sampleGarageBefore();
  else if (params.get("sample") === "after") garage = sampleGarageAfter();
  else if (attachedJobId) garage = jobsRepo.get(attachedJobId)?.garage || null;
  if (!garage) garage = layoutRepo.current() || sampleGarageBefore();

  // ---- scaffold -------------------------------------------------------------
  const nameInput = el("input", { class: "layout-name", type: "text", value: garage.name || "", placeholder: "Layout name", "aria-label": "Layout name", maxlength: 80 });
  const undoBtn = el("button", { type: "button", class: "tool", title: "Undo (⌘Z)" }, "Undo");
  const redoBtn = el("button", { type: "button", class: "tool", title: "Redo (⇧⌘Z)" }, "Redo");
  const status = el("span", { class: "tool-status", "aria-live": "polite" });

  const canvasHost = el("div", { class: "planner-canvas" });
  const inspector = el("aside", { class: "inspector", "aria-label": "Selected item" });
  const library = el("aside", { class: "library", "aria-label": "Object library" });
  const dimsPanel = el("details", { class: "dims-panel" }, el("summary", {}, "Garage dimensions"));

  const toolbar = el("div", { class: "toolbar" },
    nameInput,
    el("div", { class: "tool-group" }, undoBtn, redoBtn),
    el("div", { class: "tool-group" },
      el("button", { type: "button", class: "tool", onclick: () => addZoneMenu() }, "+ Zone"),
      el("button", { type: "button", class: "tool", onclick: () => planner.addObject("custom") }, "+ Custom")
    ),
    el("div", { class: "tool-group" },
      el("button", { type: "button", class: "tool", onclick: () => saveLayout() }, "Save"),
      el("button", { type: "button", class: "tool tool-primary", onclick: () => shareLayout() }, "Share link"),
      el("button", { type: "button", class: "tool", onclick: () => exportMenu() }, "Export"),
      el("button", { type: "button", class: "tool", onclick: () => loadMenu() }, "Load")
    ),
    status
  );

  const layout = el("div", { class: "planner-layout" }, library, el("div", { class: "planner-main" }, toolbar, canvasHost, dimsPanel, el("p", { class: "disclaimer" }, "Planning visualization only. Verify actual measurements before installation or construction.")), inspector);
  container.append(
    el("header", { class: "page-head compact" },
      el("p", { class: "eyebrow" }, "Garage Planner"),
      el("h1", {}, "Planner"),
      el("div", { class: "rule" })
    ),
    layout
  );

  // ---- planner instance ----------------------------------------------------
  const persist = (next) => {
    next.name = nameInput.value || next.name;
    layoutRepo.setCurrent(next);
    if (attachedJobId) {
      const job = jobsRepo.get(attachedJobId);
      if (job) {
        job.garage = next;
        jobsRepo.save(job);
      }
    }
    status.textContent = `Saved · ${next.objects.length} objects · ${next.zones.length} zones · ${floorUsage(next)}% floor used`;
    undoBtn.disabled = !planner.canUndo();
    redoBtn.disabled = !planner.canRedo();
  };

  const planner = createPlanner(canvasHost, {
    garage,
    mode: "edit",
    onChange: persist,
    onSelect: paintInspector
  });
  persist(planner.getGarage());
  nameInput.addEventListener("change", () => persist(planner.getGarage()));
  undoBtn.addEventListener("click", () => planner.undo());
  redoBtn.addEventListener("click", () => planner.redo());

  // ---- library ---------------------------------------------------------------
  let activeCategory = "all";
  const libList = el("div", { class: "lib-list" });
  const libTabs = el("div", { class: "lib-tabs", role: "tablist" });
  const paintLibrary = () => {
    libTabs.replaceChildren(
      el("button", { type: "button", class: `chip${activeCategory === "all" ? " is-active" : ""}`, onclick: () => setCategory("all") }, "All"),
      ...OBJECT_CATEGORIES.map((category) => el("button", { type: "button", class: `chip${activeCategory === category.id ? " is-active" : ""}`, onclick: () => setCategory(category.id) }, category.label))
    );
    libList.replaceChildren(
      ...OBJECT_LIBRARY.filter((def) => activeCategory === "all" || def.category === activeCategory).map((def) => {
        const item = el("button", { type: "button", class: "lib-item", style: `color:${def.color}`, title: `Add ${def.name} (${formatFeet(def.width)} × ${formatFeet(def.height)})`, dataset: { type: def.type } },
          el("span", { class: "lib-glyph", html: `<svg viewBox="0 0 100 100" aria-hidden="true">${glyphMarkup(def.type)}</svg>` }),
          el("span", { class: "lib-name" }, def.name),
          el("span", { class: "lib-dims" }, `${def.width} × ${def.height} ft`)
        );
        bindLibraryDrag(item, def.type);
        return item;
      })
    );
  };
  const setCategory = (category) => {
    activeCategory = category;
    paintLibrary();
  };
  library.append(el("p", { class: "eyebrow" }, "Object library"), libTabs, libList, el("p", { class: "sm" }, "Tap to add at the centre, or drag onto the floor."));
  paintLibrary();

  // Drag from the library onto the canvas (pointer events; works for touch).
  let ghost = null;
  function bindLibraryDrag(item, type) {
    let start = null;
    let dragging = false;
    item.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      start = { x: event.clientX, y: event.clientY };
      dragging = false;
      item.setPointerCapture?.(event.pointerId);
    });
    item.addEventListener("pointermove", (event) => {
      if (!start) return;
      const dist = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (!dragging && dist > 8) {
        dragging = true;
        ghost = el("div", { class: "drag-ghost", style: `color:${objectDef(type).color}`, html: `<svg viewBox="0 0 100 100">${glyphMarkup(type)}</svg>` });
        document.body.append(ghost);
      }
      if (dragging && ghost) {
        ghost.style.transform = `translate(${event.clientX - 28}px, ${event.clientY - 28}px)`;
        ghost.classList.toggle("is-over", planner.isPointInside(event.clientX, event.clientY));
        event.preventDefault();
      }
    });
    const finish = (event) => {
      if (!start) return;
      const wasDragging = dragging;
      start = null;
      dragging = false;
      ghost?.remove();
      ghost = null;
      if (wasDragging) {
        if (planner.isPointInside(event.clientX, event.clientY)) planner.addObject(type, planner.pointFromClient(event.clientX, event.clientY));
      } else {
        planner.addObject(type);
      }
    };
    item.addEventListener("pointerup", finish);
    item.addEventListener("pointercancel", () => {
      start = null;
      dragging = false;
      ghost?.remove();
      ghost = null;
    });
  }

  // ---- inspector ---------------------------------------------------------------
  function paintInspector(selected) {
    inspector.replaceChildren(el("p", { class: "eyebrow" }, "Inspector"));
    if (!selected) {
      inspector.append(
        el("p", { class: "sub" }, "Select an object or zone to edit it."),
        el("ul", { class: "hint-list" },
          el("li", {}, "Drag to move · corner handle to resize · top handle to rotate"),
          el("li", {}, "R rotates 90° · Delete removes · ⌘D duplicates · arrows nudge"),
          el("li", {}, "Objects inside a zone are assigned to it automatically")
        )
      );
      return;
    }
    const { item, kind } = selected;
    const current = planner.getGarage();
    const num = (key, labelText, step = 0.5, min = 0.5) => {
      const field = el("input", { type: "number", step, min, value: item[key], inputmode: "decimal", id: `insp-${key}` });
      field.addEventListener("change", () => planner.updateSelected({ [key]: Number(field.value) }));
      return el("div", { class: "field" }, el("label", { for: `insp-${key}` }, labelText), field);
    };
    const name = el("input", { type: "text", value: item.name, maxlength: 60, id: "insp-name" });
    name.addEventListener("change", () => planner.updateSelected({ name: name.value }));
    const color = el("input", { type: "color", value: toHex(item.color || (kind === "object" ? objectDef(item.type).color : item.color)), id: "insp-color" });
    color.addEventListener("input", () => planner.updateSelected({ color: color.value }));

    inspector.append(
      el("h3", {}, kind === "zone" ? "Zone" : objectDef(item.type).name),
      el("div", { class: "field" }, el("label", { for: "insp-name" }, "Label"), name),
      el("div", { class: "form-row" }, num("width", "Width (ft)"), num("height", "Depth (ft)")),
      el("div", { class: "form-row" }, num("x", "From left (ft)", 0.5, 0), num("y", "From rear (ft)", 0.5, 0))
    );
    if (kind === "object") {
      const zoneSelect = el("select", { id: "insp-zone" },
        el("option", { value: "" }, current.zones.length ? "No zone" : "No zones yet"),
        ...current.zones.map((zone) => el("option", { value: zone.id, selected: item.zone === zone.id }, zone.name))
      );
      zoneSelect.addEventListener("change", () => planner.updateSelected({ zone: zoneSelect.value || null }));
      const sortSelect = el("select", { id: "insp-sort" },
        el("option", { value: "" }, "Not sorted"),
        ...SORT_CATEGORIES.map((category) => el("option", { value: category.id, selected: item.sort === category.id }, category.label))
      );
      sortSelect.addEventListener("change", () => planner.updateSelected({ sort: sortSelect.value || undefined }));
      inspector.append(
        el("div", { class: "form-row" },
          num("rotation", "Rotation (°)", 15, -360),
          el("div", { class: "field" }, el("label", { for: "insp-color" }, "Colour"), color)
        ),
        el("div", { class: "form-row" },
          el("div", { class: "field" }, el("label", { for: "insp-zone" }, "Move into zone"), zoneSelect),
          el("div", { class: "field" }, el("label", { for: "insp-sort" }, "Sorting"), sortSelect)
        ),
        el("div", { class: "tool-group wrap" },
          el("button", { type: "button", class: "tool", onclick: () => planner.rotateSelected(-90) }, "↺ 90°"),
          el("button", { type: "button", class: "tool", onclick: () => planner.rotateSelected(90) }, "↻ 90°"),
          el("button", { type: "button", class: "tool", onclick: () => planner.duplicateSelected() }, "Duplicate"),
          el("button", { type: "button", class: "tool danger", onclick: () => planner.deleteSelected() }, "Delete")
        )
      );
    } else {
      inspector.append(
        el("div", { class: "field" }, el("label", { for: "insp-color" }, "Colour"), color),
        el("p", { class: "sm" }, `${current.objects.filter((object) => object.zone === item.id).length} objects in this zone`),
        el("div", { class: "tool-group wrap" },
          el("button", { type: "button", class: "tool", onclick: () => planner.duplicateSelected() }, "Duplicate"),
          el("button", { type: "button", class: "tool danger", onclick: () => planner.deleteSelected() }, "Delete zone")
        )
      );
    }
  }
  paintInspector(null);

  // ---- dimensions panel ----------------------------------------------------------
  const paintDims = () => {
    const current = planner.getGarage();
    const width = el("input", { type: "number", min: 6, max: 120, step: 0.5, value: current.width, id: "dim-w" });
    const depth = el("input", { type: "number", min: 6, max: 120, step: 0.5, value: current.depth, id: "dim-d" });
    const doorWidth = el("input", { type: "number", min: 1, max: 60, step: 0.5, value: current.garageDoor.width, id: "dim-dw" });
    const doorOffset = el("input", { type: "number", min: 0, max: 120, step: 0.5, value: current.garageDoor.offset, id: "dim-do" });
    const doorWall = el("select", { id: "dim-wall" }, ...["front", "rear", "left", "right"].map((wall) => el("option", { value: wall, selected: current.garageDoor.wall === wall }, wall[0].toUpperCase() + wall.slice(1))));
    const grid = el("select", { id: "dim-grid" }, ...[0.5, 1, 2].map((step) => el("option", { value: step, selected: (current.gridFeet || 1) === step }, `${step} ft grid`)));
    const snap = el("input", { type: "checkbox", checked: current.snap !== false, id: "dim-snap" });
    const zones = el("input", { type: "checkbox", checked: true, id: "dim-zones" });
    const labels = el("input", { type: "checkbox", checked: true, id: "dim-labels" });
    const apply = () => planner.setDimensions({ width: width.value, depth: depth.value, garageDoor: { width: doorWidth.value, offset: doorOffset.value, wall: doorWall.value } });
    [width, depth, doorWidth, doorOffset, doorWall].forEach((field) => field.addEventListener("change", apply));
    grid.addEventListener("change", () => planner.setOptions({ gridFeet: Number(grid.value) }));
    snap.addEventListener("change", () => planner.setOptions({ snap: snap.checked }));
    zones.addEventListener("change", () => planner.setOptions({ zones: zones.checked }));
    labels.addEventListener("change", () => planner.setOptions({ labels: labels.checked }));
    const presets = el("div", { class: "chip-row" },
      ...[[12, 20, "1-car 12×20"], [20, 20, "2-car 20×20"], [22, 22, "2-car 22×22"], [24, 24, "2-car 24×24"], [30, 24, "3-car 30×24"]].map(([w, d, text]) =>
        el("button", { type: "button", class: "chip", onclick: () => {
          width.value = w;
          depth.value = d;
          doorWidth.value = Math.min(16, w - 4);
          doorOffset.value = (w - Math.min(16, w - 4)) / 2;
          apply();
        } }, text)
      )
    );
    dimsPanel.querySelector(".dims-body")?.remove();
    dimsPanel.append(el("div", { class: "dims-body" },
      presets,
      el("div", { class: "dims-grid" },
        el("div", { class: "field" }, el("label", { for: "dim-w" }, "Garage width (ft)"), width),
        el("div", { class: "field" }, el("label", { for: "dim-d" }, "Garage depth (ft)"), depth),
        el("div", { class: "field" }, el("label", { for: "dim-dw" }, "Garage door width (ft)"), doorWidth),
        el("div", { class: "field" }, el("label", { for: "dim-do" }, "Door offset from left (ft)"), doorOffset),
        el("div", { class: "field" }, el("label", { for: "dim-wall" }, "Door wall"), doorWall),
        el("div", { class: "field" }, el("label", { for: "dim-grid" }, "Grid"), grid)
      ),
      el("div", { class: "toggle-row" },
        el("label", { class: "check-item" }, snap, el("span", {}, "Snap to grid")),
        el("label", { class: "check-item" }, zones, el("span", {}, "Show zones")),
        el("label", { class: "check-item" }, labels, el("span", {}, "Show labels"))
      )
    ));
  };
  paintDims();

  // ---- menus (simple, native-feeling) --------------------------------------------
  const menu = (title, entries) => {
    document.querySelector(".mini-menu")?.remove();
    const box = el("div", { class: "mini-menu", role: "dialog", "aria-label": title },
      el("p", { class: "eyebrow" }, title),
      ...entries.map(([text, action, cls = ""]) => el("button", { type: "button", class: `menu-item ${cls}`.trim(), onclick: () => {
        box.remove();
        action();
      } }, text)),
      el("button", { type: "button", class: "menu-item muted", onclick: () => box.remove() }, "Cancel")
    );
    document.body.append(box);
    const close = (event) => {
      if (!box.contains(event.target)) {
        box.remove();
        document.removeEventListener("pointerdown", close, true);
      }
    };
    setTimeout(() => document.addEventListener("pointerdown", close, true), 0);
  };

  function addZoneMenu() {
    menu("Add zone", ZONE_PRESETS.map((preset) => [preset.name, () => planner.addZone(preset)]));
  }

  function saveLayout() {
    const current = planner.getGarage();
    current.name = nameInput.value || current.name || "Layout";
    layoutRepo.save(current);
    persist(current);
    const jobs = jobsRepo.all();
    if (jobs.length && !attachedJobId) {
      menu("Saved. Attach to a job?", [
        ...jobs.slice(0, 8).map((job) => [`${job.customer || "Untitled"} · ${job.date || ""}`, () => {
          attachedJobId = job.id;
          persist(planner.getGarage());
          toast(`Attached to ${job.customer || "job"}`);
        }]),
        ["Keep unattached", () => {}]
      ]);
    } else toast("Layout saved on this device");
  }

  async function shareLayout() {
    const current = planner.getGarage();
    const token = await encodeLayout(current, nameInput.value || current.name);
    if (!isShareable(token)) {
      toast("Layout is large; the link may not paste everywhere. Reduce objects or wait for backend sharing.", "error");
    }
    const link = absoluteUrl("client", { l: token });
    menu("Share this layout", [
      ["Copy client link", async () => {
        if (await copyText(link)) toast("Client link copied");
        else prompt("Copy this link", link);
      }],
      ["Open client preview", () => {
        location.hash = buildHash("client", { l: token });
      }],
      ["Copy planner (editable) link", async () => {
        const editable = absoluteUrl("planner", { l: token });
        if (await copyText(editable)) toast("Editable link copied");
        else prompt("Copy this link", editable);
      }]
    ]);
  }

  function exportMenu() {
    const current = planner.getGarage();
    const base = (current.name || "garage-layout").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    menu("Export", [
      ["Download PNG image", async () => {
        try {
          downloadBlob(await planner.toPngBlob(1800), `${base}.png`);
        } catch {
          toast("PNG export failed in this browser; try SVG.", "error");
        }
      }],
      ["Download SVG", () => downloadBlob(new Blob([planner.toSvgString()], { type: "image/svg+xml" }), `${base}.svg`)],
      ["Download JSON", () => downloadBlob(new Blob([JSON.stringify(current, null, 2)], { type: "application/json" }), `${base}.json`)],
      ["Print", () => window.print()]
    ]);
  }

  function loadMenu() {
    const saved = layoutRepo.saved();
    const file = el("input", { type: "file", accept: "application/json", style: "display:none" });
    file.addEventListener("change", async () => {
      try {
        const parsed = JSON.parse(await file.files[0].text());
        if (!parsed.width || !parsed.depth) throw new Error("Not a layout file.");
        parsed.id ||= uid("garage");
        planner.setGarage(parsed);
        nameInput.value = parsed.name || "";
        paintDims();
        toast("Layout imported");
      } catch (error) {
        toast(error.message, "error");
      }
    });
    document.body.append(file);
    menu("Load", [
      ["Sample garage — before", () => load(sampleGarageBefore())],
      ["Sample garage — proposed", () => load(sampleGarageAfter())],
      ["Blank 20 × 20 ft garage", () => load(blankGarage(20, 20))],
      ...saved.map((entry) => [`Saved: ${entry.name || entry.id}`, () => load(entry)]),
      ["Import JSON file…", () => file.click()],
      ["Clear all objects and zones", () => {
        if (confirm("Remove every object and zone from this layout?")) planner.clear();
      }, "danger"]
    ]);
  }

  const load = (next) => {
    planner.setGarage(next);
    nameInput.value = next.name || "";
    paintDims();
  };

  return () => {
    planner.destroy();
    document.querySelector(".mini-menu")?.remove();
    ghost?.remove();
  };
};

const toHex = (color) => {
  if (/^#[0-9a-f]{6}$/i.test(color || "")) return color;
  const probe = document.createElement("span");
  probe.style.color = color || "#6b7280";
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+/g) || [107, 114, 128];
  probe.remove();
  return `#${rgb.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
};
