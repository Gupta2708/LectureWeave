import httpClient from '../httpClient';

export const updateTranscript = (segmentId, corrected_text) =>
  httpClient.patch(`/api/transcripts/${segmentId}`, { corrected_text });
export const restoreTranscript = (segmentId) => httpClient.post(`/api/transcripts/${segmentId}/restore`);
