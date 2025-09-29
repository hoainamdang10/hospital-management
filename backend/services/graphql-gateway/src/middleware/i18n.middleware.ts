import { GraphQLRequestContext } from '@apollo/server';
import { i18nService, SupportedLanguages } from '../services/i18n.service';
import logger from '@hospital/shared/dist/utils/logger';

/**
 * GraphQL plugin for internationalization support
 */
export const i18nPlugin = {
  async requestDidStart() {
    return {
      // Set language from request headers
      async willSendResponse(requestContext: any) {
        try {
          // Get language from Accept-Language header or query parameter
          const request = requestContext.request;
          let language = SupportedLanguages.VI; // Default to Vietnamese

          // Check query parameter first
          if (request.http?.url) {
            const url = new URL(request.http.url, 'http://localhost');
            const langParam = url.searchParams.get('lang');
            if (langParam && Object.values(SupportedLanguages).includes(langParam as SupportedLanguages)) {
              language = langParam as SupportedLanguages;
            }
          }

          // Check Accept-Language header
          if (!language || language === SupportedLanguages.VI) {
            const acceptLanguage = request.http?.headers?.get('accept-language');
            if (acceptLanguage) {
              if (acceptLanguage.includes('en')) {
                language = SupportedLanguages.EN;
              } else if (acceptLanguage.includes('vi')) {
                language = SupportedLanguages.VI;
              }
            }
          }

          // Set language for this request
          i18nService.setLanguage(language);

          // Translate response if there are errors
          if (requestContext.response?.errors) {
            requestContext.response.errors = requestContext.response.errors.map((error: any) =>
              i18nService.translateError(error)
            );
          }

          // Add language info to response extensions
          if (!requestContext.response?.extensions) {
            requestContext.response!.extensions = {};
          }

          requestContext.response!.extensions.language = language;
          requestContext.response!.extensions.translations = {
            available: Object.values(SupportedLanguages),
            current: language
          };

        } catch (error) {
          logger.error('❌ I18n middleware error:', error);
        }
      }
    };
  }
};

/**
 * Directive for translating specific fields
 */
export const translateDirective = {
  name: 'translate',
  definition: `directive @translate(key: String!) on FIELD_DEFINITION`,
  transformer: (schema: any) => {
    // This would implement field-level translation
    // For now, we'll handle translation in resolvers
    return schema;
  }
};

/**
 * Helper function to translate field values in resolvers
 */
export function translateField(key: string, params?: { [key: string]: string | number }): string {
  return i18nService.translate(key, params);
}

/**
 * Helper function to translate status values
 */
export function translateStatus(status: string): string {
  const statusKey = `status.${status.toLowerCase()}`;
  const translated = i18nService.translate(statusKey);
  
  // If translation not found, return original status
  return translated === statusKey ? status : translated;
}

/**
 * Helper function to translate department names
 */
export function translateDepartment(departmentName: string): string {
  const departmentKey = `department.${departmentName.toLowerCase().replace(/\s+/g, '')}`;
  const translated = i18nService.translate(departmentKey);
  
  // If translation not found, return original name
  return translated === departmentKey ? departmentName : translated;
}

/**
 * Helper function to translate medical terms
 */
export function translateMedicalTerm(term: string): string {
  const medicalKey = `medical.${term.toLowerCase().replace(/\s+/g, '')}`;
  const translated = i18nService.translate(medicalKey);
  
  // If translation not found, return original term
  return translated === medicalKey ? term : translated;
}

/**
 * Helper function to format dates according to current language
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  return i18nService.formatDate(date, format);
}

/**
 * Helper function to translate appointment types
 */
export function translateAppointmentType(type: string): string {
  const typeKey = `appointment.${type.toLowerCase()}`;
  const translated = i18nService.translate(typeKey);
  
  return translated === typeKey ? type : translated;
}

/**
 * Helper function to translate error messages in resolvers
 */
export function createTranslatedError(messageKey: string, params?: { [key: string]: string | number }): Error {
  const translatedMessage = i18nService.translate(messageKey, params);
  return new Error(translatedMessage);
}

/**
 * Decorator for automatic field translation
 */
export function Translate(key: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const result = method.apply(this, args);
      
      if (typeof result === 'string') {
        return i18nService.translate(key, { value: result });
      }
      
      if (result && typeof result.then === 'function') {
        return result.then((value: any) => {
          if (typeof value === 'string') {
            return i18nService.translate(key, { value });
          }
          return value;
        });
      }
      
      return result;
    };
  };
}

/**
 * Middleware to add Vietnamese context to GraphQL context
 */
export function addVietnameseContext(context: any): any {
  return {
    ...context,
    i18n: {
      translate: (key: string, params?: { [key: string]: string | number }) => 
        i18nService.translate(key, params),
      translateStatus,
      translateDepartment,
      translateMedicalTerm,
      translateAppointmentType,
      formatDate,
      getCurrentLanguage: () => i18nService.getCurrentLanguage(),
      createError: createTranslatedError
    }
  };
}

/**
 * Helper to translate object properties
 */
export function translateObject(obj: any, translationMap: { [key: string]: string }): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const translated = { ...obj };
  
  Object.keys(translationMap).forEach(key => {
    if (key in translated) {
      const translationKey = translationMap[key];
      translated[key] = i18nService.translate(translationKey, { value: translated[key] });
    }
  });
  
  return translated;
}

/**
 * Helper to translate array of objects
 */
export function translateArray(arr: any[], translationMap: { [key: string]: string }): any[] {
  if (!Array.isArray(arr)) return arr;
  
  return arr.map(item => translateObject(item, translationMap));
}

/**
 * Vietnamese-specific formatters
 */
export const vietnameseFormatters = {
  // Format Vietnamese phone numbers
  formatPhoneNumber: (phone: string): string => {
    if (!phone) return phone;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as Vietnamese phone number
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    
    return phone;
  },

  // Format Vietnamese currency
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  // Format Vietnamese address
  formatAddress: (address: any): string => {
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    if (address.province) parts.push(address.province);
    
    return parts.join(', ');
  },

  // Format Vietnamese ID number
  formatIdNumber: (id: string): string => {
    if (!id) return id;
    
    // Format as Vietnamese ID (12 digits)
    const digits = id.replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
    
    return id;
  }
};

export default {
  i18nPlugin,
  translateDirective,
  translateField,
  translateStatus,
  translateDepartment,
  translateMedicalTerm,
  formatDate,
  translateAppointmentType,
  createTranslatedError,
  Translate,
  addVietnameseContext,
  translateObject,
  translateArray,
  vietnameseFormatters
};
