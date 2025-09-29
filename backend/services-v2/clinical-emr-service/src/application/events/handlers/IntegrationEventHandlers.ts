/**
 * IntegrationEventHandlers - Application Layer
 * Event handlers for processing integration events from Clinical EMR Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */

import { IDomainEventHandler } from '../../../../shared/domain/events/IDomainEventHandler';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';

// Integration Events
import { 
  MedicalRecordCompletedEvent,
  MedicalRecordUpdatedForBillingEvent,
  InsuranceVerificationRequiredEvent,
  PaymentRequiredEvent
} from '../integration/BillingIntegrationEvents';

import {
  AppointmentCompletedEvent,
  FollowUpAppointmentRequiredEvent,
  ReferralRequiredEvent,
  AppointmentNoShowEvent
} from '../integration/AppointmentIntegrationEvents';

import {
  MedicalRecordNotificationEvent,
  CriticalAlertNotificationEvent,
  MedicationReminderNotificationEvent,
  TestResultsNotificationEvent
} from '../integration/NotificationIntegrationEvents';

// Domain Events
import { MedicalRecordCreatedEvent } from '../../domain/events/MedicalRecordCreatedEvent';
import { MedicalRecordUpdatedEvent } from '../../domain/events/MedicalRecordUpdatedEvent';
import { DiagnosisAddedEvent } from '../../domain/events/DiagnosisAddedEvent';
import { MedicationAddedEvent } from '../../domain/events/MedicationAddedEvent';

/**
 * Medical Record Created Event Handler
 * Handles when a new medical record is created
 */
export class MedicalRecordCreatedEventHandler implements IDomainEventHandler<MedicalRecordCreatedEvent> {
  
  constructor(
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {}

  async handle(event: MedicalRecordCreatedEvent): Promise<void> {
    try {
      // Get the full medical record
      const medicalRecord = await this.medicalRecordRepository.findByStringId(event.recordId);
      if (!medicalRecord) {
        console.warn(`Medical record ${event.recordId} not found for created event`);
        return;
      }

      // Publish appointment completion event
      const appointmentCompletedEvent = new AppointmentCompletedEvent(
        event.appointmentId || `appointment-${event.recordId}`,
        event.recordId,
        event.patientId,
        event.doctorId,
        {
          scheduledDate: event.visitDate,
          actualStartTime: event.visitDate,
          actualEndTime: new Date(event.visitDate.getTime() + 30 * 60 * 1000), // Assume 30 min appointment
          appointmentType: 'consultation',
          specialtyCode: medicalRecord.specialtyCode
        },
        {
          status: 'completed',
          followUpRequired: false,
          referralRequired: false,
          patientNoShow: false
        },
        {
          diagnosisCount: medicalRecord.diagnoses.length,
          medicationCount: medicalRecord.medications.length,
          procedureCount: 0,
          vitalSignsRecorded: medicalRecord.hasVitalSigns(),
          criticalFindings: medicalRecord.getCriticalDiagnoses().length > 0,
          requiresHospitalization: false
        },
        event.createdBy,
        event.occurredAt
      );

      await this.eventPublisher.publish(appointmentCompletedEvent);

      // Publish notification event for record completion
      const notificationEvent = new MedicalRecordNotificationEvent(
        event.recordId,
        event.patientId,
        event.doctorId,
        'record_completed',
        [
          {
            type: 'patient',
            id: event.patientId,
            contactInfo: { email: 'patient@example.com' }, // Would be retrieved from patient service
            preferredMethod: 'email',
            language: 'vi'
          },
          {
            type: 'doctor',
            id: event.doctorId,
            contactInfo: { email: 'doctor@example.com' }, // Would be retrieved from doctor service
            preferredMethod: 'email',
            language: 'vi'
          }
        ],
        {
          title: 'Hồ sơ bệnh án đã được tạo',
          message: `Hồ sơ bệnh án ${event.recordId} đã được tạo thành công cho bệnh nhân ${event.patientId}`,
          priority: 'medium',
          category: 'medical'
        },
        {
          diagnosisCodes: medicalRecord.diagnoses.map(d => d.code),
          medicationCodes: medicalRecord.medications.map(m => m.code),
          followUpRequired: false
        },
        event.createdBy,
        event.occurredAt
      );

      await this.eventPublisher.publish(notificationEvent);

    } catch (error) {
      console.error('Error handling MedicalRecordCreatedEvent:', error);
      throw error;
    }
  }
}

/**
 * Medical Record Updated Event Handler
 * Handles when a medical record is updated
 */
export class MedicalRecordUpdatedEventHandler implements IDomainEventHandler<MedicalRecordUpdatedEvent> {
  
