/**
 * User Aggregate Root - Consolidated Identity Service
 * Enhanced with Circuit Breaker compatibility and Supabase integration
 *
 * Pure RBAC Design:
 * - Supports multiple roles per user
 * - Permissions loaded from database via repository
 * - Role assignments tracked with audit trail
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, DDD, HIPAA, Anti-Pattern Mitigation
 */
import { HealthcareAggregateRoot } from "@shared/domain/base/aggregate-root";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { UserId } from "../value-objects/UserId";
import { Email } from "../value-objects/Email";
import { PersonalInfo } from "../value-objects/PersonalInfo";
import { HealthcareRole } from "../entities/HealthcareRole";
import { AccountStatus } from "../value-objects/AccountStatus";
export interface UserProps {
    id: UserId;
    email: Email;
    personalInfo: PersonalInfo;
    healthcareRoles: HealthcareRole[];
    accountStatus: AccountStatus;
    isEmailVerified: boolean;
    deactivationReason?: string;
    deactivatedAt?: Date;
    deactivatedBy?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * User Aggregate Root with Enhanced Error Handling
 * Implements anti-patterns mitigation and graceful degradation
 */
export declare class User extends HealthcareAggregateRoot<UserProps> {
    private constructor();
    /**
     * Factory method for creating new users with validation
     * Note: Password is handled by Supabase Auth, not stored in domain model
     *
     * Pure RBAC: Supports multiple roles per user
     *
     * @param email - User email
     * @param personalInfo - Personal information
     * @param healthcareRoles - Array of healthcare roles (at least one required)
     * @returns User instance
     */
    static create(email: Email, personalInfo: PersonalInfo, healthcareRoles: HealthcareRole[]): User;
    /**
     * Factory method for reconstituting from persistence
     * Used by infrastructure layer to rebuild domain object from database
     * This is a valid use case in Clean Architecture - domain provides factory for reconstitution
     *
     * Pure RBAC: Supports multiple roles per user
     *
     * Note: Validation is relaxed for reconstitution to handle legacy data
     * that may not meet current business rules (e.g., incomplete personal info)
     */
    static reconstitute(id: string, email: Email, personalInfo: PersonalInfo, healthcareRoles: HealthcareRole[], accountStatus: AccountStatus, isEmailVerified: boolean, deactivationReason: string | undefined, deactivatedAt: Date | undefined, deactivatedBy: string | undefined, lastLoginAt: Date | undefined, createdAt: Date, updatedAt: Date): User;
    get id(): string;
    get userId(): UserId;
    get email(): Email;
    get personalInfo(): PersonalInfo;
    /**
     * Get all healthcare roles for this user
     * Pure RBAC: Returns array of roles
     */
    get healthcareRoles(): HealthcareRole[];
    /**
     * Get primary healthcare role (first role in array)
     * For backward compatibility with code expecting single role
     *
     * @deprecated Use healthcareRoles instead for Pure RBAC
     */
    get healthcareRole(): HealthcareRole;
    get accountStatus(): AccountStatus;
    /**
     * Backward compatibility getter
     * @deprecated Use accountStatus instead
     */
    get isActive(): boolean;
    get deactivationReason(): string | undefined;
    get deactivatedAt(): Date | undefined;
    get deactivatedBy(): string | undefined;
    get isEmailVerified(): boolean;
    get lastLoginAt(): Date | undefined;
    /**
     * Record authentication event (password verification done by Supabase Auth)
     * This method is called AFTER successful authentication via SupabaseAuthService
     */
    recordAuthentication(ipAddress: string, userAgent: string): void;
    /**
     * Get all role types assigned to this user (read-only)
     * Use this for validation in use cases before calling PermissionRepository
     *
     * @returns Array of role type strings (e.g., ['DOCTOR', 'ADMIN'])
     */
    get roleTypes(): string[];
    /**
     * Check if user has a specific role
     *
     * @param roleType Role type to check (e.g., 'DOCTOR', 'ADMIN')
     * @returns true if user has the role, false otherwise
     */
    hasRole(roleType: string): boolean;
    /**
     * Add a role to user
     * Pure RBAC: Supports multiple roles per user
     *
     * @deprecated Use IPermissionRepository.assignRole() instead
     * This method will be removed in v2.2
     * Role assignments should go through PermissionRepository to ensure
     * proper persistence to user_roles table and cache invalidation.
     */
    addRole(newRole: HealthcareRole, assignedBy: UserId): void;
    /**
     * Remove a role from user
     * Pure RBAC: User must have at least one role
     *
     * @deprecated Use IPermissionRepository.removeRole() instead
     * This method will be removed in v2.2
     * Role removals should go through PermissionRepository to ensure
     * proper persistence to user_roles table and cache invalidation.
     */
    removeRole(roleType: string, removedBy: UserId): void;
    /**
     * Change role with audit trail
     *
     * @deprecated Use addRole() and removeRole() instead for Pure RBAC
     * This method is kept for backward compatibility
     */
    changeRole(newRole: HealthcareRole, changedBy: UserId): void;
    /**
     * Get role types as string array
     * @deprecated Use roleTypes getter instead
     */
    getRoleTypes(): string[];
    /**
     * Update personal info with validation
     */
    updatePersonalInfo(personalInfo: PersonalInfo): void;
    /**
     * Enhanced business invariants validation
     */
    protected validateBusinessInvariants(): void;
    /**
     * Relaxed validation for reconstitution from database
     * Only validates critical invariants, allows incomplete personal info
     * This is necessary to handle legacy data that may not meet current business rules
     */
    protected validateReconstitutionInvariants(): void;
    /**
     * Healthcare compliance checks
     */
    isVietnameseHealthcareCompliant(): boolean;
    /**
     * HIPAA compliance check
     */
    isHIPAACompliant(): boolean;
    /**
     * Permission checks with fallback
     */
    /**
     * Check if user can perform action on resource
     *
     * @deprecated This method is deprecated in Pure RBAC implementation.
     * Use PermissionService.hasPermission() instead which queries database.
     *
     * This method is kept for backward compatibility but always returns false.
     */
    canPerformAction(_action: string, _resource: string): boolean;
    /**
     * Safe audit info extraction
     */
    getSummaryForLogging(): object;
    /**
     * Private helper methods
     */
    /**
     * Verify email with error handling
     */
    verifyEmail(): void;
    /**
     * Deactivate user permanently (irreversible)
     * Used for deceased patients or permanent account closure
     */
    deactivate(deactivatedBy: string, reason: string): void;
    /**
     * Lock account temporarily (can be unlocked by admin)
     */
    lock(lockedBy: string, reason: string, terminatedSessions?: boolean): void;
    /**
     * Activate user (only from LOCKED or SUSPENDED status)
     */
    activate(_activatedBy: string, _reason?: string): void;
    /**
     * Get patient ID (User is not a patient)
     */
    getPatientId(): string | null;
    /**
     * Validate invariants
     */
    validateInvariants(): void;
    /**
     * Apply domain event (for event sourcing)
     */
    protected applyEvent(_event: DomainEvent): void;
    /**
     * Validate entity state - required by Entity base class
     */
    validate(): void;
    /**
     * Convert to persistence format
     *
     * NOTE: This method returns domain-level data, NOT database column names.
     * For actual database persistence, use UserMapper.toPersistence() in infrastructure layer.
     *
     * This satisfies the Entity base class requirement while maintaining Clean Architecture.
     */
    toPersistence(): Record<string, any>;
}
//# sourceMappingURL=User.d.ts.map