"use client";

import { useQuery, useSubscription } from "@apollo/client";
import { GET_DOCTOR_DASHBOARD, APPOINTMENT_UPDATED } from "../queries/doctor";
import type { DoctorDashboard } from "../types/generated";

interface UseDoctorDashboardOptions {
  doctorId: string;
  pollInterval?: number;
  skip?: boolean;
}

interface UseDoctorDashboardResult {
  dashboard: DoctorDashboard | null;
  loading: boolean;
  error: any;
  refetch: () => void;
}

export function useDoctorDashboard({
  doctorId,
  pollInterval = 30000, // Poll every 30 seconds
  skip = false,
}: UseDoctorDashboardOptions): UseDoctorDashboardResult {
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    pollInterval,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to real-time appointment updates
  useSubscription(APPOINTMENT_UPDATED, {
    variables: { doctorId },
    skip,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData.data?.appointmentUpdated) {
        // Refetch dashboard data when appointments are updated
        refetch();
      }
    },
  });

  return {
    dashboard: data?.doctorDashboard || null,
    loading,
    error,
    refetch,
  };
}

// Hook for doctor statistics only
export function useDoctorStats(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    stats: data?.doctorDashboard?.appointmentStats || null,
    loading,
    error,
    refetch,
  };
}

// Hook for today's appointments
export function useTodayAppointments(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    appointments: data?.doctorDashboard?.todayAppointments || [],
    loading,
    error,
    refetch,
  };
}

// Hook for upcoming appointments
export function useUpcomingAppointments(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    appointments: data?.doctorDashboard?.upcomingAppointments || [],
    loading,
    error,
    refetch,
  };
}

// Hook for recent patients
export function useRecentPatients(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    patients: data?.doctorDashboard?.recentPatients || [],
    loading,
    error,
    refetch,
  };
}

// Hook for doctor schedule
export function useDoctorSchedule(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    schedule: data?.doctorDashboard?.schedule || [],
    loading,
    error,
    refetch,
  };
}

// Hook for recent reviews
export function useRecentReviews(doctorId: string, skip = false) {
  const { data, loading, error, refetch } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { doctorId },
    skip,
    errorPolicy: "all",
  });

  return {
    reviews: data?.doctorDashboard?.recentReviews || [],
    loading,
    error,
    refetch,
  };
}
