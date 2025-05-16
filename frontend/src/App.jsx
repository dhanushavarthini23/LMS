import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import ManagerDashboard from './pages/ManagerDashboard';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute'; // Protecting routes
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import UserProfile from './pages/UserProfile';
const App = () => {
  return (
    <Router>
  <div className="min-h-screen flex flex-col bg-gray-100">
    <NavBar />
    <main className="flex-grow p-6">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        {/* Admin dashboard route removed as it doesn't exist in the backend */}
        <Route
          path="/leave-requests"
          element={
            <PrivateRoute allowedRoles={['HR', 'Manager', 'Employee']}>
              <LeaveRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <PrivateRoute allowedRoles={['Employee']}>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <PrivateRoute allowedRoles={['HR']}>
              <HRDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <PrivateRoute allowedRoles={['Manager']}>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute allowedRoles={['HR', 'Manager', 'Employee']}>
              <UserProfile />
            </PrivateRoute>
          }
        />
      </Routes>
    </main>
  </div>
</Router>

  );
};

export default App;
