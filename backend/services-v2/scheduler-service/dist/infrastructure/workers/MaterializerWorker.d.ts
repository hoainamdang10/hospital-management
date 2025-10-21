import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IScheduleRunRepository } from '../../domain/repositories/IScheduleRunRepository';
export interface MaterializerConfig {
    interval: number;
    lookaheadHours: number;
    batchSize: number;
    numSegments: number;
}
export declare class MaterializerWorker {
    private readonly scheduleRepo;
    private readonly runRepo;
    private readonly config;
    private isRunning;
    private intervalId;
    private readonly logger;
    private readonly metrics;
    constructor(scheduleRepo: IScheduleRepository, runRepo: IScheduleRunRepository, config: MaterializerConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private materialize;
    private calculateSegment;
    getStatus(): {
        isRunning: boolean;
        config: MaterializerConfig;
    };
}
//# sourceMappingURL=MaterializerWorker.d.ts.map