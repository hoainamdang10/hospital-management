import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Facebook,
  MessageCircle,
  Instagram,
  Youtube,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success(
      "Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi trong 24h."
    );
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Điện thoại",
      details: ["Tổng đài: 1900-1234"],
      color: "text-blue-600",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@medicare.vn"],
      color: "text-cyan-600",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      details: [
        "123 Đường ABC, Phường 1",
        "Quận 1, TP. Hồ Chí Minh",
        "Việt Nam",
      ],
      color: "text-green-600",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      details: [
        "Thứ 2 - Chủ nhật: 7:00 - 21:00",
        "Cấp cứu: 24/7",
        "Hỗ trợ online: 24/7",
      ],
      color: "text-purple-600",
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      href: "#",
      color: "hover:text-blue-600",
    },
    {
      icon: MessageCircle,
      name: "Zalo",
      href: "#",
      color: "hover:text-blue-500",
    },
    {
      icon: Instagram,
      name: "Instagram",
      href: "#",
      color: "hover:text-pink-600",
    },
    { icon: Youtube, name: "YouTube", href: "#", color: "hover:text-red-600" },
  ];

  return (
    <section
      id="contact"
      className="py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-white relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-100 rounded-full opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-green-100 rounded-full opacity-30 animate-drift-1"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
            Liên hệ với chúng tôi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Hãy liên hệ với chúng tôi
            qua bất kỳ kênh nào thuận tiện nhất.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {contactInfo.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg bg-gray-50 ${item.color}`}
                      >
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {item.title}
                        </h3>
                        <div className="space-y-1">
                          {item.details.map((detail, idx) => (
                            <p key={idx} className="text-gray-600 text-sm">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Kết nối với chúng tôi
                  </h3>
                  <div className="flex gap-4">
                    {socialLinks.map((social, index) => (
                      <motion.a
                        key={index}
                        href={social.href}
                        className={`p-3 rounded-lg bg-gray-50 text-gray-600 transition-all duration-300 ${social.color} hover:scale-110`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <social.icon className="h-5 w-5" />
                      </motion.a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600">
                  Gửi tin nhắn cho chúng tôi
                </CardTitle>
                <p className="text-gray-600">
                  Chúng tôi sẽ phản hồi trong vòng 24 giờ
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Họ và tên *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Nhập họ và tên của bạn"
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Số điện thoại *
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        placeholder="0901 234 567"
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="example@email.com"
                        required
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="subject"
                        className="text-sm font-medium text-gray-700"
                      >
                        Chủ đề
                      </Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        placeholder="Chủ đề tin nhắn"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-sm font-medium text-gray-700"
                    >
                      Tin nhắn *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      required
                      rows={6}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Thông tin của bạn được bảo mật theo chính sách bảo mật của
                      MediCare
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang gửi...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Gửi tin nhắn
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-blue-600 flex items-center justify-center gap-2">
                <MapPin className="h-6 w-6" />
                Vị trí bệnh viện
              </CardTitle>
              <p className="text-gray-600">
                <strong>Bệnh viện MediCare</strong>
                <br />
                123 Đường ABC, Phường 1, Quận 1<br />
                TP. Hồ Chí Minh, Việt Nam
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 md:h-96 relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4326434973283!2d106.69347531476844!3d10.775599992323113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcd3%3A0x8066ff7bfb9b3058!2zUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCBDaXR5LCBW4bubdCBOYW0!5e0!3m2!1sen!2s!4v1646123456789!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          Bệnh viện MediCare
                        </h3>
                        <p className="text-sm text-gray-600">
                          123 Đường ABC, Quận 1
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                        onClick={() =>
                          window.open(
                            "https://maps.google.com?q=123+Đường+ABC,+Quận+1,+TP.HCM",
                            "_blank"
                          )
                        }
                      >
                        Xem trên Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Liên hệ nhanh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">
                      Gọi ngay
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Hỗ trợ 24/7, tư vấn miễn phí
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                    onClick={() => window.open("tel:19001234")}
                  >
                    1900-1234
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">
                      Chat Zalo
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Tư vấn trực tuyến nhanh chóng
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700"
                  >
                    Chat ngay
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Card className="border-0 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-cyan-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">
                      Gửi email
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Phản hồi trong vòng 24 giờ
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700"
                    onClick={() => window.open("mailto:info@medicare.vn")}
                  >
                    info@medicare.vn
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
