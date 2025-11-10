/**
 * IBillingRepository - Domain Layer
 * Repository interface for billing aggregate persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { BillingAggregate, InvoiceStatus, PaymentMethod } from '../aggregates/BillingAggregate';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { InsuranceType } from '../value-objects/Insurance';
export interface IBillingRepository {
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
     * Search billings with criteria
     */
    search(criteria: {
        patientId?: string;
        doctorId?: string;
        status?: InvoiceStatus;
        insuranceType?: InsuranceType;
        dateRange?: {
            from: Date;
            to: Date;
        };
        amountRange?: {
            min: Money;
            max: Money;
        };
        paymentMethod?: PaymentMethod;
        searchText?: string;
        pageSize?: number;
        pageNumber?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        results: BillingAggregate[];
        totalCount: number;
        pageInfo: {
            currentPage: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
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
     * Get billings with pagination
     */
    findWithPagination(pageSize: number, pageNumber: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<{
        results: BillingAggregate[];
        totalCount: number;
        pageInfo: {
            currentPage: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    /**
     * Bulk save billing aggregates
     */
    bulkSave(billings: BillingAggregate[]): Promise<void>;
    /**
     * Find billings by multiple IDs
     */
    findByIds(ids: InvoiceId[]): Promise<BillingAggregate[]>;
    /**
     * Get billing statistics
     */
    getStatistics(criteria?: {
        dateRange?: {
            from: Date;
            to: Date;
        };
        doctorId?: string;
        insuranceType?: InsuranceType;
    }): Promise<{
        totalInvoices: number;
        totalAmount: Money;
        totalPaid: Money;
        totalPending: Money;
        totalOverdue: Money;
        averageInvoiceAmount: Money;
        paymentMethodBreakdown: Record<PaymentMethod, {
            count: number;
            amount: Money;
        }>;
        insuranceBreakdown: Record<InsuranceType, {
            count: number;
            amount: Money;
        }>;
        statusBreakdown: Record<InvoiceStatus, {
            count: number;
            amount: Money;
        }>;
        monthlyTrends: Array<{
            month: string;
            invoiceCount: number;
            totalAmount: Money;
            paidAmount: Money;
        }>;
    }>;
    /**
     * Get revenue report
     */
    getRevenueReport(criteria: {
        dateRange: {
            from: Date;
            to: Date;
        };
        groupBy: 'day' | 'week' | 'month';
        doctorId?: string;
        insuranceType?: InsuranceType;
    }): Promise<Array<{
        period: string;
        totalRevenue: Money;
        cashRevenue: Money;
        insuranceRevenue: Money;
        invoiceCount: number;
        averageInvoiceAmount: Money;
    }>>;
    /**
     * Get outstanding invoices report
     */
    getOutstandingInvoicesReport(): Promise<{
        totalOutstanding: Money;
        overdueCount: number;
        overdueAmount: Money;
        agingBreakdown: Array<{
            ageRange: string;
            count: number;
            amount: Money;
        }>;
        topOverduePatients: Array<{
            patientId: string;
            invoiceCount: number;
            totalAmount: Money;
            oldestInvoiceDate: Date;
        }>;
    }>;
    /**
     * Get insurance claims report
     */
    getInsuranceClaimsReport(criteria?: {
        dateRange?: {
            from: Date;
            to: Date;
        };
        insuranceType?: InsuranceType;
        status?: string;
    }): Promise<{
        totalClaims: number;
        totalClaimAmount: Money;
        approvedClaims: number;
        approvedAmount: Money;
        rejectedClaims: number;
        rejectedAmount: Money;
        pendingClaims: number;
        pendingAmount: Money;
        averageProcessingDays: number;
        claimsByInsuranceType: Record<InsuranceType, {
            count: number;
            amount: Money;
            approvalRate: number;
        }>;
    }>;
    /**
     * Get payment trends
     */
    getPaymentTrends(criteria: {
        dateRange: {
            from: Date;
            to: Date;
        };
        groupBy: 'day' | 'week' | 'month';
    }): Promise<Array<{
        period: string;
        totalPayments: Money;
        paymentCount: number;
        averagePaymentAmount: Money;
        paymentMethodBreakdown: Record<PaymentMethod, {
            count: number;
            amount: Money;
            percentage: number;
        }>;
    }>>;
    /**
     * Find invoices requiring attention
     */
    findInvoicesRequiringAttention(): Promise<{
        overdueInvoices: BillingAggregate[];
        expiredInsuranceInvoices: BillingAggregate[];
        highValueUnpaidInvoices: BillingAggregate[];
        longPendingClaims: BillingAggregate[];
    }>;
    /**
     * Get doctor billing performance
     */
    getDoctorBillingPerformance(doctorId: string, dateRange: {
        from: Date;
        to: Date;
    }): Promise<{
        totalInvoices: number;
        totalRevenue: Money;
        averageInvoiceAmount: Money;
        collectionRate: number;
        insuranceUtilization: number;
        topServices: Array<{
            serviceDescription: string;
            count: number;
            revenue: Money;
        }>;
        monthlyPerformance: Array<{
            month: string;
            invoiceCount: number;
            revenue: Money;
            collectionRate: number;
        }>;
    }>;
    /**
     * Get patient billing history
     */
    getPatientBillingHistory(patientId: string, limit?: number): Promise<{
        totalInvoices: number;
        totalAmount: Money;
        totalPaid: Money;
        outstandingAmount: Money;
        paymentHistory: Array<{
            invoiceId: string;
            amount: Money;
            paymentDate: Date;
            paymentMethod: PaymentMethod;
        }>;
        insuranceUtilization: Record<InsuranceType, {
            invoiceCount: number;
            totalAmount: Money;
            coverageAmount: Money;
        }>;
    }>;
    /**
     * Generate next invoice sequence number
     */
    getNextSequenceNumber(year: number, month: number): Promise<number>;
    /**
     * Validate invoice uniqueness
     */
    isInvoiceNumberUnique(invoiceNumber: string): Promise<boolean>;
    /**
     * Archive old invoices
     */
    archiveOldInvoices(olderThanDays: number): Promise<number>;
    /**
     * Get billing summary for dashboard
     */
    getDashboardSummary(): Promise<{
        todayRevenue: Money;
        monthRevenue: Money;
        yearRevenue: Money;
        pendingInvoices: number;
        overdueInvoices: number;
        recentPayments: Array<{
            invoiceId: string;
            patientId: string;
            amount: Money;
            paymentDate: Date;
            paymentMethod: PaymentMethod;
        }>;
        topPaymentMethods: Array<{
            method: PaymentMethod;
            count: number;
            amount: Money;
            percentage: number;
        }>;
    }>;
}
//# sourceMappingURL=IBillingRepository.d.ts.map