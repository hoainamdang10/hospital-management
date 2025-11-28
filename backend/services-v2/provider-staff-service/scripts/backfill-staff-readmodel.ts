/**
 * Backfill staff_read_model for existing staff_profiles
 * Usage: npm run backfill:readmodel
 */

import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load env (.env preferred, fallback to .env.docker)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.docker") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[backfill-readmodel] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY },
  );
  process.exit(1);
}

const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[INFO] ${msg}`, meta),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(`[WARN] ${msg}`, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(`[ERROR] ${msg}`, meta),
};

const toKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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

const SPECIALIZATION_CANONICAL_MAP = CANONICAL_SPECIALIZATIONS.reduce(
  (acc, name) => {
    acc[toKey(name)] = name;
    return acc;
  },
  {} as Record<string, string>,
);

const SPECIALIZATION_TRANSLATIONS: Record<string, string> = {
  [toKey("General Medicine")]: "Nội tổng quát",
  [toKey("Internal Medicine")]: "Nội tổng quát",
  [toKey("General Practitioner")]: "Nội tổng quát",
  [toKey("General Practice")]: "Nội tổng quát",
  [toKey("Hospital Administration")]: "Quản lý y tế",
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

const DEPARTMENT_TRANSLATIONS: Record<string, string> = {
  [toKey("General")]: "Khoa Tổng hợp",
  [toKey("GENERAL")]: "Khoa Tổng hợp",
  [toKey("General Department")]: "Khoa Tổng hợp",
  [toKey("General Medicine")]: "Khoa Nội tổng quát",
  [toKey("Internal Medicine")]: "Khoa Nội tổng quát",
  [toKey("Cardiology")]: "Khoa Tim mạch",
  [toKey("Pediatrics")]: "Khoa Nhi",
  [toKey("Neonatology")]: "Khoa Sơ sinh",
  [toKey("Emergency")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Critical Care")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Laboratory")]: "Khoa Xét nghiệm",
  [toKey("Imaging")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Radiology")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("DERM")]: "Khoa Da liễu",
  [toKey("PEDI")]: "Khoa Nhi",
  [toKey("CARD")]: "Khoa Tim mạch",
  [toKey("ENT")]: "Khoa Tai Mũi Họng",
  [toKey("ORTH")]: "Khoa Chấn thương chỉnh hình",
  [toKey("LABO")]: "Khoa Xét nghiệm",
};

const DEPARTMENT_CANONICAL_MAP = CANONICAL_DEPARTMENTS.reduce(
  (acc, name) => {
    acc[toKey(name)] = name;
    return acc;
  },
  {} as Record<string, string>,
);

const SPECIALIZATION_TO_DEPARTMENT: Record<string, string> = {
  [toKey("Nội tổng quát")]: "Khoa Nội tổng quát",
  [toKey("Nội tiết")]: "Khoa Nội tiết",
  [toKey("Nội tiết Nhi")]: "Khoa Nội tiết Nhi",
  [toKey("Hô hấp")]: "Khoa Hô hấp",
  [toKey("Hô hấp Nhi")]: "Khoa Hô hấp Nhi",
  [toKey("Thận học")]: "Khoa Thận - Tiết niệu",
  [toKey("Tiêu hóa")]: "Khoa Tiêu hóa",
  [toKey("Cơ xương khớp")]: "Khoa Nội Cơ xương khớp",
  [toKey("Tim mạch can thiệp")]: "Khoa Tim mạch",
  [toKey("Điện sinh lý tim")]: "Khoa Tim mạch",
  [toKey("Tim mạch dự phòng")]: "Khoa Tim mạch",
  [toKey("Suy tim")]: "Khoa Tim mạch",
  [toKey("Hình ảnh tim mạch")]: "Khoa Tim mạch",
  [toKey("Tim mạch Nhi")]: "Khoa Tim mạch Nhi",
  [toKey("Chẩn đoán hình ảnh")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh Nhi")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh thần kinh")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán hình ảnh tuyến vú")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Hình ảnh tuyến vú")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Điện quang can thiệp")]: "Khoa Chẩn đoán hình ảnh",
  [toKey("Chẩn đoán phân tử")]: "Khoa Xét nghiệm",
  [toKey("Hóa sinh lâm sàng")]: "Khoa Xét nghiệm",
  [toKey("Huyết học")]: "Khoa Xét nghiệm",
  [toKey("Miễn dịch học")]: "Khoa Xét nghiệm",
  [toKey("Vi sinh")]: "Khoa Xét nghiệm",
  [toKey("Chấn thương chỉnh hình")]: "Khoa Chấn thương chỉnh hình",
  [toKey("Chỉnh hình Nhi")]: "Khoa Chấn thương chỉnh hình Nhi",
  [toKey("Phẫu thuật tạo hình khớp")]: "Khoa Chấn thương chỉnh hình",
  [toKey("Phẫu thuật cột sống")]: "Khoa Chấn thương chỉnh hình",
  [toKey("Y học thể thao")]: "Khoa Chấn thương chỉnh hình",
  [toKey("Sơ sinh")]: "Khoa Sơ sinh",
  [toKey("Nhi phát triển")]: "Khoa Nhi",
  [toKey("Hồi sức tích cực")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Chăm sóc chấn thương")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Chống độc")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Siêu âm cấp cứu")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Y học thảm họa")]: "Khoa Cấp cứu - Hồi sức",
  [toKey("Quản lý y tế")]: "Khối Quản trị Bệnh viện",
  [toKey("Quản trị lâm sàng")]: "Khối Quản trị Bệnh viện",
  [toKey("Quản lý chất lượng")]: "Khối Quản trị Bệnh viện",
  [toKey("An toàn người bệnh")]: "Khối Quản trị Bệnh viện",
  [toKey("Tin học y tế")]: "Khối Quản trị Bệnh viện",
};

const GENERIC_DEPARTMENT_KEYS = new Set<string>([
  toKey("General"),
  toKey("GENERAL"),
  toKey("Khoa tổng hợp"),
  toKey("Khối tổng quát"),
  toKey("General Department"),
  toKey("General Unit"),
]);

type StaffProfileRow = {
  staff_id: string;
  user_id: string;
  personal_info?: Record<string, any> | null;
  professional_info?: Record<string, any> | null;
  specializations?: unknown;
  department_assignments?: unknown;
};

type SpecializationEntry =
  | string
  | {
      name?: string | null;
      code?: string | null;
    };

const createDefaultRatingDistribution = () => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
});

const normalizeSpecializationName = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const key = toKey(trimmed);
  if (SPECIALIZATION_TRANSLATIONS[key]) {
    return SPECIALIZATION_TRANSLATIONS[key];
  }

  if (SPECIALIZATION_CANONICAL_MAP[key]) {
    return SPECIALIZATION_CANONICAL_MAP[key];
  }

  return trimmed;
};

const normalizeDepartmentName = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const key = toKey(trimmed);
  if (DEPARTMENT_TRANSLATIONS[key]) {
    return DEPARTMENT_TRANSLATIONS[key];
  }

  if (DEPARTMENT_CANONICAL_MAP[key]) {
    return DEPARTMENT_CANONICAL_MAP[key];
  }

  return trimmed;
};

const isGenericDepartment = (value?: string | null): boolean => {
  if (!value) {
    return true;
  }

  return GENERIC_DEPARTMENT_KEYS.has(toKey(value));
};

const mapDepartmentFromAssignments = (assignments: unknown): string | null => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return null;
  }

  const typedAssignments = assignments as Array<Record<string, any>>;
  const primary =
    typedAssignments.find((assignment) => assignment?.isPrimary) ??
    typedAssignments[0];

  if (!primary) {
    return null;
  }

  return (
    normalizeDepartmentName(
      primary.departmentNameVi ??
        primary.departmentNameEn ??
        primary.departmentLabel ??
        primary.departmentCode ??
        null,
    ) ?? null
  );
};

const mapDepartmentFromSpecialization = (
  specialization: string | null,
): string | null => {
  if (!specialization) {
    return null;
  }

  const mapped = SPECIALIZATION_TO_DEPARTMENT[toKey(specialization)];
  return mapped ?? null;
};

const getFullName = (row: StaffProfileRow): string => {
  const personal = row.personal_info ?? {};
  const professional = row.professional_info ?? {};

  return (
    personal.full_name ??
    personal.fullName ??
    professional.full_name ??
    professional.fullName ??
    professional.title ??
    "Chưa cập nhật"
  );
};

const getSpecialization = (row: StaffProfileRow): string | null => {
  const specializations = row.specializations;
  let specialization: string | null = null;

  if (Array.isArray(specializations) && specializations.length > 0) {
    const first = specializations[0] as SpecializationEntry | undefined;

    if (typeof first === "string") {
      specialization = first;
    } else if (first && typeof first === "object") {
      specialization = first.name ?? first.code ?? null;
    }
  }

  if (!specialization) {
    const professional = row.professional_info ?? {};
    specialization =
      professional.specialization ??
      professional.speciality ??
      professional.department ??
      null;
  }

  return normalizeSpecializationName(specialization);
};

const getDepartment = (
  row: StaffProfileRow,
  specialization: string | null,
): string | null => {
  const professional = row.professional_info ?? {};
  const assignmentDepartment = mapDepartmentFromAssignments(
    row.department_assignments,
  );
  const professionalDepartment = normalizeDepartmentName(
    professional.department ?? null,
  );

  let department = assignmentDepartment ?? professionalDepartment ?? null;
  const mappedFromSpecialization =
    mapDepartmentFromSpecialization(specialization);

  if (
    mappedFromSpecialization &&
    (department === null ||
      department !== mappedFromSpecialization ||
      isGenericDepartment(department))
  ) {
    department = mappedFromSpecialization;
  }

  return department;
};

async function main() {
  const supabase = createClient(
    SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const { data: staffProfiles, error: staffErr } = await supabase
    .schema("provider_schema")
    .from("staff_profiles")
    .select(
      "staff_id,user_id,personal_info,professional_info,specializations,department_assignments",
    );

  if (staffErr) {
    throw new Error(`Failed to fetch staff_profiles: ${staffErr.message}`);
  }

  const { data: existingReadModels, error: rmErr } = await supabase
    .schema("provider_schema")
    .from("staff_read_model")
    .select("staff_id,user_id");

  if (rmErr) {
    throw new Error(`Failed to fetch staff_read_model: ${rmErr.message}`);
  }

  const existingSet = new Set(
    (existingReadModels || []).map((row: any) => row.staff_id),
  );

  const profiles = (staffProfiles || []) as StaffProfileRow[];
  const missing = profiles.filter((row) => !existingSet.has(row.staff_id));
  const toUpdate = profiles.filter((row) => existingSet.has(row.staff_id));

  logger.info("[backfill-readmodel] Summary", {
    totalStaff: staffProfiles?.length || 0,
    existingReadModels: existingSet.size,
    missing: missing.length,
    needsUpdate: toUpdate.length,
  });

  for (const row of missing) {
    const specialization = getSpecialization(row);
    const now = new Date().toISOString();
    const { error } = await supabase
      .schema("provider_schema")
      .from("staff_read_model")
      .insert({
        staff_id: row.staff_id,
        user_id: row.user_id,
        full_name: getFullName(row),
        specialization,
        department: getDepartment(row, specialization),
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: createDefaultRatingDistribution(),
        last_review_date: null,
        created_at: now,
        updated_at: now,
      });

    if (error) {
      logger.error("Failed to backfill staff_read_model", {
        staffId: row.staff_id,
        userId: row.user_id,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      continue;
    }

    logger.info("Backfilled staff_read_model", {
      staffId: row.staff_id,
      userId: row.user_id,
    });
  }

  for (const row of toUpdate) {
    const specialization = getSpecialization(row);
    const { error } = await supabase
      .schema("provider_schema")
      .from("staff_read_model")
      .update({
        full_name: getFullName(row),
        specialization,
        department: getDepartment(row, specialization),
        updated_at: new Date().toISOString(),
      })
      .eq("staff_id", row.staff_id);

    if (error) {
      logger.error("Failed to update staff_read_model", {
        staffId: row.staff_id,
        userId: row.user_id,
        error: error.message,
        code: error.code,
        details: error.details,
      });
      continue;
    }

    logger.info("Updated staff_read_model", {
      staffId: row.staff_id,
      userId: row.user_id,
    });
  }

  logger.info("[backfill-readmodel] Done");
}

main().catch((err) => {
  logger.error("Backfill script failed", { error: err?.message });
  process.exit(1);
});
