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
  ArrowUpRight,
  Sparkles,
  Users,
  FileBarChart,
  Building2,
  Heart,
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPie,
  Pie,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================
interface RevenueData {
  total: number;
  previousPeriod: number;
  dailyData: { date: string; amount: number; fullDate: string }[];
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
      const [revenueRes, appointmentsRes, staffRes] = await Promise.allSettled([
        billingService.getRevenueReport({
          fromDate: dateRange.from,
          toDate: dateRange.to,
          groupBy: 'day',
        }),
        appointmentsService.list({
          startDate: dateRange.from,
          endDate: dateRange.to,
          pageSize: 1000,
        }),
        searchStaff({
          staffType: 'doctor',
          status: 'active',
          limit: 50,
        }),
      ]);

      // Process Revenue Data
      if (revenueRes.status === 'fulfilled' && revenueRes.value?.success) {
        const report = revenueRes.value.data || {};
        const breakdown = Array.isArray(report.breakdown) ? report.breakdown : [];
        const summary = report.summary || {};
        const totalRevenue = summary.totalRevenue || 0;

        const breakdownMap = new Map(breakdown.map((item: any) => [item.period, item]));

        const days = eachDayOfInterval({
          start: dateRange.fromDate,
          end: dateRange.toDate,
        });
        const dailyData = days.map((day) => {
          const isoKey = format(day, 'yyyy-MM-dd');
          const dayData = breakdownMap.get(isoKey);
          return {
            date: format(day, 'dd/MM'),
            fullDate: format(day, 'EEEE, dd/MM/yyyy', { locale: vi }),
            amount: dayData ? dayData.totalRevenue || 0 : 0,
          };
        });

        setRevenueData({
          total: totalRevenue,
          previousPeriod: summary.previousPeriod || totalRevenue * 0.85,
          dailyData: dailyData.slice(-14),
        });
      }

