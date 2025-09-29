'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Zap,
  Video,
  FileText,
  Star,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Heart,
  Clock,
  Sparkles,
} from 'lucide-react';

// Components
import { Header } from '@/components/homepage/Header';
import { Hero } from '@/components/homepage/Hero';
import { BookingWidget } from '@/components/homepage/BookingWidget';
import { DoctorCard } from '@/components/homepage/DoctorCard';
import { DepartmentCard } from '@/components/homepage/DepartmentCard';
import { NewsList } from '@/components/homepage/NewsList';
import { RoleShortcuts } from '@/components/homepage/RoleShortcuts';
import { Footer } from '@/components/homepage/Footer';
import { CommandPalette } from '@/components/homepage/CommandPalette';
import { AccessibilityFeatures } from '@/components/homepage/AccessibilityFeatures';

// Data and utilities
import { useI18n, I18nProvider } from '@/lib/i18n';
import { vietnameseDictionary, englishDictionary } from '@/lib/dicts';
import {
  mockDoctors,
  mockDepartments,
  mockTestimonials,
  Role,
  MockSession,
} from '@/lib/mock';
import { useAuth, AuthProvider, useSessionFromUrl } from '@/lib/auth/mock-session';
import Link from 'next/link';

function HomePage() {
  const { t, language } = useI18n();
  const { session } = useAuth();

  // Enable URL-based session detection for demo
  useSessionFromUrl();
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter doctors by department
  const filteredDoctors = selectedDepartmentFilter === 'all' 
    ? mockDoctors.slice(0, 6) // Show top 6 doctors
    : mockDoctors.filter(doctor => 
        doctor.department.toLowerCase().includes(selectedDepartmentFilter.toLowerCase()) ||
        doctor.departmentVi.toLowerCase().includes(selectedDepartmentFilter.toLowerCase())
      );

  const departmentFilters = [
    { id: 'all', name: t('doctors.filterAll'), nameVi: t('doctors.filterAll') },
    ...mockDepartments.slice(0, 6).map(dept => ({
      id: dept.id,
      name: dept.name,
      nameVi: dept.nameVi,
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header session={session} onSearchOpen={() => setIsSearchOpen(true)} />

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <Hero onBookingOpen={() => setIsBookingOpen(true)} />

        {/* Role-based Quick Access */}
        <RoleShortcuts session={session} />

        {/* Smart Appointment Widget Section */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('booking.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {language === 'vi' 
                  ? 'Đặt lịch khám nhanh chóng với hệ thống thông minh, kiểm tra xung đột lịch tự động'
                  : 'Quick appointment booking with smart system and automatic schedule conflict checking'
                }
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <Button 
                    size="lg" 
                    className="w-full text-lg py-6"
                    onClick={() => setIsBookingOpen(true)}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t('hero.ctaPrimary')}
                  </Button>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{language === 'vi' ? 'Kiểm tra xung đột tự động' : 'Auto conflict check'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{language === 'vi' ? 'Xác nhận ngay lập tức' : 'Instant confirmation'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span>{language === 'vi' ? 'Nhắc lịch thông minh' : 'Smart reminders'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Doctor Spotlight Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('doctors.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('doctors.subtitle')}
              </p>
            </div>

            {/* Department Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {departmentFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedDepartmentFilter === filter.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDepartmentFilter(filter.id)}
                  className="text-sm"
                >
                  {language === 'vi' ? filter.nameVi : filter.name}
                </Button>
              ))}
            </div>

            {/* Doctors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  onBookAppointment={() => setIsBookingOpen(true)}
                />
              ))}
            </div>

            {/* View All Doctors */}
            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/doctors">
                  {language === 'vi' ? 'Xem tất cả bác sĩ' : 'View All Doctors'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Departments Overview */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('departments.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('departments.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockDepartments.slice(0, 8).map((department) => (
                <DepartmentCard key={department.id} department={department} />
              ))}
            </div>
          </div>
        </section>

        {/* System Highlights */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('highlights.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {language === 'vi' 
                  ? 'Công nghệ tiên tiến và bảo mật cao cho trải nghiệm y tế tốt nhất'
                  : 'Advanced technology and high security for the best healthcare experience'
                }
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{t('highlights.security.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('highlights.security.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{t('highlights.realtime.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('highlights.realtime.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                    <Video className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{t('highlights.telehealth.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('highlights.telehealth.description')}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">{t('highlights.records.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('highlights.records.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* News & Announcements */}
        <NewsList />

        {/* Testimonials */}
        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                {t('testimonials.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('testimonials.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {mockTestimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      "{language === 'vi' ? testimonial.commentVi : testimonial.comment}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {language === 'vi' ? testimonial.departmentVi : testimonial.department}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  {t('cta.title')}
                </h2>
                <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                  {t('cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6"
                    onClick={() => setIsBookingOpen(true)}
                  >
                    {t('cta.book')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                    asChild
                  >
                    <Link href="/register">
                      {t('cta.register')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <BookingWidget
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        session={session}
      />

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Accessibility Features */}
      <AccessibilityFeatures />
    </div>
  );
}

// Main component with providers
export default function Page() {
  return (
    <AuthProvider>
      <I18nProvider
        dictionaries={{
          vi: vietnameseDictionary,
          en: englishDictionary,
        }}
        defaultLanguage="vi"
      >
        <HomePage />
      </I18nProvider>
    </AuthProvider>
  );
}
