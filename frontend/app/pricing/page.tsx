'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, Star, Shield, Clock, Phone, ArrowRight,
  Stethoscope, Heart, Activity, Microscope, Scan,
  Pill, Syringe, BadgeCheck, HelpCircle, ChevronDown
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Pricing packages
const pricingPackages = [
  {
    id: 'basic',
    name: 'Khám tổng quát',
    description: 'Phù hợp cho khám sức khỏe cơ bản',
    price: 200000,
    originalPrice: 250000,
    popular: false,
    color: 'from-slate-600 to-slate-700',
    features: [
      'Khám lâm sàng tổng quát',
      'Tư vấn bác sĩ đa khoa',
      'Kê đơn thuốc điều trị',
      'Theo dõi sau khám 7 ngày',
      'Hồ sơ điện tử lưu trữ',
    ],
    notIncluded: ['Xét nghiệm máu', 'Chẩn đoán hình ảnh'],
  },
  {
    id: 'professional',
    name: 'Khám chuyên khoa',
    description: 'Khám với bác sĩ chuyên khoa',
    price: 500000,
    originalPrice: 650000,
    popular: true,
    color: 'from-cyan-600 to-blue-600',
    features: [
      'Khám bác sĩ chuyên khoa',
      'Tư vấn chuyên sâu chi tiết',
      'Kê đơn thuốc chuyên biệt',
      'Theo dõi sau khám 14 ngày',
      'Hồ sơ điện tử lưu trữ',
      'Ưu tiên đặt lịch tái khám',
    ],
    notIncluded: [],
  },
  {
    id: 'premium',
    name: 'Gói khám sức khỏe',
    description: 'Khám tổng quát toàn diện',
    price: 2000000,
    originalPrice: 2500000,
    popular: false,
    color: 'from-indigo-600 to-purple-600',
    features: [
      'Khám lâm sàng toàn diện',
      'Xét nghiệm máu đầy đủ',
      'Chụp X-quang ngực',
      'Siêu âm ổ bụng',
      'Điện tâm đồ ECG',
      'Tư vấn dinh dưỡng',
      'Báo cáo sức khỏe chi tiết',
      'Tư vấn bác sĩ chuyên khoa',
    ],
    notIncluded: [],
  },
];

// Individual services
const serviceCategories = [
  {
    name: 'Xét nghiệm',
    icon: Microscope,
    color: 'bg-blue-100 text-blue-600',
    services: [
      { name: 'Xét nghiệm máu tổng quát', priceRange: '150,000 - 300,000' },
      { name: 'Xét nghiệm sinh hóa', priceRange: '200,000 - 500,000' },
      { name: 'Xét nghiệm nước tiểu', priceRange: '80,000 - 150,000' },
      { name: 'Xét nghiệm hormone', priceRange: '300,000 - 800,000' },
    ],
  },
  {
    name: 'Chẩn đoán hình ảnh',
    icon: Scan,
    color: 'bg-purple-100 text-purple-600',
    services: [
      { name: 'X-quang', priceRange: '200,000 - 500,000' },
      { name: 'Siêu âm', priceRange: '300,000 - 800,000' },
      { name: 'CT Scan', priceRange: '2,000,000 - 5,000,000' },
      { name: 'MRI', priceRange: '3,000,000 - 8,000,000' },
    ],
  },
  {
    name: 'Thủ thuật',
    icon: Syringe,
    color: 'bg-green-100 text-green-600',
    services: [
      { name: 'Nội soi dạ dày', priceRange: '1,500,000 - 3,000,000' },
      { name: 'Nội soi đại tràng', priceRange: '2,000,000 - 4,000,000' },
      { name: 'Sinh thiết', priceRange: '500,000 - 1,500,000' },
      { name: 'Tiểu phẫu', priceRange: '1,000,000 - 5,000,000' },
    ],
  },
];

// Benefits
const benefits = [
  { icon: Shield, title: 'Chấp nhận BHYT', description: 'Bảo hiểm y tế nhà nước và thương mại' },
  { icon: Clock, title: 'Đặt lịch 24/7', description: 'Hệ thống đặt lịch trực tuyến tiện lợi' },
  { icon: BadgeCheck, title: 'Cam kết chất lượng', description: 'Dịch vụ y tế đạt chuẩn quốc tế' },
  { icon: Star, title: 'Bác sĩ hàng đầu', description: 'Đội ngũ chuyên gia giàu kinh nghiệm' },
];

