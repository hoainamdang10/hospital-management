/**
 * NotificationIntegrationEvents - Application Layer
 * Integration events for notification service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */

import { IntegrationEvent } from '@shared/domain/base/domain-event';

/**
 * Medical Record Notification Event
 * Triggered when notifications need to be sent regarding medical records
 */
export class MedicalRecordNotificationEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly notificationType: 'record_completed' | 'critical_findings' | 'medication_alert' | 'follow_up_reminder' | 'test_results_available',
    public readonly recipients: Array<{
      type: 'patient' | 'doctor' | 'nurse' | 'family' | 'insurance' | 'pharmacy';
      id: string;
      contactInfo: {
        email?: string;
        phone?: string;
        address?: string;
      };
      preferredMethod: 'email' | 'sms' | 'push' | 'postal' | 'phone_call';
      language: 'vi' | 'en';
    }>,
    public readonly notificationContent: {
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: 'medical' | 'administrative' | 'billing' | 'appointment' | 'emergency';
      attachments?: Array<{
        type: 'pdf' | 'image' | 'document';
        name: string;
        url: string;
        size: number;
      }>;
      actionRequired?: {
        action: string;
        deadline?: Date;
        url?: string;
      };
    },
    public readonly medicalContext: {
      diagnosisCodes?: string[];
      medicationCodes?: string[];
      criticalFindings?: string[];
      followUpRequired?: boolean;
      urgentAction?: boolean;
    },
    public readonly triggeredBy: string,
    public readonly triggeredAt: Date = new Date()
  ) {
    const vietnameseNotificationType = (() => {
      switch (notificationType) {
        case 'record_completed': return 'Hồ sơ hoàn thành';
        case 'critical_findings': return 'Phát hiện quan trọng';
        case 'medication_alert': return 'Cảnh báo thuốc';
        case 'follow_up_reminder': return 'Nhắc nhở tái khám';
        case 'test_results_available': return 'Kết quả xét nghiệm có sẵn';
        default: return 'Không xác định';
      }
    })();

    const vietnamesePriority = (() => {
      switch (notificationContent.priority) {
        case 'critical': return 'Khẩn cấp';
        case 'high': return 'Cao';
        case 'medium': return 'Trung bình';
        case 'low': return 'Thấp';
        default: return 'Không xác định';
      }
    })();

    const vietnameseCategory = (() => {
      switch (notificationContent.category) {
        case 'medical': return 'Y tế';
        case 'administrative': return 'Hành chính';
        case 'billing': return 'Thanh toán';
        case 'appointment': return 'Lịch hẹn';
        case 'emergency': return 'Cấp cứu';
        default: return 'Không xác định';
      }
    })();

    super(
      'notification.medical-record',
      'clinical-emr-service',
      `${recordId}-${notificationType}`,
      'MedicalRecord',
      {
        recordId,
        patientId,
        doctorId,
        notificationType,
        recipients,
        notificationContent: {
          ...notificationContent,
          actionRequired: notificationContent.actionRequired ? {
            ...notificationContent.actionRequired,
            deadline: notificationContent.actionRequired.deadline?.toISOString()
          } : undefined
        },
        medicalContext,
        triggeredBy,
        triggeredAt: triggeredAt.toISOString(),
        vietnameseMetadata: {
          notificationType: vietnameseNotificationType,
          priority: vietnamesePriority,
          category: vietnameseCategory
        }
      },
      'notifications-service',
      undefined,
      triggeredBy
    );
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      notificationType: this.notificationType,
      recipients: this.recipients,
      notificationContent: this.notificationContent,
      medicalContext: this.medicalContext,
      triggeredBy: this.triggeredBy,
      triggeredAt: this.triggeredAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get Vietnamese notification type
   */
  private getVietnameseNotificationType(): string {
    switch (this.notificationType) {
      case 'record_completed': return 'Hồ sơ hoàn thành';
      case 'critical_findings': return 'Phát hiện quan trọng';
      case 'medication_alert': return 'Cảnh báo thuốc';
      case 'follow_up_reminder': return 'Nhắc nhở tái khám';
      case 'test_results_available': return 'Kết quả xét nghiệm có sẵn';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese priority
   */
  private getVietnamesePriority(): string {
    switch (this.notificationContent.priority) {
      case 'critical': return 'Khẩn cấp';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese category
   */
  private getVietnameseCategory(): string {
    switch (this.notificationContent.category) {
      case 'medical': return 'Y tế';
      case 'administrative': return 'Hành chính';
      case 'billing': return 'Thanh toán';
      case 'appointment': return 'Cuộc hẹn';
      case 'emergency': return 'Cấp cứu';
      default: return 'Không xác định';
    }
  }

  /**
   * Check if requires immediate delivery
   */
  requiresImmediateDelivery(): boolean {
    return this.notificationContent.priority === 'critical' ||
           this.medicalContext.urgentAction === true ||
           this.notificationContent.category === 'emergency';
  }

  /**
   * Get delivery deadline
   */
  getDeliveryDeadline(): Date {
    const now = new Date();
    
    switch (this.notificationContent.priority) {
      case 'critical':
        return new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      case 'high':
        return new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
      case 'medium':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      case 'low':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
  }

  /**
   * Get recipients by type
   */
  getRecipientsByType(type: string): Array<any> {
    return this.recipients.filter(recipient => recipient.type === type);
  }

  /**
   * Check if has attachments
   */
  hasAttachments(): boolean {
    return !!(this.notificationContent.attachments && this.notificationContent.attachments.length > 0);
  }

  /**
   * Get total attachment size
   */
  getTotalAttachmentSize(): number {
    if (!this.notificationContent.attachments) return 0;
    return this.notificationContent.attachments.reduce((total, attachment) => total + attachment.size, 0);
  }
}

/**
 * Critical Alert Notification Event
 * Triggered when critical medical alerts need immediate attention
 */
export class CriticalAlertNotificationEvent extends IntegrationEvent {
  constructor(
    public readonly alertId: string,
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly alertDetails: {
      type: 'critical_diagnosis' | 'drug_interaction' | 'allergy_alert' | 'vital_signs_critical' | 'lab_results_critical';
      severity: 'high' | 'critical' | 'life_threatening';
      description: string;
      clinicalSignificance: string;
      recommendedAction: string;
      timeWindow?: number; // minutes for action
    },
    public readonly medicalData: {
      relevantDiagnoses?: string[];
      relevantMedications?: string[];
      relevantAllergies?: string[];
      vitalSigns?: {
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        oxygenSaturation?: number;
      };
      labResults?: Array<{
        testName: string;
        value: string;
        normalRange: string;
        critical: boolean;
      }>;
    },
    public readonly escalationChain: Array<{
      level: number;
      recipientType: 'attending_doctor' | 'department_head' | 'emergency_team' | 'family' | 'administration';
      recipientId: string;
      contactMethod: 'phone_call' | 'sms' | 'pager' | 'email' | 'push';
      timeoutMinutes: number; // Time before escalating to next level
    }>,
    public readonly triggeredBy: string,
    public readonly triggeredAt: Date = new Date()
  ) {
    const vietnameseAlertType = (() => {
      switch (alertDetails.type) {
        case 'critical_diagnosis': return 'Chẩn đoán nghiêm trọng';
        case 'drug_interaction': return 'Tương tác thuốc';
        case 'allergy_alert': return 'Cảnh báo dị ứng';
        case 'vital_signs_critical': return 'Dấu hiệu sinh tồn nguy kịch';
        case 'lab_results_critical': return 'Kết quả xét nghiệm nguy kịch';
        default: return 'Không xác định';
      }
    })();

    const vietnameseSeverity = (() => {
      switch (alertDetails.severity) {
        case 'life_threatening': return 'Đe dọa tính mạng';
        case 'critical': return 'Nghiêm trọng';
        case 'high': return 'Cao';
        default: return 'Không xác định';
      }
    })();

    super(
      'notification.critical-alert',
      'clinical-emr-service',
      alertId,
      'Alert',
      {
        alertId,
        recordId,
        patientId,
        doctorId,
        alertDetails,
        medicalData,
        escalationChain,
        triggeredBy,
        triggeredAt: triggeredAt.toISOString(),
        vietnameseMetadata: {
          alertType: vietnameseAlertType,
          severity: vietnameseSeverity,
          urgency: 'Cần xử lý ngay lập tức'
        }
      },
      'notifications-service',
      undefined,
      triggeredBy
    );
  }

  getEventData(): any {
    return {
      alertId: this.alertId,
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      alertDetails: this.alertDetails,
      medicalData: this.medicalData,
      escalationChain: this.escalationChain,
      triggeredBy: this.triggeredBy,
      triggeredAt: this.triggeredAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get Vietnamese alert type
   */
  private getVietnameseAlertType(): string {
    switch (this.alertDetails.type) {
      case 'critical_diagnosis': return 'Chẩn đoán nghiêm trọng';
      case 'drug_interaction': return 'Tương tác thuốc';
      case 'allergy_alert': return 'Cảnh báo dị ứng';
      case 'vital_signs_critical': return 'Dấu hiệu sinh tồn nguy kịch';
      case 'lab_results_critical': return 'Kết quả xét nghiệm nguy kịch';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese severity
   */
  private getVietnameseSeverity(): string {
    switch (this.alertDetails.severity) {
      case 'life_threatening': return 'Đe dọa tính mạng';
      case 'critical': return 'Nghiêm trọng';
      case 'high': return 'Cao';
      default: return 'Không xác định';
    }
  }

  /**
   * Check if requires immediate escalation
   */
  requiresImmediateEscalation(): boolean {
    return this.alertDetails.severity === 'life_threatening' ||
           (this.alertDetails.timeWindow !== undefined && this.alertDetails.timeWindow <= 15);
  }

  /**
   * Get next escalation level
   */
  getNextEscalationLevel(currentLevel: number = 0): any | null {
    return this.escalationChain.find(level => level.level > currentLevel) || null;
  }

  /**
   * Get escalation timeout
   */
  getEscalationTimeout(level: number): Date {
    const escalationLevel = this.escalationChain.find(l => l.level === level);
    if (!escalationLevel) return new Date();
    
    return new Date(this.triggeredAt.getTime() + escalationLevel.timeoutMinutes * 60 * 1000);
  }

  /**
   * Check if alert has expired
   */
  isExpired(): boolean {
    if (!this.alertDetails.timeWindow) return false;
    
    const now = new Date();
    const expiryTime = new Date(this.triggeredAt.getTime() + this.alertDetails.timeWindow * 60 * 1000);
    return now > expiryTime;
  }

  /**
   * Get minutes remaining for action
   */
  getMinutesRemaining(): number {
    if (!this.alertDetails.timeWindow) return Infinity;
    
    const now = new Date();
    const expiryTime = new Date(this.triggeredAt.getTime() + this.alertDetails.timeWindow * 60 * 1000);
    const remainingMs = expiryTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
  }
}

/**
 * Medication Reminder Notification Event
 * Triggered when medication reminders need to be sent
 */
export class MedicationReminderNotificationEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly medicationDetails: {
      medicationCode: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      instructions: string;
      startDate: Date;
      endDate?: Date;
      remainingDoses?: number;
      nextDoseTime: Date;
      missedDoses: number;
    },
    public readonly reminderType: 'dose_reminder' | 'refill_reminder' | 'missed_dose_alert' | 'medication_review' | 'side_effects_check',
    public readonly patientContact: {
      preferredMethod: 'sms' | 'email' | 'push' | 'phone_call';
      contactValue: string;
      language: 'vi' | 'en';
      timeZone: string;
    },
    public readonly reminderContent: {
      title: string;
      message: string;
      instructions: string;
      sideEffectsToWatch?: string[];
      emergencyContact?: string;
    },
    public readonly scheduledFor: Date,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date()
  ) {
    const vietnameseReminderType = (() => {
      switch (reminderType) {
        case 'dose_reminder': return 'Nhắc nhở uống thuốc';
        case 'refill_reminder': return 'Nhắc nhở mua thuốc';
        case 'missed_dose_alert': return 'Cảnh báo quên uống thuốc';
        case 'medication_review': return 'Đánh giá thuốc';
        case 'side_effects_check': return 'Kiểm tra tác dụng phụ';
        default: return 'Không xác định';
      }
    })();

    const vietnameseNextDose = new Date(medicationDetails.nextDoseTime).toLocaleString('vi-VN');

    super(
      'notification.medication-reminder',
      'clinical-emr-service',
      `${recordId}-${medicationDetails.medicationCode}-${scheduledFor.getTime()}`,
      'Medication',
      {
        recordId,
        patientId,
        medicationDetails: {
          ...medicationDetails,
          startDate: medicationDetails.startDate.toISOString(),
          endDate: medicationDetails.endDate?.toISOString(),
          nextDoseTime: medicationDetails.nextDoseTime.toISOString()
        },
        reminderType,
        patientContact,
        reminderContent,
        scheduledFor: scheduledFor.toISOString(),
        createdBy,
        createdAt: createdAt.toISOString(),
        vietnameseMetadata: {
          reminderType: vietnameseReminderType,
          medicationName: medicationDetails.medicationName,
          nextDose: vietnameseNextDose
        }
      },
      'notifications-service',
      undefined,
      createdBy
    );
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      medicationDetails: this.medicationDetails,
      reminderType: this.reminderType,
      patientContact: this.patientContact,
      reminderContent: this.reminderContent,
      scheduledFor: this.scheduledFor,
      createdBy: this.createdBy,
      createdAt: this.createdAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get Vietnamese reminder type
   */
  private getVietnameseReminderType(): string {
    switch (this.reminderType) {
      case 'dose_reminder': return 'Nhắc nhở uống thuốc';
      case 'refill_reminder': return 'Nhắc nhở mua thuốc';
      case 'missed_dose_alert': return 'Cảnh báo bỏ liều';
      case 'medication_review': return 'Đánh giá thuốc';
      case 'side_effects_check': return 'Kiểm tra tác dụng phụ';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese next dose time
   */
  private getVietnameseNextDoseTime(): string {
    return this.medicationDetails.nextDoseTime.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if reminder is overdue
   */
  isOverdue(): boolean {
    return new Date() > this.scheduledFor;
  }

  /**
   * Get minutes until scheduled time
   */
  getMinutesUntilScheduled(): number {
    const now = new Date();
    const diffMs = this.scheduledFor.getTime() - now.getTime();
    return Math.ceil(diffMs / (60 * 1000));
  }

  /**
   * Check if medication is ending soon
   */
  isMedicationEndingSoon(): boolean {
    if (!this.medicationDetails.endDate) return false;
    
    const now = new Date();
    const daysUntilEnd = (this.medicationDetails.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilEnd <= 3; // 3 days or less
  }

  /**
   * Check if refill is needed
   */
  needsRefill(): boolean {
    return !!(this.medicationDetails.remainingDoses && this.medicationDetails.remainingDoses <= 3);
  }

  /**
   * Get adherence status
   */
  getAdherenceStatus(): 'good' | 'fair' | 'poor' {
    const missedDoses = this.medicationDetails.missedDoses;
    
    if (missedDoses === 0) return 'good';
    if (missedDoses <= 2) return 'fair';
    return 'poor';
  }

  /**
   * Get Vietnamese adherence status
   */
  getVietnameseAdherenceStatus(): string {
    switch (this.getAdherenceStatus()) {
      case 'good': return 'Tuân thủ tốt';
      case 'fair': return 'Tuân thủ khá';
      case 'poor': return 'Tuân thủ kém';
      default: return 'Không xác định';
    }
  }
}

/**
 * Test Results Notification Event
 * Triggered when test results are available and need to be communicated
 */
export class TestResultsNotificationEvent extends IntegrationEvent {
  constructor(
    public readonly recordId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly testResults: Array<{
      testId: string;
      testName: string;
      testType: 'blood' | 'urine' | 'imaging' | 'biopsy' | 'culture' | 'other';
      result: string;
      normalRange?: string;
      unit?: string;
      status: 'normal' | 'abnormal' | 'critical' | 'pending';
      performedDate: Date;
      resultDate: Date;
      interpretation?: string;
      followUpRequired: boolean;
    }>,
    public readonly notificationTargets: Array<{
      recipientType: 'patient' | 'doctor' | 'referring_doctor' | 'family';
      recipientId: string;
      deliveryMethod: 'secure_portal' | 'email' | 'phone_call' | 'postal';
      urgency: 'routine' | 'urgent' | 'critical';
    }>,
    public readonly resultSummary: {
      totalTests: number;
      normalResults: number;
      abnormalResults: number;
      criticalResults: number;
      pendingResults: number;
      overallAssessment: 'normal' | 'requires_attention' | 'critical';
      doctorNotes?: string;
    },
    public readonly releasedBy: string,
    public readonly releasedAt: Date = new Date()
  ) {
    const vietnameseOverallStatus = (() => {
      switch (resultSummary.overallAssessment) {
        case 'normal': return 'Bình thường';
        case 'requires_attention': return 'Cần chú ý';
        case 'critical': return 'Nghiêm trọng';
        default: return 'Không xác định';
      }
    })();

    const vietnameseSummary = `${resultSummary.totalTests} xét nghiệm: ${resultSummary.normalResults} bình thường, ${resultSummary.abnormalResults} bất thường, ${resultSummary.criticalResults} nghiêm trọng`;

    super(
      'notification.test-results',
      'clinical-emr-service',
      `${recordId}-test-results`,
      'TestResults',
      {
        recordId,
        patientId,
        doctorId,
        testResults: testResults.map(test => ({
          ...test,
          performedDate: test.performedDate.toISOString(),
          resultDate: test.resultDate.toISOString()
        })),
        notificationTargets,
        resultSummary,
        releasedBy,
        releasedAt: releasedAt.toISOString(),
        vietnameseMetadata: {
          totalTests: testResults.length,
          criticalCount: testResults.filter(t => t.status === 'critical').length,
          overallStatus: vietnameseOverallStatus,
          summary: vietnameseSummary
        }
      },
      'notifications-service',
      undefined,
      releasedBy
    );
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      testResults: this.testResults,
      notificationTargets: this.notificationTargets,
      resultSummary: this.resultSummary,
      releasedBy: this.releasedBy,
      releasedAt: this.releasedAt
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get Vietnamese overall status
   */
  private getVietnameseOverallStatus(): string {
    switch (this.resultSummary.overallAssessment) {
      case 'normal': return 'Bình thường';
      case 'requires_attention': return 'Cần chú ý';
      case 'critical': return 'Nghiêm trọng';
      default: return 'Không xác định';
    }
  }

  /**
   * Get Vietnamese summary
   */
  private getVietnameseSummary(): string {
    const { totalTests, normalResults, abnormalResults, criticalResults } = this.resultSummary;
    return `${totalTests} xét nghiệm: ${normalResults} bình thường, ${abnormalResults} bất thường, ${criticalResults} nghiêm trọng`;
  }

  /**
   * Check if has critical results
   */
  hasCriticalResults(): boolean {
    return this.resultSummary.criticalResults > 0;
  }

  /**
   * Get critical tests
   */
  getCriticalTests(): Array<any> {
    return this.testResults.filter(test => test.status === 'critical');
  }

  /**
   * Check if requires immediate doctor consultation
   */
  requiresImmediateDoctorConsultation(): boolean {
    return this.resultSummary.overallAssessment === 'critical' ||
           this.testResults.some(test => test.followUpRequired && test.status === 'critical');
  }

  /**
   * Get delivery priority
   */
  getDeliveryPriority(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.hasCriticalResults()) return 'critical';
    if (this.resultSummary.overallAssessment === 'requires_attention') return 'high';
    if (this.resultSummary.abnormalResults > 0) return 'medium';
    return 'low';
  }

  /**
   * Get recommended delivery timeframe (in minutes)
   */
  getRecommendedDeliveryTimeframe(): number {
    switch (this.getDeliveryPriority()) {
      case 'critical': return 15; // 15 minutes
      case 'high': return 60; // 1 hour
      case 'medium': return 240; // 4 hours
      case 'low': return 1440; // 24 hours
      default: return 60;
    }
  }
}
