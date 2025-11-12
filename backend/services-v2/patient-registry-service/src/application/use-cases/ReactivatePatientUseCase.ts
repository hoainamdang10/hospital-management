/**
 * ReactivatePatientUseCase - Application Layer
 * Reactivate inactive patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';

export interface ReactivatePatientCommand {
  patientId: string;
  reason: string;
  performedBy: string;
  allowDeceasedReactivate?: boolean;
}

export interface ReactivatePatientResult {
  success: boolean;
  message: string;
}

/**
 * Use Case: Reactivate Patient
 */
export class ReactivatePatientUseCase {
  constructor(private patientRepository: IPatientRepository) {}

  async execute(
    command: ReactivatePatientCommand,
  ): Promise<ReactivatePatientResult> {
    // 1. Validate input
    if (!command.patientId || command.patientId.trim().length === 0) {
      throw new Error('Patient ID không được để trống');
    }

    if (!command.reason || command.reason.trim().length === 0) {
      throw new Error('Lý do kích hoạt lại không được để trống');
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

    // 3. Reactivate patient
    patient.reactivate(command.reason, command.performedBy, {
      allowDeceased: command.allowDeceasedReactivate === true,
    });

    // 4. Save patient
    await this.patientRepository.save(patient);

    return {
      success: true,
      message: 'Đã kích hoạt lại bệnh nhân thành công',
    };
  }
}
