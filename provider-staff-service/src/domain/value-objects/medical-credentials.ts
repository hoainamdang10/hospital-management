/**
 * Medical Credentials Value Object - Domain Layer
 * Vietnamese healthcare medical license and credentials validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Medical License Standards, Healthcare Regulations
 */

import { HealthcareValueObject } from '../../../shared/domain/base/entity';

export interface MedicalCredentialsProps {
  medicalLicenseNumber: string;
  licenseType: MedicalLicenseType;
  issuingAuthority: string;
  issueDate: Date;
  expirationDate: Date;
  specializations: Specialization[];
  certifications: Certification[];
  educationLevel: EducationLevel;
  medicalSchool: string;
  graduationYear: number;
  residencyProgram?: string;
  fellowshipProgram?: string;
}

export enum MedicalLicenseType {
  GENERAL_PRACTITIONER = 'GP',
  SPECIALIST = 'SP',
  CONSULTANT = 'CO',
  PROFESSOR = 'PR',
  ASSOCIATE_PROFESSOR = 'AP'
}

export enum Specialization {
  CARDIOLOGY = 'cardiology',
  NEUROLOGY = 'neurology',
  ORTHOPEDICS = 'orthopedics',
  PEDIATRICS = 'pediatrics',
  INTERNAL_MEDICINE = 'internal_medicine',
  SURGERY = 'surgery',
  OBSTETRICS_GYNECOLOGY = 'obstetrics_gynecology',
  EMERGENCY_MEDICINE = 'emergency_medicine',
  RADIOLOGY = 'radiology',
  ANESTHESIOLOGY = 'anesthesiology',
  PSYCHIATRY = 'psychiatry',
  DERMATOLOGY = 'dermatology',
  OPHTHALMOLOGY = 'ophthalmology',
  ENT = 'ent',
  UROLOGY = 'urology'
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  certificationNumber: string;
  isValid: boolean;
}

export enum EducationLevel {
  BACHELOR_MEDICINE = 'bachelor_medicine',
  MASTER_MEDICINE = 'master_medicine',
  DOCTOR_MEDICINE = 'doctor_medicine',
  PHD_MEDICINE = 'phd_medicine',
  PROFESSOR = 'professor'
}

/**
 * Medical Credentials Value Object
 * Contains doctor's medical license, specializations, and certifications
 */
export class MedicalCredentials extends HealthcareValueObject<MedicalCredentialsProps> {
  private constructor(props: MedicalCredentialsProps) {
    super(props);
  }

  /**
   * Create Medical Credentials
   */
  public static create(
    medicalLicenseNumber: string,
    licenseType: MedicalLicenseType,
    issuingAuthority: string,
    issueDate: Date,
    expirationDate: Date,
    specializations: Specialization[],
    certifications: Certification[],
    educationLevel: EducationLevel,
    medicalSchool: string,
    graduationYear: number,
    residencyProgram?: string,
    fellowshipProgram?: string
  ): MedicalCredentials {
    return new MedicalCredentials({
      medicalLicenseNumber: medicalLicenseNumber.trim().toUpperCase(),
      licenseType,
      issuingAuthority: issuingAuthority.trim(),
      issueDate,
      expirationDate,
      specializations,
      certifications,
      educationLevel,
      medicalSchool: medicalSchool.trim(),
      graduationYear,
      residencyProgram: residencyProgram?.trim(),
      fellowshipProgram: fellowshipProgram?.trim()
    });
  }

  /**
   * Getters
   */
  get medicalLicenseNumber(): string {
    return this.props.medicalLicenseNumber;
  }

  get licenseType(): MedicalLicenseType {
    return this.props.licenseType;
  }

  get issuingAuthority(): string {
    return this.props.issuingAuthority;
  }

  get issueDate(): Date {
    return this.props.issueDate;
  }

  get expirationDate(): Date {
    return this.props.expirationDate;
  }

  get specializations(): Specialization[] {
    return this.props.specializations;
  }

