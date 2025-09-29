'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowRight, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Department } from '@/lib/mock';
import Link from 'next/link';

interface DepartmentCardProps {
  department: Department;
}

export function DepartmentCard({ department }: DepartmentCardProps) {
  const { t, language } = useI18n();

  // Medical color mapping for departments
  const getMedicalColors = (departmentId: string) => {
    const colorMap: Record<string, { text: string; bg: string; border: string }> = {
      'cardiology': {
        text: 'text-medical-cardiology',
        bg: 'bg-medical-cardiology/10 hover:bg-medical-cardiology/20',
        border: 'border-medical-cardiology/20 hover:border-medical-cardiology/30'
      },
      'neurology': {
        text: 'text-medical-neurology',
        bg: 'bg-medical-neurology/10 hover:bg-medical-neurology/20',
        border: 'border-medical-neurology/20 hover:border-medical-neurology/30'
      },
      'pediatrics': {
        text: 'text-medical-pediatrics',
        bg: 'bg-medical-pediatrics/10 hover:bg-medical-pediatrics/20',
        border: 'border-medical-pediatrics/20 hover:border-medical-pediatrics/30'
      },
      'orthopedics': {
        text: 'text-medical-orthopedics',
        bg: 'bg-medical-orthopedics/10 hover:bg-medical-orthopedics/20',
        border: 'border-medical-orthopedics/20 hover:border-medical-orthopedics/30'
      },
      'dermatology': {
        text: 'text-medical-dermatology',
        bg: 'bg-medical-dermatology/10 hover:bg-medical-dermatology/20',
        border: 'border-medical-dermatology/20 hover:border-medical-dermatology/30'
      },
      'ent': {
        text: 'text-medical-pharmacy',
        bg: 'bg-medical-pharmacy/10 hover:bg-medical-pharmacy/20',
        border: 'border-medical-pharmacy/20 hover:border-medical-pharmacy/30'
      },
      'endocrinology': {
        text: 'text-medical-radiology',
        bg: 'bg-medical-radiology/10 hover:bg-medical-radiology/20',
        border: 'border-medical-radiology/20 hover:border-medical-radiology/30'
      },
      'emergency': {
        text: 'text-medical-emergency',
        bg: 'bg-medical-emergency/10 hover:bg-medical-emergency/20',
        border: 'border-medical-emergency/20 hover:border-medical-emergency/30'
      }
    };

    return colorMap[departmentId] || {
      text: 'text-primary',
      bg: 'bg-primary/10 hover:bg-primary/20',
      border: 'border-primary/20 hover:border-primary/30'
    };
  };

  const medicalColors = getMedicalColors(department.id);

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full border-2 ${medicalColors.border} ${medicalColors.bg}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl p-2 rounded-lg ${medicalColors.bg} ${medicalColors.text}`}>
              {department.icon}
            </div>
            <div>
              <CardTitle className={`text-lg leading-tight ${medicalColors.text}`}>
                {language === 'vi' ? department.nameVi : department.name}
              </CardTitle>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  {language === 'vi' ? department.briefVi : department.brief}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {language === 'vi' ? department.briefVi : department.brief}
        </p>

        {/* Services */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            {t('departments.services')}
            <Badge variant="secondary" className="text-xs">
              {(language === 'vi' ? department.servicesVi : department.services).length}
            </Badge>
          </h4>
          
          <div className="space-y-2">
            {(language === 'vi' ? department.servicesVi : department.services)
              .slice(0, 3)
              .map((service, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">{service}</span>
                </div>
              ))}
            
            {(language === 'vi' ? department.servicesVi : department.services).length > 3 && (
              <div className="text-xs text-muted-foreground pl-3.5">
                +{(language === 'vi' ? department.servicesVi : department.services).length - 3} {language === 'vi' ? 'dịch vụ khác' : 'more services'}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          asChild
        >
          <Link href={`/departments/${department.id}`}>
            {t('departments.viewServices')}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>ID: {department.id}</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>{language === 'vi' ? 'Hoạt động' : 'Active'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
