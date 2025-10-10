"use client";

import { useState } from "react";

export function QuickActions() {
  const [lang] = useState<"vi" | "en">("vi");

  const actions = {
    vi: [
      {
        title: "Đặt lịch khám",
        icon: "calendar",
        href: "/book",
      },
      {
        title: "Kết quả xét nghiệm",
        icon: "clipboard",
        href: "/lab-results",
      },
      {
        title: "Đơn thuốc",
        icon: "pill",
        href: "/prescriptions",
      },
      {
        title: "Thanh toán",
        icon: "credit-card",
        href: "/billing",
      },
    ],
    en: [
      {
        title: "Book Appointment",
        icon: "calendar",
        href: "/book",
      },
      {
        title: "Lab Results",
        icon: "clipboard",
        href: "/lab-results",
      },
      {
        title: "Refill Prescription",
        icon: "pill",
        href: "/prescriptions",
      },
      {
        title: "Pay Bill",
        icon: "credit-card",
        href: "/billing",
      },
    ],
  };

  const items = actions[lang];

  const iconPaths = {
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    pill: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
    "credit-card": "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-content mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="group flex flex-col items-center justify-center min-h-[140px] p-6 bg-neutral-50 rounded-card border border-neutral-200 transition-all duration-fast hover:-translate-y-1 hover:bg-brand hover:border-brand hover:text-white hover:shadow-xs focus-visible:outline-2 focus-visible:outline-brand"
            >
              <svg
                className="w-10 h-10 mb-3 text-brand group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={iconPaths[action.icon as keyof typeof iconPaths]}
                />
              </svg>
              <span className="text-center font-semibold text-neutral-900 group-hover:text-white transition-colors">
                {action.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
