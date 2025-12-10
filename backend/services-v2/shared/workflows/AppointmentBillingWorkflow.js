"use strict";
/**
 * AppointmentBillingWorkflow - Appointment to Billing Integration Workflows
 * Seamless integration between appointment scheduling and billing processes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, BHYT/BHTN Integration, PayOS Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentBillingWorkflow = void 0;
const WorkflowOrchestrator_1 = require("./WorkflowOrchestrator");
class AppointmentBillingWorkflow {
    constructor() {
        this.orchestrator = WorkflowOrchestrator_1.WorkflowOrchestrator.getInstance();
        this.registerAppointmentBillingWorkflows();
    }
    static getInstance() {
        if (!AppointmentBillingWorkflow.instance) {
            AppointmentBillingWorkflow.instance = new AppointmentBillingWorkflow();
        }
        return AppointmentBillingWorkflow.instance;
    }
    /**
     * Register all appointment-billing workflows
     */
    registerAppointmentBillingWorkflows() {
        console.log(" Registering Appointment-Billing Integration Workflows");
        this.registerAppointmentInvoiceGenerationWorkflow();
        this.registerInsuranceClaimProcessingWorkflow();
        this.registerPaymentProcessingWorkflow();
        this.registerBillingReconciliationWorkflow();
        this.registerRefundProcessingWorkflow();
        this.registerBHYTIntegrationWorkflow();
        this.registerPayOSIntegrationWorkflow();
        console.log(" All Appointment-Billing Workflows registered");
    }
    /**
     * Appointment Invoice Generation Workflow
     */
    registerAppointmentInvoiceGenerationWorkflow() {
        const workflow = {
            workflowId: "appointment-invoice-generation",
            workflowName: "Appointment Invoice Generation Workflow",
            vietnameseWorkflowName: "Quy trình Tạo Hóa đơn Khám bệnh",
            description: "Generate invoice for appointment services with Vietnamese healthcare compliance",
            vietnameseDescription: "Tạo hóa đơn cho dịch vụ khám bệnh tuân thủ quy định y tế Việt Nam",
            steps: [
                {
                    stepId: "validate-appointment-completion",
                    stepName: "Validate Appointment Completion",
                    serviceName: "scheduling-service",
                    action: "validate-appointment-completion",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực hoàn thành cuộc hẹn",
                    healthcareContext: "APPOINTMENT_VALIDATION",
                },
                {
                    stepId: "calculate-service-charges",
                    stepName: "Calculate Service Charges",
                    serviceName: "billing-service",
                    action: "calculate-service-charges",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Tính toán chi phí dịch vụ",
                    healthcareContext: "SERVICE_CHARGE_CALCULATION",
                },
                {
                    stepId: "apply-insurance-coverage",
                    stepName: "Apply Insurance Coverage",
                    serviceName: "billing-service",
                    action: "apply-insurance-coverage",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Áp dụng bảo hiểm y tế",
                    healthcareContext: "INSURANCE_COVERAGE_APPLICATION",
                },
                {
                    stepId: "generate-vietnamese-invoice",
                    stepName: "Generate Vietnamese Invoice",
                    serviceName: "billing-service",
                    action: "generate-vietnamese-invoice",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    compensationAction: "void-invoice",
                    vietnameseDescription: "Tạo hóa đơn tiếng Việt",
                    healthcareContext: "VIETNAMESE_INVOICE_GENERATION",
                },
                {
                    stepId: "send-invoice-notification",
                    stepName: "Send Invoice Notification",
                    serviceName: "notifications-service",
                    action: "send-invoice-notification",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 2,
                    vietnameseDescription: "Gửi thông báo hóa đơn",
                    healthcareContext: "INVOICE_NOTIFICATION",
                },
                {
                    stepId: "update-appointment-billing-status",
                    stepName: "Update Appointment Billing Status",
                    serviceName: "scheduling-service",
                    action: "update-billing-status",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật trạng thái thanh toán",
                    healthcareContext: "BILLING_STATUS_UPDATE",
                },
            ],
            compensationSteps: [],
            timeout: 300000, // 5 minutes
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * Insurance Claim Processing Workflow
     */
    registerInsuranceClaimProcessingWorkflow() {
        const workflow = {
            workflowId: "insurance-claim-processing",
            workflowName: "Insurance Claim Processing Workflow",
            vietnameseWorkflowName: "Quy trình Xử lý Yêu cầu Bảo hiểm",
            description: "Process insurance claims for BHYT and BHTN with Vietnamese healthcare standards",
            vietnameseDescription: "Xử lý yêu cầu bảo hiểm BHYT và BHTN theo tiêu chuẩn y tế Việt Nam",
            steps: [
                {
                    stepId: "validate-insurance-eligibility",
                    stepName: "Validate Insurance Eligibility",
                    serviceName: "billing-service",
                    action: "validate-insurance-eligibility",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực tư cách bảo hiểm",
                    healthcareContext: "INSURANCE_ELIGIBILITY_VALIDATION",
                },
                {
                    stepId: "prepare-bhyt-claim",
                    stepName: "Prepare BHYT Claim",
                    serviceName: "billing-service",
                    action: "prepare-bhyt-claim",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Chuẩn bị hồ sơ BHYT",
                    healthcareContext: "BHYT_CLAIM_PREPARATION",
                },
                {
                    stepId: "submit-insurance-claim",
                    stepName: "Submit Insurance Claim",
                    serviceName: "billing-service",
                    action: "submit-insurance-claim",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    compensationAction: "cancel-insurance-claim",
                    vietnameseDescription: "Gửi hồ sơ bảo hiểm",
                    healthcareContext: "INSURANCE_CLAIM_SUBMISSION",
                },
                {
                    stepId: "track-claim-status",
                    stepName: "Track Claim Status",
                    serviceName: "billing-service",
                    action: "track-claim-status",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 5,
                    vietnameseDescription: "Theo dõi trạng thái hồ sơ",
                    healthcareContext: "CLAIM_STATUS_TRACKING",
                },
                {
                    stepId: "process-claim-response",
                    stepName: "Process Claim Response",
                    serviceName: "billing-service",
                    action: "process-claim-response",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xử lý phản hồi bảo hiểm",
                    healthcareContext: "CLAIM_RESPONSE_PROCESSING",
                },
                {
                    stepId: "update-patient-balance",
                    stepName: "Update Patient Balance",
                    serviceName: "billing-service",
                    action: "update-patient-balance",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật số dư bệnh nhân",
                    healthcareContext: "PATIENT_BALANCE_UPDATE",
                },
                {
                    stepId: "notify-claim-result",
                    stepName: "Notify Claim Result",
                    serviceName: "notifications-service",
                    action: "notify-claim-result",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 2,
                    vietnameseDescription: "Thông báo kết quả bảo hiểm",
                    healthcareContext: "CLAIM_RESULT_NOTIFICATION",
                },
            ],
            compensationSteps: [],
            timeout: 1800000, // 30 minutes - Insurance processing can take time
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 2000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * Payment Processing Workflow
     */
    registerPaymentProcessingWorkflow() {
        const workflow = {
            workflowId: "payment-processing",
            workflowName: "Payment Processing Workflow",
            vietnameseWorkflowName: "Quy trình Xử lý Thanh toán",
            description: "Process patient payments through various methods including PayOS integration",
            vietnameseDescription: "Xử lý thanh toán bệnh nhân qua nhiều phương thức bao gồm tích hợp PayOS",
            steps: [
                {
                    stepId: "validate-payment-amount",
                    stepName: "Validate Payment Amount",
                    serviceName: "billing-service",
                    action: "validate-payment-amount",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực số tiền thanh toán",
                    healthcareContext: "PAYMENT_AMOUNT_VALIDATION",
                },
                {
                    stepId: "process-payment-method",
                    stepName: "Process Payment Method",
                    serviceName: "billing-service",
                    action: "process-payment-method",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    compensationAction: "refund-payment",
                    vietnameseDescription: "Xử lý phương thức thanh toán",
                    healthcareContext: "PAYMENT_METHOD_PROCESSING",
                },
                {
                    stepId: "generate-payment-receipt",
                    stepName: "Generate Payment Receipt",
                    serviceName: "billing-service",
                    action: "generate-payment-receipt",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Tạo biên lai thanh toán",
                    healthcareContext: "PAYMENT_RECEIPT_GENERATION",
                },
                {
                    stepId: "update-invoice-status",
                    stepName: "Update Invoice Status",
                    serviceName: "billing-service",
                    action: "update-invoice-status",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật trạng thái hóa đơn",
                    healthcareContext: "INVOICE_STATUS_UPDATE",
                },
                {
                    stepId: "send-payment-confirmation",
                    stepName: "Send Payment Confirmation",
                    serviceName: "notifications-service",
                    action: "send-payment-confirmation",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 2,
                    vietnameseDescription: "Gửi xác nhận thanh toán",
                    healthcareContext: "PAYMENT_CONFIRMATION",
                },
                {
                    stepId: "update-patient-account",
                    stepName: "Update Patient Account",
                    serviceName: "patient-registry-service",
                    action: "update-patient-account",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật tài khoản bệnh nhân",
                    healthcareContext: "PATIENT_ACCOUNT_UPDATE",
                },
            ],
            compensationSteps: [],
            timeout: 600000, // 10 minutes
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * Billing Reconciliation Workflow
     */
    registerBillingReconciliationWorkflow() {
        const workflow = {
            workflowId: "billing-reconciliation",
            workflowName: "Billing Reconciliation Workflow",
            vietnameseWorkflowName: "Quy trình Đối soát Thanh toán",
            description: "Reconcile billing records with payments and insurance claims",
            vietnameseDescription: "Đối soát hồ sơ thanh toán với các khoản thanh toán và yêu cầu bảo hiểm",
            steps: [
                {
                    stepId: "collect-billing-records",
                    stepName: "Collect Billing Records",
                    serviceName: "billing-service",
                    action: "collect-billing-records",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Thu thập hồ sơ thanh toán",
                    healthcareContext: "BILLING_RECORDS_COLLECTION",
                },
                {
                    stepId: "match-payments-to-invoices",
                    stepName: "Match Payments to Invoices",
                    serviceName: "billing-service",
                    action: "match-payments-invoices",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Ghép nối thanh toán với hóa đơn",
                    healthcareContext: "PAYMENT_INVOICE_MATCHING",
                },
                {
                    stepId: "reconcile-insurance-claims",
                    stepName: "Reconcile Insurance Claims",
                    serviceName: "billing-service",
                    action: "reconcile-insurance-claims",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Đối soát yêu cầu bảo hiểm",
                    healthcareContext: "INSURANCE_CLAIMS_RECONCILIATION",
                },
                {
                    stepId: "identify-discrepancies",
                    stepName: "Identify Discrepancies",
                    serviceName: "billing-service",
                    action: "identify-discrepancies",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác định sự khác biệt",
                    healthcareContext: "DISCREPANCY_IDENTIFICATION",
                },
                {
                    stepId: "generate-reconciliation-report",
                    stepName: "Generate Reconciliation Report",
                    serviceName: "billing-service",
                    action: "generate-reconciliation-report",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Tạo báo cáo đối soát",
                    healthcareContext: "RECONCILIATION_REPORT_GENERATION",
                },
                {
                    stepId: "notify-billing-team",
                    stepName: "Notify Billing Team",
                    serviceName: "notifications-service",
                    action: "notify-billing-team",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 2,
                    vietnameseDescription: "Thông báo đội ngũ thanh toán",
                    healthcareContext: "BILLING_TEAM_NOTIFICATION",
                },
            ],
            compensationSteps: [],
            timeout: 900000, // 15 minutes
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 2000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * Refund Processing Workflow
     */
    registerRefundProcessingWorkflow() {
        const workflow = {
            workflowId: "refund-processing",
            workflowName: "Refund Processing Workflow",
            vietnameseWorkflowName: "Quy trình Xử lý Hoàn tiền",
            description: "Process refunds for cancelled appointments or overpayments",
            vietnameseDescription: "Xử lý hoàn tiền cho các cuộc hẹn bị hủy hoặc thanh toán thừa",
            steps: [
                {
                    stepId: "validate-refund-request",
                    stepName: "Validate Refund Request",
                    serviceName: "billing-service",
                    action: "validate-refund-request",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực yêu cầu hoàn tiền",
                    healthcareContext: "REFUND_REQUEST_VALIDATION",
                },
                {
                    stepId: "calculate-refund-amount",
                    stepName: "Calculate Refund Amount",
                    serviceName: "billing-service",
                    action: "calculate-refund-amount",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Tính toán số tiền hoàn lại",
                    healthcareContext: "REFUND_AMOUNT_CALCULATION",
                },
                {
                    stepId: "process-refund-payment",
                    stepName: "Process Refund Payment",
                    serviceName: "billing-service",
                    action: "process-refund-payment",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xử lý thanh toán hoàn tiền",
                    healthcareContext: "REFUND_PAYMENT_PROCESSING",
                },
                {
                    stepId: "update-billing-records",
                    stepName: "Update Billing Records",
                    serviceName: "billing-service",
                    action: "update-billing-records",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật hồ sơ thanh toán",
                    healthcareContext: "BILLING_RECORDS_UPDATE",
                },
                {
                    stepId: "send-refund-confirmation",
                    stepName: "Send Refund Confirmation",
                    serviceName: "notifications-service",
                    action: "send-refund-confirmation",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 2,
                    vietnameseDescription: "Gửi xác nhận hoàn tiền",
                    healthcareContext: "REFUND_CONFIRMATION",
                },
            ],
            compensationSteps: [],
            timeout: 600000, // 10 minutes
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * BHYT Integration Workflow
     */
    registerBHYTIntegrationWorkflow() {
        const workflow = {
            workflowId: "bhyt-integration",
            workflowName: "BHYT Integration Workflow",
            vietnameseWorkflowName: "Quy trình Tích hợp BHYT",
            description: "Integration with Vietnamese Social Health Insurance (BHYT) system",
            vietnameseDescription: "Tích hợp với hệ thống Bảo hiểm Y tế Xã hội Việt Nam (BHYT)",
            steps: [
                {
                    stepId: "validate-bhyt-card",
                    stepName: "Validate BHYT Card",
                    serviceName: "billing-service",
                    action: "validate-bhyt-card",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực thẻ BHYT",
                    healthcareContext: "BHYT_CARD_VALIDATION",
                },
                {
                    stepId: "check-bhyt-coverage",
                    stepName: "Check BHYT Coverage",
                    serviceName: "billing-service",
                    action: "check-bhyt-coverage",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Kiểm tra phạm vi bảo hiểm BHYT",
                    healthcareContext: "BHYT_COVERAGE_CHECK",
                },
                {
                    stepId: "submit-bhyt-claim",
                    stepName: "Submit BHYT Claim",
                    serviceName: "billing-service",
                    action: "submit-bhyt-claim",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    compensationAction: "cancel-bhyt-claim",
                    vietnameseDescription: "Gửi hồ sơ BHYT",
                    healthcareContext: "BHYT_CLAIM_SUBMISSION",
                },
                {
                    stepId: "process-bhyt-response",
                    stepName: "Process BHYT Response",
                    serviceName: "billing-service",
                    action: "process-bhyt-response",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xử lý phản hồi BHYT",
                    healthcareContext: "BHYT_RESPONSE_PROCESSING",
                },
            ],
            compensationSteps: [],
            timeout: 1200000, // 20 minutes - BHYT processing can be slow
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 3000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * PayOS Integration Workflow
     */
    registerPayOSIntegrationWorkflow() {
        const workflow = {
            workflowId: "payos-integration",
            workflowName: "PayOS Integration Workflow",
            vietnameseWorkflowName: "Quy trình Tích hợp PayOS",
            description: "Integration with PayOS payment gateway for Vietnamese healthcare payments",
            vietnameseDescription: "Tích hợp với cổng thanh toán PayOS cho thanh toán y tế Việt Nam",
            steps: [
                {
                    stepId: "create-payos-payment",
                    stepName: "Create PayOS Payment",
                    serviceName: "billing-service",
                    action: "create-payos-payment",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    compensationAction: "cancel-payos-payment",
                    vietnameseDescription: "Tạo thanh toán PayOS",
                    healthcareContext: "PAYOS_PAYMENT_CREATION",
                },
                {
                    stepId: "process-payos-callback",
                    stepName: "Process PayOS Callback",
                    serviceName: "billing-service",
                    action: "process-payos-callback",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xử lý callback PayOS",
                    healthcareContext: "PAYOS_CALLBACK_PROCESSING",
                },
                {
                    stepId: "verify-payos-payment",
                    stepName: "Verify PayOS Payment",
                    serviceName: "billing-service",
                    action: "verify-payos-payment",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Xác thực thanh toán PayOS",
                    healthcareContext: "PAYOS_PAYMENT_VERIFICATION",
                },
                {
                    stepId: "update-payment-status",
                    stepName: "Update Payment Status",
                    serviceName: "billing-service",
                    action: "update-payment-status",
                    input: {},
                    status: WorkflowOrchestrator_1.WorkflowStepStatus.PENDING,
                    retryCount: 0,
                    maxRetries: 3,
                    vietnameseDescription: "Cập nhật trạng thái thanh toán",
                    healthcareContext: "PAYMENT_STATUS_UPDATE",
                },
            ],
            compensationSteps: [],
            timeout: 300000, // 5 minutes
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2,
            },
            healthcareCompliance: {
                hipaaRequired: true,
                auditRequired: true,
                vietnameseStandards: true,
            },
        };
        this.orchestrator.registerWorkflow(workflow);
    }
    /**
     * Execute appointment invoice generation
     */
    async executeAppointmentInvoiceGeneration(billingContext) {
        console.log(` Starting Invoice Generation for appointment: ${billingContext.appointmentId}`);
        return await this.orchestrator.startWorkflow("appointment-invoice-generation", billingContext, {
            appointmentId: billingContext.appointmentId,
            patientId: billingContext.patientId,
            correlationId: `invoice_${Date.now()}`,
            userId: "system",
        });
    }
    /**
     * Execute insurance claim processing
     */
    async executeInsuranceClaimProcessing(billingContext) {
        console.log(` Starting Insurance Claim Processing for patient: ${billingContext.patientId}`);
        return await this.orchestrator.startWorkflow("insurance-claim-processing", billingContext, {
            patientId: billingContext.patientId,
            appointmentId: billingContext.appointmentId,
            correlationId: `insurance_${Date.now()}`,
            userId: "system",
        });
    }
    /**
     * Execute payment processing
     */
    async executePaymentProcessing(billingContext, paymentContext) {
        console.log(` Starting Payment Processing for invoice: ${paymentContext.invoiceId}`);
        return await this.orchestrator.startWorkflow("payment-processing", { ...billingContext, ...paymentContext }, {
            invoiceId: paymentContext.invoiceId,
            patientId: billingContext.patientId,
            correlationId: `payment_${Date.now()}`,
            userId: "system",
        });
    }
    /**
     * Execute complete appointment-billing workflow
     */
    async executeCompleteAppointmentBilling(billingContext) {
        console.log(` Starting Complete Appointment-Billing Workflow for: ${billingContext.appointmentId}`);
        const results = [];
        try {
            // 1. Generate Invoice
            const invoiceResult = await this.executeAppointmentInvoiceGeneration(billingContext);
            results.push({ step: "invoice-generation", result: invoiceResult });
            if (!invoiceResult.success) {
                throw new Error("Invoice generation failed");
            }
            // 2. Process Insurance (if applicable)
            if (billingContext.insuranceInfo) {
                const insuranceResult = await this.executeInsuranceClaimProcessing(billingContext);
                results.push({ step: "insurance-processing", result: insuranceResult });
            }
            return {
                success: true,
                appointmentId: billingContext.appointmentId,
                billingSteps: results,
                vietnamese: {
                    message: "Quy trình thanh toán khám bệnh đã hoàn thành thành công",
                    appointmentId: billingContext.appointmentId,
                    completedSteps: results.length,
                },
            };
        }
        catch (error) {
            console.error(" Appointment-billing workflow failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                billingSteps: results,
                vietnamese: {
                    message: "Quy trình thanh toán gặp lỗi",
                    error: "Vui lòng liên hệ bộ phận thanh toán",
                },
            };
        }
    }
    /**
     * Get appointment-billing workflow status
     */
    getAppointmentBillingStatus() {
        return {
            registeredWorkflows: [
                "appointment-invoice-generation",
                "insurance-claim-processing",
                "payment-processing",
                "billing-reconciliation",
                "refund-processing",
                "bhyt-integration",
                "payos-integration",
            ],
            vietnamese: {
                title: "Trạng thái Quy trình Thanh toán Khám bệnh",
                workflows: {
                    "appointment-invoice-generation": "Tạo Hóa đơn Khám bệnh",
                    "insurance-claim-processing": "Xử lý Yêu cầu Bảo hiểm",
                    "payment-processing": "Xử lý Thanh toán",
                    "billing-reconciliation": "Đối soát Thanh toán",
                    "refund-processing": "Xử lý Hoàn tiền",
                    "bhyt-integration": "Tích hợp BHYT",
                    "payos-integration": "Tích hợp PayOS",
                },
            },
            integrations: {
                bhyt: true,
                bhtn: true,
                payos: true,
                vietnameseHealthcare: true,
            },
            healthcareCompliance: {
                hipaa: true,
                vietnameseStandards: true,
                billingWorkflows: true,
            },
            lastUpdated: new Date().toISOString(),
        };
    }
}
exports.AppointmentBillingWorkflow = AppointmentBillingWorkflow;
//# sourceMappingURL=AppointmentBillingWorkflow.js.map