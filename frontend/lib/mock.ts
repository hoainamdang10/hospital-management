// Mock data for Hospital Management System Homepage
export type Role = 'guest' | 'patient' | 'doctor' | 'admin';

export interface Doctor {
  id: string;
  name: string;
  department: string;
  departmentVi: string;
  years: number;
  rating: number;
  slotsToday: number;
  avatar?: string;
  specialties: string[];
  specialtiesVi: string[];
  price: number;
  isAvailable: boolean;
}

export interface Department {
  id: string;
  name: string;
  nameVi: string;
  brief: string;
  briefVi: string;
  icon: string;
  services: string[];
  servicesVi: string[];
}

export interface Announcement {
  id: string;
  title: string;
  titleVi: string;
  date: string;
  tag?: string;
  tagVi?: string;
  href: string;
  excerpt: string;
  excerptVi: string;
}

export interface Stats {
  patientsServed: number;
  doctors: number;
  avgRating: number;
  appointmentsToday: number;
  occupancyRate: number;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  commentVi: string;
  department: string;
  departmentVi: string;
  avatar?: string;
}

// Mock Doctors Data
export const mockDoctors: Doctor[] = [
  {
    id: 'CARD-DOC-202501-001',
    name: 'BS. Nguyễn Văn Hùng',
    department: 'Cardiology',
    departmentVi: 'Tim mạch',
    years: 15,
    rating: 4.9,
    slotsToday: 3,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Heart Surgery', 'Cardiac Catheterization', 'Echocardiography'],
    specialtiesVi: ['Phẫu thuật tim', 'Thông tim', 'Siêu âm tim'],
    price: 500000,
    isAvailable: true,
  },
  {
    id: 'PEDI-DOC-202501-002',
    name: 'BS. Trần Thị Mai',
    department: 'Pediatrics',
    departmentVi: 'Nhi khoa',
    years: 12,
    rating: 4.8,
    slotsToday: 5,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Child Development', 'Vaccination', 'Pediatric Emergency'],
    specialtiesVi: ['Phát triển trẻ em', 'Tiêm chủng', 'Cấp cứu nhi'],
    price: 300000,
    isAvailable: true,
  },
  {
    id: 'ORTH-DOC-202501-003',
    name: 'BS. Lê Minh Tuấn',
    department: 'Orthopedics',
    departmentVi: 'Chấn thương chỉnh hình',
    years: 18,
    rating: 4.7,
    slotsToday: 2,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Joint Replacement', 'Sports Medicine', 'Spine Surgery'],
    specialtiesVi: ['Thay khớp', 'Y học thể thao', 'Phẫu thuật cột sống'],
    price: 600000,
    isAvailable: true,
  },
  {
    id: 'DERM-DOC-202501-004',
    name: 'BS. Phạm Thị Lan',
    department: 'Dermatology',
    departmentVi: 'Da liễu',
    years: 10,
    rating: 4.6,
    slotsToday: 4,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Acne Treatment', 'Skin Cancer', 'Cosmetic Dermatology'],
    specialtiesVi: ['Điều trị mụn', 'Ung thư da', 'Da liễu thẩm mỹ'],
    price: 400000,
    isAvailable: true,
  },
  {
    id: 'ENT-DOC-202501-005',
    name: 'BS. Hoàng Văn Nam',
    department: 'ENT',
    departmentVi: 'Tai Mũi Họng',
    years: 14,
    rating: 4.8,
    slotsToday: 3,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Hearing Loss', 'Sinus Surgery', 'Voice Disorders'],
    specialtiesVi: ['Mất thính lực', 'Phẫu thuật xoang', 'Rối loạn giọng nói'],
    price: 350000,
    isAvailable: true,
  },
  {
    id: 'ENDO-DOC-202501-006',
    name: 'BS. Vũ Thị Hoa',
    department: 'Endocrinology',
    departmentVi: 'Nội tiết',
    years: 16,
    rating: 4.9,
    slotsToday: 2,
    avatar: '/placeholder.svg?height=100&width=100',
    specialties: ['Diabetes', 'Thyroid Disorders', 'Hormone Therapy'],
    specialtiesVi: ['Tiểu đường', 'Rối loạn tuyến giáp', 'Liệu pháp hormone'],
    price: 450000,
    isAvailable: false,
  },
];

