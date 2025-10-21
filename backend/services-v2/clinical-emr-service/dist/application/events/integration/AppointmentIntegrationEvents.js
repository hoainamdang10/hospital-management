"use strict";
/**
 * AppointmentIntegrationEvents - Application Layer
 * Integration events for appointment service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentNoShowEvent = exports.ReferralRequiredEvent = exports.FollowUpAppointmentRequiredEvent = exports.AppointmentCompletedEvent = void 0;
const IntegrationEvent_1 = require("../../../../shared/domain/events/IntegrationEvent");
/**
 * Appointment Completed Event
 * Triggered when an appointment is completed and medical record is created
 */
class AppointmentCompletedEvent extends IntegrationEvent_1.IntegrationEvent {
    constructor(appointmentId, recordId, patientId, doctorId, appointmentDetails, completionDetails, medicalSummary, completedBy, completedAt = new Date()) {
        super('clinical-emr.appointment.completed', appointmentId, {
            appointmentId,
            recordId,
            patientId,
            doctorId,
            appointmentDetails: {
                ...appointmentDetails,
                scheduledDate: appointmentDetails.scheduledDate.toISOString(),
                actualStartTime: appointmentDetails.actualStartTime.toISOString(),
                actualEndTime: appointmentDetails.actualEndTime.toISOString()
            },
            completionDetails: {
                ...completionDetails,
                followUpDate: completionDetails.followUpDate?.toISOString()
            },
            medicalSummary,
            completedBy,
            completedAt: completedAt.toISOString(),
            vietnameseMetadata: {
                appointmentType: this.getVietnameseAppointmentType(),
                completionStatus: this.getVietnameseCompletionStatus(),
                summary: this.getVietnameseSummary()
            }
        });
        this.appointmentId = appointmentId;
        this.recordId = recordId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDetails = appointmentDetails;
        this.completionDetails = completionDetails;
        this.medicalSummary = medicalSummary;
        this.completedBy = completedBy;
        this.completedAt = completedAt;
    }
    /**
     * Get Vietnamese appointment type
     */
    getVietnameseAppointmentType() {
        switch (this.appointmentDetails.appointmentType) {
            case 'consultation': return 'Khám tư vấn';
            case 'follow_up': return 'Tái khám';
            case 'emergency': return 'Cấp cứu';
            case 'procedure': return 'Thủ thuật';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese completion status
     */
    getVietnameseCompletionStatus() {
        switch (this.completionDetails.status) {
            case 'completed': return 'Hoàn thành';
            case 'completed_with_follow_up': return 'Hoàn thành - Cần tái khám';
            case 'partially_completed': return 'Hoàn thành một phần';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary() {
        const duration = this.getAppointmentDuration();
        return `Cuộc hẹn ${this.appointmentId} đã hoàn thành sau ${duration} phút với ${this.medicalSummary.diagnosisCount} chẩn đoán và ${this.medicalSummary.medicationCount} thuốc được kê.`;
    }
    /**
     * Get appointment duration in minutes
     */
    getAppointmentDuration() {
        const start = this.appointmentDetails.actualStartTime.getTime();
        const end = this.appointmentDetails.actualEndTime.getTime();
        return Math.round((end - start) / (1000 * 60));
    }
    /**
     * Check if appointment was on time
     */
    wasOnTime() {
        const scheduled = this.appointmentDetails.scheduledDate.getTime();
        const actual = this.appointmentDetails.actualStartTime.getTime();
        const delayMinutes = (actual - scheduled) / (1000 * 60);
        return delayMinutes <= 15; // Within 15 minutes is considered on time
    }
    /**
     * Get delay in minutes
     */
    getDelayMinutes() {
        const scheduled = this.appointmentDetails.scheduledDate.getTime();
        const actual = this.appointmentDetails.actualStartTime.getTime();
        return Math.max(0, Math.round((actual - scheduled) / (1000 * 60)));
    }
    /**
     * Check if requires immediate follow-up
     */
    requiresImmediateFollowUp() {
        return this.completionDetails.followUpRequired &&
            this.completionDetails.followUpType === 'urgent';
    }
    /**
     * Check if has critical findings
     */
    hasCriticalFindings() {
        return this.medicalSummary.criticalFindings ||
            this.medicalSummary.requiresHospitalization;
    }
}
exports.AppointmentCompletedEvent = AppointmentCompletedEvent;
/**
 * Follow-up Appointment Required Event
 * Triggered when a follow-up appointment needs to be scheduled
 */
class FollowUpAppointmentRequiredEvent extends IntegrationEvent_1.IntegrationEvent {
    constructor(originalAppointmentId, originalRecordId, patientId, doctorId, followUpDetails, clinicalReason, requestedBy, requestedAt = new Date()) {
        super('clinical-emr.follow-up.required', `${originalAppointmentId}-follow-up`, {
            originalAppointmentId,
            originalRecordId,
            patientId,
            doctorId,
            followUpDetails: {
                ...followUpDetails,
                suggestedDate: followUpDetails.suggestedDate?.toISOString()
            },
            clinicalReason,
            requestedBy,
            requestedAt: requestedAt.toISOString(),
            vietnameseMetadata: {
                followUpType: this.getVietnameseFollowUpType(),
                priority: this.getVietnamesePriority(),
                reason: this.getVietnameseReason()
            }
        });
        this.originalAppointmentId = originalAppointmentId;
        this.originalRecordId = originalRecordId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.followUpDetails = followUpDetails;
        this.clinicalReason = clinicalReason;
        this.requestedBy = requestedBy;
        this.requestedAt = requestedAt;
    }
    /**
     * Get Vietnamese follow-up type
     */
    getVietnameseFollowUpType() {
        switch (this.followUpDetails.type) {
            case 'routine': return 'Tái khám định kỳ';
            case 'urgent': return 'Tái khám khẩn cấp';
            case 'monitoring': return 'Theo dõi';
            case 'test_results': return 'Xem kết quả xét nghiệm';
            case 'medication_review': return 'Đánh giá thuốc';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese priority
     */
    getVietnamesePriority() {
        switch (this.followUpDetails.priority) {
            case 'critical': return 'Khẩn cấp';
            case 'high': return 'Cao';
            case 'medium': return 'Trung bình';
            case 'low': return 'Thấp';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese reason
     */
    getVietnameseReason() {
        return `Cần tái khám để ${this.clinicalReason.treatmentPlan.toLowerCase()}`;
    }
    /**
     * Get suggested appointment window
     */
    getSuggestedAppointmentWindow() {
        const now = new Date();
        const earliest = this.followUpDetails.suggestedDate ||
            new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const latest = new Date(now.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
        return { earliest, latest };
    }
    /**
     * Check if follow-up is overdue
     */
    isOverdue() {
        const now = new Date();
        const maxDate = new Date(this.requestedAt.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
        return now > maxDate;
    }
    /**
     * Get days until overdue
     */
    getDaysUntilOverdue() {
        const now = new Date();
        const maxDate = new Date(this.requestedAt.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
        const diffTime = maxDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
exports.FollowUpAppointmentRequiredEvent = FollowUpAppointmentRequiredEvent;
/**
 * Referral Required Event
 * Triggered when a patient needs to be referred to another specialist
 */
class ReferralRequiredEvent extends IntegrationEvent_1.IntegrationEvent {
    constructor(originalAppointmentId, originalRecordId, patientId, referringDoctorId, referralDetails, diagnosticInfo, referredBy, referredAt = new Date()) {
        super('clinical-emr.referral.required', `${originalAppointmentId}-referral`, {
            originalAppointmentId,
            originalRecordId,
            patientId,
            referringDoctorId,
            referralDetails: {
                ...referralDetails,
                preferredDate: referralDetails.preferredDate?.toISOString()
            },
            diagnosticInfo: {
                ...diagnosticInfo,
                testResults: diagnosticInfo.testResults?.map(test => ({
                    ...test,
                    date: test.date.toISOString()
                }))
            },
            referredBy,
            referredAt: referredAt.toISOString(),
            vietnameseMetadata: {
                specialty: this.getVietnameseSpecialty(),
                urgency: this.getVietnameseUrgency(),
                reason: this.getVietnameseReason()
            }
        });
        this.originalAppointmentId = originalAppointmentId;
        this.originalRecordId = originalRecordId;
        this.patientId = patientId;
        this.referringDoctorId = referringDoctorId;
        this.referralDetails = referralDetails;
        this.diagnosticInfo = diagnosticInfo;
        this.referredBy = referredBy;
        this.referredAt = referredAt;
    }
    /**
     * Get Vietnamese specialty
     */
    getVietnameseSpecialty() {
        const specialtyMap = {
            'cardiology': 'Tim mạch',
            'neurology': 'Thần kinh',
            'orthopedics': 'Chấn thương chỉnh hình',
            'dermatology': 'Da liễu',
            'gastroenterology': 'Tiêu hóa',
            'pulmonology': 'Hô hấp',
            'endocrinology': 'Nội tiết',
            'oncology': 'Ung bướu',
            'psychiatry': 'Tâm thần',
            'ophthalmology': 'Mắt',
            'ent': 'Tai mũi họng',
            'urology': 'Tiết niệu',
            'gynecology': 'Phụ khoa'
        };
        return specialtyMap[this.referralDetails.targetSpecialty.toLowerCase()] ||
            this.referralDetails.targetSpecialty;
    }
    /**
     * Get Vietnamese urgency
     */
    getVietnameseUrgency() {
        switch (this.referralDetails.urgency) {
            case 'emergency': return 'Cấp cứu';
            case 'urgent': return 'Khẩn cấp';
            case 'routine': return 'Thường quy';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese reason
     */
    getVietnameseReason() {
        return `Chuyển khoa ${this.getVietnameseSpecialty()} để ${this.referralDetails.clinicalReason.toLowerCase()}`;
    }
    /**
     * Check if referral is time-sensitive
     */
    isTimeSensitive() {
        return this.referralDetails.urgency === 'emergency' ||
            this.referralDetails.urgency === 'urgent' ||
            this.diagnosticInfo.testResults?.some(test => test.abnormal) === true;
    }
    /**
     * Get maximum wait time in days
     */
    getMaxWaitDays() {
        switch (this.referralDetails.urgency) {
            case 'emergency': return 1;
            case 'urgent': return 7;
            case 'routine': return this.referralDetails.maxWaitDays || 30;
            default: return 30;
        }
    }
    /**
     * Get referral priority score
     */
    getReferralPriorityScore() {
        let score = 0;
        // Base urgency score
        switch (this.referralDetails.urgency) {
            case 'emergency':
                score += 100;
                break;
            case 'urgent':
                score += 75;
                break;
            case 'routine':
                score += 25;
                break;
        }
        // Abnormal test results
        const abnormalTests = this.diagnosticInfo.testResults?.filter(test => test.abnormal).length || 0;
        score += abnormalTests * 10;
        // Multiple symptoms
        score += Math.min(this.diagnosticInfo.symptoms.length * 5, 25);
        // Secondary diagnoses
        score += (this.diagnosticInfo.secondaryDiagnoses?.length || 0) * 5;
        return Math.min(score, 100); // Cap at 100
    }
    /**
     * Get referral summary
     */
    getReferralSummary() {
        const specialty = this.getVietnameseSpecialty();
        const urgency = this.getVietnameseUrgency();
        const maxWait = this.getMaxWaitDays();
        return `Chuyển khoa ${specialty} (${urgency}) - Thời gian chờ tối đa: ${maxWait} ngày`;
    }
}
exports.ReferralRequiredEvent = ReferralRequiredEvent;
/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their appointment
 */
class AppointmentNoShowEvent extends IntegrationEvent_1.IntegrationEvent {
    constructor(appointmentId, patientId, doctorId, scheduledDate, noShowDetails, impactAssessment, recordedBy, recordedAt = new Date()) {
        super('clinical-emr.appointment.no-show', appointmentId, {
            appointmentId,
            patientId,
            doctorId,
            scheduledDate: scheduledDate.toISOString(),
            noShowDetails: {
                ...noShowDetails,
                lastContactTime: noShowDetails.lastContactTime?.toISOString(),
                suggestedRescheduleDate: noShowDetails.suggestedRescheduleDate?.toISOString()
            },
            impactAssessment,
            recordedBy,
            recordedAt: recordedAt.toISOString(),
            vietnameseMetadata: {
                status: 'Bệnh nhân không đến',
                reason: this.getVietnameseNoShowReason(),
                impact: this.getVietnameseImpact()
            }
        });
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.scheduledDate = scheduledDate;
        this.noShowDetails = noShowDetails;
        this.impactAssessment = impactAssessment;
        this.recordedBy = recordedBy;
        this.recordedAt = recordedAt;
    }
    /**
     * Get Vietnamese no-show reason
     */
    getVietnameseNoShowReason() {
        switch (this.noShowDetails.reason) {
            case 'no_contact': return 'Không liên lạc được';
            case 'patient_cancelled_late': return 'Bệnh nhân hủy muộn';
            case 'emergency': return 'Cấp cứu';
            case 'unknown': return 'Không rõ lý do';
            default: return 'Không xác định';
        }
    }
    /**
     * Get Vietnamese impact
     */
    getVietnameseImpact() {
        switch (this.impactAssessment.clinicalImpact) {
            case 'high': return 'Ảnh hưởng cao đến sức khỏe';
            case 'medium': return 'Ảnh hưởng trung bình';
            case 'low': return 'Ảnh hưởng thấp';
            case 'none': return 'Không ảnh hưởng';
            default: return 'Không xác định';
        }
    }
    /**
     * Check if requires immediate follow-up
     */
    requiresImmediateFollowUp() {
        return this.impactAssessment.clinicalImpact === 'high' ||
            this.impactAssessment.patientRiskLevel === 'high';
    }
    /**
     * Get recommended action
     */
    getRecommendedAction() {
        if (this.impactAssessment.clinicalImpact === 'high') {
            return 'Liên hệ ngay với bệnh nhân để sắp xếp cuộc hẹn khẩn cấp';
        }
        if (this.noShowDetails.reschedulingRequested) {
            return 'Sắp xếp lại cuộc hẹn theo yêu cầu của bệnh nhân';
        }
        if (this.impactAssessment.patientRiskLevel === 'high') {
            return 'Theo dõi bệnh nhân và nhắc nhở về tầm quan trọng của việc khám bệnh';
        }
        return 'Ghi nhận và theo dõi lịch sử vắng mặt của bệnh nhân';
    }
    /**
     * Calculate no-show penalty (if applicable)
     */
    calculateNoShowPenalty() {
        // Base penalty for no-show
        let penalty = 50000; // 50k VND base penalty
        // Increase penalty for late cancellation
        if (this.noShowDetails.reason === 'patient_cancelled_late') {
            penalty *= 0.5; // Reduce penalty for late cancellation vs complete no-show
        }
        // Reduce penalty if emergency
        if (this.noShowDetails.reason === 'emergency') {
            penalty = 0; // No penalty for emergencies
        }
        // Increase penalty for high clinical impact
        if (this.impactAssessment.clinicalImpact === 'high') {
            penalty *= 1.5;
        }
        return penalty;
    }
}
exports.AppointmentNoShowEvent = AppointmentNoShowEvent;
//# sourceMappingURL=AppointmentIntegrationEvents.js.map