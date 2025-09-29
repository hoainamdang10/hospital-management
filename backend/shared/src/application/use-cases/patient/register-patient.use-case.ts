/**
 * Register Patient Use Case - Clean Architecture
 * Application layer use case for patient registration
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUseCase } from '../base/use-case.interface';
import { RegisterPatientCommand } from '../../../cqrs/commands/patient/register-patient.command';
import { RegisterPatientResult } from '../../../cqrs/handlers/patient/register-patient.handler';
import { IPatientRepository } from '../../../domain/repositories/patient.repository';
import { IDomainEventPublisher } from '../../../domain/events/domain-event-publisher.interface';
import { IEventStore } from '../../../infrastructure/event-store/event-store.interface';
import { Patient } from '../../../domain/aggregates/patient.aggregate';
import { PersonalInfo } from '../../../domain/value-objects/personal-info';
import { ContactInfo } from '../../../domain/value-objects/contact-info';
import { MedicalInfo } from '../../../domain/value-objects/medical-info';
import { EmergencyContact } from '../../../domain/value-objects/emergency-contact';
import { InsuranceInfo } from '../../../domain/value-objects/insurance-info';
import { IHIPAAAuditLogger } from '../../../infrastructure/audit/hipaa-audit-logger.interface';

export interface RegisterPatientRequest {
  // Personal Information
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationalId?: string;
  
  // Contact Information
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Medical Information
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Insurance Information
  insurance?: {
    provider: string;
    policyNumber: string;
    subscriberName: string;
    subscriberDateOfBirth: Date;
    relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
    effectiveDate: Date;
    expirationDate?: Date;
  };
  
  // Metadata
  userId: string;
  correlationId?: string;
}

/**
 * Register Patient Use Case
 * Orchestrates patient registration business workflow
 */
export class RegisterPatientUseCase implements IUseCase<RegisterPatientRequest, RegisterPatientResult> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly eventStore: IEventStore,
    private readonly auditLogger: IHIPAAAuditLogger
  ) {}

  /**
   * Execute patient registration use case
   */
  async execute(request: RegisterPatientRequest): Promise<RegisterPatientResult> {
    // 1. Audit logging
    await this.auditLogger.logPatientAccess({
      action: 'PATIENT_REGISTRATION_ATTEMPT',
      userId: request.userId,
      patientId: null,
      timestamp: new Date(),
      ipAddress: null,
      userAgent: null,
      details: { correlationId: request.correlationId }
    });

    try {
      // 2. Create value objects
      const personalInfo = this.createPersonalInfo(request);
      const contactInfo = this.createContactInfo(request);
      const medicalInfo = this.createMedicalInfo(request);
      const emergencyContact = request.emergencyContact 
        ? this.createEmergencyContact(request.emergencyContact)
        : undefined;
      const insuranceInfo = request.insurance
        ? this.createInsuranceInfo(request.insurance)
        : undefined;

      // 3. Create patient aggregate
      const patient = Patient.create(
        personalInfo,
        contactInfo,
        medicalInfo,
        emergencyContact,
        insuranceInfo
      );

      // 4. Validate business rules
      await this.validateBusinessRules(patient, request);

      // 5. Persist patient aggregate
      await this.patientRepository.save(patient);

      // 6. Handle domain events
      const events = patient.getUncommittedEvents();
      if (events.length > 0) {
        // Store events in event store
        await this.eventStore.saveEvents(
          patient.id,
          'Patient',
          events,
          patient.getVersion()
        );

        // Publish domain events
        for (const event of events) {
          await this.eventPublisher.publish(event);
        }

        // Mark events as committed
        patient.markEventsAsCommitted();
      }

      // 7. Success audit log
      await this.auditLogger.logPatientAccess({
        action: 'PATIENT_REGISTRATION_SUCCESS',
        userId: request.userId,
        patientId: patient.patientId.value,
        timestamp: new Date(),
        ipAddress: null,
        userAgent: null,
        details: { correlationId: request.correlationId }
      });

      return {
        patientId: patient.patientId.value,
        success: true,
        message: 'Đăng ký bệnh nhân thành công',
        fhirComplianceScore: this.calculateFHIRCompliance(patient),
        warnings: this.generateWarnings(patient)
      };

    } catch (error) {
      // Error audit log
      await this.auditLogger.logPatientAccess({
        action: 'PATIENT_REGISTRATION_FAILED',
        userId: request.userId,
        patientId: null,
        timestamp: new Date(),
        ipAddress: null,
        userAgent: null,
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          correlationId: request.correlationId 
        }
      });

      throw error;
    }
  }

  // Private helper methods
  private createPersonalInfo(request: RegisterPatientRequest): PersonalInfo {
    return PersonalInfo.create(
      request.fullName,
      request.dateOfBirth,
      request.gender,
      request.nationalId
    );
  }

  private createContactInfo(request: RegisterPatientRequest): ContactInfo {
    return ContactInfo.create(
      request.phone,
      request.email,
      request.address
    );
  }

  private createMedicalInfo(request: RegisterPatientRequest): MedicalInfo {
    return MedicalInfo.create(
      request.bloodType as any,
      request.allergies || [],
      request.chronicConditions || [],
      request.currentMedications || []
    );
  }

  private createEmergencyContact(contact: NonNullable<RegisterPatientRequest['emergencyContact']>): EmergencyContact {
    return EmergencyContact.create(
      contact.name,
      contact.relationship,
      contact.phone,
      contact.email
    );
  }

  private createInsuranceInfo(insurance: NonNullable<RegisterPatientRequest['insurance']>): InsuranceInfo {
    return InsuranceInfo.create(
      insurance.provider,
      insurance.policyNumber,
      insurance.subscriberName,
      insurance.subscriberDateOfBirth,
      insurance.relationshipToSubscriber,
      insurance.effectiveDate,
      insurance.expirationDate
    );
  }

  private async validateBusinessRules(patient: Patient, request: RegisterPatientRequest): Promise<void> {
    // Check for duplicate patients
    const existingPatient = await this.patientRepository.findByNationalId(
      request.nationalId || ''
    );
    
    if (existingPatient) {
      throw new Error('Bệnh nhân với CCCD này đã tồn tại trong hệ thống');
    }

    // Additional business rule validations...
  }

  private calculateFHIRCompliance(patient: Patient): number {
    // Calculate FHIR R4 compliance score
    let score = 0;
    
    // Required fields
    if (patient.personalInfo.fullName) score += 20;
    if (patient.personalInfo.dateOfBirth) score += 20;
    if (patient.personalInfo.gender) score += 15;
    if (patient.contactInfo.phone || patient.contactInfo.email) score += 15;
    
    // Optional but recommended fields
    if (patient.medicalInfo.bloodType) score += 10;
    if (patient.emergencyContact) score += 10;
    if (patient.insuranceInfo) score += 10;
    
    return Math.min(score, 100);
  }

  private generateWarnings(patient: Patient): string[] {
    const warnings: string[] = [];
    
    if (!patient.contactInfo.phone && !patient.contactInfo.email) {
      warnings.push('Thiếu thông tin liên lạc (điện thoại hoặc email)');
    }
    
    if (!patient.emergencyContact) {
      warnings.push('Chưa có thông tin người liên hệ khẩn cấp');
    }
    
    if (!patient.insuranceInfo) {
      warnings.push('Chưa có thông tin bảo hiểm y tế');
    }
    
    return warnings;
  }
}
