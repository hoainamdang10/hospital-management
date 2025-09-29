import { useState, useEffect } from 'react'
import { doctorsApi } from '@/lib/api/doctors'
import { DoctorProfileData, AppointmentStats, ScheduleItem, Review, WorkExperience } from '@/lib/types'
import { toast } from 'react-hot-toast'

interface UseDoctorProfileReturn {
  doctor: DoctorProfileData | null
  appointmentStats: AppointmentStats | null
  todaySchedule: ScheduleItem[]
  reviews: Review[]
  experiences: WorkExperience[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDoctorProfile(doctorId: string): UseDoctorProfileReturn {
  const [doctor, setDoctor] = useState<DoctorProfileData | null>(null)
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null)
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDoctorData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load doctor profile
      const doctorResponse = await doctorsApi.getProfile(doctorId)
      if (!doctorResponse.success || !doctorResponse.data) {
        throw new Error('Failed to load doctor profile')
      }

      const doctorData = doctorResponse.data
      if (!doctorData) {
        throw new Error('No doctor data received from API')
      }

      setDoctor(doctorData)

      // Extract the actual doctor_id from the response
      const actualDoctorId = doctorData.doctor_id || doctorId
      console.log('🔍 [useDoctorProfile] Using doctor ID for API calls:', actualDoctorId)

      // Load other data in parallel using the correct doctor_id
      // Use API Gateway endpoints (Backend Microservices)
      const [statsResponse, scheduleResponse, reviewsResponse, experiencesResponse] = await Promise.allSettled([
        doctorsApi.getAppointmentStats(actualDoctorId, 'week'),
        doctorsApi.getTodaySchedule(actualDoctorId),
        doctorsApi.getReviews(actualDoctorId, 1, 4),
        doctorsApi.getExperiences(actualDoctorId)
      ])

      // Handle appointment statistics
      if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
        setAppointmentStats(statsResponse.value.data)
      }

      // Handle today's schedule
      if (scheduleResponse.status === 'fulfilled' && scheduleResponse.value.success) {
        setTodaySchedule(scheduleResponse.value.data || [])
      }

      // Handle reviews
      if (reviewsResponse.status === 'fulfilled' && reviewsResponse.value.success) {
        setReviews(reviewsResponse.value.data || [])
      }

      // Handle work experiences
      if (experiencesResponse.status === 'fulfilled' && experiencesResponse.value.success) {
        setExperiences(experiencesResponse.value.data || [])
      } else if (doctorData.experiences) {
        // Fallback to experiences from doctor profile response
        setExperiences(doctorData.experiences || [])
      }

    } catch (error: any) {
      console.error('Error loading doctor data:', error)
      setError(error.message || 'Failed to load doctor data')

      // Show error toast instead of loading mock data
      toast.error('Không thể tải dữ liệu bác sĩ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (doctorId) {
      loadDoctorData()
    }
  }, [doctorId])

  return {
    doctor,
    appointmentStats,
    todaySchedule,
    reviews,
    experiences,
    loading,
    error,
    refetch: loadDoctorData
  }
}
