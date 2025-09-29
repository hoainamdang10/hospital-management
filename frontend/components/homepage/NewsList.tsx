'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { useI18n, formatDate } from '@/lib/i18n';
import { mockAnnouncements } from '@/lib/mock';
import Link from 'next/link';

export function NewsList() {
  const { t, language } = useI18n();

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {t('news.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('news.subtitle')}
          </p>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mockAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {language === 'vi' ? announcement.tagVi : announcement.tag}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(announcement.date, language)}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  {language === 'vi' ? announcement.titleVi : announcement.title}
                </h3>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {language === 'vi' ? announcement.excerptVi : announcement.excerpt}
                </p>

                <Button variant="ghost" size="sm" className="p-0 h-auto font-medium" asChild>
                  <Link href={announcement.href}>
                    {t('news.readMore')}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/news">
              {t('news.viewAll')}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
