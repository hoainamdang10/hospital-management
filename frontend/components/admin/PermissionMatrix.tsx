import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Key, 
  Search, 
  Filter, 
  Download, 
  Save, 
  RefreshCw,
  Users,
  Shield,
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
  is_system_role: boolean;
}

interface PermissionMatrixProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PermissionMatrix({ isOpen, onClose }: PermissionMatrixProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [matrixData, setMatrixData] = useState<Record<string, string[]>>({});

  const categories = [
    { id: 'all', name: 'Tất cả', icon: Shield },
    { id: 'user_management', name: 'Quản lý Người dùng', icon: Users },
    { id: 'department_management', name: 'Quản lý Khoa/Phòng', icon: Settings },
    { id: 'system_config', name: 'Cấu hình Hệ thống', icon: Settings },
    { id: 'security', name: 'Bảo mật', icon: Shield },
    { id: 'reports', name: 'Báo cáo', icon: Eye },
    { id: 'audit', name: 'Kiểm toán', icon: CheckCircle }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchMatrixData();
    }
  }, [isOpen]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions')
      ]);

      const [rolesData, permissionsData] = await Promise.all([
        rolesRes.json(),
        permissionsRes.json()
      ]);

      setRoles(rolesData.roles || []);
      setPermissions(permissionsData.permissions || []);

      // Initialize matrix data
      const matrix: Record<string, string[]> = {};
      rolesData.roles?.forEach((role: Role) => {
        matrix[role.id] = [...role.permissions];
      });
      setMatrixData(matrix);
    } catch (error) {
      console.error('Failed to fetch matrix data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    setMatrixData(prev => {
      const rolePermissions = prev[roleId] || [];
      const newPermissions = rolePermissions.includes(permissionId)
        ? rolePermissions.filter(id => id !== permissionId)
        : [...rolePermissions, permissionId];
      
      setHasChanges(true);
      return {
        ...prev,
        [roleId]: newPermissions
      };
    });
  };

  const saveChanges = async () => {
    try {
      const updates = Object.entries(matrixData).map(([roleId, permissions]) => ({
        roleId,
        permissions
      }));

      const response = await fetch('/api/admin/roles/bulk-update-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        setHasChanges(false);
        
        // Log audit event
        await fetch('/api/admin/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'permission_matrix_updated',
            resource_type: 'role_permissions',
            details: { updatedRoles: updates.length },
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  const exportMatrix = async () => {
    try {
      const response = await fetch('/api/admin/roles/export-permission-matrix');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `permission-matrix-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export matrix:', error);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = searchTerm === '' || 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const hasPermission = (roleId: string, permissionId: string) => {
    return matrixData[roleId]?.includes(permissionId) || false;
  };

  const getPermissionCount = (roleId: string) => {
    return matrixData[roleId]?.length || 0;
  };

  const getRolePermissionsByCategory = (roleId: string, category: string) => {
    const rolePermissions = matrixData[roleId] || [];
    const categoryPermissions = permissions.filter(p => p.category === category);
    return categoryPermissions.filter(p => rolePermissions.includes(p.id)).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Ma trận Quyền hạn
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportMatrix}>
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </Button>
              <Button variant="outline" size="sm" onClick={fetchMatrixData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
              <Button 
                size="sm" 
                onClick={saveChanges}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm quyền hạn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Changes Alert */}
          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Bạn có thay đổi chưa được lưu. Nhớ lưu lại trước khi đóng.
                </span>
              </div>
            </div>
          )}

          {/* Matrix Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Quyền hạn
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        <div className="space-y-1">
                          <div className="font-medium">{role.name}</div>
                          <Badge variant="outline" className="text-xs">
                            {getPermissionCount(role.id)} quyền
                          </Badge>
                          {role.is_system_role && (
                            <div className="text-xs text-red-600">Hệ thống</div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={roles.length + 1} className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-gray-600">{permission.description}</div>
                            <Badge variant="outline" className="text-xs">
                              {categories.find(c => c.id === permission.category)?.name}
                            </Badge>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="px-3 py-3 text-center">
                            <Checkbox
                              checked={hasPermission(role.id, permission.id)}
                              onCheckedChange={() => togglePermission(role.id, permission.id)}
                              disabled={role.is_system_role}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thống kê Quyền hạn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
                  <div className="text-sm text-gray-500">Tổng vai trò</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{permissions.length}</div>
                  <div className="text-sm text-gray-500">Tổng quyền hạn</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {roles.filter(r => !r.is_system_role).length}
                  </div>
                  <div className="text-sm text-gray-500">Vai trò tùy chỉnh</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {categories.length - 1}
                  </div>
                  <div className="text-sm text-gray-500">Danh mục quyền</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phân bố Quyền hạn theo Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.filter(c => c.id !== 'all').map((category) => {
                  const categoryPermissions = permissions.filter(p => p.category === category.id);
                  const Icon = category.icon;
                  
                  return (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {categoryPermissions.length} quyền
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        {roles.slice(0, 4).map((role) => (
                          <div key={role.id} className="text-center">
                            <div className="text-sm font-medium">
                              {getRolePermissionsByCategory(role.id, category.id)}
                            </div>
                            <div className="text-xs text-gray-500">{role.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
