import { RecipientType } from "../value-objects/RecipientInfo";

const RECIPIENT_TYPE_ALIASES: Record<string, RecipientType> = {
  patient: "PATIENT",
  pat: "PATIENT",
  doctor: "DOCTOR",
  doc: "DOCTOR",
  nurse: "NURSE",
  admin: "ADMIN",
  family: "FAMILY",
  staff: "STAFF",
  department: "DEPARTMENT",
  dept: "DEPARTMENT",
};

const ALLOWED_TYPES: RecipientType[] = [
  "PATIENT",
  "DOCTOR",
  "NURSE",
  "ADMIN",
  "FAMILY",
  "STAFF",
  "DEPARTMENT",
];

/**
 * Chuẩn hóa recipientType về enum hỗ trợ bởi DB constraint.
 * Trả về PATIENT làm fallback để tránh lỗi ghi DB.
 */
export function normalizeRecipientType(raw: string): RecipientType {
  if (!raw) {
    return "PATIENT";
  }

  const normalizedInput = raw.toString().trim().toUpperCase();

  if (ALLOWED_TYPES.includes(normalizedInput as RecipientType)) {
    return normalizedInput as RecipientType;
  }

  const alias = RECIPIENT_TYPE_ALIASES[normalizedInput.toLowerCase()];
  if (alias) {
    return alias;
  }

  // Fallback an toàn để không văng lỗi constraint
  return "PATIENT";
}
