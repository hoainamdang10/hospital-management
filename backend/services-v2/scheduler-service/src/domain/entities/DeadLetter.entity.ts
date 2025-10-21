import { TenantId } from '../value-objects/TenantId';

export type DeadLetterFailureType = 'run_failed' | 'unroutable_message' | 'publish_failed';

export interface DeadLetterProps {
  id: string;
  runId?: string;
  scheduleId?: string;
  tenantId?: TenantId;
  errorMessage: string;
  errorStack?: string;
  attemptCount?: number;
  lastAttemptAtUtc?: Date;
  storedAtUtc: Date;

  // For unroutable messages
  messageId?: string;
  routingKey?: string;
  exchange?: string;
  payload?: Record<string, any>;
  headers?: Record<string, any>;
  failureType: DeadLetterFailureType;
}

export class DeadLetter {
  private constructor(private readonly props: DeadLetterProps) {}

  /**
   * Create DeadLetter for failed run
   */
  public static createForFailedRun(
    runId: string,
    scheduleId: string,
    tenantId: TenantId,
    errorMessage: string,
    errorStack: string | undefined,
    attemptCount: number,
    lastAttemptAtUtc: Date
  ): DeadLetter {
    return new DeadLetter({
      id: '', // Will be set by database
      runId,
      scheduleId,
      tenantId,
      errorMessage,
      errorStack,
      attemptCount,
      lastAttemptAtUtc,
      storedAtUtc: new Date(),
      failureType: 'run_failed'
    });
  }

  /**
   * Create DeadLetter for unroutable message
   */
  public static createForUnroutableMessage(
    messageId: string,
    routingKey: string,
    exchange: string,
    payload: Record<string, any>,
    headers: Record<string, any>,
    errorMessage: string
  ): DeadLetter {
    return new DeadLetter({
      id: '', // Will be set by database
      messageId,
      routingKey,
      exchange,
      payload,
      headers,
      errorMessage,
      storedAtUtc: new Date(),
      failureType: 'unroutable_message'
    });
  }

  /**
   * Backward compatibility - use createForFailedRun instead
   * @deprecated Use createForFailedRun instead
   */
  public static create(
    runId: string,
    scheduleId: string,
    tenantId: TenantId,
    errorMessage: string,
    errorStack: string | undefined,
    attemptCount: number,
    lastAttemptAtUtc: Date
  ): DeadLetter {
    return DeadLetter.createForFailedRun(
      runId,
      scheduleId,
      tenantId,
      errorMessage,
      errorStack,
      attemptCount,
      lastAttemptAtUtc
    );
  }

  public static reconstitute(props: DeadLetterProps): DeadLetter {
    return new DeadLetter(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getRunId(): string | undefined {
    return this.props.runId;
  }

  public getScheduleId(): string | undefined {
    return this.props.scheduleId;
  }

  public getTenantId(): TenantId | undefined {
    return this.props.tenantId;
  }

  public getErrorMessage(): string {
    return this.props.errorMessage;
  }

  public getErrorStack(): string | undefined {
    return this.props.errorStack;
  }

  public getAttemptCount(): number | undefined {
    return this.props.attemptCount;
  }

  public getLastAttemptAtUtc(): Date | undefined {
    return this.props.lastAttemptAtUtc;
  }

  public getStoredAtUtc(): Date {
    return this.props.storedAtUtc;
  }

  public getMessageId(): string | undefined {
    return this.props.messageId;
  }

  public getRoutingKey(): string | undefined {
    return this.props.routingKey;
  }

  public getExchange(): string | undefined {
    return this.props.exchange;
  }

  public getPayload(): Record<string, any> | undefined {
    return this.props.payload;
  }

  public getHeaders(): Record<string, any> | undefined {
    return this.props.headers;
  }

  public getFailureType(): DeadLetterFailureType {
    return this.props.failureType;
  }

  public getProps(): DeadLetterProps {
    return { ...this.props };
  }
}

