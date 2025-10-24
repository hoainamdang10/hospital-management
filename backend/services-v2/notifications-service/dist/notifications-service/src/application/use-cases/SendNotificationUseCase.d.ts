/**
 * SendNotificationUseCase - Simplified for Scheduler Integration
 * Nhận command từ Scheduler Service và gửi notification ngay lập tức
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */
import { INotificationRepository } from "../../domain/repositories/INotificationRepository";
import { ITemplateService } from "../../domain/services/ITemplateService";
import { IDeliveryService, DeliveryResult } from "../../domain/services/IDeliveryService";
export interface SendNotificationCommand {
    recipientId: string;
    recipientType: "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN";
    templateType: string;
    templateData: Record<string, any>;
    channels: string[];
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    metadata?: {
        correlationId?: string;
        userId?: string;
        sessionId?: string;
        source?: string;
        healthcareContext?: {
            patientId?: string;
            doctorId?: string;
            appointmentId?: string;
            medicalRecordId?: string;
        };
    };
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
    execute(command: SendNotificationCommand): Promise<SendNotificationResult>;
    private getRecipientInfo;
    private determineChannels;
}
//# sourceMappingURL=SendNotificationUseCase.d.ts.map