/**
 * DeliveryServiceFactory - Factory for creating configured delivery service
 * Sets up multi-channel delivery with all providers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Factory Pattern
 */
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
export declare class DeliveryServiceFactory {
    /**
     * Create delivery service with all configured providers
     */
    static create(config: DeliveryServiceConfig): IDeliveryService;
    /**
     * Create delivery service from environment variables
     */
    static createFromEnv(): IDeliveryService;
    /**
     * Create mock delivery service for testing
     */
    static createMock(): IDeliveryService;
}
//# sourceMappingURL=DeliveryServiceFactory.d.ts.map