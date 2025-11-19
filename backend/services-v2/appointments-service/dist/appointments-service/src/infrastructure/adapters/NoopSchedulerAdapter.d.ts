import { ISchedulerAdapter, ScheduleReminderTask, SchedulerServiceResponse } from "./ISchedulerAdapter";
/**
 * No-operation Scheduler Adapter.
 * Used when ENABLE_SCHEDULER=false so the rest of the system can run without the external scheduler-service.
 */
export declare class NoopSchedulerAdapter implements ISchedulerAdapter {
    scheduleReminder(task: ScheduleReminderTask): Promise<SchedulerServiceResponse>;
    cancelReminders(): Promise<SchedulerServiceResponse>;
    isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=NoopSchedulerAdapter.d.ts.map