'use client';

interface MonthViewProps {
    selectedDate: Date;
    appointments: any[];
    onDateSelect: (date: Date) => void;
}

export function MonthView({ selectedDate, appointments, onDateSelect }: MonthViewProps) {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const getAppointmentCount = (day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toISOString().split('T')[0];
        return appointments.filter((apt) => apt.date === dateString).length;
    };

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Tháng {currentMonth + 1}, {currentYear}</h3>
            </div>

            <div className="p-4">
                <div className="mb-2 grid grid-cols-7 gap-2">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                        <div key={day} className="text-center text-xs font-semibold text-slate-600">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const aptCount = getAppointmentCount(day);
                        const isToday =
                            day === new Date().getDate() &&
                            currentMonth === new Date().getMonth() &&
                            currentYear === new Date().getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => onDateSelect(new Date(currentYear, currentMonth, day))}
                                className={`group relative aspect-square rounded-lg border transition-all ${isToday
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                                    }`}
                            >
                                <div className="flex h-full flex-col items-center justify-center">
                                    <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                                        {day}
                                    </span>
                                    {aptCount > 0 && (
                                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                            {aptCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
