/**
 * Patient Info Value Object - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese healthcare patient information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from "../../../shared/domain/base/value-object";

export interface PatientInfoProps {
  patientId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  insuranceNumber?: string;
  insuranceType?: "BHYT" | "BHTN" | "PRIVATE" | "NONE";
}

/**
 * Patient Info Value Object
 * Contains essential patient information for appointments
 */
export class PatientInfo extends HealthcareValueObject<PatientInfoProps> {
  private constructor(props: PatientInfoProps) {
    super(props);
  }

  /**
   * Create patient info with Vietnamese healthcare validation
   */
  public static create(
    patientId: string,
    fullName: string,
    phone: string,
    dateOfBirth: string,
    nationalId: string,
    email?: string,
    address?: string,
    emergencyContact?: string,
    insuranceNumber?: string,
    insuranceType?: "BHYT" | "BHTN" | "PRIVATE" | "NONE"
  ): PatientInfo {
    return new PatientInfo({
      patientId,
      fullName,
      phone,
      dateOfBirth,
      nationalId,
      email,
      address,
      emergencyContact,
      insuranceNumber,
      insuranceType,
    });
  }

  // Getters
  public get patientId(): string {
    return this.props.patientId;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get phone(): string {
    return this.props.phone;
  }

  public get dateOfBirth(): string {
    return this.props.dateOfBirth;
  }

  public get nationalId(): string {
    return this.props.nationalId;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get emergencyContact(): string | undefined {
    return this.props.emergencyContact;
  }

  public get insuranceNumber(): string | undefined {
    return this.props.insuranceNumber;
  }

  public get insuranceType(): "BHYT" | "BHTN" | "PRIVATE" | "NONE" | undefined {
    return this.props.insuranceType;
  }

  /**
   * Calculate age from date of birth
   */
  public getAge(): number {
    const birthDate = new Date(this.props.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Check if patient is a minor (under 18)
   */
  public isMinor(): boolean {
    return this.getAge() < 18;
  }

  /**
   * Check if patient is elderly (over 65)
   */
  public isElderly(): boolean {
    return this.getAge() > 65;
  }

  /**
   * Check if patient has insurance
   */
  public hasInsurance(): boolean {
    return (
      this.props.insuranceType !== "NONE" &&
      this.props.insuranceType !== undefined &&
      this.props.insuranceNumber !== undefined
    );
  }

  /**
   * Check if patient has BHYT (Social Health Insurance)
   */
  public hasBHYT(): boolean {
    return this.props.insuranceType === "BHYT";
  }

  /**
   * Check if patient has BHTN (Social Insurance)
   */
  public hasBHTN(): boolean {
    return this.props.insuranceType === "BHTN";
  }

  /**
   * Get insurance display name in Vietnamese
   */
  public getInsuranceDisplayName(): string {
    switch (this.props.insuranceType) {
      case "BHYT":
        return "Bảo hiểm y tế";
      case "BHTN":
        return "Bảo hiểm tai nạn";
      case "PRIVATE":
        return "Bảo hiểm tư nhân";
      case "NONE":
        return "Không có bảo hiểm";
      default:
        return "Chưa xác định";
    }
  }

  /**
   * Get formatted display name
   */
  public getDisplayName(): string {
    return this.props.fullName;
  }

  /**
   * Get masked phone number for privacy
   */
  public getMaskedPhone(): string {
    if (this.props.phone.length < 4) {
      return this.props.phone;
    }

    const visiblePart = this.props.phone.slice(-4);
    const maskedPart = "*".repeat(this.props.phone.length - 4);
    return maskedPart + visiblePart;
  }

  /**
   * Get masked national ID for privacy
   */
  public getMaskedNationalId(): string {
    if (this.props.nationalId.length < 4) {
      return this.props.nationalId;
    }

    const visiblePart = this.props.nationalId.slice(-4);
    const maskedPart = "*".repeat(this.props.nationalId.length - 4);
    return maskedPart + visiblePart;
  }

  /**
   * Validate Vietnamese phone number format
   */
  private static validatePhoneNumber(phone: string): boolean {
    // Vietnamese phone number: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate Vietnamese national ID format
   */
  private static validateNationalId(nationalId: string): boolean {
    // Vietnamese national ID: 9 or 12 digits
    const nationalIdRegex = /^\d{9}$|^\d{12}$/;
    return nationalIdRegex.test(nationalId);
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date of birth format (YYYY-MM-DD)
   */
  private static validateDateOfBirth(dateOfBirth: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return false;
    }

    const date = new Date(dateOfBirth);
    const today = new Date();

    // Check if date is valid and not in the future
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date <= today &&
      date.getFullYear() > 1900
    ); // Reasonable birth year
  }

  protected validateFormat(): void {
    if (!this.props.patientId) {
      throw new Error("Mã bệnh nhân không được để trống");
    }

    if (!this.props.fullName || this.props.fullName.trim().length < 2) {
      throw new Error("Họ tên phải có ít nhất 2 ký tự");
    }

    if (!PatientInfo.validatePhoneNumber(this.props.phone)) {
      throw new Error(
        "Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx (10 số)"
      );
    }

    if (!PatientInfo.validateDateOfBirth(this.props.dateOfBirth)) {
      throw new Error("Ngày sinh không hợp lệ. Định dạng: YYYY-MM-DD");
    }

    if (!PatientInfo.validateNationalId(this.props.nationalId)) {
      throw new Error("Số CMND/CCCD không hợp lệ. Phải có 9 hoặc 12 số");
    }

    if (this.props.email && !PatientInfo.validateEmail(this.props.email)) {
      throw new Error("Email không hợp lệ");
    }

    // Validate insurance consistency
    if (
      this.props.insuranceType !== "NONE" &&
      this.props.insuranceType !== undefined &&
      !this.props.insuranceNumber
    ) {
      throw new Error("Số bảo hiểm không được để trống khi có loại bảo hiểm");
    }
  }

  public isValid(): boolean {
    try {
      this.validateFormat();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return true; // Patient info always contains PHI
  }

  /**
   * Create anonymized version for logging/audit
   */
  public anonymize(): PatientInfo {
    return new PatientInfo({
      ...this.props,
      fullName: `Patient-${this.props.patientId.slice(-4)}`,
      phone: this.getMaskedPhone(),
      nationalId: this.getMaskedNationalId(),
      email: this.props.email ? "masked@email.com" : undefined,
      address: this.props.address ? "Địa chỉ đã ẩn" : undefined,
    });
  }
}
