/**
 * Clinical EMR Event Consumer - Infrastructure Layer
 * Consumes clinical events from Clinical EMR Service
 * Handles clinical notifications, test results, vital alerts, and medical updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from "amqplib";
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
import {
  SendNotificationCommand,
  SendNotificationUseCase,
} from "../../application/use-cases/SendNotificationUseCase";
import { normalizePriority } from "../../domain/services/priority-normalizer";

export interface ClinicalEMREventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface PatientClinicalProfileUpdatedEventData {
  patientId: string;
  patientName: string;
  clinicalData: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    lastVisitDate?: Date;
    primaryPhysician?: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    specialRequirements?: string[];
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface TreatmentPlanCreatedEventData {
  treatmentPlanId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  treatmentType: string;
  frequency: string;
  duration: string;
  startDate: Date;
  endDate?: Date;
  requiredProcedures: string[];
  requiredEquipment: string[];
  specialInstructions?: string[];
  createdAt: Date;
  createdBy: string;
}

export interface MedicalTestOrderedEventData {
  testId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  testType: string;
  testCategory:
    | "laboratory"
    | "radiology"
    | "cardiology"
    | "pathology"
    | "other";
  urgencyLevel: "routine" | "urgent" | "stat";
  orderedAt: Date;
  orderedBy: string;
  preparationInstructions?: string[];
  estimatedDuration: number; // in minutes
}

export interface MedicalTestResultReadyEventData {
  testId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  testType: string;
  testCategory:
    | "laboratory"
    | "radiology"
    | "cardiology"
    | "pathology"
    | "other";
  resultStatus: "normal" | "abnormal" | "critical" | "pending_review";
  completedAt: Date;
  completedBy: string;
  criticalValues?: {
    parameter: string;
    value: string;
    normalRange: string;
    severity: "mild" | "moderate" | "severe";
  }[];
  requiresFollowUp: boolean;
  followUpInstructions?: string;
}

export interface ClinicalDocumentAddedEventData {
  documentId: string;
  patientId: string;
  patientName: string;
  documentType:
    | "referral"
    | "prescription"
    | "lab_result"
    | "imaging"
    | "discharge_summary"
    | "other";
  documentTitle: string;
  physicianId?: string;
  physicianName?: string;
  addedAt: Date;
  addedBy: string;
  requiresFollowUp: boolean;
  followUpInstructions?: string;
}

export interface VitalSignsRecordedEventData {
  recordingId: string;
  patientId: string;
  patientName: string;
  recordedBy: string;
  recordedAt: Date;
  vitalSigns: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    weight?: number;
    height?: number;
  };
  alerts?: {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }[];
}

export interface MedicationPrescribedEventData {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  prescribedAt: Date;
  prescribedBy: string;
  requiresPharmacyPickup: boolean;
  pharmacyInstructions?: string;
}

export interface EmergencyAlertTriggeredEventData {
  alertId: string;
  patientId: string;
  patientName: string;
  location: string;
  alertType:
    | "cardiac_arrest"
    | "respiratory_distress"
    | "severe_bleeding"
    | "fall"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: Date;
  triggeredBy: string;
  description: string;
  immediateActions: string[];
  responseTeamRequired: string[];
}

/**
 * ClinicalEMREventConsumer - Handles clinical events for notifications
 */
