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
} from 'recharts';
import {
  Calendar,
  DollarSign,
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
  HeartPulse,
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
  getInvoiceSummary,
  getRevenueTrend,
  getRecentPayments,
  formatCurrency,
  formatNumber,
  type AdminDashboardStats,
  type RecentAppointment,
  type InvoiceStatusSummary,
  type PaymentRecord,
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
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceStatusSummary>({
    paid: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  });
  const [todayRevenue, setTodayRevenue] = useState<{ payos: number; wallet: number }>({
    payos: 0,
    wallet: 0,
  });
  const [revenueTrend, setRevenueTrend] = useState<
    { date: string; payos: number; wallet: number }[]
  >([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [statsData, appointmentsData, invoiceData, revenueTrendData, recentPaymentsData] =
        await Promise.all([
          getAdminDashboardStats(),
          getRecentAppointments(5),
          getInvoiceSummary(),
          getRevenueTrend(14),
          getRecentPayments(8),
        ]);

      setStats(statsData);
      setRecentAppointments(appointmentsData);
      setInvoiceSummary(invoiceData.summary);
      setTodayRevenue(invoiceData.todayRevenue);
      setRevenueTrend(revenueTrendData);
      setRecentPayments(recentPaymentsData);
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
      payos: item.payos,
      wallet: item.wallet,
      total: item.payos + item.wallet,
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
    ].filter((item) => item.value > 0);
  }, [invoiceSummary]);

  // Custom tooltip for area chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-slate-700/50 bg-slate-900/95 px-4 py-3 text-white shadow-xl backdrop-blur-sm"
        >
          <p className="mb-1 text-xs text-slate-400">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
              <span className="font-bold text-cyan-300">{formatCurrency(entry.value)}</span>
            </div>
          ))}
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
      value: formatNumber(stats.totalAppointments),
      change: stats.appointmentsChange,
      trend: 'up' as const,
      subtitle: 'tổng lịch hẹn',
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
      trend: invoiceSummary.failed > 0 ? ('down' as const) : ('neutral' as const),
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
          className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <WelcomeHeader userName={user?.fullName || user?.email || 'Quản trị viên'} />
          <motion.div variants={pulseVariants} animate="pulse" className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-lg shadow-slate-200/20 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
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
              className="group relative cursor-pointer"
            >
              <div
                className={`absolute inset-0 ${stat.bgGlow} rounded-2xl blur-xl transition-opacity duration-500 ${hoveredStat === stat.id ? 'opacity-100' : 'opacity-0'}`}
              />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 p-6 shadow-lg shadow-slate-200/20 backdrop-blur-sm transition-all duration-300">
                {/* Gradient accent line */}
                <div
                  className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                />

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
                          className="text-2xl font-bold tracking-tight text-slate-900"
                        >
                          {stat.value}
                        </motion.h3>
                      )}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 15 }}
                    className={`rounded-xl bg-gradient-to-br p-3 ${stat.gradient} shadow-lg`}
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
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          stat.trend === 'up'
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
                <div
                  className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 transition-opacity group-hover:opacity-10`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue Section with Tabs */}
        <motion.div variants={containerVariants} className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Charts with Tabs */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-xl shadow-slate-200/30 backdrop-blur-sm lg:col-span-2"
          >
            {/* Animated gradient accent */}
            <motion.div
              className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-purple-500"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ backgroundSize: '200% 100%' }}
            />

            <div className="p-6">
              {/* Tabs Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Tab Buttons */}
                  <div className="relative flex items-center rounded-xl bg-slate-100/80 p-1">
                    {/* Animated Background Indicator */}
                    <motion.div
                      className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white shadow-lg shadow-slate-200/50"
                      layoutId="revenueTabBg"
                      initial={false}
                      animate={{
                        left: hoveredStat === 'todayRevenue' ? 'calc(50% + 4px)' : '4px',
                        width: 'calc(50% - 8px)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 30,
                      }}
                    />

                    <motion.button
                      onClick={() => setHoveredStat(null)}
                      className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        hoveredStat !== 'todayRevenue'
                          ? 'text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Xu hướng 14 ngày</span>
                    </motion.button>

                    <motion.button
                      onClick={() => setHoveredStat('todayRevenue')}
                      className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        hoveredStat === 'todayRevenue'
                          ? 'text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Hôm nay</span>
                      <motion.span
                        className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        {formatCurrency(todayRevenue.payos + todayRevenue.wallet)}
                      </motion.span>
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 font-medium text-cyan-700">
                    <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
                    PayOS
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-slate-600">
                    <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                    Wallet
                  </span>
                </div>
              </div>

              {/* Tab Content */}
              <div className="relative min-h-[320px]">
                <AnimatePresence mode="wait">
                  {hoveredStat !== 'todayRevenue' ? (
                    /* Revenue Trend Tab - Area Chart */
                    <motion.div
                      key="revenueTrend"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-[320px]"
                    >
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="h-8 w-8 text-cyan-500" />
                          </motion.div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={revenueChartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="payosGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.45} />
                                <stop offset="70%" stopColor="#22D3EE" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="walletGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.35} />
                                <stop offset="80%" stopColor="#CBD5F5" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
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
                              dataKey="wallet"
                              name="Wallet"
                              stroke="#94a3b8"
                              strokeWidth={3}
                              fill="url(#walletGradient)"
                              stackId="revenue"
                              animationDuration={2000}
                              animationEasing="ease-out"
                            />
                            <Area
                              type="monotone"
                              dataKey="payos"
                              name="PayOS"
                              stroke="#0ea5e9"
                              strokeWidth={3}
                              fill="url(#payosGradient)"
                              stackId="revenue"
                              animationDuration={2000}
                              animationEasing="ease-out"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>
                  ) : (
                    /* Today's Revenue Tab - Bar Chart */
                    <motion.div
                      key="todayRevenue"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="h-[320px]"
                    >
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="h-8 w-8 text-violet-500" />
                          </motion.div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col">
                          {/* Summary Stats */}
                          <div className="mb-6 grid grid-cols-3 gap-4">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4"
                            >
                              <p className="mb-1 text-xs font-medium text-violet-600">
                                Tổng doanh thu
                              </p>
                              <p className="text-xl font-bold text-violet-900">
                                {formatCurrency(todayRevenue.payos + todayRevenue.wallet)}
                              </p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-4"
                            >
                              <p className="mb-1 text-xs font-medium text-cyan-600">PayOS</p>
                              <p className="text-xl font-bold text-cyan-900">
                                {formatCurrency(todayRevenue.payos)}
                              </p>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4"
                            >
                              <p className="mb-1 text-xs font-medium text-slate-600">Wallet</p>
                              <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(todayRevenue.wallet)}
                              </p>
                            </motion.div>
                          </div>

                          {/* Bar Chart */}
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { method: 'PayOS', amount: todayRevenue.payos },
                                  { method: 'Wallet', amount: todayRevenue.wallet },
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
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#E2E8F0"
                                  horizontal={false}
                                />
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
                                        <div className="rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-sm">
                                          <p className="text-xs text-slate-400">
                                            {payload[0].payload.method}
                                          </p>
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
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Payment Status - Animated Donut Chart */}
          <motion.div
            variants={itemVariants}
            className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-lg shadow-slate-200/20 backdrop-blur-sm"
          >
            {/* Gradient accent */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="flex flex-1 flex-col p-6">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2 shadow-lg shadow-emerald-500/20">
                    <PieChartIcon className="h-4 w-4 text-white" />
                  </div>
                  Trạng thái thanh toán
                </h3>
                <p className="mt-1 text-sm text-slate-500">Tỷ lệ thanh toán theo trạng thái</p>
              </div>

              <div className="flex min-h-[200px] flex-1 items-center justify-center">
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
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border border-slate-700/50 bg-slate-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-sm">
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
                    className="pointer-events-none absolute flex flex-col items-center justify-center"
                  >
                    <span className="text-3xl font-bold text-slate-900">{invoiceSummary.paid}</span>
                    <span className="text-xs font-medium text-slate-500">Thành công</span>
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
                    className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50/50 p-2 transition-colors hover:bg-slate-100/50"
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

        {/* Unified Activity Section with Tabs */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/80 shadow-xl shadow-slate-200/30 backdrop-blur-sm"
        >
          {/* Animated gradient accent */}
          <motion.div
            className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 100%' }}
          />

          {/* Tabs Header */}
          <div className="border-b border-slate-100/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Tab Buttons */}
                <div className="relative flex items-center rounded-xl bg-slate-100/80 p-1">
                  {/* Animated Background Indicator */}
                  <motion.div
                    className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white shadow-lg shadow-slate-200/50"
                    layoutId="activeTabBg"
                    initial={false}
                    animate={{
                      left: hoveredStat === 'payments' ? 'calc(50% + 4px)' : '4px',
                      width: 'calc(50% - 8px)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />

                  <motion.button
                    onClick={() => setHoveredStat(null)}
                    className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      hoveredStat !== 'payments'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Lịch hẹn gần đây</span>
                    <motion.span
                      className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      {recentAppointments.length}
                    </motion.span>
                  </motion.button>

                  <motion.button
                    onClick={() => setHoveredStat('payments')}
                    className={`relative z-10 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      hoveredStat === 'payments'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Giao dịch mới</span>
                    <motion.span
                      className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      {recentPayments.length}
                    </motion.span>
                  </motion.button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-600 transition-colors hover:bg-cyan-100 hover:text-cyan-700"
              >
                Xem tất cả
                <ArrowUpRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Tab Content with AnimatePresence */}
          <div className="relative min-h-[320px]">
            <AnimatePresence mode="wait">
              {hoveredStat !== 'payments' ? (
                /* Appointments Tab */
                <motion.div
                  key="appointments"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="p-0"
                >
                  {isLoading ? (
                    <div className="flex h-[320px] items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-8 w-8 text-cyan-500" />
                      </motion.div>
                    </div>
                  ) : recentAppointments.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-[320px] flex-col items-center justify-center gap-3 text-slate-500"
                    >
                      <div className="rounded-full bg-slate-100 p-4">
                        <Calendar className="h-12 w-12 text-slate-400" />
                      </div>
                      <p className="font-medium">Chưa có lịch hẹn nào</p>
                      <p className="text-sm text-slate-400">Các lịch hẹn sẽ hiển thị ở đây</p>
                    </motion.div>
                  ) : (
                    <div className="divide-y divide-slate-100/50">
                      {recentAppointments.map((apt, index) => (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                          whileHover={{
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            x: 4,
                          }}
                          className="group flex cursor-pointer items-center justify-between p-4 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30"
                            >
                              {apt.patientName.charAt(0)}
                            </motion.div>
                            <div>
                              <p className="font-semibold text-slate-900">{apt.patientName}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(apt.appointmentDateTime), 'HH:mm dd/MM', {
                                    locale: vi,
                                  })}
                                </div>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                                  {apt.appointmentType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                                apt.status === 'CONFIRMED'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100'
                                  : apt.status === 'PENDING'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100'
                                    : apt.status === 'COMPLETED'
                                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100'
                                      : 'border-slate-200 bg-slate-50 text-slate-600'
                              }`}
                            >
                              {apt.status === 'CONFIRMED'
                                ? '✓ Đã xác nhận'
                                : apt.status === 'PENDING'
                                  ? '◷ Chờ xác nhận'
                                  : apt.status === 'COMPLETED'
                                    ? '★ Hoàn thành'
                                    : apt.status}
                            </motion.span>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              className="rounded-lg p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Payments Tab */
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="p-0"
                >
                  {isLoading ? (
                    <div className="flex h-[320px] items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-8 w-8 text-emerald-500" />
                      </motion.div>
                    </div>
                  ) : recentPayments.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex h-[320px] flex-col items-center justify-center gap-3 text-slate-500"
                    >
                      <div className="rounded-full bg-slate-100 p-4">
                        <CreditCard className="h-12 w-12 text-slate-400" />
                      </div>
                      <p className="font-medium">Chưa có giao dịch nào</p>
                      <p className="text-sm text-slate-400">Các giao dịch sẽ hiển thị ở đây</p>
                    </motion.div>
                  ) : (
                    <div className="divide-y divide-slate-100/50">
                      {recentPayments.slice(0, 6).map((p, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                          whileHover={{
                            backgroundColor: 'rgba(248, 250, 252, 0.8)',
                            x: 4,
                          }}
                          className="group flex cursor-pointer items-center justify-between p-4 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                                p.status === 'PAID'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                                  : p.status === 'PENDING'
                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                                    : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                              }`}
                            >
                              {p.status === 'PAID' ? (
                                <CheckCircle2 className="h-6 w-6 text-white" />
                              ) : p.status === 'PENDING' ? (
                                <Clock className="h-6 w-6 text-white" />
                              ) : (
                                <XCircle className="h-6 w-6 text-white" />
                              )}
                            </motion.div>
                            <div>
                              <p className="font-semibold text-slate-900">{p.patientName}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                {p.description && (
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">
                                    {p.description}
                                  </span>
                                )}
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-600">
                                  {p.invoiceId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <motion.p
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-lg font-bold text-slate-900"
                              >
                                {formatCurrency(p.amount)}
                              </motion.p>
                              <p className="flex items-center justify-end gap-1 text-xs text-slate-500">
                                <span
                                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    p.method === 'PayOS' ? 'bg-violet-500' : 'bg-slate-400'
                                  }`}
                                />
                                {p.method}
                              </p>
                            </div>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              className="rounded-lg p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-t border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-white/50 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{invoiceSummary.paid}</span>{' '}
                    thành công
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{invoiceSummary.pending}</span>{' '}
                    đang chờ
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{invoiceSummary.failed}</span>{' '}
                    thất bại
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-400" suppressHydrationWarning>
                Cập nhật lúc {format(new Date(), 'HH:mm', { locale: vi })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
