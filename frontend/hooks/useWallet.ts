import { useState, useEffect, useCallback } from 'react';
import {
  walletService,
  type WalletSummary,
  type WalletAccount,
  type WalletTransaction,
} from '@/modules/billing/services/wallet.service';

export function useWallet(patientId?: string | null) {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    if (!patientId) {
      setSummary(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await walletService.getWalletSummary(patientId);
      setSummary(data);
    } catch (err: any) {
      console.error('[useWallet] Failed to load wallet summary:', err);
      setError(err?.message || 'Không thể tải thông tin ví');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      loadWallet();
    } else {
      setSummary(null);
    }
  }, [patientId, loadWallet]);

  return {
    summary,
    account: summary?.account ?? null,
    transactions: summary?.transactions ?? [],
    isLoading,
    error,
    reload: loadWallet,
  } as {
    summary: WalletSummary | null;
    account: WalletAccount | null;
    transactions: WalletTransaction[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
  };
}
