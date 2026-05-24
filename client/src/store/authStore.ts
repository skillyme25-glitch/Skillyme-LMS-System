import type { AuthUser } from '../types';

// Simple module-level store with localStorage persistence
let _user: AuthUser | null = JSON.parse(localStorage.getItem('user') || 'null');
let _token: string | null = localStorage.getItem('accessToken');
const subscribers: Set<() => void> = new Set();

function notify() {
  subscribers.forEach((fn) => fn());
}

export const authStore = {
  getUser: (): AuthUser | null => _user,
  getToken: (): string | null => _token,

  setAuth(user: AuthUser, accessToken: string, refreshToken: string) {
    _user = user;
    _token = accessToken;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    notify();
  },

  setUser(user: AuthUser) {
    _user = user;
    localStorage.setItem('user', JSON.stringify(user));
    notify();
  },

  clearAuth() {
    _user = null;
    _token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    notify();
  },

  subscribe(fn: () => void): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
