import httpClient from '../httpClient';
export const generateTopics = (lectureId) => httpClient.post(`/api/lectures/${lectureId}/topics/generate`);
export const getTopics = (lectureId) => httpClient.get(`/api/lectures/${lectureId}/topics`);
