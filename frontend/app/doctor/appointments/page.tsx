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
  RefreshCw,
  ChevronRight,
  TrendingUp,
  Users,
  Activity,
  Loader2,
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
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
    const statusConfig = {
      CHECKED_IN: { label: 'Đã đến', className: 'bg-green-100 text-green-700' },
      IN_PROGRESS: { label: 'Đang khám', className: 'bg-blue-100 text-blue-700' },
      COMPLETED: { label: 'Đã xong', className: 'bg-gray-100 text-gray-700' },
      CONFIRMED: { label: 'Chờ đến', className: 'bg-yellow-100 text-yellow-700' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>;
  };

  const getPaymentBadge = (payment?: string) => {
    const value = (payment || '').toUpperCase();
    const paymentConfig = {
      PAID: { label: 'Đã thanh toán', className: 'bg-emerald-100 text-emerald-700' },
      PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
      REFUNDED: { label: 'Đã hoàn', className: 'bg-blue-100 text-blue-700' },
    };
    const config = paymentConfig[value as keyof typeof paymentConfig] || {
      label: payment || 'N/A',
      className: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={`${config.className} hover:${config.className}`}>{config.label}</Badge>;
  };

  const handleStartExam = async (id: string) => {
    try {
      await appointmentsService.startAppointment(id);
      router.push(`/doctor/appointments/${id}`);
    } catch (error) {
      toast.error('Không thể bắt đầu ca khám');
    }
  };

  const stats = [
    {
      title: 'Tổng bệnh nhân',
      value: appointments.length,
      icon: ClipboardList,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
    },
    {
      title: 'Đang chờ khám',
      value: appointments.filter((a) => ['CHECKED_IN', 'CONFIRMED'].includes(a.status)).length,
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    {
      title: 'Đã hoàn thành',
      value: appointments.filter((a) => a.status === 'COMPLETED').length,
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
    },
  ];

  const filteredAppointments = appointments.filter((apt) =>
    apt.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white/10 blur-3xl"
                style={{
                  width: `${200 + i * 100}px`,
                  height: `${200 + i * 100}px`,
                  left: `${10 + i * 30}%`,
                  top: `${-20 + i * 20}%`,
                }}
                animate={{
                  x: [0, 20, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl"
              >
                <ClipboardList className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <h1 className="mb-2 text-4xl font-bold">Danh sách khám bệnh</h1>
                <p className="text-blue-100">Quản lý lịch khám bệnh nhân</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/20 backdrop-blur-xl px-6 py-3 shadow-lg">
              <p className="text-sm font-medium text-blue-100">Hôm nay</p>
              <p className="text-lg font-bold">
                {format(new Date(), 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-lg">
                <div className={`h-2 bg-gradient-to-r ${stat.gradient}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                    className="text-3xl font-bold text-gray-900"
                  >
                    {stat.value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-xl p-6 shadow-lg"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Tìm tên bệnh nhân..."
                className="rounded-xl border-2 pl-12 focus:ring-4 focus:ring-blue-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl border-2">
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAY">Hôm nay</SelectItem>
                <SelectItem value="ALL">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={fetchAppointments}
            className="rounded-xl border-2"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </motion.div>

        {/* Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50">
                <TableHead className="font-bold">STT</TableHead>
                <TableHead className="font-bold">Giờ hẹn</TableHead>
                <TableHead className="font-bold">Bệnh nhân</TableHead>
                <TableHead className="font-bold">Lý do khám</TableHead>
                <TableHead className="font-bold">Trạng thái</TableHead>
                <TableHead className="font-bold">Thanh toán</TableHead>
                <TableHead className="text-right font-bold">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="text-sm text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ClipboardList className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-600">Không có lịch khám nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredAppointments.map((apt, index) => (
                    <motion.tr
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${apt.status === 'IN_PROGRESS' ? 'bg-blue-50/30' : ''
                        }`}
                      onClick={() => router.push(`/doctor/appointments/${apt.id}`)}
                    >
                      <TableCell className="font-semibold text-gray-900">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="font-semibold">{apt.appointmentTime.substring(0, 5)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{apt.patientName}</span>
                          <span className="text-xs text-gray-500">{apt.patientId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="truncate text-gray-700" title={apt.reason}>
                          {apt.reason}
                        </p>
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell>{getPaymentBadge(apt.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {apt.status === 'CHECKED_IN' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartExam(apt.id);
                              }}
                              className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Bắt đầu
                            </Button>
                          )}
                          {apt.status === 'IN_PROGRESS' && (
                            <Button size="sm" variant="secondary" className="rounded-lg">
                              <Activity className="mr-2 h-4 w-4" />
                              Tiếp tục
                            </Button>
                          )}
                          {apt.status === 'COMPLETED' && (
                            <Button size="sm" variant="ghost" className="rounded-lg">
                              Xem chi tiết
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
