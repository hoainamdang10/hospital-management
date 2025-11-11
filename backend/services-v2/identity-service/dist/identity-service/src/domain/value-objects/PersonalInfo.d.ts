/**
 * PersonalInfo Value Object
 * User personal information with Vietnamese standards
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
interface PersonalInfoProps {
    fullName: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    citizenId?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
}
export declare class PersonalInfo extends ValueObject<PersonalInfoProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    static create(props: PersonalInfoProps): PersonalInfo;
    private static isValidVietnamesePhone;
    private static isValidCitizenId;
    get fullName(): string;
    get phoneNumber(): string | undefined;
    get address(): string | undefined;
    get dateOfBirth(): Date | undefined;
    get gender(): 'male' | 'female' | 'other' | undefined;
    get citizenId(): string | undefined;
    get emergencyContactName(): string | undefined;
    get emergencyContactPhone(): string | undefined;
    /**
     * Check if personal info is complete
     */
    isComplete(): boolean;
    /**
     * Check if has Vietnamese citizen ID
     */
    hasVietnameseId(): boolean;
    /**
     * Check if has valid phone number
     */
    hasValidPhoneNumber(): boolean;
    /**
     * Calculate age from date of birth
     */
    getAge(): number | null;
}
export {};
//# sourceMappingURL=PersonalInfo.d.ts.map