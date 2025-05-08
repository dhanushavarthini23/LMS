import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavBar = () => {
  const { authData, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Use the logout function from context
    navigate('/login');
  };

  return (
    <nav className="bg-blue-500 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold">
          Leave Management
        </Link>
        <div className="space-x-4">
          {authData ? (
            <>
              {authData.role === 'admin' && (
                <Link to="/admin-dashboard" className="text-white">
                  Admin Dashboard
                </Link>
              )}
              {authData.role === 'employee' && (
                <Link to="/employee-dashboard" className="text-white">
                  Employee Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-white bg-red-500 px-4 py-2 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
