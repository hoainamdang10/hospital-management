'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2, User, Stethoscope, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { appointmentsService } from '@/lib/api/appointments.service';
import { doctorsService } from '@/lib/api/doctors.service';
import { patientsService } from '@/lib/api/patients.service';
import { departmentsService } from '@/lib/api/departments.service';

interface Doctor {
    id: string;
    userId: string;
    fullName: string;
    specialization: string;
    departmentId: string;
}

interface Patient {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    patientId: string;
}

interface Department {
    id: string;
    code: string;
    name: string;
}

export default function AddAppointmentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Data states
    const [departments, setDepartments] = useState<Department[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);

    // Search states
    const [patientSearch, setPatientSearch] = useState('');
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Form states
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState('');
    const [type, setType] = useState('CONSULTATION');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch initial data
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await departmentsService.getDepartments();
                if (res) {
                    setDepartments(res.map((d: any) => ({
                        id: d.id,
                        code: d.departmentCode,
                        name: d.departmentNameVi || d.departmentNameEn
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch departments:', error);
                toast.error('Không thể tải danh sách khoa');
            }
        };
        fetchDepartments();
    }, []);

    // Fetch doctors when department changes
    useEffect(() => {
        if (!selectedDepartment) {
            setDoctors([]);
            return;
        }

        const fetchDoctors = async () => {
            try {
                // In a real app, we would filter by department API-side
                // For now, fetching all and filtering client-side or using a specific endpoint if available
                const res = await doctorsService.getDoctors({ department: selectedDepartment });
                if (res && res.data) {
                    setDoctors(res.data.map((d: any) => ({
                        id: d.id,
                        userId: d.userId,
                        fullName: d.fullName,
                        specialization: d.specialization,
                        departmentId: d.departmentId
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            }
        };
        fetchDoctors();
    }, [selectedDepartment]);

    // Search patients
    const handleSearchPatient = async () => {
        if (!patientSearch.trim()) return;

        setIsSearchingPatient(true);
        try {
            const res = await patientsService.getPatients({ search: patientSearch });
            if (res && res.data) {
                setPatients(res.data.map((p: any) => ({
                    id: p.id,
                    patientId: p.patientId,
                    fullName: p.fullName,
                    phone: p.phoneNumber,
                    email: p.email,
                    dateOfBirth: p.dateOfBirth,
                    gender: p.gender
                })));
            }
        } catch (error) {
            console.error('Failed to search patients:', error);
            toast.error('Lỗi tìm kiếm bệnh nhân');
        } finally {
            setIsSearchingPatient(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient || !selectedDoctor || !date || !time || !selectedDepartment) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setIsLoading(true);
        try {
            // Format date and time
            const formattedDate = format(date, 'yyyy-MM-dd');
            const startTime = `${formattedDate}T${time}:00`;

            // Calculate end time (default 30 mins)
            const [hours, minutes] = time.split(':').map(Number);
            const endDateObj = new Date(date);
            endDateObj.setHours(hours, minutes + 30);
            const endTime = format(endDateObj, "yyyy-MM-dd'T'HH:mm:ss");

            const payload = {
                patient: {
                    patientId: selectedPatient.patientId, // Use the business ID (PAT-...)
                    fullName: selectedPatient.fullName,
                    phoneNumber: selectedPatient.phone,
                    email: selectedPatient.email,
                    dateOfBirth: selectedPatient.dateOfBirth,
                    gender: selectedPatient.gender
                },
                provider: {
                    providerId: selectedDoctor, // This should be the doctor's ID
                    providerName: doctors.find(d => d.id === selectedDoctor)?.fullName || ''
                },
                departmentCode: selectedDepartment,
                appointment: {
                    startTime: startTime,
                    endTime: endTime,
                    appointmentType: type,
                    reason: reason,
                    priority: 'NORMAL',
                    notes: notes
                }
            };

            const res = await appointmentsService.createAppointment(payload);

            if (res.success) {
                toast.success('Tạo lịch hẹn thành công');
                router.push('/admin/appointments');
            } else {
                throw new Error(res.message || 'Có lỗi xảy ra');
            }
        } catch (error: any) {
            console.error('Create appointment error:', error);
            toast.error(error.message || 'Không thể tạo lịch hẹn');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tạo lịch hẹn mới</h1>
                    <p className="text-muted-foreground">
                        Đặt lịch khám cho bệnh nhân với bác sĩ chuyên khoa
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    Hủy bỏ
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column: Patient Selection */}
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <User className="h-5 w-5 text-primary" />
                            Thông tin bệnh nhân
                        </h2>

                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tìm theo tên, SĐT hoặc mã bệnh nhân..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                                />
                                <Button
                                    variant="secondary"
                                    onClick={handleSearchPatient}
                                    disabled={isSearchingPatient}
                                >
                                    {isSearchingPatient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {patients.length > 0 && !selectedPatient && (
                                <div className="max-h-60 overflow-y-auto rounded-md border">
                                    {patients.map((patient) => (
                                        <div
                                            key={patient.id}
                                            className="cursor-pointer p-3 hover:bg-accent"
                                            onClick={() => {
                                                setSelectedPatient(patient);
                                                setPatients([]);
                                                setPatientSearch('');
                                            }}
                                        >
                                            <div className="font-medium">{patient.fullName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {patient.patientId} - {patient.phone} - {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedPatient && (
                                <div className="rounded-md border bg-accent/50 p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-lg">{selectedPatient.fullName}</div>
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground mt-2">
                                                <div>Mã BN: <span className="text-foreground">{selectedPatient.patientId}</span></div>
                                                <div>SĐT: <span className="text-foreground">{selectedPatient.phone}</span></div>
                                                <div>Email: <span className="text-foreground">{selectedPatient.email}</span></div>
                                                <div>Ngày sinh: <span className="text-foreground">{format(new Date(selectedPatient.dateOfBirth), 'dd/MM/yyyy')}</span></div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setSelectedPatient(null)}
                                        >
                                            Thay đổi
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!selectedPatient && patients.length === 0 && patientSearch && !isSearchingPatient && (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    Không tìm thấy bệnh nhân.
                                    <Button variant="link" className="h-auto p-0 ml-1" onClick={() => router.push('/admin/patients/add')}>
                                        Thêm mới?
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Clock className="h-5 w-5 text-primary" />
                            Thời gian & Lý do
                        </h2>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Ngày khám</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>Giờ khám</Label>
                                    <Select value={time} onValueChange={setTime}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn giờ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 18 }).map((_, i) => {
                                                const hour = Math.floor(i / 2) + 8; // Start from 8:00
                                                const minute = i % 2 === 0 ? '00' : '30';
                                                const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                                                if (hour > 17) return null; // End at 17:30
                                                return (
                                                    <SelectItem key={timeStr} value={timeStr}>
                                                        {timeStr}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Loại lịch hẹn</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CONSULTATION">Khám bệnh</SelectItem>
                                        <SelectItem value="FOLLOW_UP">Tái khám</SelectItem>
                                        <SelectItem value="EMERGENCY">Cấp cứu</SelectItem>
                                        <SelectItem value="CHECKUP">Khám sức khỏe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Lý do khám</Label>
                                <Textarea
                                    placeholder="Mô tả triệu chứng hoặc lý do khám..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Ghi chú (Tùy chọn)</Label>
                                <Textarea
                                    placeholder="Ghi chú thêm cho bác sĩ..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Doctor Selection */}
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card p-6 shadow-sm h-full">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            Thông tin bác sĩ
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Chuyên khoa</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn chuyên khoa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.code}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Bác sĩ</Label>
                                <Select
                                    value={selectedDoctor}
                                    onValueChange={setSelectedDoctor}
                                    disabled={!selectedDepartment}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedDepartment ? "Chọn bác sĩ" : "Vui lòng chọn chuyên khoa trước"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((doc) => (
                                            <SelectItem key={doc.id} value={doc.id}>
                                                {doc.fullName} - {doc.specialization}
                                            </SelectItem>
                                        ))}
                                        {doctors.length === 0 && selectedDepartment && (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                Không có bác sĩ nào trong khoa này
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedDoctor && (
                                <div className="rounded-md bg-primary/5 p-4 border border-primary/10 mt-4">
                                    <h3 className="font-medium text-primary mb-2">Thông tin lịch làm việc</h3>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                        <p>• Bác sĩ làm việc từ Thứ 2 - Thứ 6</p>
                                        <p>• Giờ làm việc: 08:00 - 17:00</p>
                                        <p>• Thời lượng khám trung bình: 30 phút</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t">
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Tạo lịch hẹn'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
