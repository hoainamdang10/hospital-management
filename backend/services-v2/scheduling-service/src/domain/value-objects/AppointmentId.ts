/**
 * Appointment ID Value Object - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese healthcare ID format: {TYPE}-{DEPT}-{YYYYMM}-{SEQUENCE}
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from "../../../shared/domain/base/value-object";

export enum AppointmentType {
  CONSULTATION = "CONS",
  FOLLOW_UP = "FOLL",
  EMERGENCY = "EMER",
  SURGERY = "SURG",
  DIAGNOSTIC = "DIAG",
  THERAPY = "THER",
  VACCINATION = "VACC",
  CHECKUP = "CHEC",
}

export enum AppointmentPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
  EMERGENCY = "emergency",
}

export interface AppointmentIdProps {
  value: string;
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  department: string;
}

/**
 * Appointment ID Value Object
 * Format: {TYPE}-{DEPT}-{YYYYMM}-{SEQUENCE}
 * Example: CONS-CARD-202412-001, SURG-ORTH-202412-015
 */
export class AppointmentId extends HealthcareValueObject<AppointmentIdProps> {
  private constructor(props: AppointmentIdProps) {
    super(props);
  }

  /**
   * Create new appointment ID with Vietnamese healthcare format
   */
  public static create(
    appointmentType: AppointmentType,
    department: string,
    priority: AppointmentPriority = AppointmentPriority.NORMAL,
    customId?: string
  ): AppointmentId {
    if (customId) {
      return new AppointmentId({
        value: customId,
        appointmentType,
        priority,
        department,
      });
    }

    // Generate Vietnamese healthcare format ID
    const now = new Date();
    const yearMonth =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, "0");

    // Generate sequence number (would be from database in real implementation)
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, "0");

    const departmentCode = AppointmentId.normalizeDepartmentCode(department);
    const appointmentId = `${appointmentType}-${departmentCode}-${yearMonth}-${sequenceStr}`;

    return new AppointmentId({
      value: appointmentId,
      appointmentType,
      priority,
      department: departmentCode,
    });
  }

  /**
   * Create from existing ID string
   */
  public static fromString(
    appointmentId: string,
    appointmentType: AppointmentType,
    priority: AppointmentPriority,
    department: string
  ): AppointmentId {
    AppointmentId.validateFormat(appointmentId);

    return new AppointmentId({
      value: appointmentId,
      appointmentType,
      priority,
      department,
    });
  }

  // Getters
  public get value(): string {
    return this.props.value;
  }

  public get appointmentType(): AppointmentType {
    return this.props.appointmentType;
  }

  public get priority(): AppointmentPriority {
    return this.props.priority;
  }

  public get department(): string {
    return this.props.department;
  }

  /**
   * Get Vietnamese display name for appointment type
   */
  public getTypeDisplayName(): string {
    switch (this.props.appointmentType) {
      case AppointmentType.CONSULTATION:
        return "Tư vấn";
      case AppointmentType.FOLLOW_UP:
        return "Tái khám";
      case AppointmentType.EMERGENCY:
        return "Cấp cứu";
      case AppointmentType.SURGERY:
        return "Phẫu thuật";
      case AppointmentType.DIAGNOSTIC:
        return "Chẩn đoán";
      case AppointmentType.THERAPY:
        return "Điều trị";
      case AppointmentType.VACCINATION:
        return "Tiêm chủng";
      case AppointmentType.CHECKUP:
        return "Khám tổng quát";
      default:
        return "Không xác định";
    }
  }

  /**
   * Get Vietnamese display name for priority
   */
  public getPriorityDisplayName(): string {
    switch (this.props.priority) {
      case AppointmentPriority.LOW:
        return "Thấp";
      case AppointmentPriority.NORMAL:
        return "Bình thường";
      case AppointmentPriority.HIGH:
        return "Cao";
      case AppointmentPriority.URGENT:
        return "Khẩn cấp";
      case AppointmentPriority.EMERGENCY:
        return "Cấp cứu";
      default:
        return "Không xác định";
    }
  }

  /**
   * Check if appointment is high priority
   */
  public isHighPriority(): boolean {
    return (
      this.props.priority === AppointmentPriority.HIGH ||
      this.props.priority === AppointmentPriority.URGENT ||
      this.props.priority === AppointmentPriority.EMERGENCY
    );
  }

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.props.priority === AppointmentPriority.EMERGENCY;
  }

  /**
   * Extract year-month from ID
   */
  public getYearMonth(): string {
    const parts = this.props.value.split("-");
    return parts.length >= 3 ? parts[2] : "";
  }

  /**
   * Extract sequence number from ID
   */
  public getSequenceNumber(): string {
    const parts = this.props.value.split("-");
    return parts.length >= 4 ? parts[3] : "";
  }

  /**
   * Normalize department code to 4 characters
   */
  private static normalizeDepartmentCode(department: string): string {
    const normalized = department.toUpperCase().replace(/[^A-Z]/g, "");
    return normalized.substring(0, 4).padEnd(4, "X");
  }

  /**
   * Validate appointment ID format
   */
  private static validateFormat(appointmentId: string): void {
    if (!appointmentId) {
      throw new Error("Mã cuộc hẹn không được để trống");
    }

    const pattern = /^[A-Z]{4}-[A-Z]{4}-\d{6}-\d{3}$/;
    if (!pattern.test(appointmentId)) {
      throw new Error(
        "Định dạng mã cuộc hẹn không hợp lệ. Định dạng: TYPE-DEPT-YYYYMM-XXX"
      );
    }
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return false; // Appointment ID itself doesn't contain PHI
  }

  /**
   * Create anonymized version for logging/audit
   */
  public anonymize(): AppointmentId {
    return this; // Appointment ID is already anonymized
  }

  protected validateFormat(): void {
    AppointmentId.validateFormat(this.props.value);

    if (!this.props.appointmentType) {
      throw new Error("Loại cuộc hẹn không được để trống");
    }

    if (!this.props.priority) {
      throw new Error("Mức độ ưu tiên không được để trống");
    }

    if (!this.props.department) {
      throw new Error("Khoa không được để trống");
    }
  }

  public toString(): string {
    return this.props.value;
  }
}
