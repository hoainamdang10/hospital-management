'use client';

import { useEffect, useMemo, useState } from 'react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { DashboardLayout } from '@/components/layout';
import { CalendarPanel } from './components/CalendarPanel';
import { ScheduleHeader } from './components/ScheduleHeader';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { ListView } from './components/ListView';
import { appointmentsService } from '@/lib/api/appointments.service';
import { doctorsService } from '@/lib/api/doctors.service';
import { departmentsService } from '@/lib/api/departments.service';
import type { AppointmentReadModel } from '@/lib/types/appointments';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface ScheduleAppointment {
  id: string;
  appointmentId: string;
  date: string;
  time: string;
  duration: number;
  doctorId: string;
  doctorName: string;
  patientName: string;
  visitType: string;
  status: string;
  departmentId?: string | null;
  departmentName?: string;
}

interface DoctorFilterOption {
  id: string;
  name: string;
  specialty?: string;
  avatar?: string | null;
}

interface DepartmentFilterOption {
  id: string;
  name: string;
}

const formatDateKey = (date: Date): string => date.toISOString().split('T')[0];

const normalizeAppointment = (appointment: AppointmentReadModel): ScheduleAppointment => {
  const date =
    (appointment.appointmentDate && appointment.appointmentDate.split('T')[0]) ||
    appointment.appointmentDate ||
    new Date().toISOString().split('T')[0];
  const rawTime = appointment.appointmentTime || '';
  const time = rawTime.length >= 5 ? rawTime.substring(0, 5) : (rawTime || '00:00').padEnd(5, '0');

  const status = (appointment.status || 'scheduled').toString().toLowerCase();

  return {
    id: appointment.id || appointment.appointmentId,
    appointmentId: appointment.appointmentId || appointment.id,
    date,
    time,
    duration: appointment.durationMinutes ?? 30,
    doctorId: appointment.doctorId || appointment.doctor?.doctorId || appointment.doctor_id || '',
    doctorName: appointment.doctorName || appointment.doctor?.fullName || 'Chưa rõ bác sĩ',
    patientName: appointment.patientName || appointment.patient?.fullName || 'Chưa rõ bệnh nhân',
    visitType: appointment.type || 'CONSULTATION',
    status,
    departmentId: appointment.departmentId || appointment.doctorDepartment || null,
    departmentName: appointment.doctorDepartment || appointment.departmentId || 'General',
  };
};

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'scheduled', label: 'Đã đặt lịch' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'arrived', label: 'Đã check-in' },
  { value: 'in_progress', label: 'Đang khám' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'rescheduled', label: 'Đã dời lịch' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'no_show', label: 'Vắng mặt' },
];

/**
 * Admin Doctor Schedule Page
 * Đồng bộ với dữ liệu Appointments Service
 */
export default function AdminSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [doctorOptions, setDoctorOptions] = useState<DoctorFilterOption[]>([
    { id: 'all', name: 'Tất cả bác sĩ', avatar: null },
  ]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentFilterOption[]>([
    { id: 'all', name: 'Tất cả khoa' },
  ]);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  useEffect(() => {
    let ignore = false;

    const fetchMetadata = async (): Promise<void> => {
      try {
        const [doctorList, departmentList] = await Promise.all([
          doctorsService.getDoctors(),
          departmentsService.getDepartments(),
        ]);

        if (ignore) {
          return;
        }

        const formattedDoctors: DoctorFilterOption[] = [
          { id: 'all', name: 'Tất cả bác sĩ', avatar: null },
          ...(doctorList ?? []).map((doctor) => ({
            id: doctor.id,
            name: doctor.fullName,
            specialty: doctor.specialization || doctor.department,
            avatar: doctor.fullName
              ? doctor.fullName
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : null,
          })),
        ];

        const formattedDepartments: DepartmentFilterOption[] = [
          { id: 'all', name: 'Tất cả khoa' },
          ...(departmentList ?? []).map((dept) => ({
            id: dept.id || dept.code,
            name: dept.nameVi || dept.nameEn || dept.code || 'Chưa đặt tên',
          })),
        ];

        setDoctorOptions(formattedDoctors);
        setDepartmentOptions(formattedDepartments);
      } catch (error) {
        console.error('Failed to load metadata for schedule filters', error);
      }
    };

    fetchMetadata();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchAppointments = async (): Promise<void> => {
      setIsLoadingAppointments(true);
      setErrorMessage(null);
      try {
        const anchor = new Date(selectedYear, selectedMonth, 1);
        const rangeStart = startOfMonth(anchor);
        const rangeEnd = endOfMonth(anchor);

        const response = await appointmentsService.list({
          startDate: formatDateKey(rangeStart),
          endDate: formatDateKey(rangeEnd),
          limit: 200,
        });

        if (ignore) {
          return;
        }

        const mapped = (response.appointments ?? []).map(normalizeAppointment).sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}:00`).getTime();
          const dateB = new Date(`${b.date}T${b.time}:00`).getTime();
          return dateA - dateB;
        });

        setAppointments(mapped);
      } catch (error) {
        console.error('Failed to fetch appointments for schedule view', error);
        if (!ignore) {
          setErrorMessage('Không thể tải dữ liệu lịch hẹn');
          setAppointments([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingAppointments(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      ignore = true;
    };
  }, [selectedYear, selectedMonth]);

  const appointmentsWithFilters = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedDoctor !== 'all' && apt.doctorId !== selectedDoctor) {
        return false;
      }
      if (selectedDepartment !== 'all' && apt.departmentId !== selectedDepartment) {
        return false;
      }
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [appointments, selectedDoctor, selectedDepartment, selectedStatus]);

  const dayAppointments = useMemo(
    () => appointmentsWithFilters.filter((apt) => apt.date === formatDateKey(selectedDate)),
    [appointmentsWithFilters, selectedDate]
  );

  const handleAddAppointment = () => {
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
                  appointments={appointmentsWithFilters}
                  selectedDoctor={selectedDoctor}
                  onDoctorChange={setSelectedDoctor}
                  selectedDepartment={selectedDepartment}
                  onDepartmentChange={setSelectedDepartment}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  doctors={doctorOptions}
                  departments={departmentOptions}
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

                {/* Filters above table */}
                <div className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">Trạng thái</label>
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Error state */}
                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Schedule Content */}
                <div className="min-h-[600px]">
                  {isLoadingAppointments ? (
                    <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                      Đang tải dữ liệu lịch hẹn...
                    </div>
                  ) : (
                    <>
                      {viewMode === 'day' && (
                        <DayView
                          selectedDate={selectedDate}
                          appointments={dayAppointments}
                          showDoctorName={selectedDoctor === 'all'}
                        />
                      )}
                      {viewMode === 'week' && (
                        <WeekView
                          selectedDate={selectedDate}
                          appointments={appointmentsWithFilters}
                          showDoctorName={selectedDoctor === 'all'}
                        />
                      )}
                      {viewMode === 'month' && (
                        <MonthView
                          selectedDate={selectedDate}
                          appointments={appointmentsWithFilters}
                          onDateSelect={setSelectedDate}
                        />
                      )}
                      {viewMode === 'list' && (
                        <ListView
                          appointments={appointmentsWithFilters}
                          selectedDoctor={selectedDoctor}
                        />
                      )}
                    </>
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
