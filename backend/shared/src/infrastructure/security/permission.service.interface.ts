/**
 * Permission Service Interface - Security Infrastructure
 * Interface for role-based access control and permissions
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance RBAC, HIPAA, Healthcare Security
 */

/**
 * User Permission Interface
 */
export interface UserPermission {
  permissionId: string;
  permissionName: string;
  permissionType: 'read' | 'write' | 'delete' | 'admin';
  resourceType: string;
  resourceId?: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  conditions?: PermissionCondition[];
}

/**
 * Permission Condition Interface
 */
export interface PermissionCondition {
  conditionType: 'time_based' | 'location_based' | 'role_based' | 'patient_relationship' | 'department_based';
  conditionValue: any;
  isActive: boolean;
}

/**
 * Role Definition Interface
 */
export interface RoleDefinition {
  roleId: string;
  roleName: string;
  roleType: 'system' | 'clinical' | 'administrative' | 'technical';
  description: string;
  permissions: string[];
  inheritsFrom?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Role Assignment Interface
 */
export interface UserRoleAssignment {
  assignmentId: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  isActive: boolean;
  context?: {
    departmentId?: string;
    facilityId?: string;
    specialtyId?: string;
  };
}

/**
 * Permission Check Result Interface
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  grantedPermissions: string[];
  deniedPermissions: string[];
  reason?: string;
  conditions?: PermissionCondition[];
  expiresAt?: Date;
}

/**
 * Healthcare-Specific Permission Context
 */
export interface HealthcarePermissionContext {
  patientId?: string;
  departmentId?: string;
  facilityId?: string;
  appointmentId?: string;
  medicalRecordId?: string;
  emergencyOverride?: boolean;
  supervisorApproval?: {
    supervisorId: string;
    approvedAt: Date;
    reason: string;
  };
}

/**
 * Permission Service Interface
 */
export interface IPermissionService {
  /**
   * Check if user has specific permission
   */
  hasPermission(
    userId: string,
    permission: string,
    resourceId?: string,
    context?: HealthcarePermissionContext
  ): Promise<boolean>;

  /**
   * Check if user has multiple permissions
   */
  hasPermissions(
    userId: string,
    permissions: string[],
    resourceId?: string,
    context?: HealthcarePermissionContext
  ): Promise<boolean>;

  /**
   * Get detailed permission check result
   */
  checkPermissions(
    userId: string,
    permissions: string[],
    resourceId?: string,
    context?: HealthcarePermissionContext
  ): Promise<PermissionCheckResult>;

  /**
   * Get all permissions for user
   */
  getUserPermissions(userId: string): Promise<UserPermission[]>;

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Promise<UserRoleAssignment[]>;

  /**
   * Grant permission to user
   */
  grantPermission(
    userId: string,
    permission: string,
    grantedBy: string,
    resourceId?: string,
    expiresAt?: Date,
    conditions?: PermissionCondition[]
  ): Promise<void>;

  /**
   * Revoke permission from user
   */
  revokePermission(
    userId: string,
    permission: string,
    revokedBy: string,
    resourceId?: string
  ): Promise<void>;

  /**
   * Assign role to user
   */
  assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    context?: UserRoleAssignment['context'],
    expiresAt?: Date
  ): Promise<void>;

  /**
   * Remove role from user
   */
  removeRole(
    userId: string,
    roleId: string,
    removedBy: string
  ): Promise<void>;

  /**
   * Check if user has high sensitivity data access
   */
  hasHighSensitivityAccess(
    userId: string,
    patientId: string
  ): Promise<boolean>;

  /**
   * Check patient-provider relationship
   */
  hasPatientRelationship(
    userId: string,
    patientId: string
  ): Promise<{
    hasRelationship: boolean;
    relationshipType?: 'primary_care' | 'specialist' | 'consulting' | 'emergency' | 'administrative';
    establishedAt?: Date;
    isActive: boolean;
  }>;

  /**
   * Get emergency override permissions
   */
  getEmergencyOverridePermissions(
    userId: string,
    justification: string
  ): Promise<{
    granted: boolean;
    permissions: string[];
    expiresAt: Date;
    overrideId: string;
  }>;

  /**
   * Validate supervisor approval
   */
  validateSupervisorApproval(
    userId: string,
    supervisorId: string,
    requestedPermissions: string[],
    reason: string
  ): Promise<{
    approved: boolean;
    approvalId?: string;
    validUntil?: Date;
  }>;
}

/**
 * Role Management Service Interface
 */
