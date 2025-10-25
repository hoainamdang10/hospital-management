/**
 * MedicalRecord Aggregate - Clinical EMR Service
 * Core aggregate for managing medical records with simplified scope
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { HealthcareAggregateRoot } from "@shared/domain/base/aggregate-root";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { MedicalRecordCreatedEvent } from "../events/MedicalRecordCreatedEvent";
import { MedicalRecordUpdatedEvent } from "../events/MedicalRecordUpdatedEvent";
import { BasicVitalSigns } from "../value-objects/BasicVitalSigns";
import { Diagnosis } from "../value-objects/Diagnosis";
import { Medication } from "../value-objects/Medication";
import { RecordId } from "../value-objects/RecordId";

export interface MedicalRecordProps {
  recordId: RecordId;
  patientId: string;
  doctorId: string;
  appointmentId?: string;

  // Enhanced Medical Information with Value Objects
  visitDate: Date;
  symptoms?: string;
  examinationNotes?: string;

  // Enhanced with Value Objects
  diagnoses: Diagnosis[]; // Multiple diagnoses support
  medications: Medication[]; // Multiple medications support

  // Legacy fields for backward compatibility
  diagnosis?: string; // Deprecated - use diagnoses array
  treatment?: string;
  medicationsLegacy?: string; // Deprecated - use medications array
  notes?: string;

  // Basic Vital Signs
  vitalSigns?: BasicVitalSigns;

  // FHIR Compliance
  fhirResourceId?: string; // FHIR resource identifier
  fhirVersion?: string; // FHIR version (default: 4.0.1)
  fhirProfile?: string; // FHIR profile URI

  // Vietnamese Medical Standards
  vietnameseMedicalCode?: string; // Mã hồ sơ bệnh án Việt Nam
  specialtyCode?: string; // Mã chuyên khoa
  hospitalCode?: string; // Mã bệnh viện

  // Status and Audit
  status: MedicalRecordStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;

  // Audit trail for HIPAA compliance
  accessLog?: MedicalRecordAccess[];
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export enum MedicalRecordStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  DELETED = "deleted",
  DRAFT = "draft", // Bản nháp
  PENDING_REVIEW = "pending-review", // Chờ duyệt
  REVIEWED = "reviewed", // Đã duyệt
  AMENDED = "amended", // Đã sửa đổi
}

/**
 * Medical Record Access Log for HIPAA Compliance
 */
export interface MedicalRecordAccess {
  accessedAt: Date;
  accessedBy: string;
  accessType: "read" | "write" | "print" | "export";
  ipAddress?: string;
  userAgent?: string;
  purpose?: string; // Mục đích truy cập
}

export class MedicalRecordAggregate extends HealthcareAggregateRoot<MedicalRecordProps> {
  private constructor(props: MedicalRecordProps, id?: string) {
    super(props, id);
  }

