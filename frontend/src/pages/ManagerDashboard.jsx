import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getPendingLeaveRequests, approveLeaveRequestManager, getDashboardData, getEmployees, getAllLeaveRequests } from '../api/api';
import TeamManagement from '../components/TeamManagement';
import LeaveReports from '../components/LeaveReports';
import LeaveCalendar from '../components/LeaveCalendar';
import LeaveForm from '../components/LeaveForm';
import EmployeeForm from '../components/EmployeeForm';

const ManagerDashboard = () => {
  const { authData, logout } = useContext(AuthContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name from token
    if (authData?.token) {
      try {
        const decoded = jwtDecode(authData.token);
        console.log('Decoded token:', decoded); 
        setUserName(decoded.name || decoded.username || 'Manager');
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName('Manager');
      }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard data
        const dashboardResponse = await getDashboardData();
        console.log('Manager Dashboard Response:', dashboardResponse);
        const data = dashboardResponse.data;
        
        
        if (!data) {
          console.error('No data returned from dashboard API');
          setError('Failed to load dashboard data. Please try again later.');
          setLoading(false);
          return;
        }
        
        console.log('Processing manager dashboard data:', data);
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.managerDashboardData && data.managerDashboardData.pendingRequests) {
          setPendingRequests(data.managerDashboardData.pendingRequests);
        } else {
          setPendingRequests([]);
        }
        try {
          const historyResponse = await getAllLeaveRequests();
          if (historyResponse.data) {
            setLeaveHistory(historyResponse.data);
          }
        } catch (error) {
          console.error('Error fetching leave history:', error);
        }
        const approvedCount = data.approvedThisMonth || 
                             (data.managerDashboardData && data.managerDashboardData.approvedThisMonth) || 0;
        
        setDashboardData({
          approvedThisMonth: approvedCount
        });
        
        // Set team members with enhanced data
        const teamMembersData = data.teamMembers || 
                               (data.managerDashboardData && data.managerDashboardData.teamMembers) || [];
        
        if (Array.isArray(teamMembersData)) {
          const enhancedTeamData = teamMembersData.map(employee => ({
            ...employee,
            position: employee.position || employee.role || 'Staff',
            department: employee.department || 'IT',
            onLeave: employee.onLeave || false,
            leaveBalance: employee.leaveBalance !== undefined ? employee.leaveBalance : 20 // Default to 20
          }));
          setTeamMembers(enhancedTeamData);
        } else {
          console.warn('No team members data or invalid format:', teamMembersData);
          setTeamMembers([]);
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
      setLoading(true);
      setError('');
      
      // Call the API to approve the leave request
      const response = await approveLeaveRequestManager(id, true);
      console.log('Approval response:', response);
      
      // Show success message
      setSuccess('Leave request approved successfully.');
      
      // Refresh the dashboard data
      const dashboardResponse = await getDashboardData();
      if (dashboardResponse.data) {
        const data = dashboardResponse.data;
        
        // Set pending requests
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.managerDashboardData && data.managerDashboardData.pendingRequests) {
          setPendingRequests(data.managerDashboardData.pendingRequests);
        }
      }
      
      // Refresh leave history
      const historyResponse = await getAllLeaveRequests();
      if (historyResponse.data) {
        setLeaveHistory(historyResponse.data);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error approving leave request:', error);
      setError('Failed to approve leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      // Call the API to reject the leave request
      const response = await approveLeaveRequestManager(id, false);
      console.log('Rejection response:', response);
      
      // Show success message
      setSuccess('Leave request rejected successfully.');
      
      // Refresh the dashboard data
      const dashboardResponse = await getDashboardData();
      if (dashboardResponse.data) {
        const data = dashboardResponse.data;
        
        // Set pending requests
        if (data.pendingRequests) {
          setPendingRequests(data.pendingRequests);
        } else if (data.managerDashboardData && data.managerDashboardData.pendingRequests) {
          setPendingRequests(data.managerDashboardData.pendingRequests);
        }
      }
      
      // Refresh leave history
      const historyResponse = await getAllLeaveRequests();
      if (historyResponse.data) {
        setLeaveHistory(historyResponse.data);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      setError('Failed to reject leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Formatting the data for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
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
            onClick={() => setActiveTab('request')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'request'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Request Leave
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
      ) : success && activeTab === 'dashboard' ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Team Size Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Team Size</h2>
                  <div className="text-blue-500 font-bold text-2xl">
                    {teamMembers?.length || 0}
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

              {/* Team Members Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">My Team</h2>
                
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No team members found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Balance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamMembers.map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {employee.position}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {employee.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {employee.leaveBalance !== undefined ? employee.leaveBalance : 30} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                employee.onLeave ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {employee.onLeave ? 'On Leave' : 'Available'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingRequests.map((request) => {
                          // Determine if current user can approve this request
                          const canApprove = request.approvals?.some(a => a.level === 'manager' && a.status === 'Pending');
                          
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
                                  request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'Manager Approved' ? 'bg-blue-100 text-blue-800' :
                                  request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {request.status}
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
                                    {request.status === 'HR Approved' ? 'Waiting for HR approval' : 
                                     request.status === 'Manager Approved' ? 'Approved by you' : 
                                     'Waiting for approval'}
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

          {/* Request Leave Tab */}
          {activeTab === 'request' && (
            <LeaveForm 
              onSuccess={() => {
                // Refresh the dashboard data after submitting a request
                const fetchData = async () => {
                  try {
                    // Fetch all leave requests for history
                    const historyResponse = await getAllLeaveRequests();
                    if (historyResponse.data) {
                      setLeaveHistory(historyResponse.data);
                    }
                  } catch (error) {
                    console.error('Error fetching leave history:', error);
                  }
                };
                fetchData();
              }}
            />
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Employee Management</h2>
                <button
                  onClick={() => setShowAddEmployee(!showAddEmployee)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  {showAddEmployee ? (
                    <>
                      <span className="mr-2">Cancel</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Add Employee</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              
              {showAddEmployee ? (
                <EmployeeForm 
                  onSuccess={() => {
                    setShowAddEmployee(false);
                    // Refresh employee list
                    const fetchEmployees = async () => {
                      try {
                        const response = await getEmployees();
                        const enhancedTeamData = response.data.map(employee => ({
                          ...employee,
                          position: employee.position || employee.role || 'Staff',
                          department: employee.department || 'General',
                          leaveBalance: employee.leaveBalance !== undefined ? employee.leaveBalance : 20
                        }));
                        setTeamMembers(enhancedTeamData);
                      } catch (error) {
                        console.error('Error fetching employees:', error);
                      }
                    };
                    fetchEmployees();
                  }}
                />
              ) : (
                <TeamManagement />
              )}
            </div>
          )}

          {/* Team Management Tab */}
          {activeTab === 'team' && <TeamManagement />}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <LeaveCalendar />}

          {/* Reports Tab */}
          {activeTab === 'reports' && <LeaveReports />}

        </>
      )}
    </div>
  );
};

export default ManagerDashboard;