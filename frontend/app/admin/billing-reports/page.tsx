'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Loader2,
  DollarSign,
  Users,
  CalendarCheck,
  UserPlus,
  RefreshCw,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { billingService } from '@/lib/api/billing.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { searchStaff } from '@/lib/api/staff.service';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
interface RevenueData {
  total: number;
  previousPeriod: number;
  dailyData: { date: string; amount: number }[];
}

interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  inProgress: number;
}

interface PatientStats {
  total: number;
  newPatients: number;
  returningPatients: number;
}

interface DoctorPerformance {
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentCount: number;
  revenue: number;
}

// ============================================================================
// COLOR PALETTE (Healthcare Theme)
// ============================================================================
const colors = {
  primary: '#0891B2', // Cyan-600
  secondary: '#22D3EE', // Cyan-400
  success: '#059669', // Emerald-600
  warning: '#F59E0B', // Amber-500
  danger: '#EF4444', // Red-500
  background: '#F8FAFC', // Slate-50
  card: '#FFFFFF',
  text: {
    primary: '#0F172A', // Slate-900
    secondary: '#475569', // Slate-600
    muted: '#94A3B8', // Slate-400
  },
  border: '#E2E8F0', // Slate-200
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LAST_7_DAYS'>(
    'THIS_MONTH'
  );

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueData>({
    total: 0,
    previousPeriod: 0,
    dailyData: [],
  });
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    inProgress: 0,
  });
  const [patientStats, setPatientStats] = useState<PatientStats>({
    total: 0,
    newPatients: 0,
    returningPatients: 0,
  });
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;
    let prevFromDate: Date;
    let prevToDate: Date;

    switch (timeRange) {
      case 'LAST_7_DAYS':
        fromDate = subDays(now, 7);
        toDate = now;
        prevFromDate = subDays(now, 14);
        prevToDate = subDays(now, 7);
        break;
      case 'LAST_MONTH':
        fromDate = startOfMonth(subMonths(now, 1));
        toDate = endOfMonth(subMonths(now, 1));
        prevFromDate = startOfMonth(subMonths(now, 2));
        prevToDate = endOfMonth(subMonths(now, 2));
        break;
      case 'THIS_MONTH':
      default:
        fromDate = startOfMonth(now);
        toDate = now;
        prevFromDate = startOfMonth(subMonths(now, 1));
        prevToDate = endOfMonth(subMonths(now, 1));
        break;
    }

    return {
      from: format(fromDate, 'yyyy-MM-dd'),
      to: format(toDate, 'yyyy-MM-dd'),
      prevFrom: format(prevFromDate, 'yyyy-MM-dd'),
      prevTo: format(prevToDate, 'yyyy-MM-dd'),
      fromDate,
      toDate,
    };
  }, [timeRange]);

  // Fetch all data
  const fetchData = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Parallel API calls
      const [revenueRes, appointmentsRes, staffRes] = await Promise.allSettled([
        // 1. Revenue Report
        billingService.getRevenueReport({
          fromDate: dateRange.from,
          toDate: dateRange.to,
          groupBy: 'day',
        }),
        // 2. Appointments List (to calculate stats)
        appointmentsService.list({
          startDate: dateRange.from,
          endDate: dateRange.to,
          pageSize: 1000,
        }),
        // 3. Staff List (doctors)
        searchStaff({
          staffType: 'doctor',
          status: 'active',
          limit: 50,
        }),
      ]);

      // Process Revenue Data
      if (revenueRes.status === 'fulfilled' && revenueRes.value?.success) {
        const data = revenueRes.value.data || [];
        const totalRevenue = data.reduce(
          (sum: number, item: any) => sum + (item.totalAmount || 0),
          0
        );

        // Generate daily data for chart
        const days = eachDayOfInterval({
          start: dateRange.fromDate,
          end: dateRange.toDate,
        });
        const dailyData = days.map((day) => {
          const dayData = data.find((d: any) => isSameDay(new Date(d.date), day));
          return {
            date: format(day, 'dd/MM'),
            amount: dayData ? dayData.totalAmount : 0,
          };
        });

        setRevenueData({
          total: totalRevenue,
          previousPeriod: totalRevenue * 0.85, // Mock previous for now
          dailyData: dailyData.slice(-10), // Last 10 days
        });
      }

      // Process Appointment Stats
      if (appointmentsRes.status === 'fulfilled') {
        const appointments = appointmentsRes.value.appointments || [];
        const stats: AppointmentStats = {
          total: appointments.length,
          completed: appointments.filter(
            (a: any) => a.status?.toLowerCase() === 'completed'
          ).length,
          cancelled: appointments.filter(
            (a: any) => a.status?.toLowerCase() === 'cancelled'
          ).length,
          pending: appointments.filter(
            (a: any) =>
              a.status?.toLowerCase() === 'pending' ||
              a.status?.toLowerCase() === 'confirmed'
          ).length,
          inProgress: appointments.filter(
            (a: any) => a.status?.toLowerCase() === 'in_progress'
          ).length,
        };
        setAppointmentStats(stats);

        // Calculate patient stats from appointments
        const uniquePatients = new Set(
          appointments.map((a: any) => a.patientId || a.patient_id)
        );
        const patientsWithMultiple = appointments.reduce((acc: any, apt: any) => {
          const pid = apt.patientId || apt.patient_id;
          acc[pid] = (acc[pid] || 0) + 1;
          return acc;
        }, {});
        const returningPatients = Object.values(patientsWithMultiple).filter(
          (count: any) => count > 1
        ).length;

        setPatientStats({
          total: uniquePatients.size,
          newPatients: uniquePatients.size - returningPatients,
          returningPatients,
        });

        // Calculate doctor performance from appointments
        if (staffRes.status === 'fulfilled') {
          const doctors = staffRes.value?.data?.items || [];
          const doctorMap = new Map(
            doctors.map((d: any) => [
              d.staffId || d.id,
              {
                name: d.personalInfo?.fullName || d.name || 'Unknown',
                department: d.professionalInfo?.department || 'N/A',
              },
            ])
          );

          const doctorStats: Record<string, DoctorPerformance> = {};
          appointments.forEach((apt: any) => {
            const doctorId = apt.doctorId || apt.doctor_id;
            if (!doctorId) return;

            if (!doctorStats[doctorId]) {
              const docInfo = doctorMap.get(doctorId) || {
                name: apt.doctorName || apt.doctorFullName || 'Unknown',
                department: apt.doctorDepartment || 'N/A',
              };
              doctorStats[doctorId] = {
                doctorId,
                doctorName: docInfo.name,
                department: docInfo.department,
                appointmentCount: 0,
                revenue: 0,
              };
            }
            doctorStats[doctorId].appointmentCount++;
            doctorStats[doctorId].revenue += apt.consultationFee || 0;
          });

          const sortedDoctors = Object.values(doctorStats)
            .sort((a, b) => b.appointmentCount - a.appointmentCount)
            .slice(0, 5);
          setDoctorPerformance(sortedDoctors);
        }
      }

      if (showRefreshToast) {
        toast.success('Đã cập nhật dữ liệu');
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Không thể tải báo cáo');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Calculate percentage change
  const revenueChange = useMemo(() => {
    if (revenueData.previousPeriod === 0) return 0;
    return ((revenueData.total - revenueData.previousPeriod) / revenueData.previousPeriod) * 100;
  }, [revenueData]);

  const completionRate = useMemo(() => {
    if (appointmentStats.total === 0) return 0;
    return (appointmentStats.completed / appointmentStats.total) * 100;
  }, [appointmentStats]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format compact number
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-white">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Báo cáo & Thống kê
              </h1>
              <p className="mt-1 text-slate-600">
                Tổng hợp doanh thu và hoạt động khám chữa bệnh
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Làm mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Xuất báo cáo
              </Button>
            </div>
          </motion.div>

          {/* Time Range Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <Calendar className="h-5 w-5 text-cyan-600" />
            <div className="flex gap-2">
              {[
                { value: 'THIS_MONTH' as const, label: 'Tháng này' },
                { value: 'LAST_MONTH' as const, label: 'Tháng trước' },
                { value: 'LAST_7_DAYS' as const, label: '7 ngày qua' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${timeRange === option.value
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-slate-500">
              {format(dateRange.fromDate, 'dd/MM/yyyy', { locale: vi })} -{' '}
              {format(dateRange.toDate, 'dd/MM/yyyy', { locale: vi })}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-96 items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
                  <p className="text-slate-500">Đang tải dữ liệu...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(revenueData.total)}
                    change={revenueChange}
                    icon={DollarSign}
                    color="cyan"
                    delay={0.1}
                  />
                  <StatCard
                    title="Lịch hẹn"
                    value={appointmentStats.total.toString()}
                    subtitle={`${appointmentStats.completed} hoàn thành`}
                    icon={CalendarCheck}
                    color="emerald"
                    delay={0.2}
                  />
                  <StatCard
                    title="Bệnh nhân mới"
                    value={patientStats.newPatients.toString()}
                    subtitle={`${patientStats.total} tổng`}
                    icon={UserPlus}
                    color="blue"
                    delay={0.3}
                  />
                  <StatCard
                    title="Tỷ lệ hoàn thành"
                    value={`${completionRate.toFixed(0)}%`}
                    subtitle={`${appointmentStats.cancelled} hủy`}
                    icon={Activity}
                    color="amber"
                    delay={0.4}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-cyan-100 p-2">
                          <BarChart3 className="h-5 w-5 text-cyan-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Biểu đồ doanh thu
                        </h3>
                      </div>
                    </div>
                    <RevenueBarChart data={revenueData.dailyData} />
                  </motion.div>

                  {/* Appointment Status Pie */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-100 p-2">
                          <PieChart className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Trạng thái lịch hẹn
                        </h3>
                      </div>
                    </div>
                    <AppointmentStatusChart stats={appointmentStats} />
                  </motion.div>
                </div>

                {/* Doctor Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Top Bác sĩ
                    </h3>
                  </div>
                  {doctorPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {doctorPerformance.map((doctor, index) => (
                        <DoctorPerformanceRow
                          key={doctor.doctorId}
                          doctor={doctor}
                          rank={index + 1}
                          maxAppointments={doctorPerformance[0]?.appointmentCount || 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-slate-500">
                      Chưa có dữ liệu
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: React.ElementType;
  color: 'cyan' | 'emerald' | 'blue' | 'amber';
  delay?: number;
}

function StatCard({ title, value, change, subtitle, icon: Icon, color, delay = 0 }: StatCardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-100 text-cyan-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-slate-400">so với kỳ trước</span>
            </div>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

interface RevenueBarChartProps {
  data: { date: string; amount: number }[];
}

function RevenueBarChart({ data }: RevenueBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.amount), 1);

  if (data.length === 0 || data.every((d) => d.amount === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }

  return (
    <div className="flex h-64 items-end justify-around gap-2">
      {data.map((item, index) => {
        const height = (item.amount / maxValue) * 100;
        return (
          <div
            key={index}
            className="group relative flex flex-1 flex-col items-center"
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 2)}%` }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="w-full max-w-[40px] cursor-pointer rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all hover:from-cyan-500 hover:to-cyan-300"
            />
            <span className="mt-2 text-xs text-slate-500">{item.date}</span>
            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(item.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface AppointmentStatusChartProps {
  stats: AppointmentStats;
}

function AppointmentStatusChart({ stats }: AppointmentStatusChartProps) {
  const total = stats.total || 1;
  const items = [
    {
      label: 'Hoàn thành',
      value: stats.completed,
      color: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    {
      label: 'Chờ khám',
      value: stats.pending,
      color: 'bg-amber-500',
      icon: Clock,
    },
    {
      label: 'Đang khám',
      value: stats.inProgress,
      color: 'bg-blue-500',
      icon: Activity,
    },
    {
      label: 'Đã hủy',
      value: stats.cancelled,
      color: 'bg-red-500',
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const Icon = item.icon;
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <span className="font-semibold text-slate-900">
                {item.value} ({percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DoctorPerformanceRowProps {
  doctor: DoctorPerformance;
  rank: number;
  maxAppointments: number;
}

function DoctorPerformanceRow({ doctor, rank, maxAppointments }: DoctorPerformanceRowProps) {
  const percentage = (doctor.appointmentCount / maxAppointments) * 100;

  const rankColors = {
    1: 'bg-amber-500 text-white',
    2: 'bg-slate-400 text-white',
    3: 'bg-amber-700 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="group flex items-center gap-4 rounded-lg border border-slate-100 p-4 transition-all hover:border-slate-200 hover:bg-slate-50"
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rankColors[rank as keyof typeof rankColors] || 'bg-slate-200 text-slate-600'
          }`}
      >
        {rank}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">{doctor.doctorName}</p>
            <p className="text-sm text-slate-500">{doctor.department}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-cyan-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
                maximumFractionDigits: 0,
              }).format(doctor.revenue)}
            </p>
            <p className="text-sm text-slate-500">
              {doctor.appointmentCount} lịch hẹn
            </p>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.3 + rank * 0.1, duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </div>
      </div>
    </motion.div>
  );
}
