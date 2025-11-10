import { Invoice } from '../aggregates/Invoice';

export interface SearchCriteria {
  patientId?: string;
  status?: string;
  fromDate?: Date | string;
  toDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  invoiceNumber?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  averageInvoiceAmount: number;
  byPaymentMethod: { [method: string]: number };
  byInsuranceType: { [type: string]: number };
}

export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>;
  findById(id: string): Promise<Invoice | null>;
  findByPatientId(patientId: string): Promise<Invoice[]>;
  findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
  findOverdueInvoices(daysOverdue?: number): Promise<Invoice[]>;
  search(criteria: SearchCriteria): Promise<Invoice[]>;
  getRevenueSummary(fromDate: Date, toDate: Date): Promise<RevenueSummary>;
  delete(id: string): Promise<void>;
}
