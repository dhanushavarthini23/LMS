import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; 
const PrivateRoute = ({ children, allowedRoles }) => {
  const { authData } = useContext(AuthContext); 
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Decode JWT to get user role
    if (authData?.token) {
      try {
        const base64Url = authData.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        setUserRole(decoded.role || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [authData]);

  if (!authData) {
    // If the user is not authenticated, redirect them to the login page
    return <Navigate to="/login" />;
  }

  // If allowedRoles is specified, check for the specific roles
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'HR') {
      return <Navigate to="/hr-dashboard" />;
    } else if (userRole === 'Manager') {
      return <Navigate to="/manager-dashboard" />;
    } else {
      return <Navigate to="/employee-dashboard" />;
    }
  }
  return children;
};

export default PrivateRoute;
