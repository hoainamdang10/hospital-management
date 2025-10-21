"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryPolicy = exports.RetryStrategy = void 0;
var RetryStrategy;
(function (RetryStrategy) {
    RetryStrategy["EXPONENTIAL"] = "exp";
    RetryStrategy["LINEAR"] = "linear";
    RetryStrategy["FIXED"] = "fixed";
})(RetryStrategy || (exports.RetryStrategy = RetryStrategy = {}));
class RetryPolicy {
    constructor(strategy, maxAttempts, baseMs, maxDelayMs) {
        this.strategy = strategy;
        this.maxAttempts = maxAttempts;
        this.baseMs = baseMs;
        this.maxDelayMs = maxDelayMs;
    }
    static create(props) {
        if (props.maxAttempts < 1) {
            throw new Error('Max attempts must be at least 1');
        }
        if (props.baseMs < 0) {
            throw new Error('Base delay must be non-negative');
        }
        const maxDelayMs = props.maxDelayMs || 300000; // 5 minutes default
        return new RetryPolicy(props.strategy, props.maxAttempts, props.baseMs, maxDelayMs);
    }
    static default() {
        return new RetryPolicy(RetryStrategy.EXPONENTIAL, 5, 1000, 300000);
    }
    static fromJson(json) {
        return RetryPolicy.create({
            strategy: json.strategy,
            maxAttempts: json.max_attempts,
            baseMs: json.base_ms,
            maxDelayMs: json.max_delay_ms
        });
    }
    calculateDelay(attempt) {
        if (attempt >= this.maxAttempts) {
            return -1; // No more retries
        }
        let delay;
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
    shouldRetry(attempt) {
        return attempt < this.maxAttempts;
    }
    getMaxAttempts() {
        return this.maxAttempts;
    }
    toJson() {
        return {
            strategy: this.strategy,
            max_attempts: this.maxAttempts,
            base_ms: this.baseMs,
            max_delay_ms: this.maxDelayMs
        };
    }
    equals(other) {
        return (this.strategy === other.strategy &&
            this.maxAttempts === other.maxAttempts &&
            this.baseMs === other.baseMs &&
            this.maxDelayMs === other.maxDelayMs);
    }
}
exports.RetryPolicy = RetryPolicy;
//# sourceMappingURL=RetryPolicy.js.map