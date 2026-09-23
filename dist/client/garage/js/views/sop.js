import { el } from "../util.js";
import { SOP_STAGES, SAFETY_RULES } from "../data/sop.js";
import { sopRepo } from "../store.js";
import { renderChecklist } from "../components/checklist.js";

export const render = (container) => {
  const checklistHost = el("div", { class: "checklist-host" });

  container.append(
    el("header", { class: "page-head" },
      el("p", { class: "eyebrow" }, "Operations"),
      el("h1", {}, "Garage Cleaning SOP"),
      el("div", { class: "rule" }),
      el("p", { class: "sub" }, "The standard operating procedure for a garage cleaning and organization job, in ten stages. Every item is checkable and the state is saved on this device.")
    ),
    el("section", { class: "card safety" },
      el("p", { class: "eyebrow" }, "General safety"),
      el("ul", { class: "safety-list" }, ...SAFETY_RULES.map((rule) => el("li", {}, rule))),
      el("p", { class: "sm" }, "This guidance is general. It does not replace product labels, SDS documents, or hazardous-material handling procedures.")
    ),
    el("nav", { class: "stage-nav", "aria-label": "SOP stages" },
      ...SOP_STAGES.map((stage) => el("a", { href: `#stage-${stage.id}`, onclick: (event) => {
        event.preventDefault();
        document.getElementById(`stage-${stage.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } }, `${stage.number}. ${stage.title}`))
    ),
    checklistHost,
    el("div", { class: "actions-row" },
      el("button", { type: "button", class: "button button-outline", onclick: () => {
        if (!confirm("Clear every checked item in the master SOP?")) return;
        sopRepo.set({});
        checklist.setState({});
      } }, "Reset checklist")
    )
  );

  const checklist = renderChecklist(checklistHost, {
    stages: SOP_STAGES,
    state: sopRepo.get(),
    title: "Master SOP progress",
    onChange: (state) => sopRepo.set(state)
  });
};
