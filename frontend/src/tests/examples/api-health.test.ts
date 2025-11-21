import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import { server } from '@/tests/mocks/server';

test('returns the mocked API health payload', async () => {
  const response = await fetch('/api/health');
  expect(response.ok).toBe(true);

  const payload = await response.json();
  expect(payload).toEqual({ status: 'ok' });
});

test('allows overriding handlers scoped to a single spec', async () => {
  server.use(
    http.get('/api/health', () =>
      HttpResponse.json({ status: 'degraded', timestamp: 'now' }),
    ),
  );

  const response = await fetch('/api/health');
  const payload = await response.json();

  expect(payload).toEqual({ status: 'degraded', timestamp: 'now' });
});

