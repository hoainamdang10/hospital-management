"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalRecordTypeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
/**
 * GraphQL Schema for Medical Record entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
exports.medicalRecordTypeDefs = (0, graphql_tag_1.gql) `
  # Medical Record-specific enums
  enum MedicalRecordStatus {
    ACTIVE
    ARCHIVED
    DELETED
  }

  enum LabResultStatus {
    PENDING
    COMPLETED
    CANCELLED
  }

  # Input Types
  input MedicalRecordFilters {
    patient_id: PatientID
    doctor_id: DoctorID
    appointment_id: UUID
    status: MedicalRecordStatus
    visit_date_from: Date
    visit_date_to: Date
    diagnosis: String
  }

  input CreateMedicalRecordInput {
    patient_id: PatientID!
    doctor_id: DoctorID!
    appointment_id: UUID
    visit_date: Date!
    chief_complaint: String
    history_of_present_illness: String
    physical_examination: String
    diagnosis: String
    treatment: String
    prescription: String
    follow_up_instructions: String
    vital_signs: VitalSignsInput
  }

  input UpdateMedicalRecordInput {
    chief_complaint: String
    history_of_present_illness: String
    physical_examination: String
    diagnosis: String
    treatment: String
    prescription: String
    follow_up_instructions: String
    vital_signs: VitalSignsInput
    status: MedicalRecordStatus
  }

  input VitalSignsInput {
    # Blood Pressure
    blood_pressure_systolic: Int
    blood_pressure_diastolic: Int

    # Core Vitals
    heart_rate: Int
    temperature: Float
    respiratory_rate: Int
    oxygen_saturation: Float

    # Physical Measurements
    height: Float
    weight: Float

    # Metadata
    recorded_by: String!
    notes: String
  }

  input CreateLabResultInput {
    record_id: UUID!
    test_name: String!
    test_type: String!
    result_value: String
    reference_range: String
    unit: String
    test_date: Date!
    result_date: Date
    lab_technician: String
    notes: String
  }

  input UpdateLabResultInput {
    test_name: String
    test_type: String
    result_value: String
    reference_range: String
    unit: String
    test_date: Date
    result_date: Date
    lab_technician: String
    notes: String
    status: LabResultStatus
  }

  # Simplified Medical Record Type
  type MedicalRecord {
    id: UUID!
    patient_id: PatientID!
    doctor_id: DoctorID!
    appointment_id: UUID

    # Simplified Record Information
    visit_date: Date!
    symptoms: String # Replaces: chief_complaint + history_of_present_illness
    examination_notes: String # Replaces: physical_examination
    diagnosis: String
    treatment: String # Replaces: treatment + follow_up_instructions
    medications: String # Simple text instead of complex prescription system
    notes: String

    # Status
    status: MedicalRecordStatus!

    # Simplified Vital Signs (embedded)
    basic_vitals: BasicVitalSigns

    # Attachments (keep for file uploads)
    attachments: [MedicalAttachment!]!

    # Relationships
    patient: Patient!
    doctor: Doctor!
    appointment: Appointment

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Simplified Basic Vital Signs (embedded in medical record)
  type BasicVitalSigns {
    temperature: Float # Celsius
    blood_pressure: String # "120/80" format
    heart_rate: Int # BPM
    weight: Float # KG
    height: Float # CM
  }

  # REMOVED: LabResult type - lab results now stored as simple text in medical records

  # Medical Attachment
  type MedicalAttachment {
    id: UUID!
    record_id: UUID!
    file_name: String!
    file_url: String!
    file_type: String!
    file_size: Int!
    description: String
    uploaded_by: String!
    created_at: DateTime!
  }

  # Connection types
  type MedicalRecordConnection {
    edges: [MedicalRecordEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MedicalRecordEdge {
    node: MedicalRecord!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Single medical record
    medicalRecord(id: UUID!): MedicalRecord

    # Multiple medical records with filters
    medicalRecords(
      filters: MedicalRecordFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "visit_date"
      sortOrder: String = "DESC"
    ): MedicalRecordConnection!

    # Doctor medical records
    doctorMedicalRecords(
      doctor_id: DoctorID!
      limit: Int = 20
      offset: Int = 0
      date_from: Date
      date_to: Date
    ): MedicalRecordConnection!

    # Search medical records
    searchMedicalRecords(
      query: String!
      filters: MedicalRecordFilters
      limit: Int = 20
      offset: Int = 0
    ): MedicalRecordConnection!

    # Lab results query
    labResults(
      patient_id: PatientID!
      test_type: String
      limit: Int = 20
      offset: Int = 0
      date_from: Date
      date_to: Date
    ): [LabResult!]!

    # Note: patientMedicalRecords query is defined in patient.schema.ts
    # to maintain proper context and avoid conflicts
  }

  # Mutations
  extend type Mutation {
    # Medical Record management
    createMedicalRecord(input: CreateMedicalRecordInput!): MedicalRecord!
    updateMedicalRecord(
      id: UUID!
      input: UpdateMedicalRecordInput!
    ): MedicalRecord!
    deleteMedicalRecord(id: UUID!): Boolean!

    # Lab Results
    addLabResult(input: CreateLabResultInput!): LabResult!
    updateLabResult(id: UUID!, input: UpdateLabResultInput!): LabResult!
    deleteLabResult(id: UUID!): Boolean!

    # Medical Record Attachments
    addMedicalAttachment(
      record_id: UUID!
      file: Upload!
      description: String
    ): MedicalAttachment!
    deleteMedicalAttachment(id: UUID!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Medical record updates
    medicalRecordUpdated(record_id: UUID): MedicalRecord!
    medicalRecordCreated(patient_id: PatientID): MedicalRecord!

    # Lab result updates
    labResultAdded(record_id: UUID): LabResult!
    labResultUpdated(record_id: UUID): LabResult!
  }
`;
exports.default = exports.medicalRecordTypeDefs;
//# sourceMappingURL=medical-record.schema.js.map