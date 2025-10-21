/**
 * AlertService - Send alerts for critical events
 * 
 * Supports multiple alert channels:
 * - Console (always enabled)
 * - Webhook (optional, configured via ALERT_WEBHOOK_URL)
 * - Email (future: via SendGrid/Resend)
 * - Slack (future: via Slack webhook)
 */

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AlertServiceConfig {
  webhookUrl?: string;
  enabled: boolean;
}

export class AlertService {
  constructor(private readonly config: AlertServiceConfig) {}

  /**
   * Send alert to configured channels
   */
  async send(alert: Alert): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Always log to console
    this.logToConsole(alert);

    // Send to webhook if configured
    if (this.config.webhookUrl) {
      await this.sendToWebhook(alert);
    }

    // Future: Send to email, Slack, etc.
  }

  /**
   * Send alert for unroutable message
   */
  async sendUnroutableMessageAlert(
    messageId: string,
    routingKey: string,
    exchange: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.send({
      severity: AlertSeverity.WARNING,
      title: 'Unroutable Message Detected',
      message: `Message ${messageId} could not be routed. Exchange: ${exchange}, Routing Key: ${routingKey}`,
      metadata: {
        messageId,
        routingKey,
        exchange,
        ...metadata
      },
      timestamp: new Date()
    });
  }

  /**
   * Send alert for high unroutable message count
   */
  async sendHighUnroutableCountAlert(
    count: number,
    threshold: number,
    timeWindow: string
  ): Promise<void> {
    await this.send({
      severity: AlertSeverity.ERROR,
      title: 'High Unroutable Message Count',
      message: `${count} unroutable messages detected in ${timeWindow} (threshold: ${threshold})`,
      metadata: {
        count,
        threshold,
        timeWindow
      },
      timestamp: new Date()
    });
  }

  /**
   * Send alert for dead letter save failure
   */
  async sendDeadLetterSaveFailureAlert(
    error: Error,
    messageId: string
  ): Promise<void> {
    await this.send({
      severity: AlertSeverity.ERROR,
      title: 'Failed to Save Dead Letter',
      message: `Failed to save unroutable message ${messageId} to dead_letters table: ${error.message}`,
      metadata: {
        messageId,
        error: error.message,
        stack: error.stack
      },
      timestamp: new Date()
    });
  }

  /**
   * Log alert to console
   */
  private logToConsole(alert: Alert): void {
    const emoji = this.getSeverityEmoji(alert.severity);
    const timestamp = alert.timestamp.toISOString();
    
    console.error(`${emoji} [ALERT] [${alert.severity.toUpperCase()}] ${timestamp}`);
    console.error(`  Title: ${alert.title}`);
    console.error(`  Message: ${alert.message}`);
    
    if (alert.metadata && Object.keys(alert.metadata).length > 0) {
      console.error(`  Metadata:`, JSON.stringify(alert.metadata, null, 2));
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendToWebhook(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) {
      return;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metadata: alert.metadata,
          timestamp: alert.timestamp.toISOString(),
          service: 'scheduler-service'
        })
      });

      if (!response.ok) {
        console.error(`Failed to send alert to webhook: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send alert to webhook:', error);
      // Don't throw - we don't want to crash the service
    }
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'ℹ️';
      case AlertSeverity.WARNING:
        return '⚠️';
      case AlertSeverity.ERROR:
        return '❌';
      case AlertSeverity.CRITICAL:
        return '🚨';
      default:
        return '📢';
    }
  }
}

/**
 * Create AlertService from environment variables
 */
export function createAlertService(): AlertService {
  return new AlertService({
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    enabled: process.env.ALERT_ENABLED !== 'false' // Enabled by default
  });
}

