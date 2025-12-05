'use client';

import { Calendar, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function WelcomeHeader({ userName = 'Bệnh nhân' }: { userName?: string }) {
  const getDisplayName = (name: string) => {
    // If it's an email, extract the part before @ or use a default
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

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
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
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-8 shadow-2xl shadow-emerald-500/20"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-white blur-3xl"
        />
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Avatar with gradient ring */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-white/40 via-cyan-200/30 to-white/40 blur-sm animate-pulse" />
            <div className="relative flex h-18 w-18 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-2 ring-white/40">
              <span className="text-3xl font-bold text-white drop-shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 ring-3 ring-white flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </motion.div>

          {/* Welcome text */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl">{getGreetingEmoji()}</span>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {getGreeting()}, {displayName}!
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 flex items-center text-emerald-50"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {getCurrentDate()}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-sm text-white/80 italic"
            >
              Chúc bạn một ngày tốt lành. Đừng quên uống thuốc đúng giờ nhé!
            </motion.p>
          </div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="hidden md:flex items-center space-x-3"
        >
          <Link href="/patient/notifications">
            <Button
              variant="outline"
              className="border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white rounded-xl"
            >
              <Bell className="mr-2 h-4 w-4" />
              Thông báo
            </Button>
          </Link>
          <Link href="/patient/appointments/book">
            <Button
              className="bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-lg shadow-black/10 rounded-xl font-semibold"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Đặt lịch khám
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 right-0 opacity-30">
        <svg width="280" height="140" viewBox="0 0 280 140" fill="none">
          <circle cx="200" cy="70" r="50" fill="white" opacity="0.1" />
          <circle cx="240" cy="40" r="35" fill="white" opacity="0.15" />
          <circle cx="220" cy="100" r="40" fill="white" opacity="0.1" />
          <circle cx="150" cy="90" r="25" fill="white" opacity="0.08" />
        </svg>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400/50 via-cyan-300/50 to-teal-400/50" />
    </motion.div>
  );
}
