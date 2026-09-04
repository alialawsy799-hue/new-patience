export const DEFAULT_PAGE_SIZE = 50;

export type SearchParamRecord = Record<string, string | string[] | undefined>;

/** Reads a single-valued search param, trimming and collapsing empties. */
export function readParam(params: SearchParamRecord, key: string): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value.trim() : '';
}

export function readEnum<T extends string>(
  params: SearchParamRecord,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = readParam(params, key);
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function readPage(params: SearchParamRecord): number {
  const parsed = Number.parseInt(readParam(params, 'page'), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export type PageInfo = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  from: number;
  to: number;
  offset: number;
};

export function buildPageInfo(page: number, pageSize: number, total: number): PageInfo {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pages);
  const offset = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total,
    pages,
    from: total === 0 ? 0 : offset + 1,
    to: Math.min(offset + pageSize, total),
    offset,
  };
}

/** Serialises a filter set back into a query string, dropping empty values. */
export function buildQuery(values: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === '' || value === null) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function pageHref(
  basePath: string,
  values: Record<string, string | number | undefined>,
  page: number,
): string {
  return `${basePath}${buildQuery({ ...values, page: page > 1 ? page : undefined })}`;
}
