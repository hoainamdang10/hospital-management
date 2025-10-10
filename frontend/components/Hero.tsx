"use client";

import { useState, useEffect } from "react";
import { WaveEdge } from "./WaveEdge";

export function Hero() {
  const [lang] = useState<"vi" | "en">("vi");
  const [availabilityData, setAvailabilityData] = useState({
    earliestSlot: "14:30",
    doctorsOnline: 18,
    medianWait: 12,
    lastUpdated: new Date(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAvailabilityData((prev) => ({
        ...prev,
        doctorsOnline: Math.floor(Math.random() * 5) + 16,
        lastUpdated: new Date(),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDataStale = Date.now() - availabilityData.lastUpdated.getTime() > 60000;

  const copy = {
    vi: {
      h1: "Chăm sóc thông minh, an toàn — không cần chờ lâu.",
      proofline: `Thời gian chờ trung bình hôm nay: ${availabilityData.medianWait} phút · ${availabilityData.doctorsOnline} bác sĩ đang trực tuyến`,
      ctaPrimary: "Đặt lịch ngay",
      ctaSecondary: "Tìm bác sĩ",
      quickSearchLabel: "Tìm kiếm nhanh",
      specialtyPlaceholder: "Chuyên khoa",
      doctorPlaceholder: "Bác sĩ",
      datePlaceholder: "Ngày khám",
      searchButton: "Tìm kiếm",
      availabilityTitle: "Lịch hôm nay",
      earliestSlot: "Lịch sớm nhất",
      doctorsOnline: "Bác sĩ trực tuyến",
      medianWait: "Thời gian chờ",
      dataDelayed: "Dữ liệu bị trễ",
    },
    en: {
      h1: "Smart, secure care — without the wait.",
      proofline: `Average wait today: ${availabilityData.medianWait} min · ${availabilityData.doctorsOnline} doctors available now`,
      ctaPrimary: "Book now",
      ctaSecondary: "Find a doctor",
      quickSearchLabel: "Quick search",
      specialtyPlaceholder: "Specialty",
      doctorPlaceholder: "Doctor",
      datePlaceholder: "Date",
      searchButton: "Search",
      availabilityTitle: "Today's Availability",
      earliestSlot: "Earliest slot",
      doctorsOnline: "Doctors online",
      medianWait: "Median wait",
      dataDelayed: "Data delayed",
    },
  };

  const t = copy[lang];

  return (
    <section className="relative bg-white pt-12 pb-24 overflow-hidden" aria-label="Hero section">
      <div className="max-w-content mx-auto px-6">
        <div className="grid grid-cols-12 gap-gutter items-start">
          {/* Left: 7 columns */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight max-w-[18ch]">
                {t.h1}
              </h1>
              <p className="text-lg text-neutral-600">{t.proofline}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#book" className="btn-primary">
                {t.ctaPrimary}
              </a>
              <a href="#find-doctor" className="btn-secondary">
                {t.ctaSecondary}
              </a>
            </div>

            {/* Quick Search */}
            <div
              className="bg-neutral-50 rounded-pill p-2 flex flex-wrap gap-2 border border-neutral-200"
              role="search"
              aria-label={t.quickSearchLabel}
            >
              <select
                className="flex-1 min-w-[120px] px-4 py-3 bg-white border border-neutral-200 rounded-pill focus:ring-2 focus:ring-brand focus:border-brand"
                aria-label={t.specialtyPlaceholder}
              >
                <option>{t.specialtyPlaceholder}</option>
                <option>Tim mạch / Cardiology</option>
                <option>Nội khoa / Internal Medicine</option>
                <option>Nhi khoa / Pediatrics</option>
              </select>
              <input
                type="text"
                placeholder={t.doctorPlaceholder}
                className="flex-1 min-w-[120px] px-4 py-3 bg-white border border-neutral-200 rounded-pill focus:ring-2 focus:ring-brand focus:border-brand"
                aria-label={t.doctorPlaceholder}
              />
              <input
                type="date"
                placeholder={t.datePlaceholder}
                className="flex-1 min-w-[140px] px-4 py-3 bg-white border border-neutral-200 rounded-pill focus:ring-2 focus:ring-brand focus:border-brand"
                aria-label={t.datePlaceholder}
              />
              <button
                type="submit"
                className="btn-primary"
                aria-label={t.searchButton}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right: 5 columns - Availability Card */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-gradient-to-br from-neutral-50 to-white border border-neutral-200 rounded-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">{t.availabilityTitle}</h2>
                {isDataStale && (
                  <span className="px-3 py-1 bg-accent-amber/10 text-accent-amber text-xs font-medium rounded-pill">
                    {t.dataDelayed}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-100">
                  <div>
                    <div className="text-sm text-neutral-600">{t.earliestSlot}</div>
                    <div className="text-2xl font-mono font-bold text-brand">{availabilityData.earliestSlot}</div>
                  </div>
                  <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-neutral-100">
                    <div className="text-sm text-neutral-600">{t.doctorsOnline}</div>
                    <div className="text-3xl font-mono font-bold text-neutral-900">{availabilityData.doctorsOnline}</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-neutral-100">
                    <div className="text-sm text-neutral-600">{t.medianWait}</div>
                    <div className="text-3xl font-mono font-bold text-neutral-900">{availabilityData.medianWait}<span className="text-lg">min</span></div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="h-12 flex items-end gap-1">
                  {[8, 12, 10, 14, 11, 9, 12, 15, 13, 12].map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-accent-cyan/60 rounded-t"
                      style={{ height: `${(val / 15) * 100}%` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-xs text-neutral-500 text-center">Wait time trend (last 5 hours)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave edge at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <WaveEdge />
      </div>
    </section>
  );
}
