export type InboxEventStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface InboxEventProps {
  inboxId: string;
  idempotencyKey: string;
  eventType: string;
  payloadJson: any;
  headersJson: any;
  status: InboxEventStatus;
  receivedAtUtc: Date;
  processedAtUtc?: Date;
  errorMessage?: string;
  retryCount: number;
  lastRetryAtUtc?: Date;
  createdAtUtc: Date;
  updatedAtUtc: Date;
}

export class InboxEvent {
  private constructor(private readonly props: InboxEventProps) {}

  static create(
    idempotencyKey: string,
    eventType: string,
    payloadJson: any,
    headersJson: any = {}
  ): InboxEvent {
    const now = new Date();
    
    return new InboxEvent({
      inboxId: '', // Will be set by database
      idempotencyKey,
      eventType,
      payloadJson,
      headersJson,
      status: 'PENDING',
      receivedAtUtc: now,
      retryCount: 0,
      createdAtUtc: now,
      updatedAtUtc: now
    });
  }

  static reconstitute(props: InboxEventProps): InboxEvent {
    return new InboxEvent(props);
  }

  // Getters
  getInboxId(): string {
    return this.props.inboxId;
  }

  getIdempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  getEventType(): string {
    return this.props.eventType;
  }

  getPayloadJson(): any {
    return this.props.payloadJson;
  }

  getHeadersJson(): any {
    return this.props.headersJson;
  }

  getStatus(): InboxEventStatus {
    return this.props.status;
  }

  getReceivedAtUtc(): Date {
    return this.props.receivedAtUtc;
  }

  getProcessedAtUtc(): Date | undefined {
    return this.props.processedAtUtc;
  }

  getErrorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  getRetryCount(): number {
    return this.props.retryCount;
  }

  getLastRetryAtUtc(): Date | undefined {
    return this.props.lastRetryAtUtc;
  }

  getProps(): InboxEventProps {
    return { ...this.props };
  }

  // State transitions
  markAsProcessing(): void {
    this.props.status = 'PROCESSING';
    this.props.updatedAtUtc = new Date();
  }

  markAsCompleted(): void {
    this.props.status = 'COMPLETED';
    this.props.processedAtUtc = new Date();
    this.props.updatedAtUtc = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.props.status = 'FAILED';
    this.props.errorMessage = errorMessage;
    this.props.retryCount += 1;
    this.props.lastRetryAtUtc = new Date();
    this.props.updatedAtUtc = new Date();
  }

  // Business logic
  canRetry(maxRetries: number = 3): boolean {
    return this.props.retryCount < maxRetries;
  }

  isProcessed(): boolean {
    return this.props.status === 'COMPLETED';
  }

  isDuplicate(): boolean {
    return this.props.status !== 'PENDING';
  }
}
