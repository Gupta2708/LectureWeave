import httpClient from '../httpClient';

// Dashboard statistics endpoint.
export const getDashboardStats = () => httpClient.get('/api/dashboard/stats');