  constructor(
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {}

  async handle(event: MedicalRecordUpdatedEvent): Promise<void> {
    try {
      // Get the updated medical record
      const medicalRecord = await this.medicalRecordRepository.findByStringId(event.recordId);
      if (!medicalRecord) {
        console.warn(`Medical record ${event.recordId} not found for updated event`);
        return;
      }

      // Check if update affects billing
      const hasBillingImpact = this.checkBillingImpact(event.changes);
      
      if (hasBillingImpact) {
        const billingUpdateEvent = new MedicalRecordUpdatedForBillingEvent(
          event.recordId,
          event.patientId,
          {
            statusChange: event.changes.status ? {
              from: event.changes.status.oldValue,
              to: event.changes.status.newValue
            } : undefined
          },
          {
            costChange: 0, // Would calculate based on changes
            requiresNewInvoice: false,
            requiresInvoiceUpdate: true,
            affectsInsuranceClaim: false
          },
          event.updatedBy,
          event.occurredAt
        );

        await this.eventPublisher.publish(billingUpdateEvent);
      }

      // Publish notification for significant updates
      if (this.isSignificantUpdate(event.changes)) {
        const notificationEvent = new MedicalRecordNotificationEvent(
          event.recordId,
          event.patientId,
          event.doctorId,
          'record_completed', // Updated record
          [
            {
              type: 'doctor',
              id: event.doctorId,
              contactInfo: { email: 'doctor@example.com' },
              preferredMethod: 'email',
              language: 'vi'
            }
          ],
          {
            title: 'Hồ sơ bệnh án đã được cập nhật',
            message: `Hồ sơ bệnh án ${event.recordId} đã được cập nhật với thông tin mới`,
            priority: 'medium',
            category: 'medical'
          },
          {
            diagnosisCodes: medicalRecord.diagnoses.map(d => d.code),
            medicationCodes: medicalRecord.medications.map(m => m.code)
          },
          event.updatedBy,
          event.occurredAt
        );

        await this.eventPublisher.publish(notificationEvent);
      }

    } catch (error) {
      console.error('Error handling MedicalRecordUpdatedEvent:', error);
      throw error;
    }
  }

  private checkBillingImpact(changes: any): boolean {
    return !!(changes.status || changes.diagnosis || changes.medications);
  }

  private isSignificantUpdate(changes: any): boolean {
    return !!(changes.diagnosis || changes.medications || changes.status);
  }
}

/**
 * Diagnosis Added Event Handler
 * Handles when a diagnosis is added to a medical record
 */
export class DiagnosisAddedEventHandler implements IDomainEventHandler<DiagnosisAddedEvent> {
  
