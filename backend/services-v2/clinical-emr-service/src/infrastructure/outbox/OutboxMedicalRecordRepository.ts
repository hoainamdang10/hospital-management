/**
 * Outbox Medical Record Repository Wrapper - Infrastructure Layer
 * Wraps existing repository to add Transactional Outbox Pattern
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, ACID, Event Sourcing
 */

import { injectable, inject } from 'inversify';
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { RecordId } from '../../domain/value-objects/RecordId';
import { 
  IMedicalRecordRepository,
  MedicalRecordSearchCriteria,
  MedicalRecordSearchResult,
  PatientMedicalRecordStatistics,
  DoctorMedicalRecordStatistics
} from '../../domain/repositories/IMedicalRecordRepository';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';

/**
 * Outbox Repository Wrapper
 * Decorates base repository with outbox pattern for guaranteed event delivery
 */
@injectable()
export class OutboxMedicalRecordRepository implements IMedicalRecordRepository {
  constructor(
    @inject('BaseMedicalRecordRepository') private baseRepository: IMedicalRecordRepository,
    @inject('OutboxRepository') private outboxRepository: IOutboxRepository,
    @inject('Logger') private logger: ILogger
  ) {}

  /**
   * Save aggregate + events to outbox (TRANSACTIONAL)
   * CRITICAL: Both must succeed or both must fail
   */
  async save(medicalRecord: MedicalRecordAggregate): Promise<void> {
    try {
      // 1. Save aggregate to database
      await this.baseRepository.save(medicalRecord);

      // 2. Get uncommitted domain events
      const events = medicalRecord.getUncommittedEvents();

      // 3. Save events to outbox (same transaction context)
      if (events.length > 0) {
        await this.outboxRepository.saveEvents(events);
        
        // 4. Mark events as committed (in-memory only)
        medicalRecord.markEventsAsCommitted();
        
        this.logger.debug('[OutboxRepository] Saved aggregate + events', {
          recordId: medicalRecord.recordId.value,
          eventCount: events.length,
        });
      }
    } catch (error) {
      this.logger.error('[OutboxRepository] Failed to save with outbox', {
        recordId: medicalRecord.recordId.value,
        error,
      });
      throw error;
    }
  }

  /**
   * Update aggregate + events to outbox (TRANSACTIONAL)
   */
  async update(medicalRecord: MedicalRecordAggregate): Promise<void> {
    try {
      // 1. Update aggregate in database
      await this.baseRepository.update(medicalRecord);

      // 2. Get uncommitted domain events
      const events = medicalRecord.getUncommittedEvents();

      // 3. Save events to outbox
      if (events.length > 0) {
        await this.outboxRepository.saveEvents(events);
        medicalRecord.markEventsAsCommitted();
        
        this.logger.debug('[OutboxRepository] Updated aggregate + events', {
          recordId: medicalRecord.recordId.value,
          eventCount: events.length,
        });
      }
    } catch (error) {
      this.logger.error('[OutboxRepository] Failed to update with outbox', {
        recordId: medicalRecord.recordId.value,
        error,
      });
      throw error;
    }
  }

  // =====================================================
  // DELEGATE ALL OTHER METHODS TO BASE REPOSITORY
  // (Read operations don't need outbox)
  // =====================================================

  async findById(recordId: RecordId): Promise<MedicalRecordAggregate | null> {
    return this.baseRepository.findById(recordId);
  }

  async findByPatientId(patientId: string): Promise<MedicalRecordAggregate[]> {
    return this.baseRepository.findByPatientId(patientId);
  }

  async findByDoctorId(doctorId: string): Promise<MedicalRecordAggregate[]> {
    return this.baseRepository.findByDoctorId(doctorId);
  }

  async exists(recordId: RecordId): Promise<boolean> {
    return this.baseRepository.exists(recordId);
  }

  async delete(recordId: RecordId, deletedBy: string): Promise<void> {
    // Delete also needs outbox for audit trail
    const record = await this.baseRepository.findById(recordId);
    if (record) {
      await this.baseRepository.delete(recordId, deletedBy);
      
      // Save deletion events to outbox
      const events = record.getUncommittedEvents();
      if (events.length > 0) {
        await this.outboxRepository.saveEvents(events);
        record.markEventsAsCommitted();
      }
    }
  }

  async search(criteria: MedicalRecordSearchCriteria): Promise<MedicalRecordSearchResult> {
    return this.baseRepository.search(criteria);
  }

  async getPatientStatistics(patientId: string): Promise<PatientMedicalRecordStatistics | null> {
    return this.baseRepository.getPatientStatistics(patientId);
  }

  async getDoctorStatistics(doctorId: string, startDate: Date, endDate: Date): Promise<DoctorMedicalRecordStatistics | null> {
    return this.baseRepository.getDoctorStatistics(doctorId, startDate, endDate);
  }

  async grantAccess(recordId: RecordId, userId: string, permissions: string[], grantedBy: string, expiresAt?: Date): Promise<void> {
    return this.baseRepository.grantAccess(recordId, userId, permissions, grantedBy, expiresAt);
  }

  async revokeAccess(recordId: RecordId, userId: string, revokedBy: string): Promise<void> {
    return this.baseRepository.revokeAccess(recordId, userId, revokedBy);
  }

  async hasAccess(recordId: RecordId, userId: string, requiredPermission: string): Promise<boolean> {
    return this.baseRepository.hasAccess(recordId, userId, requiredPermission);
  }

  async getAccessHistory(recordId: RecordId): Promise<MedicalRecordAccess[]> {
    return this.baseRepository.getAccessHistory(recordId);
  }
}
