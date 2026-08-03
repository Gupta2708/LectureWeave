import httpClient from '../httpClient';

// Lecture endpoints.
export const createLecture = (payload) => httpClient.post('/api/lectures/', payload);
