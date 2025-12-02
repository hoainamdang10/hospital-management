export type WalletStatus = "active" | "frozen";

export interface WalletAccount {
  patientId: string;
  balance: number;
  currency: string;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
}

export type WalletTransactionType =
  | "topup"
  | "charge"
  | "refund"
  | "adjustment";

export interface WalletTransaction {
  id: string;
  patientId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  referenceId?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  createdBy?: string | null;
}
