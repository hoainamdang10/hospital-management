import Redis from 'ioredis';
import { Logger } from 'winston';
export declare class RedisClient {
    private client;
    private logger;
    private isConnected;
    constructor(logger: Logger, redisUrl?: string);
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isReady(): boolean;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    expire(key: string, seconds: number): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<void>;
    hgetall(key: string): Promise<Record<string, string>>;
    lpush(key: string, ...values: string[]): Promise<number>;
    rpop(key: string): Promise<string | null>;
    llen(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    getClient(): Redis;
    healthCheck(): Promise<{
        status: string;
        latency: number;
    }>;
}
//# sourceMappingURL=RedisClient.d.ts.map