// Apollo Client
export { apolloClient, clearApolloCache, refetchActiveQueries } from "./client";
export { ApolloProviderWrapper } from "./provider";

// Doctor Queries
export {
  DOCTOR_BASIC_FRAGMENT,
  DOCTOR_FULL_FRAGMENT,
  GET_DOCTOR,
  GET_DOCTORS,
  GET_DOCTOR_DASHBOARD,
  GET_DOCTOR_APPOINTMENTS,
  GET_DOCTOR_REVIEWS,
  GET_DOCTOR_STATS,
} from "./queries/doctor";

// Doctor Mutations
export {
  UPDATE_DOCTOR_PROFILE,
  ADD_DOCTOR_EXPERIENCE,
  UPDATE_DOCTOR_SCHEDULE,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  CONFIRM_APPOINTMENT,
  CANCEL_APPOINTMENT,
} from "./mutations/doctor";

// Doctor Subscriptions
export {
  APPOINTMENT_UPDATED,
  APPOINTMENT_STATUS_CHANGED,
  PATIENT_STATUS_CHANGED,
  DOCTOR_AVAILABILITY_CHANGED,
} from "./subscriptions/doctor";

// Hooks
export {
  useDoctorDashboard,
  useDoctorStats,
  useTodayAppointments,
  useUpcomingAppointments,
  useRecentPatients,
  useDoctorSchedule,
  useRecentReviews,
} from "./hooks/useDoctorDashboard";

export { useAppointmentMutations } from "./hooks/useAppointmentMutations";

// Types (will be generated from GraphQL schema)
export type {
  Doctor,
  Patient,
  Appointment,
  DoctorDashboard,
  AppointmentStats,
  WorkSchedule,
  WorkExperience,
  Review,
  AppointmentStatus,
  Gender,
} from "./types/generated";
