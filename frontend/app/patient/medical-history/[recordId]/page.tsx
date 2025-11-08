'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText,
  Pill,
  Activity,
  Printer,
  Download,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { medicalRecordsService } from '@/lib/api/medical-records.service';
import { MedicalRecord } from '@/lib/types/medical-records';
import { VitalSignsCard } from '@/components/medical-records/VitalSignsCard';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

/**
 * Medical Record Detail Page
 * Route: /patient/medical-records/:recordId
 */
export default function MedicalRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.recordId as string;

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  async function loadRecord() {
    try {
      setLoading(true);
      const response = await medicalRecordsService.getRecordById(recordId);
      if (response.success) {
        setRecord(response.record);
      }
    } catch (error) {
      console.error('Error loading medical record:', error);
      toast.error('Không thể tải hồ sơ bệnh án');
      router.push('/patient/medical-records');
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải hồ sơ...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy hồ sơ</h2>
          <p className="text-gray-600 mb-6">Hồ sơ này không tồn tại hoặc đã bị xóa</p>
          <Link href="/patient/medical-records">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const visitDate = parseISO(record.visitDate);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/patient/medical-records">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết hồ sơ bệnh án</h1>
              <p className="text-gray-600 mt-1">
                Mã hồ sơ: #{record.recordId}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              In
            </Button>
          </div>
        </div>

        {/* Visit Info */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Thông tin khám bệnh
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Ngày khám</label>
              <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                {format(visitDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
              </p>
              <p className="text-sm text-gray-600">{format(visitDate, 'HH:mm')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Bác sĩ khám</label>
              <p className="text-base font-semibold text-gray-900 mt-1">
                BS. {record.doctorName}
              </p>
              {record.departmentName && (
                <p className="text-sm text-gray-600">{record.departmentName}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Lý do khám</label>
              <p className="text-base text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                {record.chiefComplaint}
              </p>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        {record.vitalSigns && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Chỉ số sinh tồn
            </h3>
            <VitalSignsCard vitalSigns={record.vitalSigns} />
          </div>
        )}

        {/* Diagnoses */}
        {record.diagnoses.length > 0 && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Chẩn đoán
            </h3>
            <div className="space-y-3">
              {record.diagnoses.map((diagnosis, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    diagnosis.type === 'primary'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{diagnosis.description}</p>
                      {diagnosis.code && (
                        <p className="text-sm text-gray-600 mt-1">Mã ICD-10: {diagnosis.code}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      diagnosis.type === 'primary'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {diagnosis.type === 'primary' ? 'Chính' : 'Phụ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {record.medications.length > 0 && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Đơn thuốc ({record.medications.length} loại)
            </h3>
            <div className="space-y-3">
              {record.medications.map((medication, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {medication.medicationName}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Liều dùng:</span> {medication.dosage}</p>
                        <p><span className="font-medium">Tần suất:</span> {medication.frequency}</p>
                        <p><span className="font-medium">Thời gian:</span> {medication.duration}</p>
                        {medication.instructions && (
                          <p className="text-gray-700 mt-2 italic">{medication.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        {record.clinicalNotes && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ghi chú của bác sĩ</h3>
            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {record.clinicalNotes}
            </p>
          </div>
        )}

        {/* Treatment Plan */}
        {record.treatmentPlan && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Kế hoạch điều trị</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{record.treatmentPlan}</p>
          </div>
        )}

        {/* Follow-up Instructions */}
        {record.followUpInstructions && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Hướng dẫn tái khám</h3>
            <p className="text-amber-800 whitespace-pre-wrap">{record.followUpInstructions}</p>
            {record.followUpDate && (
              <p className="text-sm text-amber-700 mt-3">
                <span className="font-medium">Ngày tái khám:</span>{' '}
                {format(parseISO(record.followUpDate), 'dd/MM/yyyy', { locale: vi })}
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
