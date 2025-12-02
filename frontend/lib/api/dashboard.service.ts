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
      // FIX: Use patientId (PAT-XXXXXX-XXX) instead of UUID for billing
      // Backend billing service stores patient_id as string format in invoices table
      billingService.getPatientBillingSummary(patientId).catch(async (error) => {
        console.warn('[DashboardService] Billing API failed with patientId, trying with UUID...', error.message);
        // Fallback: Try with UUID if string patient_id fails
        if (options?.billingIdentifier && options.billingIdentifier !== patientId) {
          try {
            return await billingService.getPatientBillingSummary(options.billingIdentifier);
          } catch (fallbackError) {
            console.error('[DashboardService] Billing API failed with both IDs:', fallbackError);
          }
        }
        // Return empty summary if both fail
        return {
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          invoiceCount: 0,
          paidInvoiceCount: 0,
          pendingInvoiceCount: 0,
        };
      }),
      patientService.getPatientProfile(patientId).catch(() => null),
      patientService.getInsurance(patientId).catch(() => ({ insuranceInfo: null })),
      patientService.getEmergencyContacts(patientId).catch(() => ({ contacts: [] })),
    ]);

    // Get current time for accurate filtering
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0); // Start of today

    const sevenDaysAhead = new Date(today);
    sevenDaysAhead.setDate(today.getDate() + 7);
    sevenDaysAhead.setHours(23, 59, 59, 999); // End of the 7th day

    // Helper function to parse appointment date/time properly
    const parseAppointmentDateTime = (apt: any): Date | null => {
      try {
        const dateStr = apt.appointmentDate || apt.appointment_date || apt.date;
        const timeStr = apt.appointmentTime || apt.appointment_time || apt.time || '00:00:00';

        if (!dateStr) return null;

        // Handle different date formats
        // Format: YYYY-MM-DD or ISO string
        let dateOnly = dateStr;
        if (dateStr.includes('T')) {
          dateOnly = dateStr.split('T')[0];
        }

        // Combine date and time, parse as local time (Vietnam timezone)
        const dateTimeStr = `${dateOnly}T${timeStr}`;
        const dt = new Date(dateTimeStr);

        // Check if date is valid
        if (isNaN(dt.getTime())) {
          console.warn('[DashboardService] Invalid date for appointment:', apt.appointmentId, dateTimeStr);
          return null;
        }

        return dt;
      } catch (error) {
        console.error('[DashboardService] Error parsing appointment date:', error, apt);
        return null;
      }
    };

    // Count upcoming appointments (including today through next 7 days)
    // Explicitly filter by status to ensure accuracy even if backend ignores status param
    const upcomingConfirmed7DaysCount = [
      ...((confirmedApts as any).appointments || []).filter(
        (a: any) => a.status === 'CONFIRMED'
      ),
      ...((scheduledApts as any).appointments || []).filter(
        (a: any) => a.status === 'SCHEDULED'
      ),
    ].filter((apt: any) => {
      const dt = parseAppointmentDateTime(apt);
      if (!dt) return false;

      // Include from START OF TODAY to END OF 7 days ahead
      // This ensures we count all appointments from today onwards
      return dt >= today && dt <= sevenDaysAhead;
    }).length;

    console.log('[DashboardService] Upcoming appointments count:', upcomingConfirmed7DaysCount, {
      today: today.toISOString(),
      sevenDaysAhead: sevenDaysAhead.toISOString(),
      confirmedCount: ((confirmedApts as any).appointments || []).length,
      scheduledCount: ((scheduledApts as any).appointments || []).length,
    });

    // Count RECENTLY completed/cancelled (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const completedCount = ((completedApts as any).appointments || [])
      .filter((a: any) => a.status === 'COMPLETED')
      .filter((apt: any) => {
        const dateStr = apt.appointmentDate || apt.date;
        const timeStr = apt.appointmentTime || apt.time || '00:00:00';
        const dt = new Date(`${dateStr}T${timeStr}`);
        return dt >= thirtyDaysAgo && dt <= now;
      }).length;

    const cancelledCount = ((cancelledApts as any).appointments || [])
      .filter((a: any) => a.status === 'CANCELLED')
      .filter((apt: any) => {
        const dateStr = apt.appointmentDate || apt.date;
        const timeStr = apt.appointmentTime || apt.time || '00:00:00';
        const dt = new Date(`${dateStr}T${timeStr}`);
        return dt >= thirtyDaysAgo && dt <= now;
      }).length;

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
