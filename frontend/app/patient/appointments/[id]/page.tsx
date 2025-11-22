'use client';

import { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  async function loadAppointment() {
    try {
      setLoading(true);
      const data = await appointmentsService.getById(appointmentId);
      setAppointment(data);
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
      router.push('/patient/appointments');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!appointment) return;
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

    try {
      setCancelling(true);
      await appointmentsService.cancel(appointment.id, {
        cancellationReason: 'Bệnh nhân hủy lịch hẹn',
      });
      toast.success('Đã hủy lịch hẹn thành công');
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy lịch hẹn</h2>
          <p className="text-gray-600 mb-6">Lịch hẹn này không tồn tại hoặc đã bị xóa</p>
          <Link href="/patient/appointments">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    SCHEDULED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'Đã đặt' },
    CONFIRMED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Đã xác nhận' },
    CANCELLED: { color: 'bg-red-100 text-red-800 border-red-200', icon: X, label: 'Đã hủy' },
    COMPLETED: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle, label: 'Đã hoàn thành' },
    NO_SHOW: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle, label: 'Không đến' },
    PENDING_PAYMENT: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Chờ thanh toán' },
  };

  const normalizeStatus = (status: string): keyof typeof statusConfig => {
    const s = status.toUpperCase();
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
  const canModify = normalizeStatus(appointment.status) === 'SCHEDULED' || normalizeStatus(appointment.status) === 'CONFIRMED';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết lịch hẹn</h1>
              <p className="text-gray-600 mt-1">Mã lịch hẹn: #{appointment.appointmentId}</p>
            </div>
          </div>

          {/* Print/Download buttons */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              In
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl border-2 p-6 ${config.color}`}>
          <div className="flex items-center gap-3">
            <StatusIcon className="h-8 w-8" />
            <div>
              <h2 className="text-xl font-bold">{config.label}</h2>
              <p className="text-sm opacity-80">
                {normalizeStatus(appointment.status) === 'SCHEDULED' && 'Lịch hẹn đang chờ xác nhận từ phòng khám'}
                {normalizeStatus(appointment.status) === 'CONFIRMED' && 'Lịch hẹn đã được xác nhận. Vui lòng đến đúng giờ.'}
                {normalizeStatus(appointment.status) === 'CANCELLED' && 'Lịch hẹn đã bị hủy'}
                {normalizeStatus(appointment.status) === 'COMPLETED' && 'Buổi khám đã hoàn thành'}
                {normalizeStatus(appointment.status) === 'NO_SHOW' && 'Bạn đã không đến khám'}
                {normalizeStatus(appointment.status) === 'PENDING_PAYMENT' && 'Vui lòng thanh toán để xác nhận lịch hẹn'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Thông tin lịch hẹn
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày khám</label>
                  <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                    {formattedDate}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ khám</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {appointment.appointmentTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian khám</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {appointment.durationMinutes} phút
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại khám</label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {appointment.type.toUpperCase() === 'CONSULTATION' ? 'Khám mới' : 'Tái khám'}
                  </p>
                </div>
              </div>

              {appointment.reason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Lý do khám</label>
                  <p className="text-base text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                    {appointment.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Doctor Info */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin bác sĩ
              </h3>

              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">
                    BS. {appointment.doctorName}
                  </h4>
                  <p className="text-gray-600 mt-1">{appointment.doctorSpecialization}</p>
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Thông tin bệnh nhân
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Họ và tên</p>
                    <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="font-semibold text-gray-900">{appointment.patientPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">{appointment.patientEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Info */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phí khám</span>
                  <span className="font-semibold text-gray-900">
                    {appointment.consultationFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary">
                      {appointment.consultationFee.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${appointment.paymentStatus?.toUpperCase() === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {appointment.paymentStatus?.toUpperCase() === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Lưu ý quan trọng
              </h3>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Vui lòng đến trước 15 phút để làm thủ tục</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Mang theo CMND/CCCD và thẻ bảo hiểm y tế</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Mang theo sổ khám bệnh và kết quả xét nghiệm cũ (nếu có)</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Liên hệ hotline nếu cần hủy/đổi lịch hẹn</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            {canModify && (
              <div className="space-y-3 print:hidden">
                <Link href={`/patient/appointments/${appointment.id}/reschedule`} className="block">
                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Đổi lịch hẹn
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  <X className="mr-2 h-4 w-4" />
                  {cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
