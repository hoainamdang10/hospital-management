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
    static toDomain(record) {
        const items = record.items.map((item) => InvoiceItem_1.InvoiceItem.create(item.description, item.quantity, Money_1.Money.create(item.unitPrice, item.currency || record.currency), item.id));
        const insurance = record.insurance
            ? Insurance_1.Insurance.create(record.insurance.provider, record.insurance.policyNumber, record.insurance.coveragePercentage)
            : undefined;
        const payments = record.payments.map((p) => Payment_1.Payment.create(Money_1.Money.create(p.amount, p.currency || record.currency), p.method, p.transactionId, p.id));
        const props = {
            id: InvoiceId_1.InvoiceId.create(record.id),
            patientId: record.patient_id,
            invoiceNumber: record.invoice_number,
            items,
            subtotal: Money_1.Money.create(record.subtotal, record.currency),
            tax: Money_1.Money.create(record.tax, record.currency),
            insuranceCoverage: Money_1.Money.create(record.insurance_coverage, record.currency),
            totalAmount: Money_1.Money.create(record.total_amount, record.currency),
            outstandingAmount: Money_1.Money.create(record.outstanding_amount, record.currency),
            status: InvoiceStatus_1.InvoiceStatus.create(record.status),
            insurance,
            payments,
            createdAt: new Date(record.created_at),
            updatedAt: new Date(record.updated_at),
            finalizedAt: record.finalized_at ? new Date(record.finalized_at) : undefined,
            cancelledAt: record.cancelled_at ? new Date(record.cancelled_at) : undefined,
            cancellationReason: record.cancellation_reason
        };
        return Reflect.construct(Invoice_1.Invoice, [props, record.id]);
    }
    static toPersistence(invoice) {
        const persistence = invoice.toPersistence();
        return {
            id: persistence.id,
            patient_id: persistence.patientId,
            invoice_number: persistence.invoiceNumber,
            items: persistence.items,
            subtotal: persistence.subtotal,
            tax: persistence.tax,
            insurance_coverage: persistence.insuranceCoverage,
            total_amount: persistence.totalAmount,
            outstanding_amount: persistence.outstandingAmount,
            currency: persistence.currency,
            status: persistence.status,
            insurance: persistence.insurance,
            payments: persistence.payments,
            created_at: persistence.createdAt.toISOString(),
            updated_at: persistence.updatedAt.toISOString(),
            finalized_at: persistence.finalizedAt?.toISOString(),
            cancelled_at: persistence.cancelledAt?.toISOString(),
            cancellation_reason: persistence.cancellationReason
        };
    }
}
exports.InvoiceMapper = InvoiceMapper;
//# sourceMappingURL=InvoiceMapper.js.map