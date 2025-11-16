/**
 * MarkAsDeceasedUseCase - Application Layer
 * Mark patient as deceased
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface MarkAsDeceasedCommand {
  patientId: string;
  performedBy: string;
}

export interface MarkAsDeceasedResult {
  success: boolean;
  message: string;
}

/**
 * Use Case: Mark Patient as Deceased
 */
export class MarkAsDeceasedUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(command: MarkAsDeceasedCommand): Promise<MarkAsDeceasedResult> {
    // 1. Validate input
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error('Patient ID không được để trống');
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

    // 3. Mark as deceased
    patient.markAsDeceased(command.performedBy);

    // 4. Save patient
    await this.patientRepository.save(patient);

    return {
      success: true,
      message: 'Đã đánh dấu bệnh nhân đã qua đời thành công'
    };
  }
}

