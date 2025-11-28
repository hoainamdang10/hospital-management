'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Stethoscope, Heart, Baby, Brain, Bone, Eye,
  Microscope, Activity, ShieldPlus, Clock,
  CheckCircle2, ArrowRight, Sparkles, Syringe,
  Pill, Truck, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Service Categories Data
const serviceCategories = [
  {
    id: 'specialties',
    label: 'Chuyên khoa',
    icon: Stethoscope,
    description: 'Khám và điều trị chuyên sâu đa chuyên khoa',
    items: [
      {
        title: 'Khoa Nội Tổng quát',
        desc: 'Chẩn đoán và điều trị các bệnh lý nội khoa: tim mạch, tiêu hóa, hô hấp, nội tiết...',
        icon: Activity,
        features: ['Khám sức khỏe tổng quát', 'Tầm soát ung thư', 'Điều trị nội trú']
      },
      {
        title: 'Tim mạch & Lồng ngực',
        desc: 'Trung tâm tim mạch hàng đầu với các kỹ thuật can thiệp mạch và phẫu thuật tim hở.',
        icon: Heart,
        features: ['Chụp mạch vành', 'Đặt stent', 'Phẫu thuật tim hở']
      },
      {
        title: 'Sản Phụ khoa',
        desc: 'Chăm sóc sức khỏe toàn diện cho phụ nữ và thai nhi với dịch vụ thai sản trọn gói.',
        icon: Baby,
        features: ['Thai sản trọn gói', 'Tầm soát ung thư phụ khoa', 'Hỗ trợ sinh sản']
      },
      {
        title: 'Chấn thương chỉnh hình',
        desc: 'Điều trị các bệnh lý cơ xương khớp, chấn thương thể thao và phẫu thuật thay khớp.',
        icon: Bone,
        features: ['Phẫu thuật nội soi khớp', 'Thay khớp nhân tạo', 'Vật lý trị liệu']
      },
      {
        title: 'Thần kinh - Đột quỵ',
        desc: 'Đơn vị đột quỵ tiêu chuẩn vàng, điều trị các bệnh lý thần kinh phức tạp.',
        icon: Brain,
        features: ['Cấp cứu đột quỵ 24/7', 'Phẫu thuật thần kinh', 'Điều trị đau']
      },
      {
        title: 'Mắt & Nhãn khoa',
        desc: 'Điều trị các bệnh lý về mắt với công nghệ Laser và Phaco hiện đại nhất.',
        icon: Eye,
        features: ['Phẫu thuật Lasik', 'Phẫu thuật Phaco', 'Điều trị tật khúc xạ']
      }
    ]
  },
  {
    id: 'support',
    label: 'Cận lâm sàng',
    icon: Microscope,
    description: 'Hệ thống xét nghiệm và chẩn đoán hình ảnh hiện đại',
    items: [
      {
        title: 'Chẩn đoán hình ảnh',
        desc: 'Hệ thống MRI 3.0 Tesla, CT 128 lát cắt, X-quang kỹ thuật số giúp chẩn đoán chính xác.',
        icon: Sparkles,
        features: ['MRI toàn thân', 'CT Scanner đa lát cắt', 'Siêu âm 4D/5D']
      },
      {
        title: 'Xét nghiệm (Lab)',
        desc: 'Trung tâm xét nghiệm đạt chuẩn ISO 15189:2012, thực hiện đầy đủ các xét nghiệm.',
        icon: Microscope,
        features: ['Xét nghiệm huyết học', 'Sinh hóa - Miễn dịch', 'Sinh học phân tử']
      },
      {
        title: 'Dược & Vật tư y tế',
        desc: 'Nhà thuốc đạt chuẩn GPP, cung cấp đầy đủ thuốc và vật tư y tế chất lượng cao.',
        icon: Pill,
        features: ['Thuốc đặc trị', 'Tư vấn sử dụng thuốc', 'Giao thuốc tận nơi']
      }
    ]
  },
  {
    id: 'services',
    label: 'Dịch vụ khác',
    icon: ShieldPlus,
    description: 'Các dịch vụ hỗ trợ và chăm sóc đặc biệt',
    items: [
      {
        title: 'Cấp cứu 24/7',
        desc: 'Hệ thống xe cấp cứu hiện đại, đội ngũ phản ứng nhanh, trực chiến 24/7.',
        icon: Truck,
        features: ['Vận chuyển cấp cứu', 'Cấp cứu tại nhà', 'Trực đài 115']
      },
      {
        title: 'Tiêm chủng',
        desc: 'Trung tâm tiêm chủng an toàn, đầy đủ các loại vắc-xin cho trẻ em và người lớn.',
        icon: Syringe,
        features: ['Gói vắc-xin trẻ em', 'Vắc-xin người lớn', 'Khám sàng lọc']
      },
      {
        title: 'Tư vấn từ xa',
        desc: 'Kết nối với bác sĩ chuyên khoa mọi lúc mọi nơi qua ứng dụng Telehealth.',
        icon: Phone,
        features: ['Video call bác sĩ', 'Tư vấn kết quả', 'Theo dõi tại nhà']
      }
    ]
  }
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('specialties');

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-24 lg:py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000"
            alt="Medical Services"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-400 backdrop-blur-sm">
              Dịch vụ y tế toàn diện
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Chất lượng quốc tế <br />
              <span className="text-primary-400">Chăm sóc tận tâm</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Chúng tôi cung cấp hệ sinh thái chăm sóc sức khỏe hoàn chỉnh, từ phòng ngừa,
              chẩn đoán sớm đến điều trị chuyên sâu và phục hồi chức năng.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service Categories Tabs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Tabs Navigation */}
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            {serviceCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeTab === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`group flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary ring-offset-2'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
              {serviceCategories.map((category) => (
                activeTab === category.id && (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-10 text-center">
                      <h2 className="text-3xl font-bold text-slate-900">{category.label}</h2>
                      <p className="mt-2 text-slate-600">{category.description}</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                      {category.items.map((item, index) => (
                        <ServiceCard key={index} item={item} index={index} />
                      ))}
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Quy trình khám bệnh</h2>
            <p className="mt-4 text-slate-600">Đơn giản, nhanh chóng và thuận tiện</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="absolute left-0 top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-slate-200 lg:block" />

            <div className="grid gap-8 lg:grid-cols-4">
              {[
                { step: '01', title: 'Đặt lịch', desc: 'Đăng ký qua website hoặc hotline', icon: Clock },
                { step: '02', title: 'Tiếp nhận', desc: 'Check-in nhanh tại quầy lễ tân', icon: CheckCircle2 },
                { step: '03', title: 'Khám bệnh', desc: 'Bác sĩ chuyên khoa thăm khám', icon: Stethoscope },
                { step: '04', title: 'Điều trị', desc: 'Nhận thuốc hoặc nhập viện điều trị', icon: Pill },
              ].map((process, idx) => (
                <div key={idx} className="relative z-10 bg-slate-50 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-slate-50 transition-transform hover:scale-110">
                    <process.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{process.title}</h3>
                  <p className="text-sm text-slate-500">{process.desc}</p>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                    Bước {process.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Bạn cần tư vấn sức khỏe?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-100">
            Đội ngũ bác sĩ của chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.
            Hãy liên hệ ngay để được hỗ trợ tốt nhất.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-14 rounded-full bg-white px-8 text-lg font-semibold text-primary hover:bg-slate-100">
              Đặt lịch khám ngay
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-full border-white px-8 text-lg font-semibold text-white hover:bg-white/10">
              <Phone className="mr-2 h-5 w-5" />
              Hotline: 1900 1234
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ServiceCard({ item, index }: { item: any; index: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mb-3 text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
        {item.title}
      </h3>
      <p className="mb-6 text-slate-600 line-clamp-2">
        {item.desc}
      </p>

      <ul className="mb-8 space-y-3">
        {item.features.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-center text-sm text-slate-500">
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />

      <Button variant="ghost" className="group/btn -ml-4 text-primary hover:bg-transparent hover:text-primary-600">
        Tìm hiểu thêm
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </motion.div>
  );
}
