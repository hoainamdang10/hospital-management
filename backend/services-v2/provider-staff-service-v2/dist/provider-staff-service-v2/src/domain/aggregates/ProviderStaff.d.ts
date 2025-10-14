/**
 * ProviderStaff Aggregate Root
 * Manages healthcare provider staff members
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
import { HealthcareAggregateRoot } from '../../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { StaffId } from '../value-objects/StaffId';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { ProfessionalInfo } from '../value-objects/ProfessionalInfo';
export type StaffType = 'doctor' | 'nurse' | 'technician' | 'admin' | 'other';
export interface ProviderStaffProps {
    id: StaffId;
    personalInfo: PersonalInfo;
    professionalInfo: ProfessionalInfo;
    staffType: StaffType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Provider Staff Persistence Format
 * Used for database storage and retrieval
 */
export interface ProviderStaffPersistenceProps {
    id: string;
    full_name: string;
    citizen_id?: string;
    date_of_birth?: string;
    gender?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    license_number?: string;
    specialization?: string;
    years_of_experience?: number;
    qualifications?: string[];
    certifications?: string[];
    staff_type: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
/**
 * ProviderStaff Aggregate Root
 */
export declare class ProviderStaff extends HealthcareAggregateRoot<ProviderStaffProps> {
    private constructor();
    /**
     * Factory method for creating new staff members
     *
     * @param personalInfo - Personal information
     * @param professionalInfo - Professional information
     * @param staffType - Type of staff member
     * @returns ProviderStaff instance
     */
    static create(personalInfo: PersonalInfo, professionalInfo: ProfessionalInfo, staffType: StaffType): ProviderStaff;
    /**
     * Factory method for reconstituting from persistence
     * Used by infrastructure layer to rebuild domain object from database
     */
    static reconstitute(id: string, personalInfo: PersonalInfo, professionalInfo: ProfessionalInfo, staffType: StaffType, isActive: boolean, createdAt: Date, updatedAt: Date): ProviderStaff;
    /**
     * Activate staff member
     */
    activate(): void;
    /**
     * Deactivate staff member
     */
    deactivate(): void;
    /**
     * Update personal information
     */
    updatePersonalInfo(personalInfo: PersonalInfo): void;
    /**
     * Update professional information
     */
    updateProfessionalInfo(professionalInfo: ProfessionalInfo): void;
    /**
     * Validate business-specific invariants
     */
    protected validateBusinessInvariants(): void;
    /**
     * Get patient ID (Staff is not a patient)
     */
    getPatientId(): string | null;
    /**
     * Validate method required by base class
     */
    validate(): void;
    /**
     * Validate invariants
     */
    validateInvariants(): void;
    /**
     * Apply domain event (for event sourcing)
     */
    protected applyEvent(_event: DomainEvent): void;
    get id(): string;
    get staffId(): StaffId;
    get personalInfo(): PersonalInfo;
    get professionalInfo(): ProfessionalInfo;
    get staffType(): StaffType;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    /**
     * Convert to persistence format
     */
    toPersistence(): ProviderStaffPersistenceProps;
}
//# sourceMappingURL=ProviderStaff.d.ts.map