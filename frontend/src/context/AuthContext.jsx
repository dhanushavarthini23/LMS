import React, { createContext, useState, useEffect } from 'react';
import { login as loginApi } from '../api/api';
import { jwtDecode } from 'jwt-decode';
 // Import for token decoding

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      setAuthData({ token });
    } else {
      localStorage.removeItem('token'); // Remove expired token
      setAuthData(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginApi(username, password);
      const { token } = response.data;
      localStorage.setItem('token', token);
      setAuthData({ token });
      return true; 
    } catch (error) {
      console.error('Login failed', error);
      return false; 
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthData(null);
  };

  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <AuthContext.Provider value={{ authData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
