'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeekNavigatorProps {
    weekDates: Date[];
    currentWeekOffset: number;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onGoToThisWeek: () => void;
}

/**
 * Week Navigator Component
 * Navigation controls for week-based calendar view
 */
export function WeekNavigator({
    weekDates,
    currentWeekOffset,
    onPrevWeek,
    onNextWeek,
    onGoToThisWeek,
}: WeekNavigatorProps) {
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    const isCurrentWeek = currentWeekOffset === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        >
            {/* Previous Week Button */}
            <Button
                variant="outline"
                onClick={onPrevWeek}
                className="flex items-center gap-2 rounded-lg border-slate-200 px-4 py-2 font-medium text-slate-700 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Tuần trước</span>
            </Button>

            {/* Current Week Info */}
            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                    {!isCurrentWeek && (
                        <button
                            onClick={onGoToThisWeek}
                            className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-200"
                        >
                            Về tuần này
                        </button>
                    )}
                    <span className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        isCurrentWeek
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-100 text-slate-600'
                    )}>
                        {isCurrentWeek
                            ? 'Tuần này'
                            : `Tuần ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset}`}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Calendar className="h-5 w-5 text-cyan-600" />
                    <span>
                        {format(startDate, 'dd/MM', { locale: vi })} - {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                    </span>
                </div>
            </div>

            {/* Next Week Buttona */}
            <Button
                variant="outline"
                onClick={onNextWeek}
                className="flex items-center gap-2 rounded-lg border-slate-200 px-4 py-2 font-medium text-slate-700 transition-all hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
                <span className="hidden sm:inline">Tuần sau</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </motion.div>
    );
}
