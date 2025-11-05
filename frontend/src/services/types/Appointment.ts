export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  symptoms: string;
  notes?: string;
  fee: number;
}

export interface AppointmentResponse {
  success: boolean;
  data: Appointment[];
  message?: string;
}
