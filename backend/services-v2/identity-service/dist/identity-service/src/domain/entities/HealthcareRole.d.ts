/**
 * HealthcareRole Entity
 * Represents user roles in healthcare system
 *
 * Pure RBAC Design:
 * - Role metadata only (no hardcoded permissions)
 * - Permissions loaded from database via repository
 * - Supports multiple roles per user
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */
import { Entity } from '@shared/domain/base/entity';
/**
 * Healthcare Role Types - Simplified for Graduation Project
 *
 * 5 Core Roles:
 * - ADMIN: System administrator
 * - DOCTOR: Medical doctor (includes pharmacy & lab orders)
 * - NURSE: Registered nurse (includes pharmacy dispensing & lab specimen collection)
 * - RECEPTIONIST: Front desk (includes billing & payment processing)
 * - PATIENT: Patient user
 *
 * Merged Roles:
 * - PHARMACIST → NURSE + DOCTOR (pharmacy permissions distributed)
 * - LAB_TECHNICIAN → NURSE + DOCTOR (lab permissions distributed)
 * - BILLING_STAFF → RECEPTIONIST + ADMIN (billing permissions distributed)
 */
export type HealthcareRoleType = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT';
interface HealthcareRoleProps {
    type: HealthcareRoleType;
    name: string;
    nameVietnamese: string;
    description: string;
    isActive: boolean;
    hasHIPAATraining: boolean;
}
export declare class HealthcareRole extends Entity<HealthcareRoleProps> {
    private constructor();
    static create(type: HealthcareRoleType, name: string, nameVietnamese: string, description: string, hasHIPAATraining?: boolean): HealthcareRole;
    /**
     * Create HealthcareRole from role type string
     *
     * NOTE: Permissions are NO LONGER hardcoded here.
     * Permissions are loaded from database via IPermissionRepository.
     *
     * @param roleType - Role type string (e.g., 'admin', 'doctor', 'patient')
     * @returns HealthcareRole instance with metadata only
     *
     * @example
     * ```typescript
     * const role = HealthcareRole.fromRoleType('doctor');
     * // To get permissions, use:
     * // const permissions = await permissionRepository.getRolePermissions(role.type);
     * ```
     */
    static fromRoleType(roleType: string): HealthcareRole;
    get type(): HealthcareRoleType;
    get name(): string;
    get nameVietnamese(): string;
    get description(): string;
    get isActive(): boolean;
    hasHIPAATraining(): boolean;
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