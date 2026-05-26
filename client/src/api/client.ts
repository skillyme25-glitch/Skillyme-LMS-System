import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Guard: only one forced logout redirect fires even if many 401s arrive
let isRedirecting = false;

// Deduplicates concurrent refreshes: all simultaneous 401s share one call
let refreshPromise: Promise<string> | null = null;

export function resetRedirectGuard(): void {
  isRedirecting = false;
}

function forceLogout() {
  if (isRedirecting) return;
  isRedirecting = true;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  toast.error('Session expired, please log in again');
  window.location.href = '/login';
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
    { refreshToken }
  );
  localStorage.setItem('accessToken', data.accessToken);
  return data.accessToken as string;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const hasRefreshToken = !!localStorage.getItem('refreshToken');

      if (hasRefreshToken) {
        try {
          // All concurrent 401s share one refresh instead of each firing their own.
          // Without this, refresh token rotation invalidates the first refresh and
          // all subsequent calls fail, causing a reload loop on returning users.
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          const newToken = await refreshPromise;
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          forceLogout();
        }
      } else if (window.location.pathname !== '/login') {
        forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
