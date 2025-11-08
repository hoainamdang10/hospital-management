'use client';

import { useState, useEffect } from 'react';
import { FileText, Activity, Pill, TestTube, Calendar, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { medicalRecordsService } from '@/lib/api/medical-records.service';
import { MedicalRecord, HealthStatistics } from '@/lib/types/medical-records';
import { RecordTimeline } from '@/components/medical-records/RecordTimeline';
import { toast } from 'sonner';

/**
 * Medical Records Page
 * Route: /patient/medical-records
 */
export default function MedicalRecordsPage() {
  const { user } = useAuth();
  
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [statistics, setStatistics] = useState<HealthStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecords();
      loadStatistics();
    }
  }, [user]);

  async function loadRecords() {
    try {
      setLoading(true);
      const response = await medicalRecordsService.getPatientRecords(user!.id);
      if (response.success) {
        setRecords(response.records);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast.error('Không thể tải hồ sơ bệnh án');
    } finally {
      setLoading(false);
    }
  }

  async function loadStatistics() {
    try {
      setLoadingStats(true);
      const stats = await medicalRecordsService.getHealthStatistics(user!.id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Don't show error toast for stats, it's not critical
    } finally {
      setLoadingStats(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ sơ bệnh án</h1>
            <p className="mt-2 text-gray-600">Xem lịch sử khám bệnh và thông tin sức khỏe</p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Statistics Cards */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32" />
            ))}
          </div>
        ) : statistics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Tổng số hồ sơ"
              value={statistics.totalRecords}
              color="blue"
            />
            <StatCard
              icon={Pill}
              label="Đơn thuốc"
              value={statistics.totalPrescriptions}
              color="green"
            />
            <StatCard
              icon={TestTube}
              label="Xét nghiệm"
              value={statistics.totalLabTests}
              color="purple"
            />
            <StatCard
              icon={Activity}
              label="Chẩn đoán"
              value={statistics.totalDiagnoses}
              color="orange"
            />
          </div>
        ) : null}

        {/* Last Visit Info */}
        {statistics?.lastVisit && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Lần khám gần nhất</p>
                <p className="text-sm text-blue-700">
                  {new Date(statistics.lastVisit).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Common Diagnoses */}
        {statistics?.commonDiagnoses && statistics.commonDiagnoses.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Chẩn đoán thường gặp
            </h3>
            <div className="space-y-3">
              {statistics.commonDiagnoses.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{item.diagnosis}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {item.count} lần
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử khám bệnh</h2>
          <RecordTimeline records={records} loading={loading} />
        </div>

        {/* Empty State with CTA */}
        {!loading && records.length === 0 && (
          <div className="text-center py-12">
            <Link href="/patient/appointments/book">
              <Button size="lg">
                <Calendar className="mr-2 h-5 w-5" />
                Đặt lịch khám ngay
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
