import { PaginationParams } from "../types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(
  query: Record<string, unknown>,
): PaginationParams {
  const page = Math.max(
    DEFAULT_PAGE,
    Math.min(
      Number.parseInt((query.page as string) ?? `${DEFAULT_PAGE}`, 10) ||
        DEFAULT_PAGE,
      10_000,
    ),
  );
  const rawLimit =
    Number.parseInt((query.limit as string) ?? `${DEFAULT_LIMIT}`, 10) ||
    DEFAULT_LIMIT;
  const limit = Math.max(1, Math.min(rawLimit, MAX_LIMIT));

  return { page, limit };
}

export function getRange({ page, limit }: PaginationParams): {
  from: number;
  to: number;
} {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}
