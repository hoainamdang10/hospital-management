"use client";

import { useState } from "react";
import specialtiesData from "@/data/specialties.json";

export function DepartmentsGrid() {
  const [lang] = useState<"vi" | "en">("vi");

  const copy = {
    vi: {
      title: "Khoa phòng",
      viewAll: "Xem tất cả khoa",
    },
    en: {
      title: "Departments",
      viewAll: "View all departments",
    },
  };

  const t = copy[lang];

  return (
    <section id="departments" className="py-20 bg-neutral-50" aria-labelledby="departments-title">
      <div className="max-w-content mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 id="departments-title" className="text-4xl font-bold text-neutral-900">
            {t.title}
          </h2>
          <a href="/departments" className="text-link font-medium hover:underline min-h-[44px] flex items-center">
            {t.viewAll} →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {specialtiesData.map((specialty) => (
            <a
              key={specialty.id}
              href={`/departments/${specialty.id}`}
              className="group flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-lg transition-all duration-fast hover:-translate-y-1 hover:border-brand hover:shadow-xs min-h-[80px]"
            >
              <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center group-hover:bg-brand transition-colors">
                <svg
                  className="w-6 h-6 text-brand group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-medium text-neutral-900 group-hover:text-brand transition-colors">
                {lang === "vi" ? specialty.name : specialty.nameEn}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
