/**
 * Doctor Registered Event - Domain Layer
 * Healthcare domain event for inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Event Sourcing, Inter-service Communication
 */

import { HealthcareDomainEvent } from '../../../shared/domain/base/domain-event';
import { DoctorId, MedicalDepartment } from '../value-objects/doctor-id';
import { PersonalInfo } from '../aggregates/doctor.aggregate';
import { MedicalCredentials, Specialization } from '../value-objects/medical-credentials';

export interface DoctorRegisteredEventData {
  doctorId: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationalId: string;
    phone: string;
    email: string;
    address: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
  };
  credentials: {
    medicalLicenseNumber: string;
    licenseType: string;
    specializations: string[];
    educationLevel: string;
    medicalSchool: string;
    graduationYear: number;
    yearsOfExperience: number;
    isLicenseValid: boolean;
    licenseExpirationDate: string;
  };
  department: string;
  departmentNameVietnamese: string;
  registrationDate: string;
  registeredBy: string;
  competencyScore: number;
  capabilities: {
    canPrescribeMedication: boolean;
    canPerformSurgery: boolean;
    canTreatPatients: boolean;
    canOrderTests: boolean;
    canWorkIndependently: boolean;
    emergencyResponseCapable: boolean;
    nightShiftEligible: boolean;
    weekendWorkEligible: boolean;
    maxPatientsPerShift: number;
  };
  integrationEvents: {
    // Events for other services
    createUserAccount: {
      userId: string;
      email: string;
      role: 'doctor';
      permissions: string[];
      department: string;
    };
    setupScheduling: {
      providerId: string;
      department: string;
      specializations: string[];
      availability: {
        canWorkNightShifts: boolean;
        canWorkWeekends: boolean;
        emergencyAvailability: boolean;
      };
    };
    initializeNotifications: {
      providerId: string;
      email: string;
      phone: string;
      preferredLanguage: 'vi';
      notificationTypes: string[];
    };
  };
}

/**
 * Doctor Registered Domain Event
 * Raised when a new doctor is successfully registered in the system
 * Triggers integration events for other services
 */
export class DoctorRegisteredEvent extends HealthcareDomainEvent {
  constructor(
    doctorId: string,
    eventData: DoctorRegisteredEventData,
    userId: string,
    correlationId?: string
  ) {
    super(
      'DoctorRegistered',
      doctorId,
      'Doctor',
      eventData,
      1,
      correlationId,
      undefined,
      userId,
      {
        source: 'provider-staff-service',
        priority: 'high',
        publishExternal: true,
        retryable: true,
        complianceLevel: 'HIPAA',
        tags: ['doctor', 'registration', 'healthcare', 'provider', 'inter-service']
      }
    );
  }

  /**
   * Create from Doctor aggregate data
   */
  public static create(
    doctorId: DoctorId,
    personalInfo: PersonalInfo,
    credentials: MedicalCredentials,
    department: MedicalDepartment,
    registrationDate: Date,
    registeredBy: string,
    correlationId?: string
  ): DoctorRegisteredEvent {
    const eventData: DoctorRegisteredEventData = {
      doctorId: doctorId.value,
      personalInfo: {
        fullName: personalInfo.fullName,
        dateOfBirth: personalInfo.dateOfBirth.toISOString(),
        gender: personalInfo.gender,
        nationalId: personalInfo.nationalId,
        phone: personalInfo.phone,
        email: personalInfo.email,
        address: personalInfo.address,
        emergencyContact: personalInfo.emergencyContact
      },
      credentials: {
        medicalLicenseNumber: credentials.medicalLicenseNumber,
        licenseType: credentials.licenseType,
        specializations: credentials.specializations,
        educationLevel: credentials.educationLevel,
        medicalSchool: credentials.medicalSchool,
        graduationYear: credentials.graduationYear,
        yearsOfExperience: credentials.getYearsOfExperience(),
        isLicenseValid: credentials.isLicenseValid(),
        licenseExpirationDate: credentials.expirationDate.toISOString()
      },
      department: department,
      departmentNameVietnamese: doctorId.getDepartmentNameVietnamese(),
      registrationDate: registrationDate.toISOString(),
      registeredBy,
      competencyScore: DoctorRegisteredEvent.calculateCompetencyScore(credentials),
      capabilities: DoctorRegisteredEvent.getDoctorCapabilities(credentials),
      integrationEvents: DoctorRegisteredEvent.generateIntegrationEvents(
        doctorId,
        personalInfo,
        credentials,
        department
      )
    };

    return new DoctorRegisteredEvent(
      doctorId.value,
      eventData,
      registeredBy,
      correlationId
    );
  }

  /**
   * Get event data
   */
  public getEventData(): DoctorRegisteredEventData {
    return this.eventData as DoctorRegisteredEventData;
  }

