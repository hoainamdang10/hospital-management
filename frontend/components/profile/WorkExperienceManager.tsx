'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Building,
  Calendar,
  Award,
  MapPin
} from 'lucide-react';

interface WorkExperience {
  id?: string;
  hospital_name: string;
  position: string;
  department?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  achievements?: string;
  is_current: boolean;
}

interface WorkExperienceManagerProps {
  doctorId: string;
}

export default function WorkExperienceManager({ doctorId }: WorkExperienceManagerProps) {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<WorkExperience>({
    hospital_name: '',
    position: '',
    department: '',
    start_date: '',
    end_date: '',
    description: '',
    achievements: '',
    is_current: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExperiences();
  }, [doctorId]);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getWorkExperiences(doctorId);
      
      if (response.success && response.data) {
        setExperiences(response.data);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải kinh nghiệm làm việc",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      hospital_name: '',
      position: '',
      department: '',
      start_date: '',
      end_date: '',
      description: '',
      achievements: '',
      is_current: false
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleEdit = (experience: WorkExperience) => {
    setFormData({
      ...experience,
      end_date: experience.end_date || ''
    });
    setEditingId(experience.id || null);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.hospital_name || !formData.position || !formData.start_date) {
        toast({
          title: "Lỗi",
          description: "Vui lòng điền đầy đủ thông tin bắt buộc",
          variant: "destructive"
        });
        return;
      }

      const saveData = {
        ...formData,
        end_date: formData.is_current ? null : formData.end_date
      };

      let response;
      if (editingId) {
        response = await doctorsApi.updateWorkExperience(doctorId, editingId, saveData);
      } else {
        response = await doctorsApi.addWorkExperience(doctorId, saveData);
      }

      if (response.success) {
        toast({
          title: "Thành công",
          description: editingId ? "Đã cập nhật kinh nghiệm" : "Đã thêm kinh nghiệm mới",
        });
        fetchExperiences();
        resetForm();
      } else {
        throw new Error(response.error?.message || 'Không thể lưu kinh nghiệm');
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu kinh nghiệm",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kinh nghiệm này?')) return;

    try {
      const response = await doctorsApi.deleteWorkExperience(doctorId, id);
      
      if (response.success) {
        toast({
          title: "Thành công",
          description: "Đã xóa kinh nghiệm",
        });
        fetchExperiences();
      } else {
        throw new Error(response.error?.message || 'Không thể xóa kinh nghiệm');
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa kinh nghiệm",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0) {
      return remainingMonths > 0 ? `${years} năm ${remainingMonths} tháng` : `${years} năm`;
    }
    return `${months} tháng`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Kinh nghiệm làm việc</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Quản lý lịch sử công tác và kinh nghiệm nghề nghiệp
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm kinh nghiệm
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm mới'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospital_name">Tên bệnh viện/cơ sở *</Label>
                <Input
                  id="hospital_name"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospital_name: e.target.value }))}
                  placeholder="VD: Bệnh viện Chợ Rẫy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Chức vụ *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="VD: Bác sĩ chuyên khoa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Khoa/Phòng ban</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="VD: Khoa Tim mạch"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Ngày bắt đầu *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_current"
                checked={formData.is_current}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_current: checked }))}
              />
              <Label htmlFor="is_current">Đang làm việc tại đây</Label>
            </div>

            {!formData.is_current && (
              <div className="space-y-2">
                <Label htmlFor="end_date">Ngày kết thúc</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả công việc</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về công việc và trách nhiệm..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievements">Thành tích đạt được</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => setFormData(prev => ({ ...prev, achievements: e.target.value }))}
                placeholder="Các thành tích, giải thưởng, dự án nổi bật..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có kinh nghiệm làm việc nào</p>
              <p className="text-sm text-gray-500 mt-1">
                Thêm kinh nghiệm đầu tiên để hoàn thiện hồ sơ
              </p>
            </CardContent>
          </Card>
        ) : (
          experiences.map((experience) => (
            <Card key={experience.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{experience.hospital_name}</h3>
                      {experience.is_current && (
                        <Badge variant="default" className="text-xs">
                          Hiện tại
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span className="font-medium">{experience.position}</span>
                        {experience.department && (
                          <>
                            <span>•</span>
                            <span>{experience.department}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(experience.start_date)} - {' '}
                          {experience.is_current ? 'Hiện tại' : (experience.end_date ? formatDate(experience.end_date) : 'N/A')}
                        </span>
                        <span className="text-blue-600 font-medium">
                          ({calculateDuration(experience.start_date, experience.end_date)})
                        </span>
                      </div>
                    </div>

                    {experience.description && (
                      <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                        {experience.description}
                      </p>
                    )}

                    {experience.achievements && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Thành tích:</p>
                        <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                          {experience.achievements}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(experience)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(experience.id!)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
