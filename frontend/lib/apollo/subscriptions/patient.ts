import { gql } from "@apollo/client";

// Subscription for patient status changes
export const PATIENT_STATUS_CHANGED = gql`
  subscription PatientStatusChanged($patientId: String) {
    patientStatusChanged(patientId: $patientId) {
      id
      patientId
      fullName
      phoneNumber
      email
      status
      isActive
      lastVisit
      totalAppointments
      emergencyContact {
        name
        relationship
        phoneNumber
      }
    }
  }
`;

// Subscription for patient updates
export const PATIENT_UPDATED = gql`
  subscription PatientUpdated($patientId: String) {
    patientUpdated(patientId: $patientId) {
      id
      patientId
      fullName
      phoneNumber
      email
      dateOfBirth
      gender
      address
      updatedAt
      profile {
        id
        fullName
        email
        phoneNumber
      }
    }
  }
`;

// Subscription for patient medical record additions
export const PATIENT_MEDICAL_RECORD_ADDED = gql`
  subscription PatientMedicalRecordAdded($patientId: String!) {
    patientMedicalRecordAdded(patientId: $patientId) {
      id
      recordId
      diagnosis
      treatment
      notes
      createdAt
      doctor {
        id
        doctorId
        fullName
        specialization
      }
      appointment {
        id
        appointmentId
        scheduledDate
      }
    }
  }
`;

// Subscription for patient prescription additions
export const PATIENT_PRESCRIPTION_ADDED = gql`
  subscription PatientPrescriptionAdded($patientId: String!) {
    patientPrescriptionAdded(patientId: $patientId) {
      id
      prescriptionId
      medications {
        name
        dosage
        frequency
        duration
        instructions
      }
      notes
      createdAt
      doctor {
        id
        doctorId
        fullName
      }
      appointment {
        id
        appointmentId
        scheduledDate
      }
    }
  }
`;

// Subscription for patient vital signs updates
export const PATIENT_VITAL_SIGNS_UPDATED = gql`
  subscription PatientVitalSignsUpdated($patientId: String!) {
    patientVitalSignsUpdated(patientId: $patientId) {
      id
      patientId
      bloodPressure {
        systolic
        diastolic
      }
      heartRate
      temperature
      weight
      height
      oxygenSaturation
      recordedAt
      recordedBy {
        id
        fullName
        role
      }
    }
  }
`;

// Subscription for patient lab results
export const PATIENT_LAB_RESULT_ADDED = gql`
  subscription PatientLabResultAdded($patientId: String!) {
    patientLabResultAdded(patientId: $patientId) {
      id
      testName
      testType
      results
      normalRange
      status
      notes
      testDate
      reportedAt
      doctor {
        id
        doctorId
        fullName
      }
      technician {
        id
        fullName
      }
    }
  }
`;

// Subscription for patient notifications
export const PATIENT_NOTIFICATION = gql`
  subscription PatientNotification($patientId: String!) {
    patientNotification(patientId: $patientId) {
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

// Subscription for patient queue status
export const PATIENT_QUEUE_STATUS = gql`
  subscription PatientQueueStatus($patientId: String!) {
    patientQueueStatus(patientId: $patientId) {
      patientId
      appointmentId
      queuePosition
      estimatedWaitTime
      currentStatus
      doctor {
        id
        doctorId
        fullName
      }
      department {
        id
        name
      }
    }
  }
`;
