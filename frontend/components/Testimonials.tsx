"use client";

import { useState } from "react";

export function Testimonials() {
  const [lang] = useState<"vi" | "en">("vi");

  const testimonials = {
    vi: [
      {
        quote: "Đặt lịch nhanh, bác sĩ khám đúng giờ. Rất hài lòng với dịch vụ!",
        author: "Nguyễn Thị Lan",
        role: "Bệnh nhân thường xuyên",
      },
      {
        quote: "Hệ thống hồ sơ điện tử giúp tôi theo dõi sức khỏe gia đình dễ dàng hơn.",
        author: "Trần Văn Nam",
        role: "Người dùng 2 năm",
      },
    ],
    en: [
      {
        quote: "Quick booking, doctor saw me on time. Very satisfied with the service!",
        author: "Nguyen Thi Lan",
        role: "Regular patient",
      },
      {
        quote: "Electronic records help me track my family's health much easier.",
        author: "Tran Van Nam",
        role: "2-year user",
      },
    ],
  };

  const copy = {
    vi: {
      title: "Bệnh nhân nói gì",
      viewMore: "Xem thêm đánh giá",
    },
    en: {
      title: "What patients say",
      viewMore: "View more reviews",
    },
  };

  const t = copy[lang];
  const items = testimonials[lang];

  return (
    <section className="py-20 bg-white" aria-labelledby="testimonials-title">
      <div className="max-w-content mx-auto px-6">
        <h2 id="testimonials-title" className="text-4xl font-bold text-neutral-900 mb-8">
          {t.title}
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {items.map((testimonial, index) => (
            <blockquote
              key={index}
              className="bg-neutral-50 p-6 rounded-card border border-neutral-200"
            >
              <p className="text-lg text-neutral-900 mb-4">"{testimonial.quote}"</p>
              <footer className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center font-bold text-brand">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-neutral-900">{testimonial.author}</cite>
                  <p className="text-sm text-neutral-600">{testimonial.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="text-center">
          <a href="/reviews" className="text-link font-medium hover:underline min-h-[44px] inline-flex items-center">
            {t.viewMore} →
          </a>
        </div>
      </div>
    </section>
  );
}
