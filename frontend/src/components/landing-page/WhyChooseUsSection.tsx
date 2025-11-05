"use client";

import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Shield, Award, Clock, Heart } from "lucide-react";

export function WhyChooseUsSection() {
  return (
    <section className="py-20 px-6 bg-white/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-4xl font-bold text-gray-900 mb-8">
              Tại sao chọn MediCare?
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    An toàn và tin cậy
                  </h4>
                  <p className="text-gray-600">
                    Tuân thủ nghiêm ngặt các quy định về an toàn y tế và bảo mật
                    thông tin bệnh nhân
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Chất lượng hàng đầu
                  </h4>
                  <p className="text-gray-600">
                    Đạt các chứng nhận quốc tế về chất lượng dịch vụ y tế
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tiết kiệm thời gian
                  </h4>
                  <p className="text-gray-600">
                    Đặt lịch trực tuyến nhanh chóng, không cần chờ đợi
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Tận tâm chăm sóc
                  </h4>
                  <p className="text-gray-600">
                    Đội ngũ y bác sĩ luôn đặt sức khỏe bệnh nhân lên hàng đầu
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1565647946321-a146ac24a220?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxoZWFsdGhjYXJlJTIwdGVhbSUyMGRvY3RvcnN8ZW58MXx8fHwxNzU5MTMzMDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Đội ngũ y tế"
              className="w-full h-[400px] object-cover rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
