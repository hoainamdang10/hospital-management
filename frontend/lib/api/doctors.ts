import { apiClient } from './client';
import { Doctor, DoctorForm, ApiResponse, FilterOptions } from '../types';

// Doctors API endpoints
export const doctorsApi = {
  // Get all doctors
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>('/doctors', filters);
  },

  // Get doctor by ID
  getById: async (id: string): Promise<ApiResponse<Doctor>> => {
    return apiClient.get<Doctor>(`/doctors/${id}`);
  },

  // Create new doctor
  create: async (doctorData: DoctorForm): Promise<ApiResponse<Doctor>> => {
    return apiClient.post<Doctor>('/doctors', doctorData);
  },

  // Update doctor
  update: async (id: string, doctorData: Partial<DoctorForm>): Promise<ApiResponse<Doctor>> => {
    return apiClient.put<Doctor>(`/doctors/${id}`, doctorData);
  },

  // Delete doctor
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/doctors/${id}`);
  },

  // Update doctor status
  updateStatus: async (id: string, status: 'active' | 'inactive' | 'on_leave'): Promise<ApiResponse<Doctor>> => {
    return apiClient.patch<Doctor>(`/doctors/${id}/status`, { status });
  },

  // Get doctors by department
  getByDepartment: async (departmentId: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>(`/doctors/department/${departmentId}`);
  },

  // Get doctor's schedule
  getSchedule: async (id: string, date?: string): Promise<ApiResponse<any[]>> => {
    const params = date ? { date } : undefined;
    return apiClient.get<any[]>(`/doctors/${id}/schedule`, params);
  },

  // Update doctor's schedule
  updateSchedule: async (id: string, schedule: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/schedule`, schedule);
  },

  // Get doctor's appointments
  getAppointments: async (id: string, filters?: FilterOptions): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/appointments`, filters);
  },

  // Get doctor statistics
  getStats: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/stats`);
  },

  // Enhanced appointment statistics with trends
  getAppointmentStats: async (
    id: string,
    period: string = 'week',
    options?: {
      start_date?: string;
      include_trends?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const params = {
      period,
      ...options
    };
    return apiClient.get<any>(`/doctors/${id}/appointment-stats`, params);
  },

  // Get unified dashboard data
  getProfileDashboard: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/profile-dashboard`);
  },

  // Get today's schedule
  getTodaySchedule: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/schedule/today`);
  },

  // Enhanced doctor reviews with Vietnamese support
  getReviews: async (
    id: string,
    options?: {
      page?: number;
      limit?: number;
      sort?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
      rating_filter?: number;
      verified_only?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const params = {
      page: 1,
      limit: 10,
      ...options
    };
    return apiClient.get<any>(`/doctors/${id}/reviews`, params);
  },

  // Get work experiences - Use experiences endpoint from Doctor Service
  getExperiences: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/experiences/doctor/${id}`);
  },

  // Add work experience
  addExperience: async (id: string, experience: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/doctors/${id}/experiences`, experience);
  },

  // Update work experience
  updateExperience: async (id: string, experienceId: string, experience: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/experiences/${experienceId}`, experience);
  },

  // Delete work experience
  deleteExperience: async (id: string, experienceId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/doctors/${id}/experiences/${experienceId}`);
  },

  // =====================================================
  // ENHANCED DOCTOR PROFILE API
  // =====================================================

  // Get complete doctor profile with all data
  getProfile: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/profile`);
  },

  // Get doctor by profile ID
  getByProfileId: async (profileId: string): Promise<ApiResponse<Doctor>> => {
    return apiClient.get<Doctor>(`/doctors/by-profile/${profileId}`);
  },

  // =====================================================
  // SCHEDULE MANAGEMENT API
  // =====================================================

  // Enhanced weekly schedule with real-time availability
  getWeeklySchedule: async (id: string, date?: string): Promise<ApiResponse<any>> => {
    const params = date ? { date } : undefined;
    return apiClient.get<any>(`/doctors/${id}/schedule/weekly`, params);
  },

  // Update schedule
  updateSchedule: async (id: string, schedules: any[]): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/schedule`, { schedules });
  },

  // Get availability for specific date
  getAvailability: async (id: string, date: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/availability`, { date });
  },

  // Get available time slots
  getTimeSlots: async (id: string, date: string): Promise<ApiResponse<string[]>> => {
    return apiClient.get<string[]>(`/doctors/${id}/time-slots`, { date });
  },

  // =====================================================
  // REVIEW MANAGEMENT API
  // =====================================================

  // Get doctor reviews
  getReviews: async (id: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/reviews`, { page, limit });
  },

  // Get review statistics
  getReviewStats: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/reviews/stats`);
  },

  // =====================================================
  // SHIFT MANAGEMENT API
  // =====================================================

  // Get doctor shifts
  getShifts: async (id: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/shifts/doctor/${id}`, { page, limit });
  },

  // Get upcoming shifts
  getUpcomingShifts: async (id: string, days: number = 7): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/shifts/doctor/${id}/upcoming`, { days });
  },

  // Get shift statistics
  getShiftStats: async (id: string, startDate: string, endDate: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/shifts/doctor/${id}/statistics`, { startDate, endDate });
  },

  // Create new shift
  createShift: async (shiftData: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/shifts', shiftData);
  },

  // Update shift
  updateShift: async (shiftId: string, shiftData: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/shifts/${shiftId}`, shiftData);
  },

  // Confirm shift
  confirmShift: async (shiftId: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<any>(`/shifts/${shiftId}/confirm`);
  },

  // =====================================================
  // EXPERIENCE MANAGEMENT API
  // =====================================================

  // Get doctor experiences (use doctor service endpoint)
  // REMOVED: Duplicate function - using the one above

  // Get experience timeline
  getExperienceTimeline: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/experiences/doctor/${id}/timeline`);
  },

  // Get total experience calculation
  getTotalExperience: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/experiences/doctor/${id}/total`);
  },

  // Create new experience
  createExperience: async (experienceData: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/experiences', experienceData);
  },

  // Update experience
  updateExperience: async (experienceId: string, experienceData: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/experiences/${experienceId}`, experienceData);
  },

  // Delete experience
  deleteExperience: async (experienceId: string): Promise<ApiResponse<any>> => {
    return apiClient.delete<any>(`/experiences/${experienceId}`);
  },

  // Upload doctor avatar
  uploadAvatar: async (id: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    return apiClient.uploadFile<{ avatar_url: string }>(`/doctors/${id}/avatar`, file);
  },

  // Search doctors
  search: async (query: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>('/doctors/search', { q: query });
  },

  // Get available doctors for appointment
  getAvailable: async (date: string, time?: string): Promise<ApiResponse<Doctor[]>> => {
    const params = time ? { date, time } : { date };
    return apiClient.get<Doctor[]>('/doctors/available', params);
  },

  // =====================================================
  // ADDITIONAL PROFILE API METHODS
  // =====================================================

  // Get doctor schedule (general)
  getSchedule: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/schedule`);
  },

  // REMOVED: Duplicate functions - using the ones above

  // Get doctor statistics (general)
  getStats: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/stats`);
  },

  // Get complete dashboard data for current authenticated doctor
  getDashboardComplete: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<any>('/doctors/dashboard/complete');
  },

  // Get current doctor stats (authenticated)
  getCurrentDoctorStats: async (): Promise<ApiResponse<any>> => {
    return apiClient.get<any>('/doctors/dashboard/stats');
  },

  // =====================================================
  // NEW ENHANCED PROFILE API METHODS
  // =====================================================

  // Work Schedule Management
  getWorkSchedule: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/schedule`);
  },

  updateWorkSchedule: async (id: string, schedules: any[]): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/schedule`, { schedules });
  },

  // Work Experience Management
  getWorkExperiences: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/experience`);
  },

  addWorkExperience: async (id: string, experience: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/doctors/${id}/experience`, experience);
  },

  updateWorkExperience: async (id: string, experienceId: string, experience: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/experience/${experienceId}`, experience);
  },

  deleteWorkExperience: async (id: string, experienceId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/doctors/${id}/experience/${experienceId}`);
  },

  // Reviews Management
  getDoctorReviews: async (id: string, page: number = 1, limit: number = 10, ratingFilter?: number): Promise<ApiResponse<any>> => {
    const params: any = { page, limit };
    if (ratingFilter) params.rating_filter = ratingFilter;
    return apiClient.get<any>(`/doctors/${id}/reviews`, params);
  },

  getReviewsSummary: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/reviews/summary`);
  },

  markReviewHelpful: async (id: string, reviewId: string): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/doctors/${id}/reviews/${reviewId}/helpful`);
  },

  // Settings Management
  getDoctorSettings: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/settings`);
  },

  updateDoctorSettings: async (id: string, settings: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/settings`, settings);
  },

  // Emergency Contacts Management
  getEmergencyContacts: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/emergency-contacts`);
  },

  addEmergencyContact: async (id: string, contact: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>(`/doctors/${id}/emergency-contacts`, contact);
  },

  updateEmergencyContact: async (id: string, contactId: string, contact: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/emergency-contacts/${contactId}`, contact);
  },

  deleteEmergencyContact: async (id: string, contactId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/doctors/${id}/emergency-contacts/${contactId}`);
  },
};

// Doctor utilities
export const doctorUtils = {
  // Format doctor name
  formatName: (doctor: Doctor): string => {
    return `Dr. ${doctor.first_name} ${doctor.last_name}`;
  },

  // Get doctor full name
  getFullName: (doctor: Doctor): string => {
    return `${doctor.first_name} ${doctor.last_name}`;
  },

  // Get doctor status badge color
  getStatusColor: (status: Doctor['status']): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'on_leave':
        return 'yellow';
      default:
        return 'gray';
    }
  },

  // Get doctor status label
  getStatusLabel: (status: Doctor['status']): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on_leave':
        return 'On Leave';
      default:
        return 'Unknown';
    }
  },

  // Format consultation fee
  formatFee: (fee?: number): string => {
    if (!fee) return 'Not specified';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(fee);
  },

  // Calculate experience level
  getExperienceLevel: (years?: number): string => {
    if (!years) return 'Not specified';
    if (years < 2) return 'Junior';
    if (years < 5) return 'Mid-level';
    if (years < 10) return 'Senior';
    return 'Expert';
  },

  // Validate doctor form
  validateForm: (data: DoctorForm): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.specialization.trim()) {
      errors.specialization = 'Specialization is required';
    }

    if (!data.license_number.trim()) {
      errors.license_number = 'License number is required';
    }

    if (!data.department_id) {
      errors.department_id = 'Department is required';
    }

    if (data.phone && !/^[0-9+\-\s()]+$/.test(data.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (data.experience_years && (data.experience_years < 0 || data.experience_years > 50)) {
      errors.experience_years = 'Experience years must be between 0 and 50';
    }

    if (data.consultation_fee && data.consultation_fee < 0) {
      errors.consultation_fee = 'Consultation fee cannot be negative';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Filter doctors by criteria
  filterDoctors: (doctors: Doctor[], filters: {
    search?: string;
    department?: string;
    status?: string;
    specialization?: string;
  }): Doctor[] => {
    return doctors.filter(doctor => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchLower);
        const matchesEmail = doctor.email.toLowerCase().includes(searchLower);
        const matchesSpecialization = doctor.specialization.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesEmail && !matchesSpecialization) {
          return false;
        }
      }

      if (filters.department && doctor.department_id !== filters.department) {
        return false;
      }

      if (filters.status && doctor.status !== filters.status) {
        return false;
      }

      if (filters.specialization && doctor.specialization !== filters.specialization) {
        return false;
      }

      return true;
    });
  },

  // Sort doctors
  sortDoctors: (doctors: Doctor[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Doctor[] => {
    return [...doctors].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'specialization':
          aValue = a.specialization;
          bValue = b.specialization;
          break;
        case 'experience':
          aValue = a.experience_years || 0;
          bValue = b.experience_years || 0;
          break;
        case 'fee':
          aValue = a.consultation_fee || 0;
          bValue = b.consultation_fee || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },
};
