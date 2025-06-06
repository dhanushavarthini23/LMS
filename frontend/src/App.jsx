import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';

// Layout wrapper component
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col ${isLoginPage ? '' : 'bg-gray-50'}`}>
      {!isLoginPage && <NavBar />}
      <main className={`flex-grow ${isLoginPage ? '' : 'p-6'}`}>
        {children}
      </main>
      {!isLoginPage && (
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-6 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} LeaveEase. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <AppLayout>
            <Login />
          </AppLayout>
        } />
        <Route path="/login" element={
          <AppLayout>
            <Login />
          </AppLayout>
        } />
        <Route
          path="/leave-requests"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['HR', 'Manager', 'Employee', 'Admin']}>
                <LeaveRequestsPage />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['Employee']}>
                <EmployeeDashboard />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['HR']}>
                <HRDashboard />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['Manager']}>
                <ManagerDashboard />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['HR', 'Manager', 'Employee', 'Admin']}>
                <UserProfile />
              </PrivateRoute>
            </AppLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AppLayout>
              <PrivateRoute allowedRoles={['HR', 'Manager', 'Employee', 'Admin']}>
                <Settings />
              </PrivateRoute>
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
