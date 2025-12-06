'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  CreditCard,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Stethoscope,
  HeartPulse,
  Zap,
  PieChart as PieChartIcon,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  getAdminDashboardStats,
  getRecentAppointments,
  getMonthlyStats,
  getInvoiceSummary,
  getRevenueTrend,
  getInvoiceStatusDistribution,
  getRecentPayments,
  getRecentWebhooks,
  getTodayCheckInCount,
  formatCurrency,
  formatNumber,
  type AdminDashboardStats,
  type RecentAppointment,
  type MonthlyStats,
  type InvoiceStatusSummary,
  type PaymentRecord,
  type WebhookEvent
} from '@/lib/api/admin-dashboard.service';

/**
 * Admin Dashboard Page - Premium Edition
 * Route: /admin/dashboard
 * 
 * Features:
 * - Animated Area Charts with gradients
 * - Interactive Donut Charts
 * - Animated Radial Progress
 * - Real-time activity feed with animations
 * - Glassmorphism cards with micro-interactions
 */

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Chart colors - Healthcare theme
const CHART_COLORS = {
  primary: '#0891B2',    // Cyan-600
  secondary: '#22D3EE',  // Cyan-400
  accent: '#059669',     // Emerald-600
  success: '#10B981',    // Emerald-500
  warning: '#F59E0B',    // Amber-500
  danger: '#EF4444',     // Red-500
  info: '#6366F1',       // Indigo-500
  muted: '#94A3B8',      // Slate-400
};

