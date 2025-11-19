'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    MapPin,
    MoreHorizontal,
    Loader2
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    startOfWeek,
    endOfWeek,
    addDays
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { appointmentsService } from '@/lib/api/appointments.service';
import { doctorsService } from '@/lib/api/doctors.service';
import { departmentsService } from '@/lib/api/departments.service';
import { cn } from '@/lib/utils';

interface Appointment {
    id: string;
    appointmentId: string;
    patientName: string;
    doctorName: string;
    departmentName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
    type: string;
}

interface Doctor {
    id: string;
    fullName: string;
}

interface Department {
    id: string;
    code: string;
    name: string;
}

export default function AppointmentCalendarPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
    const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');

    // Fetch initial metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [deptRes, docRes] = await Promise.all([
                    departmentsService.getDepartments(),
                    doctorsService.getDoctors({})
                ]);

                if (deptRes) {
                    setDepartments(deptRes.map((d: any) => ({
                        id: d.id,
                        code: d.departmentCode,
                        name: d.departmentNameVi || d.departmentNameEn
                    })));
                }

                if (docRes && docRes.data) {
                    setDoctors(docRes.data.map((d: any) => ({
                        id: d.id,
                        fullName: d.fullName
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch appointments when date or filters change
    useEffect(() => {
        const fetchAppointments = async () => {
            setIsLoading(true);
            try {
                const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
                const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

                const res = await appointmentsService.getAppointments({
                    startDate: start,
                    endDate: end,
                    doctorId: selectedDoctor !== 'ALL' ? selectedDoctor : undefined,
                    // departmentId: selectedDepartment !== 'ALL' ? selectedDepartment : undefined // API might not support dept filter directly yet
                });

                if (res.success && res.data) {
                    const mapped = res.data.map((apt: any) => ({
                        id: apt.id,
                        appointmentId: apt.appointmentId,
                        patientName: apt.patientName || 'N/A',
                        doctorName: apt.doctorName || 'N/A',
                        departmentName: apt.departmentId || 'General',
                        appointmentDate: apt.appointmentDate,
                        appointmentTime: apt.appointmentTime,
                        status: apt.status,
                        type: apt.type
                    }));
                    setAppointments(mapped);
                }
            } catch (error) {
                console.error('Failed to fetch appointments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, [currentDate, selectedDoctor, selectedDepartment]);

    // Calendar Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getDayAppointments = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return appointments.filter(apt => apt.appointmentDate === dateStr);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lịch làm việc</h1>
                    <p className="text-muted-foreground">
                        Theo dõi lịch hẹn theo tháng/tuần
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[150px] text-center font-semibold text-lg">
                        {format(currentDate, 'MMMM yyyy', { locale: vi })}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Hôm nay
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg border shrink-0">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Tất cả khoa" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả khoa</SelectItem>
                        {departments.map(d => (
                            <SelectItem key={d.id} value={d.code}>{d.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Tất cả bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả bác sĩ</SelectItem>
                        {doctors.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="ml-auto flex gap-2">
                    <Button
                        variant={viewMode === 'MONTH' ? 'default' : 'outline'}
                        onClick={() => setViewMode('MONTH')}
                        size="sm"
                    >
                        Tháng
                    </Button>
                    <Button
                        variant={viewMode === 'WEEK' ? 'default' : 'outline'}
                        onClick={() => setViewMode('WEEK')}
                        size="sm"
                    >
                        Tuần
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 border rounded-lg bg-card overflow-hidden flex flex-col min-h-0">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b bg-muted/40 shrink-0">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                        <div key={day} className="p-3 text-center font-semibold text-sm text-muted-foreground">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 grid-rows-5 flex-1 min-h-0">
                    {calendarDays.map((day, dayIdx) => {
                        const dayAppts = getDayAppointments(day);
                        const isSelectedMonth = isSameMonth(day, monthStart);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "border-b border-r p-2 min-h-[100px] relative transition-colors hover:bg-accent/20 flex flex-col gap-1",
                                    !isSelectedMonth && "bg-muted/10 text-muted-foreground",
                                    isToday(day) && "bg-primary/5"
                                )}
                                onClick={() => {
                                    // Optional: Click to add appointment on this day
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                        isToday(day) && "bg-primary text-primary-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayAppts.length > 0 && (
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {dayAppts.length} lịch
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar mt-1">
                                    {dayAppts.slice(0, 3).map((apt) => (
                                        <HoverCard key={apt.id}>
                                            <HoverCardTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "text-xs p-1.5 rounded border truncate cursor-pointer transition-all hover:opacity-80",
                                                        getStatusColor(apt.status)
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/appointments/${apt.id}`);
                                                    }}
                                                >
                                                    <span className="font-semibold mr-1">{apt.appointmentTime.substring(0, 5)}</span>
                                                    {apt.patientName}
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-80">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-sm font-semibold">{apt.patientName}</h4>
                                                        <Badge variant="outline">{apt.status}</Badge>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-3 w-3" />
                                                            BS. {apt.doctorName}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(apt.appointmentDate), 'dd/MM/yyyy')} - {apt.appointmentTime}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3 w-3" />
                                                            {apt.departmentName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    ))}
                                    {dayAppts.length > 3 && (
                                        <div className="text-xs text-center text-muted-foreground py-1 cursor-pointer hover:text-primary">
                                            + {dayAppts.length - 3} nữa
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
