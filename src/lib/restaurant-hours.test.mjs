import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveStatus, resolveAll, RESTAURANTS } from "./restaurant-hours.ts";

test("an overnight window opens on its starting day and closes the next day", () => {
  const window = { open: 22 * 60, close: 2 * 60, label: "22:00-02:00" };
  const restaurant = { byDay: [[], [window], [], [], [], [], []], firstWindow: window };
  assert.equal(resolveStatus(restaurant, 1, 60).open, false);
  assert.equal(resolveStatus(restaurant, 1, 23 * 60).open, true);
  assert.equal(resolveStatus(restaurant, 2, 60).open, true);
  assert.equal(resolveStatus(restaurant, 2, 2 * 60).open, false);
});
test("restaurant statuses use the IST date and time for a real instant", () => {
  const instant = new Date("2026-10-04T20:00:00Z");
  assert.deepEqual(
    resolveAll(instant),
    RESTAURANTS.map((restaurant) => resolveStatus(restaurant, 1, 90)),
  );
});
