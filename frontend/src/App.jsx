import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute'; // Protecting routes
import LeaveRequestsPage from './pages/LeaveRequestsPage'; 
const App = () => {
  return (
    <Router>
      <NavBar /> 
      <div className="p-6">
        
        <Routes>
        <Route path="/login" element={<Login />} />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
  path="/leave-requests"
  element={
    <PrivateRoute>
      <LeaveRequestsPage />
    </PrivateRoute>
  }/>
          <Route
            path="/employee-dashboard"
            element={
              <PrivateRoute>
                <EmployeeDashboard />
              </PrivateRoute>
            }
          />
          {/* Add more routes here if needed */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
