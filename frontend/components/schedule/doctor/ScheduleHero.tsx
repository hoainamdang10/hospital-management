'use client';

import { CalendarDays, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ScheduleHeroProps {
    onOpenSettings?: () => void;
}

/**
 * Doctor Schedule Hero Banner
 * Modern healthcare SaaS style with gradient background
 */
export function ScheduleHero({ onOpenSettings }: ScheduleHeroProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-6 text-white shadow-xl lg:p-8"
        >
            {/* Decorative Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm lg:h-16 lg:w-16"
                    >
                        <CalendarDays className="h-7 w-7 text-white lg:h-8 lg:w-8" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold lg:text-3xl">Lịch làm việc</h1>
                        <p className="mt-1 text-sm text-cyan-100 lg:text-base">
                            Quản lý lịch khám bệnh và thời gian làm việc trong tuần
                        </p>
                    </div>
                </div>

                <Button
                    onClick={onOpenSettings || (() => router.push('/doctor/profile'))}
                    className="w-fit rounded-xl bg-white/20 px-5 py-2.5 font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-xl"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt lịch làm việc
                </Button>
            </div>
        </motion.div>
    );
}
