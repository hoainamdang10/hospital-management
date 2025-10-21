export declare enum RetryStrategy {
    EXPONENTIAL = "exp",
    LINEAR = "linear",
    FIXED = "fixed"
}
export interface RetryPolicyProps {
    strategy: RetryStrategy;
    maxAttempts: number;
    baseMs: number;
    maxDelayMs?: number;
}
export declare class RetryPolicy {
    private readonly strategy;
    private readonly maxAttempts;
    private readonly baseMs;
    private readonly maxDelayMs;
    private constructor();
    static create(props: RetryPolicyProps): RetryPolicy;
    static default(): RetryPolicy;
    static fromJson(json: any): RetryPolicy;
    calculateDelay(attempt: number): number;
    shouldRetry(attempt: number): boolean;
    getMaxAttempts(): number;
    toJson(): any;
    equals(other: RetryPolicy): boolean;
}
//# sourceMappingURL=RetryPolicy.d.ts.map