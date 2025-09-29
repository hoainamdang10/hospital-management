import { gql } from "@apollo/client";

// Fragment for Doctor basic info
export const DOCTOR_BASIC_FRAGMENT = gql`
  fragment DoctorBasic on Doctor {
    id
    doctorId
    fullName
    email
    phoneNumber
    specialization
    licenseNumber
    yearsOfExperience
    profilePicture
    averageRating
    totalPatients
    upcomingAppointments
  }
`;

// Fragment for Doctor full info
export const DOCTOR_FULL_FRAGMENT = gql`
  fragment DoctorFull on Doctor {
    ...DoctorBasic
    department {
      id
      name
      description
    }
    schedule {
      id
      dayOfWeek
      startTime
      endTime
      is_active
    }
    experiences {
      id
      hospitalName
      position
      startDate
      endDate
      description
    }
  }
  ${DOCTOR_BASIC_FRAGMENT}
`;

// Query to get doctor by ID
export const GET_DOCTOR = gql`
  query GetDoctor($id: ID, $doctorId: String) {
    doctor(id: $id, doctorId: $doctorId) {
      ...DoctorFull
    }
  }
  ${DOCTOR_FULL_FRAGMENT}
`;

// Query to get doctors list
export const GET_DOCTORS = gql`
  query GetDoctors(
    $search: String
    $departmentId: String
    $specialization: String
    $limit: Int = 20
    $offset: Int = 0
  ) {
    doctors(
      search: $search
      departmentId: $departmentId
      specialization: $specialization
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          ...DoctorBasic
          department {
            id
            name
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${DOCTOR_BASIC_FRAGMENT}
`;

// Query for Doctor Dashboard
export const GET_DOCTOR_DASHBOARD = gql`
  query GetDoctorDashboard($doctorId: String!) {
    doctorDashboard(doctorId: $doctorId) {
      doctor {
        ...DoctorFull
      }
      todayAppointments {
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
      upcomingAppointments {
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
      recentPatients {
        id
        patientId
        fullName
        phoneNumber
        email
        lastVisit
        totalAppointments
      }
      appointmentStats {
        total
        today
        thisWeek
        thisMonth
        completed
        cancelled
        averageRating
      }
      schedule {
        id
        dayOfWeek
        startTime
        endTime
        is_active
      }
      recentReviews {
        id
        rating
        comment
        created_at
        patient {
          id
          patientId
          fullName
        }
      }
    }
  }
  ${DOCTOR_FULL_FRAGMENT}
`;

// Query to get doctor appointments
export const GET_DOCTOR_APPOINTMENTS = gql`
  query GetDoctorAppointments(
    $doctorId: String!
    $status: AppointmentStatus
    $dateFrom: Date
    $dateTo: Date
    $limit: Int = 20
    $offset: Int = 0
  ) {
    appointments(
      doctorId: $doctorId
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          appointmentId
          scheduledDate
          scheduledTime
          status
          notes
          duration
          isUpcoming
          canCancel
          patient {
            id
            patientId
            fullName
            phoneNumber
            email
            dateOfBirth
            gender
          }
          medicalRecord {
            id
            diagnosis
            treatment
            notes
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

// Query to get doctor reviews
export const GET_DOCTOR_REVIEWS = gql`
  query GetDoctorReviews(
    $doctorId: String!
    $limit: Int = 10
    $offset: Int = 0
  ) {
    doctor(doctorId: $doctorId) {
      id
      reviews(limit: $limit, offset: $offset) {
        edges {
          node {
            id
            rating
            comment
            created_at
            patient {
              id
              patientId
              fullName
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  }
`;

// Query to get doctor statistics
export const GET_DOCTOR_STATS = gql`
  query GetDoctorStats($doctorId: String!) {
    doctor(doctorId: $doctorId) {
      id
      averageRating
      totalPatients
      upcomingAppointments
      appointments(limit: 1) {
        totalCount
      }
    }
  }
`;
