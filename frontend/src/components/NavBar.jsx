import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const NavBar = () => {
  const { authData, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <div className="bg-indigo-600 text-white p-2 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-indigo-600 text-xl font-bold">LeaveEase</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center">
            {authData && (
              <div className="ml-10 flex items-baseline space-x-1">
                <Link 
                  to="/leave-requests" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/leave-requests') 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  Leave Requests
                </Link>
                
                {userRole === 'HR' && (
                  <Link 
                    to="/hr-dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/hr-dashboard') 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    HR Dashboard
                  </Link>
                )}
                
                {userRole === 'Manager' && (
                  <Link 
                    to="/manager-dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/manager-dashboard') 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    Manager Dashboard
                  </Link>
                )}
                
                {userRole === 'Employee' && (
                  <Link 
                    to="/employee-dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/employee-dashboard') 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    My Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
          
          {/* User profile dropdown */}
          {authData ? (
            <div className="ml-4 flex items-center md:ml-6" ref={dropdownRef}>
              {/* Notifications */}
              <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="ml-2 text-gray-700 hidden md:block">{userName || 'User'}</span>
                      <svg className="ml-1 h-5 w-5 text-gray-400 hidden md:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <p className="font-medium">{userName || 'User'}</p>
                      <p className="text-gray-500">{userRole || 'User'}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Link 
                to="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Login
              </Link>
            </div>
          )}
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
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
        <div className="md:hidden bg-white border-b border-gray-200">
          {authData ? (
            <div className="pt-2 pb-3 space-y-1">
              <Link 
                to="/leave-requests" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/leave-requests') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Leave Requests
              </Link>
              
              {userRole === 'HR' && (
                <Link 
                  to="/hr-dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/hr-dashboard') 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  HR Dashboard
                </Link>
              )}
              
              {userRole === 'Manager' && (
                <Link 
                  to="/manager-dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/manager-dashboard') 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manager Dashboard
                </Link>
              )}
              
              {userRole === 'Employee' && (
                <Link 
                  to="/employee-dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/employee-dashboard') 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Dashboard
                </Link>
              )}
              
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4 py-2">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                      {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{userName || 'User'}</div>
                    <div className="text-sm font-medium text-gray-500">{userRole || 'User'}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 px-3">
              <Link 
                to="/login" 
                className="block text-center w-full px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
