/**
 * AddEmergencyContactUseCase - Application Layer
 * Add emergency contact to existing patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { EmergencyContact } from '../../domain/entities/EmergencyContact';
import { PatientId } from '../../domain/value-objects/PatientId';
import { Patient } from '../../domain/aggregates/Patient';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';
import { IAuditService } from '@shared/application/services/audit.service.interface';

export interface AddEmergencyContactCommand {
  patientId: string;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
  performedBy: string;
}

export interface AddEmergencyContactResult {
  success: boolean;
  contactId: string;
  message: string;
}

/**
 * Use Case: Add Emergency Contact
 */
export class AddEmergencyContactUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
    private auditService: IAuditService,
  ) {}

  async execute(
    command: AddEmergencyContactCommand,
  ): Promise<AddEmergencyContactResult> {
    this.logger.info('Starting add emergency contact', {
      patientId: command.patientId,
      performedBy: command.performedBy,
    });

    // 1. Validate input
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error('Patient ID không được để trống');
    }

    if (!command.name || command.name.trim().length === 0) {
      throw new Error('Tên người liên hệ không được để trống');
    }

    if (!command.relationship || command.relationship.trim().length === 0) {
      throw new Error('Mối quan hệ không được để trống');
    }

    if (!command.primaryPhone || command.primaryPhone.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }

    if (!command.performedBy || command.performedBy.trim().length === 0) {
      throw new Error('Người thực hiện không được để trống');
    }

    // 2. Find patient
    const patientId = PatientId.create(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error(`Không tìm thấy bệnh nhân với ID: ${command.patientId}`);
    }

    // 3. Create emergency contact
    const contact = EmergencyContact.create(
      command.name,
      command.relationship,
      command.primaryPhone,
      command.secondaryPhone,
      command.email,
      command.address,
      command.isPrimary || false,
    );

    // 4. Add to patient
    patient.addEmergencyContact(contact, command.performedBy);

    // 5. Save patient
    await this.patientRepository.save(patient);

    // 6. Publish domain events
    await this.publishDomainEvents(patient);

    // 7. HIPAA audit logging
    await this.auditEmergencyContactAdded(patient, command, contact);

    this.logger.info('Emergency contact added successfully', {
      patientId: command.patientId,
      contactId: contact.getId(),
      performedBy: command.performedBy,
    });

    return {
      success: true,
      contactId: contact.getId(),
      message: 'Đã thêm người liên hệ khẩn cấp thành công',
    };
  }

  /**
   * Publish domain events
   */
  private async publishDomainEvents(patient: Patient): Promise<void> {
    try {
      const events = patient.getUncommittedEvents();

      for (const event of events) {
        await this.eventBus.publish(event);
      }

      patient.markEventsAsCommitted();
    } catch (error) {
      this.logger.warn(
        'Event publishing failed, but emergency contact was added',
        {
          patientId: patient.getPatientId(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  }

  /**
   * HIPAA audit logging for emergency contact addition
   */
  private async auditEmergencyContactAdded(
    patient: Patient,
    command: AddEmergencyContactCommand,
    contact: EmergencyContact,
  ): Promise<void> {
    try {
      await this.auditService.log({
        userId: command.performedBy,
        action: 'EMERGENCY_CONTACT_ADDED',
        resource: 'patient_emergency_contacts',
        resourceId: patient.getPatientId() || undefined,
        details: {
          contactId: contact.getId(),
          contactName: contact.name,
          relationship: contact.relationship,
          complianceLevel: 'HIPAA',
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.info('HIPAA Audit: Emergency contact added', {
        action: 'EMERGENCY_CONTACT_ADDED',
        patientId: patient.getPatientId(),
        contactId: contact.getId(),
        performedBy: command.performedBy,
      });
    } catch (error) {
      this.logger.error('Failed to log HIPAA audit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId: patient.getPatientId(),
        action: 'EMERGENCY_CONTACT_ADDED',
      });
    }
  }
}
