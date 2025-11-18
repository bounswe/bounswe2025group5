import { http, HttpResponse } from 'msw';

/**
 * Extend this array with request handlers that mirror the real API contracts in
 * `@/lib/api/*`. Co-locate scenario-specific handlers inside your specs when needed.
 */
export const handlers = [
  http.get('/api/health', () =>
    HttpResponse.json({
      status: 'ok',
    }),
  ),
];

