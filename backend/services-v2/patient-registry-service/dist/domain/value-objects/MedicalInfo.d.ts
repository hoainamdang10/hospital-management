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
    height?: number;
    weight?: number;
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
export declare class MedicalInfo extends ValueObject<MedicalInfoProps> {
    private constructor();
    static create(props: MedicalInfoProps): MedicalInfo;
    get bloodType(): string | undefined;
    get allergies(): string[];
    get chronicConditions(): string[];
    get currentMedications(): Medication[];
    get emergencyMedicalInfo(): string | undefined;
    get height(): number | undefined;
    get weight(): number | undefined;
    get bmi(): number | undefined;
    get smokingStatus(): 'never' | 'former' | 'current';
    get alcoholConsumption(): 'none' | 'occasional' | 'moderate' | 'heavy';
    get exerciseFrequency(): 'none' | 'rare' | 'weekly' | 'daily';
    get dietaryRestrictions(): string[];
    get familyMedicalHistory(): string[];
    hasAllergies(): boolean;
    hasChronicConditions(): boolean;
    isOnMedication(): boolean;
    hasAllergyTo(substance: string): boolean;
    hasChronicCondition(condition: string): boolean;
    isCurrentlyTaking(medicationName: string): boolean;
    getActiveMedications(): Medication[];
    getInactiveMedications(): Medication[];
    getBMICategory(): string;
    getBMIStatus(): 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown';
    isHealthyWeight(): boolean;
    hasHighRiskFactors(): boolean;
    getLifestyleRiskScore(): number;
    getRiskLevel(): 'low' | 'moderate' | 'high';
    requiresSpecialDiet(): boolean;
    requiresRegularMonitoring(): boolean;
    canDonateBlood(): boolean;
    updateVitalStats(height?: number, weight?: number): MedicalInfo;
    addAllergy(allergy: string): MedicalInfo;
    removeAllergy(allergy: string): MedicalInfo;
    addMedication(medication: Medication): MedicalInfo;
    stopMedication(medicationName: string): MedicalInfo;
    updateLifestyle(smokingStatus?: 'never' | 'former' | 'current', alcoholConsumption?: 'none' | 'occasional' | 'moderate' | 'heavy', exerciseFrequency?: 'none' | 'rare' | 'weekly' | 'daily'): MedicalInfo;
    equals(other: MedicalInfo): boolean;
}
export {};
//# sourceMappingURL=MedicalInfo.d.ts.map