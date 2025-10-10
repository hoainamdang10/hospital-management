"use client";

import { useState } from "react";

export function Footer() {
  const [lang, setLang] = useState<"vi" | "en">("vi");

  const footer = {
    vi: {
      tagline: "Chăm sóc sức khỏe hiện đại, an toàn và đáng tin cậy",
      emergency: {
        title: "Khẩn cấp 24/7",
        phone: "115",
        note: "Cuộc gọi miễn phí từ mọi mạng",
      },
      sections: [
        {
          title: "Bệnh nhân",
          links: [
            { label: "Đặt lịch khám", href: "/book" },
            { label: "Tìm bác sĩ", href: "/doctors" },
            { label: "Khoa phòng", href: "/departments" },
            { label: "Kết quả xét nghiệm", href: "/lab-results" },
            { label: "Hồ sơ y tế", href: "/medical-records" },
          ],
        },
        {
          title: "Dịch vụ",
          links: [
            { label: "Khám tổng quát", href: "/services/general" },
            { label: "Khám chuyên khoa", href: "/services/specialty" },
            { label: "Xét nghiệm", href: "/services/lab" },
            { label: "Chẩn đoán hình ảnh", href: "/services/imaging" },
            { label: "Tư vấn trực tuyến", href: "/telemedicine" },
          ],
        },
        {
          title: "Thông tin",
          links: [
            { label: "Về chúng tôi", href: "/about" },
            { label: "Bảo hiểm", href: "/insurance" },
            { label: "Bảng giá", href: "/pricing" },
            { label: "Tin tức", href: "/blog" },
            { label: "Liên hệ", href: "/contact" },
          ],
        },
        {
          title: "Pháp lý",
          links: [
            { label: "Điều khoản sử dụng", href: "/terms" },
            { label: "Chính sách bảo mật", href: "/privacy" },
            { label: "Chính sách cookie", href: "/cookies" },
            { label: "Quyền bệnh nhân", href: "/patient-rights" },
          ],
        },
      ],
      contact: {
        title: "Liên hệ",
        address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
        phone: "(028) 1234 5678",
        email: "info@hospital.vn",
      },
      social: {
        title: "Theo dõi chúng tôi",
      },
      copyright: "© 2024 Hospital Management. Bảo lưu mọi quyền.",
      languageSwitch: "Switch to English",
    },
    en: {
      tagline: "Modern, secure, and trusted healthcare",
      emergency: {
        title: "Emergency 24/7",
        phone: "115",
        note: "Free call from any network",
      },
      sections: [
        {
          title: "Patients",
          links: [
            { label: "Book Appointment", href: "/book" },
            { label: "Find Doctor", href: "/doctors" },
            { label: "Departments", href: "/departments" },
            { label: "Lab Results", href: "/lab-results" },
            { label: "Medical Records", href: "/medical-records" },
          ],
        },
        {
          title: "Services",
          links: [
            { label: "General Check-up", href: "/services/general" },
            { label: "Specialist Care", href: "/services/specialty" },
            { label: "Laboratory", href: "/services/lab" },
            { label: "Imaging", href: "/services/imaging" },
            { label: "Telemedicine", href: "/telemedicine" },
          ],
        },
        {
          title: "Information",
          links: [
            { label: "About Us", href: "/about" },
            { label: "Insurance", href: "/insurance" },
            { label: "Pricing", href: "/pricing" },
            { label: "Blog", href: "/blog" },
            { label: "Contact", href: "/contact" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Cookie Policy", href: "/cookies" },
            { label: "Patient Rights", href: "/patient-rights" },
          ],
        },
      ],
      contact: {
        title: "Contact",
        address: "123 Le Loi Street, District 1, HCMC",
        phone: "(028) 1234 5678",
        email: "info@hospital.vn",
      },
      social: {
        title: "Follow us",
      },
      copyright: "© 2024 Hospital Management. All rights reserved.",
      languageSwitch: "Chuyển sang Tiếng Việt",
    },
  };

  const t = footer[lang];

  return (
    <footer className="bg-neutral-900 text-neutral-300" role="contentinfo">
      {/* Emergency band */}
      <div className="bg-error/10 border-b border-error/20">
        <div className="max-w-content mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <svg className="w-6 h-6 text-error" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-white">{t.emergency.title}: {t.emergency.phone}</p>
              <p className="text-sm text-neutral-400">{t.emergency.note}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-content mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-8 h-8 text-brand" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
                <path d="M16 2L8 10h4v12h8V10h4L16 2zm-2 18v-8h4v8h-4z" />
                <rect x="4" y="26" width="24" height="2" />
              </svg>
              <span className="font-bold text-xl text-white">Hospital Management</span>
            </div>
            <p className="text-neutral-400 mb-6">{t.tagline}</p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-white">{t.contact.title}</p>
              <p>{t.contact.address}</p>
              <p>
                <a href={`tel:${t.contact.phone.replace(/\s/g, "")}`} className="hover:text-brand transition-colors">
                  {t.contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${t.contact.email}`} className="hover:text-brand transition-colors">
                  {t.contact.email}
                </a>
              </p>
            </div>
          </div>

          {/* Link sections */}
          {t.sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-brand transition-colors min-h-[44px] inline-flex items-center"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & language */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-neutral-800">
          <div className="flex items-center gap-4">
            <span className="text-sm">{t.social.title}:</span>
            <div className="flex gap-3">
              {["facebook", "twitter", "instagram", "youtube"].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-brand transition-colors"
                  aria-label={social}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <p className="text-sm">{t.copyright}</p>
            <button
              onClick={() => setLang(lang === "vi" ? "en" : "vi")}
              className="text-sm text-brand hover:underline min-h-[44px] flex items-center"
            >
              {t.languageSwitch}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
