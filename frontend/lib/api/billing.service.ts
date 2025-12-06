import {
  billingService as sharedBillingService,
  Invoice as SharedInvoice,
  InvoiceItem as SharedInvoiceItem,
  RevenueReportParams,
  SearchInvoicesParams,
} from '@/modules/billing/services/billing.service';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
  dueDate: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const mapInvoiceItem = (item: SharedInvoiceItem): InvoiceItem => ({
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  totalPrice: item.totalPrice,
});

const toAdminInvoice = (invoice: SharedInvoice): Invoice => {
  const legacyFields = invoice as Record<string, any>;
  const metadata =
    (legacyFields.metadata as Record<string, any>) ||
    (invoice as any).metadata ||
    legacyFields.meta ||
    {};
  const metadataPatientName =
    metadata?.patientName ||
    metadata?.patient_name ||
    metadata?.patientFullName ||
    metadata?.patient_full_name ||
    metadata?.patientDisplayName ||
    metadata?.patient_display_name ||
    metadata?.patient?.fullName ||
    metadata?.patient?.name ||
    metadata?.patientInfo?.fullName ||
    metadata?.patient_info?.fullName ||
    metadata?.patientInfo?.name ||
    metadata?.patient_info?.name;
  return {
    id: invoice.id,
    invoiceNumber:
      invoice.invoiceNumber ||
      invoice.invoiceCode ||
      legacyFields.invoiceId ||
      legacyFields.invoice_id ||
      invoice.id,
    patientId: invoice.patientId || legacyFields.patient_id || '',
    patientName: invoice.patientName || legacyFields.patient_name || metadataPatientName || '',
    appointmentId: invoice.appointmentId || legacyFields.appointment_id || '',
    amount:
      invoice.totalAmount ??
      invoice.outstandingAmount ??
      invoice.subtotal ??
      invoice.paidAmount ??
      legacyFields.amount ??
      0,
    status:
      ((invoice.status || legacyFields.status || 'pending').toUpperCase() as Invoice['status']) ||
      'PENDING',
    dueDate: invoice.dueDate || invoice.issueDate || legacyFields.due_date || invoice.createdAt,
    createdAt: invoice.createdAt,
    items: (invoice.items || []).map(mapInvoiceItem),
  };
};

export const billingService = {
  async searchInvoices(params: SearchInvoicesParams) {
    const invoices = await sharedBillingService.searchInvoices(params);
    return {
      success: true,
      data: invoices.map(toAdminInvoice),
    };
  },

  async getInvoice(id: string) {
    const invoice = await sharedBillingService.getInvoiceById(id);
    return {
      success: true,
      data: toAdminInvoice(invoice),
    };
  },

  async getRevenueReport(params: RevenueReportParams) {
    const report = await sharedBillingService.getRevenueReport(params);
    return {
      success: true,
      data: report,
    };
  },

  async createPaymentLink(id: string, returnUrl: string, cancelUrl: string) {
    return sharedBillingService.createPayOSPaymentLink(id, {
      buyerName: 'Admin Portal',
      buyerEmail: '',
      buyerPhone: '',
    });
  },
};

export type { RevenueReportParams, SearchInvoicesParams };
