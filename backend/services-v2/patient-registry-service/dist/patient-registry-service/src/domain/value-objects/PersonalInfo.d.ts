/**
 * PersonalInfo Value Object - Patient Registry
 * Patient personal information with Vietnamese healthcare standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { ValueObject } from '@shared/domain/base/value-object';
export interface PersonalInfoProps {
    fullName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    nationality: string;
    ethnicity?: string | undefined;
    occupation?: string | undefined;
    maritalStatus?: string | undefined;
}
export declare class PersonalInfo extends ValueObject<PersonalInfoProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    /**
     * Create PersonalInfo
     */
    static create(props: PersonalInfoProps): PersonalInfo;
    /**
     * Validate Vietnamese citizen ID (CMND/CCCD)
     */
    private static isValidCitizenId;
    get fullName(): string;
    get dateOfBirth(): Date;
    get gender(): 'male' | 'female' | 'other';
    get nationalId(): string;
    get nationality(): string;
    get ethnicity(): string | undefined;
    get occupation(): string | undefined;
    get maritalStatus(): string | undefined;
    /**
     * Get age from date of birth
     */
    getAge(): number;
    /**
     * Check if patient is minor (< 18 years old)
     */
    isMinor(): boolean;
    /**
     * Check if patient is elderly (>= 65 years old)
     */
    isElderly(): boolean;
    /**
     * Vietnamese healthcare compliance check
     */
    isVietnameseCompliant(): boolean;
    /**
     * HIPAA compliance check
     */
    isHIPAACompliant(): boolean;
    /**
     * Check if personal info is valid
     */
    isValid(): boolean;
    /**
     * Convert to persistence format
     */
    toPersistence(): {
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
    };
    /**
     * Create from persistence data
     */
    static fromPersistence(data: {
        fullName: string;
        dateOfBirth: string;
        gender: 'male' | 'female' | 'other';
        nationalId: string;
        nationality: string;
        ethnicity?: string;
        occupation?: string;
        maritalStatus?: string;
    }): PersonalInfo;
    /**
     * Get display name (for logging, no sensitive data)
     */
    getDisplayName(): string;
    /**
     * Get masked national ID (for logging)
     */
    getMaskedNationalId(): string;
    /**
     * Get summary for logging (no sensitive data)
     */
    getSummaryForLogging(): object;
}
//# sourceMappingURL=PersonalInfo.d.ts.map