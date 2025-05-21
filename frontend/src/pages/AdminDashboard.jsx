import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getPendingLeaveRequests, approveLeaveRequestManager, approveLeaveRequestHR, getDashboardData } from '../api/api';
import TeamManagement from '../components/TeamManagement';
import LeaveReports from '../components/LeaveReports';
import DelegateAuthority from '../components/DelegateAuthority';

const AdminDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    // Decode JWT to get user 
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch pending leave requests
        const pendingResponse = await getPendingLeaveRequests();
        setPendingRequests(pendingResponse.data);
        
        // Fetch dashboard data
        const dashboardResponse = await getDashboardData();
        setDashboardData(dashboardResponse.data);
        
        setError('');
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (authData?.token) {
      fetchData();
    }
  }, [authData]);

  const handleApprove = async (id, level) => {
    try {
      if (level === 'manager' || userRole === 'Manager') {
        await approveLeaveRequestManager(id, true);
      } else if (level === 'hr' || userRole === 'HR') {
        await approveLeaveRequestHR(id, true);
      }
      
      // Refresh the pending requests
      const response = await getPendingLeaveRequests();
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error approving leave request:', error);
      setError('Failed to approve leave request. Please try again.');
    }
  };

  const handleReject = async (id, level) => {
    try {
      if (level === 'manager' || userRole === 'Manager') {
        await approveLeaveRequestManager(id, false);
      } else if (level === 'hr' || userRole === 'HR') {
        await approveLeaveRequestHR(id, false);
      }
      
      // Refresh the pending requests
      const response = await getPendingLeaveRequests();
      setPendingRequests(response.data);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      setError('Failed to reject leave request. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {userRole === 'HR' ? 'HR Dashboard' : 'Manager Dashboard'}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team Management
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('delegate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'delegate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Delegate Authority
          </button>
        </nav>
      </div>

      {loading && activeTab === 'dashboard' ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error && activeTab === 'dashboard' ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Employees Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Total Employees</h2>
                  <div className="text-blue-500 font-bold text-2xl">
                    {dashboardData?.totalEmployees || 0}
                  </div>
                </div>

                {/* Pending Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
                  <div className="text-yellow-500 font-bold text-2xl">
                    {pendingRequests?.length || 0}
                  </div>
                </div>

                {/* Approved Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Approved This Month</h2>
                  <div className="text-green-500 font-bold text-2xl">
                    {dashboardData?.approvedThisMonth || 0}
                  </div>
                </div>
              </div>

              {/* Pending Leave Requests Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Pending Leave Requests</h2>
                
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending leave requests.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingRequests.map((request) => {
                          // Determine if current user can approve this request
                          const canApprove = 
                            (userRole === 'Manager' && request.approvals?.some(a => a.level === 'manager' && a.status === 'Pending')) ||
                            (userRole === 'HR' && request.approvals?.some(a => a.level === 'hr' && a.status === 'Pending'));
                          
                          return (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {request.employee?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {request.leaveType || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {formatDate(request.startDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {formatDate(request.endDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.reason || 'No reason provided'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {canApprove ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleApprove(request.id, userRole === 'Manager' ? 'manager' : 'hr')}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(request.id, userRole === 'Manager' ? 'manager' : 'hr')}
                                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">
                                    {userRole === 'Manager' ? 'Waiting for manager approval' : 'Waiting for HR approval'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Team Management Tab */}
          {activeTab === 'team' && <TeamManagement />}

          {/* Reports Tab */}
          {activeTab === 'reports' && <LeaveReports />}

          {/* Delegate Authority Tab */}
          {activeTab === 'delegate' && <DelegateAuthority />}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
