import { gql } from "graphql-tag";

/**
 * GraphQL Schema for Patient entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const patientTypeDefs = gql`
  # Patient-specific enums only (common scalars defined in base schema)
  # Enums
  enum PatientStatus {
    ACTIVE
    INACTIVE
    DECEASED
    TRANSFERRED
  }

  enum BloodGroup {
    A_POSITIVE
    A_NEGATIVE
    B_POSITIVE
    B_NEGATIVE
    AB_POSITIVE
    AB_NEGATIVE
    O_POSITIVE
    O_NEGATIVE
    UNKNOWN
  }

  enum MaritalStatus {
    SINGLE
    MARRIED
    DIVORCED
    WIDOWED
    SEPARATED
  }

  enum InsuranceType {
    SOCIAL_INSURANCE
    PRIVATE_INSURANCE
    COMPANY_INSURANCE
    SELF_PAY
    GOVERNMENT
  }

  # Core Patient Type
  type Patient {
    # Basic Information
    id: UUID!
    patient_id: PatientID!
    profile_id: UUID!
    full_name: String!
    email: String!
    phone_number: PhoneNumber

    # Personal Information
    gender: Gender!
    date_of_birth: Date!
    age: Int!
    address: String
    emergency_contact: EmergencyContact
    marital_status: MaritalStatus
    occupation: String

    # Medical Information
    blood_type: BloodGroup
    height: Height
    weight: Weight
    bmi: Float
    allergies: [String!]
    chronic_conditions: [String!]
    current_medications: [String!]

    # Insurance Information
    insurance_type: InsuranceType
    insurance_number: String
    insurance_provider: String
    insurance_expiry_date: Date

    # Status
    is_active: Boolean!
    status: PatientStatus!

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
    last_visit: DateTime

    # Relationships
    appointments(
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
      limit: Int = 10
      offset: Int = 0
    ): AppointmentConnection!
    medicalRecords(
      limit: Int = 10
      offset: Int = 0
      dateFrom: Date
      dateTo: Date
    ): MedicalRecordConnection!
    prescriptions(
      active: Boolean
      limit: Int = 10
      offset: Int = 0
    ): PrescriptionConnection!
    payments(
      status: String
      limit: Int = 10
      offset: Int = 0
    ): PaymentConnection!

    # Computed Fields
    total_appointments: Int!
    upcoming_appointments: Int!
    completed_appointments: Int!
    total_spent: Float!
    last_appointment: Appointment
    next_appointment: Appointment
    primary_doctor: Doctor
    visit_frequency: Float # visits per month
  }

  # Emergency Contact
  type EmergencyContact {
    name: String!
    relationship: String!
    phone_number: PhoneNumber!
    address: String
  }

  # Patient Medical Summary
  type PatientMedicalSummary {
    patient_id: PatientID!
    total_visits: Int!
    last_visit_date: DateTime
    chronic_conditions: [String!]!
    allergies: [String!]!
    current_medications: [String!]!
    vital_signs: LatestVitalSigns
    lab_results: [LatestLabResult!]!
    diagnoses: [String!]!
    treatments: [String!]!
    risk_factors: [String!]!
  }

  type LatestVitalSigns {
    blood_pressure: String
    heart_rate: Int
    temperature: Float
    respiratory_rate: Int
    oxygen_saturation: Float
    recorded_at: DateTime!
  }

  type LatestLabResult {
    test_name: String!
    value: String!
    unit: String
    normal_range: String
    status: String # NORMAL, HIGH, LOW, CRITICAL
    recorded_at: DateTime!
  }

  # Patient Statistics
  type PatientStats {
    patient_id: PatientID!
    total_appointments: Int!
    completed_appointments: Int!
    cancelled_appointments: Int!
    no_show_appointments: Int!
    total_spent: Float!
    average_spent_per_visit: Float!
    visit_frequency: Float! # visits per month
    last_visit_date: DateTime
    next_appointment_date: DateTime
    preferred_doctors: [Doctor!]!
    most_visited_departments: [Department!]!
  }

  # Connection types
  type PatientConnection {
    edges: [PatientEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PatientEdge {
    node: Patient!
    cursor: String!
  }

  # Note: MedicalRecordConnection and MedicalRecordEdge are defined in medical-record.schema.ts
  # to avoid duplication

  type PrescriptionConnection {
    edges: [PrescriptionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PrescriptionEdge {
    node: Prescription!
    cursor: String!
  }

  type PaymentConnection {
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PaymentEdge {
    node: Payment!
    cursor: String!
  }

  # Input Types
  input PatientFilters {
    search: String
    status: PatientStatus
    is_active: Boolean
    gender: Gender
    ageMin: Int
    ageMax: Int
    bloodType: BloodGroup
    insuranceType: InsuranceType
    hasChronicConditions: Boolean
    lastVisitFrom: Date
    lastVisitTo: Date
    registeredFrom: Date
    registeredTo: Date
  }

  input CreatePatientInput {
    full_name: String!
    email: String!
    phone_number: PhoneNumber!
    gender: Gender!
    date_of_birth: Date!
    address: String
    emergency_contact: EmergencyContactInput
    marital_status: MaritalStatus
    occupation: String
    blood_type: BloodGroup
    height: Height
    weight: Weight
    allergies: [String!]
    chronic_conditions: [String!]
    current_medications: [String!]
    insurance_type: InsuranceType
    insurance_number: String
    insurance_provider: String
    insurance_expiry_date: Date
  }

  input UpdatePatientInput {
    full_name: String
    phone_number: PhoneNumber
    address: String
    emergency_contact: EmergencyContactInput
    marital_status: MaritalStatus
    occupation: String
    blood_type: BloodGroup
    height: Height
    weight: Weight
    allergies: [String!]
    chronic_conditions: [String!]
    current_medications: [String!]
    insurance_type: InsuranceType
    insurance_number: String
    insurance_provider: String
    insurance_expiry_date: Date
    is_active: Boolean
    status: PatientStatus
  }

  input EmergencyContactInput {
    name: String!
    relationship: String!
    phone_number: PhoneNumber!
    address: String
  }

  # Queries
  extend type Query {
    # Single patient queries
    patient(id: UUID, patient_id: PatientID): Patient
    patientByProfile(profile_id: UUID!): Patient

    # Multiple patients queries
    patients(
      filters: PatientFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "created_at"
      sortOrder: String = "DESC"
    ): PatientConnection!

    # Search patients
    searchPatients(
      query: String!
      filters: PatientFilters
      limit: Int = 20
      offset: Int = 0
    ): PatientConnection!

    # Patient medical summary
    patientMedicalSummary(patient_id: PatientID!): PatientMedicalSummary!

    # Patient statistics
    patientStats(patient_id: PatientID!): PatientStats!

    # Patient medical records (specific to patient context)
    patientMedicalRecords(
      patient_id: PatientID!
      limit: Int = 20
      offset: Int = 0
      dateFrom: Date
      dateTo: Date
    ): MedicalRecordConnection!

    # Patient appointments with doctor
    patientDoctorHistory(
      patient_id: PatientID!
      doctor_id: DoctorID!
      limit: Int = 10
    ): [Appointment!]!

    # Patients by doctor
    doctorPatients(
      doctor_id: DoctorID!
      limit: Int = 20
      offset: Int = 0
    ): PatientConnection!

    # Recent patients
    recentPatients(days: Int = 30, limit: Int = 20): [Patient!]!
  }

  # Mutations
  extend type Mutation {
    # Patient management
    createPatient(input: CreatePatientInput!): Patient!
    updatePatient(id: UUID!, input: UpdatePatientInput!): Patient!
    deletePatient(id: UUID!): Boolean!
    activatePatient(id: UUID!): Patient!
    deactivatePatient(id: UUID!): Patient!

    # Patient medical information
    updatePatientMedicalInfo(
      id: UUID!
      blood_type: BloodGroup
      height: Height
      weight: Weight
      allergies: [String!]
      chronic_conditions: [String!]
      current_medications: [String!]
    ): Patient!

    # Patient insurance
    updatePatientInsurance(
      id: UUID!
      insurance_type: InsuranceType
      insurance_number: String
      insurance_provider: String
      insurance_expiry_date: Date
    ): Patient!

    # Emergency contact
    updateEmergencyContact(
      id: UUID!
      emergency_contact: EmergencyContactInput!
    ): Patient!
  }

  # Subscriptions
  extend type Subscription {
    # Patient status changes
    patientStatusChanged(patient_id: PatientID): Patient!
    patientUpdated(patient_id: PatientID): Patient!

    # New medical records
    patientMedicalRecordAdded(patient_id: PatientID!): MedicalRecord!

    # New prescriptions
    patientPrescriptionAdded(patient_id: PatientID!): Prescription!
  }
`;

export default patientTypeDefs;
