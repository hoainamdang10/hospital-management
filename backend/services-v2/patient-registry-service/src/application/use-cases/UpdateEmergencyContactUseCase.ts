/**
 * UpdateEmergencyContactUseCase - Application Layer
 * Update emergency contact information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { Patient } from "../../domain/aggregates/Patient";
import { PatientId } from "../../domain/value-objects/PatientId";
import { ILogger } from "@shared/application/services/logger.interface";
import { IEventBus } from "@shared/application/services/event-bus.interface";

export interface UpdateEmergencyContactCommand {
  patientId: string;
  contactId: string;
  name?: string;
  relationship?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  performedBy: string;
}

export interface UpdateEmergencyContactResult {
  success: boolean;
  contactId?: string;
  message: string;
  errors?: string[];
}

/**
 * Use Case: Update Emergency Contact
 */
export class UpdateEmergencyContactUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {}

  async execute(
    command: UpdateEmergencyContactCommand,
  ): Promise<UpdateEmergencyContactResult> {
    this.logger.info("Updating emergency contact", {
      patientId: command.patientId,
      contactId: command.contactId,
      performedBy: command.performedBy,
    });

    try {
      // 1. Validate input
      if (!command.patientId || command.patientId.trim().length === 0) {
        return {
          success: false,
          message: "Patient ID không được để trống",
          errors: ["INVALID_PATIENT_ID"],
        };
      }

      if (!command.contactId || command.contactId.trim().length === 0) {
        return {
          success: false,
          message: "Contact ID không được để trống",
          errors: ["INVALID_CONTACT_ID"],
        };
      }

      if (!command.performedBy || command.performedBy.trim().length === 0) {
        return {
          success: false,
          message: "Người thực hiện không được để trống",
          errors: ["INVALID_PERFORMED_BY"],
        };
      }

      // 2. Find patient
      const patientId = PatientId.create(command.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ["PATIENT_NOT_FOUND"],
        };
      }

      // 3. Find emergency contact
      const contacts = patient.getEmergencyContacts();
      const contact = contacts.find((c) => c.getId() === command.contactId);

      if (!contact) {
        return {
          success: false,
          message: `Không tìm thấy người liên hệ khẩn cấp với ID: ${command.contactId}`,
          errors: ["CONTACT_NOT_FOUND"],
        };
      }

      // 4. Update contact properties
      contact.updateContactInfo(
        command.name,
        command.primaryPhone,
        command.secondaryPhone,
        command.email,
        command.address,
      );

      // 5. Update relationship if provided
      if (command.relationship !== undefined) {
        contact.updateRelationship(command.relationship);
      }

      // 6. Save patient (emergency contact is part of patient aggregate)
      await this.patientRepository.save(patient);

      // 7. Publish domain events
      await this.publishDomainEvents(patient);

      this.logger.info("Emergency contact updated successfully", {
        patientId: command.patientId,
        contactId: command.contactId,
        performedBy: command.performedBy,
      });

      return {
        success: true,
        contactId: command.contactId,
        message: "Cập nhật người liên hệ khẩn cấp thành công",
      };
    } catch (error) {
      this.logger.error("Error updating emergency contact", {
        patientId: command.patientId,
        contactId: command.contactId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi khi cập nhật người liên hệ khẩn cấp",
        errors: [error instanceof Error ? error.message : "UNKNOWN_ERROR"],
      };
    }
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
        "Event publishing failed, but emergency contact was updated",
        {
          patientId: patient.getPatientId(),
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }
}
