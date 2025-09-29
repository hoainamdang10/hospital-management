import React from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Award, Heart, Shield, CheckCircle, Star, Building, Stethoscope, Clock, Phone, Target, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout currentPage="about">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Sparkles size={16} className="mr-2" />
                  Đối tác tin cậy cho sức khỏe
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-gray-900">Chăm Sóc</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    Sức Khỏe Toàn Diện
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                  Hệ thống y tế hiện đại với đội ngũ chuyên gia hàng đầu, 
                  mang đến trải nghiệm chăm sóc sức khỏe đẳng cấp quốc tế.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                  Đặt Lịch Khám Ngay
                </Button>
                <Button variant="outline" className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-500 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg">
                  <Phone size={20} className="mr-2" />
                  Hotline 24/7
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative w-96 h-96 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 p-8 flex items-center justify-center shadow-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  <div className="w-80 h-80 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <div className="relative">
                      <Stethoscope size={120} className="text-white opacity-90" />
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Heart size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center animate-bounce delay-100 shadow-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-10 h-10 bg-gradient-to-r from-pink-400 to-red-500 rounded-full flex items-center justify-center animate-bounce delay-300 shadow-lg">
                  <Award size={16} className="text-white" />
                </div>
                <div className="absolute top-1/2 -right-12 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, number: "5,000+", text: "Bệnh nhân tin tưởng", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50" },
              { icon: Award, number: "100+", text: "Bác sĩ chuyên khoa", color: "from-emerald-500 to-green-600", bgColor: "bg-emerald-50" },
              { icon: Heart, number: "24/7", text: "Chăm sóc y tế", color: "from-red-500 to-pink-600", bgColor: "bg-red-50" },
              { icon: Clock, number: "20+", text: "Năm kinh nghiệm", color: "from-purple-500 to-indigo-600", bgColor: "bg-purple-50" }
            ].map((stat, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border-0 shadow-lg">
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  <div className="relative z-10">
                    <div className={`bg-gradient-to-r ${stat.color} text-white p-5 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <stat.icon size={28} />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-3">{stat.number}</h3>
                    <p className="text-gray-600 font-medium">{stat.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Sparkles size={16} className="mr-2" />
              Tại sao chọn chúng tôi
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Cam Kết <span className="text-blue-600">Chất Lượng</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi không chỉ là nơi khám chữa bệnh, mà còn là đối tác đồng hành 
              trong hành trình chăm sóc sức khỏe của bạn và gia đình
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
  {/* Cột bên trái */}
  <div className="flex flex-col h-full gap-6">
    {[
      {
        title: "Đội ngũ chuyên gia hàng đầu",
        desc: "Bác sĩ có trình độ quốc tế, giàu kinh nghiệm và tận tâm với nghề",
        icon: Award,
        color: "text-blue-500"
      },
      {
        title: "Công nghệ y tế tiên tiến",
        desc: "Trang thiết bị hiện đại nhất, đảm bảo chẩn đoán chính xác 100%",
        icon: Stethoscope,
        color: "text-purple-500"
      },
      {
        title: "Dịch vụ toàn diện 360°",
        desc: "Từ phòng ngừa, khám sàng lọc đến điều trị và phục hồi chức năng",
        icon: Shield,
        color: "text-emerald-500"
      },
      {
        title: "Chăm sóc cá nhân hóa",
        desc: "Phương án điều trị riêng biệt cho từng bệnh nhân, theo dõi sát sao",
        icon: Heart,
        color: "text-red-500"
      }
    ].map((feature, index) => (
      <div key={index} className="group flex flex-1 items-start space-x-6 p-6 rounded-2xl hover:bg-white/70 hover:shadow-xl transition-all duration-300 bg-white">
        <div className={`${feature.color} bg-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <feature.icon size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-xl mb-3">{feature.title}</h4>
          <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
        </div>
      </div>
    ))}
  </div>

            
            <div className="space-y-8">
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group">
                <CardContent className="p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 rounded-xl mr-4">
                        <Heart size={24} />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900">Sứ Mệnh</h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      Mang đến dịch vụ chăm sóc sức khỏe đẳng cấp quốc tế, 
                      với sự an toàn, hiệu quả và nhân văn cao nhất cho mọi bệnh nhân.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group">
                <CardContent className="p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 rounded-xl mr-4">
                        <Star size={24} />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900">Tầm Nhìn</h4>
                    </div>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      Trở thành hệ thống y tế hàng đầu Việt Nam, tiên phong 
                      trong ứng dụng AI và công nghệ số vào chăm sóc sức khỏe.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden group">
                <CardContent className="p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl mr-4">
                        <Shield size={24} />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900">Giá Trị Cốt Lõi</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
  {[" Chuyên nghiệp", "An toàn", "Hiệu quả", "Tận tâm", "Chính trực"].map((value, index) => (
    <span
      key={index}
      className={`${
        index < 5
          ? "bg-gradient-to-r from-red-400 to-red-800"
          : "bg-gradient-to-r from-blue-500 to-indigo-500"
      } text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300`}
    >
      {value}
    </span>
  ))}
