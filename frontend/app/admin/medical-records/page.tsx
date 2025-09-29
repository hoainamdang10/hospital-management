'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalRecordsTable } from '@/components/features/medical-records/MedicalRecordsTable';
import { medicalRecordsApi, MedicalRecord } from '@/lib/api/medical-records';
import {
  FileText,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface MedicalRecordsStats {
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  recentRecords: number;
  recordsByMonth: { month: string; count: number }[];
  topDiagnoses: { diagnosis: string; count: number }[];
}

function MedicalRecordsPageContent() {
  const [stats, setStats] = useState<MedicalRecordsStats>({
    totalRecords: 0,
    activeRecords: 0,
    archivedRecords: 0,
    recentRecords: 0,
    recordsByMonth: [],
    topDiagnoses: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await medicalRecordsApi.getAllMedicalRecords();
      if (response.success && response.data) {
        const records = response.data;

        // Calculate statistics
        const totalRecords = records.length;
        const activeRecords = records.filter(r => r.status === 'active').length;
        const archivedRecords = records.filter(r => r.status === 'archived').length;

        // Recent records (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentRecords = records.filter(r =>
          new Date(r.created_at) >= thirtyDaysAgo
        ).length;

        // Records by month (last 6 months)
        const recordsByMonth = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          const count = records.filter(r => {
            const recordDate = new Date(r.created_at);
            return recordDate.getMonth() === date.getMonth() &&
                   recordDate.getFullYear() === date.getFullYear();
          }).length;
          recordsByMonth.push({ month: monthName, count });
        }

        // Top diagnoses
        const diagnosisCount: { [key: string]: number } = {};
        records.forEach(r => {
          if (r.diagnosis && r.diagnosis.trim()) {
            const diagnosis = r.diagnosis.trim();
            diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
          }
        });

        const topDiagnoses = Object.entries(diagnosisCount)
          .map(([diagnosis, count]) => ({ diagnosis, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalRecords,
          activeRecords,
          archivedRecords,
          recentRecords,
          recordsByMonth,
          topDiagnoses
        });
      }
    } catch (error) {
      console.error('Error fetching medical records stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    // TODO: Open edit modal
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this medical record?')) {
      try {
        const response = await medicalRecordsApi.deleteMedicalRecord(recordId);
        if (response.success) {
          fetchStats(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const handleCreateRecord = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-2">
            Manage patient medical records, lab results, and vital signs
          </p>
        </div>
        <Button onClick={handleCreateRecord} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Record
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Records</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeRecords}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (30 days)</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recentRecords}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archivedRecords}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Activity className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Records Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Records Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recordsByMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max((item.count / Math.max(...stats.recordsByMonth.map(r => r.count))) * 100, 5)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Top Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topDiagnoses.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate" title={item.diagnosis}>
                      {item.diagnosis}
                    </p>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
              {stats.topDiagnoses.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No diagnosis data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records Table */}
      <MedicalRecordsTable
        onViewRecord={handleViewRecord}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onCreateRecord={handleCreateRecord}
      />
    </div>
  );
}

export default function MedicalRecordsPage() {
  return (
    <AdminPageWrapper
      title="Medical Records"
      activePage="medical-records"
      subtitle="Manage patient medical records, lab results, and vital signs"
    >
      <MedicalRecordsPageContent />
    </AdminPageWrapper>
  );
}
