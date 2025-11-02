import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare class MetricsCollector {
    private static instance;
    private registry;
    readonly workerPollDuration: Histogram;
    readonly workerRunsExecuted: Counter;
    readonly workerRunsFailed: Counter;
    readonly workerActiveRuns: Gauge;
    readonly workerCleanupOperations: Counter;
    readonly workerCleanupDuration: Histogram;
    readonly workerMaterializationDuration: Histogram;
    readonly workerMaterializationRuns: Counter;
    readonly apiRequestDuration: Histogram;
    readonly apiRequestTotal: Counter;
    readonly apiRequestErrors: Counter;
    readonly dbQueryDuration: Histogram;
    readonly dbQueryTotal: Counter;
    readonly dbQueryErrors: Counter;
    readonly dbConnectionPoolSize: Gauge;
    readonly schedulesActive: Gauge;
    readonly schedulesTotal: Counter;
    readonly runsPending: Gauge;
    readonly runsCompleted: Counter;
    readonly runsFailed: Counter;
    readonly unroutableMessagesTotal: Counter;
    readonly unroutableMessagesByExchange: Counter;
    private constructor();
    static getInstance(): MetricsCollector;
    getRegistry(): Registry;
    getMetrics(): Promise<string>;
    reset(): void;
}
//# sourceMappingURL=MetricsCollector.d.ts.map