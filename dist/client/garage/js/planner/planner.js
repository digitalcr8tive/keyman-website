// Interactive 2D garage planner. SVG-based, pointer-event driven, works with
// mouse and touch. All model coordinates are in feet; the SVG viewBox maps
// 1 ft = SCALE user units so hit-testing and snapping stay simple.

import { uid, clamp, escapeHtml, formatFeet, svgEl } from "../util.js";
import { snapValue, rotatedBounds, zoneForObject, centerOf } from "../geometry.js";
import { objectDef, glyphMarkup } from "../data/objects.js";
import { ZONE_PRESETS } from "../types.js";

export const SCALE = 24; // user units per foot
const MARGIN = 2.2; // feet of margin for rulers
const HISTORY_LIMIT = 60;
const MIN_SIZE = 0.5;
const ROTATE_STEP = 15;

export const blankGarage = (width = 20, depth = 20) => ({
  id: uid("garage"),
  name: "New garage",
  width,
  depth,
  garageDoor: { width: Math.min(16, width - 4), offset: Math.max(1, (width - Math.min(16, width - 4)) / 2), wall: "front" },
  gridFeet: 1,
  snap: true,
  zones: [],
  objects: []
});

const cloneGarage = (garage) => JSON.parse(JSON.stringify(garage));

/**
 * @param {HTMLElement} host
 * @param {{garage?:object, mode?:"edit"|"view"|"demo", onChange?:Function, onSelect?:Function, showZones?:boolean, showGrid?:boolean, showLabels?:boolean}} options
 */
