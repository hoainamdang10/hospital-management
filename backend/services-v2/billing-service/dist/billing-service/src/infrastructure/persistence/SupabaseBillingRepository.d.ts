/**
 * SupabaseBillingRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of billing repository with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Schema-per-Service, HIPAA
 */
import { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
import { BillingAggregate, InvoiceStatus } from "../../domain/aggregates/BillingAggregate";
import { IBillingRepository } from "../../domain/repositories/IBillingRepository";
import { InsuranceType } from "../../domain/value-objects/Insurance";
import { InvoiceId } from "../../domain/value-objects/InvoiceId";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { IAuditService } from "../../../../shared/application/services/audit.service.interface";
export interface SupabaseBillingRepositoryConfig {
    supabase: OptimizedSupabaseClient;
    logger: ILogger;
    auditService: IAuditService;
    schema: string;
    tableName: string;
}
/**
 * Supabase Billing Repository
 * Implements billing repository with Vietnamese healthcare compliance
 */
export declare class SupabaseBillingRepository implements IBillingRepository {
    private readonly supabaseClient;
    private readonly logger;
    private readonly auditService;
    private readonly schema;
    private readonly tableName;
    constructor(config: SupabaseBillingRepositoryConfig);
    /**
     * Save billing aggregate
     */
    save(billing: BillingAggregate): Promise<void>;
    /**
     * Find billing by invoice ID
     */
    findById(id: InvoiceId): Promise<BillingAggregate | null>;
    /**
     * Find billing by string ID
     */
    findByStringId(id: string): Promise<BillingAggregate | null>;
    /**
     * Find billings by patient ID
     */
    findByPatientId(patientId: string): Promise<BillingAggregate[]>;
    /**
     * Find billing by medical record ID
     */
    findByMedicalRecordId(medicalRecordId: string): Promise<BillingAggregate | null>;
    /**
     * Find billing by appointment ID
     */
    findByAppointmentId(appointmentId: string): Promise<BillingAggregate | null>;
    /**
     * Find billings by doctor ID
     */
    findByDoctorId(doctorId: string): Promise<BillingAggregate[]>;
    /**
     * Find billings by status
     */
    findByStatus(status: InvoiceStatus): Promise<BillingAggregate[]>;
    /**
     * Find overdue invoices
     */
    findOverdueInvoices(): Promise<BillingAggregate[]>;
    /**
     * Find billings by date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<BillingAggregate[]>;
    /**
     * Find billings by insurance type
     */
    findByInsuranceType(insuranceType: InsuranceType): Promise<BillingAggregate[]>;
    /**
     * Update billing aggregate
     */
    update(billing: BillingAggregate): Promise<void>;
    /**
     * Delete billing aggregate
     */
    delete(id: InvoiceId): Promise<void>;
    /**
     * Check if billing exists
     */
    exists(id: InvoiceId): Promise<boolean>;
    /**
     * Get total count of billings
     */
    count(): Promise<number>;
    /**
     * Map billing aggregate to database record (toPersistence)
     */
    private toPersistence;
    /**
     * Alias for backward compatibility
     */
    private mapToRecord;
    /**
     * Map billing item to database record
     */
    private mapItemToRecord;
    /**
     * Map payment to database record
     */
    private mapPaymentToRecord;
    /**
     * Map insurance claim to database record
     */
    private mapClaimToRecord;
    /**
     * Save billing items to database
     */
    private saveBillingItems;
    /**
     * Update billing aggregate
     */
    private updateBilling;
    /**
     * Map database record to billing aggregate
     */
    private mapFromRecord;
    /**
     * Map insurance from JSON
     */
    private mapInsuranceFromJSON;
    /**
     * Bulk save billing aggregates - Placeholder implementation
     */
    bulkSave(billings: BillingAggregate[]): Promise<void>;
    /**
     * Find billings by multiple IDs - Placeholder implementation
     */
    findByIds(ids: InvoiceId[]): Promise<BillingAggregate[]>;
    /**
     * Find invoices requiring attention
     */
    findInvoicesRequiringAttention(): Promise<any>;
    /**
     * Get doctor billing performance
     */
    getDoctorBillingPerformance(doctorId: string, dateRange: any): Promise<any>;
    /**
     * Get patient billing history
     */
    getPatientBillingHistory(patientId: string, limit?: number): Promise<any>;
    /**
     * Generate next invoice sequence number
     */
    getNextSequenceNumber(year: number, month: number): Promise<number>;
    /**
     * Validate invoice uniqueness - Placeholder implementation
     */
    isInvoiceNumberUnique(invoiceNumber: string): Promise<boolean>;
    /**
     * Archive old invoices - Placeholder implementation
     */
    archiveOldInvoices(olderThanDays: number): Promise<number>;
    /**
     * Get billing summary for dashboard
     */
    getDashboardSummary(): Promise<any>;
    /**
     * Helper: Enrich invoices with related data (items, payments)
     */
    private enrichInvoicesWithRelatedData;
    /**
     * Group invoices by period (day/week/month)
     */
    private groupInvoicesByPeriod;
    /**
     * Group payments by period
     */
    private groupPaymentsByPeriod;
    /**
     * Calculate aging breakdown for outstanding invoices
     */
    private calculateAgingBreakdown;
    /**
     * Get top overdue patients
     */
    private getTopOverduePatients;
    /**
     * Calculate payment method breakdown
     */
    private calculatePaymentMethodBreakdown;
    /**
     * Group claims by insurance type
     */
    private groupClaimsByInsuranceType;
    /**
     * Calculate insurance breakdown
     */
    private calculateInsuranceBreakdown;
    /**
     * Calculate status breakdown
     */
    private calculateStatusBreakdown;
}
//# sourceMappingURL=SupabaseBillingRepository.d.ts.map