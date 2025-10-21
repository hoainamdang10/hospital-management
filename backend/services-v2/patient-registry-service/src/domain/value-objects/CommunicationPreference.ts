/**
 * CommunicationPreference Value Object
 * Represents patient communication preferences (FHIR R6: communication field)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, FHIR R6
 */

import { ValueObject } from '@shared/domain/base/value-object';

export type Language = 'vi' | 'en';
export type ContactMethod = 'email' | 'sms' | 'phone';

export interface CommunicationPreferenceProps {
  language: Language;
  preferred: boolean;
  contactMethod: ContactMethod;
  timezone: string;
}

export class CommunicationPreference extends ValueObject<CommunicationPreferenceProps> {
  private constructor(props: CommunicationPreferenceProps) {
    super(props);
  }

  /**
   * Validate format (required by ValueObject base class)
   */
  protected validateFormat(): void {
    // Validate language
    if (!['vi', 'en'].includes(this.props.language)) {
      throw new Error('Ngôn ngữ không hợp lệ. Chỉ chấp nhận: vi, en');
    }

    // Validate contact method
    if (!['email', 'sms', 'phone'].includes(this.props.contactMethod)) {
      throw new Error('Phương thức liên hệ không hợp lệ. Chỉ chấp nhận: email, sms, phone');
    }

    // Validate timezone
    if (!this.props.timezone || this.props.timezone.trim() === '') {
      throw new Error('Múi giờ không được để trống');
    }
  }

  public static create(props: CommunicationPreferenceProps): CommunicationPreference {
    return new CommunicationPreference(props);
  }

  get language(): Language {
    return this.props.language;
  }

  get preferred(): boolean {
    return this.props.preferred;
  }

  get contactMethod(): ContactMethod {
    return this.props.contactMethod;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  /**
   * Convert to plain object for persistence
   */
  public toDTO(): CommunicationPreferenceProps {
    return {
      language: this.props.language,
      preferred: this.props.preferred,
      contactMethod: this.props.contactMethod,
      timezone: this.props.timezone
    };
  }
}