  constructor(
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {}

  async handle(event: DiagnosisAddedEvent): Promise<void> {
    try {
      // Get the medical record
      const medicalRecord = await this.medicalRecordRepository.findByStringId(event.recordId);
      if (!medicalRecord) {
        console.warn(`Medical record ${event.recordId} not found for diagnosis added event`);
        return;
      }

      // Check if diagnosis is critical
      const diagnosis = medicalRecord.diagnoses.find(d => d.code === event.diagnosisCode);
      if (diagnosis && diagnosis.isCritical()) {
        // Publish critical alert
        const criticalAlertEvent = new CriticalAlertNotificationEvent(
          `alert-${event.recordId}-${event.diagnosisCode}`,
          event.recordId,
          event.patientId,
          event.doctorId,
          {
            type: 'critical_diagnosis',
            severity: 'critical',
            description: `Critical diagnosis detected: ${diagnosis.display}`,
            clinicalSignificance: 'Requires immediate medical attention',
            recommendedAction: 'Contact attending physician immediately',
            timeWindow: 30 // 30 minutes
          },
          {
            relevantDiagnoses: [diagnosis.code]
          },
          [
            {
              level: 1,
              recipientType: 'attending_doctor',
              recipientId: event.doctorId,
              contactMethod: 'phone_call',
              timeoutMinutes: 5
            },
            {
              level: 2,
              recipientType: 'department_head',
              recipientId: 'dept-head-001',
              contactMethod: 'phone_call',
              timeoutMinutes: 10
            }
          ],
          event.addedBy,
          event.occurredAt
        );

        await this.eventPublisher.publish(criticalAlertEvent);
      }

      // Check if diagnosis affects billing
      const billingUpdateEvent = new MedicalRecordUpdatedForBillingEvent(
        event.recordId,
        event.patientId,
        {
          addedDiagnoses: [{
            code: event.diagnosisCode,
            display: diagnosis?.display || 'Unknown diagnosis',
            cost: 0 // Would be calculated based on diagnosis
          }]
        },
        {
          costChange: 0, // Would calculate based on diagnosis
          requiresNewInvoice: false,
          requiresInvoiceUpdate: true,
          affectsInsuranceClaim: true
        },
        event.addedBy,
        event.occurredAt
      );

      await this.eventPublisher.publish(billingUpdateEvent);

    } catch (error) {
      console.error('Error handling DiagnosisAddedEvent:', error);
      throw error;
    }
  }
}

/**
 * Medication Added Event Handler
 * Handles when a medication is added to a medical record
 */
export class MedicationAddedEventHandler implements IDomainEventHandler<MedicationAddedEvent> {
  
  constructor(
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {}

  async handle(event: MedicationAddedEvent): Promise<void> {
    try {
      // Get the medical record
      const medicalRecord = await this.medicalRecordRepository.findByStringId(event.recordId);
      if (!medicalRecord) {
        console.warn(`Medical record ${event.recordId} not found for medication added event`);
        return;
      }

      const medication = medicalRecord.medications.find(m => m.code === event.medicationCode);
      if (!medication) {
        console.warn(`Medication ${event.medicationCode} not found in record ${event.recordId}`);
        return;
      }

      // Check for drug interactions or allergies
      const hasInteractions = medication.interactions && medication.interactions.length > 0;
      const hasAllergies = medication.allergies && medication.allergies.length > 0;

      if (hasInteractions || hasAllergies) {
        const criticalAlertEvent = new CriticalAlertNotificationEvent(
          `alert-${event.recordId}-${event.medicationCode}`,
          event.recordId,
          event.patientId,
          event.doctorId,
          {
            type: hasAllergies ? 'allergy_alert' : 'drug_interaction',
            severity: hasAllergies ? 'critical' : 'high',
            description: hasAllergies 
              ? `Allergy alert for medication: ${medication.name}`
              : `Drug interaction detected for medication: ${medication.name}`,
            clinicalSignificance: hasAllergies 
              ? 'Patient has known allergies to this medication'
              : 'Potential drug interactions detected',
            recommendedAction: hasAllergies 
              ? 'Stop medication immediately and contact physician'
              : 'Review medication interactions and adjust dosage if necessary',
            timeWindow: hasAllergies ? 5 : 30
          },
          {
            relevantMedications: [medication.code],
            relevantAllergies: medication.allergies
          },
          [
            {
              level: 1,
              recipientType: 'attending_doctor',
              recipientId: event.doctorId,
              contactMethod: hasAllergies ? 'phone_call' : 'sms',
              timeoutMinutes: hasAllergies ? 2 : 10
            }
          ],
          event.prescribedBy,
          event.occurredAt
        );

        await this.eventPublisher.publish(criticalAlertEvent);
      }

      // Create medication reminder
      const reminderEvent = new MedicationReminderNotificationEvent(
        event.recordId,
        event.patientId,
        {
          medicationCode: medication.code,
          medicationName: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          instructions: medication.instructions,
          startDate: medication.prescribedDate,
          endDate: medication.endDate,
          nextDoseTime: this.calculateNextDoseTime(medication),
          missedDoses: 0
        },
        'dose_reminder',
        {
          preferredMethod: 'sms',
          contactValue: '+84901234567', // Would be retrieved from patient service
          language: 'vi',
          timeZone: 'Asia/Ho_Chi_Minh'
        },
        {
          title: 'Nhắc nhở uống thuốc',
          message: `Đã đến giờ uống thuốc ${medication.name}`,
          instructions: medication.instructions,
          sideEffectsToWatch: medication.sideEffects,
          emergencyContact: '+84901234567'
        },
        this.calculateNextDoseTime(medication),
        event.prescribedBy,
        event.occurredAt
      );

      await this.eventPublisher.publish(reminderEvent);

      // Update billing
      const billingUpdateEvent = new MedicalRecordUpdatedForBillingEvent(
        event.recordId,
        event.patientId,
        {
          addedMedications: [{
            code: medication.code,
            name: medication.name,
            cost: 50000 // Estimated cost in VND
          }]
        },
        {
          costChange: 50000,
          requiresNewInvoice: false,
          requiresInvoiceUpdate: true,
          affectsInsuranceClaim: true
        },
        event.prescribedBy,
        event.occurredAt
      );

      await this.eventPublisher.publish(billingUpdateEvent);

    } catch (error) {
      console.error('Error handling MedicationAddedEvent:', error);
      throw error;
    }
  }

  private calculateNextDoseTime(medication: any): Date {
    // Simple calculation - would be more sophisticated in real implementation
    const now = new Date();
    
    // Parse frequency (e.g., "2 times per day" -> 12 hours interval)
    const frequencyMatch = medication.frequency.match(/(\d+)/);
    const timesPerDay = frequencyMatch ? parseInt(frequencyMatch[1]) : 1;
    const intervalHours = 24 / timesPerDay;
    
    return new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
  }
}

/**
 * Integration Event Publisher Service
 * Centralized service for publishing integration events
 */
export class IntegrationEventPublisherService {
  
