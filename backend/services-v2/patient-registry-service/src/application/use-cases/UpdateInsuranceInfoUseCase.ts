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

      const normalizeDate = (
        value: Date | string | undefined,
        fallback: Date,
      ): Date => {
        if (!value) return fallback;
        const parsed = typeof value === "string" ? new Date(value) : value;
        return Number.isNaN(parsed.getTime()) ? fallback : parsed;
      };

      const validFrom = normalizeDate(
        command.validFrom,
        currentInsurance.validFrom,
      );
      const validTo = normalizeDate(command.validTo, currentInsurance.validTo);

      if (validFrom > validTo) {
        return {
          success: false,
          message: "Ngày hiệu lực không hợp lệ (validFrom > validTo)",
          errors: ["INVALID_INSURANCE_DATES"],
        };
      }

      const coverageType =
        command.coverageType ?? currentInsurance.coverageType;

      // Rebuild insurance info with updated fields (immutability for critical fields)
      const updatedInsurance = InsuranceInfo.create({
        provider: command.provider ?? currentInsurance.provider,
        policyNumber: command.policyNumber ?? currentInsurance.policyNumber,
        groupNumber: command.groupNumber ?? currentInsurance.groupNumber,
        validFrom,
        validTo,
        coverageType,
        isActive:
          command.isActive !== undefined
            ? command.isActive
            : currentInsurance.isActive,
        isPrimary:
          command.isPrimary !== undefined
            ? command.isPrimary
            : currentInsurance.isPrimary,
        isVietnameseInsurance:
          coverageType === "BHYT" || coverageType === "BHTN",
        bhytNumber: command.bhytNumber ?? currentInsurance.bhytNumber,
      });

      // Apply to patient aggregate
      patient.updateInsuranceInfo(updatedInsurance, command.performedBy);

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
