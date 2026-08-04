// Centralised access to Vite environment configuration.
//
// Every network base URL in the app is derived from here so that no page or
// component hard-codes a backend host. Values come from Vite env variables
// (see frontend/.env.example); safe localhost defaults keep the app booting
// when a .env file is absent during local development.

const stripTrailingSlashes = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : value;

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const rawWsBaseUrl = import.meta.env.VITE_WS_BASE_URL;

const API_BASE_URL = stripTrailingSlashes(rawApiBaseUrl) || 'http://localhost:8000';
const WS_BASE_URL = stripTrailingSlashes(rawWsBaseUrl) || 'ws://localhost:8000';
const APP_NAME = import.meta.env.VITE_APP_NAME || 'LectureWeave';

// Surface missing configuration loudly in development instead of silently
// falling back, so misconfiguration is caught early. We warn rather than throw
// to keep `npm run build` and a no-.env first run working.
if (import.meta.env.DEV) {
  if (!rawApiBaseUrl) {
    console.warn(
      '[environment] VITE_API_BASE_URL is not set — defaulting to http://localhost:8000. ' +
        'Copy frontend/.env.example to frontend/.env and set it.'
    );
  }
  if (!rawWsBaseUrl) {
    console.warn(
      '[environment] VITE_WS_BASE_URL is not set — defaulting to ws://localhost:8000.'
    );
  }
}

export const environment = { API_BASE_URL, WS_BASE_URL, APP_NAME };

export default environment;
