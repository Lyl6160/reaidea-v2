import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Prototype3DViewer.tsx", import.meta.url), "utf8");

function numericConstant(name) {
  const match = source.match(new RegExp(`const ${name} = ([0-9.]+);`));
  assert(match, `${name} must remain an explicit deterministic constant`);
  return Number(match[1]);
}

const targetHeightRatio = numericConstant("GROUNDED_TARGET_HEIGHT_RATIO");
const distanceFactor = numericConstant("GROUNDED_DISTANCE_FACTOR");
const directionMatch = source.match(/GROUNDED_VIEW_DIRECTION = new THREE\.Vector3\(([^)]+)\)\.normalize\(\)/);
assert(directionMatch, "the grounded camera direction must remain explicit");
const direction = directionMatch[1].split(",").map((value) => Number(value.trim()));
const directionLength = Math.hypot(...direction);
const normalizedDirection = direction.map((value) => value / directionLength);

const box = { min: [-0.85, 0, -0.6], max: [1.05, 2.1, 0.6] };
const centre = box.min.map((value, index) => (value + box.max[index]) / 2);
const size = box.min.map((value, index) => box.max[index] - value);
const target = [0, box.min[1] + size[1] * targetHeightRatio, 0];
const position = target.map((value, index) => value + normalizedDirection[index] * 4.8 * distanceFactor);

assert.equal(target[0], 0, "the default target must remain centred on the podium, not an asymmetric accessory");
assert.equal(target[2], 0);
assert(target[1] > box.min[1] && target[1] < centre[1], "the camera target should favour the grounded base while keeping the full assembly in frame");
assert(position[1] > target[1], "the default camera must remain above the podium horizon");
assert.match(source, /maxPolarAngle: THREE\.MathUtils\.degToRad\(88\)/, "orbit must stop above the podium horizon");
assert.match(source, /minPolarAngle: THREE\.MathUtils\.degToRad\(18\)/);
assert.match(source, /\[fitRequest, height, resetRequest, restoreGroundedView, width\]/, "FIT and RESET must share the same deterministic restore path");
assert.match(source, /<Bounds clip margin=\{1\.18\}>/, "the complete assembly must retain a restrained framing margin");

assert.match(source, /component\.material === "metal"[\s\S]*metalness: \.68, roughness: \.34/);
assert.match(source, /component\.material === "plastic"[\s\S]*metalness: \.1, roughness: \.43/);
assert.match(source, /component\.material === "emissive"[\s\S]*emissiveIntensity: 1\.28/);
assert.match(source, /color: component\.colour/g, "material refinement must continue to use validated geometry colours");
assert.equal((source.match(/<Canvas\b/g) ?? []).length, 1, "the viewer must retain exactly one Canvas expression");

console.log("Prototype 3D camera and material fixture: PASS");