  get certifications(): Certification[] {
    return this.props.certifications;
  }

  get educationLevel(): EducationLevel {
    return this.props.educationLevel;
  }

  get medicalSchool(): string {
    return this.props.medicalSchool;
  }

  get graduationYear(): number {
    return this.props.graduationYear;
  }

  get residencyProgram(): string | undefined {
    return this.props.residencyProgram;
  }

  get fellowshipProgram(): string | undefined {
    return this.props.fellowshipProgram;
  }

  /**
   * Business methods
   */

  /**
   * Check if license is currently valid
   */
  isLicenseValid(): boolean {
    const now = new Date();
    return this.props.issueDate <= now && this.props.expirationDate > now;
  }

  /**
   * Get days until license expiration
   */
  getDaysUntilExpiration(): number {
    const now = new Date();
    const timeDiff = this.props.expirationDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if license is expiring soon (within 90 days)
   */
  isExpiringSoon(): boolean {
    return this.getDaysUntilExpiration() <= 90 && this.getDaysUntilExpiration() > 0;
  }

  /**
   * Check if license is expired
   */
  isExpired(): boolean {
    return this.getDaysUntilExpiration() <= 0;
  }

  /**
   * Get years of experience since graduation
   */
  getYearsOfExperience(): number {
    const currentYear = new Date().getFullYear();
    return Math.max(0, currentYear - this.props.graduationYear);
  }

  /**
   * Check if doctor is senior (>= 10 years experience)
   */
  isSeniorDoctor(): boolean {
    return this.getYearsOfExperience() >= 10;
  }

  /**
   * Check if doctor is junior (< 5 years experience)
   */
  isJuniorDoctor(): boolean {
    return this.getYearsOfExperience() < 5;
  }

  /**
   * Check if has specific specialization
   */
  hasSpecialization(specialization: Specialization): boolean {
    return this.props.specializations.includes(specialization);
  }

  /**
   * Get valid certifications
   */
  getValidCertifications(): Certification[] {
    const now = new Date();
    return this.props.certifications.filter(cert => 
      cert.isValid && 
      (!cert.expirationDate || cert.expirationDate > now)
    );
  }

  /**
   * Get expired certifications
   */
  getExpiredCertifications(): Certification[] {
    const now = new Date();
    return this.props.certifications.filter(cert => 
      !cert.isValid || 
      (cert.expirationDate && cert.expirationDate <= now)
    );
  }

  /**
   * Check if can perform surgery
   */
  canPerformSurgery(): boolean {
    const surgicalSpecializations = [
      Specialization.SURGERY,
      Specialization.ORTHOPEDICS,
      Specialization.NEUROLOGY,
      Specialization.CARDIOLOGY,
      Specialization.UROLOGY,
      Specialization.OBSTETRICS_GYNECOLOGY
    ];

    return this.props.specializations.some(spec => surgicalSpecializations.includes(spec)) &&
           this.props.licenseType !== MedicalLicenseType.GENERAL_PRACTITIONER;
  }

  /**
   * Check if can treat pediatric patients
   */
  canTreatPediatric(): boolean {
    return this.hasSpecialization(Specialization.PEDIATRICS) ||
           this.props.licenseType === MedicalLicenseType.GENERAL_PRACTITIONER;
  }

  /**
   * Check if can work in emergency
   */
  canWorkInEmergency(): boolean {
    return this.hasSpecialization(Specialization.EMERGENCY_MEDICINE) ||
           this.props.licenseType === MedicalLicenseType.GENERAL_PRACTITIONER ||
           this.isSeniorDoctor();
  }

  /**
   * Validate format
   */
  protected validateFormat(): void {
    // Validate medical license number format (Vietnamese format: VN-XX-XXXXXX)
    this.validateMedicalLicenseNumber();

    // Validate dates
    this.validateDates();

    // Validate education
    this.validateEducation();

    // Validate specializations
    this.validateSpecializations();

    // Validate certifications
    this.validateCertifications();
  }

  /**
   * Validate Vietnamese medical license number
   */
  private validateMedicalLicenseNumber(): void {
    const licenseRegex = /^VN-[A-Z]{2}-\d{6}$/;
    
    if (!licenseRegex.test(this.props.medicalLicenseNumber)) {
      throw new Error('Số giấy phép hành nghề không đúng định dạng. Định dạng hợp lệ: VN-XX-XXXXXX');
    }

    // Validate province code (first 2 letters after VN-)
    const provinceCode = this.props.medicalLicenseNumber.substring(3, 5);
    const validProvinceCodes = [
      'HN', 'HCM', 'DN', 'HP', 'CT', 'AG', 'BG', 'BK', 'BL', 'BN',
      'BT', 'BD', 'BP', 'BT', 'CM', 'CB', 'DL', 'DN', 'DT', 'GL',
      'HG', 'HT', 'HD', 'HG', 'HB', 'HY', 'KH', 'KG', 'KT', 'LC',
      'LD', 'LS', 'LC', 'LA', 'ND', 'NA', 'NB', 'NT', 'PT', 'PY',
      'QB', 'QN', 'QG', 'QN', 'QT', 'ST', 'SL', 'TN', 'TB', 'TN',
      'TH', 'TT', 'TG', 'TV', 'TQ', 'VL', 'VP', 'YB'
    ];

    if (!validProvinceCodes.includes(provinceCode)) {
      throw new Error(`Mã tỉnh/thành phố trong giấy phép không hợp lệ: ${provinceCode}`);
    }
  }

  /**
   * Validate dates
   */
  private validateDates(): void {
    const now = new Date();

    if (this.props.issueDate > now) {
      throw new Error('Ngày cấp giấy phép không thể là ngày trong tương lai');
    }

    if (this.props.expirationDate <= this.props.issueDate) {
      throw new Error('Ngày hết hạn giấy phép phải sau ngày cấp');
    }

    // License should be valid for at least 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (this.props.expirationDate.getTime() - this.props.issueDate.getTime() < oneYear) {
      throw new Error('Giấy phép hành nghề phải có hiệu lực ít nhất 1 năm');
    }
  }

