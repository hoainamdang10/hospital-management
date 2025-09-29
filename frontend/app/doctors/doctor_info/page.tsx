'use client';
import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Award,
  Users,
  Heart,
  Stethoscope,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { authApi } from "@/lib/auth";
import { doctorsApi } from "@/lib/api";
import { toast } from "sonner";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  title: string;
  experience: string;
  rating: number;
  reviews: number;
  patients: number;
  description: string;
  education: string[];
  languages: string[];
  schedule: string[];
  location: string;
  phone: string;
  email: string;
  achievements: string[];
  specialties: string[];
  consultationFee: string;
  nextAvailable: string;
  image?: string;
  aboutMe: string;
  treatmentApproach: string;
  certifications: string[];
}

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string; // Keep as string for API calls
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Load doctor data from API
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;

      try {
        setLoading(true);
        const response = await doctorsApi.getById(doctorId);

        if (response.success && response.data) {
          // Transform API data to match frontend interface
          const apiDoctor = response.data;
          const transformedDoctor: Doctor = {
            id: parseInt(apiDoctor.doctor_id) || parseInt(doctorId),
            name: apiDoctor.full_name || apiDoctor.name || 'Doctor',
            specialty: apiDoctor.departments?.name || apiDoctor.specialization || 'General Medicine',
            title: apiDoctor.title || 'Doctor',
            experience: apiDoctor.experience_years ? `${apiDoctor.experience_years} năm` : 'N/A',
            rating: apiDoctor.average_rating || 4.5,
            reviews: apiDoctor.total_reviews || 0,
            patients: apiDoctor.total_patients || 0,
            description: apiDoctor.bio || apiDoctor.description || 'Experienced medical professional dedicated to providing quality healthcare.',
            aboutMe: apiDoctor.about_me || apiDoctor.bio || 'Dedicated healthcare professional with extensive experience in medical practice.',
            treatmentApproach: apiDoctor.treatment_approach || 'Patient-centered care with focus on comprehensive treatment and compassionate service.',
            education: apiDoctor.education ? (Array.isArray(apiDoctor.education) ? apiDoctor.education : [apiDoctor.education]) : ['Medical Degree'],
            languages: apiDoctor.languages ? (Array.isArray(apiDoctor.languages) ? apiDoctor.languages : [apiDoctor.languages]) : ['Tiếng Việt'],
            schedule: apiDoctor.schedule ? (Array.isArray(apiDoctor.schedule) ? apiDoctor.schedule : [apiDoctor.schedule]) : ['Liên hệ để biết lịch khám'],
            location: apiDoctor.office_location || apiDoctor.location || 'Hospital',
            phone: apiDoctor.phone_number || apiDoctor.phone || 'N/A',
            email: apiDoctor.email || 'N/A',
            achievements: apiDoctor.achievements ? (Array.isArray(apiDoctor.achievements) ? apiDoctor.achievements : [apiDoctor.achievements]) : [],
            specialties: apiDoctor.specialties ? (Array.isArray(apiDoctor.specialties) ? apiDoctor.specialties : [apiDoctor.specialties]) : [apiDoctor.departments?.name || 'General Medicine'],
            consultationFee: apiDoctor.consultation_fee || '300.000 VNĐ',
            nextAvailable: 'Liên hệ để đặt lịch',
            certifications: apiDoctor.certifications ? (Array.isArray(apiDoctor.certifications) ? apiDoctor.certifications : [apiDoctor.certifications]) : []
          };

          setDoctor(transformedDoctor);
        } else {
          toast.error('Không thể tải thông tin bác sĩ');
          router.push('/doctors');
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
        toast.error('Lỗi khi tải thông tin bác sĩ');
        router.push('/doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId, router]);

  // Mock data removed - now using real API data

  const checkAuthAndRedirect = async () => {
    setCheckingAuth(true);

    try {
      const { data } = await authApi.getCurrentUser();

      if (data?.user && data?.profile) {
        localStorage.setItem('selectedDoctorId', doctorId);

        if (data.profile.role === 'patient') {
          router.push('/patient/profile?action=booking');
        } else if (data.profile.role === 'doctor') {
          router.push('/doctors/dashboard');
        } else {
          router.push(`/${data.profile.role}/dashboard`);
        }
      } else {
        localStorage.setItem('selectedDoctorId', doctorId);
        router.push('/auth/login?redirect=booking');
      }
    } catch (error) {
      localStorage.setItem('selectedDoctorId', doctorId);
      router.push('/auth/login?redirect=booking');
    } finally {
      setCheckingAuth(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin bác sĩ...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bác sĩ</h2>
          <Button onClick={() => router.push('/doctors')}>
            Quay lại danh sách bác sĩ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f7ff] to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/doctors')}
            className="text-[#0066CC] hover:bg-[#0066CC]/10"
          >
            <ArrowLeft className="mr-2" size={20} />
            Quay lại danh sách bác sĩ
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Doctor Hero Section */}
        <Card className="shadow-xl border-0 mb-8">
          <CardContent className="p-0">
            <div className="relative bg-gradient-to-r from-[#003087] to-[#0056b3] text-white p-8 rounded-t-lg">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ring-8 ring-white/30 flex-shrink-0">
                  <span className="text-4xl font-bold">
                    {doctor.name.split(' ').pop()?.charAt(0)}
                  </span>
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{doctor.name}</h1>
                  <p className="text-blue-100 text-xl mb-2">{doctor.title}</p>
                  <p className="text-blue-100 text-lg mb-4">{doctor.specialty}</p>

                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${i < Math.floor(doctor.rating) ? 'text-yellow-300 fill-current' : 'text-white/30'}`}
                        />
                      ))}
                      <span className="ml-2 font-bold text-xl">{doctor.rating}</span>
                    </div>
                    <span className="text-blue-100">({doctor.reviews} đánh giá)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{doctor.experience}</div>
                      <div className="text-sm text-blue-100">Kinh nghiệm</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{doctor.patients}+</div>
                      <div className="text-sm text-blue-100">Bệnh nhân</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{doctor.consultationFee}</div>
                      <div className="text-sm text-blue-100">Phí khám</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  className="bg-white text-[#003087] hover:bg-gray-100 px-8 py-3 font-bold text-lg flex-1 sm:flex-none"
                  onClick={checkAuthAndRedirect}
                  disabled={checkingAuth}
                >
                  {checkingAuth ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#003087] mr-2"></div>
                      Đang kiểm tra...
                    </div>
                  ) : (
                    <>
                      <Calendar className="mr-2" size={20} />
                      Đặt lịch khám
                    </>
                  )}
                </Button>


<Button
  variant="outline"
  className="bg-white text-[#003087] border-2 border-[#003087] hover:bg-[#003087] hover:text-white px-6 py-3 font-bold rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center"
  onClick={() => {
    Swal.fire({
      title: 'Gọi điện thoại?',
      text: `Bạn có muốn gọi tới số ${doctor.phone}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003087',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Gọi ngay',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        window.open(`tel:${doctor.phone}`, '_self');
      }
    });
  }}
