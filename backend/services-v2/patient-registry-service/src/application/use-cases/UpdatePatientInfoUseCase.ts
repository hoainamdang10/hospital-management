/**
 * UpdatePatientInfoUseCase - Application Use Case
 *
 * Handles patient information updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { randomUUID } from "crypto";
import { IPatientRepository } from "../../domain/repositories/IPatientRepository";
import { PatientId } from "../../domain/value-objects/PatientId";
import { PersonalInfo } from "../../domain/value-objects/PersonalInfo";
import { ContactInfo, Address } from "../../domain/value-objects/ContactInfo";
import {
  BasicMedicalInfo,
  BloodType,
} from "../../domain/value-objects/BasicMedicalInfo";
import { InsuranceInfo } from "../../domain/entities/InsuranceInfo";
import { IEventBus } from "@shared/application/services/event-bus.interface";
import { ILogger } from "@shared/application/services/logger.interface";
import { Patient } from "../../domain/aggregates/Patient";
import { AuditService } from "../../infrastructure/audit/AuditService";

export interface UpdatePatientInfoRequest {
  patientId: string;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    nationalId: string;
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo?: {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    preferredContactMethod: "phone" | "email" | "sms";
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      postalCode?: string;
      country: string;
    };
  };
  basicMedicalInfo?: {
    bloodType?: BloodType;
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;
    validTo: string;
    coverageType: "BHYT" | "BHTN" | "private" | "self_pay";
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
    isPrimary: boolean;
  };
  updatedBy: string;
}

export interface UpdatePatientInfoResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export class UpdatePatientInfoUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: UpdatePatientInfoRequest,
  ): Promise<UpdatePatientInfoResponse> {
    try {
      this.logger.info("Starting patient info update", {
        patientId: request.patientId,
        updatedBy: request.updatedBy,
      });

      // 1. Find patient
      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        this.logger.warn("Patient update failed: patient not found", {
          patientId: request.patientId,
        });
        return {
          success: false,
          message: "Không tìm thấy bệnh nhân",
          errors: ["PATIENT_NOT_FOUND"],
        };
      }

      // 2. Check if patient is active
      if (!patient.isActive()) {
        this.logger.warn("Patient update failed: patient not active", {
          patientId: request.patientId,
        });
        return {
          success: false,
          message: "Không thể cập nhật bệnh nhân không hoạt động",
          errors: ["PATIENT_NOT_ACTIVE"],
        };
      }

      // Track updated fields for audit
      const updatedFields: string[] = [];

      // 3. Update personal info (if provided)
      if (request.personalInfo) {
        updatedFields.push("personal_info");
        const personalInfo = PersonalInfo.create({
          fullName: request.personalInfo.fullName,
          dateOfBirth: new Date(request.personalInfo.dateOfBirth),
          gender: request.personalInfo.gender,
          nationalId: request.personalInfo.nationalId,
          nationality: request.personalInfo.nationality,
          ethnicity: request.personalInfo.ethnicity,
          occupation: request.personalInfo.occupation,
          maritalStatus: request.personalInfo.maritalStatus,
        });

        patient.updatePersonalInfo(personalInfo, request.updatedBy);
      }

      // 4. Update contact info (if provided)
      if (request.contactInfo) {
        updatedFields.push("contact_info");
        const contactInfo = ContactInfo.create({
          primaryPhone: request.contactInfo.primaryPhone,
          secondaryPhone: request.contactInfo.secondaryPhone,
          email: request.contactInfo.email,
          preferredContactMethod: request.contactInfo.preferredContactMethod,
          address: request.contactInfo.address as Address,
        });

        patient.updateContactInfo(contactInfo, request.updatedBy);
      }

      // 5. Update basic medical info (if provided)
      if (request.basicMedicalInfo) {
        updatedFields.push("basic_medical_info");
        const basicMedicalInfo = BasicMedicalInfo.create({
          bloodType: request.basicMedicalInfo.bloodType,
          knownAllergies: request.basicMedicalInfo.knownAllergies || [],
          emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo,
        });

        patient.updateBasicMedicalInfo(basicMedicalInfo, request.updatedBy);
      }

      // 6. Update insurance info (if provided)
      if (request.insuranceInfo) {
        updatedFields.push("insurance_info");
        const insuranceInfo = InsuranceInfo.create({
          provider: request.insuranceInfo.provider,
          policyNumber: request.insuranceInfo.policyNumber,
          groupNumber: request.insuranceInfo.groupNumber,
          validFrom: new Date(request.insuranceInfo.validFrom),
          validTo: new Date(request.insuranceInfo.validTo),
          coverageType: request.insuranceInfo.coverageType,
          isVietnameseInsurance: request.insuranceInfo.isVietnameseInsurance,
          bhytNumber: request.insuranceInfo.bhytNumber,
          isPrimary: request.insuranceInfo.isPrimary,
          isActive: true,
        });

        patient.updateInsuranceInfo(insuranceInfo, request.updatedBy);
      }

      // 7. Save updated patient
      await this.patientRepository.save(patient);

      // 8. Publish domain events
      await this.publishDomainEvents(patient);

      // 9. HIPAA audit logging
      await this.auditPatientUpdate(patient, request, updatedFields);

      this.logger.info("Patient info update completed successfully", {
        patientId: request.patientId,
        updatedBy: request.updatedBy,
        updatedFields: updatedFields.join(","),
      });

      // 10. Return success response
      return {
        success: true,
        message: "Cập nhật thông tin bệnh nhân thành công",
      };
    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        this.logger.error("Patient info update failed", {
          patientId: request.patientId,
          error: error.message,
          stack: error.stack,
        });
        return {
          success: false,
          message: "Cập nhật thông tin bệnh nhân thất bại",
          errors: ["UPDATE_FAILED", error.message],
        };
      }

      // Handle unexpected errors
      this.logger.error("Unexpected error during patient info update", {
        patientId: request.patientId,
        error: "UNEXPECTED_ERROR",
      });
      return {
        success: false,
        message: "Đã xảy ra lỗi không mong muốn",
        errors: ["UNEXPECTED_ERROR"],
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
      this.logger.warn("Event publishing failed, but patient was updated", {
        patientId: patient.getPatientId(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * HIPAA audit logging for patient update
   * Logs to audit_logs table via AuditService
   */
  private async auditPatientUpdate(
    patient: Patient,
    request: UpdatePatientInfoRequest,
    updatedFields: string[],
  ): Promise<void> {
    try {
      // Log to audit_logs table (HIPAA compliance)
      await this.auditService.logAudit({
        eventId: randomUUID(),
        eventType: "patient.updated",
        aggregateType: "Patient",
        aggregateId: patient.getPatientId() || "unknown",
        action: "PATIENT_INFO_UPDATE",
        userId: request.updatedBy ?? undefined,
        patientId: patient.getPatientId() ?? undefined,
        containsPHI: true,
        changedFields: {
          dataAccessed: updatedFields.join(","),
          requestedBy: request.updatedBy || "system",
          updatedFields: updatedFields,
        },
        complianceLevel: "hipaa",
      });

      this.logger.info("Patient update audited successfully", {
        patientId: patient.getPatientId(),
      });
    } catch (error) {
      this.logger.error("Failed to audit patient update", {
        patientId: patient.getPatientId(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
