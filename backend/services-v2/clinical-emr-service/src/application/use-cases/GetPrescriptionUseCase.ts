/**
 * GetPrescriptionUseCase - Get prescription by ID with HIPAA logging
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionId } from '../../domain/value-objects/PrescriptionId';
import {
  GetPrescriptionRequest,
  GetPrescriptionResponse,
  validateGetPrescriptionRequest,
} from '../dto/PrescriptionRequest';

export class GetPrescriptionUseCase implements IUseCase<GetPrescriptionRequest, GetPrescriptionResponse> {
  constructor(private readonly prescriptionRepository: IPrescriptionRepository) {}

  async execute(request: GetPrescriptionRequest): Promise<GetPrescriptionResponse> {
    const validation = validateGetPrescriptionRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const prescriptionId = PrescriptionId.create(request.prescriptionId);
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    
    if (!prescription) {
      throw new Error(`Không tìm thấy đơn thuốc với ID ${request.prescriptionId}`);
    }

    prescription.recordReadAccess(request.accessedBy, request.accessPurpose, request.ipAddress, request.userAgent);
    await this.prescriptionRepository.save(prescription);

    return {
      prescriptionId: prescription.prescriptionId.value,
      medicalRecordId: prescription.medicalRecordId,
      patientId: prescription.patientId,
      prescribedBy: prescription.prescribedBy,
      diagnosis: prescription.diagnosis,
      medications: prescription.medications,
      generalInstructions: prescription.generalInstructions,
      precautions: prescription.precautions,
      prescribedDate: prescription.prescribedDate.toISOString(),
      validUntil: prescription.validUntil?.toISOString(),
      dispensedBy: prescription.dispensedBy,
      dispensedAt: prescription.dispensedAt?.toISOString(),
      pharmacyId: prescription.pharmacyId,
      refillsAllowed: prescription.refillsAllowed,
      refillsRemaining: prescription.refillsRemaining,
      status: prescription.status,
      createdAt: prescription.createdAt.toISOString(),
      updatedAt: prescription.updatedAt.toISOString(),
    };
  }

  async authorize(request: GetPrescriptionRequest, userId: string): Promise<boolean> {
    return request.accessedBy === userId;
  }

  involvesPHI(request: GetPrescriptionRequest): boolean {
    return true;
  }

  getPatientId(request: GetPrescriptionRequest): string | null {
    return null;
  }
}
