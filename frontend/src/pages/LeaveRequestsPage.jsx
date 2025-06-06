import React, { useEffect, useState, useContext } from 'react';
import { getLeaveRequests, getAllLeaveRequests, getLeaveBalance } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from 'react-router-dom';
import LeaveForm from '../components/LeaveForm';

const LeaveRequestsPage = () => {
  const { authData } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState('');

  // Helper function to safely render values
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') {
      if (value.name && typeof value.name === 'string') return value.name;
      console.warn('Object cannot be safely rendered:', value);
      return fallback;
    }
    return fallback;
  };

  // Get user role from token
  useEffect(() => {
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

  const fetchData = async () => {
    if (!authData?.token) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch personal leave requests for the current user (regardless of role)
      // This page is for personal leave management, not team management
      const requestsResponse = await getLeaveRequests();
      setRequests(requestsResponse.data);
      
      // Fetch leave balance
      const balanceResponse = await getLeaveBalance();
      setLeaveBalance(balanceResponse.data.leaveBalance);
    } catch (error) {
      setError('Error fetching data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authData?.token && userRole) {
      fetchData();
    }
  }, [authData, userRole]);

  const handleLeaveRequestSuccess = () => {
    setShowForm(false);
    fetchData(); 
  };

  if (!authData?.token) {
    return <Navigate to="/login" />;
  }

  // Format date 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Leave Requests</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your personal leave requests and view your leave balance</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'New Leave Request'}
        </button>
      </div>

      {/* Leave Balance Card */}
      {leaveBalance && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">My Leave Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">Annual Leave</p>
              <p className="text-xl font-bold">{leaveBalance.annual || 0} days</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-gray-600">Sick Leave</p>
              <p className="text-xl font-bold">{leaveBalance.sick || 0} days</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <p className="text-sm text-gray-600">Personal Leave</p>
              <p className="text-xl font-bold">{leaveBalance.personal || 0} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Leave Request Form */}
      {showForm && (
        <div className="mb-6">
          <LeaveForm onSuccess={handleLeaveRequestSuccess} />
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Leave Requests Table */}
      {!loading && !error && (
        <>
          {requests.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-center">
              <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Create Your First Leave Request
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((req) => {
                    // Calculate duration in days
                    const start = new Date(req.startDate);
                    const end = new Date(req.endDate);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                    
                    return (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {safeRender(req.leaveType?.name || req.leaveType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(req.startDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(req.endDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {diffDays} day{diffDays !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {req.reason || 'No reason provided'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaveRequestsPage;
