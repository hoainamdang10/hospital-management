/**
 * RecipientInfo - Domain Value Object
 * Represents notification recipient information with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

export type RecipientType = 'PATIENT' | 'DOCTOR' | 'STAFF' | 'ADMIN' | 'FAMILY' | 'EXTERNAL';

export interface ContactInfo {
  email?: string;
  phoneNumber?: string;
  pushToken?: string;
  address?: string;
}

export interface PreferenceSettings {
  preferredChannels: string[]; // Channel types in order of preference
  timezone: string;
  language: 'vi' | 'en';
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  optOut: {
    marketing: boolean;
    reminders: boolean;
    emergency: boolean; // Cannot opt out of emergency notifications
  };
}

export interface HealthcareContext {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  relationshipToPatient?: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'GUARDIAN' | 'OTHER';
  emergencyContact: boolean;
  hipaaAuthorized: boolean;
}

export class RecipientInfo {
  private readonly recipientId: string;
  private readonly recipientType: RecipientType;
  private readonly fullName: string;
  private readonly contactInfo: ContactInfo;
  private readonly preferences: PreferenceSettings;
  private readonly healthcareContext: HealthcareContext;
  private readonly isActive: boolean;

  private constructor(
    recipientId: string,
    recipientType: RecipientType,
    fullName: string,
    contactInfo: ContactInfo,
    preferences: PreferenceSettings,
    healthcareContext: HealthcareContext,
    isActive: boolean = true
  ) {
    this.recipientId = recipientId;
    this.recipientType = recipientType;
    this.fullName = fullName;
    this.contactInfo = contactInfo;
    this.preferences = preferences;
    this.healthcareContext = healthcareContext;
    this.isActive = isActive;
  }

  /**
   * Create RecipientInfo with validation
   */
  public static create(data: {
    recipientId: string;
    recipientType: RecipientType;
    fullName: string;
    contactInfo: ContactInfo;
    preferences?: Partial<PreferenceSettings>;
    healthcareContext?: Partial<HealthcareContext>;
    isActive?: boolean;
  }): RecipientInfo {
    // Validate required fields
    if (!data.recipientId?.trim()) {
      throw new Error('Mã người nhận không được để trống');
    }

    if (!data.fullName?.trim()) {
      throw new Error('Tên người nhận không được để trống');
    }

    // Validate Vietnamese name format
    if (!RecipientInfo.isValidVietnameseName(data.fullName)) {
      throw new Error('Tên người nhận không đúng định dạng tiếng Việt');
    }

    // Validate contact information
    RecipientInfo.validateContactInfo(data.contactInfo);

    // Set default preferences
    const defaultPreferences: PreferenceSettings = {
      preferredChannels: ['PUSH', 'SMS', 'EMAIL'],
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi',
      quietHours: {
        start: '22:00',
        end: '07:00'
      },
      optOut: {
        marketing: false,
        reminders: false,
        emergency: false // Cannot opt out
      }
    };

    const preferences = { ...defaultPreferences, ...data.preferences };

    // Set default healthcare context
    const defaultHealthcareContext: HealthcareContext = {
      emergencyContact: false,
      hipaaAuthorized: false
    };

    const healthcareContext = { ...defaultHealthcareContext, ...data.healthcareContext };

    return new RecipientInfo(
      data.recipientId,
      data.recipientType,
      data.fullName,
      data.contactInfo,
      preferences,
      healthcareContext,
      data.isActive ?? true
    );
  }

  /**
   * Validate Vietnamese name format
   */
  private static isValidVietnameseName(name: string): boolean {
    if (!name || name.trim().length < 2) return false;
    
    // Allow Vietnamese characters, spaces, and common punctuation
    const vietnameseNameRegex = /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s.'-]+$/;
    
    return vietnameseNameRegex.test(name.trim());
  }

  /**
   * Validate contact information
   */
  private static validateContactInfo(contactInfo: ContactInfo): void {
    if (!contactInfo.email && !contactInfo.phoneNumber && !contactInfo.pushToken) {
      throw new Error('Phải có ít nhất một thông tin liên lạc (email, số điện thoại, hoặc push token)');
    }

    // Validate email format
    if (contactInfo.email && !RecipientInfo.isValidEmail(contactInfo.email)) {
      throw new Error('Địa chỉ email không đúng định dạng');
    }

    // Validate Vietnamese phone number
    if (contactInfo.phoneNumber && !RecipientInfo.isValidVietnamesePhoneNumber(contactInfo.phoneNumber)) {
      throw new Error('Số điện thoại không đúng định dạng Việt Nam');
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Vietnamese phone number
   */
  private static isValidVietnamesePhoneNumber(phoneNumber: string): boolean {
    // Vietnamese phone number formats: 0xxxxxxxxx or +84xxxxxxxxx
    const phoneRegex = /^(\+84|0)[3-9]\d{8}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  /**
   * Get recipient ID
   */
  public getRecipientId(): string {
    return this.recipientId;
  }

  /**
   * Get recipient type
   */
  public getRecipientType(): RecipientType {
    return this.recipientType;
  }

  /**
   * Get full name
   */
  public getFullName(): string {
    return this.fullName;
  }

  /**
   * Get contact information
   */
  public getContactInfo(): ContactInfo {
    return { ...this.contactInfo };
  }

  /**
   * Get preferences
   */
  public getPreferences(): PreferenceSettings {
    return { ...this.preferences };
  }

  /**
   * Get healthcare context
   */
  public getHealthcareContext(): HealthcareContext {
    return { ...this.healthcareContext };
  }

  /**
   * Check if recipient is active
   */
  public isActiveRecipient(): boolean {
    return this.isActive;
  }

  /**
   * Check if recipient is HIPAA authorized
   */
  public isHipaaAuthorized(): boolean {
    return this.healthcareContext.hipaaAuthorized;
  }

  /**
   * Check if recipient is emergency contact
   */
  public isEmergencyContact(): boolean {
    return this.healthcareContext.emergencyContact;
  }

  /**
   * Get preferred language
   */
  public getPreferredLanguage(): 'vi' | 'en' {
    return this.preferences.language;
  }

  /**
   * Get preferred channels in order
   */
  public getPreferredChannels(): string[] {
    return [...this.preferences.preferredChannels];
  }

  /**
   * Check if recipient has opted out of specific notification type
   */
  public hasOptedOut(notificationType: 'marketing' | 'reminders' | 'emergency'): boolean {
    return this.preferences.optOut[notificationType];
  }

  /**
   * Check if current time is within quiet hours
   */
  public isInQuietHours(currentTime?: Date): boolean {
    if (!this.preferences.quietHours) return false;

    const now = currentTime || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTimeMinutes > endTimeMinutes) {
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
    }

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }

  /**
   * Get contact info for specific channel
   */
  public getContactForChannel(channelType: string): string | undefined {
    switch (channelType.toUpperCase()) {
      case 'EMAIL':
        return this.contactInfo.email;
      case 'SMS':
        return this.contactInfo.phoneNumber;
      case 'PUSH':
        return this.contactInfo.pushToken;
      default:
        return undefined;
    }
  }

  /**
   * Check if recipient can receive notifications on specific channel
   */
  public canReceiveOnChannel(channelType: string): boolean {
    const contact = this.getContactForChannel(channelType);
    return !!contact && this.isActive;
  }

  /**
   * Get Vietnamese recipient type name
   */
  public getVietnameseTypeName(): string {
    const typeNames: Record<RecipientType, string> = {
      PATIENT: 'Bệnh nhân',
      DOCTOR: 'Bác sĩ',
      STAFF: 'Nhân viên',
      ADMIN: 'Quản trị viên',
      FAMILY: 'Thân nhân',
      EXTERNAL: 'Bên ngoài'
    };

    return typeNames[this.recipientType];
  }

  /**
   * Get display name with type
   */
  public getDisplayName(): string {
    return `${this.fullName} (${this.getVietnameseTypeName()})`;
  }

  /**
   * Create copy with updated preferences
   */
  public withPreferences(preferences: Partial<PreferenceSettings>): RecipientInfo {
    return new RecipientInfo(
      this.recipientId,
      this.recipientType,
      this.fullName,
      this.contactInfo,
      { ...this.preferences, ...preferences },
      this.healthcareContext,
      this.isActive
    );
  }

  /**
   * Create copy with updated contact info
   */
  public withContactInfo(contactInfo: Partial<ContactInfo>): RecipientInfo {
    return new RecipientInfo(
      this.recipientId,
      this.recipientType,
      this.fullName,
      { ...this.contactInfo, ...contactInfo },
      this.preferences,
      this.healthcareContext,
      this.isActive
    );
  }

  /**
   * Deactivate recipient
   */
  public deactivate(): RecipientInfo {
    return new RecipientInfo(
      this.recipientId,
      this.recipientType,
      this.fullName,
      this.contactInfo,
      this.preferences,
      this.healthcareContext,
      false
    );
  }

  /**
   * Equality comparison
   */
  public equals(other: RecipientInfo): boolean {
    if (!other) return false;
    return this.recipientId === other.recipientId;
  }

  /**
   * String representation
   */
  public toString(): string {
    return `${this.fullName} (${this.recipientId})`;
  }

  /**
   * JSON serialization
   */
  public toJSON(): object {
    return {
      recipientId: this.recipientId,
      recipientType: this.recipientType,
      fullName: this.fullName,
      contactInfo: this.contactInfo,
      preferences: this.preferences,
      healthcareContext: this.healthcareContext,
      isActive: this.isActive
    };
  }

  /**
   * Create from JSON
   */
  public static fromJSON(json: any): RecipientInfo {
    return new RecipientInfo(
      json.recipientId,
      json.recipientType,
      json.fullName,
      json.contactInfo,
      json.preferences,
      json.healthcareContext,
      json.isActive
    );
  }
}
