/**
 * Chuẩn hóa chuyên khoa/khoa cho staff read model.
 * Reuse mapping từ script backfill để giữ dữ liệu tiếng Việt nhất quán.
 */

const toKey = (value?: string | null): string | null => {
  if (!value) return null;
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const CANONICAL_SPECIALIZATIONS = [
  "Nội tổng quát",
  "Nội tiết",
  "Nội tiết Nhi",
  "Hô hấp",
  "Hô hấp Nhi",
  "Thận học",
  "Tiêu hóa",
  "Cơ xương khớp",
  "Tim mạch can thiệp",
  "Điện sinh lý tim",
  "Tim mạch dự phòng",
  "Suy tim",
  "Tim mạch Nhi",
  "Hình ảnh tim mạch",
  "Chẩn đoán hình ảnh",
  "Chẩn đoán hình ảnh Nhi",
  "Chẩn đoán hình ảnh thần kinh",
  "Chẩn đoán hình ảnh tuyến vú",
  "Hình ảnh tuyến vú",
  "Điện quang can thiệp",
  "Chẩn đoán phân tử",
  "Hóa sinh lâm sàng",
  "Huyết học",
  "Miễn dịch học",
  "Vi sinh",
  "Chấn thương chỉnh hình",
  "Chỉnh hình Nhi",
  "Phẫu thuật tạo hình khớp",
  "Phẫu thuật cột sống",
  "Y học thể thao",
  "Sơ sinh",
  "Nhi phát triển",
  "Hồi sức tích cực",
  "Chăm sóc chấn thương",
  "Chống độc",
  "Siêu âm cấp cứu",
  "Y học thảm họa",
  "Quản lý y tế",
  "Quản trị lâm sàng",
  "Quản lý chất lượng",
  "An toàn người bệnh",
  "Tin học y tế",
] as const;

const SPECIALIZATION_CANONICAL_MAP: Record<string, string> =
  CANONICAL_SPECIALIZATIONS.reduce((acc, name) => {
    const key = toKey(name);
    if (key) acc[key] = name;
    return acc;
  }, {} as Record<string, string>);

const SPECIALIZATION_TRANSLATIONS: Record<string, string> = {
  [toKey("General Medicine")!]: "Nội tổng quát",
  [toKey("Internal Medicine")!]: "Nội tổng quát",
  [toKey("General Practitioner")!]: "Nội tổng quát",
  [toKey("General Practice")!]: "Nội tổng quát",
  [toKey("Hospital Administration")!]: "Quản lý y tế",
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
  CANONICAL_DEPARTMENTS.reduce((acc, name) => {
    const key = toKey(name);
    if (key) acc[key] = name;
    return acc;
  }, {} as Record<string, string>);

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

const GENERIC_DEPARTMENT_KEYS = new Set<string>([
  toKey("General")!,
  toKey("GENERAL")!,
  toKey("Khoa tổng hợp")!,
  toKey("Khối tổng quát")!,
  toKey("General Department")!,
  toKey("General Unit")!,
]);

const SPECIALIZATION_TO_DEPARTMENT: Record<string, string> = {
  [toKey("Nội tổng quát")!]: "Khoa Nội tổng quát",
  [toKey("Nội tiết")!]: "Khoa Nội tiết",
  [toKey("Nội tiết Nhi")!]: "Khoa Nội tiết Nhi",
  [toKey("Hô hấp")!]: "Khoa Hô hấp",
  [toKey("Hô hấp Nhi")!]: "Khoa Hô hấp Nhi",
  [toKey("Thận học")!]: "Khoa Thận - Tiết niệu",
  [toKey("Tiêu hóa")!]: "Khoa Tiêu hóa",
  [toKey("Cơ xương khớp")!]: "Khoa Nội Cơ xương khớp",
  [toKey("Tim mạch can thiệp")!]: "Khoa Tim mạch",
  [toKey("Điện sinh lý tim")!]: "Khoa Tim mạch",
  [toKey("Tim mạch dự phòng")!]: "Khoa Tim mạch",
  [toKey("Suy tim")!]: "Khoa Tim mạch",
  [toKey("Hình ảnh tim mạch")!]: "Khoa Tim mạch",
  [toKey("Tim mạch Nhi")!]: "Khoa Tim mạch Nhi",
  [toKey("Chẩn đoán hình ảnh")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh Nhi")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh thần kinh")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh tuyến vú")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Hình ảnh tuyến vú")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Điện quang can thiệp")!]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán phân tử")!]: "Khoa Xét nghiệm",
  [toKey("Hóa sinh lâm sàng")!]: "Khoa Xét nghiệm",
  [toKey("Huyết học")!]: "Khoa Xét nghiệm",
  [toKey("Miễn dịch học")!]: "Khoa Xét nghiệm",
  [toKey("Vi sinh")!]: "Khoa Xét nghiệm",
  [toKey("Chấn thương chỉnh hình")!]: "Khoa Chấn thương chỉnh hình",
  [toKey("Chỉnh hình Nhi")!]: "Khoa Chấn thương chỉnh hình Nhi",
  [toKey("Phẫu thuật tạo hình khớp")!]: "Khoa Chấn thương chỉnh hình",
  [toKey("Phẫu thuật cột sống")!]: "Khoa Chấn thương chỉnh hình",
  [toKey("Y học thể thao")!]: "Khoa Chấn thương chỉnh hình",
  [toKey("Sơ sinh")!]: "Khoa Sơ sinh",
  [toKey("Nhi phát triển")!]: "Khoa Nhi",
  [toKey("Hồi sức tích cực")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Chăm sóc chấn thương")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Chống độc")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Siêu âm cấp cứu")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Y học thảm họa")!]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Quản lý y tế")!]: "Khối Quản trị Bệnh viện",
  [toKey("Quản trị lâm sàng")!]: "Khối Quản trị Bệnh viện",
  [toKey("Quản lý chất lượng")!]: "Khối Quản trị Bệnh viện",
  [toKey("An toàn người bệnh")!]: "Khối Quản trị Bệnh viện",
  [toKey("Tin học y tế")!]: "Khối Quản trị Bệnh viện",
};

export function normalizeSpecialization(
  rawSpecialization?: string | null,
): string | null {
  const key = toKey(rawSpecialization);
  if (!key) return null;
  return (
    SPECIALIZATION_CANONICAL_MAP[key] ||
    SPECIALIZATION_TRANSLATIONS[key] ||
    (rawSpecialization ? rawSpecialization.trim() : null)
  );
}

export function inferDepartmentFromSpecialization(
  specialization?: string | null,
): string | null {
  const key = toKey(specialization);
  if (!key) return null;
  return SPECIALIZATION_TO_DEPARTMENT[key] || null;
}

export function normalizeDepartment(
  rawDepartment?: string | null,
  specialization?: string | null,
): string | null {
  const specBased = inferDepartmentFromSpecialization(specialization);
  const key = toKey(rawDepartment);

  // Ưu tiên mapping từ chuyên khoa nếu khoa đang để chung chung
  if (specBased && (!key || GENERIC_DEPARTMENT_KEYS.has(key))) {
    return specBased;
  }

  if (!key) return specBased;

  return (
    DEPARTMENT_CANONICAL_MAP[key] ||
    DEPARTMENT_TRANSLATIONS[key] ||
    specBased ||
    (rawDepartment ? rawDepartment.trim() : null)
  );
}
