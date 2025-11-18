'use client';

import { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Clock, Calendar, ChevronDown } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
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
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  
  const currentMonth = selectedDate || today;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-8">
      {/* Date Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Chọn ngày khám
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFullCalendar(!showFullCalendar)}
              className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              {showFullCalendar ? 'Tuần' : 'Lịch đầy đủ'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFullCalendar ? 'rotate-180' : ''}`} />
            </button>
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

        {/* Week View (Default) */}
        {!showFullCalendar && (
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
                  className={`flex flex-col items-center rounded-lg p-2 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isToday
                      ? 'bg-blue-50 text-blue-600 border border-blue-300'
                      : isPast
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-xs font-medium uppercase">
                    {format(day, 'EEE', { locale: vi })}
                  </span>
                  <span className="text-xl font-bold my-1">{format(day, 'd')}</span>
                  <span className="text-xs">
                    {format(day, 'MMM', { locale: vi })}
                  </span>
                  {isToday && !isSelected && (
                    <span className="text-xs font-medium mt-0.5">Hôm nay</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Full Calendar View */}
        {showFullCalendar && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
              </h3>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => (
                <div key={`header-${i}`} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
              
              {/* Padding days to align with Monday start */}
              {(() => {
                const firstDay = monthDays[0];
                const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ...
                const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0 padding, Tuesday = 1, ..., Sunday = 6
                return Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`padding-${i}`} className="h-10" />
                ));
              })()}
              
              {/* Calendar days */}
              {monthDays.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const isPast = day < today && !isSameDay(day, today);

                return (
                  <button
                    key={index}
                    onClick={() => !isPast && onSelectDate(day)}
                    disabled={isPast}
                    className={`h-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 border border-blue-400'
                        : isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'bg-white hover:bg-blue-50 hover:border-blue-300 border border-gray-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
          ) : !availableSlots || availableSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">Không có lịch trống trong ngày này</p>
              <p className="text-sm text-gray-400 mt-2">Vui lòng chọn ngày khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSlots
                .filter(slot => {
                  // Only show hourly slots (xx:00), skip half-hour slots (xx:30)
                  const minute = new Date(slot.startTime).getMinutes();
                  return minute === 0;
                })
                .map((slot, index) => {
                const isSelected = selectedTime?.startTime === slot.startTime;
                const isAvailable = slot.isAvailable;
                
                // Format time from ISO string (2025-11-18T08:00:00.000Z) to HH:mm
                const timeDisplay = slot.formattedTime || format(new Date(slot.startTime), 'HH:mm');
                
                // Determine time period for color
                const hour = new Date(slot.startTime).getHours();
                const periodColor = hour < 12 
                  ? 'bg-amber-50 border-amber-200 hover:border-amber-400' 
                  : hour < 18 
                  ? 'bg-blue-50 border-blue-200 hover:border-blue-400' 
                  : 'bg-indigo-50 border-indigo-200 hover:border-indigo-400';

                return (
                  <button
                    key={index}
                    onClick={() => isAvailable && onSelectTime(slot)}
                    disabled={!isAvailable}
                    className={`p-4 rounded-lg border-2 transition-all font-medium flex items-center gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                        : isAvailable
                        ? `${periodColor} hover:bg-blue-100 hover:shadow-md`
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-700' : 'bg-white'}`}>
                      <Clock className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <div className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {timeDisplay}
                    </div>
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
