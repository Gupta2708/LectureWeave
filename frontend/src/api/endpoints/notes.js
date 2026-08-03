import httpClient from '../httpClient';

// Saved-notes endpoints.
export const getMyNotes = () => httpClient.get('/api/notes/my-notes');
