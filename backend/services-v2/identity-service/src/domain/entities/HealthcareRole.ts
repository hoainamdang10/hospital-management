/**
 * HealthcareRole Entity
 * Represents user roles in healthcare system
 *
 * Pure RBAC Design:
 * - Role metadata only (no hardcoded permissions)
 * - Permissions loaded from database via repository
 * - Supports multiple roles per user
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */

import { Entity } from '@shared/domain/base/entity';

/**
 * Healthcare Role Types - Simplified for Graduation Project
 *
 * 5 Core Roles:
 * - ADMIN: System administrator
 * - DOCTOR: Medical doctor (includes pharmacy & lab orders)
 * - NURSE: Registered nurse (includes pharmacy dispensing & lab specimen collection)
 * - RECEPTIONIST: Front desk (includes billing & payment processing)
 * - PATIENT: Patient user
 *
 * Merged Roles:
 * - PHARMACIST → NURSE + DOCTOR (pharmacy permissions distributed)
 * - LAB_TECHNICIAN → NURSE + DOCTOR (lab permissions distributed)
 * - BILLING_STAFF → RECEPTIONIST + ADMIN (billing permissions distributed)
 */
export type HealthcareRoleType =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PATIENT';

interface HealthcareRoleProps {
  type: HealthcareRoleType;
  name: string;
  nameVietnamese: string;
  description: string;
  isActive: boolean;
  hasHIPAATraining: boolean;
}

/**
 * Healthcare Role Persistence Format
 */
export interface HealthcareRolePersistenceProps {
  id: string;
  type: HealthcareRoleType;
  name: string;
  name_vietnamese: string;
  description: string;
  is_active: boolean;
  has_hipaa_training: boolean;
  created_at: Date;
  updated_at: Date;
}

export class HealthcareRole extends Entity<HealthcareRoleProps> {
  private constructor(props: HealthcareRoleProps, id?: string) {
    super(props, id);
  }

  public static create(
    type: HealthcareRoleType,
    name: string,
    nameVietnamese: string,
    description: string,
    hasHIPAATraining: boolean = false
  ): HealthcareRole {
    return new HealthcareRole({
      type,
      name,
      nameVietnamese,
      description,
      isActive: true,
      hasHIPAATraining
    });
  }

  /**
   * Create HealthcareRole from role type string
   *
   * NOTE: Permissions are NO LONGER hardcoded here.
   * Permissions are loaded from database via IPermissionRepository.
   *
   * @param roleType - Role type string (e.g., 'admin', 'doctor', 'patient')
   * @returns HealthcareRole instance with metadata only
   *
   * @example
   * ```typescript
   * const role = HealthcareRole.fromRoleType('doctor');
   * // To get permissions, use:
   * // const permissions = await permissionRepository.getRolePermissions(role.type);
   * ```
   */
  public static fromRoleType(roleType: string): HealthcareRole {
    const roleMap: Record<string, { name: string; nameVi: string; desc: string; hipaa: boolean }> = {
      'ADMIN': {
        name: 'Administrator',
        nameVi: 'Quản trị viên',
        desc: 'System administrator with full access (includes billing management)',
        hipaa: true
      },
      'DOCTOR': {
        name: 'Doctor',
        nameVi: 'Bác sĩ',
        desc: 'Medical doctor (includes pharmacy orders & lab orders)',
        hipaa: true
      },
      'NURSE': {
        name: 'Nurse',
        nameVi: 'Y tá',
        desc: 'Registered nurse (includes pharmacy dispensing & lab specimen collection)',
        hipaa: true
      },
      'RECEPTIONIST': {
        name: 'Receptionist',
        nameVi: 'Lễ tân',
        desc: 'Front desk receptionist (includes billing & payment processing)',
        hipaa: false
      },
      'PATIENT': {
        name: 'Patient',
        nameVi: 'Bệnh nhân',
        desc: 'Patient user',
        hipaa: false
      }
    };

    const roleData = roleMap[roleType.toUpperCase()];
    if (!roleData) {
      throw new Error(`Invalid role type: ${roleType}`);
    }

    return new HealthcareRole({
      type: roleType.toUpperCase() as HealthcareRoleType,
      name: roleData.name,
      nameVietnamese: roleData.nameVi,
      description: roleData.desc,
      isActive: true,
      hasHIPAATraining: roleData.hipaa
    });
  }

  // Getters
  public get type(): HealthcareRoleType {
    return this.props.type;
  }

  public get name(): string {
    return this.props.name;
  }

  public get nameVietnamese(): string {
    return this.props.nameVietnamese;
  }

  public get description(): string {
    return this.props.description;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public hasHIPAATraining(): boolean {
    return this.props.hasHIPAATraining;
  }

  /**
   * Check if role is medical staff
   */
  public isMedicalStaff(): boolean {
    return ['DOCTOR', 'NURSE'].includes(this.props.type);
  }

  /**
   * Check if role is administrative staff
   */
  public isAdministrativeStaff(): boolean {
    return ['ADMIN', 'RECEPTIONIST'].includes(this.props.type);
  }

  /**
   * Check if role is Vietnamese healthcare role
   */
  public isVietnameseHealthcareRole(): boolean {
    return this.props.nameVietnamese !== undefined && this.props.nameVietnamese.length > 0;
  }

  /**
   * Validate entity state - required by Entity base class
   */
  validate(): void {
    if (!this.props.type) {
      throw new Error('Role type is required');
    }
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new Error('Role name is required');
    }
    if (!this.props.nameVietnamese || this.props.nameVietnamese.trim().length === 0) {
      throw new Error('Vietnamese role name is required');
    }
  }

  /**
   * Convert entity to persistence format - required by Entity base class
   */
  toPersistence(): HealthcareRolePersistenceProps {
    return {
      id: this.id,
      type: this.props.type,
      name: this.props.name,
      name_vietnamese: this.props.nameVietnamese,
      description: this.props.description,
      is_active: this.props.isActive,
      has_hipaa_training: this.props.hasHIPAATraining,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
