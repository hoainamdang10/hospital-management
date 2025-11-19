import {
  ISchedulerAdapter,
  ScheduleReminderTask,
  SchedulerServiceResponse,
} from "./ISchedulerAdapter";

/**
 * No-operation Scheduler Adapter.
 * Used when ENABLE_SCHEDULER=false so the rest of the system can run without the external scheduler-service.
 */
export class NoopSchedulerAdapter implements ISchedulerAdapter {
  async scheduleReminder(
    task: ScheduleReminderTask,
  ): Promise<SchedulerServiceResponse> {
    console.log("[NoopSchedulerAdapter] Skipping schedule", {
      appointmentId: task.appointmentId,
      reminderType: task.reminderType,
    });
    return { success: true, scheduleId: "noop" };
  }

  async cancelReminders(): Promise<SchedulerServiceResponse> {
    console.log("[NoopSchedulerAdapter] Skipping cancel");
    return { success: true };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
