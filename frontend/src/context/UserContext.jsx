'use client'; // Required since this context uses React state/effects

import { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '@/lib/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the current logged in user from backend
  const fetchUser = async () => {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const loginWithGoogle = async (token) => {
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setUser(data.user);
    } catch (err) {
      throw new Error(err.message || 'Google Login failed');
    }
  };

  const register = async (name, email, password) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
