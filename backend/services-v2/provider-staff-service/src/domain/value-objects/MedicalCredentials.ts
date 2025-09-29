/**
 * MedicalCredentials Value Object
 * Vietnamese Healthcare Professional Credentials
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface MedicalCredentialsProps {
  licenseNumber: string;
  licenseType: 'general' | 'specialist' | 'consultant';
  issuingAuthority: string;
  issueDate: Date;
  expirationDate?: Date;
  specialtyLicenses: SpecialtyLicense[];
  medicalDegree: string;
  medicalSchool: string;
  graduationYear: number;
  residencyProgram?: string;
  fellowshipProgram?: string;
  boardCertifications: string[];
}

interface SpecialtyLicense {
  specialty: string;
  licenseNumber: string;
  issueDate: Date;
  expirationDate?: Date;
  isActive: boolean;
}

export class MedicalCredentials extends ValueObject<MedicalCredentialsProps> {
  private constructor(props: MedicalCredentialsProps) {
    super(props);
  }

  public static create(props: MedicalCredentialsProps): MedicalCredentials {
    // Validate license number format (Vietnamese format: VN-XX-XXXXXX)
    if (!this.isValidVietnameseLicenseNumber(props.licenseNumber)) {
      throw new Error('Số giấy phép hành nghề không đúng định dạng Việt Nam (VN-XX-XXXXXX)');
    }

    // Validate issuing authority
    if (!props.issuingAuthority || props.issuingAuthority.trim().length === 0) {
      throw new Error('Cơ quan cấp phép không được để trống');
    }

    // Validate issue date
    if (props.issueDate > new Date()) {
      throw new Error('Ngày cấp phép không được là ngày trong tương lai');
    }

    // Validate expiration date
    if (props.expirationDate && props.expirationDate <= props.issueDate) {
      throw new Error('Ngày hết hạn phải sau ngày cấp phép');
    }

    // Validate medical degree
    if (!props.medicalDegree || props.medicalDegree.trim().length === 0) {
      throw new Error('Bằng cấp y khoa không được để trống');
    }

    // Validate medical school
    if (!props.medicalSchool || props.medicalSchool.trim().length === 0) {
      throw new Error('Trường y khoa không được để trống');
    }

    // Validate graduation year
    const currentYear = new Date().getFullYear();
    if (props.graduationYear < 1950 || props.graduationYear > currentYear) {
      throw new Error('Năm tốt nghiệp không hợp lệ');
    }

    return new MedicalCredentials({
      ...props,
      licenseNumber: props.licenseNumber.trim().toUpperCase(),
      issuingAuthority: props.issuingAuthority.trim(),
      medicalDegree: props.medicalDegree.trim(),
      medicalSchool: props.medicalSchool.trim(),
      residencyProgram: props.residencyProgram?.trim(),
      fellowshipProgram: props.fellowshipProgram?.trim(),
      boardCertifications: props.boardCertifications.map(cert => cert.trim()),
      specialtyLicenses: props.specialtyLicenses.map(license => ({
        ...license,
        specialty: license.specialty.trim(),
        licenseNumber: license.licenseNumber.trim().toUpperCase()
      }))
    });
  }

  // Getters
  public get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  public get licenseType(): 'general' | 'specialist' | 'consultant' {
    return this.props.licenseType;
  }

  public get issuingAuthority(): string {
    return this.props.issuingAuthority;
  }

  public get issueDate(): Date {
    return this.props.issueDate;
  }

  public get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  public get specialtyLicenses(): SpecialtyLicense[] {
    return this.props.specialtyLicenses.slice();
  }

  public get medicalDegree(): string {
    return this.props.medicalDegree;
  }

  public get medicalSchool(): string {
    return this.props.medicalSchool;
  }

  public get graduationYear(): number {
    return this.props.graduationYear;
  }

  public get residencyProgram(): string | undefined {
    return this.props.residencyProgram;
  }

  public get fellowshipProgram(): string | undefined {
    return this.props.fellowshipProgram;
  }

  public get boardCertifications(): string[] {
    return this.props.boardCertifications.slice();
  }

  // Business methods
  public isValid(): boolean {
    return !this.isExpired() && this.isIssuedByValidAuthority();
  }

  public isExpired(): boolean {
    if (!this.props.expirationDate) return false;
    return this.props.expirationDate < new Date();
  }

  public getDaysUntilExpiration(): number | null {
    if (!this.props.expirationDate) return null;
    
    const today = new Date();
    const expiration = this.props.expirationDate;
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public isNearExpiration(daysThreshold: number = 90): boolean {
    const daysUntilExpiration = this.getDaysUntilExpiration();
    return daysUntilExpiration !== null && daysUntilExpiration <= daysThreshold;
  }

  public getYearsOfPractice(): number {
    const currentYear = new Date().getFullYear();
    const practiceStartYear = this.props.issueDate.getFullYear();
    return currentYear - practiceStartYear;
  }

  public hasSpecialtyLicense(specialty: string): boolean {
    return this.props.specialtyLicenses.some(license => 
      license.specialty.toLowerCase() === specialty.toLowerCase() && 
      license.isActive &&
      (!license.expirationDate || license.expirationDate > new Date())
    );
  }

  public getActiveSpecialtyLicenses(): SpecialtyLicense[] {
    return this.props.specialtyLicenses.filter(license => 
      license.isActive &&
      (!license.expirationDate || license.expirationDate > new Date())
    );
  }

  public hasBoardCertification(certification: string): boolean {
    return this.props.boardCertifications.some(cert => 
      cert.toLowerCase().includes(certification.toLowerCase())
    );
  }

  public hasResidencyTraining(): boolean {
    return !!this.props.residencyProgram;
  }

  public hasFellowshipTraining(): boolean {
    return !!this.props.fellowshipProgram;
  }

  // Vietnamese healthcare specific methods
  public isIssuedByMOH(): boolean {
    const mohAuthorities = [
      'Bộ Y tế',
      'Ministry of Health',
      'MOH',
      'Sở Y tế'
    ];
    
    return mohAuthorities.some(authority => 
      this.props.issuingAuthority.toLowerCase().includes(authority.toLowerCase())
    );
  }

  public isIssuedByValidAuthority(): boolean {
    const validAuthorities = [
      'Bộ Y tế',
      'Ministry of Health',
      'MOH',
      'Sở Y tế',
      'Department of Health',
      'Hội đồng Y khoa'
    ];
    
    return validAuthorities.some(authority => 
      this.props.issuingAuthority.toLowerCase().includes(authority.toLowerCase())
    );
  }

  public canPracticeInVietnam(): boolean {
    return this.isValid() && 
           this.isIssuedByValidAuthority() && 
           this.props.licenseNumber.startsWith('VN-');
  }

  public canPracticeSpecialty(specialty: string): boolean {
    return this.canPracticeInVietnam() && 
           (this.props.licenseType === 'specialist' || this.props.licenseType === 'consultant') &&
           this.hasSpecialtyLicense(specialty);
  }

  public canSuperviseResidents(): boolean {
    return this.canPracticeInVietnam() && 
           this.getYearsOfPractice() >= 5 &&
           (this.props.licenseType === 'specialist' || this.props.licenseType === 'consultant');
  }

  public canPerformSurgery(): boolean {
    return this.canPracticeInVietnam() && 
           this.props.licenseType === 'specialist' &&
           this.getYearsOfPractice() >= 3 &&
           (this.hasSpecialtyLicense('Ngoại khoa') || 
            this.hasSpecialtyLicense('Phẫu thuật'));
  }

  // Validation methods
  private static isValidVietnameseLicenseNumber(licenseNumber: string): boolean {
    // Vietnamese medical license format: VN-XX-XXXXXX
    const licenseRegex = /^VN-[A-Z]{2}-\d{6}$/;
    return licenseRegex.test(licenseNumber.toUpperCase());
  }

  // Update methods
  public renewLicense(newExpirationDate: Date): MedicalCredentials {
    if (newExpirationDate <= new Date()) {
      throw new Error('Ngày gia hạn phải là ngày trong tương lai');
    }

    return MedicalCredentials.create({
      ...this.props,
      expirationDate: newExpirationDate
    });
  }

  public addSpecialtyLicense(specialtyLicense: SpecialtyLicense): MedicalCredentials {
    // Check if specialty license already exists
    const exists = this.props.specialtyLicenses.some(license => 
      license.specialty === specialtyLicense.specialty
    );

    if (exists) {
      throw new Error('Giấy phép chuyên khoa này đã tồn tại');
    }

    return MedicalCredentials.create({
      ...this.props,
      specialtyLicenses: [...this.props.specialtyLicenses, specialtyLicense]
    });
  }

  public addBoardCertification(certification: string): MedicalCredentials {
    if (this.hasBoardCertification(certification)) {
      throw new Error('Chứng chỉ hội đồng này đã tồn tại');
    }

    return MedicalCredentials.create({
      ...this.props,
      boardCertifications: [...this.props.boardCertifications, certification.trim()]
    });
  }

  public updateResidencyProgram(program: string): MedicalCredentials {
    return MedicalCredentials.create({
      ...this.props,
      residencyProgram: program.trim()
    });
  }

  public updateFellowshipProgram(program: string): MedicalCredentials {
    return MedicalCredentials.create({
      ...this.props,
      fellowshipProgram: program.trim()
    });
  }

  public equals(other: MedicalCredentials): boolean {
    return (
      this.props.licenseNumber === other.props.licenseNumber &&
      this.props.licenseType === other.props.licenseType &&
      this.props.issuingAuthority === other.props.issuingAuthority &&
      this.props.issueDate.getTime() === other.props.issueDate.getTime() &&
      this.props.expirationDate?.getTime() === other.props.expirationDate?.getTime() &&
      this.props.medicalDegree === other.props.medicalDegree &&
      this.props.medicalSchool === other.props.medicalSchool &&
      this.props.graduationYear === other.props.graduationYear
    );
  }
}
