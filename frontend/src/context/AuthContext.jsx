import React, { createContext, useState, useContext, useEffect } from 'react';
import * as api from '../services/api';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Login function - calls backend API
  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  // Google Login function
  const googleLogin = async (userData) => {
    try {
      const response = await api.googleAuth({
        name: userData.name,
        email: userData.email,
        googleId: userData.googleId
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      console.error('Google login error:', err);
      return { success: false, error: 'Google login failed' };
    }
  };

  // Register function - calls backend API
  const register = async (userData) => {
    try {
      const response = await api.register(userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      console.error('Register error:', err);
      const errorMsg = err.response?.data?.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
