import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importing the AuthContext

// This component wraps the protected routes to ensure only authenticated users with the correct role can access them.
const PrivateRoute = ({ children, allowedRoles }) => {
  const { authData } = useContext(AuthContext); // Accessing the authentication state from context
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

  // If allowedRoles is specified, check if the user has the required role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // If the user doesn't have the required role, redirect them to their appropriate dashboard
    if (userRole === 'HR') {
      return <Navigate to="/hr-dashboard" />;
    } else if (userRole === 'Manager') {
      return <Navigate to="/manager-dashboard" />;
    } else {
      return <Navigate to="/employee-dashboard" />;
    }
  }

  // If the user is authenticated and has the required role (or no role is required), render the protected component
  return children;
};

export default PrivateRoute;
