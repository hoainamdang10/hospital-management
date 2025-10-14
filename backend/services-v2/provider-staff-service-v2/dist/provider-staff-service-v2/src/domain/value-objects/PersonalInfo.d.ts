/**
 * PersonalInfo Value Object
 * Encapsulates personal information for staff members
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
export interface PersonalInfoProps {
    fullName: string;
    citizenId?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    phoneNumber?: string;
    email?: string;
    address?: string;
}
export declare class PersonalInfo extends ValueObject<PersonalInfoProps> {
    private constructor();
    /**
     * Validate format - required by ValueObject base class
     */
    protected validateFormat(): void;
    static create(props: PersonalInfoProps): PersonalInfo;
    get fullName(): string;
    get citizenId(): string | undefined;
    get dateOfBirth(): Date | undefined;
    get gender(): 'male' | 'female' | 'other' | undefined;
    get phoneNumber(): string | undefined;
    get email(): string | undefined;
    get address(): string | undefined;
}
//# sourceMappingURL=PersonalInfo.d.ts.map