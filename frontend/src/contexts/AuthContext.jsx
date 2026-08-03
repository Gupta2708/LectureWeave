import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authApi from '../api/endpoints/auth';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/httpClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Verify token is still valid
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await authApi.verifyToken(tokenToVerify);

      if (response.data.valid) {
        setUser(response.data.user);
        setLoading(false);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        setToken(newToken);
        setUser(newUser);

        // Store in localStorage
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (email, password, username) => {
    try {
      const response = await authApi.register(email, password, username);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;

        setToken(newToken);
        setUser(newUser);

        // Store in localStorage
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

        return { success: true };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setLoading(false);
  };

  const getAuthHeader = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    getAuthHeader,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
