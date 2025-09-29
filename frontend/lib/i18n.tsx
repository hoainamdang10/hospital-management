// Simple i18n system for Hospital Management System
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'vi' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Dictionary type
export interface Dictionary {
  [key: string]: string | Dictionary;
}

// Get nested value from dictionary
function getNestedValue(obj: Dictionary, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

// I18n Provider Component
interface I18nProviderProps {
  children: ReactNode;
  dictionaries: Record<Language, Dictionary>;
  defaultLanguage?: Language;
}

export function I18nProvider({ 
  children, 
  dictionaries, 
  defaultLanguage = 'vi' 
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('hospital-language') as Language;
      if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
        setLanguageState(savedLang);
      }
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hospital-language', lang);
    }
  };

  // Translation function
  const t = (key: string): string => {
    const dictionary = dictionaries[language];
    if (!dictionary) return key;
    
    return getNestedValue(dictionary, key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Utility function for formatting numbers as currency
export function formatCurrency(amount: number, language: Language): string {
  if (language === 'vi') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 25000); // Rough conversion for display
  }
}

// Utility function for formatting dates
export function formatDate(date: string | Date, language: Language): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'vi') {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  }
}

// Utility function for formatting time
export function formatTime(date: string | Date, language: Language): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: language === 'en',
  }).format(dateObj);
}

// Language detection utility
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'vi';
  
  // Check localStorage first
  const saved = localStorage.getItem('hospital-language') as Language;
  if (saved && (saved === 'vi' || saved === 'en')) {
    return saved;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('vi')) {
    return 'vi';
  }
  
  return 'en'; // Default to English for international users
}
