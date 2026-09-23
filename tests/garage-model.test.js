import assert from "node:assert/strict";
import test from "node:test";
import { buildLoadout, LOADOUT_PLANS } from "../garage/js/loadout.js";
import { DEFAULT_INVENTORY, stockStatus } from "../garage/js/data/inventory.js";
import { SOP_STAGES, SOP_ITEM_COUNT, sopProgress } from "../garage/js/data/sop.js";
import { zoneForObject, rotatedBounds, snapValue, floorUsage } from "../garage/js/geometry.js";
import { sampleGarageAfter } from "../garage/js/data/demo.js";
import { OBJECT_LIBRARY, GLYPHS } from "../garage/js/data/objects.js";

test("every loadout id exists in the default inventory", () => {
  const ids = new Set(DEFAULT_INVENTORY.map((item) => item.id));
  Object.values(LOADOUT_PLANS).forEach((plan) => {
    Object.values(plan.groups).flat().forEach((id) => assert.ok(ids.has(id), `missing inventory id ${id}`));
  });
  const loadout = buildLoadout("full-transformation", DEFAULT_INVENTORY);
  assert.deepEqual(loadout.missing, []);
  assert.ok(loadout.groups.some((group) => group.name === "Organization"));
});

test("loadout flags out-of-stock items", () => {
  const inventory = DEFAULT_INVENTORY.map((item) => (item.id === "degreaser" ? { ...item, quantity: 0 } : item));
  const loadout = buildLoadout("deep-clean", inventory);
  const degreaser = loadout.groups.flatMap((group) => group.items).find((item) => item.id === "degreaser");
  assert.equal(degreaser.available, false);
  assert.throws(() => buildLoadout("nope", inventory));
});

test("stock status thresholds", () => {
  assert.equal(stockStatus({ quantity: 5, minimumQuantity: 2 }), "in-stock");
  assert.equal(stockStatus({ quantity: 2, minimumQuantity: 2 }), "low-stock");
  assert.equal(stockStatus({ quantity: 1, minimumQuantity: 2 }), "reorder");
  assert.equal(stockStatus({ quantity: 0, minimumQuantity: 0 }), "reorder");
});

test("SOP has ten stages, unique ids, and progress math", () => {
  assert.equal(SOP_STAGES.length, 10);
  const ids = SOP_STAGES.flatMap((stage) => stage.items.map((item) => item.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, SOP_ITEM_COUNT);
  const empty = sopProgress({});
  assert.equal(empty.percent, 0);
  assert.equal(empty.currentStage.id, "pre");
  const state = Object.fromEntries(SOP_STAGES[0].items.map((item) => [item.id, true]));
  const partial = sopProgress(state);
  assert.equal(partial.completed, SOP_STAGES[0].items.length);
  assert.equal(partial.currentStage.id, "doc");
  const all = sopProgress(Object.fromEntries(ids.map((id) => [id, true])));
  assert.equal(all.percent, 100);
  assert.equal(all.complete, true);
});

test("geometry: zone assignment, rotation bounds, snapping", () => {
  const garage = sampleGarageAfter();
  const bench = garage.objects.find((object) => object.id === "o_bench");
  assert.equal(zoneForObject(bench, garage.zones), "z_workshop");
  assert.equal(zoneForObject({ x: 100, y: 100, width: 1, height: 1 }, garage.zones), null);
  const bounds = rotatedBounds({ x: 0, y: 0, width: 4, height: 2, rotation: 90 });
  assert.equal(Math.round(bounds.width * 100) / 100, 2);
  assert.equal(Math.round(bounds.height * 100) / 100, 4);
  assert.equal(snapValue(3.3, 0.5), 3.5);
  assert.equal(snapValue(3.3, 0), 3.3);
  assert.ok(floorUsage(garage) > 0 && floorUsage(garage) < 100);
});

test("every library object has a glyph and positive dimensions", () => {
  OBJECT_LIBRARY.forEach((def) => {
    assert.ok(GLYPHS[def.glyph], `glyph missing for ${def.type}`);
    assert.ok(def.width > 0 && def.height > 0);
  });
  const required = ["vehicle", "motorcycle", "bicycle", "toolbox", "workbench", "refrigerator", "freezer", "shelf", "bin", "cabinet", "mower", "snowblower", "pressurewasher", "shopvac", "tires", "rodrack", "sports", "trash", "dumpster", "worktable", "garagedoor", "entrydoor", "window", "wall", "custom"];
  required.forEach((type) => assert.ok(OBJECT_LIBRARY.some((def) => def.type === type), `library missing ${type}`));
});
