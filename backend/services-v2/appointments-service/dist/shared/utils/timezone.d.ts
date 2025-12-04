/**
 * Timezone utilities shared across services.
 * Ensure every service interprets clinic appointment times consistently.
 */
/**
 * Read clinic timezone offset (in minutes) from env or fallback to UTC+7.
 */
export declare function getClinicTimezoneOffsetMinutes(): number;
/**
 * Convert clinic local date/time strings (YYYY-MM-DD + HH:mm:ss) to UTC Date.
 */
export declare function convertClinicLocalToUtc(dateStr: string, timeStr: string): Date;
/**
 * Convert a UTC Date into clinic-local ISO components.
 * Useful when we need to surface data back to the UI as local date/time strings.
 */
export declare function convertUtcToClinicLocal(date: Date): {
    date: string;
    time: string;
};
//# sourceMappingURL=timezone.d.ts.map