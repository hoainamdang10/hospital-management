'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  TrendingUp,
  Eye,
  RefreshCw,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import type { AppointmentReadModel } from '@/lib/types/appointments';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  reason: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Map type to Vietnamese
const getTypeLabel = (type?: string): string => {
  if (!type) return 'Khám bệnh';
  const typeMap: { [key: string]: string } = {
    CONSULTATION: 'Khám tổng quát',
    FOLLOW_UP: 'Tái khám',
    CHECKUP: 'Khám định kỳ',
    EMERGENCY: 'Cấp cứu',
  };
  return typeMap[type.toUpperCase()] || type;
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Get today's date in local timezone
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const fetchAppointments = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await appointmentsService.list({ pageSize: 100 });

      if (res.appointments) {
        const mappedAppointments = res.appointments.map((apt: AppointmentReadModel) => ({
          id: apt.id || apt.appointmentId,
          appointmentId: apt.appointmentId,
          patientName: apt.patientName || apt.patientFullName || apt.patient?.fullName || 'N/A',
          patientId: apt.patientId,
          doctorName: apt.doctorName || apt.doctorFullName || apt.doctor?.fullName || 'N/A',
          departmentName: apt.departmentId || apt.doctorDepartment || 'General',
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          status: apt.status,
          type: apt.type,
          reason: apt.reason || '',
        }));
        setAppointments(mappedAppointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentId.toLowerCase().includes(searchTerm.toLowerCase());

    const normalizedStatus = apt.status?.toUpperCase() || '';
    const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const stats = useMemo(() => {
    const todayAppts = appointments.filter((a) => a.appointmentDate?.split('T')[0] === today);
    const upcomingAppts = appointments.filter((a) =>
      ['SCHEDULED', 'CONFIRMED', 'scheduled', 'confirmed'].includes(a.status)
    );
    const completedAppts = appointments.filter((a) =>
      ['COMPLETED', 'completed'].includes(a.status)
    );
    const cancelledAppts = appointments.filter((a) =>
      ['CANCELLED', 'cancelled'].includes(a.status)
    );

    return {
      today: todayAppts.length,
      upcoming: upcomingAppts.length,
      completed: completedAppts.length,
      cancelled: cancelledAppts.length,
    };
  }, [appointments, today]);

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toUpperCase() || '';
    const statusConfig: { [key: string]: { label: string; className: string } } = {
      SCHEDULED: { label: 'Đã đặt lịch', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      CONFIRMED: {
        label: 'Đã xác nhận',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      COMPLETED: { label: 'Hoàn thành', className: 'bg-slate-100 text-slate-700 border-slate-200' },
      CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
      NO_SHOW: { label: 'Vắng mặt', className: 'bg-orange-50 text-orange-700 border-orange-200' },
      PENDING_PAYMENT: {
        label: 'Chờ thanh toán',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      },
    };

    const config = statusConfig[normalizedStatus] || {
      label: status,
      className: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    return (
      <Badge variant="outline" className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      let res;
      if (newStatus === 'CONFIRMED') {
        res = await appointmentsService.confirm(id);
      } else if (newStatus === 'CANCELLED') {
        res = await appointmentsService.cancel(id, { cancellationReason: 'Admin cancelled' });
      }

      if (res && res.success) {
        toast.success('Cập nhật trạng thái thành công');
        fetchAppointments(true);
      }
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  // Safe date formatter
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 p-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Quản lý lịch hẹn
            </h1>
            <p className="mt-1 text-slate-500">
              Xem và quản lý tất cả lịch hẹn khám bệnh trong hệ thống
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fetchAppointments(true)}
              disabled={isRefreshing}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/appointments/calendar')}
              className="border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Xem lịch
            </Button>
            <Button
              onClick={() => router.push('/admin/appointments/add')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-700 hover:to-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo lịch hẹn
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
          {/* Today */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-cyan-200 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Lịch hôm nay</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{stats.today}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 p-3">
                <CalendarDays className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-xs text-cyan-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Ngày {format(new Date(), 'dd/MM')}</span>
            </div>
          </div>

          {/* Upcoming */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Sắp tới</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-xs text-blue-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Chờ xử lý</span>
            </div>
          </div>

          {/* Completed */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Hoàn thành</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Thành công</span>
            </div>
          </div>

          {/* Cancelled */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-red-200 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Đã hủy</p>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-100 to-red-50 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Cần theo dõi</span>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm bệnh nhân, bác sĩ, mã lịch hẹn..."
                className="border-slate-200 pl-10 focus:border-cyan-500 focus:ring-cyan-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-slate-200 sm:w-[200px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="SCHEDULED">Đã đặt lịch</SelectItem>
                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                <SelectItem value="NO_SHOW">Vắng mặt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-slate-500">
            Hiển thị{' '}
            <span className="font-semibold text-slate-900">{filteredAppointments.length}</span> kết
            quả
          </div>
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Mã lịch hẹn</TableHead>
                  <TableHead className="font-semibold text-slate-700">Bệnh nhân</TableHead>
                  <TableHead className="font-semibold text-slate-700">Bác sĩ</TableHead>
                  <TableHead className="font-semibold text-slate-700">Loại khám</TableHead>
                  <TableHead className="font-semibold text-slate-700">Thời gian</TableHead>
                  <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
                        <span className="text-sm text-slate-500">Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <CalendarIcon className="h-12 w-12 text-slate-300" />
                        <span className="text-sm text-slate-500">Không tìm thấy lịch hẹn nào</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {filteredAppointments.map((apt, index) => (
                      <motion.tr
                        key={apt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        className="group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                        onClick={() => router.push(`/admin/appointments/${apt.id}`)}
                      >
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-cyan-700">
                            {apt.appointmentId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-xs font-semibold text-white">
                              {getInitials(apt.patientName)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{apt.patientName}</p>
                              <p className="text-xs text-slate-500">{apt.patientId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white">
                              <Stethoscope className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{apt.doctorName}</p>
                              <p className="text-xs text-slate-500">{apt.departmentName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {getTypeLabel(apt.type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {formatDate(apt.appointmentDate)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {apt.appointmentTime?.substring(0, 5) || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/appointments/${apt.id}`);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {['SCHEDULED', 'scheduled'].includes(apt.status) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(apt.id, 'CONFIRMED');
                                  }}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                  Xác nhận
                                </DropdownMenuItem>
                              )}
                              {['SCHEDULED', 'CONFIRMED', 'scheduled', 'confirmed'].includes(
                                apt.status
                              ) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(apt.id, 'CANCELLED');
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Hủy lịch
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
