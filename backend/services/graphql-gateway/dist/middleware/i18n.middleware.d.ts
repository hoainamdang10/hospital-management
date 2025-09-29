/**
 * GraphQL plugin for internationalization support
 */
export declare const i18nPlugin: {
    requestDidStart(): Promise<{
        willSendResponse(requestContext: any): Promise<void>;
    }>;
};
/**
 * Directive for translating specific fields
 */
export declare const translateDirective: {
    name: string;
    definition: string;
    transformer: (schema: any) => any;
};
/**
 * Helper function to translate field values in resolvers
 */
export declare function translateField(key: string, params?: {
    [key: string]: string | number;
}): string;
/**
 * Helper function to translate status values
 */
export declare function translateStatus(status: string): string;
/**
 * Helper function to translate department names
 */
export declare function translateDepartment(departmentName: string): string;
/**
 * Helper function to translate medical terms
 */
export declare function translateMedicalTerm(term: string): string;
/**
 * Helper function to format dates according to current language
 */
export declare function formatDate(date: Date | string, format?: 'short' | 'long' | 'time'): string;
/**
 * Helper function to translate appointment types
 */
export declare function translateAppointmentType(type: string): string;
/**
 * Helper function to translate error messages in resolvers
 */
export declare function createTranslatedError(messageKey: string, params?: {
    [key: string]: string | number;
}): Error;
/**
 * Decorator for automatic field translation
 */
export declare function Translate(key: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
/**
 * Middleware to add Vietnamese context to GraphQL context
 */
export declare function addVietnameseContext(context: any): any;
/**
 * Helper to translate object properties
 */
export declare function translateObject(obj: any, translationMap: {
    [key: string]: string;
}): any;
/**
 * Helper to translate array of objects
 */
export declare function translateArray(arr: any[], translationMap: {
    [key: string]: string;
}): any[];
/**
 * Vietnamese-specific formatters
 */
export declare const vietnameseFormatters: {
    formatPhoneNumber: (phone: string) => string;
    formatCurrency: (amount: number) => string;
    formatAddress: (address: any) => string;
    formatIdNumber: (id: string) => string;
};
declare const _default: {
    i18nPlugin: {
        requestDidStart(): Promise<{
            willSendResponse(requestContext: any): Promise<void>;
        }>;
    };
    translateDirective: {
        name: string;
        definition: string;
        transformer: (schema: any) => any;
    };
    translateField: typeof translateField;
    translateStatus: typeof translateStatus;
    translateDepartment: typeof translateDepartment;
    translateMedicalTerm: typeof translateMedicalTerm;
    formatDate: typeof formatDate;
    translateAppointmentType: typeof translateAppointmentType;
    createTranslatedError: typeof createTranslatedError;
    Translate: typeof Translate;
    addVietnameseContext: typeof addVietnameseContext;
    translateObject: typeof translateObject;
    translateArray: typeof translateArray;
    vietnameseFormatters: {
        formatPhoneNumber: (phone: string) => string;
        formatCurrency: (amount: number) => string;
        formatAddress: (address: any) => string;
        formatIdNumber: (id: string) => string;
    };
};
export default _default;
//# sourceMappingURL=i18n.middleware.d.ts.map