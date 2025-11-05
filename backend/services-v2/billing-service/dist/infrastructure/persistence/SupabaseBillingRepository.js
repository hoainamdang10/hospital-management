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
        this.schema = config.schema || 'payment_schema'; // Changed from billing_schema
        this.tableName = config.tableName || 'invoices'; // Changed from billings
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
    // Save payments
    if(billing, payments, length) { }
}
exports.SupabaseBillingRepository = SupabaseBillingRepository;
 > 0;
{
    const paymentRecords = billing.payments.map((payment) => this.mapPaymentToRecord(payment, billing.id.value));
    const { error: paymentsError } = await this.supabase
        .from("payments")
        .insert(paymentRecords);
    if (paymentsError) {
        throw new Error(`Failed to save payments: ${paymentsError.message}`);
    }
}
// Save insurance claims
if (billing.insuranceClaims.length > 0) {
    const claimRecords = billing.insuranceClaims.map((claim) => this.mapClaimToRecord(claim, billing.id.value));
    const { error: claimsError } = await this.supabase
        .from("insurance_claims")
        .insert(claimRecords);
    if (claimsError) {
        throw new Error(`Failed to save insurance claims: ${claimsError.message}`);
    }
}
try { }
catch (error) {
    console.error("Error saving billing aggregate:", error);
    throw error;
}
/**
 * Find billing by invoice ID
 */
async;
findById(id, InvoiceId_1.InvoiceId);
Promise < BillingAggregate_1.BillingAggregate | null > {
    return: this.findByStringId(id.value)
};
/**
 * Find billing by string ID
 */
