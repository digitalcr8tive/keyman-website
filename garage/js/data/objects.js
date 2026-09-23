// Planner object library. Dimensions are approximate footprints in feet.
// Visuals are simple original SVG glyphs drawn in a 100x100 box.

export const OBJECT_CATEGORIES = [
  { id: "vehicles", label: "Vehicles" },
  { id: "storage", label: "Storage" },
  { id: "appliances", label: "Appliances" },
  { id: "equipment", label: "Equipment" },
  { id: "outdoor", label: "Outdoor" },
  { id: "structure", label: "Structure" },
  { id: "other", label: "Other" }
];

const def = (type, name, category, width, height, color, glyph, extra = {}) => ({
  type,
  name,
  category,
  width,
  height,
  color,
  glyph,
  ...extra
});

export const OBJECT_LIBRARY = [
  def("vehicle", "Vehicle", "vehicles", 6.5, 15, "#5b6b9a", "vehicle"),
  def("motorcycle", "Motorcycle", "vehicles", 2.5, 7, "#4b5563", "motorcycle"),
  def("bicycle", "Bicycle", "vehicles", 2, 6, "#2d7f9a", "bicycle"),
  def("toolbox", "Toolbox", "storage", 3, 2, "#b3382e", "toolbox"),
  def("workbench", "Workbench", "equipment", 6, 2.5, "#7a4a1f", "workbench"),
  def("worktable", "Work Table", "equipment", 4, 2.5, "#8f6a3a", "worktable"),
  def("refrigerator", "Refrigerator", "appliances", 3, 2.5, "#6b7280", "fridge"),
  def("freezer", "Freezer", "appliances", 5, 2.5, "#7b8794", "freezer"),
  def("shelf", "Shelf", "storage", 4, 1.5, "#8f5b00", "shelf"),
  def("bin", "Storage Bin", "storage", 2, 1.5, "#2d4f8f", "bin"),
  def("cabinet", "Cabinet", "storage", 3, 1.5, "#5f4b3a", "cabinet"),
  def("mower", "Lawn Mower", "outdoor", 2, 3, "#4f7d1f", "mower"),
  def("snowblower", "Snow Blower", "outdoor", 2, 3.5, "#3b6d8f", "snowblower"),
  def("pressurewasher", "Pressure Washer", "equipment", 2, 2, "#1f6f8b", "pressurewasher"),
  def("shopvac", "Shop Vac", "equipment", 1.5, 1.5, "#374151", "shopvac"),
  def("tires", "Tire Stack", "storage", 2.5, 2.5, "#111827", "tires"),
  def("rodrack", "Fishing Rod Rack", "storage", 4, 1, "#1f6f8b", "rodrack"),
  def("sports", "Sports Equipment", "storage", 3, 2, "#22694a", "sports"),
  def("exercise", "Exercise Equipment", "equipment", 3, 6, "#6d4c9a", "exercise"),
  def("trash", "Trash Bins", "other", 2.5, 2.5, "#4b5563", "trash"),
  def("dumpster", "Dumpster", "other", 8, 6, "#374151", "dumpster"),
  def("garagedoor", "Garage Door", "structure", 9, 0.5, "#c32b26", "garagedoor", { fixed: true }),
  def("entrydoor", "Entry Door", "structure", 3, 0.5, "#c32b26", "entrydoor", { fixed: true }),
  def("window", "Window", "structure", 3, 0.5, "#2d7f9a", "window", { fixed: true }),
  def("wall", "Wall", "structure", 8, 0.5, "#111827", "wall", { fixed: true }),
  def("custom", "Custom Object", "other", 3, 3, "#9ca3af", "custom")
];

export const objectDef = (type) => OBJECT_LIBRARY.find((entry) => entry.type === type) || OBJECT_LIBRARY.at(-1);

// ---- Glyphs --------------------------------------------------------------
// Each glyph returns SVG markup for a 100x100 box. Strokes use
// vector-effect so they stay crisp at any object size.

const s = 'fill="none" stroke="currentColor" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"';
const f = 'fill="currentColor" stroke="none"';

