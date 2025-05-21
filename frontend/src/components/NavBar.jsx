import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavBar = () => {
  const { authData, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Decode JWT to get user role and name
    if (authData?.token) {
      try {
        const base64Url = authData.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        setUserRole(decoded.role || '');
        setUserName(decoded.name || decoded.username || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, [authData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">Leave Management</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center">
            <div className="ml-10 flex items-baseline space-x-4">
              {authData ? (
                <>
                  <Link 
                    to="/leave-requests" 
                    className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/leave-requests')}`}
                  >
                    Leave Requests
                  </Link>
                  
                  {userRole === 'HR' && (
                    <Link 
                      to="/hr-dashboard" 
                      className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/hr-dashboard')}`}
                    >
                      HR Dashboard
                    </Link>
                  )}
                  
                  {userRole === 'Manager' && (
                    <Link 
                      to="/manager-dashboard" 
                      className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/manager-dashboard')}`}
                    >
                      Manager Dashboard
                    </Link>
                  )}
                  
                  {userRole === 'Employee' && (
                    <Link 
                      to="/employee-dashboard" 
                      className={`text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/employee-dashboard')}`}
                    >
                      My Dashboard
                    </Link>
                  )}
                  
                  <div className="ml-4 relative flex-shrink-0 flex items-center">
                    <div className="text-sm text-white mr-4">
                      Welcome, {userName || 'User'}
                    </div>
                    <Link 
                      to="/profile" 
                      className="text-white mr-4 hover:text-blue-200"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none"
            >
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {authData ? (
              <>
                <Link 
                  to="/leave-requests" 
                  className={`text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/leave-requests')}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Leave Requests
                </Link>
                
                {/* Admin role removed as it doesn't exist in the backend */}
                
                {userRole === 'HR' && (
                  <Link 
                    to="/hr-dashboard" 
                    className={`text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/hr-dashboard')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    HR Dashboard
                  </Link>
                )}
                
                {userRole === 'Manager' && (
                  <Link 
                    to="/manager-dashboard" 
                    className={`text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/manager-dashboard')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Manager Dashboard
                  </Link>
                )}
                
                {userRole === 'Employee' && (
                  <Link 
                    to="/employee-dashboard" 
                    className={`text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/employee-dashboard')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                )}
                
                <div className="pt-4 pb-3 border-t border-blue-700">
                  <div className="flex items-center px-5">
                    <div className="text-base font-medium text-white">
                      {userName || 'User'}
                    </div>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
