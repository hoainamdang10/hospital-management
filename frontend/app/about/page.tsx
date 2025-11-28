'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Building2, Users, Award, Heart,
  CheckCircle2, ArrowRight, Star,
  ShieldCheck, Microscope, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000"
          alt="Hospital Team"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl text-white"
            >
              <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
                Chăm sóc sức khỏe <br />
                <span className="text-primary-400">Từ trái tim</span>
              </h1>
              <p className="mb-8 text-xl text-slate-200 leading-relaxed">
                Hơn 15 năm đồng hành cùng sức khỏe cộng đồng, chúng tôi tự hào là hệ thống y tế
                tiên phong ứng dụng công nghệ cao kết hợp với y đức của người thầy thuốc.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="rounded-full bg-primary px-8 text-lg hover:bg-primary-600">
                  Đặt lịch khám
                </Button>
                <Button size="lg" variant="outline" className="rounded-full border-white px-8 text-lg text-white hover:bg-white hover:text-slate-900">
                  Tìm hiểu thêm
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Floating */}
      <section className="relative z-10 -mt-16 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Building2}
              value="15+"
              label="Năm kinh nghiệm"
              description="Phát triển bền vững"
            />
            <StatCard
              icon={Users}
              value="100+"
              label="Bác sĩ chuyên khoa"
              description="Đầu ngành y tế"
            />
            <StatCard
              icon={Award}
              value="50+"
              label="Giải thưởng"
              description="Uy tín quốc tế"
            />
            <StatCard
              icon={Heart}
              value="10k+"
              label="Bệnh nhân hài lòng"
              description="Mỗi năm"
            />
          </div>
        </div>
      </section>

      {/* Story / Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"
                  alt="Modern Hospital Building"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-blue-100 blur-3xl" />

              {/* Floating Badge */}
              <div className="absolute bottom-8 left-8 rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Chứng nhận</p>
                    <p className="text-lg font-bold text-slate-900">JCI Quốc tế</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-sm font-bold uppercase tracking-wider text-primary">Về chúng tôi</span>
              <h2 className="mt-2 text-4xl font-bold text-slate-900 sm:text-5xl">
                Nâng tầm chất lượng <br />
                <span className="text-primary">Cuộc sống Việt</span>
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                HospitalV2 không chỉ là một bệnh viện, mà là một hệ sinh thái chăm sóc sức khỏe toàn diện.
                Chúng tôi tin rằng mỗi bệnh nhân đều xứng đáng nhận được sự chăm sóc tốt nhất,
                không chỉ về mặt y khoa mà còn về tinh thần.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Đội ngũ y bác sĩ đầu ngành, giàu kinh nghiệm",
                  "Trang thiết bị y tế hiện đại chuẩn Châu Âu",
                  "Quy trình khám chữa bệnh nhanh chóng, số hóa",
                  "Chi phí hợp lý, minh bạch"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button variant="ghost" className="group text-primary hover:bg-primary/5">
                  Xem thêm về lịch sử hình thành
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-slate-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Giá trị cốt lõi</h2>
            <p className="mt-4 text-lg text-slate-600">
              Những nguyên tắc định hình mọi hành động và quyết định của chúng tôi
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <ValueCard
              icon={Heart}
              title="Tận tâm"
              description="Đặt người bệnh làm trung tâm, lắng nghe và thấu hiểu mọi nỗi đau để chữa lành bằng cả trái tim."
              color="bg-red-50 text-red-600"
            />
            <ValueCard
              icon={Microscope}
              title="Chuyên nghiệp"
              description="Không ngừng nâng cao trình độ chuyên môn, tuân thủ quy trình chuẩn y khoa quốc tế."
              color="bg-blue-50 text-blue-600"
            />
            <ValueCard
              icon={Star}
              title="Tiên phong"
              description="Đi đầu trong việc ứng dụng công nghệ mới và các phương pháp điều trị tiên tiến nhất."
              color="bg-amber-50 text-amber-600"
            />
          </div>
        </div>
      </section>

      {/* Leadership / Doctors Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Ban lãnh đạo</h2>
              <p className="mt-2 text-lg text-slate-600">Những người dẫn dắt con thuyền HospitalV2</p>
            </div>
            <Button variant="outline">Xem toàn bộ đội ngũ</Button>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl bg-gray-100">
                <div className="aspect-[3/4] relative">
                  <Image
                    src={`https://images.unsplash.com/photo-${i === 1 ? '1612349317150-b4636e56bcc2' :
                        i === 2 ? '1537368910059-647330700082' :
                          i === 3 ? '1594824476969-23adf906d5e7' :
                            '1622253639032-481f514c23e1'
                      }?auto=format&fit=crop&q=80&w=800`}
                    alt="Doctor"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="absolute bottom-0 left-0 p-6 text-white opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <p className="font-bold text-lg">GS. TS. Nguyễn Văn {String.fromCharCode(64 + i)}</p>
                    <p className="text-sm text-slate-300">Giám đốc chuyên môn</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">Sẵn sàng chăm sóc sức khỏe cho bạn?</h2>
          <p className="max-w-2xl mx-auto text-xl text-primary-100 mb-10">
            Đừng ngần ngại liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary hover:bg-slate-100 rounded-full px-8 h-14 text-lg font-semibold">
              Đặt lịch ngay
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg font-semibold">
              Liên hệ tư vấn
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function StatCard({ icon: Icon, value, label, description }: { icon: any; value: string; label: string; description: string }) {
  return (
    <div className="group rounded-2xl bg-white p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-100">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-4xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-sm text-slate-500 mt-1">{description}</div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description, color }: { icon: any; title: string; description: string; color: string }) {
  return (
    <div className="group rounded-3xl bg-white p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:border-primary/20">
      <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full ${color} bg-opacity-20`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-3 text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
