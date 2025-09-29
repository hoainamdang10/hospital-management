import { gql } from "graphql-tag";

/**
 * GraphQL Schema for Department and related entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const departmentTypeDefs = gql`
  # Department-specific enums only (common scalars defined in base schema)
  # Enums
  enum DepartmentStatus {
    ACTIVE
    INACTIVE
    UNDER_MAINTENANCE
    TEMPORARILY_CLOSED
  }

  enum RoomType {
    CONSULTATION
    EXAMINATION
    SURGERY
    EMERGENCY
    ICU
    LABORATORY
    RADIOLOGY
    PHARMACY
    WAITING
    ADMINISTRATIVE
  }

  enum RoomStatus {
    AVAILABLE
    OCCUPIED
    MAINTENANCE
    RESERVED
    OUT_OF_SERVICE
  }

  enum EquipmentStatus {
    OPERATIONAL
    MAINTENANCE
    OUT_OF_ORDER
    CALIBRATION
    RETIRED
  }

  # Core Department Type
  type Department {
    # Basic Information
    id: UUID!
    departmentId: DepartmentID!
    name: String!
    nameEn: String
    nameVi: String!
    description: String

    # Department Details
    code: String! # e.g., CARD, NEUR, ORTH
    type: String # Internal, Surgical, Diagnostic, etc.
    floor: Int
    building: String
    phoneNumber: PhoneNumber
    email: String

    # Operational Information
    status: DepartmentStatus!
    is_active: Boolean!
    operatingHours: OperatingHours
    emergencyAvailable: Boolean!

    # Capacity Information
    totalRooms: Int!
    availableRooms: Int!
    totalBeds: Int
    availableBeds: Int
    maxPatients: Int

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!

    # Relationships
    head: Doctor # Department head
    doctors(
      status: DoctorStatus
      limit: Int = 20
      offset: Int = 0
    ): DoctorConnection!
    rooms(
      type: RoomType
      status: RoomStatus
      limit: Int = 20
      offset: Int = 0
    ): [Room!]!
    equipment(
      status: EquipmentStatus
      limit: Int = 20
      offset: Int = 0
    ): [Equipment!]!
    appointments(
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
      limit: Int = 20
      offset: Int = 0
    ): AppointmentConnection!

    # Statistics
    stats: DepartmentStats

    # Computed Fields
    currentPatients: Int!
    todayAppointments: Int!
    availabilityRate: Float! # percentage
    occupancyRate: Float! # percentage
  }

  # Operating Hours
  type OperatingHours {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
    sunday: DaySchedule
    holidays: DaySchedule
  }

  type DaySchedule {
    isOpen: Boolean!
    openTime: Time
    closeTime: Time
    breakStartTime: Time
    breakEndTime: Time
    emergencyOnly: Boolean
  }

  # Room
  type Room {
    id: UUID!
    roomNumber: String!
    name: String
    type: RoomType!
    status: RoomStatus!
    floor: Int
    building: String
    capacity: Int
    departmentId: UUID!
    department: Department!

    # Room Details
    area: Float # square meters
    hasAirConditioning: Boolean
    hasOxygen: Boolean
    hasVacuum: Boolean
    hasInternet: Boolean
    accessibility: Boolean

    # Equipment in room
    equipment: [Equipment!]!

    # Current usage
    currentAppointment: Appointment
    nextAppointment: Appointment
    isOccupied: Boolean!

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Equipment
  type Equipment {
    id: UUID!
    name: String!
    model: String
    manufacturer: String
    serialNumber: String
    type: String!
    status: EquipmentStatus!

    # Location
    departmentId: UUID
    roomId: UUID
    department: Department
    room: Room

    # Equipment Details
    purchaseDate: Date
    warrantyExpiry: Date
    lastMaintenanceDate: Date
    nextMaintenanceDate: Date
    cost: Float

    # Operational
    isOperational: Boolean!
    requiresCalibration: Boolean

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Department Statistics
  type DepartmentStats {
    departmentId: UUID!
    totalDoctors: Int!
    activeDoctors: Int!
    totalRooms: Int!
    availableRooms: Int!
    totalEquipment: Int!
    operationalEquipment: Int!

    # Appointment statistics
    todayAppointments: Int!
    thisWeekAppointments: Int!
    thisMonthAppointments: Int!
    completedAppointments: Int!
    cancelledAppointments: Int!

    # Patient statistics
    totalPatients: Int!
    newPatients: Int!
    returningPatients: Int!

    # Financial
    revenue: DepartmentRevenue!

    # Performance
    averageWaitTime: Float! # minutes
    averageConsultationTime: Float! # minutes
    patientSatisfactionScore: Float # 0-100
    occupancyRate: Float! # percentage
  }

  type DepartmentRevenue {
    today: Float!
    thisWeek: Float!
    thisMonth: Float!
    thisYear: Float!
    currency: String! # VND
  }

  # Note: MedicalRecord, VitalSigns, LabResult, and MedicalAttachment types
  # are defined in medical-record.schema.ts to avoid duplication and maintain consistency

  # Simplified Prescription
  type SimplifiedPrescription {
    id: UUID!
    patient_id: PatientID!
    doctor_id: DoctorID!
    appointment_id: UUID

    # Simplified Prescription Details
    prescriptionDate: Date!
    medications: [SimplifiedMedication!]! # Embedded simplified medications
    notes: String

    # Simplified Status
    status: PrescriptionStatus! # active, completed, cancelled
    # Relationships
    patient: Patient!
    doctor: Doctor!
    appointment: Appointment

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  enum PrescriptionStatus {
    ACTIVE
    COMPLETED
    CANCELLED
  }

  # Simplified Medication (embedded in prescription)
  type SimplifiedMedication {
    name: String! # Simple medication name
    dosage: String! # Free text (e.g., "500mg")
    instructions: String! # Simple instructions (e.g., "Take twice daily after meals")
    quantity: Int! # Number of units
  }

  # Payment
  type Payment {
    id: UUID!
    patient_id: PatientID!
    appointment_id: UUID

    # Payment Details
    paymentNumber: String!
    amount: Float!
    currency: String! # VND
    paymentMethod: String!
    paymentStatus: PaymentStatus!

    # Payment Breakdown
    consultationFee: Float!
    medicationFee: Float
    procedureFee: Float
    facilityFee: Float
    insuranceCoverage: Float
    discount: Float
    tax: Float

    # Payment Information
    paidAt: DateTime
    refundedAt: DateTime
    refundAmount: Float
    transactionId: String

    # Relationships
    patient: Patient!
    appointment: Appointment

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Input Types
  input DepartmentFilters {
    search: String
    status: DepartmentStatus
    is_active: Boolean
    type: String
    floor: Int
    building: String
    emergencyAvailable: Boolean
  }

  input CreateDepartmentInput {
    name: String!
    nameVi: String!
    nameEn: String
    description: String
    code: String!
    type: String
    floor: Int
    building: String
    phoneNumber: PhoneNumber
    email: String
    headDoctorId: DoctorID
    operatingHours: OperatingHoursInput
    emergencyAvailable: Boolean = false
    maxPatients: Int
  }

  input UpdateDepartmentInput {
    name: String
    nameVi: String
    nameEn: String
    description: String
    type: String
    floor: Int
    building: String
    phoneNumber: PhoneNumber
    email: String
    headDoctorId: DoctorID
    operatingHours: OperatingHoursInput
    emergencyAvailable: Boolean
    maxPatients: Int
    status: DepartmentStatus
    is_active: Boolean
  }

  input OperatingHoursInput {
    monday: DayScheduleInput
    tuesday: DayScheduleInput
    wednesday: DayScheduleInput
    thursday: DayScheduleInput
    friday: DayScheduleInput
    saturday: DayScheduleInput
    sunday: DayScheduleInput
    holidays: DayScheduleInput
  }

  input DayScheduleInput {
    isOpen: Boolean!
    openTime: Time
    closeTime: Time
    breakStartTime: Time
    breakEndTime: Time
    emergencyOnly: Boolean = false
  }

  # Queries
  extend type Query {
    # Department queries
    department(id: UUID, departmentId: DepartmentID): Department
    departments(
      filters: DepartmentFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "name"
      sortOrder: String = "ASC"
    ): [Department!]!

    # Department statistics
    departmentStats(departmentId: UUID!): DepartmentStats!

    # Room queries
    room(id: UUID!): Room
    departmentRooms(
      departmentId: UUID!
      type: RoomType
      status: RoomStatus
    ): [Room!]!
    availableRooms(
      departmentId: UUID
      type: RoomType
      date: Date
      timeFrom: Time
      timeTo: Time
    ): [Room!]!

    # Equipment queries
    equipment(id: UUID!): Equipment
    departmentEquipment(
      departmentId: UUID!
      status: EquipmentStatus
    ): [Equipment!]!

    # Note: Medical record queries are defined in medical-record.schema.ts
    # Note: Patient medical record queries are defined in patient.schema.ts

    # Prescriptions
    prescription(id: UUID!): Prescription
    patientPrescriptions(
      patient_id: PatientID!
      active: Boolean
      limit: Int = 20
      offset: Int = 0
    ): [Prescription!]!

    # Payments
    payment(id: UUID!): Payment
    patientPayments(
      patient_id: PatientID!
      status: PaymentStatus
      limit: Int = 20
      offset: Int = 0
    ): [Payment!]!
  }

  # Mutations
  extend type Mutation {
    # Department management
    createDepartment(input: CreateDepartmentInput!): Department!
    updateDepartment(id: UUID!, input: UpdateDepartmentInput!): Department!
    deleteDepartment(id: UUID!): Boolean!
    activateDepartment(id: UUID!): Department!
    deactivateDepartment(id: UUID!): Department!
  }

  # Subscriptions
  extend type Subscription {
    # Department updates
    departmentUpdated(departmentId: UUID): Department!
    departmentStatsUpdated(departmentId: UUID!): DepartmentStats!

    # Room availability
    roomAvailabilityChanged(departmentId: UUID): Room!

    # Equipment status
    equipmentStatusChanged(departmentId: UUID): Equipment!
  }
`;

export default departmentTypeDefs;