export class ClinicalEMREventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: ClinicalEMREventConsumerConfig,
    private sendNotificationUseCase: SendNotificationUseCase,
    private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private inboxRepo: IInboxRepository,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      console.log("Connecting to RabbitMQ for Clinical EMR events", {
        queueName: this.config.queueName,
      });

      const amqp = require("amqplib");
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, "topic", {
        durable: true,
      });

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey,
        );
        console.log("Queue bound to routing key", {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      console.log("Clinical EMR event consumer connected successfully");

      // Handle connection errors
      this.connection.on("error", (error: Error) => {
        console.error("RabbitMQ connection error", {
          error: error.message,
        });
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        console.warn("RabbitMQ connection closed");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;

      // Idempotency check
      const eventId = event.eventId || event.id || event.metadata?.eventId;
      if (!eventId) {
        console.error(
          "[ClinicalEMREventConsumer] Missing eventId, cannot process:",
          event,
        );
        this.channel?.ack(msg);
        return;
      }

      if (await this.inboxRepo.exists(eventId)) {
        console.debug(
          `[ClinicalEMREventConsumer] Duplicate event ${eventId}, skipping`,
        );
        this.channel?.ack(msg);
        return;
      }

      console.log(
        `[ClinicalEMREventConsumer] Processing event: ${routingKey} (${eventId})`,
      );

      // Route to appropriate handler
      switch (routingKey) {
        case "clinical.patient.profile.updated":
          await this.handlePatientClinicalProfileUpdated(
            event.payload as PatientClinicalProfileUpdatedEventData,
          );
          break;

        case "clinical.treatment.plan.created":
          await this.handleTreatmentPlanCreated(
            event.payload as TreatmentPlanCreatedEventData,
          );
          break;

        case "clinical.test.ordered":
          await this.handleMedicalTestOrdered(
            event.payload as MedicalTestOrderedEventData,
          );
          break;

        case "clinical.test.result.ready":
          await this.handleMedicalTestResultReady(
            event.payload as MedicalTestResultReadyEventData,
          );
          break;

        case "clinical.document.added":
          await this.handleClinicalDocumentAdded(
            event.payload as ClinicalDocumentAddedEventData,
          );
          break;

        case "clinical.vitals.recorded":
          await this.handleVitalSignsRecorded(
            event.payload as VitalSignsRecordedEventData,
          );
          break;

        case "clinical.medication.prescribed":
          await this.handleMedicationPrescribed(
            event.payload as MedicationPrescribedEventData,
          );
          break;

        case "clinical.emergency.alert":
          await this.handleEmergencyAlertTriggered(
            event.payload as EmergencyAlertTriggeredEventData,
          );
          break;

        default:
          console.warn("Unhandled routing key", { routingKey });
          break;
      }

      // Store in inbox after successful processing
      await this.inboxRepo.store({
        idempotencyKey: eventId,
        eventType: routingKey,
        payload: event,
      });

      // Acknowledge message
      this.channel.ack(msg);
    } catch (error) {
      console.error("Error processing clinical EMR event", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle patient clinical profile updated event
   */
  private async handlePatientClinicalProfileUpdated(
    data: PatientClinicalProfileUpdatedEventData,
  ): Promise<void> {
    console.log(
      "Processing patient clinical profile update for notifications",
      {
        patientId: data.patientId,
        patientName: data.patientName,
        riskLevel: data.clinicalData.riskLevel,
        hasAllergies: data.clinicalData.allergies.length > 0,
        hasSpecialRequirements: data.clinicalData.specialRequirements?.length
          ? data.clinicalData.specialRequirements.length > 0
          : false,
      },
    );

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send clinical profile update notification to patient
      await this.sendClinicalProfileUpdateNotification(
        data,
        patientPreferences,
      );

      // Send high-risk notification to primary physician
      if (
        data.clinicalData.riskLevel === "high" ||
        data.clinicalData.riskLevel === "critical"
      ) {
        await this.sendHighRiskProfileNotification(data);
      }

      // Send allergy alert if new allergies added
      if (data.clinicalData.allergies.length > 0) {
        await this.sendAllergyAlertNotification(data);
      }
    } catch (error) {
      console.error("Failed to process patient clinical profile update", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle treatment plan created event
   */
  private async handleTreatmentPlanCreated(
    data: TreatmentPlanCreatedEventData,
  ): Promise<void> {
    console.log("Processing treatment plan creation for notifications", {
      treatmentPlanId: data.treatmentPlanId,
      patientId: data.patientId,
      physicianId: data.physicianId,
      treatmentType: data.treatmentType,
      frequency: data.frequency,
      duration: data.duration,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send treatment plan notification to patient
      await this.sendTreatmentPlanNotification(data, patientPreferences);

      // Send treatment plan confirmation to physician
      const physicianPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.physicianId,
          userType: "staff",
        });

      await this.sendTreatmentPlanPhysicianNotification(
        data,
        physicianPreferences,
      );

      // Schedule treatment reminders
      await this.scheduleTreatmentReminders(data, patientPreferences);
    } catch (error) {
      console.error("Failed to process treatment plan creation", {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle medical test ordered event
   */
  private async handleMedicalTestOrdered(
    data: MedicalTestOrderedEventData,
  ): Promise<void> {
    console.log("Processing medical test order for notifications", {
      testId: data.testId,
      patientId: data.patientId,
      testType: data.testType,
      testCategory: data.testCategory,
      urgencyLevel: data.urgencyLevel,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send test order notification to patient
      await this.sendTestOrderNotification(data, patientPreferences);

      // Send urgent test notification to physician
      if (data.urgencyLevel === "urgent" || data.urgencyLevel === "stat") {
        const physicianPreferences =
          await this.getNotificationPreferencesUseCase.execute({
            userId: data.physicianId,
            userType: "staff",
          });

        await this.sendUrgentTestNotification(data, physicianPreferences);
      }

      // Send preparation instructions if provided
      if (
        data.preparationInstructions &&
        data.preparationInstructions.length > 0
      ) {
        await this.sendTestPreparationInstructions(data, patientPreferences);
      }
    } catch (error) {
      console.error("Failed to process medical test order", {
        testId: data.testId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle medical test result ready event
   */
  private async handleMedicalTestResultReady(
    data: MedicalTestResultReadyEventData,
  ): Promise<void> {
    console.log("Processing medical test result for notifications", {
      testId: data.testId,
      patientId: data.patientId,
      testType: data.testType,
      resultStatus: data.resultStatus,
      hasCriticalValues: data.criticalValues && data.criticalValues.length > 0,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send test result notification to patient
      await this.sendTestResultNotification(data, patientPreferences);

      // Send critical result notification to physician
      if (
        data.resultStatus === "critical" ||
        data.resultStatus === "abnormal"
      ) {
        const physicianPreferences =
          await this.getNotificationPreferencesUseCase.execute({
            userId: data.physicianId,
            userType: "staff",
          });

        await this.sendCriticalResultNotification(data, physicianPreferences);
      }

      // Send follow-up notification if required
      if (data.requiresFollowUp && data.followUpInstructions) {
        await this.sendTestFollowUpNotification(data, patientPreferences);
      }
    } catch (error) {
      console.error("Failed to process medical test result", {
        testId: data.testId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle clinical document added event
   */
  private async handleClinicalDocumentAdded(
    data: ClinicalDocumentAddedEventData,
  ): Promise<void> {
    console.log("Processing clinical document addition for notifications", {
      documentId: data.documentId,
      patientId: data.patientId,
      documentType: data.documentType,
      documentTitle: data.documentTitle,
      requiresFollowUp: data.requiresFollowUp,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send document notification to patient
      await this.sendDocumentNotification(data, patientPreferences);

      // Send physician notification if applicable
      if (data.physicianId) {
        const physicianPreferences =
          await this.getNotificationPreferencesUseCase.execute({
            userId: data.physicianId,
            userType: "staff",
          });

        await this.sendDocumentPhysicianNotification(
          data,
          physicianPreferences,
        );
      }

      // Send follow-up notification if required
      if (data.requiresFollowUp && data.followUpInstructions) {
        await this.sendDocumentFollowUpNotification(data, patientPreferences);
      }
    } catch (error) {
      console.error("Failed to process clinical document addition", {
        documentId: data.documentId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle vital signs recorded event
   */
  private async handleVitalSignsRecorded(
    data: VitalSignsRecordedEventData,
  ): Promise<void> {
    console.log("Processing vital signs recording for notifications", {
      recordingId: data.recordingId,
      patientId: data.patientId,
      recordedAt: data.recordedAt,
      hasAlerts: data.alerts && data.alerts.length > 0,
    });

    try {
      // Check for critical vital signs
      if (data.alerts && data.alerts.length > 0) {
        await this.handleVitalSignsAlerts(data);
      }

      // Send routine vital signs notification to patient
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      await this.sendVitalSignsNotification(data, patientPreferences);
    } catch (error) {
      console.error("Failed to process vital signs recording", {
        recordingId: data.recordingId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle medication prescribed event
   */
  private async handleMedicationPrescribed(
    data: MedicationPrescribedEventData,
  ): Promise<void> {
    console.log("Processing medication prescription for notifications", {
      prescriptionId: data.prescriptionId,
      patientId: data.patientId,
      medicationsCount: data.medications.length,
      requiresPharmacyPickup: data.requiresPharmacyPickup,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send prescription notification to patient
      await this.sendPrescriptionNotification(data, patientPreferences);

      // Send pharmacy pickup notification if required
      if (data.requiresPharmacyPickup) {
        await this.sendPharmacyPickupNotification(data, patientPreferences);
      }

      // Send medication reminders
      await this.scheduleMedicationReminders(data, patientPreferences);
    } catch (error) {
      console.error("Failed to process medication prescription", {
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle emergency alert triggered event
   */
  private async handleEmergencyAlertTriggered(
    data: EmergencyAlertTriggeredEventData,
  ): Promise<void> {
    console.log("Processing emergency alert for notifications", {
      alertId: data.alertId,
      patientId: data.patientId,
      alertType: data.alertType,
      severity: data.severity,
      location: data.location,
    });

    try {
      // Send emergency alert to response team
      await this.sendEmergencyAlertNotification(data);

      // Send emergency notification to patient's emergency contact
      await this.sendEmergencyContactNotification(data);

      // Send department emergency notification
      await this.sendDepartmentEmergencyNotification(data);

      // Log emergency notification for compliance
      await this.logEmergencyNotification(data);
    } catch (error) {
      console.error("Failed to process emergency alert", {
        alertId: data.alertId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send clinical profile update notification to patient
   */
  private async sendClinicalProfileUpdateNotification(
    data: PatientClinicalProfileUpdatedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const riskLevelText =
        {
          low: "thấp",
          medium: "trung bình",
          high: "cao",
          critical: "nguy hiểm",
        }[data.clinicalData.riskLevel] || data.clinicalData.riskLevel;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "clinical_profile_updated",
        title: "Cập nhật hồ sơ lâm sàng",
        content: `Hồ sơ lâm sàng của bạn đã được cập nhật. Mức độ rủi ro: ${riskLevelText}.${data.clinicalData.primaryPhysician ? ` Bác sĩ chính: ${data.clinicalData.primaryPhysician}.` : ""}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority:
          data.clinicalData.riskLevel === "critical" ? "high" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          riskLevel: data.clinicalData.riskLevel,
          updatedAt: data.updatedAt,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent clinical profile update notification to patient", {
        patientId: data.patientId,
        riskLevel: data.clinicalData.riskLevel,
      });
    } catch (error) {
      console.error("Failed to send clinical profile update notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send high-risk profile notification to physician
   */
  private async sendHighRiskProfileNotification(
    data: PatientClinicalProfileUpdatedEventData,
  ): Promise<void> {
    try {
      if (!data.clinicalData.primaryPhysician) return;

      const notificationData = {
        recipientId: data.clinicalData.primaryPhysician,
        recipientType: "staff",
        type: "high_risk_patient",
        title: "Bệnh nhân nguy cơ cao",
        content: `Bệnh nhân ${data.patientName} đã được cập nhật hồ sơ với mức độ rủi ro ${data.clinicalData.riskLevel}. Cần theo dõi đặc biệt.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          riskLevel: data.clinicalData.riskLevel,
          updatedAt: data.updatedAt,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send high-risk profile notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send allergy alert notification
   */
  private async sendAllergyAlertNotification(
    data: PatientClinicalProfileUpdatedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "allergy_alert",
        title: "Cảnh báo dị ứng",
        content: `Hồ sơ của bạn đã được cập nhật với các thông tin dị ứng: ${data.clinicalData.allergies.join(", ")}. Vui lòng thông báo cho nhân viên y tế khi khám bệnh.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          allergies: data.clinicalData.allergies,
          updatedAt: data.updatedAt,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send allergy alert notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send treatment plan notification to patient
   */
  private async sendTreatmentPlanNotification(
    data: TreatmentPlanCreatedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "treatment_plan_created",
        title: "Kế hoạch điều trị mới",
        content: `Kế hoạch điều trị ${data.treatmentType} đã được tạo cho bạn. Tần suất: ${data.frequency}, Thời gian: ${data.duration}. Bắt đầu từ ${this.formatDate(data.startDate)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          treatmentPlanId: data.treatmentPlanId,
          treatmentType: data.treatmentType,
          startDate: data.startDate,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent treatment plan notification to patient", {
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
      });
    } catch (error) {
      console.error("Failed to send treatment plan notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send treatment plan notification to physician
   */
  private async sendTreatmentPlanPhysicianNotification(
    data: TreatmentPlanCreatedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "treatment_plan_created",
        title: "Kế hoạch điều trị đã tạo",
        content: `Kế hoạch điều trị ${data.treatmentType} đã được tạo cho bệnh nhân ${data.patientName}. Bắt đầu từ ${this.formatDate(data.startDate)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          treatmentPlanId: data.treatmentPlanId,
          treatmentType: data.treatmentType,
          physicianId: data.physicianId,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send treatment plan physician notification", {
        physicianId: data.physicianId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Schedule treatment reminders
   */
  private async scheduleTreatmentReminders(
    data: TreatmentPlanCreatedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const treatmentFrequency = this.getTreatmentFrequency(data.frequency);
      const endDate =
        data.endDate ||
        new Date(data.startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

      let currentDate = new Date(data.startDate);
      let reminderCount = 0;
      const maxReminders = 30; // Limit to prevent excessive notifications

      while (currentDate <= endDate && reminderCount < maxReminders) {
        // Schedule reminder 1 day before treatment
        const reminderDate = new Date(
          currentDate.getTime() - 24 * 60 * 60 * 1000,
        );

        if (reminderDate > new Date()) {
          const notificationData = {
            recipientId: data.patientId,
            recipientType: "patient",
            type: "treatment_reminder",
            title: "Nhắc nhở điều trị",
            content: `Nhắc nhở: Bạn có buổi điều trị ${data.treatmentType} vào ngày mai (${this.formatDate(currentDate)}).`,
            channels: this.getEnabledChannels(preferences, [
              "sms",
              "email",
              "in_app",
            ]),
            priority: "normal",
            scheduledAt: reminderDate,
            metadata: {
              patientId: data.patientId,
              treatmentPlanId: data.treatmentPlanId,
              treatmentDate: currentDate,
            },
          };

          await this.dispatchNotification(notificationData);
          reminderCount++;
        }

        // Move to next treatment date
        currentDate = this.getNextTreatmentDate(
          currentDate,
          treatmentFrequency,
        );
      }

      console.log("Scheduled treatment reminders", {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        remindersCount: reminderCount,
      });
    } catch (error) {
      console.error("Failed to schedule treatment reminders", {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send test order notification to patient
   */
  private async sendTestOrderNotification(
    data: MedicalTestOrderedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const urgencyText =
        {
          routine: "thường quy",
          urgent: "khẩn",
          stat: "cấp cứu",
        }[data.urgencyLevel] || data.urgencyLevel;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "test_ordered",
        title: "Đặt lịch xét nghiệm",
        content: `Bạn đã được chỉ định xét nghiệm ${data.testType} (${urgencyText}). Thời gian dự kiến: ${data.estimatedDuration} phút.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.urgencyLevel === "stat" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
          urgencyLevel: data.urgencyLevel,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent test order notification to patient", {
        patientId: data.patientId,
        testId: data.testId,
      });
    } catch (error) {
      console.error("Failed to send test order notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send urgent test notification to physician
   */
  private async sendUrgentTestNotification(
    data: MedicalTestOrderedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "urgent_test_ordered",
        title: "Xét nghiệm khẩn cấp",
        content: `Xét nghiệm ${data.testType} khẩn cấp đã được đặt cho bệnh nhân ${data.patientName}. Mức độ: ${data.urgencyLevel}.`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
          urgencyLevel: data.urgencyLevel,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send urgent test notification", {
        physicianId: data.physicianId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send test preparation instructions
   */
  private async sendTestPreparationInstructions(
    data: MedicalTestOrderedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const instructions = data.preparationInstructions?.join("\n- ") || "";
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "test_preparation",
        title: "Hướng dẫn chuẩn bị xét nghiệm",
        content: `Hướng dẫn chuẩn bị cho xét nghiệm ${data.testType}:\n- ${instructions}`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send test preparation instructions", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send test result notification to patient
   */
  private async sendTestResultNotification(
    data: MedicalTestResultReadyEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const statusText =
        {
          normal: "bình thường",
          abnormal: "bất thường",
          critical: "nguy hiểm",
          pending_review: "chờ đánh giá",
        }[data.resultStatus] || data.resultStatus;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "test_result_ready",
        title: "Kết quả xét nghiệm",
        content: `Kết quả xét nghiệm ${data.testType} của bạn đã sẵn sàng. Trạng thái: ${statusText}.${data.requiresFollowUp ? " Cần theo dõi thêm." : ""}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.resultStatus === "critical" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
          resultStatus: data.resultStatus,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent test result notification to patient", {
        patientId: data.patientId,
        testId: data.testId,
        resultStatus: data.resultStatus,
      });
    } catch (error) {
      console.error("Failed to send test result notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send critical result notification to physician
   */
  private async sendCriticalResultNotification(
    data: MedicalTestResultReadyEventData,
    preferences: any,
  ): Promise<void> {
    try {
      let criticalInfo = "";
      if (data.criticalValues && data.criticalValues.length > 0) {
        criticalInfo = ` Giá trị nguy hiểm: ${data.criticalValues.map((cv) => `${cv.parameter}: ${cv.value}`).join(", ")}`;
      }

      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "critical_test_result",
        title: "Kết quả xét nghiệm nguy hiểm",
        content: `Kết quả ${data.resultStatus} cho xét nghiệm ${data.testType} của bệnh nhân ${data.patientName}.${criticalInfo}`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
          resultStatus: data.resultStatus,
          criticalValues: data.criticalValues,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send critical result notification", {
        physicianId: data.physicianId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send test follow-up notification
   */
  private async sendTestFollowUpNotification(
    data: MedicalTestResultReadyEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "test_follow_up",
        title: "Cần theo dõi xét nghiệm",
        content: `Kết quả xét nghiệm ${data.testType} cần theo dõi. ${data.followUpInstructions}`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          testId: data.testId,
          testType: data.testType,
          followUpInstructions: data.followUpInstructions,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send test follow-up notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send document notification to patient
   */
  private async sendDocumentNotification(
    data: ClinicalDocumentAddedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const documentTypeText =
        {
          referral: "giới thiệu",
          prescription: "đơn thuốc",
          lab_result: "kết quả xét nghiệm",
          imaging: "hình ảnh y khoa",
          discharge_summary: "tóm tắt ra viện",
          other: "tài liệu khác",
        }[data.documentType] || data.documentType;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "clinical_document_added",
        title: "Tài liệu y khoa mới",
        content: `${documentTypeText} "${data.documentTitle}" đã được thêm vào hồ sơ của bạn.${data.requiresFollowUp ? " Cần theo dõi thêm." : ""}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          documentId: data.documentId,
          documentType: data.documentType,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent document notification to patient", {
        patientId: data.patientId,
        documentId: data.documentId,
      });
    } catch (error) {
      console.error("Failed to send document notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send document notification to physician
   */
  private async sendDocumentPhysicianNotification(
    data: ClinicalDocumentAddedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      if (!data.physicianId) {
        console.warn("No physician ID provided for document notification");
        return;
      }

      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "clinical_document_added",
        title: "Tài liệu y khoa mới",
        content: `Tài liệu "${data.documentTitle}" đã được thêm vào hồ sơ của bệnh nhân ${data.patientName}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          documentId: data.documentId,
          documentType: data.documentType,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send document physician notification", {
        physicianId: data.physicianId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send document follow-up notification
   */
  private async sendDocumentFollowUpNotification(
    data: ClinicalDocumentAddedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "document_follow_up",
        title: "Cần theo dõi tài liệu y khoa",
        content: `Tài liệu "${data.documentTitle}" cần theo dõi. ${data.followUpInstructions}`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          documentId: data.documentId,
          followUpInstructions: data.followUpInstructions,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send document follow-up notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Handle vital signs alerts
   */
  private async handleVitalSignsAlerts(
    data: VitalSignsRecordedEventData,
  ): Promise<void> {
    try {
      if (!data.alerts || data.alerts.length === 0) return;

      for (const alert of data.alerts) {
        // Send critical alert to physician
        if (alert.severity === "high" || alert.severity === "critical") {
          await this.sendCriticalVitalSignsAlert(data, alert);
        }

        // Send alert notification to patient
        await this.sendVitalSignsAlertNotification(data, alert);
      }
    } catch (error) {
      console.error("Failed to handle vital signs alerts", {
        recordingId: data.recordingId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send vital signs notification to patient
   */
  private async sendVitalSignsNotification(
    data: VitalSignsRecordedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const vitalSignsText = this.formatVitalSigns(data.vitalSigns);
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "vital_signs_recorded",
        title: "Đo dấu hiệu sinh tồn",
        content: `Dấu hiệu sinh tồn của bạn đã được đo:\n${vitalSignsText}`,
        channels: this.getEnabledChannels(preferences, ["in_app"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          recordingId: data.recordingId,
          vitalSigns: data.vitalSigns,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send vital signs notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send critical vital signs alert
   */
  private async sendCriticalVitalSignsAlert(
    data: VitalSignsRecordedEventData,
    alert: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.recordedBy,
        recipientType: "staff",
        type: "critical_vital_signs",
        title: "Cảnh báo dấu hiệu sinh tồn nguy hiểm",
        content: `Bệnh nhân ${data.patientName}: ${alert.message}. Cần hành động ngay lập tức.`,
        channels: ["in_app", "email", "sms"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          recordingId: data.recordingId,
          alertType: alert.type,
          alertSeverity: alert.severity,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send critical vital signs alert", {
        recordingId: data.recordingId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send vital signs alert notification to patient
   */
  private async sendVitalSignsAlertNotification(
    data: VitalSignsRecordedEventData,
    alert: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "vital_signs_alert",
        title: "Cảnh báo sức khỏe",
        content: `Dấu hiệu sinh tồn của bạn có bất thường: ${alert.message}. Vui lòng liên hệ nhân viên y tế.`,
        channels: ["in_app", "sms"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          recordingId: data.recordingId,
          alertType: alert.type,
          alertSeverity: alert.severity,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send vital signs alert notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send prescription notification to patient
   */
  private async sendPrescriptionNotification(
    data: MedicationPrescribedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const medicationList = data.medications
        .map((med) => `${med.name} (${med.dosage}, ${med.frequency})`)
        .join(", ");

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "medication_prescribed",
        title: "Đơn thuốc mới",
        content: `Đơn thuốc mới đã được kê cho bạn:\n${medicationList}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,
          medications: data.medications,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent prescription notification to patient", {
        patientId: data.patientId,
        prescriptionId: data.prescriptionId,
      });
    } catch (error) {
      console.error("Failed to send prescription notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pharmacy pickup notification
   */
  private async sendPharmacyPickupNotification(
    data: MedicationPrescribedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "pharmacy_pickup",
        title: "Nhận thuốc tại nhà thuốc",
        content: `Đơn thuốc của bạn đã sẵn sàng tại nhà thuốc. Vui lòng mang theo ID đơn thuốc: ${data.prescriptionId}.${data.pharmacyInstructions ? ` ${data.pharmacyInstructions}` : ""}`,
        channels: this.getEnabledChannels(preferences, ["sms", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          prescriptionId: data.prescriptionId,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send pharmacy pickup notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Schedule medication reminders
   */
  private async scheduleMedicationReminders(
    data: MedicationPrescribedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      for (const medication of data.medications) {
        const reminderTimes = this.getMedicationReminderTimes(
          medication.frequency,
        );

        for (const reminderTime of reminderTimes) {
          // Schedule reminders for next 30 days
          for (let day = 0; day < 30; day++) {
            const reminderDate = new Date();
            reminderDate.setDate(reminderDate.getDate() + day);

            const [hours, minutes] = reminderTime.split(":");
            reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (reminderDate > new Date()) {
              const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "medication_reminder",
                title: "Nhắc nhở uống thuốc",
                content: `Đã đến giờ uống thuốc ${medication.name} (${medication.dosage}).${medication.instructions ? ` ${medication.instructions}` : ""}`,
                channels: this.getEnabledChannels(preferences, [
                  "sms",
                  "in_app",
                ]),
                priority: "normal",
                scheduledAt: reminderDate,
                metadata: {
                  patientId: data.patientId,
                  prescriptionId: data.prescriptionId,
                  medicationName: medication.name,
                },
              };

              await this.dispatchNotification(notificationData);
            }
          }
        }
      }

      console.log("Scheduled medication reminders", {
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
        medicationsCount: data.medications.length,
      });
    } catch (error) {
      console.error("Failed to schedule medication reminders", {
        prescriptionId: data.prescriptionId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send emergency alert notification
   */
  private async sendEmergencyAlertNotification(
    data: EmergencyAlertTriggeredEventData,
  ): Promise<void> {
    try {
      const alertTypeText =
        {
          cardiac_arrest: "ngưng tim",
          respiratory_distress: "khó thở",
          severe_bleeding: "chảy máu nặng",
          fall: "ngã",
          other: "khẩn cấp khác",
        }[data.alertType] || data.alertType;

      const notificationData = {
        recipientId: "emergency_team",
        recipientType: "department",
        type: "emergency_alert",
        title: "CẢNH BÁO KHẨN CẤP Y KHOA",
        content: `${alertTypeText} tại ${data.location}. Bệnh nhân: ${data.patientName}. Mức độ: ${data.severity}. ${data.description}`,
        channels: ["in_app", "email", "sms"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          alertId: data.alertId,
          patientId: data.patientId,
          alertType: data.alertType,
          severity: data.severity,
          location: data.location,
          responseTeamRequired: data.responseTeamRequired,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send emergency alert notification", {
        alertId: data.alertId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send emergency contact notification
   */
  private async sendEmergencyContactNotification(
    data: EmergencyAlertTriggeredEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "emergency_contact",
        title: "Thông báo khẩn cấp",
        content: `Đã xảy ra tình huống khẩn cấp tại ${data.location}. Người nhà vui lòng liên hệ bệnh viện.`,
        channels: ["sms"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          alertId: data.alertId,
          patientId: data.patientId,
          alertType: data.alertType,
          location: data.location,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send emergency contact notification", {
        alertId: data.alertId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send department emergency notification
   */
  private async sendDepartmentEmergencyNotification(
    data: EmergencyAlertTriggeredEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "all_departments",
        recipientType: "department",
        type: "department_emergency",
        title: "Tình huống khẩn cấp khoa",
        content: `Tình huống khẩn cấp ${data.alertType} tại ${data.location}. Cần hỗ trợ từ các khoa: ${data.responseTeamRequired.join(", ")}`,
        channels: ["in_app"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          alertId: data.alertId,
          alertType: data.alertType,
          location: data.location,
          responseTeamRequired: data.responseTeamRequired,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send department emergency notification", {
        alertId: data.alertId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Log emergency notification for compliance
   */
  private async logEmergencyNotification(
    data: EmergencyAlertTriggeredEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "compliance_log",
        recipientType: "system",
        type: "emergency_log",
        title: "Log cảnh báo khẩn cấp",
        content: `Emergency alert logged: ${data.alertId} - ${data.alertType} - Patient: ${data.patientId} - Location: ${data.location}`,
        channels: ["email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          alertId: data.alertId,
          patientId: data.patientId,
          alertType: data.alertType,
          severity: data.severity,
          location: data.location,
          triggeredAt: data.triggeredAt,
          triggeredBy: data.triggeredBy,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to log emergency notification", {
        alertId: data.alertId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Helper methods
   */
  private getEnabledChannels(
    preferences: any,
    defaultChannels: string[],
  ): string[] {
    if (!preferences || !preferences.channels) {
      return defaultChannels;
    }

    return defaultChannels.filter(
      (channel) => preferences.channels[channel] !== false,
    );
  }

  private getTreatmentFrequency(frequency: string): number {
    const frequencyMap: { [key: string]: number } = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90,
    };

    return frequencyMap[frequency] || 7;
  }

  private getNextTreatmentDate(currentDate: Date, frequencyDays: number): Date {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + frequencyDays);
    return nextDate;
  }

  private getMedicationReminderTimes(frequency: string): string[] {
    const frequencyMap: { [key: string]: string[] } = {
      once_daily: ["08:00"],
      twice_daily: ["08:00", "20:00"],
      three_times_daily: ["08:00", "14:00", "20:00"],
      four_times_daily: ["08:00", "12:00", "16:00", "20:00"],
      as_needed: [], // No scheduled reminders for as-needed
    };

    return frequencyMap[frequency] || ["08:00"];
  }

  private formatVitalSigns(vitalSigns: any): string {
    const parts: string[] = [];

    if (vitalSigns.bloodPressure) {
      parts.push(
        `Huyết áp: ${vitalSigns.bloodPressure.systolic}/${vitalSigns.bloodPressure.diastolic} mmHg`,
      );
    }
    if (vitalSigns.heartRate) {
      parts.push(`Nhịp tim: ${vitalSigns.heartRate} bpm`);
    }
    if (vitalSigns.temperature) {
      parts.push(`Nhiệt độ: ${vitalSigns.temperature}°C`);
    }
    if (vitalSigns.oxygenSaturation) {
      parts.push(`SpO2: ${vitalSigns.oxygenSaturation}%`);
    }
    if (vitalSigns.respiratoryRate) {
      parts.push(`Nhịp thở: ${vitalSigns.respiratoryRate}/phút`);
    }
    if (vitalSigns.weight) {
      parts.push(`Cân nặng: ${vitalSigns.weight} kg`);
    }
    if (vitalSigns.height) {
      parts.push(`Chiều cao: ${vitalSigns.height} cm`);
    }

    return parts.join("\n") || "Không có dữ liệu";
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private async dispatchNotification(
    payload: SendNotificationCommand,
  ): Promise<void> {
    await this.sendNotificationUseCase.execute({
      ...payload,
      priority: normalizePriority(payload.priority),
    });
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      console.log("Clinical EMR event consumer disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting clinical EMR event consumer", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