</div>

                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Stethoscope size={16} className="mr-2" />
              Dịch vụ của chúng tôi
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Dịch Vụ Y Tế <span className="text-purple-600">Toàn Diện</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cung cấp đầy đủ các dịch vụ y tế từ cơ bản đến chuyên sâu 
              với chất lượng đẳng cấp quốc tế
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-10">
            {[
              {
                icon: Building,
                title: "Khám Tổng Quát",
                desc: "Đánh giá toàn diện sức khỏe với gói khám định kỳ chuyên nghiệp.",
                color: "from-blue-500 to-cyan-500",
                bgColor: "hover:bg-blue-50"
              },
              {
                icon: Stethoscope,
                title: "Chuyên Khoa Nội",
                desc: "Chẩn đoán và điều trị các bệnh lý nội khoa phức tạp hiệu quả.",
                color: "from-emerald-500 to-green-500",
                bgColor: "hover:bg-emerald-50"
              },
              {
                icon: Heart,
                title: "Tim Mạch",
                desc: "Trung tâm tim mạch hiện đại với công nghệ can thiệp tim mạch tiên tiến.",
                color: "from-red-500 to-pink-500",
                bgColor: "hover:bg-red-50"
              },
              {
                icon: Shield,
                title: "Tiêm Chủng",
                desc: "Chương trình tiêm chủng đầy đủ với vắc-xin nhập khẩu chính hãng.",
                color: "from-purple-500 to-indigo-500",
                bgColor: "hover:bg-purple-50"
              },
              {
                icon: Users,
                title: "Sức Khỏe Gia Đình",
                desc: "Gói chăm sóc sức khỏe toàn diện cho mọi thành viên trong gia đình.",
                color: "from-orange-500 to-yellow-500",
                bgColor: "hover:bg-orange-50"
              },
              {
                icon: Phone,
                title: "Tư Vấn Trực Tuyến",
                desc: "Dịch vụ telemedicine 24/7 với đội ngũ bác sĩ chuyên khoa.",
                color: "from-teal-500 to-cyan-500",
                bgColor: "hover:bg-teal-50"
              }
            ].map((service, index) => (
              <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border-0 shadow-lg ${service.bgColor} cursor-pointer`}>
                <CardContent className="p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/50 to-transparent"></div>
                  <div className="relative z-10">
                    <div className={`bg-gradient-to-r ${service.color} text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <service.icon size={28} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{service.desc}</p>
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button variant="outline" className="text-sm border-gray-300 hover:border-gray-400">
                        Tìm hiểu thêm
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Sẵn Sàng Chăm Sóc Sức Khỏe Của Bạn?
            </h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">
              Đặt lịch khám ngay hôm nay để được tư vấn miễn phí 
              từ đội ngũ chuyên gia y tế hàng đầu
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                Đặt Lịch Khám Ngay
              </Button>
              <Button
  variant="outline"
  className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
>
  <Phone size={20} className="mr-2" />
  Gọi Hotline: 1900-xxx-xxx
</Button>

            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}