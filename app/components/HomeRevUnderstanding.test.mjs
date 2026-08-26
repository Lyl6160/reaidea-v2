import assert from "node:assert/strict";
import fs from "node:fs";

const component = fs.readFileSync(new URL("./HomeRevUnderstanding.tsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("./HomeRevUnderstanding.module.css", import.meta.url), "utf8");

for (const wording of [
  "WHAT REV UNDERSTANDS",
  "ONE USEFUL QUESTION",
  "VIEW WHAT I TOLD REV",
  "READY TO CREATE 3D",
  "ADD THIS TO REV’S UNDERSTANDING",
]) {
  assert.match(component, new RegExp(wording.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(component, /question\.recommendation\.label/);
assert.doesNotMatch(component, /SECURE MY ANSWER/);

assert.match(component, /aria-live="polite"/);
assert.match(component, /aria-busy=\{busy\}/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(component + styles, /\b\d{1,3}%\b|countdown|setInterval|setTimeout|spinner/i);

console.log("Home REV understanding presentation fixtures: PASS");
