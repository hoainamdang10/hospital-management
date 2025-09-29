/**
 * BillingAggregate - Domain Layer
 * Core aggregate for billing and invoice management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Billing Standards
 */

import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { Insurance, InsuranceType } from '../value-objects/Insurance';

// Domain Events
import { InvoiceCreatedEvent } from '../events/InvoiceCreatedEvent';
import { InvoiceUpdatedEvent } from '../events/InvoiceUpdatedEvent';
import { PaymentProcessedEvent } from '../events/PaymentProcessedEvent';
import { InsuranceClaimSubmittedEvent } from '../events/InsuranceClaimSubmittedEvent';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYOS = 'payos',
  INSURANCE_DIRECT = 'insurance_direct'
}

export interface BillingItem {
  id: string;
  description: string;
  vietnameseDescription: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
  taxable: boolean;
  insuranceCoverable: boolean;
  medicalRecordId?: string;
  serviceCode?: string;
}

export interface PaymentRecord {
  id: string;
  amount: Money;
  method: PaymentMethod;
  transactionId?: string;
  processedAt: Date;
  processedBy: string;
  notes?: string;
  payosData?: any;
}

export interface InsuranceClaim {
  id: string;
  insurance: Insurance;
  claimAmount: Money;
  approvedAmount?: Money;
  status: 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';
  submittedAt: Date;
  processedAt?: Date;
  rejectionReason?: string;
  claimNumber?: string;
}

/**
 * BillingAggregate
 * Manages invoices, payments, and insurance claims
 */
export class BillingAggregate extends AggregateRoot<InvoiceId> {
  private _patientId: string;
  private _medicalRecordId: string;
  private _doctorId: string;
  private _appointmentId: string;
  private _status: InvoiceStatus;
  private _items: BillingItem[];
  private _subtotal: Money;
  private _taxAmount: Money;
  private _totalAmount: Money;
  private _insurance?: Insurance;
  private _insuranceCoverage: Money;
  private _patientPayment: Money;
  private _payments: PaymentRecord[];
  private _insuranceClaims: InsuranceClaim[];
  private _dueDate: Date;
  private _issuedAt: Date;
  private _issuedBy: string;
  private _notes?: string;
  private _vietnameseInvoiceNumber?: string;

  private constructor(
    id: InvoiceId,
    patientId: string,
    medicalRecordId: string,
    doctorId: string,
    appointmentId: string,
    issuedBy: string
  ) {
    super(id);
    this._patientId = patientId;
    this._medicalRecordId = medicalRecordId;
    this._doctorId = doctorId;
    this._appointmentId = appointmentId;
    this._status = InvoiceStatus.DRAFT;
    this._items = [];
    this._subtotal = Money.zero();
    this._taxAmount = Money.zero();
    this._totalAmount = Money.zero();
    this._insuranceCoverage = Money.zero();
    this._patientPayment = Money.zero();
    this._payments = [];
    this._insuranceClaims = [];
    this._issuedAt = new Date();
    this._issuedBy = issuedBy;
    this._dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  }