// Mock Departments Data
export const mockDepartments: Department[] = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    nameVi: 'Tim mạch',
    brief: 'Comprehensive heart and cardiovascular care',
    briefVi: 'Chăm sóc tim mạch và hệ tuần hoàn toàn diện',
    icon: '❤️',
    services: ['ECG', 'Echocardiography', 'Cardiac Catheterization', 'Heart Surgery'],
    servicesVi: ['Điện tim', 'Siêu âm tim', 'Thông tim', 'Phẫu thuật tim'],
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    nameVi: 'Nhi khoa',
    brief: 'Specialized care for children and adolescents',
    briefVi: 'Chăm sóc chuyên khoa cho trẻ em và thanh thiếu niên',
    icon: '👶',
    services: ['Vaccination', 'Growth Monitoring', 'Pediatric Emergency', 'Child Development'],
    servicesVi: ['Tiêm chủng', 'Theo dõi phát triển', 'Cấp cứu nhi', 'Phát triển trẻ em'],
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    nameVi: 'Chấn thương chỉnh hình',
    brief: 'Bone, joint, and muscle treatment',
    briefVi: 'Điều trị xương, khớp và cơ',
    icon: '🦴',
    services: ['Joint Replacement', 'Fracture Treatment', 'Sports Medicine', 'Spine Surgery'],
    servicesVi: ['Thay khớp', 'Điều trị gãy xương', 'Y học thể thao', 'Phẫu thuật cột sống'],
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    nameVi: 'Da liễu',
    brief: 'Skin, hair, and nail disorders',
    briefVi: 'Rối loạn da, tóc và móng',
    icon: '🧴',
    services: ['Acne Treatment', 'Skin Cancer Screening', 'Cosmetic Procedures', 'Allergy Testing'],
    servicesVi: ['Điều trị mụn', 'Tầm soát ung thư da', 'Thủ thuật thẩm mỹ', 'Xét nghiệm dị ứng'],
  },
  {
    id: 'ent',
    name: 'ENT (Ear, Nose, Throat)',
    nameVi: 'Tai Mũi Họng',
    brief: 'Ear, nose, throat, and head-neck surgery',
    briefVi: 'Phẫu thuật tai, mũi, họng và đầu cổ',
    icon: '👂',
    services: ['Hearing Tests', 'Sinus Surgery', 'Tonsillectomy', 'Voice Therapy'],
    servicesVi: ['Kiểm tra thính lực', 'Phẫu thuật xoang', 'Cắt amidan', 'Trị liệu giọng nói'],
  },
  {
    id: 'endocrinology',
    name: 'Endocrinology',
    nameVi: 'Nội tiết',
    brief: 'Hormone and metabolic disorders',
    briefVi: 'Rối loạn hormone và chuyển hóa',
    icon: '🧬',
    services: ['Diabetes Management', 'Thyroid Treatment', 'Hormone Therapy', 'Metabolic Disorders'],
    servicesVi: ['Quản lý tiểu đường', 'Điều trị tuyến giáp', 'Liệu pháp hormone', 'Rối loạn chuyển hóa'],
  },
  {
    id: 'neurology',
    name: 'Neurology',
    nameVi: 'Thần kinh',
    brief: 'Brain and nervous system disorders',
    briefVi: 'Rối loạn não bộ và hệ thần kinh',
    icon: '🧠',
    services: ['Stroke Treatment', 'Epilepsy Management', 'Headache Treatment', 'Neurological Exams'],
    servicesVi: ['Điều trị đột quỵ', 'Quản lý động kinh', 'Điều trị đau đầu', 'Khám thần kinh'],
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    nameVi: 'Cấp cứu',
    brief: '24/7 emergency medical care',
    briefVi: 'Chăm sóc y tế cấp cứu 24/7',
    icon: '🚨',
    services: ['Trauma Care', 'Critical Care', 'Emergency Surgery', 'Poison Control'],
    servicesVi: ['Chăm sóc chấn thương', 'Chăm sóc tích cực', 'Phẫu thuật cấp cứu', 'Kiểm soát độc chất'],
  },
];

// Mock Announcements Data
export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-001',
    title: 'New Telemedicine Services Available',
    titleVi: 'Dịch vụ Khám bệnh từ xa mới có sẵn',
    date: '2025-01-15',
    tag: 'Technology',
    tagVi: 'Công nghệ',
    href: '/news/telemedicine-services',
    excerpt: 'Experience convenient healthcare from the comfort of your home with our new telemedicine platform.',
    excerptVi: 'Trải nghiệm chăm sóc sức khỏe tiện lợi tại nhà với nền tảng khám bệnh từ xa mới của chúng tôi.',
  },
  {
    id: 'ann-002',
    title: 'COVID-19 Vaccination Drive',
    titleVi: 'Chiến dịch Tiêm chủng COVID-19',
    date: '2025-01-10',
    tag: 'Health',
    tagVi: 'Sức khỏe',
    href: '/news/covid-vaccination',
    excerpt: 'Free COVID-19 vaccination available for all age groups. Book your appointment today.',
    excerptVi: 'Tiêm chủng COVID-19 miễn phí cho mọi lứa tuổi. Đặt lịch hẹn ngay hôm nay.',
  },
  {
    id: 'ann-003',
    title: 'New Cardiac Surgery Wing Opens',
    titleVi: 'Khánh thành Khoa Phẫu thuật Tim mới',
    date: '2025-01-05',
    tag: 'Facility',
    tagVi: 'Cơ sở vật chất',
    href: '/news/cardiac-surgery-wing',
    excerpt: 'State-of-the-art cardiac surgery facilities now available with advanced equipment and expert surgeons.',
    excerptVi: 'Cơ sở phẫu thuật tim hiện đại với trang thiết bị tiên tiến và đội ngũ bác sĩ chuyên gia.',
  },
];

