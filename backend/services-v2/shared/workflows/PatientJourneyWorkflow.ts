/**
 * PatientJourneyWorkflow - Complete Patient Care Journey Workflows
 * Orchestrates end-to-end patient care workflows across all healthcare services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Patient Care Workflows, HIPAA
 */

import { WorkflowOrchestrator, WorkflowDefinition, WorkflowStep, WorkflowStepStatus } from './WorkflowOrchestrator';

export interface PatientJourneyContext {
  patientId: string;
  patientInfo: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    email?: string;
    address: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  insuranceInfo?: {
    bhytCardNumber?: string;
    bhtnCardNumber?: string;
    insuranceProvider?: string;
    coverageLevel?: string;
  };
  medicalHistory?: {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
  };
  preferences: {
    language: string;
    communicationMethod: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_APP';
    appointmentReminders: boolean;
    medicationReminders: boolean;
  };
}

export interface AppointmentContext {
  appointmentId: string;
  doctorId: string;
  departmentId: string;
  appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP';
  scheduledDateTime: Date;
  estimatedDuration: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  symptoms?: string;
  notes?: string;
}

export interface TreatmentContext {
  treatmentPlan: {
    diagnosis: string;
    treatments: string[];
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    followUpRequired: boolean;
    followUpDate?: Date;
  };
  testResults?: {
    testType: string;
    results: any;
    interpretation: string;
    criticalValues: boolean;
  }[];
}

export class PatientJourneyWorkflow {
  private static instance: PatientJourneyWorkflow;
  private orchestrator: WorkflowOrchestrator;

  private constructor() {
    this.orchestrator = WorkflowOrchestrator.getInstance();
    this.registerPatientJourneyWorkflows();
  }

  public static getInstance(): PatientJourneyWorkflow {
    if (!PatientJourneyWorkflow.instance) {
      PatientJourneyWorkflow.instance = new PatientJourneyWorkflow();
    }
    return PatientJourneyWorkflow.instance;
  }

  /**
   * Register all patient journey workflows
   */
  private registerPatientJourneyWorkflows(): void {
    console.log(' Registering Patient Journey Workflows');

    // Register individual workflows
    this.registerPatientRegistrationWorkflow();
    this.registerAppointmentSchedulingWorkflow();
    this.registerPatientCheckInWorkflow();
    this.registerConsultationWorkflow();
    this.registerTreatmentWorkflow();
    this.registerDischargeWorkflow();
    this.registerFollowUpWorkflow();
    this.registerEmergencyWorkflow();

    console.log(' All Patient Journey Workflows registered');
  }

