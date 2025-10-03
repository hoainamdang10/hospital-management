"use strict";
/**
 * HealthcareRole Entity
 * Represents user roles in healthcare system
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareRole = void 0;
const entity_1 = require("@shared/domain/base/entity");
class HealthcareRole extends entity_1.Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(type, name, nameVietnamese, description, permissions = [], hasHIPAATraining = false) {
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
    static fromRoleType(roleType) {
        const roleMap = {
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
            type: roleType.toUpperCase(),
            name: roleData.name,
            nameVietnamese: roleData.nameVi,
            description: roleData.desc,
            permissions: roleData.permissions,
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
    get permissions() {
        return [...this.props.permissions];
    }
    get isActive() {
        return this.props.isActive;
    }
    hasHIPAATraining() {
        return this.props.hasHIPAATraining;
    }
    /**
     * Check if role has specific permission
     */
    hasPermission(action, resource) {
        const permission = `${action}:${resource}`;
        return this.props.permissions.includes('*') || this.props.permissions.includes(permission);
    }
    /**
     * Check if role is medical staff
     */
    isMedicalStaff() {
        return ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN'].includes(this.props.type);
    }
    /**
     * Check if role is administrative staff
     */
    isAdministrativeStaff() {
        return ['ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'].includes(this.props.type);
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
            permissions: this.props.permissions,
            is_active: this.props.isActive,
            has_hipaa_training: this.props.hasHIPAATraining,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}
exports.HealthcareRole = HealthcareRole;
//# sourceMappingURL=HealthcareRole.js.map