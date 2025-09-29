"use strict";
// =====================================================
// UNIFIED ID GENERATOR - PRODUCTION READY
// =====================================================
// Purpose: Single source of truth for all ID generation
// Replaces 4 different ID systems across services
// =====================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAdminId = exports.generateAppointmentId = exports.generatePatientId = exports.generateDoctorId = exports.HospitalIdGenerator = exports.DEPARTMENT_NAMES_VI = exports.DEPARTMENT_CODES = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("./logger"));
// Department codes mapping with Vietnamese names
exports.DEPARTMENT_CODES = {
    'DEPT001': 'CARD', // Cardiology - Khoa Tim Mạch
    'DEPT002': 'ORTH', // Orthopedics - Khoa Chấn Thương Chỉnh Hình
    'DEPT003': 'PEDI', // Pediatrics - Khoa Nhi
    'DEPT004': 'NEUR', // Neurology - Khoa Thần Kinh
    'DEPT005': 'DERM', // Dermatology - Khoa Da Liễu
    'DEPT006': 'GYNE', // Gynecology - Khoa Phụ Sản
    'DEPT007': 'EMER', // Emergency - Khoa Cấp Cứu
    'DEPT008': 'GENE', // General Medicine - Khoa Nội Tổng Hợp
    'DEPT009': 'SURG', // Surgery - Khoa Ngoại Tổng Hợp
    'DEPT010': 'OPHT', // Ophthalmology - Khoa Mắt
    'DEPT011': 'ENT', // ENT - Khoa Tai Mũi Họng
    'DEPT012': 'PSYC', // Psychiatry - Khoa Tâm Thần
};
exports.DEPARTMENT_NAMES_VI = {
    'DEPT001': 'Khoa Tim Mạch',
    'DEPT002': 'Khoa Chấn Thương Chỉnh Hình',
    'DEPT003': 'Khoa Nhi',
    'DEPT004': 'Khoa Thần Kinh',
    'DEPT005': 'Khoa Da Liễu',
    'DEPT006': 'Khoa Phụ Sản',
    'DEPT007': 'Khoa Cấp Cứu',
    'DEPT008': 'Khoa Nội Tổng Hợp',
    'DEPT009': 'Khoa Ngoại Tổng Hợp',
    'DEPT010': 'Khoa Mắt',
    'DEPT011': 'Khoa Tai Mũi Họng',
    'DEPT012': 'Khoa Tâm Thần',
};
class HospitalIdGenerator {
    static initialize(supabaseUrl, supabaseKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    /**
     * Generate department-based doctor ID
     * Format: CARD-DOC-202506-001
     */
    static async generateDoctorId(departmentId = 'DEPT001') {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_doctor_id', {
                    dept_id: departmentId
                });
                if (!error && data) {
                    logger_1.default.info('Generated doctor ID via database:', { departmentId, doctorId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'DOC', departmentId });
        }
        catch (error) {
            logger_1.default.error('Error generating doctor ID:', error);
            throw new Error(`Failed to generate doctor ID: ${error}`);
        }
    }
    /**
     * Generate standard patient ID
     * Format: PAT-202506-001
     */
    static async generatePatientId() {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_patient_id');
                if (!error && data) {
                    logger_1.default.info('Generated patient ID via database:', { patientId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'PAT' });
        }
        catch (error) {
            logger_1.default.error('Error generating patient ID:', error);
            throw new Error(`Failed to generate patient ID: ${error}`);
        }
    }
    /**
     * Generate department-based appointment ID
     * Format: CARD-APT-202506-001
     */
    static async generateAppointmentId(departmentId) {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_appointment_id', {
                    dept_id: departmentId
                });
                if (!error && data) {
                    logger_1.default.info('Generated appointment ID via database:', { departmentId, appointmentId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'APT', departmentId });
        }
        catch (error) {
            logger_1.default.error('Error generating appointment ID:', error);
            throw new Error(`Failed to generate appointment ID: ${error}`);
        }
    }
    /**
     * Generate admin ID
     * Format: ADM-202506-001
     */
    static async generateAdminId() {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_admin_id');
                if (!error && data) {
                    logger_1.default.info('Generated admin ID via database:', { adminId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'ADM' });
        }
        catch (error) {
            logger_1.default.error('Error generating admin ID:', error);
            throw new Error(`Failed to generate admin ID: ${error}`);
        }
    }
    /**
     * Generate department-based medical record ID
     * Format: CARD-MR-202506-001
     */
    static async generateMedicalRecordId(departmentId) {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_medical_record_id', {
                    dept_id: departmentId
                });
                if (!error && data) {
                    logger_1.default.info('Generated medical record ID via database:', { departmentId, medicalRecordId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'MR', departmentId });
        }
        catch (error) {
            logger_1.default.error('Error generating medical record ID:', error);
            throw new Error(`Failed to generate medical record ID: ${error}`);
        }
    }
    /**
     * Generate department-based prescription ID
     * Format: CARD-RX-202506-001
     */
    static async generatePrescriptionId(departmentId) {
        try {
            if (this.supabase) {
                // Use database function (recommended)
                const { data, error } = await this.supabase.rpc('generate_prescription_id', {
                    dept_id: departmentId
                });
                if (!error && data) {
                    logger_1.default.info('Generated prescription ID via database:', { departmentId, prescriptionId: data });
                    return data;
                }
            }
            // Fallback to local generation
            return this.generateLocalId({ entityType: 'RX', departmentId });
        }
        catch (error) {
            logger_1.default.error('Error generating prescription ID:', error);
            throw new Error(`Failed to generate prescription ID: ${error}`);
        }
    }
    /**
     * Local ID generation (fallback method)
     * Used when database functions are not available
     */
    static generateLocalId(options) {
        const { entityType, departmentId } = options;
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const timestamp = Date.now().toString().slice(-3); // Last 3 digits for uniqueness
        if (departmentId && exports.DEPARTMENT_CODES[departmentId]) {
            // Department-based ID
            const deptCode = exports.DEPARTMENT_CODES[departmentId];
            return `${deptCode}-${entityType}-${yearMonth}-${timestamp}`;
        }
        else {
            // Standard ID
            return `${entityType}-${yearMonth}-${timestamp}`;
        }
    }
    /**
     * Validate ID format - Department-Based Only
     */
    static validateId(id, expectedType) {
        const patterns = {
            doctor: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,
            patient: /^PAT-\d{6}-\d{3}$/,
            appointment: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,
            admin: /^ADM-\d{6}-\d{3}$/,
            medical_record: /^[A-Z]{4}-MR-\d{6}-\d{3}$/,
            prescription: /^[A-Z]{4}-RX-\d{6}-\d{3}$/
        };
        const pattern = patterns[expectedType];
        return pattern ? pattern.test(id) : false;
    }
    /**
     * Extract department from ID
     */
    static extractDepartment(id) {
        const match = id.match(/^([A-Z]{4})-/);
        return match ? match[1] : null;
    }
    /**
     * Extract entity type from ID
     */
    static extractEntityType(id) {
        const match = id.match(/-([A-Z]{2,3})-/);
        return match ? match[1] : null;
    }
    /**
     * Extract year-month from ID
     */
    static extractYearMonth(id) {
        const match = id.match(/-(\d{6})-/);
        return match ? match[1] : null;
    }
    /**
     * Get department name from code
     */
    static getDepartmentName(deptCode) {
        const deptMap = {
            'CARD': 'Cardiology',
            'ORTH': 'Orthopedics',
            'PEDI': 'Pediatrics',
            'NEUR': 'Neurology',
            'DERM': 'Dermatology',
            'GYNE': 'Gynecology',
            'EMER': 'Emergency',
            'GENE': 'General Medicine'
        };
        return deptMap[deptCode] || 'Unknown Department';
    }
}
exports.HospitalIdGenerator = HospitalIdGenerator;
// Export for backward compatibility
exports.generateDoctorId = HospitalIdGenerator.generateDoctorId;
exports.generatePatientId = HospitalIdGenerator.generatePatientId;
exports.generateAppointmentId = HospitalIdGenerator.generateAppointmentId;
exports.generateAdminId = HospitalIdGenerator.generateAdminId;
//# sourceMappingURL=id-generator.js.map