  /**
   * Create new medical record with enhanced features
   */
  public static create(
    recordId: RecordId,
    patientId: string,
    doctorId: string,
    visitDate: Date,
    createdBy: string,
    options: {
      appointmentId?: string;
      symptoms?: string;
      examinationNotes?: string;
      diagnoses?: Diagnosis[];
      medications?: Medication[];
      notes?: string;
      vitalSigns?: BasicVitalSigns;
      specialtyCode?: string;
      hospitalCode?: string;
      fhirProfile?: string;
      status?: MedicalRecordStatus;
      // Legacy support
      diagnosis?: string;
      treatment?: string;
      medicationsLegacy?: string;
    } = {}
  ): MedicalRecordAggregate {
    const props: MedicalRecordProps = {
      recordId,
      patientId,
      doctorId,
      appointmentId: options.appointmentId,
      visitDate,
      symptoms: options.symptoms,
      examinationNotes: options.examinationNotes,

      // Enhanced with Value Objects
      diagnoses: options.diagnoses || [],
      medications: options.medications || [],

      // Legacy fields for backward compatibility
      diagnosis: options.diagnosis,
      treatment: options.treatment,
      medicationsLegacy: options.medicationsLegacy,
      notes: options.notes,

      vitalSigns: options.vitalSigns,

      // FHIR Compliance
      fhirResourceId: `MedicalRecord/${recordId.value}`,
      fhirVersion: "4.0.1",
      fhirProfile:
        options.fhirProfile ||
        "http://moh.gov.vn/fhir/StructureDefinition/MedicalRecord",

      // Vietnamese Medical Standards
      vietnameseMedicalCode: recordId.value,
      specialtyCode: options.specialtyCode,
      hospitalCode: options.hospitalCode,

      status: options.status || MedicalRecordStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      updatedBy: createdBy,

      // Initialize access log
      accessLog: [
        {
          accessedAt: new Date(),
          accessedBy: createdBy,
          accessType: "write",
          purpose: "Tạo hồ sơ bệnh án mới",
        },
      ],
      lastAccessedAt: new Date(),
      lastAccessedBy: createdBy,
    };

    const aggregate = new MedicalRecordAggregate(props, recordId.value);

    // Validate business invariants
    aggregate.validateInvariants();

    // Add domain event
    aggregate.addDomainEvent(
      new MedicalRecordCreatedEvent({
        recordId: recordId.value,
        patientId,
        doctorId,
        appointmentId: options.appointmentId,
        visitDate,
        symptoms: options.symptoms,
        diagnosis: options.diagnosis,
        createdBy,
        createdAt: props.createdAt
      })
    );

    return aggregate;
  }

  /**
   * Reconstitute from database
   */
  public static reconstitute(
    props: MedicalRecordProps,
    id?: string
  ): MedicalRecordAggregate {
    return new MedicalRecordAggregate(props, id || props.recordId.value);
  }

  protected validateBusinessInvariants(): void {
    const { recordId, patientId, doctorId, visitDate, createdBy } = this.props;

    // Required fields validation
    if (!recordId) {
      throw new Error("RecordId là bắt buộc");
    }
    if (!patientId || patientId.trim() === "") {
      throw new Error("PatientId là bắt buộc");
    }
    if (!doctorId || doctorId.trim() === "") {
      throw new Error("DoctorId là bắt buộc");
    }
    if (!visitDate) {
      throw new Error("Ngày khám là bắt buộc");
    }
    if (!createdBy || createdBy.trim() === "") {
      throw new Error("CreatedBy là bắt buộc");
    }

    // Visit date validation
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
    const minPastDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year in past

    if (visitDate > maxFutureDate) {
      throw new Error("Ngày khám không được quá 7 ngày trong tương lai");
    }
    if (visitDate < minPastDate) {
      throw new Error("Ngày khám không được quá 1 năm trong quá khứ");
    }

    // Status validation
    if (!Object.values(MedicalRecordStatus).includes(this.props.status)) {
      throw new Error("Trạng thái hồ sơ không hợp lệ");
    }

    // Patient ID format validation (Vietnamese format)
    const patientIdRegex = /^PAT-\d{6}-\d{3}$/;
    if (!patientIdRegex.test(patientId)) {
      throw new Error("PatientId phải có định dạng PAT-YYYYMM-XXX");
    }

    // Doctor ID format validation (Vietnamese format)
    const doctorIdRegex = /^[A-Z]{2,4}-DOC-\d{6}-\d{3}$/;
    if (!doctorIdRegex.test(doctorId)) {
      throw new Error("DoctorId phải có định dạng DEPT-DOC-YYYYMM-XXX");
    }
  }