  /**
   * Get doctor ID from event
   */
  public getDoctorId(): string {
    return this.getEventData().doctorId;
  }

  /**
   * Get department
   */
  public getDepartment(): string {
    return this.getEventData().department;
  }

  /**
   * Get specializations
   */
  public getSpecializations(): string[] {
    return this.getEventData().credentials.specializations;
  }

  /**
   * Get competency score
   */
  public getCompetencyScore(): number {
    return this.getEventData().competencyScore;
  }

  /**
   * Check if doctor can perform surgery
   */
  public canPerformSurgery(): boolean {
    return this.getEventData().capabilities.canPerformSurgery;
  }

  /**
   * Check if doctor is emergency capable
   */
  public isEmergencyCapable(): boolean {
    return this.getEventData().capabilities.emergencyResponseCapable;
  }

  /**
   * Get integration events for other services
   */
  public getIntegrationEvents(): DoctorRegisteredEventData['integrationEvents'] {
    return this.getEventData().integrationEvents;
  }

  /**
   * Get user account creation event
   */
  public getUserAccountCreationEvent(): DoctorRegisteredEventData['integrationEvents']['createUserAccount'] {
    return this.getEventData().integrationEvents.createUserAccount;
  }

  /**
   * Get scheduling setup event
   */
  public getSchedulingSetupEvent(): DoctorRegisteredEventData['integrationEvents']['setupScheduling'] {
    return this.getEventData().integrationEvents.setupScheduling;
  }

  /**
   * Get notification initialization event
   */
  public getNotificationInitEvent(): DoctorRegisteredEventData['integrationEvents']['initializeNotifications'] {
    return this.getEventData().integrationEvents.initializeNotifications;
  }

  /**
   * Check if doctor is senior (>= 10 years experience)
   */
  public isSeniorDoctor(): boolean {
    return this.getEventData().credentials.yearsOfExperience >= 10;
  }

  /**
   * Check if doctor is junior (< 5 years experience)
   */
  public isJuniorDoctor(): boolean {
    return this.getEventData().credentials.yearsOfExperience < 5;
  }

  /**
   * Check if doctor needs mentoring
   */
  public needsMentoring(): boolean {
    return this.isJuniorDoctor() || this.getCompetencyScore() < 70;
  }

  /**
   * Get recommended mentor criteria
   */
  public getMentorCriteria(): {
    department: string;
    specializations: string[];
    minimumExperience: number;
    minimumCompetencyScore: number;
  } {
    return {
      department: this.getDepartment(),
      specializations: this.getSpecializations(),
      minimumExperience: 10,
      minimumCompetencyScore: 80
    };
  }

  /**
   * Generate patient assignment recommendations
   */
  public getPatientAssignmentRecommendations(): {
    maxPatientsPerShift: number;
    patientTypes: string[];
    supervisionRequired: boolean;
    restrictions: string[];
  } {
    const capabilities = this.getEventData().capabilities;
    const isJunior = this.isJuniorDoctor();
    const competencyScore = this.getCompetencyScore();

    return {
      maxPatientsPerShift: isJunior ? Math.floor(capabilities.maxPatientsPerShift * 0.7) : capabilities.maxPatientsPerShift,
      patientTypes: this.getRecommendedPatientTypes(),
      supervisionRequired: isJunior || competencyScore < 70,
      restrictions: this.getPatientRestrictions()
    };
  }

  /**
   * Private helper methods
   */

  private static calculateCompetencyScore(credentials: MedicalCredentials): number {
    let score = 0;

    // Base score from education level
    switch (credentials.educationLevel) {
      case 'professor':
        score += 50;
        break;
      case 'phd_medicine':
        score += 40;
        break;
      case 'doctor_medicine':
        score += 30;
        break;
      case 'master_medicine':
        score += 20;
        break;
      default:
        score += 10;
    }

    // Experience bonus
    const experience = credentials.getYearsOfExperience();
    score += Math.min(experience * 2, 30);

    // Specialization bonus
    score += credentials.specializations.length * 5;

    // Valid certifications bonus
    score += credentials.getValidCertifications().length * 2;

    return Math.min(score, 100);
  }

  private static getDoctorCapabilities(credentials: MedicalCredentials): DoctorRegisteredEventData['capabilities'] {
    return {
      canPrescribeMedication: true,
      canPerformSurgery: credentials.canPerformSurgery(),
      canTreatPatients: true,
      canOrderTests: true,
      canWorkIndependently: true,
      emergencyResponseCapable: credentials.canWorkInEmergency(),
      nightShiftEligible: true,
      weekendWorkEligible: true,
      maxPatientsPerShift: 20
    };
  }

