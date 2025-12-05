/**
 * PersonalInfo Value Object
 * Vietnamese Healthcare Personal Information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareValueObject } from "@shared/domain/base/value-object";
import { safeToISOString } from "../utils/date-utils";

export interface Address {
  street: string;
  ward?: string; // Optional for legacy data compatibility
  district: string;
  city: string;
  province?: string; // Optional for legacy data compatibility
  country: string;
}

interface PersonalInfoProps {
  fullName: string;
  dateOfBirth: Date;
  gender: "male" | "female" | "other";
  nationalId: string; // CMND/CCCD
  nationality: string;
  phoneNumber: string;
  email?: string;
  address: Address;
}

export class PersonalInfo extends HealthcareValueObject<PersonalInfoProps> {
  private constructor(props: PersonalInfoProps) {
    super(props);
  }

  protected validateFormat(): void {
    // Full name validation
    if (!this.props.fullName || this.props.fullName.trim().length === 0) {
      throw new Error("Họ tên không được để trống");
    }

    if (this.props.fullName.trim().length < 2) {
      throw new Error("Họ tên phải có ít nhất 2 ký tự");
    }

    // Date of birth validation
    if (!this.props.dateOfBirth) {
      throw new Error("Ngày sinh không được để trống");
    }

    const age = this.calculateAge();
    if (age < 18) {
      throw new Error("Nhân viên phải từ 18 tuổi trở lên");
    }

    if (age > 100) {
      throw new Error("Ngày sinh không hợp lệ");
    }

    // National ID validation (CMND/CCCD)
    if (!this.props.nationalId || this.props.nationalId.trim().length === 0) {
      throw new Error("CMND/CCCD không được để trống");
    }

    if (!this.isValidVietnameseNationalId(this.props.nationalId)) {
      throw new Error("CMND/CCCD không đúng định dạng Việt Nam");
    }

    // Phone number validation
    if (!this.props.phoneNumber || this.props.phoneNumber.trim().length === 0) {
      throw new Error("Số điện thoại không được để trống");
    }

    if (!this.isValidVietnamesePhoneNumber(this.props.phoneNumber)) {
      throw new Error("Số điện thoại không đúng định dạng Việt Nam");
    }

    // Email validation (optional)
    if (this.props.email && !this.isValidEmail(this.props.email)) {
      throw new Error("Email không đúng định dạng");
    }

    // Address validation
    if (!this.props.address) {
      throw new Error("Địa chỉ không được để trống");
    }

    this.validateAddress();
  }

  public static create(props: PersonalInfoProps): PersonalInfo {
    return new PersonalInfo({
      ...props,
      fullName: props.fullName.trim(),
      nationalId: props.nationalId.trim().toUpperCase(),
      phoneNumber: props.phoneNumber.trim(),
      email: props.email?.trim().toLowerCase(),
      nationality: props.nationality.trim(),
    });
  }

  public static fromPersistence(data: any): PersonalInfo {
    // Handle both snake_case (old) and camelCase (new) formats from database
    return PersonalInfo.create({
      fullName: data.fullName || data.full_name,
      dateOfBirth: new Date(data.dateOfBirth || data.date_of_birth),
      gender: data.gender,
      nationalId: data.nationalId || data.national_id,
      nationality: data.nationality || "Vietnamese", // Default if not provided
      phoneNumber: data.contact?.phone || data.phoneNumber || data.phone_number,
      email: data.contact?.email || data.email,
      address: data.address,
    });
  }

  // Getters
  public get fullName(): string {
    return this.props.fullName;
  }

  public get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  public get gender(): "male" | "female" | "other" {
    return this.props.gender;
  }

  public get nationalId(): string {
    return this.props.nationalId;
  }

  public get nationality(): string {
    return this.props.nationality;
  }

  public get phoneNumber(): string {
    return this.props.phoneNumber;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get address(): Address {
    return { ...this.props.address };
  }

  // Business methods
  public calculateAge(): number {
    const today = new Date();
    const birthDate = this.props.dateOfBirth;
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

  public getFullAddress(): string {
    const addr = this.props.address;
    return `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}, ${addr.province}, ${addr.country}`;
  }

  public isVietnamese(): boolean {
    return (
      this.props.nationality.toLowerCase() === "vietnam" ||
      this.props.nationality.toLowerCase() === "việt nam"
    );
  }

  public isValid(): boolean {
    try {
      this.validateFormat();
      return true;
    } catch {
      return false;
    }
  }

  public isVietnameseCompliant(): boolean {
    return (
      this.isVietnamese() &&
      this.isValidVietnameseNationalId(this.props.nationalId) &&
      this.isValidVietnamesePhoneNumber(this.props.phoneNumber)
    );
  }

  public isHIPAACompliant(): boolean {
    // HIPAA requires proper PHI handling
    return (
      this.props.fullName.length > 0 &&
      this.props.nationalId.length > 0 &&
      this.props.phoneNumber.length > 0
    );
  }

  // HIPAA compliance methods
  public containsPHI(): boolean {
    return true; // Personal info always contains PHI
  }

  public anonymize(): HealthcareValueObject<PersonalInfoProps> {
    return PersonalInfo.create({
      ...this.props,
      fullName: this.maskName(this.props.fullName),
      nationalId: this.maskNationalId(this.props.nationalId),
      phoneNumber: this.maskPhoneNumber(this.props.phoneNumber),
      email: this.props.email ? this.maskEmail(this.props.email) : undefined,
    });
  }

  // Validation helpers
  private validateAddress(): void {
    const addr = this.props.address;

    // Required fields (flexible for legacy data)
    if (!addr.street || addr.street.trim().length === 0) {
      throw new Error("Địa chỉ đường/phố không được để trống");
    }

    // Ward is optional for legacy data compatibility
    // if (!addr.ward || addr.ward.trim().length === 0) {
    //   throw new Error('Phường/xã không được để trống');
    // }

    if (!addr.district || addr.district.trim().length === 0) {
      throw new Error("Quận/huyện không được để trống");
    }

    if (!addr.city || addr.city.trim().length === 0) {
      throw new Error("Thành phố không được để trống");
    }

    // Province is optional (city might be enough)
    // if (!addr.province || addr.province.trim().length === 0) {
    //   throw new Error('Tỉnh/thành phố không được để trống');
    // }

    if (!addr.country || addr.country.trim().length === 0) {
      throw new Error("Quốc gia không được để trống");
    }
  }

  private isValidVietnameseNationalId(nationalId: string): boolean {
    // CMND: 9 or 12 digits
    // CCCD: 12 digits
    const cmndRegex = /^\d{9}$/;
    const cccdRegex = /^\d{12}$/;

    return cmndRegex.test(nationalId) || cccdRegex.test(nationalId);
  }

  private isValidVietnamesePhoneNumber(phoneNumber: string): boolean {
    // Vietnamese phone number formats:
    // - Local: 0XXXXXXXXX (10 digits starting with 0)
    // - International: +84XXXXXXXXX (9 digits after +84)
    const cleanPhone = phoneNumber.replace(/[\s-]/g, "");

    // Check local format
    const localPhoneRegex = /^0\d{9}$/;
    if (localPhoneRegex.test(cleanPhone)) {
      return true;
    }

    // Check international format
    const intlPhoneRegex = /^\+84\d{9,10}$/;
    if (intlPhoneRegex.test(cleanPhone)) {
      return true;
    }

    return false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Masking methods for anonymization
  private maskName(name: string): string {
    const parts = name.split(" ");
    if (parts.length === 1) {
      return name.charAt(0) + "*".repeat(name.length - 1);
    }

    return parts
      .map((part, index) => {
        if (index === 0 || index === parts.length - 1) {
          return part;
        }
        return "*".repeat(part.length);
      })
      .join(" ");
  }

  private maskNationalId(nationalId: string): string {
    if (nationalId.length <= 4) return "***";
    return (
      nationalId.substring(0, 2) +
      "*".repeat(nationalId.length - 4) +
      nationalId.substring(nationalId.length - 2)
    );
  }

  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return "***";
    return (
      phoneNumber.substring(0, 3) +
      "*".repeat(phoneNumber.length - 6) +
      phoneNumber.substring(phoneNumber.length - 3)
    );
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) {
      return "*@" + domain;
    }
    return (
      localPart.charAt(0) +
      "*".repeat(localPart.length - 2) +
      localPart.charAt(localPart.length - 1) +
      "@" +
      domain
    );
  }

  // Persistence
  public toPersistence(): any {
    return {
      full_name: this.props.fullName,
      date_of_birth: safeToISOString(this.props.dateOfBirth),
      gender: this.props.gender,
      national_id: this.props.nationalId,
      nationality: this.props.nationality,
      phone_number: this.props.phoneNumber,
      email: this.props.email,
      address: this.props.address,
    };
  }

  public override equals(other: PersonalInfo): boolean {
    if (!other) return false;

    return (
      this.props.fullName === other.props.fullName &&
      this.props.dateOfBirth.getTime() === other.props.dateOfBirth.getTime() &&
      this.props.gender === other.props.gender &&
      this.props.nationalId === other.props.nationalId &&
      this.props.phoneNumber === other.props.phoneNumber
    );
  }

  public override toString(): string {
    return `${this.props.fullName} (${this.props.nationalId})`;
  }
}
