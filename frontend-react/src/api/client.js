import axios from 'axios';

/** Base URL for API calls; in local dev, unset uses '/api' (see dev server config). */
export function resolveApiBase(raw) {
  const v = (raw ?? '').trim();
  if (!v) return '/api';
  let base = v.replace(/\/$/, '');
  if (base.endsWith('/api')) return base;
  return `${base}/api`;
}

const baseURL = resolveApiBase(import.meta.env.VITE_API_BASE);

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/** Legacy helper — prefer Authorization set in request interceptor from storage. */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export const ECOM_JWT_STORAGE_KEY = 'ecom_jwt';

export function getStoredJwt() {
  return localStorage.getItem(ECOM_JWT_STORAGE_KEY) || sessionStorage.getItem(ECOM_JWT_STORAGE_KEY);
}

export function clearAllJwtStorage() {
  localStorage.removeItem(ECOM_JWT_STORAGE_KEY);
  sessionStorage.removeItem(ECOM_JWT_STORAGE_KEY);
}

/** @param {boolean} useLocalStorage true = persist (remember me), false = session only */
export function persistJwt(token, useLocalStorage) {
  clearAllJwtStorage();
  if (!token) return;
  if (useLocalStorage) {
    localStorage.setItem(ECOM_JWT_STORAGE_KEY, token);
  } else {
    sessionStorage.setItem(ECOM_JWT_STORAGE_KEY, token);
  }
}

api.interceptors.request.use(
  (config) => {
    const token = getStoredJwt();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

let refreshPromise = null;

/** Optional token refresh hook for the HTTP client. */
export function scheduleTokenRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = Promise.resolve(null);
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        await scheduleTokenRefresh();
        const token = getStoredJwt();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        /* fall through */
      }
      clearAllJwtStorage();
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);
