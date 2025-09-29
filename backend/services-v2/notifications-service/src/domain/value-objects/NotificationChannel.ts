/**
 * NotificationChannel - Domain Value Object
 * Represents different notification delivery channels with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

export type ChannelType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'VOICE';

export interface ChannelConfiguration {
  enabled: boolean;
  priority: number; // 1 = highest, 5 = lowest
  retryAttempts: number;
  retryDelay: number; // in milliseconds
  timeout: number; // in milliseconds
  requiresConfirmation: boolean;
  vietnameseSupport: boolean;
}

export interface ChannelMetadata {
  provider?: string;
  endpoint?: string;
  credentials?: Record<string, any>;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  formatting?: {
    maxLength: number;
    allowHtml: boolean;
    encoding: string;
  };
}

export class NotificationChannel {
  private readonly type: ChannelType;
  private readonly configuration: ChannelConfiguration;
  private readonly metadata: ChannelMetadata;

  private constructor(
    type: ChannelType,
    configuration: ChannelConfiguration,
    metadata: ChannelMetadata = {}
  ) {
    this.type = type;
    this.configuration = configuration;
    this.metadata = metadata;
  }

  /**
   * Create Email notification channel
   */
  public static createEmail(config?: Partial<ChannelConfiguration>): NotificationChannel {
    const defaultConfig: ChannelConfiguration = {
      enabled: true,
      priority: 2,
      retryAttempts: 3,
      retryDelay: 5000,
      timeout: 30000,
      requiresConfirmation: false,
      vietnameseSupport: true
    };

    const metadata: ChannelMetadata = {
      provider: 'SMTP',
      formatting: {
        maxLength: 10000,
        allowHtml: true,
        encoding: 'UTF-8'
      },
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000 // 1 minute
      }
    };

    return new NotificationChannel(
      'EMAIL',
      { ...defaultConfig, ...config },
      metadata
    );
  }

  /**
   * Create SMS notification channel
   */
  public static createSMS(config?: Partial<ChannelConfiguration>): NotificationChannel {
    const defaultConfig: ChannelConfiguration = {
      enabled: true,
      priority: 1, // Highest priority for urgent healthcare notifications
      retryAttempts: 2,
      retryDelay: 3000,
      timeout: 15000,
      requiresConfirmation: true,
      vietnameseSupport: true
    };

    const metadata: ChannelMetadata = {
      provider: 'TWILIO',
      formatting: {
        maxLength: 160, // Standard SMS length
        allowHtml: false,
        encoding: 'UTF-8'
      },
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000
      }
    };

    return new NotificationChannel(
      'SMS',
      { ...defaultConfig, ...config },
      metadata
    );
  }

  /**
   * Create Push notification channel
   */
  public static createPush(config?: Partial<ChannelConfiguration>): NotificationChannel {
    const defaultConfig: ChannelConfiguration = {
      enabled: true,
      priority: 1,
      retryAttempts: 3,
      retryDelay: 2000,
      timeout: 10000,
      requiresConfirmation: false,
      vietnameseSupport: true
    };

    const metadata: ChannelMetadata = {
      provider: 'FCM',
      formatting: {
        maxLength: 4000,
        allowHtml: false,
        encoding: 'UTF-8'
      },
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000
      }
    };

    return new NotificationChannel(
      'PUSH',
      { ...defaultConfig, ...config },
      metadata
    );
  }

  /**
   * Create In-App notification channel
   */
  public static createInApp(config?: Partial<ChannelConfiguration>): NotificationChannel {
    const defaultConfig: ChannelConfiguration = {
      enabled: true,
      priority: 3,
      retryAttempts: 1,
      retryDelay: 1000,
      timeout: 5000,
      requiresConfirmation: false,
      vietnameseSupport: true
    };

    const metadata: ChannelMetadata = {
      provider: 'WEBSOCKET',
      formatting: {
        maxLength: 2000,
        allowHtml: true,
        encoding: 'UTF-8'
      },
      rateLimit: {
        maxRequests: 500,
        windowMs: 60000
      }
    };

    return new NotificationChannel(
      'IN_APP',
      { ...defaultConfig, ...config },
      metadata
    );
  }

  /**
   * Create Voice notification channel (for urgent healthcare notifications)
   */
  public static createVoice(config?: Partial<ChannelConfiguration>): NotificationChannel {
    const defaultConfig: ChannelConfiguration = {
      enabled: false, // Disabled by default, enable for critical notifications
      priority: 1,
      retryAttempts: 2,
      retryDelay: 10000,
      timeout: 60000,
      requiresConfirmation: true,
      vietnameseSupport: true
    };

    const metadata: ChannelMetadata = {
      provider: 'TWILIO_VOICE',
      formatting: {
        maxLength: 500, // Voice message length limit
        allowHtml: false,
        encoding: 'UTF-8'
      },
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000
      }
    };

    return new NotificationChannel(
      'VOICE',
      { ...defaultConfig, ...config },
      metadata
    );
  }

  /**
   * Create multi-channel configuration for healthcare notifications
   */
  public static createHealthcareChannels(): NotificationChannel[] {
    return [
      NotificationChannel.createSMS({ priority: 1 }), // Highest priority
      NotificationChannel.createPush({ priority: 1 }),
      NotificationChannel.createEmail({ priority: 2 }),
      NotificationChannel.createInApp({ priority: 3 })
    ];
  }

  /**
   * Get channel type
   */
  public getType(): ChannelType {
    return this.type;
  }

  /**
   * Get channel configuration
   */
  public getConfiguration(): ChannelConfiguration {
    return { ...this.configuration };
  }

  /**
   * Get channel metadata
   */
  public getMetadata(): ChannelMetadata {
    return { ...this.metadata };
  }

  /**
   * Check if channel is enabled
   */
  public isEnabled(): boolean {
    return this.configuration.enabled;
  }

  /**
   * Check if channel supports Vietnamese
   */
  public supportsVietnamese(): boolean {
    return this.configuration.vietnameseSupport;
  }

  /**
   * Check if channel requires confirmation
   */
  public requiresConfirmation(): boolean {
    return this.configuration.requiresConfirmation;
  }

  /**
   * Get channel priority (1 = highest)
   */
  public getPriority(): number {
    return this.configuration.priority;
  }

  /**
   * Get maximum content length for this channel
   */
  public getMaxContentLength(): number {
    return this.metadata.formatting?.maxLength || 1000;
  }

  /**
   * Check if channel allows HTML content
   */
  public allowsHtml(): boolean {
    return this.metadata.formatting?.allowHtml || false;
  }

  /**
   * Get retry configuration
   */
  public getRetryConfig(): { attempts: number; delay: number } {
    return {
      attempts: this.configuration.retryAttempts,
      delay: this.configuration.retryDelay
    };
  }

  /**
   * Get timeout configuration
   */
  public getTimeout(): number {
    return this.configuration.timeout;
  }

  /**
   * Get rate limit configuration
   */
  public getRateLimit(): { maxRequests: number; windowMs: number } | undefined {
    return this.metadata.rateLimit;
  }

  /**
   * Validate content for this channel
   */
  public validateContent(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxLength = this.getMaxContentLength();

    if (!content || content.trim().length === 0) {
      errors.push('Nội dung thông báo không được để trống');
    }

    if (content.length > maxLength) {
      errors.push(`Nội dung vượt quá giới hạn ${maxLength} ký tự cho kênh ${this.getVietnameseName()}`);
    }

    if (!this.allowsHtml() && /<[^>]*>/g.test(content)) {
      errors.push(`Kênh ${this.getVietnameseName()} không hỗ trợ HTML`);
    }

    // Vietnamese character validation
    if (this.supportsVietnamese()) {
      const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      if (vietnameseRegex.test(content)) {
        // Content has Vietnamese characters, which is good for Vietnamese support
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get Vietnamese name for the channel
   */
  public getVietnameseName(): string {
    const names: Record<ChannelType, string> = {
      EMAIL: 'Email',
      SMS: 'Tin nhắn SMS',
      PUSH: 'Thông báo đẩy',
      IN_APP: 'Thông báo trong ứng dụng',
      VOICE: 'Cuộc gọi thoại'
    };

    return names[this.type];
  }

  /**
   * Get Vietnamese description
   */
  public getVietnameseDescription(): string {
    const descriptions: Record<ChannelType, string> = {
      EMAIL: 'Gửi thông báo qua email với nội dung chi tiết',
      SMS: 'Gửi tin nhắn SMS ngắn gọn và nhanh chóng',
      PUSH: 'Thông báo đẩy trên thiết bị di động',
      IN_APP: 'Hiển thị thông báo trong ứng dụng',
      VOICE: 'Cuộc gọi thoại tự động cho thông báo khẩn cấp'
    };

    return descriptions[this.type];
  }

  /**
   * Check if suitable for urgent healthcare notifications
   */
  public isSuitableForUrgent(): boolean {
    return this.configuration.priority <= 2 && this.configuration.enabled;
  }

  /**
   * Create channel with custom configuration
   */
  public withConfiguration(config: Partial<ChannelConfiguration>): NotificationChannel {
    return new NotificationChannel(
      this.type,
      { ...this.configuration, ...config },
      this.metadata
    );
  }

  /**
   * Equality comparison
   */
  public equals(other: NotificationChannel): boolean {
    if (!other) return false;
    return this.type === other.type;
  }

  /**
   * String representation
   */
  public toString(): string {
    return `${this.type}(priority=${this.configuration.priority}, enabled=${this.configuration.enabled})`;
  }

  /**
   * JSON serialization
   */
  public toJSON(): object {
    return {
      type: this.type,
      configuration: this.configuration,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  public static fromJSON(json: any): NotificationChannel {
    return new NotificationChannel(
      json.type,
      json.configuration,
      json.metadata
    );
  }
}
