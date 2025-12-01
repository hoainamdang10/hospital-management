'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Stethoscope,
  Activity,
  Banknote,
  UserCircle2,
  MoreVertical,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { toast } from 'sonner';
import { chatService, ChatMessage } from '@/lib/api/chat.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

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
      return {
        label: 'Đã check-in',
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        icon: MapPin,
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang khám',
        color: 'bg-blue-500/10 text-blue-600 border-blue-200',
        icon: Activity,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        color: 'bg-gray-500/10 text-gray-600 border-gray-200',
        icon: CheckCircle,
      };
    case 'CONFIRMED':
    case 'SCHEDULED':
      return {
        label: 'Chờ khám',
        color: 'bg-amber-500/10 text-amber-600 border-amber-200',
        icon: Clock,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        color: 'bg-red-500/10 text-red-600 border-red-200',
        icon: AlertCircle,
      };
    default:
      return {
        label: value || 'N/A',
        color: 'bg-gray-500/10 text-gray-600 border-gray-200',
        icon: AlertCircle,
      };
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
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
  const [isChatExpanded, setIsChatExpanded] = useState(true);

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

    if (!isSupabaseConfigured() || !client) {
      return;
    }

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
          const newMsg = payload.new;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Chat connected ✓');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Connection error');
        }
      });

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
        setMessages((prev) => [...prev, response.message]);
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

  // Memoize rendered messages to prevent re-render on every keystroke
  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => {
      const role = msg.sender_role?.toLowerCase();
      const isDoctor = role === 'doctor' || role === 'staff';
      const isSystem = role === 'system';

      if (isSystem) {
        return (
          <div key={`${msg.id}-${index}`} className="flex justify-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
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
            'flex w-full gap-3',
            isDoctor ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-white',
              isDoctor ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'
            )}
          >
            {isDoctor ? (
              <Stethoscope className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>

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
                  : 'rounded-tl-none bg-white text-slate-700'
              )}
            >
              <p className="leading-relaxed">{msg.content}</p>
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-xl ring-1 ring-gray-900/5">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="animate-pulse text-sm font-medium text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-900">
      <motion.div
        className="mx-auto max-w-7xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col justify-between gap-6 md:flex-row md:items-center"
        >
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="group -ml-3 h-auto p-2 text-slate-500 hover:bg-transparent hover:text-blue-600"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm font-medium">Quay lại danh sách</span>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Chi tiết lịch hẹn
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium shadow-sm backdrop-blur-sm',
                  statusInfo.color
                )}
              >
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium">Mã hồ sơ:</span>
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                {appointment?.appointment_id || appointmentId}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(status === 'CONFIRMED' || status === 'SCHEDULED') && (
              <Button
                size="lg"
                className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 hover:bg-emerald-700 hover:shadow-emerald-600/30"
                disabled={actionLoading}
                onClick={() => doAction('checkin')}
              >
                <MapPin className="mr-2 h-5 w-5" /> Check-in
              </Button>
            )}
            {status === 'ARRIVED' && (
              <Button
                size="lg"
                className="bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-blue-600/30"
                disabled={actionLoading}
                onClick={() => doAction('start')}
              >
                <PlayCircle className="mr-2 h-5 w-5" /> Bắt đầu khám
              </Button>
            )}
            {status === 'IN_PROGRESS' && (
              <Button
                size="lg"
                className="bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105 hover:bg-slate-800 hover:shadow-slate-900/30"
                disabled={actionLoading}
                onClick={() => doAction('complete')}
              >
                <CheckSquare className="mr-2 h-5 w-5" /> Hoàn thành
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content (8 cols) */}
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-8">
            {/* Patient Hero Card */}
            <Card className="group relative overflow-hidden border-none bg-white shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-200/60">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-[0.03] transition-opacity group-hover:opacity-[0.05]"></div>
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl transition-all group-hover:bg-blue-500/20"></div>

              <CardContent className="relative p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 shadow-inner">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="absolute right-1 bottom-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 shadow-sm"></div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                          {appointment?.patient?.fullName || 'Bệnh nhân'}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">Bệnh nhân thường xuyên</p>
                      </div>
                      <Button
                        variant="outline"
                        className="hidden gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:flex"
                      >
                        <FileText className="h-4 w-4" />
                        Hồ sơ bệnh án
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                        <Phone className="h-3.5 w-3.5" />
                        {appointment?.patient?.phone || 'Chưa cập nhật'}
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                        <Mail className="h-3.5 w-3.5" />
                        {appointment?.patient?.email || 'Chưa cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8 opacity-50" />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3 rounded-2xl bg-orange-50/50 p-5 ring-1 ring-orange-100">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="h-5 w-5" />
                      <h3 className="font-semibold">Lý do khám</h3>
                    </div>
                    <p className="leading-relaxed text-slate-700">
                      {appointment?.reason || 'Không có lý do cụ thể'}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-blue-50/50 p-5 ring-1 ring-blue-100">
                    <div className="flex items-center gap-2 text-blue-700">
                      <FileText className="h-5 w-5" />
                      <h3 className="font-semibold">Ghi chú</h3>
                    </div>
                    <p className="leading-relaxed text-slate-700">
                      {appointment?.notes || 'Không có ghi chú thêm'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  label: 'Thời gian',
                  value: appointment?.appointmentDate,
                  sub: appointment?.appointmentTime,
                  icon: Calendar,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50',
                },
                {
                  label: 'Bác sĩ',
                  value: appointment?.doctor?.fullName,
                  sub: appointment?.doctor?.department,
                  icon: Stethoscope,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                },
                {
                  label: 'Thanh toán',
                  value: appointment?.paymentStatus,
                  sub: 'Trạng thái',
                  icon: Banknote,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  label: 'Mức độ ưu tiên',
                  value: appointment?.priority,
                  sub: 'Đánh giá',
                  icon: ShieldCheck,
                  color: 'text-rose-600',
                  bg: 'bg-rose-50',
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="group overflow-hidden border-none bg-white shadow-md shadow-slate-200/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110',
                        item.bg,
                        item.color
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                        {item.label}
                      </p>
                      <p className="font-bold text-slate-900">{item.value}</p>
                      <p className="text-sm font-medium text-slate-500">{item.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Chat (4 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <Card className="flex h-[calc(100vh-140px)] flex-col overflow-hidden border-none bg-white shadow-xl ring-1 shadow-slate-200/50 ring-slate-200/50">
              <CardHeader className="border-b border-slate-100 bg-white/80 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-white"></span>
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">Trao đổi</CardTitle>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                        <p className="text-xs font-medium text-slate-500">Trực tuyến</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                {chatLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm font-medium text-slate-500">Đang kết nối...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-200">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Chưa có tin nhắn</p>
                      <p className="text-sm text-slate-500">
                        Bắt đầu cuộc trò chuyện với bệnh nhân
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {renderedMessages}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 bg-white p-4">
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                  <Input
                    className="flex-1 rounded-full border-slate-200 bg-slate-50 pr-12 shadow-inner transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Nhập tin nhắn..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={!conversationId || chatSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!conversationId || chatSending || !chatInput.trim()}
                    className={cn(
                      'absolute right-1 h-8 w-8 rounded-full shadow-md transition-all hover:scale-105 active:scale-95',
                      chatInput.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                    )}
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
  );
}