  public toPersistence(): any {
    return {
      id: this.id,
      record_id: this.props.recordId.value,
      patient_id: this.props.patientId,
      doctor_id: this.props.doctorId,
      appointment_id: this.props.appointmentId,
      visit_date: this.props.visitDate.toISOString(),
      symptoms: this.props.symptoms,
      examination_notes: this.props.examinationNotes,
      diagnosis: this.props.diagnosis,
      treatment: this.props.treatment,
      medications: this.props.medicationsLegacy,
      notes: this.props.notes,
      diagnoses_json: JSON.stringify(this.props.diagnoses.map(d => d.toJSON())),
      medications_json: JSON.stringify(this.props.medications.map(m => m.toJSON())),
      vital_signs_json: this.props.vitalSigns ? JSON.stringify(this.props.vitalSigns.toJSON()) : null,
      fhir_resource_id: this.props.fhirResourceId,
      fhir_version: this.props.fhirVersion,
      fhir_profile: this.props.fhirProfile,
      vietnamese_medical_code: this.props.vietnameseMedicalCode,
      specialty_code: this.props.specialtyCode,
      hospital_code: this.props.hospitalCode,
      status: this.props.status,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
      created_by: this.props.createdBy,
      updated_by: this.props.updatedBy,
      access_log_json: JSON.stringify(this.props.accessLog || []),
      last_accessed_at: this.props.lastAccessedAt?.toISOString(),
      last_accessed_by: this.props.lastAccessedBy,
      version: this.version || 0
    };
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case "MedicalRecordCreated":
        // Event already applied during creation
        break;
      case "MedicalRecordUpdated":
        this.props.updatedAt = new Date();
        break;
      default:
        // Unknown event type
        break;
    }
  }

  override getPatientId(): string | null {
    return this.props.patientId;
  }

  override containsPHI(): boolean {
    return true;
  }

  /**
   * Update medical record information
   */
  public updateMedicalInformation(
    updates: {
      symptoms?: string;
      examinationNotes?: string;
      diagnosis?: string;
      treatment?: string;
      medications?: string;
      notes?: string;
    },
    updatedBy: string,
    updateReason?: string
  ): void {
    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    const updatedFields: string[] = [];

    // Track changes
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value !== undefined &&
        this.props[key as keyof MedicalRecordProps] !== value
      ) {
        previousValues[key] = this.props[key as keyof MedicalRecordProps];
        newValues[key] = value;
        updatedFields.push(key);
        (this.props as any)[key] = value;
      }
    });

    if (updatedFields.length > 0) {
      this.props.updatedAt = new Date();
      this.props.updatedBy = updatedBy;

      // Add domain event
      this.addDomainEvent(
        new MedicalRecordUpdatedEvent({
          recordId: this.props.recordId.value,
          patientId: this.props.patientId,
          doctorId: this.props.doctorId,
          updatedFields,
          previousValues,
          newValues,
          updatedBy,
          updatedAt: this.props.updatedAt,
          updateReason,
        })
      );
    }
  }

  /**
   * Update vital signs
   */
  public updateVitalSigns(
    vitalSigns: BasicVitalSigns,
    updatedBy: string
  ): void {
    this.logAccess(updatedBy, "write", "Cập nhật sinh hiệu");

    const previousVitalSigns = this.props.vitalSigns;
    this.props.vitalSigns = vitalSigns;
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Add domain event
    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["vitalSigns"],
        previousValues: { vitalSigns: previousVitalSigns?.toJSON() },
        newValues: { vitalSigns: vitalSigns.toJSON() },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: "Cập nhật sinh hiệu",
      })
    );
  }

  /**
   * Add diagnosis to medical record
   */
  public addDiagnosis(diagnosis: Diagnosis, updatedBy: string): void {
    this.logAccess(updatedBy, "write", "Thêm chẩn đoán");

    // Check for duplicate diagnoses
    const existingDiagnosis = this.props.diagnoses.find(
      (d) => d.code === diagnosis.code
    );
    if (existingDiagnosis) {
      throw new Error(`Chẩn đoán với mã ${diagnosis.code} đã tồn tại`);
    }

    this.props.diagnoses.push(diagnosis);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Add domain event
    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["diagnoses"],
        previousValues: { diagnosesCount: this.props.diagnoses.length - 1 },
        newValues: {
          diagnosesCount: this.props.diagnoses.length,
          newDiagnosis: diagnosis.toJSON(),
        },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: `Thêm chẩn đoán: ${diagnosis.display}`,
      })
    );
  }

  /**
   * Remove diagnosis from medical record
   */
  public removeDiagnosis(
    diagnosisCode: string,
    updatedBy: string,
    reason?: string
  ): void {
    this.logAccess(updatedBy, "write", "Xóa chẩn đoán");

    const diagnosisIndex = this.props.diagnoses.findIndex(
      (d) => d.code === diagnosisCode
    );
    if (diagnosisIndex === -1) {
      throw new Error(`Không tìm thấy chẩn đoán với mã ${diagnosisCode}`);
    }

    const removedDiagnosis = this.props.diagnoses[diagnosisIndex];
    this.props.diagnoses.splice(diagnosisIndex, 1);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Add domain event
    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["diagnoses"],
        previousValues: {
          diagnosesCount: this.props.diagnoses.length + 1,
          removedDiagnosis: removedDiagnosis.toJSON(),
        },
        newValues: { diagnosesCount: this.props.diagnoses.length },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason || `Xóa chẩn đoán: ${removedDiagnosis.display}`,
      })
    );
  }

  /**
   * Add medication to medical record
   */
  public addMedication(medication: Medication, updatedBy: string): void {
    this.logAccess(updatedBy, "write", "Thêm thuốc");

    // Check for duplicate medications
    const existingMedication = this.props.medications.find(
      (m) => m.code === medication.code
    );
    if (existingMedication && existingMedication.isActive()) {
      throw new Error(`Thuốc với mã ${medication.code} đang được sử dụng`);
    }

    this.props.medications.push(medication);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Add domain event
    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["medications"],
        previousValues: { medicationsCount: this.props.medications.length - 1 },
        newValues: {
          medicationsCount: this.props.medications.length,
          newMedication: medication.toJSON(),
        },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: `Thêm thuốc: ${medication.name}`,
      })
    );
  }

  /**
   * Remove medication from medical record
   */
  public removeMedication(
    medicationCode: string,
    updatedBy: string,
    reason?: string
  ): void {
    this.logAccess(updatedBy, "write", "Xóa thuốc");

    const medicationIndex = this.props.medications.findIndex(
      (m) => m.code === medicationCode
    );
    if (medicationIndex === -1) {
      throw new Error(`Không tìm thấy thuốc với mã ${medicationCode}`);
    }

    const removedMedication = this.props.medications[medicationIndex];
    this.props.medications.splice(medicationIndex, 1);
    this.props.updatedAt = new Date();
    this.props.updatedBy = updatedBy;

    // Add domain event
    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["medications"],
        previousValues: {
          medicationsCount: this.props.medications.length + 1,
          removedMedication: removedMedication.toJSON(),
        },
        newValues: { medicationsCount: this.props.medications.length },
        updatedBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason || `Xóa thuốc: ${removedMedication.name}`,
      })
    );
  }

  /**
   * Archive medical record
   */
  public archive(archivedBy: string, reason?: string): void {
    if (this.props.status === MedicalRecordStatus.ARCHIVED) {
      throw new Error("Hồ sơ bệnh án đã được lưu trữ");
    }
    if (this.props.status === MedicalRecordStatus.DELETED) {
      throw new Error("Không thể lưu trữ hồ sơ bệnh án đã bị xóa");
    }

    this.props.status = MedicalRecordStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    this.props.updatedBy = archivedBy;

    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["status"],
        previousValues: { status: MedicalRecordStatus.ACTIVE },
        newValues: { status: MedicalRecordStatus.ARCHIVED },
        updatedBy: archivedBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason || "Lưu trữ hồ sơ bệnh án",
      })
    );
  }

  /**
   * Restore archived medical record
   */
  public restore(restoredBy: string, reason?: string): void {
    if (this.props.status !== MedicalRecordStatus.ARCHIVED) {
      throw new Error("Chỉ có thể khôi phục hồ sơ bệnh án đã được lưu trữ");
    }

    this.props.status = MedicalRecordStatus.ACTIVE;
    this.props.updatedAt = new Date();
    this.props.updatedBy = restoredBy;

    this.addDomainEvent(
      new MedicalRecordUpdatedEvent({
        recordId: this.props.recordId.value,
        patientId: this.props.patientId,
        doctorId: this.props.doctorId,
        updatedFields: ["status"],
        previousValues: { status: MedicalRecordStatus.ARCHIVED },
        newValues: { status: MedicalRecordStatus.ACTIVE },
        updatedBy: restoredBy,
        updatedAt: this.props.updatedAt,
        updateReason: reason || "Khôi phục hồ sơ bệnh án",
      })
    );
  }

  // Getters
  public get recordId(): RecordId {
    return this.props.recordId;
  }

  public get patientId(): string {
    return this.props.patientId;
  }

  public get doctorId(): string {
    return this.props.doctorId;
  }

  public get appointmentId(): string | undefined {
    return this.props.appointmentId;
  }

  public get visitDate(): Date {
    return this.props.visitDate;
  }

  public get symptoms(): string | undefined {
    return this.props.symptoms;
  }

  public get examinationNotes(): string | undefined {
    return this.props.examinationNotes;
  }

  public get diagnosis(): string | undefined {
    return this.props.diagnosis;
  }

  public get treatment(): string | undefined {
    return this.props.treatment;
  }

  public get medicationsLegacy(): string | undefined {
    return this.props.medicationsLegacy;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get vitalSigns(): BasicVitalSigns | undefined {
    return this.props.vitalSigns;
  }

  public get status(): MedicalRecordStatus {
    return this.props.status;
  }

  override get createdAt(): Date {
    return this.props.createdAt;
  }

  override get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get createdBy(): string {
    return this.props.createdBy;
  }

  public get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  // Business logic methods
  public isActive(): boolean {
    return this.props.status === MedicalRecordStatus.ACTIVE;
  }

  public isArchived(): boolean {
    return this.props.status === MedicalRecordStatus.ARCHIVED;
  }

  public isDeleted(): boolean {
    return this.props.status === MedicalRecordStatus.DELETED;
  }

  public hasVitalSigns(): boolean {
    return !!this.props.vitalSigns && !this.props.vitalSigns.isEmpty();
  }

  public hasCompleteVitalSigns(): boolean {
    return !!this.props.vitalSigns && this.props.vitalSigns.isComplete();
  }

  public hasDiagnosis(): boolean {
    return !!this.props.diagnosis && this.props.diagnosis.trim() !== "";
  }

  public hasTreatment(): boolean {
    return !!this.props.treatment && this.props.treatment.trim() !== "";
  }

  public hasMedications(): boolean {
    return !!this.props.medicationsLegacy && this.props.medicationsLegacy.trim() !== "";
  }

  public isFromCurrentMonth(): boolean {
    return this.props.recordId.isCurrentMonth();
  }

  public isFromCurrentYear(): boolean {
    return this.props.recordId.isCurrentYear();
  }

  /**
   * Log access for HIPAA compliance
   */
  private logAccess(
    accessedBy: string,
    accessType: "read" | "write" | "print" | "export",
    purpose?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    if (!this.props.accessLog) {
      this.props.accessLog = [];
    }

    this.props.accessLog.push({
      accessedAt: new Date(),
      accessedBy,
      accessType,
      ipAddress,
      userAgent,
      purpose,
    });

    this.props.lastAccessedAt = new Date();
    this.props.lastAccessedBy = accessedBy;

    // Keep only last 100 access logs to prevent excessive growth
    if (this.props.accessLog.length > 100) {
      this.props.accessLog = this.props.accessLog.slice(-100);
    }
  }

  /**
   * Record read access
   */
  public recordReadAccess(
    accessedBy: string,
    purpose?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logAccess(accessedBy, "read", purpose, ipAddress, userAgent);
  }

  /**
   * Get FHIR-compliant medical record
   */
  public toFHIR(): any {
    this.logAccess(
      this.props.lastAccessedBy || "system",
      "export",
      "FHIR export"
    );

    return {
      resourceType: "Composition",
      id: this.props.fhirResourceId,
      meta: {
        versionId: "1",
        lastUpdated: this.props.updatedAt.toISOString(),
        profile: [
          this.props.fhirProfile ||
            "http://moh.gov.vn/fhir/StructureDefinition/MedicalRecord",
        ],
      },
      identifier: [
        {
          system: "http://moh.gov.vn/fhir/NamingSystem/medical-record-id",
          value: this.props.recordId.value,
        },
      ],
      status: this.getFHIRStatus(),
      type: {
        coding: [
          {
            system: "http://loinc.org",
            code: "11503-0",
            display: "Medical records",
          },
        ],
        text: "Hồ sơ bệnh án",
      },
      subject: {
        reference: `Patient/${this.props.patientId}`,
        display: "Bệnh nhân",
      },
      encounter: this.props.appointmentId
        ? {
            reference: `Encounter/${this.props.appointmentId}`,
            display: "Cuộc khám",
          }
        : undefined,
      date: this.props.visitDate.toISOString(),
      author: [
        {
          reference: `Practitioner/${this.props.doctorId}`,
          display: "Bác sĩ khám",
        },
      ],
      title: "Hồ sơ bệnh án",
      section: this.getFHIRSections(),
    };
  }

  /**
   * Get FHIR status mapping
   */
  private getFHIRStatus(): string {
    const statusMap = {
      [MedicalRecordStatus.ACTIVE]: "final",
      [MedicalRecordStatus.DRAFT]: "preliminary",
      [MedicalRecordStatus.PENDING_REVIEW]: "preliminary",
      [MedicalRecordStatus.REVIEWED]: "final",
      [MedicalRecordStatus.AMENDED]: "amended",
      [MedicalRecordStatus.ARCHIVED]: "final",
      [MedicalRecordStatus.DELETED]: "entered-in-error",
    };
    return statusMap[this.props.status] || "final";
  }

  /**
   * Get FHIR sections
   */
  private getFHIRSections(): any[] {
    const sections: any[] = [];

    // Symptoms section
    if (this.props.symptoms) {
      sections.push({
        title: "Triệu chứng",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "10154-3",
              display: "Chief complaint",
            },
          ],
        },
        text: {
          status: "generated",
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.props.symptoms}</div>`,
        },
      });
    }

    // Diagnoses section
    if (this.props.diagnoses.length > 0) {
      sections.push({
        title: "Chẩn đoán",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "29308-4",
              display: "Diagnosis",
            },
          ],
        },
        entry: this.props.diagnoses.map((diagnosis) => ({
          reference: `Condition/${diagnosis.code}`,
          display: diagnosis.display,
        })),
      });
    }

    // Medications section
    if (this.props.medications.length > 0) {
      sections.push({
        title: "Thuốc",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "10160-0",
              display: "History of medication use",
            },
          ],
        },
        entry: this.props.medications.map((medication) => ({
          reference: `MedicationRequest/${medication.code}`,
          display: medication.name,
        })),
      });
    }

    // Vital signs section
    if (this.props.vitalSigns && !this.props.vitalSigns.isEmpty()) {
      sections.push({
        title: "Sinh hiệu",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "8716-3",
              display: "Vital signs",
            },
          ],
        },
        text: {
          status: "generated",
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${this.props.vitalSigns.getSummary()}</div>`,
        },
      });
    }

    return sections;
  }

  /**
   * Validate FHIR compliance
   */
  public validateFHIRCompliance(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required FHIR fields validation
    if (!this.props.fhirResourceId) {
      errors.push("FHIR Resource ID là bắt buộc");
    }

    if (!this.props.fhirVersion) {
      errors.push("FHIR Version là bắt buộc");
    }

    if (!this.props.patientId) {
      errors.push("Patient reference là bắt buộc cho FHIR");
    }

    if (!this.props.doctorId) {
      errors.push("Practitioner reference là bắt buộc cho FHIR");
    }

    // Validate diagnoses FHIR compliance
    this.props.diagnoses.forEach((diagnosis, index) => {
      try {
        diagnosis.toFHIR();
      } catch (error) {
        errors.push(
          `Chẩn đoán ${index + 1} không tuân thủ FHIR: ${error.message}`
        );
      }
    });

    // Validate medications FHIR compliance
    this.props.medications.forEach((medication, index) => {
      try {
        medication.toFHIR();
      } catch (error) {
        errors.push(`Thuốc ${index + 1} không tuân thủ FHIR: ${error.message}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get medical record summary in Vietnamese
   */
  public getSummary(): string {
    const parts: string[] = [];

    parts.push(`Mã hồ sơ: ${this.props.recordId.value}`);
    parts.push(
      `Ngày khám: ${this.props.visitDate.toLocaleDateString("vi-VN")}`
    );

    if (this.props.symptoms) {
      parts.push(`Triệu chứng: ${this.props.symptoms}`);
    }

    // Enhanced with value objects
    if (this.props.diagnoses.length > 0) {
      const primaryDiagnosis = this.props.diagnoses.find((d) => d.isPrimary());
      if (primaryDiagnosis) {
        parts.push(`Chẩn đoán chính: ${primaryDiagnosis.display}`);
      }
      if (this.props.diagnoses.length > 1) {
        parts.push(`Số chẩn đoán: ${this.props.diagnoses.length}`);
      }
    } else if (this.props.diagnosis) {
      // Legacy support
      parts.push(`Chẩn đoán: ${this.props.diagnosis}`);
    }

    if (this.props.medications.length > 0) {
      const activeMedications = this.props.medications.filter((m) =>
        m.isActive()
      );
      parts.push(`Số thuốc: ${activeMedications.length}`);
    }

    if (this.props.treatment) {
      parts.push(`Điều trị: ${this.props.treatment}`);
    }

    if (this.props.vitalSigns && !this.props.vitalSigns.isEmpty()) {
      parts.push(`Sinh hiệu: ${this.props.vitalSigns.getSummary()}`);
    }

    return parts.join(" | ");
  }

  // Enhanced getters for new properties
  public get diagnoses(): Diagnosis[] {
    return [...this.props.diagnoses]; // Return copy to prevent mutation
  }

  public get medications(): Medication[] {
    return [...this.props.medications]; // Return copy to prevent mutation
  }

  public get fhirResourceId(): string | undefined {
    return this.props.fhirResourceId;
  }

  public get fhirVersion(): string | undefined {
    return this.props.fhirVersion;
  }

  public get fhirProfile(): string | undefined {
    return this.props.fhirProfile;
  }

  public get vietnameseMedicalCode(): string | undefined {
    return this.props.vietnameseMedicalCode;
  }

  public get specialtyCode(): string | undefined {
    return this.props.specialtyCode;
  }

  public get hospitalCode(): string | undefined {
    return this.props.hospitalCode;
  }

  public get accessLog(): MedicalRecordAccess[] | undefined {
    return this.props.accessLog ? [...this.props.accessLog] : undefined;
  }

  public get lastAccessedAt(): Date | undefined {
    return this.props.lastAccessedAt;
  }

  public get lastAccessedBy(): string | undefined {
    return this.props.lastAccessedBy;
  }

  // Enhanced business logic methods
  public hasPrimaryDiagnosis(): boolean {
    return this.props.diagnoses.some((d) => d.isPrimary());
  }

  public hasActiveMedications(): boolean {
    return this.props.medications.some((m) => m.isActive());
  }

  public getCriticalDiagnoses(): Diagnosis[] {
    return this.props.diagnoses.filter((d) => d.isCritical());
  }

  public getHighPriorityMedications(): Medication[] {
    return this.props.medications.filter((m) => m.isHighPriority());
  }

  public isFHIRCompliant(): boolean {
    return this.validateFHIRCompliance().isValid;
  }

  public hasBeenAccessed(): boolean {
    return !!this.props.accessLog && this.props.accessLog.length > 0;
  }

  public getLastAccessInfo(): { date: Date; by: string } | null {
    if (!this.props.lastAccessedAt || !this.props.lastAccessedBy) {
      return null;
    }
    return {
      date: this.props.lastAccessedAt,
      by: this.props.lastAccessedBy,
    };
  }

  /**
   * Convert to JSON with enhanced properties
   */
  public toJSON(): any {
    return {
      ...this.props,
      visitDate: this.props.visitDate.toISOString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      lastAccessedAt: this.props.lastAccessedAt?.toISOString(),
      diagnoses: this.props.diagnoses.map((d) => d.toJSON()),
      medications: this.props.medications.map((m) => m.toJSON()),
      vitalSigns: this.props.vitalSigns?.toJSON(),
      recordId: this.props.recordId.toJSON(),
    };
  }
}
