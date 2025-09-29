"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vietnameseFormatters = exports.translateDirective = exports.i18nPlugin = void 0;
exports.translateField = translateField;
exports.translateStatus = translateStatus;
exports.translateDepartment = translateDepartment;
exports.translateMedicalTerm = translateMedicalTerm;
exports.formatDate = formatDate;
exports.translateAppointmentType = translateAppointmentType;
exports.createTranslatedError = createTranslatedError;
exports.Translate = Translate;
exports.addVietnameseContext = addVietnameseContext;
exports.translateObject = translateObject;
exports.translateArray = translateArray;
const i18n_service_1 = require("../services/i18n.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
/**
 * GraphQL plugin for internationalization support
 */
exports.i18nPlugin = {
    async requestDidStart() {
        return {
            // Set language from request headers
            async willSendResponse(requestContext) {
                try {
                    // Get language from Accept-Language header or query parameter
                    const request = requestContext.request;
                    let language = i18n_service_1.SupportedLanguages.VI; // Default to Vietnamese
                    // Check query parameter first
                    if (request.http?.url) {
                        const url = new URL(request.http.url, 'http://localhost');
                        const langParam = url.searchParams.get('lang');
                        if (langParam && Object.values(i18n_service_1.SupportedLanguages).includes(langParam)) {
                            language = langParam;
                        }
                    }
                    // Check Accept-Language header
                    if (!language || language === i18n_service_1.SupportedLanguages.VI) {
                        const acceptLanguage = request.http?.headers?.get('accept-language');
                        if (acceptLanguage) {
                            if (acceptLanguage.includes('en')) {
                                language = i18n_service_1.SupportedLanguages.EN;
                            }
                            else if (acceptLanguage.includes('vi')) {
                                language = i18n_service_1.SupportedLanguages.VI;
                            }
                        }
                    }
                    // Set language for this request
                    i18n_service_1.i18nService.setLanguage(language);
                    // Translate response if there are errors
                    if (requestContext.response?.errors) {
                        requestContext.response.errors = requestContext.response.errors.map((error) => i18n_service_1.i18nService.translateError(error));
                    }
                    // Add language info to response extensions
                    if (!requestContext.response?.extensions) {
                        requestContext.response.extensions = {};
                    }
                    requestContext.response.extensions.language = language;
                    requestContext.response.extensions.translations = {
                        available: Object.values(i18n_service_1.SupportedLanguages),
                        current: language
                    };
                }
                catch (error) {
                    logger_1.default.error('❌ I18n middleware error:', error);
                }
            }
        };
    }
};
/**
 * Directive for translating specific fields
 */
exports.translateDirective = {
    name: 'translate',
    definition: `directive @translate(key: String!) on FIELD_DEFINITION`,
    transformer: (schema) => {
        // This would implement field-level translation
        // For now, we'll handle translation in resolvers
        return schema;
    }
};
/**
 * Helper function to translate field values in resolvers
 */
function translateField(key, params) {
    return i18n_service_1.i18nService.translate(key, params);
}
/**
 * Helper function to translate status values
 */
function translateStatus(status) {
    const statusKey = `status.${status.toLowerCase()}`;
    const translated = i18n_service_1.i18nService.translate(statusKey);
    // If translation not found, return original status
    return translated === statusKey ? status : translated;
}
/**
 * Helper function to translate department names
 */
function translateDepartment(departmentName) {
    const departmentKey = `department.${departmentName.toLowerCase().replace(/\s+/g, '')}`;
    const translated = i18n_service_1.i18nService.translate(departmentKey);
    // If translation not found, return original name
    return translated === departmentKey ? departmentName : translated;
}
/**
 * Helper function to translate medical terms
 */
function translateMedicalTerm(term) {
    const medicalKey = `medical.${term.toLowerCase().replace(/\s+/g, '')}`;
    const translated = i18n_service_1.i18nService.translate(medicalKey);
    // If translation not found, return original term
    return translated === medicalKey ? term : translated;
}
/**
 * Helper function to format dates according to current language
 */
function formatDate(date, format = 'short') {
    return i18n_service_1.i18nService.formatDate(date, format);
}
/**
 * Helper function to translate appointment types
 */
function translateAppointmentType(type) {
    const typeKey = `appointment.${type.toLowerCase()}`;
    const translated = i18n_service_1.i18nService.translate(typeKey);
    return translated === typeKey ? type : translated;
}
/**
 * Helper function to translate error messages in resolvers
 */
function createTranslatedError(messageKey, params) {
    const translatedMessage = i18n_service_1.i18nService.translate(messageKey, params);
    return new Error(translatedMessage);
}
/**
 * Decorator for automatic field translation
 */
function Translate(key) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = function (...args) {
            const result = method.apply(this, args);
            if (typeof result === 'string') {
                return i18n_service_1.i18nService.translate(key, { value: result });
            }
            if (result && typeof result.then === 'function') {
                return result.then((value) => {
                    if (typeof value === 'string') {
                        return i18n_service_1.i18nService.translate(key, { value });
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
function addVietnameseContext(context) {
    return {
        ...context,
        i18n: {
            translate: (key, params) => i18n_service_1.i18nService.translate(key, params),
            translateStatus,
            translateDepartment,
            translateMedicalTerm,
            translateAppointmentType,
            formatDate,
            getCurrentLanguage: () => i18n_service_1.i18nService.getCurrentLanguage(),
            createError: createTranslatedError
        }
    };
}
/**
 * Helper to translate object properties
 */
function translateObject(obj, translationMap) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const translated = { ...obj };
    Object.keys(translationMap).forEach(key => {
        if (key in translated) {
            const translationKey = translationMap[key];
            translated[key] = i18n_service_1.i18nService.translate(translationKey, { value: translated[key] });
        }
    });
    return translated;
}
/**
 * Helper to translate array of objects
 */
function translateArray(arr, translationMap) {
    if (!Array.isArray(arr))
        return arr;
    return arr.map(item => translateObject(item, translationMap));
}
/**
 * Vietnamese-specific formatters
 */
exports.vietnameseFormatters = {
    // Format Vietnamese phone numbers
    formatPhoneNumber: (phone) => {
        if (!phone)
            return phone;
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        // Format as Vietnamese phone number
        if (digits.length === 10 && digits.startsWith('0')) {
            return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        }
        return phone;
    },
    // Format Vietnamese currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },
    // Format Vietnamese address
    formatAddress: (address) => {
        if (typeof address === 'string')
            return address;
        const parts = [];
        if (address.street)
            parts.push(address.street);
        if (address.ward)
            parts.push(address.ward);
        if (address.district)
            parts.push(address.district);
        if (address.city)
            parts.push(address.city);
        if (address.province)
            parts.push(address.province);
        return parts.join(', ');
    },
    // Format Vietnamese ID number
    formatIdNumber: (id) => {
        if (!id)
            return id;
        // Format as Vietnamese ID (12 digits)
        const digits = id.replace(/\D/g, '');
        if (digits.length === 12) {
            return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        }
        return id;
    }
};
exports.default = {
    i18nPlugin: exports.i18nPlugin,
    translateDirective: exports.translateDirective,
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
    vietnameseFormatters: exports.vietnameseFormatters
};
//# sourceMappingURL=i18n.middleware.js.map