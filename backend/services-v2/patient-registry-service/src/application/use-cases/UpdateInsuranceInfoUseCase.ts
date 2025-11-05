/**
 * UpdateInsuranceInfoUseCase - Application Layer
 * Update insurance information for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { PatientId } from "../../domain/value-objects/PatientId";
import { InsuranceInfo } from "../../domain/entities/InsuranceInfo";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { ILogger } from "@shared/application/services/logger.interface";

export interface UpdateInsuranceInfoCommand {
  patientId: string;
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validFrom?: Date;
  validTo?: Date;
  coverageType?: "BHYT" | "BHTN" | "private" | "self_pay";
  isActive?: boolean;
  isPrimary?: boolean;
  bhytNumber?: string;
  performedBy: string;
}

export interface UpdateInsuranceInfoResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export class UpdateInsuranceInfoUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {}

  async execute(
    command: UpdateInsuranceInfoCommand,
  ): Promise<UpdateInsuranceInfoResult> {
    this.logger.info("Updating insurance info", {
      patientId: command.patientId,
      performedBy: command.performedBy,
    });

    try {
      if (!command.patientId || command.patientId.trim().length === 0) {
        return {
          success: false,
          message: "Patient ID không được để trống",
          errors: ["INVALID_PATIENT_ID"],
        };
      }

      const patientId = PatientId.create(command.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ["PATIENT_NOT_FOUND"],
        };
      }

      const currentInsurance = patient.getInsuranceInfo();

      if (!currentInsurance) {
        return {
          success: false,
          message: "Bệnh nhân chưa có thông tin bảo hiểm để cập nhật",
          errors: ["NO_INSURANCE_INFO"],
        };
      }

      // Update insurance info using activate/deactivate/setPrimary/removePrimary methods
      if (command.isActive !== undefined) {
        if (command.isActive) {
          currentInsurance.activate();
        } else {
          currentInsurance.deactivate();
        }
      }

      if (command.isPrimary !== undefined) {
        if (command.isPrimary) {
          currentInsurance.setPrimary();
        } else {
          currentInsurance.removePrimary();
        }
      }

      // Note: Other fields (provider, policyNumber, validFrom, validTo) are immutable
      // To change them, create a new InsuranceInfo entity

      // Save patient
      await this.patientRepository.save(patient);

      // Publish domain events
      await this.publishDomainEvents(patient);

      this.logger.info("Insurance info updated successfully", {
        patientId: command.patientId,
      });

      return {
        success: true,
        message: "Cập nhật thông tin bảo hiểm thành công",
      };
    } catch (error) {
      this.logger.error("Error updating insurance info", {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Lỗi khi cập nhật thông tin bảo hiểm",
        errors: [error instanceof Error ? error.message : "UNKNOWN_ERROR"],
      };
    }
  }

  private async publishDomainEvents(patient: any): Promise<void> {
    try {
      const events = patient.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      patient.markEventsAsCommitted();
    } catch (error) {
      this.logger.warn(
        "Event publishing failed, but insurance info was updated",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }
}
