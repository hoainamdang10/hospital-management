/**
 * CreatePrescriptionUseCase - Create new prescription
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionAggregate } from '../../domain/aggregates/Prescription.aggregate';
import { PrescriptionId } from '../../domain/value-objects/PrescriptionId';
import {
  CreatePrescriptionRequest,
  CreatePrescriptionResponse,
  validateCreatePrescriptionRequest,
} from '../dto/PrescriptionRequest';

export class CreatePrescriptionUseCase implements IUseCase<CreatePrescriptionRequest, CreatePrescriptionResponse> {
  constructor(private readonly prescriptionRepository: IPrescriptionRepository) {}

  async execute(request: CreatePrescriptionRequest): Promise<CreatePrescriptionResponse> {
    const validation = validateCreatePrescriptionRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const sequence = await this.prescriptionRepository.getNextSequence(yearMonth);
    const prescriptionId = PrescriptionId.generate(sequence);

    const prescribedDate = new Date(request.prescribedDate);
    const validUntil = request.validUntil ? new Date(request.validUntil) : undefined;

    const prescription = PrescriptionAggregate.create(
      prescriptionId,
      request.medicalRecordId,
      request.patientId,
      request.prescribedBy,
      request.medications,
      prescribedDate,
      request.createdBy,
      {
        diagnosis: request.diagnosis,
        diagnosisCode: request.diagnosisCode,
        generalInstructions: request.generalInstructions,
        precautions: request.precautions,
        validUntil,
        refillsAllowed: request.refillsAllowed,
      }
    );

    await this.prescriptionRepository.save(prescription);

    return {
      prescriptionId: prescriptionId.value,
      medicationCount: prescription.medications.length,
      status: prescription.status,
      createdAt: prescription.createdAt.toISOString(),
      message: 'Tạo đơn thuốc thành công',
    };
  }

  async authorize(request: CreatePrescriptionRequest, userId: string): Promise<boolean> {
    return request.prescribedBy === userId || request.createdBy === userId;
  }

  involvesPHI(request: CreatePrescriptionRequest): boolean {
    return true;
  }

  getPatientId(request: CreatePrescriptionRequest): string | null {
    return request.patientId || null;
  }
}
