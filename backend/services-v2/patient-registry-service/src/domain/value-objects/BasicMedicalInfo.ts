/**
 * BasicMedicalInfo Value Object
 * 
 * ONLY basic medical info for emergency purposes
 * Detailed clinical data belongs to Clinical EMR Service
 * 
 * Based on HL7 FHIR Patient Resource specification
 */

import { ValueObject } from '@shared/domain/base/value-object';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BasicMedicalInfoProps {
  bloodType?: BloodType;
  knownAllergies: string[];        // Critical allergies only
  emergencyMedicalInfo?: string;   // Critical info for emergency
}

export class BasicMedicalInfo extends ValueObject<BasicMedicalInfoProps> {
  private constructor(props: BasicMedicalInfoProps) {
    super(props);
  }

  /**
   * Factory method to create BasicMedicalInfo
   */
  public static create(props: BasicMedicalInfoProps): BasicMedicalInfo {
    // Validate and clean allergies
    const cleanedAllergies = props.knownAllergies
      .map(a => a.trim())
      .filter(a => a.length > 0);

    return new BasicMedicalInfo({
      bloodType: props.bloodType,
      knownAllergies: cleanedAllergies,
      emergencyMedicalInfo: props.emergencyMedicalInfo?.trim()
    });
  }

  /**
   * Create empty BasicMedicalInfo (no medical info)
   */
  public static createEmpty(): BasicMedicalInfo {
    return new BasicMedicalInfo({
      knownAllergies: []
    });
  }

  // Getters
  public get bloodType(): BloodType | undefined {
    return this.props.bloodType;
  }

  public get knownAllergies(): string[] {
    return this.props.knownAllergies.slice(); // Return copy
  }

  public get emergencyMedicalInfo(): string | undefined {
    return this.props.emergencyMedicalInfo;
  }

  // Business Methods
  public hasAllergies(): boolean {
    return this.props.knownAllergies.length > 0;
  }

  public hasBloodType(): boolean {
    return this.props.bloodType !== undefined;
  }

  public hasEmergencyInfo(): boolean {
    return this.props.emergencyMedicalInfo !== undefined && 
           this.props.emergencyMedicalInfo.trim().length > 0;
  }

  public isAllergyKnown(allergyName: string): boolean {
    const normalizedAllergyName = allergyName.toLowerCase().trim();
    return this.props.knownAllergies.some(
      allergy => allergy.toLowerCase().includes(normalizedAllergyName)
    );
  }

  /**
   * Get formatted string for emergency display
   */
  public getEmergencyDisplay(): string {
    const parts: string[] = [];

    if (this.props.bloodType) {
      parts.push(`Nhóm máu: ${this.props.bloodType}`);
    }

    if (this.props.knownAllergies.length > 0) {
      parts.push(`Dị ứng: ${this.props.knownAllergies.join(', ')}`);
    }

    if (this.props.emergencyMedicalInfo) {
      parts.push(`Thông tin khẩn cấp: ${this.props.emergencyMedicalInfo}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Không có thông tin y tế khẩn cấp';
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): BasicMedicalInfoProps {
    return {
      bloodType: this.props.bloodType,
      knownAllergies: this.props.knownAllergies.slice(),
      emergencyMedicalInfo: this.props.emergencyMedicalInfo
    };
  }
}

