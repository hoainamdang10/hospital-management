import { NotificationPriority } from "../aggregates/Notification";

const PRIORITY_ALIASES: Record<string, NotificationPriority> = {
  urgent: "URGENT",
  emergency: "URGENT",
  critical: "URGENT",
  immediate: "URGENT",
  stat: "URGENT",
  asap: "URGENT",
  high: "HIGH",
  important: "HIGH",
  elevated: "HIGH",
  priority_high: "HIGH",
  warning: "HIGH",
  normal: "NORMAL",
  routine: "NORMAL",
  medium: "NORMAL",
  standard: "NORMAL",
  default: "NORMAL",
  info: "LOW",
  informational: "LOW",
  reminder: "LOW",
  low: "LOW",
  minor: "LOW",
  noncritical: "LOW",
};

/**
 * Normalize arbitrary priority strings (from upstream services or free text)
 * into the NotificationPriority union used inside the notifications service.
 */
export function normalizePriority(
  rawPriority?: string | null,
): NotificationPriority {
  if (!rawPriority) {
    return "NORMAL";
  }

  const normalized = rawPriority.toString().trim().toLowerCase();
  if (!normalized) {
    return "NORMAL";
  }

  if (PRIORITY_ALIASES[normalized]) {
    return PRIORITY_ALIASES[normalized];
  }

  if (/^p0$|^sev0$/.test(normalized)) {
    return "URGENT";
  }
  if (/^p1$|^sev1$/.test(normalized)) {
    return "HIGH";
  }
  if (/^p2$|^p3$|^sev2$|^sev3$/.test(normalized)) {
    return "NORMAL";
  }
  if (/^p4$|^p5$|^sev4$|^sev5$/.test(normalized)) {
    return "LOW";
  }

  const numericPriority = Number(normalized);
  if (!Number.isNaN(numericPriority)) {
    if (numericPriority <= 1) {
      return "URGENT";
    }
    if (numericPriority <= 2) {
      return "HIGH";
    }
    if (numericPriority <= 3) {
      return "NORMAL";
    }
    return "LOW";
  }

  return "NORMAL";
}
