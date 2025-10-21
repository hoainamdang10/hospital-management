/**
 * MockMedicalRecordRepository - Test Mock
 * Mock implementation of IMedicalRecordRepository for testing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Testing Best Practices
 */
import { IMedicalRecordRepository } from '../../src/domain/repositories/IMedicalRecordRepository';
import { MedicalRecordAggregate } from '../../src/domain/aggregates/clinical.aggregate';
import { RecordId } from '../../src/domain/value-objects/RecordId';
export declare class MockMedicalRecordRepository implements IMedicalRecordRepository {
    private records;
    private callHistory;
    constructor();
    /**
     * Save medical record
     */
    save(medicalRecord: MedicalRecordAggregate): Promise<void>;
    /**
     * Find medical record by ID
     */
    findById(id: RecordId): Promise<MedicalRecordAggregate | null>;
    /**
     * Find medical record by string ID
     */
    findByStringId(id: string): Promise<MedicalRecordAggregate | null>;
    /**
     * Find medical records by patient ID
     */
    findByPatientId(patientId: string): Promise<MedicalRecordAggregate[]>;
    /**
     * Find medical records by doctor ID
     */
    findByDoctorId(doctorId: string): Promise<MedicalRecordAggregate[]>;
    /**
     * Find medical records by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<MedicalRecordAggregate | null>;
    /**
     * Find medical records by date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<MedicalRecordAggregate[]>;
    /**
     * Search medical records with criteria
     */
    search(criteria: {
        searchText?: string;
        patientId?: string;
        doctorId?: string;
        dateRange?: {
            from: Date;
            to: Date;
        };
        diagnosisCode?: string;
        medicationCode?: string;
        status?: string;
        pageSize?: number;
        pageNumber?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        results: MedicalRecordAggregate[];
        totalCount: number;
        pageInfo: {
            currentPage: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    /**
     * Update medical record
     */
    update(medicalRecord: MedicalRecordAggregate): Promise<void>;
    /**
     * Delete medical record
     */
    delete(id: RecordId): Promise<void>;
    /**
     * Check if medical record exists
     */
    exists(id: RecordId): Promise<boolean>;
    /**
     * Get total count of medical records
     */
    count(): Promise<number>;
    /**
     * Get medical records with pagination
     */
    findWithPagination(pageSize: number, pageNumber: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        results: MedicalRecordAggregate[];
        totalCount: number;
        pageInfo: {
            currentPage: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    /**
     * Bulk save medical records
     */
    bulkSave(medicalRecords: MedicalRecordAggregate[]): Promise<void>;
    /**
     * Find medical records by multiple IDs
     */
    findByIds(ids: RecordId[]): Promise<MedicalRecordAggregate[]>;
    /**
     * Clear all records (for testing)
     */
    clear(): void;
    /**
     * Get all records (for testing)
     */
    getAllRecords(): MedicalRecordAggregate[];
    /**
     * Get call history (for testing)
     */
    getCallHistory(): Array<{
        method: string;
        args: any[];
        timestamp: Date;
    }>;
    /**
     * Get call count for a method (for testing)
     */
    getCallCount(method: string): number;
    /**
     * Get last call for a method (for testing)
     */
    getLastCall(method: string): {
        method: string;
        args: any[];
        timestamp: Date;
    } | null;
    /**
     * Set records directly (for testing)
     */
    setRecords(records: MedicalRecordAggregate[]): void;
    /**
     * Simulate database errors (for testing)
     */
    private shouldSimulateError;
    private errorToSimulate;
    simulateError(error: Error): void;
    clearErrorSimulation(): void;
    /**
     * Log method calls for testing verification
     */
    private logCall;
    /**
     * Serialize arguments for logging
     */
    private serializeArg;
    /**
     * Simulate async database operations
     */
    private simulateAsyncOperation;
    /**
     * Get performance metrics (for testing)
     */
    getPerformanceMetrics(): {
        totalCalls: number;
        averageResponseTime: number;
        callsByMethod: Record<string, number>;
        recentCalls: Array<{
            method: string;
            timestamp: Date;
        }>;
    };
}
//# sourceMappingURL=MockMedicalRecordRepository.d.ts.map