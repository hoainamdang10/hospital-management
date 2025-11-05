export interface MedicalService {
  id: string;
  title: string;
  description: string;
  category: "cardiology" | "internal" | "pediatrics" | "surgery";
  features: string[];
  icon: string;
  colors: {
    bg: string;
    border: string;
    hover: string;
    gradient: string;
    icon: string;
  };
  price?: {
    consultation: number;
    followUp: number;
  };
  availability: {
    weekdays: string[];
    hours: string;
  };
  doctors: string[];
}

export interface ServiceResponse {
  success: boolean;
  data: MedicalService[];
  message?: string;
}
