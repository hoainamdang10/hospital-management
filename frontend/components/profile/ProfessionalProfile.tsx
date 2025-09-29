"use client"

import { useState, useRef } from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  GraduationCap,
  Award,
  Clock,
  Edit,
  Save,
  X,
  Camera,
  Upload,
  Star,
  Badge as BadgeIcon,
  Building,
  Languages,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/toast-provider"

interface ProfileData {
  id: string
  full_name: string
  email: string
  phone_number?: string
  role: string
  avatar_url?: string
  date_of_birth?: string
  gender?: string
  address?: any
  // Doctor specific
  doctor_id?: string
  specialty?: string
  qualification?: string
  license_number?: string
  bio?: string
  experience_years?: number
  consultation_fee?: number
  languages_spoken?: string[]
  rating?: number
  total_reviews?: number
  department_id?: string
  // Patient specific
  patient_id?: string
  blood_type?: string
  emergency_contact?: any
  medical_history?: string
  allergies?: string[]
  chronic_conditions?: string[]
}

interface ProfessionalProfileProps {
  profileData: ProfileData
  onSave: (data: Partial<ProfileData>) => Promise<void>
  onAvatarUpload?: (file: File) => Promise<string>
  isLoading?: boolean
}

export function ProfessionalProfile({ 
  profileData, 
  onSave, 
  onAvatarUpload,
  isLoading = false 
}: ProfessionalProfileProps) {
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<ProfileData>>(profileData)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast("Lỗi", "Vui lòng chọn file hình ảnh", "error")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Lỗi", "Kích thước file không được vượt quá 5MB", "error")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar if handler provided
    if (onAvatarUpload) {
      try {
        const avatarUrl = await onAvatarUpload(file)
        handleInputChange('avatar_url', avatarUrl)
        showToast("Thành công", "Cập nhật avatar thành công", "success")
      } catch (error) {
        showToast("Lỗi", "Không thể tải lên avatar", "error")
        setAvatarPreview(null)
      }
    }
  }

  const handleSave = async () => {
    try {
      await onSave(formData)
      setIsEditing(false)
      setAvatarPreview(null)
      showToast("Thành công", "Cập nhật hồ sơ thành công", "success")
    } catch (error) {
      showToast("Lỗi", "Không thể cập nhật hồ sơ", "error")
    }
  }

  const handleCancel = () => {
    setFormData(profileData)
    setIsEditing(false)
    setAvatarPreview(null)
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return 'DR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header with Avatar */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage 
                  src={avatarPreview || formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.full_name}`} 
                  alt={profileData.full_name}
                />
                <AvatarFallback className="text-2xl bg-gray-100">
                  {getInitials(profileData.full_name)}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload avatar image"
              />
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="full_name">Họ và tên</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name || ''}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{profileData.full_name}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{profileData.email}</span>
                  </div>
                  {profileData.phone_number && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profileData.phone_number}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {profileData.role === 'doctor' ? 'Bác sĩ' : 
                   profileData.role === 'patient' ? 'Bệnh nhân' : 
                   profileData.role === 'admin' ? 'Quản trị viên' : profileData.role}
                </Badge>
                
                {profileData.role === 'doctor' && profileData.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{profileData.rating}</span>
                    <span className="text-sm text-gray-500">({profileData.total_reviews} đánh giá)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      {profileData.role === 'doctor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Thông tin chuyên môn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="specialty">Chuyên khoa</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty || ''}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualification">Bằng cấp</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification || ''}
                      onChange={(e) => handleInputChange('qualification', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_number">Số giấy phép hành nghề</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number || ''}
                      onChange={(e) => handleInputChange('license_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience_years">Số năm kinh nghiệm</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      value={formData.experience_years || ''}
                      onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Chuyên khoa</p>
                      <p className="text-gray-600">{profileData.specialty || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Bằng cấp</p>
                      <p className="text-gray-600">{profileData.qualification || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <BadgeIcon className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Giấy phép hành nghề</p>
                      <p className="text-gray-600">{profileData.license_number || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Kinh nghiệm</p>
                      <p className="text-gray-600">{profileData.experience_years || 0} năm</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Thông tin bổ sung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="consultation_fee">Phí khám (VNĐ)</Label>
                    <Input
                      id="consultation_fee"
                      type="number"
                      value={formData.consultation_fee || ''}
                      onChange={(e) => handleInputChange('consultation_fee', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Số điện thoại</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Phí khám</p>
                      <p className="text-gray-600">
                        {profileData.consultation_fee ? formatCurrency(profileData.consultation_fee) : 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Languages className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Ngôn ngữ</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.languages_spoken?.map((lang, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        )) || <span className="text-gray-600">Chưa cập nhật</span>}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Điện thoại</p>
                      <p className="text-gray-600">{profileData.phone_number || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {profileData.role === 'doctor' ? 'Giới thiệu bản thân' : 'Thông tin cá nhân'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">
                  {profileData.role === 'doctor' ? 'Mô tả về bản thân và kinh nghiệm' : 'Ghi chú'}
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio || formData.medical_history || ''}
                  onChange={(e) => handleInputChange(profileData.role === 'doctor' ? 'bio' : 'medical_history', e.target.value)}
                  rows={4}
                  placeholder={profileData.role === 'doctor'
                    ? 'Chia sẻ về kinh nghiệm, chuyên môn và phương pháp điều trị của bạn...'
                    : 'Thông tin y tế quan trọng, tiền sử bệnh...'
                  }
                />
              </div>

              {profileData.role === 'patient' && (
                <>
                  <div>
                    <Label htmlFor="blood_type">Nhóm máu</Label>
                    <Input
                      id="blood_type"
                      value={formData.blood_type || ''}
                      onChange={(e) => handleInputChange('blood_type', e.target.value)}
                      placeholder="A, B, AB, O..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Ngày sinh</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                {profileData.bio || profileData.medical_history || 'Chưa có thông tin'}
              </p>

              {profileData.role === 'patient' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="font-medium text-gray-900">Nhóm máu</p>
                    <p className="text-gray-600">{profileData.blood_type || 'Chưa cập nhật'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ngày sinh</p>
                    <p className="text-gray-600">
                      {profileData.date_of_birth
                        ? new Date(profileData.date_of_birth).toLocaleDateString('vi-VN')
                        : 'Chưa cập nhật'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
