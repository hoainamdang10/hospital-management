/**
 * GetCommunicationPreferencesUseCase - Application Layer
 * Retrieves patient communication preferences
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (communication field)
 */

import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";
import { PatientId } from "../../../domain/value-objects/PatientId";
import {
  Language,
  ContactMethod,
} from "../../../domain/value-objects/CommunicationPreference";

export interface GetCommunicationPreferencesQuery {
  patientId: string;
}

export interface GetCommunicationPreferencesResponse {
  hasPreference: boolean;
  preference: {
    language: Language;
    preferred: boolean;
    contactMethod: ContactMethod;
    timezone: string;
  } | null;
}

export class GetCommunicationPreferencesUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(
    query: GetCommunicationPreferencesQuery,
  ): Promise<GetCommunicationPreferencesResponse> {
    // Validate input
    if (!query.patientId || query.patientId.trim() === "") {
      throw new Error("ID bệnh nhân không được để trống");
    }

    // Find patient
    const patientId = PatientId.fromString(query.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error("Không tìm thấy bệnh nhân");
    }

    // Get communication preference
    const preference = patient.getCommunicationPreference();

    if (!preference) {
      return {
        hasPreference: false,
        preference: null,
      };
    }

    return {
      hasPreference: true,
      preference: preference.toDTO(),
    };
  }
}
