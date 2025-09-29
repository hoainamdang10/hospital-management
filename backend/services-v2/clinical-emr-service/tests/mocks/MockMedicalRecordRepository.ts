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

export class MockMedicalRecordRepository implements IMedicalRecordRepository {
  private records: Map<string, MedicalRecordAggregate> = new Map();
  private callHistory: Array<{ method: string; args: any[]; timestamp: Date }> = [];

  constructor() {
    // Initialize with some test data if needed
  }

  /**
   * Save medical record
   */
  async save(medicalRecord: MedicalRecordAggregate): Promise<void> {
    this.logCall('save', [medicalRecord]);
    
    // Simulate database save
    this.records.set(medicalRecord.id.value, medicalRecord);
    
    // Simulate async operation
    await this.simulateAsyncOperation(50);
  }

  /**
   * Find medical record by ID
   */
  async findById(id: RecordId): Promise<MedicalRecordAggregate | null> {
    this.logCall('findById', [id]);
    
    await this.simulateAsyncOperation(30);
    
    const record = this.records.get(id.value);
    return record || null;
  }

  /**
   * Find medical record by string ID
   */
  async findByStringId(id: string): Promise<MedicalRecordAggregate | null> {
    this.logCall('findByStringId', [id]);
    
    await this.simulateAsyncOperation(30);
    
    const record = this.records.get(id);
    return record || null;
  }

  /**
   * Find medical records by patient ID
   */
  async findByPatientId(patientId: string): Promise<MedicalRecordAggregate[]> {
    this.logCall('findByPatientId', [patientId]);
    
    await this.simulateAsyncOperation(100);
    
    const results: MedicalRecordAggregate[] = [];
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
  async findByDoctorId(doctorId: string): Promise<MedicalRecordAggregate[]> {
    this.logCall('findByDoctorId', [doctorId]);
    
    await this.simulateAsyncOperation(100);
    
    const results: MedicalRecordAggregate[] = [];
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
  async findByAppointmentId(appointmentId: string): Promise<MedicalRecordAggregate | null> {
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
  async findByDateRange(startDate: Date, endDate: Date): Promise<MedicalRecordAggregate[]> {
    this.logCall('findByDateRange', [startDate, endDate]);
    
    await this.simulateAsyncOperation(150);
    
    const results: MedicalRecordAggregate[] = [];
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
  async search(criteria: {
    searchText?: string;
    patientId?: string;
    doctorId?: string;
    dateRange?: { from: Date; to: Date };
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
  }> {
    this.logCall('search', [criteria]);
    
    await this.simulateAsyncOperation(200);
    
    let results = Array.from(this.records.values());
    
    // Apply filters
    if (criteria.searchText) {
      const searchText = criteria.searchText.toLowerCase();
      results = results.filter(record => 
        record.symptoms.toLowerCase().includes(searchText) ||
        record.examinationNotes.toLowerCase().includes(searchText) ||
        record.diagnoses.some(d => d.display.toLowerCase().includes(searchText)) ||
        record.medications.some(m => m.name.toLowerCase().includes(searchText))
      );
    }
    
    if (criteria.patientId) {
      results = results.filter(record => record.patientId === criteria.patientId);
    }
    
    if (criteria.doctorId) {
      results = results.filter(record => record.doctorId === criteria.doctorId);
    }
    
    if (criteria.dateRange) {
      results = results.filter(record => 
        record.visitDate >= criteria.dateRange!.from && 
        record.visitDate <= criteria.dateRange!.to
      );
    }
    
    if (criteria.diagnosisCode) {
      results = results.filter(record => 
        record.diagnoses.some(d => d.code.includes(criteria.diagnosisCode!))
      );
    }
    
    if (criteria.medicationCode) {
      results = results.filter(record => 
        record.medications.some(m => m.code.includes(criteria.medicationCode!))
      );
    }
    
    // Apply sorting
    if (criteria.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
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
        } else {
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
  async update(medicalRecord: MedicalRecordAggregate): Promise<void> {
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
  async delete(id: RecordId): Promise<void> {
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
  async exists(id: RecordId): Promise<boolean> {
    this.logCall('exists', [id]);
    
    await this.simulateAsyncOperation(25);
    
    return this.records.has(id.value);
  }

  /**
   * Get total count of medical records
   */
  async count(): Promise<number> {
    this.logCall('count', []);
    
    await this.simulateAsyncOperation(30);
    
    return this.records.size;
  }

  /**
   * Get medical records with pagination
   */
  async findWithPagination(
    pageSize: number,
    pageNumber: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{
    results: MedicalRecordAggregate[];
    totalCount: number;
    pageInfo: {
      currentPage: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
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
  async bulkSave(medicalRecords: MedicalRecordAggregate[]): Promise<void> {
    this.logCall('bulkSave', [medicalRecords]);
    
    await this.simulateAsyncOperation(medicalRecords.length * 20);
    
    for (const record of medicalRecords) {
      this.records.set(record.id.value, record);
    }
  }

  /**
   * Find medical records by multiple IDs
   */
  async findByIds(ids: RecordId[]): Promise<MedicalRecordAggregate[]> {
    this.logCall('findByIds', [ids]);
    
    await this.simulateAsyncOperation(ids.length * 15);
    
    const results: MedicalRecordAggregate[] = [];
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
  clear(): void {
    this.records.clear();
    this.callHistory = [];
  }

  /**
   * Get all records (for testing)
   */
  getAllRecords(): MedicalRecordAggregate[] {
    return Array.from(this.records.values());
  }

  /**
   * Get call history (for testing)
   */
  getCallHistory(): Array<{ method: string; args: any[]; timestamp: Date }> {
    return [...this.callHistory];
  }

  /**
   * Get call count for a method (for testing)
   */
  getCallCount(method: string): number {
    return this.callHistory.filter(call => call.method === method).length;
  }

  /**
   * Get last call for a method (for testing)
   */
  getLastCall(method: string): { method: string; args: any[]; timestamp: Date } | null {
    const calls = this.callHistory.filter(call => call.method === method);
    return calls.length > 0 ? calls[calls.length - 1] : null;
  }

  /**
   * Set records directly (for testing)
   */
  setRecords(records: MedicalRecordAggregate[]): void {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.id.value, record);
    }
  }

  /**
   * Simulate database errors (for testing)
   */
  private shouldSimulateError = false;
  private errorToSimulate: Error | null = null;

  simulateError(error: Error): void {
    this.shouldSimulateError = true;
    this.errorToSimulate = error;
  }

  clearErrorSimulation(): void {
    this.shouldSimulateError = false;
    this.errorToSimulate = null;
  }

  /**
   * Log method calls for testing verification
   */
  private logCall(method: string, args: any[]): void {
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
  private serializeArg(arg: any): any {
    if (arg instanceof RecordId) {
      return { type: 'RecordId', value: arg.value };
    }
    if (arg instanceof MedicalRecordAggregate) {
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
  private async simulateAsyncOperation(delayMs: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, delayMs);
    });
  }

  /**
   * Get performance metrics (for testing)
   */
  getPerformanceMetrics(): {
    totalCalls: number;
    averageResponseTime: number;
    callsByMethod: Record<string, number>;
    recentCalls: Array<{ method: string; timestamp: Date }>;
  } {
    const totalCalls = this.callHistory.length;
    const callsByMethod: Record<string, number> = {};
    
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
