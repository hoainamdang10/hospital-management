'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Users,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    Filter,
    X,
    Stethoscope,
    Building2,
    User,
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { appointmentsService } from '@/lib/api/appointments.service';
import { searchStaff } from '@/lib/api/staff.service';
import { departmentsService } from '@/lib/api/departments.service';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout';

// ============================================================================
// TYPES
// ============================================================================
interface Appointment {
    id: string;
    appointmentId: string;
    patientName: string;
    doctorName: string;
    doctorId: string;
    departmentName: string;
    departmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    type: string;
    paymentStatus?: string;
}

interface Doctor {
    id: string;
    fullName: string;
    departmentId?: string;
}

interface Department {
    id: string;
    code: string;
    name: string;
}

// ============================================================================
// CONSTANTS - Healthcare Theme Colors
// ============================================================================
const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    SCHEDULED: {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        label: 'Đã đặt',
    },
    CONFIRMED: {
        bg: 'bg-cyan-50',
        text: 'text-cyan-700',
        border: 'border-cyan-200',
        dot: 'bg-cyan-500',
        label: 'Đã xác nhận',
    },
    CHECKED_IN: {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
        label: 'Đã check-in',
    },
    IN_PROGRESS: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Đang khám',
    },
    COMPLETED: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Hoàn thành',
    },
    CANCELLED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500',
        label: 'Đã hủy',
    },
    NO_SHOW: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500',
        label: 'Không đến',
    },
};

// ============================================================================
// DAY DETAIL MODAL
// ============================================================================
interface DayDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    appointments: Appointment[];
    onViewAppointment: (id: string) => void;
}