  /**
   * Create new billing aggregate
   */
  static create(
    patientId: string,
    medicalRecordId: string,
    doctorId: string,
    appointmentId: string,
    issuedBy: string
  ): BillingAggregate {
    const id = InvoiceId.generate();
    const billing = new BillingAggregate(id, patientId, medicalRecordId, doctorId, appointmentId, issuedBy);

    // Raise domain event
    billing.addDomainEvent(new InvoiceCreatedEvent(
      id.value,
      patientId,
      medicalRecordId,
      doctorId,
      appointmentId,
      issuedBy,
      new Date()
    ));

    return billing;
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(
    id: InvoiceId,
    patientId: string,
    medicalRecordId: string,
    doctorId: string,
    appointmentId: string,
    status: InvoiceStatus,
    items: BillingItem[],
    subtotal: Money,
    taxAmount: Money,
    totalAmount: Money,
    insurance: Insurance | undefined,
    insuranceCoverage: Money,
    patientPayment: Money,
    payments: PaymentRecord[],
    insuranceClaims: InsuranceClaim[],
    dueDate: Date,
    issuedAt: Date,
    issuedBy: string,
    notes?: string,
    vietnameseInvoiceNumber?: string
  ): BillingAggregate {
    const billing = new BillingAggregate(id, patientId, medicalRecordId, doctorId, appointmentId, issuedBy);
    
    billing._status = status;
    billing._items = items;
    billing._subtotal = subtotal;
    billing._taxAmount = taxAmount;
    billing._totalAmount = totalAmount;
    billing._insurance = insurance;
    billing._insuranceCoverage = insuranceCoverage;
    billing._patientPayment = patientPayment;
    billing._payments = payments;
    billing._insuranceClaims = insuranceClaims;
    billing._dueDate = dueDate;
    billing._issuedAt = issuedAt;
    billing._notes = notes;
    billing._vietnameseInvoiceNumber = vietnameseInvoiceNumber;

    return billing;
  }

  // Getters
  get patientId(): string { return this._patientId; }
  get medicalRecordId(): string { return this._medicalRecordId; }
  get doctorId(): string { return this._doctorId; }
  get appointmentId(): string { return this._appointmentId; }
  get status(): InvoiceStatus { return this._status; }
  get items(): BillingItem[] { return [...this._items]; }
  get subtotal(): Money { return this._subtotal; }
  get taxAmount(): Money { return this._taxAmount; }
  get totalAmount(): Money { return this._totalAmount; }
  get insurance(): Insurance | undefined { return this._insurance; }
  get insuranceCoverage(): Money { return this._insuranceCoverage; }
  get patientPayment(): Money { return this._patientPayment; }
  get payments(): PaymentRecord[] { return [...this._payments]; }
  get insuranceClaims(): InsuranceClaim[] { return [...this._insuranceClaims]; }
  get dueDate(): Date { return this._dueDate; }
  get issuedAt(): Date { return this._issuedAt; }
  get issuedBy(): string { return this._issuedBy; }
  get notes(): string | undefined { return this._notes; }
  get vietnameseInvoiceNumber(): string | undefined { return this._vietnameseInvoiceNumber; }

  /**
   * Add billing item
   */
  addItem(item: BillingItem): void {
    if (this._status !== InvoiceStatus.DRAFT) {
      throw new Error('Không thể thêm item vào hóa đơn đã hoàn thành');
    }

    // Validate item
    if (item.quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    if (item.unitPrice.amount <= 0) {
      throw new Error('Đơn giá phải lớn hơn 0');
    }

    // Calculate total price
    const totalPrice = item.unitPrice.multiply(item.quantity);
    const updatedItem: BillingItem = {
      ...item,
      totalPrice
    };

    this._items.push(updatedItem);
    this.recalculateAmounts();

    this.addDomainEvent(new InvoiceUpdatedEvent(
      this.id.value,
      this._patientId,
      'item_added',
      { itemId: item.id, description: item.description },
      this._issuedBy,
      new Date()
    ));
  }

  /**
   * Remove billing item
   */
  removeItem(itemId: string): void {
    if (this._status !== InvoiceStatus.DRAFT) {
      throw new Error('Không thể xóa item khỏi hóa đơn đã hoàn thành');
    }

    const itemIndex = this._items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Không tìm thấy item');
    }

    const removedItem = this._items[itemIndex];
    this._items.splice(itemIndex, 1);
    this.recalculateAmounts();

    this.addDomainEvent(new InvoiceUpdatedEvent(
      this.id.value,
      this._patientId,
      'item_removed',
      { itemId, description: removedItem.description },
      this._issuedBy,
      new Date()
    ));
  }

  /**
   * Set insurance
   */
  setInsurance(insurance: Insurance): void {
    if (this._status === InvoiceStatus.PAID || this._status === InvoiceStatus.CANCELLED) {
      throw new Error('Không thể thay đổi bảo hiểm cho hóa đơn đã thanh toán hoặc đã hủy');
    }

    this._insurance = insurance;
    this.recalculateAmounts();

    this.addDomainEvent(new InvoiceUpdatedEvent(
      this.id.value,
      this._patientId,
      'insurance_updated',
      { 
        insuranceType: insurance.type,
        insuranceNumber: insurance.number,
        coverageLevel: insurance.coverageLevel
      },
      this._issuedBy,
      new Date()
    ));
  }

  /**
   * Finalize invoice (change from draft to pending)
   */
  finalize(): void {
    if (this._status !== InvoiceStatus.DRAFT) {
      throw new Error('Chỉ có thể hoàn thành hóa đơn ở trạng thái draft');
    }

    if (this._items.length === 0) {
      throw new Error('Hóa đơn phải có ít nhất 1 item');
    }

    this._status = InvoiceStatus.PENDING;
    this._vietnameseInvoiceNumber = this.generateVietnameseInvoiceNumber();

    this.addDomainEvent(new InvoiceUpdatedEvent(
      this.id.value,
      this._patientId,
      'finalized',
      { vietnameseInvoiceNumber: this._vietnameseInvoiceNumber },
      this._issuedBy,
      new Date()
    ));
  }

  /**
   * Process payment
   */
  processPayment(
    amount: Money,
    method: PaymentMethod,
    processedBy: string,
    transactionId?: string,
    notes?: string,
    payosData?: any
  ): void {
    if (this._status === InvoiceStatus.CANCELLED || this._status === InvoiceStatus.REFUNDED) {
      throw new Error('Không thể thanh toán cho hóa đơn đã hủy hoặc đã hoàn tiền');
    }

    if (amount.amount <= 0) {
      throw new Error('Số tiền thanh toán phải lớn hơn 0');
    }

    const totalPaid = this.getTotalPaidAmount();
    const remainingAmount = this._patientPayment.subtract(totalPaid);

    if (amount.greaterThan(remainingAmount)) {
      throw new Error('Số tiền thanh toán vượt quá số tiền còn lại');
    }

    const payment: PaymentRecord = {
      id: this.generatePaymentId(),
      amount,
      method,
      transactionId,
      processedAt: new Date(),
      processedBy,
      notes,
      payosData
    };

    this._payments.push(payment);
    this.updatePaymentStatus();

    this.addDomainEvent(new PaymentProcessedEvent(
      this.id.value,
      this._patientId,
      payment.id,
      amount.amount,
      amount.currency,
      method,
      transactionId,
      processedBy,
      new Date()
    ));
  }

  /**
   * Submit insurance claim
   */
  submitInsuranceClaim(): void {
    if (!this._insurance) {
      throw new Error('Không có thông tin bảo hiểm');
    }

    if (!this._insurance.isValid()) {
      throw new Error('Bảo hiểm đã hết hạn');
    }

    if (this._insuranceCoverage.isZero()) {
      throw new Error('Không có số tiền bảo hiểm để claim');
    }

    const existingClaim = this._insuranceClaims.find(claim => 
      claim.status === 'submitted' || claim.status === 'processing'
    );

    if (existingClaim) {
      throw new Error('Đã có claim đang xử lý');
    }

    const claim: InsuranceClaim = {
      id: this.generateClaimId(),
      insurance: this._insurance,
      claimAmount: this._insuranceCoverage,
      status: 'submitted',
      submittedAt: new Date(),
      claimNumber: this.generateClaimNumber()
    };

    this._insuranceClaims.push(claim);

    this.addDomainEvent(new InsuranceClaimSubmittedEvent(
      this.id.value,
      this._patientId,
      claim.id,
      this._insurance.type,
      this._insurance.number,
      this._insuranceCoverage.amount,
      this._insuranceCoverage.currency,
      claim.claimNumber!,
      new Date()
    ));
  }

  /**
   * Cancel invoice
   */
  cancel(reason: string, cancelledBy: string): void {
    if (this._status === InvoiceStatus.PAID) {
      throw new Error('Không thể hủy hóa đơn đã thanh toán');
    }

    if (this._status === InvoiceStatus.CANCELLED) {
      throw new Error('Hóa đơn đã được hủy');
    }

    this._status = InvoiceStatus.CANCELLED;
    this._notes = `Hủy: ${reason}`;

    this.addDomainEvent(new InvoiceUpdatedEvent(
      this.id.value,
      this._patientId,
      'cancelled',
      { reason, cancelledBy },
      cancelledBy,
      new Date()
    ));
  }

  /**
   * Check if overdue
   */
  isOverdue(): boolean {
    return new Date() > this._dueDate && 
           this._status !== InvoiceStatus.PAID && 
           this._status !== InvoiceStatus.CANCELLED;
  }

  /**
   * Get total paid amount
   */
  getTotalPaidAmount(): Money {
    return this._payments.reduce(
      (total, payment) => total.add(payment.amount),
      Money.zero(this._totalAmount.currency)
    );
  }

  /**
   * Get remaining amount to pay
   */
  getRemainingAmount(): Money {
    const totalPaid = this.getTotalPaidAmount();
    return this._patientPayment.subtract(totalPaid);
  }

  /**
   * Check if fully paid
   */
  isFullyPaid(): boolean {
    return this.getRemainingAmount().isZero();
  }

  /**
   * Get Vietnamese status display
   */
  getVietnameseStatusDisplay(): string {
    switch (this._status) {
      case InvoiceStatus.DRAFT: return 'Bản nháp';
      case InvoiceStatus.PENDING: return 'Chờ thanh toán';
      case InvoiceStatus.PAID: return 'Đã thanh toán';
      case InvoiceStatus.PARTIALLY_PAID: return 'Thanh toán một phần';
      case InvoiceStatus.OVERDUE: return 'Quá hạn';
      case InvoiceStatus.CANCELLED: return 'Đã hủy';
      case InvoiceStatus.REFUNDED: return 'Đã hoàn tiền';
      default: return 'Không xác định';
    }
  }

  /**
   * Recalculate amounts
   */
  private recalculateAmounts(): void {
    // Calculate subtotal
    this._subtotal = this._items.reduce(
      (total, item) => total.add(item.totalPrice),
      Money.zero()
    );

    // Calculate tax (VAT 10% for taxable items)
    const taxableAmount = this._items
      .filter(item => item.taxable)
      .reduce((total, item) => total.add(item.totalPrice), Money.zero());
    
    this._taxAmount = taxableAmount.percentage(10);

    // Calculate total
    this._totalAmount = this._subtotal.add(this._taxAmount);

    // Calculate insurance coverage
    if (this._insurance) {
      const coverableAmount = this._items
        .filter(item => item.insuranceCoverable)
        .reduce((total, item) => total.add(item.totalPrice), Money.zero());
      
      this._insuranceCoverage = this._insurance.calculateCoverage(coverableAmount);
    } else {
      this._insuranceCoverage = Money.zero();
    }

    // Calculate patient payment
    this._patientPayment = this._totalAmount.subtract(this._insuranceCoverage);
  }

  /**
   * Update payment status based on payments
   */
  private updatePaymentStatus(): void {
    const totalPaid = this.getTotalPaidAmount();
    
    if (totalPaid.isZero()) {
      this._status = InvoiceStatus.PENDING;
    } else if (totalPaid.greaterThanOrEqual(this._patientPayment)) {
      this._status = InvoiceStatus.PAID;
    } else {
      this._status = InvoiceStatus.PARTIALLY_PAID;
    }

    // Check if overdue
    if (this.isOverdue() && this._status !== InvoiceStatus.PAID) {
      this._status = InvoiceStatus.OVERDUE;
    }
  }

  /**
   * Generate Vietnamese invoice number
   */
  private generateVietnameseInvoiceNumber(): string {
    // Format: HĐ-YYYYMM-XXXXXX
    const year = this._issuedAt.getFullYear();
    const month = String(this._issuedAt.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');
    
    return `HĐ-${year}${month}-${sequence}`;
  }

  /**
   * Generate payment ID
   */
  private generatePaymentId(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate claim ID
   */
  private generateClaimId(): string {
    return `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate claim number
   */
  private generateClaimNumber(): string {
    const year = new Date().getFullYear();
    const sequence = String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0');
    return `${year}${sequence}`;
  }
}
