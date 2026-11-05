import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMailForm } from "./mail-form.ts";

const blank = {
  studentName: "",
  registrationNumber: "",
  semester: "",
  branch: "",
  block: "",
  roomNumber: "",
  contactNumber: "",
  startDate: "",
  endDate: "",
  placeOfVisit: "",
  address: "",
  purpose: "",
  customPurpose: "",
  parentName: "",
  parentContact: "",
  selectedWardens: [],
};

test("shared forms accept empty fields, arbitrary strings and extra keys", () => {
  assert.deepEqual(parseMailForm(JSON.stringify(blank)), blank);
  const shared = {
    ...blank,
    studentName: "Ångström <&>",
    selectedWardens: ["", "a@b.test"],
    extra: { retained: true },
  };
  assert.deepEqual(parseMailForm(JSON.stringify(shared)), shared);
});

test("shared forms reject malformed JSON and non-object roots", () => {
  for (const value of ["{", "null", "false", "0", '"text"', "[]", "[{}]"]) {
    assert.equal(parseMailForm(value), null, value);
  }
});

test("each required field rejects missing, null and non-string data", () => {
  for (const key of Object.keys(blank).filter((key) => key !== "selectedWardens")) {
    const missing = { ...blank };
    delete missing[key];
    assert.equal(parseMailForm(JSON.stringify(missing)), null, key);
    for (const invalid of [null, 0, false, [], {}, { toString: "text" }]) {
      assert.equal(parseMailForm(JSON.stringify({ ...blank, [key]: invalid })), null, key);
    }
  }
});

test("warden selections must be an array containing only strings", () => {
  const missing = { ...blank };
  delete missing.selectedWardens;
  assert.equal(parseMailForm(JSON.stringify(missing)), null);
  for (const invalid of [null, "a@b.test", {}, [null], [1], ["a", false], [{ toString: "a" }]]) {
    assert.equal(parseMailForm(JSON.stringify({ ...blank, selectedWardens: invalid })), null);
  }
});

test("JSON prototype-looking keys cannot supply or corrupt required fields", () => {
  const shared = JSON.stringify(blank).replace(
    '"studentName":"",',
    '"__proto__":{"studentName":"forged"},',
  );
  assert.equal(parseMailForm(shared), null);
  const valid = JSON.stringify(blank).replace(
    '"studentName":"",',
    '"studentName":"","__proto__":{"polluted":true},',
  );
  assert.equal(parseMailForm(valid)?.studentName, "");
  assert.equal(Object.hasOwn(Object.prototype, "polluted"), false);
});
