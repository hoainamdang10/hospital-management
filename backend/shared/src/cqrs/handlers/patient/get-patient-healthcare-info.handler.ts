/**
 * Get Patient Healthcare Info Query Handler - CQRS Pattern
 * Handles queries for patient healthcare information from read model
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Performance Optimization, HIPAA
 */

import { QueryHandler } from '../../base/query';
import { 
  GetPatientHealthcareInfoQuery, 
  PatientHealthcareInfoResult 
} from '../../queries/patient/get-patient-healthcare-info.query';
import { IPatientReadModelRepository } from '../../../infrastructure/read-models/patient-read-model.repository';
import { IHIPAAAuditLogger } from '../../../infrastructure/audit/hipaa-audit-logger.interface';
import { IPermissionService } from '../../../infrastructure/security/permission.service.interface';

/**
 * Get Patient Healthcare Info Query Handler
 * Retrieves patient information from optimized read models
 */
export class GetPatientHealthcareInfoHandler extends QueryHandler<
  GetPatientHealthcareInfoQuery, 
  PatientHealthcareInfoResult
> {
  constructor(
    private readonly readModelRepository: IPatientReadModelRepository,
    private readonly auditLogger: IHIPAAAuditLogger,
    private readonly permissionService: IPermissionService
  ) {
    super();
  }

  /**
   * Execute patient healthcare info query
   */
  protected async executeQuery(query: GetPatientHealthcareInfoQuery): Promise<PatientHealthcareInfoResult> {
    // Validate user permissions
    await this.validatePermissions(query);

    // Log HIPAA audit trail
    await this.logHIPAAAccess(query);

    // Get patient healthcare view from read model
    const patientView = await this.readModelRepository.getPatientHealthcareView(
      query.getPatientIdFromParams()
    );

    if (!patientView) {
      throw new Error(`Không tìm thấy thông tin bệnh nhân với ID: ${query.getPatientIdFromParams()}`);
    }

    // Build result based on requested data
    const result: PatientHealthcareInfoResult = {
      // Basic information (always included)
      patientId: patientView.patient_id,
      fullName: patientView.full_name,
      dateOfBirth: patientView.date_of_birth,
      age: this.calculateAge(patientView.date_of_birth),
      gender: patientView.gender,
      phoneNumber: patientView.phone_number,
      email: patientView.email,
      status: patientView.status,

      // Medical information (basic level)
      bloodType: patientView.blood_type,
      allergies: patientView.allergies || [],
      chronicConditions: patientView.chronic_conditions || [],
      currentMedications: this.parseCurrentMedications(patientView.current_medications),
      medicalHistory: query.includeFullMedicalHistory() ? patientView.medical_history : undefined,

      // Healthcare metrics
      totalAppointments: patientView.total_appointments,
      completedAppointments: patientView.completed_appointments,
      lastAppointmentDate: patientView.last_appointment_date,
      totalMedicalRecords: patientView.total_medical_records,
      lastMedicalRecordDate: patientView.last_medical_record_date,

      // Audit information
      lastUpdated: patientView.updated_at,
      lastSyncAt: patientView.last_sync_at,
    };

    // Add FHIR compliance if requested
    if (query.includeFHIRCompliance()) {
      result.fhirCompliance = {
        score: patientView.fhir_compliance_score,
        lastValidated: patientView.fhir_last_validated,
        status: patientView.fhir_compliance_score >= 80 ? 'compliant' : 'non_compliant',
      };
    }

    // Add emergency contact if requested
    if (query.includeEmergencyContact()) {
      result.emergencyContact = this.buildEmergencyContactInfo(patientView);
    }

    // Add insurance information if requested
    if (query.includeInsuranceDetails()) {
      result.insuranceInfo = this.buildInsuranceInfo(patientView);
    }

    // Add appointment history if requested
    if (query.includeAppointmentHistory()) {
      result.appointmentHistory = await this.getAppointmentHistory(query.getPatientIdFromParams());
    }

    return result;
  }

  /**
   * Validate user permissions for accessing patient data
   */
  private async validatePermissions(query: GetPatientHealthcareInfoQuery): Promise<void> {
    if (!query.userId) {
      throw new Error('User ID là bắt buộc để truy cập dữ liệu bệnh nhân');
    }

    const requiredPermissions = query.getRequiredPermissions();
    const hasPermissions = await this.permissionService.hasPermissions(
      query.userId,
      requiredPermissions
    );

    if (!hasPermissions) {
      throw new Error('Không có quyền truy cập dữ liệu bệnh nhân được yêu cầu');
    }

    // Additional validation for sensitive data
    const sensitivityLevel = query.getDataSensitivityLevel();
    if (sensitivityLevel === 'highly_sensitive') {
      const hasHighSensitivityAccess = await this.permissionService.hasHighSensitivityAccess(
        query.userId,
        query.getPatientIdFromParams()
      );

      if (!hasHighSensitivityAccess) {
        throw new Error('Không có quyền truy cập dữ liệu y tế nhạy cảm');
      }
    }
  }

  /**
   * Log HIPAA audit trail
   */
  private async logHIPAAAccess(query: GetPatientHealthcareInfoQuery): Promise<void> {
    const auditInfo = query.getHIPAAAuditInfo();
    
    await this.auditLogger.logDataAccess({
      userId: query.userId!,
      patientId: query.getPatientIdFromParams(),
      accessReason: auditInfo.accessReason,
      dataAccessed: auditInfo.dataAccessed,
      sensitivityLevel: auditInfo.sensitivityLevel,
      timestamp: new Date(),
      queryId: query.queryId,
      ipAddress: query.metadata?.ipAddress,
      userAgent: query.metadata?.userAgent,
    });
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Parse current medications from JSON
   */
  private parseCurrentMedications(medicationsJson: any): any[] {
    if (!medicationsJson) return [];
    
    try {
      return typeof medicationsJson === 'string' 
        ? JSON.parse(medicationsJson) 
        : medicationsJson;
    } catch (error) {
      console.warn('Failed to parse current medications JSON:', error);
      return [];
    }
  }

  /**
   * Build emergency contact information
   */
  private buildEmergencyContactInfo(patientView: any): PatientHealthcareInfoResult['emergencyContact'] {
    if (!patientView.emergency_contact_name) return undefined;

    return {
      fullName: patientView.emergency_contact_name,
      relationship: patientView.emergency_contact_relationship,
      phoneNumber: patientView.emergency_contact_phone,
      alternatePhoneNumber: patientView.emergency_contact_alternate_phone,
      email: patientView.emergency_contact_email,
    };
  }

  /**
   * Build insurance information
   */
  private buildInsuranceInfo(patientView: any): PatientHealthcareInfoResult['insuranceInfo'] {
    if (!patientView.insurance_provider) return undefined;

    return {
      provider: patientView.insurance_provider,
      policyNumber: this.maskPolicyNumber(patientView.insurance_policy_number),
      coverageType: patientView.insurance_coverage_type,
      isActive: patientView.insurance_is_active,
      expirationDate: patientView.insurance_expiration_date,
    };
  }

  /**
   * Mask policy number for privacy
   */
  private maskPolicyNumber(policyNumber: string): string {
    if (!policyNumber || policyNumber.length <= 4) return '****';
    return `****${policyNumber.slice(-4)}`;
  }

  /**
   * Get appointment history from read model
   */
  private async getAppointmentHistory(patientId: string): Promise<PatientHealthcareInfoResult['appointmentHistory']> {
    const appointmentSummary = await this.readModelRepository.getPatientAppointmentSummary(patientId);
    
    if (!appointmentSummary) {
      return {
        upcoming: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    return {
      upcoming: appointmentSummary.upcoming_appointments,
      completed: appointmentSummary.completed_appointments,
      cancelled: appointmentSummary.cancelled_appointments,
      nextAppointmentDate: appointmentSummary.next_appointment_date,
    };
  }

  /**
   * Log successful query execution with healthcare-specific metrics
   */
  protected async logQuerySuccess(query: GetPatientHealthcareInfoQuery, executionTime: number): Promise<void> {
    await super.logQuerySuccess(query, executionTime);
    
    // Additional logging for healthcare queries
    console.log('Patient healthcare info query executed successfully', {
      patientId: query.getPatientIdFromParams(),
      userId: query.userId,
      accessReason: query.getAccessReason(),
      dataRequested: {
        fullMedicalHistory: query.includeFullMedicalHistory(),
        fhirCompliance: query.includeFHIRCompliance(),
        insuranceDetails: query.includeInsuranceDetails(),
        emergencyContact: query.includeEmergencyContact(),
        appointmentHistory: query.includeAppointmentHistory(),
      },
      sensitivityLevel: query.getDataSensitivityLevel(),
      executionTime: `${executionTime}ms`,
      performanceTarget: executionTime < 200 ? 'met' : 'exceeded',
    });
  }

  /**
   * Enhanced caching for healthcare data
   */
  protected async getCachedResult(cacheKey: string): Promise<PatientHealthcareInfoResult | null> {
    // Healthcare data caching with additional validation
    const cachedResult = await super.getCachedResult(cacheKey);
    
    if (cachedResult) {
      // Validate cached data freshness for healthcare information
      const now = new Date();
      const cacheAge = now.getTime() - new Date(cachedResult.lastSyncAt).getTime();
      const maxCacheAge = 5 * 60 * 1000; // 5 minutes for healthcare data
      
      if (cacheAge > maxCacheAge) {
        // Cache is too old for healthcare data, return null to force refresh
        return null;
      }
    }
    
    return cachedResult;
  }
}
