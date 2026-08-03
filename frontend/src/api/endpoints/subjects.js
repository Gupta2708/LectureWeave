import httpClient from '../httpClient';

// Subject endpoints. The JWT is attached automatically by httpClient.
export const listSubjects = () => httpClient.get('/api/subjects/');

export const createSubject = (payload) => httpClient.post('/api/subjects/', payload);

export const updateSubject = (subjectId, payload) =>
  httpClient.put(`/api/subjects/${subjectId}`, payload);

export const deleteSubject = (subjectId) =>
  httpClient.delete(`/api/subjects/${subjectId}`);
