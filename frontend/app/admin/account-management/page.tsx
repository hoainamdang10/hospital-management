"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  UserPlus, 
  Stethoscope, 
  Shield, 
  Users, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"
import { useSpecialtyOptions, useDepartmentOptions } from "@/lib/contexts/EnumContext"

// Internal account creation interface
interface InternalAccountData {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  role: "doctor" | "admin"
  
  // Doctor specific
  specialization?: string
  licenseNo?: string
  qualification?: string
  departmentId?: string
  yearsOfExperience?: number
  
  // Admin specific
  department?: string
  accessLevel?: "admin" | "manager" | "staff"
  permissions?: string[]
}

// Mock data for existing accounts
const mockAccounts = [
  {
    id: "1",
    email: "doctor1@hospital.com",
    fullName: "Dr. Nguyễn Văn A",
    role: "doctor",
    specialization: "Tim mạch",
    department: "Khoa Tim Mạch",
    status: "active",
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    email: "admin1@hospital.com",
    fullName: "Trần Thị B",
    role: "admin",
    department: "Hành chính",
    accessLevel: "manager",
    status: "active",
    createdAt: "2024-01-10"
  }
]

export default function AccountManagementPage() {
  const { showToast } = useToast()
  const specialtyOptions = useSpecialtyOptions()
  const departmentOptions = useDepartmentOptions()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [accounts, setAccounts] = useState(mockAccounts)
  const [formData, setFormData] = useState<InternalAccountData>({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    role: "doctor"
  })

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      phoneNumber: "",
      role: "doctor"
    })
  }

  // Handle form submission
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Call API to create internal account
      console.log('Creating internal account:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const roleText = formData.role === "doctor" ? "bác sĩ" : "quản trị viên"
      showToast("✅ Thành công", `Tài khoản ${roleText} đã được tạo thành công!`, "success")
      
      // Add to accounts list (mock)
      const newAccount = {
        id: Date.now().toString(),
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        specialization: formData.specialization,
        department: formData.departmentId,
        status: "active",
        createdAt: new Date().toISOString().split('T')[0]
      }
      setAccounts(prev => [...prev, newAccount])
      
      resetForm()
      setIsCreateDialogOpen(false)
      
    } catch (error) {
      console.error('Account creation error:', error)
      showToast("❌ Lỗi", "Không thể tạo tài khoản. Vui lòng thử lại.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản nội bộ</h1>
          <p className="text-gray-600 mt-2">
            Tạo và quản lý tài khoản cho bác sĩ và nhân viên
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0066CC] hover:bg-[#0052A3]">
              <UserPlus className="w-4 h-4 mr-2" />
              Tạo tài khoản mới
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo tài khoản nội bộ</DialogTitle>
              <DialogDescription>
                Tạo tài khoản cho bác sĩ hoặc nhân viên quản trị
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* Role Selection */}
              <div>
                <Label htmlFor="role">Loại tài khoản *</Label>
                <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại tài khoản" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Bác sĩ
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Quản trị viên
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="doctor@hospital.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">Số điện thoại *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                    placeholder="0123456789"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fullName">Họ và tên đầy đủ *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  placeholder="Dr. Nguyễn Văn A"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu tạm thời *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu
                </p>
              </div>

              {/* Doctor Specific Fields */}
              {formData.role === "doctor" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Thông tin bác sĩ</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="specialization">Chuyên khoa *</Label>
                      <Select 
                        value={formData.specialization || ''} 
                        onValueChange={(value) => updateFormData('specialization', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chuyên khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialtyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="departmentId">Khoa làm việc *</Label>
                      <Select 
                        value={formData.departmentId || ''} 
                        onValueChange={(value) => updateFormData('departmentId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNo">Số chứng chỉ hành nghề</Label>
                      <Input
                        id="licenseNo"
                        value={formData.licenseNo || ''}
                        onChange={(e) => updateFormData('licenseNo', e.target.value)}
                        placeholder="VN-XX-XXXX"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="yearsOfExperience">Số năm kinh nghiệm</Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience || ''}
                        onChange={(e) => updateFormData('yearsOfExperience', parseInt(e.target.value) || undefined)}
                        placeholder="5"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="qualification">Bằng cấp</Label>
                    <Select 
                      value={formData.qualification || ''} 
                      onValueChange={(value) => updateFormData('qualification', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bằng cấp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelor">Bác sĩ</SelectItem>
                        <SelectItem value="master">Thạc sĩ</SelectItem>
                        <SelectItem value="doctor">Tiến sĩ</SelectItem>
                        <SelectItem value="professor">Giáo sư</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Admin Specific Fields */}
              {formData.role === "admin" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Thông tin quản trị</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Phòng ban</Label>
                      <Select 
                        value={formData.department || ''} 
                        onValueChange={(value) => updateFormData('department', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phòng ban" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administration">Hành chính</SelectItem>
                          <SelectItem value="finance">Kế toán</SelectItem>
                          <SelectItem value="hr">Nhân sự</SelectItem>
                          <SelectItem value="it">Công nghệ thông tin</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="accessLevel">Cấp độ truy cập</Label>
                      <Select 
                        value={formData.accessLevel || ''} 
                        onValueChange={(value) => updateFormData('accessLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn cấp độ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin (Toàn quyền)</SelectItem>
                          <SelectItem value="manager">Manager (Quản lý)</SelectItem>
                          <SelectItem value="staff">Staff (Nhân viên)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#0066CC] hover:bg-[#0052A3]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Tạo tài khoản
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng bác sĩ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.filter(acc => acc.role === 'doctor').length}
                </p>
              </div>
              <Stethoscope className="w-8 h-8 text-[#0066CC]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quản trị viên</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.filter(acc => acc.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng tài khoản</p>
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài khoản nội bộ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Khoa/Phòng ban</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.fullName}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>
                    <Badge variant={account.role === 'doctor' ? 'default' : 'secondary'}>
                      {account.role === 'doctor' ? 'Bác sĩ' : 'Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.department || account.specialization}</TableCell>
                  <TableCell>
                    <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                      {account.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
