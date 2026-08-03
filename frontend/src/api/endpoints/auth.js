import httpClient from '../httpClient';

// Authentication endpoints. Each returns the raw axios response so callers can
// read `response.data` as before.
export const login = (email, password) =>
  httpClient.post('/api/auth/login', { email, password });

export const register = (email, password, username) =>
  httpClient.post('/api/auth/register', { email, password, username });

export const verifyToken = (token) =>
  httpClient.post(
    '/api/auth/verify',
    {},
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
