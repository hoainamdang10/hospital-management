"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
class WalletService {
    constructor(walletRepository, logger = console) {
        this.walletRepository = walletRepository;
        this.logger = logger;
    }
    async getWalletSummary(patientId) {
        const account = await this.walletRepository.getOrCreateAccount(patientId);
        const transactions = await this.walletRepository.getRecentTransactions(patientId);
        return {
            account,
            transactions,
        };
    }
    async topUp(patientId, amount, description, referenceId, createdBy, metadata) {
        this.validateAmount(amount);
        return this.walletRepository.adjustBalance({
            patientId,
            amount: Math.abs(amount),
            type: "topup",
            description,
            referenceId,
            createdBy,
            metadata,
        });
    }
    async charge(patientId, amount, description, referenceId, createdBy, metadata) {
        this.validateAmount(amount);
        return this.walletRepository.adjustBalance({
            patientId,
            amount: -Math.abs(amount),
            type: "charge",
            description,
            referenceId,
            createdBy,
            metadata,
        });
    }
    async refund(patientId, amount, description, referenceId, createdBy, metadata) {
        this.validateAmount(amount);
        return this.walletRepository.adjustBalance({
            patientId,
            amount: Math.abs(amount),
            type: "refund",
            description,
            referenceId,
            createdBy,
            metadata,
        });
    }
    validateAmount(amount) {
        if (Number.isNaN(amount) || amount <= 0) {
            throw new Error("Amount must be greater than 0");
        }
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=WalletService.js.map