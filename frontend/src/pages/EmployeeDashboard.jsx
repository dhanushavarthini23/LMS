import React from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveForm from '../components/LeaveForm';
import LeaveHistory from '../components/LeaveHistory';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employee Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <LeaveForm />

      <h3 className="text-lg font-semibold mt-8">Leave History</h3>
      <LeaveHistory />
    </div>
  );
};

export default EmployeeDashboard;
