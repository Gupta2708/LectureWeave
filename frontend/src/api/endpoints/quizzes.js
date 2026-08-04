import httpClient from '../httpClient';
export const generateQuiz = (subjectId, payload) => httpClient.post(`/api/subjects/${subjectId}/quizzes/generate`, payload);
export const submitQuiz = (quizId, answers) => httpClient.post(`/api/quizzes/${quizId}/submit`, { answers });
