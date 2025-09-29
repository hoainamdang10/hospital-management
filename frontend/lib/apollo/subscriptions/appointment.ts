import { gql } from "@apollo/client";

// Subscription for appointment updates
export const APPOINTMENT_UPDATED = gql`
  subscription AppointmentUpdated($appointmentId: String) {
    appointmentUpdated(appointmentId: $appointmentId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      notes
      createdAt
      updatedAt
      doctor {
        id
        doctorId
        fullName
        specialization
        department {
          id
          name
        }
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
  subscription AppointmentStatusChanged($appointmentId: String) {
    appointmentStatusChanged(appointmentId: $appointmentId) {
      id
      appointmentId
      status
      updatedAt
      doctor {
        id
        doctorId
        fullName
      }
      patient {
        id
        patientId
        fullName
      }
    }
  }
`;

// Subscription for doctor's appointments
export const DOCTOR_APPOINTMENT_UPDATED = gql`
  subscription DoctorAppointmentUpdated($doctorId: String!) {
    doctorAppointmentUpdated(doctorId: $doctorId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      notes
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

// Subscription for patient's appointments
export const PATIENT_APPOINTMENT_UPDATED = gql`
  subscription PatientAppointmentUpdated($patientId: String!) {
    patientAppointmentUpdated(patientId: $patientId) {
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
        specialization
        department {
          id
          name
        }
      }
    }
  }
`;

// Subscription for new appointments created for a doctor
export const NEW_APPOINTMENT_CREATED = gql`
  subscription NewAppointmentCreated($doctorId: String) {
    newAppointmentCreated(doctorId: $doctorId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      notes
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

// Subscription for waiting queue updates
export const WAITING_QUEUE_UPDATED = gql`
  subscription WaitingQueueUpdated($doctorId: String) {
    waitingQueueUpdated(doctorId: $doctorId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      status
      queuePosition
      estimatedWaitTime
      patient {
        id
        patientId
        fullName
        phoneNumber
      }
    }
  }
`;

// Subscription for appointment reminders
export const APPOINTMENT_REMINDER = gql`
  subscription AppointmentReminder($patientId: String!) {
    appointmentReminder(patientId: $patientId) {
      id
      appointmentId
      scheduledDate
      scheduledTime
      reminderType
      doctor {
        id
        doctorId
        fullName
        department {
          id
          name
        }
      }
    }
  }
`;
