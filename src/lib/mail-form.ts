export interface FormData {
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

const TEXT_FIELDS = [
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
] as const;

/** Decode the shared-link JSON without imposing validation on unfinished form fields. */
export function parseMailForm(json: string): FormData | null {
  try {
    const value: Partial<FormData> | null = JSON.parse(json);
    if (value === null || Object.getPrototypeOf(value) !== Object.prototype) return null;
    // JSON cannot contain boxed strings or Symbol.toStringTag, so native tags
    // distinguish strings without coercing untrusted objects or field values.
    for (const key of TEXT_FIELDS) {
      if (
        !Object.hasOwn(value, key) ||
        Object.prototype.toString.call(value[key]) !== "[object String]"
      ) {
        return null;
      }
    }
    if (
      !Array.isArray(value.selectedWardens) ||
      !value.selectedWardens.every(
        (entry) => Object.prototype.toString.call(entry) === "[object String]",
      )
    ) {
      return null;
    }
    // SAFETY: every required own string field and the string array were checked above.
    return value as FormData;
  } catch {
    return null;
  }
}
