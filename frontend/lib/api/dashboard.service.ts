/**
 * Dashboard Service
 * API calls for patient dashboard statistics and data (no Clinical EMR)
 */

import { appointmentsService } from './appointments.service';
import { billingService } from '@/modules/billing/services/billing.service';
import { patientService } from './patient.service';

export interface DashboardStats {
  upcomingConfirmed7DaysCount: number;
  pendingPaymentsCount: number;
  recentCompletedOrCancelledCount: number;
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
 * Uses Appointments + Billing + Patient Registry
 */
export async function getPatientDashboardStats(
  patientId: string,
  options?: { billingIdentifier?: string }
): Promise<DashboardStats> {
  try {
    const billingIdentifier = options?.billingIdentifier || patientId;
    const [
      confirmedApts,
      scheduledApts,
      completedApts,
      cancelledApts,
      billingSummary,
      profile,
      insurance,
      contacts,
    ] = await Promise.all([
      appointmentsService
        .getPatientAppointments(patientId, {
          status: 'CONFIRMED',
          page: 1,
          pageSize: 100,
        })
        .catch(() => ({ success: true, appointments: [] })),
      appointmentsService
        .getPatientAppointments(patientId, {
          status: 'SCHEDULED',
          page: 1,
          pageSize: 100,
        })
        .catch(() => ({ success: true, appointments: [] })),
      appointmentsService
        .getPatientAppointments(patientId, {
          status: 'COMPLETED',
          page: 1,
          pageSize: 100,
        })
        .catch(() => ({ success: true, appointments: [] })),
      appointmentsService
        .getPatientAppointments(patientId, {
          status: 'CANCELLED',
          page: 1,
          pageSize: 100,
        })
        .catch(() => ({ success: true, appointments: [] })),
      billingService.getPatientBillingSummary(billingIdentifier).catch(() => ({
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        invoiceCount: 0,
        paidInvoiceCount: 0,
        pendingInvoiceCount: 0,
      })),
      patientService.getPatientProfile(patientId).catch(() => null),
      patientService.getInsurance(patientId).catch(() => ({ insuranceInfo: null })),
      patientService.getEmergencyContacts(patientId).catch(() => ({ contacts: [] })),
    ]);

    const today = new Date();
    const sevenDaysAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingConfirmed7DaysCount = [
      ...((confirmedApts as any).appointments || []),
      ...((scheduledApts as any).appointments || []),
    ].filter((apt: any) => {
      const dateStr = apt.appointmentDate || apt.date;
      const timeStr = apt.appointmentTime || apt.time || '00:00:00';
      const dt = new Date(`${dateStr}T${timeStr}`);
      return dt >= today && dt <= sevenDaysAhead;
    }).length;

    const completedCount = ((completedApts as any).appointments || []).length;
    const cancelledCount = ((cancelledApts as any).appointments || []).length;
    const recentCompletedOrCancelledCount = completedCount + cancelledCount;

    const pendingPaymentsCount = (billingSummary as any).pendingInvoiceCount || 0;

    const profileCompletion = computeProfileCompletion(
      profile,
      (insurance as any).insuranceInfo,
      (contacts as any).contacts
    );

    return {
      upcomingConfirmed7DaysCount,
      pendingPaymentsCount,
      recentCompletedOrCancelledCount,
      profileCompletion,
    };
  } catch (error) {
    console.error('[DashboardService] Failed to fetch stats:', error);
    return {
      upcomingConfirmed7DaysCount: 0,
      pendingPaymentsCount: 0,
      recentCompletedOrCancelledCount: 0,
      profileCompletion: 0,
    };
  }
}

/**
 * Calculate profile completion percentage
 * Based on filled fields in patient profile
 */
export function computeProfileCompletion(profile: any, insurance: any, contacts: any[]): number {
  if (!profile) return 0;

  const fields = [
    profile.firstName,
    profile.lastName,
    profile.dateOfBirth,
    profile.gender,
    profile.phoneNumber,
    profile.email,
    profile.address,
  ];

  const baseFilled = fields.filter((f) => f && f.toString().trim() !== '').length;
  const baseTotal = fields.length;

  const hasInsurance = !!insurance;
  const hasEmergencyContact = Array.isArray(contacts) && contacts.length > 0;

  // Weight: base info 70%, insurance 15%, emergency contact 15%
  const baseScore = Math.round((baseFilled / baseTotal) * 70);
  const insuranceScore = hasInsurance ? 15 : 0;
  const contactScore = hasEmergencyContact ? 15 : 0;

  return Math.min(100, baseScore + insuranceScore + contactScore);
}

/**
 * Format stats for display
 */
export function formatDashboardStats(stats: DashboardStats): QuickStat[] {
  return [
    {
      title: 'Lịch hẹn sắp tới (7 ngày)',
      value: stats.upcomingConfirmed7DaysCount.toString(),
      icon: 'Calendar',
      color: 'blue',
    },
    {
      title: 'Chờ thanh toán',
      value: stats.pendingPaymentsCount.toString(),
      icon: 'CreditCard',
      color: 'orange',
    },
    {
      title: 'Đã khám/Hủy gần đây',
      value: stats.recentCompletedOrCancelledCount.toString(),
      icon: 'FileText',
      color: 'green',
    },
    {
      title: 'Hồ sơ hoàn chỉnh',
      value: `${stats.profileCompletion}%`,
      icon: 'User',
      color: 'purple',
    },
  ];
}