  /**
   * Validate education
   */
  private validateEducation(): void {
    const currentYear = new Date().getFullYear();

    if (this.props.graduationYear < 1950 || this.props.graduationYear > currentYear) {
      throw new Error(`Năm tốt nghiệp không hợp lệ: ${this.props.graduationYear}`);
    }

    if (!this.props.medicalSchool || this.props.medicalSchool.length < 5) {
      throw new Error('Tên trường y khoa không hợp lệ');
    }

    // Validate education level consistency
    const yearsOfExperience = this.getYearsOfExperience();
    
    if (this.props.educationLevel === EducationLevel.PROFESSOR && yearsOfExperience < 15) {
      throw new Error('Giáo sư y khoa phải có ít nhất 15 năm kinh nghiệm');
    }

    if (this.props.licenseType === MedicalLicenseType.PROFESSOR && 
        this.props.educationLevel !== EducationLevel.PROFESSOR) {
      throw new Error('Giấy phép giáo sư phải có trình độ giáo sư');
    }
  }

  /**
   * Validate specializations
   */
  private validateSpecializations(): void {
    if (this.props.specializations.length === 0 && 
        this.props.licenseType !== MedicalLicenseType.GENERAL_PRACTITIONER) {
      throw new Error('Bác sĩ chuyên khoa phải có ít nhất một chuyên khoa');
    }

    // General practitioners shouldn't have specializations
    if (this.props.licenseType === MedicalLicenseType.GENERAL_PRACTITIONER &&
        this.props.specializations.length > 0) {
      throw new Error('Bác sĩ đa khoa không được có chuyên khoa cụ thể');
    }

    // Validate specialization consistency
    const uniqueSpecializations = new Set(this.props.specializations);
    if (uniqueSpecializations.size !== this.props.specializations.length) {
      throw new Error('Không được có chuyên khoa trùng lặp');
    }
  }

