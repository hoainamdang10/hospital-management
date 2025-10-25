"use strict";
/**
 * BillingIntegrationEvents - Application Layer
 * Integration events for billing service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRequiredEvent = exports.InsuranceVerificationRequiredEvent = exports.MedicalRecordUpdatedForBillingEvent = exports.MedicalRecordCompletedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
/**
 * Medical Record Completed Event
 * Triggered when a medical record is completed and ready for billing
 */
class MedicalRecordCompletedEvent extends domain_event_1.IntegrationEvent {
    constructor(recordId, patientId, doctorId, appointmentId, visitDate, diagnoses, medications, procedures, billingInfo, completedBy, completedAt = new Date()) {
        super('medical-record.completed', 'clinical-emr-service', recordId, 'MedicalRecord', {
            recordId,
            patientId,
            doctorId,
            appointmentId,
            visitDate: visitDate.toISOString(),
            diagnoses,
            medications,
            procedures,
            billingInfo,
            completedBy,
            completedAt: completedAt.toISOString(),
            vietnameseMetadata: {
                recordType: 'Hồ sơ bệnh án',
                status: 'Hoàn thành',
                billingRequired: 'Cần thanh toán'
            }
        }, 'billing-service', undefined, completedBy);
        this.recordId = recordId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.visitDate = visitDate;
        this.diagnoses = diagnoses;
        this.medications = medications;
        this.procedures = procedures;
        this.billingInfo = billingInfo;
        this.completedBy = completedBy;
        this.completedAt = completedAt;
    }
    getEventData() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentId: this.appointmentId,
            visitDate: this.visitDate,
            diagnoses: this.diagnoses,
            medications: this.medications,
            procedures: this.procedures,
            billingInfo: this.billingInfo,
            completedBy: this.completedBy,
            completedAt: this.completedAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    /**
     * Get billing priority
     */
    getBillingPriority() {
        if (this.billingInfo.priority === 'emergency')
            return 'critical';
        if (this.billingInfo.priority === 'urgent')
            return 'high';
        if (this.diagnoses.some(d => d.severity === 'critical'))
            return 'high';
        if (this.medications.some(m => m.isHighPriority))
            return 'medium';
        return 'low';
    }
    /**
     * Get estimated billing amount
     */
    getEstimatedBillingAmount() {
        let total = this.billingInfo.estimatedCost || 0;
        // Add procedure costs
        total += this.procedures.reduce((sum, proc) => sum + (proc.cost || 0), 0);
        // Add medication costs (estimated)
        total += this.medications.length * 50000; // 50k VND per medication (estimated)
        // Add consultation fee based on specialty
        const consultationFee = this.billingInfo.specialtyCode ? 200000 : 150000; // VND
        total += consultationFee;
        return total;
    }
    /**
     * Check if insurance coverage applies
     */
    hasInsuranceCoverage() {
        return !!(this.billingInfo.insuranceType &&
            this.billingInfo.insuranceNumber &&
            this.billingInfo.insuranceValidUntil &&
            this.billingInfo.insuranceValidUntil > new Date());
    }
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary() {
        const diagnosisCount = this.diagnoses.length;
        const medicationCount = this.medications.length;
        const procedureCount = this.procedures.length;
        return `Hồ sơ bệnh án ${this.recordId} đã hoàn thành với ${diagnosisCount} chẩn đoán, ${medicationCount} thuốc, và ${procedureCount} thủ thuật. Cần tạo hóa đơn thanh toán.`;
    }
}
exports.MedicalRecordCompletedEvent = MedicalRecordCompletedEvent;
/**
 * Medical Record Updated Event
 * Triggered when a medical record is updated and may affect billing
 */
