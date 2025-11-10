"use strict";
/**
 * SupabaseBillingRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Supabase implementation of billing repository with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, Schema-per-Service, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseBillingRepository = void 0;
const BillingAggregate_1 = require("../../domain/aggregates/BillingAggregate");
const Insurance_1 = require("../../domain/value-objects/Insurance");
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
const Money_1 = require("../../domain/value-objects/Money");
/**
 * Supabase Billing Repository
 * Implements billing repository with Vietnamese healthcare compliance
 */
class SupabaseBillingRepository {
    constructor(config) {
        this.supabaseClient = config.supabase;
        this.logger = config.logger;
        this.auditService = config.auditService;
        this.schema = config.schema || 'billing_schema';
        this.tableName = config.tableName || 'invoices';
    }
    /**
     * Save billing aggregate
     */
    async save(billing) {
        try {
            this.logger.info('Saving billing aggregate to database', {
                invoiceId: billing.invoiceId.value,
                patientId: billing.patientId,
                totalAmount: billing.totalAmount.amount,
                status: billing.status
            });
            const client = await this.supabaseClient.getConnection();
            // Check if billing already exists
            const existingBilling = await this.findById(billing.invoiceId);
            if (existingBilling) {
                // Update existing billing
                await this.updateBilling(billing);
                return;
            }
            // Map aggregate to database format
            const billingRecord = this.toPersistence(billing);
            // Use upsert to handle both create and update
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .upsert(billingRecord, {
                onConflict: 'invoice_id',
                ignoreDuplicates: false
            })
                .select()
                .single();
            if (error) {
                this.logger.error('Error saving billing to database', {
                    invoiceId: billing.invoiceId.value,
                    error: error.message,
                    details: error.details
                });
                throw new Error(`Lỗi lưu hóa đơn: ${error.message}`);
            }
            // Save billing items
            if (billing.items.length > 0) {
                await this.saveBillingItems(billing.items, billing.invoiceId.value);
            }
            // HIPAA audit logging
            await this.auditService.logBillingAccess('SAVE', billing.invoiceId.value, 'SYSTEM', 'Billing record saved to database', {
                patientId: billing.patientId,
                doctorId: billing.doctorId,
                totalAmount: billing.totalAmount.amount,
                status: billing.status
            });
            // Save payments
            if (billing.payments.length > 0) {
                const paymentRecords = billing.payments.map((payment) => this.mapPaymentToRecord(payment, billing.invoiceId.value));
                const { error: paymentsError } = await client
                    .schema(this.schema)
                    .from("invoice_payments")
                    .upsert(paymentRecords, {
                    onConflict: 'payment_id',
                    ignoreDuplicates: false
                });
                if (paymentsError) {
                    throw new Error(`Failed to save payments: ${paymentsError.message}`);
                }
            }
            // Save insurance claims
            if (billing.insuranceClaims.length > 0) {
                const claimRecords = billing.insuranceClaims.map((claim) => this.mapClaimToRecord(claim, billing.invoiceId.value));
                const { error: claimsError } = await client
                    .schema(this.schema)
                    .from("insurance_claims")
                    .upsert(claimRecords, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });
                if (claimsError) {
                    throw new Error(`Failed to save insurance claims: ${claimsError.message}`);
                }
            }
            this.logger.info('Billing aggregate saved successfully', {
                invoiceId: billing.invoiceId.value,
                id: data?.id
            });
        }
        catch (error) {
            this.logger.error('Error saving billing aggregate', {
                invoiceId: billing.invoiceId.value,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Lỗi lưu hóa đơn: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find billing by invoice ID
     */
    async findById(id) {
        return this.findByStringId(id.value);
    }
    /**
     * Find billing by string ID
     */
    async findByStringId(id) {
        try {
            const client = await this.supabaseClient.getConnection();
            // Get invoice record by invoice_id (business key)
            const { data: invoiceData, error: invoiceError } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("invoice_id", id)
                .single();
            if (invoiceError || !invoiceData) {
                return null;
            }
            // Get related data using invoice_id
            const [itemsResult, paymentsResult, claimsResult] = await Promise.all([
                client.schema(this.schema).from("invoice_items").select("*").eq("invoice_id", id),
                client.schema(this.schema).from("invoice_payments").select("*").eq("invoice_id", id),
                client.schema(this.schema).from("insurance_claims").select("*").eq("invoice_id", id),
            ]);
            const items = itemsResult.data || [];
            const payments = paymentsResult.data || [];
            const claims = claimsResult.data || [];
            return this.mapFromRecord(invoiceData, items, payments, claims);
        }
        catch (error) {
            console.error("Error finding billing by ID:", error);
            throw error;
        }
    }
    /**
     * Find billings by patient ID
     */
    async findByPatientId(patientId) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("patient_id", patientId)
                .order("created_at", { ascending: false });
            if (error) {
                throw new Error(`Failed to find billings by patient ID: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                const billing = await this.findByStringId(record.invoice_id);
                if (billing) {
                    billings.push(billing);
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding billings by patient ID:", error);
            throw error;
        }
    }
    /**
     * Find billing by medical record ID
     */
    async findByMedicalRecordId(medicalRecordId) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("medical_record_id", medicalRecordId)
                .single();
            if (error || !data) {
                return null;
            }
            return this.findByStringId(data.invoice_id);
        }
        catch (error) {
            console.error("Error finding billing by medical record ID:", error);
            throw error;
        }
    }
    /**
     * Find billing by appointment ID
     */
    async findByAppointmentId(appointmentId) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("appointment_id", appointmentId)
                .single();
            if (error || !data) {
                return null;
            }
            return this.findByStringId(data.invoice_id);
        }
        catch (error) {
            console.error("Error finding billing by appointment ID:", error);
            throw error;
        }
    }
    /**
     * Find billings by doctor ID
     */
    async findByDoctorId(doctorId) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("doctor_id", doctorId)
                .order("created_at", { ascending: false });
            if (error) {
                throw new Error(`Failed to find billings by doctor ID: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                const billing = await this.findByStringId(record.invoice_id);
                if (billing) {
                    billings.push(billing);
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding billings by doctor ID:", error);
            throw error;
        }
    }
    /**
     * Find billings by status
     */
    async findByStatus(status) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .eq("status", status)
                .order("created_at", { ascending: false });
            if (error) {
                throw new Error(`Failed to find billings by status: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                const billing = await this.findByStringId(record.invoice_id);
                if (billing) {
                    billings.push(billing);
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding billings by status:", error);
            throw error;
        }
    }
    /**
     * Find overdue invoices
     */
    async findOverdueInvoices() {
        try {
            const client = await this.supabaseClient.getConnection();
            const now = new Date().toISOString();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .lt("due_date", now)
                .in("status", ["pending", "partially_paid"])
                .order("due_date", { ascending: true });
            if (error) {
                throw new Error(`Failed to find overdue invoices: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                const billing = await this.findByStringId(record.invoice_id);
                if (billing) {
                    billings.push(billing);
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding overdue invoices:", error);
            throw error;
        }
    }
    /**
     * Find billings by date range
     */
    async findByDateRange(startDate, endDate) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .gte("issued_at", startDate.toISOString())
                .lte("issued_at", endDate.toISOString())
                .order("issued_at", { ascending: false });
            if (error) {
                throw new Error(`Failed to find billings by date range: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                const billing = await this.findByStringId(record.invoice_id);
                if (billing) {
                    billings.push(billing);
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding billings by date range:", error);
            throw error;
        }
    }
    /**
     * Find billings by insurance type
     */
    async findByInsuranceType(insuranceType) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*")
                .not("insurance_data", "is", null)
                .order("created_at", { ascending: false });
            if (error) {
                throw new Error(`Failed to find billings by insurance type: ${error.message}`);
            }
            const billings = [];
            for (const record of data || []) {
                if (record.insurance_data?.type === insuranceType) {
                    const billing = await this.findByStringId(record.invoice_id);
                    if (billing) {
                        billings.push(billing);
                    }
                }
            }
            return billings;
        }
        catch (error) {
            console.error("Error finding billings by insurance type:", error);
            throw error;
        }
    }
    /**
     * Update billing aggregate
     */
    async update(billing) {
        try {
            const client = await this.supabaseClient.getConnection();
            const billingRecord = this.toPersistence(billing);
            const { error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .update({
                ...billingRecord,
                updated_at: new Date().toISOString(),
            })
                .eq("invoice_id", billing.invoiceId.value);
            if (error) {
                throw new Error(`Failed to update billing: ${error.message}`);
            }
            // Note: For simplicity, we're only updating the main billing record
            // In a production system, you might want to handle items, payments, and claims updates
        }
        catch (error) {
            console.error("Error updating billing aggregate:", error);
            throw error;
        }
    }
    /**
     * Delete billing aggregate
     */
    async delete(id) {
        try {
            const client = await this.supabaseClient.getConnection();
            // With CASCADE DELETE, we only need to delete the main invoice
            // invoice_items and invoice_payments will be automatically deleted
            const { error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .delete()
                .eq("invoice_id", id.value);
            if (error) {
                throw new Error(`Failed to delete billing: ${error.message}`);
            }
        }
        catch (error) {
            console.error("Error deleting billing aggregate:", error);
            throw error;
        }
    }
    /**
     * Check if billing exists
     */
    async exists(id) {
        try {
            const client = await this.supabaseClient.getConnection();
            const { data, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("invoice_id")
                .eq("invoice_id", id.value)
                .single();
            return !error && !!data;
        }
        catch (error) {
            console.error("Error checking billing existence:", error);
            return false;
        }
    }
    /**
     * Get total count of billings
     */
    async count() {
        try {
            const client = await this.supabaseClient.getConnection();
            const { count, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select("*", { count: "exact", head: true });
            if (error) {
                throw new Error(`Failed to count billings: ${error.message}`);
            }
            return count || 0;
        }
        catch (error) {
            console.error("Error counting billings:", error);
            throw error;
        }
    }
    // Additional methods will be implemented in the next part due to file size limit
    // Including: search, findWithPagination, bulkSave, getStatistics, etc.
    /**
     * Map billing aggregate to database record (toPersistence)
     */
    toPersistence(billing) {
        return {
            id: billing.id.value,
            invoice_id: billing.invoiceId.value, // Business key
            patient_id: billing.patientId,
            medical_record_id: billing.medicalRecordId,
            doctor_id: billing.doctorId,
            appointment_id: billing.appointmentId,
            status: billing.status,
            subtotal_amount: billing.subtotal.amount,
            subtotal_currency: billing.subtotal.currency,
            tax_amount: billing.taxAmount.amount,
            tax_currency: billing.taxAmount.currency,
            total_amount: billing.totalAmount.amount,
            total_currency: billing.totalAmount.currency,
            insurance_coverage_amount: billing.insuranceCoverage.amount,
            insurance_coverage_currency: billing.insuranceCoverage.currency,
            patient_payment_amount: billing.patientPayment.amount,
            patient_payment_currency: billing.patientPayment.currency,
            due_date: billing.dueDate.toISOString(),
            issued_at: billing.issuedAt.toISOString(),
            issued_by: billing.issuedBy,
            notes: billing.notes,
            vietnamese_invoice_number: billing.vietnameseInvoiceNumber,
            insurance_data: billing.insurance ? billing.insurance.toJSON() : null,
        };
    }
    /**
     * Alias for backward compatibility
     */
    mapToRecord(billing) {
        return this.toPersistence(billing);
    }
    /**
     * Map billing item to database record
     */
    mapItemToRecord(item, invoiceId) {
        return {
            id: item.id,
            invoice_id: invoiceId, // Changed from billing_id
            item_id: item.id, // Added for domain model
            description: item.description,
            vietnamese_description: item.vietnameseDescription,
            quantity: item.quantity,
            unit_price_amount: item.unitPrice.amount,
            unit_price_currency: item.unitPrice.currency,
            total_price_amount: item.totalPrice.amount,
            total_price_currency: item.totalPrice.currency,
            category: item.category,
            taxable: item.taxable,
            insurance_coverable: item.insuranceCoverable,
            medical_record_id: item.medicalRecordId,
            service_code: item.serviceCode,
        };
    }
    /**
     * Map payment to database record
     */
    mapPaymentToRecord(payment, invoiceId) {
        return {
            id: payment.id,
            invoice_id: invoiceId,
            payment_id: payment.id,
            amount: payment.amount.amount,
            currency: payment.amount.currency,
            method: payment.method,
            transaction_id: payment.transactionId,
            processed_at: payment.processedAt.toISOString(),
            processed_by: payment.processedBy,
            payos_data: payment.payosData,
            payos_order_code: payment.payosData?.orderCode,
            payos_transaction_id: payment.payosData?.transactionId,
            notes: payment.notes,
            metadata: undefined,
        };
    }
    /**
     * Map insurance claim to database record
     */
    mapClaimToRecord(claim, invoiceId) {
        return {
            id: claim.id,
            invoice_id: invoiceId,
            claim_id: claim.id,
            claim_number: claim.claimNumber,
            insurance_type: claim.insurance.type,
            insurance_number: claim.insurance.number,
            insurance_data: claim.insurance.toJSON(),
            claim_amount: claim.claimAmount.amount,
            approved_amount: claim.approvedAmount?.amount,
            currency: claim.claimAmount.currency,
            status: claim.status,
            submitted_at: claim.submittedAt.toISOString(),
            processed_at: claim.processedAt?.toISOString(),
            rejection_reason: claim.rejectionReason,
            metadata: undefined,
        };
    }
    /**
     * Save billing items to database
     */
    async saveBillingItems(items, invoiceId) {
        try {
            const client = await this.supabaseClient.getConnection();
            const itemRecords = items.map((item) => this.mapItemToRecord(item, invoiceId));
            const { error } = await client
                .schema(this.schema)
                .from("invoice_items")
                .upsert(itemRecords, {
                onConflict: 'item_id',
                ignoreDuplicates: false
            });
            if (error) {
                throw new Error(`Failed to save billing items: ${error.message}`);
            }
        }
        catch (error) {
            console.error("Error saving billing items:", error);
            throw error;
        }
    }
    /**
     * Update billing aggregate
     */
    async updateBilling(billing) {
        try {
            const client = await this.supabaseClient.getConnection();
            const billingRecord = this.toPersistence(billing);
            const { error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .update({
                ...billingRecord,
                updated_at: new Date().toISOString(),
            })
                .eq("invoice_id", billing.invoiceId.value);
            if (error) {
                throw new Error(`Failed to update billing: ${error.message}`);
            }
            // Update billing items
            if (billing.items.length > 0) {
                await this.saveBillingItems(billing.items, billing.invoiceId.value);
            }
            // Update payments
            if (billing.payments.length > 0) {
                const paymentRecords = billing.payments.map((payment) => this.mapPaymentToRecord(payment, billing.invoiceId.value));
                const { error: paymentsError } = await client
                    .schema(this.schema)
                    .from("invoice_payments")
                    .upsert(paymentRecords, {
                    onConflict: 'payment_id',
                    ignoreDuplicates: false
                });
                if (paymentsError) {
                    throw new Error(`Failed to update payments: ${paymentsError.message}`);
                }
            }
            // Update insurance claims
            if (billing.insuranceClaims.length > 0) {
                const claimRecords = billing.insuranceClaims.map((claim) => this.mapClaimToRecord(claim, billing.invoiceId.value));
                const { error: claimsError } = await client
                    .schema(this.schema)
                    .from("insurance_claims")
                    .upsert(claimRecords, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });
                if (claimsError) {
                    throw new Error(`Failed to update insurance claims: ${claimsError.message}`);
                }
            }
        }
        catch (error) {
            console.error("Error updating billing aggregate:", error);
            throw error;
        }
    }
    /**
     * Map database record to billing aggregate
     */
    mapFromRecord(billingRecord, itemRecords, paymentRecords, claimRecords) {
        // Map items
        const items = itemRecords.map((record) => ({
            id: record.item_id || record.id, // Use item_id from domain model
            description: record.description,
            vietnameseDescription: record.vietnamese_description,
            quantity: record.quantity,
            unitPrice: Money_1.Money.create(record.unit_price_amount, record.unit_price_currency),
            totalPrice: Money_1.Money.create(record.total_price_amount, record.total_price_currency),
            category: record.category,
            taxable: record.taxable,
            insuranceCoverable: record.insurance_coverable,
            medicalRecordId: record.medical_record_id,
            serviceCode: record.service_code,
        }));
        // Map payments
        const payments = paymentRecords.map((record) => ({
            id: record.payment_id || record.id,
            amount: Money_1.Money.create(record.amount, record.currency),
            method: record.method,
            transactionId: record.transaction_id,
            processedAt: new Date(record.processed_at),
            processedBy: record.processed_by,
            notes: record.notes,
            payosData: record.payos_data,
        }));
        // Map insurance claims
        const insuranceClaims = claimRecords.map((record) => ({
            id: record.id,
            insurance: this.mapInsuranceFromJSON(record.insurance_data),
            claimAmount: Money_1.Money.create(record.claim_amount, record.currency),
            approvedAmount: record.approved_amount
                ? Money_1.Money.create(record.approved_amount, record.currency)
                : undefined,
            status: record.status,
            submittedAt: new Date(record.submitted_at),
            processedAt: record.processed_at
                ? new Date(record.processed_at)
                : undefined,
            rejectionReason: record.rejection_reason,
            claimNumber: record.claim_number,
        }));
        // Map insurance
        const insurance = billingRecord.insurance_data
            ? this.mapInsuranceFromJSON(billingRecord.insurance_data)
            : undefined;
        // Reconstitute aggregate using invoice_id as business key
        return BillingAggregate_1.BillingAggregate.reconstitute(InvoiceId_1.InvoiceId.create(billingRecord.invoice_id), // Use invoice_id instead of id
        billingRecord.patient_id, billingRecord.medical_record_id, billingRecord.doctor_id, billingRecord.appointment_id, billingRecord.status, items, Money_1.Money.create(billingRecord.subtotal_amount, billingRecord.subtotal_currency), Money_1.Money.create(billingRecord.tax_amount, billingRecord.tax_currency), Money_1.Money.create(billingRecord.total_amount, billingRecord.total_currency), insurance, Money_1.Money.create(billingRecord.insurance_coverage_amount, billingRecord.insurance_coverage_currency), Money_1.Money.create(billingRecord.patient_payment_amount, billingRecord.patient_payment_currency), payments, insuranceClaims, new Date(billingRecord.due_date), new Date(billingRecord.issued_at), billingRecord.issued_by, billingRecord.notes, billingRecord.vietnamese_invoice_number);
    }
    /**
     * Map insurance from JSON
     */
    mapInsuranceFromJSON(data) {
        switch (data.type) {
            case "BHYT":
                return Insurance_1.Insurance.createBHYT(data.number, new Date(data.validUntil), data.coverageLevel, data.beneficiaryType, data.issuedBy);
            case "BHTN":
                return Insurance_1.Insurance.createBHTN(data.number, new Date(data.validUntil), data.accidentType, new Date(data.accidentDate), data.employerInfo);
            case "Private":
                return Insurance_1.Insurance.createPrivate(data.number, new Date(data.validUntil), data.coverageLevel, data.insuranceCompany, data.policyType);
            default:
                return Insurance_1.Insurance.createSelfPay();
        }
    }
    /**
     * Search billings with criteria - Placeholder implementation
     */
    async search(criteria) {
        // This would be a complex implementation with dynamic query building
        // For now, returning a basic structure
        return {
            results: [],
            totalCount: 0,
            pageInfo: {
                currentPage: 1,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    }
    /**
     * Get billings with pagination - Placeholder implementation
     */
    async findWithPagination(pageSize, pageNumber, sortBy, sortOrder) {
        return {
            results: [],
            totalCount: 0,
            pageInfo: {
                currentPage: pageNumber,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    }
    /**
     * Bulk save billing aggregates - Placeholder implementation
     */
    async bulkSave(billings) {
        for (const billing of billings) {
            await this.save(billing);
        }
    }
    /**
     * Find billings by multiple IDs - Placeholder implementation
     */
    async findByIds(ids) {
        const billings = [];
        for (const id of ids) {
            const billing = await this.findById(id);
            if (billing) {
                billings.push(billing);
            }
        }
        return billings;
    }
    // Additional methods (getStatistics, getRevenueReport, etc.) would be implemented here
    // These are complex reporting methods that would require extensive SQL queries
    /**
     * Get billing statistics - Placeholder implementation
     */
    async getStatistics(criteria) {
        return {
            totalInvoices: 0,
            totalAmount: Money_1.Money.zero(),
            totalPaid: Money_1.Money.zero(),
            totalPending: Money_1.Money.zero(),
            totalOverdue: Money_1.Money.zero(),
            averageInvoiceAmount: Money_1.Money.zero(),
            paymentMethodBreakdown: {},
            insuranceBreakdown: {},
            statusBreakdown: {},
            monthlyTrends: [],
        };
    }
    /**
     * Get revenue report - Placeholder implementation
     */
    async getRevenueReport(criteria) {
        return [];
    }
    /**
     * Get outstanding invoices report - Placeholder implementation
     */
    async getOutstandingInvoicesReport() {
        return {
            totalOutstanding: Money_1.Money.zero(),
            overdueCount: 0,
            overdueAmount: Money_1.Money.zero(),
            agingBreakdown: [],
            topOverduePatients: [],
        };
    }
    /**
     * Get insurance claims report - Placeholder implementation
     */
    async getInsuranceClaimsReport(criteria) {
        return {
            totalClaims: 0,
            totalClaimAmount: Money_1.Money.zero(),
            approvedClaims: 0,
            approvedAmount: Money_1.Money.zero(),
            rejectedClaims: 0,
            rejectedAmount: Money_1.Money.zero(),
            pendingClaims: 0,
            pendingAmount: Money_1.Money.zero(),
            averageProcessingDays: 0,
            claimsByInsuranceType: {},
        };
    }
    /**
     * Get payment trends - Placeholder implementation
     */
    async getPaymentTrends(criteria) {
        return [];
    }
    /**
     * Find invoices requiring attention
     */
    async findInvoicesRequiringAttention() {
        try {
            const client = await this.supabaseClient.getConnection();
            const now = new Date().toISOString();
            // Get overdue invoices
            const { data: overdueData } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .lt('due_date', now)
                .in('status', ['PENDING', 'PARTIALLY_PAID'])
                .order('due_date', { ascending: true })
                .limit(10);
            // Get high value unpaid invoices (> 10M VND)
            const { data: highValueData } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .in('status', ['PENDING', 'PARTIALLY_PAID'])
                .gte('patient_payment_amount', 10000000)
                .order('patient_payment_amount', { ascending: false })
                .limit(10);
            return {
                overdueInvoices: overdueData || [],
                expiredInsuranceInvoices: [],
                highValueUnpaidInvoices: highValueData || [],
                longPendingClaims: [],
            };
        }
        catch (error) {
            this.logger.error('Error finding invoices requiring attention', { error });
            throw error;
        }
    }
    /**
     * Get doctor billing performance
     */
    async getDoctorBillingPerformance(doctorId, dateRange) {
        try {
            const client = await this.supabaseClient.getConnection();
            // Get invoices for doctor in date range
            const { data: invoices, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .eq('doctor_id', doctorId)
                .gte('issued_at', dateRange.from.toISOString())
                .lte('issued_at', dateRange.to.toISOString());
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return {
                    totalInvoices: 0,
                    totalRevenue: Money_1.Money.zero(),
                    averageInvoiceAmount: Money_1.Money.zero(),
                    collectionRate: 0,
                    insuranceUtilization: 0,
                    topServices: [],
                    monthlyPerformance: [],
                };
            }
            // Calculate metrics
            const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
            const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const withInsurance = invoices.filter(inv => inv.insurance_data);
            return {
                totalInvoices: invoices.length,
                totalRevenue: Money_1.Money.create(totalRevenue, 'VND'),
                averageInvoiceAmount: Money_1.Money.create(totalRevenue / invoices.length, 'VND'),
                collectionRate: invoices.length > 0 ? (paidAmount / totalRevenue) * 100 : 0,
                insuranceUtilization: invoices.length > 0 ? (withInsurance.length / invoices.length) * 100 : 0,
                topServices: [],
                monthlyPerformance: [],
            };
        }
        catch (error) {
            this.logger.error('Error getting doctor billing performance', { error, doctorId });
            throw error;
        }
    }
    /**
     * Get patient billing history
     */
    async getPatientBillingHistory(patientId, limit) {
        try {
            const client = await this.supabaseClient.getConnection();
            // Get invoices for patient
            let query = client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .eq('patient_id', patientId)
                .order('issued_at', { ascending: false });
            if (limit) {
                query = query.limit(limit);
            }
            const { data: invoices, error } = await query;
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return {
                    totalInvoices: 0,
                    totalAmount: Money_1.Money.zero(),
                    totalPaid: Money_1.Money.zero(),
                    outstandingAmount: Money_1.Money.zero(),
                    paymentHistory: [],
                    insuranceUtilization: {},
                };
            }
            // Get payment history
            const { data: payments } = await client
                .schema(this.schema)
                .from('invoice_payments')
                .select('*')
                .in('invoice_id', invoices.map(inv => inv.invoice_id))
                .order('processed_at', { ascending: false });
            // Calculate totals
            const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
            const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const outstandingInvoices = invoices.filter(inv => ['PENDING', 'PARTIALLY_PAID'].includes(inv.status));
            const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
            return {
                totalInvoices: invoices.length,
                totalAmount: Money_1.Money.create(totalAmount, 'VND'),
                totalPaid: Money_1.Money.create(totalPaid, 'VND'),
                outstandingAmount: Money_1.Money.create(outstandingAmount, 'VND'),
                paymentHistory: payments || [],
                insuranceUtilization: {},
            };
        }
        catch (error) {
            this.logger.error('Error getting patient billing history', { error, patientId });
            throw error;
        }
    }
    /**
     * Generate next invoice sequence number
     */
    async getNextSequenceNumber(year, month) {
        try {
            const { data, error } = await this.supabase
                .schema(this.SCHEMA)
                .rpc('get_next_invoice_sequence', {
                p_year: year,
                p_month: month
            });
            if (error) {
                this.logger.error('[BillingRepository] Failed to get next sequence number', { error, year, month });
                throw new Error(`Failed to get next sequence number: ${error.message}`);
            }
            return data || 1;
        }
        catch (error) {
            this.logger.error('[BillingRepository] Error getting next sequence number', { error });
            throw error;
        }
    }
    /**
     * Validate invoice uniqueness - Placeholder implementation
     */
    async isInvoiceNumberUnique(invoiceNumber) {
        return true;
    }
    /**
     * Archive old invoices - Placeholder implementation
     */
    async archiveOldInvoices(olderThanDays) {
        return 0;
    }
    /**
     * Get billing summary for dashboard
     */
    async getDashboardSummary() {
        try {
            const client = await this.supabaseClient.getConnection();
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
            // Get today's revenue
            const { data: todayInvoices } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('total_amount')
                .eq('status', 'PAID')
                .gte('issued_at', todayStart);
            const todayRevenue = todayInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
            // Get month revenue
            const { data: monthInvoices } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('total_amount')
                .eq('status', 'PAID')
                .gte('issued_at', monthStart);
            const monthRevenue = monthInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
            // Get year revenue
            const { data: yearInvoices } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('total_amount')
                .eq('status', 'PAID')
                .gte('issued_at', yearStart);
            const yearRevenue = yearInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
            // Get pending invoices count
            const { count: pendingCount } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');
            // Get overdue invoices count
            const { count: overdueCount } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .lt('due_date', now.toISOString())
                .in('status', ['PENDING', 'PARTIALLY_PAID']);
            // Get recent payments
            const { data: recentPayments } = await client
                .schema(this.schema)
                .from('invoice_payments')
                .select('*')
                .order('processed_at', { ascending: false })
                .limit(10);
            return {
                todayRevenue: Money_1.Money.create(todayRevenue, 'VND'),
                monthRevenue: Money_1.Money.create(monthRevenue, 'VND'),
                yearRevenue: Money_1.Money.create(yearRevenue, 'VND'),
                pendingInvoices: pendingCount || 0,
                overdueInvoices: overdueCount || 0,
                recentPayments: recentPayments || [],
                topPaymentMethods: [],
            };
        }
        catch (error) {
            this.logger.error('Error getting dashboard summary', { error });
            throw error;
        }
    }
    // =====================================================
    // ADVANCED QUERY METHODS FOR USE CASES
    // =====================================================
    /**
     * Search invoices with advanced criteria
     */
    async search(criteria) {
        try {
            const client = await this.supabaseClient.getConnection();
            let query = client
                .schema(this.schema)
                .from(this.tableName)
                .select('*', { count: 'exact' });
            // Apply filters
            if (criteria.patientId) {
                query = query.eq('patient_id', criteria.patientId);
            }
            if (criteria.doctorId) {
                query = query.eq('doctor_id', criteria.doctorId);
            }
            if (criteria.status) {
                query = query.eq('status', criteria.status);
            }
            if (criteria.dateRange) {
                query = query
                    .gte('issued_at', criteria.dateRange.from.toISOString())
                    .lte('issued_at', criteria.dateRange.to.toISOString());
            }
            if (criteria.amountRange) {
                query = query
                    .gte('total_amount', criteria.amountRange.min.amount)
                    .lte('total_amount', criteria.amountRange.max.amount);
            }
            if (criteria.searchText) {
                query = query.or(`invoice_id.ilike.%${criteria.searchText}%,vietnamese_invoice_number.ilike.%${criteria.searchText}%`);
            }
            // Sorting
            const sortBy = criteria.sortBy || 'issued_at';
            const sortOrder = criteria.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
            query = query.order(sortBy, sortOrder);
            // Pagination
            const pageSize = criteria.pageSize || 20;
            const pageNumber = criteria.pageNumber || 1;
            const offset = (pageNumber - 1) * pageSize;
            query = query.range(offset, offset + pageSize - 1);
            const { data: records, error, count } = await query;
            if (error)
                throw error;
            // Get related data
            const results = await this.enrichInvoicesWithRelatedData(records || []);
            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / pageSize);
            return {
                results,
                totalCount,
                pageInfo: {
                    currentPage: pageNumber,
                    totalPages,
                    hasNextPage: pageNumber < totalPages,
                    hasPreviousPage: pageNumber > 1
                }
            };
        }
        catch (error) {
            this.logger.error('Error searching invoices', { error, criteria });
            throw error;
        }
    }
    /**
     * Find invoices with pagination
     */
    async findWithPagination(pageSize, pageNumber, sortBy, sortOrder) {
        try {
            const client = await this.supabaseClient.getConnection();
            const offset = (pageNumber - 1) * pageSize;
            const sort = sortBy || 'issued_at';
            const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
            const { data: records, error, count } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*', { count: 'exact' })
                .order(sort, order)
                .range(offset, offset + pageSize - 1);
            if (error)
                throw error;
            const results = await this.enrichInvoicesWithRelatedData(records || []);
            const totalCount = count || 0;
            const totalPages = Math.ceil(totalCount / pageSize);
            return {
                results,
                totalCount,
                pageInfo: {
                    currentPage: pageNumber,
                    totalPages,
                    hasNextPage: pageNumber < totalPages,
                    hasPreviousPage: pageNumber > 1
                }
            };
        }
        catch (error) {
            this.logger.error('Error finding with pagination', { error });
            throw error;
        }
    }
    /**
     * Helper: Enrich invoices with related data (items, payments)
     */
    async enrichInvoicesWithRelatedData(records) {
        if (records.length === 0)
            return [];
        const client = await this.supabaseClient.getConnection();
        const invoiceIds = records.map(r => r.invoice_id);
        const { data: items } = await client
            .schema(this.schema)
            .from('billing_items')
            .select('*')
            .in('invoice_id', invoiceIds);
        const { data: payments } = await client
            .schema(this.schema)
            .from('invoice_payments')
            .select('*')
            .in('invoice_id', invoiceIds);
        return records.map(record => {
            const recordItems = items?.filter(i => i.invoice_id === record.invoice_id) || [];
            const recordPayments = payments?.filter(p => p.invoice_id === record.invoice_id) || [];
            return this.mapToDomain(record, recordItems, recordPayments);
        });
    }
    /**
     * Get revenue report with grouping
     */
    async getRevenueReport(criteria) {
        try {
            const client = await this.supabaseClient.getConnection();
            // Get all paid invoices in date range
            let query = client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .eq('status', 'PAID')
                .gte('issued_at', criteria.dateRange.from.toISOString())
                .lte('issued_at', criteria.dateRange.to.toISOString());
            if (criteria.doctorId) {
                query = query.eq('doctor_id', criteria.doctorId);
            }
            const { data: invoices, error } = await query;
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return [];
            }
            // Group by period
            const grouped = this.groupInvoicesByPeriod(invoices, criteria.groupBy);
            // Calculate metrics for each period
            return grouped.map(group => {
                const totalRevenue = group.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
                const cashRevenue = group.invoices
                    .filter(inv => !inv.insurance_data)
                    .reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
                const insuranceRevenue = group.invoices
                    .filter(inv => inv.insurance_data)
                    .reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);
                return {
                    period: group.period,
                    totalRevenue: Money_1.Money.create(totalRevenue, 'VND'),
                    cashRevenue: Money_1.Money.create(cashRevenue, 'VND'),
                    insuranceRevenue: Money_1.Money.create(insuranceRevenue, 'VND'),
                    invoiceCount: group.invoices.length,
                    averageInvoiceAmount: Money_1.Money.create(totalRevenue / group.invoices.length, 'VND')
                };
            });
        }
        catch (error) {
            this.logger.error('Error getting revenue report', { error, criteria });
            throw error;
        }
    }
    /**
     * Get outstanding invoices report
     */
    async getOutstandingInvoicesReport() {
        try {
            const client = await this.supabaseClient.getConnection();
            const now = new Date();
            // Get all outstanding invoices
            const { data: invoices, error } = await client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .in('status', ['PENDING', 'PARTIALLY_PAID']);
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return {
                    totalOutstanding: Money_1.Money.zero(),
                    overdueCount: 0,
                    overdueAmount: Money_1.Money.zero(),
                    agingBreakdown: [],
                    topOverduePatients: []
                };
            }
            // Calculate totals
            const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
            const overdueInvoices = invoices.filter(inv => inv.due_date && new Date(inv.due_date) < now);
            const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
            // Calculate aging breakdown
            const agingBreakdown = this.calculateAgingBreakdown(invoices, now);
            // Get top overdue patients
            const topOverduePatients = this.getTopOverduePatients(overdueInvoices);
            return {
                totalOutstanding: Money_1.Money.create(totalOutstanding, 'VND'),
                overdueCount: overdueInvoices.length,
                overdueAmount: Money_1.Money.create(overdueAmount, 'VND'),
                agingBreakdown,
                topOverduePatients
            };
        }
        catch (error) {
            this.logger.error('Error getting outstanding invoices report', { error });
            throw error;
        }
    }
    /**
     * Get insurance claims report
     */
    async getInsuranceClaimsReport(criteria) {
        try {
            const client = await this.supabaseClient.getConnection();
            let query = client
                .schema(this.schema)
                .from(this.tableName)
                .select('*')
                .not('insurance_data', 'is', null);
            if (criteria?.dateRange) {
                query = query
                    .gte('issued_at', criteria.dateRange.from.toISOString())
                    .lte('issued_at', criteria.dateRange.to.toISOString());
            }
            const { data: invoices, error } = await query;
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return {
                    totalClaims: 0,
                    totalClaimAmount: Money_1.Money.zero(),
                    approvedClaims: 0,
                    approvedAmount: Money_1.Money.zero(),
                    rejectedClaims: 0,
                    rejectedAmount: Money_1.Money.zero(),
                    pendingClaims: 0,
                    pendingAmount: Money_1.Money.zero(),
                    averageProcessingDays: 0,
                    claimsByInsuranceType: {}
                };
            }
            // Calculate metrics
            const totalClaimAmount = invoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);
            const approvedInvoices = invoices.filter(inv => inv.insurance_data?.claimStatus === 'approved');
            const approvedAmount = approvedInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);
            const rejectedInvoices = invoices.filter(inv => inv.insurance_data?.claimStatus === 'rejected');
            const rejectedAmount = rejectedInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);
            const pendingInvoices = invoices.filter(inv => inv.insurance_data?.claimStatus === 'submitted');
            const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0);
            return {
                totalClaims: invoices.length,
                totalClaimAmount: Money_1.Money.create(totalClaimAmount, 'VND'),
                approvedClaims: approvedInvoices.length,
                approvedAmount: Money_1.Money.create(approvedAmount, 'VND'),
                rejectedClaims: rejectedInvoices.length,
                rejectedAmount: Money_1.Money.create(rejectedAmount, 'VND'),
                pendingClaims: pendingInvoices.length,
                pendingAmount: Money_1.Money.create(pendingAmount, 'VND'),
                averageProcessingDays: 0, // TODO: Calculate from timestamps
                claimsByInsuranceType: this.groupClaimsByInsuranceType(invoices)
            };
        }
        catch (error) {
            this.logger.error('Error getting insurance claims report', { error, criteria });
            throw error;
        }
    }
    /**
     * Get payment trends
     */
    async getPaymentTrends(criteria) {
        try {
            const client = await this.supabaseClient.getConnection();
            // Get all payments in date range
            const { data: payments, error } = await client
                .schema(this.schema)
                .from('invoice_payments')
                .select('*')
                .gte('processed_at', criteria.dateRange.from.toISOString())
                .lte('processed_at', criteria.dateRange.to.toISOString())
                .order('processed_at', { ascending: true });
            if (error)
                throw error;
            if (!payments || payments.length === 0) {
                return [];
            }
            // Group by period
            const grouped = this.groupPaymentsByPeriod(payments, criteria.groupBy);
            // Calculate metrics for each period
            return grouped.map(group => {
                const totalPayments = group.payments.reduce((sum, p) => sum + p.amount, 0);
                const paymentMethodBreakdown = this.calculatePaymentMethodBreakdown(group.payments, totalPayments);
                return {
                    period: group.period,
                    totalPayments: Money_1.Money.create(totalPayments, 'VND'),
                    paymentCount: group.payments.length,
                    averagePaymentAmount: Money_1.Money.create(totalPayments / group.payments.length, 'VND'),
                    paymentMethodBreakdown
                };
            });
        }
        catch (error) {
            this.logger.error('Error getting payment trends', { error, criteria });
            throw error;
        }
    }
    /**
     * Get statistics
     */
    async getStatistics(criteria) {
        try {
            const client = await this.supabaseClient.getConnection();
            let query = client
                .schema(this.schema)
                .from(this.tableName)
                .select('*');
            if (criteria?.dateRange) {
                query = query
                    .gte('issued_at', criteria.dateRange.from.toISOString())
                    .lte('issued_at', criteria.dateRange.to.toISOString());
            }
            if (criteria?.doctorId) {
                query = query.eq('doctor_id', criteria.doctorId);
            }
            const { data: invoices, error } = await query;
            if (error)
                throw error;
            if (!invoices || invoices.length === 0) {
                return {
                    totalInvoices: 0,
                    totalAmount: Money_1.Money.zero(),
                    totalPaid: Money_1.Money.zero(),
                    totalPending: Money_1.Money.zero(),
                    totalOverdue: Money_1.Money.zero(),
                    averageInvoiceAmount: Money_1.Money.zero(),
                    paymentMethodBreakdown: {},
                    insuranceBreakdown: {},
                    statusBreakdown: {},
                    monthlyTrends: []
                };
            }
            // Calculate totals
            const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
            const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
            const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
            const now = new Date();
            const overdueInvoices = invoices.filter(inv => inv.due_date && new Date(inv.due_date) < now && ['PENDING', 'PARTIALLY_PAID'].includes(inv.status));
            const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.patient_payment_amount, 0);
            return {
                totalInvoices: invoices.length,
                totalAmount: Money_1.Money.create(totalAmount, 'VND'),
                totalPaid: Money_1.Money.create(totalPaid, 'VND'),
                totalPending: Money_1.Money.create(totalPending, 'VND'),
                totalOverdue: Money_1.Money.create(totalOverdue, 'VND'),
                averageInvoiceAmount: Money_1.Money.create(totalAmount / invoices.length, 'VND'),
                paymentMethodBreakdown: {},
                insuranceBreakdown: this.calculateInsuranceBreakdown(invoices),
                statusBreakdown: this.calculateStatusBreakdown(invoices),
                monthlyTrends: []
            };
        }
        catch (error) {
            this.logger.error('Error getting statistics', { error, criteria });
            throw error;
        }
    }
    // =====================================================
    // HELPER METHODS
    // =====================================================
    /**
     * Group invoices by period (day/week/month)
     */
    groupInvoicesByPeriod(invoices, groupBy) {
        const groups = new Map();
        for (const invoice of invoices) {
            const date = new Date(invoice.issued_at);
            let periodKey;
            if (groupBy === 'day') {
                periodKey = date.toISOString().split('T')[0];
            }
            else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
            }
            else { // month
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!groups.has(periodKey)) {
                groups.set(periodKey, []);
            }
            groups.get(periodKey).push(invoice);
        }
        return Array.from(groups.entries()).map(([period, invoices]) => ({
            period,
            invoices
        }));
    }
    /**
     * Group payments by period
     */
    groupPaymentsByPeriod(payments, groupBy) {
        const groups = new Map();
        for (const payment of payments) {
            const date = new Date(payment.processed_at);
            let periodKey;
            if (groupBy === 'day') {
                periodKey = date.toISOString().split('T')[0];
            }
            else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
            }
            else { // month
                periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!groups.has(periodKey)) {
                groups.set(periodKey, []);
            }
            groups.get(periodKey).push(payment);
        }
        return Array.from(groups.entries()).map(([period, payments]) => ({
            period,
            payments
        }));
    }
    /**
     * Calculate aging breakdown for outstanding invoices
     */
    calculateAgingBreakdown(invoices, asOfDate) {
        const aging = {
            current: { count: 0, amount: 0 },
            days1to30: { count: 0, amount: 0 },
            days31to60: { count: 0, amount: 0 },
            days61to90: { count: 0, amount: 0 },
            over90Days: { count: 0, amount: 0 }
        };
        for (const inv of invoices) {
            const amount = inv.patient_payment_amount;
            if (!inv.due_date) {
                aging.current.count++;
                aging.current.amount += amount;
                continue;
            }
            const dueDate = new Date(inv.due_date);
            const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysOverdue <= 0) {
                aging.current.count++;
                aging.current.amount += amount;
            }
            else if (daysOverdue <= 30) {
                aging.days1to30.count++;
                aging.days1to30.amount += amount;
            }
            else if (daysOverdue <= 60) {
                aging.days31to60.count++;
                aging.days31to60.amount += amount;
            }
            else if (daysOverdue <= 90) {
                aging.days61to90.count++;
                aging.days61to90.amount += amount;
            }
            else {
                aging.over90Days.count++;
                aging.over90Days.amount += amount;
            }
        }
        return [
            { ageRange: 'Current', count: aging.current.count, amount: Money_1.Money.create(aging.current.amount, 'VND') },
            { ageRange: '1-30 days', count: aging.days1to30.count, amount: Money_1.Money.create(aging.days1to30.amount, 'VND') },
            { ageRange: '31-60 days', count: aging.days31to60.count, amount: Money_1.Money.create(aging.days31to60.amount, 'VND') },
            { ageRange: '61-90 days', count: aging.days61to90.count, amount: Money_1.Money.create(aging.days61to90.amount, 'VND') },
            { ageRange: 'Over 90 days', count: aging.over90Days.count, amount: Money_1.Money.create(aging.over90Days.amount, 'VND') }
        ];
    }
    /**
     * Get top overdue patients
     */
    getTopOverduePatients(invoices) {
        const patientMap = new Map();
        for (const inv of invoices) {
            const patientId = inv.patient_id;
            if (!patientMap.has(patientId)) {
                patientMap.set(patientId, {
                    patientId,
                    invoiceCount: 0,
                    totalAmount: 0,
                    oldestInvoiceDate: new Date(inv.issued_at)
                });
            }
            const patient = patientMap.get(patientId);
            patient.invoiceCount++;
            patient.totalAmount += inv.patient_payment_amount;
            const invoiceDate = new Date(inv.issued_at);
            if (invoiceDate < patient.oldestInvoiceDate) {
                patient.oldestInvoiceDate = invoiceDate;
            }
        }
        return Array.from(patientMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10)
            .map(p => ({
            ...p,
            totalAmount: Money_1.Money.create(p.totalAmount, 'VND')
        }));
    }
    /**
     * Calculate payment method breakdown
     */
    calculatePaymentMethodBreakdown(payments, totalAmount) {
        const methods = ['CASH', 'CARD', 'BANK_TRANSFER', 'PAYOS', 'INSURANCE_DIRECT'];
        const breakdown = {};
        for (const method of methods) {
            const filtered = payments.filter(p => p.method === method);
            const amount = filtered.reduce((sum, p) => sum + p.amount, 0);
            breakdown[method] = {
                count: filtered.length,
                amount: Money_1.Money.create(amount, 'VND'),
                percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
            };
        }
        return breakdown;
    }
    /**
     * Group claims by insurance type
     */
    groupClaimsByInsuranceType(invoices) {
        const types = ['BHYT', 'BHTN', 'Private'];
        const breakdown = {};
        for (const type of types) {
            const filtered = invoices.filter(inv => inv.insurance_data?.type === type);
            const approved = filtered.filter(inv => inv.insurance_data?.claimStatus === 'approved');
            breakdown[type] = {
                count: filtered.length,
                amount: Money_1.Money.create(filtered.reduce((sum, inv) => sum + inv.insurance_coverage_amount, 0), 'VND'),
                approvalRate: filtered.length > 0 ? (approved.length / filtered.length) * 100 : 0
            };
        }
        return breakdown;
    }
    /**
     * Calculate insurance breakdown
     */
    calculateInsuranceBreakdown(invoices) {
        const types = ['BHYT', 'BHTN', 'Private'];
        const breakdown = {};
        for (const type of types) {
            const filtered = invoices.filter(inv => inv.insurance_data?.type === type);
            breakdown[type] = {
                count: filtered.length,
                amount: Money_1.Money.create(filtered.reduce((sum, inv) => sum + inv.total_amount, 0), 'VND')
            };
        }
        return breakdown;
    }
    /**
     * Calculate status breakdown
     */
    calculateStatusBreakdown(invoices) {
        const statuses = ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];
        const breakdown = {};
        for (const status of statuses) {
            const filtered = invoices.filter(inv => inv.status === status);
            breakdown[status] = {
                count: filtered.length,
                amount: Money_1.Money.create(filtered.reduce((sum, inv) => sum + inv.total_amount, 0), 'VND')
            };
        }
        return breakdown;
    }
}
exports.SupabaseBillingRepository = SupabaseBillingRepository;
//# sourceMappingURL=SupabaseBillingRepository.js.map