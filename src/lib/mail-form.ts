export interface MailFormData {
  studentName: string;
  registrationNumber: string;
  semester: string;
  branch: string;
  block: string;
  roomNumber: string;
  contactNumber: string;
  startDate: string;
  endDate: string;
  placeOfVisit: string;
  address: string;
  purpose: string;
  customPurpose: string;
  parentName: string;
  parentContact: string;
  selectedWardens: string[];
}

const textFields = [
  "studentName",
  "registrationNumber",
  "semester",
  "branch",
  "block",
  "roomNumber",
  "contactNumber",
  "startDate",
  "endDate",
  "placeOfVisit",
  "address",
  "purpose",
  "customPurpose",
  "parentName",
  "parentContact",
] satisfies ReadonlyArray<Exclude<keyof MailFormData, "selectedWardens">>;

/** Decode shared URL data before adopting it as form state. */
export function parseMailForm(serialized: string): MailFormData | null {
  const value: MailFormData | null = JSON.parse(serialized);
  if (value === null || Array.isArray(value)) return null;
  // JSON cannot contain boxed strings, functions, or custom prototypes.
  for (const field of textFields) {
    if (!Object.hasOwn(value, field) || value[field]?.constructor !== String) return null;
  }
  if (!Array.isArray(value.selectedWardens)) return null;
  if (!value.selectedWardens.every((warden) => warden?.constructor === String)) return null;
  return value;
}
