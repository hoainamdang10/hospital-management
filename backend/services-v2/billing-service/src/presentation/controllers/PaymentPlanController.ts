/**
 * PaymentPlanController - Presentation Layer
 * HTTP request handlers for payment plan endpoints
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */

import { Request, Response } from 'express';
import { CreatePaymentPlanUseCase } from '../../application/use-cases/CreatePaymentPlanUseCase';
import { GetPaymentPlanUseCase } from '../../application/use-cases/GetPaymentPlanUseCase';
import { UpdatePaymentPlanUseCase } from '../../application/use-cases/UpdatePaymentPlanUseCase';
import { GetPatientPaymentPlansUseCase } from '../../application/use-cases/GetPatientPaymentPlansUseCase';
import { RecordInstallmentPaymentUseCase } from '../../application/use-cases/RecordInstallmentPaymentUseCase';
import { logger } from '@shared/infrastructure/logging/logger';

export class PaymentPlanController {
  constructor(
    private readonly createPaymentPlanUseCase: CreatePaymentPlanUseCase,
    private readonly getPaymentPlanUseCase: GetPaymentPlanUseCase,
    private readonly updatePaymentPlanUseCase: UpdatePaymentPlanUseCase,
    private readonly getPatientPaymentPlansUseCase: GetPatientPaymentPlansUseCase,
    private readonly recordInstallmentPaymentUseCase: RecordInstallmentPaymentUseCase
  ) {}

  async createPaymentPlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.createPaymentPlanUseCase.execute({
        ...req.body,
        createdBy: userId,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        message: 'Payment plan created successfully',
        planId: result.planId,
      });
    } catch (error: any) {
      logger.error('Error in createPaymentPlan controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPaymentPlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.getPaymentPlanUseCase.execute({ planId: id });

      if (!result.success) {
        res.status(404).json({ error: result.error });
        return;
      }

      res.status(200).json(result.plan);
    } catch (error: any) {
      logger.error('Error in getPaymentPlan controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePaymentPlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.updatePaymentPlanUseCase.execute({
        planId: id,
        ...req.body,
        updatedBy: userId,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({
        message: 'Payment plan updated successfully',
        planId: result.planId,
      });
    } catch (error: any) {
      logger.error('Error in updatePaymentPlan controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatientPaymentPlans(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const { status, fromDate, toDate, limit, offset } = req.query;

      const result = await this.getPatientPaymentPlansUseCase.execute({
        patientId,
        status: status as any,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({
        plans: result.plans,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error: any) {
      logger.error('Error in getPatientPaymentPlans controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async recordInstallmentPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id, installmentNumber } = req.params;

      const result = await this.recordInstallmentPaymentUseCase.execute({
        planId: id,
        installmentNumber: parseInt(installmentNumber),
        ...req.body,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(200).json({
        message: 'Installment payment recorded successfully',
        planId: result.planId,
        installmentNumber: result.installmentNumber,
        planStatus: result.planStatus,
      });
    } catch (error: any) {
      logger.error('Error in recordInstallmentPayment controller', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

