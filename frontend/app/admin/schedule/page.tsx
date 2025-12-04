'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { CalendarPanel } from './components/CalendarPanel';
import { ScheduleHeader } from './components/ScheduleHeader';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { ListView } from './components/ListView';

type ViewMode = 'day' | 'week' | 'month' | 'list';

// Mock data - Replace with real API
const mockAppointments = [
    {
        id: '1',
        time: '09:00',
        duration: 30,
        doctorId: 'DOC001',
        doctorName: 'BS. Nguyễn Văn An',
        patientName: 'Trần Thị B',
        visitType: 'CONSULTATION',
        status: 'confirmed',
        date: '2025-12-04',
    },
    {
        id: '2',
        time: ' 10:30',
        duration: 45,
        doctorId: 'DOC001',
        doctorName: 'BS. Nguyễn Văn An',
        patientName: 'Lê Văn C',
        visitType: 'FOLLOW_UP',
        status: 'pending',
        date: '2025-12-04',
    },
    {
        id: '3',
        time: '14:00',
        duration: 30,
        doctorId: 'DOC002',
        doctorName: 'BS. Phạm Thị D',
        patientName: 'Hoàng Văn E',
        visitType: 'CONSULTATION',
        status: 'confirmed',
        date: '2025-12-04',
    },
];

const mockDoctors = [
    { id: 'all', name: 'Tất cả bác sĩ', avatar: null },
    { id: 'DOC001', name: 'BS. Nguyễn Văn An', specialty: 'Tim mạch', avatar: 'NA' },
    { id: 'DOC002', name: 'BS. Phạm Thị D', specialty: 'Nội khoa', avatar: 'PD' },
    { id: 'DOC003', name: 'BS. Trần Minh F', specialty: 'Ngoại khoa', avatar: 'TF' },
];

/**
 * Admin Doctor Schedule Page
 * Redesigned with Soft UI Evolution style
 */
export default function AdminSchedulePage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [selectedDoctor, setSelectedDoctor] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Filter appointments based on selected filters
    const filteredAppointments = mockAppointments.filter((apt) => {
        // Filter by doctor
        if (selectedDoctor !== 'all' && apt.doctorId !== selectedDoctor) {
            return false;
        }
        // Filter by status
        if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
            return false;
        }
        // Filter by date (for day view)
        if (viewMode === 'day') {
            const aptDate = new Date(apt.date).toDateString();
            const selected = selectedDate.toDateString();
            return aptDate === selected;
        }
        return true;
    });

    const handleAddAppointment = () => {
        // TODO: Open modal to add appointment
        console.log('Add appointment clicked');
    };

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-50">
                {/* Page Header */}
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[1600px] px-6 py-6">
                        <h1 className="text-2xl font-bold text-slate-900">Doctor Schedule</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage and view all doctor appointments and availability
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mx-auto max-w-[1600px] p-6">
                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Left Panel - Calendar & Filters */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-6">
                                <CalendarPanel
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                    appointments={mockAppointments}
                                    selectedDoctor={selectedDoctor}
                                    onDoctorChange={setSelectedDoctor}
                                    selectedDepartment={selectedDepartment}
                                    onDepartmentChange={setSelectedDepartment}
                                    selectedStatus={selectedStatus}
                                    onStatusChange={setSelectedStatus}
                                    doctors={mockDoctors}
                                    onAddAppointment={handleAddAppointment}
                                />
                            </div>
                        </div>

                        {/* Right Panel - Schedule View */}
                        <div className="lg:col-span-9">
                            <div className="space-y-6">
                                {/* Schedule Header */}
                                <ScheduleHeader
                                    selectedDate={selectedDate}
                                    viewMode={viewMode}
                                    onViewModeChange={setViewMode}
                                    onPrevDay={handlePrevDay}
                                    onNextDay={handleNextDay}
                                    onToday={handleToday}
                                />

                                {/* Schedule Content */}
                                <div className="min-h-[600px]">
                                    {viewMode === 'day' && (
                                        <DayView
                                            selectedDate={selectedDate}
                                            appointments={filteredAppointments}
                                            showDoctorName={selectedDoctor === 'all'}
                                        />
                                    )}
                                    {viewMode === 'week' && (
                                        <WeekView
                                            selectedDate={selectedDate}
                                            appointments={filteredAppointments}
                                            showDoctorName={selectedDoctor === 'all'}
                                        />
                                    )}
                                    {viewMode === 'month' && (
                                        <MonthView
                                            selectedDate={selectedDate}
                                            appointments={mockAppointments}
                                            onDateSelect={setSelectedDate}
                                        />
                                    )}
                                    {viewMode === 'list' && (
                                        <ListView
                                            appointments={filteredAppointments}
                                            selectedDoctor={selectedDoctor}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
