/**
 * DispensePrescriptionUseCase - Dispense prescription from pharmacy
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionId } from '../../domain/value-objects/PrescriptionId';
import {
  DispensePrescriptionRequest,
  DispensePrescriptionResponse,
  validateDispensePrescriptionRequest,
} from '../dto/PrescriptionRequest';

export class DispensePrescriptionUseCase implements IUseCase<DispensePrescriptionRequest, DispensePrescriptionResponse> {
  constructor(private readonly prescriptionRepository: IPrescriptionRepository) {}

  async execute(request: DispensePrescriptionRequest): Promise<DispensePrescriptionResponse> {
    const validation = validateDispensePrescriptionRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const prescriptionId = PrescriptionId.create(request.prescriptionId);
    const prescription = await this.prescriptionRepository.findById(prescriptionId);
    
    if (!prescription) {
      throw new Error(`Không tìm thấy đơn thuốc với ID ${request.prescriptionId}`);
    }

    prescription.dispense(request.dispensedBy, request.pharmacyId);
    await this.prescriptionRepository.save(prescription);

    return {
      prescriptionId: request.prescriptionId,
      status: prescription.status,
      dispensedAt: prescription.dispensedAt!.toISOString(),
      message: 'Cấp thuốc thành công',
    };
  }

  async authorize(request: DispensePrescriptionRequest, userId: string): Promise<boolean> {
    return request.dispensedBy === userId;
  }

  involvesPHI(request: DispensePrescriptionRequest): boolean {
    return true;
  }

  getPatientId(request: DispensePrescriptionRequest): string | null {
    return null;
  }
}
