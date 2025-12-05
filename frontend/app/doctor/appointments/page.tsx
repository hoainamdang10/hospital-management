'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  RefreshCw,
  Users,
  Activity,
  Loader2,
  CalendarDays,
  Stethoscope,
  AlertCircle,
  MoreVertical,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
  Sparkles,
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
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { getStaffByUserId } from '@/lib/api/staff.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  appointmentTime: string;
  status: string;
  type: string;
  reason: string;
  priority: string;
  paymentStatus?: string;
  patientGender?: string;
  patientAge?: number;
}

// Status configuration with consistent styling
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  CANCELLED: { label: 'Đã hủy', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: AlertCircle },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  CHECKED_IN: { label: 'Đã đến', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: MapPin },
  IN_PROGRESS: { label: 'Đang khám', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Activity },
  COMPLETED: { label: 'Hoàn thành', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle2 },
  CONFIRMED: { label: 'Chờ đến', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  DEFAULT: { label: 'Không rõ', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: AlertCircle },
};

// Tab configuration
const TABS = [
  { id: 'ALL', label: 'Tất cả', icon: ClipboardList },
  { id: 'WAITING', label: 'Chờ khám', icon: Clock },
  { id: 'CANCELLED', label: 'Đã hủy', icon: AlertCircle },
  { id: 'COMPLETED', label: 'Đã xong', icon: CheckCircle2 },
];

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorStaffId, setDoctorStaffId] = useState<string | null>(null);
  const [isResolvingDoctor, setIsResolvingDoctor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [activeTab, setActiveTab] = useState('ALL');

  // Resolve Doctor ID Logic
  useEffect(() => {
    if (!user) {
      setDoctorStaffId(null);
      setIsResolvingDoctor(false);
      return;
    }

    if (user.staffId) {
      if (doctorStaffId !== user.staffId) {
        setDoctorStaffId(user.staffId);
      }
      setIsResolvingDoctor(false);
      return;
    }

    if (user.role?.toUpperCase() !== 'DOCTOR') {
      setDoctorStaffId(user.userId || user.id);
      setIsResolvingDoctor(false);
      return;
    }

    if (doctorStaffId) return;

    if (!user.userId) {
      setDoctorStaffId(null);
      setIsResolvingDoctor(false);
      return;
    }

    let isCancelled = false;
    const resolveStaffId = async () => {
      setIsResolvingDoctor(true);
      try {
        const profile = await getStaffByUserId(user.userId);
        if (!isCancelled) {
          if (profile?.staffId) {
            setDoctorStaffId(profile.staffId);
          } else {
            console.warn('[DoctorAppointments] Không tìm thấy staffId cho bác sĩ', {
              userId: user.userId,
            });
            toast.error('Không tìm thấy mã bác sĩ trong hồ sơ nhân sự');
            setDoctorStaffId(null);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to resolve doctor staffId', error);
          toast.error('Không thể xác định mã bác sĩ');
          setDoctorStaffId(null);
        }
      } finally {
        if (!isCancelled) setIsResolvingDoctor(false);
      }
    };

    resolveStaffId();
    return () => {
      isCancelled = true;
    };
  }, [doctorStaffId, user]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    const resolvedDoctorId = doctorStaffId || user?.staffId || user?.userId || user?.id;
    if (!resolvedDoctorId) return;

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const baseFilters = {
        startDate: dateFilter === 'TODAY' ? today : undefined,
        endDate: dateFilter === 'TODAY' ? today : undefined,
      };

      const aggregatedAppointments: any[] = [];
      const PAGE_SIZE = 50;
      const MAX_PAGES = 10;
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= MAX_PAGES) {
        const res = await appointmentsService.getDoctorAppointments(resolvedDoctorId, {
          ...baseFilters,
          page,
          pageSize: PAGE_SIZE,
        });

        const batch = res.appointments || [];
        aggregatedAppointments.push(...batch);

        hasMore = res.hasMore && batch.length === PAGE_SIZE;
        if (!res.hasMore || batch.length < PAGE_SIZE) break;
        page += 1;
      }

      if (aggregatedAppointments.length) {
        const mapped = aggregatedAppointments.map((apt: any) => {
          let age = undefined;
          const dob = apt.patient_date_of_birth || apt.patientDateOfBirth || apt.patient_dob;
          if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }

          return {
            id: apt.id || apt.appointment_id,
            appointmentId: apt.appointment_id || apt.id,
            patientName: apt.patient_full_name || apt.patientName || 'N/A',
            patientId: apt.patient_id || apt.patientId,
            appointmentTime: apt.appointment_time || apt.appointmentTime,
            status: (apt.status || '').toString().toUpperCase(),
            paymentStatus: apt.payment_status || apt.paymentStatus,
            type: apt.type,
            reason: apt.reason,
            priority: apt.priority || 'NORMAL',
            patientGender: apt.patient_gender || apt.patientGender || apt.gender,
            patientAge: age,
          };
        });

        mapped.sort((a: any, b: any) => a.appointmentTime.localeCompare(b.appointmentTime));
        setAppointments(mapped);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải danh sách khám');
    } finally {
      setIsLoading(false);
    }
  }, [doctorStaffId, dateFilter, user]);

  useEffect(() => {
    if (isResolvingDoctor) return;
    fetchAppointments();
  }, [fetchAppointments, isResolvingDoctor]);

  const handleStartExam = async (id: string) => {
    try {
      await appointmentsService.startAppointment(id);
      router.push(`/doctor/appointments/${id}`);
    } catch (error) {
      toast.error('Không thể bắt đầu ca khám');
    }
  };

  const translateGender = (gender?: string): string => {
    if (!gender) return 'Chưa rõ';
    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'm') return 'Nam';
    if (normalized === 'female' || normalized === 'f') return 'Nữ';
    return gender;
  };

  // Filter Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch =
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      const normalizedStatus = apt.status.toUpperCase();
      if (activeTab === 'WAITING') {
        matchesTab = ['CHECKED_IN', 'CONFIRMED', 'PENDING'].includes(normalizedStatus);
      } else if (activeTab === 'IN_PROGRESS') {
        matchesTab = normalizedStatus === 'IN_PROGRESS';
      } else if (activeTab === 'COMPLETED') {
        matchesTab = normalizedStatus === 'COMPLETED';
      } else if (activeTab === 'CANCELLED') {
        matchesTab = ['CANCELLED', 'NO_SHOW'].includes(normalizedStatus);
      }

      return matchesSearch && matchesTab;
    });
  }, [appointments, searchTerm, activeTab]);

  // Stats
  const stats = useMemo(() => [
    {
      title: 'Tổng bệnh nhân',
      value: appointments.length,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      lightBg: 'bg-blue-50',
    },
    {
      title: 'Đang chờ',
      value: appointments.filter((a) =>
        ['CHECKED_IN', 'CONFIRMED'].includes(a.status.toUpperCase())
      ).length,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      lightBg: 'bg-amber-50',
    },
    {
      title: 'Hoàn thành',
      value: appointments.filter((a) => a.status.toUpperCase() === 'COMPLETED').length,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-500',
      lightBg: 'bg-emerald-50',
    },
  ], [appointments]);

  const getStatusConfig = (status: string, paymentStatus?: string) => {
    if (status === 'CANCELLED') return STATUS_CONFIG.CANCELLED;
    if (paymentStatus === 'PENDING' && status !== 'CANCELLED') return STATUS_CONFIG.PENDING_PAYMENT;
    return STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-6 pb-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 p-6 text-white shadow-xl lg:p-8"
        >
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '32px 32px'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm lg:h-16 lg:w-16"
              >
                <Stethoscope className="h-7 w-7 text-white lg:h-8 lg:w-8" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold lg:text-3xl">Lịch khám bệnh</h1>
                <p className="mt-1 text-sm text-cyan-100 lg:text-base">
                  Quản lý danh sách bệnh nhân và lịch hẹn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-right">
                <p className="text-xs font-medium text-cyan-100">Hôm nay</p>
                <p className="text-base font-bold lg:text-lg">
                  {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={fetchAppointments}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              {/* Gradient accent */}
              <div className={cn(
                'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
                stat.gradient
              )} />

              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  stat.lightBg
                )}>
                  <stat.icon className={cn(
                    'h-6 w-6 bg-gradient-to-r bg-clip-text',
                    stat.gradient.replace('from-', 'text-').split(' ')[0]
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
        >
          {/* Tab Pills */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search & Date Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm tên hoặc mã BN..."
                className="w-full rounded-lg border-slate-200 bg-slate-50 pl-10 transition-all focus:bg-white sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full rounded-lg border-slate-200 bg-slate-50 sm:w-[140px]">
                <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAY">Hôm nay</SelectItem>
                <SelectItem value="ALL">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Appointment List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-100 bg-white shadow-sm"
        >
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <ClipboardList className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Không có lịch hẹn</h3>
              <p className="text-sm text-slate-500">
                Không tìm thấy lịch hẹn nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredAppointments.map((apt, index) => {
                  let statusConfig = getStatusConfig(apt.status, apt.paymentStatus);
                  if (apt.status === 'CANCELLED') {
                    statusConfig = STATUS_CONFIG.CANCELLED;
                  } else if (apt.paymentStatus === 'PENDING' && apt.status !== 'CANCELLED') {
                    statusConfig = STATUS_CONFIG.PENDING_PAYMENT;
                  }
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.03 }}
                      className="group cursor-pointer p-4 transition-colors hover:bg-slate-50 lg:p-5"
                      onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left: Time + Avatar + Info */}
                        <div className="flex items-center gap-4">
                          {/* Time Badge */}
                          <div className={cn(
                            'flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2 bg-white transition-all lg:h-16 lg:w-16',
                            apt.status === 'IN_PROGRESS'
                              ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                              : 'border-slate-100 group-hover:border-cyan-200 group-hover:shadow-sm'
                          )}>
                            <span className="text-base font-bold text-slate-900 lg:text-lg">
                              {apt.appointmentTime.substring(0, 5)}
                            </span>
                            <span className="text-[10px] font-medium uppercase text-slate-400">
                              {parseInt(apt.appointmentTime.substring(0, 2)) >= 12 ? 'PM' : 'AM'}
                            </span>
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm lg:h-14 lg:w-14">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${apt.patientName}`}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
                              {apt.patientName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Patient Info */}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-cyan-600 lg:text-lg">
                                {apt.patientName}
                              </h3>
                              <Badge variant="outline" className="text-xs font-normal text-slate-500">
                                {apt.patientId}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {translateGender(apt.patientGender)}
                                {apt.patientAge ? `, ${apt.patientAge} tuổi` : ''}
                              </span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className={cn(
                                'font-medium',
                                apt.type === 'FOLLOW_UP' ? 'text-purple-600' : 'text-cyan-600'
                              )}>
                                {apt.type === 'FOLLOW_UP' ? 'Tái khám' : 'Khám mới'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Reason + Status + Actions */}
                        <div className="flex items-center gap-4 pl-[72px] lg:pl-0">
                          {/* Reason - Hidden on mobile */}
                          <div className="hidden max-w-[180px] text-right lg:block">
                            <p className="mb-0.5 text-xs text-slate-400">Lý do khám</p>
                            <p className="truncate text-sm font-medium text-slate-700" title={apt.reason}>
                              {apt.reason || 'Không có lý do'}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <Badge
                            className={cn(
                              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-medium',
                              statusConfig.bg,
                              statusConfig.color
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConfig.label}
                          </Badge>

                          {/* Start Exam Button - Only for CHECKED_IN */}
                          {apt.status === 'CHECKED_IN' && (
                            <Button
                              size="sm"
                              className="hidden bg-emerald-600 text-white hover:bg-emerald-700 lg:flex"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartExam(apt.id);
                              }}
                            >
                              <PlayCircle className="mr-1.5 h-4 w-4" />
                              Chờ đến
                            </Button>
                          )}

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-slate-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/doctor/appointments/${apt.id}`);
                                }}
                              >
                                <Stethoscope className="mr-2 h-4 w-4" /> Xem chi tiết
                              </DropdownMenuItem>
                              {apt.status === 'CHECKED_IN' && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartExam(apt.id);
                                  }}
                                  className="text-emerald-600 focus:text-emerald-700"
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu khám
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Phone className="mr-2 h-4 w-4" /> Gọi điện
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Chevron */}
                          <ChevronRight className="hidden h-5 w-5 text-slate-300 transition-colors group-hover:text-cyan-500 lg:block" />
                        </div>
                      </div>

                      {/* Mobile: Start Exam Button */}
                      {apt.status === 'CHECKED_IN' && (
                        <div className="mt-3 pl-[72px] lg:hidden">
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartExam(apt.id);
                            }}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Bắt đầu khám ngay
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
