'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // In a real app, you would show a success toast here
    alert('Tin nhắn của bạn đã được gửi thành công!');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section with Gradient */}
      <div className="relative h-[400px] w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="container relative mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
              Liên hệ với chúng tôi
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Chúng tôi luôn lắng nghe bạn
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-blue-100/90 md:text-xl">
              Đội ngũ chuyên gia y tế của chúng tôi sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn 24/7.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto -mt-20 px-4 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 lg:grid-cols-3"
        >
          {/* Contact Info Cards */}
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
            {/* Info Cards */}
            <Card className="border-none shadow-lg transition-shadow hover:shadow-xl">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Địa chỉ</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    123 Đường ABC, Quận 1<br />
                    TP. Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg transition-shadow hover:shadow-xl">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-lg bg-green-100 p-3 text-green-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Điện thoại</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Hotline: (028) 1234 5678<br />
                    Cấp cứu: 115
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg transition-shadow hover:shadow-xl">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    info@hospital.com<br />
                    support@hospital.com
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg transition-shadow hover:shadow-xl">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Giờ làm việc</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Thứ 2 - Thứ 6: 7:00 - 20:00<br />
                    Thứ 7 - CN: 8:00 - 17:00
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="h-full border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Gửi tin nhắn cho chúng tôi</CardTitle>
                <CardDescription>
                  Điền vào biểu mẫu dưới đây và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input id="name" placeholder="Nguyễn Văn A" required className="bg-gray-50 transition-all focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="nguyenvana@example.com" required className="bg-gray-50 transition-all focus:bg-white" />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input id="phone" type="tel" placeholder="0909 123 456" className="bg-gray-50 transition-all focus:bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Chủ đề</Label>
                      <Input id="subject" placeholder="Tư vấn khám bệnh" required className="bg-gray-50 transition-all focus:bg-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nội dung tin nhắn</Label>
                    <Textarea
                      id="message"
                      placeholder="Vui lòng mô tả chi tiết yêu cầu của bạn..."
                      className="min-h-[150px] bg-gray-50 transition-all focus:bg-white"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 md:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>Đang gửi...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Gửi tin nhắn
                      </>
                    )}
                  </Button>
                </form>
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
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="relative h-[400px] w-full bg-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424167930663!2d106.69834531533414!3d10.77978549231915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x1787491df0ed8d6a!2sIndependence%20Palace!5e0!3m2!1sen!2s!4v1646816340266!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
