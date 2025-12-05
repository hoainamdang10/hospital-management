'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpcomingAppointments } from './UpcomingAppointments';
import { SpendingAnalysisChart } from './SpendingAnalysisChart';
import Link from 'next/link';

interface DashboardOverviewProps {
  patientId?: string;
}

type TabType = 'appointments' | 'analytics';

export function DashboardOverview({ patientId }: DashboardOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      {/* Header with Tabs */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Tổng quan</h2>

          <div className="flex rounded-xl bg-slate-100/80 p-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === 'appointments'
                  ? 'text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
              )}
            >
              {activeTab === 'appointments' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Calendar className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Lịch hẹn</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === 'analytics'
                  ? 'text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
              )}
            >
              {activeTab === 'analytics' && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <TrendingUp className="relative z-10 h-4 w-4" />
              <span className="relative z-10">Phân tích</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === 'appointments' ? (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <UpcomingAppointments patientId={patientId} hideHeader={true} />
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SpendingAnalysisChart variant="minimal" patientId={patientId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer with Quick Link */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
        <Link
          href={activeTab === 'appointments' ? '/patient/appointments' : '/patient/billing'}
          className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {activeTab === 'appointments' ? 'Xem tất cả lịch hẹn' : 'Xem chi tiết hóa đơn'}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
