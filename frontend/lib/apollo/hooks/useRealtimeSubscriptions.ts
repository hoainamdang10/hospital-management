import { useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client';
import { toast } from 'sonner';
import { 
  APPOINTMENT_UPDATED,
  DOCTOR_APPOINTMENT_UPDATED,
  NEW_APPOINTMENT_CREATED,
  WAITING_QUEUE_UPDATED
} from '../subscriptions/appointment';
import {
  DOCTOR_STATUS_CHANGED,
  DOCTOR_SCHEDULE_CHANGED,
  DOCTOR_AVAILABILITY_CHANGED,
  DOCTOR_NOTIFICATION
} from '../subscriptions/doctor';
import {
  PATIENT_STATUS_CHANGED,
  PATIENT_UPDATED
} from '../subscriptions/patient';

interface UseRealtimeSubscriptionsOptions {
  doctorId?: string;
  patientId?: string;
  onAppointmentUpdate?: (appointment: any) => void;
  onDoctorStatusChange?: (doctor: any) => void;
  onPatientStatusChange?: (patient: any) => void;
  onNotification?: (notification: any) => void;
  enableToasts?: boolean;
}

export function useRealtimeSubscriptions({
  doctorId,
  patientId,
  onAppointmentUpdate,
  onDoctorStatusChange,
  onPatientStatusChange,
  onNotification,
  enableToasts = true
}: UseRealtimeSubscriptionsOptions) {
  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Doctor appointment updates
  const { data: appointmentData } = useSubscription(DOCTOR_APPOINTMENT_UPDATED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.doctorAppointmentUpdated) {
        const appointment = data.data.doctorAppointmentUpdated;
        onAppointmentUpdate?.(appointment);
        
        if (enableToasts) {
          toast.info(`Cuộc hẹn ${appointment.appointmentId} đã được cập nhật`, {
            description: `Bệnh nhân: ${appointment.patient?.fullName}`,
          });
        }
      }
    }
  });

  // New appointments created
  const { data: newAppointmentData } = useSubscription(NEW_APPOINTMENT_CREATED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.newAppointmentCreated) {
        const appointment = data.data.newAppointmentCreated;
        onAppointmentUpdate?.(appointment);
        
        if (enableToasts) {
          toast.success(`Cuộc hẹn mới được tạo`, {
            description: `Bệnh nhân: ${appointment.patient?.fullName} - ${appointment.scheduledDate} ${appointment.scheduledTime}`,
          });
        }
      }
    }
  });

  // Waiting queue updates
  const { data: queueData } = useSubscription(WAITING_QUEUE_UPDATED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.waitingQueueUpdated) {
        const queue = data.data.waitingQueueUpdated;
        
        if (enableToasts && queue.length > 0) {
          toast.info(`Hàng đợi đã được cập nhật`, {
            description: `${queue.length} bệnh nhân đang chờ`,
          });
        }
      }
    }
  });

  // Doctor status changes
  const { data: doctorStatusData } = useSubscription(DOCTOR_STATUS_CHANGED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.doctorStatusChanged) {
        const doctor = data.data.doctorStatusChanged;
        onDoctorStatusChange?.(doctor);
        
        if (enableToasts) {
          const statusText = doctor.isAvailable ? 'có sẵn' : 'không có sẵn';
          toast.info(`Trạng thái của bạn đã thay đổi`, {
            description: `Hiện tại: ${statusText}`,
          });
        }
      }
    }
  });

  // Doctor schedule changes
  const { data: scheduleData } = useSubscription(DOCTOR_SCHEDULE_CHANGED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.doctorScheduleChanged) {
        const schedule = data.data.doctorScheduleChanged;
        
        if (enableToasts) {
          toast.info(`Lịch làm việc đã được cập nhật`, {
            description: `Ngày ${schedule.date}: ${schedule.startTime} - ${schedule.endTime}`,
          });
        }
      }
    }
  });

  // Doctor availability changes
  const { data: availabilityData } = useSubscription(DOCTOR_AVAILABILITY_CHANGED, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.doctorAvailabilityChanged) {
        const availability = data.data.doctorAvailabilityChanged;
        onDoctorStatusChange?.(availability);
      }
    }
  });

  // Doctor notifications
  const { data: notificationData } = useSubscription(DOCTOR_NOTIFICATION, {
    variables: { doctorId },
    skip: !doctorId,
    onData: ({ data }) => {
      if (data?.data?.doctorNotification) {
        const notification = data.data.doctorNotification;
        onNotification?.(notification);
        
        if (enableToasts && !notification.isRead) {
          const toastFn = notification.priority === 'HIGH' ? toast.error : 
                         notification.priority === 'MEDIUM' ? toast.warning : toast.info;
          
          toastFn(notification.title, {
            description: notification.message,
          });
        }
      }
    }
  });

  // Patient status changes (for doctor dashboard)
  const { data: patientStatusData } = useSubscription(PATIENT_STATUS_CHANGED, {
    variables: { patientId },
    skip: !patientId,
    onData: ({ data }) => {
      if (data?.data?.patientStatusChanged) {
        const patient = data.data.patientStatusChanged;
        onPatientStatusChange?.(patient);
        
        if (enableToasts) {
          toast.info(`Thông tin bệnh nhân đã được cập nhật`, {
            description: `${patient.fullName}`,
          });
        }
      }
    }
  });

  // Patient updates
  const { data: patientUpdateData } = useSubscription(PATIENT_UPDATED, {
    variables: { patientId },
    skip: !patientId,
    onData: ({ data }) => {
      if (data?.data?.patientUpdated) {
        const patient = data.data.patientUpdated;
        onPatientStatusChange?.(patient);
      }
    }
  });

  // Cleanup function
  useEffect(() => {
    return () => {
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    // Subscription data
    appointmentData: appointmentData?.doctorAppointmentUpdated,
    newAppointmentData: newAppointmentData?.newAppointmentCreated,
    queueData: queueData?.waitingQueueUpdated,
    doctorStatusData: doctorStatusData?.doctorStatusChanged,
    scheduleData: scheduleData?.doctorScheduleChanged,
    availabilityData: availabilityData?.doctorAvailabilityChanged,
    notificationData: notificationData?.doctorNotification,
    patientStatusData: patientStatusData?.patientStatusChanged,
    patientUpdateData: patientUpdateData?.patientUpdated,
    
    // Helper methods
    isSubscribed: (subscriptionName: string) => subscriptionsRef.current.has(subscriptionName),
    getActiveSubscriptions: () => Array.from(subscriptionsRef.current)
  };
}
