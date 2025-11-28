'use client';

import Image from 'next/image';
import { Star, MapPin, Briefcase, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialtyId: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  avatar: string;
  experience: number;
  locations: string[];
}

interface DoctorCardProps {
  doctor: Doctor;
  onBookClick: (doctor: Doctor) => void;
}

export function DoctorCard({ doctor, onBookClick }: DoctorCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:ring-primary/20"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-100">
          <Image
            src={doctor.avatar}
            alt={doctor.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-lg font-bold text-slate-900">{doctor.name}</h3>
          <p className="truncate text-sm font-medium text-primary">{doctor.degree}</p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-900">{doctor.rating}</span>
            <span className="text-slate-500">({doctor.reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Briefcase className="h-4 w-4 text-slate-400" />
          <span className="truncate">{doctor.hospital}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>{doctor.experience} năm kinh nghiệm</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="truncate">{doctor.locations?.[0] || 'TP. Hồ Chí Minh'}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Giá khám từ</p>
          <p className="text-lg font-bold text-primary">
            {doctor.priceFrom.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <Button onClick={() => onBookClick(doctor)} className="rounded-full px-6 shadow-sm">
          Đặt lịch
        </Button>
      </div>
    </motion.div>
  );
}
