"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<"vi" | "en">("vi");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nav = {
    vi: {
      home: "Trang chủ",
      findDoctor: "Tìm bác sĩ",
      departments: "Khoa phòng",
      appointments: "Đặt lịch",
      pricing: "Bảo hiểm",
      blog: "Tin tức",
      signIn: "Đăng nhập",
      bookAppointment: "Đặt lịch khám",
    },
    en: {
      home: "Home",
      findDoctor: "Find Doctor",
      departments: "Departments",
      appointments: "Appointments",
      pricing: "Insurance",
      blog: "Blog",
      signIn: "Sign in",
      bookAppointment: "Book appointment",
    },
  };

  const t = nav[lang];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-base ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs"
          : "bg-white"
      }`}
    >
      <div className="max-w-content mx-auto px-6">
        <nav className="flex items-center justify-between h-[68px]" aria-label="Main navigation">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-neutral-900 focus:outline-brand"
          >
            <svg className="w-8 h-8 text-brand" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
              <path d="M16 2L8 10h4v12h8V10h4L16 2zm-2 18v-8h4v8h-4z" />
              <rect x="4" y="26" width="24" height="2" />
            </svg>
            <span>Hospital Management</span>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            <li>
              <Link href="/" className="btn-ghost">
                {t.home}
              </Link>
            </li>
            <li>
              <Link href="#find-doctor" className="btn-ghost">
                {t.findDoctor}
              </Link>
            </li>
            <li>
              <Link href="#departments" className="btn-ghost">
                {t.departments}
              </Link>
            </li>
            <li>
              <Link href="#appointments" className="btn-ghost">
                {t.appointments}
              </Link>
            </li>
            <li>
              <Link href="#insurance" className="btn-ghost">
                {t.pricing}
              </Link>
            </li>
            <li>
              <Link href="#blog" className="btn-ghost">
                {t.blog}
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "vi" ? "en" : "vi")}
              className="btn-ghost text-sm"
              aria-label={`Switch to ${lang === "vi" ? "English" : "Vietnamese"}`}
            >
              {lang === "vi" ? "EN" : "VI"}
            </button>
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              {t.signIn}
            </Link>
            <Link href="/book" className="btn-primary">
              {t.bookAppointment}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
