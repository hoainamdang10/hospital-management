'use client';

import { useMemo } from 'react';
import { Clock, User, Loader2, CalendarX } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Appointment {
    id: string;
    patientName: string;
    patientId: string;
    appointmentTime: string;
    appointmentDate: string;
    status: string;
    type: string;
    reason: string;
}

interface CalendarGridProps {
    weekDates: Date[];
    appointments: Appointment[];
    isLoading: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; label: string }> = {
    CONFIRMED: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        label: 'Đã xác nhận',
    },
    CHECKED_IN: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        label: 'Đã đến',
    },
    IN_PROGRESS: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: 'Đang khám',
    },
    COMPLETED: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-600',
        label: 'Đã hoàn thành',
    },
    CANCELLED: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'Đã hủy',
    },
};

const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

/**
 * Calendar Grid Component
 * Weekly time-based grid showing appointments
 */
export function CalendarGrid({ weekDates, appointments, isLoading }: CalendarGridProps) {
    const router = useRouter();

    // Generate time slots from 7am to 10pm
    const timeSlots = useMemo(() => {
        return Array.from({ length: 16 }, (_, i) => i + 7).map(
            (h) => `${h.toString().padStart(2, '0')}:00`
        );
    }, []);

    // Get appointments for a specific slot
    const getAppointmentsForSlot = (dayIndex: number, timeSlot: string) => {
        const slotDate = format(weekDates[dayIndex], 'yyyy-MM-dd');
        const slotHour = parseInt(timeSlot.split(':')[0]);

        return appointments.filter((apt) => {
            if (apt.appointmentDate !== slotDate) return false;
            const aptHour = parseInt(apt.appointmentTime.split(':')[0]);
            return aptHour === slotHour;
        });
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status.toUpperCase()] || STATUS_CONFIG.CONFIRMED;
    };

    // Check if any day has appointments
    const hasAnyAppointments = appointments.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
            <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                    {/* Header Row */}
                    <div className="sticky top-0 z-20 grid grid-cols-8 border-b-2 border-slate-200 bg-slate-50">
                        {/* Time Column Header */}
                        <div className="flex items-center justify-center border-r border-slate-200 p-3">
                            <Clock className="h-5 w-5 text-slate-500" />
                        </div>

                        {/* Day Headers */}
                        {WEEK_DAYS.map((day, index) => {
                            const date = weekDates[index];
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div
                                    key={day}
                                    className={cn(
                                        'border-r border-slate-200 p-3 text-center transition-colors last:border-r-0',
                                        isToday && 'bg-cyan-600 text-white'
                                    )}
                                >
                                    <p className={cn(
                                        'text-sm font-semibold',
                                        isToday ? 'text-white' : 'text-slate-700'
                                    )}>
                                        {day}
                                    </p>
                                    <p className={cn(
                                        'mt-0.5 text-xs',
                                        isToday ? 'text-cyan-100' : 'text-slate-500'
                                    )}>
                                        {format(date, 'dd/MM', { locale: vi })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex h-96 items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                                <p className="text-sm text-slate-600">Đang tải lịch làm việc...</p>
                            </div>
                        </div>
                    ) : !hasAnyAppointments ? (
                        /* Empty State */
                        <div className="flex h-80 flex-col items-center justify-center px-4 text-center">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                <CalendarX className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="mb-1 font-semibold text-slate-700">Không có lịch hẹn nào</h3>
                            <p className="text-sm text-slate-500">
                                Tuần này chưa có bệnh nhân đặt lịch khám
                            </p>
                        </div>
                    ) : (
                        /* Time Slots Grid */
                        <div className="max-h-[600px] overflow-y-auto">
                            {timeSlots.map((time, timeIndex) => (
                                <div
                                    key={time}
                                    className="grid grid-cols-8 border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                                >
                                    {/* Time Label */}
                                    <div className="flex items-start justify-center border-r border-slate-100 bg-slate-50/50 px-2 py-3">
                                        <span className="text-xs font-semibold text-slate-600">{time}</span>
                                    </div>

                                    {/* Day Cells */}
                                    {WEEK_DAYS.map((_, dayIndex) => {
                                        const slotAppointments = getAppointmentsForSlot(dayIndex, time);
                                        const isToday = isSameDay(weekDates[dayIndex], new Date());

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={cn(
                                                    'min-h-[72px] border-r border-slate-100 p-1.5 last:border-r-0',
                                                    isToday && 'bg-cyan-50/30'
                                                )}
                                            >
                                                {slotAppointments.map((apt) => {
                                                    const config = getStatusConfig(apt.status);

                                                    return (
                                                        <motion.div
                                                            key={apt.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: timeIndex * 0.02 }}
                                                            whileHover={{ scale: 1.02, zIndex: 10 }}
                                                            onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                                                            className={cn(
                                                                'mb-1 cursor-pointer rounded-lg border p-2 shadow-sm transition-all hover:shadow-md',
                                                                config.bg,
                                                                config.border,
                                                                config.text
                                                            )}
                                                        >
                                                            {/* Time */}
                                                            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold opacity-80">
                                                                <Clock className="h-3 w-3" />
                                                                {apt.appointmentTime.substring(0, 5)}
                                                            </div>

                                                            {/* Patient Name */}
                                                            <div className="flex items-start gap-1">
                                                                <User className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                                <p className="line-clamp-1 text-xs font-semibold">
                                                                    {apt.patientName}
                                                                </p>
                                                            </div>

                                                            {/* Reason (if available) */}
                                                            {apt.reason && (
                                                                <p className="mt-0.5 line-clamp-1 pl-4 text-[10px] opacity-70">
                                                                    {apt.reason}
                                                                </p>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Status Legend Component  
 * Shows colored pills for each appointment status
 */
export function StatusLegend() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                    <div className={cn(
                        'h-5 w-5 rounded-md border',
                        config.bg,
                        config.border
                    )} />
                    <span className="text-sm font-medium text-slate-600">{config.label}</span>
                </div>
            ))}
        </motion.div>
    );
}
