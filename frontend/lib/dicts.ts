// Translation dictionaries for Hospital Management System
import { Dictionary } from './i18n';

export const vietnameseDictionary: Dictionary = {
  // Navigation
  nav: {
    home: 'Trang chủ',
    doctors: 'Bác sĩ',
    departments: 'Khoa',
    appointments: 'Đặt lịch',
    pricing: 'Bảng giá',
    news: 'Tin tức',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    login: 'Đăng nhập',
    signup: 'Đăng ký',
    dashboard: 'Bảng điều khiển',
    profile: 'Hồ sơ',
    logout: 'Đăng xuất',
  },

  // Hero Section
  hero: {
    headline: 'Đặt lịch khám thông minh — nhanh, chính xác, an toàn',
    subheadline: 'Hệ thống quản lý bệnh viện hiện đại với đội ngũ bác sĩ chuyên nghiệp và công nghệ tiên tiến',
    ctaPrimary: 'Đặt lịch ngay',
    ctaSecondary: 'Xem bác sĩ',
    stats: {
      patients: 'Bệnh nhân đã phục vụ',
      doctors: 'Bác sĩ tham gia',
      rating: 'Đánh giá trung bình',
    },
  },

  // Booking Widget
  booking: {
    title: 'Đặt lịch khám nhanh',
    department: 'Chọn chuyên khoa',
    doctor: 'Chọn bác sĩ',
    date: 'Chọn ngày',
    time: 'Chọn giờ',
    type: 'Hình thức khám',
    inPerson: 'Tại viện',
    telehealth: 'Khám từ xa',
    submit: 'Đặt lịch',
    price: 'Phí khám',
    available: 'Còn trống',
    unavailable: 'Hết lịch',
    selectDepartment: 'Vui lòng chọn chuyên khoa',
    selectDoctor: 'Vui lòng chọn bác sĩ',
    loginRequired: 'Vui lòng đăng nhập để đặt lịch',
  },

  // Doctors Section
  doctors: {
    title: 'Bác sĩ nổi bật',
    subtitle: 'Đội ngũ bác sĩ giàu kinh nghiệm và chuyên môn cao',
    experience: 'năm kinh nghiệm',
    rating: 'Đánh giá',
    slotsAvailable: 'lịch trống hôm nay',
    viewProfile: 'Xem chi tiết',
    bookAppointment: 'Đặt lịch',
    specialties: 'Chuyên môn',
    filterAll: 'Tất cả',
  },

  // Departments Section
  departments: {
    title: 'Các khoa chuyên môn',
    subtitle: 'Dịch vụ y tế toàn diện với trang thiết bị hiện đại',
    viewServices: 'Xem dịch vụ',
    services: 'Dịch vụ',
  },

  // System Highlights
  highlights: {
    title: 'Ưu điểm hệ thống',
    security: {
      title: 'Bảo mật & RLS',
      description: 'Bảo vệ dữ liệu với Supabase Row Level Security',
    },
    realtime: {
      title: 'Đặt lịch thời gian thực',
      description: 'Cập nhật lịch trống ngay lập tức',
    },
    telehealth: {
      title: 'Khám từ xa & Nhắc lịch',
      description: 'Khám bệnh online và thông báo tự động',
    },
    records: {
      title: 'Hồ sơ sức khỏe số',
      description: 'Quản lý hồ sơ bệnh án điện tử an toàn',
    },
  },

  // News Section
  news: {
    title: 'Tin tức & Thông báo',
    subtitle: 'Cập nhật thông tin y tế và hoạt động bệnh viện',
    readMore: 'Đọc thêm',
    viewAll: 'Xem tất cả',
    recent: 'Tin mới nhất',
  },

  // Pricing Section
  pricing: {
    title: 'Gói dịch vụ',
    subtitle: 'Lựa chọn gói phù hợp với nhu cầu của bạn',
    basic: 'Cơ bản',
    plus: 'Nâng cao',
    enterprise: 'Doanh nghiệp',
    viewDetails: 'Xem chi tiết',
    popular: 'Phổ biến',
  },

  // Testimonials
  testimonials: {
    title: 'Nhận xét từ bệnh nhân',
    subtitle: 'Trải nghiệm thực tế từ những người đã sử dụng dịch vụ',
  },

  // CTA Section
  cta: {
    title: 'Sẵn sàng đặt lịch khám?',
    subtitle: 'Bắt đầu hành trình chăm sóc sức khỏe của bạn ngay hôm nay',
    register: 'Đăng ký ngay',
    book: 'Đặt lịch ngay',
  },

  // Footer
  footer: {
    aboutUs: 'Về chúng tôi',
    services: 'Dịch vụ',
    contact: 'Liên hệ',
    privacy: 'Chính sách bảo mật',
    terms: 'Điều khoản sử dụng',
    rights: 'Bản quyền thuộc về Hospital Management',
    hotline: 'Hotline',
    address: 'Địa chỉ',
    email: 'Email',
  },

  // Role-based shortcuts
  roleShortcuts: {
    patient: {
      myAppointments: 'Lịch khám của tôi',
      medicalRecords: 'Hồ sơ bệnh án',
      reminders: 'Nhắc lịch',
      healthTracking: 'Theo dõi sức khỏe',
    },
    doctor: {
      todaySchedule: 'Lịch làm việc hôm nay',
      pendingConsultations: 'Yêu cầu tư vấn chờ duyệt',
      patientRecords: 'Hồ sơ bệnh nhân',
      myProfile: 'Hồ sơ của tôi',
    },
    admin: {
      systemAdmin: 'Quản trị hệ thống',
      quickStats: 'Thống kê nhanh',
      todayAppointments: 'Lịch khám hôm nay',
      occupancyRate: 'Tỷ lệ lấp đầy',
      queueManagement: 'Quản lý hàng đợi',
    },
  },

  // Command Palette
  search: {
    placeholder: 'Tìm kiếm bác sĩ, khoa, dịch vụ...',
    noResults: 'Không tìm thấy kết quả',
    doctors: 'Bác sĩ',
    departments: 'Khoa',
    pages: 'Trang',
    services: 'Dịch vụ',
    shortcut: 'Nhấn Ctrl+K để tìm kiếm',
  },

  // Common
  common: {
    loading: 'Đang tải...',
    error: 'Có lỗi xảy ra',
    retry: 'Thử lại',
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    close: 'Đóng',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    view: 'Xem',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước',
    submit: 'Gửi',
    reset: 'Đặt lại',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    export: 'Xuất',
    import: 'Nhập',
    print: 'In',
    share: 'Chia sẻ',
    copy: 'Sao chép',
    download: 'Tải xuống',
    upload: 'Tải lên',
    yes: 'Có',
    no: 'Không',
    ok: 'OK',
    today: 'Hôm nay',
    tomorrow: 'Ngày mai',
    yesterday: 'Hôm qua',
    thisWeek: 'Tuần này',
    thisMonth: 'Tháng này',
    thisYear: 'Năm này',
  },

  // Environment badge
  env: {
    beta: 'Beta',
    staging: 'Thử nghiệm',
    development: 'Phát triển',
  },

  // Theme
  theme: {
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
    toggle: 'Chuyển đổi chế độ',
  },

  // Language
  language: {
    vietnamese: 'Tiếng Việt',
    english: 'English',
    switch: 'Chuyển ngôn ngữ',
  },
};

