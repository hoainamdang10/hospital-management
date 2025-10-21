"use strict";
/**
 * MockMedicalRecordRepository - Test Mock
 * Mock implementation of IMedicalRecordRepository for testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMedicalRecordRepository = void 0;
const clinical_aggregate_1 = require("../../src/domain/aggregates/clinical.aggregate");
const RecordId_1 = require("../../src/domain/value-objects/RecordId");
class MockMedicalRecordRepository {
    constructor() {
        this.records = new Map();
        this.callHistory = [];
        /**
         * Simulate database errors (for testing)
         */
        this.shouldSimulateError = false;
        this.errorToSimulate = null;
        // Initialize with some test data if needed
    }
    /**
     * Save medical record
     */
    async save(medicalRecord) {
        this.logCall('save', [medicalRecord]);
        // Simulate database save
        this.records.set(medicalRecord.id.value, medicalRecord);
        // Simulate async operation
        await this.simulateAsyncOperation(50);
    }
    /**
     * Find medical record by ID
     */
    async findById(id) {
        this.logCall('findById', [id]);
        await this.simulateAsyncOperation(30);
        const record = this.records.get(id.value);
        return record || null;
    }
    /**
     * Find medical record by string ID
     */
    async findByStringId(id) {
        this.logCall('findByStringId', [id]);
        await this.simulateAsyncOperation(30);
        const record = this.records.get(id);
        return record || null;
    }
    /**
     * Find medical records by patient ID
     */
    async findByPatientId(patientId) {
        this.logCall('findByPatientId', [patientId]);
        await this.simulateAsyncOperation(100);
        const results = [];
        for (const record of this.records.values()) {
            if (record.patientId === patientId) {
                results.push(record);
            }
        }
        return results;
    }
    /**
     * Find medical records by doctor ID
     */
    async findByDoctorId(doctorId) {
        this.logCall('findByDoctorId', [doctorId]);
        await this.simulateAsyncOperation(100);
        const results = [];
        for (const record of this.records.values()) {
            if (record.doctorId === doctorId) {
                results.push(record);
            }
        }
        return results;
    }
    /**
     * Find medical records by appointment ID
     */
    async findByAppointmentId(appointmentId) {
        this.logCall('findByAppointmentId', [appointmentId]);
        await this.simulateAsyncOperation(50);
        for (const record of this.records.values()) {
            if (record.appointmentId === appointmentId) {
                return record;
            }
        }
        return null;
    }
    /**
     * Find medical records by date range
     */
    async findByDateRange(startDate, endDate) {
        this.logCall('findByDateRange', [startDate, endDate]);
        await this.simulateAsyncOperation(150);
        const results = [];
        for (const record of this.records.values()) {
            if (record.visitDate >= startDate && record.visitDate <= endDate) {
                results.push(record);
            }
        }
        return results;
    }
    /**
     * Search medical records with criteria
     */
    async search(criteria) {
        this.logCall('search', [criteria]);
        await this.simulateAsyncOperation(200);
        let results = Array.from(this.records.values());
        // Apply filters
        if (criteria.searchText) {
            const searchText = criteria.searchText.toLowerCase();
            results = results.filter(record => record.symptoms.toLowerCase().includes(searchText) ||
                record.examinationNotes.toLowerCase().includes(searchText) ||
                record.diagnoses.some(d => d.display.toLowerCase().includes(searchText)) ||
                record.medications.some(m => m.name.toLowerCase().includes(searchText)));
        }
        if (criteria.patientId) {
            results = results.filter(record => record.patientId === criteria.patientId);
        }
        if (criteria.doctorId) {
            results = results.filter(record => record.doctorId === criteria.doctorId);
        }
        if (criteria.dateRange) {
            results = results.filter(record => record.visitDate >= criteria.dateRange.from &&
                record.visitDate <= criteria.dateRange.to);
        }
        if (criteria.diagnosisCode) {
            results = results.filter(record => record.diagnoses.some(d => d.code.includes(criteria.diagnosisCode)));
        }
        if (criteria.medicationCode) {
            results = results.filter(record => record.medications.some(m => m.code.includes(criteria.medicationCode)));
        }
        // Apply sorting
        if (criteria.sortBy) {
            results.sort((a, b) => {
                let aValue, bValue;
                switch (criteria.sortBy) {
                    case 'visitDate':
                        aValue = a.visitDate;
                        bValue = b.visitDate;
                        break;
                    case 'patientId':
                        aValue = a.patientId;
                        bValue = b.patientId;
                        break;
                    case 'doctorId':
                        aValue = a.doctorId;
                        bValue = b.doctorId;
                        break;
                    default:
                        aValue = a.id.value;
                        bValue = b.id.value;
                }
                if (criteria.sortOrder === 'desc') {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                }
                else {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }
            });
        }
        // Apply pagination
        const pageSize = criteria.pageSize || 20;
        const pageNumber = criteria.pageNumber || 1;
        const totalCount = results.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = results.slice(startIndex, endIndex);
        return {
            results: paginatedResults,
            totalCount,
            pageInfo: {
                currentPage: pageNumber,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1
            }
        };
    }
    /**
     * Update medical record
     */
    async update(medicalRecord) {
        this.logCall('update', [medicalRecord]);
        await this.simulateAsyncOperation(75);
        if (!this.records.has(medicalRecord.id.value)) {
            throw new Error(`Medical record ${medicalRecord.id.value} not found`);
        }
        this.records.set(medicalRecord.id.value, medicalRecord);
    }
    /**
     * Delete medical record
     */
    async delete(id) {
        this.logCall('delete', [id]);
        await this.simulateAsyncOperation(50);
        if (!this.records.has(id.value)) {
            throw new Error(`Medical record ${id.value} not found`);
        }
        this.records.delete(id.value);
    }
    /**
     * Check if medical record exists
     */
    async exists(id) {
        this.logCall('exists', [id]);
        await this.simulateAsyncOperation(25);
        return this.records.has(id.value);
    }
    /**
     * Get total count of medical records
     */
    async count() {
        this.logCall('count', []);
        await this.simulateAsyncOperation(30);
        return this.records.size;
    }
    /**
     * Get medical records with pagination
     */
    async findWithPagination(pageSize, pageNumber, sortBy, sortOrder) {
        this.logCall('findWithPagination', [pageSize, pageNumber, sortBy, sortOrder]);
        return this.search({
            pageSize,
            pageNumber,
            sortBy,
            sortOrder
        });
    }
    /**
     * Bulk save medical records
     */
    async bulkSave(medicalRecords) {
        this.logCall('bulkSave', [medicalRecords]);
        await this.simulateAsyncOperation(medicalRecords.length * 20);
        for (const record of medicalRecords) {
            this.records.set(record.id.value, record);
        }
    }
    /**
     * Find medical records by multiple IDs
     */
    async findByIds(ids) {
        this.logCall('findByIds', [ids]);
        await this.simulateAsyncOperation(ids.length * 15);
        const results = [];
        for (const id of ids) {
            const record = this.records.get(id.value);
            if (record) {
                results.push(record);
            }
        }
        return results;
    }
    // Test utility methods
    /**
     * Clear all records (for testing)
     */
    clear() {
        this.records.clear();
        this.callHistory = [];
    }
    /**
     * Get all records (for testing)
     */
    getAllRecords() {
        return Array.from(this.records.values());
    }
    /**
     * Get call history (for testing)
     */
    getCallHistory() {
        return [...this.callHistory];
    }
    /**
     * Get call count for a method (for testing)
     */
    getCallCount(method) {
        return this.callHistory.filter(call => call.method === method).length;
    }
    /**
     * Get last call for a method (for testing)
     */
    getLastCall(method) {
        const calls = this.callHistory.filter(call => call.method === method);
        return calls.length > 0 ? calls[calls.length - 1] : null;
    }
    /**
     * Set records directly (for testing)
     */
    setRecords(records) {
        this.records.clear();
        for (const record of records) {
            this.records.set(record.id.value, record);
        }
    }
    simulateError(error) {
        this.shouldSimulateError = true;
        this.errorToSimulate = error;
    }
    clearErrorSimulation() {
        this.shouldSimulateError = false;
        this.errorToSimulate = null;
    }
    /**
     * Log method calls for testing verification
     */
    logCall(method, args) {
        this.callHistory.push({
            method,
            args: args.map(arg => this.serializeArg(arg)),
            timestamp: new Date()
        });
        // Check if we should simulate an error
        if (this.shouldSimulateError && this.errorToSimulate) {
            throw this.errorToSimulate;
        }
    }
    /**
     * Serialize arguments for logging
     */
    serializeArg(arg) {
        if (arg instanceof RecordId_1.RecordId) {
            return { type: 'RecordId', value: arg.value };
        }
        if (arg instanceof clinical_aggregate_1.MedicalRecordAggregate) {
            return { type: 'MedicalRecordAggregate', id: arg.id.value };
        }
        if (arg instanceof Date) {
            return { type: 'Date', value: arg.toISOString() };
        }
        return arg;
    }
    /**
     * Simulate async database operations
     */
    async simulateAsyncOperation(delayMs) {
        return new Promise(resolve => {
            setTimeout(resolve, delayMs);
        });
    }
    /**
     * Get performance metrics (for testing)
     */
    getPerformanceMetrics() {
        const totalCalls = this.callHistory.length;
        const callsByMethod = {};
        for (const call of this.callHistory) {
            callsByMethod[call.method] = (callsByMethod[call.method] || 0) + 1;
        }
        const recentCalls = this.callHistory
            .slice(-10)
            .map(call => ({ method: call.method, timestamp: call.timestamp }));
        return {
            totalCalls,
            averageResponseTime: 50, // Simulated average
            callsByMethod,
            recentCalls
        };
    }
}
exports.MockMedicalRecordRepository = MockMedicalRecordRepository;
//# sourceMappingURL=MockMedicalRecordRepository.js.map