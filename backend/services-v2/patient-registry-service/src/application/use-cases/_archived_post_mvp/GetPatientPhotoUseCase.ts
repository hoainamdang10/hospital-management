/**
 * GetPatientPhotoUseCase - Application Layer
 * Retrieves patient photo URL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, FHIR R6 (photo field)
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface GetPatientPhotoQuery {
  patientId: string;
}

export interface GetPatientPhotoResponse {
  photoUrl: string | null;
  hasPhoto: boolean;
}

export class GetPatientPhotoUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(query: GetPatientPhotoQuery): Promise<GetPatientPhotoResponse> {
    // Validate input
    if (!query.patientId || query.patientId.trim() === '') {
      throw new Error('ID bệnh nhân không được để trống');
    }

    // Find patient
    const patientId = PatientId.fromString(query.patientId);
    const patient = await this.patientRepository.findById(patientId);

    if (!patient) {
      throw new Error('Không tìm thấy bệnh nhân');
    }

    // Get photo URL
    const photoUrl = patient.getPhotoUrl();

    return {
      photoUrl: photoUrl || null,
      hasPhoto: !!photoUrl
    };
  }
}

