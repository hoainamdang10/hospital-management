"use strict";
/**
 * BillingService - Service for handling billing operations and event-based invoice generation
 * Provides methods for generating invoices from various healthcare events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
/**
 * BillingService - Handles billing operations and event-based invoice generation
 */
class BillingService {
    constructor(invoiceRepository, patientRepository, createInvoiceUseCase, processPaymentUseCase, loggerInstance) {
        this.invoiceRepository = invoiceRepository;
        this.patientRepository = patientRepository;
        this.createInvoiceUseCase = createInvoiceUseCase;
        this.processPaymentUseCase = processPaymentUseCase;
        this.loggerInstance = loggerInstance;
    }
    /**
     * Generate invoice for completed appointment
     */
    async generateAppointmentInvoice(request) {
        this.loggerInstance.info("Generating appointment invoice", {
            appointmentId: request.appointmentId,
            patientId: request.patientId,
            serviceType: request.serviceType,
            consultationFee: request.consultationFee,
        });
        try {
            // Prefer fee passed from appointments-service; fallback to internal table
            const baseFee = request.consultationFee ??
                this.calculateConsultationFee(request.serviceType, request.duration);
            // Build line items
            const serviceName = this.getAppointmentServiceName(request.serviceType);
            const lineItems = [
                {
                    description: `${serviceName} - ${request.duration} phút`,
                    quantity: 1,
                    unitPrice: baseFee,
                    total: baseFee,
                    code: this.getServiceTypeCode(request.serviceType),
                    category: "consultation",
                },
            ];
            // Apply insurance coverage if available
            const insuranceCoverage = request.insuranceInfo
                ? this.calculateInsuranceCoverage(baseFee, request.insuranceInfo, "consultation")
                : 0;
            // Create invoice using CreateInvoiceUseCase
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                appointmentId: request.appointmentId,
                staffId: request.staffId,
                metadata: {
                    invoiceType: "appointment_booking",
                    serviceName,
                    serviceCategory: request.serviceType,
                    serviceDescription: `Đặt lịch khám lúc ${request.scheduledAt.toISOString()}`,
                    appointmentId: request.appointmentId,
                    appointmentTime: request.scheduledAt.toISOString(),
                    doctorName: request.doctorName,
                    doctorDepartment: request.doctorDepartment,
                },
                items: lineItems.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
                // REMOVED (Phase 1 Prepaid Model): insurance
            });
            this.loggerInstance.info("Appointment invoice generated successfully", {
                appointmentId: request.appointmentId,
                invoiceId: invoiceResponse.invoiceId,
                totalAmount: invoiceResponse.totalAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate appointment invoice", {
                appointmentId: request.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate late cancellation fee invoice
     */
    async generateLateCancellationFee(request) {
        this.loggerInstance.info("Generating late cancellation fee", {
            appointmentId: request.appointmentId,
            patientId: request.patientId,
            feeAmount: request.feeAmount,
        });
        try {
            const lineItems = [
                {
                    description: `Late cancellation fee - ${request.reason}`,
                    quantity: 1,
                    unitPrice: request.feeAmount,
                },
            ];
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                appointmentId: request.appointmentId,
                metadata: {
                    invoiceType: "late_cancellation_fee",
                    serviceName: "Phí hủy lịch muộn",
                    serviceDescription: request.reason,
                    appointmentId: request.appointmentId,
                    cancelledAt: request.cancelledAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1): insurance
            });
            this.loggerInstance.info("Late cancellation fee invoice generated", {
                appointmentId: request.appointmentId,
                invoiceId: invoiceResponse.invoiceId,
                feeAmount: request.feeAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate late cancellation fee", {
                appointmentId: request.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate reschedule fee invoice when policy applies
     */
    async generateRescheduleFee(request) {
        try {
            this.loggerInstance.info("Generating reschedule fee", {
                appointmentId: request.appointmentId,
                patientId: request.patientId,
                feeAmount: request.rescheduleAmount,
            });
            // Create invoice using CreateInvoiceUseCase (Phase 1 model)
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                appointmentId: request.appointmentId,
                metadata: {
                    invoiceType: "reschedule_fee",
                    serviceName: "Phí đổi lịch hẹn",
                    serviceDescription: request.reason || "Đổi lịch",
                    appointmentId: request.appointmentId,
                },
                items: [
                    {
                        description: `Phí đổi lịch hẹn - ${request.reason || "Đổi lịch"}`,
                        quantity: 1,
                        unitPrice: request.rescheduleAmount,
                    },
                ],
            });
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error(`Reschedule fee invoice ${invoiceResponse.invoiceId} not found after creation`);
            }
            this.loggerInstance.info("Reschedule fee invoice generated", {
                appointmentId: request.appointmentId,
                invoiceId: invoiceResponse.invoiceId,
                feeAmount: request.rescheduleAmount,
            });
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate reschedule fee", {
                appointmentId: request.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate no-show fee invoice
     */
    async generateNoShowFee(request) {
        this.loggerInstance.info("Generating no-show fee", {
            appointmentId: request.appointmentId,
            patientId: request.patientId,
            noShowCount: request.noShowCount,
            feeAmount: request.feeAmount,
        });
        try {
            const lineItems = [
                {
                    description: `No-show fee (Occurrence #${request.noShowCount})`,
                    quantity: 1,
                    unitPrice: request.feeAmount,
                },
            ];
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                appointmentId: request.appointmentId,
                metadata: {
                    invoiceType: "no_show_fee",
                    serviceName: "Phí bỏ khám",
                    occurrence: request.noShowCount,
                    appointmentId: request.appointmentId,
                    scheduledAt: request.scheduledAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1): insurance
            });
            this.loggerInstance.info("No-show fee invoice generated", {
                appointmentId: request.appointmentId,
                invoiceId: invoiceResponse.invoiceId,
                feeAmount: request.feeAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate no-show fee", {
                appointmentId: request.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate prescription invoice
     */
    async generatePrescriptionInvoice(request) {
        this.loggerInstance.info("Generating prescription invoice", {
            prescriptionId: request.prescriptionId,
            patientId: request.patientId,
            medicationCount: request.medications.length,
        });
        try {
            const lineItems = request.medications.map((med) => ({
                description: `${med.name} ${med.dosage} (${med.quantity} units)`,
                quantity: med.quantity,
                unitPrice: med.unitPrice,
            }));
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                metadata: {
                    invoiceType: "prescription",
                    serviceName: "Thanh toán đơn thuốc",
                    prescriptionId: request.prescriptionId,
                    prescribedAt: request.prescribedAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1 Prepaid Model): insurance
            });
            this.loggerInstance.info("Prescription invoice generated", {
                prescriptionId: request.prescriptionId,
                invoiceId: invoiceResponse.invoiceId,
                totalAmount: invoiceResponse.totalAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate prescription invoice", {
                prescriptionId: request.prescriptionId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate lab test invoice
     */
    async generateLabTestInvoice(request) {
        this.loggerInstance.info("Generating lab test invoice", {
            labResultId: request.labResultId,
            patientId: request.patientId,
            testType: request.testType,
            isUrgent: request.isUrgent,
        });
        try {
            // Apply urgent surcharge if applicable
            const urgentSurcharge = request.isUrgent ? request.cost * 0.5 : 0;
            const totalCost = request.cost + urgentSurcharge;
            const lineItems = [
                {
                    description: `${request.testType}${request.isUrgent ? " (Urgent)" : ""}`,
                    quantity: 1,
                    unitPrice: totalCost,
                },
            ];
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                metadata: {
                    invoiceType: "lab_test",
                    serviceName: request.testType,
                    urgent: request.isUrgent,
                    labResultId: request.labResultId,
                    appointmentId: request.appointmentId,
                    performedAt: request.performedAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1 Prepaid Model): insurance
            });
            this.loggerInstance.info("Lab test invoice generated", {
                labResultId: request.labResultId,
                invoiceId: invoiceResponse.invoiceId,
                totalAmount: invoiceResponse.totalAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate lab test invoice", {
                labResultId: request.labResultId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate treatment plan invoice
     */
    async generateTreatmentPlanInvoice(request) {
        this.loggerInstance.info("Generating treatment plan invoice", {
            treatmentPlanId: request.treatmentPlanId,
            patientId: request.patientId,
            procedureCount: request.procedures.length,
        });
        try {
            const lineItems = request.procedures.map((proc) => ({
                description: proc.name,
                quantity: 1,
                unitPrice: proc.cost,
            }));
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                metadata: {
                    invoiceType: "treatment_plan",
                    serviceName: "Kế hoạch điều trị",
                    treatmentPlanId: request.treatmentPlanId,
                    appointmentId: request.appointmentId,
                    createdAt: request.createdAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1 Prepaid Model): insurance
            });
            this.loggerInstance.info("Treatment plan invoice generated", {
                treatmentPlanId: request.treatmentPlanId,
                invoiceId: invoiceResponse.invoiceId,
                totalAmount: invoiceResponse.totalAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate treatment plan invoice", {
                treatmentPlanId: request.treatmentPlanId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Generate medical record invoice
     */
    async generateMedicalRecordInvoice(request) {
        this.loggerInstance.info("Generating medical record invoice", {
            medicalRecordId: request.medicalRecordId,
            patientId: request.patientId,
            recordType: request.recordType,
            serviceCount: request.services.length,
        });
        try {
            const lineItems = request.services.map((service) => ({
                description: service.name,
                quantity: 1,
                unitPrice: service.cost,
            }));
            const invoiceResponse = await this.createInvoiceUseCase.execute({
                patientId: request.patientId,
                metadata: {
                    invoiceType: "medical_record",
                    serviceName: "Hồ sơ y tế",
                    medicalRecordId: request.medicalRecordId,
                    recordType: request.recordType,
                    appointmentId: request.appointmentId,
                    createdAt: request.createdAt.toISOString(),
                },
                items: lineItems,
                // REMOVED (Phase 1 Prepaid Model): insurance
            });
            this.loggerInstance.info("Medical record invoice generated", {
                medicalRecordId: request.medicalRecordId,
                invoiceId: invoiceResponse.invoiceId,
                totalAmount: invoiceResponse.totalAmount,
            });
            // Fetch the created invoice to return
            const invoice = await this.invoiceRepository.findById(invoiceResponse.invoiceId);
            if (!invoice) {
                throw new Error("Invoice created but not found");
            }
            return invoice;
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate medical record invoice", {
                medicalRecordId: request.medicalRecordId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Helper methods
     */
    calculateConsultationFee(serviceType, duration) {
        const baseRates = {
            consultation: 200000, // 200,000 VND base
            procedure: 500000, // 500,000 VND base
            follow_up: 150000, // 150,000 VND base
        };
        const baseRate = baseRates[serviceType] ||
            baseRates.consultation;
        // Add duration-based surcharge for appointments over 30 minutes
        const durationSurcharge = duration > 30 ? (duration - 30) * 5000 : 0;
        return baseRate + durationSurcharge;
    }
    getServiceTypeDescription(serviceType) {
        const descriptions = {
            consultation: "Medical Consultation",
            procedure: "Medical Procedure",
            follow_up: "Follow-up Consultation",
        };
        return (descriptions[serviceType] ||
            "Medical Service");
    }
    getServiceTypeCode(serviceType) {
        const codes = {
            consultation: "CONSULT",
            procedure: "PROC",
            follow_up: "FOLLOW",
        };
        return codes[serviceType] || "MEDICAL";
    }
    getAppointmentServiceName(serviceType) {
        const mapping = {
            consultation: "Đặt lịch khám",
            procedure: "Đăng ký thủ thuật",
            follow_up: "Đặt lịch tái khám",
        };
        return mapping[serviceType] || "Dịch vụ khám chữa bệnh";
    }
    calculateInsuranceCoverage(amount, insuranceInfo, category) {
        if (!insuranceInfo || !insuranceInfo.coverage) {
            return 0;
        }
        const coverage = insuranceInfo.coverage;
        let coveragePercentage = 0;
        switch (category) {
            case "consultation":
                coveragePercentage = coverage.consultationCoverage || 0;
                break;
            case "medication":
                coveragePercentage = coverage.medicationCoverage || 0;
                break;
            case "laboratory":
                coveragePercentage = coverage.laboratoryCoverage || 0;
                break;
            case "procedure":
                coveragePercentage = coverage.procedureCoverage || 0;
                break;
            case "emergency":
                coveragePercentage = coverage.emergencyCoverage || 0;
                break;
            default:
                coveragePercentage = coverage.generalCoverage || 0;
        }
        return Math.round(amount * (coveragePercentage / 100));
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=BillingService.js.map