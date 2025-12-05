'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { getDoctorDashboardStats, DoctorDashboardStats } from '@/lib/api/doctor-dashboard.service';
import {
  DoctorHeroSection,
  DoctorKPICards,
  DoctorScheduleList,
  DoctorQuickActions,
  DoctorCharts,
} from '@/components/dashboard/doctor';

/**
 * Doctor Dashboard Page - Redesigned
 * Route: /doctor/dashboard
 * 
 * A modern SaaS-style dashboard for doctors featuring:
 * - Hero section with greeting and quick actions
 * - KPI cards showing key metrics
 * - Interactive schedule with week selector
 * - Analytics charts (appointments, payments, visit types)
 * - Quick action shortcuts
 */
export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const effectiveUserId = user.userId || user.id;
    if (!effectiveUserId) return;

    let canceled = false;
    setLoading(true);

    getDoctorDashboardStats(effectiveUserId)
      .then((data) => {
        if (!canceled) {
          setStats(data);
        }
      })
      .catch((error) => {
        console.error('Failed to load dashboard stats:', error);
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <DoctorHeroSection userName={user?.fullName || user?.email || 'Bác sĩ'} />

        {/* KPI Cards */}
        <DoctorKPICards stats={stats} loading={loading} />

        {/* Charts Section */}
        <DoctorCharts stats={stats} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Schedule */}
          <div className="lg:col-span-2">
            <DoctorScheduleList
              appointments={stats?.todayAppointments || []}
              loading={loading}
            />
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <DoctorQuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
