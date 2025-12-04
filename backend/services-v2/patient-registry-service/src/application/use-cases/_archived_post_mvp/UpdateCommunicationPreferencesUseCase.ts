/**
 * UpdateCommunicationPreferencesUseCase - Application Layer
 * Updates patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */

import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";
import { PatientId } from "../../../domain/value-objects/PatientId";
import {
  CommunicationPreference,
  Language,
  ContactMethod,
} from "../../../domain/value-objects/CommunicationPreference";

export interface UpdateCommunicationPreferencesCommand {
  patientId: string;
  language: Language;
  preferred: boolean;
  contactMethod: ContactMethod;
  timezone: string;
  updatedBy: string;
}

export interface UpdateCommunicationPreferencesResponse {
  success: boolean;
  message: string;
  preference: {
    language: Language;
    preferred: boolean;
    contactMethod: ContactMethod;
    timezone: string;
  };
}

export class UpdateCommunicationPreferencesUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(
    command: UpdateCommunicationPreferencesCommand,
  ): Promise<UpdateCommunicationPreferencesResponse> {
    // Validate input
    if (!command.patientId || command.patientId.trim() === "") {
      throw new Error("ID bệnh nhân không được để trống");
    }

    // Find patient
    const patientId = PatientId.fromString(command.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error("Không tìm thấy bệnh nhân");
    }

    // Create communication preference
    const preference = CommunicationPreference.create({
      language: command.language,
      preferred: command.preferred,
      contactMethod: command.contactMethod,
      timezone: command.timezone,
    });

    // Update patient
    patient.updateCommunicationPreference(preference, command.updatedBy);

    // Save patient
    await this.patientRepository.save(patient);

    return {
      success: true,
      message: "Cập nhật tùy chọn liên hệ thành công",
      preference: preference.toDTO(),
    };
  }
}
