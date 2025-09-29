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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldX,
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
  RefreshCw
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist';
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profile_picture?: string;
  address?: string;
  date_of_birth?: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  byRole: {
    admin: number;
    doctor: number;
    patient: number;
    nurse: number;
    receptionist: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data - trong thực tế sẽ fetch từ API
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@hospital.com',
      full_name: 'Nguyễn Văn Admin',
      role: 'admin',
      phone_number: '0123456789',
      is_active: true,
      is_verified: true,
      last_login: '2024-01-15T10:30:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      address: 'Hà Nội, Việt Nam'
    },
    {
      id: '2',
      email: 'doctor@hospital.com',
      full_name: 'Trần Thị Bác Sĩ',
      role: 'doctor',
      phone_number: '0987654321',
      is_active: true,
      is_verified: true,
      last_login: '2024-01-15T09:15:00Z',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-15T09:15:00Z',
      address: 'TP.HCM, Việt Nam',
      date_of_birth: '1985-05-15'
    },
    {
      id: '3',
      email: 'patient@hospital.com',
      full_name: 'Lê Văn Bệnh Nhân',
      role: 'patient',
      phone_number: '0369852147',
      is_active: true,
      is_verified: false,
      last_login: '2024-01-14T16:45:00Z',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-14T16:45:00Z',
      address: 'Đà Nẵng, Việt Nam',
      date_of_birth: '1990-12-25'
    },
    {
      id: '4',
      email: 'nurse@hospital.com',
      full_name: 'Phạm Thị Y Tá',
      role: 'nurse',
      phone_number: '0147258369',
      is_active: false,
      is_verified: true,
      last_login: '2024-01-10T14:20:00Z',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-10T14:20:00Z',
      address: 'Hải Phòng, Việt Nam'
    },
    {
      id: '5',
      email: 'receptionist@hospital.com',
      full_name: 'Hoàng Văn Lễ Tân',
      role: 'receptionist',
      phone_number: '0258147963',
      is_active: true,
      is_verified: true,
      last_login: '2024-01-15T08:00:00Z',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-15T08:00:00Z',
      address: 'Cần Thơ, Việt Nam'
    }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(mockUsers);
      calculateStats(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    const stats: UserStats = {
      total: userList.length,
      active: userList.filter(u => u.is_active).length,
      inactive: userList.filter(u => !u.is_active).length,
      verified: userList.filter(u => u.is_verified).length,
      unverified: userList.filter(u => !u.is_verified).length,
      byRole: {
        admin: userList.filter(u => u.role === 'admin').length,
        doctor: userList.filter(u => u.role === 'doctor').length,
        patient: userList.filter(u => u.role === 'patient').length,
        nurse: userList.filter(u => u.role === 'nurse').length,
        receptionist: userList.filter(u => u.role === 'receptionist').length,
      }
    };
    setStats(stats);
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      } else if (statusFilter === 'verified') {
        filtered = filtered.filter(user => user.is_verified);
      } else if (statusFilter === 'unverified') {
        filtered = filtered.filter(user => !user.is_verified);
      }
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadge = (role: User['role']) => {
    const variants = {
      admin: 'bg-red-100 text-red-800',
      doctor: 'bg-blue-100 text-blue-800',
      patient: 'bg-green-100 text-green-800',
      nurse: 'bg-purple-100 text-purple-800',
      receptionist: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      admin: 'Admin',
      doctor: 'Bác sĩ',
      patient: 'Bệnh nhân',
      nurse: 'Y tá',
      receptionist: 'Lễ tân'
    };

    return (
      <Badge className={variants[role]}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusIcon = (user: User) => {
    if (!user.is_active) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (!user.is_verified) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      // Simulate API call
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, is_active: !user.is_active } : user
      );
      setUsers(updatedUsers);
      calculateStats(updatedUsers);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: User['role']) => {
    try {
      // Simulate API call
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      calculateStats(updatedUsers);
    } catch (error) {
      console.error('Failed to change user role:', error);
    }
  };

  return (
    <AdminPageWrapper
      title="User Management"
      activePage="users"
      subtitle="Manage system users and their roles"
      headerActions={
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      }
    >
      <div className="space-y-6">
        {/* User Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
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
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unverified</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.unverified}</p>
                  </div>
                  <ShieldX className="h-8 w-8 text-yellow-500" />
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
                    placeholder="Tìm kiếm theo tên, email, hoặc số điện thoại..."
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
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Bác sĩ</SelectItem>
                  <SelectItem value="patient">Bệnh nhân</SelectItem>
                  <SelectItem value="nurse">Y tá</SelectItem>
                  <SelectItem value="receptionist">Lễ tân</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="verified">Đã xác thực</SelectItem>
                  <SelectItem value="unverified">Chưa xác thực</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={fetchUsers} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{user.full_name}</h4>
                          {getStatusIcon(user)}
                          {getRoleBadge(user.role)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone_number}</span>
                            </div>
                          )}
                          {user.last_login && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Last login: {formatDate(user.last_login)}</span>
                            </div>
                          )}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                            {user.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleChangeUserRole(user.id, user.role === 'admin' ? 'doctor' : 'admin')}
                            disabled={user.role === 'admin'}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found matching your criteria</p>
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
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.byRole.admin}</p>
                  <p className="text-sm text-gray-600">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.byRole.doctor}</p>
                  <p className="text-sm text-gray-600">Doctors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.byRole.patient}</p>
                  <p className="text-sm text-gray-600">Patients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.byRole.nurse}</p>
                  <p className="text-sm text-gray-600">Nurses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.byRole.receptionist}</p>
                  <p className="text-sm text-gray-600">Receptionists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageWrapper>
  );
}
