'use client';

import React, { useState } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Shield,
  Star
} from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  type: 'license' | 'specialization' | 'training' | 'award';
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'pending_renewal';
  certificate_number: string;
  description?: string;
  file_url?: string;
}

interface Training {
  id: string;
  course_name: string;
  provider: string;
  start_date: string;
  end_date: string;
  hours: number;
  status: 'completed' | 'in_progress' | 'registered';
  certificate_earned: boolean;
  credits: number;
}

// Mock data
const mockCertificates: Certificate[] = [
  {
    id: 'CERT-001',
    name: 'Giấy phép hành nghề bác sĩ',
    type: 'license',
    issuer: 'Bộ Y tế Việt Nam',
    issue_date: '2019-06-15',
    expiry_date: '2024-06-15',
    status: 'pending_renewal',
    certificate_number: 'VN-TM-2019-001',
    description: 'Giấy phép hành nghề bác sĩ chuyên khoa Tim mạch'
  },
  {
    id: 'CERT-002',
    name: 'Chứng chỉ Siêu âm tim',
    type: 'specialization',
    issuer: 'Hội Tim mạch Việt Nam',
    issue_date: '2020-03-20',
    expiry_date: '2025-03-20',
    status: 'active',
    certificate_number: 'ECHO-2020-156',
    description: 'Chứng chỉ chuyên môn về siêu âm tim và mạch máu'
  },
  {
    id: 'CERT-003',
    name: 'Chứng chỉ CPR & AED',
    type: 'training',
    issuer: 'American Heart Association',
    issue_date: '2023-01-15',
    expiry_date: '2025-01-15',
    status: 'active',
    certificate_number: 'AHA-CPR-2023-789',
    description: 'Chứng chỉ hồi sức tim phổi và sử dụng máy khử rung tim'
  },
  {
    id: 'CERT-004',
    name: 'Giải thưởng Bác sĩ xuất sắc',
    type: 'award',
    issuer: 'Bệnh viện Đa khoa Trung ương',
    issue_date: '2023-12-20',
    status: 'active',
    certificate_number: 'AWARD-2023-001',
    description: 'Giải thưởng công nhận thành tích xuất sắc trong công tác khám chữa bệnh'
  }
];

const mockTrainings: Training[] = [
  {
    id: 'TRAIN-001',
    course_name: 'Cập nhật điều trị tim mạch 2024',
    provider: 'Đại học Y Dược TP.HCM',
    start_date: '2024-02-01',
    end_date: '2024-02-03',
    hours: 24,
    status: 'registered',
    certificate_earned: false,
    credits: 12
  },
  {
    id: 'TRAIN-002',
    course_name: 'Kỹ thuật can thiệp tim mạch',
    provider: 'Bệnh viện Tim Hà Nội',
    start_date: '2023-11-15',
    end_date: '2023-11-17',
    hours: 20,
    status: 'completed',
    certificate_earned: true,
    credits: 10
  },
  {
    id: 'TRAIN-003',
    course_name: 'Quản lý bệnh nhân đái tháo đường',
    provider: 'Hội Nội tiết Việt Nam',
    start_date: '2024-01-10',
    end_date: '2024-01-12',
    hours: 16,
    status: 'in_progress',
    certificate_earned: false,
    credits: 8
  }
];

export default function DoctorCertificatesPage() {
  const [selectedTab, setSelectedTab] = useState('certificates');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCertificates = mockCertificates.filter(cert =>
    cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrainings = mockTrainings.filter(training =>
    training.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    training.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending_renewal': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'registered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Còn hiệu lực';
      case 'expired': return 'Hết hạn';
      case 'pending_renewal': return 'Cần gia hạn';
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang học';
      case 'registered': return 'Đã đăng ký';
      default: return 'Không xác định';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'license': return <Shield className="h-5 w-5" />;
      case 'specialization': return <Star className="h-5 w-5" />;
      case 'training': return <BookOpen className="h-5 w-5" />;
      case 'award': return <Award className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'license': return 'Giấy phép';
      case 'specialization': return 'Chuyên môn';
      case 'training': return 'Đào tạo';
      case 'award': return 'Giải thưởng';
      default: return 'Khác';
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0; // Expiring within 90 days
  };

  const totalCredits = mockTrainings
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.credits, 0);

  return (
    <RoleBasedLayout title="Chứng chỉ" activePage="certificates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chứng chỉ & Đào tạo</h2>
            <p className="text-gray-600">Quản lý chứng chỉ hành nghề và khóa đào tạo liên tục</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm chứng chỉ..."
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
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng chứng chỉ</p>
                  <p className="text-2xl font-bold text-gray-900">{mockCertificates.length}</p>
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
                  <p className="text-sm text-gray-500">Còn hiệu lực</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockCertificates.filter(c => c.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cần gia hạn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockCertificates.filter(c => c.status === 'pending_renewal' || isExpiringSoon(c.expiry_date)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tín chỉ CME</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="certificates">Chứng chỉ</TabsTrigger>
              <TabsTrigger value="training">Đào tạo liên tục</TabsTrigger>
            </TabsList>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {selectedTab === 'certificates' ? 'Thêm chứng chỉ' : 'Đăng ký khóa học'}
            </Button>
          </div>

          <TabsContent value="certificates" className="mt-6">
            <div className="space-y-4">
              {filteredCertificates.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          {getTypeIcon(certificate.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{certificate.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeText(certificate.type)}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(certificate.status)}`}>
                              {getStatusText(certificate.status)}
                            </Badge>
                            {isExpiringSoon(certificate.expiry_date) && (
                              <Badge className="text-xs bg-orange-100 text-orange-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Sắp hết hạn
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{certificate.issuer}</p>
                          <p className="text-sm text-gray-500 mb-2">Số: {certificate.certificate_number}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Cấp: {new Date(certificate.issue_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {certificate.expiry_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Hết hạn: {new Date(certificate.expiry_date).toLocaleDateString('vi-VN')}</span>
                              </div>
                            )}
                          </div>
                          
                          {certificate.description && (
                            <p className="text-sm text-gray-600 mt-2">{certificate.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCertificates.length === 0 && (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có chứng chỉ
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy chứng chỉ phù hợp' : 'Chưa có chứng chỉ nào được thêm'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="training" className="mt-6">
            <div className="space-y-4">
              {filteredTrainings.map((training) => (
                <Card key={training.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{training.course_name}</h3>
                            <Badge className={`text-xs ${getStatusColor(training.status)}`}>
                              {getStatusText(training.status)}
                            </Badge>
                            {training.certificate_earned && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                <Award className="h-3 w-3 mr-1" />
                                Có chứng chỉ
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{training.provider}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(training.start_date).toLocaleDateString('vi-VN')} - {new Date(training.end_date).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{training.hours} giờ</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Tín chỉ CME: {training.credits}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {training.certificate_earned && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTrainings.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không có khóa đào tạo
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Không tìm thấy khóa đào tạo phù hợp' : 'Chưa có khóa đào tạo nào được đăng ký'}
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
