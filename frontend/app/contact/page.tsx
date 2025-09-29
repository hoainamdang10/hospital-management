// app/contact/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { sendContactEmail, type ContactFormData } from '@/lib/emailjs';
import { useToast } from '@/components/ui/toast-provider';
import { Loader2 } from 'lucide-react';

export default function ContactPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    from_name: '',
    phone: '',
    from_email: '',
    subject: '',
    message: ''
  });

  // Form validation
  const validateForm = () => {
    if (!formData.from_name.trim()) {
      showToast("Lỗi!", "Vui lòng nhập họ tên", "error");
      return false;
    }

    if (!formData.phone.trim()) {
      showToast("Lỗi!", "Vui lòng nhập số điện thoại", "error");
      return false;
    }

    if (!formData.from_email.trim()) {
      showToast("Lỗi!", "Vui lòng nhập email", "error");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.from_email)) {
      showToast("Lỗi!", "Email không hợp lệ", "error");
      return false;
    }

    if (!formData.message.trim()) {
      showToast("Lỗi!", "Vui lòng nhập tin nhắn", "error");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const emailData: ContactFormData = {
        ...formData,
        subject: formData.subject || 'Liên hệ từ website bệnh viện',
        sent_time: new Date().toISOString()
      };

      const result = await sendContactEmail(emailData);

      if (result.success) {
        // Hiển thị popup thành công
        setShowSuccessPopup(true);

        showToast("Thành công! 🎉", "Tin nhắn đã được gửi. Chúng tôi sẽ liên hệ với bạn sớm nhất!", "success");

        // Reset form
        setFormData({
          from_name: '',
          phone: '',
          from_email: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Send error:', error);
      showToast("Lỗi!", "Không thể gửi tin nhắn. Vui lòng thử lại sau.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle close popup
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header với social media và phone */}
      <div className="bg-blue-900 text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-blue-200"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="hover:text-blue-200"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-blue-200"><i className="fab fa-linkedin-in"></i></a>
            <a href="#" className="hover:text-blue-200"><i className="fab fa-instagram"></i></a>
          </div>
          <div className="flex items-center">
            <i className="fas fa-phone mr-2"></i>
            <span>+1-123-5663582</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-blue-900 text-3xl font-bold">H</span>
            <div className="ml-3">
              <span className="text-blue-900 text-xl font-bold block">Hospital</span>
              <span className="text-gray-600 text-sm">Management</span>
            </div>
          </Link>
          <ul className="hidden lg:flex space-x-8 text-gray-700 font-medium">
            <li><Link href="/" className="hover:text-blue-900 transition">Trang chủ</Link></li>
            <li><Link href="/about" className="hover:text-blue-900 transition">Giới thiệu</Link></li>
            <li><Link href="/doctors" className="hover:text-blue-900 transition">Bác sĩ</Link></li>
            <li><Link href="/services" className="hover:text-blue-900 transition">Dịch vụ</Link></li>
            <li><Link href="/contact" className="text-blue-900 font-semibold">Liên hệ</Link></li>
            <li><Link href="/auth/login" className="hover:text-blue-900 transition">Đăng nhập / Đăng ký</Link></li>
          </ul>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-blue-900 transition">
              <i className="fas fa-search text-lg"></i>
            </button>
            <button className="bg-blue-900 text-white p-3 rounded-lg hover:bg-blue-800 transition lg:hidden">
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Liên hệ với chúng tôi</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng hỗ trợ và tư vấn cho bạn. Đội ngũ chuyên gia y tế của chúng tôi
            cam kết mang đến dịch vụ chăm sóc sức khỏe tốt nhất.
          </p>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Địa chỉ */}
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-map-marker-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Địa chỉ</h3>
              <p className="text-gray-600 leading-relaxed">
                Bệnh viện Quân Y 175<br />
                268 Tô Hiến Thành, P.15<br />
                Quận 10, TP.HCM<br />
                Việt Nam
              </p>
            </div>

            {/* Điện thoại */}
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-phone text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Điện thoại</h3>
              <p className="text-gray-600 leading-relaxed">
                <a href="tel:+1-123-5663582" className="hover:text-blue-900">+1-123-5663582</a><br />
                </p>
            </div>

            {/* Email */}
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-envelope text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Email</h3>
              <p className="text-gray-600 leading-relaxed">
                <a href="mailto:info@hospital.com" className="hover:text-blue-900">info@hospital.com</a><br />
                <a href="mailto:appointment@hospital.com" className="hover:text-blue-900">appointment@hospital.com</a>
              </p>
            </div>

            {/* Giờ làm việc */}
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-clock text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Giờ làm việc</h3>
              <p className="text-gray-600 leading-relaxed">
                Thứ 2 - Thứ 6: 7:00 - 19:00<br />
                Thứ 7 - CN: 8:00 - 17:00<br />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form & Map Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 h-fit">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Gửi tin nhắn cho chúng tôi</h2>
                <p className="text-gray-600 text-sm">Điền thông tin dưới đây và chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Họ tên *</label>
                    <input
                      type="text"
                      name="from_name"
                      value={formData.from_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none transition-colors"
                      placeholder="Nhập họ tên đầy đủ"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none transition-colors"
                      placeholder="Nhập số điện thoại"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="from_email"
                    value={formData.from_email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none transition-colors"
                    placeholder="Nhập địa chỉ email"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Chủ đề</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none transition-colors"
                    disabled={isLoading}
                  >
                    <option value="">Chọn chủ đề liên hệ</option>
                    <option value="Đặt lịch khám bệnh">Đặt lịch khám bệnh</option>
                    <option value="Tư vấn y tế">Tư vấn y tế</option>
                    <option value="Cấp cứu">Cấp cứu</option>
                    <option value="Phản hồi dịch vụ">Phản hồi dịch vụ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tin nhắn *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none transition-colors resize-none"
                    placeholder="Mô tả chi tiết nội dung bạn muốn tư vấn hoặc hỗ trợ..."
                    disabled={isLoading}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-900 text-white py-3 px-6 rounded-lg hover:bg-blue-800 transition-colors duration-300 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Gửi tin nhắn
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & Emergency */}
            <div className="flex flex-col h-full">
              {/* Map */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 mb-6">
                <div className="p-4 border-b">
                  <h3 className="text-xl font-bold text-gray-800">Bệnh viện Quân Y 175 - TP.HCM</h3>
                  <p className="text-gray-600 text-sm mt-1">268 Tô Hiến Thành, P.15, Quận 10</p>
                </div>
                <div className="relative flex-1">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.918941142478!2d106.67808657451768!3d10.817515158435537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528e2324759b7%3A0x6c91974ff86f05e3!2zQuG7h25oIHZp4buHbiBRdcOibiBZIDE3NQ!5e0!3m2!1svi!2s!4v1748424170558!5m2!1svi!2s"
                    width="100%"
                    height="350"
                    style={{border: 0}}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full"
                  />
                </div>
                <div className="p-3 bg-gray-50">
                  <p className="text-xs text-gray-600 flex items-center">
                    <i className="fas fa-info-circle mr-2 text-blue-900"></i>
                    Click vào bản đồ để xem hướng dẫn đường đi chi tiết
                  </p>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center mr-3">
                    <i className="fas fa-ambulance text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-red-800">Cấp cứu 24/7</h3>
                </div>
                <p className="text-red-700 mb-4 text-sm">
                  Trong trường hợp khẩn cấp, vui lòng liên hệ ngay hotline cấp cứu:
                </p>
                <a href="tel:+84-987-654-321" className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                  <i className="fas fa-phone mr-2"></i>
                  +84-987-654-321
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Đối tác & Liên kết</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Chúng tôi tự hào hợp tác với các cơ quan y tế uy tín và tổ chức quốc tế hàng đầu
            </p>
          </div>

          {/* Healthcare Partners */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Đối tác Y tế</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-hospital text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">BV Chợ Rẫy</h4>
                <p className="text-xs text-gray-600 mt-1">TP.HCM</p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-md text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">BV 108</h4>
                <p className="text-xs text-gray-600 mt-1">Hà Nội</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-heartbeat text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">BV Bình Dân</h4>
                <p className="text-xs text-gray-600 mt-1">TP.HCM</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-stethoscope text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">BV Đại học Y</h4>
                <p className="text-xs text-gray-600 mt-1">TP.HCM</p>
              </div>
            </div>
          </div>

          {/* Technology Partners */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Đối tác Công nghệ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fab fa-microsoft text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">Microsoft</h4>
                <p className="text-xs text-gray-600 mt-1">Cloud Healthcare</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fab fa-aws text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">AWS</h4>
                <p className="text-xs text-gray-600 mt-1">Cloud Infrastructure</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-red-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-database text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">Oracle</h4>
                <p className="text-xs text-gray-600 mt-1">Database Solutions</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl hover:shadow-lg transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-green-700 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-virus text-2xl"></i>
                </div>
                <h4 className="font-bold text-gray-800 text-sm">Cisco</h4>
                <p className="text-xs text-gray-600 mt-1">Network Security</p>
              </div>
            </div>
          </div>

          {/* Partner Stats */}
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-900 mb-2">25+</div>
              <div className="text-gray-600 text-sm">Đối tác y tế</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-900 mb-2">8+</div>
              <div className="text-gray-600 text-sm">Năm kinh nghiệm</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-900 mb-2">50K+</div>
              <div className="text-gray-600 text-sm">Bệnh nhân tin tưởng</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-900 mb-2">24/7</div>
              <div className="text-gray-600 text-sm">Hỗ trợ kỹ thuật</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <span className="text-white text-3xl font-bold">H</span>
                <div className="ml-3">
                  <span className="text-white text-xl font-bold block">Hospital</span>
                  <span className="text-blue-200 text-sm">Management</span>
                </div>
              </div>
              <p className="text-blue-200 leading-relaxed">
                Đối tác tin cậy trong việc chăm sóc sức khỏe và phúc lợi của bạn.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-blue-200">
                <li><a href="#" className="hover:text-white transition">Khám tổng quát</a></li>
                <li><a href="#" className="hover:text-white transition">Chuyên khoa</a></li>
                <li><a href="#" className="hover:text-white transition">Cấp cứu</a></li>
                <li><a href="#" className="hover:text-white transition">Xét nghiệm</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Liên kết</h4>
              <ul className="space-y-2 text-blue-200">
                <li><Link href="/" className="hover:text-white transition">Trang chủ</Link></li>
                <li><Link href="/about" className="hover:text-white transition">Giới thiệu</Link></li>
                <li><Link href="/doctors" className="hover:text-white transition">Bác sĩ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Liên hệ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Theo dõi chúng tôi</h4>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a href="#" className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
            <p>&copy; 2024 Hospital Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}