// Shareable layout links. The layout is serialised into a compact, URL-safe
// string carried in the page hash so a static GitHub Pages deployment can
// open a client's proposed garage with no backend.
//
// Format:  <flag><payload>
//   flag "z" -> deflate-raw compressed JSON, base64url
//   flag "j" -> plain JSON, base64url (fallback where CompressionStream is unavailable)
//
// Only public fields are encoded (see `publicLayout`). If layouts outgrow URL
// limits, replace `encodeLayout`/`decodeLayout` with an id-based backend lookup;
// callers only see opaque strings.

const SHORT = {
  garage: ["id", "n", "w", "d", "g", "z", "o", "t"],
  door: ["w", "o", "wl"]
};

const OBJECT_KEYS = ["id", "type", "name", "x", "y", "width", "height", "rotation", "zone", "color", "sort"];
const ZONE_KEYS = ["id", "name", "x", "y", "width", "height", "color"];

const pick = (source, keys) => {
  const out = {};
  keys.forEach((key) => {
    if (source[key] !== undefined && source[key] !== null) out[key] = source[key];
  });
  return out;
};

/** Strip anything internal (metadata, notes) before sharing. */
export const publicLayout = (garage, title = "") => ({
  v: 1,
  title: title || "",
  garage: {
    id: garage.id,
    name: garage.name || "",
    width: garage.width,
    depth: garage.depth,
    garageDoor: pick(garage.garageDoor || {}, ["width", "offset", "wall"]),
    zones: (garage.zones || []).map((zone) => pick(zone, ZONE_KEYS)),
    objects: (garage.objects || []).map((object) => pick(object, OBJECT_KEYS))
  }
});

const toBase64Url = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
};

const fromBase64Url = (text) => {
  const padded = text.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const compress = async (bytes) => {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decompress = async (bytes) => {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const compact = (payload) => {
  const g = payload.garage;
  return {
    v: payload.v,
    t: payload.title || undefined,
    g: {
      id: g.id,
      n: g.name || undefined,
      w: g.width,
      d: g.depth,
      dr: g.garageDoor,
      z: g.zones,
      o: g.objects.map((object) => [
        object.id,
        object.type,
        object.name,
        object.x,
        object.y,
        object.width,
        object.height,
        object.rotation || 0,
        object.zone || null,
        object.color || null,
        object.sort || null
      ])
    }
  };
};

const expand = (raw) => {
  if (!raw || raw.v !== 1 || !raw.g) throw new Error("Unsupported layout link.");
  const g = raw.g;
  return {
    v: 1,
    title: raw.t || "",
    garage: {
      id: g.id,
      name: g.n || "",
      width: Number(g.w),
      depth: Number(g.d),
      garageDoor: g.dr || { width: 16, offset: 2, wall: "front" },
      zones: Array.isArray(g.z) ? g.z : [],
      objects: (g.o || []).map((row) => ({
        id: row[0],
        type: row[1],
        name: row[2],
        x: Number(row[3]),
        y: Number(row[4]),
        width: Number(row[5]),
        height: Number(row[6]),
        rotation: Number(row[7] || 0),
        zone: row[8] || null,
        color: row[9] || undefined,
        sort: row[10] || undefined
      }))
    }
  };
};

export const encodeLayout = async (garage, title = "") => {
  const json = JSON.stringify(compact(publicLayout(garage, title)));
  const bytes = new TextEncoder().encode(json);
  if (typeof CompressionStream === "function") {
    try {
      return `z${toBase64Url(await compress(bytes))}`;
    } catch {
      /* fall through to plain */
    }
  }
  return `j${toBase64Url(bytes)}`;
};

export const decodeLayout = async (token) => {
  if (!token || token.length < 2) throw new Error("Empty layout link.");
  const flag = token[0];
  let bytes = fromBase64Url(token.slice(1));
  if (flag === "z") bytes = await decompress(bytes);
  else if (flag !== "j") throw new Error("Unknown layout link format.");
  const payload = expand(JSON.parse(new TextDecoder().decode(bytes)));
  validate(payload.garage);
  return payload;
};

const validate = (garage) => {
  if (!(garage.width > 0 && garage.width <= 200) || !(garage.depth > 0 && garage.depth <= 200)) {
    throw new Error("Layout dimensions are out of range.");
  }
  if (garage.objects.length > 400 || garage.zones.length > 60) throw new Error("Layout is too large.");
};

/** Rough URL budget check. Most browsers/tools handle 8k comfortably. */
export const SHARE_TOKEN_LIMIT = 6000;
export const isShareable = (token) => token.length <= SHARE_TOKEN_LIMIT;
