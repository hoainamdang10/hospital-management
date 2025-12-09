/**
 * Chuẩn hóa tên khoa cho staff read model.
 * Sau khi loại bỏ chuyên khoa, chỉ còn dựa trên department được chọn trong luồng đăng ký.
 */

const toKey = (value?: string | null): string | null => {
  if (!value) return null;
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const CANONICAL_DEPARTMENTS = [
  "Khoa Nội tổng quát",
  "Khoa Nội tiết",
  "Khoa Nội tiết Nhi",
  "Khoa Tiêu hóa",
  "Khoa Hô hấp",
  "Khoa Hô hấp Nhi",
  "Khoa Thận - Tiết niệu",
  "Khoa Nội Cơ xương khớp",
  "Khoa Tim mạch",
  "Khoa Tim mạch Nhi",
  "Khoa Chẩn đoán hình ảnh",
  "Khoa Xét nghiệm",
  "Khoa Chấn thương chỉnh hình",
  "Khoa Chấn thương chỉnh hình Nhi",
  "Khoa Sơ sinh",
  "Khoa Nhi",
  "Khoa Cấp cứu - Hồi sức",
  "Khối Quản trị Bệnh viện",
  "Khoa Tai Mũi Họng",
  "Khoa Da liễu",
  "Khoa Tổng hợp",
] as const;

const DEPARTMENT_CANONICAL_MAP: Record<string, string> =
  CANONICAL_DEPARTMENTS.reduce(
    (acc, name) => {
      const key = toKey(name);
      if (key) acc[key] = name;
      return acc;
    },
    {} as Record<string, string>,
  );

const DEPARTMENT_TRANSLATIONS: Record<string, string> = {
  [toKey("General")!]: "Khoa Tổng hợp",
  [toKey("GENERAL")!]: "Khoa Tổng hợp",
  [toKey("General Department")!]: "Khoa Tổng hợp",
  [toKey("General Medicine")!]: "Khoa Nội tổng quát",
  [toKey("Internal Medicine")!]: "Khoa Nội tổng quát",
  [toKey("Cardiology")!]: "Khoa Tim mạch",
  [toKey("Pediatrics")!]: "Khoa Nhi",
  [toKey("Neonatology")!]: "Khoa Sơ sinh",
  [toKey("Emergency")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Critical Care")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Laboratory")!]: "Khoa Xét nghiệm",
  [toKey("Imaging")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Radiology")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("DERM")!]: "Khoa Da liễu",
  [toKey("PEDI")!]: "Khoa Nhi",
  [toKey("CARD")!]: "Khoa Tim mạch",
  [toKey("ENT")!]: "Khoa Tai Mũi Họng",
  [toKey("ORTH")!]: "Khoa Chấn thương chỉnh hình",
  [toKey("LABO")!]: "Khoa Xét nghiệm",
};

export function normalizeDepartment(
  rawDepartment?: string | null,
): string | null {
  const key = toKey(rawDepartment);
  if (!key) return rawDepartment?.trim() || null;

  return (
    DEPARTMENT_CANONICAL_MAP[key] ||
    DEPARTMENT_TRANSLATIONS[key] ||
    (rawDepartment ? rawDepartment.trim() : null)
  );
}
