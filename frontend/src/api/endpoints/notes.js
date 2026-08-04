import httpClient from '../httpClient';

// Saved-notes endpoints.
export const getMyNotes = () => httpClient.get('/api/notes/my-notes');

// One lecture with its notes (ownership verified server-side).
export const getLectureNotes = (lectureId) =>
  httpClient.get(`/api/notes/lecture/${lectureId}`);
