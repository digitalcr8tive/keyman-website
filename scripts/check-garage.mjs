import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : name.endsWith(".js") ? [path] : [];
  });

const files = walk(join(root, "garage", "js"));
files.forEach((file) => execFileSync(process.execPath, ["--check", file], { stdio: "inherit" }));
console.log(`Syntax-checked ${files.length} garage modules.`);
