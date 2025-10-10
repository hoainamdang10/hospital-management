"use client";

import { useState } from "react";

export function Insurance() {
  const [lang] = useState<"vi" | "en">("vi");

  const copy = {
    vi: {
      title: "Bảo hiểm & Giá cả",
      subtitle: "Chúng tôi chấp nhận hầu hết các loại bảo hiểm y tế và cam kết minh bạch về giá",
      acceptedInsurers: "Bảo hiểm được chấp nhận",
      viewPricing: "Xem bảng giá",
      security: {
        title: "Bảo mật & Tuân thủ",
        items: [
          "Mã hóa dữ liệu khi lưu trữ và truyền tải",
          "Nhật ký kiểm toán đầy đủ cho mọi truy cập",
          "Xin phép rõ ràng trước khi chia sẻ dữ liệu",
        ],
      },
    },
    en: {
      title: "Insurance & Pricing",
      subtitle: "We accept most health insurance plans and are committed to transparent pricing",
      acceptedInsurers: "Accepted insurers",
      viewPricing: "View pricing",
      security: {
        title: "Security & Compliance",
        items: [
          "Encrypted at rest and in transit",
          "Full audit trails for all access",
          "Explicit consent before data sharing",
        ],
      },
    },
  };

  const t = copy[lang];

  const insurers = [
    "Bảo Việt",
    "Bảo Minh",
    "Prudential",
    "Manulife",
    "AIA",
    "Generali",
  ];

  return (
    <section id="insurance" className="py-20 bg-neutral-50" aria-labelledby="insurance-title">
      <div className="max-w-content mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Insurance */}
          <div>
            <h2 id="insurance-title" className="text-4xl font-bold text-neutral-900 mb-3">
              {t.title}
            </h2>
            <p className="text-lg text-neutral-600 mb-8">{t.subtitle}</p>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">{t.acceptedInsurers}</h3>
              <div className="grid grid-cols-3 gap-4">
                {insurers.map((insurer, index) => (
                  <div
                    key={index}
                    className="bg-white border border-neutral-200 rounded-lg p-4 text-center font-medium text-neutral-700 min-h-[60px] flex items-center justify-center"
                  >
                    {insurer}
                  </div>
                ))}
              </div>
            </div>

            <a href="/pricing" className="btn-secondary">
              {t.viewPricing}
            </a>
          </div>

          {/* Right: Security */}
          <div className="bg-white p-8 rounded-card border border-neutral-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{t.security.title}</h3>
                <ul className="space-y-3">
                  {t.security.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-success mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-neutral-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
