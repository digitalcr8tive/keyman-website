import { el } from "../util.js";
import { sopProgress } from "../data/sop.js";

/**
 * Interactive staged checklist. `state` is a map of item id -> boolean.
 * Calls onChange(nextState) on every toggle. Re-renders the progress bar in place.
 */
export const renderChecklist = (container, { stages, state, onChange, title = "Progress", compact = false }) => {
  let current = { ...state };

  const progressBox = el("div", { class: "progress-box" });
  const stagesBox = el("div", { class: "stages" });

  const paintProgress = () => {
    const progress = sopProgress(current);
    progressBox.replaceChildren(
      el("div", { class: "progress-head" },
        el("div", {},
          el("p", { class: "eyebrow" }, title),
          el("p", { class: "progress-stage" }, progress.complete ? "All stages complete" : `Current stage · ${progress.currentStage.number}. ${progress.currentStage.title}`)
        ),
        el("div", { class: "progress-pct", "aria-live": "polite" }, `${progress.percent}%`)
      ),
      el("div", { class: "progress-bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": progress.percent },
        el("i", { style: { width: `${progress.percent}%` } })
      ),
      el("div", { class: "progress-meta" },
        el("span", {}, el("b", {}, String(progress.completed)), " completed"),
        el("span", {}, el("b", {}, String(progress.remaining)), " remaining"),
        el("span", {}, el("b", {}, String(progress.total)), " total items")
      )
    );
    stagesBox.querySelectorAll("[data-stage-count]").forEach((node) => {
      const stage = stages.find((entry) => entry.id === node.dataset.stageCount);
      const done = stage.items.filter((item) => current[item.id]).length;
      node.textContent = `${done}/${stage.items.length}`;
      node.closest(".stage")?.classList.toggle("is-complete", done === stage.items.length);
    });
  };

  const toggle = (id, value) => {
    current = { ...current, [id]: value };
    paintProgress();
    onChange?.(current);
  };

  const setStage = (stage, value) => {
    const next = { ...current };
    stage.items.forEach((item) => {
      next[item.id] = value;
    });
    current = next;
    stagesBox.querySelectorAll(`[data-stage="${stage.id}"] input[type=checkbox]`).forEach((box) => {
      box.checked = value;
    });
    paintProgress();
    onChange?.(current);
  };

  stages.forEach((stage) => {
    const list = el("ul", { class: "check-list" },
      ...stage.items.map((item) => {
        const input = el("input", { type: "checkbox", id: `chk-${stage.id}-${item.id}`, checked: Boolean(current[item.id]) });
        input.addEventListener("change", () => toggle(item.id, input.checked));
        return el("li", {}, el("label", { class: "check-item", for: input.id }, input, el("span", {}, item.label)));
      })
    );
    const extras = [];
    if (stage.warning) extras.push(el("p", { class: "callout warn" }, el("b", {}, "Safety: "), stage.warning));
    if (stage.note) extras.push(el("div", { class: "callout" }, el("b", {}, stage.note.title), el("p", {}, stage.note.body)));
    if (stage.categories) extras.push(el("div", { class: "chip-row" }, ...stage.categories.map((name) => el("span", { class: `chip sort-${name.toLowerCase().split(" ")[0]}` }, name))));
    if (stage.zones) extras.push(el("div", { class: "chip-row" }, ...stage.zones.map((name) => el("span", { class: "chip" }, name))));

    const stageEl = el("section", { class: `stage${compact ? " compact" : ""}`, id: `stage-${stage.id}`, dataset: { stage: stage.id } },
      el("header", { class: "stage-head" },
        el("div", {},
          el("p", { class: "eyebrow" }, `Stage ${stage.number}`),
          el("h3", {}, stage.title),
          stage.summary ? el("p", { class: "sub" }, stage.summary) : null
        ),
        el("div", { class: "stage-tools" },
          el("span", { class: "stage-count", dataset: { stageCount: stage.id } }, ""),
          el("button", { type: "button", class: "link-button", onclick: () => setStage(stage, true) }, "Check all"),
          el("button", { type: "button", class: "link-button", onclick: () => setStage(stage, false) }, "Clear")
        )
      ),
      list,
      ...extras
    );
    stagesBox.append(stageEl);
  });

  container.replaceChildren(progressBox, stagesBox);
  paintProgress();
  return {
    getState: () => current,
    setState(next) {
      current = { ...next };
      stagesBox.querySelectorAll("input[type=checkbox]").forEach((box) => {
        const id = box.id.replace(/^chk-[^-]+-/, "");
        box.checked = Boolean(current[id]);
      });
      paintProgress();
    }
  };
};
