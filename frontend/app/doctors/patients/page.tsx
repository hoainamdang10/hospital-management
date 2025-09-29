'use client';

import React, { useState } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Users,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  Heart,
  Activity,
  Plus,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';

// Import enhanced components
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard"
import { ChartCard, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { StatCardSkeleton, ChartCardSkeleton, PulseWrapper } from "@/components/dashboard/SkeletonLoaders"
import { useDashboardLoading } from "@/hooks/useProgressiveLoading"

interface Patient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phone_number: string;
  email: string;
  address: string;
  last_visit: string;
  next_appointment: string;
  status: 'active' | 'inactive' | 'critical';
  medical_conditions: string[];
  avatar_url?: string;
}

// Mock data - sẽ được thay thế bằng API call thực tế
const mockPatients: Patient[] = [
  {
    patient_id: 'PAT-202401-001',
    full_name: 'Nguyễn Văn Minh',
    age: 45,
    gender: 'Male',
    phone_number: '0901234567',
    email: 'nguyenvanminh@email.com',
    address: '123 Đường Lê Lợi, Q1, TP.HCM',
    last_visit: '2024-01-15',
    next_appointment: '2024-02-15',
    status: 'active',
    medical_conditions: ['Cao huyết áp', 'Tiểu đường type 2']
  },
  {
    patient_id: 'PAT-202401-002',
    full_name: 'Trần Thị Lan',
    age: 32,
    gender: 'Female',
    phone_number: '0912345678',
    email: 'tranthilan@email.com',
    address: '456 Đường Nguyễn Huệ, Q1, TP.HCM',
    last_visit: '2024-01-20',
    next_appointment: '2024-02-10',
    status: 'active',
    medical_conditions: ['Hen suyễn']
  },
  {
    patient_id: 'PAT-202401-003',
    full_name: 'Lê Văn Hùng',
    age: 58,
    gender: 'Male',
    phone_number: '0923456789',
    email: 'levanhung@email.com',
    address: '789 Đường Pasteur, Q3, TP.HCM',
    last_visit: '2024-01-25',
    next_appointment: '2024-02-05',
    status: 'critical',
    medical_conditions: ['Bệnh tim mạch', 'Suy tim']
  }
];

