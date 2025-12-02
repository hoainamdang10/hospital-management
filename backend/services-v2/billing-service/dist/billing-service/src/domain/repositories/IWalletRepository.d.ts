import { WalletAccount, WalletTransaction, WalletTransactionType } from "../entities/Wallet";
export interface AdjustBalanceOptions {
    patientId: string;
    amount: number;
    type: WalletTransactionType;
    referenceId?: string;
    description?: string;
    metadata?: Record<string, any>;
    createdBy?: string;
    currency?: string;
}
export interface IWalletRepository {
    getAccount(patientId: string): Promise<WalletAccount | null>;
    getOrCreateAccount(patientId: string, currency?: string): Promise<WalletAccount>;
    getRecentTransactions(patientId: string, limit?: number): Promise<WalletTransaction[]>;
    adjustBalance(options: AdjustBalanceOptions): Promise<WalletTransaction>;
}
//# sourceMappingURL=IWalletRepository.d.ts.map