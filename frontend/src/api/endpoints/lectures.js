import httpClient from '../httpClient';

// Lecture endpoints.
export const createLecture = (payload) => httpClient.post('/api/lectures/', payload);
export const updateLectureTemplate = (lectureId, template) =>
  httpClient.patch(`/api/lectures/${lectureId}/template`, null, { params: { template } });
