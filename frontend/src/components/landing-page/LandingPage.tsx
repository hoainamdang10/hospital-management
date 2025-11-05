"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import { ServicesSection } from "./ServicesSection";
import { DoctorsSection } from "./DoctorsSection";
import { WhyChooseUsSection } from "./WhyChooseUsSection";
import { BookingDialog } from "./BookingDialog";
import { Footer } from "./Footer";
import { ChatBot } from "../communication/ChatBot";
import { ContactSection } from "../communication/ContactSection";
import { Doctor, AppointmentForm } from "./types";

interface LandingPageProps {
  onShowLogin: () => void;
  onBookAppointment?: (data: any) => void;
}

export function LandingPage({
  onShowLogin,
  onBookAppointment,
}: LandingPageProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    doctorId: "",
    patientName: "",
    phone: "",
    email: "",
    appointmentDate: "",
    appointmentTime: "",
    symptoms: "",
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate booking submission
    alert("Đặt lịch thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");
    setIsBookingOpen(false);
    setAppointmentForm({
      doctorId: "",
      patientName: "",
      phone: "",
      email: "",
      appointmentDate: "",
      appointmentTime: "",
      symptoms: "",
    });
  };

  const openBookingDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentForm((prev) => ({
      ...prev,
      doctorId: doctor.id,
    }));
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-blue-200/30 rounded-full"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-cyan-200/30 rounded-full"
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 25, -15, 0],
            scale: [1, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-40 h-40 bg-teal-200/20 rounded-full"
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        <motion.div
          className="absolute top-1/2 right-10 w-20 h-20 bg-blue-300/40 rounded-full"
          animate={{
            x: [0, -35, 25, 0],
            y: [0, 35, -25, 0],
            scale: [1, 1.3, 0.7, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Header */}
      <Header onShowLogin={onShowLogin} />

      {/* Hero Section */}
      <HeroSection onShowLogin={onShowLogin} />

      {/* Services Section */}
      <ServicesSection />

      {/* Doctors Section */}
      <DoctorsSection onBookAppointment={openBookingDialog} />

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Booking Dialog */}
      <BookingDialog
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedDoctor={selectedDoctor}
        appointmentForm={appointmentForm}
        onFormChange={setAppointmentForm}
        onSubmit={handleBookingSubmit}
      />

      {/* ChatBot */}
      <ChatBot onBookAppointment={onBookAppointment} />
    </div>
  );
}
