/**
 * EmergencyContact Entity - Patient Registry
 * Patient emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { Entity } from '../../shared/domain/base/entity';
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
    get id(): string;
    get name(): string;
    get relationship(): string;
    get phoneNumber(): string;
    get email(): string | undefined;
    get address(): string | undefined;
    get isPrimary(): boolean;
    get isActive(): boolean;
    setPrimary(): void;
    removePrimary(): void;
    activate(): void;
    deactivate(): void;
    updateContactInfo(name?: string, phoneNumber?: string, email?: string, address?: string): void;
    isValid(): boolean;
    private static isValidVietnamesePhone;
    toPersistence(): any;
    static fromPersistence(data: any): EmergencyContact;
    getSummaryForLogging(): object;
    getMaskedPhoneNumber(): string;
}
//# sourceMappingURL=EmergencyContact.d.ts.map