import httpClient from '../httpClient';
export const createChatSession = (subjectId, title) => httpClient.post(`/api/subjects/${subjectId}/chat/sessions`, { title });
export const sendChatMessage = (sessionId, content) => httpClient.post(`/api/chat/sessions/${sessionId}/messages`, { content });
