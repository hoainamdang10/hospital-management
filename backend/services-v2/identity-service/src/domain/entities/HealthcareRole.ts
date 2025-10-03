/**
 * HealthcareRole Entity
 * Represents user roles in healthcare system
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Entity } from '@shared/domain/base/entity';

export type HealthcareRoleType =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'PATIENT'
  | 'BILLING_STAFF';

interface HealthcareRoleProps {
  type: HealthcareRoleType;
  name: string;
  nameVietnamese: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  hasHIPAATraining: boolean;
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
    permissions: string[] = [],
    hasHIPAATraining: boolean = false
  ): HealthcareRole {
    return new HealthcareRole({
      type,
      name,
      nameVietnamese,
      description,
      permissions,
      isActive: true,
      hasHIPAATraining
    });
  }

  public static fromRoleType(roleType: string): HealthcareRole {
    const roleMap: Record<string, { name: string; nameVi: string; desc: string; permissions: string[]; hipaa: boolean }> = {
      'ADMIN': {
        name: 'Administrator',
        nameVi: 'Quản trị viên',
        desc: 'System administrator with full access',
        permissions: ['*'],
        hipaa: true
      },
      'DOCTOR': {
        name: 'Doctor',
        nameVi: 'Bác sĩ',
        desc: 'Medical doctor',
        permissions: ['read:patients', 'write:patients', 'read:medical_records', 'write:medical_records'],
        hipaa: true
      },
      'NURSE': {
        name: 'Nurse',
        nameVi: 'Y tá',
        desc: 'Registered nurse',
        permissions: ['read:patients', 'write:patients', 'read:medical_records'],
        hipaa: true
      },
      'RECEPTIONIST': {
        name: 'Receptionist',
        nameVi: 'Lễ tân',
        desc: 'Front desk receptionist',
        permissions: ['read:patients', 'write:appointments'],
        hipaa: false
      },
      'PHARMACIST': {
        name: 'Pharmacist',
        nameVi: 'Dược sĩ',
        desc: 'Licensed pharmacist',
        permissions: ['read:prescriptions', 'write:prescriptions'],
        hipaa: true
      },
      'LAB_TECHNICIAN': {
        name: 'Lab Technician',
        nameVi: 'Kỹ thuật viên xét nghiệm',
        desc: 'Laboratory technician',
        permissions: ['read:lab_results', 'write:lab_results'],
        hipaa: true
      },
      'PATIENT': {
        name: 'Patient',
        nameVi: 'Bệnh nhân',
        desc: 'Patient user',
        permissions: ['read:own_records'],
        hipaa: false
      },
      'BILLING_STAFF': {
        name: 'Billing Staff',
        nameVi: 'Nhân viên thanh toán',
        desc: 'Billing and payment staff',
        permissions: ['read:billing', 'write:billing'],
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
      permissions: roleData.permissions,
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

  public get permissions(): string[] {
    return [...this.props.permissions];
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public hasHIPAATraining(): boolean {
    return this.props.hasHIPAATraining;
  }

  /**
   * Check if role has specific permission
   */
  public hasPermission(action: string, resource: string): boolean {
    const permission = `${action}:${resource}`;
    return this.props.permissions.includes('*') || this.props.permissions.includes(permission);
  }

  /**
   * Check if role is medical staff
   */
  public isMedicalStaff(): boolean {
    return ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN'].includes(this.props.type);
  }

  /**
   * Check if role is administrative staff
   */
  public isAdministrativeStaff(): boolean {
    return ['ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'].includes(this.props.type);
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
  toPersistence(): any {
    return {
      id: this.id,
      type: this.props.type,
      name: this.props.name,
      name_vietnamese: this.props.nameVietnamese,
      description: this.props.description,
      permissions: this.props.permissions,
      is_active: this.props.isActive,
      has_hipaa_training: this.props.hasHIPAATraining,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
}