  private static generateIntegrationEvents(
    doctorId: DoctorId,
    personalInfo: PersonalInfo,
    credentials: MedicalCredentials,
    department: MedicalDepartment
  ): DoctorRegisteredEventData['integrationEvents'] {
    return {
      createUserAccount: {
        userId: doctorId.value,
        email: personalInfo.email,
        role: 'doctor',
        permissions: [
          'read_patients',
          'write_patients',
          'read_medical_records',
          'write_medical_records',
          'prescribe_medication',
          'order_tests',
          'schedule_appointments'
        ],
        department: department
      },
      setupScheduling: {
        providerId: doctorId.value,
        department: department,
        specializations: credentials.specializations,
        availability: {
          canWorkNightShifts: true,
          canWorkWeekends: true,
          emergencyAvailability: credentials.canWorkInEmergency()
        }
      },
      initializeNotifications: {
        providerId: doctorId.value,
        email: personalInfo.email,
        phone: personalInfo.phone,
        preferredLanguage: 'vi',
        notificationTypes: [
          'appointment_reminders',
          'schedule_changes',
          'emergency_alerts',
          'system_notifications',
          'patient_updates'
        ]
      }
    };
  }

  private getRecommendedPatientTypes(): string[] {
    const specializations = this.getSpecializations();
    const patientTypes: string[] = [];

    if (specializations.includes(Specialization.PEDIATRICS)) {
      patientTypes.push('pediatric');
    }

    if (specializations.includes(Specialization.EMERGENCY_MEDICINE)) {
      patientTypes.push('emergency', 'trauma');
    }

    if (specializations.includes(Specialization.SURGERY)) {
      patientTypes.push('surgical', 'pre_operative', 'post_operative');
    }

    if (specializations.includes(Specialization.INTERNAL_MEDICINE)) {
      patientTypes.push('internal_medicine', 'chronic_conditions');
    }

    if (specializations.includes(Specialization.CARDIOLOGY)) {
      patientTypes.push('cardiac', 'cardiovascular');
    }

    // Default for general practitioners
    if (patientTypes.length === 0) {
      patientTypes.push('general', 'outpatient', 'routine_checkup');
    }

    return patientTypes;
  }

  private getPatientRestrictions(): string[] {
    const restrictions: string[] = [];
    const isJunior = this.isJuniorDoctor();
    const competencyScore = this.getCompetencyScore();

    if (isJunior) {
      restrictions.push('Cần giám sát cho bệnh nhân phức tạp');
      restrictions.push('Không được thực hiện phẫu thuật lớn một mình');
    }

    if (competencyScore < 70) {
      restrictions.push('Cần đánh giá năng lực trước khi phân công');
      restrictions.push('Giới hạn số lượng bệnh nhân mỗi ca');
    }

    if (!this.canPerformSurgery()) {
      restrictions.push('Không được thực hiện phẫu thuật');
    }

    if (!this.isEmergencyCapable()) {
      restrictions.push('Không được phân công ca cấp cứu');
    }

    return restrictions;
  }

  /**
   * Convert to integration event format for message queue
   */
  public toIntegrationEventFormat(): any {
    return {
      eventType: 'DoctorRegistered',
      eventVersion: '1.0',
      source: 'provider-staff-service',
      timestamp: this.occurredAt.toISOString(),
      correlationId: this.correlationId,
      data: this.getEventData(),
      metadata: {
        userId: this.userId,
        aggregateId: this.aggregateId,
        aggregateType: this.aggregateType,
        eventId: this.eventId,
        priority: 'high',
        retryable: true
      }
    };
  }

  /**
   * Create from JSON (for event sourcing)
   */
  public static fromJSON(data: any): DoctorRegisteredEvent {
    return new DoctorRegisteredEvent(
      data.aggregateId,
      data.eventData,
      data.userId,
      data.correlationId
    );
  }

  /**
   * Get event routing key for message queue
   */
  public getRoutingKey(): string {
    const department = this.getDepartment().toLowerCase();
    const isEmergency = this.isEmergencyCapable() ? 'emergency' : 'regular';
    const experience = this.isSeniorDoctor() ? 'senior' : this.isJuniorDoctor() ? 'junior' : 'mid';
    
    return `doctor.registered.${department}.${isEmergency}.${experience}`;
  }

  /**
   * Get event headers for message queue
   */
  public getEventHeaders(): Record<string, any> {
    return {
      'event-type': 'DoctorRegistered',
      'event-version': '1.0',
      'source-service': 'provider-staff-service',
      'correlation-id': this.correlationId,
      'user-id': this.userId,
      'department': this.getDepartment(),
      'competency-score': this.getCompetencyScore().toString(),
      'emergency-capable': this.isEmergencyCapable().toString(),
      'surgery-capable': this.canPerformSurgery().toString(),
      'experience-level': this.isSeniorDoctor() ? 'senior' : this.isJuniorDoctor() ? 'junior' : 'mid',
      'priority': 'high',
      'content-type': 'application/json',
      'timestamp': this.occurredAt.toISOString()
    };
  }
}
