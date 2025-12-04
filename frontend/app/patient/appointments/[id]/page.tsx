'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Printer,
  Send,
  MessageSquare,
  CreditCard,
  Info,
  Minimize2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { chatService, ChatMessage } from '@/lib/api/chat.service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Appointment Detail Page
 * Route: /patient/appointments/:id
 */
export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentReadModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const getChatContext = (apt?: AppointmentReadModel | null) => {
    if (!apt) return {};
    const patientId =
      apt.patient?.patientId ??
      apt.patientId ??
      (apt as any).patient_id ??
      (apt as any).patient?.patient_id;

    return patientId ? { patientId } : {};
  };

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isChatOpen]);

  // Fallback polling when Supabase Realtime is not configured
  useEffect(() => {
    if (!conversationId) return;
    if (isSupabaseConfigured()) return;

    const interval = setInterval(() => {
      loadMessages(conversationId);
    }, 4000);

    return () => clearInterval(interval);
  }, [conversationId, appointment]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  async function loadAppointment() {
    try {
      setLoading(true);
      const data = await appointmentsService.getById(appointmentId);
      setAppointment(data);
      await initChat(appointmentId, data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
      router.push('/patient/appointments');
    } finally {
      setLoading(false);
    }
  }

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
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel(`chat-${convoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'appointments_schema',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convoId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Prevent duplicate: check if message already exists
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
          if (!isChatOpen && newMsg.sender_role !== 'patient') {
            setUnreadCount((prev) => prev + 1);
            toast.info('Bạn có tin nhắn mới từ bác sĩ');
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }

  async function handleSendMessage() {
    if (!conversationId || !chatInput.trim()) return;
    try {
      setChatSending(true);
      const chatContext = getChatContext(appointment);
      const response = await chatService.sendMessage(conversationId, chatInput.trim(), chatContext);
      setChatInput('');
      const sentMessage = response?.message;
      if (sentMessage) {
        setMessages((prev) => {
          // Prevent duplicate: check if message already exists
          if (prev.some(m => m.id === sentMessage.id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });
      }
      if (!isSupabaseConfigured()) {
        await loadMessages(conversationId, chatContext);
      }
      scrollToBottom();
    } catch (error) {
      console.error('Send message failed', error);
      toast.error('Không gửi được tin nhắn');
    } finally {
      setChatSending(false);
    }
  }

  async function handleCancel() {
    if (!appointment) return;
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setCancelling(true);
      const resp = await appointmentsService.cancel(appointment.id, {
        cancellationReason: 'Bệnh nhân hủy lịch hẹn',
      });
      const policy = (resp as any).cancellationPolicy;
      if (policy?.refundEligible) {
        const amt =
          policy.estimatedRefundAmount ??
          (policy.refundPercentage && appointment.consultationFee
            ? (appointment.consultationFee * policy.refundPercentage) / 100
            : undefined);
        toast.success(
          `Đã hủy lịch hẹn. Hoàn ${policy.refundPercentage || 0}%${amt ? ` (~${amt.toLocaleString('vi-VN')} đ)` : ''}`
        );
      } else if (policy?.penaltyApplied) {
        toast.success(
          `Đã hủy lịch hẹn. Phí hủy: ${policy.penaltyAmount ? `${policy.penaltyAmount.toLocaleString('vi-VN')} đ` : ''}`
        );
      } else {
        toast.success('Đã hủy lịch hẹn thành công');
      }
      router.push('/patient/appointments');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Không thể hủy lịch hẹn. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // Memoize rendered messages to prevent re-render on every keystroke
  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={`${msg.id}-${index}`}
        className={`flex ${msg.sender_role === 'patient' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender_role === 'patient'
            ? 'rounded-br-none bg-blue-600 text-white'
            : 'rounded-bl-none border border-gray-100 bg-white text-gray-800'
            }`}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          <p
            className={`mt-1 text-[10px] ${msg.sender_role === 'patient' ? 'text-blue-100' : 'text-gray-400'}`}
          >
            {format(parseISO(msg.sent_at), 'HH:mm')}
          </p>
        </div>
      </motion.div>
    ));
  }, [messages]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[600px] items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4"></div>
            <p className="text-lg font-medium text-gray-600">Đang tải thông tin chi tiết...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[600px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-20 w-20 text-red-500 opacity-80" />
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Không tìm thấy lịch hẹn</h2>
            <p className="mb-8 text-gray-600">
              Lịch hẹn này không tồn tại hoặc đã bị xóa khỏi hệ thống.
            </p>
            <Link href="/patient/appointments">
              <Button size="lg" className="rounded-full px-8">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Quay lại danh sách
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    SCHEDULED: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      icon: Clock,
      label: 'Đã đặt',
      description: 'Lịch hẹn đang chờ xác nhận từ phòng khám',
    },
    CONFIRMED: {
      bg: 'bg-[#ECFDF3]', // Requested light green
      text: 'text-[#027A48]',
      border: 'border-[#D1FADF]',
      icon: CheckCircle,
      label: 'Đã xác nhận',
      description: 'Lịch hẹn đã được xác nhận. Vui lòng đến đúng giờ.',
    },
    CANCELLED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: X,
      label: 'Đã hủy',
      description: 'Lịch hẹn đã bị hủy',
    },
    COMPLETED: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: CheckCircle,
      label: 'Đã hoàn thành',
      description: 'Buổi khám đã hoàn thành',
    },
    NO_SHOW: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: AlertCircle,
      label: 'Không đến',
      description: 'Bạn đã không đến khám',
    },
    PENDING_PAYMENT: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      icon: CreditCard,
      label: 'Chờ thanh toán',
      description: 'Vui lòng thanh toán để xác nhận lịch hẹn',
    },
  };

  const normalizeStatus = (status: string): keyof typeof statusConfig => {
    const s = status?.toUpperCase();
    if (s === 'SCHEDULED') return 'SCHEDULED';
    if (s === 'CONFIRMED') return 'CONFIRMED';
    if (s === 'CANCELLED') return 'CANCELLED';
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'NO_SHOW') return 'NO_SHOW';
    if (s === 'PENDING_PAYMENT' || s === 'PENDING') return 'PENDING_PAYMENT';
    return 'SCHEDULED';
  };

  const config = statusConfig[normalizeStatus(appointment.status)];
  const StatusIcon = config.icon;
  const appointmentDate = parseISO(appointment.appointmentDate);
  const formattedDate = format(appointmentDate, 'EEEE, dd MMMM yyyy', { locale: vi });
  const canModify =
    normalizeStatus(appointment.status) === 'SCHEDULED' ||
    normalizeStatus(appointment.status) === 'CONFIRMED';

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-[#F9FAFB] pb-20">
        <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Link href="/patient/appointments">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 -ml-2">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Chi tiết lịch hẹn
                </h1>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>Mã: #{appointment.appointmentId}</span>
                  <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                  <span>{format(parseISO(appointment.createdAt), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                In phiếu
              </Button>
              {canModify && (
                <>
                  <Link href={`/patient/appointments/${appointment.id}/reschedule`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600 shadow-sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Đổi lịch
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-red-100 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {cancelling ? 'Đang hủy...' : 'Hủy lịch'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${config.bg} ${config.border}`}
          >
            <StatusIcon className={`h-5 w-5 shrink-0 ${config.text}`} />
            <div>
              <h3 className={`font-semibold ${config.text}`}>{config.label}</h3>
              <p className={`text-sm ${config.text} opacity-90`}>{config.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Details (2/3 width) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Appointment Info Card */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Thông tin khám bệnh
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Ngày khám
                      </label>
                      <p className="text-base font-semibold text-gray-900 capitalize">
                        {formattedDate}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Giờ khám
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {appointment.appointmentTime?.substring(0, 5)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Thời lượng
                      </label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.durationMinutes} phút
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Loại khám
                      </label>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {appointment.type.toUpperCase() === 'CONSULTATION'
                          ? 'Khám mới'
                          : 'Tái khám'}
                      </span>
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">
                        Lý do khám
                      </label>
                      <p className="text-sm text-gray-700">{appointment.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                    <User className="h-4 w-4 text-blue-600" />
                    Bác sĩ phụ trách
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900">
                        BS.{' '}
                        {appointment.doctorName ||
                          (appointment as any).doctorFullName ||
                          'Đang cập nhật'}
                      </h4>
                      <p className="text-sm font-medium text-blue-600">
                        {appointment.doctorSpecialization ||
                          (appointment as any).doctorDepartment ||
                          'Chuyên khoa đang cập nhật'}
                      </p>
                      <div className="pt-2 space-y-1 text-sm text-gray-500">
                        {(appointment as any).doctorDepartment && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Khoa: {(appointment as any).doctorDepartment}</span>
                          </div>
                        )}
                        {(appointment as any).doctorEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span>{(appointment as any).doctorEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Thông tin bệnh nhân
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-medium">Họ và tên</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {appointment.patient?.fullName ||
                            (appointment as any).patientFullName ||
                            (appointment as any).patientName ||
                            'Đang cập nhật'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-medium">Số điện thoại</p>
                        <p className="text-sm font-semibold text-gray-900">{appointment.patientPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-900 break-all" title={appointment.patientEmail}>{appointment.patientEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Payment & Notes (1/3 width) */}
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Thanh toán
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Phí khám bệnh</span>
                    <span className="font-medium text-gray-900">
                      {(appointment.consultationFee || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Tổng cộng</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(appointment.consultationFee || 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div
                      className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium ${appointment.paymentStatus?.toUpperCase() === 'PAID'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-yellow-50 text-yellow-700'
                        }`}
                    >
                      {appointment.paymentStatus?.toUpperCase() === 'PAID' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Đã thanh toán
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          Chưa thanh toán
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Info className="h-4 w-4" />
                  Lưu ý quan trọng
                </h3>
                <ul className="space-y-2 text-sm text-amber-800/80">
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>Vui lòng đến trước 15 phút để làm thủ tục</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>Mang theo CMND/CCCD và thẻ BHYT</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">•</span>
                    <span>Mang theo hồ sơ bệnh án cũ (nếu có)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Bubble */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed right-6 bottom-24 z-50 w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Chat với bác sĩ</h3>
                    <p className="text-xs text-blue-100">Trực tuyến</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsChatOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-[400px] space-y-4 overflow-y-auto bg-gray-50 p-4">
                {chatLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-gray-500">
                    <MessageSquare className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      Chưa có tin nhắn nào.
                      <br />
                      Hãy bắt đầu cuộc trò chuyện.
                    </p>
                  </div>
                ) : (
                  renderedMessages
                )}
                {/* Invisible element to scroll to */}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-gray-100 bg-white p-3">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleSendMessage}
                    disabled={chatSending || !conversationId}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:outline-none"
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageSquare className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>
    </DashboardLayout>
  );
}