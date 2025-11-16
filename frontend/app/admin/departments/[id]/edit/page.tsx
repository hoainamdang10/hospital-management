'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { getDepartmentById, updateDepartment } from '@/lib/api/departments.service';
import { toast } from 'sonner';

/**
 * Edit Department Page
 * Route: /admin/departments/[id]/edit
 */
export default function EditDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nameVi: '',
    nameEn: '',
    description: '',
    phone: '',
    email: '',
    location: '',
    isActive: true
  });

  useEffect(() => {
    if (params.id) {
      fetchDepartment(params.id as string);
    }
  }, [params.id]);

  const fetchDepartment = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getDepartmentById(id);
      if (response.success) {
        const dept = response.data;
        setFormData({
          code: dept.code,
          nameVi: dept.nameVi,
          nameEn: dept.nameEn,
          description: dept.description,
          phone: dept.phone || '',
          email: dept.email || '',
          location: dept.location || '',
          isActive: dept.isActive
        });
      }
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error('Không thể tải thông tin khoa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateDepartment(params.id as string, formData);
      toast.success('Cập nhật khoa thành công');
      router.push('/admin/departments');
    } catch (error: any) {
      console.error('Error updating department:', error);
      toast.error(error.message || 'Không thể cập nhật khoa');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p>Đang tải...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa khoa</h1>
            <p className="text-gray-500 mt-1">Cập nhật thông tin khoa phòng</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã khoa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tiếng Việt <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nameVi}
                onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên tiếng Anh
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vị trí
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: Tầng 2, Tòa A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Khoa đang hoạt động</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
