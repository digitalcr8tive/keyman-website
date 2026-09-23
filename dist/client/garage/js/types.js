/**
 * Garage OS data model (JSDoc form). The TypeScript declarations in
 * `types.d.ts` mirror these so a future TS/Supabase migration can import
 * them directly. Keep both files in sync when the model changes.
 *
 * @typedef {"vehicle"|"motorcycle"|"bicycle"|"toolbox"|"workbench"|"refrigerator"|"freezer"|"shelf"|"bin"|"cabinet"|"mower"|"snowblower"|"pressurewasher"|"shopvac"|"tires"|"rodrack"|"sports"|"trash"|"dumpster"|"worktable"|"garagedoor"|"entrydoor"|"window"|"wall"|"custom"|"exercise"} GarageObjectType
 *
 * @typedef {Object} GarageObject
 * @property {string} id
 * @property {GarageObjectType} type
 * @property {string} name          Display label
 * @property {number} x             Feet from the left wall
 * @property {number} y             Feet from the rear wall (top of the plan)
 * @property {number} width         Feet
 * @property {number} height        Feet (depth on the plan)
 * @property {number} rotation      Degrees, clockwise
 * @property {string|null} zone     Zone id or null
 * @property {string} [color]       Optional fill override
 * @property {string} [sort]        Sorting category: keep | trash | donate | move | decision
 * @property {Record<string, unknown>} [metadata]  Free-form. Never included in client share links.
 *
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {string} color
 *
 * @typedef {Object} GarageDoor
 * @property {number} width          Feet
 * @property {number} offset         Feet from the left wall to the door's left edge
 * @property {"front"|"rear"|"left"|"right"} wall
 *
 * @typedef {Object} Garage
 * @property {string} id
 * @property {string} name
 * @property {number} width          Feet, left to right
 * @property {number} depth          Feet, rear wall to front (door) wall
 * @property {GarageDoor} garageDoor
 * @property {Zone[]} zones
 * @property {GarageObject[]} objects
 * @property {number} [gridFeet]     Grid spacing in feet (default 1)
 * @property {boolean} [snap]
 * @property {string} [updatedAt]
 *
 * @typedef {"basic-reset"|"deep-clean"|"full-transformation"} ServiceType
 * @typedef {"lead"|"quote"|"scheduled"|"in-progress"|"completed"} JobStatus
 *
 * @typedef {Object} JobPhoto
 * @property {string} id
 * @property {string} label          e.g. "Front-left"
 * @property {string} dataUrl        Downscaled JPEG data URL (MVP); a storage URL later
 * @property {string} takenAt        ISO timestamp
 *
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} customer
 * @property {string} address
 * @property {string} date           ISO date
 * @property {ServiceType} serviceType
 * @property {JobStatus} status
 * @property {Garage|null} garage    Planner layout attached to the job
 * @property {JobPhoto[]} beforePhotos
 * @property {JobPhoto[]} afterPhotos
 * @property {Record<string, boolean>} sopProgress   Checklist item id -> done
 * @property {Record<string, boolean>} inventoryLoadout  Inventory item id -> loaded
 * @property {ServiceType|null} loadoutType
 * @property {string} notes          Internal only. Never shared.
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} quantity
 * @property {number} minimumQuantity
 * @property {string} unit
 * @property {string} notes
 * @property {boolean} loaded        Checked/loaded for the current job
 *
 * @typedef {"in-stock"|"low-stock"|"reorder"} StockStatus
 */

export const SERVICE_TYPES = [
  { id: "basic-reset", label: "Basic Reset", summary: "Sweep, declutter, wipe-down, and a tidy re-stack of what stays." },
  { id: "deep-clean", label: "Deep Clean", summary: "Full floor degrease and scrub, walls, doors, shelving, and cabinets." },
  { id: "full-transformation", label: "Full Garage Transformation", summary: "Deep clean plus sort, remove, and rebuild the garage into labelled zones." }
];

export const JOB_STATUSES = [
  { id: "lead", label: "Lead" },
  { id: "quote", label: "Quote" },
  { id: "scheduled", label: "Scheduled" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" }
];

export const SORT_CATEGORIES = [
  { id: "keep", label: "Keep", color: "var(--zone-green)" },
  { id: "trash", label: "Trash", color: "var(--zone-red)" },
  { id: "donate", label: "Donate", color: "var(--zone-blue)" },
  { id: "move", label: "Move Elsewhere", color: "var(--zone-amber)" },
  { id: "decision", label: "Customer Decision", color: "var(--zone-purple)" }
];

export const ZONE_PRESETS = [
  { name: "Tools", color: "#8f5b00" },
  { name: "Automotive", color: "#2d4f8f" },
  { name: "Sports", color: "#22694a" },
  { name: "Fishing", color: "#1f6f8b" },
  { name: "Lawn Care", color: "#4f7d1f" },
  { name: "Holiday", color: "#b3382e" },
  { name: "Storage", color: "#6b7280" },
  { name: "Workshop", color: "#7a4a1f" },
  { name: "Household", color: "#5b6b9a" },
  { name: "Donation", color: "#2d7f9a" },
  { name: "Trash", color: "#7a2b2b" },
  { name: "Customer Decision", color: "#6d4c9a" }
];
