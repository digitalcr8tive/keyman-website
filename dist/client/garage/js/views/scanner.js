import { el } from "../util.js";
import { SCAN_STAGES, PIPELINE, isScannerAvailable } from "../scanner/types.js";

const CONTRACTS = [
  ["CameraFrameSource", "start / stop / onFrame(frame)", "Wraps getUserMedia or an AR session and streams CameraFrame objects."],
  ["VisionProvider", "detectGeometry(frames) · detectObjects(frames, geometry)", "The only module that touches ML. Returns RoomGeometry and DetectedObject[] in feet."],
  ["RoomGeometry", "walls · openings · floor · ceilingHeight", "Walls as segments, openings typed as garage door / entry door / window."],
  ["GarageModelBuilder", "build(geometry, objects) → Garage · checkClearances(garage)", "Produces the same Garage shape the planner already edits, plus clearance issues."],
  ["ScanSession", "stage · frames · geometry · detections · garage", "State machine the UI binds to: idle → capturing → geometry → objects → model → planner → proposal."]
];

export const render = (container) => {
  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, "Future"),
      el("h1", {}, "Room Scanner ", el("span", { class: "pill amber" }, isScannerAvailable() ? "Provider registered" : "Coming soon")),
      el("div", { class: "rule" }),
      el("p", { class: "sub" }, "Scan a garage with a phone camera and land directly in the planner with walls, door, and objects already placed. Nothing on this page performs computer vision yet; it defines the workflow and the interfaces a scanner will plug into.")
    ),
    el("section", { class: "grid2" },
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Future workflow"),
        el("ol", { class: "numbered" }, ...SCAN_STAGES.map((stage) => el("li", {}, el("span", { class: "num" }, String(stage.step).padStart(2, "0")), stage.label)))
      ),
      el("div", { class: "card" },
        el("p", { class: "eyebrow" }, "Pipeline"),
        el("div", { class: "pipeline" }, ...PIPELINE.flatMap((step, index) => [el("span", { class: `pipe-node${index >= 5 ? " is-built" : ""}` }, step), index < PIPELINE.length - 1 ? el("span", { class: "pipe-arrow", "aria-hidden": "true" }, "↓") : null])),
        el("p", { class: "sm" }, "Planner and Client Proposal already exist in this app. A scanner only has to produce a Garage object.")
      )
    ),
    el("section", { class: "card" },
      el("p", { class: "eyebrow" }, "Module contracts (garage/js/scanner/types.js)"),
      el("div", { class: "tblwrap" },
        el("table", { class: "tbl" },
          el("thead", {}, el("tr", {}, el("th", {}, "Interface"), el("th", {}, "Surface"), el("th", {}, "Responsibility"))),
          el("tbody", {}, ...CONTRACTS.map(([name, surface, role]) => el("tr", {}, el("td", {}, el("code", {}, name)), el("td", {}, el("code", {}, surface)), el("td", {}, role))))
        )
      ),
      el("p", { class: "sm" }, "The planner consumes Garage objects from any source: manual entry today, a scanner tomorrow. Register a provider with registerVisionProvider() and this page switches from Coming Soon to a live scan flow.")
    )
  );
};
