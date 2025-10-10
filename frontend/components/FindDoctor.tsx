"use client";

import { useState } from "react";
import doctorsData from "@/data/doctors.json";

export function FindDoctor() {
  const [lang] = useState<"vi" | "en">("vi");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const copy = {
    vi: {
      title: "Tìm bác sĩ phù hợp",
      subtitle: "Lọc theo chuyên khoa, bệnh viện, ngôn ngữ và thời gian khám",
      filters: {
        all: "Tất cả",
        available: "Có lịch hôm nay",
        online: "Đang trực tuyến",
        english: "Nói tiếng Anh",
      },
      viewProfile: "Xem hồ sơ",
      bookNow: "Đặt lịch",
      rating: "đánh giá",
      experience: "Kinh nghiệm",
      languages: "Ngôn ngữ",
      nextSlot: "Lịch tiếp theo",
      onlineNow: "Đang trực tuyến",
      noSlotToday: "Không có lịch hôm nay",
    },
    en: {
      title: "Find the right doctor",
      subtitle: "Filter by specialty, hospital, language, and availability",
      filters: {
        all: "All",
        available: "Available today",
        online: "Online now",
        english: "Speaks English",
      },
      viewProfile: "View profile",
      bookNow: "Book now",
      rating: "reviews",
      experience: "Experience",
      languages: "Languages",
      nextSlot: "Next slot",
      onlineNow: "Online now",
      noSlotToday: "No slots today",
    },
  };

  const t = copy[lang];

  const filters = [
    { id: "all", label: t.filters.all },
    { id: "available", label: t.filters.available },
    { id: "online", label: t.filters.online },
    { id: "english", label: t.filters.english },
  ];

  const filteredDoctors = doctorsData.filter((doctor) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "available") return doctor.nextSlot.includes("Hôm nay") || doctor.nextSlot.includes("Today");
    if (selectedFilter === "online") return doctor.onlineNow;
    if (selectedFilter === "english") return doctor.languages.includes("English");
    return true;
  });

  return (
    <section id="find-doctor" className="py-20 bg-white" aria-labelledby="find-doctor-title">
      <div className="max-w-content mx-auto px-6">
        <div className="text-left mb-8">
          <h2 id="find-doctor-title" className="text-4xl font-bold text-neutral-900 mb-3">
            {t.title}
          </h2>
          <p className="text-lg text-neutral-600">{t.subtitle}</p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-3 mb-8" role="tablist" aria-label="Doctor filters">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-5 py-2.5 rounded-pill font-medium transition-all duration-fast min-h-[44px] ${
                selectedFilter === filter.id
                  ? "bg-brand text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
              role="tab"
              aria-selected={selectedFilter === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Doctor cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.slice(0, 6).map((doctor) => (
            <article
              key={doctor.id}
              className="bg-white border border-neutral-200 rounded-card p-6 transition-all duration-fast hover:-translate-y-[2px] hover:shadow-xs active:opacity-96"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand">
                  {doctor.name.split(" ").slice(-1)[0].charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">{doctor.name}</h3>
                  <p className="text-sm text-neutral-600">{lang === "vi" ? doctor.specialty : doctor.specialtyEn}</p>
                  <p className="text-xs text-neutral-500 mt-1">{doctor.hospital}</p>
                </div>
                {doctor.onlineNow && (
                  <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-pill">
                    {t.onlineNow}
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{doctor.rating}</span>
                  <span className="text-neutral-500">({doctor.reviewCount} {t.rating})</span>
                </div>
                <div className="text-neutral-600">
                  {t.experience}: {lang === "vi" ? doctor.experience : doctor.experienceEn}
                </div>
                <div className="text-neutral-600">
                  {t.languages}: {doctor.languages.join(", ")}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-600">{t.nextSlot}:</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-pill ${
                    (doctor.nextSlot.includes("Hôm nay") || doctor.nextSlot.includes("Today"))
                      ? "bg-accent-cyan/10 text-accent-cyan"
                      : "bg-neutral-100 text-neutral-700"
                  }`}>
                    {lang === "vi" ? doctor.nextSlot : doctor.nextSlotEn}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a href={`/doctors/${doctor.id}`} className="flex-1 btn-ghost text-center text-sm">
                    {t.viewProfile}
                  </a>
                  <a href={`/book/${doctor.id}`} className="flex-1 btn-primary text-center text-sm">
                    {t.bookNow}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p>{lang === "vi" ? "Không tìm thấy bác sĩ phù hợp" : "No doctors match your filters"}</p>
            <button
              onClick={() => setSelectedFilter("all")}
              className="mt-4 text-link underline hover:no-underline"
            >
              {lang === "vi" ? "Xóa bộ lọc" : "Clear filters"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
