import { IWalletRepository } from "../../domain/repositories/IWalletRepository";
import { WalletAccount, WalletTransaction } from "../../domain/entities/Wallet";
type Logger = Pick<typeof console, "info" | "error"> & Partial<Pick<typeof console, "warn">>;
export interface WalletSummary {
    account: WalletAccount;
    transactions: WalletTransaction[];
}
export declare class WalletService {
    private readonly walletRepository;
    private readonly logger;
    constructor(walletRepository: IWalletRepository, logger?: Logger);
    getWalletSummary(patientId: string): Promise<WalletSummary>;
    topUp(patientId: string, amount: number, description?: string, referenceId?: string, createdBy?: string, metadata?: Record<string, any>): Promise<WalletTransaction>;
    charge(patientId: string, amount: number, description?: string, referenceId?: string, createdBy?: string, metadata?: Record<string, any>): Promise<WalletTransaction>;
    refund(patientId: string, amount: number, description?: string, referenceId?: string, createdBy?: string, metadata?: Record<string, any>): Promise<WalletTransaction>;
    private validateAmount;
}
export {};
//# sourceMappingURL=WalletService.d.ts.map