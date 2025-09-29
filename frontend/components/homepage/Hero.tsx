'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Award, Calendar } from 'lucide-react';
import { useI18n, formatCurrency } from '@/lib/i18n';
import { mockStats } from '@/lib/mock';
import Link from 'next/link';

interface HeroProps {
  onBookingOpen: () => void;
}

export function Hero({ onBookingOpen }: HeroProps) {
  const { t, language } = useI18n();

  const stats = [
    {
      icon: Users,
      value: mockStats.patientsServed.toLocaleString(),
      label: t('hero.stats.patients'),
      color: 'text-medical-cardiology',
      bgColor: 'bg-medical-cardiology/10',
    },
    {
      icon: Award,
      value: mockStats.doctors.toString(),
      label: t('hero.stats.doctors'),
      color: 'text-medical-pediatrics',
      bgColor: 'bg-medical-pediatrics/10',
    },
    {
      icon: Star,
      value: mockStats.avgRating.toString(),
      label: t('hero.stats.rating'),
      color: 'text-medical-pharmacy',
      bgColor: 'bg-medical-pharmacy/10',
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-white to-medical-cardiology/5 dark:from-primary/10 dark:via-background dark:to-medical-cardiology/10 py-12 lg:py-20 overflow-hidden">
      {/* Medical Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Medical Cross Symbols */}
        <div className="absolute top-[10%] left-[5%] w-16 h-16 rounded-full bg-medical-cardiology/20 dark:bg-medical-cardiology/30"></div>
        <div className="absolute top-[30%] left-[15%] w-8 h-8 rounded-full bg-medical-pediatrics/30 dark:bg-medical-pediatrics/40"></div>
        <div className="absolute top-[60%] left-[10%] w-12 h-12 rounded-full bg-medical-pharmacy/20 dark:bg-medical-pharmacy/30"></div>
        <div className="absolute top-[20%] right-[40%] text-medical-cardiology/20 dark:text-medical-cardiology/30 text-5xl font-light">+</div>
        <div className="absolute top-[70%] right-[20%] text-medical-pediatrics/20 dark:text-medical-pediatrics/30 text-4xl font-light">⚕</div>
        <div className="absolute top-[40%] right-[10%] text-medical-pharmacy/20 dark:text-medical-pharmacy/30 text-3xl font-light">♥</div>
        <div className="absolute top-[50%] right-[30%] text-blue-200/30 dark:text-blue-800/30 text-5xl font-light">+</div>
        <div className="absolute bottom-[20%] right-[10%] w-20 h-20 rounded-full bg-blue-100/40 dark:bg-blue-900/40"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                {t('hero.headline')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('hero.subheadline')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={onBookingOpen}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t('hero.ctaPrimary')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                asChild
              >
                <Link href="/doctors">
                  {t('hero.ctaSecondary')}
                </Link>
              </Button>
            </div>

            {/* Medical Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} shadow-sm ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                      {index === 2 && <Star className="inline h-4 w-4 text-medical-pharmacy ml-1" />}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Visual Element */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Medical illustration with gradient */}
            <div className="relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-medical-cardiology/20 to-medical-pediatrics/20 dark:from-medical-cardiology/30 dark:to-medical-pediatrics/30 flex items-center justify-center">
                <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/10 flex items-center justify-center shadow-2xl">
                  <div className="text-6xl lg:text-8xl">🏥</div>
                </div>
              </div>

              {/* Floating cards */}
              <Card className="absolute -top-4 -left-4 w-48 shadow-lg animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {language === 'vi' ? 'Hôm nay' : 'Today'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mockStats.appointmentsToday} {language === 'vi' ? 'lịch khám' : 'appointments'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute -bottom-4 -right-4 w-44 shadow-lg animate-pulse delay-300">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {mockStats.occupancyRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {language === 'vi' ? 'Tỷ lệ lấp đầy' : 'Occupancy'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Badge 
                variant="secondary" 
                className="absolute top-1/2 -right-8 transform -translate-y-1/2 rotate-12 shadow-lg"
              >
                {language === 'vi' ? '24/7 Cấp cứu' : '24/7 Emergency'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
}
