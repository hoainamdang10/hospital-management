/**
 * Scheduler Service SDK - Fake Adapter
 * 
 * Mock implementation for development and testing.
 * 
 * Features:
 * - In-memory storage
 * - Simulates API behavior
 * - Configurable delays
 * - Error injection for testing
 */

import { v4 as uuidv4 } from 'uuid';
import { IScheduler } from './IScheduler';
import {
  CreateScheduleRequest,
  ScheduleResponse,
  CancelByOwnerRequest,
  CancelResponse,
  RunResponse,
  GetScheduleRunsRequest,
  RunsResponse,
  HealthResponse,
  SchedulerError,
  RunDetail,
  validateScheduleType
} from './types';

export interface FakeSchedulerConfig {
  /** Simulate network delay (ms) */
  delay?: number;
  
  /** Simulate errors */
  simulateErrors?: {
    createOrUpdateByDedup?: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
    cancelByOwner?: 'VALIDATION_ERROR' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    getSchedule?: 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    runNow?: 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'INTERNAL_ERROR';
    getScheduleRuns?: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  };
}

export class FakeSchedulerAdapter implements IScheduler {
  private schedules: Map<string, ScheduleResponse> = new Map();
  private runs: Map<string, RunDetail[]> = new Map();
  private dedupIndex: Map<string, string> = new Map(); // dedupKey -> scheduleId
  private config: FakeSchedulerConfig;
  
  constructor(config: FakeSchedulerConfig = {}) {
    this.config = {
      delay: config.delay || 0,
      simulateErrors: config.simulateErrors || {}
    };
  }
  
