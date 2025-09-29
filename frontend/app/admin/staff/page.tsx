'use client';

import React, { useState, useEffect } from 'react';
import { AdminPageWrapper } from '../page-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Briefcase,
  Award,
  Star,
  Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: 'nurse' | 'receptionist' | 'technician' | 'pharmacist' | 'security';
  department: string;
  position: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  shift: 'morning' | 'afternoon' | 'night' | 'rotating';
  experience_years: number;
  certifications: string[];
  supervisor?: string;
  address: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  performance_rating: number;
  last_evaluation: string;
}

interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  byRole: {
    nurse: number;
    receptionist: number;
    technician: number;
    pharmacist: number;
    security: number;
  };
  byShift: {
    morning: number;
    afternoon: number;
    night: number;
    rotating: number;
  };
  averageExperience: number;
  averageRating: number;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data
  const mockStaff: Staff[] = [
    {
      id: '1',
      staff_id: 'NUR-2024-001',
      full_name: 'Nguyễn Thị Lan',
      email: 'lan.nurse@hospital.com',
      phone_number: '0123456789',
      role: 'nurse',
      department: 'Nội khoa',
      position: 'Y tá trưởng',
      hire_date: '2020-03-15',
      salary: 15000000,
      status: 'active',
      shift: 'morning',
      experience_years: 8,
      certifications: ['Chăm sóc cấp cứu', 'Điều dưỡng nội khoa'],
      supervisor: 'BS. Trần Văn A',
      address: 'Hà Nội, Việt Nam',
      emergency_contact: {
        name: 'Nguyễn Văn B',
        phone: '0987654321',
        relationship: 'Chồng'
      },
      performance_rating: 4.8,
      last_evaluation: '2024-01-15'
    },
    {
      id: '2',
      staff_id: 'REC-2024-001',
      full_name: 'Trần Thị Mai',
      email: 'mai.reception@hospital.com',
      phone_number: '0987654321',
      role: 'receptionist',
      department: 'Tiếp đón',
      position: 'Lễ tân chính',
      hire_date: '2021-06-01',
      salary: 12000000,
      status: 'active',
      shift: 'morning',
      experience_years: 3,
      certifications: ['Dịch vụ khách hàng', 'Tin học văn phòng'],
      address: 'TP.HCM, Việt Nam',
      emergency_contact: {
        name: 'Trần Văn C',
        phone: '0369852147',
        relationship: 'Anh trai'
      },
      performance_rating: 4.5,
      last_evaluation: '2024-01-10'
    },
    {
      id: '3',
      staff_id: 'TEC-2024-001',
      full_name: 'Lê Văn Đức',
      email: 'duc.tech@hospital.com',
      phone_number: '0369852147',
      role: 'technician',
      department: 'Xét nghiệm',
      position: 'Kỹ thuật viên xét nghiệm',
      hire_date: '2019-09-20',
      salary: 18000000,
      status: 'active',
      shift: 'rotating',
      experience_years: 6,
      certifications: ['Xét nghiệm máu', 'Xét nghiệm vi sinh', 'An toàn phòng thí nghiệm'],
      supervisor: 'BS. Phạm Thị D',
      address: 'Đà Nẵng, Việt Nam',
      emergency_contact: {
        name: 'Lê Thị E',
        phone: '0147258369',
        relationship: 'Vợ'
      },
      performance_rating: 4.7,
      last_evaluation: '2024-01-05'
    },
    {
      id: '4',
      staff_id: 'PHA-2024-001',
      full_name: 'Phạm Thị Hoa',
      email: 'hoa.pharmacy@hospital.com',
      phone_number: '0147258369',
      role: 'pharmacist',
      department: 'Dược',
      position: 'Dược sĩ',
      hire_date: '2018-12-10',
      salary: 20000000,
      status: 'on_leave',
      shift: 'afternoon',
      experience_years: 10,
      certifications: ['Dược lâm sàng', 'Quản lý thuốc', 'Tư vấn dược'],
      supervisor: 'Trưởng khoa Dược',
      address: 'Hải Phòng, Việt Nam',
      emergency_contact: {
        name: 'Phạm Văn F',
        phone: '0258147963',
        relationship: 'Chồng'
      },
      performance_rating: 4.9,
      last_evaluation: '2023-12-20'
    },
    {
      id: '5',
      staff_id: 'SEC-2024-001',
      full_name: 'Hoàng Văn Nam',
      email: 'nam.security@hospital.com',
      phone_number: '0258147963',
      role: 'security',
      department: 'An ninh',
      position: 'Bảo vệ',
      hire_date: '2022-01-15',
      salary: 10000000,
      status: 'active',
      shift: 'night',
      experience_years: 2,
      certifications: ['An ninh bệnh viện', 'Sơ cấp cứu'],
      address: 'Cần Thơ, Việt Nam',
      emergency_contact: {
        name: 'Hoàng Thị G',
        phone: '0321654987',
        relationship: 'Mẹ'
      },
      performance_rating: 4.2,
      last_evaluation: '2024-01-08'
    }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchTerm, roleFilter, statusFilter, departmentFilter]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStaff(mockStaff);
      calculateStats(mockStaff);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (staffList: Staff[]) => {
    const stats: StaffStats = {
      total: staffList.length,
      active: staffList.filter(s => s.status === 'active').length,
      inactive: staffList.filter(s => s.status === 'inactive').length,
      onLeave: staffList.filter(s => s.status === 'on_leave').length,
      byRole: {
        nurse: staffList.filter(s => s.role === 'nurse').length,
        receptionist: staffList.filter(s => s.role === 'receptionist').length,
        technician: staffList.filter(s => s.role === 'technician').length,
        pharmacist: staffList.filter(s => s.role === 'pharmacist').length,
        security: staffList.filter(s => s.role === 'security').length,
      },
      byShift: {
        morning: staffList.filter(s => s.shift === 'morning').length,
        afternoon: staffList.filter(s => s.shift === 'afternoon').length,
        night: staffList.filter(s => s.shift === 'night').length,
        rotating: staffList.filter(s => s.shift === 'rotating').length,
      },
      averageExperience: staffList.length > 0 ? staffList.reduce((sum, s) => sum + s.experience_years, 0) / staffList.length : 0,
      averageRating: staffList.length > 0 ? staffList.reduce((sum, s) => sum + s.performance_rating, 0) / staffList.length : 0,
    };
    setStats(stats);
  };

  const filterStaff = () => {
    let filtered = staff;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone_number.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(member => member.department === departmentFilter);
    }

    setFilteredStaff(filtered);
  };

  const getRoleBadge = (role: Staff['role']) => {
    const variants = {
      nurse: 'bg-blue-100 text-blue-800',
      receptionist: 'bg-green-100 text-green-800',
      technician: 'bg-purple-100 text-purple-800',
      pharmacist: 'bg-orange-100 text-orange-800',
      security: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      nurse: 'Y tá',
      receptionist: 'Lễ tân',
      technician: 'Kỹ thuật viên',
      pharmacist: 'Dược sĩ',
      security: 'Bảo vệ'
    };

    return (
      <Badge className={variants[role]}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (status: Staff['status']) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      active: 'Đang làm việc',
      inactive: 'Không hoạt động',
      on_leave: 'Nghỉ phép',
      terminated: 'Đã nghỉ việc'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusIcon = (status: Staff['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'on_leave':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'terminated':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <AdminPageWrapper
      title="Staff Management"
      activePage="staff"
      subtitle="Manage hospital staff and employees"
      headerActions={
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Staff Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Staff</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">On Leave</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Experience</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.averageExperience.toFixed(1)} years</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.averageRating.toFixed(1)}/5</p>
                  </div>
                  <Star className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên, email, hoặc mã nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="nurse">Y tá</SelectItem>
                  <SelectItem value="receptionist">Lễ tân</SelectItem>
                  <SelectItem value="technician">Kỹ thuật viên</SelectItem>
                  <SelectItem value="pharmacist">Dược sĩ</SelectItem>
                  <SelectItem value="security">Bảo vệ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang làm việc</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="on_leave">Nghỉ phép</SelectItem>
                  <SelectItem value="terminated">Đã nghỉ việc</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchStaff} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Members ({filteredStaff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStaff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {member.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{member.full_name}</h4>
                          {getStatusIcon(member.status)}
                          {getRoleBadge(member.role)}
                          {getStatusBadge(member.status)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            <span>{member.staff_id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone_number}</span>
                          </div>
                          <span>{member.department} - {member.position}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>{member.experience_years} years experience</span>
                          <div className="flex items-center gap-1">
                            {renderStars(member.performance_rating)}
                            <span>({member.performance_rating})</span>
                          </div>
                          <span>Salary: {formatCurrency(member.salary)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Clock className="h-4 w-4 mr-2" />
                            Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredStaff.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No staff members found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Staff Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.byRole.nurse}</p>
                  <p className="text-sm text-gray-600">Y tá</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.byRole.receptionist}</p>
                  <p className="text-sm text-gray-600">Lễ tân</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.byRole.technician}</p>
                  <p className="text-sm text-gray-600">Kỹ thuật viên</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.byRole.pharmacist}</p>
                  <p className="text-sm text-gray-600">Dược sĩ</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.byRole.security}</p>
                  <p className="text-sm text-gray-600">Bảo vệ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageWrapper>
  );
}
