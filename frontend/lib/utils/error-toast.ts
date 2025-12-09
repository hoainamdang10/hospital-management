import { isAxiosError } from 'axios';
import { toast } from 'sonner';

type BackendErrorPayload =
  | {
      message?: string;
      error?: string;
      code?: string;
      errors?:
        | Array<string | { message?: string; detail?: string }>
        | Record<string, string | string[]>;
      details?:
        | Array<string | { message?: string; detail?: string }>
        | Record<string, string | string[]>;
      reason?: string;
      hint?: string;
      context?: string;
    }
  | string
  | null
  | undefined;

interface ExtractedErrorDetails {
  message?: string;
  code?: string;
  status?: number;
  reasons: string[];
  context?: string;
}

export interface ShowErrorToastOptions {
  title?: string;
  fallbackMessage: string;
  context?: string;
  id?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

function collectReasons(payload?: BackendErrorPayload): string[] {
  if (!payload || typeof payload === 'string') {
    return typeof payload === 'string' ? [payload] : [];
  }

  const buckets: Array<string | undefined> = [];

  const pushArray = (value?: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          buckets.push(item);
        } else if (item && typeof item === 'object') {
          const maybe = (item as { message?: string; detail?: string }).message;
          const detail = (item as { message?: string; detail?: string }).detail;
          buckets.push(maybe || detail);
        }
      });
      return true;
    }

    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((entry) => {
            if (!entry) return;
            if (typeof entry === 'string') {
              buckets.push(`${key}: ${entry}`);
            } else if (typeof entry === 'object') {
              const maybe = (entry as { message?: string; detail?: string }).message;
              const detail = (entry as { message?: string; detail?: string }).detail;
              buckets.push(`${key}: ${maybe || detail}`);
            }
          });
        } else if (typeof val === 'string') {
          buckets.push(`${key}: ${val}`);
        }
      });
      return true;
    }

    return false;
  };

  pushArray(payload.errors);
  pushArray(payload.details);

  if (payload.reason) {
    buckets.push(payload.reason);
  }
  if (payload.hint) {
    buckets.push(payload.hint);
  }
  if (payload.context && typeof payload.context === 'string') {
    buckets.push(payload.context);
  }

  return buckets.filter((item): item is string => Boolean(item));
}

export function extractErrorDetails(error: unknown): ExtractedErrorDetails {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as BackendErrorPayload;

    if (!error.response) {
      return {
        status,
        code: error.code ?? undefined,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.',
        reasons: [],
      };
    }

    if (typeof data === 'string') {
      return {
        status,
        code: error.code ?? undefined,
        message: data,
        reasons: [],
      };
    }

    const message =
      data?.message ||
      data?.error ||
      error.response?.statusText ||
      error.message ||
      undefined;

    return {
      status,
      code: (data && typeof data === 'object' && 'code' in data ? data.code : undefined) || error.code || undefined,
      message,
      reasons: collectReasons(data),
      context: typeof data === 'object' && data ? (data as { context?: string }).context : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      reasons: [],
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      reasons: [],
    };
  }

  return {
    reasons: [],
  };
}

export function showErrorToast(error: unknown, options: ShowErrorToastOptions): void {
  const details = extractErrorDetails(error);
  const descriptionParts: string[] = [];

  if (details.message) {
    descriptionParts.push(details.message);
  } else {
    descriptionParts.push(options.fallbackMessage);
  }

  if (details.reasons.length > 0) {
    descriptionParts.push(details.reasons.join(' • '));
  }

  const metaParts: string[] = [];
  if (options.context) {
    metaParts.push(options.context);
  } else if (details.context) {
    metaParts.push(details.context);
  }
  if (details.code) {
    metaParts.push(`Mã lỗi: ${details.code}`);
  }
  if (details.status) {
    metaParts.push(`Trạng thái: ${details.status}`);
  }

  if (metaParts.length > 0) {
    descriptionParts.push(metaParts.join(' • '));
  }

  toast.error(options.title ?? 'Đã xảy ra lỗi', {
    description: descriptionParts.join(' • '),
    id: options.id,
    duration: options.duration ?? 6000,
    action:
      options.actionLabel && options.onAction
        ? {
            label: options.actionLabel,
            onClick: options.onAction,
          }
        : undefined,
  });
}