class MedicalRecordUpdatedForBillingEvent extends domain_event_1.IntegrationEvent {
    constructor(recordId, patientId, changes, billingImpact, updatedBy, updatedAt = new Date()) {
        super('medical-record.updated-for-billing', 'clinical-emr-service', recordId, 'MedicalRecord', {
            recordId,
            patientId,
            changes,
            billingImpact,
            updatedBy,
            updatedAt: updatedAt.toISOString(),
            vietnameseMetadata: {
                changeType: 'Cập nhật hồ sơ',
                billingImpact: billingImpact.costChange > 0 ? 'Tăng chi phí' :
                    billingImpact.costChange < 0 ? 'Giảm chi phí' : 'Không thay đổi chi phí'
            }
        }, 'billing-service', undefined, updatedBy);
        this.recordId = recordId;
        this.patientId = patientId;
        this.changes = changes;
        this.billingImpact = billingImpact;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }
    getEventData() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            changes: this.changes,
            billingImpact: this.billingImpact,
            updatedBy: this.updatedBy,
            updatedAt: this.updatedAt
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
    /**
     * Get change summary
     */
    getChangeSummary() {
        const changes = [];
        if (this.changes.addedDiagnoses?.length) {
            changes.push(`${this.changes.addedDiagnoses.length} chẩn đoán mới`);
        }
        if (this.changes.addedMedications?.length) {
            changes.push(`${this.changes.addedMedications.length} thuốc mới`);
        }
        if (this.changes.addedProcedures?.length) {
            changes.push(`${this.changes.addedProcedures.length} thủ thuật mới`);
        }
        return changes.join(', ') || 'Không có thay đổi đáng kể';
    }
    /**
     * Check if requires immediate billing action
     */
    requiresImmediateBillingAction() {
        return this.billingImpact.requiresNewInvoice ||
            (this.billingImpact.costChange > 100000) || // > 100k VND
            this.billingImpact.affectsInsuranceClaim;
    }
}
exports.MedicalRecordUpdatedForBillingEvent = MedicalRecordUpdatedForBillingEvent;
/**
 * Insurance Verification Required Event
 * Triggered when insurance verification is needed for billing
 */
