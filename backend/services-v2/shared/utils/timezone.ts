/**
 * Timezone utilities shared across services.
 * Ensure every service interprets clinic appointment times consistently.
 */

const DEFAULT_OFFSET_MINUTES = 420; // Asia/Ho_Chi_Minh (UTC+7)

/**
 * Read clinic timezone offset (in minutes) from env or fallback to UTC+7.
 */
export function getClinicTimezoneOffsetMinutes(): number {
  const raw = process.env.APPOINTMENT_TIMEZONE_OFFSET_MINUTES;
  const parsed = raw !== undefined ? Number(raw) : DEFAULT_OFFSET_MINUTES;
  return Number.isFinite(parsed) ? parsed : DEFAULT_OFFSET_MINUTES;
}

/**
 * Format offset minutes to ISO 8601 suffix, e.g. +07:00.
 */
function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (abs % 60).toString().padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
}

/**
 * Convert clinic local date/time strings (YYYY-MM-DD + HH:mm:ss) to UTC Date.
 */
export function convertClinicLocalToUtc(dateStr: string, timeStr: string): Date {
  const offset = getClinicTimezoneOffsetMinutes();
  return new Date(`${dateStr}T${timeStr}${formatOffset(offset)}`);
}

/**
 * Convert a UTC Date into clinic-local ISO components.
 * Useful when we need to surface data back to the UI as local date/time strings.
 */
export function convertUtcToClinicLocal(date: Date): {
  date: string;
  time: string;
} {
  const offsetMinutes = getClinicTimezoneOffsetMinutes();
  const localMillis = date.getTime() + offsetMinutes * 60 * 1000;
  const localDate = new Date(localMillis);
  const iso = localDate.toISOString();
  const [day, time] = iso.split('T');
  return {
    date: day,
    time: time.split('.')[0],
  };
}
