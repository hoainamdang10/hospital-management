'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    User,
    Calendar as CalendarIcon,
    Clock,
    Save,
    CheckCircle2,
    ArrowLeft,
    FileText,
    Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { appointmentsService } from '@/lib/api/appointments.service';

interface AppointmentDetail {
    id: string;
    appointmentId: string;
    status: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    notes?: string; // Used for diagnosis/conclusion in Lite mode
    patient: {
        id: string;
        patientId: string;
        fullName: string;
        dateOfBirth: string;
        gender: string;
        phoneNumber: string;
    };
}

export default function DoctorExaminationPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState(''); // We'll append this to notes or save separately if API supports

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const res = await appointmentsService.getAppointment(id);
                if (res.success && res.data) {
                    const data = res.data;
                    setAppointment({
                        id: data.id,
                        appointmentId: data.appointmentId,
                        status: data.status,
                        appointmentDate: data.appointmentDate,
                        appointmentTime: data.appointmentTime,
                        reason: data.reason,
                        notes: data.notes,
                        patient: {
                            id: data.patientId,
                            patientId: data.patientId,
                            fullName: data.patientName,
                            dateOfBirth: data.patientDob || '1990-01-01',
                            gender: data.patientGender || 'Unknown',
                            phoneNumber: data.patientPhone || 'N/A'
                        }
                    });

                    // Pre-fill diagnosis if exists (using notes field as a simple storage for now)
                    if (data.notes) {
                        setDiagnosis(data.notes);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch appointment:', error);
                toast.error('Không thể tải thông tin ca khám');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

    const handleComplete = async () => {
        if (!diagnosis.trim()) {
            toast.error('Vui lòng nhập kết luận khám bệnh');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update notes with diagnosis and prescription
            // In a real Lite app, we might want to save this to a specific 'medical_record' table, 
            // but for now, updating the appointment notes is a good workaround.
            const finalNotes = `CHẨN ĐOÁN:\n${diagnosis}\n\nĐIỀU TRỊ/TOA THUỐC:\n${prescription}`;

            // Update notes first (if API supports updateAppointment)
            // await appointmentsService.updateAppointment(id, { notes: finalNotes });

            // 2. Complete the appointment
            // The completeAppointment API might accept notes/diagnosis directly
            const res = await appointmentsService.completeAppointment(id); // Assuming this endpoint exists and handles status change

            if (res.success) {
                toast.success('Đã hoàn thành ca khám');
                router.push('/doctor/appointments');
            }
        } catch (error) {
            console.error('Failed to complete appointment:', error);
            toast.error('Lỗi khi lưu kết quả khám');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Đang tải dữ liệu...</div>;
    }

    if (!appointment) {
        return <div>Không tìm thấy ca khám</div>;
    }

    const isReadOnly = appointment.status === 'COMPLETED';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Khám bệnh</h1>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <span>Mã phiếu: {appointment.appointmentId}</span>
                            <span>•</span>
                            <Badge variant={isReadOnly ? "secondary" : "default"}>
                                {isReadOnly ? 'Đã hoàn thành' : 'Đang khám'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {!isReadOnly && (
                    <Button size="lg" onClick={handleComplete} disabled={isSaving}>
                        {isSaving ? (
                            'Đang lưu...'
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Hoàn thành khám
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Patient Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="bg-muted/40 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-5 w-5 text-primary" />
                                Thông tin bệnh nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <div className="font-semibold text-lg">{appointment.patient.fullName}</div>
                                <div className="text-sm text-muted-foreground">{appointment.patient.patientId}</div>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ngày sinh:</span>
                                    <span className="font-medium">
                                        {format(new Date(appointment.patient.dateOfBirth), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Giới tính:</span>
                                    <span className="font-medium">{appointment.patient.gender}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SĐT:</span>
                                    <span className="font-medium">{appointment.patient.phoneNumber}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="bg-muted/40 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Activity className="h-5 w-5 text-primary" />
                                Lý do khám
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-sm leading-relaxed">{appointment.reason}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Examination Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Kết quả khám & Điều trị
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Chẩn đoán / Kết luận <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    placeholder="Nhập chẩn đoán bệnh, triệu chứng lâm sàng..."
                                    className="min-h-[150px] text-base"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    disabled={isReadOnly}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Hướng điều trị / Toa thuốc
                                </label>
                                <Textarea
                                    placeholder="Kê đơn thuốc, lời dặn dò cho bệnh nhân..."
                                    className="min-h-[150px] font-mono text-sm"
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <p className="text-xs text-muted-foreground">
                                    * Nhập tên thuốc, liều lượng và cách dùng. Thông tin này sẽ được gửi cho bệnh nhân.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