class InsuranceVerificationRequiredEvent extends domain_event_1.IntegrationEvent {
    constructor(recordId, patientId, insuranceInfo, verificationReason, estimatedCost, urgency, requestedBy, requestedAt = new Date()) {
        // Calculate Vietnamese metadata before super() call
        const vietnameseInsuranceType = (() => {
            switch (insuranceInfo.type) {
                case 'BHYT': return 'Bảo hiểm y tế';
                case 'BHTN': return 'Bảo hiểm tai nạn';
                case 'Private': return 'Bảo hiểm tư nhân';
                default: return 'Không xác định';
            }
        })();
        const vietnameseVerificationReason = (() => {
            switch (verificationReason) {
                case 'new_record': return 'Hồ sơ mới';
                case 'expired_coverage': return 'Hết hạn bảo hiểm';
                case 'coverage_dispute': return 'Tranh chấp bảo hiểm';
                case 'high_cost_treatment': return 'Điều trị chi phí cao';
                default: return 'Không xác định';
            }
        })();
        const vietnameseUrgency = (() => {
            switch (urgency) {
                case 'critical': return 'Khẩn cấp';
                case 'high': return 'Cao';
                case 'medium': return 'Trung bình';
                case 'low': return 'Thấp';
                default: return 'Không xác định';
            }
        })();
        super('clinical-emr.insurance.verification-required', `${recordId}-${insuranceInfo.number}`, {
            recordId,
            patientId,
            insuranceInfo: {
                ...insuranceInfo,
                validUntil: insuranceInfo.validUntil.toISOString()
            },
            verificationReason,
            estimatedCost,
            urgency,
            requestedBy,
            requestedAt: requestedAt.toISOString(),
            vietnameseMetadata: {
                insuranceType: vietnameseInsuranceType,
                verificationReason: vietnameseVerificationReason,
                urgencyLevel: vietnameseUrgency
            }
        });
        this.recordId = recordId;
        this.patientId = patientId;
        this.insuranceInfo = insuranceInfo;
        this.verificationReason = verificationReason;
        this.estimatedCost = estimatedCost;
        this.urgency = urgency;
        this.requestedBy = requestedBy;
        this.requestedAt = requestedAt;
    }
    /**
     * Get Vietnamese insurance type
     */
    getVietnameseInsuranceType() {
        switch (this.insuranceInfo.type) {
            case 'BHYT': return 'Bảo hiểm y tế';
            case 'BHTN': return 'Bảo hiểm tai nạn';
            case 'Private': return 'Bảo hiểm tư nhân';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese verification reason
     */
    getVietnameseVerificationReason() {
        switch (this.verificationReason) {
            case 'new_record': return 'Hồ sơ mới';
            case 'expired_coverage': return 'Bảo hiểm hết hạn';
            case 'coverage_dispute': return 'Tranh chấp bảo hiểm';
            case 'high_cost_treatment': return 'Điều trị chi phí cao';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese urgency
     */
    getVietnameseUrgency() {
        switch (this.urgency) {
            case 'critical': return 'Khẩn cấp';
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'Không xác định';
        }
    }
    /**
     * Check if verification is time-sensitive
     */
    isTimeSensitive() {
        return this.urgency === 'critical' ||
            this.urgency === 'high' ||
            this.verificationReason === 'expired_coverage';
    }
    /**
     * Get maximum verification time (in hours)
     */
    getMaxVerificationTime() {
        switch (this.urgency) {
            case 'critical': return 1; // 1 hour
            case 'high': return 4; // 4 hours
            case 'medium': return 24; // 24 hours
            case 'low': return 72; // 72 hours
            default: return 24;
        }
    }
}
exports.InsuranceVerificationRequiredEvent = InsuranceVerificationRequiredEvent;
/**
 * Payment Required Event
 * Triggered when payment is required for a medical record
 */
class PaymentRequiredEvent extends domain_event_1.IntegrationEvent {
    constructor(recordId, patientId, paymentInfo, itemizedCharges, priority, generatedBy, generatedAt = new Date()) {
        // Calculate Vietnamese metadata before super() call
        const formatVietnameseCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        };
        const vietnamesePriority = (() => {
            switch (priority) {
                case 'immediate': return 'Ngay lập tức';
                case 'urgent': return 'Khẩn cấp';
                case 'routine': return 'Thường quy';
                default: return 'Không xác định';
            }
        })();
        super('clinical-emr.payment.required', `${recordId}-payment`, {
            recordId,
            patientId,
            paymentInfo: {
                ...paymentInfo,
                dueDate: paymentInfo.dueDate.toISOString()
            },
            itemizedCharges,
            priority,
            generatedBy,
            generatedAt: generatedAt.toISOString(),
            vietnameseMetadata: {
                totalAmountVND: formatVietnameseCurrency(paymentInfo.totalAmount),
                patientResponsibleVND: formatVietnameseCurrency(paymentInfo.patientResponsible),
                paymentStatus: 'Cần thanh toán',
                priority: vietnamesePriority
            }
        });
        this.recordId = recordId;
        this.patientId = patientId;
        this.paymentInfo = paymentInfo;
        this.itemizedCharges = itemizedCharges;
        this.priority = priority;
        this.generatedBy = generatedBy;
        this.generatedAt = generatedAt;
    }
    /**
     * Format Vietnamese currency
     */
    formatVietnameseCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
    /**
     * Get Vietnamese priority
     */
    getVietnamesePriority() {
        switch (this.priority) {
            case 'immediate': return 'Ngay lập tức';
            case 'urgent': return 'Khẩn cấp';
            case 'routine': return 'Thường quy';
            default: return 'Không xác định';
        }
    }
    /**
     * Check if payment is overdue
     */
    isOverdue() {
        return new Date() > this.paymentInfo.dueDate;
    }
    /**
     * Get days until due
     */
    getDaysUntilDue() {
        const now = new Date();
        const due = this.paymentInfo.dueDate;
        const diffTime = due.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Get payment summary
     */
    getPaymentSummary() {
        const total = this.formatVietnameseCurrency(this.paymentInfo.totalAmount);
        const patient = this.formatVietnameseCurrency(this.paymentInfo.patientResponsible);
        const daysUntilDue = this.getDaysUntilDue();
        return `Tổng chi phí: ${total}, Bệnh nhân cần trả: ${patient}, Hạn thanh toán: ${daysUntilDue} ngày`;
    }
    /**
     * Get charge breakdown by category
     */
    getChargeBreakdown() {
        const breakdown = {};
        this.itemizedCharges.forEach(charge => {
            if (!breakdown[charge.category]) {
                breakdown[charge.category] = { count: 0, total: 0 };
            }
            breakdown[charge.category].count += charge.quantity;
            breakdown[charge.category].total += charge.totalPrice;
        });
        return breakdown;
    }
}
exports.PaymentRequiredEvent = PaymentRequiredEvent;
//# sourceMappingURL=BillingIntegrationEvents.js.map