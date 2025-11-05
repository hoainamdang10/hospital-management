"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motion } from "motion/react";
import { Calendar, Star } from "lucide-react";
import { Doctor } from "./types";

interface DoctorCardProps {
  doctor: Doctor;
  index: number;
  onBookAppointment: (doctor: Doctor) => void;
}

export function DoctorCard({
  doctor,
  index,
  onBookAppointment,
}: DoctorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        y: -15,
        scale: 1.03,
        transition: { duration: 0.3 },
      }}
    >
      <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group border-2 hover:border-blue-200">
        <CardHeader className="text-center">
          <motion.div
            className="relative w-24 h-24 mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="w-full h-full rounded-full overflow-hidden border-4 border-blue-100 group-hover:border-blue-300 transition-colors"
              whileHover={{
                boxShadow: "0 0 25px rgba(37, 99, 235, 0.4)",
              }}
            >
              <ImageWithFallback
                src={doctor.avatar}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">
              {doctor.name}
            </CardTitle>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Badge className="bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors duration-300">
                {doctor.specialty}
              </Badge>
            </motion.div>
          </motion.div>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <motion.div
            className="flex items-center justify-center gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                whileHover={{
                  scale: 1.3,
                  rotate: 360,
                }}
                transition={{ duration: 0.3 }}
              >
                <Star
                  className={`h-4 w-4 ${
                    i < Math.floor(doctor.rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              </motion.div>
            ))}
            <span className="text-sm text-gray-600 ml-1">
              ({doctor.rating})
            </span>
          </motion.div>
          <motion.p
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            {doctor.experience} kinh nghiệm
          </motion.p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => onBookAppointment(doctor)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Đặt lịch hẹn
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
