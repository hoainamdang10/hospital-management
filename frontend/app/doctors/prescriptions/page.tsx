'use client';

import React, { useState } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pill,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  Clock,
  User,
  Stethoscope,
  TestTube,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Send
} from 'lucide-react';

interface Prescription {
  id: string;
  patient_name: string;
  patient_id: string;
  date_prescribed: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  doctor_name: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabTest {
  id: string;
  patient_name: string;
  patient_id: string;
  test_type: string;
  date_ordered: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent' | 'stat';
  notes?: string;
}

// Mock data
const mockPrescriptions: Prescription[] = [
  {
    id: 'PRES-001',
    patient_name: 'Nguyễn Văn An',
    patient_id: 'PAT-202401-001',
    date_prescribed: '2024-01-27',
    medications: [
      {
        name: 'Amlodipine 5mg',
        dosage: '1 viên',
        frequency: '1 lần/ngày',
        duration: '30 ngày',
        instructions: 'Uống sau ăn sáng'
      },
      {
        name: 'Metformin 500mg',
        dosage: '1 viên',
        frequency: '2 lần/ngày',
        duration: '30 ngày',
        instructions: 'Uống sau ăn sáng và tối'
      }
    ],
    diagnosis: 'Cao huyết áp, Tiểu đường type 2',
    notes: 'Tái khám sau 1 tháng',
    status: 'active',
    doctor_name: 'BS. Nguyễn Văn Bác sĩ'
  },
  {
    id: 'PRES-002',
    patient_name: 'Trần Thị Bình',
    patient_id: 'PAT-202401-002',
    date_prescribed: '2024-01-26',
    medications: [
      {
        name: 'Salbutamol inhaler',
        dosage: '2 nhát',
        frequency: 'Khi cần',
        duration: '1 tháng',
        instructions: 'Sử dụng khi khó thở'
      }
    ],
    diagnosis: 'Hen suyễn',
    status: 'active',
    doctor_name: 'BS. Nguyễn Văn Bác sĩ'
  }
];

const mockLabTests: LabTest[] = [
  {
    id: 'LAB-001',
    patient_name: 'Nguyễn Văn An',
    patient_id: 'PAT-202401-001',
    test_type: 'Xét nghiệm đường huyết',
    date_ordered: '2024-01-27',
    status: 'pending',
    priority: 'normal',
    notes: 'Xét nghiệm lúc đói'
  },
  {
    id: 'LAB-002',
    patient_name: 'Lê Văn Cường',
    patient_id: 'PAT-202401-003',
    test_type: 'Điện tim',
    date_ordered: '2024-01-27',
    status: 'in_progress',
    priority: 'urgent',
    notes: 'Nghi ngờ rối loạn nhịp tim'
  },
  {
    id: 'LAB-003',
    patient_name: 'Trần Thị Bình',
    patient_id: 'PAT-202401-002',
    test_type: 'X-quang phổi',
    date_ordered: '2024-01-26',
    status: 'completed',
    priority: 'normal'
  }
];

export default function DoctorPrescriptionsPage() {
  const [selectedTab, setSelectedTab] = useState('prescriptions');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPrescriptionForm, setShowNewPrescriptionForm] = useState(false);

  const filteredPrescriptions = mockPrescriptions.filter(prescription =>
    prescription.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLabTests = mockLabTests.filter(test =>
    test.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.test_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang sử dụng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'pending': return 'Chờ thực hiện';
      case 'in_progress': return 'Đang thực hiện';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'bg-gray-100 text-gray-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'stat': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'normal': return 'Bình thường';
      case 'urgent': return 'Khẩn cấp';
      case 'stat': return 'Cấp cứu';
      default: return 'Không xác định';
    }
  };

  return (
    <RoleBasedLayout title="Kê đơn thuốc" activePage="prescriptions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kê đơn thuốc</h2>
            <p className="text-gray-600">Quản lý đơn thuốc và chỉ định xét nghiệm</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Pill className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đơn thuốc hôm nay</p>
                  <p className="text-2xl font-bold text-gray-900">{mockPrescriptions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Đang sử dụng</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockPrescriptions.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TestTube className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Xét nghiệm hôm nay</p>
                  <p className="text-2xl font-bold text-gray-900">{mockLabTests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Khẩn cấp</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockLabTests.filter(t => t.priority === 'urgent' || t.priority === 'stat').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="prescriptions">Đơn thuốc</TabsTrigger>
              <TabsTrigger value="lab-tests">Xét nghiệm</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setShowNewPrescriptionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {selectedTab === 'prescriptions' ? 'Kê đơn mới' : 'Chỉ định xét nghiệm'}
            </Button>
          </div>

          <TabsContent value="prescriptions" className="mt-6">
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${prescription.patient_name}`}
                            alt={prescription.patient_name}
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {prescription.patient_name ? prescription.patient_name.split(' ').map(n => n[0]).join('') : 'PT'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">{prescription.patient_name}</h3>
                          <p className="text-sm text-gray-500">{prescription.patient_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusColor(prescription.status)}`}>
                              {getStatusText(prescription.status)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(prescription.date_prescribed).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Chẩn đoán:</h4>
                        <p className="text-sm text-gray-700">{prescription.diagnosis}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Thuốc kê đơn:</h4>
                        <div className="space-y-2">
                          {prescription.medications.map((medication, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{medication.name}</span>
                                <span className="text-sm text-gray-500">{medication.duration}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span>{medication.dosage} • {medication.frequency}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {medication.instructions}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Ghi chú:</h4>
                          <p className="text-sm text-gray-700">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-12">
                  <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có đơn thuốc
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy đơn thuốc phù hợp' : 'Chưa có đơn thuốc nào được kê'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lab-tests" className="mt-6">
            <div className="space-y-4">
              {filteredLabTests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <TestTube className="h-6 w-6 text-purple-600" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{test.test_type}</h3>
                            <Badge className={`text-xs ${getPriorityColor(test.priority)}`}>
                              {getPriorityText(test.priority)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Bệnh nhân: {test.patient_name} ({test.patient_id})
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(test.date_ordered).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                              {getStatusText(test.status)}
                            </Badge>
                          </div>
                          {test.notes && (
                            <p className="text-sm text-gray-600 mt-2">{test.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {test.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLabTests.length === 0 && (
                <div className="text-center py-12">
                  <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có xét nghiệm
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy xét nghiệm phù hợp' : 'Chưa có xét nghiệm nào được chỉ định'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedLayout>
  );
}
