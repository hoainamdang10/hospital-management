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

import { HealthcareAggregateRoot } from '@shared/domain/base/aggregate-root';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { HealthcareRole } from '../entities/HealthcareRole';
import { AccountStatus, AccountStatusHelper } from '../value-objects/AccountStatus';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../events/UserRoleChangedEvent';
import { UserDeactivatedEvent } from '../events/UserDeactivatedEvent';
import { UserActivatedEvent } from '../events/UserActivatedEvent';

export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  // passwordHash removed - handled by Supabase Auth
  healthcareRoles: HealthcareRole[]; // Changed from single role to multiple roles
  accountStatus: AccountStatus; // Replaces isActive for better state management
  isEmailVerified: boolean;
  deactivationReason?: string; // Reason for deactivation/lock
  deactivatedAt?: Date; // When account was deactivated
  deactivatedBy?: string; // Who deactivated the account
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Aggregate Root with Enhanced Error Handling
 * Implements anti-patterns mitigation and graceful degradation
 */
export class User extends HealthcareAggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

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
  public static create(
    email: Email,
    personalInfo: PersonalInfo,
    healthcareRoles: HealthcareRole[]
  ): User {
    try {
      // Validate at least one role
      if (!healthcareRoles || healthcareRoles.length === 0) {
        throw new Error('User must have at least one role');
      }

      const userId = UserId.generate();
      const now = new Date();

      const user = new User({
        id: userId,
        email,
        personalInfo,
        healthcareRoles,
        accountStatus: AccountStatus.ACTIVE,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now
      });

      // Validate business invariants before creating
      user.validateBusinessInvariants();

      // Domain event for user creation (with primary role)
      user.addDomainEvent(new UserCreatedEvent(userId, email, healthcareRoles[0]));

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${getErrorMessage(error)}`);
    }
  }

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
  public static reconstitute(
    id: string,
    email: Email,
    personalInfo: PersonalInfo,
    healthcareRoles: HealthcareRole[],
    accountStatus: AccountStatus,
    isEmailVerified: boolean,
    deactivationReason: string | undefined,
    deactivatedAt: Date | undefined,
    deactivatedBy: string | undefined,
    lastLoginAt: Date | undefined,
    createdAt: Date,
    updatedAt: Date
  ): User {
    const props: UserProps = {
      id: UserId.fromString(id),
      email,
      personalInfo,
      healthcareRoles,
      accountStatus,
      isEmailVerified,
      deactivationReason,
      deactivatedAt,
      deactivatedBy,
      lastLoginAt,
      createdAt,
      updatedAt
    };

    const user = new User(props, id);
    // Relaxed validation for reconstitution - only validate critical invariants
    user.validateReconstitutionInvariants();
    return user;
  }

  // REMOVED: fromSupabaseData() method
  // This method violated Clean Architecture by knowing about Supabase column names
  // Use UserMapper.toDomain() instead for mapping from database records

  // Getters with null safety
  public get id(): string {
    return this.props.id.value;
  }

  public get userId(): UserId {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  /**
   * Get all healthcare roles for this user
   * Pure RBAC: Returns array of roles
   */
  public get healthcareRoles(): HealthcareRole[] {
    return [...this.props.healthcareRoles]; // Return copy to prevent mutation
  }

  /**
   * Get primary healthcare role (first role in array)
   * For backward compatibility with code expecting single role
   *
   * @deprecated Use healthcareRoles instead for Pure RBAC
   */
  public get healthcareRole(): HealthcareRole {
    return this.props.healthcareRoles[0];
  }

  public get accountStatus(): AccountStatus {
    return this.props.accountStatus;
  }

  /**
   * Backward compatibility getter
   * @deprecated Use accountStatus instead
   */
  public get isActive(): boolean {
    return this.props.accountStatus === AccountStatus.ACTIVE;
  }

  public get deactivationReason(): string | undefined {
    return this.props.deactivationReason;
  }

  public get deactivatedAt(): Date | undefined {
    return this.props.deactivatedAt;
  }

  public get deactivatedBy(): string | undefined {
    return this.props.deactivatedBy;
  }

  public get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  public get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  /**
   * Record authentication event (password verification done by Supabase Auth)
   * This method is called AFTER successful authentication via SupabaseAuthService
   */
  public recordAuthentication(ipAddress: string, userAgent: string): void {
    if (this.props.accountStatus !== AccountStatus.ACTIVE) {
      throw new Error(`Tài khoản đã bị vô hiệu hóa: ${this.props.accountStatus}`);
    }

    // Update last login
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();

    // Domain event for successful authentication
    this.addDomainEvent(new UserAuthenticatedEvent(
      this.props.id,
      ipAddress,
      userAgent,
      new Date()
    ));
  }

  /**
   * Get all role types assigned to this user (read-only)
   * Use this for validation in use cases before calling PermissionRepository
   *
   * @returns Array of role type strings (e.g., ['DOCTOR', 'ADMIN'])
   */
  public get roleTypes(): string[] {
    return this.props.healthcareRoles.map(r => r.type);
  }

  /**
   * Check if user has a specific role
   *
   * @param roleType Role type to check (e.g., 'DOCTOR', 'ADMIN')
   * @returns true if user has the role, false otherwise
   */
  public hasRole(roleType: string): boolean {
    return this.props.healthcareRoles.some(r => r.type === roleType);
  }

  /**
   * Add a role to user
   * Pure RBAC: Supports multiple roles per user
   *
   * @deprecated Use IPermissionRepository.assignRole() instead
   * This method will be removed in v2.2
   * Role assignments should go through PermissionRepository to ensure
   * proper persistence to user_roles table and cache invalidation.
   */
  public addRole(newRole: HealthcareRole, assignedBy: UserId): void {
    try {
      // Check if role already assigned
      const hasRole = this.props.healthcareRoles.some(r => r.type === newRole.type);
      if (hasRole) {
        throw new Error(`User already has role: ${newRole.type}`);
      }

      this.props.healthcareRoles.push(newRole);
      this.props.updatedAt = new Date();

      // Domain event for role assignment
      this.addDomainEvent(new UserRoleChangedEvent(
        this.props.id,
        this.props.healthcareRoles[0], // old primary role
        newRole,
        assignedBy.value
      ));
    } catch (error) {
      throw new Error(`Failed to add role: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Remove a role from user
   * Pure RBAC: User must have at least one role
   *
   * @deprecated Use IPermissionRepository.removeRole() instead
   * This method will be removed in v2.2
   * Role removals should go through PermissionRepository to ensure
   * proper persistence to user_roles table and cache invalidation.
   */
  public removeRole(roleType: string, removedBy: UserId): void {
    try {
      if (this.props.healthcareRoles.length === 1) {
        throw new Error('Cannot remove last role. User must have at least one role.');
      }

      const roleIndex = this.props.healthcareRoles.findIndex(r => r.type === roleType);
      if (roleIndex === -1) {
        throw new Error(`User does not have role: ${roleType}`);
      }

      const removedRole = this.props.healthcareRoles[roleIndex];
      this.props.healthcareRoles.splice(roleIndex, 1);
      this.props.updatedAt = new Date();

      // Domain event for role removal
      this.addDomainEvent(new UserRoleChangedEvent(
        this.props.id,
        removedRole,
        this.props.healthcareRoles[0], // new primary role
        removedBy.value
      ));
    } catch (error) {
      throw new Error(`Failed to remove role: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Change role with audit trail
   *
   * @deprecated Use addRole() and removeRole() instead for Pure RBAC
   * This method is kept for backward compatibility
   */
  public changeRole(newRole: HealthcareRole, changedBy: UserId): void {
    try {
      const oldRole = this.props.healthcareRoles[0];
      this.props.healthcareRoles = [newRole]; // Replace all roles with single role
      this.props.updatedAt = new Date();

      // Domain event for role change
      this.addDomainEvent(new UserRoleChangedEvent(this.props.id, oldRole, newRole, changedBy.value));
    } catch (error) {
      throw new Error(`Failed to change role: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get role types as string array
   * @deprecated Use roleTypes getter instead
   */
  public getRoleTypes(): string[] {
    return this.props.healthcareRoles.map(r => r.type);
  }

  /**
   * Update personal info with validation
   */
  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    try {
      this.props.personalInfo = personalInfo;
      this.props.updatedAt = new Date();
      
      // Re-validate business invariants after update
      this.validateBusinessInvariants();
    } catch (error) {
      throw new Error(`Failed to update personal info: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Enhanced business invariants validation
   */
  protected validateBusinessInvariants(): void {
    const errors: string[] = [];

    // Email validation
    if (!this.props.email || !this.props.email.isValid()) {
      errors.push('Email không hợp lệ');
    }

    // Healthcare role validation
    if (!this.props.healthcareRoles || this.props.healthcareRoles.length === 0) {
      errors.push('Vai trò y tế phải được chỉ định');
    }

    // Personal info validation for active users
    if (this.props.accountStatus === AccountStatus.ACTIVE && !this.props.personalInfo.isComplete()) {
      errors.push('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    }

    // Password validation removed - handled by Supabase Auth

    if (errors.length > 0) {
      throw new Error(`Business invariants violated: ${errors.join(', ')}`);
    }
  }

  /**
   * Relaxed validation for reconstitution from database
   * Only validates critical invariants, allows incomplete personal info
   * This is necessary to handle legacy data that may not meet current business rules
   */
  protected validateReconstitutionInvariants(): void {
    const errors: string[] = [];

    // Email validation (critical)
    if (!this.props.email || !this.props.email.isValid()) {
      errors.push('Email không hợp lệ');
    }

    // Healthcare role validation (critical)
    if (!this.props.healthcareRoles || this.props.healthcareRoles.length === 0) {
      errors.push('Vai trò y tế phải được chỉ định');
    }

    // Skip personal info validation for reconstitution
    // This allows us to load users with incomplete data from database
    // Validation will be enforced when user tries to update their profile

    if (errors.length > 0) {
      throw new Error(`Critical invariants violated: ${errors.join(', ')}`);
    }
  }

  /**
   * Healthcare compliance checks
   */
  public isVietnameseHealthcareCompliant(): boolean {
    try {
      const personalInfo = this.props.personalInfo;
      return (
        personalInfo.hasVietnameseId() &&
        personalInfo.hasValidPhoneNumber() &&
        this.props.healthcareRoles[0].isVietnameseHealthcareRole() &&
        this.props.isEmailVerified
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    try {
      return (
        this.props.accountStatus === AccountStatus.ACTIVE &&
        this.props.isEmailVerified &&
        this.props.healthcareRoles[0].hasHIPAATraining() &&
        this.props.personalInfo.isComplete()
      );
    } catch (error) {
      return false;
    }
  }

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
  public canPerformAction(_action: string, _resource: string): boolean {
    return false; // Always deny - use PermissionService for actual permission checks
  }

  /**
   * Safe audit info extraction
   */
  public getSummaryForLogging(): object {
    try {
      return {
        userId: this.props.id.value,
        role: this.props.healthcareRoles[0].name, // Primary role
        accountStatus: this.props.accountStatus,
        isEmailVerified: this.props.isEmailVerified,
        lastLoginAt: this.props.lastLoginAt?.toISOString(),
        createdAt: this.props.createdAt.toISOString()
      };
    } catch (error) {
      return {
        userId: 'unknown',
        error: 'Failed to extract user summary'
      };
    }
  }

  /**
   * Private helper methods
   */
  // verifyPassword() removed - password verification handled by Supabase Auth

  /**
   * Verify email with error handling
   */
  public verifyEmail(): void {
    try {
      this.props.isEmailVerified = true;
      this.props.updatedAt = new Date();
    } catch (error) {
      throw new Error(`Failed to verify email: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Deactivate user permanently (irreversible)
   * Used for deceased patients or permanent account closure
   */
  public deactivate(deactivatedBy: string, reason: string): void {
    try {
      // Validate transition
      if (!AccountStatusHelper.canTransition(this.props.accountStatus, AccountStatus.DEACTIVATED)) {
        throw new Error(`Cannot deactivate account with status: ${this.props.accountStatus}`);
      }

      const now = new Date();
      this.props.accountStatus = AccountStatus.DEACTIVATED;
      this.props.deactivationReason = reason;
      this.props.deactivatedAt = now;
      this.props.deactivatedBy = deactivatedBy;
      this.props.updatedAt = now;

      // Emit domain event
      this.addDomainEvent(new UserDeactivatedEvent(
        this.props.id,
        deactivatedBy,
        reason,
        this.props.email.value,
        this.roleTypes[0] || 'UNKNOWN'
      ));
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Lock account temporarily (can be unlocked by admin)
   */
  public lock(lockedBy: string, reason: string): void {
    try {
      if (!AccountStatusHelper.canTransition(this.props.accountStatus, AccountStatus.LOCKED)) {
        throw new Error(`Cannot lock account with status: ${this.props.accountStatus}`);
      }

      const now = new Date();
      this.props.accountStatus = AccountStatus.LOCKED;
      this.props.deactivationReason = reason;
      this.props.deactivatedAt = now;
      this.props.deactivatedBy = lockedBy;
      this.props.updatedAt = now;
    } catch (error) {
      throw new Error(`Failed to lock user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Activate user (only from LOCKED or SUSPENDED status)
   */
  public activate(_activatedBy: string, _reason?: string): void {
    try {
      // Prevent activation of permanently deactivated accounts
      if (AccountStatusHelper.isPermanent(this.props.accountStatus)) {
        throw new Error('Cannot activate permanently deactivated account');
      }

      // Validate transition
      if (!AccountStatusHelper.canTransition(this.props.accountStatus, AccountStatus.ACTIVE)) {
        throw new Error(`Cannot activate account with status: ${this.props.accountStatus}`);
      }

      const now = new Date();
      this.props.accountStatus = AccountStatus.ACTIVE;
      this.props.deactivationReason = undefined;
      this.props.deactivatedAt = undefined;
      this.props.deactivatedBy = undefined;
      this.props.updatedAt = now;

      // Re-validate business invariants when activating
      this.validateBusinessInvariants();

      // Emit domain event
      this.addDomainEvent(new UserActivatedEvent(
        this.props.id.value,
        this.props.email.value,
        now
      ));
    } catch (error) {
      throw new Error(`Failed to activate user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get patient ID (User is not a patient)
   */
  getPatientId(): string | null {
    return null;
  }

  /**
   * Validate invariants
   */
  validateInvariants(): void {
    this.validateBusinessInvariants();
  }

  /**
   * Apply domain event (for event sourcing)
   */
  protected applyEvent(_event: DomainEvent): void {
    // Event sourcing not implemented yet
    // This would replay events to rebuild aggregate state
  }

  /**
   * Validate entity state - required by Entity base class
   */
  validate(): void {
    this.validateBusinessInvariants();
  }

  /**
   * Convert to persistence format
   *
   * NOTE: This method returns domain-level data, NOT database column names.
   * For actual database persistence, use UserMapper.toPersistence() in infrastructure layer.
   *
   * This satisfies the Entity base class requirement while maintaining Clean Architecture.
   */
  toPersistence(): Record<string, any> {
    const props = this.getProps();
    return {
      id: this.id,
      email: props.email.value,
      personalInfo: {
        fullName: props.personalInfo.fullName,
        phoneNumber: props.personalInfo.phoneNumber,
        address: props.personalInfo.address,
        dateOfBirth: props.personalInfo.dateOfBirth,
        gender: props.personalInfo.gender,
        citizenId: props.personalInfo.citizenId,
        emergencyContactName: props.personalInfo.emergencyContactName,
        emergencyContactPhone: props.personalInfo.emergencyContactPhone
      },
      healthcareRoles: props.healthcareRoles.map(r => ({
        type: r.type,
        name: r.name
      })),
      accountStatus: props.accountStatus,
      isEmailVerified: props.isEmailVerified,
      lastLoginAt: props.lastLoginAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt
    };
  }
}

// Helper function
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
