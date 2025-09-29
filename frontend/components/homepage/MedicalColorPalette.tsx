'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Baby, Bone, Pill, Zap, Activity, Stethoscope } from 'lucide-react';

interface ColorInfo {
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  bgClass: string;
  usage: string;
  usageVi: string;
}

const medicalColors: ColorInfo[] = [
  {
    name: 'Cardiology',
    nameVi: 'Tim mạch',
    description: 'Heart and cardiovascular care',
    descriptionVi: 'Chăm sóc tim mạch và hệ tuần hoàn',
    icon: Heart,
    colorClass: 'text-medical-cardiology',
    bgClass: 'bg-medical-cardiology/10',
    usage: 'Heart conditions, blood pressure, cardiac surgery',
    usageVi: 'Bệnh tim, huyết áp, phẫu thuật tim'
  },
  {
    name: 'Neurology',
    nameVi: 'Thần kinh',
    description: 'Brain and nervous system',
    descriptionVi: 'Não bộ và hệ thần kinh',
    icon: Brain,
    colorClass: 'text-medical-neurology',
    bgClass: 'bg-medical-neurology/10',
    usage: 'Brain disorders, neurological conditions',
    usageVi: 'Rối loạn não bộ, bệnh thần kinh'
  },
  {
    name: 'Pediatrics',
    nameVi: 'Nhi khoa',
    description: 'Children and infant care',
    descriptionVi: 'Chăm sóc trẻ em và trẻ sơ sinh',
    icon: Baby,
    colorClass: 'text-medical-pediatrics',
    bgClass: 'bg-medical-pediatrics/10',
    usage: 'Child health, vaccinations, growth monitoring',
    usageVi: 'Sức khỏe trẻ em, tiêm chủng, theo dõi phát triển'
  },
  {
    name: 'Orthopedics',
    nameVi: 'Chỉnh hình',
    description: 'Bone and joint care',
    descriptionVi: 'Chăm sóc xương khớp',
    icon: Bone,
    colorClass: 'text-medical-orthopedics',
    bgClass: 'bg-medical-orthopedics/10',
    usage: 'Fractures, joint replacement, sports injuries',
    usageVi: 'Gãy xương, thay khớp, chấn thương thể thao'
  },
  {
    name: 'Pharmacy',
    nameVi: 'Dược phẩm',
    description: 'Medication and prescriptions',
    descriptionVi: 'Thuốc men và đơn thuốc',
    icon: Pill,
    colorClass: 'text-medical-pharmacy',
    bgClass: 'bg-medical-pharmacy/10',
    usage: 'Drug dispensing, medication counseling',
    usageVi: 'Phát thuốc, tư vấn dùng thuốc'
  },
  {
    name: 'Emergency',
    nameVi: 'Cấp cứu',
    description: 'Emergency and critical care',
    descriptionVi: 'Cấp cứu và chăm sóc đặc biệt',
    icon: Zap,
    colorClass: 'text-medical-emergency',
    bgClass: 'bg-medical-emergency/10',
    usage: 'Trauma, urgent care, life-threatening conditions',
    usageVi: 'Chấn thương, cấp cứu, tình trạng nguy hiểm'
  },
  {
    name: 'Radiology',
    nameVi: 'Chẩn đoán hình ảnh',
    description: 'Medical imaging and diagnostics',
    descriptionVi: 'Chẩn đoán hình ảnh y tế',
    icon: Activity,
    colorClass: 'text-medical-radiology',
    bgClass: 'bg-medical-radiology/10',
    usage: 'X-rays, CT scans, MRI, ultrasound',
    usageVi: 'X-quang, CT, MRI, siêu âm'
  },
  {
    name: 'General Medicine',
    nameVi: 'Nội tổng quát',
    description: 'Primary healthcare and wellness',
    descriptionVi: 'Chăm sóc sức khỏe ban đầu',
    icon: Stethoscope,
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    usage: 'Routine checkups, preventive care',
    usageVi: 'Khám định kỳ, chăm sóc phòng ngừa'
  }
];

interface MedicalColorPaletteProps {
  language?: 'en' | 'vi';
  showUsage?: boolean;
}

export function MedicalColorPalette({ 
  language = 'vi', 
  showUsage = false 
}: MedicalColorPaletteProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-foreground">
          {language === 'vi' ? 'Bảng Màu Y Tế' : 'Medical Color Palette'}
        </h3>
        <p className="text-muted-foreground">
          {language === 'vi' 
            ? 'Hệ thống màu sắc chuyên nghiệp cho các chuyên khoa y tế'
            : 'Professional color system for medical specialties'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {medicalColors.map((color, index) => {
          const Icon = color.icon;
          return (
            <Card key={index} className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-opacity-50 ${color.bgClass}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color.bgClass} ${color.colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className={`text-sm font-semibold ${color.colorClass}`}>
                      {language === 'vi' ? color.nameVi : color.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground">
                  {language === 'vi' ? color.descriptionVi : color.description}
                </p>
                
                {showUsage && (
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {language === 'vi' ? 'Ứng dụng' : 'Usage'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {language === 'vi' ? color.usageVi : color.usage}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <div className={`w-4 h-4 rounded-full ${color.colorClass.replace('text-', 'bg-')}`} />
                  <div className={`w-4 h-4 rounded-full ${color.bgClass}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-lg bg-muted/50">
        <h4 className="font-semibold text-sm mb-2">
          {language === 'vi' ? 'Hướng dẫn sử dụng:' : 'Usage Guidelines:'}
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• {language === 'vi' ? 'Màu đậm: Tiêu đề và icons chính' : 'Solid colors: Headers and primary icons'}</li>
          <li>• {language === 'vi' ? 'Màu nhạt: Background và highlight' : 'Light colors: Backgrounds and highlights'}</li>
          <li>• {language === 'vi' ? 'Tuân thủ WCAG 2.1 AA cho accessibility' : 'WCAG 2.1 AA compliant for accessibility'}</li>
          <li>• {language === 'vi' ? 'Tương thích với dark/light mode' : 'Compatible with dark/light mode'}</li>
        </ul>
      </div>
    </div>
  );
}
