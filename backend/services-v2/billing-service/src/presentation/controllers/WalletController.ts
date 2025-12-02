import { Request, Response } from "express";
import { WalletService } from "../../application/services/WalletService";
import { CreateWalletTopUpLinkUseCase } from "../../application/use-cases/CreateWalletTopUpLinkUseCase";
import { AuthenticatedRequest } from "../middleware/AuthenticationMiddleware";

export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly createWalletTopUpLinkUseCase: CreateWalletTopUpLinkUseCase,
  ) {}

  async getWallet(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      if (!patientId) {
        return res
          .status(400)
          .json({ success: false, message: "patientId is required" });
      }

      const summary = await this.walletService.getWalletSummary(patientId);
      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async topUp(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const { amount, description, referenceId, metadata, createdBy } =
        req.body;

      this.validateAmount(amount);

      const transaction = await this.walletService.topUp(
        patientId,
        Number(amount),
        description,
        referenceId,
        createdBy,
        metadata,
      );

      return res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createTopUpLink(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const { amount, description, returnUrl, cancelUrl } = req.body || {};

      if (!patientId) {
        return res
          .status(400)
          .json({ success: false, message: "patientId is required" });
      }

      this.validateAmount(amount);

      const authReq = req as AuthenticatedRequest;
      const createdBy =
        authReq.authenticatedUser?.userId ||
        authReq.body?.createdBy ||
        req.body?.createdBy ||
        "system";

      const result = await this.createWalletTopUpLinkUseCase.execute({
        patientId,
        amount: Number(amount),
        description,
        createdBy,
        returnUrl,
        cancelUrl,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async charge(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const { amount, description, referenceId, metadata, createdBy } =
        req.body;

      this.validateAmount(amount);

      const transaction = await this.walletService.charge(
        patientId,
        Number(amount),
        description,
        referenceId,
        createdBy,
        metadata,
      );

      return res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async refund(req: Request, res: Response): Promise<Response> {
    try {
      const { patientId } = req.params;
      const { amount, description, referenceId, metadata, createdBy } =
        req.body;

      this.validateAmount(amount);

      const transaction = await this.walletService.refund(
        patientId,
        Number(amount),
        description,
        referenceId,
        createdBy,
        metadata,
      );

      return res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private validateAmount(amount: any): void {
    if (amount === undefined || amount === null) {
      throw new Error("amount is required");
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("amount must be greater than 0");
    }
  }
}
