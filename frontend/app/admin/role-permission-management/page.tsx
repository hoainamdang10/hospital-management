import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  Lock,
  Unlock,
  Eye,
  Settings,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Save,
  Copy
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  category: 'user_management' | 'department_management' | 'system_config' | 'security' | 'reports' | 'audit';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  user_count: number;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

const PERMISSION_CATEGORIES = [
  { id: 'user_management', name: 'Quản lý Người dùng', icon: Users },
  { id: 'department_management', name: 'Quản lý Khoa/Phòng', icon: Settings },
  { id: 'system_config', name: 'Cấu hình Hệ thống', icon: Settings },
  { id: 'security', name: 'Bảo mật', icon: Shield },
  { id: 'reports', name: 'Báo cáo', icon: Eye },
  { id: 'audit', name: 'Kiểm toán', icon: CheckCircle }
];

export default function RolePermissionManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('roles');
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
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
    } catch (error) {
      console.error('Failed to fetch roles and permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRolesAndPermissions();
        setIsCreateRoleModalOpen(false);
        resetForm();
        
        // Log audit event
        await logAuditEvent('role_created', { roleName: formData.name });
      }
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRolesAndPermissions();
        setIsEditRoleModalOpen(false);
        resetForm();
        
        // Log audit event
        await logAuditEvent('role_updated', { 
          roleId: selectedRole.id, 
          roleName: formData.name 
        });
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRolesAndPermissions();
        
        // Log audit event
        await logAuditEvent('role_deleted', { roleId, roleName });
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const handleCloneRole = async (role: Role) => {
    setFormData({
      name: `${role.name} (Copy)`,
      description: `Sao chép từ ${role.description}`,
      permissions: [...role.permissions]
    });
    setIsCreateRoleModalOpen(true);
  };

  const logAuditEvent = async (action: string, details: any) => {
    try {
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          resource_type: 'role',
          details,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setSelectedRole(null);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions]
    });
    setIsEditRoleModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const getRoleStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Quản lý Vai trò & Quyền hạn
          </h1>
          <p className="text-gray-600">
            Quản lý vai trò người dùng và phân quyền truy cập hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsPermissionMatrixOpen(true)}
          >
            <Key className="h-4 w-4 mr-2" />
            Ma trận Quyền hạn
          </Button>
          <Button onClick={() => setIsCreateRoleModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo Vai trò
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm vai trò theo tên hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="roles">Vai trò</TabsTrigger>
          <TabsTrigger value="permissions">Quyền hạn</TabsTrigger>
          <TabsTrigger value="assignments">Phân quyền</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {role.is_system_role ? (
                            <Lock className="h-4 w-4 mr-2 text-gray-500" />
                          ) : (
                            <Unlock className="h-4 w-4 mr-2 text-blue-500" />
                          )}
                          {role.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {role.description}
                        </p>
                      </div>
                      <Badge className={getRoleStatusColor(role.status)}>
                        {role.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Role Stats */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {role.permissions.length}
                          </div>
                          <div className="text-sm text-gray-500">Quyền hạn</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {role.user_count}
                          </div>
                          <div className="text-sm text-gray-500">Người dùng</div>
                        </div>
                      </div>

                      {/* Permission Preview */}
                      <div>
                        <div className="text-sm font-medium mb-2">Quyền hạn chính:</div>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permId) => {
                            const permission = permissions.find(p => p.id === permId);
                            return permission ? (
                              <Badge key={permId} variant="outline" className="text-xs">
                                {permission.name}
                              </Badge>
                            ) : null;
                          })}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between pt-2">
                        <div className="text-xs text-gray-500">
                          Cập nhật: {new Date(role.updated_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloneRole(role)}
                            title="Sao chép vai trò"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(role)}
                            disabled={role.is_system_role}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            disabled={role.is_system_role || role.user_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-6">
            {PERMISSION_CATEGORIES.map((category) => {
              const categoryPermissions = getPermissionsByCategory(category.id);
              const Icon = category.icon;
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-5 w-5 mr-2" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {permission.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {permission.resource}:{permission.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Modal */}
      <Dialog open={isCreateRoleModalOpen} onOpenChange={setIsCreateRoleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo Vai trò Mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên vai trò</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên vai trò"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả vai trò"
                />
              </div>
            </div>

            {/* Permission Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4">Chọn Quyền hạn</h3>
              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category.id);
                  const Icon = category.icon;
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={formData.permissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={permission.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateRoleModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateRole}>
                <Save className="h-4 w-4 mr-2" />
                Tạo Vai trò
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Vai trò</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên vai trò</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên vai trò"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả vai trò"
                />
              </div>
            </div>

            {/* Permission Selection - Same as Create Modal */}
            <div>
              <h3 className="text-lg font-medium mb-4">Chọn Quyền hạn</h3>
              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = getPermissionsByCategory(category.id);
                  const Icon = category.icon;
                  
                  return (
                    <Card key={category.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={`edit-${permission.id}`}
                                checked={formData.permissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`edit-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditRoleModalOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateRole}>
                <Save className="h-4 w-4 mr-2" />
                Cập nhật Vai trò
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