  /**
   * Validate certifications
   */
  private validateCertifications(): void {
    for (const cert of this.props.certifications) {
      if (!cert.name || cert.name.trim().length === 0) {
        throw new Error('Tên chứng chỉ không được để trống');
      }

      if (!cert.issuingOrganization || cert.issuingOrganization.trim().length === 0) {
        throw new Error('Tổ chức cấp chứng chỉ không được để trống');
      }

      if (!cert.certificationNumber || cert.certificationNumber.trim().length === 0) {
        throw new Error('Số chứng chỉ không được để trống');
      }

      if (cert.issueDate > new Date()) {
        throw new Error('Ngày cấp chứng chỉ không thể là ngày trong tương lai');
      }

      if (cert.expirationDate && cert.expirationDate <= cert.issueDate) {
        throw new Error('Ngày hết hạn chứng chỉ phải sau ngày cấp');
      }
    }
  }

  /**
   * Contains PHI - Medical credentials contain PHI
   */
  containsPHI(): boolean {
    return true;
  }

  /**
   * Validate PHI format
   */
  protected validatePHIFormat(): void {
    // Ensure license number is properly formatted for privacy
    if (this.props.medicalLicenseNumber.length < 10) {
      throw new Error('Số giấy phép hành nghề không đủ độ dài để đảm bảo bảo mật');
    }
  }

  /**
   * Anonymize for non-PHI use
   */
  anonymize(): Partial<MedicalCredentialsProps> {
    return {
      medicalLicenseNumber: this.maskLicenseNumber(this.props.medicalLicenseNumber),
      licenseType: this.props.licenseType,
      issuingAuthority: 'Bộ Y tế',
      issueDate: new Date(this.props.issueDate.getFullYear(), 0, 1),
      expirationDate: new Date(this.props.expirationDate.getFullYear(), 0, 1),
      specializations: this.props.specializations,
      certifications: this.props.certifications.map(cert => ({
        ...cert,
        certificationNumber: '***'
      })),
      educationLevel: this.props.educationLevel,
      medicalSchool: 'Trường Y khoa',
      graduationYear: this.props.graduationYear
    };
  }

  /**
   * Mask license number
   */
  private maskLicenseNumber(licenseNumber: string): string {
    const parts = licenseNumber.split('-');
    return `VN-${parts[1]}-***`;
  }

  /**
   * Get specialization names in Vietnamese
   */
  getSpecializationNamesVietnamese(): string[] {
    const specializationNames: { [key in Specialization]: string } = {
      [Specialization.CARDIOLOGY]: 'Tim mạch',
      [Specialization.NEUROLOGY]: 'Thần kinh',
      [Specialization.ORTHOPEDICS]: 'Chấn thương chỉnh hình',
      [Specialization.PEDIATRICS]: 'Nhi khoa',
      [Specialization.INTERNAL_MEDICINE]: 'Nội khoa',
      [Specialization.SURGERY]: 'Ngoại khoa',
      [Specialization.OBSTETRICS_GYNECOLOGY]: 'Sản phụ khoa',
      [Specialization.EMERGENCY_MEDICINE]: 'Cấp cứu',
      [Specialization.RADIOLOGY]: 'Chẩn đoán hình ảnh',
      [Specialization.ANESTHESIOLOGY]: 'Gây mê hồi sức',
      [Specialization.PSYCHIATRY]: 'Tâm thần',
      [Specialization.DERMATOLOGY]: 'Da liễu',
      [Specialization.OPHTHALMOLOGY]: 'Mắt',
      [Specialization.ENT]: 'Tai mũi họng',
      [Specialization.UROLOGY]: 'Tiết niệu'
    };

    return this.props.specializations.map(spec => specializationNames[spec]);
  }

  /**
   * String representation
   */
  toString(): string {
    const specializations = this.getSpecializationNamesVietnamese().join(', ');
    return `${this.props.medicalLicenseNumber} - ${specializations || 'Đa khoa'}`;
  }
}
