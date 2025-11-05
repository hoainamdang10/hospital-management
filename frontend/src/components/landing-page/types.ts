export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  avatar: string;
  schedules: string[];
  description: string;
}

export interface AppointmentForm {
  doctorId: string;
  patientName: string;
  phone: string;
  email: string;
  appointmentDate: string;
  appointmentTime: string;
  symptoms: string;
}

export interface Service {
  title: string;
  icon: any;
  description: string;
  features: string[];
  colors: {
    border: string;
    bg: string;
    icon: string;
    hover: string;
    gradient: string;
  };
}
