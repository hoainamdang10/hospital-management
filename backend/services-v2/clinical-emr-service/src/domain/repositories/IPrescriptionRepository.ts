/**
 * IPrescriptionRepository - Repository Interface
 * Defines contract for prescription persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { PrescriptionAggregate, PrescriptionStatus } from '../aggregates/Prescription.aggregate';
import { PrescriptionId } from '../value-objects/PrescriptionId';

export interface PrescriptionSearchFilters {
  patientId?: string;
  medicalRecordId?: string;
  prescribedBy?: string;
  status?: PrescriptionStatus;
  statuses?: PrescriptionStatus[];
  pharmacyId?: string;
  fromDate?: Date;
  toDate?: Date;
  hasRefills?: boolean;
  isExpired?: boolean;
  limit?: number;
  offset?: number;
}

export interface IPrescriptionRepository {
  save(prescription: PrescriptionAggregate): Promise<void>;
  findById(prescriptionId: PrescriptionId): Promise<PrescriptionAggregate | null>;
  findByMedicalRecordId(medicalRecordId: string, options?: { limit?: number; offset?: number }): Promise<PrescriptionAggregate[]>;
  findByPatientId(patientId: string, options?: { limit?: number; offset?: number }): Promise<PrescriptionAggregate[]>;
  findByPrescribedBy(doctorId: string, options?: { status?: PrescriptionStatus; limit?: number; offset?: number }): Promise<PrescriptionAggregate[]>;
  findByStatus(status: PrescriptionStatus, options?: { limit?: number; offset?: number }): Promise<PrescriptionAggregate[]>;
  findActivePrescriptionsByPatient(patientId: string): Promise<PrescriptionAggregate[]>;
  findExpiredPrescriptions(options?: { limit?: number; offset?: number }): Promise<PrescriptionAggregate[]>;
  findPrescriptionsNeedingRefill(patientId?: string): Promise<PrescriptionAggregate[]>;
  search(filters: PrescriptionSearchFilters): Promise<PrescriptionAggregate[]>;
  count(filters: Partial<PrescriptionSearchFilters>): Promise<number>;
  delete(prescriptionId: PrescriptionId): Promise<void>;
  exists(prescriptionId: PrescriptionId): Promise<boolean>;
  getNextSequence(yearMonth: string): Promise<number>;
  findByDateRange(startDate: Date, endDate: Date, options?: { patientId?: string; doctorId?: string }): Promise<PrescriptionAggregate[]>;
}
