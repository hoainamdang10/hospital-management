"use client";

import { Heart, Phone, Mail, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold">MediCare Hospital</h4>
                <p className="text-blue-300 text-sm">
                  Chăm sóc sức khỏe hàng đầu
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Với hơn 15 năm kinh nghiệm, MediCare là bệnh viện uy tín hàng đầu,
              cam kết mang đến dịch vụ y tế chất lượng cao và sự chăm sóc tận
              tâm cho từng bệnh nhân.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Hoạt động 24/7</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-semibold mb-6 text-lg">Liên hệ</h5>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white">077 8486 888</div>
                  <div className="text-sm">Tổng đài</div>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-white">info@medicare.vn</div>
                  <div className="text-sm">Email chính</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-medium text-white">
                    Số 10 ngõ 14 Pháo Đài Láng, Láng Thượng
                  </div>
                  <div className="text-sm">Đống Đa, Hà Nội</div>
                </div>
              </li>
            </ul>

            {/* Working Hours */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h6 className="font-medium text-white mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Giờ làm việc
              </h6>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Thứ 2 - Chủ nhật: 7:00 - 21:00</div>
                <div className="text-green-400 font-medium">Cấp cứu: 24/7</div>
                <div className="text-blue-400 font-medium">
                  Hỗ trợ online: 24/7
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400">
                &copy; 2025 MediCare Hospital. Tất cả quyền được bảo lưu.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Giấy phép hoạt động số: 123/GP-YTĐB | Được cấp bởi Bộ Y tế
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                Điều khoản sử dụng
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
