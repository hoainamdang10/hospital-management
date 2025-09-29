/**
 * BillingCommandHandlers - Application Layer
 * Command handlers for billing operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Command Pattern
 */

import { IBillingRepository } from '../../../domain/repositories/IBillingRepository';
import { IDomainEventPublisher } from '../../../../../shared/domain/events/IDomainEventPublisher';
import { GenerateInvoiceUseCase, GenerateInvoiceRequest, GenerateInvoiceResponse } from '../../use-cases/GenerateInvoiceUseCase';
import { ProcessPaymentUseCase, ProcessPaymentRequest, ProcessPaymentResponse } from '../../use-cases/ProcessPaymentUseCase';
import { ValidateInsuranceUseCase, ValidateInsuranceRequest, ValidateInsuranceResponse } from '../../use-cases/ValidateInsuranceUseCase';
import { PayOSIntegrationService } from '../../services/PayOSIntegrationService';

// Command interfaces
export interface GenerateInvoiceCommand extends GenerateInvoiceRequest {
  commandId: string;
  timestamp: Date;
  userId: string;
}

export interface ProcessPaymentCommand extends ProcessPaymentRequest {
  commandId: string;
  timestamp: Date;
  userId: string;
}

export interface ValidateInsuranceCommand extends ValidateInsuranceRequest {
  commandId: string;
  timestamp: Date;
  userId: string;
}

export interface CreatePayOSPaymentCommand {
  commandId: string;
  timestamp: Date;
  userId: string;
  invoiceId: string;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ProcessPayOSWebhookCommand {
  commandId: string;
  timestamp: Date;
  webhookData: any;
  signature: string;
}

/**
 * BillingCommandHandlers
 * Handles all billing-related commands
 */
export class BillingCommandHandlers {
  private readonly generateInvoiceUseCase: GenerateInvoiceUseCase;
  private readonly processPaymentUseCase: ProcessPaymentUseCase;
  private readonly validateInsuranceUseCase: ValidateInsuranceUseCase;
  private readonly payosService: PayOSIntegrationService;

  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventPublisher: IDomainEventPublisher,
    payosConfig: {
      apiUrl: string;
      clientId: string;
      apiKey: string;
      checksumKey: string;
    }
  ) {
    this.generateInvoiceUseCase = new GenerateInvoiceUseCase(billingRepository, eventPublisher);
    this.processPaymentUseCase = new ProcessPaymentUseCase(billingRepository, eventPublisher);
    this.validateInsuranceUseCase = new ValidateInsuranceUseCase();
    this.payosService = new PayOSIntegrationService(
      payosConfig.apiUrl,
      payosConfig.clientId,
      payosConfig.apiKey,
      payosConfig.checksumKey
    );
  }

  /**
   * Handle generate invoice command
   */
  async handleGenerateInvoice(command: GenerateInvoiceCommand): Promise<GenerateInvoiceResponse> {
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

    } catch (error) {
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
  async handleProcessPayment(command: ProcessPaymentCommand): Promise<ProcessPaymentResponse> {
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

    } catch (error) {
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
  async handleValidateInsurance(command: ValidateInsuranceCommand): Promise<ValidateInsuranceResponse> {
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

    } catch (error) {
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
  async handleCreatePayOSPayment(command: CreatePayOSPaymentCommand): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; desc: string };
    message: string;
  }> {
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

    } catch (error) {
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
  async handleProcessPayOSWebhook(command: ProcessPayOSWebhookCommand): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; desc: string };
    message: string;
  }> {
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
        const paymentCommand: ProcessPaymentCommand = {
          commandId: `payos-${command.commandId}`,
          timestamp: new Date(),
          userId: 'system',
          invoiceId: webhookResult.data.orderCode, // Assuming orderCode maps to invoiceId
          amount: webhookResult.data.amount,
          currency: 'VND',
          paymentMethod: 'payos' as any,
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

    } catch (error) {
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
  static generateCommandId(prefix: string = 'CMD'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create generate invoice command
   */
  static createGenerateInvoiceCommand(
    request: GenerateInvoiceRequest,
    userId: string
  ): GenerateInvoiceCommand {
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
  static createProcessPaymentCommand(
    request: ProcessPaymentRequest,
    userId: string
  ): ProcessPaymentCommand {
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
  static createValidateInsuranceCommand(
    request: ValidateInsuranceRequest,
    userId: string
  ): ValidateInsuranceCommand {
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
  static createPayOSPaymentCommand(
    invoiceId: string,
    amount: number,
    description: string,
    userId: string,
    buyerInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    },
    urls?: {
      returnUrl?: string;
      cancelUrl?: string;
    }
  ): CreatePayOSPaymentCommand {
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
  static createPayOSWebhookCommand(
    webhookData: any,
    signature: string
  ): ProcessPayOSWebhookCommand {
    return {
      commandId: this.generateCommandId('PAYOS-WEBHOOK'),
      timestamp: new Date(),
      webhookData,
      signature
    };
  }
}
