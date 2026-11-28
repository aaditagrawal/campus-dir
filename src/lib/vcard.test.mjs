import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVCard } from "./vcard.ts";

test("vCard escapes contact text and keeps the structured address shape", () => {
  const card = buildVCard({
    name: "Dr. A, B; C\\D",
    title: "Warden, First Floor\nSecond Floor",
    org: "Block 10",
    address: "MAHE, Manipal; 576104",
    phones: ["+91 12345 67890"],
    email: "warden@example.edu",
  });

  assert.equal(
    card,
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Dr. A\\, B\\; C\\\\D",
      "N:Dr. A\\, B\\; C\\\\D;;;;",
      "ORG:Block 10",
      "TITLE:Warden\\, First Floor\\nSecond Floor",
      "TEL;TYPE=CELL:+91 12345 67890",
      "EMAIL;TYPE=INTERNET:warden@example.edu",
      "ADR;TYPE=WORK:;;MAHE\\, Manipal\\; 576104;;;;",
      "END:VCARD",
      "",
    ].join("\r\n"),
  );
});
