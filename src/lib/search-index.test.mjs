import assert from "node:assert/strict";
import { test } from "node:test";
import { isFuzzyEngineReady, loadFuzzyEngine, searchDirectory } from "./search-index.ts";

test("fuzzy search keeps distinct contacts that share a category link", async () => {
  await loadFuzzyEngine();
  assert.ok(isFuzzyEngineReady());

  // The typo routes this query through the fuzzy merge.
  const contacts = searchDirectory("student welfre").filter(
    (item) => item.href === "/grievance/#student-welfare",
  );

  assert.ok(contacts.length > 1);
  assert.equal(new Set(contacts).size, contacts.length);
});
