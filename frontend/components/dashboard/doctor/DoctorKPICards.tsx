'use client';

import { Calendar, Users, CheckCircle, Clock, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { DoctorDashboardStats } from '@/lib/api/doctor-dashboard.service';

interface DoctorKPICardsProps {
    stats: DoctorDashboardStats | null;
    loading: boolean;
}

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: React.ReactNode;
    icon: React.ElementType;
    iconColor: string;
    iconBgColor: string;
    delay?: number;
}

function KPICard({ title, value, subtitle, icon: Icon, iconColor, iconBgColor, delay = 0 }: KPICardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
        >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                    {subtitle && (
                        <div className="text-sm text-slate-500">{subtitle}</div>
                    )}
                </div>

                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBgColor} transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
            </div>
        </motion.div>
    );
}

function KPICardSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
        </div>
    );
}

export function DoctorKPICards({ stats, loading }: DoctorKPICardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <KPICardSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Appointments Today */}
            <KPICard
                title="Lịch hẹn hôm nay"
                value={stats?.todayAppointmentsCount ?? 0}
                subtitle={
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {stats?.paidCount ?? 0} Đã thanh toán
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {stats?.unpaidCount ?? 0} Chờ TT
                        </span>
                    </div>
                }
                icon={Calendar}
                iconColor="text-cyan-600"
                iconBgColor="bg-cyan-50"
                delay={0.1}
            />

            {/* Patients Seen */}
            <KPICard
                title="Bệnh nhân đã khám"
                value={stats?.completedCount ?? 0}
                subtitle={
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{stats?.remainingCount ?? 0} còn lại hôm nay</span>
                    </div>
                }
                icon={CheckCircle}
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-50"
                delay={0.2}
            />

            {/* Payment Rate */}
            <KPICard
                title="Tỉ lệ thanh toán"
                value={`${stats?.paymentRate ?? 0}%`}
                subtitle={
                    <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        <span>{stats?.paidCount ?? 0}/{stats?.todayAppointmentsCount ?? 0} đã thanh toán</span>
                    </div>
                }
                icon={TrendingUp}
                iconColor="text-violet-600"
                iconBgColor="bg-violet-50"
                delay={0.3}
            />

            {/* Average Time */}
            <KPICard
                title="Thời gian trung bình"
                value={`${stats?.averageTimeMinutes ?? 0} phút`}
                subtitle={
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Mỗi bệnh nhân</span>
                    </div>
                }
                icon={Clock}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
                delay={0.4}
            />
        </div>
    );
}
