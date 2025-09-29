/**
 * Medical Info Value Object - Healthcare Domain
 * Encapsulates patient medical information with healthcare validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards, FHIR
 */

import { ValueObject } from '../base/value-object';

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

interface MedicalInfoProps {
  bloodType?: BloodType;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy?: string;
    startDate: Date;
    endDate?: Date;
  }[];
  medicalHistory?: string;
  familyMedicalHistory?: string;
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'never' | 'occasional' | 'regular' | 'heavy';
  exerciseFrequency?: 'never' | 'rarely' | 'sometimes' | 'regularly' | 'daily';
}

/**
 * Medical Info Value Object
 * Contains validated medical information for patients
 */
export class MedicalInfo extends ValueObject<MedicalInfoProps> {
  private static readonly MEDICATION_NAME_PATTERN = /^[\p{L}\s\-\(\)0-9]{2,100}$/u;
  private static readonly DOSAGE_PATTERN = /^[\d\.,]+\s*(mg|g|ml|l|units?|tablets?|capsules?|drops?|sprays?|puffs?)$/i;

  private constructor(props: MedicalInfoProps) {
    super(props);
  }

  /**
   * Create medical info with validation
   */
  public static create(
    bloodType?: BloodType,
    allergies: string[] = [],
    chronicConditions: string[] = [],
    currentMedications: MedicalInfoProps['currentMedications'] = [],
    medicalHistory?: string,
    familyMedicalHistory?: string,
    smokingStatus?: 'never' | 'former' | 'current',
    alcoholConsumption?: 'never' | 'occasional' | 'regular' | 'heavy',
    exerciseFrequency?: 'never' | 'rarely' | 'sometimes' | 'regularly' | 'daily'
  ): MedicalInfo {
    const medicalInfo = new MedicalInfo({
      bloodType,
      allergies: allergies.map(a => a.trim()).filter(a => a.length > 0),
      chronicConditions: chronicConditions.map(c => c.trim()).filter(c => c.length > 0),
      currentMedications,
      medicalHistory: medicalHistory?.trim(),
      familyMedicalHistory: familyMedicalHistory?.trim(),
      smokingStatus,
      alcoholConsumption,
      exerciseFrequency,
    });

    if (!medicalInfo.isValid()) {
      throw new Error('Thông tin y tế không hợp lệ');
    }

    return medicalInfo;
  }

