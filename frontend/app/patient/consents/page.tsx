'use client';

import { useState, useEffect } from 'react';
import { FileText, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { patientService, type Consent } from '@/lib/api/patient.service';
import { toast } from 'sonner';

export default function PatientConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const patientId = 'PAT-202411-001';

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      setIsLoading(true);
      const result = await patientService.getConsents(patientId);
      setConsents(result.consents || []);
    } catch (err) {
      toast.error('Không thể tải danh sách đồng ý');
      // Fallback mock data
      setConsents([
        {
          consentId: '1',
          consentType: 'DATA_SHARING',
          status: 'ACTIVE',
          grantedAt: '2025-01-01T00:00:00Z',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrant = async (consentType: Consent['consentType']) => {
    try {
      await patientService.grantConsent(patientId, consentType);
      toast.success('Đồng ý thành công');
      loadConsents();
    } catch (err) {
      toast.error('Không thể cấp quyền đồng ý');
    }
  };

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi đồng ý này?')) return;
    
    try {
      await patientService.revokeConsent(patientId, consentId, 'Không muốn chia sẻ nữa');
      toast.success('Thu hồi đồng ý thành công');
      loadConsents();
    } catch (err) {
      toast.error('Không thể thu hồi đồng ý');
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

  const consentTypes = [
    { type: 'DATA_SHARING' as const, title: 'Đồng ý chia sẻ thông tin y tế', description: 'Cho phép chia sẻ thông tin y tế với các bác sĩ và nhân viên y tế liên quan' },
    { type: 'TREATMENT' as const, title: 'Đồng ý điều trị', description: 'Đồng ý tiến hành các thủ thuật và phương pháp điều trị' },
    { type: 'RESEARCH' as const, title: 'Đồng ý sử dụng dữ liệu cho nghiên cứu', description: 'Cho phép sử dụng dữ liệu y tế (ẩn danh) cho mục đích nghiên cứu' },
    { type: 'MARKETING' as const, title: 'Đồng ý nhận thông tin marketing', description: 'Nhận thông tin về dịch vụ, khuyến mãi từ bệnh viện' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đồng ý</h1>
          <p className="mt-2 text-gray-600">Quản lý các đồng ý sử dụng dữ liệu và điều trị</p>
        </div>

        <div className="space-y-4">
          {consentTypes.map((consentType) => {
            const existingConsent = consents.find(c => c.consentType === consentType.type && c.status === 'ACTIVE');
            return (
              <ConsentCard
                key={consentType.type}
                consent={existingConsent}
                title={consentType.title}
                description={consentType.description}
                onGrant={() => handleGrant(consentType.type)}
                onRevoke={() => existingConsent && handleRevoke(existingConsent.consentId!)}
              />
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ConsentCard({
  consent,
  title,
  description,
  onGrant,
  onRevoke,
}: {
  consent?: Consent;
  title: string;
  description: string;
  onGrant: () => void;
  onRevoke: () => void;
}) {
  const isGranted = consent && consent.status === 'ACTIVE';
  
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <FileText className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            {isGranted && consent.grantedAt && (
              <p className="mt-2 text-xs text-gray-500">
                Đồng ý ngày: {new Date(consent.grantedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isGranted ? (
            <div className="flex items-center space-x-2">
              <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <Check className="mr-1 h-4 w-4" />
                Đã đồng ý
              </span>
              <Button variant="outline" size="sm" onClick={onRevoke}>
                Thu hồi
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onGrant}>
              Đồng ý
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
