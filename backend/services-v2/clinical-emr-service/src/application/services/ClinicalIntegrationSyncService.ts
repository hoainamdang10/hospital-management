import { ILogger } from "../../shared/logger";
import {
  SupabasePatientSnapshotRepository,
  AppointmentContext,
} from "../../infrastructure/repositories/SupabasePatientSnapshotRepository";
import { SupabaseProviderSnapshotRepository } from "../../infrastructure/repositories/SupabaseProviderSnapshotRepository";

export class ClinicalIntegrationSyncService {
  constructor(
    private readonly patientRepo: SupabasePatientSnapshotRepository,
    private readonly providerRepo: SupabaseProviderSnapshotRepository,
    private readonly logger: ILogger,
  ) {}

  async handle(eventType: string, payload: Record<string, any>): Promise<void> {
    switch (eventType) {
      case "patient.registered":
      case "patient.updated":
        await this.syncPatientSnapshot(payload, eventType);
        break;

      case "provider.staff.created":
      case "provider.staff.updated":
        await this.syncProviderSnapshot(payload, true);
        break;

      case "provider.staff.deactivated":
      case "provider.staff.deleted":
        await this.syncProviderSnapshot(payload, false, eventType);
        break;

      case "appointment.completed":
      case "appointment.scheduled":
        await this.syncAppointmentContext(payload, eventType);
        break;

      default:
        this.logger.debug("[IntegrationSync] Unhandled routing key", {
          eventType,
        });
    }
  }

  private async syncPatientSnapshot(
    payload: Record<string, any>,
    eventType: string,
  ): Promise<void> {
    const patient = this.extractPatientPayload(payload);
    if (!patient.patientId) {
      this.logger.warn("[IntegrationSync] Missing patientId", {
        eventType,
        payload,
      });
      return;
    }

    await this.patientRepo.upsertSnapshot({
      patientId: patient.patientId,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      insurance: patient.insurance,
      emergencyContact: patient.emergencyContact,
      sourceService: patient.sourceService,
      metadata: patient.metadata,
    });
  }

  private async syncAppointmentContext(
    payload: Record<string, any>,
    eventType: string,
  ): Promise<void> {
    const patientId =
      payload.patientId ||
      payload.eventData?.patientId ||
      payload.data?.patientId ||
      payload.patient?.patientId;

    if (!patientId) {
      this.logger.warn(
        "[IntegrationSync] Appointment event missing patientId",
        {
          eventType,
          payload,
        },
      );
      return;
    }

    const context: AppointmentContext = {
      appointmentId:
        payload.appointmentId ||
        payload.eventData?.appointmentId ||
        payload.data?.appointmentId,
      appointmentDate:
        payload.appointmentDate ||
        payload.eventData?.appointmentDate ||
        payload.data?.appointmentDate ||
        payload.scheduledFor ||
        payload.startTime,
      doctorId:
        payload.doctorId ||
        payload.providerId ||
        payload.eventData?.doctorId ||
        payload.data?.doctorId,
      status:
        payload.status ||
        payload.appointmentStatus ||
        (eventType === "appointment.completed"
          ? "completed"
          : "scheduled"),
    };

    await this.patientRepo.updateLastAppointment(patientId, context);
  }

  private async syncProviderSnapshot(
    payload: Record<string, any>,
    isActive: boolean,
    eventType?: string,
  ): Promise<void> {
    const provider = this.extractProviderPayload(payload);
    if (!provider.providerId) {
      this.logger.warn("[IntegrationSync] Missing providerId", {
        payload,
        eventType,
      });
      return;
    }

    if (!isActive) {
      await this.providerRepo.deactivate(
        provider.providerId,
        eventType ?? "provider.staff.deactivated",
      );
      return;
    }

    await this.providerRepo.upsertSnapshot({
      providerId: provider.providerId,
      fullName: provider.fullName,
      specialization: provider.specialization,
      department: provider.department,
      licenseNumber: provider.licenseNumber,
      phone: provider.phone,
      email: provider.email,
      isActive: provider.isActive ?? true,
      lastKnownStatus: provider.lastKnownStatus,
      sourceService: provider.sourceService,
      metadata: provider.metadata,
    });
  }

  private extractPatientPayload(payload: Record<string, any>) {
    const data =
      payload.eventData ?? payload.payload ?? payload.data ?? payload;

    const personalInfo =
      data.personalInfo ??
      data.patient?.personalInfo ??
      payload.personalInfo ??
      {};

    const contactInfo =
      data.contactInfo ??
      data.patient?.contactInfo ??
      payload.contactInfo ??
      {};

    const pickString = (...values: Array<unknown>): string | null => {
      for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
          return value;
        }
      }
      return null;
    };

    const combinedNameCandidates = [
      data.patientName,
      data.fullName,
      personalInfo.fullName,
      [personalInfo.firstName, personalInfo.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim(),
      data.name,
      contactInfo.fullName,
    ].filter((value) => typeof value === "string" && value.length > 0);

    const address =
      contactInfo.address ??
      data.address ??
      data.homeAddress ??
      contactInfo.location ??
      null;

    const insurance =
      data.insurance ??
      data.insuranceInfo ??
      data.insuranceDetails ??
      data.patient?.insurance ??
      null;

    const emergencyContacts =
      data.emergencyContacts ??
      contactInfo.emergencyContacts ??
      (data.emergencyContact ? [data.emergencyContact] : null);

    return {
      patientId:
        data.patientId ||
        data.id ||
        data.profile?.patientId ||
        data.patient?.patientId,
      fullName: combinedNameCandidates[0] ?? null,
      dateOfBirth:
        data.dateOfBirth ?? personalInfo.dateOfBirth ?? data.dob ?? null,
      gender: data.gender ?? personalInfo.gender ?? data.sex ?? null,
      phone: pickString(
        data.phoneNumber,
        data.phone,
        personalInfo.phoneNumber,
        contactInfo.primaryPhone,
        contactInfo.phone,
        contactInfo.phoneNumber,
      ),
      email: pickString(
        data.email,
        data.contactEmail,
        personalInfo.email,
        contactInfo.email,
      ),
      address,
      insurance,
      emergencyContact:
        data.emergencyContact ??
        (Array.isArray(emergencyContacts)
          ? emergencyContacts[0]
          : emergencyContacts) ??
        null,
      sourceService:
        data.sourceService ??
        payload.serviceName ??
        payload.metadata?.source ??
        null,
      metadata: data.metadata ?? payload.metadata ?? {},
    };
  }

  private extractProviderPayload(payload: Record<string, any>) {
    const data =
      payload.payload ?? payload.eventData ?? payload.data ?? payload;

    const fullName =
      data.fullName ||
      data.displayName ||
      [data.firstName, data.lastName].filter(Boolean).join(" ").trim() ||
      data.staffName;

    return {
      providerId:
        data.providerId ||
        data.staffId ||
        data.id ||
        data.profile?.providerId,
      fullName: fullName || null,
      specialization:
        data.specialization ||
        data.primarySpecialization ||
        data.specialty ||
        null,
      department: data.department || data.departmentId || null,
      licenseNumber: data.licenseNumber || data.license || null,
      phone: data.phone || data.phoneNumber || null,
      email: data.email || data.contactEmail || null,
      isActive: data.isActive ?? data.status !== "inactive",
      lastKnownStatus: data.status ?? null,
      sourceService: data.sourceService ?? payload.serviceName ?? null,
      metadata: data.metadata ?? payload.metadata ?? null,
    };
  }
}
