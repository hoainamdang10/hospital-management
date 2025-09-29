/**
 * Provider Info Value Object - Domain Layer
 * V2 Clean Architecture + DDD Implementation
 * Vietnamese healthcare provider information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from "../../../shared/domain/base/value-object";

export enum ProviderType {
  DOCTOR = "doctor",
  NURSE = "nurse",
  SPECIALIST = "specialist",
  THERAPIST = "therapist",
  TECHNICIAN = "technician",
}

export enum ProviderStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ON_LEAVE = "on_leave",
  SUSPENDED = "suspended",
}

export interface ProviderInfoProps {
  providerId: string;
  fullName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  providerType: ProviderType;
  status: ProviderStatus;
  phone?: string;
  email?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  languages?: string[];
}

/**
 * Provider Info Value Object
 * Contains essential healthcare provider information for appointments
 */
export class ProviderInfo extends HealthcareValueObject<ProviderInfoProps> {
  private constructor(props: ProviderInfoProps) {
    super(props);
  }

  /**
   * Create provider info with Vietnamese healthcare validation
   */
  public static create(
    providerId: string,
    fullName: string,
    specialization: string,
    department: string,
    licenseNumber: string,
    providerType: ProviderType,
    status: ProviderStatus = ProviderStatus.ACTIVE,
    phone?: string,
    email?: string,
    yearsOfExperience?: number,
    qualifications?: string[],
    languages?: string[]
  ): ProviderInfo {
    return new ProviderInfo({
      providerId,
      fullName,
      specialization,
      department,
      licenseNumber,
      providerType,
      status,
      phone,
      email,
      yearsOfExperience,
      qualifications,
      languages,
    });
  }

  // Getters
  public get providerId(): string {
    return this.props.providerId;
  }

  public get fullName(): string {
    return this.props.fullName;
  }

  public get specialization(): string {
    return this.props.specialization;
  }

  public get department(): string {
    return this.props.department;
  }

  public get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  public get providerType(): ProviderType {
    return this.props.providerType;
  }

