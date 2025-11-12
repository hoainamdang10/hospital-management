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
    knownAllergies: string[];
    emergencyMedicalInfo?: string;
}
export declare class BasicMedicalInfo extends ValueObject<BasicMedicalInfoProps> {
    private constructor();
    protected validateFormat(): void;
    /**
     * Factory method to create BasicMedicalInfo
     */
    static create(props: BasicMedicalInfoProps): BasicMedicalInfo;
    /**
     * Create empty BasicMedicalInfo (no medical info)
     */
    static createEmpty(): BasicMedicalInfo;
    get bloodType(): BloodType | undefined;
    get knownAllergies(): string[];
    get emergencyMedicalInfo(): string | undefined;
    hasAllergies(): boolean;
    hasBloodType(): boolean;
    hasEmergencyInfo(): boolean;
    isAllergyKnown(allergyName: string): boolean;
    /**
     * Get formatted string for emergency display
     */
    getEmergencyDisplay(): string;
    /**
     * Convert to plain object for serialization
     */
    toJSON(): BasicMedicalInfoProps;
}
//# sourceMappingURL=BasicMedicalInfo.d.ts.map