/**
 * ProfessionalInfo Value Object
 * Vietnamese Healthcare Professional Information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { HealthcareValueObject } from "@shared/domain/base/value-object";

interface ProfessionalInfoProps {
  title: string; // Dr., Nurse, etc.
  department: string;
  position: string;
  education: string[];
  languages: string[];
  bio?: string;
}

export class ProfessionalInfo extends HealthcareValueObject<ProfessionalInfoProps> {
  private constructor(props: ProfessionalInfoProps) {
    super(props);
  }

  protected validateFormat(): void {
    // Title validation
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error("Chức danh không được để trống");
    }

    // Department validation
    if (!this.props.department || this.props.department.trim().length === 0) {
      throw new Error("Khoa/phòng ban không được để trống");
    }

    // Position validation
    if (!this.props.position || this.props.position.trim().length === 0) {
      throw new Error("Vị trí công việc không được để trống");
    }

    // Education validation
    if (!this.props.education || this.props.education.length === 0) {
      throw new Error("Trình độ học vấn không được để trống");
    }

    // Languages validation
    if (!this.props.languages || this.props.languages.length === 0) {
      throw new Error("Ngôn ngữ không được để trống");
    }

    // Bio validation (optional but if provided, must be reasonable length)
    if (this.props.bio && this.props.bio.length > 2000) {
      throw new Error("Tiểu sử không được vượt quá 2000 ký tự");
    }
  }

  public static create(props: ProfessionalInfoProps): ProfessionalInfo {
    return new ProfessionalInfo({
      ...props,
      title: props.title.trim(),
      department: props.department.trim(),
      position: props.position.trim(),
      education: props.education.map((e) => e.trim()),
      languages: props.languages.map((l) => l.trim()),
      bio: props.bio?.trim(),
    });
  }

  public static fromPersistence(data: any): ProfessionalInfo {
    // Handle both old schema and new seed data format
    return ProfessionalInfo.create({
      title: data.title || "Doctor",
      department: data.department || "General",
      position: data.position || data.title || "Doctor",
      education:
        data.education || (data.medicalSchool ? [data.medicalSchool] : []),
      languages: data.languages || ["vi"],
      bio: data.bio || data.professionalSummary || "",
    });
  }

  // Getters
  public get title(): string {
    return this.props.title;
  }

  public get department(): string {
    return this.props.department;
  }

  public get position(): string {
    return this.props.position;
  }

  public get education(): string[] {
    return [...this.props.education];
  }

  public get languages(): string[] {
    return [...this.props.languages];
  }

  public get bio(): string | undefined {
    return this.props.bio;
  }

  // Business methods
  public hasEducation(degree: string): boolean {
    return this.props.education.some((e) =>
      e.toLowerCase().includes(degree.toLowerCase()),
    );
  }

  public speaksLanguage(language: string): boolean {
    return this.props.languages.some(
      (l) => l.toLowerCase() === language.toLowerCase(),
    );
  }

  public getHighestEducation(): string {
    // Assuming education array is ordered from highest to lowest
    return this.props.education[0];
  }

  public getPrimaryLanguage(): string {
    // Assuming first language is primary
    return this.props.languages[0];
  }

  public isMultilingual(): boolean {
    return this.props.languages.length > 1;
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
    // Check if Vietnamese is one of the languages
    return (
      this.speaksLanguage("Vietnamese") ||
      this.speaksLanguage("Tiếng Việt") ||
      this.speaksLanguage("vi")
    );
  }

  public isHIPAACompliant(): boolean {
    // Professional info doesn't contain PHI
    return true;
  }

  // HIPAA compliance methods
  public containsPHI(): boolean {
    return false; // Professional info doesn't contain PHI
  }

  public anonymize(): HealthcareValueObject<ProfessionalInfoProps> {
    // Professional info doesn't need anonymization as it doesn't contain PHI
    return this;
  }

  // Update methods
  public updateBio(newBio: string): ProfessionalInfo {
    if (newBio.length > 2000) {
      throw new Error("Tiểu sử không được vượt quá 2000 ký tự");
    }

    return ProfessionalInfo.create({
      ...this.props,
      bio: newBio.trim(),
    });
  }

  public addEducation(degree: string): ProfessionalInfo {
    if (this.hasEducation(degree)) {
      throw new Error("Bằng cấp này đã tồn tại");
    }

    return ProfessionalInfo.create({
      ...this.props,
      education: [...this.props.education, degree.trim()],
    });
  }

  public addLanguage(language: string): ProfessionalInfo {
    if (this.speaksLanguage(language)) {
      throw new Error("Ngôn ngữ này đã tồn tại");
    }

    return ProfessionalInfo.create({
      ...this.props,
      languages: [...this.props.languages, language.trim()],
    });
  }

  public updateDepartment(newDepartment: string): ProfessionalInfo {
    if (!newDepartment || newDepartment.trim().length === 0) {
      throw new Error("Khoa/phòng ban không được để trống");
    }

    return ProfessionalInfo.create({
      ...this.props,
      department: newDepartment.trim(),
    });
  }

  public updatePosition(newPosition: string): ProfessionalInfo {
    if (!newPosition || newPosition.trim().length === 0) {
      throw new Error("Vị trí công việc không được để trống");
    }

    return ProfessionalInfo.create({
      ...this.props,
      position: newPosition.trim(),
    });
  }

  // Persistence
  public toPersistence(): any {
    return {
      title: this.props.title,
      department: this.props.department,
      position: this.props.position,
      education: this.props.education,
      languages: this.props.languages,
      bio: this.props.bio,
    };
  }

  public override equals(other: ProfessionalInfo): boolean {
    if (!other) return false;

    return (
      this.props.title === other.props.title &&
      this.props.department === other.props.department &&
      this.props.position === other.props.position &&
      JSON.stringify(this.props.education) ===
        JSON.stringify(other.props.education) &&
      JSON.stringify(this.props.languages) ===
        JSON.stringify(other.props.languages) &&
      this.props.bio === other.props.bio
    );
  }

  public override toString(): string {
    return `${this.props.title} - ${this.props.department} (${this.props.position})`;
  }
}
