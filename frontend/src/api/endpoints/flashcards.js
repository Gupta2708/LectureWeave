import httpClient from '../httpClient';
export const generateFlashcards = (subjectId, payload = {}) => httpClient.post(`/api/subjects/${subjectId}/flashcards/generate`, payload);
export const getFlashcards = (subjectId) => httpClient.get(`/api/subjects/${subjectId}/flashcards`);
export const deleteFlashcard = (cardId) => httpClient.delete(`/api/flashcards/${cardId}`);
