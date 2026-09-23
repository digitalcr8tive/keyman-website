// "Sample Garage" demo data. Dimensions are illustrative, not measured.

const object = (id, type, name, x, y, width, height, rotation = 0, extra = {}) => ({
  id,
  type,
  name,
  x,
  y,
  width,
  height,
  rotation,
  zone: null,
  ...extra
});

export const SAMPLE_GARAGE_ID = "garage_sample";

/** Cluttered starting state: what the crew walks into. */
export const sampleGarageBefore = () => ({
  id: SAMPLE_GARAGE_ID,
  name: "Sample Garage",
  width: 22,
  depth: 22,
  garageDoor: { width: 16, offset: 3, wall: "front" },
  gridFeet: 1,
  snap: true,
  zones: [],
  objects: [
    object("o_moto", "motorcycle", "Motorcycle", 9, 12, 2.5, 7, 20),
    object("o_bike1", "bicycle", "Bicycle", 3, 14, 2, 6, 0),
    object("o_bike2", "bicycle", "Kids bike", 5.5, 15, 2, 6, -10),
    object("o_fridge", "refrigerator", "Refrigerator", 18.5, 0.5, 3, 2.5),
    object("o_freezer", "freezer", "Chest freezer", 12, 0.5, 5, 2.5),
    object("o_tread", "exercise", "Treadmill", 14, 6, 3, 6, 15),
    object("o_rods", "rodrack", "Fishing rods (loose)", 6, 2, 4, 1, 30),
    object("o_mower", "mower", "Lawn mower", 1, 6, 2, 3, 0),
    object("o_pw", "pressurewasher", "Pressure washer", 4, 9, 2, 2, 0),
    object("o_toolbox", "toolbox", "Rolling toolbox", 18, 8, 3, 2, 0),
    object("o_shelf1", "shelf", "Metal shelf", 0.5, 0.5, 4, 1.5),
    object("o_shelf2", "shelf", "Wire shelf", 5, 0.5, 4, 1.5),
    object("o_shelf3", "shelf", "Wood shelf", 19, 4, 1.5, 4),
    object("o_bin1", "bin", "Tote", 7, 8, 2, 1.5, 0),
    object("o_bin2", "bin", "Tote", 9.5, 8.5, 2, 1.5, 12),
    object("o_bin3", "bin", "Holiday decor", 12, 10, 2, 1.5, -8),
    object("o_bin4", "bin", "Holiday lights", 14.5, 10.5, 2, 1.5, 5),
    object("o_bin5", "bin", "Misc box", 3, 4, 2, 1.5, 0),
    object("o_bench", "workbench", "Workbench", 14, 3, 6, 2.5, 0),
    object("o_trash", "trash", "Trash / recycling", 19, 17, 2.5, 2.5),
    object("o_vac", "shopvac", "Shop vac", 16, 14, 1.5, 1.5),
    object("o_tires", "tires", "Tire stack", 17, 11, 2.5, 2.5),
    object("o_sports", "sports", "Sports gear", 10, 17, 3, 2, 0),
    object("o_entry", "entrydoor", "Entry door", 21.5, 7, 0.5, 3, 0),
    object("o_window", "window", "Window", 3, 0, 3, 0.5, 0)
  ]
});

