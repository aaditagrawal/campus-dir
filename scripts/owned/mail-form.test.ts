import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMailForm, type MailFormData } from "../../src/lib/mail-form";

export const sampleForm: MailFormData = {
  studentName: "A Student",
  registrationNumber: "240900123",
  semester: "3",
  branch: "Computer Science",
  block: "Block 14",
  roomNumber: "201",
  contactNumber: "9876543210",
  startDate: "2026-11-06",
  endDate: "2026-11-08",
  placeOfVisit: "Home",
  address: "A street, Manipal",
  purpose: "Visiting home - Family time/personal work",
  customPurpose: "",
  parentName: "A Parent",
  parentContact: "9876543211",
  selectedWardens: ["Warden One"],
};

test("shared forms retain text, Unicode, empty fields, and unknown fields", () => {
  const form = { ...sampleForm, studentName: "学生 👩🏽‍🎓", purpose: "", extra: "retained" };
  assert.deepEqual(parseMailForm(JSON.stringify(form)), form);
  assert.deepEqual(parseMailForm(JSON.stringify({ ...form, selectedWardens: [] })), {
    ...form,
    selectedWardens: [],
  });
});

test("every required text field rejects omission and non-string values", () => {
  for (const key of Object.keys(sampleForm).filter((key) => key !== "selectedWardens")) {
    assert.equal(
      parseMailForm(JSON.stringify({ ...sampleForm, [key]: undefined })),
      null,
      `missing ${key}`,
    );
    for (const value of [
      null,
      1,
      true,
      [],
      {},
      ["text"],
      { toString: null },
      { constructor: "String" },
    ]) {
      assert.equal(parseMailForm(JSON.stringify({ ...sampleForm, [key]: value })), null, key);
    }
  }
});

test("rejects non-object data and malformed selected warden arrays", () => {
  for (const value of [null, [], true, 1, "text", {}, { ...sampleForm, selectedWardens: null }]) {
    assert.equal(parseMailForm(JSON.stringify(value)), null);
  }
  for (const selectedWardens of ["warden", {}, [1], [null], [["warden"]], ["warden", false]]) {
    assert.equal(parseMailForm(JSON.stringify({ ...sampleForm, selectedWardens })), null);
  }
  assert.throws(() => parseMailForm("{"), SyntaxError);
});

test("long strings and large warden lists keep the existing unrestricted schema", () => {
  const form = {
    ...sampleForm,
    address: "a".repeat(100_000),
    selectedWardens: Array(1000).fill("W"),
  };
  assert.deepEqual(parseMailForm(JSON.stringify(form)), form);
  assert.equal(
    parseMailForm(JSON.stringify({ ...form, selectedWardens: [...form.selectedWardens, 1] })),
    null,
  );
});
