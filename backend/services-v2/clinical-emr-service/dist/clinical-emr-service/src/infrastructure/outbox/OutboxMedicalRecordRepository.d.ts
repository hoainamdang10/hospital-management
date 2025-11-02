/**
 * Outbox Medical Record Repository Wrapper - Infrastructure Layer
 * Wraps existing repository to add Transactional Outbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, ACID, Event Sourcing
 */
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IMedicalRecordRepository, MedicalRecordSearchCriteria, MedicalRecordSearchResult, PatientMedicalRecordStatistics, DoctorMedicalRecordStatistics } from '../../domain/repositories/IMedicalRecordRepository';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';
/**
 * Outbox Repository Wrapper
 * Decorates base repository with outbox pattern for guaranteed event delivery
 */
export declare class OutboxMedicalRecordRepository implements IMedicalRecordRepository {
    private baseRepository;
    private outboxRepository;
    private logger;
    constructor(baseRepository: IMedicalRecordRepository, outboxRepository: IOutboxRepository, logger: ILogger);
    /**
     * Save aggregate + events to outbox (TRANSACTIONAL)
     * CRITICAL: Both must succeed or both must fail
     */
    save(medicalRecord: MedicalRecordAggregate): Promise<void>;
    /**
     * Update aggregate + events to outbox (TRANSACTIONAL)
     */
    update(medicalRecord: MedicalRecordAggregate): Promise<void>;
    findById(recordId: RecordId): Promise<MedicalRecordAggregate | null>;
    findByPatientId(patientId: string): Promise<MedicalRecordAggregate[]>;
    findByDoctorId(doctorId: string): Promise<MedicalRecordAggregate[]>;
    exists(recordId: RecordId): Promise<boolean>;
    delete(recordId: RecordId, deletedBy: string): Promise<void>;
    search(criteria: MedicalRecordSearchCriteria): Promise<MedicalRecordSearchResult>;
    getPatientStatistics(patientId: string): Promise<PatientMedicalRecordStatistics | null>;
    getDoctorStatistics(doctorId: string, startDate: Date, endDate: Date): Promise<DoctorMedicalRecordStatistics | null>;
    grantAccess(recordId: RecordId, userId: string, permissions: string[], grantedBy: string, expiresAt?: Date): Promise<void>;
    revokeAccess(recordId: RecordId, userId: string, revokedBy: string): Promise<void>;
    hasAccess(recordId: RecordId, userId: string, requiredPermission: string): Promise<boolean>;
    getAccessHistory(recordId: RecordId): Promise<MedicalRecordAccess[]>;
}
//# sourceMappingURL=OutboxMedicalRecordRepository.d.ts.map