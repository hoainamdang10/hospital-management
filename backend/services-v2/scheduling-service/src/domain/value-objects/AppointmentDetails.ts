/**
 * Appointment Details Value Object - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese healthcare appointment details
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from "../../../shared/domain/base/value-object";

export enum AppointmentReason {
  CONSULTATION = "consultation",
  FOLLOW_UP = "follow_up",
  EMERGENCY = "emergency",
  SURGERY = "surgery",
  DIAGNOSTIC = "diagnostic",
  THERAPY = "therapy",
  VACCINATION = "vaccination",
  CHECKUP = "checkup",
  PRESCRIPTION = "prescription",
  REFERRAL = "referral",
}

export interface AppointmentDetailsProps {
  reason: string;
  reasonCode?: AppointmentReason;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number; // in minutes
  requiresPreparation: boolean;
  isFollowUp: boolean;
  previousAppointmentId?: string;
  urgencyLevel: "routine" | "urgent" | "emergency";
  specialRequirements?: string[];
  interpreterRequired?: boolean;
  wheelchairAccessible?: boolean;
  fasting?: boolean;
  medicationRestrictions?: string[];
}

/**
 * Appointment Details Value Object
 * Contains detailed information about the appointment purpose and requirements
 */
export class AppointmentDetails extends HealthcareValueObject<AppointmentDetailsProps> {
  private constructor(props: AppointmentDetailsProps) {
    super(props);
  }

  /**
   * Create appointment details with Vietnamese healthcare validation
   */
  public static create(
    reason: string,
    estimatedDuration: number,
    requiresPreparation: boolean = false,
    isFollowUp: boolean = false,
    urgencyLevel: "routine" | "urgent" | "emergency" = "routine",
    reasonCode?: AppointmentReason,
    symptoms?: string,
    notes?: string,
    preparationInstructions?: string,
    previousAppointmentId?: string,
    specialRequirements?: string[],
    interpreterRequired?: boolean,
    wheelchairAccessible?: boolean,
    fasting?: boolean,
    medicationRestrictions?: string[]
  ): AppointmentDetails {
    return new AppointmentDetails({
      reason,
      reasonCode,
      symptoms,
      notes,
      preparationInstructions,
      estimatedDuration,
      requiresPreparation,
      isFollowUp,
      previousAppointmentId,
      urgencyLevel,
      specialRequirements,
      interpreterRequired,
      wheelchairAccessible,
      fasting,
      medicationRestrictions,
    });
  }

  // Getters
  public get reason(): string {
    return this.props.reason;
  }

  public get reasonCode(): AppointmentReason | undefined {
    return this.props.reasonCode;
  }

  public get symptoms(): string | undefined {
    return this.props.symptoms;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get preparationInstructions(): string | undefined {
    return this.props.preparationInstructions;
  }

  public get estimatedDuration(): number {
    return this.props.estimatedDuration;
  }

  public get requiresPreparation(): boolean {
    return this.props.requiresPreparation;
  }

  public get isFollowUp(): boolean {
    return this.props.isFollowUp;
  }

  public get previousAppointmentId(): string | undefined {
    return this.props.previousAppointmentId;
  }

  public get urgencyLevel(): "routine" | "urgent" | "emergency" {
    return this.props.urgencyLevel;
  }

  public get specialRequirements(): string[] | undefined {
    return this.props.specialRequirements;
  }

  public get interpreterRequired(): boolean | undefined {
    return this.props.interpreterRequired;
  }

  public get wheelchairAccessible(): boolean | undefined {
    return this.props.wheelchairAccessible;
  }

  public get fasting(): boolean | undefined {
    return this.props.fasting;
  }

  public get medicationRestrictions(): string[] | undefined {
    return this.props.medicationRestrictions;
  }

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.props.urgencyLevel === "emergency";
  }

  /**
   * Check if appointment is urgent
   */
  public isUrgent(): boolean {
    return this.props.urgencyLevel === "urgent";
  }

  /**
   * Check if appointment is routine
   */
  public isRoutine(): boolean {
    return this.props.urgencyLevel === "routine";
  }

  /**
   * Check if appointment has special requirements
   */
  public hasSpecialRequirements(): boolean {
    return (
      (this.props.specialRequirements &&
        this.props.specialRequirements.length > 0) ||
      this.props.interpreterRequired ||
      this.props.wheelchairAccessible ||
      this.props.fasting ||
      (this.props.medicationRestrictions &&
        this.props.medicationRestrictions.length > 0)
    );
  }

  /**
   * Get Vietnamese display name for reason code
   */
  public getReasonDisplayName(): string {
    if (!this.props.reasonCode) {
      return this.props.reason;
    }

    switch (this.props.reasonCode) {
      case AppointmentReason.CONSULTATION:
        return "Tư vấn";
      case AppointmentReason.FOLLOW_UP:
        return "Tái khám";
      case AppointmentReason.EMERGENCY:
        return "Cấp cứu";
      case AppointmentReason.SURGERY:
        return "Phẫu thuật";
      case AppointmentReason.DIAGNOSTIC:
        return "Chẩn đoán";
      case AppointmentReason.THERAPY:
        return "Điều trị";
      case AppointmentReason.VACCINATION:
        return "Tiêm chủng";
      case AppointmentReason.CHECKUP:
        return "Khám tổng quát";
      case AppointmentReason.PRESCRIPTION:
        return "Kê đơn thuốc";
      case AppointmentReason.REFERRAL:
        return "Chuyển khoa";
      default:
        return this.props.reason;
    }
  }

