/**
 * AlertService - Send alerts for critical events
 *
 * Supports multiple alert channels:
 * - Console (always enabled)
 * - Webhook (optional, configured via ALERT_WEBHOOK_URL)
 * - Email (future: via SendGrid/Resend)
 * - Slack (future: via Slack webhook)
 */
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
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
export declare class AlertService {
    private readonly config;
    constructor(config: AlertServiceConfig);
    /**
     * Send alert to configured channels
     */
    send(alert: Alert): Promise<void>;
    /**
     * Send alert for unroutable message
     */
    sendUnroutableMessageAlert(messageId: string, routingKey: string, exchange: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Send alert for high unroutable message count
     */
    sendHighUnroutableCountAlert(count: number, threshold: number, timeWindow: string): Promise<void>;
    /**
     * Send alert for dead letter save failure
     */
    sendDeadLetterSaveFailureAlert(error: Error, messageId: string): Promise<void>;
    /**
     * Log alert to console
     */
    private logToConsole;
    /**
     * Send alert to webhook
     */
    private sendToWebhook;
    /**
     * Get emoji for severity level
     */
    private getSeverityEmoji;
}
/**
 * Create AlertService from environment variables
 */
export declare function createAlertService(): AlertService;
//# sourceMappingURL=AlertService.d.ts.map