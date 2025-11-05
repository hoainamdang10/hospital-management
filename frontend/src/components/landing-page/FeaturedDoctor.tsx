"use client";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  Phone,
  Star,
  CheckCircle,
  Award,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Doctor } from "./types";

interface FeaturedDoctorProps {
  doctors: Doctor[];
  currentDoctorIndex: number;
  onPrevDoctor: () => void;
  onNextDoctor: () => void;
  onSetCurrentDoctor: (index: number) => void;
  onBookAppointment: (doctor: Doctor) => void;
}

export function FeaturedDoctor({
  doctors,
  currentDoctorIndex,
  onPrevDoctor,
  onNextDoctor,
  onSetCurrentDoctor,
  onBookAppointment,
}: FeaturedDoctorProps) {
  return (
    <motion.div
      className="relative mb-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center mb-8">
        <motion.h4
          className="text-2xl font-bold text-gray-900 mb-2"
          animate={{
            background: [
              "linear-gradient(45deg, #2563eb, #06b6d4)",
              "linear-gradient(45deg, #06b6d4, #10b981)",
              "linear-gradient(45deg, #10b981, #2563eb)",
            ],
          }}
          style={{
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Bác sĩ nổi bật
        </motion.h4>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDoctorIndex}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.8 }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
            }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center"
          >
            {/* Doctor Image */}
            <motion.div
              className="relative mx-auto lg:mx-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-64 h-64 rounded-full overflow-hidden border-8 border-white shadow-2xl relative"
                animate={{
                  boxShadow: [
                    "0 0 30px rgba(37, 99, 235, 0.3)",
                    "0 0 50px rgba(37, 99, 235, 0.5)",
                    "0 0 30px rgba(37, 99, 235, 0.3)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <ImageWithFallback
                  src={doctors[currentDoctorIndex].avatar}
                  alt={doctors[currentDoctorIndex].name}
                  className="w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-green-500 p-3 rounded-full shadow-lg"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <CheckCircle className="h-6 w-6 text-white" />
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 bg-yellow-500 p-3 rounded-full shadow-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -180, -360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Award className="h-6 w-6 text-white" />
              </motion.div>
            </motion.div>

            {/* Doctor Info */}
            <div className="lg:col-span-2 text-center lg:text-left space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h5 className="text-3xl font-bold text-gray-900 mb-2">
                  {doctors[currentDoctorIndex].name}
                </h5>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 text-lg">
                    {doctors[currentDoctorIndex].specialty}
                  </Badge>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex items-center justify-center lg:justify-start gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale:
                        i < Math.floor(doctors[currentDoctorIndex].rating)
                          ? [1, 1.2, 1]
                          : 1,
                      rotate:
                        i < Math.floor(doctors[currentDoctorIndex].rating)
                          ? [0, 360]
                          : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.1,
                      repeat:
                        i < Math.floor(doctors[currentDoctorIndex].rating)
                          ? Infinity
                          : 0,
                      repeatDelay: 3,
                    }}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i < Math.floor(doctors[currentDoctorIndex].rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  </motion.div>
                ))}
                <span className="text-lg text-gray-600 ml-2 font-medium">
                  ({doctors[currentDoctorIndex].rating})
                </span>
              </motion.div>

              <motion.p
                className="text-lg text-gray-600 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {doctors[currentDoctorIndex].description} với{" "}
                <span className="font-semibold text-blue-600">
                  {doctors[currentDoctorIndex].experience}
                </span>{" "}
                kinh nghiệm trong lĩnh vực y tế.
              </motion.p>

              <motion.div
                className="bg-white/50 p-4 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h6 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Lịch làm việc
                </h6>
                <div className="space-y-1">
                  {doctors[currentDoctorIndex].schedules.map(
                    (schedule, idx) => (
                      <motion.div
                        key={idx}
                        className="text-sm text-gray-600"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.6 + idx * 0.1,
                        }}
                      >
                        {schedule}
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() =>
                      onBookAppointment(doctors[currentDoctorIndex])
                    }
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Đặt lịch ngay
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Tư vấn trực tiếp
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <motion.button
          onClick={onPrevDoctor}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
        </motion.button>

        <div className="flex gap-2">
          {doctors.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => onSetCurrentDoctor(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentDoctorIndex
                  ? "bg-blue-600 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>

        <motion.button
          onClick={onNextDoctor}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
        </motion.button>
      </div>
    </motion.div>
  );
}
