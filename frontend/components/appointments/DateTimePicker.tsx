'use client';

import { Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TimeSlot } from '@/lib/api/availability.service';

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: TimeSlot | null;
  availableSlots: TimeSlot[];
  onSelectDate: (date: Date) => void;
  onSelectTime: (slot: TimeSlot) => void;
  loading?: boolean;
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  availableSlots,
  onSelectDate,
  onSelectTime,
  loading = false,
  weekStart,
  onPrevWeek,
  onNextWeek,
}: DateTimePickerProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <div className="space-y-8">
      {/* Date Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Chọn ngày khám</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Tuần trước"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={onNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Tuần sau"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const isPast = day < today && !isSameDay(day, today);

            return (
              <button
                key={index}
                onClick={() => !isPast && onSelectDate(day)}
                disabled={isPast}
                className={`flex flex-col items-center rounded-xl p-4 transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                    : isPast
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                }`}
              >
                <span className="text-xs font-medium mb-1 uppercase">
                  {format(day, 'EEE', { locale: vi })}
                </span>
                <span className="text-2xl font-bold">{format(day, 'd')}</span>
                <span className="text-xs mt-1">
                  {format(day, 'MMM', { locale: vi })}
                </span>
                {isToday && !isSelected && (
                  <span className="text-xs mt-1 font-medium">Hôm nay</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900">Chọn giờ khám</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600">Đang tải lịch trống...</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">Không có lịch trống trong ngày này</p>
              <p className="text-sm text-gray-400 mt-2">Vui lòng chọn ngày khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedTime?.startTime === slot.startTime;
                const isAvailable = slot.isAvailable;

                return (
                  <button
                    key={index}
                    onClick={() => isAvailable && onSelectTime(slot)}
                    disabled={!isAvailable}
                    className={`p-4 rounded-xl border-2 transition-all font-medium ${
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-md scale-105'
                        : isAvailable
                        ? 'border-gray-200 hover:border-primary hover:bg-primary-50 hover:scale-105'
                        : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-lg">{slot.startTime}</div>
                    {!isAvailable && (
                      <div className="text-xs mt-1">Đã đầy</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Vui lòng chọn ngày khám trước</p>
        </div>
      )}
    </div>
  );
}
