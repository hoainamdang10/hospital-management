import apiClient from '@/lib/api/axios';

export type WalletTransactionType = 'topup' | 'charge' | 'refund' | 'adjustment';

export interface WalletAccount {
  patientId: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen';
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface WalletTransaction {
  id: string;
  patientId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  referenceId?: string | null;
  description?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string | null;
}

export interface WalletSummary {
  account: WalletAccount | null;
  transactions: WalletTransaction[];
}

export interface WalletTopUpLink {
  invoiceId: string;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  orderCode: number;
  amount: number;
}

class WalletService {
  private baseUrl = '/v1/billing/wallet';

  async getWalletSummary(patientId: string): Promise<WalletSummary> {
    const response = await apiClient.get(`${this.baseUrl}/${patientId}`);
    return this.normalizeSummary(response.data);
  }

  async createTopUpLink(
    patientId: string,
    payload: { amount: number; description?: string; returnUrl?: string; cancelUrl?: string }
  ): Promise<WalletTopUpLink> {
    const response = await apiClient.post(
      `${this.baseUrl}/${patientId}/top-up/link`,
      payload
    );
    const data = response.data?.data ?? response.data;
    return {
      invoiceId: data.invoiceId,
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      paymentLinkId: data.paymentLinkId,
      orderCode: data.orderCode,
      amount: data.amount,
    };
  }

  async topUp(
    patientId: string,
    payload: { amount: number; description?: string; referenceId?: string }
  ): Promise<WalletTransaction> {
    const response = await apiClient.post(`${this.baseUrl}/${patientId}/top-up`, payload);
    const data = response.data?.data ?? response.data;
    return this.normalizeTransaction(data);
  }

  private normalizeSummary(raw: any): WalletSummary {
    const payload = raw?.data ?? raw;
    const account = payload?.account ? this.normalizeAccount(payload.account) : null;
    const transactions = Array.isArray(payload?.transactions)
      ? payload.transactions.map((tx: any) => this.normalizeTransaction(tx))
      : [];
    return {
      account,
      transactions,
    };
  }

  private normalizeAccount(record: any): WalletAccount {
    const createdAt =
      record?.createdAt || record?.created_at || record?.updatedAt || record?.updated_at;
    const updatedAt = record?.updatedAt || record?.updated_at || createdAt;

    return {
      patientId: record?.patientId || record?.patient_id || '',
      balance: Number(record?.balance ?? 0),
      currency: record?.currency || 'VND',
      status: (record?.status || 'active').toLowerCase() === 'frozen' ? 'frozen' : 'active',
      createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString(),
      updatedBy: record?.updatedBy || record?.updated_by || null,
    };
  }

  private normalizeTransaction(record: any): WalletTransaction {
    const createdAt = record?.createdAt || record?.created_at || new Date().toISOString();

    return {
      id: record?.id || record?.transaction_id || `tx-${Date.now()}`,
      patientId: record?.patientId || record?.patient_id || '',
      type: (record?.transaction_type || record?.type || 'topup') as WalletTransactionType,
      amount: Number(record?.amount ?? 0),
      balanceAfter: Number(record?.balance_after ?? record?.balanceAfter ?? 0),
      referenceId: record?.referenceId ?? record?.reference_id ?? null,
      description: record?.description ?? null,
      metadata: record?.metadata ?? {},
      createdAt: new Date(createdAt).toISOString(),
      createdBy: record?.createdBy ?? record?.created_by ?? null,
    };
  }
}

export const walletService = new WalletService();