  constructor(
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  /**
   * Publish medical record completion for billing
   */
  async publishMedicalRecordCompleted(
    recordId: string,
    patientId: string,
    doctorId: string,
    appointmentId: string,
    visitDate: Date,
    diagnoses: any[],
    medications: any[],
    procedures: any[],
    billingInfo: any,
    completedBy: string
  ): Promise<void> {
    const event = new MedicalRecordCompletedEvent(
      recordId,
      patientId,
      doctorId,
      appointmentId,
      visitDate,
      diagnoses,
      medications,
      procedures,
      billingInfo,
      completedBy
    );

    await this.eventPublisher.publish(event);
  }

  /**
   * Publish insurance verification requirement
   */
  async publishInsuranceVerificationRequired(
    recordId: string,
    patientId: string,
    insuranceInfo: any,
    verificationReason: any,
    estimatedCost: number,
    urgency: any,
    requestedBy: string
  ): Promise<void> {
    const event = new InsuranceVerificationRequiredEvent(
      recordId,
      patientId,
      insuranceInfo,
      verificationReason,
      estimatedCost,
      urgency,
      requestedBy
    );

    await this.eventPublisher.publish(event);
  }

  /**
   * Publish payment requirement
   */
  async publishPaymentRequired(
    recordId: string,
    patientId: string,
    paymentInfo: any,
    itemizedCharges: any[],
    priority: any,
    generatedBy: string
  ): Promise<void> {
    const event = new PaymentRequiredEvent(
      recordId,
      patientId,
      paymentInfo,
      itemizedCharges,
      priority,
      generatedBy
    );

    await this.eventPublisher.publish(event);
  }

  /**
   * Publish follow-up appointment requirement
   */
  async publishFollowUpRequired(
    originalAppointmentId: string,
    originalRecordId: string,
    patientId: string,
    doctorId: string,
    followUpDetails: any,
    clinicalReason: any,
    requestedBy: string
  ): Promise<void> {
    const event = new FollowUpAppointmentRequiredEvent(
      originalAppointmentId,
      originalRecordId,
      patientId,
      doctorId,
      followUpDetails,
      clinicalReason,
      requestedBy
    );

    await this.eventPublisher.publish(event);
  }

  /**
   * Publish referral requirement
   */
  async publishReferralRequired(
    originalAppointmentId: string,
    originalRecordId: string,
    patientId: string,
    referringDoctorId: string,
    referralDetails: any,
    diagnosticInfo: any,
    referredBy: string
  ): Promise<void> {
    const event = new ReferralRequiredEvent(
      originalAppointmentId,
      originalRecordId,
      patientId,
      referringDoctorId,
      referralDetails,
      diagnosticInfo,
      referredBy
    );

    await this.eventPublisher.publish(event);
  }
}
