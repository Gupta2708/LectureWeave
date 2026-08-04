import { afterEach, expect, test, vi } from 'vitest';
import { TOKEN_STORAGE_KEY } from './httpClient';
import { createLectureSocket } from './websocketClient';

afterEach(() => localStorage.clear());

test('builds a tokenised lecture websocket URL', () => {
  const Socket = vi.fn(); globalThis.WebSocket = Socket;
  localStorage.setItem(TOKEN_STORAGE_KEY, 'a b');
  createLectureSocket('lecture-1');
  expect(Socket).toHaveBeenCalledWith('ws://localhost:8000/ws/lecture/lecture-1?token=a%20b');
});
