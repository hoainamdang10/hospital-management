"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopSchedulerAdapter = void 0;
/**
 * No-operation Scheduler Adapter.
 * Used when ENABLE_SCHEDULER=false so the rest of the system can run without the external scheduler-service.
 */
class NoopSchedulerAdapter {
    async scheduleReminder(task) {
        console.log("[NoopSchedulerAdapter] Skipping schedule", {
            appointmentId: task.appointmentId,
            reminderType: task.reminderType,
        });
        return { success: true, scheduleId: "noop" };
    }
    async cancelReminders() {
        console.log("[NoopSchedulerAdapter] Skipping cancel");
        return { success: true };
    }
    async isAvailable() {
        return true;
    }
}
exports.NoopSchedulerAdapter = NoopSchedulerAdapter;
//# sourceMappingURL=NoopSchedulerAdapter.js.map