import { el, toast, copyText } from "../util.js";
import { createPlanner } from "../planner/planner.js";
import { sampleGarageBefore, sampleGarageAfter } from "../data/demo.js";
import { openQuoteDialog } from "../components/quote.js";
import { encodeLayout } from "../share.js";
import { absoluteUrl, buildHash } from "../router.js";

const GOALS = [
  { id: "clean", label: "Clean it", line: "A garage you can walk into without stepping over anything." },
  { id: "organize", label: "Organize it", line: "Everything in a labelled zone so it stays that way." },
  { id: "space", label: "Create more space", line: "Floor back, walls working, storage up and off the ground." },
  { id: "workshop", label: "Create a workshop", line: "A bench, tools within reach, and light where you need it.", zone: "z_workshop" },
  { id: "vehicle", label: "Make room for a vehicle", line: "A clear bay with doors that open and a path around it.", zone: "z_vehicle" },
  { id: "equipment", label: "Store more equipment", line: "Lawn, sports, fishing, seasonal, each with a home.", zone: "z_storage" }
];

const STEPS = ["start", "goal", "example", "move", "zones", "proposed", "reveal", "cta"];

export const render = (container, { params }) => {
  let step = 0;
  let goal = null;
  let planner = null;
  let workingLayout = sampleGarageBefore();
  const stage = el("div", { class: "demo-stage" });
  const dots = el("div", { class: "demo-dots", "aria-hidden": "true" });
  const back = el("button", { type: "button", class: "button button-outline", onclick: () => go(step - 1) }, "Back");
  const next = el("button", { type: "button", class: "button button-primary", onclick: () => go(step + 1) }, "Next");
  const nav = el("div", { class: "demo-nav" }, back, dots, next);

  container.append(el("div", { class: "demo" }, stage, nav));

  const destroyPlanner = () => {
    if (planner) {
      workingLayout = planner.getGarage();
      planner.destroy();
      planner = null;
    }
  };

  const mountPlanner = (garage, mode, options = {}) => {
    const host = el("div", { class: `demo-canvas${options.className ? ` ${options.className}` : ""}` });
    planner = createPlanner(host, { garage, mode, showZones: options.zones ?? true, showLabels: options.labels ?? true });
    return host;
  };

  const go = (target) => {
    destroyPlanner();
    step = Math.max(0, Math.min(STEPS.length - 1, target));
    paint();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paint = () => {
    const name = STEPS[step];
    dots.replaceChildren(...STEPS.map((_, index) => el("i", { class: index === step ? "is-active" : index < step ? "is-done" : "" })));
    back.style.visibility = step === 0 ? "hidden" : "visible";
    next.style.display = name === "cta" || name === "start" || name === "goal" ? "none" : "";
    stage.replaceChildren();

    if (name === "start") {
      stage.append(
        el("div", { class: "demo-hero" },
          el("p", { class: "eyebrow" }, "Sales demo"),
          el("h1", {}, "See your garage, transformed."),
          el("div", { class: "rule center" }),
          el("p", { class: "sub" }, "A two-minute walkthrough: tell us what you want from your garage, then watch it happen on the floor plan."),
          el("button", { type: "button", class: "button button-primary big", onclick: () => go(1) }, "Start demo"),
          el("a", { class: "link sm", href: buildHash("dashboard") }, "Exit demo")
        )
      );
    } else if (name === "goal") {
      stage.append(
        el("div", { class: "demo-hero" },
          el("p", { class: "eyebrow" }, "Step 1"),
          el("h2", {}, "What would you like to do with your garage?"),
          el("div", { class: "goal-grid" }, ...GOALS.map((entry) => el("button", { type: "button", class: `goal-card${goal?.id === entry.id ? " is-active" : ""}`, onclick: () => {
            goal = entry;
            go(2);
          } }, entry.label)))
        )
      );
    } else if (name === "example") {
      workingLayout = sampleGarageBefore();
      stage.append(
        el("div", { class: "demo-head" }, el("p", { class: "eyebrow" }, "Step 2 · Example garage"), el("h2", {}, "Here's a typical two-car garage the way most of them look."), el("p", { class: "sub" }, "Sample garage, about 22 × 22 ft. Illustrative, not measured.")),
        mountPlanner(workingLayout, "view", { zones: false })
      );
    } else if (name === "move") {
      stage.append(
        el("div", { class: "demo-head" }, el("p", { class: "eyebrow" }, "Step 3 · Move things"), el("h2", {}, "Drag anything. Where would you want it?"), el("p", { class: "sub" }, "Tap an object, drag it, use the top handle to rotate. This is the same tool we plan real jobs with.")),
        mountPlanner(workingLayout, "demo", { zones: false }),
        el("div", { class: "tool-group center" },
          el("button", { type: "button", class: "tool", onclick: () => planner?.rotateSelected(90) }, "Rotate"),
          el("button", { type: "button", class: "tool", onclick: () => planner?.deleteSelected() }, "Remove"),
          el("button", { type: "button", class: "tool", onclick: () => planner?.undo() }, "Undo")
        )
      );
    } else if (name === "zones") {
      const proposed = sampleGarageAfter();
      stage.append(
        el("div", { class: "demo-head" }, el("p", { class: "eyebrow" }, "Step 4 · Zones"), el("h2", {}, "First we give every kind of thing a home."), el("p", { class: "sub" }, goal?.zone ? `For "${goal.label.toLowerCase()}" the ${proposed.zones.find((zone) => zone.id === goal.zone)?.name} zone is the anchor.` : "Zones keep the garage organized after we leave.")),
        mountPlanner({ ...proposed, objects: [] }, "view", { className: goal?.zone ? `highlight-${goal.zone}` : "" }),
        el("ul", { class: "zone-legend" }, ...proposed.zones.map((zone) => el("li", { style: `color:${zone.color}`, class: goal?.zone === zone.id ? "is-hot" : "" }, el("i"), zone.name)))
      );
    } else if (name === "proposed") {
      const proposed = sampleGarageAfter();
      stage.append(
        el("div", { class: "demo-head" }, el("p", { class: "eyebrow" }, "Step 5 · Proposed organization"), el("h2", {}, "Then everything goes into its zone."), el("p", { class: "sub" }, goal ? goal.line : "Same items, one afternoon.")),
        mountPlanner(proposed, "view")
      );
    } else if (name === "reveal") {
      const before = el("div", { class: "reveal-pane" });
      const after = el("div", { class: "reveal-pane" });
      const beforePlanner = createPlanner(before, { garage: sampleGarageBefore(), mode: "view", showZones: false, showLabels: false, showGrid: false });
      const afterPlanner = createPlanner(after, { garage: sampleGarageAfter(), mode: "view", showLabels: false, showGrid: false });
      planner = { getGarage: afterPlanner.getGarage, destroy: () => {
        beforePlanner.destroy();
        afterPlanner.destroy();
      } };
      stage.append(
        el("div", { class: "demo-hero" },
          el("p", { class: "eyebrow" }, "Step 6"),
          el("h1", { class: "reveal-title" }, "This is what your garage could look like."),
          el("div", { class: "rule center" })
        ),
        el("div", { class: "reveal" },
          el("figure", {}, before, el("figcaption", {}, "Before")),
          el("figure", {}, after, el("figcaption", {}, "Proposed"))
        )
      );
    } else if (name === "cta") {
      stage.append(
        el("div", { class: "demo-hero" },
          el("p", { class: "eyebrow" }, goal ? goal.label : "Your garage"),
          el("h1", {}, "Schedule your garage transformation."),
          el("div", { class: "rule center" }),
          el("p", { class: "sub" }, "We clean, sort, and organize into zones, with before and after photos and a plan you can keep."),
          el("button", { type: "button", class: "button button-primary big", onclick: () => openQuoteDialog({ planLink: absoluteUrl("client"), subject: "Garage transformation booking request", heading: "Schedule your garage transformation" }) }, "Schedule your garage transformation"),
          el("div", { class: "actions-row center" },
            el("button", { type: "button", class: "button button-outline", onclick: async () => {
              const token = await encodeLayout(sampleGarageAfter(), "Proposed garage plan");
              const link = absoluteUrl("client", { l: token });
              if (await copyText(link)) toast("Plan link copied");
              else prompt("Copy this link", link);
            } }, "Copy plan link"),
            el("button", { type: "button", class: "button button-outline", onclick: () => {
              goal = null;
              go(0);
            } }, "Restart demo")
          )
        )
      );
    }
  };

  if (params.get("step")) step = Math.max(0, Math.min(STEPS.length - 1, Number(params.get("step")) || 0));
  paint();
  return () => destroyPlanner();
};
