import { afterEach, expect, test } from 'vitest';
import httpClient, { TOKEN_STORAGE_KEY } from './httpClient';

afterEach(() => localStorage.clear());

test('injects the stored JWT token', () => {
  localStorage.setItem(TOKEN_STORAGE_KEY, 'test-token');
  const handler = httpClient.interceptors.request.handlers[0].fulfilled;
  const config = handler({ headers: {}, data: null });
  expect(config.headers.Authorization).toBe('Bearer test-token');
});
