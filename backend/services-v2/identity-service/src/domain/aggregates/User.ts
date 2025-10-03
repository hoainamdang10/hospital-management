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
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../events/UserRoleChangedEvent';

export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  // passwordHash removed - handled by Supabase Auth
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
export class User extends HealthcareAggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  /**
   * Factory method for creating new users with validation
   * Note: Password is handled by Supabase Auth, not stored in domain model
   */
  public static create(
    email: Email,
    personalInfo: PersonalInfo,
    healthcareRole: HealthcareRole
  ): User {
    try {
      const userId = UserId.generate();
      const now = new Date();

      const user = new User({
        id: userId,
        email,
        personalInfo,
        healthcareRole,
        isActive: true,
        isEmailVerified: false,
        createdAt: now,
        updatedAt: now
      });

      // Validate business invariants before creating
      user.validateBusinessInvariants();

      // Domain event for user creation
      user.addDomainEvent(new UserCreatedEvent(userId, email, healthcareRole));

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Factory method for reconstituting from persistence
   * Used by infrastructure layer to rebuild domain object from database
   * This is a valid use case in Clean Architecture - domain provides factory for reconstitution
   */
  public static reconstitute(
    id: string,
    email: Email,
    personalInfo: PersonalInfo,
    healthcareRole: HealthcareRole,
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
      healthcareRole,
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

  public get healthcareRole(): HealthcareRole {
    return this.props.healthcareRole;
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
   * Change role with audit trail
   */
  public changeRole(newRole: HealthcareRole, changedBy: UserId): void {
    try {
      const oldRole = this.props.healthcareRole;
      this.props.healthcareRole = newRole;
      this.props.updatedAt = new Date();

      // Domain event for role change
      this.addDomainEvent(new UserRoleChangedEvent(this.props.id, oldRole, newRole, changedBy.value));
    } catch (error) {
      throw new Error(`Failed to change role: ${getErrorMessage(error)}`);
    }
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
      role_type: this.props.healthcareRole.name,
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
    if (!this.props.healthcareRole) {
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
        this.props.healthcareRole.isVietnameseHealthcareRole() &&
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
        this.props.healthcareRole.hasHIPAATraining() &&
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
  public canPerformAction(action: string, resource: string): boolean {
    try {
      return this.props.healthcareRole.hasPermission(action, resource);
    } catch (error) {
      console.warn('Permission check failed, denying access', {
        userId: this.props.id.value,
        action,
        resource,
        error: getErrorMessage(error)
      });
      return false; // Fail-safe: deny access on error
    }
  }

  /**
   * Safe audit info extraction
   */
  public getSummaryForLogging(): object {
    try {
      return {
        userId: this.props.id.value,
        role: this.props.healthcareRole.name,
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
      healthcare_role_id: props.healthcareRole.id,
      healthcare_role_type: props.healthcareRole.type,
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
