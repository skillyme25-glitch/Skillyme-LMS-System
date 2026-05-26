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

// Guard so multiple concurrent 401s only trigger one redirect
let isRedirecting = false;

// Called by intentional logout so the guard resets for future sessions
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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          forceLogout();
        }
      } else if (window.location.pathname !== '/login') {
        // Only redirect if not already on the login page to prevent loops
        forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
