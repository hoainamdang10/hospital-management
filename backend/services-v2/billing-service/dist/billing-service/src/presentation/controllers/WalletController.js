"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
class WalletController {
    constructor(walletService, createWalletTopUpLinkUseCase) {
        this.walletService = walletService;
        this.createWalletTopUpLinkUseCase = createWalletTopUpLinkUseCase;
    }
    async getWallet(req, res) {
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async topUp(req, res) {
        try {
            const { patientId } = req.params;
            const { amount, description, referenceId, metadata, createdBy } = req.body;
            this.validateAmount(amount);
            const transaction = await this.walletService.topUp(patientId, Number(amount), description, referenceId, createdBy, metadata);
            return res.status(201).json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async createTopUpLink(req, res) {
        try {
            const { patientId } = req.params;
            const { amount, description, returnUrl, cancelUrl } = req.body || {};
            if (!patientId) {
                return res
                    .status(400)
                    .json({ success: false, message: "patientId is required" });
            }
            this.validateAmount(amount);
            const authReq = req;
            const createdBy = authReq.authenticatedUser?.userId ||
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
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async charge(req, res) {
        try {
            const { patientId } = req.params;
            const { amount, description, referenceId, metadata, createdBy } = req.body;
            this.validateAmount(amount);
            const transaction = await this.walletService.charge(patientId, Number(amount), description, referenceId, createdBy, metadata);
            return res.status(201).json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    async refund(req, res) {
        try {
            const { patientId } = req.params;
            const { amount, description, referenceId, metadata, createdBy } = req.body;
            this.validateAmount(amount);
            const transaction = await this.walletService.refund(patientId, Number(amount), description, referenceId, createdBy, metadata);
            return res.status(201).json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    validateAmount(amount) {
        if (amount === undefined || amount === null) {
            throw new Error("amount is required");
        }
        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            throw new Error("amount must be greater than 0");
        }
    }
}
exports.WalletController = WalletController;
//# sourceMappingURL=WalletController.js.map