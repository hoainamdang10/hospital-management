/**
 * Healthcare Role Value Object - Domain Layer
 * Represents healthcare-specific roles with Vietnamese localization
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Healthcare Standards, Vietnamese Localization, RBAC
 */

export enum HealthcareRoleType {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  RADIOLOGIST = 'radiologist'
}

export interface HealthcareRoleData {
  type: HealthcareRoleType;
  name: string;
  nameVietnamese: string;
  description: string;
  descriptionVietnamese: string;
  permissions: string[];
  isActive: boolean;
  hierarchy: number; // 1 = highest authority, 10 = lowest
}

/**
 * Healthcare Role Value Object
 * Immutable representation of healthcare roles with business rules
 */
export class HealthcareRole {
  private readonly _type: HealthcareRoleType;
  private readonly _name: string;
  private readonly _nameVietnamese: string;
  private readonly _description: string;
  private readonly _descriptionVietnamese: string;
  private readonly _permissions: ReadonlyArray<string>;
  private readonly _isActive: boolean;
  private readonly _hierarchy: number;

  private constructor(data: HealthcareRoleData) {
    this.validateRoleData(data);
    
    this._type = data.type;
    this._name = data.name;
    this._nameVietnamese = data.nameVietnamese;
    this._description = data.description;
    this._descriptionVietnamese = data.descriptionVietnamese;
    this._permissions = Object.freeze([...data.permissions]);
    this._isActive = data.isActive;
    this._hierarchy = data.hierarchy;
  }

