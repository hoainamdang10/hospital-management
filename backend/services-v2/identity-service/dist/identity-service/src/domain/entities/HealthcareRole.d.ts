/**
 * HealthcareRole Entity
 * Represents user roles in healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Entity } from '@shared/domain/base/entity';
export type HealthcareRoleType = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'PATIENT' | 'BILLING_STAFF';
interface HealthcareRoleProps {
    type: HealthcareRoleType;
    name: string;
    nameVietnamese: string;
    description: string;
    permissions: string[];
    isActive: boolean;
    hasHIPAATraining: boolean;
}
export declare class HealthcareRole extends Entity<HealthcareRoleProps> {
    private constructor();
    static create(type: HealthcareRoleType, name: string, nameVietnamese: string, description: string, permissions?: string[], hasHIPAATraining?: boolean): HealthcareRole;
    static fromRoleType(roleType: string): HealthcareRole;
    get type(): HealthcareRoleType;
    get name(): string;
    get nameVietnamese(): string;
    get description(): string;
    get permissions(): string[];
    get isActive(): boolean;
    hasHIPAATraining(): boolean;
    /**
     * Check if role has specific permission
     */
    hasPermission(action: string, resource: string): boolean;
    /**
     * Check if role is medical staff
     */
    isMedicalStaff(): boolean;
    /**
     * Check if role is administrative staff
     */
    isAdministrativeStaff(): boolean;
    /**
     * Check if role is Vietnamese healthcare role
     */
    isVietnameseHealthcareRole(): boolean;
    /**
     * Validate entity state - required by Entity base class
     */
    validate(): void;
    /**
     * Convert entity to persistence format - required by Entity base class
     */
    toPersistence(): any;
}
export {};
//# sourceMappingURL=HealthcareRole.d.ts.map