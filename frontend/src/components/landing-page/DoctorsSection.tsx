"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FeaturedDoctor } from "./FeaturedDoctor";
import { DoctorCard } from "./DoctorCard";
import { mockDoctors } from "./data";
import { Doctor } from "./types";

interface DoctorsSectionProps {
  onBookAppointment: (doctor: Doctor) => void;
}

export function DoctorsSection({ onBookAppointment }: DoctorsSectionProps) {
  const [currentDoctorIndex, setCurrentDoctorIndex] = useState(0);

  // Auto-slideshow for doctors
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDoctorIndex((prev) => (prev + 1) % mockDoctors.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextDoctor = () => {
    setCurrentDoctorIndex((prev) => (prev + 1) % mockDoctors.length);
  };

  const prevDoctor = () => {
    setCurrentDoctorIndex(
      (prev) => (prev - 1 + mockDoctors.length) % mockDoctors.length
    );
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h3
            className="text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Đội ngũ bác sĩ
            <motion.span
              className="inline-block ml-2"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
            >
              ⭐
            </motion.span>
          </motion.h3>
          <motion.p
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân và luôn cập
            nhật kiến thức y học mới nhất
          </motion.p>
        </motion.div>

        {/* Featured Doctor Slideshow */}
        <FeaturedDoctor
          doctors={mockDoctors}
          currentDoctorIndex={currentDoctorIndex}
          onPrevDoctor={prevDoctor}
          onNextDoctor={nextDoctor}
          onSetCurrentDoctor={setCurrentDoctorIndex}
          onBookAppointment={onBookAppointment}
        />

        {/* All Doctors Grid */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h4 className="text-2xl font-bold text-gray-900 mb-2">
            Toàn bộ đội ngũ
          </h4>
          <p className="text-gray-600">
            Khám phá tất cả các chuyên gia y tế của chúng tôi
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockDoctors.map((doctor, index) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              index={index}
              onBookAppointment={onBookAppointment}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
