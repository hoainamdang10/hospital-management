'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import { getPatientDashboardStats, type DashboardStats } from '@/lib/api/dashboard.service';
import { patientService } from '@/lib/api/patient.service';
import { cn } from '@/lib/utils';

/**
 * Patient Dashboard Page
 * Route: /patient/dashboard
 */
export default function PatientDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { patient, patientId, internalId } = usePatient();
  const billingPatientId = internalId || patient?.id || patientId || null;
  const [hasInsurance, setHasInsurance] = useState<boolean>(false);
  const [hasEmergencyContact, setHasEmergencyContact] = useState<boolean>(false);

  // Debug log only - middleware handles auth redirect
  useEffect(() => {
    console.log('[PatientDashboard] State', {
      isAuthLoading,
      user,
      patient,
      patientId,
      internalId,
    });
  }, [isAuthLoading, user, patient, patientId, internalId]);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingConfirmed7DaysCount: 0,
    pendingPaymentsCount: 0,
    recentCompletedOrCancelledCount: 0,
    profileCompletion: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadDashboardStats();
      loadProfileBadges();
    }
  }, [patientId, user?.id, user?.userId]);

  const loadDashboardStats = async () => {
    if (!patientId) return;

    try {
      setIsLoadingStats(true);
      // Dùng UUID nếu có, tránh gọi bằng mã PAT gây lỗi
      const billingIdentifier = billingPatientId;
      const data = await getPatientDashboardStats(patientId, { billingIdentifier });
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadProfileBadges = async () => {
    if (!patientId) return;
    try {
      const idToUse = internalId || patientId;
      const [insuranceRes, contactsRes] = await Promise.all([
        patientService.getInsurance(idToUse).catch(() => ({
          patientId: idToUse,
          insuranceInfo: null,
          hasInsurance: false,
        })),
        patientService.getEmergencyContacts(idToUse).catch(() => ({
          patientId: idToUse,
          contacts: [],
          totalCount: 0,
        })),
      ]);

      // ✅ Backend now returns: { patientId, insuranceInfo, hasInsurance }
      setHasInsurance(insuranceRes.hasInsurance && insuranceRes.insuranceInfo !== null);

      // ✅ Backend returns: { patientId, contacts, totalCount }
      setHasEmergencyContact(
        Array.isArray(contactsRes.contacts) && contactsRes.contacts.length > 0
      );
    } catch {
      setHasInsurance(false);
      setHasEmergencyContact(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8">
        {/* Welcome Header */}
        <motion.div variants={item}>
          <WelcomeHeader userName={user?.fullName || user?.email || 'Bệnh nhân'} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <PremiumStatCard
            title="Lịch đã giữ chỗ"
            subtitle="Đã xác nhận (7 ngày tới)"
            value={stats.upcomingConfirmed7DaysCount.toString()}
            icon={Calendar}
            color="blue"
            isLoading={isLoadingStats}
          />
          <PremiumStatCard
            title="Thanh toán đang xử lý"
            subtitle="Giao dịch prepaid chờ duyệt"
            value={stats.pendingPaymentsCount.toString()}
            icon={CreditCard}
            color="orange"
            isLoading={isLoadingStats}
          />
          <PremiumStatCard
            title="Lịch được xử lý"
            subtitle="Hoàn tất / Hủy (30 ngày)"
            value={stats.recentCompletedOrCancelledCount.toString()}
            icon={FileText}
            color="green"
            isLoading={isLoadingStats}
          />
          <PremiumStatCard
            title="Hồ sơ & giấy tờ"
            subtitle="Hoàn thiện trước khi đặt lịch"
            value={`${stats.profileCompletion}%`}
            icon={ShieldCheck}
            color="purple"
            isLoading={isLoadingStats}
            isProgress
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (Main Content) */}
          <motion.div variants={item} className="space-y-8 lg:col-span-2">
            {/* Dashboard Overview (Tabs: Appointments & Analytics) */}
            <DashboardOverview patientId={patientId || undefined} />
          </motion.div>

          {/* Right Column (Sidebar Widgets) */}
          <motion.div variants={item} className="space-y-8 lg:col-span-1">
            {/* Profile Summary (Priority 1) */}

            {/* Recent Activity (Moved to Sidebar) */}
            <div className="rounded-3xl border border-white/50 bg-white/60 p-1 shadow-xl backdrop-blur-xl">
              <RecentActivity patientId={patientId || undefined} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

// --- Components ---

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl backdrop-blur-2xl transition-all hover:bg-white/80 hover:shadow-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

function PremiumStatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  color,
  isLoading = false,
  isProgress = false,
}: {
  title: string;
  subtitle?: string;
  value: string;
  icon: any;
  color: 'blue' | 'green' | 'orange' | 'purple';
  isLoading?: boolean;
  isProgress?: boolean;
}) {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-100',
      gradient: 'from-blue-500 to-blue-600',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      ring: 'ring-green-100',
      gradient: 'from-green-500 to-green-600',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-100',
      gradient: 'from-orange-500 to-orange-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-100',
      gradient: 'from-purple-500 to-purple-600',
    },
  };

  const current = colors[color];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl transition-all hover:shadow-2xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <Loader2 className="mt-2 h-8 w-8 animate-spin text-gray-300" />
          ) : (
            <div className="mt-2">
              <h3 className="text-3xl font-bold tracking-tight text-gray-900">{value}</h3>
              {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            </div>
          )}
        </div>
        <div
          className={cn(
            'rounded-2xl p-3 transition-colors group-hover:text-white',
            current.bg,
            'group-hover:bg-gradient-to-br',
            current.gradient
          )}
        >
          <Icon
            className={cn('h-6 w-6 transition-colors', current.text, 'group-hover:text-white')}
          />
        </div>
      </div>

      {isProgress && !isLoading && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: value }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn('h-full rounded-full bg-gradient-to-r', current.gradient)}
          />
        </div>
      )}
    </motion.div>
  );
}

function ProfileBadge({
  icon: Icon,
  label,
  active,
  activeText,
  inactiveText,
  color,
}: {
  icon: any;
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
  color: 'blue' | 'green';
}) {
  const colors = {
    blue: active
      ? 'bg-blue-50 text-blue-700 border-blue-100'
      : 'bg-gray-50 text-gray-500 border-gray-100',
    green: active
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-gray-50 text-gray-500 border-gray-100',
  };

  return (
    <div className={cn('flex items-center justify-between rounded-xl border p-3', colors[color])}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="rounded-full bg-white/50 px-2 py-1 text-xs font-semibold">
        {active ? activeText : inactiveText}
      </span>
    </div>
  );
}

function PremiumActionCard({
  title,
  description,
  href,
  icon: Icon,
  gradient,
  variant = 'default',
}: {
  title: string;
  description: string;
  href: string;
  icon: any;
  gradient: string;
  variant?: 'default' | 'light';
}) {
  if (variant === 'light') {
    return (
      <a href={href} className="group block">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg">
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-transform group-hover:scale-110 group-hover:bg-green-100">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a href={href} className="group block">
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
          'bg-gradient-to-br',
          gradient
        )}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all group-hover:scale-150" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-black/5 blur-2xl transition-all group-hover:scale-150" />

        <div className="relative flex items-center justify-between text-white">
          <div>
            <h3 className="mb-1 text-lg font-bold">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </a>
  );
}
