import httpClient from '../httpClient';

export const createMarker = (lectureId, payload) => httpClient.post(`/api/lectures/${lectureId}/markers`, payload);
export const getMarkers = (lectureId) => httpClient.get(`/api/lectures/${lectureId}/markers`);
export const deleteMarker = (markerId) => httpClient.delete(`/api/markers/${markerId}`);
