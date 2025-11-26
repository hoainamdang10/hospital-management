'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointmentsService } from '@/lib/api/appointments.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODAY');

  const fetchAppointments = async () => {
    const doctorId = user?.userId || user?.id;
    if (!doctorId) return;

    setIsLoading(true);
    try {
      // Get today's date for default filter
      const today = format(new Date(), 'yyyy-MM-dd');

      const res = await appointmentsService.getDoctorAppointments(doctorId, {
        startDate: statusFilter === 'TODAY' ? today : undefined,
        endDate: statusFilter === 'TODAY' ? today : undefined,
      });

      if (res.appointments) {
        const mapped = res.appointments.map((apt: any) => ({
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
        }));

        // Sort by time
        mapped.sort((a: any, b: any) => a.appointmentTime.localeCompare(b.appointmentTime));

        setAppointments(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải danh sách khám');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đã đến</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Đang khám</Badge>;
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Đã xong
          </Badge>
        );
      case 'CONFIRMED':
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
            Chờ đến
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (payment?: string) => {
    const value = (payment || '').toUpperCase();
    switch (value) {
      case 'PAID':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Đã thanh toán
          </Badge>
        );
      case 'PENDING_PAYMENT':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Chờ thanh toán</Badge>
        );
      case 'REFUNDED':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Đã hoàn</Badge>;
      default:
        return <Badge variant="outline">{payment || 'N/A'}</Badge>;
    }
  };

  const handleStartExam = async (id: string) => {
    try {
      await appointmentsService.startAppointment(id);
      router.push(`/doctor/appointments/${id}`);
    } catch (error) {
      toast.error('Không thể bắt đầu ca khám');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách khám bệnh</h1>
          <p className="text-muted-foreground">Quản lý danh sách bệnh nhân cần khám hôm nay</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <ClipboardList className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ khám</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {appointments.filter((a) => a.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder="Tìm tên bệnh nhân..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">Hôm nay</SelectItem>
              <SelectItem value="ALL">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={fetchAppointments}>
          Làm mới
        </Button>
      </div>

      {/* Appointments Table */}
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Giờ hẹn</TableHead>
              <TableHead>Bệnh nhân</TableHead>
              <TableHead>Lý do khám</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  Không có lịch khám nào
                </TableCell>
              </TableRow>
            ) : (
              appointments
                .filter((apt) => apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((apt, index) => (
                  <TableRow
                    key={apt.id}
                    className={apt.status === 'IN_PROGRESS' ? 'bg-blue-50/50' : ''}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4" />
                        <span className="font-semibold">{apt.appointmentTime.substring(0, 5)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{apt.patientName}</span>
                        <span className="text-muted-foreground text-xs">{apt.patientId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={apt.reason}>
                      {apt.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell>{getPaymentBadge(apt.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      {apt.status === 'CHECKED_IN' && (
                        <Button size="sm" onClick={() => handleStartExam(apt.id)}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Bắt đầu khám
                        </Button>
                      )}
                      {apt.status === 'IN_PROGRESS' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                        >
                          Tiếp tục khám
                        </Button>
                      )}
                      {apt.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                        >
                          Xem lại
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
