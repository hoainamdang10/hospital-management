"use client";

import { useState } from "react";
import { WaveEdge } from "./WaveEdge";

export function CtaBand() {
  const [lang] = useState<"vi" | "en">("vi");

  const copy = {
    vi: {
      title: "Sẵn sàng bắt đầu?",
      subtitle: "Đặt lịch khám ngay hôm nay và trải nghiệm chăm sóc sức khỏe hiện đại",
      cta: "Đặt lịch ngay",
      secondary: "Tìm hiểu thêm",
    },
    en: {
      title: "Ready to get started?",
      subtitle: "Book your appointment today and experience modern healthcare",
      cta: "Book now",
      secondary: "Learn more",
    },
  };

  const t = copy[lang];

  return (
    <section className="relative py-24 bg-gradient-to-br from-brand/5 to-link/5 overflow-hidden">
      {/* Top wave edge */}
      <div className="absolute top-0 left-0 right-0 rotate-180">
        <WaveEdge />
      </div>

      <div className="max-w-content mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 max-w-[20ch] mx-auto">
          {t.title}
        </h2>
        <p className="text-xl text-neutral-600 mb-8 max-w-[40ch] mx-auto">
          {t.subtitle}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/book" className="btn-primary">
            {t.cta}
          </a>
          <a href="/about" className="btn-secondary">
            {t.secondary}
          </a>
        </div>
      </div>

      {/* Bottom wave edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <WaveEdge />
      </div>
    </section>
  );
}
