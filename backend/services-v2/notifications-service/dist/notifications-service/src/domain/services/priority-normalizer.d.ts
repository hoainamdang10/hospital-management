import { NotificationPriority } from "../aggregates/Notification";
/**
 * Normalize arbitrary priority strings (from upstream services or free text)
 * into the NotificationPriority union used inside the notifications service.
 */
export declare function normalizePriority(rawPriority?: string | null): NotificationPriority;
//# sourceMappingURL=priority-normalizer.d.ts.map