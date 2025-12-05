'use client';

import { useState, useEffect } from 'react';
import {
  CalendarPlus,
  Clock,
  Search,
  Filter,
  Loader2,
  X,
  MoreVertical,
  CalendarDays,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel, CancelAppointmentResponse } from '@/lib/types/appointments';
import { format, parseISO, isAfter, startOfDay, isToday, isTomorrow } from 'date-fns';
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
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'upcoming' | 'completed' | 'cancelled';
type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'PENDING_PAYMENT';

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
      const patientId = user!.patientId || user!.id;
      const aggregatedAppointments: AppointmentReadModel[] = [];
      const PAGE_SIZE = 50;
      const MAX_PAGES = 10; // Safety guard to avoid fetching unbounded history
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= MAX_PAGES) {
        const response = await appointmentsService.getPatientAppointments(patientId, {
          page,
          pageSize: PAGE_SIZE,
        });
        aggregatedAppointments.push(...response.appointments);
        hasMore = response.hasMore;
        page += 1;

        // Stop early if backend returns fewer rows than requested (no more data)
        if (response.appointments.length < PAGE_SIZE) {
          break;
        }
      }

      const normalizedAppointments = aggregatedAppointments.map((apt) => ({
        ...apt,
        status: (apt.status?.toUpperCase() || 'SCHEDULED') as AppointmentStatus,
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

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === selectedStatus);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((apt) => apt.doctorId === selectedDepartment);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          (apt.doctorName?.toLowerCase() || '').includes(query) ||
          (apt.doctorSpecialization?.toLowerCase() || '').includes(query)
      );
    }

    filtered.sort((a, b) => {
      if (!a.appointmentDate || !b.appointmentDate) return 0;
      const dateA = parseISO(a.appointmentDate);
      const dateB = parseISO(b.appointmentDate);

      // First compare by date
      const dateCompare = dateA.getTime() - dateB.getTime();

      // If same date, compare by time
      if (dateCompare === 0 && a.appointmentTime && b.appointmentTime) {
        const timeCompare = a.appointmentTime.localeCompare(b.appointmentTime);
        return activeTab === 'upcoming' ? timeCompare : -timeCompare;
      }

      return activeTab === 'upcoming' ? dateCompare : -dateCompare;
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

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce(
    (groups, appointment) => {
      const date = appointment.appointmentDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(appointment);
      return groups;
    },
    {} as Record<string, AppointmentReadModel[]>
  );

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    return activeTab === 'upcoming'
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });

  const getDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hôm nay';
    if (isTomorrow(date)) return 'Ngày mai';
    return format(date, 'EEEE, dd/MM/yyyy', { locale: vi });
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch hẹn của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý và theo dõi quá trình khám chữa bệnh
            </p>
          </div>
          <Link href="/patient/appointments/book">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 sm:w-auto">
                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
                <CalendarPlus className="mr-2 h-4 w-4" />
                <span className="font-semibold">Đặt lịch mới</span>
              </Button>
            </motion.div>
          </Link>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Custom Tabs */}
          <div className="flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
            {[
              { id: 'upcoming', label: 'Sắp tới', count: upcomingCount },
              { id: 'completed', label: 'Hoàn thành', count: completedCount },
              { id: 'cancelled', label: 'Đã hủy', count: cancelledCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 sm:flex-none',
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px]',
                        activeTab === tab.id
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-1 gap-2 sm:max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bác sĩ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-0 bg-white py-2 pr-4 pl-9 text-sm ring-1 ring-slate-200 transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'h-9 w-9 shrink-0 rounded-xl border-slate-200 bg-white',
                showFilters && 'border-emerald-200 bg-emerald-50 text-emerald-600'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900">Bộ lọc</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Trạng thái
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        setSelectedStatus(e.target.value as AppointmentStatus | 'all')
                      }
                      className="w-full rounded-xl border-slate-200 bg-slate-50/50 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white py-16 text-center"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                <CalendarDays className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-medium text-slate-900">Không tìm thấy lịch hẹn</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {searchQuery || selectedStatus !== 'all'
                  ? 'Thử thay đổi bộ lọc tìm kiếm'
                  : 'Bạn chưa có lịch hẹn nào'}
              </p>
            </motion.div>
          ) : (
            <div className="relative space-y-8 pl-4 sm:pl-0">
              {/* Timeline Line */}
              <div className="absolute top-2 bottom-2 left-4 w-px bg-slate-200 sm:hidden" />

              {sortedDates.map((date, index) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Dot (Mobile) */}
                  <div className="absolute top-1.5 -left-4 h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-white sm:hidden" />

                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-slate-500 uppercase">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {getDateHeader(date)}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {groupedAppointments[date].map((appointment, idx) => {
                        const safeKey =
                          appointment.appointmentId || appointment.id || `${appointment.id}-${idx}`;
                        return (
                          <AppointmentItem
                            key={safeKey}
                            appointment={appointment}
                            statusLabel={getStatusLabel(
                              appointment.status,
                              appointment.paymentStatus
                            )}
                            onUpdate={loadAppointments}
                          />
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

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
    },
    PENDING_PAYMENT: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    CONFIRMED: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    CANCELLED: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    COMPLETED: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-100',
    },
    NO_SHOW: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-100',
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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    router.push(`/patient/appointments/${appointment.id}`);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCardClick}
        whileHover={{
          scale: 1.02,
          backgroundColor: 'rgba(236, 253, 245, 0.8)', // emerald-50
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="group flex cursor-pointer flex-col gap-3 border-l-4 border-transparent p-3 transition-all hover:border-emerald-500 sm:flex-row sm:items-center sm:gap-4"
      >
        {/* Time & Date Combined */}
        <div className="flex shrink-0 items-center gap-2 sm:w-32 sm:flex-col sm:items-start sm:gap-0.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {appointment.appointmentTime}
          </div>
          <div className="text-xs text-slate-500 sm:pl-5">{format(appointmentDate, 'dd/MM')}</div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <h3 className="truncate text-[15px] font-semibold text-gray-900">
              BS. {appointment.doctorName || 'Đang cập nhật'}
            </h3>
            <span
              className={cn(
                'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                config.bg,
                config.text,
                config.border,
                'border'
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="mt-0.5 text-sm font-medium text-emerald-600">
            {appointment.doctorSpecialization || 'Chuyên khoa'}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-1 flex items-center justify-between gap-2 sm:mt-0 sm:justify-end">
          <div className="flex items-center gap-1">
            {canModify && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/patient/appointments/${appointment.id}/reschedule`);
                    }}
                  >
                    Đổi lịch khám
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelDialog(true);
                    }}
                  >
                    Hủy lịch hẹn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-full px-3 text-xs font-medium text-slate-500 ring-1 ring-transparent hover:bg-white hover:text-emerald-600 hover:shadow-sm hover:ring-slate-200"
            onClick={() => router.push(`/patient/appointments/${appointment.id}`)}
          >
            Chi tiết
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

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
