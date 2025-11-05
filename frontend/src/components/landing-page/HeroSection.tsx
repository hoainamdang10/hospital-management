"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motion } from "motion/react";
import { Calendar, Heart, Phone, Stethoscope, Shield } from "lucide-react";

interface HeroSectionProps {
  onShowLogin: () => void;
}

export function HeroSection({ onShowLogin }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="py-20 px-6 relative">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              x: isVisible ? 0 : -50,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="space-y-4">
              <motion.h2
                className="text-5xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : 30,
                }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                Bệnh viện MediCare
                <motion.span
                  className="text-blue-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isVisible ? 1 : 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  {" "}
                  - Đồng hành cùng sức khỏe
                </motion.span>
              </motion.h2>
              <motion.p
                className="text-xl text-gray-600 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : 20,
                }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với đội
                ngũ bác sĩ giàu kinh nghiệm. Đặt lịch hẹn dễ dàng, chăm sóc tận
                tâm.
              </motion.p>
            </div>

            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 20,
              }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 shadow-lg"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Đặt lịch ngay
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 shadow-lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Liên hệ tư vấn
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-6 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                y: isVisible ? 0 : 30,
              }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              {[
                {
                  number: "15+",
                  label: "Năm kinh nghiệm",
                  color: "text-blue-600",
                },
                {
                  number: "50+",
                  label: "Bác sĩ chuyên khoa",
                  color: "text-green-600",
                },
                {
                  number: "24/7",
                  label: "Cấp cứu",
                  color: "text-orange-600",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    scale: isVisible ? 1 : 0.5,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 1 + index * 0.1,
                  }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <motion.div
                    className={`text-3xl font-bold ${stat.color}`}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              x: isVisible ? 0 : 50,
            }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <motion.div
              className="relative overflow-hidden rounded-2xl shadow-2xl"
              whileHover={{ scale: 1.02, rotateY: 5 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    "0 25px 50px -12px rgba(37, 99, 235, 0.3)",
                    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1565647946321-a146ac24a220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxoZWFsdGhjYXJlJTIwdGVhbSUyMGRvY3RvcnN8ZW58MXx8fHwxNzU5MTMzMDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Đội ngũ y tế chuyên nghiệp"
                  className="w-full h-[500px] object-cover"
                />
              </motion.div>
            </motion.div>

            {/* Floating Health Icons */}
            <motion.div
              className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Heart className="h-6 w-6 text-red-500" />
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg"
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            >
              <Stethoscope className="h-6 w-6 text-blue-500" />
            </motion.div>

            <motion.div
              className="absolute top-1/2 -right-6 bg-white p-3 rounded-full shadow-lg"
              animate={{
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Shield className="h-6 w-6 text-green-500" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
