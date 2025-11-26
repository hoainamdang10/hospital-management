import { Request, Response } from 'express';
import { GetNotificationsByRecipientUseCase } from '../../application/use-cases/GetNotificationsByRecipientUseCase';

export class NotificationController {
    constructor(
        private readonly getNotificationsByRecipientUseCase: GetNotificationsByRecipientUseCase
    ) { }

    public getPatientNotifications = async (req: Request, res: Response): Promise<void> => {
        try {
            const { patientId } = req.params;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

            const result = await this.getNotificationsByRecipientUseCase.execute({
                recipientId: patientId,
                limit,
                offset
            });

            res.json({
                success: true,
                data: {
                    notifications: result.notifications,
                    pagination: {
                        total: result.total,
                        page: Math.floor(offset / limit) + 1,
                        limit: result.pagination.limit,
                        totalPages: Math.ceil(result.total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Error getting patient notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
