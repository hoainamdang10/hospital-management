export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestConfig = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  authToken?: string | null;
};

export type ApiResult<TData> = {
  ok: boolean;
  data?: TData;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  status: number;
};

const DEFAULT_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_V2_URL ?? "http://localhost:3101";

export class ApiGatewayClient {
  constructor(private readonly baseUrl: string = DEFAULT_GATEWAY_URL) {}

  async request<TResponse>(endpoint: string, config: RequestConfig = {}): Promise<ApiResult<TResponse>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 20000);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept-Language": "vi-VN",
        ...config.headers,
      };

      if (config.authToken) {
        headers.Authorization = `Bearer ${config.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: config.method ?? "GET",
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      const payload = await this.parseResponse<TResponse>(response);
      return { ...payload, status: response.status };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      return {
        ok: false,
        status: 0,
        error: {
          message,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseResponse<TResponse>(response: Response): Promise<Omit<ApiResult<TResponse>, "status">> {
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = (isJson ? await response.json().catch(() => null) : null) as Record<string, unknown> | null;

    if (response.ok) {
      return { ok: true, data: payload as TResponse };
    }

    return {
      ok: false,
      error: {
        message: typeof payload?.message === "string" ? (payload.message as string) : "Unknown error",
        code: typeof payload?.code === "string" ? (payload.code as string) : undefined,
        details: payload ?? undefined,
      },
    };
  }
}

export const apiGatewayClient = new ApiGatewayClient();
