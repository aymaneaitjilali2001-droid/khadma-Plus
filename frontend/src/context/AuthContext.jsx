import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }

  async function register(fullName, email, password, role) {
    const { data } = await apiClient.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      role,
    });
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await apiClient.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
