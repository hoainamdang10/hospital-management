/**
 * CommunicationPreference Value Object
 * Represents patient communication preferences (FHIR R6: communication field)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR R6
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
export type Language = 'vi' | 'en';
export type ContactMethod = 'email' | 'sms' | 'phone';
export interface CommunicationPreferenceProps {
    language: Language;
    preferred: boolean;
    contactMethod: ContactMethod;
    timezone: string;
}
export declare class CommunicationPreference extends ValueObject<CommunicationPreferenceProps> {
    private constructor();
    /**
     * Validate format (required by ValueObject base class)
     */
    protected validateFormat(): void;
    static create(props: CommunicationPreferenceProps): CommunicationPreference;
    get language(): Language;
    get preferred(): boolean;
    get contactMethod(): ContactMethod;
    get timezone(): string;
    /**
     * Convert to plain object for persistence
     */
    toDTO(): CommunicationPreferenceProps;
}
//# sourceMappingURL=CommunicationPreference.d.ts.map