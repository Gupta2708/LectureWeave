import axios from 'axios';
import { environment } from '../config/environment';

// Browser storage keys for the JWT and cached user.
export const TOKEN_STORAGE_KEY = 'lectureweave_token';
export const USER_STORAGE_KEY = 'lectureweave_user';

// Single configured HTTP client for the whole app. Base URL comes from the
// environment module; no component should create its own axios instance or
// hard-code a host.
const httpClient = axios.create({
  baseURL: environment.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Required when the backend is served through an ngrok tunnel; harmless
    // against a normal backend.
    'ngrok-skip-browser-warning': 'true',
  },
});

// Attach the JWT access token (when present) and let the browser set the correct
// multipart boundary for FormData uploads.
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Consistent handling of unauthorised responses: clear a dead session so route
// guards send the user back to login. We deliberately avoid a hard redirect here
// to keep this module free of routing concerns.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
