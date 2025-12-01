'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Loader2,
  X,
  ChevronRight,
  MapPin,
  MoreVertical,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel, CancelAppointmentResponse } from '@/lib/types/appointments';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { CancelAppointmentDialog } from '@/components/appointments/CancelAppointmentDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TabType = 'upcoming' | 'completed' | 'cancelled';
type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'PENDING_PAYMENT';

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
      const response = await appointmentsService.getPatientAppointments(
        user!.patientId || user!.id
      );
      // Normalize status to uppercase to match frontend constants
      const normalizedAppointments = response.appointments.map((apt) => ({
        ...apt,
        status: (apt.status?.toUpperCase() || 'SCHEDULED') as any, // Cast to any to avoid type mismatch if backend returns unknown status
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
      filtered = filtered.filter((apt) => {
        if (!apt.appointmentDate) return false;
        const aptDate = parseISO(apt.appointmentDate);
        return (
          (apt.status === 'SCHEDULED' ||
            apt.status === 'CONFIRMED' ||
            apt.status === 'PENDING_PAYMENT') &&
          (isAfter(aptDate, today) || format(aptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
        );
      });
    } else if (activeTab === 'completed') {
      filtered = filtered.filter((apt) => apt.status === 'COMPLETED');
    } else if (activeTab === 'cancelled') {
      filtered = filtered.filter((apt) => apt.status === 'CANCELLED');
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === selectedStatus);
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((apt) => apt.doctorId === selectedDepartment);
    }

    // Search - with null safety
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          (apt.doctorName?.toLowerCase() || '').includes(query) ||
          (apt.doctorSpecialization?.toLowerCase() || '').includes(query)
      );
    }

    // Sort by date - with null safety
    filtered.sort((a, b) => {
      if (!a.appointmentDate || !b.appointmentDate) return 0;
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

  const upcomingCount = appointments.filter((apt) => {
    if (!apt.appointmentDate) return false;
    const aptDate = parseISO(apt.appointmentDate);
    const today = startOfDay(new Date());
    return (
      (apt.status === 'SCHEDULED' ||
        apt.status === 'CONFIRMED' ||
        apt.status === 'PENDING_PAYMENT') &&
      (isAfter(aptDate, today) || format(aptDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    );
  }).length;

  const completedCount = appointments.filter((apt) => apt.status === 'COMPLETED').length;
  const cancelledCount = appointments.filter((apt) => apt.status === 'CANCELLED').length;

  const getStatusLabel = (status: string, paymentStatus?: string) => {
    const paid = paymentStatus?.toUpperCase() === 'PAID';
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'Chờ thanh toán';
      case 'SCHEDULED':
        return paid ? 'Đã xác nhận' : 'Đã đặt';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40">
        <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lịch hẹn của tôi</h1>
              <p className="mt-1 text-gray-500">Quản lý và theo dõi quá trình khám chữa bệnh</p>
            </div>
            <Link href="/patient/appointments/book">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] sm:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                Đặt lịch khám mới
              </Button>
            </Link>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-gray-100 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            {/* Custom Tabs */}
            <div className="flex w-full rounded-xl bg-gray-100/50 p-1 sm:w-auto">
              {[
                { id: 'upcoming', label: 'Sắp tới', count: upcomingCount },
                { id: 'completed', label: 'Hoàn thành', count: completedCount },
                { id: 'cancelled', label: 'Đã hủy', count: cancelledCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none',
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px]',
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-1 gap-2 sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm bác sĩ, chuyên khoa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-0 bg-gray-50/50 py-2.5 pr-4 pl-10 text-sm ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'shrink-0 rounded-xl border-gray-200 bg-white transition-colors hover:bg-gray-50',
                  showFilters && 'bg-blue-50 border-blue-200 text-blue-600'
                )}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Bộ lọc nâng cao</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Xóa bộ lọc
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Trạng thái</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as AppointmentStatus | 'all')}
                    className="w-full rounded-lg border-gray-200 bg-gray-50/50 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
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

          {/* Content Area */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/50 py-16 text-center backdrop-blur-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 shadow-sm ring-1 ring-blue-100">
                  <CalendarDays className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Không tìm thấy lịch hẹn</h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  {searchQuery || selectedStatus !== 'all'
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn'
                    : 'Bạn chưa có lịch hẹn nào trong danh sách này'}
                </p>
                {activeTab === 'upcoming' && !searchQuery && selectedStatus === 'all' && (
                  <Link href="/patient/appointments/book" className="mt-6">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20">
                      Đặt lịch khám ngay
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    statusLabel={getStatusLabel(appointment.status, appointment.paymentStatus)}
                    onUpdate={loadAppointments}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Modern Appointment Item Component
function AppointmentItem({
  appointment,
  statusLabel,
  onUpdate,
}: {
  appointment: AppointmentReadModel;
  statusLabel: string;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const statusConfig = {
    SCHEDULED: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      icon: Calendar,
    },
    PENDING_PAYMENT: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      icon: AlertCircle,
    },
    CONFIRMED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      icon: Calendar,
    },
    CANCELLED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-100',
      icon: X,
    },
    COMPLETED: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-100',
      icon: Calendar,
    },
    NO_SHOW: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-100',
      icon: AlertCircle,
    },
  };

  const config =
    statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.SCHEDULED;

  const appointmentDate = parseISO(appointment.appointmentDate);
  const formattedDate = format(appointmentDate, 'EEEE, dd/MM/yyyy', { locale: vi });
  const canModify =
    appointment.status === 'SCHEDULED' ||
    appointment.status === 'CONFIRMED' ||
    appointment.status === 'PENDING_PAYMENT';

  async function handleCancelConfirm(reason: string) {
    try {
      const appointmentId = (appointment as any).appointmentId || appointment.id;
      const resp = await appointmentsService.cancel(appointmentId, {
        cancellationReason: reason,
      });
      const policy = (resp as CancelAppointmentResponse).cancellationPolicy;
      if (policy?.refundEligible) {
        toast.success('Đã hủy lịch và hoàn tiền thành công');
      } else {
        toast.success('Đã hủy lịch hẹn thành công');
      }
      onUpdate();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Không thể hủy lịch hẹn');
      throw error;
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Date Box */}
          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:gap-1">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 sm:h-20 sm:w-20">
              <span className="text-xs font-medium uppercase text-blue-100">
                {format(appointmentDate, 'MMM', { locale: vi })}
              </span>
              <span className="text-2xl font-bold">{format(appointmentDate, 'dd')}</span>
            </div>
            <div className="sm:hidden">
              <h3 className="font-semibold text-gray-900">
                BS. {appointment.doctorName || 'Đang cập nhật'}
              </h3>
              <p className="text-sm text-gray-500">
                {appointment.doctorSpecialization || 'Chuyên khoa'}
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-2">
            <div className="hidden sm:block">
              <h3 className="text-lg font-bold text-gray-900">
                BS. {appointment.doctorName || 'Đang cập nhật'}
              </h3>
              <p className="text-sm text-gray-500">
                {appointment.doctorSpecialization || 'Chuyên khoa'}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">{appointment.appointmentTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>Phòng khám số 2</span>
              </div>
            </div>

            {appointment.reason && (
              <div className="mt-2 inline-flex items-center rounded-lg bg-gray-50 px-3 py-1 text-xs text-gray-600">
                <span className="mr-1 font-medium text-gray-900">Lý do:</span>
                {appointment.reason}
              </div>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex flex-row items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                config.bg,
                config.text,
                config.border,
                'border'
              )}
            >
              <config.icon className="h-3 w-3" />
              {statusLabel}
            </span>

            <div className="flex items-center gap-2">
              {canModify && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/patient/appointments/${appointment.id}/reschedule`)
                      }
                    >
                      Đổi lịch khám
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Hủy lịch hẹn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                size="sm"
                onClick={() => router.push(`/patient/appointments/${appointment.id}`)}
                className="rounded-lg bg-gray-900 text-xs font-medium text-white shadow-sm hover:bg-gray-800"
              >
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CancelAppointmentDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelConfirm}
        appointmentInfo={{
          doctorName: appointment.doctorName || 'Đang cập nhật',
          date: formattedDate,
          time: appointment.appointmentTime,
        }}
      />
    </>
  );
}