  public get status(): ProviderStatus {
    return this.props.status;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get yearsOfExperience(): number | undefined {
    return this.props.yearsOfExperience;
  }

  public get qualifications(): string[] | undefined {
    return this.props.qualifications;
  }

  public get languages(): string[] | undefined {
    return this.props.languages;
  }

  /**
   * Check if provider is active and available
   */
  public isActive(): boolean {
    return this.props.status === ProviderStatus.ACTIVE;
  }

  /**
   * Check if provider is on leave
   */
  public isOnLeave(): boolean {
    return this.props.status === ProviderStatus.ON_LEAVE;
  }

  /**
   * Check if provider is suspended
   */
  public isSuspended(): boolean {
    return this.props.status === ProviderStatus.SUSPENDED;
  }

  /**
   * Check if provider is a doctor
   */
  public isDoctor(): boolean {
    return this.props.providerType === ProviderType.DOCTOR;
  }

  /**
   * Check if provider is a specialist
   */
  public isSpecialist(): boolean {
    return this.props.providerType === ProviderType.SPECIALIST;
  }

  /**
   * Check if provider is experienced (5+ years)
   */
  public isExperienced(): boolean {
    return (this.props.yearsOfExperience || 0) >= 5;
  }

  /**
   * Check if provider speaks Vietnamese
   */
  public speaksVietnamese(): boolean {
    return (
      this.props.languages?.includes("vi") ||
      this.props.languages?.includes("vietnamese") ||
      true
    ); // Default assumption for Vietnamese healthcare system
  }

  /**
   * Check if provider speaks English
   */
  public speaksEnglish(): boolean {
    return (
      this.props.languages?.includes("en") ||
      this.props.languages?.includes("english") ||
      false
    );
  }

  /**
   * Get Vietnamese display name for provider type
   */
  public getTypeDisplayName(): string {
    switch (this.props.providerType) {
      case ProviderType.DOCTOR:
        return "Bác sĩ";
      case ProviderType.NURSE:
        return "Y tá";
      case ProviderType.SPECIALIST:
        return "Chuyên khoa";
      case ProviderType.THERAPIST:
        return "Nhà trị liệu";
      case ProviderType.TECHNICIAN:
        return "Kỹ thuật viên";
      default:
        return "Không xác định";
    }
  }

  /**
   * Get Vietnamese display name for status
   */
  public getStatusDisplayName(): string {
    switch (this.props.status) {
      case ProviderStatus.ACTIVE:
        return "Đang hoạt động";
      case ProviderStatus.INACTIVE:
        return "Không hoạt động";
      case ProviderStatus.ON_LEAVE:
        return "Đang nghỉ phép";
      case ProviderStatus.SUSPENDED:
        return "Bị đình chỉ";
      default:
        return "Không xác định";
    }
  }

  /**
   * Get formatted display name with title
   */
  public getDisplayName(): string {
    const title = this.getTypeDisplayName();
    return `${title} ${this.props.fullName}`;
  }

  /**
   * Get department display name in Vietnamese
   */
  public getDepartmentDisplayName(): string {
    // Map common department codes to Vietnamese names
    const departmentMap: { [key: string]: string } = {
      CARD: "Tim mạch",
      ORTH: "Chấn thương chỉnh hình",
      NEUR: "Thần kinh",
      PEDI: "Nhi khoa",
      OBGY: "Sản phụ khoa",
      EMER: "Cấp cứu",
      SURG: "Phẫu thuật",
      INTE: "Nội khoa",
      DERM: "Da liễu",
      OPHT: "Mắt",
      ENT: "Tai mũi họng",
      PSYC: "Tâm thần",
      RADI: "Chẩn đoán hình ảnh",
      ANES: "Gây mê hồi sức",
      PATH: "Giải phẫu bệnh",
    };

    return departmentMap[this.props.department] || this.props.department;
  }

  /**
   * Get experience level description
   */
  public getExperienceLevel(): string {
    const years = this.props.yearsOfExperience || 0;

    if (years < 2) {
      return "Mới tốt nghiệp";
    } else if (years < 5) {
      return "Có kinh nghiệm";
    } else if (years < 10) {
      return "Giàu kinh nghiệm";
    } else {
      return "Chuyên gia";
    }
  }

  /**
   * Get qualifications display string
   */
  public getQualificationsDisplay(): string {
    if (!this.props.qualifications || this.props.qualifications.length === 0) {
      return "Chưa cập nhật";
    }

    return this.props.qualifications.join(", ");
  }

  /**
   * Get languages display string
   */
  public getLanguagesDisplay(): string {
    if (!this.props.languages || this.props.languages.length === 0) {
      return "Tiếng Việt";
    }

    const languageMap: { [key: string]: string } = {
      vi: "Tiếng Việt",
      vietnamese: "Tiếng Việt",
      en: "Tiếng Anh",
      english: "Tiếng Anh",
      fr: "Tiếng Pháp",
      french: "Tiếng Pháp",
      zh: "Tiếng Trung",
      chinese: "Tiếng Trung",
      ja: "Tiếng Nhật",
      japanese: "Tiếng Nhật",
      ko: "Tiếng Hàn",
      korean: "Tiếng Hàn",
    };

    const displayLanguages = this.props.languages.map(
      (lang) => languageMap[lang.toLowerCase()] || lang
    );

    return displayLanguages.join(", ");
  }

  /**
   * Validate Vietnamese medical license format
   */
  private static validateLicenseNumber(licenseNumber: string): boolean {
    // Vietnamese medical license format: VN-{2 letters}-{4 digits}
    const licenseRegex = /^VN-[A-Z]{2}-\d{4}$/;
    return licenseRegex.test(licenseNumber);
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Vietnamese phone number format
   */
  private static validatePhoneNumber(phone: string): boolean {
    // Vietnamese phone number: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  }

  protected validateFormat(): void {
    if (!this.props.providerId) {
      throw new Error("Mã nhà cung cấp không được để trống");
    }

    if (!this.props.fullName || this.props.fullName.trim().length < 2) {
      throw new Error("Họ tên phải có ít nhất 2 ký tự");
    }

    if (!this.props.specialization) {
      throw new Error("Chuyên khoa không được để trống");
    }

    if (!this.props.department) {
      throw new Error("Khoa không được để trống");
    }

    if (!ProviderInfo.validateLicenseNumber(this.props.licenseNumber)) {
      throw new Error(
        "Số giấy phép hành nghề không hợp lệ. Định dạng: VN-XX-XXXX"
      );
    }

    if (this.props.email && !ProviderInfo.validateEmail(this.props.email)) {
      throw new Error("Email không hợp lệ");
    }

    if (
      this.props.phone &&
      !ProviderInfo.validatePhoneNumber(this.props.phone)
    ) {
      throw new Error(
        "Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx (10 số)"
      );
    }

    if (
      this.props.yearsOfExperience !== undefined &&
      this.props.yearsOfExperience < 0
    ) {
      throw new Error("Số năm kinh nghiệm không được âm");
    }
  }

  /**
   * Healthcare-specific: Check if contains PHI
   */
  containsPHI(): boolean {
    return true; // Provider info contains PHI (personal information)
  }

  /**
   * Create anonymized version for logging/audit
   */
  public anonymize(): ProviderInfo {
    return new ProviderInfo({
      ...this.props,
      fullName: `Provider-${this.props.providerId.slice(-4)}`,
      phone: this.props.phone
        ? "*".repeat(6) + this.props.phone.slice(-4)
        : undefined,
      email: this.props.email ? "masked@provider.com" : undefined,
    });
  }

  public isValid(): boolean {
    try {
      this.validateFormat();
      return this.isActive(); // Provider must be active to be valid for appointments
    } catch {
      return false;
    }
  }
}
