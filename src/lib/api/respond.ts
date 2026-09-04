import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/security/request';

export type ApiError = {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
};

/**
 * All API responses are `no-store`: they carry per-student authorisation
 * results and must never be served from a shared or browser cache.
 */
export function json<T>(data: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { 'Cache-Control': 'no-store, max-age=0', ...(init?.headers ?? {}) },
  });
}

export function fail(error: string, status: number, extra?: Omit<ApiError, 'error'>) {
  return json<ApiError>({ error, ...extra }, { status });
}

export const unauthorized = () => fail('unauthorized', 401);
export const forbidden = () => fail('forbidden', 403);
export const notFound = () => fail('not_found', 404);
export const badRequest = (details?: Record<string, unknown>) =>
  fail('bad_request', 400, details ? { details } : undefined);
export const rateLimited = (retryAfterSeconds: number) =>
  json<ApiError>(
    { error: 'rate_limited', details: { retryAfterSeconds } },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );

/**
 * CSRF guard for every state-changing request.
 *
 * A cross-site page cannot set `Origin`, so requiring it to match our own
 * origin blocks forged POSTs even though the session cookie is SameSite=Lax.
 */
export function assertSameOrigin(request: Request): Response | null {
  if (isSameOrigin(request)) return null;
  return fail('invalid_origin', 403);
}

/** Parses and validates a JSON body, returning a typed result or a response. */
export async function readJson<T>(
  request: Request,
  validate: (value: unknown) => T,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest({ reason: 'invalid_json' }) };
  }

  try {
    return { ok: true, data: validate(raw) };
  } catch (error) {
    const details =
      error && typeof error === 'object' && 'issues' in error
        ? { issues: (error as { issues: unknown }).issues }
        : { reason: 'validation_failed' };
    return { ok: false, response: badRequest(details) };
  }
}

/** Wraps a handler so an unexpected throw never leaks a stack trace. */
export function withErrorHandling<C = unknown>(
  handler: (request: Request, context: C) => Promise<Response>,
) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof Error && error.name === 'UnauthenticatedError') return unauthorized();
      if (error instanceof Error && error.name === 'ForbiddenError') return forbidden();
      console.error('[api] unhandled error', request.method, request.url, error);
      return fail('server_error', 500);
    }
  };
}
