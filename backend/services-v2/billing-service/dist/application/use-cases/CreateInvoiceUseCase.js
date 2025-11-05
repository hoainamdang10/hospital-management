"use strict";
/**
 * CreateInvoiceUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for creating new invoices with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInvoiceUseCase = void 0;
const BillingAggregate_1 = require("../../domain/aggregates/BillingAggregate");
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
const Money_1 = require("../../domain/value-objects/Money");
const Insurance_1 = require("../../domain/value-objects/Insurance");
const BaseHealthcareUseCase_1 = require("../../../../shared/application/base/BaseHealthcareUseCase");
/**
 * Create Invoice Use Case
 * Implements invoice creation with Vietnamese healthcare compliance
 */
class CreateInvoiceUseCase extends BaseHealthcareUseCase_1.BaseHealthcareUseCase {
    constructor(billingRepository, eventBus, logger) {
        super(logger);
        this.billingRepository = billingRepository;
        this.eventBus = eventBus;
    }
    /**
     * Execute invoice creation
     */
    async executeCore(request) {
        try {
            this.logger.info('Creating new invoice', {
                patientId: request.patientId,
                doctorId: request.doctorId,
                itemCount: request.items.length,
                hasInsurance: !!request.insurance
            });
            // 1. Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Dữ liệu đầu vào không hợp lệ',
                    errors: validation.errors
                };
            }
            // 2. Generate invoice ID
            const invoiceId = await this.generateInvoiceId();
            // 3. Create billing items
            const billingItems = this.createBillingItems(request.items);
            // 4. Create insurance if provided
            let insurance;
            if (request.insurance) {
                insurance = this.createInsurance(request.insurance);
            }
            // 5. Create billing aggregate
            const billingAggregate = BillingAggregate_1.BillingAggregate.create(invoiceId, request.patientId, request.doctorId, billingItems, request.issuedBy, {
                medicalRecordId: request.medicalRecordId,
                appointmentId: request.appointmentId,
                insurance,
                notes: request.notes,
                dueDate: request.dueDate || this.calculateDefaultDueDate()
            });
            // 6. Calculate totals and insurance coverage
            billingAggregate.calculateTotals();
            if (insurance) {
                billingAggregate.applyInsuranceCoverage();
            }
            // 7. Save to repository
            await this.billingRepository.save(billingAggregate);
            // 8. Publish domain events
            const events = billingAggregate.getUncommittedEvents();
            for (const event of events) {
                await this.eventBus.publish(event);
            }
            billingAggregate.markEventsAsCommitted();
            this.logger.info('Invoice created successfully', {
                invoiceId: invoiceId.value,
                invoiceNumber: billingAggregate.invoiceNumber,
                totalAmount: billingAggregate.totalAmount.amount,
                patientId: request.patientId
            });
            return {
                success: true,
                message: 'Hóa đơn được tạo thành công',
                data: {
                    invoiceId: invoiceId.value,
                    invoiceNumber: billingAggregate.invoiceNumber,
                    totalAmount: billingAggregate.totalAmount.amount,
                    insuranceCoverage: billingAggregate.insuranceCoverage?.amount || 0,
                    patientPayable: billingAggregate.patientPayable.amount,
                    status: billingAggregate.status,
                    createdAt: billingAggregate.createdAt
                }
            };
        }
        catch (error) {
            this.logger.error('Error creating invoice', {
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: 'Lỗi tạo hóa đơn: ' + (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }
    /**
     * Validate create invoice request
     */
    validateRequest(request) {
        const errors = [];
        if (!request.patientId) {
            errors.push({
                field: 'patientId',
                message: 'Patient ID là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.doctorId) {
            errors.push({
                field: 'doctorId',
                message: 'Doctor ID là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.items || request.items.length === 0) {
            errors.push({
                field: 'items',
                message: 'Ít nhất một item là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        if (!request.issuedBy) {
            errors.push({
                field: 'issuedBy',
                message: 'Người tạo hóa đơn là bắt buộc',
                code: 'REQUIRED_FIELD'
            });
        }
        // Validate items
        request.items?.forEach((item, index) => {
            if (!item.description) {
                errors.push({
                    field: `items[${index}].description`,
                    message: 'Mô tả item là bắt buộc',
                    code: 'REQUIRED_FIELD'
                });
            }
            if (item.quantity <= 0) {
                errors.push({
                    field: `items[${index}].quantity`,
                    message: 'Số lượng phải lớn hơn 0',
                    code: 'INVALID_VALUE'
                });
            }
            if (item.unitPrice <= 0) {
                errors.push({
                    field: `items[${index}].unitPrice`,
                    message: 'Đơn giá phải lớn hơn 0',
                    code: 'INVALID_VALUE'
                });
            }
        });
        // Validate insurance if provided
        if (request.insurance) {
            if (!request.insurance.number) {
                errors.push({
                    field: 'insurance.number',
                    message: 'Số bảo hiểm là bắt buộc',
                    code: 'REQUIRED_FIELD'
                });
            }
            if (!request.insurance.validUntil || request.insurance.validUntil < new Date()) {
                errors.push({
                    field: 'insurance.validUntil',
                    message: 'Bảo hiểm đã hết hạn',
                    code: 'EXPIRED_INSURANCE'
                });
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Generate unique invoice ID
     */
    async generateInvoiceId() {
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const sequence = await this.billingRepository.getNextSequenceNumber(yearMonth);
        return InvoiceId_1.InvoiceId.generate(yearMonth, sequence);
    }
    /**
     * Create billing items from request
     */
    createBillingItems(items) {
        return items.map((item, index) => ({
            id: `item-${Date.now()}-${index}`,
            description: item.description,
            vietnameseDescription: item.vietnameseDescription,
            quantity: item.quantity,
            unitPrice: Money_1.Money.create(item.unitPrice, 'VND'),
            totalPrice: Money_1.Money.create(item.unitPrice * item.quantity, 'VND'),
            category: item.category,
            taxable: item.taxable,
            insuranceCoverable: item.insuranceCoverable,
            serviceCode: item.serviceCode
        }));
    }
    /**
     * Create insurance from request
     */
    createInsurance(insuranceData) {
        return Insurance_1.Insurance.create(insuranceData.type, insuranceData.number, insuranceData.validUntil, insuranceData.coverageLevel, {
            issuedBy: insuranceData.issuedBy,
            beneficiaryType: insuranceData.beneficiaryType,
            accidentType: insuranceData.accidentType,
            accidentDate: insuranceData.accidentDate,
            employerInfo: insuranceData.employerInfo,
            insuranceCompany: insuranceData.insuranceCompany,
            policyType: insuranceData.policyType
        });
    }
    /**
     * Calculate default due date (30 days from now)
     */
    calculateDefaultDueDate() {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        return dueDate;
    }
}
exports.CreateInvoiceUseCase = CreateInvoiceUseCase;
//# sourceMappingURL=CreateInvoiceUseCase.js.map