/**
 * AppointmentIntegrationEvents - Application Layer
 * Integration events for appointment service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */

import { IntegrationEvent } from '../../../../shared/domain/events/IntegrationEvent';

/**
 * Appointment Completed Event
 * Triggered when an appointment is completed and medical record is created
 */
export class AppointmentCompletedEvent extends IntegrationEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDetails: {
      scheduledDate: Date;
      actualStartTime: Date;
      actualEndTime: Date;
      appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
      specialtyCode?: string;
      departmentCode?: string;
      roomNumber?: string;
    },
    public readonly completionDetails: {
      status: 'completed' | 'completed_with_follow_up' | 'partially_completed';
      completionNotes?: string;
      followUpRequired: boolean;
      followUpDate?: Date;
      followUpType?: 'routine' | 'urgent' | 'monitoring';
      referralRequired: boolean;
      referralSpecialty?: string;
      patientNoShow: boolean;
    },
    public readonly medicalSummary: {
      chiefComplaint?: string;
      diagnosisCount: number;
      medicationCount: number;
      procedureCount: number;
      vitalSignsRecorded: boolean;
      criticalFindings: boolean;
      requiresHospitalization: boolean;
    },
    public readonly completedBy: string,
    public readonly completedAt: Date = new Date()
  ) {
    super(
      'clinical-emr.appointment.completed',
      appointmentId,
      {
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
      }
    );
  }

  /**
   * Get Vietnamese appointment type
   */
  private getVietnameseAppointmentType(): string {
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
  private getVietnameseCompletionStatus(): string {
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
  private getVietnameseSummary(): string {
    const duration = this.getAppointmentDuration();
    return `Cuộc hẹn ${this.appointmentId} đã hoàn thành sau ${duration} phút với ${this.medicalSummary.diagnosisCount} chẩn đoán và ${this.medicalSummary.medicationCount} thuốc được kê.`;
  }

  /**
   * Get appointment duration in minutes
   */
  getAppointmentDuration(): number {
    const start = this.appointmentDetails.actualStartTime.getTime();
    const end = this.appointmentDetails.actualEndTime.getTime();
    return Math.round((end - start) / (1000 * 60));
  }

  /**
   * Check if appointment was on time
   */
  wasOnTime(): boolean {
    const scheduled = this.appointmentDetails.scheduledDate.getTime();
    const actual = this.appointmentDetails.actualStartTime.getTime();
    const delayMinutes = (actual - scheduled) / (1000 * 60);
    return delayMinutes <= 15; // Within 15 minutes is considered on time
  }

  /**
   * Get delay in minutes
   */
  getDelayMinutes(): number {
    const scheduled = this.appointmentDetails.scheduledDate.getTime();
    const actual = this.appointmentDetails.actualStartTime.getTime();
    return Math.max(0, Math.round((actual - scheduled) / (1000 * 60)));
  }

  /**
   * Check if requires immediate follow-up
   */
  requiresImmediateFollowUp(): boolean {
    return this.completionDetails.followUpRequired && 
           this.completionDetails.followUpType === 'urgent';
  }

  /**
   * Check if has critical findings
   */
  hasCriticalFindings(): boolean {
    return this.medicalSummary.criticalFindings || 
           this.medicalSummary.requiresHospitalization;
  }
}

/**
 * Follow-up Appointment Required Event
 * Triggered when a follow-up appointment needs to be scheduled
 */
export class FollowUpAppointmentRequiredEvent extends IntegrationEvent {
  constructor(
    public readonly originalAppointmentId: string,
    public readonly originalRecordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly followUpDetails: {
      type: 'routine' | 'urgent' | 'monitoring' | 'test_results' | 'medication_review';
      priority: 'low' | 'medium' | 'high' | 'critical';
      suggestedDate?: Date;
      maxDelayDays: number;
      specialInstructions?: string;
      requiredTests?: string[];
      continuedMedications?: string[];
    },
    public readonly clinicalReason: {
      diagnosisCodes: string[];
      monitoringRequired: string[];
      treatmentPlan: string;
      expectedOutcome: string;
    },
    public readonly requestedBy: string,
    public readonly requestedAt: Date = new Date()
  ) {
    super(
      'clinical-emr.follow-up.required',
      `${originalAppointmentId}-follow-up`,
      {
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
      }
    );
  }

  /**
   * Get Vietnamese follow-up type
   */
  private getVietnameseFollowUpType(): string {
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
  private getVietnamesePriority(): string {
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
  private getVietnameseReason(): string {
    return `Cần tái khám để ${this.clinicalReason.treatmentPlan.toLowerCase()}`;
  }

  /**
   * Get suggested appointment window
   */
  getSuggestedAppointmentWindow(): { earliest: Date; latest: Date } {
    const now = new Date();
    const earliest = this.followUpDetails.suggestedDate || 
                    new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const latest = new Date(now.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
    
    return { earliest, latest };
  }

  /**
   * Check if follow-up is overdue
   */
  isOverdue(): boolean {
    const now = new Date();
    const maxDate = new Date(this.requestedAt.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
    return now > maxDate;
  }

  /**
   * Get days until overdue
   */
  getDaysUntilOverdue(): number {
    const now = new Date();
    const maxDate = new Date(this.requestedAt.getTime() + this.followUpDetails.maxDelayDays * 24 * 60 * 60 * 1000);
    const diffTime = maxDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Referral Required Event
 * Triggered when a patient needs to be referred to another specialist
 */
export class ReferralRequiredEvent extends IntegrationEvent {
  constructor(
    public readonly originalAppointmentId: string,
    public readonly originalRecordId: string,
    public readonly patientId: string,
    public readonly referringDoctorId: string,
    public readonly referralDetails: {
      targetSpecialty: string;
      targetDoctorId?: string;
      targetDepartment?: string;
      urgency: 'routine' | 'urgent' | 'emergency';
      preferredDate?: Date;
      maxWaitDays: number;
      clinicalReason: string;
      relevantHistory: string;
      requiredTests?: string[];
      currentMedications?: string[];
    },
    public readonly diagnosticInfo: {
      primaryDiagnosis: string;
      secondaryDiagnoses?: string[];
      symptoms: string[];
      testResults?: Array<{
        testName: string;
        result: string;
        date: Date;
        abnormal: boolean;
      }>;
    },
    public readonly referredBy: string,
    public readonly referredAt: Date = new Date()
  ) {
    super(
      'clinical-emr.referral.required',
      `${originalAppointmentId}-referral`,
      {
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
      }
    );
  }

  /**
   * Get Vietnamese specialty
   */
  private getVietnameseSpecialty(): string {
    const specialtyMap: Record<string, string> = {
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
  private getVietnameseUrgency(): string {
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
  private getVietnameseReason(): string {
    return `Chuyển khoa ${this.getVietnameseSpecialty()} để ${this.referralDetails.clinicalReason.toLowerCase()}`;
  }

  /**
   * Check if referral is time-sensitive
   */
  isTimeSensitive(): boolean {
    return this.referralDetails.urgency === 'emergency' || 
           this.referralDetails.urgency === 'urgent' ||
           this.diagnosticInfo.testResults?.some(test => test.abnormal) === true;
  }

  /**
   * Get maximum wait time in days
   */
  getMaxWaitDays(): number {
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
  getReferralPriorityScore(): number {
    let score = 0;
    
    // Base urgency score
    switch (this.referralDetails.urgency) {
      case 'emergency': score += 100; break;
      case 'urgent': score += 75; break;
      case 'routine': score += 25; break;
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
  getReferralSummary(): string {
    const specialty = this.getVietnameseSpecialty();
    const urgency = this.getVietnameseUrgency();
    const maxWait = this.getMaxWaitDays();
    
    return `Chuyển khoa ${specialty} (${urgency}) - Thời gian chờ tối đa: ${maxWait} ngày`;
  }
}

/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their appointment
 */
export class AppointmentNoShowEvent extends IntegrationEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly scheduledDate: Date,
    public readonly noShowDetails: {
      waitTime: number; // minutes waited
      contactAttempts: number;
      lastContactTime?: Date;
      reason?: 'no_contact' | 'patient_cancelled_late' | 'emergency' | 'unknown';
      reschedulingRequested: boolean;
      suggestedRescheduleDate?: Date;
    },
    public readonly impactAssessment: {
      lostRevenue: number;
      affectedFollowingAppointments: number;
      patientRiskLevel: 'low' | 'medium' | 'high'; // Risk of missing future appointments
      clinicalImpact: 'none' | 'low' | 'medium' | 'high'; // Impact on patient health
    },
    public readonly recordedBy: string,
    public readonly recordedAt: Date = new Date()
  ) {
    super(
      'clinical-emr.appointment.no-show',
      appointmentId,
      {
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
      }
    );
  }

  /**
   * Get Vietnamese no-show reason
   */
  private getVietnameseNoShowReason(): string {
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
  private getVietnameseImpact(): string {
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
  requiresImmediateFollowUp(): boolean {
    return this.impactAssessment.clinicalImpact === 'high' ||
           this.impactAssessment.patientRiskLevel === 'high';
  }

  /**
   * Get recommended action
   */
  getRecommendedAction(): string {
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
  calculateNoShowPenalty(): number {
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
