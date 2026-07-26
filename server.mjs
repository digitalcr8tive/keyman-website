import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isAllowedOrigin, processSubmission } from "./lib/contact.js";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));

const loadEnvironmentFile = (filename) => {
  const filePath = join(rootDirectory, filename);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
};

loadEnvironmentFile(".env");
loadEnvironmentFile(".env.local");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
};

const readJsonBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) {
        rejectBody(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch {
        rejectBody(new Error("Request body is not valid JSON."));
      }
    });
    request.on("error", rejectBody);
  });

const resolveStaticPath = (pathname) => {
  const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  let relativePath = cleanPath === "/" ? "index.html" : cleanPath.replace(/^[/\\]/, "");

  if (!extname(relativePath)) {
    const htmlCandidate = `${relativePath}.html`;
    if (existsSync(join(rootDirectory, htmlCandidate))) relativePath = htmlCandidate;
  }

  const absolutePath = resolve(rootDirectory, relativePath);
  if (absolutePath !== rootDirectory && !absolutePath.startsWith(`${rootDirectory}${sep}`)) return null;
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) return null;
  return absolutePath;
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (url.pathname === "/api/config") {
    const appointmentUrl = process.env.GOOGLE_APPOINTMENT_URL || "";
    sendJson(response, 200, { googleAppointmentUrl: appointmentUrl });
    return;
  }

  if (url.pathname === "/api/contact") {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { ok: false, message: "Method not allowed." });
      return;
    }

    if (!isAllowedOrigin(request)) {
      sendJson(response, 403, { ok: false, message: "Request origin was not accepted." });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const result = await processSubmission(body);
      sendJson(response, result.status, result.body);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  if (!["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": filePath.endsWith(".html") ? "no-cache" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

const port = Number.parseInt(process.env.PORT || "4173", 10);
server.listen(port, "127.0.0.1", () => {
  console.log(`Keyman website running at http://127.0.0.1:${port}`);
});
