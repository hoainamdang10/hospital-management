import { Doctor, Service } from "./types";
import { Heart, Stethoscope, Users, Activity } from "lucide-react";

export const mockDoctors: Doctor[] = [
  {
    id: "1",
    name: "BS. Nguyễn Văn An",
    specialty: "Tim mạch",
    experience: "15 năm",
    rating: 4.9,
    avatar:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    schedules: ["Thứ 2-6: 8:00-17:00", "Thứ 7: 8:00-12:00"],
    description: "Chuyên gia tim mạch hàng đầu với 15 năm kinh nghiệm",
  },
  {
    id: "2",
    name: "BS. Trần Thị Bình",
    specialty: "Nội khoa",
    experience: "12 năm",
    rating: 4.8,
    avatar:
      "https://images.unsplash.com/photo-1594824475548-2c1085aed7aa?w=150&h=150&fit=crop&crop=face",
    schedules: ["Thứ 2-6: 7:30-16:30", "Chủ nhật: 8:00-12:00"],
    description: "Bác sĩ nội khoa giàu kinh nghiệm, tận tâm với bệnh nhân",
  },
  {
    id: "3",
    name: "BS. Lê Minh Châu",
    specialty: "Nhi khoa",
    experience: "10 năm",
    rating: 4.9,
    avatar:
      "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=150&h=150&fit=crop&crop=face",
    schedules: ["Thứ 2-6: 8:00-17:00", "Thứ 7: 8:00-12:00"],
    description: "Chuyên gia nhi khoa được các bậc phụ huynh tin tưởng",
  },
  {
    id: "4",
    name: "BS. Phạm Văn Dũng",
    specialty: "Ngoại khoa",
    experience: "18 năm",
    rating: 4.7,
    avatar:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    schedules: ["Thứ 2-6: 7:00-16:00", "Thứ 7: 8:00-12:00"],
    description: "Bác sĩ phẫu thuật hàng đầu với nhiều ca mổ thành công",
  },
];

export const timeSlots = [
  "8:00",
  "8:30",
  "9:00",
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

export const services: Service[] = [
  {
    title: "Tim mạch",
    icon: Heart,
    description:
      "Chẩn đoán và điều trị các bệnh về tim mạch với công nghệ hiện đại",
    features: ["ECG", "Siêu âm tim", "Can thiệp mạch vành"],
    colors: {
      border: "border-red-200",
      bg: "bg-red-100",
      icon: "text-red-600",
      hover: "hover:border-red-300",
      gradient: "from-red-500 to-pink-500",
    },
  },
  {
    title: "Nội khoa",
    icon: Stethoscope,
    description: "Khám và điều trị chuyên sâu các bệnh nội khoa tổng quát",
    features: ["Tiểu đường", "Huyết áp", "Gan mật"],
    colors: {
      border: "border-blue-200",
      bg: "bg-blue-100",
      icon: "text-blue-600",
      hover: "hover:border-blue-300",
      gradient: "from-blue-500 to-cyan-500",
    },
  },
  {
    title: "Nhi khoa",
    icon: Users,
    description: "Chăm sóc sức khỏe toàn diện và tận tâm cho trẻ em",
    features: ["Tiêm chủng", "Khám định kỳ", "Dinh dưỡng"],
    colors: {
      border: "border-green-200",
      bg: "bg-green-100",
      icon: "text-green-600",
      hover: "hover:border-green-300",
      gradient: "from-green-500 to-emerald-500",
    },
  },
  {
    title: "Ngoại khoa",
    icon: Activity,
    description: "Phẫu thuật và điều trị ngoại khoa với kỹ thuật tiên tiến",
    features: ["Phẫu thuật", "Nội soi", "Cấp cứu"],
    colors: {
      border: "border-purple-200",
      bg: "bg-purple-100",
      icon: "text-purple-600",
      hover: "hover:border-purple-300",
      gradient: "from-purple-500 to-indigo-500",
    },
  },
];
