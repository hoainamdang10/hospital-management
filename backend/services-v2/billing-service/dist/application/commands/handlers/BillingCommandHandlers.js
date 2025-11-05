"use strict";
/**
 * BillingCommandHandlers - Application Layer
 * Command handlers for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Command Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCommandHandlers = void 0;
const GenerateInvoiceUseCase_1 = require("../../use-cases/GenerateInvoiceUseCase");
const ProcessPaymentUseCase_1 = require("../../use-cases/ProcessPaymentUseCase");
const ValidateInsuranceUseCase_1 = require("../../use-cases/ValidateInsuranceUseCase");
const PayOSIntegrationService_1 = require("../../services/PayOSIntegrationService");
/**
 * BillingCommandHandlers
 * Handles all billing-related commands
 */
class BillingCommandHandlers {
    constructor(billingRepository, eventPublisher, payosConfig) {
        this.billingRepository = billingRepository;
        this.eventPublisher = eventPublisher;
        this.generateInvoiceUseCase = new GenerateInvoiceUseCase_1.GenerateInvoiceUseCase(billingRepository, eventPublisher);
        this.processPaymentUseCase = new ProcessPaymentUseCase_1.ProcessPaymentUseCase(billingRepository, eventPublisher);
        this.validateInsuranceUseCase = new ValidateInsuranceUseCase_1.ValidateInsuranceUseCase();
        this.payosService = new PayOSIntegrationService_1.PayOSIntegrationService(payosConfig.apiUrl, payosConfig.clientId, payosConfig.apiKey, payosConfig.checksumKey);
    }
    /**
     * Handle generate invoice command
     */
    async handleGenerateInvoice(command) {
        try {
            console.log(`Processing GenerateInvoiceCommand: ${command.commandId}`);
            const result = await this.generateInvoiceUseCase.execute({
                patientId: command.patientId,
                medicalRecordId: command.medicalRecordId,
                doctorId: command.doctorId,
                appointmentId: command.appointmentId,
                items: command.items,
                insurance: command.insurance,
                notes: command.notes,
                issuedBy: command.issuedBy
            });
            console.log(`GenerateInvoiceCommand ${command.commandId} completed:`, result.success);
            return result;
        }
        catch (error) {
            console.error(`Error handling GenerateInvoiceCommand ${command.commandId}:`, error);
            return {
                success: false,
                errors: [{ field: 'general', message: 'Lỗi hệ thống khi tạo hóa đơn' }],
                message: 'Không thể tạo hóa đơn'
            };
        }
    }
    /**
     * Handle process payment command
     */
    async handleProcessPayment(command) {
        try {
            console.log(`Processing ProcessPaymentCommand: ${command.commandId}`);
            const result = await this.processPaymentUseCase.execute({
                invoiceId: command.invoiceId,
                amount: command.amount,
                currency: command.currency,
                paymentMethod: command.paymentMethod,
                transactionId: command.transactionId,
                notes: command.notes,
                processedBy: command.processedBy,
                payosData: command.payosData,
                cardData: command.cardData,
                bankTransferData: command.bankTransferData
            });
            console.log(`ProcessPaymentCommand ${command.commandId} completed:`, result.success);
            return result;
        }
        catch (error) {
            console.error(`Error handling ProcessPaymentCommand ${command.commandId}:`, error);
            return {
                success: false,
                errors: [{ field: 'general', message: 'Lỗi hệ thống khi xử lý thanh toán' }],
                message: 'Không thể xử lý thanh toán'
            };
        }
    }
    /**
     * Handle validate insurance command
     */
    async handleValidateInsurance(command) {
        try {
            console.log(`Processing ValidateInsuranceCommand: ${command.commandId}`);
            const result = await this.validateInsuranceUseCase.execute({
                type: command.type,
                number: command.number,
                validUntil: command.validUntil,
                coverageLevel: command.coverageLevel,
                issuedBy: command.issuedBy,
                beneficiaryType: command.beneficiaryType,
                accidentType: command.accidentType,
                accidentDate: command.accidentDate,
                employerInfo: command.employerInfo,
                insuranceCompany: command.insuranceCompany,
                policyType: command.policyType,
                patientId: command.patientId,
                treatmentAmount: command.treatmentAmount,
                treatmentCurrency: command.treatmentCurrency
            });
            console.log(`ValidateInsuranceCommand ${command.commandId} completed:`, result.success);
            return result;
        }
        catch (error) {
            console.error(`Error handling ValidateInsuranceCommand ${command.commandId}:`, error);
            return {
                success: false,
                errors: [{ field: 'general', message: 'Lỗi hệ thống khi xác thực bảo hiểm', severity: 'error' }],
                message: 'Không thể xác thực bảo hiểm'
            };
        }
    }
    /**
     * Handle create PayOS payment command
     */
    async handleCreatePayOSPayment(command) {
        try {
            console.log(`Processing CreatePayOSPaymentCommand: ${command.commandId}`);
            // Generate order code
            const orderCode = this.payosService.generateOrderCode();
            // Create PayOS payment request
            const payosRequest = {
                orderCode,
                amount: command.amount,
                description: command.description,
                buyerName: command.buyerName,
                buyerEmail: command.buyerEmail,
                buyerPhone: command.buyerPhone,
                returnUrl: command.returnUrl,
                cancelUrl: command.cancelUrl
            };
            const result = await this.payosService.createPaymentLink(payosRequest);
            console.log(`CreatePayOSPaymentCommand ${command.commandId} completed:`, result.success);
            return result;
        }
        catch (error) {
            console.error(`Error handling CreatePayOSPaymentCommand ${command.commandId}:`, error);
            return {
                success: false,
                error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
                message: 'Không thể tạo link thanh toán PayOS'
            };
        }
    }
    /**
     * Handle process PayOS webhook command
     */
    async handleProcessPayOSWebhook(command) {
        try {
            console.log(`Processing ProcessPayOSWebhookCommand: ${command.commandId}`);
            // Process webhook
            const webhookResult = await this.payosService.processWebhook({
                code: command.webhookData.code,
                desc: command.webhookData.desc,
                data: command.webhookData.data,
                signature: command.signature
            });
            if (!webhookResult.success) {
                return webhookResult;
            }
            // If webhook is valid and payment is successful, process the payment
            if (webhookResult.data && webhookResult.data.status === 'PAID') {
                const paymentCommand = {
                    commandId: `payos-${command.commandId}`,
                    timestamp: new Date(),
                    userId: 'system',
                    invoiceId: webhookResult.data.orderCode, // Assuming orderCode maps to invoiceId
                    amount: webhookResult.data.amount,
                    currency: 'VND',
                    paymentMethod: 'payos',
                    transactionId: webhookResult.data.transactionId,
                    processedBy: 'payos-webhook',
                    payosData: {
                        orderCode: webhookResult.data.orderCode,
                        paymentLinkId: command.webhookData.data.paymentLinkId
                    }
                };
                const paymentResult = await this.handleProcessPayment(paymentCommand);
                if (!paymentResult.success) {
                    console.error('Failed to process PayOS payment:', paymentResult.errors);
                    return {
                        success: false,
                        error: { code: 'PAYMENT_PROCESSING_ERROR', desc: 'Lỗi xử lý thanh toán' },
                        message: 'Webhook hợp lệ nhưng không thể xử lý thanh toán'
                    };
                }
            }
            console.log(`ProcessPayOSWebhookCommand ${command.commandId} completed successfully`);
            return {
                success: true,
                data: webhookResult.data,
                message: 'Xử lý webhook PayOS thành công'
            };
        }
        catch (error) {
            console.error(`Error handling ProcessPayOSWebhookCommand ${command.commandId}:`, error);
            return {
                success: false,
                error: { code: 'SYSTEM_ERROR', desc: 'Lỗi hệ thống' },
                message: 'Không thể xử lý webhook PayOS'
            };
        }
    }
    /**
     * Generate command ID
     */
    static generateCommandId(prefix = 'CMD') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create generate invoice command
     */
    static createGenerateInvoiceCommand(request, userId) {
        return {
            ...request,
            commandId: this.generateCommandId('GEN-INV'),
            timestamp: new Date(),
            userId
        };
    }
    /**
     * Create process payment command
     */
    static createProcessPaymentCommand(request, userId) {
        return {
            ...request,
            commandId: this.generateCommandId('PROC-PAY'),
            timestamp: new Date(),
            userId
        };
    }
    /**
     * Create validate insurance command
     */
    static createValidateInsuranceCommand(request, userId) {
        return {
            ...request,
            commandId: this.generateCommandId('VAL-INS'),
            timestamp: new Date(),
            userId
        };
    }
    /**
     * Create PayOS payment command
     */
    static createPayOSPaymentCommand(invoiceId, amount, description, userId, buyerInfo, urls) {
        return {
            commandId: this.generateCommandId('PAYOS-CREATE'),
            timestamp: new Date(),
            userId,
            invoiceId,
            amount,
            description,
            buyerName: buyerInfo?.name,
            buyerEmail: buyerInfo?.email,
            buyerPhone: buyerInfo?.phone,
            returnUrl: urls?.returnUrl,
            cancelUrl: urls?.cancelUrl
        };
    }
    /**
     * Create PayOS webhook command
     */
    static createPayOSWebhookCommand(webhookData, signature) {
        return {
            commandId: this.generateCommandId('PAYOS-WEBHOOK'),
            timestamp: new Date(),
            webhookData,
            signature
        };
    }
}
exports.BillingCommandHandlers = BillingCommandHandlers;
//# sourceMappingURL=BillingCommandHandlers.js.map