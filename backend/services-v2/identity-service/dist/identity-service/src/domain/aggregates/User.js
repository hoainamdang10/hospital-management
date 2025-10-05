"use strict";
/**
 * User Aggregate Root - Consolidated Identity Service
 * Enhanced with Circuit Breaker compatibility and Supabase integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Anti-Pattern Mitigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const UserId_1 = require("../value-objects/UserId");
const UserSession_1 = require("../entities/UserSession");
const UserCreatedEvent_1 = require("../events/UserCreatedEvent");
const UserAuthenticatedEvent_1 = require("../events/UserAuthenticatedEvent");
const UserRoleChangedEvent_1 = require("../events/UserRoleChangedEvent");
/**
 * User Aggregate Root with Enhanced Error Handling
 * Implements anti-patterns mitigation and graceful degradation
 */
class User extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method for creating new users with validation
     * Note: Password is handled by Supabase Auth, not stored in domain model
     */
    static create(email, personalInfo, healthcareRole) {
        try {
            const userId = UserId_1.UserId.generate();
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
            user.addDomainEvent(new UserCreatedEvent_1.UserCreatedEvent(userId, email, healthcareRole));
            return user;
        }
        catch (error) {
            throw new Error(`Failed to create user: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Factory method for reconstituting from persistence
     * Used by infrastructure layer to rebuild domain object from database
     * This is a valid use case in Clean Architecture - domain provides factory for reconstitution
     */
    static reconstitute(id, email, personalInfo, healthcareRole, isActive, isEmailVerified, lastLoginAt, createdAt, updatedAt) {
        const props = {
            id: UserId_1.UserId.fromString(id),
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
    get id() {
        return this.props.id.value;
    }
    get userId() {
        return this.props.id;
    }
    get email() {
        return this.props.email;
    }
    get personalInfo() {
        return this.props.personalInfo;
    }
    get healthcareRole() {
        return this.props.healthcareRole;
    }
    get isActive() {
        return this.props.isActive;
    }
    get isEmailVerified() {
        return this.props.isEmailVerified;
    }
    get lastLoginAt() {
        return this.props.lastLoginAt;
    }
    /**
     * Record authentication event (password verification done by Supabase Auth)
     * This method is called AFTER successful authentication via SupabaseAuthService
     */
    recordAuthentication(ipAddress, userAgent) {
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
            const session = UserSession_1.UserSession.create(this.props.id.value, '', // sessionToken - to be set by infrastructure
            {}, // deviceInfo - to be set by infrastructure
            ipAddress, userAgent, expiresAt);
            // Domain event for successful authentication
            this.addDomainEvent(new UserAuthenticatedEvent_1.UserAuthenticatedEvent(this.props.id, ipAddress, userAgent, new Date()));
            return session;
        }
        catch (error) {
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
    changeRole(newRole, changedBy) {
        try {
            const oldRole = this.props.healthcareRole;
            this.props.healthcareRole = newRole;
            this.props.updatedAt = new Date();
            // Domain event for role change
            this.addDomainEvent(new UserRoleChangedEvent_1.UserRoleChangedEvent(this.props.id, oldRole, newRole, changedBy.value));
        }
        catch (error) {
            throw new Error(`Failed to change role: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Update personal info with validation
     */
    updatePersonalInfo(personalInfo) {
        try {
            this.props.personalInfo = personalInfo;
            this.props.updatedAt = new Date();
            // Re-validate business invariants after update
            this.validateBusinessInvariants();
        }
        catch (error) {
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
    toSupabaseFormat() {
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
    validateBusinessInvariants() {
        const errors = [];
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
    isVietnameseHealthcareCompliant() {
        try {
            const personalInfo = this.props.personalInfo;
            return (personalInfo.hasVietnameseId() &&
                personalInfo.hasValidPhoneNumber() &&
                this.props.healthcareRole.isVietnameseHealthcareRole() &&
                this.props.isEmailVerified);
        }
        catch (error) {
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
    isHIPAACompliant() {
        try {
            return (this.props.isActive &&
                this.props.isEmailVerified &&
                this.props.healthcareRole.hasHIPAATraining() &&
                this.props.personalInfo.isComplete());
        }
        catch (error) {
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
    canPerformAction(action, resource) {
        try {
            return this.props.healthcareRole.hasPermission(action, resource);
        }
        catch (error) {
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
    getSummaryForLogging() {
        try {
            return {
                userId: this.props.id.value,
                role: this.props.healthcareRole.name,
                isActive: this.props.isActive,
                isEmailVerified: this.props.isEmailVerified,
                lastLoginAt: this.props.lastLoginAt?.toISOString(),
                createdAt: this.props.createdAt.toISOString()
            };
        }
        catch (error) {
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
    verifyEmail() {
        try {
            this.props.isEmailVerified = true;
            this.props.updatedAt = new Date();
        }
        catch (error) {
            throw new Error(`Failed to verify email: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Deactivate user with audit
     */
    deactivate() {
        try {
            this.props.isActive = false;
            this.props.updatedAt = new Date();
        }
        catch (error) {
            throw new Error(`Failed to deactivate user: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Activate user with validation
     */
    activate() {
        try {
            this.props.isActive = true;
            this.props.updatedAt = new Date();
            // Re-validate business invariants when activating
            this.validateBusinessInvariants();
        }
        catch (error) {
            throw new Error(`Failed to activate user: ${getErrorMessage(error)}`);
        }
    }
    /**
     * Get patient ID (User is not a patient)
     */
    getPatientId() {
        return null;
    }
    /**
     * Validate invariants
     */
    validateInvariants() {
        this.validateBusinessInvariants();
    }
    /**
     * Apply domain event (for event sourcing)
     */
    applyEvent(_event) {
        // Event sourcing not implemented yet
        // This would replay events to rebuild aggregate state
    }
    /**
     * Validate entity state - required by Entity base class
     */
    validate() {
        this.validateBusinessInvariants();
    }
    /**
     * Convert to persistence format - required by Entity base class
     */
    toPersistence() {
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
exports.User = User;
// Helper function
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
//# sourceMappingURL=User.js.map