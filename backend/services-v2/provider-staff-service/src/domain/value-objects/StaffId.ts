/**
 * StaffId Value Object
 * Vietnamese Healthcare Staff ID Format: {TYPE}-{DEPT}-YYYYMM-XXX
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { ValueObject } from "@shared/domain/base/value-object";

interface StaffIdProps {
  value: string;
}

type StaffIdSegments = {
  typePrefix: string;
  departmentCode: string;
  yearMonth: string;
  sequence: string;
};

export type StaffType =
  | "doctor"
  | "nurse"
  | "technician"
  | "pharmacist"
  | "therapist"
  | "admin"
  | "receptionist";

export class StaffId extends ValueObject<StaffIdProps> {
  private constructor(props: StaffIdProps) {
    super(props);
  }

  protected validateFormat(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error("Mã nhân viên không được để trống");
    }

    if (!StaffId.isValidStaffId(this.props.value)) {
      throw new Error(
        "Mã nhân viên không đúng định dạng ({TYPE}-{DEPT}-YYYYMM-XXX)",
      );
    }
  }

  public static create(value: string): StaffId {
    const normalizedValue = value.trim().toUpperCase();
    return new StaffId({ value: normalizedValue });
  }

  public static generate(
    staffType: StaffType,
    departmentCode: string = "GEN",
  ): StaffId {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, "0");

    const typePrefix = StaffId.getTypePrefix(staffType);
    const staffId = `${typePrefix}-${departmentCode.toUpperCase()}-${year}${month}-${sequenceStr}`;

    return new StaffId({ value: staffId });
  }

  public static fromString(value: string): StaffId {
    return StaffId.create(value);
  }

  public get value(): string {
    return this.props.value;
  }

  public getStaffType(): StaffType {
    const segments = StaffId.parseSegments(this.props.value);
    if (!segments) {
      return "admin";
    }
    const typePrefix = segments.typePrefix;
    return StaffId.getStaffTypeFromPrefix(typePrefix);
  }

  public getDepartmentCode(): string {
    const segments = StaffId.parseSegments(this.props.value);
    return segments ? segments.departmentCode : "GEN";
  }

  public getYear(): number {
    const segments = StaffId.parseSegments(this.props.value);
    if (!segments) {
      return new Date().getFullYear();
    }
    return parseInt(segments.yearMonth.substring(0, 4));
  }

  public getMonth(): number {
    const segments = StaffId.parseSegments(this.props.value);
    if (!segments) {
      return 1;
    }
    return parseInt(segments.yearMonth.substring(4, 6));
  }

  public getSequence(): number {
    const segments = StaffId.parseSegments(this.props.value);
    if (!segments) {
      return 0;
    }
    return parseInt(segments.sequence);
  }

  public getRegistrationPeriod(): string {
    return `${this.getMonth()}/${this.getYear()}`;
  }

  public getDepartmentName(): string {
    const deptCode = this.getDepartmentCode();
    const departments: Record<string, string> = {
      CARD: "Tim mạch",
      NEUR: "Thần kinh",
      ORTH: "Chấn thương chỉnh hình",
      PEDI: "Nhi khoa",
      OBGY: "Sản phụ khoa",
      DERM: "Da liễu",
      OPHT: "Mắt",
      ENT: "Tai mũi họng",
      PSYC: "Tâm thần",
      ANES: "Gây mê hồi sức",
      RADI: "Chẩn đoán hình ảnh",
      PATH: "Giải phẫu bệnh",
      EMRG: "Cấp cứu",
      FAMI: "Y học gia đình",
      INTE: "Nội khoa",
      SURG: "Ngoại khoa",
      PHAR: "Dược",
      THER: "Vật lý trị liệu",
      ADMIN: "Hành chính",
      GEN: "Đa khoa",
    };

    return departments[deptCode] || "Không xác định";
  }

  private static getTypePrefix(staffType: StaffType): string {
    const prefixes: Record<StaffType, string> = {
      doctor: "DOC",
      nurse: "NUR",
      technician: "TEC",
      pharmacist: "PHA",
      therapist: "THE",
      admin: "ADM",
      receptionist: "REC",
    };

    return prefixes[staffType];
  }

  private static getStaffTypeFromPrefix(prefix: string): StaffType {
    const types: Record<string, StaffType> = {
      DOC: "doctor",
      NUR: "nurse",
      TEC: "technician",
      PHA: "pharmacist",
      THE: "therapist",
      ADM: "admin",
      ADMI: "admin", // Legacy format support (legacy IDs flip segments)
      REC: "receptionist",
    };

    return types[prefix] || "admin";
  }

  private static isValidStaffId(value: string): boolean {
    const segments = this.parseSegments(value);
    if (!segments) {
      return false;
    }

    const { yearMonth } = segments;
    if (!/^\d{6}$/.test(yearMonth)) {
      return false;
    }

    const year = parseInt(yearMonth.substring(0, 4));
    const month = parseInt(yearMonth.substring(4, 6));
    const currentYear = new Date().getFullYear();

    if (year < 2000 || year > currentYear + 1) {
      return false;
    }

    if (month < 1 || month > 12) {
      return false;
    }

    return true;
  }

  private static readonly TYPE_PREFIXES = [
    "DOC",
    "NUR",
    "TEC",
    "PHA",
    "THE",
    "ADM",
    "REC",
    "ADMI",
  ];

  private static isTypePrefix(value: string): boolean {
    return this.TYPE_PREFIXES.includes(value);
  }

  private static parseSegments(value: string): StaffIdSegments | null {
    const parts = value.split("-");
    if (parts.length !== 4) {
      return null;
    }

    const [part1, part2, yearMonth, sequence] = parts;
    const part1IsType = this.isTypePrefix(part1);
    const part2IsType = this.isTypePrefix(part2);

    let typePrefix: string | null = null;
    let departmentCode: string | null = null;

    if (part1IsType && !part2IsType) {
      typePrefix = part1;
      departmentCode = part2;
    } else if (!part1IsType && part2IsType) {
      typePrefix = part2;
      departmentCode = part1;
    } else if (part1IsType && part2IsType) {
      // Handle legacy formats: prefer DOC/NUR/... over ADMI when both look like types
      if (part1 === "ADMI" && part2 !== "ADMI") {
        typePrefix = part2;
        departmentCode = part1;
      } else if (part2 === "ADMI" && part1 !== "ADMI") {
        typePrefix = part1;
        departmentCode = part2;
      } else {
        typePrefix = part1;
        departmentCode = part2;
      }
    } else {
      return null;
    }

    if (
      !departmentCode ||
      !/^[A-Z]{3,5}$/.test(departmentCode) ||
      !typePrefix
    ) {
      return null;
    }

    if (!/^\d{2,3}$/.test(sequence)) {
      return null;
    }

    return {
      typePrefix,
      departmentCode,
      yearMonth,
      sequence,
    };
  }

  public override equals(other: StaffId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public override toString(): string {
    return this.props.value;
  }
}
