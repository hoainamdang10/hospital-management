'use client';

import { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Calendar as CalendarIcon,
    Stethoscope,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface DoctorAppointment {
    id: string;
    patientName: string;
    appointmentTime: string;
    appointmentDate?: string;
    reason: string;
    status: string;
    paymentStatus: string;
}

interface DoctorScheduleListProps {
    appointments: DoctorAppointment[];
    loading: boolean;
}

export function DoctorScheduleList({ appointments, loading }: DoctorScheduleListProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7));
    const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));

    // Filter appointments for selected date
    const appointmentsForSelectedDate = appointments.filter((appointment) => {
        if (!appointment.appointmentDate) {
            return isSameDay(new Date(), selectedDate);
        }
        try {
            return isSameDay(parseISO(appointment.appointmentDate), selectedDate);
        } catch {
            return false;
        }
    });

    const getPaymentStatusConfig = (paymentStatus: string) => {
        const status = (paymentStatus || '').toUpperCase();
        if (status === 'PAID') {
            return {
                label: 'Đã thanh toán',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-700',
                borderColor: 'border-emerald-200',
                dotColor: 'bg-emerald-500',
            };
        }
        if (status === 'PENDING') {
            return {
                label: 'Đang chờ',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-700',
                borderColor: 'border-amber-200',
                dotColor: 'bg-amber-500',
            };
        }
        return {
            label: 'Chưa thanh toán',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            dotColor: 'bg-red-500',
        };
    };

    const getStatusConfig = (status: string) => {
        const normalized = (status || '').toUpperCase();
        switch (normalized) {
            case 'COMPLETED':
                return { label: 'Hoàn thành', bgColor: 'bg-slate-100', textColor: 'text-slate-600' };
            case 'IN_PROGRESS':
                return { label: 'Đang khám', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' };
            case 'WAITING':
            case 'CONFIRMED':
                return { label: 'Đang chờ', bgColor: 'bg-amber-50', textColor: 'text-amber-700' };
            case 'SCHEDULED':
                return { label: 'Đã đặt lịch', bgColor: 'bg-slate-50', textColor: 'text-slate-600' };
            default:
                return { label: normalized || 'N/A', bgColor: 'bg-slate-50', textColor: 'text-slate-600' };
        }
    };

    if (loading) {
        return (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <Skeleton className="h-6 w-48" />
                </div>
                <div className="p-6">
                    <div className="mb-6 grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
                        <CalendarIcon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Lịch làm việc hôm nay</h2>
                </div>
                <Link
                    href="/doctor/schedule"
                    className="text-sm font-medium text-cyan-600 transition-colors hover:text-cyan-700"
                >
                    Xem tất cả
                </Link>
            </div>

            <div className="p-6">
                {/* Week Selector */}
                <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">
                            Tháng {format(weekStart, 'M, yyyy', { locale: vi })}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handlePrevWeek}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, index) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        'relative flex flex-col items-center justify-center rounded-xl py-2.5 transition-all duration-200',
                                        isSelected
                                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25'
                                            : isToday
                                                ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'
                                                : 'text-slate-600 hover:bg-slate-50'
                                    )}
                                >
                                    <span className={cn('text-[10px] font-medium uppercase', isSelected ? 'text-cyan-100' : 'text-slate-400')}>
                                        {format(day, 'EEE', { locale: vi })}
                                    </span>
                                    <span className="mt-0.5 text-lg font-bold">{format(day, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Appointments List */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {appointmentsForSelectedDate.length > 0 ? (
                            appointmentsForSelectedDate.map((appointment, index) => {
                                const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);
                                const statusConfig = getStatusConfig(appointment.status);

                                return (
                                    <motion.div
                                        key={appointment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group cursor-pointer rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-md"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            {/* Left: Patient Info */}
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white shadow-sm">
                                                    {appointment.patientName.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="font-semibold text-slate-900">{appointment.patientName}</h4>

                                                        {/* Payment Status Badge */}
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                                                            paymentConfig.bgColor,
                                                            paymentConfig.textColor,
                                                            paymentConfig.borderColor
                                                        )}>
                                                            <span className={cn('h-1.5 w-1.5 rounded-full', paymentConfig.dotColor)} />
                                                            {paymentConfig.label}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                                        <Stethoscope className="h-3.5 w-3.5" />
                                                        {appointment.reason || 'Khám tổng quát'}
                                                    </p>

                                                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {appointment.appointmentTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Status and Actions */}
                                            <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                                                <span className={cn(
                                                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                                                    statusConfig.bgColor,
                                                    statusConfig.textColor
                                                )}>
                                                    {statusConfig.label}
                                                </span>

                                                <Link
                                                    href={`/doctor/appointments/${appointment.id}`}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700 opacity-0 transition-all duration-200 hover:bg-cyan-100 group-hover:opacity-100"
                                                >
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12"
                            >
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <CalendarIcon className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="font-medium text-slate-700">Không có lịch hẹn nào</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ngày {format(selectedDate, 'dd/MM/yyyy')} chưa có lịch khám
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
