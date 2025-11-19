'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Search, Filter, Loader2, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

type TabType = 'upcoming' | 'completed' | 'cancelled';
type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'PENDING_PAYMENT';

/**
 * My Appointments Page
 * Route: /patient/appointments
 */
export default function MyAppointmentsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [appointments, setAppointments] = useState<AppointmentReadModel[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentReadModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user]);

  useEffect(() => {
    filterAppointments();
  }, [appointments, activeTab, searchQuery, selectedStatus, selectedDepartment]);

  async function loadAppointments() {
    try {
      setLoading(true);
      const response = await appointmentsService.getPatientAppointments(user!.patientId || user!.id);
      // Normalize status to uppercase to match frontend constants
      const normalizedAppointments = response.appointments.map(apt => ({
        ...apt,
        status: (apt.status?.toUpperCase() || 'SCHEDULED') as any // Cast to any to avoid type mismatch if backend returns unknown status
      }));
      setAppointments(normalizedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }

  function filterAppointments() {
    let filtered = [...appointments];
    const today = startOfDay(new Date());

    // Filter by tab
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(apt => {
        const aptDate = parseISO(apt.appointmentDate);
        return (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'PENDING_PAYMENT') &&
          (isAfter(aptDate, today) || format(aptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
      });
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'COMPLETED');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter(apt => apt.status === 'CANCELLED');
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(apt => apt.doctorId === selectedDepartment);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.doctorName.toLowerCase().includes(query) ||
        apt.doctorSpecialization.toLowerCase().includes(query)
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = parseISO(a.appointmentDate);
      const dateB = parseISO(b.appointmentDate);
      return activeTab === 'upcoming'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    setFilteredAppointments(filtered);
  }

  function clearFilters() {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedDepartment('all');
  }

  const upcomingCount = appointments.filter(apt => {
    const aptDate = parseISO(apt.appointmentDate);
    const today = startOfDay(new Date());
    return (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' || apt.status === 'PENDING_PAYMENT') &&
      (isAfter(aptDate, today) || format(aptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
  }).length;

  const completedCount = appointments.filter(apt => apt.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter(apt => apt.status === 'CANCELLED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch hẹn của tôi</h1>
            <p className="mt-2 text-gray-600">Quản lý các lịch hẹn khám bệnh</p>
          </div>
          <Link href="/patient/appointments/book">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Đặt lịch mới
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full md:w-auto"
          >
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary-700"
              >
                Xóa tất cả
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus | 'all')}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="all">Tất cả</option>
                  <option value="SCHEDULED">Đã đặt</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'upcoming'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Sắp tới
              {upcomingCount > 0 && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                  {upcomingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'completed'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Đã hoàn thành
              {completedCount > 0 && (
                <span className="ml-2 rounded-full bg-gray-500 px-2 py-0.5 text-xs text-white">
                  {completedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${activeTab === 'cancelled'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Đã hủy
              {cancelledCount > 0 && (
                <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                  {cancelledCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-gray-600">Đang tải...</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedStatus !== 'all' || selectedDepartment !== 'all'
                ? 'Không tìm thấy lịch hẹn'
                : activeTab === 'upcoming'
                  ? 'Chưa có lịch hẹn sắp tới'
                  : activeTab === 'completed'
                    ? 'Chưa có lịch hẹn đã hoàn thành'
                    : 'Chưa có lịch hẹn đã hủy'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedStatus !== 'all' || selectedDepartment !== 'all'
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm'
                : 'Đặt lịch khám ngay để được chăm sóc sức khỏe tốt nhất'}
            </p>
            {activeTab === 'upcoming' && !searchQuery && selectedStatus === 'all' && (
              <Link href="/patient/appointments/book">
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Đặt lịch ngay
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                onUpdate={loadAppointments}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Appointment Item Component
function AppointmentItem({
  appointment,
  onUpdate,
}: {
  appointment: AppointmentReadModel;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const statusConfig = {
    SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Đã đặt' },
    PENDING_PAYMENT: { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ thanh toán' },
    CONFIRMED: { color: 'bg-green-100 text-green-800', label: 'Đã xác nhận' },
    CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Đã hủy' },
    COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Đã hoàn thành' },
    NO_SHOW: { color: 'bg-orange-100 text-orange-800', label: 'Không đến' },
  };

  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.SCHEDULED;

  const appointmentDate = parseISO(appointment.appointmentDate);
  const formattedDate = format(appointmentDate, 'EEEE, dd/MM/yyyy', { locale: vi });
  const canModify = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' || appointment.status === 'PENDING_PAYMENT';

  async function handleCancel() {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setCancelling(true);
      await appointmentsService.cancel(appointment.id, {
        cancellationReason: 'Bệnh nhân hủy lịch hẹn',
      });
      toast.success('Đã hủy lịch hẹn thành công');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Không thể hủy lịch hẹn. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  }

  function handleReschedule() {
    router.push(`/patient/appointments/${appointment.id}/reschedule`);
  }

  function handleViewDetails() {
    router.push(`/patient/appointments/${appointment.id}`);
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left Section */}
        <div className="flex gap-4 flex-1">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                BS. {appointment.doctorName || 'Đang cập nhật'}
              </h3>
              <p className="text-sm text-gray-600">
                {appointment.doctorSpecialization || 'Chuyên khoa'}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="capitalize">{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 shrink-0" />
                {appointment.appointmentTime}
              </div>
              {appointment.reason && (
                <div className="flex items-center text-gray-500">
                  <span className="text-xs">Lý do: {appointment.reason}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewDetails}
              className="justify-start"
            >
              Xem chi tiết
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            {canModify && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReschedule}
                >
                  Đổi lịch
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy lịch'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
