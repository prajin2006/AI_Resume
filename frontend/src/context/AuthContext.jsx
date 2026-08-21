import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexthire_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexthire_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nexthire_token');
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          localStorage.setItem('nexthire_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session expired, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('nexthire_token', res.access_token);
    localStorage.setItem('nexthire_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('nexthire_token', res.access_token);
    localStorage.setItem('nexthire_user', JSON.stringify(res.user));
    return res.user;
  };

  const demoLogin = async () => {
    // Try to register demo user if not existing, or login
    const demoEmail = 'demo.engineer@nexthire.ai';
    const demoPass = 'DemoPassword123!';
    try {
      return await login(demoEmail, demoPass);
    } catch (e) {
      return await register('Alex Mercer', demoEmail, demoPass);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nexthire_token');
    localStorage.removeItem('nexthire_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
