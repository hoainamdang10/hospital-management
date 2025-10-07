"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareRole = void 0;
const entity_1 = require("@shared/domain/base/entity");
class HealthcareRole extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(type, name, nameVietnamese, description, hasHIPAATraining = false) {
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
    static fromRoleType(roleType) {
        const roleMap = {
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
            type: roleType.toUpperCase(),
            name: roleData.name,
            nameVietnamese: roleData.nameVi,
            description: roleData.desc,
            isActive: true,
            hasHIPAATraining: roleData.hipaa
        });
    }
    // Getters
    get type() {
        return this.props.type;
    }
    get name() {
        return this.props.name;
    }
    get nameVietnamese() {
        return this.props.nameVietnamese;
    }
    get description() {
        return this.props.description;
    }
    get isActive() {
        return this.props.isActive;
    }
    hasHIPAATraining() {
        return this.props.hasHIPAATraining;
    }
    /**
     * Check if role is medical staff
     */
    isMedicalStaff() {
        return ['DOCTOR', 'NURSE'].includes(this.props.type);
    }
    /**
     * Check if role is administrative staff
     */
    isAdministrativeStaff() {
        return ['ADMIN', 'RECEPTIONIST'].includes(this.props.type);
    }
    /**
     * Check if role is Vietnamese healthcare role
     */
    isVietnameseHealthcareRole() {
        return this.props.nameVietnamese !== undefined && this.props.nameVietnamese.length > 0;
    }
    /**
     * Validate entity state - required by Entity base class
     */
    validate() {
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
    toPersistence() {
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
exports.HealthcareRole = HealthcareRole;
//# sourceMappingURL=HealthcareRole.js.map