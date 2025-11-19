'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointmentsService } from '@/lib/api/appointments.service';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  reason: string;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // In a real app, pass filters to the API
      const res = await appointmentsService.getAppointments({
        // status: statusFilter !== 'ALL' ? statusFilter : undefined,
        // search: searchTerm
      });

      if (res.success && res.data) {
        // Map API response to UI model
        const mappedAppointments = res.data.map((apt: any) => ({
          id: apt.id,
          appointmentId: apt.appointmentId,
          patientName: apt.patientName || 'N/A',
          patientId: apt.patientId,
          doctorName: apt.doctorName || 'N/A',
          departmentName: apt.departmentId || 'General', // Map department code if needed
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          status: apt.status,
          type: apt.type,
          reason: apt.reason
        }));
        setAppointments(mappedAppointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter locally for now if API doesn't support search/filter yet
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Đã đặt lịch</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã xác nhận</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Hoàn thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã hủy</Badge>;
      case 'NO_SHOW':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Vắng mặt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      let res;
      if (newStatus === 'CONFIRMED') {
        res = await appointmentsService.confirmAppointment(id);
      } else if (newStatus === 'CANCELLED') {
        res = await appointmentsService.cancelAppointment(id, 'Admin cancelled');
      }

      if (res && res.success) {
        toast.success('Cập nhật trạng thái thành công');
        fetchAppointments(); // Refresh list
      }
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý lịch hẹn</h1>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả lịch hẹn khám bệnh trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/appointments/calendar')}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Xem lịch
          </Button>
          <Button onClick={() => router.push('/admin/appointments/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch hẹn
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn hôm nay</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.appointmentDate === format(new Date(), 'yyyy-MM-dd')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp tới</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {appointments.filter(a => a.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hủy</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {appointments.filter(a => a.status === 'CANCELLED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bệnh nhân, bác sĩ..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="SCHEDULED">Đã đặt lịch</SelectItem>
              <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã lịch hẹn</TableHead>
              <TableHead>Bệnh nhân</TableHead>
              <TableHead>Bác sĩ</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy lịch hẹn nào
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.appointmentId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{apt.patientName}</span>
                      <span className="text-xs text-muted-foreground">{apt.patientId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{apt.doctorName}</span>
                      <span className="text-xs text-muted-foreground">{apt.departmentName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {format(new Date(apt.appointmentDate), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {apt.appointmentTime.substring(0, 5)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/admin/appointments/${apt.id}`)}>
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {apt.status === 'SCHEDULED' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                            Xác nhận
                          </DropdownMenuItem>
                        )}
                        {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && (
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'CANCELLED')}>
                            <XCircle className="mr-2 h-4 w-4 text-red-600" />
                            Hủy lịch
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
