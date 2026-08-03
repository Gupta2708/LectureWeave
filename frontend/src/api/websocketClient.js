import { environment } from '../config/environment';

// Builds lecture WebSocket connections from the configured WS base URL so no
// page hard-codes a WebSocket host. Browsers do not allow custom headers on the
// WebSocket handshake, so any ngrok-skip header must be handled at the tunnel
// level, not here.
export const createLectureSocket = (lectureId) => {
  const url = `${environment.WS_BASE_URL}/ws/lecture/${lectureId}`;
  return new WebSocket(url);
};

export default createLectureSocket;