  /**
   * Simulate network delay
   */
  private async delay(): Promise<void> {
    if (this.config.delay && this.config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.delay));
    }
  }
  
  /**
   * Create or update schedule by dedup key
   */
  async createOrUpdateByDedup(request: CreateScheduleRequest): Promise<ScheduleResponse> {
    await this.delay();
    
    // Simulate error
    if (this.config.simulateErrors?.createOrUpdateByDedup) {
      throw new SchedulerError(
        this.config.simulateErrors.createOrUpdateByDedup,
        `Simulated error: ${this.config.simulateErrors.createOrUpdateByDedup}`
      );
    }
    
    // Client-side validation
    validateScheduleType(request);
    
    // Check if schedule exists by dedupKey
    const dedupKey = `${request.tenantId}:${request.dedupKey}`;
    const existingScheduleId = this.dedupIndex.get(dedupKey);
    
    let scheduleId: string;
    let isUpdate = false;
    
    if (existingScheduleId) {
      // Update existing schedule
      scheduleId = existingScheduleId;
      isUpdate = true;
    } else {
      // Create new schedule
      scheduleId = uuidv4();
      this.dedupIndex.set(dedupKey, scheduleId);
    }
    
    const now = new Date().toISOString();
    
    const schedule: ScheduleResponse = {
      scheduleId,
      tenantId: request.tenantId,
      ownerService: request.ownerService,
      ownerResourceType: request.ownerResourceType,
      ownerResourceId: request.ownerResourceId,
      scheduleType: request.scheduleType,
      status: 'ACTIVE',
      topicOrCommand: request.topicOrCommand,
      dedupKey: request.dedupKey,
      nextRunAtUtc: request.scheduleType === 'ONCE' 
        ? (typeof request.startAtUtc === 'string' ? request.startAtUtc : request.startAtUtc?.toISOString())
        : null,
      createdAtUtc: isUpdate ? this.schedules.get(scheduleId)!.createdAtUtc : now,
      updatedAtUtc: now
    };
    
    this.schedules.set(scheduleId, schedule);
    
    return schedule;
  }
  
  /**
   * Cancel all schedules by owner
   */
  async cancelByOwner(request: CancelByOwnerRequest): Promise<CancelResponse> {
    await this.delay();
    
    // Simulate error
    if (this.config.simulateErrors?.cancelByOwner) {
      throw new SchedulerError(
        this.config.simulateErrors.cancelByOwner,
        `Simulated error: ${this.config.simulateErrors.cancelByOwner}`
      );
    }
    
    const cancelledScheduleIds: string[] = [];
    
    for (const [scheduleId, schedule] of this.schedules.entries()) {
      // Match filters
      if (schedule.tenantId !== request.tenantId) continue;
      if (schedule.ownerService !== request.ownerService) continue;
      if (request.ownerResourceType && schedule.ownerResourceType !== request.ownerResourceType) continue;
      if (request.ownerResourceId && schedule.ownerResourceId !== request.ownerResourceId) continue;
      
      // Cancel schedule
      schedule.status = 'CANCELLED';
      schedule.updatedAtUtc = new Date().toISOString();
      
      // Cancel DUE runs
      const runs = this.runs.get(scheduleId) || [];
      for (const run of runs) {
        if (run.status === 'DUE') {
          run.status = 'CANCELLED';
        }
      }
      
      cancelledScheduleIds.push(scheduleId);
    }
    
    return {
      cancelledCount: cancelledScheduleIds.length,
      cancelledScheduleIds
    };
  }
  
  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ScheduleResponse> {
    await this.delay();
    
    // Simulate error
    if (this.config.simulateErrors?.getSchedule) {
      throw new SchedulerError(
        this.config.simulateErrors.getSchedule,
        `Simulated error: ${this.config.simulateErrors.getSchedule}`
      );
    }
    
    const schedule = this.schedules.get(scheduleId);
    
    if (!schedule) {
      throw new SchedulerError('NOT_FOUND', `Schedule not found: ${scheduleId}`);
    }
    
    return schedule;
  }
  
  /**
   * Trigger schedule to run immediately
   */
  async runNow(scheduleId: string): Promise<RunResponse> {
    await this.delay();
    
    // Simulate error
    if (this.config.simulateErrors?.runNow) {
      throw new SchedulerError(
        this.config.simulateErrors.runNow,
        `Simulated error: ${this.config.simulateErrors.runNow}`
      );
    }
    
    const schedule = this.schedules.get(scheduleId);
    
    if (!schedule) {
      throw new SchedulerError('NOT_FOUND', `Schedule not found: ${scheduleId}`);
    }
    
    if (schedule.status !== 'ACTIVE') {
      throw new SchedulerError('CONFLICT', `Schedule is not ACTIVE: ${schedule.status}`);
    }
    
    const runId = uuidv4();
    const now = new Date().toISOString();
    
    const run: RunDetail = {
      runId,
      scheduleId,
      tenantId: schedule.tenantId,
      status: 'DUE',
      dueAtUtc: now,
      attempt: 0
    };
    
    // Add run to storage
    const runs = this.runs.get(scheduleId) || [];
    runs.push(run);
    this.runs.set(scheduleId, runs);
    
    return {
      runId,
      scheduleId,
      status: 'DUE',
      dueAtUtc: now
    };
  }
  
  /**
   * Get schedule runs
   */
  async getScheduleRuns(request: GetScheduleRunsRequest): Promise<RunsResponse> {
    await this.delay();
    
    // Simulate error
    if (this.config.simulateErrors?.getScheduleRuns) {
      throw new SchedulerError(
        this.config.simulateErrors.getScheduleRuns,
        `Simulated error: ${this.config.simulateErrors.getScheduleRuns}`
      );
    }
    
    const schedule = this.schedules.get(request.scheduleId);
    
    if (!schedule) {
      throw new SchedulerError('NOT_FOUND', `Schedule not found: ${request.scheduleId}`);
    }
    
    let runs = this.runs.get(request.scheduleId) || [];
    
    // Apply filters
    if (request.status) {
      runs = runs.filter(r => r.status === request.status);
    }
    if (request.fromUtc) {
      const fromUtc = typeof request.fromUtc === 'string' ? request.fromUtc : request.fromUtc.toISOString();
      runs = runs.filter(r => r.dueAtUtc >= fromUtc);
    }
    if (request.toUtc) {
      const toUtc = typeof request.toUtc === 'string' ? request.toUtc : request.toUtc.toISOString();
      runs = runs.filter(r => r.dueAtUtc <= toUtc);
    }
    
    // Pagination (simple implementation)
    const limit = request.limit || 20;
    const cursorIndex = request.cursor ? parseInt(request.cursor, 10) : 0;
    const paginatedRuns = runs.slice(cursorIndex, cursorIndex + limit);
    const hasMore = runs.length > cursorIndex + limit;
    
    return {
      runs: paginatedRuns,
      pagination: {
        nextCursor: hasMore ? (cursorIndex + limit).toString() : null,
        hasMore
      }
    };
  }
  
  /**
   * Health check
   */
  async health(): Promise<HealthResponse> {
    await this.delay();
    
    return {
      status: 'healthy',
      service: 'scheduler-service',
      version: '1.0.1',
      timestamp: new Date().toISOString(),
      components: {
        database: { status: 'healthy', latencyMs: 5 },
        rabbitmq: { status: 'healthy', latencyMs: 3 },
        redis: { status: 'healthy', latencyMs: 2 }
      }
    };
  }
  
  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.schedules.clear();
    this.runs.clear();
    this.dedupIndex.clear();
  }
  
  /**
   * Get all schedules (for testing)
   */
  getAllSchedules(): ScheduleResponse[] {
    return Array.from(this.schedules.values());
  }
}

