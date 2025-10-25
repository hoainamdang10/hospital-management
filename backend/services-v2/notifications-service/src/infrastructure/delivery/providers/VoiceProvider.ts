/**
 * VoiceProvider - Twilio Voice Call Provider
 * Makes voice calls via Twilio for urgent notifications
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Twilio Voice
 */

import { ChannelProvider } from '../MultiChannelDeliveryService';
import { RecipientInfo } from '../../../domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../../domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../../domain/value-objects/NotificationChannel';

interface TwilioVoiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  twimlUrl?: string; // URL for TwiML instructions
}

export class VoiceProvider implements ChannelProvider {
  private isConfigured: boolean = false;

  constructor(private readonly config: TwilioVoiceConfig) {
    this.isConfigured = !!config.accountSid && !!config.authToken;
  }

  getType(): string {
    return 'VOICE';
  }

  async isAvailable(): Promise<boolean> {
    return this.isConfigured;
  }

  async deliver(request: {
    recipient: RecipientInfo;
    content: NotificationContent;
    channel: NotificationChannel;
    metadata?: any;
  }): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    messageId?: string;
    deliveredAt?: Date;
    failureReason?: string;
    providerResponse?: any;
  }> {
    try {
      const contactInfo = request.recipient.getContactInfo();
      const phoneNumber = contactInfo.phoneNumber;

      if (!phoneNumber) {
        return {
          status: 'FAILED',
          failureReason: 'Recipient has no phone number for voice call'
        };
      }

      // Convert text to Vietnamese speech
      const voiceMessage = this.convertToVoiceMessage(request.content.getBody());

      const messageId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[VoiceProvider] Making voice call to ${phoneNumber}`);

      // Mock Twilio Voice API call
      const twilioResponse = await this.makeVoiceCall({
        to: phoneNumber,
        from: this.config.fromNumber,
        twiml: this.generateTwiML(voiceMessage)
      });

      return {
        status: 'SENT',
        messageId,
        providerResponse: twilioResponse
      };

    } catch (error) {
      return {
        status: 'FAILED',
        failureReason: error instanceof Error ? error.message : 'Voice call failed',
        providerResponse: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getDeliveryStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: Date;
    failureReason?: string;
  }> {
    console.log(`[VoiceProvider] Checking call status for ${messageId}`);
    
    return {
      status: 'DELIVERED',
      deliveredAt: new Date()
    };
  }

  /**
   * Make voice call via Twilio (mock)
   */
  private async makeVoiceCall(callData: any): Promise<any> {
    // In production:
    // const twilio = require('twilio');
    // const client = twilio(this.config.accountSid, this.config.authToken);
    // const call = await client.calls.create(callData);
    // return call;

    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      sid: `CA${Math.random().toString(36).substr(2, 32)}`,
      status: 'queued',
      to: callData.to,
      from: callData.from,
      dateCreated: new Date()
    };
  }

  /**
   * Generate TwiML for voice message
   */
  private generateTwiML(message: string): string {
    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Linh" language="vi-VN">
          ${this.escapeXml(message)}
        </Say>
        <Pause length="1"/>
        <Say voice="Polly.Linh" language="vi-VN">
          Cảm ơn quý khách. Xin chào tạm biệt.
        </Say>
      </Response>
    `;
  }

  /**
   * Convert text notification to voice-friendly format
   */
  private convertToVoiceMessage(text: string): string {
    // Simplify for voice delivery
    let voiceText = text
      .replace(/\n+/g, '. ') // Replace newlines with pauses
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\w\s.,!?áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/gi, '') // Keep Vietnamese chars
      .trim();

    // Limit to ~300 characters for voice (about 30 seconds)
    if (voiceText.length > 300) {
      voiceText = voiceText.substring(0, 297) + '...';
    }

    return voiceText;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Validate phone number format
   */
  private isValidVietnamesePhone(phone: string): boolean {
    const vietnamesePhoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return vietnamesePhoneRegex.test(cleanPhone);
  }
}

