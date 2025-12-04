'use client';

import { CalendarIcon } from 'lucide-react';

interface WeekViewProps {
    selectedDate: Date;
    appointments: any[];
    showDoctorName: boolean;
}

export function WeekView({ selectedDate, appointments, showDoctorName }: WeekViewProps) {
    const getWeekDays = (date: Date) => {
        const days = [];
        const dayOfWeek = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

        for (let i = 0; i < 7; i++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const weekDays = getWeekDays(selectedDate);
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Lịch trong tuần</h3>
            </div>

            <div className="grid grid-cols-7 divide-x divide-slate-200">
                {weekDays.map((day, index) => {
                    const dayAppointments = appointments.filter((apt) => {
                        const aptDate = new Date(apt.date).toDateString();
                        return aptDate === day.toDateString();
                    });

                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={index} className={`min-h-[600px] ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className={`border-b border-slate-200 p-3 text-center ${isToday ? 'bg-blue-100' : 'bg-slate-50'}`}>
                                <div className="text-xs font-medium text-slate-500">{dayNames[index]}</div>
                                <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                                    {day.getDate()}
                                </div>
                            </div>

                            <div className="space-y-2 p-2">
                                {dayAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-xs transition-all hover:border-blue-300 hover:shadow"
                                    >
                                        <div className="font-semibold text-slate-900">{apt.time}</div>
                                        <div className="mt-1 text-slate-700">{apt.patientName}</div>
                                        {showDoctorName && (
                                            <div className="mt-0.5 text-slate-500">{apt.doctorName}</div>
                                        )}
                                        <span
                                            className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${apt.status === 'confirmed'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : apt.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}
                                        >
                                            {apt.status}
                                        </span>
                                    </div>
                                ))}
                                {dayAppointments.length === 0 && (
                                    <div className="pt-4 text-center text-xs text-slate-400">Không có lịch</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
