/**
 * Admin Invitations Management Page
 * For testing the invite-only authentication system
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Copy, Mail, Users, Clock, CheckCircle } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  role: string
  department?: {
    id: number
    name: string
  }
  status: 'active' | 'consumed' | 'expired'
  expires_at: string
  consumed_at?: string
  created_at: string
  invited_by_profile?: {
    full_name: string
    email: string
  }
  consumed_by_profile?: {
    full_name: string
    email: string
  }
}

interface Department {
  id: number
  name: string
  description?: string
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    department_id: '',
    expires_in_days: '7',
    message: '',
  })

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations')
      const result = await response.json()

      if (result.success) {
        setInvitations(result.data)
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể tải danh sách lời mời',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Fetch invitations error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      })
    }
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // Mock departments for now
      setDepartments([
        { id: 1, name: 'Khoa Tim mạch', description: 'Cardiology Department' },
        { id: 2, name: 'Khoa Nhi', description: 'Pediatrics Department' },
        { id: 3, name: 'Khoa Ngoại', description: 'Surgery Department' },
        { id: 4, name: 'Khoa Nội', description: 'Internal Medicine Department' },
        { id: 5, name: 'Khoa Sản', description: 'Obstetrics Department' },
      ])
    } catch (error) {
      console.error('Fetch departments error:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchInvitations(), fetchDepartments()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Create invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const payload = {
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        expires_in_days: parseInt(formData.expires_in_days),
        message: formData.message || undefined,
      }

      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message,
        })
        
        // Reset form
        setFormData({
          email: '',
          role: '',
          department_id: '',
          expires_in_days: '7',
          message: '',
        })
        setShowCreateForm(false)
        
        // Refresh invitations
        await fetchInvitations()
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể tạo lời mời',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Create invitation error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // Revoke invitation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời này?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message,
        })
        await fetchInvitations()
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể thu hồi lời mời',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Revoke invitation error:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      })
    }
  }

  // Copy invitation URL
  const copyInvitationUrl = (invitation: Invitation) => {
    // This would normally come from the API response
    const inviteUrl = `${window.location.origin}/accept-invite?token=PLACEHOLDER_TOKEN`
    navigator.clipboard.writeText(inviteUrl)
    toast({
      title: 'Đã sao chép',
      description: 'Liên kết lời mời đã được sao chép vào clipboard',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Đang hoạt động</Badge>
      case 'consumed':
        return <Badge className="bg-blue-100 text-blue-800">Đã sử dụng</Badge>
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Đã hết hạn</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'Bác sĩ'
      case 'staff':
        return 'Nhân viên'
      case 'admin':
        return 'Quản trị viên'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Lời mời</h1>
          <p className="text-gray-600">Tạo và quản lý lời mời cho nhân viên mới</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo lời mời mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                <p className="text-2xl font-bold">{invitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(inv => inv.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã sử dụng</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(inv => inv.status === 'consumed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã hết hạn</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(inv => inv.status === 'expired').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tạo lời mời mới</CardTitle>
            <CardDescription>
              Tạo lời mời cho nhân viên mới tham gia hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Vai trò *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Bác sĩ</SelectItem>
                      <SelectItem value="staff">Nhân viên</SelectItem>
                      <SelectItem value="admin">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Khoa/Phòng</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khoa/phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expires_in_days">Thời hạn (ngày)</Label>
                  <Input
                    id="expires_in_days"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Tin nhắn (tùy chọn)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tin nhắn cho người được mời..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tạo lời mời
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lời mời</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Chưa có lời mời nào</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{invitation.email}</span>
                      {getStatusBadge(invitation.status)}
                      <Badge variant="outline">{getRoleName(invitation.role)}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {invitation.department && (
                        <span className="mr-4">Khoa: {invitation.department.name}</span>
                      )}
                      <span className="mr-4">
                        Hết hạn: {new Date(invitation.expires_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span>
                        Tạo: {new Date(invitation.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInvitationUrl(invitation)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {invitation.status === 'active' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeInvitation(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
