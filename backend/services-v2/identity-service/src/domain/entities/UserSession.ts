/**
 * UserSession Entity
 * Represents an active user session
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '@shared/domain/base/entity';
import { v4 as uuidv4 } from 'uuid';

interface UserSessionProps {
  userId: string;
  sessionToken: string;
  deviceInfo: any;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
}

export class UserSession extends Entity<UserSessionProps> {
  private constructor(props: UserSessionProps, id?: string) {
    super(props, id);
  }

  public static create(
    userId: string,
    sessionToken: string,
    deviceInfo: any,
    ipAddress: string,
    userAgent: string,
    expiresAt: Date
  ): UserSession {
    const now = new Date();
    return new UserSession({
      userId,
      sessionToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt,
      isActive: true,
      createdAt: now,
      lastAccessedAt: now
    }, uuidv4());
  }

  /**
   * Reconstitute from persistence data
   */
  public static fromPersistenceData(data: any): UserSession {
    return new UserSession({
      userId: data.userId,
      sessionToken: data.sessionToken,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
      isActive: data.isActive,
      createdAt: data.createdAt,
      lastAccessedAt: data.lastAccessedAt
    }, data.id);
  }

  // Getters
  public get userId(): string {
    return this.props.userId;
  }

  public get sessionToken(): string {
    return this.props.sessionToken;
  }

  public get deviceInfo(): any {
    return this.props.deviceInfo;
  }

  public get ipAddress(): string {
    return this.props.ipAddress;
  }

  public get userAgent(): string {
    return this.props.userAgent;
  }

  public get expiresAt(): Date {
    return this.props.expiresAt;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get lastAccessedAt(): Date {
    return this.props.lastAccessedAt;
  }

  /**
   * Check if session is expired
   */
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Deactivate session
   */
  public deactivate(): void {
    this.props.isActive = false;
  }

  /**
   * Update last accessed time
   */
  public updateLastAccessed(): void {
    this.props.lastAccessedAt = new Date();
  }

  /**
   * Validate entity state - required by Entity base class
   */
  validate(): void {
    if (!this.props.userId) {
      throw new Error('User ID is required');
    }
    if (!this.props.sessionToken) {
      throw new Error('Session token is required');
    }
    if (!this.props.expiresAt) {
      throw new Error('Expiration date is required');
    }
  }

  /**
   * Convert entity to persistence format - required by Entity base class
   */
  toPersistence(): any {
    return {
      id: this.id,
      user_id: this.props.userId,
      session_token: this.props.sessionToken,
      device_info: this.props.deviceInfo,
      ip_address: this.props.ipAddress,
      user_agent: this.props.userAgent,
      expires_at: this.props.expiresAt.toISOString(),
      is_active: this.props.isActive,
      created_at: this.props.createdAt.toISOString(),
      last_accessed_at: this.props.lastAccessedAt.toISOString()
    };
  }
}
