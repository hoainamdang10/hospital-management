import { useState, useEffect } from 'react';
import { doctorsApi } from '@/lib/api/doctors';
import { toast } from 'react-hot-toast';

interface DoctorBasicInfo {
  doctor_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  specialty: string;
  qualification: string;
  license_number: string;
  department_id: string;
  department_name?: string;
  bio?: string;
  experience_years: number;
  consultation_fee?: number;
  languages_spoken: string[];
  availability_status: string;
  rating: number;
  total_reviews: number;
  avatar_url?: string;
}

interface AppointmentStats {
  total_appointments: number;
  completed_appointments: number;
  scheduled_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  total_patients: number;
  new_patients: number;
  returning_patients: number;
  success_rate: number;
  average_rating: number;
  weekly_data: Array<{
    date: string;
    day_name: string;
    total: number;
    completed: number;
    new_patients: number;
    follow_up: number;
    cancelled: number;
    revenue: number;
  }>;
  monthly_stats: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
  };
  appointment_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

interface WeeklySchedule {
  week_start: string;
  week_end: string;
  doctor_id: string;
  doctor_name?: string;
  daily_schedules: Array<{
    date: string;
    day_of_week: number;
    day_name: string;
    is_working_day: boolean;
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    total_slots: number;
    booked_slots: number;
    available_slots: number;
    time_slots: Array<{
      start_time: string;
      end_time: string;
      status: 'available' | 'booked' | 'break' | 'unavailable';
      appointment_id?: string;
      patient_name?: string;
      appointment_type?: string;
    }>;
  }>;
  summary: {
    total_working_days: number;
    total_slots: number;
    total_booked: number;
    total_available: number;
    occupancy_rate: number;
  };
}

interface ReviewsData {
  reviews: Array<{
    review_id: string;
    patient_name: string;
    patient_initial: string;
    rating: number;
    review_text: string;
    review_date: string;
    is_verified: boolean;
    helpful_count: number;
    appointment_date?: string;
    appointment_type?: string;
  }>;
  summary: {
    total_reviews: number;
    average_rating: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    recent_trends: Array<{
      month: string;
      month_name: string;
      average_rating: number;
      review_count: number;
    }>;
    verified_reviews_count: number;
    response_rate: number;
  };
}

interface PerformanceMetrics {
  success_rate: number;
  average_consultation_time: number;
  patient_satisfaction: number;
  on_time_percentage: number;
  total_revenue_30d: number;
  growth_rate: number;
}

interface QuickMetrics {
  appointments_today: number;
  patients_waiting: number;
  next_appointment: {
    time: string;
    patient_name: string;
  } | null;
  urgent_notifications: number;
}

interface DashboardData {
  doctor: DoctorBasicInfo;
  stats: AppointmentStats;
  current_week_schedule: WeeklySchedule;
  recent_reviews: ReviewsData;
  performance_metrics: PerformanceMetrics;
  quick_metrics: QuickMetrics;
  last_updated: string;
  data_sources: {
    appointments: string;
    reviews: string;
    schedule: string;
    performance: string;
  };
}

interface UseDoctorDashboardReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadTime: number;
}

export function useDoctorDashboard(doctorId: string): UseDoctorDashboardReturn {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState(0);

  const fetchDashboardData = async () => {
    if (!doctorId) {
      setError('Doctor ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const startTime = Date.now();

      console.log('🏥 [useDoctorDashboard] Fetching dashboard data for:', doctorId);

      const response = await doctorsApi.getProfileDashboard(doctorId);

      if (response.success && response.data) {
        setDashboardData(response.data);
        const endTime = Date.now();
        setLoadTime(endTime - startTime);

        console.log('✅ [useDoctorDashboard] Dashboard data loaded successfully', {
          doctorId,
          loadTime: endTime - startTime,
          dataQuality: response.data.data_sources
        });
      } else {
        const errorMessage = response.error?.message || 'Không thể tải dữ liệu dashboard';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('💥 [useDoctorDashboard] Error:', err);
      const errorMessage = 'Lỗi khi tải dữ liệu dashboard';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchDashboardData();
    }
  }, [doctorId]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData,
    loadTime
  };
}

// Helper hooks for individual components
export function useDoctorStats(doctorId: string, period: string = 'week') {
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!doctorId) return;

      try {
        setLoading(true);
        const response = await doctorsApi.getAppointmentStats(doctorId, period, {
          include_trends: true
        });

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.error?.message || 'Không thể tải thống kê');
        }
      } catch (err) {
        setError('Lỗi khi tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [doctorId, period]);

  return { stats, loading, error };
}

export function useDoctorWeeklySchedule(doctorId: string, date?: string) {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!doctorId) return;

      try {
        setLoading(true);
        const response = await doctorsApi.getWeeklySchedule(doctorId, date);

        if (response.success && response.data) {
          setSchedule(response.data);
        } else {
          setError(response.error?.message || 'Không thể tải lịch tuần');
        }
      } catch (err) {
        setError('Lỗi khi tải lịch tuần');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [doctorId, date]);

  return { schedule, loading, error };
}

export function useDoctorReviews(doctorId: string, options?: {
  page?: number;
  limit?: number;
  sort?: string;
  rating_filter?: number;
}) {
  const [reviews, setReviews] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!doctorId) return;

      try {
        setLoading(true);
        const response = await doctorsApi.getReviews(doctorId, options);

        if (response.success && response.data) {
          setReviews(response.data);
        } else {
          setError(response.error?.message || 'Không thể tải đánh giá');
        }
      } catch (err) {
        setError('Lỗi khi tải đánh giá');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [doctorId, JSON.stringify(options)]);

  return { reviews, loading, error };
}
