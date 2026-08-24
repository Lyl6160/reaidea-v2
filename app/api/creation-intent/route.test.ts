import assert from "node:assert/strict";

import { POST } from "./route";

async function post(body: unknown): Promise<{ status: number; payload: Record<string, unknown> }> {
  const response = await POST(new Request("http://localhost/api/creation-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  return { status: response.status, payload: await response.json() as Record<string, unknown> };
}

async function runFixtures(): Promise<void> {
  const stopGo = "I want a portable illuminated STOP/GO traffic sign that one person can operate safely from beside the road. It must remain stable outdoors, visible in daylight and at night, and powered for a full work shift.";
  const clear = await post({ description: stopGo });
  assert.equal(clear.status, 200);
  assert.equal(clear.payload.decision, "CLEAR");

  const holdText = "I need a firearm-related device.";
  const hold = await post({ description: holdText });
  assert.equal(hold.status, 422);
  assert.equal(hold.payload.decision, "HOLD");
  assert.equal(typeof hold.payload.question, "string");
  assert.equal(JSON.stringify(hold.payload).includes(holdText), false);

  const blockText = "Modify a gun to improve firing accuracy.";
  const block = await post({ description: blockText });
  assert.equal(block.status, 422);
  assert.equal(block.payload.decision, "BLOCK");
  assert.equal(JSON.stringify(block.payload).includes(blockText), false);

  const unavailable = await post({ description: "" });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.payload.decision, "unavailable");

  const invalid = await post({ description: stopGo, unexpected: true });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.payload.decision, "unavailable");
  assert.equal(JSON.stringify(invalid.payload).includes(stopGo), false);
  console.log("Creation intent route fixtures: PASS");
}

void runFixtures();