// Format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN').format(price);
};

export default function PricingPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 pt-32 pb-24">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Shield className="h-4 w-4" />
              Minh bạch & Uy tín
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Bảng giá dịch vụ
            </h1>
            <p className="mb-8 text-lg text-cyan-100/90 md:text-xl">
              Chi phí khám chữa bệnh rõ ràng, không phát sinh. Hỗ trợ đa dạng hình thức thanh toán và bảo hiểm.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto -mt-16 px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {pricingPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl ${pkg.popular ? 'ring-2 ring-cyan-500' : ''
                }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                    <Star className="h-4 w-4 fill-current" />
                    Phổ biến nhất
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-6 text-center">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${pkg.color} text-white shadow-lg`}>
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-slate-900">{pkg.name}</h3>
                <p className="text-sm text-slate-500">{pkg.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6 text-center">
                <div className="mb-1 flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-slate-900">{formatPrice(pkg.price)}</span>
                  <span className="text-slate-500">VNĐ</span>
                </div>
                {pkg.originalPrice > pkg.price && (
                  <p className="text-sm text-slate-400 line-through">
                    {formatPrice(pkg.originalPrice)} VNĐ
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
                {pkg.notIncluded.map((feature, i) => (
                  <li key={`not-${i}`} className="flex items-start gap-3 opacity-50">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <span className="text-xs text-slate-400">—</span>
                    </div>
                    <span className="text-sm text-slate-400">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href="/patient/appointments/book">
                <Button
                  className={`w-full cursor-pointer gap-2 ${pkg.popular
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                  Đặt lịch ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-slate-900">{benefit.title}</h4>
                  <p className="text-sm text-slate-500">{benefit.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Individual Services */}
      <section className="container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl">
            Bảng giá dịch vụ chi tiết
          </h2>
          <p className="mx-auto max-w-2xl text-slate-500">
            Giá có thể thay đổi tùy theo mức độ phức tạp và yêu cầu cụ thể. Vui lòng liên hệ để được tư vấn.
          </p>
        </motion.div>

        <div className="mx-auto max-w-4xl space-y-4">
          {serviceCategories.map((category, index) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.name;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                  className="flex w-full cursor-pointer items-center justify-between p-6 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-3 ${category.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                      <p className="text-sm text-slate-500">{category.services.length} dịch vụ</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-full bg-slate-100 p-2"
                  >
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  </motion.div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100"
                  >
                    <div className="divide-y divide-slate-100">
                      {category.services.map((service, i) => (
                        <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                          <span className="text-slate-700">{service.name}</span>
                          <span className="font-semibold text-slate-900">{service.priceRange} VNĐ</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-8 max-w-4xl rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 p-6 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2 text-cyan-700">
            <HelpCircle className="h-5 w-5" />
            <span className="font-semibold">Lưu ý quan trọng</span>
          </div>
          <p className="text-slate-600">
            Giá có thể thay đổi tùy theo tình trạng bệnh và yêu cầu điều trị cụ thể.
            Bệnh viện chấp nhận thanh toán BHYT và các loại bảo hiểm thương mại.
            Vui lòng liên hệ hotline <span className="font-semibold text-cyan-700">(028) 1234 5678</span> để được tư vấn chi tiết.
          </p>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                  Cần tư vấn thêm về chi phí?
                </h3>
                <p className="text-cyan-100/90">
                  Liên hệ với đội ngũ tư vấn của chúng tôi để được hỗ trợ về chi phí khám chữa bệnh và các chương trình ưu đãi.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row md:justify-end">
                <Link href="/contact">
                  <Button className="w-full cursor-pointer gap-2 bg-white text-cyan-700 hover:bg-cyan-50 sm:w-auto">
                    Liên hệ tư vấn
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" className="w-full cursor-pointer gap-2 border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto">
                  <Phone className="h-4 w-4" />
                  (028) 1234 5678
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}
