'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayConfig {
    key: string;
    label: string;
    fullLabel: string;
}

export const DAY_CONFIGS: DayConfig[] = [
    { key: 'monday', label: 'T2', fullLabel: 'Thứ 2' },
    { key: 'tuesday', label: 'T3', fullLabel: 'Thứ 3' },
    { key: 'wednesday', label: 'T4', fullLabel: 'Thứ 4' },
    { key: 'thursday', label: 'T5', fullLabel: 'Thứ 5' },
    { key: 'friday', label: 'T6', fullLabel: 'Thứ 6' },
    { key: 'saturday', label: 'T7', fullLabel: 'Thứ 7' },
    { key: 'sunday', label: 'CN', fullLabel: 'Chủ nhật' },
];

export interface DayScheduleState {
    enabled: boolean;
    start: string;
    end: string;
}

interface TimeSelectProps {
    value: string;
    onChange: (time: string) => void;
    disabled?: boolean;
}

const TimeSelect: React.FC<TimeSelectProps> = ({ value, onChange, disabled }) => {
    const selectRef = useRef<HTMLSelectElement>(null);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 6; h <= 22; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                options.push(`${hour}:${minute}`);
            }
        }
        return options;
    }, []);

    useEffect(() => {
        if (selectRef.current) {
            const selectedOption = selectRef.current.querySelector(`option[value="${value}"]`);
            if (selectedOption) {
                selectedOption.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [value]);

    return (
        <div className="relative">
            <select
                ref={selectRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    'w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700',
                    'transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
                    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'
                )}
            >
                {timeOptions.map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    );
};

interface WeeklyScheduleCardProps {
    dayState: Record<string, DayScheduleState>;
    onToggleDay: (day: string) => void;
    onUpdateDayTime: (day: string, field: 'start' | 'end', value: string) => void;
    onSave: () => void;
    isSaving: boolean;
    hasUnsavedChanges?: boolean;
}

/**
 * Weekly Schedule Configuration Cards
 * Allows doctors to set their weekly working hours per day
 */
export function WeeklyScheduleCards({
    dayState,
    onToggleDay,
    onUpdateDayTime,
    onSave,
    isSaving,
    hasUnsavedChanges = false,
}: WeeklyScheduleCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Thiết lập lịch làm việc</h3>
                        <p className="text-sm text-slate-500">Cấu hình thời gian làm việc cho từng ngày trong tuần</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                            Chưa lưu
                        </span>
                    )}
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="rounded-xl bg-cyan-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-cyan-700 hover:shadow-md disabled:opacity-70"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            'Lưu thay đổi'
                        )}
                    </Button>
                </div>
            </div>

            {/* Day Cards Grid */}
            <div className="p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {DAY_CONFIGS.map((day, idx) => {
                        const state = dayState[day.key];
                        const isEnabled = state?.enabled ?? false;

                        return (
                            <motion.div
                                key={day.key}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    'relative overflow-hidden rounded-xl border-2 transition-all duration-200',
                                    isEnabled
                                        ? 'border-cyan-200 bg-white shadow-sm'
                                        : 'border-slate-100 bg-slate-50/50'
                                )}
                            >
                                {/* Active indicator */}
                                <div
                                    className={cn(
                                        'absolute left-0 top-0 h-full w-1 transition-colors',
                                        isEnabled ? 'bg-gradient-to-b from-cyan-500 to-teal-500' : 'bg-slate-200'
                                    )}
                                />

                                <div className="p-4 pl-5">
                                    {/* Day Header with Toggle */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <span className={cn(
                                                'text-base font-bold',
                                                isEnabled ? 'text-slate-900' : 'text-slate-400'
                                            )}>
                                                {day.fullLabel}
                                            </span>
                                            <span className={cn(
                                                'ml-2 text-sm',
                                                isEnabled ? 'text-slate-500' : 'text-slate-400'
                                            )}>
                                                ({day.label})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onToggleDay(day.key)}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                                                isEnabled ? 'bg-cyan-600' : 'bg-slate-200'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                )}
                                            />
                                        </button>
                                    </div>

                                    {/* Time Selectors */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className={cn(
                                                'mb-1.5 block text-xs font-medium uppercase tracking-wide',
                                                isEnabled ? 'text-slate-500' : 'text-slate-400'
                                            )}>
                                                Bắt đầu
                                            </label>
                                            <TimeSelect
                                                value={state?.start || '08:00'}
                                                onChange={(time) => onUpdateDayTime(day.key, 'start', time)}
                                                disabled={!isEnabled}
                                            />
                                        </div>
                                        <div>
                                            <label className={cn(
                                                'mb-1.5 block text-xs font-medium uppercase tracking-wide',
                                                isEnabled ? 'text-slate-500' : 'text-slate-400'
                                            )}>
                                                Kết thúc
                                            </label>
                                            <TimeSelect
                                                value={state?.end || '17:00'}
                                                onChange={(time) => onUpdateDayTime(day.key, 'end', time)}
                                                disabled={!isEnabled}
                                            />
                                        </div>
                                    </div>

                                    {/* Helper text when disabled */}
                                    {!isEnabled && (
                                        <p className="mt-3 text-center text-xs text-slate-400">
                                            Nhấn toggle để bật
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Helper Text */}
                <p className="mt-4 text-center text-sm text-slate-500">
                    <Clock className="mr-1.5 inline-block h-4 w-4" />
                    Thay đổi này sẽ áp dụng cho lịch làm việc mặc định của bạn mỗi tuần
                </p>
            </div>
        </motion.div>
    );
}
