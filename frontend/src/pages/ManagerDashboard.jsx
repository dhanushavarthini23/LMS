import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getPendingLeaveRequests, approveLeaveRequestManager, getDashboardData, getEmployees, getAllLeaveRequests ,getEmployeeLeaveBalances} from '../api/api';
import TeamManagement from '../components/TeamManagement';
import LeaveReports from '../components/LeaveReports';
import LeaveCalendar from '../components/LeaveCalendar';
import LeaveForm from '../components/LeaveForm';
import EmployeeForm from '../components/EmployeeForm';
import LeaveHistory from '../components/LeaveHistory';

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
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    leaveType: '',
    dateRange: '',
    searchTerm: ''
  });
  const navigate = useNavigate();
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
          console.log('Setting pending requests:', data.pendingRequests);
          console.log('Sample pending request structure:', data.pendingRequests[0]);
          setPendingRequests(data.pendingRequests);
        } else if (data.managerDashboardData && data.managerDashboardData.pendingRequests) {
          console.log('Setting pending requests from managerDashboardData:', data.managerDashboardData.pendingRequests);
          console.log('Sample pending request structure:', data.managerDashboardData.pendingRequests[0]);
          setPendingRequests(data.managerDashboardData.pendingRequests);
        } else {
          console.log('No pending requests found');
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
          console.log('Team members data:', teamMembersData);
          console.log('Sample team member structure:', teamMembersData[0]);
          const enhancedTeamData = teamMembersData.map(employee => ({
            ...employee,
            position: employee.position || employee.role || 'Staff',
            department: employee.department?.name || employee.department || 'General',
            onLeave: employee.onLeave || false,
            annualLeaveBalance: employee.annualLeaveBalance || 20,
            sickLeaveBalance: employee.sickLeaveBalance || 10,
            personalLeaveBalance: employee.personalLeaveBalance || 5,
            totalLeaveBalance: (employee.annualLeaveBalance || 20) + (employee.sickLeaveBalance || 10) + (employee.personalLeaveBalance || 5)
          }));
          console.log('Enhanced team data:', enhancedTeamData);
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

  // Filter functions
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      department: '',
      status: '',
      leaveType: '',
      dateRange: '',
      searchTerm: ''
    });
  };

  // Apply filters to data
  const getFilteredPendingRequests = () => {
    return pendingRequests.filter(request => {
      console.log('Filtering request:', request);
      
      const employeeName = request.employee?.name || request.employeeName || '';
      const matchesSearch = !filters.searchTerm || 
        employeeName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (request.reason && request.reason.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const matchesStatus = !filters.status || request.status === filters.status;
      
      // Handle different leaveType structures
      const leaveTypeName = request.leaveType?.name || request.leaveType || request.leaveTypeName || '';
      const matchesLeaveType = !filters.leaveType || leaveTypeName === filters.leaveType;
      
      // Handle different department structures
      const departmentName = request.employee?.department?.name || 
                           request.employee?.department || 
                           request.department?.name || 
                           request.department || 
                           request.employeeDepartment || '';
      const matchesDepartment = !filters.department || departmentName === filters.department;

      console.log('Filter results:', {
        matchesSearch,
        matchesStatus,
        matchesLeaveType,
        matchesDepartment,
        leaveTypeName,
        departmentName
      });

      return matchesSearch && matchesStatus && matchesLeaveType && matchesDepartment;
    });
  };

  const getFilteredTeamMembers = () => {
    return teamMembers.filter(member => {
      console.log('Filtering team member:', member);
      
      const memberName = member.name || member.fullName || '';
      const memberEmail = member.email || '';
      const matchesSearch = !filters.searchTerm || 
        memberName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        memberEmail.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      // Handle different department structures
      const departmentName = member.department?.name || member.department || '';
      const matchesDepartment = !filters.department || departmentName === filters.department;

      console.log('Team member filter results:', {
        matchesSearch,
        matchesDepartment,
        departmentName
      });

      return matchesSearch && matchesDepartment;
    });
  };

  // Get unique values for filter options
  const getUniqueValues = (array, key) => {
    console.log('Getting unique values for key:', key, 'from array:', array);
    const values = [];
    
    array.forEach(item => {
      let value = null;
      
      if (key === 'department.name') {
        // Handle department name extraction
        value = item.department?.name || 
                item.department || 
                item.employeeDepartment ||
                item.employee?.department?.name || 
                item.employee?.department;
      } else if (key === 'leaveType.name') {
        // Handle leave type name extraction
        value = item.leaveType?.name || 
                (typeof item.leaveType === 'string' ? item.leaveType : null) || 
                item.leaveTypeName;
      } else if (key.includes('.')) {
        // Handle other nested properties
        const keys = key.split('.');
        value = keys.reduce((obj, k) => obj?.[k], item);
      } else {
        // Handle direct properties
        value = item[key];
      }
      
      if (value && typeof value === 'string') {
        values.push(value);
      }
    });
    
    const uniqueValues = [...new Set(values)];
    console.log('Unique values for', key, ':', uniqueValues);
    return uniqueValues;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <svg className="w-10 h-10 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Manager Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome back, <span className="font-semibold text-indigo-600">{userName}</span></p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-lg border border-white/20">
          <nav className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'request'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Request Leave
            </button>
            <button
              onClick={() => setActiveTab('myhistory')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'myhistory'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              My Leave History
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Employees
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'team'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Leave Calendar
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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

              {/* Filters Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search by name, email..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Departments</option>
                      {getUniqueValues([...teamMembers, ...pendingRequests], 'department.name').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Manager Approved">Manager Approved</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                    <select
                      value={filters.leaveType}
                      onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {getUniqueValues(pendingRequests, 'leaveType.name').map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {getFilteredPendingRequests().length} of {pendingRequests.length} requests, 
                    {getFilteredTeamMembers().length} of {teamMembers.length} team members
                  </div>
                  <button
                    onClick={clearFilters}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Team Members Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">My Team</h2>
                
                {getFilteredTeamMembers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {teamMembers.length === 0 ? 'No team members found.' : 'No team members match the current filters.'}
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
                        {getFilteredTeamMembers().map((employee) => (
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
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  Total: {employee.totalLeaveBalance} days
                                </div>
                                <div className="text-gray-500 text-xs">
                                  Annual: {employee.annualLeaveBalance} | 
                                  Sick: {employee.sickLeaveBalance} | 
                                  Personal: {employee.personalLeaveBalance}
                                </div>
                              </div>
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
                
                {getFilteredPendingRequests().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {pendingRequests.length === 0 ? 'No pending leave requests.' : 'No pending requests match the current filters.'}
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
                        {getFilteredPendingRequests().map((request) => {
                          // Determine if current user can approve this request
                          const canApprove = request.approvals?.some(a => a.level === 'manager' && a.status === 'Pending');
                          
                          return (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {request.employee?.name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {safeRender(request.leaveType?.name || request.leaveType)}
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
                              {safeRender(request.leaveType?.name || request.leaveType)}
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

          {/* My Leave History Tab */}
          {activeTab === 'myhistory' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">My Leave History</h2>
              <LeaveHistory />
            </div>
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
                          department: employee.department?.name || employee.department || 'General',
                          annualLeaveBalance: employee.annualLeaveBalance || 20,
                          sickLeaveBalance: employee.sickLeaveBalance || 10,
                          personalLeaveBalance: employee.personalLeaveBalance || 5,
                          totalLeaveBalance: (employee.annualLeaveBalance || 20) + (employee.sickLeaveBalance || 10) + (employee.personalLeaveBalance || 5)
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
    </div>
  );
};

export default ManagerDashboard;