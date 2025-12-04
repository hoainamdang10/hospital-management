'use client';

import { Clock, User, MoreVertical, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';

interface Appointment {
    id: string;
    time: string;
    duration: number;
    doctorName: string;
    patientName: string;
    visitType: string;
    status: string;
}

interface DayViewProps {
    selectedDate: Date;
    appointments: Appointment[];
    showDoctorName: boolean;
}

export function DayView({ selectedDate, appointments, showDoctorName }: DayViewProps) {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: { label: string; className: string } } = {
            confirmed: { label: 'Đã xác nhận', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            pending: { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border-amber-200' },
            cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' },
            completed: { label: 'Hoàn thành', className: 'bg-blue-50 text-blue-700 border-blue-200' },
        };
        const { label, className } = statusMap[status] || statusMap.pending;
        return (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
                {label}
            </span>
        );
    };

    const getVisitTypeBadge = (type: string) => {
        return type === 'CONSULTATION' ? 'Khám' : 'Tái khám';
    };

    const getAppointmentPosition = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const startHour = 8;
        const position = ((hours - startHour) * 60 + minutes) / 60;
        return position * 80; // 80px per hour
    };

    if (appointments.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <CalendarIcon className="mx-auto h-16 w-16 text-slate-400" />
                <h3 className="mt-4 text-lg font-medium text-slate-600">Không có lịch hẹn</h3>
                <p className="mt-1 text-sm text-slate-500">Chưa có lịch hẹn nào cho ngày này</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative">
                {/* Time Grid */}
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">Lịch trong ngày</h3>
                </div>

                <div className="relative p-4">
                    {/* Hour labels on the left */}
                    <div className="grid grid-cols-[80px_1fr] gap-4">
                        <div className="space-y-[60px] pt-2">
                            {hours.map((hour) => (
                                <div key={hour} className="text-sm font-medium text-slate-500">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Appointment area */}
                        <div className="relative min-h-[800px] rounded-lg border border-slate-200 bg-slate-50/50">
                            {/* Hour lines */}
                            {hours.map((hour, index) => (
                                <div
                                    key={hour}
                                    className="absolute left-0 right-0 border-t border-slate-200"
                                    style={{ top: `${index * 80}px` }}
                                />
                            ))}

                            {/* Appointments */}
                            <div className="relative">
                                {appointments.map((apt) => {
                                    const top = getAppointmentPosition(apt.time);
                                    const height = (apt.duration / 60) * 80;

                                    return (
                                        <div
                                            key={apt.id}
                                            className="group absolute left-2 right-2 cursor-pointer overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 shadow-sm transition-all hover:shadow-md"
                                            style={{ top: `${top}px`, height: `${height}px`, minHeight: '60px' }}
                                        >
                                            <div className="flex h-full flex-col justify-between">
                                                <div className="flex-1">
                                                    <div className="mb-1 flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900">{apt.patientName}</p>
                                                            {showDoctorName && (
                                                                <p className="text-xs text-slate-600">{apt.doctorName}</p>
                                                            )}
                                                        </div>
                                                        <button className="rounded-md p-1 opacity-0 transition-opacity hover:bg-white/60 group-hover:opacity-100">
                                                            <MoreVertical className="h-4 w-4 text-slate-600" />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {apt.time} ({apt.duration} phút)
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                            {getVisitTypeBadge(apt.visitType)}
                                                        </span>
                                                        {getStatusBadge(apt.status)}
                                                    </div>
                                                </div>

                                                {/* Quick Actions (on hover) */}
                                                <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-white/80 text-xs font-medium text-blue-700 hover:bg-white">
                                                        <Edit className="h-3 w-3" />
                                                        Sửa
                                                    </button>
                                                    <button className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-white/80 text-xs font-medium text-red-700 hover:bg-white">
                                                        <Trash2 className="h-3 w-3" />
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
