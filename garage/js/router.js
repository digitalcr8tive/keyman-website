// Hash router: "#/route?query" so the app works on static hosting.

export const parseHash = (hash = location.hash) => {
  const raw = hash.replace(/^#\/?/, "");
  const [pathPart, queryPart = ""] = raw.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(queryPart);
  return { route: segments[0] || "dashboard", segments, params };
};

export const buildHash = (route, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const suffix = query.toString();
  return `#/${route}${suffix ? `?${suffix}` : ""}`;
};

export const navigate = (route, params = {}) => {
  location.hash = buildHash(route, params);
};

export const absoluteUrl = (route, params = {}) => `${location.origin}${location.pathname}${buildHash(route, params)}`;
