"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const Invoice_1 = require("../../domain/aggregates/Invoice");
const InvoiceItem_1 = require("../../domain/entities/InvoiceItem");
const Money_1 = require("../../domain/value-objects/Money");
class CreateInvoiceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Creating invoice", { patientId: request.patientId });
        // Create invoice items
        const items = request.items.map((item) => InvoiceItem_1.InvoiceItem.create(item.description, item.quantity, Money_1.Money.create(item.unitPrice)));
        // Create invoice with insurance support
        const isWalletTopUp = Boolean(request.metadata?.walletTopUp ?? request.metadata?.wallet_top_up);
        // Build insurance value object if provided
        const { Insurance } = await Promise.resolve().then(() => __importStar(require("../../domain/value-objects/Insurance")));
        const insurance = request.insurance
            ? Insurance.create(request.insurance.provider, request.insurance.policyNumber, request.insurance.coveragePercentage)
            : undefined;
        const invoice = Invoice_1.Invoice.create(request.patientId, items, {
            taxRate: isWalletTopUp ? 0 : undefined,
            insurance,
            insuranceCoverageAmount: request.insuranceCoverageAmount ?? 0,
        });
        // Set appointment ID if provided
        if (request.appointmentId) {
            invoice.setAppointmentId(request.appointmentId);
        }
        // Set staff ID if provided
        if (request.staffId) {
            invoice.setStaffId(request.staffId);
        }
        // Set metadata if provided (doctor info, cancellation reason, etc.)
        if (request.metadata) {
            invoice.setMetadata(request.metadata);
        }
        // Save invoice
        await this.invoiceRepository.save(invoice);
        // Publish domain events
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info("Invoice created successfully", { invoiceId: invoice.id });
        return {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount.amount,
            outstandingAmount: invoice.outstandingAmount.amount,
            status: invoice.status.value,
        };
    }
}
exports.CreateInvoiceUseCase = CreateInvoiceUseCase;
//# sourceMappingURL=CreateInvoiceUseCase.js.map