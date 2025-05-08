import React, { createContext, useState, useEffect } from 'react';
import { login as loginApi } from '../api/api';
import * as jwt_decode from 'jwt-decode'; // Optional, if you want to decode the token and check expiry

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to wait for token

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now(); // token expiration time in ms
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
      return true; // ✅ Login succeeded
    } catch (error) {
      console.error('Login failed', error);
      return false; // ❌ Login failed
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthData(null);
  };

  if (loading) {
    return <div>Loading...</div>; // Show loading spinner or message while checking auth state
  }

  return (
    <AuthContext.Provider value={{ authData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
