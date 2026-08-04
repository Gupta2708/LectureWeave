import { environment } from '../config/environment';
import { TOKEN_STORAGE_KEY } from './httpClient';

// Builds lecture WebSocket connections from the configured WS base URL so no
// page hard-codes a WebSocket host. Browsers do not allow custom headers on the
// WebSocket handshake, so the JWT is passed as a `?token=` query param; the
// backend verifies it and the lecture ownership before accepting.
export const createLectureSocket = (lectureId) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  const url = `${environment.WS_BASE_URL}/ws/lecture/${lectureId}${query}`;
  return new WebSocket(url);
};

export default createLectureSocket;
