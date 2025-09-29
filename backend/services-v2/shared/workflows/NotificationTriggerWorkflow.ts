/**
 * NotificationTriggerWorkflow - Automated Notification Trigger Workflows
 * Orchestrates automated notifications across healthcare workflows and events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Multi-channel Notifications, HIPAA
 */

import { WorkflowOrchestrator, WorkflowDefinition, WorkflowStep, WorkflowStepStatus } from './WorkflowOrchestrator';

export interface NotificationContext {
  recipientId: string;
  recipientType: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'FAMILY' | 'EMERGENCY_CONTACT';
  notificationType: 'APPOINTMENT' | 'MEDICATION' | 'EMERGENCY' | 'BILLING' | 'GENERAL' | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  channels: Array<'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'VOICE' | 'WHATSAPP'>;
  templateId: string;
  templateData: any;
  scheduledTime?: Date;
  expiryTime?: Date;
  vietnameseContent: {
    subject: string;
    message: string;
    actionText?: string;
  };
  healthcareContext: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    medicalRecordId?: string;
    invoiceId?: string;
    emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export interface ReminderContext {
  reminderId: string;
  reminderType: 'APPOINTMENT' | 'MEDICATION' | 'FOLLOW_UP' | 'PAYMENT' | 'INSURANCE';
  targetDateTime: Date;
  reminderSchedule: Array<{
    timeOffset: number; // minutes before target
    channels: string[];
    templateId: string;
  }>;
  recurrence?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    endDate?: Date;
  };
}

export interface EmergencyNotificationContext {
  emergencyId: string;
  emergencyType: 'MEDICAL' | 'SYSTEM' | 'SECURITY' | 'NATURAL_DISASTER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedPatients: string[];
  emergencyContacts: Array<{
    contactId: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  }>;
  emergencyTeam: string[];
  escalationRules: Array<{
    level: number;
    timeoutMinutes: number;
    recipients: string[];
  }>;
}

export class NotificationTriggerWorkflow {
  private static instance: NotificationTriggerWorkflow;
  private orchestrator: WorkflowOrchestrator;

  private constructor() {
    this.orchestrator = WorkflowOrchestrator.getInstance();
    this.registerNotificationTriggerWorkflows();
  }

  public static getInstance(): NotificationTriggerWorkflow {
    if (!NotificationTriggerWorkflow.instance) {
      NotificationTriggerWorkflow.instance = new NotificationTriggerWorkflow();
    }
    return NotificationTriggerWorkflow.instance;
  }

  /**
   * Register all notification trigger workflows
   */
  private registerNotificationTriggerWorkflows(): void {
    console.log('📢 Registering Notification Trigger Workflows');

    this.registerAppointmentNotificationWorkflow();
    this.registerMedicationReminderWorkflow();
    this.registerEmergencyNotificationWorkflow();
    this.registerBillingNotificationWorkflow();
    this.registerSystemNotificationWorkflow();
    this.registerFollowUpReminderWorkflow();
    this.registerInsuranceNotificationWorkflow();
    this.registerMultiChannelNotificationWorkflow();

    console.log('✅ All Notification Trigger Workflows registered');
  }

