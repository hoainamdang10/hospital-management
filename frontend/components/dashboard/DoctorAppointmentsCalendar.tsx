'use client';

import { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Calendar as CalendarIcon,
    Clock,
    User,
    CheckCircle,
    AlertCircle,
    Bell,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DoctorAppointment {
    id: string;
    patientName: string;
    appointmentTime: string;
    appointmentDate?: string;
    reason: string;
    status: string;
    paymentStatus: string;
}

interface DoctorAppointmentsCalendarProps {
    appointments: DoctorAppointment[];
    loading: boolean;
}

export function DoctorAppointmentsCalendar({ appointments, loading }: DoctorAppointmentsCalendarProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const handlePrevWeek = () => {
        setWeekStart(addDays(weekStart, -7));
    };

    const handleNextWeek = () => {
        setWeekStart(addDays(weekStart, 7));
    };

    // Filter appointments for selected date
    const appointmentsForSelectedDate = appointments.filter((appointment) => {
        if (!appointment.appointmentDate) {
            // If no date, assume it's today
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
                color: 'bg-green-50 text-green-700 border-green-100',
                icon: CheckCircle,
            };
        }
        return {
            label: 'Chưa thanh toán',
            color: 'bg-red-50 text-red-700 border-red-100',
            icon: AlertCircle,
        };
    };

    const getStatusConfig = (status: string) => {
        const normalized = (status || '').toUpperCase();
        switch (normalized) {
            case 'COMPLETED':
                return { label: '  Đã hoàn thành', color: 'bg-slate-50 text-slate-700 border-slate-100' };
            case 'IN_PROGRESS':
                return { label: 'Đang khám', color: 'bg-blue-50 text-blue-700 border-blue-100' };
            case 'WAITING':
            case 'CONFIRMED':
                return { label: 'Đang chờ', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
            case 'SCHEDULED':
                return { label: 'Đã đặt lịch', color: 'bg-gray-50 text-gray-700 border-gray-100' };
            default:
                return { label: normalized, color: 'bg-gray-50 text-gray-700 border-gray-100' };
        }
    };

    if (loading) {
        return (
            <div className="rounded-3xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-xl">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex animate-pulse gap-4">
                            <div className="h-20 flex-1 rounded-xl bg-gray-100" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-white/50 bg-white/60 shadow-xl backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white/50 px-6 py-4">
                <h2 className="text-lg font-bold text-gray-900">Lịch làm việc hôm nay</h2>
            </div>

            <div className="p-6">
                {/* Mini Calendar */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                            Tháng {format(weekStart, 'M, yyyy')}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={handlePrevWeek}
                                className="rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="rounded-full p-1.5 text-gray-600 transition-colors hover:bg-gray-100"
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
                                        'flex flex-col items-center justify-center rounded-2xl py-3 transition-all duration-200',
                                        isSelected
                                            ? 'bg-blue-600 shadow-blue-600/30 scale-105 text-white shadow-lg'
                                            : isToday
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                    )}
                                >
                                    <span className="mb-1 text-xs font-medium opacity-80">
                                        {format(day, 'EEE', { locale: vi }).toUpperCase()}
                                    </span>
                                    <span className="text-lg font-bold">{format(day, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Appointments List */}
                <div className="space-y-4">
                    {appointmentsForSelectedDate.length > 0 ? (
                        appointmentsForSelectedDate.map((appointment) => {
                            const paymentConfig = getPaymentStatusConfig(appointment.paymentStatus);
                            const statusConfig = getStatusConfig(appointment.status);
                            const PaymentIcon = paymentConfig.icon;

                            return (
                                <div
                                    key={appointment.id}
                                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white/50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-md sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">{appointment.patientName}</h4>
                                                <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', paymentConfig.color)}>
                                                    <PaymentIcon className="h-3 w-3" />
                                                    {paymentConfig.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{appointment.reason}</p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {appointment.appointmentTime}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                                        {appointment.paymentStatus.toUpperCase() !== 'PAID' && (
                                            <button
                                                className="flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                                                onClick={() => alert('Gửi nhắc thanh toán!')}
                                            >
                                                <Bell className="h-3 w-3" />
                                                Nhắc thanh toán
                                            </button>
                                        )}

                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap',
                                                statusConfig.color
                                            )}
                                        >
                                            {statusConfig.label}
                                        </span>

                                        <button className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 rounded-full bg-blue-50 p-3">
                                <CalendarIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <p className="font-medium text-gray-900">Không có lịch hẹn nào trong ngày này</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Kiểm tra lịch làm việc để xem các ngày khác
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
