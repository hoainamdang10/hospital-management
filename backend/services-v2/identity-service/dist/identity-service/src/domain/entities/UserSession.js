"use strict";
/**
 * UserSession Entity
 * Represents an active user session
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSession = void 0;
const entity_1 = require("@shared/domain/base/entity");
const uuid_1 = require("uuid");
class UserSession extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(userId, sessionToken, deviceInfo, ipAddress, userAgent, expiresAt) {
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
        }, (0, uuid_1.v4)());
    }
    /**
     * Reconstitute from persistence data
     */
    static fromPersistenceData(data) {
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
    get userId() {
        return this.props.userId;
    }
    get sessionToken() {
        return this.props.sessionToken;
    }
    get deviceInfo() {
        return this.props.deviceInfo;
    }
    get ipAddress() {
        return this.props.ipAddress;
    }
    get userAgent() {
        return this.props.userAgent;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get lastAccessedAt() {
        return this.props.lastAccessedAt;
    }
    /**
     * Check if session is expired
     */
    isExpired() {
        return new Date() > this.props.expiresAt;
    }
    /**
     * Deactivate session
     */
    deactivate() {
        this.props.isActive = false;
    }
    /**
     * Update last accessed time
     */
    updateLastAccessed() {
        this.props.lastAccessedAt = new Date();
    }
    /**
     * Validate entity state - required by Entity base class
     */
    validate() {
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
    toPersistence() {
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
exports.UserSession = UserSession;
//# sourceMappingURL=UserSession.js.map