'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  CheckCircle,
  PlayCircle,
  CheckSquare,
  MessageSquare,
  Send,
  ArrowLeft,
  MapPin,
  Activity,
  CreditCard,
  Globe,
  MoreVertical,
  Stethoscope,
  Banknote,
  Heart,
  Sparkles,
  XCircle,
  UserX,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { toast } from 'sonner';
import { chatService, ChatMessage } from '@/lib/api/chat.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  params: Promise<{ id: string }>;
};

type AppointmentLegacyFields = AppointmentReadModel & {
  patient_id?: string;
  patient?: { patient_id?: string };
  doctor_id?: string;
  doctor?: { doctor_id?: string };
};

// Status configuration with updated colors
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  IN_PROGRESS: {
    label: 'Đang khám',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: Activity,
  },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-200',
    icon: CheckCircle,
  },
  CONFIRMED: {
    label: 'Chờ khám',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: Clock,
  },
  SCHEDULED: {
    label: 'Đã đặt',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: Calendar,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: AlertCircle,
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    icon: UserX,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

export default function DoctorAppointmentDetailPage({ params }: Props) {
  const router = useRouter();
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [appointment, setAppointment] = useState<AppointmentReadModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Doctor actions: Cancel & No-show
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());

  const allowEarlyStart = process.env.NEXT_PUBLIC_ALLOW_EARLY_START === 'true';
  const allowEarlyNoShow = process.env.NEXT_PUBLIC_ALLOW_EARLY_NO_SHOW === 'true';

  useEffect(() => {
    const intervalId = setInterval(() => setCurrentTimeMs(Date.now()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    params.then(({ id }) => setAppointmentId(id));
  }, [params]);

  const load = async () => {
    if (!appointmentId) return;
    try {
      setLoading(true);
      const data = await appointmentsService.getById(appointmentId);
      setAppointment(data);
      await initChat(appointmentId, data);
    } catch (error) {
      console.error('Failed to load appointment details', error);
      toast.error('Không tải được thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    if (isSupabaseConfigured()) return;

    const interval = setInterval(() => {
      loadMessages(conversationId);
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId, appointment]);

  const getChatContext = (apt?: AppointmentReadModel | null) => {
    if (!apt) return {};
    const legacy = apt as AppointmentLegacyFields;
    const doctorId =
      apt?.doctor?.doctorId ?? apt?.doctorId ?? legacy?.doctor_id ?? legacy?.doctor?.doctor_id;
    return doctorId ? { doctorId } : {};
  };

  const doAction = async (action: 'checkin' | 'start' | 'complete') => {
    try {
      setActionLoading(true);
      if (action === 'checkin') await appointmentsService.checkInAppointment(appointmentId);
      if (action === 'start') await appointmentsService.startAppointment(appointmentId);
      if (action === 'complete') await appointmentsService.completeAppointment(appointmentId);
      await load();
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      console.error('Doctor action failed', error);
      toast.error('Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Doctor Cancel (hoàn tiền 100% cho bệnh nhân)
  const handleDoctorCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }
    setIsCancelling(true);
    try {
      await appointmentsService.cancel(appointmentId, {
        cancellationReason: `[Bác sĩ hủy] ${cancelReason}`,
      });
      toast.success('Đã hủy lịch hẹn. Bệnh nhân sẽ được hoàn tiền 100%');
      setShowCancelDialog(false);
      setCancelReason('');
      router.push('/doctor/appointments');
    } catch (error: any) {
      console.error('Doctor cancel failed', error);
      toast.error(error?.message || 'Không thể hủy lịch hẹn');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handler: Mark No-show (bệnh nhân vắng mặt - không hoàn tiền)
  const handleMarkNoShow = async () => {
    setIsMarkingNoShow(true);
    try {
      await appointmentsService.markNoShow(appointmentId);
      toast.success('Đã đánh dấu bệnh nhân vắng mặt');
      setShowNoShowDialog(false);
      await load();
    } catch (error: any) {
      console.error('Mark no-show failed', error);
      toast.error(error?.message || 'Không thể đánh dấu vắng mặt');
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const status = (appointment?.status || '').toUpperCase();
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
  const StatusIcon = statusInfo.icon;
  const appointmentStartDate = useMemo(() => {
    if (!appointment?.appointmentDate) return null;
    const parsed = new Date(appointment.appointmentDate);
    if (appointment?.appointmentTime) {
      const [hoursString, minutesString] = appointment.appointmentTime.split(':');
      const hours = Number(hoursString);
      const minutes = Number(minutesString);
      if (!Number.isNaN(hours)) {
        parsed.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
      }
    }
    return parsed;
  }, [appointment?.appointmentDate, appointment?.appointmentTime]);

  const hasReachedStartTime = appointmentStartDate
    ? currentTimeMs >= appointmentStartDate.getTime()
    : false;
  const hasPassedNoShowThreshold = appointmentStartDate
    ? currentTimeMs >= appointmentStartDate.getTime() + 15 * 60 * 1000
    : false;
  const canStartExam = allowEarlyStart || hasReachedStartTime;
  const canMarkNoShow = allowEarlyNoShow || hasPassedNoShowThreshold;

  async function initChat(aptId: string, aptData?: AppointmentReadModel | null) {
    try {
      setChatLoading(true);
      const chatContext = getChatContext(aptData ?? appointment);
      const convo = await chatService.getOrCreateConversation(aptId, chatContext);
      if (convo?.conversationId) {
        setConversationId(convo.conversationId);
        await loadMessages(convo.conversationId, chatContext);
        setupRealtime(convo.conversationId);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setChatLoading(false);
    }
  }

  async function loadMessages(convoId: string, chatContext?: ReturnType<typeof getChatContext>) {
    const context = chatContext ?? getChatContext(appointment);
    const res = await chatService.getMessages(convoId, context);
    setMessages(res.messages || []);
  }

  function setupRealtime(convoId: string) {
    const client = supabase;
    if (!isSupabaseConfigured() || !client) return;

    const channel = client
      .channel(`chat-${convoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'appointments_schema',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convoId}`,
        },
        (payload: { new: ChatMessage }) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      if (client) client.removeChannel(channel);
    };
  }

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!conversationId || !chatInput.trim()) return;
    try {
      setChatSending(true);
      const chatContext = getChatContext(appointment);
      const response = await chatService.sendMessage(conversationId, chatInput.trim(), chatContext);
      setChatInput('');
      if (response?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === response.message.id)) return prev;
          return [...prev, response.message];
        });
      } else if (!isSupabaseConfigured()) {
        await loadMessages(conversationId, chatContext);
      }
    } catch (error) {
      console.error('Send message failed', error);
      toast.error('Không gửi được tin nhắn');
    } finally {
      setChatSending(false);
    }
  }

  const translateGender = (gender?: string): string => {
    if (!gender) return 'Chưa cập nhật';
    const normalized = gender.toLowerCase();
    if (normalized === 'male' || normalized === 'm') return 'Nam';
    if (normalized === 'female' || normalized === 'f') return 'Nữ';
    return gender;
  };

  const calculateAge = (dob?: string | Date): string => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} tuổi`;
  };

  const translateAppointmentType = (type?: string): string => {
    const t = (type || '').toUpperCase();
    switch (t) {
      case 'CONSULTATION':
        return 'Khám tư vấn';
      case 'FOLLOW_UP':
        return 'Tái khám';
      case 'EMERGENCY':
        return 'Cấp cứu';
      case 'ROUTINE':
        return 'Khám định kỳ';
      case 'TELEMEDICINE':
        return 'Khám từ xa';
      default:
        return type || 'Khám thường';
    }
  };

  const translatePaymentStatus = (status?: string): string => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'UNPAID':
        return 'Chưa thanh toán';
      case 'REFUNDED':
        return 'Đã hoàn tiền';
      case 'FAILED':
        return 'Thanh toán lỗi';
      default:
        return status || 'Chưa thanh toán';
    }
  };

  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const role = msg.sender_role?.toLowerCase();
      const isDoctor = role === 'doctor' || role === 'staff';
      const isSystem = role === 'system';

      if (isSystem) {
        return (
          <div key={`${msg.id}-${index}`} className="my-3 flex justify-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {msg.content}
            </span>
          </div>
        );
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={`${msg.id}-${index}`}
          className={cn('flex w-full gap-2.5', isDoctor ? 'flex-row-reverse' : 'flex-row')}
        >
          <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
            <AvatarFallback
              className={cn(
                'text-xs font-bold',
                isDoctor ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {isDoctor ? 'BS' : 'BN'}
            </AvatarFallback>
          </Avatar>

          <div className={cn('flex max-w-[80%] flex-col', isDoctor ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'relative rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                isDoctor
                  ? 'rounded-tr-none bg-gradient-to-br from-cyan-600 to-teal-600 text-white'
                  : 'rounded-tl-none border border-slate-100 bg-white text-slate-800'
              )}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              {new Date(msg.sent_at).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </motion.div>
      );
    });
  }, [messages]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6 p-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Button
              variant="ghost"
              className="group -ml-2 h-auto p-0 text-slate-500 hover:bg-transparent hover:text-cyan-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">Quay lại danh sách</span>
            </Button>

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-6 text-white shadow-xl">
              {/* Background decoration */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm"
                  >
                    <Stethoscope className="h-7 w-7 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold">Chi tiết lịch hẹn</h1>
                    <p className="mt-0.5 text-sm text-cyan-100">
                      Mã: #{appointment?.appointmentId || appointmentId.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={cn(
                      'border px-3 py-1.5 text-sm font-semibold',
                      statusInfo.bg,
                      statusInfo.color
                    )}
                  >
                    <StatusIcon className="mr-1.5 h-4 w-4" />
                    {statusInfo.label}
                  </Badge>

                  {/* Bắt đầu khám - Hiện cho CONFIRMED/SCHEDULED */}
                  {(status === 'CONFIRMED' || status === 'SCHEDULED') && (
                    <Button
                      className="bg-white text-cyan-700 shadow-lg transition-all hover:scale-105 hover:bg-cyan-50"
                      disabled={actionLoading || !canStartExam}
                      title={
                        !canStartExam && !allowEarlyStart
                          ? 'Chỉ bắt đầu khám khi đến giờ hẹn'
                          : undefined
                      }
                      onClick={() => doAction('start')}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Bắt đầu khám
                    </Button>
                  )}
                  {status === 'IN_PROGRESS' && (
                    <Button
                      className="bg-white text-slate-900 shadow-lg transition-all hover:scale-105 hover:bg-slate-50"
                      disabled={actionLoading}
                      onClick={() => doAction('complete')}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Hoàn thành
                    </Button>
                  )}

                  {/* Doctor Cancel Button - Hiện khi chưa bắt đầu khám */}
                  {(status === 'CONFIRMED' || status === 'SCHEDULED') && (
                    <Button
                      variant="outline"
                      className="border-rose-300 text-rose-700 shadow-lg transition-all hover:scale-105 hover:bg-rose-50"
                      disabled={actionLoading || isCancelling}
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Hủy lịch
                    </Button>
                  )}

                  {/* No-show Button - Chỉ hiện khi CONFIRMED/SCHEDULED + đã quá giờ 15 phút */}
                  {(status === 'CONFIRMED' || status === 'SCHEDULED') && (
                    <Button
                      variant="outline"
                      className="border-orange-300 text-orange-700 shadow-lg transition-all hover:scale-105 hover:bg-orange-50"
                      disabled={actionLoading || isMarkingNoShow || !canMarkNoShow}
                      title={
                        !canMarkNoShow && !allowEarlyNoShow
                          ? 'Chỉ đánh dấu vắng mặt sau 15 phút kể từ giờ khám'
                          : undefined
                      }
                      onClick={() => setShowNoShowDialog(true)}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      BN vắng mặt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column */}
            <motion.div variants={itemVariants} className="space-y-5 lg:col-span-8">
              {/* Patient Card */}
              <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-3 border-white shadow-lg ring-2 ring-cyan-100">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment?.patient?.fullName}`}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-bold text-white">
                          {appointment?.patient?.fullName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {appointment?.patient?.fullName}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">
                            {translateGender(appointment?.patient?.gender)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>
                            {appointment?.patient?.dateOfBirth &&
                              calculateAge(appointment?.patient?.dateOfBirth)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <Badge variant="outline" className="font-mono text-xs text-slate-500">
                            {appointment?.patient?.patientId || 'ID'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        {appointment?.patient?.phone || 'Chưa cập nhật'}
                      </div>
                      {appointment?.patient?.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                            <Mail className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="max-w-[200px] truncate">
                            {appointment?.patient?.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Info */}
              <Card className="border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-teal-50/30 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100">
                      <Heart className="h-5 w-5 text-cyan-600" />
                    </div>
                    <span className="text-sm font-bold tracking-wider text-cyan-700 uppercase">
                      Thông tin lâm sàng
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Lý do khám
                    </label>
                    <p className="text-base leading-relaxed font-semibold text-slate-900">
                      {appointment?.reason || 'Không có lý do cụ thể'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                      Ghi chú thêm
                    </label>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {appointment?.notes || 'Không có ghi chú'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Time & Payment Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Time Card */}
                <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-bold tracking-wide uppercase">
                        Thời gian & Loại
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {appointment?.appointmentTime?.substring(0, 5)}
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        {appointment?.appointmentDate &&
                          format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', {
                            locale: vi,
                          })}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                        <Globe className="mr-1 h-3 w-3" />
                        Đặt trực tuyến
                      </Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        {translateAppointmentType(appointment?.type)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Card */}
                <Card className="group relative overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <Banknote className="h-4 w-4" />
                      <span className="text-xs font-bold tracking-wide uppercase">Thanh toán</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-bold text-emerald-600">
                        {new Intl.NumberFormat('vi-VN').format(appointment?.consultationFee || 0)}
                        <span className="ml-1 text-lg">₫</span>
                      </span>
                      {(appointment?.paymentStatus || '').toUpperCase() === 'PAID' ? (
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Đã thanh toán
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          {translatePaymentStatus(appointment?.paymentStatus)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Phí khám bệnh (Trả trước)</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Right Column: Chat */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
              <Card className="flex h-[calc(100vh-200px)] flex-col overflow-hidden border-slate-200 shadow-lg">
                {/* Chat Header */}
                <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-600 to-teal-600 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-white/30">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment?.patient?.fullName}`}
                          />
                          <AvatarFallback className="bg-white/20 font-bold text-white">
                            BN
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-cyan-600 bg-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Trao đổi trực tiếp</h3>
                        <p className="flex items-center gap-1 text-[11px] font-medium text-cyan-100">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                          Đang trực tuyến
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4">
                  {chatLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                      <p className="text-xs font-medium text-slate-500">Đang kết nối...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 shadow-sm">
                        <MessageSquare className="h-7 w-7 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Chưa có tin nhắn</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Bắt đầu trao đổi với bệnh nhân
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderedMessages}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border-t border-slate-100 bg-white p-3">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      className="h-10 flex-1 rounded-full border-slate-200 bg-slate-50 px-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nhập tin nhắn..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={!conversationId || chatSending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        'h-10 w-10 shrink-0 rounded-full shadow-sm transition-all',
                        chatInput.trim()
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      )}
                      disabled={!conversationId || chatSending || !chatInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5" />
              Hủy lịch hẹn
            </DialogTitle>
            <DialogDescription>
              Bệnh nhân sẽ được hoàn tiền 100%. Vui lòng nhập lý do hủy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Nhập lý do hủy (bắt buộc)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
              disabled={isCancelling}
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleDoctorCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-show Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <UserX className="h-5 w-5" />
              Đánh dấu vắng mặt
            </DialogTitle>
            <DialogDescription>
              Bệnh nhân đã check-in nhưng không đến khám. Lịch hẹn sẽ được đánh dấu là No-show và{' '}
              <strong>không được hoàn tiền</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
              <p className="font-medium">Lưu ý:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Phí khám sẽ không được hoàn trả cho bệnh nhân</li>
                <li>Hành động này không thể hoàn tác</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowNoShowDialog(false)}
              disabled={isMarkingNoShow}
            >
              Đóng
            </Button>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleMarkNoShow}
              disabled={isMarkingNoShow}
            >
              {isMarkingNoShow ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Xác nhận vắng mặt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
