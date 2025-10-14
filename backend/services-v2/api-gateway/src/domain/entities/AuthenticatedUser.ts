import { Entity } from '@shared/domain/base/entity';
import { UserId } from '../value-objects/UserId';

export interface AuthenticatedUserProps {
  userId: UserId;
  email: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  issuedAt: Date;
  expiresAt: Date;
}

export class AuthenticatedUser extends Entity<AuthenticatedUserProps> {
  private constructor(props: AuthenticatedUserProps, id?: string) {
    super(props, id);
  }

  public static create(props: AuthenticatedUserProps): AuthenticatedUser {
    const user = new AuthenticatedUser(props, props.userId.value);
    user.validate();
    return user;
  }

  public get userId(): UserId {
    return this.props.userId;
  }

  public get email(): string {
    return this.props.email;
  }

  public get roles(): string[] {
    return [...this.props.roles];
  }

  public get permissions(): string[] {
    return [...this.props.permissions];
  }

  public get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  public get issuedAt(): Date {
    return this.props.issuedAt;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public hasRole(role: string): boolean {
    return this.props.roles.includes(role);
  }

  public hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.props.roles.includes(role));
  }

  public hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.props.roles.includes(role));
  }

  public hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission);
  }

  public hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.props.permissions.includes(permission));
  }

  public hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.props.permissions.includes(permission));
  }

  public isExpired(): boolean {
    return this.props.expiresAt < new Date();
  }

  public isValid(): boolean {
    return !this.isExpired();
  }

  public getTimeUntilExpiry(): number {
    return this.props.expiresAt.getTime() - Date.now();
  }

  override validate(): void {
    if (!this.props.userId) {
      throw new Error('User ID is required');
    }

    if (!this.props.email || this.props.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.props.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.props.roles || this.props.roles.length === 0) {
      throw new Error('User must have at least one role');
    }

    if (!this.props.permissions || this.props.permissions.length === 0) {
      throw new Error('User must have at least one permission');
    }

    if (this.props.issuedAt >= this.props.expiresAt) {
      throw new Error('Token expiration time must be after issued time');
    }
  }

  override toPersistence(): Record<string, unknown> {
    return {
      userId: this.props.userId.value,
      email: this.props.email,
      roles: this.props.roles,
      permissions: this.props.permissions,
      sessionId: this.props.sessionId,
      issuedAt: this.props.issuedAt.toISOString(),
      expiresAt: this.props.expiresAt.toISOString()
    };
  }
}

