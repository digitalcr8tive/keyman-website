import assert from "node:assert/strict";
import test from "node:test";
import { encodeLayout, decodeLayout, publicLayout, isShareable } from "../garage/js/share.js";
import { sampleGarageAfter, sampleGarageBefore } from "../garage/js/data/demo.js";

test("share link round-trips a layout losslessly for public fields", async () => {
  const garage = sampleGarageAfter();
  const token = await encodeLayout(garage, "Test title");
  assert.ok(token.startsWith("z") || token.startsWith("j"));
  assert.match(token, /^[zj][A-Za-z0-9_-]+$/, "token must be URL-safe");
  const decoded = await decodeLayout(token);
  assert.equal(decoded.title, "Test title");
  assert.equal(decoded.garage.width, garage.width);
  assert.equal(decoded.garage.depth, garage.depth);
  assert.deepEqual(decoded.garage.garageDoor, garage.garageDoor);
  assert.equal(decoded.garage.objects.length, garage.objects.length);
  assert.equal(decoded.garage.zones.length, garage.zones.length);
  const first = decoded.garage.objects.find((object) => object.id === "o_bench");
  assert.deepEqual(
    { x: first.x, y: first.y, width: first.width, height: first.height, rotation: first.rotation, zone: first.zone },
    { x: 1, y: 1, width: 6, height: 2.5, rotation: 0, zone: "z_workshop" }
  );
});

test("share payload strips internal metadata", async () => {
  const garage = sampleGarageBefore();
  garage.objects[0].metadata = { cost: 999, internalNote: "do not share" };
  const payload = publicLayout(garage);
  assert.equal(payload.garage.objects[0].metadata, undefined);
  const decoded = await decodeLayout(await encodeLayout(garage));
  assert.equal(JSON.stringify(decoded).includes("do not share"), false);
});

test("sample layouts fit inside the share budget", async () => {
  const token = await encodeLayout(sampleGarageAfter());
  assert.ok(isShareable(token), `token length ${token.length}`);
});

test("decode rejects garbage and out-of-range layouts", async () => {
  await assert.rejects(() => decodeLayout("xnotatoken"));
  const huge = { ...sampleGarageAfter(), width: 999 };
  const hugeToken = await encodeLayout(huge);
  await assert.rejects(() => decodeLayout(hugeToken), /out of range/);
});
