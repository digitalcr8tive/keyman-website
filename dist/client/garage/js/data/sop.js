// Garage cleaning & organization Standard Operating Procedure.
// Item ids are stable strings; checklist state is keyed on them.

export const SAFETY_RULES = [
  "Do not mix cleaning chemicals.",
  "Follow every product label and Safety Data Sheet (SDS).",
  "Use appropriate PPE for the task: gloves, eye protection, and respiratory protection where the label calls for it.",
  "Do not handle unknown hazardous materials as ordinary trash.",
  "Escalate suspected mold, chemical hazards, sharps, biological waste, or other hazardous materials to the job lead. Do not attempt cleanup.",
  "Do not move extremely heavy objects without appropriate equipment or help.",
  "Protect customer property. Cover or move items at risk before wet work.",
  "Photograph pre-existing damage before beginning any work."
];

export const PHOTO_ANGLES = [
  "Front-left",
  "Front-center",
  "Front-right",
  "Rear-left",
  "Rear-center",
  "Rear-right"
];

const items = (stage, labels) => labels.map((label, index) => ({ id: `${stage}-${index + 1}`, label }));

export const SOP_STAGES = [
  {
    id: "pre",
    number: 1,
    title: "Pre-Job",
    summary: "Confirm the job before anyone lifts a broom.",
    items: items("pre", [
      "Confirm customer name",
      "Confirm address",
      "Confirm appointment",
      "Confirm scope of work",
      "Ask whether customer wants cleaning only or cleaning + organization",
      "Ask whether customer wants disposal/donation service",
      "Ask about hazardous materials",
      "Ask about valuable or fragile items",
      "Confirm access to garage",
      "Confirm electricity availability",
      "Confirm water availability",
      "Photograph garage before work begins",
      "Create before-photo record",
      "Identify items requiring customer decision"
    ]),
    note: {
      title: "Do Not Touch / Customer Decision",
      body: "Anything the customer has not explicitly cleared is a Customer Decision item. Tag it, leave it in place, and add it to the decision list for the walkthrough. Never discard, donate, or relocate an untagged item."
    }
  },
  {
    id: "doc",
    number: 2,
    title: "Documentation",
    summary: "Photograph from consistent positions so after photos line up.",
    items: items("doc", [
      "Front-left",
      "Front-center",
      "Front-right",
      "Rear-left",
      "Rear-center",
      "Rear-right",
      "Floor condition",
      "Heavy stains",
      "Damaged property",
      "Existing shelving/storage",
      "Existing equipment"
    ]),
    note: {
      title: "Matching after photos",
      body: "AFTER photos are taken from approximately the same six positions (front-left through rear-right) at the same height and orientation. Stand where you stood for the BEFORE shot so the pair reads as one transformation."
    }
  },
  {
    id: "sort",
    number: 3,
    title: "Sorting",
    summary: "Every item lands in exactly one of five categories.",
    items: items("sort", [
      "Set up KEEP zone",
      "Set up TRASH zone",
      "Set up DONATE zone",
      "Set up MOVE ELSEWHERE zone",
      "Set up CUSTOMER DECISION zone",
      "Sort every loose item into a category",
      "Tag Customer Decision items"
    ]),
    categories: ["KEEP", "TRASH", "DONATE", "MOVE ELSEWHERE", "CUSTOMER DECISION"]
  },
  {
    id: "remove",
    number: 4,
    title: "Remove",
    summary: "Clear the floor so cleaning can start.",
    items: items("remove", [
      "Remove trash",
      "Remove empty boxes",
      "Remove loose packaging",
      "Remove obvious debris",
      "Remove unwanted items",
      "Consolidate items",
      "Move customer-approved items to temporary zones"
    ])
  },
  {
    id: "floor",
    number: 5,
    title: "Floor Cleaning",
    summary: "Dry clean first, then treat stains, then wet clean.",
    items: items("floor", [
      "Sweep",
      "Shop vacuum",
      "Identify oil/grease stains",
      "Apply appropriate degreaser",
      "Allow dwell time according to product instructions",
      "Scrub affected areas",
      "Remove dirty solution",
      "Mop/scrub floor",
      "Squeegee if appropriate",
      "Allow floor to dry"
    ]),
    warning: "Follow the product label and SDS for every cleaner. Never mix incompatible chemicals. Ventilate the garage while wet work is in progress."
  },
  {
    id: "surfaces",
    number: 6,
    title: "Walls / Doors / Surfaces",
    summary: "Top down: cobwebs, dust, then every surface.",
    items: items("surfaces", [
      "Remove cobwebs",
      "Dust upper surfaces",
      "Clean garage door interior where appropriate",
      "Clean walls",
      "Clean shelving",
      "Clean cabinets",
      "Clean refrigerator exterior",
      "Clean work surfaces",
      "Clean storage containers",
      "Detail corners and edges"
    ])
  },
  {
    id: "org",
    number: 7,
    title: "Organization",
    summary: "Organize according to customer priorities, into labelled zones.",
    items: items("org", [
      "Confirm customer zone priorities",
      "Assign a zone to every KEEP item",
      "Place heavy items low, seasonal items high",
      "Keep a clear walking path from entry door to garage door",
      "Label every bin, shelf, and zone",
      "Photograph each finished zone"
    ]),
    zones: [
      "AUTOMOTIVE",
      "TOOLS",
      "SPORTS",
      "FISHING",
      "LAWN / GARDEN",
      "HOLIDAY",
      "STORAGE",
      "HOUSEHOLD",
      "DONATION",
      "TRASH",
      "CUSTOMER DECISION"
    ]
  },
  {
    id: "final",
    number: 8,
    title: "Final Detail",
    summary: "The pass that makes the after photos.",
    items: items("final", [
      "Final sweep",
      "Final vacuum",
      "Remove remaining debris",
      "Straighten storage",
      "Consolidate containers",
      "Remove cleaning equipment",
      "Check corners",
      "Check garage door operation/access",
      "Confirm walking paths",
      "Confirm customer-requested layout"
    ])
  },
  {
    id: "after",
    number: 9,
    title: "After Photos",
    summary: "Same six positions as the before set.",
    items: items("after", ["Front-left", "Front-center", "Front-right", "Rear-left", "Rear-center", "Rear-right"])
  },
  {
    id: "walk",
    number: 10,
    title: "Customer Walkthrough",
    summary: "Close the job with the customer, not without them.",
    items: items("walk", [
      "Walk customer through completed garage",
      "Confirm requested organization",
      "Confirm items were handled correctly",
      "Identify anything customer wants changed",
      "Capture final approval",
      "Save after photos",
      "Mark job complete"
    ])
  }
];

export const SOP_ITEM_COUNT = SOP_STAGES.reduce((total, stage) => total + stage.items.length, 0);

export const sopProgress = (state = {}) => {
  let completed = 0;
  let currentStage = SOP_STAGES[SOP_STAGES.length - 1];
  let found = false;
  SOP_STAGES.forEach((stage) => {
    const done = stage.items.filter((item) => state[item.id]).length;
    completed += done;
    if (!found && done < stage.items.length) {
      currentStage = stage;
      found = true;
    }
  });
  return {
    completed,
    total: SOP_ITEM_COUNT,
    remaining: SOP_ITEM_COUNT - completed,
    percent: SOP_ITEM_COUNT ? Math.round((completed / SOP_ITEM_COUNT) * 100) : 0,
    currentStage: found ? currentStage : null,
    complete: !found
  };
};