  /**
   * Appointment Notification Workflow
   */
  private registerAppointmentNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'appointment-notification',
      workflowName: 'Appointment Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Lịch hẹn',
      description: 'Automated appointment notifications and reminders',
      vietnameseDescription: 'Thông báo và nhắc nhở lịch hẹn tự động',
      steps: [
        {
          stepId: 'send-appointment-confirmation',
          stepName: 'Send Appointment Confirmation',
          serviceName: 'notifications-service',
          action: 'send-appointment-confirmation',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi xác nhận lịch hẹn',
          healthcareContext: 'APPOINTMENT_CONFIRMATION'
        },
        {
          stepId: 'schedule-24h-reminder',
          stepName: 'Schedule 24-Hour Reminder',
          serviceName: 'notifications-service',
          action: 'schedule-appointment-reminder',
          input: { timeOffset: 1440 }, // 24 hours
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Lên lịch nhắc nhở 24 giờ trước',
          healthcareContext: 'APPOINTMENT_REMINDER_24H'
        },
        {
          stepId: 'schedule-2h-reminder',
          stepName: 'Schedule 2-Hour Reminder',
          serviceName: 'notifications-service',
          action: 'schedule-appointment-reminder',
          input: { timeOffset: 120 }, // 2 hours
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Lên lịch nhắc nhở 2 giờ trước',
          healthcareContext: 'APPOINTMENT_REMINDER_2H'
        },
        {
          stepId: 'notify-doctor',
          stepName: 'Notify Doctor of Appointment',
          serviceName: 'notifications-service',
          action: 'notify-doctor-appointment',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Thông báo bác sĩ về lịch hẹn',
          healthcareContext: 'DOCTOR_APPOINTMENT_NOTIFICATION'
        },
        {
          stepId: 'update-appointment-notification-status',
          stepName: 'Update Notification Status',
          serviceName: 'scheduling-service',
          action: 'update-notification-status',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Cập nhật trạng thái thông báo',
          healthcareContext: 'NOTIFICATION_STATUS_UPDATE'
        }
      ],
      compensationSteps: [],
      timeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Medication Reminder Workflow
   */
  private registerMedicationReminderWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'medication-reminder',
      workflowName: 'Medication Reminder Workflow',
      vietnameseWorkflowName: 'Quy trình Nhắc nhở Uống thuốc',
      description: 'Automated medication reminders and adherence tracking',
      vietnameseDescription: 'Nhắc nhở uống thuốc tự động và theo dõi tuân thủ',
      steps: [
        {
          stepId: 'create-medication-schedule',
          stepName: 'Create Medication Schedule',
          serviceName: 'notifications-service',
          action: 'create-medication-schedule',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo lịch uống thuốc',
          healthcareContext: 'MEDICATION_SCHEDULE_CREATION'
        },
        {
          stepId: 'schedule-daily-reminders',
          stepName: 'Schedule Daily Medication Reminders',
          serviceName: 'notifications-service',
          action: 'schedule-medication-reminders',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'cancel-medication-reminders',
          vietnameseDescription: 'Lên lịch nhắc nhở hàng ngày',
          healthcareContext: 'DAILY_MEDICATION_REMINDERS'
        },
        {
          stepId: 'track-medication-adherence',
          stepName: 'Track Medication Adherence',
          serviceName: 'clinical-emr-service',
          action: 'track-medication-adherence',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Theo dõi tuân thủ uống thuốc',
          healthcareContext: 'MEDICATION_ADHERENCE_TRACKING'
        },
        {
          stepId: 'send-adherence-report',
          stepName: 'Send Adherence Report to Doctor',
          serviceName: 'notifications-service',
          action: 'send-adherence-report',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi báo cáo tuân thủ cho bác sĩ',
          healthcareContext: 'ADHERENCE_REPORT_NOTIFICATION'
        }
      ],
      compensationSteps: [],
      timeout: 600000, // 10 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Emergency Notification Workflow
   */
  private registerEmergencyNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'emergency-notification',
      workflowName: 'Emergency Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Khẩn cấp',
      description: 'Critical emergency notifications with escalation',
      vietnameseDescription: 'Thông báo khẩn cấp quan trọng với leo thang',
      steps: [
        {
          stepId: 'assess-emergency-severity',
          stepName: 'Assess Emergency Severity',
          serviceName: 'notifications-service',
          action: 'assess-emergency-severity',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Đánh giá mức độ khẩn cấp',
          healthcareContext: 'EMERGENCY_SEVERITY_ASSESSMENT'
        },
        {
          stepId: 'notify-emergency-team',
          stepName: 'Notify Emergency Response Team',
          serviceName: 'notifications-service',
          action: 'notify-emergency-team',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Thông báo đội ứng phó khẩn cấp',
          healthcareContext: 'EMERGENCY_TEAM_NOTIFICATION'
        },
        {
          stepId: 'notify-emergency-contacts',
          stepName: 'Notify Emergency Contacts',
          serviceName: 'notifications-service',
          action: 'notify-emergency-contacts',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Thông báo người liên hệ khẩn cấp',
          healthcareContext: 'EMERGENCY_CONTACT_NOTIFICATION'
        },
        {
          stepId: 'escalate-if-no-response',
          stepName: 'Escalate if No Response',
          serviceName: 'notifications-service',
          action: 'escalate-emergency-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Leo thang nếu không có phản hồi',
          healthcareContext: 'EMERGENCY_ESCALATION'
        },
        {
          stepId: 'log-emergency-response',
          stepName: 'Log Emergency Response',
          serviceName: 'clinical-emr-service',
          action: 'log-emergency-response',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Ghi nhận phản ứng khẩn cấp',
          healthcareContext: 'EMERGENCY_RESPONSE_LOGGING'
        }
      ],
      compensationSteps: [],
      timeout: 120000, // 2 minutes - Emergency needs to be fast
      retryPolicy: {
        maxRetries: 2,
        retryDelay: 500,
        backoffMultiplier: 1.5
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Billing Notification Workflow
   */
  private registerBillingNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'billing-notification',
      workflowName: 'Billing Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Thanh toán',
      description: 'Automated billing and payment notifications',
      vietnameseDescription: 'Thông báo thanh toán và hóa đơn tự động',
      steps: [
        {
          stepId: 'send-invoice-notification',
          stepName: 'Send Invoice Notification',
          serviceName: 'notifications-service',
          action: 'send-invoice-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi thông báo hóa đơn',
          healthcareContext: 'INVOICE_NOTIFICATION'
        },
        {
          stepId: 'schedule-payment-reminder',
          stepName: 'Schedule Payment Reminder',
          serviceName: 'notifications-service',
          action: 'schedule-payment-reminder',
          input: { timeOffset: 4320 }, // 3 days
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'cancel-payment-reminder',
          vietnameseDescription: 'Lên lịch nhắc nhở thanh toán',
          healthcareContext: 'PAYMENT_REMINDER_SCHEDULING'
        },
        {
          stepId: 'send-payment-confirmation',
          stepName: 'Send Payment Confirmation',
          serviceName: 'notifications-service',
          action: 'send-payment-confirmation',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi xác nhận thanh toán',
          healthcareContext: 'PAYMENT_CONFIRMATION'
        },
        {
          stepId: 'notify-insurance-status',
          stepName: 'Notify Insurance Status',
          serviceName: 'notifications-service',
          action: 'notify-insurance-status',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Thông báo trạng thái bảo hiểm',
          healthcareContext: 'INSURANCE_STATUS_NOTIFICATION'
        }
      ],
      compensationSteps: [],
      timeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * System Notification Workflow
   */
  private registerSystemNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'system-notification',
      workflowName: 'System Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Hệ thống',
      description: 'System-wide notifications and announcements',
      vietnameseDescription: 'Thông báo và công bố toàn hệ thống',
      steps: [
        {
          stepId: 'validate-system-notification',
          stepName: 'Validate System Notification',
          serviceName: 'notifications-service',
          action: 'validate-system-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác thực thông báo hệ thống',
          healthcareContext: 'SYSTEM_NOTIFICATION_VALIDATION'
        },
        {
          stepId: 'broadcast-to-all-users',
          stepName: 'Broadcast to All Users',
          serviceName: 'notifications-service',
          action: 'broadcast-system-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Phát sóng tới tất cả người dùng',
          healthcareContext: 'SYSTEM_BROADCAST'
        },
        {
          stepId: 'track-notification-delivery',
          stepName: 'Track Notification Delivery',
          serviceName: 'notifications-service',
          action: 'track-notification-delivery',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Theo dõi việc gửi thông báo',
          healthcareContext: 'NOTIFICATION_DELIVERY_TRACKING'
        },
        {
          stepId: 'generate-delivery-report',
          stepName: 'Generate Delivery Report',
          serviceName: 'notifications-service',
          action: 'generate-delivery-report',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo báo cáo gửi thông báo',
          healthcareContext: 'DELIVERY_REPORT_GENERATION'
        }
      ],
      compensationSteps: [],
      timeout: 600000, // 10 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: false, // System notifications may not contain PHI
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Follow-up Reminder Workflow
   */
  private registerFollowUpReminderWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'follow-up-reminder',
      workflowName: 'Follow-up Reminder Workflow',
      vietnameseWorkflowName: 'Quy trình Nhắc nhở Tái khám',
      description: 'Automated follow-up appointment reminders',
      vietnameseDescription: 'Nhắc nhở tái khám tự động',
      steps: [
        {
          stepId: 'calculate-follow-up-date',
          stepName: 'Calculate Follow-up Date',
          serviceName: 'scheduling-service',
          action: 'calculate-follow-up-date',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tính toán ngày tái khám',
          healthcareContext: 'FOLLOW_UP_DATE_CALCULATION'
        },
        {
          stepId: 'schedule-follow-up-reminder',
          stepName: 'Schedule Follow-up Reminder',
          serviceName: 'notifications-service',
          action: 'schedule-follow-up-reminder',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'cancel-follow-up-reminder',
          vietnameseDescription: 'Lên lịch nhắc nhở tái khám',
          healthcareContext: 'FOLLOW_UP_REMINDER_SCHEDULING'
        },
        {
          stepId: 'send-follow-up-notification',
          stepName: 'Send Follow-up Notification',
          serviceName: 'notifications-service',
          action: 'send-follow-up-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi thông báo tái khám',
          healthcareContext: 'FOLLOW_UP_NOTIFICATION'
        },
        {
          stepId: 'track-follow-up-response',
          stepName: 'Track Follow-up Response',
          serviceName: 'scheduling-service',
          action: 'track-follow-up-response',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Theo dõi phản hồi tái khám',
          healthcareContext: 'FOLLOW_UP_RESPONSE_TRACKING'
        }
      ],
      compensationSteps: [],
      timeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Insurance Notification Workflow
   */
  private registerInsuranceNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'insurance-notification',
      workflowName: 'Insurance Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Bảo hiểm',
      description: 'Insurance-related notifications and updates',
      vietnameseDescription: 'Thông báo và cập nhật liên quan đến bảo hiểm',
      steps: [
        {
          stepId: 'notify-insurance-expiry',
          stepName: 'Notify Insurance Expiry',
          serviceName: 'notifications-service',
          action: 'notify-insurance-expiry',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Thông báo hết hạn bảo hiểm',
          healthcareContext: 'INSURANCE_EXPIRY_NOTIFICATION'
        },
        {
          stepId: 'notify-claim-status',
          stepName: 'Notify Claim Status Update',
          serviceName: 'notifications-service',
          action: 'notify-claim-status',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Thông báo cập nhật trạng thái yêu cầu',
          healthcareContext: 'CLAIM_STATUS_NOTIFICATION'
        },
        {
          stepId: 'send-bhyt-renewal-reminder',
          stepName: 'Send BHYT Renewal Reminder',
          serviceName: 'notifications-service',
          action: 'send-bhyt-renewal-reminder',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi nhắc nhở gia hạn BHYT',
          healthcareContext: 'BHYT_RENEWAL_REMINDER'
        }
      ],
      compensationSteps: [],
      timeout: 300000, // 5 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Multi-channel Notification Workflow
   */
  private registerMultiChannelNotificationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'multi-channel-notification',
      workflowName: 'Multi-channel Notification Workflow',
      vietnameseWorkflowName: 'Quy trình Thông báo Đa kênh',
      description: 'Send notifications across multiple channels with fallback',
      vietnameseDescription: 'Gửi thông báo qua nhiều kênh với dự phòng',
      steps: [
        {
          stepId: 'determine-preferred-channels',
          stepName: 'Determine Preferred Channels',
          serviceName: 'notifications-service',
          action: 'determine-preferred-channels',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác định kênh ưu tiên',
          healthcareContext: 'CHANNEL_PREFERENCE_DETERMINATION'
        },
        {
          stepId: 'send-primary-notification',
          stepName: 'Send Primary Notification',
          serviceName: 'notifications-service',
          action: 'send-primary-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Gửi thông báo chính',
          healthcareContext: 'PRIMARY_NOTIFICATION_SENDING'
        },
        {
          stepId: 'check-delivery-status',
          stepName: 'Check Delivery Status',
          serviceName: 'notifications-service',
          action: 'check-delivery-status',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Kiểm tra trạng thái gửi',
          healthcareContext: 'DELIVERY_STATUS_CHECK'
        },
        {
          stepId: 'send-fallback-notification',
          stepName: 'Send Fallback Notification',
          serviceName: 'notifications-service',
          action: 'send-fallback-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi thông báo dự phòng',
          healthcareContext: 'FALLBACK_NOTIFICATION_SENDING'
        },
        {
          stepId: 'log-notification-result',
          stepName: 'Log Notification Result',
          serviceName: 'notifications-service',
          action: 'log-notification-result',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Ghi nhận kết quả thông báo',
          healthcareContext: 'NOTIFICATION_RESULT_LOGGING'
        }
      ],
      compensationSteps: [],
      timeout: 600000, // 10 minutes
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      },
      healthcareCompliance: {
        hipaaRequired: true,
        auditRequired: true,
        vietnameseStandards: true
      }
    };

    this.orchestrator.registerWorkflow(workflow);
  }

  /**
   * Execute appointment notification workflow
   */
  public async executeAppointmentNotification(
    notificationContext: NotificationContext
  ): Promise<any> {
    console.log(`📢 Starting Appointment Notification for: ${notificationContext.recipientId}`);

    return await this.orchestrator.startWorkflow(
      'appointment-notification',
      notificationContext,
      {
        recipientId: notificationContext.recipientId,
        appointmentId: notificationContext.healthcareContext.appointmentId,
        correlationId: `appointment_notif_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Execute medication reminder workflow
   */
  public async executeMedicationReminder(
    notificationContext: NotificationContext,
    reminderContext: ReminderContext
  ): Promise<any> {
    console.log(`💊 Starting Medication Reminder for: ${notificationContext.recipientId}`);

    return await this.orchestrator.startWorkflow(
      'medication-reminder',
      { ...notificationContext, ...reminderContext },
      {
        recipientId: notificationContext.recipientId,
        patientId: notificationContext.healthcareContext.patientId,
        reminderId: reminderContext.reminderId,
        correlationId: `medication_reminder_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Execute emergency notification workflow
   */
  public async executeEmergencyNotification(
    emergencyContext: EmergencyNotificationContext
  ): Promise<any> {
    console.log(`🚨 Starting Emergency Notification for: ${emergencyContext.emergencyId}`);

    return await this.orchestrator.startWorkflow(
      'emergency-notification',
      emergencyContext,
      {
        emergencyId: emergencyContext.emergencyId,
        correlationId: `emergency_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Execute multi-channel notification workflow
   */
  public async executeMultiChannelNotification(
    notificationContext: NotificationContext
  ): Promise<any> {
    console.log(`📱 Starting Multi-channel Notification for: ${notificationContext.recipientId}`);

    return await this.orchestrator.startWorkflow(
      'multi-channel-notification',
      notificationContext,
      {
        recipientId: notificationContext.recipientId,
        correlationId: `multi_channel_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Get notification trigger workflow status
   */
  public getNotificationTriggerStatus(): any {
    return {
      registeredWorkflows: [
        'appointment-notification',
        'medication-reminder',
        'emergency-notification',
        'billing-notification',
        'system-notification',
        'follow-up-reminder',
        'insurance-notification',
        'multi-channel-notification'
      ],
      vietnamese: {
        title: 'Trạng thái Quy trình Kích hoạt Thông báo',
        workflows: {
          'appointment-notification': 'Thông báo Lịch hẹn',
          'medication-reminder': 'Nhắc nhở Uống thuốc',
          'emergency-notification': 'Thông báo Khẩn cấp',
          'billing-notification': 'Thông báo Thanh toán',
          'system-notification': 'Thông báo Hệ thống',
          'follow-up-reminder': 'Nhắc nhở Tái khám',
          'insurance-notification': 'Thông báo Bảo hiểm',
          'multi-channel-notification': 'Thông báo Đa kênh'
        }
      },
      supportedChannels: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'VOICE', 'WHATSAPP'],
      healthcareCompliance: {
        hipaa: true,
        vietnameseStandards: true,
        notificationWorkflows: true,
        multiChannelSupport: true
      },
      lastUpdated: new Date().toISOString()
    };
  }
}
