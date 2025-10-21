export enum RetryStrategy {
  EXPONENTIAL = 'exp',
  LINEAR = 'linear',
  FIXED = 'fixed'
}

export interface RetryPolicyProps {
  strategy: RetryStrategy;
  maxAttempts: number;
  baseMs: number;
  maxDelayMs?: number;
}

export class RetryPolicy {
  private constructor(
    private readonly strategy: RetryStrategy,
    private readonly maxAttempts: number,
    private readonly baseMs: number,
    private readonly maxDelayMs: number
  ) {}

  public static create(props: RetryPolicyProps): RetryPolicy {
    if (props.maxAttempts < 1) {
      throw new Error('Max attempts must be at least 1');
    }

    if (props.baseMs < 0) {
      throw new Error('Base delay must be non-negative');
    }

    const maxDelayMs = props.maxDelayMs || 300000; // 5 minutes default

    return new RetryPolicy(
      props.strategy,
      props.maxAttempts,
      props.baseMs,
      maxDelayMs
    );
  }

  public static default(): RetryPolicy {
    return new RetryPolicy(
      RetryStrategy.EXPONENTIAL,
      5,
      1000,
      300000
    );
  }

  public static fromJson(json: any): RetryPolicy {
    return RetryPolicy.create({
      strategy: json.strategy as RetryStrategy,
      maxAttempts: json.max_attempts,
      baseMs: json.base_ms,
      maxDelayMs: json.max_delay_ms
    });
  }

  public calculateDelay(attempt: number): number {
    if (attempt >= this.maxAttempts) {
      return -1; // No more retries
    }

    let delay: number;

    switch (this.strategy) {
      case RetryStrategy.EXPONENTIAL:
        delay = this.baseMs * Math.pow(2, attempt);
        break;
      case RetryStrategy.LINEAR:
        delay = this.baseMs * (attempt + 1);
        break;
      case RetryStrategy.FIXED:
        delay = this.baseMs;
        break;
      default:
        delay = this.baseMs;
    }

    return Math.min(delay, this.maxDelayMs);
  }

  public shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }

  public getMaxAttempts(): number {
    return this.maxAttempts;
  }

  public toJson(): any {
    return {
      strategy: this.strategy,
      max_attempts: this.maxAttempts,
      base_ms: this.baseMs,
      max_delay_ms: this.maxDelayMs
    };
  }

  public equals(other: RetryPolicy): boolean {
    return (
      this.strategy === other.strategy &&
      this.maxAttempts === other.maxAttempts &&
      this.baseMs === other.baseMs &&
      this.maxDelayMs === other.maxDelayMs
    );
  }
}

