import { RecipientType } from "../value-objects/RecipientInfo";
/**
 * Chuẩn hóa recipientType về enum hỗ trợ bởi DB constraint.
 * Trả về PATIENT làm fallback để tránh lỗi ghi DB.
 */
export declare function normalizeRecipientType(raw: string): RecipientType;
//# sourceMappingURL=recipient-type-normalizer.d.ts.map