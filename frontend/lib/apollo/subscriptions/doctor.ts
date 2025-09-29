import { gql } from "@apollo/client";

// Subscription for appointment updates
export const APPOINTMENT_UPDATED = gql`
  subscription AppointmentUpdated($doctorId: String) {
    appointmentUpdated(doctorId: $doctorId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      notes
      doctor {
        id
        doctorId
        fullName
      }
      patient {
        id
        patientId
        fullName
        phoneNumber
        email
      }
    }
  }
`;

// Subscription for appointment status changes
export const APPOINTMENT_STATUS_CHANGED = gql`
  subscription AppointmentStatusChanged($appointmentId: String!) {
    appointmentStatusChanged(appointmentId: $appointmentId) {
      id
      appointmentId
      status
      scheduledDate
      scheduledTime
      notes
      patient {
        id
        patientId
        fullName
        phoneNumber
      }
    }
  }
`;

// Subscription for patient status changes
export const PATIENT_STATUS_CHANGED = gql`
  subscription PatientStatusChanged($patientId: String!) {
    patientStatusChanged(patientId: $patientId) {
      id
      patientId
      fullName
      phoneNumber
      email
      lastVisit
      totalAppointments
    }
  }
`;

// Subscription for doctor availability changes
export const DOCTOR_AVAILABILITY_CHANGED = gql`
  subscription DoctorAvailabilityChanged($doctorId: String!) {
    doctorAvailabilityChanged(doctorId: $doctorId) {
      id
      doctorId
      fullName
      isAvailable
      currentStatus
      nextAvailableSlot
      availableSlots {
        date
        startTime
        endTime
        isBooked
      }
      workingHours {
        dayOfWeek
        startTime
        endTime
        isActive
      }
    }
  }
`;

// Subscription for doctor status changes
export const DOCTOR_STATUS_CHANGED = gql`
  subscription DoctorStatusChanged($doctorId: String) {
    doctorStatusChanged(doctorId: $doctorId) {
      id
      doctorId
      fullName
      status
      isActive
      isAvailable
      currentStatus
      lastActiveAt
      department {
        id
        name
      }
    }
  }
`;

// Subscription for doctor schedule changes
export const DOCTOR_SCHEDULE_CHANGED = gql`
  subscription DoctorScheduleChanged($doctorId: String!) {
    doctorScheduleChanged(doctorId: $doctorId) {
      id
      doctorId
      date
      startTime
      endTime
      isAvailable
      maxPatients
      currentPatients
      breakTime {
        start
        end
      }
      appointments {
        id
        appointmentId
        scheduledTime
        status
        patient {
          id
          patientId
          fullName
        }
      }
    }
  }
`;

// Subscription for doctor notifications
export const DOCTOR_NOTIFICATION = gql`
  subscription DoctorNotification($doctorId: String!) {
    doctorNotification(doctorId: $doctorId) {
      id
      type
      title
      message
      priority
      isRead
      createdAt
      data
      relatedEntity {
        type
        id
      }
    }
  }
`;