async;
findByStringId(id, string);
Promise < BillingAggregate_1.BillingAggregate | null > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        // Get invoice record by invoice_id (business key)
        const: { data: invoiceData, error: invoiceError } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("invoice_id", id)
            .single(),
        if(invoiceError) { }
    } || !invoiceData
};
{
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
try { }
catch (error) {
    console.error("Error finding billing by ID:", error);
    throw error;
}
/**
 * Find billings by patient ID
 */
async;
findByPatientId(patientId, string);
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false }),
        if(error) {
            throw new Error(`Failed to find billings by patient ID: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    const billing = await this.findByStringId(record.invoice_id);
    if (billing) {
        billings.push(billing);
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding billings by patient ID:", error);
    throw error;
}
/**
 * Find billing by medical record ID
 */
async;
findByMedicalRecordId(medicalRecordId, string);
Promise < BillingAggregate_1.BillingAggregate | null > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("medical_record_id", medicalRecordId)
            .single(),
        if(error) { }
    } || !data
};
{
    return null;
}
return this.findByStringId(data.invoice_id);
try { }
catch (error) {
    console.error("Error finding billing by medical record ID:", error);
    throw error;
}
/**
 * Find billing by appointment ID
 */
async;
findByAppointmentId(appointmentId, string);
Promise < BillingAggregate_1.BillingAggregate | null > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("appointment_id", appointmentId)
            .single(),
        if(error) { }
    } || !data
};
{
    return null;
}
return this.findByStringId(data.invoice_id);
try { }
catch (error) {
    console.error("Error finding billing by appointment ID:", error);
    throw error;
}
/**
 * Find billings by doctor ID
 */
async;
findByDoctorId(doctorId, string);
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("doctor_id", doctorId)
            .order("created_at", { ascending: false }),
        if(error) {
            throw new Error(`Failed to find billings by doctor ID: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    const billing = await this.findByStringId(record.invoice_id);
    if (billing) {
        billings.push(billing);
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding billings by doctor ID:", error);
    throw error;
}
/**
 * Find billings by status
 */
async;
findByStatus(status, BillingAggregate_1.InvoiceStatus);
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false }),
        if(error) {
            throw new Error(`Failed to find billings by status: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    const billing = await this.findByStringId(record.invoice_id);
    if (billing) {
        billings.push(billing);
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding billings by status:", error);
    throw error;
}
/**
 * Find overdue invoices
 */
async;
findOverdueInvoices();
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: now = new Date().toISOString(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .lt("due_date", now)
            .in("status", ["pending", "partially_paid"])
            .order("due_date", { ascending: true }),
        if(error) {
            throw new Error(`Failed to find overdue invoices: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    const billing = await this.findByStringId(record.invoice_id);
    if (billing) {
        billings.push(billing);
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding overdue invoices:", error);
    throw error;
}
/**
 * Find billings by date range
 */
async;
findByDateRange(startDate, Date, endDate, Date);
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .gte("issued_at", startDate.toISOString())
            .lte("issued_at", endDate.toISOString())
            .order("issued_at", { ascending: false }),
        if(error) {
            throw new Error(`Failed to find billings by date range: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    const billing = await this.findByStringId(record.invoice_id);
    if (billing) {
        billings.push(billing);
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding billings by date range:", error);
    throw error;
}
/**
 * Find billings by insurance type
 */
async;
findByInsuranceType(insuranceType, Insurance_1.InsuranceType);
Promise < BillingAggregate_1.BillingAggregate[] > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*")
            .not("insurance_data", "is", null)
            .order("created_at", { ascending: false }),
        if(error) {
            throw new Error(`Failed to find billings by insurance type: ${error.message}`);
        },
        const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
        for(, record, of, data) { }
    } || []
};
{
    if (record.insurance_data?.type === insuranceType) {
        const billing = await this.findByStringId(record.invoice_id);
        if (billing) {
            billings.push(billing);
        }
    }
}
return billings;
try { }
catch (error) {
    console.error("Error finding billings by insurance type:", error);
    throw error;
}
/**
 * Update billing aggregate
 */
async;
update(billing, BillingAggregate_1.BillingAggregate);
Promise < void  > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: billingRecord = this.toPersistence(billing),
        const: { error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .update({
            ...billingRecord,
            updated_at: new Date().toISOString(),
        })
            .eq("invoice_id", billing.invoiceId.value),
        if(error) {
            throw new Error(`Failed to update billing: ${error.message}`);
        }
        // Note: For simplicity, we're only updating the main billing record
        // In a production system, you might want to handle items, payments, and claims updates
    }, catch(error) {
        console.error("Error updating billing aggregate:", error);
        throw error;
    }
};
/**
 * Delete billing aggregate
 */
async;
delete (id);
InvoiceId_1.InvoiceId;
Promise < void  > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        // With CASCADE DELETE, we only need to delete the main invoice
        // invoice_items and invoice_payments will be automatically deleted
        const: { error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .delete()
            .eq("invoice_id", id.value),
        if(error) {
            throw new Error(`Failed to delete billing: ${error.message}`);
        }
    }, catch(error) {
        console.error("Error deleting billing aggregate:", error);
        throw error;
    }
};
/**
 * Check if billing exists
 */
async;
exists(id, InvoiceId_1.InvoiceId);
Promise < boolean > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { data, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("invoice_id")
            .eq("invoice_id", id.value)
            .single(),
        return: error && !!data
    }, catch(error) {
        console.error("Error checking billing existence:", error);
        return false;
    }
};
/**
 * Get total count of billings
 */
async;
count();
Promise < number > {
    try: {
        const: client = await this.supabaseClient.getConnection(),
        const: { count, error } = await client
            .schema(this.schema)
            .from(this.tableName)
            .select("*", { count: "exact", head: true }),
        if(error) {
            throw new Error(`Failed to count billings: ${error.message}`);
        },
        return: count || 0
    }, catch(error) {
        console.error("Error counting billings:", error);
        throw error;
    }
};
toPersistence(billing, BillingAggregate_1.BillingAggregate);
Omit < BillingRecord, "created_at" | "updated_at" > {
    return: {
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
    }
};
mapToRecord(billing, BillingAggregate_1.BillingAggregate);
Omit < BillingRecord, "created_at" | "updated_at" > {
    return: this.toPersistence(billing)
};
mapItemToRecord(item, BillingAggregate_1.BillingItem, invoiceId, string);
Omit < BillingItemRecord, "created_at" > {
    return: {
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
    }
};
mapPaymentToRecord(payment, BillingAggregate_1.PaymentRecord, invoiceId, string);
Omit < PaymentRecordDB, "created_at" > {
    return: {
        id: payment.id,
        invoice_id: invoiceId, // Changed from billing_id
        payment_id: payment.id, // Added for domain model
        amount_paid: payment.amount.amount, // Changed from amount
        currency: payment.amount.currency,
        payment_method: payment.method, // Changed from method
        transaction_id: payment.transactionId,
        processed_at: payment.processedAt.toISOString(),
        processed_by: payment.processedBy,
        notes: payment.notes,
        payos_data: payment.payosData,
        card_data: undefined, // Will be populated if available
        bank_transfer_data: undefined, // Will be populated if available
    }
};
mapClaimToRecord(claim, BillingAggregate_1.InsuranceClaim, billingId, string);
Omit < InsuranceClaimRecord, "created_at" | "updated_at" > {
    return: {
        id: claim.id,
        billing_id: billingId,
        insurance_data: claim.insurance.toJSON(),
        claim_amount: claim.claimAmount.amount,
        claim_currency: claim.claimAmount.currency,
        approved_amount: claim.approvedAmount?.amount,
        approved_currency: claim.approvedAmount?.currency,
        status: claim.status,
        submitted_at: claim.submittedAt.toISOString(),
        processed_at: claim.processedAt?.toISOString(),
        rejection_reason: claim.rejectionReason,
        claim_number: claim.claimNumber,
    }
};
mapFromRecord(billingRecord, BillingRecord, itemRecords, BillingItemRecord[], paymentRecords, BillingAggregate_1.PaymentRecord[], claimRecords, InsuranceClaimRecord[]);
BillingAggregate_1.BillingAggregate;
{
    // Map items
    const items = itemRecords.map((record) => ({
        id: record.id,
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
        id: record.id,
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
        claimAmount: Money_1.Money.create(record.claim_amount, record.claim_currency),
        approvedAmount: record.approved_amount
            ? Money_1.Money.create(record.approved_amount, record.approved_currency)
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
    // Reconstitute aggregate
    return BillingAggregate_1.BillingAggregate.reconstitute(InvoiceId_1.InvoiceId.create(billingRecord.id), billingRecord.patient_id, billingRecord.medical_record_id, billingRecord.doctor_id, billingRecord.appointment_id, billingRecord.status, items, Money_1.Money.create(billingRecord.subtotal_amount, billingRecord.subtotal_currency), Money_1.Money.create(billingRecord.tax_amount, billingRecord.tax_currency), Money_1.Money.create(billingRecord.total_amount, billingRecord.total_currency), insurance, Money_1.Money.create(billingRecord.insurance_coverage_amount, billingRecord.insurance_coverage_currency), Money_1.Money.create(billingRecord.patient_payment_amount, billingRecord.patient_payment_currency), payments, insuranceClaims, new Date(billingRecord.due_date), new Date(billingRecord.issued_at), billingRecord.issued_by, billingRecord.notes, billingRecord.vietnamese_invoice_number);
}
mapInsuranceFromJSON(data, any);
Insurance_1.Insurance;
{
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
async;
search(criteria, any);
Promise < any > {
    // This would be a complex implementation with dynamic query building
    // For now, returning a basic structure
    return: {
        results: [],
        totalCount: 0,
        pageInfo: {
            currentPage: 1,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        },
    }
};
/**
 * Get billings with pagination - Placeholder implementation
 */
async;
findWithPagination(pageSize, number, pageNumber, number, sortBy ?  : string, sortOrder ?  : "asc" | "desc");
Promise < any > {
    return: {
        results: [],
        totalCount: 0,
        pageInfo: {
            currentPage: pageNumber,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
        },
    }
};
/**
 * Bulk save billing aggregates - Placeholder implementation
 */
async;
bulkSave(billings, BillingAggregate_1.BillingAggregate[]);
Promise < void  > {
    for(, billing, of, billings) {
        await this.save(billing);
    }
};
/**
 * Find billings by multiple IDs - Placeholder implementation
 */
async;
findByIds(ids, InvoiceId_1.InvoiceId[]);
Promise < BillingAggregate_1.BillingAggregate[] > {
    const: billings, BillingAggregate: BillingAggregate_1.BillingAggregate, []:  = [],
    for(, id, of, ids) {
        const billing = await this.findById(id);
        if (billing) {
            billings.push(billing);
        }
    },
    return: billings
};
// Additional methods (getStatistics, getRevenueReport, etc.) would be implemented here
// These are complex reporting methods that would require extensive SQL queries
/**
 * Get billing statistics - Placeholder implementation
 */
async;
getStatistics(criteria ?  : any);
Promise < any > {
    return: {
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
    }
};
/**
 * Get revenue report - Placeholder implementation
 */
async;
getRevenueReport(criteria, any);
Promise < any[] > {
    return: []
};
/**
 * Get outstanding invoices report - Placeholder implementation
 */
async;
getOutstandingInvoicesReport();
Promise < any > {
    return: {
        totalOutstanding: Money_1.Money.zero(),
        overdueCount: 0,
        overdueAmount: Money_1.Money.zero(),
        agingBreakdown: [],
        topOverduePatients: [],
    }
};
/**
 * Get insurance claims report - Placeholder implementation
 */
async;
getInsuranceClaimsReport(criteria ?  : any);
Promise < any > {
    return: {
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
    }
};
/**
 * Get payment trends - Placeholder implementation
 */
async;
getPaymentTrends(criteria, any);
Promise < any[] > {
    return: []
};
/**
 * Find invoices requiring attention - Placeholder implementation
 */
async;
findInvoicesRequiringAttention();
Promise < any > {
    return: {
        overdueInvoices: [],
        expiredInsuranceInvoices: [],
        highValueUnpaidInvoices: [],
        longPendingClaims: [],
    }
};
/**
 * Get doctor billing performance - Placeholder implementation
 */
async;
getDoctorBillingPerformance(doctorId, string, dateRange, any);
Promise < any > {
    return: {
        totalInvoices: 0,
        totalRevenue: Money_1.Money.zero(),
        averageInvoiceAmount: Money_1.Money.zero(),
        collectionRate: 0,
        insuranceUtilization: 0,
        topServices: [],
        monthlyPerformance: [],
    }
};
/**
 * Get patient billing history - Placeholder implementation
 */
async;
getPatientBillingHistory(patientId, string, limit ?  : number);
Promise < any > {
    return: {
        totalInvoices: 0,
        totalAmount: Money_1.Money.zero(),
        totalPaid: Money_1.Money.zero(),
        outstandingAmount: Money_1.Money.zero(),
        paymentHistory: [],
        insuranceUtilization: {},
    }
};
/**
 * Generate next invoice sequence number - Placeholder implementation
 */
async;
getNextSequenceNumber(year, number, month, number);
Promise < number > {
    return: 1
};
/**
 * Validate invoice uniqueness - Placeholder implementation
 */
async;
isInvoiceNumberUnique(invoiceNumber, string);
Promise < boolean > {
    return: true
};
/**
 * Archive old invoices - Placeholder implementation
 */
async;
archiveOldInvoices(olderThanDays, number);
Promise < number > {
    return: 0
};
/**
 * Get billing summary for dashboard - Placeholder implementation
 */
async;
getDashboardSummary();
Promise < any > {
    return: {
        todayRevenue: Money_1.Money.zero(),
        monthRevenue: Money_1.Money.zero(),
        yearRevenue: Money_1.Money.zero(),
        pendingInvoices: 0,
        overdueInvoices: 0,
        recentPayments: [],
        topPaymentMethods: [],
    }
};
//# sourceMappingURL=SupabaseBillingRepository.js.map