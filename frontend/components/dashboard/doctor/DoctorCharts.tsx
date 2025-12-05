'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { DoctorDashboardStats } from '@/lib/api/doctor-dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';

interface DoctorChartsProps {
    stats: DoctorDashboardStats | null;
    loading: boolean;
}

// Custom colors for charts - Healthcare theme
const CHART_COLORS = {
    primary: '#0891b2', // cyan-600
    secondary: '#14b8a6', // teal-500
    accent: '#a855f7', // violet-500
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    muted: '#94a3b8', // slate-400
};

const PAYMENT_COLORS = {
    paid: '#10b981', // emerald
    pending: '#f59e0b', // amber
    unpaid: '#ef4444', // red
};

export function DoctorCharts({ stats, loading }: DoctorChartsProps) {
    // Calculate weekly appointments data
    const weeklyAppointmentsData = useMemo(() => {
        if (!stats?.todayAppointments) return [];

        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        return days.map((day) => {
            const dayAppointments = stats.todayAppointments.filter((apt) => {
                if (!apt.appointmentDate) return isSameDay(day, today);
                try {
                    return isSameDay(parseISO(apt.appointmentDate), day);
                } catch {
                    return false;
                }
            });

            return {
                name: format(day, 'EEE', { locale: vi }),
                fullDate: format(day, 'dd/MM'),
                appointments: dayAppointments.length,
                isToday: isSameDay(day, today),
            };
        });
    }, [stats?.todayAppointments]);

    // Calculate payment status data
    const paymentStatusData = useMemo(() => {
        if (!stats) {
            return [
                { name: 'Đã thanh toán', value: 0, color: PAYMENT_COLORS.paid },
                { name: 'Đang chờ', value: 0, color: PAYMENT_COLORS.pending },
                { name: 'Chưa thanh toán', value: 0, color: PAYMENT_COLORS.unpaid },
            ];
        }

        // For simplicity, we calculate based on the todayAppointments
        const appointments = stats.todayAppointments || [];

        const paid = appointments.filter(
            (apt) => (apt.paymentStatus || '').toUpperCase() === 'PAID'
        ).length;

        const pending = appointments.filter(
            (apt) => (apt.paymentStatus || '').toUpperCase() === 'PENDING'
        ).length;

        const unpaid = appointments.filter(
            (apt) => {
                const status = (apt.paymentStatus || '').toUpperCase();
                return status !== 'PAID' && status !== 'PENDING';
            }
        ).length;

        return [
            { name: 'Đã thanh toán', value: paid, color: PAYMENT_COLORS.paid },
            { name: 'Đang chờ', value: pending, color: PAYMENT_COLORS.pending },
            { name: 'Chưa thanh toán', value: unpaid, color: PAYMENT_COLORS.unpaid },
        ].filter(item => item.value > 0);
    }, [stats]);

    // Calculate visit types data
    const visitTypesData = useMemo(() => {
        if (!stats?.todayAppointments) return [];

        const appointments = stats.todayAppointments;
        const typeCounts: Record<string, number> = {};

        appointments.forEach((apt) => {
            const type = apt.type || 'CONSULTATION';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const typeLabels: Record<string, string> = {
            CONSULTATION: 'Khám mới',
            FOLLOW_UP: 'Tái khám',
            CHECKUP: 'Kiểm tra',
            EMERGENCY: 'Cấp cứu',
        };

        return Object.entries(typeCounts).map(([type, count]) => ({
            name: typeLabels[type] || type,
            value: count,
            color: type === 'CONSULTATION' ? CHART_COLORS.primary :
                type === 'FOLLOW_UP' ? CHART_COLORS.secondary :
                    type === 'EMERGENCY' ? CHART_COLORS.danger : CHART_COLORS.accent,
        }));
    }, [stats?.todayAppointments]);

    // Custom tooltip for bar chart
    const CustomBarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-cyan-600">{payload[0].value}</span> lịch hẹn
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom tooltip for pie chart
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-slate-900">{payload[0].name}</p>
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold" style={{ color: payload[0].payload.color }}>
                            {payload[0].value}
                        </span> lịch hẹn
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                        <Skeleton className="mb-4 h-6 w-40" />
                        <Skeleton className="h-48" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {/* Weekly Appointments Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
                        <BarChart3 className="h-4 w-4 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Lịch hẹn trong tuần</h3>
                </div>
                <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyAppointmentsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomBarTooltip />} />
                            <Bar
                                dataKey="appointments"
                                fill={CHART_COLORS.primary}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Payment Status Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
            >
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                        <PieChartIcon className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Trạng thái thanh toán</h3>
                </div>
                <div className="p-4">
                    {paymentStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={paymentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {paymentStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                            <PieChartIcon className="mb-2 h-8 w-8" />
                            <p className="text-sm">Chưa có dữ liệu</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Visit Types Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2 xl:col-span-1"
            >
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Loại khám</h3>
                </div>
                <div className="p-4">
                    {visitTypesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={visitTypesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {visitTypesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                            <Activity className="mb-2 h-8 w-8" />
                            <p className="text-sm">Chưa có dữ liệu</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
