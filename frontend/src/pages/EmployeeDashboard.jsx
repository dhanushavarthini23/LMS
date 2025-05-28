import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveForm from '../components/LeaveForm';
import LeaveHistory from '../components/LeaveHistory';
import LeaveCalendar from '../components/LeaveCalendar';
import LeavePolicies from '../components/LeavePolicies';
import DashboardCharts from '../components/DashboardCharts';
import LeaveForecasting from '../components/LeaveForecasting';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { getDashboardData, getLeaveBalance } from '../api/api';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { authData, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');

  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardResponse = await getDashboardData();
      const rawData = dashboardResponse.data;
      
      // Process leave requests to create leave type distribution
      const leaveRequests = rawData.leaveRequests || [];
      
      // Count leave types
      const leaveTypeCount = {
        annual: 0,
        sick: 0,
        personal: 0,
        other: 0
      };
      
      leaveRequests.forEach(leave => {
        const type = leave.leaveType?.toLowerCase() || '';
        if (type.includes('annual') || type.includes('vacation')) {
          leaveTypeCount.annual += 1;
        } else if (type.includes('sick')) {
          leaveTypeCount.sick += 1;
        } else if (type.includes('personal')) {
          leaveTypeCount.personal += 1;
        } else {
          leaveTypeCount.other += 1;
        }
      });
      
      // Create monthly trends data
      const monthlyData = Array(12).fill(0);
      leaveRequests.forEach(leave => {
        if (leave.startDate) {
          const month = new Date(leave.startDate).getMonth();
          monthlyData[month] += 1;
        }
      });
      
      // Create enhanced dashboard data
      const enhancedData = {
        ...rawData,
        leaveTypeDistribution: leaveTypeCount,
        monthlyTrends: monthlyData
      };
      
      setDashboardData(enhancedData);
      
      // Fetch leave balance
      const balanceResponse = await getLeaveBalance();
      console.log('Leave balance response:', balanceResponse.data);
      setLeaveBalance(balanceResponse.data.leaveBalance);
      
      setError('');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authData?.token) {
      // Get user name from token
      try {
        const decoded = jwtDecode(authData.token);
        console.log('Decoded token:', decoded); 
        setUserName(decoded.name || decoded.username || 'Employee');
      } catch (error) {
        console.error('Error decoding token:', error);
        setUserName('Employee');
      }
      
      fetchDashboardData();
    }
  }, [authData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeaveRequestSuccess = () => {
    setShowLeaveForm(false);
    
    fetchDashboardData();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employee Dashboard</h1>
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
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leave History
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'policies'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leave Policies
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('forecasting')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'forecasting'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leave Forecasting
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
                {/* Leave Balance Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Leave Balance</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Leave:</span>
                      <span className="font-bold">{leaveBalance?.annual || 20} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sick Leave:</span>
                      <span className="font-bold">{leaveBalance?.sick || 10} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Personal Leave:</span>
                      <span className="font-bold">{leaveBalance?.personal || 5} days</span>
                    </div>
                  </div>
                </div>

                {/* Pending Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
                  {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Pending').length > 0 ? (
                    <div className="text-yellow-500 font-bold text-2xl">
                      {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Pending').length}
                    </div>
                  ) : (
                    <div className="text-gray-500">No pending requests</div>
                  )}
                </div>

                {/* Approved Requests Card */}
                <div className="bg-white p-4 rounded shadow">
                  <h2 className="text-lg font-semibold mb-2">Approved Requests</h2>
                  {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Approved').length > 0 ? (
                    <div className="text-green-500 font-bold text-2xl">
                      {(dashboardData?.leaveRequests || []).filter(req => req.status === 'Approved').length}
                    </div>
                  ) : (
                    <div className="text-gray-500">No approved requests</div>
                  )}
                </div>
              </div>

              {/* Leave Request Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowLeaveForm(!showLeaveForm)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {showLeaveForm ? 'Cancel Request' : 'New Leave Request'}
                </button>
              </div>

              {/* Leave Request Form */}
              {showLeaveForm && (
                <div className="mb-6">
                  <LeaveForm onSuccess={handleLeaveRequestSuccess} />
                </div>
              )}

              {/* Recent Leave Requests */}
              <div className="mt-8 bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Leave Requests</h2>
                <LeaveHistory limit={5} />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View All Leave History
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && <LeaveCalendar />}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Leave History</h2>
              <LeaveHistory />
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && <LeavePolicies />}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && <DashboardCharts dashboardData={dashboardData} />}
          
          {/* Forecasting Tab */}
          {activeTab === 'forecasting' && <LeaveForecasting leaveBalance={leaveBalance} />}
        </>
      )}
    </div>
  );
};

export default EmployeeDashboard;
