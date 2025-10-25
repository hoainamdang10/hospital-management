"use strict";
/**
 * User Mapper - Infrastructure Layer
 * Maps between Domain entities and Database records
 * Implements Clean Architecture - Infrastructure knows about both Domain and Database
 *
 * Pure RBAC: Supports multiple roles per user
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const User_1 = require("../../domain/aggregates/User");
const Email_1 = require("../../domain/value-objects/Email");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const HealthcareRole_1 = require("../../domain/entities/HealthcareRole");
const AccountStatus_1 = require("../../domain/value-objects/AccountStatus");
const error_helper_1 = require("../../utils/error-helper");
/**
 * User Mapper
 * Responsible for mapping between User aggregate and database records
 */
class UserMapper {
    /**
     * Map from database record to User aggregate
     *
     * Pure RBAC: Accepts roles as parameter (multiple roles)
     *
     * @param record - Database record from user_profiles table
     * @param roleTypes - Array of role type strings from user_roles table
     * @returns User aggregate
     *
     * @example
     * ```typescript
     * const roles = ['doctor', 'admin'];
     * const user = UserMapper.toDomain(record, roles);
     * ```
     */
    static toDomain(record, roleTypes) {
        try {
            const email = Email_1.Email.fromString(record.email);
            // Use PersonalInfo.create instead of fromSupabaseData
            const personalInfo = PersonalInfo_1.PersonalInfo.create({
                fullName: record.full_name,
                citizenId: record.citizen_id,
                dateOfBirth: record.date_of_birth ? new Date(record.date_of_birth) : undefined,
                gender: record.gender,
                address: record.address,
                phoneNumber: record.phone_number,
                emergencyContactName: record.emergency_contact_name,
                emergencyContactPhone: record.emergency_contact_phone
            });
            // Map multiple roles
            const healthcareRoles = roleTypes.length > 0
                ? roleTypes.map(roleType => HealthcareRole_1.HealthcareRole.fromRoleType(roleType))
                : [HealthcareRole_1.HealthcareRole.fromRoleType('patient')]; // Default to patient if no roles
            // Map account_status from database or fallback to is_active
            let accountStatus;
            if (record.account_status) {
                accountStatus = record.account_status;
            }
            else {
                // Backward compatibility: map is_active to AccountStatus
                accountStatus = (record.is_active ?? true) ? AccountStatus_1.AccountStatus.ACTIVE : AccountStatus_1.AccountStatus.LOCKED;
            }
            return User_1.User.reconstitute(record.id, email, personalInfo, healthcareRoles, // Multiple roles
            accountStatus, record.is_verified ?? false, record.deactivation_reason, record.deactivated_at ? new Date(record.deactivated_at) : undefined, record.deactivated_by, undefined, // lastLoginAt - will be set from user_sessions if needed
            new Date(record.created_at), new Date(record.updated_at));
        }
        catch (error) {
            throw new Error(`Failed to map database record to User domain: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Map from database record to User aggregate (backward compatibility)
     *
     * @deprecated Use toDomain(record, roleTypes) instead
     * This method uses record.role_type as single role for backward compatibility
     */
    static toDomainLegacy(record) {
        return UserMapper.toDomain(record, [record.role_type]);
    }
    /**
     * Map from User aggregate to database record
     */
    static toPersistence(user) {
        return {
            id: user.id,
            email: user.email.value,
            full_name: user.personalInfo.fullName,
            role_type: user.healthcareRole.type.toLowerCase(), // Use type (ADMIN, DOCTOR) and convert to lowercase for database constraint
            citizen_id: user.personalInfo.citizenId,
            date_of_birth: user.personalInfo.dateOfBirth?.toISOString().split('T')[0],
            gender: user.personalInfo.gender,
            address: user.personalInfo.address,
            phone_number: user.personalInfo.phoneNumber,
            emergency_contact_name: user.personalInfo.emergencyContactName,
            emergency_contact_phone: user.personalInfo.emergencyContactPhone,
            account_status: user.accountStatus,
            is_active: user.isActive, // Backward compatibility
            is_verified: user.isEmailVerified,
            deactivation_reason: user.deactivationReason,
            deactivated_at: user.deactivatedAt?.toISOString(),
            deactivated_by: user.deactivatedBy,
            created_at: user.createdAt.toISOString(),
            updated_at: user.updatedAt.toISOString()
        };
    }
    /**
     * Map from User aggregate to database record for insert
     */
    static toInsert(user) {
        const persistence = this.toPersistence(user);
        return {
            id: persistence.id,
            email: persistence.email,
            full_name: persistence.full_name,
            role_type: persistence.role_type,
            is_active: persistence.is_active,
            is_verified: persistence.is_verified,
            citizen_id: persistence.citizen_id,
            date_of_birth: persistence.date_of_birth,
            gender: persistence.gender,
            address: persistence.address,
            phone_number: persistence.phone_number,
            emergency_contact_name: persistence.emergency_contact_name,
            emergency_contact_phone: persistence.emergency_contact_phone,
            created_at: persistence.created_at,
            updated_at: persistence.updated_at
        };
    }
    /**
     * Map from User aggregate to database record for update
     */
    static toUpdate(user) {
        const persistence = this.toPersistence(user);
        // Remove id and created_at for updates
        const { id: _id, created_at: _created_at, ...updateData } = persistence;
        return {
            ...updateData,
            updated_at: new Date().toISOString()
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=UserMapper.js.map