'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  appointmentInfo: {
    doctorName: string;
    date: string;
    time: string;
  };
}

const CANCELLATION_REASONS = [
  'Bận việc đột xuất',
  'Sức khỏe đã tốt hơn',
  'Muốn đổi bác sĩ khác',
  'Muốn đổi thời gian khác',
  'Lý do cá nhân',
  'Khác',
];

export function CancelAppointmentDialog({
  isOpen,
  onClose,
  onConfirm,
  appointmentInfo,
}: CancelAppointmentDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    const reason = selectedReason === 'Khác' ? customReason : selectedReason;
    
    if (!reason.trim()) {
      return;
    }

    try {
      setLoading(true);
      await onConfirm(reason);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  }

  const isValid = selectedReason && (selectedReason !== 'Khác' || customReason.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 sticky top-0 bg-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Hủy lịch hẹn</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
          {/* Appointment Info */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Bạn đang hủy lịch hẹn:</p>
            <p className="mt-1.5 font-semibold text-gray-900">BS. {appointmentInfo.doctorName}</p>
            <p className="mt-0.5 text-sm text-gray-600">
              {appointmentInfo.date} • {appointmentInfo.time}
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2.5">
            <p className="text-sm text-yellow-800">
              ⚠️ Lưu ý: Sau khi hủy, bạn sẽ không thể khôi phục lịch hẹn này. Vui lòng cân nhắc kỹ trước khi xác nhận.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Lý do hủy lịch <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={loading}
                    className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Khác' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nhập lý do cụ thể <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={loading}
                placeholder="Vui lòng nhập lý do hủy lịch..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        <div className="flex gap-3 border-t p-4 sticky bottom-0 bg-white rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Quay lại
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang hủy...
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

