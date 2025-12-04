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
  Sparkles,
  Stethoscope,
  Banknote,
  ShieldCheck
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

type Props = {
  params: Promise<{ id: string }>;
};

type AppointmentLegacyFields = AppointmentReadModel & {
  patient_id?: string;
  patient?: { patient_id?: string };
  doctor_id?: string;
  doctor?: { doctor_id?: string };
};

const statusConfig = (status?: string) => {
  const value = (status || '').toUpperCase();
  switch (value) {
    case 'ARRIVED':
    case 'CHECKED_IN':
      return {
        label: 'Đã check-in',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
        icon: MapPin,
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang khám',
        color: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
        icon: Activity,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        color: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/10',
        icon: CheckCircle,
      };
    case 'CONFIRMED':
    case 'SCHEDULED':
      return {
        label: 'Chờ khám',
        color: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
        icon: Clock,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        color: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
        icon: AlertCircle,
      };
    default:
      return {
        label: value || 'N/A',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: AlertCircle,
      };
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
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

  const status = (appointment?.status || '').toUpperCase();
  const statusInfo = statusConfig(status);
  const StatusIcon = statusInfo.icon;

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
            // Prevent duplicate: check if message already exists
            if (prev.some(m => m.id === payload.new.id)) {
              return prev;
            }
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
          // Prevent duplicate: check if message already exists
          if (prev.some(m => m.id === response.message.id)) {
            return prev;
          }
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
      case 'CONSULTATION': return 'Khám tư vấn';
      case 'FOLLOW_UP': return 'Tái khám';
      case 'EMERGENCY': return 'Cấp cứu';
      case 'ROUTINE': return 'Khám định kỳ';
      case 'TELEMEDICINE': return 'Khám từ xa';
      default: return type || 'Khám thường';
    }
  };

  const translatePaymentStatus = (status?: string): string => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID': return 'Đã thanh toán';
      case 'PENDING': return 'Chờ thanh toán';
      case 'UNPAID': return 'Chưa thanh toán';
      case 'REFUNDED': return 'Đã hoàn tiền';
      case 'FAILED': return 'Thanh toán lỗi';
      default: return status || 'Chưa thanh toán';
    }
  };

  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const role = msg.sender_role?.toLowerCase();
      const isDoctor = role === 'doctor' || role === 'staff';
      const isSystem = role === 'system';

      if (isSystem) {
        return (
          <div key={`${msg.id}-${index}`} className="flex justify-center my-3">
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
          className={cn(
            'flex w-full gap-2.5',
            isDoctor ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
            <AvatarFallback className={cn("text-xs font-bold", isDoctor ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
              {isDoctor ? 'BS' : 'BN'}
            </AvatarFallback>
          </Avatar>

          <div
            className={cn(
              'flex max-w-[80%] flex-col',
              isDoctor ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                'relative rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                isDoctor
                  ? 'rounded-tr-none bg-blue-600 text-white'
                  : 'rounded-tl-none bg-white text-slate-800 border border-slate-100'
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6 p-6"
        >
          {/* Header Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="group -ml-2 h-auto p-0 text-slate-500 hover:bg-transparent hover:text-blue-600"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Quay lại danh sách</span>
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Chi tiết lịch hẹn
                </h1>
                <Badge
                  variant="outline"
                  className={cn('px-2.5 py-0.5 text-xs font-semibold shadow-sm', statusInfo.color)}
                >
                  <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(status === 'CONFIRMED' || status === 'SCHEDULED') && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                  disabled={actionLoading}
                  onClick={() => doAction('start')}
                >
                  <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu khám
                </Button>
              )}
              {(status === 'ARRIVED' || status === 'CHECKED_IN') && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                  disabled={actionLoading}
                  onClick={() => doAction('start')}
                >
                  <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu khám
                </Button>
              )}
              {status === 'IN_PROGRESS' && (
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
                  disabled={actionLoading}
                  onClick={() => doAction('complete')}
                >
                  <CheckSquare className="mr-2 h-4 w-4" /> Hoàn thành
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT COLUMN: Main Info (8 cols) */}
            <motion.div variants={itemVariants} className="space-y-6 lg:col-span-8">

              {/* 1. Patient Info Card (Compact) */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-slate-100">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment?.patient?.fullName}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                          {appointment?.patient?.fullName?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{appointment?.patient?.fullName}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">
                            {translateGender(appointment?.patient?.gender)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span>
                            {appointment?.patient?.dateOfBirth && calculateAge(appointment?.patient?.dateOfBirth)}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="font-mono text-xs text-slate-400">#{appointment?.patient?.patientId || 'ID'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:items-end">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {appointment?.patient?.phone || 'Chưa cập nhật'}
                      </div>
                      {appointment?.patient?.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {appointment?.patient?.email}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Clinical Context (Highlight) */}
              <Card className="border-blue-100 bg-blue-50/30 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                    <Stethoscope className="h-4 w-4" />
                    Thông tin lâm sàng
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lý do khám</label>
                    <p className="text-base font-semibold text-slate-900 leading-relaxed">
                      {appointment?.reason || 'Không có lý do cụ thể'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ghi chú thêm</label>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {appointment?.notes || 'Không có ghi chú'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Logistics Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Appointment Details */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Thời gian & Loại</span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {appointment?.appointmentTime?.substring(0, 5)}
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                          {appointment?.appointmentDate && format(new Date(appointment.appointmentDate), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                          <Globe className="mr-1 h-3 w-3" /> Đặt trực tuyến
                        </Badge>
                        <Badge variant="outline" className="text-slate-600 border-slate-200">
                          {translateAppointmentType(appointment?.type)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Details */}
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Thanh toán</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-mono font-bold text-emerald-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appointment?.consultationFee || 0)}
                        </span>
                        {(appointment?.paymentStatus || '').toUpperCase() === 'PAID' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">
                            Đã thanh toán
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                            {translatePaymentStatus(appointment?.paymentStatus)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-400">Phí khám bệnh (Trả trước)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </motion.div>

            {/* RIGHT COLUMN: Chat (4 cols) */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
              <Card className="flex h-[calc(100vh-140px)] flex-col overflow-hidden border-slate-200 shadow-lg">
                <CardHeader className="border-b border-slate-100 bg-white p-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-9 w-9 border border-slate-100">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${appointment?.patient?.fullName}`} />
                          <AvatarFallback>BN</AvatarFallback>
                        </Avatar>
                        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Trao đổi trực tiếp</h3>
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          Đang trực tuyến
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4">
                  {chatLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                      <p className="text-xs text-slate-500 font-medium">Đang kết nối...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center opacity-60">
                      <div className="bg-white p-4 rounded-full shadow-sm ring-1 ring-slate-100">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">Chưa có tin nhắn</p>
                        <p className="text-xs text-slate-500 mt-1">Bắt đầu trao đổi với bệnh nhân</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {renderedMessages}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                <div className="p-3 bg-white border-t border-slate-100">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      className="flex-1 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-full px-4 h-10 text-sm transition-all"
                      placeholder="Nhập tin nhắn..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={!conversationId || chatSending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className={cn(
                        "rounded-full h-10 w-10 shrink-0 transition-all shadow-sm",
                        chatInput.trim()
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
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
    </DashboardLayout>
  );
}
