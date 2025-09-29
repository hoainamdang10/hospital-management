"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  FlaskConical,
  Plus, 
  Edit,
  Trash2,
  Calendar,
  Building,
  Clock,
  TrendingUp
} from "lucide-react"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "react-hot-toast"

interface DoctorExperience {
  experience_id: string
  doctor_id: string
  institution_name: string
  position: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  experience_type: 'work' | 'education' | 'certification' | 'research'
  created_at: string
}

interface TotalExperience {
  total_years: number
  work_years: number
  education_years: number
  current_positions: DoctorExperience[]
}

interface ExperienceManagerProps {
  doctorId: string
  editable?: boolean
}

const EXPERIENCE_TYPES = [
  { value: 'work', label: 'Kinh nghiệm làm việc', icon: Briefcase, color: 'bg-blue-100 text-blue-800' },
  { value: 'education', label: 'Học vấn', icon: GraduationCap, color: 'bg-green-100 text-green-800' },
  { value: 'certification', label: 'Chứng chỉ', icon: Award, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'research', label: 'Nghiên cứu', icon: FlaskConical, color: 'bg-purple-100 text-purple-800' }
]

export function ExperienceManager({ doctorId, editable = true }: ExperienceManagerProps) {
  const [experiences, setExperiences] = useState<DoctorExperience[]>([])
  const [totalExperience, setTotalExperience] = useState<TotalExperience | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingExperience, setEditingExperience] = useState<DoctorExperience | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [newExperience, setNewExperience] = useState({
    institution_name: '',
    position: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
    experience_type: 'work' as const
  })

  useEffect(() => {
    loadExperienceData()
  }, [doctorId])

  const loadExperienceData = async () => {
    try {
      setLoading(true)
      
      const [experiencesResponse, totalResponse] = await Promise.all([
        doctorsApi.getExperiences(doctorId),
        doctorsApi.getTotalExperience(doctorId)
      ])

      if (experiencesResponse.success) {
        setExperiences(experiencesResponse.data)
      }

      if (totalResponse.success) {
        setTotalExperience(totalResponse.data)
      }
    } catch (error) {
      console.error('Error loading experience data:', error)
      toast.error('Không thể tải dữ liệu kinh nghiệm')
    } finally {
      setLoading(false)
    }
  }

  const createExperience = async () => {
    try {
      const experienceData = {
        doctor_id: doctorId,
        ...newExperience,
        start_date: new Date(newExperience.start_date),
        end_date: newExperience.end_date ? new Date(newExperience.end_date) : undefined
      }

      const response = await doctorsApi.createExperience(experienceData)
      
      if (response.success) {
        toast.success('Kinh nghiệm đã được thêm thành công')
        setShowCreateDialog(false)
        resetForm()
        loadExperienceData()
      } else {
        toast.error('Không thể thêm kinh nghiệm')
      }
    } catch (error) {
      console.error('Error creating experience:', error)
      toast.error('Lỗi khi thêm kinh nghiệm')
    }
  }

  const updateExperience = async () => {
    if (!editingExperience) return

    try {
      const experienceData = {
        ...newExperience,
        start_date: new Date(newExperience.start_date),
        end_date: newExperience.end_date ? new Date(newExperience.end_date) : undefined
      }

      const response = await doctorsApi.updateExperience(editingExperience.experience_id, experienceData)
      
      if (response.success) {
        toast.success('Kinh nghiệm đã được cập nhật')
        setEditingExperience(null)
        resetForm()
        loadExperienceData()
      } else {
        toast.error('Không thể cập nhật kinh nghiệm')
      }
    } catch (error) {
      console.error('Error updating experience:', error)
      toast.error('Lỗi khi cập nhật kinh nghiệm')
    }
  }

  const deleteExperience = async (experienceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kinh nghiệm này?')) return

    try {
      const response = await doctorsApi.deleteExperience(experienceId)
      
      if (response.success) {
        toast.success('Kinh nghiệm đã được xóa')
        loadExperienceData()
      } else {
        toast.error('Không thể xóa kinh nghiệm')
      }
    } catch (error) {
      console.error('Error deleting experience:', error)
      toast.error('Lỗi khi xóa kinh nghiệm')
    }
  }

  const resetForm = () => {
    setNewExperience({
      institution_name: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      experience_type: 'work'
    })
  }

  const startEdit = (experience: DoctorExperience) => {
    setEditingExperience(experience)
    setNewExperience({
      institution_name: experience.institution_name,
      position: experience.position,
      start_date: experience.start_date.split('T')[0],
      end_date: experience.end_date ? experience.end_date.split('T')[0] : '',
      is_current: experience.is_current,
      description: experience.description || '',
      experience_type: experience.experience_type
    })
    setShowCreateDialog(true)
  }

  const getTypeConfig = (type: string) => {
    return EXPERIENCE_TYPES.find(t => t.value === type) || EXPERIENCE_TYPES[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long'
    })
  }

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return Math.round(years * 10) / 10
  }

  const filteredExperiences = filterType === 'all' 
    ? experiences 
    : experiences.filter(exp => exp.experience_type === filterType)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      {totalExperience && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalExperience.total_years}</p>
                  <p className="text-sm text-gray-600">Năm kinh nghiệm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalExperience.work_years}</p>
                  <p className="text-sm text-gray-600">Năm làm việc</p>
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
                  <p className="text-2xl font-bold text-gray-900">{totalExperience.current_positions.length}</p>
                  <p className="text-sm text-gray-600">Vị trí hiện tại</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Experience List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              Kinh nghiệm & Học vấn
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {EXPERIENCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {editable && (
                <Dialog open={showCreateDialog} onOpenChange={(open) => {
                  setShowCreateDialog(open)
                  if (!open) {
                    setEditingExperience(null)
                    resetForm()
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm kinh nghiệm
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingExperience ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm mới'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Loại kinh nghiệm</Label>
                          <Select 
                            value={newExperience.experience_type} 
                            onValueChange={(value: any) => setNewExperience(prev => ({ ...prev, experience_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPERIENCE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tên tổ chức</Label>
                          <Input
                            value={newExperience.institution_name}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, institution_name: e.target.value }))}
                            placeholder="Tên bệnh viện, trường học..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Vị trí / Chức danh</Label>
                        <Input
                          value={newExperience.position}
                          onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Bác sĩ điều trị, Sinh viên Y khoa..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ngày bắt đầu</Label>
                          <Input
                            type="date"
                            value={newExperience.start_date}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, start_date: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ngày kết thúc</Label>
                          <Input
                            type="date"
                            value={newExperience.end_date}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, end_date: e.target.value }))}
                            disabled={newExperience.is_current}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newExperience.is_current}
                          onCheckedChange={(checked) => setNewExperience(prev => ({ 
                            ...prev, 
                            is_current: checked,
                            end_date: checked ? '' : prev.end_date
                          }))}
                        />
                        <Label>Đang làm việc / học tập tại đây</Label>
                      </div>

                      <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea
                          value={newExperience.description}
                          onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Mô tả chi tiết về công việc, thành tích..."
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Hủy
                        </Button>
                        <Button 
                          onClick={editingExperience ? updateExperience : createExperience}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {editingExperience ? 'Cập nhật' : 'Thêm kinh nghiệm'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExperiences.length > 0 ? (
            <div className="space-y-4">
              {filteredExperiences.map((experience) => {
                const typeConfig = getTypeConfig(experience.experience_type)
                const Icon = typeConfig.icon
                const duration = calculateDuration(experience.start_date, experience.end_date)

                return (
                  <div key={experience.experience_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{experience.position}</h4>
                            <Badge className={typeConfig.color}>
                              {typeConfig.label}
                            </Badge>
                            {experience.is_current && (
                              <Badge variant="secondary">Hiện tại</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {experience.institution_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Hiện tại'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {duration} năm
                            </span>
                          </div>

                          {experience.description && (
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {experience.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {editable && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(experience)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteExperience(experience.experience_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có kinh nghiệm nào được thêm</p>
              {filterType !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilterType('all')}
                  className="mt-2"
                >
                  Xem tất cả kinh nghiệm
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
