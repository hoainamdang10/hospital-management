'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, DollarSign, AlertCircle } from 'lucide-react';
import { useI18n, formatCurrency } from '@/lib/i18n';
import { mockDoctors, mockDepartments, Doctor, MockSession } from '@/lib/mock';
import { toast } from 'sonner';

interface BookingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  session?: MockSession;
}

export function BookingWidget({ isOpen, onClose, session }: BookingWidgetProps) {
  const { t, language } = useI18n();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'telehealth'>('in-person');
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn = !!session?.user;

  // Filter doctors by selected department
  const availableDoctors = selectedDepartment
    ? mockDoctors.filter(doctor => 
        doctor.department.toLowerCase() === selectedDepartment.toLowerCase() ||
        doctor.departmentVi.toLowerCase() === selectedDepartment.toLowerCase()
      )
    : [];

  // Get selected doctor details
  const selectedDoctorData = selectedDoctor
    ? mockDoctors.find(doctor => doctor.id === selectedDoctor)
    : null;

  // Generate available time slots (mock)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Generate available dates (next 14 days, excluding weekends)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      toast.error(t('booking.loginRequired'));
      return;
    }

    if (!selectedDepartment || !selectedDoctor || !selectedDate || !selectedTime) {
      toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        language === 'vi' 
          ? `Đặt lịch thành công! Lịch khám ${selectedDate} lúc ${selectedTime}` 
          : `Appointment booked successfully! ${selectedDate} at ${selectedTime}`
      );
      
      // Reset form
      setSelectedDepartment('');
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      onClose();
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('booking.title')}
          </DialogTitle>
          <DialogDescription>
            {language === 'vi' 
              ? 'Chọn thông tin để đặt lịch khám bệnh'
              : 'Select information to book your medical appointment'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Department Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('booking.department')}</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder={t('booking.selectDepartment')} />
              </SelectTrigger>
              <SelectContent>
                {mockDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex items-center gap-2">
                      <span>{dept.icon}</span>
                      <span>{language === 'vi' ? dept.nameVi : dept.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Selection */}
          {selectedDepartment && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('booking.doctor')}</label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.selectDoctor')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{doctor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {doctor.years} {t('doctors.experience')} • ⭐ {doctor.rating}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doctor.isAvailable ? 'default' : 'secondary'}>
                            {doctor.isAvailable ? t('booking.available') : t('booking.unavailable')}
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatCurrency(doctor.price, language)}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Doctor Info */}
          {selectedDoctorData && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    👨‍⚕️
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{selectedDoctorData.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {language === 'vi' ? selectedDoctorData.departmentVi : selectedDoctorData.department}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>⭐ {selectedDoctorData.rating}</span>
                      <span>{selectedDoctorData.years} {t('doctors.experience')}</span>
                      <span className="font-medium text-primary">
                        {formatCurrency(selectedDoctorData.price, language)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appointment Type */}
          {selectedDoctor && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('booking.type')}</label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    appointmentType === 'in-person' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setAppointmentType('in-person')}
                >
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">{t('booking.inPerson')}</div>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-colors ${
                    appointmentType === 'telehealth' ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setAppointmentType('telehealth')}
                >
                  <CardContent className="p-4 text-center">
                    <Video className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">{t('booking.telehealth')}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Date Selection */}
          {selectedDoctor && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('booking.date')}</label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.date')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDateDisplay(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('booking.time')}</label>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Login Warning */}
          {!isLoggedIn && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{t('booking.loginRequired')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedDepartment || !selectedDoctor || !selectedDate || !selectedTime || isLoading}
              className="flex-1"
            >
              {isLoading ? t('common.loading') : t('booking.submit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
