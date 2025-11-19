"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceMapper = void 0;
const Invoice_1 = require("../../domain/aggregates/Invoice");
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
const Money_1 = require("../../domain/value-objects/Money");
const InvoiceStatus_1 = require("../../domain/value-objects/InvoiceStatus");
const Insurance_1 = require("../../domain/value-objects/Insurance");
const InvoiceItem_1 = require("../../domain/entities/InvoiceItem");
const Payment_1 = require("../../domain/entities/Payment");
class InvoiceMapper {
    /**
     * Map from database records (normalized schema) to domain Invoice aggregate
     */
    static toDomain(record, itemRecords = [], paymentRecords = []) {
        // Map billing items from separate table
        const items = itemRecords.map((item) => InvoiceItem_1.InvoiceItem.create(item.description, item.quantity, Money_1.Money.create(item.unit_price_amount, item.unit_price_currency), item.item_id));
        // Map insurance from database fields
        const insurance = record.insurance_type
            ? Insurance_1.Insurance.create(record.insurance_issued_by || "Unknown", record.insurance_number || "", record.insurance_coverage_level || 0)
            : undefined;
        // Map payment records from separate table
        const payments = paymentRecords.map((p) => Payment_1.Payment.create(Money_1.Money.create(p.amount, p.currency), p.method, // Database stores string, cast to PaymentMethod
        p.transaction_id, p.payment_id));
        const props = {
            id: InvoiceId_1.InvoiceId.create(record.id),
            patientId: record.patient_id,
            appointmentId: record.appointment_id,
            staffId: record.doctor_id,
            invoiceNumber: record.vietnamese_invoice_number || record.invoice_id,
            items,
            subtotal: Money_1.Money.create(record.subtotal_amount, record.subtotal_currency),
            tax: Money_1.Money.create(record.tax_amount, record.tax_currency),
            // REMOVED (Phase 1 Prepaid Model): insuranceCoverage - no insurance in MVP
            totalAmount: Money_1.Money.create(record.total_amount, record.total_currency),
            outstandingAmount: Money_1.Money.create(record.patient_payment_amount, record.patient_payment_currency),
            status: InvoiceStatus_1.InvoiceStatus.create(record.status),
            // REMOVED (Phase 1 Prepaid Model): insurance - will be added in Phase 2
            payments,
            paidAt: record.paid_at ? new Date(record.paid_at) : undefined,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            finalizedAt: record.finalized_at
                ? new Date(record.finalized_at)
                : undefined,
            cancelledAt: undefined, // Not in current schema
            cancellationReason: undefined, // Not in current schema
        };
        return Reflect.construct(Invoice_1.Invoice, [props, record.id]);
    }
    /**
     * Map from domain Invoice aggregate to database records (normalized schema)
     * Returns main invoice record + separate arrays for items and payments
     */
    static toPersistence(invoice) {
        const persistence = invoice.toPersistence();
        // Main invoice record
        const issuedAtIso = persistence.createdAt.toISOString();
        const defaultDueDate = new Date(persistence.createdAt.getTime() + 30 * 60 * 1000).toISOString();
        const invoiceRecord = {
            id: persistence.id,
            invoice_id: persistence.invoiceNumber || `INV-${Date.now()}`,
            vietnamese_invoice_number: persistence.invoiceNumber,
            patient_id: persistence.patientId,
            appointment_id: persistence.appointmentId,
            doctor_id: persistence.staffId || "00000000-0000-0000-0000-000000000000",
            status: persistence.status,
            subtotal_amount: persistence.subtotal,
            subtotal_currency: persistence.currency,
            tax_amount: persistence.tax,
            tax_currency: persistence.currency,
            total_amount: persistence.totalAmount,
            total_currency: persistence.currency,
            // REMOVED (Phase 1 Prepaid Model): insurance_coverage_amount, insurance_coverage_currency - set to 0 by default in schema
            patient_payment_amount: persistence.outstandingAmount,
            patient_payment_currency: persistence.currency,
            // REMOVED (Phase 1 Prepaid Model): insurance_type, insurance_number, insurance_coverage_level, insurance_issued_by - nullable in schema for Phase 2
            issued_by: "00000000-0000-0000-0000-000000000000", // System-generated invoice
            issued_at: issuedAtIso,
            due_date: defaultDueDate,
            paid_at: persistence.paidAt?.toISOString(),
            created_at: issuedAtIso,
            updated_at: persistence.updatedAt.toISOString(),
            finalized_at: persistence.finalizedAt?.toISOString(),
            version: 1,
            contains_phi: true,
        };
        // Billing items records
        const itemRecords = persistence.items.map((item) => ({
            invoice_id: persistence.id,
            item_id: item.id,
            description: item.description,
            vietnamese_description: item.description,
            quantity: item.quantity,
            unit_price_amount: item.unitPrice,
            unit_price_currency: item.currency || persistence.currency,
            total_price_amount: item.totalPrice,
            total_price_currency: item.currency || persistence.currency,
            taxable: true,
            insurance_coverable: true,
            category: "consultation",
        }));
        // Payment records - generate unique ID for each payment record
        const paymentRecords = persistence.payments.map((p) => ({
            id: `${persistence.id}-${p.id}`, // Composite key: invoice_id + payment_id
            invoice_id: persistence.id,
            payment_id: p.id,
            amount: p.amount,
            currency: p.currency || persistence.currency,
            method: p.method,
            transaction_id: p.transactionId,
            processed_at: p.paidAt ? new Date(p.paidAt).toISOString() : new Date().toISOString(),
            processed_by: 'system', // Default to system for automated payments
            created_at: new Date().toISOString(),
        }));
        return {
            invoice: invoiceRecord,
            items: itemRecords,
            payments: paymentRecords,
        };
    }
}
exports.InvoiceMapper = InvoiceMapper;
//# sourceMappingURL=InvoiceMapper.js.map