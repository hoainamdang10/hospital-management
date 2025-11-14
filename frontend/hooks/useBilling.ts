/**
 * useBilling Hook
 * Fetch billing data for patient
 */

import { useState, useEffect } from 'react';
import { usePatient } from './usePatient';
import { billingService, type Invoice, type BillingSummary } from '@/modules/billing/services/billing.service';

export function useBilling() {
  const { patientId, isLoading: isPatientLoading } = usePatient();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      loadBillingData();
    } else if (!isPatientLoading) {
      setIsLoading(false);
    }
  }, [patientId, isPatientLoading]);

  const loadBillingData = async () => {
    if (!patientId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch summary and invoices in parallel
      const [summaryData, invoicesData] = await Promise.all([
        billingService.getPatientBillingSummary(patientId),
        billingService.getPatientInvoices(patientId),
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

