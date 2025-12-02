import { IWalletRepository } from "../../domain/repositories/IWalletRepository";
import { WalletAccount, WalletTransaction } from "../../domain/entities/Wallet";

type Logger = Pick<typeof console, "info" | "error"> &
  Partial<Pick<typeof console, "warn">>;

export interface WalletSummary {
  account: WalletAccount;
  transactions: WalletTransaction[];
}

export class WalletService {
  constructor(
    private readonly walletRepository: IWalletRepository,
    private readonly logger: Logger = console,
  ) {}

  async getWalletSummary(patientId: string): Promise<WalletSummary> {
    const account = await this.walletRepository.getOrCreateAccount(patientId);
    const transactions =
      await this.walletRepository.getRecentTransactions(patientId);

    return {
      account,
      transactions,
    };
  }

  async topUp(
    patientId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    createdBy?: string,
    metadata?: Record<string, any>,
  ): Promise<WalletTransaction> {
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

  async charge(
    patientId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    createdBy?: string,
    metadata?: Record<string, any>,
  ): Promise<WalletTransaction> {
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

  async refund(
    patientId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    createdBy?: string,
    metadata?: Record<string, any>,
  ): Promise<WalletTransaction> {
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

  private validateAmount(amount: number): void {
    if (Number.isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
  }
}
