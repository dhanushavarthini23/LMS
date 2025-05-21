import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getPendingLeaveRequests, approveLeaveRequestHR, getDashboardData, getEmployees, getAllLeaveRequests } from '../api/api';
import TeamManagement from '../components/TeamManagement';
import LeaveReports from '../components/LeaveReports';
import LeaveCalendar from '../components/LeaveCalendar';
import LeavePolicies from '../components/LeavePolicies';

const HRDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (authData?.token) {
      try {
        const decoded = jwtDecode(authData.token);
        console.log('Decoded token:', decoded); 
        setUserName(decoded.name || decoded.username || 'HR Manager');
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName('HR Manager');
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardResponse = await getDashboardData();
        console.log('HR Dashboard Response:', dashboardResponse);
        const data = dashboardResponse.data;
        
        
        if (!data) {
          console.error('No data returned from dashboard API');
          setError('Failed to load dashboard data. Please try again later.');
          setLoading(false);
          return;
        }
        
        console.log('Processing HR dashboard data:', data);
        
       
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.hrDashboardData && data.hrDashboardData.pendingRequests) {
          setPendingRequests(data.hrDashboardData.pendingRequests);
        } else {
          setPendingRequests([]);
        }
        
        // Fetch all leave requests for history
        try {
          const historyResponse = await getAllLeaveRequests();
          if (historyResponse.data) {
            setLeaveHistory(historyResponse.data);
          }
        } catch (error) {
          console.error('Error fetching leave history:', error);
        }
        
        // Set dashboard data
        const approvedCount = data.approvedThisMonth || 
                             (data.hrDashboardData && data.hrDashboardData.approvedThisMonth) || 0;
        
        setDashboardData({
          approvedThisMonth: approvedCount
        });
        
        // Set all employees with enhanced data
        const employeesData = data.allEmployees || 
                             (data.hrDashboardData && data.hrDashboardData.allEmployees) || [];
        
        if (Array.isArray(employeesData)) {
          const enhancedEmployeeData = employeesData.map(employee => ({
            ...employee,
            position: employee.position || employee.role || 'Staff',
            department: employee.department || 'General',
            onLeave: employee.onLeave || false,
            leaveBalance: employee.leaveBalance !== undefined ? employee.leaveBalance : 20 // Default to 20
          }));
          setEmployees(enhancedEmployeeData);
        } else {
          console.warn('No employees data or invalid format:', employeesData);
          setEmployees([]);
        }
        
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

  const handleApprove = async (id) => {
    try {
      await approveLeaveRequestHR(id, true);
      
      // Refresh the dashboard data
      const dashboardResponse = await getDashboardData();
      if (dashboardResponse.data) {
        const data = dashboardResponse.data;
        
        // Set pending requests
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.hrDashboardData && data.hrDashboardData.pendingRequests) {
          setPendingRequests(data.hrDashboardData.pendingRequests);
        }
      }
      
      // Refresh leave history
      const historyResponse = await getAllLeaveRequests();
      if (historyResponse.data) {
        setLeaveHistory(historyResponse.data);
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      setError('Failed to approve leave request. Please try again.');
    }
  };

  const handleReject = async (id) => {
    try {
      await approveLeaveRequestHR(id, false);
      
      // Refresh the dashboard data
      const dashboardResponse = await getDashboardData();
      if (dashboardResponse.data) {
        const data = dashboardResponse.data;
        
        // Set pending requests
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.hrDashboardData && data.hrDashboardData.pendingRequests) {
          setPendingRequests(data.hrDashboardData.pendingRequests);
        }
      }
      
      // Refresh leave history
      const historyResponse = await getAllLeaveRequests();
      if (historyResponse.data) {
        setLeaveHistory(historyResponse.data);
      }
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
        <div>
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <p className="text-gray-600">Welcome, {userName}</p>
        </div>
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
            onClick={() => setActiveTab('employees')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leave Calendar
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
            onClick={() => setActiveTab('policies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Policies
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
                    {employees?.length || 0}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Approval</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingRequests.map((request) => {
                          
                          const managerApproved = request.approvals?.some(a => a.level === 'manager' && a.status === 'Approved') || request.status === 'Manager Approved';
                          
                          // HR can approve if:
                          // 1. The request has been approved by a manager (for regular employees)
                          // 2. OR the request is from a manager (managers don't need manager approval)
                          const isManagerRequest = request.employee?.role === 'Manager';
                          const canApprove = (managerApproved || isManagerRequest) && request.status !== 'Approved' && request.status !== 'Rejected';
                          
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
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  managerApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {managerApproved ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {canApprove ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleApprove(request.id)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReject(request.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-sm">
                                    {request.status === 'Approved' ? 'Already approved' : 
                                     request.status === 'Rejected' ? 'Already rejected' :
                                     !managerApproved && !isManagerRequest ? 'Waiting for manager approval' :
                                     'Waiting for HR approval'}
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

              {/* Leave History Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Leave Request History</h2>
                
                {leaveHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No leave request history.
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leaveHistory.map((request) => (
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
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                request.status === 'Manager Approved' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && <TeamManagement />}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <LeaveCalendar />}

          {/* Reports Tab */}
          {activeTab === 'reports' && <LeaveReports />}

          {/* Policies Tab */}
          {activeTab === 'policies' && <LeavePolicies />}
        </>
      )}
    </div>
  );
};

export default HRDashboard;