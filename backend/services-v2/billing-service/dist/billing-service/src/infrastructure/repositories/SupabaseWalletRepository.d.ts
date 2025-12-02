import type { OptimizedSupabaseClient } from "../../../../shared/infrastructure/database/optimized-supabase-client";
import { WalletAccount, WalletTransaction } from "../../domain/entities/Wallet";
import { AdjustBalanceOptions, IWalletRepository } from "../../domain/repositories/IWalletRepository";
type Logger = Pick<typeof console, "info" | "error"> & Partial<Pick<typeof console, "warn">>;
export declare class SupabaseWalletRepository implements IWalletRepository {
    private readonly supabase;
    private readonly logger;
    private readonly accountsTable;
    private readonly transactionsTable;
    private readonly patientSchema;
    private readonly patientsTable;
    constructor(supabase: OptimizedSupabaseClient, logger?: Logger);
    getAccount(patientId: string): Promise<WalletAccount | null>;
    getOrCreateAccount(patientId: string, currency?: string): Promise<WalletAccount>;
    getRecentTransactions(patientId: string, limit?: number): Promise<WalletTransaction[]>;
    adjustBalance(options: AdjustBalanceOptions): Promise<WalletTransaction>;
    private findTransactionByReference;
    private mapAccount;
    private mapTransaction;
    private fetchAccountRecord;
    private preparePatientIdentifier;
    private resolvePatientIdentifier;
    private fetchPatientIdByColumn;
    private fetchPatientCode;
    private isUUID;
    private isPatientCode;
    private rekeyAccountIdentifier;
}
export {};
//# sourceMappingURL=SupabaseWalletRepository.d.ts.map