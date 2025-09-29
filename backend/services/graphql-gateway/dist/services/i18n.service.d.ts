export declare enum SupportedLanguages {
    VI = "vi",
    EN = "en"
}
interface Translation {
    [key: string]: string | Translation;
}
declare class I18nService {
    private currentLanguage;
    private translations;
    /**
     * Set current language
     */
    setLanguage(language: SupportedLanguages): void;
    /**
     * Get current language
     */
    getCurrentLanguage(): SupportedLanguages;
    /**
     * Translate a key to current language
     */
    translate(key: string, params?: {
        [key: string]: string | number;
    }): string;
    /**
     * Get translation for specific language
     */
    private getTranslation;
    /**
     * Interpolate parameters into translation string
     */
    private interpolate;
    /**
     * Translate GraphQL error messages
     */
    translateError(error: any): any;
    /**
     * Translate error messages
     */
    private translateErrorMessage;
    /**
     * Translate error codes
     */
    private translateErrorCode;
    /**
     * Format Vietnamese date
     */
    formatDate(date: Date | string, format?: 'short' | 'long' | 'time'): string;
    /**
     * Get all translations for current language
     */
    getAllTranslations(): Translation;
    /**
     * Add custom translations
     */
    addTranslations(language: SupportedLanguages, translations: Translation): void;
}
export declare const i18nService: I18nService;
export default i18nService;
//# sourceMappingURL=i18n.service.d.ts.map