/**
 * Dashboard Service
 * API calls for patient dashboard statistics and data
 */

import { appointmentsClient } from './clients';
import { clinicalClient } from './clients';

export interface DashboardStats {
  upcomingAppointments: number;
  totalMedicalRecords: number;
  unpaidInvoices: number;
  profileCompletion: number;
}

export interface QuickStat {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

/**
 * Get dashboard statistics for patient
 */
export async function getPatientDashboardStats(patientId: string): Promise<DashboardStats> {
  try {
    // Fetch data from multiple services in parallel
    const [appointmentsData, medicalRecordsData] = await Promise.all([
      // Get upcoming appointments count
      appointmentsClient.get(`/api/v2/appointments/patients/${patientId}/appointments`, {
        params: {
          status: 'SCHEDULED',
          page: 1,
          pageSize: 100,
        },
      }).catch(() => ({ data: { data: { appointments: [] } } })),

      // Get medical records count
      clinicalClient.get(`/api/v2/clinical-emr/patients/${patientId}/medical-records`, {
        params: {
          page: 1,
          pageSize: 1,
        },
      }).catch(() => ({ data: { data: { total: 0 } } })),
    ]);

    // Count upcoming appointments (future dates only)
    const now = new Date();
    const upcomingAppointments = appointmentsData.data?.data?.appointments?.filter((apt: any) => {
      const aptDate = new Date(apt.appointmentDateTime);
      return aptDate > now;
    }).length || 0;

    const totalMedicalRecords = medicalRecordsData.data?.data?.total || 0;

    // Mock unpaid invoices and profile completion for now
    // TODO: Replace with real API calls when billing service is ready
    const unpaidInvoices = 0;
    const profileCompletion = 85;

    return {
      upcomingAppointments,
      totalMedicalRecords,
      unpaidInvoices,
      profileCompletion,
    };
  } catch (error) {
    console.error('[DashboardService] Failed to fetch stats:', error);
    
    // Return default values on error
    return {
      upcomingAppointments: 0,
      totalMedicalRecords: 0,
      unpaidInvoices: 0,
      profileCompletion: 0,
    };
  }
}

/**
 * Calculate profile completion percentage
 * Based on filled fields in patient profile
 */
export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  const fields = [
    profile.firstName,
    profile.lastName,
    profile.dateOfBirth,
    profile.gender,
    profile.phoneNumber,
    profile.email,
    profile.address,
    profile.bloodType,
    profile.emergencyContact?.name,
    profile.emergencyContact?.phone,
  ];

  const filledFields = fields.filter(field => field && field.toString().trim() !== '').length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * Format stats for display
 */
export function formatDashboardStats(stats: DashboardStats): QuickStat[] {
  return [
    {
      title: 'Lịch hẹn sắp tới',
      value: stats.upcomingAppointments.toString(),
      icon: 'Calendar',
      color: 'blue',
    },
    {
      title: 'Hồ sơ bệnh án',
      value: stats.totalMedicalRecords.toString(),
      icon: 'FileText',
      color: 'green',
    },
    {
      title: 'Hóa đơn chưa thanh toán',
      value: stats.unpaidInvoices.toString(),
      icon: 'CreditCard',
      color: 'orange',
    },
    {
      title: 'Hồ sơ hoàn chỉnh',
      value: `${stats.profileCompletion}%`,
      icon: 'User',
      color: 'purple',
    },
  ];
}
