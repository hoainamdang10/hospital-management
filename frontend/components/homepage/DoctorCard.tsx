'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Calendar, Clock, MapPin } from 'lucide-react';
import { useI18n, formatCurrency } from '@/lib/i18n';
import { Doctor } from '@/lib/mock';
import Link from 'next/link';

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: () => void;
}

export function DoctorCard({ doctor, onBookAppointment }: DoctorCardProps) {
  const { t, language } = useI18n();

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={doctor.avatar} alt={doctor.name} />
            <AvatarFallback className="text-lg font-semibold">
              {getUserInitials(doctor.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-1">
              {doctor.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {language === 'vi' ? doctor.departmentVi : doctor.department}
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{doctor.rating}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{doctor.years} {t('doctors.experience')}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant={doctor.isAvailable ? 'default' : 'secondary'} className="mb-2">
              {doctor.isAvailable ? t('booking.available') : t('booking.unavailable')}
            </Badge>
            <div className="text-sm font-medium text-primary">
              {formatCurrency(doctor.price, language)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Specialties */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">{t('doctors.specialties')}:</h4>
          <div className="flex flex-wrap gap-1">
            {(language === 'vi' ? doctor.specialtiesVi : doctor.specialties).map((specialty, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Availability Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                {language === 'vi' ? 'Hôm nay' : 'Today'}:
              </span>
            </div>
            <span className="font-medium text-green-600">
              {doctor.slotsToday} {t('doctors.slotsAvailable')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/doctors/${doctor.id}`}>
              {t('doctors.viewProfile')}
            </Link>
          </Button>
          
          <Button 
            size="sm" 
            className="flex-1"
            onClick={onBookAppointment}
            disabled={!doctor.isAvailable}
          >
            <Calendar className="h-4 w-4 mr-1" />
            {t('doctors.bookAppointment')}
          </Button>
        </div>

        {/* Quick Info */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>
                {language === 'vi' ? 'Khoa ' + doctor.departmentVi : doctor.department + ' Dept.'}
              </span>
            </div>
            <span>ID: {doctor.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
