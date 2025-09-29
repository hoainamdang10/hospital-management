/**
 * Patient Deactivated Domain Event
 * Raised when a patient account is deactivated
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Event Sourcing, HIPAA
 */

import { DomainEvent } from '../domain-event';

export interface PatientDeactivatedEventData {
  patientId: string;
  reason: string;
  deactivatedAt: Date;
  deactivatedBy?: string;
  retentionPeriod?: number; // Days to retain data
  dataArchivalRequired: boolean;
}

/**
 * Patient Deactivated Domain Event
 * Contains information about patient account deactivation
 */
export class PatientDeactivatedEvent extends DomainEvent {
  private readonly eventData: PatientDeactivatedEventData;

  constructor(
    eventData: PatientDeactivatedEventData,
    correlationId?: string,
    causationId?: string,
    userId?: string
  ) {
    super(
      'PatientDeactivated',
      eventData.patientId,
      'Patient',
      eventData,
      1,
      correlationId,
      causationId,
      userId
    );
    this.eventData = {
      ...eventData,
      retentionPeriod: eventData.retentionPeriod || 2555, // 7 years default for HIPAA
      dataArchivalRequired: true,
    };
  }

  /**
   * Get event data payload
   */
  public getEventData(): PatientDeactivatedEventData {
    return this.eventData;
  }

  /**
   * Check if event contains PHI (Protected Health Information)
   */
  public containsPHI(): boolean {
    return true; // Patient deactivation involves PHI
  }

  /**
   * Get patient ID from event
   */
  public getPatientId(): string {
    return this.eventData.patientId;
  }

  /**
   * Get event description for audit logs
   */
  public getEventDescription(): string {
    return `Tài khoản bệnh nhân ${this.eventData.patientId} đã được vô hiệu hóa. Lý do: ${this.eventData.reason}`;
  }

  /**
   * Get deactivation reason
   */
  public getDeactivationReason(): string {
    return this.eventData.reason;
  }

  /**
   * Get deactivation timestamp
   */
  public getDeactivatedAt(): Date {
    return this.eventData.deactivatedAt;
  }

  /**
   * Get who deactivated the account
   */
  public getDeactivatedBy(): string | undefined {
    return this.eventData.deactivatedBy;
  }

  /**
   * Get data retention period in days
   */
  public getRetentionPeriod(): number {
    return this.eventData.retentionPeriod || 2555; // 7 years
  }

  /**
   * Calculate data deletion date
   */
  public getDataDeletionDate(): Date {
    const deletionDate = new Date(this.eventData.deactivatedAt);
    deletionDate.setDate(deletionDate.getDate() + this.getRetentionPeriod());
    return deletionDate;
  }

  /**
   * Check if data archival is required
   */
  public isDataArchivalRequired(): boolean {
    return this.eventData.dataArchivalRequired;
  }

  /**
   * Get deactivation category based on reason
   */
  public getDeactivationCategory(): 'patient_request' | 'administrative' | 'deceased' | 'data_quality' | 'other' {
    const reason = this.eventData.reason.toLowerCase();
    
    if (reason.includes('yêu cầu') || reason.includes('request')) {
      return 'patient_request';
    }
    if (reason.includes('tử vong') || reason.includes('deceased') || reason.includes('death')) {
      return 'deceased';
    }
    if (reason.includes('quản trị') || reason.includes('admin') || reason.includes('policy')) {
      return 'administrative';
    }
    if (reason.includes('dữ liệu') || reason.includes('data') || reason.includes('duplicate')) {
      return 'data_quality';
    }
    
    return 'other';
  }

  /**
   * Get HIPAA compliance requirements for deactivation
   */
  public getHIPAAComplianceRequirements(): {
    patientNotificationRequired: boolean;
    dataRetentionPeriod: number;
    archivalRequired: boolean;
    accessLogRetention: number;
    specialHandlingRequired: boolean;
  } {
    const category = this.getDeactivationCategory();
    
    return {
      patientNotificationRequired: category !== 'deceased',
      dataRetentionPeriod: this.getRetentionPeriod(),
      archivalRequired: this.isDataArchivalRequired(),
      accessLogRetention: 2555, // 7 years for access logs
      specialHandlingRequired: category === 'deceased' || category === 'patient_request',
    };
  }

