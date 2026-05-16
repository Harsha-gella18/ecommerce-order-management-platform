import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  setAuthToken,
  ECOM_JWT_STORAGE_KEY,
  getStoredJwt,
  clearAllJwtStorage,
  persistJwt,
} from '../api/client.js';

const AuthContext = createContext(null);

function readInitialToken() {
  return getStoredJwt();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readInitialToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAllJwtStorage();
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const refreshProfile = useCallback(
    async (t) => {
      if (!t) {
        setUser(null);
        setLoading(false);
        return;
      }
      setAuthToken(t);
      try {
        const { data } = await api.get('/auth/validate', {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (data.valid) {
          setUser({ id: data.userId, email: data.email, role: data.role });
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    refreshProfile(token);
  }, [token, refreshProfile]);

  const login = useCallback(async (email, password, rememberMe = true) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistJwt(data.token, rememberMe);
    setToken(data.token);
    setUser({ id: data.userId, email: data.email, role: data.role });
    setAuthToken(data.token);
    return data;
  }, []);

  const signup = useCallback(async (payload, rememberMe = true) => {
    const { data } = await api.post('/auth/signup', payload);
    persistJwt(data.token, rememberMe);
    setToken(data.token);
    setUser({ id: data.userId, email: data.email, role: data.role });
    setAuthToken(data.token);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAdmin: user?.role === 'ADMIN',
      login,
      signup,
      logout,
    }),
    [token, user, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ECOM_JWT_STORAGE_KEY };
