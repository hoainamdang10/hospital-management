"use strict";
/**
 * User Mapper - Infrastructure Layer
 * Maps between Domain entities and Database records
 * Implements Clean Architecture - Infrastructure knows about both Domain and Database
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const User_1 = require("../../domain/aggregates/User");
const Email_1 = require("../../domain/value-objects/Email");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const HealthcareRole_1 = require("../../domain/entities/HealthcareRole");
const error_helper_1 = require("../../utils/error-helper");
/**
 * User Mapper
 * Responsible for mapping between User aggregate and database records
 */
class UserMapper {
    /**
     * Map from database record to User aggregate
     */
    static toDomain(record) {
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
            const healthcareRole = HealthcareRole_1.HealthcareRole.fromRoleType(record.role_type);
            return User_1.User.reconstitute(record.id, email, personalInfo, healthcareRole, record.is_active ?? true, record.is_verified ?? false, undefined, // lastLoginAt - will be set from user_sessions if needed
            new Date(record.created_at), new Date(record.updated_at));
        }
        catch (error) {
            throw new Error(`Failed to map database record to User domain: ${(0, error_helper_1.getErrorMessage)(error)}`);
        }
    }
    /**
     * Map from User aggregate to database record
     */
    static toPersistence(user) {
        return {
            id: user.id,
            email: user.email.value,
            full_name: user.personalInfo.fullName,
            role_type: user.healthcareRole.name,
            citizen_id: user.personalInfo.citizenId,
            date_of_birth: user.personalInfo.dateOfBirth?.toISOString().split('T')[0],
            gender: user.personalInfo.gender,
            address: user.personalInfo.address,
            phone_number: user.personalInfo.phoneNumber,
            emergency_contact_name: user.personalInfo.emergencyContactName,
            emergency_contact_phone: user.personalInfo.emergencyContactPhone,
            is_active: user.isActive,
            is_verified: user.isEmailVerified,
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
        const { id, created_at, ...updateData } = persistence;
        return {
            ...updateData,
            updated_at: new Date().toISOString()
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=UserMapper.js.map