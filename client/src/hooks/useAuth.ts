import { useState, useEffect } from 'react';
import { authStore } from '../store/authStore';
import type { AuthUser } from '../types';

export function useAuth(): { user: AuthUser | null; isLoading: boolean } {
  const [user, setUser] = useState<AuthUser | null>(authStore.getUser());
  const [isLoading] = useState(false);

  useEffect(() => {
    return authStore.subscribe(() => {
      setUser(authStore.getUser());
    });
  }, []);

  return { user, isLoading };
}
