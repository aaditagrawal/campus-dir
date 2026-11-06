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

/** Decode shared URL data before adopting it as form state. */
export function parseMailForm(serialized: string): MailFormData | null {
  const value: MailFormData | null = JSON.parse(serialized);
  if (value === null || Array.isArray(value)) return null;
  // Fixed property reads avoid dynamic-key lookup overhead in this URL decoder.
  // oxlint-disable anti-slop/no-runtime-typeof -- This I/O boundary establishes the complete MailFormData contract.
  if (
    !Object.hasOwn(value, "studentName") ||
    typeof value.studentName !== "string" ||
    !Object.hasOwn(value, "registrationNumber") ||
    typeof value.registrationNumber !== "string" ||
    !Object.hasOwn(value, "semester") ||
    typeof value.semester !== "string" ||
    !Object.hasOwn(value, "branch") ||
    typeof value.branch !== "string" ||
    !Object.hasOwn(value, "block") ||
    typeof value.block !== "string" ||
    !Object.hasOwn(value, "roomNumber") ||
    typeof value.roomNumber !== "string" ||
    !Object.hasOwn(value, "contactNumber") ||
    typeof value.contactNumber !== "string" ||
    !Object.hasOwn(value, "startDate") ||
    typeof value.startDate !== "string" ||
    !Object.hasOwn(value, "endDate") ||
    typeof value.endDate !== "string" ||
    !Object.hasOwn(value, "placeOfVisit") ||
    typeof value.placeOfVisit !== "string" ||
    !Object.hasOwn(value, "address") ||
    typeof value.address !== "string" ||
    !Object.hasOwn(value, "purpose") ||
    typeof value.purpose !== "string" ||
    !Object.hasOwn(value, "customPurpose") ||
    typeof value.customPurpose !== "string" ||
    !Object.hasOwn(value, "parentName") ||
    typeof value.parentName !== "string" ||
    !Object.hasOwn(value, "parentContact") ||
    typeof value.parentContact !== "string"
  )
    return null;
  if (!Array.isArray(value.selectedWardens)) return null;
  if (!value.selectedWardens.every((warden) => typeof warden === "string")) return null;
  // oxlint-enable anti-slop/no-runtime-typeof
  return value;
}
