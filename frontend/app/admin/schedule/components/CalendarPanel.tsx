'use client';

import { Calendar, ChevronLeft, ChevronRight, Plus, User, Stethoscope, Filter } from 'lucide-react';
import { useState } from 'react';

interface CalendarPanelProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    appointments: any[];
    selectedDoctor: string;
    onDoctorChange: (doctorId: string) => void;
    selectedDepartment: string;
    onDepartmentChange: (dept: string) => void;
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    doctors: any[];
    onAddAppointment: () => void;
}

export function CalendarPanel({
    selectedDate,
    onDateSelect,
    appointments,
    selectedDoctor,
    onDoctorChange,
    selectedDepartment,
    onDepartmentChange,
    selectedStatus,
    onStatusChange,
    doctors,
    onAddAppointment,
}: CalendarPanelProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
    const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        onDateSelect(newDate);
    };

    const getAppointmentCount = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toISOString().split('T')[0];
        return appointments.filter((apt) => apt.date === dateString).length;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    const isSelected = (day: number) => {
        return (
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()
        );
    };

    // Generate calendar days
    const calendarDays = [];
    // Empty cells for days before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <div className="space-y-4">
            {/* Calendar Card */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            {monthNames[currentMonth]} {currentYear}
                        </h3>
                        <div className="flex gap-1">
                            <button
                                onClick={handlePrevMonth}
                                className="rounded-lg p-1.5 transition-colors hover:bg-white/60"
                            >
                                <ChevronLeft className="h-4 w-4 text-slate-600" />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="rounded-lg p-1.5 transition-colors hover:bg-white/60"
                            >
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {/* Weekday headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1">
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-slate-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const aptCount = getAppointmentCount(day);
                            const selected = isSelected(day);
                            const today = isToday(day);

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`group relative aspect-square rounded-lg text-sm font-medium transition-all ${selected
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : today
                                                ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {day}
                                    {aptCount > 0 && !selected && (
                                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600" />
                                    )}
                                    {aptCount > 0 && selected && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold">
                                            •
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters Card */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Filter className="h-4 w-4 text-slate-600" />
                        Bộ lọc
                    </h3>
                </div>

                <div className="space-y-4 p-4">
                    {/* Doctor Filter */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Bác sĩ</label>
                        <select
                            value={selectedDoctor}
                            onChange={(e) => onDoctorChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {doctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Khoa</label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => onDepartmentChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">Tất cả khoa</option>
                            <option value="cardiology">Tim mạch</option>
                            <option value="internal">Nội khoa</option>
                            <option value="surgery">Ngoại khoa</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-600">Trạng thái</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">Tất cả</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Add Appointment Button */}
            <button
                onClick={onAddAppointment}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
            >
                <Plus className="h-5 w-5" />
                Thêm lịch hẹn
            </button>
        </div>
    );
}