  /**
   * Get Vietnamese display name for urgency level
   */
  public getUrgencyDisplayName(): string {
    switch (this.props.urgencyLevel) {
      case "routine":
        return "Thường quy";
      case "urgent":
        return "Khẩn cấp";
      case "emergency":
        return "Cấp cứu";
      default:
        return "Không xác định";
    }
  }

  /**
   * Get estimated duration in hours and minutes
   */
  public getDurationDisplay(): string {
    const hours = Math.floor(this.props.estimatedDuration / 60);
    const minutes = this.props.estimatedDuration % 60;

    if (hours === 0) {
      return `${minutes} phút`;
    } else if (minutes === 0) {
      return `${hours} giờ`;
    } else {
      return `${hours} giờ ${minutes} phút`;
    }
  }

  /**
   * Get special requirements display string
   */
  public getSpecialRequirementsDisplay(): string {
    const requirements: string[] = [];

    if (this.props.interpreterRequired) {
      requirements.push("Cần thông dịch viên");
    }

    if (this.props.wheelchairAccessible) {
      requirements.push("Cần xe lăn");
    }

    if (this.props.fasting) {
      requirements.push("Cần nhịn ăn");
    }

    if (this.props.specialRequirements) {
      requirements.push(...this.props.specialRequirements);
    }

    if (
      this.props.medicationRestrictions &&
      this.props.medicationRestrictions.length > 0
    ) {
      requirements.push(
        `Hạn chế thuốc: ${this.props.medicationRestrictions.join(", ")}`
      );
    }

    return requirements.length > 0
      ? requirements.join("; ")
      : "Không có yêu cầu đặc biệt";
  }

  /**
   * Get preparation instructions display
   */
  public getPreparationDisplay(): string {
    if (!this.props.requiresPreparation) {
      return "Không cần chuẩn bị";
    }

    return (
      this.props.preparationInstructions ||
      "Vui lòng liên hệ để biết hướng dẫn chuẩn bị"
    );
  }

  /**
   * Create a copy with updated notes
   */
  public withNotes(notes: string): AppointmentDetails {
    return new AppointmentDetails({
      ...this.props,
      notes,
    });
  }

  /**
   * Create a copy with updated preparation instructions
   */
  public withPreparationInstructions(instructions: string): AppointmentDetails {
    return new AppointmentDetails({
      ...this.props,
      preparationInstructions: instructions,
      requiresPreparation: true,
    });
  }

  /**
   * Create a copy with updated urgency level
   */
  public withUrgencyLevel(
    urgencyLevel: "routine" | "urgent" | "emergency"
  ): AppointmentDetails {
    return new AppointmentDetails({
      ...this.props,
      urgencyLevel,
    });
  }

  /**
   * Create a copy with additional special requirements
   */
  public withSpecialRequirements(requirements: string[]): AppointmentDetails {
    const existingRequirements = this.props.specialRequirements || [];
    const combinedRequirements = [...existingRequirements, ...requirements];

    return new AppointmentDetails({
      ...this.props,
      specialRequirements: combinedRequirements,
    });
  }

  protected validateFormat(): void {
    if (!this.props.reason || this.props.reason.trim().length < 3) {
      throw new Error("Lý do khám phải có ít nhất 3 ký tự");
    }

    if (this.props.estimatedDuration <= 0) {
      throw new Error("Thời gian dự kiến phải lớn hơn 0");
    }

    if (this.props.estimatedDuration > 480) {
      // 8 hours
      throw new Error("Thời gian dự kiến không được vượt quá 8 giờ");
    }

    if (this.props.isFollowUp && !this.props.previousAppointmentId) {
      throw new Error("Cuộc hẹn tái khám phải có mã cuộc hẹn trước đó");
    }

    if (this.props.symptoms && this.props.symptoms.length > 1000) {
      throw new Error("Mô tả triệu chứng không được vượt quá 1000 ký tự");
    }

    if (this.props.notes && this.props.notes.length > 1000) {
      throw new Error("Ghi chú không được vượt quá 1000 ký tự");
    }

    if (
      this.props.preparationInstructions &&
      this.props.preparationInstructions.length > 500
    ) {
      throw new Error("Hướng dẫn chuẩn bị không được vượt quá 500 ký tự");
    }
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return true; // Appointment details contain medical information (PHI)
  }

  /**
   * Create anonymized version for logging/audit
   */
  public anonymize(): AppointmentDetails {
    return new AppointmentDetails({
      ...this.props,
      reason: "Lý do đã ẩn",
      symptoms: this.props.symptoms ? "Triệu chứng đã ẩn" : undefined,
      notes: this.props.notes ? "Ghi chú đã ẩn" : undefined,
      preparationInstructions: this.props.preparationInstructions
        ? "Hướng dẫn đã ẩn"
        : undefined,
      previousAppointmentId: this.props.previousAppointmentId
        ? "MASKED-APPOINTMENT-ID"
        : undefined,
      specialRequirements: this.props.specialRequirements
        ? ["Yêu cầu đặc biệt đã ẩn"]
        : undefined,
      medicationRestrictions: this.props.medicationRestrictions
        ? ["Hạn chế thuốc đã ẩn"]
        : undefined,
    });
  }

  public isValid(): boolean {
    try {
      this.validateFormat();
      return true;
    } catch {
      return false;
    }
  }
}