export const createPlanner = (host, options = {}) => {
  const mode = options.mode || "edit";
  const interactive = mode !== "view";
  let garage = options.garage ? cloneGarage(options.garage) : blankGarage();
  let selectedId = null;
  let selectedKind = null; // "object" | "zone"
  let showZones = options.showZones ?? true;
  let showGrid = options.showGrid ?? true;
  let showLabels = options.showLabels ?? true;
  const history = [];
  const future = [];
  const groups = new Map();
  const listeners = [];

  const svg = svgEl("svg", {
    class: `planner-svg mode-${mode}`,
    role: "img",
    tabindex: interactive ? "0" : null,
    "aria-label": "Garage floor plan"
  });
  const floorLayer = svgEl("g", { class: "layer-floor" });
  const zoneLayer = svgEl("g", { class: "layer-zones" });
  const objectLayer = svgEl("g", { class: "layer-objects" });
  const overlayLayer = svgEl("g", { class: "layer-overlay" });
  const rulerLayer = svgEl("g", { class: "layer-rulers" });
  svg.append(floorLayer, zoneLayer, objectLayer, overlayLayer, rulerLayer);
  host.append(svg);

  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    listeners.push(() => target.removeEventListener(type, handler, opts));
  };

  // ---- helpers ------------------------------------------------------------

  const emitChange = () => options.onChange?.(getGarage());
  const emitSelect = () => options.onSelect?.(getSelected());

  const getGarage = () => cloneGarage(garage);

  const getSelected = () => {
    if (!selectedId) return null;
    if (selectedKind === "zone") {
      const zone = garage.zones.find((item) => item.id === selectedId);
      return zone ? { kind: "zone", item: zone } : null;
    }
    const object = garage.objects.find((item) => item.id === selectedId);
    return object ? { kind: "object", item: object } : null;
  };

  const commit = (label = "") => {
    history.push(JSON.stringify(garage));
    if (history.length > HISTORY_LIMIT) history.shift();
    future.length = 0;
    garage.updatedAt = new Date().toISOString();
    emitChange();
    return label;
  };

  const snap = (value) => (garage.snap === false ? Math.round(value * 100) / 100 : snapValue(value, (garage.gridFeet || 1) / 2));

  const clampObject = (object) => {
    const bounds = rotatedBounds(object);
    const dx = bounds.x - object.x;
    const dy = bounds.y - object.y;
    const minX = -dx;
    const maxX = garage.width - bounds.width - dx;
    const minY = -dy;
    const maxY = garage.depth - bounds.height - dy;
    object.x = clamp(object.x, Math.min(minX, maxX), Math.max(minX, maxX));
    object.y = clamp(object.y, Math.min(minY, maxY), Math.max(minY, maxY));
  };

  const clampZone = (zone) => {
    zone.width = clamp(zone.width, 1, garage.width);
    zone.height = clamp(zone.height, 1, garage.depth);
    zone.x = clamp(zone.x, 0, garage.width - zone.width);
    zone.y = clamp(zone.y, 0, garage.depth - zone.height);
  };

  const assignZone = (object) => {
    object.zone = zoneForObject(object, garage.zones);
  };

  const pointFromEvent = (event) => {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = point.matrixTransform(ctm.inverse());
    return { x: local.x / SCALE, y: local.y / SCALE };
  };

  // ---- rendering ----------------------------------------------------------

  const objectTransform = (object) =>
    `translate(${object.x * SCALE} ${object.y * SCALE}) rotate(${object.rotation || 0} ${(object.width * SCALE) / 2} ${(object.height * SCALE) / 2})`;

  const renderFloor = () => {
    floorLayer.replaceChildren();
    const W = garage.width * SCALE;
    const D = garage.depth * SCALE;
    floorLayer.append(svgEl("rect", { class: "floor", x: 0, y: 0, width: W, height: D, rx: 2 }));
    if (showGrid) {
      const step = (garage.gridFeet || 1) * SCALE;
      const path = [];
      for (let x = step; x < W; x += step) path.push(`M${x} 0V${D}`);
      for (let y = step; y < D; y += step) path.push(`M0 ${y}H${W}`);
      floorLayer.append(svgEl("path", { class: "grid", d: path.join("") }));
    }
    // Walls
    floorLayer.append(svgEl("rect", { class: "walls", x: 0, y: 0, width: W, height: D, rx: 2 }));
    // Garage door
    const door = garage.garageDoor || { width: 16, offset: 2, wall: "front" };
    const doorLen = clamp(door.width, 1, door.wall === "left" || door.wall === "right" ? garage.depth : garage.width) * SCALE;
    const along = clamp(door.offset, 0, (door.wall === "left" || door.wall === "right" ? garage.depth : garage.width) - door.width) * SCALE;
    let attrs;
    if (door.wall === "rear") attrs = { x: along, y: -6, width: doorLen, height: 12 };
    else if (door.wall === "left") attrs = { x: -6, y: along, width: 12, height: doorLen };
    else if (door.wall === "right") attrs = { x: W - 6, y: along, width: 12, height: doorLen };
    else attrs = { x: along, y: D - 6, width: doorLen, height: 12 };
    floorLayer.append(svgEl("rect", { class: "garage-door", ...attrs, rx: 2 }));
    const labelX = attrs.x + attrs.width / 2;
    const labelY = door.wall === "rear" ? -14 : door.wall === "front" ? D + 22 : attrs.y + attrs.height / 2;
    const label = svgEl("text", {
      class: "door-label",
      x: door.wall === "left" ? -14 : door.wall === "right" ? W + 14 : labelX,
      y: labelY,
      "text-anchor": "middle",
      transform: door.wall === "left" || door.wall === "right" ? `rotate(-90 ${door.wall === "left" ? -14 : W + 14} ${labelY})` : null
    });
    label.textContent = `Garage door · ${formatFeet(door.width)}`;
    floorLayer.append(label);
  };

  const renderRulers = () => {
    rulerLayer.replaceChildren();
    const W = garage.width * SCALE;
    const D = garage.depth * SCALE;
    const top = -MARGIN * SCALE + 18;
    const left = -MARGIN * SCALE + 18;
    rulerLayer.append(svgEl("path", { class: "ruler", d: `M0 ${top}H${W}M0 ${top - 5}V${top + 5}M${W} ${top - 5}V${top + 5}` }));
    const wl = svgEl("text", { class: "ruler-label", x: W / 2, y: top - 8, "text-anchor": "middle" });
    wl.textContent = `${formatFeet(garage.width)} wide`;
    rulerLayer.append(wl);
    rulerLayer.append(svgEl("path", { class: "ruler", d: `M${left} 0V${D}M${left - 5} 0H${left + 5}M${left - 5} ${D}H${left + 5}` }));
    const dl = svgEl("text", { class: "ruler-label", x: left - 8, y: D / 2, "text-anchor": "middle", transform: `rotate(-90 ${left - 8} ${D / 2})` });
    dl.textContent = `${formatFeet(garage.depth)} deep`;
    rulerLayer.append(dl);
  };

  const renderZones = () => {
    zoneLayer.replaceChildren();
    if (!showZones) return;
    garage.zones.forEach((zone) => {
      const g = svgEl("g", { class: `zone${zone.id === selectedId ? " is-selected" : ""}`, "data-zone-id": zone.id, style: `color:${zone.color}` });
      g.append(svgEl("rect", { x: zone.x * SCALE, y: zone.y * SCALE, width: zone.width * SCALE, height: zone.height * SCALE, rx: 3 }));
      const text = svgEl("text", { x: zone.x * SCALE + 6, y: zone.y * SCALE + 13 });
      text.textContent = zone.name.toUpperCase();
      g.append(text);
      zoneLayer.append(g);
    });
  };

  const renderObjects = () => {
    objectLayer.replaceChildren();
    groups.clear();
    garage.objects.forEach((object) => {
      const def = objectDef(object.type);
      const w = object.width * SCALE;
      const h = object.height * SCALE;
      const color = object.color || def.color;
      const g = svgEl("g", {
        class: `object type-${object.type}${object.id === selectedId ? " is-selected" : ""}${object.sort ? ` sort-${object.sort}` : ""}`,
        "data-object-id": object.id,
        transform: objectTransform(object),
        style: `color:${color}`
      });
      g.append(svgEl("rect", { class: "body", x: 0, y: 0, width: w, height: h, rx: def.fixed ? 0 : 3 }));
      const glyph = svgEl("svg", { class: "glyph", x: 0, y: 0, width: w, height: h, viewBox: "0 0 100 100", preserveAspectRatio: def.fixed ? "none" : "xMidYMid meet" });
      glyph.innerHTML = glyphMarkup(object.type);
      g.append(glyph);
      if (showLabels && !def.fixed && Math.min(w, h) >= 30) {
        const label = svgEl("text", { class: "label", x: w / 2, y: h - 5, "text-anchor": "middle" });
        label.textContent = object.name;
        g.append(label);
      }
      const title = svgEl("title");
      title.textContent = `${object.name} · ${formatFeet(object.width)} × ${formatFeet(object.height)}`;
      g.append(title);
      objectLayer.append(g);
      groups.set(object.id, g);
    });
  };

  const renderOverlay = () => {
    overlayLayer.replaceChildren();
    if (!interactive) return;
    const selected = getSelected();
    if (!selected) return;
    const { item, kind } = selected;
    const w = item.width * SCALE;
    const h = item.height * SCALE;
    const g = svgEl("g", { class: `selection selection-${kind}`, transform: kind === "object" ? objectTransform(item) : `translate(${item.x * SCALE} ${item.y * SCALE})` });
    g.append(svgEl("rect", { class: "outline", x: -3, y: -3, width: w + 6, height: h + 6, rx: 4 }));
    g.append(svgEl("circle", { class: "handle handle-resize", "data-handle": "resize", cx: w + 3, cy: h + 3, r: 9 }));
    if (kind === "object" && !objectDef(item.type).fixed) {
      g.append(svgEl("line", { class: "rotate-stem", x1: w / 2, y1: -3, x2: w / 2, y2: -26 }));
      g.append(svgEl("circle", { class: "handle handle-rotate", "data-handle": "rotate", cx: w / 2, cy: -30, r: 9 }));
    }
    const dims = svgEl("text", { class: "dims", x: w / 2, y: -8, "text-anchor": "middle", transform: kind === "object" && !objectDef(item.type).fixed ? `translate(${w / 2 + 40} 0) translate(${-w / 2} 0)` : null });
    dims.textContent = `${formatFeet(item.width)} × ${formatFeet(item.height)}`;
    g.append(dims);
    overlayLayer.append(g);
  };

  const render = () => {
    const W = (garage.width + MARGIN * 2) * SCALE;
    const D = (garage.depth + MARGIN * 2) * SCALE;
    svg.setAttribute("viewBox", `${-MARGIN * SCALE} ${-MARGIN * SCALE} ${W} ${D}`);
    renderFloor();
    renderRulers();
    renderZones();
    renderObjects();
    renderOverlay();
  };

  // ---- interactions -------------------------------------------------------

  let drag = null;

  const findTarget = (event) => {
    const handle = event.target.closest?.("[data-handle]");
    if (handle) return { kind: "handle", handle: handle.dataset.handle };
    const objectNode = event.target.closest?.("[data-object-id]");
    if (objectNode) return { kind: "object", id: objectNode.dataset.objectId };
    const zoneNode = event.target.closest?.("[data-zone-id]");
    if (zoneNode) return { kind: "zone", id: zoneNode.dataset.zoneId };
    return { kind: "floor" };
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const target = findTarget(event);
    const point = pointFromEvent(event);

    if (!interactive) {
      if (target.kind === "object") {
        selectedId = target.id;
        selectedKind = "object";
        renderObjects();
        emitSelect();
      } else if (target.kind === "floor") {
        selectedId = null;
        renderObjects();
        emitSelect();
      }
      return;
    }

    if (target.kind === "handle") {
      const selected = getSelected();
      if (!selected) return;
      drag = { kind: target.handle, item: selected.item, itemKind: selected.kind, start: point, origin: { ...selected.item }, moved: false };
    } else if (target.kind === "object") {
      selectedId = target.id;
      selectedKind = "object";
      const object = garage.objects.find((item) => item.id === target.id);
      drag = { kind: "move", item: object, itemKind: "object", start: point, origin: { ...object }, moved: false };
      renderObjects();
      renderOverlay();
      emitSelect();
    } else if (target.kind === "zone") {
      selectedId = target.id;
      selectedKind = "zone";
      const zone = garage.zones.find((item) => item.id === target.id);
      drag = { kind: "move", item: zone, itemKind: "zone", start: point, origin: { ...zone }, moved: false };
      renderZones();
      renderOverlay();
      emitSelect();
    } else {
      if (selectedId) {
        selectedId = null;
        selectedKind = null;
        renderZones();
        renderObjects();
        renderOverlay();
        emitSelect();
      }
      return;
    }
    svg.setPointerCapture?.(event.pointerId);
    svg.focus?.({ preventScroll: true });
    event.preventDefault();
  };

  const applyDrag = (point) => {
    const { item, origin, start, kind, itemKind } = drag;
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    if (kind === "move") {
      item.x = snap(origin.x + dx);
      item.y = snap(origin.y + dy);
      if (itemKind === "object") clampObject(item);
      else clampZone(item);
    } else if (kind === "resize") {
      const angle = ((origin.rotation || 0) * Math.PI) / 180;
      const ldx = dx * Math.cos(angle) + dy * Math.sin(angle);
      const ldy = -dx * Math.sin(angle) + dy * Math.cos(angle);
      item.width = Math.max(MIN_SIZE, snap(origin.width + ldx));
      item.height = Math.max(MIN_SIZE, snap(origin.height + ldy));
      if (itemKind === "object") clampObject(item);
      else clampZone(item);
    } else if (kind === "rotate") {
      const center = centerOf(item);
      const angle = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI + 90;
      item.rotation = ((Math.round(angle / ROTATE_STEP) * ROTATE_STEP) % 360 + 360) % 360;
      clampObject(item);
    }
    drag.moved = true;
  };

  const onPointerMove = (event) => {
    if (!drag) return;
    applyDrag(pointFromEvent(event));
    const node = drag.itemKind === "object" ? groups.get(drag.item.id) : null;
    if (drag.kind === "move" && node) {
      node.setAttribute("transform", objectTransform(drag.item));
      renderOverlay();
    } else if (drag.itemKind === "object") {
      renderObjects();
      renderOverlay();
    } else {
      renderZones();
      renderOverlay();
    }
    event.preventDefault();
  };

  const endDrag = (event) => {
    if (!drag) return;
    const { item, itemKind, moved } = drag;
    drag = null;
    try {
      svg.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    if (moved) {
      if (itemKind === "object") assignZone(item);
      else garage.objects.forEach(assignZone);
      commit("drag");
    }
    render();
    emitSelect();
  };

  const onKeyDown = (event) => {
    if (!interactive) return;
    const selected = getSelected();
    const meta = event.metaKey || event.ctrlKey;
    if (meta && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) api.redo();
      else api.undo();
      return;
    }
    if (meta && event.key.toLowerCase() === "y") {
      event.preventDefault();
      api.redo();
      return;
    }
    if (!selected) return;
    const nudge = event.shiftKey ? 1 : (garage.gridFeet || 1) / 2;
    const moves = { ArrowLeft: [-nudge, 0], ArrowRight: [nudge, 0], ArrowUp: [0, -nudge], ArrowDown: [0, nudge] };
    if (moves[event.key]) {
      event.preventDefault();
      selected.item.x += moves[event.key][0];
      selected.item.y += moves[event.key][1];
      if (selected.kind === "object") {
        clampObject(selected.item);
        assignZone(selected.item);
      } else clampZone(selected.item);
      commit("nudge");
      render();
      emitSelect();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      api.deleteSelected();
    } else if (event.key.toLowerCase() === "r" && !meta) {
      event.preventDefault();
      api.rotateSelected(event.shiftKey ? -90 : 90);
    } else if (meta && event.key.toLowerCase() === "d") {
      event.preventDefault();
      api.duplicateSelected();
    }
  };

  on(svg, "pointerdown", onPointerDown);
  on(svg, "pointermove", onPointerMove);
  on(svg, "pointerup", endDrag);
  on(svg, "pointercancel", endDrag);
  on(svg, "keydown", onKeyDown);
  on(svg, "contextmenu", (event) => interactive && event.preventDefault());

  // ---- public API ---------------------------------------------------------

  const api = {
    svg,
    getGarage,
    getSelected,
    get mode() {
      return mode;
    },
    setGarage(next, { resetHistory = false, silent = false } = {}) {
      garage = cloneGarage(next);
      garage.zones ||= [];
      garage.objects ||= [];
      garage.objects.forEach(assignZone);
      selectedId = null;
      selectedKind = null;
      if (resetHistory) {
        history.length = 0;
        future.length = 0;
      }
      render();
      if (!silent) emitChange();
      emitSelect();
    },
    setDimensions({ width, depth, garageDoor }) {
      garage.width = clamp(Number(width) || garage.width, 6, 120);
      garage.depth = clamp(Number(depth) || garage.depth, 6, 120);
      if (garageDoor) {
        garage.garageDoor = {
          wall: garageDoor.wall || garage.garageDoor.wall || "front",
          width: clamp(Number(garageDoor.width) || garage.garageDoor.width, 1, garage.width),
          offset: clamp(Number(garageDoor.offset) ?? garage.garageDoor.offset, 0, garage.width)
        };
      }
      garage.objects.forEach((object) => {
        clampObject(object);
        assignZone(object);
      });
      garage.zones.forEach(clampZone);
      commit("dimensions");
      render();
    },
    setOptions({ snap, gridFeet, zones, grid, labels }) {
      if (snap !== undefined) garage.snap = snap;
      if (gridFeet !== undefined) garage.gridFeet = gridFeet;
      if (zones !== undefined) showZones = zones;
      if (grid !== undefined) showGrid = grid;
      if (labels !== undefined) showLabels = labels;
      render();
    },
    addObject(type, at = null, overrides = {}) {
      const def = objectDef(type);
      const object = {
        id: uid("obj"),
        type,
        name: overrides.name || def.name,
        width: overrides.width || def.width,
        height: overrides.height || def.height,
        rotation: overrides.rotation || 0,
        zone: null,
        x: 0,
        y: 0,
        ...overrides
      };
      const point = at || { x: garage.width / 2, y: garage.depth / 2 };
      object.x = snap(point.x - object.width / 2);
      object.y = snap(point.y - object.height / 2);
      // Nudge off exact duplicates so stacked adds remain visible.
      let tries = 0;
      while (tries < 12 && garage.objects.some((other) => other.x === object.x && other.y === object.y && other.type === object.type)) {
        object.x = snap(object.x + 1);
        object.y = snap(object.y + 1);
        tries += 1;
      }
      clampObject(object);
      assignZone(object);
      garage.objects.push(object);
      selectedId = object.id;
      selectedKind = "object";
      commit("add");
      render();
      emitSelect();
      return object;
    },
    addZone(preset = null, rect = null) {
      const base = preset || ZONE_PRESETS[garage.zones.length % ZONE_PRESETS.length];
      const zone = {
        id: uid("zone"),
        name: base.name,
        color: base.color,
        width: Math.min(6, garage.width),
        height: Math.min(6, garage.depth),
        x: 1,
        y: 1,
        ...(rect || {})
      };
      const step = garage.zones.length % 4;
      if (!rect) {
        zone.x = snap(1 + step * 1.5);
        zone.y = snap(1 + step * 1.5);
      }
      clampZone(zone);
      garage.zones.push(zone);
      garage.objects.forEach(assignZone);
      selectedId = zone.id;
      selectedKind = "zone";
      commit("zone");
      render();
      emitSelect();
      return zone;
    },
    select(id, kind = "object") {
      selectedId = id;
      selectedKind = kind;
      render();
      emitSelect();
    },
    updateSelected(patch) {
      const selected = getSelected();
      if (!selected) return;
      const { item, kind } = selected;
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined) return;
        if (["x", "y", "width", "height", "rotation"].includes(key)) item[key] = Number(value);
        else item[key] = value;
      });
      if (kind === "object") {
        item.width = Math.max(MIN_SIZE, item.width);
        item.height = Math.max(MIN_SIZE, item.height);
        item.rotation = ((item.rotation % 360) + 360) % 360;
        clampObject(item);
        if (patch.zone !== undefined) {
          const zone = garage.zones.find((entry) => entry.id === patch.zone);
          if (zone) {
            const center = centerOf(zone);
            item.x = snap(center.x - item.width / 2);
            item.y = snap(center.y - item.height / 2);
            clampObject(item);
          }
        }
        assignZone(item);
      } else {
        clampZone(item);
        garage.objects.forEach(assignZone);
      }
      commit("edit");
      render();
      emitSelect();
    },
    rotateSelected(delta = 90) {
      const selected = getSelected();
      if (!selected || selected.kind !== "object") return;
      api.updateSelected({ rotation: (selected.item.rotation || 0) + delta });
    },
    duplicateSelected() {
      const selected = getSelected();
      if (!selected) return;
      const copy = { ...JSON.parse(JSON.stringify(selected.item)), id: uid(selected.kind === "zone" ? "zone" : "obj") };
      copy.x = snap(copy.x + 1);
      copy.y = snap(copy.y + 1);
      if (selected.kind === "zone") {
        clampZone(copy);
        garage.zones.push(copy);
        selectedKind = "zone";
      } else {
        clampObject(copy);
        assignZone(copy);
        garage.objects.push(copy);
        selectedKind = "object";
      }
      selectedId = copy.id;
      commit("duplicate");
      render();
      emitSelect();
    },
    deleteSelected() {
      const selected = getSelected();
      if (!selected) return;
      if (selected.kind === "zone") {
        garage.zones = garage.zones.filter((zone) => zone.id !== selected.item.id);
        garage.objects.forEach(assignZone);
      } else {
        garage.objects = garage.objects.filter((object) => object.id !== selected.item.id);
      }
      selectedId = null;
      selectedKind = null;
      commit("delete");
      render();
      emitSelect();
    },
    clear() {
      garage.objects = [];
      garage.zones = [];
      selectedId = null;
      commit("clear");
      render();
      emitSelect();
    },
    undo() {
      if (!history.length) return;
      future.push(JSON.stringify(garage));
      garage = JSON.parse(history.pop());
      selectedId = null;
      render();
      emitChange();
      emitSelect();
    },
    redo() {
      if (!future.length) return;
      history.push(JSON.stringify(garage));
      garage = JSON.parse(future.pop());
      selectedId = null;
      render();
      emitChange();
      emitSelect();
    },
    canUndo: () => history.length > 0,
    canRedo: () => future.length > 0,
    pointFromClient(clientX, clientY) {
      return pointFromEvent({ clientX, clientY });
    },
    isPointInside(clientX, clientY) {
      const rect = svg.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    },
    render,
    toSvgString() {
      const clone = svg.cloneNode(true);
      clone.querySelector(".layer-overlay")?.replaceChildren();
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = EXPORT_CSS;
      clone.prepend(style);
      return new XMLSerializer().serializeToString(clone);
    },
    async toPngBlob(pixelWidth = 1600) {
      const source = api.toSvgString();
      const viewBox = svg.getAttribute("viewBox").split(" ").map(Number);
      const ratio = viewBox[3] / viewBox[2];
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = Math.round(pixelWidth * ratio);
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const image = new Image();
      const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
      await new Promise((resolveImage, rejectImage) => {
        image.onload = resolveImage;
        image.onerror = rejectImage;
        image.src = url;
      });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      return new Promise((resolveBlob) => canvas.toBlob(resolveBlob, "image/png"));
    },
    destroy() {
      listeners.forEach((off) => off());
      svg.remove();
    }
  };

  garage.objects.forEach(assignZone);
  render();
  return api;
};

// Styles inlined into exported SVG/PNG so the export matches the screen.
const EXPORT_CSS = `
  text{font-family:Manrope,Arial,sans-serif}
  .floor{fill:#fbfaf9}
  .grid{stroke:#e5e2df;stroke-width:1;fill:none}
  .walls{fill:none;stroke:#1f1a19;stroke-width:6}
  .garage-door{fill:#c32b26}
  .door-label,.ruler-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;fill:#5c5654}
  .ruler{stroke:#8a8482;stroke-width:1;fill:none}
  .zone rect{fill:currentColor;fill-opacity:.1;stroke:currentColor;stroke-width:1.5;stroke-dasharray:6 4}
  .zone text{font-size:10px;font-weight:700;letter-spacing:.12em;fill:currentColor}
  .object .body{fill:currentColor;fill-opacity:.16;stroke:currentColor;stroke-width:1.5}
  .object .label{font-size:9px;font-weight:700;fill:#1f1a19}
  .object.type-garagedoor .body,.object.type-entrydoor .body,.object.type-window .body,.object.type-wall .body{fill-opacity:1;stroke:none}
`;
