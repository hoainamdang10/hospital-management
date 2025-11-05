"use client";

import { Button } from "../ui/button";
import { motion } from "motion/react";
import { Heart, Phone, UserCheck } from "lucide-react";

interface HeaderProps {
  onShowLogin: () => void;
}

export function Header({ onShowLogin }: HeaderProps) {
  return (
    <motion.header
      className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="p-2 bg-blue-600 rounded-lg"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(37, 99, 235, 0.3)",
                  "0 0 30px rgba(37, 99, 235, 0.5)",
                  "0 0 20px rgba(37, 99, 235, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                MediCare Hospital
              </h1>
              <p className="text-sm text-gray-600">
                Chăm sóc sức khỏe toàn diện
              </p>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={onShowLogin}>
                <UserCheck className="h-4 w-4 mr-2" />
                Đăng nhập nhân viên
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Hotline: 1900-1234
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
