'use client';

import { motion } from 'framer-motion';
import {
  MapPin, Phone, Mail, Clock, Send, Building2,
  MessageCircle, Headphones, Globe, ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Contact info
const contactInfo = [
  {
    icon: MapPin,
    title: 'Địa chỉ',
    content: ['123 Đường ABC, Quận 1', 'TP. Hồ Chí Minh, Việt Nam'],
    color: 'bg-blue-100 text-blue-600',
    bgGradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: Phone,
    title: 'Điện thoại',
    content: ['Hotline: (028) 1234 5678', 'Cấp cứu: 115'],
    color: 'bg-green-100 text-green-600',
    bgGradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: Mail,
    title: 'Email',
    content: ['info@hospital.com', 'support@hospital.com'],
    color: 'bg-purple-100 text-purple-600',
    bgGradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: Clock,
    title: 'Giờ làm việc',
    content: ['Thứ 2 - Thứ 6: 7:00 - 20:00', 'Thứ 7 - CN: 8:00 - 17:00'],
    color: 'bg-orange-100 text-orange-600',
    bgGradient: 'from-orange-500 to-orange-600',
  },
];

// Quick contact options
const quickContacts = [
  { icon: Headphones, title: 'Tổng đài hỗ trợ', subtitle: '24/7 sẵn sàng phục vụ', action: 'Gọi ngay' },
  { icon: MessageCircle, title: 'Chat trực tuyến', subtitle: 'Phản hồi trong 5 phút', action: 'Chat ngay' },
  { icon: Globe, title: 'Đặt lịch online', subtitle: 'Nhanh chóng, tiện lợi', action: 'Đặt lịch' },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 pt-32 pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <MessageCircle className="h-4 w-4" />
              Liên hệ với chúng tôi
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Chúng tôi luôn lắng nghe bạn
            </h1>
            <p className="mb-8 text-lg text-cyan-100/90 md:text-xl">
              Đội ngũ chuyên gia y tế của chúng tôi sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn 24/7.
            </p>

            {/* Quick Contact Cards */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {quickContacts.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group cursor-pointer rounded-2xl bg-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/20"
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mb-1 font-semibold text-white">{item.title}</h3>
                    <p className="mb-3 text-sm text-cyan-100/80">{item.subtitle}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-200 group-hover:text-white">
                      {item.action}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto -mt-20 px-4 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 lg:grid-cols-3"
        >
          {/* Contact Info Cards */}
          <motion.div variants={itemVariants} className="space-y-4 lg:col-span-1">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4 p-6">
                    <div className={`rounded-xl p-3 ${info.color} transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-slate-900">{info.title}</h3>
                      {info.content.map((line, i) => (
                        <p key={i} className="text-sm text-slate-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Emergency Card */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-3">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Cấp cứu 24/7</h3>
                  <p className="text-sm text-white/80">Luôn sẵn sàng hỗ trợ</p>
                </div>
              </div>
              <a
                href="tel:115"
                className="block w-full rounded-xl bg-white/20 py-4 text-center text-2xl font-bold transition-colors hover:bg-white/30"
              >
                115
              </a>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="overflow-hidden border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 pb-6">
                <CardTitle className="text-2xl text-slate-900">Gửi tin nhắn cho chúng tôi</CardTitle>
                <CardDescription className="text-slate-600">
                  Điền vào biểu mẫu dưới đây và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900">
                      Gửi tin nhắn thành công!
                    </h3>
                    <p className="mb-6 text-slate-500">
                      Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                      className="cursor-pointer"
                    >
                      Gửi tin nhắn khác
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-700">
                          Họ và tên <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="Nguyễn Văn A"
                          required
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-cyan-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="nguyenvana@example.com"
                          required
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700">
                          Số điện thoại
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0909 123 456"
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-cyan-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-slate-700">
                          Chủ đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="subject"
                          placeholder="Tư vấn khám bệnh"
                          required
                          className="h-12 rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-700">
                        Nội dung tin nhắn <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Vui lòng mô tả chi tiết yêu cầu của bạn..."
                        className="min-h-[150px] rounded-xl border-slate-200 bg-slate-50 transition-all focus:border-cyan-500 focus:bg-white focus:ring-cyan-500"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <p className="text-sm text-slate-500">
                        <span className="text-red-500">*</span> Thông tin bắt buộc
                      </p>
                      <Button
                        type="submit"
                        className="cursor-pointer gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 px-8 hover:from-cyan-700 hover:to-blue-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Gửi tin nhắn
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Vị trí của chúng tôi</h2>
            <p className="text-slate-500">Dễ dàng tìm đường đến bệnh viện</p>
          </div>
          <Card className="overflow-hidden border-none shadow-xl">
            <div className="relative h-[400px] w-full bg-slate-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424167930663!2d106.69834531533414!3d10.77978549231915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x1787491df0ed8d6a!2sIndependence%20Palace!5e0!3m2!1sen!2s!4v1646816340266!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 transition-all duration-500 hover:grayscale-0 grayscale"
              />
              {/* Map Overlay Card */}
              <div className="absolute bottom-6 left-6 max-w-sm rounded-2xl bg-white p-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-cyan-100 p-2 text-cyan-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Bệnh viện ABC</h4>
                    <p className="text-sm text-slate-500">123 Đường ABC, Quận 1, TP.HCM</p>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      Xem chỉ đường
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}
