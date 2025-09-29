/**
 * MedicalInfo Value Object
 * Patient medical information with Vietnamese healthcare standards
 */

import { ValueObject } from '../../../shared/domain/ValueObject';

interface MedicalInfoProps {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Medication[];
  emergencyMedicalInfo?: string;
  height?: number; // in cm
  weight?: number; // in kg
  bmi?: number;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholConsumption: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency: 'none' | 'rare' | 'weekly' | 'daily';
  dietaryRestrictions: string[];
  familyMedicalHistory: string[];
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export class MedicalInfo extends ValueObject<MedicalInfoProps> {
  private constructor(props: MedicalInfoProps) {
    super(props);
  }

  public static create(props: MedicalInfoProps): MedicalInfo {
    // Validate height and weight if provided
    if (props.height && (props.height < 50 || props.height > 250)) {
      throw new Error('Chiều cao phải từ 50cm đến 250cm');
    }

    if (props.weight && (props.weight < 1 || props.weight > 500)) {
      throw new Error('Cân nặng phải từ 1kg đến 500kg');
    }

    // Calculate BMI if both height and weight are provided
    let bmi: number | undefined;
    if (props.height && props.weight) {
      const heightInMeters = props.height / 100;
      bmi = props.weight / (heightInMeters * heightInMeters);
      bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal place
    }

    // Validate medications
    const validatedMedications = props.currentMedications.map(med => {
      if (!med.name || med.name.trim().length === 0) {
        throw new Error('Tên thuốc không được để trống');
      }
      if (!med.dosage || med.dosage.trim().length === 0) {
        throw new Error('Liều lượng thuốc không được để trống');
      }
      if (!med.frequency || med.frequency.trim().length === 0) {
        throw new Error('Tần suất dùng thuốc không được để trống');
      }
      return {
        ...med,
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim()
      };
    });

    return new MedicalInfo({
      ...props,
      bmi,
      allergies: props.allergies.map(allergy => allergy.trim()).filter(a => a.length > 0),
      chronicConditions: props.chronicConditions.map(condition => condition.trim()).filter(c => c.length > 0),
      currentMedications: validatedMedications,
      dietaryRestrictions: props.dietaryRestrictions.map(restriction => restriction.trim()).filter(r => r.length > 0),
      familyMedicalHistory: props.familyMedicalHistory.map(history => history.trim()).filter(h => h.length > 0)
    });
  }

  // Getters
  public get bloodType(): string | undefined {
    return this.props.bloodType;
  }

  public get allergies(): string[] {
    return this.props.allergies.slice();
  }

  public get chronicConditions(): string[] {
    return this.props.chronicConditions.slice();
  }

  public get currentMedications(): Medication[] {
    return this.props.currentMedications.slice();
  }

  public get emergencyMedicalInfo(): string | undefined {
    return this.props.emergencyMedicalInfo;
  }

  public get height(): number | undefined {
    return this.props.height;
  }

  public get weight(): number | undefined {
    return this.props.weight;
  }

  public get bmi(): number | undefined {
    return this.props.bmi;
  }

  public get smokingStatus(): 'never' | 'former' | 'current' {
    return this.props.smokingStatus;
  }

  public get alcoholConsumption(): 'none' | 'occasional' | 'moderate' | 'heavy' {
    return this.props.alcoholConsumption;
  }

  public get exerciseFrequency(): 'none' | 'rare' | 'weekly' | 'daily' {
    return this.props.exerciseFrequency;
  }

  public get dietaryRestrictions(): string[] {
    return this.props.dietaryRestrictions.slice();
  }

  public get familyMedicalHistory(): string[] {
    return this.props.familyMedicalHistory.slice();
  }

  // Business methods
  public hasAllergies(): boolean {
    return this.props.allergies.length > 0;
  }

  public hasChronicConditions(): boolean {
    return this.props.chronicConditions.length > 0;
  }

  public isOnMedication(): boolean {
    return this.props.currentMedications.some(med => med.isActive);
  }

  public hasAllergyTo(substance: string): boolean {
    return this.props.allergies.some(allergy => 
      allergy.toLowerCase().includes(substance.toLowerCase())
    );
  }

  public hasChronicCondition(condition: string): boolean {
    return this.props.chronicConditions.some(chronic => 
      chronic.toLowerCase().includes(condition.toLowerCase())
    );
  }

  public isCurrentlyTaking(medicationName: string): boolean {
    return this.props.currentMedications.some(med => 
      med.isActive && med.name.toLowerCase().includes(medicationName.toLowerCase())
    );
  }

  public getActiveMedications(): Medication[] {
    return this.props.currentMedications.filter(med => med.isActive);
  }

  public getInactiveMedications(): Medication[] {
    return this.props.currentMedications.filter(med => !med.isActive);
  }

  // BMI analysis methods
  public getBMICategory(): string {
    if (!this.props.bmi) return 'Chưa xác định';

    if (this.props.bmi < 18.5) return 'Thiếu cân';
    if (this.props.bmi < 25) return 'Bình thường';
    if (this.props.bmi < 30) return 'Thừa cân';
    return 'Béo phì';
  }

  public getBMIStatus(): 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown' {
    if (!this.props.bmi) return 'unknown';

    if (this.props.bmi < 18.5) return 'underweight';
    if (this.props.bmi < 25) return 'normal';
    if (this.props.bmi < 30) return 'overweight';
    return 'obese';
  }

