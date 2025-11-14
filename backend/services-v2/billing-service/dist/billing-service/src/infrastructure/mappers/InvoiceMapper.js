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
            ? Insurance_1.Insurance.create(record.insurance_issued_by || 'Unknown', record.insurance_number || '', record.insurance_coverage_level || 0)
            : undefined;
        // Map payment records from separate table
        const payments = paymentRecords.map((p) => Payment_1.Payment.create(Money_1.Money.create(p.amount, p.currency), p.method, // Database stores string, cast to PaymentMethod
        p.transaction_id, p.payment_id));
        const props = {
            id: InvoiceId_1.InvoiceId.create(record.id),
            patientId: record.patient_id,
            invoiceNumber: record.vietnamese_invoice_number || record.invoice_id,
            items,
            subtotal: Money_1.Money.create(record.subtotal_amount, record.subtotal_currency),
            tax: Money_1.Money.create(record.tax_amount, record.tax_currency),
            insuranceCoverage: Money_1.Money.create(record.insurance_coverage_amount, record.insurance_coverage_currency),
            totalAmount: Money_1.Money.create(record.total_amount, record.total_currency),
            outstandingAmount: Money_1.Money.create(record.patient_payment_amount, record.patient_payment_currency),
            status: InvoiceStatus_1.InvoiceStatus.create(record.status),
            insurance,
            payments,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            finalizedAt: record.finalized_at ? new Date(record.finalized_at) : undefined,
            cancelledAt: undefined, // Not in current schema
            cancellationReason: undefined // Not in current schema
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
        const invoiceRecord = {
            id: persistence.id,
            invoice_id: persistence.invoiceNumber || `INV-${Date.now()}`,
            vietnamese_invoice_number: persistence.invoiceNumber,
            patient_id: persistence.patientId,
            status: persistence.status,
            subtotal_amount: persistence.subtotal,
            subtotal_currency: persistence.currency,
            tax_amount: persistence.tax,
            tax_currency: persistence.currency,
            total_amount: persistence.totalAmount,
            total_currency: persistence.currency,
            insurance_coverage_amount: persistence.insuranceCoverage,
            insurance_coverage_currency: persistence.currency,
            patient_payment_amount: persistence.outstandingAmount,
            patient_payment_currency: persistence.currency,
            insurance_type: persistence.insurance?.provider,
            insurance_number: persistence.insurance?.policyNumber,
            insurance_coverage_level: persistence.insurance?.coveragePercentage,
            insurance_issued_by: persistence.insurance?.provider,
            created_at: persistence.createdAt.toISOString(),
            updated_at: persistence.updatedAt.toISOString(),
            finalized_at: persistence.finalizedAt?.toISOString(),
            version: 1,
            contains_phi: true
        };
        // Billing items records
        const itemRecords = persistence.items.map((item) => ({
            invoice_id: persistence.id,
            item_id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price_amount: item.unitPrice,
            unit_price_currency: item.currency || persistence.currency,
            total_price_amount: item.totalPrice,
            total_price_currency: item.currency || persistence.currency,
            taxable: true,
            insurance_coverable: true
        }));
        // Payment records
        const paymentRecords = persistence.payments.map((p) => ({
            invoice_id: persistence.id,
            payment_id: p.id,
            amount: p.amount,
            currency: p.currency || persistence.currency,
            method: p.method,
            transaction_id: p.transactionId,
            processed_at: new Date().toISOString()
        }));
        return {
            invoice: invoiceRecord,
            items: itemRecords,
            payments: paymentRecords
        };
    }
}
exports.InvoiceMapper = InvoiceMapper;
//# sourceMappingURL=InvoiceMapper.js.map