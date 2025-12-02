/**
 * SendNotificationUseCase - Simplified for Event Consumer Integration
 * Nhận command từ Event Consumers và gửi notification ngay lập tức
 *
 * @author Hospital Management Team
 * @version 2.0.0-simplified
 * @compliance Clean Architecture, DDD, Event Consumer Integration
 */
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { ITemplateService } from "../../domain/services/ITemplateService";
import { IDeliveryService, DeliveryResult } from "../../domain/services/IDeliveryService";
export interface SendNotificationCommand {
    recipientId: string;
    recipientType: "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN" | "STAFF" | "DEPARTMENT" | string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    type?: string;
    title?: string;
    content?: string;
    templateType?: string;
    templateData?: Record<string, any>;
    data?: Record<string, any>;
    channels: string[];
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
    scheduledAt?: Date;
    metadata?: Record<string, any>;
}
export interface SendNotificationResult {
    notificationId: string;
    status: "SENT" | "FAILED";
    deliveryResults: DeliveryResult[];
    sentAt?: Date;
    message: string;
}
export declare class SendNotificationUseCase {
    private readonly notificationRepository;
    private readonly templateService;
    private readonly deliveryService;
    constructor(notificationRepository: INotificationRepository, templateService: ITemplateService, deliveryService: IDeliveryService);
    execute(command: SendNotificationCommand): Promise<DeliveryResult[]>;
    catch(error: any): void;
    private determineChannels;
}
//# sourceMappingURL=SendNotificationUseCase.d.ts.map