  /**
   * Validate medical information
   */
  public isValid(): boolean {
    // Validate blood type if provided
    if (this.props.bloodType && !Object.values(BloodType).includes(this.props.bloodType)) {
      return false;
    }

    // Validate allergies
    for (const allergy of this.props.allergies) {
      if (!allergy || allergy.trim().length < 2 || allergy.trim().length > 200) {
        return false;
      }
    }

    // Validate chronic conditions
    for (const condition of this.props.chronicConditions) {
      if (!condition || condition.trim().length < 2 || condition.trim().length > 200) {
        return false;
      }
    }

    // Validate medications
    for (const medication of this.props.currentMedications) {
      if (!medication.name || !MedicalInfo.MEDICATION_NAME_PATTERN.test(medication.name)) {
        return false;
      }
      if (!medication.dosage || !MedicalInfo.DOSAGE_PATTERN.test(medication.dosage)) {
        return false;
      }
      if (!medication.frequency || medication.frequency.trim().length < 2) {
        return false;
      }
      if (medication.startDate > new Date()) {
        return false;
      }
      if (medication.endDate && medication.endDate <= medication.startDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if patient has any allergies
   */
  public hasAllergies(): boolean {
    return this.props.allergies.length > 0;
  }

  /**
   * Check if patient has chronic conditions
   */
  public hasChronicConditions(): boolean {
    return this.props.chronicConditions.length > 0;
  }

  /**
   * Check if patient is on current medications
   */
  public hasCurrentMedications(): boolean {
    return this.props.currentMedications.length > 0;
  }

  /**
   * Get active medications (not expired)
   */
  public getActiveMedications(): MedicalInfoProps['currentMedications'] {
    const now = new Date();
    return this.props.currentMedications.filter(med => 
      !med.endDate || med.endDate > now
    );
  }

  /**
   * Check if patient has specific allergy
   */
  public hasAllergy(allergyName: string): boolean {
    return this.props.allergies.some(allergy => 
      allergy.toLowerCase().includes(allergyName.toLowerCase())
    );
  }

  /**
   * Check if patient has specific chronic condition
   */
  public hasChronicCondition(conditionName: string): boolean {
    return this.props.chronicConditions.some(condition => 
      condition.toLowerCase().includes(conditionName.toLowerCase())
    );
  }

  /**
   * Get blood type compatibility for transfusion
   */
  public getBloodTypeCompatibility(): {
    canReceiveFrom: BloodType[];
    canDonateTo: BloodType[];
  } {
    if (!this.props.bloodType) {
      return { canReceiveFrom: [], canDonateTo: [] };
    }

    const compatibility: Record<BloodType, { canReceiveFrom: BloodType[]; canDonateTo: BloodType[] }> = {
      [BloodType.O_NEGATIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE],
        canDonateTo: Object.values(BloodType)
      },
      [BloodType.O_POSITIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
        canDonateTo: [BloodType.O_POSITIVE, BloodType.A_POSITIVE, BloodType.B_POSITIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.A_NEGATIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.A_NEGATIVE],
        canDonateTo: [BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.A_POSITIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.A_NEGATIVE, BloodType.A_POSITIVE],
        canDonateTo: [BloodType.A_POSITIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.B_NEGATIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.B_NEGATIVE],
        canDonateTo: [BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.B_POSITIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.B_NEGATIVE, BloodType.B_POSITIVE],
        canDonateTo: [BloodType.B_POSITIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.AB_NEGATIVE]: {
        canReceiveFrom: [BloodType.O_NEGATIVE, BloodType.A_NEGATIVE, BloodType.B_NEGATIVE, BloodType.AB_NEGATIVE],
        canDonateTo: [BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE]
      },
      [BloodType.AB_POSITIVE]: {
        canReceiveFrom: Object.values(BloodType),
        canDonateTo: [BloodType.AB_POSITIVE]
      }
    };

    return compatibility[this.props.bloodType];
  }

  /**
   * Get lifestyle risk assessment
   */
  public getLifestyleRiskAssessment(): {
    riskLevel: 'low' | 'moderate' | 'high';
    riskFactors: string[];
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Smoking assessment
    if (this.props.smokingStatus === 'current') {
      riskFactors.push('Hút thuốc hiện tại');
      riskScore += 3;
    } else if (this.props.smokingStatus === 'former') {
      riskFactors.push('Từng hút thuốc');
      riskScore += 1;
    }

    // Alcohol assessment
    if (this.props.alcoholConsumption === 'heavy') {
      riskFactors.push('Uống rượu nhiều');
      riskScore += 3;
    } else if (this.props.alcoholConsumption === 'regular') {
      riskFactors.push('Uống rượu thường xuyên');
      riskScore += 2;
    }

    // Exercise assessment
    if (this.props.exerciseFrequency === 'never') {
      riskFactors.push('Không tập thể dục');
      riskScore += 2;
    } else if (this.props.exerciseFrequency === 'rarely') {
      riskFactors.push('Ít tập thể dục');
      riskScore += 1;
    }

    // Chronic conditions
    if (this.hasChronicConditions()) {
      riskFactors.push('Có bệnh mãn tính');
      riskScore += this.props.chronicConditions.length;
    }

    let riskLevel: 'low' | 'moderate' | 'high';
    if (riskScore >= 5) {
      riskLevel = 'high';
    } else if (riskScore >= 2) {
      riskLevel = 'moderate';
    } else {
      riskLevel = 'low';
    }

    return { riskLevel, riskFactors };
  }

  // Getters
  get bloodType(): BloodType | undefined {
    return this.props.bloodType;
  }

  get allergies(): string[] {
    return [...this.props.allergies];
  }

  get chronicConditions(): string[] {
    return [...this.props.chronicConditions];
  }

  get currentMedications(): MedicalInfoProps['currentMedications'] {
    return [...this.props.currentMedications];
  }

  get medicalHistory(): string | undefined {
    return this.props.medicalHistory;
  }

  get familyMedicalHistory(): string | undefined {
    return this.props.familyMedicalHistory;
  }

  get smokingStatus(): string | undefined {
    return this.props.smokingStatus;
  }

  get alcoholConsumption(): string | undefined {
    return this.props.alcoholConsumption;
  }

  get exerciseFrequency(): string | undefined {
    return this.props.exerciseFrequency;
  }
}
