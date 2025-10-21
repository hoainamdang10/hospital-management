export interface OutboxProps {
  outboxId: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payloadJson: any;
  headersJson: any;
  occurredAtUtc: Date;
  publishedAtUtc?: Date;
  publishAttempts: number;
  lastPublishError?: string;
}

export class Outbox {
  private constructor(private props: OutboxProps) {}

  public static create(
    aggregateId: string,
    eventType: string,
    payloadJson: any,
    headersJson: any,
    aggregateType: string = 'schedule_run'
  ): Outbox {
    return new Outbox({
      outboxId: 0,
      aggregateType,
      aggregateId,
      eventType,
      payloadJson,
      headersJson,
      occurredAtUtc: new Date(),
      publishAttempts: 0
    });
  }

  public static reconstitute(props: OutboxProps): Outbox {
    return new Outbox(props);
  }

  public markAsPublished(): void {
    if (this.props.publishedAtUtc) {
      throw new Error('Outbox entry already published');
    }

    this.props.publishedAtUtc = new Date();
  }

  public recordPublishAttempt(error?: string): void {
    this.props.publishAttempts += 1;
    if (error) {
      this.props.lastPublishError = error;
    }
  }

  public isPublished(): boolean {
    return this.props.publishedAtUtc !== undefined;
  }

  public shouldRetry(maxAttempts: number = 5): boolean {
    return !this.isPublished() && this.props.publishAttempts < maxAttempts;
  }

  public getOutboxId(): number {
    return this.props.outboxId;
  }

  public getAggregateId(): string {
    return this.props.aggregateId;
  }

  public getEventType(): string {
    return this.props.eventType;
  }

  public getPayloadJson(): any {
    return this.props.payloadJson;
  }

  public getHeadersJson(): any {
    return this.props.headersJson;
  }

  public getProps(): Readonly<OutboxProps> {
    return { ...this.props };
  }
}

