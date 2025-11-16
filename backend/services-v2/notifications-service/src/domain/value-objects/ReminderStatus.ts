/**
 * ReminderStatus Value Object
 * Represents the current status of a reminder
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

export type ReminderStatusValue =
  | 'PENDING'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export class ReminderStatus {
  private constructor(private readonly value: ReminderStatusValue) {}

  public static readonly PENDING = new ReminderStatus('PENDING');
  public static readonly PROCESSING = new ReminderStatus('PROCESSING');
  public static readonly SENT = new ReminderStatus('SENT');
  public static readonly FAILED = new ReminderStatus('FAILED');
  public static readonly CANCELLED = new ReminderStatus('CANCELLED');
  public static readonly EXPIRED = new ReminderStatus('EXPIRED');

  public static fromString(value: string): ReminderStatus {
    switch (value) {
      case 'PENDING':
        return ReminderStatus.PENDING;
      case 'PROCESSING':
        return ReminderStatus.PROCESSING;
      case 'SENT':
        return ReminderStatus.SENT;
      case 'FAILED':
        return ReminderStatus.FAILED;
      case 'CANCELLED':
        return ReminderStatus.CANCELLED;
      case 'EXPIRED':
        return ReminderStatus.EXPIRED;
      default:
        throw new Error(`Invalid reminder status: ${value}`);
    }
  }

  public getValue(): ReminderStatusValue {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }

  public isPending(): boolean {
    return this.value === 'PENDING';
  }

  public isProcessing(): boolean {
    return this.value === 'PROCESSING';
  }

  public isSent(): boolean {
    return this.value === 'SENT';
  }

  public isFailed(): boolean {
    return this.value === 'FAILED';
  }

  public isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  public isExpired(): boolean {
    return this.value === 'EXPIRED';
  }

  public isFinal(): boolean {
    return this.isSent() || this.isCancelled() || this.isExpired();
  }

  public canRetry(): boolean {
    return this.isFailed();
  }

  public canCancel(): boolean {
    return this.isPending() || this.isFailed();
  }

  public equals(other: ReminderStatus): boolean {
    return this.value === other.value;
  }
}
