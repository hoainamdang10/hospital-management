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

import { User } from '../../domain/aggregates/User';
import { Email } from '../../domain/value-objects/Email';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { HealthcareRole } from '../../domain/entities/HealthcareRole';
import { getErrorMessage } from '../../utils/error-helper';

/**
 * Database record interface for user_profiles table
 */
export interface UserRecord {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role_type: string;
  is_active: boolean;
  is_verified: boolean;
  citizen_id?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  subscription_tier?: string;
  subscription_expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * User Mapper
 * Responsible for mapping between User aggregate and database records
 */
export class UserMapper {
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
  static toDomain(record: UserRecord, roleTypes: string[]): User {
    try {
      const email = Email.fromString(record.email);

      // Use PersonalInfo.create instead of fromSupabaseData
      const personalInfo = PersonalInfo.create({
        fullName: record.full_name,
        citizenId: record.citizen_id,
        dateOfBirth: record.date_of_birth ? new Date(record.date_of_birth) : undefined,
        gender: record.gender as 'male' | 'female' | 'other' | undefined,
        address: record.address,
        phoneNumber: record.phone_number,
        emergencyContactName: record.emergency_contact_name,
        emergencyContactPhone: record.emergency_contact_phone
      });

      // Map multiple roles
      const healthcareRoles = roleTypes.length > 0
        ? roleTypes.map(roleType => HealthcareRole.fromRoleType(roleType))
        : [HealthcareRole.fromRoleType('patient')]; // Default to patient if no roles

      return User.reconstitute(
        record.id,
        email,
        personalInfo,
        healthcareRoles, // Multiple roles
        record.is_active ?? true,
        record.is_verified ?? false,
        undefined, // lastLoginAt - will be set from user_sessions if needed
        new Date(record.created_at),
        new Date(record.updated_at)
      );
    } catch (error) {
      throw new Error(`Failed to map database record to User domain: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Map from database record to User aggregate (backward compatibility)
   *
   * @deprecated Use toDomain(record, roleTypes) instead
   * This method uses record.role_type as single role for backward compatibility
   */
  static toDomainLegacy(record: UserRecord): User {
    return UserMapper.toDomain(record, [record.role_type]);
  }

  /**
   * Map from User aggregate to database record
   */
  static toPersistence(user: User): Partial<UserRecord> {
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
      is_active: user.isActive,
      is_verified: user.isEmailVerified,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
  }

  /**
   * Map from User aggregate to database record for insert
   */
  static toInsert(user: User): UserRecord {
    const persistence = this.toPersistence(user);
    return {
      id: persistence.id!,
      email: persistence.email!,
      full_name: persistence.full_name!,
      role_type: persistence.role_type!,
      is_active: persistence.is_active!,
      is_verified: persistence.is_verified!,
      citizen_id: persistence.citizen_id,
      date_of_birth: persistence.date_of_birth,
      gender: persistence.gender,
      address: persistence.address,
      phone_number: persistence.phone_number,
      emergency_contact_name: persistence.emergency_contact_name,
      emergency_contact_phone: persistence.emergency_contact_phone,
      created_at: persistence.created_at!,
      updated_at: persistence.updated_at!
    };
  }

  /**
   * Map from User aggregate to database record for update
   */
  static toUpdate(user: User): Partial<UserRecord> {
    const persistence = this.toPersistence(user);
    // Remove id and created_at for updates
    const { id: _id, created_at: _created_at, ...updateData } = persistence;
    return {
      ...updateData,
      updated_at: new Date().toISOString()
    };
  }
}

