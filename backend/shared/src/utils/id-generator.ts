// =====================================================
// UNIFIED ID GENERATOR - PRODUCTION READY
// =====================================================
// Purpose: Single source of truth for all ID generation
// Replaces 4 different ID systems across services
// =====================================================

import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Department codes mapping with Vietnamese names
export const DEPARTMENT_CODES: Record<string, string> = {
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
  'DEPT011': 'ENT',  // ENT - Khoa Tai Mũi Họng
  'DEPT012': 'PSYC', // Psychiatry - Khoa Tâm Thần
};

export const DEPARTMENT_NAMES_VI: Record<string, string> = {
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

export interface IdGenerationOptions {
  departmentId?: string;
  entityType: 'DOC' | 'PAT' | 'APT' | 'ADM' | 'MR' | 'RX';
  useDatabase?: boolean; // Use database functions vs local generation
}

// Department-based entities require departmentId
export interface DepartmentBasedIdOptions extends Omit<IdGenerationOptions, 'departmentId'> {
  departmentId: string; // Required for department-based entities
}

export class HospitalIdGenerator {
  private static supabase: any;

  static initialize(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate department-based doctor ID
   * Format: CARD-DOC-202506-001
   */
  static async generateDoctorId(departmentId: string = 'DEPT001'): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_doctor_id', {
          dept_id: departmentId
        });

        if (!error && data) {
          logger.info('Generated doctor ID via database:', { departmentId, doctorId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'DOC', departmentId });
    } catch (error) {
      logger.error('Error generating doctor ID:', error);
      throw new Error(`Failed to generate doctor ID: ${error}`);
    }
  }

  /**
   * Generate standard patient ID
   * Format: PAT-202506-001
   */
  static async generatePatientId(): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_patient_id');

        if (!error && data) {
          logger.info('Generated patient ID via database:', { patientId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'PAT' });
    } catch (error) {
      logger.error('Error generating patient ID:', error);
      throw new Error(`Failed to generate patient ID: ${error}`);
    }
  }

  /**
   * Generate department-based appointment ID
   * Format: CARD-APT-202506-001
   */
  static async generateAppointmentId(departmentId: string): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_appointment_id', {
          dept_id: departmentId
        });

        if (!error && data) {
          logger.info('Generated appointment ID via database:', { departmentId, appointmentId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'APT', departmentId });
    } catch (error) {
      logger.error('Error generating appointment ID:', error);
      throw new Error(`Failed to generate appointment ID: ${error}`);
    }
  }

  /**
   * Generate admin ID
   * Format: ADM-202506-001
   */
  static async generateAdminId(): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_admin_id');

        if (!error && data) {
          logger.info('Generated admin ID via database:', { adminId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'ADM' });
    } catch (error) {
      logger.error('Error generating admin ID:', error);
      throw new Error(`Failed to generate admin ID: ${error}`);
    }
  }

  /**
   * Generate department-based medical record ID
   * Format: CARD-MR-202506-001
   */
  static async generateMedicalRecordId(departmentId: string): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_medical_record_id', {
          dept_id: departmentId
        });

        if (!error && data) {
          logger.info('Generated medical record ID via database:', { departmentId, medicalRecordId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'MR', departmentId });
    } catch (error) {
      logger.error('Error generating medical record ID:', error);
      throw new Error(`Failed to generate medical record ID: ${error}`);
    }
  }

  /**
   * Generate department-based prescription ID
   * Format: CARD-RX-202506-001
   */
  static async generatePrescriptionId(departmentId: string): Promise<string> {
    try {
      if (this.supabase) {
        // Use database function (recommended)
        const { data, error } = await this.supabase.rpc('generate_prescription_id', {
          dept_id: departmentId
        });

        if (!error && data) {
          logger.info('Generated prescription ID via database:', { departmentId, prescriptionId: data });
          return data;
        }
      }

      // Fallback to local generation
      return this.generateLocalId({ entityType: 'RX', departmentId });
    } catch (error) {
      logger.error('Error generating prescription ID:', error);
      throw new Error(`Failed to generate prescription ID: ${error}`);
    }
  }

  /**
   * Local ID generation (fallback method)
   * Used when database functions are not available
   */
  private static generateLocalId(options: IdGenerationOptions): string {
    const { entityType, departmentId } = options;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const timestamp = Date.now().toString().slice(-3); // Last 3 digits for uniqueness

    if (departmentId && DEPARTMENT_CODES[departmentId]) {
      // Department-based ID
      const deptCode = DEPARTMENT_CODES[departmentId];
      return `${deptCode}-${entityType}-${yearMonth}-${timestamp}`;
    } else {
      // Standard ID
      return `${entityType}-${yearMonth}-${timestamp}`;
    }
  }

  /**
   * Validate ID format - Department-Based Only
   */
  static validateId(id: string, expectedType: string): boolean {
    const patterns = {
      doctor: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,
      patient: /^PAT-\d{6}-\d{3}$/,
      appointment: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,
      admin: /^ADM-\d{6}-\d{3}$/,
      medical_record: /^[A-Z]{4}-MR-\d{6}-\d{3}$/,
      prescription: /^[A-Z]{4}-RX-\d{6}-\d{3}$/
    };

    const pattern = patterns[expectedType as keyof typeof patterns];
    return pattern ? pattern.test(id) : false;
  }

  /**
   * Extract department from ID
   */
  static extractDepartment(id: string): string | null {
    const match = id.match(/^([A-Z]{4})-/);
    return match ? match[1] : null;
  }

  /**
   * Extract entity type from ID
   */
  static extractEntityType(id: string): string | null {
    const match = id.match(/-([A-Z]{2,3})-/);
    return match ? match[1] : null;
  }

  /**
   * Extract year-month from ID
   */
  static extractYearMonth(id: string): string | null {
    const match = id.match(/-(\d{6})-/);
    return match ? match[1] : null;
  }

  /**
   * Get department name from code
   */
  static getDepartmentName(deptCode: string): string {
    const deptMap: Record<string, string> = {
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

// Export for backward compatibility
export const generateDoctorId = HospitalIdGenerator.generateDoctorId;
export const generatePatientId = HospitalIdGenerator.generatePatientId;
export const generateAppointmentId = HospitalIdGenerator.generateAppointmentId;
export const generateAdminId = HospitalIdGenerator.generateAdminId;
