/**
 * ListPrescriptionsUseCase - List prescriptions with filtering
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import {
  ListPrescriptionsRequest,
  ListPrescriptionsResponse,
  PrescriptionSummaryDTO,
  validateListPrescriptionsRequest,
} from '../dto/PrescriptionRequest';

export class ListPrescriptionsUseCase implements IUseCase<ListPrescriptionsRequest, ListPrescriptionsResponse> {
  constructor(private readonly prescriptionRepository: IPrescriptionRepository) {}

  async execute(request: ListPrescriptionsRequest): Promise<ListPrescriptionsResponse> {
    const validation = validateListPrescriptionsRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const limit = request.limit || 20;
    const offset = request.offset || 0;
    const fromDate = request.fromDate ? new Date(request.fromDate) : undefined;
    const toDate = request.toDate ? new Date(request.toDate) : undefined;

    const filters = {
      patientId: request.patientId,
      medicalRecordId: request.medicalRecordId,
      prescribedBy: request.prescribedBy,
      status: request.status,
      pharmacyId: request.pharmacyId,
      fromDate,
      toDate,
      hasRefills: request.hasRefills,
      limit,
      offset,
    };

    const prescriptions = await this.prescriptionRepository.search(filters);
    const total = await this.prescriptionRepository.count(filters);

    const prescriptionSummaries: PrescriptionSummaryDTO[] = prescriptions.map(p => ({
      prescriptionId: p.prescriptionId.value,
      patientId: p.patientId,
      prescribedBy: p.prescribedBy,
      medicationCount: p.medications.length,
      prescribedDate: p.prescribedDate.toISOString(),
      validUntil: p.validUntil?.toISOString(),
      dispensedAt: p.dispensedAt?.toISOString(),
      refillsRemaining: p.refillsRemaining,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      prescriptions: prescriptionSummaries,
      total,
      limit,
      offset,
    };
  }

  async authorize(request: ListPrescriptionsRequest, userId: string): Promise<boolean> {
    return request.accessedBy === userId;
  }

  involvesPHI(request: ListPrescriptionsRequest): boolean {
    return true;
  }

  getPatientId(request: ListPrescriptionsRequest): string | null {
    return request.patientId || null;
  }
}
