/**
 * HealthcareRole Entity
 * Manages roles and permissions in Vietnamese healthcare system
 */

import { Entity } from '../../../shared/domain/Entity';
import { UserId } from '../value-objects/UserId';

export interface HealthcareRoleProps {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  hierarchy: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

export class HealthcareRole extends Entity<HealthcareRoleProps> {
  private constructor(props: HealthcareRoleProps) {
    super(props);
  }

  public static create(
    name: string,
    displayName: string,
    description: string,
    permissions: Permission[],
    hierarchy: number
  ): HealthcareRole {
    const now = new Date();

    return new HealthcareRole({
      id: `role_${Date.now()}`,
      name,
      displayName,
      description,
      permissions,
      hierarchy,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  public static reconstitute(props: HealthcareRoleProps): HealthcareRole {
    return new HealthcareRole(props);
  }

  // Predefined Vietnamese healthcare roles
  public static createAdmin(): HealthcareRole {
    return this.create(
      'admin',
      'Quản trị viên',
      'Quản trị viên hệ thống bệnh viện',
      [
        { resource: '*', actions: ['*'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'system', actions: ['configure', 'monitor', 'backup'] }
      ],
      1
    );
  }

  public static createDoctor(): HealthcareRole {
    return this.create(
      'doctor',
      'Bác sĩ',
      'Bác sĩ điều trị',
      [
        { resource: 'patients', actions: ['read', 'update'] },
        { resource: 'medical_records', actions: ['create', 'read', 'update'] },
        { resource: 'appointments', actions: ['read', 'update'] },
        { resource: 'prescriptions', actions: ['create', 'read', 'update'] },
        { resource: 'diagnoses', actions: ['create', 'read', 'update'] }
      ],
      2
    );
  }

  public static createNurse(): HealthcareRole {
    return this.create(
      'nurse',
      'Y tá',
      'Y tá chăm sóc bệnh nhân',
      [
        { resource: 'patients', actions: ['read', 'update'] },
        { resource: 'medical_records', actions: ['read', 'update'] },
        { resource: 'appointments', actions: ['read'] },
        { resource: 'vital_signs', actions: ['create', 'read', 'update'] }
      ],
      3
    );
  }

  public static createReceptionist(): HealthcareRole {
    return this.create(
      'receptionist',
      'Lễ tân',
      'Nhân viên lễ tân tiếp đón',
      [
        { resource: 'patients', actions: ['create', 'read', 'update'] },
        { resource: 'appointments', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'billing', actions: ['read', 'update'] }
      ],
      4
    );
  }

  public static createPatient(): HealthcareRole {
    return this.create(
      'patient',
      'Bệnh nhân',
      'Bệnh nhân sử dụng dịch vụ',
      [
        { resource: 'own_profile', actions: ['read', 'update'] },
        { resource: 'own_appointments', actions: ['create', 'read', 'update'] },
        { resource: 'own_medical_records', actions: ['read'] },
        { resource: 'own_billing', actions: ['read'] }
      ],
      5
    );
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get displayName(): string {
    return this.props.displayName;
  }

  public get description(): string {
    return this.props.description;
  }

  public get permissions(): Permission[] {
    return this.props.permissions;
  }

  public get hierarchy(): number {
    return this.props.hierarchy;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  // Permission checking methods
  public hasPermission(action: string, resource: string): boolean {
    if (!this.props.isActive) return false;

    return this.props.permissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  }

  public canAccessResource(resource: string): boolean {
    return this.props.permissions.some(permission => 
      permission.resource === '*' || permission.resource === resource
    );
  }

  public getPermissionsForResource(resource: string): string[] {
    const permission = this.props.permissions.find(p => 
      p.resource === resource || p.resource === '*'
    );
    return permission ? permission.actions : [];
  }

  // Hierarchy methods
  public isHigherThan(otherRole: HealthcareRole): boolean {
    return this.props.hierarchy < otherRole.props.hierarchy;
  }

  public isLowerThan(otherRole: HealthcareRole): boolean {
    return this.props.hierarchy > otherRole.props.hierarchy;
  }

  public isSameLevel(otherRole: HealthcareRole): boolean {
    return this.props.hierarchy === otherRole.props.hierarchy;
  }

  // Vietnamese healthcare specific methods
  public canPrescribeMedication(): boolean {
    return this.hasPermission('create', 'prescriptions');
  }

  public canAccessPatientRecords(): boolean {
    return this.hasPermission('read', 'medical_records');
  }

  public canModifyPatientRecords(): boolean {
    return this.hasPermission('update', 'medical_records');
  }

  public canManageAppointments(): boolean {
    return this.hasPermission('create', 'appointments') && 
           this.hasPermission('update', 'appointments');
  }

  public canViewBilling(): boolean {
    return this.hasPermission('read', 'billing');
  }

  public canManageUsers(): boolean {
    return this.hasPermission('manage', 'users');
  }

  // Role validation for Vietnamese healthcare
  public isHealthcareProvider(): boolean {
    return ['doctor', 'nurse'].includes(this.props.name);
  }

  public isAdministrative(): boolean {
    return ['admin', 'receptionist'].includes(this.props.name);
  }

  public isPatientRole(): boolean {
    return this.props.name === 'patient';
  }

  // Update methods
  public addPermission(permission: Permission): void {
    this.props.permissions.push(permission);
    this.props.updatedAt = new Date();
  }

  public removePermission(resource: string): void {
    this.props.permissions = this.props.permissions.filter(p => p.resource !== resource);
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public equals(other: HealthcareRole): boolean {
    return this.props.id === other.props.id;
  }
}
