"use strict";
/**
 * GenerateInvoiceUseCase - Application Layer
 * Use case for generating invoices from medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateInvoiceUseCase = void 0;
const BillingAggregate_1 = require("../../domain/aggregates/BillingAggregate");
const Money_1 = require("../../domain/value-objects/Money");
const Insurance_1 = require("../../domain/value-objects/Insurance");
/**
 * GenerateInvoiceUseCase
 * Handles invoice generation from medical records
 */
class GenerateInvoiceUseCase {
    constructor(billingRepository, eventPublisher) {
        this.billingRepository = billingRepository;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Execute use case
     */
    async execute(request) {
        try {
            // Validate request
            const validationErrors = this.validateRequest(request);
            if (validationErrors.length > 0) {
                return {
                    success: false,
                    errors: validationErrors,
                    message: 'Dữ liệu đầu vào không hợp lệ'
                };
            }
            // Check if invoice already exists for this medical record
            const existingInvoice = await this.billingRepository.findByMedicalRecordId(request.medicalRecordId);
            if (existingInvoice) {
                return {
                    success: false,
                    errors: [{ field: 'medicalRecordId', message: 'Hóa đơn đã tồn tại cho hồ sơ bệnh án này' }],
                    message: 'Hóa đơn đã tồn tại'
                };
            }
            // Create billing aggregate
            const billing = BillingAggregate_1.BillingAggregate.create(request.patientId, request.medicalRecordId, request.doctorId, request.appointmentId, request.issuedBy);
            // Add billing items
            for (const itemRequest of request.items) {
                const item = {
                    id: this.generateItemId(),
                    description: itemRequest.description,
                    vietnameseDescription: itemRequest.vietnameseDescription,
                    quantity: itemRequest.quantity,
                    unitPrice: Money_1.Money.createVND(itemRequest.unitPrice),
                    totalPrice: Money_1.Money.createVND(itemRequest.unitPrice * itemRequest.quantity),
                    category: itemRequest.category,
                    taxable: itemRequest.taxable,
                    insuranceCoverable: itemRequest.insuranceCoverable,
                    medicalRecordId: request.medicalRecordId,
                    serviceCode: itemRequest.serviceCode
                };
                billing.addItem(item);
            }
            // Set insurance if provided
            if (request.insurance) {
                const insurance = this.createInsurance(request.insurance);
                billing.setInsurance(insurance);
            }
            // Finalize invoice
            billing.finalize();
            // Save to repository
            await this.billingRepository.save(billing);
            // Publish domain events
            const domainEvents = billing.getUncommittedEvents();
            for (const event of domainEvents) {
                await this.eventPublisher.publish(event);
            }
            billing.markEventsAsCommitted();
            // Return response
            return {
                success: true,
                data: {
                    invoiceId: billing.id.value,
                    vietnameseInvoiceNumber: billing.vietnameseInvoiceNumber,
                    totalAmount: billing.totalAmount.amount,
                    currency: billing.totalAmount.currency,
                    insuranceCoverage: billing.insuranceCoverage.amount,
                    patientPayment: billing.patientPayment.amount,
                    status: billing.status,
                    dueDate: billing.dueDate,
                    items: billing.items.map(item => ({
                        id: item.id,
                        description: item.description,
                        vietnameseDescription: item.vietnameseDescription,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice.amount,
                        totalPrice: item.totalPrice.amount,
                        category: item.category
                    })),
                    insurance: billing.insurance ? {
                        type: billing.insurance.type,
                        number: billing.insurance.number,
                        coverageLevel: billing.insurance.coverageLevel,
                        vietnameseDisplay: billing.insurance.getVietnameseTypeDisplay()
                    } : undefined,
                    billingBreakdown: {
                        subtotal: billing.subtotal.amount,
                        taxAmount: billing.taxAmount.amount,
                        totalAmount: billing.totalAmount.amount,
                        insuranceCoverage: billing.insuranceCoverage.amount,
                        patientPayment: billing.patientPayment.amount,
                        vatRate: 10
                    },
                    vietnameseSummary: this.generateVietnameseSummary(billing)
                },
                message: 'Hóa đơn đã được tạo thành công'
            };
        }
        catch (error) {
            console.error('Error in GenerateInvoiceUseCase:', error);
            return {
                success: false,
                errors: [{ field: 'general', message: 'Lỗi hệ thống khi tạo hóa đơn' }],
                message: 'Không thể tạo hóa đơn'
            };
        }
    }
    /**
     * Validate request
     */
    validateRequest(request) {
        const errors = [];
        // Required fields
        if (!request.patientId) {
            errors.push({ field: 'patientId', message: 'Mã bệnh nhân không được để trống' });
        }
        if (!request.medicalRecordId) {
            errors.push({ field: 'medicalRecordId', message: 'Mã hồ sơ bệnh án không được để trống' });
        }
        if (!request.doctorId) {
            errors.push({ field: 'doctorId', message: 'Mã bác sĩ không được để trống' });
        }
        if (!request.appointmentId) {
            errors.push({ field: 'appointmentId', message: 'Mã cuộc hẹn không được để trống' });
        }
        if (!request.issuedBy) {
            errors.push({ field: 'issuedBy', message: 'Người tạo hóa đơn không được để trống' });
        }
        // Items validation
        if (!request.items || request.items.length === 0) {
            errors.push({ field: 'items', message: 'Hóa đơn phải có ít nhất 1 item' });
        }
        else {
            request.items.forEach((item, index) => {
                if (!item.description) {
                    errors.push({ field: `items[${index}].description`, message: 'Mô tả item không được để trống' });
                }
                if (!item.vietnameseDescription) {
                    errors.push({ field: `items[${index}].vietnameseDescription`, message: 'Mô tả tiếng Việt không được để trống' });
                }
                if (item.quantity <= 0) {
                    errors.push({ field: `items[${index}].quantity`, message: 'Số lượng phải lớn hơn 0' });
                }
                if (item.unitPrice <= 0) {
                    errors.push({ field: `items[${index}].unitPrice`, message: 'Đơn giá phải lớn hơn 0' });
                }
                if (!['consultation', 'medication', 'procedure', 'test', 'room', 'other'].includes(item.category)) {
                    errors.push({ field: `items[${index}].category`, message: 'Loại dịch vụ không hợp lệ' });
                }
            });
        }
        // Insurance validation
        if (request.insurance) {
            const insurance = request.insurance;
            if (!insurance.number) {
                errors.push({ field: 'insurance.number', message: 'Số bảo hiểm không được để trống' });
            }
            if (!insurance.validUntil) {
                errors.push({ field: 'insurance.validUntil', message: 'Ngày hết hạn bảo hiểm không được để trống' });
            }
            else if (insurance.validUntil < new Date()) {
                errors.push({ field: 'insurance.validUntil', message: 'Bảo hiểm đã hết hạn' });
            }
            if (insurance.coverageLevel < 0 || insurance.coverageLevel > 100) {
                errors.push({ field: 'insurance.coverageLevel', message: 'Mức bảo hiểm phải từ 0% đến 100%' });
            }
            // BHYT specific validation
            if (insurance.type === Insurance_1.InsuranceType.BHYT) {
                if (!this.isValidBHYTNumber(insurance.number)) {
                    errors.push({ field: 'insurance.number', message: 'Số thẻ BHYT không đúng định dạng' });
                }
                if (!insurance.beneficiaryType) {
                    errors.push({ field: 'insurance.beneficiaryType', message: 'Loại đối tượng BHYT không được để trống' });
                }
            }
            // BHTN specific validation
            if (insurance.type === Insurance_1.InsuranceType.BHTN) {
                if (!this.isValidBHTNNumber(insurance.number)) {
                    errors.push({ field: 'insurance.number', message: 'Số bảo hiểm BHTN không đúng định dạng' });
                }
                if (!insurance.accidentType) {
                    errors.push({ field: 'insurance.accidentType', message: 'Loại tai nạn không được để trống' });
                }
                if (!insurance.accidentDate) {
                    errors.push({ field: 'insurance.accidentDate', message: 'Ngày tai nạn không được để trống' });
                }
                else if (insurance.accidentDate > new Date()) {
                    errors.push({ field: 'insurance.accidentDate', message: 'Ngày tai nạn không được trong tương lai' });
                }
            }
            // Private insurance validation
            if (insurance.type === Insurance_1.InsuranceType.PRIVATE) {
                if (!insurance.insuranceCompany) {
                    errors.push({ field: 'insurance.insuranceCompany', message: 'Công ty bảo hiểm không được để trống' });
                }
                if (!insurance.policyType) {
                    errors.push({ field: 'insurance.policyType', message: 'Loại hợp đồng bảo hiểm không được để trống' });
                }
            }
        }
        return errors;
    }
    /**
     * Create insurance from request
     */
    createInsurance(insuranceRequest) {
        switch (insuranceRequest.type) {
            case Insurance_1.InsuranceType.BHYT:
                return Insurance_1.Insurance.createBHYT(insuranceRequest.number, insuranceRequest.validUntil, insuranceRequest.coverageLevel, insuranceRequest.beneficiaryType, insuranceRequest.issuedBy || 'BHXH Việt Nam');
            case Insurance_1.InsuranceType.BHTN:
                return Insurance_1.Insurance.createBHTN(insuranceRequest.number, insuranceRequest.validUntil, insuranceRequest.accidentType, insuranceRequest.accidentDate, insuranceRequest.employerInfo);
            case Insurance_1.InsuranceType.PRIVATE:
                return Insurance_1.Insurance.createPrivate(insuranceRequest.number, insuranceRequest.validUntil, insuranceRequest.coverageLevel, insuranceRequest.insuranceCompany, insuranceRequest.policyType);
            default:
                return Insurance_1.Insurance.createSelfPay();
        }
    }
    /**
     * Generate Vietnamese summary
     */
    generateVietnameseSummary(billing) {
        const itemCount = billing.items.length;
        const totalAmount = billing.totalAmount.formatVND();
        const patientPayment = billing.patientPayment.formatVND();
        const insuranceType = billing.insurance?.getVietnameseTypeDisplay() || 'Tự chi trả';
        return `Hóa đơn ${billing.vietnameseInvoiceNumber || billing.id.value} gồm ${itemCount} dịch vụ, ` +
            `tổng tiền ${totalAmount}. Bảo hiểm: ${insuranceType}. ` +
            `Bệnh nhân thanh toán: ${patientPayment}.`;
    }
    /**
     * Generate item ID
     */
    generateItemId() {
        return `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Validate BHYT number
     */
    isValidBHYTNumber(number) {
        const pattern = /^HS\d{13}$/;
        return pattern.test(number.toUpperCase());
    }
    /**
     * Validate BHTN number
     */
    isValidBHTNNumber(number) {
        const pattern = /^TN\d{13}$/;
        return pattern.test(number.toUpperCase());
    }
}
exports.GenerateInvoiceUseCase = GenerateInvoiceUseCase;
//# sourceMappingURL=GenerateInvoiceUseCase.js.map