'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, PieChart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UpcomingAppointments } from './UpcomingAppointments';
import { SpendingAnalysisChart } from './SpendingAnalysisChart';

interface DashboardOverviewProps {
  patientId?: string;
}

type TabType = 'appointments' | 'analytics';

export function DashboardOverview({ patientId }: DashboardOverviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');

  return (
    <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/60 shadow-xl backdrop-blur-xl">
      {/* Header with Tabs */}
      <div className="border-b border-gray-100 bg-white/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Tổng quan</h2>

          <div className="flex rounded-xl bg-gray-100/80 p-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === 'appointments'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
              )}
            >
              <Calendar className="h-4 w-4" />
              Lịch hẹn
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Phân tích
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
    </div>
  );
}
