'use client';

import { useState, useEffect } from 'react';
import { Calendar, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ChartStatCard } from '@/components/dashboard/ChartStatCard';
import { useAuth } from '@/hooks/useAuth';
import { usePatient } from '@/hooks/usePatient';
import { getPatientDashboardStats, type DashboardStats } from '@/lib/api/dashboard.service';
import { patientService } from '@/lib/api/patient.service';

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

        {/* Quick Stats with Mini Charts */}
        <motion.div variants={item} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <ChartStatCard
            title="Lịch đã giữ chỗ"
            subtitle="Đã xác nhận (7 ngày tới)"
            value={stats.upcomingConfirmed7DaysCount}
            icon={Calendar}
            chartType="ring"
            chartValue={stats.upcomingConfirmed7DaysCount}
            chartMaxValue={20}
            color="emerald"
            isLoading={isLoadingStats}
          />
          <ChartStatCard
            title="Thanh toán đang xử lý"
            subtitle="Giao dịch prepaid chờ duyệt"
            value={stats.pendingPaymentsCount}
            icon={CreditCard}
            chartType="bar"
            chartData={[2, 4, 1, stats.pendingPaymentsCount, 3, 2, stats.pendingPaymentsCount]}
            color="amber"
            isLoading={isLoadingStats}
          />
          <ChartStatCard
            title="Lịch được xử lý"
            subtitle="Hoàn tất / Hủy (30 ngày)"
            value={stats.recentCompletedOrCancelledCount}
            icon={FileText}
            chartType="area"
            chartData={[5, 12, 8, 15, 10, 18, stats.recentCompletedOrCancelledCount]}
            color="teal"
            isLoading={isLoadingStats}
          />
          <ChartStatCard
            title="Hồ sơ & giấy tờ"
            subtitle="Hoàn thiện trước khi đặt lịch"
            value={`${stats.profileCompletion}%`}
            icon={ShieldCheck}
            chartType="progress"
            chartValue={stats.profileCompletion}
            color="cyan"
            isLoading={isLoadingStats}
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
            {/* Recent Activity */}
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-1 shadow-xl backdrop-blur-xl">
              <RecentActivity patientId={patientId || undefined} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
