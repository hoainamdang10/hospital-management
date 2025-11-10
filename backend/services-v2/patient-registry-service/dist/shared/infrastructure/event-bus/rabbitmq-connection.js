"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRabbitMQWithRetry = connectRabbitMQWithRetry;
const DEFAULT_ATTEMPTS = Number(process.env.RABBITMQ_CONNECT_MAX_RETRIES || 5);
const DEFAULT_DELAY = Number(process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 3000);
const DEFAULT_BACKOFF = Number(process.env.RABBITMQ_CONNECT_BACKOFF || 2);
/**
 * Helper to execute a RabbitMQ connection function with retry logic.
 */
async function connectRabbitMQWithRetry(connectFn, logger, options = {}) {
    const { maxAttempts = DEFAULT_ATTEMPTS, initialDelayMs = DEFAULT_DELAY, backoffMultiplier = DEFAULT_BACKOFF, connectionName = "RabbitMQ", } = options;
    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            const result = await connectFn();
            if (logger) {
                logger.info?.(`${connectionName} connection established`, { attempt });
            }
            return result;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");
            logger?.warn?.(`${connectionName} connection attempt failed`, {
                attempt,
                maxAttempts,
                error: lastError.message,
            });
            if (attempt >= maxAttempts) {
                break;
            }
            const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
            await delay(delayMs);
        }
    }
    const reason = lastError?.message || "Unknown error";
    logger?.error?.(`${connectionName} connection failed after ${maxAttempts} attempts`, { reason });
    throw new Error(`${connectionName} connection failed after ${maxAttempts} attempts: ${reason}`);
}
async function delay(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=rabbitmq-connection.js.map