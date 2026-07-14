import { existsSync } from "node:fs"
import { register } from "node:module"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

register(
  `data:text/javascript,${encodeURIComponent(`
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = ${JSON.stringify(root)};

function resolveAlias(specifier) {
  if (!specifier.startsWith("@/")) return null;
  const rel = specifier.slice(2);
  const candidates = [
    path.join(root, rel),
    path.join(root, rel + ".ts"),
    path.join(root, rel + ".tsx"),
    path.join(root, rel, "index.ts"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const mapped = resolveAlias(specifier);
  if (mapped) return nextResolve(mapped, context);
  return nextResolve(specifier, context);
}
`)}`,
  import.meta.url,
)
