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
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const sevenDaysAhead = new Date(today);
    sevenDaysAhead.setDate(today.getDate() + 7);
    sevenDaysAhead.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const upcomingRange = {
      startDate: formatDate(today),
      endDate: formatDate(sevenDaysAhead),
    };
    const past30Range = {
      startDate: formatDate(thirtyDaysAgo),
      endDate: formatDate(today),
    };
    const PAGE_SIZE = 200;

    const fetchAppointments = (
      targetPatientId: string,
      status: string,
      range?: { startDate?: string; endDate?: string }
    ) =>
      appointmentsService
        .getPatientAppointments(targetPatientId, {
          status: status.toLowerCase(),
          page: 1,
          pageSize: PAGE_SIZE,
          ...(range || {}),
        })
        .catch(() => ({ success: true, appointments: [] }));

    const [
      confirmedApts,
      scheduledApts,
      completedApts,
      cancelledApts,
      confirmedAptsUUID,
      scheduledAptsUUID,
      completedAptsUUID,
      cancelledAptsUUID,
      billingSummary,
      profile,
      insurance,
      contacts,
    ] = await Promise.all([
      fetchAppointments(patientId, 'CONFIRMED', upcomingRange),
      fetchAppointments(patientId, 'SCHEDULED', upcomingRange),
      fetchAppointments(patientId, 'COMPLETED', past30Range),
      fetchAppointments(patientId, 'CANCELLED', past30Range),

      // Fetch appointments using UUID (fallback/dual-check)
      options?.billingIdentifier && options.billingIdentifier !== patientId
        ? fetchAppointments(options.billingIdentifier, 'CONFIRMED', upcomingRange)
        : Promise.resolve({ success: true, appointments: [] }),
      options?.billingIdentifier && options.billingIdentifier !== patientId
        ? fetchAppointments(options.billingIdentifier, 'SCHEDULED', upcomingRange)
        : Promise.resolve({ success: true, appointments: [] }),
      options?.billingIdentifier && options.billingIdentifier !== patientId
        ? fetchAppointments(options.billingIdentifier, 'COMPLETED', past30Range)
        : Promise.resolve({ success: true, appointments: [] }),
      options?.billingIdentifier && options.billingIdentifier !== patientId
        ? fetchAppointments(options.billingIdentifier, 'CANCELLED', past30Range)
        : Promise.resolve({ success: true, appointments: [] }),

      // Billing: Prioritize UUID (billingIdentifier) as DB shows wallet is linked to UUID
      billingService
        .getPatientBillingSummary(options?.billingIdentifier || patientId)
        .catch(async (error) => {
          console.warn(
            '[DashboardService] Billing API failed with primary ID, trying fallback...',
            error.message
          );
          // Fallback: Try the other ID
          const fallbackId = options?.billingIdentifier === patientId ? null : patientId;
          if (fallbackId) {
            try {
              return await billingService.getPatientBillingSummary(fallbackId);
            } catch (fallbackError) {
              console.error('[DashboardService] Billing API failed with both IDs:', fallbackError);
            }
          }
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
      patientService.getInsurance(patientId).catch(() => ({
        patientId,
        insuranceInfo: null,
        hasInsurance: false,
      })),
      patientService.getEmergencyContacts(patientId).catch(() => ({
        patientId,
        contacts: [],
        totalCount: 0,
      })),
    ]);

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
          console.warn(
            '[DashboardService] Invalid date for appointment:',
            apt.appointmentId,
            dateTimeStr
          );
          return null;
        }

        return dt;
      } catch (error) {
        console.error('[DashboardService] Error parsing appointment date:', error, apt);
        return null;
      }
    };

    // Helper to merge and deduplicate appointments
    const mergeAppointments = (list1: any[], list2: any[]) => {
      const map = new Map();
      list1.forEach((a) => map.set(a.id || a.appointmentId, a));
      list2.forEach((a) => map.set(a.id || a.appointmentId, a));
      return Array.from(map.values());
    };

    const allConfirmed = mergeAppointments(
      (confirmedApts as any).appointments || [],
      (confirmedAptsUUID as any).appointments || []
    );
    const allScheduled = mergeAppointments(
      (scheduledApts as any).appointments || [],
      (scheduledAptsUUID as any).appointments || []
    );
    const allCompleted = mergeAppointments(
      (completedApts as any).appointments || [],
      (completedAptsUUID as any).appointments || []
    );
    const allCancelled = mergeAppointments(
      (cancelledApts as any).appointments || [],
      (cancelledAptsUUID as any).appointments || []
    );

    // Count upcoming appointments (including today through next 7 days)
    // Explicitly filter by status to ensure accuracy even if backend ignores status param
    const normalizeStatus = (status?: string) => (status || '').toString().trim().toUpperCase();

    const upcomingConfirmed7DaysCount = [
      ...allConfirmed.filter((a: any) => normalizeStatus(a.status) === 'CONFIRMED'),
      ...allScheduled.filter((a: any) => normalizeStatus(a.status) === 'SCHEDULED'),
    ].filter((apt: any) => {
      const dt = parseAppointmentDateTime(apt);
      if (!dt) return false;

      // Include from START OF TODAY to END OF 7 days ahead
      // This ensures we count all appointments from today onwards
      return dt >= today && dt <= sevenDaysAhead;
    }).length;

    console.log('[DashboardService] Upcoming appointments debug', {
      range: { start: upcomingRange.startDate, end: upcomingRange.endDate },
      sourceConfirmed: allConfirmed.length,
      sourceScheduled: allScheduled.length,
      result: upcomingConfirmed7DaysCount,
    });

    // Count RECENTLY completed/cancelled (last 30 days)

    const completedCount = allCompleted
      .filter((a: any) => normalizeStatus(a.status) === 'COMPLETED')
      .filter((apt: any) => {
        const dateStr = apt.appointmentDate || apt.date;
        const timeStr = apt.appointmentTime || apt.time || '00:00:00';
        const dt = new Date(`${dateStr}T${timeStr}`);
        return dt >= thirtyDaysAgo && dt <= now;
      }).length;

    const cancelledCount = allCancelled
      .filter((a: any) => normalizeStatus(a.status) === 'CANCELLED')
      .filter((apt: any) => {
        const dateStr = apt.appointmentDate || apt.date;
        const timeStr = apt.appointmentTime || apt.time || '00:00:00';
        const dt = new Date(`${dateStr}T${timeStr}`);
        return dt >= thirtyDaysAgo && dt <= now;
      }).length;

    const recentCompletedOrCancelledCount = completedCount + cancelledCount;

    console.log('[DashboardService] Completed/cancelled debug', {
      range: { start: past30Range.startDate, end: past30Range.endDate },
      completedSource: allCompleted.length,
      cancelledSource: allCancelled.length,
      completedCount,
      cancelledCount,
      recentCompletedOrCancelledCount,
    });

    const pendingPaymentsCount =
      ((billingSummary as any).pendingInvoiceCount ??
        (billingSummary as any).pendingInvoices ??
        (billingSummary as any).invoicesByStatus?.pending ??
        0) ||
      0;

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

  const personalInfo = profile.personalInfo || profile.personal_info || {};
  const contactInfo = profile.contactInfo || profile.contact_info || {};

  const deriveNameParts = () => {
    const fullName =
      personalInfo.fullName ||
      personalInfo.full_name ||
      `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    if (!fullName) return { first: '', last: '' };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { first: parts[0], last: parts[0] };
    }
    return {
      first: parts[parts.length - 1],
      last: parts.slice(0, parts.length - 1).join(' '),
    };
  };

  const nameParts = deriveNameParts();

  const baseFieldValues = {
    firstName: profile.firstName || personalInfo.firstName || nameParts.first,
    lastName: profile.lastName || personalInfo.lastName || nameParts.last,
    dateOfBirth:
      profile.dateOfBirth ||
      personalInfo.dateOfBirth ||
      personalInfo.birthDate ||
      personalInfo.date_of_birth,
    gender: profile.gender || personalInfo.gender,
    phoneNumber:
      profile.phoneNumber ||
      contactInfo.primaryPhone ||
      contactInfo.phoneNumber ||
      contactInfo.phone,
    email: profile.email || contactInfo.email,
    address:
      profile.address ||
      contactInfo.address?.street ||
      contactInfo.address?.fullAddress ||
      contactInfo.address ||
      profile.location,
  };

  const baseFilled = Object.values(baseFieldValues).filter(
    (value) => value !== undefined && value !== null && value.toString().trim() !== ''
  ).length;

  const baseTotal = Object.keys(baseFieldValues).length;

  const hasInsurance = !!insurance;
  const hasEmergencyContact = Array.isArray(contacts) && contacts.length > 0;

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
