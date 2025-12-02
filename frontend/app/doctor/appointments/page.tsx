'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Users,
  Activity,
  Loader2,
  CalendarDays,
  Stethoscope,
  AlertCircle,
  MoreVertical,
  Phone,
  Mail,
  MapPin
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { getStaffByUserId } from '@/lib/api/staff.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            console.warn('[DoctorAppointments] Không tìm thấy staffId cho bác sĩ', { userId: user.userId });
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
    return () => { isCancelled = true; };
  }, [doctorStaffId, user]);

  // Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    const resolvedDoctorId = doctorStaffId || user?.staffId || user?.userId || user?.id;
    if (!resolvedDoctorId) return;

    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await appointmentsService.getDoctorAppointments(resolvedDoctorId, {
        startDate: dateFilter === 'TODAY' ? today : undefined,
        endDate: dateFilter === 'TODAY' ? today : undefined,
      });

      if (res.appointments) {
        const mapped = res.appointments.map((apt: any) => {
          // Calculate age if DOB is available
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

  // Helper: Translate gender to Vietnamese
  const translateGender = (gender?: string): string => {
    if (!gender) return 'Chưa cập nhật';
    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'm') return 'Nam';
    if (normalized === 'female' || normalized === 'f') return 'Nữ';
    return gender; // Return as-is if already in Vietnamese or unknown
  };

  // Filter Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === 'WAITING') {
        matchesTab = ['CHECKED_IN', 'CONFIRMED', 'PENDING'].includes(apt.status);
      } else if (activeTab === 'IN_PROGRESS') {
        matchesTab = apt.status === 'IN_PROGRESS';
      } else if (activeTab === 'COMPLETED') {
        matchesTab = apt.status === 'COMPLETED';
      } else if (activeTab === 'CANCELLED') {
        matchesTab = ['CANCELLED', 'NO_SHOW'].includes(apt.status);
      }

      return matchesSearch && matchesTab;
    });
  }, [appointments, searchTerm, activeTab]);

  // Stats Logic
  const stats = useMemo(() => [
    {
      title: 'Tổng bệnh nhân',
      value: appointments.length,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Đang chờ',
      value: appointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Hoàn thành',
      value: appointments.filter((a) => a.status === 'COMPLETED').length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ], [appointments]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return { label: 'Đã đến', color: 'text-green-600 bg-green-100', icon: MapPin };
      case 'IN_PROGRESS': return { label: 'Đang khám', color: 'text-blue-600 bg-blue-100', icon: Activity };
      case 'COMPLETED': return { label: 'Đã xong', color: 'text-gray-600 bg-gray-100', icon: CheckCircle2 };
      case 'CONFIRMED': return { label: 'Chờ đến', color: 'text-amber-600 bg-amber-100', icon: Clock };
      case 'CANCELLED': return { label: 'Đã hủy', color: 'text-red-600 bg-red-100', icon: AlertCircle };
      default: return { label: status, color: 'text-gray-600 bg-gray-100', icon: AlertCircle };
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen space-y-8 pb-10">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                <CalendarDays className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Lịch khám bệnh</h1>
                <p className="mt-1 text-blue-100">Quản lý danh sách bệnh nhân và lịch hẹn hôm nay</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
              <div className="text-right">
                <p className="text-sm font-medium text-blue-100">Hôm nay</p>
                <p className="text-xl font-bold">{format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
              </div>
              <div className="h-10 w-[1px] bg-white/20" />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
                onClick={fetchAppointments}
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-lg transition-all hover:shadow-xl">
                <CardContent className="flex items-center p-6">
                  <div className={`mr-4 flex h-14 w-14 items-center justify-center rounded-full ${stat.bg}`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Filters & List */}
          <div className="lg:col-span-12 space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                  <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                  <TabsTrigger value="WAITING">Chờ khám</TabsTrigger>
                  <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
                  <TabsTrigger value="COMPLETED">Đã xong</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm tên hoặc mã BN..."
                    className="pl-9 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200 bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAY">Hôm nay</SelectItem>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Appointment List - Timeline Style */}
            <div className="rounded-3xl bg-white p-6 shadow-xl min-h-[500px]">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-24 w-24 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 rounded-full bg-blue-50 p-6">
                    <ClipboardList className="h-12 w-12 text-blue-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Không có lịch hẹn</h3>
                  <p className="text-gray-500">Không tìm thấy lịch hẹn nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {/* Timeline Line */}
                  <div className="absolute left-8 top-4 bottom-4 w-[2px] bg-gray-100" />

                  <AnimatePresence mode="popLayout">
                    {filteredAppointments.map((apt, index) => {
                      const statusConfig = getStatusConfig(apt.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group relative flex gap-6 pb-8 last:pb-0"
                        >
                          {/* Time Column */}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 bg-white shadow-sm transition-colors group-hover:border-blue-500 group-hover:shadow-md ${apt.status === 'IN_PROGRESS' ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
                              }`}>
                              <span className="text-lg font-bold text-gray-900">
                                {apt.appointmentTime.substring(0, 5)}
                              </span>
                              <span className="text-[10px] font-medium text-gray-500 uppercase">
                                {parseInt(apt.appointmentTime.substring(0, 2)) >= 12 ? 'PM' : 'AM'}
                              </span>
                            </div>
                          </div>

                          {/* Card Content */}
                          <div
                            className={`flex-1 cursor-pointer rounded-2xl border bg-white p-5 transition-all hover:shadow-lg hover:border-blue-200 ${apt.status === 'IN_PROGRESS' ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' : 'border-gray-100 shadow-sm'
                              }`}
                            onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              {/* Patient Info */}
                              <div className="flex items-center gap-4">
                                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${apt.patientName}`} />
                                  <AvatarFallback>{apt.patientName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {apt.patientName}
                                    </h3>
                                    <Badge variant="outline" className="text-xs font-normal text-gray-500">
                                      {apt.patientId}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5" />
                                      {translateGender(apt.patientGender)}
                                      {apt.patientAge ? `, ${apt.patientAge} tuổi` : ''}
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-gray-300" />
                                    <span className="flex items-center gap-1 text-blue-600 font-medium">
                                      {apt.type === 'FOLLOW_UP' ? 'Tái khám' : 'Khám mới'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Reason & Status */}
                              <div className="flex flex-1 items-center justify-between gap-4 md:justify-end">
                                <div className="hidden md:block text-right mr-4">
                                  <p className="text-xs text-gray-400 mb-1">Lý do khám</p>
                                  <p className="text-sm font-medium text-gray-700 max-w-[200px] truncate" title={apt.reason}>
                                    {apt.reason || 'Không có lý do'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Badge className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 ${statusConfig.color} border-none`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusConfig.label}
                                  </Badge>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                                        <MoreVertical className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/doctor/appointments/${apt.id}`); }}>
                                        <Stethoscope className="mr-2 h-4 w-4" /> Xem chi tiết
                                      </DropdownMenuItem>
                                      {apt.status === 'CHECKED_IN' && (
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartExam(apt.id); }} className="text-green-600 focus:text-green-700">
                                          <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu khám
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                        <Phone className="mr-2 h-4 w-4" /> Gọi điện
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions Footer (Optional - visible on hover or always) */}
                            {apt.status === 'CHECKED_IN' && (
                              <div className="mt-4 flex justify-end border-t border-gray-50 pt-3 md:hidden">
                                <Button
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  onClick={(e) => { e.stopPropagation(); handleStartExam(apt.id); }}
                                >
                                  <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu khám ngay
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
