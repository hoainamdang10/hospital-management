'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { appointmentsService } from '@/lib/api/appointments.service';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  doctor: string;
  treatment: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface UpcomingAppointmentsProps {
  patientId?: string;
}

// Mock data fallback
function getMockAppointments(): Appointment[] {
  return [
    {
      id: '1',
      patientName: 'Nguyễn Văn A',
      date: '2024-07-28',
      time: '09:00',
      doctor: 'BS. Trần Thị B',
      treatment: 'Khám tổng quát',
      status: 'confirmed',
    },
    {
      id: '2',
      patientName: 'Lê Thị C',
      date: '2024-07-28',
      time: '10:30',
      doctor: 'BS. Phạm Văn D',
      treatment: 'Tư vấn tim mạch',
      status: 'confirmed',
    },
    {
      id: '3',
      patientName: 'Hoàng Văn E',
      date: '2024-07-28',
      time: '11:00',
      doctor: 'BS. Ngô Thị F',
      treatment: 'Khám nhi khoa',
      status: 'pending',
    },
    {
      id: '4',
      patientName: 'Đặng Thị G',
      date: '2024-07-28',
      time: '13:00',
      doctor: 'BS. Vũ Văn H',
      treatment: 'Khám da liễu',
      status: 'cancelled',
    },
    {
      id: '5',
      patientName: 'Bùi Văn I',
      date: '2024-07-28',
      time: '14:30',
      doctor: 'BS. Trần Thị B',
      treatment: 'Tái khám',
      status: 'confirmed',
    },
  ];
}

export function UpcomingAppointments({ patientId }: UpcomingAppointmentsProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      if (!patientId) {
        setAppointments(getMockAppointments());
        setLoading(false);
        return;
      }

      try {
        const response = await appointmentsService.getPatientAppointments(patientId, {
          pageSize: 25,
        });

        if (response.success && response.appointments) {
          // Transform API data to component format
          const transformedAppointments: Appointment[] = response.appointments
            .filter(
              (apt: any) =>
                apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'PENDING'
            )
            .map((apt: any) => ({
              id: apt.id,
              patientName: apt.patientName || apt.patient?.fullName || 'Bệnh nhân',
              date: apt.appointmentDate || apt.date,
              time: apt.appointmentTime || apt.time,
              doctor: apt.doctorName || apt.doctor?.fullName || 'Bác sĩ',
              treatment: apt.appointmentType || apt.type || 'Khám bệnh',
              status: apt.status?.toLowerCase() || 'pending',
            }));
          setAppointments(transformedAppointments);
        } else {
          setAppointments(getMockAppointments());
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setAppointments(getMockAppointments());
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [patientId]);

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-teal-100 text-teal-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'pending':
        return 'Chờ xác nhận';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Lịch hẹn sắp tới</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-4">
              <div className="h-16 flex-1 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Patient Appointment</h2>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
      </div>

      {/* Mini Calendar */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handlePrevWeek}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleNextWeek}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center rounded-lg p-3 transition-all ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-lg'
                    : isToday
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mb-1 text-xs font-medium">
                  {format(day, 'EEE', { locale: vi }).toUpperCase()}
                </span>
                <span className="text-lg font-bold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Name
              </th>
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Date
              </th>
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Time
              </th>
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Doctor
              </th>
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Treatment
              </th>
              <th className="pb-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Status
              </th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="group transition-colors hover:bg-gray-50">
                <td className="py-4 text-sm font-medium text-gray-900">
                  {appointment.patientName}
                </td>
                <td className="py-4 text-sm text-gray-600">{appointment.date}</td>
                <td className="py-4 text-sm text-gray-600">{appointment.time}</td>
                <td className="py-4 text-sm text-gray-600">{appointment.doctor}</td>
                <td className="py-4 text-sm text-gray-600">{appointment.treatment}</td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </td>
                <td className="py-4">
                  <button className="rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-200">
                    <MoreVertical className="h-4 w-4 text-gray-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
