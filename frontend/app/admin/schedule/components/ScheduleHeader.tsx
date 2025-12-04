'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ScheduleHeaderProps {
    selectedDate: Date;
    viewMode: 'day' | 'week' | 'month' | 'list';
    onViewModeChange: (mode: 'day' | 'week' | 'month' | 'list') => void;
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
}

export function ScheduleHeader({
    selectedDate,
    viewMode,
    onViewModeChange,
    onPrevDay,
    onNextDay,
    onToday,
}: ScheduleHeaderProps) {
    const formattedDate = format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi });

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Date Navigation */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onPrevDay}
                            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                            title="Ngày trước"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <button
                            onClick={onNextDay}
                            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
                            title="Ngày sau"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold capitalize text-slate-900">
                                {formattedDate}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onToday}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:shadow"
                    >
                        Hôm nay
                    </button>
                </div>

                {/* Right: View Tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    {[
                        { id: 'day', label: 'Ngày' },
                        { id: 'week', label: 'Tuần' },
                        { id: 'month', label: 'Tháng' },
                        { id: 'list', label: 'Danh sách' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onViewModeChange(tab.id as any)}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${viewMode === tab.id
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
