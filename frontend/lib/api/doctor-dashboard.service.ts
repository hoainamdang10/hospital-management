import { appointmentsService } from './appointments.service';
import { getStaffByUserId } from './staff.service';

export interface DoctorDashboardStats {
  todayAppointmentsCount: number;
  completedCount: number;
  remainingCount: number;
  paidCount: number;
  unpaidCount: number;
  paymentRate: number;
  averageTimeMinutes: number;
  todayAppointments: any[];
}

/**
 * Fetch Doctor Dashboard Statistics
 * - KPIs: Calculated based on TODAY's UPCOMING appointments
 * - Calendar: Shows all appointments (including COMPLETED) for 3 weeks, excludes CANCELLED only
 */
export async function getDoctorDashboardStats(userId: string): Promise<DoctorDashboardStats> {
  try {
    // 1. Get Staff Profile
    const staff = await getStaffByUserId(userId);
    const doctorId = staff?.staffId;

    if (!doctorId) {
      console.error('Staff ID not found for user', userId);
      return getEmptyStats();
    }

    // 2. Date ranges
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const todayString = formatDate(today);

    // 3. Fetch 3 weeks of appointments (including COMPLETED)
    // Note: Do NOT pass 'status' param so we get ALL statuses including COMPLETED
    const response = await appointmentsService.getDoctorAppointments(doctorId, {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      pageSize: 200, // Increased pageSize to ensure we get all appointments in 3-week range
    });

    const allAppointments = response.appointments || [];

    // DEBUG: Log fetched appointments
    console.log('[DoctorDashboard] Fetched appointments:', {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      total: allAppointments.length,
      appointments: allAppointments.map((apt: any) => ({
        id: apt.id || apt.appointment_id,
        date: apt.appointment_date || apt.appointmentDate,
        status: apt.status,
        patientName: apt.patient_full_name || apt.patientName,
      })),
    });

    // 4. For calendar: Include COMPLETED, exclude CANCELLED only
    const calendarAppointments = allAppointments.filter((apt: any) => {
      const status = (apt.status || '').toUpperCase();
      return status !== 'CANCELLED';
    });

    // 5. For KPIs: Upcoming only (exclude COMPLETED and CANCELLED)
    const upcomingAppointments = allAppointments.filter((apt: any) => {
      const status = (apt.status || '').toUpperCase();
      return status !== 'COMPLETED' && status !== 'CANCELLED';
    });

    // 6. Today's appointments for KPI calculation
    const todayAll = allAppointments.filter((apt: any) => {
      const aptDate = apt.appointment_date || apt.appointmentDate;
      const status = (apt.status || '').toUpperCase();
      // Exclude CANCELLED from today's total
      return aptDate === todayString && status !== 'CANCELLED';
    });

    const todayUpcoming = upcomingAppointments.filter((apt: any) => {
      const aptDate = apt.appointment_date || apt.appointmentDate;
      return aptDate === todayString;
    });

    // 7. Calculate KPIs
    // TOTAL appointments today (including completed, excluding cancelled)
    const todayAppointmentsCount = todayAll.length;

    const completedCount = todayAll.filter(
      (apt: any) => (apt.status || '').toUpperCase() === 'COMPLETED'
    ).length;

    // Remaining = appointments still waiting (not completed)
    const remainingCount = todayUpcoming.length;

    // Payment stats from ALL today's appointments (including completed)
    const paidCount = todayAll.filter(
      (apt: any) => (apt.paymentStatus || apt.payment_status || '').toUpperCase() === 'PAID'
    ).length;

    const unpaidCount = todayAll.length - paidCount;

    const paymentRate =
      todayAll.length > 0 ? Math.round((paidCount / todayAll.length) * 100) : 0;

    const averageTimeMinutes = 25;

    // 8. Map calendar appointments (includes COMPLETED for review)
    const todayAppointments = calendarAppointments.map((apt: any) => ({
      id: apt.id || apt.appointment_id,
      appointmentId: apt.appointment_id || apt.id,
      patientName: apt.patient_full_name || apt.patientName || 'N/A',
      patientId: apt.patient_id || apt.patientId,
      appointmentTime: apt.appointment_time || apt.appointmentTime,
      appointmentDate: apt.appointment_date || apt.appointmentDate,
      status: (apt.status || '').toUpperCase(),
      type: apt.type,
      reason: apt.reason || 'Không có lý do',
      paymentStatus: (apt.paymentStatus || apt.payment_status || 'UNPAID').toUpperCase(),
    }));

    // Sort by date then time
    todayAppointments.sort((a, b) => {
      const dateA = a.appointmentDate || '0000-00-00';
      const dateB = b.appointmentDate || '0000-00-00';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const timeA = a.appointmentTime || '00:00';
      const timeB = b.appointmentTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    return {
      todayAppointmentsCount,
      completedCount,
      remainingCount,
      paidCount,
      unpaidCount,
      paymentRate,
      averageTimeMinutes,
      todayAppointments,
    };
  } catch (error) {
    console.error('Failed to fetch doctor dashboard stats:', error);
    return getEmptyStats();
  }
}

function getEmptyStats(): DoctorDashboardStats {
  return {
    todayAppointmentsCount: 0,
    completedCount: 0,
    remainingCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    paymentRate: 0,
    averageTimeMinutes: 0,
    todayAppointments: [],
  };
}