export default function DoctorPatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Progressive loading
  const {
    isStatsLoading,
    isChartsLoading,
    isActivitiesLoading,
    progress
  } = useDashboardLoading();

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || patient.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang điều trị';
      case 'inactive': return 'Không hoạt động';
      case 'critical': return 'Nguy hiểm';
      default: return 'Không xác định';
    }
  };

  return (
    <RoleBasedLayout title="Quản lý bệnh nhân" activePage="patients">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bệnh nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm bệnh nhân mới
          </Button>
        </div>

        {/* Enhanced Patient Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Tổng bệnh nhân"
              value={mockPatients.length}
              change={8}
              changeLabel="bệnh nhân mới tháng này"
              icon={<Users className="h-6 w-6" />}
              description="Đang theo dõi"
              color="blue"
              variant="gradient"
              showTrend={true}
              onViewDetails={() => console.log('View all patients')}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Đang điều trị"
              value={mockPatients.filter(p => p.status === 'active').length}
              change={3}
              changeLabel="ca mới tuần này"
              icon={<Activity className="h-6 w-6" />}
              description="Cần theo dõi thường xuyên"
              color="green"
              variant="gradient"
              showTrend={true}
              status="success"
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Tình trạng nguy hiểm"
              value={mockPatients.filter(p => p.status === 'critical').length}
              change={-1}
              changeLabel="giảm từ tuần trước"
              icon={<AlertCircle className="h-6 w-6" />}
              description="Cần chăm sóc đặc biệt"
              color="red"
              variant="gradient"
              showTrend={true}
              status="critical"
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Lịch hẹn hôm nay"
              value="12"
              change={2}
              changeLabel="so với hôm qua"
              icon={<Calendar className="h-6 w-6" />}
              description="Cuộc hẹn đã lên lịch"
              color="purple"
              variant="gradient"
              showTrend={true}
            />
          </PulseWrapper>
        </div>

        {/* Enhanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Patient Demographics Chart */}
          <PulseWrapper isLoading={isChartsLoading} fallback={<ChartCardSkeleton />}>
            <ChartCard
              title="Phân tích bệnh nhân"
              subtitle="Theo độ tuổi và giới tính"
              chartType="bar"
              showExport={false}
              onRefresh={() => console.log('Refreshing patient analytics...')}
              trend={{
                value: 12.5,
                label: 'tăng',
                direction: 'up'
              }}
            >
              <ProgressChart data={[
                { label: 'Nam (18-40)', value: 35, color: 'blue', target: 100 },
                { label: 'Nam (40-60)', value: 28, color: 'green', target: 100 },
                { label: 'Nữ (18-40)', value: 42, color: 'purple', target: 100 },
                { label: 'Nữ (40-60)', value: 31, color: 'orange', target: 100 }
              ]} />
            </ChartCard>
          </PulseWrapper>

          {/* Recent Patient Activities */}
          <PulseWrapper isLoading={isActivitiesLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <ActivityTimeline
              activities={[
                {
                  id: '1',
                  type: 'appointment' as const,
                  title: 'Khám bệnh hoàn thành',
                  description: 'Nguyễn Văn Minh - Khám định kỳ tim mạch',
                  timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                  user: { name: 'BS. Nguyễn Văn An', role: 'Doctor', avatar: '' },
                  patient: { name: 'Nguyễn Văn Minh', id: 'PAT-001' },
                  status: 'completed' as const,
                  priority: 'medium' as const
                },
                {
                  id: '2',
                  type: 'admission' as const,
                  title: 'Nhập viện khẩn cấp',
                  description: 'Trần Thị Lan - Đau ngực cấp tính',
                  timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                  user: { name: 'BS. Nguyễn Văn An', role: 'Doctor', avatar: '' },
                  patient: { name: 'Trần Thị Lan', id: 'PAT-003' },
                  status: 'in-progress' as const,
                  priority: 'urgent' as const
                }
              ]}
              onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              showFilters={false}
              showSearch={false}
              groupByDate={false}
              maxItems={5}
            />
          </PulseWrapper>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all">Tất cả ({mockPatients.length})</TabsTrigger>
            <TabsTrigger value="active">
              Đang điều trị ({mockPatients.filter(p => p.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Nguy hiểm ({mockPatients.filter(p => p.status === 'critical').length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Không hoạt động ({mockPatients.filter(p => p.status === 'inactive').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <Card key={patient.patient_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={patient.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.full_name}`}
                            alt={patient.full_name}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {patient.full_name ? patient.full_name.split(' ').map(n => n[0]).join('') : 'PT'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.full_name}</h3>
                          <p className="text-sm text-gray-500">{patient.patient_id}</p>
                          <Badge className={`text-xs mt-1 ${getStatusColor(patient.status)}`}>
                            {getStatusText(patient.status)}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Tuổi:</span>
                        <span className="ml-1 font-medium">{patient.age}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Giới tính:</span>
                        <span className="ml-1 font-medium">
                          {patient.gender === 'Male' ? 'Nam' : 'Nữ'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{patient.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Khám cuối: {new Date(patient.last_visit).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-600">
                          Hẹn tiếp: {new Date(patient.next_appointment).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {patient.medical_conditions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tình trạng bệnh:</p>
                        <div className="flex flex-wrap gap-1">
                          {patient.medical_conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa
                      </Button>
                      <Button size="sm" className="flex-1">
                        <FileText className="h-4 w-4 mr-1" />
                        Hồ sơ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy bệnh nhân
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Chưa có bệnh nhân nào trong danh sách'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng bệnh nhân</p>
                  <p className="text-2xl font-bold text-gray-900">{mockPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đang điều trị</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockPatients.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nguy hiểm</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockPatients.filter(p => p.status === 'critical').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hẹn tuần này</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleBasedLayout>
  );
}
