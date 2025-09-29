/**
 * User Aggregate Root - Identity & Access Management
 * V2 Clean Architecture + DDD Implementation
 * Consolidated from User.ts and identity.aggregate.ts
 * Schema: auth_schema
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareAggregateRoot } from '../../../shared/domain/base/aggregate-root';
import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { HealthcareRole } from '../entities/HealthcareRole';
import { UserSession } from '../entities/UserSession';
import { LoginAttempt } from '../entities/LoginAttempt';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../events/UserRoleChangedEvent';

export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  passwordHash: string;
  healthcareRole: HealthcareRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends HealthcareAggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // Factory method for creating new users
  public static create(
    email: Email,
    personalInfo: PersonalInfo,
    passwordHash: string,
    healthcareRole: HealthcareRole
  ): User {
    const userId = UserId.generate();
    const now = new Date();

    const user = new User({
      id: userId,
      email,
      personalInfo,
      passwordHash,
      healthcareRole,
      isActive: true,
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now
    });

    // Domain event for user creation
    user.addDomainEvent(new UserCreatedEvent(userId, email, healthcareRole));

    return user;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public get id(): UserId {
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

  // Business methods
  public authenticate(password: string, ipAddress: string, userAgent: string): UserSession {
    if (!this.props.isActive) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    if (!this.verifyPassword(password)) {
      // Record failed login attempt
      const failedAttempt = LoginAttempt.createFailed(
        this.props.email,
        ipAddress,
        userAgent,
        'Mật khẩu không chính xác'
      );
      throw new Error('Thông tin đăng nhập không chính xác');
    }

    // Update last login
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();

    // Create user session
    const session = UserSession.create(this.props.id, ipAddress, userAgent);

    // Domain event for successful authentication
    this.addDomainEvent(new UserAuthenticatedEvent(this.props.id, session.id));

    return session;
  }

  public changeRole(newRole: HealthcareRole, changedBy: UserId): void {
    const oldRole = this.props.healthcareRole;
    this.props.healthcareRole = newRole;
    this.props.updatedAt = new Date();

    // Domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.props.id, oldRole, newRole, changedBy));
  }

  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public createPasswordResetToken(): PasswordResetToken {
    return PasswordResetToken.create(this.props.id);
  }

  // Private methods
  private verifyPassword(password: string): boolean {
    // In real implementation, use bcrypt or similar
    // This is a placeholder for password verification logic
    return true; // Simplified for demo
  }

  // Validation methods
  public canPerformAction(action: string, resource: string): boolean {
    return this.props.healthcareRole.hasPermission(action, resource);
  }

  public isInRole(roleName: string): boolean {
    return this.props.healthcareRole.name === roleName;
  }

  // Healthcare-specific methods
  public canAccessPatientData(): boolean {
    return this.canPerformAction('read', 'patient_data');
  }

  public canModifyMedicalRecords(): boolean {
    return this.canPerformAction('write', 'medical_records');
  }

  public canManageUsers(): boolean {
    return this.canPerformAction('manage', 'users');
  }

  // Audit methods
  public getAuditInfo(): object {
    return {
      userId: this.props.id.value,
      email: this.props.email.value,
      role: this.props.healthcareRole.name,
      isActive: this.props.isActive,
      lastLoginAt: this.props.lastLoginAt,
      createdAt: this.props.createdAt
    };
  }

  // ==================== V2 HEALTHCARE AGGREGATE METHODS ====================

  /**
   * Validate business invariants
   */
  protected validateBusinessInvariants(): void {
    // Email must be valid and unique
    if (!this.props.email || !this.props.email.isValid()) {
      throw new Error('Email không hợp lệ');
    }

    // Healthcare role must be assigned
    if (!this.props.healthcareRole) {
      throw new Error('Vai trò y tế phải được chỉ định');
    }

    // Personal info must be complete for active users
    if (this.props.isActive && !this.props.personalInfo.isComplete()) {
      throw new Error('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    }

    // Password hash must exist
    if (!this.props.passwordHash || this.props.passwordHash.length < 60) {
      throw new Error('Mật khẩu hash không hợp lệ');
    }
  }

  /**
   * Apply domain event
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case 'UserCreated':
        // Event already applied during creation
        break;

      case 'UserAuthenticated':
        this.props.lastLoginAt = new Date();
        this.props.updatedAt = new Date();
        break;

      case 'UserRoleChanged':
        // Role change handled in changeRole method
        this.props.updatedAt = new Date();
        break;

      case 'UserDeactivated':
        this.props.isActive = false;
        this.props.updatedAt = new Date();
        break;

      case 'UserReactivated':
        this.props.isActive = true;
        this.props.updatedAt = new Date();
        break;

      default:
        // Unknown event type - log but don't throw
        console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Get patient ID if user is a patient
   */
  getPatientId(): string | null {
    if (this.props.healthcareRole.name === 'patient') {
      return this.props.id.value;
    }
    return null;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): any {
    return {
      id: this.props.id.value,
      email: this.props.email.value,
      personal_info: this.props.personalInfo.toPersistence(),
      password_hash: this.props.passwordHash,
      healthcare_role: this.props.healthcareRole.toPersistence(),
      is_active: this.props.isActive,
      is_email_verified: this.props.isEmailVerified,
      last_login_at: this.props.lastLoginAt?.toISOString(),
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  /**
   * Create from persistence data
   */
  static fromPersistence(data: any): User {
    const props: UserProps = {
      id: UserId.fromString(data.id),
      email: Email.fromString(data.email),
      personalInfo: PersonalInfo.fromPersistence(data.personal_info),
      passwordHash: data.password_hash,
      healthcareRole: HealthcareRole.fromPersistence(data.healthcare_role),
      isActive: data.is_active,
      isEmailVerified: data.is_email_verified,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return new User(props, data.id);
  }

  /**
   * Vietnamese healthcare compliance check
   */
  public isVietnameseHealthcareCompliant(): boolean {
    // Check if user has required Vietnamese healthcare information
    const personalInfo = this.props.personalInfo;

    return (
      personalInfo.hasVietnameseId() &&
      personalInfo.hasValidPhoneNumber() &&
      this.props.healthcareRole.isVietnameseHealthcareRole() &&
      this.props.isEmailVerified
    );
  }

  /**
   * HIPAA compliance check
   */
  public isHIPAACompliant(): boolean {
    return (
      this.props.isActive &&
      this.props.isEmailVerified &&
      this.props.healthcareRole.hasHIPAATraining() &&
      this.props.personalInfo.isComplete()
    );
  }

  /**
   * Get user summary for logging (no sensitive data)
   */
  public getSummaryForLogging(): object {
    return {
      userId: this.props.id.value,
      role: this.props.healthcareRole.name,
      isActive: this.props.isActive,
      isEmailVerified: this.props.isEmailVerified,
      lastLoginAt: this.props.lastLoginAt?.toISOString(),
      createdAt: this.props.createdAt.toISOString()
    };
  }
}
