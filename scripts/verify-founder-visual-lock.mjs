import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const manifestPath = path.join(repositoryRoot, "visual-authority", "FOUNDER_VISUAL_LOCK_MANIFEST.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.status !== "LOCKED" || !Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  throw new Error("Founder Visual Lock manifest is not active or contains no protected assets.");
}

const seenIds = new Set();
const seenPaths = new Set();
const failures = [];

for (const asset of manifest.assets) {
  if (!asset.id || !asset.path || !/^[A-F0-9]{64}$/.test(asset.sha256)) {
    failures.push(`${asset.id ?? "UNKNOWN"}: invalid manifest entry`);
    continue;
  }

  if (seenIds.has(asset.id) || seenPaths.has(asset.path)) {
    failures.push(`${asset.id}: duplicate protected identity or path`);
    continue;
  }

  seenIds.add(asset.id);
  seenPaths.add(asset.path);

  const absolutePath = path.resolve(repositoryRoot, asset.path);
  const relativeCheck = path.relative(repositoryRoot, absolutePath);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
    failures.push(`${asset.id}: protected path escapes the repository`);
    continue;
  }

  try {
    const bytes = await readFile(absolutePath);
    const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    if (actual !== asset.sha256) {
      failures.push(`${asset.id}: hash mismatch (${actual})`);
    }
  } catch (error) {
    failures.push(`${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length > 0) {
  console.error("FOUNDER VISUAL LOCK: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`FOUNDER VISUAL LOCK: PASS (${manifest.assets.length} protected assets)`);
}
