'use client';

import Image from 'next/image';
import { Star, MapPin, Briefcase } from 'lucide-react';
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
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="overflow-hidden rounded-2xl border bg-white shadow-lg transition-shadow hover:shadow-xl"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start gap-4">
          <Image
            src={doctor.avatar}
            alt={doctor.name}
            width={80}
            height={80}
            className="rounded-full border-2 border-primary-100"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
            <p className="text-sm text-gray-600">{doctor.degree}</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{doctor.rating}</span>
              <span className="text-gray-500">({doctor.reviewCount} đánh giá)</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="h-4 w-4" />
            <span>{doctor.hospital}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{doctor.experience} năm kinh nghiệm</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Phí khám từ</span>
            <span className="text-lg font-bold text-primary">
              {doctor.priceFrom.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <Button onClick={() => onBookClick(doctor)} className="w-full">
            Xem lịch trống
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
