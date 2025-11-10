'use client';

import { Calendar, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    if (hour < 12) return '☀️ Chào buổi sáng';
    if (hour < 18) return '🌤️ Chào buổi chiều';
    return '🌙 Chào buổi tối';
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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 p-8 shadow-xl">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Avatar with gradient ring */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-white/40 to-white/10 blur-sm" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/30">
              <span className="text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Welcome text */}
          <div>
            <h1 className="text-3xl font-bold text-white">
              {getGreeting()}, {displayName}!
            </h1>
            <p className="mt-1 flex items-center text-primary-50">
              <Calendar className="mr-2 h-4 w-4" />
              {getCurrentDate()}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="hidden md:flex items-center space-x-3">
          <Button
            variant="outline"
            className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <Bell className="mr-2 h-4 w-4" />
            Thông báo
          </Button>
          <Button
            className="bg-white text-primary-600 hover:bg-primary-50 shadow-lg"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Đặt lịch khám
          </Button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 right-0 opacity-20">
        <svg width="200" height="100" viewBox="0 0 200 100" fill="none">
          <circle cx="150" cy="50" r="40" fill="white" opacity="0.1" />
          <circle cx="180" cy="30" r="25" fill="white" opacity="0.15" />
          <circle cx="170" cy="70" r="30" fill="white" opacity="0.1" />
        </svg>
      </div>
    </div>
  );
}
