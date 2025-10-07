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
import { UserSession } from '../entities/UserSession';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../events/UserRoleChangedEvent';

export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  // passwordHash removed - handled by Supabase Auth
  healthcareRoles: HealthcareRole[]; // Changed from single role to multiple roles
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
        isActive: true,
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
   */
  public static reconstitute(
    id: string,
    email: Email,
    personalInfo: PersonalInfo,
    healthcareRoles: HealthcareRole[],
    isActive: boolean,
    isEmailVerified: boolean,
    lastLoginAt: Date | undefined,
    createdAt: Date,
    updatedAt: Date
  ): User {
    const props: UserProps = {
      id: UserId.fromString(id),
      email,
      personalInfo,
      healthcareRoles,
      isActive,
      isEmailVerified,
      lastLoginAt,
      createdAt,
      updatedAt
    };

    const user = new User(props, id);
    user.validateBusinessInvariants();
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

  public get isActive(): boolean {
    return this.props.isActive;
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
  public recordAuthentication(ipAddress: string, userAgent: string): UserSession {
    try {
      if (!this.props.isActive) {
        throw new Error('Tài khoản đã bị vô hiệu hóa');
      }

      // Update last login
      this.props.lastLoginAt = new Date();
      this.props.updatedAt = new Date();

      // Create user session with enhanced security
      // Note: Session token should be provided by infrastructure layer
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const session = UserSession.create(
        this.props.id.value,
        '', // sessionToken - to be set by infrastructure
        {}, // deviceInfo - to be set by infrastructure
        ipAddress,
        userAgent,
        expiresAt
      );

      // Domain event for successful authentication
      this.addDomainEvent(new UserAuthenticatedEvent(
        this.props.id,
        ipAddress,
        userAgent,
        new Date()
      ));

      return session;
    } catch (error) {
      // Log authentication failure for security monitoring
      console.error('Authentication recording failed', {
        userId: this.props.id.value,
        email: this.props.email.value,
        ipAddress,
        error: getErrorMessage(error)
      });
      throw error;
    }
  }

  /**
   * Add a role to user
   * Pure RBAC: Supports multiple roles per user
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
   * Check if user has a specific role
   */
  public hasRole(roleType: string): boolean {
    return this.props.healthcareRoles.some(r => r.type === roleType.toUpperCase());
  }

  /**
   * Get role types as string array
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
   * Convert to Supabase format for persistence
   * ARCHITECTURE NOTE: This method violates Clean Architecture by knowing about Supabase column names.
   * TODO: Move this mapping logic to SupabaseUserRepository.
   *
   * @deprecated Use repository mapping instead
   */
  public toSupabaseFormat(): any {
    return {
      id: this.props.id.value,
      email: this.props.email.value,
      full_name: this.props.personalInfo.fullName,
      role_type: this.props.healthcareRoles[0].name, // Primary role
      citizen_id: this.props.personalInfo.citizenId,
      date_of_birth: this.props.personalInfo.dateOfBirth?.toISOString().split('T')[0],
      gender: this.props.personalInfo.gender,
      address: this.props.personalInfo.address,
      phone_number: this.props.personalInfo.phoneNumber,
      emergency_contact_name: this.props.personalInfo.emergencyContactName,
      emergency_contact_phone: this.props.personalInfo.emergencyContactPhone,
      is_active: this.props.isActive,
      is_verified: this.props.isEmailVerified,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
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
    if (this.props.isActive && !this.props.personalInfo.isComplete()) {
      errors.push('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    }

    // Password validation removed - handled by Supabase Auth

    if (errors.length > 0) {
      throw new Error(`Business invariants violated: ${errors.join(', ')}`);
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
      console.warn('Healthcare compliance check failed', {
        userId: this.props.id.value,
        error: getErrorMessage(error)
      });
      return false;
    }
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    try {
      return (
        this.props.isActive &&
        this.props.isEmailVerified &&
        this.props.healthcareRoles[0].hasHIPAATraining() &&
        this.props.personalInfo.isComplete()
      );
    } catch (error) {
      console.warn('HIPAA compliance check failed', {
        userId: this.props.id.value,
        error: getErrorMessage(error)
      });
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
  public canPerformAction(action: string, resource: string): boolean {
    console.warn('canPerformAction() called on User aggregate. Use PermissionService instead.', {
      userId: this.props.id.value,
      action,
      resource
    });
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
        isActive: this.props.isActive,
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
   * Deactivate user with audit
   */
  public deactivate(): void {
    try {
      this.props.isActive = false;
      this.props.updatedAt = new Date();
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Activate user with validation
   */
  public activate(): void {
    try {
      this.props.isActive = true;
      this.props.updatedAt = new Date();
      
      // Re-validate business invariants when activating
      this.validateBusinessInvariants();
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
   * Convert to persistence format - required by Entity base class
   */
  toPersistence(): any {
    const props = this.getProps();
    return {
      id: this.id,
      email: props.email.value,
      full_name: props.personalInfo.fullName,
      phone_number: props.personalInfo.phoneNumber,
      address: props.personalInfo.address,
      date_of_birth: props.personalInfo.dateOfBirth,
      gender: props.personalInfo.gender,
      citizen_id: props.personalInfo.citizenId,
      emergency_contact_name: props.personalInfo.emergencyContactName,
      emergency_contact_phone: props.personalInfo.emergencyContactPhone,
      healthcare_role_id: props.healthcareRoles[0].id, // Primary role
      healthcare_role_type: props.healthcareRoles[0].type,
      is_active: props.isActive,
      is_email_verified: props.isEmailVerified,
      last_login_at: props.lastLoginAt,
      created_at: props.createdAt,
      updated_at: props.updatedAt
    };
  }
}

// Helper function
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