/** Proposed organized state: same items, zoned and aligned. */
export const sampleGarageAfter = () => ({
  id: SAMPLE_GARAGE_ID,
  name: "Sample Garage — Proposed",
  width: 22,
  depth: 22,
  garageDoor: { width: 16, offset: 3, wall: "front" },
  gridFeet: 1,
  snap: true,
  zones: [
    { id: "z_workshop", name: "Workshop", x: 0.5, y: 0.5, width: 9, height: 4, color: "#7a4a1f" },
    { id: "z_storage", name: "Storage", x: 10, y: 0.5, width: 11.5, height: 3.5, color: "#6b7280" },
    { id: "z_lawn", name: "Lawn Care", x: 0.5, y: 5, width: 3.5, height: 7, color: "#4f7d1f" },
    { id: "z_auto", name: "Automotive", x: 16.5, y: 4.5, width: 5, height: 9.5, color: "#2d4f8f" },
    { id: "z_sports", name: "Sports & Fishing", x: 0.5, y: 12.5, width: 3.5, height: 9, color: "#22694a" },
    { id: "z_holiday", name: "Holiday", x: 10.5, y: 4.5, width: 5.5, height: 2.5, color: "#b3382e" },
    { id: "z_vehicle", name: "Vehicle Bay", x: 4.5, y: 6, width: 11.5, height: 15.5, color: "#5b6b9a" },
    { id: "z_trash", name: "Trash", x: 18.5, y: 18.5, width: 3, height: 3, color: "#7a2b2b" }
  ],
  objects: [
    object("o_bench", "workbench", "Workbench", 1, 1, 6, 2.5, 0, { zone: "z_workshop" }),
    object("o_toolbox", "toolbox", "Rolling toolbox", 7.5, 1.5, 1.5, 2, 90, { zone: "z_workshop" }),
    object("o_shelf1", "shelf", "Metal shelf", 10.5, 1, 4, 1.5, 0, { zone: "z_storage" }),
    object("o_shelf2", "shelf", "Wire shelf", 15, 1, 4, 1.5, 0, { zone: "z_storage" }),
    object("o_bin5", "bin", "Misc box", 10.5, 2.6, 2, 1.2, 0, { zone: "z_storage" }),
    object("o_bin1", "bin", "Tote", 13, 2.6, 2, 1.2, 0, { zone: "z_storage" }),
    object("o_bin2", "bin", "Tote", 15.5, 2.6, 2, 1.2, 0, { zone: "z_storage" }),
    object("o_fridge", "refrigerator", "Refrigerator", 19, 0.5, 2.5, 3, 90, { zone: "z_storage" }),
    object("o_freezer", "freezer", "Chest freezer", 11, 5, 5, 2, 0, { zone: "z_holiday" }),
    object("o_bin3", "bin", "Holiday decor", 16, 5, 2, 1.2, 0, { zone: "z_holiday" }),
    object("o_bin4", "bin", "Holiday lights", 16, 6.3, 2, 1.2, 0, { zone: "z_holiday" }),
    object("o_mower", "mower", "Lawn mower", 1, 5.5, 2, 3, 0, { zone: "z_lawn" }),
    object("o_pw", "pressurewasher", "Pressure washer", 1, 9, 2, 2, 0, { zone: "z_lawn" }),
    object("o_shelf3", "shelf", "Wood shelf", 17, 5, 1.5, 4, 0, { zone: "z_auto" }),
    object("o_tires", "tires", "Tire stack", 19, 5, 2.5, 2.5, 0, { zone: "z_auto" }),
    object("o_moto", "motorcycle", "Motorcycle", 18.5, 8, 2.5, 6, 0, { zone: "z_auto" }),
    object("o_vac", "shopvac", "Shop vac", 17, 9.5, 1.5, 1.5, 0, { zone: "z_auto" }),
    object("o_rods", "rodrack", "Fishing rod rack", 0.5, 13, 1, 4, 0, { zone: "z_sports" }),
    object("o_bike1", "bicycle", "Bicycle", 2, 13, 2, 6, 0, { zone: "z_sports" }),
    object("o_bike2", "bicycle", "Kids bike", 2, 19, 1.8, 2.5, 90, { zone: "z_sports" }),
    object("o_sports", "sports", "Sports gear", 0.5, 17.5, 1.4, 3, 90, { zone: "z_sports" }),
    object("o_tread", "exercise", "Treadmill", 5, 6.5, 3, 6, 0, { zone: "z_vehicle" }),
    object("o_trash", "trash", "Trash / recycling", 18.8, 18.8, 2.5, 2.5, 0, { zone: "z_trash" }),
    object("o_entry", "entrydoor", "Entry door", 21.5, 7, 0.5, 3, 0),
    object("o_window", "window", "Window", 3, 0, 3, 0.5, 0)
  ]
});

export const sampleJobs = () => {
  const today = new Date();
  const iso = (offsetDays) => {
    const date = new Date(today.getTime() + offsetDays * 86_400_000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  };
  return [
    {
      id: "job_sample",
      customer: "Sample Customer",
      address: "123 Sample St, Smyrna, GA",
      date: iso(3),
      serviceType: "full-transformation",
      status: "quote",
      garage: sampleGarageAfter(),
      beforePhotos: [],
      afterPhotos: [],
      sopProgress: {},
      inventoryLoadout: {},
      loadoutType: null,
      notes: "Sample job. Two-car garage, customer wants a workshop corner and room for the motorcycle.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
};