  /**
   * Patient Registration Workflow
   */
  private registerPatientRegistrationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'patient-registration',
      workflowName: 'Patient Registration Workflow',
      vietnameseWorkflowName: 'Quy trình Đăng ký Bệnh nhân',
      description: 'Complete patient registration with insurance validation and profile creation',
      vietnameseDescription: 'Quy trình đăng ký bệnh nhân hoàn chỉnh với xác thực bảo hiểm và tạo hồ sơ',
      steps: [
        {
          stepId: 'validate-patient-info',
          stepName: 'Validate Patient Information',
          serviceName: 'patient-registry-service',
          action: 'validate-patient-info',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác thực thông tin bệnh nhân',
          healthcareContext: 'PATIENT_VALIDATION'
        },
        {
          stepId: 'validate-insurance',
          stepName: 'Validate Insurance Coverage',
          serviceName: 'billing-service',
          action: 'validate-insurance',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'remove-insurance-validation',
          vietnameseDescription: 'Xác thực bảo hiểm y tế',
          healthcareContext: 'INSURANCE_VALIDATION'
        },
        {
          stepId: 'create-patient-profile',
          stepName: 'Create Patient Profile',
          serviceName: 'patient-registry-service',
          action: 'create-patient-profile',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'delete-patient-profile',
          vietnameseDescription: 'Tạo hồ sơ bệnh nhân',
          healthcareContext: 'PATIENT_PROFILE_CREATION'
        },
        {
          stepId: 'initialize-medical-record',
          stepName: 'Initialize Medical Record',
          serviceName: 'clinical-emr-service',
          action: 'initialize-medical-record',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'delete-medical-record',
          vietnameseDescription: 'Khởi tạo hồ sơ y tế',
          healthcareContext: 'MEDICAL_RECORD_INITIALIZATION'
        },
        {
          stepId: 'send-welcome-notification',
          stepName: 'Send Welcome Notification',
          serviceName: 'notifications-service',
          action: 'send-welcome-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi thông báo chào mừng',
          healthcareContext: 'WELCOME_NOTIFICATION'
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
   * Appointment Scheduling Workflow
   */
  private registerAppointmentSchedulingWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'appointment-scheduling',
      workflowName: 'Appointment Scheduling Workflow',
      vietnameseWorkflowName: 'Quy trình Đặt lịch Khám bệnh',
      description: 'Complete appointment scheduling with availability check and confirmation',
      vietnameseDescription: 'Quy trình đặt lịch khám bệnh hoàn chỉnh với kiểm tra lịch trống và xác nhận',
      steps: [
        {
          stepId: 'check-availability',
          stepName: 'Check Doctor Availability',
          serviceName: 'scheduling-service',
          action: 'check-availability',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Kiểm tra lịch trống của bác sĩ',
          healthcareContext: 'AVAILABILITY_CHECK'
        },
        {
          stepId: 'validate-patient-eligibility',
          stepName: 'Validate Patient Eligibility',
          serviceName: 'patient-registry-service',
          action: 'validate-eligibility',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác thực tư cách bệnh nhân',
          healthcareContext: 'PATIENT_ELIGIBILITY'
        },
        {
          stepId: 'create-appointment',
          stepName: 'Create Appointment',
          serviceName: 'scheduling-service',
          action: 'create-appointment',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'cancel-appointment',
          vietnameseDescription: 'Tạo lịch hẹn',
          healthcareContext: 'APPOINTMENT_CREATION'
        },
        {
          stepId: 'generate-appointment-invoice',
          stepName: 'Generate Appointment Invoice',
          serviceName: 'billing-service',
          action: 'generate-appointment-invoice',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'void-invoice',
          vietnameseDescription: 'Tạo hóa đơn khám bệnh',
          healthcareContext: 'INVOICE_GENERATION'
        },
        {
          stepId: 'send-confirmation-notification',
          stepName: 'Send Appointment Confirmation',
          serviceName: 'notifications-service',
          action: 'send-appointment-confirmation',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi xác nhận lịch hẹn',
          healthcareContext: 'APPOINTMENT_CONFIRMATION'
        },
        {
          stepId: 'schedule-reminder',
          stepName: 'Schedule Appointment Reminder',
          serviceName: 'notifications-service',
          action: 'schedule-appointment-reminder',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Lên lịch nhắc nhở khám bệnh',
          healthcareContext: 'APPOINTMENT_REMINDER'
        }
      ],
      compensationSteps: [],
      timeout: 180000, // 3 minutes
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
   * Patient Check-in Workflow
   */
  private registerPatientCheckInWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'patient-checkin',
      workflowName: 'Patient Check-in Workflow',
      vietnameseWorkflowName: 'Quy trình Check-in Bệnh nhân',
      description: 'Patient check-in process with insurance verification and queue management',
      vietnameseDescription: 'Quy trình check-in bệnh nhân với xác thực bảo hiểm và quản lý hàng đợi',
      steps: [
        {
          stepId: 'verify-appointment',
          stepName: 'Verify Appointment',
          serviceName: 'scheduling-service',
          action: 'verify-appointment',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác thực lịch hẹn',
          healthcareContext: 'APPOINTMENT_VERIFICATION'
        },
        {
          stepId: 'update-patient-info',
          stepName: 'Update Patient Information',
          serviceName: 'patient-registry-service',
          action: 'update-patient-info',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Cập nhật thông tin bệnh nhân',
          healthcareContext: 'PATIENT_INFO_UPDATE'
        },
        {
          stepId: 'verify-insurance-coverage',
          stepName: 'Verify Insurance Coverage',
          serviceName: 'billing-service',
          action: 'verify-insurance-coverage',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xác thực bảo hiểm y tế',
          healthcareContext: 'INSURANCE_VERIFICATION'
        },
        {
          stepId: 'add-to-queue',
          stepName: 'Add to Waiting Queue',
          serviceName: 'scheduling-service',
          action: 'add-to-queue',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'remove-from-queue',
          vietnameseDescription: 'Thêm vào hàng đợi',
          healthcareContext: 'QUEUE_MANAGEMENT'
        },
        {
          stepId: 'notify-doctor',
          stepName: 'Notify Doctor of Patient Arrival',
          serviceName: 'notifications-service',
          action: 'notify-doctor-arrival',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Thông báo bác sĩ về sự có mặt của bệnh nhân',
          healthcareContext: 'DOCTOR_NOTIFICATION'
        }
      ],
      compensationSteps: [],
      timeout: 120000, // 2 minutes
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
   * Consultation Workflow
   */
  private registerConsultationWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'consultation',
      workflowName: 'Medical Consultation Workflow',
      vietnameseWorkflowName: 'Quy trình Khám bệnh',
      description: 'Complete medical consultation process with diagnosis and treatment planning',
      vietnameseDescription: 'Quy trình khám bệnh hoàn chỉnh với chẩn đoán và lập kế hoạch điều trị',
      steps: [
        {
          stepId: 'start-consultation',
          stepName: 'Start Consultation Session',
          serviceName: 'scheduling-service',
          action: 'start-consultation',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Bắt đầu phiên khám bệnh',
          healthcareContext: 'CONSULTATION_START'
        },
        {
          stepId: 'record-vital-signs',
          stepName: 'Record Vital Signs',
          serviceName: 'clinical-emr-service',
          action: 'record-vital-signs',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Ghi nhận các chỉ số sinh hiệu',
          healthcareContext: 'VITAL_SIGNS_RECORDING'
        },
        {
          stepId: 'record-symptoms',
          stepName: 'Record Patient Symptoms',
          serviceName: 'clinical-emr-service',
          action: 'record-symptoms',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Ghi nhận triệu chứng bệnh nhân',
          healthcareContext: 'SYMPTOMS_RECORDING'
        },
        {
          stepId: 'perform-examination',
          stepName: 'Perform Physical Examination',
          serviceName: 'clinical-emr-service',
          action: 'record-examination',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Thực hiện khám lâm sàng',
          healthcareContext: 'PHYSICAL_EXAMINATION'
        },
        {
          stepId: 'create-diagnosis',
          stepName: 'Create Medical Diagnosis',
          serviceName: 'clinical-emr-service',
          action: 'create-diagnosis',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo chẩn đoán y khoa',
          healthcareContext: 'MEDICAL_DIAGNOSIS'
        },
        {
          stepId: 'complete-consultation',
          stepName: 'Complete Consultation',
          serviceName: 'scheduling-service',
          action: 'complete-consultation',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Hoàn thành khám bệnh',
          healthcareContext: 'CONSULTATION_COMPLETION'
        }
      ],
      compensationSteps: [],
      timeout: 1800000, // 30 minutes
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
   * Treatment Workflow
   */
  private registerTreatmentWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'treatment',
      workflowName: 'Medical Treatment Workflow',
      vietnameseWorkflowName: 'Quy trình Điều trị Y khoa',
      description: 'Complete treatment process with medication prescription and follow-up scheduling',
      vietnameseDescription: 'Quy trình điều trị hoàn chỉnh với kê đơn thuốc và lên lịch tái khám',
      steps: [
        {
          stepId: 'create-treatment-plan',
          stepName: 'Create Treatment Plan',
          serviceName: 'clinical-emr-service',
          action: 'create-treatment-plan',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo kế hoạch điều trị',
          healthcareContext: 'TREATMENT_PLANNING'
        },
        {
          stepId: 'prescribe-medications',
          stepName: 'Prescribe Medications',
          serviceName: 'clinical-emr-service',
          action: 'prescribe-medications',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Kê đơn thuốc',
          healthcareContext: 'MEDICATION_PRESCRIPTION'
        },
        {
          stepId: 'schedule-follow-up',
          stepName: 'Schedule Follow-up Appointment',
          serviceName: 'scheduling-service',
          action: 'schedule-follow-up',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'cancel-follow-up',
          vietnameseDescription: 'Lên lịch tái khám',
          healthcareContext: 'FOLLOW_UP_SCHEDULING'
        },
        {
          stepId: 'generate-treatment-invoice',
          stepName: 'Generate Treatment Invoice',
          serviceName: 'billing-service',
          action: 'generate-treatment-invoice',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          compensationAction: 'void-treatment-invoice',
          vietnameseDescription: 'Tạo hóa đơn điều trị',
          healthcareContext: 'TREATMENT_BILLING'
        },
        {
          stepId: 'send-treatment-summary',
          stepName: 'Send Treatment Summary',
          serviceName: 'notifications-service',
          action: 'send-treatment-summary',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi tóm tắt điều trị',
          healthcareContext: 'TREATMENT_SUMMARY'
        },
        {
          stepId: 'schedule-medication-reminders',
          stepName: 'Schedule Medication Reminders',
          serviceName: 'notifications-service',
          action: 'schedule-medication-reminders',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Lên lịch nhắc nhở uống thuốc',
          healthcareContext: 'MEDICATION_REMINDERS'
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
   * Discharge Workflow
   */
  private registerDischargeWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'patient-discharge',
      workflowName: 'Patient Discharge Workflow',
      vietnameseWorkflowName: 'Quy trình Xuất viện',
      description: 'Complete patient discharge process with final billing and discharge summary',
      vietnameseDescription: 'Quy trình xuất viện hoàn chỉnh với thanh toán cuối cùng và tóm tắt xuất viện',
      steps: [
        {
          stepId: 'finalize-medical-record',
          stepName: 'Finalize Medical Record',
          serviceName: 'clinical-emr-service',
          action: 'finalize-medical-record',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Hoàn thiện hồ sơ y tế',
          healthcareContext: 'MEDICAL_RECORD_FINALIZATION'
        },
        {
          stepId: 'generate-final-invoice',
          stepName: 'Generate Final Invoice',
          serviceName: 'billing-service',
          action: 'generate-final-invoice',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo hóa đơn cuối cùng',
          healthcareContext: 'FINAL_BILLING'
        },
        {
          stepId: 'process-discharge-payment',
          stepName: 'Process Discharge Payment',
          serviceName: 'billing-service',
          action: 'process-discharge-payment',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Xử lý thanh toán xuất viện',
          healthcareContext: 'DISCHARGE_PAYMENT'
        },
        {
          stepId: 'create-discharge-summary',
          stepName: 'Create Discharge Summary',
          serviceName: 'clinical-emr-service',
          action: 'create-discharge-summary',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Tạo tóm tắt xuất viện',
          healthcareContext: 'DISCHARGE_SUMMARY'
        },
        {
          stepId: 'send-discharge-notification',
          stepName: 'Send Discharge Notification',
          serviceName: 'notifications-service',
          action: 'send-discharge-notification',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi thông báo xuất viện',
          healthcareContext: 'DISCHARGE_NOTIFICATION'
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
   * Follow-up Workflow
   */
  private registerFollowUpWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'follow-up',
      workflowName: 'Patient Follow-up Workflow',
      vietnameseWorkflowName: 'Quy trình Tái khám',
      description: 'Patient follow-up process with progress assessment and treatment adjustment',
      vietnameseDescription: 'Quy trình tái khám với đánh giá tiến triển và điều chỉnh điều trị',
      steps: [
        {
          stepId: 'assess-treatment-progress',
          stepName: 'Assess Treatment Progress',
          serviceName: 'clinical-emr-service',
          action: 'assess-treatment-progress',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Đánh giá tiến triển điều trị',
          healthcareContext: 'TREATMENT_ASSESSMENT'
        },
        {
          stepId: 'update-treatment-plan',
          stepName: 'Update Treatment Plan',
          serviceName: 'clinical-emr-service',
          action: 'update-treatment-plan',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Cập nhật kế hoạch điều trị',
          healthcareContext: 'TREATMENT_PLAN_UPDATE'
        },
        {
          stepId: 'schedule-next-follow-up',
          stepName: 'Schedule Next Follow-up',
          serviceName: 'scheduling-service',
          action: 'schedule-next-follow-up',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 3,
          vietnameseDescription: 'Lên lịch tái khám tiếp theo',
          healthcareContext: 'NEXT_FOLLOW_UP'
        },
        {
          stepId: 'send-follow-up-summary',
          stepName: 'Send Follow-up Summary',
          serviceName: 'notifications-service',
          action: 'send-follow-up-summary',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Gửi tóm tắt tái khám',
          healthcareContext: 'FOLLOW_UP_SUMMARY'
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
   * Emergency Workflow
   */
  private registerEmergencyWorkflow(): void {
    const workflow: WorkflowDefinition = {
      workflowId: 'emergency-care',
      workflowName: 'Emergency Care Workflow',
      vietnameseWorkflowName: 'Quy trình Cấp cứu',
      description: 'Emergency care workflow with priority handling and immediate notifications',
      vietnameseDescription: 'Quy trình cấp cứu với xử lý ưu tiên và thông báo khẩn cấp',
      steps: [
        {
          stepId: 'triage-assessment',
          stepName: 'Emergency Triage Assessment',
          serviceName: 'clinical-emr-service',
          action: 'emergency-triage',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Phân loại cấp cứu',
          healthcareContext: 'EMERGENCY_TRIAGE'
        },
        {
          stepId: 'notify-emergency-team',
          stepName: 'Notify Emergency Team',
          serviceName: 'notifications-service',
          action: 'notify-emergency-team',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Thông báo đội cấp cứu',
          healthcareContext: 'EMERGENCY_TEAM_NOTIFICATION'
        },
        {
          stepId: 'emergency-treatment',
          stepName: 'Provide Emergency Treatment',
          serviceName: 'clinical-emr-service',
          action: 'emergency-treatment',
          input: {},
          status: WorkflowStepStatus.PENDING,
          retryCount: 0,
          maxRetries: 2,
          vietnameseDescription: 'Điều trị cấp cứu',
          healthcareContext: 'EMERGENCY_TREATMENT'
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
          vietnameseDescription: 'Thông báo người thân',
          healthcareContext: 'EMERGENCY_CONTACT_NOTIFICATION'
        }
      ],
      compensationSteps: [],
      timeout: 60000, // 1 minute - Emergency workflows need to be fast
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
   * Execute patient registration workflow
   */
  public async executePatientRegistration(context: PatientJourneyContext): Promise<any> {
    console.log(` Starting Patient Registration for: ${context.patientInfo.fullName}`);

    return await this.orchestrator.startWorkflow(
      'patient-registration',
      context,
      {
        patientId: context.patientId,
        correlationId: `patient_reg_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Execute appointment scheduling workflow
   */
  public async executeAppointmentScheduling(
    patientContext: PatientJourneyContext,
    appointmentContext: AppointmentContext
  ): Promise<any> {
    console.log(` Starting Appointment Scheduling for: ${patientContext.patientInfo.fullName}`);

    return await this.orchestrator.startWorkflow(
      'appointment-scheduling',
      { ...patientContext, ...appointmentContext },
      {
        patientId: patientContext.patientId,
        appointmentId: appointmentContext.appointmentId,
        doctorId: appointmentContext.doctorId,
        correlationId: `appointment_${Date.now()}`,
        userId: 'system'
      }
    );
  }

  /**
   * Execute complete patient journey
   */
  public async executeCompletePatientJourney(
    patientContext: PatientJourneyContext,
    appointmentContext: AppointmentContext,
    treatmentContext?: TreatmentContext
  ): Promise<any> {
    console.log(` Starting Complete Patient Journey for: ${patientContext.patientInfo.fullName}`);

    const results = [];

    try {
      // 1. Patient Registration
      const registrationResult = await this.executePatientRegistration(patientContext);
      results.push({ step: 'registration', result: registrationResult });

      if (!registrationResult.success) {
        throw new Error('Patient registration failed');
      }

      // 2. Appointment Scheduling
      const schedulingResult = await this.executeAppointmentScheduling(patientContext, appointmentContext);
      results.push({ step: 'scheduling', result: schedulingResult });

      if (!schedulingResult.success) {
        throw new Error('Appointment scheduling failed');
      }

      // 3. Patient Check-in (when appointment time comes)
      // This would typically be triggered by a scheduled event

      // 4. Consultation
      // This would be triggered when doctor starts the consultation

      // 5. Treatment (if needed)
      if (treatmentContext) {
        // Treatment workflow would be executed
      }

      return {
        success: true,
        patientId: patientContext.patientId,
        journeySteps: results,
        vietnamese: {
          message: 'Hành trình chăm sóc bệnh nhân đã hoàn thành thành công',
          patient: patientContext.patientInfo.fullName,
          completedSteps: results.length
        }
      };

    } catch (error) {
      console.error(' Patient journey failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        journeySteps: results,
        vietnamese: {
          message: 'Hành trình chăm sóc bệnh nhân gặp lỗi',
          error: 'Vui lòng liên hệ bộ phận hỗ trợ'
        }
      };
    }
  }

  /**
   * Get patient journey status
   */
  public getPatientJourneyStatus(): any {
    return {
      registeredWorkflows: [
        'patient-registration',
        'appointment-scheduling',
        'patient-checkin',
        'consultation',
        'treatment',
        'patient-discharge',
        'follow-up',
        'emergency-care'
      ],
      vietnamese: {
        title: 'Trạng thái Quy trình Chăm sóc Bệnh nhân',
        workflows: {
          'patient-registration': 'Đăng ký Bệnh nhân',
          'appointment-scheduling': 'Đặt lịch Khám bệnh',
          'patient-checkin': 'Check-in Bệnh nhân',
          'consultation': 'Khám bệnh',
          'treatment': 'Điều trị',
          'patient-discharge': 'Xuất viện',
          'follow-up': 'Tái khám',
          'emergency-care': 'Cấp cứu'
        }
      },
      healthcareCompliance: {
        hipaa: true,
        vietnameseStandards: true,
        patientCareWorkflows: true
      },
      lastUpdated: new Date().toISOString()
    };
  }
}
