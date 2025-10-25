/**
 * DeliveryServiceFactory - Factory for creating configured delivery service
 * Sets up multi-channel delivery with all providers
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Factory Pattern
 */

import { MultiChannelDeliveryService } from './MultiChannelDeliveryService';
import { EmailProvider } from './providers/EmailProvider';
import { SMSProvider } from './providers/SMSProvider';
import { PushProvider } from './providers/PushProvider';
import { VoiceProvider } from './providers/VoiceProvider';
import { InAppProvider } from './providers/InAppProvider';
import { IDeliveryService } from '../../domain/services/IDeliveryService';

export interface DeliveryServiceConfig {
  email?: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  sms?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  push?: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
  voice?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  socketServer?: any;
}

export class DeliveryServiceFactory {
  /**
   * Create delivery service with all configured providers
   */
  public static create(config: DeliveryServiceConfig): IDeliveryService {
    const providers: any[] = [];

    // Email provider (SendGrid)
    if (config.email) {
      const emailProvider = new EmailProvider({
        apiKey: config.email.apiKey,
        fromEmail: config.email.fromEmail,
        fromName: config.email.fromName
      });
      providers.push(emailProvider);
    }

    // SMS provider (Twilio)
    if (config.sms) {
      const smsProvider = new SMSProvider({
        accountSid: config.sms.accountSid,
        authToken: config.sms.authToken,
        fromNumber: config.sms.fromNumber
      });
      providers.push(smsProvider);
    }

    // Push provider (Firebase)
    if (config.push) {
      const pushProvider = new PushProvider({
        projectId: config.push.projectId,
        privateKey: config.push.privateKey,
        clientEmail: config.push.clientEmail
      });
      providers.push(pushProvider);
    }

    // Voice provider (Twilio)
    if (config.voice) {
      const voiceProvider = new VoiceProvider({
        accountSid: config.voice.accountSid,
        authToken: config.voice.authToken,
        fromNumber: config.voice.fromNumber
      });
      providers.push(voiceProvider);
    }

    // In-app provider (Socket.IO)
    const inAppProvider = new InAppProvider(config.socketServer);
    providers.push(inAppProvider);

    // Create multi-channel delivery service
    const deliveryService = new MultiChannelDeliveryService(providers);

    return deliveryService;
  }

  /**
   * Create delivery service from environment variables
   */
  public static createFromEnv(): IDeliveryService {
    const config: DeliveryServiceConfig = {};

    // Email configuration
    if (process.env.SENDGRID_API_KEY) {
      config.email = {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.EMAIL_FROM || 'noreply@hospital.vn',
        fromName: process.env.EMAIL_FROM_NAME || 'Bệnh viện Đa khoa'
      };
    }

    // SMS configuration
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      config.sms = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER || '+84123456789'
      };

      // Voice uses same Twilio credentials
      config.voice = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_VOICE_NUMBER || process.env.TWILIO_FROM_NUMBER || '+84123456789'
      };
    }

    // Push configuration
    if (process.env.FIREBASE_PROJECT_ID) {
      config.push = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || ''
      };
    }

    return this.create(config);
  }

  /**
   * Create mock delivery service for testing
   */
  public static createMock(): IDeliveryService {
    const config: DeliveryServiceConfig = {
      email: {
        apiKey: 'mock-api-key',
        fromEmail: 'test@hospital.vn',
        fromName: 'Test Hospital'
      },
      sms: {
        accountSid: 'mock-sid',
        authToken: 'mock-token',
        fromNumber: '+84123456789'
      },
      push: {
        projectId: 'mock-project',
        privateKey: 'mock-key',
        clientEmail: 'mock@hospital.vn'
      },
      voice: {
        accountSid: 'mock-sid',
        authToken: 'mock-token',
        fromNumber: '+84123456789'
      }
    };

    return this.create(config);
  }
}