>
  <Phone className="mr-2" size={20} />
  Gọi điện
</Button>


<Button
  variant="outline"
  className="bg-white text-[#003087] border-2 border-[#003087] hover:bg-[#003087] hover:text-white px-6 py-3 font-bold rounded-lg shadow-md hover:shadow-lg transition duration-200 flex items-center"
  onClick={() => window.open(`mailto:${doctor.email}`, '_self')}
>
  <Mail className="mr-2" size={20} />
  Email
</Button>

              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Me */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4">Giới thiệu</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{doctor.aboutMe}</p>
                <p className="text-gray-600 leading-relaxed">{doctor.description}</p>
              </CardContent>
            </Card>

            {/* Treatment Approach */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <Heart className="mr-3 text-[#0066CC]" size={24} />
                  Phương pháp điều trị
                </h2>
                <p className="text-gray-600 leading-relaxed">{doctor.treatmentApproach}</p>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <Stethoscope className="mr-3 text-[#0066CC]" size={24} />
                  Chuyên môn
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctor.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center bg-blue-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-[#0066CC] mr-3" />
                      <span className="text-gray-700 font-medium">{specialty}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Education & Certifications */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1a3b5d] mb-6 flex items-center">
                  <GraduationCap className="mr-3 text-[#0066CC]" size={24} />
                  Trình độ & Chứng chỉ
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Học vấn</h3>
                    <ul className="space-y-2">
                      {doctor.education.map((edu, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#0066CC] mr-3 mt-1">•</span>
                          <span className="text-gray-600">{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Chứng chỉ chuyên môn</h3>
                    <ul className="space-y-2">
                      {doctor.certifications?.map((cert, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#0066CC] mr-3 mt-1">•</span>
                          <span className="text-gray-600">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <Award className="mr-3 text-[#0066CC]" size={24} />
                  Thành tựu
                </h2>
                <div className="grid gap-3">
                  {doctor.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <Award className="w-5 h-5 text-yellow-600 mr-3" />
                      <span className="text-gray-700 font-medium">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Booking */}
            <Card className="shadow-lg border-l-4 border-l-[#0066CC]">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-4">Đặt lịch nhanh</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Calendar size={20} className="text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600">Lịch gần nhất</div>
                      <div className="font-bold text-green-700">{doctor.nextAvailable}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#0066CC] hover:bg-[#0055AA] py-3 font-bold"
                    onClick={checkAuthAndRedirect}
                    disabled={checkingAuth}
                  >
                    {checkingAuth ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang kiểm tra...
                      </div>
                    ) : (
                      <>
                        <Calendar className="mr-2" size={18} />
                        Đặt lịch ngay
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <MapPin className="mr-2 text-[#0066CC]" size={20} />
                  Thông tin liên hệ
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-500 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Địa chỉ khám</div>
                      <div className="text-gray-800 font-medium">{doctor.location}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-gray-500 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Điện thoại</div>
                      <div className="text-gray-800 font-medium">{doctor.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-gray-500 mt-1" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="text-gray-800 font-medium">{doctor.email}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <Clock className="mr-2 text-[#0066CC]" size={20} />
                  Lịch khám
                </h3>
                <div className="space-y-3">
                  {doctor.schedule.map((time, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <Clock size={16} className="text-[#0066CC]" />
                      <span className="text-gray-700 font-medium">{time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-[#1a3b5d] mb-4 flex items-center">
                  <MessageCircle className="mr-2 text-[#0066CC]" size={20} />
                  Ngôn ngữ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages.map((lang, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}