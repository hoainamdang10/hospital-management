/**
 * EmergencyContact Entity - Patient Registry
 * Patient emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { Entity } from '@shared/domain/base/entity';
export interface EmergencyContactProps {
    id: string;
    name: string;
    relationship: string;
    primaryPhone: string;
    secondaryPhone?: string | undefined;
    email?: string | undefined;
    address?: string | undefined;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EmergencyContact extends Entity<EmergencyContactProps> {
    private constructor();
    /**
     * Create new emergency contact
     */
    static create(name: string, relationship: string, primaryPhone: string, secondaryPhone?: string, email?: string, address?: string, isPrimary?: boolean): EmergencyContact;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: EmergencyContactProps): EmergencyContact;
    getId(): string;
    get name(): string;
    get relationship(): string;
    get primaryPhone(): string;
    get secondaryPhone(): string | undefined;
    get email(): string | undefined;
    get address(): string | undefined;
    get isPrimary(): boolean;
    get isActive(): boolean;
    setPrimary(): void;
    removePrimary(): void;
    activate(): void;
    deactivate(): void;
    updateContactInfo(name?: string, primaryPhone?: string, secondaryPhone?: string, email?: string, address?: string): void;
    validate(): void;
    isValid(): boolean;
    private static isValidVietnamesePhone;
    toPersistence(): {
        id: string;
        name: string;
        relationship: string;
        primary_phone: string;
        secondary_phone?: string;
        email?: string;
        address?: string;
        is_primary: boolean;
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
    getSummaryForLogging(): object;
    getMaskedPhoneNumber(): string;
}
//# sourceMappingURL=EmergencyContact.d.ts.map