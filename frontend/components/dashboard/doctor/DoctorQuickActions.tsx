'use client';

import { Clock, User, ChevronRight, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    iconColor: string;
    iconBgColor: string;
}

const quickActions: QuickAction[] = [
    {
        title: 'Danh sách khám',
        description: 'Xem tất cả lịch hẹn',
        href: '/doctor/appointments',
        icon: Stethoscope,
        iconColor: 'text-cyan-600',
        iconBgColor: 'bg-cyan-50',
    },
    {
        title: 'Lịch làm việc',
        description: 'Quản lý lịch tuần',
        href: '/doctor/schedule',
        icon: Clock,
        iconColor: 'text-violet-600',
        iconBgColor: 'bg-violet-50',
    },
    {
        title: 'Hồ sơ cá nhân',
        description: 'Thông tin & cài đặt',
        href: '/doctor/profile',
        icon: User,
        iconColor: 'text-emerald-600',
        iconBgColor: 'bg-emerald-50',
    },
];

export function DoctorQuickActions() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <h3 className="font-semibold text-slate-900">Hành động nhanh</h3>
            </div>

            {/* Actions List */}
            <div className="divide-y divide-slate-100">
                {quickActions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="group flex items-center gap-4 px-5 py-4 transition-all duration-200 hover:bg-slate-50"
                    >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBgColor} transition-transform duration-200 group-hover:scale-105`}>
                            <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{action.title}</p>
                            <p className="text-sm text-slate-500">{action.description}</p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