const DONUT_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // State
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRevenue: 0,
    revenueChange: '0%',
    totalAppointments: 0,
    appointmentsChange: '0%',
    totalPatients: 0,
    patientsChange: '0%',
    totalStaff: 0,
    staffChange: '0',
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [chartData, setChartData] = useState<MonthlyStats[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceStatusSummary>({ paid: 0, pending: 0, failed: 0, refunded: 0 });
  const [todayRevenue, setTodayRevenue] = useState<{ payos: number; cash: number }>({ payos: 0, cash: 0 });
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; amount: number }[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [checkInSummary, setCheckInSummary] = useState<{ checkedIn: number; total: number }>({ checkedIn: 0, total: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [
        statsData,
        appointmentsData,
        monthlyData,
        invoiceData,
        revenueTrendData,
        invoiceDistData,
        recentPaymentsData,
        checkInData
      ] = await Promise.all([
        getAdminDashboardStats(),
        getRecentAppointments(5),
        getMonthlyStats(),
        getInvoiceSummary(),
        getRevenueTrend(14),
        getInvoiceStatusDistribution(),
        getRecentPayments(8),
        getTodayCheckInCount()
      ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData);
      setChartData(monthlyData);
      setInvoiceSummary(invoiceData.summary);
      setTodayRevenue(invoiceData.todayRevenue);
      setRevenueTrend(revenueTrendData);
      setRecentPayments(recentPaymentsData);
      setCheckInSummary(checkInData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform revenue data for chart
  const revenueChartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      date: item.date.slice(5), // MM-DD
      revenue: item.amount,
      fullDate: item.date,
    }));
  }, [revenueTrend]);

  // Transform invoice data for donut chart
  const invoiceDonutData = useMemo(() => {
    return [
      { name: 'Thành công', value: invoiceSummary.paid, color: DONUT_COLORS[0] },
      { name: 'Chờ xử lý', value: invoiceSummary.pending, color: DONUT_COLORS[1] },
      { name: 'Thất bại', value: invoiceSummary.failed, color: DONUT_COLORS[2] },
      { name: 'Hoàn tiền', value: invoiceSummary.refunded, color: DONUT_COLORS[3] },
    ].filter(item => item.value > 0);
  }, [invoiceSummary]);

  // Calculate check-in progress
  const checkInProgress = useMemo(() => {
    if (checkInSummary.total === 0) return 0;
    return Math.round((checkInSummary.checkedIn / checkInSummary.total) * 100);
  }, [checkInSummary]);

  // Radial chart data for check-in
  const radialData = useMemo(() => [
    {
      name: 'Check-in',
      value: checkInProgress,
      fill: '#0891B2',
    },
  ], [checkInProgress]);

  // Custom tooltip for area chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/50"
        >
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-lg font-bold text-cyan-400">
            {formatCurrency(payload[0].value)}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  // Stat cards data
  const statCards = [
    {
      id: 'revenue',
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      trend: 'up' as const,
      subtitle: 'tháng này',
      icon: DollarSign,
      gradient: 'from-cyan-500 to-blue-600',
      bgGlow: 'bg-cyan-500/20',
    },
    {
      id: 'appointments',
      title: 'Lịch hẹn hôm nay',
      value: formatNumber(checkInSummary.total),
      change: stats.appointmentsChange,
      trend: 'up' as const,
      subtitle: `${checkInSummary.checkedIn} đã check-in`,
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/20',
    },
    {
      id: 'patients',
      title: 'Bệnh nhân mới',
      value: formatNumber(stats.totalPatients),
      change: stats.patientsChange,
      trend: 'up' as const,
      subtitle: 'tổng số bệnh nhân',
      icon: HeartPulse,
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/20',
    },
    {
      id: 'alerts',
      title: 'Cần xử lý',
      value: formatNumber(invoiceSummary.pending + invoiceSummary.failed),
      change: invoiceSummary.failed > 0 ? '+1' : '0',
      trend: invoiceSummary.failed > 0 ? 'down' as const : 'neutral' as const,
      subtitle: 'thanh toán lỗi / chờ',
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/20',
    },
  ];

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-10"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <WelcomeHeader userName={user?.fullName || user?.email || 'Quản trị viên'} />
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="flex items-center gap-2"
          >
            <span className="text-sm text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 shadow-lg shadow-slate-200/20 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <Sparkles className="h-4 w-4 text-cyan-500" />
              Hệ thống hoạt động bình thường
            </span>
          </motion.div>
        </motion.div>

        {/* Animated Stat Cards */}
        <motion.div
          variants={containerVariants}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              onHoverStart={() => setHoveredStat(stat.id)}
              onHoverEnd={() => setHoveredStat(null)}
              className="relative group cursor-pointer"
            >
              <div className={`absolute inset-0 ${stat.bgGlow} rounded-2xl blur-xl transition-opacity duration-500 ${hoveredStat === stat.id ? 'opacity-100' : 'opacity-0'}`} />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm p-6 shadow-lg shadow-slate-200/20 transition-all duration-300">
                {/* Gradient accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />

                <div className="flex items-start justify-between">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      {isLoading ? (
                        <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
                      ) : (
                        <motion.h3
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                          className="text-2xl font-bold text-slate-900 tracking-tight"
                        >
                          {stat.value}
                        </motion.h3>
                      )}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className={`rounded-xl p-3 bg-gradient-to-br ${stat.gradient} shadow-lg`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {isLoading ? (
                    <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                  ) : (
                    <>
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stat.trend === 'up'
                            ? 'bg-emerald-50 text-emerald-700'
                            : stat.trend === 'down'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-50 text-slate-600'
                          }`}
                      >
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : stat.trend === 'down' ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : null}
                        {stat.change}
                      </motion.span>
                      <span className="text-xs text-slate-400">{stat.subtitle}</span>
                    </>
                  )}
                </div>

                {/* Decorative background */}
                <div className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 transition-opacity group-hover:opacity-10`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Charts Section */}
        <motion.div
          variants={containerVariants}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Revenue Trend - Interactive Area Chart */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    Xu hướng doanh thu
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Doanh thu 14 ngày gần nhất</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 font-medium border border-cyan-100">
                    <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                    PayOS
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                    <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                    Tiền mặt
                  </span>
                </div>
              </div>

              <div className="h-[320px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0891B2" stopOpacity={0.4} />
                          <stop offset="50%" stopColor="#22D3EE" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#0891B2" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0891B2" />
                          <stop offset="50%" stopColor="#22D3EE" />
                          <stop offset="100%" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value;
                        }}
                        dx={-10}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="url(#lineGradient)"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        animationDuration={2000}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>

          {/* Payment Status - Animated Donut Chart */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20 flex flex-col"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <PieChartIcon className="h-4 w-4 text-white" />
                  </div>
                  Trạng thái thanh toán
                </h3>
                <p className="text-sm text-slate-500 mt-1">Tỷ lệ thanh toán theo trạng thái</p>
              </div>

              <div className="flex-1 flex items-center justify-center min-h-[200px]">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={invoiceDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={200}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {invoiceDonutData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50">
                                <p className="text-xs font-medium">{payload[0].name}</p>
                                <p className="text-lg font-bold">{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Center label */}
                {!isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: 'spring' }}
                    className="absolute flex flex-col items-center justify-center pointer-events-none"
                  >
                    <span className="text-3xl font-bold text-slate-900">{invoiceSummary.paid}</span>
                    <span className="text-xs text-slate-500 font-medium">Thành công</span>
                  </motion.div>
                )}
              </div>

              {/* Legend */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-2"
              >
                {[
                  { label: 'Thành công', value: invoiceSummary.paid, color: 'bg-emerald-500' },
                  { label: 'Chờ xử lý', value: invoiceSummary.pending, color: 'bg-amber-500' },
                  { label: 'Thất bại', value: invoiceSummary.failed, color: 'bg-red-500' },
                  { label: 'Hoàn tiền', value: invoiceSummary.refunded, color: 'bg-indigo-500' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer"
                  >
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Charts Row */}
        <motion.div
          variants={containerVariants}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Check-in Progress - Radial Chart */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                Tiến độ Check-in
              </h3>
              <p className="text-sm text-slate-500 mb-4">Lịch hẹn hôm nay</p>

              <div className="flex items-center justify-center h-[180px] relative">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        barSize={12}
                        data={radialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          background={{ fill: '#E2E8F0' }}
                          dataKey="value"
                          cornerRadius={10}
                          animationDuration={2000}
                          animationEasing="ease-out"
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.5, type: 'spring' }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <span className="text-4xl font-bold text-slate-900">{checkInProgress}%</span>
                      <span className="text-sm text-slate-500">{checkInSummary.checkedIn}/{checkInSummary.total}</span>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Today's Revenue Comparison - Bar Chart */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    Doanh thu hôm nay
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">So sánh theo phương thức thanh toán</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(todayRevenue.payos + todayRevenue.cash)}
                  </p>
                  <p className="text-sm text-slate-500">Tổng cộng</p>
                </div>
              </div>

              <div className="h-[160px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { method: 'PayOS', amount: todayRevenue.payos },
                        { method: 'Tiền mặt', amount: todayRevenue.cash },
                      ]}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="payosGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#7C3AED" />
                          <stop offset="100%" stopColor="#A78BFA" />
                        </linearGradient>
                        <linearGradient id="cashGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#94A3B8" />
                          <stop offset="100%" stopColor="#CBD5E1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                          return value;
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="method"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 14, fontWeight: 500 }}
                        width={80}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50">
                                <p className="text-xs text-slate-400">{payload[0].payload.method}</p>
                                <p className="text-lg font-bold text-violet-400">
                                  {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[0, 8, 8, 0]}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        <Cell fill="url(#payosGradient)" />
                        <Cell fill="url(#cashGradient)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          variants={containerVariants}
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Recent Appointments with Animation */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

            <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Lịch hẹn gần đây
                </h3>
                <p className="text-sm text-slate-500 mt-1">Các cuộc hẹn sắp tới</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
              >
                Xem tất cả
              </motion.button>
            </div>

            <div className="p-0">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-slate-500 gap-2">
                  <Calendar className="h-12 w-12 text-slate-300" />
                  <p>Chưa có lịch hẹn nào</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/50">
                  <AnimatePresence>
                    {recentAppointments.map((apt, index) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                        className="p-4 flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20"
                          >
                            {apt.patientName.charAt(0)}
                          </motion.div>
                          <div>
                            <p className="font-medium text-slate-900">{apt.patientName}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {format(new Date(apt.appointmentDateTime), 'HH:mm dd/MM', { locale: vi })}
                              <span className="text-slate-300">•</span>
                              <span>{apt.appointmentType}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${apt.status === 'CONFIRMED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : apt.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : apt.status === 'COMPLETED'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                          >
                            {apt.status === 'CONFIRMED'
                              ? 'Đã xác nhận'
                              : apt.status === 'PENDING'
                                ? 'Chờ xác nhận'
                                : apt.status === 'COMPLETED'
                                  ? 'Hoàn thành'
                                  : apt.status}
                          </motion.span>
                          <motion.button
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Payments with Animation */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/20"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="p-6 border-b border-slate-100/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  Giao dịch mới nhất
                </h3>
                <p className="text-sm text-slate-500 mt-1">Lịch sử thanh toán</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
              >
                Xem tất cả
              </motion.button>
            </div>

            <div className="p-0">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-slate-500 gap-2">
                  <CreditCard className="h-12 w-12 text-slate-300" />
                  <p>Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/50">
                  <AnimatePresence>
                    {recentPayments.slice(0, 5).map((p, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                        className="p-4 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`h-11 w-11 rounded-full flex items-center justify-center shadow-lg ${p.status === 'PAID'
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
                                : p.status === 'PENDING'
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                                  : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
                              }`}
                          >
                            {p.status === 'PAID' ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : p.status === 'PENDING' ? (
                              <Clock className="h-5 w-5 text-white" />
                            ) : (
                              <XCircle className="h-5 w-5 text-white" />
                            )}
                          </motion.div>
                          <div>
                            <p className="font-medium text-slate-900">{p.patientName}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              {p.description && (
                                <>
                                  <span className="font-medium text-blue-600">{p.description}</span>
                                  <span className="text-slate-300">•</span>
                                </>
                              )}
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.invoiceId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-slate-900"
                          >
                            {formatCurrency(p.amount)}
                          </motion.p>
                          <p className="text-xs text-slate-500">{p.method}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
