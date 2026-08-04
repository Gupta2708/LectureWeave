import { expect, test } from 'vitest';
import { environment } from './environment';

test('uses safe local API and websocket defaults', () => {
  expect(environment.API_BASE_URL).toBe('http://localhost:8000');
  expect(environment.WS_BASE_URL).toBe('ws://localhost:8000');
});
