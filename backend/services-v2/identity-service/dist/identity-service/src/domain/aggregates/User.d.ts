/**
 * User Aggregate Root - Consolidated Identity Service
 * Enhanced with Circuit Breaker compatibility and Supabase integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Anti-Pattern Mitigation
 */
import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { HealthcareRole } from '../entities/HealthcareRole';
import { UserSession } from '../entities/UserSession';
export interface UserProps {
    id: UserId;
    email: Email;
    personalInfo: PersonalInfo;
    healthcareRole: HealthcareRole;
    isActive: boolean;
    isEmailVerified: boolean;
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
     */
    static create(email: Email, personalInfo: PersonalInfo, healthcareRole: HealthcareRole): User;
    /**
     * Factory method for reconstituting from persistence
     * Used by infrastructure layer to rebuild domain object from database
     * This is a valid use case in Clean Architecture - domain provides factory for reconstitution
     */
    static reconstitute(id: string, email: Email, personalInfo: PersonalInfo, healthcareRole: HealthcareRole, isActive: boolean, isEmailVerified: boolean, lastLoginAt: Date | undefined, createdAt: Date, updatedAt: Date): User;
    get id(): string;
    get userId(): UserId;
    get email(): Email;
    get personalInfo(): PersonalInfo;
    get healthcareRole(): HealthcareRole;
    get isActive(): boolean;
    get isEmailVerified(): boolean;
    get lastLoginAt(): Date | undefined;
    /**
     * Record authentication event (password verification done by Supabase Auth)
     * This method is called AFTER successful authentication via SupabaseAuthService
     */
    recordAuthentication(ipAddress: string, userAgent: string): UserSession;
    /**
     * Change role with audit trail
     */
    changeRole(newRole: HealthcareRole, changedBy: UserId): void;
    /**
     * Update personal info with validation
     */
    updatePersonalInfo(personalInfo: PersonalInfo): void;
    /**
     * Convert to Supabase format for persistence
     * ARCHITECTURE NOTE: This method violates Clean Architecture by knowing about Supabase column names.
     * TODO: Move this mapping logic to SupabaseUserRepository.
     *
     * @deprecated Use repository mapping instead
     */
    toSupabaseFormat(): any;
    /**
     * Enhanced business invariants validation
     */
    protected validateBusinessInvariants(): void;
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
    canPerformAction(action: string, resource: string): boolean;
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
     * Deactivate user with audit
     */
    deactivate(): void;
    /**
     * Activate user with validation
     */
    activate(): void;
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
     * Convert to persistence format - required by Entity base class
     */
    toPersistence(): any;
}
//# sourceMappingURL=User.d.ts.map