export interface IRoleManagementService {
  /**
   * Create new role
   */
  createRole(
    roleName: string,
    roleType: RoleDefinition['roleType'],
    description: string,
    permissions: string[],
    createdBy: string,
    inheritsFrom?: string[]
  ): Promise<RoleDefinition>;

  /**
   * Update role
   */
  updateRole(
    roleId: string,
    updates: Partial<RoleDefinition>,
    updatedBy: string
  ): Promise<RoleDefinition>;

  /**
   * Delete role
   */
  deleteRole(roleId: string, deletedBy: string): Promise<void>;

  /**
   * Get role by ID
   */
  getRole(roleId: string): Promise<RoleDefinition | null>;

  /**
   * Get all roles
   */
  getAllRoles(): Promise<RoleDefinition[]>;

  /**
   * Get roles by type
   */
  getRolesByType(roleType: RoleDefinition['roleType']): Promise<RoleDefinition[]>;

  /**
   * Get effective permissions for role (including inherited)
   */
  getEffectivePermissions(roleId: string): Promise<string[]>;

  /**
   * Validate role hierarchy
   */
  validateRoleHierarchy(roleId: string, inheritsFrom: string[]): Promise<{
    isValid: boolean;
    circularDependencies?: string[];
    invalidRoles?: string[];
  }>;
}

/**
 * Healthcare-Specific Permission Definitions
 */
export const HEALTHCARE_PERMISSIONS = {
  // Patient data permissions
  READ_PATIENT_BASIC_INFO: 'read_patient_basic_info',
  READ_PATIENT_MEDICAL_HISTORY: 'read_patient_medical_history',
  READ_PATIENT_INSURANCE: 'read_patient_insurance',
  READ_PATIENT_EMERGENCY_CONTACT: 'read_patient_emergency_contact',
  READ_PATIENT_FHIR_COMPLIANCE: 'read_patient_fhir_compliance',
  READ_PATIENT_APPOINTMENTS: 'read_patient_appointments',
  
  WRITE_PATIENT_BASIC_INFO: 'write_patient_basic_info',
  WRITE_PATIENT_MEDICAL_HISTORY: 'write_patient_medical_history',
  WRITE_PATIENT_INSURANCE: 'write_patient_insurance',
  WRITE_PATIENT_EMERGENCY_CONTACT: 'write_patient_emergency_contact',
  
  // Medical records permissions
  READ_MEDICAL_RECORDS: 'read_medical_records',
  WRITE_MEDICAL_RECORDS: 'write_medical_records',
  DELETE_MEDICAL_RECORDS: 'delete_medical_records',
  
  // Appointment permissions
  READ_APPOINTMENTS: 'read_appointments',
  CREATE_APPOINTMENTS: 'create_appointments',
  UPDATE_APPOINTMENTS: 'update_appointments',
  CANCEL_APPOINTMENTS: 'cancel_appointments',
  
  // Administrative permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  GENERATE_REPORTS: 'generate_reports',
  
  // Emergency permissions
  EMERGENCY_ACCESS: 'emergency_access',
  BREAK_GLASS_ACCESS: 'break_glass_access',
  
  // System permissions
  SYSTEM_ADMIN: 'system_admin',
  DATABASE_ACCESS: 'database_access',
  BACKUP_RESTORE: 'backup_restore',
} as const;

/**
 * Healthcare Role Definitions
 */
export const HEALTHCARE_ROLES = {
  // Clinical roles
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  SPECIALIST: 'specialist',
  RESIDENT: 'resident',
  MEDICAL_STUDENT: 'medical_student',
  
  // Administrative roles
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  MEDICAL_RECORDS_CLERK: 'medical_records_clerk',
  BILLING_SPECIALIST: 'billing_specialist',
  
  // Technical roles
  SYSTEM_ADMIN: 'system_admin',
  IT_SUPPORT: 'it_support',
  DATA_ANALYST: 'data_analyst',
  
  // Patient role
  PATIENT: 'patient',
} as const;

/**
 * Permission Service Configuration
 */
export interface PermissionServiceConfig {
  connectionString: string;
  schema: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  enableAuditLogging: boolean;
  enableEmergencyOverride: boolean;
  emergencyOverrideDuration: number; // minutes
  supervisorApprovalRequired: boolean;
  supervisorApprovalDuration: number; // minutes
  enableBreakGlassAccess: boolean;
  breakGlassJustificationRequired: boolean;
}

/**
 * Permission Service Factory
 */
export interface IPermissionServiceFactory {
  create(config: PermissionServiceConfig): IPermissionService;
  createRoleManagement(config: PermissionServiceConfig): IRoleManagementService;
}
