'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { patientService, type Insurance } from '@/lib/api/patient.service';
import { toast } from 'sonner';

/**
 * Patient Insurance Management Page
 * Route: /patient/insurance
 */
export default function PatientInsurancePage() {
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const patientId = 'PAT-202411-001';

  useEffect(() => {
    loadInsurance();
  }, []);

  const loadInsurance = async () => {
    try {
      setIsLoading(true);
      const result = await patientService.getInsurance(patientId);
      setInsurance(result.insuranceInfo);
    } catch (err) {
      toast.error('Không thể tải thông tin bảo hiểm');
      // Fallback mock data
      setInsurance({
        insuranceId: '1',
        provider: 'Bảo hiểm Y tế Việt Nam',
        policyNumber: 'DN1234567890',
        coverageType: 'BHYT',
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
        isActive: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      const result = await patientService.verifyInsurance(patientId);
      if (result.isValid) {
        toast.success('Bảo hiểm hợp lệ', {
          description: `Hết hạn: ${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString('vi-VN') : 'Không xác định'}`,
        });
      } else {
        toast.error('Bảo hiểm không hợp lệ', {
          description: result.message,
        });
      }
    } catch (err) {
      toast.error('Không thể xác minh bảo hiểm');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bảo hiểm y tế</h1>
            <p className="mt-2 text-gray-600">Quản lý thông tin bảo hiểm của bạn</p>
          </div>
          <div className="flex space-x-3">
            {insurance && (
              <Button variant="outline" onClick={handleVerify} disabled={isVerifying}>
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Xác minh bảo hiểm
              </Button>
            )}
            <Button onClick={() => setIsAdding(!isAdding)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm bảo hiểm
            </Button>
          </div>
        </div>

        {/* Add Insurance Form */}
        {isAdding && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Thêm thông tin bảo hiểm
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nhà cung cấp bảo hiểm
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Bảo Việt, Prudential..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số thẻ bảo hiểm
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập số thẻ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loại bảo hiểm
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option>Bảo hiểm y tế bắt buộc</option>
                  <option>Bảo hiểm y tế tự nguyện</option>
                  <option>Bảo hiểm thương mại</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ngày hết hạn
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Hủy
              </Button>
              <Button>Lưu</Button>
            </div>
          </div>
        )}

        {/* Insurance Card */}
        <div className="space-y-4">
          {insurance ? (
            <InsuranceCard insurance={insurance} />
          ) : (
            <div className="rounded-lg border bg-white p-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Chưa có thông tin bảo hiểm
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Thêm thông tin bảo hiểm để được hỗ trợ thanh toán
              </p>
              <Button className="mt-4" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm bảo hiểm
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function InsuranceCard({ insurance }: { insurance: Insurance }) {
  const coverageTypeLabels = {
    BHYT: 'Bảo hiểm y tế bắt buộc',
    BHTN: 'Bảo hiểm tư nhân',
    COMMERCIAL: 'Bảo hiểm thương mại',
  };

  const isExpiringSoon = new Date(insurance.validTo) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{insurance.provider}</h3>
            <p className="text-sm text-gray-600">Số thẻ: {insurance.policyNumber}</p>
            <p className="text-sm text-gray-600">Loại: {coverageTypeLabels[insurance.coverageType]}</p>
            <p className="text-sm text-gray-600">
              Hàn sử dụng: {new Date(insurance.validFrom).toLocaleDateString('vi-VN')} - {new Date(insurance.validTo).toLocaleDateString('vi-VN')}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <span
                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                  insurance.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {insurance.isActive ? 'Còn hiệu lực' : 'Hết hiệu lực'}
              </span>
              {isExpiringSoon && insurance.isActive && (
                <span className="inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                  Sắp hết hạn
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="text-primary hover:text-primary/80" title="Chỉnh sửa" aria-label="Chỉnh sửa">
            <Edit className="h-5 w-5" />
          </button>
          <button className="text-red-600 hover:text-red-800" title="Xóa" aria-label="Xóa">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
