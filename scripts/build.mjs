import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputRoot = join(projectRoot, "dist");
const clientRoot = join(outputRoot, "client");
const serverRoot = join(outputRoot, "server");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(clientRoot, { recursive: true });
await mkdir(serverRoot, { recursive: true });

const staticFiles = [
  "index.html",
  "privacy.html",
  "terms.html",
  "styles.css",
  "app.js"
];

await Promise.all(
  staticFiles.map(async (relativePath) => {
    const destination = join(clientRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(projectRoot, relativePath), destination);
  })
);

await cp(join(projectRoot, "assets"), join(clientRoot, "assets"), { recursive: true });
await cp(join(projectRoot, "worker", "index.js"), join(serverRoot, "index.js"));
await cp(join(projectRoot, "lib", "contact.js"), join(serverRoot, "contact.js"));

console.log("Built Keyman site for Cloudflare Workers.");