  /**
   * Create Admin Role
   */
  public static createAdmin(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.ADMIN,
      name: 'System Administrator',
      nameVietnamese: 'Quản trị viên hệ thống',
      description: 'Full system access and management capabilities',
      descriptionVietnamese: 'Quyền truy cập và quản lý toàn bộ hệ thống',
      permissions: [
        'system:*',
        'user:*',
        'role:*',
        'patient:*',
        'provider:*',
        'appointment:*',
        'medical_record:*',
        'billing:*',
        'notification:*',
        'audit:read',
        'report:*'
      ],
      isActive: true,
      hierarchy: 1
    });
  }

  /**
   * Create Doctor Role
   */
  public static createDoctor(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.DOCTOR,
      name: 'Doctor',
      nameVietnamese: 'Bác sĩ',
      description: 'Medical professional with patient care responsibilities',
      descriptionVietnamese: 'Chuyên gia y tế có trách nhiệm chăm sóc bệnh nhân',
      permissions: [
        'patient:read',
        'patient:update:assigned',
        'appointment:read:assigned',
        'appointment:update:assigned',
        'medical_record:*:assigned',
        'prescription:*:assigned',
        'lab_result:read:assigned',
        'imaging:read:assigned',
        'billing:read:assigned',
        'notification:send:patient'
      ],
      isActive: true,
      hierarchy: 2
    });
  }

  /**
   * Create Nurse Role
   */
  public static createNurse(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.NURSE,
      name: 'Nurse',
      nameVietnamese: 'Y tá',
      description: 'Healthcare professional supporting patient care',
      descriptionVietnamese: 'Chuyên viên y tế hỗ trợ chăm sóc bệnh nhân',
      permissions: [
        'patient:read',
        'patient:update:basic',
        'appointment:read:department',
        'appointment:update:status',
        'medical_record:read:assigned',
        'medical_record:update:vitals',
        'medication:administer',
        'lab_result:read:department',
        'notification:send:patient'
      ],
      isActive: true,
      hierarchy: 3
    });
  }

  /**
   * Create Patient Role
   */
  public static createPatient(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.PATIENT,
      name: 'Patient',
      nameVietnamese: 'Bệnh nhân',
      description: 'Healthcare service recipient',
      descriptionVietnamese: 'Người nhận dịch vụ chăm sóc sức khỏe',
      permissions: [
        'patient:read:own',
        'patient:update:own:basic',
        'appointment:read:own',
        'appointment:create:own',
        'appointment:cancel:own',
        'medical_record:read:own:summary',
        'prescription:read:own',
        'lab_result:read:own',
        'billing:read:own',
        'billing:pay:own',
        'notification:read:own'
      ],
      isActive: true,
      hierarchy: 8
    });
  }

  /**
   * Create Receptionist Role
   */
  public static createReceptionist(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.RECEPTIONIST,
      name: 'Receptionist',
      nameVietnamese: 'Lễ tân',
      description: 'Front desk staff managing appointments and patient check-in',
      descriptionVietnamese: 'Nhân viên lễ tân quản lý lịch hẹn và đăng ký bệnh nhân',
      permissions: [
        'patient:read',
        'patient:create',
        'patient:update:basic',
        'appointment:*',
        'provider:read:schedule',
        'billing:read',
        'billing:create:invoice',
        'notification:send:appointment'
      ],
      isActive: true,
      hierarchy: 5
    });
  }

  /**
   * Create Pharmacist Role
   */
  public static createPharmacist(): HealthcareRole {
    return new HealthcareRole({
      type: HealthcareRoleType.PHARMACIST,
      name: 'Pharmacist',
      nameVietnamese: 'Dược sĩ',
      description: 'Medication management and dispensing professional',
      descriptionVietnamese: 'Chuyên viên quản lý và phát thuốc',
      permissions: [
        'patient:read:basic',
        'prescription:read',
        'prescription:dispense',
        'medication:*',
        'drug_interaction:check',
        'inventory:medication:*',
        'billing:medication:*'
      ],
      isActive: true,
      hierarchy: 4
    });
  }

  /**
   * Validate role data
   */
  private validateRoleData(data: HealthcareRoleData): void {
    if (!data.type || !Object.values(HealthcareRoleType).includes(data.type)) {
      throw new Error(`Invalid healthcare role type: ${data.type}`);
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Healthcare role name cannot be empty');
    }

    if (!data.nameVietnamese || data.nameVietnamese.trim().length === 0) {
      throw new Error('Vietnamese role name cannot be empty');
    }

    if (!data.permissions || data.permissions.length === 0) {
      throw new Error('Healthcare role must have at least one permission');
    }

    if (data.hierarchy < 1 || data.hierarchy > 10) {
      throw new Error('Role hierarchy must be between 1 and 10');
    }

    // Validate permission format: resource:action or resource:action:scope
    const permissionPattern = /^[a-z_]+:([\*]|[a-z_]+)(:[a-z_]+)?$/;
    for (const permission of data.permissions) {
      if (!permissionPattern.test(permission)) {
        throw new Error(`Invalid permission format: ${permission}`);
      }
    }
  }

  /**
   * Check if role has specific permission
   */
  public hasPermission(permission: string): boolean {
    // Check for exact match
    if (this._permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions
    const [resource, action, scope] = permission.split(':');
    
    // Check resource:* permissions
    if (this._permissions.includes(`${resource}:*`)) {
      return true;
    }

    // Check for scoped wildcard permissions
    if (scope && this._permissions.includes(`${resource}:${action}:*`)) {
      return true;
    }

    return false;
  }

  /**
   * Check if role can access resource
   */
  public canAccessResource(resource: string): boolean {
    return this._permissions.some(permission => {
      const [permResource] = permission.split(':');
      return permResource === resource || permResource === '*';
    });
  }

  /**
   * Check if role has higher authority than another role
   */
  public hasHigherAuthorityThan(otherRole: HealthcareRole): boolean {
    return this._hierarchy < otherRole._hierarchy;
  }

  /**
   * Check if role can manage another role
   */
  public canManageRole(targetRole: HealthcareRole): boolean {
    // Admin can manage all roles
    if (this._type === HealthcareRoleType.ADMIN) {
      return true;
    }

    // Can only manage roles with lower authority
    return this.hasHigherAuthorityThan(targetRole);
  }

  /**
   * Get role for Vietnamese display
   */
  public getDisplayName(language: 'en' | 'vi' = 'vi'): string {
    return language === 'vi' ? this._nameVietnamese : this._name;
  }

  /**
   * Get role description for Vietnamese display
   */
  public getDisplayDescription(language: 'en' | 'vi' = 'vi'): string {
    return language === 'vi' ? this._descriptionVietnamese : this._description;
  }

  /**
   * Convert to plain object for serialization
   */
  public toObject(): HealthcareRoleData {
    return {
      type: this._type,
      name: this._name,
      nameVietnamese: this._nameVietnamese,
      description: this._description,
      descriptionVietnamese: this._descriptionVietnamese,
      permissions: [...this._permissions],
      isActive: this._isActive,
      hierarchy: this._hierarchy
    };
  }

  /**
   * Create role from plain object
   */
  public static fromObject(data: HealthcareRoleData): HealthcareRole {
    return new HealthcareRole(data);
  }

  /**
   * Get all predefined healthcare roles
   */
  public static getAllPredefinedRoles(): HealthcareRole[] {
    return [
      HealthcareRole.createAdmin(),
      HealthcareRole.createDoctor(),
      HealthcareRole.createNurse(),
      HealthcareRole.createReceptionist(),
      HealthcareRole.createPharmacist(),
      HealthcareRole.createPatient()
    ];
  }

  // Getters
  public get type(): HealthcareRoleType { return this._type; }
  public get name(): string { return this._name; }
  public get nameVietnamese(): string { return this._nameVietnamese; }
  public get description(): string { return this._description; }
  public get descriptionVietnamese(): string { return this._descriptionVietnamese; }
  public get permissions(): ReadonlyArray<string> { return this._permissions; }
  public get isActive(): boolean { return this._isActive; }
  public get hierarchy(): number { return this._hierarchy; }

  /**
   * Equality comparison
   */
  public equals(other: HealthcareRole): boolean {
    return this._type === other._type &&
           this._name === other._name &&
           this._hierarchy === other._hierarchy;
  }

  /**
   * String representation
   */
  public toString(): string {
    return `HealthcareRole(${this._type}: ${this._nameVietnamese})`;
  }
}
