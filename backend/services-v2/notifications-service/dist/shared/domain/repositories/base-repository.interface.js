"use strict";
/**
 * Base Repository Interface - Clean Architecture + DDD
 * Enhanced repository pattern with healthcare-specific features
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Repository Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryRegistry = exports.BaseRepository = void 0;
/**
 * Base repository implementation
 */
class BaseRepository {
    constructor(tableName, schemaName) {
        this.tableName = tableName;
        this.schemaName = schemaName;
    }
    async exists(id) {
        const aggregate = await this.findById(id);
        return aggregate !== null;
    }
    async count(_criteria) {
        // Implementation depends on database provider
        throw new Error('count method must be implemented by subclasses');
    }
    async findWithPagination(_criteria, _pagination) {
        // Implementation depends on database provider
        throw new Error('findWithPagination method must be implemented by subclasses');
    }
    async findByPatientId(_patientId) {
        // Implementation depends on aggregate type
        throw new Error('findByPatientId method must be implemented by subclasses');
    }
    async findByUserId(_userId) {
        // Implementation depends on aggregate type
        throw new Error('findByUserId method must be implemented by subclasses');
    }
    async findByDateRange(_startDate, _endDate) {
        // Implementation depends on aggregate type
        throw new Error('findByDateRange method must be implemented by subclasses');
    }
    async getAuditTrail(_aggregateId) {
        // Implementation depends on audit system
        throw new Error('getAuditTrail method must be implemented by subclasses');
    }
    async anonymize(_aggregateId) {
        // Implementation depends on aggregate type
        throw new Error('anonymize method must be implemented by subclasses');
    }
    /**
     * Validate aggregate before save
     */
    validateAggregate(aggregate) {
        aggregate.validateInvariants();
    }
    /**
     * Log HIPAA audit event
     */
    async logHIPAAAudit(action, aggregateId, userId, changes) {
        // Implementation would log to HIPAA audit system
        console.log('HIPAA Audit:', {
            action,
            aggregateId,
            userId,
            changes,
            timestamp: new Date()
        });
    }
}
exports.BaseRepository = BaseRepository;
/**
 * Simple repository registry implementation
 */
class RepositoryRegistry {
    constructor() {
        this.repositories = new Map();
    }
    register(aggregateType, repository) {
        this.repositories.set(aggregateType, repository);
    }
    get(aggregateType) {
        const repository = this.repositories.get(aggregateType);
        if (!repository) {
            throw new Error(`Repository not found for aggregate: ${aggregateType.name}`);
        }
        return repository;
    }
    has(aggregateType) {
        return this.repositories.has(aggregateType);
    }
}
exports.RepositoryRegistry = RepositoryRegistry;
//# sourceMappingURL=base-repository.interface.js.map