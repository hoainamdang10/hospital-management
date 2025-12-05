'use client';

import { Calendar, Bell, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface DoctorHeroSectionProps {
    userName: string;
}

export function DoctorHeroSection({ userName = 'Bác sĩ' }: DoctorHeroSectionProps) {
    const getDisplayName = (name: string) => {
        if (name.includes('@')) {
            const emailPart = name.split('@')[0];
            return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
        }
        return name;
    };

    const displayName = getDisplayName(userName);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-6 shadow-xl md:p-8"
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-white/5 blur-xl" />

                {/* Subtle grid pattern */}
                <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                {/* Left Section - Avatar and Greeting */}
                <div className="flex items-center gap-4 md:gap-5">
                    {/* Avatar with animated ring */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-white/30 to-white/5 blur-sm" />
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 ring-2 ring-white/30 backdrop-blur-sm md:h-16 md:w-16">
                            <span className="text-xl font-bold text-white md:text-2xl">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </motion.div>

                    {/* Greeting Text */}
                    <div className="space-y-1">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="text-xl font-bold text-white md:text-2xl lg:text-3xl"
                        >
                            {getGreeting()}, {displayName}!
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="flex items-center gap-2 text-teal-50"
                        >
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">{getCurrentDate()}</span>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="flex items-center gap-1.5 text-sm text-teal-100/90"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Chúc bác sĩ một ngày làm việc hiệu quả!
                        </motion.p>
                    </div>
                </div>

                {/* Right Section - Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="flex items-center gap-3"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white md:px-4"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Thông báo</span>
                    </Button>

                    <Link href="/doctor/schedule">
                        <Button
                            size="sm"
                            className="bg-white text-teal-700 shadow-lg shadow-black/10 transition-all duration-200 hover:bg-teal-50 hover:shadow-xl md:px-4"
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Lịch làm việc</span>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}
