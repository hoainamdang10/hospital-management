import { gql } from "graphql-tag";

/**
 * GraphQL Schema for Appointment entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
export const appointmentTypeDefs = gql`
  # Appointment-specific enums only (common scalars defined in base schema)
  # Enums
  enum AppointmentType {
    CONSULTATION
    FOLLOW_UP
    EMERGENCY
    SURGERY
    DIAGNOSTIC
    VACCINATION
    HEALTH_CHECKUP
    TELEMEDICINE
  }

  enum AppointmentPriority {
    LOW
    NORMAL
    HIGH
    URGENT
    EMERGENCY
  }

  enum PaymentStatus {
    PENDING
    PAID
    PARTIALLY_PAID
    REFUNDED
    CANCELLED
  }

  # Core Appointment Type
  type Appointment {
    # Basic Information
    id: UUID!
    appointment_id: AppointmentID!
    doctor_id: DoctorID!
    patient_id: PatientID!

    # Scheduling Information
    scheduled_date: Date!
    scheduled_time: Time!
    scheduled_date_time: DateTime!
    duration: Int! # minutes
    end_date_time: DateTime!

    # Appointment Details
    type: AppointmentType!
    priority: AppointmentPriority!
    status: AppointmentStatus!
    reason: String
    notes: String
    symptoms: [String!]

    # Location
    room: Room
    department: Department

    # Payment Information
    consultation_fee: Float!
    additional_fees: Float
    total_amount: Float!
    payment_status: PaymentStatus!
    payment_method: String

    # Status Tracking
    checked_in_at: DateTime
    started_at: DateTime
    completed_at: DateTime
    cancelled_at: DateTime
    cancellation_reason: String

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!

    # Relationships
    doctor: Doctor!
    patient: Patient!
    medical_record: MedicalRecord
    prescription: Prescription
    payment: Payment
    follow_up_appointment: Appointment
    parent_appointment: Appointment

    # Computed Fields
    is_today: Boolean!
    is_upcoming: Boolean!
    is_past: Boolean!
    can_cancel: Boolean!
    can_reschedule: Boolean!
    time_until_appointment: Int # minutes
    waiting_time: Int # minutes if checked in
  }

  # Appointment Slot
  type AppointmentSlot {
    start_time: DateTime!
    end_time: DateTime!
    duration: Int!
    is_available: Boolean!
    doctor_id: DoctorID!
    room: Room
    max_appointments: Int
    current_appointments: Int
    appointment_type: AppointmentType
  }

  # Appointment Statistics
  type AppointmentStats {
    date: Date!
    total_appointments: Int!
    scheduled_appointments: Int!
    confirmed_appointments: Int!
    completed_appointments: Int!
    cancelled_appointments: Int!
    no_show_appointments: Int!
    average_wait_time: Float # minutes
    average_consultation_time: Float # minutes
    revenue: Float!
    occupancy_rate: Float # percentage
  }

  # Daily Schedule
  type DailySchedule {
    date: Date!
    doctor_id: DoctorID!
    appointments: [Appointment!]!
    available_slots: [AppointmentSlot!]!
    total_slots: Int!
    booked_slots: Int!
    available_slots_count: Int!
    working_hours: WorkingHours!
  }

  type WorkingHours {
    start_time: Time!
    end_time: Time!
    break_start_time: Time
    break_end_time: Time
    is_working_day: Boolean!
  }

  # Connection types
  type AppointmentConnection {
    edges: [AppointmentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AppointmentEdge {
    node: Appointment!
    cursor: String!
  }

  # Input Types
  input AppointmentFilters {
    doctor_id: DoctorID
    patient_id: PatientID
    department_id: UUID
    status: AppointmentStatus
    type: AppointmentType
    priority: AppointmentPriority
    payment_status: PaymentStatus
    date_from: Date
    date_to: Date
    time_from: Time
    time_to: Time
    room: String
  }

  input CreateAppointmentInput {
    doctor_id: DoctorID!
    patient_id: PatientID!
    scheduled_date: Date!
    scheduled_time: Time!
    duration: Int = 30
    type: AppointmentType = CONSULTATION
    priority: AppointmentPriority = NORMAL
    reason: String
    notes: String
    symptoms: [String!]
    room_id: UUID
  }

  input UpdateAppointmentInput {
    scheduled_date: Date
    scheduled_time: Time
    duration: Int
    type: AppointmentType
    priority: AppointmentPriority
    reason: String
    notes: String
    symptoms: [String!]
    room_id: UUID
    status: AppointmentStatus
  }

  input RescheduleAppointmentInput {
    appointment_id: AppointmentID!
    new_date: Date!
    new_time: Time!
    reason: String
  }

  input CancelAppointmentInput {
    appointment_id: AppointmentID!
    reason: String!
    refund_requested: Boolean = false
  }

  input CheckInInput {
    appointment_id: AppointmentID!
    actual_arrival_time: DateTime
    symptoms: [String!]
    notes: String
  }

  # Queries
  extend type Query {
    # Single appointment queries
    appointment(id: UUID, appointment_id: AppointmentID): Appointment

    # Multiple appointments queries
    appointments(
      filters: AppointmentFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "scheduled_date_time"
      sortOrder: String = "ASC"
    ): AppointmentConnection!

    # Today's appointments
    todayAppointments(
      doctor_id: DoctorID
      department_id: UUID
      status: AppointmentStatus
    ): [Appointment!]!

    # Upcoming appointments
    upcomingAppointments(
      doctor_id: DoctorID
      patient_id: PatientID
      days: Int = 7
      limit: Int = 20
    ): [Appointment!]!

    # Available slots
    availableSlots(
      doctor_id: DoctorID!
      date: Date!
      duration: Int = 30
    ): [AppointmentSlot!]!

    # Doctor's daily schedule
    doctorDailySchedule(doctor_id: DoctorID!, date: Date!): DailySchedule!

    # Department appointments
    departmentAppointments(
      department_id: UUID!
      date: Date
      status: AppointmentStatus
      limit: Int = 50
    ): [Appointment!]!

    # Appointment statistics
    appointmentStats(
      date: Date
      doctor_id: DoctorID
      department_id: UUID
    ): AppointmentStats!

    # Patient appointment history
    patientAppointmentHistory(
      patient_id: PatientID!
      limit: Int = 20
      offset: Int = 0
    ): AppointmentConnection!

    # Doctor appointment history
    doctorAppointmentHistory(
      doctor_id: DoctorID!
      date_from: Date
      date_to: Date
      limit: Int = 20
      offset: Int = 0
    ): AppointmentConnection!

    # Conflicting appointments
    conflictingAppointments(
      doctor_id: DoctorID!
      date: Date!
      start_time: Time!
      end_time: Time!
    ): [Appointment!]!

    # Waiting queue
    waitingQueue(
      doctor_id: DoctorID
      department_id: UUID
      date: Date
    ): [Appointment!]!
  }

  # Mutations
  extend type Mutation {
    # Appointment management
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: UUID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: UUID!): Boolean!

    # Appointment status changes
    confirmAppointment(id: UUID!): Appointment!
    rescheduleAppointment(input: RescheduleAppointmentInput!): Appointment!
    cancelAppointment(input: CancelAppointmentInput!): Appointment!

    # Check-in process
    checkInAppointment(id: UUID!): Appointment!
    startAppointment(id: UUID!): Appointment!
    completeAppointment(id: UUID!, notes: String): Appointment!
    markNoShow(id: UUID!, reason: String): Appointment!

    # Bulk operations
    bulkRescheduleAppointments(
      appointment_ids: [UUID!]!
      new_date: Date!
      reason: String
    ): [Appointment!]!

    bulkCancelAppointments(
      appointment_ids: [UUID!]!
      reason: String!
    ): [Appointment!]!

    # Emergency appointment
    createEmergencyAppointment(
      doctor_id: DoctorID!
      patient_id: PatientID!
      reason: String!
      priority: AppointmentPriority = EMERGENCY
    ): Appointment!

    # Follow-up appointment
    scheduleFollowUp(
      parent_appointment_id: UUID!
      scheduled_date: Date!
      scheduled_time: Time!
      reason: String
    ): Appointment!
  }

  # Subscriptions
  extend type Subscription {
    # Appointment updates
    appointmentUpdated(appointment_id: AppointmentID): Appointment!
    appointmentStatusChanged(appointment_id: AppointmentID): Appointment!

    # Doctor appointments
    doctorAppointmentUpdated(doctor_id: DoctorID!): Appointment!
    doctorScheduleChanged(doctor_id: DoctorID!): DailySchedule!

    # Patient appointments
    patientAppointmentUpdated(patient_id: PatientID!): Appointment!

    # Department appointments
    departmentAppointmentUpdated(department_id: UUID!): Appointment!

    # Real-time queue updates
    waitingQueueUpdated(doctor_id: DoctorID): [Appointment!]!

    # New appointments
    newAppointmentCreated(doctor_id: DoctorID): Appointment!

    # Appointment reminders
    appointmentReminder(patient_id: PatientID): Appointment!
  }
`;

export default appointmentTypeDefs;
