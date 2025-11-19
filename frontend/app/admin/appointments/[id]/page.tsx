'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

export default function AppointmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

    const fetchAppointment = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await appointmentsService.getAppointment(id);
            if (res.success && res.data) {
                // Map API response to UI model
                const data = res.data;
                setAppointment({
                    id: data.id,
                    appointmentId: data.appointmentId,
                    status: data.status,
                    type: data.type,
                    priority: data.priority,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    durationMinutes: data.durationMinutes,
                    reason: data.reason,
                    notes: data.notes,
                    cancellationReason: data.cancellationReason,
                    patient: {
                        id: data.patientId,
                        patientId: data.patientId, // Assuming API returns this or we map it
                        fullName: data.patientName,
                        phoneNumber: data.patientPhone || 'N/A',
                        email: data.patientEmail || 'N/A',
                        dateOfBirth: data.patientDob || '1990-01-01',
                        gender: data.patientGender || 'Unknown'
                    },
                    doctor: {
                        id: data.doctorId,
                        fullName: data.doctorName,
                        specialization: 'General', // API might need to return this
                        departmentId: data.departmentId
                    },
                    timeline: {
                        createdAt: data.createdAt,
                        confirmedAt: data.confirmedAt,
                        checkedInAt: data.checkedInAt,
                        startedAt: data.startedAt,
                        completedAt: data.completedAt,
                        cancelledAt: data.cancelledAt
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch appointment:', error);
            toast.error('Không thể tải thông tin lịch hẹn');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointment();
    }, [id]);

    const handleStatusChange = async (action: 'confirm' | 'cancel' | 'check-in' | 'complete') => {
        try {
            let res;
            switch (action) {
                case 'confirm':
                    res = await appointmentsService.confirmAppointment(id);
                    break;
                case 'cancel':
                    if (!cancelReason.trim()) {
                        toast.error('Vui lòng nhập lý do hủy');
                        return;
                    }
                    res = await appointmentsService.cancelAppointment(id, cancelReason);
                    setIsCancelDialogOpen(false);
                    break;
                case 'check-in':
                    res = await appointmentsService.checkInAppointment(id);
                    break;
                // Complete is usually done by doctor, but admin might need it
                case 'complete':
                    // res = await appointmentsService.completeAppointment(id);
                    break;
            }

            if (res && res.success) {
                toast.success('Cập nhật trạng thái thành công');
                fetchAppointment(); // Refresh data
            }
        } catch (error: any) {
            toast.error(error.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1">Đã đặt lịch</Badge>;
            case 'CONFIRMED':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1">Đã xác nhận</Badge>;
            case 'CHECKED_IN':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-sm px-3 py-1">Đã Check-in</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-sm px-3 py-1">Đang khám</Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 text-sm px-3 py-1">Hoàn thành</Badge>;
            case 'CANCELLED':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center">Đang tải thông tin...</div>;
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <p className="text-muted-foreground">Không tìm thấy lịch hẹn</p>
                <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">Lịch hẹn #{appointment.appointmentId}</h1>
                            {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Tạo ngày {format(new Date(appointment.timeline?.createdAt || new Date()), 'dd/MM/yyyy HH:mm')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {appointment.status === 'SCHEDULED' && (
                        <Button onClick={() => handleStatusChange('confirm')} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Xác nhận lịch
                        </Button>
                    )}

                    {appointment.status === 'CONFIRMED' && (
                        <Button onClick={() => handleStatusChange('check-in')} className="bg-purple-600 hover:bg-purple-700">
                            <User className="mr-2 h-4 w-4" />
                            Check-in bệnh nhân
                        </Button>
                    )}

                    {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && (
                        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Hủy lịch
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Hủy lịch hẹn</DialogTitle>
                                    <DialogDescription>
                                        Hành động này không thể hoàn tác. Vui lòng nhập lý do hủy lịch.
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    placeholder="Nhập lý do hủy..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>Đóng</Button>
                                    <Button variant="destructive" onClick={() => handleStatusChange('cancel')}>Xác nhận hủy</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Printer className="mr-2 h-4 w-4" /> In phiếu khám
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCard className="mr-2 h-4 w-4" /> Tạo hóa đơn
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Appointment Details Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Thông tin lịch khám
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Ngày khám</div>
                                    <div className="text-lg font-semibold">
                                        {format(new Date(appointment.appointmentDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Giờ khám</div>
                                    <div className="text-lg font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {appointment.appointmentTime.substring(0, 5)}
                                        <span className="text-sm font-normal text-muted-foreground">({appointment.durationMinutes} phút)</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Loại khám</div>
                                    <div className="font-medium">{appointment.type}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">Lý do khám</div>
                                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                                        {appointment.reason}
                                    </div>
                                </div>
                                {appointment.notes && (
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground mb-1">Ghi chú</div>
                                        <div className="text-sm">{appointment.notes}</div>
                                    </div>
                                )}
                                {appointment.status === 'CANCELLED' && appointment.cancellationReason && (
                                    <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                        <div className="text-sm font-medium text-red-800 mb-1">Lý do hủy</div>
                                        <div className="text-sm text-red-600">{appointment.cancellationReason}</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-primary" />
                                Bác sĩ phụ trách
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {appointment.doctor.fullName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-semibold text-lg">{appointment.doctor.fullName}</div>
                                    <div className="text-muted-foreground">{appointment.doctor.specialization}</div>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        Khoa: {appointment.doctor.departmentId}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Patient & Timeline */}
                <div className="space-y-6">
                    {/* Patient Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Thông tin bệnh nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="font-semibold text-lg">{appointment.patient.fullName}</div>
                                <div className="text-sm text-muted-foreground">Mã BN: {appointment.patient.patientId}</div>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {appointment.patient.phoneNumber}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {appointment.patient.email}
                                </div>
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(appointment.patient.dateOfBirth), 'dd/MM/yyyy')}
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {appointment.patient.address || 'Chưa cập nhật địa chỉ'}
                                </div>
                            </div>

                            <Button variant="outline" className="w-full mt-2" onClick={() => router.push(`/admin/patients/${appointment.patient.id}`)}>
                                Xem hồ sơ bệnh án
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Timeline Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Trạng thái</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-2 space-y-6 pb-2">
                                <div className="ml-4 relative">
                                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                                    <div className="text-sm font-medium">Đã đặt lịch</div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(appointment.timeline?.createdAt || ''), 'HH:mm dd/MM/yyyy')}
                                    </div>
                                </div>

                                {appointment.timeline?.confirmedAt && (
                                    <div className="ml-4 relative">
                                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-green-500" />
                                        <div className="text-sm font-medium">Đã xác nhận</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(appointment.timeline.confirmedAt), 'HH:mm dd/MM/yyyy')}
                                        </div>
                                    </div>
                                )}

                                {appointment.timeline?.checkedInAt && (
                                    <div className="ml-4 relative">
                                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-purple-500" />
                                        <div className="text-sm font-medium">Đã Check-in</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(appointment.timeline.checkedInAt), 'HH:mm dd/MM/yyyy')}
                                        </div>
                                    </div>
                                )}

                                {appointment.timeline?.cancelledAt && (
                                    <div className="ml-4 relative">
                                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                                        <div className="text-sm font-medium text-red-600">Đã hủy</div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(appointment.timeline.cancelledAt), 'HH:mm dd/MM/yyyy')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
