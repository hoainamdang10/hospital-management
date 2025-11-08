'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, CreditCard, User, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import { getPatientDashboardStats, type DashboardStats } from '@/lib/api/dashboard.service';

/**
 * Patient Dashboard Page
 * Route: /patient/dashboard
 */
export default function PatientDashboardPage() {
  const { user } = useAuth();
  const { patient, patientId, isLoading: isLoadingPatient } = usePatient();
  const [stats, setStats] = useState<DashboardStats>({
    upcomingAppointments: 0,
    totalMedicalRecords: 0,
    unpaidInvoices: 0,
    profileCompletion: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadDashboardStats();
    }
  }, [patientId]);

  const loadDashboardStats = async () => {
    if (!patientId) return;

    try {
      setIsLoadingStats(true);
      const data = await getPatientDashboardStats(patientId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <WelcomeHeader userName={user?.email || 'Bệnh nhân'} />

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Lịch hẹn sắp tới"
            value={stats.upcomingAppointments.toString()}
            icon={Calendar}
            color="blue"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Hồ sơ bệnh án"
            value={stats.totalMedicalRecords.toString()}
            icon={FileText}
            color="green"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Hóa đơn chưa thanh toán"
            value={stats.unpaidInvoices.toString()}
            icon={CreditCard}
            color="orange"
            isLoading={isLoadingStats}
          />
          <StatCard
            title="Hồ sơ hoàn chỉnh"
            value={`${stats.profileCompletion}%`}
            icon={User}
            color="purple"
            isLoading={isLoadingStats}
          />
        </div>

        {/* Main Content: Appointments & Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming Appointments - Takes 2 columns */}
          <div className="lg:col-span-2">
            <UpcomingAppointments patientId={user?.id} />
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div className="lg:col-span-1">
            <RecentActivity patientId={user?.id} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <QuickActionCard
            title="Đặt lịch khám"
            description="Đặt lịch hẹn với bác sĩ"
            href="/patient/appointments/book"
            icon={Calendar}
          />
          <QuickActionCard
            title="Xem hồ sơ bệnh án"
            description="Tra cứu lịch sử khám bệnh"
            href="/patient/medical-history"
            icon={FileText}
          />
          <QuickActionCard
            title="Thanh toán"
            description="Xem và thanh toán hóa đơn"
            href="/patient/billing"
            icon={CreditCard}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component with animations
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading = false,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  isLoading?: boolean;
}) {
  const colorConfig = ({
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      shadow: 'shadow-blue-500/20',
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      shadow: 'shadow-green-500/20',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      shadow: 'shadow-orange-500/20',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      shadow: 'shadow-purple-500/20',
    },
  } as const)[color] || {
    bg: 'from-gray-500 to-gray-600',
    light: 'bg-gray-50',
    text: 'text-gray-600',
    shadow: 'shadow-gray-500/20',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="mt-2 flex items-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <p className="mt-2 text-4xl font-bold text-gray-900 transition-all group-hover:scale-105">
              {value}
            </p>
          )}
        </div>
        
        {/* Animated icon with gradient */}
        <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colorConfig.bg} shadow-lg ${colorConfig.shadow} transition-transform group-hover:scale-110 group-hover:rotate-6`}>
          <Icon className="h-7 w-7 text-white" />
          
          {/* Pulse effect */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colorConfig.bg} opacity-0 group-hover:opacity-50 group-hover:animate-ping`} />
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${colorConfig.bg} transition-all duration-500 group-hover:w-full`} />
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-6 w-6 text-primary-600" />
      </div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
