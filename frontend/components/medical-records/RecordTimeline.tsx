'use client';

import { Calendar, User, FileText, ChevronRight, Pill } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MedicalRecord } from '@/lib/types/medical-records';
import { useRouter } from 'next/navigation';

interface RecordTimelineProps {
  records: MedicalRecord[];
  loading?: boolean;
}

export function RecordTimeline({ records, loading }: RecordTimelineProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-6 h-32" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Chưa có hồ sơ bệnh án
        </h3>
        <p className="text-gray-500">
          Hồ sơ bệnh án sẽ được tạo sau khi bạn hoàn thành buổi khám
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => {
        const visitDate = parseISO(record.visitDate);
        const primaryDiagnosis = record.diagnoses.find(d => d.type === 'primary') || record.diagnoses[0];

        return (
          <div
            key={record.recordId}
            onClick={() => router.push(`/patient/medical-history/${record.recordId}`)}
            className="relative bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
          >
            {/* Timeline dot */}
            <div className="absolute -left-3 top-8 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-md" />
            
            {/* Timeline line */}
            {index < records.length - 1 && (
              <div className="absolute -left-1.5 top-14 bottom-0 w-0.5 bg-gray-200" />
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="capitalize font-medium">
                    {format(visitDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{format(visitDate, 'HH:mm')}</span>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">BS. {record.doctorName}</span>
                  {record.departmentName && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{record.departmentName}</span>
                    </>
                  )}
                </div>

                {/* Diagnosis */}
                {primaryDiagnosis && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Chẩn đoán:</p>
                      <p className="font-medium text-gray-900">{primaryDiagnosis.description}</p>
                      {primaryDiagnosis.code && (
                        <p className="text-xs text-gray-500 mt-1">Mã ICD-10: {primaryDiagnosis.code}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Medications count */}
                {record.medications.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Pill className="h-4 w-4" />
                    <span>{record.medications.length} loại thuốc</span>
                  </div>
                )}

                {/* Chief Complaint */}
                {record.chiefComplaint && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">Lý do khám: </span>
                    {record.chiefComplaint}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
            </div>

            {/* Status badge */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                record.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {record.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
