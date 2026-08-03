import httpClient from '../httpClient';

// Uploads a single reference document to a lecture. httpClient removes the JSON
// Content-Type for FormData so the browser sets the multipart boundary.
export const uploadLectureDocument = (lectureId, file) => {
  const form = new FormData();
  form.append('files', file);
  return httpClient.post(`/api/documents/lecture/${lectureId}/upload`, form);
};
