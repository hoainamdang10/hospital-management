"use strict";
/**
 * BillingController - Presentation Layer
 * REST API controller for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API Standards, Vietnamese Healthcare
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const GenerateInvoiceCommand_1 = require("../../application/commands/GenerateInvoiceCommand");
const ProcessPaymentCommand_1 = require("../../application/commands/ProcessPaymentCommand");
const ValidateInsuranceCommand_1 = require("../../application/commands/ValidateInsuranceCommand");
/**
 * BillingController
 * Handles HTTP requests for billing operations
 */
class BillingController {
    constructor(dependencies) {
        this.commandHandlers = dependencies.billingCommandHandlers;
    }
    /**
     * Generate invoice for medical services
     * POST /api/v1/billing/invoices
     */
    async generateInvoice(req, res) {
        try {
            const { patientId, doctorId, medicalRecordId, appointmentId, items, insurance, notes, } = req.body;
            // Validate required fields
            if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Thiếu thông tin bắt buộc: patientId và items",
                        details: {
                            patientId: !patientId
                                ? "Mã bệnh nhân không được để trống"
                                : undefined,
                            items: !items || !Array.isArray(items) || items.length === 0
                                ? "Danh sách dịch vụ không được để trống"
                                : undefined,
                        },
                    },
                });
                return;
            }
            // Validate items
            const itemValidationErrors = [];
            items.forEach((item, index) => {
                if (!item.serviceCode) {
                    itemValidationErrors.push(`Item ${index + 1}: Mã dịch vụ không được để trống`);
                }
                if (!item.serviceName) {
                    itemValidationErrors.push(`Item ${index + 1}: Tên dịch vụ không được để trống`);
                }
                if (!item.quantity || item.quantity <= 0) {
                    itemValidationErrors.push(`Item ${index + 1}: Số lượng phải lớn hơn 0`);
                }
                if (!item.unitPrice || item.unitPrice <= 0) {
                    itemValidationErrors.push(`Item ${index + 1}: Đơn giá phải lớn hơn 0`);
                }
                if (!item.category) {
                    itemValidationErrors.push(`Item ${index + 1}: Danh mục dịch vụ không được để trống`);
                }
            });
            if (itemValidationErrors.length > 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Dữ liệu dịch vụ không hợp lệ",
                        details: itemValidationErrors,
                    },
                });
                return;
            }
            // Create command
            const command = new GenerateInvoiceCommand_1.GenerateInvoiceCommand({
                patientId,
                doctorId,
                medicalRecordId,
                appointmentId,
                items: items.map((item) => ({
                    serviceCode: item.serviceCode,
                    serviceName: item.serviceName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    category: item.category,
                    description: item.description,
                })),
                insurance: insurance
                    ? {
                        type: insurance.type,
                        policyNumber: insurance.policyNumber,
                        validFrom: insurance.validFrom
                            ? new Date(insurance.validFrom)
                            : undefined,
                        validTo: insurance.validTo
                            ? new Date(insurance.validTo)
                            : undefined,
                        beneficiaryName: insurance.beneficiaryName,
                        region: insurance.region,
                        coverageLevel: insurance.coverageLevel,
                    }
                    : undefined,
                notes,
                correlationId: req.headers["x-correlation-id"] ||
                    `billing-${Date.now()}`,
            });
            // Execute command
            const result = await this.commandHandlers.handleGenerateInvoice(command);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: result.error?.code || "INVOICE_GENERATION_ERROR",
                        message: result.error?.message || "Lỗi khi tạo hóa đơn",
                        details: result.error?.details,
                    },
                });
                return;
            }
            // Return success response
            res.status(201).json({
                success: true,
                data: {
                    invoiceId: result.data.invoiceId,
                    invoiceNumber: result.data.invoiceNumber,
                    patientId: result.data.patientId,
                    doctorId: result.data.doctorId,
                    items: result.data.items,
                    subtotal: result.data.subtotal,
                    taxAmount: result.data.taxAmount,
                    totalAmount: result.data.totalAmount,
                    insuranceCoverage: result.data.insuranceCoverage,
                    patientPayment: result.data.patientPayment,
                    status: result.data.status,
                    createdAt: result.data.createdAt,
                    dueDate: result.data.dueDate,
                    summary: result.data.summary,
                },
                message: "Tạo hóa đơn thành công",
            });
        }
        catch (error) {
            console.error("BillingController generateInvoice error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi tạo hóa đơn",
                },
            });
        }
    }
    /**
     * Process payment for invoice
     * POST /api/v1/billing/payments
     */
    async processPayment(req, res) {
        try {
            const { invoiceId, paymentMethod, amount, currency = "VND", paymentDetails, notes, } = req.body;
            // Validate required fields
            if (!invoiceId || !paymentMethod || !amount) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Thiếu thông tin bắt buộc: invoiceId, paymentMethod, amount",
                        details: {
                            invoiceId: !invoiceId
                                ? "Mã hóa đơn không được để trống"
                                : undefined,
                            paymentMethod: !paymentMethod
                                ? "Phương thức thanh toán không được để trống"
                                : undefined,
                            amount: !amount
                                ? "Số tiền thanh toán không được để trống"
                                : undefined,
                        },
                    },
                });
                return;
            }
            // Validate payment method
            const validPaymentMethods = [
                "CASH",
                "CARD",
                "BANK_TRANSFER",
                "PAYOS",
                "INSURANCE_DIRECT",
            ];
            if (!validPaymentMethods.includes(paymentMethod)) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Phương thức thanh toán không hợp lệ",
                        details: {
                            paymentMethod: `Phương thức thanh toán phải là một trong: ${validPaymentMethods.join(", ")}`,
                        },
                    },
                });
                return;
            }
            // Validate amount
            if (typeof amount !== "number" || amount <= 0) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Số tiền thanh toán không hợp lệ",
                        details: {
                            amount: "Số tiền thanh toán phải là số dương",
                        },
                    },
                });
                return;
            }
            // Create command
            const command = new ProcessPaymentCommand_1.ProcessPaymentCommand({
                invoiceId,
                paymentMethod: paymentMethod,
                amount,
                currency,
                paymentDetails: paymentDetails || {},
                notes,
                correlationId: req.headers["x-correlation-id"] ||
                    `payment-${Date.now()}`,
            });
            // Execute command
            const result = await this.commandHandlers.handleProcessPayment(command);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: result.error?.code || "PAYMENT_PROCESSING_ERROR",
                        message: result.error?.message || "Lỗi khi xử lý thanh toán",
                        details: result.error?.details,
                    },
                });
                return;
            }
            // Return success response
            res.status(200).json({
                success: true,
                data: {
                    paymentId: result.data.paymentId,
                    invoiceId: result.data.invoiceId,
                    paymentMethod: result.data.paymentMethod,
                    amount: result.data.amount,
                    currency: result.data.currency,
                    status: result.data.status,
                    transactionId: result.data.transactionId,
                    paymentLink: result.data.paymentLink,
                    qrCode: result.data.qrCode,
                    processedAt: result.data.processedAt,
                    expiresAt: result.data.expiresAt,
                },
                message: "Xử lý thanh toán thành công",
            });
        }
        catch (error) {
            console.error("BillingController processPayment error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi xử lý thanh toán",
                },
            });
        }
    }
    /**
     * Validate insurance information
     * POST /api/v1/billing/insurance/validate
     */
    async validateInsurance(req, res) {
        try {
            const { type, policyNumber, beneficiaryName, dateOfBirth, region, serviceDate, } = req.body;
            // Validate required fields
            if (!type || !policyNumber || !beneficiaryName) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Thiếu thông tin bắt buộc: type, policyNumber, beneficiaryName",
                        details: {
                            type: !type ? "Loại bảo hiểm không được để trống" : undefined,
                            policyNumber: !policyNumber
                                ? "Số thẻ bảo hiểm không được để trống"
                                : undefined,
                            beneficiaryName: !beneficiaryName
                                ? "Tên người thụ hưởng không được để trống"
                                : undefined,
                        },
                    },
                });
                return;
            }
            // Validate insurance type
            const validInsuranceTypes = ["BHYT", "BHTN", "PRIVATE"];
            if (!validInsuranceTypes.includes(type)) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Loại bảo hiểm không hợp lệ",
                        details: {
                            type: `Loại bảo hiểm phải là một trong: ${validInsuranceTypes.join(", ")}`,
                        },
                    },
                });
                return;
            }
            // Create command
            const command = new ValidateInsuranceCommand_1.ValidateInsuranceCommand({
                type: type,
                policyNumber,
                beneficiaryName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                region,
                serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
                correlationId: req.headers["x-correlation-id"] ||
                    `insurance-${Date.now()}`,
            });
            // Execute command
            const result = await this.commandHandlers.handleValidateInsurance(command);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: result.error?.code || "INSURANCE_VALIDATION_ERROR",
                        message: result.error?.message || "Lỗi khi xác thực bảo hiểm",
                        details: result.error?.details,
                    },
                });
                return;
            }
            // Return success response
            res.status(200).json({
                success: true,
                data: {
                    isValid: result.data.isValid,
                    policyNumber: result.data.policyNumber,
                    beneficiaryName: result.data.beneficiaryName,
                    coverageLevel: result.data.coverageLevel,
                    coPaymentRate: result.data.coPaymentRate,
                    maxCoverage: result.data.maxCoverage,
                    validFrom: result.data.validFrom,
                    validTo: result.data.validTo,
                    region: result.data.region,
                    warnings: result.data.warnings,
                    recommendations: result.data.recommendations,
                },
                message: "Xác thực bảo hiểm thành công",
            });
        }
        catch (error) {
            console.error("BillingController validateInsurance error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi xác thực bảo hiểm",
                },
            });
        }
    }
    /**
     * Get invoice by ID
     * GET /api/v1/billing/invoices/:invoiceId
     */
    async getInvoice(req, res) {
        try {
            const { invoiceId } = req.params;
            if (!invoiceId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Mã hóa đơn không được để trống",
                    },
                });
                return;
            }
            // Get invoice from repository
            const invoice = await this.commandHandlers.getInvoiceById(invoiceId);
            if (!invoice) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: "INVOICE_NOT_FOUND",
                        message: "Không tìm thấy hóa đơn",
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: invoice,
                message: "Lấy thông tin hóa đơn thành công",
            });
        }
        catch (error) {
            console.error("BillingController getInvoice error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi lấy thông tin hóa đơn",
                },
            });
        }
    }
    /**
     * Get invoices by patient ID
     * GET /api/v1/billing/patients/:patientId/invoices
     */
    async getInvoicesByPatient(req, res) {
        try {
            const { patientId } = req.params;
            const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;
            if (!patientId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Mã bệnh nhân không được để trống",
                    },
                });
                return;
            }
            // Get invoices from repository
            const invoices = await this.commandHandlers.getInvoicesByPatient(patientId, {
                status: status,
                fromDate: fromDate ? new Date(fromDate) : undefined,
                toDate: toDate ? new Date(toDate) : undefined,
                page: parseInt(page),
                limit: parseInt(limit),
            });
            res.status(200).json({
                success: true,
                data: invoices,
                message: "Lấy danh sách hóa đơn thành công",
            });
        }
        catch (error) {
            console.error("BillingController getInvoicesByPatient error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi lấy danh sách hóa đơn",
                },
            });
        }
    }
    /**
     * Generate Vietnamese invoice PDF
     * GET /api/v1/billing/invoices/:invoiceId/pdf
     */
    async generateInvoicePDF(req, res) {
        try {
            const { invoiceId } = req.params;
            const { language = "vi" } = req.query;
            if (!invoiceId) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Mã hóa đơn không được để trống",
                    },
                });
                return;
            }
            // Generate PDF
            const pdfResult = await this.commandHandlers.generateInvoicePDF(invoiceId, language);
            if (!pdfResult.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: pdfResult.error?.code || "PDF_GENERATION_ERROR",
                        message: pdfResult.error?.message || "Lỗi khi tạo file PDF",
                    },
                });
                return;
            }
            // Set response headers for PDF download
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceId}.pdf"`);
            res.setHeader("Content-Length", pdfResult.data.buffer.length);
            // Send PDF buffer
            res.send(pdfResult.data.buffer);
        }
        catch (error) {
            console.error("BillingController generateInvoicePDF error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi tạo file PDF",
                },
            });
        }
    }
    /**
     * Process insurance claim
     * POST /api/v1/billing/insurance/claims
     */
    async processInsuranceClaim(req, res) {
        try {
            const { invoiceId, insuranceType, policyNumber, claimAmount, supportingDocuments, notes, } = req.body;
            // Validate required fields
            if (!invoiceId || !insuranceType || !policyNumber || !claimAmount) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Thiếu thông tin bắt buộc: invoiceId, insuranceType, policyNumber, claimAmount",
                    },
                });
                return;
            }
            // Process insurance claim
            const claimResult = await this.commandHandlers.processInsuranceClaim({
                invoiceId,
                insuranceType,
                policyNumber,
                claimAmount,
                supportingDocuments: supportingDocuments || [],
                notes,
            });
            if (!claimResult.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: claimResult.error?.code || "CLAIM_PROCESSING_ERROR",
                        message: claimResult.error?.message || "Lỗi khi xử lý yêu cầu bồi thường",
                    },
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: claimResult.data,
                message: "Xử lý yêu cầu bồi thường thành công",
            });
        }
        catch (error) {
            console.error("BillingController processInsuranceClaim error:", error);
            res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Lỗi hệ thống khi xử lý yêu cầu bồi thường",
                },
            });
        }
    }
}
exports.BillingController = BillingController;
//# sourceMappingURL=BillingController.js.map