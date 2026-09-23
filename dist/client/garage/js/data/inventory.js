// Default supply inventory. Ids are stable so job loadouts can reference them.

export const INVENTORY_CATEGORIES = [
  { id: "chemicals", label: "Cleaning Chemicals" },
  { id: "floor", label: "Floor Equipment" },
  { id: "detailing", label: "Detailing" },
  { id: "sorting", label: "Trash / Sorting" },
  { id: "ppe", label: "PPE" },
  { id: "equipment", label: "Job Equipment" },
  { id: "organization", label: "Organization" }
];

const item = (id, name, category, quantity, minimumQuantity, unit, notes = "") => ({
  id,
  name,
  category,
  quantity,
  minimumQuantity,
  unit,
  notes,
  loaded: false
});

export const DEFAULT_INVENTORY = [
  item("apc", "All-purpose cleaner", "chemicals", 3, 2, "bottle"),
  item("degreaser", "Heavy-duty degreaser", "chemicals", 2, 2, "gallon", "Follow label dwell time."),
  item("concrete-cleaner", "Concrete floor cleaner", "chemicals", 1, 1, "gallon"),
  item("spot-treatment", "Oil/grease spot treatment", "chemicals", 2, 1, "bottle"),
  item("disinfectant", "Disinfectant", "chemicals", 2, 1, "bottle"),
  item("glass-cleaner", "Glass cleaner", "chemicals", 2, 1, "bottle"),
  item("mild-detergent", "Mild detergent", "chemicals", 1, 1, "bottle"),
  item("other-cleaner", "Other approved surface cleaners", "chemicals", 1, 0, "bottle", "Only label-approved products."),

  item("push-broom", "Push broom", "floor", 2, 1, "each"),
  item("garage-brush", "Stiff-bristle garage brush", "floor", 2, 1, "each"),
  item("dustpan", "Dustpan", "floor", 2, 1, "each"),
  item("shop-vac", "Wet/dry shop vacuum", "floor", 1, 1, "each"),
  item("mop", "Mop", "floor", 1, 1, "each"),
  item("mop-heads", "Mop heads", "floor", 4, 2, "each"),
  item("mop-bucket", "Mop bucket", "floor", 1, 1, "each"),
  item("squeegee", "Floor squeegee", "floor", 1, 1, "each"),
  item("floor-scrub-brush", "Floor scrub brush", "floor", 1, 1, "each"),
  item("floor-scrubber", "Floor scrubber", "floor", 0, 0, "each", "Rental as needed."),
  item("pressure-washer", "Pressure washer", "floor", 1, 1, "each"),
  item("surface-cleaner", "Surface cleaner attachment", "floor", 1, 0, "each"),

  item("microfiber", "Microfiber towels", "detailing", 24, 12, "each"),
  item("scrub-brushes", "Scrub brushes", "detailing", 4, 2, "each"),
  item("detail-brushes", "Small detailing brushes", "detailing", 4, 2, "each"),
  item("scrub-pads", "Non-scratch scrub pads", "detailing", 10, 4, "each"),
  item("sponges", "Sponges", "detailing", 8, 4, "each"),
  item("eraser-pads", "Magic Eraser-type pads", "detailing", 6, 3, "each"),
  item("extension-pole", "Extension pole", "detailing", 1, 1, "each"),
  item("cobweb-duster", "Cobweb duster", "detailing", 1, 1, "each"),

  item("contractor-bags", "42-gallon contractor bags", "sorting", 30, 15, "each"),
  item("trash-bags", "Regular trash bags", "sorting", 40, 20, "each"),
  item("boxes", "Cardboard boxes", "sorting", 10, 5, "each"),
  item("totes", "Plastic storage totes", "sorting", 6, 3, "each"),
  item("labels", "Labels", "sorting", 2, 1, "roll"),
  item("markers", "Permanent markers", "sorting", 6, 3, "each"),
  item("painters-tape", "Painter's tape", "sorting", 3, 1, "roll"),

  item("nitrile-gloves", "Nitrile gloves", "ppe", 100, 40, "pair"),
  item("rubber-gloves", "Heavy-duty rubber gloves", "ppe", 4, 2, "pair"),
  item("safety-glasses", "Safety glasses", "ppe", 4, 2, "each"),
  item("dust-masks", "Dust masks appropriate for the job", "ppe", 20, 10, "each"),
  item("work-gloves", "Work gloves", "ppe", 4, 2, "pair"),
  item("work-boots", "Work boots", "ppe", 2, 2, "pair", "One per crew member."),
  item("hearing-protection", "Hearing protection", "ppe", 4, 2, "each"),
  item("knee-pads", "Knee pads", "ppe", 2, 2, "pair"),

  item("dolly", "Dolly", "equipment", 1, 1, "each"),
  item("flat-cart", "Flat cart", "equipment", 1, 1, "each"),
  item("extension-cords", "Extension cords", "equipment", 3, 2, "each"),
  item("cord-reel", "Cord reel", "equipment", 1, 1, "each"),
  item("work-light", "Portable work light", "equipment", 2, 1, "each"),
  item("step-ladder", "Folding step ladder", "equipment", 1, 1, "each"),
  item("blower", "Portable blower", "equipment", 1, 1, "each"),
  item("air-mover", "Air mover/fan", "equipment", 1, 1, "each"),
  item("hose", "Hose/nozzle", "equipment", 1, 1, "each"),

  item("org-totes", "Storage totes", "organization", 8, 4, "each"),
  item("org-labels", "Labels", "organization", 2, 1, "roll"),
  item("label-maker", "Label maker", "organization", 1, 1, "each"),
  item("shelving", "Shelving", "organization", 2, 1, "unit"),
  item("hooks", "Hooks", "organization", 20, 10, "each"),
  item("bins", "Bins", "organization", 10, 4, "each"),
  item("parts-organizers", "Small parts organizers", "organization", 3, 1, "each"),
  item("wall-storage", "Wall storage accessories", "organization", 4, 2, "each")
];

/** @returns {"in-stock"|"low-stock"|"reorder"} */
export const stockStatus = (item) => {
  if (item.quantity <= 0 || item.quantity < item.minimumQuantity) return "reorder";
  if (item.quantity === item.minimumQuantity) return "low-stock";
  return "in-stock";
};

export const STOCK_LABELS = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  reorder: "Reorder"
};
