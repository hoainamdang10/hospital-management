/**
 * useBilling Hook
 * Fetch billing data for patient
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  billingService,
  type Invoice,
  type BillingSummary,
} from '@/modules/billing/services/billing.service';

export function useBilling(providedPatientId?: string | null) {
  const { isLoading: isAuthLoading } = useAuth();
  // Ưu tiên UUID được truyền từ ngoài (patient.id). Chỉ fallback khi thật sự cần.
  const patientIdentifier = providedPatientId ?? null; // Không tự fallback sang PAT-* để tránh gọi sai endpoint
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientIdentifier) {
      loadBillingData();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [patientIdentifier, isAuthLoading]);

  const loadBillingData = async () => {
    if (!patientIdentifier) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch summary and invoices in parallel
      const [summaryData, invoicesData] = await Promise.all([
        billingService.getPatientBillingSummary(patientIdentifier),
        billingService.getPatientInvoices(patientIdentifier),
      ]);

      setSummary(summaryData);
      setInvoices(invoicesData);
    } catch (err: any) {
      console.error('[useBilling] Failed to load billing data:', err);
      setError(err.message || 'Failed to load billing information');
      setSummary(null);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter invoices by status
  const pendingInvoices = invoices.filter(
    (inv) => inv.status === 'pending' || inv.status === 'partially_paid' || inv.status === 'overdue'
  );

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');

  return {
    summary,
    invoices,
    pendingInvoices,
    paidInvoices,
    isLoading,
    error,
    reload: loadBillingData,
  };
}