function DayDetailModal({ isOpen, onClose, date, appointments, onViewAppointment }: DayDetailModalProps) {
    if (!isOpen || !date) return null;

    const getStatusConfig = (status: string) => {
        return statusConfig[status] || statusConfig.SCHEDULED;
    };

    // Sort appointments by time
    const sortedAppts = [...appointments].sort((a, b) =>
        (a.appointmentTime || '').localeCompare(b.appointmentTime || '')
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-50"
                        onClick={onClose}
                    />
                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b bg-gradient-to-r from-cyan-50 to-teal-50 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </h2>
                                <p className="text-sm text-slate-500">{appointments.length} lịch hẹn</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Appointments List */}
                        <div className="max-h-[calc(80vh-100px)] overflow-y-auto p-4 space-y-3">
                            {sortedAppts.map((apt) => {
                                const config = getStatusConfig(apt.status);
                                return (
                                    <motion.div
                                        key={apt.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            'rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md',
                                            config.bg,
                                            config.border
                                        )}
                                        onClick={() => {
                                            onViewAppointment(apt.id);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                                                    <Clock className="h-5 w-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {apt.appointmentTime?.substring(0, 5)}
                                                    </p>
                                                    <p className="text-sm text-slate-600">{apt.patientName}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-xs font-medium px-2 py-1 rounded-full',
                                                    config.bg,
                                                    config.text,
                                                    'border',
                                                    config.border
                                                )}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded">
                                                <Stethoscope className="h-3 w-3" />
                                                {apt.doctorName}
                                            </span>
                                            <span className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded">
                                                <Building2 className="h-3 w-3" />
                                                {apt.departmentName}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AppointmentCalendarPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');

    // Day Detail Modal
    const [selectedDayModal, setSelectedDayModal] = useState<{
        isOpen: boolean;
        date: Date | null;
    }>({ isOpen: false, date: null });

    // Filtered appointments (client-side filtering)
    const appointments = useMemo(() => {
        let filtered = [...allAppointments];

        // Filter by department (using departmentId or departmentName)
        if (selectedDepartment !== 'ALL') {
            filtered = filtered.filter(
                (apt) =>
                    apt.departmentId === selectedDepartment ||
                    apt.departmentName?.toLowerCase().includes(selectedDepartment.toLowerCase())
            );
        }

        // Filter by doctor
        if (selectedDoctor !== 'ALL') {
            filtered = filtered.filter((apt) => apt.doctorId === selectedDoctor);
        }

        // Filter by status
        if (selectedStatus !== 'ALL') {
            filtered = filtered.filter((apt) => apt.status?.toUpperCase() === selectedStatus);
        }

        return filtered;
    }, [allAppointments, selectedDepartment, selectedDoctor, selectedStatus]);

    // Stats
    const stats = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayAppts = appointments.filter((apt) => apt.appointmentDate === today);
        const confirmed = appointments.filter(
            (apt) => apt.status?.toUpperCase() === 'CONFIRMED'
        ).length;
        const completed = appointments.filter(
            (apt) => apt.status?.toUpperCase() === 'COMPLETED'
        ).length;
        const cancelled = appointments.filter(
            (apt) => apt.status?.toUpperCase() === 'CANCELLED'
        ).length;

        return {
            total: appointments.length,
            todayCount: todayAppts.length,
            confirmed,
            completed,
            cancelled,
        };
    }, [appointments]);

    // Fetch doctors (using staff service)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [deptRes, docRes] = await Promise.all([
                    departmentsService.getDepartments(),
                    searchStaff({ staffType: 'doctor', limit: 100 }),
                ]);

                if (deptRes) {
                    setDepartments(
                        deptRes.map((d: any) => ({
                            id: d.id,
                            code: d.departmentCode,
                            name: d.departmentNameVi || d.departmentNameEn,
                        }))
                    );
                }

                if (docRes?.success && docRes.data?.items) {
                    setDoctors(
                        docRes.data.items.map((d: any) => ({
                            id: d.staffId || d.id,
                            fullName: d.fullName,
                            departmentId: d.departmentId,
                        }))
                    );
                }
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch appointments when date changes
    useEffect(() => {
        const fetchAppointments = async () => {
            if (isRefreshing) return;
            setIsLoading(true);
            try {
                const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
                const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

                const res = await appointmentsService.list({
                    startDate: start,
                    endDate: end,
                    pageSize: 500, // Get all for calendar view
                });

                if (res.success && res.appointments) {
                    const mapped = res.appointments.map((apt: any) => ({
                        id: apt.id || apt.appointmentId,
                        appointmentId: apt.appointmentId,
                        patientName: apt.patientName || apt.patientFullName || 'N/A',
                        doctorName: apt.doctorName || apt.doctorFullName || 'N/A',
                        doctorId: apt.doctorId || apt.doctor?.doctorId || '',
                        departmentName: apt.doctorDepartment || apt.departmentId || 'Khoa chung',
                        departmentId: apt.departmentId || '',
                        appointmentDate: apt.appointmentDate,
                        appointmentTime: apt.appointmentTime,
                        status: apt.status,
                        type: apt.type,
                        paymentStatus: apt.paymentStatus,
                    }));
                    setAllAppointments(mapped);
                }
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, [currentDate]);

    // Refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

            const res = await appointmentsService.list({
                startDate: start,
                endDate: end,
                pageSize: 500,
            });

            if (res.success && res.appointments) {
                const mapped = res.appointments.map((apt: any) => ({
                    id: apt.id || apt.appointmentId,
                    appointmentId: apt.appointmentId,
                    patientName: apt.patientName || apt.patientFullName || 'N/A',
                    doctorName: apt.doctorName || apt.doctorFullName || 'N/A',
                    doctorId: apt.doctorId || apt.doctor?.doctorId || '',
                    departmentName: apt.doctorDepartment || apt.departmentId || 'Khoa chung',
                    departmentId: apt.departmentId || '',
                    appointmentDate: apt.appointmentDate,
                    appointmentTime: apt.appointmentTime,
                    status: apt.status,
                    type: apt.type,
                    paymentStatus: apt.paymentStatus,
                }));
                setAllAppointments(mapped);
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const getDayAppointments = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return appointments.filter((apt) => apt.appointmentDate === dateStr);
    };

    const getStatusConfig = (status: string) => {
        return statusConfig[status?.toUpperCase()] || statusConfig.SCHEDULED;
    };

    // Navigation handlers
    const goToPrevious = () => {
        if (viewMode === 'MONTH') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const goToNext = () => {
        if (viewMode === 'MONTH') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSelectedDepartment('ALL');
        setSelectedDoctor('ALL');
        setSelectedStatus('ALL');
    };

    const hasActiveFilters =
        selectedDepartment !== 'ALL' || selectedDoctor !== 'ALL' || selectedStatus !== 'ALL';

    return (
        <DashboardLayout>
            <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
                {/* Header with glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
                            <CalendarIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                                Lịch làm việc
                            </h1>
                            <p className="text-slate-500">Theo dõi lịch hẹn theo tháng/tuần</p>
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goToPrevious}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </motion.button>

                        <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
                            <span className="font-semibold text-slate-800">
                                {format(currentDate, 'MMMM yyyy', { locale: vi })}
                            </span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goToNext}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentDate(new Date())}
                            className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-cyan-500/25 transition-all hover:shadow-lg hover:shadow-cyan-500/30"
                        >
                            Hôm nay
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-cyan-300 hover:shadow-md disabled:opacity-50"
                        >
                            <RefreshCw
                                className={cn('h-4 w-4 text-slate-600', isRefreshing && 'animate-spin')}
                            />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="grid grid-cols-2 gap-3 md:grid-cols-5 shrink-0"
                >
                    {[
                        { label: 'Tổng lịch hẹn', value: stats.total, icon: CalendarIcon, color: 'cyan' },
                        { label: 'Hôm nay', value: stats.todayCount, icon: Clock, color: 'teal' },
                        { label: 'Đã xác nhận', value: stats.confirmed, icon: CheckCircle2, color: 'blue' },
                        { label: 'Hoàn thành', value: stats.completed, icon: Users, color: 'emerald' },
                        { label: 'Đã hủy', value: stats.cancelled, icon: XCircle, color: 'red' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            className={cn(
                                'group relative overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer',
                                stat.color === 'cyan' && 'border-cyan-100 hover:border-cyan-200',
                                stat.color === 'teal' && 'border-teal-100 hover:border-teal-200',
                                stat.color === 'blue' && 'border-blue-100 hover:border-blue-200',
                                stat.color === 'emerald' && 'border-emerald-100 hover:border-emerald-200',
                                stat.color === 'red' && 'border-red-100 hover:border-red-200'
                            )}
                            onClick={() => {
                                // Quick filter by status
                                if (stat.label === 'Đã xác nhận') setSelectedStatus('CONFIRMED');
                                else if (stat.label === 'Hoàn thành') setSelectedStatus('COMPLETED');
                                else if (stat.label === 'Đã hủy') setSelectedStatus('CANCELLED');
                                else setSelectedStatus('ALL');
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                                    <p className="mt-0.5 text-xl font-bold text-slate-800">{stat.value}</p>
                                </div>
                                <div
                                    className={cn(
                                        'flex h-9 w-9 items-center justify-center rounded-lg',
                                        stat.color === 'cyan' && 'bg-cyan-50 text-cyan-600',
                                        stat.color === 'teal' && 'bg-teal-50 text-teal-600',
                                        stat.color === 'blue' && 'bg-blue-50 text-blue-600',
                                        stat.color === 'emerald' && 'bg-emerald-50 text-emerald-600',
                                        stat.color === 'red' && 'bg-red-50 text-red-600'
                                    )}
                                >
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Filters with glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex flex-wrap gap-3 items-center rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-3 shadow-sm shrink-0"
                >
                    <div className="flex items-center gap-2 text-slate-600">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Bộ lọc:</span>
                    </div>

                    {/* Department Filter */}
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="w-[180px] rounded-lg border-slate-200 bg-white text-sm">
                            <Building2 className="h-4 w-4 text-slate-400 mr-2" />
                            <SelectValue placeholder="Tất cả khoa" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả khoa</SelectItem>
                            {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Doctor Filter */}
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger className="w-[180px] rounded-lg border-slate-200 bg-white text-sm">
                            <User className="h-4 w-4 text-slate-400 mr-2" />
                            <SelectValue placeholder="Tất cả bác sĩ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả bác sĩ</SelectItem>
                            {doctors.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                    {d.fullName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[160px] rounded-lg border-slate-200 bg-white text-sm">
                            <CheckCircle2 className="h-4 w-4 text-slate-400 mr-2" />
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            <SelectItem value="SCHEDULED">Đã đặt</SelectItem>
                            <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                            <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                            <SelectItem value="IN_PROGRESS">Đang khám</SelectItem>
                            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                        >
                            <X className="h-4 w-4" />
                            Xóa bộ lọc
                        </button>
                    )}

                    {/* View Mode Toggle */}
                    <div className="ml-auto flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={cn(
                                'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                                viewMode === 'MONTH'
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                            )}
                        >
                            Tháng
                        </button>
                        <button
                            onClick={() => setViewMode('WEEK')}
                            className={cn(
                                'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                                viewMode === 'WEEK'
                                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                            )}
                        >
                            Tuần
                        </button>
                    </div>
                </motion.div>

                {/* Calendar Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="flex-1 rounded-xl border border-slate-200/80 bg-white overflow-hidden flex flex-col min-h-0 shadow-sm"
                >
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b bg-gradient-to-r from-slate-50 to-slate-100/50 shrink-0">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, idx) => (
                            <div
                                key={day}
                                className={cn(
                                    'p-2 text-center text-sm font-semibold',
                                    idx === 5 || idx === 6 ? 'text-cyan-600' : 'text-slate-600'
                                )}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                                <p className="text-sm text-slate-500">Đang tải lịch hẹn...</p>
                            </div>
                        </div>
                    ) : (
                        /* Days Grid */
                        <div className="grid grid-cols-7 flex-1 min-h-0 overflow-hidden">
                            {calendarDays.map((day) => {
                                const dayAppts = getDayAppointments(day);
                                const isSelectedMonth = isSameMonth(day, monthStart);
                                const isTodayDate = isToday(day);

                                return (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            'border-b border-r p-1.5 flex flex-col cursor-pointer transition-colors',
                                            !isSelectedMonth && 'bg-slate-50/50 text-slate-400',
                                            isTodayDate && 'bg-cyan-50/50',
                                            'hover:bg-cyan-50/30'
                                        )}
                                        style={{ minHeight: '90px' }}
                                        onClick={() => {
                                            if (dayAppts.length > 0) {
                                                setSelectedDayModal({ isOpen: true, date: day });
                                            }
                                        }}
                                    >
                                        {/* Day Header */}
                                        <div className="flex justify-between items-start mb-1 shrink-0">
                                            <span
                                                className={cn(
                                                    'text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full',
                                                    isTodayDate &&
                                                    'bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-sm'
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                            {dayAppts.length > 0 && (
                                                <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded">
                                                    {dayAppts.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Appointments List */}
                                        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                                            {dayAppts.slice(0, 2).map((apt) => {
                                                const config = getStatusConfig(apt.status);
                                                return (
                                                    <div
                                                        key={apt.id}
                                                        className={cn(
                                                            'text-[10px] px-1 py-0.5 rounded border cursor-pointer transition-all truncate',
                                                            config.bg,
                                                            config.text,
                                                            config.border,
                                                            'hover:opacity-80'
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/admin/appointments/${apt.id}`);
                                                        }}
                                                        title={`${apt.patientName} - BS. ${apt.doctorName}`}
                                                    >
                                                        <span className="font-medium">
                                                            {apt.appointmentTime?.substring(0, 5)}
                                                        </span>{' '}
                                                        {apt.patientName?.split(' ').pop()}
                                                    </div>
                                                );
                                            })}
                                            {dayAppts.length > 2 && (
                                                <button className="text-[10px] text-cyan-600 hover:text-cyan-700 font-medium text-left px-1">
                                                    +{dayAppts.length - 2} khác
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Day Detail Modal */}
            <DayDetailModal
                isOpen={selectedDayModal.isOpen}
                onClose={() => setSelectedDayModal({ isOpen: false, date: null })}
                date={selectedDayModal.date}
                appointments={selectedDayModal.date ? getDayAppointments(selectedDayModal.date) : []}
                onViewAppointment={(id) => router.push(`/admin/appointments/${id}`)}
            />
        </DashboardLayout>
    );
}
