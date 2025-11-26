'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { appointmentsService } from '@/lib/api/appointments.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { toast } from 'sonner';

type Props = {
  params: { id: string };
};

const statusBadge = (status?: string) => {
  const value = (status || '').toUpperCase();
  switch (value) {
    case 'ARRIVED':
      return <Badge className="bg-green-100 text-green-700">Đã check-in</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-100 text-blue-700">Đang khám</Badge>;
    case 'COMPLETED':
      return <Badge variant="outline">Đã xong</Badge>;
    case 'CONFIRMED':
    case 'SCHEDULED':
      return (
        <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
          Chờ khám
        </Badge>
      );
    default:
      return <Badge variant="outline">{value || 'N/A'}</Badge>;
  }
};

export default function DoctorAppointmentDetailPage({ params }: Props) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentReadModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await appointmentsService.getById(params.id);
      setAppointment(data);
    } catch (error) {
      toast.error('Không tải được thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const doAction = async (action: 'checkin' | 'start' | 'complete') => {
    try {
      setActionLoading(true);
      if (action === 'checkin') await appointmentsService.checkInAppointment(params.id);
      if (action === 'start') await appointmentsService.startAppointment(params.id);
      if (action === 'complete') await appointmentsService.completeAppointment(params.id);
      await load();
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const status = (appointment?.status || '').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết lịch hẹn</h1>
          <p className="text-muted-foreground">Mã: {appointment?.appointment_id || params.id}</p>
        </div>
        <div className="flex gap-2">
          {status === 'CONFIRMED' || status === 'SCHEDULED' ? (
            <Button disabled={actionLoading} onClick={() => doAction('checkin')}>
              Check-in
            </Button>
          ) : null}
          {status === 'ARRIVED' ? (
            <Button disabled={actionLoading} onClick={() => doAction('start')}>
              Bắt đầu khám
            </Button>
          ) : null}
          {status === 'IN_PROGRESS' ? (
            <Button disabled={actionLoading} onClick={() => doAction('complete')}>
              Hoàn thành khám
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">Đang tải...</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{appointment?.patient_full_name}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {appointment?.patient_phone} • {appointment?.patient_email}
              </p>
            </div>
            {statusBadge(appointment?.status)}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Bác sĩ</p>
                <p className="font-medium">{appointment?.doctor_full_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Khoa</p>
                <p className="font-medium">{appointment?.doctor_department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày khám</p>
                <p className="font-medium">{appointment?.appointment_date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Giờ khám</p>
                <p className="font-medium">{appointment?.appointment_time}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Trạng thái thanh toán</p>
                <p className="font-medium">{appointment?.payment_status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ưu tiên</p>
                <p className="font-medium">{appointment?.priority || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Lý do khám</p>
              <p className="font-medium">{appointment?.reason || 'Không có'}</p>
            </div>

            {appointment?.notes ? (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Ghi chú</p>
                <p className="font-medium">{appointment.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