  public isHealthyWeight(): boolean {
    return this.getBMIStatus() === 'normal';
  }

  // Risk assessment methods
  public hasHighRiskFactors(): boolean {
    return this.props.smokingStatus === 'current' ||
           this.props.alcoholConsumption === 'heavy' ||
           this.getBMIStatus() === 'obese' ||
           this.hasChronicConditions();
  }

  public getLifestyleRiskScore(): number {
    let score = 0;

    // Smoking risk
    if (this.props.smokingStatus === 'current') score += 3;
    else if (this.props.smokingStatus === 'former') score += 1;

    // Alcohol risk
    if (this.props.alcoholConsumption === 'heavy') score += 3;
    else if (this.props.alcoholConsumption === 'moderate') score += 1;

    // Exercise risk
    if (this.props.exerciseFrequency === 'none') score += 2;
    else if (this.props.exerciseFrequency === 'rare') score += 1;

    // BMI risk
    const bmiStatus = this.getBMIStatus();
    if (bmiStatus === 'obese') score += 3;
    else if (bmiStatus === 'overweight' || bmiStatus === 'underweight') score += 1;

    // Chronic conditions
    score += this.props.chronicConditions.length;

    return score;
  }

  public getRiskLevel(): 'low' | 'moderate' | 'high' {
    const score = this.getLifestyleRiskScore();
    if (score <= 2) return 'low';
    if (score <= 5) return 'moderate';
    return 'high';
  }

  // Vietnamese healthcare specific methods
  public requiresSpecialDiet(): boolean {
    return this.props.dietaryRestrictions.length > 0 ||
           this.hasChronicCondition('tiểu đường') ||
           this.hasChronicCondition('cao huyết áp') ||
           this.hasChronicCondition('tim mạch');
  }

  public requiresRegularMonitoring(): boolean {
    return this.hasChronicConditions() ||
           this.isOnMedication() ||
           this.getRiskLevel() === 'high';
  }

  public canDonateBlood(): boolean {
    return this.props.bloodType !== undefined &&
           !this.hasChronicConditions() &&
           this.props.smokingStatus !== 'current' &&
           this.props.weight && this.props.weight >= 45 &&
           this.getRiskLevel() !== 'high';
  }

  // Update methods
  public updateVitalStats(height?: number, weight?: number): MedicalInfo {
    return MedicalInfo.create({
      ...this.props,
      height,
      weight
    });
  }

  public addAllergy(allergy: string): MedicalInfo {
    if (this.hasAllergyTo(allergy)) {
      throw new Error('Dị ứng này đã được ghi nhận');
    }

    return MedicalInfo.create({
      ...this.props,
      allergies: [...this.props.allergies, allergy.trim()]
    });
  }

  public removeAllergy(allergy: string): MedicalInfo {
    return MedicalInfo.create({
      ...this.props,
      allergies: this.props.allergies.filter(a => 
        a.toLowerCase() !== allergy.toLowerCase()
      )
    });
  }

  public addMedication(medication: Medication): MedicalInfo {
    return MedicalInfo.create({
      ...this.props,
      currentMedications: [...this.props.currentMedications, medication]
    });
  }

  public stopMedication(medicationName: string): MedicalInfo {
    const updatedMedications = this.props.currentMedications.map(med => 
      med.name.toLowerCase() === medicationName.toLowerCase()
        ? { ...med, isActive: false, endDate: new Date() }
        : med
    );

    return MedicalInfo.create({
      ...this.props,
      currentMedications: updatedMedications
    });
  }

  public updateLifestyle(
    smokingStatus?: 'never' | 'former' | 'current',
    alcoholConsumption?: 'none' | 'occasional' | 'moderate' | 'heavy',
    exerciseFrequency?: 'none' | 'rare' | 'weekly' | 'daily'
  ): MedicalInfo {
    return MedicalInfo.create({
      ...this.props,
      smokingStatus: smokingStatus || this.props.smokingStatus,
      alcoholConsumption: alcoholConsumption || this.props.alcoholConsumption,
      exerciseFrequency: exerciseFrequency || this.props.exerciseFrequency
    });
  }

  public equals(other: MedicalInfo): boolean {
    return (
      this.props.bloodType === other.props.bloodType &&
      JSON.stringify(this.props.allergies.sort()) === JSON.stringify(other.props.allergies.sort()) &&
      JSON.stringify(this.props.chronicConditions.sort()) === JSON.stringify(other.props.chronicConditions.sort()) &&
      this.props.height === other.props.height &&
      this.props.weight === other.props.weight &&
      this.props.smokingStatus === other.props.smokingStatus &&
      this.props.alcoholConsumption === other.props.alcoholConsumption &&
      this.props.exerciseFrequency === other.props.exerciseFrequency
    );
  }
}