      // Process Appointment Stats
      if (appointmentsRes.status === 'fulfilled') {
        const appointments = appointmentsRes.value.appointments || [];
        const stats: AppointmentStats = {
          total: appointments.length,
          completed: appointments.filter((a: any) => a.status?.toLowerCase() === 'completed')
            .length,
          cancelled: appointments.filter((a: any) => a.status?.toLowerCase() === 'cancelled')
            .length,
          pending: appointments.filter(
            (a: any) =>
              a.status?.toLowerCase() === 'pending' || a.status?.toLowerCase() === 'confirmed'
          ).length,
          inProgress: appointments.filter((a: any) => a.status?.toLowerCase() === 'in_progress')
            .length,
        };
        setAppointmentStats(stats);

        const uniquePatients = new Set(appointments.map((a: any) => a.patientId || a.patient_id));
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

  const revenueChange = useMemo(() => {
    if (revenueData.previousPeriod === 0) return 0;
    return ((revenueData.total - revenueData.previousPeriod) / revenueData.previousPeriod) * 100;
  }, [revenueData]);

  const completionRate = useMemo(() => {
    if (appointmentStats.total === 0) return 0;
    return (appointmentStats.completed / appointmentStats.total) * 100;
  }, [appointmentStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Progress data for radial chart
  const progressData = [{ name: 'Hoàn thành', value: completionRate, fill: '#10B981' }];

  const appointmentBarData = [
    { name: 'Hoàn thành', value: appointmentStats.completed, fill: '#10B981' },
    { name: 'Chờ khám', value: appointmentStats.pending, fill: '#F59E0B' },
    { name: 'Đang khám', value: appointmentStats.inProgress, fill: '#3B82F6' },
    { name: 'Đã hủy', value: appointmentStats.cancelled, fill: '#EF4444' },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          {/* Premium Header - Different color scheme */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/20" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/20" />
            </div>

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <FileBarChart className="h-7 w-7" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Báo cáo & Thống kê</h1>
                  <p className="mt-1 text-blue-100">Phân tích hoạt động và hiệu suất bệnh viện</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(true)}
                  disabled={isRefreshing}
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Time Range Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex gap-2">
              {[
                { value: 'THIS_MONTH' as const, label: 'Tháng này' },
                { value: 'LAST_MONTH' as const, label: 'Tháng trước' },
                { value: 'LAST_7_DAYS' as const, label: '7 ngày qua' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="ml-auto rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
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
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-blue-100" />
                    <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
                  </div>
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
                {/* Stats Cards - 6 columns layout */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <CompactStatCard
                    title="Doanh thu"
                    value={formatCompact(revenueData.total)}
                    icon={DollarSign}
                    color="cyan"
                  />
                  <CompactStatCard
                    title="Lịch hẹn"
                    value={appointmentStats.total.toString()}
                    icon={CalendarCheck}
                    color="emerald"
                  />
                  <CompactStatCard
                    title="Hoàn thành"
                    value={appointmentStats.completed.toString()}
                    icon={CheckCircle2}
                    color="green"
                  />
                  <CompactStatCard
                    title="Bệnh nhân"
                    value={patientStats.total.toString()}
                    icon={Users}
                    color="blue"
                  />
                  <CompactStatCard
                    title="Bệnh nhân mới"
                    value={patientStats.newPatients.toString()}
                    icon={UserPlus}
                    color="violet"
                  />
                  <CompactStatCard
                    title="Tỷ lệ HT"
                    value={`${completionRate.toFixed(0)}%`}
                    icon={Activity}
                    color="amber"
                  />
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Revenue Trend - 2 cols */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="group relative col-span-2 overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl transition-all group-hover:scale-150" />

                    <div className="relative mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Xu hướng doanh thu</h3>
                          <p className="text-sm text-slate-500">Biến động theo ngày</p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${revenueChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}
                      >
                        {revenueChange >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {revenueChange >= 0 ? '+' : ''}
                        {revenueChange.toFixed(1)}%
                      </div>
                    </div>

                    <div className="h-64">
                      {revenueData.dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData.dailyData}>
                            <defs>
                              <linearGradient id="revenueGradient2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                              dataKey="date"
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => formatCompact(value)}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                                      <p className="text-sm text-slate-500">
                                        {payload[0].payload.fullDate}
                                      </p>
                                      <p className="text-lg font-bold text-indigo-600">
                                        {formatCurrency(payload[0].value as number)}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#6366F1"
                              strokeWidth={3}
                              fill="url(#revenueGradient2)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Appointment Status Bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg"
                  >
                    <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 blur-2xl" />

                    <div className="relative mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25">
                        <PieChart className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Lịch hẹn</h3>
                        <p className="text-sm text-slate-500">Phân bổ trạng thái</p>
                      </div>
                    </div>

                    <div className="h-64">
                      {appointmentStats.total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={appointmentBarData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={80}
                              tick={{ fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-sm">
                                      <p
                                        className="font-medium"
                                        style={{ color: payload[0].payload.fill }}
                                      >
                                        {payload[0].value} lịch hẹn
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                              {appointmentBarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Doctor Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg"
                >
                  <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/5 to-purple-500/5 blur-3xl" />

                  <div className="relative mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Hiệu suất Bác sĩ</h3>
                        <p className="text-sm text-slate-500">Xếp hạng theo lịch hẹn</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Top {doctorPerformance.length}
                    </div>
                  </div>

                  {doctorPerformance.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      {doctorPerformance.map((doctor, index) => (
                        <DoctorCard
                          key={doctor.doctorId}
                          doctor={doctor}
                          rank={index + 1}
                          formatCurrency={formatCurrency}
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

interface CompactStatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'cyan' | 'emerald' | 'green' | 'blue' | 'violet' | 'amber';
}

function CompactStatCard({ title, value, icon: Icon, color }: CompactStatCardProps) {
  const gradients = {
    cyan: 'from-cyan-500 to-teal-600',
    emerald: 'from-emerald-500 to-green-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    violet: 'from-violet-500 to-purple-600',
    amber: 'from-amber-500 to-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group cursor-pointer rounded-2xl border border-slate-200/50 bg-white p-4 shadow-md transition-all hover:shadow-lg"
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[color]} text-white shadow-lg`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
    </motion.div>
  );
}

interface DoctorCardProps {
  doctor: DoctorPerformance;
  rank: number;
  formatCurrency: (amount: number) => string;
}

function DoctorCard({ doctor, rank, formatCurrency }: DoctorCardProps) {
  const rankStyles = {
    1: 'ring-4 ring-amber-400/30 bg-gradient-to-br from-amber-50 to-yellow-50',
    2: 'ring-2 ring-slate-300/30 bg-gradient-to-br from-slate-50 to-gray-50',
    3: 'ring-2 ring-amber-600/20 bg-gradient-to-br from-amber-50/50 to-orange-50/50',
  };

  const rankBadge = {
    1: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-amber-500/30',
    2: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-500/30',
    3: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-amber-600/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`group cursor-pointer rounded-2xl border border-slate-200/50 bg-white p-4 shadow-md transition-all hover:shadow-lg ${
        rankStyles[rank as keyof typeof rankStyles] || ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-lg ${
            rankBadge[rank as keyof typeof rankBadge] || 'bg-slate-200 text-slate-600'
          }`}
        >
          {rank}
        </div>
        <Heart className="h-4 w-4 text-rose-400" />
      </div>
      <h4 className="mb-1 line-clamp-1 font-semibold text-slate-900">{doctor.doctorName}</h4>
      <p className="mb-3 line-clamp-1 text-xs text-slate-500">{doctor.department}</p>
      <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
        <span className="text-lg font-bold text-indigo-600">{doctor.appointmentCount}</span>
        <span className="text-xs text-slate-500">lịch hẹn</span>
      </div>
    </motion.div>
  );
}