export const englishDictionary: Dictionary = {
  // Navigation
  nav: {
    home: 'Home',
    doctors: 'Doctors',
    departments: 'Departments',
    appointments: 'Appointments',
    pricing: 'Pricing',
    news: 'News',
    about: 'About',
    contact: 'Contact',
    login: 'Sign In',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    profile: 'Profile',
    logout: 'Sign Out',
  },

  // Hero Section
  hero: {
    headline: 'Smart Medical Appointments — Fast, Accurate, Secure',
    subheadline: 'Modern hospital management system with professional medical staff and advanced technology',
    ctaPrimary: 'Book Now',
    ctaSecondary: 'View Doctors',
    stats: {
      patients: 'Patients Served',
      doctors: 'Medical Professionals',
      rating: 'Average Rating',
    },
  },

  // Booking Widget
  booking: {
    title: 'Quick Appointment Booking',
    department: 'Select Department',
    doctor: 'Select Doctor',
    date: 'Select Date',
    time: 'Select Time',
    type: 'Appointment Type',
    inPerson: 'In-Person',
    telehealth: 'Telehealth',
    submit: 'Book Appointment',
    price: 'Consultation Fee',
    available: 'Available',
    unavailable: 'Unavailable',
    selectDepartment: 'Please select a department',
    selectDoctor: 'Please select a doctor',
    loginRequired: 'Please sign in to book an appointment',
  },

  // Doctors Section
  doctors: {
    title: 'Featured Doctors',
    subtitle: 'Experienced medical professionals with high expertise',
    experience: 'years experience',
    rating: 'Rating',
    slotsAvailable: 'slots available today',
    viewProfile: 'View Profile',
    bookAppointment: 'Book Appointment',
    specialties: 'Specialties',
    filterAll: 'All',
  },

  // Departments Section
  departments: {
    title: 'Medical Departments',
    subtitle: 'Comprehensive healthcare services with modern equipment',
    viewServices: 'View Services',
    services: 'Services',
  },

  // System Highlights
  highlights: {
    title: 'System Advantages',
    security: {
      title: 'Security & RLS',
      description: 'Data protection with Supabase Row Level Security',
    },
    realtime: {
      title: 'Real-time Booking',
      description: 'Instant availability updates',
    },
    telehealth: {
      title: 'Telehealth & Reminders',
      description: 'Online consultations and automatic notifications',
    },
    records: {
      title: 'Digital Health Records',
      description: 'Secure electronic medical record management',
    },
  },

  // News Section
  news: {
    title: 'News & Announcements',
    subtitle: 'Latest medical information and hospital activities',
    readMore: 'Read More',
    viewAll: 'View All',
    recent: 'Latest News',
  },

  // Pricing Section
  pricing: {
    title: 'Service Packages',
    subtitle: 'Choose the package that fits your needs',
    basic: 'Basic',
    plus: 'Plus',
    enterprise: 'Enterprise',
    viewDetails: 'View Details',
    popular: 'Popular',
  },

  // Testimonials
  testimonials: {
    title: 'Patient Reviews',
    subtitle: 'Real experiences from our service users',
  },

  // CTA Section
  cta: {
    title: 'Ready to Book Your Appointment?',
    subtitle: 'Start your healthcare journey today',
    register: 'Register Now',
    book: 'Book Now',
  },

  // Footer
  footer: {
    aboutUs: 'About Us',
    services: 'Services',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    rights: 'All rights reserved by Hospital Management',
    hotline: 'Hotline',
    address: 'Address',
    email: 'Email',
  },

  // Role-based shortcuts
  roleShortcuts: {
    patient: {
      myAppointments: 'My Appointments',
      medicalRecords: 'Medical Records',
      reminders: 'Reminders',
      healthTracking: 'Health Tracking',
    },
    doctor: {
      todaySchedule: 'Today\'s Schedule',
      pendingConsultations: 'Pending Consultations',
      patientRecords: 'Patient Records',
      myProfile: 'My Profile',
    },
    admin: {
      systemAdmin: 'System Administration',
      quickStats: 'Quick Stats',
      todayAppointments: 'Today\'s Appointments',
      occupancyRate: 'Occupancy Rate',
      queueManagement: 'Queue Management',
    },
  },

  // Command Palette
  search: {
    placeholder: 'Search doctors, departments, services...',
    noResults: 'No results found',
    doctors: 'Doctors',
    departments: 'Departments',
    pages: 'Pages',
    services: 'Services',
    shortcut: 'Press Ctrl+K to search',
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    export: 'Export',
    import: 'Import',
    print: 'Print',
    share: 'Share',
    copy: 'Copy',
    download: 'Download',
    upload: 'Upload',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
  },

  // Environment badge
  env: {
    beta: 'Beta',
    staging: 'Staging',
    development: 'Development',
  },

  // Theme
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    toggle: 'Toggle theme',
  },

  // Language
  language: {
    vietnamese: 'Tiếng Việt',
    english: 'English',
    switch: 'Switch language',
  },
};
