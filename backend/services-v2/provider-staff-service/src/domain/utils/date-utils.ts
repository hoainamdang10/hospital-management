/**
 * Safe Date Utilities
 * Convert Date-like values to ISO strings without throwing RangeError
 */

export function safeToISOString(
  value: Date | string | undefined | null,
  fallback: Date = new Date()
): string {
  if (!value) {
    return fallback.toISOString();
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return fallback.toISOString();
  }
  return date.toISOString();
}

export function safeOptionalISOString(
  value: Date | string | undefined | null,
  fallback?: Date
): string | null {
  if (!value) {
    return fallback ? fallback.toISOString() : null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return fallback ? fallback.toISOString() : null;
  }
  return date.toISOString();
}
