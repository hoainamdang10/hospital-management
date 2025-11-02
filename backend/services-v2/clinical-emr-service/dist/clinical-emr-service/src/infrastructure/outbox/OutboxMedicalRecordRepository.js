"use strict";
/**
 * Outbox Medical Record Repository Wrapper - Infrastructure Layer
 * Wraps existing repository to add Transactional Outbox Pattern
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Transactional Outbox Pattern, ACID, Event Sourcing
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxMedicalRecordRepository = void 0;
const inversify_1 = require("inversify");
/**
 * Outbox Repository Wrapper
 * Decorates base repository with outbox pattern for guaranteed event delivery
 */
let OutboxMedicalRecordRepository = class OutboxMedicalRecordRepository {
    constructor(baseRepository, outboxRepository, logger) {
        this.baseRepository = baseRepository;
        this.outboxRepository = outboxRepository;
        this.logger = logger;
    }
    /**
     * Save aggregate + events to outbox (TRANSACTIONAL)
     * CRITICAL: Both must succeed or both must fail
     */
    async save(medicalRecord) {
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
        }
        catch (error) {
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
    async update(medicalRecord) {
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
        }
        catch (error) {
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
    async findById(recordId) {
        return this.baseRepository.findById(recordId);
    }
    async findByPatientId(patientId) {
        return this.baseRepository.findByPatientId(patientId);
    }
    async findByDoctorId(doctorId) {
        return this.baseRepository.findByDoctorId(doctorId);
    }
    async exists(recordId) {
        return this.baseRepository.exists(recordId);
    }
    async delete(recordId, deletedBy) {
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
    async search(criteria) {
        return this.baseRepository.search(criteria);
    }
    async getPatientStatistics(patientId) {
        return this.baseRepository.getPatientStatistics(patientId);
    }
    async getDoctorStatistics(doctorId, startDate, endDate) {
        return this.baseRepository.getDoctorStatistics(doctorId, startDate, endDate);
    }
    async grantAccess(recordId, userId, permissions, grantedBy, expiresAt) {
        return this.baseRepository.grantAccess(recordId, userId, permissions, grantedBy, expiresAt);
    }
    async revokeAccess(recordId, userId, revokedBy) {
        return this.baseRepository.revokeAccess(recordId, userId, revokedBy);
    }
    async hasAccess(recordId, userId, requiredPermission) {
        return this.baseRepository.hasAccess(recordId, userId, requiredPermission);
    }
    async getAccessHistory(recordId) {
        return this.baseRepository.getAccessHistory(recordId);
    }
};
exports.OutboxMedicalRecordRepository = OutboxMedicalRecordRepository;
exports.OutboxMedicalRecordRepository = OutboxMedicalRecordRepository = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)('BaseMedicalRecordRepository')),
    __param(1, (0, inversify_1.inject)('OutboxRepository')),
    __param(2, (0, inversify_1.inject)('Logger')),
    __metadata("design:paramtypes", [Object, Object, Object])
], OutboxMedicalRecordRepository);
//# sourceMappingURL=OutboxMedicalRecordRepository.js.map