import { gql } from "@apollo/client";
import { DOCTOR_FULL_FRAGMENT } from "../queries/doctor";

// Mutation to update doctor profile
export const UPDATE_DOCTOR_PROFILE = gql`
  mutation UpdateDoctorProfile($id: ID!, $input: UpdateDoctorInput!) {
    updateDoctorProfile(id: $id, input: $input) {
      ...DoctorFull
    }
  }
  ${DOCTOR_FULL_FRAGMENT}
`;

// Mutation to add doctor experience
export const ADD_DOCTOR_EXPERIENCE = gql`
  mutation AddDoctorExperience($doctorId: ID!, $input: AddExperienceInput!) {
    addDoctorExperience(doctorId: $doctorId, input: $input) {
      id
      hospitalName
      position
      startDate
      endDate
      description
    }
  }
`;

// Mutation to update doctor schedule
export const UPDATE_DOCTOR_SCHEDULE = gql`
  mutation UpdateDoctorSchedule($doctorId: ID!, $input: UpdateScheduleInput!) {
    updateDoctorSchedule(doctorId: $doctorId, input: $input) {
      id
      dayOfWeek
      startTime
      endTime
      isActive
    }
  }
`;

// Mutation to create appointment
export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
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

// Mutation to update appointment
export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
    updateAppointment(id: $id, input: $input) {
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

// Mutation to confirm appointment
export const CONFIRM_APPOINTMENT = gql`
  mutation ConfirmAppointment($id: ID!) {
    confirmAppointment(id: $id) {
      id
      appointmentId
      status
      scheduledDate
      scheduledTime
      patient {
        id
        patientId
        fullName
        phoneNumber
      }
    }
  }
`;

// Mutation to cancel appointment
export const CANCEL_APPOINTMENT = gql`
  mutation CancelAppointment($id: ID!, $reason: String) {
    cancelAppointment(id: $id, reason: $reason) {
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
