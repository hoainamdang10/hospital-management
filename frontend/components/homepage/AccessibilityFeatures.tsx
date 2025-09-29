'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accessibility,
  Type,
  Eye,
  Volume2,
  MousePointer,
  Keyboard,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface AccessibilityState {
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export function AccessibilityFeatures() {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilityState>({
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage and apply changes
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  const applyAccessibilitySettings = (newSettings: AccessibilityState) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${newSettings.fontSize}%`;

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Screen reader announcements
    if (newSettings.screenReader) {
      root.setAttribute('aria-live', 'polite');
    } else {
      root.removeAttribute('aria-live');
    }

    // Keyboard navigation
    if (newSettings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  };

  const updateSetting = <K extends keyof AccessibilityState>(
    key: K,
    value: AccessibilityState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilityState = {
      fontSize: 100,
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: false,
    };
    setSettings(defaultSettings);
  };

  const increaseFontSize = () => {
    updateSetting('fontSize', Math.min(settings.fontSize + 10, 150));
  };

  const decreaseFontSize = () => {
    updateSetting('fontSize', Math.max(settings.fontSize - 10, 80));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to open accessibility menu
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }

      // Alt + Plus to increase font size
      if (e.altKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        increaseFontSize();
      }

      // Alt + Minus to decrease font size
      if (e.altKey && e.key === '-') {
        e.preventDefault();
        decreaseFontSize();
      }

      // Alt + C for high contrast
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        updateSetting('highContrast', !settings.highContrast);
      }

      // Alt + M for reduced motion
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        updateSetting('reducedMotion', !settings.reducedMotion);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, settings]);

  return (
    <>
      {/* Accessibility Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label={language === 'vi' ? 'Tùy chọn trợ năng' : 'Accessibility options'}
            >
              <Accessibility className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 p-4"
            aria-label={language === 'vi' ? 'Menu trợ năng' : 'Accessibility menu'}
          >
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">
                  {language === 'vi' ? 'Tùy chọn trợ năng' : 'Accessibility Options'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'vi' 
                    ? 'Tùy chỉnh trải nghiệm của bạn'
                    : 'Customize your experience'
                  }
                </p>
              </div>

              {/* Font Size */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {language === 'vi' ? 'Cỡ chữ' : 'Font Size'}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {settings.fontSize}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={decreaseFontSize}
                      disabled={settings.fontSize <= 80}
                      aria-label={language === 'vi' ? 'Giảm cỡ chữ' : 'Decrease font size'}
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={increaseFontSize}
                      disabled={settings.fontSize >= 150}
                      aria-label={language === 'vi' ? 'Tăng cỡ chữ' : 'Increase font size'}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Toggle Options */}
              <div className="space-y-2">
                <Button
                  variant={settings.highContrast ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateSetting('highContrast', !settings.highContrast)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {language === 'vi' ? 'Độ tương phản cao' : 'High Contrast'}
                </Button>

                <Button
                  variant={settings.reducedMotion ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                >
                  <MousePointer className="h-4 w-4 mr-2" />
                  {language === 'vi' ? 'Giảm chuyển động' : 'Reduced Motion'}
                </Button>

                <Button
                  variant={settings.keyboardNavigation ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateSetting('keyboardNavigation', !settings.keyboardNavigation)}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  {language === 'vi' ? 'Điều hướng bàn phím' : 'Keyboard Navigation'}
                </Button>

                <Button
                  variant={settings.screenReader ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => updateSetting('screenReader', !settings.screenReader)}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  {language === 'vi' ? 'Đọc màn hình' : 'Screen Reader'}
                </Button>
              </div>

              {/* Reset Button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={resetSettings}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {language === 'vi' ? 'Đặt lại' : 'Reset'}
              </Button>

              {/* Keyboard Shortcuts Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">
                  {language === 'vi' ? 'Phím tắt:' : 'Keyboard shortcuts:'}
                </p>
                <p>Alt + A: {language === 'vi' ? 'Mở menu' : 'Open menu'}</p>
                <p>Alt + +/-: {language === 'vi' ? 'Thay đổi cỡ chữ' : 'Change font size'}</p>
                <p>Alt + C: {language === 'vi' ? 'Độ tương phản' : 'High contrast'}</p>
                <p>Alt + M: {language === 'vi' ? 'Giảm chuyển động' : 'Reduced motion'}</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Screen Reader Announcements */}
      <div
        id="accessibility-announcements"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        {language === 'vi' ? 'Chuyển đến nội dung chính' : 'Skip to main content'}
      </a>
    </>
  );
}
