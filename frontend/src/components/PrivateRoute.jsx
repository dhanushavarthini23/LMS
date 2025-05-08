import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importing the AuthContext

// This component wraps the protected routes to ensure only authenticated users can access them.
const PrivateRoute = ({ children }) => {
  const { authData } = useContext(AuthContext); // Accessing the authentication state from context

  if (!authData) {
    // If the user is not authenticated, redirect them to the login page
    return <Navigate to="/login" />;
  }

  // If the user is authenticated, render the protected component (children)
  return children;
};

export default PrivateRoute;
