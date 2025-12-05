'use client';

import { Settings, Globe, Zap, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlobalConfigBarProps {
    timeZone: string;
    isFlexible: boolean;
    onTimeZoneChange: (timezone: string) => void;
    onFlexibleChange: (isFlexible: boolean) => void;
}

const TIMEZONE_OPTIONS = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (GMT+7)', flag: '🇻🇳' },
    { value: 'Asia/Bangkok', label: 'Thái Lan (GMT+7)', flag: '🇹🇭' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)', flag: '🇸🇬' },
    { value: 'Asia/Tokyo', label: 'Nhật Bản (GMT+9)', flag: '🇯🇵' },
];

/**
 * Global Configuration Bar
 * Settings for timezone and flexible scheduling mode
 */
export function GlobalConfigBar({
    timeZone,
    isFlexible,
    onTimeZoneChange,
    onFlexibleChange,
}: GlobalConfigBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Title */}
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Settings className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Cấu hình chung</p>
                        <p className="text-xs text-slate-500">Thiết lập múi giờ và chế độ lịch linh hoạt</p>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Timezone Select */}
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Globe className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            value={timeZone}
                            onChange={(e) => onTimeZoneChange(e.target.value)}
                            className={cn(
                                'appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm font-medium text-slate-700',
                                'transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20'
                            )}
                        >
                            {TIMEZONE_OPTIONS.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.flag} {tz.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Flexible Schedule Toggle */}
                    <label className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 transition-all',
                        'hover:border-cyan-200 hover:bg-cyan-50/50',
                        isFlexible && 'border-cyan-200 bg-cyan-50/50'
                    )}>
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isFlexible}
                                onChange={(e) => onFlexibleChange(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className={cn(
                                'h-5 w-9 rounded-full transition-colors',
                                isFlexible ? 'bg-cyan-600' : 'bg-slate-200'
                            )}>
                                <div className={cn(
                                    'h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                                    isFlexible ? 'translate-x-4' : 'translate-x-0.5',
                                    'mt-0.5'
                                )} />
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Zap className={cn(
                                'h-4 w-4 transition-colors',
                                isFlexible ? 'text-cyan-600' : 'text-slate-400'
                            )} />
                            <span className={cn(
                                'text-sm font-medium transition-colors',
                                isFlexible ? 'text-cyan-700' : 'text-slate-600'
                            )}>
                                Lịch linh hoạt
                            </span>
                        </div>
                    </label>

                    {/* Help tooltip */}
                    {isFlexible && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="hidden text-xs text-cyan-600 lg:block"
                        >
                            Cho phép bệnh nhân đặt lịch ngoài giờ làm việc
                        </motion.span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
