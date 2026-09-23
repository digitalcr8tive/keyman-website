// Job loadout builder: service type -> suggested inventory item ids, grouped.
// Pure module (no DOM) so it is unit-testable.

const BASE = {
  cleaning: ["apc", "glass-cleaner", "disinfectant"],
  equipment: ["shop-vac", "push-broom", "dustpan", "extension-cords", "work-light"],
  detailing: ["microfiber", "cobweb-duster", "sponges"],
  ppe: ["nitrile-gloves", "safety-glasses", "work-boots", "dust-masks"],
  trash: ["contractor-bags", "trash-bags", "labels", "markers"]
};

export const LOADOUT_PLANS = {
  "basic-reset": {
    label: "Basic Reset",
    groups: {
      Cleaning: BASE.cleaning,
      Equipment: BASE.equipment,
      Detailing: BASE.detailing,
      PPE: BASE.ppe,
      Trash: BASE.trash
    }
  },
  "deep-clean": {
    label: "Deep Clean",
    groups: {
      Cleaning: ["degreaser", "concrete-cleaner", "spot-treatment", ...BASE.cleaning],
      Equipment: [...BASE.equipment, "garage-brush", "floor-scrub-brush", "mop", "mop-bucket", "mop-heads", "squeegee", "hose", "air-mover"],
      Detailing: [...BASE.detailing, "scrub-brushes", "scrub-pads", "eraser-pads", "extension-pole", "detail-brushes"],
      PPE: [...BASE.ppe, "rubber-gloves", "knee-pads"],
      Trash: BASE.trash
    }
  },
  "full-transformation": {
    label: "Full Garage Transformation",
    groups: {
      Cleaning: ["degreaser", "concrete-cleaner", "apc", "glass-cleaner", "spot-treatment", "disinfectant"],
      Equipment: ["shop-vac", "push-broom", "garage-brush", "floor-scrub-brush", "mop", "mop-bucket", "squeegee", "pressure-washer", "surface-cleaner", "dolly", "flat-cart", "step-ladder", "extension-cords", "work-light", "air-mover"],
      Detailing: [...BASE.detailing, "scrub-brushes", "scrub-pads", "eraser-pads", "extension-pole"],
      PPE: ["nitrile-gloves", "rubber-gloves", "safety-glasses", "work-boots", "work-gloves", "dust-masks", "hearing-protection", "knee-pads"],
      Trash: ["contractor-bags", "trash-bags", "boxes", "totes", "labels", "markers", "painters-tape"],
      Organization: ["org-totes", "bins", "label-maker", "org-labels", "hooks", "shelving", "parts-organizers", "wall-storage"]
    }
  }
};

/**
 * @param {string} serviceType
 * @param {Array<{id:string,name:string,quantity:number,minimumQuantity:number}>} inventory
 * @returns {{label:string, groups:Array<{name:string, items:Array<{id:string,name:string,quantity:number,available:boolean}>}>, missing:string[]}}
 */
export const buildLoadout = (serviceType, inventory) => {
  const plan = LOADOUT_PLANS[serviceType];
  if (!plan) throw new Error(`Unknown service type: ${serviceType}`);
  const byId = new Map(inventory.map((entry) => [entry.id, entry]));
  const missing = [];
  const groups = Object.entries(plan.groups).map(([name, ids]) => ({
    name,
    items: ids
      .map((id) => {
        const entry = byId.get(id);
        if (!entry) {
          missing.push(id);
          return null;
        }
        return { id, name: entry.name, quantity: entry.quantity, available: entry.quantity > 0 };
      })
      .filter(Boolean)
  }));
  return { label: plan.label, groups, missing };
};