  /**
   * Get actions required after deactivation
   */
  public getRequiredActions(): {
    action: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
    responsible: string;
  }[] {
    const actions: {
      action: string;
      priority: 'high' | 'medium' | 'low';
      dueDate?: Date;
      responsible: string;
    }[] = [];

    const category = this.getDeactivationCategory();
    const now = new Date();

    // Immediate actions
    actions.push({
      action: 'Vô hiệu hóa quyền truy cập hệ thống',
      priority: 'high',
      dueDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
      responsible: 'IT Security',
    });

    actions.push({
      action: 'Hủy các cuộc hẹn đã lên lịch',
      priority: 'high',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      responsible: 'Appointment Service',
    });

    // Patient notification (if required)
    const compliance = this.getHIPAAComplianceRequirements();
    if (compliance.patientNotificationRequired) {
      actions.push({
        action: 'Thông báo cho bệnh nhân về việc vô hiệu hóa tài khoản',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        responsible: 'Patient Relations',
      });
    }

    // Data archival
    if (compliance.archivalRequired) {
      actions.push({
        action: 'Lưu trữ dữ liệu bệnh nhân',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        responsible: 'Data Management',
      });
    }

    // Special handling for deceased patients
    if (category === 'deceased') {
      actions.push({
        action: 'Cập nhật trạng thái tử vong trong hồ sơ y tế',
        priority: 'high',
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        responsible: 'Medical Records',
      });

      actions.push({
        action: 'Thông báo cho các bộ phận liên quan',
        priority: 'medium',
        dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
        responsible: 'Administration',
      });
    }

    // Data deletion scheduling
    actions.push({
      action: 'Lên lịch xóa dữ liệu sau thời gian lưu trữ',
      priority: 'low',
      dueDate: this.getDataDeletionDate(),
      responsible: 'Data Management',
    });

    return actions;
  }

  /**
   * Get deactivation summary for reporting
   */
  public getDeactivationSummary(): {
    patientId: string;
    reason: string;
    category: string;
    deactivatedAt: Date;
    deactivatedBy?: string;
    dataDeletionDate: Date;
    immediateActionsRequired: number;
    complianceRequirements: any;
  } {
    const requiredActions = this.getRequiredActions();
    const immediateActions = requiredActions.filter(action => action.priority === 'high');

    return {
      patientId: this.eventData.patientId,
      reason: this.eventData.reason,
      category: this.getDeactivationCategory(),
      deactivatedAt: this.eventData.deactivatedAt,
      deactivatedBy: this.eventData.deactivatedBy,
      dataDeletionDate: this.getDataDeletionDate(),
      immediateActionsRequired: immediateActions.length,
      complianceRequirements: this.getHIPAAComplianceRequirements(),
    };
  }

  /**
   * Check if deactivation is reversible
   */
  public isReversible(): boolean {
    const category = this.getDeactivationCategory();
    
    // Deceased patients and data quality issues are typically not reversible
    return category !== 'deceased' && category !== 'data_quality';
  }

  /**
   * Get reactivation requirements if applicable
   */
  public getReactivationRequirements(): string[] | null {
    if (!this.isReversible()) return null;

    const requirements: string[] = [];
    const category = this.getDeactivationCategory();

    switch (category) {
      case 'patient_request':
        requirements.push('Yêu cầu bằng văn bản từ bệnh nhân');
        requirements.push('Xác minh danh tính bệnh nhân');
        requirements.push('Phê duyệt từ quản lý dữ liệu');
        break;
      
      case 'administrative':
        requirements.push('Phê duyệt từ quản trị viên cấp cao');
        requirements.push('Xem xét lý do vô hiệu hóa ban đầu');
        requirements.push('Cập nhật thông tin bệnh nhân nếu cần');
        break;
      
      default:
        requirements.push('Xem xét từ ban quản lý');
        requirements.push('Xác minh tính hợp lệ của yêu cầu');
        break;
    }

    return requirements;
  }
}