export const GLYPHS = {
  vehicle: () => `
    <rect x="12" y="6" width="76" height="88" rx="14" ${s}/>
    <path d="M22 30 Q50 20 78 30 L74 44 L26 44 Z" ${s}/>
    <path d="M24 66 L76 66 L74 80 L26 80 Z" ${s}/>
    <rect x="6" y="18" width="7" height="14" rx="2" ${f} opacity=".6"/><rect x="87" y="18" width="7" height="14" rx="2" ${f} opacity=".6"/>
    <rect x="6" y="68" width="7" height="14" rx="2" ${f} opacity=".6"/><rect x="87" y="68" width="7" height="14" rx="2" ${f} opacity=".6"/>`,
  motorcycle: () => `
    <circle cx="50" cy="16" r="9" ${s}/><circle cx="50" cy="84" r="9" ${s}/>
    <path d="M50 25 L50 75" ${s}/>
    <path d="M30 40 L70 40" ${s}/>
    <rect x="40" y="46" width="20" height="18" rx="4" ${s}/>`,
  bicycle: () => `
    <circle cx="50" cy="16" r="8" ${s}/><circle cx="50" cy="84" r="8" ${s}/>
    <path d="M50 24 L50 76 M34 34 L66 34 M50 52 L50 52" ${s}/>
    <rect x="44" y="48" width="12" height="8" rx="2" ${f} opacity=".6"/>`,
  toolbox: () => `
    <rect x="8" y="22" width="84" height="56" rx="4" ${s}/>
    <path d="M8 50 L92 50 M36 22 L36 12 Q50 6 64 12 L64 22" ${s}/>
    <rect x="44" y="44" width="12" height="12" rx="2" ${f} opacity=".7"/>`,
  workbench: () => `
    <rect x="4" y="18" width="92" height="64" rx="2" ${s}/>
    <path d="M4 34 L96 34 M20 34 L20 82 M80 34 L80 82" ${s}/>
    <path d="M32 50 L44 50 M32 62 L60 62" ${s}/>`,
  worktable: () => `
    <rect x="6" y="20" width="88" height="60" rx="2" ${s}/>
    <path d="M6 32 L94 32" ${s}/>`,
  fridge: () => `
    <rect x="16" y="6" width="68" height="88" rx="4" ${s}/>
    <path d="M16 38 L84 38 M72 16 L72 30 M72 48 L72 78" ${s}/>`,
  freezer: () => `
    <rect x="6" y="18" width="88" height="64" rx="4" ${s}/>
    <path d="M6 32 L94 32 M40 24 L60 24" ${s}/>`,
  shelf: () => `
    <rect x="6" y="10" width="88" height="80" rx="2" ${s}/>
    <path d="M6 36 L94 36 M6 62 L94 62" ${s}/>
    <rect x="14" y="18" width="14" height="12" ${f} opacity=".5"/><rect x="34" y="44" width="20" height="12" ${f} opacity=".5"/><rect x="62" y="70" width="18" height="12" ${f} opacity=".5"/>`,
  bin: () => `
    <rect x="10" y="14" width="80" height="72" rx="6" ${s}/>
    <path d="M10 34 L90 34 M30 22 L70 22" ${s}/>`,
  cabinet: () => `
    <rect x="8" y="8" width="84" height="84" rx="3" ${s}/>
    <path d="M50 8 L50 92 M42 44 L42 56 M58 44 L58 56" ${s}/>`,
  mower: () => `
    <rect x="18" y="8" width="64" height="52" rx="8" ${s}/>
    <path d="M34 60 L26 92 M66 60 L74 92 M26 92 L74 92" ${s}/>
    <circle cx="50" cy="34" r="10" ${s}/>`,
  snowblower: () => `
    <rect x="14" y="6" width="72" height="30" rx="4" ${s}/>
    <path d="M14 21 L86 21 M30 36 L30 62 L70 62 L70 36" ${s}/>
    <path d="M38 62 L32 92 M62 62 L68 92 M32 92 L68 92" ${s}/>`,
  pressurewasher: () => `
    <rect x="16" y="28" width="68" height="46" rx="6" ${s}/>
    <circle cx="30" cy="80" r="8" ${s}/><circle cx="70" cy="80" r="8" ${s}/>
    <path d="M60 28 L60 12 L84 12" ${s}/>`,
  shopvac: () => `
    <circle cx="50" cy="50" r="38" ${s}/><circle cx="50" cy="50" r="14" ${s}/>
    <path d="M78 26 L94 10" ${s}/>`,
  tires: () => `
    <circle cx="50" cy="50" r="40" ${s}/><circle cx="50" cy="50" r="24" ${s}/><circle cx="50" cy="50" r="9" ${f} opacity=".6"/>`,
  rodrack: () => `
    <rect x="4" y="30" width="92" height="40" rx="3" ${s}/>
    <path d="M18 30 L18 70 M34 30 L34 70 M50 30 L50 70 M66 30 L66 70 M82 30 L82 70" ${s}/>`,
  sports: () => `
    <circle cx="32" cy="36" r="16" ${s}/><path d="M22 26 L42 46 M42 26 L22 46" ${s}/>
    <path d="M60 22 L84 22 L84 84 L60 84 Z M60 40 L84 40" ${s}/>`,
  exercise: () => `
    <rect x="18" y="6" width="64" height="74" rx="6" ${s}/>
    <path d="M18 24 L82 24 M50 80 L50 94 M34 94 L66 94" ${s}/>
    <path d="M30 40 L70 40 M30 56 L70 56" ${s}/>`,
  trash: () => `
    <rect x="14" y="20" width="32" height="70" rx="4" ${s}/><rect x="54" y="20" width="32" height="70" rx="4" ${s}/>
    <path d="M14 30 L46 30 M54 30 L86 30" ${s}/>`,
  dumpster: () => `
    <rect x="6" y="18" width="88" height="66" rx="3" ${s}/>
    <path d="M6 32 L94 32 M20 32 L20 84 M50 32 L50 84 M80 32 L80 84" ${s}/>`,
  garagedoor: () => `<rect x="0" y="30" width="100" height="40" ${f} opacity=".85"/><path d="M0 50 L100 50" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" stroke-dasharray="6 6"/>`,
  entrydoor: () => `<rect x="0" y="30" width="100" height="40" ${f} opacity=".85"/>`,
  window: () => `<rect x="0" y="35" width="100" height="30" ${f} opacity=".7"/><path d="M0 50 L100 50" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
  wall: () => `<rect x="0" y="20" width="100" height="60" ${f}/>`,
  custom: () => `<rect x="10" y="10" width="80" height="80" rx="6" ${s} stroke-dasharray="6 5"/><path d="M50 30 L50 70 M30 50 L70 50" ${s}/>`
};

export const glyphMarkup = (type) => (GLYPHS[objectDef(type).glyph] || GLYPHS.custom)();