// Mock Stats Data
export const mockStats: Stats = {
  patientsServed: 25000,
  doctors: 150,
  avgRating: 4.8,
  appointmentsToday: 85,
  occupancyRate: 78,
};

// Mock Testimonials Data
export const mockTestimonials: Testimonial[] = [
  {
    id: 'test-001',
    name: 'Nguyễn Thị A.',
    rating: 5,
    comment: 'Excellent care and professional staff. The online booking system is very convenient.',
    commentVi: 'Chăm sóc tuyệt vời và đội ngũ chuyên nghiệp. Hệ thống đặt lịch trực tuyến rất tiện lợi.',
    department: 'Cardiology',
    departmentVi: 'Tim mạch',
    avatar: '/placeholder.svg?height=60&width=60',
  },
  {
    id: 'test-002',
    name: 'Trần Văn B.',
    rating: 5,
    comment: 'Quick diagnosis and effective treatment. Highly recommend this hospital.',
    commentVi: 'Chẩn đoán nhanh và điều trị hiệu quả. Rất khuyến khích bệnh viện này.',
    department: 'Orthopedics',
    departmentVi: 'Chấn thương chỉnh hình',
    avatar: '/placeholder.svg?height=60&width=60',
  },
  {
    id: 'test-003',
    name: 'Lê Thị C.',
    rating: 4,
    comment: 'Great pediatric care for my children. The doctors are very patient and caring.',
    commentVi: 'Chăm sóc nhi khoa tuyệt vời cho con em tôi. Các bác sĩ rất kiên nhẫn và chu đáo.',
    department: 'Pediatrics',
    departmentVi: 'Nhi khoa',
    avatar: '/placeholder.svg?height=60&width=60',
  },
];

// Mock Session Data
export interface MockSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    avatar?: string;
  } | null;
}

export const mockSessions: Record<Role, MockSession> = {
  guest: { user: null },
  patient: {
    user: {
      id: 'PAT-202501-001',
      email: 'patient@hospital.com',
      name: 'Nguyễn Văn Patient',
      role: 'patient',
      avatar: '/placeholder.svg?height=40&width=40',
    },
  },
  doctor: {
    user: {
      id: 'CARD-DOC-202501-001',
      email: 'doctor@hospital.com',
      name: 'BS. Nguyễn Văn Hùng',
      role: 'doctor',
      avatar: '/placeholder.svg?height=40&width=40',
    },
  },
  admin: {
    user: {
      id: 'ADM-001',
      email: 'admin@hospital.com',
      name: 'Admin User',
      role: 'admin',
      avatar: '/placeholder.svg?height=40&width=40',
    },
  },
};

// Search Data for Command Palette
export interface SearchResult {
  id: string;
  title: string;
  titleVi: string;
  type: 'doctor' | 'department' | 'page' | 'service';
  href: string;
  description?: string;
  descriptionVi?: string;
}

export const mockSearchResults: SearchResult[] = [
  // Doctors
  ...mockDoctors.map(doctor => ({
    id: doctor.id,
    title: doctor.name,
    titleVi: doctor.name,
    type: 'doctor' as const,
    href: `/doctors/${doctor.id}`,
    description: `${doctor.department} - ${doctor.years} years experience`,
    descriptionVi: `${doctor.departmentVi} - ${doctor.years} năm kinh nghiệm`,
  })),
  // Departments
  ...mockDepartments.map(dept => ({
    id: dept.id,
    title: dept.name,
    titleVi: dept.nameVi,
    type: 'department' as const,
    href: `/departments/${dept.id}`,
    description: dept.brief,
    descriptionVi: dept.briefVi,
  })),
  // Pages
  {
    id: 'appointments',
    title: 'Book Appointment',
    titleVi: 'Đặt lịch khám',
    type: 'page',
    href: '/book-appointment',
    description: 'Schedule your medical appointment',
    descriptionVi: 'Lên lịch cuộc hẹn y tế của bạn',
  },
  {
    id: 'doctors-page',
    title: 'Find Doctors',
    titleVi: 'Tìm bác sĩ',
    type: 'page',
    href: '/doctors',
    description: 'Browse our medical specialists',
    descriptionVi: 'Duyệt các chuyên gia y tế của chúng tôi',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    titleVi: 'Liên hệ',
    type: 'page',
    href: '/contact',
    description: 'Get in touch with our hospital',
    descriptionVi: 'Liên hệ với bệnh viện của chúng tôi',
  },
];
