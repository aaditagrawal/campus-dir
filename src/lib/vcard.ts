export type VCardInput = {
  name: string;
  phones?: string[];
  email?: string;
  emails?: string[];
  address?: string;
  org?: string;
  title?: string;
};

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function buildVCard({
  name,
  phones = [],
  email,
  emails = [],
  address,
  org,
  title,
}: VCardInput) {
  const allEmails = [...new Set([...(email ? [email] : []), ...emails].filter(Boolean))];
  const lines: Array<string | undefined> = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeText(name)}`,
    // Keep the full display name together when no family/given split is known.
    `N:${escapeText(name)};;;;`,
    org ? `ORG:${escapeText(org)}` : undefined,
    title ? `TITLE:${escapeText(title)}` : undefined,
    ...phones.map((p) => `TEL;TYPE=CELL:${p}`),
    ...allEmails.map((e) => `EMAIL;TYPE=INTERNET:${e}`),
    address ? `ADR;TYPE=WORK:;;${escapeText(address)};;;;` : undefined,
    "END:VCARD",
  ];
  return `${lines.filter((line) => line !== undefined).join("\r\n")}\r\n`;
}

export function downloadVCardFile(baseName: string, vcardContent: string) {
  const blob = new Blob([vcardContent], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName.replace(/\s+/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
