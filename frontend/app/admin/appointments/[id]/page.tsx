'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  CreditCard,
  Printer,
  Activity,
  Shield,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { appointmentsService } from '@/lib/api/appointments.service';
import { DashboardLayout } from '@/components/layout';
import { showErrorToast } from '@/lib/utils/error-toast';

interface AppointmentDetail {
  id: string;
  appointmentId: string;
  status: string;
  type: string;
  priority: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  reason: string;
  notes?: string;
  cancellationReason?: string;
  patient: {
    id: string;
    patientId: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    address?: string;
  };
  doctor: {
    id: string;
    fullName: string;
    specialization: string;
    departmentId: string;
  };
  department?: {
    code: string;
    name: string;
  };
  timeline?: {
    createdAt: string;
    confirmedAt?: string;
    checkedInAt?: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

// Status configuration
const statusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof CheckCircle2 }
> = {
  SCHEDULED: {
    label: 'Đã đặt lịch',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CalendarIcon,
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },

  IN_PROGRESS: {
    label: 'Đang khám',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Activity,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
  },
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const fetchAppointment = async () => {
    if (!id) {
      console.log('No ID provided');
      setIsLoading(false);
      return;
    }
    console.log('Fetching appointment with ID:', id);
    setIsLoading(true);
    try {
      const data = await appointmentsService.getById(id);
      console.log('Appointment data received:', data);

      setAppointment({
        id: data.id,
        appointmentId: data.appointmentId,
        status: data.status || 'SCHEDULED',
        type: data.type || 'CONSULTATION',
        priority: data.priority || 'NORMAL',
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        durationMinutes: data.durationMinutes || 30,
        reason: data.reason || '',
        notes: data.notes,
        cancellationReason: data.cancellationReason,
        patient: {
          id: data.patientId || '',
          patientId: data.patient?.patientId || data.patientId || '',
          fullName: data.patient?.fullName || data.patientName || data.patientFullName || 'N/A',
          phoneNumber: data.patient?.phone || data.patientPhone || 'N/A',
          email: data.patient?.email || data.patientEmail || 'N/A',
          dateOfBirth: data.patient?.dateOfBirth || data.patientDateOfBirth || '1990-01-01',
          gender: data.patient?.gender || data.patientGender || 'Unknown',
          address: data.patient?.address || data.patientAddress || '',
        },
        doctor: {
          id: data.doctorId || '',
          fullName: data.doctor?.fullName || data.doctorName || data.doctorFullName || 'N/A',
          specialization: data.doctor?.specialization || data.doctorSpecialization || 'General',
          departmentId: data.doctor?.department || data.departmentId || '',
        },
        timeline: {
          createdAt: data.createdAt || new Date().toISOString(),
          confirmedAt: data.confirmedAt,
          checkedInAt: data.checkedInAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          cancelledAt: data.cancelledAt,
        },
      });
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      showErrorToast(error, {
        title: 'Không thể tải thông tin lịch hẹn',
        fallbackMessage: 'Không thể tải thông tin lịch hẹn. Vui lòng thử lại.',
        context: 'Admin/Appointments:detail',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (appointment?.appointmentDate) {
      try {
        setRescheduleDate(format(new Date(appointment.appointmentDate), 'yyyy-MM-dd'));
      } catch {
        setRescheduleDate('');
      }
    }
    if (appointment?.appointmentTime) {
      setRescheduleTime(appointment.appointmentTime.substring(0, 5));
    }
  }, [appointment]);

  const handleStatusChange = async (action: 'confirm' | 'cancel' | 'check-in' | 'complete') => {
    try {
      let res;
      switch (action) {
        case 'confirm':
          res = await appointmentsService.confirm(id);
          break;
        case 'cancel':
          if (!cancelReason.trim()) {
            toast.error('Vui lòng nhập lý do hủy');
            return;
          }
          res = await appointmentsService.cancel(id, { cancellationReason: cancelReason });
          setIsCancelDialogOpen(false);
          break;
        case 'complete':
          break;
      }

      if (res && res.success) {
        toast.success('Cập nhật trạng thái thành công');
        fetchAppointment();
      }
    } catch (error: any) {
      console.error('[AdminAppointmentDetail] Failed to update status', error);
      showErrorToast(error, {
        title: 'Lỗi cập nhật trạng thái',
        fallbackMessage: 'Không thể cập nhật trạng thái lịch hẹn. Vui lòng thử lại.',
        context: `Admin/Appointments:detail:update:${action}`,
      });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Vui lòng chọn ngày và giờ mới');
      return;
    }
    setIsRescheduling(true);
    try {
      const response = await appointmentsService.reschedule(id, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
        reason: rescheduleNote || 'Đổi lịch hẹn bởi quản trị viên',
      });
      if (response?.success) {
        toast.success('Đã dời lịch hẹn thành công');
        setIsRescheduleDialogOpen(false);
        fetchAppointment();
      }
    } catch (error: any) {
      console.error('[AdminAppointmentDetail] Failed to reschedule', error);
      showErrorToast(error, {
        title: 'Không thể dời lịch hẹn',
        fallbackMessage: 'Không thể dời lịch hẹn. Vui lòng thử lại sau.',
        context: 'Admin/Appointments:detail:reschedule',
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status.toUpperCase()] || statusConfig.SCHEDULED;
  };

  const translateType = (type: string) => {
    const types: Record<string, string> = {
      CONSULTATION: 'Khám tư vấn',
      FOLLOW_UP: 'Tái khám',
      EMERGENCY: 'Cấp cứu',
      ROUTINE: 'Khám định kỳ',
    };
    return types[type?.toUpperCase()] || type || 'Khám thường';
  };

  const formatAddress = (address: any): string => {
    if (!address) return '';

    // If it's a JSON string, parse it first
    let addressObj = address;
    if (typeof address === 'string') {
      // Check if it looks like JSON
      if (address.startsWith('{') && address.endsWith('}')) {
        try {
          addressObj = JSON.parse(address);
        } catch {
          return address; // Return as-is if parsing fails
        }
      } else {
        return address; // Return plain string as-is
      }
    }

    // Handle address object: {street, ward, district, city/province, country}
    const parts: string[] = [];
    if (addressObj.street) parts.push(addressObj.street);
    if (addressObj.ward) parts.push(`Phường ${addressObj.ward}`);
    if (addressObj.district) parts.push(`Quận ${addressObj.district}`);
    if (addressObj.city || addressObj.province) parts.push(addressObj.city || addressObj.province);

    return parts.join(', ') || '';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
            <p className="font-medium text-slate-600">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <AlertCircle className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Không tìm thấy lịch hẹn</h2>
            <p className="text-slate-500">Lịch hẹn này không tồn tại hoặc đã bị xóa</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const config = getStatusConfig(appointment.status);
  const StatusIcon = config.icon;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-teal-50/20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-6xl p-6 pb-12"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              {/* Left: Back + Title */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="group -ml-2 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Quay lại danh sách
                </Button>

                <div className="flex items-start gap-4">
                  <div
                    className={`h-14 w-14 shrink-0 rounded-2xl ${config.bgColor} ${config.borderColor} flex items-center justify-center border-2 shadow-sm`}
                  >
                    <StatusIcon className={`h-7 w-7 ${config.color}`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold text-slate-900">
                        Lịch hẹn #{appointment.appointmentId}
                      </h1>
                      <Badge
                        className={`${config.bgColor} ${config.color} ${config.borderColor} border px-3 py-1 font-medium`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Tạo ngày{' '}
                      {format(
                        new Date(appointment.timeline?.createdAt || new Date()),
                        'dd/MM/yyyy • HH:mm'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {appointment.status.toUpperCase() === 'SCHEDULED' && (
                  <Button
                    onClick={() => handleStatusChange('confirm')}
                    className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Xác nhận lịch
                  </Button>
                )}

                {['SCHEDULED', 'CONFIRMED'].includes(appointment.status.toUpperCase()) && (
                  <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-cyan-200 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Dời lịch
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Dời lịch hẹn</DialogTitle>
                        <DialogDescription>
                          Chọn ngày và giờ mới cho lịch hẹn. Hệ thống sẽ thông báo lại cho bệnh
                          nhân.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">Ngày mới</label>
                          <Input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">Giờ mới</label>
                          <Input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                          Ghi chú (tùy chọn)
                        </label>
                        <Textarea
                          placeholder="Ví dụ: Bác sĩ đổi lịch, yêu cầu từ bệnh nhân..."
                          value={rescheduleNote}
                          onChange={(e) => setRescheduleNote(e.target.value)}
                          className="min-h-[90px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
                          Đóng
                        </Button>
                        <Button onClick={handleReschedule} disabled={isRescheduling}>
                          {isRescheduling ? 'Đang dời lịch...' : 'Xác nhận dời lịch'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {['SCHEDULED', 'CONFIRMED'].includes(appointment.status.toUpperCase()) && (
                  <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Hủy lịch
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-red-600">Hủy lịch hẹn</DialogTitle>
                        <DialogDescription>
                          Hành động này không thể hoàn tác. Vui lòng nhập lý do hủy lịch.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Nhập lý do hủy..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                          Đóng
                        </Button>
                        <Button variant="destructive" onClick={() => handleStatusChange('cancel')}>
                          Xác nhận hủy
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="border-slate-200">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="cursor-pointer">
                      <Printer className="mr-2 h-4 w-4" /> In phiếu khám
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" /> Tạo hóa đơn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - 2/3 */}
            <div className="space-y-6 lg:col-span-2">
              {/* Appointment Details Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="cursor-default overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/50 to-transparent px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
                      <CalendarIcon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900">Thông tin lịch khám</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                        Ngày khám
                      </label>
                      <p className="text-lg font-semibold text-slate-900 capitalize">
                        {format(new Date(appointment.appointmentDate), 'EEEE, dd/MM/yyyy', {
                          locale: vi,
                        })}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium tracking-wider text-slate-500 uppercase">
                        Giờ khám
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {appointment.appointmentTime?.substring(0, 5)}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 font-normal text-slate-600"
                        >
                          {appointment.durationMinutes} phút
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Loại khám</span>
                      <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700">
                        {translateType(appointment.type)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-slate-500">Lý do khám</label>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm leading-relaxed text-slate-700">
                          {appointment.reason || 'Không có lý do cụ thể'}
                        </p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="space-y-2">
                        <label className="text-sm text-slate-500">Ghi chú</label>
                        <p className="text-sm text-slate-600">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.status.toUpperCase() === 'CANCELLED' &&
                      appointment.cancellationReason && (
                        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Lý do hủy</p>
                              <p className="mt-1 text-sm text-red-600">
                                {appointment.cancellationReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>

              {/* Doctor Info Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="cursor-default overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-transparent px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                      <Stethoscope className="h-5 w-5 text-teal-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900">Bác sĩ phụ trách</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-xl font-bold text-white shadow-lg shadow-teal-500/20">
                      {appointment.doctor.fullName?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        BS. {appointment.doctor.fullName}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-teal-600">
                        {appointment.doctor.specialization}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span>Khoa: {appointment.doctor.departmentId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - 1/3 */}
            <div className="space-y-6">
              {/* Patient Info Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="cursor-default overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-transparent px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <User className="h-5 w-5 text-violet-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900">Thông tin bệnh nhân</h2>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {appointment.patient.fullName}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Mã BN: {appointment.patient.patientId}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Phone className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-slate-700">{appointment.patient.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="break-all text-slate-700">{appointment.patient.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <CalendarIcon className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-slate-700">
                        {format(new Date(appointment.patient.dateOfBirth), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <MapPin className="h-4 w-4 text-slate-500" />
                      </div>
                      <span className="text-slate-700">
                        {formatAddress(appointment.patient.address) || 'Chưa cập nhật địa chỉ'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Timeline Card */}
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="cursor-default overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm"
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    <h2 className="font-semibold text-slate-900">Trạng thái</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute top-3 bottom-3 left-[11px] w-0.5 bg-gradient-to-b from-cyan-200 via-slate-200 to-slate-100" />

                    <div className="space-y-6">
                      {/* Created */}
                      <div className="relative flex gap-4">
                        <div className="z-10 h-6 w-6 rounded-full border-4 border-cyan-100 bg-cyan-500 shadow-sm" />
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-medium text-slate-900">Đã đặt lịch</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {format(
                              new Date(appointment.timeline?.createdAt || ''),
                              'HH:mm • dd/MM/yyyy'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Confirmed */}
                      {appointment.timeline?.confirmedAt && (
                        <div className="relative flex gap-4">
                          <div className="z-10 h-6 w-6 rounded-full border-4 border-emerald-100 bg-emerald-500 shadow-sm" />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900">Đã xác nhận</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {format(
                                new Date(appointment.timeline.confirmedAt),
                                'HH:mm • dd/MM/yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Checked In */}
                      {appointment.timeline?.checkedInAt && (
                        <div className="relative flex gap-4">
                          <div className="z-10 h-6 w-6 rounded-full border-4 border-violet-100 bg-violet-500 shadow-sm" />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900">Đã check-in</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {format(
                                new Date(appointment.timeline.checkedInAt),
                                'HH:mm • dd/MM/yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Started */}
                      {appointment.timeline?.startedAt && (
                        <div className="relative flex gap-4">
                          <div className="z-10 h-6 w-6 rounded-full border-4 border-amber-100 bg-amber-500 shadow-sm" />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900">Bắt đầu khám</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {format(
                                new Date(appointment.timeline.startedAt),
                                'HH:mm • dd/MM/yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Completed */}
                      {appointment.timeline?.completedAt && (
                        <div className="relative flex gap-4">
                          <div className="z-10 h-6 w-6 rounded-full border-4 border-slate-100 bg-slate-500 shadow-sm" />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-slate-900">Hoàn thành</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {format(
                                new Date(appointment.timeline.completedAt),
                                'HH:mm • dd/MM/yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cancelled */}
                      {appointment.timeline?.cancelledAt && (
                        <div className="relative flex gap-4">
                          <div className="z-10 h-6 w-6 rounded-full border-4 border-red-100 bg-red-500 shadow-sm" />
                          <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-red-600">Đã hủy</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {format(
                                new Date(appointment.timeline.cancelledAt),
                                'HH:mm • dd/MM/yyyy'
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
