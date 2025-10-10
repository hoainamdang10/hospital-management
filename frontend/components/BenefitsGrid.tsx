"use client";

import { useState } from "react";

export function BenefitsGrid() {
  const [lang] = useState<"vi" | "en">("vi");

  const benefits = {
    vi: [
      {
        metric: "97%",
        label: "Khám đúng giờ",
        description: "Các cuộc hẹn bắt đầu đúng trong vòng 5 phút so với giờ đã đặt",
      },
      {
        metric: "24/7",
        label: "Hỗ trợ khẩn cấp",
        description: "Đường dây nóng y tế và tư vấn trực tuyến mọi lúc",
      },
      {
        metric: "12 phút",
        label: "Thời gian chờ trung bình",
        description: "Từ khi đăng ký đến khi gặp bác sĩ (thấp hơn 60% so với trung bình ngành)",
      },
      {
        metric: "256-bit",
        label: "Mã hóa dữ liệu",
        description: "Hồ sơ y tế được mã hóa khi lưu trữ và truyền tải, đạt chuẩn HIPAA",
      },
    ],
    en: [
      {
        metric: "97%",
        label: "On-time starts",
        description: "Appointments begin within 5 minutes of scheduled time",
      },
      {
        metric: "24/7",
        label: "Emergency support",
        description: "Medical hotline and online consultation anytime",
      },
      {
        metric: "12 min",
        label: "Average wait time",
        description: "From check-in to seeing your doctor (60% below industry average)",
      },
      {
        metric: "256-bit",
        label: "Data encryption",
        description: "Medical records encrypted at rest and in transit, HIPAA-compliant",
      },
    ],
  };

  const copy = {
    vi: {
      title: "Tại sao chọn chúng tôi",
      subtitle: "Các con số thực tế, không phải lời hứa suông",
    },
    en: {
      title: "Why choose us",
      subtitle: "Real outcomes, not empty promises",
    },
  };

  const t = copy[lang];
  const items = benefits[lang];

  return (
    <section className="py-20 bg-neutral-50" aria-labelledby="benefits-title">
      <div className="max-w-content mx-auto px-6">
        <div className="text-left mb-12">
          <h2 id="benefits-title" className="text-4xl font-bold text-neutral-900 mb-3">
            {t.title}
          </h2>
          <p className="text-lg text-neutral-600">{t.subtitle}</p>
        </div>

        {/* Staggered grid - NOT equal 3-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-card border border-neutral-200 transition-transform duration-fast hover:-translate-y-1 hover:shadow-xs ${
                index === 0 ? "lg:row-span-1" : ""
              } ${index === 2 ? "lg:col-span-2" : ""}`}
            >
              <div className="space-y-3">
                <div className="text-4xl font-mono font-bold text-brand">{item.metric}</div>
                <h3 className="text-xl font-semibold text-neutral-900">{item.label}</h3>
                <p className="text-neutral-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
