// Pure geometry helpers for the planner (feet units). No DOM.

export const snapValue = (value, step) => (step > 0 ? Math.round(value / step) * step : value);

export const clampRect = (rect, bounds) => {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  return {
    ...rect,
    width,
    height,
    x: Math.min(Math.max(rect.x, 0), bounds.width - width),
    y: Math.min(Math.max(rect.y, 0), bounds.height - height)
  };
};

/** Axis-aligned bounding box of a rotated rect (rotation about its centre). */
export const rotatedBounds = (rect) => {
  const angle = ((rect.rotation || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const width = rect.width * cos + rect.height * sin;
  const height = rect.width * sin + rect.height * cos;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return { x: cx - width / 2, y: cy - height / 2, width, height };
};

export const centerOf = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

export const containsPoint = (rect, point) =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

/** Zone id whose rect contains the object's centre, or null. */
export const zoneForObject = (object, zones) => {
  const center = centerOf(object);
  const hit = [...zones].reverse().find((zone) => containsPoint(zone, center));
  return hit ? hit.id : null;
};

export const overlaps = (a, b) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Fit a garage of width x depth feet into a pixel box; returns px per foot. */
export const fitScale = (garage, boxWidth, boxHeight, padding = 40) => {
  const usableW = Math.max(boxWidth - padding * 2, 80);
  const usableH = Math.max(boxHeight - padding * 2, 80);
  return Math.min(usableW / garage.width, usableH / garage.depth);
};

export const areaSqFt = (rect) => rect.width * rect.height;

/** Sum of object footprints vs garage floor area, in percent. */
export const floorUsage = (garage) => {
  const used = garage.objects
    .filter((object) => !["garagedoor", "entrydoor", "window", "wall"].includes(object.type))
    .reduce((total, object) => total + areaSqFt(object), 0);
  const floor = garage.width * garage.depth;
  return floor ? Math.min(100, Math.round((used / floor) * 100)) : 0;
};
