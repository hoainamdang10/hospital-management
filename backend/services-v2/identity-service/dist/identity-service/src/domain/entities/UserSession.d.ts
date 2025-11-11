/**
 * UserSession Entity
 * Represents an active user session
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { Entity } from '@shared/domain/base/entity';
export interface DeviceInfo {
    deviceType?: string;
    deviceName?: string;
    os?: string;
    browser?: string;
    [key: string]: unknown;
}
interface UserSessionProps {
    userId: string;
    sessionToken: string;
    deviceInfo: DeviceInfo;
    ipAddress: string;
    userAgent: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt: Date;
    lastAccessedAt: Date;
}
export declare class UserSession extends Entity<UserSessionProps> {
    private constructor();
    static create(userId: string, sessionToken: string, deviceInfo: DeviceInfo, ipAddress: string, userAgent: string, expiresAt: Date): UserSession;
    /**
     * Reconstitute from persistence data
     */
    static fromPersistenceData(data: {
        id: string;
        userId: string;
        sessionToken: string;
        deviceInfo: DeviceInfo;
        ipAddress: string;
        userAgent: string;
        expiresAt: Date;
        isActive: boolean;
        createdAt: Date;
        lastAccessedAt: Date;
    }): UserSession;
    get userId(): string;
    get sessionToken(): string;
    get deviceInfo(): DeviceInfo;
    get ipAddress(): string;
    get userAgent(): string;
    get expiresAt(): Date;
    get isActive(): boolean;
    get createdAt(): Date;
    get lastAccessedAt(): Date;
    /**
     * Check if session is expired
     */
    isExpired(): boolean;
    /**
     * Deactivate session
     */
    deactivate(): void;
    /**
     * Update last accessed time
     */
    updateLastAccessed(): void;
    /**
     * Validate entity state - required by Entity base class
     */
    validate(): void;
    /**
     * Convert entity to persistence format - required by Entity base class
     */
    toPersistence(): Record<string, unknown>;
}
export {};
//# sourceMappingURL=UserSession.d.ts.map