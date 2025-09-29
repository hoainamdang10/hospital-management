"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorTypeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
/**
 * GraphQL Schema for Doctor entities
 * Based on OpenAPI schemas from Phase 2
 * Supports Vietnamese language and hospital management requirements
 */
exports.doctorTypeDefs = (0, graphql_tag_1.gql) `
  # Doctor-specific enums only (common scalars defined in base schema)
  enum DoctorStatus {
    ACTIVE
    INACTIVE
    ON_LEAVE
    SUSPENDED
  }

  # Core Doctor Type
  type Doctor {
    # Basic Information
    id: UUID!
    doctor_id: DoctorID!
    profile_id: UUID!
    full_name: String!
    email: String!
    phone_number: PhoneNumber

    # Professional Information
    specialization: String!
    license_number: LicenseNumber!
    years_of_experience: Int!
    consultation_fee: Float
    bio: String
    photo_url: String

    # Personal Information
    gender: Gender
    date_of_birth: Date
    address: String

    # Status
    is_active: Boolean!
    status: DoctorStatus!

    # Timestamps
    created_at: DateTime!
    updated_at: DateTime!

    # Relationships
    department: Department
    experiences: [DoctorExperience!]!
    schedule: [DoctorSchedule!]!
    appointments(
      status: AppointmentStatus
      dateFrom: Date
      dateTo: Date
      limit: Int = 10
      offset: Int = 0
    ): AppointmentConnection!
    reviews(limit: Int = 10, offset: Int = 0): ReviewConnection!

    # Computed Fields
    average_rating: Float
    total_patients: Int
    total_appointments: Int
    upcoming_appointments: Int
    completed_appointments: Int
    available_today: Boolean!
    next_available_slot: DateTime
  }

  # Doctor Experience
  type DoctorExperience {
    id: UUID!
    doctor_id: DoctorID!
    hospital_name: String!
    position: String!
    start_date: Date!
    end_date: Date
    description: String
    is_current: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
  }

  # Doctor Review (mapped to doctor_reviews table)
  type DoctorReview {
    id: UUID! # maps to review_id
    doctor_id: DoctorID! # maps to doctor_id
    patient_id: PatientID! # maps to patient_id
    appointment_id: UUID # maps to appointment_id
    # Review Content
    rating: Int! # maps to rating (1-5)
    comment: String # maps to comment
    # Review Details
    service_quality: Int # maps to service_quality
    communication: Int # maps to communication
    punctuality: Int # maps to punctuality
    facilities: Int # maps to facilities
    # Status
    is_verified: Boolean! # maps to is_verified
    is_anonymous: Boolean! # maps to is_anonymous
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    doctor: Doctor!
    patient: Patient!
    appointment: Appointment
  }

  # Enhanced Doctor Schedule (mapped to doctor_work_schedules_enhanced table)
  type DoctorSchedule {
    id: UUID! # maps to schedule_id
    doctor_id: DoctorID! # maps to doctor_id
    template_id: UUID # maps to template_id
    # Schedule Details
    day_of_week: Int! # maps to day_of_week (0=Sunday, 1=Monday, etc.)
    start_time: String! # maps to start_time (HH:MM format)
    end_time: String! # maps to end_time (HH:MM format)
    # Enhanced Break System
    break_periods: [BreakPeriod!]! # maps to break_periods JSONB
    # Appointment Configuration
    slot_duration: Int! # maps to slot_duration (minutes)
    buffer_time: Int # maps to buffer_time (minutes between appointments)
    max_appointments: Int # maps to max_appointments
    # Availability Settings
    is_available: Boolean! # maps to is_available
    availability_type: ScheduleAvailabilityType! # maps to availability_type
    # Department Rules
    department_rules: JSON # maps to department_rules JSONB
    # Effective Period
    effective_from: Date # maps to effective_from
    effective_to: Date # maps to effective_to
    # Status
    is_active: Boolean! # maps to is_active
    # Relationships
    template: DoctorScheduleTemplate # maps to template_id
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    doctor: Doctor!
  }

  # Room Type (mapped to rooms table)
  type Room {
    id: UUID! # maps to room_id
    room_number: String! # maps to room_number
    room_type: String! # maps to room_type
    department_id: String # maps to department_id
    # Capacity
    capacity: Int! # maps to capacity
    current_occupancy: Int! # maps to current_occupancy
    # Details
    floor_number: Int # maps to floor_number
    amenities: [String!] # maps to amenities
    daily_rate: Float # maps to daily_rate
    status: String! # maps to status
    description: String # maps to description
    # Equipment
    equipment_ids: [String!] # maps to equipment_ids
    location: String # maps to location (jsonb)
    notes: String # maps to notes
    # Status
    is_active: Boolean! # maps to is_active
    # Timestamps
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
    # Relationships
    department: Department
  }

  # Doctor Statistics
  type DoctorStats {
    doctor_id: DoctorID!
    total_appointments: Int!
    completed_appointments: Int!
    cancelled_appointments: Int!
    total_patients: Int!
    average_rating: Float
    total_reviews: Int!
    upcoming_appointments: Int!
    today_appointments: Int!
    this_week_appointments: Int!
    this_month_appointments: Int!
    revenue: DoctorRevenue
    performance: DoctorPerformance
  }

  type DoctorRevenue {
    today: Float!
    this_week: Float!
    this_month: Float!
    this_year: Float!
    currency: String! # VND
  }

  type DoctorPerformance {
    punctuality_score: Float # 0-100
    patient_satisfaction_score: Float # 0-100
    appointment_completion_rate: Float # 0-100
    average_consultation_time: Int # minutes
  }

  # Connection types for pagination
  type DoctorConnection {
    edges: [DoctorEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type DoctorEdge {
    node: Doctor!
    cursor: String!
  }

  type ReviewConnection {
    edges: [ReviewEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReviewEdge {
    node: DoctorReview!
    cursor: String!
  }

  # Input Types
  input DoctorFilters {
    search: String
    specialization: String
    department_id: UUID
    status: DoctorStatus
    is_active: Boolean
    min_rating: Float
    max_consultation_fee: Float
    available_today: Boolean
    gender: Gender
    min_experience: Int
    max_experience: Int
  }

  input CreateDoctorInput {
    full_name: String!
    email: String!
    phone_number: PhoneNumber!
    specialization: String!
    license_number: LicenseNumber!
    years_of_experience: Int!
    department_id: UUID!
    gender: Gender
    date_of_birth: Date
    address: String
    bio: String
    consultation_fee: Float
  }

  input UpdateDoctorInput {
    full_name: String
    phone_number: PhoneNumber
    specialization: String
    years_of_experience: Int
    department_id: UUID
    address: String
    bio: String
    consultation_fee: Float
    is_active: Boolean
    status: DoctorStatus
  }

  input CreateDoctorExperienceInput {
    doctor_id: DoctorID!
    hospital_name: String!
    position: String!
    start_date: Date!
    end_date: Date
    description: String
    is_current: Boolean = false
  }

  input UpdateDoctorExperienceInput {
    hospital_name: String
    position: String
    start_date: Date
    end_date: Date
    description: String
    is_current: Boolean
  }

  input CreateDoctorScheduleInput {
    doctor_id: DoctorID!
    day_of_week: Int!
    start_time: String!
    end_time: String!
    is_available: Boolean = true
    max_appointments: Int
    slot_duration: Int = 30
    break_start_time: String
    break_end_time: String
    room_id: UUID
  }

  input UpdateDoctorScheduleInput {
    day_of_week: Int
    start_time: String
    end_time: String
    is_available: Boolean
    max_appointments: Int
    slot_duration: Int
    break_start_time: String
    break_end_time: String
    room_id: UUID
  }

  # Enhanced Schedule Input Types
  input CreateDoctorScheduleEnhancedInput {
    doctor_id: DoctorID!
    template_id: UUID
    day_of_week: Int!
    start_time: String!
    end_time: String!
    break_periods: [BreakPeriodInput!]!
    slot_duration: Int = 30
    buffer_time: Int = 5
    max_appointments: Int = 16
    is_available: Boolean = true
    availability_type: ScheduleAvailabilityType = REGULAR
    department_rules: JSON
    effective_from: Date
    effective_to: Date
    is_active: Boolean = true
  }

  input UpdateDoctorScheduleEnhancedInput {
    template_id: UUID
    day_of_week: Int
    start_time: String
    end_time: String
    break_periods: [BreakPeriodInput!]
    slot_duration: Int
    buffer_time: Int
    max_appointments: Int
    is_available: Boolean
    availability_type: ScheduleAvailabilityType
    department_rules: JSON
    effective_from: Date
    effective_to: Date
    is_active: Boolean
  }

  input BreakPeriodInput {
    start_time: String!
    end_time: String!
    break_type: String!
  }

  input CreateScheduleTemplateInput {
    template_name: String!
    department_id: String
    description: String
    default_start_time: String!
    default_end_time: String!
    default_break_start: String
    default_break_end: String
    default_slot_duration: Int = 30
    default_buffer_time: Int = 5
    max_appointments_per_day: Int = 16
    working_days: [Int!]!
    is_active: Boolean = true
  }

  input UpdateScheduleTemplateInput {
    template_name: String
    description: String
    default_start_time: String
    default_end_time: String
    default_break_start: String
    default_break_end: String
    default_slot_duration: Int
    default_buffer_time: Int
    max_appointments_per_day: Int
    working_days: [Int!]
    is_active: Boolean
  }

  input CreateScheduleExceptionInput {
    doctor_id: DoctorID!
    exception_date: Date!
    exception_type: ScheduleExceptionType!
    is_available: Boolean = false
    reason: String
    override_start_time: String
    override_end_time: String
    override_break_periods: [BreakPeriodInput!]
    override_max_appointments: Int
  }

  input UpdateScheduleExceptionInput {
    exception_type: ScheduleExceptionType
    is_available: Boolean
    reason: String
    override_start_time: String
    override_end_time: String
    override_break_periods: [BreakPeriodInput!]
    override_max_appointments: Int
  }

  input CreateDoctorReviewInput {
    doctor_id: DoctorID!
    patient_id: PatientID!
    appointment_id: UUID

    # Review Content
    rating: Int! # 1-5 stars
    comment: String

    # Review Details
    service_quality: Int # 1-5 stars
    communication: Int # 1-5 stars
    punctuality: Int # 1-5 stars
    facilities: Int # 1-5 stars
    # Settings
    is_anonymous: Boolean = false
  }

  # Queries
  extend type Query {
    # Single doctor queries
    doctor(id: UUID, doctor_id: DoctorID): Doctor
    doctorByProfile(profile_id: UUID!): Doctor

    # Multiple doctors queries
    doctors(
      filters: DoctorFilters
      limit: Int = 20
      offset: Int = 0
      sortBy: String = "created_at"
      sortOrder: String = "DESC"
    ): DoctorConnection!

    # Search doctors
    searchDoctors(
      query: String!
      filters: DoctorFilters
      limit: Int = 20
      offset: Int = 0
    ): DoctorConnection!

    # Doctor availability
    doctorAvailability(doctor_id: DoctorID!, date: Date!): [AvailableSlot!]!

    # Doctor statistics
    doctorStats(doctor_id: DoctorID!): DoctorStats!

    # Department doctors
    departmentDoctors(
      department_id: UUID!
      limit: Int = 20
      offset: Int = 0
    ): DoctorConnection!

    # Available doctors
    availableDoctors(
      date: Date!
      time: String
      specialization: String
      limit: Int = 20
    ): [Doctor!]!

    # Doctor reviews
    doctorReviews(
      doctor_id: DoctorID!
      limit: Int = 10
      offset: Int = 0
    ): [DoctorReview!]!

    # Enhanced Doctor schedule queries
    doctorSchedule(doctor_id: DoctorID!, date: Date): [DoctorSchedule!]!
    doctorScheduleEnhanced(
      doctor_id: DoctorID!
      week_start_date: Date
    ): [DoctorSchedule!]!
    doctorScheduleTemplates(department_id: String): [DoctorScheduleTemplate!]!
    doctorScheduleExceptions(
      doctor_id: DoctorID!
      date_from: Date
      date_to: Date
    ): [DoctorScheduleException!]!
    doctorAppointmentSlots(
      doctor_id: DoctorID!
      date: Date!
    ): [DoctorAppointmentSlot!]!

    # Enhanced availability queries
    doctorWeeklyAvailability(doctor_id: DoctorID!, week_start_date: Date!): JSON
    doctorAvailabilityOptimized(
      doctor_id: DoctorID!
      start_date: Date
      end_date: Date
    ): JSON
    bulkDoctorAvailability(doctor_ids: [DoctorID!]!, date: Date!): JSON

    # Rooms
    room(id: UUID!): Room
    rooms(
      department_id: String
      room_type: String
      is_active: Boolean = true
      limit: Int = 20
    ): [Room!]!
  }

  # Mutations
  extend type Mutation {
    # Doctor management
    createDoctor(input: CreateDoctorInput!): Doctor!
    updateDoctor(id: UUID!, input: UpdateDoctorInput!): Doctor!
    deleteDoctor(id: UUID!): Boolean!
    activateDoctor(id: UUID!): Doctor!
    deactivateDoctor(id: UUID!): Doctor!

    # Doctor experience
    addDoctorExperience(input: CreateDoctorExperienceInput!): DoctorExperience!
    updateDoctorExperience(
      id: UUID!
      input: UpdateDoctorExperienceInput!
    ): DoctorExperience!
    deleteDoctorExperience(id: UUID!): Boolean!

    # Doctor schedule
    createDoctorSchedule(input: CreateDoctorScheduleInput!): DoctorSchedule!
    updateDoctorSchedule(
      id: UUID!
      input: UpdateDoctorScheduleInput!
    ): DoctorSchedule!
    deleteDoctorSchedule(id: UUID!): Boolean!

    # Enhanced Doctor schedule mutations
    createDoctorScheduleEnhanced(
      input: CreateDoctorScheduleEnhancedInput!
    ): DoctorSchedule!
    updateDoctorScheduleEnhanced(
      id: UUID!
      input: UpdateDoctorScheduleEnhancedInput!
    ): DoctorSchedule!
    deleteDoctorScheduleEnhanced(id: UUID!): Boolean!

    # Schedule template mutations
    createScheduleTemplate(
      input: CreateScheduleTemplateInput!
    ): DoctorScheduleTemplate!
    updateScheduleTemplate(
      id: UUID!
      input: UpdateScheduleTemplateInput!
    ): DoctorScheduleTemplate!

    # Schedule exception mutations
    createScheduleException(
      input: CreateScheduleExceptionInput!
    ): DoctorScheduleException!
    updateScheduleException(
      id: UUID!
      input: UpdateScheduleExceptionInput!
    ): DoctorScheduleException!
    deleteScheduleException(id: UUID!): Boolean!

    # Appointment slot mutations
    generateDoctorSlots(
      doctor_id: DoctorID!
      startDate: Date!
      endDate: Date!
    ): Int!
    blockAppointmentSlot(slotId: UUID!, reason: String!): DoctorAppointmentSlot!
    unblockAppointmentSlot(slotId: UUID!): DoctorAppointmentSlot!

    # Doctor reviews
    createDoctorReview(input: CreateDoctorReviewInput!): DoctorReview!
    updateDoctorReview(id: UUID!, rating: Int, comment: String): DoctorReview!
    deleteDoctorReview(id: UUID!): Boolean!
  }

  # Subscriptions
  extend type Subscription {
    # Doctor status changes
    doctorStatusChanged(doctor_id: DoctorID): Doctor!
    doctorAvailabilityChanged(doctor_id: DoctorID): Doctor!

    # Doctor schedule changes
    doctorScheduleUpdated(doctor_id: DoctorID): DoctorSchedule!

    # New reviews
    doctorReviewAdded(doctor_id: DoctorID): DoctorReview!
  }

  # Enhanced Schedule Types
  type DoctorScheduleTemplate {
    id: UUID! # maps to template_id
    templateName: String! # maps to template_name
    departmentId: String # maps to department_id
    description: String # maps to description
    defaultStartTime: String! # maps to default_start_time
    defaultEndTime: String! # maps to default_end_time
    defaultBreakStart: String # maps to default_break_start
    defaultBreakEnd: String # maps to default_break_end
    defaultSlotDuration: Int # maps to default_slot_duration
    defaultBufferTime: Int # maps to default_buffer_time
    maxAppointmentsPerDay: Int # maps to max_appointments_per_day
    workingDays: [Int!]! # maps to working_days array
    is_active: Boolean! # maps to is_active
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  type BreakPeriod {
    startTime: String! # HH:MM format
    endTime: String! # HH:MM format
    breakType: String! # lunch, snack, rest, etc.
  }

  type DoctorScheduleException {
    id: UUID! # maps to exception_id
    doctor_id: DoctorID! # maps to doctor_id
    exceptionDate: Date! # maps to exception_date
    exceptionType: ScheduleExceptionType! # maps to exception_type
    isAvailable: Boolean! # maps to is_available
    reason: String # maps to reason
    # Override fields for special schedules
    overrideStartTime: String # maps to override_start_time
    overrideEndTime: String # maps to override_end_time
    overrideBreakPeriods: [BreakPeriod!] # maps to override_break_periods
    overrideMaxAppointments: Int # maps to override_max_appointments
    approvedBy: UUID # maps to approved_by
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  type DoctorAppointmentSlot {
    id: UUID! # maps to slot_id
    doctor_id: DoctorID! # maps to doctor_id
    slotDate: Date! # maps to slot_date
    startTime: String! # maps to start_time
    endTime: String! # maps to end_time
    durationMinutes: Int! # maps to duration_minutes
    slotType: SlotType! # maps to slot_type
    isAvailable: Boolean! # maps to is_available
    isBlocked: Boolean! # maps to is_blocked
    blockReason: String # maps to block_reason
    maxBookings: Int! # maps to max_bookings
    currentBookings: Int! # maps to current_bookings
    generatedFromScheduleId: UUID # maps to generated_from_schedule_id
    generationTimestamp: DateTime # maps to generation_timestamp
    created_at: DateTime! # maps to created_at
    updated_at: DateTime! # maps to updated_at
  }

  # Enums for Enhanced Scheduling
  enum ScheduleAvailabilityType {
    REGULAR
    EMERGENCY
    CONSULTATION
    SURGERY
  }

  enum ScheduleExceptionType {
    HOLIDAY
    LEAVE
    SICK_LEAVE
    SPECIAL_SCHEDULE
    EMERGENCY_DUTY
  }

  enum SlotType {
    REGULAR
    EMERGENCY
    FOLLOW_UP
    CONSULTATION
  }

  # Available time slot
  type AvailableSlot {
    startTime: DateTime!
    endTime: DateTime!
    isAvailable: Boolean!
    appointment_id: UUID
    reason: String # If not available
    slotType: SlotType
    durationMinutes: Int
  }
`;
exports.default = exports.doctorTypeDefs;
//# sourceMappingURL=doctor.schema.js.map